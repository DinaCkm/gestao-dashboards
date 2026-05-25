-- Migration 0083: Fonte única de verdade para datas de contrato
-- Remove colunas de data duplicadas de contrato_niveis.
-- As datas passam a ser lidas de contratos_aluno via JOIN (periodoInicio / periodoTermino).
-- dataFechamentoOperacional e dataLimiteAjustes são calculadas em runtime pelo service.

ALTER TABLE contrato_niveis
  DROP COLUMN dataInicio,
  DROP COLUMN dataFim,
  DROP COLUMN dataFechamentoOperacional,
  DROP COLUMN dataLimiteAjustes;
