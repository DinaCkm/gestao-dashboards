-- Migration: adicionar campo videoLink na tabela cases_sucesso
-- Permite que o aluno informe link de vídeo (YouTube ou Google Drive) como parte do Relatório de Impacto

ALTER TABLE `cases_sucesso`
  ADD COLUMN `videoLink` varchar(1000) DEFAULT NULL COMMENT 'Link de vídeo do case (YouTube não listado/confidencial ou Google Drive com permissão)';
