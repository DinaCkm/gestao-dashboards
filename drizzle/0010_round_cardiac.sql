CREATE TABLE `ciclo_competencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cicloId` int NOT NULL,
	`competenciaId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ciclo_competencias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ciclos_execucao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`nomeCiclo` varchar(255) NOT NULL,
	`dataInicio` date NOT NULL,
	`dataFim` date NOT NULL,
	`definidoPor` int,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ciclos_execucao_id` PRIMARY KEY(`id`)
);
