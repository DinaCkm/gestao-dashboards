-- Bloco 5 (revisado) do EcoDISC 360: consolidacao do Perfil DISC da Diretoria
-- a partir do DISC individual (legado) dos diretores selecionados pelo RH.
--
-- Esta migration NAO altera as tabelas do DISC legado (disc_respostas/disc_resultados).
-- Cria apenas uma tabela nova, propria do EcoDISC 360, para registrar quais alunos
-- foram selecionados como membros de uma Diretoria (disc_org_profiles).
--
-- Tambem adiciona "grupo_diretores" ao enum origemPerfil, para indicar que o perfil
-- foi calculado a partir do agrupamento dos DISCs individuais dos diretores.
--
-- Migration manual (nao gerada via "pnpm db:generate") pelo mesmo motivo documentado
-- nas migrations 0087-0091 (snapshots do Drizzle desatualizados desde a migration 0075).

ALTER TABLE disc_org_profiles MODIFY COLUMN origemPerfil enum('manual','questionario','grupo_diretores');

CREATE TABLE disc_diretoria_membros (
  id int AUTO_INCREMENT PRIMARY KEY,
  orgProfileId int NOT NULL,
  alunoId int NOT NULL,
  createdAt timestamp NOT NULL DEFAULT (now())
);

CREATE INDEX disc_diretoria_membros_org_profile_id_idx ON disc_diretoria_membros (orgProfileId);
CREATE UNIQUE INDEX disc_diretoria_membros_unico_idx ON disc_diretoria_membros (orgProfileId, alunoId);
