CREATE TABLE `aluno_competencia_prorrogacao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aluno_id` int NOT NULL,
	`modulo_id` int NOT NULL,
	`progresso_id` int NOT NULL,
	`mentor_id` int,
	`data_solicitacao` timestamp NOT NULL,
	`data_limite_original` timestamp NOT NULL,
	`data_limite_solicitada` timestamp NOT NULL,
	`data_limite_aprovada` timestamp,
	`status` enum('pendente','aprovada','rejeitada','cancelada') NOT NULL DEFAULT 'pendente',
	`motivo_solicitacao` text,
	`motivo_rejeicao` text,
	`dentro_contrato` int NOT NULL DEFAULT 1,
	`data_fim_contrato` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aluno_competencia_prorrogacao_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aluno_modulo_avaliacao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aluno_id` int NOT NULL,
	`modulo_id` int NOT NULL,
	`progresso_id` int NOT NULL,
	`nota` decimal(5,2) NOT NULL,
	`total_questoes` int,
	`questoes_acertadas` int,
	`tempo_resposta_minutos` int,
	`aprovado` int NOT NULL DEFAULT 1,
	`data_avaliacao` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aluno_modulo_avaliacao_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aluno_modulo_progresso` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aluno_id` int NOT NULL,
	`modulo_id` int NOT NULL,
	`competencia_id` int NOT NULL,
	`microciclo_id` int NOT NULL,
	`status` enum('nao_iniciado','em_progresso','concluido') NOT NULL DEFAULT 'nao_iniciado',
	`data_inicio` timestamp,
	`data_conclusao` timestamp,
	`data_limite_original` timestamp NOT NULL,
	`data_limite_prorrogada` timestamp,
	`dias_restantes` int,
	`status_semaforo` enum('verde','amarelo','vermelho') NOT NULL DEFAULT 'verde',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aluno_modulo_progresso_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aluno_modulo_relato` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aluno_id` int NOT NULL,
	`modulo_id` int NOT NULL,
	`progresso_id` int NOT NULL,
	`texto_relato` text NOT NULL,
	`data_envio` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aluno_modulo_relato_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competencias_modulos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competencia_id` int NOT NULL,
	`tipo_modulo` enum('intro','filme','video','tedtalk','podcast','livro') NOT NULL DEFAULT 'intro',
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`url_genially` varchar(500),
	`url_thumbnail` varchar(500),
	`duracao_minutos` int DEFAULT 15,
	`ordem` int DEFAULT 0,
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competencias_modulos_id` PRIMARY KEY(`id`)
);
