CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`descricao` text,
	`tipo` enum('workshop','treinamento','palestra','evento','outro') NOT NULL DEFAULT 'workshop',
	`modalidade` enum('presencial','online','hibrido') NOT NULL DEFAULT 'presencial',
	`dataInicio` timestamp,
	`dataFim` timestamp,
	`local` varchar(500),
	`vagas` int,
	`instrutor` varchar(255),
	`imagemUrl` text,
	`competenciaRelacionada` varchar(255),
	`programId` int,
	`isActive` int NOT NULL DEFAULT 1,
	`ordem` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activity_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('inscrito','confirmado','cancelado','presente','ausente') NOT NULL DEFAULT 'inscrito',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activity_registrations_id` PRIMARY KEY(`id`)
);
