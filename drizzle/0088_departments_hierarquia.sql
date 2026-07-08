-- ============================================================
-- Estrutura Organizacional - Hierarquia de Departamentos
-- Fase 3.0: adiciona vinculo com programa/empresa, hierarquia
-- (departamento pai/filho) e reaproveita o campo managerId ja
-- existente como "lider do departamento" (referencia consultors.id).
-- Nao altera nenhuma outra tabela existente.
--
-- NOTA TECNICA: migration escrita manualmente, seguindo a mesma
-- decisao adotada na migration 0087 (snapshots do drizzle/meta
-- desatualizados desde a migration 0075). Journal atualizado a mao
-- com a entrada correspondente (idx 81, tag 0088_departments_hierarquia).
-- ============================================================

ALTER TABLE `departments` ADD COLUMN `programId` int;
--> statement-breakpoint
ALTER TABLE `departments` ADD COLUMN `parentDepartmentId` int;
--> statement-breakpoint
ALTER TABLE `departments` ADD COLUMN `isActive` int NOT NULL DEFAULT 1;
--> statement-breakpoint
CREATE INDEX `idx_departments_programId` ON `departments` (`programId`);
--> statement-breakpoint
CREATE INDEX `idx_departments_parentDepartmentId` ON `departments` (`parentDepartmentId`);
