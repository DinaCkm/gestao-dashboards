CREATE TABLE `processos_seletivos` (
  `id` int AUTO_INCREMENT NOT NULL,
  `nome` varchar(255) NOT NULL,
  `clienteNome` varchar(255) NOT NULL,
  `clienteEmail` varchar(320),
  `descricao` text,
  `status` enum('rascunho','ativo','pausado','encerrado') NOT NULL DEFAULT 'rascunho',
  `dataInicio` date,
  `dataFim` date,
  `responsavelCkmId` int,
  `criadoPor` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `processos_seletivos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processo_vagas` (
  `id` int AUTO_INCREMENT NOT NULL,
  `processoId` int NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `codigo` varchar(80),
  `descricao` text,
  `quantidadeVagas` int NOT NULL DEFAULT 1,
  `status` enum('ativa','pausada','encerrada') NOT NULL DEFAULT 'ativa',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `processo_vagas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processo_regioes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `processoId` int NOT NULL,
  `nome` varchar(255) NOT NULL,
  `codigo` varchar(80),
  `vagasPrevistas` int NOT NULL DEFAULT 0,
  `status` enum('ativa','pausada','encerrada') NOT NULL DEFAULT 'ativa',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `processo_regioes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processo_cliente_usuarios` (
  `id` int AUTO_INCREMENT NOT NULL,
  `processoId` int NOT NULL,
  `userId` int NOT NULL,
  `permissao` enum('leitura','comentario') NOT NULL DEFAULT 'leitura',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `processo_cliente_usuarios_id` PRIMARY KEY(`id`),
  CONSTRAINT `processo_cliente_usuarios_processo_user_unique` UNIQUE(`processoId`, `userId`)
);
--> statement-breakpoint
CREATE TABLE `processo_candidatos` (
  `id` int AUTO_INCREMENT NOT NULL,
  `processoId` int NOT NULL,
  `vagaId` int,
  `regiaoId` int NOT NULL,
  `userId` int,
  `nome` varchar(255) NOT NULL,
  `email` varchar(320) NOT NULL,
  `telefone` varchar(30),
  `cpf` varchar(14),
  `statusCadastro` enum('importado','convidado','ativo','inativo') NOT NULL DEFAULT 'importado',
  `statusTeste` enum('nao_enviado','enviado','em_andamento','concluido','expirado') NOT NULL DEFAULT 'nao_enviado',
  `testeConcluidoEm` timestamp,
  `statusEntrevista` enum('nao_agendada','aguardando_agenda','agendada','realizada','cancelada','reagendada') NOT NULL DEFAULT 'nao_agendada',
  `statusResultado` enum('pendente','aprovado','reprovado','suplente','desistente') NOT NULL DEFAULT 'pendente',
  `observacoes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `processo_candidatos_id` PRIMARY KEY(`id`),
  CONSTRAINT `processo_candidatos_processo_email_unique` UNIQUE(`processoId`, `email`)
);
--> statement-breakpoint
CREATE TABLE `processo_agendas_grupo` (
  `id` int AUTO_INCREMENT NOT NULL,
  `processoId` int NOT NULL,
  `regiaoId` int NOT NULL,
  `vagaId` int,
  `nomeGrupo` varchar(255) NOT NULL,
  `dataAgenda` date NOT NULL,
  `inicio` varchar(5) NOT NULL,
  `fim` varchar(5) NOT NULL,
  `intervaloInicio` varchar(5),
  `intervaloFim` varchar(5),
  `duracaoMinutos` int NOT NULL DEFAULT 30,
  `linkPadrao` varchar(500),
  `status` enum('aberta','fechada','cancelada') NOT NULL DEFAULT 'aberta',
  `criadoPor` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `processo_agendas_grupo_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processo_agenda_slots` (
  `id` int AUTO_INCREMENT NOT NULL,
  `processoId` int NOT NULL,
  `agendaGrupoId` int NOT NULL,
  `regiaoId` int NOT NULL,
  `vagaId` int,
  `candidatoId` int,
  `dataAgenda` date NOT NULL,
  `inicio` varchar(5) NOT NULL,
  `fim` varchar(5) NOT NULL,
  `linkEntrevista` varchar(500),
  `status` enum('disponivel','reservado','confirmado','realizado','cancelado','bloqueado') NOT NULL DEFAULT 'disponivel',
  `emailConvocacaoEnviado` int NOT NULL DEFAULT 0,
  `emailConvocacaoEnviadoEm` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `processo_agenda_slots_id` PRIMARY KEY(`id`),
  CONSTRAINT `processo_agenda_slots_agenda_inicio_unique` UNIQUE(`agendaGrupoId`, `inicio`),
  CONSTRAINT `processo_agenda_slots_candidato_unique` UNIQUE(`candidatoId`)
);
--> statement-breakpoint
CREATE TABLE `processo_entrevistas` (
  `id` int AUTO_INCREMENT NOT NULL,
  `processoId` int NOT NULL,
  `candidatoId` int NOT NULL,
  `agendaSlotId` int NOT NULL,
  `entrevistadorNome` varchar(255),
  `linkEntrevista` varchar(500),
  `status` enum('agendada','realizada','cancelada','reagendada') NOT NULL DEFAULT 'agendada',
  `observacoes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `processo_entrevistas_id` PRIMARY KEY(`id`),
  CONSTRAINT `processo_entrevistas_candidato_unique` UNIQUE(`candidatoId`),
  CONSTRAINT `processo_entrevistas_slot_unique` UNIQUE(`agendaSlotId`)
);
--> statement-breakpoint
CREATE TABLE `processo_resultados` (
  `id` int AUTO_INCREMENT NOT NULL,
  `processoId` int NOT NULL,
  `candidatoId` int NOT NULL,
  `resultado` enum('pendente','aprovado','reprovado','suplente','desistente') NOT NULL DEFAULT 'pendente',
  `notaEntrevista` int,
  `parecer` text,
  `registradoPor` int NOT NULL,
  `publicadoEm` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `processo_resultados_id` PRIMARY KEY(`id`),
  CONSTRAINT `processo_resultados_candidato_unique` UNIQUE(`candidatoId`)
);
--> statement-breakpoint
CREATE TABLE `processo_publicacoes_mapa` (
  `id` int AUTO_INCREMENT NOT NULL,
  `processoId` int NOT NULL,
  `tipo` enum('entrevistas','aprovados') NOT NULL,
  `publicadoPor` int NOT NULL,
  `publicadoEm` timestamp NOT NULL DEFAULT (now()),
  `observacoes` text,
  CONSTRAINT `processo_publicacoes_mapa_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processo_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `processoId` int NOT NULL,
  `candidatoId` int,
  `userId` int,
  `acao` varchar(120) NOT NULL,
  `detalhe` text,
  `metadata` json,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `processo_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_ps_status` ON `processos_seletivos` (`status`);
--> statement-breakpoint
CREATE INDEX `idx_pv_processo` ON `processo_vagas` (`processoId`);
--> statement-breakpoint
CREATE INDEX `idx_pr_processo` ON `processo_regioes` (`processoId`);
--> statement-breakpoint
CREATE INDEX `idx_pc_processo_status` ON `processo_candidatos` (`processoId`, `statusTeste`, `statusEntrevista`, `statusResultado`);
--> statement-breakpoint
CREATE INDEX `idx_pc_regiao_vaga` ON `processo_candidatos` (`regiaoId`, `vagaId`);
--> statement-breakpoint
CREATE INDEX `idx_pag_processo_regiao` ON `processo_agendas_grupo` (`processoId`, `regiaoId`, `vagaId`, `dataAgenda`);
--> statement-breakpoint
CREATE INDEX `idx_pas_busca_alocacao` ON `processo_agenda_slots` (`processoId`, `regiaoId`, `vagaId`, `status`, `dataAgenda`, `inicio`);
--> statement-breakpoint
CREATE INDEX `idx_pl_processo` ON `processo_logs` (`processoId`, `createdAt`);
