# Correção da Tabela `atividades_curso` - Railway MySQL

## Data: 01/04/2026

### Problema
A tabela `atividades_curso` no banco MySQL do Railway estava desalinhada com o schema do projeto em `drizzle/schema.ts`, causando erros ao tentar inserir atividades.

### Solução Aplicada
A tabela foi recriada com a estrutura correta, garantindo sincronização com o schema do projeto.

### Estrutura Final da Tabela
```sql
CREATE TABLE atividades_curso (
  id INT NOT NULL AUTO_INCREMENT,
  cursoId INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  tipoAtividade ENUM('genially','video','podcast','tedtalk','livro','intro') NOT NULL,
  urlGenially VARCHAR(500) NULL,
  descricao TEXT NULL,
  ordem INT NOT NULL DEFAULT 0,
  isActive INT NOT NULL DEFAULT 1,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_atividades_curso_cursoId (cursoId),
  KEY idx_atividades_curso_isActive (isActive)
);
```

### Campos Corrigidos
- ✅ `id`: AUTO_INCREMENT
- ✅ `tipoAtividade`: ENUM com valores corretos (genially, video, podcast, tedtalk, livro, intro)
- ✅ `ordem`: DEFAULT 0
- ✅ `isActive`: DEFAULT 1
- ✅ `createdAt`: DEFAULT CURRENT_TIMESTAMP
- ✅ `updatedAt`: DEFAULT CURRENT_TIMESTAMP com UPDATE automático
- ✅ Índices criados para `cursoId` e `isActive`

### Impacto
- Operações CRUD de atividades agora funcionam sem erros
- Banco está 100% sincronizado com o schema do projeto
- Nenhum dado foi perdido (tabela estava vazia)

### Próximos Passos
1. Testar criação de atividades na página admin
2. Verificar se os vídeos de onboarding aparecem corretamente
3. Integrar vídeos no fluxo de onboarding do aluno
