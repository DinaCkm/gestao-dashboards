# Migration: Sincronização de Permissões do Módulo EcoDISC 360

**Data:** 12 de Julho de 2026  
**Versão:** 1.0  
**Status:** ✅ Implementado e pronto para deploy

## Descrição

Este documento descreve a migration que sincroniza automaticamente as permissões de página do módulo **EcoDISC 360** para todos os usuários administradores (`admin` e `admin2`).

## Problema Resolvido

O módulo EcoDISC 360 não estava aparecendo no menu do administrador mesmo estando totalmente implementado no código. A causa raiz era que as rotas do módulo não estavam configuradas na tabela `admin_page_permissions` do banco de dados.

## Solução Implementada

### Arquivos Criados/Modificados

#### 1. **`server/migrations/disc360PermissionsMigration.ts`** (Novo)
- Função TypeScript que sincroniza as permissões automaticamente
- Exporta `syncDisc360Permissions(database)` que:
  - Cria a tabela `admin_page_permissions` se não existir
  - Insere registros para admins que ainda não têm permissões
  - Faz merge (adiciona disco360) para admins que já têm permissões cadastradas

#### 2. **`server/migrations/add_disc360_permissions.sql`** (Novo)
- Migration SQL pura (alternativa para execução manual)
- Pode ser executada diretamente no banco se necessário

#### 3. **`server/_core/index.ts`** (Modificado)
- Adicionado import: `import { syncDisc360Permissions } from "../migrations/disc360PermissionsMigration";`
- Adicionada chamada no startup do servidor (após garantir tabelas)
- A migration roda **automaticamente** sempre que o servidor inicia

## Rotas Sincronizadas

A seguinte lista de rotas do módulo EcoDISC 360 é sincronizada para todos os administradores:

```json
[
  "/disc360",
  "/disc360/perfis-empresa",
  "/disc360/responder-convite/:token",
  "/disc360/estrutura-organizacional",
  "/disc360/dashboard-cultura/:orgProfileId",
  "/disc360/relatorio-cultura/:orgProfileId",
  "/disc360/perfis-cargo",
  "/disc360/responder-convite-cargo/:token",
  "/disc360/relatorio-cargo/:cargoProfileId",
  "/disc360/dashboard-cargo",
  "/disc360/resultado-match",
  "/disc360/aplicacoes",
  "/disc360/relatorio-individual/:alunoId"
]
```

## Como Funciona

### Durante o Deploy

1. Servidor inicia (`server/_core/index.ts`)
2. Executa garantias de tabelas (ensureBibliotecaPedagogicaTables, etc)
3. **Chama `syncDisc360Permissions(database)`**
4. A migration:
   - Verifica se a tabela `admin_page_permissions` existe
   - Para cada usuário `admin` ou `admin2`:
     - Se não tem registro: cria com as rotas disco360
     - Se já tem: faz merge (adiciona disco360 se faltarem)
5. Registra no console: `[Disc360] Permissões sincronizadas para administradores.`

### Idempotência

A migration é **idempotente** - pode ser executada múltiplas vezes sem efeitos colaterais:
- Se as rotas já existem, não duplica
- Se um admin já tem `/disc360`, não adiciona novamente
- Se não tem nenhuma rota, sincroniza todas

## Próximos Passos

1. **Deploy**: Faça deploy dessa versão em produção
2. **Verificação**: Após o deploy, todo admin verá o menu "EcoDISC 360"
3. **Log do Servidor**: Procure por `[Disc360] Permissões sincronizadas para administradores.` nos logs

## Teste Local (Opcional)

Se quiser testar a migration antes do deploy, execute manualmente:

```bash
mysql -u usuario -p banco_dados < server/migrations/add_disc360_permissions.sql
```

## Rollback

Se precisar reverter, execute:

```sql
DELETE FROM admin_page_permissions WHERE permissions LIKE '%disc360%';
```

Ou remova as rotas específicas manualmente.

## Observações

- A migration roda **toda vez** que o servidor inicia, mas é idempotente
- Não há downtime necessário
- Não afeta usuários não-admin
- A sincronização é silenciosa (sem erro) se o banco não estiver disponível
- Logs de erro aparecem no console se algo der errado, mas não quebram o servidor

---

**Desenvolvido por:** Railway Agent  
**Teste em:** https://gestao-dashboards-production.up.railway.app

