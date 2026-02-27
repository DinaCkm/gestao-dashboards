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
  cpf: varchar("cpf", { length: 14 }), // CPF para login universal (formato: 12345678900)
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "manager"]).default("user").notNull(),
  programId: int("programId"), // Empresa vinculada (para gestores e alunos)
  alunoId: int("alunoId"), // Referência ao aluno (para perfil aluno)
  consultorId: int("consultorId"), // Referência ao consultor/gerente (para perfil gestor)
  departmentId: int("departmentId"),
  isActive: int("isActive").default(1).notNull(), // 1 = ativo, 0 = inativo
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
  cpf: varchar("cpf", { length: 11 }), // CPF do mentor para login
  especialidade: text("especialidade"), // Área de especialidade do mentor (ex: Gestão, Finanças, Marketing)
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
 * Ciclos de Execução da Trilha - Define períodos de liberação de competências por aluno
 * Preenchido pela mentora durante o Assessment (1ª sessão de mentoria)
 */
export const ciclosExecucao = mysqlTable("ciclos_execucao", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("alunoId").notNull(), // FK para alunos
  nomeCiclo: varchar("nomeCiclo", { length: 255 }).notNull(), // Ex: "Ciclo 1 - Competências Básicas"
  dataInicio: date("dataInicio").notNull(), // Data de liberação do ciclo
  dataFim: date("dataFim").notNull(), // Data limite para conclusão
  definidoPor: int("definidoPor"), // FK para consultors (mentora que definiu)
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CicloExecucao = typeof ciclosExecucao.$inferSelect;
export type InsertCicloExecucao = typeof ciclosExecucao.$inferInsert;

/**
 * Competências vinculadas a cada ciclo de execução
 */
export const cicloCompetencias = mysqlTable("ciclo_competencias", {
  id: int("id").autoincrement().primaryKey(),
  cicloId: int("cicloId").notNull(), // FK para ciclos_execucao
  competenciaId: int("competenciaId").notNull(), // FK para competencias
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CicloCompetencia = typeof cicloCompetencias.$inferSelect;
export type InsertCicloCompetencia = typeof cicloCompetencias.$inferInsert;

/**
 * Plano Individual - Competências obrigatórias vinculadas a cada aluno
 */
export const planoIndividual = mysqlTable("plano_individual", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("alunoId").notNull(), // FK para alunos
  competenciaId: int("competenciaId").notNull(), // FK para competencias
  isObrigatoria: int("isObrigatoria").default(1).notNull(), // 1 = obrigatória, 0 = opcional
  notaAtual: decimal("notaAtual", { precision: 5, scale: 2 }), // Nota atual na competência
  metaNota: decimal("metaNota", { precision: 5, scale: 2 }).default("7.00"), // Meta padrão = 7
  status: mysqlEnum("status", ["pendente", "em_progresso", "concluida"]).default("pendente").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlanoIndividual = typeof planoIndividual.$inferSelect;
export type InsertPlanoIndividual = typeof planoIndividual.$inferInsert;

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
  isAssessment: int("isAssessment").default(0).notNull(), // 1 = sessão de assessment (não conta no saldo), 0 = sessão normal
  presence: mysqlEnum("presence", ["presente", "ausente"]).notNull(),
  taskStatus: mysqlEnum("taskStatus", ["entregue", "nao_entregue", "sem_tarefa"]),
  engagementScore: int("engagementScore"),
  notaEvolucao: int("notaEvolucao"), // Nota da mentora (0-10) - BLOCO 8
  feedback: text("feedback"),
  mensagemAluno: text("mensagemAluno"),
  taskId: int("taskId"),
  taskDeadline: date("taskDeadline"),
  relatoAluno: text("relatoAluno"),
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
  eventType: mysqlEnum("eventType", ["webinar", "aula", "workshop", "curso_online", "outro"]).default("webinar"),
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
  reflexao: text("reflexao"), // Reflexão do aluno após assistir o webinar
  selfReportedAt: timestamp("selfReportedAt"), // Data/hora que o aluno marcou presença
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

/**
 * Assessment PDI - Plano de Desenvolvimento Individual do aluno
 * Criado pela mentora durante o assessment. Define a trilha, Macro Jornada e status.
 * Hierarquia: Contrato (período total) → Macro Jornada (duração da trilha) → Micro Jornada (duração da competência)
 * Histórico é sempre mantido. Quando uma trilha encerra, a mentora congela.
 */
export const assessmentPdi = mysqlTable("assessment_pdi", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("alunoId").notNull(), // FK para alunos
  trilhaId: int("trilhaId").notNull(), // FK para trilhas (Básica, Essencial, Master, Visão de Futuro)
  turmaId: int("turmaId"), // FK para turmas (BS1, BS2, BS3, etc.)
  consultorId: int("consultorId"), // FK para consultors (mentora que criou o assessment)
  programId: int("programId"), // FK para programs
  macroInicio: date("macroInicio").notNull(), // Data início do macro ciclo (jornada)
  macroTermino: date("macroTermino").notNull(), // Data término do macro ciclo (jornada)
  status: mysqlEnum("status", ["ativo", "congelado"]).default("ativo").notNull(),
  observacoes: text("observacoes"),
  congeladoEm: timestamp("congeladoEm"), // Data em que a mentora congelou a trilha
  congeladoPor: int("congeladoPor"), // FK para consultors (quem congelou)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssessmentPdi = typeof assessmentPdi.$inferSelect;
export type InsertAssessmentPdi = typeof assessmentPdi.$inferInsert;

/**
 * Assessment Competências - Competências do PDI com peso, nível e Micro Jornada
 * Cada registro vincula uma competência ao PDI do aluno.
 * Micro Jornadas NUNCA podem ultrapassar as datas da Macro Jornada.
 */
export const assessmentCompetencias = mysqlTable("assessment_competencias", {
  id: int("id").autoincrement().primaryKey(),
  assessmentPdiId: int("assessmentPdiId").notNull(), // FK para assessment_pdi
  competenciaId: int("competenciaId").notNull(), // FK para competencias
  peso: mysqlEnum("peso", ["obrigatoria", "opcional"]).default("obrigatoria").notNull(),
  notaCorte: decimal("notaCorte", { precision: 5, scale: 2 }).default("8.00").notNull(), // DEPRECADO - mantido para compatibilidade. Usar nivelAtual/metaFinal
  nivelAtual: decimal("nivelAtual", { precision: 5, scale: 2 }), // Nível atual do aluno na competência (0-100%)
  metaFinal: decimal("metaFinal", { precision: 5, scale: 2 }), // Meta final da competência (0-100%)
  metaCiclo1: decimal("metaCiclo1", { precision: 5, scale: 2 }), // Meta para o ciclo 1 (0-100%)
  metaCiclo2: decimal("metaCiclo2", { precision: 5, scale: 2 }), // Meta para o ciclo 2 (0-100%)
  justificativa: text("justificativa"), // Justificativa da mentora para a meta definida
  microInicio: date("microInicio"), // Data início da Micro Jornada
  microTermino: date("microTermino"), // Data término da Micro Jornada
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssessmentCompetencia = typeof assessmentCompetencias.$inferSelect;
export type InsertAssessmentCompetencia = typeof assessmentCompetencias.$inferInsert;

/**
 * Performance Uploads - Histórico de uploads do relatório de performance
 */
export const performanceUploads = mysqlTable("performance_uploads", {
  id: int("id").autoincrement().primaryKey(),
  uploadedBy: int("uploadedBy").notNull(), // FK para users
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }),
  fileUrl: text("fileUrl"),
  totalRecords: int("totalRecords").default(0).notNull(),
  processedRecords: int("processedRecords").default(0).notNull(),
  skippedRecords: int("skippedRecords").default(0).notNull(),
  newAlunos: int("newAlunos").default(0).notNull(), // Alunos novos encontrados
  updatedRecords: int("updatedRecords").default(0).notNull(), // Registros atualizados
  status: mysqlEnum("status", ["processing", "completed", "error"]).default("processing").notNull(),
  errorMessage: text("errorMessage"),
  summary: json("summary"), // JSON com resumo detalhado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceUpload = typeof performanceUploads.$inferSelect;
export type InsertPerformanceUpload = typeof performanceUploads.$inferInsert;

/**
 * Student Performance - Dados de performance por aluno/competência/turma
 * Atualizado via upload do relatório de performance CSV
 * Cada registro = 1 aluno x 1 competência x 1 turma
 */
export const studentPerformance = mysqlTable("student_performance", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("alunoId"), // FK para alunos (null se aluno não encontrado)
  externalUserId: varchar("externalUserId", { length: 100 }).notNull(), // Id Usuário da planilha
  userName: varchar("userName", { length: 255 }).notNull(), // Nome do usuário
  userEmail: varchar("userEmail", { length: 320 }), // Email
  lastAccess: varchar("lastAccess", { length: 100 }), // Último acesso (texto original)
  turmaId: int("turmaId"), // FK para turmas
  externalTurmaId: varchar("externalTurmaId", { length: 100 }), // Id Turma da planilha
  turmaName: varchar("turmaName", { length: 255 }), // Nome da turma
  competenciaId: int("competenciaId"), // FK para competencias
  externalCompetenciaId: varchar("externalCompetenciaId", { length: 100 }), // Id Competência da planilha
  competenciaName: varchar("competenciaName", { length: 255 }), // Nome da competência
  dataInicio: varchar("dataInicio", { length: 100 }), // Data de início (texto original)
  dataConclusao: varchar("dataConclusao", { length: 100 }), // Data de conclusão (texto original)
  totalAulas: int("totalAulas").default(0),
  aulasDisponiveis: int("aulasDisponiveis").default(0),
  aulasConcluidas: int("aulasConcluidas").default(0),
  aulasEmAndamento: int("aulasEmAndamento").default(0),
  aulasNaoIniciadas: int("aulasNaoIniciadas").default(0),
  aulasAgendadas: int("aulasAgendadas").default(0),
  progressoTotal: int("progressoTotal").default(0), // Percentual 0-100
  cargaHorariaTotal: varchar("cargaHorariaTotal", { length: 20 }), // Ex: "01:30:00"
  cargaHorariaConcluida: varchar("cargaHorariaConcluida", { length: 20 }),
  progressoAulasDisponiveis: int("progressoAulasDisponiveis").default(0),
  avaliacoesDiagnostico: int("avaliacoesDiagnostico").default(0),
  mediaAvaliacoesDiagnostico: decimal("mediaAvaliacoesDiagnostico", { precision: 5, scale: 2 }),
  avaliacoesFinais: int("avaliacoesFinais").default(0),
  mediaAvaliacoesFinais: decimal("mediaAvaliacoesFinais", { precision: 5, scale: 2 }),
  avaliacoesDisponiveis: int("avaliacoesDisponiveis").default(0),
  avaliacoesRespondidas: int("avaliacoesRespondidas").default(0),
  avaliacoesPendentes: int("avaliacoesPendentes").default(0),
  avaliacoesAgendadas: int("avaliacoesAgendadas").default(0),
  mediaAvaliacoesDisponiveis: decimal("mediaAvaliacoesDisponiveis", { precision: 5, scale: 2 }),
  mediaAvaliacoesRespondidas: decimal("mediaAvaliacoesRespondidas", { precision: 5, scale: 2 }),
  concluidoDentroPrazo: varchar("concluidoDentroPrazo", { length: 100 }),
  concluidoEmAtraso: varchar("concluidoEmAtraso", { length: 100 }),
  naoConcluidoDentroPrazo: varchar("naoConcluidoDentroPrazo", { length: 100 }),
  naoConcluidoEmAtraso: varchar("naoConcluidoEmAtraso", { length: 100 }),
  uploadId: int("uploadId"), // FK para performance_uploads
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentPerformance = typeof studentPerformance.$inferSelect;
export type InsertStudentPerformance = typeof studentPerformance.$inferInsert;

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

export const taskLibrary = mysqlTable("task_library", {
  id: int("id").autoincrement().primaryKey(),
  competencia: varchar("competencia", { length: 255 }).notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  resumo: text("resumo"),
  oQueFazer: text("oQueFazer"),
  oQueGanha: text("oQueGanha"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskLibrary = typeof taskLibrary.$inferSelect;
export type InsertTaskLibrary = typeof taskLibrary.$inferInsert;

/**
 * Scheduled Webinars - Webinars cadastrados pelo admin para divulgação e gestão
 */
export const scheduledWebinars = mysqlTable("scheduled_webinars", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  theme: varchar("theme", { length: 255 }), // Tema do webinar
  speaker: varchar("speaker", { length: 255 }), // Palestrante/apresentador
  speakerBio: text("speakerBio"), // Mini-bio do palestrante
  eventDate: timestamp("eventDate").notNull(), // Data e hora do evento (legado, manter para compatibilidade)
  startDate: timestamp("startDate"), // Data e hora de início do evento
  endDate: timestamp("endDate"), // Data e hora de término (libera marcação de presença)
  duration: int("duration").default(60), // Duração em minutos
  meetingLink: varchar("meetingLink", { length: 500 }), // Link Google Meet/Zoom
  youtubeLink: varchar("youtubeLink", { length: 500 }), // Link YouTube (gravação)
  cardImageUrl: text("cardImageUrl"), // URL da imagem do cartão de divulgação (S3)
  cardImageKey: varchar("cardImageKey", { length: 512 }), // Key no S3
  programId: int("programId"), // Empresa específica ou null para todos
  targetAudience: mysqlEnum("targetAudience", ["all", "sebrae_to", "sebrae_acre", "embrapii", "banrisul"]).default("all"),
  status: mysqlEnum("status", ["draft", "published", "completed", "cancelled"]).default("draft").notNull(),
  reminderSent: int("reminderSent").default(0).notNull(), // 0 = não enviado, 1 = enviado
  reminderSentAt: timestamp("reminderSentAt"),
  createdBy: int("createdBy").notNull(), // FK para users
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledWebinar = typeof scheduledWebinars.$inferSelect;
export type InsertScheduledWebinar = typeof scheduledWebinars.$inferInsert;

/**
 * Announcements - Avisos, divulgações de cursos, atividades extras
 * Aparece no mural do aluno
 */
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content"), // Conteúdo do aviso (pode ser HTML/markdown)
  type: mysqlEnum("type", ["webinar", "course", "activity", "notice", "news"]).default("notice").notNull(),
  imageUrl: text("imageUrl"), // URL da imagem de divulgação (S3)
  imageKey: varchar("imageKey", { length: 512 }), // Key no S3
  actionUrl: varchar("actionUrl", { length: 500 }), // Link externo (inscrição, plataforma, etc)
  actionLabel: varchar("actionLabel", { length: 100 }), // Texto do botão (ex: "Inscreva-se", "Acessar")
  programId: int("programId"), // Empresa específica ou null para todos
  targetAudience: mysqlEnum("targetAudience", ["all", "sebrae_to", "sebrae_acre", "embrapii", "banrisul"]).default("all"),
  priority: int("priority").default(0).notNull(), // Maior = mais destaque
  publishAt: timestamp("publishAt"), // Data de publicação (agendamento)
  expiresAt: timestamp("expiresAt"), // Data de expiração
  isActive: int("isActive").default(1).notNull(),
  webinarId: int("webinarId"), // FK para scheduled_webinars (se for divulgação de webinar)
  createdBy: int("createdBy").notNull(), // FK para users
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * Contratos do Aluno - Definições contratuais definidas pelo Administrador
 * Centraliza: empresa, período do contrato e nº total de sessões contratadas
 * Hierarquia: Contrato (Admin) → Macro Jornada/Trilha (Mentora) → Micro Jornada/Competência (Mentora)
 */
export const contratosAluno = mysqlTable("contratos_aluno", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("alunoId").notNull(), // FK para alunos
  programId: int("programId").notNull(), // FK para programs (empresa)
  turmaId: int("turmaId"), // FK para turmas
  periodoInicio: date("periodoInicio").notNull(), // Data de início do contrato
  periodoTermino: date("periodoTermino").notNull(), // Data de término do contrato
  totalSessoesContratadas: int("totalSessoesContratadas").notNull(), // Nº total de sessões de mentoria
  observacoes: text("observacoes"), // Observações do administrador
  criadoPor: int("criadoPor"), // FK para users (admin que criou)
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContratoAluno = typeof contratosAluno.$inferSelect;
export type InsertContratoAluno = typeof contratosAluno.$inferInsert;

/**
 * Histórico de Nível de Competência - Registra a evolução do nível do aluno
 * A mentora atualiza o nível atual a cada 3 sessões de mentoria
 */
export const historicoNivelCompetencia = mysqlTable("historico_nivel_competencia", {
  id: int("id").autoincrement().primaryKey(),
  assessmentCompetenciaId: int("assessmentCompetenciaId").notNull(), // FK para assessment_competencias
  alunoId: int("alunoId").notNull(), // FK para alunos (desnormalizado para queries rápidas)
  nivelAnterior: decimal("nivelAnterior", { precision: 5, scale: 2 }), // Nível antes da atualização (0-100%)
  nivelNovo: decimal("nivelNovo", { precision: 5, scale: 2 }).notNull(), // Nível após atualização (0-100%)
  atualizadoPor: int("atualizadoPor"), // FK para consultors (mentora)
  sessaoReferencia: int("sessaoReferencia"), // Número da sessão de referência
  observacao: text("observacao"), // Observação da mentora
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HistoricoNivelCompetencia = typeof historicoNivelCompetencia.$inferSelect;
export type InsertHistoricoNivelCompetencia = typeof historicoNivelCompetencia.$inferInsert;
