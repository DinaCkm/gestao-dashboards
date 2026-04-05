CREATE TABLE `aluno_atividade_progresso` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`cursoAtribuidoId` int NOT NULL,
	`atividadeId` int NOT NULL,
	`status` enum('bloqueada','liberada','em_andamento','concluida') NOT NULL DEFAULT 'liberada',
	`iniciadoEm` timestamp,
	`concluidoEm` timestamp,
	`avaliacaoLiberada` int NOT NULL DEFAULT 0,
	`notaFinal` decimal(3,1),
	`aprovado` int NOT NULL DEFAULT 0,
	`tentativas` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aluno_atividade_progresso_id` PRIMARY KEY(`id`)
);
