ALTER TABLE `task_library` MODIFY COLUMN `nome` varchar(500) NOT NULL;--> statement-breakpoint
ALTER TABLE `task_library` ADD `o_que_fazer` text;--> statement-breakpoint
ALTER TABLE `task_library` ADD `o_que_ganha` text;--> statement-breakpoint
ALTER TABLE `task_library` DROP COLUMN `oQueFazer`;--> statement-breakpoint
ALTER TABLE `task_library` DROP COLUMN `oQueGanha`;