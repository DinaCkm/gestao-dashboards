import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  departments, InsertDepartment, Department,
  uploadBatches, InsertUploadBatch, UploadBatch,
  uploadedFiles, InsertUploadedFile, UploadedFile,
  calculationFormulas, InsertCalculationFormula, CalculationFormula,
  processedData, InsertProcessedData, ProcessedData,
  dashboardMetrics, InsertDashboardMetric, DashboardMetric,
  reports, InsertReport, Report
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
  if (!db) return { totalUsers: 0, totalDepartments: 0, totalBatches: 0, totalReports: 0 };
  
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [deptCount] = await db.select({ count: sql<number>`count(*)` }).from(departments);
  const [batchCount] = await db.select({ count: sql<number>`count(*)` }).from(uploadBatches);
  const [reportCount] = await db.select({ count: sql<number>`count(*)` }).from(reports);
  
  return {
    totalUsers: userCount?.count || 0,
    totalDepartments: deptCount?.count || 0,
    totalBatches: batchCount?.count || 0,
    totalReports: reportCount?.count || 0
  };
}
