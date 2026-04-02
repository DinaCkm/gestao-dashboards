# 🔴 Problema: Criação de Atividades Não Funciona

## Status Atual
✅ **Funcionando:**
- Seleção de competência
- Seleção de curso
- Interface do formulário de atividades

❌ **Não Funcionando:**
- Inserção de atividades no banco de dados

## Descrição do Problema

Quando o usuário clica em "Criar Atividade", a requisição é enviada ao backend, mas falha ao tentar inserir os dados na tabela `atividades_curso`.

### Erro Observado
```
message: "Conexao com banco indisponivel"
```

## Causa Raiz

Tentei 3 abordagens diferentes:

### ❌ Abordagem 1: Drizzle ORM (Falhou)
**Arquivo:** `server/routers.ts` linha ~8815

**Código:**
```typescript
const result = await database.insert(atividadesCurso).values({
  cursoId: Number(input.cursoId),
  titulo: input.titulo.trim(),
  tipoAtividade: input.tipoAtividade as any,
  urlGenially: urlFinal,
  urlMidia: urlFinal,
  descricao: input.descricao?.trim() || null,
  ordem: Number(input.ordem ?? 0),
});
```

**Problema:** Drizzle está adicionando automaticamente campos com defaults (`isActive`, `createdAt`, `updatedAt`) mesmo que não sejam fornecidos, causando erro de constraint.

**SQL gerado:**
```sql
INSERT INTO atividades_curso (id, cursoId, titulo, tipoAtividade, urlGenially, urlMidia, descricao, ordem, isActive, createdAt, updatedAt) 
VALUES (default, ?, ?, ?, ?, ?, ?, ?, default, default, default)
```

### ❌ Abordagem 2: SQL Raw com Drizzle (Falhou)
**Arquivo:** `server/routers.ts` linha ~8828

**Código:**
```typescript
const { sql } = await import('drizzle-orm');
const result = await database.execute(
  sql`INSERT INTO atividades_curso (cursoId, titulo, tipoAtividade, urlGenially, urlMidia, descricao, ordem) 
      VALUES (${...})`
);
```

**Problema:** Mesmo resultado - Drizzle continua adicionando campos extras.

### ❌ Abordagem 3: MySQL2 Puro (Falhou)
**Arquivo:** `server/db.ts` linha ~67 e `server/routers.ts` linha ~8825

**Código:**
```typescript
const conn = await db.getRawConnection();
const query = `INSERT INTO atividades_curso (cursoId, titulo, tipoAtividade, urlGenially, urlMidia, descricao, ordem) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
const [result] = await conn.execute(query, [...]);
```

**Problema:** Conexão SSL não consegue se conectar ao TiDB Cloud.
```
Error: Connections using insecure transport are prohibited
```

Mesmo com `ssl: 'amazon'` configurado, não funciona.

## Soluções Possíveis

### ✅ Solução 1: Remover Defaults do Schema (RECOMENDADO)
**Dificuldade:** Baixa | **Tempo:** 5 minutos

**O que fazer:**
1. Abrir `drizzle/schema.ts`
2. Encontrar a definição de `atividadesCurso` (linha ~1360)
3. Remover `.defaultNow()` de `createdAt` e `updatedAt`
4. Remover `.default(true)` de `isActive`
5. Executar `pnpm db:push`

**Código antes:**
```typescript
export const atividadesCurso = mysqlTable('atividades_curso', {
  id: int('id').primaryKey().autoincrement(),
  cursoId: int('cursoId').notNull(),
  titulo: text('titulo').notNull(),
  tipoAtividade: mysqlEnum('tipoAtividade', [...]).notNull(),
  urlGenially: text('urlGenially'),
  urlMidia: text('urlMidia'),
  descricao: text('descricao'),
  ordem: int('ordem').default(0),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});
```

**Código depois:**
```typescript
export const atividadesCurso = mysqlTable('atividades_curso', {
  id: int('id').primaryKey().autoincrement(),
  cursoId: int('cursoId').notNull(),
  titulo: text('titulo').notNull(),
  tipoAtividade: mysqlEnum('tipoAtividade', [...]).notNull(),
  urlGenially: text('urlGenially'),
  urlMidia: text('urlMidia'),
  descricao: text('descricao'),
  ordem: int('ordem').default(0),
  isActive: boolean('isActive'),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
});
```

**Depois de fazer isso:**
- Remover a função `getRawConnection()` de `server/db.ts` (não será mais necessária)
- Voltar o código em `server/routers.ts` para usar Drizzle ORM simples (Abordagem 1)

---

### ✅ Solução 2: Usar Triggers no Banco de Dados
**Dificuldade:** Média | **Tempo:** 10 minutos

**O que fazer:**
1. Criar um trigger no banco que preenche `createdAt`, `updatedAt` e `isActive` automaticamente
2. Manter o código do backend simples

**SQL para executar no banco:**
```sql
CREATE TRIGGER atividades_curso_insert 
BEFORE INSERT ON atividades_curso 
FOR EACH ROW 
BEGIN
  IF NEW.isActive IS NULL THEN
    SET NEW.isActive = true;
  END IF;
  IF NEW.createdAt IS NULL THEN
    SET NEW.createdAt = NOW();
  END IF;
  IF NEW.updatedAt IS NULL THEN
    SET NEW.updatedAt = NOW();
  END IF;
END;
```

**Vantagem:** Garante consistência no banco
**Desvantagem:** Requer acesso direto ao banco

---

### ✅ Solução 3: Preencher Valores no Backend
**Dificuldade:** Baixa | **Tempo:** 5 minutos

**O que fazer:**
Modificar o código em `server/routers.ts` para preencher os campos manualmente:

```typescript
const result = await database.insert(atividadesCurso).values({
  cursoId: Number(input.cursoId),
  titulo: input.titulo.trim(),
  tipoAtividade: input.tipoAtividade as any,
  urlGenially: urlFinal,
  urlMidia: urlFinal,
  descricao: input.descricao?.trim() || null,
  ordem: Number(input.ordem ?? 0),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

**Vantagem:** Simples, sem mudanças no banco
**Desvantagem:** Código mais verboso

---

## Próximos Passos

1. **Escolher uma solução** (recomendo a Solução 1)
2. **Implementar a solução**
3. **Testar criando uma atividade**
4. **Implementar listagem de atividades** (próxima feature)

## Arquivos Envolvidos

- `drizzle/schema.ts` - Definição das tabelas
- `server/db.ts` - Funções de banco de dados
- `server/routers.ts` - Procedures tRPC (linha ~8815)
- `client/src/pages/admin/AdminAtividades.tsx` - Interface do usuário

## Dúvidas?

Se tiver dúvidas, procure por:
- `[criarAtividade]` nos logs para ver exatamente o que está sendo enviado
- `atividades_curso` no schema para ver a estrutura da tabela
