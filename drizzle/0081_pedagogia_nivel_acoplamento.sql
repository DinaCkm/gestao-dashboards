ALTER TABLE `plano_individual`
  ADD COLUMN `contratoNivelId` int NULL AFTER `alunoId`;

ALTER TABLE `mentoring_sessions`
  ADD COLUMN `contratoNivelId` int NULL AFTER `alunoId`;

ALTER TABLE `event_participation`
  ADD COLUMN `contratoNivelId` int NULL AFTER `alunoId`;

ALTER TABLE `metas`
  ADD COLUMN `contratoNivelId` int NULL AFTER `alunoId`;

ALTER TABLE `cases_sucesso`
  ADD COLUMN `contratoNivelId` int NULL AFTER `alunoId`;
