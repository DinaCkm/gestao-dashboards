# Relatório de Bug Crítico: Drizzle ORM e Queries Raw

## 1. O Problema Inicial
O redesenho da página P.D.I. exigiu a expansão do endpoint `resumoPlanoAluno` para buscar dados de múltiplas tabelas (webinares, tarefas, metas desafio, etc.). Para otimizar a performance, optamos por usar queries SQL raw.

O código implementado seguia este padrão:
```typescript
const [rows] = await database.execute(
  `SELECT * FROM tabela WHERE alunoId = ?`, 
  [input.alunoId]
);
```

**Sintoma:** O endpoint retornava `null` ou falhava silenciosamente. O painel de diagnóstico amarelo no frontend mostrava que todas as queries falhavam com o erro:
`Failed query: SELECT ... WHERE a.id = ? LIMIT 1 params:`

O `params:` vazio indicava que o parâmetro `alunoId` não estava sendo substituído no `?`.

## 2. Investigação e Dificuldades

### Tentativa 1: Correção de Schema
Inicialmente, acreditamos que o problema era devido a colunas inexistentes no banco de produção. De fato, encontramos duas inconsistências entre o schema local e o banco de produção:
1. `c.categoria` não existia na tabela `competencias`
2. O JOIN de cursos estava usando `courses` em vez de `cursos_competencias`

**Fracasso:** Corrigimos as queries (commit `175433b`), mas o erro `params:` vazio persistiu. As queries funcionavam perfeitamente quando executadas diretamente no MySQL, mas falhavam via código.

### Tentativa 2: Análise do Drizzle ORM
Fomos investigar o código-fonte do Drizzle ORM (`node_modules/drizzle-orm/mysql-core/db.js`) e descobrimos a causa raiz definitiva.

O método `execute` na classe principal do Drizzle é implementado assim:
```javascript
execute(query) {
  return this.session.execute(typeof query === "string" ? sql.raw(query) : query.getSQL());
}
```

**A Causa Raiz:** O método `database.execute()` do Drizzle ORM **aceita apenas um argumento**. Quando passamos `database.execute(sqlString, [params])`, o JavaScript ignora silenciosamente o segundo argumento `[params]`. Como resultado, a query é enviada ao banco exatamente com o caractere `?`, o que causa um erro de sintaxe SQL, pois o banco espera um valor.

## 3. A Solução Definitiva

Para executar queries raw com parâmetros posicionais (`?`) no Drizzle ORM usando o driver `mysql2`, precisamos acessar a conexão subjacente do pool MySQL2.

O Drizzle expõe o cliente original através da propriedade interna `$client`.

**Código Corrigido:**
```typescript
// 1. Obter a instância do banco
const database = await db.getDb();

// 2. Acessar o cliente mysql2 subjacente (pool)
const conn = (database as any).$client;

// 3. Executar a query usando o cliente mysql2, que suporta parâmetros
const [rows] = await conn.execute(
  `SELECT * FROM tabela WHERE alunoId = ?`, 
  [input.alunoId]
);
```

Aplicamos esta correção (commit `1f2e196`) nos três endpoints afetados:
1. `diagnosticoResumoPDI`
2. `resumoPlanoAluno`
3. `enviarPorEmail`

## 4. Próximos Passos
1. Aguardar o deploy no Railway (1-2 minutos)
2. Verificar se os novos cards (Mapa do Plano, Catálogo de Cursos, Webinares, Tarefas, Metas Desafio) aparecem corretamente na página P.D.I.
3. Testar o botão "Enviar P.D.I. por e-mail"
4. Remover o painel de diagnóstico amarelo do frontend
5. Implementar a tarefa pendente: adicionar `/admin/atribuir-cursos` no menu do mentor
