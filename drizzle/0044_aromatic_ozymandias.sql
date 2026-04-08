CREATE TABLE `mentor_session_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consultorId` int NOT NULL,
	`sessionFrom` int NOT NULL,
	`sessionTo` int NOT NULL,
	`valor` decimal(10,2) NOT NULL,
	`descricao` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mentor_session_pricing_id` PRIMARY KEY(`id`)
);
