import {
  date,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Programa de Integração (Onboarding/Crossboarding/Offboarding).
 *
 * Módulo isolado e aditivo: estas tabelas não substituem onboarding_jornada,
 * PDI, avaliações, cursos ou usuários existentes no EcoLíder.
 */
export const programaIntegracaoProcessos = mysqlTable(
  "programa_integracao_processos",
  {
    id: int("id").autoincrement().primaryKey(),
    legacyId: varchar("legacyId", { length: 100 }),
    alunoId: int("alunoId"),
    ordem: int("ordem").notNull().default(0),

    nome: varchar("nome", { length: 255 }).notNull(),
    cpf: varchar("cpf", { length: 20 }),
    nasc: date("nasc", { mode: "string" }),
    email: varchar("email", { length: 320 }),
    emailCorporativo: varchar("emailCorporativo", { length: 320 }),
    tel: varchar("tel", { length: 40 }),
    cargo: varchar("cargo", { length: 255 }),
    unidade: varchar("unidade", { length: 120 }),
    tipo: varchar("tipo", { length: 50 }).notNull().default("Onboarding"),
    inicio: date("inicio", { mode: "string" }).notNull(),
    participacao: varchar("participacao", { length: 80 }).default("Presencial"),
    situacao: varchar("situacao", { length: 40 }).notNull().default("ativo"),

    gestor: varchar("gestor", { length: 255 }),
    gestorEmail: varchar("gestorEmail", { length: 320 }),
    gestorTel: varchar("gestorTel", { length: 40 }),
    anjo: varchar("anjo", { length: 255 }),
    anjoEmail: varchar("anjoEmail", { length: 320 }),
    consultora: varchar("consultora", { length: 255 }),
    mentorLegacyId: varchar("mentorLegacyId", { length: 100 }),
    ugp: varchar("ugp", { length: 255 }),
    horarios: text("horarios"),

    statusPdi: varchar("statusPdi", { length: 255 }),
    pendencias: text("pendencias"),
    statusCursos: varchar("statusCursos", { length: 255 }),
    consideracoes: text("consideracoes"),
    notas: text("notas"),
    cor: varchar("cor", { length: 20 }),

    // Estado dinâmico do processo: feito, alinhamentos, bem e teste.
    // Mantém a semântica do módulo original sem criar dezenas de tabelas artificiais.
    estado: json("estado").notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    legacyUnique: uniqueIndex("uq_pi_processos_legacy").on(table.legacyId),
    alunoIdx: index("idx_pi_processos_aluno").on(table.alunoId),
    cpfIdx: index("idx_pi_processos_cpf").on(table.cpf),
    emailIdx: index("idx_pi_processos_email").on(table.email),
    nomeInicioIdx: index("idx_pi_processos_nome_inicio").on(table.nome, table.inicio),
    situacaoIdx: index("idx_pi_processos_situacao").on(table.situacao),
  }),
);

export const programaIntegracaoRespostas = mysqlTable(
  "programa_integracao_respostas",
  {
    id: int("id").autoincrement().primaryKey(),
    processoId: int("processoId"),
    legacyRid: varchar("legacyRid", { length: 100 }),
    protocolo: varchar("protocolo", { length: 40 }),
    dedupeKey: varchar("dedupeKey", { length: 255 }),

    formKey: varchar("formKey", { length: 30 }).notNull(),
    ciclo: int("ciclo").notNull().default(0),
    papel: varchar("papel", { length: 40 }),
    itemId: varchar("itemId", { length: 40 }),
    formVersion: int("formVersion").notNull().default(1),

    statusVinculo: mysqlEnum("statusVinculo", ["vinculada", "pendente", "descartada"])
      .notNull()
      .default("pendente"),
    statusResposta: varchar("statusResposta", { length: 40 }),
    motivoPendencia: varchar("motivoPendencia", { length: 120 }),
    candidatos: json("candidatos"),

    nomeColaborador: varchar("nomeColaborador", { length: 255 }),
    unidade: varchar("unidade", { length: 120 }),
    dataInicio: date("dataInicio", { mode: "string" }),
    emailColaborador: varchar("emailColaborador", { length: 320 }),
    nomeOrig: varchar("nomeOrig", { length: 255 }),
    avaliador: varchar("avaliador", { length: 255 }),
    respondentName: varchar("respondentName", { length: 255 }),
    respondentEmail: varchar("respondentEmail", { length: 320 }),

    source: mysqlEnum("source", ["publico", "importacao", "admin"]).notNull().default("publico"),
    media: decimal("media", { precision: 6, scale: 2 }),
    alertas: json("alertas"),
    answers: json("answers").notNull(),
    colunasOriginais: json("colunasOriginais"),
    quandoOriginal: varchar("quandoOriginal", { length: 80 }),
    emOriginal: varchar("emOriginal", { length: 30 }),
    submittedAt: timestamp("submittedAt").defaultNow().notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    legacyUnique: uniqueIndex("uq_pi_respostas_legacy").on(table.legacyRid),
    protocoloUnique: uniqueIndex("uq_pi_respostas_protocolo").on(table.protocolo),
    dedupeUnique: uniqueIndex("uq_pi_respostas_dedupe").on(table.dedupeKey),
    processoIdx: index("idx_pi_respostas_processo").on(table.processoId),
    filaIdx: index("idx_pi_respostas_fila").on(table.statusVinculo, table.createdAt),
    formIdx: index("idx_pi_respostas_form").on(table.formKey, table.ciclo, table.papel),
    identificacaoIdx: index("idx_pi_respostas_identificacao").on(table.nomeColaborador, table.dataInicio),
  }),
);

export const programaIntegracaoConfig = mysqlTable("programa_integracao_config", {
  chave: varchar("chave", { length: 100 }).primaryKey(),
  valor: json("valor").notNull(),
  updatedByUserId: int("updatedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const programaIntegracaoAuditoria = mysqlTable(
  "programa_integracao_auditoria",
  {
    id: int("id").autoincrement().primaryKey(),
    processoId: int("processoId"),
    respostaId: int("respostaId"),
    userId: int("userId"),
    acao: varchar("acao", { length: 120 }).notNull(),
    detalhe: text("detalhe"),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    processoIdx: index("idx_pi_auditoria_processo").on(table.processoId, table.createdAt),
    respostaIdx: index("idx_pi_auditoria_resposta").on(table.respostaId, table.createdAt),
  }),
);

export type ProgramaIntegracaoProcesso = typeof programaIntegracaoProcessos.$inferSelect;
export type InsertProgramaIntegracaoProcesso = typeof programaIntegracaoProcessos.$inferInsert;
export type ProgramaIntegracaoResposta = typeof programaIntegracaoRespostas.$inferSelect;
export type InsertProgramaIntegracaoResposta = typeof programaIntegracaoRespostas.$inferInsert;
