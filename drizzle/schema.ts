import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role system for admin, manager (consultor), and user (aluno) levels.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }), // Para login tradicional com senha
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "manager"]).default("user").notNull(),
  departmentId: int("departmentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Programs - Different mentoring programs (SEBRAE Acre, SEBRAE TO, EMBRAPII)
 */
export const programs = mysqlTable("programs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Program = typeof programs.$inferSelect;
export type InsertProgram = typeof programs.$inferInsert;

/**
 * Consultors/Mentors - The mentors who guide the students
 */
export const consultors = mysqlTable("consultors", {
  id: int("id").autoincrement().primaryKey(),
  loginId: varchar("loginId", { length: 50 }), // ID criado pelo admin para login
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  programId: int("programId"),
  role: mysqlEnum("role", ["mentor", "gerente"]).default("mentor").notNull(),
  managedProgramId: int("managedProgramId"), // Para gerentes: qual empresa gerencia
  isActive: int("isActive").default(1).notNull(),
  canLogin: int("canLogin").default(0).notNull(), // 1 = pode fazer login
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Consultor = typeof consultors.$inferSelect;
export type InsertConsultor = typeof consultors.$inferInsert;

/**
 * Classes/Turmas - Groups of students
 */
export const turmas = mysqlTable("turmas", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 100 }),
  name: varchar("name", { length: 255 }).notNull(),
  programId: int("programId").notNull(),
  year: int("year").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Turma = typeof turmas.$inferSelect;
export type InsertTurma = typeof turmas.$inferInsert;

/**
 * Trilhas - Learning paths (Básicas, Essenciais, Master, Jornada do Futuro)
 */
export const trilhas = mysqlTable("trilhas", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 100 }),
  name: varchar("name", { length: 255 }).notNull(),
  codigo: varchar("codigo", { length: 50 }), // Código único para integração
  ordem: int("ordem").default(0), // Ordem de exibição
  programId: int("programId"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Trilha = typeof trilhas.$inferSelect;
export type InsertTrilha = typeof trilhas.$inferInsert;

/**
 * Competências - Skills within each trilha (36 total)
 */
export const competencias = mysqlTable("competencias", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  trilhaId: int("trilhaId").notNull(), // FK para trilhas
  codigoIntegracao: varchar("codigoIntegracao", { length: 100 }), // Chave para casar com planilha
  descricao: text("descricao"),
  ordem: int("ordem").default(0), // Ordem de exibição
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Competencia = typeof competencias.$inferSelect;
export type InsertCompetencia = typeof competencias.$inferInsert;

/**
 * Students/Alunos - The mentees/tutorados
 */
export const alunos = mysqlTable("alunos", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 100 }), // Id Usuário da planilha (usado para login)
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }), // Email para login
  turmaId: int("turmaId"),
  trilhaId: int("trilhaId"),
  consultorId: int("consultorId"),
  programId: int("programId"),
  isActive: int("isActive").default(1).notNull(),
  canLogin: int("canLogin").default(1).notNull(), // 1 = pode fazer login
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Aluno = typeof alunos.$inferSelect;
export type InsertAluno = typeof alunos.$inferInsert;

/**
 * Mentoring Sessions - Individual mentoring records
 */
export const mentoringSessions = mysqlTable("mentoring_sessions", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("alunoId").notNull(),
  consultorId: int("consultorId").notNull(),
  turmaId: int("turmaId"),
  trilhaId: int("trilhaId"),
  ciclo: mysqlEnum("ciclo", ["I", "II", "III", "IV"]),
  sessionNumber: int("sessionNumber"),
  sessionDate: date("sessionDate"),
  presence: mysqlEnum("presence", ["presente", "ausente"]).notNull(),
  taskStatus: mysqlEnum("taskStatus", ["entregue", "nao_entregue", "sem_tarefa"]),
  engagementScore: int("engagementScore"),
  notaEvolucao: int("notaEvolucao"), // Nota da mentora (0-10) - BLOCO 8
  feedback: text("feedback"),
  batchId: int("batchId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MentoringSession = typeof mentoringSessions.$inferSelect;
export type InsertMentoringSession = typeof mentoringSessions.$inferInsert;

/**
 * Events - Webinars and classes
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 100 }),
  title: varchar("title", { length: 500 }).notNull(),
  eventType: mysqlEnum("eventType", ["webinar", "aula", "workshop", "outro"]).default("webinar"),
  eventDate: date("eventDate"),
  programId: int("programId"),
  trilhaId: int("trilhaId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Event Participation - Student attendance at events
 */
export const eventParticipation = mysqlTable("event_participation", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  alunoId: int("alunoId").notNull(),
  status: mysqlEnum("status", ["presente", "ausente"]).notNull(),
  batchId: int("batchId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EventParticipation = typeof eventParticipation.$inferSelect;
export type InsertEventParticipation = typeof eventParticipation.$inferInsert;

/**
 * Upload batches - tracks weekly uploads
 */
export const uploadBatches = mysqlTable("upload_batches", {
  id: int("id").autoincrement().primaryKey(),
  weekNumber: int("weekNumber").notNull(),
  year: int("year").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  programId: int("programId"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "error"]).default("pending").notNull(),
  notes: text("notes"),
  totalRecords: int("totalRecords"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UploadBatch = typeof uploadBatches.$inferSelect;
export type InsertUploadBatch = typeof uploadBatches.$inferInsert;

/**
 * Uploaded files - individual spreadsheet files
 */
export const uploadedFiles = mysqlTable("uploaded_files", {
  id: int("id").autoincrement().primaryKey(),
  batchId: int("batchId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: mysqlEnum("fileType", ["sebraeacre_mentorias", "sebraeacre_eventos", "sebraeto_mentorias", "sebraeto_eventos", "embrapii_mentorias", "embrapii_eventos", "performance"]).default("sebraeacre_mentorias").notNull(),
  fileSize: int("fileSize"),
  rowCount: int("rowCount"),
  columnCount: int("columnCount"),
  status: mysqlEnum("status", ["uploaded", "processing", "processed", "error"]).default("uploaded").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = typeof uploadedFiles.$inferInsert;

/**
 * Dashboard metrics - aggregated metrics for dashboards
 */
export const dashboardMetrics = mysqlTable("dashboard_metrics", {
  id: int("id").autoincrement().primaryKey(),
  batchId: int("batchId"),
  programId: int("programId"),
  scope: mysqlEnum("scope", ["admin", "manager", "individual"]).notNull(),
  scopeId: int("scopeId"),
  metricType: varchar("metricType", { length: 100 }).notNull(),
  metricName: varchar("metricName", { length: 255 }).notNull(),
  currentValue: decimal("currentValue", { precision: 15, scale: 4 }),
  previousValue: decimal("previousValue", { precision: 15, scale: 4 }),
  changePercent: decimal("changePercent", { precision: 8, scale: 2 }),
  trend: mysqlEnum("trend", ["up", "down", "stable"]),
  chartData: json("chartData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DashboardMetric = typeof dashboardMetrics.$inferSelect;
export type InsertDashboardMetric = typeof dashboardMetrics.$inferInsert;

/**
 * Reports - generated reports history
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["admin", "manager", "individual"]).notNull(),
  format: mysqlEnum("format", ["pdf", "excel"]).notNull(),
  generatedBy: int("generatedBy").notNull(),
  programId: int("programId"),
  scopeId: int("scopeId"),
  fileKey: varchar("fileKey", { length: 512 }),
  fileUrl: text("fileUrl"),
  parameters: json("parameters"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// Legacy tables kept for compatibility
export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  managerId: int("managerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

export const calculationFormulas = mysqlTable("calculation_formulas", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  formula: text("formula").notNull(),
  variables: json("variables"),
  isActive: int("isActive").default(1).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalculationFormula = typeof calculationFormulas.$inferSelect;
export type InsertCalculationFormula = typeof calculationFormulas.$inferInsert;

export const processedData = mysqlTable("processed_data", {
  id: int("id").autoincrement().primaryKey(),
  batchId: int("batchId").notNull(),
  fileId: int("fileId").notNull(),
  userId: int("userId"),
  departmentId: int("departmentId"),
  metricName: varchar("metricName", { length: 255 }).notNull(),
  metricValue: decimal("metricValue", { precision: 15, scale: 4 }),
  metricUnit: varchar("metricUnit", { length: 50 }),
  period: varchar("period", { length: 50 }),
  rawData: json("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProcessedData = typeof processedData.$inferSelect;
export type InsertProcessedData = typeof processedData.$inferInsert;
