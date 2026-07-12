-- Migration: Adicionar /disc360 às permissões de admin_page_permissions
-- Data: 12 de julho de 2026
-- Descrição: Garante que todos os admins tenham acesso ao módulo EcoDISC 360

-- Adicionar /disc360 às permissões de todos os admins que não têm
UPDATE admin_page_permissions 
SET permissions = JSON_ARRAY_APPEND(permissions, '$', '/disc360') 
WHERE NOT JSON_CONTAINS(permissions, JSON_QUOTE('/disc360'));

-- Verificar o resultado
SELECT userId, permissions FROM admin_page_permissions;
