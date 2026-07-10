/**
 * EcoDISC 360 - Aderencia Pessoa x Cargo x Cultura
 * Router tRPC do modulo. O DISC legado (disc_respostas / disc_resultados)
 * nunca e alterado por este arquivo - a unica interacao e leitura (somente
 * SELECT) dos resultados ja existentes, usada para consolidar o Perfil DISC
 * da Diretoria a partir dos diretores selecionados pelo RH.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  createAssessment,
  saveAssessmentAnswers,
  getAssessmentById,
  getLatestEmployeeAssessment,
  createRoleProfile,
  listRoleProfiles,
  getRoleProfileById,
  updateRoleProfile,
  criarConvitesCargoRole,
  listarConvitesCargoRole,
  responderConviteCargoPorToken,
  previewCargoConsolidacao,
  consolidateRoleProfile,
  createOrgProfile,
  listOrgProfiles,
  updateOrgProfile,
  calculateAndSaveMatch,
  listMatchesByAluno,
  getManagementMatrix,
  registerGeneratedReport,
  submitCultureSurveyResponse,
  listCultureAssessmentsByOrgProfile,
  previewCultureConsolidation,
  consolidateOrgProfileFromCulture,
  getDashboardCultura,
  getLegacyDiscResultForAluno,
  listDistinctCargosByProgram,
  searchAlunosForSelection,
  criarConvitesCulturaEmpresa,
  listarConvitesCulturaEmpresa,
  getConvitePorToken,
  responderConviteCulturaEmpresa,
  addDiretoriaMembro,
  removeDiretoriaMembro,
  listDiretoriaMembrosComScores,
  previewDiretoriaConsolidacao,
  consolidateDiretoriaFromGrupo,
} from "../disc360Service";
import { DISC360_CULTURE_QUESTIONS } from "../../shared/disc360CultureQuestions";
import { DISC360_ROLE_QUESTIONS, DISC360_ROLE_PERGUNTA_VALIDACAO } from "../../shared/disc360RoleQuestions";

const adminRoles = new Set(["admin", "admin2"]);
const isAdmin = (role?: string | null) => adminRoles.has(role ?? "");
const isManagerOrAdmin = (role?: string | null) => isAdmin(role) || role === "manager";

const requireDatabase = async () => {
  const database = await getDb();
  if (!database) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  }
  return database;
};

const discScoresSchema = z.object({
  D: z.number(),
  I: z.number(),
  S: z.number(),
  C: z.number(),
});

const discDimensionEnum = z.enum(["D", "I", "S", "C"]);
const intensidadeEnum = z.enum(["baixo", "medio", "alto"]);
const intensidadeFemininaEnum = z.enum(["baixa", "media", "alta"]);

export const disc360Router = router({
  // ---------------------------------------------------------------------
  // Perfis de Cargo (DISC do Cargo)
  // ---------------------------------------------------------------------
  createRoleProfile: protectedProcedure
    .input(
      z.object({
        programId: z.number(),
        departmentId: z.number().nullable().optional(),
        cargoNome: z.string().min(1),
        cargoCodigo: z.string().nullable().optional(),
        leaderUserId: z.number().nullable().optional(),
        expectedScores: discScoresSchema,
        perfilEsperado: z.string().nullable().optional(),
        nivelAutonomia: intensidadeEnum.nullable().optional(),
        nivelPressao: intensidadeEnum.nullable().optional(),
        necessidadeRelacionamento: intensidadeFemininaEnum.nullable().optional(),
        necessidadeAnaliseTecnica: intensidadeFemininaEnum.nullable().optional(),
        necessidadeRotinaProcesso: intensidadeFemininaEnum.nullable().optional(),
        descricao: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas lideres, gestores ou administradores podem cadastrar o DISC do cargo.",
        });
      }
      const database = await requireDatabase();
      const insertId = await createRoleProfile(database, {
        ...input,
        createdByUserId: (ctx as any)?.user?.id ?? null,
      } as any);
      return { id: insertId };
    }),

  listRoleProfiles: protectedProcedure
    .input(z.object({ programId: z.number() }))
    .query(async ({ input }) => {
      const database = await requireDatabase();
      return listRoleProfiles(database, input.programId);
    }),

  getRoleProfileById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const database = await requireDatabase();
      return getRoleProfileById(database, input.id);
    }),

  updateRoleProfile: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        departmentId: z.number().nullable().optional(),
        cargoNome: z.string().min(1).optional(),
        cargoCodigo: z.string().nullable().optional(),
        leaderUserId: z.number().nullable().optional(),
        expectedScores: discScoresSchema.optional(),
        perfilEsperado: z.string().nullable().optional(),
        nivelAutonomia: intensidadeEnum.nullable().optional(),
        nivelPressao: intensidadeEnum.nullable().optional(),
        necessidadeRelacionamento: intensidadeFemininaEnum.nullable().optional(),
        necessidadeAnaliseTecnica: intensidadeFemininaEnum.nullable().optional(),
        necessidadeRotinaProcesso: intensidadeFemininaEnum.nullable().optional(),
        descricao: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas lideres, gestores ou administradores podem editar o DISC do cargo.",
        });
      }
      const { id, ...data } = input;
      const database = await requireDatabase();
      return updateRoleProfile(database, id, data as any);
    }),

  criarConvitesCargoRole: protectedProcedure
    .input(
      z.object({
        programId: z.number(),
        cargoProfileId: z.number(),
        convites: z.array(
          z.object({
            papelRespondente: z.enum(["lider", "empregado"]),
            respondentName: z.string().min(1),
            respondentEmail: z.string().email().nullable().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas lideres, gestores ou administradores podem criar convites do Perfil do Cargo.",
        });
      }
      const database = await requireDatabase();
      return criarConvitesCargoRole(database, input);
    }),

  listarConvitesCargoRole: protectedProcedure
    .input(z.object({ cargoProfileId: z.number() }))
    .query(async ({ input }) => {
      const database = await requireDatabase();
      return listarConvitesCargoRole(database, input.cargoProfileId);
    }),

  getConviteCargoPorToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const database = await requireDatabase();
      const convite = await getConvitePorToken(database, input.token);
      if (!convite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Convite nao encontrado." });
      }
      return {
        respondentName: (convite as any).respondentName as string | null,
        papelRespondente: (convite as any).papelRespondente as string | null,
        status: (convite as any).status as string,
        perguntas: DISC360_ROLE_QUESTIONS,
        perguntaValidacao: DISC360_ROLE_PERGUNTA_VALIDACAO,
      };
    }),

  responderConviteCargoPorToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
        respostas: z.array(
          z.object({
            questionId: z.string(),
            maisDimensao: discDimensionEnum,
            menosDimensao: discDimensionEnum,
          })
        ),
        respostaValidacaoDireta: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ input }) => {
      const database = await requireDatabase();
      return responderConviteCargoPorToken(database, input);
    }),

  previewCargoConsolidacao: protectedProcedure
    .input(z.object({ cargoProfileId: z.number() }))
    .query(async ({ input }) => {
      const database = await requireDatabase();
      return previewCargoConsolidacao(database, input.cargoProfileId);
    }),

  consolidateRoleProfile: protectedProcedure
    .input(z.object({ cargoProfileId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas lideres, gestores ou administradores podem consolidar o Perfil do Cargo.",
        });
      }
      const database = await requireDatabase();
      return consolidateRoleProfile(database, input.cargoProfileId);
    }),

  // ---------------------------------------------------------------------
  // Perfis de Empresa/Diretoria (DISC da Empresa/Diretoria)
  // ---------------------------------------------------------------------
  createOrgProfile: protectedProcedure
    .input(
      z.object({
        programId: z.number(),
        departmentId: z.number().nullable().optional(),
        profileType: z.enum(["empresa", "diretoria"]),
        profileName: z.string().min(1),
        expectedScores: discScoresSchema.optional(),
        perfilDesejado: z.string().nullable().optional(),
        culturalDescription: z.string().nullable().optional(),
        competenciasValorizadas: z.array(z.string()).nullable().optional(),
        validFrom: z.string().nullable().optional(),
        validTo: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem cadastrar o DISC da empresa/diretoria.",
        });
      }
      const database = await requireDatabase();
      const insertId = await createOrgProfile(database, {
        ...input,
        expectedScores: input.expectedScores ?? { D: 0, I: 0, S: 0, C: 0 },
        origemPerfil: input.expectedScores ? "manual" : "questionario",
        approvedByUserId: (ctx as any)?.user?.id ?? null,
      } as any);
      return { id: insertId };
    }),

  listOrgProfiles: protectedProcedure
    .input(z.object({ programId: z.number(), includeInactive: z.boolean().optional() }))
    .query(async ({ input }) => {
      const database = await requireDatabase();
      return listOrgProfiles(database, input.programId, input.includeInactive ?? false);
    }),

  // ---------------------------------------------------------------------
  // Questionario de Cultura Comportamental da Empresa
  // ---------------------------------------------------------------------
  getCultureQuestions: protectedProcedure.query(() => DISC360_CULTURE_QUESTIONS),

  submitCultureSurveyResponse: protectedProcedure
    .input(
      z.object({
        programId: z.number(),
        orgProfileId: z.number(),
        respostas: z.array(
          z.object({
            questionId: z.string(),
            maisDimensao: discDimensionEnum,
            menosDimensao: discDimensionEnum,
          })
        ),
        respondentName: z.string().nullable().optional(),
        respondentEmail: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await requireDatabase();
      return submitCultureSurveyResponse(database, {
        ...input,
        respondedByUserId: (ctx as any)?.user?.id ?? null,
      });
    }),

  listCultureAssessments: protectedProcedure
    .input(z.object({ orgProfileId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a lideres, gestores ou administradores." });
      }
      const database = await requireDatabase();
      return listCultureAssessmentsByOrgProfile(database, input.orgProfileId);
    }),

  previewCultureConsolidation: protectedProcedure
    .input(z.object({ orgProfileId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a lideres, gestores ou administradores." });
      }
      const database = await requireDatabase();
      return previewCultureConsolidation(database, input.orgProfileId);
    }),

  getDashboardCultura: protectedProcedure
    .input(z.object({ orgProfileId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a lideres, gestores ou administradores." });
      }
      const database = await requireDatabase();
      return getDashboardCultura(database, input.orgProfileId);
    }),

  consolidateOrgProfileFromCulture: protectedProcedure
    .input(z.object({ orgProfileId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem validar o Perfil DISC oficial da empresa." });
      }
      const database = await requireDatabase();
      return consolidateOrgProfileFromCulture(database, input.orgProfileId);
    }),
  getLegacyDiscResult: protectedProcedure
    .input(z.object({ alunoId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a lideres, gestores ou administradores." });
      }
      const database = await requireDatabase();
      return getLegacyDiscResultForAluno(database, input.alunoId);
    }),

  listDistinctCargos: protectedProcedure
    .input(z.object({ programId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a lideres, gestores ou administradores." });
      }
      const database = await requireDatabase();
      return listDistinctCargosByProgram(database, input.programId);
    }),

  searchAlunosForSelection: protectedProcedure
    .input(
      z.object({
        programId: z.number(),
        departmentId: z.number().optional(),
        cargo: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a lideres, gestores ou administradores." });
      }
      const database = await requireDatabase();
      return searchAlunosForSelection(database, input);
    }),

  addDiretoriaMembro: protectedProcedure
    .input(z.object({ orgProfileId: z.number(), alunoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a lideres, gestores ou administradores." });
      }
      const database = await requireDatabase();
      return addDiretoriaMembro(database, input.orgProfileId, input.alunoId);
    }),

  removeDiretoriaMembro: protectedProcedure
    .input(z.object({ orgProfileId: z.number(), alunoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a lideres, gestores ou administradores." });
      }
      const database = await requireDatabase();
      await removeDiretoriaMembro(database, input.orgProfileId, input.alunoId);
      return { success: true };
    }),

  listDiretoriaMembros: protectedProcedure
    .input(z.object({ orgProfileId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a lideres, gestores ou administradores." });
      }
      const database = await requireDatabase();
      return listDiretoriaMembrosComScores(database, input.orgProfileId);
    }),

  previewDiretoriaConsolidacao: protectedProcedure
    .input(z.object({ orgProfileId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a lideres, gestores ou administradores." });
      }
      const database = await requireDatabase();
      return previewDiretoriaConsolidacao(database, input.orgProfileId);
    }),

  consolidateDiretoriaFromGrupo: protectedProcedure
    .input(z.object({ orgProfileId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem validar o Perfil DISC da Diretoria." });
      }
      const database = await requireDatabase();
      return consolidateDiretoriaFromGrupo(database, input.orgProfileId);
    }),

  updateOrgProfile: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        profileType: z.enum(["empresa", "diretoria"]).optional(),
        profileName: z.string().min(1).optional(),
        expectedScores: discScoresSchema.optional(),
        perfilDesejado: z.string().nullable().optional(),
        culturalDescription: z.string().nullable().optional(),
        competenciasValorizadas: z.array(z.string()).nullable().optional(),
        validFrom: z.string().nullable().optional(),
        validTo: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem editar o DISC da empresa/diretoria.",
        });
      }
      const { id, isActive, ...rest } = input;
      const database = await requireDatabase();
      const updateData: Record<string, any> = { ...rest };
      if (isActive !== undefined) {
        updateData.isActive = isActive ? 1 : 0;
      }
      return updateOrgProfile(database, id, updateData as any);
    }),

  // ---------------------------------------------------------------------
  // DISC do Empregado
  // ---------------------------------------------------------------------
  getEmployeeAssessment: protectedProcedure
    .input(z.object({ alunoId: z.number(), programId: z.number() }))
    .query(async ({ input }) => {
      const database = await requireDatabase();
      return getLatestEmployeeAssessment(database, input.alunoId, input.programId);
    }),

  createEmployeeAssessment: protectedProcedure
    .input(
      z.object({
        programId: z.number(),
        alunoId: z.number(),
        scores: discScoresSchema,
        rawScores: z.record(z.number()).nullable().optional(),
        perfilPredominante: discDimensionEnum.nullable().optional(),
        perfilSecundario: discDimensionEnum.nullable().optional(),
        indiceConsistencia: z.number().nullable().optional(),
        alertaBaixaDiferenciacao: z.boolean().optional(),
        answers: z
          .array(
            z.object({
              blocoIndex: z.number(),
              maisId: z.string(),
              menosId: z.string(),
              maisDimensao: discDimensionEnum,
              menosDimensao: discDimensionEnum,
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { answers, ...assessmentData } = input;
      const database = await requireDatabase();
      const insertId = await createAssessment(database, {
        ...assessmentData,
        assessmentType: "empregado",
        respondedByUserId: (ctx as any)?.user?.id ?? null,
        status: "concluido",
        completedAt: new Date(),
      } as any);
      if (answers && answers.length > 0) {
        await saveAssessmentAnswers(database, insertId, answers as any);
      }
      return { id: insertId };
    }),

  // ---------------------------------------------------------------------
  // Matches (calculo de aderencia)
  // ---------------------------------------------------------------------
  calculateMatch: protectedProcedure
    .input(
      z.object({
        programId: z.number(),
        alunoId: z.number(),
        employeeAssessmentId: z.number(),
        cargoProfileId: z.number().nullable().optional(),
        orgProfileId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas lideres, gestores ou administradores podem calcular matches.",
        });
      }
      const database = await requireDatabase();
      return calculateAndSaveMatch(database, input);
    }),

  listMyMatches: protectedProcedure.query(async ({ ctx }) => {
    const alunoId = (ctx as any)?.user?.alunoId;
    if (!alunoId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Usuario nao esta vinculado a um perfil de colaborador.",
      });
    }
    const database = await requireDatabase();
    return listMatchesByAluno(database, alunoId);
  }),

  listMatchesByAluno: protectedProcedure
    .input(z.object({ alunoId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a lideres, gestores ou administradores." });
      }
      const database = await requireDatabase();
      return listMatchesByAluno(database, input.alunoId);
    }),

  // ---------------------------------------------------------------------
  // Matriz gerencial
  // ---------------------------------------------------------------------
  getManagementMatrix: protectedProcedure
    .input(z.object({ programId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!isManagerOrAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a lideres, gestores ou administradores." });
      }
      const database = await requireDatabase();
      return getManagementMatrix(database, input.programId);
    }),

  // ---------------------------------------------------------------------
  // Relatorios gerados (controle/rastreabilidade)
  // ---------------------------------------------------------------------
  registerGeneratedReport: protectedProcedure
    .input(
      z.object({
        programId: z.number(),
        alunoId: z.number().nullable().optional(),
        departmentId: z.number().nullable().optional(),
        assessmentId: z.number().nullable().optional(),
        matchId: z.number().nullable().optional(),
        reportType: z.enum([
          "individual",
          "cargo",
          "empresa",
          "diretoria",
          "match",
          "integrado",
          "gerencial",
          "matriz",
        ]),
        fileUrl: z.string().nullable().optional(),
        version: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const insertId = await registerGeneratedReport(database, {
        ...input,
        generatedByUserId: (ctx as any)?.user?.id ?? null,
        generatedAt: new Date(),
        status: "ativo",
      } as any);
      return { id: insertId };
    }),

  // -------------------------------------------------------------------
  // Convite de respondentes - Perfil DISC da Empresa (link sem login)
  // -------------------------------------------------------------------
  criarConvitesCulturaEmpresa: protectedProcedure
    .input(
      z.object({
        programId: z.number(),
        orgProfileId: z.number(),
        convites: z
          .array(
            z.object({
              alunoId: z.number().nullable().optional(),
              respondentName: z.string().min(1),
              respondentEmail: z.string().nullable().optional(),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ input }) => {
      const database = await requireDatabase();
      return criarConvitesCulturaEmpresa(database, input);
    }),

  listarConvitesCulturaEmpresa: protectedProcedure
    .input(z.object({ orgProfileId: z.number() }))
    .query(async ({ input }) => {
      const database = await requireDatabase();
      return listarConvitesCulturaEmpresa(database, input.orgProfileId);
    }),

  getConvitePorToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const database = await requireDatabase();
      const convite = await getConvitePorToken(database, input.token);
      if (!convite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Convite nao encontrado." });
      }
      return {
        respondentName: (convite as any).respondentName as string | null,
        status: (convite as any).status as string,
        perguntas: DISC360_CULTURE_QUESTIONS,
      };
    }),

  responderConvitePorToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
        respostas: z.array(
          z.object({
            questionId: z.string(),
            maisDimensao: discDimensionEnum,
            menosDimensao: discDimensionEnum,
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const database = await requireDatabase();
      return responderConviteCulturaEmpresa(database, input);
    }),
});
