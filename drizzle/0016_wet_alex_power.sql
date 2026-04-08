CREATE TABLE `task_library` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competencia` varchar(255) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`resumo` text,
	`oQueFazer` text,
	`oQueGanha` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_library_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mentoring_sessions` ADD `mensagemAluno` text;--> statement-breakpoint
ALTER TABLE `mentoring_sessions` ADD `taskId` int;--> statement-breakpoint
ALTER TABLE `mentoring_sessions` ADD `taskDeadline` date;--> statement-breakpoint
ALTER TABLE `mentoring_sessions` ADD `relatoAluno` text;