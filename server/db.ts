import { eq, and, desc, sql, not } from "drizzle-orm";
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
  planoIndividual, InsertPlanoIndividual, PlanoIndividual
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

export async function updateMentoringSession(sessionId: number, data: { notaEvolucao?: number; feedback?: string }): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const updateData: Record<string, unknown> = {};
  if (data.notaEvolucao !== undefined) updateData.notaEvolucao = data.notaEvolucao;
  if (data.feedback !== undefined) updateData.feedback = data.feedback;
  
  if (Object.keys(updateData).length === 0) return true;
  
  await db.update(mentoringSessions)
    .set(updateData)
    .where(eq(mentoringSessions.id, sessionId));
  return true;
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
  
  // Get programs
  const programsList = await getPrograms();
  const programMap = new Map(programsList.map(p => [p.id, p]));
  
  // Calculate stats per program
  const statsByProgram: Record<string, { mentorias: number; alunos: Set<number>; datas: Set<string> }> = {};
  
  for (const session of sessions) {
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
  
  // Get aluno details
  const alunosAtendidos = alunoIds.map(id => {
    const aluno = alunoMap.get(id);
    if (!aluno) return null;
    const program = aluno.programId ? programMap.get(aluno.programId) : null;
    const alunoSessions = sessions.filter(s => s.alunoId === id);
    return {
      id: aluno.id,
      nome: aluno.name,
      empresa: program?.name || 'Sem Programa',
      totalMentorias: alunoSessions.length,
      ultimaMentoria: alunoSessions.length > 0 ? alunoSessions[alunoSessions.length - 1].sessionDate : null
    };
  }).filter(Boolean);
  
  return {
    totalMentorias: sessions.length,
    totalAlunos: alunoIds.length,
    totalEmpresas: Object.keys(statsByProgram).length,
    porEmpresa: Object.entries(statsByProgram).map(([empresa, stats]) => ({
      empresa,
      mentorias: stats.mentorias,
      alunos: stats.alunos.size,
      datas: Array.from(stats.datas).sort()
    })),
    alunosAtendidos,
    sessoes: sessions.map(s => {
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

// Mentores
export async function getAllMentores() {
  const db = await getDb();
  if (!db) return [];
  return await db.select()
    .from(consultors)
    .where(eq(consultors.role, 'mentor'))
    .orderBy(consultors.name);
}

export async function createMentor(data: { name: string; email: string; loginId?: string; programId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");
  
  const [result] = await db.insert(consultors).values({
    name: data.name,
    email: data.email.toLowerCase(),
    loginId: data.loginId || null,
    programId: data.programId || null,
    role: 'mentor',
    canLogin: data.loginId ? 1 : 0,
    isActive: 1,
  });
  
  return { id: result.insertId, ...data };
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
// ============ LOGIN UNIVERSAL EMAIL + CPF ============

export async function authenticateByEmailCpf(email: string, cpf: string): Promise<{ success: boolean; user?: any; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };
  
  // Normalizar CPF (remover pontos e traços)
  const normalizedCpf = cpf.replace(/[.\-]/g, '');
  
  const [user] = await db.select()
    .from(users)
    .where(and(
      eq(users.email, email.toLowerCase()),
      eq(users.cpf, normalizedCpf),
      eq(users.isActive, 1)
    ))
    .limit(1);
  
  if (!user) {
    return { success: false, message: "Email ou CPF incorretos, ou usuário inativo. Verifique suas credenciais." };
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
      role: user.role,
      programId: user.programId,
      alunoId: user.alunoId,
      consultorId: user.consultorId
    }
  };
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
    alunoId: users.alunoId,
    consultorId: users.consultorId,
    isActive: users.isActive,
    loginMethod: users.loginMethod,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  })
    .from(users)
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
  
  const [user] = await db.select()
    .from(users)
    .where(and(
      eq(users.openId, username),
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
    competenciaNome: competencias.nome,
  })
  .from(planoIndividual)
  .leftJoin(competencias, eq(planoIndividual.competenciaId, competencias.id));
  
  return result;
}
