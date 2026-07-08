/**
 * EcoDISC 360 - Servico de acesso a dados (CRUD) do modulo.
 * Mantem isolamento total do DISC legado (disc_respostas / disc_resultados).
 */
import { and, desc, eq } from "drizzle-orm";
import {
  discAssessments,
  discAssessmentAnswers,
  discRoleProfiles,
  discOrgProfiles,
  discMatches,
  discGeneratedReports,
  discCultureSurveyAnswers,
  type InsertDiscAssessment,
  type InsertDiscAssessmentAnswer,
  type InsertDiscRoleProfile,
  type InsertDiscOrgProfile,
  type InsertDiscMatch,
  type InsertDiscGeneratedReport,
} from "../drizzle/schema";
import { calculateFullMatch, type DiscScores } from "./discMatchService";
import {
  calcularDiscCulturaEmpresa,
  calcularDiscEmpresaConsolidado,
  type RespostaCultura,
} from "./discCultureService";
import type { getDb } from "./db";

type DbClient = NonNullable<Awaited<ReturnType<typeof getDb>>>;

// ---------------------------------------------------------------------------
// Assessments (DISC do empregado / cargo / empresa / diretoria)
// ---------------------------------------------------------------------------

export async function createAssessment(database: DbClient, data: InsertDiscAssessment) {
  const result: any = await database.insert(discAssessments).values(data);
  return result?.insertId as number;
}

export async function saveAssessmentAnswers(
  database: DbClient,
  assessmentId: number,
  answers: Omit<InsertDiscAssessmentAnswer, "assessmentId">[]
) {
  if (!answers || answers.length === 0) return;
  await database.insert(discAssessmentAnswers).values(
    answers.map((answer) => ({ ...answer, assessmentId }))
  );
}

export async function getAssessmentById(database: DbClient, assessmentId: number) {
  const [assessment] = await database
    .select()
    .from(discAssessments)
    .where(eq(discAssessments.id, assessmentId))
    .limit(1);
  return assessment ?? null;
}

/**
 * Retorna a aplicacao DISC do empregado mais recente e concluida para um aluno,
 * dentro de um programa/empresa especifico.
 */
export async function getLatestEmployeeAssessment(
  database: DbClient,
  alunoId: number,
  programId: number
) {
  const rows = await database
    .select()
    .from(discAssessments)
    .where(
      and(
        eq(discAssessments.alunoId, alunoId),
        eq(discAssessments.programId, programId),
        eq(discAssessments.assessmentType, "empregado"),
        eq(discAssessments.status, "concluido")
      )
    )
    .orderBy(desc(discAssessments.completedAt))
    .limit(1);
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Perfis de cargo (DISC do Cargo)
// ---------------------------------------------------------------------------

export async function createRoleProfile(database: DbClient, data: InsertDiscRoleProfile) {
  const result: any = await database.insert(discRoleProfiles).values(data);
  return result?.insertId as number;
}

export async function listRoleProfiles(database: DbClient, programId: number) {
  return database
    .select()
    .from(discRoleProfiles)
    .where(and(eq(discRoleProfiles.programId, programId), eq(discRoleProfiles.isActive, 1)))
    .orderBy(desc(discRoleProfiles.createdAt));
}

export async function getRoleProfileById(database: DbClient, id: number) {
  const rows = await database.select().from(discRoleProfiles).where(eq(discRoleProfiles.id, id)).limit(1);
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Perfis de empresa/diretoria (DISC da Empresa/Diretoria)
// ---------------------------------------------------------------------------

export async function createOrgProfile(database: DbClient, data: InsertDiscOrgProfile) {
  const result: any = await database.insert(discOrgProfiles).values(data);
  return result?.insertId as number;
}

export async function listOrgProfiles(database: DbClient, programId: number, includeInactive = false) {
  const condition = includeInactive
    ? eq(discOrgProfiles.programId, programId)
    : and(eq(discOrgProfiles.programId, programId), eq(discOrgProfiles.isActive, 1));
  return database
    .select()
    .from(discOrgProfiles)
    .where(condition)
    .orderBy(desc(discOrgProfiles.createdAt));
}

export async function getOrgProfileById(database: DbClient, id: number) {
  const rows = await database.select().from(discOrgProfiles).where(eq(discOrgProfiles.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateOrgProfile(database: DbClient, id: number, data: Partial<InsertDiscOrgProfile>) {
  await database.update(discOrgProfiles).set(data).where(eq(discOrgProfiles.id, id));
  return getOrgProfileById(database, id);
}

// ---------------------------------------------------------------------------
// Matches (calculo e persistencia)
// ---------------------------------------------------------------------------

export type CalculateAndSaveMatchInput = {
  programId: number;
  alunoId: number;
  employeeAssessmentId: number;
  cargoProfileId?: number | null;
  orgProfileId?: number | null;
};

export async function calculateAndSaveMatch(database: DbClient, input: CalculateAndSaveMatchInput) {
  const assessment = await getAssessmentById(database, input.employeeAssessmentId);
  if (!assessment || !assessment.scores) {
    throw new Error("Aplicacao DISC do empregado nao encontrada ou sem scores calculados.");
  }

  const employeeScores = assessment.scores as unknown as DiscScores;

  const roleProfile = input.cargoProfileId ? await getRoleProfileById(database, input.cargoProfileId) : null;
  const orgProfile = input.orgProfileId ? await getOrgProfileById(database, input.orgProfileId) : null;

  const roleScores = (roleProfile?.expectedScores as unknown as DiscScores | null) ?? null;
  const orgScores = (orgProfile?.expectedScores as unknown as DiscScores | null) ?? null;

  const result = calculateFullMatch(employeeScores, roleScores, orgScores);

  const values: InsertDiscMatch = {
    programId: input.programId,
    alunoId: input.alunoId,
    employeeAssessmentId: input.employeeAssessmentId,
    cargoProfileId: input.cargoProfileId ?? null,
    orgProfileId: input.orgProfileId ?? null,
    matchEmployeeRole: result.matchEmployeeRole !== null ? String(result.matchEmployeeRole) : null,
    matchEmployeeOrg: result.matchEmployeeOrg !== null ? String(result.matchEmployeeOrg) : null,
    matchRoleOrg: result.matchRoleOrg !== null ? String(result.matchRoleOrg) : null,
    matchOverall: result.matchOverall !== null ? String(result.matchOverall) : null,
    classificationEmployeeRole: result.classificationEmployeeRole,
    classificationEmployeeOrg: result.classificationEmployeeOrg,
    classificationRoleOrg: result.classificationRoleOrg,
    classificationOverall: result.classificationOverall,
    strengths: result.strengths as any,
    gaps: result.gaps as any,
    risks: result.risks as any,
    recommendations: result.recommendations as any,
    calculatedAt: new Date(),
  };

  const insertId = await (async () => {
    const res: any = await database.insert(discMatches).values(values);
    return res?.insertId as number;
  })();

  return { id: insertId, ...values };
}

export async function listMatchesByAluno(database: DbClient, alunoId: number) {
  return database
    .select()
    .from(discMatches)
    .where(eq(discMatches.alunoId, alunoId))
    .orderBy(desc(discMatches.createdAt));
}

/**
 * Matriz gerencial: lista os matches mais recentes de todos os colaboradores
 * de um programa/empresa, para visao consolidada do RH/diretoria.
 */
export async function getManagementMatrix(database: DbClient, programId: number) {
  return database
    .select()
    .from(discMatches)
    .where(eq(discMatches.programId, programId))
    .orderBy(desc(discMatches.calculatedAt));
}

// ---------------------------------------------------------------------------
// Relatorios gerados (controle/rastreabilidade)
// ---------------------------------------------------------------------------

export async function registerGeneratedReport(database: DbClient, data: InsertDiscGeneratedReport) {
  const result: any = await database.insert(discGeneratedReports).values(data);
  return result?.insertId as number;
}

// ---------------------------------------------------------------------------
// Questionario de Cultura Comportamental da Empresa (Opcao A) e
// consolidacao do Perfil DISC da Empresa.
// ---------------------------------------------------------------------------

export type SubmitCultureSurveyInput = {
  programId: number;
  orgProfileId: number;
  respostas: RespostaCultura[];
  respondedByUserId?: number | null;
  respondentName?: string | null;
  respondentEmail?: string | null;
};

export async function submitCultureSurveyResponse(database: DbClient, input: SubmitCultureSurveyInput) {
  const resultado = calcularDiscCulturaEmpresa(input.respostas);

  const assessmentId = await createAssessment(database, {
    programId: input.programId,
    orgProfileId: input.orgProfileId,
    assessmentType: "empresa",
    respondedByUserId: input.respondedByUserId ?? null,
    respondentName: input.respondentName ?? null,
    respondentEmail: input.respondentEmail ?? null,
    status: "concluido",
    scores: resultado.scores as any,
    perfilPredominante: resultado.perfilPredominante as any,
    perfilSecundario: resultado.perfilSecundario as any,
    completedAt: new Date(),
  } as any);

  if (input.respostas.length > 0) {
    await database.insert(discCultureSurveyAnswers).values(
      input.respostas.map((resposta) => ({
        assessmentId,
        questionId: resposta.questionId,
        dimensaoEscolhida: resposta.dimensao,
      }))
    );
  }

  return { id: assessmentId, ...resultado };
}

/**
 * Lista as aplicacoes individuais (respondentes) do questionario de cultura
 * ja concluidas para um determinado Perfil DISC da Empresa.
 */
export async function listCultureAssessmentsByOrgProfile(database: DbClient, orgProfileId: number) {
  return database
    .select()
    .from(discAssessments)
    .where(
      and(
        eq(discAssessments.orgProfileId, orgProfileId),
        eq(discAssessments.assessmentType, "empresa"),
        eq(discAssessments.status, "concluido")
      )
    )
    .orderBy(desc(discAssessments.completedAt));
}

/**
 * Calcula a consolidacao do Perfil DISC da Empresa SEM salvar - usado para
 * mostrar uma previa do resultado antes de o admin validar oficialmente.
 */
export async function previewCultureConsolidation(database: DbClient, orgProfileId: number) {
  const assessments = await listCultureAssessmentsByOrgProfile(database, orgProfileId);
  const scoresIndividuais = assessments
    .map((assessment) => assessment.scores as unknown as DiscScores)
    .filter((scores) => !!scores);
  return calcularDiscEmpresaConsolidado(scoresIndividuais);
}

/**
 * Consolida e SALVA o Perfil DISC da Empresa a partir das respostas do
 * questionario de cultura ja recebidas, marcando origemPerfil="questionario".
 */
export async function consolidateOrgProfileFromCulture(database: DbClient, orgProfileId: number) {
  const consolidado = await previewCultureConsolidation(database, orgProfileId);
  await updateOrgProfile(database, orgProfileId, {
    expectedScores: consolidado.scoresMedios as any,
    perfilDesejado: consolidado.perfilSugerido,
    origemPerfil: "questionario",
    statusConsistencia: consolidado.statusConsistencia,
    totalRespondentes: consolidado.totalRespondentes,
  } as any);
  return consolidado;
}
