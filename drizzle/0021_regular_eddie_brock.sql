CREATE TABLE `contratos_aluno` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`programId` int NOT NULL,
	`turmaId` int,
	`periodoInicio` date NOT NULL,
	`periodoTermino` date NOT NULL,
	`totalSessoesContratadas` int NOT NULL,
	`observacoes` text,
	`criadoPor` int,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contratos_aluno_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `historico_nivel_competencia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentCompetenciaId` int NOT NULL,
	`alunoId` int NOT NULL,
	`nivelAnterior` decimal(5,2),
	`nivelNovo` decimal(5,2) NOT NULL,
	`atualizadoPor` int,
	`sessaoReferencia` int,
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `historico_nivel_competencia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assessment_competencias` ADD `nivelAtual` decimal(5,2);--> statement-breakpoint
ALTER TABLE `assessment_competencias` ADD `metaFinal` decimal(5,2);--> statement-breakpoint
ALTER TABLE `assessment_competencias` ADD `justificativa` text;--> statement-breakpoint
ALTER TABLE `mentoring_sessions` ADD `isAssessment` int DEFAULT 0 NOT NULL;