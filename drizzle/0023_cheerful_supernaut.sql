CREATE TABLE `cases_sucesso` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`trilhaId` int,
	`trilhaNome` varchar(255),
	`entregue` int NOT NULL DEFAULT 0,
	`dataEntrega` timestamp,
	`titulo` varchar(500),
	`descricao` text,
	`avaliadoPor` int,
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cases_sucesso_id` PRIMARY KEY(`id`)
);
