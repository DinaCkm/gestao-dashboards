import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import {
  alunos,
  alunoAcessoToken,
  alunoCursoAtribuido,
  atividadesCurso,
  avaliacoesAtividade,
  competencias,
  consultors,
  cursosCompetencias,
  onboardingJornada,
  tentativasAvaliacao,
} from "../../drizzle/schema";

// ============================================================================
// ALUNOS AUTÔNOMOS
//
// Fluxo do administrador:
//   1. Cria a avaliação diagnóstica do CURSO (exatamente 10 questões + gabarito)
//   2. Libera o curso para um aluno -> gera o link de acesso com token
//
// Fluxo do aluno (via link, sem senha):
//   cadastro -> avaliação diagnóstica -> mural com o curso liberado -> performance
// ============================================================================

const QTD_QUESTOES_DIAGNOSTICO = 10;

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

export const alunosAutonomosRouter = router({
  // ==========================================================================
  // ADMIN — AVALIAÇÃO DIAGNÓSTICA DO CURSO
  // ==========================================================================

  /** Lista as avaliações diagnósticas já cadastradas (opcionalmente de um curso). */
  // ==========================================================================
  // Dados de apoio para os dropdowns da tela admin (competência -> curso, mentores)
  // ==========================================================================
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

  /** Cria a avaliação diagnóstica de um curso — exatamente 10 questões. */
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

      if (input.questoes.length !== QTD_QUESTOES_DIAGNOSTICO) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `A avaliação diagnóstica deve ter exatamente ${QTD_QUESTOES_DIAGNOSTICO} questões. Recebido: ${input.questoes.length}.`,
        });
      }

      // Gabarito precisa existir entre as opções
      for (const q of input.questoes) {
        if (!q.opcoes.includes(q.respostaCorreta)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Questão "${q.id}": a resposta correta não está entre as alternativas.`,
          });
        }
      }

      // Impede duplicidade de diagnóstico ativo por curso
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
          message:
            "Este curso já possui uma avaliação diagnóstica ativa. Edite a existente ou desative-a antes de criar outra.",
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

  /** Atualiza a avaliação diagnóstica (título, questões, nota mínima). */
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

      if (input.questoes !== undefined) {
        if (input.questoes.length !== QTD_QUESTOES_DIAGNOSTICO) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `A avaliação diagnóstica deve ter exatamente ${QTD_QUESTOES_DIAGNOSTICO} questões.`,
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
        updates.questoes = JSON.stringify(input.questoes);
      }

      if (Object.keys(updates).length === 0) {
        return { success: true, alterado: false };
      }

      await database
        .update(avaliacoesAtividade)
        .set(updates)
        .where(
          and(
            eq(avaliacoesAtividade.id, input.avaliacaoId),
            eq(avaliacoesAtividade.tipo, "diagnostico_inicial")
          )
        );

      return { success: true, alterado: true };
    }),

  /** Desativa a avaliação diagnóstica (soft delete). */
  desativarDiagnostico: protectedProcedure
    .input(z.object({ avaliacaoId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      const database = await requireDatabase();

      await database
        .update(avaliacoesAtividade)
        .set({ isActive: 0 })
        .where(
          and(
            eq(avaliacoesAtividade.id, input.avaliacaoId),
            eq(avaliacoesAtividade.tipo, "diagnostico_inicial")
          )
        );

      return { success: true };
    }),

  // ==========================================================================
  // ADMIN — LIBERAÇÃO DO CURSO E GERAÇÃO DO LINK
  // ==========================================================================

  /**
   * Libera um curso para um aluno autônomo e gera o link de acesso.
   * O curso nasce com status 'aguardando_avaliacao' (trancado no Mural)
   * e só destrava quando o aluno conclui o diagnóstico.
   */
  /**
   * Cadastra um aluno autônomo com o MÍNIMO que o admin possui: nome + email.
   * CPF fica NULL — quem informa é o próprio aluno na ficha (etapa 1 do link).
   * canLogin = 0 até a ficha ser confirmada; até lá o único acesso é pelo token.
   */
  cadastrarAlunoAutonomo: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3).max(255),
        email: z.string().email().max(320),
        programId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      const database = await requireDatabase();

      const email = input.email.toLowerCase().trim();

      // E-mail é metade da credencial de login (email + CPF) — não pode duplicar
      const [existente] = await database
        .select({ id: alunos.id, name: alunos.name, tipoPortal: alunos.tipoPortal })
        .from(alunos)
        .where(eq(alunos.email, email))
        .limit(1);

      if (existente) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Já existe um aluno cadastrado com este e-mail: ${existente.name}. Use o aluno existente para liberar o curso.`,
        });
      }

      const resultado = await database.insert(alunos).values({
        name: input.name.trim(),
        email,
        cpf: null, // preenchido pelo próprio aluno na ficha
        tipoPortal: "aluno_autonomo",
        canLogin: 0, // liberado somente após confirmar a ficha
        isActive: 1,
        cadastradoPorAdmin: 1,
        programId: input.programId ?? null,
      });

      const alunoId = Number((resultado as any)[0]?.insertId ?? 0);
      if (!alunoId) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao cadastrar o aluno." });
      }

      return { success: true, alunoId, name: input.name.trim(), email };
    }),

  /**
   * Regenera o link de acesso do aluno (caso ele tenha perdido o e-mail).
   * Necessário porque, antes de confirmar a ficha, o aluno ainda não tem CPF
   * gravado e portanto não consegue entrar pelo login normal.
   */
  regenerarLinkAcesso: protectedProcedure
    .input(
      z.object({
        alunoId: z.number().int().positive(),
        diasValidadeLink: z.number().int().min(1).max(365).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      const database = await requireDatabase();

      const [tokenAtual] = await database
        .select()
        .from(alunoAcessoToken)
        .where(eq(alunoAcessoToken.alunoId, input.alunoId))
        .orderBy(desc(alunoAcessoToken.createdAt))
        .limit(1);

      if (!tokenAtual) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Este aluno ainda não teve nenhum curso liberado. Libere um curso primeiro.",
        });
      }

      const token = gerarToken();
      const expiraEm = input.diasValidadeLink
        ? new Date(Date.now() + input.diasValidadeLink * 24 * 60 * 60 * 1000)
        : null;

      // O mais recente sempre prevalece — desativa os anteriores
      await database
        .update(alunoAcessoToken)
        .set({ isActive: 0 })
        .where(eq(alunoAcessoToken.alunoId, input.alunoId));

      await database.insert(alunoAcessoToken).values({
        alunoId: input.alunoId,
        cursoAtribuidoId: tokenAtual.cursoAtribuidoId,
        token,
        // Preserva a etapa em que o aluno parou
        etapaAtual: tokenAtual.etapaAtual,
        expiraEm,
        isActive: 1,
        criadoPorUserId: (ctx as any)?.user?.id ?? null,
      });

      return {
        success: true,
        token,
        caminhoAcesso: `/acesso/${token}`,
        etapaAtual: tokenAtual.etapaAtual,
        expiraEm,
      };
    }),

  liberarCursoParaAluno: protectedProcedure
    .input(
      z.object({
        alunoId: z.number().int().positive(),
        cursoId: z.number().int().positive(),
        competenciaId: z.number().int().positive(),
        mentorId: z.number().int().positive(),
        dataPrazo: z.string().min(1), // ISO date
        diasValidadeLink: z.number().int().min(1).max(365).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      const database = await requireDatabase();

      // 1. Curso precisa ter avaliação diagnóstica ativa
      const [diagnostico] = await database
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

      if (!diagnostico) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Este curso ainda não tem avaliação diagnóstica cadastrada. Crie a avaliação de 10 questões antes de liberar o curso ao aluno.",
        });
      }

      // 2. Marca o aluno como autônomo
      await database
        .update(alunos)
        .set({ tipoPortal: "aluno_autonomo" })
        .where(eq(alunos.id, input.alunoId));

      // 3. Cria (ou reaproveita) a atribuição do curso, trancada
      const [atribuicaoExistente] = await database
        .select({ id: alunoCursoAtribuido.id, status: alunoCursoAtribuido.status })
        .from(alunoCursoAtribuido)
        .where(
          and(
            eq(alunoCursoAtribuido.alunoId, input.alunoId),
            eq(alunoCursoAtribuido.cursoId, input.cursoId)
          )
        )
        .limit(1);

      let cursoAtribuidoId: number;

      if (atribuicaoExistente) {
        cursoAtribuidoId = atribuicaoExistente.id;
        await database
          .update(alunoCursoAtribuido)
          .set({
            competenciaId: input.competenciaId,
            mentorId: input.mentorId,
            dataPrazo: new Date(input.dataPrazo),
            avaliacaoDiagnosticaId: diagnostico.id,
          })
          .where(eq(alunoCursoAtribuido.id, cursoAtribuidoId));
      } else {
        const resultado = await database.insert(alunoCursoAtribuido).values({
          alunoId: input.alunoId,
          cursoId: input.cursoId,
          competenciaId: input.competenciaId,
          mentorId: input.mentorId,
          dataPrazo: new Date(input.dataPrazo),
          status: "aguardando_avaliacao",
          avaliacaoDiagnosticaId: diagnostico.id,
        });
        cursoAtribuidoId = Number((resultado as any)[0]?.insertId ?? 0);
      }

      // 4. Gera o token de acesso
      const token = gerarToken();
      const expiraEm = input.diasValidadeLink
        ? new Date(Date.now() + input.diasValidadeLink * 24 * 60 * 60 * 1000)
        : null;

      // Desativa tokens anteriores do aluno (o mais recente sempre prevalece)
      await database
        .update(alunoAcessoToken)
        .set({ isActive: 0 })
        .where(eq(alunoAcessoToken.alunoId, input.alunoId));

      await database.insert(alunoAcessoToken).values({
        alunoId: input.alunoId,
        cursoAtribuidoId,
        token,
        etapaAtual: "cadastro",
        expiraEm,
        isActive: 1,
        criadoPorUserId: (ctx as any)?.user?.id ?? null,
      });

      return {
        success: true,
        cursoAtribuidoId,
        token,
        caminhoAcesso: `/acesso/${token}`,
        expiraEm,
      };
    }),

  /** Lista os alunos autônomos, com status da jornada e o link de acesso. */
  listarAlunosAutonomos: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx);
    const database = await requireDatabase();

    const linhas = await database
      .select({
        alunoId: alunos.id,
        nome: alunos.name,
        email: alunos.email,
        token: alunoAcessoToken.token,
        etapaAtual: alunoAcessoToken.etapaAtual,
        expiraEm: alunoAcessoToken.expiraEm,
        ultimoAcessoEm: alunoAcessoToken.ultimoAcessoEm,
        cursoAtribuidoId: alunoCursoAtribuido.id,
        cursoId: alunoCursoAtribuido.cursoId,
        cursoTitulo: cursosCompetencias.titulo,
        statusCurso: alunoCursoAtribuido.status,
        notaDiagnostica: alunoCursoAtribuido.notaDiagnostica,
        diagnosticoConcluidoEm: alunoCursoAtribuido.diagnosticoConcluidoEm,
      })
      .from(alunos)
      .leftJoin(
        alunoAcessoToken,
        and(eq(alunoAcessoToken.alunoId, alunos.id), eq(alunoAcessoToken.isActive, 1))
      )
      .leftJoin(alunoCursoAtribuido, eq(alunoCursoAtribuido.id, alunoAcessoToken.cursoAtribuidoId))
      .leftJoin(cursosCompetencias, eq(cursosCompetencias.id, alunoCursoAtribuido.cursoId))
      .where(eq(alunos.tipoPortal, "aluno_autonomo"))
      .orderBy(desc(alunos.createdAt));

    return linhas;
  }),

  // ==========================================================================
  // ALUNO — ACESSO PÚBLICO POR TOKEN (sem senha)
  // ==========================================================================

  /** Resolve o token e informa em que etapa da jornada o aluno está. */
  obterAcessoPorToken: publicProcedure
    .input(z.object({ token: z.string().min(10).max(64) }))
    .query(async ({ input }) => {
      const database = await requireDatabase();

      const [acesso] = await database
        .select({
          id: alunoAcessoToken.id,
          alunoId: alunoAcessoToken.alunoId,
          cursoAtribuidoId: alunoAcessoToken.cursoAtribuidoId,
          etapaAtual: alunoAcessoToken.etapaAtual,
          expiraEm: alunoAcessoToken.expiraEm,
          isActive: alunoAcessoToken.isActive,
          alunoNome: alunos.name,
          alunoEmail: alunos.email,
        })
        .from(alunoAcessoToken)
        .innerJoin(alunos, eq(alunos.id, alunoAcessoToken.alunoId))
        .where(eq(alunoAcessoToken.token, input.token))
        .limit(1);

      if (!acesso || acesso.isActive !== 1) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Link de acesso inválido ou desativado." });
      }
      if (acesso.expiraEm && new Date(acesso.expiraEm) < new Date()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Este link de acesso expirou." });
      }

      // Registra o acesso
      await database
        .update(alunoAcessoToken)
        .set({
          ultimoAcessoEm: new Date(),
          ...(acesso.etapaAtual === "cadastro" ? { usadoPrimeiraVezEm: new Date() } : {}),
        })
        .where(eq(alunoAcessoToken.id, acesso.id));

      // Dados do curso liberado
      let curso: { id: number; titulo: string; status: string } | null = null;
      if (acesso.cursoAtribuidoId) {
        const [linha] = await database
          .select({
            id: alunoCursoAtribuido.cursoId,
            status: alunoCursoAtribuido.status,
            titulo: cursosCompetencias.titulo,
          })
          .from(alunoCursoAtribuido)
          .leftJoin(cursosCompetencias, eq(cursosCompetencias.id, alunoCursoAtribuido.cursoId))
          .where(eq(alunoCursoAtribuido.id, acesso.cursoAtribuidoId))
          .limit(1);
        if (linha) {
          curso = { id: linha.id, titulo: linha.titulo ?? "Curso", status: linha.status };
        }
      }

      return {
        alunoId: acesso.alunoId,
        alunoNome: acesso.alunoNome,
        alunoEmail: acesso.alunoEmail,
        etapaAtual: acesso.etapaAtual,
        cursoAtribuidoId: acesso.cursoAtribuidoId,
        curso,
      };
    }),

  /** Etapa 1 — aluno confirma/preenche a ficha de cadastro. */
  salvarCadastroPorToken: publicProcedure
    .input(
      z.object({
        token: z.string().min(10).max(64),
        // CPF é obrigatório: junto com o e-mail, forma a credencial dos próximos logins
        cpf: z.string().min(11).max(14),
        telefone: z.string().max(20).optional(),
        cargo: z.string().max(255).optional(),
        areaAtuacao: z.string().max(255).optional(),
        dataNascimento: z.string().optional(),
        minicurriculo: z.string().optional(),
        quemEVoce: z.string().optional(),
        linkedinUrl: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const database = await requireDatabase();

      const [acesso] = await database
        .select()
        .from(alunoAcessoToken)
        .where(and(eq(alunoAcessoToken.token, input.token), eq(alunoAcessoToken.isActive, 1)))
        .limit(1);

      if (!acesso) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Link de acesso inválido." });
      }

      // --- Validação do CPF -------------------------------------------------
      const cpf = normalizarCpf(input.cpf);
      if (!cpfValido(cpf)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "CPF inválido. Confira os números digitados.",
        });
      }

      // CPF duplicado quebraria o login (email + CPF). Bloqueia com mensagem clara.
      const [cpfEmUso] = await database
        .select({ id: alunos.id })
        .from(alunos)
        .where(eq(alunos.cpf, cpf))
        .limit(1);

      if (cpfEmUso && cpfEmUso.id !== acesso.alunoId) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Este CPF já está cadastrado para outro aluno. Entre em contato com o administrador.",
        });
      }
      // ---------------------------------------------------------------------

      const dadosAluno: Record<string, unknown> = {
        cpf,
        canLogin: 1, // a partir daqui o aluno já entra por email + CPF
      };
      if (input.telefone !== undefined) dadosAluno.telefone = input.telefone;
      if (input.cargo !== undefined) dadosAluno.cargo = input.cargo;
      if (input.areaAtuacao !== undefined) dadosAluno.areaAtuacao = input.areaAtuacao;
      if (input.dataNascimento) dadosAluno.dataNascimento = input.dataNascimento;
      if (input.minicurriculo !== undefined) dadosAluno.minicurriculo = input.minicurriculo;
      if (input.quemEVoce !== undefined) dadosAluno.quemEVoce = input.quemEVoce;
      if (input.linkedinUrl !== undefined) dadosAluno.linkedinUrl = input.linkedinUrl;

      await database.update(alunos).set(dadosAluno).where(eq(alunos.id, acesso.alunoId));

      // Reaproveita onboarding_jornada para registrar a confirmação do cadastro
      const [jornada] = await database
        .select({ id: onboardingJornada.id })
        .from(onboardingJornada)
        .where(eq(onboardingJornada.alunoId, acesso.alunoId))
        .limit(1);

      if (jornada) {
        await database
          .update(onboardingJornada)
          .set({ cadastroConfirmado: 1, cadastroConfirmadoEm: new Date() })
          .where(eq(onboardingJornada.id, jornada.id));
      } else {
        await database.insert(onboardingJornada).values({
          alunoId: acesso.alunoId,
          cadastroConfirmado: 1,
          cadastroConfirmadoEm: new Date(),
        });
      }

      // Avança a jornada para a avaliação
      await database
        .update(alunoAcessoToken)
        .set({ etapaAtual: "avaliacao" })
        .where(eq(alunoAcessoToken.id, acesso.id));

      return { success: true, proximaEtapa: "avaliacao" as const };
    }),

  /** Etapa 2 — devolve as 10 questões do diagnóstico SEM o gabarito. */
  obterDiagnosticoPorToken: publicProcedure
    .input(z.object({ token: z.string().min(10).max(64) }))
    .query(async ({ input }) => {
      const database = await requireDatabase();

      const [acesso] = await database
        .select()
        .from(alunoAcessoToken)
        .where(and(eq(alunoAcessoToken.token, input.token), eq(alunoAcessoToken.isActive, 1)))
        .limit(1);

      if (!acesso || !acesso.cursoAtribuidoId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Link de acesso inválido." });
      }

      const [atribuicao] = await database
        .select({
          cursoId: alunoCursoAtribuido.cursoId,
          avaliacaoDiagnosticaId: alunoCursoAtribuido.avaliacaoDiagnosticaId,
        })
        .from(alunoCursoAtribuido)
        .where(eq(alunoCursoAtribuido.id, acesso.cursoAtribuidoId))
        .limit(1);

      if (!atribuicao?.avaliacaoDiagnosticaId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nenhuma avaliação diagnóstica vinculada a este curso.",
        });
      }

      const [avaliacao] = await database
        .select()
        .from(avaliacoesAtividade)
        .where(eq(avaliacoesAtividade.id, atribuicao.avaliacaoDiagnosticaId))
        .limit(1);

      if (!avaliacao) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação diagnóstica não encontrada." });
      }

      return {
        avaliacaoId: avaliacao.id,
        titulo: avaliacao.titulo,
        // Diagnóstico aplica as 10 questões — sem sorteio
        questoes: sanitizarQuestoesParaAluno(parseQuestoes(avaliacao.questoes)),
      };
    }),

  /**
   * Etapa 2 — corrige o diagnóstico, grava a tentativa e DESTRAVA o curso.
   * Devolve a análise de profundidade do conhecimento (questão a questão).
   */
  responderDiagnosticoPorToken: publicProcedure
    .input(
      z.object({
        token: z.string().min(10).max(64),
        respostas: z.array(
          z.object({
            questaoId: z.string().min(1),
            resposta: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const database = await requireDatabase();

      const [acesso] = await database
        .select()
        .from(alunoAcessoToken)
        .where(and(eq(alunoAcessoToken.token, input.token), eq(alunoAcessoToken.isActive, 1)))
        .limit(1);

      if (!acesso || !acesso.cursoAtribuidoId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Link de acesso inválido." });
      }

      const [atribuicao] = await database
        .select({
          id: alunoCursoAtribuido.id,
          cursoId: alunoCursoAtribuido.cursoId,
          avaliacaoDiagnosticaId: alunoCursoAtribuido.avaliacaoDiagnosticaId,
        })
        .from(alunoCursoAtribuido)
        .where(eq(alunoCursoAtribuido.id, acesso.cursoAtribuidoId))
        .limit(1);

      if (!atribuicao?.avaliacaoDiagnosticaId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação diagnóstica não vinculada." });
      }

      const [avaliacao] = await database
        .select()
        .from(avaliacoesAtividade)
        .where(eq(avaliacoesAtividade.id, atribuicao.avaliacaoDiagnosticaId))
        .limit(1);

      if (!avaliacao) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação diagnóstica não encontrada." });
      }

      const questoes = parseQuestoes(avaliacao.questoes);
      const mapaRespostas = new Map(input.respostas.map((r) => [r.questaoId, r.resposta]));

      // Correção questão a questão — base da "análise de profundidade"
      const detalhamento = questoes.map((q, i) => {
        const questaoId = String(q?.id ?? i + 1);
        const respostaAluno = mapaRespostas.get(questaoId) ?? "";
        const acertou = respostaAluno === String(q?.respostaCorreta ?? "");
        return {
          questaoId,
          enunciado: String(q?.enunciado ?? ""),
          respostaAluno,
          respostaCorreta: String(q?.respostaCorreta ?? ""),
          acertou,
        };
      });

      const acertos = detalhamento.filter((d) => d.acertou).length;
      const total = questoes.length || QTD_QUESTOES_DIAGNOSTICO;
      const percentual = Number(((acertos / total) * 100).toFixed(2)); // escala 0-100
      const nota010 = Number(((acertos / total) * 10).toFixed(1)); // escala 0-10

      // Grava a tentativa reaproveitando a tabela existente
      await database.insert(tentativasAvaliacao).values({
        alunoId: acesso.alunoId,
        atividadeId: null,
        cursoId: atribuicao.cursoId,
        tipo: "diagnostico_inicial",
        avaliacaoId: avaliacao.id,
        questoesSelecionadas: JSON.stringify(questoes.map((q, i) => String(q?.id ?? i + 1))),
        respostasAluno: JSON.stringify(input.respostas),
        nota: String(nota010),
        aprovado: 0, // diagnóstico é de sondagem — não reprova ninguém
      });

      // DESTRAVA o curso e registra a nota diagnóstica
      await database
        .update(alunoCursoAtribuido)
        .set({
          status: "nao_iniciado",
          notaDiagnostica: String(percentual),
          diagnosticoConcluidoEm: new Date(),
        })
        .where(eq(alunoCursoAtribuido.id, atribuicao.id));

      await database
        .update(alunoAcessoToken)
        .set({ etapaAtual: "liberado" })
        .where(eq(alunoAcessoToken.id, acesso.id));

      // Faixa de profundidade do conhecimento prévio — régua oficial (baseada em acertos de 10)
      let nivel: "primeiros_passos" | "inicial" | "em_desenvolvimento" | "adequado" | "excelente";
      if (acertos >= 9) nivel = "excelente";
      else if (acertos >= 7) nivel = "adequado";
      else if (acertos >= 5) nivel = "em_desenvolvimento";
      else if (acertos >= 3) nivel = "inicial";
      else nivel = "primeiros_passos";

      return {
        success: true,
        acertos,
        total,
        percentual,
        nivel,
        detalhamento,
        proximaEtapa: "liberado" as const,
      };
    }),

  /**
   * Cria a sessão do aluno automaticamente após ele concluir o diagnóstico,
   * para cair direto no Mural sem precisar digitar email+CPF de novo.
   * Só funciona quando etapaAtual = 'liberado' (diagnóstico já concluído).
   */
  autoLoginPorToken: publicProcedure
    .input(z.object({ token: z.string().min(10).max(64) }))
    .mutation(async ({ input, ctx }) => {
      const database = await requireDatabase();

      const [acesso] = await database
        .select()
        .from(alunoAcessoToken)
        .where(and(eq(alunoAcessoToken.token, input.token), eq(alunoAcessoToken.isActive, 1)))
        .limit(1);

      if (!acesso || acesso.etapaAtual !== "liberado") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "O acesso ao mural só é liberado após concluir o diagnóstico.",
        });
      }

      const [aluno] = await database
        .select({ id: alunos.id, name: alunos.name, isActive: alunos.isActive, canLogin: alunos.canLogin })
        .from(alunos)
        .where(eq(alunos.id, acesso.alunoId))
        .limit(1);

      if (!aluno || !aluno.isActive || !aluno.canLogin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Aluno inativo ou sem permissão de acesso." });
      }

      const { sdk } = await import("../_core/sdk");
      const { TWO_HOURS_MS } = await import("@shared/const");
      const alunoOpenId = `aluno_${aluno.id}`;

      let alunoUser = await sdk.getUserByOpenId(alunoOpenId);
      if (!alunoUser) {
        await db.upsertUser({
          openId: alunoOpenId,
          name: aluno.name,
          email: null,
          role: "user",
          alunoId: aluno.id,
          loginMethod: "aluno_autonomo",
          isActive: 1,
        } as any);
        alunoUser = await sdk.getUserByOpenId(alunoOpenId);
      }

      if (!alunoUser) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao preparar sessão do aluno." });
      }

      const token = await sdk.createSessionToken(alunoUser.openId, {
        name: aluno.name || "",
        expiresInMs: TWO_HOURS_MS,
      });
      const cookieOptions = getSessionCookieOptions((ctx as any).req);
      (ctx as any).res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: TWO_HOURS_MS });

      return { success: true };
    }),

  // ==========================================================================
  // ALUNO — PERFORMANCE (evolução: conhecimento prévio x aproveitamento)
  // ==========================================================================

  /**
   * Evolução do aluno no curso.
   * IMPORTANTE: a média das avaliações dos conteúdos NÃO é recalculada aqui —
   * reaproveita a mesma regra já existente em syncStudentPerformanceFromPlatform:
   * média das notaFinal das atividades que possuem avaliação (divisor = qtd com nota).
   */
  evolucaoNoCurso: protectedProcedure
    .input(z.object({ cursoAtribuidoId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const database = await requireDatabase();

      const [atribuicao] = await database
        .select({
          id: alunoCursoAtribuido.id,
          alunoId: alunoCursoAtribuido.alunoId,
          cursoId: alunoCursoAtribuido.cursoId,
          status: alunoCursoAtribuido.status,
          notaDiagnostica: alunoCursoAtribuido.notaDiagnostica,
          diagnosticoConcluidoEm: alunoCursoAtribuido.diagnosticoConcluidoEm,
          cursoTitulo: cursosCompetencias.titulo,
        })
        .from(alunoCursoAtribuido)
        .leftJoin(cursosCompetencias, eq(cursosCompetencias.id, alunoCursoAtribuido.cursoId))
        .where(eq(alunoCursoAtribuido.id, input.cursoAtribuidoId))
        .limit(1);

      if (!atribuicao) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Curso atribuído não encontrado." });
      }

      // O aluno só enxerga o próprio curso; admin enxerga qualquer um
      const userAlunoId = (ctx as any)?.user?.alunoId;
      if (!isAdmin(ctx) && userAlunoId && userAlunoId !== atribuicao.alunoId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado." });
      }

      const conhecimentoPrevio =
        atribuicao.notaDiagnostica !== null && atribuicao.notaDiagnostica !== undefined
          ? Number(atribuicao.notaDiagnostica)
          : null;

      return {
        cursoAtribuidoId: atribuicao.id,
        cursoId: atribuicao.cursoId,
        cursoTitulo: atribuicao.cursoTitulo ?? "Curso",
        status: atribuicao.status,
        // Ponto de partida — sondagem de 10 questões, antes do curso (escala 0-100)
        conhecimentoPrevio,
        conhecimentoPrevioEm: atribuicao.diagnosticoConcluidoEm,
      };
    }),
});

export default alunosAutonomosRouter;
