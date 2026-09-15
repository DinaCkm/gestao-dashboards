-- ============================================================================
-- 0100_programa_integracao.sql
-- Programa de Integração — estrutura isolada e aditiva.
--
-- IMPORTANTE:
-- - Não altera, renomeia ou remove nenhuma tabela existente.
-- - Não toca em users, alunos, PDI, avaliações, cursos ou onboarding_jornada.
-- - Execução deve ser manual/controlada após backup de produção confirmado.
-- ============================================================================

CREATE TABLE `programa_integracao_processos` (
  `id` int AUTO_INCREMENT NOT NULL,
  `legacyId` varchar(100),
  `alunoId` int,
  `ordem` int NOT NULL DEFAULT 0,
  `nome` varchar(255) NOT NULL,
  `cpf` varchar(20),
  `nasc` date,
  `email` varchar(320),
  `emailCorporativo` varchar(320),
  `tel` varchar(40),
  `cargo` varchar(255),
  `unidade` varchar(120),
  `tipo` varchar(50) NOT NULL DEFAULT 'Onboarding',
  `inicio` date NOT NULL,
  `participacao` varchar(80) DEFAULT 'Presencial',
  `situacao` varchar(40) NOT NULL DEFAULT 'ativo',
  `gestor` varchar(255),
  `gestorEmail` varchar(320),
  `gestorTel` varchar(40),
  `anjo` varchar(255),
  `anjoEmail` varchar(320),
  `consultora` varchar(255),
  `mentorLegacyId` varchar(100),
  `ugp` varchar(255),
  `horarios` text,
  `statusPdi` varchar(255),
  `pendencias` text,
  `statusCursos` varchar(255),
  `consideracoes` text,
  `notas` text,
  `cor` varchar(20),
  `estado` json NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `programa_integracao_processos_id` PRIMARY KEY (`id`),
  CONSTRAINT `uq_pi_processos_legacy` UNIQUE (`legacyId`)
);
--> statement-breakpoint
CREATE INDEX `idx_pi_processos_aluno` ON `programa_integracao_processos` (`alunoId`);
--> statement-breakpoint
CREATE INDEX `idx_pi_processos_cpf` ON `programa_integracao_processos` (`cpf`);
--> statement-breakpoint
CREATE INDEX `idx_pi_processos_email` ON `programa_integracao_processos` (`email`);
--> statement-breakpoint
CREATE INDEX `idx_pi_processos_nome_inicio` ON `programa_integracao_processos` (`nome`, `inicio`);
--> statement-breakpoint
CREATE INDEX `idx_pi_processos_situacao` ON `programa_integracao_processos` (`situacao`);
--> statement-breakpoint

CREATE TABLE `programa_integracao_respostas` (
  `id` int AUTO_INCREMENT NOT NULL,
  `processoId` int,
  `legacyRid` varchar(100),
  `protocolo` varchar(40),
  `dedupeKey` varchar(255),
  `formKey` varchar(30) NOT NULL,
  `ciclo` int NOT NULL DEFAULT 0,
  `papel` varchar(40),
  `itemId` varchar(40),
  `formVersion` int NOT NULL DEFAULT 1,
  `statusVinculo` enum('vinculada','pendente','descartada') NOT NULL DEFAULT 'pendente',
  `statusResposta` varchar(40),
  `motivoPendencia` varchar(120),
  `candidatos` json,
  `nomeColaborador` varchar(255),
  `unidade` varchar(120),
  `dataInicio` date,
  `emailColaborador` varchar(320),
  `nomeOrig` varchar(255),
  `avaliador` varchar(255),
  `respondentName` varchar(255),
  `respondentEmail` varchar(320),
  `source` enum('publico','importacao','admin') NOT NULL DEFAULT 'publico',
  `media` decimal(6,2),
  `alertas` json,
  `answers` json NOT NULL,
  `colunasOriginais` json,
  `quandoOriginal` varchar(80),
  `emOriginal` varchar(30),
  `submittedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `programa_integracao_respostas_id` PRIMARY KEY (`id`),
  CONSTRAINT `uq_pi_respostas_legacy` UNIQUE (`legacyRid`),
  CONSTRAINT `uq_pi_respostas_protocolo` UNIQUE (`protocolo`),
  CONSTRAINT `uq_pi_respostas_dedupe` UNIQUE (`dedupeKey`)
);
--> statement-breakpoint
CREATE INDEX `idx_pi_respostas_processo` ON `programa_integracao_respostas` (`processoId`);
--> statement-breakpoint
CREATE INDEX `idx_pi_respostas_fila` ON `programa_integracao_respostas` (`statusVinculo`, `createdAt`);
--> statement-breakpoint
CREATE INDEX `idx_pi_respostas_form` ON `programa_integracao_respostas` (`formKey`, `ciclo`, `papel`);
--> statement-breakpoint
CREATE INDEX `idx_pi_respostas_identificacao` ON `programa_integracao_respostas` (`nomeColaborador`, `dataInicio`);
--> statement-breakpoint

CREATE TABLE `programa_integracao_config` (
  `chave` varchar(100) NOT NULL,
  `valor` json NOT NULL,
  `updatedByUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `programa_integracao_config_chave` PRIMARY KEY (`chave`)
);
--> statement-breakpoint

CREATE TABLE `programa_integracao_auditoria` (
  `id` int AUTO_INCREMENT NOT NULL,
  `processoId` int,
  `respostaId` int,
  `userId` int,
  `acao` varchar(120) NOT NULL,
  `detalhe` text,
  `metadata` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `programa_integracao_auditoria_id` PRIMARY KEY (`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_pi_auditoria_processo` ON `programa_integracao_auditoria` (`processoId`, `createdAt`);
--> statement-breakpoint
CREATE INDEX `idx_pi_auditoria_resposta` ON `programa_integracao_auditoria` (`respostaId`, `createdAt`);
