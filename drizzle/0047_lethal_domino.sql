CREATE TABLE `mentor_date_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consultorId` int NOT NULL,
	`specificDate` varchar(10) NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`slotDurationMinutes` int NOT NULL DEFAULT 60,
	`googleMeetLink` varchar(500),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mentor_date_availability_id` PRIMARY KEY(`id`)
);
