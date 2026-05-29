import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  alunos,
  autopercepcoesCompetencias,
  competencias,
  discResultados,
  processoAgendaSlots,
  processoAgendasGrupo,
  processoCandidatos,
  processoClienteUsuarios,
  processoEntrevistas,
  processoLogs,
  processoRegioes,
  processoResultados,
  processosSeletivos,
  processoVagas,
  programs,
  users,
} from "../../drizzle/schema";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { buildPsConfirmacaoAgendamentoEmail, buildPsReagendamentoEmail, sendEmail } from "../emailService";

const adminRoles = new Set(["admin", "admin2"]);

const isCkmAdmin = (role?: string | null) => adminRoles.has(role ?? "");

const requireDatabase = async () => {
  const database = await getDb();
  if (!database) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  }
  return database;
};

const requireCkmAdmin = (role?: string | null) => {
  if (!isCkmAdmin(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores CKM" });
  }
};

type DbClient = Awaited<ReturnType<typeof requireDatabase>>;

async function hasProcessAccess(database: DbClient, user: { id: number; role?: string | null; consultorId?: number | null }, processoId: number) {
  if (isCkmAdmin(user.role)) return true;

  // Mentora: acesso se o processo tem mentorId vinculado ao consultorId do usuário
  if (user.consultorId) {
    const [processo] = await database
      .select({ mentorId: processosSeletivos.mentorId })
      .from(processosSeletivos)
      .where(eq(processosSeletivos.id, processoId))
      .limit(1);
    if (processo?.mentorId === user.consultorId) return true;
  }

  const [cliente] = await database
    .select({ id: processoClienteUsuarios.id })
    .from(processoClienteUsuarios)
    .where(and(eq(processoClienteUsuarios.processoId, processoId), eq(processoClienteUsuarios.userId, user.id)))
    .limit(1);
  if (cliente) return true;

  const [candidato] = await database
    .select({ id: processoCandidatos.id })
    .from(processoCandidatos)
    .where(and(eq(processoCandidatos.processoId, processoId), eq(processoCandidatos.userId, user.id)))
    .limit(1);

  return Boolean(candidato);
}

async function ensureProcessAccess(database: DbClient, user: { id: number; role?: string | null; consultorId?: number | null }, processoId: number) {
  const allowed = await hasProcessAccess(database, user, processoId);
  if (!allowed) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Voce nao tem acesso a este processo seletivo" });
  }
}

async function writeLog(
  database: DbClient,
  data: { processoId: number; candidatoId?: number | null; userId?: number | null; acao: string; detalhe?: string; metadata?: unknown },
) {
  await database.insert(processoLogs).values({
    processoId: data.processoId,
    candidatoId: data.candidatoId ?? null,
    userId: data.userId ?? null,
    acao: data.acao,
    detalhe: data.detalhe ?? null,
    metadata: data.metadata ?? null,
  });
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes: number) {
  const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

export function generateSlots(input: {
  dataAgenda: string;
  inicio: string;
  fim: string;
  intervaloInicio?: string | null;
  intervaloFim?: string | null;
  duracaoMinutos: number;
}) {
  const slots: Array<{ dataAgenda: string; inicio: string; fim: string }> = [];
  const start = toMinutes(input.inicio);
  const end = toMinutes(input.fim);
  const breakStart = input.intervaloInicio ? toMinutes(input.intervaloInicio) : null;
  const breakEnd = input.intervaloFim ? toMinutes(input.intervaloFim) : null;

  for (let cursor = start; cursor + input.duracaoMinutos <= end; cursor += input.duracaoMinutos) {
    const slotEnd = cursor + input.duracaoMinutos;
    const overlapsBreak = breakStart !== null && breakEnd !== null && cursor < breakEnd && slotEnd > breakStart;
    if (!overlapsBreak) {
      slots.push({ dataAgenda: input.dataAgenda, inicio: toTime(cursor), fim: toTime(slotEnd) });
    }
  }

  return slots;
}

async function allocateCandidate(database: DbClient, candidatoId: number, actorUserId: number | null) {
  const [candidate] = await database
    .select()
    .from(processoCandidatos)
    .where(eq(processoCandidatos.id, candidatoId))
    .limit(1);

  if (!candidate) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Candidato nao encontrado" });
  }

  // Quando regiaoId é null (processo sem regiões), busca qualquer slot disponível do processo
  const regiaoFilter = candidate.regiaoId != null
    ? eq(processoAgendaSlots.regiaoId, candidate.regiaoId)
    : isNull(processoAgendaSlots.regiaoId);

  const slotWhere = candidate.vagaId
    ? and(
        eq(processoAgendaSlots.processoId, candidate.processoId),
        regiaoFilter,
        or(isNull(processoAgendaSlots.vagaId), eq(processoAgendaSlots.vagaId, candidate.vagaId)),
        eq(processoAgendaSlots.status, "disponivel"),
      )
    : and(
        eq(processoAgendaSlots.processoId, candidate.processoId),
        regiaoFilter,
        eq(processoAgendaSlots.status, "disponivel"),
      );

  const [slot] = await database
    .select()
    .from(processoAgendaSlots)
    .where(slotWhere)
    .orderBy(asc(processoAgendaSlots.dataAgenda), asc(processoAgendaSlots.inicio))
    .limit(1);

  if (!slot) {
    await database
      .update(processoCandidatos)
      .set({ statusEntrevista: "aguardando_agenda" })
      .where(eq(processoCandidatos.id, candidatoId));
    await writeLog(database, {
      processoId: candidate.processoId,
      candidatoId,
      userId: actorUserId,
      acao: "alocacao_sem_slot",
      detalhe: `Candidato ${candidate.nome} ficou aguardando agenda na regiao ${candidate.regiaoId}.`,
    });
    return { status: "aguardando_agenda" as const, slot: null };
  }

  await database
    .update(processoAgendaSlots)
    .set({ candidatoId, status: "reservado" })
    .where(and(eq(processoAgendaSlots.id, slot.id), eq(processoAgendaSlots.status, "disponivel")));

  await database
    .update(processoCandidatos)
    .set({ statusEntrevista: "agendada" })
    .where(eq(processoCandidatos.id, candidatoId));

  await database.insert(processoEntrevistas).values({
    processoId: candidate.processoId,
    candidatoId,
    agendaSlotId: slot.id,
    linkEntrevista: slot.linkEntrevista,
    status: "agendada",
  });

  await writeLog(database, {
    processoId: candidate.processoId,
    candidatoId,
    userId: actorUserId,
    acao: "alocacao_automatica",
    detalhe: `Candidato ${candidate.nome} alocado automaticamente em ${slot.dataAgenda} ${slot.inicio}.`,
    metadata: { slotId: slot.id, regiaoId: slot.regiaoId, vagaId: slot.vagaId },
  });

  return { status: "agendada" as const, slot };
}

const processoInput = z.object({
  nome: z.string().min(1),
  clienteNome: z.string().min(1),
  clienteEmail: z.string().email().optional().or(z.literal("")),
  descricao: z.string().optional(),
  status: z.enum(["rascunho", "ativo", "pausado", "encerrado"]).default("rascunho"),
  dataInicio: z.string().optional().nullable(),
  dataFim: z.string().optional().nullable(),
  mentorId: z.number().optional().nullable(),
});

const processoIdInput = z.object({ processoId: z.number() });

export const processosSeletivosRouter = router({
  listarProcessos: protectedProcedure.query(async ({ ctx }) => {
    const database = await requireDatabase();

    if (isCkmAdmin(ctx.user.role)) {
      return database.select().from(processosSeletivos).orderBy(desc(processosSeletivos.createdAt));
    }

    // Mentora: ver processos onde ela é a mentora responsável
    // Gerente NÃO entra neste bloco — usa o filtro por empresa abaixo
    const userConsultorId = (ctx.user as any).consultorId as number | null;
    const userConsultorRole = (ctx.user as any).consultorRole as string | null;
    const userManagedProgramId = (ctx.user as any).managedProgramId as number | null;
    if (userConsultorId && userConsultorRole !== 'gerente') {
      return database
        .select()
        .from(processosSeletivos)
        .where(eq(processosSeletivos.mentorId, userConsultorId))
        .orderBy(desc(processosSeletivos.createdAt));
    }

    // Gerente: filtrar por empresa (clienteNome = nome do programa gerenciado)
    if (userConsultorRole === 'gerente' && userManagedProgramId) {
      const [prog] = await database
        .select({ name: programs.name })
        .from(programs)
        .where(eq(programs.id, userManagedProgramId))
        .limit(1);
      if (prog?.name) {
        return database
          .select()
          .from(processosSeletivos)
          .where(eq(processosSeletivos.clienteNome, prog.name))
          .orderBy(desc(processosSeletivos.createdAt));
      }
      return [];
    }

    const clienteLinks = await database
      .select({ processoId: processoClienteUsuarios.processoId })
      .from(processoClienteUsuarios)
      .where(eq(processoClienteUsuarios.userId, ctx.user.id));
    const candidaturas = await database
      .select({ processoId: processoCandidatos.processoId })
      .from(processoCandidatos)
      .where(eq(processoCandidatos.userId, ctx.user.id));
    const ids = Array.from(new Set([...clienteLinks, ...candidaturas].map((item) => item.processoId)));

    if (ids.length === 0) return [];

    return database
      .select()
      .from(processosSeletivos)
      .where(inArray(processosSeletivos.id, ids))
      .orderBy(desc(processosSeletivos.createdAt));
  }),

  resumo: protectedProcedure.input(processoIdInput).query(async ({ ctx, input }) => {
    const database = await requireDatabase();
    await ensureProcessAccess(database, ctx.user, input.processoId);

    const [candidatos] = await database
      .select({ total: sql<number>`count(*)` })
      .from(processoCandidatos)
      .where(eq(processoCandidatos.processoId, input.processoId));
    const [testesConcluidos] = await database
      .select({ total: sql<number>`count(*)` })
      .from(processoCandidatos)
      .where(and(eq(processoCandidatos.processoId, input.processoId), eq(processoCandidatos.statusTeste, "concluido")));
    const [entrevistasAgendadas] = await database
      .select({ total: sql<number>`count(*)` })
      .from(processoCandidatos)
      .where(and(eq(processoCandidatos.processoId, input.processoId), eq(processoCandidatos.statusEntrevista, "agendada")));
    const [aprovados] = await database
      .select({ total: sql<number>`count(*)` })
      .from(processoCandidatos)
      .where(and(eq(processoCandidatos.processoId, input.processoId), eq(processoCandidatos.statusResultado, "aprovado")));
    const [slotsLivres] = await database
      .select({ total: sql<number>`count(*)` })
      .from(processoAgendaSlots)
      .where(and(eq(processoAgendaSlots.processoId, input.processoId), eq(processoAgendaSlots.status, "disponivel")));

    return {
      candidatos: Number(candidatos?.total ?? 0),
      testesConcluidos: Number(testesConcluidos?.total ?? 0),
      entrevistasAgendadas: Number(entrevistasAgendadas?.total ?? 0),
      aprovados: Number(aprovados?.total ?? 0),
      slotsLivres: Number(slotsLivres?.total ?? 0),
    };
  }),

  obterProcesso: protectedProcedure.input(processoIdInput).query(async ({ ctx, input }) => {
    const database = await requireDatabase();
    await ensureProcessAccess(database, ctx.user, input.processoId);
    const [processo] = await database.select().from(processosSeletivos).where(eq(processosSeletivos.id, input.processoId)).limit(1);
    if (!processo) throw new TRPCError({ code: "NOT_FOUND", message: "Processo nao encontrado" });
    return processo;
  }),

  criarProcesso: protectedProcedure.input(processoInput).mutation(async ({ ctx, input }) => {
    requireCkmAdmin(ctx.user.role);
    const database = await requireDatabase();
    const result = await database.insert(processosSeletivos).values({
      nome: input.nome,
      clienteNome: input.clienteNome,
      clienteEmail: input.clienteEmail || null,
      descricao: input.descricao || null,
      status: input.status,
      dataInicio: input.dataInicio || null,
      dataFim: input.dataFim || null,
      mentorId: input.mentorId ?? null,
      criadoPor: ctx.user.id,
    });
    const id = Number(result[0].insertId);
    await writeLog(database, { processoId: id, userId: ctx.user.id, acao: "processo_criado", detalhe: input.nome });
    return { id, success: true };
  }),

  atualizarProcesso: protectedProcedure
    .input(processoIdInput.extend(processoInput.partial().shape))
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      const { processoId, ...data } = input;
      await database.update(processosSeletivos).set({
        ...(data.nome !== undefined && { nome: data.nome }),
        ...(data.clienteNome !== undefined && { clienteNome: data.clienteNome }),
        ...(data.clienteEmail !== undefined && { clienteEmail: data.clienteEmail || null }),
        ...(data.descricao !== undefined && { descricao: data.descricao || null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.dataInicio !== undefined && { dataInicio: data.dataInicio || null }),
        ...(data.dataFim !== undefined && { dataFim: data.dataFim || null }),
        ...(data.mentorId !== undefined && { mentorId: data.mentorId ?? null }),
      }).where(eq(processosSeletivos.id, processoId));
            await writeLog(database, { processoId, userId: ctx.user.id, acao: "processo_atualizado" });
      return { success: true };
    }),

  excluirProcesso: protectedProcedure
    .input(processoIdInput)
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      const { processoId } = input;
      // Excluir dados dependentes antes de excluir o processo
      await database.delete(processoRegioes).where(eq(processoRegioes.processoId, processoId));
      await database.delete(processoVagas).where(eq(processoVagas.processoId, processoId));
      await database.delete(processoCandidatos).where(eq(processoCandidatos.processoId, processoId));
      await database.delete(processoClienteUsuarios).where(eq(processoClienteUsuarios.processoId, processoId));
      await database.delete(processosSeletivos).where(eq(processosSeletivos.id, processoId));
      return { success: true };
    }),

  vincularClienteUsuario: protectedProcedure
    .input(processoIdInput.extend({ userId: z.number(), permissao: z.enum(["leitura", "comentario"]).default("leitura") }))
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      await database.insert(processoClienteUsuarios).values({
        processoId: input.processoId,
        userId: input.userId,
        permissao: input.permissao,
      });
      await writeLog(database, {
        processoId: input.processoId,
        userId: ctx.user.id,
        acao: "cliente_vinculado",
        detalhe: `Usuario ${input.userId} vinculado como cliente.`,
      });
      return { success: true };
    }),

  listarVagas: protectedProcedure.input(processoIdInput).query(async ({ ctx, input }) => {
    const database = await requireDatabase();
    await ensureProcessAccess(database, ctx.user, input.processoId);
    return database.select().from(processoVagas).where(eq(processoVagas.processoId, input.processoId));
  }),

  criarVaga: protectedProcedure
    .input(processoIdInput.extend({ titulo: z.string().min(1), codigo: z.string().optional(), descricao: z.string().optional(), quantidadeVagas: z.number().min(1).default(1) }))
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      const result = await database.insert(processoVagas).values({
        processoId: input.processoId,
        titulo: input.titulo,
        codigo: input.codigo || null,
        descricao: input.descricao || null,
        quantidadeVagas: input.quantidadeVagas,
      });
      await writeLog(database, { processoId: input.processoId, userId: ctx.user.id, acao: "vaga_criada", detalhe: input.titulo });
      return { id: Number(result[0].insertId), success: true };
    }),

  listarRegioes: protectedProcedure.input(processoIdInput).query(async ({ ctx, input }) => {
    const database = await requireDatabase();
    await ensureProcessAccess(database, ctx.user, input.processoId);
    return database.select().from(processoRegioes).where(and(eq(processoRegioes.processoId, input.processoId), ne(processoRegioes.status, "encerrada")));
  }),

  criarRegiao: protectedProcedure
    .input(processoIdInput.extend({ nome: z.string().min(1), codigo: z.string().optional(), vagasPrevistas: z.number().min(0).default(0) }))
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      const result = await database.insert(processoRegioes).values({
        processoId: input.processoId,
        nome: input.nome,
        codigo: input.codigo || null,
        vagasPrevistas: input.vagasPrevistas,
      });
      await writeLog(database, { processoId: input.processoId, userId: ctx.user.id, acao: "regiao_criada", detalhe: input.nome });
      return { id: Number(result[0].insertId), success: true };
    }),

  inativarRegiao: protectedProcedure
    .input(z.object({ regiaoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      const [regiao] = await database.select({ id: processoRegioes.id, processoId: processoRegioes.processoId, nome: processoRegioes.nome })
        .from(processoRegioes).where(eq(processoRegioes.id, input.regiaoId)).limit(1);
      if (!regiao) throw new TRPCError({ code: "NOT_FOUND", message: "Regiao nao encontrada" });
      await database.update(processoRegioes).set({ status: "encerrada" }).where(eq(processoRegioes.id, input.regiaoId));
      await writeLog(database, { processoId: regiao.processoId, userId: ctx.user.id, acao: "regiao_inativada", detalhe: regiao.nome });
      return { success: true };
    }),

  inativarCandidato: protectedProcedure
    .input(z.object({ candidatoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      const [candidato] = await database.select({ id: processoCandidatos.id, processoId: processoCandidatos.processoId, nome: processoCandidatos.nome })
        .from(processoCandidatos).where(eq(processoCandidatos.id, input.candidatoId)).limit(1);
      if (!candidato) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato nao encontrado" });
      await database.update(processoCandidatos).set({ statusCadastro: "inativo" }).where(eq(processoCandidatos.id, input.candidatoId));
      await writeLog(database, { processoId: candidato.processoId, userId: ctx.user.id, acao: "candidato_inativado", detalhe: candidato.nome });
      return { success: true };
    }),

  listarCandidatos: protectedProcedure.input(processoIdInput).query(async ({ ctx, input }) => {
    const database = await requireDatabase();
    await ensureProcessAccess(database, ctx.user, input.processoId);
    const rows = await database.select().from(processoCandidatos).where(and(eq(processoCandidatos.processoId, input.processoId), ne(processoCandidatos.statusCadastro, "inativo"))).orderBy(asc(processoCandidatos.nome));
    if (isCkmAdmin(ctx.user.role)) return rows;
    // Mentora: ver todos os candidatos do processo
    const userConsultorId = (ctx.user as any).consultorId as number | null;
    if (userConsultorId) {
      const [processo] = await database.select({ mentorId: processosSeletivos.mentorId }).from(processosSeletivos).where(eq(processosSeletivos.id, input.processoId)).limit(1);
      if (processo?.mentorId === userConsultorId) return rows;
    }
    const isCliente = await database
      .select({ id: processoClienteUsuarios.id })
      .from(processoClienteUsuarios)
      .where(and(eq(processoClienteUsuarios.processoId, input.processoId), eq(processoClienteUsuarios.userId, ctx.user.id)))
      .limit(1);
    if (isCliente.length > 0) return rows;
    return rows.filter((candidate) => candidate.userId === ctx.user.id);
  }),

  criarCandidato: protectedProcedure
    .input(
      processoIdInput.extend({
        nome: z.string().min(1),
        email: z.string().email(),
        telefone: z.string().optional(),
        cpf: z.string().optional(),
        vagaId: z.number().optional().nullable(),
        regiaoId: z.number().optional().nullable(),
        userId: z.number().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      const result = await database.insert(processoCandidatos).values({
        processoId: input.processoId,
        nome: input.nome,
        email: input.email,
        telefone: input.telefone || null,
        cpf: input.cpf || null,
        vagaId: input.vagaId ?? null,
        regiaoId: input.regiaoId ?? null,
        userId: input.userId ?? null,
        statusCadastro: "importado",
      });
      const id = Number(result[0].insertId);
      await writeLog(database, { processoId: input.processoId, candidatoId: id, userId: ctx.user.id, acao: "candidato_criado", detalhe: input.nome });
      return { id, success: true };
    }),

  importarCandidatos: protectedProcedure
    .input(
      processoIdInput.extend({
        candidatos: z.array(
          z.object({
            nome: z.string().min(1),
            email: z.string().email(),
            telefone: z.string().optional(),
            cpf: z.string().optional(),
            vagaId: z.number().optional().nullable(),
            regiaoId: z.number().optional().nullable(),
          }),
        ).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      await database.insert(processoCandidatos).values(
        input.candidatos.map((candidate) => ({
          processoId: input.processoId,
          nome: candidate.nome,
          email: candidate.email,
          telefone: candidate.telefone || null,
          cpf: candidate.cpf || null,
          vagaId: candidate.vagaId ?? null,
          regiaoId: candidate.regiaoId ?? null,
          statusCadastro: "importado" as const,
        })),
      );
      await writeLog(database, {
        processoId: input.processoId,
        userId: ctx.user.id,
        acao: "candidatos_importados",
        detalhe: `${input.candidatos.length} candidato(s) importado(s).`,
      });
      return { inserted: input.candidatos.length, success: true };
    }),

  criarAgendaGrupo: protectedProcedure
    .input(
      processoIdInput.extend({
        regiaoId: z.number().optional().nullable(),
        vagaId: z.number().optional().nullable(),
        nomeGrupo: z.string().min(1),
        dataAgenda: z.string().min(10),
        inicio: z.string().min(5),
        fim: z.string().min(5),
        intervaloInicio: z.string().optional().nullable(),
        intervaloFim: z.string().optional().nullable(),
        duracaoMinutos: z.number().min(10).max(240).default(30),
        linkPadrao: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      const result = await database.insert(processoAgendasGrupo).values({
        processoId: input.processoId,
        regiaoId: input.regiaoId ?? null,
        vagaId: input.vagaId ?? null,
        nomeGrupo: input.nomeGrupo,
        dataAgenda: input.dataAgenda,
        inicio: input.inicio,
        fim: input.fim,
        intervaloInicio: input.intervaloInicio || null,
        intervaloFim: input.intervaloFim || null,
        duracaoMinutos: input.duracaoMinutos,
        linkPadrao: input.linkPadrao || null,
        criadoPor: ctx.user.id,
      });
      const agendaGrupoId = Number(result[0].insertId);
      const slots = generateSlots(input).map((slot) => ({
        processoId: input.processoId,
        agendaGrupoId,
        regiaoId: input.regiaoId ?? null,
        vagaId: input.vagaId ?? null,
        dataAgenda: slot.dataAgenda,
        inicio: slot.inicio,
        fim: slot.fim,
        linkEntrevista: input.linkPadrao || null,
        status: "disponivel" as const,
      }));
      if (slots.length > 0) {
        await database.insert(processoAgendaSlots).values(slots);
      }
      await writeLog(database, { processoId: input.processoId, userId: ctx.user.id, acao: "agenda_criada", detalhe: `${input.nomeGrupo}: ${slots.length} slots` });
      return { id: agendaGrupoId, slotsCriados: slots.length, success: true };
    }),

  criarSlotsManual: protectedProcedure
    .input(
      processoIdInput.extend({
        nomeGrupo: z.string().min(1),
        linkPadrao: z.string().optional().nullable(),
        slots: z.array(
          z.object({
            dataAgenda: z.string().min(10),
            inicio: z.string().min(5),
            fim: z.string().min(5),
            link: z.string().optional().nullable(),
          }),
        ).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      // Cria o grupo de agenda com data do primeiro slot
      const primeiraData = input.slots[0].dataAgenda;
      const primeiroInicio = input.slots[0].inicio;
      const ultimoFim = input.slots[input.slots.length - 1].fim;
      const result = await database.insert(processoAgendasGrupo).values({
        processoId: input.processoId,
        regiaoId: null,
        vagaId: null,
        nomeGrupo: input.nomeGrupo,
        dataAgenda: primeiraData,
        inicio: primeiroInicio,
        fim: ultimoFim,
        intervaloInicio: null,
        intervaloFim: null,
        duracaoMinutos: 30,
        linkPadrao: input.linkPadrao || null,
        criadoPor: ctx.user.id,
      });
      const agendaGrupoId = Number(result[0].insertId);
      const slotRows = input.slots.map((slot) => ({
        processoId: input.processoId,
        agendaGrupoId,
        regiaoId: null as number | null,
        vagaId: null as number | null,
        dataAgenda: slot.dataAgenda,
        inicio: slot.inicio,
        fim: slot.fim,
        linkEntrevista: slot.link || input.linkPadrao || null,
        status: "disponivel" as const,
      }));
      await database.insert(processoAgendaSlots).values(slotRows);
      await writeLog(database, {
        processoId: input.processoId,
        userId: ctx.user.id,
        acao: "agenda_criada",
        detalhe: `${input.nomeGrupo} (manual): ${slotRows.length} slots`,
      });
      return { id: agendaGrupoId, slotsCriados: slotRows.length, success: true };
    }),

  excluirSlot: protectedProcedure
    .input(z.object({ slotId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      const [slot] = await database
        .select()
        .from(processoAgendaSlots)
        .where(eq(processoAgendaSlots.id, input.slotId))
        .limit(1);
      if (!slot) throw new TRPCError({ code: "NOT_FOUND", message: "Slot nao encontrado" });
      if (slot.status !== "disponivel") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nao e possivel excluir um slot ja reservado ou com entrevista agendada" });
      }
      await database.delete(processoAgendaSlots).where(eq(processoAgendaSlots.id, input.slotId));
      await writeLog(database, {
        processoId: slot.processoId,
        userId: ctx.user.id,
        acao: "slot_excluido",
        detalhe: `Slot ${slot.dataAgenda} ${slot.inicio}-${slot.fim} excluido`,
      });
      return { success: true };
    }),

  listarAgendasGrupo: protectedProcedure.input(processoIdInput).query(async ({ ctx, input }) => {
    const database = await requireDatabase();
    await ensureProcessAccess(database, ctx.user, input.processoId);
    return database.select().from(processoAgendasGrupo).where(eq(processoAgendasGrupo.processoId, input.processoId)).orderBy(asc(processoAgendasGrupo.dataAgenda));
  }),

  listarSlotsAgenda: protectedProcedure.input(processoIdInput.extend({ agendaGrupoId: z.number().optional() })).query(async ({ ctx, input }) => {
    const database = await requireDatabase();
    await ensureProcessAccess(database, ctx.user, input.processoId);
    const where = input.agendaGrupoId
      ? and(eq(processoAgendaSlots.processoId, input.processoId), eq(processoAgendaSlots.agendaGrupoId, input.agendaGrupoId))
      : eq(processoAgendaSlots.processoId, input.processoId);
    return database.select().from(processoAgendaSlots).where(where).orderBy(asc(processoAgendaSlots.dataAgenda), asc(processoAgendaSlots.inicio));
  }),

  listarLogs: protectedProcedure.input(processoIdInput).query(async ({ ctx, input }) => {
    const database = await requireDatabase();
    await ensureProcessAccess(database, ctx.user, input.processoId);
    return database
      .select()
      .from(processoLogs)
      .where(eq(processoLogs.processoId, input.processoId))
      .orderBy(desc(processoLogs.createdAt));
  }),

  registrarConclusaoTeste: protectedProcedure.input(z.object({ candidatoId: z.number() })).mutation(async ({ ctx, input }) => {
    const database = await requireDatabase();
    const [candidate] = await database.select().from(processoCandidatos).where(eq(processoCandidatos.id, input.candidatoId)).limit(1);
    if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato nao encontrado" });
    await ensureProcessAccess(database, ctx.user, candidate.processoId);
    if (!isCkmAdmin(ctx.user.role) && candidate.userId !== ctx.user.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Voce so pode concluir o proprio teste" });
    }
    await database
      .update(processoCandidatos)
      .set({ statusTeste: "concluido", testeConcluidoEm: new Date() })
      .where(eq(processoCandidatos.id, input.candidatoId));
    await writeLog(database, { processoId: candidate.processoId, candidatoId: input.candidatoId, userId: ctx.user.id, acao: "teste_concluido" });
    const allocation = await allocateCandidate(database, input.candidatoId, ctx.user.id);
    return { success: true, allocation };
  }),

  alocarCandidatoAutomaticamente: protectedProcedure.input(z.object({ candidatoId: z.number() })).mutation(async ({ ctx, input }) => {
    requireCkmAdmin(ctx.user.role);
    const database = await requireDatabase();
    const allocation = await allocateCandidate(database, input.candidatoId, ctx.user.id);
    return { success: true, allocation };
  }),

  registrarResultado: protectedProcedure
    .input(z.object({ candidatoId: z.number(), resultado: z.enum(["pendente", "aprovado", "reprovado", "em_analise", "desistente"]), notaEntrevista: z.number().optional().nullable(), parecer: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const [candidate] = await database.select().from(processoCandidatos).where(eq(processoCandidatos.id, input.candidatoId)).limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato nao encontrado" });
      // Admin CKM ou mentora do processo podem registrar resultado
      const userConsultorId = (ctx.user as any).consultorId as number | null;
      if (!isCkmAdmin(ctx.user.role)) {
        if (!userConsultorId) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito" });
        const [processo] = await database.select({ mentorId: processosSeletivos.mentorId }).from(processosSeletivos).where(eq(processosSeletivos.id, candidate.processoId)).limit(1);
        if (processo?.mentorId !== userConsultorId) throw new TRPCError({ code: "FORBIDDEN", message: "Voce nao e a mentora deste processo" });
      }
      const [existingResult] = await database
        .select({ id: processoResultados.id })
        .from(processoResultados)
        .where(eq(processoResultados.candidatoId, input.candidatoId))
        .limit(1);
      const resultData = {
        resultado: input.resultado,
        notaEntrevista: input.notaEntrevista ?? null,
        parecer: input.parecer || null,
        registradoPor: ctx.user.id,
      };
      if (existingResult) {
        await database.update(processoResultados).set(resultData).where(eq(processoResultados.id, existingResult.id));
      } else {
        await database.insert(processoResultados).values({
          processoId: candidate.processoId,
          candidatoId: input.candidatoId,
          ...resultData,
        });
      }
      await database.update(processoCandidatos).set({ statusResultado: input.resultado }).where(eq(processoCandidatos.id, input.candidatoId));
      await writeLog(database, { processoId: candidate.processoId, candidatoId: input.candidatoId, userId: ctx.user.id, acao: "resultado_registrado", detalhe: input.resultado });
      return { success: true };
    }),

  // Rota pública: lista processos ativos para o formulário de auto-registro
  listProcessosAtivos: publicProcedure.query(async () => {
    const database = await requireDatabase();
    const rows = await database
      .select({ id: processosSeletivos.id, nome: processosSeletivos.nome, clienteNome: processosSeletivos.clienteNome })
      .from(processosSeletivos)
      .where(eq(processosSeletivos.status, "ativo"))
      .orderBy(asc(processosSeletivos.nome));
    return rows;
  }),

  // Rota pública: retorna slots disponíveis de um processo para o candidato agendar
  listarSlotsDisponiveis: publicProcedure
    .input(z.object({ processoId: z.number() }))
    .query(async ({ input }) => {
      const database = await requireDatabase();
      const slots = await database
        .select()
        .from(processoAgendaSlots)
        .where(and(eq(processoAgendaSlots.processoId, input.processoId), eq(processoAgendaSlots.status, "disponivel")))
        .orderBy(asc(processoAgendaSlots.dataAgenda), asc(processoAgendaSlots.inicio));
      return slots;
    }),

  // Candidato agendando seu próprio slot após concluir os testes
  candidatoAgendar: protectedProcedure
    .input(z.object({ slotId: z.number(), processoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await requireDatabase();
      // Verificar se o candidato pertence ao processo
      const [candidate] = await database
        .select()
        .from(processoCandidatos)
        .where(and(eq(processoCandidatos.processoId, input.processoId), eq(processoCandidatos.userId, ctx.user.id)))
        .limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato nao encontrado neste processo" });
      // Verificar se testes foram concluídos: statusTeste=concluido OU candidato tem resultado DISC no banco
      if (candidate.statusTeste !== "concluido") {
        // Verificar se há resultado DISC para o aluno (fonte de verdade alternativa)
        const alunoId = (ctx.user as any).alunoId as number | null;
        let discOk = false;
        if (alunoId) {
          const [discRow] = await database
            .select({ id: discResultados.id })
            .from(discResultados)
            .where(eq(discResultados.alunoId, alunoId))
            .limit(1);
          discOk = !!discRow;
        }
        if (!discOk) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Voce precisa concluir os testes antes de agendar" });
        }
        // Testes concluídos mas statusTeste desatualizado — corrigir automaticamente
        await database
          .update(processoCandidatos)
          .set({ statusTeste: "concluido", testeConcluidoEm: new Date() })
          .where(eq(processoCandidatos.id, candidate.id));
      }
      // Verificar se o slot está disponível
      const [slot] = await database
        .select()
        .from(processoAgendaSlots)
        .where(and(eq(processoAgendaSlots.id, input.slotId), eq(processoAgendaSlots.status, "disponivel")))
        .limit(1);
      if (!slot) throw new TRPCError({ code: "NOT_FOUND", message: "Slot nao disponivel" });
      // Reservar o slot
      await database
        .update(processoAgendaSlots)
        .set({ candidatoId: candidate.id, status: "reservado" })
        .where(eq(processoAgendaSlots.id, input.slotId));
      // Criar entrevista
      await database.insert(processoEntrevistas).values({
        processoId: input.processoId,
        candidatoId: candidate.id,
        agendaSlotId: input.slotId,
        linkEntrevista: slot.linkEntrevista,
        status: "agendada",
      });
      // Atualizar status do candidato
      await database
        .update(processoCandidatos)
        .set({ statusEntrevista: "agendada" })
        .where(eq(processoCandidatos.id, candidate.id));
      await writeLog(database, {
        processoId: input.processoId,
        candidatoId: candidate.id,
        userId: ctx.user.id,
        acao: "candidato_agendou",
        detalhe: `Slot ${slot.dataAgenda} ${slot.inicio}`,
      });
      // Enviar e-mail de confirmação ao candidato
      try {
        const [processo] = await database.select().from(processosSeletivos).where(eq(processosSeletivos.id, input.processoId)).limit(1);
        if (processo && candidate.email) {
          const dataFormatada = slot.dataAgenda
            ? new Date(slot.dataAgenda + 'T00:00:00').toLocaleDateString('pt-BR')
            : slot.dataAgenda;
          const emailData = buildPsConfirmacaoAgendamentoEmail({
            candidatoNome: candidate.nome,
            processoNome: processo.nome,
            clienteNome: processo.clienteNome,
            dataEntrevista: dataFormatada,
            horaInicio: slot.inicio,
            horaFim: slot.fim,
            linkEntrevista: slot.linkEntrevista ?? null,
            loginUrl: `${process.env.VITE_OAUTH_PORTAL_URL ?? 'https://ecolider.ecodobem.com'}/login`,
          });
          await sendEmail({ to: candidate.email, subject: emailData.subject, html: emailData.html, text: emailData.text });
        }
      } catch (emailErr) {
        console.error('[PS] Erro ao enviar e-mail de confirmação:', emailErr);
      }
      return { success: true, slot };
    }),

  // Obter dados do candidato pelo userId (para o portal do candidato)
  meusDadosCandidato: protectedProcedure.query(async ({ ctx }) => {
    const database = await requireDatabase();
    const [candidate] = await database
      .select()
      .from(processoCandidatos)
      .where(eq(processoCandidatos.userId, ctx.user.id))
      .limit(1);
    if (!candidate) return null;
    // Buscar nome do processo
    const [processo] = await database
      .select({ nome: processosSeletivos.nome })
      .from(processosSeletivos)
      .where(eq(processosSeletivos.id, candidate.processoId))
      .limit(1);
    return { ...candidate, processoNome: processo?.nome ?? null };
  }),

  // Mentora: buscar DISC de um candidato pelo candidatoId do processo
  discCandidato: protectedProcedure
    .input(z.object({ candidatoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const [candidate] = await database.select().from(processoCandidatos).where(eq(processoCandidatos.id, input.candidatoId)).limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato nao encontrado" });
      await ensureProcessAccess(database, ctx.user, candidate.processoId);
      if (!candidate.userId) return null;
      // Buscar alunoId via users
      const [userRow] = await database.select({ alunoId: users.alunoId }).from(users).where(eq(users.id, candidate.userId)).limit(1);
      if (!userRow?.alunoId) return null;
      const [disc] = await database
        .select()
        .from(discResultados)
        .where(eq(discResultados.alunoId, userRow.alunoId))
        .orderBy(desc(discResultados.completedAt))
        .limit(1);
      return disc ?? null;
    }),

  // Mentora: listar resultados registrados de um processo
  listarResultados: protectedProcedure.input(processoIdInput).query(async ({ ctx, input }) => {
    const database = await requireDatabase();
    await ensureProcessAccess(database, ctx.user, input.processoId);
    return database
      .select()
      .from(processoResultados)
      .where(eq(processoResultados.processoId, input.processoId));
  }),

  // Cliente/Admin: mover candidato para outra região
  moverCandidato: protectedProcedure
    .input(z.object({ candidatoId: z.number(), novaRegiaoId: z.number().nullable(), novaVagaId: z.number().optional().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const [candidate] = await database
        .select()
        .from(processoCandidatos)
        .where(eq(processoCandidatos.id, input.candidatoId))
        .limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato nao encontrado" });
      await ensureProcessAccess(database, ctx.user, candidate.processoId);
      // Apenas admin ou cliente vinculado pode mover (não o próprio candidato)
      const isCandidate = candidate.userId === ctx.user.id && !isCkmAdmin(ctx.user.role);
      if (isCandidate) throw new TRPCError({ code: "FORBIDDEN", message: "Candidatos nao podem alterar propria regiao" });
      // Se novaRegiaoId não é null, verificar que a nova região pertence ao mesmo processo
      if (input.novaRegiaoId !== null) {
        const [regiao] = await database
          .select({ id: processoRegioes.id })
          .from(processoRegioes)
          .where(and(eq(processoRegioes.id, input.novaRegiaoId), eq(processoRegioes.processoId, candidate.processoId)))
          .limit(1);
        if (!regiao) throw new TRPCError({ code: "NOT_FOUND", message: "Regiao nao encontrada neste processo" });
      }
      const regiaoAnterior = candidate.regiaoId;
      await database
        .update(processoCandidatos)
        .set({ regiaoId: input.novaRegiaoId, vagaId: input.novaVagaId ?? null })
        .where(eq(processoCandidatos.id, input.candidatoId));
      await writeLog(database, {
        processoId: candidate.processoId,
        candidatoId: input.candidatoId,
        userId: ctx.user.id,
        acao: "candidato_movido",
        detalhe: `Regiao ${regiaoAnterior ?? 'sem regiao'} → ${input.novaRegiaoId ?? 'sem regiao'}`,
      });
      return { success: true };
    }),

  // ── AVALIAÇÃO: Listar entrevistas agendadas de um processo ──
  listarEntrevistasProcesso: protectedProcedure
    .input(processoIdInput)
    .query(async ({ ctx, input }) => {
      const database = await requireDatabase();
      await ensureProcessAccess(database, ctx.user, input.processoId);
      const rows = await database
        .select({
          entrevistaId: processoEntrevistas.id,
          candidatoId: processoEntrevistas.candidatoId,
          agendaSlotId: processoEntrevistas.agendaSlotId,
          status: processoEntrevistas.status,
          linkEntrevista: processoEntrevistas.linkEntrevista,
          candidatoNome: processoCandidatos.nome,
          candidatoEmail: processoCandidatos.email,
          statusResultado: processoCandidatos.statusResultado,
          dataAgenda: processoAgendaSlots.dataAgenda,
          inicio: processoAgendaSlots.inicio,
          fim: processoAgendaSlots.fim,
        })
        .from(processoEntrevistas)
        .innerJoin(processoCandidatos, eq(processoCandidatos.id, processoEntrevistas.candidatoId))
        .innerJoin(processoAgendaSlots, eq(processoAgendaSlots.id, processoEntrevistas.agendaSlotId))
        .where(eq(processoEntrevistas.processoId, input.processoId))
        .orderBy(asc(processoAgendaSlots.dataAgenda), asc(processoAgendaSlots.inicio));
      return rows;
    }),

  // ── AVALIAÇÃO: Perfil completo do candidato (DISC + autopercepções < 4 + minicurrículo) ──
  perfilCandidatoCompleto: protectedProcedure
    .input(z.object({ candidatoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const [candidate] = await database
        .select()
        .from(processoCandidatos)
        .where(eq(processoCandidatos.id, input.candidatoId))
        .limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato nao encontrado" });
      await ensureProcessAccess(database, ctx.user, candidate.processoId);

      // Buscar alunoId via users
      let alunoId: number | null = null;
      let minicurriculo: string | null = null;
      if (candidate.userId) {
        const [userRow] = await database
          .select({ alunoId: users.alunoId })
          .from(users)
          .where(eq(users.id, candidate.userId))
          .limit(1);
        if (userRow?.alunoId) {
          alunoId = userRow.alunoId;
          const [alunoRow] = await database
            .select({ minicurriculo: alunos.minicurriculo })
            .from(alunos)
            .where(eq(alunos.id, alunoId))
            .limit(1);
          minicurriculo = alunoRow?.minicurriculo ?? null;
        }
      }

      // Buscar resultado DISC mais recente
      let disc = null;
      if (alunoId) {
        const [discRow] = await database
          .select()
          .from(discResultados)
          .where(eq(discResultados.alunoId, alunoId))
          .orderBy(desc(discResultados.completedAt))
          .limit(1);
        disc = discRow ?? null;
      }

      // Buscar autopercepções com nota < 4
      let autopercepcoesBaixas: { competenciaNome: string; nota: number }[] = [];
      if (alunoId) {
        const rows = await database
          .select({
            competenciaNome: competencias.nome,
            nota: autopercepcoesCompetencias.nota,
          })
          .from(autopercepcoesCompetencias)
          .innerJoin(competencias, eq(competencias.id, autopercepcoesCompetencias.competenciaId))
          .where(
            and(
              eq(autopercepcoesCompetencias.alunoId, alunoId),
              lt(autopercepcoesCompetencias.nota, 4)
            )
          )
          .orderBy(asc(autopercepcoesCompetencias.nota));
        autopercepcoesBaixas = rows;
      }

      return {
        candidato: {
          id: candidate.id,
          nome: candidate.nome,
          email: candidate.email,
          telefone: candidate.telefone,
          minicurriculo,
        },
        disc,
        autopercepcoesBaixas,
      };
    }),

  // ── AVALIAÇÃO: Reagendar entrevista pelo admin/gestor ──
  reagendarEntrevista: protectedProcedure
    .input(z.object({
      candidatoId: z.number(),
      novoSlotId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const [candidate] = await database
        .select()
        .from(processoCandidatos)
        .where(eq(processoCandidatos.id, input.candidatoId))
        .limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato nao encontrado" });
      await ensureProcessAccess(database, ctx.user, candidate.processoId);
      // Apenas admin CKM pode reagendar (não o próprio candidato)
      if (!isCkmAdmin(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem reagendar entrevistas" });
      }

      // Verificar novo slot
      const [novoSlot] = await database
        .select()
        .from(processoAgendaSlots)
        .where(eq(processoAgendaSlots.id, input.novoSlotId))
        .limit(1);
      if (!novoSlot) throw new TRPCError({ code: "NOT_FOUND", message: "Slot nao encontrado" });
      if (novoSlot.candidatoId && novoSlot.candidatoId !== input.candidatoId) {
        throw new TRPCError({ code: "CONFLICT", message: "Este horario ja esta reservado por outro candidato" });
      }

      // Buscar entrevista atual
      const [entrevistaAtual] = await database
        .select()
        .from(processoEntrevistas)
        .where(eq(processoEntrevistas.candidatoId, input.candidatoId))
        .orderBy(desc(processoEntrevistas.createdAt))
        .limit(1);

      // Liberar slot anterior
      if (entrevistaAtual) {
        await database
          .update(processoAgendaSlots)
          .set({ candidatoId: null, status: "disponivel" })
          .where(eq(processoAgendaSlots.id, entrevistaAtual.agendaSlotId));
        // Atualizar entrevista existente
        await database
          .update(processoEntrevistas)
          .set({
            agendaSlotId: input.novoSlotId,
            linkEntrevista: novoSlot.linkEntrevista ?? entrevistaAtual.linkEntrevista,
            status: "reagendada",
          })
          .where(eq(processoEntrevistas.id, entrevistaAtual.id));
      } else {
        // Criar nova entrevista
        await database.insert(processoEntrevistas).values({
          processoId: candidate.processoId,
          candidatoId: input.candidatoId,
          agendaSlotId: input.novoSlotId,
          linkEntrevista: novoSlot.linkEntrevista ?? null,
          status: "agendada",
        });
      }

      // Reservar novo slot
      await database
        .update(processoAgendaSlots)
        .set({ candidatoId: input.candidatoId, status: "reservado" })
        .where(eq(processoAgendaSlots.id, input.novoSlotId));

      // Atualizar statusEntrevista do candidato
      await database
        .update(processoCandidatos)
        .set({ statusEntrevista: "agendada" })
        .where(eq(processoCandidatos.id, input.candidatoId));

      // Registrar log
      await writeLog(database, {
        processoId: candidate.processoId,
        candidatoId: input.candidatoId,
        userId: ctx.user.id,
        acao: "reagendamento_admin",
        detalhe: `Reagendado para ${novoSlot.dataAgenda} ${novoSlot.inicio}–${novoSlot.fim}`,
      });

      // Buscar processo para o e-mail
      const [processo] = await database
        .select({ nome: processosSeletivos.nome, clienteNome: processosSeletivos.clienteNome })
        .from(processosSeletivos)
        .where(eq(processosSeletivos.id, candidate.processoId))
        .limit(1);

      // Formatar data
      const [ano, mes, dia] = novoSlot.dataAgenda.split("-");
      const dataFormatada = `${dia}/${mes}/${ano}`;

      // Enviar e-mail ao candidato
      if (candidate.email) {
        const emailData = buildPsReagendamentoEmail({
          candidatoNome: candidate.nome,
          processoNome: processo?.nome ?? "Processo Seletivo",
          clienteNome: processo?.clienteNome ?? "",
          dataEntrevista: dataFormatada,
          horaInicio: novoSlot.inicio,
          horaFim: novoSlot.fim,
          linkEntrevista: novoSlot.linkEntrevista ?? null,
          loginUrl: "https://ecolider.ecodobem.com/login",
        });
        await sendEmail({
          to: candidate.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });
      }

      return { success: true, novoSlot };
    }),

  // ── AVALIAÇÃO: Registrar decisão com justificativa obrigatória ──
  registrarDecisao: protectedProcedure
    .input(z.object({
      candidatoId: z.number(),
      decisao: z.enum(["aprovado", "reprovado"]),
      justificativa: z.string().min(1, "Justificativa é obrigatória"),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const [candidate] = await database
        .select()
        .from(processoCandidatos)
        .where(eq(processoCandidatos.id, input.candidatoId))
        .limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato nao encontrado" });
      await ensureProcessAccess(database, ctx.user, candidate.processoId);
      if (!isCkmAdmin(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores CKM podem registrar decisoes" });
      }

      const decisaoAnterior = candidate.statusResultado;

      // Upsert em processo_resultados
      const [existingResult] = await database
        .select({ id: processoResultados.id })
        .from(processoResultados)
        .where(eq(processoResultados.candidatoId, input.candidatoId))
        .limit(1);
      if (existingResult) {
        await database
          .update(processoResultados)
          .set({ resultado: input.decisao, parecer: input.justificativa, registradoPor: ctx.user.id })
          .where(eq(processoResultados.id, existingResult.id));
      } else {
        await database.insert(processoResultados).values({
          processoId: candidate.processoId,
          candidatoId: input.candidatoId,
          resultado: input.decisao,
          parecer: input.justificativa,
          registradoPor: ctx.user.id,
        });
      }

      // Atualizar statusResultado no candidato
      await database
        .update(processoCandidatos)
        .set({ statusResultado: input.decisao })
        .where(eq(processoCandidatos.id, input.candidatoId));

      // Registrar no histórico (processo_logs)
      await writeLog(database, {
        processoId: candidate.processoId,
        candidatoId: input.candidatoId,
        userId: ctx.user.id,
        acao: decisaoAnterior === "pendente" ? "decisao_registrada" : "decisao_alterada",
        detalhe: input.decisao,
        metadata: {
          decisaoAnterior,
          novaDecisao: input.decisao,
          justificativa: input.justificativa,
          tipo: decisaoAnterior === "pendente" ? "primeira_decisao" : "alteracao",
        },
      });

      return { success: true };
    }),

  // ── AVALIAÇÃO: Histórico de decisões de um candidato ──
  historicoDecisoesCandidato: protectedProcedure
    .input(z.object({ candidatoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const [candidate] = await database
        .select({ processoId: processoCandidatos.processoId })
        .from(processoCandidatos)
        .where(eq(processoCandidatos.id, input.candidatoId))
        .limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato nao encontrado" });
      await ensureProcessAccess(database, ctx.user, candidate.processoId);

      const logs = await database
        .select({
          id: processoLogs.id,
          acao: processoLogs.acao,
          detalhe: processoLogs.detalhe,
          metadata: processoLogs.metadata,
          createdAt: processoLogs.createdAt,
          userId: processoLogs.userId,
          userName: users.name,
        })
        .from(processoLogs)
        .leftJoin(users, eq(users.id, processoLogs.userId))
        .where(
          and(
            eq(processoLogs.candidatoId, input.candidatoId),
            or(
              eq(processoLogs.acao, "decisao_registrada"),
              eq(processoLogs.acao, "decisao_alterada")
            )
          )
        )
        .orderBy(desc(processoLogs.createdAt));

      return logs;
    }),

  // Obter entrevista agendada do candidato
  minhaEntrevista: protectedProcedure.query(async ({ ctx }) => {
    const database = await requireDatabase();
    const [candidate] = await database
      .select({ id: processoCandidatos.id, processoId: processoCandidatos.processoId })
      .from(processoCandidatos)
      .where(eq(processoCandidatos.userId, ctx.user.id))
      .limit(1);
    if (!candidate) return null;
    const [entrevista] = await database
      .select()
      .from(processoEntrevistas)
      .where(eq(processoEntrevistas.candidatoId, candidate.id))
      .orderBy(desc(processoEntrevistas.createdAt))
      .limit(1);
    if (!entrevista) return null;
    const [slot] = await database
      .select()
      .from(processoAgendaSlots)
      .where(eq(processoAgendaSlots.id, entrevista.agendaSlotId))
      .limit(1);
    return { entrevista, slot: slot ?? null };
  }),
});
