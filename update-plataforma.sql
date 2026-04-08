-- Script para atualizar plataformaAulas de todos os alunos baseado em suas empresas
-- SEBRAE TO, SEBRAE ACRE, EMBRAPII -> 'scaffold'
-- Outras empresas -> 'sistema_interno'

-- Atualizar alunos das empresas Scaffold
UPDATE alunos a
INNER JOIN programs p ON a.programId = p.id
SET a.plataformaAulas = 'scaffold'
WHERE p.name IN ('SEBRAE TO', 'SEBRAE ACRE', 'EMBRAPII');

-- Atualizar alunos de outras empresas (opcional - se houver)
UPDATE alunos a
INNER JOIN programs p ON a.programId = p.id
SET a.plataformaAulas = 'sistema_interno'
WHERE p.name NOT IN ('SEBRAE TO', 'SEBRAE ACRE', 'EMBRAPII')
AND a.plataformaAulas IS NULL;

-- Verificar resultados
SELECT 
  p.name as 'Empresa',
  COUNT(a.id) as 'Total de Alunos',
  COUNT(CASE WHEN a.plataformaAulas = 'scaffold' THEN 1 END) as 'Scaffold',
  COUNT(CASE WHEN a.plataformaAulas = 'sistema_interno' THEN 1 END) as 'Sistema Interno',
  COUNT(CASE WHEN a.plataformaAulas IS NULL THEN 1 END) as 'Sem Plataforma'
FROM alunos a
INNER JOIN programs p ON a.programId = p.id
GROUP BY p.id, p.name
ORDER BY COUNT(a.id) DESC;
