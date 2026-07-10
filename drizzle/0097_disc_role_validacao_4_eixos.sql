-- EcoDISC 360: a pergunta de validacao do Perfil do Cargo passa a ser 4
-- reguas independentes (uma por D/I/S/C), em vez de uma unica regua.
-- Nenhuma resposta real foi registrada ainda com a coluna antiga
-- (respostaValidacaoDireta), entao a troca e segura.
--
-- Migration manual (nao gerada via "pnpm db:generate"), mesmo padrao das
-- migrations anteriores (0087-0096).

ALTER TABLE disc_assessments DROP COLUMN respostaValidacaoDireta;
ALTER TABLE disc_assessments ADD COLUMN respostaValidacaoD INT NULL;
ALTER TABLE disc_assessments ADD COLUMN respostaValidacaoI INT NULL;
ALTER TABLE disc_assessments ADD COLUMN respostaValidacaoS INT NULL;
ALTER TABLE disc_assessments ADD COLUMN respostaValidacaoC INT NULL;
