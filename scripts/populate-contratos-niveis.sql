-- ============================================================
-- SCRIPT DE POPULAÇÃO: contratos_aluno + contrato_niveis
-- Data: 2026-05-08
-- Objetivo: Criar contratos e estruturar níveis para todas as
--           empresas ativas (exceto BANRISUL e BRB)
-- ============================================================

-- REGRAS:
-- SEBRAE ACRE: início 10/10/2024, duração 2 anos (24 meses), 4 níveis de 6 meses cada
-- SEBRAE TO BS2 (turma 30003): início 20/04/2025, duração 1 ano (12 meses), 2 níveis
-- SEBRAE TO BS1 (turma 30005): início 01/05/2025, duração 1 ano (12 meses), 2 níveis
--   (alunos com 2 datas na planilha já estão no Nível II — Nível I encerrado)
-- SEBRAE TO BS3 (turma 30008): início 01/09/2025, duração 1 ano (12 meses), 2 níveis
-- EMBRAPII: início 24/03/2025, duração 1 ano (12 meses), 2 níveis
--   (alguns alunos têm datas diferentes — ver planilha)
-- CKM Talents: início 01/01/2026, duração 2 anos (24 meses), 4 níveis
-- DG ASSESSORIA: início 01/05/2026, duração 6 meses (1 nível)
-- BRB: início 01/05/2026, duração 6 meses (1 nível) — NÃO MEXER (contrato encerrado)

-- ============================================================
-- PARTE 1: CORRIGIR JULIA (vincular ao programa CKM)
-- ============================================================
UPDATE alunos SET programId = 90002 WHERE id = 660014;

-- ============================================================
-- PARTE 2: CRIAR contratos_aluno PARA ALUNOS SEM CONTRATO
-- ============================================================

-- 2A. SEBRAE ACRE — todos os alunos (programId=16)
-- Início: 10/10/2024, Término: 09/10/2026 (2 anos)
INSERT INTO contratos_aluno (alunoId, programId, turmaId, periodoInicio, periodoTermino, totalSessoesContratadas, observacoes, criadoPor, isActive, createdAt, updatedAt)
SELECT a.id, a.programId, a.turmaId, '2024-10-10', '2026-10-09', 0, 'Contrato SEBRAE ACRE 2024-2026', 1, 1, NOW(), NOW()
FROM alunos a
JOIN programs p ON p.id = a.programId
WHERE p.name = 'SEBRAE ACRE' AND a.isActive = 1
AND a.id NOT IN (SELECT alunoId FROM contratos_aluno);

-- 2B. SEBRAE TO BS2 (turma 30003) — início 20/04/2025, 1 ano
INSERT INTO contratos_aluno (alunoId, programId, turmaId, periodoInicio, periodoTermino, totalSessoesContratadas, observacoes, criadoPor, isActive, createdAt, updatedAt)
SELECT a.id, a.programId, a.turmaId, '2025-04-20', '2026-04-19', 0, 'Contrato SEBRAE TO BS2 2025-2026', 1, 1, NOW(), NOW()
FROM alunos a
WHERE a.turmaId = 30003 AND a.isActive = 1
AND a.id NOT IN (SELECT alunoId FROM contratos_aluno);

-- 2C. SEBRAE TO BS1 (turma 30005) — início 01/05/2025, 1 ano
INSERT INTO contratos_aluno (alunoId, programId, turmaId, periodoInicio, periodoTermino, totalSessoesContratadas, observacoes, criadoPor, isActive, createdAt, updatedAt)
SELECT a.id, a.programId, a.turmaId, '2025-05-01', '2026-04-30', 0, 'Contrato SEBRAE TO BS1 2025-2026', 1, 1, NOW(), NOW()
FROM alunos a
WHERE a.turmaId = 30005 AND a.isActive = 1
AND a.id NOT IN (SELECT alunoId FROM contratos_aluno);

-- 2D. SEBRAE TO BS3 (turma 30008) — início 01/09/2025, 1 ano
INSERT INTO contratos_aluno (alunoId, programId, turmaId, periodoInicio, periodoTermino, totalSessoesContratadas, observacoes, criadoPor, isActive, createdAt, updatedAt)
SELECT a.id, a.programId, a.turmaId, '2025-09-01', '2026-08-31', 0, 'Contrato SEBRAE TO BS3 2025-2026', 1, 1, NOW(), NOW()
FROM alunos a
WHERE a.turmaId = 30008 AND a.isActive = 1
AND a.id NOT IN (SELECT alunoId FROM contratos_aluno);

-- 2E. EMBRAPII — início 24/03/2025, 1 ano
-- Alunos com datas especiais na planilha terão contratos individuais
-- Mayara Rodrigues: início 22/07/2025
-- Vanessa Bertholdo: início 15/10/2025
-- Alexandre Crepory: início 24/03/2025 (padrão)
-- Demais EMBRAPII: início 24/03/2025
INSERT INTO contratos_aluno (alunoId, programId, turmaId, periodoInicio, periodoTermino, totalSessoesContratadas, observacoes, criadoPor, isActive, createdAt, updatedAt)
SELECT a.id, a.programId, a.turmaId,
  CASE
    WHEN a.id = 30090 THEN '2025-07-22'  -- Mayara Rodrigues
    WHEN a.id = 30099 THEN '2025-10-15'  -- Vanessa Bertholdo
    ELSE '2025-03-24'
  END as periodoInicio,
  CASE
    WHEN a.id = 30090 THEN '2026-07-21'  -- Mayara Rodrigues
    WHEN a.id = 30099 THEN '2026-10-14'  -- Vanessa Bertholdo
    ELSE '2026-03-23'
  END as periodoTermino,
  0, 'Contrato EMBRAPII 2025-2026', 1, 1, NOW(), NOW()
FROM alunos a
JOIN programs p ON p.id = a.programId
WHERE p.name = 'EMBRAPII' AND a.isActive = 1
AND a.id NOT IN (SELECT alunoId FROM contratos_aluno);

-- 2F. CKM Talents — Julia Souza Makiyama (única sem contrato)
-- Início: 01/01/2026, duração 2 anos
INSERT INTO contratos_aluno (alunoId, programId, turmaId, periodoInicio, periodoTermino, totalSessoesContratadas, observacoes, criadoPor, isActive, createdAt, updatedAt)
SELECT a.id, 90002, NULL, '2026-01-01', '2027-12-31', 6, 'Contrato CKM Talents 2026-2027', 1, 1, NOW(), NOW()
FROM alunos a
WHERE a.id = 660014
AND a.id NOT IN (SELECT alunoId FROM contratos_aluno);

-- 2G. DG ASSESSORIA — Elio Puperi (único sem contrato)
-- Início: 01/05/2026, duração 6 meses
INSERT INTO contratos_aluno (alunoId, programId, turmaId, periodoInicio, periodoTermino, totalSessoesContratadas, observacoes, criadoPor, isActive, createdAt, updatedAt)
SELECT a.id, a.programId, a.turmaId, '2026-05-01', '2026-10-31', 0, 'Contrato DG ASSESSORIA 2026', 1, 1, NOW(), NOW()
FROM alunos a
WHERE a.id = 570089
AND a.id NOT IN (SELECT alunoId FROM contratos_aluno);

-- ============================================================
-- PARTE 3: VINCULAR contrato_niveis AO contrato correto
-- Atualizar contratoId=0 para o ID do contrato real
-- ============================================================

-- Para cada aluno, atualizar o contrato_niveis com o menor ID para apontar para o contrato ativo
UPDATE contrato_niveis cn
JOIN (
  SELECT ca.alunoId, ca.id as contrato_id
  FROM contratos_aluno ca
  WHERE ca.isActive = 1
) c ON c.alunoId = cn.alunoId
SET cn.contratoId = c.contrato_id
WHERE cn.contratoId = 0
AND cn.id = (
  SELECT MIN(id2) FROM (SELECT id as id2 FROM contrato_niveis WHERE alunoId = cn.alunoId) t
);

-- ============================================================
-- PARTE 4: DELETAR REGISTROS DUPLICADOS em contrato_niveis
-- Manter apenas o registro com menor ID por aluno+nivel
-- que está vinculado ao PDI ou onboarding
-- ============================================================

-- Deletar duplicatas: registros com ID > MIN(id) por aluno+nivel
-- que NÃO estão referenciados por assessment_pdi ou onboarding_jornada
DELETE FROM contrato_niveis
WHERE id NOT IN (
  -- Manter o menor ID por aluno+nivel
  SELECT min_id FROM (
    SELECT MIN(id) as min_id FROM contrato_niveis GROUP BY alunoId, nivel
  ) t
)
AND id NOT IN (
  -- Manter os referenciados por assessment_pdi
  SELECT DISTINCT contratoNivelId FROM assessment_pdi WHERE contratoNivelId IS NOT NULL
)
AND id NOT IN (
  -- Manter os referenciados por onboarding_jornada
  SELECT DISTINCT contratoNivelId FROM onboarding_jornada WHERE contratoNivelId IS NOT NULL
);

-- ============================================================
-- PARTE 5: CRIAR NÍVEL II para alunos SEBRAE TO BS1 (já no Nível II)
-- Esses alunos têm Nível I encerrado e precisam do Nível II
-- ============================================================

-- SEBRAE TO BS1 (turma 30005) — Nível I encerrado, criar Nível II
INSERT INTO contrato_niveis (contratoId, alunoId, nivel, status, mentoraPrincipalId, createdAt, updatedAt)
SELECT ca.id, a.id, 'II', 'em_andamento', NULL, NOW(), NOW()
FROM alunos a
JOIN contratos_aluno ca ON ca.alunoId = a.id AND ca.isActive = 1
WHERE a.turmaId = 30005
AND a.id NOT IN (
  SELECT DISTINCT alunoId FROM contrato_niveis WHERE nivel = 'II'
);

-- ============================================================
-- PARTE 6: CRIAR NÍVEL II para alunos CKM com Nível I encerrado
-- (Adriana Deus, Sucesso de Souza, Maravilhosa, Maria do Carmo, Andressa)
-- ============================================================

INSERT INTO contrato_niveis (contratoId, alunoId, nivel, status, mentoraPrincipalId, createdAt, updatedAt)
SELECT ca.id, a.id, 'II', 'em_andamento', cn_i.mentoraPrincipalId, NOW(), NOW()
FROM alunos a
JOIN programs p ON p.id = a.programId
JOIN contratos_aluno ca ON ca.alunoId = a.id AND ca.isActive = 1
JOIN contrato_niveis cn_i ON cn_i.alunoId = a.id AND cn_i.nivel = 'I'
WHERE p.name = 'Ckm Talents' AND a.isActive = 1
AND cn_i.status = 'encerrado'
AND a.id NOT IN (
  SELECT DISTINCT alunoId FROM contrato_niveis WHERE nivel = 'II'
);

-- ============================================================
-- PARTE 7: CRIAR NÍVEIS FUTUROS para SEBRAE ACRE (4 níveis)
-- Nível II, III, IV — status 'planejado' (ainda não iniciados)
-- ============================================================

-- Nível II SEBRAE ACRE (início: 10/04/2025, mas como status futuro)
INSERT INTO contrato_niveis (contratoId, alunoId, nivel, status, mentoraPrincipalId, createdAt, updatedAt)
SELECT ca.id, a.id, 'II', 'planejado', NULL, NOW(), NOW()
FROM alunos a
JOIN programs p ON p.id = a.programId
JOIN contratos_aluno ca ON ca.alunoId = a.id AND ca.isActive = 1
WHERE p.name = 'SEBRAE ACRE' AND a.isActive = 1
AND a.id NOT IN (
  SELECT DISTINCT alunoId FROM contrato_niveis WHERE nivel = 'II'
);

-- Nível III SEBRAE ACRE
INSERT INTO contrato_niveis (contratoId, alunoId, nivel, status, mentoraPrincipalId, createdAt, updatedAt)
SELECT ca.id, a.id, 'III', 'planejado', NULL, NOW(), NOW()
FROM alunos a
JOIN programs p ON p.id = a.programId
JOIN contratos_aluno ca ON ca.alunoId = a.id AND ca.isActive = 1
WHERE p.name = 'SEBRAE ACRE' AND a.isActive = 1
AND a.id NOT IN (
  SELECT DISTINCT alunoId FROM contrato_niveis WHERE nivel = 'III'
);

-- Nível IV SEBRAE ACRE
INSERT INTO contrato_niveis (contratoId, alunoId, nivel, status, mentoraPrincipalId, createdAt, updatedAt)
SELECT ca.id, a.id, 'IV', 'planejado', NULL, NOW(), NOW()
FROM alunos a
JOIN programs p ON p.id = a.programId
JOIN contratos_aluno ca ON ca.alunoId = a.id AND ca.isActive = 1
WHERE p.name = 'SEBRAE ACRE' AND a.isActive = 1
AND a.id NOT IN (
  SELECT DISTINCT alunoId FROM contrato_niveis WHERE nivel = 'IV'
);

-- ============================================================
-- PARTE 8: CRIAR NÍVEL II para SEBRAE TO BS2 e EMBRAPII
-- (contrato de 1 ano = 2 níveis, Nível II futuro)
-- ============================================================

-- Nível II SEBRAE TO BS2 (turma 30003)
INSERT INTO contrato_niveis (contratoId, alunoId, nivel, status, mentoraPrincipalId, createdAt, updatedAt)
SELECT ca.id, a.id, 'II', 'planejado', NULL, NOW(), NOW()
FROM alunos a
JOIN contratos_aluno ca ON ca.alunoId = a.id AND ca.isActive = 1
WHERE a.turmaId = 30003
AND a.id NOT IN (
  SELECT DISTINCT alunoId FROM contrato_niveis WHERE nivel = 'II'
);

-- Nível II SEBRAE TO BS3 (turma 30008) — já em andamento (Nível I em_andamento)
-- Nível II será criado quando o reset acontecer (automático pelo código)

-- Nível II EMBRAPII
INSERT INTO contrato_niveis (contratoId, alunoId, nivel, status, mentoraPrincipalId, createdAt, updatedAt)
SELECT ca.id, a.id, 'II', 'planejado', NULL, NOW(), NOW()
FROM alunos a
JOIN programs p ON p.id = a.programId
JOIN contratos_aluno ca ON ca.alunoId = a.id AND ca.isActive = 1
WHERE p.name = 'EMBRAPII' AND a.isActive = 1
AND a.id NOT IN (
  SELECT DISTINCT alunoId FROM contrato_niveis WHERE nivel = 'II'
);

-- ============================================================
-- PARTE 9: CRIAR NÍVEIS FUTUROS para CKM Talents (4 níveis)
-- Nível III e IV — status 'planejado'
-- ============================================================

-- Nível III CKM
INSERT INTO contrato_niveis (contratoId, alunoId, nivel, status, mentoraPrincipalId, createdAt, updatedAt)
SELECT ca.id, a.id, 'III', 'planejado', NULL, NOW(), NOW()
FROM alunos a
JOIN programs p ON p.id = a.programId
JOIN contratos_aluno ca ON ca.alunoId = a.id AND ca.isActive = 1
WHERE p.name = 'Ckm Talents' AND a.isActive = 1
AND a.id NOT IN (
  SELECT DISTINCT alunoId FROM contrato_niveis WHERE nivel = 'III'
);

-- Nível IV CKM
INSERT INTO contrato_niveis (contratoId, alunoId, nivel, status, mentoraPrincipalId, createdAt, updatedAt)
SELECT ca.id, a.id, 'IV', 'planejado', NULL, NOW(), NOW()
FROM alunos a
JOIN programs p ON p.id = a.programId
JOIN contratos_aluno ca ON ca.alunoId = a.id AND ca.isActive = 1
WHERE p.name = 'Ckm Talents' AND a.isActive = 1
AND a.id NOT IN (
  SELECT DISTINCT alunoId FROM contrato_niveis WHERE nivel = 'IV'
);

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT p.name as empresa, COUNT(DISTINCT a.id) as total_alunos,
       COUNT(DISTINCT ca.id) as total_contratos,
       COUNT(cn.id) as total_niveis
FROM alunos a
JOIN programs p ON p.id = a.programId
LEFT JOIN contratos_aluno ca ON ca.alunoId = a.id AND ca.isActive = 1
LEFT JOIN contrato_niveis cn ON cn.alunoId = a.id
WHERE p.name NOT IN ('BANRISUL', 'BRB - BANCO DE BRASILIA')
AND a.isActive = 1
GROUP BY p.name
ORDER BY p.name;
