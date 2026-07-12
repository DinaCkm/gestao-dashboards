-- Migration: Adicionar permissões de disco360 a todos os admins
-- Data: 2026-07-12
-- Descrição: Sincroniza todos os caminhos do módulo EcoDISC 360 às permissões
--            de página dos usuários administradores

-- Lista completa de rotas do módulo EcoDISC 360
-- Isso garante que quando um admin acessa o painel, ele vê o menu "EcoDISC 360"

-- Para cada admin, adicionar (ou manter) as rotas disc360 nas permissões
-- Se a tabela admin_page_permissions não tiver dados, INSERT. Se tiver, UPDATE.

-- Primeiro, garantir que a tabela existe
CREATE TABLE IF NOT EXISTS admin_page_permissions (
  userId INT NOT NULL PRIMARY KEY,
  permissions JSON NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Definir as rotas do disco360 que devem estar disponíveis
-- @var disco360_routes - JSON array com todas as rotas do módulo
SET @disco360_routes = JSON_ARRAY(
  '/disc360',
  '/disc360/perfis-empresa',
  '/disc360/responder-convite/:token',
  '/disc360/estrutura-organizacional',
  '/disc360/dashboard-cultura/:orgProfileId',
  '/disc360/relatorio-cultura/:orgProfileId',
  '/disc360/perfis-cargo',
  '/disc360/responder-convite-cargo/:token',
  '/disc360/relatorio-cargo/:cargoProfileId',
  '/disc360/dashboard-cargo',
  '/disc360/resultado-match',
  '/disc360/aplicacoes',
  '/disc360/relatorio-individual/:alunoId'
);

-- Para cada usuário admin (role='admin' ou role='admin2'), sincronizar as permissões
-- Strategy: 
-- 1. Se não tem registro: INSERT com as rotas disco360
-- 2. Se tem registro: UPDATE para adicionar as rotas disco360 (merge com existentes)

-- Passo 1: Inserir para admins que ainda não têm permissões cadastradas
INSERT INTO admin_page_permissions (userId, permissions)
SELECT u.id, @disco360_routes
FROM users u
WHERE (u.role = 'admin' OR u.role = 'admin2')
  AND u.id NOT IN (SELECT userId FROM admin_page_permissions)
ON DUPLICATE KEY UPDATE permissions = @disco360_routes;

-- Passo 2: Para admins que já têm permissões, fazer merge (adicionar disco360 se não tiverem)
UPDATE admin_page_permissions app
SET app.permissions = JSON_ARRAY_APPEND(
  CASE 
    -- Se já contém /disc360, não fazer nada (retornar o JSON atual)
    WHEN JSON_CONTAINS(app.permissions, JSON_QUOTE('/disc360')) THEN app.permissions
    -- Caso contrário, fazer append de todas as rotas disco360
    ELSE JSON_ARRAY_CONCAT(app.permissions, @disco360_routes)
  END,
  '$'
)
WHERE app.userId IN (
  SELECT u.id FROM users u WHERE (u.role = 'admin' OR u.role = 'admin2')
);

