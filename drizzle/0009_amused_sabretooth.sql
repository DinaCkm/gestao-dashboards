ALTER TABLE `users` ADD `cpf` varchar(14);--> statement-breakpoint
ALTER TABLE `users` ADD `programId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `alunoId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `consultorId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` int DEFAULT 1 NOT NULL;