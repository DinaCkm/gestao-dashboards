-- ============================================================
-- NIVELAMENTO DO BANCO DE PRODUCAO - EcoLider / EcoDISC 360
-- Gerado em 12/07/2026 | Idempotente (pode rodar 2x sem erro)
-- Compativel com MySQL 8+ e MariaDB
-- Parte 1: colunas antigas cujo auto-conserto falhava em prod
-- Parte 2: migrations 0088 a 0098 na ordem original
-- ============================================================

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='quantidadeFilhos')=0, 'ALTER TABLE `alunos` ADD COLUMN `quantidadeFilhos` int DEFAULT 0', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='expectativaMedioPrazo')=0, 'ALTER TABLE `alunos` ADD COLUMN `expectativaMedioPrazo` text', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='expectativaLongoPrazo')=0, 'ALTER TABLE `alunos` ADD COLUMN `expectativaLongoPrazo` text', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='estadoCivil')=0, 'ALTER TABLE `alunos` ADD COLUMN `estadoCivil` varchar(30)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='expectativaCurtoPrazo')=0, 'ALTER TABLE `alunos` ADD COLUMN `expectativaCurtoPrazo` text', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='formacaoSuperior')=0, 'ALTER TABLE `alunos` ADD COLUMN `formacaoSuperior` json', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='temFilhos')=0, 'ALTER TABLE `alunos` ADD COLUMN `temFilhos` tinyint(1) DEFAULT 0', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='posGraduacoes')=0, 'ALTER TABLE `alunos` ADD COLUMN `posGraduacoes` json', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='dataNascimento')=0, 'ALTER TABLE `alunos` ADD COLUMN `dataNascimento` date', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='tiktokUrl')=0, 'ALTER TABLE `alunos` ADD COLUMN `tiktokUrl` varchar(500)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='cursosExtracurriculares')=0, 'ALTER TABLE `alunos` ADD COLUMN `cursosExtracurriculares` json', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='tipoEquipeGerenciada')=0, 'ALTER TABLE `alunos` ADD COLUMN `tipoEquipeGerenciada` json', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='facebookUrl')=0, 'ALTER TABLE `alunos` ADD COLUMN `facebookUrl` varchar(500)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='experienciasAnteriores')=0, 'ALTER TABLE `alunos` ADD COLUMN `experienciasAnteriores` json', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='gerenciouOutrosLideres')=0, 'ALTER TABLE `alunos` ADD COLUMN `gerenciouOutrosLideres` tinyint(1) DEFAULT 0', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='instagramUrl')=0, 'ALTER TABLE `alunos` ADD COLUMN `instagramUrl` varchar(500)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='experienciaLideranca')=0, 'ALTER TABLE `alunos` ADD COLUMN `experienciaLideranca` tinyint(1) DEFAULT 0', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='linkedinUrl')=0, 'ALTER TABLE `alunos` ADD COLUMN `linkedinUrl` varchar(500)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='outraRedeUrl')=0, 'ALTER TABLE `alunos` ADD COLUMN `outraRedeUrl` varchar(500)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='curriculoUrl')=0, 'ALTER TABLE `alunos` ADD COLUMN `curriculoUrl` varchar(1000)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='mentor_appointments' AND COLUMN_NAME='googleEventId')=0, 'ALTER TABLE `mentor_appointments` ADD COLUMN `googleEventId` varchar(255)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='processos_seletivos' AND COLUMN_NAME='dataFim')=0, 'ALTER TABLE `processos_seletivos` ADD COLUMN `dataFim` date NULL COMMENT ''Data de encerramento do processo''', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='processos_seletivos' AND COLUMN_NAME='emailsRelatorio')=0, 'ALTER TABLE `processos_seletivos` ADD COLUMN `emailsRelatorio` text NULL COMMENT ''E-mails separados por vírgula para receber relatório do processo''', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='processos_seletivos' AND COLUMN_NAME='mentorId')=0, 'ALTER TABLE `processos_seletivos` ADD COLUMN `mentorId` int NULL COMMENT ''ID do mentor/selecionadora responsável''', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='processos_seletivos' AND COLUMN_NAME='comunicado')=0, 'ALTER TABLE `processos_seletivos` ADD COLUMN `comunicado` longtext NULL COMMENT ''Comunicado do processo em HTML (editor rico)''', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='processo_entrevistas' AND COLUMN_NAME='transcricaoUrl')=0, 'ALTER TABLE `processo_entrevistas` ADD COLUMN `transcricaoUrl` varchar(1000) NULL COMMENT ''URL S3 do arquivo de transcrição da entrevista''', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='processo_entrevistas' AND COLUMN_NAME='transcricaoNomeArquivo')=0, 'ALTER TABLE `processo_entrevistas` ADD COLUMN `transcricaoNomeArquivo` varchar(255) NULL COMMENT ''Nome original do arquivo de transcrição''', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='processo_entrevistas' AND COLUMN_NAME='participantesBanca')=0, 'ALTER TABLE `processo_entrevistas` ADD COLUMN `participantesBanca` text NULL COMMENT ''Nomes dos participantes da banca''', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='processo_entrevistas' AND COLUMN_NAME='dadosPrincipaisEntrevista')=0, 'ALTER TABLE `processo_entrevistas` ADD COLUMN `dadosPrincipaisEntrevista` longtext NULL COMMENT ''Dados principais gerados pela IA''', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='processo_entrevistas' AND COLUMN_NAME='analisePerfilComportamental')=0, 'ALTER TABLE `processo_entrevistas` ADD COLUMN `analisePerfilComportamental` longtext NULL COMMENT ''Análise do perfil comportamental gerada pela IA''', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='processo_entrevistas' AND COLUMN_NAME='relatorioGeradoEm')=0, 'ALTER TABLE `processo_entrevistas` ADD COLUMN `relatorioGeradoEm` datetime NULL COMMENT ''Quando o relatório foi gerado pela última vez''', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='processo_entrevistas' AND COLUMN_NAME='observacaoRevisao')=0, 'ALTER TABLE `processo_entrevistas` ADD COLUMN `observacaoRevisao` text NULL COMMENT ''Observação da mentora para refazer o relatório''', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='processo_resultados' AND COLUMN_NAME='participantesBanca')=0, 'ALTER TABLE `processo_resultados` ADD COLUMN `participantesBanca` text NULL COMMENT ''Nomes dos participantes da banca''', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='processos_seletivos' AND COLUMN_NAME='devolutivaIniciada')=0, 'ALTER TABLE `processos_seletivos` ADD COLUMN `devolutivaIniciada` int NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='processos_seletivos' AND COLUMN_NAME='devolutivaIniciadaEm')=0, 'ALTER TABLE `processos_seletivos` ADD COLUMN `devolutivaIniciadaEm` timestamp NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='processos_seletivos' AND COLUMN_NAME='devolutivaPrazoInicio')=0, 'ALTER TABLE `processos_seletivos` ADD COLUMN `devolutivaPrazoInicio` datetime NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='processos_seletivos' AND COLUMN_NAME='devolutivaPrazoFim')=0, 'ALTER TABLE `processos_seletivos` ADD COLUMN `devolutivaPrazoFim` datetime NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='atividades_curso' AND COLUMN_NAME='urlMidia')=0, 'ALTER TABLE `atividades_curso` ADD COLUMN `urlMidia` text NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='departments' AND COLUMN_NAME='programId')=0, 'ALTER TABLE `departments` ADD COLUMN `programId` int', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='departments' AND COLUMN_NAME='parentDepartmentId')=0, 'ALTER TABLE `departments` ADD COLUMN `parentDepartmentId` int', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='departments' AND COLUMN_NAME='isActive')=0, 'ALTER TABLE `departments` ADD COLUMN `isActive` int NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='departments' AND INDEX_NAME='idx_departments_programId')=0, 'CREATE INDEX `idx_departments_programId` ON `departments` (`programId`)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='departments' AND INDEX_NAME='idx_departments_parentDepartmentId')=0, 'CREATE INDEX `idx_departments_parentDepartmentId` ON `departments` (`parentDepartmentId`)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_org_profiles' AND COLUMN_NAME='origemPerfil')=0, 'ALTER TABLE `disc_org_profiles` ADD COLUMN `origemPerfil` enum(''manual'',''questionario'')', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_org_profiles' AND COLUMN_NAME='statusConsistencia')=0, 'ALTER TABLE `disc_org_profiles` ADD COLUMN `statusConsistencia` enum(''previa'',''suficiente'')', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_org_profiles' AND COLUMN_NAME='totalRespondentes')=0, 'ALTER TABLE `disc_org_profiles` ADD COLUMN `totalRespondentes` int', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

ALTER TABLE `disc_assessments` MODIFY COLUMN `assessmentType` enum('empregado','cargo','empresa','diretoria','diretor') NOT NULL;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_assessments' AND COLUMN_NAME='respondentName')=0, 'ALTER TABLE `disc_assessments` ADD COLUMN `respondentName` varchar(255)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_assessments' AND COLUMN_NAME='respondentEmail')=0, 'ALTER TABLE `disc_assessments` ADD COLUMN `respondentEmail` varchar(320)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

CREATE TABLE IF NOT EXISTS `disc_culture_survey_answers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `assessmentId` int NOT NULL,
  `questionId` varchar(20) NOT NULL,
  `dimensaoEscolhida` enum('D','I','S','C') NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `disc_culture_survey_answers_id` PRIMARY KEY(`id`),
  KEY `idx_disc_culture_answers_assessmentId` (`assessmentId`)
);

ALTER TABLE `disc_assessments` MODIFY COLUMN `assessmentType` enum('empregado','cargo','empresa','diretoria') NOT NULL;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND COLUMN_NAME='departmentId')=0, 'ALTER TABLE `alunos` ADD COLUMN `departmentId` int', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='alunos' AND INDEX_NAME='alunos_department_id_idx')=0, 'CREATE INDEX `alunos_department_id_idx` ON `alunos` (departmentId)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

ALTER TABLE disc_org_profiles MODIFY COLUMN origemPerfil enum('manual','questionario','grupo_diretores');

CREATE TABLE IF NOT EXISTS disc_diretoria_membros (
  id int AUTO_INCREMENT PRIMARY KEY,
  orgProfileId int NOT NULL,
  alunoId int NOT NULL,
  createdAt timestamp NOT NULL DEFAULT (now())
);

SET @s := IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_diretoria_membros' AND INDEX_NAME='disc_diretoria_membros_org_profile_id_idx')=0, 'CREATE INDEX `disc_diretoria_membros_org_profile_id_idx` ON `disc_diretoria_membros` (orgProfileId)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_diretoria_membros' AND INDEX_NAME='disc_diretoria_membros_unico_idx')=0, 'CREATE UNIQUE INDEX `disc_diretoria_membros_unico_idx` ON `disc_diretoria_membros` (`orgProfileId`, `alunoId`)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

CREATE TABLE IF NOT EXISTS cargos (
  id int AUTO_INCREMENT PRIMARY KEY,
  programId int NOT NULL,
  name varchar(255) NOT NULL,
  description text,
  isActive int NOT NULL DEFAULT 1,
  createdAt timestamp NOT NULL DEFAULT (now())
);

SET @s := IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cargos' AND INDEX_NAME='cargos_program_id_idx')=0, 'CREATE INDEX `cargos_program_id_idx` ON `cargos` (`programId`)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_assessments' AND COLUMN_NAME='conviteToken')=0, 'ALTER TABLE `disc_assessments` ADD COLUMN `conviteToken` VARCHAR(64) NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_assessments' AND INDEX_NAME='idx_disc_assessments_convite_token')=0, 'ALTER TABLE `disc_assessments` ADD UNIQUE INDEX `idx_disc_assessments_convite_token` (`conviteToken`)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

ALTER TABLE disc_assessments MODIFY COLUMN status ENUM('pendente','rascunho','concluido','arquivado') NOT NULL DEFAULT 'rascunho';

DELETE FROM disc_culture_survey_answers;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_culture_survey_answers' AND COLUMN_NAME='dimensaoEscolhida')>0, 'ALTER TABLE `disc_culture_survey_answers` DROP COLUMN `dimensaoEscolhida`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_culture_survey_answers' AND COLUMN_NAME='maisId')=0, 'ALTER TABLE `disc_culture_survey_answers` ADD COLUMN `maisId` VARCHAR(20) NOT NULL AFTER questionId', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_culture_survey_answers' AND COLUMN_NAME='menosId')=0, 'ALTER TABLE `disc_culture_survey_answers` ADD COLUMN `menosId` VARCHAR(20) NOT NULL AFTER maisId', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_culture_survey_answers' AND COLUMN_NAME='maisDimensao')=0, 'ALTER TABLE `disc_culture_survey_answers` ADD COLUMN `maisDimensao` ENUM(''D'',''I'',''S'',''C'') NOT NULL AFTER menosId', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_culture_survey_answers' AND COLUMN_NAME='menosDimensao')=0, 'ALTER TABLE `disc_culture_survey_answers` ADD COLUMN `menosDimensao` ENUM(''D'',''I'',''S'',''C'') NOT NULL AFTER maisDimensao', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_assessments' AND COLUMN_NAME='papelRespondente')=0, 'ALTER TABLE `disc_assessments` ADD COLUMN `papelRespondente` ENUM(''lider'',''empregado'') NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_assessments' AND COLUMN_NAME='respostaValidacaoDireta')=0, 'ALTER TABLE `disc_assessments` ADD COLUMN `respostaValidacaoDireta` INT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

CREATE TABLE IF NOT EXISTS disc_role_survey_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assessmentId INT NOT NULL,
  questionId VARCHAR(20) NOT NULL,
  maisId VARCHAR(20) NOT NULL,
  menosId VARCHAR(20) NOT NULL,
  maisDimensao ENUM('D','I','S','C') NOT NULL,
  menosDimensao ENUM('D','I','S','C') NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_assessments' AND COLUMN_NAME='respostaValidacaoDireta')>0, 'ALTER TABLE `disc_assessments` DROP COLUMN `respostaValidacaoDireta`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_assessments' AND COLUMN_NAME='respostaValidacaoD')=0, 'ALTER TABLE `disc_assessments` ADD COLUMN `respostaValidacaoD` INT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_assessments' AND COLUMN_NAME='respostaValidacaoI')=0, 'ALTER TABLE `disc_assessments` ADD COLUMN `respostaValidacaoI` INT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_assessments' AND COLUMN_NAME='respostaValidacaoS')=0, 'ALTER TABLE `disc_assessments` ADD COLUMN `respostaValidacaoS` INT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_assessments' AND COLUMN_NAME='respostaValidacaoC')=0, 'ALTER TABLE `disc_assessments` ADD COLUMN `respostaValidacaoC` INT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_org_profiles' AND COLUMN_NAME='empresaProfileId')=0, 'ALTER TABLE `disc_org_profiles` ADD COLUMN `empresaProfileId` int NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
