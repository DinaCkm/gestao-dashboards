import { eq, and, or, desc, asc, sql, not, gte, lt, lte, ne, inArray, isNotNull, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { 
  InsertUser, users, 
  departments, InsertDepartment, Department,
  cargos, InsertCargo, Cargo,
  uploadBatches, InsertUploadBatch, UploadBatch,
  uploadedFiles, InsertUploadedFile, UploadedFile,
  calculationFormulas, InsertCalculationFormula, CalculationFormula,
  processedData, InsertProcessedData, ProcessedData,
  dashboardMetrics, InsertDashboardMetric, DashboardMetric,
  reports, InsertReport, Report,
  consultors, Consultor, InsertConsultor,
  trilhas, Trilha, InsertTrilha,
  competencias, Competencia, InsertCompetencia,
  programs, InsertProgram, Program,
  alunos, InsertAluno, Aluno,
  turmas, InsertTurma, Turma,
  mentoringSessions, InsertMentoringSession, MentoringSession,
  events, InsertEvent, Event,
  eventParticipation, InsertEventParticipation, EventParticipation,
  planoIndividual, InsertPlanoIndividual, PlanoIndividual,
  taskLibrary, TaskLibrary, InsertTaskLibrary,
  performanceUploads, InsertPerformanceUpload, PerformanceUpload,
  studentPerformance, InsertStudentPerformance, StudentPerformance,
  scheduledWebinars, InsertScheduledWebinar, ScheduledWebinar,
  announcements, InsertAnnouncement, Announcement,
  contratosAluno, InsertContratoAluno, ContratoAluno,
  contratoNiveis, InsertContratoNivel, ContratoNivel,
  certificationTemplates, InsertCertificationTemplate, CertificationTemplate,
  certificationSignatures, InsertCertificationSignature, CertificationSignature,
  nivelCertificates, InsertNivelCertificate, NivelCertificate,
  nivelCertificateMentoras, InsertNivelCertificateMentora, NivelCertificateMentora,
  historicoNivelCompetencia, InsertHistoricoNivelCompetencia, HistoricoNivelCompetencia,
  casesSucesso, InsertCaseSucesso, CaseSucesso,
  caseInteresses, InsertCaseInteresse, CaseInteresse,
  practicalActivityComments, InsertPracticalActivityComment, PracticalActivityComment,
  mentorAvailability, InsertMentorAvailability, MentorAvailability,
  mentorAppointments, InsertMentorAppointment, MentorAppointment,
  appointmentParticipants, InsertAppointmentParticipant, AppointmentParticipant,
  metas, InsertMeta, Meta,
  metaAcompanhamento, InsertMetaAcompanhamento, MetaAcompanhamento,
  discRespostas, InsertDiscResposta, DiscResposta,
  discResultados, InsertDiscResultado, DiscResultado,
  autopercepcoesCompetencias, InsertAutopercepcaoCompetencia, AutopercepcaoCompetencia,
  mentoraContribuicoes, InsertMentoraContribuicao, MentoraContribuicao,
  inAppNotifications, InsertInAppNotification, InAppNotification,
  courses, InsertCourse, Course,
  activities, InsertActivity, Activity,
  activityRegistrations, InsertActivityRegistration, ActivityRegistration,
  activityTurmas, InsertActivityTurma, ActivityTurma,
  mentorSessionPricing, InsertMentorSessionPricing, MentorSessionPricing,
  mentorDateAvailability, InsertMentorDateAvailability, MentorDateAvailability,
  onboardingJornada, InsertOnboardingJornada, OnboardingJornada,
  onboardingVideos, InsertOnboardingVideo, OnboardingVideo,
  emailAlertasLog, InsertEmailAlertaLog, EmailAlertaLog,
  onboardingRevisoes, InsertOnboardingRevisao, OnboardingRevisao,
  competenciasModulos, InsertCompetenciaModulo, CompetenciaModulo,
  alunoModuloProgresso, InsertAlunoModuloProgresso, AlunoModuloProgresso,
  alunoModuloRelato, InsertAlunoModuloRelato, AlunoModuloRelato,
  alunoModuloAvaliacao, InsertAlunoModuloAvaliacao, AlunoModuloAvaliacao,
  alunoAtividadeProgresso, InsertAlunoAtividadeProgresso, AlunoAtividadeProgresso,
  alunoCompetenciaProrrogacao, InsertAlunoCompetenciaProrrogacao, AlunoCompetenciaProrrogacao,
  cursosCompetencias, InsertCursoCompetencia, CursoCompetencia,
  atividadesCurso, InsertAtividadeCurso, AtividadeCurso,
  avaliacoesAtividade, InsertAvaliacaoAtividade, AvaliacaoAtividade,
  tentativasAvaliacao, InsertTentativaAvaliacao, TentativaAvaliacao,
  alunoCursoAtribuido, InsertAlunoCursoAtribuido, AlunoCursoAtribuido,
  assessmentPdi, AssessmentPdi, InsertAssessmentPdi,
  assessmentCompetencias,
  processoCandidatos,} from "../drizzle/schema";
import { ENV } from './_core/env';
import { calcularAplicabilidadeFinal, calcularMicroTarefaAplicabilidade } from './aplicabilidadeCalculator';
import * as schema from "../drizzle/schema";
import {
  createContratoNivelRepo,
  getContratoNivelOperationalStatus,
  getContratoNivelVigenteByAlunoRepo,
  getContratoNiveisByAlunoRepo,
  getContratoNiveisByContratoRepo,
  isContratoNivelBloqueadoParaNovasAtribuicoes,
  isContratoNivelEncerrado,
  calcularDataFechamentoOperacional,
  validarNivelEmAndamentoUnicoRepo,
  type ContratoNivelComDatas,
} from "./contrato-niveis.service";

const createDbClient = () =>
  drizzle(process.env.DATABASE_URL!, { schema, mode: "default" });
type DbClient = ReturnType<typeof createDbClient>;

let _db: DbClient | null = null;
let _connection: mysql.Connection | null = null;

export async function getRawConnection() {
  if (!_connection && process.env.DATABASE_URL) {
    try {
      // Drizzle já cria uma conexão mysql2, vamos usar ela diretamente
      const db = await getDb();
      if (db && (db as any)._.client) {
        _connection = (db as any)._.client;
      } else {
        // Fallback: criar conexão direta com SSL
        const url = new URL(process.env.DATABASE_URL);
        _connection = await mysql.createConnection({
          host: url.hostname,
          user: url.username,
          password: url.password,
          database: url.pathname.slice(1),
          port: url.port ? parseInt(url.port) : 3306,
        });
      }
    } catch (error) {
      console.warn("[Database] Failed to create raw connection:", error);
      _connection = null;
    }
  }
  return _connection;
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL, { schema, mode: "default" });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function resolveContratoNivelId(
  alunoId: number,
  contratoNivelId?: number | null
): Promise<number | null> {
  if (contratoNivelId) return contratoNivelId;
  const vigente = await getContratoNivelVigenteByAluno(alunoId);
  return vigente?.id ?? null;
}

// ============ USER FUNCTIONS ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.departmentId !== undefined) {
      values.departmentId = user.departmentId;
      updateSet.departmentId = user.departmentId;
    }
    if (user.consultorId !== undefined) {
      values.consultorId = user.consultorId;
      updateSet.consultorId = user.consultorId;
    }
    if (user.alunoId !== undefined) {
      values.alunoId = user.alunoId;
      updateSet.alunoId = user.alunoId;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  if (result.length === 0) return undefined;
  const user = result[0];
  // Enriquecer com consultorRole e managedProgramId se o user tem consultorId
  if (user.consultorId) {
    const [consultor] = await db.select({ role: consultors.role, managedProgramId: consultors.managedProgramId, managedDepartmentId: consultors.managedDepartmentId }).from(consultors).where(eq(consultors.id, user.consultorId)).limit(1);
    return { ...user, consultorRole: consultor?.role || null, managedProgramId: consultor?.managedProgramId || null, managedDepartmentId: consultor?.managedDepartmentId || null } as typeof user & { consultorRole: string | null; managedProgramId: number | null; managedDepartmentId: number | null };
  }
  return { ...user, consultorRole: null, managedProgramId: null, managedDepartmentId: null } as typeof user & { consultorRole: string | null; managedProgramId: number | null; managedDepartmentId: number | null };
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "manager" | "admin2") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateUserDepartment(userId: number, departmentId: number | null) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ departmentId }).where(eq(users.id, userId));
}

export async function getUsersByDepartment(departmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).where(eq(users.departmentId, departmentId));
}

// ============ DEPARTMENT FUNCTIONS ============
export async function createDepartment(dept: InsertDepartment) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(departments).values(dept);
  return result[0].insertId;
}

export async function getAllDepartments() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(departments).orderBy(departments.name);
}

export async function getDepartmentsByProgram(programId: number, includeInactive = false) {
  const db = await getDb();
  if (!db) return [];
  const condition = includeInactive
    ? eq(departments.programId, programId)
    : and(eq(departments.programId, programId), eq(departments.isActive, 1));
  return await db.select().from(departments).where(condition).orderBy(departments.name);
}
export async function getCargosByProgram(programId: number, includeInactive = false) {
  const db = await getDb();
  if (!db) return [];
  const condition = includeInactive
    ? eq(cargos.programId, programId)
    : and(eq(cargos.programId, programId), eq(cargos.isActive, 1));
  return await db.select().from(cargos).where(condition).orderBy(cargos.name);
}

export async function createCargo(data: InsertCargo) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(cargos).values(data).$returningId();
  return result;
}

export async function updateCargo(id: number, data: Partial<InsertCargo>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(cargos).set(data).where(eq(cargos.id, id));
}

export async function getDepartmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
  return result[0];
}

export async function updateDepartment(id: number, data: Partial<InsertDepartment>) {
  const db = await getDb();
  if (!db) return;
  await db.update(departments).set(data).where(eq(departments.id, id));
}

export async function deleteDepartment(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(departments).where(eq(departments.id, id));
}

// ============ UPLOAD BATCH FUNCTIONS ============
export async function createUploadBatch(batch: InsertUploadBatch) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(uploadBatches).values(batch);
  return result[0].insertId;
}

export async function getUploadBatches(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(uploadBatches).orderBy(desc(uploadBatches.createdAt)).limit(limit);
}

export async function getUploadBatchById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(uploadBatches).where(eq(uploadBatches.id, id)).limit(1);
  return result[0];
}

export async function updateUploadBatchStatus(id: number, status: "pending" | "processing" | "completed" | "error", notes?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(uploadBatches).set({ status, notes }).where(eq(uploadBatches.id, id));
}

export async function updateUploadBatchTotalRecords(id: number, totalRecords: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(uploadBatches).set({ totalRecords }).where(eq(uploadBatches.id, id));
}

export async function getLatestBatch() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(uploadBatches)
    .where(eq(uploadBatches.status, "completed"))
    .orderBy(desc(uploadBatches.createdAt))
    .limit(1);
  return result[0] ?? null;
}

// ============ UPLOADED FILES FUNCTIONS ============
export async function createUploadedFile(file: InsertUploadedFile) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(uploadedFiles).values(file);
  return result[0].insertId;
}

export async function getFilesByBatchId(batchId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(uploadedFiles).where(eq(uploadedFiles.batchId, batchId));
}

export async function updateFileStatus(id: number, status: "uploaded" | "processing" | "processed" | "error", errorMessage?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(uploadedFiles).set({ status, errorMessage }).where(eq(uploadedFiles.id, id));
}

export async function updateFileMetadata(id: number, rowCount: number, columnCount: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(uploadedFiles).set({ rowCount, columnCount, status: "processed" }).where(eq(uploadedFiles.id, id));
}

// ============ CALCULATION FORMULA FUNCTIONS ============
export async function createFormula(formula: InsertCalculationFormula) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(calculationFormulas).values(formula);
  return result[0].insertId;
}

export async function getActiveFormulas() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(calculationFormulas).where(eq(calculationFormulas.isActive, 1));
}

export async function updateFormula(id: number, data: Partial<InsertCalculationFormula>) {
  const db = await getDb();
  if (!db) return;
  await db.update(calculationFormulas).set(data).where(eq(calculationFormulas.id, id));
}

export async function deactivateFormula(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(calculationFormulas).set({ isActive: 0 }).where(eq(calculationFormulas.id, id));
}

export async function deleteFormula(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(calculationFormulas).where(eq(calculationFormulas.id, id));
}

// ============ PROCESSED DATA FUNCTIONS ============
export async function insertProcessedData(data: InsertProcessedData[]) {
  const db = await getDb();
  if (!db || data.length === 0) return;
  await db.insert(processedData).values(data);
}

export async function getProcessedDataByBatch(batchId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(processedData).where(eq(processedData.batchId, batchId));
}

export async function getProcessedDataByUser(userId: number, batchId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (batchId) {
    return await db.select().from(processedData)
      .where(and(eq(processedData.userId, userId), eq(processedData.batchId, batchId)));
  }
  return await db.select().from(processedData).where(eq(processedData.userId, userId));
}

export async function getProcessedDataByDepartment(departmentId: number, batchId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (batchId) {
    return await db.select().from(processedData)
      .where(and(eq(processedData.departmentId, departmentId), eq(processedData.batchId, batchId)));
  }
  return await db.select().from(processedData).where(eq(processedData.departmentId, departmentId));
}

// ============ DASHBOARD METRICS FUNCTIONS ============
export async function insertDashboardMetrics(metrics: InsertDashboardMetric[]) {
  const db = await getDb();
  if (!db || metrics.length === 0) return;
  await db.insert(dashboardMetrics).values(metrics);
}

export async function getAdminMetrics(batchId?: number): Promise<DashboardMetric[]> {
  const db = await getDb();
  if (!db) return [];
  if (batchId) {
    return await db.select().from(dashboardMetrics)
      .where(and(eq(dashboardMetrics.scope, "admin"), eq(dashboardMetrics.batchId, batchId)));
  }
  const latestBatch = await getLatestBatch();
  if (!latestBatch) return [];
  return await db.select().from(dashboardMetrics)
    .where(and(eq(dashboardMetrics.scope, "admin"), eq(dashboardMetrics.batchId, latestBatch.id)));
}

export async function getManagerMetrics(departmentId: number, batchId?: number): Promise<DashboardMetric[]> {
  const db = await getDb();
  if (!db) return [];
  const latestBatch = batchId ? { id: batchId } : await getLatestBatch();
  if (!latestBatch) return [];
  return await db.select().from(dashboardMetrics)
    .where(and(
      eq(dashboardMetrics.scope, "manager"),
      eq(dashboardMetrics.scopeId, departmentId),
      eq(dashboardMetrics.batchId, latestBatch.id)
    ));
}

export async function getIndividualMetrics(userId: number, batchId?: number): Promise<DashboardMetric[]> {
  const db = await getDb();
  if (!db) return [];
  const latestBatch = batchId ? { id: batchId } : await getLatestBatch();
  if (!latestBatch) return [];
  return await db.select().from(dashboardMetrics)
    .where(and(
      eq(dashboardMetrics.scope, "individual"),
      eq(dashboardMetrics.scopeId, userId),
      eq(dashboardMetrics.batchId, latestBatch.id)
    ));
}

export async function getMetricsHistory(scope: "admin" | "manager" | "individual", scopeId?: number, limit: number = 12): Promise<DashboardMetric[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (scope === "admin") {
    return await db.select().from(dashboardMetrics)
      .where(eq(dashboardMetrics.scope, "admin"))
      .orderBy(desc(dashboardMetrics.createdAt))
      .limit(limit);
  }
  
  if (scopeId) {
    return await db.select().from(dashboardMetrics)
      .where(and(eq(dashboardMetrics.scope, scope), eq(dashboardMetrics.scopeId, scopeId)))
      .orderBy(desc(dashboardMetrics.createdAt))
      .limit(limit);
  }
  
  return [];
}

// ============ REPORTS FUNCTIONS ============
export async function createReport(report: InsertReport) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(reports).values(report);
  return result[0].insertId;
}

export async function getReportsByUser(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(reports)
    .where(eq(reports.generatedBy, userId))
    .orderBy(desc(reports.createdAt))
    .limit(limit);
}

export async function getAllReports(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(reports).orderBy(desc(reports.createdAt)).limit(limit);
}

// ============ STATISTICS FUNCTIONS ============
export async function getSystemStats() {
  const db = await getDb();
  if (!db) return { 
    totalUsers: 0, 
    totalDepartments: 0, 
    totalBatches: 0, 
    totalReports: 0,
    totalAlunos: 0,
    totalMentores: 0,
    totalSessoes: 0,
    totalEmpresas: 0
  };
  
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [deptCount] = await db.select({ count: sql<number>`count(*)` }).from(departments);
  const [batchCount] = await db.select({ count: sql<number>`count(*)` }).from(uploadBatches);
  const [reportCount] = await db.select({ count: sql<number>`count(*)` }).from(reports);
  const [alunoCount] = await db.select({ count: sql<number>`count(*)` }).from(alunos);
  const [mentorCount] = await db.select({ count: sql<number>`count(*)` }).from(consultors).where(and(eq(consultors.isActive, 1), eq(consultors.role, 'mentor')));
  const [sessionCount] = await db.select({ count: sql<number>`count(*)` }).from(mentoringSessions);
  const [programCount] = await db.select({ count: sql<number>`count(*)` }).from(programs).where(eq(programs.isActive, 1));
  
  return {
    totalUsers: userCount?.count || 0,
    totalDepartments: deptCount?.count || 0,
    totalBatches: batchCount?.count || 0,
    totalReports: reportCount?.count || 0,
    totalAlunos: alunoCount?.count || 0,
    totalMentores: mentorCount?.count || 0,
    totalSessoes: sessionCount?.count || 0,
    totalEmpresas: programCount?.count || 0
  };
}


// ============ PROGRAM FUNCTIONS ============

export async function getPrograms(): Promise<Program[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(programs).where(eq(programs.isActive, 1));
}

export async function getProgramByCode(code: string): Promise<Program | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(programs).where(eq(programs.code, code)).limit(1);
  return result[0];
}

export async function upsertProgram(program: InsertProgram): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await getProgramByCode(program.code);
  if (existing) {
    await db.update(programs).set(program).where(eq(programs.id, existing.id));
    return existing.id;
  }
  
  const result = await db.insert(programs).values(program);
  return result[0].insertId;
}

// ============ TURMA FUNCTIONS ============
export async function getTurmas(programId?: number): Promise<Turma[]> {
  const db = await getDb();
  if (!db) return [];
  if (programId) {
    return await db.select().from(turmas).where(and(eq(turmas.programId, programId), eq(turmas.isActive, 1)));
  }
  return await db.select().from(turmas).where(eq(turmas.isActive, 1));
}

export async function getTurmasWithDetails(): Promise<Array<{
  id: number;
  name: string;
  externalId: string | null;
  year: number;
  programId: number;
  programName: string;
  programCode: string;
  totalAlunos: number;
  isActive: number;
  codigoTurma: string | null;
  dataCongelamento: string | null;
}>> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: turmas.id,
      name: turmas.name,
      externalId: turmas.externalId,
      year: turmas.year,
      programId: turmas.programId,
      programName: programs.name,
      programCode: programs.code,
      isActive: turmas.isActive,
      codigoTurma: (turmas as any).codigoTurma,
      dataCongelamento: turmas.dataCongelamento,
    })
    .from(turmas)
    .leftJoin(programs, eq(turmas.programId, programs.id))
    .where(eq(turmas.isActive, 1))
    .orderBy(programs.name, turmas.name);
  
  // Buscar contagem de alunos por trilha usando PDIs ativos como fonte de verdade.
  // Isso é necessário porque um aluno pode ter turmaId apontando para uma trilha
  // mas ter PDIs ativos em outra trilha da mesma turma (ex: BS1 Basic + BS1 Essential).
  const turmasWithCount = await Promise.all(
    result.map(async (turma) => {
      // Contar alunos distintos com PDI ativo nesta turma
      const pdiCount = await db
        .select({ count: sql<number>`count(DISTINCT ${assessmentPdi.alunoId})` })
        .from(assessmentPdi)
        .where(
          and(
            eq(assessmentPdi.turmaId, turma.id),
            eq(assessmentPdi.status, 'ativo')
          )
        );
      
      // Fallback: se não há PDIs, usar contagem pelo turmaId do aluno
      const totalPorPdi = pdiCount[0]?.count || 0;
      let totalAlunos = totalPorPdi;
      if (totalAlunos === 0) {
        const alunosCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(alunos)
          .where(eq(alunos.turmaId, turma.id));
        totalAlunos = alunosCount[0]?.count || 0;
      }

      return {
        ...turma,
        programName: turma.programName || 'Sem Empresa',
        programCode: turma.programCode || 'N/A',
        totalAlunos,
        codigoTurma: (turma as any).codigoTurma ? String((turma as any).codigoTurma) : null,
        dataCongelamento: turma.dataCongelamento ? String(turma.dataCongelamento) : null,
      };
    })
  );
  
  return turmasWithCount;
}

export async function getTurmaByExternalId(externalId: string): Promise<Turma | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(turmas).where(eq(turmas.externalId, externalId)).limit(1);
  return result[0];
}

/**
 * Define ou remove a data de congelamento de uma turma individual.
 */
export async function setDataCongelamentoTurma(turmaId: number, dataCongelamento: string | null): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(turmas)
    .set({ dataCongelamento: dataCongelamento as any })
    .where(eq(turmas.id, turmaId));
}

/**
 * Define ou remove a data de congelamento de TODAS as turmas com o mesmo codigoTurma.
 * Isso garante que o congelamento seja por turma (BS1/BS2/BS3), não por trilha individual.
 */
export async function setDataCongelamentoPorCodigoTurma(codigoTurma: string, dataCongelamento: string | null): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(turmas)
    .set({ dataCongelamento: dataCongelamento as any })
    .where(eq((turmas as any).codigoTurma, codigoTurma));
}

export async function upsertTurma(turma: InsertTurma): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  
  if (turma.externalId) {
    const existing = await getTurmaByExternalId(turma.externalId);
    if (existing) {
      await db.update(turmas).set(turma).where(eq(turmas.id, existing.id));
      return existing.id;
    }
  }
  
  const result = await db.insert(turmas).values(turma);
  return result[0].insertId;
}

// ============ ALUNO FUNCTIONS ============
export async function getAlunos(programId?: number): Promise<Aluno[]> {
  const db = await getDb();
  if (!db) return [];
  if (programId) {
    return await db.select().from(alunos).where(eq(alunos.programId, programId));
  }
  return await db.select().from(alunos);
}

export async function getAlunosByConsultor(consultorId: number, programId?: number): Promise<Aluno[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get distinct alunoIds from mentoring sessions for this consultor
  const sessions = await db.select({ alunoId: mentoringSessions.alunoId })
    .from(mentoringSessions)
    .where(eq(mentoringSessions.consultorId, consultorId));
  
  const sessionAlunoIds = new Set(sessions.map(s => s.alunoId));
  
  // Get all active alunos
  const allAlunos = await db.select().from(alunos).where(eq(alunos.isActive, 1));
  
  // Include alunos from sessions AND alunos directly linked via consultorId in alunos table
  let result = allAlunos.filter(a => sessionAlunoIds.has(a.id) || a.consultorId === consultorId);
  
  // Optionally filter by programId
  if (programId) {
    result = result.filter(a => a.programId === programId);
  }
  
  return result;
}

export async function getProgramsByConsultor(consultorId: number): Promise<{ id: number; name: string }[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get distinct programIds from alunos that have sessions with this consultor
  const sessions = await db.select({ alunoId: mentoringSessions.alunoId })
    .from(mentoringSessions)
    .where(eq(mentoringSessions.consultorId, consultorId));
  
  const sessionAlunoIds = new Set(sessions.map(s => s.alunoId));
  
  // Include alunos from sessions AND alunos directly linked via consultorId
  const allAlunos = await db.select().from(alunos).where(eq(alunos.isActive, 1));
  const mentorAlunos = allAlunos.filter(a => sessionAlunoIds.has(a.id) || a.consultorId === consultorId);
  const programIds = Array.from(new Set(mentorAlunos.map(a => a.programId).filter(Boolean))) as number[];
  
  if (programIds.length === 0) return [];
  
  const programsList = await getPrograms();
  return programsList.filter(p => programIds.includes(p.id)).map(p => ({ id: p.id, name: p.name }));
}

export async function getAlunoByExternalId(externalId: string): Promise<Aluno | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(alunos).where(eq(alunos.externalId, externalId)).limit(1);
  return result[0];
}

export async function upsertAluno(aluno: InsertAluno): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  
  if (aluno.externalId) {
    const existing = await getAlunoByExternalId(aluno.externalId);
    if (existing) {
      await db.update(alunos).set(aluno).where(eq(alunos.id, existing.id));
      return existing.id;
    }
  }
  
  const result = await db.insert(alunos).values(aluno);
  return result[0].insertId;
}

export async function getAlunoByEmail(email: string): Promise<Aluno | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(alunos).where(eq(alunos.email, email)).limit(1);
  return result[0];
}

/**
 * Helper robusto para obter o aluno a partir do contexto do usuário autenticado.
 * Tenta na ordem: (1) users.alunoId, (2) alunos.email, (3) alunos.externalId (openId).
 * Resolve casos onde o email de login difere do email cadastrado no aluno
 * (ex: aluno que fez primeiro login com email alternativo e depois teve o email corrigido).
 */
export async function getAlunoFromCtx(user: { alunoId?: number | null; email?: string | null; openId?: string | null }): Promise<Aluno | undefined> {
  // 1) Prioridade: alunoId direto do registro de usuário
  if (user.alunoId) {
    const byId = await getAlunoById(user.alunoId);
    if (byId) return byId;
  }
  // 2) Fallback: email cadastrado no aluno
  if (user.email) {
    const byEmail = await getAlunoByEmail(user.email);
    if (byEmail) return byEmail;
  }
  // 3) Fallback final: externalId (openId do provedor de autenticação)
  if (user.openId) {
    const byExternal = await getAlunoByExternalId(user.openId);
    if (byExternal) return byExternal;
  }
  return undefined;
}

export async function getAlunoById(alunoId: number): Promise<Aluno | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(alunos).where(eq(alunos.id, alunoId)).limit(1);
  return result[0];
}

export async function getAlunoByUserId(userId: number): Promise<Aluno | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  // O user tem alunoId que referencia a tabela alunos
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0]?.alunoId) return undefined;
  const result = await db.select().from(alunos).where(eq(alunos.id, user[0].alunoId)).limit(1);
  return result[0];
}

export async function getAlunosByTurma(turmaId: number): Promise<Aluno[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(alunos).where(and(eq(alunos.turmaId, turmaId), eq(alunos.isActive, 1)));
}

// ============ MENTORING SESSION FUNCTIONS ============
export async function insertMentoringSessions(sessions: InsertMentoringSession[]): Promise<void> {
  const db = await getDb();
  if (!db || sessions.length === 0) return;
  await db.insert(mentoringSessions).values(sessions);
}

export async function getMentoringSessionsByBatch(batchId: number): Promise<MentoringSession[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(mentoringSessions).where(eq(mentoringSessions.batchId, batchId));
}

export async function getMentoringSessionsByAluno(alunoId: number): Promise<MentoringSession[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(mentoringSessions).where(eq(mentoringSessions.alunoId, alunoId));
}

export async function getMentoringSessionsByAlunoAndNivel(alunoId: number, contratoNivelId?: number | null): Promise<MentoringSession[]> {
  const db = await getDb();
  if (!db) return [];
  if (!contratoNivelId) return getMentoringSessionsByAluno(alunoId);
  return await db.select().from(mentoringSessions).where(and(
    eq(mentoringSessions.alunoId, alunoId),
    eq(mentoringSessions.contratoNivelId, contratoNivelId),
  ));
}

export async function updateMentoringSession(sessionId: number, data: {
  sessionDate?: string;
  sessionNumber?: number;
  consultorId?: number;
  notaEvolucao?: number;
  feedback?: string;
  engagementScore?: number;
  mensagemAluno?: string;
  taskId?: number | null;
  taskDeadline?: string | null;
  taskStatus?: "entregue" | "nao_entregue" | "sem_tarefa" | "validada";
  relatoAluno?: string;
  presence?: "presente" | "ausente";
  evidenceLink?: string | null;
  evidenceImageUrl?: string | null;
  evidenceImageKey?: string | null;
  submittedAt?: Date | null;
  validatedBy?: number | null;
  customTaskTitle?: string | null;
  customTaskDescription?: string | null;
  taskMode?: "biblioteca" | "personalizada" | "livre" | "sem_tarefa";
  validatedAt?: Date | null;
  textoAplicabilidade?: string;
  notaAlunoAplicabilidade?: number | null;
  notaMentoraAplicabilidade?: number | null;
  aplicabilidadeAvaliadaEm?: Date | null;
  tipoSessao?: "individual_normal" | "individual_assessment" | "grupo_normal" | "grupo_assessment";
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const updateData: Record<string, unknown> = {};
  if (data.sessionDate !== undefined) updateData.sessionDate = new Date(data.sessionDate + 'T00:00:00');
  if (data.sessionNumber !== undefined) updateData.sessionNumber = data.sessionNumber;
  if (data.consultorId !== undefined) updateData.consultorId = data.consultorId;
  if (data.notaEvolucao !== undefined) updateData.notaEvolucao = data.notaEvolucao;
  if (data.engagementScore !== undefined) updateData.engagementScore = data.engagementScore;
  if (data.feedback !== undefined) updateData.feedback = data.feedback;
  if (data.mensagemAluno !== undefined) updateData.mensagemAluno = data.mensagemAluno;
  if (data.taskId !== undefined) updateData.taskId = data.taskId;
  if (data.taskDeadline !== undefined) updateData.taskDeadline = data.taskDeadline;
  if (data.taskStatus !== undefined) updateData.taskStatus = data.taskStatus;
  if (data.relatoAluno !== undefined) updateData.relatoAluno = data.relatoAluno;
  if (data.presence !== undefined) updateData.presence = data.presence;
  if (data.evidenceLink !== undefined) updateData.evidenceLink = data.evidenceLink;
  if (data.evidenceImageUrl !== undefined) updateData.evidenceImageUrl = data.evidenceImageUrl;
  if (data.evidenceImageKey !== undefined) updateData.evidenceImageKey = data.evidenceImageKey;
  if (data.submittedAt !== undefined) updateData.submittedAt = data.submittedAt;
  if (data.validatedBy !== undefined) updateData.validatedBy = data.validatedBy;
  if (data.validatedAt !== undefined) updateData.validatedAt = data.validatedAt;
  if (data.customTaskTitle !== undefined) updateData.customTaskTitle = data.customTaskTitle;
  if (data.customTaskDescription !== undefined) updateData.customTaskDescription = data.customTaskDescription;
  if (data.taskMode !== undefined) updateData.taskMode = data.taskMode;
  if (data.textoAplicabilidade !== undefined) updateData.textoAplicabilidade = data.textoAplicabilidade;
  if (data.notaAlunoAplicabilidade !== undefined) updateData.notaAlunoAplicabilidade = data.notaAlunoAplicabilidade;
  if (data.notaMentoraAplicabilidade !== undefined) updateData.notaMentoraAplicabilidade = data.notaMentoraAplicabilidade;
  if (data.aplicabilidadeAvaliadaEm !== undefined) updateData.aplicabilidadeAvaliadaEm = data.aplicabilidadeAvaliadaEm;
  if (data.tipoSessao !== undefined) updateData.tipoSessao = data.tipoSessao;
  
  if (Object.keys(updateData).length === 0) return true;
  
  await db.update(mentoringSessions)
    .set(updateData)
    .where(eq(mentoringSessions.id, sessionId));
  return true;
}

export async function deleteMentoringSession(sessionId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Buscar a sessão para saber o alunoId antes de deletar
  const [session] = await db.select().from(mentoringSessions).where(eq(mentoringSessions.id, sessionId)).limit(1);
  if (!session) return false;
  const alunoId = session.alunoId;
  // Deletar a sessão
  await db.delete(mentoringSessions).where(eq(mentoringSessions.id, sessionId));
  // Renumerar todas as sessões restantes do aluno por ordem de data
  const restantes = await db
    .select()
    .from(mentoringSessions)
    .where(eq(mentoringSessions.alunoId, alunoId))
    .orderBy(asc(mentoringSessions.sessionDate), asc(mentoringSessions.id));
  for (let i = 0; i < restantes.length; i++) {
    await db
      .update(mentoringSessions)
      .set({ sessionNumber: i + 1 })
      .where(eq(mentoringSessions.id, restantes[i].id));
  }
  return true;
}

export async function createMentoringSession(data: {
  alunoId: number;
  contratoNivelId?: number | null;
  consultorId: number;
  turmaId?: number | null;
  trilhaId?: number | null;
  sessionNumber: number;
  sessionDate: string;
  presence: "presente" | "ausente";
  taskStatus?: "entregue" | "nao_entregue" | "sem_tarefa";
  engagementScore?: number | null;
  notaEvolucao?: number | null;
  feedback?: string;
  mensagemAluno?: string;
  taskId?: number | null;
  taskDeadline?: string | null;
  customTaskTitle?: string | null;
  customTaskDescription?: string | null;
  taskMode?: "biblioteca" | "personalizada" | "livre" | "sem_tarefa";
  notaMentoraAplicabilidade?: number | null;
  aplicabilidadeAvaliadaEm?: Date | null;
  tipoSessao?: string;
  appointmentId?: number | null;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await assertNivelPermiteNovasAtribuicoes(data.alunoId, data.contratoNivelId, "mentoringSessions.create");
  const contratoNivelIdResolved = await resolveContratoNivelId(data.alunoId, data.contratoNivelId);
  
  // Garantir que tipoSessao reflita o tipo real do agendamento.
  // Se appointmentId foi fornecido e o agendamento é do tipo "grupo",
  // o tipoSessao deve ser grupal — independente do que o chamador passou.
  // Isso uniformiza todos os fluxos de criação de sessão.
  let tipoSessaoEfetivo = data.tipoSessao ?? "individual_normal";
  if (data.appointmentId) {
    const appt = await getAppointmentById(data.appointmentId);
    if (appt?.type === "grupo") {
      if (tipoSessaoEfetivo === "individual_normal") tipoSessaoEfetivo = "grupo_normal";
      if (tipoSessaoEfetivo === "individual_assessment") tipoSessaoEfetivo = "grupo_assessment";
    }
  }

  const result = await db.insert(mentoringSessions).values({
    alunoId: data.alunoId,
    contratoNivelId: contratoNivelIdResolved,
    consultorId: data.consultorId,
    turmaId: data.turmaId ?? null,
    trilhaId: data.trilhaId ?? null,
    sessionNumber: data.sessionNumber,
    sessionDate: data.sessionDate as any,
    presence: data.presence,
    taskStatus: data.taskStatus ?? "sem_tarefa",
    engagementScore: data.engagementScore ?? null,
    notaEvolucao: data.notaEvolucao ?? null,
    feedback: data.feedback ?? null,
    mensagemAluno: data.mensagemAluno ?? null,
    taskId: data.taskId ?? null,
    taskDeadline: data.taskDeadline as any,
    customTaskTitle: data.customTaskTitle ?? null,
    customTaskDescription: data.customTaskDescription ?? null,
    taskMode: data.taskMode ?? "sem_tarefa",
    notaMentoraAplicabilidade: data.notaMentoraAplicabilidade ?? null,
    aplicabilidadeAvaliadaEm: data.aplicabilidadeAvaliadaEm ?? null,
    tipoSessao: tipoSessaoEfetivo,
    appointmentId: data.appointmentId ?? null,
  } as any);
  return result[0].insertId;
}

// ============ TASK LIBRARY FUNCTIONS ============
export async function getAllTaskLibrary(): Promise<TaskLibrary[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(taskLibrary).where(eq(taskLibrary.isActive, 1));
}

export async function getTaskLibraryById(id: number): Promise<TaskLibrary | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(taskLibrary).where(eq(taskLibrary.id, id)).limit(1);
  return result[0];
}

export async function getAllTaskLibraryIncludingInactive(): Promise<TaskLibrary[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(taskLibrary).orderBy(taskLibrary.competencia, taskLibrary.nome);
}

export async function createTaskLibraryItem(data: InsertTaskLibrary): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(taskLibrary).values(data);
  return Number(result[0].insertId);
}

export async function updateTaskLibraryItem(id: number, data: Partial<InsertTaskLibrary>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(taskLibrary).set(data).where(eq(taskLibrary.id, id));
}

export async function toggleTaskLibraryActive(id: number, isActive: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(taskLibrary).set({ isActive }).where(eq(taskLibrary.id, id));
}

export async function getAllMentoringSessions(): Promise<MentoringSession[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(mentoringSessions);
}

// ============ EVENT FUNCTIONS ============
export async function insertEvents(evts: InsertEvent[]): Promise<void> {
  const db = await getDb();
  if (!db || evts.length === 0) return;
  await db.insert(events).values(evts);
}

/**
 * Garante que existe um registro na tabela events correspondente a um scheduled_webinar.
 * Se já existir (por título normalizado), retorna o id existente.
 * Se não existir, cria um novo e retorna o id.
 */
export async function ensureEventForWebinar(webinarId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  
  const webinar = await getWebinarById(webinarId);
  if (!webinar) throw new Error('Webinar não encontrado');
  
  // Normalizar título para busca
  const normTitle = (t: string | null): string => {
    if (!t) return '';
    return t.toLowerCase().trim()
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .replace(/\s*-\s*/g, ' - ')
      .trim();
  };
  
  // Verificar se já existe um evento com título similar
  const allEvts = await db.select().from(events);
  const webinarNorm = normTitle(webinar.title);
  const existing = allEvts.find(e => normTitle(e.title) === webinarNorm);
  
  if (existing) return existing.id;
  
  // Criar novo evento a partir do webinar
  const result = await db.insert(events).values({
    title: webinar.title,
    eventType: 'webinar',
    eventDate: webinar.eventDate ? (typeof webinar.eventDate === 'string' ? webinar.eventDate : new Date(webinar.eventDate).toISOString().split('T')[0]) : null,
    videoLink: webinar.youtubeLink || null,
    programId: webinar.programId || null,
    externalId: `sw-${webinar.id}`,
  });
  
  return result[0].insertId;
}

export async function getEventsByProgram(programId: number): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(events).where(eq(events.programId, programId));
}

/**
 * Busca eventos do programa OU eventos sem programa (programId NULL).
 * Inclui scheduled_webinars (published/completed) que ainda não existem na tabela events,
 * garantindo que webinars agendados pelo admin impactem o cálculo de participação nos dashboards.
 */
export async function getEventsByProgramOrGlobal(programId: number): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  const allEvtsRaw = await db.select().from(events).where(
    or(eq(events.programId, programId), isNull(events.programId))
  );

  // Incluir scheduled_webinars (published/completed) que NÃO existem na tabela events
  const allScheduledWebinars = await db.select().from(scheduledWebinars).where(
    or(
      eq(scheduledWebinars.status, 'published'),
      eq(scheduledWebinars.status, 'completed')
    )
  );
  const activeScheduledIds = new Set(allScheduledWebinars.map(w => w.id));
  const linkedWebinarId = (externalId?: string | null): number | null => {
    if (!externalId) return null;
    const match = externalId.match(/^sw-(\d+)$/);
    return match ? Number(match[1]) : null;
  };

  // Remover eventos órfãos (sw-<id> sem webinar válido)
  const allEvts = allEvtsRaw.filter(evt => {
    const swId = linkedWebinarId(evt.externalId);
    if (!swId) return true;
    return activeScheduledIds.has(swId);
  });

  // Deduplicar eventos por título normalizado (evita duplicados como 4x "2025/19 Estrutura e Conceitos")
  const normTitle = (t: string | null): string => {
    if (!t) return '';
    const withoutSpeakerSuffix = t
      .trim()
      .replace(
        /(?:,\s*|\s+-\s+)?com\s+(?:(?:a|o)\s+(?:palestrante|professor(?:a)?|mentor(?:a)?)\s+)?[A-ZÀ-Ý][\p{L}'’.\-]+(?:\s+[A-ZÀ-Ý][\p{L}'’.\-]+){0,6}\.?\s*$/u,
        ''
      );
    return withoutSpeakerSuffix
      .toLowerCase()
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .replace(/\s*-\s*/g, ' - ')
      .replace(/[.,;:!?]+$/g, '')
      .trim();
  };
  const coreTitle = (n: string): string => {
    return n
      .replace(/^(\d{4}\/\d+\s*-\s*)?(aula\s*\d+\s*-\s*)?/i, '')
      .replace(/\s*-\s*\d{1,2}\s*-\s*/g, ' - ')
      .replace(/,\s*com\s+.*$/i, '')
      .replace(/\s+com\s+.*$/i, '')
      .replace(/[.,!?;:"]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Criar set de títulos normalizados dos eventos existentes para detectar duplicatas
  const existingCoreKeys = new Set<string>();
  for (const evt of allEvts) {
    const core = coreTitle(normTitle(evt.title));
    const dateStr = evt.eventDate ? new Date(evt.eventDate).toISOString().split('T')[0] : 'nodate';
    existingCoreKeys.add(`${core}|${dateStr}`);
  }

  // Adicionar scheduled_webinars como eventos sintéticos (se não existem na tabela events)
  const syntheticEvents: Event[] = [];
  for (const sw of allScheduledWebinars) {
    // Filtrar por programa: se o webinar tem programId, deve ser do mesmo programa; se NULL, é global
    if (sw.programId && sw.programId !== programId) continue;
    // Verificar se já existe na tabela events (por core title + data)
    const swCore = coreTitle(normTitle(sw.title));
    const swDateStr = sw.eventDate ? new Date(sw.eventDate).toISOString().split('T')[0] : 'nodate';
    const swKey = `${swCore}|${swDateStr}`;
    if (existingCoreKeys.has(swKey)) continue;
    // Criar evento sintético
    syntheticEvents.push({
      id: sw.id + 900000, // ID alto para não colidir com events reais
      externalId: `sw-${sw.id}`,
      title: sw.title,
      eventType: 'webinar',
      eventDate: sw.eventDate ? (sw.eventDate instanceof Date ? sw.eventDate.toISOString().split('T')[0] : String(sw.eventDate)) : null,
      videoLink: sw.youtubeLink || null,
      programId: sw.programId,
      trilhaId: null,
      createdAt: sw.createdAt,
    } as Event);
    existingCoreKeys.add(swKey);
  }

  const combined = [...allEvts, ...syntheticEvents];

  // Deduplicar por core title + data (para não juntar aulas diferentes do mesmo tema em datas diferentes)
  const seen = new Map<string, Event>();
  const deduped: Event[] = [];
  const scoreEvent = (evt: Event): number => {
    const swId = linkedWebinarId(evt.externalId);
    const linkedToActiveWebinar = swId && activeScheduledIds.has(swId) ? 1 : 0;
    const hasVideo = evt.videoLink ? 1 : 0;
    return linkedToActiveWebinar * 100 + hasVideo * 10 + evt.id;
  };
  for (const evt of combined) {
    const core = coreTitle(normTitle(evt.title));
    const dateStr = evt.eventDate ? new Date(evt.eventDate).toISOString().split('T')[0] : 'nodate';
    const dedupKey = `${core}|${dateStr}`;
    const existing = seen.get(dedupKey);
    if (!existing) {
      seen.set(dedupKey, evt);
      deduped.push(evt);
    } else if (scoreEvent(evt) > scoreEvent(existing)) {
      const idx = deduped.findIndex(d => d.id === existing.id);
      if (idx >= 0) deduped[idx] = evt;
      seen.set(dedupKey, evt);
    }
  }
  return deduped;
}

// ============ EVENT PARTICIPATION FUNCTIONS ============
export async function insertEventParticipation(participations: InsertEventParticipation[]): Promise<void> {
  const db = await getDb();
  if (!db || participations.length === 0) return;
  await db.insert(eventParticipation).values(participations);
}

export async function getEventParticipationByBatch(batchId: number): Promise<EventParticipation[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(eventParticipation).where(eq(eventParticipation.batchId, batchId));
}

export async function getEventParticipationByAluno(alunoId: number): Promise<EventParticipation[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(eventParticipation).where(eq(eventParticipation.alunoId, alunoId));
}

export async function getEventParticipationByAlunoAndNivel(alunoId: number, contratoNivelId?: number | null): Promise<EventParticipation[]> {
  const db = await getDb();
  if (!db) return [];
  if (!contratoNivelId) return getEventParticipationByAluno(alunoId);
  return await db.select().from(eventParticipation).where(and(
    eq(eventParticipation.alunoId, alunoId),
    eq(eventParticipation.contratoNivelId, contratoNivelId),
  ));
}

export async function getAllEventParticipation(): Promise<EventParticipation[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(eventParticipation);
}

/**
 * Retorna todas as participações em eventos COM a data do evento (JOIN com events).
 * Essencial para filtrar webinars por período do ciclo no calculador V2.
 */
export type EventParticipationWithDate = EventParticipation & { eventDate: Date | string | null; eventTitle: string };
export async function getAllEventParticipationWithDate(): Promise<EventParticipationWithDate[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: eventParticipation.id,
    eventId: eventParticipation.eventId,
    alunoId: eventParticipation.alunoId,
    status: eventParticipation.status,
    reflexao: eventParticipation.reflexao,
    selfReportedAt: eventParticipation.selfReportedAt,
    batchId: eventParticipation.batchId,
    createdAt: eventParticipation.createdAt,
    eventDate: events.eventDate,
    eventTitle: events.title,
  }).from(eventParticipation)
    .innerJoin(events, eq(eventParticipation.eventId, events.id));
  return rows;
}

// ============ CONSULTOR FUNCTIONS ============
export async function upsertConsultor(consultor: InsertConsultor): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Try to find by name and program
  const existing = await db.select().from(consultors)
    .where(and(
      eq(consultors.name, consultor.name),
      consultor.programId ? eq(consultors.programId, consultor.programId) : sql`1=1`
    ))
    .limit(1);
  
  if (existing[0]) {
    return existing[0].id;
  }
  
  const result = await db.insert(consultors).values(consultor);
  return result[0].insertId;
}

// ============ TRILHA FUNCTIONS ============
export async function upsertTrilha(trilha: InsertTrilha): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  
  if (trilha.externalId) {
    const existing = await db.select().from(trilhas).where(eq(trilhas.externalId, trilha.externalId)).limit(1);
    if (existing[0]) {
      return existing[0].id;
    }
  }
  
  const result = await db.insert(trilhas).values(trilha);
  return result[0].insertId;
}

// ============ STATISTICS WITH PROGRAMS ============
export async function getProgramStats() {
  const db = await getDb();
  if (!db) return [];
  
  const programList = await getPrograms();
  const stats = [];
  
  for (const program of programList) {
    const [alunoCount] = await db.select({ count: sql<number>`count(*)` })
      .from(alunos)
      .where(eq(alunos.programId, program.id));
    
    const [turmaCount] = await db.select({ count: sql<number>`count(*)` })
      .from(turmas)
      .where(eq(turmas.programId, program.id));
    
    const [sessionCount] = await db.select({ count: sql<number>`count(*)` })
      .from(mentoringSessions)
      .innerJoin(alunos, eq(mentoringSessions.alunoId, alunos.id))
      .where(eq(alunos.programId, program.id));
    
    stats.push({
      programId: program.id,
      programName: program.name,
      programCode: program.code,
      totalAlunos: alunoCount?.count || 0,
      totalTurmas: turmaCount?.count || 0,
      totalSessions: sessionCount?.count || 0
    });
  }
  
  return stats;
}


// ============ MENTOR/CONSULTOR DASHBOARD FUNCTIONS ============
export async function getConsultors(): Promise<Consultor[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(consultors).orderBy(consultors.name);
}

// Retorna apenas consultores ativos (para dropdowns de seleção)
export async function getActiveConsultors(): Promise<Consultor[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(consultors).where(eq(consultors.isActive, 1)).orderBy(consultors.name);
}

// Retorna apenas mentores ativos (para seleção no Onboarding do aluno)
export async function getActiveMentorsForOnboarding(): Promise<Consultor[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select()
    .from(consultors)
    .where(and(eq(consultors.role, 'mentor'), eq(consultors.isActive, 1)))
    .orderBy(consultors.name);
}

// Toggle ativar/inativar consultor
export async function toggleConsultorStatus(consultorId: number): Promise<{ success: boolean; isActive: number }> {
  const db = await getDb();
  if (!db) throw new Error('Banco de dados não disponível');
  const [consultor] = await db.select({ isActive: consultors.isActive }).from(consultors).where(eq(consultors.id, consultorId)).limit(1);
  if (!consultor) throw new Error('Consultor não encontrado');
  const newStatus = consultor.isActive === 1 ? 0 : 1;
  await db.update(consultors).set({ isActive: newStatus }).where(eq(consultors.id, consultorId));
  return { success: true, isActive: newStatus };
}

// Toggle ativar/inativar aluno
export async function toggleAlunoStatus(alunoId: number): Promise<{ success: boolean; isActive: number; name: string; message?: string }> {
  const db = await getDb();
  if (!db) throw new Error('Banco de dados não disponível');
  const [aluno] = await db.select({ isActive: alunos.isActive, name: alunos.name, programId: alunos.programId }).from(alunos).where(eq(alunos.id, alunoId)).limit(1);
  if (!aluno) throw new Error('Aluno não encontrado');
  const newStatus = aluno.isActive === 1 ? 0 : 1;
  
  // Guard: ao ATIVAR aluno, verificar se a empresa/programa está ativa
  if (newStatus === 1 && aluno.programId) {
    const [prog] = await db.select({ isActive: programs.isActive, name: programs.name }).from(programs).where(eq(programs.id, aluno.programId)).limit(1);
    if (prog && prog.isActive === 0) {
      return { success: false, isActive: 0, name: aluno.name, message: `Não é possível ativar o aluno pois a empresa "${prog.name}" está inativa. Ative a empresa primeiro.` };
    }
  }
  
  // Atualizar status do aluno e canLogin
  await db.update(alunos).set({ isActive: newStatus, canLogin: newStatus }).where(eq(alunos.id, alunoId));
  // Sincronizar: desativar/reativar a conta de usuário vinculada ao aluno
  await db.update(users).set({ isActive: newStatus }).where(eq(users.alunoId, alunoId));
  return { success: true, isActive: newStatus, name: aluno.name };
}

// Verificar se mentor tem disponibilidade de agenda nos próximos 10 dias
export async function checkMentorHasAvailabilityNext10Days(consultorId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // 1) Buscar slots recorrentes (dia da semana) ativos
  const weeklySlots = await db.select()
    .from(mentorAvailability)
    .where(and(eq(mentorAvailability.consultorId, consultorId), eq(mentorAvailability.isActive, 1)));
  // 2) Buscar slots por data específica ativos
  const dateSlots = await db.select()
    .from(mentorDateAvailability)
    .where(and(eq(mentorDateAvailability.consultorId, consultorId), eq(mentorDateAvailability.isActive, 1)));
  
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 10);
  const futureStr = futureDate.toISOString().slice(0, 10);
  
  // Verificar datas específicas nos próximos 10 dias
  if (dateSlots.some(s => s.specificDate >= todayStr && s.specificDate <= futureStr)) return true;
  
  // Verificar slots recorrentes nos próximos 10 dias
  if (weeklySlots.length > 0) {
    for (let i = 0; i < 10; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const dayOfWeek = checkDate.getDay();
      if (weeklySlots.some(s => s.dayOfWeek === dayOfWeek)) return true;
    }
  }
  return false;
}

export async function getConsultorById(id: number): Promise<Consultor | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(consultors).where(eq(consultors.id, id)).limit(1);
  return result[0];
}

export async function getConsultorByName(name: string): Promise<Consultor | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(consultors).where(eq(consultors.name, name)).limit(1);
  return result[0];
}

export async function getMentoringSessionsByConsultor(consultorId: number): Promise<MentoringSession[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(mentoringSessions).where(eq(mentoringSessions.consultorId, consultorId));
}

export async function getConsultorStats(consultorId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Get all sessions for this consultor
  const sessions = await getMentoringSessionsByConsultor(consultorId);
  
  // Get all alunos
  const alunosList = await getAlunos();
  const alunoMap = new Map(alunosList.map(a => [a.id, a]));
  
  // Filter only valid sessions (aluno exists in alunos table)
  const validSessions = sessions.filter(s => alunoMap.has(s.alunoId));
  
  // Alunos currently assigned to this mentor (via consultorId in alunos table)
  const directAlunos = alunosList.filter(a => a.consultorId === consultorId && a.isActive === 1);
  const directAlunoIds = new Set(directAlunos.map(a => a.id));
  
  // For session counting: only count sessions where the aluno is CURRENTLY assigned to this mentor
  // OR sessions that this mentor conducted (historical)
  const sessionAlunoIds = new Set(validSessions.map(s => s.alunoId));
  
  // Merge both sources: alunos from sessions + alunos linked directly
  const allAlunoIds = new Set([...Array.from(sessionAlunoIds), ...Array.from(directAlunoIds)]);
  const validAlunoIds = Array.from(allAlunoIds);
  
  // Get ALL mentoring sessions (from all mentors) to calculate ultimaMentoria correctly
  // This ensures that when an aluno is transferred, we count days since their last session with ANY mentor
  const allMentoringSessions = await db.select().from(mentoringSessions);
  
  // Get programs
  const programsList = await getPrograms();
  const programMap = new Map(programsList.map(p => [p.id, p]));
  
  // Calculate stats per program (only valid sessions)
  const statsByProgram: Record<string, { mentorias: number; alunos: Set<number>; datas: Set<string> }> = {};
  
  for (const session of validSessions) {
    const aluno = alunoMap.get(session.alunoId);
    if (!aluno) continue;
    
    const program = aluno.programId ? programMap.get(aluno.programId) : null;
    const programName = program?.name || 'Sem Programa';
    
    if (!statsByProgram[programName]) {
      statsByProgram[programName] = { mentorias: 0, alunos: new Set(), datas: new Set() };
    }
    
    statsByProgram[programName].mentorias++;
    statsByProgram[programName].alunos.add(session.alunoId);
    if (session.sessionDate) {
      statsByProgram[programName].datas.add(String(session.sessionDate));
    }
  }
  
  // Also add directly linked alunos to porEmpresa stats (even without sessions)
  for (const aluno of directAlunos) {
    const program = aluno.programId ? programMap.get(aluno.programId) : null;
    const programName = program?.name || 'Sem Programa';
    if (!statsByProgram[programName]) {
      statsByProgram[programName] = { mentorias: 0, alunos: new Set(), datas: new Set() };
    }
    statsByProgram[programName].alunos.add(aluno.id);
  }
  
  // Get aluno details (all alunos: from sessions + directly linked)
  const alunosAtendidos = validAlunoIds.map(id => {
    const aluno = alunoMap.get(id);
    if (!aluno) return null;
    const program = aluno.programId ? programMap.get(aluno.programId) : null;
    const alunoSessionsThisMentor = validSessions.filter(s => s.alunoId === id);
    // For ultimaMentoria: use ALL sessions (any mentor) to get the real last session date
    // This prevents false alerts when aluno was transferred from another mentor
    const allAlunoSessions = allMentoringSessions
      .filter(s => s.alunoId === id && s.sessionDate)
      .sort((a, b) => new Date(a.sessionDate!).getTime() - new Date(b.sessionDate!).getTime());
    const ultimaMentoriaGlobal = allAlunoSessions.length > 0 ? allAlunoSessions[allAlunoSessions.length - 1].sessionDate : null;
    return {
      id: aluno.id,
      nome: aluno.name,
      empresa: program?.name || 'Sem Programa',
      totalMentorias: alunoSessionsThisMentor.length,
      ultimaMentoria: ultimaMentoriaGlobal,
      // Flag: is this aluno currently assigned to this mentor?
      isCurrentAluno: directAlunoIds.has(id)
    };
  }).filter(Boolean);
  
  return {
    totalMentorias: validSessions.length,
    totalAlunos: validAlunoIds.length,
    totalEmpresas: Object.keys(statsByProgram).length,
    porEmpresa: Object.entries(statsByProgram).map(([empresa, stats]) => ({
      empresa,
      mentorias: stats.mentorias,
      alunos: stats.alunos.size,
      datas: Array.from(stats.datas).sort()
    })),
    alunosAtendidos,
    sessoes: validSessions.map(s => {
      const aluno = alunoMap.get(s.alunoId);
      const program = aluno?.programId ? programMap.get(aluno.programId) : null;
      return {
        id: s.id,
        data: s.sessionDate,
        aluno: aluno?.name || 'Desconhecido',
        empresa: program?.name || 'Sem Programa',
        presenca: s.presence,
        engajamento: s.engagementScore
      };
    })
  };
}


// ============ CUSTOM LOGIN FUNCTIONS ============

// Login para Alunos (Id Usuário + Email)
export async function authenticateAluno(externalId: string, email: string): Promise<{ success: boolean; user?: any; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };
  
  const [aluno] = await db.select()
    .from(alunos)
    .where(and(
      eq(alunos.externalId, externalId),
      eq(alunos.email, email.toLowerCase()),
      eq(alunos.canLogin, 1),
      eq(alunos.isActive, 1)
    ))
    .limit(1);
  
  if (!aluno) {
    return { success: false, message: "ID ou email inválido. Verifique suas credenciais." };
  }
  
  return { 
    success: true, 
    user: {
      id: aluno.id,
      type: 'aluno',
      name: aluno.name,
      email: aluno.email,
      externalId: aluno.externalId,
      turmaId: aluno.turmaId,
      programId: aluno.programId,
      role: 'user'
    }
  };
}

// Login para Mentores (Email + Id criado pelo admin)
export async function authenticateMentor(loginId: string, email: string): Promise<{ success: boolean; user?: any; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };
  
  const [consultor] = await db.select()
    .from(consultors)
    .where(and(
      eq(consultors.loginId, loginId),
      eq(consultors.email, email.toLowerCase()),
      eq(consultors.role, 'mentor'),
      eq(consultors.canLogin, 1),
      eq(consultors.isActive, 1)
    ))
    .limit(1);
  
  if (!consultor) {
    return { success: false, message: "ID ou email inválido. Verifique suas credenciais." };
  }
  
  return { 
    success: true, 
    user: {
      id: consultor.id,
      type: 'mentor',
      name: consultor.name,
      email: consultor.email,
      loginId: consultor.loginId,
      programId: consultor.programId,
      role: 'manager'
    }
  };
}

// Login para Gerentes (Email + Id criado pelo admin)
export async function authenticateGerente(loginId: string, email: string): Promise<{ success: boolean; user?: any; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };
  
  const [consultor] = await db.select()
    .from(consultors)
    .where(and(
      eq(consultors.loginId, loginId),
      eq(consultors.email, email.toLowerCase()),
      eq(consultors.role, 'gerente'),
      eq(consultors.canLogin, 1),
      eq(consultors.isActive, 1)
    ))
    .limit(1);
  
  if (!consultor) {
    return { success: false, message: "ID ou email inválido. Verifique suas credenciais." };
  }
  
  return { 
    success: true, 
    user: {
      id: consultor.id,
      type: 'gerente',
      name: consultor.name,
      email: consultor.email,
      loginId: consultor.loginId,
      managedProgramId: consultor.managedProgramId,
      role: 'manager'
    }
  };
}

// Criar ou atualizar acesso de mentor
export async function createMentorAccess(consultorId: number, loginId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db.update(consultors)
    .set({ loginId, canLogin: 1 })
    .where(eq(consultors.id, consultorId));
  
  return true;
}

// Criar ou atualizar acesso de gerente
export async function createGerenteAccess(consultorId: number, loginId: string, managedProgramId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db.update(consultors)
    .set({ loginId, canLogin: 1, role: 'gerente', managedProgramId })
    .where(eq(consultors.id, consultorId));
  
  return true;
}

// Listar mentores com acesso
export async function getMentorsWithAccess(): Promise<Consultor[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(consultors)
    .where(and(
      eq(consultors.role, 'mentor'),
      eq(consultors.canLogin, 1)
    ));
}

// Listar gerentes com acesso
export async function getGerentesWithAccess(): Promise<Consultor[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(consultors)
    .where(and(
      eq(consultors.role, 'gerente'),
      eq(consultors.canLogin, 1)
    ));
}

// Atualizar email do aluno
export async function updateAlunoEmail(alunoId: number, email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db.update(alunos)
    .set({ email: email.toLowerCase() })
    .where(eq(alunos.id, alunoId));
  
  return true;
}


// ============ ADMIN CRUD FUNCTIONS ============

// Programs/Empresas
export async function getAllPrograms() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(programs).orderBy(programs.name);
}

export async function createProgram(data: { name: string; code: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");
  
  const [result] = await db.insert(programs).values({
    name: data.name,
    code: data.code,
    description: data.description || null,
    isActive: 1,
  });
  
  return { id: result.insertId, ...data };
}

export async function updateProgram(id: number, data: { name?: string; code?: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");
  
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.code !== undefined) updateData.code = data.code;
  if (data.description !== undefined) updateData.description = data.description;
  
  if (Object.keys(updateData).length > 0) {
    await db.update(programs)
      .set(updateData)
      .where(eq(programs.id, id));
  }
  
  return { success: true };
}

export async function toggleProgramStatus(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");
  
  const [program] = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
  if (!program) throw new Error("Empresa não encontrada");
  
  const newStatus = program.isActive === 1 ? 0 : 1;
  await db.update(programs)
    .set({ isActive: newStatus })
    .where(eq(programs.id, id));
  
  // Inativação/reativação em cascata: alunos e PDIs vinculados
  // Ao inativar empresa: inativar todos os alunos e PDIs
  // Ao reativar empresa: reativar todos os alunos e PDIs
  const alunosVinculados = await db.select({ id: alunos.id })
    .from(alunos)
    .where(eq(alunos.programId, id));
  
  if (alunosVinculados.length > 0) {
    await db.update(alunos)
      .set({ isActive: newStatus })
      .where(eq(alunos.programId, id));
  }
  
  // Inativar/reativar PDIs vinculados ao programa
  const pdisVinculados = await db.select({ id: assessmentPdi.id })
    .from(assessmentPdi)
    .where(eq(assessmentPdi.programId, id));
  
  if (pdisVinculados.length > 0) {
    if (newStatus === 0) {
      // Inativar: congelar PDIs (enum só permite 'ativo' e 'congelado')
      await db.update(assessmentPdi)
        .set({ status: 'congelado', motivoCongelamento: 'Empresa inativada - congelamento automático em cascata' })
        .where(and(eq(assessmentPdi.programId, id), eq(assessmentPdi.status, 'ativo')));
    } else {
      // Reativar: descongelar PDIs que foram congelados por cascata
      await db.update(assessmentPdi)
        .set({ status: 'ativo', motivoCongelamento: null })
        .where(and(
          eq(assessmentPdi.programId, id),
          eq(assessmentPdi.status, 'congelado'),
          eq(assessmentPdi.motivoCongelamento, 'Empresa inativada - congelamento automático em cascata')
        ));
    }
  }
  
  return {
    success: true,
    isActive: newStatus,
    alunosAfetados: alunosVinculados.length,
    pdisAfetados: pdisVinculados.length,
  };
}

// Mentores
// Retorna todos os mentores (ativos e inativos) - para listagem administrativa
export async function getAllMentores() {
  const db = await getDb();
  if (!db) return [];
  return await db.select()
    .from(consultors)
    .where(eq(consultors.role, 'mentor'))
    .orderBy(consultors.name);
}

// Retorna apenas mentores ativos - para dropdowns de seleção
export async function getActiveMentores() {
  const db = await getDb();
  if (!db) return [];
  return await db.select()
    .from(consultors)
    .where(and(eq(consultors.role, 'mentor'), eq(consultors.isActive, 1)))
    .orderBy(consultors.name);
}

export async function createMentor(data: { name: string; email: string; cpf?: string; especialidade?: string; loginId?: string; programId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");
  
  // Verificar CPF duplicado se fornecido
  if (data.cpf) {
    const normalizedCpf = data.cpf.replace(/\D/g, '');
    const existingUser = await db.select().from(users).where(eq(users.cpf, normalizedCpf)).limit(1);
    if (existingUser.length > 0) {
      return { success: false, message: `Este CPF já está cadastrado para o usuário: ${existingUser[0].name}` };
    }
    // Verificar também na tabela consultors por email
    const existingMentor = await db.select().from(consultors).where(eq(consultors.email, data.email.toLowerCase())).limit(1);
    if (existingMentor.length > 0) {
      return { success: false, message: `Já existe um mentor cadastrado com este email: ${existingMentor[0].name}` };
    }
  }
  
  const normalizedCpf = data.cpf ? data.cpf.replace(/\D/g, '') : null;
  const [result] = await db.insert(consultors).values({
    name: data.name,
    email: data.email.toLowerCase(),
    cpf: normalizedCpf,
    especialidade: data.especialidade || null,
    loginId: data.loginId || null,
    programId: data.programId || null,
    role: 'mentor',
    canLogin: data.loginId ? 1 : 0,
    isActive: 1,
  });
  
  const mentorId = result.insertId;
  
  // Se CPF fornecido, criar também o registro de acesso (users) para login com Email+CPF
  if (data.cpf) {
    const normalizedCpf = data.cpf.replace(/\D/g, '');
    const openId = `mentor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(users).values({
      openId,
      name: data.name,
      email: data.email.toLowerCase(),
      cpf: normalizedCpf,
      role: 'manager',
      consultorId: Number(mentorId),
      isActive: 1,
    });
  }
  
  return { success: true, id: mentorId, ...data };
}

// Gerentes
export async function getAllGerentes() {
  const db = await getDb();
  if (!db) return [];
  return await db.select()
    .from(consultors)
    .where(eq(consultors.role, 'gerente'))
    .orderBy(consultors.name);
}

export async function createGerente(data: { name: string; email: string; loginId?: string; managedProgramId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");
  
  const [result] = await db.insert(consultors).values({
    name: data.name,
    email: data.email.toLowerCase(),
    loginId: data.loginId || null,
    managedProgramId: data.managedProgramId,
    role: 'gerente',
    canLogin: data.loginId ? 1 : 0,
    isActive: 1,
  });
  
  return { id: result.insertId, ...data };
}

// Update consultor access
export async function updateConsultorAccess(consultorId: number, loginId: string | null, canLogin: boolean, role: 'mentor' | 'gerente') {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");
  
  await db.update(consultors)
    .set({ 
      loginId: loginId,
      canLogin: canLogin ? 1 : 0,
      role: role
    })
    .where(eq(consultors.id, consultorId));
  
  return { success: true };
}

// Update consultor (gerente/mentor) data
export async function updateConsultor(consultorId: number, data: { name?: string; email?: string; especialidade?: string; cpf?: string; managedProgramId?: number; programId?: number; photoUrl?: string; miniCurriculo?: string; isActive?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");
  
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email.toLowerCase();
  if (data.especialidade !== undefined) updateData.especialidade = data.especialidade;
  if (data.cpf !== undefined) updateData.cpf = data.cpf;
  if (data.managedProgramId !== undefined) updateData.managedProgramId = data.managedProgramId;
  if (data.programId !== undefined) updateData.programId = data.programId;
  if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
  if (data.miniCurriculo !== undefined) updateData.miniCurriculo = data.miniCurriculo;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  if (Object.keys(updateData).length > 0) {
    await db.update(consultors)
      .set(updateData)
      .where(eq(consultors.id, consultorId));
  }
  
  return { success: true };
}

// Alunos
export async function getAllAlunosForAdmin() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    id: alunos.id,
    name: alunos.name,
    email: alunos.email,
    cpf: alunos.cpf,
    externalId: alunos.externalId,
    consultorId: alunos.consultorId,
    programId: alunos.programId,
    turmaId: alunos.turmaId,
    isActive: alunos.isActive,
    canLogin: alunos.canLogin,
    createdAt: alunos.createdAt,
    contratoInicio: alunos.contratoInicio,
    contratoFim: alunos.contratoFim,
    totalSessoesContratadas: alunos.totalSessoesContratadas,
    tipoMentoria: alunos.tipoMentoria,
    onboardingLiberado: alunos.onboardingLiberado,
    telefone: alunos.telefone,
    cargo: alunos.cargo,
    areaAtuacao: alunos.areaAtuacao,
    minicurriculo: alunos.minicurriculo,
    quemEVoce: alunos.quemEVoce,
    programName: programs.name,
    mentorName: consultors.name,
    turmaName: turmas.name,
  })
    .from(alunos)
    .leftJoin(programs, eq(alunos.programId, programs.id))
    .leftJoin(consultors, eq(alunos.consultorId, consultors.id))
    .leftJoin(turmas, eq(alunos.turmaId, turmas.id))
    .orderBy(alunos.name);

  // Verificar quais alunos têm PDI (assessment_pdi)
  const pdiCounts = await db.select({
    alunoId: assessmentPdi.alunoId,
    count: sql<number>`COUNT(*)`,
  }).from(assessmentPdi).groupBy(assessmentPdi.alunoId);
  const pdiMap = new Map(pdiCounts.map(p => [p.alunoId, p.count]));

  return result.map(a => ({
    ...a,
    hasPdi: (pdiMap.get(a.id) ?? 0) > 0,
  }));
}

export async function updateAluno(alunoId: number, data: {
  name?: string;
  email?: string;
  cpf?: string | null;
  programId?: number | null;
  consultorId?: number | null;
  turmaId?: number | null;
  telefone?: string | null;
  cargo?: string | null;
  departmentId?: number | null;
  areaAtuacao?: string | null;
  minicurriculo?: string | null;
  quemEVoce?: string | null;
  photoUrl?: string | null;
  contratoInicio?: Date | null;
  contratoFim?: Date | null;
  tipoMentoria?: string | null;
  totalSessoesContratadas?: number | null;
}): Promise<{ success: boolean; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };
  
  const updateData: Record<string, unknown> = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email.toLowerCase();
  if (data.programId !== undefined) updateData.programId = data.programId;
  if (data.consultorId !== undefined) updateData.consultorId = data.consultorId;
  if (data.turmaId !== undefined) updateData.turmaId = data.turmaId;
  if (data.telefone !== undefined) updateData.telefone = data.telefone;
  if (data.cargo !== undefined) updateData.cargo = data.cargo;
  if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
  if (data.areaAtuacao !== undefined) updateData.areaAtuacao = data.areaAtuacao;
  if (data.minicurriculo !== undefined) updateData.minicurriculo = data.minicurriculo;
  if (data.quemEVoce !== undefined) updateData.quemEVoce = data.quemEVoce;
  if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
  if (data.contratoInicio !== undefined) updateData.contratoInicio = data.contratoInicio;
  if (data.contratoFim !== undefined) updateData.contratoFim = data.contratoFim;
  if (data.tipoMentoria !== undefined) updateData.tipoMentoria = data.tipoMentoria;
  if (data.totalSessoesContratadas !== undefined) updateData.totalSessoesContratadas = data.totalSessoesContratadas;
  
  if (data.cpf !== undefined) {
    if (data.cpf === null || data.cpf === '') {
      updateData.cpf = null;
    } else {
      const normalizedCpf = data.cpf.replace(/[.\-]/g, '');
      // Validar formato: 11 dígitos
      if (normalizedCpf.length !== 11 || !/^\d{11}$/.test(normalizedCpf)) {
        return { success: false, message: "CPF deve conter exatamente 11 dígitos numéricos." };
      }
      // Verificar CPF duplicado (excluindo o próprio aluno)
      const [existing] = await db.select()
        .from(alunos)
        .where(and(
          eq(alunos.cpf, normalizedCpf),
          not(eq(alunos.id, alunoId))
        ))
        .limit(1);
      if (existing) {
        return { success: false, message: `Este CPF já está cadastrado para o aluno: ${existing.name}` };
      }
      updateData.cpf = normalizedCpf;
    }
  }
  
  // Se o contratoFim mudou pelo cadastro, sincronizar com o contrato formal e
  // propagar para macro/micro jornadas (fonte única de datas, sem divergência)
  let contratoFimAlterado = false;
  if (data.contratoFim !== undefined && data.contratoFim !== null) {
    const [alunoAtual] = await db.select({ contratoFim: alunos.contratoFim })
      .from(alunos).where(eq(alunos.id, alunoId)).limit(1);
    const atualStr = alunoAtual?.contratoFim
      ? new Date(alunoAtual.contratoFim).toISOString().split('T')[0]
      : null;
    const novoStr = new Date(data.contratoFim).toISOString().split('T')[0];
    contratoFimAlterado = atualStr !== novoStr;
    if (contratoFimAlterado) {
      // Valida antes de gravar qualquer coisa (lança erro se micro inicia após a nova data)
      await propagarPeriodoContrato(alunoId, new Date(data.contratoFim));
      // Sincronizar o contrato formal ativo, se existir
      await db.update(contratosAluno)
        .set({ periodoTermino: novoStr as any })
        .where(and(eq(contratosAluno.alunoId, alunoId), eq(contratosAluno.isActive, 1)));
    }
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(alunos)
      .set(updateData)
      .where(eq(alunos.id, alunoId));
  }
  
  return { success: true };
}

export async function createAluno(data: { name: string; email: string; externalId: string; programId?: number; contratoInicio?: string; contratoFim?: string; totalSessoesContratadas?: number; tipoMentoria?: 'individual' | 'grupo'; plataformaAulas?: 'scaffold' | 'sistema_interno'; tipoPortal?: 'desenvolvimento' | 'assessment' }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");
  
  const normalizedId = data.externalId.replace(/\D/g, '');
  
  // Verificar se já existe aluno com este externalId
  const [existing] = await db.select()
    .from(alunos)
    .where(eq(alunos.externalId, normalizedId))
    .limit(1);
  
  if (existing) {
    throw new Error(`Já existe um aluno com o ID ${normalizedId}`);
  }

  // Verificar se já existe aluno com este email
  const [existingEmail] = await db.select()
    .from(alunos)
    .where(eq(alunos.email, data.email.toLowerCase()))
    .limit(1);

  if (existingEmail) {
    throw new Error(`Já existe um aluno com o email ${data.email}`);
  }

  // Verificar se já existe user com este ID
  const [existingUser] = await db.select()
    .from(users)
    .where(eq(users.cpf, normalizedId))
    .limit(1);

  if (existingUser) {
    throw new Error(`Este ID já está cadastrado no sistema.`);
  }
  
  // 1. Criar registro na tabela alunos (sem mentor - vai para Onboarding)
  const [result] = await db.insert(alunos).values({
    name: data.name,
    email: data.email.toLowerCase(),
    externalId: normalizedId,
    programId: data.programId || null,
    canLogin: 1,
    isActive: 1,
    contratoInicio: data.contratoInicio ? new Date(data.contratoInicio) : null,
    contratoFim: data.contratoFim ? new Date(data.contratoFim) : null,
    tipoMentoria: data.tipoMentoria || 'individual',
    plataformaAulas: data.plataformaAulas || 'sistema_interno',
    tipoPortal: data.tipoPortal || 'desenvolvimento',
  });

  const alunoId = result.insertId;
  
  // 2. Criar registro na tabela users para login (Email + ID)
  const openId = `access_user_${normalizedId}`;
  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email.toLowerCase(),
    cpf: normalizedId,
    role: 'user',
    programId: data.programId || null,
    alunoId: Number(alunoId),
    loginMethod: 'email_cpf',
    isActive: 1,
    lastSignedIn: new Date(),
  });

  // 3. Criar registro de contrato se houver dados de contrato
  if (data.contratoInicio && data.contratoFim && data.programId) {
    try {
      await db.insert(contratosAluno).values({
        alunoId: Number(alunoId),
        programId: data.programId,
        periodoInicio: data.contratoInicio,
        periodoTermino: data.contratoFim,
        totalSessoesContratadas: data.totalSessoesContratadas || 0,
        isActive: 1,
      });
      console.log(`[Cadastro Onboarding] Contrato criado para aluno ${alunoId}: ${data.contratoInicio} a ${data.contratoFim}, ${data.totalSessoesContratadas || 0} sessões`);
    } catch (err) {
      console.error(`[Cadastro Onboarding] Erro ao criar contrato:`, err);
    }
  }

  console.log(`[Cadastro Onboarding] Aluno criado: ${data.name} (ID: ${normalizedId}, Email: ${data.email}) - alunoId: ${alunoId}`);
  
  return { id: alunoId, ...data };
}


// ============ UPLOAD HISTORY FUNCTIONS ============
export async function getUploadHistory(fileType?: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select({
    id: uploadedFiles.id,
    fileName: uploadedFiles.fileName,
    fileKey: uploadedFiles.fileKey,
    fileUrl: uploadedFiles.fileUrl,
    fileType: uploadedFiles.fileType,
    fileSize: uploadedFiles.fileSize,
    rowCount: uploadedFiles.rowCount,
    status: uploadedFiles.status,
    createdAt: uploadedFiles.createdAt,
    batchId: uploadedFiles.batchId,
    weekNumber: uploadBatches.weekNumber,
    year: uploadBatches.year
  })
  .from(uploadedFiles)
  .leftJoin(uploadBatches, eq(uploadedFiles.batchId, uploadBatches.id))
  .orderBy(desc(uploadedFiles.createdAt))
  .limit(limit);
  
  if (fileType) {
    return await db.select({
      id: uploadedFiles.id,
      fileName: uploadedFiles.fileName,
      fileKey: uploadedFiles.fileKey,
      fileUrl: uploadedFiles.fileUrl,
      fileType: uploadedFiles.fileType,
      fileSize: uploadedFiles.fileSize,
      rowCount: uploadedFiles.rowCount,
      status: uploadedFiles.status,
      createdAt: uploadedFiles.createdAt,
      batchId: uploadedFiles.batchId,
      weekNumber: uploadBatches.weekNumber,
      year: uploadBatches.year
    })
    .from(uploadedFiles)
    .leftJoin(uploadBatches, eq(uploadedFiles.batchId, uploadBatches.id))
    .where(eq(uploadedFiles.fileType, fileType as any))
    .orderBy(desc(uploadedFiles.createdAt))
    .limit(limit);
  }
  
  return await query;
}

// Obter arquivos antigos para limpeza (mais de 3 versões por tipo)
export async function getOldFilesToCleanup(fileType: string, keepCount = 3) {
  const db = await getDb();
  if (!db) return [];
  
  // Pegar todos os arquivos do tipo, ordenados por data
  const allFiles = await db.select()
    .from(uploadedFiles)
    .where(eq(uploadedFiles.fileType, fileType as any))
    .orderBy(desc(uploadedFiles.createdAt));
  
  // Retornar apenas os que excedem o limite
  if (allFiles.length > keepCount) {
    return allFiles.slice(keepCount);
  }
  
  return [];
}

// Deletar arquivo do histórico
export async function deleteUploadedFile(id: number) {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(uploadedFiles).where(eq(uploadedFiles.id, id));
  return true;
}


// ============ ADMIN LOGIN FUNCTIONS ============

// Login para Administradores (username + password)
// ============ LOGIN UNIVERSAL EMAIL + CPF ou ID ============

/**
 * Login universal para alunos, mentores e gerentes.
 * 
 * Regras de login para ALUNOS:
 * 1. Se o aluno tem CPF cadastrado → login com Email + CPF
 * 2. Se o aluno NÃO tem CPF → login com Email + ID do aluno (externalId)
 * 3. Alunos SEBRAE TO com CPF usam EXCLUSIVAMENTE CPF (participam do Projeto Evoluir)
 * 
 * Mentores/Gerentes: login com Email + CPF (tabela consultors)
 * Admin: login separado via adminLogin
 */
export async function authenticateByEmailCpf(email: string, credential: string): Promise<{ success: boolean; user?: any; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };
  
  // Normalizar credencial (remover pontos e traços)
  const normalizedCredential = credential.replace(/[.\-]/g, '');
  const normalizedEmail = email.toLowerCase().trim();
  
  // ===== 1. Tentar login em users (admin/manager já cadastrados) =====
  const [user] = await db.select()
    .from(users)
    .where(and(
      eq(users.email, normalizedEmail),
      eq(users.cpf, normalizedCredential),
      eq(users.isActive, 1)
    ))
    .limit(1);
  
  if (user) {
    // Verificação extra: se o user tem alunoId vinculado, verificar se o aluno está ativo
    if (user.alunoId) {
      const [linkedAluno] = await db.select({ isActive: alunos.isActive, canLogin: alunos.canLogin })
        .from(alunos)
        .where(eq(alunos.id, user.alunoId))
        .limit(1);
      if (linkedAluno && (linkedAluno.isActive === 0 || linkedAluno.canLogin === 0)) {
        return { success: false, message: "Sua conta está inativa. Entre em contato com o administrador." };
      }
    }
    
    // Verificação extra: se o user tem consultorId vinculado, verificar se o consultor está ativo
    if (user.consultorId) {
      const [linkedConsultor] = await db.select({ isActive: consultors.isActive })
        .from(consultors)
        .where(eq(consultors.id, user.consultorId))
        .limit(1);
      if (linkedConsultor && linkedConsultor.isActive === 0) {
        return { success: false, message: "Sua conta está inativa. Entre em contato com o administrador." };
      }
    }
    
    await db.update(users)
      .set({ lastSignedIn: new Date() })
      .where(eq(users.id, user.id));
    
    return {
      success: true,
      user: {
        id: user.id,
        openId: user.openId,
        name: user.name,
        email: user.email,
        role: user.role,
        programId: user.programId,
        alunoId: user.alunoId,
        consultorId: user.consultorId
      }
    };
  }
  
  // ===== 2. Tentar login de ALUNO por CPF (aluno.cpf preenchido) =====
  const [alunoByCpf] = await db.select()
    .from(alunos)
    .where(and(
      eq(alunos.email, normalizedEmail),
      eq(alunos.cpf, normalizedCredential),
      eq(alunos.canLogin, 1),
      eq(alunos.isActive, 1)
    ))
    .limit(1);
  
  if (alunoByCpf) {
    return await createOrUpdateAlunoSession(db, alunoByCpf, normalizedCredential);
  }
  
  // ===== 3. Tentar login de ALUNO por ID (externalId) - apenas se NÃO tem CPF =====
  const [alunoById] = await db.select()
    .from(alunos)
    .where(and(
      eq(alunos.email, normalizedEmail),
      eq(alunos.externalId, normalizedCredential),
      eq(alunos.canLogin, 1),
      eq(alunos.isActive, 1)
    ))
    .limit(1);
  
  if (alunoById) {
    // Se o aluno tem CPF cadastrado, NÃO permitir login por ID
    if (alunoById.cpf) {
      return { success: false, message: "Este aluno deve fazer login com Email e CPF (não com ID)." };
    }
    return await createOrUpdateAlunoSession(db, alunoById, normalizedCredential);
  }
  
  // ===== 4. Tentar login de CONSULTOR (mentor/gerente) por CPF =====
  const [consultor] = await db.select()
    .from(consultors)
    .where(and(
      eq(consultors.email, normalizedEmail),
      eq(consultors.cpf, normalizedCredential),
      eq(consultors.isActive, 1),
      eq(consultors.canLogin, 1)
    ))
    .limit(1);
  
  if (consultor) {
    const role = 'manager' as const;
    const openId = `consultor_${consultor.id}`;
    
    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.openId, openId))
      .limit(1);
    
    if (existingUser) {
      await db.update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, existingUser.id));
      
      return {
        success: true,
        user: {
          id: existingUser.id,
          openId: existingUser.openId,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          programId: existingUser.programId,
          consultorId: consultor.id
        }
      };
    } else {
      await db.insert(users).values({
        openId,
        name: consultor.name,
        email: consultor.email!.toLowerCase(),
        cpf: normalizedCredential,
        role,
        loginMethod: 'email_cpf',
        isActive: 1,
        consultorId: consultor.id,
        programId: consultor.managedProgramId ?? null,
        lastSignedIn: new Date(),
      });
      
      const [newUser] = await db.select()
        .from(users)
        .where(eq(users.openId, openId))
        .limit(1);
      
      return {
        success: true,
        user: {
          id: newUser?.id,
          openId,
          name: consultor.name,
          email: consultor.email,
          role,
          programId: consultor.managedProgramId,
          consultorId: consultor.id
        }
      };
    }
  }
  
  return { success: false, message: "Email ou CPF/ID incorretos, ou usuário inativo. Verifique suas credenciais." };
}

/**
 * Helper: cria ou atualiza sessão de aluno na tabela users
 */
async function createOrUpdateAlunoSession(db: any, aluno: any, normalizedCredential: string) {
  // Verificação de segurança: bloquear se aluno está inativo
  if (aluno.isActive === 0 || aluno.canLogin === 0) {
    return { success: false, message: "Sua conta está inativa. Entre em contato com o administrador." };
  }
  
  const openId = `aluno_${aluno.id}`;
  
  const [existingUser] = await db.select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  
  if (existingUser) {
    // Verificação extra: se o user está inativo, bloquear
    if (existingUser.isActive === 0) {
      return { success: false, message: "Sua conta está inativa. Entre em contato com o administrador." };
    }
    
    await db.update(users)
      .set({ lastSignedIn: new Date() })
      .where(eq(users.id, existingUser.id));
    
    return {
      success: true,
      user: {
        id: existingUser.id,
        openId: existingUser.openId,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        programId: existingUser.programId,
        alunoId: aluno.id,
        consultorId: existingUser.consultorId
      }
    };
  } else {
    await db.insert(users).values({
      openId,
      name: aluno.name,
      email: aluno.email?.toLowerCase(),
      cpf: aluno.cpf || normalizedCredential,
      role: 'user' as const,
      loginMethod: aluno.cpf ? 'email_cpf' : 'email_id',
      isActive: 1,
      alunoId: aluno.id,
      programId: aluno.programId ?? null,
      lastSignedIn: new Date(),
    });
    
    const [newUser] = await db.select()
      .from(users)
      .where(eq(users.openId, openId))
      .limit(1);
    
    return {
      success: true,
      user: {
        id: newUser?.id,
        openId,
        name: aluno.name,
        email: aluno.email,
        role: 'user',
        programId: aluno.programId,
        alunoId: aluno.id
      }
    };
  }
}

// ============ GESTÃO DE ACESSO (ADMIN) ============

export async function createAccessUser(data: {
  name: string;
  email: string;
  cpf: string;
  role: 'user' | 'admin' | 'manager';
  programId?: number | null;
  alunoId?: number | null;
  consultorId?: number | null;
}): Promise<{ success: boolean; user?: any; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };
  
  const normalizedCpf = data.cpf.replace(/[.\-]/g, '');
  
  // Verificar CPF duplicado
  const [existing] = await db.select()
    .from(users)
    .where(eq(users.cpf, normalizedCpf))
    .limit(1);
  
  if (existing) {
    return { success: false, message: "Este CPF já está cadastrado no sistema." };
  }
  
  // Verificar email duplicado
  const [existingEmail] = await db.select()
    .from(users)
    .where(eq(users.email, data.email.toLowerCase()))
    .limit(1);
  
  if (existingEmail) {
    return { success: false, message: "Este email já está cadastrado no sistema." };
  }
  
  const openId = `access_${data.role}_${normalizedCpf}`;
  
  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email.toLowerCase(),
    cpf: normalizedCpf,
    role: data.role,
    programId: data.programId ?? null,
    alunoId: data.alunoId ?? null,
    consultorId: data.consultorId ?? null,
    loginMethod: 'email_cpf',
    isActive: 1,
    lastSignedIn: new Date(),
  });
  
  return {
    success: true,
    user: { openId, name: data.name, email: data.email, role: data.role }
  };
}

export async function updateAccessUser(userId: number, data: {
  name?: string;
  email?: string;
  cpf?: string;
  role?: 'user' | 'admin' | 'manager';
  programId?: number | null;
  isActive?: number;
  consultorId?: number | null;
}): Promise<{ success: boolean; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };
  
  const updateData: Record<string, unknown> = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email.toLowerCase();
  if (data.role !== undefined) updateData.role = data.role;
  if (data.programId !== undefined) updateData.programId = data.programId;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  if (data.cpf !== undefined) {
    const normalizedCpf = data.cpf.replace(/[.\-]/g, '');
    // Verificar CPF duplicado (excluindo o próprio usuário)
    const [existing] = await db.select()
      .from(users)
      .where(and(
        eq(users.cpf, normalizedCpf),
        not(eq(users.id, userId))
      ))
      .limit(1);
    
    if (existing) {
      return { success: false, message: "Este CPF já está cadastrado para outro usuário." };
    }
    updateData.cpf = normalizedCpf;
  }
  
  if (data.email !== undefined) {
    // Verificar email duplicado (excluindo o próprio usuário)
    const [existingEmail] = await db.select()
      .from(users)
      .where(and(
        eq(users.email, data.email.toLowerCase()),
        not(eq(users.id, userId))
      ))
      .limit(1);
    
    if (existingEmail) {
      return { success: false, message: "Este email já está cadastrado para outro usuário." };
    }
  }
  
  await db.update(users)
    .set(updateData)
    .where(eq(users.id, userId));

  // Se email foi alterado, atualizar também em processo_candidatos para evitar duplicação
  if (data.email !== undefined) {
    try {
      await db.update(processoCandidatos)
        .set({ email: data.email.toLowerCase() })
        .where(eq(processoCandidatos.userId, userId));
    } catch (e) {
      console.warn('[updateAccessUser] Erro ao atualizar email em processo_candidatos:', e);
    }
  }

  // Se nome foi alterado, atualizar também em processo_candidatos
  if (data.name !== undefined) {
    try {
      await db.update(processoCandidatos)
        .set({ nome: data.name })
        .where(eq(processoCandidatos.userId, userId));
    } catch (e) {
      console.warn('[updateAccessUser] Erro ao atualizar nome em processo_candidatos:', e);
    }
  }
  
  // Se consultorId foi passado, atualizar o mentor na tabela alunos
  if (data.consultorId !== undefined) {
    // Buscar o aluno vinculado a este userId via externalId (cpf do user = externalId do aluno)
    const [userRecord] = await db.select({ cpf: users.cpf, alunoId: users.alunoId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (userRecord) {
      // Tentar vincular por alunoId direto, ou por externalId (cpf)
      let alunoRecord: any = null;
      if (userRecord.alunoId) {
        [alunoRecord] = await db.select({ id: alunos.id })
          .from(alunos)
          .where(eq(alunos.id, userRecord.alunoId))
          .limit(1);
      }
      if (!alunoRecord && userRecord.cpf) {
        [alunoRecord] = await db.select({ id: alunos.id })
          .from(alunos)
          .where(eq(alunos.externalId, userRecord.cpf))
          .limit(1);
      }
      if (alunoRecord) {
        await db.update(alunos)
          .set({ consultorId: data.consultorId })
          .where(eq(alunos.id, alunoRecord.id));
      }
    }
  }
  
  return { success: true };
}

export async function getAccessUsers(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: users.id,
    openId: users.openId,
    name: users.name,
    email: users.email,
    cpf: users.cpf,
    role: users.role,
    programId: users.programId,
    programName: programs.name,
    alunoId: users.alunoId,
    consultorId: users.consultorId,
    isActive: users.isActive,
    loginMethod: users.loginMethod,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
    mentorNome: consultors.name,
  })
    .from(users)
    .leftJoin(programs, eq(users.programId, programs.id))
    .leftJoin(alunos, eq(users.alunoId, alunos.id))
    .leftJoin(consultors, eq(alunos.consultorId, consultors.id))
    .where(eq(users.loginMethod, 'email_cpf'))
    .orderBy(desc(users.createdAt));
  
  return result;
}

export async function deleteAccessUser(userId: number): Promise<{ success: boolean; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };
  
  await db.update(users)
    .set({ isActive: 0 })
    .where(eq(users.id, userId));
  
  return { success: true };
}

export async function toggleAccessUserStatus(userId: number): Promise<{ success: boolean; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };
  
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { success: false, message: "Usuário não encontrado" };
  
  const newStatus = user.isActive === 1 ? 0 : 1;
  await db.update(users)
    .set({ isActive: newStatus })
    .where(eq(users.id, userId));
  
  // Sincronizar: se o user tem alunoId vinculado, atualizar isActive e canLogin do aluno também
  if (user.alunoId) {
    await db.update(alunos)
      .set({ isActive: newStatus, canLogin: newStatus })
      .where(eq(alunos.id, user.alunoId));
  }
  
  // Sincronizar: se o user tem consultorId vinculado, atualizar isActive e canLogin do consultor
  if (user.consultorId) {
    await db.update(consultors)
      .set({ isActive: newStatus, canLogin: newStatus })
      .where(eq(consultors.id, user.consultorId));
  }
  
  return { success: true };
}


export async function authenticateAdmin(username: string, passwordHash: string): Promise<{ success: boolean; user?: any; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };
  
  // Buscar por email ou openId
  const [user] = await db.select()
    .from(users)
    .where(and(
      or(eq(users.email, username), eq(users.openId, username)),
      or(eq(users.role, 'admin'), eq(users.role, 'admin2'))
    ))
    .limit(1);
  
  if (!user) {
    return { success: false, message: "Usuário não encontrado ou não é administrador" };
  }
  
  if (!user.passwordHash) {
    return { success: false, message: "Este usuário não possui senha configurada. Use o login Manus." };
  }
  
  if (user.passwordHash !== passwordHash) {
    return { success: false, message: "Senha incorreta" };
  }
  
  // Atualizar último login
  await db.update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));
  
  return {
    success: true,
    user: {
      id: user.id,
      openId: user.openId,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}


// ============ TRILHAS FUNCTIONS ============

export async function createTrilha(data: InsertTrilha) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(trilhas).values(data);
  return result[0].insertId;
}

export async function getAllTrilhas() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(trilhas).orderBy(trilhas.ordem);
}

export async function getTrilhaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(trilhas).where(eq(trilhas.id, id)).limit(1);
  return result[0];
}

export async function updateTrilha(id: number, data: Partial<InsertTrilha>) {
  const db = await getDb();
  if (!db) return;
  await db.update(trilhas).set(data).where(eq(trilhas.id, id));
}

export async function deleteTrilha(id: number) {
  const db = await getDb();
  if (!db) return false;
  // Verificar se há competências vinculadas
  const competenciasVinculadas = await db.select().from(competencias).where(eq(competencias.trilhaId, id));
  if (competenciasVinculadas.length > 0) {
    return false; // Não pode excluir trilha com competências vinculadas
  }
  await db.delete(trilhas).where(eq(trilhas.id, id));
  return true;
}

// ============ COMPETÊNCIAS FUNCTIONS ============

export async function createCompetencia(data: InsertCompetencia) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(competencias).values(data);
  return result[0].insertId;
}

export async function getAllCompetencias() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(competencias).orderBy(competencias.trilhaId, competencias.ordem);
}

export async function getCompetenciasByTrilha(trilhaId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(competencias)
    .where(eq(competencias.trilhaId, trilhaId))
    .orderBy(competencias.ordem);
}

export async function getCompetenciaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(competencias).where(eq(competencias.id, id)).limit(1);
  return result[0];
}

export async function updateCompetencia(id: number, data: Partial<InsertCompetencia>) {
  const db = await getDb();
  if (!db) return;
  await db.update(competencias).set(data).where(eq(competencias.id, id));
}

export async function deleteCompetencia(id: number) {
  const db = await getDb();
  if (!db) return false;
  // TODO: Verificar se há PDIs vinculados antes de excluir
  await db.delete(competencias).where(eq(competencias.id, id));
  return true;
}

// Buscar competências com detalhes da trilha
export async function getCompetenciasWithTrilha() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: competencias.id,
    nome: competencias.nome,
    codigoIntegracao: competencias.codigoIntegracao,
    descricao: competencias.descricao,
    ordem: competencias.ordem,
    isActive: competencias.isActive,
    trilhaId: competencias.trilhaId,
    trilhaNome: trilhas.name,
    trilhaCodigo: trilhas.codigo
  })
  .from(competencias)
  .leftJoin(trilhas, eq(competencias.trilhaId, trilhas.id))
  .orderBy(trilhas.ordem, competencias.ordem);
  
  return result;
}


// ============ PLANO INDIVIDUAL FUNCTIONS ============

// Buscar plano individual de um aluno
export async function getPlanoIndividualByAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: planoIndividual.id,
    alunoId: planoIndividual.alunoId,
    competenciaId: planoIndividual.competenciaId,
    isObrigatoria: planoIndividual.isObrigatoria,
    notaAtual: planoIndividual.notaAtual,
    metaNota: planoIndividual.metaNota,
    status: planoIndividual.status,
    competenciaNome: competencias.nome,
    competenciaCodigo: competencias.codigoIntegracao,
    trilhaId: competencias.trilhaId,
    trilhaNome: trilhas.name
  })
  .from(planoIndividual)
  .leftJoin(competencias, eq(planoIndividual.competenciaId, competencias.id))
  .leftJoin(trilhas, eq(competencias.trilhaId, trilhas.id))
  .where(eq(planoIndividual.alunoId, alunoId))
  .orderBy(trilhas.ordem, competencias.ordem);
  
  return result;
}

export async function getPlanoIndividualByAlunoAndNivel(alunoId: number, contratoNivelId?: number | null) {
  if (!contratoNivelId) return getPlanoIndividualByAluno(alunoId);
  const db = await getDb();
  if (!db) return [];

  return db.select({
    id: planoIndividual.id,
    alunoId: planoIndividual.alunoId,
    contratoNivelId: planoIndividual.contratoNivelId,
    competenciaId: planoIndividual.competenciaId,
    isObrigatoria: planoIndividual.isObrigatoria,
    notaAtual: planoIndividual.notaAtual,
    metaNota: planoIndividual.metaNota,
    status: planoIndividual.status,
    competenciaNome: competencias.nome,
    competenciaCodigo: competencias.codigoIntegracao,
    trilhaId: competencias.trilhaId,
    trilhaNome: trilhas.name
  })
    .from(planoIndividual)
    .leftJoin(competencias, eq(planoIndividual.competenciaId, competencias.id))
    .leftJoin(trilhas, eq(competencias.trilhaId, trilhas.id))
    .where(and(
      eq(planoIndividual.alunoId, alunoId),
      eq(planoIndividual.contratoNivelId, contratoNivelId),
    ))
    .orderBy(trilhas.ordem, competencias.ordem);
}

// Adicionar competência ao plano individual
export async function addCompetenciaToPlano(data: {
  alunoId: number;
  contratoNivelId?: number | null;
  competenciaId: number;
  isObrigatoria?: number;
  metaNota?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  await assertNivelPermiteNovasAtribuicoes(data.alunoId, data.contratoNivelId, "planoIndividual.addCompetencia");
  const contratoNivelIdResolved = await resolveContratoNivelId(data.alunoId, data.contratoNivelId);
  
  const [result] = await db.insert(planoIndividual).values({
    alunoId: data.alunoId,
    contratoNivelId: contratoNivelIdResolved,
    competenciaId: data.competenciaId,
    isObrigatoria: data.isObrigatoria ?? 1,
    metaNota: data.metaNota ?? "7.00",
    status: "pendente"
  });
  
  return result.insertId;
}

// Adicionar múltiplas competências ao plano individual
export async function addCompetenciasToPlano(alunoId: number, competenciaIds: number[], contratoNivelId?: number | null) {
  const db = await getDb();
  if (!db) return false;
  await assertNivelPermiteNovasAtribuicoes(alunoId, contratoNivelId, "planoIndividual.addMultiple");
  const contratoNivelIdResolved = await resolveContratoNivelId(alunoId, contratoNivelId);
  
  const values = competenciaIds.map(competenciaId => ({
    alunoId,
    contratoNivelId: contratoNivelIdResolved,
    competenciaId,
    isObrigatoria: 1,
    metaNota: "7.00",
    status: "pendente" as const
  }));
  
  await db.insert(planoIndividual).values(values);
  return true;
}

// Sincronizar plano_individual a partir dos assessment_competencias de um aluno
// Adiciona competências que estão no assessment mas não no plano_individual
export async function syncPlanoFromAssessment(alunoId: number) {
  const db = await getDb();
  if (!db) return { added: 0 };
  
  // Buscar todas as competências dos assessments do aluno
  const assessmentComps = await db.select({
    competenciaId: assessmentCompetencias.competenciaId,
    peso: assessmentCompetencias.peso,
    nivelAtual: assessmentCompetencias.nivelAtual,
    metaFinal: assessmentCompetencias.metaFinal,
  })
  .from(assessmentCompetencias)
  .innerJoin(assessmentPdi, eq(assessmentCompetencias.assessmentPdiId, assessmentPdi.id))
  .where(eq(assessmentPdi.alunoId, alunoId));
  
  // Agrupar por competenciaId (priorizar obrigatória se duplicada)
  const uniqueMap = new Map<number, typeof assessmentComps[0]>();
  for (const c of assessmentComps) {
    const existing = uniqueMap.get(c.competenciaId);
    if (!existing) {
      uniqueMap.set(c.competenciaId, c);
    } else if (c.peso === 'obrigatoria') {
      uniqueMap.set(c.competenciaId, c);
    }
  }
  
  // Buscar competências já existentes no plano_individual
  const existingPlano = await db.select({ competenciaId: planoIndividual.competenciaId })
    .from(planoIndividual)
    .where(eq(planoIndividual.alunoId, alunoId));
  const existingIds = new Set(existingPlano.map(p => p.competenciaId));
  
  // Inserir apenas as que não existem ainda
  let added = 0;
  for (const [compId, comp] of Array.from(uniqueMap.entries())) {
    if (!existingIds.has(compId)) {
      await db.insert(planoIndividual).values({
        alunoId,
        competenciaId: compId,
        isObrigatoria: comp.peso === 'obrigatoria' ? 1 : 0,
        notaAtual: comp.nivelAtual ? String(comp.nivelAtual) : null,
        metaNota: comp.metaFinal ? String(comp.metaFinal) : "7.00",
        status: "pendente",
      });
      added++;
    }
  }
  
  return { added };
}

// Remover competência do plano individual
export async function removeCompetenciaFromPlano(id: number) {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(planoIndividual).where(eq(planoIndividual.id, id));
  return true;
}

// Atualizar item do plano individual
export async function updatePlanoIndividualItem(id: number, data: {
  isObrigatoria?: number;
  notaAtual?: string;
  metaNota?: string;
  status?: "pendente" | "em_progresso" | "concluida";
}) {
  const db = await getDb();
  if (!db) return false;
  
  await db.update(planoIndividual)
    .set(data)
    .where(eq(planoIndividual.id, id));
  return true;
}

// Limpar plano individual de um aluno
export async function clearPlanoIndividual(alunoId: number) {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(planoIndividual).where(eq(planoIndividual.alunoId, alunoId));
  return true;
}

// Buscar alunos com seus planos individuais
export async function getAlunosWithPlano(programId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar alunos
  let alunosList;
  if (programId) {
    alunosList = await db.select().from(alunos).where(eq(alunos.programId, programId));
  } else {
    alunosList = await db.select().from(alunos);
  }
  
  // Para cada aluno, contar competências do plano
  const result = [];
  for (const aluno of alunosList) {
    const planoItems = await db.select()
      .from(planoIndividual)
      .where(eq(planoIndividual.alunoId, aluno.id));
    
    const obrigatorias = planoItems.filter(p => p.isObrigatoria === 1).length;
    const concluidas = planoItems.filter(p => p.status === "concluida").length;
    
    result.push({
      ...aluno,
      totalCompetencias: planoItems.length,
      competenciasObrigatorias: obrigatorias,
      competenciasConcluidas: concluidas,
      progressoPlano: obrigatorias > 0 ? Math.round((concluidas / obrigatorias) * 100) : 0
    });
  }
  
  return result;
}

// Buscar competências de um aluno (obrigatórias + opcionais) para atribuição de curso e cálculo de performance
export async function getCompetenciasObrigatoriasAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return [];

  // Buscar competências do PDI ativo do aluno (assessment_competencias → assessment_pdi ativo)
  const result = await db.select({
    id: assessmentCompetencias.id,
    competenciaId: assessmentCompetencias.competenciaId,
    nome: competencias.nome,
    codigoIntegracao: competencias.codigoIntegracao,
    notaAtual: assessmentCompetencias.nivelAtual,
    metaNota: assessmentCompetencias.metaFinal,
    status: sql<string>`'ativo'`,
    isObrigatoria: sql<number>`IF(${assessmentCompetencias.peso} = 'obrigatoria', 1, 0)`,
    microInicio: assessmentCompetencias.microInicio,
    microTermino: assessmentCompetencias.microTermino,
  })
  .from(assessmentCompetencias)
  .innerJoin(assessmentPdi, and(
    eq(assessmentCompetencias.assessmentPdiId, assessmentPdi.id),
    eq(assessmentPdi.alunoId, alunoId),
    eq(assessmentPdi.status, 'ativo')
  ))
  .leftJoin(competencias, eq(assessmentCompetencias.competenciaId, competencias.id));

  // Fallback: se não há PDI ativo, retornar competências do plano_individual (comportamento anterior)
  if (result.length === 0) {
    const fallback = await db.select({
      id: planoIndividual.id,
      competenciaId: planoIndividual.competenciaId,
      nome: competencias.nome,
      codigoIntegracao: competencias.codigoIntegracao,
      notaAtual: planoIndividual.notaAtual,
      metaNota: planoIndividual.metaNota,
      status: planoIndividual.status,
      isObrigatoria: planoIndividual.isObrigatoria,
    })
    .from(planoIndividual)
    .leftJoin(competencias, eq(planoIndividual.competenciaId, competencias.id))
    .where(eq(planoIndividual.alunoId, alunoId));
    return fallback;
  }

  return result;
}

// Buscar todos os registros do plano individual (para cálculo de indicadores em massa)
export async function getAllPlanoIndividual() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: planoIndividual.id,
    alunoId: planoIndividual.alunoId,
    competenciaId: planoIndividual.competenciaId,
    isObrigatoria: planoIndividual.isObrigatoria,
    notaAtual: planoIndividual.notaAtual,
    metaNota: planoIndividual.metaNota,
    status: planoIndividual.status,
    competenciaNome: competencias.nome,
    trilhaNome: trilhas.name,
  })
  .from(planoIndividual)
  .leftJoin(competencias, eq(planoIndividual.competenciaId, competencias.id))
  .leftJoin(trilhas, eq(competencias.trilhaId, trilhas.id));
  
  return result;
}


// ============ CICLOS DE EXECUÇÃO FUNCTIONS ============

import { ciclosExecucao, InsertCicloExecucao, CicloExecucao, cicloCompetencias, InsertCicloCompetencia, CicloCompetencia } from "../drizzle/schema";

// Criar ciclo de execução
export async function createCicloExecucao(data: {
  alunoId: number;
  nomeCiclo: string;
  dataInicio: string;
  dataFim: string;
  definidoPor?: number;
  observacoes?: string;
  competenciaIds: number[];
}) {
  const db = await getDb();
  if (!db) return null;
  
  const [result] = await db.insert(ciclosExecucao).values({
    alunoId: data.alunoId,
    nomeCiclo: data.nomeCiclo,
    dataInicio: data.dataInicio,
    dataFim: data.dataFim,
    definidoPor: data.definidoPor,
    observacoes: data.observacoes,
  });
  
  const cicloId = result.insertId;
  
  // Adicionar competências ao ciclo
  if (data.competenciaIds.length > 0) {
    const values = data.competenciaIds.map(competenciaId => ({
      cicloId,
      competenciaId,
    }));
    await db.insert(cicloCompetencias).values(values);
  }
  
  return cicloId;
}

// Buscar ciclos de um aluno
export async function getCiclosByAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const ciclos = await db.select()
    .from(ciclosExecucao)
    .where(eq(ciclosExecucao.alunoId, alunoId))
    .orderBy(ciclosExecucao.dataInicio);
  
  // Para cada ciclo, buscar competências vinculadas
  const result = [];
  for (const ciclo of ciclos) {
    const comps = await db.select({
      id: cicloCompetencias.id,
      competenciaId: cicloCompetencias.competenciaId,
      competenciaNome: competencias.nome,
      competenciaCodigo: competencias.codigoIntegracao,
      trilhaId: competencias.trilhaId,
      trilhaNome: trilhas.name,
    })
    .from(cicloCompetencias)
    .leftJoin(competencias, eq(cicloCompetencias.competenciaId, competencias.id))
    .leftJoin(trilhas, eq(competencias.trilhaId, trilhas.id))
    .where(eq(cicloCompetencias.cicloId, ciclo.id));
    
    result.push({
      ...ciclo,
      competencias: comps,
      competenciaIds: comps.map(c => c.competenciaId),
    });
  }
  
  return result;
}

// Gerar ciclos derivados do PDI (assessment_competencias) para exibição na aba Ciclos de Execução
// Retorna no mesmo formato que getCiclosByAluno para compatibilidade com o frontend
export async function getCiclosDerivadosDoPdi(alunoId: number) {
  const dbConn = await getDb();
  if (!dbConn) return [];
  
  const pdis = await dbConn.select({
    id: assessmentPdi.id,
    trilhaId: assessmentPdi.trilhaId,
    status: assessmentPdi.status,
    macroInicio: assessmentPdi.macroInicio,
    macroTermino: assessmentPdi.macroTermino,
  }).from(assessmentPdi)
    .where(sql`${assessmentPdi.alunoId} = ${alunoId} AND ${assessmentPdi.status} = 'ativo'`);
  
  if (pdis.length === 0) return [];
  
  const pdiIds = pdis.map(p => p.id);
  const allComps = await dbConn.select({
    id: assessmentCompetencias.id,
    assessmentPdiId: assessmentCompetencias.assessmentPdiId,
    competenciaId: assessmentCompetencias.competenciaId,
    peso: assessmentCompetencias.peso,
    microInicio: assessmentCompetencias.microInicio,
    microTermino: assessmentCompetencias.microTermino,
  }).from(assessmentCompetencias)
    .where(sql`${assessmentCompetencias.assessmentPdiId} IN (${sql.join(pdiIds.map(id => sql`${id}`), sql`, `)})`);
  
  const allTrilhas = await dbConn.select({ id: trilhas.id, name: trilhas.name }).from(trilhas);
  const trilhaMap = new Map(allTrilhas.map(t => [t.id, t.name]));
  
  const allCompetencias = await dbConn.select({ id: competencias.id, nome: competencias.nome, codigoIntegracao: competencias.codigoIntegracao, trilhaId: competencias.trilhaId }).from(competencias);
  const compMap = new Map(allCompetencias.map(c => [c.id, c]));
  
  let autoId = 300000;
  const result: any[] = [];
  
  for (const pdi of pdis) {
    const trilhaNome = trilhaMap.get(pdi.trilhaId) || `Trilha ${pdi.trilhaId}`;
    const comps = allComps.filter(c => c.assessmentPdiId === pdi.id);
    
    // Agrupar competências por período (microInicio + microTermino)
    const cicloGroups = new Map<string, { compIds: number[]; inicio: string; termino: string }>(); 
    
    for (const comp of comps) {
      if (!comp.microInicio || !comp.microTermino) continue;
      
      const inicio = new Date(comp.microInicio).toISOString().split('T')[0];
      const termino = new Date(comp.microTermino).toISOString().split('T')[0];
      const key = `${inicio}|${termino}`;
      
      const group = cicloGroups.get(key) || { compIds: [], inicio, termino };
      group.compIds.push(comp.competenciaId);
      cicloGroups.set(key, group);
    }
    
    // Competências sem datas de micro ciclo → usar datas do macro ciclo
    const compsWithoutDates = comps.filter(c => !c.microInicio || !c.microTermino);
    if (compsWithoutDates.length > 0 && pdi.macroInicio && pdi.macroTermino) {
      const inicio = new Date(pdi.macroInicio).toISOString().split('T')[0];
      const termino = new Date(pdi.macroTermino).toISOString().split('T')[0];
      const key = `${inicio}|${termino}`;
      const group = cicloGroups.get(key) || { compIds: [], inicio, termino };
      for (const comp of compsWithoutDates) {
        group.compIds.push(comp.competenciaId);
      }
      cicloGroups.set(key, group);
    }
    
    const sortedGroups = Array.from(cicloGroups.entries()).sort((a, b) => a[1].inicio.localeCompare(b[1].inicio));
    
    for (let i = 0; i < sortedGroups.length; i++) {
      const [, group] = sortedGroups[i];
      if (group.compIds.length === 0) continue;
      
      const cicloLabel = sortedGroups.length > 1 ? ` - Ciclo ${i + 1}` : '';
      
      result.push({
        id: autoId++,
        alunoId,
        nomeCiclo: `${trilhaNome}${cicloLabel}`,
        dataInicio: group.inicio,
        dataFim: group.termino,
        definidoPor: null,
        observacoes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        competencias: group.compIds.map(compId => {
          const comp = compMap.get(compId);
          return {
            id: compId,
            competenciaId: compId,
            competenciaNome: comp?.nome || 'Desconhecida',
            competenciaCodigo: comp?.codigoIntegracao || null,
            trilhaId: comp?.trilhaId || pdi.trilhaId,
            trilhaNome: trilhaNome,
          };
        }),
        competenciaIds: group.compIds,
        fonte: 'pdi' as const,
      });
    }
  }
  
  // Ordenar por data de início
  result.sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));
  
  return result;
}

// Buscar todos os ciclos (para cálculo em massa)
export async function getAllCiclos() {
  const db = await getDb();
  if (!db) return [];
  
  const ciclos = await db.select().from(ciclosExecucao).orderBy(ciclosExecucao.alunoId, ciclosExecucao.dataInicio);
  
  const allComps = await db.select()
    .from(cicloCompetencias);
  
  // Agrupar competências por ciclo
  const compsByCiclo = new Map<number, number[]>();
  for (const comp of allComps) {
    const existing = compsByCiclo.get(comp.cicloId) || [];
    existing.push(comp.competenciaId);
    compsByCiclo.set(comp.cicloId, existing);
  }
  
  return ciclos.map(ciclo => ({
    ...ciclo,
    competenciaIds: compsByCiclo.get(ciclo.id) || [],
  }));
}

// Atualizar ciclo de execução
export async function updateCicloExecucao(cicloId: number, data: {
  nomeCiclo?: string;
  dataInicio?: string;
  dataFim?: string;
  observacoes?: string;
  competenciaIds?: number[];
}) {
  const db = await getDb();
  if (!db) return false;
  
  const updateData: Record<string, unknown> = {};
  if (data.nomeCiclo !== undefined) updateData.nomeCiclo = data.nomeCiclo;
  if (data.dataInicio !== undefined) updateData.dataInicio = new Date(data.dataInicio + 'T00:00:00');
  if (data.dataFim !== undefined) updateData.dataFim = new Date(data.dataFim + 'T00:00:00');
  if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
  
  if (Object.keys(updateData).length > 0) {
    await db.update(ciclosExecucao).set(updateData).where(eq(ciclosExecucao.id, cicloId));
  }
  
  // Se competências foram fornecidas, atualizar
  if (data.competenciaIds !== undefined) {
    // Remover competências existentes
    await db.delete(cicloCompetencias).where(eq(cicloCompetencias.cicloId, cicloId));
    
    // Adicionar novas
    if (data.competenciaIds.length > 0) {
      const values = data.competenciaIds.map(competenciaId => ({
        cicloId,
        competenciaId,
      }));
      await db.insert(cicloCompetencias).values(values);
    }
  }
  
  return true;
}

// Excluir ciclo de execução
export async function deleteCicloExecucao(cicloId: number) {
  const db = await getDb();
  if (!db) return false;
  
  // Remover competências vinculadas
  await db.delete(cicloCompetencias).where(eq(cicloCompetencias.cicloId, cicloId));
  // Remover ciclo
  await db.delete(ciclosExecucao).where(eq(ciclosExecucao.id, cicloId));
  
  return true;
}

// Buscar ciclos por aluno formatados para o calculador de indicadores
// Usa ciclos_execucao se existirem, senão gera a partir de assessment_competencias
export async function getCiclosForCalculator(alunoId: number) {
  const ciclos = await getCiclosByAluno(alunoId);
  
  // Se existem ciclos manuais, usar eles
  if (ciclos.length > 0) {
    return ciclos.map(c => ({
      id: c.id,
      nomeCiclo: c.nomeCiclo,
      dataInicio: typeof c.dataInicio === 'string' ? c.dataInicio : new Date(c.dataInicio).toISOString().split('T')[0],
      dataFim: typeof c.dataFim === 'string' ? c.dataFim : new Date(c.dataFim).toISOString().split('T')[0],
      competenciaIds: c.competenciaIds,
    }));
  }
  
  // Fallback: gerar ciclos a partir de assessment_competencias
  const dbConn = await getDb();
  if (!dbConn) return [];
  
  const pdis = await dbConn.select({
    id: assessmentPdi.id,
    trilhaId: assessmentPdi.trilhaId,
  }).from(assessmentPdi)
    .where(sql`${assessmentPdi.alunoId} = ${alunoId} AND ${assessmentPdi.status} = 'ativo'`);
  
  if (pdis.length === 0) return [];
  
  const pdiIds = pdis.map(p => p.id);
  const allComps = await dbConn.select({
    id: assessmentCompetencias.id,
    assessmentPdiId: assessmentCompetencias.assessmentPdiId,
    competenciaId: assessmentCompetencias.competenciaId,
    peso: assessmentCompetencias.peso,
    microInicio: assessmentCompetencias.microInicio,
    microTermino: assessmentCompetencias.microTermino,
  }).from(assessmentCompetencias)
    .where(sql`${assessmentCompetencias.assessmentPdiId} IN (${sql.join(pdiIds.map(id => sql`${id}`), sql`, `)})`);
  
  const allTrilhas = await dbConn.select({ id: trilhas.id, name: trilhas.name }).from(trilhas);
  const trilhaMap = new Map(allTrilhas.map(t => [t.id, t.name]));
  
  // Buscar nomes das competências para usar no nome do ciclo
  const allCompetencias = await dbConn.select({ id: competencias.id, nome: competencias.nome }).from(competencias);
  const compNomeMap = new Map(allCompetencias.map(c => [c.id, c.nome]));
  
  let autoId = 200000;
  const result: { id: number; nomeCiclo: string; dataInicio: string; dataFim: string; competenciaIds: number[]; allCompetenciaIds?: number[]; competenciaIdsObrigatorias?: number[] }[] = [];
  
  for (const pdi of pdis) {
    const trilhaNome = trilhaMap.get(pdi.trilhaId) || `Trilha ${pdi.trilhaId}`;
    const comps = allComps.filter(c => c.assessmentPdiId === pdi.id);
    
    // Agrupar TODAS as competências por período (obrigatórias + opcionais)
    const cicloGroups = new Map<string, { allCompIds: number[]; obrigatoriaIds: number[]; inicio: string; termino: string }>();
    
    for (const comp of comps) {
      if (!comp.microInicio || !comp.microTermino) continue;
      
      const inicio = new Date(comp.microInicio).toISOString().split('T')[0];
      const termino = new Date(comp.microTermino).toISOString().split('T')[0];
      const key = `${inicio}|${termino}`;
      
      const group = cicloGroups.get(key) || { allCompIds: [], obrigatoriaIds: [], inicio, termino };
      group.allCompIds.push(comp.competenciaId);
      if (comp.peso === 'obrigatoria') {
        group.obrigatoriaIds.push(comp.competenciaId);
      }
      cicloGroups.set(key, group);
    }
    
    const sortedGroups = Array.from(cicloGroups.entries()).sort((a, b) => a[1].inicio.localeCompare(b[1].inicio));
    
    for (const [, group] of sortedGroups) {
      // Criar ciclo se tem QUALQUER competência (obrigatória ou opcional)
      if (group.allCompIds.length === 0) continue;
      // Nome do ciclo usa apenas competências obrigatórias (se houver), senão todas
      const namesForTitle = group.obrigatoriaIds.length > 0 ? group.obrigatoriaIds : group.allCompIds;
      const allNames = namesForTitle.map(id => compNomeMap.get(id) || `Comp ${id}`);
      const compNames = allNames.length <= 2
        ? allNames.join(', ')
        : `${allNames.slice(0, 2).join(', ')} +${allNames.length - 2}`;
      result.push({
        id: autoId++,
        nomeCiclo: `${trilhaNome} - ${compNames}`,
        dataInicio: group.inicio,
        dataFim: group.termino,
        // competenciaIds mantém APENAS obrigatórias para cálculo dos indicadores (compatibilidade)
        competenciaIds: group.obrigatoriaIds,
        // allCompetenciaIds inclui TODAS (obrigatórias + opcionais) para exibição
        allCompetenciaIds: group.allCompIds,
        // Separar obrigatórias explicitamente
        competenciaIdsObrigatorias: group.obrigatoriaIds,
      });
    }
  }
  
  return result;
}

/**
 * Busca ciclos dos PDIs CONGELADOS do aluno para exibição do Macrociclo anterior (Evolução).
 * Lógica idêntica ao fallback de getCiclosForCalculator, mas filtra por status = 'congelado'.
 */
export async function getCiclosCongeladosParaCalculator(alunoId: number) {
  const dbConn = await getDb();
  if (!dbConn) return [];

  const pdis = await dbConn.select({
    id: assessmentPdi.id,
    trilhaId: assessmentPdi.trilhaId,
  }).from(assessmentPdi)
    .where(sql`${assessmentPdi.alunoId} = ${alunoId} AND ${assessmentPdi.status} = 'congelado'`);

  if (pdis.length === 0) return [];

  const pdiIds = pdis.map(p => p.id);
  const allComps = await dbConn.select({
    id: assessmentCompetencias.id,
    assessmentPdiId: assessmentCompetencias.assessmentPdiId,
    competenciaId: assessmentCompetencias.competenciaId,
    peso: assessmentCompetencias.peso,
    microInicio: assessmentCompetencias.microInicio,
    microTermino: assessmentCompetencias.microTermino,
  }).from(assessmentCompetencias)
    .where(sql`${assessmentCompetencias.assessmentPdiId} IN (${sql.join(pdiIds.map(id => sql`${id}`), sql`, `)})`);

  const allTrilhas = await dbConn.select({ id: trilhas.id, name: trilhas.name }).from(trilhas);
  const trilhaMap = new Map(allTrilhas.map(t => [t.id, t.name]));

  const allCompetencias = await dbConn.select({ id: competencias.id, nome: competencias.nome }).from(competencias);
  const compNomeMap = new Map(allCompetencias.map(c => [c.id, c.nome]));

  let autoId = 300000; // range diferente para não colidir com getCiclosForCalculator
  const result: { id: number; nomeCiclo: string; dataInicio: string; dataFim: string; competenciaIds: number[]; allCompetenciaIds?: number[]; competenciaIdsObrigatorias?: number[] }[] = [];

  for (const pdi of pdis) {
    const trilhaNome = trilhaMap.get(pdi.trilhaId) || `Trilha ${pdi.trilhaId}`;
    const comps = allComps.filter(c => c.assessmentPdiId === pdi.id);

    const cicloGroups = new Map<string, { allCompIds: number[]; obrigatoriaIds: number[]; inicio: string; termino: string }>();

    for (const comp of comps) {
      if (!comp.microInicio || !comp.microTermino) continue;
      const inicio = new Date(comp.microInicio).toISOString().split('T')[0];
      const termino = new Date(comp.microTermino).toISOString().split('T')[0];
      const key = `${inicio}|${termino}`;
      const group = cicloGroups.get(key) || { allCompIds: [], obrigatoriaIds: [], inicio, termino };
      group.allCompIds.push(comp.competenciaId);
      if (comp.peso === 'obrigatoria') group.obrigatoriaIds.push(comp.competenciaId);
      cicloGroups.set(key, group);
    }

    const sortedGroups = Array.from(cicloGroups.entries()).sort((a, b) => a[1].inicio.localeCompare(b[1].inicio));

    for (const [, group] of sortedGroups) {
      if (group.allCompIds.length === 0) continue;
      const namesForTitle = group.obrigatoriaIds.length > 0 ? group.obrigatoriaIds : group.allCompIds;
      const allNames = namesForTitle.map(id => compNomeMap.get(id) || `Comp ${id}`);
      const compNames = allNames.length <= 2
        ? allNames.join(', ')
        : `${allNames.slice(0, 2).join(', ')} +${allNames.length - 2}`;
      result.push({
        id: autoId++,
        nomeCiclo: `${trilhaNome} - ${compNames}`,
        dataInicio: group.inicio,
        dataFim: group.termino,
        competenciaIds: group.obrigatoriaIds,
        allCompetenciaIds: group.allCompIds,
        competenciaIdsObrigatorias: group.obrigatoriaIds,
      });
    }
  }

  return result;
}

// Buscar todos os ciclos formatados para cálculo em massa (agrupados por alunoId)
// Agora usa assessment_competencias como fonte principal de ciclos
export async function getAllCiclosForCalculator() {
  const db = await getDb();
  if (!db) return new Map<string, { id: number; nomeCiclo: string; dataInicio: string; dataFim: string; competenciaIds: number[]; allCompetenciaIds?: number[]; onlyObrigatorias: boolean }[]>();
  
  // Primeiro tentar ciclos_execucao (se existirem)
  const manualCiclos = await getAllCiclos();
  
  // Buscar assessment_competencias com dados de período e obrigatoriedade
  const allPdis = await db.select({
    id: assessmentPdi.id,
    alunoId: assessmentPdi.alunoId,
    trilhaId: assessmentPdi.trilhaId,
    status: assessmentPdi.status,
  }).from(assessmentPdi).where(eq(assessmentPdi.status, 'ativo'));
  
  const allComps = await db.select({
    id: assessmentCompetencias.id,
    assessmentPdiId: assessmentCompetencias.assessmentPdiId,
    competenciaId: assessmentCompetencias.competenciaId,
    peso: assessmentCompetencias.peso,
    microInicio: assessmentCompetencias.microInicio,
    microTermino: assessmentCompetencias.microTermino,
  }).from(assessmentCompetencias);
  
  // Buscar trilhas para nomes
  const allTrilhas = await db.select({ id: trilhas.id, name: trilhas.name }).from(trilhas);
  const trilhaMap = new Map(allTrilhas.map(t => [t.id, t.name]));
  
  // Buscar nomes das competências para usar no nome do ciclo
  const allCompetencias = await db.select({ id: competencias.id, nome: competencias.nome }).from(competencias);
  const compNomeMap = new Map(allCompetencias.map(c => [c.id, c.nome]));
  
  // Buscar alunos para mapear alunoId -> externalId
  const alunosList = await db.select({ id: alunos.id, externalId: alunos.externalId }).from(alunos);
  const alunoMap = new Map(alunosList.map(a => [a.id, a.externalId]));
  
  const ciclosPorAluno = new Map<string, { id: number; nomeCiclo: string; dataInicio: string; dataFim: string; competenciaIds: number[]; allCompetenciaIds?: number[]; onlyObrigatorias: boolean }[]>();
  
  // Se existem ciclos manuais, usar eles
  if (manualCiclos.length > 0) {
    for (const ciclo of manualCiclos) {
      const aluno = alunosList.find(a => a.id === ciclo.alunoId);
      const alunoKey = aluno?.externalId || String(ciclo.alunoId);
      const existing = ciclosPorAluno.get(alunoKey) || [];
      existing.push({
        id: ciclo.id,
        nomeCiclo: ciclo.nomeCiclo,
        dataInicio: typeof ciclo.dataInicio === 'string' ? ciclo.dataInicio : new Date(ciclo.dataInicio).toISOString().split('T')[0],
        dataFim: typeof ciclo.dataFim === 'string' ? ciclo.dataFim : new Date(ciclo.dataFim).toISOString().split('T')[0],
        competenciaIds: ciclo.competenciaIds,
        onlyObrigatorias: false,
      });
      ciclosPorAluno.set(alunoKey, existing);
    }
    return ciclosPorAluno;
  }
  
  // Gerar ciclos automaticamente a partir de assessment_competencias
  // Agrupar por aluno -> assessment -> (microInicio, microTermino)
  let autoId = 100000; // IDs auto-gerados
  
  for (const pdi of allPdis) {
    const alunoKey = alunoMap.get(pdi.alunoId) || String(pdi.alunoId);
    const trilhaNome = trilhaMap.get(pdi.trilhaId) || `Trilha ${pdi.trilhaId}`;
    const comps = allComps.filter(c => c.assessmentPdiId === pdi.id);
    
    // Agrupar TODAS as competências por período (obrigatórias + opcionais)
    const cicloGroups = new Map<string, { allCompIds: number[]; obrigatoriaIds: number[]; inicio: string; termino: string }>();
    
    for (const comp of comps) {
      if (!comp.microInicio || !comp.microTermino) continue;
      
      const inicio = new Date(comp.microInicio).toISOString().split('T')[0];
      const termino = new Date(comp.microTermino).toISOString().split('T')[0];
      const key = `${inicio}|${termino}`;
      
      const group = cicloGroups.get(key) || { allCompIds: [], obrigatoriaIds: [], inicio, termino };
      group.allCompIds.push(comp.competenciaId);
      if (comp.peso === 'obrigatoria') {
        group.obrigatoriaIds.push(comp.competenciaId);
      }
      cicloGroups.set(key, group);
    }
    
    // Converter grupos em ciclos
    const existing = ciclosPorAluno.get(alunoKey) || [];
    
    // Ordenar por data de início
    const sortedGroups = Array.from(cicloGroups.entries()).sort((a, b) => a[1].inicio.localeCompare(b[1].inicio));
    
    for (const [, group] of sortedGroups) {
      // Criar ciclo se tem QUALQUER competência (obrigatória ou opcional)
      if (group.allCompIds.length === 0) continue;
      
      // Nome do ciclo usa apenas competências obrigatórias (se houver), senão todas
      const namesForTitle = group.obrigatoriaIds.length > 0 ? group.obrigatoriaIds : group.allCompIds;
      const allNames = namesForTitle.map(id => compNomeMap.get(id) || `Comp ${id}`);
      const compNames = allNames.length <= 2
        ? allNames.join(', ')
        : `${allNames.slice(0, 2).join(', ')} +${allNames.length - 2}`;
      existing.push({
        id: autoId++,
        nomeCiclo: `${trilhaNome} - ${compNames}`,
        dataInicio: group.inicio,
        dataFim: group.termino,
        // competenciaIds mantém APENAS obrigatórias para cálculo dos indicadores
        competenciaIds: group.obrigatoriaIds,
        // allCompetenciaIds inclui TODAS (obrigatórias + opcionais) para exibição
        allCompetenciaIds: group.allCompIds,
        onlyObrigatorias: true,
      });
    }
    
    if (existing.length > 0) {
      ciclosPorAluno.set(alunoKey, existing);
    }
  }
  
  return ciclosPorAluno;
}


// ============ ALERTAS DE MICRO CICLO ============

export interface AlertaMicroCiclo {
  microCicloId: string; // chave: inicio|termino
  dataInicio: string;
  dataTermino: string;
  diasRestantes: number;
  urgencia: 'critico' | 'urgente' | 'atencao' | 'normal'; // <=7d, <=14d, <=30d, >30d
  competenciasPendentes: {
    competenciaId: number;
    nome: string;
    peso: string;
    progressoTotal: number;
    aulasConcluidas: number;
    totalAulas: number;
  }[];
  totalCompetencias: number;
  competenciasConcluidas: number;
}

/**
 * Retorna alertas de micro ciclos em andamento com competências pendentes para um aluno.
 * Agrupa competências obrigatórias por período (microInicio/microTermino),
 * cruza com student_performance para verificar progresso.
 */
export async function getAlertasMicroCiclo(alunoId: number): Promise<AlertaMicroCiclo[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar assessments ativos do aluno
  const pdis = await db.select({
    id: assessmentPdi.id,
  }).from(assessmentPdi)
    .where(sql`${assessmentPdi.alunoId} = ${alunoId} AND ${assessmentPdi.status} = 'ativo'`);
  
  if (pdis.length === 0) return [];
  
  const pdiIds = pdis.map(p => p.id);
  
  // Buscar todas as competências dos assessments com datas
  const allComps = await db.select({
    id: assessmentCompetencias.id,
    assessmentPdiId: assessmentCompetencias.assessmentPdiId,
    competenciaId: assessmentCompetencias.competenciaId,
    peso: assessmentCompetencias.peso,
    microInicio: assessmentCompetencias.microInicio,
    microTermino: assessmentCompetencias.microTermino,
  }).from(assessmentCompetencias)
    .where(sql`${assessmentCompetencias.assessmentPdiId} IN (${sql.join(pdiIds.map(id => sql`${id}`), sql`, `)})`);
  
  // Buscar nomes das competências
  const compIds = Array.from(new Set(allComps.map(c => c.competenciaId)));
  if (compIds.length === 0) return [];
  
  const allCompDetails = await db.select({
    id: competencias.id,
    nome: competencias.nome,
    codigoIntegracao: competencias.codigoIntegracao,
  }).from(competencias)
    .where(sql`${competencias.id} IN (${sql.join(compIds.map(id => sql`${id}`), sql`, `)})`);
  
  const compMap = new Map(allCompDetails.map(c => [c.id, c]));
  
  // Buscar dados de performance do aluno
  const perfData = await db.select({
    externalCompetenciaId: studentPerformance.externalCompetenciaId,
    progressoTotal: studentPerformance.progressoTotal,
    aulasConcluidas: studentPerformance.aulasConcluidas,
    totalAulas: studentPerformance.totalAulas,
  }).from(studentPerformance)
    .where(sql`${studentPerformance.alunoId} = ${alunoId}`);
  
  const perfMap = new Map(perfData.map(p => [p.externalCompetenciaId, p]));
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Agrupar competências por período (microInicio|microTermino)
  const cicloGroups = new Map<string, {
    inicio: string;
    termino: string;
    comps: typeof allComps;
  }>();
  
  for (const comp of allComps) {
    if (!comp.microInicio || !comp.microTermino) continue;
    
    const inicio = new Date(comp.microInicio).toISOString().split('T')[0];
    const termino = new Date(comp.microTermino).toISOString().split('T')[0];
    
    // Só ciclos em andamento (inicio <= hoje <= termino)
    if (inicio > todayStr || termino < todayStr) continue;
    
    const key = `${inicio}|${termino}`;
    const group = cicloGroups.get(key) || { inicio, termino, comps: [] };
    group.comps.push(comp);
    cicloGroups.set(key, group);
  }
  
  const alertas: AlertaMicroCiclo[] = [];
  
  for (const [key, group] of Array.from(cicloGroups.entries())) {
    const diasRestantes = Math.ceil((new Date(group.termino).getTime() - today.getTime()) / 86400000);
    
    let urgencia: AlertaMicroCiclo['urgencia'] = 'normal';
    if (diasRestantes <= 7) urgencia = 'critico';
    else if (diasRestantes <= 14) urgencia = 'urgente';
    else if (diasRestantes <= 30) urgencia = 'atencao';
    
    const competenciasPendentes: AlertaMicroCiclo['competenciasPendentes'] = [];
    let totalComps = 0;
    let concluidas = 0;
    
    for (const comp of group.comps) {
      const compDetail = compMap.get(comp.competenciaId);
      if (!compDetail) continue;
      
      totalComps++;
      
      const perf = compDetail.codigoIntegracao ? perfMap.get(compDetail.codigoIntegracao) : null;
      const progresso = perf ? Number(perf.progressoTotal) || 0 : 0;
      const aulasConc = perf ? Number(perf.aulasConcluidas) || 0 : 0;
      const totalAulas = perf ? Number(perf.totalAulas) || 0 : 0;
      
      if (progresso >= 100) {
        concluidas++;
        continue; // Não incluir nas pendentes
      }
      
      competenciasPendentes.push({
        competenciaId: comp.competenciaId,
        nome: compDetail.nome,
        peso: comp.peso || 'obrigatoria',
        progressoTotal: progresso,
        aulasConcluidas: aulasConc,
        totalAulas: totalAulas,
      });
    }
    
    // Só criar alerta se tem competências pendentes
    if (competenciasPendentes.length > 0) {
      alertas.push({
        microCicloId: key,
        dataInicio: group.inicio,
        dataTermino: group.termino,
        diasRestantes,
        urgencia,
        competenciasPendentes,
        totalCompetencias: totalComps,
        competenciasConcluidas: concluidas,
      });
    }
  }
  
  // Ordenar por urgência (mais urgente primeiro)
  alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);
  
  return alertas;
}

// ============ MAPA COMPETENCIA ID -> CODIGO INTEGRACAO ============

/**
 * Retorna um mapa de competenciaId (int) -> codigoIntegracao (string)
 * Usado pelo calculador de indicadores para cruzar ciclos com performance
 */
export async function getCompIdToCodigoMap(): Promise<Map<number, string>> {
  const db = await getDb();
  if (!db) return new Map();
  
  const allComps = await db.select({ id: competencias.id, codigoIntegracao: competencias.codigoIntegracao }).from(competencias);
  const map = new Map<number, string>();
  for (const comp of allComps) {
    if (comp.codigoIntegracao) {
      map.set(comp.id, comp.codigoIntegracao);
    }
  }
  return map;
}

export async function getCompIdToNomeMap(): Promise<Map<number, string>> {
  const db = await getDb();
  if (!db) return new Map();
  const allComps = await db.select({ id: competencias.id, nome: competencias.nome }).from(competencias);
  const map = new Map<number, string>();
  for (const comp of allComps) {
    if (comp.nome) map.set(comp.id, comp.nome);
  }
  return map;
}

// ============ DETALHE COMPLETO DO ALUNO ============

/**
 * Retorna informações completas de um aluno para exibição nos dashboards:
 * - Dados pessoais, turma, trilha (extraída do nome da turma), empresa, mentor
 * - Competências com notas e status (agrupadas por trilha)
 * - Eventos/webinários com datas e presença
 * - Ciclos de execução
 * - Sessões de mentoria
 */
export async function getAlunoDetalheCompleto(alunoId: number) {
  const db = await getDb();
  if (!db) return null;

  // 1. Dados do aluno
  const alunoResult = await db.select().from(alunos).where(eq(alunos.id, alunoId)).limit(1);
  const aluno = alunoResult[0];
  if (!aluno) return null;

  // 2. Turma
  let turmaInfo: { id: number; name: string } | null = null;
  if (aluno.turmaId) {
    const turmaResult = await db.select().from(turmas).where(eq(turmas.id, aluno.turmaId)).limit(1);
    if (turmaResult[0]) turmaInfo = { id: turmaResult[0].id, name: turmaResult[0].name };
  }

  // 3. Trilha - extrair do nome da turma ou do plano individual
  let trilhaNome = 'Não definida';
  if (turmaInfo) {
    // Extrair trilha do nome da turma (ex: "[2024] Banrisul - B.E.M. | Basic" -> "Basic")
    const pipeMatch = turmaInfo.name.match(/\|\s*(.+)$/);
    if (pipeMatch) {
      trilhaNome = pipeMatch[1].trim();
    } else {
      // Tentar extrair do nome sem pipe (ex: "[2025] SEBRAE Tocantins - Visão de Futuro [BS2]")
      const dashMatch = turmaInfo.name.match(/- (.+?)(?:\s*\[.*\])?$/);
      if (dashMatch) {
        trilhaNome = dashMatch[1].trim();
      }
    }
  }
  // Se não encontrou no nome da turma, inferir das competências do plano individual
  if (trilhaNome === 'Não definida') {
    const planoItems = await getPlanoIndividualByAluno(alunoId);
    if (planoItems.length > 0) {
      // Contar competências por trilha e pegar a mais frequente
      const trilhaCount = new Map<string, number>();
      for (const item of planoItems) {
        const tn = item.trilhaNome || 'Desconhecida';
        trilhaCount.set(tn, (trilhaCount.get(tn) || 0) + 1);
      }
      let maxCount = 0;
      trilhaCount.forEach((count, name) => {
        if (count > maxCount) { maxCount = count; trilhaNome = name; }
      });
    }
  }

  // 4. Empresa/Programa
  let programaInfo: { id: number; name: string; code: string } | null = null;
  if (aluno.programId) {
    const progResult = await db.select().from(programs).where(eq(programs.id, aluno.programId)).limit(1);
    if (progResult[0]) programaInfo = { id: progResult[0].id, name: progResult[0].name, code: progResult[0].code };
  }

  // 5. Mentor
  let mentorInfo: { id: number; name: string } | null = null;
  if (aluno.consultorId) {
    const mentorResult = await db.select().from(consultors).where(eq(consultors.id, aluno.consultorId)).limit(1);
    if (mentorResult[0]) mentorInfo = { id: mentorResult[0].id, name: mentorResult[0].name };
  }

  // 6. Competências com notas (agrupadas por trilha)
  const planoItems = await getPlanoIndividualByAluno(alunoId);
  const competenciasPorTrilha = new Map<string, Array<{
    competenciaId: number;
    competenciaNome: string;
    trilhaId: number | null;
    trilhaNome: string;
    notaAtual: string | null;
    metaNota: string | null;
    status: string;
    isObrigatoria: number;
  }>>();

  for (const item of planoItems) {
    const tn = item.trilhaNome || 'Sem Trilha';
    if (!competenciasPorTrilha.has(tn)) competenciasPorTrilha.set(tn, []);
    competenciasPorTrilha.get(tn)!.push({
      competenciaId: item.competenciaId,
      competenciaNome: item.competenciaNome || 'Sem nome',
      trilhaId: item.trilhaId,
      trilhaNome: tn,
      notaAtual: item.notaAtual,
      metaNota: item.metaNota,
      status: item.status,
      isObrigatoria: item.isObrigatoria,
    });
  }

  // 7. Eventos/Webinários com datas - UNIFICAÇÃO: incluir TODOS os eventos do programa
  const participacoes = await getEventParticipationByAluno(alunoId);
  const participationMap = new Map(participacoes.map(ep => [ep.eventId, ep]));
  
  // Buscar TODOS os eventos do programa (ou globais se programId é null)
  let allProgramEvents: Event[] = [];
  if (aluno.programId) {
    allProgramEvents = await getEventsByProgramOrGlobal(aluno.programId);
  } else {
    // Se aluno não tem programa, buscar todos os eventos
    const db2 = await getDb();
    if (db2) {
      allProgramEvents = await db2.select().from(events);
    }
  }
  
  // DEDUPLICAR eventos por título normalizado (mesma lógica de getWebinarsPendingAttendance)
  const normalizeTitleDedup = (title: string | null): string => {
    if (!title) return '';
    const withoutSpeakerSuffix = title
      .trim()
      .replace(
        /(?:,\s*|\s+-\s+)?com\s+(?:(?:a|o)\s+(?:palestrante|professor(?:a)?|mentor(?:a)?)\s+)?[A-ZÀ-Ý][\p{L}'’.\-]+(?:\s+[A-ZÀ-Ý][\p{L}'’.\-]+){0,6}\.?\s*$/u,
        ''
      );
    return withoutSpeakerSuffix.toLowerCase()
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .replace(/\s*-\s*/g, ' - ')
      .replace(/[.,;:!?]+$/g, '')
      .trim();
  };
  const extractCoreDedup = (normalized: string): string => {
    return normalized
      .replace(/^(\d{4}\/\d+\s*-\s*)?(aula\s*\d+\s*-\s*)?/i, '')
      .replace(/\s*-\s*\d{1,2}\s*-\s*/g, ' - ')  // Remove "- 01 -" no meio do título
      .replace(/\s+/g, ' ')
      .trim();
  };
  const scoreDedupEvent = (evt: Event): number => {
    const hasParticipation = participationMap.has(evt.id) ? 1 : 0;
    const linkedWebinar = evt.externalId?.startsWith('sw-') ? 1 : 0;
    const hasVideo = evt.videoLink ? 1 : 0;
    const recency = evt.createdAt ? new Date(evt.createdAt).getTime() : 0;
    return linkedWebinar * 1000000 + hasVideo * 100000 + hasParticipation * 10000 + recency + evt.id;
  };
  const seenCoresDedup = new Map<string, Event>();
  const deduplicatedProgramEvents: Event[] = [];
  for (const evt of allProgramEvents) {
    const core = extractCoreDedup(normalizeTitleDedup(evt.title));
    const dateStr = evt.eventDate ? new Date(evt.eventDate).toISOString().split('T')[0] : 'nodate';
    const dedupKey = `${core}|${dateStr}`;
    const existing = seenCoresDedup.get(dedupKey);
    if (!existing) {
      seenCoresDedup.set(dedupKey, evt);
      deduplicatedProgramEvents.push(evt);
    } else {
      // Priorizar: vinculado a webinar, com vídeo, com participação e mais recente
      if (scoreDedupEvent(evt) > scoreDedupEvent(existing)) {
        const idx = deduplicatedProgramEvents.indexOf(existing);
        if (idx >= 0) deduplicatedProgramEvents[idx] = evt;
        seenCoresDedup.set(dedupKey, evt);
      }
    }
  }

  // Montar lista unificada: eventos deduplicados com participação + eventos sem participação (ausentes)
  const hojeEvt = new Date();
  hojeEvt.setHours(0, 0, 0, 0);
  const eventosDetalhados = deduplicatedProgramEvents.map(evt => {
    const part = participationMap.get(evt.id);
    // Se não há participação registrada, verificar se o evento ainda não ocorreu
    let statusFinal: string;
    if (part?.status) {
      statusFinal = part.status;
    } else if (evt.eventDate) {
      const dataEvento = new Date(evt.eventDate);
      dataEvento.setHours(0, 0, 0, 0);
      statusFinal = dataEvento > hojeEvt ? 'pendente' : 'ausente';
    } else {
      statusFinal = 'ausente';
    }
    return {
      id: part?.id || 0,
      eventId: evt.id,
      titulo: evt.title || `Evento #${evt.id}`,
      tipo: evt.eventType || 'webinar',
      data: evt.eventDate || null,
      status: statusFinal,
    };
  });

  // 8. Ciclos de execução (usa getCiclosForCalculator que tem fallback para assessment_competencias)
  const ciclos = await getCiclosForCalculator(alunoId);

  // 9. Sessões de mentoria
  const sessoes = await getMentoringSessionsByAluno(alunoId);

  // 10. PDIs congelados
  const assessmentPdis = await getAssessmentsByAluno(alunoId);
  const pdisCongelados = assessmentPdis
    .filter(a => a.status === 'congelado')
    .map(a => ({
      id: a.id,
      trilhaNome: a.trilhaNome,
      motivoCongelamento: a.motivoCongelamento || null,
      congeladoEm: a.congeladoEm || null,
      congeladoPorNome: a.congeladoPorNome || null,
    }));

  // Montar resultado
  return {
    aluno: {
      id: aluno.id,
      name: aluno.name,
      email: aluno.email,
      externalId: aluno.externalId,
    },
    turma: turmaInfo,
    trilha: trilhaNome,
    programa: programaInfo,
    mentor: mentorInfo,
    competencias: Object.fromEntries(competenciasPorTrilha),
    totalCompetencias: planoItems.length,
    competenciasAprovadas: planoItems.filter(p => p.notaAtual && parseFloat(p.notaAtual) >= 7).length,
    mediaNotas: planoItems.length > 0 
      ? planoItems.reduce((sum, p) => sum + (p.notaAtual ? parseFloat(p.notaAtual) : 0), 0) / planoItems.filter(p => p.notaAtual).length
      : 0,
    eventos: eventosDetalhados,
    // Eventos passados (ocorridos): excluir os pendentes (futuros) do total e da taxa
    totalEventos: eventosDetalhados.filter(e => e.status !== 'pendente').length,
    eventosPresente: eventosDetalhados.filter(e => e.status === 'presente').length,
    ciclos: ciclos.map(c => ({
      id: c.id,
      nomeCiclo: c.nomeCiclo,
      dataInicio: c.dataInicio,
      dataFim: c.dataFim,
      observacoes: (c as any).observacoes || null,
      competencias: (c as any).competencias || [],
      status: new Date(c.dataFim) < new Date() ? 'finalizado' : 'em_andamento',
    })),
    sessoes: sessoes.map(s => ({
      id: s.id,
      sessionNumber: s.sessionNumber,
      sessionDate: s.sessionDate,
      presence: s.presence,
      taskStatus: s.taskStatus,
      engagementScore: s.engagementScore,
      notaEvolucao: s.notaEvolucao,
      feedback: s.feedback,
      ciclo: s.ciclo,
    })),
    totalMentorias: sessoes.length,
    mentoriasPresente: sessoes.filter(s => s.presence === 'presente').length,
    pdisCongelados,
    temPdiCongelado: pdisCongelados.length > 0,
  };
}

/**
 * Retorna lista resumida de todos os alunos com turma, trilha, programa e contagem de competências
 * Para uso nos dashboards de visão geral e por empresa
 */
export async function getAlunosResumo(programId?: number) {
  const db = await getDb();
  if (!db) return [];

  const alunosList = programId 
    ? await db.select().from(alunos).where(and(eq(alunos.programId, programId), eq(alunos.isActive, 1)))
    : await db.select().from(alunos).where(eq(alunos.isActive, 1));

  const turmasList = await getTurmas();
  const turmaMap = new Map(turmasList.map(t => [t.id, t]));
  const programsList = await getPrograms();
  const programMap = new Map(programsList.map(p => [p.id, p]));
  const consultorsList = await getConsultors();
  const consultorMap = new Map(consultorsList.map(c => [c.id, c]));

  // Buscar plano individual de todos os alunos em uma query
  const allPlano = await getAllPlanoIndividual();
  const planoByAluno = new Map<number, typeof allPlano>();
  for (const item of allPlano) {
    if (!planoByAluno.has(item.alunoId)) planoByAluno.set(item.alunoId, []);
    planoByAluno.get(item.alunoId)!.push(item);
  }

  return alunosList.map(aluno => {
    const turma = aluno.turmaId ? turmaMap.get(aluno.turmaId) : null;
    const programa = aluno.programId ? programMap.get(aluno.programId) : null;
    const mentor = aluno.consultorId ? consultorMap.get(aluno.consultorId) : null;
    const planoItems = planoByAluno.get(aluno.id) || [];

    // Extrair trilha do nome da turma
    let trilhaNome = 'Não definida';
    if (turma) {
      const pipeMatch = turma.name.match(/\|\s*(.+)$/);
      if (pipeMatch) {
        trilhaNome = pipeMatch[1].trim();
      } else {
        const dashMatch = turma.name.match(/- (.+?)(?:\s*\[.*\])?$/);
        if (dashMatch) trilhaNome = dashMatch[1].trim();
      }
    }

    // Agrupar competências por trilha
    const compPorTrilha = new Map<string, number>();
    for (const item of planoItems) {
      const tn = item.competenciaNome || 'Desconhecida';
      compPorTrilha.set(tn, (compPorTrilha.get(tn) || 0) + 1);
    }

    return {
      id: aluno.id,
      name: aluno.name,
      email: aluno.email,
      externalId: aluno.externalId,
      turma: turma?.name || 'Não definida',
      turmaId: aluno.turmaId,
      trilha: trilhaNome,
      programa: programa?.name || 'Não definido',
      programaId: aluno.programId,
      mentor: mentor?.name || 'Não definido',
      totalCompetencias: planoItems.length,
      competenciasAprovadas: planoItems.filter(p => p.notaAtual && parseFloat(p.notaAtual) >= 7).length,
      mediaNotas: planoItems.filter(p => p.notaAtual).length > 0
        ? planoItems.reduce((sum, p) => sum + (p.notaAtual ? parseFloat(p.notaAtual) : 0), 0) / planoItems.filter(p => p.notaAtual).length
        : 0,
    };
  });
}

// ============ ASSESSMENT PDI FUNCTIONS ============
import { 
  assessmentPdi, InsertAssessmentPdi, AssessmentPdi,
  assessmentCompetencias, InsertAssessmentCompetencia, AssessmentCompetencia
} from "../drizzle/schema";

/**
 * Get all assessments for a specific student
 */
export async function getAssessmentsByAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const pdis = await db.select().from(assessmentPdi)
    .where(and(
      eq(assessmentPdi.alunoId, alunoId),
      // Ignorar PDIs congelados e encerrados — congelados pertencem ao ciclo anterior, encerrados são PDIs duplicados inativados
      sql`${assessmentPdi.status} NOT IN ('congelado', 'encerrado')`,
    ))
    .orderBy(desc(assessmentPdi.createdAt));
  
  if (pdis.length === 0) return [];
  
  // Get all competencias for these PDIs
  const pdiIds = pdis.map(p => p.id);
  const allComps = await db.select().from(assessmentCompetencias)
    .where(sql`${assessmentCompetencias.assessmentPdiId} IN (${sql.join(pdiIds.map(id => sql`${id}`), sql`, `)})`);
  
  // Get trilha and competencia names
  const allTrilhas = await db.select().from(trilhas);
  const trilhaMap = new Map(allTrilhas.map(t => [t.id, t]));
  
  const allCompetencias = await db.select().from(competencias);
  const compMap = new Map(allCompetencias.map(c => [c.id, c]));
  
  // Get turma names
  const allTurmas = await db.select().from(turmas);
  const turmaMap = new Map(allTurmas.map(t => [t.id, t]));
  
  // Get consultor names
  const allConsultors = await db.select().from(consultors);
  const consultorMap = new Map(allConsultors.map(c => [c.id, c]));
  
  // Get plano_individual for nota comparison
  const planoItems = await db.select().from(planoIndividual)
    .where(eq(planoIndividual.alunoId, alunoId));
  const notaByComp = new Map(planoItems.map(p => [p.competenciaId, p.notaAtual]));
  
  // A2 FIX: Buscar student_performance para preencher nível automático quando nivelAtual é NULL
  const perfRecords = await db.select({
    competenciaId: studentPerformance.competenciaId,
    competenciaName: studentPerformance.competenciaName,
    progressoTotal: studentPerformance.progressoTotal,
  }).from(studentPerformance)
    .where(eq(studentPerformance.alunoId, alunoId));
  
  // A2 FIX V3: Criar mapas robustos para matching de competências
  // O student_performance usa IDs da série 60xxx e nomes como "Atenção - Básica"
  // O assessment_competencias usa IDs da série 30xxx e nomes como "Atenção"
  // Precisamos fazer match por nome normalizado (sem sufixo de trilha)
  // IMPORTANTE: 0% é um valor válido (aluno não completou nenhuma aula)
  // Usamos undefined como sentinel para "sem dados" vs 0 para "0% progresso"
  const perfByCompId = new Map<number, number>();
  const perfByCompName = new Map<string, number>();
  // Mapa adicional: nome completo (lowercase) para fallback
  const perfByFullName = new Map<string, number>();
  
  for (const p of perfRecords) {
    if (p.competenciaId && p.progressoTotal !== null) {
      // Manter o maior progresso se houver múltiplas entradas
      const existing = perfByCompId.get(p.competenciaId);
      if (existing === undefined || p.progressoTotal > existing) {
        perfByCompId.set(p.competenciaId, p.progressoTotal);
      }
    }
    if (p.competenciaName && p.progressoTotal !== null) {
      // Nome pode ser "Atenção - Básica", "Comunicação Assertiva - Essencial", etc.
      // Extrair o nome base (antes do " - ")
      const baseName = p.competenciaName.split(' - ')[0].trim().toLowerCase();
      // Manter o maior progresso se houver múltiplas entradas para o mesmo nome base
      const existing = perfByCompName.get(baseName);
      if (existing === undefined || p.progressoTotal > existing) {
        perfByCompName.set(baseName, p.progressoTotal);
      }
      // Também guardar o nome completo normalizado
      const fullName = p.competenciaName.trim().toLowerCase();
      const existingFull = perfByFullName.get(fullName);
      if (existingFull === undefined || p.progressoTotal > existingFull) {
        perfByFullName.set(fullName, p.progressoTotal);
      }
    }
  }
  
  return pdis.map(pdi => {
    const comps = allComps.filter(c => c.assessmentPdiId === pdi.id);
    const trilha = trilhaMap.get(pdi.trilhaId);
    const turma = pdi.turmaId ? turmaMap.get(pdi.turmaId) : null;
    const consultor = pdi.consultorId ? consultorMap.get(pdi.consultorId) : null;
    
    const congeladoPor = pdi.congeladoPor ? consultorMap.get(pdi.congeladoPor) : null;
    
    return {
      ...pdi,
      trilhaNome: trilha?.name || 'Não definida',
      turmaNome: turma?.name || null,
      consultorNome: consultor?.name || null,
      congeladoPorNome: congeladoPor?.name || null,
      competencias: comps.map(c => {
        const comp = compMap.get(c.competenciaId);
        const notaAtual = notaByComp.get(c.competenciaId);
        const notaNum = notaAtual ? parseFloat(notaAtual) : null;
        const notaCorteNum = parseFloat(c.notaCorte);
        
        // A2 FIX V3: Se nivelAtual é NULL, tentar preencher com progressoTotal do student_performance
        // Estratégia de matching em 3 níveis:
        // 1. Por competenciaId direto (raro funcionar entre séries diferentes)
        // 2. Por nome exato da competência (lowercase) no mapa de nomes base
        // 3. Por nome parcial (contains) no mapa de nomes completos
        // IMPORTANTE: 0% é valor válido (match encontrado, aluno não completou)
        let nivelAtualEfetivo = c.nivelAtual ? parseFloat(c.nivelAtual) : null;
        let nivelAutomatico = false;
        if (nivelAtualEfetivo === null) {
          const compNome = comp?.nome?.toLowerCase()?.trim() || '';
          
          // 1. Tentar por competenciaId direto
          const perfById = perfByCompId.get(c.competenciaId);
          if (perfById !== undefined) {
            nivelAtualEfetivo = perfById;
            nivelAutomatico = true;
          }
          // 2. Tentar por nome exato no mapa de nomes base
          if (nivelAtualEfetivo === null && compNome) {
            const perfByName = perfByCompName.get(compNome);
            if (perfByName !== undefined) {
              nivelAtualEfetivo = perfByName;
              nivelAutomatico = true;
            }
          }
          // 3. Tentar por nome parcial - buscar no mapa de nomes completos
          if (nivelAtualEfetivo === null && compNome) {
            for (const [fullName, progresso] of Array.from(perfByFullName.entries())) {
              // Verificar se o nome da competência está contido no nome completo do student_performance
              // ou se o nome base do student_performance contém o nome da competência
              if (fullName.includes(compNome) || compNome.includes(fullName.split(' - ')[0].trim())) {
                nivelAtualEfetivo = progresso;
                nivelAutomatico = true;
                break;
              }
            }
          }
        }
        
        return {
          ...c,
          competenciaNome: comp?.nome || 'Desconhecida',
          notaAtual: notaNum,
          nivelAtualEfetivo, // Nível real (manual ou automático)
          nivelAutomatico, // Flag para indicar que veio do student_performance
          atingiuMeta: notaNum !== null && notaNum >= notaCorteNum,
        };
      }),
      totalCompetencias: comps.length,
      obrigatorias: comps.filter(c => c.peso === 'obrigatoria').length,
      opcionais: comps.filter(c => c.peso === 'opcional').length,
    };
  });
}

export async function getAssessmentById(pdiId: number) {
  const db = await getDb();
  if (!db) return null;
  // Busca o PDI por ID via Drizzle ORM (inclui congelados pois não filtra por status)
  const pdiRows = await db.select().from(assessmentPdi)
    .where(eq(assessmentPdi.id, pdiId))
    .limit(1);
  if (!pdiRows || pdiRows.length === 0) return null;
  const p = pdiRows[0];
  // Busca as competências do PDI
  const comps = await db.select().from(assessmentCompetencias)
    .where(eq(assessmentCompetencias.assessmentPdiId, pdiId));
  // Enriquecer com nomes de trilha, turma e consultor
  const allTrilhas = await db.select().from(trilhas);
  const trilhaMap = new Map(allTrilhas.map(t => [t.id, t]));
  const allTurmas = await db.select().from(turmas);
  const turmaMap = new Map(allTurmas.map(t => [t.id, t]));
  const allConsultors = await db.select().from(consultors);
  const consultorMap = new Map(allConsultors.map(c => [c.id, c]));
  const allCompetencias = await db.select().from(competencias);
  const compMap = new Map(allCompetencias.map(c => [c.id, c]));
  const trilha = trilhaMap.get(p.trilhaId);
  const turma = p.turmaId ? turmaMap.get(p.turmaId) : null;
  const consultor = p.consultorId ? consultorMap.get(p.consultorId) : null;
  // Buscar metas do PDI
  const metasDoPdi = await db.select().from(metas)
    .where(and(eq(metas.assessmentPdiId, pdiId), eq(metas.isActive, 1)));
  // Calcular sessões previstas: usar campo explícito ou diferença de meses
  let sessoesPrevistas: number | null = p.totalSessoesPrevistas ?? null;
  if (!sessoesPrevistas || sessoesPrevistas === 0) {
    if (p.macroInicio && p.macroTermino) {
      const inicio = new Date(p.macroInicio);
      const termino = new Date(p.macroTermino);
      const meses = (termino.getFullYear() - inicio.getFullYear()) * 12
        + (termino.getMonth() - inicio.getMonth());
      sessoesPrevistas = Math.max(1, meses);
    }
  }
  // Macrociclos distintos definidos nas competências
  const macrociclosSet = new Set(comps.map((c: any) => c.microInicio ? String(c.microInicio) : null).filter(Boolean));
  const qtdMacrociclos = macrociclosSet.size || 1;
  return {
    id: p.id,
    numeroPdi: p.numeroPdi ?? 1,
    status: p.status,
    trilhaNome: trilha?.name || 'Não definida',
    turmaNome: turma?.name || null,
    consultorNome: consultor?.name || null,
    macroInicio: p.macroInicio,
    macroTermino: p.macroTermino,
    totalSessoesPrevistas: sessoesPrevistas,
    tarefasPrevistas: sessoesPrevistas,
    casesPrevistas: qtdMacrociclos,
    totalCompetencias: comps.length,
    obrigatorias: comps.filter((c: any) => c.peso === 'obrigatoria').length,
    opcionais: comps.filter((c: any) => c.peso === 'opcional').length,
    competencias: comps.map((c: any) => {
      const comp = compMap.get(c.competenciaId);
      return {
        id: c.id,
        competenciaNome: comp?.nome || 'Desconhecida',
        peso: c.peso,
        notaCorte: c.notaCorte,
        nivelAtual: c.nivelAtual ? parseFloat(c.nivelAtual) : null,
        metaFinal: c.metaFinal ? parseFloat(c.metaFinal) : null,
        metaCiclo1: c.metaCiclo1 ? parseFloat(c.metaCiclo1) : null,
        metaCiclo2: c.metaCiclo2 ? parseFloat(c.metaCiclo2) : null,
        justificativa: c.justificativa || null,
        microInicio: c.microInicio ? String(c.microInicio) : null,
        microTermino: c.microTermino ? String(c.microTermino) : null,
      };
    }),
    metas: metasDoPdi.map((m: any) => ({
      id: m.id,
      titulo: m.titulo,
      descricao: m.descricao || null,
    })),
  };
}

/**
 * Busca TODOS os PDIs de um contratoNivelId (todas as trilhas do ciclo).
 * Usado na tela VisualizarPDI para mostrar o plano completo do ciclo.
 */
export async function getAllPdisByContratoNivel(contratoNivelId: number) {
  const db = await getDb();
  if (!db) return [];

  // Buscar todos os PDIs do contratoNivelId
  const pdisRows = await db.select().from(assessmentPdi)
    .where(eq(assessmentPdi.contratoNivelId, contratoNivelId))
    .orderBy(assessmentPdi.id);

  if (!pdisRows || pdisRows.length === 0) return [];

  // Enriquecer com nomes de trilha, turma, consultor e competências
  const allTrilhas = await db.select().from(trilhas);
  const trilhaMap = new Map(allTrilhas.map(t => [t.id, t]));
  const allTurmas = await db.select().from(turmas);
  const turmaMap = new Map(allTurmas.map(t => [t.id, t]));
  const allConsultors = await db.select().from(consultors);
  const consultorMap = new Map(allConsultors.map(c => [c.id, c]));
  const allCompetencias = await db.select().from(competencias);
  const compMap = new Map(allCompetencias.map(c => [c.id, c]));

  const results = [];
  for (const p of pdisRows) {
    // Competências do PDI
    const comps = await db.select().from(assessmentCompetencias)
      .where(eq(assessmentCompetencias.assessmentPdiId, p.id));

    // Metas do PDI
    const metasDoPdi = await db.select().from(metas)
      .where(and(eq(metas.assessmentPdiId, p.id), eq(metas.isActive, 1)));

    // Calcular sessões previstas
    let sessoesPrevistas: number | null = p.totalSessoesPrevistas ?? null;
    if (!sessoesPrevistas || sessoesPrevistas === 0) {
      if (p.macroInicio && p.macroTermino) {
        const inicio = new Date(p.macroInicio);
        const termino = new Date(p.macroTermino);
        const meses = (termino.getFullYear() - inicio.getFullYear()) * 12
          + (termino.getMonth() - inicio.getMonth());
        sessoesPrevistas = Math.max(1, meses);
      }
    }

    // Macrociclos distintos
    const macrociclosSet = new Set(comps.map((c: any) => c.microInicio ? String(c.microInicio) : null).filter(Boolean));
    const qtdMacrociclos = macrociclosSet.size || 1;

    const trilha = trilhaMap.get(p.trilhaId);
    const turma = p.turmaId ? turmaMap.get(p.turmaId) : null;
    const consultor = p.consultorId ? consultorMap.get(p.consultorId) : null;

    results.push({
      id: p.id,
      status: p.status,
      trilhaNome: trilha?.name || 'Não definida',
      turmaNome: turma?.name || null,
      consultorNome: consultor?.name || null,
      macroInicio: p.macroInicio,
      macroTermino: p.macroTermino,
      totalSessoesPrevistas: sessoesPrevistas,
      tarefasPrevistas: sessoesPrevistas,
      casesPrevistas: qtdMacrociclos,
      totalCompetencias: comps.length,
      obrigatorias: comps.filter((c: any) => c.peso === 'obrigatoria').length,
      opcionais: comps.filter((c: any) => c.peso === 'opcional').length,
      competencias: comps.map((c: any) => {
        const comp = compMap.get(c.competenciaId);
        return {
          id: c.id,
          competenciaNome: comp?.nome || 'Desconhecida',
          peso: c.peso,
          notaCorte: c.notaCorte,
          nivelAtual: c.nivelAtual ? parseFloat(c.nivelAtual) : null,
          metaFinal: c.metaFinal ? parseFloat(c.metaFinal) : null,
          metaCiclo1: c.metaCiclo1 ? parseFloat(c.metaCiclo1) : null,
          metaCiclo2: c.metaCiclo2 ? parseFloat(c.metaCiclo2) : null,
          justificativa: c.justificativa || null,
          microInicio: c.microInicio ? String(c.microInicio) : null,
          microTermino: c.microTermino ? String(c.microTermino) : null,
        };
      }),
      metas: metasDoPdi.map((m: any) => ({
        id: m.id,
        titulo: m.titulo,
        descricao: m.descricao || null,
      })),
    });
  }
  return results;
}

export async function getAssessmentsByAlunoAndNivel(alunoId: number, contratoNivelId?: number | null) {
  if (!contratoNivelId) {
    return getAssessmentsByAluno(alunoId);
  }

  const db = await getDb();
  if (!db) return [];

  const pdis = await db.select().from(assessmentPdi)
    .where(and(
      eq(assessmentPdi.alunoId, alunoId),
      eq(assessmentPdi.contratoNivelId, contratoNivelId),
      // Ignorar PDIs congelados e encerrados — congelados pertencem ao ciclo anterior, encerrados são PDIs duplicados inativados
      sql`${assessmentPdi.status} NOT IN ('congelado', 'encerrado')`,
    ))
    .orderBy(desc(assessmentPdi.createdAt));

  if (pdis.length === 0) return [];

  const pdiIds = pdis.map(p => p.id);
  const allComps = await db.select().from(assessmentCompetencias)
    .where(sql`${assessmentCompetencias.assessmentPdiId} IN (${sql.join(pdiIds.map(id => sql`${id}`), sql`, `)})`);

  return pdis.map(pdi => ({
    ...pdi,
    competencias: allComps.filter(c => c.assessmentPdiId === pdi.id),
  }));
}

/**
 * Get all assessments for a program (for admin/mentor views)
 */
export async function getAssessmentsByProgram(programId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const pdis = await db.select().from(assessmentPdi)
    .where(eq(assessmentPdi.programId, programId))
    .orderBy(desc(assessmentPdi.createdAt));
  
  if (pdis.length === 0) return [];
  
  // Get aluno names
  const allAlunos = await db.select().from(alunos);
  const alunoMap = new Map(allAlunos.map(a => [a.id, a]));
  
  const allTrilhas = await db.select().from(trilhas);
  const trilhaMap = new Map(allTrilhas.map(t => [t.id, t]));
  
  const allTurmas = await db.select().from(turmas);
  const turmaMap = new Map(allTurmas.map(t => [t.id, t]));
  
  // Get competencia counts per PDI
  const pdiIds = pdis.map(p => p.id);
  const allComps = await db.select().from(assessmentCompetencias)
    .where(sql`${assessmentCompetencias.assessmentPdiId} IN (${sql.join(pdiIds.map(id => sql`${id}`), sql`, `)})`);
  
  const compsByPdi = new Map<number, typeof allComps>();
  for (const c of allComps) {
    const arr = compsByPdi.get(c.assessmentPdiId) || [];
    arr.push(c);
    compsByPdi.set(c.assessmentPdiId, arr);
  }
  
  return pdis.map(pdi => {
    const aluno = alunoMap.get(pdi.alunoId);
    const trilha = trilhaMap.get(pdi.trilhaId);
    const turma = pdi.turmaId ? turmaMap.get(pdi.turmaId) : null;
    const comps = compsByPdi.get(pdi.id) || [];
    
    return {
      id: pdi.id,
      alunoId: pdi.alunoId,
      alunoNome: aluno?.name || 'Desconhecido',
      trilhaNome: trilha?.name || 'Não definida',
      trilhaId: pdi.trilhaId,
      turmaNome: turma?.name || null,
      turmaId: pdi.turmaId,
      macroInicio: pdi.macroInicio,
      macroTermino: pdi.macroTermino,
      status: pdi.status,
      totalCompetencias: comps.length,
      obrigatorias: comps.filter(c => c.peso === 'obrigatoria').length,
      opcionais: comps.filter(c => c.peso === 'opcional').length,
    };
  });
}

/**
 * Check if an active assessment PDI already exists for a given aluno + trilha combination.
 * Returns the existing PDI id and its competencias if found, null otherwise.
 */
export async function getExistingActivePdiByTrilha(
  alunoId: number,
  trilhaId: number
): Promise<{ pdiId: number; existingCompetenciaIds: number[] } | null> {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await db.select()
    .from(assessmentPdi)
    .where(and(
      eq(assessmentPdi.alunoId, alunoId),
      eq(assessmentPdi.trilhaId, trilhaId),
      eq(assessmentPdi.status, 'ativo')
    ))
    .limit(1);
  
  if (existing.length === 0) return null;
  
  const pdiId = existing[0].id;
  
  // Get existing competencia IDs for this PDI
  const existingComps = await db.select({ competenciaId: assessmentCompetencias.competenciaId })
    .from(assessmentCompetencias)
    .where(eq(assessmentCompetencias.assessmentPdiId, pdiId));
  
  return {
    pdiId,
    existingCompetenciaIds: existingComps.map(c => c.competenciaId),
  };
}

/**
 * Add multiple competencias to an existing assessment PDI.
 * Skips competencias that already exist in the assessment.
 */
export async function addCompetenciasToExistingAssessment(
  assessmentPdiId: number,
  competenciasData: Array<{
    competenciaId: number;
    peso: 'obrigatoria' | 'opcional';
    notaCorte: string;
    nivelAtual?: number | null;
    metaCiclo1?: number | null;
    metaCiclo2?: number | null;
    metaFinal?: number | null;
    justificativa?: string | null;
    microInicio?: string | null;
    microTermino?: string | null;
  }>
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [pdiContext] = await db.select({ alunoId: assessmentPdi.alunoId, contratoNivelId: assessmentPdi.contratoNivelId })
    .from(assessmentPdi)
    .where(eq(assessmentPdi.id, assessmentPdiId))
    .limit(1);
  if (pdiContext?.alunoId) {
    await assertNivelPermiteNovasAtribuicoes(pdiContext.alunoId, pdiContext.contratoNivelId, "assessment.addCompetencias");
  }
  
  // Get existing competencia IDs to avoid duplicates
  const existingComps = await db.select({ competenciaId: assessmentCompetencias.competenciaId })
    .from(assessmentCompetencias)
    .where(eq(assessmentCompetencias.assessmentPdiId, assessmentPdiId));
  const existingIds = new Set(existingComps.map(c => c.competenciaId));
  
  // Filter out competencias that already exist
  const newComps = competenciasData.filter(c => !existingIds.has(c.competenciaId));
  
  if (newComps.length === 0) return 0;
  
  // Validate micro dates against macro dates
  const [pdi] = await db.select().from(assessmentPdi).where(eq(assessmentPdi.id, assessmentPdiId)).limit(1);
  if (!pdi) throw new Error('Assessment PDI não encontrado');
  const macroInicioStr = String(pdi.macroInicio);
  const macroTerminoStr = String(pdi.macroTermino);
  
  for (const comp of newComps) {
    if (comp.microInicio && comp.microInicio < macroInicioStr) {
      throw new Error(`Micro ciclo início não pode ser anterior ao macro ciclo início (${macroInicioStr})`);
    }
    if (comp.microTermino && comp.microTermino > macroTerminoStr) {
      throw new Error(`Micro ciclo término não pode ser posterior ao macro ciclo término (${macroTerminoStr})`);
    }
  }
  
  // Insert new competencias
  await db.insert(assessmentCompetencias).values(
    newComps.map(c => ({
      assessmentPdiId,
      competenciaId: c.competenciaId,
      peso: c.peso,
      notaCorte: c.notaCorte,
      nivelAtual: c.nivelAtual != null ? String(c.nivelAtual) : null,
      metaCiclo1: c.metaCiclo1 != null ? String(c.metaCiclo1) : null,
      metaCiclo2: c.metaCiclo2 != null ? String(c.metaCiclo2) : null,
      metaFinal: c.metaFinal != null ? String(c.metaFinal) : null,
      justificativa: c.justificativa || null,
      microInicio: c.microInicio || null,
      microTermino: c.microTermino || null,
    }))
  );
  
  return newComps.length;
}

/**
 * Create a new assessment PDI with competencias
 */
export async function createAssessmentPdi(
  pdiData: {
    alunoId: number;
    contratoNivelId?: number | null;
    trilhaId: number;
    turmaId?: number | null;
    consultorId?: number | null;
    programId?: number | null;
    macroInicio: string;
    macroTermino: string;
    observacoes?: string | null;
  },
  competenciasData: Array<{
    competenciaId: number;
    peso: 'obrigatoria' | 'opcional';
    notaCorte: string;
    nivelAtual?: number | null;
    metaCiclo1?: number | null;
    metaCiclo2?: number | null;
    metaFinal?: number | null;
    justificativa?: string | null;
    microInicio?: string | null;
    microTermino?: string | null;
  }>
) {
  const db = await getDb();
  if (!db) return null;
  await assertNivelPermiteNovasAtribuicoes(pdiData.alunoId, pdiData.contratoNivelId, "assessment.create");
  
  // Validate: micro dates must not exceed macro dates
  const macroInicio = pdiData.macroInicio;
  const macroTermino = pdiData.macroTermino;
  
  for (const comp of competenciasData) {
    if (comp.microInicio && comp.microInicio < macroInicio) {
      throw new Error(`Micro ciclo início (${comp.microInicio}) não pode ser anterior ao macro ciclo início (${macroInicio})`);
    }
    if (comp.microTermino && comp.microTermino > macroTermino) {
      throw new Error(`Micro ciclo término (${comp.microTermino}) não pode ser posterior ao macro ciclo término (${macroTermino})`);
    }
  }
  
  // Calcular próximo número sequencial de PDI para este aluno
  const existingPdis = await db.select({ numeroPdi: assessmentPdi.numeroPdi })
    .from(assessmentPdi)
    .where(eq(assessmentPdi.alunoId, pdiData.alunoId));
  const proximoNumeroPdi = existingPdis.length > 0
    ? Math.max(...existingPdis.map(p => p.numeroPdi ?? 0)) + 1
    : 1;

  // Insert PDI - convert string dates to Date objects
  const result = await db.insert(assessmentPdi).values({
    alunoId: pdiData.alunoId,
    contratoNivelId: pdiData.contratoNivelId || null,
    trilhaId: pdiData.trilhaId,
    turmaId: pdiData.turmaId || null,
    consultorId: pdiData.consultorId || null,
    programId: pdiData.programId || null,
    macroInicio: pdiData.macroInicio,
    macroTermino: pdiData.macroTermino,
    observacoes: pdiData.observacoes || null,
    numeroPdi: proximoNumeroPdi,
  });
  const pdiId = result[0].insertId;
  
  // Deduplicar competências (evitar inserção duplicada da mesma competenciaId no mesmo PDI)
  const competenciasDeduplicadas = competenciasData.filter(
    (comp, index, self) => index === self.findIndex(c => c.competenciaId === comp.competenciaId)
  );
  // Insert competencias - convert string dates to Date objects
  if (competenciasDeduplicadas.length > 0) {
    await db.insert(assessmentCompetencias).values(
      competenciasDeduplicadas.map(c => ({
        assessmentPdiId: pdiId,
        competenciaId: c.competenciaId,
        peso: c.peso,
        notaCorte: c.notaCorte,
        nivelAtual: c.nivelAtual != null ? String(c.nivelAtual) : null,
        metaCiclo1: c.metaCiclo1 != null ? String(c.metaCiclo1) : null,
        metaCiclo2: c.metaCiclo2 != null ? String(c.metaCiclo2) : null,
        metaFinal: c.metaFinal != null ? String(c.metaFinal) : null,
        justificativa: c.justificativa || null,
        microInicio: c.microInicio || null,
        microTermino: c.microTermino || null,
      }))
    );
  }
  
  return pdiId;
}

/**
 * Update assessment PDI (trilha, datas macro, mentora, turma, programa, observações)
 */
export async function updateAssessmentPdi(
  pdiId: number,
  data: {
    trilhaId?: number;
    consultorId?: number | null;
    turmaId?: number | null;
    programId?: number | null;
    macroInicio?: string;
    macroTermino?: string;
    observacoes?: string | null;
  }
) {
  const db = await getDb();
  if (!db) return;

  // Build update object
  const updateData: Record<string, any> = {};
  if (data.trilhaId !== undefined) updateData.trilhaId = data.trilhaId;
  if (data.consultorId !== undefined) updateData.consultorId = data.consultorId;
  if (data.turmaId !== undefined) updateData.turmaId = data.turmaId;
  if (data.programId !== undefined) updateData.programId = data.programId;
  if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
  if (data.macroInicio !== undefined) updateData.macroInicio = new Date(data.macroInicio + 'T00:00:00');
  if (data.macroTermino !== undefined) updateData.macroTermino = new Date(data.macroTermino + 'T00:00:00');

  if (Object.keys(updateData).length > 0) {
    await db.update(assessmentPdi).set(updateData).where(eq(assessmentPdi.id, pdiId));
  }
}

/**
 * Add a competência to an existing assessment PDI
 */
export async function addCompetenciaToAssessment(
  assessmentPdiId: number,
  data: {
    competenciaId: number;
    peso: 'obrigatoria' | 'opcional';
    notaCorte?: string;
    microInicio?: string | null;
    microTermino?: string | null;
    nivelAtual?: string | null;
    metaCiclo1?: string | null;
    metaCiclo2?: string | null;
    metaFinal?: string | null;
    justificativa?: string | null;
  }
) {
  const db = await getDb();
  if (!db) return null;
  const [pdiCtx] = await db.select({ alunoId: assessmentPdi.alunoId, contratoNivelId: assessmentPdi.contratoNivelId })
    .from(assessmentPdi)
    .where(eq(assessmentPdi.id, assessmentPdiId))
    .limit(1);
  if (pdiCtx?.alunoId) {
    await assertNivelPermiteNovasAtribuicoes(pdiCtx.alunoId, pdiCtx.contratoNivelId, "assessment.addCompetencia");
  }

  // Validate micro dates against macro dates
  const [pdi] = await db.select().from(assessmentPdi).where(eq(assessmentPdi.id, assessmentPdiId)).limit(1);
  if (!pdi) throw new Error('Assessment PDI não encontrado');

  const macroInicioStr = String(pdi.macroInicio);
  const macroTerminoStr = String(pdi.macroTermino);

  if (data.microInicio && data.microInicio < macroInicioStr) {
    throw new Error('Micro ciclo início não pode ser anterior ao macro ciclo início');
  }
  if (data.microTermino && data.microTermino > macroTerminoStr) {
    throw new Error('Micro ciclo término não pode ser posterior ao macro ciclo término');
  }

  // Check if competência already exists in this assessment
  const existing = await db.select().from(assessmentCompetencias)
    .where(sql`${assessmentCompetencias.assessmentPdiId} = ${assessmentPdiId} AND ${assessmentCompetencias.competenciaId} = ${data.competenciaId}`)
    .limit(1);
  if (existing.length > 0) {
    throw new Error('Esta competência já está vinculada a este assessment');
  }

  const result = await db.insert(assessmentCompetencias).values({
    assessmentPdiId,
    competenciaId: data.competenciaId,
    peso: data.peso,
    notaCorte: data.notaCorte || '8.00',
    microInicio: data.microInicio || null,
    microTermino: data.microTermino || null,
    nivelAtual: data.nivelAtual || null,
    metaCiclo1: data.metaCiclo1 || null,
    metaCiclo2: data.metaCiclo2 || null,
    metaFinal: data.metaFinal || null,
    justificativa: data.justificativa || null,
  });

  return result[0].insertId;
}

/**
 * Remove a competência from an assessment PDI
 */
export async function removeCompetenciaFromAssessment(assessmentCompetenciaId: number) {
  const db = await getDb();
  if (!db) return;

  // Also remove related metas and historico_nivel
  try {
    await db.execute(sql`DELETE FROM \`metas\` WHERE \`assessmentCompetenciaId\` = ${assessmentCompetenciaId}`);
  } catch (e) { /* ignore if no metas */ }
  try {
    await db.execute(sql`DELETE FROM \`historico_nivel\` WHERE \`assessmentCompetenciaId\` = ${assessmentCompetenciaId}`);
  } catch (e) { /* ignore if no historico */ }

  await db.delete(assessmentCompetencias).where(eq(assessmentCompetencias.id, assessmentCompetenciaId));
}

/**
 * Delete an entire assessment PDI and all its competências
 */
export async function deleteAssessmentPdi(pdiId: number) {
  const db = await getDb();
  if (!db) return;

  // Get all competencia IDs for this PDI
  const comps = await db.select({ id: assessmentCompetencias.id })
    .from(assessmentCompetencias)
    .where(eq(assessmentCompetencias.assessmentPdiId, pdiId));

  // Delete related metas and historico for each competencia
  for (const comp of comps) {
    try {
      await db.execute(sql`DELETE FROM \`metas\` WHERE \`assessmentCompetenciaId\` = ${comp.id}`);
    } catch (e) { /* ignore */ }
    try {
      await db.execute(sql`DELETE FROM \`historico_nivel\` WHERE \`assessmentCompetenciaId\` = ${comp.id}`);
    } catch (e) { /* ignore */ }
  }

  // Delete all competencias
  await db.delete(assessmentCompetencias).where(eq(assessmentCompetencias.assessmentPdiId, pdiId));

  // Delete the PDI itself
  await db.delete(assessmentPdi).where(eq(assessmentPdi.id, pdiId));
}

/**
 * Freeze (congelar) an assessment PDI
 */
export async function congelarAssessmentPdi(pdiId: number, consultorId: number, motivo?: string) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(assessmentPdi).set({
    status: 'congelado',
    congeladoEm: new Date(),
    congeladoPor: consultorId,
    motivoCongelamento: motivo || null,
  }).where(eq(assessmentPdi.id, pdiId));
}

/**
 * Unfreeze (descongelar) an assessment PDI - reverts status to 'ativo'
 */
export async function descongelarAssessmentPdi(pdiId: number, consultorId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(assessmentPdi).set({
    status: 'ativo',
    descongeladoEm: new Date(),
    descongeladoPor: consultorId,
    // Mantém motivoCongelamento, congeladoEm e congeladoPor para histórico
  }).where(eq(assessmentPdi.id, pdiId));
}

/**
 * Update assessment competencia (micro ciclo dates, peso, nota de corte)
 */
export async function updateAssessmentCompetencia(
  id: number,
  data: {
    peso?: 'obrigatoria' | 'opcional';
    notaCorte?: string;
    microInicio?: string | null;
    microTermino?: string | null;
  }
) {
  const db = await getDb();
  if (!db) return;
  
  // If updating micro dates, validate against macro dates
  if (data.microInicio || data.microTermino) {
    const [comp] = await db.select().from(assessmentCompetencias)
      .where(eq(assessmentCompetencias.id, id)).limit(1);
    if (comp) {
      const [pdi] = await db.select().from(assessmentPdi)
        .where(eq(assessmentPdi.id, comp.assessmentPdiId)).limit(1);
      if (pdi) {
        const macroInicioStr = String(pdi.macroInicio);
        const macroTerminoStr = String(pdi.macroTermino);
        if (data.microInicio && data.microInicio < macroInicioStr) {
          throw new Error('Micro ciclo início não pode ser anterior ao macro ciclo início');
        }
        if (data.microTermino && data.microTermino > macroTerminoStr) {
          throw new Error('Micro ciclo término não pode ser posterior ao macro ciclo término');
        }
      }
    }
  }
  
  // Build update object converting string dates to Date objects
  const updateData: Record<string, any> = {};
  if (data.peso !== undefined) updateData.peso = data.peso;
  if (data.notaCorte !== undefined) updateData.notaCorte = data.notaCorte;
  if (data.microInicio !== undefined) updateData.microInicio = data.microInicio || null;
  if (data.microTermino !== undefined) updateData.microTermino = data.microTermino || null;
  
  await db.update(assessmentCompetencias).set(updateData).where(eq(assessmentCompetencias.id, id));
}

/**
 * Get assessment summary for mentor's students
 */
export async function getAssessmentsByConsultor(consultorId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all mentoring sessions for this consultor to find their students
  const sessions = await db.select({ alunoId: mentoringSessions.alunoId })
    .from(mentoringSessions)
    .where(eq(mentoringSessions.consultorId, consultorId));
  
  const uniqueAlunoIds = Array.from(new Set(sessions.map(s => s.alunoId)));
  if (uniqueAlunoIds.length === 0) return [];
  
  // Get PDIs for these students
  const pdis = await db.select().from(assessmentPdi)
    .where(sql`${assessmentPdi.alunoId} IN (${sql.join(uniqueAlunoIds.map(id => sql`${id}`), sql`, `)})`);
  
  if (pdis.length === 0) return [];
  
  const allAlunos = await db.select().from(alunos);
  const alunoMap = new Map(allAlunos.map(a => [a.id, a]));
  
  const allTrilhas = await db.select().from(trilhas);
  const trilhaMap = new Map(allTrilhas.map(t => [t.id, t]));
  
  return pdis.map(pdi => ({
    ...pdi,
    alunoNome: alunoMap.get(pdi.alunoId)?.name || 'Desconhecido',
    trilhaNome: trilhaMap.get(pdi.trilhaId)?.name || 'Não definida',
  }));
}


// ============ SESSION PROGRESS FUNCTIONS ============

/**
 * Get session progress for a student based on their Assessment PDI macro cycle.
 * Total sessions = months between macroInicio and macroTermino (1 session per month).
 * Returns progress info including sessions completed, total expected, and alert flags.
 */
export async function getSessionProgressByAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get active assessment PDI for this student
  const pdis = await db.select().from(assessmentPdi)
    .where(and(
      eq(assessmentPdi.alunoId, alunoId),
      eq(assessmentPdi.status, 'ativo')
    ))
    .orderBy(desc(assessmentPdi.createdAt))
    .limit(1);

  if (pdis.length === 0) {
    // Check if there are frozen PDIs (congelados) - different from "no PDI at all"
    const frozenPdis = await db.select().from(assessmentPdi)
      .where(and(
        eq(assessmentPdi.alunoId, alunoId),
        eq(assessmentPdi.status, 'congelado')
      ))
      .limit(1);

    if (frozenPdis.length > 0) {
      // Has frozen PDIs - return special indicator so frontend can show appropriate message
      return { alunoId, todosCongelados: true, macroInicio: null, macroTermino: null, totalSessoesEsperadas: 0, sessoesRealizadas: 0, sessoesFaltantes: 0, faltaUmaSessao: false, cicloCompleto: false, percentualProgresso: 0, assessmentPdiId: null, trilhaId: null };
    }

    // No assessment PDI at all - return null (can't calculate progress)
    return null;
  }

  const pdi = pdis[0];
  
  // Calculate total expected sessions: use totalSessoesPrevistas if set, otherwise fallback to months difference
  let totalSessoesEsperadas: number;
  if (pdi.totalSessoesPrevistas && pdi.totalSessoesPrevistas > 0) {
    totalSessoesEsperadas = pdi.totalSessoesPrevistas;
  } else {
    const macroInicio = new Date(pdi.macroInicio);
    const macroTermino = new Date(pdi.macroTermino);
    const totalMeses = (macroTermino.getFullYear() - macroInicio.getFullYear()) * 12 
      + (macroTermino.getMonth() - macroInicio.getMonth());
    totalSessoesEsperadas = Math.max(1, totalMeses);
  }

  // Count sessions completed for this student (excluding assessment sessions and cancelled)
  const sessions = await db.select().from(mentoringSessions)
    .where(and(
      eq(mentoringSessions.alunoId, alunoId),
      eq(mentoringSessions.isAssessment, 0),
      eq(mentoringSessions.cancelada, 0)
    ));
  
  const sessoesRealizadas = sessions.length;
  const sessoesFaltantes = Math.max(0, totalSessoesEsperadas - sessoesRealizadas);
  const faltaUmaSessao = sessoesFaltantes === 1;
  const cicloCompleto = sessoesRealizadas >= totalSessoesEsperadas;
  const percentualProgresso = Math.min(100, Math.round((sessoesRealizadas / totalSessoesEsperadas) * 100));

  return {
    alunoId,
    macroInicio: pdi.macroInicio,
    macroTermino: pdi.macroTermino,
    totalSessoesEsperadas,
    sessoesRealizadas,
    sessoesFaltantes,
    faltaUmaSessao,
    cicloCompleto,
    percentualProgresso,
    assessmentPdiId: pdi.id,
    trilhaId: pdi.trilhaId,
  };
}

/**
 * Get session progress for all students (for admin/manager views).
 * Returns array of progress info for students that have an active Assessment PDI.
 */
export async function getAllStudentsSessionProgress() {
  const db = await getDb();
  if (!db) return [];

  // Get all active assessment PDIs
  const pdis = await db.select().from(assessmentPdi)
    .where(eq(assessmentPdi.status, 'ativo'));

  if (pdis.length === 0) return [];

  // Get all mentoring sessions
  const allSessions = await db.select().from(mentoringSessions);
  
  // Group sessions by aluno (count excludes assessment, but last session date includes all)
  const sessionsByAluno = new Map<number, number>();
  const lastSessionByAluno = new Map<number, Date>();
  const lastMentorByAluno = new Map<number, number>();
  for (const s of allSessions) {
    // Only count non-assessment sessions for progress calculation
    if (!s.isAssessment) {
      sessionsByAluno.set(s.alunoId, (sessionsByAluno.get(s.alunoId) || 0) + 1);
    }
    if (s.sessionDate) {
      const sessionDate = new Date(s.sessionDate);
      const current = lastSessionByAluno.get(s.alunoId);
      if (!current || sessionDate.getTime() > current.getTime()) {
        lastSessionByAluno.set(s.alunoId, sessionDate);
        if (s.consultorId) lastMentorByAluno.set(s.alunoId, s.consultorId);
      }
    }
  }

  // Get aluno names
  const allAlunos = await db.select().from(alunos);
  const alunoMap = new Map(allAlunos.map(a => [a.id, a]));

  // Get consultor names
  const allConsultors = await db.select().from(consultors);
  const consultorMap = new Map(allConsultors.map(c => [c.id, c]));

  // Get program names (and identify inactive ones)
  const allPrograms = await db.select().from(programs);
  const programMap = new Map(allPrograms.map(p => [p.id, p]));
  const inactiveProgramIds = new Set(allPrograms.filter(p => p.isActive === 0).map(p => p.id));

  // Get turma names
  const allTurmas = await db.select().from(turmas);
  const turmaMap = new Map(allTurmas.map(t => [t.id, t]));

  // Get trilha names
  const allTrilhas = await db.select().from(trilhas);
  const trilhaMap = new Map(allTrilhas.map(t => [t.id, t]));

  // Filter out PDIs from inactive programs, inactive alunos, AND frozen PDIs
  const activePdis = pdis.filter(pdi => {
    if (pdi.programId && inactiveProgramIds.has(pdi.programId)) return false;
    const aluno = alunoMap.get(pdi.alunoId);
    if (aluno && aluno.isActive === 0) return false;
    // Exclude frozen PDIs (congeladoEm set but not yet descongelado)
    if (pdi.congeladoEm && !pdi.descongeladoEm) return false;
    return true;
  });

  return activePdis.map(pdi => {
    // Use totalSessoesPrevistas if set, otherwise fallback to months difference
    let totalSessoesEsperadas: number;
    if (pdi.totalSessoesPrevistas && pdi.totalSessoesPrevistas > 0) {
      totalSessoesEsperadas = pdi.totalSessoesPrevistas;
    } else {
      const macroInicio = new Date(pdi.macroInicio);
      const macroTermino = new Date(pdi.macroTermino);
      const totalMeses = (macroTermino.getFullYear() - macroInicio.getFullYear()) * 12 
        + (macroTermino.getMonth() - macroInicio.getMonth());
      totalSessoesEsperadas = Math.max(1, totalMeses);
    }
    const sessoesRealizadas = sessionsByAluno.get(pdi.alunoId) || 0;
    const sessoesFaltantes = Math.max(0, totalSessoesEsperadas - sessoesRealizadas);
    const faltaUmaSessao = sessoesFaltantes === 1;
    const cicloCompleto = sessoesRealizadas >= totalSessoesEsperadas;
    const percentualProgresso = Math.min(100, Math.round((sessoesRealizadas / totalSessoesEsperadas) * 100));
    
    const aluno = alunoMap.get(pdi.alunoId);
    // Get mentor: first from PDI, then from last session, then from aluno record
    const mentorId = pdi.consultorId || lastMentorByAluno.get(pdi.alunoId) || aluno?.consultorId || null;
    const consultor = mentorId ? consultorMap.get(mentorId) : null;
    const program = pdi.programId ? programMap.get(pdi.programId) : null;
    // Use pdi.turmaId (from assessment_pdi) instead of aluno.turmaId
    // This is critical for students like Flavia who have PDIs in different turmas than their primary turmaId
    const pdiTurmaId = pdi.turmaId || aluno?.turmaId || null;
    const turma = pdiTurmaId ? turmaMap.get(pdiTurmaId) : null;
    const trilha = pdi.trilhaId ? trilhaMap.get(pdi.trilhaId) : null;

    const ultimaSessao = lastSessionByAluno.get(pdi.alunoId) || null;
    const diasSemSessao = ultimaSessao 
      ? Math.floor((Date.now() - ultimaSessao.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const atrasado30dias = diasSemSessao !== null ? diasSemSessao >= 30 : (sessoesRealizadas === 0);

    return {
      alunoId: pdi.alunoId,
      alunoNome: aluno?.name || 'Desconhecido',
      alunoEmail: aluno?.email || null,
      consultorId: mentorId,
      consultorNome: consultor?.name || null,
      consultorEmail: consultor?.email || null,
      programId: pdi.programId,
      programaNome: program?.name || null,
      turmaId: pdiTurmaId,
      turmaNome: turma?.name || null,
      trilhaId: pdi.trilhaId,
      trilhaNome: trilha?.name || null,
      macroInicio: pdi.macroInicio,
      macroTermino: pdi.macroTermino,
      totalSessoesEsperadas,
      sessoesRealizadas,
      sessoesFaltantes,
      faltaUmaSessao,
      cicloCompleto,
      percentualProgresso,
      assessmentPdiId: pdi.id,
      ultimaSessao: ultimaSessao ? ultimaSessao.toISOString() : null,
      diasSemSessao,
      atrasado30dias,
    };
  });
}

// ============ PERFORMANCE UPLOAD FUNCTIONS ============

export async function createPerformanceUpload(data: InsertPerformanceUpload): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(performanceUploads).values(data);
  return Number(result[0].insertId);
}

export async function updatePerformanceUpload(id: number, data: Partial<InsertPerformanceUpload>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(performanceUploads).set(data).where(eq(performanceUploads.id, id));
}

export async function getPerformanceUploads(limit: number = 20): Promise<PerformanceUpload[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(performanceUploads).orderBy(desc(performanceUploads.createdAt)).limit(limit);
}

export async function getPerformanceUploadById(id: number): Promise<PerformanceUpload | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const results = await db.select().from(performanceUploads).where(eq(performanceUploads.id, id));
  return results[0];
}

// ============ STUDENT PERFORMANCE FUNCTIONS ============

export async function deleteAllStudentPerformance(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.delete(studentPerformance);
  return Number(result[0].affectedRows);
}

export async function deleteStudentPerformanceByUploadId(uploadId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.delete(studentPerformance).where(eq(studentPerformance.uploadId, uploadId));
  return Number(result[0].affectedRows);
}

export async function insertStudentPerformanceBatch(records: InsertStudentPerformance[]): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  if (records.length === 0) return 0;
  
  // Insert in batches of 100 to avoid query size limits
  let inserted = 0;
  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100);
    await db.insert(studentPerformance).values(batch);
    inserted += batch.length;
  }
  return inserted;
}

export async function getStudentPerformanceByAluno(alunoId: number): Promise<StudentPerformance[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(studentPerformance).where(eq(studentPerformance.alunoId, alunoId));
}

export async function getStudentPerformanceByAlunoAndNivel(alunoId: number, contratoNivelId?: number | null): Promise<StudentPerformance[]> {
  const db = await getDb();
  if (!db) return [];
  if (!contratoNivelId) {
    return getStudentPerformanceByAluno(alunoId);
  }

  const pdis = await db.select({ id: assessmentPdi.id })
    .from(assessmentPdi)
    .where(and(
      eq(assessmentPdi.alunoId, alunoId),
      eq(assessmentPdi.contratoNivelId, contratoNivelId),
    ));

  if (pdis.length === 0) return [];
  const pdiIds = pdis.map(p => p.id);
  const comps = await db.select({
    competenciaId: assessmentCompetencias.competenciaId,
  }).from(assessmentCompetencias)
    .where(sql`${assessmentCompetencias.assessmentPdiId} IN (${sql.join(pdiIds.map(id => sql`${id}`), sql`, `)})`);

  const compIds = comps.map(c => c.competenciaId).filter((v): v is number => !!v);
  if (compIds.length === 0) return [];

  return await db.select().from(studentPerformance).where(and(
    eq(studentPerformance.alunoId, alunoId),
    inArray(studentPerformance.competenciaId, compIds),
  ));
}

export async function getStudentPerformanceByExternalUserId(externalUserId: string): Promise<StudentPerformance[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(studentPerformance).where(eq(studentPerformance.externalUserId, externalUserId));
}

export async function getStudentPerformanceSummary(): Promise<{
  totalRecords: number;
  uniqueStudents: number;
  uniqueCompetencias: number;
  uniqueTurmas: number;
  lastUploadId: number | null;
}> {
  const db = await getDb();
  if (!db) return { totalRecords: 0, uniqueStudents: 0, uniqueCompetencias: 0, uniqueTurmas: 0, lastUploadId: null };
  
  const [countResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(studentPerformance);
  const [studentsResult] = await db.select({ count: sql<number>`COUNT(DISTINCT ${studentPerformance.externalUserId})` }).from(studentPerformance);
  const [compResult] = await db.select({ count: sql<number>`COUNT(DISTINCT ${studentPerformance.externalCompetenciaId})` }).from(studentPerformance);
  const [turmaResult] = await db.select({ count: sql<number>`COUNT(DISTINCT ${studentPerformance.externalTurmaId})` }).from(studentPerformance);
  const [lastUpload] = await db.select({ id: performanceUploads.id }).from(performanceUploads).orderBy(desc(performanceUploads.createdAt)).limit(1);
  
  return {
    totalRecords: Number(countResult?.count || 0),
    uniqueStudents: Number(studentsResult?.count || 0),
    uniqueCompetencias: Number(compResult?.count || 0),
    uniqueTurmas: Number(turmaResult?.count || 0),
    lastUploadId: lastUpload?.id || null,
  };
}

export async function getAllStudentPerformance(): Promise<StudentPerformance[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(studentPerformance).orderBy(studentPerformance.userName, studentPerformance.competenciaName);
}

/**
 * Converte registros de student_performance para PerformanceRecord[] do calculador.
 * A nota é mediaAvaliacoesRespondidas (escala 0-100), convertida para 0-10.
 * Aprovado = nota >= 7 (na escala 0-10).
 */
export async function getStudentPerformanceAsRecords(): Promise<{
  idUsuario: string;
  nomeTurma: string;
  idCompetencia: string;
  nomeCompetencia: string;
  progressoAulas: number;
  notaAvaliacao: number;
  aprovado: boolean;
  totalAulas: number;
  aulasDisponiveis: number;
  aulasConcluidas: number;
  aulasEmAndamento: number;
  competenciaConcluida: boolean;
}[]> {
  const db = await getDb();
  if (!db) return [];
  
  const records = await db.select({
    externalUserId: studentPerformance.externalUserId,
    alunoId: studentPerformance.alunoId,
    turmaName: studentPerformance.turmaName,
    competenciaId: studentPerformance.competenciaId,
    externalCompetenciaId: studentPerformance.externalCompetenciaId,
    competenciaName: studentPerformance.competenciaName,
    progressoTotal: studentPerformance.progressoTotal,
    mediaAvaliacoesRespondidas: studentPerformance.mediaAvaliacoesRespondidas,
    mediaAvaliacoesDisponiveis: studentPerformance.mediaAvaliacoesDisponiveis,
    totalAulas: studentPerformance.totalAulas,
    aulasDisponiveis: studentPerformance.aulasDisponiveis,
    aulasConcluidas: studentPerformance.aulasConcluidas,
    aulasEmAndamento: studentPerformance.aulasEmAndamento,
  }).from(studentPerformance);
  
  // Buscar alunos para mapear alunoId -> externalId
  const alunosList = await db.select({ id: alunos.id, externalId: alunos.externalId }).from(alunos);
  const alunoMap = new Map(alunosList.map(a => [a.id, a.externalId]));
  
  return records.map(r => {
    // Nota: usar mediaAvaliacoesRespondidas se > 0, senão mediaAvaliacoesDisponiveis
    const mediaResp = r.mediaAvaliacoesRespondidas ? parseFloat(String(r.mediaAvaliacoesRespondidas)) : 0;
    const mediaDisp = r.mediaAvaliacoesDisponiveis ? parseFloat(String(r.mediaAvaliacoesDisponiveis)) : 0;
    const progresso = r.progressoTotal || 0;
    
    // Dados de aulas
    const totalAulas = r.totalAulas || 0;
    const aulasDisponiveis = r.aulasDisponiveis || 0;
    const aulasConcluidas = r.aulasConcluidas || 0;
    const aulasEmAndamento = r.aulasEmAndamento || 0;
    
    // Competência concluída = fez todas as aulas disponíveis
    const competenciaConcluida = aulasDisponiveis > 0 && aulasConcluidas >= aulasDisponiveis;
    
    // Nota: prioridade mediaAvaliacoesRespondidas > mediaAvaliacoesDisponiveis
    // Escala 0-100, converter para 0-10
    const notaBase = mediaResp > 0 ? mediaResp : (mediaDisp > 0 ? mediaDisp : 0);
    const nota010 = notaBase / 10;
    
    // Se ambas as médias são 0, o aluno não cursou
    const naoCursou = mediaResp === 0 && mediaDisp === 0;
    
    const idUsuario = (r.alunoId ? alunoMap.get(r.alunoId) : null) || r.externalUserId;
    return {
      idUsuario: idUsuario || r.externalUserId,
      nomeTurma: r.turmaName || '',
      idCompetencia: r.externalCompetenciaId || String(r.competenciaId || ''),
      nomeCompetencia: r.competenciaName || '',
      progressoAulas: progresso,
      notaAvaliacao: naoCursou ? -1 : nota010, // -1 indica "não cursou"
      aprovado: competenciaConcluida && !naoCursou && nota010 >= 7,
      totalAulas,
      aulasDisponiveis,
      aulasConcluidas,
      aulasEmAndamento,
      competenciaConcluida,
    };
  });
}

/**
 * Converte registros de aluno_atividade_progresso para PerformanceRecord[] do calculador.
 * Usado como fallback para alunos que não têm dados em student_performance (alunos nativos da plataforma).
 * Retorna o mesmo formato que getStudentPerformanceAsRecords().
 */
export async function getAlunoAtividadePerformanceAsRecords(): Promise<{
  idUsuario: string;
  nomeTurma: string;
  idCompetencia: string;
  nomeCompetencia: string;
  progressoAulas: number;
  notaAvaliacao: number;
  aprovado: boolean;
  totalAulas: number;
  aulasDisponiveis: number;
  aulasConcluidas: number;
  aulasEmAndamento: number;
  competenciaConcluida: boolean;
}[]> {
  const dbConn = await getDb();
  if (!dbConn) return [];

  // Buscar apenas alunos com plataformaAulas = 'sistema_interno' (alunos nativos da plataforma)
  // Alunos 'scaffold' têm dados em student_performance via CSV externo
  const alunosList = await dbConn.select({
    id: alunos.id,
    externalId: alunos.externalId,
    plataformaAulas: alunos.plataformaAulas,
  }).from(alunos).where(eq(alunos.plataformaAulas, 'sistema_interno'));
  if (alunosList.length === 0) return [];
  const alunoMap = new Map(alunosList.map(a => [a.id, a.externalId]));
  const alunoIds = new Set(alunosList.map(a => a.id));

  // Buscar apenas cursos atribuídos de alunos sistema_interno
  const cursosAtribuidos = await dbConn.select({
    id: alunoCursoAtribuido.id,
    alunoId: alunoCursoAtribuido.alunoId,
    cursoId: alunoCursoAtribuido.cursoId,
    competenciaId: alunoCursoAtribuido.competenciaId,
  }).from(alunoCursoAtribuido);
  const cursosAtribuidosFiltrados = cursosAtribuidos.filter(c => alunoIds.has(c.alunoId));

  if (cursosAtribuidosFiltrados.length === 0) return [];

  // Buscar competências para mapear competenciaId -> codigoIntegracao e nome
  const allCompetencias = await dbConn.select({
    id: competencias.id,
    nome: competencias.nome,
    codigoIntegracao: competencias.codigoIntegracao,
  }).from(competencias);
  const compCodigoMap2 = new Map(allCompetencias.map(c => [c.id, c.codigoIntegracao || String(c.id)]));
  const compNomeMap2 = new Map(allCompetencias.map(c => [c.id, c.nome]));

  // Buscar total de atividades por curso (apenas ativas)
  const totalAtivPorCurso = await dbConn.select({
    cursoId: atividadesCurso.cursoId,
    count: sql<number>`COUNT(*)`,
  }).from(atividadesCurso).where(eq(atividadesCurso.isActive, 1)).groupBy(atividadesCurso.cursoId);
  const totalAtivMap = new Map(totalAtivPorCurso.map(r => [r.cursoId, Number(r.count)]));

  // Buscar progresso de atividades
  const progressos = await dbConn.select({
    alunoId: alunoAtividadeProgresso.alunoId,
    cursoAtribuidoId: alunoAtividadeProgresso.cursoAtribuidoId,
    status: alunoAtividadeProgresso.status,
    notaFinal: alunoAtividadeProgresso.notaFinal,
  }).from(alunoAtividadeProgresso);

  // Agrupar progressos por (alunoId, cursoAtribuidoId)
  const progressoMap = new Map<string, typeof progressos>();
  for (const p of progressos) {
    const key = `${p.alunoId}|${p.cursoAtribuidoId}`;
    if (!progressoMap.has(key)) progressoMap.set(key, []);
    progressoMap.get(key)!.push(p);
  }

  const result: {
    idUsuario: string; nomeTurma: string; idCompetencia: string; nomeCompetencia: string;
    progressoAulas: number; notaAvaliacao: number; aprovado: boolean;
    totalAulas: number; aulasDisponiveis: number; aulasConcluidas: number;
    aulasEmAndamento: number; competenciaConcluida: boolean;
  }[] = [];
  const seen = new Set<string>(); // evitar duplicatas por (idUsuario, idCompetencia)

  for (const curso of cursosAtribuidosFiltrados) {
    const idUsuario = alunoMap.get(curso.alunoId) || String(curso.alunoId);
    const idCompetencia = compCodigoMap2.get(curso.competenciaId) || String(curso.competenciaId);
    const key = `${idUsuario}|${idCompetencia}`;
    // Se já processamos essa combinação (aluno+competência), pular — evitar duplicatas
    if (seen.has(key)) continue;
    seen.add(key);

    const totalAulas = totalAtivMap.get(curso.cursoId) || 0;
    const progKey = `${curso.alunoId}|${curso.id}`;
    const atividades = progressoMap.get(progKey) || [];

    const concluidas = atividades.filter(a => a.status === 'aprovada' || a.status === 'concluida');
    const emAndamento = atividades.filter(a => a.status === 'em_andamento');
    const aulasConcluidas = concluidas.length;
    const aulasEmAndamento = emAndamento.length;
    const aulasDisponiveis = totalAulas;

    // Nota: média das notas das atividades com avaliação (notaFinal não nula), escala 0-10
    const notasValidas = concluidas.filter(a => a.notaFinal !== null && a.notaFinal !== undefined);
    const mediaNotas = notasValidas.length > 0
      ? notasValidas.reduce((sum, a) => sum + Number(a.notaFinal), 0) / notasValidas.length
      : 0;

    const competenciaConcluida = aulasDisponiveis > 0 && aulasConcluidas >= aulasDisponiveis;
    const naoCursou = aulasConcluidas === 0 && aulasEmAndamento === 0;
    const progressoAulas = aulasDisponiveis > 0 ? Math.round((aulasConcluidas / aulasDisponiveis) * 100) : 0;

    result.push({
      idUsuario,
      nomeTurma: '',
      idCompetencia,
      nomeCompetencia: compNomeMap2.get(curso.competenciaId) || '',
      progressoAulas,
      notaAvaliacao: naoCursou ? -1 : mediaNotas,
      aprovado: competenciaConcluida && !naoCursou && mediaNotas >= 7,
      totalAulas,
      aulasDisponiveis,
      aulasConcluidas,
      aulasEmAndamento,
      competenciaConcluida,
    });
  }

  return result;
}

// ==================== SCHEDULED WEBINARS ====================
export async function createWebinar(data: InsertScheduledWebinar): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(scheduledWebinars).values(data);
  return result[0].insertId;
}

export async function updateWebinar(id: number, data: Partial<InsertScheduledWebinar>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Buscar o webinar antes de atualizar para ter o título antigo
  const [oldWebinar] = await db.select().from(scheduledWebinars).where(eq(scheduledWebinars.id, id)).limit(1);

  // Atualizar o webinar
  await db.update(scheduledWebinars).set(data).where(eq(scheduledWebinars.id, id));

  // Se o título mudou, atualizar também os eventos vinculados na tabela events
  // para evitar duplicatas (evento com título antigo + evento sintético com título novo)
  if (data.title && oldWebinar?.title && data.title !== oldWebinar.title) {
    // Atualizar evento vinculado pelo externalId sw-{id}
    await db.update(events)
      .set({ title: data.title })
      .where(eq(events.externalId, `sw-${id}`));

    // Atualizar eventos com título antigo e mesma data (importados sem externalId)
    if (oldWebinar.eventDate) {
      await db.update(events)
        .set({ title: data.title })
        .where(and(
          eq(events.title, oldWebinar.title),
          eq(events.eventDate, oldWebinar.eventDate),
          isNull(events.externalId)
        ));
    }
  }

  // Se a data mudou, atualizar também os eventos vinculados
  if (data.eventDate && oldWebinar?.eventDate && String(data.eventDate) !== String(oldWebinar.eventDate)) {
    await db.update(events)
      .set({ eventDate: data.eventDate as any })
      .where(eq(events.externalId, `sw-${id}`));
  }
}

export async function deleteWebinar(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Buscar o webinar antes de excluir para ter título e data
  const [webinar] = await db.select().from(scheduledWebinars).where(eq(scheduledWebinars.id, id)).limit(1);

  // 1. Limpar eventos vinculados pelo externalId padrão sw-{id}
  const linkedEvents = await db.select().from(events).where(eq(events.externalId, `sw-${id}`));
  if (linkedEvents.length > 0) {
    const linkedEventIds = linkedEvents.map(e => e.id);
    await db.delete(eventParticipation).where(inArray(eventParticipation.eventId, linkedEventIds));
    await db.delete(events).where(inArray(events.id, linkedEventIds));
  }

  // 2. Limpar eventos com mesmo título e data (importados manualmente sem externalId)
  if (webinar?.title && webinar?.eventDate) {
    const sameEvents = await db.select().from(events).where(
      and(
        eq(events.title, webinar.title),
        eq(events.eventDate, webinar.eventDate),
        isNull(events.externalId)
      )
    );
    if (sameEvents.length > 0) {
      const sameEventIds = sameEvents.map(e => e.id);
      await db.delete(eventParticipation).where(inArray(eventParticipation.eventId, sameEventIds));
      await db.delete(events).where(inArray(events.id, sameEventIds));
    }
  }

  // 3. Excluir o webinar
  await db.delete(scheduledWebinars).where(eq(scheduledWebinars.id, id));
}

export async function getWebinarById(id: number): Promise<ScheduledWebinar | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(scheduledWebinars).where(eq(scheduledWebinars.id, id));
  return rows[0];
}

export async function listWebinars(statusFilter?: string): Promise<ScheduledWebinar[]> {
  const db = await getDb();
  if (!db) return [];
  if (statusFilter && statusFilter !== "all") {
    return await db.select().from(scheduledWebinars)
      .where(eq(scheduledWebinars.status, statusFilter as any))
      .orderBy(desc(scheduledWebinars.eventDate));
  }
  return await db.select().from(scheduledWebinars).orderBy(desc(scheduledWebinars.eventDate));
}

export async function listUpcomingWebinars(limit: number = 10): Promise<ScheduledWebinar[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(scheduledWebinars)
    .where(and(
      inArray(scheduledWebinars.status, ["published", "completed"]),
      gte(scheduledWebinars.eventDate, new Date())
    ))
    .orderBy(asc(scheduledWebinars.eventDate))
    .limit(limit);
}

export async function listPastWebinars(limit: number = 10): Promise<ScheduledWebinar[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(scheduledWebinars)
    .where(and(
      inArray(scheduledWebinars.status, ["published", "completed"]),
      lt(scheduledWebinars.eventDate, new Date())
    ))
    .orderBy(desc(scheduledWebinars.eventDate))
    .limit(limit);
}

// ==================== ANNOUNCEMENTS ====================

export async function createAnnouncement(data: InsertAnnouncement): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(announcements).values(data);
  return result[0].insertId;
}

export async function updateAnnouncement(id: number, data: Partial<InsertAnnouncement>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(announcements).set(data).where(eq(announcements.id, id));
}

export async function deleteAnnouncement(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(announcements).where(eq(announcements.id, id));
}

export async function getAnnouncementById(id: number): Promise<Announcement | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(announcements).where(eq(announcements.id, id));
  return rows[0];
}

export async function listAnnouncements(activeOnly: boolean = false): Promise<Announcement[]> {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return await db.select().from(announcements)
      .where(eq(announcements.isActive, 1))
      .orderBy(desc(announcements.priority), desc(announcements.createdAt));
  }
  return await db.select().from(announcements).orderBy(desc(announcements.priority), desc(announcements.createdAt));
}

export async function listActiveAnnouncementsForStudent(programId?: number): Promise<Announcement[]> {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const conditions = [
    eq(announcements.isActive, 1),
  ];
  
  const rows = await db.select().from(announcements)
    .where(and(...conditions))
    .orderBy(desc(announcements.priority), desc(announcements.createdAt));
  
  // Filter in JS for more complex logic (publishAt, expiresAt, targetAudience)
  return rows.filter(a => {
    if (a.publishAt && new Date(a.publishAt) > now) return false;
    if (a.expiresAt && new Date(a.expiresAt) < now) return false;
    if (a.targetAudience === "all") return true;
    if (!programId) return true;
    // Match by programId if targetAudience is specific
    return true; // For now allow all, can refine later
  });
}

export async function getStudentEmailsByProgram(programId?: number): Promise<{email: string | null; name: string | null}[]> {
  const db = await getDb();
  if (!db) return [];
  // Filtra apenas alunos com alunoId preenchido (alunos de mentoria com acesso ao mural)
  // Candidatos do processo seletivo têm alunoId nulo e não têm acesso ao mural
  if (programId) {
    return await db.select({ email: users.email, name: users.name })
      .from(users)
      .where(and(
        eq(users.role, "user"),
        eq(users.isActive, 1),
        eq(users.programId, programId),
        isNotNull(users.email),
        isNotNull(users.alunoId)
      ));
  }
  return await db.select({ email: users.email, name: users.name })
    .from(users)
    .where(and(
      eq(users.role, "user"),
      eq(users.isActive, 1),
      isNotNull(users.email),
      isNotNull(users.alunoId)
    ));
}

export async function getActiveStudentsWithIds(programId?: number): Promise<{id: number; email: string | null; name: string | null}[]> {
  const db = await getDb();
  if (!db) return [];
  if (programId) {
    const byProgram = await db.select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(and(
        eq(users.role, "user"),
        eq(users.isActive, 1),
        eq(users.programId, programId),
        isNotNull(users.email)
      ));
    return byProgram.filter(s => {
      if (!s.email) return false;
      const email = s.email.toLowerCase();
      if (email.endsWith('@test.com')) return false;
      if (email.endsWith('@teste.com')) return false;
      if (email.match(/^(turma|direto|contrato|aluno)-[a-z0-9]+-\d+@/)) return false;
      return true;
    });
  }
  const allStudents = await db.select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(and(
      eq(users.role, "user"),
      eq(users.isActive, 1),
      isNotNull(users.email)
    ));
  // Filtrar emails fictícios gerados por importação em massa (@test.com, @teste.com, padrões turma-/direto-/contrato-)
  return allStudents.filter(s => {
    if (!s.email) return false;
    const email = s.email.toLowerCase();
    if (email.endsWith('@test.com')) return false;
    if (email.endsWith('@teste.com')) return false;
    if (email.match(/^(turma|direto|contrato|aluno)-[a-z0-9]+-\d+@/)) return false;
    return true;
  });
}


// ============ GET RECIPIENTS BY GROUP ============

/**
 * Get active mentors (role=mentor) with email and id
 */
export async function getActiveMentorsWithIds(): Promise<{id: number; email: string | null; name: string | null; group: string}[]> {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select({ id: consultors.id, email: consultors.email, name: consultors.name })
    .from(consultors)
    .where(and(
      eq(consultors.role, "mentor"),
      eq(consultors.isActive, 1),
      isNotNull(consultors.email)
    ));
  return results.map(r => ({ ...r, group: 'mentor' }));
}

/**
 * Get active managers (role=gerente) with email and id
 */
export async function getActiveManagersWithIds(): Promise<{id: number; email: string | null; name: string | null; group: string}[]> {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select({ id: consultors.id, email: consultors.email, name: consultors.name })
    .from(consultors)
    .where(and(
      eq(consultors.role, "gerente"),
      eq(consultors.isActive, 1),
      isNotNull(consultors.email)
    ));
  return results.map(r => ({ ...r, group: 'gerente' }));
}

// ============ WEBINAR ATTENDANCE (Self-reported) ============

/**
 * Marcar presença do aluno em um evento com reflexão
 * Se já existe registro (importado da planilha), atualiza com reflexão e selfReportedAt
 * Se não existe, cria novo registro com status "presente"
 */
export async function markWebinarAttendance(
  alunoId: number,
  eventId: number,
  reflexao: string,
  contratoNivelId?: number | null
): Promise<{ updated: boolean; created: boolean }> {
  const db = await getDb();
  if (!db) return { updated: false, created: false };
  const contratoNivelIdResolved = await resolveContratoNivelId(alunoId, contratoNivelId);

  // Verificar se já existe registro de participação
  const existing = await db.select()
    .from(eventParticipation)
    .where(and(
      eq(eventParticipation.alunoId, alunoId),
      eq(eventParticipation.eventId, eventId)
    ))
    .limit(1);

  if (existing.length > 0) {
    // Atualizar registro existente com reflexão e marcar como presente
    await db.update(eventParticipation)
      .set({
        status: "presente",
        reflexao,
        selfReportedAt: new Date(),
        contratoNivelId: existing[0].contratoNivelId ?? contratoNivelIdResolved,
      })
      .where(eq(eventParticipation.id, existing[0].id));
    return { updated: true, created: false };
  } else {
    // Criar novo registro
    await db.insert(eventParticipation).values({
      alunoId,
      contratoNivelId: contratoNivelIdResolved,
      eventId,
      status: "presente",
      reflexao,
      selfReportedAt: new Date(),
    });
    return { updated: false, created: true };
  }
}

/**
 * Buscar webinars pendentes de presença para um aluno
 * Retorna eventos do programa do aluno onde ele ainda não marcou presença (selfReportedAt é null)
 */
export async function getWebinarsPendingAttendance(alunoId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  // Buscar aluno para saber o programId
  const aluno = await getAlunoById(alunoId);
  if (!aluno) return [];

  // Buscar macroInicio e macroTermino do aluno
  const macroInicioMap = await getAlunoMacroInicioMap();
  const macroInicio = macroInicioMap.get(alunoId);

  // Buscar macroTermino do PDI ativo do aluno
  const db2 = await getDb();
  let macroTermino: Date | null = null;
  if (db2) {
    const pdis = await db2.select({ macroTermino: assessmentPdi.macroTermino })
      .from(assessmentPdi)
      .where(and(eq(assessmentPdi.alunoId, alunoId), eq(assessmentPdi.status, 'ativo')))
      .limit(1);
    if (pdis[0]?.macroTermino) macroTermino = new Date(pdis[0].macroTermino);
  }

  // Buscar todos os eventos do programa do aluno
  // Se o aluno tem programId, buscar eventos do programa OU eventos sem programa (programId NULL)
  // Se o aluno não tem programId, buscar todos os eventos
  const dbEventsRaw = aluno.programId
    ? await db.select().from(events).where(
        or(eq(events.programId, aluno.programId), isNull(events.programId))
      )
    : await db.select().from(events);

  // Buscar participações do aluno
  const participations = await db.select()
    .from(eventParticipation)
    .where(eq(eventParticipation.alunoId, alunoId));

  const participationMap = new Map(participations.map(p => [p.eventId, p]));

  // Buscar webinars agendados para verificar endDate e youtubeLink
  const allScheduledWebinars = await db.select().from(scheduledWebinars);
  const allScheduledIds = new Set(allScheduledWebinars.map(w => w.id));
  const linkedWebinarId = (externalId?: string | null): number | null => {
    if (!externalId) return null;
    const match = externalId.match(/^sw-(\d+)$/);
    return match ? Number(match[1]) : null;
  };
  // Excluir eventos órfãos vinculados a webinars removidos
  // E também excluir eventos cujo webinar vinculado (sw-{id}) já tem outro evento na tabela
  // com título diferente (caso de edição de título do webinar)
  const swIdToDbEvent = new Map<number, typeof dbEventsRaw[0]>();
  for (const evt of dbEventsRaw) {
    const swId = linkedWebinarId(evt.externalId);
    if (swId) swIdToDbEvent.set(swId, evt);
  }

  // Mapear webinars ativos por data para detectar eventos com título antigo
  const activeWebinarByDate = new Map<string, typeof allScheduledWebinars[0]>();
  for (const sw of allScheduledWebinars) {
    if (sw.eventDate) {
      const dateStr = new Date(sw.eventDate).toISOString().split('T')[0];
      activeWebinarByDate.set(dateStr, sw);
    }
  }

  const dbEvents = dbEventsRaw.filter(evt => {
    const swId = linkedWebinarId(evt.externalId);
    // Remover eventos órfãos (sw-id sem webinar válido)
    if (swId) return allScheduledIds.has(swId);
    // Para eventos sem externalId (importados), verificar se existe webinar ativo
    // com mesma data mas título diferente — se sim, é um evento com título antigo, remover
    if (evt.eventDate && evt.title) {
      const dateStr = new Date(evt.eventDate).toISOString().split('T')[0];
      const activeWebinar = activeWebinarByDate.get(dateStr);
      if (activeWebinar && activeWebinar.title) {
        const evtNorm = evt.title.toLowerCase().trim().replace(/\s+/g, ' ');
        const swNorm = activeWebinar.title.toLowerCase().trim().replace(/\s+/g, ' ');
        // Se há webinar ativo nessa data com título diferente, este evento é o título antigo
        if (evtNorm !== swNorm && swIdToDbEvent.has(activeWebinar.id)) {
          return false; // remover duplicata com título antigo
        }
      }
    }
    return true;
  });

  // CORREÇÃO: Incluir scheduled_webinars (published/completed) que NÃO existem na tabela events
  // Isso garante que webinars agendados pelo admin apareçam para o aluno mesmo antes do upload de planilha
  const existingEventTitlesNorm = new Set(dbEvents.map(e => {
    if (!e.title) return '';
    return e.title.toLowerCase().trim()
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .replace(/\s*-\s*/g, ' - ')
      .trim();
  }));

  const syntheticEvents: typeof dbEvents = [];
  for (const sw of allScheduledWebinars) {
    // Só incluir webinars published ou completed
    if (sw.status !== 'published' && sw.status !== 'completed') continue;
    // Filtrar por programa do aluno (se o webinar tem programId, deve ser do mesmo programa; se NULL, é global)
    if (sw.programId && aluno.programId && sw.programId !== aluno.programId) continue;
    // Verificar se já existe na tabela events (por título normalizado)
    const swNorm = sw.title ? sw.title.toLowerCase().trim()
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .replace(/\s*-\s*/g, ' - ')
      .trim() : '';
    if (existingEventTitlesNorm.has(swNorm)) continue;
    // Criar evento sintético a partir do scheduled_webinar
    syntheticEvents.push({
      id: sw.id + 900000, // ID alto para não colidir com events reais
      externalId: `sw-${sw.id}`,
      title: sw.title,
      eventType: 'webinar',
      eventDate: sw.eventDate ? (sw.eventDate instanceof Date ? sw.eventDate.toISOString().split('T')[0] : String(sw.eventDate)) : null,
      videoLink: sw.youtubeLink || null,
      programId: sw.programId,
      trilhaId: null,
      createdAt: sw.createdAt,
    } as typeof dbEvents[0]);
  }

  // Mostrar TODOS os eventos (sem filtrar por macroInicio)
  // O campo dentroDoMacrociclo será usado pelo frontend para separar visualmente
  const allEvents = [...dbEvents, ...syntheticEvents];
  // Função de normalização de título para matching tolerante
  const normalizeTitle = (title: string | null): string => {
    if (!title) return '';
    return title
      .replace(
        /(?:,\s*|\s+-\s+)?com\s+(?:(?:a|o)\s+(?:palestrante|professor(?:a)?|mentor(?:a)?)\s+)?[A-ZÀ-Ý][\p{L}'’.\-]+(?:\s+[A-ZÀ-Ý][\p{L}'’.\-]+){0,6}\.?\s*$/u,
        ''
      )
      .toLowerCase()
      .replace(/[\u2013\u2014]/g, '-')  // Converter em-dash e en-dash para hífen
      .replace(/\s+/g, ' ')             // Normalizar espaços múltiplos
      .replace(/\s*-\s*/g, ' - ')       // Normalizar espaços ao redor de hífens
      .replace(/[.,;:!?]+$/g, '')       // Remover pontuação final variável
      .trim();
  };
  // Criar mapa com título normalizado
  
  // Função auxiliar para extrair o conteúdo principal do título
  const extractCore = (normalized: string): string => {
    return normalized
      .replace(/^(\d{4}\/\d+\s*-\s*)?(aula\s*\d+\s*-\s*)?/i, '')
      .replace(/\s*-\s*\d{1,2}\s*-\s*/g, ' - ')
      .replace(/[,.]?\s*(com|palestrante:)\s+.*$/i, '') // Normalização radical de palestrante
      .replace(/[.,!?;:"]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();
  };
  const scoreAlunoEvent = (evt: typeof allEvents[0]): number => {
    const part = participationMap.get(evt.id);
    const swId = linkedWebinarId(evt.externalId);
    const linkedToActiveWebinar = !!swId && allScheduledIds.has(swId) ? 1 : 0;
    const hasVideo = evt.videoLink ? 1 : 0;
    const hasParticipation = part ? 1 : 0;
    const isPresent = part?.status === 'presente' ? 1 : 0;
    const recency = evt.createdAt ? new Date(evt.createdAt).getTime() : 0;
    return linkedToActiveWebinar * 1000000 + hasVideo * 100000 + hasParticipation * 10000 + isPresent * 1000 + recency + evt.id;
  };

  // Criar mapa com título normalizado
  const webinarByTitle = new Map(allScheduledWebinars.map(w => [normalizeTitle(w.title), w]));
  const webinarByTitleNoPrefix = new Map<string, typeof allScheduledWebinars[0]>();
  for (const w of allScheduledWebinars) {
    const normalized = normalizeTitle(w.title);
    const core = extractCore(normalized);
    if (core) webinarByTitleNoPrefix.set(core, w);
  }
  const now = new Date();

  // DEDUPLICAR eventos por título normalizado + data
  // CORREÇÃO: Mapear TODOS os IDs que pertencem ao mesmo evento para consolidar a presença
  const seenCores = new Map<string, typeof allEvents[0]>();
  const coreToAllIds = new Map<string, number[]>();
  const deduplicatedEvents: typeof allEvents = [];

  for (const evt of allEvents) {
    const core = extractCore(normalizeTitle(evt.title));
    // CORREÇÃO: incluir data na chave para não colapsar eventos distintos do mesmo tema
    // (ex: Aula 01, 02, 03, 04 de "Resiliência e Proatividade" têm o mesmo core mas datas diferentes)
    const evtDateStr = evt.eventDate ? new Date(evt.eventDate).toISOString().split('T')[0] : 'nodate';
    const dedupKey = `${core}|${evtDateStr}`;
    
    if (!coreToAllIds.has(dedupKey)) coreToAllIds.set(dedupKey, []);
    coreToAllIds.get(dedupKey)!.push(evt.id);

    const existing = seenCores.get(dedupKey);
    if (!existing) {
      seenCores.set(dedupKey, evt);
      deduplicatedEvents.push(evt);
    } else {
      const existingPart = participationMap.get(existing.id);
      const currentPart = participationMap.get(evt.id);
      
      let preferCurrent = false;
      if (!existingPart && currentPart) {
        preferCurrent = true;
      } else if (!!existingPart === !!currentPart) {
        if (!existing.videoLink && evt.videoLink) {
          preferCurrent = true;
        } else if (!!existing.videoLink === !!evt.videoLink) {
          const existingIsSw = existing.externalId?.startsWith('sw-');
          const currentIsSw = evt.externalId?.startsWith('sw-');
          if (!existingIsSw && currentIsSw) {
            preferCurrent = true;
          } else if (existingIsSw === currentIsSw) {
            if (evt.createdAt && existing.createdAt && evt.createdAt > existing.createdAt) {
              preferCurrent = true;
            }
          }
        }
      }

      if (preferCurrent) {
        const idx = deduplicatedEvents.indexOf(existing);
        if (idx >= 0) deduplicatedEvents[idx] = evt;
        seenCores.set(dedupKey, evt);
      }
    }
  }

  // Mapear eventos para payload final com status de presença
  const mappedEvents = deduplicatedEvents.map(evt => {
    const core = extractCore(normalizeTitle(evt.title));
    const dedupKey = core;
    
    // CORREÇÃO DEFINITIVA: Buscar participação em QUALQUER evento que tenha o mesmo título base
    // Removemos a dependência da data para garantir que a presença marcada na "Aula 04" 
    // seja assumida por qualquer registro que o sistema identifique como "Aula 04".
    let part = participationMap.get(evt.id);
    
    if (!part || part.status !== 'presente') {
      for (const [pEventId, pRecord] of participationMap.entries()) {
        if (pRecord.status === 'presente') {
          const pEvent = allEvents.find(e => e.id === pEventId);
          if (pEvent) {
            const pCore = extractCore(normalizeTitle(pEvent.title));
            if (pCore === core) {
              part = pRecord;
              break;
            }
          }
        }
      }
    }
    // Tentar match exato normalizado primeiro, depois match parcial sem prefixo
    const normalizedEvtTitle = normalizeTitle(evt.title);
    let matchedWebinar = webinarByTitle.get(normalizedEvtTitle) || null;
    if (!matchedWebinar) {
      // Tentar sem prefixo "aula XX - " e sem "- 01 -" no meio
      const evtCore = extractCore(normalizedEvtTitle);
      matchedWebinar = webinarByTitleNoPrefix.get(evtCore) || null;
    }
    if (!matchedWebinar) {
      // Fallback: matching por similaridade de palavras-chave (>= 70% de palavras em comum)
      const evtCore = extractCore(normalizedEvtTitle);
      const evtWords = new Set(evtCore.split(/\s+/).filter(w => w.length > 2));
      let bestMatch: typeof allScheduledWebinars[0] | null = null;
      let bestScore = 0;
      for (const w of allScheduledWebinars) {
        if (!w.youtubeLink) continue;
        const wCore = extractCore(normalizeTitle(w.title));
        const wWords = new Set(wCore.split(/\s+/).filter(word => word.length > 2));
        let common = 0;
        Array.from(evtWords).forEach(word => {
          if (wWords.has(word)) common++;
        });
        const score = common / Math.max(evtWords.size, wWords.size);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = w;
        }
      }
      if (bestScore >= 0.7 && bestMatch) {
        matchedWebinar = bestMatch;
      }
    }
    const endDate = matchedWebinar?.endDate || matchedWebinar?.eventDate || evt.eventDate;
    const hasEnded = endDate ? new Date(endDate) < now : true;
    // Link do vídeo: prioridade para videoLink do evento, depois youtubeLink do webinar agendado
    const videoLink = evt.videoLink || matchedWebinar?.youtubeLink || null;
    const isPresent = part?.status === 'presente';
    const selfReported = !!part?.selfReportedAt;

    // Verificar se o evento está dentro do macrociclo do aluno (entre macroInicio e macroTermino)
    const evtDate = evt.eventDate ? new Date(evt.eventDate) : null;
    const dentroDoMacrociclo = macroInicio && evtDate
      ? evtDate >= macroInicio && (!macroTermino || evtDate <= macroTermino)
      : macroInicio
        ? (evtDate ? evtDate >= macroInicio : true)
        : true;

    const isFutureEvent = evt.eventDate ? new Date(evt.eventDate) > now : false;
    return {
      eventId: evt.id,
      scheduledWebinarId: matchedWebinar?.id || null,
      title: evt.title,
      eventType: evt.eventType || 'webinar',
      eventDate: evt.eventDate,
      videoLink,
      status: isPresent ? 'presente' : isFutureEvent ? 'pendente' : 'ausente',
      selfReported,
      reflexao: part?.reflexao || null,
      selfReportedAt: part?.selfReportedAt || null,
      hasEnded,
      dentroDoMacrociclo,
    };
  });

  // Deduplicação final:
  // 1) Se o evento está vinculado a um scheduled_webinar, usar esse vínculo como chave (elimina "fantasma" com mesmo webinar)
  // 2) Senão, fallback por título-base + data
  const sourceEventById = new Map(allEvents.map(evt => [evt.id, evt]));
  const finalByKey = new Map<string, typeof mappedEvents[0]>();
  const scoreFinal = (item: typeof mappedEvents[0]): number => {
    const isLinkedToActiveWebinar = !!item.scheduledWebinarId && allScheduledIds.has(item.scheduledWebinarId) ? 1 : 0;
    const hasParticipation = participationMap.has(item.eventId) ? 1 : 0;
    const isPresent = item.status === 'presente' ? 1 : 0;
    const hasVideo = item.videoLink ? 1 : 0;
    const sourceEvent = sourceEventById.get(item.eventId);
    const recency = sourceEvent?.createdAt ? new Date(sourceEvent.createdAt).getTime() : 0;
    return isLinkedToActiveWebinar * 1000000 + hasVideo * 100000 + hasParticipation * 10000 + isPresent * 1000 + recency + item.eventId;
  };

  for (const item of mappedEvents) {
    const dateStr = item.eventDate ? new Date(item.eventDate).toISOString().split('T')[0] : 'nodate';
    const fallbackCore = extractCore(normalizeTitle(item.title));
    const dedupKey = item.scheduledWebinarId
      ? `sw-${item.scheduledWebinarId}`
      : `${fallbackCore}|${dateStr}`;

    const existing = finalByKey.get(dedupKey);
    if (!existing) {
      finalByKey.set(dedupKey, item);
      continue;
    }
    if (scoreFinal(item) > scoreFinal(existing)) {
      finalByKey.set(dedupKey, item);
    }
  }

  return Array.from(finalByKey.values()).sort((a, b) => {
    // Ordenar por data decrescente (mais recentes primeiro)
    const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
    const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
    return dateB - dateA;
  });
}

/**
 * Buscar todas as reflexões dos alunos (para admin)
 */
export async function getWebinarReflections(eventId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [isNotNull(eventParticipation.reflexao)];
  if (eventId) {
    conditions.push(eq(eventParticipation.eventId, eventId));
  }

  const results = await db.select({
    id: eventParticipation.id,
    eventId: eventParticipation.eventId,
    alunoId: eventParticipation.alunoId,
    reflexao: eventParticipation.reflexao,
    selfReportedAt: eventParticipation.selfReportedAt,
    status: eventParticipation.status,
  })
    .from(eventParticipation)
    .where(and(...conditions))
    .orderBy(desc(eventParticipation.selfReportedAt));

  // Enriquecer com nomes
  const alunosList = await getAlunos();
  const alunoMap = new Map(alunosList.map(a => [a.id, a]));
  const eventsList = await db.select().from(events);
  const eventMap = new Map(eventsList.map(e => [e.id, e]));

  return results.map(r => ({
    ...r,
    alunoName: alunoMap.get(r.alunoId)?.name || 'Desconhecido',
    eventName: eventMap.get(r.eventId)?.title || 'Evento desconhecido',
  }));
}


/**
 * Atualizar o link de vídeo de um evento
 */
export async function updateEventVideoLink(eventId: number, videoLink: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(events).set({ videoLink }).where(eq(events.id, eventId));
}

/**
 * Buscar evento por ID
 */
export async function getEventById(eventId: number): Promise<Event | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  return result[0] || null;
}


// ============ CONTRATOS DO ALUNO ============

export async function createContrato(data: InsertContratoAluno) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(contratosAluno).values(data);
  return result.insertId;
}

export async function getContratosByAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contratosAluno)
    .where(and(eq(contratosAluno.alunoId, alunoId), eq(contratosAluno.isActive, 1)))
    .orderBy(desc(contratosAluno.createdAt));
}

export async function getContratoById(contratoId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(contratosAluno).where(eq(contratosAluno.id, contratoId)).limit(1);
  return result[0] || null;
}

export async function updateContrato(contratoId: number, data: Partial<InsertContratoAluno>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contratosAluno).set(data).where(eq(contratosAluno.id, contratoId));
}

/**
 * Propaga a alteração do término do contrato para toda a cadeia de datas do aluno:
 *   contratos_aluno.periodoTermino (fonte) → alunos.contratoFim (cópia)
 *   → assessment_pdi.macroTermino (macro jornadas ativas)
 *   → assessment_competencias.microTermino (micro jornadas)
 *
 * Regra: nenhuma macro/micro pode ultrapassar o período do contrato. Datas que
 * ultrapassam o novo término são encurtadas (clamp) para o novo término.
 * Datas que já terminam antes permanecem intactas.
 *
 * Bloqueia (throw) se existirem micro jornadas que INICIAM após o novo término,
 * pois encurtá-las geraria início > término — nesse caso a mentora precisa
 * ajustar ou remover essas competências do PDI antes.
 *
 * Contexto: criada após a antecipação manual da turma BS3 (jul/2026), quando a
 * ausência dessa propagação deixou macro/micros defasadas de contratos editados
 * individualmente (caso Ana Cássia, abr/2026).
 */
export async function propagarPeriodoContrato(alunoId: number, novoTermino: Date): Promise<{
  macrosAjustadas: number;
  microsAjustadas: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const terminoStr = novoTermino.toISOString().split('T')[0];
  const terminoDate = new Date(terminoStr + 'T00:00:00');

  // PDIs ativos do aluno
  const pdis = await db.select({ id: assessmentPdi.id })
    .from(assessmentPdi)
    .where(and(eq(assessmentPdi.alunoId, alunoId), eq(assessmentPdi.status, 'ativo')));
  const pdiIds = pdis.map(p => p.id);

  // Validação: micro jornadas que iniciam após o novo término bloqueiam a operação
  if (pdiIds.length > 0) {
    const conflitos = await db.select({
      id: assessmentCompetencias.id,
      microInicio: assessmentCompetencias.microInicio,
    }).from(assessmentCompetencias)
      .where(and(
        inArray(assessmentCompetencias.assessmentPdiId, pdiIds),
        sql`${assessmentCompetencias.microInicio} > ${terminoStr}`
      ));
    if (conflitos.length > 0) {
      throw new Error(
        `Não é possível definir o término do contrato em ${terminoStr}: ` +
        `${conflitos.length} micro jornada(s) do PDI iniciam após essa data. ` +
        `Ajuste ou remova essas competências no PDI antes de alterar o contrato.`
      );
    }
  }

  // 1. Sincronizar a cópia no cadastro do aluno
  await db.update(alunos)
    .set({ contratoFim: terminoDate })
    .where(eq(alunos.id, alunoId));

  let macrosAjustadas = 0;
  let microsAjustadas = 0;

  if (pdiIds.length > 0) {
    // 2. Encurtar macro jornadas ativas que ultrapassam o novo término
    const resMacro: any = await db.update(assessmentPdi)
      .set({ macroTermino: terminoDate })
      .where(and(
        inArray(assessmentPdi.id, pdiIds),
        sql`${assessmentPdi.macroTermino} > ${terminoStr}`
      ));
    macrosAjustadas = Number(resMacro?.[0]?.affectedRows ?? 0);

    // 3. Encurtar micro jornadas que ultrapassam o novo término
    const resMicro: any = await db.update(assessmentCompetencias)
      .set({ microTermino: terminoDate })
      .where(and(
        inArray(assessmentCompetencias.assessmentPdiId, pdiIds),
        sql`${assessmentCompetencias.microTermino} > ${terminoStr}`
      ));
    microsAjustadas = Number(resMicro?.[0]?.affectedRows ?? 0);
  }

  console.log(`[propagarPeriodoContrato] aluno ${alunoId} → término ${terminoStr}: ${macrosAjustadas} macro(s), ${microsAjustadas} micro(s) ajustadas`);
  return { macrosAjustadas, microsAjustadas };
}

export async function deleteContrato(contratoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contratosAluno).set({ isActive: 0 }).where(eq(contratosAluno.id, contratoId));
}

// ============ NÍVEIS DO CONTRATO ============

const CONTRATO_NIVEL_STATUS_EM_ANDAMENTO = "em_andamento" as const;
const CONTRATO_NIVEL_STATUS_ATIVOS = ["em_andamento", "fechamento", "ajustes"] as const;

export async function validarNivelEmAndamentoUnico(
  contratoId: number,
  alunoId: number,
  ignoreNivelId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return validarNivelEmAndamentoUnicoRepo({
    async findEmAndamento(repoContratoId, repoAlunoId, repoIgnoreNivelId) {
      const conditions = [
        eq(contratoNiveis.contratoId, repoContratoId),
        eq(contratoNiveis.alunoId, repoAlunoId),
        eq(contratoNiveis.status, CONTRATO_NIVEL_STATUS_EM_ANDAMENTO),
      ];
      if (repoIgnoreNivelId) {
        conditions.push(ne(contratoNiveis.id, repoIgnoreNivelId));
      }
      return db.select({ id: contratoNiveis.id }).from(contratoNiveis).where(and(...conditions)).limit(1);
    },
    async insertNivel() {
      throw new Error("Not implemented");
    },
    async listByAluno() {
      return [];
    },
    async listByContrato() {
      return [];
    },
    async findVigenteByAluno() {
      return null;
    },
  }, contratoId, alunoId, ignoreNivelId);
}

export async function createContratoNivel(data: InsertContratoNivel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return createContratoNivelRepo({
    async findEmAndamento(repoContratoId, repoAlunoId) {
      return db
        .select({ id: contratoNiveis.id })
        .from(contratoNiveis)
        .where(and(
          eq(contratoNiveis.contratoId, repoContratoId),
          eq(contratoNiveis.alunoId, repoAlunoId),
          eq(contratoNiveis.status, CONTRATO_NIVEL_STATUS_EM_ANDAMENTO),
        ))
        .limit(1);
    },
    async insertNivel(insertData) {
      const [result] = await db.insert(contratoNiveis).values(insertData);
      return result.insertId;
    },
    async listByAluno() {
      return [];
    },
    async listByContrato() {
      return [];
    },
    async findVigenteByAluno() {
      return null;
    },
  }, data);
}

/**
 * Sincroniza automaticamente o status dos níveis de um aluno baseado nas datas do contrato:
 * - nivelFim < hoje  → 'encerrado'
 * - nivelInicio <= hoje <= nivelFim  → 'em_andamento'
 * - nivelInicio > hoje  → 'planejado'
 * Não altera status 'certificado' nem registros sem datas definidas.
 */
export async function syncStatusNiveisPorData(alunoId: number): Promise<void> {
  const database = await getDb();
  if (!database) return;
  const rawConn = (database as any).$client.promise ? (database as any).$client.promise() : (database as any).$client;
  if (!rawConn) return;
  const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  try {
    // 1. Encerrar níveis com nivelFim antes de hoje (exceto certificado)
    await rawConn.execute(
      `UPDATE contrato_niveis
       SET status = 'encerrado', updatedAt = NOW()
       WHERE alunoId = ? AND nivelFim IS NOT NULL AND nivelFim < ?
         AND status NOT IN ('encerrado', 'certificado')`,
      [alunoId, hoje]
    );
    // 2. Ativar níveis cujo período cobre hoje (nivelInicio <= hoje <= nivelFim)
    await rawConn.execute(
      `UPDATE contrato_niveis
       SET status = 'em_andamento', updatedAt = NOW()
       WHERE alunoId = ? AND nivelInicio IS NOT NULL AND nivelFim IS NOT NULL
         AND nivelInicio <= ? AND nivelFim >= ?
         AND status NOT IN ('em_andamento', 'encerrado', 'certificado')`,
      [alunoId, hoje, hoje]
    );
  } catch (err) {
    console.warn('[DB] Aviso: erro ao sincronizar status de níveis por data:', err);
  }
}

export async function getContratoNiveisByAluno(alunoId: number): Promise<ContratoNivelComDatas[]> {
  // Sincronizar status baseado nas datas antes de retornar
  await syncStatusNiveisPorData(alunoId);
  const db = await getDb();
  if (!db) return [];
  // LEFT JOIN: alunos legados sem contratos_aluno também aparecem
  // Fallback de datas: usa assessment_pdi quando não há contrato formal
  const rows = await db
    .select({
      id: contratoNiveis.id,
      contratoId: contratoNiveis.contratoId,
      alunoId: contratoNiveis.alunoId,
      nivel: contratoNiveis.nivel,
      status: contratoNiveis.status,
      assessmentPdiId: contratoNiveis.assessmentPdiId,
      mentoraPrincipalId: contratoNiveis.mentoraPrincipalId,
      nivelInicio: contratoNiveis.nivelInicio,
      nivelFim: contratoNiveis.nivelFim,
      createdAt: contratoNiveis.createdAt,
      updatedAt: contratoNiveis.updatedAt,
      dataInicio: contratosAluno.periodoInicio,
      dataFim: contratosAluno.periodoTermino,
    })
    .from(contratoNiveis)
    .leftJoin(contratosAluno, eq(contratoNiveis.contratoId, contratosAluno.id))
    .where(eq(contratoNiveis.alunoId, alunoId))
    .orderBy(asc(contratoNiveis.id));

  // Prioridade de datas: nivelInicio/nivelFim > contrato geral > assessment_pdi
  const result: ContratoNivelComDatas[] = [];
  for (const row of rows) {
    // 1ª prioridade: datas específicas do nível (nivelInicio / nivelFim)
    if (row.nivelInicio && row.nivelFim) {
      result.push({
        ...row,
        dataInicio: row.nivelInicio,
        dataFim: row.nivelFim,
      } as ContratoNivelComDatas);
    } else if (row.dataInicio && row.dataFim) {
      // 2ª prioridade: datas do contrato geral do aluno
      result.push(row as ContratoNivelComDatas);
    } else {
      // 3ª prioridade (fallback): datas do assessment_pdi mais recente
      const assessments = await db
        .select({ macroInicio: assessmentPdi.macroInicio, macroTermino: assessmentPdi.macroTermino })
        .from(assessmentPdi)
        .where(eq(assessmentPdi.alunoId, alunoId))
        .orderBy(desc(assessmentPdi.createdAt))
        .limit(1);
      const ap = assessments[0];
      result.push({
        ...row,
        dataInicio: ap?.macroInicio ?? null,
        dataFim: ap?.macroTermino ?? null,
      } as ContratoNivelComDatas);
    }
  }
  return result;
}

export async function getContratoNiveisByContrato(contratoId: number): Promise<ContratoNivelComDatas[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: contratoNiveis.id,
      contratoId: contratoNiveis.contratoId,
      alunoId: contratoNiveis.alunoId,
      nivel: contratoNiveis.nivel,
      status: contratoNiveis.status,
      assessmentPdiId: contratoNiveis.assessmentPdiId,
      mentoraPrincipalId: contratoNiveis.mentoraPrincipalId,
      createdAt: contratoNiveis.createdAt,
      updatedAt: contratoNiveis.updatedAt,
      dataInicio: contratosAluno.periodoInicio,
      dataFim: contratosAluno.periodoTermino,
    })
    .from(contratoNiveis)
    .innerJoin(contratosAluno, eq(contratoNiveis.contratoId, contratosAluno.id))
    .where(eq(contratoNiveis.contratoId, contratoId))
    .orderBy(asc(contratosAluno.periodoInicio), asc(contratoNiveis.id));
  return rows as ContratoNivelComDatas[];
}

export async function getContratoNivelVigenteByAluno(alunoId: number): Promise<ContratoNivelComDatas | null> {
  const db = await getDb();
  if (!db) return null;
  const [nivelVigente] = await db
    .select({
      id: contratoNiveis.id,
      contratoId: contratoNiveis.contratoId,
      alunoId: contratoNiveis.alunoId,
      nivel: contratoNiveis.nivel,
      status: contratoNiveis.status,
      assessmentPdiId: contratoNiveis.assessmentPdiId,
      nivelInicio: contratoNiveis.nivelInicio,
      nivelFim: contratoNiveis.nivelFim,
      mentoraPrincipalId: contratoNiveis.mentoraPrincipalId,
      createdAt: contratoNiveis.createdAt,
      updatedAt: contratoNiveis.updatedAt,
      dataInicio: contratosAluno.periodoInicio,
      dataFim: contratosAluno.periodoTermino,
    })
    .from(contratoNiveis)
    .leftJoin(contratosAluno, eq(contratoNiveis.contratoId, contratosAluno.id))
    .where(and(
      eq(contratoNiveis.alunoId, alunoId),
      inArray(contratoNiveis.status, [...CONTRATO_NIVEL_STATUS_ATIVOS] as any),
    ))
    .orderBy(desc(contratoNiveis.id))
    .limit(1);
  if (!nivelVigente) return null;
  // Serializar nivelInicio e nivelFim como strings YYYY-MM-DD (evitar Date objects via superjson)
  const toDateStr = (v: any): string | null => {
    if (!v) return null;
    if (typeof v === 'string') return v.includes('T') ? v.split('T')[0] : v;
    if (v instanceof Date) return v.toISOString().split('T')[0];
    return String(v);
  };
  const nivelInicioStr = toDateStr(nivelVigente.nivelInicio);
  const nivelFimStr = toDateStr(nivelVigente.nivelFim);
  // Fallback de datas para alunos legados sem contratos_aluno
  if (!nivelVigente.dataInicio || !nivelVigente.dataFim) {
    const [ap] = await db
      .select({ macroInicio: assessmentPdi.macroInicio, macroTermino: assessmentPdi.macroTermino })
      .from(assessmentPdi)
      .where(eq(assessmentPdi.alunoId, alunoId))
      .orderBy(desc(assessmentPdi.createdAt))
      .limit(1);
    return {
      ...nivelVigente,
      nivelInicio: nivelInicioStr,
      nivelFim: nivelFimStr,
      dataInicio: ap?.macroInicio ?? null,
      dataFim: ap?.macroTermino ?? null,
    } as ContratoNivelComDatas;
  }
  return {
    ...nivelVigente,
    nivelInicio: nivelInicioStr,
    nivelFim: nivelFimStr,
  } as ContratoNivelComDatas;
}

export async function getContratoNivelComStatusOperacional(
  alunoId: number,
  contratoNivelId?: number | null
): Promise<(ContratoNivelComDatas & { statusOperacional: "em_andamento" | "fechamento" | "ajustes" | "encerrado" }) | null> {
  const db = await getDb();
  if (!db) return null;

  let nivel: ContratoNivelComDatas | null = null;
  if (contratoNivelId) {
    const [row] = await db
      .select({
        id: contratoNiveis.id,
        contratoId: contratoNiveis.contratoId,
        alunoId: contratoNiveis.alunoId,
        nivel: contratoNiveis.nivel,
        status: contratoNiveis.status,
        assessmentPdiId: contratoNiveis.assessmentPdiId,
        mentoraPrincipalId: contratoNiveis.mentoraPrincipalId,
        createdAt: contratoNiveis.createdAt,
        updatedAt: contratoNiveis.updatedAt,
        dataInicio: contratosAluno.periodoInicio,
        dataFim: contratosAluno.periodoTermino,
      })
      .from(contratoNiveis)
      .leftJoin(contratosAluno, eq(contratoNiveis.contratoId, contratosAluno.id))
      .where(eq(contratoNiveis.id, contratoNivelId))
      .limit(1);
    if (row) {
      // Fallback de datas para alunos legados sem contratos_aluno
      if (!row.dataInicio || !row.dataFim) {
        const [ap] = await db
          .select({ macroInicio: assessmentPdi.macroInicio, macroTermino: assessmentPdi.macroTermino })
          .from(assessmentPdi)
          .where(eq(assessmentPdi.alunoId, alunoId))
          .orderBy(desc(assessmentPdi.createdAt))
          .limit(1);
        nivel = {
          ...row,
          dataInicio: ap?.macroInicio ?? null,
          dataFim: ap?.macroTermino ?? null,
        } as ContratoNivelComDatas;
      } else {
        nivel = row as ContratoNivelComDatas;
      }
    }
  } else {
    nivel = await getContratoNivelVigenteByAluno(alunoId);
  }

  if (!nivel) return null;

  const statusOperacional = getContratoNivelOperationalStatus(nivel);

  // Sincroniza status no banco de forma idempotente
  if (nivel.status !== statusOperacional) {
    await db.update(contratoNiveis)
      .set({ status: statusOperacional as any })
      .where(eq(contratoNiveis.id, nivel.id));
  }

  return {
    ...nivel,
    status: statusOperacional as any,
    statusOperacional,
  };
}

export async function isContratoNivelBloqueado(alunoId: number, contratoNivelId?: number | null): Promise<boolean> {
  const nivel = await getContratoNivelComStatusOperacional(alunoId, contratoNivelId);
  if (!nivel) return false;
  return isContratoNivelBloqueadoParaNovasAtribuicoes(nivel.statusOperacional);
}

export async function isContratoNivelEncerradoDb(alunoId: number, contratoNivelId?: number | null): Promise<boolean> {
  const nivel = await getContratoNivelComStatusOperacional(alunoId, contratoNivelId);
  if (!nivel) return false;
  return isContratoNivelEncerrado(nivel.statusOperacional);
}

export async function assertNivelPermiteNovasAtribuicoes(
  alunoId: number,
  contratoNivelId: number | null | undefined,
  operacao: string
): Promise<void> {
  const nivel = await getContratoNivelComStatusOperacional(alunoId, contratoNivelId);
  if (!nivel) return;
  if (isContratoNivelBloqueadoParaNovasAtribuicoes(nivel.statusOperacional)) {
    throw new Error(
      `Operação bloqueada (${operacao}): nível ${nivel.nivel} em status ${nivel.statusOperacional}.`
    );
  }
}

/**
 * Lista os macrociclos REAIS do aluno. Prioriza a fonte mais confiável disponível:
 *
 *  1) Se o aluno já passou por reset(s) formal(is) (arquivarCicloAtual): usa as
 *     datas de reset gravadas em auditoria_resets_ciclo como fronteira entre
 *     ciclos — mesma fonte que as abas Evolução e Performance já usam pra
 *     "ciclo congelado" vs "ciclo atual", só que estendida pra todo o histórico.
 *  2) Se o aluno nunca foi resetado (turmas legadas, ainda não migradas pro
 *     fluxo novo): usa os níveis (contrato_niveis) como unidade, com o período
 *     de cada um resolvido via resolverSnapshotEDatasDoNivel (nivelInicio/Fim,
 *     com fallback pro PDI vinculado).
 */
export async function getMacrociclosByAluno(alunoId: number) {
  const database = await getDb();
  if (!database) return [];

  const resets = await getAuditoriaResets({ alunoId, limit: 100 });

  if (resets.length > 0) {
    const resetsAsc = [...resets].reverse();
    const todosNiveis = await getContratoNiveisByAluno(alunoId);
    const ORDEM_NIVEL: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
    const niveisAsc = [...todosNiveis].sort(
      (a: any, b: any) => (ORDEM_NIVEL[a.nivel] ?? 99) - (ORDEM_NIVEL[b.nivel] ?? 99)
    );

    const macrociclos: any[] = [];
    let inicio: any = null;
    resetsAsc.forEach((r: any, idx: number) => {
      macrociclos.push({
        chave: `historico:${r.historicoId}`,
        origem: "reset",
        historicoId: r.historicoId,
        numeroCiclo: r.numeroCicloArquivado,
        dataInicio: inicio,
        dataFim: r.criadoEm,
        status: "encerrado",
        contratoNivelId: niveisAsc[idx]?.id ?? null,
        nivelLabel: niveisAsc[idx]?.nivel ?? null,
      });
      inicio = r.criadoEm;
    });

    // O próximo nível na sequência pode já estar com status "encerrado" no
    // contrato SEM nunca ter passado pelo reset formal (ex.: encerrado por
    // outro processo, como o congelamento por turma) — nesse caso não é o
    // "ciclo atual em andamento", é um nível fechado que ainda não tem
    // arquivamento/snapshot. Tratar como "ativo" faria a tela escondê-lo
    // como se ainda estivesse em progresso, quando na verdade só falta
    // arquivar. Reflete o status real do contrato em vez de assumir.
    const ultimoNumero = resetsAsc[resetsAsc.length - 1]?.numeroCicloArquivado ?? 0;
    const proximoNivel = niveisAsc[resetsAsc.length];
    const proximoRealmenteEncerrado = proximoNivel && proximoNivel.status === "encerrado";
    macrociclos.push({
      chave: "atual",
      origem: proximoRealmenteEncerrado ? "encerrado-sem-arquivamento" : "reset",
      historicoId: null,
      numeroCiclo: ultimoNumero + 1,
      dataInicio: inicio,
      dataFim: null,
      status: proximoRealmenteEncerrado ? "encerrado" : "ativo",
      contratoNivelId: proximoNivel?.id ?? null,
      nivelLabel: proximoNivel?.nivel ?? null,
    });
    return macrociclos;
  }

  // Aluno nunca passou pelo reset formal: não existe fronteira real entre
  // "níveis" ainda, então não faz sentido fingir que são macrociclos separados
  // — mostra só o progresso atual (vira card único "Progresso Atual" na tela).
  const nivelVigente = await getContratoNivelVigenteByAluno(alunoId);
  return [{
    chave: "atual",
    origem: "sem-reset",
    historicoId: null,
    numeroCiclo: 1,
    dataInicio: null,
    dataFim: null,
    status: "ativo",
    contratoNivelId: nivelVigente?.id ?? null,
    nivelLabel: nivelVigente?.nivel ?? null,
  }];
}

export type MacrocicloAluno = Awaited<ReturnType<typeof getMacrociclosByAluno>>[number];

/**
 * Resolve só a tabela de competências (nota x meta) de um macrociclo — os
 * indicadores agregados (engajamento, desafios etc.) não são mais calculados
 * aqui: para o ciclo atual a tela usa indicadores.meuDashboard, e para ciclos
 * congelados usa indicadores.meuDashboardCongelado — ambos endpoints já
 * testados e usados por /performance e /evolucao, mais confiáveis que um
 * recálculo próprio.
 */
export async function getPedagogiaPorMacrociclo(alunoId: number, macrociclo: MacrocicloAluno) {
  const database = await getDb();
  if (!database) return null;

  // Nota real por competência vem de student_performance (a mesma fonte do
  // Indicador 2 "Avaliações" em /performance) — casada pelo CÓDIGO da
  // competência (não o id numérico) e pelo externalId do aluno. Busca uma vez
  // só aqui e reaproveita pra todos os PDIs deste macrociclo.
  const [alunoRow] = await database.select().from(alunos).where(eq(alunos.id, alunoId)).limit(1);
  const idUsuarioAluno = alunoRow?.externalId || String(alunoId);
  const compIdToCodigoMap = await getCompIdToCodigoMap();
  const [perfStudentPerformance, perfAtividadeFallback] = await Promise.all([
    getStudentPerformanceAsRecords(),
    getAlunoAtividadePerformanceAsRecords(),
  ]);
  const performanceDoAluno = [...perfStudentPerformance, ...perfAtividadeFallback]
    .filter((p) => p.idUsuario === idUsuarioAluno);

  // Ciclo congelado: um reset pode congelar VÁRIOS PDIs de uma vez (uma trilha
  // por competência básica, por exemplo) — não só o PDI referenciado no
  // snapshot. Busca todos os PDIs congelados dentro da janela deste reset
  // (mesmo macroTermino do reset, e depois do reset anterior, se houver) e
  // soma as competências de todos.
  if (macrociclo.origem === "reset" && macrociclo.status === "encerrado" && macrociclo.historicoId) {
    // Compara só a DATA (não a hora exata) — macroTermino é um campo de data,
    // e o reset tem timestamp com hora; comparar timestamps completos excluía
    // sistematicamente os PDIs certos (fim do dia do PDI sempre > hora exata do reset).
    const dataFimDia = macrociclo.dataFim ? String(macrociclo.dataFim).slice(0, 10) : null;
    const dataInicioDia = macrociclo.dataInicio ? String(macrociclo.dataInicio).slice(0, 10) : null;

    const pdisCongelados = await database.select().from(assessmentPdi).where(
      and(eq(assessmentPdi.alunoId, alunoId), eq(assessmentPdi.status, "congelado"))
    );
    const pdisDesteReset = pdisCongelados.filter((p) => {
      if (!p.macroTermino) return false;
      const terminoDia = String(p.macroTermino).slice(0, 10);
      if (dataFimDia && terminoDia > dataFimDia) return false;
      if (dataInicioDia && terminoDia <= dataInicioDia) return false;
      return true;
    });

    if (pdisDesteReset.length > 0) {
      const competenciasPorPdi = await Promise.all(
        pdisDesteReset.map((p) => resolverCompetenciasDoPdi(database, p.id, alunoId, compIdToCodigoMap, performanceDoAluno))
      );
      return { competencias: competenciasPorPdi.flat() };
    }

    // Fallback: nenhum PDI encontrado pela janela de datas (dados antigos sem
    // macroTermino consistente) — usa ao menos o PDI referenciado no snapshot.
    const [snapRows]: any = await database.execute(sql.raw(
      `SELECT assessmentPdiId FROM historico_ciclos_aluno WHERE id = ${macrociclo.historicoId} LIMIT 1`
    ));
    const snapshot = Array.isArray(snapRows) && snapRows[0] ? snapRows[0] : null;
    if (snapshot?.assessmentPdiId) {
      return { competencias: await resolverCompetenciasDoPdi(database, snapshot.assessmentPdiId, alunoId, compIdToCodigoMap, performanceDoAluno) };
    }
    return { competencias: [] };
  }

  // Ciclo atual (ou legado sem reset): competências do PDI vinculado ao nível
  // deste macrociclo, ou o PDI ativo do aluno como último recurso.
  let pdiId: number | null = null;
  if (macrociclo.contratoNivelId) {
    const nivelBruto = await getContratoNivelBruto(macrociclo.contratoNivelId);
    if (nivelBruto) {
      const resolvido = await resolverSnapshotEDatasDoNivel(alunoId, nivelBruto);
      pdiId = resolvido.pdi?.id ?? null;
    }
  }
  if (!pdiId) {
    const [ativo] = await database.select().from(assessmentPdi)
      .where(and(eq(assessmentPdi.alunoId, alunoId), eq(assessmentPdi.status, "ativo")))
      .orderBy(desc(assessmentPdi.createdAt))
      .limit(1);
    pdiId = ativo?.id ?? null;
  }

  return { competencias: pdiId ? await resolverCompetenciasDoPdi(database, pdiId, alunoId, compIdToCodigoMap, performanceDoAluno) : [] };
}

/**
 * Busca as competências de um PDI (assessment_competencias) com nome, meta e
 * nota resolvidos. A nota real vem de student_performance (mesma fonte do
 * Indicador 2 em /performance), casada por CÓDIGO de competência — nunca por
 * assessment_competencias.nivelAtual, que fica sempre vazio nesse fluxo. Se
 * não encontrar a nota em lugar nenhum, retorna null (a tela não deve inventar
 * ou mostrar valor de outro campo no lugar).
 */
async function resolverCompetenciasDoPdi(
  database: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  assessmentPdiId: number,
  alunoId: number,
  compIdToCodigoMap: Map<number, string>,
  performanceDoAluno: Awaited<ReturnType<typeof getStudentPerformanceAsRecords>>
) {
  const compsPdi = await database.select().from(assessmentCompetencias)
    .where(eq(assessmentCompetencias.assessmentPdiId, assessmentPdiId));
  const compIds = compsPdi.map((c) => c.competenciaId);
  const catalogo = compIds.length > 0
    ? await database.select().from(competencias).where(inArray(competencias.id, compIds))
    : [];
  const nomeById = new Map(catalogo.map((c) => [c.id, c.nome]));

  // Meta real: plano_individual (metaNota) quando existir; senão o padrão da plataforma (7.0).
  const planoDoAluno = compIds.length > 0
    ? await database.select().from(planoIndividual).where(
        and(eq(planoIndividual.alunoId, alunoId), inArray(planoIndividual.competenciaId, compIds))
      )
    : [];
  const planoPorCompetencia = new Map<number, typeof planoDoAluno[number]>();
  for (const p of planoDoAluno) {
    const atual = planoPorCompetencia.get(p.competenciaId);
    if (!atual || (p.id ?? 0) > (atual.id ?? 0)) planoPorCompetencia.set(p.competenciaId, p);
  }

  return compsPdi.map((c) => {
    const plano = planoPorCompetencia.get(c.competenciaId);

    // Nota obtida: só de student_performance, casada pelo código externo da
    // competência. -1 no notaAvaliacao significa "não cursou" — trata como
    // sem nota, igual a não encontrar registro nenhum.
    const codigo = compIdToCodigoMap.get(c.competenciaId);
    const perf = codigo
      ? performanceDoAluno.find((p) =>
          p.idCompetencia === codigo ||
          p.idCompetencia?.toLowerCase?.() === codigo.toLowerCase()
        )
      : undefined;
    const nota = perf && perf.notaAvaliacao !== undefined && perf.notaAvaliacao >= 0
      ? Number(perf.notaAvaliacao)
      : null;

    const meta = plano?.metaNota !== null && plano?.metaNota !== undefined
      ? Number(plano.metaNota)
      : (c.metaFinal !== null && c.metaFinal !== undefined ? Number(c.metaFinal) : 7);

    return {
      competenciaId: c.competenciaId,
      competenciaNome: nomeById.get(c.competenciaId) || null,
      obrigatoria: c.peso === "obrigatoria",
      nota,
      meta,
    };
  });
}

export async function getPedagogiaByNivel(alunoId: number, contratoNivelId?: number | null) {
  const nivelVigente = contratoNivelId
    ? null
    : await getContratoNivelVigenteByAluno(alunoId);
  const nivelId = contratoNivelId ?? nivelVigente?.id ?? null;

  let [assessments, plano, metasNivel, mentorias, participacoes, cases, performance] = await Promise.all([
    getAssessmentsByAlunoAndNivel(alunoId, nivelId),
    getPlanoIndividualByAlunoAndNivel(alunoId, nivelId),
    getMetasDetalhadasByNivel(alunoId, nivelId),
    getMentoringSessionsByAlunoAndNivel(alunoId, nivelId),
    getEventParticipationByAlunoAndNivel(alunoId, nivelId),
    getCasesSucessoByAlunoAndNivel(alunoId, nivelId),
    getStudentPerformanceByAlunoAndNivel(alunoId, nivelId),
  ]);
  let dadosNaoSegmentadosPorNivel = false;

  // Fallback para alunos legados (turmas anteriores ao sistema de contrato_niveis):
  // os registros deles nunca ganharam o vínculo contratoNivelId, então a busca
  // escopada acima volta vazia mesmo quando existe desempenho real. Se o nível
  // não trouxe NENHUM dado vinculado e o aluno só tem um nível registrado (ou seja,
  // toda a jornada dele é esse único nível), busca sem o filtro de nível.
  const semDadosVinculados = plano.length === 0 && metasNivel.length === 0 &&
    participacoes.length === 0 && cases.length === 0 && mentorias.length === 0;

  if (nivelId && semDadosVinculados) {
    const todosNiveis = await getContratoNiveisByAluno(alunoId);
    if (todosNiveis.length <= 1) {
      [assessments, plano, metasNivel, mentorias, participacoes, cases, performance] = await Promise.all([
        getAssessmentsByAlunoAndNivel(alunoId, null),
        getPlanoIndividualByAlunoAndNivel(alunoId, null),
        getMetasDetalhadasByNivel(alunoId, null),
        getMentoringSessionsByAlunoAndNivel(alunoId, null),
        getEventParticipationByAlunoAndNivel(alunoId, null),
        getCasesSucessoByAlunoAndNivel(alunoId, null),
        getStudentPerformanceByAlunoAndNivel(alunoId, null),
      ]);
    } else {
      // Aluno com múltiplos níveis, nenhum deles com vínculo de FK (ex.: turmas
      // migradas que já têm o histórico de níveis recriado, mas nunca tiveram os
      // dados taggeados por nível). Aqui não dá pra simplesmente remover o filtro
      // (misturaria os 4 níveis num só) — em vez disso, separa por PERÍODO, usando
      // as datas do próprio nível (nivelInicio/nivelFim), do mesmo jeito que o
      // resto do sistema já faz pra "macrociclo" quando não há vínculo direto.
      const nivelBruto = await getContratoNivelBruto(nivelId);
      const { dataInicio: periodoInicio, dataFim: periodoFim } = nivelBruto
        ? await resolverSnapshotEDatasDoNivel(alunoId, nivelBruto)
        : { dataInicio: null, dataFim: null };
      if (periodoInicio && periodoFim) {
        const inicio = new Date(`${String(periodoInicio).slice(0, 10)}T00:00:00`);
        const fim = new Date(`${String(periodoFim).slice(0, 10)}T23:59:59`);
        const dentroDoPeriodo = (valor: any): boolean => {
          if (!valor) return false;
          const dt = new Date(valor);
          return !Number.isNaN(dt.getTime()) && dt >= inicio && dt <= fim;
        };

        const [assessmentsAll, planoAll, metasAll, mentoriasAll, participacoesAll, casesAll, performanceAll] = await Promise.all([
          getAssessmentsByAlunoAndNivel(alunoId, null),
          getPlanoIndividualByAlunoAndNivel(alunoId, null),
          getMetasDetalhadasByNivel(alunoId, null),
          getMentoringSessionsByAlunoAndNivel(alunoId, null),
          getEventParticipationByAlunoAndNivel(alunoId, null),
          getCasesSucessoByAlunoAndNivel(alunoId, null),
          getStudentPerformanceByAlunoAndNivel(alunoId, null),
        ]);

        const planoFiltrado = planoAll.filter((p: any) => dentroDoPeriodo(p.createdAt));
        const metasFiltradas = metasAll.filter((m: any) => dentroDoPeriodo(m.createdAt));
        const mentoriasFiltradas = mentoriasAll.filter((s: any) => dentroDoPeriodo(s.sessionDate));
        const participacoesFiltradas = participacoesAll.filter((e: any) => dentroDoPeriodo(e.selfReportedAt || e.createdAt));
        const casesFiltrados = casesAll.filter((c: any) => dentroDoPeriodo(c.dataEntrega));
        const performanceFiltrada = performanceAll.filter((p: any) => dentroDoPeriodo(p.dataConclusao || p.dataInicio));

        const filtroPorDataFuncionou = planoFiltrado.length > 0 || metasFiltradas.length > 0 ||
          mentoriasFiltradas.length > 0 || participacoesFiltradas.length > 0 || casesFiltrados.length > 0;

        if (filtroPorDataFuncionou) {
          // Datas dos registros batem com o período do nível — usa o recorte certo.
          assessments = assessmentsAll;
          plano = planoFiltrado;
          metasNivel = metasFiltradas;
          mentorias = mentoriasFiltradas;
          participacoes = participacoesFiltradas;
          cases = casesFiltrados;
          performance = performanceFiltrada;
        } else {
          // Segunda camada de segurança: as datas dos registros não batem com o
          // período do nível (ex.: dados migrados com data genérica de importação,
          // não a data real). Em vez de deixar a tela zerada sem explicação, mostra
          // o histórico completo do aluno e sinaliza para o front que não foi
          // possível segmentar por nível — melhor mostrar dado real "não separado"
          // do que uma tela vazia e enganosa.
          dadosNaoSegmentadosPorNivel = true;
          assessments = assessmentsAll;
          plano = planoAll;
          metasNivel = metasAll;
          mentorias = mentoriasAll;
          participacoes = participacoesAll;
          cases = casesAll;
          performance = performanceAll;
        }
      }
    }
  }

  return {
    contratoNivelId: nivelId,
    dadosNaoSegmentadosPorNivel,
    assessments,
    competencias: assessments.flatMap((a: any) => a.competencias || []),
    planoIndividual: plano,
    metas: metasNivel,
    mentoringSessions: mentorias,
    eventParticipation: participacoes,
    casesSucesso: cases,
    studentPerformance: performance,
  };
}

// ============ SALDO DE SESSÕES ============

export async function getSaldoSessoes(alunoId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Buscar contrato ativo do aluno
  const contratos = await db.select().from(contratosAluno)
    .where(and(eq(contratosAluno.alunoId, alunoId), eq(contratosAluno.isActive, 1)))
    .orderBy(desc(contratosAluno.createdAt))
    .limit(1);
  
  if (contratos.length === 0) return null;
  const contrato = contratos[0];
  
  // Contar sessões realizadas (excluindo assessment)
  const sessoes = await db.select({ count: sql<number>`COUNT(*)` })
    .from(mentoringSessions)
    .where(and(
      eq(mentoringSessions.alunoId, alunoId),
      eq(mentoringSessions.isAssessment, 0),
      eq(mentoringSessions.presence, "presente")
    ));
  
  const sessoesRealizadas = sessoes[0]?.count || 0;
  const totalContratadas = contrato.totalSessoesContratadas;
  const saldoRestante = totalContratadas - sessoesRealizadas;
  
  return {
    contrato,
    totalContratadas,
    sessoesRealizadas,
    saldoRestante,
    percentualUsado: totalContratadas > 0 ? Math.round((sessoesRealizadas / totalContratadas) * 100) : 0
  };
}

// ============ ATUALIZAÇÃO DE NÍVEL DE COMPETÊNCIA ============

export async function updateNivelCompetencia(
  assessmentCompetenciaId: number,
  nivelNovo: number,
  atualizadoPor: number,
  sessaoReferencia?: number,
  observacao?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar nível atual para registrar no histórico
  const [comp] = await db.select().from(assessmentCompetencias)
    .where(eq(assessmentCompetencias.id, assessmentCompetenciaId))
    .limit(1);
  
  if (!comp) throw new Error("Competência não encontrada");
  
  const nivelAnterior = comp.nivelAtual ? parseFloat(comp.nivelAtual) : null;
  
  // Atualizar nível atual na competência
  await db.update(assessmentCompetencias)
    .set({ nivelAtual: String(nivelNovo) })
    .where(eq(assessmentCompetencias.id, assessmentCompetenciaId));
  
  // Buscar alunoId do PDI associado
  const [pdi] = await db.select({ alunoId: assessmentPdi.alunoId })
    .from(assessmentPdi)
    .where(eq(assessmentPdi.id, comp.assessmentPdiId))
    .limit(1);
  
  const alunoId = pdi?.alunoId || 0;
  
  // Registrar no histórico
  await db.insert(historicoNivelCompetencia).values({
    assessmentCompetenciaId,
    alunoId,
    nivelAnterior: nivelAnterior !== null ? String(nivelAnterior) : null,
    nivelNovo: String(nivelNovo),
    atualizadoPor,
    sessaoReferencia: sessaoReferencia || null,
    observacao: observacao || null,
  });
}

export async function setMetaFinalCompetencia(
  assessmentCompetenciaId: number,
  metaFinal: number,
  justificativa?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { metaFinal: String(metaFinal) };
  if (justificativa !== undefined) {
    updateData.justificativa = justificativa;
  }
  
  await db.update(assessmentCompetencias)
    .set(updateData)
    .where(eq(assessmentCompetencias.id, assessmentCompetenciaId));
}

export async function getHistoricoNivel(assessmentCompetenciaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(historicoNivelCompetencia)
    .where(eq(historicoNivelCompetencia.assessmentCompetenciaId, assessmentCompetenciaId))
    .orderBy(historicoNivelCompetencia.createdAt);
}

export async function getHistoricoNivelByAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(historicoNivelCompetencia)
    .where(eq(historicoNivelCompetencia.alunoId, alunoId))
    .orderBy(desc(historicoNivelCompetencia.createdAt));
}

// ============ JORNADA COMPLETA DO ALUNO (Contrato + Macro + Micro) ============

export async function getJornadaCompleta(alunoId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // 1. Buscar contrato ativo
  const contratos = await db.select().from(contratosAluno)
    .where(and(eq(contratosAluno.alunoId, alunoId), eq(contratosAluno.isActive, 1)))
    .orderBy(desc(contratosAluno.createdAt))
    .limit(1);
  
  const contratoRaw = contratos[0] || null;
  
  // Buscar dados do aluno para enriquecer contrato
  const alunoRow = await db.select({
    tipoMentoria: alunos.tipoMentoria,
    totalSessoesContratadas: alunos.totalSessoesContratadas,
    contratoInicio: alunos.contratoInicio,
    contratoFim: alunos.contratoFim,
  }).from(alunos).where(eq(alunos.id, alunoId)).limit(1);
  const alunoData2 = alunoRow[0];
  
  // Enriquecer contrato com tipoMentoria do aluno
  // Se não tem contrato na tabela contratos_aluno, criar um contrato virtual com dados do aluno
  let contrato: (typeof contratoRaw & { tipoMentoria?: string | null }) | null = contratoRaw;
  if (contrato) {
    contrato = { ...contrato, tipoMentoria: alunoData2?.tipoMentoria || 'individual' };
  } else if (alunoData2 && (alunoData2.contratoInicio || alunoData2.contratoFim || (alunoData2.totalSessoesContratadas && alunoData2.totalSessoesContratadas > 0))) {
    // Fallback: criar contrato virtual a partir dos dados inline do aluno
    // Cria quando tem datas de contrato OU totalSessoesContratadas > 0
    contrato = {
      id: 0,
      alunoId,
      programId: 0,
      turmaId: null,
      periodoInicio: alunoData2.contratoInicio ? new Date(alunoData2.contratoInicio).toISOString().split('T')[0] : null,
      periodoTermino: alunoData2.contratoFim ? new Date(alunoData2.contratoFim).toISOString().split('T')[0] : null,
      totalSessoesContratadas: alunoData2.totalSessoesContratadas || 0,
      observacoes: null,
      criadoPor: null,
      isActive: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      tipoMentoria: alunoData2.tipoMentoria || 'individual',
    } as any;
  }
  
  // 2. Buscar PDIs (Macro Jornadas) do aluno
  const pdis = await db.select().from(assessmentPdi)
    .where(eq(assessmentPdi.alunoId, alunoId))
    .orderBy(desc(assessmentPdi.createdAt));
  
  if (pdis.length === 0) {
    return { contrato, macroJornadas: [], saldo: null };
  }
  
  // 3. Buscar competências (Micro Jornadas) de todos os PDIs
  const pdiIds = pdis.map(p => p.id);
  const allComps = await db.select().from(assessmentCompetencias)
    .where(sql`${assessmentCompetencias.assessmentPdiId} IN (${sql.join(pdiIds.map(id => sql`${id}`), sql`, `)})`);
  
  // 4. Buscar nomes das trilhas
  const trilhaIds = Array.from(new Set(pdis.map(p => p.trilhaId).filter(Boolean))) as number[];
  let trilhaMap: Record<number, string> = {};
  if (trilhaIds.length > 0) {
    const trilhasList = await db.select().from(trilhas)
      .where(sql`${trilhas.id} IN (${sql.join(trilhaIds.map(id => sql`${id}`), sql`, `)})`);
    trilhaMap = Object.fromEntries(trilhasList.map(t => [t.id, t.name]));
  }
  
  // 5. Buscar nomes das competências
  const compIds = Array.from(new Set(allComps.map(c => c.competenciaId))) as number[];
  let compMap: Record<number, { nome: string; trilhaId: number | null }> = {};
  if (compIds.length > 0) {
    const compsList = await db.select().from(competencias)
      .where(sql`${competencias.id} IN (${sql.join(compIds.map(id => sql`${id}`), sql`, `)})`);
    compMap = Object.fromEntries(compsList.map(c => [c.id, { nome: c.nome, trilhaId: c.trilhaId }]));
  }
  
  // 6. Buscar saldo de sessões
  let saldo = null;
  if (contrato) {
    const sessoes = await db.select({ count: sql<number>`COUNT(*)` })
      .from(mentoringSessions)
      .where(and(
        eq(mentoringSessions.alunoId, alunoId),
        eq(mentoringSessions.isAssessment, 0),
        eq(mentoringSessions.presence, "presente")
      ));
    
    const sessoesRealizadas = sessoes[0]?.count || 0;
    saldo = {
      totalContratadas: contrato.totalSessoesContratadas,
      sessoesRealizadas,
      saldoRestante: contrato.totalSessoesContratadas - sessoesRealizadas,
      percentualUsado: contrato.totalSessoesContratadas > 0 
        ? Math.round((sessoesRealizadas / contrato.totalSessoesContratadas) * 100) : 0
    };
  }
  
  // 6.5. Buscar dados de performance da plataforma (student_performance) para enriquecer a jornada
  // Primeiro buscar o aluno para pegar o externalId
  const alunoData = await db.select().from(alunos).where(eq(alunos.id, alunoId)).limit(1);
  const alunoExternalId = alunoData[0]?.externalId || null;
  
  // Buscar codigoIntegracao das competências
  let compCodigoMap: Record<number, string> = {};
  if (compIds.length > 0) {
    const compsWithCodigo = await db.select({ id: competencias.id, codigoIntegracao: competencias.codigoIntegracao })
      .from(competencias)
      .where(sql`${competencias.id} IN (${sql.join(compIds.map(id => sql`${id}`), sql`, `)})`);
    compCodigoMap = Object.fromEntries(compsWithCodigo.filter(c => c.codigoIntegracao).map(c => [c.id, c.codigoIntegracao!]));
  }
  
  // Buscar student_performance do aluno
  let perfMap: Record<string, { progressoTotal: number; mediaRespondidas: number; mediaDisponiveis: number; totalAulas: number; aulasDisponiveis: number; aulasConcluidas: number; aulasEmAndamento: number; aulasNaoIniciadas: number; avaliacoesRespondidas: number; avaliacoesDisponiveis: number }> = {};
  if (alunoExternalId) {
    const perfRecords = await db.select().from(studentPerformance)
      .where(eq(studentPerformance.externalUserId, alunoExternalId));
    for (const p of perfRecords) {
      if (p.externalCompetenciaId) {
        perfMap[p.externalCompetenciaId] = {
          progressoTotal: parseFloat(String(p.progressoTotal || '0')),
          mediaRespondidas: parseFloat(String(p.mediaAvaliacoesRespondidas || '0')),
          mediaDisponiveis: parseFloat(String(p.mediaAvaliacoesDisponiveis || '0')),
          totalAulas: p.totalAulas || 0,
          aulasDisponiveis: p.aulasDisponiveis || 0,
          aulasConcluidas: p.aulasConcluidas || 0,
          aulasEmAndamento: p.aulasEmAndamento || 0,
          aulasNaoIniciadas: p.aulasNaoIniciadas || 0,
          avaliacoesRespondidas: p.avaliacoesRespondidas || 0,
          avaliacoesDisponiveis: p.avaliacoesDisponiveis || 0,
        };
      }
    }
  }
  
  // 7. Fallback: para alunos da plataforma, buscar progresso real de aluno_atividade_progresso
  // para competências que ainda não têm registro em student_performance
  const cursosAtribuidosAluno = await db.select({
    id: alunoCursoAtribuido.id,
    cursoId: alunoCursoAtribuido.cursoId,
    competenciaId: alunoCursoAtribuido.competenciaId,
    status: alunoCursoAtribuido.status,
  }).from(alunoCursoAtribuido).where(eq(alunoCursoAtribuido.alunoId, alunoId));

  for (const cursoAtrib of cursosAtribuidosAluno) {
    const codigo = compCodigoMap[cursoAtrib.competenciaId];
    // Só preencher se não há registro em student_performance
    if (codigo && perfMap[codigo]) continue;
    // Contar atividades aprovadas e total do curso (apenas ativas)
    const [totalResult] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(atividadesCurso).where(and(eq(atividadesCurso.cursoId, cursoAtrib.cursoId), eq(atividadesCurso.isActive, 1)));
    const [aprovResult] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(alunoAtividadeProgresso)
      .where(and(
        eq(alunoAtividadeProgresso.alunoId, alunoId),
        eq(alunoAtividadeProgresso.cursoAtribuidoId, cursoAtrib.id),
        // Incluir 'concluida' além de 'aprovada': atividades sem avaliação ficam como 'concluida'
        // e atividades com avaliação ficam como 'concluida' antes de ir para a prova
        sql`${alunoAtividadeProgresso.status} IN ('aprovada', 'concluida')`
      ));
    const [andResult] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(alunoAtividadeProgresso)
      .where(and(
        eq(alunoAtividadeProgresso.alunoId, alunoId),
        eq(alunoAtividadeProgresso.cursoAtribuidoId, cursoAtrib.id),
        eq(alunoAtividadeProgresso.status, 'em_andamento')
      ));
    const total = Number(totalResult?.count || 0);
    const aprovadas = Number(aprovResult?.count || 0);
    const emAndamento = Number(andResult?.count || 0);
    if (total === 0) continue;
    const progressoTotal = Math.round((aprovadas / total) * 100);
    const key = codigo || String(cursoAtrib.competenciaId);
    perfMap[key] = {
      progressoTotal,
      mediaRespondidas: 0,
      mediaDisponiveis: 0,
      totalAulas: total,
      aulasDisponiveis: total,
      aulasConcluidas: aprovadas,
      aulasEmAndamento: emAndamento,
      aulasNaoIniciadas: total - aprovadas - emAndamento,
      avaliacoesRespondidas: 0,
      avaliacoesDisponiveis: 0,
    };
    // Se não há codigo, também indexar pelo competenciaId como string
    if (!codigo) perfMap[String(cursoAtrib.competenciaId)] = perfMap[key];
  }

  // 7. Montar estrutura hierárquica — helper para enriquecer competência
  const buildMicroJornada = (comp: typeof allComps[0]) => {
    const codigo = compCodigoMap[comp.competenciaId];
    const perf = codigo ? perfMap[codigo] : null;
    const nivelManual = comp.nivelAtual ? parseFloat(comp.nivelAtual) : null;
    const notaPlataforma = perf ? (perf.mediaRespondidas > 0 ? perf.mediaRespondidas : perf.mediaDisponiveis > 0 ? perf.mediaDisponiveis : null) : null;
    const nivelFinal = nivelManual !== null ? nivelManual : notaPlataforma;
    return {
      id: comp.id,
      competenciaId: comp.competenciaId,
      competenciaNome: compMap[comp.competenciaId]?.nome || `Competência #${comp.competenciaId}`,
      peso: comp.peso,
      nivelAtual: nivelFinal,
      nivelManual,
      notaPlataforma,
      progressoPlataforma: perf?.progressoTotal ?? null,
      totalAulas: perf?.totalAulas ?? null,
      aulasDisponiveis: perf?.aulasDisponiveis ?? null,
      aulasConcluidas: perf?.aulasConcluidas ?? null,
      aulasEmAndamento: perf?.aulasEmAndamento ?? null,
      aulasNaoIniciadas: perf?.aulasNaoIniciadas ?? null,
      avaliacoesRespondidas: perf?.avaliacoesRespondidas ?? null,
      avaliacoesDisponiveis: perf?.avaliacoesDisponiveis ?? null,
      competenciaConcluida: perf ? (perf.aulasConcluidas >= perf.aulasDisponiveis && perf.aulasDisponiveis > 0) : false,
      metaCiclo1: comp.metaCiclo1 ? parseFloat(comp.metaCiclo1) : null,
      metaCiclo2: comp.metaCiclo2 ? parseFloat(comp.metaCiclo2) : null,
      metaFinal: comp.metaFinal ? parseFloat(comp.metaFinal) : null,
      notaCorte: comp.notaCorte ? parseFloat(comp.notaCorte) : null,
      justificativa: comp.justificativa,
      microInicio: comp.microInicio,
      microTermino: comp.microTermino,
      createdAt: comp.createdAt,
    };
  };

  // 7b. Agrupar PDIs pela mesma trilha para evitar trilhas duplicadas
  const trilhaGroups = new Map<string, typeof pdis>();
  for (const pdi of pdis) {
    const key = pdi.trilhaId ? String(pdi.trilhaId) : `no-trilha-${pdi.id}`;
    if (!trilhaGroups.has(key)) trilhaGroups.set(key, []);
    trilhaGroups.get(key)!.push(pdi);
  }

  const macroJornadas = Array.from(trilhaGroups.values()).map(groupPdis => {
    // Usar o PDI mais recente como referência para metadados da trilha
    const primaryPdi = groupPdis[0]; // já ordenado por desc(createdAt)
    
    // Mesclar competências de todos os PDIs do mesmo grupo
    const allGroupComps = groupPdis.flatMap(pdi => allComps.filter(c => c.assessmentPdiId === pdi.id));
    
    // Deduplicar competências pelo competenciaId (manter a mais recente)
    const seenCompIds = new Set<number>();
    const dedupedComps = allGroupComps.filter(comp => {
      if (seenCompIds.has(comp.competenciaId)) return false;
      seenCompIds.add(comp.competenciaId);
      return true;
    });
    
    const microJornadas = dedupedComps.map(buildMicroJornada);
    
    // Mesclar observações de todos os PDIs
    const allObservacoes = groupPdis
      .map(p => p.observacoes)
      .filter(Boolean)
      .join("\n");
    
    // Usar o macroInicio mais antigo e macroTermino mais recente
    const macroInicios = groupPdis.map(p => p.macroInicio).filter(Boolean).sort();
    const macroTerminos = groupPdis.map(p => p.macroTermino).filter(Boolean).sort();
    
    // Status: se algum é 'ativo', o grupo é 'ativo'
    const hasAtivo = groupPdis.some(p => p.status === 'ativo');
    const groupStatus = hasAtivo ? 'ativo' : primaryPdi.status;
    
    return {
      id: primaryPdi.id,
      trilhaId: primaryPdi.trilhaId,
      trilhaNome: primaryPdi.trilhaId ? (trilhaMap[primaryPdi.trilhaId] || `Trilha #${primaryPdi.trilhaId}`) : "Sem trilha",
      status: groupStatus,
      macroInicio: macroInicios[0] || primaryPdi.macroInicio,
      macroTermino: macroTerminos[macroTerminos.length - 1] || primaryPdi.macroTermino,
      observacoes: allObservacoes || primaryPdi.observacoes,
      createdAt: primaryPdi.createdAt,
      microJornadas,
      totalCompetencias: microJornadas.length,
      obrigatorias: microJornadas.filter(m => m.peso === "obrigatoria").length,
      opcionais: microJornadas.filter(m => m.peso === "opcional").length,
      nivelGeralAtual: microJornadas.filter(m => m.nivelAtual !== null).length > 0
        ? microJornadas.filter(m => m.nivelAtual !== null).reduce((sum, m) => sum + (m.nivelAtual || 0), 0) / microJornadas.filter(m => m.nivelAtual !== null).length
        : null,
      metaGeralFinal: microJornadas.filter(m => m.metaFinal !== null).length > 0
        ? microJornadas.filter(m => m.metaFinal !== null).reduce((sum, m) => sum + (m.metaFinal || 0), 0) / microJornadas.filter(m => m.metaFinal !== null).length
        : null,
    };
  });
  
  return { contrato, macroJornadas, saldo };
}

// Update multiple fields on assessment_competencias
export async function updateAssessmentCompetenciaFields(
  assessmentCompetenciaId: number,
  updates: Record<string, any>
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const setClauses = Object.entries(updates)
    .map(([key, value]) => {
      const colMap: Record<string, string> = {
        nivelAtual: 'nivelAtual',
        metaCiclo1: 'metaCiclo1',
        metaCiclo2: 'metaCiclo2',
        metaFinal: 'metaFinal',
        justificativa: 'justificativa',
      };
      const col = colMap[key] || key;
      return `\`${col}\` = '${String(value).replace(/'/g, "''")}'`;
    })
    .join(', ');
  
  if (setClauses) {
    await db.execute(
      sql.raw(`UPDATE \`assessment_competencias\` SET ${setClauses} WHERE \`id\` = ${assessmentCompetenciaId}`)
    );
  }
}


// ============ GATILHO DE REAVALIAÇÃO A CADA 3 SESSÕES ============

export async function checkReavaliacaoPendente(alunoId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Buscar a data da última atualização de nível (do histórico)
  const ultimaAtualizacao = await db.select({
    maxDate: sql<string>`MAX(${historicoNivelCompetencia.createdAt})`
  }).from(historicoNivelCompetencia)
    .where(eq(historicoNivelCompetencia.alunoId, alunoId));
  
  const ultimaData = ultimaAtualizacao[0]?.maxDate ? new Date(ultimaAtualizacao[0].maxDate) : null;
  
  // Contar sessões de mentoria realizadas APÓS a última atualização de nível
  // Se nunca houve atualização, contar todas as sessões (excluindo assessment)
  let sessoesDesdeUltimaAtualizacao: number;
  
  if (ultimaData) {
    const result = await db.select({ count: sql<number>`COUNT(*)` })
      .from(mentoringSessions)
      .where(and(
        eq(mentoringSessions.alunoId, alunoId),
        eq(mentoringSessions.isAssessment, 0),
        eq(mentoringSessions.presence, "presente"),
        sql`${mentoringSessions.sessionDate} > ${ultimaData.toISOString().slice(0, 10)}`
      ));
    sessoesDesdeUltimaAtualizacao = result[0]?.count || 0;
  } else {
    // Nunca houve atualização — contar todas as sessões excluindo assessment
    const result = await db.select({ count: sql<number>`COUNT(*)` })
      .from(mentoringSessions)
      .where(and(
        eq(mentoringSessions.alunoId, alunoId),
        eq(mentoringSessions.isAssessment, 0),
        eq(mentoringSessions.presence, "presente")
      ));
    sessoesDesdeUltimaAtualizacao = result[0]?.count || 0;
  }
  
  return {
    sessoesDesdeUltimaAtualizacao,
    precisaReavaliar: sessoesDesdeUltimaAtualizacao >= 3,
    ultimaAtualizacao: ultimaData,
  };
}


// ============ CASES DE SUCESSO ============

/**
 * Get all cases de sucesso for a specific student
 */
export async function getCasesSucessoByAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(casesSucesso).where(eq(casesSucesso.alunoId, alunoId));
}

/**
 * Get all cases de sucesso (for admin view)
 */
export async function getAllCasesSucesso() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(casesSucesso).orderBy(desc(casesSucesso.createdAt));
}

export async function getCaseSucessoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.select().from(casesSucesso).where(eq(casesSucesso.id, id)).limit(1);
  return result || null;
}

/**
 * Cases publicados para vitrine no mural (sem dados sensíveis)
 */
export async function getCasesVitrineMural(limit = 12) {
  const db = await getDb();
  if (!db) return [];
  const cases = await db.select({
    caseId: casesSucesso.id,
    titulo: casesSucesso.titulo,
    resumoPublico: casesSucesso.resumoPublico,
    dataEntrega: casesSucesso.dataEntrega,
    autorAlunoId: alunos.id,
    autorNome: alunos.name,
    alunoFoto: alunos.photoUrl,
    empresa: programs.name,
  })
    .from(casesSucesso)
    .innerJoin(alunos, eq(casesSucesso.alunoId, alunos.id))
    .leftJoin(programs, eq(alunos.programId, programs.id))
    .where(and(
      eq(casesSucesso.entregue, 1),
      isNotNull(casesSucesso.dataEntrega),
      isNotNull(casesSucesso.titulo)
    ))
    .orderBy(desc(casesSucesso.dataEntrega), desc(casesSucesso.createdAt))
    .limit(limit);

  // Buscar contagem de interesses para cada case
  const caseIds = cases.map(c => c.caseId);
  if (caseIds.length === 0) return cases.map(c => ({ ...c, totalInteresses: 0 }));
  const interesses = await db.select({
    caseId: caseInteresses.caseId,
  }).from(caseInteresses).where(inArray(caseInteresses.caseId, caseIds));
  const interesseCount = new Map<number, number>();
  for (const i of interesses) {
    interesseCount.set(i.caseId, (interesseCount.get(i.caseId) || 0) + 1);
  }
  return cases.map(c => {
    const total = interesseCount.get(c.caseId) || 0;
    return { ...c, alunoNome: c.autorNome, totalInteresses: total };
  });
}

export async function createCaseInteresse(data: InsertCaseInteresse) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(caseInteresses).values(data);
  return result.insertId;
}

export async function getCaseInteressesByAutor(autorAlunoId: number, onlyUnread = false) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(caseInteresses.autorAlunoId, autorAlunoId)];
  if (onlyUnread) conditions.push(eq(caseInteresses.status, "nao_lido"));
  return db.select().from(caseInteresses)
    .where(and(...conditions))
    .orderBy(desc(caseInteresses.createdAt));
}

export async function markCaseInteresseAsRead(id: number, autorAlunoId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(caseInteresses)
    .set({ status: "lido" })
    .where(and(eq(caseInteresses.id, id), eq(caseInteresses.autorAlunoId, autorAlunoId)));
}

/**
 * Create a new case de sucesso
 */
export async function createCaseSucesso(data: InsertCaseSucesso) {
  const db = await getDb();
  if (!db) return null;
  await assertNivelPermiteNovasAtribuicoes(data.alunoId, data.contratoNivelId, "cases.create");
  const contratoNivelIdResolved = await resolveContratoNivelId(data.alunoId, data.contratoNivelId);
  const [result] = await db.insert(casesSucesso).values({ ...data, contratoNivelId: contratoNivelIdResolved });
  return result.insertId;
}

export async function getCasesSucessoByAlunoAndNivel(alunoId: number, contratoNivelId?: number | null) {
  const db = await getDb();
  if (!db) return [];
  if (!contratoNivelId) return getCasesSucessoByAluno(alunoId);
  return db.select().from(casesSucesso).where(and(
    eq(casesSucesso.alunoId, alunoId),
    eq(casesSucesso.contratoNivelId, contratoNivelId),
  ));
}

/**
 * Update case de sucesso
 */
export async function updateCaseSucesso(id: number, data: Partial<InsertCaseSucesso>) {
  const db = await getDb();
  if (!db) return;
  await db.update(casesSucesso).set(data).where(eq(casesSucesso.id, id));
}

/**
 * Delete case de sucesso
 */
export async function deleteCaseSucesso(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(casesSucesso).where(eq(casesSucesso.id, id));
}

/**
 * Get cases data formatted for the V2 calculator
 * Returns a map: alunoId -> CaseSucessoData[]
 */
export async function getCasesForCalculator(): Promise<Map<number, { alunoId: number; trilhaId: number | null; trilhaNome: string | null; entregue: boolean; dataEntrega?: Date | null }[]>> {
  const db = await getDb();
  const result = new Map<number, { alunoId: number; trilhaId: number | null; trilhaNome: string | null; entregue: boolean; dataEntrega?: Date | null }[]>();
  if (!db) return result;
  
  const allCases = await db.select().from(casesSucesso);
  
  for (const c of allCases) {
    const existing = result.get(c.alunoId) || [];
    existing.push({
      alunoId: c.alunoId,
      trilhaId: c.trilhaId,
      trilhaNome: c.trilhaNome,
      entregue: c.entregue === 1,
      dataEntrega: c.dataEntrega ? new Date(c.dataEntrega) : (c.updatedAt ? new Date(c.updatedAt) : null),
    });
    result.set(c.alunoId, existing);
  }
  
  return result;
}

/**
 * Get ciclos data formatted for the V2 calculator
 * Returns a map: idUsuario -> CicloDataV2[]
 */
export async function getAllCiclosForCalculatorV2(): Promise<Map<string, { id: number; nomeCiclo: string; trilhaNome: string; dataInicio: string; dataFim: string; competenciaIds: number[]; allCompetenciaIds?: number[] }[]>> {
  const db = await getDb();
  if (!db) return new Map();
  
  // Reuse existing logic from getAllCiclosForCalculator
  const existingCiclos = await getAllCiclosForCalculator();
  
  // Convert to V2 format (add trilhaNome)
  const result = new Map<string, { id: number; nomeCiclo: string; trilhaNome: string; dataInicio: string; dataFim: string; competenciaIds: number[]; allCompetenciaIds?: number[] }[]>();
  
  // Get trilhas for names
  const allTrilhas = await db.select({ id: trilhas.id, name: trilhas.name }).from(trilhas);
  const trilhaMap = new Map(allTrilhas.map(t => [t.id, t.name]));
  
  // Get assessment PDIs to map trilha names
  // Usar apenas PDIs ativos para mapear trilhaNome (ignorar congelados)
  const allPdis = await db.select({
    id: assessmentPdi.id,
    alunoId: assessmentPdi.alunoId,
    trilhaId: assessmentPdi.trilhaId,
  }).from(assessmentPdi).where(eq(assessmentPdi.status, 'ativo'));
  
  const alunosList = await db.select({ id: alunos.id, externalId: alunos.externalId }).from(alunos);
  const alunoMap = new Map(alunosList.map(a => [a.id, a.externalId]));
  
  // Map alunoId -> trilhaNome
  const alunoTrilhaMap = new Map<string, string>();
  for (const pdi of allPdis) {
    const alunoKey = alunoMap.get(pdi.alunoId) || String(pdi.alunoId);
    const trilhaNome = trilhaMap.get(pdi.trilhaId) || `Trilha ${pdi.trilhaId}`;
    alunoTrilhaMap.set(alunoKey, trilhaNome);
  }
  
  for (const [alunoKey, ciclos] of Array.from(existingCiclos.entries())) {
    const trilhaNome = alunoTrilhaMap.get(alunoKey) || 'Geral';
    const v2Ciclos = ciclos.map(c => ({
      id: c.id,
      nomeCiclo: c.nomeCiclo,
      trilhaNome,
      dataInicio: c.dataInicio,
      dataFim: c.dataFim,
      competenciaIds: c.competenciaIds,
      allCompetenciaIds: c.allCompetenciaIds,
    }));
    result.set(alunoKey, v2Ciclos);
  }
  
  return result;
}


/**
 * Get macrociclo (período da jornada) data for all students
 * Returns a map: idUsuario -> { macroInicio, macroTermino }
 * Source: assessment_pdi.macroInicio / macroTermino
 */
export async function getMacrocicloPorAluno(): Promise<Map<string, { macroInicio: string; macroTermino: string }>> {
  const db = await getDb();
  if (!db) return new Map();

  // Buscar todos os PDIs ativos com datas válidas, ordenados por macroInicio ASC
  const pdis = await db.execute(sql.raw(`
    SELECT ap.alunoId, ap.macroInicio, ap.macroTermino
    FROM assessment_pdi ap
    WHERE ap.status = 'ativo' AND ap.macroInicio IS NOT NULL AND ap.macroTermino IS NOT NULL
    ORDER BY ap.alunoId, ap.macroInicio ASC
  `)) as any;
  const pdiList = Array.isArray(pdis[0]) ? pdis[0] : [];

  const alunosList = await db.select({ id: alunos.id, externalId: alunos.externalId }).from(alunos);
  const alunoMap = new Map(alunosList.map(a => [a.id, a.externalId || String(a.id)]));

  // Agrupar PDIs por aluno (já ordenados por macroInicio ASC)
  const pdisPorAluno = new Map<number, Array<{ macroInicio: string; macroTermino: string }>>();
  for (const pdi of pdiList) {
    if (!pdisPorAluno.has(pdi.alunoId)) pdisPorAluno.set(pdi.alunoId, []);
    pdisPorAluno.get(pdi.alunoId)!.push(pdi);
  }

  const result = new Map<string, { macroInicio: string; macroTermino: string }>();

  for (const [alunoId, pdisAluno] of pdisPorAluno) {
    const alunoKey = alunoMap.get(alunoId) || String(alunoId);

    // Lógica: enquanto não há reset, toda a jornada é um único macrociclo contínuo.
    // Usar o menor macroInicio (início da jornada) e o maior macroTermino dos PDIs
    // que já iniciaram (macroInicio <= hoje). PDIs futuros são ignorados.
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    const pdisIniciadosOuAtivos = pdisAluno.filter(p => {
      const inicio = new Date(String(p.macroInicio).split('T')[0] + 'T00:00:00');
      return inicio <= hoje;
    });

    if (pdisIniciadosOuAtivos.length > 0) {
      // Início da jornada: menor macroInicio entre todos os PDIs já iniciados
      const primeiroInicio = pdisIniciadosOuAtivos[0].macroInicio; // já ordenado ASC
      // Fim da jornada: maior macroTermino entre todos os PDIs já iniciados
      const ultimoTermino = pdisIniciadosOuAtivos.reduce((max, p) =>
        String(p.macroTermino) > String(max) ? String(p.macroTermino) : max,
        String(pdisIniciadosOuAtivos[0].macroTermino)
      );
      result.set(alunoKey, {
        macroInicio: String(primeiroInicio).split('T')[0],
        macroTermino: String(ultimoTermino).split('T')[0],
      });
    } else {
      // Fallback: aluno com apenas PDIs futuros — usar o mais antigo
      const pdiMaisAntigo = pdisAluno[0];
      if (pdiMaisAntigo) {
        result.set(alunoKey, {
          macroInicio: String(pdiMaisAntigo.macroInicio).split('T')[0],
          macroTermino: String(pdiMaisAntigo.macroTermino).split('T')[0],
        });
      }
    }
  }

  return result;
}

// ============ PRACTICAL ACTIVITY COMMENTS ============

export async function getCommentsBySessionId(sessionId: number): Promise<PracticalActivityComment[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(practicalActivityComments)
    .where(eq(practicalActivityComments.sessionId, sessionId))
    .orderBy(practicalActivityComments.createdAt);
}

export async function addActivityComment(data: InsertPracticalActivityComment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(practicalActivityComments).values(data);
  return result[0].insertId;
}

// ============ PRACTICAL ACTIVITY ADMIN QUERIES ============

export async function getActivitySubmissionsForAdmin(filters?: {
  consultorId?: number;
  alunoId?: number;
  turmaId?: number;
  programId?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<MentoringSession[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Incluir sessões com qualquer modo de tarefa (biblioteca, personalizada, livre)
  const conditions = [
    or(
      isNotNull(mentoringSessions.taskId),
      eq(mentoringSessions.taskMode, 'personalizada' as any),
      eq(mentoringSessions.taskMode, 'livre' as any),
      isNotNull(mentoringSessions.customTaskTitle)
    )!,
  ];
  
  if (filters?.consultorId) {
    conditions.push(eq(mentoringSessions.consultorId, filters.consultorId));
  }
  if (filters?.alunoId) {
    conditions.push(eq(mentoringSessions.alunoId, filters.alunoId));
  }
  if (filters?.turmaId) {
    conditions.push(eq(mentoringSessions.turmaId, filters.turmaId));
  }
  if (filters?.programId) {
    // Filtrar por programa: buscar alunos do programa e filtrar sessões
    const alunosDoPrograma = await db.select({ id: alunos.id }).from(alunos).where(eq(alunos.programId, filters.programId));
    const alunoIds = alunosDoPrograma.map(a => a.id);
    if (alunoIds.length === 0) return [];
    conditions.push(inArray(mentoringSessions.alunoId, alunoIds));
  }
  if (filters?.status) {
    conditions.push(eq(mentoringSessions.taskStatus, filters.status as any));
  }
  if (filters?.dateFrom) {
    conditions.push(gte(mentoringSessions.taskDeadline, filters.dateFrom as any));
  }
  if (filters?.dateTo) {
    conditions.push(lte(mentoringSessions.taskDeadline, filters.dateTo as any));
  }
  
  return await db.select().from(mentoringSessions)
    .where(and(...conditions))
    .orderBy(desc(mentoringSessions.createdAt));
}

export async function getMentoringSessionById(sessionId: number): Promise<MentoringSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(mentoringSessions)
    .where(eq(mentoringSessions.id, sessionId))
    .limit(1);
  return result[0];
}


// ============ CADASTRO DIRETO DE ALUNO PELO ADMIN ============

export async function createAlunoDireto(data: {
  name: string;
  email: string;
  cpf: string;
  programId: number;
  consultorId?: number | null;
  turmaId?: number | null;
  contratoInicio?: string;
  contratoFim?: string;
  tipoPortal?: string | null;
  processoSeletivoId?: number | null;
}): Promise<{ success: boolean; alunoId?: number; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };

  const normalizedCpf = data.cpf.replace(/[.\-]/g, '');

  // Verificar se já existe aluno com este email
  const [existingAluno] = await db.select()
    .from(alunos)
    .where(eq(alunos.email, data.email.toLowerCase()))
    .limit(1);

  if (existingAluno) {
    return { success: false, message: "Já existe um aluno com este email." };
  }

  // Verificar se já existe user com este CPF
  const [existingUser] = await db.select()
    .from(users)
    .where(eq(users.cpf, normalizedCpf))
    .limit(1);

  if (existingUser) {
    return { success: false, message: "Este ID/CPF já está cadastrado no sistema." };
  }

  // 1. Criar registro na tabela alunos SEM mentor (aluno escolhe no onboarding) e SEM bypass
  const [alunoResult] = await db.insert(alunos).values({
    name: data.name,
    email: data.email.toLowerCase(),
    externalId: normalizedCpf,
    programId: data.programId,
    turmaId: data.turmaId ?? null,
    consultorId: data.consultorId ?? null,
    bypassOnboarding: 0,
    cadastradoPorAdmin: 1,
    canLogin: 1,
    isActive: 1,
    contratoInicio: data.contratoInicio ? new Date(data.contratoInicio) : null,
    contratoFim: data.contratoFim ? new Date(data.contratoFim) : null,
    tipoPortal: data.tipoPortal ?? null,
    processoSeletivoId: data.processoSeletivoId ?? null,
  });

  const alunoId = alunoResult.insertId;

  // 2. Criar registro na tabela users para login (Email + CPF)
  const openId = `access_user_${normalizedCpf}`;
  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email.toLowerCase(),
    cpf: normalizedCpf,
    role: 'user',
    programId: data.programId,
    alunoId: Number(alunoId),
    loginMethod: 'email_cpf',
    isActive: 1,
    lastSignedIn: new Date(),
  });

  return { success: true, alunoId: Number(alunoId) };
}

// ============ LIBERAR ONBOARDING (NOVO CICLO) ============

export async function liberarOnboardingAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return { success: false, message: 'Erro de conexão com banco' };

  // Validações básicas
  const [aluno] = await db.select().from(alunos).where(eq(alunos.id, alunoId)).limit(1);
  if (!aluno) return { success: false, message: 'Aluno não encontrado' };
  if (aluno.onboardingLiberado === 1) return { success: false, message: 'Onboarding já está liberado para este aluno' };
  const [pdiCount] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(assessmentPdi)
    .where(eq(assessmentPdi.alunoId, alunoId));
  if ((pdiCount?.count ?? 0) === 0) {
    return { success: false, message: 'Aluno não tem PDI. Já deve ir para onboarding automaticamente.' };
  }

  let numeroCiclo = 1;
  try {
    // 1. Arquivar ciclo atual (snapshot + congelamento)
    const resultado = await arquivarCicloAtual(alunoId);
    numeroCiclo = resultado.numeroCiclo;

    // 2. Marcar onboarding como liberado
    await db.update(alunos)
      .set({ onboardingLiberado: 1, onboardingLiberadoEm: new Date() })
      .where(eq(alunos.id, alunoId));

    // 3. Limpar dados do ciclo anterior para o novo ciclo
    // IMPORTANTE: disc_resultados NÃO é deletado — o histórico de evolução precisa dos scores DISC do ciclo anterior.
    // Apenas disc_respostas (respostas brutas) e autopercepcoes são limpas para o novo ciclo.
    await db.execute(sql.raw(`DELETE FROM disc_respostas WHERE alunoId = ${alunoId}`));
    // disc_resultados: preservar para histórico — o novo DISC do ciclo 2 será inserido com contratoNivelId diferente
    // await db.execute(sql.raw(`DELETE FROM disc_resultados WHERE alunoId = ${alunoId}`));
    await db.execute(sql.raw(`DELETE FROM autopercepcoes_competencias WHERE alunoId = ${alunoId}`));

    // 4. Resetar jornada de onboarding
    const [jornadaRows] = await db.execute(sql.raw(
      `SELECT id, ciclo FROM onboarding_jornada WHERE alunoId = ${alunoId} ORDER BY ciclo DESC LIMIT 1`
    )) as any;
    const jornadaAtual = Array.isArray(jornadaRows) ? jornadaRows[0] : null;
    const novoCicloJornada = (Number(jornadaAtual?.ciclo) || 0) + 1;
    if (jornadaAtual?.id) {
      await db.execute(sql.raw(`
        UPDATE onboarding_jornada SET
          ciclo = ${novoCicloJornada},
          cadastroConfirmado = 0, cadastroConfirmadoEm = NULL,
          pdiVisualizado = 0, pdiVisualizadoEm = NULL,
          pdiLiberadoPelaMentora = 0, pdiLiberadoEm = NULL,
          videoBoasVindas = 0, videoCompetencias = 0, videoWebinars = 0,
          videoTarefas = 0, videoMetas = 0, todosVideosEm = NULL,
          aceiteRealizado = 0, aceiteRealizadoEm = NULL, nomeAceite = NULL,
          updatedAt = NOW()
        WHERE alunoId = ${alunoId}
      `));
    } else {
      await db.execute(sql.raw(`
        INSERT INTO onboarding_jornada (alunoId, ciclo, cadastroConfirmado, aceiteRealizado, createdAt, updatedAt)
        VALUES (${alunoId}, ${novoCicloJornada}, 0, 0, NOW(), NOW())
      `));
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error(`[DB] Erro em liberarOnboardingAluno para aluno ${alunoId}:`, err);
    return { success: false, message: `Erro: ${errMsg}` };
  }

  return { success: true, message: `Onboarding liberado para novo ciclo. Ciclo ${numeroCiclo} arquivado na página de Evolução.` };
}

/**
 * Lista alunos com onboardingLiberado=1 mas SEM nenhum registro em
 * historico_ciclos_aluno — ou seja, foram marcados como "liberados" mas o
 * arquivamento do ciclo anterior nunca foi de fato gravado (bug corrigido em
 * 2026-08-08: consulta de webinars em arquivarCicloAtual usava uma coluna
 * inexistente, derrubando o arquivamento silenciosamente pra todo mundo no
 * reset em massa). Serve pra identificar e corrigir esses casos retroativos.
 */
export async function listarAlunosSemArquivamento() {
  const db = await getDb();
  if (!db) return [];
  const [rows]: any = await db.execute(sql.raw(`
    SELECT a.id, a.name, a.onboardingLiberadoEm
    FROM alunos a
    WHERE a.onboardingLiberado = 1
      AND NOT EXISTS (SELECT 1 FROM historico_ciclos_aluno h WHERE h.alunoId = a.id)
    ORDER BY a.onboardingLiberadoEm DESC, a.name
  `));
  return Array.isArray(rows) ? rows : [];
}

/**
 * Roda o arquivamento retroativo (arquivarCicloAtual) pra uma lista de alunos
 * que já estão com onboardingLiberado=1 — SEM alterar esse campo, já que ele
 * já está correto. Só preenche o registro de histórico/auditoria que faltou.
 */
export async function backfillArquivamento(alunoIds: number[]) {
  const db = await getDb();
  if (!db) return { sucesso: 0, erros: [] as string[] };

  const alunosEncontrados = await db.select({ id: alunos.id, name: alunos.name })
    .from(alunos)
    .where(inArray(alunos.id, alunoIds));

  let sucesso = 0;
  const erros: string[] = [];
  for (const id of alunoIds) {
    const aluno = alunosEncontrados.find(a => a.id === id);
    try {
      await arquivarCicloAtual(id);
      sucesso++;
    } catch (e: any) {
      const errMsg = e?.message || String(e);
      console.error(`[DB] Erro no backfill de arquivamento do aluno ${id} (${aluno?.name}):`, e);
      erros.push(`${aluno?.name || `Aluno ID ${id}`}: ${errMsg}`);
    }
  }
  return { sucesso, erros };
}

export async function liberarOnboardingEmMassa(alunoIds: number[]) {
  const db = await getDb();
  if (!db) return { success: false, message: 'Erro de conexão com banco', liberados: 0, erros: [] as string[] };

  if (alunoIds.length === 0) {
    return { success: false, message: 'Nenhum aluno selecionado', liberados: 0, erros: [] as string[] };
  }

  // Buscar alunos que existem e têm PDI
  const alunosEncontrados = await db.select({ id: alunos.id, name: alunos.name, onboardingLiberado: alunos.onboardingLiberado })
    .from(alunos)
    .where(inArray(alunos.id, alunoIds));

  const alunosComPdi = await db.select({ alunoId: assessmentPdi.alunoId })
    .from(assessmentPdi)
    .where(inArray(assessmentPdi.alunoId, alunoIds))
    .groupBy(assessmentPdi.alunoId);

  const alunoIdsComPdi = new Set(alunosComPdi.map(a => a.alunoId));
  const erros: string[] = [];
  const idsParaLiberar: number[] = [];

  for (const id of alunoIds) {
    const aluno = alunosEncontrados.find(a => a.id === id);
    if (!aluno) {
      erros.push(`Aluno ID ${id}: não encontrado`);
      continue;
    }
    if (!alunoIdsComPdi.has(id)) {
      erros.push(`${aluno.name}: sem PDI (já deve ir para onboarding automaticamente)`);
      continue;
    }
    if (aluno.onboardingLiberado === 1) {
      erros.push(`${aluno.name}: onboarding já liberado`);
      continue;
    }
    idsParaLiberar.push(id);
  }

  if (idsParaLiberar.length > 0) {
    // Arquivar ciclo atual de cada aluno antes de liberar — só quem realmente
    // arquivou com sucesso é que tem o onboarding liberado. Antes, uma falha
    // aqui só gerava um aviso no log e o aluno era liberado mesmo assim, sem
    // nenhum registro de reset — deixando o onboarding marcado como "feito"
    // sobre um ciclo que nunca foi congelado de verdade.
    const idsComSucesso: number[] = [];
    for (const id of idsParaLiberar) {
      const aluno = alunosEncontrados.find(a => a.id === id);
      try {
        await arquivarCicloAtual(id);
        idsComSucesso.push(id);
      } catch (e: any) {
        const errMsg = e?.message || String(e);
        console.error(`[DB] Erro ao arquivar ciclo do aluno ${id} (${aluno?.name}):`, e);
        erros.push(`${aluno?.name || `Aluno ID ${id}`}: falha ao arquivar o ciclo — ${errMsg}`);
      }
    }
    if (idsComSucesso.length > 0) {
      await db.update(alunos).set({
        onboardingLiberado: 1,
        onboardingLiberadoEm: new Date(),
      }).where(inArray(alunos.id, idsComSucesso));
    }
    return {
      success: true,
      message: `Onboarding liberado para ${idsComSucesso.length} aluno(s)${erros.length > 0 ? `. ${erros.length} ignorado(s)/com falha — veja a lista.` : '.'}`,
      liberados: idsComSucesso.length,
      erros,
    };
  }

  return {
    success: true,
    message: `Onboarding liberado para 0 aluno(s)${erros.length > 0 ? `. ${erros.length} ignorado(s).` : '.'}`,
    liberados: 0,
    erros,
  };
}

/**
 * Zera o flag onboardingLiberado do aluno após ele concluir o aceite.
 * Evita que o aluno fique preso no onboarding indefinidamente após um novo ciclo liberado pelo admin.
 */
export async function resetOnboardingLiberado(alunoId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // 1. Zera o flag onboardingLiberado na tabela alunos
  await db.update(alunos)
    .set({ onboardingLiberado: 0, onboardingLiberadoEm: null })
    .where(eq(alunos.id, alunoId));
  // 2. Garante que o registro onboarding_jornada existe com aceite e cadastro marcados
  //    Isso é necessário para alunos novos (isAlunoNovo=true) onde a regra
  //    needsOnboarding = isAlunoNovo && !aceiteRealizado também precisa ser satisfeita
  const existing = await getOnboardingJornada(alunoId);
  if (existing) {
    await db.update(onboardingJornada)
      .set({ cadastroConfirmado: 1, aceiteRealizado: 1, aceiteRealizadoEm: existing.aceiteRealizadoEm ?? new Date() })
      .where(eq(onboardingJornada.alunoId, alunoId));
  } else {
    await db.insert(onboardingJornada).values({
      alunoId,
      ciclo: 1,
      cadastroConfirmado: 1,
      aceiteRealizado: 1,
      aceiteRealizadoEm: new Date(),
    });
  }
}

// ============ STATUS DE ONBOARDING DO ALUNO ============

export async function getAlunoOnboardingStatus(user: {
  id: number;
  openId: string;
  email?: string | null;
  alunoId?: number | null;
  role: string;
}): Promise<{
  needsOnboarding: boolean;
  hasMentor: boolean;
  hasPdi: boolean;
  onboardingLiberado: boolean;
  alunoId: number | null;
  aceiteRealizado: boolean;
  alunoCreatedAt: string | null;
  tipoPortal: string | null;
  processoSeletivoId: number | null;
}> {
  const db = await getDb();
  if (!db) return { needsOnboarding: false, hasMentor: false, hasPdi: false, onboardingLiberado: false, alunoId: null, aceiteRealizado: false, alunoCreatedAt: null, tipoPortal: null, processoSeletivoId: null };

  // Só se aplica a alunos (role === 'user') ou managers com alunoId (visão dupla)
  if (user.role !== 'user' && !(user.role === 'manager' && user.alunoId)) {
    return { needsOnboarding: false, hasMentor: false, hasPdi: false, onboardingLiberado: false, alunoId: null, aceiteRealizado: false, alunoCreatedAt: null, tipoPortal: null, processoSeletivoId: null };
  }

  // Buscar aluno: primeiro pelo alunoId, depois pelo email
  let aluno: any = null;

  if (user.alunoId) {
    const [found] = await db.select()
      .from(alunos)
      .where(eq(alunos.id, user.alunoId))
      .limit(1);
    aluno = found;
  }

  if (!aluno && user.email) {
    const [found] = await db.select()
      .from(alunos)
      .where(eq(alunos.email, user.email.toLowerCase()))
      .limit(1);
    aluno = found;
  }

  if (!aluno) {
    // Aluno não encontrado na tabela alunos - precisa de onboarding
    return { needsOnboarding: true, hasMentor: false, hasPdi: false, onboardingLiberado: false, alunoId: null, aceiteRealizado: false, alunoCreatedAt: null, tipoPortal: null, processoSeletivoId: null };
  }

  const hasMentor = !!aluno.consultorId;
  const onboardingLiberado = aluno.onboardingLiberado === 1;
  const alunoCreatedAt = aluno.createdAt ? new Date(aluno.createdAt).toISOString() : null;

  // Verificar se o aluno já deu aceite no onboarding
  const [jornadaRow] = await db.select({ aceiteRealizado: onboardingJornada.aceiteRealizado })
    .from(onboardingJornada)
    .where(eq(onboardingJornada.alunoId, aluno.id))
    .orderBy(sql`${onboardingJornada.ciclo} DESC`)
    .limit(1);
  const aceiteRealizado = (jornadaRow?.aceiteRealizado ?? 0) === 1;

  // Verificar se o aluno tem PDI (assessment_pdi)
  const [pdiCount] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(assessmentPdi)
    .where(eq(assessmentPdi.alunoId, aluno.id));
  const hasPdi = (pdiCount?.count ?? 0) > 0;

  // Data de corte: alunos cadastrados a partir desta data passam pelo onboarding completo
  const ONBOARDING_CUTOFF = new Date('2026-03-01T00:00:00Z');
  const isAlunoNovo = alunoCreatedAt ? new Date(alunoCreatedAt) >= ONBOARDING_CUTOFF : false;

  // REGRA PRINCIPAL:
  // - Candidato PS (tipoPortal = 'processo_seletivo'): NUNCA precisa de onboarding de desenvolvimento
  // - Aluno VETERANO (antes de 01/03/2026): NÃO precisa de onboarding (acesso direto ao portal)
  // - Aluno NOVO (a partir de 01/03/2026) SEM aceite: precisa completar onboarding
  // - Aluno NOVO COM aceite: onboarding concluído, portal liberado
  // - onboardingLiberado = 1: admin liberou novo ciclo → NÃO bloqueia o portal,
  //   apenas exibe aviso nas páginas de Assessment e Performance
  let needsOnboarding = false;
  if (aluno.tipoPortal === 'processo_seletivo') {
    needsOnboarding = false; // Candidatos PS nunca passam pelo onboarding de desenvolvimento
  } else if (isAlunoNovo && !aceiteRealizado && !onboardingLiberado) {
    needsOnboarding = true; // Aluno novo que ainda não deu aceite no primeiro ciclo
  }

  return {
    needsOnboarding,
    hasMentor,
    hasPdi,
    onboardingLiberado,
    alunoId: aluno.id,
    aceiteRealizado,
    alunoCreatedAt,
    tipoPortal: aluno.tipoPortal ?? 'desenvolvimento',
    processoSeletivoId: aluno.processoSeletivoId ?? null,
  };
}


// ==================== AGENDA DO MENTOR ====================

export async function getMentorAvailability(consultorId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(mentorAvailability)
    .where(eq(mentorAvailability.consultorId, consultorId))
    .orderBy(mentorAvailability.dayOfWeek, mentorAvailability.startTime);
}

export async function saveMentorAvailability(consultorId: number, slots: {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  googleMeetLink?: string;
  isActive: number;
}[]) {
  const db = await getDb();
  if (!db) return { success: false };

  for (const slot of slots) {
    // A3 FIX: Auto-calcular endTime se for igual ao startTime ou vazio
    let endTime = slot.endTime;
    if (!endTime || endTime === slot.startTime) {
      const [h, m] = slot.startTime.split(':').map(Number);
      const totalMin = h * 60 + m + slot.slotDurationMinutes;
      const endH = Math.floor(totalMin / 60) % 24;
      const endM = totalMin % 60;
      endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }
    
    if (slot.id) {
      // Atualizar existente
      await db.update(mentorAvailability)
        .set({
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: endTime,
          slotDurationMinutes: slot.slotDurationMinutes,
          googleMeetLink: slot.googleMeetLink || null,
          isActive: slot.isActive,
        })
        .where(eq(mentorAvailability.id, slot.id));
    } else {
      // Criar novo
      await db.insert(mentorAvailability).values({
        consultorId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: endTime,
        slotDurationMinutes: slot.slotDurationMinutes,
        googleMeetLink: slot.googleMeetLink || null,
        isActive: slot.isActive,
      });
    }
  }
  return { success: true };
}

export async function removeMentorAvailability(id: number) {
  const db = await getDb();
  if (!db) return { success: false };
  await db.delete(mentorAvailability).where(eq(mentorAvailability.id, id));
  return { success: true };
}

// ==================== AGENDA POR DATA ESPECÍFICA ====================

export async function getMentorDateAvailability(consultorId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(mentorDateAvailability)
    .where(eq(mentorDateAvailability.consultorId, consultorId))
    .orderBy(mentorDateAvailability.specificDate, mentorDateAvailability.startTime);
}

export async function saveMentorDateAvailability(consultorId: number, slots: {
  id?: number;
  specificDate: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  googleMeetLink?: string;
  isActive: number;
}[]) {
  const db = await getDb();
  if (!db) return { success: false };

  for (const slot of slots) {
    let endTime = slot.endTime;
    if (!endTime || endTime === slot.startTime) {
      const [h, m] = slot.startTime.split(':').map(Number);
      const totalMin = h * 60 + m + slot.slotDurationMinutes;
      const endH = Math.floor(totalMin / 60) % 24;
      const endM = totalMin % 60;
      endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }
    if (slot.id) {
      await db.update(mentorDateAvailability)
        .set({
          specificDate: slot.specificDate,
          startTime: slot.startTime,
          endTime: endTime,
          slotDurationMinutes: slot.slotDurationMinutes,
          googleMeetLink: slot.googleMeetLink || null,
          isActive: slot.isActive,
        })
        .where(eq(mentorDateAvailability.id, slot.id));
    } else {
      await db.insert(mentorDateAvailability).values({
        consultorId,
        specificDate: slot.specificDate,
        startTime: slot.startTime,
        endTime: endTime,
        slotDurationMinutes: slot.slotDurationMinutes,
        googleMeetLink: slot.googleMeetLink || null,
        isActive: slot.isActive,
      });
    }
  }
  return { success: true };
}

export async function removeMentorDateAvailability(id: number) {
  const db = await getDb();
  if (!db) return { success: false };
  await db.delete(mentorDateAvailability).where(eq(mentorDateAvailability.id, id));
  return { success: true };
}

export async function getMentorAppointments(consultorId: number, filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  alunoId?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(mentorAppointments.consultorId, consultorId)];
  if (filters?.status) {
    conditions.push(eq(mentorAppointments.status, filters.status as any));
  }
  if (filters?.dateFrom) {
    conditions.push(gte(mentorAppointments.scheduledDate, filters.dateFrom));
  }
  if (filters?.dateTo) {
    conditions.push(lte(mentorAppointments.scheduledDate, filters.dateTo));
  }

  const appointments = await db.select().from(mentorAppointments)
    .where(and(...conditions))
    .orderBy(desc(mentorAppointments.scheduledDate), mentorAppointments.startTime);

  // Buscar participantes de cada agendamento
  const allAlunos = await getAlunos();
  const alunoMap = new Map(allAlunos.map(a => [a.id, a]));
  const result = [];
  for (const appt of appointments) {
    let participants = await db.select().from(appointmentParticipants)
      .where(eq(appointmentParticipants.appointmentId, appt.id));

    // Fallback para agendamentos grupais sem participantes cadastrados:
    // inclui todos os alunos ativos do consultor como participantes temporários
    if (participants.length === 0 && (appt.type === 'grupo' || appt.type === 'grupal' || String(appt.type).includes('grup'))) {
      const alunosDoConsultor = allAlunos.filter(a => a.consultorId === appt.consultorId && a.isActive === 1);
      participants = alunosDoConsultor.map(a => ({
        id: 0,
        appointmentId: appt.id,
        alunoId: a.id,
        status: 'convidado' as const,
        confirmedAt: null,
        notes: null,
        createdAt: new Date(),
      }));
    }

    // Filtrar por alunoId se fornecido
    if (filters?.alunoId && !participants.some(p => p.alunoId === filters.alunoId)) {
      continue;
    }

    const enrichedParticipants = participants.map(p => ({
      ...p,
      alunoName: alunoMap.get(p.alunoId)?.name || 'Desconhecido',
      alunoEmail: alunoMap.get(p.alunoId)?.email || '',
      alunoTelefone: alunoMap.get(p.alunoId)?.telefone || '',
    }));

    result.push({
      ...appt,
      participants: enrichedParticipants,
    });
  }

  return result;
}

export async function getAppointmentsForDate(consultorId: number, date: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(mentorAppointments)
    .where(and(
      eq(mentorAppointments.consultorId, consultorId),
      eq(mentorAppointments.scheduledDate, date),
      ne(mentorAppointments.status, 'cancelado' as any),
    ));
}

export async function checkAppointmentConflict(consultorId: number, date: string, startTime: string) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(mentorAppointments)
    .where(and(
      eq(mentorAppointments.consultorId, consultorId),
      eq(mentorAppointments.scheduledDate, date),
      eq(mentorAppointments.startTime, startTime),
      ne(mentorAppointments.status, 'cancelado' as any),
    ))
    .limit(1);
  return results[0] || null;
}

export async function createGroupAppointment(data: {
  consultorId: number;
  title: string;
  description: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  googleMeetLink: string | null;
  alunoIds: number[];
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) return { success: false, id: 0 };

  const [result] = await db.insert(mentorAppointments).values({
    consultorId: data.consultorId,
    scheduledDate: data.scheduledDate,
    startTime: data.startTime,
    endTime: data.endTime,
    googleMeetLink: data.googleMeetLink,
    type: 'grupo',
    title: data.title,
    description: data.description,
    status: 'agendado',
    createdBy: data.createdBy,
  });

  const appointmentId = result.insertId;

  // Criar participantes (todos como "convidado")
  for (const alunoId of data.alunoIds) {
    await db.insert(appointmentParticipants).values({
      appointmentId,
      alunoId,
      status: 'convidado',
    });
  }

  return { success: true, id: appointmentId };
}

export async function createIndividualAppointment(data: {
  consultorId: number;
  availabilityId: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  googleMeetLink: string | null;
  alunoId: number;
  notes: string | null;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) return { success: false, id: 0 };

  // Buscar link do Meet da disponibilidade
  const avail = await db.select().from(mentorAvailability)
    .where(eq(mentorAvailability.id, data.availabilityId))
    .limit(1);
  const meetLink = avail[0]?.googleMeetLink || data.googleMeetLink;

  const [result] = await db.insert(mentorAppointments).values({
    consultorId: data.consultorId,
    availabilityId: data.availabilityId,
    scheduledDate: data.scheduledDate,
    startTime: data.startTime,
    endTime: data.endTime,
    googleMeetLink: meetLink,
    type: 'individual',
    title: null,
    description: null,
    status: 'confirmado',
    createdBy: data.createdBy,
  });

  const appointmentId = result.insertId;

  // Criar participante (já confirmado para individual)
  await db.insert(appointmentParticipants).values({
    appointmentId,
    alunoId: data.alunoId,
    status: 'confirmado',
    confirmedAt: new Date(),
    notes: data.notes,
  });

  return { success: true, id: appointmentId };
}

export async function respondToAppointmentInvite(
  appointmentId: number, alunoId: number, response: 'confirmado' | 'recusado', notes: string | null
) {
  const db = await getDb();
  if (!db) return { success: false };

  await db.update(appointmentParticipants)
    .set({
      status: response,
      confirmedAt: response === 'confirmado' ? new Date() : null,
      notes,
    })
    .where(and(
      eq(appointmentParticipants.appointmentId, appointmentId),
      eq(appointmentParticipants.alunoId, alunoId),
    ));

  // Se todos confirmaram, atualizar status do agendamento
  const allParticipants = await db.select().from(appointmentParticipants)
    .where(eq(appointmentParticipants.appointmentId, appointmentId));

  const allConfirmed = allParticipants.every(p => p.status === 'confirmado');
  if (allConfirmed) {
    await db.update(mentorAppointments)
      .set({ status: 'confirmado' })
      .where(eq(mentorAppointments.id, appointmentId));
  }

  return { success: true };
}

export async function cancelAppointment(appointmentId: number) {
  const db = await getDb();
  if (!db) return { success: false };
  await db.update(mentorAppointments)
    .set({ status: 'cancelado' })
    .where(eq(mentorAppointments.id, appointmentId));
  return { success: true };
}

export async function getAppointmentById(appointmentId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(mentorAppointments).where(eq(mentorAppointments.id, appointmentId));
  return rows[0] || null;
}

export async function getAppointmentParticipants(appointmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(appointmentParticipants).where(eq(appointmentParticipants.appointmentId, appointmentId));
}

export async function updateAppointmentSchedule(appointmentId: number, data: {
  scheduledDate: string;
  startTime: string;
  endTime: string;
  googleMeetLink?: string | null;
}) {
  const db = await getDb();
  if (!db) return { success: false };
  const updateData: any = {
    scheduledDate: data.scheduledDate,
    startTime: data.startTime,
    endTime: data.endTime,
  };
  if (data.googleMeetLink !== undefined) {
    updateData.googleMeetLink = data.googleMeetLink;
  }
  await db.update(mentorAppointments)
    .set(updateData)
    .where(eq(mentorAppointments.id, appointmentId));
  return { success: true };
}

export async function getAlunoInvites(alunoId: number) {
  const db = await getDb();
  if (!db) return [];

  const participations = await db.select().from(appointmentParticipants)
    .where(and(
      eq(appointmentParticipants.alunoId, alunoId),
      eq(appointmentParticipants.status, 'convidado'),
    ));

  const result = [];
  for (const p of participations) {
    const [appt] = await db.select().from(mentorAppointments)
      .where(eq(mentorAppointments.id, p.appointmentId));
    if (appt && appt.status !== 'cancelado') {
      // Buscar nome do mentor
      const consultorsList = await getConsultors();
      const mentor = consultorsList.find(c => c.id === appt.consultorId);
      result.push({
        ...appt,
        mentorName: mentor?.name || 'Mentor',
        participantId: p.id,
      });
    }
  }

  return result;
}

export async function getAlunoAppointments(alunoId: number) {
  const db = await getDb();
  if (!db) return [];

  // Se o aluno está em novo ciclo (onboardingLiberado=1), filtrar apenas agendamentos
  // criados após a data de liberação do novo ciclo para não confundir com o ciclo anterior
  const [alunoRow] = await db.select({
    onboardingLiberado: alunos.onboardingLiberado,
    onboardingLiberadoEm: alunos.onboardingLiberadoEm,
  }).from(alunos).where(eq(alunos.id, alunoId)).limit(1);

  const participations = await db.select().from(appointmentParticipants)
    .where(eq(appointmentParticipants.alunoId, alunoId));

  // Data de corte para novo ciclo: ignorar agendamentos anteriores à liberação
  const novoCicloLiberadoEm = alunoRow?.onboardingLiberado === 1 && alunoRow?.onboardingLiberadoEm
    ? new Date(alunoRow.onboardingLiberadoEm)
    : null;

  const result = [];
  for (const p of participations) {
    const [appt] = await db.select().from(mentorAppointments)
      .where(eq(mentorAppointments.id, p.appointmentId));
    if (appt && appt.status !== 'cancelado') {
      // Se em novo ciclo, ignorar agendamentos criados antes da liberação do ciclo
      if (novoCicloLiberadoEm && appt.createdAt && new Date(appt.createdAt) < novoCicloLiberadoEm) {
        continue;
      }
      const consultorsList = await getConsultors();
      const mentor = consultorsList.find(c => c.id === appt.consultorId);

      // Buscar todos os participantes para sessões de grupo
      let participants: { alunoId: number; alunoName: string; status: string }[] = [];
      if (appt.type === 'grupo' || appt.type === 'grupal' || String(appt.type).includes('grup')) {
        const allP = await db.select().from(appointmentParticipants)
          .where(eq(appointmentParticipants.appointmentId, appt.id));
        const allAlunos = await getAlunos();
        const alunoMap = new Map(allAlunos.map(a => [a.id, a]));
        participants = allP.map(pp => ({
          alunoId: pp.alunoId,
          alunoName: alunoMap.get(pp.alunoId)?.name || 'Desconhecido',
          status: pp.status,
        }));
      }

      result.push({
        ...appt,
        mentorName: mentor?.name || 'Mentor',
        myStatus: p.status,
        participants,
      });
    }
  }

  return result.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
}


// ==================== GERENTES DE EMPRESA (VISÃO DUPLA) ====================

/**
 * Promover um aluno a gerente de empresa.
 * Atualiza o user existente (se houver) para role='manager' e vincula programId.
 * Se não existir user, cria um novo com role='manager'.
 */
export async function promoteAlunoToGerente(alunoId: number, programId: number): Promise<{ success: boolean; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };

  // Verificar se o aluno existe
  const [aluno] = await db.select().from(alunos).where(eq(alunos.id, alunoId)).limit(1);
  if (!aluno) return { success: false, message: "Aluno não encontrado" };

  // Verificar se já existe user vinculado a este aluno
  const [existingUser] = await db.select().from(users).where(eq(users.alunoId, alunoId)).limit(1);

  if (existingUser) {
    // Atualizar user existente para manager
    await db.update(users)
      .set({ role: 'manager', programId, alunoId })
      .where(eq(users.id, existingUser.id));
    return { success: true, message: `${aluno.name} promovido a gerente com sucesso.` };
  }

  // Verificar se existe user pelo email
  if (aluno.email) {
    const [userByEmail] = await db.select().from(users).where(eq(users.email, aluno.email.toLowerCase())).limit(1);
    if (userByEmail) {
      await db.update(users)
        .set({ role: 'manager', programId, alunoId })
        .where(eq(users.id, userByEmail.id));
      return { success: true, message: `${aluno.name} promovido a gerente com sucesso.` };
    }
  }

  // Criar novo user manager
  const openId = `gerente_aluno_${alunoId}`;
  await db.insert(users).values({
    openId,
    name: aluno.name,
    email: aluno.email?.toLowerCase() || null,
    cpf: aluno.cpf || null,
    role: 'manager' as const,
    loginMethod: aluno.cpf ? 'email_cpf' : 'email_id',
    isActive: 1,
    alunoId,
    programId,
    lastSignedIn: new Date(),
  });

  return { success: true, message: `${aluno.name} promovido a gerente com sucesso.` };
}

/**
 * Criar gerente puro (sem perfil de aluno).
 * Cria registro na tabela consultors E na tabela users.
 */
export async function createGerentePuro(data: {
  name: string;
  email: string;
  cpf?: string;
  programId: number;
}): Promise<{ success: boolean; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };

  // Verificar se já existe um gerente ativo com o mesmo email
  const normalizedEmail = data.email.toLowerCase().trim();
  const [existingGerente] = await db.select()
    .from(consultors)
    .where(and(
      eq(consultors.email, normalizedEmail),
      eq(consultors.role, 'gerente'),
      eq(consultors.isActive, 1)
    ))
    .limit(1);
  
  if (existingGerente) {
    return { success: false, message: `Já existe um gerente cadastrado com o email ${normalizedEmail}. Verifique a lista de gerentes.` };
  }

  // Verificar CPF duplicado antecipadamente
  if (data.cpf) {
    const normalizedCpf = data.cpf.replace(/\D/g, '');
    const [existingCpfUser] = await db.select().from(users).where(and(eq(users.cpf, normalizedCpf), eq(users.isActive, 1))).limit(1);
    if (existingCpfUser) {
      return { success: false, message: "Este CPF já está cadastrado no sistema." };
    }
  }

  // Criar registro na tabela consultors
  const [consultorResult] = await db.insert(consultors).values({
    name: data.name,
    email: data.email.toLowerCase(),
    cpf: data.cpf?.replace(/\D/g, '') || null,
    role: 'gerente' as const,
    managedProgramId: data.programId,
    canLogin: data.cpf ? 1 : 0,
    isActive: 1,
  });

  const consultorId = consultorResult.insertId;

  // Criar registro na tabela users para login
  if (data.cpf) {
    const normalizedCpf = data.cpf.replace(/\D/g, '');
    const openId = `gerente_puro_${consultorId}`;

    await db.insert(users).values({
      openId,
      name: data.name,
      email: data.email.toLowerCase(),
      cpf: normalizedCpf,
      role: 'manager' as const,
      loginMethod: 'email_cpf',
      isActive: 1,
      consultorId: Number(consultorId),
      programId: data.programId,
      lastSignedIn: new Date(),
    });
  }

  return { success: true, message: `Gerente ${data.name} criado com sucesso.` };
}

/**
 * Remover papel de gerente de um user (voltar a ser aluno).
 */
export async function removeGerenteRole(userId: number): Promise<{ success: boolean; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { success: false, message: "Usuário não encontrado" };

  if (user.alunoId) {
    // Tem perfil de aluno → volta para role='user'
    await db.update(users)
      .set({ role: 'user' })
      .where(eq(users.id, userId));
    return { success: true, message: "Papel de gerente removido. Usuário voltou a ser aluno." };
  } else {
    // Gerente puro → desativar
    await db.update(users)
      .set({ isActive: 0 })
      .where(eq(users.id, userId));
    return { success: true, message: "Gerente desativado com sucesso." };
  }
}

/**
 * Listar gerentes de empresa com informações completas.
 * Retorna dados do user + dados do aluno vinculado (se houver).
 */
export async function getGerentesEmpresa(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const managerUsers = await db.select()
    .from(users)
    .where(and(
      eq(users.role, 'manager'),
      eq(users.isActive, 1)
    ))
    .orderBy(users.name);

  const allAlunos = await db.select().from(alunos);
  const allPrograms = await db.select().from(programs);
  const allTurmas = await db.select().from(turmas);
  const allConsultors = await db.select().from(consultors);
  const allMentoringSessions = await db.select().from(mentoringSessions);
  
  const alunoMap = new Map(allAlunos.map(a => [a.id, a]));
  const programMap = new Map(allPrograms.map(p => [p.id, p]));
  const turmaMap = new Map(allTurmas.map(t => [t.id, t]));
  const consultorMap = new Map(allConsultors.map(c => [c.id, c]));
  
  // Mapear alunoId -> mentorId (primeiro mentor encontrado)
  const alunoMentorMap = new Map<number, number>();
  for (const ms of allMentoringSessions) {
    if (ms.alunoId && ms.consultorId && !alunoMentorMap.has(ms.alunoId)) {
      alunoMentorMap.set(ms.alunoId, ms.consultorId);
    }
  }

  return managerUsers
    .filter(u => {
      // Incluir:
      // 1. Gerentes sem consultorId (criados via Gestão de Acesso)
      // 2. Gerentes com alunoId (aluno promovido a gerente)
      // 3. Gerentes puros com consultorId vinculado a consultor role='gerente' (criados via createGerentePuro)
      // Excluir: mentores (consultorId vinculado a consultor role='mentor')
      if (!u.consultorId) return true; // Sem consultorId = gerente de acesso
      if (u.alunoId) return true; // Tem alunoId = aluno+gerente
      // Tem consultorId: verificar se é gerente ou mentor
      const consultor = consultorMap.get(u.consultorId);
      return consultor?.role === 'gerente'; // Incluir se for gerente puro
    })
    .map(u => {
      const aluno = u.alunoId ? alunoMap.get(u.alunoId) : null;
      const program = u.programId ? programMap.get(u.programId) : null;
      const turma = aluno?.turmaId ? turmaMap.get(aluno.turmaId) : null;
      const mentorId = u.alunoId ? alunoMentorMap.get(u.alunoId) : null;
      const mentor = mentorId ? consultorMap.get(mentorId) : null;
      return {
        id: u.id,
        name: aluno?.name || u.name,
        email: aluno?.email || u.email,
        cpf: aluno?.cpf || u.cpf,
        role: u.role,
        programId: u.programId,
        programName: program?.name || null,
        alunoId: u.alunoId,
        alunoName: aluno?.name || null,
        isAlsoStudent: !!u.alunoId,
        consultorId: u.consultorId,
        turmaId: aluno?.turmaId || null,
        turmaName: turma?.name || null,
        mentorId: mentorId || null,
        mentorName: mentor?.name || null,
        createdAt: u.createdAt,
      };
    });
}

/**
 * Buscar alunos de uma empresa para o select de "Promover a Gerente"
 */
export async function getAlunosByProgram(programId: number): Promise<{ id: number; name: string; email: string | null }[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    id: alunos.id,
    name: alunos.name,
    email: alunos.email,
  })
    .from(alunos)
    .where(and(
      eq(alunos.programId, programId),
      eq(alunos.isActive, 1)
    ))
    .orderBy(alunos.name);

  return result;
}


/**
 * Buscar jornadas agrupadas por turma para o Dashboard Gestor
 * Retorna macro jornadas com micro ciclos (competências) agrupados por turma
 */
export async function getJornadasPorTurma(empresa?: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar todos os assessment_pdi (ativo E congelado) com turma e trilha
  // Ambos os status devem ser exibidos no gráfico de timeline
  const pdis = await db.select({
    id: assessmentPdi.id,
    alunoId: assessmentPdi.alunoId,
    turmaId: assessmentPdi.turmaId,
    trilhaId: assessmentPdi.trilhaId,
    macroInicio: assessmentPdi.macroInicio,
    macroTermino: assessmentPdi.macroTermino,
    status: assessmentPdi.status,
  }).from(assessmentPdi)
    .where(sql`${assessmentPdi.status} IN ('ativo', 'congelado')`);
  
  if (pdis.length === 0) return [];
  
  // Buscar turmas e trilhas
  const turmasList = await db.select().from(turmas);
  const trilhasList = await db.select().from(trilhas);
  const turmaMap = new Map(turmasList.map(t => [t.id, t]));
  const trilhaMap = new Map(trilhasList.map(t => [t.id, t]));
  
  // Filtrar por empresa se necessário
  let filteredPdis = pdis;
  if (empresa) {
    const programsList = await db.select().from(programs);
    const alunosList = await db.select({ id: alunos.id, programId: alunos.programId, name: alunos.name }).from(alunos);
    const alunoMap = new Map(alunosList.map(a => [a.id, a]));
    const programMap = new Map(programsList.map(p => [p.id, p]));
    
    filteredPdis = pdis.filter(pdi => {
      const aluno = alunoMap.get(pdi.alunoId);
      if (!aluno || !aluno.programId) return false;
      const nameLower = (aluno.name || '').toLowerCase();
      if (nameLower.includes('teste') || nameLower.includes('test')) return false;
      const program = programMap.get(aluno.programId);
      return program?.name === empresa;
    });
  }
  
  // Buscar competências de todos os PDIs filtrados
  const pdiIds = filteredPdis.map(p => p.id);
  if (pdiIds.length === 0) return [];
  
  const allComps = await db.select({
    id: assessmentCompetencias.id,
    assessmentPdiId: assessmentCompetencias.assessmentPdiId,
    competenciaId: assessmentCompetencias.competenciaId,
    microInicio: assessmentCompetencias.microInicio,
    microTermino: assessmentCompetencias.microTermino,
  }).from(assessmentCompetencias)
    .where(sql`${assessmentCompetencias.assessmentPdiId} IN (${sql.join(pdiIds.map(id => sql`${id}`), sql`, `)})`);
  
  const compMap = new Map<number, string>();
  const compsList = await db.select({ id: competencias.id, nome: competencias.nome }).from(competencias);
  compsList.forEach(c => compMap.set(c.id, c.nome));
  
  // Buscar programs map para pegar nomes de empresas
  const programsList = await db.select().from(programs);
  const alunosList = await db.select({ id: alunos.id, programId: alunos.programId, name: alunos.name }).from(alunos);
  const alunoMap = new Map(alunosList.map(a => [a.id, a]));
  
  // Filtrar PDIs de alunos de teste
  filteredPdis = filteredPdis.filter(pdi => {
    const aluno = alunoMap.get(pdi.alunoId);
    if (!aluno) return false;
    const nameLower = (aluno.name || '').toLowerCase();
    return !nameLower.includes('teste') && !nameLower.includes('test');
  });
  const programMap = new Map(programsList.map(p => [p.id, p]));
  
  // Agrupar por turma + trilha + macroInicio (para suportar turmas com múltiplas trilhas)
  const turmaGroups = new Map<string, {
    turmaId: number;
    turmaNome: string;
    turmaCode: string; // BS1, BS2, BS3
    trilhaNome: string;
    empresaNome: string;
    macroInicio: string | null;
    macroTermino: string | null;
    qtdAlunos: number;
    microCiclos: { competencia: string; microInicio: string | null; microTermino: string | null }[];
  }>();
  
  for (const pdi of filteredPdis) {
    const turma = pdi.turmaId ? turmaMap.get(pdi.turmaId) : null;
    const trilha = pdi.trilhaId ? trilhaMap.get(pdi.trilhaId) : null;
    if (!turma) continue;
    
    // Extrair código da turma (BS1, BS2, BS3)
    const codeMatch = turma.name.match(/\[(BS\d+)\]/);
    const turmaCode = codeMatch ? codeMatch[1] : turma.name;
    
    const key = `${pdi.turmaId}_${pdi.trilhaId}_${pdi.macroInicio}`;
    if (!turmaGroups.has(key)) {
      // Buscar micro ciclos para esta turma (pegar de qualquer aluno, são iguais)
      const pdiComps = allComps.filter(c => c.assessmentPdiId === pdi.id);
      const microCiclos = pdiComps.map(c => ({
        competencia: compMap.get(c.competenciaId) || 'Desconhecida',
        microInicio: c.microInicio,
        microTermino: c.microTermino,
      })).sort((a, b) => {
        if (!a.microInicio || !b.microInicio) return 0;
        return new Date(a.microInicio).getTime() - new Date(b.microInicio).getTime();
      });
      
      // Buscar nome da empresa
      const aluno = alunoMap.get(pdi.alunoId);
      const program = aluno && aluno.programId ? programMap.get(aluno.programId) : null;
      const empresaNome = program?.name || 'Sem Empresa';
      
      turmaGroups.set(key, {
        turmaId: key,
        turmaNome: turma.name,
        turmaCode,
        trilhaNome: trilha?.name || 'Não definida',
        empresaNome,
        macroInicio: pdi.macroInicio,
        macroTermino: pdi.macroTermino,
        qtdAlunos: 1,
        microCiclos,
      });
    } else {
      turmaGroups.get(key)!.qtdAlunos++;
    }
  }
  
  return Array.from(turmaGroups.values()).sort((a, b) => {
    if (!a.macroInicio || !b.macroInicio) return 0;
    return new Date(a.macroInicio).getTime() - new Date(b.macroInicio).getTime();
  });
}

export async function updateReport(id: number, data: { fileKey?: string; fileUrl?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(reports).set(data).where(eq(reports.id, id));
}


// ============ TRILHAS REAIS POR ALUNO (via assessment_pdi) ============

/**
 * Retorna um Map de alunoId -> array de nomes de trilhas reais
 * Baseado nos assessment_pdi de cada aluno, não no nome da turma
 */
export async function getTrilhasReaisPorAluno(): Promise<Map<number, string[]>> {
  const db = await getDb();
  if (!db) return new Map();
  
  const allPdis = await db.select({
    alunoId: assessmentPdi.alunoId,
    trilhaId: assessmentPdi.trilhaId,
  }).from(assessmentPdi);
  
  const allTrilhas = await db.select({ id: trilhas.id, name: trilhas.name }).from(trilhas);
  const trilhaMap = new Map(allTrilhas.map(t => [t.id, t.name]));
  
  const result = new Map<number, string[]>();
  for (const pdi of allPdis) {
    const trilhaNome = trilhaMap.get(pdi.trilhaId) || `Trilha ${pdi.trilhaId}`;
    if (!result.has(pdi.alunoId)) {
      result.set(pdi.alunoId, []);
    }
    const arr = result.get(pdi.alunoId)!;
    if (!arr.includes(trilhaNome)) {
      arr.push(trilhaNome);
    }
  }
  
  return result;
}


/**
 * Get all assessment PDIs (for checking frozen status across all students)
 */
export async function getAllAssessmentPdis() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(assessmentPdi);
}


// ============ METAS DE DESENVOLVIMENTO ============

/**
 * Listar metas de um aluno (opcionalmente filtrar por competência ou assessment)
 */
export async function getMetasByAluno(alunoId: number, assessmentPdiId?: number, contratoNivelId?: number | null) {
  const db = await getDb();
  if (!db) return [];
  
  if (assessmentPdiId && contratoNivelId) {
    return await db.select().from(metas)
      .where(and(
        eq(metas.alunoId, alunoId),
        eq(metas.assessmentPdiId, assessmentPdiId),
        eq(metas.contratoNivelId, contratoNivelId),
        eq(metas.isActive, 1)
      ))
      .orderBy(metas.competenciaId, metas.createdAt);
  }

  if (assessmentPdiId) {
    return await db.select().from(metas)
      .where(and(eq(metas.alunoId, alunoId), eq(metas.assessmentPdiId, assessmentPdiId), eq(metas.isActive, 1)))
      .orderBy(metas.competenciaId, metas.createdAt);
  }
  
  const conditions = [eq(metas.alunoId, alunoId), eq(metas.isActive, 1)];
  if (contratoNivelId) conditions.push(eq(metas.contratoNivelId, contratoNivelId));
  return await db.select().from(metas)
    .where(and(...conditions))
    .orderBy(metas.competenciaId, metas.createdAt);
}

/**
 * Listar metas de um aluno por competência específica
 */
export async function getMetasByCompetencia(alunoId: number, assessmentCompetenciaId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(metas)
    .where(and(
      eq(metas.alunoId, alunoId),
      eq(metas.assessmentCompetenciaId, assessmentCompetenciaId),
      eq(metas.isActive, 1)
    ))
    .orderBy(metas.createdAt);
}

/**
 * Criar uma nova meta
 */
export async function createMeta(data: InsertMeta) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await assertNivelPermiteNovasAtribuicoes(data.alunoId, data.contratoNivelId, "metas.create");

  let contratoNivelId = data.contratoNivelId ?? null;
  if (!contratoNivelId && data.assessmentPdiId) {
    const [pdi] = await db.select({ contratoNivelId: assessmentPdi.contratoNivelId })
      .from(assessmentPdi)
      .where(eq(assessmentPdi.id, data.assessmentPdiId))
      .limit(1);
    contratoNivelId = pdi?.contratoNivelId ?? null;
  }
  if (!contratoNivelId) {
    contratoNivelId = await resolveContratoNivelId(data.alunoId, null);
  }

  const result = await db.insert(metas).values({ ...data, contratoNivelId });
  return { id: Number(result[0].insertId) };
}

export async function getMetasDetalhadasByNivel(alunoId: number, contratoNivelId?: number | null) {
  if (!contratoNivelId) {
    return getMetasDetalhadas(alunoId);
  }
  const db = await getDb();
  if (!db) return [];
  return db.select().from(metas).where(and(
    eq(metas.alunoId, alunoId),
    eq(metas.contratoNivelId, contratoNivelId),
    eq(metas.isActive, 1),
  )).orderBy(metas.createdAt);
}

/**
 * Aluno envia evidência de uma micro meta (Jornada de Superação).
 * Evidência e validação são próprias da meta — não dependem de sessão de mentoria.
 * Status muda para 'entregue' (aguardando validação da mentora).
 */
export async function submitMetaEvidencia(
  metaId: number,
  alunoId: number,
  data: {
    relatoAluno?: string | null;
    evidenceLink?: string | null;
    evidenceImageUrl?: string | null;
    evidenceImageKey?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [meta] = await db.select().from(metas).where(eq(metas.id, metaId)).limit(1);
  if (!meta) throw new Error("Meta não encontrada");
  if (meta.alunoId !== alunoId) throw new Error("Meta não pertence a este aluno");
  if (meta.status === 'validada') throw new Error("Esta meta já foi validada pela mentora e não pode ser alterada");

  await db.update(metas).set({
    relatoAluno: data.relatoAluno ?? null,
    evidenceLink: data.evidenceLink ?? null,
    evidenceImageUrl: data.evidenceImageUrl ?? null,
    evidenceImageKey: data.evidenceImageKey ?? null,
    submittedAt: new Date(),
    status: 'entregue',
    // Reenvio após rejeição limpa o motivo anterior
    motivoRejeicao: null,
  }).where(eq(metas.id, metaId));

  return { success: true };
}

/**
 * Mentora valida a evidência enviada pelo aluno para uma micro meta.
 * Só a partir da validação a meta conta como cumprida no indicador
 * "Jornada de Superação" (percentual e "X de Y metas cumpridas").
 */
export async function validarMetaEvidencia(metaId: number, consultorId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [meta] = await db.select().from(metas).where(eq(metas.id, metaId)).limit(1);
  if (!meta) throw new Error("Meta não encontrada");
  if (meta.status === 'validada') return { success: true, alreadyValidated: true };
  if (meta.status !== 'entregue') throw new Error("Só é possível validar metas com evidência ENVIADA (aguardando validação)");

  await db.update(metas).set({
    status: 'validada',
    validatedBy: consultorId,
    validatedAt: new Date(),
  }).where(eq(metas.id, metaId));

  return { success: true, alreadyValidated: false };
}

/**
 * Mentora rejeita/devolve a evidência enviada — volta para 'pendente' para o
 * aluno reenviar, com o motivo registrado.
 */
export async function rejeitarMetaEvidencia(metaId: number, motivo: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [meta] = await db.select().from(metas).where(eq(metas.id, metaId)).limit(1);
  if (!meta) throw new Error("Meta não encontrada");
  if (meta.status !== 'entregue') throw new Error("Só é possível devolver metas com evidência ENVIADA (aguardando validação)");

  await db.update(metas).set({
    status: 'pendente',
    motivoRejeicao: motivo,
  }).where(eq(metas.id, metaId));

  return { success: true };
}

/**
 * Atualizar uma meta existente
 */
export async function updateMeta(id: number, data: Partial<InsertMeta>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(metas).set(data).where(eq(metas.id, id));
  return { success: true };
}

/**
 * Desativar (soft delete) uma meta
 */
export async function deleteMeta(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(metas).set({ isActive: 0 }).where(eq(metas.id, id));
  return { success: true };
}

/**
 * Listar acompanhamentos de metas de um aluno
 */
export async function getMetaAcompanhamentos(alunoId: number, metaId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (metaId) {
    return await db.select().from(metaAcompanhamento)
      .where(and(eq(metaAcompanhamento.alunoId, alunoId), eq(metaAcompanhamento.metaId, metaId)))
      .orderBy(desc(metaAcompanhamento.ano), desc(metaAcompanhamento.mes));
  }
  
  return await db.select().from(metaAcompanhamento)
    .where(eq(metaAcompanhamento.alunoId, alunoId))
    .orderBy(desc(metaAcompanhamento.ano), desc(metaAcompanhamento.mes));
}

/**
 * Registrar ou atualizar acompanhamento mensal de uma meta
 */
export async function upsertMetaAcompanhamento(data: InsertMetaAcompanhamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe registro para este mês/ano/meta
  const existing = await db.select().from(metaAcompanhamento)
    .where(and(
      eq(metaAcompanhamento.metaId, data.metaId),
      eq(metaAcompanhamento.mes, data.mes),
      eq(metaAcompanhamento.ano, data.ano)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(metaAcompanhamento)
      .set({ status: data.status, observacao: data.observacao, registradoPor: data.registradoPor })
      .where(eq(metaAcompanhamento.id, existing[0].id));
    return { id: existing[0].id, updated: true };
  }
  
  const result = await db.insert(metaAcompanhamento).values(data);
  return { id: Number(result[0].insertId), updated: false };
}

/**
 * Obter resumo de metas por aluno (total, cumpridas, % por competência)
 */
export async function getMetasResumo(alunoId: number) {
  const db = await getDb();
  if (!db) return { total: 0, cumpridas: 0, percentual: 0, porCompetencia: [] };
  
  // Buscar todas as metas ativas do aluno, excluindo as vinculadas a PDIs congelados (ciclo anterior)
  const allMetasRaw = await db.select().from(metas)
    .where(and(eq(metas.alunoId, alunoId), eq(metas.isActive, 1)));
  
  // Filtrar metas cujo PDI está congelado (pertencem ao ciclo anterior)
  const pdiIds = Array.from(new Set(allMetasRaw.map(m => m.assessmentPdiId).filter(Boolean)));
  const pdisStatus = pdiIds.length > 0
    ? await db.select({ id: assessmentPdi.id, status: assessmentPdi.status }).from(assessmentPdi).where(inArray(assessmentPdi.id, pdiIds as number[]))
    : [];
  const pdiStatusMap = new Map(pdisStatus.map(p => [p.id, p.status]));
  const allMetas = allMetasRaw.filter(m => {
    const pdiStatus = pdiStatusMap.get(m.assessmentPdiId);
    return pdiStatus !== 'congelado';
  });
  
  if (allMetas.length === 0) return { total: 0, cumpridas: 0, percentual: 0, porCompetencia: [] };
  
  // Cumprida = evidência validada pela mentora (metas.status = 'validada')
  const cumpridas = allMetas.filter(m => m.status === 'validada').length;
  
  // Agrupar por competência
  const porCompetenciaMap = new Map<number, { competenciaId: number, assessmentCompetenciaId: number, total: number, cumpridas: number }>();
  for (const meta of allMetas) {
    const key = meta.assessmentCompetenciaId;
    if (!porCompetenciaMap.has(key)) {
      porCompetenciaMap.set(key, { competenciaId: meta.competenciaId, assessmentCompetenciaId: key, total: 0, cumpridas: 0 });
    }
    const entry = porCompetenciaMap.get(key)!;
    entry.total++;
    if (meta.status === 'validada') entry.cumpridas++;
  }
  
  const porCompetencia = Array.from(porCompetenciaMap.values()).map(c => ({
    ...c,
    percentual: c.total > 0 ? Math.round((c.cumpridas / c.total) * 100) : 0
  }));
  
  return {
    total: allMetas.length,
    cumpridas,
    percentual: Math.round((cumpridas / allMetas.length) * 100),
    porCompetencia
  };
}

/**
 * Obter metas com detalhes completos (meta + último acompanhamento + nome competência)
 */
export async function getMetasDetalhadas(alunoId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const allMetasRaw = await db.select().from(metas)
    .where(and(eq(metas.alunoId, alunoId), eq(metas.isActive, 1)))
    .orderBy(metas.competenciaId, metas.createdAt);
  
  if (allMetasRaw.length === 0) return [];
  
  // Filtrar metas cujo PDI está congelado (pertencem ao ciclo anterior)
  const pdiIds = Array.from(new Set(allMetasRaw.map(m => m.assessmentPdiId).filter(Boolean)));
  const pdisStatus = pdiIds.length > 0
    ? await db.select({ id: assessmentPdi.id, status: assessmentPdi.status }).from(assessmentPdi).where(inArray(assessmentPdi.id, pdiIds as number[]))
    : [];
  const pdiStatusMap = new Map(pdisStatus.map(p => [p.id, p.status]));
  const allMetas = allMetasRaw.filter(m => pdiStatusMap.get(m.assessmentPdiId) !== 'congelado');
  
  if (allMetas.length === 0) return [];
  
  const metaIds = allMetas.map(m => m.id);
  const allAcomp = await db.select().from(metaAcompanhamento)
    .where(inArray(metaAcompanhamento.metaId, metaIds));
  
  // Buscar nomes das competências
  const compIds = Array.from(new Set(allMetas.map(m => m.competenciaId)));
  const comps = compIds.length > 0 
    ? await db.select({ id: competencias.id, nome: competencias.nome }).from(competencias).where(inArray(competencias.id, compIds))
    : [];
  const compMap = new Map(comps.map(c => [c.id, c.nome]));
  
  return allMetas.map(meta => {
    const acomps = allAcomp
      .filter(a => a.metaId === meta.id)
      .sort((a, b) => (b.ano * 100 + b.mes) - (a.ano * 100 + a.mes));
    const ultimoAcompanhamento = acomps.length > 0 ? acomps[0] : null;
    return {
      ...meta,
      competenciaNome: compMap.get(meta.competenciaId) || 'Desconhecida',
      ultimoStatus: ultimoAcompanhamento?.status || null,
      ultimoMes: ultimoAcompanhamento?.mes || null,
      ultimoAno: ultimoAcompanhamento?.ano || null,
      ultimaObservacao: ultimoAcompanhamento?.observacao || null,
      historicoAcompanhamento: acomps
    };
  });
}

/**
 * Obter resumo de metas para todos os alunos (para Dashboard Gestor)
 */
export async function getMetasResumoTodos() {
  const db = await getDb();
  if (!db) return [];
  
  const allMetas = await db.select().from(metas).where(eq(metas.isActive, 1));
  if (allMetas.length === 0) return [];
  
  // Buscar dados dos alunos para enriquecer o retorno
  const alunoIds = Array.from(new Set(allMetas.map(m => m.alunoId)));
  const alunosList = await db.select().from(alunos).where(inArray(alunos.id, alunoIds));
  const alunosMap = new Map(alunosList.map(a => [a.id, a]));
  
  // Agrupar por aluno — cumprida = evidência validada pela mentora (metas.status = 'validada')
  const porAluno = new Map<number, { total: number, cumpridas: number, naoCumpridas: number, emAndamento: number }>();
  for (const meta of allMetas) {
    if (!porAluno.has(meta.alunoId)) {
      porAluno.set(meta.alunoId, { total: 0, cumpridas: 0, naoCumpridas: 0, emAndamento: 0 });
    }
    const entry = porAluno.get(meta.alunoId)!;
    entry.total++;
    if (meta.status === 'validada') entry.cumpridas++;
    else entry.emAndamento++; // pendente ou entregue (aguardando validação) = em andamento
  }
  
  return Array.from(porAluno.entries()).map(([alunoId, data]) => {
    const aluno = alunosMap.get(alunoId);
    return {
      alunoId,
      alunoNome: aluno?.name || 'Desconhecido',
      alunoEmail: aluno?.email || '',
      programId: aluno?.programId || null,
      totalMetas: data.total,
      metasCumpridas: data.cumpridas,
      metasNaoCumpridas: data.naoCumpridas,
      metasEmAndamento: data.emAndamento,
      percentual: data.total > 0 ? Math.round((data.cumpridas / data.total) * 100) : 0
    };
  });
}

// ============ ALERTA ATUALIZAÇÃO DE METAS ============

export async function getAlertaAtualizacaoMetas(alunoId: number) {
  const db = await getDb();
  if (!db) return { precisaAtualizar: false, temMetas: false, sessoesDesdeUltimaAtualizacao: 0, mesesDesdeUltimaAtualizacao: 0, ultimaAtualizacao: null };

  // Buscar a data do último acompanhamento de meta registrado
  const ultimoAcompResult = await db
    .select({ ultimaAtualizacao: sql<Date>`MAX(${metaAcompanhamento.createdAt})` })
    .from(metaAcompanhamento)
    .where(eq(metaAcompanhamento.alunoId, alunoId));

  const rawUltimaAtualizacao = ultimoAcompResult[0]?.ultimaAtualizacao || null;
  const ultimaAtualizacao = rawUltimaAtualizacao ? new Date(rawUltimaAtualizacao) : null;

  // Buscar quantas sessões de mentoria ocorreram desde a última atualização
  let sessoesDesdeUltimaAtualizacao = 0;
  if (ultimaAtualizacao && !isNaN(ultimaAtualizacao.getTime())) {
    const sessoesResult = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(mentoringSessions)
      .where(and(
        eq(mentoringSessions.alunoId, alunoId),
        sql`${mentoringSessions.sessionDate} > ${ultimaAtualizacao}`,
        eq(mentoringSessions.presence, 'presente'),
        eq(mentoringSessions.isAssessment, 0)
      ));
    sessoesDesdeUltimaAtualizacao = Number(sessoesResult[0]?.total) || 0;
  } else {
    // Se nunca houve acompanhamento, contar todas as sessões
    const sessoesResult = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(mentoringSessions)
      .where(and(
        eq(mentoringSessions.alunoId, alunoId),
        eq(mentoringSessions.presence, 'presente'),
        eq(mentoringSessions.isAssessment, 0)
      ));
    sessoesDesdeUltimaAtualizacao = Number(sessoesResult[0]?.total) || 0;
  }

  // Verificar se tem metas definidas
  const metasCountResult = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(metas)
    .where(and(eq(metas.alunoId, alunoId), eq(metas.isActive, 1)));
  const temMetas = Number(metasCountResult[0]?.total) > 0;

  // Calcular meses desde última atualização
  let mesesDesdeUltimaAtualizacao = 0;
  if (ultimaAtualizacao && !isNaN(ultimaAtualizacao.getTime())) {
    const agora = new Date();
    mesesDesdeUltimaAtualizacao = (agora.getFullYear() - ultimaAtualizacao.getFullYear()) * 12 + (agora.getMonth() - ultimaAtualizacao.getMonth());
  }

  // Alerta se: 3+ sessões desde última atualização OU 3+ meses desde última atualização
  const precisaAtualizar = temMetas && (sessoesDesdeUltimaAtualizacao >= 3 || mesesDesdeUltimaAtualizacao >= 3 || !ultimaAtualizacao);

  return {
    precisaAtualizar,
    temMetas,
    sessoesDesdeUltimaAtualizacao,
    mesesDesdeUltimaAtualizacao,
    ultimaAtualizacao: ultimaAtualizacao ? ultimaAtualizacao.toISOString() : null,
  };
}


// ============ DISC TEST FUNCTIONS ============

export async function saveDiscRespostas(alunoId: number, ciclo: number, respostas: { blocoIndex: number; maisId: string; menosId: string; maisDimensao: string; menosDimensao: string }[]) {
  const dbConn = await getDb();
  if (!dbConn) throw new Error("Database not available");
  
  // Deletar respostas anteriores do aluno para este ciclo (permite refazer o teste)
  await dbConn.delete(discRespostas).where(
    and(eq(discRespostas.alunoId, alunoId), eq(discRespostas.ciclo, ciclo))
  );
  
  // Inserir novas respostas no formato escolha forçada
  if (respostas.length > 0) {
    await dbConn.insert(discRespostas).values(
      respostas.map(r => ({
        alunoId,
        ciclo,
        blocoIndex: r.blocoIndex,
        maisId: r.maisId,
        menosId: r.menosId,
        maisDimensao: r.maisDimensao as any,
        menosDimensao: r.menosDimensao as any,
      }))
    );
  }
}

export async function getDiscRespostas(alunoId: number) {
  const dbConn = await getDb();
  if (!dbConn) return [];
  return dbConn.select().from(discRespostas).where(eq(discRespostas.alunoId, alunoId));
}

export async function saveDiscResultado(data: {
  alunoId: number;
  contratoNivelId?: number | null;
  scoreD: string;
  scoreI: string;
  scoreS: string;
  scoreC: string;
  scoreBrutoD?: number;
  scoreBrutoI?: number;
  scoreBrutoS?: number;
  scoreBrutoC?: number;
  perfilPredominante: string;
  perfilSecundario?: string;
  indiceConsistencia?: number;
  alertaBaixaDiferenciacao?: boolean;
  metodoCalculo?: string;
}) {
  const dbConn = await getDb();
  if (!dbConn) throw new Error("Database not available");
  
  // Buscar o ciclo mais recente do aluno para determinar o próximo
  const whereClause = data.contratoNivelId
    ? and(eq(discResultados.alunoId, data.alunoId), eq(discResultados.contratoNivelId, data.contratoNivelId))
    : eq(discResultados.alunoId, data.alunoId);

  const existing = await dbConn.select({ ciclo: discResultados.ciclo })
    .from(discResultados)
    .where(whereClause)
    .orderBy(desc(discResultados.ciclo))
    .limit(1);
  
  const nextCiclo = existing.length > 0 ? (existing[0].ciclo + 1) : 1;
  
  // Inserir novo resultado com ciclo
  await dbConn.insert(discResultados).values({
    ...data,
    ciclo: nextCiclo,
    perfilPredominante: data.perfilPredominante as any,
    perfilSecundario: data.perfilSecundario as any,
    metodoCalculo: data.metodoCalculo || 'ipsativo',
  } as any);
}

export async function getDiscResultado(alunoId: number) {
  const dbConn = await getDb();
  if (!dbConn) return null;
  // Retornar o resultado mais recente (maior ciclo)
  const result = await dbConn.select().from(discResultados)
    .where(eq(discResultados.alunoId, alunoId))
    .orderBy(desc(discResultados.ciclo))
    .limit(1);
  return result[0] || null;
}

export async function getDiscResultadoByNivel(alunoId: number, contratoNivelId?: number | null) {
  if (!contratoNivelId) {
    return getDiscResultado(alunoId);
  }
  const dbConn = await getDb();
  if (!dbConn) return null;
  const result = await dbConn.select().from(discResultados)
    .where(and(
      eq(discResultados.alunoId, alunoId),
      eq(discResultados.contratoNivelId, contratoNivelId),
    ))
    .orderBy(desc(discResultados.ciclo))
    .limit(1);
  return result[0] || null;
}

export async function getAllDiscResultadosByAluno(alunoId: number) {
  const dbConn = await getDb();
  if (!dbConn) return [];
  // Retornar todos os resultados DISC do aluno, ordenados por ciclo
  return await dbConn.select().from(discResultados)
    .where(eq(discResultados.alunoId, alunoId))
    .orderBy(discResultados.ciclo);
}

// ============ AUTOPERCEPÇÃO FUNCTIONS ============

export async function saveAutopercepcoes(
  alunoId: number,
  avaliacoes: InsertAutopercepcaoCompetencia[],
  contratoNivelId?: number | null
) {
  const dbConn = await getDb();
  if (!dbConn) throw new Error("Database not available");
  
  // Deletar avaliações anteriores do aluno no contexto do nível
  await dbConn.delete(autopercepcoesCompetencias).where(
    contratoNivelId
      ? and(eq(autopercepcoesCompetencias.alunoId, alunoId), eq(autopercepcoesCompetencias.contratoNivelId, contratoNivelId))
      : eq(autopercepcoesCompetencias.alunoId, alunoId)
  );
  
  // Inserir novas avaliações
  if (avaliacoes.length > 0) {
    await dbConn.insert(autopercepcoesCompetencias).values(
      avaliacoes.map((a) => ({ ...a, contratoNivelId: contratoNivelId ?? null }))
    );
  }
}

export async function getAutopercepcoes(alunoId: number) {
  const dbConn = await getDb();
  if (!dbConn) return [];
  return dbConn.select().from(autopercepcoesCompetencias).where(eq(autopercepcoesCompetencias.alunoId, alunoId));
}

export async function getAutopercepcoesByNivel(alunoId: number, contratoNivelId?: number | null) {
  if (!contratoNivelId) {
    return getAutopercepcoes(alunoId);
  }
  const dbConn = await getDb();
  if (!dbConn) return [];
  return dbConn.select().from(autopercepcoesCompetencias).where(and(
    eq(autopercepcoesCompetencias.alunoId, alunoId),
    eq(autopercepcoesCompetencias.contratoNivelId, contratoNivelId),
  ));
}

// ============ MENTORA CONTRIBUIÇÕES FUNCTIONS ============

export async function saveContribuicaoMentora(data: InsertMentoraContribuicao) {
  const dbConn = await getDb();
  if (!dbConn) throw new Error("Database not available");
  await dbConn.insert(mentoraContribuicoes).values(data);
}

export async function updateContribuicaoMentora(id: number, conteudo: string) {
  const dbConn = await getDb();
  if (!dbConn) throw new Error("Database not available");
  await dbConn.update(mentoraContribuicoes).set({ conteudo }).where(eq(mentoraContribuicoes.id, id));
}

export async function deleteContribuicaoMentora(id: number) {
  const dbConn = await getDb();
  if (!dbConn) throw new Error("Database not available");
  await dbConn.delete(mentoraContribuicoes).where(eq(mentoraContribuicoes.id, id));
}

export async function getContribuicoesMentora(alunoId: number) {
  const dbConn = await getDb();
  if (!dbConn) return [];
  return dbConn.select().from(mentoraContribuicoes).where(eq(mentoraContribuicoes.alunoId, alunoId));
}


/**
 * Reseta o teste DISC de um aluno: remove apenas as RESPOSTAS brutas.
 * Os RESULTADOS (scores, perfil) são PRESERVADOS para o histórico de evolução.
 * NUNCA deletar disc_resultados — eles são referênciados por historico_ciclos_aluno.
 * Retorna o número de registros removidos.
 */
export async function resetDiscAluno(alunoId: number) {
  const dbConn = await getDb();
  if (!dbConn) throw new Error("Database not available");
  
  // Deletar apenas as respostas brutas DISC (não são necessárias para o histórico)
  const respostasRemovidas = await dbConn.delete(discRespostas).where(
    eq(discRespostas.alunoId, alunoId)
  );
  
  // IMPORTANTE: disc_resultados NÃO é deletado.
  // Os resultados (scoreD, scoreI, scoreS, scoreC, perfilPredominante) são preservados
  // para exibição na página de Evolução (historico_ciclos_aluno.discResultadoId).
  // O novo DISC do próximo ciclo será inserido com contratoNivelId diferente.
  
  return {
    respostasRemovidas: (respostasRemovidas as any)[0]?.affectedRows || 0,
    resultadosRemovidos: 0, // não deletamos mais resultados
  };
}

// ============ REASSESSMENT / CICLO DISC FUNCTIONS ============

/**
 * Retorna TODOS os resultados DISC de um aluno (para comparativo de evolução)
 * Ordenados por data de criação (mais antigo primeiro)
 */
export async function getAllDiscResultados(alunoId: number) {
  const dbConn = await getDb();
  if (!dbConn) return [];
  return dbConn.select().from(discResultados)
    .where(eq(discResultados.alunoId, alunoId))
    .orderBy(discResultados.createdAt);
}



// ============ IN-APP NOTIFICATIONS FUNCTIONS ============

export async function createNotification(notification: InsertInAppNotification) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(inAppNotifications).values(notification);
  return result[0].insertId;
}

export async function createNotifications(notifications: InsertInAppNotification[]) {
  const db = await getDb();
  if (!db) return;
  if (notifications.length === 0) return;
  await db.insert(inAppNotifications).values(notifications);
}

export async function getNotificationsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inAppNotifications)
    .where(eq(inAppNotifications.userId, userId))
    .orderBy(desc(inAppNotifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` })
    .from(inAppNotifications)
    .where(and(
      eq(inAppNotifications.userId, userId),
      eq(inAppNotifications.isRead, 0)
    ));
  return result[0]?.count || 0;
}

export async function markNotificationRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(inAppNotifications)
    .set({ isRead: 1 })
    .where(and(
      eq(inAppNotifications.id, notificationId),
      eq(inAppNotifications.userId, userId)
    ));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(inAppNotifications)
    .set({ isRead: 1 })
    .where(and(
      eq(inAppNotifications.userId, userId),
      eq(inAppNotifications.isRead, 0)
    ));
}


// ============ RELATÓRIO FINANCEIRO DE MENTORIAS ============

export async function getRelatorioFinanceiroMentorias(dateFrom?: string, dateTo?: string) {
  const dbConn = await getDb();
  if (!dbConn) throw new Error("Database not available");

  // Get all sessions with mentor info
  const sessions = await dbConn
    .select({
      sessionId: mentoringSessions.id,
      sessionDate: mentoringSessions.sessionDate,
      sessionNumber: mentoringSessions.sessionNumber,
      alunoId: mentoringSessions.alunoId,
      consultorId: mentoringSessions.consultorId,
      turmaId: mentoringSessions.turmaId,
      consultorNome: consultors.name,
      valorSessao: consultors.valorSessao,
      alunoNome: alunos.name,
    })
    .from(mentoringSessions)
    .leftJoin(consultors, eq(mentoringSessions.consultorId, consultors.id))
    .leftJoin(alunos, eq(mentoringSessions.alunoId, alunos.id));

  // Filter by date range if provided
  let filtered = sessions;
  if (dateFrom) {
    const from = new Date(dateFrom);
    filtered = filtered.filter(s => {
      if (!s.sessionDate) return false;
      return new Date(s.sessionDate) >= from;
    });
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    filtered = filtered.filter(s => {
      if (!s.sessionDate) return false;
      return new Date(s.sessionDate) <= to;
    });
  }

  // Buscar regras de precificação flexível de todos os mentores
  const pricingMap = await getAllMentorSessionPricing();

  // Group by mentor
  const byMentor: Record<number, {
    consultorId: number;
    consultorNome: string;
    valorSessaoPadrao: number;
    sessoes: Array<{
      sessionId: number;
      sessionDate: string | null;
      sessionNumber: number | null;
      alunoId: number | null;
      alunoNome: string | null;
      valorSessao: number;
    }>;
  }> = {};

  for (const s of filtered) {
    if (!s.consultorId) continue;
    const valorPadrao = s.valorSessao ? Number(s.valorSessao) : 0;
    if (!byMentor[s.consultorId]) {
      byMentor[s.consultorId] = {
        consultorId: s.consultorId,
        consultorNome: s.consultorNome || 'Desconhecido',
        valorSessaoPadrao: valorPadrao,
        sessoes: [],
      };
    }
    // Calcular valor da sessão usando precificação flexível
    const rules = pricingMap.get(s.consultorId) || [];
    const sessionNum = s.sessionNumber || 0;
    const matchingRule = rules.find(r => sessionNum >= r.sessionFrom && sessionNum <= r.sessionTo);
    const valorSessao = matchingRule ? Number(matchingRule.valor) : valorPadrao;

    byMentor[s.consultorId].sessoes.push({
      sessionId: s.sessionId,
      sessionDate: s.sessionDate ? String(s.sessionDate) : null,
      sessionNumber: s.sessionNumber,
      alunoId: s.alunoId,
      alunoNome: s.alunoNome || null,
      valorSessao,
    });
  }

  const mentores = Object.values(byMentor).map(m => ({
    ...m,
    valorSessao: m.valorSessaoPadrao, // compatibilidade
    totalSessoes: m.sessoes.length,
    totalValor: m.sessoes.reduce((sum, s) => sum + s.valorSessao, 0),
  }));

  const totalGeral = mentores.reduce((sum, m) => sum + m.totalValor, 0);
  const totalSessoesGeral = mentores.reduce((sum, m) => sum + m.totalSessoes, 0);

  return {
    mentores: mentores.sort((a, b) => b.totalValor - a.totalValor),
    totalGeral,
    totalSessoesGeral,
    totalMentores: mentores.length,
  };
}


// ==================== COMPETENCIAS POR ALUNO (para calculador V2) ====================

/**
 * Retorna um Map<string, CompetenciaObrigatoria[]> onde a chave é o externalId do aluno.
 * Usado pelo calcularIndicadoresTodosAlunos para passar competências obrigatórias de cada aluno.
 */
export async function getAllCompetenciasPorAluno(): Promise<Map<string, { competenciaId: number; codigoIntegracao: string | null; notaAtual: string | null; metaNota: string | null; status: string }[]>> {
  const db = await getDb();
  if (!db) return new Map();
  
  const result = await db.select({
    alunoId: planoIndividual.alunoId,
    competenciaId: planoIndividual.competenciaId,
    codigoIntegracao: competencias.codigoIntegracao,
    notaAtual: planoIndividual.notaAtual,
    metaNota: planoIndividual.metaNota,
    status: planoIndividual.status,
    isObrigatoria: planoIndividual.isObrigatoria,
  })
  .from(planoIndividual)
  .leftJoin(competencias, eq(planoIndividual.competenciaId, competencias.id))
  .where(eq(planoIndividual.isObrigatoria, 1));
  
  // Buscar alunos para mapear alunoId -> externalId
  const alunosList = await db.select({ id: alunos.id, externalId: alunos.externalId }).from(alunos);
  const alunoMap = new Map(alunosList.map(a => [a.id, a.externalId || String(a.id)]));
  
  const map = new Map<string, { competenciaId: number; codigoIntegracao: string | null; notaAtual: string | null; metaNota: string | null; status: string }[]>();
  
  for (const r of result) {
    const externalId = alunoMap.get(r.alunoId) || String(r.alunoId);
    if (!map.has(externalId)) {
      map.set(externalId, []);
    }
    map.get(externalId)!.push({
      competenciaId: r.competenciaId,
      codigoIntegracao: r.codigoIntegracao,
      notaAtual: r.notaAtual,
      metaNota: r.metaNota,
      status: r.status || 'pendente',
    });
  }
  
  return map;
}

// ============ COURSES FUNCTIONS ============
export async function getAllCourses(): Promise<Course[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(courses).orderBy(courses.ordem, courses.titulo);
}

export async function getActiveCourses(): Promise<Course[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(courses).where(eq(courses.isActive, 1)).orderBy(courses.ordem, courses.titulo);
}

export async function getCourseById(id: number): Promise<Course | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courses).where(eq(courses.id, id));
  return result[0];
}

export async function createCourse(data: InsertCourse): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(courses).values(data);
  return Number(result[0].insertId);
}

export async function updateCourse(id: number, data: Partial<InsertCourse>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(courses).set(data).where(eq(courses.id, id));
}

export async function toggleCourseActive(id: number, isActive: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(courses).set({ isActive }).where(eq(courses.id, id));
}

export async function deleteCourse(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(courses).where(eq(courses.id, id));
}


// ============================================================
// Activities (Atividades Extras) helpers
// ============================================================
export async function listActivities(): Promise<Activity[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activities).orderBy(desc(activities.dataInicio));
}
export async function getActivityById(id: number): Promise<Activity | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
  return rows[0];
}
export async function createActivity(data: InsertActivity): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(activities).values(data);
  return Number(result[0].insertId);
}
export async function updateActivity(id: number, data: Partial<InsertActivity>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(activities).set(data).where(eq(activities.id, id));
}
export async function toggleActivityActive(id: number, isActive: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(activities).set({ isActive }).where(eq(activities.id, id));
}
export async function deleteActivity(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(activities).where(eq(activities.id, id));
}

// ============================================================
// Activity Registrations (Inscrições) helpers
// ============================================================
export async function listActivityRegistrations(activityId: number): Promise<ActivityRegistration[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityRegistrations).where(eq(activityRegistrations.activityId, activityId));
}
export async function getRegistrationByUserAndActivity(userId: number, activityId: number): Promise<ActivityRegistration | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(activityRegistrations)
    .where(and(eq(activityRegistrations.userId, userId), eq(activityRegistrations.activityId, activityId)))
    .limit(1);
  return rows[0];
}
export async function registerForActivity(data: InsertActivityRegistration): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(activityRegistrations).values(data);
  return Number(result[0].insertId);
}
export async function updateRegistrationStatus(id: number, status: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(activityRegistrations).set({ status: status as any }).where(eq(activityRegistrations.id, id));
}
export async function cancelRegistration(userId: number, activityId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(activityRegistrations)
    .where(and(eq(activityRegistrations.userId, userId), eq(activityRegistrations.activityId, activityId)));
}
export async function countRegistrations(activityId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`COUNT(*)` })
    .from(activityRegistrations)
    .where(and(eq(activityRegistrations.activityId, activityId), sql`${activityRegistrations.status} != 'cancelado'`));
  return Number(rows[0]?.count ?? 0);
}

// ============================================================
// ACTIVITY TURMAS (vinculação atividade-turma)
// ============================================================

export async function getActivityTurmas(activityId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ turmaId: activityTurmas.turmaId })
    .from(activityTurmas)
    .where(eq(activityTurmas.activityId, activityId));
  return rows.map(r => r.turmaId);
}

export async function setActivityTurmas(activityId: number, turmaIds: number[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  // Deletar vinculações existentes
  await db.delete(activityTurmas).where(eq(activityTurmas.activityId, activityId));
  // Inserir novas vinculações
  if (turmaIds.length > 0) {
    await db.insert(activityTurmas).values(
      turmaIds.map(turmaId => ({ activityId, turmaId }))
    );
  }
}

export async function getActivitiesForTurma(turmaId: number): Promise<Activity[]> {
  const db = await getDb();
  if (!db) return [];
  // Retorna atividades que estão vinculadas a esta turma OU que não têm nenhuma turma vinculada (visível para todos)
  const allActivities = await db.select().from(activities).where(eq(activities.isActive, 1));
  const allLinks = await db.select().from(activityTurmas);
  
  // Agrupar turmas por atividade
  const turmasByActivity = new Map<number, number[]>();
  for (const link of allLinks) {
    const existing = turmasByActivity.get(link.activityId) || [];
    existing.push(link.turmaId);
    turmasByActivity.set(link.activityId, existing);
  }
  
  // Filtrar: sem turmas vinculadas (todos) OU turma do aluno está na lista
  return allActivities.filter(a => {
    const linkedTurmas = turmasByActivity.get(a.id);
    if (!linkedTurmas || linkedTurmas.length === 0) return true; // Visível para todos
    return linkedTurmas.includes(turmaId);
  });
}

export async function getAllActivityTurmasMap(): Promise<Map<number, number[]>> {
  const db = await getDb();
  if (!db) return new Map();
  const allLinks = await db.select().from(activityTurmas);
  const map = new Map<number, number[]>();
  for (const link of allLinks) {
    const existing = map.get(link.activityId) || [];
    existing.push(link.turmaId);
    map.set(link.activityId, existing);
  }
  return map;
}

// ============ PRECIFICAÇÃO FLEXÍVEL DE SESSÕES DO MENTOR ============

// Buscar regras de precificação de um mentor
export async function getMentorSessionPricing(consultorId: number): Promise<MentorSessionPricing[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(mentorSessionPricing)
    .where(eq(mentorSessionPricing.consultorId, consultorId))
    .orderBy(mentorSessionPricing.sessionFrom);
}

// Criar/atualizar regras de precificação (substitui todas as regras existentes)
export async function setMentorSessionPricing(consultorId: number, rules: Array<{
  sessionFrom: number;
  sessionTo: number;
  valor: string;
  descricao?: string;
}>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Remover regras existentes
  await db.delete(mentorSessionPricing).where(eq(mentorSessionPricing.consultorId, consultorId));
  // Inserir novas regras
  if (rules.length > 0) {
    await db.insert(mentorSessionPricing).values(
      rules.map(r => ({
        consultorId,
        sessionFrom: r.sessionFrom,
        sessionTo: r.sessionTo,
        valor: r.valor,
        descricao: r.descricao || null,
      }))
    );
  }
}

// Buscar o valor de uma sessão específica pelo número
export async function getSessionPrice(consultorId: number, sessionNumber: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  // Buscar regra que cobre esse número de sessão
  const rules = await db.select().from(mentorSessionPricing)
    .where(eq(mentorSessionPricing.consultorId, consultorId));
  
  const matchingRule = rules.find(r => sessionNumber >= r.sessionFrom && sessionNumber <= r.sessionTo);
  if (matchingRule) {
    return Number(matchingRule.valor);
  }
  
  // Fallback: usar valorSessao do consultor
  const consultor = await db.select({ valorSessao: consultors.valorSessao })
    .from(consultors).where(eq(consultors.id, consultorId)).limit(1);
  return consultor[0]?.valorSessao ? Number(consultor[0].valorSessao) : 0;
}

// Buscar todas as regras de precificação de todos os mentores (para demonstrativo)
export async function getAllMentorSessionPricing(): Promise<Map<number, MentorSessionPricing[]>> {
  const db = await getDb();
  if (!db) return new Map();
  const allRules = await db.select().from(mentorSessionPricing).orderBy(mentorSessionPricing.sessionFrom);
  const map = new Map<number, MentorSessionPricing[]>();
  for (const rule of allRules) {
    const existing = map.get(rule.consultorId) || [];
    existing.push(rule);
    map.set(rule.consultorId, existing);
  }
  return map;
}


/**
 * Buscar todas as competências de assessments para relatório gerencial
 * Retorna id, assessmentPdiId, competenciaId, microInicio, microTermino
 */
export async function getAllAssessmentCompetenciasForReport() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    id: assessmentCompetencias.id,
    assessmentPdiId: assessmentCompetencias.assessmentPdiId,
    competenciaId: assessmentCompetencias.competenciaId,
    microInicio: assessmentCompetencias.microInicio,
    microTermino: assessmentCompetencias.microTermino,
  }).from(assessmentCompetencias);
}


// ============ MACRO INICIO POR ALUNO (para filtrar eventos na unificação) ============

/**
 * Retorna um Map<alunoId, Date> com a data de início do macrociclo mais antigo de cada aluno.
 * Usado para filtrar eventos na unificação: só marcar ausência em eventos a partir do macroInicio do aluno.
 * Se o aluno tem contratoInicio, usa o menor entre contratoInicio e macroInicio.
 */
export async function getAlunoMacroInicioMap(): Promise<Map<number, Date>> {
  const db = await getDb();
  if (!db) return new Map();
  
  // Buscar macroInicio de todos os PDIs ativos
  const allPdis = await db.select({
    alunoId: assessmentPdi.alunoId,
    macroInicio: assessmentPdi.macroInicio,
  }).from(assessmentPdi).where(eq(assessmentPdi.status, 'ativo'));
  
  // Buscar contratoInicio dos alunos
  const allAlunos = await db.select({
    id: alunos.id,
    contratoInicio: alunos.contratoInicio,
  }).from(alunos);
  const alunoContratoMap = new Map(allAlunos.map(a => [a.id, a.contratoInicio]));

  const result = new Map<number, Date>();
  
  for (const pdi of allPdis) {
    const macroDate = new Date(pdi.macroInicio);
    const existing = result.get(pdi.alunoId);
    // Usar o macroInicio mais antigo (caso tenha múltiplos PDIs)
    if (!existing || macroDate < existing) {
      result.set(pdi.alunoId, macroDate);
    }
  }
  
  // Se o aluno tem contratoInicio e é anterior ao macroInicio, usar contratoInicio
  for (const [alunoId, macroDate] of Array.from(result.entries())) {
    const contrato = alunoContratoMap.get(alunoId);
    if (contrato) {
      const contratoDate = new Date(contrato);
      if (contratoDate < macroDate) {
        result.set(alunoId, contratoDate);
      }
    }
  }
  
  return result;
}


/**
 * Check what related data exists for an aluno before deletion
 */
export async function getAlunoDependencies(alunoId: number) {
  const db = await getDb();
  if (!db) return null;

  const [pdis] = await db.select({ count: sql<number>`COUNT(*)` }).from(assessmentPdi).where(eq(assessmentPdi.alunoId, alunoId));
  const [sessions] = await db.select({ count: sql<number>`COUNT(*)` }).from(mentoringSessions).where(eq(mentoringSessions.alunoId, alunoId));
  const [participations] = await db.select({ count: sql<number>`COUNT(*)` }).from(eventParticipation).where(eq(eventParticipation.alunoId, alunoId));
  const [performance] = await db.select({ count: sql<number>`COUNT(*)` }).from(studentPerformance).where(eq(studentPerformance.alunoId, alunoId));
  const [ciclos] = await db.select({ count: sql<number>`COUNT(*)` }).from(ciclosExecucao).where(eq(ciclosExecucao.alunoId, alunoId));
  const [disc] = await db.select({ count: sql<number>`COUNT(*)` }).from(discResultados).where(eq(discResultados.alunoId, alunoId));
  const [metasCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(metas).where(eq(metas.alunoId, alunoId));
  const [contratos] = await db.select({ count: sql<number>`COUNT(*)` }).from(contratosAluno).where(eq(contratosAluno.alunoId, alunoId));

  const totalRelated = pdis.count + sessions.count + participations.count + performance.count + ciclos.count + disc.count + metasCount.count + contratos.count;

  return {
    pdis: pdis.count,
    sessions: sessions.count,
    participations: participations.count,
    performance: performance.count,
    ciclos: ciclos.count,
    disc: disc.count,
    metas: metasCount.count,
    contratos: contratos.count,
    totalRelated,
  };
}

/**
 * Delete an aluno and all related data (cascade)
 */
export async function deleteAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  try {
    // Delete all related data in order (respecting dependencies)
    // 1. Meta acompanhamento (depends on metas)
    const metaIds = await db.select({ id: metas.id }).from(metas).where(eq(metas.alunoId, alunoId));
    if (metaIds.length > 0) {
      const ids = metaIds.map(m => m.id);
      await db.delete(metaAcompanhamento).where(sql`${metaAcompanhamento.metaId} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);
    }

    // 2. Assessment competencias (depends on assessment_pdi)
    const pdiIds = await db.select({ id: assessmentPdi.id }).from(assessmentPdi).where(eq(assessmentPdi.alunoId, alunoId));
    if (pdiIds.length > 0) {
      const ids = pdiIds.map(p => p.id);
      await db.delete(assessmentCompetencias).where(sql`${assessmentCompetencias.assessmentPdiId} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);
    }

    // 3. Ciclo competencias (depends on ciclos_execucao)
    const cicloIds = await db.select({ id: ciclosExecucao.id }).from(ciclosExecucao).where(eq(ciclosExecucao.alunoId, alunoId));
    if (cicloIds.length > 0) {
      const ids = cicloIds.map(c => c.id);
      await db.delete(cicloCompetencias).where(sql`${cicloCompetencias.cicloId} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);
    }

    // 4. Delete direct dependencies
    await db.delete(assessmentPdi).where(eq(assessmentPdi.alunoId, alunoId));
    await db.delete(mentoringSessions).where(eq(mentoringSessions.alunoId, alunoId));
    await db.delete(eventParticipation).where(eq(eventParticipation.alunoId, alunoId));
    await db.delete(studentPerformance).where(eq(studentPerformance.alunoId, alunoId));
    await db.delete(ciclosExecucao).where(eq(ciclosExecucao.alunoId, alunoId));
    // historico_ciclos_aluno referencia disc_resultados — deletar histórico ANTES dos resultados DISC
    await db.execute(sql.raw(`DELETE FROM historico_ciclos_aluno WHERE alunoId = ${alunoId}`));
    await db.delete(discResultados).where(eq(discResultados.alunoId, alunoId));
    await db.delete(discRespostas).where(eq(discRespostas.alunoId, alunoId));
    await db.delete(metas).where(eq(metas.alunoId, alunoId));
    await db.delete(contratosAluno).where(eq(contratosAluno.alunoId, alunoId));
    await db.delete(autopercepcoesCompetencias).where(eq(autopercepcoesCompetencias.alunoId, alunoId));
    await db.delete(mentoraContribuicoes).where(eq(mentoraContribuicoes.alunoId, alunoId));
    await db.delete(historicoNivelCompetencia).where(eq(historicoNivelCompetencia.alunoId, alunoId));
    await db.delete(casesSucesso).where(eq(casesSucesso.alunoId, alunoId));
    await db.delete(planoIndividual).where(eq(planoIndividual.alunoId, alunoId));
    await db.delete(appointmentParticipants).where(eq(appointmentParticipants.alunoId, alunoId));

    // 5. Remove user link (set alunoId to null on users table)
    await db.update(users).set({ alunoId: null }).where(eq(users.alunoId, alunoId));

    // 6. Delete the aluno itself
    await db.delete(alunos).where(eq(alunos.id, alunoId));

    return { success: true, message: "Aluno excluído com sucesso" };
  } catch (error: any) {
    console.error("[deleteAluno] Error:", error);
    return { success: false, message: `Erro ao excluir aluno: ${error.message}` };
  }
}


// ============ DISC VIDEO WATCHED ============

/**
 * Marca que o aluno assistiu o vídeo DISC pela primeira vez.
 * Salva o timestamp atual na coluna discVideoWatchedAt.
 */
export async function markDiscVideoWatched(alunoId: number): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) return { success: false };
  try {
    await db.update(alunos)
      .set({ discVideoWatchedAt: new Date() })
      .where(eq(alunos.id, alunoId));
    return { success: true };
  } catch (error: any) {
    console.error("[markDiscVideoWatched] Error:", error);
    return { success: false };
  }
}

/**
 * Verifica se o aluno já assistiu o vídeo DISC.
 * Retorna true se discVideoWatchedAt não for null.
 */
export async function hasWatchedDiscVideo(alunoId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const [aluno] = await db.select({ discVideoWatchedAt: alunos.discVideoWatchedAt })
      .from(alunos)
      .where(eq(alunos.id, alunoId))
      .limit(1);
    return aluno?.discVideoWatchedAt !== null && aluno?.discVideoWatchedAt !== undefined;
  } catch (error: any) {
    console.error("[hasWatchedDiscVideo] Error:", error);
    return false;
  }
}

// ============ ADMIN: TODOS OS AGENDAMENTOS ============

export async function getAllAppointments(filters?: {
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  consultorId?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];
  if (filters?.status) {
    conditions.push(eq(mentorAppointments.status, filters.status as any));
  }
  if (filters?.type) {
    conditions.push(eq(mentorAppointments.type, filters.type as any));
  }
  if (filters?.dateFrom) {
    conditions.push(gte(mentorAppointments.scheduledDate, filters.dateFrom));
  }
  if (filters?.dateTo) {
    conditions.push(lte(mentorAppointments.scheduledDate, filters.dateTo));
  }
  if (filters?.consultorId) {
    conditions.push(eq(mentorAppointments.consultorId, filters.consultorId));
  }

  const appointments = await db.select().from(mentorAppointments)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(mentorAppointments.scheduledDate), mentorAppointments.startTime);

  // Buscar todos os consultores e alunos de uma vez para enriquecer
  const allConsultors = await getConsultors();
  const consultorMap = new Map(allConsultors.map(c => [c.id, c]));
  const allAlunos = await getAlunos();
  const alunoMap = new Map(allAlunos.map(a => [a.id, a]));

  const result = [];
  for (const appt of appointments) {
    const participants = await db.select().from(appointmentParticipants)
      .where(eq(appointmentParticipants.appointmentId, appt.id));

    const mentor = consultorMap.get(appt.consultorId);

    result.push({
      ...appt,
      mentorName: mentor?.name || 'Desconhecido',
      mentorEmail: mentor?.email || '',
      mentorEspecialidade: mentor?.especialidade || '',
      participants: participants.map(p => ({
        alunoId: p.alunoId,
        alunoName: alunoMap.get(p.alunoId)?.name || 'Desconhecido',
        alunoEmail: alunoMap.get(p.alunoId)?.email || '',
        status: p.status,
        confirmedAt: p.confirmedAt,
        notes: p.notes,
      })),
    });
  }

  return result;
}


// ============ ONBOARDING JORNADA (Steps 6-8) ============

export async function getOnboardingJornada(alunoId: number): Promise<OnboardingJornada | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(onboardingJornada).where(eq(onboardingJornada.alunoId, alunoId)).limit(1);
  return rows[0] || null;
}

export async function getOnboardingJornadaByNivel(
  alunoId: number,
  contratoNivelId?: number | null
): Promise<OnboardingJornada | null> {
  if (!contratoNivelId) {
    return getOnboardingJornada(alunoId);
  }
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(onboardingJornada).where(and(
    eq(onboardingJornada.alunoId, alunoId),
    eq(onboardingJornada.contratoNivelId, contratoNivelId),
  )).limit(1);
  return rows[0] || null;
}

export async function upsertOnboardingJornada(alunoId: number, data: Partial<InsertOnboardingJornada>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await getOnboardingJornada(alunoId);
  if (existing) {
    await db.update(onboardingJornada).set(data).where(eq(onboardingJornada.alunoId, alunoId));
  } else {
    await db.insert(onboardingJornada).values({ alunoId, ...data });
  }
}

export async function upsertOnboardingJornadaByNivel(
  alunoId: number,
  contratoNivelId: number | null | undefined,
  data: Partial<InsertOnboardingJornada>
): Promise<void> {
  if (!contratoNivelId) {
    await upsertOnboardingJornada(alunoId, data);
    return;
  }

  const db = await getDb();
  if (!db) return;

  const existing = await getOnboardingJornadaByNivel(alunoId, contratoNivelId);
  if (existing) {
    await db.update(onboardingJornada).set(data).where(eq(onboardingJornada.id, existing.id));
  } else {
    await db.insert(onboardingJornada).values({ alunoId, contratoNivelId, ...data });
  }
}

export async function getOnboardingVideos(): Promise<OnboardingVideo[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(onboardingVideos).where(eq(onboardingVideos.isActive, 1)).orderBy(onboardingVideos.ordem);
}

export async function updateOnboardingVideo(id: number, data: Partial<InsertOnboardingVideo>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(onboardingVideos).set(data).where(eq(onboardingVideos.id, id));
}


// ==================== ONBOARDING TRACKING (ADMIN) ====================

/**
 * Retorna lista de todos os alunos com seu progresso de onboarding para a visão admin.
 * Cada aluno tem 6 etapas:
 * 1. Convite Enviado (cadastradoPorAdmin = 1)
 * 2. Cadastro Preenchido (onboardingJornada.cadastroConfirmado = 1)
 * 3. Teste Realizado (discResultados existe)
 * 4. Mentoria Agendada (mentorAppointments existe via appointmentParticipants)
 * 5. PDI Publicado (assessmentPdi existe)
 * 6. Termo de Compromisso Assinado (onboardingJornada.aceiteRealizado = 1)
 */
export async function getOnboardingTrackingList(programId?: number) {
  const database = await getDb();
  if (!database) return [];

  // Base query: alunos ativos da trilha de desenvolvimento (excluir candidatos PS)
  let alunosList;
  if (programId) {
    alunosList = await database.select()
      .from(alunos)
      .where(and(
        eq(alunos.isActive, 1),
        eq(alunos.programId, programId),
        sql`(${alunos.tipoPortal} IS NULL OR ${alunos.tipoPortal} != 'processo_seletivo')`
      ));
  } else {
    alunosList = await database.select()
      .from(alunos)
      .where(and(
        eq(alunos.isActive, 1),
        sql`(${alunos.tipoPortal} IS NULL OR ${alunos.tipoPortal} != 'processo_seletivo')`
      ));
  }

  if (alunosList.length === 0) return [];

  const alunoIds = alunosList.map(a => a.id);

  // Batch fetch all related data
  const [jornadas, discResults, appointments, pdis] = await Promise.all([
    // Onboarding jornadas
    database.select()
      .from(onboardingJornada)
      .where(inArray(onboardingJornada.alunoId, alunoIds)),
    // DISC results
    database.select({ alunoId: discResultados.alunoId, completedAt: discResultados.completedAt })
      .from(discResultados)
      .where(inArray(discResultados.alunoId, alunoIds)),
    // Appointments (via participants)
    database.select({ 
      alunoId: appointmentParticipants.alunoId,
      appointmentId: appointmentParticipants.appointmentId,
    })
      .from(appointmentParticipants)
      .innerJoin(mentorAppointments, eq(appointmentParticipants.appointmentId, mentorAppointments.id))
      .where(and(
        inArray(appointmentParticipants.alunoId, alunoIds),
        sql`${mentorAppointments.status} != 'cancelado'`
      )),
    // Assessment PDIs
    database.select({ alunoId: assessmentPdi.alunoId, createdAt: assessmentPdi.createdAt })
      .from(assessmentPdi)
      .where(inArray(assessmentPdi.alunoId, alunoIds)),
  ]);

  // Build lookup maps
  const jornadaMap = new Map(jornadas.map(j => [j.alunoId, j]));
  const discMap = new Map<number, { completed: boolean; completedAt: Date | null }>();
  for (const d of discResults) {
    discMap.set(d.alunoId, { completed: true, completedAt: d.completedAt });
  }
  const appointmentMap = new Map<number, boolean>();
  for (const a of appointments) {
    appointmentMap.set(a.alunoId, true);
  }
  const pdiMap = new Map<number, boolean>();
  for (const p of pdis) {
    pdiMap.set(p.alunoId, true);
  }

  // Fetch program names for display
  const allPrograms = await database.select().from(programs);
  const programMap = new Map(allPrograms.map(p => [p.id, p.name]));

  // Fetch turma names
  const allTurmas = await database.select().from(turmas);
  const turmaMap = new Map(allTurmas.map(t => [t.id, t.name]));

  // Build result — only include students cadastrados a partir de 01/03/2026 (alunos novos)
  // que ainda não completaram o aceite do onboarding
  const ONBOARDING_CUTOFF = new Date('2026-03-01T00:00:00Z');
  const now = new Date();
  return alunosList
    .filter(aluno => {
      // Só alunos novos (cadastrados a partir de 01/03/2026) aparecem no tracking
      const createdAt = aluno.createdAt ? new Date(aluno.createdAt) : null;
      if (!createdAt || createdAt < ONBOARDING_CUTOFF) return false; // Veterano, não aparece
      // Aluno novo: verificar se já deu aceite
      const jornada = jornadaMap.get(aluno.id);
      const aceiteFeito = jornada?.aceiteRealizado === 1;
      return !aceiteFeito; // Include if aceite not done yet
    })
    .map(aluno => {
    const jornada = jornadaMap.get(aluno.id);
    const discInfo = discMap.get(aluno.id);
    const hasDISC = discInfo?.completed || false;
    const hasAppointment = appointmentMap.get(aluno.id) || false;

    // Calculate step statuses (5 steps — cumulative: if a later step is done, all previous are also done)
    // Raw checks from database
    const rawConvite = aluno.cadastradoPorAdmin === 1;
    const rawCadastro = jornada?.cadastroConfirmado === 1;
    const rawTeste = hasDISC;
    const rawMentoria = hasAppointment;
    const rawAceite = jornada?.aceiteRealizado === 1;

    // Apply cumulative logic: if step N is done, steps 1..N-1 are also done
    const steps = {
      conviteEnviado: true, // All students in the system had an invite sent
      cadastroPreenchido: rawCadastro || rawTeste || rawMentoria || rawAceite,
      testeRealizado: rawTeste || rawMentoria || rawAceite,
      mentoriaAgendada: rawMentoria || rawAceite,
      aceiteOnboarding: rawAceite === true,
    };

    // Count completed steps
    const completedSteps = Object.values(steps).filter(Boolean).length;

    // Determine the date of the last completed step (for "dias parado" calculation)
    let lastStepDate: Date | null = aluno.createdAt; // default: registration date
    if (steps.aceiteOnboarding && jornada?.aceiteRealizadoEm) {
      lastStepDate = jornada.aceiteRealizadoEm;
    } else if (steps.mentoriaAgendada) {
      // No specific date stored for appointment, use disc or cadastro date
      lastStepDate = discInfo?.completedAt || jornada?.cadastroConfirmadoEm || aluno.createdAt;
    } else if (steps.testeRealizado && discInfo?.completedAt) {
      lastStepDate = discInfo.completedAt;
    } else if (steps.cadastroPreenchido && jornada?.cadastroConfirmadoEm) {
      lastStepDate = jornada.cadastroConfirmadoEm;
    }

    // Calculate days stalled
    const diasParado = lastStepDate
      ? Math.floor((now.getTime() - new Date(lastStepDate).getTime()) / (1000 * 60 * 60 * 24))
      : aluno.createdAt
        ? Math.floor((now.getTime() - new Date(aluno.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    return {
      alunoId: aluno.id,
      name: aluno.name,
      email: aluno.email,
      externalId: aluno.externalId || null,
      programName: aluno.programId ? programMap.get(aluno.programId) || null : null,
      turmaName: aluno.turmaId ? turmaMap.get(aluno.turmaId) || null : null,
      steps,
      completedSteps,
      totalSteps: 5,
      createdAt: aluno.createdAt,
      diasParado,
      lastStepDate,
      // Timestamps for detail view
      cadastroConfirmadoEm: jornada?.cadastroConfirmadoEm || null,
      aceiteRealizadoEm: jornada?.aceiteRealizadoEm || null,
      pdiLiberadoPelaMentora: jornada?.pdiLiberadoPelaMentora === 1,
      pdiLiberadoEm: jornada?.pdiLiberadoEm || null,
    };
  })
  // Sort by createdAt descending (most recent first)
  .sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
}

// ============ ONBOARDING REVISÕES FUNCTIONS ============

/**
 * Criar uma solicitação de revisão do PDI
 */
async function createOnboardingRevisao(data: { alunoId: number; justificativa: string; emailEnviado?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(onboardingRevisoes).values({
    alunoId: data.alunoId,
    justificativa: data.justificativa,
    emailEnviado: data.emailEnviado ? 1 : 0,
  });
  return { id: result[0].insertId };
}

/**
 * Listar solicitações de revisão de um aluno
 */
async function getOnboardingRevisoesByAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(onboardingRevisoes).where(eq(onboardingRevisoes.alunoId, alunoId)).orderBy(desc(onboardingRevisoes.createdAt));
}

/**
 * Listar todas as solicitações de revisão pendentes (para admin/mentora)
 */
async function getOnboardingRevisoesPendentes(consultorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (consultorId) {
    // Mentor: filtrar apenas revisões dos seus alunos
    const meusAlunos = await db.select({ id: alunos.id }).from(alunos).where(eq(alunos.consultorId, consultorId));
    const meusAlunoIds = meusAlunos.map(a => a.id);
    if (meusAlunoIds.length === 0) return [];
    return await db.select().from(onboardingRevisoes)
      .where(and(eq(onboardingRevisoes.status, 'pendente'), inArray(onboardingRevisoes.alunoId, meusAlunoIds)))
      .orderBy(desc(onboardingRevisoes.createdAt));
  }
  return await db.select().from(onboardingRevisoes).where(eq(onboardingRevisoes.status, 'pendente')).orderBy(desc(onboardingRevisoes.createdAt));
}

/**
 * Listar TODAS as solicitações de revisão com dados enriquecidos (aluno, programa, mentor)
 */
async function getOnboardingRevisoesEnriquecidas(statusFilter?: 'pendente' | 'em_analise' | 'resolvida' | 'cancelada', consultorId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Se mentor, buscar apenas alunoIds do mentor
  let meusAlunoIds: number[] | null = null;
  if (consultorId) {
    const meusAlunos = await db.select({ id: alunos.id }).from(alunos).where(eq(alunos.consultorId, consultorId));
    meusAlunoIds = meusAlunos.map(a => a.id);
    if (meusAlunoIds.length === 0) return [];
  }
  
  let revisoes;
  const conditions = [];
  if (statusFilter) conditions.push(eq(onboardingRevisoes.status, statusFilter));
  if (meusAlunoIds) conditions.push(inArray(onboardingRevisoes.alunoId, meusAlunoIds));
  
  if (conditions.length > 0) {
    revisoes = await db.select().from(onboardingRevisoes).where(and(...conditions)).orderBy(desc(onboardingRevisoes.createdAt));
  } else {
    revisoes = await db.select().from(onboardingRevisoes).orderBy(desc(onboardingRevisoes.createdAt));
  }
  if (revisoes.length === 0) return [];
  
  const allAlunos = await db.select().from(alunos);
  const alunoMap = new Map(allAlunos.map(a => [a.id, a]));
  const allConsultors = await db.select().from(consultors);
  const consultorMap = new Map(allConsultors.map(c => [c.id, c]));
  const allPrograms = await db.select().from(programs);
  const programMap = new Map(allPrograms.map(p => [p.id, p]));
  const allUsers = await db.select().from(users);
  const userMap = new Map(allUsers.map(u => [u.id, u]));
  
  return revisoes.map(r => {
    const aluno = alunoMap.get(r.alunoId);
    const mentor = aluno?.consultorId ? consultorMap.get(aluno.consultorId) : null;
    const programa = aluno?.programId ? programMap.get(aluno.programId) : null;
    const resolvidoPorUser = r.resolvidoPor ? userMap.get(r.resolvidoPor) : null;
    return {
      ...r,
      alunoNome: aluno?.name || 'Desconhecido',
      alunoEmail: aluno?.email || null,
      mentorNome: mentor?.name || null,
      mentorEmail: mentor?.email || null,
      programaNome: programa?.name || null,
      resolvidoPorNome: resolvidoPorUser?.name || null,
    };
  });
}

/**
 * Atualizar status de uma solicitação de revisão
 */
async function updateOnboardingRevisao(id: number, data: { status: 'pendente' | 'em_analise' | 'resolvida' | 'cancelada'; respostaAdmin?: string; resolvidoPor?: number }) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(onboardingRevisoes).set({
    status: data.status,
    respostaAdmin: data.respostaAdmin,
    resolvidoPor: data.resolvidoPor,
    resolvidoEm: data.status === 'resolvida' || data.status === 'cancelada' ? new Date() : undefined,
  }).where(eq(onboardingRevisoes.id, id));
}

/**
 * Contar solicitações de revisão pendentes de um aluno (para limitar a 5)
 */
async function countOnboardingRevisoesByAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(onboardingRevisoes).where(eq(onboardingRevisoes.alunoId, alunoId));
  return result[0]?.count || 0;
}

export const onboardingRevisoesDb = {
  create: createOnboardingRevisao,
  getByAluno: getOnboardingRevisoesByAluno,
  getPendentes: getOnboardingRevisoesPendentes,
  getEnriquecidas: getOnboardingRevisoesEnriquecidas,
  update: updateOnboardingRevisao,
  countByAluno: countOnboardingRevisoesByAluno,
};


/**
 * Retorna estatísticas da equipe do gestor:
 * - totalColaboradores: número de alunos da empresa
 * - totalMentorias: sessões de mentoria realizadas
 * - totalCompetencias: competências distintas sendo desenvolvidas
 * - principaisCompetencias: top 5 competências mais trabalhadas
 */
export async function getGestorTeamStats(programId: number) {
  const db = await getDb();
  if (!db) return { totalColaboradores: 0, totalMentorias: 0, totalCompetencias: 0, principaisCompetencias: [] as { nome: string; totalAlunos: number }[] };

  // Total de colaboradores (alunos) da empresa
  const [alunosCount] = await db.select({ count: sql<number>`COUNT(DISTINCT ${alunos.id})` })
    .from(alunos)
    .where(eq(alunos.programId, programId));

  // Total de mentorias realizadas
  const [mentoriasCount] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(mentoringSessions)
    .innerJoin(alunos, eq(mentoringSessions.alunoId, alunos.id))
    .where(eq(alunos.programId, programId));

  // Total de competências distintas sendo desenvolvidas
  const [compCount] = await db.select({ count: sql<number>`COUNT(DISTINCT ${assessmentCompetencias.competenciaId})` })
    .from(assessmentCompetencias)
    .innerJoin(assessmentPdi, eq(assessmentCompetencias.assessmentPdiId, assessmentPdi.id))
    .innerJoin(alunos, eq(assessmentPdi.alunoId, alunos.id))
    .where(and(eq(alunos.programId, programId), eq(assessmentPdi.status, 'ativo')));

  // Top 5 competências mais trabalhadas
  const topComps = await db.select({
    competenciaId: assessmentCompetencias.competenciaId,
    totalAlunos: sql<number>`COUNT(DISTINCT ${assessmentPdi.alunoId})`,
  })
    .from(assessmentCompetencias)
    .innerJoin(assessmentPdi, eq(assessmentCompetencias.assessmentPdiId, assessmentPdi.id))
    .innerJoin(alunos, eq(assessmentPdi.alunoId, alunos.id))
    .where(and(eq(alunos.programId, programId), eq(assessmentPdi.status, 'ativo')))
    .groupBy(assessmentCompetencias.competenciaId)
    .orderBy(sql`COUNT(DISTINCT ${assessmentPdi.alunoId}) DESC`)
    .limit(5);

  // Buscar nomes das competências
  const compIds = topComps.map(c => c.competenciaId);
  let principaisCompetencias: { nome: string; totalAlunos: number }[] = [];
  if (compIds.length > 0) {
    const compNames = await db.select({ id: competencias.id, nome: competencias.nome })
      .from(competencias)
      .where(sql`${competencias.id} IN (${sql.join(compIds.map(id => sql`${id}`), sql`, `)})`);
    const nameMap = new Map(compNames.map(c => [c.id, c.nome]));
    principaisCompetencias = topComps.map(c => ({
      nome: nameMap.get(c.competenciaId) || 'Desconhecida',
      totalAlunos: Number(c.totalAlunos),
    }));
  }

  return {
    totalColaboradores: Number(alunosCount?.count || 0),
    totalMentorias: Number(mentoriasCount?.count || 0),
    totalCompetencias: Number(compCount?.count || 0),
    principaisCompetencias,
  };
}


// ============ MÓDULO DE CURSOS (27/03/2026) ============

/**
 * Obter catálogo de cursos para um aluno em um microciclo
 * Retorna competências com módulos agrupados e progresso
 */
export async function getCourseCatalog(alunoId: number, microcicloId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    // Buscar todas as competências com módulos
    const competenciasComModulos = await db
      .select({
        competenciaId: competencias.id,
        competenciaNome: competencias.nome,
        modulos: sql<string>`JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', ${competenciasModulos.id},
            'tipo', ${competenciasModulos.tipoModulo},
            'titulo', ${competenciasModulos.titulo},
            'descricao', ${competenciasModulos.descricao},
            'urlGenially', ${competenciasModulos.urlGenially},
            'urlThumbnail', ${competenciasModulos.urlThumbnail},
            'duracaoMinutos', ${competenciasModulos.duracaoMinutos}
          )
        )`,
      })
      .from(competencias)
      .leftJoin(
        competenciasModulos,
        eq(competencias.id, competenciasModulos.competenciaId)
      )
      .where(eq(competenciasModulos.ativo, 1))
      .groupBy(competencias.id);

    // Para cada competência, buscar progresso do aluno
    const resultado = await Promise.all(
      competenciasComModulos.map(async (comp) => {
        const progresso = await db
          .select({
            moduloId: alunoModuloProgresso.moduloId,
            status: alunoModuloProgresso.status,
            statusSemaforo: alunoModuloProgresso.statusSemaforo,
            diasRestantes: alunoModuloProgresso.diasRestantes,
            nota: alunoModuloAvaliacao.nota,
          })
          .from(alunoModuloProgresso)
          .leftJoin(
            alunoModuloAvaliacao,
            eq(alunoModuloProgresso.id, alunoModuloAvaliacao.progressoId)
          )
          .where(
            and(
              eq(alunoModuloProgresso.alunoId, alunoId),
              eq(alunoModuloProgresso.competenciaId, comp.competenciaId),
              eq(alunoModuloProgresso.microcicloId, microcicloId)
            )
          );

        const modulosArray = JSON.parse(comp.modulos || "[]");
        const modulosComProgresso = modulosArray.map((mod: any) => {
          const prog = progresso.find((p) => p.moduloId === mod.id);
          return {
            ...mod,
            status: prog?.status || "nao_iniciado",
            statusSemaforo: prog?.statusSemaforo || "verde",
            diasRestantes: prog?.diasRestantes || null,
            nota: prog?.nota || null,
          };
        });

        const concluidos = modulosComProgresso.filter(
          (m: any) => m.status === "concluido"
        ).length;

        return {
          competenciaId: comp.competenciaId,
          competenciaNome: comp.competenciaNome,
          progresso: `${concluidos}/${modulosComProgresso.length}`,
          statusGeral:
            concluidos === modulosComProgresso.length
              ? "concluido"
              : concluidos > 0
                ? "em_progresso"
                : "nao_iniciado",
          modulos: modulosComProgresso,
        };
      })
    );

    return resultado;
  } catch (error) {
    console.error("[getCourseCatalog] Error:", error);
    return [];
  }
}

/**
 * Iniciar um módulo (marcar como em_progresso e registrar data_inicio)
 */
export async function startModule(
  alunoId: number,
  moduloId: number,
  progressoId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(alunoModuloProgresso)
      .set({
        status: "em_progresso",
        dataInicio: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(alunoModuloProgresso.id, progressoId));

    return { success: true };
  } catch (error) {
    console.error("[startModule] Error:", error);
    throw error;
  }
}

/**
 * Obter conteúdo completo de um módulo
 */
export async function getModuleContent(moduloId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const [modulo] = await db
      .select()
      .from(competenciasModulos)
      .where(eq(competenciasModulos.id, moduloId));

    return modulo || null;
  } catch (error) {
    console.error("[getModuleContent] Error:", error);
    return null;
  }
}

/**
 * Enviar reflexão do aluno após estudar o módulo
 */
export async function submitReflection(
  alunoId: number,
  moduloId: number,
  progressoId: number,
  textoRelato: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.insert(alunoModuloRelato).values({
      alunoId,
      moduloId,
      progressoId,
      textoRelato,
      dataEnvio: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("[submitReflection] Error:", error);
    throw error;
  }
}

/**
 * Enviar avaliação/quiz do módulo e atualizar indicadores
 */
export async function submitAssessment(
  alunoId: number,
  moduloId: number,
  progressoId: number,
  competenciaId: number,
  microcicloId: number,
  nota: number,
  totalQuestoes?: number,
  questoesAcertadas?: number,
  tempoRespostaMinutos?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // 1. Salvar avaliação
    await db.insert(alunoModuloAvaliacao).values({
      alunoId,
      moduloId,
      progressoId,
      nota,
      totalQuestoes: totalQuestoes || 0,
      questoesAcertadas: questoesAcertadas || 0,
      tempoRespostaMinutos: tempoRespostaMinutos || 0,
      aprovado: nota >= 7 ? 1 : 0,
      dataAvaliacao: new Date(),
    });

    // 2. Marcar módulo como concluído
    await db
      .update(alunoModuloProgresso)
      .set({
        status: "concluido",
        dataConclusao: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(alunoModuloProgresso.id, progressoId));

    // 3. Atualizar Indicador 2 (Avaliações) - média de todas as notas do ciclo
    const todasAvaliacoes = await db
      .select({ nota: alunoModuloAvaliacao.nota })
      .from(alunoModuloAvaliacao)
      .innerJoin(
        alunoModuloProgresso,
        eq(alunoModuloAvaliacao.progressoId, alunoModuloProgresso.id)
      )
      .where(
        and(
          eq(alunoModuloAvaliacao.alunoId, alunoId),
          eq(alunoModuloProgresso.microcicloId, microcicloId)
        )
      );

    const mediaNotas =
      todasAvaliacoes.length > 0
        ? todasAvaliacoes.reduce((sum, a) => sum + Number(a.nota), 0) /
          todasAvaliacoes.length
        : 0;

    // 4. Atualizar Indicador 3 (Competências) - módulos concluídos vs disponíveis
    const modulosConcluidos = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(alunoModuloProgresso)
      .where(
        and(
          eq(alunoModuloProgresso.alunoId, alunoId),
          eq(alunoModuloProgresso.microcicloId, microcicloId),
          eq(alunoModuloProgresso.status, "concluido")
        )
      );

    const modulosDisponiveis = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(alunoModuloProgresso)
      .where(
        and(
          eq(alunoModuloProgresso.alunoId, alunoId),
          eq(alunoModuloProgresso.microcicloId, microcicloId)
        )
      );

    const aulasConcluidas = Number(modulosConcluidos[0]?.count || 0);
    const aulasDisponiveis = Number(modulosDisponiveis[0]?.count || 0);

    // 5. Atualizar student_performance com os novos indicadores
    await db
      .update(studentPerformance)
      .set({
        notaAvaliacao: mediaNotas,
        aulasConcluidas,
        aulasDisponiveis,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(studentPerformance.alunoId, alunoId),
          eq(studentPerformance.microcicloId, microcicloId)
        )
      );

    return { success: true, mediaNotas, aulasConcluidas, aulasDisponiveis };
  } catch (error) {
    console.error("[submitAssessment] Error:", error);
    throw error;
  }
}

/**
 * Solicitar prorrogação de prazo
 */
export async function requestExtension(
  alunoId: number,
  moduloId: number,
  progressoId: number,
  dataLimiteSolicitada: Date,
  dataFimContrato: Date,
  motivoSolicitacao: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Validar se novo prazo está dentro do contrato
    const dentroContrato = dataLimiteSolicitada <= dataFimContrato ? 1 : 0;

    // Buscar prazo original
    const [progresso] = await db
      .select({ dataLimiteOriginal: alunoModuloProgresso.dataLimiteOriginal })
      .from(alunoModuloProgresso)
      .where(eq(alunoModuloProgresso.id, progressoId));

    if (!progresso) throw new Error("Progresso not found");

    // Criar solicitação
    const [result] = await db
      .insert(alunoCompetenciaProrrogacao)
      .values({
        alunoId,
        moduloId,
        progressoId,
        dataSolicitacao: new Date(),
        dataLimiteOriginal: progresso.dataLimiteOriginal,
        dataLimiteSolicitada,
        motivoSolicitacao,
        dentroContrato,
        dataFimContrato,
        status: "pendente",
      })
      .$returningId();

    return { success: true, prorrogacaoId: result?.id };
  } catch (error) {
    console.error("[requestExtension] Error:", error);
    throw error;
  }
}

/**
 * Aprovar ou rejeitar prorrogação (apenas mentores)
 */
export async function approveExtension(
  prorrogacaoId: number,
  aprovar: boolean,
  motivoRejeicao?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Buscar prorrogação
    const [prorrogacao] = await db
      .select()
      .from(alunoCompetenciaProrrogacao)
      .where(eq(alunoCompetenciaProrrogacao.id, prorrogacaoId));

    if (!prorrogacao) throw new Error("Prorrogação not found");

    if (aprovar) {
      // Atualizar prorrogação como aprovada
      await db
        .update(alunoCompetenciaProrrogacao)
        .set({
          status: "aprovada",
          dataLimiteAprovada: prorrogacao.dataLimiteSolicitada,
          updatedAt: new Date(),
        })
        .where(eq(alunoCompetenciaProrrogacao.id, prorrogacaoId));

      // Atualizar progresso com novo prazo
      await db
        .update(alunoModuloProgresso)
        .set({
          dataLimiteProrrogada: prorrogacao.dataLimiteSolicitada,
          updatedAt: new Date(),
        })
        .where(eq(alunoModuloProgresso.id, prorrogacao.progressoId));
    } else {
      // Rejeitar prorrogação
      await db
        .update(alunoCompetenciaProrrogacao)
        .set({
          status: "rejeitada",
          motivoRejeicao: motivoRejeicao || "",
          updatedAt: new Date(),
        })
        .where(eq(alunoCompetenciaProrrogacao.id, prorrogacaoId));
    }

    return { success: true };
  } catch (error) {
    console.error("[approveExtension] Error:", error);
    throw error;
  }
}

/**
 * Obter painel de prorrogações para mentor
 */
export async function getMentorExtensionPanel(mentorId: number) {
  const db = await getDb();
  if (!db) return { pendentes: [], aprovadas: [], rejeitadas: [] };

  try {
    const prorrogacoes = await db
      .select({
        id: alunoCompetenciaProrrogacao.id,
        alunoId: alunoCompetenciaProrrogacao.alunoId,
        alunoNome: alunos.nome,
        moduloId: alunoCompetenciaProrrogacao.moduloId,
        moduloTitulo: competenciasModulos.titulo,
        competenciaNome: competencias.nome,
        dataLimiteOriginal: alunoCompetenciaProrrogacao.dataLimiteOriginal,
        dataLimiteSolicitada: alunoCompetenciaProrrogacao.dataLimiteSolicitada,
        motivoSolicitacao: alunoCompetenciaProrrogacao.motivoSolicitacao,
        status: alunoCompetenciaProrrogacao.status,
        dataSolicitacao: alunoCompetenciaProrrogacao.dataSolicitacao,
      })
      .from(alunoCompetenciaProrrogacao)
      .innerJoin(alunos, eq(alunoCompetenciaProrrogacao.alunoId, alunos.id))
      .innerJoin(
        competenciasModulos,
        eq(alunoCompetenciaProrrogacao.moduloId, competenciasModulos.id)
      )
      .innerJoin(
        competencias,
        eq(competenciasModulos.competenciaId, competencias.id)
      );

    // Agrupar por status
    const pendentes = prorrogacoes.filter((p) => p.status === "pendente");
    const aprovadas = prorrogacoes.filter((p) => p.status === "aprovada");
    const rejeitadas = prorrogacoes.filter((p) => p.status === "rejeitada");

    return { pendentes, aprovadas, rejeitadas };
  } catch (error) {
    console.error("[getMentorExtensionPanel] Error:", error);
    return { pendentes: [], aprovadas: [], rejeitadas: [] };
  }
}


// ============ COMPETÊNCIAS COMPORTAMENTAIS E TÉCNICAS HELPERS ============

/**
 * ITEM 6: Helper - getCompetenciasList()
 * Retorna lista de competências existentes
 */
export async function getCompetenciasList(): Promise<Competencia[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(competencias)
    .where(eq(competencias.isActive, 1));
  
  return result;
}

/**
 * ITEM 7: Helper - getCursosByCompetencia(competenciaId)
 * Retorna cursos de uma competência
 */
export async function getCursosByCompetencia(competenciaId: number): Promise<CursoCompetencia[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(cursosCompetencias)
    .where(and(
      eq(cursosCompetencias.competenciaId, competenciaId),
      eq(cursosCompetencias.isActive, 1)
    ))
    .orderBy(cursosCompetencias.ordem);
  
  return result;
}

/**
 * ITEM 8: Helper - getAtividadesByCurso(cursoId)
 * Retorna atividades de um curso
 */
export async function getAtividadesByCurso(cursoId: number): Promise<AtividadeCurso[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(atividadesCurso)
    .where(and(
      eq(atividadesCurso.cursoId, cursoId),
      eq(atividadesCurso.isActive, 1)
    ))
    .orderBy(atividadesCurso.ordem);
  
  return result;
}

/**
 * ITEM 9: Helper - getAvaliacaoByAtividade(atividadeId)
 * Retorna avaliação de uma atividade
 */
export async function getAvaliacaoByAtividade(atividadeId: number): Promise<AvaliacaoAtividade | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(avaliacoesAtividade)
    .where(and(
      eq(avaliacoesAtividade.atividadeId, atividadeId),
      eq(avaliacoesAtividade.isActive, 1)
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

/**
 * ITEM 10: Helper - selecionarQuestoes(avaliacaoId)
 * Seleciona 15 questões aleatórias de 30
 */
export async function selecionarQuestoes(avaliacaoId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const avaliacao = await db
    .select()
    .from(avaliacoesAtividade)
    .where(eq(avaliacoesAtividade.id, avaliacaoId))
    .limit(1);
  
  if (!avaliacao || avaliacao.length === 0) {
    throw new Error("Avaliação não encontrada");
  }
  
  const questoes = avaliacao[0].questoes as any[];
  if (!Array.isArray(questoes) || questoes.length === 0) {
    throw new Error("Avaliação sem questões");
  }
  
  // Selecionar 15 questões aleatórias de 30
  const shuffled = [...questoes].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 15);
}

/**
 * ITEM 11: Helper - calcularNota(respostasAluno, questoesCorretas)
 * Calcula nota da avaliação (0-10)
 */
export function calcularNota(respostasAluno: Record<string, any>, questoesCorretas: any[]): number {
  if (!questoesCorretas || questoesCorretas.length === 0) {
    return 0;
  }
  
  let acertos = 0;
  
  for (const questao of questoesCorretas) {
    const respostaAluno = respostasAluno[questao.id];
    if (respostaAluno === questao.respostaCorreta) {
      acertos++;
    }
  }
  
  // Calcular nota de 0-10
  const nota = (acertos / questoesCorretas.length) * 10;
  return Math.round(nota * 10) / 10; // Arredondar para 1 casa decimal
}

/**
 * ITEM 12: Helper - atualizarIndicadores(alunoId, nota)
 * Atualiza indicadores 2 e 3
 */
export async function atualizarIndicadores(alunoId: number, nota: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar aluno
  const aluno = await db
    .select()
    .from(alunos)
    .where(eq(alunos.id, alunoId))
    .limit(1);
  
  if (!aluno || aluno.length === 0) {
    throw new Error("Aluno não encontrado");
  }
  
  // Atualizar indicadores (simplificado - você pode ajustar conforme necessário)
  // Indicador 2: Nota de Avaliação
  // Indicador 3: Progresso de Aprendizado
  
  // Aqui você pode adicionar lógica para atualizar os indicadores
  // Por exemplo, atualizar a tabela de performance ou histórico
}

/**
 * ITEM 13: Helper - criarAtribuicaoCurso(alunoId, cursoId, mentorId, dataPrazo)
 * Cria atribuição de curso ao aluno
 */
export async function criarAtribuicaoCurso(
  alunoId: number,
  cursoId: number,
  competenciaId: number,
  mentorId: number,
  dataPrazo: Date
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe atribuição para este aluno + curso + competência
  const [existente] = await db
    .select({ id: alunoCursoAtribuido.id })
    .from(alunoCursoAtribuido)
    .where(
      and(
        eq(alunoCursoAtribuido.alunoId, alunoId),
        eq(alunoCursoAtribuido.cursoId, cursoId),
        eq(alunoCursoAtribuido.competenciaId, competenciaId)
      )
    )
    .limit(1);
  
  // Se já existe, atualizar
  if (existente) {
    await db
      .update(alunoCursoAtribuido)
      .set({
        mentorId,
        dataPrazo,
        updatedAt: new Date(),
      })
      .where(eq(alunoCursoAtribuido.id, existente.id));
    
    return existente.id;
  }
  
  // Se não existe, inserir novo
  const result = await db
    .insert(alunoCursoAtribuido)
    .values({
      alunoId,
      cursoId,
      competenciaId,
      mentorId,
      dataAtribuicao: new Date(),
      dataPrazo,
      status: "nao_iniciado",
    });
  
  return (result as any).insertId;
}

/**
 * ITEM 14: Helper - registrarTentativaAvaliacao(alunoId, atividadeId, questoes, respostas, nota)
 * Registra tentativa de avaliação
 */
export async function registrarTentativaAvaliacao(
  alunoId: number,
  atividadeId: number,
  avaliacaoId: number,
  questoesSelecionadas: any[],
  respostasAluno: Record<string, any>,
  nota: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const aprovado = nota >= 8 ? 1 : 0;
  
  const result = await db
    .insert(tentativasAvaliacao)
    .values({
      alunoId,
      atividadeId,
      avaliacaoId,
      questoesSelecionadas,
      respostasAluno,
      nota,
      aprovado,
    });
  
  return (result as any).insertId;
}

/**
 * ITEM 15: Helper - getCursosAtribuidosAluno(alunoId)
 * Retorna cursos atribuídos ao aluno
 */
export async function getCursosAtribuidosAluno(alunoId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({
      id: alunoCursoAtribuido.id,
      cursoId: alunoCursoAtribuido.cursoId,
      competenciaId: alunoCursoAtribuido.competenciaId,
      dataPrazo: alunoCursoAtribuido.dataPrazo,
      status: alunoCursoAtribuido.status,
      notaFinal: alunoCursoAtribuido.notaFinal,
      dataConclusao: alunoCursoAtribuido.dataConclusao,
      curso: {
        titulo: cursosCompetencias.titulo,
        descricao: cursosCompetencias.descricao,
        capaUrl: cursosCompetencias.capaUrl,
      },
      competencia: {
        nome: competencias.nome,
      },
    })
    .from(alunoCursoAtribuido)
    .leftJoin(cursosCompetencias, eq(alunoCursoAtribuido.cursoId, cursosCompetencias.id))
    .leftJoin(competencias, eq(alunoCursoAtribuido.competenciaId, competencias.id))
    .where(eq(alunoCursoAtribuido.alunoId, alunoId));
  
  return result;
}


// ============ HELPERS PARA JORNADA DO ALUNO ============

/**
 * Buscar todos os PDIs (assessment_pdi) de um aluno
 */
export async function getAssessmentPdiByAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const pdis = await db
      .select()
      .from(assessmentPdi)
      .where(and(
        eq(assessmentPdi.alunoId, alunoId),
        // Excluir PDIs congelados e encerrados — congelados pertencem ao ciclo anterior, encerrados são PDIs duplicados inativados
        sql`${assessmentPdi.status} NOT IN ('congelado', 'encerrado')`,
      ));
    
    return pdis || [];
  } catch (error) {
    console.error('Erro ao buscar PDIs do aluno:', error);
    return [];
  }
}

/**
 * Buscar competências (assessment_competencias) de um PDI específico
 */
export async function getAssessmentCompetenciasByPdi(pdiId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const competenciasComNomes = await db
      .select({
        id: assessmentCompetencias.id,
        assessmentPdiId: assessmentCompetencias.assessmentPdiId,
        competenciaId: assessmentCompetencias.competenciaId,
        nome: competencias.nome,
        peso: assessmentCompetencias.peso,
        nivelAtual: assessmentCompetencias.nivelAtual,
        metaFinal: assessmentCompetencias.metaFinal,
        metaCiclo1: assessmentCompetencias.metaCiclo1,
        metaCiclo2: assessmentCompetencias.metaCiclo2,
        microInicio: assessmentCompetencias.microInicio,
        microTermino: assessmentCompetencias.microTermino,
        createdAt: assessmentCompetencias.createdAt,
      })
      .from(assessmentCompetencias)
      .leftJoin(competencias, eq(assessmentCompetencias.competenciaId, competencias.id))
      .where(eq(assessmentCompetencias.assessmentPdiId, pdiId));
    
    return competenciasComNomes || [];
  } catch (error) {
    console.error('Erro ao buscar competências do PDI:', error);
    return [];
  }
}

/**
 * Buscar contrato de mentoria ativo do aluno
 * Retorna o primeiro contrato ativo encontrado
 */
export async function getContratoMentoriaByAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    // 1. Primeiro, buscar na tabela alunos (contratoInicio/contratoFim)
    const alunoData = await db
      .select({
        contratoInicio: alunos.contratoInicio,
        contratoFim: alunos.contratoFim,
        tipoMentoria: alunos.tipoMentoria,
        totalSessoesContratadas: alunos.totalSessoesContratadas,
      })
      .from(alunos)
      .where(
        and(
          eq(alunos.id, alunoId),
          isNotNull(alunos.contratoInicio),
          isNotNull(alunos.contratoFim)
        )
      )
      .limit(1);
    
    if (alunoData && alunoData.length > 0) {
      const data = alunoData[0];
      return {
        id: alunoId,
        dataInicio: data.contratoInicio,
        dataTermino: data.contratoFim,
        tipoMentoria: data.tipoMentoria || 'individual',
        totalSessoesContratadas: data.totalSessoesContratadas || 0,
      };
    }
    
    // 2. Se não encontrar em alunos, buscar em contratosAluno
    const contratos = await db
      .select()
      .from(contratosAluno)
      .where(
        and(
          eq(contratosAluno.alunoId, alunoId),
          eq(contratosAluno.isActive, 1)
        )
      )
      .orderBy(desc(contratosAluno.createdAt))
      .limit(1);
    
    if (!contratos || contratos.length === 0) {
      return null;
    }
    
    const contrato = contratos[0];
    
    return {
      id: contrato.id,
      dataInicio: contrato.periodoInicio,
      dataTermino: contrato.periodoTermino,
      tipoMentoria: 'individual',
      totalSessoesContratadas: contrato.totalSessoesContratadas || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar contrato de mentoria:', error);
    return null;
  }
}

/**
 * Calcular saldo de mentorias do aluno
 * Retorna: sessoesRealizadas, saldoRestante, totalContratadas, percentualUsado
 */
export async function getSaldoMentoriasAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const contrato = await getContratoMentoriaByAluno(alunoId);
    if (!contrato) return null;
    
    let totalContratadas = Number(contrato.totalSessoesContratadas || 0);
    
    if (totalContratadas === 0) {
      const pdis = await getAssessmentPdiByAluno(alunoId);
      if (pdis && pdis.length > 0) {
        totalContratadas = pdis.reduce((sum, pdi) => {
          return sum + (pdi.totalSessoesPrevistas || 0);
        }, 0);
      }
    }
    
    if (totalContratadas === 0 && contrato.dataInicio && contrato.dataTermino) {
      const inicio = new Date(contrato.dataInicio);
      const termino = new Date(contrato.dataTermino);
      const meses = Math.ceil((termino.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30));
      totalContratadas = Math.max(1, meses);
    }
    
    const sessoes = await db
      .select()
      .from(mentoringSessions)
      .where(
        and(
          eq(mentoringSessions.alunoId, alunoId),
          eq(mentoringSessions.isAssessment, 0),
          eq(mentoringSessions.presence, 'presente')
        )
      );
    
    const sessoesRealizadas = sessoes.length;
    const saldoRestante = Math.max(0, totalContratadas - sessoesRealizadas);
    const percentualUsado = totalContratadas > 0
      ? Math.round((sessoesRealizadas / totalContratadas) * 100)
      : 0;
    
    return {
      sessoesRealizadas,
      saldoRestante,
      totalContratadas,
      percentualUsado,
    };
  } catch (error) {
    console.error('Erro ao calcular saldo de mentorias:', error);
    return null;
  }
}


/**
 * Determina a plataforma de aulas baseado no nome da empresa
 */
export function determinePlataformaAulas(programName: string | null | undefined): 'scaffold' | 'sistema_interno' {
  if (!programName) return 'sistema_interno';
  
  const scaffoldPrograms = ['SEBRAE TO', 'SEBRAE ACRE', 'EMBRAPII'];
  return scaffoldPrograms.includes(programName) ? 'scaffold' : 'sistema_interno';
}

/**
 * Atualiza o campo plataformaAulas de um aluno baseado em sua empresa
 */
export async function updateAlunoPlataformaAulas(alunoId: number) {
  try {
    // Buscar o aluno com sua empresa
    const aluno = await db
      .select({
        id: alunos.id,
        programId: alunos.programId,
      })
      .from(alunos)
      .where(eq(alunos.id, alunoId))
      .limit(1);

    if (!aluno || aluno.length === 0) {
      return { success: false, message: 'Aluno não encontrado' };
    }

    // Buscar o nome da empresa
    let programName = null;
    if (aluno[0].programId) {
      const program = await db
        .select({ name: programs.name })
        .from(programs)
        .where(eq(programs.id, aluno[0].programId))
        .limit(1);
      
      if (program && program.length > 0) {
        programName = program[0].name;
      }
    }

    // Determinar a plataforma
    const plataforma = determinePlataformaAulas(programName);

    // Atualizar o aluno
    await db
      .update(alunos)
      .set({ plataformaAulas: plataforma })
      .where(eq(alunos.id, alunoId));

    return { success: true, plataforma };
  } catch (error) {
    console.error('Erro ao atualizar plataformaAulas do aluno:', error);
    return { success: false, message: 'Erro ao atualizar aluno' };
  }
}

/**
 * Atualiza o campo plataformaAulas de TODOS os alunos baseado em suas empresas
 */
export async function updateAllAlunosPlataformaAulas() {
  try {
    // Buscar todos os alunos com suas empresas
    const todosAlunos = await db
      .select({
        alunoId: alunos.id,
        programId: alunos.programId,
        programName: programs.name,
      })
      .from(alunos)
      .leftJoin(programs, eq(alunos.programId, programs.id));

    let atualizados = 0;
    let erros = 0;

    // Atualizar cada aluno
    for (const row of todosAlunos) {
      try {
        const plataforma = determinePlataformaAulas(row.programName);
        
        await db
          .update(alunos)
          .set({ plataformaAulas: plataforma })
          .where(eq(alunos.id, row.alunoId));
        
        atualizados++;
      } catch (error) {
        console.error(`Erro ao atualizar aluno ${row.alunoId}:`, error);
        erros++;
      }
    }

    return {
      success: true,
      total: todosAlunos.length,
      atualizados,
      erros,
      message: `${atualizados} alunos atualizados com sucesso${erros > 0 ? `, ${erros} com erro` : ''}`
    };
  } catch (error) {
    console.error('Erro ao atualizar todos os alunos:', error);
    return {
      success: false,
      message: 'Erro ao atualizar alunos em massa'
    };
  }
}

/**
 * Atualizar plataformaAulas de múltiplos alunos
 * @param updates Array com { alunoId, plataformaAulas }
 */
export async function updateMultipleAlunosPlataforma(updates: Array<{ alunoId: number; plataformaAulas: 'scaffold' | 'sistema_interno' }>) {
  try {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: 'Erro ao conectar ao banco de dados'
      };
    }

    let atualizados = 0;
    let erros = 0;

    for (const update of updates) {
      try {
        await db
          .update(alunos)
          .set({ plataformaAulas: update.plataformaAulas })
          .where(eq(alunos.id, update.alunoId));
        
        atualizados++;
      } catch (error) {
        console.error(`Erro ao atualizar aluno ${update.alunoId}:`, error);
        erros++;
      }
    }

    return {
      success: true,
      total: updates.length,
      atualizados,
      erros,
      message: `${atualizados} alunos atualizados com sucesso${erros > 0 ? `, ${erros} com erro` : ''}`
    };
  } catch (error) {
    console.error('Erro ao atualizar múltiplos alunos:', error);
    return {
      success: false,
      message: 'Erro ao atualizar alunos'
    };
  }
}


/**
 * Verificar se atividade anterior foi concluída (bloqueio de sequência)
 * @param alunoId ID do aluno
 * @param moduloId ID do módulo/curso
 * @returns true se pode fazer avaliação, false se está bloqueado
 */
export async function verificarBloqueioAtividade(alunoId: number, moduloId: number) {
  try {
    const db = await getDb();
    if (!db) return false;

    // Buscar progresso do aluno neste módulo
    const progresso = await db
      .select()
      .from(alunoModuloProgresso)
      .where(
        and(
          eq(alunoModuloProgresso.alunoId, alunoId),
          eq(alunoModuloProgresso.moduloId, moduloId)
        )
      )
      .limit(1);

    // Se não tem progresso, está bloqueado
    if (!progresso || progresso.length === 0) {
      return false;
    }

    // Se status é "nao_iniciado", está bloqueado
    if (progresso[0].status === "nao_iniciado") {
      return false;
    }

    // Se chegou aqui, pode fazer avaliação
    return true;
  } catch (error) {
    console.error("Erro ao verificar bloqueio de atividade:", error);
    return false;
  }
}

/**
 * Atualizar status do curso atribuído após avaliação
 * @param alunoId ID do aluno
 * @param cursoId ID do curso
 * @param aprovado Se foi aprovado (nota >= 8.0)
 */
export async function atualizarStatusCursoAtribuido(alunoId: number, cursoId: number, aprovado: boolean) {
  try {
    const db = await getDb();
    if (!db) return false;

    const novoStatus = aprovado ? "concluido" : "em_progresso";

    await db
      .update(alunoCursoAtribuido)
      .set({
        status: novoStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(alunoCursoAtribuido.alunoId, alunoId),
          eq(alunoCursoAtribuido.cursoId, cursoId)
        )
      );

    return true;
  } catch (error) {
    console.error("Erro ao atualizar status do curso atribuído:", error);
    return false;
  }
}


/**
 * Verificar se atividade anterior foi concluida (bloqueio de sequencia)
 * @param alunoId ID do aluno
 * @param moduloId ID do modulo/curso
 * @returns true se pode fazer avaliacao, false se esta bloqueado
 */

// ============ CERTIFICAÇÃO DE NÍVEL (FASE 7) =====

export async function getCertificationTemplates(nivel?: "I" | "II" | "III" | "IV"): Promise<CertificationTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  if (nivel) {
    return await db.select().from(certificationTemplates).where(eq(certificationTemplates.nivel, nivel)).orderBy(desc(certificationTemplates.updatedAt));
  }
  return await db.select().from(certificationTemplates).orderBy(desc(certificationTemplates.updatedAt));
}

export async function getActiveCertificationTemplateByNivel(nivel: "I" | "II" | "III" | "IV"): Promise<CertificationTemplate | null> {
  const db = await getDb();
  if (!db) return null;
  const [tpl] = await db.select().from(certificationTemplates)
    .where(and(eq(certificationTemplates.nivel, nivel), eq(certificationTemplates.ativo, 1)))
    .orderBy(desc(certificationTemplates.updatedAt))
    .limit(1);
  return tpl || null;
}

export async function createCertificationTemplate(data: InsertCertificationTemplate): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(certificationTemplates).values(data);
  return result.insertId;
}

export async function setCertificationTemplateActive(templateId: number, nivel: "I" | "II" | "III" | "IV") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(certificationTemplates).set({ ativo: 0 }).where(eq(certificationTemplates.nivel, nivel));
  await db.update(certificationTemplates).set({ ativo: 1 }).where(eq(certificationTemplates.id, templateId));
}

export async function getCertificationSignatures(tipo?: "gerente" | "mentora" | "gestor_master"): Promise<CertificationSignature[]> {
  const db = await getDb();
  if (!db) return [];
  const cond = tipo ? and(eq(certificationSignatures.ativo, 1), eq(certificationSignatures.tipo, tipo)) : eq(certificationSignatures.ativo, 1);
  return await db.select().from(certificationSignatures).where(cond as any).orderBy(asc(certificationSignatures.tipo), asc(certificationSignatures.nomeExibicao));
}

export async function createCertificationSignature(data: InsertCertificationSignature): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(certificationSignatures).values(data);
  return result.insertId;
}

export async function getNivelCertificatesByAluno(alunoId: number): Promise<NivelCertificate[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(nivelCertificates)
    .where(eq(nivelCertificates.alunoId, alunoId))
    .orderBy(desc(nivelCertificates.emitidoEm));
}

export async function getNivelCertificateByAlunoNivel(alunoId: number, contratoNivelId: number): Promise<NivelCertificate | null> {
  const db = await getDb();
  if (!db) return null;
  const [cert] = await db.select().from(nivelCertificates)
    .where(and(
      eq(nivelCertificates.alunoId, alunoId),
      eq(nivelCertificates.contratoNivelId, contratoNivelId),
      eq(nivelCertificates.status, "emitido"),
    ))
    .orderBy(desc(nivelCertificates.emitidoEm))
    .limit(1);
  return cert || null;
}

/**
 * Lista os certificados emitidos mais recentes, com o nome do aluno — pra
 * telas administrativas mostrarem o Código de Identificação sem precisar
 * que o admin guarde/procure manualmente onde anotou cada um.
 */
export async function listarCertificadosEmitidosRecentes(limite: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const [rows]: any = await db.execute(sql.raw(
    `SELECT nc.id, nc.hashDocumento, nc.nivel, nc.emitidoEm, nc.arquivoUrl, nc.relatorioUrl, nc.emissaoManual,
            a.name AS alunoNome
     FROM nivel_certificates nc
     JOIN alunos a ON a.id = nc.alunoId
     WHERE nc.status = 'emitido'
     ORDER BY nc.emitidoEm DESC
     LIMIT ${Number(limite)}`
  ));
  return Array.isArray(rows) ? rows : [];
}

export async function createNivelCertificate(
  data: InsertNivelCertificate,
  mentoras: Array<{ consultorId: number; nomeMentora: string }>
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(nivelCertificates).values(data);
  const certificateId = result.insertId;
  if (mentoras.length > 0) {
    await db.insert(nivelCertificateMentoras).values(
      mentoras.map((m) => ({ certificateId, consultorId: m.consultorId, nomeMentora: m.nomeMentora }))
    );
  }
  return certificateId;
}

/**
 * Gera o "Código de Identificação do Conjunto Documental" — formato
 * EDB-LID-AAAA-0000, sequencial por ano. É o MESMO código impresso no
 * certificado e no relatório de aproveitamento (é assim que os dois se
 * validam como pertencentes ao mesmo conjunto documental, contra fraude).
 * Reaproveita o campo hashDocumento já existente — só muda o formato do
 * valor gerado, sem exigir mudança de schema nem nos pontos que já usam
 * esse campo pra montar a URL de verificação.
 */
export async function gerarCodigoIdentificacaoCertificado(): Promise<string> {
  const db = await getDb();
  const ano = new Date().getFullYear();
  const prefixo = `EDB-LID-${ano}-`;
  let sequencial = 1;
  if (db) {
    const [rows]: any = await db.execute(sql.raw(
      `SELECT COUNT(*) AS total FROM nivel_certificates WHERE hashDocumento LIKE '${prefixo}%'`
    ));
    sequencial = (Number(rows?.[0]?.total) || 0) + 1;
  }
  return `${prefixo}${String(sequencial).padStart(4, "0")}`;
}

export async function getCertificateMentoras(certificateId: number): Promise<NivelCertificateMentora[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(nivelCertificateMentoras).where(eq(nivelCertificateMentoras.certificateId, certificateId));
}

/**
 * Busca todos os dados necessários para exibir/imprimir o certificado público
 * (página de verificação por hash, também usada como fonte para o Puppeteer
 * gerar o PDF real no momento da emissão).
 */
export async function getNivelCertificateByHash(hash: string) {
  const db = await getDb();
  if (!db) return null;

  const [certRows]: any = await db.execute(sql.raw(
    `SELECT nc.*, a.name AS alunoNome, p.name AS programaNome, t.name AS turmaNome
     FROM nivel_certificates nc
     JOIN alunos a ON a.id = nc.alunoId
     LEFT JOIN programs p ON p.id = a.programId
     LEFT JOIN turmas t ON t.id = a.turmaId
     WHERE nc.hashDocumento = ${JSON.stringify(hash)}
     LIMIT 1`
  ));
  const certificado = Array.isArray(certRows) && certRows[0] ? certRows[0] : null;
  if (!certificado) return null;

  const nivelBruto = await getContratoNivelBruto(certificado.contratoNivelId);
  const periodo = nivelBruto
    ? await resolverSnapshotEDatasDoNivel(certificado.alunoId, nivelBruto)
    : { dataInicio: null, dataFim: null };

  const mentoras = await getCertificateMentoras(certificado.id);

  const [assinaturasRows]: any = await db.execute(sql.raw(
    `SELECT * FROM certification_signatures WHERE ativo = 1 ORDER BY id ASC`
  ));

  // Todos os níveis do aluno, com seus próprios períodos — mostrado no
  // certificado pra dar transparência total quando a fronteira exata entre
  // dois níveis não foi capturada por um reset formal (ex.: nível encerrado
  // via congelamento de turma, sem o snapshot individual). Em vez de tentar
  // reconstruir retroativamente uma data exata de transição (arriscado),
  // mostra o período de CADA nível lado a lado, sem inventar precisão que
  // os dados não têm.
  const ORDEM_NIVEL: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
  const hojeStr = new Date().toISOString().split("T")[0];
  const todosNiveisAluno = await getContratoNiveisByAluno(certificado.alunoId);
  const todosNiveis = todosNiveisAluno
    // Só níveis realmente encerrados. O campo status sozinho não é confiável
    // (já vimos casos com "encerrado" gravado num nível que na prática ainda
    // está em andamento) — por segurança, exige também que a data de término
    // já tenha passado, já que um nível não pode estar concluído se a própria
    // data final dele ainda está no futuro.
    .filter((n: any) => {
      const temStatusEncerrado = n.status === "encerrado" || n.status === "certificado";
      const dataFim = n.nivelFim ?? n.dataFim ?? null;
      const dataJaPassou = dataFim ? String(dataFim).slice(0, 10) <= hojeStr : false;
      return temStatusEncerrado && dataJaPassou && (n.nivelInicio || n.nivelFim || n.dataInicio || n.dataFim);
    })
    .sort((a: any, b: any) => (ORDEM_NIVEL[a.nivel] ?? 99) - (ORDEM_NIVEL[b.nivel] ?? 99))
    .map((n: any) => ({
      nivel: n.nivel,
      dataInicio: n.nivelInicio ?? n.dataInicio ?? null,
      dataFim: n.nivelFim ?? n.dataFim ?? null,
    }));

  return {
    certificado,
    periodo: { dataInicio: periodo.dataInicio, dataFim: periodo.dataFim },
    mentoras,
    assinaturas: Array.isArray(assinaturasRows) ? assinaturasRows : [],
    todosNiveis,
  };
}

/** Atualiza o arquivoUrl de um certificado já criado (usado após a geração real do PDF). */
export async function updateNivelCertificateArquivo(certificateId: number, arquivoUrl: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(nivelCertificates).set({ arquivoUrl }).where(eq(nivelCertificates.id, certificateId));
}

export async function updateNivelCertificateRelatorioUrl(certificateId: number, relatorioUrl: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(nivelCertificates).set({ relatorioUrl }).where(eq(nivelCertificates.id, certificateId));
}

/**
 * Busca o nível SEM recalcular/sincronizar o status por data de contrato.
 * getContratoNivelComStatusOperacional() sobrescreve o status no banco com base em
 * contratos_aluno.periodoTermino (fim do contrato inteiro, não do macrociclo), o que
 * pode reabrir silenciosamente um nível que já foi encerrado de verdade pelo reset
 * (arquivarCicloAtual). Para elegibilidade de certificado, o status gravado pelo
 * reset é a fonte confiável — lemos ele bruto, sem side-effect de escrita.
 */
export async function getContratoNivelBruto(contratoNivelId: number) {
  const db = await getDb();
  if (!db) return null;
  const [nivel] = await db.select().from(contratoNiveis).where(eq(contratoNiveis.id, contratoNivelId)).limit(1);
  return nivel ?? null;
}

/**
 * Resolve o snapshot congelado (historico_ciclos_aluno) correspondente a um nível,
 * e as datas de exibição do macrociclo, com fallback para alunos que ainda não têm
 * contrato_niveis.nivelInicio/nivelFim preenchidos (cadastro antigo):
 *   1) contrato_niveis.nivelInicio / nivelFim (alunos cadastrados com o modelo novo)
 *   2) assessment_pdi.macroInicio / macroTermino do PDI vinculado ao nível (alunos existentes)
 */
export async function resolverSnapshotEDatasDoNivel(alunoId: number, nivel: ContratoNivel) {
  const db = await getDb();
  if (!db) return { snapshot: null, dataInicio: nivel.nivelInicio ?? null, dataFim: nivel.nivelFim ?? null };

  // PDI vinculado ao nível: primeiro contrato_niveis.assessmentPdiId, senão busca reversa por contratoNivelId
  let pdi: any = null;
  if (nivel.assessmentPdiId) {
    const [row] = await db.select().from(assessmentPdi).where(eq(assessmentPdi.id, nivel.assessmentPdiId)).limit(1);
    pdi = row ?? null;
  }
  if (!pdi) {
    const [row] = await db.select().from(assessmentPdi)
      .where(and(eq(assessmentPdi.alunoId, alunoId), eq(assessmentPdi.contratoNivelId, nivel.id)))
      .orderBy(desc(assessmentPdi.createdAt))
      .limit(1);
    pdi = row ?? null;
  }

  const dataInicio = nivel.nivelInicio ?? pdi?.macroInicio ?? null;
  const dataFim = nivel.nivelFim ?? pdi?.macroTermino ?? null;

  let snapshot: any = null;
  if (pdi?.id) {
    const [snapRows] = await db.execute(sql.raw(
      `SELECT * FROM historico_ciclos_aluno WHERE assessmentPdiId = ${pdi.id} ORDER BY id DESC LIMIT 1`
    )) as any;
    snapshot = Array.isArray(snapRows) && snapRows[0] ? snapRows[0] : null;
  }

  return { snapshot, dataInicio, dataFim, pdi };
}

export async function avaliarElegibilidadeCertificacao(alunoId: number, contratoNivelId: number, historicoIdConhecido?: number | null) {
  const nivel = await getContratoNivelBruto(contratoNivelId);
  if (!nivel || nivel.alunoId !== alunoId) {
    return { elegivel: false, motivo: "Nível não encontrado." };
  }

  // Se quem chamou já sabe qual snapshot (historico_ciclos_aluno) corresponde a
  // este nível — vindo da tela de macrociclos, que já resolve isso de forma
  // confiável via auditoria_resets_ciclo — usa direto, em vez de tentar
  // redescobrir pela cadeia nivel→PDI (que falha quando o PDI não tem
  // contratoNivelId vinculado, caso comum em turmas legadas já resetadas).
  let snapshot: any = null;
  let dataInicio: any = null;
  let dataFim: any = null;
  if (historicoIdConhecido) {
    const database = await getDb();
    if (database) {
      const [snapRows]: any = await database.execute(sql.raw(
        `SELECT * FROM historico_ciclos_aluno WHERE id = ${historicoIdConhecido} LIMIT 1`
      ));
      snapshot = Array.isArray(snapRows) && snapRows[0] ? snapRows[0] : null;
    }
  }
  if (snapshot) {
    dataInicio = nivel.nivelInicio ?? null;
    dataFim = nivel.nivelFim ?? null;
  } else {
    const resolvido = await resolverSnapshotEDatasDoNivel(alunoId, nivel);
    snapshot = resolvido.snapshot;
    dataInicio = resolvido.dataInicio;
    dataFim = resolvido.dataFim;
  }

  const pedagogia = await getPedagogiaByNivel(alunoId, contratoNivelId);
  const assessments = pedagogia.assessments || [];
  const metasNivel = pedagogia.metas || [];
  const eventos = pedagogia.eventParticipation || [];
  const cases = pedagogia.casesSucesso || [];

  // "Encerrado" é o status gravado pelo reset (arquivarCicloAtual), não um cálculo por data.
  const nivelEncerrado = nivel.status === "encerrado" || nivel.status === "certificado";
  // Prova de que o reset realmente rodou e os dados deste ciclo foram congelados/arquivados.
  const snapshotCongelado = !!snapshot;

  const resultadoFinalFechado = snapshot ? true : assessments.some((a: any) => ["finalizado", "concluido"].includes(String(a.status)));

  // Quando existe snapshot, ele é a fonte mais segura pra tudo — os mesmos
  // números já mostrados pro aluno em indicadores.meuDashboardCongelado,
  // em vez de recalcular com consultas escopadas por nível que podem voltar
  // vazias pros mesmos motivos do snapshot não ter sido encontrado antes.
  const desafios = snapshot
    ? (Number(snapshot.metasTotal) > 0 ? (Number(snapshot.metasCumpridas) / Number(snapshot.metasTotal)) * 100 : 0)
    : (metasNivel.length > 0
        ? (metasNivel.filter((m: any) => String(m.status || "").toLowerCase() === "concluida").length / metasNivel.length) * 100
        : 0);

  const engajamento = snapshot
    ? Number(snapshot.ind7EngajamentoFinal ?? 0)
    : (eventos.length > 0
        ? (eventos.filter((e: any) => e.status === "presente").length / eventos.length) * 100
        : 0);

  const evidencias = snapshot
    ? (Number(snapshot.ind6Aplicabilidade ?? 0) > 0 ? 1 : 0)
    : cases.filter((c: any) => c.entregue === 1).length;

  // "Em branco" = a mentoria não tinha meta/evidência definida nesse período
  // (ex.: aluno resetado antes do rastreamento de metas existir) — isso não é
  // uma reprovação, é ausência de expectativa, então não deve travar o
  // certificado. Só bloqueia quando havia meta/evidência esperada e ela
  // realmente não foi cumprida.
  const metasEvidenciasDefinidas = snapshot ? Number(snapshot.metasTotal) > 0 : metasNivel.length > 0;

  const criterios = {
    nivelEncerrado,
    snapshotCongelado,
    dadosSegmentadosPorNivel: snapshot ? true : !pedagogia.dadosNaoSegmentadosPorNivel,
    resultadoFinalFechado,
    engajamentoMin80: engajamento >= 80,
    desafiosMin80: !metasEvidenciasDefinidas || desafios >= 80,
    evidenciasMinimas: !metasEvidenciasDefinidas || evidencias > 0,
  };

  const elegivel = criterios.nivelEncerrado
    && criterios.snapshotCongelado
    && criterios.dadosSegmentadosPorNivel
    && criterios.resultadoFinalFechado
    && criterios.engajamentoMin80
    && criterios.desafiosMin80
    && criterios.evidenciasMinimas;

  const motivos: string[] = [];
  if (!criterios.nivelEncerrado) motivos.push("Nível não está encerrado.");
  if (!criterios.snapshotCongelado) motivos.push("Este ciclo ainda não foi arquivado (reset) — dados ainda não estão congelados.");
  if (!criterios.dadosSegmentadosPorNivel) motivos.push("Não foi possível separar os dados deste aluno por nível — requer revisão manual (use a emissão manual do admin).");
  if (!criterios.resultadoFinalFechado) motivos.push("Resultado final do nível não está fechado.");
  if (!criterios.engajamentoMin80) motivos.push("Engajamento final abaixo de 80%.");
  if (!criterios.desafiosMin80) motivos.push("Desafios concluídos abaixo de 80%.");
  if (!criterios.evidenciasMinimas) motivos.push("Sem evidências/cases entregues no nível.");

  return {
    elegivel,
    criterios,
    metricas: {
      engajamento: Number(engajamento.toFixed(2)),
      desafios: Number(desafios.toFixed(2)),
      evidencias,
    },
    periodo: { dataInicio, dataFim },
    motivo: motivos.join(" "),
    nivel,
  };
}
/**
 * Sincroniza student_performance para alunos que cursam pela plataforma.
 * Chamada após conclusão de curso (submeterAvaliacao / concluirAtividade).
 *
 * Lógica:
 *  - aulasConcluidas  = atividades com status "aprovada" no cursoAtribuído
 *  - aulasDisponiveis = total de atividades do curso
 *  - mediaAvaliacoesRespondidas = notaFinal do alunoCursoAtribuido (0-100)
 *  - idCompetencia    = codigoIntegracao da competência (para o calculador casar)
 *  - idUsuario        = externalId do aluno
 */
export async function syncStudentPerformanceFromPlatform(
  alunoId: number,
  cursoAtribuidoId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    // 1. Buscar o curso atribuído
    const [cursoAtrib] = await db
      .select()
      .from(alunoCursoAtribuido)
      .where(
        and(
          eq(alunoCursoAtribuido.id, cursoAtribuidoId),
          eq(alunoCursoAtribuido.alunoId, alunoId)
        )
      )
      .limit(1);
    if (!cursoAtrib) return;
    const { cursoId, competenciaId } = cursoAtrib;

    // 2. Buscar dados do aluno
    const [alunoData] = await db
      .select({ externalId: alunos.externalId, name: alunos.name, email: alunos.email })
      .from(alunos)
      .where(eq(alunos.id, alunoId))
      .limit(1);
    if (!alunoData) return;
    const externalUserId = alunoData.externalId || String(alunoId);

    // 3. Buscar codigoIntegracao da competência
    const [compData] = await db
      .select({ codigoIntegracao: competencias.codigoIntegracao, nome: competencias.nome })
      .from(competencias)
      .where(eq(competencias.id, competenciaId))
      .limit(1);
    const externalCompetenciaId = compData?.codigoIntegracao || String(competenciaId);
    const competenciaName = compData?.nome || '';

    // 4. Contar atividades do curso (total e aprovadas)
    const todasAtividades = await db
      .select({ id: atividadesCurso.id })
      .from(atividadesCurso)
      .where(and(eq(atividadesCurso.cursoId, cursoId), eq(atividadesCurso.isActive, 1)));
    const aulasDisponiveis = todasAtividades.length;

    const atividadesAprovadas = await db
      .select({ notaFinal: alunoAtividadeProgresso.notaFinal })
      .from(alunoAtividadeProgresso)
      .where(
        and(
          eq(alunoAtividadeProgresso.alunoId, alunoId),
          eq(alunoAtividadeProgresso.cursoAtribuidoId, cursoAtribuidoId),
          eq(alunoAtividadeProgresso.status, 'aprovada')
        )
      );
     const aulasConcluidas = atividadesAprovadas.length;
    // 5. Calcular nota média APENAS das atividades que têm avaliação (notaFinal != null)
    // Atividades sem avaliação cadastrada não entram no cálculo — divisor = qtd com nota
    let mediaAvaliacoesRespondidas: string | null = null;
    const atividadesComNota = atividadesAprovadas.filter(
      (n) => n.notaFinal !== null && n.notaFinal !== undefined
    );
    if (atividadesComNota.length > 0) {
      const somaNotas = atividadesComNota.reduce(
        (acc, n) => acc + parseFloat(String(n.notaFinal)), 0
      );
      const media010 = somaNotas / atividadesComNota.length; // média só das que têm nota
      mediaAvaliacoesRespondidas = (media010 * 10).toFixed(2); // escala 0-100
    }

    const progressoTotal = aulasDisponiveis > 0
      ? Math.round((aulasConcluidas / aulasDisponiveis) * 100)
      : 0;
    const dataConclusaoStr = aulasConcluidas >= aulasDisponiveis && aulasDisponiveis > 0
      ? new Date().toISOString().split('T')[0]
      : null;

    // 6. Upsert no studentPerformance (mesmo formato da planilha)
    const existing = await db
      .select({ id: studentPerformance.id })
      .from(studentPerformance)
      .where(
        and(
          eq(studentPerformance.alunoId, alunoId),
          eq(studentPerformance.competenciaId, competenciaId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(studentPerformance)
        .set({
          externalUserId,
          aulasConcluidas,
          aulasDisponiveis,
          totalAulas: aulasDisponiveis,
          progressoTotal,
          avaliacoesRespondidas: atividadesComNota.length,
          mediaAvaliacoesRespondidas: mediaAvaliacoesRespondidas as any,
          dataConclusao: dataConclusaoStr,
          updatedAt: new Date(),
        })
        .where(eq(studentPerformance.id, existing[0].id));
    } else {
      await db.insert(studentPerformance).values({
        alunoId,
        externalUserId,
        userName: alunoData.name || '',
        userEmail: alunoData.email || null,
        competenciaId,
        externalCompetenciaId,
        competenciaName,
        aulasConcluidas,
        aulasDisponiveis,
        totalAulas: aulasDisponiveis,
        progressoTotal,
        avaliacoesRespondidas: atividadesComNota.length,
        mediaAvaliacoesRespondidas: mediaAvaliacoesRespondidas as any,
        dataConclusao: dataConclusaoStr,
      });
    }
  } catch (error) {
    console.error('[syncStudentPerformanceFromPlatform] Error:', error);
    // Não propagar erro para não interromper o fluxo principal
  }
}

// ============ BIBLIOTECA PEDAGÓGICA - CRIAÇÃO AUTOMÁTICA DE TABELAS ============
export async function ensureBibliotecaPedagogicaTables(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS \`fichas_pedagogicas_competencias\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`competenciaId\` int NOT NULL,
        \`linhaDesenvolvimento\` text NOT NULL,
        \`objetivoPedagogico\` text NOT NULL,
        \`oQueEnsina\` text NOT NULL,
        \`quandoIndicar\` text NOT NULL,
        \`sinaisObservaveis\` text NOT NULL,
        \`cuidadoIndicacao\` text,
        \`resumoMentor\` text NOT NULL,
        \`descricaoAluno\` text NOT NULL,
        \`sugestaoDesenvolvimentoCompetencia\` text NOT NULL,
        \`status\` enum('rascunho','publicada','inativa') NOT NULL DEFAULT 'rascunho',
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`createdBy\` varchar(255),
        \`updatedBy\` varchar(255)
      )
    `));
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS \`fichas_pedagogicas_conteudos\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`competenciaId\` int NOT NULL,
        \`conteudoId\` int NOT NULL,
        \`tipoConteudo\` enum('intro','filme','video','tedtalk','podcast','livro','curso','outro') NOT NULL,
        \`nomeConteudo\` varchar(255) NOT NULL,
        \`linkConteudo\` varchar(1000),
        \`papelPedagogico\` text NOT NULL,
        \`oQueAlunoAprende\` text NOT NULL,
        \`reflexaoEsperada\` text NOT NULL,
        \`quandoUsar\` text,
        \`orientacaoMentor\` text NOT NULL,
        \`descricaoAluno\` text NOT NULL,
        \`status\` enum('rascunho','publicada','inativa') NOT NULL DEFAULT 'rascunho',
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`createdBy\` varchar(255),
        \`updatedBy\` varchar(255)
      )
    `));
    console.log("[DB] Tabelas da Biblioteca Pedagógica verificadas/criadas com sucesso.");
  } catch (error) {
    console.error("[DB] Erro ao criar tabelas da Biblioteca Pedagógica:", error);
  }
}

// ============ ECODISC 360 - PAPEL DE DIRETOR (VISAO RESTRITA POR DIRETORIA) ============
export async function ensureDiretorSupport(): Promise<void> {
  const database = await getDb();
  if (!database) return;
  try {
    // Adiciona 'diretor' ao enum de role da tabela consultors (mantendo os valores existentes)
    await database.execute(sql.raw(
      "ALTER TABLE `consultors` MODIFY COLUMN `role` ENUM('mentor','gerente','diretor') NOT NULL DEFAULT 'mentor'"
    ));
  } catch (e: any) {
    console.warn("[DB] ensureDiretorSupport (role enum):", e?.message);
  }
  try {
    await database.execute(sql.raw(
      "ALTER TABLE `consultors` ADD COLUMN IF NOT EXISTS `managedDepartmentId` int"
    ));
  } catch (e: any) {
    if (!e?.message?.includes("Duplicate column")) {
      console.warn("[DB] ensureDiretorSupport (managedDepartmentId):", e?.message);
    }
  }
  console.log("[DB] Suporte a Diretor/Área (EcoDISC 360) verificado/criado com sucesso.");
}

/**
 * Listar diretores (papel 'diretor' na tabela consultors), com nome da empresa e da diretoria.
 */
export async function listDiretores(): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];
  const rows = await database.select({
    id: consultors.id,
    name: consultors.name,
    email: consultors.email,
    cpf: consultors.cpf,
    canLogin: consultors.canLogin,
    isActive: consultors.isActive,
    managedProgramId: consultors.managedProgramId,
    managedDepartmentId: consultors.managedDepartmentId,
  }).from(consultors).where(eq(consultors.role, 'diretor')).orderBy(consultors.name);

  if (rows.length === 0) return [];

  const programIds = Array.from(new Set(rows.map(r => r.managedProgramId).filter((v): v is number => !!v)));
  const departmentIds = Array.from(new Set(rows.map(r => r.managedDepartmentId).filter((v): v is number => !!v)));

  const programsList = programIds.length ? await database.select({ id: programs.id, name: programs.name }).from(programs).where(inArray(programs.id, programIds)) : [];
  const departmentsList = departmentIds.length ? await database.select({ id: departments.id, name: departments.name }).from(departments).where(inArray(departments.id, departmentIds)) : [];

  const programMap = new Map(programsList.map(p => [p.id, p.name]));
  const departmentMap = new Map(departmentsList.map(d => [d.id, d.name]));

  return rows.map(r => ({
    ...r,
    programName: r.managedProgramId ? programMap.get(r.managedProgramId) || null : null,
    departmentName: r.managedDepartmentId ? departmentMap.get(r.managedDepartmentId) || null : null,
  }));
}

/**
 * Criar diretor puro (sem perfil de aluno), vinculado a uma empresa E a uma diretoria especifica.
 * O diretor so consegue ver, no EcoDISC 360, os dados da sua diretoria.
 */
export async function createDiretorPuro(data: {
  name: string;
  email: string;
  cpf?: string;
  programId: number;
  departmentId: number;
}): Promise<{ success: boolean; message?: string }> {
  const database = await getDb();
  if (!database) return { success: false, message: "Banco de dados não disponível" };

  const normalizedEmail = data.email.toLowerCase().trim();
  const [existingDiretor] = await database.select()
    .from(consultors)
    .where(and(
      eq(consultors.email, normalizedEmail),
      eq(consultors.role, 'diretor'),
      eq(consultors.isActive, 1)
    ))
    .limit(1);

  if (existingDiretor) {
    return { success: false, message: `Já existe um diretor cadastrado com o email ${normalizedEmail}.` };
  }

  if (data.cpf) {
    const normalizedCpf = data.cpf.replace(/\D/g, '');
    const [existingCpfUser] = await database.select().from(users).where(and(eq(users.cpf, normalizedCpf), eq(users.isActive, 1))).limit(1);
    if (existingCpfUser) {
      return { success: false, message: "Este CPF já está cadastrado no sistema." };
    }
  }

  // Confirma que a diretoria pertence de fato a empresa selecionada
  const [dept] = await database.select().from(departments).where(eq(departments.id, data.departmentId)).limit(1);
  if (!dept || dept.programId !== data.programId) {
    return { success: false, message: "A diretoria selecionada não pertence à empresa escolhida." };
  }

  const [consultorResult] = await database.insert(consultors).values({
    name: data.name,
    email: normalizedEmail,
    cpf: data.cpf?.replace(/\D/g, '') || null,
    role: 'diretor' as const,
    managedProgramId: data.programId,
    managedDepartmentId: data.departmentId,
    canLogin: data.cpf ? 1 : 0,
    isActive: 1,
  });

  const consultorId = consultorResult.insertId;

  if (data.cpf) {
    const normalizedCpf = data.cpf.replace(/\D/g, '');
    const openId = `diretor_puro_${consultorId}`;

    await database.insert(users).values({
      openId,
      name: data.name,
      email: normalizedEmail,
      cpf: normalizedCpf,
      role: 'manager' as const,
      loginMethod: 'email_cpf',
      isActive: 1,
      consultorId: Number(consultorId),
      programId: data.programId,
      departmentId: data.departmentId,
      lastSignedIn: new Date(),
    });
  }

  return { success: true, message: `Diretor ${data.name} criado com sucesso.` };
}

/**
 * Remover papel de diretor (desativa o usuario e o consultor).
 */
export async function removeDiretorRole(consultorId: number): Promise<{ success: boolean; message?: string }> {
  const database = await getDb();
  if (!database) return { success: false, message: "Banco de dados não disponível" };

  const [consultor] = await database.select().from(consultors).where(eq(consultors.id, consultorId)).limit(1);
  if (!consultor || consultor.role !== 'diretor') {
    return { success: false, message: "Diretor não encontrado" };
  }

  await database.update(consultors).set({ isActive: 0 }).where(eq(consultors.id, consultorId));
  await database.update(users).set({ isActive: 0 }).where(eq(users.consultorId, consultorId));

  return { success: true, message: "Diretor removido com sucesso." };
}

// ============ PERFIL PROFISSIONAL DO ALUNO ============
export async function ensurePerfilProfissionalColumns(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const columns = [
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `dataNascimento` date",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `estadoCivil` varchar(30)",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `temFilhos` tinyint(1) DEFAULT 0",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `quantidadeFilhos` int DEFAULT 0",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `expectativaCurtoPrazo` text",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `expectativaMedioPrazo` text",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `expectativaLongoPrazo` text",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `formacaoSuperior` json",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `posGraduacoes` json",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `cursosExtracurriculares` json",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `experienciasAnteriores` json",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `experienciaLideranca` tinyint(1) DEFAULT 0",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `tipoEquipeGerenciada` json",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `gerenciouOutrosLideres` tinyint(1) DEFAULT 0",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `linkedinUrl` varchar(500)",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `facebookUrl` varchar(500)",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `instagramUrl` varchar(500)",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `tiktokUrl` varchar(500)",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `outraRedeUrl` varchar(500)",
    "ALTER TABLE `alunos` ADD COLUMN IF NOT EXISTS `curriculoUrl` varchar(1000)",
  ];
  for (const col of columns) {
    try {
      await db.execute(sql.raw(col));
    } catch (e: any) {
      if (!e?.message?.includes("Duplicate column")) {
        console.warn("[DB] ensurePerfilProfissionalColumns:", e?.message);
      }
    }
  }
  console.log("[DB] Colunas de perfil profissional verificadas/criadas com sucesso.");
}

// ============ HISTÓRICO DE CICLOS DO ALUNO ============
export async function ensureHistoricoCiclosTable(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS \`historico_ciclos_aluno\` (
        \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`alunoId\` int NOT NULL,
        \`numeroCiclo\` int NOT NULL DEFAULT 1,
        \`discResultadoId\` int,
        \`assessmentPdiId\` int,
        \`dataInicio\` timestamp NULL,
        \`dataConclusao\` timestamp NULL,
        \`observacoes\` text,
        \`ind1Webinars\` int NULL,
        \`ind2Avaliacoes\` int NULL,
        \`ind3Competencias\` int NULL,
        \`ind4Tarefas\` int NULL,
        \`ind5Engajamento\` int NULL,
        \`ind6Aplicabilidade\` int NULL,
        \`ind7EngajamentoFinal\` int NULL,
        \`metasTotal\` int NULL,
        \`metasCumpridas\` int NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `));
    // Adicionar colunas de snapshot se ainda não existirem (para tabelas já criadas)
    // Adicionar cicloOnboardingId no assessment_pdi se não existir
    try {
      await db.execute(sql.raw(`ALTER TABLE \`assessment_pdi\` ADD COLUMN \`cicloOnboardingId\` int NULL COMMENT 'FK para historico_ciclos_aluno'`));
    } catch (_) { /* coluna já existe */ }
    const snapshotCols = [
      "ind1Webinars", "ind2Avaliacoes", "ind3Competencias", "ind4Tarefas",
      "ind5Engajamento", "ind6Aplicabilidade", "ind7EngajamentoFinal",
      "metasTotal", "metasCumpridas"
    ];
    for (const col of snapshotCols) {
      try {
        await db.execute(sql.raw(`ALTER TABLE \`historico_ciclos_aluno\` ADD COLUMN \`${col}\` int NULL`));
      } catch (_) { /* coluna já existe */ }
    }
    console.log("[DB] Tabela historico_ciclos_aluno verificada/criada com sucesso.");
  } catch (error) {
    console.error("[DB] Erro ao criar tabela historico_ciclos_aluno:", error);
  }
}

/**
 * Arquiva o ciclo atual do aluno (DISC + PDI) antes de liberar novo ciclo de onboarding.
 * Chamado por liberarOnboardingAluno antes de setar onboardingLiberado=1.
 *
 * Implementa:
 * - Idempotência: não duplica histórico se já existe registro para o ciclo atual
 * - Snapshot dos 7 indicadores no momento do encerramento
 * - Congelamento dos PDIs ativos e microciclos de execução
 */
export async function arquivarCicloAtual(alunoId: number): Promise<{ numeroCiclo: number }> {
  const db = await getDb();
  if (!db) return { numeroCiclo: 1 };

  // === 1. BUSCAR DADOS DO CICLO ATUAL ===

  // Buscar o último DISC do aluno (ciclo mais recente)
  const [discRows] = await db.execute(sql.raw(
    `SELECT id, ciclo, scoreD, scoreI, scoreS, scoreC, perfilPredominante, perfilSecundario FROM disc_resultados WHERE alunoId = ${alunoId} ORDER BY ciclo DESC, createdAt DESC LIMIT 1`
  )) as any;
  const discRow = Array.isArray(discRows) ? discRows[0] : null;

  // Buscar o PDI que está sendo arquivado (congelado = ciclo anterior ao reset).
  // REGRA DE NEGÓCIO: o snapshot do ciclo arquivado deve usar o período do PDI CONGELADO
  // (macroInicio do PDI congelado → data do reset), NÃO o PDI ativo (que é o novo macrociclo).
  // Isso garante que Evolução mostre dados do ciclo anterior e Performance mostre dados do ciclo atual.
  const [pdiCongeladoRows] = await db.execute(sql.raw(
    `SELECT id, macroInicio, macroTermino FROM assessment_pdi WHERE alunoId = ${alunoId} AND status = 'congelado' ORDER BY createdAt DESC LIMIT 1`
  )) as any;
  const pdiCongeladoRow = Array.isArray(pdiCongeladoRows) ? pdiCongeladoRows[0] : null;
  // Fallback: PDI ativo (para alunos sem PDI congelado ainda)
  const [pdiActiveRows] = await db.execute(sql.raw(
    `SELECT id, macroInicio, macroTermino FROM assessment_pdi WHERE alunoId = ${alunoId} AND status = 'ativo' ORDER BY createdAt DESC LIMIT 1`
  )) as any;
  const pdiActiveRow = Array.isArray(pdiActiveRows) ? pdiActiveRows[0] : null;
  // Fallback final: qualquer PDI mais recente
  let pdiId: number | null = pdiCongeladoRow?.id || pdiActiveRow?.id || null;
  let pdiFallbackRow: any = null;
  if (!pdiId) {
    const [pdiAnyRows] = await db.execute(sql.raw(
      `SELECT id, macroInicio, macroTermino FROM assessment_pdi WHERE alunoId = ${alunoId} ORDER BY createdAt DESC LIMIT 1`
    )) as any;
    pdiFallbackRow = Array.isArray(pdiAnyRows) ? pdiAnyRows[0] : null;
    pdiId = pdiFallbackRow?.id ?? null;
  }
  // Extrair macroInicio do PDI congelado (ciclo que está sendo arquivado)
  // e usar a data atual como macroTermino (data do reset = fim do ciclo anterior)
  const pdiMacroRow = pdiCongeladoRow || pdiActiveRow || pdiFallbackRow || null;
  const macroInicioStr: string | null = pdiMacroRow?.macroInicio
    ? String(pdiMacroRow.macroInicio).split('T')[0]
    : null;
  // macroTermino = data do reset (hoje), não o macroTermino do PDI
  const macroTerminoStr: string = new Date().toISOString().split('T')[0];

  // Buscar o aceite do onboarding para pegar dataInicio
  const [jornadaRows] = await db.execute(sql.raw(
    `SELECT aceiteRealizadoEm FROM onboarding_jornada WHERE alunoId = ${alunoId} ORDER BY ciclo DESC LIMIT 1`
  )) as any;
  const jornada = Array.isArray(jornadaRows) ? jornadaRows[0] : null;

  // === 2. IDEMPOTÊNCIA: verificar se já existe registro para este ciclo ===
  const discIdStr = discRow?.id ? String(discRow.id) : 'NULL';
  const pdiIdStr = pdiId ? String(pdiId) : 'NULL';
  if (discRow?.id || pdiId) {
    const checkCond = discRow?.id && pdiId
      ? `discResultadoId = ${discRow.id} AND assessmentPdiId = ${pdiId}`
      : discRow?.id
        ? `discResultadoId = ${discRow.id}`
        : `assessmentPdiId = ${pdiId}`;
    const [existRows] = await db.execute(sql.raw(
      `SELECT id, numeroCiclo FROM historico_ciclos_aluno WHERE alunoId = ${alunoId} AND ${checkCond} LIMIT 1`
    )) as any;
    const existRow = Array.isArray(existRows) ? existRows[0] : null;
    if (existRow) {
      console.log(`[DB] Ciclo já arquivado para aluno ${alunoId} (id=${existRow.id}, ciclo=${existRow.numeroCiclo}). Idempotência ativada.`);
      return { numeroCiclo: existRow.numeroCiclo };
    }
  }

  // === 3. CALCULAR SNAPSHOT DOS INDICADORES ===
  // Cálculo direto via SQL para evitar dependência circular com indicatorsCalculatorV2

  // Filtros de macrociclo para os indicadores baseados em período
  // Se o PDI tem macroInicio/macroTermino, filtrar eventos/sessões/cases dentro do período
  const macroInicioFilter = macroInicioStr ? `AND e.eventDate >= '${macroInicioStr}'` : '';
  const macroTerminoFilterEp = macroTerminoStr ? `AND e.eventDate <= '${macroTerminoStr}'` : '';
  const macroInicioFilterMs = macroInicioStr ? `AND ms.sessionDate >= '${macroInicioStr}'` : '';
  const macroTerminoFilterMs = macroTerminoStr ? `AND ms.sessionDate <= '${macroTerminoStr}'` : '';
  const macroInicioFilterCs = macroInicioStr ? `AND cs.dataEntrega >= '${macroInicioStr}'` : '';
  const macroTerminoFilterCs = macroTerminoStr ? `AND cs.dataEntrega <= '${macroTerminoStr}'` : '';

  // Ind.1: Webinars (% de presenças em eventos dentro do macrociclo)
  // eventDate mora na tabela events, não em event_participation — precisa do JOIN.
  const [webinarRows] = await db.execute(sql.raw(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN ep.status = 'presente' THEN 1 ELSE 0 END) as presentes
    FROM event_participation ep
    JOIN events e ON e.id = ep.eventId
    WHERE ep.alunoId = ${alunoId}
      ${macroInicioFilter}
      ${macroTerminoFilterEp}
  `)) as any;
  const webinarData = Array.isArray(webinarRows) ? webinarRows[0] : null;
  const ind1Webinars = webinarData?.total > 0
    ? Math.round((Number(webinarData.presentes) / Number(webinarData.total)) * 100)
    : 0;

  // Ind.2: Avaliações e Ind.3: Competências (via student_performance)
  // Buscar externalId do aluno primeiro para evitar OR/CAST que falha no MySQL
  const [alunoExtRows] = await db.execute(sql.raw(
    `SELECT externalId FROM alunos WHERE id = ${alunoId} LIMIT 1`
  )) as any;
  const externalId = Array.isArray(alunoExtRows) && alunoExtRows[0]?.externalId
    ? alunoExtRows[0].externalId
    : String(alunoId);
  const externalIdSafe = externalId.replace(/'/g, "''");

  let ind2Avaliacoes = 0;
  try {
    const [avalRows] = await db.execute(sql.raw(`
      SELECT AVG(sp.mediaAvaliacoesRespondidas) as mediaAval
      FROM student_performance sp
      WHERE sp.externalUserId = '${externalIdSafe}' AND sp.mediaAvaliacoesRespondidas IS NOT NULL
    `)) as any;
    const avalData = Array.isArray(avalRows) ? avalRows[0] : null;
    ind2Avaliacoes = avalData?.mediaAval != null ? Math.round(Number(avalData.mediaAval)) : 0;
  } catch (_e2) {
    // coluna pode não existir no banco de staging — retorna 0
  }

  let ind3Competencias = 0;
  try {
    const [compRows] = await db.execute(sql.raw(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN sp.progressoTotal >= 100 THEN 1 ELSE 0 END) as concluidas
      FROM student_performance sp
      WHERE sp.externalUserId = '${externalIdSafe}'
    `)) as any;
    const compData = Array.isArray(compRows) ? compRows[0] : null;
    ind3Competencias = compData?.total > 0
      ? Math.round((Number(compData.concluidas) / Number(compData.total)) * 100)
      : 0;
  } catch (_e3) {
    // tabela pode não existir no banco de staging — retorna 0
  }

  // Ind.4: Tarefas (% de tarefas entregues dentro do macrociclo)
  const [tarefaRows] = await db.execute(sql.raw(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN ms.taskStatus = 'entregue' THEN 1 ELSE 0 END) as entregues
    FROM mentoring_sessions ms
    WHERE ms.alunoId = ${alunoId} AND ms.taskStatus IN ('entregue', 'nao_entregue')
      ${macroInicioFilterMs}
      ${macroTerminoFilterMs}
  `)) as any;
  const tarefaData = Array.isArray(tarefaRows) ? tarefaRows[0] : null;
  const ind4Tarefas = tarefaData?.total > 0
    ? Math.round((Number(tarefaData.entregues) / Number(tarefaData.total)) * 100)
    : 0;

  // Ind.5: Engajamento (média das notas da mentora dentro do macrociclo, convertida de 0-10 para 0-100)
  const [engRows] = await db.execute(sql.raw(`
    SELECT AVG(ms.engagementScore) as mediaEng
    FROM mentoring_sessions ms
    WHERE ms.alunoId = ${alunoId} AND ms.engagementScore IS NOT NULL
      ${macroInicioFilterMs}
      ${macroTerminoFilterMs}
  `)) as any;
  const engData = Array.isArray(engRows) ? engRows[0] : null;
  const mediaEngRaw = engData?.mediaEng != null ? Number(engData.mediaEng) : 0;
  const ind5Engajamento = Math.round(Math.min(100, Math.max(0, mediaEngRaw * 10)));

  // Ind.6: Aplicabilidade (% de cases entregues dentro do macrociclo)
  const [caseRows] = await db.execute(sql.raw(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN cs.entregue = 1 THEN 1 ELSE 0 END) as entregues
    FROM cases_sucesso cs
    WHERE cs.alunoId = ${alunoId}
      ${macroInicioFilterCs}
      ${macroTerminoFilterCs}
  `)) as any;
  const caseData = Array.isArray(caseRows) ? caseRows[0] : null;
  const ind6Aplicabilidade = caseData?.total > 0
    ? Math.round((Number(caseData.entregues) / Number(caseData.total)) * 100)
    : 0;

  // Ind.7: Engajamento Final (média dos 5 indicadores principais)
  const ind7EngajamentoFinal = Math.round(
    (ind1Webinars + ind2Avaliacoes + ind3Competencias + ind4Tarefas + ind5Engajamento) / 5
  );

  // Metas: total e cumpridas do PDI ativo
  // Cumprida = evidência enviada pelo aluno E validada pela mentora (metas.status = 'validada').
  // Fonte única: coluna `metas.status`, ligada diretamente ao envio/validação de evidência
  // (substituiu o antigo cálculo via `meta_acompanhamento`, que era manual e desconectado da evidência).
  let metasTotal = 0;
  let metasCumpridas = 0;
  if (pdiId) {
    const [metaRows] = await db.execute(sql.raw(`
      SELECT COUNT(*) as total, SUM(CASE WHEN status = 'validada' THEN 1 ELSE 0 END) as cumpridas
      FROM metas m
      WHERE m.alunoId = ${alunoId} AND m.assessmentPdiId = ${pdiId} AND m.isActive = 1
    `)) as any;
    const row = Array.isArray(metaRows) && metaRows[0] ? metaRows[0] : null;
    metasTotal = Number(row?.total ?? 0);
    metasCumpridas = Number(row?.cumpridas ?? 0);
  }

  // === MACROINDICADORES: Calcular os 3 valores que aparecem na página de Performance ===
  // Macro 1: Engajamento = ind7EngajamentoFinal (já calculado acima)
  const snapshotEngajamento = ind7EngajamentoFinal;

  // Macro 2: Metas (Jornada de Superação) = percentual de metas cumpridas
  const snapshotMetasPercentual = metasTotal > 0
    ? Math.round((metasCumpridas / metasTotal) * 100)
    : 0;

  // Macro 3: Aplicabilidade Prática = calculado igual ao endpoint meuDashboard
  // Usa macroInicio/macroTermino do PDI como período de referência (sem hardcode)
  let snapshotAplicabilidade = 0;
  try {
    const macroInicioFilterSessAplic = macroInicioStr ? `AND sessionDate >= '${macroInicioStr}'` : '';
    const macroTerminoFilterSessAplic = macroTerminoStr ? `AND sessionDate <= '${macroTerminoStr}'` : '';
    const macroInicioFilterCasesAplic = macroInicioStr ? `AND dataEntrega >= '${macroInicioStr}'` : '';
    const macroTerminoFilterCasesAplic = macroTerminoStr ? `AND dataEntrega <= '${macroTerminoStr}'` : '';
    const [sessAplic] = await db.execute(sql.raw(`
      SELECT notaAlunoAplicabilidade, notaMentoraAplicabilidade
      FROM mentoring_sessions
      WHERE alunoId = ${alunoId}
        ${macroInicioFilterSessAplic}
        ${macroTerminoFilterSessAplic}
        AND (notaAlunoAplicabilidade IS NOT NULL OR notaMentoraAplicabilidade IS NOT NULL)
    `)) as any;
    const sessoesComAplic = Array.isArray(sessAplic) ? sessAplic : [];

    const [casesAplic] = await db.execute(sql.raw(`
      SELECT notaAlunoAplicabilidade, notaMentoraAplicabilidade, entregue
      FROM cases_sucesso
      WHERE alunoId = ${alunoId} AND entregue = 1
        ${macroInicioFilterCasesAplic}
        ${macroTerminoFilterCasesAplic}
        AND (notaAlunoAplicabilidade IS NOT NULL OR notaMentoraAplicabilidade IS NOT NULL)
    `)) as any;
    const casesComAplic = Array.isArray(casesAplic) ? casesAplic : [];

    const [casesAll] = await db.execute(sql.raw(`
      SELECT entregue FROM cases_sucesso
      WHERE alunoId = ${alunoId}
        ${macroInicioFilterCasesAplic}
        ${macroTerminoFilterCasesAplic}
    `)) as any;
    const todosOsCases = Array.isArray(casesAll) ? casesAll : [];

    const microTarefa = calcularMicroTarefaAplicabilidade(
      sessoesComAplic.map((s: any) => ({
        notaAlunoAplicabilidade: s.notaAlunoAplicabilidade,
        notaMentoraAplicabilidade: s.notaMentoraAplicabilidade,
      }))
    );
    const caseAplicavel = todosOsCases.length > 0;
    const anyCaseEntregue = todosOsCases.some((c: any) => c.entregue === 1);
    const microCasePercentual = caseAplicavel ? (anyCaseEntregue ? 100 : 0) : null;

    const aplicResult = calcularAplicabilidadeFinal({
      microTarefaPercentual: microTarefa.percentual,
      microCasePercentual,
      caseAplicavel,
      provisoria: microTarefa.provisoria,
      totalTarefasComAplicabilidade: microTarefa.total,
      totalCasesConsiderados: caseAplicavel ? 1 : 0,
    });
    snapshotAplicabilidade = Math.round(aplicResult.percentualFinal ?? 0);
  } catch (e) {
    console.warn(`[DB] Aviso: erro ao calcular snapshot de aplicabilidade para aluno ${alunoId}:`, e);
  }

  // === 4. CONGELAR PDIs ATIVOS ===
  // Contar PDIs ativos antes de congelar
  const [pdiCountRows] = await db.execute(sql.raw(
    `SELECT COUNT(*) as cnt FROM assessment_pdi WHERE alunoId = ${alunoId} AND status = 'ativo'`
  )) as any;
  const pdisCongeladosCount = Number(Array.isArray(pdiCountRows) ? (pdiCountRows[0]?.cnt ?? 0) : 0);
  await db.execute(sql.raw(`
    UPDATE assessment_pdi
    SET status = 'congelado', congeladoEm = NOW(), motivoCongelamento = 'Ciclo encerrado pelo admin'
    WHERE alunoId = ${alunoId} AND status = 'ativo'
  `));
  console.log(`[DB] PDIs ativos do aluno ${alunoId} congelados (${pdisCongeladosCount}).`);

  // === 5. CONGELAR MICROCICLOS DE EXECUÇÃO ===
  let microciclosCongeladosCount = 0;
  try {
    const [mcCountRows] = await db.execute(sql.raw(
      `SELECT COUNT(*) as cnt FROM ciclos_execucao WHERE alunoId = ${alunoId} AND status != 'congelado'`
    )) as any;
    microciclosCongeladosCount = Number(Array.isArray(mcCountRows) ? (mcCountRows[0]?.cnt ?? 0) : 0);
    await db.execute(sql.raw(`
      UPDATE ciclos_execucao
      SET status = 'congelado'
      WHERE alunoId = ${alunoId} AND status != 'congelado'
    `));
  } catch (_) {
    // Tabela pode não existir em todos os ambientes
    console.warn(`[DB] Aviso: ciclos_execucao não encontrada para aluno ${alunoId}`);
  }

  // === 6. DETERMINAR NÚMERO DO CICLO ===
  const [maxCicloRows] = await db.execute(sql.raw(
    `SELECT COALESCE(MAX(numeroCiclo), 0) as maxCiclo FROM historico_ciclos_aluno WHERE alunoId = ${alunoId}`
  )) as any;
  const maxCicloArr = Array.isArray(maxCicloRows) ? maxCicloRows : [];
  const maxCiclo = maxCicloArr[0]?.maxCiclo ?? 0;
  const numeroCiclo = (Number(maxCiclo) || 0) + 1;

  // === 7. INSERIR REGISTRO DE HISTÓRICO COM SNAPSHOT ===
  const dataInicio = jornada?.aceiteRealizadoEm
    ? `'${new Date(jornada.aceiteRealizadoEm).toISOString().slice(0, 19).replace('T', ' ')}'`
    : 'NULL';

  // Snapshot DISC — copiar scores diretamente para o histórico (autossuficiente mesmo após delete do aluno)
  const discScoreD = discRow?.scoreD != null ? String(discRow.scoreD) : 'NULL';
  const discScoreI = discRow?.scoreI != null ? String(discRow.scoreI) : 'NULL';
  const discScoreS = discRow?.scoreS != null ? String(discRow.scoreS) : 'NULL';
  const discScoreC = discRow?.scoreC != null ? String(discRow.scoreC) : 'NULL';
  const discPerfil = discRow?.perfilPredominante ? `'${discRow.perfilPredominante}'` : 'NULL';
  const discPerfilSec = discRow?.perfilSecundario ? `'${discRow.perfilSecundario}'` : 'NULL';

  await db.execute(sql.raw(`
    INSERT INTO historico_ciclos_aluno (
      alunoId, numeroCiclo, discResultadoId, assessmentPdiId,
      dataInicio, dataConclusao,
      ind1Webinars, ind2Avaliacoes, ind3Competencias, ind4Tarefas,
      ind5Engajamento, ind6Aplicabilidade, ind7EngajamentoFinal,
      metasTotal, metasCumpridas,
      snapshotEngajamento, snapshotMetasPercentual, snapshotAplicabilidade,
      snapshotMetasTotal, snapshotMetasCumpridas,
      snapshotInd1, snapshotInd2, snapshotInd3, snapshotInd4, snapshotInd5,
      snapshotDiscD, snapshotDiscI, snapshotDiscS, snapshotDiscC,
      snapshotDiscPerfil, snapshotDiscPerfilSecundario,
      createdAt, updatedAt
    ) VALUES (
      ${alunoId}, ${numeroCiclo}, ${discIdStr}, ${pdiIdStr === 'NULL' ? 'NULL' : pdiIdStr},
      ${dataInicio}, NOW(),
      ${ind1Webinars}, ${ind2Avaliacoes}, ${ind3Competencias}, ${ind4Tarefas},
      ${ind5Engajamento}, ${ind6Aplicabilidade}, ${ind7EngajamentoFinal},
      ${metasTotal}, ${metasCumpridas},
      ${snapshotEngajamento}, ${snapshotMetasPercentual}, ${snapshotAplicabilidade},
      ${metasTotal}, ${metasCumpridas},
      ${ind1Webinars}, ${ind2Avaliacoes}, ${ind3Competencias}, ${ind4Tarefas}, ${ind5Engajamento},
      ${discScoreD}, ${discScoreI}, ${discScoreS}, ${discScoreC},
      ${discPerfil}, ${discPerfilSec},
      NOW(), NOW()
    )
  `));

  // === 8. VINCULAR PDI AO CICLO HISTÓRICO (FK cicloOnboardingId) ===
  if (pdiId) {
    // Buscar o id do registro recém-inserido
    const [lastInsertRows] = await db.execute(sql.raw(
      `SELECT id FROM historico_ciclos_aluno WHERE alunoId = ${alunoId} AND numeroCiclo = ${numeroCiclo} LIMIT 1`
    )) as any;
    const historicoId = Array.isArray(lastInsertRows) && lastInsertRows[0]?.id ? lastInsertRows[0].id : null;
    if (historicoId) {
      await db.execute(sql.raw(
        `UPDATE assessment_pdi SET cicloOnboardingId = ${historicoId} WHERE id = ${pdiId}`
      ));
    }
  }

  // === 9. REGISTRAR AUDITORIA ===
  try {
    const [lastInsertForAudit] = await db.execute(sql.raw(
      `SELECT id FROM historico_ciclos_aluno WHERE alunoId = ${alunoId} AND numeroCiclo = ${numeroCiclo} LIMIT 1`
    )) as any;
    const historicoIdForAudit = Array.isArray(lastInsertForAudit) && lastInsertForAudit[0]?.id ? lastInsertForAudit[0].id : null;
    // Buscar nome do aluno
    const [alunoRows] = await db.execute(sql.raw(
      `SELECT name FROM alunos WHERE id = ${alunoId} LIMIT 1`
    )) as any;
    const alunoNome = Array.isArray(alunoRows) && alunoRows[0]?.name ? alunoRows[0].name : null;
    await db.execute(sql.raw(`
      INSERT INTO auditoria_resets_ciclo
        (alunoId, alunoNome, numeroCicloArquivado, historicoId, pdisCongelados, microciclosCongelados, ind7Snapshot)
      VALUES
        (${alunoId}, ${alunoNome ? `'${alunoNome.replace(/'/g, "''")}'` : 'NULL'}, ${numeroCiclo}, ${historicoIdForAudit ?? 'NULL'}, ${pdisCongeladosCount}, ${microciclosCongeladosCount}, ${ind7EngajamentoFinal ?? 'NULL'})
    `));
  } catch (auditErr) {
    // Auditoria não deve bloquear o fluxo principal
    console.warn('[DB] Aviso: não foi possível registrar auditoria de reset:', auditErr);
  }

  console.log(`[DB] Ciclo ${numeroCiclo} arquivado para aluno ${alunoId}. DISC: ${discRow?.id ?? 'N/A'}, PDI: ${pdiId ?? 'N/A'}. Indicadores: Ind1=${ind1Webinars}%, Ind7=${ind7EngajamentoFinal}%`);

  // === 10. AVANÇAR CONTRATO_NIVEIS: encerrar nível atual e criar próximo ===
  try {
    const NIVEL_SEQUENCIA: Record<string, string> = { 'I': 'II', 'II': 'III', 'III': 'IV', 'IV': 'V' };
    // Buscar nível vigente (em_andamento) do aluno
    const [nivelAtualRows] = await db.execute(sql.raw(
      `SELECT id, nivel, contratoId, mentoraPrincipalId FROM contrato_niveis WHERE alunoId = ${alunoId} AND status = 'em_andamento' ORDER BY id DESC LIMIT 1`
    )) as any;
    const nivelAtual = Array.isArray(nivelAtualRows) ? nivelAtualRows[0] : null;
    if (nivelAtual) {
      const proximoNivel = NIVEL_SEQUENCIA[nivelAtual.nivel];
      if (proximoNivel) {
        // Encerrar nível atual
        await db.execute(sql.raw(
          `UPDATE contrato_niveis SET status = 'encerrado', updatedAt = NOW() WHERE id = ${nivelAtual.id}`
        ));
        // Criar próximo nível
        const mentorId = nivelAtual.mentoraPrincipalId ? String(nivelAtual.mentoraPrincipalId) : 'NULL';
        await db.execute(sql.raw(
          `INSERT INTO contrato_niveis (contratoId, alunoId, nivel, status, mentoraPrincipalId, createdAt, updatedAt) VALUES (${nivelAtual.contratoId ?? 0}, ${alunoId}, '${proximoNivel}', 'em_andamento', ${mentorId}, NOW(), NOW())`
        ));
        console.log(`[DB] Nível ${nivelAtual.nivel} encerrado → Nível ${proximoNivel} criado para aluno ${alunoId}.`);
      } else {
        console.warn(`[DB] Aluno ${alunoId} está no nível ${nivelAtual.nivel} — não há próximo nível definido.`);
      }
    } else {
      // Nenhum nível em_andamento: verificar se deve criar Nível I
      const [anyNivelRows] = await db.execute(sql.raw(
        `SELECT COUNT(*) as cnt FROM contrato_niveis WHERE alunoId = ${alunoId}`
      )) as any;
      const anyNivel = Array.isArray(anyNivelRows) ? anyNivelRows[0] : null;
      if (!anyNivel || Number(anyNivel.cnt) === 0) {
        await db.execute(sql.raw(
          `INSERT INTO contrato_niveis (contratoId, alunoId, nivel, status, createdAt, updatedAt) VALUES (0, ${alunoId}, 'I', 'em_andamento', NOW(), NOW())`
        ));
        console.log(`[DB] Nível I criado para aluno ${alunoId} (sem nível anterior).`);
      } else {
        console.warn(`[DB] Aluno ${alunoId} não tem nível em_andamento após reset. Nenhum novo nível criado.`);
      }
    }
  } catch (nivelErr) {
    // Avanço de nível não deve bloquear o fluxo principal
    console.warn('[DB] Aviso: erro ao avançar contrato_niveis:', nivelErr);
  }

  return { numeroCiclo };
}

/**
 * Busca o histórico de ciclos de um aluno para a página de Evolução.
 */
export async function getHistoricoCiclosAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(sql.raw(`
    SELECT
      h.id,
      h.numeroCiclo,
      h.discResultadoId,
      h.assessmentPdiId,
      h.dataInicio,
      h.dataConclusao,
      h.observacoes,
      h.createdAt,
      h.ind1Webinars,
      h.ind2Avaliacoes,
      h.ind3Competencias,
      h.ind4Tarefas,
      h.ind5Engajamento,
      h.ind6Aplicabilidade,
      h.ind7EngajamentoFinal,
      h.metasTotal,
      h.metasCumpridas,
      h.snapshotEngajamento,
      h.snapshotMetasPercentual,
      h.snapshotAplicabilidade,
      h.snapshotMetasTotal,
      h.snapshotMetasCumpridas,
      h.snapshotInd1,
      h.snapshotInd2,
      h.snapshotInd3,
      h.snapshotInd4,
      h.snapshotInd5,
      -- DISC: usar snapshot do histórico (autossuficiente) com fallback para o registro original
      COALESCE(h.snapshotDiscPerfil, dr.perfilPredominante) as perfilPredominante,
      COALESCE(h.snapshotDiscPerfilSecundario, dr.perfilSecundario) as perfilSecundario,
      COALESCE(h.snapshotDiscD, dr.scoreD) as scoreD,
      COALESCE(h.snapshotDiscI, dr.scoreI) as scoreI,
      COALESCE(h.snapshotDiscS, dr.scoreS) as scoreS,
      COALESCE(h.snapshotDiscC, dr.scoreC) as scoreC,
      dr.completedAt as discCompletadoEm,
      ap.macroInicio,
      ap.macroTermino,
      ap.status as pdiStatus,
      ap.contratoNivelId as contratoNivelId
    FROM historico_ciclos_aluno h
    LEFT JOIN disc_resultados dr ON dr.id = h.discResultadoId
    LEFT JOIN assessment_pdi ap ON ap.id = h.assessmentPdiId
    WHERE h.alunoId = ${alunoId}
    ORDER BY h.numeroCiclo ASC
  `)) as any;
  return Array.isArray(rows) ? rows : [];
}

/**
 * Busca o log de auditoria de resets de ciclos para o admin.
 * Retorna os últimos N registros, opcionalmente filtrados por alunoId.
 */
export async function getAuditoriaResets(options?: { alunoId?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const whereClause = options?.alunoId ? `WHERE alunoId = ${options.alunoId}` : '';
  const limitClause = `LIMIT ${options?.limit ?? 100}`;
  try {
    const [rows] = await db.execute(sql.raw(`
      SELECT
        id,
        alunoId,
        alunoNome,
        adminId,
        adminNome,
        numeroCicloArquivado,
        historicoId,
        pdisCongelados,
        microciclosCongelados,
        ind7Snapshot,
        observacoes,
        criadoEm
      FROM auditoria_resets_ciclo
      ${whereClause}
      ORDER BY criadoEm DESC
      ${limitClause}
    `)) as any;
    return Array.isArray(rows) ? rows : [];
  } catch (_) {
    // Tabela pode não existir em ambientes antigos
    return [];
  }
}

/**
 * Retorna um Map de alunoId → dados do reset mais recente.
 * Usado pelo dashboard Por Empresa e listagem de alunos para exibir badge de reset.
 */
export async function getAllResetsPorAluno(): Promise<Map<number, { criadoEm: Date; numeroCicloArquivado: number; adminNome: string | null; ind7Snapshot: number | null }>> {
  const db = await getDb();
  if (!db) return new Map();
  try {
    const [rows] = await db.execute(sql.raw(`
      SELECT alunoId, MAX(criadoEm) as criadoEm, MAX(numeroCicloArquivado) as numeroCicloArquivado,
             MAX(adminNome) as adminNome, MAX(ind7Snapshot) as ind7Snapshot
      FROM auditoria_resets_ciclo
      GROUP BY alunoId
    `)) as any;
    const result = new Map<number, { criadoEm: Date; numeroCicloArquivado: number; adminNome: string | null; ind7Snapshot: number | null }>();
    if (Array.isArray(rows)) {
      for (const row of rows) {
        result.set(Number(row.alunoId), {
          criadoEm: row.criadoEm,
          numeroCicloArquivado: Number(row.numeroCicloArquivado),
          adminNome: row.adminNome ?? null,
          ind7Snapshot: row.ind7Snapshot != null ? parseFloat(row.ind7Snapshot) : null,
        });
      }
    }
    return result;
  } catch (_) {
    return new Map();
  }
}

/**
 * Busca todos os históricos de ciclos de uma lista de alunoIds.
 * Usado pelo dashboard Por Empresa para calcular médias dos ciclos anteriores.
 */
export async function getHistoricoCiclosPorEmpresa(alunoIds: number[]) {
  const db = await getDb();
  if (!db || alunoIds.length === 0) return [];
  const ids = alunoIds.join(',');
  const [rows] = await db.execute(sql.raw(`
    SELECT
      h.alunoId,
      h.numeroCiclo,
      h.snapshotEngajamento,
      h.snapshotInd1,
      h.snapshotInd2,
      h.snapshotInd3,
      h.snapshotInd4,
      h.snapshotInd5,
      h.snapshotAplicabilidade,
      h.snapshotMetasPercentual
    FROM historico_ciclos_aluno h
    WHERE h.alunoId IN (${ids})
    ORDER BY h.alunoId, h.numeroCiclo DESC
  `)) as any;
  return Array.isArray(rows) ? rows : [];
}

export async function ensureRelatorioMentoriasLogTable(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS \`relatorio_mentorias_log\` (
        \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`data_envio\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`tipo\` enum('previa','definitivo','manual') NOT NULL,
        \`periodo_inicio\` date NOT NULL,
        \`periodo_fim\` date NOT NULL,
        \`destinatarios\` json NOT NULL,
        \`total_sessoes\` int NOT NULL DEFAULT 0,
        \`total_valor\` decimal(10,2) NOT NULL DEFAULT 0,
        \`enviado_por\` varchar(255) NULL
      )
    `));
    console.log('[DB] Tabela relatorio_mentorias_log verificada/criada com sucesso.');
  } catch (err: any) {
    console.error('[DB] Erro ao criar tabela relatorio_mentorias_log:', err.message);
  }
}

/**
 * Retorna a data do último reset de um aluno específico (criadoEm da auditoria_resets_ciclo).
 * Usado pela página de Performance para filtrar eventos e mentorias anteriores ao reset.
 * Se o aluno nunca sofreu reset, retorna null.
 */
/**
 * Resolve a janela [dataInicio, dataFim] de um reset específico de um aluno —
 * dataFim é a data do próprio reset (criadoEm); dataInicio é a data do reset
 * ANTERIOR do mesmo aluno (ou null, se for o primeiro reset dele — nesse caso
 * a janela cobre "desde o início da jornada").
 * Sem isso, um aluno com 2+ resets teria todo o histórico anterior ao último
 * reset agrupado num "Macrociclo 1" só, misturando períodos que deveriam
 * ficar congelados separadamente.
 */
export async function getResetPorHistoricoId(
  alunoId: number,
  historicoId: number
): Promise<{ dataInicio: Date | null; dataFim: Date; numeroCicloArquivado: number } | null> {
  const resets = await getAuditoriaResets({ alunoId, limit: 100 });
  const resetsAsc = [...resets].reverse(); // cronológico (mais antigo primeiro)
  const idx = resetsAsc.findIndex((r: any) => r.historicoId === historicoId);
  if (idx === -1) return null;
  const este = resetsAsc[idx];
  const anterior = idx > 0 ? resetsAsc[idx - 1] : null;
  return {
    dataInicio: anterior ? new Date(anterior.criadoEm) : null,
    dataFim: new Date(este.criadoEm),
    numeroCicloArquivado: este.numeroCicloArquivado,
  };
}

export async function getDataUltimoResetAluno(alunoId: number): Promise<Date | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const [rows] = await db.execute(sql.raw(
      `SELECT MAX(criadoEm) as ultimoReset FROM auditoria_resets_ciclo WHERE alunoId = ${alunoId} LIMIT 1`
    )) as any;
    const arr = Array.isArray(rows) ? rows : [];
    if (arr[0]?.ultimoReset) {
      return new Date(arr[0].ultimoReset);
    }
    return null;
  } catch (_) {
    return null;
  }
}

/**
 * Cria a tabela de auditoria de notas de mentoria (engagementScore e notaMentoraAplicabilidade).
 * Registra toda criação ou edição de nota, com valor anterior, valor novo, quem alterou e quando.
 */
export async function ensureAuditoriaNotesMentoriaTable(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS \`auditoria_notas_mentoria\` (
        \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`sessaoId\` int NOT NULL,
        \`alunoId\` int NOT NULL,
        \`alunoNome\` varchar(255) NULL,
        \`consultorId\` int NULL,
        \`consultorNome\` varchar(255) NULL,
        \`campo\` enum('engagementScore','notaMentoraAplicabilidade') NOT NULL,
        \`valorAnterior\` decimal(5,2) NULL,
        \`valorNovo\` decimal(5,2) NULL,
        \`alteradoPor\` varchar(255) NULL COMMENT 'email ou nome do usuário que fez a alteração',
        \`alteradoPorRole\` varchar(50) NULL,
        \`criadoEm\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_alunoId (\`alunoId\`),
        INDEX idx_sessaoId (\`sessaoId\`),
        INDEX idx_criadoEm (\`criadoEm\`)
      )
    `));
    console.log('[DB] Tabela auditoria_notas_mentoria verificada/criada com sucesso.');
  } catch (err: any) {
    console.error('[DB] Erro ao criar tabela auditoria_notas_mentoria:', err.message);
  }
}

/**
 * Registra uma entrada de auditoria para alteração de nota de mentoria.
 */
export async function logAuditoriaNota(params: {
  sessaoId: number;
  alunoId: number;
  alunoNome?: string | null;
  consultorId?: number | null;
  consultorNome?: string | null;
  campo: 'engagementScore' | 'notaMentoraAplicabilidade';
  valorAnterior: number | null;
  valorNovo: number | null;
  alteradoPor?: string | null;
  alteradoPorRole?: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const alunoNome = params.alunoNome ? `'${params.alunoNome.replace(/'/g, "''")}'` : 'NULL';
    const consultorNome = params.consultorNome ? `'${params.consultorNome.replace(/'/g, "''")}'` : 'NULL';
    const alteradoPor = params.alteradoPor ? `'${params.alteradoPor.replace(/'/g, "''")}'` : 'NULL';
    const alteradoPorRole = params.alteradoPorRole ? `'${params.alteradoPorRole.replace(/'/g, "''")}'` : 'NULL';
    const valorAnterior = params.valorAnterior != null ? String(params.valorAnterior) : 'NULL';
    const valorNovo = params.valorNovo != null ? String(params.valorNovo) : 'NULL';
    const consultorId = params.consultorId != null ? String(params.consultorId) : 'NULL';
    await db.execute(sql.raw(`
      INSERT INTO auditoria_notas_mentoria
        (sessaoId, alunoId, alunoNome, consultorId, consultorNome, campo, valorAnterior, valorNovo, alteradoPor, alteradoPorRole, criadoEm)
      VALUES
        (${params.sessaoId}, ${params.alunoId}, ${alunoNome}, ${consultorId}, ${consultorNome},
         '${params.campo}', ${valorAnterior}, ${valorNovo}, ${alteradoPor}, ${alteradoPorRole}, NOW())
    `));
  } catch (err: any) {
    // Não bloquear a operação principal por falha de auditoria
    console.error('[DB] Erro ao registrar auditoria de nota:', err.message);
  }
}

/**
 * Busca o histórico de auditoria de notas de mentoria de um aluno.
 */
export async function getAuditoriaNotesMentoria(alunoId: number): Promise<Array<{
  id: number;
  sessaoId: number;
  alunoId: number;
  alunoNome: string | null;
  consultorId: number | null;
  consultorNome: string | null;
  campo: string;
  valorAnterior: number | null;
  valorNovo: number | null;
  alteradoPor: string | null;
  alteradoPorRole: string | null;
  criadoEm: Date;
}>> {
  const db = await getDb();
  if (!db) return [];
  try {
    const [rows] = await db.execute(sql.raw(`
      SELECT id, sessaoId, alunoId, alunoNome, consultorId, consultorNome,
             campo, valorAnterior, valorNovo, alteradoPor, alteradoPorRole, criadoEm
      FROM auditoria_notas_mentoria
      WHERE alunoId = ${alunoId}
      ORDER BY criadoEm DESC
      LIMIT 200
    `)) as any;
    return Array.isArray(rows) ? rows.map((r: any) => ({
      id: Number(r.id),
      sessaoId: Number(r.sessaoId),
      alunoId: Number(r.alunoId),
      alunoNome: r.alunoNome ?? null,
      consultorId: r.consultorId != null ? Number(r.consultorId) : null,
      consultorNome: r.consultorNome ?? null,
      campo: r.campo,
      valorAnterior: r.valorAnterior != null ? parseFloat(r.valorAnterior) : null,
      valorNovo: r.valorNovo != null ? parseFloat(r.valorNovo) : null,
      alteradoPor: r.alteradoPor ?? null,
      alteradoPorRole: r.alteradoPorRole ?? null,
      criadoEm: new Date(r.criadoEm),
    })) : [];
  } catch (_) {
    return [];
  }
}

// ============ ADMINISTRADORES ============

export async function listAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    openId: users.openId,
    role: users.role,
    isActive: users.isActive,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
    cpf: users.cpf,
  })
    .from(users)
    .where(inArray(users.role, ['admin', 'admin2']))
    .orderBy(users.name);
  return result;
}

export async function createAdminUser(input: {
  name: string;
  email: string;
  username: string;
  passwordHash: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Banco de dados não disponível');

  // Verificar se username (openId) já existe
  const [existing] = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.openId, input.username))
    .limit(1);
  if (existing) throw new Error('Username já está em uso. Escolha outro.');

  // Verificar se e-mail já existe como admin
  const [existingEmail] = await db.select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, input.email), inArray(users.role, ['admin', 'admin2'])))
    .limit(1);
  if (existingEmail) throw new Error('Já existe um administrador com este e-mail.');

  const openId = `admin-${input.username}-${Date.now()}`;
  await db.insert(users).values({
    openId,
    name: input.name,
    email: input.email,
    loginMethod: 'admin',
    role: 'admin',
    passwordHash: input.passwordHash,
    isActive: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  } as any);

  return { success: true, message: 'Administrador criado com sucesso.' };
}

export async function toggleAdminUserStatus(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Banco de dados não disponível');

  const [user] = await db.select({ id: users.id, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) throw new Error('Administrador não encontrado.');

  const newStatus = user.isActive ? 0 : 1;
  await db.update(users).set({ isActive: newStatus, updatedAt: new Date() }).where(eq(users.id, userId));
  return { success: true, isActive: newStatus };
}

// ============ PERMISSÕES DE PÁGINAS DO ADMIN ============

export async function getAdminPermissions(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(sql.raw(
    `SELECT permissions FROM admin_page_permissions WHERE userId = ${userId}`
  )) as any;
  if (!rows || rows.length === 0) return [];
  try {
    const perms = typeof rows[0].permissions === 'string'
      ? JSON.parse(rows[0].permissions)
      : rows[0].permissions;
    return Array.isArray(perms) ? perms : [];
  } catch {
    return [];
  }
}

export async function setAdminPermissions(userId: number, permissions: string[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const permsJson = JSON.stringify(permissions).replace(/'/g, "''");
  await db.execute(sql.raw(
    `INSERT INTO admin_page_permissions (userId, permissions)
     VALUES (${userId}, '${permsJson}')
     ON DUPLICATE KEY UPDATE permissions = '${permsJson}', updatedAt = CURRENT_TIMESTAMP`
  ));
}

// ============ MIGRATION: GOOGLE CALENDAR INTEGRATION ============
export async function ensureGoogleCalendarColumns(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const columns = [
    "ALTER TABLE `mentor_appointments` ADD COLUMN IF NOT EXISTS `googleEventId` varchar(255)",
  ];
  for (const col of columns) {
    try {
      await db.execute(sql.raw(col));
    } catch (e: any) {
      if (!e?.message?.includes("Duplicate column")) {
        console.warn("[DB] ensureGoogleCalendarColumns:", e?.message);
      }
    }
  }
  console.log("[DB] Colunas do Google Calendar verificadas/criadas com sucesso.");
}

// ============ GOOGLE CALENDAR: SALVAR EVENT ID ============
export async function updateAppointmentGoogleEventId(
  appointmentId: number,
  googleEventId: string,
  googleMeetLink?: string | null
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updateData: any = { googleEventId };
  if (googleMeetLink !== undefined) {
    updateData.googleMeetLink = googleMeetLink;
  }
  await db.update(mentorAppointments)
    .set(updateData)
    .where(eq(mentorAppointments.id, appointmentId));
}

export async function markAppointmentRealized(appointmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(mentorAppointments)
    .set({ status: 'realizado' })
    .where(eq(mentorAppointments.id, appointmentId));
}

// ============ METAS: GARANTIR COLUNAS DE EVIDÊNCIA E VALIDAÇÃO (Jornada de Superação) ============
export async function ensureMetaEvidenciaColumns(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const columns = [
    "ALTER TABLE `metas` ADD COLUMN IF NOT EXISTS `status` enum('pendente','entregue','validada') NOT NULL DEFAULT 'pendente'",
    "ALTER TABLE `metas` ADD COLUMN IF NOT EXISTS `relatoAluno` text NULL",
    "ALTER TABLE `metas` ADD COLUMN IF NOT EXISTS `evidenceLink` varchar(1000) NULL",
    "ALTER TABLE `metas` ADD COLUMN IF NOT EXISTS `evidenceImageUrl` text NULL",
    "ALTER TABLE `metas` ADD COLUMN IF NOT EXISTS `evidenceImageKey` varchar(512) NULL",
    "ALTER TABLE `metas` ADD COLUMN IF NOT EXISTS `submittedAt` timestamp NULL",
    "ALTER TABLE `metas` ADD COLUMN IF NOT EXISTS `validatedBy` int NULL",
    "ALTER TABLE `metas` ADD COLUMN IF NOT EXISTS `validatedAt` timestamp NULL",
    "ALTER TABLE `metas` ADD COLUMN IF NOT EXISTS `motivoRejeicao` text NULL",
  ];
  for (const col of columns) {
    try {
      await db.execute(sql.raw(col));
    } catch (e: any) {
      if (!e?.message?.includes("Duplicate column")) {
        console.warn("[DB] ensureMetaEvidenciaColumns:", e?.message);
      }
    }
  }
  console.log("[DB] Colunas de evidência/validação de Metas (Jornada de Superação) verificadas/criadas com sucesso.");

  // Backfill: preservar metas que já haviam sido marcadas como "cumprida" no controle
  // mensal antigo (meta_acompanhamento), para que o novo cálculo (metas.status) não
  // regrida o indicador de alunos com progresso já registrado antes desta mudança.
  // Só toca metas ainda no estado padrão 'pendente' — não sobrescreve nada já processado
  // pelo novo fluxo (entregue/validada), então é seguro rodar a cada startup.
  try {
    await db.execute(sql.raw(`
      UPDATE metas m
      INNER JOIN (
        SELECT ma.metaId, ma.status, ma.registradoPor, ma.updatedAt
        FROM meta_acompanhamento ma
        INNER JOIN (
          SELECT metaId, MAX(ano * 100 + mes) as maxPeriodo
          FROM meta_acompanhamento GROUP BY metaId
        ) ult ON ult.metaId = ma.metaId AND (ma.ano * 100 + ma.mes) = ult.maxPeriodo
      ) ultimo ON ultimo.metaId = m.id
      SET m.status = 'validada',
          m.validatedBy = ultimo.registradoPor,
          m.validatedAt = ultimo.updatedAt,
          m.submittedAt = COALESCE(m.submittedAt, ultimo.updatedAt)
      WHERE m.status = 'pendente' AND ultimo.status = 'cumprida'
    `));
  } catch (e: any) {
    console.warn("[DB] Backfill de metas cumpridas (meta_acompanhamento → metas.status):", e?.message);
  }
}

// ============ PROCESSO SELETIVO: GARANTIR COLUNAS ============
export async function ensureProcessoSeletivoColumns(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const columns = [
    "ALTER TABLE `processos_seletivos` ADD COLUMN IF NOT EXISTS `dataFim` date NULL COMMENT 'Data de encerramento do processo'",
    "ALTER TABLE `processos_seletivos` ADD COLUMN IF NOT EXISTS `emailsRelatorio` text NULL COMMENT 'E-mails separados por vírgula para receber relatório do processo'",
    "ALTER TABLE `processos_seletivos` ADD COLUMN IF NOT EXISTS `mentorId` int NULL COMMENT 'ID do mentor/selecionadora responsável'",
    "ALTER TABLE `processos_seletivos` ADD COLUMN IF NOT EXISTS `comunicado` longtext NULL COMMENT 'Comunicado do processo em HTML (editor rico)'",
  ];
  for (const col of columns) {
    try {
      await db.execute(sql.raw(col));
    } catch (e: any) {
      if (!e?.message?.includes("Duplicate column")) {
        console.warn("[DB] ensureProcessoSeletivoColumns:", e?.message);
      }
    }
  }
  console.log("[DB] Colunas do Processo Seletivo verificadas/criadas com sucesso.");
}

export async function ensureRelatorioEntrevistaColumns(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const columns = [
    "ALTER TABLE `processo_entrevistas` ADD COLUMN IF NOT EXISTS `transcricaoUrl` varchar(1000) NULL COMMENT 'URL S3 do arquivo de transcri\u00e7\u00e3o da entrevista'",
    "ALTER TABLE `processo_entrevistas` ADD COLUMN IF NOT EXISTS `transcricaoNomeArquivo` varchar(255) NULL COMMENT 'Nome original do arquivo de transcri\u00e7\u00e3o'",
    "ALTER TABLE `processo_entrevistas` ADD COLUMN IF NOT EXISTS `participantesBanca` text NULL COMMENT 'Nomes dos participantes da banca'",
    "ALTER TABLE `processo_entrevistas` ADD COLUMN IF NOT EXISTS `dadosPrincipaisEntrevista` longtext NULL COMMENT 'Dados principais gerados pela IA'",
    "ALTER TABLE `processo_entrevistas` ADD COLUMN IF NOT EXISTS `analisePerfilComportamental` longtext NULL COMMENT 'An\u00e1lise do perfil comportamental gerada pela IA'",
    "ALTER TABLE `processo_entrevistas` ADD COLUMN IF NOT EXISTS `relatorioGeradoEm` datetime NULL COMMENT 'Quando o relat\u00f3rio foi gerado pela \u00faltima vez'",
    "ALTER TABLE `processo_entrevistas` ADD COLUMN IF NOT EXISTS `observacaoRevisao` text NULL COMMENT 'Observa\u00e7\u00e3o da mentora para refazer o relat\u00f3rio'",
    "ALTER TABLE `processo_resultados` ADD COLUMN IF NOT EXISTS `participantesBanca` text NULL COMMENT 'Nomes dos participantes da banca'",
  ];
  for (const col of columns) {
    try {
      await db.execute(sql.raw(col));
    } catch (e: any) {
      if (!e?.message?.includes("Duplicate column")) {
        console.warn("[DB] ensureRelatorioEntrevistaColumns:", e?.message);
      }
    }
  }
  console.log("[DB] Colunas do Relat\u00f3rio de Entrevista verificadas/criadas com sucesso.");
}


// ==================== WEBINAR CHECKLIST INTERNO ====================

export type WebinarTaskStatus =
  | 'pending'
  | 'in_progress'
  | 'waiting_delivery'
  | 'waiting_approval'
  | 'adjustment_requested'
  | 'approved'
  | 'completed'
  | 'cancelled';

export type WebinarResponsibleRole =
  | 'organizacao'
  | 'marketing'
  | 'administrativo'
  | 'coordenacao'
  | 'palestrante'
  | 'solicitante';

export interface WebinarTask {
  id: number;
  webinarId: number;
  templateId: number | null;
  title: string;
  description: string | null;
  deliveryUrl: string | null;
  accessToken: string | null;
  dueDate: string; // ISO date string
  responsibleRole: WebinarResponsibleRole;
  responsibleUserId: number | null;
  responsibleName: string | null;
  responsibleEmail: string | null;
  status: WebinarTaskStatus;
  priority: 'low' | 'normal' | 'high' | 'critical';
  isCritical: boolean;
  completedAt: string | null;
  completedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebinarResponsible {
  id: number;
  webinarId: number;
  role: WebinarResponsibleRole;
  userId: number | null;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface WebinarTaskSummary {
  total: number;
  completed: number;
  overdue: number;
  atRisk: number; // vencendo em ≤5 dias e não concluídas
  riskLevel: 'Baixo' | 'Médio' | 'Alto';
}

/** Busca todas as tarefas de um webinar */
export async function getWebinarTasksByWebinar(webinarId: number): Promise<WebinarTask[]> {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(sql.raw(`
    SELECT
      id, webinarId, templateId, title, description, deliveryUrl, accessToken,
      DATE_FORMAT(dueDate, '%Y-%m-%d') AS dueDate,
      responsibleRole, responsibleUserId, responsibleName, responsibleEmail,
      status, priority, isCritical,
      completedAt, completedBy, createdAt, updatedAt
    FROM webinar_tasks
    WHERE webinarId = ${webinarId}
    ORDER BY dueDate ASC, id ASC
  `));
  return (rows as any[]).map(r => ({ ...r, isCritical: !!r.isCritical }));
}

/** Atualiza o status de uma tarefa */
export async function updateWebinarTaskStatus(
  taskId: number,
  status: WebinarTaskStatus,
  completedBy?: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const isCompleted = status === 'completed';
  const completedAtSql = isCompleted
    ? `completedAt = NOW(), completedBy = ${completedBy ?? 'NULL'},`
    : `completedAt = NULL, completedBy = NULL,`;
  await db.execute(sql.raw(`
    UPDATE webinar_tasks
    SET ${completedAtSql} status = '${status}', updatedAt = NOW()
    WHERE id = ${taskId}
  `));
}

/** Atualiza responsável (nome + email) de uma tarefa */
export async function updateWebinarTaskResponsible(
  taskId: number,
  name: string,
  email: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const safeName = name.replace(/'/g, "''");
  const safeEmail = email.replace(/'/g, "''");
  await db.execute(sql.raw(`
    UPDATE webinar_tasks
    SET responsibleName = '${safeName}', responsibleEmail = '${safeEmail}', updatedAt = NOW()
    WHERE id = ${taskId}
  `));
}

/** Retorna resumo (contagens + nível de risco) para o card do webinar */
export async function getWebinarTasksSummary(webinarId: number): Promise<WebinarTaskSummary> {
  const db = await getDb();
  if (!db) return { total: 0, completed: 0, overdue: 0, atRisk: 0, riskLevel: 'Baixo' };

  const [rows] = await db.execute(sql.raw(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'completed' OR status = 'cancelled') AS completed,
      SUM(
        status NOT IN ('completed','cancelled')
        AND dueDate < CURDATE()
      ) AS overdue,
      SUM(
        status NOT IN ('completed','cancelled')
        AND dueDate >= CURDATE()
        AND DATEDIFF(dueDate, CURDATE()) <= 5
      ) AS atRisk,
      SUM(
        isCritical = 1
        AND status NOT IN ('completed','cancelled')
        AND dueDate < CURDATE()
      ) AS criticalOverdue,
      SUM(
        isCritical = 1
        AND status NOT IN ('completed','cancelled')
        AND dueDate >= CURDATE()
        AND DATEDIFF(dueDate, CURDATE()) <= 5
      ) AS criticalAtRisk
    FROM webinar_tasks
    WHERE webinarId = ${webinarId}
  `));

  const r = (rows as any[])[0] || {};
  const total = Number(r.total) || 0;
  const completed = Number(r.completed) || 0;
  const overdue = Number(r.overdue) || 0;
  const atRisk = Number(r.atRisk) || 0;
  const criticalOverdue = Number(r.criticalOverdue) || 0;
  const criticalAtRisk = Number(r.criticalAtRisk) || 0;

  // Regra de risco:
  // Alto: qualquer tarefa crítica atrasada
  // Médio: tarefa crítica vencendo em ≤5 dias OU tarefa não crítica atrasada
  // Baixo: nenhuma das condições acima
  let riskLevel: 'Baixo' | 'Médio' | 'Alto' = 'Baixo';
  if (criticalOverdue > 0) {
    riskLevel = 'Alto';
  } else if (criticalAtRisk > 0 || overdue > 0) {
    riskLevel = 'Médio';
  }

  return { total, completed, overdue, atRisk, riskLevel };
}

/** Busca responsáveis de um webinar */
export async function getWebinarResponsibles(webinarId: number): Promise<WebinarResponsible[]> {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(sql.raw(`
    SELECT id, webinarId, role, userId, name, email, phone
    FROM webinar_responsibles
    WHERE webinarId = ${webinarId}
    ORDER BY role ASC
  `));
  return rows as WebinarResponsible[];
}

/** Salva/atualiza responsáveis de um webinar (upsert por role) */
export async function upsertWebinarResponsibles(
  webinarId: number,
  responsibles: Array<{ role: WebinarResponsibleRole; name: string; email: string; phone?: string }>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  for (const r of responsibles) {
    const safeName = (r.name || '').replace(/'/g, "''");
    const safeEmail = (r.email || '').replace(/'/g, "''");
    const safePhone = (r.phone || '').replace(/'/g, "''");
    await db.execute(sql.raw(`
      INSERT INTO webinar_responsibles (webinarId, role, name, email, phone)
      VALUES (${webinarId}, '${r.role}', '${safeName}', '${safeEmail}', '${safePhone}')
      ON DUPLICATE KEY UPDATE
        name = '${safeName}',
        email = '${safeEmail}',
        phone = '${safePhone}',
        updatedAt = NOW()
    `));
  }
}

/** Gera as tarefas internas de produção a partir dos templates para um webinar */
export async function generateWebinarInternalTasks(
  webinarId: number,
  eventDate: Date,
  theme?: string | null
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Buscar templates ativos
  const [templates] = await db.execute(sql.raw(`
    SELECT id, title, description, daysOffset, defaultRole, isCritical, sortOrder
    FROM webinar_task_templates
    WHERE isActive = 1
    ORDER BY sortOrder ASC
  `));

  const tplList = templates as any[];
  if (!tplList.length) return;

  // Verificar se o tema já está definido (para marcar "Definir tema" como concluída)
  const themeIsDefined = theme && theme.trim() !== '' && theme.trim().toLowerCase() !== 'a definir';

  for (const tpl of tplList) {
    const dueDate = new Date(eventDate);
    dueDate.setDate(dueDate.getDate() + Number(tpl.daysOffset));
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    // Buscar responsável já cadastrado para este role neste webinar
    const [respRows] = await db.execute(sql.raw(`
      SELECT name, email FROM webinar_responsibles
      WHERE webinarId = ${webinarId} AND role = '${tpl.defaultRole}'
      LIMIT 1
    `));
    const resp = (respRows as any[])[0];
    const respName = resp ? `'${(resp.name || '').replace(/'/g, "''")}'` : 'NULL';
    const respEmail = resp ? `'${(resp.email || '').replace(/'/g, "''")}'` : 'NULL';

    // Verificar se é a tarefa "Definir tema" para marcar como concluída se tema já está definido
    const isDefineThemeTask = tpl.title.toLowerCase().includes('definir tema');
    const initialStatus = (isDefineThemeTask && themeIsDefined) ? 'completed' : 'pending';
    const completedAtSql = (isDefineThemeTask && themeIsDefined) ? 'NOW()' : 'NULL';

    const safeTitle = tpl.title.replace(/'/g, "''");
    const safeDesc = (tpl.description || '').replace(/'/g, "''");

    await db.execute(sql.raw(`
      INSERT INTO webinar_tasks
        (webinarId, templateId, title, description, dueDate,
         responsibleRole, responsibleName, responsibleEmail,
         status, priority, isCritical, completedAt, accessToken)
      VALUES
        (${webinarId}, ${tpl.id}, '${safeTitle}', '${safeDesc}', '${dueDateStr}',
         '${tpl.defaultRole}', ${respName}, ${respEmail},
         '${initialStatus}', 'normal', ${tpl.isCritical ? 1 : 0}, ${completedAtSql},
         LOWER(CONCAT(
           SUBSTRING(MD5(CONCAT(${webinarId}, ${tpl.id}, RAND())), 1, 8), '-',
           SUBSTRING(MD5(CONCAT(${webinarId}, ${tpl.id}, RAND())), 9, 4), '-',
           SUBSTRING(MD5(CONCAT(${webinarId}, ${tpl.id}, RAND())), 13, 4), '-',
           SUBSTRING(MD5(CONCAT(${webinarId}, ${tpl.id}, RAND())), 17, 4), '-',
           SUBSTRING(MD5(CONCAT(${webinarId}, ${tpl.id}, RAND())), 21, 12)
         )))
    `));
  }
}

// ============ WEBINAR TASK TEMPLATES CRUD ============

export interface WebinarTaskTemplate {
  id: number;
  title: string;
  description: string | null;
  daysOffset: number;
  defaultRole: 'organizacao' | 'marketing' | 'administrativo' | 'coordenacao' | 'palestrante' | 'solicitante';
  requiresUpload: number;
  requiresApproval: number;
  isCritical: number;
  sortOrder: number;
  isActive: number;
}

export async function listWebinarTaskTemplates(): Promise<WebinarTaskTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(sql.raw(`
    SELECT id, title, description, daysOffset, defaultRole,
           requiresUpload, requiresApproval, isCritical, sortOrder, isActive
    FROM webinar_task_templates
    ORDER BY sortOrder ASC
  `));
  return rows as WebinarTaskTemplate[];
}

export async function createWebinarTaskTemplate(data: {
  title: string;
  description?: string;
  daysOffset: number;
  defaultRole: string;
  isCritical?: number;
  sortOrder?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const safeTitle = data.title.replace(/'/g, "''");
  const safeDesc = (data.description || '').replace(/'/g, "''");
  const [result] = await db.execute(sql.raw(`
    INSERT INTO webinar_task_templates (title, description, daysOffset, defaultRole, isCritical, sortOrder, isActive)
    VALUES ('${safeTitle}', '${safeDesc}', ${data.daysOffset}, '${data.defaultRole}',
            ${data.isCritical ?? 1}, ${data.sortOrder ?? 99}, 1)
  `));
  return (result as any).insertId;
}

export async function updateWebinarTaskTemplate(id: number, data: {
  title?: string;
  description?: string;
  daysOffset?: number;
  defaultRole?: string;
  isCritical?: number;
  sortOrder?: number;
  isActive?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const sets: string[] = [];
  if (data.title !== undefined) sets.push(`title = '${data.title.replace(/'/g, "''")}'`);
  if (data.description !== undefined) sets.push(`description = '${data.description.replace(/'/g, "''")}'`);
  if (data.daysOffset !== undefined) sets.push(`daysOffset = ${data.daysOffset}`);
  if (data.defaultRole !== undefined) sets.push(`defaultRole = '${data.defaultRole}'`);
  if (data.isCritical !== undefined) sets.push(`isCritical = ${data.isCritical}`);
  if (data.sortOrder !== undefined) sets.push(`sortOrder = ${data.sortOrder}`);
  if (data.isActive !== undefined) sets.push(`isActive = ${data.isActive}`);
  if (!sets.length) return;
  await db.execute(sql.raw(`UPDATE webinar_task_templates SET ${sets.join(', ')} WHERE id = ${id}`));
}

export async function deleteWebinarTaskTemplate(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  // Soft delete: marcar como inativo
  await db.execute(sql.raw(`UPDATE webinar_task_templates SET isActive = 0 WHERE id = ${id}`));
}

export async function reorderWebinarTaskTemplates(orders: { id: number; sortOrder: number }[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  for (const o of orders) {
    await db.execute(sql.raw(`UPDATE webinar_task_templates SET sortOrder = ${o.sortOrder} WHERE id = ${o.id}`));
  }
}

// ==================== SUPORTE A PDF NAS ATIVIDADES DE CURSO ====================

/**
 * Garante que o enum tipoAtividade na tabela atividades_curso aceite o valor "pdf".
 * Também garante que a coluna urlMidia existe (usada para armazenar a URL do PDF).
 */
export async function ensurePdfAtividadeSupport(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(sql.raw(
      `ALTER TABLE \`atividades_curso\`
       MODIFY COLUMN \`tipoAtividade\`
         enum('genially','video','podcast','tedtalk','livro','intro','pdf')
         NOT NULL`
    ));
    console.log("[DB] Enum tipoAtividade atualizado para incluir 'pdf'.");
  } catch (e: any) {
    console.warn("[DB] ensurePdfAtividadeSupport (enum):", e?.message);
  }
  try {
    await db.execute(sql.raw(
      `ALTER TABLE \`atividades_curso\` ADD COLUMN IF NOT EXISTS \`urlMidia\` text NULL`
    ));
    console.log("[DB] Coluna urlMidia verificada/criada em atividades_curso.");
  } catch (e: any) {
    if (!e?.message?.includes("Duplicate column")) {
      console.warn("[DB] ensurePdfAtividadeSupport (urlMidia):", e?.message);
    }
  }
}

export async function ensureDevolutivasTables(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Criar tabela devolutiva_slots
  try {
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS \`devolutiva_slots\` (
        \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`processoId\` int NOT NULL,
        \`consultorId\` int NOT NULL,
        \`elegiveisResultado\` enum('habilitados','inabilitados','ambos') NOT NULL DEFAULT 'ambos',
        \`specificDate\` varchar(10) NOT NULL,
        \`startTime\` varchar(5) NOT NULL,
        \`endTime\` varchar(5) NOT NULL,
        \`googleMeetLink\` varchar(500) NULL,
        \`candidatoId\` int NULL,
        \`reservadoEm\` timestamp NULL,
        \`emailConfirmacaoEnviado\` int NOT NULL DEFAULT 0,
        \`emailLembreteEnviado\` int NOT NULL DEFAULT 0,
        \`status\` enum('disponivel','reservado','cancelado') NOT NULL DEFAULT 'disponivel',
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `));
  } catch (e: any) {
    if (!e?.message?.includes('already exists')) console.warn('[DB] ensureDevolutivasTables (tabela):', e?.message);
  }
  // Adicionar colunas de controle no processo seletivo
  const columns = [
    "ALTER TABLE `processos_seletivos` ADD COLUMN IF NOT EXISTS `devolutivaIniciada` int NOT NULL DEFAULT 0",
    "ALTER TABLE `processos_seletivos` ADD COLUMN IF NOT EXISTS `devolutivaIniciadaEm` timestamp NULL",
    "ALTER TABLE `processos_seletivos` ADD COLUMN IF NOT EXISTS `devolutivaPrazoInicio` datetime NULL",
    "ALTER TABLE `processos_seletivos` ADD COLUMN IF NOT EXISTS `devolutivaPrazoFim` datetime NULL",
  ];
  for (const col of columns) {
    try {
      await db.execute(sql.raw(col));
    } catch (e: any) {
      if (!e?.message?.includes('Duplicate column')) console.warn('[DB] ensureDevolutivasTables:', e?.message);
    }
  }
  console.log('[DB] Tabela e colunas de devolutiva verificadas/criadas com sucesso.');
}

/**
 * Migração: corrige tipoSessao de sessões existentes que foram gravadas
 * como individual mas pertencem a um agendamento do tipo grupo.
 * Executar uma única vez após o deploy.
 */
export async function migrarTipoSessaoGrupais(): Promise<{ corrigidas: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar todas as sessões com appointmentId onde tipoSessao ainda é individual
  const rows = await db.execute(sql`
    SELECT ms.id, ms.tipoSessao, ma.type as appointmentType
    FROM mentoring_sessions ms
    INNER JOIN mentor_appointments ma ON ma.id = ms.appointmentId
    WHERE ma.type = 'grupo'
      AND ms.tipoSessao IN ('individual_normal', 'individual_assessment')
      AND COALESCE(ms.cancelada, 0) = 0
  `);

  const sessions = Array.isArray(rows) ? (rows[0] as any[]) : [];
  let corrigidas = 0;

  for (const s of sessions) {
    const novoTipo = s.tipoSessao === 'individual_assessment' ? 'grupo_assessment' : 'grupo_normal';
    await db.execute(sql.raw(
      `UPDATE mentoring_sessions SET tipoSessao = '${novoTipo}' WHERE id = ${s.id}`
    ));
    corrigidas++;
  }

  return { corrigidas };
}
