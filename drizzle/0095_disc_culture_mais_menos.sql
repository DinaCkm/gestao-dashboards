-- EcoDISC 360: alinhar o questionario de Cultura da Empresa ao mesmo
-- modelo ipsativo (mais/menos) ja usado no DISC legado (Diretoria/Empregados),
-- para permitir eixos independentes de 0-100 (regua com linha em 50),
-- em vez do percentual de predominancia que somava 100%.
--
-- As respostas ja coletadas nao tem o "menos" registrado e sao descartadas
-- (dado de teste, remocao autorizada).
-- Migration manual (nao gerada via "pnpm db:generate"), mesmo padrao das
-- migrations anteriores (0087-0094).

DELETE FROM disc_culture_survey_answers;

ALTER TABLE disc_culture_survey_answers DROP COLUMN dimensaoEscolhida;
ALTER TABLE disc_culture_survey_answers ADD COLUMN maisId VARCHAR(20) NOT NULL AFTER questionId;
ALTER TABLE disc_culture_survey_answers ADD COLUMN menosId VARCHAR(20) NOT NULL AFTER maisId;
ALTER TABLE disc_culture_survey_answers ADD COLUMN maisDimensao ENUM('D','I','S','C') NOT NULL AFTER menosId;
ALTER TABLE disc_culture_survey_answers ADD COLUMN menosDimensao ENUM('D','I','S','C') NOT NULL AFTER maisDimensao;
