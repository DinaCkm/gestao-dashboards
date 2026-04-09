DROP TABLE `activities`;--> statement-breakpoint
DROP TABLE `activity_registrations`;--> statement-breakpoint
DROP TABLE `activity_turmas`;--> statement-breakpoint
DROP TABLE `aluno_atividade_progresso`;--> statement-breakpoint
DROP TABLE `aluno_competencia_prorrogacao`;--> statement-breakpoint
DROP TABLE `aluno_curso_atribuido`;--> statement-breakpoint
DROP TABLE `aluno_modulo_avaliacao`;--> statement-breakpoint
DROP TABLE `aluno_modulo_progresso`;--> statement-breakpoint
DROP TABLE `aluno_modulo_relato`;--> statement-breakpoint
DROP TABLE `alunos`;--> statement-breakpoint
DROP TABLE `announcements`;--> statement-breakpoint
DROP TABLE `appointment_participants`;--> statement-breakpoint
DROP TABLE `assessment_competencias`;--> statement-breakpoint
DROP TABLE `assessment_pdi`;--> statement-breakpoint
DROP TABLE `atividades_curso`;--> statement-breakpoint
DROP TABLE `autopercepcoes_competencias`;--> statement-breakpoint
DROP TABLE `avaliacoes_atividade`;--> statement-breakpoint
DROP TABLE `calculation_formulas`;--> statement-breakpoint
DROP TABLE `cases_sucesso`;--> statement-breakpoint
DROP TABLE `ciclo_competencias`;--> statement-breakpoint
DROP TABLE `ciclos_execucao`;--> statement-breakpoint
DROP TABLE `competencias`;--> statement-breakpoint
DROP TABLE `competencias_modulos`;--> statement-breakpoint
DROP TABLE `consultors`;--> statement-breakpoint
DROP TABLE `contratos_aluno`;--> statement-breakpoint
DROP TABLE `courses`;--> statement-breakpoint
DROP TABLE `cursos_competencias`;--> statement-breakpoint
DROP TABLE `dashboard_metrics`;--> statement-breakpoint
DROP TABLE `departments`;--> statement-breakpoint
DROP TABLE `disc_respostas`;--> statement-breakpoint
DROP TABLE `disc_resultados`;--> statement-breakpoint
DROP TABLE `email_alertas_log`;--> statement-breakpoint
DROP TABLE `event_participation`;--> statement-breakpoint
DROP TABLE `events`;--> statement-breakpoint
DROP TABLE `historico_nivel_competencia`;--> statement-breakpoint
DROP TABLE `in_app_notifications`;--> statement-breakpoint
DROP TABLE `mentor_appointments`;--> statement-breakpoint
DROP TABLE `mentor_availability`;--> statement-breakpoint
DROP TABLE `mentor_date_availability`;--> statement-breakpoint
DROP TABLE `mentor_session_pricing`;--> statement-breakpoint
DROP TABLE `mentor_session_type_pricing`;--> statement-breakpoint
DROP TABLE `mentora_contribuicoes`;--> statement-breakpoint
DROP TABLE `mentoring_sessions`;--> statement-breakpoint
DROP TABLE `meta_acompanhamento`;--> statement-breakpoint
DROP TABLE `metas`;--> statement-breakpoint
DROP TABLE `onboarding_jornada`;--> statement-breakpoint
DROP TABLE `onboarding_revisoes`;--> statement-breakpoint
DROP TABLE `onboarding_videos`;--> statement-breakpoint
DROP TABLE `performance_uploads`;--> statement-breakpoint
DROP TABLE `plano_individual`;--> statement-breakpoint
DROP TABLE `practical_activity_comments`;--> statement-breakpoint
DROP TABLE `processed_data`;--> statement-breakpoint
DROP TABLE `programs`;--> statement-breakpoint
DROP TABLE `reports`;--> statement-breakpoint
DROP TABLE `scheduled_webinars`;--> statement-breakpoint
DROP TABLE `student_performance`;--> statement-breakpoint
DROP TABLE `task_library`;--> statement-breakpoint
DROP TABLE `tentativas_avaliacao`;--> statement-breakpoint
DROP TABLE `trilhas`;--> statement-breakpoint
DROP TABLE `turmas`;--> statement-breakpoint
DROP TABLE `upload_batches`;--> statement-breakpoint
DROP TABLE `uploaded_files`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `passwordHash`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `cpf`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `programId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `alunoId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `consultorId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `departmentId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `isActive`;