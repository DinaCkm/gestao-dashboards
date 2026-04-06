# 📋 Instruções para Diagnóstico - Execute no Management UI do Manus

**Você precisa executar essas queries no painel de controle do Manus. Siga exatamente esta ordem:**

---

## Como Acessar o Management UI

1. Abra o painel de controle do seu projeto Manus
2. Vá para a aba **"Database"** ou **"Database Panel"**
3. Você verá uma interface para executar SQL queries

---

## Queries a Executar (Na Ordem)

### Query 1: Contar Atividades
```sql
SELECT COUNT(*) as total FROM atividades_curso;
```
**Anote o resultado:** ___________

---

### Query 2: Listar Últimas 20 Atividades
```sql
SELECT id, cursoId, titulo, isActive 
FROM atividades_curso 
ORDER BY id DESC 
LIMIT 20;
```
**Anote os resultados:** ___________

---

### Query 3: Validar Vínculo com Cursos
```sql
SELECT a.id, a.cursoId, a.titulo, a.isActive, c.id as curso_existe
FROM atividades_curso a
LEFT JOIN cursos c ON c.id = a.cursoId
ORDER BY a.id DESC
LIMIT 20;
```
**Anote os resultados:** ___________

---

### Query 4: Contar por isActive
```sql
SELECT isActive, COUNT(*) as total
FROM atividades_curso
GROUP BY isActive;
```
**Anote os resultados:** ___________

---

### Query 5: Verificar Cursos
```sql
SELECT COUNT(*) as total FROM cursos;
```
**Anote o resultado:** ___________

---

### Query 6: Listar Últimos 10 Cursos
```sql
SELECT id, titulo 
FROM cursos 
ORDER BY id DESC 
LIMIT 10;
```
**Anote os resultados:** ___________

---

## Informações Adicionais Necessárias

1. **Qual é o `preDeployCommand` configurado no Railway?**
   - Vá para Settings → Railway
   - Procure por "preDeployCommand"
   - Anote o valor: ___________

2. **Qual banco está sendo usado?**
   - Verifique a DATABASE_URL
   - Anote o host/banco: ___________

3. **Qual é o NODE_ENV?**
   - Anote: ___________

---

## Após Executar as Queries

**Me envie:**
- Resultado do COUNT de atividades_curso
- As 20 últimas atividades (copie a tabela)
- O vínculo com cursos (copie a tabela)
- Contagem por isActive
- Total de cursos
- Últimos 10 cursos
- Valor do preDeployCommand
- Host do banco
- NODE_ENV

**Não altere nada no banco. Apenas leia os dados.**

---

## Critério de Diagnóstico

Baseado nos resultados:

- **Se COUNT = 0:** O problema é que a tabela está vazia (banco/dados)
- **Se houver dados, mas cursoId = NULL:** O problema é vínculo órfão
- **Se houver dados, mas isActive = 0:** O problema é que as atividades estão inativas
- **Se tudo estiver correto:** O problema está na procedure/API

Aguardo seus resultados!
