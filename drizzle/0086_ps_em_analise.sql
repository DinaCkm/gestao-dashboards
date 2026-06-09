-- Adicionar 'em_analise' ao enum statusResultado em processo_candidatos
ALTER TABLE `processo_candidatos`
  MODIFY COLUMN `statusResultado`
    enum('pendente','aprovado','reprovado','em_analise','suplente','desistente')
    NOT NULL DEFAULT 'pendente';

-- Adicionar 'em_analise' ao enum resultado em processo_resultados
ALTER TABLE `processo_resultados`
  MODIFY COLUMN `resultado`
    enum('pendente','aprovado','reprovado','em_analise','suplente','desistente')
    NOT NULL DEFAULT 'pendente';
