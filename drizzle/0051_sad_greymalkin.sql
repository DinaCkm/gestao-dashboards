CREATE TABLE `onboarding_jornada` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`pdiVisualizado` int NOT NULL DEFAULT 0,
	`pdiVisualizadoEm` timestamp,
	`videoBoasVindas` int NOT NULL DEFAULT 0,
	`videoCompetencias` int NOT NULL DEFAULT 0,
	`videoWebinars` int NOT NULL DEFAULT 0,
	`videoTarefas` int NOT NULL DEFAULT 0,
	`videoMetas` int NOT NULL DEFAULT 0,
	`todosVideosEm` timestamp,
	`aceiteRealizado` int NOT NULL DEFAULT 0,
	`aceiteRealizadoEm` timestamp,
	`nomeAceite` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_jornada_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chave` varchar(50) NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`videoUrl` text,
	`thumbnailUrl` text,
	`ordem` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_videos_id` PRIMARY KEY(`id`),
	CONSTRAINT `onboarding_videos_chave_unique` UNIQUE(`chave`)
);
