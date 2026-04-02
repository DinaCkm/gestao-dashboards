-- Relatório de Performance por Aluno
-- Extrai: Aluno, Empresa, 6 Indicadores, Performance Geral
-- Parâmetros: @alunoId (opcional), @programId (opcional)

SELECT 
  -- Informações Básicas
  a.id AS alunoId,
  a.name AS alunoNome,
  a.email AS alunoEmail,
  p.id AS empresaId,
  p.name AS empresaNome,
  
  -- Indicador 1: Webinars (Progresso em Aulas)
  COALESCE(ROUND(AVG(sp.progressoTotal), 0), 0) AS ind1_webinars,
  
  -- Indicador 2: Avaliações (Média de Avaliações Finais)
  COALESCE(ROUND(AVG(sp.mediaAvaliacoesFinais), 0), 0) AS ind2_avaliacoes,
  
  -- Indicador 3: Competências (Completude - % de competências com progresso > 80%)
  COALESCE(
    ROUND(
      (COUNT(CASE WHEN sp.progressoTotal >= 80 THEN 1 END) * 100.0) / 
      NULLIF(COUNT(sp.id), 0),
      0
    ),
    0
  ) AS ind3_competencias,
  
  -- Indicador 4: Tarefas (% de tarefas validadas)
  COALESCE(
    ROUND(
      (COUNT(CASE WHEN ms.taskStatus = 'validada' THEN 1 END) * 100.0) / 
      NULLIF(COUNT(CASE WHEN ms.taskStatus IS NOT NULL THEN 1 END), 0),
      0
    ),
    0
  ) AS ind4_tarefas,
  
  -- Indicador 5: Engajamento (Média de Engagement Score)
  COALESCE(ROUND(AVG(ms.engagementScore), 0), 0) AS ind5_engajamento,
  
  -- Indicador 6: Aplicabilidade (Média de Nota da Mentora em Aplicabilidade)
  COALESCE(ROUND(AVG(ms.notaMentoraAplicabilidade), 0), 0) AS ind6_aplicabilidade,
  
  -- Performance Geral (Média dos 6 indicadores)
  COALESCE(
    ROUND(
      (
        COALESCE(ROUND(AVG(sp.progressoTotal), 0), 0) +
        COALESCE(ROUND(AVG(sp.mediaAvaliacoesFinais), 0), 0) +
        COALESCE(
          ROUND(
            (COUNT(CASE WHEN sp.progressoTotal >= 80 THEN 1 END) * 100.0) / 
            NULLIF(COUNT(sp.id), 0),
            0
          ),
          0
        ) +
        COALESCE(
          ROUND(
            (COUNT(CASE WHEN ms.taskStatus = 'validada' THEN 1 END) * 100.0) / 
            NULLIF(COUNT(CASE WHEN ms.taskStatus IS NOT NULL THEN 1 END), 0),
            0
          ),
          0
        ) +
        COALESCE(ROUND(AVG(ms.engagementScore), 0), 0) +
        COALESCE(ROUND(AVG(ms.notaMentoraAplicabilidade), 0), 0)
      ) / 6,
      0
    ),
    0
  ) AS performanceGeral,
  
  -- Data/Hora de Emissão
  NOW() AS dataEmissao,
  DATE_FORMAT(NOW(), '%d/%m/%Y %H:%i:%s') AS dataEmissaoFormatada

FROM alunos a
LEFT JOIN programs p ON a.programId = p.id
LEFT JOIN student_performance sp ON a.id = sp.alunoId AND p.id = sp.competenciaId
LEFT JOIN mentoring_sessions ms ON a.id = ms.alunoId

WHERE 
  a.isActive = 1
  AND p.isActive = 1
  AND (a.id = @alunoId OR @alunoId IS NULL)
  AND (p.id = @programId OR @programId IS NULL)

GROUP BY 
  a.id, a.name, a.email, p.id, p.name

ORDER BY 
  p.name, a.name;
