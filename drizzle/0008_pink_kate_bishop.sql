CREATE TABLE `plano_individual` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`competenciaId` int NOT NULL,
	`isObrigatoria` int NOT NULL DEFAULT 1,
	`notaAtual` decimal(5,2),
	`metaNota` decimal(5,2) DEFAULT '7.00',
	`status` enum('pendente','em_progresso','concluida') NOT NULL DEFAULT 'pendente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plano_individual_id` PRIMARY KEY(`id`)
);
