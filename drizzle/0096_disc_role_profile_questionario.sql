-- EcoDISC 360: suporte ao Questionario de Perfil do Cargo (mesmo modelo
-- ipsativo mais/menos ja usado na Cultura da Empresa, com dois respondentes
-- fixos por cargo: lider e empregado) + pergunta de validacao objetiva
-- (regua 0-100) para checar tendenciosidade das respostas.
--
-- Migration manual (nao gerada via "pnpm db:generate"), mesmo padrao das
-- migrations anteriores (0087-0095).

ALTER TABLE disc_assessments ADD COLUMN papelRespondente ENUM('lider','empregado') NULL;
ALTER TABLE disc_assessments ADD COLUMN respostaValidacaoDireta INT NULL;

CREATE TABLE disc_role_survey_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assessmentId INT NOT NULL,
  questionId VARCHAR(20) NOT NULL,
  maisId VARCHAR(20) NOT NULL,
  menosId VARCHAR(20) NOT NULL,
  maisDimensao ENUM('D','I','S','C') NOT NULL,
  menosDimensao ENUM('D','I','S','C') NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
