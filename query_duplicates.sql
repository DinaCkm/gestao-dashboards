SELECT 
  ap.alunoId,
  ac.competenciaId,
  COUNT(DISTINCT ap.id) as num_pdis,
  GROUP_CONCAT(DISTINCT CONCAT(ap.macroInicio, ' to ', ap.macroTermino)) as macro_jornadas
FROM assessment_pdi ap
JOIN assessment_competencias ac ON ac.assessmentPdiId = ap.id
GROUP BY ap.alunoId, ac.competenciaId
HAVING COUNT(DISTINCT ap.id) > 1
LIMIT 10;
