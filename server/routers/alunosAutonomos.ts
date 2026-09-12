import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { and, desc, eq, inArray, isNull, isNotNull, sql } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { sendEmail, buildBoasVindasAlunoAutonomoEmail, buildConviteAlunoAutonomoEmail } from "../emailService";
import * as db from "../db";
import {
  alunos,
  alunoAcessoToken,
  alunoAtividadeProgresso,
  alunoCursoAtribuido,
  atividadesCurso,
  avaliacoesAtividade,
  competencias,
  consultors,
  cursosCompetencias,
  mentoringSessions,
  discResultados,
  autopercepcoesCompetencias,
  onboardingJornada,
  practicalActivityComments,
  programs,
  tentativasAvaliacao,
  users,
} from "../../drizzle/schema";

// ============================================================================
// ALUNOS AUTÔNOMOS
//
// Fluxo do administrador:
// 1. Cria a avaliação diagnóstica do CURSO (entre 2 e 10 questões + gabarito)
// 2. Libera o curso para um aluno -> gera o link de acesso com token
//
// Fluxo do aluno (via link, sem senha):
// cadastro -> avaliação diagnóstica -> mural com o curso liberado -> performance
// ============================================================================

const MIN_QUESTOES_DIAGNOSTICO = 2;
const MAX_QUESTOES_DIAGNOSTICO = 10;

const questaoSchema = z.object({
  id: z.string().min(1),
  enunciado: z.string().min(1),
  opcoes: z.array(z.string().min(1)).min(2).max(6),
  respostaCorreta: z.string().min(1),
});

async function requireDatabase() {
  const database = await db.getDb();
  if (!database) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
  }
  return database;
}

function isAdmin(ctx: any) {
  const role = ctx?.user?.role;
  return role === "admin" || role === "admin2";
}

function requireAdmin(ctx: any) {
  if (!isAdmin(ctx)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao administrador." });
  }
}

function parseQuestoes(raw: unknown): any[] {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Remove o gabarito antes de enviar as questões ao aluno. */
function sanitizarQuestoesParaAluno(questoes: any[]) {
  return questoes.map((q, i) => ({
    id: String(q?.id ?? i + 1),
    enunciado: String(q?.enunciado ?? ""),
    opcoes: Array.isArray(q?.opcoes) ? q.opcoes.map(String) : [],
  }));
}

function gerarToken() {
  return randomBytes(24).toString("hex"); // 48 chars, cabe em varchar(64)
}

/** Remove máscara do CPF, deixando apenas dígitos. */
function normalizarCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

/**
 * Valida CPF pelos dígitos verificadores.
 * Crítico: um CPF errado aqui trava o login futuro do aluno (email+CPF é a credencial).
 */
function cpfValido(cpfBruto: string): boolean {
  const cpf = normalizarCpf(cpfBruto);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // 00000000000, 11111111111, etc.

  const calcDigito = (qtd: number) => {
    let soma = 0;
    for (let i = 0; i < qtd; i++) {
      soma += Number(cpf[i]) * (qtd + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return calcDigito(9) === Number(cpf[9]) && calcDigito(10) === Number(cpf[10]);
}

/**
 * Determina o nível de profundidade do conhecimento com base no percentual de acertos.
 * Usado tanto pelo diagnóstico via token quanto pelo diagnóstico dentro da área logada.
 */
function calcularNivel(
  acertos: number,
  total: number
): "primeiros_passos" | "inicial" | "em_desenvolvimento" | "adequado" | "excelente" {
  const pct = total > 0 ? (acertos / total) * 100 : 0;
  if (pct >= 90) return "excelente";
  if (pct >= 70) return "adequado";
  if (pct >= 50) return "em_desenvolvimento";
  if (pct >= 30) return "inicial";
  return "primeiros_passos";
}

export const alunosAutonomosRouter = router({
  // ==========================================================================
  // ADMIN — AVALIAÇÃO DIAGNÓSTICA DO CURSO
  // ===========================================================================

  /** Lista as avaliações diagnósticas já cadastradas (opcionalmente de um curso). */
  // ==========================================================================
  // Dados de apoio para os dropdowns da tela admin (competência -> curso, mentores)
  // ===========================================================================
  listarCompetencias: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx);
    const database = await requireDatabase();
    return await database
      .select({ id: competencias.id, nome: competencias.nome })
      .from(competencias)
      .where(eq(competencias.isActive, 1))
      .orderBy(competencias.nome);
  }),

  listarCursosPorCompetencia: protectedProcedure
    .input(z.object({ competenciaId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);
      const database = await requireDatabase();
      return await database
        .select({ id: cursosCompetencias.id, titulo: cursosCompetencias.titulo })
        .from(cursosCompetencias)
        .where(and(eq(cursosCompetencias.competenciaId, input.competenciaId), eq(cursosCompetencias.isActive, 1)))
        .orderBy(cursosCompetencias.ordem, cursosCompetencias.titulo);
    }),

  listarMentores: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx);
    const database = await requireDatabase();
    return await database
      .select({ id: consultors.id, name: consultors.name })
      .from(consultors)
      .where(and(eq(consultors.isActive, 1), eq(consultors.role, "mentor")))
      .orderBy(consultors.name);
  }),

  listarDiagnosticos: protectedProcedure
    .input(z.object({ cursoId: z.number().int().positive().optional() }).default({}))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);
      const database = await requireDatabase();

      const condicoes = [
        eq(avaliacoesAtividade.tipo, "diagnostico_inicial"),
        eq(avaliacoesAtividade.isActive, 1),
      ];
      if (input.cursoId) {
        condicoes.push(eq(avaliacoesAtividade.cursoId, input.cursoId));
      }

      const linhas = await database
        .select({
          id: avaliacoesAtividade.id,
          cursoId: avaliacoesAtividade.cursoId,
          titulo: avaliacoesAtividade.titulo,
          questoes: avaliacoesAtividade.questoes,
          notaMinima: avaliacoesAtividade.notaMinima,
          createdAt: avaliacoesAtividade.createdAt,
          cursoTitulo: cursosCompetencias.titulo,
        })
        .from(avaliacoesAtividade)
        .leftJoin(cursosCompetencias, eq(avaliacoesAtividade.cursoId, cursosCompetencias.id))
        .where(and(...condicoes))
        .orderBy(desc(avaliacoesAtividade.createdAt));

      return linhas.map((l) => ({
        id: l.id,
        cursoId: l.cursoId,
        cursoTitulo: l.cursoTitulo ?? "Curso não encontrado",
        titulo: l.titulo,
        totalQuestoes: parseQuestoes(l.questoes).length,
        notaMinima: Number(l.notaMinima ?? 8),
        createdAt: l.createdAt,
      }));
    }),

  /** Retorna uma avaliação diagnóstica COM gabarito (uso exclusivo do admin). */
  obterDiagnostico: protectedProcedure
    .input(z.object({ avaliacaoId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);
      const database = await requireDatabase();

      const [avaliacao] = await database
        .select()
        .from(avaliacoesAtividade)
        .where(
          and(
            eq(avaliacoesAtividade.id, input.avaliacaoId),
            eq(avaliacoesAtividade.tipo, "diagnostico_inicial")
          )
        )
        .limit(1);

      if (!avaliacao) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação diagnóstica não encontrada." });
      }

      return {
        id: avaliacao.id,
        cursoId: avaliacao.cursoId,
        titulo: avaliacao.titulo,
        notaMinima: Number(avaliacao.notaMinima ?? 8),
        questoes: parseQuestoes(avaliacao.questoes),
      };
    }),

  /** Cria a avaliação diagnóstica de um curso — entre 2 e 10 questões. */
  criarDiagnostico: protectedProcedure
    .input(
      z.object({
        cursoId: z.number().int().positive(),
        titulo: z.string().min(1).max(255),
        questoes: z.array(questaoSchema),
        notaMinima: z.number().min(0).max(10).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      const database = await requireDatabase();

      if (
        input.questoes.length < MIN_QUESTOES_DIAGNOSTICO ||
        input.questoes.length > MAX_QUESTOES_DIAGNOSTICO
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `A avaliação diagnóstica deve ter entre ${MIN_QUESTOES_DIAGNOSTICO} e ${MAX_QUESTOES_DIAGNOSTICO} questões. Recebido: ${input.questoes.length}.`,
        });
      }

      for (const q of input.questoes) {
        if (!q.opcoes.includes(q.respostaCorreta)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Questão "${q.id}": a resposta correta não está entre as alternativas.`,
          });
        }
      }

      const [existente] = await database
        .select({ id: avaliacoesAtividade.id })
        .from(avaliacoesAtividade)
        .where(
          and(
            eq(avaliacoesAtividade.cursoId, input.cursoId),
            eq(avaliacoesAtividade.tipo, "diagnostico_inicial"),
            eq(avaliacoesAtividade.isActive, 1)
          )
        )
        .limit(1);

      if (existente) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este curso já possui uma avaliação diagnóstica ativa. Edite a existente ou desative-a antes de criar outra.",
        });
      }

      const resultado = await database.insert(avaliacoesAtividade).values({
        atividadeId: null,
        cursoId: input.cursoId,
        tipo: "diagnostico_inicial",
        titulo: input.titulo,
        questoes: JSON.stringify(input.questoes),
        notaMinima: String(input.notaMinima ?? 8),
        isActive: 1,
      });

      return { success: true, id: (resultado as any)[0]?.insertId ?? null };
    }),

  atualizarDiagnostico: protectedProcedure
    .input(
      z.object({
        avaliacaoId: z.number().int().positive(),
        titulo: z.string().min(1).max(255).optional(),
        questoes: z.array(questaoSchema).optional(),
        notaMinima: z.number().min(0).max(10).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      const database = await requireDatabase();
      const updates: Record<string, unknown> = {};
      if (input.titulo !== undefined) updates.titulo = input.titulo;
      if (input.notaMinima !== undefined) updates.notaMinima = String(input.notaMinima);
      if (input.questoes !== undefined) updates.questoes = JSON.stringify(input.questoes);
      if (Object.keys(updates).length === 0) return { success: true, alterado: false };
      await database
        .update(avaliacoesAtividade)
        .set(updates)
        .where(and(eq(avaliacoesAtividade.id, input.avaliacaoId), eq(avaliacoesAtividade.tipo, "diagnostico_inicial")));
      return { success: true, alterado: true };
    }),

  desativarDiagnostico: protectedProcedure
    .input(z.object({ avaliacaoId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      const database = await requireDatabase();
      await database
        .update(avaliacoesAtividade)
        .set({ isActive: 0 })
        .where(and(eq(avaliacoesAtividade.id, input.avaliacaoId), eq(avaliacoesAtividade.tipo, "diagnostico_inicial")));
      return { success: true };
    }),

  cursoTemDiagnostico: protectedProcedure
    .input(z.object({ cursoId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);
      const database = await requireDatabase();
      const [diagnostico] = await database
        .select({ id: avaliacoesAtividade.id, titulo: avaliacoesAtividade.titulo })
        .from(avaliacoesAtividade)
        .where(and(eq(avaliacoesAtividade.cursoId, input.cursoId), eq(avaliacoesAtividade.tipo, "diagnostico_inicial"), eq(avaliacoesAtividade.isActive, 1)))
        .limit(1);
      return { temDiagnostico: !!diagnostico, avaliacaoId: diagnostico?.id ?? null, titulo: diagnostico?.titulo ?? null };
    }),

  responderAvaliacaoFinalCurso: protectedProcedure
    .input(
      z.object({
        cursoAtribuidoId: z.number().int().positive(),
        respostas: z.array(z.object({ questaoId: z.string().min(1), resposta: z.string() })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const userAlunoId = (ctx as any)?.user?.alunoId;
      const [atribuicao] = await database
        .select({
          id: alunoCursoAtribuido.id,
          alunoId: alunoCursoAtribuido.alunoId,
          cursoId: alunoCursoAtribuido.cursoId,
          status: alunoCursoAtribuido.status,
          avaliacaoDiagnosticaId: alunoCursoAtribuido.avaliacaoDiagnosticaId,
          notaDiagnostica: alunoCursoAtribuido.notaDiagnostica,
        })
        .from(alunoCursoAtribuido)
        .where(eq(alunoCursoAtribuido.id, input.cursoAtribuidoId))
        .limit(1);

      if (!atribuicao) throw new TRPCError({ code: "NOT_FOUND", message: "Curso atribuído não encontrado." });
      if (!isAdmin(ctx) && userAlunoId && userAlunoId !== atribuicao.alunoId) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado." });
      if (!atribuicao.avaliacaoDiagnosticaId) throw new TRPCError({ code: "NOT_FOUND", message: "Nenhuma avaliação vinculada a este curso." });

      const [avaliacao] = await database
        .select()
        .from(avaliacoesAtividade)
        .where(eq(avaliacoesAtividade.id, atribuicao.avaliacaoDiagnosticaId))
        .limit(1);
      if (!avaliacao) throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação não encontrada." });

      const questoes = parseQuestoes(avaliacao.questoes);
      let acertos = 0;
      const detalhamento = questoes.map((q: any) => {
        const respostaAluno = input.respostas.find((r) => r.questaoId === q.id)?.resposta ?? "";
        const acertou = respostaAluno === q.respostaCorreta;
        if (acertou) acertos++;
        return { questaoId: q.id, enunciado: q.enunciado, acertou, respostaAluno, respostaCorreta: q.respostaCorreta };
      });

      const total = questoes.length;
      const percentual = total > 0 ? (acertos / total) * 100 : 0;
      const nivel = calcularNivel(acertos, total);
      const notaFinal010 = percentual / 10;

      await database
        .update(alunoCursoAtribuido)
        .set({ notaFinal: String(notaFinal010.toFixed(1)) } as any)
        .where(eq(alunoCursoAtribuido.id, input.cursoAtribuidoId));

      return { acertos, total, percentual, nivel, detalhamento };
    }),
});

export default alunosAutonomosRouter;
