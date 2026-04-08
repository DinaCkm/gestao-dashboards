CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`descricao` text,
	`tipo` enum('workshop','treinamento','palestra','evento','outro') NOT NULL DEFAULT 'workshop',
	`modalidade` enum('presencial','online','hibrido') NOT NULL DEFAULT 'presencial',
	`dataInicio` timestamp,
	`dataFim` timestamp,
	`local` varchar(500),
	`vagas` int,
	`instrutor` varchar(255),
	`imagemUrl` text,
	`competenciaRelacionada` varchar(255),
	`programId` int,
	`isActive` int NOT NULL DEFAULT 1,
	`ordem` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activity_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('inscrito','confirmado','cancelado','presente','ausente') NOT NULL DEFAULT 'inscrito',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activity_registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activity_turmas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`turmaId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_turmas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aluno_atividade_progresso` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`cursoAtribuidoId` int NOT NULL,
	`atividadeId` int NOT NULL,
	`status` enum('bloqueada','disponivel','em_andamento','concluida','aprovada','reprovada') NOT NULL DEFAULT 'bloqueada',
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
--> statement-breakpoint
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
CREATE TABLE `alunos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(100),
	`cpf` varchar(14),
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`turmaId` int,
	`trilhaId` int,
	`consultorId` int,
	`programId` int,
	`isActive` int NOT NULL DEFAULT 1,
	`canLogin` int NOT NULL DEFAULT 1,
	`bypassOnboarding` int NOT NULL DEFAULT 0,
	`onboardingLiberado` int NOT NULL DEFAULT 0,
	`onboardingLiberadoEm` timestamp,
	`cadastradoPorAdmin` int NOT NULL DEFAULT 0,
	`contratoInicio` timestamp,
	`contratoFim` timestamp,
	`tipoMentoria` enum('individual','grupo') DEFAULT 'individual',
	`totalSessoesContratadas` int DEFAULT 0,
	`telefone` varchar(20),
	`cargo` varchar(255),
	`areaAtuacao` varchar(255),
	`minicurriculo` text,
	`quemEVoce` text,
	`discVideoWatchedAt` timestamp,
	`plataformaAulas` enum('scaffold','sistema_interno') DEFAULT 'sistema_interno',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alunos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text,
	`type` enum('webinar','course','activity','notice','news') NOT NULL DEFAULT 'notice',
	`imageUrl` text,
	`imageKey` varchar(512),
	`actionUrl` varchar(500),
	`actionLabel` varchar(100),
	`programId` int,
	`targetAudience` enum('all','sebrae_to','sebrae_acre','embrapii','banrisul') DEFAULT 'all',
	`priority` int NOT NULL DEFAULT 0,
	`publishAt` timestamp,
	`expiresAt` timestamp,
	`isActive` int NOT NULL DEFAULT 1,
	`webinarId` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appointment_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appointmentId` int NOT NULL,
	`alunoId` int NOT NULL,
	`status` enum('convidado','confirmado','recusado','presente','ausente') NOT NULL DEFAULT 'convidado',
	`confirmedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appointment_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessment_competencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentPdiId` int NOT NULL,
	`competenciaId` int NOT NULL,
	`peso` enum('obrigatoria','opcional') NOT NULL DEFAULT 'obrigatoria',
	`notaCorte` decimal(5,2) NOT NULL DEFAULT '8.00',
	`nivelAtual` decimal(5,2),
	`metaFinal` decimal(5,2),
	`metaCiclo1` decimal(5,2),
	`metaCiclo2` decimal(5,2),
	`justificativa` text,
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
	`totalSessoesPrevistas` int,
	`status` enum('ativo','congelado') NOT NULL DEFAULT 'ativo',
	`observacoes` text,
	`congeladoEm` timestamp,
	`congeladoPor` int,
	`motivoCongelamento` text,
	`descongeladoEm` timestamp,
	`descongeladoPor` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessment_pdi_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `atividades_curso` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cursoId` int NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`tipoAtividade` enum('genially','video','podcast','tedtalk','livro','intro') NOT NULL,
	`urlGenially` text,
	`urlMidia` text,
	`imagemUrl` text,
	`descricao` text,
	`ordem` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `atividades_curso_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `autopercepcoes_competencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`competenciaId` int NOT NULL,
	`trilhaId` int NOT NULL,
	`nota` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `autopercepcoes_competencias_id` PRIMARY KEY(`id`)
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
CREATE TABLE `calculation_formulas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`formula` text NOT NULL,
	`variables` json,
	`isActive` int NOT NULL DEFAULT 1,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calculation_formulas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cases_sucesso` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`trilhaId` int,
	`trilhaNome` varchar(255),
	`entregue` int NOT NULL DEFAULT 0,
	`dataEntrega` timestamp,
	`titulo` varchar(500),
	`descricao` text,
	`avaliadoPor` int,
	`observacao` text,
	`fileUrl` varchar(1000),
	`fileKey` varchar(500),
	`fileName` varchar(500),
	`oQueAprendi` text,
	`oQueMudei` text,
	`resultadoMensuravel` text,
	`antesVsDepois` text,
	`evidenciaUrl` varchar(1000),
	`evidenciaKey` varchar(500),
	`evidenciaFileName` varchar(500),
	`notaAlunoAplicabilidade` int,
	`notaMentoraAplicabilidade` int,
	`aplicabilidadeAvaliadaEm` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cases_sucesso_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ciclo_competencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cicloId` int NOT NULL,
	`competenciaId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ciclo_competencias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ciclos_execucao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`nomeCiclo` varchar(255) NOT NULL,
	`dataInicio` date NOT NULL,
	`dataFim` date NOT NULL,
	`definidoPor` int,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ciclos_execucao_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`trilhaId` int NOT NULL,
	`codigoIntegracao` varchar(100),
	`descricao` text,
	`ordem` int DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competencias_id` PRIMARY KEY(`id`)
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
--> statement-breakpoint
CREATE TABLE `consultors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loginId` varchar(50),
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`cpf` varchar(11),
	`especialidade` text,
	`programId` int,
	`role` enum('mentor','gerente') NOT NULL DEFAULT 'mentor',
	`managedProgramId` int,
	`isActive` int NOT NULL DEFAULT 1,
	`photoUrl` text,
	`miniCurriculo` text,
	`canLogin` int NOT NULL DEFAULT 0,
	`valorSessao` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consultors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contratos_aluno` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`programId` int NOT NULL,
	`turmaId` int,
	`periodoInicio` date NOT NULL,
	`periodoTermino` date NOT NULL,
	`totalSessoesContratadas` int NOT NULL,
	`observacoes` text,
	`criadoPor` int,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contratos_aluno_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`descricao` text,
	`categoria` varchar(255),
	`competenciaRelacionada` varchar(255),
	`tipo` enum('gratuito','online_pago','presencial') NOT NULL DEFAULT 'gratuito',
	`youtubeUrl` varchar(500),
	`thumbnailUrl` text,
	`duracao` varchar(100),
	`instrutor` varchar(255),
	`nivel` enum('iniciante','intermediario','avancado') DEFAULT 'iniciante',
	`programId` int,
	`isActive` int NOT NULL DEFAULT 1,
	`ordem` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cursos_competencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competenciaId` int NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`ordem` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cursos_competencias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dashboard_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` int,
	`programId` int,
	`scope` enum('admin','manager','individual') NOT NULL,
	`scopeId` int,
	`metricType` varchar(100) NOT NULL,
	`metricName` varchar(255) NOT NULL,
	`currentValue` decimal(15,4),
	`previousValue` decimal(15,4),
	`changePercent` decimal(8,2),
	`trend` enum('up','down','stable'),
	`chartData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dashboard_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`managerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disc_respostas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`ciclo` int NOT NULL DEFAULT 1,
	`blocoIndex` int NOT NULL,
	`maisId` varchar(20) NOT NULL,
	`menosId` varchar(20) NOT NULL,
	`maisDimensao` enum('D','I','S','C') NOT NULL,
	`menosDimensao` enum('D','I','S','C') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disc_respostas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disc_resultados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`ciclo` int NOT NULL DEFAULT 1,
	`scoreD` decimal(5,2) NOT NULL,
	`scoreI` decimal(5,2) NOT NULL,
	`scoreS` decimal(5,2) NOT NULL,
	`scoreC` decimal(5,2) NOT NULL,
	`scoreBrutoD` int,
	`scoreBrutoI` int,
	`scoreBrutoS` int,
	`scoreBrutoC` int,
	`perfilPredominante` enum('D','I','S','C') NOT NULL,
	`perfilSecundario` enum('D','I','S','C'),
	`indiceConsistencia` int,
	`alertaBaixaDiferenciacao` boolean DEFAULT false,
	`metodoCalculo` varchar(20) NOT NULL DEFAULT 'ipsativo',
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `disc_resultados_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_alertas_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`consultorId` int NOT NULL,
	`tipoAlerta` varchar(50) NOT NULL,
	`diasSemSessao` int NOT NULL,
	`emailEnviado` int NOT NULL DEFAULT 1,
	`erro` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_alertas_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_participation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`alunoId` int NOT NULL,
	`status` enum('presente','ausente') NOT NULL,
	`reflexao` text,
	`selfReportedAt` timestamp,
	`batchId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_participation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(100),
	`title` varchar(500) NOT NULL,
	`eventType` enum('webinar','aula','workshop','curso_online','outro') DEFAULT 'webinar',
	`eventDate` date,
	`videoLink` varchar(500),
	`programId` int,
	`trilhaId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `historico_nivel_competencia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentCompetenciaId` int NOT NULL,
	`alunoId` int NOT NULL,
	`nivelAnterior` decimal(5,2),
	`nivelNovo` decimal(5,2) NOT NULL,
	`atualizadoPor` int,
	`sessaoReferencia` int,
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `historico_nivel_competencia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `mentor_appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consultorId` int NOT NULL,
	`availabilityId` int,
	`scheduledDate` varchar(10) NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`googleMeetLink` varchar(500),
	`type` enum('individual','grupo') NOT NULL DEFAULT 'individual',
	`title` varchar(255),
	`description` text,
	`status` enum('agendado','confirmado','realizado','cancelado') NOT NULL DEFAULT 'agendado',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mentor_appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mentor_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consultorId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`slotDurationMinutes` int NOT NULL DEFAULT 60,
	`googleMeetLink` varchar(500),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mentor_availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mentor_date_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consultorId` int NOT NULL,
	`specificDate` varchar(10) NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`slotDurationMinutes` int NOT NULL DEFAULT 60,
	`googleMeetLink` varchar(500),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mentor_date_availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mentor_session_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consultorId` int NOT NULL,
	`sessionFrom` int NOT NULL,
	`sessionTo` int NOT NULL,
	`valor` decimal(10,2) NOT NULL,
	`descricao` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mentor_session_pricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mentor_session_type_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`programId` int,
	`consultorId` int,
	`tipoSessao` enum('individual_normal','individual_assessment','grupo_normal','grupo_assessment') NOT NULL,
	`valor` decimal(10,2) NOT NULL,
	`descricao` varchar(255),
	`validoDesde` date NOT NULL,
	`validoAte` date,
	`isActive` int NOT NULL DEFAULT 1,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mentor_session_type_pricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mentora_contribuicoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`consultorId` int NOT NULL,
	`tipo` enum('disc','competencia','geral') NOT NULL,
	`competenciaId` int,
	`conteudo` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mentora_contribuicoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mentoring_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`consultorId` int NOT NULL,
	`turmaId` int,
	`trilhaId` int,
	`ciclo` enum('I','II','III','IV'),
	`sessionNumber` int,
	`sessionDate` date,
	`isAssessment` int NOT NULL DEFAULT 0,
	`presence` enum('presente','ausente') NOT NULL,
	`taskStatus` enum('entregue','nao_entregue','sem_tarefa','validada'),
	`engagementScore` int,
	`notaEvolucao` int,
	`feedback` text,
	`mensagemAluno` text,
	`taskId` int,
	`taskDeadline` date,
	`customTaskTitle` varchar(500),
	`customTaskDescription` text,
	`taskMode` enum('biblioteca','personalizada','livre','sem_tarefa') DEFAULT 'sem_tarefa',
	`relatoAluno` text,
	`batchId` int,
	`evidenceLink` varchar(1000),
	`evidenceImageUrl` text,
	`evidenceImageKey` varchar(512),
	`submittedAt` timestamp,
	`validatedBy` int,
	`validatedAt` timestamp,
	`textoAplicabilidade` text,
	`notaAlunoAplicabilidade` int,
	`notaMentoraAplicabilidade` int,
	`aplicabilidadeAvaliadaEm` timestamp,
	`tipoSessao` enum('individual_normal','individual_assessment','grupo_normal','grupo_assessment') DEFAULT 'individual_normal',
	`appointmentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mentoring_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meta_acompanhamento` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metaId` int NOT NULL,
	`alunoId` int NOT NULL,
	`mes` int NOT NULL,
	`ano` int NOT NULL,
	`status` enum('cumprida','nao_cumprida','parcial') NOT NULL,
	`observacao` text,
	`registradoPor` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meta_acompanhamento_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`assessmentCompetenciaId` int NOT NULL,
	`competenciaId` int NOT NULL,
	`assessmentPdiId` int NOT NULL,
	`taskLibraryId` int,
	`titulo` varchar(500) NOT NULL,
	`descricao` text,
	`definidaPor` int,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `metas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_jornada` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`ciclo` int NOT NULL DEFAULT 1,
	`cadastroConfirmado` int NOT NULL DEFAULT 0,
	`cadastroConfirmadoEm` timestamp,
	`pdiVisualizado` int NOT NULL DEFAULT 0,
	`pdiVisualizadoEm` timestamp,
	`pdiLiberadoPelaMentora` int NOT NULL DEFAULT 0,
	`pdiLiberadoEm` timestamp,
	`videoBoasVindas` int NOT NULL DEFAULT 0,
	`videoCompetencias` int NOT NULL DEFAULT 0,
	`videoWebinars` int NOT NULL DEFAULT 0,
	`videoTarefas` int NOT NULL DEFAULT 0,
	`videoMetas` int NOT NULL DEFAULT 0,
	`todosVideosEm` timestamp,
	`aceiteRealizado` int NOT NULL DEFAULT 0,
	`aceiteRealizadoEm` timestamp,
	`nomeAceite` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_jornada_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_revisoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`justificativa` text NOT NULL,
	`status` enum('pendente','em_analise','resolvida','cancelada') NOT NULL DEFAULT 'pendente',
	`respostaAdmin` text,
	`resolvidoPor` int,
	`resolvidoEm` timestamp,
	`emailEnviado` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_revisoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chave` varchar(50) NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`videoUrl` text,
	`thumbnailUrl` text,
	`textoExplicativo` text,
	`ordem` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_videos_id` PRIMARY KEY(`id`),
	CONSTRAINT `onboarding_videos_chave_unique` UNIQUE(`chave`)
);
--> statement-breakpoint
CREATE TABLE `performance_uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadedBy` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512),
	`fileUrl` text,
	`totalRecords` int NOT NULL DEFAULT 0,
	`processedRecords` int NOT NULL DEFAULT 0,
	`skippedRecords` int NOT NULL DEFAULT 0,
	`newAlunos` int NOT NULL DEFAULT 0,
	`updatedRecords` int NOT NULL DEFAULT 0,
	`status` enum('processing','completed','error') NOT NULL DEFAULT 'processing',
	`errorMessage` text,
	`summary` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performance_uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plano_individual` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`competenciaId` int NOT NULL,
	`isObrigatoria` int NOT NULL DEFAULT 1,
	`notaAtual` decimal(5,2),
	`metaNota` decimal(5,2) DEFAULT '7.00',
	`status` enum('pendente','em_progresso','concluida') NOT NULL DEFAULT 'pendente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plano_individual_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `practical_activity_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`authorId` int NOT NULL,
	`authorRole` enum('mentor','admin') NOT NULL,
	`authorName` varchar(255) NOT NULL,
	`comment` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `practical_activity_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processed_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` int NOT NULL,
	`fileId` int NOT NULL,
	`userId` int,
	`departmentId` int,
	`metricName` varchar(255) NOT NULL,
	`metricValue` decimal(15,4),
	`metricUnit` varchar(50),
	`period` varchar(50),
	`rawData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `processed_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `programs_id` PRIMARY KEY(`id`),
	CONSTRAINT `programs_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('admin','manager','individual','financeiro_mentora','financeiro_empresa') NOT NULL,
	`format` enum('pdf','excel') NOT NULL,
	`generatedBy` int NOT NULL,
	`programId` int,
	`scopeId` int,
	`fileKey` varchar(512),
	`fileUrl` text,
	`parameters` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_webinars` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`theme` varchar(255),
	`speaker` varchar(255),
	`speakerBio` text,
	`eventDate` timestamp NOT NULL,
	`startDate` timestamp,
	`endDate` timestamp,
	`duration` int DEFAULT 60,
	`meetingLink` varchar(500),
	`youtubeLink` varchar(500),
	`cardImageUrl` text,
	`cardImageKey` varchar(512),
	`programId` int,
	`targetAudience` enum('all','sebrae_to','sebrae_acre','embrapii','banrisul') DEFAULT 'all',
	`status` enum('draft','published','completed','cancelled') NOT NULL DEFAULT 'draft',
	`reminderSent` int NOT NULL DEFAULT 0,
	`reminderSentAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_webinars_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_performance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int,
	`externalUserId` varchar(100) NOT NULL,
	`userName` varchar(255) NOT NULL,
	`userEmail` varchar(320),
	`lastAccess` varchar(100),
	`turmaId` int,
	`externalTurmaId` varchar(100),
	`turmaName` varchar(255),
	`competenciaId` int,
	`externalCompetenciaId` varchar(100),
	`competenciaName` varchar(255),
	`dataInicio` varchar(100),
	`dataConclusao` varchar(100),
	`totalAulas` int DEFAULT 0,
	`aulasDisponiveis` int DEFAULT 0,
	`aulasConcluidas` int DEFAULT 0,
	`aulasEmAndamento` int DEFAULT 0,
	`aulasNaoIniciadas` int DEFAULT 0,
	`aulasAgendadas` int DEFAULT 0,
	`progressoTotal` int DEFAULT 0,
	`cargaHorariaTotal` varchar(20),
	`cargaHorariaConcluida` varchar(20),
	`progressoAulasDisponiveis` int DEFAULT 0,
	`avaliacoesDiagnostico` int DEFAULT 0,
	`mediaAvaliacoesDiagnostico` decimal(5,2),
	`avaliacoesFinais` int DEFAULT 0,
	`mediaAvaliacoesFinais` decimal(5,2),
	`avaliacoesDisponiveis` int DEFAULT 0,
	`avaliacoesRespondidas` int DEFAULT 0,
	`avaliacoesPendentes` int DEFAULT 0,
	`avaliacoesAgendadas` int DEFAULT 0,
	`mediaAvaliacoesDisponiveis` decimal(5,2),
	`mediaAvaliacoesRespondidas` decimal(5,2),
	`concluidoDentroPrazo` varchar(100),
	`concluidoEmAtraso` varchar(100),
	`naoConcluidoDentroPrazo` varchar(100),
	`naoConcluidoEmAtraso` varchar(100),
	`uploadId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_performance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `task_library` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competencia` varchar(255) NOT NULL,
	`nome` varchar(500) NOT NULL,
	`resumo` text,
	`o_que_fazer` text,
	`o_que_ganha` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_library_id` PRIMARY KEY(`id`)
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
--> statement-breakpoint
CREATE TABLE `trilhas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(100),
	`name` varchar(255) NOT NULL,
	`codigo` varchar(50),
	`ordem` int DEFAULT 0,
	`programId` int,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trilhas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `turmas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(100),
	`name` varchar(255) NOT NULL,
	`programId` int NOT NULL,
	`year` int NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `turmas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upload_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weekNumber` int NOT NULL,
	`year` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`programId` int,
	`status` enum('pending','processing','completed','error') NOT NULL DEFAULT 'pending',
	`notes` text,
	`totalRecords` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `upload_batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uploaded_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileType` enum('sebraeacre_mentorias','sebraeacre_eventos','sebraeto_mentorias','sebraeto_eventos','embrapii_mentorias','embrapii_eventos','performance') NOT NULL DEFAULT 'sebraeacre_mentorias',
	`fileSize` int,
	`rowCount` int,
	`columnCount` int,
	`status` enum('uploaded','processing','processed','error') NOT NULL DEFAULT 'uploaded',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `uploaded_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','manager') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `cpf` varchar(14);--> statement-breakpoint
ALTER TABLE `users` ADD `programId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `alunoId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `consultorId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `departmentId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` int DEFAULT 1 NOT NULL;