CREATE TABLE `meta_acompanhamento` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metaId` int NOT NULL,
	`alunoId` int NOT NULL,
	`mes` int NOT NULL,
	`ano` int NOT NULL,
	`status` enum('cumprida','nao_cumprida','parcial') NOT NULL,
	`observacao` text,
	`registradoPor` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meta_acompanhamento_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`assessmentCompetenciaId` int NOT NULL,
	`competenciaId` int NOT NULL,
	`assessmentPdiId` int NOT NULL,
	`taskLibraryId` int,
	`titulo` varchar(500) NOT NULL,
	`descricao` text,
	`definidaPor` int,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `metas_id` PRIMARY KEY(`id`)
);
