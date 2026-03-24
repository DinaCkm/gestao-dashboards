CREATE TABLE `mentor_session_type_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`programId` int,
	`consultorId` int,
	`tipoSessao` enum('individual_normal','individual_assessment','grupo_normal','grupo_assessment') NOT NULL,
	`valor` decimal(10,2) NOT NULL,
	`descricao` varchar(255),
	`validoDesde` date NOT NULL,
	`validoAte` date,
	`isActive` int NOT NULL DEFAULT 1,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mentor_session_type_pricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mentoring_sessions` ADD `tipoSessao` enum('individual_normal','individual_assessment','grupo_normal','grupo_assessment') DEFAULT 'individual_normal';--> statement-breakpoint
ALTER TABLE `mentoring_sessions` ADD `appointmentId` int;