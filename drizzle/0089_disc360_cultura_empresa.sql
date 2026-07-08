-- ============================================================
-- EcoDISC 360 - Ajuste de modelagem: Cultura da Empresa e Diretor
-- individual (Fase 2.1)
--
-- Contexto: o conceito do modulo foi refinado para separar
-- claramente Empresa, Diretoria, Cargo, Diretor e Colaborador.
-- O Perfil DISC da Empresa passa a poder ser calculado por
-- questionario de cultura (varios respondentes) ou preenchido
-- manualmente. O Perfil DISC da Diretoria passa a ser calculado
-- a partir dos DISC individuais dos diretores (que agora tem um
-- tipo proprio de avaliacao: "diretor"). Respondentes do
-- questionario de cultura podem nao ter conta no sistema, por
-- isso os campos respondentName/respondentEmail sao opcionais.
-- Nao altera o DISC legado nem nenhuma tabela fora do modulo disc_.
-- ============================================================

ALTER TABLE `disc_org_profiles` ADD COLUMN `origemPerfil` enum('manual','questionario');
--> statement-breakpoint
ALTER TABLE `disc_org_profiles` ADD COLUMN `statusConsistencia` enum('previa','suficiente');
--> statement-breakpoint
ALTER TABLE `disc_org_profiles` ADD COLUMN `totalRespondentes` int;
--> statement-breakpoint
ALTER TABLE `disc_assessments` MODIFY COLUMN `assessmentType` enum('empregado','cargo','empresa','diretoria','diretor') NOT NULL;
--> statement-breakpoint
ALTER TABLE `disc_assessments` ADD COLUMN `respondentName` varchar(255);
--> statement-breakpoint
ALTER TABLE `disc_assessments` ADD COLUMN `respondentEmail` varchar(320);
--> statement-breakpoint
CREATE TABLE `disc_culture_survey_answers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `assessmentId` int NOT NULL,
  `questionId` varchar(20) NOT NULL,
  `dimensaoEscolhida` enum('D','I','S','C') NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `disc_culture_survey_answers_id` PRIMARY KEY(`id`),
  KEY `idx_disc_culture_answers_assessmentId` (`assessmentId`)
);
