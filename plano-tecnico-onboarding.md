# Plano Técnico — Nova Lógica de Onboarding

## Regras Aprovadas

1. **Aluno SEM PDI = Aluno Novo** → Onboarding obrigatório (etapa 1 - Cadastro)
2. **Aluno COM PDI** → Dashboard/Mural. Acessa Onboarding pelo menu em modo visualização (vê tudo, não edita)
3. **Aluno COM PDI + admin libera novo ciclo** → Onboarding completo novamente. Histórico anterior preservado
4. **Aluno novo nunca vem com mentor pré-atribuído** → Sempre escolhe no onboarding

---

## Impacto nos Alunos Atuais (148 ativos)

| Situação | Qtd | O que muda |
|----------|-----|------------|
| COM PDI + COM mentor | 97 | **Nada muda.** Continuam no Dashboard. Onboarding em modo visualização |
| SEM PDI + COM mentor (testes) | 40 | São registros de teste, não afeta ninguém |
| SEM PDI + COM mentor (reais) | 2 | **Passam a ir para Onboarding.** Mentor atual será removido, escolhem no onboarding |
| SEM PDI + SEM mentor | 9 | **Nada muda.** Já vão para Onboarding hoje |

**Resumo:** Apenas 2 alunos reais serão afetados pela mudança.

---

## Alterações Técnicas Necessárias

### 1. Backend — Nova lógica de `getAlunoOnboardingStatus` (server/db.ts)

**Antes:** `needsOnboarding = !bypassOnboarding && !hasMentor`

**Depois:** `needsOnboarding = !hasPDI && !onboardingLiberadoCompleto`

- Verificar se o aluno tem PDI na tabela `assessment_pdi`
- Se NÃO tem PDI → precisa de onboarding
- Se TEM PDI → não precisa (a menos que admin tenha liberado novo ciclo)
- Remover a lógica de `bypassOnboarding` (não será mais usada)

### 2. Backend — Novo campo no banco: "Liberar Onboarding" (drizzle/schema.ts)

Adicionar na tabela `alunos`:
- `onboardingLiberado` (int, default 0) — 1 = admin liberou novo ciclo de onboarding
- `onboardingLiberadoEm` (timestamp) — quando foi liberado

Quando o aluno completa o novo onboarding, o campo volta para 0.

### 3. Backend — Procedure para admin liberar onboarding (server/routers.ts)

Nova mutation `aluno.liberarOnboarding`:
- Recebe `alunoId`
- Marca `onboardingLiberado = 1` e `onboardingLiberadoEm = now()`
- Apenas admin pode executar

### 4. Frontend — Botão "Liberar Onboarding" na lista de alunos

Na tela de cadastro de alunos (lista), adicionar:
- Coluna ou botão "Liberar Onboarding" para cada aluno que TEM PDI
- Alunos SEM PDI não precisam do botão (já vão para onboarding automaticamente)
- Confirmação antes de liberar ("Isso iniciará um novo ciclo para o aluno. Confirma?")

### 5. Frontend — Redirecionamento (páginas do aluno)

- **Home.tsx:** Já tem lógica de redirect, ajustar para usar nova regra (sem PDI → onboarding)
- **MuralAluno.tsx:** Adicionar verificação — se aluno sem PDI, redirecionar para onboarding
- **DashboardMeuPerfil.tsx:** Mesma verificação

### 6. Backend — Lógica de progresso do onboarding (routers.ts)

- Ajustar determinação de step: não considerar `cadastroPreenchido` apenas por ter nome/email (dados importados)
- Aluno novo sempre começa na etapa 1, mesmo com dados importados
- Adicionar campo `cadastroConfirmado` na tabela `onboarding_jornada` para saber se o aluno clicou "Salvar e Continuar"

### 7. Cadastro de aluno pelo admin — Remover atribuição de mentor

- Quando admin cadastra aluno novo (individual ou massa), NÃO atribuir mentor
- O aluno escolherá o mentor na etapa 3 do onboarding
- **Pergunta:** Na importação por planilha, se a planilha tiver coluna de mentor, ignoramos? Ou mantemos para alunos veteranos?

### 8. Novo ciclo — Preservar histórico

Quando admin libera novo onboarding:
- DISC anterior permanece na tabela `disc_resultados` (já suporta múltiplos ciclos)
- PDI anterior permanece na tabela `assessment_pdi`
- Sessões anteriores permanecem
- O aluno faz tudo de novo: novo DISC, nova escolha de mentor, novo PDI

---

## Ordem de Implementação

1. Alteração no schema (novo campo `onboardingLiberado`)
2. Alteração no backend (nova lógica de redirecionamento)
3. Alteração no backend (procedure de liberar onboarding)
4. Alteração no frontend (redirecionamento nas páginas)
5. Alteração no frontend (botão na lista de alunos)
6. Ajuste na lógica de progresso (etapa 1 sempre primeiro)
7. Testes

---

## Pergunta Pendente

Na **importação por planilha**, quando a planilha traz a coluna de mentor para alunos novos, devemos:
- **(A)** Ignorar o mentor da planilha — aluno sempre escolhe no onboarding
- **(B)** Manter o mentor da planilha — mas o aluno ainda passa pelo onboarding e na etapa 3 já aparece o mentor pré-selecionado (pode trocar se quiser)
