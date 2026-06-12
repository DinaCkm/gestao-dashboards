import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
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
import { createNotification, getDb } from "../db";
import { buildPsAlertaAdminSemSlotEmail, buildPsConfirmacaoAgendamentoEmail, buildPsReagendamentoEmail, buildPsRelatorioEmail, sendEmail } from "../emailService";
import { storagePut, storageGet, storageDownloadBuffer } from "../storage";

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

  let cursor = start;
  while (cursor + input.duracaoMinutos <= end) {
    // Se o cursor caiu dentro do intervalo de almoço, pula direto para o fim do intervalo
    if (breakStart !== null && breakEnd !== null && cursor >= breakStart && cursor < breakEnd) {
      cursor = breakEnd;
      continue;
    }
    const slotEnd = cursor + input.duracaoMinutos;
    // Verifica se o slot se sobrepõe ao intervalo
    const overlapsBreak = breakStart !== null && breakEnd !== null && cursor < breakEnd && slotEnd > breakStart;
    if (!overlapsBreak) {
      slots.push({ dataAgenda: input.dataAgenda, inicio: toTime(cursor), fim: toTime(slotEnd) });
    } else {
      // Slot começa antes do intervalo mas termina dentro dele: pula para o fim do intervalo
      cursor = breakEnd;
      continue;
    }
    cursor += input.duracaoMinutos;
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

  // Filtrar apenas slots com data de hoje ou futura (ignorar datas passadas)
  const hoje = new Date();
  const dataHoje = hoje.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const slotWhere = candidate.vagaId
    ? and(
        eq(processoAgendaSlots.processoId, candidate.processoId),
        regiaoFilter,
        or(isNull(processoAgendaSlots.vagaId), eq(processoAgendaSlots.vagaId, candidate.vagaId)),
        eq(processoAgendaSlots.status, "disponivel"),
        gte(processoAgendaSlots.dataAgenda, dataHoje),
      )
    : and(
        eq(processoAgendaSlots.processoId, candidate.processoId),
        regiaoFilter,
        eq(processoAgendaSlots.status, "disponivel"),
        gte(processoAgendaSlots.dataAgenda, dataHoje),
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
    // Buscar dados do processo para o e-mail de alerta
    try {
      const [processo] = await database
        .select({ id: processosSeletivos.id, nome: processosSeletivos.nome, clienteNome: processosSeletivos.clienteNome, clienteEmail: processosSeletivos.clienteEmail, responsavelCkmId: processosSeletivos.responsavelCkmId })
        .from(processosSeletivos)
        .where(eq(processosSeletivos.id, candidate.processoId))
        .limit(1);
      let regiaoNome: string | null = null;
      if (candidate.regiaoId) {
        const [regiao] = await database
          .select()
          .from(processoRegioes)
          .where(eq(processoRegioes.id, candidate.regiaoId))
          .limit(1);
        regiaoNome = regiao?.nome ?? null;
      }
      let vagaNome: string | null = null;
      if (candidate.vagaId) {
        const [vaga] = await database
          .select()
          .from(processoVagas)
          .where(eq(processoVagas.id, candidate.vagaId))
          .limit(1);
        vagaNome = vaga?.nome ?? null;
      }
      if (processo) {
        const alertaEmail = buildPsAlertaAdminSemSlotEmail({
          candidatoNome: candidate.nome,
          candidatoEmail: candidate.email,
          processoNome: processo.nome,
          clienteNome: processo.clienteNome,
          regiaoNome,
          vagaNome,
          painelUrl: "https://ecolider.ecodobem.com",
        });
        await sendEmail({
          to: "relacionamento@ckmtalents.net",
          subject: alertaEmail.subject,
          html: alertaEmail.html,
          text: alertaEmail.text,
        });
      }
    } catch (emailErr) {
      console.error("[allocateCandidate] Erro ao enviar e-mail de alerta sem slot:", emailErr);
    }
    return { status: "aguardando_agenda" as const, slot: null };
  }

  await database
    .update(processoAgendaSlots)
    .set({ candidatoId, status: "reservado" })
    .where(eq(processoAgendaSlots.id, slot.id));

  await database
    .update(processoCandidatos)
    .set({ statusEntrevista: "agendada" })
    .where(eq(processoCandidatos.id, candidatoId));

  // Buscar o processo para pegar o linkEntrevista do nível do processo
  const [processoParaLink] = await database
    .select({ linkEntrevista: processosSeletivos.linkEntrevista })
    .from(processosSeletivos)
    .where(eq(processosSeletivos.id, candidate.processoId))
    .limit(1);
  const linkFinal = processoParaLink?.linkEntrevista || slot.linkEntrevista || null;

  await database.insert(processoEntrevistas).values({
    processoId: candidate.processoId,
    candidatoId,
    agendaSlotId: slot.id,
    linkEntrevista: linkFinal,
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

  // Enviar e-mail de confirmação ao candidato
  try {
    const [processo] = await database
      .select({ id: processosSeletivos.id, nome: processosSeletivos.nome, clienteNome: processosSeletivos.clienteNome, linkEntrevista: processosSeletivos.linkEntrevista })
      .from(processosSeletivos)
      .where(eq(processosSeletivos.id, candidate.processoId))
      .limit(1);
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
        linkEntrevista: processo.linkEntrevista || slot.linkEntrevista || null,
        loginUrl: `${process.env.VITE_OAUTH_PORTAL_URL ?? 'https://ecolider.ecodobem.com'}/login`,
      });
      await sendEmail({ to: candidate.email, cc: 'relacionamento@ckmtalents.net', subject: emailData.subject, html: emailData.html, text: emailData.text });
    }
  } catch (emailErr) {
    console.error('[allocateCandidate] Erro ao enviar e-mail de confirmação ao candidato:', emailErr);
  }

  return { status: "agendada" as const, slot };
}

const processoInput = z.object({
  nome: z.string().min(1),
  clienteNome: z.string().min(1),
  clienteEmail: z.string().email().optional().or(z.literal("")),
  linkEntrevista: z.string().url().optional().or(z.literal("")),
  descricao: z.string().optional(),
  status: z.enum(["rascunho", "ativo", "pausado", "encerrado"]).default("rascunho"),
  dataInicio: z.string().optional().nullable(),
  emailsRelatorio: z.string().optional().nullable(),
  mentorId: z.number().optional().nullable(),
});

const processoIdInput = z.object({ processoId: z.number() });

export const processosSeletivosRouter = router({
  listarProcessos: protectedProcedure.query(async ({ ctx }) => {
    const database = await requireDatabase();

    // Colunas seguras: não inclui dataFim/mentorId/emailsRelatorio que podem não existir no banco ainda
    const safeSelect = {
      id: processosSeletivos.id,
      nome: processosSeletivos.nome,
      clienteNome: processosSeletivos.clienteNome,
      clienteEmail: processosSeletivos.clienteEmail,
      linkEntrevista: processosSeletivos.linkEntrevista,
      descricao: processosSeletivos.descricao,
      status: processosSeletivos.status,
      dataInicio: processosSeletivos.dataInicio,
      responsavelCkmId: processosSeletivos.responsavelCkmId,
      criadoPor: processosSeletivos.criadoPor,
      createdAt: processosSeletivos.createdAt,
      updatedAt: processosSeletivos.updatedAt,
    };

    if (isCkmAdmin(ctx.user.role)) {
      return database.select(safeSelect).from(processosSeletivos).orderBy(desc(processosSeletivos.createdAt));
    }

    // Mentora: ver processos onde ela é a mentora responsável
    // Gerente NÃO entra neste bloco — usa o filtro por empresa abaixo
    const userConsultorId = (ctx.user as any).consultorId as number | null;
    const userConsultorRole = (ctx.user as any).consultorRole as string | null;
    const userManagedProgramId = (ctx.user as any).managedProgramId as number | null;
    if (userConsultorId && userConsultorRole !== 'gerente') {
      // Filtra por mentorId via SQL raw para não depender da coluna no schema
      return database
        .select(safeSelect)
        .from(processosSeletivos)
        .where(sql`${processosSeletivos.id} IN (SELECT id FROM processos_seletivos WHERE mentorId = ${userConsultorId})`)
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
          .select(safeSelect)
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
      .select(safeSelect)
      .from(processosSeletivos)
      .where(inArray(processosSeletivos.id, ids))
      .orderBy(desc(processosSeletivos.createdAt));
  }),

  resumo: protectedProcedure.input(processoIdInput).query(async ({ ctx, input }) => {
    const database = await requireDatabase();
    await ensureProcessAccess(database, ctx.user, input.processoId);

    const ativo = ne(processoCandidatos.statusCadastro, "inativo");
    const [candidatos] = await database
      .select({ total: sql<number>`count(*)` })
      .from(processoCandidatos)
      .where(and(eq(processoCandidatos.processoId, input.processoId), ativo));
    const [testesConcluidos] = await database
      .select({ total: sql<number>`count(*)` })
      .from(processoCandidatos)
      .where(and(eq(processoCandidatos.processoId, input.processoId), ativo, eq(processoCandidatos.statusTeste, "concluido")));
    const [entrevistasAgendadas] = await database
      .select({ total: sql<number>`count(*)` })
      .from(processoCandidatos)
      .where(and(eq(processoCandidatos.processoId, input.processoId), ativo, eq(processoCandidatos.statusEntrevista, "agendada")));
    const [aprovados] = await database
      .select({ total: sql<number>`count(*)` })
      .from(processoCandidatos)
      .where(and(eq(processoCandidatos.processoId, input.processoId), ativo, eq(processoCandidatos.statusResultado, "aprovado")));
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
    const safeSelectProcesso = {
      id: processosSeletivos.id,
      nome: processosSeletivos.nome,
      clienteNome: processosSeletivos.clienteNome,
      clienteEmail: processosSeletivos.clienteEmail,
      linkEntrevista: processosSeletivos.linkEntrevista,
      descricao: processosSeletivos.descricao,
      status: processosSeletivos.status,
      dataInicio: processosSeletivos.dataInicio,
      responsavelCkmId: processosSeletivos.responsavelCkmId,
      criadoPor: processosSeletivos.criadoPor,
      createdAt: processosSeletivos.createdAt,
      updatedAt: processosSeletivos.updatedAt,
    };
    const [processo] = await database.select(safeSelectProcesso).from(processosSeletivos).where(eq(processosSeletivos.id, input.processoId)).limit(1);
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
      linkEntrevista: input.linkEntrevista || null,
      descricao: input.descricao || null,
      status: input.status,
      dataInicio: input.dataInicio || null,
      emailsRelatorio: input.emailsRelatorio || null,
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
        ...(data.linkEntrevista !== undefined && { linkEntrevista: data.linkEntrevista || null }),
        ...(data.descricao !== undefined && { descricao: data.descricao || null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.dataInicio !== undefined && { dataInicio: data.dataInicio || null }),
        ...(data.emailsRelatorio !== undefined && { emailsRelatorio: data.emailsRelatorio || null }),
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

  excluirVaga: protectedProcedure
    .input(z.object({ vagaId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      const [vaga] = await database.select({ processoId: processoVagas.processoId, titulo: processoVagas.titulo })
        .from(processoVagas).where(eq(processoVagas.id, input.vagaId)).limit(1);
      if (!vaga) throw new TRPCError({ code: "NOT_FOUND", message: "Vaga nao encontrada" });
      await database.delete(processoVagas).where(eq(processoVagas.id, input.vagaId));
      await writeLog(database, { processoId: vaga.processoId, userId: ctx.user.id, acao: "vaga_excluida", detalhe: vaga.titulo });
      return { success: true };
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
    .input(z.object({ candidatoId: z.number(), comunicado: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const [candidato] = await database.select({
        id: processoCandidatos.id,
        processoId: processoCandidatos.processoId,
        nome: processoCandidatos.nome,
        email: processoCandidatos.email,
      })
        .from(processoCandidatos).where(eq(processoCandidatos.id, input.candidatoId)).limit(1);
      if (!candidato) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato nao encontrado" });
      await ensureProcessAccess(database, ctx.user, candidato.processoId);

      // Enviar e-mail de comunicado antes de inativar (se fornecido e candidato tem e-mail)
      if (input.comunicado && candidato.email) {
        try {
          const htmlComunicado = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <p style="font-size: 15px; color: #333;">Olá, <strong>${candidato.nome}</strong>,</p>
              <p style="font-size: 15px; color: #333;">${input.comunicado}</p>
              <p style="font-size: 13px; color: #888; margin-top: 32px;">Atenciosamente,<br/>Equipe Ecossistema do Bem</p>
            </div>
          `;
          await sendEmail({
            to: candidato.email,
            subject: "Informação sobre sua participação no processo seletivo",
            html: htmlComunicado,
            text: input.comunicado,
          });
        } catch (emailErr) {
          console.error('[inativarCandidato] Erro ao enviar e-mail de comunicado:', emailErr);
        }
      }

      await database.update(processoCandidatos).set({ statusCadastro: "inativo" }).where(eq(processoCandidatos.id, input.candidatoId));
      // Liberar slots de entrevista reservados para este candidato
      const entrevistas = await database
        .select({ agendaSlotId: processoEntrevistas.agendaSlotId })
        .from(processoEntrevistas)
        .where(eq(processoEntrevistas.candidatoId, input.candidatoId));
      for (const e of entrevistas) {
        if (e.agendaSlotId) {
          await database.update(processoAgendaSlots)
            .set({ status: "disponivel", candidatoId: null })
            .where(eq(processoAgendaSlots.id, e.agendaSlotId));
        }
      }
      await writeLog(database, { processoId: candidato.processoId, userId: ctx.user.id, acao: "candidato_inativado", detalhe: candidato.nome });
      return { success: true };
    }),

  reativarCandidato: protectedProcedure
    .input(z.object({ candidatoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const [candidato] = await database.select({ id: processoCandidatos.id, processoId: processoCandidatos.processoId, nome: processoCandidatos.nome })
        .from(processoCandidatos).where(eq(processoCandidatos.id, input.candidatoId)).limit(1);
      if (!candidato) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato nao encontrado" });
      await ensureProcessAccess(database, ctx.user, candidato.processoId);
      await database.update(processoCandidatos).set({ statusCadastro: "importado" }).where(eq(processoCandidatos.id, input.candidatoId));
      await writeLog(database, { processoId: candidato.processoId, userId: ctx.user.id, acao: "candidato_reativado", detalhe: candidato.nome });
      return { success: true };
    }),

  listarCandidatos: protectedProcedure.input(processoIdInput).query(async ({ ctx, input }) => {
    const database = await requireDatabase();
    await ensureProcessAccess(database, ctx.user, input.processoId);
    // Join com slot de agenda para retornar data/horário do agendamento
    const rows = await database
      .select({
        id: processoCandidatos.id,
        processoId: processoCandidatos.processoId,
        vagaId: processoCandidatos.vagaId,
        regiaoId: processoCandidatos.regiaoId,
        userId: processoCandidatos.userId,
        nome: processoCandidatos.nome,
        email: processoCandidatos.email,
        telefone: sql<string | null>`COALESCE(${processoCandidatos.telefone}, ${alunos.telefone})`,
        cpf: processoCandidatos.cpf,
        statusCadastro: processoCandidatos.statusCadastro,
        statusTeste: processoCandidatos.statusTeste,
        testeConcluidoEm: processoCandidatos.testeConcluidoEm,
        statusEntrevista: processoCandidatos.statusEntrevista,
        statusResultado: processoCandidatos.statusResultado,
        observacoes: processoCandidatos.observacoes,
        createdAt: processoCandidatos.createdAt,
        updatedAt: processoCandidatos.updatedAt,
        slotId: processoAgendaSlots.id,
        slotDataAgenda: processoAgendaSlots.dataAgenda,
        slotInicio: processoAgendaSlots.inicio,
        slotFim: processoAgendaSlots.fim,
      })
      .from(processoCandidatos)
      .leftJoin(
        processoAgendaSlots,
        and(
          eq(processoAgendaSlots.candidatoId, processoCandidatos.id),
          eq(processoAgendaSlots.processoId, input.processoId),
          ne(processoAgendaSlots.status, "cancelado"),
        ),
      )
      .leftJoin(users, eq(users.id, processoCandidatos.userId))
      .leftJoin(alunos, eq(alunos.id, users.alunoId))
      .where(and(eq(processoCandidatos.processoId, input.processoId), ne(processoCandidatos.statusCadastro, "inativo")))
      .orderBy(asc(processoCandidatos.nome));
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
      // Permite excluir slots disponíveis e reservados (órfãos de candidatos inativados)
      if (slot.status !== "disponivel" && slot.status !== "reservado") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nao e possivel excluir um slot com entrevista confirmada ou realizada" });
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

  // Rota pública: verifica se CPF está na lista de convocados de um processo seletivo
  verificarCpfConvocado: publicProcedure
    .input(z.object({ processoId: z.number(), cpf: z.string().min(1) }))
    .query(async ({ input }) => {
      const database = await requireDatabase();
      const cpfLimpo = input.cpf.replace(/[.\-\s]/g, '').trim();
      const [candidato] = await database
        .select({ id: processoCandidatos.id, nome: processoCandidatos.nome, statusCadastro: processoCandidatos.statusCadastro })
        .from(processoCandidatos)
        .where(
          and(
            eq(processoCandidatos.processoId, input.processoId),
            eq(processoCandidatos.cpf, cpfLimpo),
          )
        )
        .limit(1);
      if (!candidato || candidato.statusCadastro === 'inativo') {
        return { convocado: false, nome: null, jaCadastrado: false };
      }
      return {
        convocado: true,
        nome: candidato.nome,
        jaCadastrado: candidato.statusCadastro === 'ativo',
      };
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
        const [processo] = await database.select({
          id: processosSeletivos.id,
          nome: processosSeletivos.nome,
          clienteNome: processosSeletivos.clienteNome,
          linkEntrevista: processosSeletivos.linkEntrevista,
        }).from(processosSeletivos).where(eq(processosSeletivos.id, input.processoId)).limit(1);
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
          await sendEmail({ to: candidate.email, cc: 'relacionamento@ckmtalents.net', subject: emailData.subject, html: emailData.html, text: emailData.text });
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
        .where(and(eq(processoEntrevistas.processoId, input.processoId), ne(processoCandidatos.statusCadastro, "inativo")))
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
      // Admin CKM ou mentora do processo pode reagendar
      const isAdmin = isCkmAdmin(ctx.user.role);
      let isMentoraDoProcesso = false;
      if (!isAdmin) {
        const userConsultorId = (ctx.user as any).consultorId as number | null;
        if (userConsultorId) {
          const [processoCheck] = await database
            .select({ mentorId: processosSeletivos.mentorId })
            .from(processosSeletivos)
            .where(eq(processosSeletivos.id, candidate.processoId))
            .limit(1);
          isMentoraDoProcesso = processoCheck?.mentorId === userConsultorId;
        }
      }
      if (!isAdmin && !isMentoraDoProcesso) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores ou a mentora do processo podem reagendar entrevistas" });
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

      // Notificação no sino para o candidato
      if (candidate.userId) {
        try {
          await createNotification({
            userId: candidate.userId,
            title: "Entrevista Reagendada",
            message: `Sua entrevista para o processo ${processo?.nome ?? "Processo Seletivo"} foi reagendada para ${dataFormatada} às ${novoSlot.inicio}.`,
            type: "warning",
            category: "processo_seletivo",
            link: `/processos-seletivos`,
          });
        } catch (notifErr) {
          console.error("[reagendarEntrevista] Erro ao criar notificação:", notifErr);
        }
      }

      return { success: true, novoSlot };
    }),

  // ── AVALIAÇÃO: Registrar decisão com justificativa obrigatória ──
    registrarDecisao: protectedProcedure
    .input(z.object({
      candidatoId: z.number(),
      decisao: z.enum(["aprovado", "reprovado", "em_analise"]),
      justificativa: z.string().min(1, "Justificativa é obrigatória"),
      participantesBanca: z.string().optional(),
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
      const decisaoAnterior = candidate.statusResultado;
      // Upsert em processo_resultados
      const [existingResult] = await database
        .select({ id: processoResultados.id })
        .from(processoResultados)
        .where(eq(processoResultados.candidatoId, input.candidatoId))
        .limit(1);
      const updateSet: any = { resultado: input.decisao, parecer: input.justificativa, registradoPor: ctx.user.id };
      if (input.participantesBanca !== undefined) updateSet.participantesBanca = input.participantesBanca;
      if (existingResult) {
        await database
          .update(processoResultados)
          .set(updateSet)
          .where(eq(processoResultados.id, existingResult.id));
      } else {
        await database.insert(processoResultados).values({
          processoId: candidate.processoId,
          candidatoId: input.candidatoId,
          resultado: input.decisao,
          parecer: input.justificativa,
          participantesBanca: input.participantesBanca ?? null,
          registradoPor: ctx.user.id,
        } as any);
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
              eq(processoLogs.acao, "decisao_alterada"),
              eq(processoLogs.acao, "parecer_editado")
            )
          )
        )
        .orderBy(desc(processoLogs.createdAt));

      return logs;
    }),

  // ── AVALIAÇÃO: Editar/complementar parecer sem alterar decisão ──
  editarParecer: protectedProcedure
    .input(z.object({
      candidatoId: z.number(),
      parecer: z.string().min(1, "O parecer não pode ser vazio"),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const [candidate] = await database
        .select({ processoId: processoCandidatos.processoId })
        .from(processoCandidatos)
        .where(eq(processoCandidatos.id, input.candidatoId))
        .limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato não encontrado" });
      await ensureProcessAccess(database, ctx.user, candidate.processoId);

      // Atualizar o parecer em processo_resultados
      const [existingResult] = await database
        .select({ id: processoResultados.id })
        .from(processoResultados)
        .where(eq(processoResultados.candidatoId, input.candidatoId))
        .limit(1);
      if (existingResult) {
        await database
          .update(processoResultados)
          .set({ parecer: input.parecer })
          .where(eq(processoResultados.id, existingResult.id));
      }

      // Registrar no histórico
      await writeLog(database, {
        processoId: candidate.processoId,
        candidatoId: input.candidatoId,
        userId: ctx.user.id,
        acao: "parecer_editado",
        detalhe: "parecer_atualizado",
        metadata: { parecer: input.parecer },
      });

      return { success: true };
    }),

  // ── Enviar relatório do processo por e-mail ──
  enviarRelatorio: protectedProcedure
    .input(processoIdInput)
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      const [processo] = await database
        .select({
          id: processosSeletivos.id,
          nome: processosSeletivos.nome,
          clienteNome: processosSeletivos.clienteNome,
          clienteEmail: processosSeletivos.clienteEmail,
          linkEntrevista: processosSeletivos.linkEntrevista,
          descricao: processosSeletivos.descricao,
          status: processosSeletivos.status,
          dataInicio: processosSeletivos.dataInicio,
          responsavelCkmId: processosSeletivos.responsavelCkmId,
          criadoPor: processosSeletivos.criadoPor,
          createdAt: processosSeletivos.createdAt,
          updatedAt: processosSeletivos.updatedAt,
        })
        .from(processosSeletivos)
        .where(eq(processosSeletivos.id, input.processoId))
        .limit(1);
      if (!processo) throw new TRPCError({ code: "NOT_FOUND", message: "Processo nao encontrado" });
      // Buscar emailsRelatorio separadamente (coluna pode não existir em bancos antigos)
      let emailsRelatorio: string | null = null;
      try {
        const [psExtra] = await database
          .select({ emailsRelatorio: processosSeletivos.emailsRelatorio })
          .from(processosSeletivos)
          .where(eq(processosSeletivos.id, input.processoId))
          .limit(1);
        emailsRelatorio = psExtra?.emailsRelatorio ?? null;
      } catch { /* coluna ainda não existe no banco */ }
      // Buscar candidatos ativos com região
      const candidatos = await database
        .select({
          id: processoCandidatos.id,
          nome: processoCandidatos.nome,
          regiaoId: processoCandidatos.regiaoId,
          statusCadastro: processoCandidatos.statusCadastro,
          statusTeste: processoCandidatos.statusTeste,
          statusEntrevista: processoCandidatos.statusEntrevista,
          statusResultado: processoCandidatos.statusResultado,
        })
        .from(processoCandidatos)
        .where(and(eq(processoCandidatos.processoId, input.processoId), ne(processoCandidatos.statusCadastro, "inativo")))
        .orderBy(asc(processoCandidatos.nome));
      // Buscar slots de entrevista agendados para os candidatos deste processo
      const slotsEntrevista = await database
        .select({
          candidatoId: processoAgendaSlots.candidatoId,
          dataAgenda: processoAgendaSlots.dataAgenda,
          inicio: processoAgendaSlots.inicio,
          fim: processoAgendaSlots.fim,
        })
        .from(processoAgendaSlots)
        .where(and(
          eq(processoAgendaSlots.processoId, input.processoId),
          ne(processoAgendaSlots.status, "cancelado"),
          ne(processoAgendaSlots.status, "disponivel")
        ));
      const slotMap = new Map(slotsEntrevista.map(s => [s.candidatoId, s]));
      // Buscar regiões para mapear nomes
      const regioes = await database
        .select({ id: processoRegioes.id, nome: processoRegioes.nome })
        .from(processoRegioes)
        .where(eq(processoRegioes.processoId, input.processoId));
      const regiaoMap = new Map(regioes.map((r) => [r.id, r.nome]));
      const labelEntrevista = (s: string) => {
        if (s === "realizada") return "Presente";
        if (s === "agendada") return "Agendada";
        if (s === "cancelada") return "Cancelada";
        if (s === "reagendada") return "Reagendada";
        if (s === "nao_agendada") return "N\u00e3o agendada";
        if (s === "aguardando_agenda") return "Aguardando agenda";
        return s;
      };
      const labelResultado = (s: string) => {
        if (s === "aprovado") return "Habilitado";
        if (s === "reprovado") return "Inabilitado";
        if (s === "pendente") return "Pendente";
        if (s === "em_analise") return "Em an\u00e1lise";
        if (s === "desistente") return "Desistente";
        return s;
      };
      const dadosCandidatosRaw = candidatos.map((c) => {
        const slot = slotMap.get(c.id);
        let dataHoraEntrevista = "";
        let sortKey = "";
        if (slot?.dataAgenda) {
          const d = new Date(slot.dataAgenda);
          const dia = String(d.getUTCDate()).padStart(2, "0");
          const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
          const ano = d.getUTCFullYear();
          dataHoraEntrevista = `${dia}/${mes}/${ano} ${slot.inicio}–${slot.fim}`;
          // Chave de ordenação: YYYY-MM-DD HH:MM (string ISO é ordinável)
          sortKey = `${slot.dataAgenda} ${slot.inicio}`;
        }
        return {
          nome: c.nome,
          regiao: c.regiaoId ? (regiaoMap.get(c.regiaoId) ?? "—") : "—",
          inscrito: c.statusCadastro === "ativo",
          testePerfil: c.statusTeste === "concluido",
          entrevista: labelEntrevista(c.statusEntrevista),
          dataHoraEntrevista,
          status: labelResultado(c.statusResultado),
          sortKey,
        };
      });
      // Ordenar por data/hora da entrevista (candidatos sem slot ficam no final, ordenados por nome)
      const dadosCandidatos = dadosCandidatosRaw
        .sort((a, b) => {
          if (a.sortKey && b.sortKey) return a.sortKey.localeCompare(b.sortKey);
          if (a.sortKey) return -1; // com slot vem antes
          if (b.sortKey) return 1;
          return a.nome.localeCompare(b.nome); // ambos sem slot: ordem alfabética
        })
        .map(({ sortKey: _sk, ...rest }) => rest);
      const agora = new Date();
      const dataEnvio = agora.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" });
      const emailData = buildPsRelatorioEmail({
        processoNome: processo.nome,
        dataEnvio,
        candidatos: dadosCandidatos,
        loginUrl: "https://ecolider.ecodobem.com/processos-seletivos",
      });
      // Destinatários: emailsRelatorio do processo + e-mail fixo da CKM
      const destinatarios: string[] = ["relacionamento@ckmtalents.net"];
      if (emailsRelatorio) {
        const extras = emailsRelatorio.split(/[,;\n]/).map((e) => e.trim()).filter(Boolean);
        destinatarios.push(...extras);
      }
      const uniqueDestinatarios = [...new Set(destinatarios)];
      await Promise.all(
        uniqueDestinatarios.map((to) =>
          sendEmail({ to, subject: emailData.subject, html: emailData.html, text: emailData.text }).catch((err) =>
            console.error(`[enviarRelatorio] Erro ao enviar para ${to}:`, err)
          )
        )
      );
      await writeLog(database, { processoId: input.processoId, userId: ctx.user.id, acao: "relatorio_enviado", detalhe: `Enviado para: ${uniqueDestinatarios.join(", ")}` });
      return { success: true, destinatarios: uniqueDestinatarios };
    }),

  // ── Finalizar processo (setar status encerrado) ──
  finalizarProcesso: protectedProcedure
    .input(processoIdInput)
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      await database
        .update(processosSeletivos)
        .set({ status: "encerrado" })
        .where(eq(processosSeletivos.id, input.processoId));
      await writeLog(database, { processoId: input.processoId, userId: ctx.user.id, acao: "processo_encerrado" });
      return { success: true };
    }),

  // Obter ficha completa do candidato para edição (admin)
  obterFichaCandidato: protectedProcedure
    .input(z.object({ candidatoId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      const [candidato] = await database
        .select({
          id: processoCandidatos.id,
          nome: processoCandidatos.nome,
          email: processoCandidatos.email,
          telefone: processoCandidatos.telefone,
          cpf: processoCandidatos.cpf,
          alunoId: users.alunoId,
          dataNascimento: alunos.dataNascimento,
        })
        .from(processoCandidatos)
        .leftJoin(users, eq(users.id, processoCandidatos.userId))
        .leftJoin(alunos, eq(alunos.id, users.alunoId))
        .where(eq(processoCandidatos.id, input.candidatoId))
        .limit(1);
      if (!candidato) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato não encontrado" });
      return candidato;
    }),

  // Editar dados pessoais do candidato (admin)
  editarCandidato: protectedProcedure
    .input(z.object({
      candidatoId: z.number().int().positive(),
      nome: z.string().min(1),
      email: z.string().email(),
      telefone: z.string().optional().nullable(),
      cpf: z.string().optional().nullable(),
      dataNascimento: z.string().optional().nullable(), // formato YYYY-MM-DD
    }))
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      // Atualizar processo_candidatos
      await database
        .update(processoCandidatos)
        .set({
          nome: input.nome,
          email: input.email,
          telefone: input.telefone ?? null,
          cpf: input.cpf ?? null,
        })
        .where(eq(processoCandidatos.id, input.candidatoId));
      // Se tiver alunoId vinculado, atualizar também na tabela alunos
      if (input.dataNascimento !== undefined) {
        const [candidato] = await database
          .select({ alunoId: users.alunoId })
          .from(processoCandidatos)
          .leftJoin(users, eq(users.id, processoCandidatos.userId))
          .where(eq(processoCandidatos.id, input.candidatoId))
          .limit(1);
        if (candidato?.alunoId) {
          await database
            .update(alunos)
            .set({ dataNascimento: input.dataNascimento ? new Date(input.dataNascimento) : null })
            .where(eq(alunos.id, candidato.alunoId));
        }
      }
      return { success: true };
    }),

  // ── Salvar comunicado do processo (admin) ──
  salvarComunicado: protectedProcedure
    .input(z.object({
      processoId: z.number().int().positive(),
      comunicado: z.string(), // HTML do editor rico
    }))
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      await database
        .update(processosSeletivos)
        .set({ comunicado: input.comunicado || null })
        .where(eq(processosSeletivos.id, input.processoId));
      await writeLog(database, { processoId: input.processoId, userId: ctx.user.id, acao: "comunicado_atualizado" });
      return { success: true };
    }),

  // ── Obter comunicado do processo (admin, mentor, candidato) ──
  obterComunicado: protectedProcedure
    .input(z.object({ processoId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const [processo] = await database
        .select({ comunicado: processosSeletivos.comunicado })
        .from(processosSeletivos)
        .where(eq(processosSeletivos.id, input.processoId))
        .limit(1);
      return { comunicado: processo?.comunicado ?? null };
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

  // ── Migration: adicionar em_analise ao enum statusResultado ──
  runMigrationEmAnalise: protectedProcedure.mutation(async ({ ctx }) => {
    requireCkmAdmin(ctx.user.role);
    const database = await requireDatabase();
    try {
      await database.execute(sql.raw(
        "ALTER TABLE `processo_candidatos` MODIFY COLUMN `statusResultado` enum('pendente','aprovado','reprovado','em_analise','suplente','desistente') NOT NULL DEFAULT 'pendente'"
      ));
      await database.execute(sql.raw(
        "ALTER TABLE `processo_resultados` MODIFY COLUMN `resultado` enum('pendente','aprovado','reprovado','em_analise','suplente','desistente') NOT NULL DEFAULT 'pendente'"
      ));
      return { success: true, message: 'Enum em_analise adicionado com sucesso' };
    } catch (e: any) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: e?.message ?? 'Erro na migration' });
    }
  }),

  // ── Forçar migration da coluna comunicado (admin) ──
  enviarConvocacao: protectedProcedure
    .input(z.object({ candidatoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();

      // Buscar candidato
      const [candidate] = await database
        .select()
        .from(processoCandidatos)
        .where(eq(processoCandidatos.id, input.candidatoId))
        .limit(1);
      if (!candidate) throw new TRPCError({ code: 'NOT_FOUND', message: 'Candidato não encontrado' });

      // Buscar entrevista e slot
      const [entrevista] = await database
        .select()
        .from(processoEntrevistas)
        .where(eq(processoEntrevistas.candidatoId, input.candidatoId))
        .limit(1);
      if (!entrevista) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entrevista não encontrada para este candidato' });

      const [slot] = await database
        .select()
        .from(processoAgendaSlots)
        .where(eq(processoAgendaSlots.id, entrevista.agendaSlotId))
        .limit(1);
      if (!slot) throw new TRPCError({ code: 'NOT_FOUND', message: 'Slot de agenda não encontrado' });

      // Buscar processo (usando safeSelect para evitar colunas que podem não existir no banco)
      const [processo] = await database
        .select({
          id: processosSeletivos.id,
          nome: processosSeletivos.nome,
          clienteNome: processosSeletivos.clienteNome,
          linkEntrevista: processosSeletivos.linkEntrevista,
        })
        .from(processosSeletivos)
        .where(eq(processosSeletivos.id, candidate.processoId))
        .limit(1);
      if (!processo) throw new TRPCError({ code: 'NOT_FOUND', message: 'Processo não encontrado' });

      // Enviar e-mail de confirmação
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
        linkEntrevista: processo.linkEntrevista || slot.linkEntrevista || null,
        loginUrl: `${process.env.VITE_OAUTH_PORTAL_URL ?? 'https://ecolider.ecodobem.com'}/login`,
      });
      await sendEmail({ to: candidate.email, cc: 'relacionamento@ckmtalents.net', subject: emailData.subject, html: emailData.html, text: emailData.text });

      await writeLog(database, {
        processoId: candidate.processoId,
        candidatoId: input.candidatoId,
        userId: ctx.user.id,
        acao: 'reenvio_convocacao',
        detalhe: `E-mail de convocação reenviado manualmente para ${candidate.nome} (${candidate.email}).`,
        metadata: { slotId: slot.id },
      });

      return { success: true, message: `E-mail de convocação enviado para ${candidate.email}` };
    }),

  // ── EDITAR SLOT: Alterar data/hora de um slot manualmente ──
  editarSlot: protectedProcedure
    .input(z.object({
      slotId: z.number(),
      dataAgenda: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
      inicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
      fim: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
    }))
    .mutation(async ({ ctx, input }) => {
      requireCkmAdmin(ctx.user.role);
      const database = await requireDatabase();
      const [slot] = await database
        .select()
        .from(processoAgendaSlots)
        .where(eq(processoAgendaSlots.id, input.slotId))
        .limit(1);
      if (!slot) throw new TRPCError({ code: "NOT_FOUND", message: "Slot não encontrado" });

      const dataAnterior = `${slot.dataAgenda} ${slot.inicio}-${slot.fim}`;

      await database
        .update(processoAgendaSlots)
        .set({
          dataAgenda: input.dataAgenda,
          inicio: input.inicio,
          fim: input.fim,
        })
        .where(eq(processoAgendaSlots.id, input.slotId));

      // Se o slot tem candidato alocado, atualizar também a entrevista e notificar
      if (slot.candidatoId) {
        await database
          .update(processoEntrevistas)
          .set({ status: "reagendada" })
          .where(eq(processoEntrevistas.agendaSlotId, input.slotId));

        // Buscar dados do candidato e processo para e-mail
        const [candidate] = await database
          .select()
          .from(processoCandidatos)
          .where(eq(processoCandidatos.id, slot.candidatoId))
          .limit(1);

        const [processo] = await database
          .select({ nome: processosSeletivos.nome, clienteNome: processosSeletivos.clienteNome, linkEntrevista: processosSeletivos.linkEntrevista })
          .from(processosSeletivos)
          .where(eq(processosSeletivos.id, slot.processoId))
          .limit(1);

        if (candidate && processo) {
          const [ano, mes, dia] = input.dataAgenda.split("-");
          const dataFormatada = `${dia}/${mes}/${ano}`;
          const linkFinal = slot.linkEntrevista || processo.linkEntrevista || null;

          // Registrar log com nome do candidato
          await writeLog(database, {
            processoId: slot.processoId,
            candidatoId: slot.candidatoId,
            userId: ctx.user.id,
            acao: "slot_editado",
            detalhe: `Horário alterado para ${candidate.nome}: ${dataAnterior} → ${input.dataAgenda} ${input.inicio}-${input.fim}`,
          });

          // Enviar e-mail ao candidato
          if (candidate.email) {
            try {
              const emailData = buildPsReagendamentoEmail({
                candidatoNome: candidate.nome,
                processoNome: processo.nome,
                clienteNome: processo.clienteNome,
                dataEntrevista: dataFormatada,
                horaInicio: input.inicio,
                horaFim: input.fim,
                linkEntrevista: linkFinal,
                loginUrl: "https://ecolider.ecodobem.com/login",
              });
              await sendEmail({
                to: candidate.email,
                subject: emailData.subject,
                html: emailData.html,
                text: emailData.text,
              });
            } catch (emailErr) {
              console.error("[editarSlot] Erro ao enviar e-mail:", emailErr);
            }
          }

          // Notificação no sino para o candidato
          if (candidate.userId) {
            try {
              await createNotification({
                userId: candidate.userId,
                title: "Horário de entrevista alterado",
                message: `Seu horário de entrevista para o processo ${processo.nome} foi alterado para ${dataFormatada} às ${input.inicio}.`,
                type: "warning",
                category: "processo_seletivo",
                link: `/processos-seletivos`,
              });
            } catch (notifErr) {
              console.error("[editarSlot] Erro ao criar notificação:", notifErr);
            }
          }
        }
      } else {
        // Slot sem candidato: apenas log simples
        await writeLog(database, {
          processoId: slot.processoId,
          userId: ctx.user.id,
          acao: "slot_editado",
          detalhe: `Slot editado (sem candidato): ${dataAnterior} → ${input.dataAgenda} ${input.inicio}-${input.fim}`,
        });
      }

      return { success: true };
    }),

  // ── RELATÓRIO CONSOLIDADO: Upload de transcrição ──
  uploadTranscricao: protectedProcedure
    .input(z.object({
      candidatoId: z.number(),
      fileName: z.string(),
      fileData: z.string(), // Base64
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await requireDatabase();
      // Buscar candidato
      const [candidate] = await database
        .select()
        .from(processoCandidatos)
        .where(eq(processoCandidatos.id, input.candidatoId))
        .limit(1);
      if (!candidate) throw new TRPCError({ code: 'NOT_FOUND', message: 'Candidato não encontrado' });
      await ensureProcessAccess(database, ctx.user, candidate.processoId);

      // Buscar ou criar entrevista para o candidato
      let [entrevista] = await database
        .select({ id: processoEntrevistas.id, processoId: processoEntrevistas.processoId })
        .from(processoEntrevistas)
        .where(eq(processoEntrevistas.candidatoId, input.candidatoId))
        .orderBy(desc(processoEntrevistas.createdAt))
        .limit(1);

      if (!entrevista) {
        // Tenta pelo slot
        const [slot] = await database
          .select({ id: processoAgendaSlots.id })
          .from(processoAgendaSlots)
          .where(and(eq(processoAgendaSlots.candidatoId, input.candidatoId), ne(processoAgendaSlots.status, 'cancelado')))
          .orderBy(desc(processoAgendaSlots.createdAt))
          .limit(1);
        if (slot) {
          const [eSlot] = await database
            .select({ id: processoEntrevistas.id, processoId: processoEntrevistas.processoId })
            .from(processoEntrevistas)
            .where(eq(processoEntrevistas.agendaSlotId, slot.id))
            .limit(1);
          if (eSlot) entrevista = eSlot;
        }
      }

      if (!entrevista) {
        // Cria entrevista automaticamente
        const [slot] = await database
          .select({ id: processoAgendaSlots.id })
          .from(processoAgendaSlots)
          .where(and(eq(processoAgendaSlots.candidatoId, input.candidatoId), ne(processoAgendaSlots.status, 'cancelado')))
          .orderBy(desc(processoAgendaSlots.createdAt))
          .limit(1);
        await database.insert(processoEntrevistas).values({
          processoId: candidate.processoId,
          candidatoId: input.candidatoId,
          agendaSlotId: slot?.id ?? null,
          status: 'agendada',
        });
        const [nova] = await database
          .select({ id: processoEntrevistas.id, processoId: processoEntrevistas.processoId })
          .from(processoEntrevistas)
          .where(eq(processoEntrevistas.candidatoId, input.candidatoId))
          .orderBy(desc(processoEntrevistas.createdAt))
          .limit(1);
        if (!nova) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível criar entrevista' });
        entrevista = nova;
      }

      const ext = input.fileName.split('.').pop()?.toLowerCase() || 'txt';
      const allowedExts = ['txt', 'pdf', 'docx', 'doc'];
      if (!allowedExts.includes(ext)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Formato não suportado. Use .txt, .pdf ou .docx' });
      }
      const buffer = Buffer.from(input.fileData, 'base64');
      const key = `processos-seletivos/transcricoes/${entrevista.processoId}/${entrevista.id}-${Date.now()}.${ext}`;
      const contentType = ext === 'pdf' ? 'application/pdf' : ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain';
      const result = await storagePut(key, buffer, contentType);
      await database
        .update(processoEntrevistas)
        .set({ transcricaoUrl: result.url, transcricaoNomeArquivo: input.fileName } as any)
        .where(eq(processoEntrevistas.id, entrevista.id));

      await writeLog(database, {
        processoId: entrevista.processoId,
        userId: ctx.user.id,
        acao: 'transcricao_enviada',
        detalhe: `Transcrição enviada: ${input.fileName}`,
      });

      return { success: true, url: result.url, fileName: input.fileName };
    }),

  // ── RELATÓRIO CONSOLIDADO: Salvar participantes da banca ──
  salvarParticipantesBanca: protectedProcedure
    .input(z.object({
      candidatoId: z.number(),
      participantesBanca: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const [candidate] = await database
        .select({ processoId: processoCandidatos.processoId })
        .from(processoCandidatos)
        .where(eq(processoCandidatos.id, input.candidatoId))
        .limit(1);
      if (!candidate) throw new TRPCError({ code: 'NOT_FOUND', message: 'Candidato não encontrado' });
      await ensureProcessAccess(database, ctx.user, candidate.processoId);

      // Upsert em processo_resultados
      const [existing] = await database
        .select({ id: processoResultados.id })
        .from(processoResultados)
        .where(eq(processoResultados.candidatoId, input.candidatoId))
        .limit(1);
      if (existing) {
        await database
          .update(processoResultados)
          .set({ participantesBanca: input.participantesBanca } as any)
          .where(eq(processoResultados.id, existing.id));
      } else {
        await database.insert(processoResultados).values({
          processoId: candidate.processoId,
          candidatoId: input.candidatoId,
          resultado: 'pendente',
          parecer: '',
          participantesBanca: input.participantesBanca,
          registradoPor: ctx.user.id,
        } as any);
      }
      return { success: true };
    }),

  // ── RELATÓRIO CONSOLIDADO: Buscar dados completos do candidato para o relatório ──
  dadosRelatorio: protectedProcedure
    .input(z.object({ candidatoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const [candidate] = await database
        .select()
        .from(processoCandidatos)
        .where(eq(processoCandidatos.id, input.candidatoId))
        .limit(1);
      if (!candidate) throw new TRPCError({ code: 'NOT_FOUND', message: 'Candidato não encontrado' });
      await ensureProcessAccess(database, ctx.user, candidate.processoId);

      // Buscar dados do aluno (minicurrículo, etc.)
      const [aluno] = await database
        .select({
          id: alunos.id,
          name: alunos.name,
          email: alunos.email,
          cargo: alunos.cargo,
          telefone: alunos.telefone,
          minicurriculo: alunos.minicurriculo,
        })
        .from(alunos)
        .where(eq(alunos.id, candidate.alunoId ?? 0))
        .limit(1);

      // Buscar resultado DISC mais recente
      const [disc] = await database
        .select()
        .from(discResultados)
        .where(eq(discResultados.alunoId, candidate.alunoId ?? 0))
        .orderBy(desc(discResultados.completedAt))
        .limit(1);

      // Buscar autopercepções de competências
      const autopercepcoes = await database
        .select({
          nota: autopercepcoesCompetencias.nota,
          competenciaNome: competencias.nome,
        })
        .from(autopercepcoesCompetencias)
        .leftJoin(competencias, eq(competencias.id, autopercepcoesCompetencias.competenciaId))
        .where(eq(autopercepcoesCompetencias.alunoId, candidate.alunoId ?? 0))
        .orderBy(desc(autopercepcoesCompetencias.nota));

      // Buscar resultado/decisão
      const [resultado] = await database
        .select()
        .from(processoResultados)
        .where(eq(processoResultados.candidatoId, input.candidatoId))
        .limit(1);

      // Buscar entrevista (transcrição e dados gerados pela IA)
      // 1) Tenta pelo candidatoId direto
      let [entrevista] = await database
        .select()
        .from(processoEntrevistas)
        .where(eq(processoEntrevistas.candidatoId, input.candidatoId))
        .orderBy(desc(processoEntrevistas.createdAt))
        .limit(1);

      // 2) Tenta pelo slot vinculado ao candidato
      if (!entrevista) {
        const slots = await database
          .select({ id: processoAgendaSlots.id })
          .from(processoAgendaSlots)
          .where(eq(processoAgendaSlots.candidatoId, input.candidatoId))
          .limit(5);
        if (slots.length > 0) {
          const slotIds = slots.map(s => s.id);
          const entrevistasPorSlot = await database
            .select()
            .from(processoEntrevistas)
            .where(inArray(processoEntrevistas.agendaSlotId, slotIds))
            .orderBy(desc(processoEntrevistas.createdAt))
            .limit(1);
          if (entrevistasPorSlot.length > 0) entrevista = entrevistasPorSlot[0];
        }
      }

      // 3) Tenta pelo email do candidato (candidato pode ter sido importado de outro processo)
      if (!entrevista) {
        // Busca todos os candidatoIds com esse email (incluindo inativos/outros processos)
        const candidatosComEmail = await database
          .select({ id: processoCandidatos.id })
          .from(processoCandidatos)
          .where(eq(processoCandidatos.email, candidate.email));
        if (candidatosComEmail.length > 0) {
          const ids = candidatosComEmail.map(c => c.id);
          const [e3] = await database
            .select()
            .from(processoEntrevistas)
            .where(inArray(processoEntrevistas.candidatoId, ids))
            .orderBy(desc(processoEntrevistas.createdAt))
            .limit(1);
          if (e3) entrevista = e3;
        }
      }

      // 4) Se ainda não encontrou mas o candidato tem slot agendado, cria a entrevista automaticamente
      if (!entrevista) {
        const [slotExistente] = await database
          .select()
          .from(processoAgendaSlots)
          .where(and(
            eq(processoAgendaSlots.candidatoId, input.candidatoId),
            ne(processoAgendaSlots.status, 'cancelado'),
          ))
          .orderBy(desc(processoAgendaSlots.createdAt))
          .limit(1);
        if (slotExistente) {
          await database.insert(processoEntrevistas).values({
            processoId: candidate.processoId,
            candidatoId: input.candidatoId,
            agendaSlotId: slotExistente.id,
            status: 'agendada',
          });
          const [nova] = await database
            .select()
            .from(processoEntrevistas)
            .where(and(
              eq(processoEntrevistas.candidatoId, input.candidatoId),
              eq(processoEntrevistas.agendaSlotId, slotExistente.id),
            ))
            .orderBy(desc(processoEntrevistas.createdAt))
            .limit(1);
          if (nova) entrevista = nova;
        }
      }

      // Buscar processo e mentor
      const [processo] = await database
        .select({ id: processosSeletivos.id, nome: processosSeletivos.nome, mentorId: processosSeletivos.mentorId })
        .from(processosSeletivos)
        .where(eq(processosSeletivos.id, candidate.processoId))
        .limit(1);

      let mentorNome: string | null = null;
      if (processo?.mentorId) {
        const [mentor] = await database
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, processo.mentorId))
          .limit(1);
        mentorNome = mentor?.name ?? null;
      }

      // Buscar slot da entrevista (data e horário)
      let slotData: { dataAgenda: string | null; inicio: string | null; fim: string | null } | null = null;
      if (entrevista?.agendaSlotId) {
        const [slot] = await database
          .select({ dataAgenda: processoAgendaSlots.dataAgenda, inicio: processoAgendaSlots.inicio, fim: processoAgendaSlots.fim })
          .from(processoAgendaSlots)
          .where(eq(processoAgendaSlots.id, entrevista.agendaSlotId))
          .limit(1);
        slotData = slot ?? null;
      }

      return {
        candidato: candidate,
        aluno: aluno ?? null,
        disc: disc ?? null,
        autopercepcoes,
        resultado: resultado ?? null,
        entrevista: entrevista ?? null,
        processo: processo ?? null,
        mentorNome,
        slot: slotData,
      };
    }),

  runMigrationRelatorioPS: protectedProcedure.mutation(async ({ ctx }) => {
    requireCkmAdmin(ctx.user.role);
    const database = await requireDatabase();
    const colunas = [
      { tabela: 'processo_entrevistas', coluna: 'transcricaoUrl', tipo: 'varchar(1000) NULL' },
      { tabela: 'processo_entrevistas', coluna: 'transcricaoNomeArquivo', tipo: 'varchar(255) NULL' },
      { tabela: 'processo_entrevistas', coluna: 'participantesBanca', tipo: 'text NULL' },
      { tabela: 'processo_entrevistas', coluna: 'dadosPrincipaisEntrevista', tipo: 'longtext NULL' },
      { tabela: 'processo_entrevistas', coluna: 'analisePerfilComportamental', tipo: 'longtext NULL' },
      { tabela: 'processo_entrevistas', coluna: 'relatorioGeradoEm', tipo: 'datetime NULL' },
      { tabela: 'processo_entrevistas', coluna: 'observacaoRevisao', tipo: 'text NULL' },
      { tabela: 'processo_resultados', coluna: 'participantesBanca', tipo: 'text NULL' },
    ];
    const resultados: string[] = [];
    for (const { tabela, coluna, tipo } of colunas) {
      try {
        const rows = await database.execute(sql.raw(
          `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_NAME = '${tabela}' AND COLUMN_NAME = '${coluna}'`
        )) as any;
        const count = rows?.[0]?.[0]?.cnt ?? rows?.[0]?.cnt ?? 0;
        if (Number(count) > 0) {
          resultados.push(`${tabela}.${coluna}: já existe`);
          continue;
        }
        await database.execute(sql.raw(`ALTER TABLE \`${tabela}\` ADD COLUMN \`${coluna}\` ${tipo}`));
        resultados.push(`${tabela}.${coluna}: criada`);
      } catch (e: any) {
        if (e?.message?.includes('Duplicate column') || e?.message?.includes('already exists')) {
          resultados.push(`${tabela}.${coluna}: já existia`);
        } else {
          resultados.push(`${tabela}.${coluna}: ERRO - ${e?.message}`);
        }
      }
    }
    return { success: true, resultados };
  }),

  // ── RELATÓRIO CONSOLIDADO: Gerar relatório com IA ──
  gerarRelatorioIA: protectedProcedure
    .input(z.object({
      candidatoId: z.number(),
      observacao: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const [candidate] = await database
        .select()
        .from(processoCandidatos)
        .where(eq(processoCandidatos.id, input.candidatoId))
        .limit(1);
      if (!candidate) throw new TRPCError({ code: 'NOT_FOUND', message: 'Candidato não encontrado' });
      await ensureProcessAccess(database, ctx.user, candidate.processoId);

      // Buscar entrevista (mesma lógica do dadosRelatorio)
      let entrevista: any = null;
      const [e1] = await database.select().from(processoEntrevistas)
        .where(eq(processoEntrevistas.candidatoId, input.candidatoId))
        .orderBy(desc(processoEntrevistas.createdAt)).limit(1);
      if (e1) entrevista = e1;

      if (!entrevista) {
        const slots = await database.select({ id: processoAgendaSlots.id }).from(processoAgendaSlots)
          .where(eq(processoAgendaSlots.candidatoId, input.candidatoId)).limit(5);
        if (slots.length > 0) {
          const [e2] = await database.select().from(processoEntrevistas)
            .where(inArray(processoEntrevistas.agendaSlotId, slots.map(s => s.id)))
            .orderBy(desc(processoEntrevistas.createdAt)).limit(1);
          if (e2) entrevista = e2;
        }
      }

      if (!entrevista) {
        const rows = await database.select({ e: processoEntrevistas }).from(processoEntrevistas)
          .innerJoin(processoCandidatos, eq(processoCandidatos.id, processoEntrevistas.candidatoId))
          .where(eq(processoCandidatos.email, candidate.email))
          .orderBy(desc(processoEntrevistas.createdAt)).limit(1);
        if (rows.length > 0) entrevista = rows[0].e;
      }

      if (!entrevista) throw new TRPCError({ code: 'NOT_FOUND', message: 'Nenhuma entrevista encontrada para este candidato' });
      if (!(entrevista as any).transcricaoUrl) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nenhuma transcrição enviada para esta entrevista' });

      // Extrair texto da transcrição
      const buffer = await storageDownloadBuffer((entrevista as any).transcricaoUrl);
      const ext = ((entrevista as any).transcricaoNomeArquivo ?? '').split('.').pop()?.toLowerCase() || 'txt';
      let transcricaoTexto = '';
      if (ext === 'txt') {
        transcricaoTexto = buffer.toString('utf-8');
      } else if (ext === 'pdf') {
        try {
          const pdfParse = (await import('pdf-parse')).default;
          const parsed = await pdfParse(buffer);
          transcricaoTexto = parsed.text;
        } catch {
          // fallback: tentar extrair texto bruto do PDF
          transcricaoTexto = buffer.toString('latin1').replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
        }
      } else if (ext === 'docx' || ext === 'doc') {
        try {
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ buffer });
          transcricaoTexto = result.value;
        } catch {
          // fallback: extrair texto do XML interno do docx (é um ZIP)
          try {
            const AdmZip = (await import('adm-zip')).default;
            const zip = new AdmZip(buffer);
            const entry = zip.getEntry('word/document.xml');
            if (entry) {
              const xml = entry.getData().toString('utf-8');
              transcricaoTexto = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            }
          } catch {
            transcricaoTexto = buffer.toString('utf-8').replace(/<[^>]+>/g, ' ').replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
          }
        }
      }

      if (!transcricaoTexto.trim()) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Não foi possível extrair texto da transcrição' });

      // Buscar dados complementares
      const [aluno] = await database.select({
        name: alunos.name, cargo: alunos.cargo, minicurriculo: alunos.minicurriculo,
      }).from(alunos).where(eq(alunos.id, candidate.alunoId ?? 0)).limit(1);

      const [disc] = await database.select().from(discResultados)
        .where(eq(discResultados.alunoId, candidate.alunoId ?? 0))
        .orderBy(desc(discResultados.completedAt)).limit(1);

      const autopercepcoes = await database.select({
        nota: autopercepcoesCompetencias.nota,
        competenciaNome: competencias.nome,
      }).from(autopercepcoesCompetencias)
        .leftJoin(competencias, eq(competencias.id, autopercepcoesCompetencias.competenciaId))
        .where(eq(autopercepcoesCompetencias.alunoId, candidate.alunoId ?? 0))
        .orderBy(desc(autopercepcoesCompetencias.nota));

      // Buscar processo, mentor e slot para contexto e assinatura
      const [processoInfo] = await database
        .select({ id: processosSeletivos.id, nome: processosSeletivos.nome, clienteNome: processosSeletivos.clienteNome, mentorId: processosSeletivos.mentorId })
        .from(processosSeletivos)
        .where(eq(processosSeletivos.id, candidate.processoId))
        .limit(1);

      let mentorNomeIA: string | null = null;
      if (processoInfo?.mentorId) {
        const [mentor] = await database.select({ name: users.name }).from(users).where(eq(users.id, processoInfo.mentorId)).limit(1);
        mentorNomeIA = mentor?.name ?? null;
      }

      let slotIA: { dataAgenda: string | null; inicio: string | null; fim: string | null } | null = null;
      if ((entrevista as any)?.agendaSlotId) {
        const [slot] = await database
          .select({ dataAgenda: processoAgendaSlots.dataAgenda, inicio: processoAgendaSlots.inicio, fim: processoAgendaSlots.fim })
          .from(processoAgendaSlots)
          .where(eq(processoAgendaSlots.id, (entrevista as any).agendaSlotId))
          .limit(1);
        slotIA = slot ?? null;
      }

      const [resultadoIA] = await database.select().from(processoResultados)
        .where(eq(processoResultados.candidatoId, input.candidatoId))
        .orderBy(desc(processoResultados.createdAt)).limit(1);

      // Montar contexto
      const statusFinal = resultadoIA?.resultado === 'aprovado' ? 'Habilitado' : resultadoIA?.resultado === 'reprovado' ? 'Não Habilitado' : 'A definir';
      const participantesBancaIA = (entrevista as any)?.participantesBanca ?? resultadoIA?.participantesBanca ?? 'Não informado';
      const dataEntrevista = slotIA?.dataAgenda
        ? new Date(slotIA.dataAgenda + 'T00:00:00').toLocaleDateString('pt-BR')
        : 'Não informada';
      const horarioEntrevista = slotIA?.inicio ? `${slotIA.inicio}${slotIA.fim ? ' às ' + slotIA.fim : ''}` : 'Não informado';

      const discTexto = disc
        ? `Perfil DISC:\nDominância (D): ${disc.scoreD ?? 0}%\nInfluência (I): ${disc.scoreI ?? 0}%\nEstabilidade (S): ${disc.scoreS ?? 0}%\nConformidade (C): ${disc.scoreC ?? 0}%\nPerfil predominante: ${disc.perfilPredominante ?? 'não identificado'}${disc.perfilSecundario ? ' / Secundário: ' + disc.perfilSecundario : ''}.`
        : 'Perfil DISC: não disponível.';
      const parecerMentorTexto = resultadoIA?.parecer?.trim()
        ? `\n\nParecer do Mentor/Avaliador (justificativa da decisão): ${resultadoIA.parecer}`
        : '';

      const autoPercTexto = autopercepcoes.length > 0
        ? 'Autopercepção de competências (escala 0-10):\n' + autopercepcoes.map(a => `- ${a.competenciaNome}: ${a.nota}/10`).join('\n')
        : 'Autopercepção de competências: não disponível.';

      const observacaoTexto = input.observacao?.trim()
        ? `\n\nObservação adicional para este relatório: ${input.observacao}`
        : '';

      // Chamar IA
      const { invokeLLM } = await import('../_core/llm');
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `Você é uma psicóloga organizacional especialista em avaliação de candidatos para processos seletivos internos e externos, com experiência em análise comportamental, entrevistas por competências e elaboração de pareceres profissionais.

Elabore um Relatório de Avaliação Individual de Candidato completo, com linguagem técnica, objetiva, respeitosa e adequada para apresentação ao cliente.

Orientações de linguagem:
- Use linguagem técnica, profissional e respeitosa.
- Evite termos agressivos, definitivos ou subjetivos demais.
- Não use expressões como "não serve", "fraco", "ruim" ou "sem perfil".
- Prefira expressões como: "ainda não demonstrou maturidade suficiente para a função"; "necessita desenvolver maior segurança na comunicação"; "apresenta potencial, porém ainda requer desenvolvimento em competências essenciais ao cargo"; "demonstrou aderência ao perfil requerido".
- Mantenha coerência entre minicurrículo, DISC, entrevista e conclusão.
- Não invente informações. Quando algum dado não estiver disponível, sinalize discretamente ou não mencione.
- O relatório deve ter tom institucional e estar adequado para envio ao cliente.

Responda APENAS em JSON com exatamente os seguintes campos:
{
  "minicurriculo": "Resumo profissional do candidato em formato de parágrafo, considerando trajetória, formação, experiências anteriores, tempo de atuação, áreas pelas quais passou, principais responsabilidades e experiências relacionadas à função pretendida.",
  "pontosDestaque": "Principais pontos de destaque do candidato organizados em tópicos (use \\n para separar cada tópico), considerando: experiência técnica, conhecimento de rotinas, vivência com normas/controles/processos, capacidade de organização, relacionamento interpessoal, postura profissional, iniciativa, responsabilidade, maturidade e aderência ao contexto.",
  "pontosPositivosDisc": "Principais comportamentos favoráveis observados no perfil DISC, relacionando-os com a função avaliada.",
  "pontosDesenvolvimentoDisc": "Principais aspectos comportamentais que precisam de atenção ou desenvolvimento, especialmente aqueles que possam impactar o desempenho na função pretendida.",
  "parecerEntrevista": "Parecer técnico da entrevista em formato de texto corrido, com tom analítico e profissional, considerando: clareza e objetividade das respostas, capacidade de apresentar exemplos concretos, domínio técnico, postura diante de normas e processos, capacidade de organização, maturidade profissional, comunicação, relacionamento interpessoal, liderança e coerência entre discurso, histórico e DISC.",
  "conclusao": "Conclusão baseada obrigatoriamente no Parecer do Mentor/Avaliador fornecido nos dados. Incorpore e expanda o parecer do mentor com linguagem técnica e profissional. Se Habilitado: reforce a aderência ao perfil e os pontos positivos destacados pelo mentor. Se Não Habilitado: justifique de forma técnica e respeitosa, incorporando os pontos levantados pelo mentor e indicando competências a desenvolver. Objetiva, clara e coerente com o status informado."
}`,
          },
          {
            role: 'user',
            content: `Cliente: ${processoInfo?.clienteNome ?? 'Não informado'}\nProcesso Seletivo: ${processoInfo?.nome ?? 'Não informado'}\nCandidato: ${candidate.nome}\nData da Entrevista: ${dataEntrevista}\nHorário: ${horarioEntrevista}\nStatus Final: ${statusFinal}\nBanca Avaliadora: ${participantesBancaIA}\nMentor/Entrevistador: ${mentorNomeIA ?? 'Não informado'}\n\nMinicurrículo / Histórico Profissional:\n${aluno?.minicurriculo ?? 'Não disponível'}\nCargo atual: ${aluno?.cargo ?? 'Não informado'}\n\n${discTexto}\n\n${autoPercTexto}${parecerMentorTexto}${observacaoTexto}\n\nTranscrição da Entrevista:\n${transcricaoTexto.slice(0, 14000)}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'IA não retornou conteúdo' });

      let parsed: { minicurriculo: string; pontosDestaque: string; pontosPositivosDisc: string; pontosDesenvolvimentoDisc: string; parecerEntrevista: string; conclusao: string };
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao interpretar resposta da IA' });
      }

      // Montar relatório completo em texto estruturado para salvar no banco
      const relatorioCompleto = [
        `RELATÓRIO DE AVALIAÇÃO INDIVIDUAL`,
        ``,
        `1. DADOS GERAIS DO PROCESSO`,
        `Cliente: ${processoInfo?.clienteNome ?? 'Não informado'}`,
        `Processo Seletivo: ${processoInfo?.nome ?? 'Não informado'}`,
        `Candidato: ${candidate.nome}`,
        `Data da Entrevista: ${dataEntrevista}`,
        `Horário: ${horarioEntrevista}`,
        `Status Final: ${statusFinal}`,
        `Banca Avaliadora: ${participantesBancaIA}`,
        `Avaliado por: ${mentorNomeIA ?? 'Não informado'} — Empresa CKM Talents`,
        ``,
        `2. MINICURRÍCULO DO CANDIDATO`,
        parsed.minicurriculo,
        ``,
        `3. PONTOS DE DESTAQUE DO PERFIL PROFISSIONAL`,
        parsed.pontosDestaque,
        ``,
        `4. ANÁLISE DISC / PERFIL COMPORTAMENTAL`,
        ``,
        `4.1 Pontos Positivos Identificados`,
        parsed.pontosPositivosDisc,
        ``,
        `4.2 Pontos a Desenvolver`,
        parsed.pontosDesenvolvimentoDisc,
        ``,
        `5. PARECER DA ENTREVISTA`,
        parsed.parecerEntrevista,
        ``,
        `6. CONCLUSÃO E RECOMENDAÇÃO FINAL`,
        parsed.conclusao,
      ].join('\n');

      // Salvar no banco
      await database.update(processoEntrevistas)
        .set({
          dadosPrincipaisEntrevista: relatorioCompleto,
          analisePerfilComportamental: parsed.conclusao,
          relatorioGeradoEm: new Date(),
          observacaoRevisao: input.observacao ?? null,
        } as any)
        .where(eq(processoEntrevistas.id, (entrevista as any).id));

      await writeLog(database, {
        processoId: candidate.processoId,
        candidatoId: input.candidatoId,
        userId: ctx.user.id,
        acao: 'relatorio_ia_gerado',
        detalhe: `Relatório IA gerado para ${candidate.nome}`,
      });

      return {
        success: true,
        dadosPrincipaisEntrevista: relatorioCompleto,
        analisePerfilComportamental: parsed.conclusao,
        mentorNome: mentorNomeIA,
        processoNome: processoInfo?.nome ?? null,
        clienteNome: processoInfo?.clienteNome ?? null,
        statusFinal,
        dataEntrevista,
        horarioEntrevista,
        participantesBanca: participantesBancaIA,
      };
    }),

  runMigration: protectedProcedure.mutation(async ({ ctx }) => {
    requireCkmAdmin(ctx.user.role);
    const database = await requireDatabase();
    try {
      // Verificar se a coluna já existe no information_schema
      const rows = await database.execute(sql.raw(
        "SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_NAME = 'processos_seletivos' AND COLUMN_NAME = 'comunicado'"
      )) as any;
      const count = rows?.[0]?.[0]?.cnt ?? rows?.[0]?.cnt ?? 0;
      if (Number(count) > 0) {
        return { success: true, message: 'Coluna comunicado já existe no banco' };
      }
      // Criar a coluna sem IF NOT EXISTS (compatível com TiDB)
      await database.execute(sql.raw(
        "ALTER TABLE `processos_seletivos` ADD COLUMN `comunicado` longtext NULL"
      ));
      return { success: true, message: 'Coluna comunicado criada com sucesso' };
    } catch (e: any) {
      if (e?.message?.includes('Duplicate column') || e?.message?.includes('already exists')) {
        return { success: true, message: 'Coluna comunicado já existia' };
      }
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: e?.message ?? 'Erro na migration' });
    }
  }),
});
