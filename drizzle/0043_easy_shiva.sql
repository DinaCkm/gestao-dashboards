ALTER TABLE `disc_respostas` ADD `ciclo` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `disc_respostas` ADD `blocoIndex` int NOT NULL;--> statement-breakpoint
ALTER TABLE `disc_respostas` ADD `maisId` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `disc_respostas` ADD `menosId` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `disc_respostas` ADD `maisDimensao` enum('D','I','S','C') NOT NULL;--> statement-breakpoint
ALTER TABLE `disc_respostas` ADD `menosDimensao` enum('D','I','S','C') NOT NULL;--> statement-breakpoint
ALTER TABLE `disc_resultados` ADD `scoreBrutoD` int;--> statement-breakpoint
ALTER TABLE `disc_resultados` ADD `scoreBrutoI` int;--> statement-breakpoint
ALTER TABLE `disc_resultados` ADD `scoreBrutoS` int;--> statement-breakpoint
ALTER TABLE `disc_resultados` ADD `scoreBrutoC` int;--> statement-breakpoint
ALTER TABLE `disc_resultados` ADD `indiceConsistencia` int;--> statement-breakpoint
ALTER TABLE `disc_resultados` ADD `alertaBaixaDiferenciacao` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `disc_resultados` ADD `metodoCalculo` varchar(20) DEFAULT 'ipsativo' NOT NULL;--> statement-breakpoint
ALTER TABLE `disc_respostas` DROP COLUMN `perguntaIndex`;--> statement-breakpoint
ALTER TABLE `disc_respostas` DROP COLUMN `dimensao`;--> statement-breakpoint
ALTER TABLE `disc_respostas` DROP COLUMN `resposta`;