CREATE TABLE `autopercepcoes_competencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`competenciaId` int NOT NULL,
	`trilhaId` int NOT NULL,
	`nota` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `autopercepcoes_competencias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disc_respostas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`perguntaIndex` int NOT NULL,
	`dimensao` enum('D','I','S','C') NOT NULL,
	`resposta` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disc_respostas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disc_resultados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`scoreD` decimal(5,2) NOT NULL,
	`scoreI` decimal(5,2) NOT NULL,
	`scoreS` decimal(5,2) NOT NULL,
	`scoreC` decimal(5,2) NOT NULL,
	`perfilPredominante` enum('D','I','S','C') NOT NULL,
	`perfilSecundario` enum('D','I','S','C'),
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `disc_resultados_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mentora_contribuicoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`consultorId` int NOT NULL,
	`tipo` enum('disc','competencia','geral') NOT NULL,
	`competenciaId` int,
	`conteudo` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mentora_contribuicoes_id` PRIMARY KEY(`id`)
);
