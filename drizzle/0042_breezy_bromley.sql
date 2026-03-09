CREATE TABLE `activity_turmas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`turmaId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_turmas_id` PRIMARY KEY(`id`)
);
