CREATE TABLE `practical_activity_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`authorId` int NOT NULL,
	`authorRole` enum('mentor','admin') NOT NULL,
	`authorName` varchar(255) NOT NULL,
	`comment` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `practical_activity_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mentoring_sessions` MODIFY COLUMN `taskStatus` enum('entregue','nao_entregue','sem_tarefa','validada');--> statement-breakpoint
ALTER TABLE `mentoring_sessions` ADD `evidenceLink` varchar(1000);--> statement-breakpoint
ALTER TABLE `mentoring_sessions` ADD `evidenceImageUrl` text;--> statement-breakpoint
ALTER TABLE `mentoring_sessions` ADD `evidenceImageKey` varchar(512);--> statement-breakpoint
ALTER TABLE `mentoring_sessions` ADD `submittedAt` timestamp;--> statement-breakpoint
ALTER TABLE `mentoring_sessions` ADD `validatedBy` int;--> statement-breakpoint
ALTER TABLE `mentoring_sessions` ADD `validatedAt` timestamp;