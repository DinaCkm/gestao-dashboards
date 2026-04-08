CREATE TABLE `alunos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(100),
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`turmaId` int,
	`trilhaId` int,
	`consultorId` int,
	`programId` int,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alunos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`programId` int,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consultors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_participation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`alunoId` int NOT NULL,
	`status` enum('presente','ausente') NOT NULL,
	`batchId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_participation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(100),
	`title` varchar(500) NOT NULL,
	`eventType` enum('webinar','aula','workshop','outro') DEFAULT 'webinar',
	`eventDate` date,
	`programId` int,
	`trilhaId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mentoring_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`consultorId` int NOT NULL,
	`turmaId` int,
	`trilhaId` int,
	`ciclo` enum('I','II','III','IV'),
	`sessionNumber` int,
	`sessionDate` date,
	`presence` enum('presente','ausente') NOT NULL,
	`taskStatus` enum('entregue','nao_entregue','sem_tarefa'),
	`engagementScore` int,
	`feedback` text,
	`batchId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mentoring_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `programs_id` PRIMARY KEY(`id`),
	CONSTRAINT `programs_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `trilhas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(100),
	`name` varchar(255) NOT NULL,
	`programId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trilhas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `turmas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(100),
	`name` varchar(255) NOT NULL,
	`programId` int NOT NULL,
	`year` int NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `turmas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dashboard_metrics` MODIFY COLUMN `batchId` int;--> statement-breakpoint
ALTER TABLE `uploaded_files` MODIFY COLUMN `fileType` enum('mentoria','eventos','alunos','outro') NOT NULL DEFAULT 'mentoria';--> statement-breakpoint
ALTER TABLE `dashboard_metrics` ADD `programId` int;--> statement-breakpoint
ALTER TABLE `reports` ADD `programId` int;--> statement-breakpoint
ALTER TABLE `upload_batches` ADD `programId` int;--> statement-breakpoint
ALTER TABLE `upload_batches` ADD `totalRecords` int;