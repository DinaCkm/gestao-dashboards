ALTER TABLE `alunos` ADD `onboardingLiberado` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `alunos` ADD `onboardingLiberadoEm` timestamp;--> statement-breakpoint
ALTER TABLE `onboarding_jornada` ADD `ciclo` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `onboarding_jornada` ADD `cadastroConfirmado` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `onboarding_jornada` ADD `cadastroConfirmadoEm` timestamp;