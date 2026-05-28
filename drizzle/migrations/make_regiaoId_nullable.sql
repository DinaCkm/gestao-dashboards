-- Migration: tornar regiaoId nullable nas tabelas do módulo Processo Seletivo
-- Executar no banco de produção via Railway console
-- Motivo: entrevistas são online, região é definida pela mentora/gestora após a entrevista

-- 1. Candidatos (pode já estar nullable se a migration anterior foi aplicada)
ALTER TABLE processo_candidatos MODIFY COLUMN regiaoId INT NULL;

-- 2. Grupos de agenda (era NOT NULL)
ALTER TABLE processo_agendas_grupo MODIFY COLUMN regiaoId INT NULL;

-- 3. Slots de agenda (era NOT NULL)
ALTER TABLE processo_agenda_slots MODIFY COLUMN regiaoId INT NULL;
