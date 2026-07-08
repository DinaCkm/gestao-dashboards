-- ============================================================
-- EcoDISC 360 - Correcao: Diretor e um CARGO, nao um novo tipo
-- de avaliacao DISC (Fase 2.1 - correcao)
--
-- A migration 0089 havia adicionado "diretor" como um novo valor
-- de assessmentType. Apos revisao, ficou definido que o DISC
-- individual de um diretor usa o mesmo tipo "empregado" que
-- qualquer colaborador - a diferenca esta no CARGO da pessoa
-- (disc_role_profiles), nao no tipo de avaliacao. O Perfil da
-- Diretoria sera montado por selecao manual de quais avaliacoes
-- (via orgProfileId, campo ja existente) entram na media -
-- mecanismo que ja era suportado, sem precisar de novo tipo.
-- Esta migration reverte o valor "diretor" do enum.
-- ============================================================

ALTER TABLE `disc_assessments` MODIFY COLUMN `assessmentType` enum('empregado','cargo','empresa','diretoria') NOT NULL;
