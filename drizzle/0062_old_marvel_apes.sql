CREATE TABLE `aluno_curso_atribuido` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`cursoId` int NOT NULL,
	`competenciaId` int NOT NULL,
	`mentorId` int NOT NULL,
	`dataAtribuicao` timestamp NOT NULL DEFAULT (now()),
	`dataPrazo` timestamp NOT NULL,
	`status` enum('nao_iniciado','em_progresso','concluido','prorrogado') NOT NULL DEFAULT 'nao_iniciado',
	`notaFinal` decimal(3,1),
	`dataConclusao` timestamp,
	`indicador2Updated` int NOT NULL DEFAULT 0,
	`indicador3Updated` int NOT NULL DEFAULT 0,
	CONSTRAINT `aluno_curso_atribuido_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `atividades_curso` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cursoId` int NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`tipoAtividade` enum('genially','video','podcast','tedtalk','livro','intro') NOT NULL,
	`urlGenially` varchar(500),
	`descricao` text,
	`ordem` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `atividades_curso_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `avaliacoes_atividade` (
	`id` int AUTO_INCREMENT NOT NULL,
	`atividadeId` int NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`questoes` json NOT NULL,
	`notaMinima` decimal(3,1) NOT NULL DEFAULT '8.0',
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `avaliacoes_atividade_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cursos_competencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competenciaId` int NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`capaUrl` varchar(500),
	`ordem` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cursos_competencias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tentativas_avaliacao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`atividadeId` int NOT NULL,
	`avaliacaoId` int NOT NULL,
	`questoesSelecionadas` json NOT NULL,
	`respostasAluno` json NOT NULL,
	`nota` decimal(3,1),
	`aprovado` int NOT NULL DEFAULT 0,
	`dataTentativa` timestamp NOT NULL DEFAULT (now()),
	`dataProximaTentativa` timestamp,
	CONSTRAINT `tentativas_avaliacao_id` PRIMARY KEY(`id`)
);
