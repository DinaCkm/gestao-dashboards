-- Migração manual: Reestruturação Trilhas/Ciclos/Contratos

-- 1. Adicionar campo isAssessment em mentoring_sessions
ALTER TABLE mentoring_sessions ADD COLUMN isAssessment int NOT NULL DEFAULT 0;

-- 2. Adicionar campos de nível em assessment_competencias
ALTER TABLE assessment_competencias ADD COLUMN nivelAtual decimal(5,2) DEFAULT NULL;
ALTER TABLE assessment_competencias ADD COLUMN metaFinal decimal(5,2) DEFAULT NULL;
ALTER TABLE assessment_competencias ADD COLUMN justificativa text DEFAULT NULL;

-- 3. Criar tabela contratos_aluno
CREATE TABLE IF NOT EXISTS contratos_aluno (
  id int AUTO_INCREMENT NOT NULL,
  alunoId int NOT NULL,
  programId int NOT NULL,
  turmaId int DEFAULT NULL,
  periodoInicio date NOT NULL,
  periodoTermino date NOT NULL,
  totalSessoesContratadas int NOT NULL,
  observacoes text DEFAULT NULL,
  criadoPor int DEFAULT NULL,
  isActive int NOT NULL DEFAULT 1,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT contratos_aluno_id PRIMARY KEY(id)
);

-- 4. Criar tabela historico_nivel_competencia
CREATE TABLE IF NOT EXISTS historico_nivel_competencia (
  id int AUTO_INCREMENT NOT NULL,
  assessmentCompetenciaId int NOT NULL,
  alunoId int NOT NULL,
  nivelAnterior decimal(5,2) DEFAULT NULL,
  nivelNovo decimal(5,2) NOT NULL,
  atualizadoPor int DEFAULT NULL,
  sessaoReferencia int DEFAULT NULL,
  observacao text DEFAULT NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT historico_nivel_competencia_id PRIMARY KEY(id)
);

-- 5. Migrar dados: marcar sessionNumber=1 como isAssessment=1
UPDATE mentoring_sessions SET isAssessment = 1 WHERE sessionNumber = 1;
