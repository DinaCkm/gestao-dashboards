ALTER TABLE `onboarding_jornada`
  ADD COLUMN `contratoNivelId` int NULL AFTER `alunoId`;

ALTER TABLE `disc_resultados`
  ADD COLUMN `contratoNivelId` int NULL AFTER `alunoId`;

ALTER TABLE `autopercepcoes_competencias`
  ADD COLUMN `contratoNivelId` int NULL AFTER `alunoId`;

ALTER TABLE `assessment_pdi`
  ADD COLUMN `contratoNivelId` int NULL AFTER `alunoId`;
