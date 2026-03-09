ALTER TABLE `mentoring_sessions` ADD `customTaskTitle` varchar(500);--> statement-breakpoint
ALTER TABLE `mentoring_sessions` ADD `customTaskDescription` text;--> statement-breakpoint
ALTER TABLE `mentoring_sessions` ADD `taskMode` enum('biblioteca','personalizada','livre','sem_tarefa') DEFAULT 'sem_tarefa';