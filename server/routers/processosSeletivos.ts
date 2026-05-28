import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
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
} from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

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

async function hasProcessAccess(database: DbClient, user: { id: number; role?: string | null }, processoId: number) {
  if (isCkmAdmin(user.role)) return true;

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

async function ensureProcessAccess(database: DbClient, user: { id: number; role?: string | null }, processoId: number) {
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

  const slotWhere = candidate.vagaId
    ? and(
        eq(processoAgendaSlots.processoId, candidate.processoId),
        eq(processoAgendaSlots.regiaoId, candidate.regiaoId),
        or(isNull(processoAgendaSlots.vagaId), eq(processoAgendaSlots.vagaId, candidate.vagaId)),
        eq(processoAgendaSlots.status, "disponivel"),
      )
    : and(
        eq(processoAgendaSlots.processoId, candidate.processoId),
        eq(processoAgendaSlots.regiaoId, candidate.regiaoId),
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
});

const processoIdInput = z.object({ processoId: z.number() });

export const processosSeletivosRouter = router({
  listarProcessos: protectedProcedure.query(async ({ ctx }) => {
    const database = await requireDatabase();

    if (isCkmAdmin(ctx.user.role)) {
      return database.select().from(processosSeletivos).orderBy(desc(processosSeletivos.createdAt));
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
      criadoPor: ctx.user.id,
    });
    const id = Number(result[0].insertId);
    await writeLog(database, { processoId: id, userId: ctx.user.id, acao: "processo_criado", detalhe: input.nome });
    return { id, success: true };
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
    return database.select().from(processoRegioes).where(eq(processoRegioes.processoId, input.processoId));
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

  listarCandidatos: protectedProcedure.input(processoIdInput).query(async ({ ctx, input }) => {
    const database = await requireDatabase();
    await ensureProcessAccess(database, ctx.user, input.processoId);
    const rows = await database.select().from(processoCandidatos).where(eq(processoCandidatos.processoId, input.processoId)).orderBy(asc(processoCandidatos.nome));
    if (isCkmAdmin(ctx.user.role)) return rows;
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
        regiaoId: z.number(),
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
        regiaoId: input.regiaoId,
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
            regiaoId: z.number(),
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
          regiaoId: candidate.regiaoId,
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
        regiaoId: z.number(),
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
        regiaoId: input.regiaoId,
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
        regiaoId: input.regiaoId,
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
    .input(z.object({ candidatoId: z.number(), resultado: z.enum(["pendente", "aprovado", "reprovado", "suplente", "desistente"]), notaEntrevista: z.number().optional().nullable(), parecer: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      const [candidate] = await database.select().from(processoCandidatos).where(eq(processoCandidatos.id, input.candidatoId)).limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato nao encontrado" });
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
});
