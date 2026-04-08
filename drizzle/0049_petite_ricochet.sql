CREATE TABLE `email_alertas_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`consultorId` int NOT NULL,
	`tipoAlerta` varchar(50) NOT NULL,
	`diasSemSessao` int NOT NULL,
	`emailEnviado` int NOT NULL DEFAULT 1,
	`erro` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_alertas_log_id` PRIMARY KEY(`id`)
);
