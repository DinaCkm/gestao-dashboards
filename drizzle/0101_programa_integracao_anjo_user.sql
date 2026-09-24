-- ============================================================================
-- 0101_programa_integracao_anjo_user.sql
-- Programa de Integração — vínculo opcional do Colaborador Anjo com users.
--
-- IMPORTANTE:
-- - Alteração aditiva e compatível com os processos existentes.
-- - Preserva integralmente anjo e anjoEmail.
-- - Não altera role, alunoId, consultorId ou qualquer outro perfil de acesso.
-- - Não cria chave estrangeira rígida para evitar acoplamento e efeitos em users.
-- - anjoUserId pode permanecer NULL em todos os processos históricos.
-- ============================================================================

ALTER TABLE `programa_integracao_processos`
  ADD COLUMN `anjoUserId` int DEFAULT NULL AFTER `anjoEmail`;
--> statement-breakpoint
CREATE INDEX `idx_pi_processos_anjo_user`
  ON `programa_integracao_processos` (`anjoUserId`);
