-- EcoDISC 360: catalogo de Cargos por empresa/programa (lista unica, nao vinculada
-- a um Departamento especifico), pedido pela Dina para padronizar o campo Cargo
-- no cadastro do aluno (hoje texto livre) e servir de base para o Bloco 3.2
-- (Perfil DISC do Cargo).
--
-- Tambem documenta que departments.managerId passa a referenciar alunos.id
-- (qualquer aluno/colaborador da empresa), e nao mais consultors.id. Nao ha
-- necessidade de alterar o tipo da coluna (sempre foi um int simples, sem
-- constraint de FK), apenas o significado passou a ser outro. Verificado que
-- nenhum outro trecho do sistema depende do significado anterior.
--
-- Migration manual (nao gerada via "pnpm db:generate") pelo mesmo motivo
-- documentado nas migrations anteriores (0087-0092).

CREATE TABLE cargos (
  id int AUTO_INCREMENT PRIMARY KEY,
  programId int NOT NULL,
  name varchar(255) NOT NULL,
  description text,
  isActive int NOT NULL DEFAULT 1,
  createdAt timestamp NOT NULL DEFAULT (now())
);

CREATE INDEX cargos_program_id_idx ON cargos (programId);
