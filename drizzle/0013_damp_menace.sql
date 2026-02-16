CREATE TABLE `assessment_competencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentPdiId` int NOT NULL,
	`competenciaId` int NOT NULL,
	`peso` enum('obrigatoria','opcional') NOT NULL DEFAULT 'obrigatoria',
	`notaCorte` decimal(5,2) NOT NULL DEFAULT '80.00',
	`microInicio` date,
	`microTermino` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessment_competencias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessment_pdi` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`trilhaId` int NOT NULL,
	`turmaId` int,
	`consultorId` int,
	`programId` int,
	`macroInicio` date NOT NULL,
	`macroTermino` date NOT NULL,
	`status` enum('ativo','congelado') NOT NULL DEFAULT 'ativo',
	`observacoes` text,
	`congeladoEm` timestamp,
	`congeladoPor` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessment_pdi_id` PRIMARY KEY(`id`)
);
