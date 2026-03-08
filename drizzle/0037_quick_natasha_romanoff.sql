CREATE TABLE `in_app_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('info','warning','success','action') NOT NULL DEFAULT 'info',
	`category` varchar(100),
	`link` varchar(512),
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `in_app_notifications_id` PRIMARY KEY(`id`)
);
