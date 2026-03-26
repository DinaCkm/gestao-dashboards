# Guia rápido: migrar banco para Railway e versionar no GitHub

Este projeto já está preparado para usar migrações com **Drizzle Kit** e variável `DATABASE_URL` (dialeto MySQL). O objetivo aqui é:

1. manter a estrutura do banco versionada no GitHub;
2. subir um banco gerenciado no Railway;
3. aplicar as migrações no Railway.

## 1) O que vai para o GitHub (e o que não vai)

### Versionar no repositório
- Pasta `drizzle/` (arquivos `.sql`, `schema.ts`, `relations.ts`);
- `drizzle.config.ts`;
- scripts de migração no `package.json` (já existe `db:push`).

### **Não** versionar
- senha do banco;
- `DATABASE_URL` real;
- dumps com dados sensíveis (`INSERT` com dados de produção).

> Regra prática: no GitHub você salva **estrutura** e histórico de migrações. Dados reais ficam fora do repositório.

---

## 2) Criar banco MySQL no Railway

1. Acesse `https://railway.com/`.
2. Crie um novo projeto (`New Project`).
3. Adicione um serviço de banco **MySQL**.
4. No serviço MySQL, abra `Variables` ou `Connect` e copie a string de conexão.

Formato esperado do projeto:

```bash
mysql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
```

---

## 3) Configurar variáveis no Railway (aplicação)

No serviço da aplicação dentro do Railway, configure:

- `DATABASE_URL` = conexão MySQL do serviço de banco;
- outras variáveis necessárias da aplicação (JWT, SMTP, etc., se houver).

Como o `drizzle.config.ts` exige `DATABASE_URL`, sem ela as migrações não rodam.

---

## 4) Conectar Railway ao GitHub

1. No Railway, escolha `Deploy from GitHub`.
2. Autorize o Railway na sua conta GitHub.
3. Selecione este repositório.
4. Defina a branch de deploy (geralmente `main`).

A cada push na branch escolhida, o Railway fará novo deploy.

---

## 5) Gerar e aplicar migrações

Quando houver alteração de schema:

```bash
pnpm db:push
```

Esse comando (já configurado no projeto) executa:

1. `drizzle-kit generate` (gera SQL em `drizzle/`);
2. `drizzle-kit migrate` (aplica no banco definido em `DATABASE_URL`).

### Fluxo recomendado

1. Rodar local apontando para banco de desenvolvimento;
2. Commitar os arquivos novos/alterados em `drizzle/*.sql`;
3. Fazer push no GitHub;
4. No Railway, executar migração no ambiente de produção (ou via job/command de release).

---

## 6) Migrar dados existentes (se necessário)

Se você já tem um banco rodando fora do Railway e quer levar os dados:

### Exportar (origem)
```bash
mysqldump -h HOST_ORIGEM -u USUARIO -p NOME_BANCO > backup.sql
```

### Importar (Railway)
```bash
mysql -h HOST_RAILWAY -P PORTA -u USUARIO -p NOME_BANCO < backup.sql
```

> Faça isso primeiro em homologação/staging. Em produção, programe janela de migração e backup anterior.

---

## 7) Checklist final

- [ ] Banco MySQL criado no Railway;
- [ ] `DATABASE_URL` configurada no serviço da aplicação;
- [ ] repositório GitHub conectado ao Railway;
- [ ] migrações em `drizzle/` versionadas no GitHub;
- [ ] deploy automático funcionando;
- [ ] backup e plano de rollback definidos.

---

## 8) Comandos úteis

```bash
# gerar + aplicar migrações no banco alvo (DATABASE_URL)
pnpm db:push

# ver mudanças antes de commit
 git status

# versionar migrações
 git add drizzle drizzle.config.ts package.json
 git commit -m "docs: guia de migração GitHub + Railway"
```

Se quiser, no próximo passo eu posso te passar um **roteiro de 30 minutos** (bem prático) para fazer isso com risco baixo em produção.


## 9) Migração automática com script do projeto

Para executar a migração (origem -> Railway) com menos passos manuais:

```bash
SOURCE_DATABASE_URL="mysql://USER:SENHA@HOST_ORIGEM:3306/DB_ORIGEM" \
DATABASE_URL="mysql://USER:SENHA@HOST_RAILWAY:3306/DB_DESTINO" \
pnpm db:migrate:railway
```

Opções:

```bash
# só estrutura
pnpm db:migrate:railway -- --schema-only

# estrutura + dados (padrão)
pnpm db:migrate:railway -- --with-data

# evita DROP TABLE no dump
pnpm db:migrate:railway -- --no-drop
```

Depois, rode:

```bash
pnpm db:push
```

Isso garante que o histórico de migrações continue consistente no `drizzle/`.
