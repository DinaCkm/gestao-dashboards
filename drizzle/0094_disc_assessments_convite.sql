-- EcoDISC 360: convite de respondentes para o Perfil DISC da Empresa
-- (questionario de cultura) via link direto, sem exigir login no sistema.
--
-- Adiciona um token unico em disc_assessments para identificar o convite
-- (usado numa tela publica de resposta), e adiciona o status "pendente"
-- para representar um convite criado mas ainda nao respondido.
--
-- Migration manual (nao gerada via "pnpm db:generate") pelo mesmo motivo
-- documentado nas migrations anteriores (0087-0093).

ALTER TABLE disc_assessments ADD COLUMN conviteToken VARCHAR(64) NULL;
ALTER TABLE disc_assessments ADD UNIQUE INDEX idx_disc_assessments_convite_token (conviteToken);
ALTER TABLE disc_assessments MODIFY COLUMN status ENUM('pendente','rascunho','concluido','arquivado') NOT NULL DEFAULT 'rascunho';
