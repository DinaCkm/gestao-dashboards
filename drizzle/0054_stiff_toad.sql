CREATE TABLE `onboarding_revisoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`justificativa` text NOT NULL,
	`status` enum('pendente','em_analise','resolvida','cancelada') NOT NULL DEFAULT 'pendente',
	`respostaAdmin` text,
	`resolvidoPor` int,
	`resolvidoEm` timestamp,
	`emailEnviado` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_revisoes_id` PRIMARY KEY(`id`)
);
