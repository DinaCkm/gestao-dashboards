import { eq, and, or, desc, asc, sql, not, gte, lt, lte, ne, inArray, isNotNull, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  departments, InsertDepartment, Department,
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
  historicoNivelCompetencia, InsertHistoricoNivelCompetencia, HistoricoNivelCompetencia,
  casesSucesso, InsertCaseSucesso, CaseSucesso,
  practicalActivityComments, InsertPracticalActivityComment, PracticalActivityComment,
  mentorAvailability, InsertMentorAvailability, MentorAvailability,
  mentorAppointments, InsertMentorAppointment, MentorAppointment,
  appointmentParticipants, InsertAppointmentParticipant, AppointmentParticipant
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "manager") {
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
  const [mentorCount] = await db.select({ count: sql<number>`count(*)` }).from(consultors);
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
    })
    .from(turmas)
    .leftJoin(programs, eq(turmas.programId, programs.id))
    .where(eq(turmas.isActive, 1))
    .orderBy(programs.name, turmas.name);
  
  // Buscar contagem de alunos para cada turma
  const turmasWithCount = await Promise.all(
    result.map(async (turma) => {
      const alunosCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(alunos)
        .where(eq(alunos.turmaId, turma.id));
      
      return {
        ...turma,
        programName: turma.programName || 'Sem Empresa',
        programCode: turma.programCode || 'N/A',
        totalAlunos: alunosCount[0]?.count || 0,
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
    return await db.select().from(alunos).where(and(eq(alunos.programId, programId), eq(alunos.isActive, 1)));
  }
  return await db.select().from(alunos).where(eq(alunos.isActive, 1));
}

export async function getAlunosByConsultor(consultorId: number, programId?: number): Promise<Aluno[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get distinct alunoIds from mentoring sessions for this consultor
  const sessions = await db.select({ alunoId: mentoringSessions.alunoId })
    .from(mentoringSessions)
    .where(eq(mentoringSessions.consultorId, consultorId));
  
  const uniqueAlunoIds = Array.from(new Set(sessions.map(s => s.alunoId)));
  if (uniqueAlunoIds.length === 0) return [];
  
  // Get alunos that match these IDs
  const allAlunos = await db.select().from(alunos).where(eq(alunos.isActive, 1));
  let result = allAlunos.filter(a => uniqueAlunoIds.includes(a.id));
  
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
  
  const uniqueAlunoIds = Array.from(new Set(sessions.map(s => s.alunoId)));
  if (uniqueAlunoIds.length === 0) return [];
  
  const allAlunos = await db.select().from(alunos).where(eq(alunos.isActive, 1));
  const mentorAlunos = allAlunos.filter(a => uniqueAlunoIds.includes(a.id));
  const programIds = Array.from(new Set(mentorAlunos.map(a => a.programId).filter(Boolean))) as number[];
  
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

export async function getAlunoById(alunoId: number): Promise<Aluno | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(alunos).where(eq(alunos.id, alunoId)).limit(1);
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

export async function updateMentoringSession(sessionId: number, data: {
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
  validatedAt?: Date | null;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const updateData: Record<string, unknown> = {};
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
  
  if (Object.keys(updateData).length === 0) return true;
  
  await db.update(mentoringSessions)
    .set(updateData)
    .where(eq(mentoringSessions.id, sessionId));
  return true;
}

export async function createMentoringSession(data: {
  alunoId: number;
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
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(mentoringSessions).values({
    alunoId: data.alunoId,
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
  });
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

export async function getEventsByProgram(programId: number): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(events).where(eq(events.programId, programId));
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
  
  // Get unique alunos
  const alunoIds = Array.from(new Set(sessions.map(s => s.alunoId)));
  const alunosList = await getAlunos();
  const alunoMap = new Map(alunosList.map(a => [a.id, a]));
  
  // Filter only valid sessions (aluno exists in alunos table)
  const validSessions = sessions.filter(s => alunoMap.has(s.alunoId));
  const validAlunoIds = Array.from(new Set(validSessions.map(s => s.alunoId)));
  
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
  
  // Get aluno details (only valid alunos)
  const alunosAtendidos = validAlunoIds.map(id => {
    const aluno = alunoMap.get(id);
    if (!aluno) return null;
    const program = aluno.programId ? programMap.get(aluno.programId) : null;
    const alunoSessions = validSessions.filter(s => s.alunoId === id);
    return {
      id: aluno.id,
      nome: aluno.name,
      empresa: program?.name || 'Sem Programa',
      totalMentorias: alunoSessions.length,
      ultimaMentoria: alunoSessions.length > 0 ? alunoSessions[alunoSessions.length - 1].sessionDate : null
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
  
  return { success: true, isActive: newStatus };
}

// Mentores
export async function getAllMentores() {
  const db = await getDb();
  if (!db) return [];
  return await db.select()
    .from(consultors)
    .where(eq(consultors.role, 'mentor'))
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
export async function updateConsultor(consultorId: number, data: { name?: string; email?: string; especialidade?: string; cpf?: string; managedProgramId?: number; programId?: number; photoUrl?: string; miniCurriculo?: string }) {
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
  return await db.select()
    .from(alunos)
    .orderBy(alunos.name)
    .limit(500);
}

export async function createAluno(data: { name: string; email: string; externalId: string; programId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");
  
  // Verificar se já existe aluno com este externalId
  const [existing] = await db.select()
    .from(alunos)
    .where(eq(alunos.externalId, data.externalId))
    .limit(1);
  
  if (existing) {
    throw new Error(`Já existe um aluno com o ID ${data.externalId}`);
  }
  
  const [result] = await db.insert(alunos).values({
    name: data.name,
    email: data.email.toLowerCase(),
    externalId: data.externalId,
    programId: data.programId || null,
    canLogin: 1,
    isActive: 1,
  });
  
  return { id: result.insertId, ...data };
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
  const openId = `aluno_${aluno.id}`;
  
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
      eq(users.role, 'admin')
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

// Adicionar competência ao plano individual
export async function addCompetenciaToPlano(data: {
  alunoId: number;
  competenciaId: number;
  isObrigatoria?: number;
  metaNota?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const [result] = await db.insert(planoIndividual).values({
    alunoId: data.alunoId,
    competenciaId: data.competenciaId,
    isObrigatoria: data.isObrigatoria ?? 1,
    metaNota: data.metaNota ?? "7.00",
    status: "pendente"
  });
  
  return result.insertId;
}

// Adicionar múltiplas competências ao plano individual
export async function addCompetenciasToPlano(alunoId: number, competenciaIds: number[]) {
  const db = await getDb();
  if (!db) return false;
  
  const values = competenciaIds.map(competenciaId => ({
    alunoId,
    competenciaId,
    isObrigatoria: 1,
    metaNota: "7.00",
    status: "pendente" as const
  }));
  
  await db.insert(planoIndividual).values(values);
  return true;
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

// Buscar competências obrigatórias de um aluno (para cálculo de performance)
export async function getCompetenciasObrigatoriasAluno(alunoId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    competenciaId: planoIndividual.competenciaId,
    codigoIntegracao: competencias.codigoIntegracao,
    notaAtual: planoIndividual.notaAtual,
    metaNota: planoIndividual.metaNota,
    status: planoIndividual.status
  })
  .from(planoIndividual)
  .leftJoin(competencias, eq(planoIndividual.competenciaId, competencias.id))
  .where(and(
    eq(planoIndividual.alunoId, alunoId),
    eq(planoIndividual.isObrigatoria, 1)
  ));
  
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
    dataInicio: new Date(data.dataInicio + 'T00:00:00'),
    dataFim: new Date(data.dataFim + 'T00:00:00'),
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

  // 7. Eventos/Webinários com datas
  const participacoes = await getEventParticipationByAluno(alunoId);
  // Buscar detalhes dos eventos diretamente pelos IDs das participações
  const eventIds = Array.from(new Set(participacoes.map(ep => ep.eventId)));
  let allRelevantEvents: Event[] = [];
  if (eventIds.length > 0) {
    const db2 = await getDb();
    if (db2) {
      allRelevantEvents = await db2.select().from(events).where(inArray(events.id, eventIds));
    }
  }
  const eventMap = new Map(allRelevantEvents.map(e => [e.id, e]));

  const eventosDetalhados = participacoes.map(ep => {
    const evento = eventMap.get(ep.eventId);
    return {
      id: ep.id,
      eventId: ep.eventId,
      titulo: evento?.title || `Evento #${ep.eventId}`,
      tipo: evento?.eventType || 'webinar',
      data: evento?.eventDate || null,
      status: ep.status,
    };
  });

  // 8. Ciclos de execução
  const ciclos = await getCiclosByAluno(alunoId);

  // 9. Sessões de mentoria
  const sessoes = await getMentoringSessionsByAluno(alunoId);

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
    totalEventos: eventosDetalhados.length,
    eventosPresente: eventosDetalhados.filter(e => e.status === 'presente').length,
    ciclos: ciclos.map(c => ({
      id: c.id,
      nomeCiclo: c.nomeCiclo,
      dataInicio: c.dataInicio,
      dataFim: c.dataFim,
      observacoes: c.observacoes,
      competencias: c.competencias,
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
    .where(eq(assessmentPdi.alunoId, alunoId))
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
  
  return pdis.map(pdi => {
    const comps = allComps.filter(c => c.assessmentPdiId === pdi.id);
    const trilha = trilhaMap.get(pdi.trilhaId);
    const turma = pdi.turmaId ? turmaMap.get(pdi.turmaId) : null;
    const consultor = pdi.consultorId ? consultorMap.get(pdi.consultorId) : null;
    
    return {
      ...pdi,
      trilhaNome: trilha?.name || 'Não definida',
      turmaNome: turma?.name || null,
      consultorNome: consultor?.name || null,
      competencias: comps.map(c => {
        const comp = compMap.get(c.competenciaId);
        const notaAtual = notaByComp.get(c.competenciaId);
        const notaNum = notaAtual ? parseFloat(notaAtual) : null;
        const notaCorteNum = parseFloat(c.notaCorte);
        return {
          ...c,
          competenciaNome: comp?.nome || 'Desconhecida',
          notaAtual: notaNum,
          atingiuMeta: notaNum !== null && notaNum >= notaCorteNum,
        };
      }),
      totalCompetencias: comps.length,
      obrigatorias: comps.filter(c => c.peso === 'obrigatoria').length,
      opcionais: comps.filter(c => c.peso === 'opcional').length,
    };
  });
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
 * Create a new assessment PDI with competencias
 */
export async function createAssessmentPdi(
  pdiData: {
    alunoId: number;
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
    microInicio?: string | null;
    microTermino?: string | null;
  }>
) {
  const db = await getDb();
  if (!db) return null;
  
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
  
  // Insert PDI - convert string dates to Date objects
  const result = await db.insert(assessmentPdi).values({
    alunoId: pdiData.alunoId,
    trilhaId: pdiData.trilhaId,
    turmaId: pdiData.turmaId || null,
    consultorId: pdiData.consultorId || null,
    programId: pdiData.programId || null,
    macroInicio: new Date(pdiData.macroInicio + 'T00:00:00'),
    macroTermino: new Date(pdiData.macroTermino + 'T00:00:00'),
    observacoes: pdiData.observacoes || null,
  });
  const pdiId = result[0].insertId;
  
  // Insert competencias - convert string dates to Date objects
  if (competenciasData.length > 0) {
    await db.insert(assessmentCompetencias).values(
      competenciasData.map(c => ({
        assessmentPdiId: pdiId,
        competenciaId: c.competenciaId,
        peso: c.peso,
        notaCorte: c.notaCorte,
        microInicio: c.microInicio ? new Date(c.microInicio + 'T00:00:00') : null,
        microTermino: c.microTermino ? new Date(c.microTermino + 'T00:00:00') : null,
      }))
    );
  }
  
  return pdiId;
}

/**
 * Freeze (congelar) an assessment PDI
 */
export async function congelarAssessmentPdi(pdiId: number, consultorId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(assessmentPdi).set({
    status: 'congelado',
    congeladoEm: new Date(),
    congeladoPor: consultorId,
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
        const macroInicioStr = pdi.macroInicio instanceof Date ? pdi.macroInicio.toISOString().split('T')[0] : String(pdi.macroInicio);
        const macroTerminoStr = pdi.macroTermino instanceof Date ? pdi.macroTermino.toISOString().split('T')[0] : String(pdi.macroTermino);
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
  if (data.microInicio !== undefined) updateData.microInicio = data.microInicio ? new Date(data.microInicio + 'T00:00:00') : null;
  if (data.microTermino !== undefined) updateData.microTermino = data.microTermino ? new Date(data.microTermino + 'T00:00:00') : null;
  
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
    // No assessment PDI - return null (can't calculate progress)
    return null;
  }

  const pdi = pdis[0];
  
  // Calculate total expected sessions from macro cycle duration
  const macroInicio = new Date(pdi.macroInicio);
  const macroTermino = new Date(pdi.macroTermino);
  
  // Calculate months difference
  const totalMeses = (macroTermino.getFullYear() - macroInicio.getFullYear()) * 12 
    + (macroTermino.getMonth() - macroInicio.getMonth());
  const totalSessoesEsperadas = Math.max(1, totalMeses); // At least 1 session

  // Count sessions completed for this student
  const sessions = await db.select().from(mentoringSessions)
    .where(eq(mentoringSessions.alunoId, alunoId));
  
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
  
  // Group sessions by aluno
  const sessionsByAluno = new Map<number, number>();
  for (const s of allSessions) {
    sessionsByAluno.set(s.alunoId, (sessionsByAluno.get(s.alunoId) || 0) + 1);
  }

  // Get aluno names
  const allAlunos = await db.select().from(alunos);
  const alunoMap = new Map(allAlunos.map(a => [a.id, a]));

  // Get consultor names
  const allConsultors = await db.select().from(consultors);
  const consultorMap = new Map(allConsultors.map(c => [c.id, c]));

  // Get program names
  const allPrograms = await db.select().from(programs);
  const programMap = new Map(allPrograms.map(p => [p.id, p]));

  return pdis.map(pdi => {
    const macroInicio = new Date(pdi.macroInicio);
    const macroTermino = new Date(pdi.macroTermino);
    const totalMeses = (macroTermino.getFullYear() - macroInicio.getFullYear()) * 12 
      + (macroTermino.getMonth() - macroInicio.getMonth());
    const totalSessoesEsperadas = Math.max(1, totalMeses);
    const sessoesRealizadas = sessionsByAluno.get(pdi.alunoId) || 0;
    const sessoesFaltantes = Math.max(0, totalSessoesEsperadas - sessoesRealizadas);
    const faltaUmaSessao = sessoesFaltantes === 1;
    const cicloCompleto = sessoesRealizadas >= totalSessoesEsperadas;
    const percentualProgresso = Math.min(100, Math.round((sessoesRealizadas / totalSessoesEsperadas) * 100));
    
    const aluno = alunoMap.get(pdi.alunoId);
    const consultor = pdi.consultorId ? consultorMap.get(pdi.consultorId) : null;
    const program = pdi.programId ? programMap.get(pdi.programId) : null;

    return {
      alunoId: pdi.alunoId,
      alunoNome: aluno?.name || 'Desconhecido',
      consultorId: pdi.consultorId,
      consultorNome: consultor?.name || null,
      programId: pdi.programId,
      programaNome: program?.name || null,
      macroInicio: pdi.macroInicio,
      macroTermino: pdi.macroTermino,
      totalSessoesEsperadas,
      sessoesRealizadas,
      sessoesFaltantes,
      faltaUmaSessao,
      cicloCompleto,
      percentualProgresso,
      assessmentPdiId: pdi.id,
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
  await db.update(scheduledWebinars).set(data).where(eq(scheduledWebinars.id, id));
}

export async function deleteWebinar(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
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
  if (programId) {
    return await db.select({ email: users.email, name: users.name })
      .from(users)
      .where(and(
        eq(users.role, "user"),
        eq(users.isActive, 1),
        eq(users.programId, programId),
        isNotNull(users.email)
      ));
  }
  return await db.select({ email: users.email, name: users.name })
    .from(users)
    .where(and(
      eq(users.role, "user"),
      eq(users.isActive, 1),
      isNotNull(users.email)
    ));
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
  reflexao: string
): Promise<{ updated: boolean; created: boolean }> {
  const db = await getDb();
  if (!db) return { updated: false, created: false };

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
      })
      .where(eq(eventParticipation.id, existing[0].id));
    return { updated: true, created: false };
  } else {
    // Criar novo registro
    await db.insert(eventParticipation).values({
      alunoId,
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

  // Buscar todos os eventos do programa do aluno
  // Se o aluno tem programId, buscar eventos do programa OU eventos sem programa (programId NULL)
  // Se o aluno não tem programId, buscar todos os eventos
  const allEvents = aluno.programId
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
  const webinarByTitle = new Map(allScheduledWebinars.map(w => [w.title?.toLowerCase().trim(), w]));
  const now = new Date();

  // Retornar TODOS os eventos com status de presença
  return allEvents.map(evt => {
    const part = participationMap.get(evt.id);
    const matchedWebinar = webinarByTitle.get(evt.title?.toLowerCase().trim() || '');
    const endDate = matchedWebinar?.endDate || matchedWebinar?.eventDate || evt.eventDate;
    const hasEnded = endDate ? new Date(endDate) < now : true;
    // Link do vídeo: prioridade para videoLink do evento, depois youtubeLink do webinar agendado
    const videoLink = evt.videoLink || matchedWebinar?.youtubeLink || null;
    const isPresent = part?.status === 'presente';
    const selfReported = !!part?.selfReportedAt;

    return {
      eventId: evt.id,
      scheduledWebinarId: matchedWebinar?.id || null,
      title: evt.title,
      eventType: evt.eventType || 'webinar',
      eventDate: evt.eventDate,
      videoLink,
      status: isPresent ? 'presente' : 'ausente',
      selfReported,
      reflexao: part?.reflexao || null,
      selfReportedAt: part?.selfReportedAt || null,
      hasEnded,
    };
  }).sort((a, b) => {
    // Ordenar: ausentes primeiro, depois por data decrescente
    if (a.status !== b.status) return a.status === 'ausente' ? -1 : 1;
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

export async function deleteContrato(contratoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contratosAluno).set({ isActive: 0 }).where(eq(contratosAluno.id, contratoId));
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
  
  const contrato = contratos[0] || null;
  
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

/**
 * Create a new case de sucesso
 */
export async function createCaseSucesso(data: InsertCaseSucesso) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(casesSucesso).values(data);
  return result.insertId;
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
export async function getCasesForCalculator(): Promise<Map<number, { alunoId: number; trilhaId: number | null; trilhaNome: string | null; entregue: boolean }[]>> {
  const db = await getDb();
  const result = new Map<number, { alunoId: number; trilhaId: number | null; trilhaNome: string | null; entregue: boolean }[]>();
  if (!db) return result;
  
  const allCases = await db.select().from(casesSucesso);
  
  for (const c of allCases) {
    const existing = result.get(c.alunoId) || [];
    existing.push({
      alunoId: c.alunoId,
      trilhaId: c.trilhaId,
      trilhaNome: c.trilhaNome,
      entregue: c.entregue === 1,
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
  const allPdis = await db.select({
    id: assessmentPdi.id,
    alunoId: assessmentPdi.alunoId,
    trilhaId: assessmentPdi.trilhaId,
  }).from(assessmentPdi);
  
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
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<MentoringSession[]> {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    isNotNull(mentoringSessions.taskId), // Apenas sessões com tarefa atribuída
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
  consultorId: number;
  turmaId?: number | null;
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

  // 1. Criar registro na tabela alunos COM mentor e bypass
  const [alunoResult] = await db.insert(alunos).values({
    name: data.name,
    email: data.email.toLowerCase(),
    externalId: normalizedCpf,
    programId: data.programId,
    turmaId: data.turmaId ?? null,
    consultorId: data.consultorId,
    bypassOnboarding: 1,
    cadastradoPorAdmin: 1,
    canLogin: 1,
    isActive: 1,
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
  bypassOnboarding: boolean;
  alunoId: number | null;
}> {
  const db = await getDb();
  if (!db) return { needsOnboarding: false, hasMentor: false, bypassOnboarding: false, alunoId: null };

  // Só se aplica a alunos (role === 'user') ou managers com alunoId (visão dupla)
  if (user.role !== 'user' && !(user.role === 'manager' && user.alunoId)) {
    return { needsOnboarding: false, hasMentor: false, bypassOnboarding: false, alunoId: null };
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
    return { needsOnboarding: true, hasMentor: false, bypassOnboarding: false, alunoId: null };
  }

  const hasMentor = !!aluno.consultorId;
  const bypassOnboarding = aluno.bypassOnboarding === 1;

  // Se tem bypass OU já tem mentor → não precisa de onboarding
  const needsOnboarding = !bypassOnboarding && !hasMentor;

  return {
    needsOnboarding,
    hasMentor,
    bypassOnboarding,
    alunoId: aluno.id,
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
    if (slot.id) {
      // Atualizar existente
      await db.update(mentorAvailability)
        .set({
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
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
        endTime: slot.endTime,
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

export async function getMentorAppointments(consultorId: number, filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
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
  const result = [];
  for (const appt of appointments) {
    const participants = await db.select().from(appointmentParticipants)
      .where(eq(appointmentParticipants.appointmentId, appt.id));

    // Enriquecer com nomes dos alunos
    const allAlunos = await getAlunos();
    const alunoMap = new Map(allAlunos.map(a => [a.id, a]));

    const enrichedParticipants = participants.map(p => ({
      ...p,
      alunoName: alunoMap.get(p.alunoId)?.name || 'Desconhecido',
      alunoEmail: alunoMap.get(p.alunoId)?.email || '',
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

  const participations = await db.select().from(appointmentParticipants)
    .where(eq(appointmentParticipants.alunoId, alunoId));

  const result = [];
  for (const p of participations) {
    const [appt] = await db.select().from(mentorAppointments)
      .where(eq(mentorAppointments.id, p.appointmentId));
    if (appt && appt.status !== 'cancelado') {
      const consultorsList = await getConsultors();
      const mentor = consultorsList.find(c => c.id === appt.consultorId);

      // Buscar todos os participantes para sessões de grupo
      let participants: { alunoId: number; alunoName: string; status: string }[] = [];
      if (appt.type === 'grupo') {
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

    // Verificar CPF duplicado
    const [existingCpf] = await db.select().from(users).where(eq(users.cpf, normalizedCpf)).limit(1);
    if (existingCpf) {
      return { success: false, message: "Este CPF já está cadastrado no sistema." };
    }

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
      // Filtrar: só gerentes de empresa (sem consultorId) OU gerentes com alunoId
      // Excluir mentores (que têm consultorId mas não são gerentes de empresa)
      return !u.consultorId || u.alunoId;
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
