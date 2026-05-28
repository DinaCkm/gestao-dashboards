-- Migration: tornar regiaoId nullable em processo_candidatos
-- A região agora é definida pela mentora/gestora após a entrevista, não pelo candidato no cadastro
ALTER TABLE processo_candidatos MODIFY COLUMN regiaoId INT NULL;
