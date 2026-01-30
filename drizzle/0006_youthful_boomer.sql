CREATE TABLE `competencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`trilhaId` int NOT NULL,
	`codigoIntegracao` varchar(100),
	`descricao` text,
	`ordem` int DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competencias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `trilhas` ADD `codigo` varchar(50);--> statement-breakpoint
ALTER TABLE `trilhas` ADD `ordem` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `trilhas` ADD `isActive` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `trilhas` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;