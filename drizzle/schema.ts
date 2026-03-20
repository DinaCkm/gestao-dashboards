import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, date, boolean } from "drizzle-orm/mysql-core";

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
  photoUrl: text("photoUrl"), // URL da foto do mentor (S3)
  miniCurriculo: text("miniCurriculo"), // Minicurrículo / biografia do mentor
  canLogin: int("canLogin").default(0).notNull(), // 1 = pode fazer login
  valorSessao: decimal("valorSessao", { precision: 10, scale: 2 }), // Valor por sessão de mentoria (R$)
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
  externalId: varchar("externalId", { length: 100 }), // Id Usuário da planilha (usado para login sem CPF)
  cpf: varchar("cpf", { length: 14 }), // CPF do aluno (sem formatação, apenas dígitos) - quando presente, login é por Email+CPF
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }), // Email para login
  turmaId: int("turmaId"),
  trilhaId: int("trilhaId"),
  consultorId: int("consultorId"),
  programId: int("programId"),
  isActive: int("isActive").default(1).notNull(),
  canLogin: int("canLogin").default(1).notNull(), // 1 = pode fazer login
  bypassOnboarding: int("bypassOnboarding").default(0).notNull(), // 1 = pular assessment/vitrine, ir direto ao dashboard (LEGADO - não usar mais)
  onboardingLiberado: int("onboardingLiberado").default(0).notNull(), // 1 = admin liberou novo ciclo de onboarding
  onboardingLiberadoEm: timestamp("onboardingLiberadoEm"), // quando o admin liberou
  cadastradoPorAdmin: int("cadastradoPorAdmin").default(0).notNull(), // 1 = cadastrado diretamente pelo admin
  contratoInicio: timestamp("contratoInicio"), // Data início do período contratual
  contratoFim: timestamp("contratoFim"), // Data fim do período contratual
  telefone: varchar("telefone", { length: 20 }),
  cargo: varchar("cargo", { length: 255 }),
  areaAtuacao: varchar("areaAtuacao", { length: 255 }),
  minicurriculo: text("minicurriculo"),
  quemEVoce: text("quemEVoce"),
  discVideoWatchedAt: timestamp("discVideoWatchedAt"), // Data/hora em que o aluno assistiu o video DISC pela 1a vez
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
  taskStatus: mysqlEnum("taskStatus", ["entregue", "nao_entregue", "sem_tarefa", "validada"]),
  engagementScore: int("engagementScore"),
  notaEvolucao: int("notaEvolucao"), // Nota da mentora (0-10) - BLOCO 8
  feedback: text("feedback"),
  mensagemAluno: text("mensagemAluno"),
  taskId: int("taskId"),
  taskDeadline: date("taskDeadline"),
  customTaskTitle: varchar("customTaskTitle", { length: 500 }), // Título da tarefa personalizada/livre
  customTaskDescription: text("customTaskDescription"), // Descrição da tarefa personalizada/livre
  taskMode: mysqlEnum("taskMode", ["biblioteca", "personalizada", "livre", "sem_tarefa"]).default("sem_tarefa"), // Modo de seleção da tarefa
  relatoAluno: text("relatoAluno"),
  batchId: int("batchId"),
  // Campos de evidência (aluno envia link/imagem como prova da atividade)
  evidenceLink: varchar("evidenceLink", { length: 1000 }), // URL da evidência
  evidenceImageUrl: text("evidenceImageUrl"), // URL da imagem no S3
  evidenceImageKey: varchar("evidenceImageKey", { length: 512 }), // Key da imagem no S3
  submittedAt: timestamp("submittedAt"), // Data/hora que o aluno enviou a evidência
  // Campos de validação (mentor valida a entrega)
  validatedBy: int("validatedBy"), // ID do consultor/mentor que validou
  validatedAt: timestamp("validatedAt"), // Data/hora da validação
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
  videoLink: varchar("videoLink", { length: 500 }), // Link da gravação/vídeo do evento (YouTube, etc.)
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
  type: mysqlEnum("type", ["admin", "manager", "individual", "financeiro_mentora", "financeiro_empresa"]).notNull(),
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
  totalSessoesPrevistas: int("totalSessoesPrevistas"), // Total de sessões de mentoria previstas para o período do contrato (se null, calcula pela diferença de meses)
  status: mysqlEnum("status", ["ativo", "congelado"]).default("ativo").notNull(),
  observacoes: text("observacoes"),
  congeladoEm: timestamp("congeladoEm"), // Data em que a mentora congelou a trilha
  congeladoPor: int("congeladoPor"), // FK para consultors (quem congelou)
  motivoCongelamento: text("motivoCongelamento"), // Motivo obrigatório do congelamento
  descongeladoEm: timestamp("descongeladoEm"), // Data em que foi descongelado
  descongeladoPor: int("descongeladoPor"), // FK para consultors (quem descongelou)
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
  nome: varchar("nome", { length: 500 }).notNull(),
  resumo: text("resumo"),
  oQueFazer: text("o_que_fazer"),
  oQueGanha: text("o_que_ganha"),
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

/**
 * Cases de Sucesso - Registro de entrega de cases por aluno por macrociclo
 * Cada macrociclo (Básicas, Essenciais, Master, Visão de Futuro) exige um case ao final
 * Entregue = 100, Não entregue = 0
 */
export const casesSucesso = mysqlTable("cases_sucesso", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("alunoId").notNull(), // FK para alunos
  trilhaId: int("trilhaId"), // FK para trilhas (macrociclo: Básicas, Essenciais, etc.)
  trilhaNome: varchar("trilhaNome", { length: 255 }), // Nome do macrociclo para referência rápida
  entregue: int("entregue").default(0).notNull(), // 1 = entregue, 0 = não entregue
  dataEntrega: timestamp("dataEntrega"), // Data em que o case foi entregue
  titulo: varchar("titulo", { length: 500 }), // Título do case
  descricao: text("descricao"), // Descrição/resumo do case
  avaliadoPor: int("avaliadoPor"), // FK para consultors (mentora que avaliou)
  observacao: text("observacao"), // Observação da mentora
  fileUrl: varchar("fileUrl", { length: 1000 }), // URL do arquivo no S3
  fileKey: varchar("fileKey", { length: 500 }), // Chave do arquivo no S3
  fileName: varchar("fileName", { length: 500 }), // Nome original do arquivo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CaseSucesso = typeof casesSucesso.$inferSelect;
export type InsertCaseSucesso = typeof casesSucesso.$inferInsert;

/**
 * Comentários em Atividades Práticas
 * Mentor e Admin podem comentar nas entregas dos alunos
 * Aluno visualiza os comentários no detalhe da tarefa
 */
export const practicalActivityComments = mysqlTable("practical_activity_comments", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(), // FK para mentoring_sessions
  authorId: int("authorId").notNull(), // ID do autor (user.id)
  authorRole: mysqlEnum("authorRole", ["mentor", "admin"]).notNull(),
  authorName: varchar("authorName", { length: 255 }).notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PracticalActivityComment = typeof practicalActivityComments.$inferSelect;
export type InsertPracticalActivityComment = typeof practicalActivityComments.$inferInsert;


/**
 * Disponibilidade do Mentor - Horários disponíveis para agendamento
 * O mentor cadastra seus dias/horários e link do Google Meet
 */
export const mentorAvailability = mysqlTable("mentor_availability", {
  id: int("id").autoincrement().primaryKey(),
  consultorId: int("consultorId").notNull(), // FK para consultors
  dayOfWeek: int("dayOfWeek").notNull(), // 0=Domingo, 1=Segunda, ..., 6=Sábado
  startTime: varchar("startTime", { length: 5 }).notNull(), // "09:00"
  endTime: varchar("endTime", { length: 5 }).notNull(), // "10:00"
  slotDurationMinutes: int("slotDurationMinutes").default(60).notNull(), // Duração de cada slot em minutos
  googleMeetLink: varchar("googleMeetLink", { length: 500 }), // Link do Google Meet
  isActive: int("isActive").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MentorAvailability = typeof mentorAvailability.$inferSelect;
export type InsertMentorAvailability = typeof mentorAvailability.$inferInsert;

/**
 * Agendamentos de Mentoria - Sessões agendadas pelos alunos
 * Pode ser individual ou de grupo
 */
export const mentorAppointments = mysqlTable("mentor_appointments", {
  id: int("id").autoincrement().primaryKey(),
  consultorId: int("consultorId").notNull(), // FK para consultors
  availabilityId: int("availabilityId"), // FK para mentor_availability (null para grupo)
  scheduledDate: varchar("scheduledDate", { length: 10 }).notNull(), // "2026-03-15"
  startTime: varchar("startTime", { length: 5 }).notNull(), // "09:00"
  endTime: varchar("endTime", { length: 5 }).notNull(), // "10:00"
  googleMeetLink: varchar("googleMeetLink", { length: 500 }), // Link do Google Meet
  type: mysqlEnum("type", ["individual", "grupo"]).default("individual").notNull(),
  title: varchar("title", { length: 255 }), // Título da sessão (obrigatório para grupo)
  description: text("description"), // Descrição/pauta da sessão
  status: mysqlEnum("status", ["agendado", "confirmado", "realizado", "cancelado"]).default("agendado").notNull(),
  createdBy: int("createdBy").notNull(), // Quem criou: alunoId (individual) ou consultorId (grupo)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MentorAppointment = typeof mentorAppointments.$inferSelect;
export type InsertMentorAppointment = typeof mentorAppointments.$inferInsert;

/**
 * Participantes do Agendamento - Para sessões individuais e de grupo
 * Cada aluno convidado/agendado tem um registro aqui
 */
export const appointmentParticipants = mysqlTable("appointment_participants", {
  id: int("id").autoincrement().primaryKey(),
  appointmentId: int("appointmentId").notNull(), // FK para mentor_appointments
  alunoId: int("alunoId").notNull(), // FK para alunos
  status: mysqlEnum("status", ["convidado", "confirmado", "recusado", "presente", "ausente"]).default("convidado").notNull(),
  confirmedAt: timestamp("confirmedAt"), // Quando o aluno confirmou
  notes: text("notes"), // Observações do aluno
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AppointmentParticipant = typeof appointmentParticipants.$inferSelect;
export type InsertAppointmentParticipant = typeof appointmentParticipants.$inferInsert;

/**
 * Metas de Desenvolvimento - Metas concretas vinculadas a competências do assessment
 * A mentora define metas para cada competência que o aluno precisa desenvolver.
 * Pode selecionar da biblioteca de ações (taskLibrary) ou criar meta personalizada.
 */
export const metas = mysqlTable("metas", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("alunoId").notNull(), // FK para alunos
  assessmentCompetenciaId: int("assessmentCompetenciaId").notNull(), // FK para assessment_competencias
  competenciaId: int("competenciaId").notNull(), // FK para competencias (desnormalizado para queries rápidas)
  assessmentPdiId: int("assessmentPdiId").notNull(), // FK para assessment_pdi
  taskLibraryId: int("taskLibraryId"), // FK para task_library (null se meta personalizada)
  titulo: varchar("titulo", { length: 500 }).notNull(), // Título da meta (da biblioteca ou personalizado)
  descricao: text("descricao"), // Descrição detalhada da meta
  definidaPor: int("definidaPor"), // FK para consultors (mentora que definiu)
  isActive: int("isActive").default(1).notNull(), // 1 = ativa, 0 = removida
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Meta = typeof metas.$inferSelect;
export type InsertMeta = typeof metas.$inferInsert;

/**
 * Acompanhamento de Metas - Registro mensal do status de cada meta
 * A mentora marca mensalmente se a meta foi cumprida ou não.
 */
export const metaAcompanhamento = mysqlTable("meta_acompanhamento", {
  id: int("id").autoincrement().primaryKey(),
  metaId: int("metaId").notNull(), // FK para metas
  alunoId: int("alunoId").notNull(), // FK para alunos (desnormalizado)
  mes: int("mes").notNull(), // Mês (1-12)
  ano: int("ano").notNull(), // Ano (ex: 2026)
  status: mysqlEnum("status", ["cumprida", "nao_cumprida", "parcial"]).notNull(),
  observacao: text("observacao"), // Observação da mentora
  registradoPor: int("registradoPor"), // FK para consultors (mentora)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MetaAcompanhamento = typeof metaAcompanhamento.$inferSelect;
export type InsertMetaAcompanhamento = typeof metaAcompanhamento.$inferInsert;


/**
 * Teste DISC - Respostas de Escolha Forçada (Ipsativo)
 * Cada bloco tem 4 opções (D, I, S, C). O aluno escolhe "mais" e "menos" parecido.
 */
export const discRespostas = mysqlTable("disc_respostas", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("alunoId").notNull(), // FK para alunos
  ciclo: int("ciclo").default(1).notNull(), // Ciclo do assessment
  blocoIndex: int("blocoIndex").notNull(), // Índice do bloco (0-27)
  maisId: varchar("maisId", { length: 20 }).notNull(), // ID da opção "mais parecido" (ex: b1_D)
  menosId: varchar("menosId", { length: 20 }).notNull(), // ID da opção "menos parecido" (ex: b1_S)
  maisDimensao: mysqlEnum("maisDimensao", ["D", "I", "S", "C"]).notNull(), // Dimensão do "mais"
  menosDimensao: mysqlEnum("menosDimensao", ["D", "I", "S", "C"]).notNull(), // Dimensão do "menos"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DiscResposta = typeof discRespostas.$inferSelect;
export type InsertDiscResposta = typeof discRespostas.$inferInsert;

/**
 * Teste DISC - Resultado calculado do perfil DISC do aluno
 * Armazena scores normalizados, brutos, índice de consistência e perfil
 */
export const discResultados = mysqlTable("disc_resultados", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("alunoId").notNull(), // FK para alunos
  ciclo: int("ciclo").default(1).notNull(), // Ciclo do assessment (1 = inicial, 2 = reassessment, etc.)
  scoreD: decimal("scoreD", { precision: 5, scale: 2 }).notNull(), // Score Dominância normalizado (0-100)
  scoreI: decimal("scoreI", { precision: 5, scale: 2 }).notNull(), // Score Influência normalizado (0-100)
  scoreS: decimal("scoreS", { precision: 5, scale: 2 }).notNull(), // Score Estabilidade normalizado (0-100)
  scoreC: decimal("scoreC", { precision: 5, scale: 2 }).notNull(), // Score Conformidade normalizado (0-100)
  scoreBrutoD: int("scoreBrutoD"), // Score bruto D (-28 a +28)
  scoreBrutoI: int("scoreBrutoI"), // Score bruto I (-28 a +28)
  scoreBrutoS: int("scoreBrutoS"), // Score bruto S (-28 a +28)
  scoreBrutoC: int("scoreBrutoC"), // Score bruto C (-28 a +28)
  perfilPredominante: mysqlEnum("perfilPredominante", ["D", "I", "S", "C"]).notNull(),
  perfilSecundario: mysqlEnum("perfilSecundario", ["D", "I", "S", "C"]),
  indiceConsistencia: int("indiceConsistencia"), // 0-100 (quanto maior, mais consistente)
  alertaBaixaDiferenciacao: boolean("alertaBaixaDiferenciacao").default(false), // true se scores muito próximos
  metodoCalculo: varchar("metodoCalculo", { length: 20 }).default("ipsativo").notNull(), // 'ipsativo' ou 'likert' (legado)
  completedAt: timestamp("completedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DiscResultado = typeof discResultados.$inferSelect;
export type InsertDiscResultado = typeof discResultados.$inferInsert;

/**
 * Autopercepção de Competências - O aluno se autoavalia em cada competência (régua 1-5)
 * Feito durante o Onboarding, antes da sessão de mentoria
 */
export const autopercepcoesCompetencias = mysqlTable("autopercepcoes_competencias", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("alunoId").notNull(), // FK para alunos
  competenciaId: int("competenciaId").notNull(), // FK para competencias
  trilhaId: int("trilhaId").notNull(), // FK para trilhas (desnormalizado)
  nota: int("nota").notNull(), // Autoavaliação 1-5
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutopercepcaoCompetencia = typeof autopercepcoesCompetencias.$inferSelect;
export type InsertAutopercepcaoCompetencia = typeof autopercepcoesCompetencias.$inferInsert;

/**
 * Contribuições da Mentora ao Relatório de Autoconhecimento
 * A mentora pode adicionar observações/complementos ao relatório do aluno
 */
export const mentoraContribuicoes = mysqlTable("mentora_contribuicoes", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("alunoId").notNull(), // FK para alunos
  consultorId: int("consultorId").notNull(), // FK para consultors (mentora)
  tipo: mysqlEnum("tipo", ["disc", "competencia", "geral"]).notNull(), // Tipo de contribuição
  competenciaId: int("competenciaId"), // FK para competencias (null se tipo = disc ou geral)
  conteudo: text("conteudo").notNull(), // Texto da contribuição da mentora
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MentoraContribuicao = typeof mentoraContribuicoes.$inferSelect;
export type InsertMentoraContribuicao = typeof mentoraContribuicoes.$inferInsert;


/**
 * In-App Notifications - Notificações internas do sistema (sino/badge)
 * Cada notificação é direcionada a um usuário específico
 */
export const inAppNotifications = mysqlTable("in_app_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK para users
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "warning", "success", "action"]).default("info").notNull(),
  category: varchar("category", { length: 100 }), // Ex: "assessment", "mentoria", "evento", "sistema"
  link: varchar("link", { length: 512 }), // Link para navegar ao clicar
  isRead: int("isRead").default(0).notNull(), // 0 = não lida, 1 = lida
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InAppNotification = typeof inAppNotifications.$inferSelect;
export type InsertInAppNotification = typeof inAppNotifications.$inferInsert;

/**
 * Courses - Cursos disponíveis para os alunos
 * Fase 1: Cursos gratuitos com link para YouTube/externos
 * Preparado para futuro: cursos pagos online e presenciais
 */
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 500 }).notNull(),
  descricao: text("descricao"),
  categoria: varchar("categoria", { length: 255 }), // Ex: Liderança, Comunicação, Gestão, etc.
  competenciaRelacionada: varchar("competenciaRelacionada", { length: 255 }), // Competência vinculada (opcional)
  tipo: mysqlEnum("tipo", ["gratuito", "online_pago", "presencial"]).default("gratuito").notNull(),
  youtubeUrl: varchar("youtubeUrl", { length: 500 }), // Link do YouTube (para cursos gratuitos)
  thumbnailUrl: text("thumbnailUrl"), // URL da thumbnail (auto-extraída do YouTube ou upload)
  duracao: varchar("duracao", { length: 100 }), // Ex: "2h30", "45min", "8 aulas"
  instrutor: varchar("instrutor", { length: 255 }), // Nome do instrutor/canal
  nivel: mysqlEnum("nivel", ["iniciante", "intermediario", "avancado"]).default("iniciante"),
  programId: int("programId"), // Empresa específica ou null para todos
  isActive: int("isActive").default(1).notNull(),
  ordem: int("ordem").default(0).notNull(), // Para ordenação manual
  createdBy: int("createdBy").notNull(), // FK para users (admin que criou)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

/**
 * Activities - Atividades Extras (workshops, treinamentos presenciais, eventos)
 * Convites para participação dos alunos com sistema de inscrição
 */
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 500 }).notNull(),
  descricao: text("descricao"),
  tipo: mysqlEnum("tipo", ["workshop", "treinamento", "palestra", "evento", "outro"]).default("workshop").notNull(),
  modalidade: mysqlEnum("modalidade", ["presencial", "online", "hibrido"]).default("presencial").notNull(),
  dataInicio: timestamp("dataInicio"), // Data e hora de início
  dataFim: timestamp("dataFim"), // Data e hora de fim (opcional)
  local: varchar("local", { length: 500 }), // Endereço ou link da sala virtual
  vagas: int("vagas"), // Número máximo de vagas (null = ilimitado)
  instrutor: varchar("instrutor", { length: 255 }),
  imagemUrl: text("imagemUrl"), // Imagem de capa do evento
  competenciaRelacionada: varchar("competenciaRelacionada", { length: 255 }),
  programId: int("programId"), // Empresa específica ou null para todos
  isActive: int("isActive").default(1).notNull(),
  ordem: int("ordem").default(0).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

/**
 * Activity Registrations - Inscrições dos alunos nas atividades extras
 */
export const activityRegistrations = mysqlTable("activity_registrations", {
  id: int("id").autoincrement().primaryKey(),
  activityId: int("activityId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["inscrito", "confirmado", "cancelado", "presente", "ausente"]).default("inscrito").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ActivityRegistration = typeof activityRegistrations.$inferSelect;
export type InsertActivityRegistration = typeof activityRegistrations.$inferInsert;

/**
 * Activity Turmas - Vinculação muitos-para-muitos entre atividades e turmas
 * Se uma atividade não tiver turmas vinculadas, ela é visível para todos
 */
export const activityTurmas = mysqlTable("activity_turmas", {
  id: int("id").autoincrement().primaryKey(),
  activityId: int("activityId").notNull(),
  turmaId: int("turmaId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ActivityTurma = typeof activityTurmas.$inferSelect;
export type InsertActivityTurma = typeof activityTurmas.$inferInsert;

/**
 * Precificação Flexível de Sessões do Mentor
 * Permite definir valores diferentes por número de sessão (individual ou agrupado)
 * Ex: Sessões 1-4 = R$100, Sessão 5 = R$150, Sessões 6-12 = R$120
 * O campo valorSessao na tabela consultors serve como valor padrão (fallback)
 */
export const mentorSessionPricing = mysqlTable("mentor_session_pricing", {
  id: int("id").autoincrement().primaryKey(),
  consultorId: int("consultorId").notNull(), // FK para consultors
  sessionFrom: int("sessionFrom").notNull(), // Número da sessão inicial (ex: 1)
  sessionTo: int("sessionTo").notNull(), // Número da sessão final (ex: 4) — igual a sessionFrom se individual
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(), // Valor em R$
  descricao: varchar("descricao", { length: 255 }), // Descrição opcional (ex: "Sessões iniciais")
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MentorSessionPricing = typeof mentorSessionPricing.$inferSelect;
export type InsertMentorSessionPricing = typeof mentorSessionPricing.$inferInsert;


/**
 * Disponibilidade por Data Específica do Mentor
 * Permite que o mentor adicione datas avulsas de disponibilidade (além dos dias da semana recorrentes)
 * Ex: "Disponível dia 20/03/2026 das 09:00 às 10:00"
 */
export const mentorDateAvailability = mysqlTable("mentor_date_availability", {
  id: int("id").autoincrement().primaryKey(),
  consultorId: int("consultorId").notNull(), // FK para consultors
  specificDate: varchar("specificDate", { length: 10 }).notNull(), // "2026-03-20" formato YYYY-MM-DD
  startTime: varchar("startTime", { length: 5 }).notNull(), // "09:00"
  endTime: varchar("endTime", { length: 5 }).notNull(), // "10:00"
  slotDurationMinutes: int("slotDurationMinutes").default(60).notNull(),
  googleMeetLink: varchar("googleMeetLink", { length: 500 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MentorDateAvailability = typeof mentorDateAvailability.$inferSelect;
export type InsertMentorDateAvailability = typeof mentorDateAvailability.$inferInsert;

/**
 * Log de Alertas de Mentoria enviados por e-mail
 * Controla quais alertas já foram enviados para evitar duplicatas
 */
export const emailAlertasLog = mysqlTable("email_alertas_log", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("alunoId").notNull(),
  consultorId: int("consultorId").notNull(), // Mentor atual do aluno no momento do envio
  tipoAlerta: varchar("tipoAlerta", { length: 50 }).notNull(), // "mentoria_30dias"
  diasSemSessao: int("diasSemSessao").notNull(),
  emailEnviado: int("emailEnviado").default(1).notNull(), // 1 = enviado, 0 = falhou
  erro: text("erro"), // Mensagem de erro se falhou
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailAlertaLog = typeof emailAlertasLog.$inferSelect;
export type InsertEmailAlertaLog = typeof emailAlertasLog.$inferInsert;


/**
 * Onboarding Jornada - Rastreamento das etapas 6, 7 e 8 do onboarding
 * Etapa 6: Visualização do PDI
 * Etapa 7: Vídeos da jornada (boas-vindas + 4 temáticos)
 * Etapa 8: Aceite formal do PDI
 */
export const onboardingJornada = mysqlTable("onboarding_jornada", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("alunoId").notNull(),
  ciclo: int("ciclo").default(1).notNull(), // Número do ciclo de onboarding (1 = primeiro, 2 = renovação, etc.)
  // Etapa 1 - Cadastro confirmado pelo aluno
  cadastroConfirmado: int("cadastroConfirmado").default(0).notNull(), // 1 = aluno revisou e confirmou seus dados
  cadastroConfirmadoEm: timestamp("cadastroConfirmadoEm"),
  // Etapa 6 - Meu PDI
  pdiVisualizado: int("pdiVisualizado").default(0).notNull(), // 1 = visualizou o PDI
  pdiVisualizadoEm: timestamp("pdiVisualizadoEm"),
  // Etapa 7 - Sua Jornada (vídeos)
  videoBoasVindas: int("videoBoasVindas").default(0).notNull(), // 1 = assistiu
  videoCompetencias: int("videoCompetencias").default(0).notNull(),
  videoWebinars: int("videoWebinars").default(0).notNull(),
  videoTarefas: int("videoTarefas").default(0).notNull(),
  videoMetas: int("videoMetas").default(0).notNull(),
  todosVideosEm: timestamp("todosVideosEm"), // quando completou todos
  // Etapa 8 - Aceite e Início
  aceiteRealizado: int("aceiteRealizado").default(0).notNull(), // 1 = aceitou
  aceiteRealizadoEm: timestamp("aceiteRealizadoEm"),
  nomeAceite: varchar("nomeAceite", { length: 255 }), // Nome digitado no aceite
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OnboardingJornada = typeof onboardingJornada.$inferSelect;
export type InsertOnboardingJornada = typeof onboardingJornada.$inferInsert;

/**
 * Configuração dos vídeos do onboarding (admin pode alterar URLs)
 */
export const onboardingVideos = mysqlTable("onboarding_videos", {
  id: int("id").autoincrement().primaryKey(),
  chave: varchar("chave", { length: 50 }).notNull().unique(), // boas_vindas, competencias, webinars, tarefas, metas
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  videoUrl: text("videoUrl"), // URL do YouTube/Vimeo
  thumbnailUrl: text("thumbnailUrl"),
  ordem: int("ordem").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OnboardingVideo = typeof onboardingVideos.$inferSelect;
export type InsertOnboardingVideo = typeof onboardingVideos.$inferInsert;


/**
 * Solicitações de revisão do PDI feitas pelo aluno durante o onboarding (Etapa 8 - "Gostaria de Rever")
 * Registra cada solicitação com justificativa, status e resposta da mentora/admin
 */
export const onboardingRevisoes = mysqlTable("onboarding_revisoes", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("alunoId").notNull(),
  justificativa: text("justificativa").notNull(), // Texto do aluno explicando o que gostaria de rever
  status: mysqlEnum("status", ["pendente", "em_analise", "resolvida", "cancelada"]).default("pendente").notNull(),
  respostaAdmin: text("respostaAdmin"), // Resposta da mentora/admin
  resolvidoPor: int("resolvidoPor"), // userId de quem resolveu
  resolvidoEm: timestamp("resolvidoEm"),
  emailEnviado: int("emailEnviado").default(0).notNull(), // 1 = email enviado com sucesso
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OnboardingRevisao = typeof onboardingRevisoes.$inferSelect;
export type InsertOnboardingRevisao = typeof onboardingRevisoes.$inferInsert;
