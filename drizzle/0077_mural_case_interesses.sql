CREATE TABLE `case_interesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`autorAlunoId` int NOT NULL,
	`interessadoAlunoId` int NOT NULL,
	`interessadoNome` varchar(255) NOT NULL,
	`interessadoEmail` varchar(320) NOT NULL,
	`mensagem` text NOT NULL,
	`status` enum('nao_lido','lido') NOT NULL DEFAULT 'nao_lido',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `case_interesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `case_interesses_case_idx` ON `case_interesses` (`caseId`);
--> statement-breakpoint
CREATE INDEX `case_interesses_autor_idx` ON `case_interesses` (`autorAlunoId`);
--> statement-breakpoint
CREATE INDEX `case_interesses_interessado_idx` ON `case_interesses` (`interessadoAlunoId`);
