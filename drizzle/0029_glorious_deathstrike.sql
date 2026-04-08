CREATE TABLE `appointment_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appointmentId` int NOT NULL,
	`alunoId` int NOT NULL,
	`status` enum('convidado','confirmado','recusado','presente','ausente') NOT NULL DEFAULT 'convidado',
	`confirmedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appointment_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mentor_appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consultorId` int NOT NULL,
	`availabilityId` int,
	`scheduledDate` varchar(10) NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`googleMeetLink` varchar(500),
	`type` enum('individual','grupo') NOT NULL DEFAULT 'individual',
	`title` varchar(255),
	`description` text,
	`status` enum('agendado','confirmado','realizado','cancelado') NOT NULL DEFAULT 'agendado',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mentor_appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mentor_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consultorId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`slotDurationMinutes` int NOT NULL DEFAULT 60,
	`googleMeetLink` varchar(500),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mentor_availability_id` PRIMARY KEY(`id`)
);
