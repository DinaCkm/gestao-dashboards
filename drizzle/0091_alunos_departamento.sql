-- Bloco 3.1 do EcoDISC 360: vincula o aluno/colaborador a um Departamento.
-- O campo "cargo" (texto livre) ja existia na tabela alunos e nao precisa de migration.
-- O Lider do aluno nao e um campo novo: ele e derivado do Lider do departamento
-- (departments.managerId), que ja foi criado na migration 0088.
--
-- Migration manual (nao gerada via "pnpm db:generate") porque os snapshots do Drizzle
-- estao desatualizados desde a migration 0075. Ver o cabecalho das migrations 0087-0090
-- para o historico completo dessa decisao.

ALTER TABLE alunos ADD COLUMN departmentId int;
CREATE INDEX alunos_department_id_idx ON alunos (departmentId);
