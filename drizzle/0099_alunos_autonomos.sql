-- ============================================================================
-- 0099_alunos_autonomos.sql
-- Funcionalidade: ALUNOS AUTÔNOMOS
--
-- Fluxo: Admin cria avaliação diagnóstica (10 questões) vinculada a um CURSO
--        -> libera o curso para um aluno -> gera link com token
--        -> aluno acessa, preenche ficha de cadastro, faz o teste diagnóstico
--        -> curso destrava no Mural -> aluno faz o curso -> vê performance
--
-- Estratégia: GENERALIZAR as tabelas de avaliação já existentes
--             (avaliacoes_atividade / tentativas_avaliacao) em vez de duplicar
--             lógica em tabelas paralelas.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. avaliacoes_atividade: passa a suportar avaliação DIAGNÓSTICA DE CURSO
--    - atividadeId vira opcional (NULL quando a avaliação é do curso, não da atividade)
--    - cursoId novo (preenchido apenas no diagnóstico inicial)
--    - tipo diferencia os dois usos
-- ---------------------------------------------------------------------------
ALTER TABLE `avaliacoes_atividade`
  MODIFY COLUMN `atividadeId` int NULL;

ALTER TABLE `avaliacoes_atividade`
  ADD COLUMN `cursoId` int NULL AFTER `atividadeId`;

ALTER TABLE `avaliacoes_atividade`
  ADD COLUMN `tipo` enum('atividade','diagnostico_inicial')
    NOT NULL DEFAULT 'atividade' AFTER `cursoId`;

-- Garante que todo registro legado permaneça marcado como avaliação de atividade
UPDATE `avaliacoes_atividade` SET `tipo` = 'atividade' WHERE `tipo` IS NULL;

CREATE INDEX `idx_avaliacoes_curso_tipo`
  ON `avaliacoes_atividade` (`cursoId`, `tipo`, `isActive`);

-- ---------------------------------------------------------------------------
-- 2. tentativas_avaliacao: passa a registrar também a tentativa do diagnóstico
-- ---------------------------------------------------------------------------
ALTER TABLE `tentativas_avaliacao`
  MODIFY COLUMN `atividadeId` int NULL;

ALTER TABLE `tentativas_avaliacao`
  ADD COLUMN `cursoId` int NULL AFTER `atividadeId`;

ALTER TABLE `tentativas_avaliacao`
  ADD COLUMN `tipo` enum('atividade','diagnostico_inicial')
    NOT NULL DEFAULT 'atividade' AFTER `cursoId`;

CREATE INDEX `idx_tentativas_diagnostico`
  ON `tentativas_avaliacao` (`alunoId`, `cursoId`, `tipo`);

-- ---------------------------------------------------------------------------
-- 3. aluno_curso_atribuido: novo status de espera + vínculo com o diagnóstico
--    'aguardando_avaliacao' = curso já reservado ao aluno, mas TRANCADO
--    até ele concluir o teste diagnóstico.
-- ---------------------------------------------------------------------------
ALTER TABLE `aluno_curso_atribuido`
  MODIFY COLUMN `status`
    enum('aguardando_avaliacao','nao_iniciado','em_progresso','concluido','prorrogado')
    NOT NULL DEFAULT 'nao_iniciado';

ALTER TABLE `aluno_curso_atribuido`
  ADD COLUMN `avaliacaoDiagnosticaId` int NULL AFTER `notaFinal`;

ALTER TABLE `aluno_curso_atribuido`
  ADD COLUMN `notaDiagnostica` decimal(5,2) NULL AFTER `avaliacaoDiagnosticaId`;

ALTER TABLE `aluno_curso_atribuido`
  ADD COLUMN `diagnosticoConcluidoEm` timestamp NULL AFTER `notaDiagnostica`;

-- ---------------------------------------------------------------------------
-- 4. aluno_acesso_token: link único de acesso do aluno autônomo (sem senha)
--    Mesmo padrão já usado em disc_assessments.conviteToken.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `aluno_acesso_token` (
  `id` int AUTO_INCREMENT NOT NULL,
  `alunoId` int NOT NULL,
  `cursoAtribuidoId` int NULL,
  `token` varchar(64) NOT NULL,
  `etapaAtual` enum('cadastro','avaliacao','liberado') NOT NULL DEFAULT 'cadastro',
  `expiraEm` timestamp NULL,
  `usadoPrimeiraVezEm` timestamp NULL,
  `ultimoAcessoEm` timestamp NULL,
  `isActive` int NOT NULL DEFAULT 1,
  `criadoPorUserId` int NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `aluno_acesso_token_id` PRIMARY KEY(`id`),
  CONSTRAINT `aluno_acesso_token_token_unique` UNIQUE(`token`)
);

CREATE INDEX `idx_acesso_token_aluno` ON `aluno_acesso_token` (`alunoId`, `isActive`);

-- ---------------------------------------------------------------------------
-- 5. alunos.tipoPortal: novo valor 'aluno_autonomo'
--    Campo já é varchar(50) — não requer alteração estrutural.
--    Valores em uso: 'desenvolvimento' | 'processo_seletivo' | 'aluno_autonomo'
-- ---------------------------------------------------------------------------
-- (sem DDL necessário)
