ALTER TABLE `alunos` ADD `canLogin` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `consultors` ADD `loginId` varchar(50);--> statement-breakpoint
ALTER TABLE `consultors` ADD `role` enum('mentor','gerente') DEFAULT 'mentor' NOT NULL;--> statement-breakpoint
ALTER TABLE `consultors` ADD `managedProgramId` int;--> statement-breakpoint
ALTER TABLE `consultors` ADD `canLogin` int DEFAULT 0 NOT NULL;