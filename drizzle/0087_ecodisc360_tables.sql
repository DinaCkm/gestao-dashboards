-- ============================================================
-- EcoDISC 360 - Aderência Pessoa x Cargo x Cultura
-- Fase 1: tabelas principais do módulo (prefixo disc_)
-- Não altera nenhuma tabela existente.
--
-- NOTA TÉCNICA (decisão de implementação):
-- Esta migration foi escrita manualmente, e NÃO deve ser regerada via
-- `pnpm db:generate`. Motivo: os snapshots em drizzle/meta/ estão
-- desatualizados (o último snapshot corresponde à migration 0075), mas o
-- histórico de migrations do projeto já avançou manualmente até a 0086
-- (ex.: 0085_ps_emails_relatorio.sql, 0086_ps_em_analise.sql). Rodar
-- db:generate nesse estado faria o drizzle-kit comparar o schema.ts atual
-- contra um snapshot desatualizado, gerando uma migration gigante tentando
-- reconciliar todas as mudanças de 0076 a 0086 junto com o EcoDISC 360.
-- Para evitar esse risco, o SQL abaixo foi escrito seguindo manualmente o
-- mesmo padrão das migrations manuais recentes do repositório (mesmo
-- formato de CREATE TABLE, mesmos tipos, `--> statement-breakpoint`), e o
-- journal (drizzle/meta/_journal.json) foi atualizado à mão com a entrada
-- correspondente (idx 80, tag 0087_ecodisc360_tables).
-- Antes de sincronizar os snapshots do Drizzle no futuro, revisar com
-- cuidado para não perder/duplicar as migrations manuais 0085-0087.
-- ============================================================

CREATE TABLE `disc_assessments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `programId` int NOT NULL,
  `alunoId` int,
  `cargoProfileId` int,
  `orgProfileId` int,
  `assessmentType` enum('empregado','cargo','empresa','diretoria') NOT NULL,
  `respondedByUserId` int,
  `status` enum('rascunho','concluido','arquivado') NOT NULL DEFAULT 'rascunho',
  `scores` json,
  `rawScores` json,
  `perfilPredominante` enum('D','I','S','C'),
  `perfilSecundario` enum('D','I','S','C'),
  `indiceConsistencia` decimal(5,2),
  `alertaBaixaDiferenciacao` boolean DEFAULT false,
  `completedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `disc_assessments_id` PRIMARY KEY(`id`),
  KEY `idx_disc_assessments_programId` (`programId`),
  KEY `idx_disc_assessments_alunoId` (`alunoId`),
  KEY `idx_disc_assessments_assessmentType` (`assessmentType`),
  KEY `idx_disc_assessments_cargoProfileId` (`cargoProfileId`),
  KEY `idx_disc_assessments_orgProfileId` (`orgProfileId`)
);
--> statement-breakpoint
CREATE TABLE `disc_assessment_answers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `assessmentId` int NOT NULL,
  `blocoIndex` int NOT NULL,
  `maisId` varchar(20) NOT NULL,
  `menosId` varchar(20) NOT NULL,
  `maisDimensao` enum('D','I','S','C') NOT NULL,
  `menosDimensao` enum('D','I','S','C') NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `disc_assessment_answers_id` PRIMARY KEY(`id`),
  UNIQUE KEY `uq_disc_answers_assessment_bloco` (`assessmentId`,`blocoIndex`),
  KEY `idx_disc_answers_assessmentId` (`assessmentId`)
);
--> statement-breakpoint
CREATE TABLE `disc_role_profiles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `programId` int NOT NULL,
  `departmentId` int,
  `cargoNome` varchar(255) NOT NULL,
  `cargoCodigo` varchar(50),
  `leaderUserId` int,
  `createdByUserId` int,
  `expectedScores` json,
  `perfilEsperado` varchar(10),
  `nivelAutonomia` enum('baixo','medio','alto'),
  `nivelPressao` enum('baixo','medio','alto'),
  `necessidadeRelacionamento` enum('baixa','media','alta'),
  `necessidadeAnaliseTecnica` enum('baixa','media','alta'),
  `necessidadeRotinaProcesso` enum('baixa','media','alta'),
  `descricao` text,
  `isActive` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `disc_role_profiles_id` PRIMARY KEY(`id`),
  KEY `idx_disc_role_profiles_programId` (`programId`),
  KEY `idx_disc_role_profiles_departmentId` (`departmentId`)
);
--> statement-breakpoint
CREATE TABLE `disc_org_profiles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `programId` int NOT NULL,
  `departmentId` int,
  `profileType` enum('empresa','diretoria') NOT NULL,
  `profileName` varchar(255) NOT NULL,
  `expectedScores` json,
  `perfilDesejado` varchar(10),
  `culturalDescription` text,
  `competenciasValorizadas` json,
  `approvedByUserId` int,
  `isActive` int NOT NULL DEFAULT 1,
  `validFrom` date,
  `validTo` date,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `disc_org_profiles_id` PRIMARY KEY(`id`),
  KEY `idx_disc_org_profiles_programId` (`programId`),
  KEY `idx_disc_org_profiles_departmentId` (`departmentId`),
  KEY `idx_disc_org_profiles_profileType` (`profileType`)
);
--> statement-breakpoint
CREATE TABLE `disc_matches` (
  `id` int AUTO_INCREMENT NOT NULL,
  `programId` int NOT NULL,
  `alunoId` int NOT NULL,
  `employeeAssessmentId` int NOT NULL,
  `cargoProfileId` int,
  `orgProfileId` int,
  `matchEmployeeRole` decimal(5,2),
  `matchEmployeeOrg` decimal(5,2),
  `matchRoleOrg` decimal(5,2),
  `matchOverall` decimal(5,2),
  `classificationEmployeeRole` enum('alto','bom','medio','baixo','desalinhado'),
  `classificationEmployeeOrg` enum('alto','bom','medio','baixo','desalinhado'),
  `classificationRoleOrg` enum('alto','bom','medio','baixo','desalinhado'),
  `classificationOverall` enum('alto','bom','medio','baixo','desalinhado'),
  `strengths` json,
  `gaps` json,
  `risks` json,
  `recommendations` json,
  `calculatedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `disc_matches_id` PRIMARY KEY(`id`),
  KEY `idx_disc_matches_programId` (`programId`),
  KEY `idx_disc_matches_alunoId` (`alunoId`),
  KEY `idx_disc_matches_employeeAssessmentId` (`employeeAssessmentId`),
  KEY `idx_disc_matches_cargoProfileId` (`cargoProfileId`),
  KEY `idx_disc_matches_orgProfileId` (`orgProfileId`),
  KEY `idx_disc_matches_matchOverall` (`matchOverall`)
);
--> statement-breakpoint
CREATE TABLE `disc_generated_reports` (
  `id` int AUTO_INCREMENT NOT NULL,
  `programId` int NOT NULL,
  `alunoId` int,
  `departmentId` int,
  `assessmentId` int,
  `matchId` int,
  `reportType` enum('individual','cargo','empresa','diretoria','match','integrado','gerencial','matriz') NOT NULL,
  `fileUrl` text,
  `generatedByUserId` int,
  `generatedAt` timestamp NOT NULL DEFAULT (now()),
  `version` varchar(20),
  `status` enum('ativo','arquivado','substituido') NOT NULL DEFAULT 'ativo',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `disc_generated_reports_id` PRIMARY KEY(`id`),
  KEY `idx_disc_reports_programId` (`programId`),
  KEY `idx_disc_reports_alunoId` (`alunoId`),
  KEY `idx_disc_reports_departmentId` (`departmentId`),
  KEY `idx_disc_reports_reportType` (`reportType`)
);
