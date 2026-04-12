-- Alterar atividades_curso
ALTER TABLE `atividades_curso` ADD `tempo_estimado_minutos` int;
ALTER TABLE `atividades_curso` ADD `percentual_minimo_liberacao` int DEFAULT 60;
ALTER TABLE `atividades_curso` ADD `tempo_minimo_obrigatorio_segundos` int;
ALTER TABLE `atividades_curso` ADD `permitir_abertura_externa` tinyint DEFAULT 0;

-- Alterar aluno_atividade_progresso
ALTER TABLE `aluno_atividade_progresso` ADD `tempo_ativo_acumulado_segundos` int;
ALTER TABLE `aluno_atividade_progresso` ADD `tempo_minimo_exigido_segundos` int;
ALTER TABLE `aluno_atividade_progresso` ADD `ultimo_heartbeat_em` timestamp;
ALTER TABLE `aluno_atividade_progresso` ADD `tempo_cumprido_em` timestamp;
ALTER TABLE `aluno_atividade_progresso` ADD `liberado_para_avaliacao_em` timestamp;
ALTER TABLE `aluno_atividade_progresso` ADD `bloqueio_por_tempo` tinyint;

-- Criar tabela sessoes_estudo_atividade
CREATE TABLE `sessoes_estudo_atividade` (
	`id` serial PRIMARY KEY NOT NULL,
	`atividade_id` int NOT NULL,
	`aluno_id` int NOT NULL,
	`curso_atribuido_id` int NOT NULL,
	`iniciada_em` timestamp NOT NULL DEFAULT (now()),
	`encerrada_em` timestamp,
	`tempo_ativo_segundos` int DEFAULT 0,
	`status_sessao` varchar(50) DEFAULT 'ativa'
);
