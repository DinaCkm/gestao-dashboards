# Plano Consolidado de Ajustes - ECOSSISTEMA DO BEM

**Data:** 20/03/2026
**Versão atual:** e2503062

---

## Resumo

Este documento consolida os ajustes solicitados no documento **ajustes18.docx** com as pendências já existentes no sistema. Os itens foram classificados por prioridade (Crítica, Alta, Média, Baixa) considerando impacto no usuário, complexidade técnica e dependências entre tarefas.

---

## Legenda de Prioridades

| Prioridade | Critério | Tempo estimado |
|---|---|---|
| **CRÍTICA** | Bug que impede uso ou mostra dados errados | 1-2h por item |
| **ALTA** | Funcionalidade importante solicitada pelo cliente | 2-4h por item |
| **MÉDIA** | Melhoria de usabilidade ou ajuste visual | 1-3h por item |
| **BAIXA** | Melhoria futura, não urgente | 1-2h por item |

---

## BLOCO 1 — PRIORIDADE CRÍTICA (Bugs e dados errados)

### 1.1 Cards do Gerente (Leandro) mostram dados individuais em vez da equipe
**Origem:** ajustes18.docx (página 3)
**Problema:** A tela "Bem-vindo, Leandro!" mostra cards com dados individuais (4 trilhas, 12 sessões, 100% acompanhamento, PDI), mas o Leandro é Gerente e não tem dados individuais. Os cards devem refletir os números da equipe dele.
**Ação:** Refatorar a Home do Gerente para exibir métricas consolidadas da equipe (total de alunos, sessões da equipe, progresso médio da equipe, etc.) em vez de dados individuais.
**Complexidade:** Média — requer query de agregação por empresa do gerente.

### 1.2 Relatório Individual — Filtro de alunos não funciona para o Gerente
**Origem:** ajustes18.docx (página 2)
**Problema:** O gerente ao filtrar o relatório individual por aluno não está abrindo a lista de alunos da empresa que ele trabalha. O campo "Aluno" no formulário de relatório individual não mostra os alunos.
**Ação:** Corrigir a query de alunos no relatório individual para filtrar pela empresa do gerente (usando o programId associado ao consultor).
**Complexidade:** Baixa — ajuste na query de filtro.

### 1.3 Gestor não consegue enviar email (Fale Conosco)
**Origem:** ajustes18.docx (página 1)
**Problema:** O gestor (Leandro) não consegue enviar email para dina@ckmtalents.net pela tela "Fale Conosco". Mostra erro: "Erro ao enviar solicitação. Tente novamente."
**Ação:** Investigar o erro no backend de envio de email do Fale Conosco. Verificar logs do servidor, validação do email destinatário e configuração SMTP.
**Complexidade:** Média — depende da causa raiz (pode ser SMTP, validação, ou permissão).

---

## BLOCO 2 — PRIORIDADE ALTA (Funcionalidades solicitadas pelo cliente)

### 2.1 Mentor — Incluir nível e meta ao cadastrar trilha do aluno
**Origem:** ajustes18.docx (página 3)
**Problema:** Quando o mentor cadastra a trilha do aluno, ele define a competência e escolhe o microciclo, mas NÃO consegue definir o nível e a meta de desenvolvimento neste mesmo momento. Hoje só consegue quando vai editar a competência depois no plano de desenvolvimento.
**Ação:** Adicionar campos de "Nível Atual" e "Meta de Desenvolvimento" no formulário de cadastro de competência da trilha, na mesma sequência em que o mentor define competência e microciclo.
**Complexidade:** Média — alteração no formulário do mentor e na mutation de cadastro.

### 2.2 Mentor — Remover campo de quantidade de mentorias do formulário do PDI
**Origem:** ajustes18.docx (página 3)
**Problema:** No formulário de cadastro do plano de desenvolvimento, existe um campo para o mentor definir a quantidade de mentorias por macrociclo. Este campo deve ser REMOVIDO, pois o número de mentorias é definido pelo administrador no cadastro do aluno (tempo do contrato, número de mentorias, individual/grupo).
**Ação:** (a) Remover o campo de quantidade de mentorias do formulário do mentor. (b) Exibir as informações do contrato (definidas pelo admin) no plano de desenvolvimento do aluno e em todos os locais relevantes.
**Complexidade:** Média — remover campo + exibir dados do contrato em múltiplas telas.

### 2.3 Mentor — Exibir tempo de duração do contrato no assessment
**Origem:** ajustes18.docx (página 3-4)
**Problema:** Quando o mentor abre a página para construir o assessment do mentorado, ele NÃO consegue visualizar o tempo de duração do contrato. Ele precisa saber, pois os macrociclos e microciclos precisam estar dentro do período do contrato.
**Ação:** Adicionar um card/banner informativo no topo da página de assessment mostrando: período do contrato, data início, data fim, número de mentorias contratadas, tipo (individual/grupo).
**Complexidade:** Baixa — exibir dados já existentes na tabela contratos_aluno.

### 2.4 Assessment — Filtrar competências abaixo de 4 (autopercepção)
**Origem:** ajustes18.docx (página 3)
**Problema:** Na parte do assessment, depois que o aluno novo preenche suas percepções sobre si mesmo, o sistema deve listar APENAS as competências com conhecimento abaixo de 4. A lista deve sair em ordem: Básicas, Essenciais, Master, Jornada do Futuro.
**Ação:** Adicionar filtro na tela de resultado da autopercepção para mostrar apenas competências < 4, ordenadas por categoria (Básicas → Essenciais → Master → Jornada do Futuro).
**Complexidade:** Baixa — filtro e ordenação no frontend.

---

## BLOCO 3 — PRIORIDADE MÉDIA (Melhorias de usabilidade)

### 3.1 Atividades Práticas — Verificar números + adicionar filtros
**Origem:** ajustes18.docx (página 1)
**Problema:** Verificar se o número de atividades práticas entregues está correto. Incluir filtro por empresa + turma + mentor + período.
**Ação:** (a) Auditar os dados de atividades práticas no banco. (b) Adicionar filtros de empresa, turma, mentor e período na tela de Atividades Práticas.
**Complexidade:** Média — auditoria de dados + implementação de filtros.

### 3.2 Demonstrativo de Mentorias — Texto informativo para o gerente
**Origem:** ajustes18.docx (página 2)
**Problema:** Na tela do gerente (Demonstrativo de Mentorias), incluir abaixo de "Sessão por Aluno" a informação: "(clique sobre o nome do aluno e abra o card com todas as informações detalhadas)".
**Ação:** Adicionar texto descritivo/tooltip abaixo do título "Sessões por Aluno" na tela do gerente.
**Complexidade:** Muito baixa — ajuste visual de uma linha.

### 3.3 Painel de revisões para admin/mentora (pendência interna)
**Origem:** Pendência interna (pós-implementação do onboarding)
**Problema:** As solicitações de revisão do PDI são salvas no banco mas não há tela para a mentora/admin visualizar e responder.
**Ação:** Criar tela de gestão de solicitações de revisão pendentes.
**Complexidade:** Média.

---

## BLOCO 4 — PRIORIDADE BAIXA (Pendências antigas do todo.md)

### 4.1 Pendências antigas não resolvidas
Estes itens estão no todo.md há mais tempo e podem ser endereçados quando os blocos acima estiverem concluídos:

| Item | Descrição |
|---|---|
| Investigação Julia | Verificar assessment, competências, trilhas e metas da Julia no banco (parcialmente resolvido com fix multi-trilha) |
| Notificação in-app | Badge/alerta no painel da mentora quando aluno solicitar revisão |
| Parsers de Eventos | Implementar parsers para planilhas de Eventos (SEBRAE ACRE, SEBRAE TO, EMBRAPII) |
| Dashboard por Turma | Implementar visão por Turma nos dashboards |

---

## Ordem de Execução Recomendada

| Fase | Itens | Estimativa |
|---|---|---|
| **Fase 1** | 1.1 (Cards Gerente) + 1.2 (Filtro Relatório) + 3.2 (Texto informativo) | 3-4h |
| **Fase 2** | 1.3 (Fale Conosco email) + 2.3 (Contrato no assessment) | 2-3h |
| **Fase 3** | 2.1 (Nível/meta na trilha) + 2.2 (Remover campo mentorias) | 3-4h |
| **Fase 4** | 2.4 (Filtrar competências < 4) + 3.1 (Filtros atividades práticas) | 3-4h |
| **Fase 5** | 3.3 (Painel revisões) + itens do Bloco 4 | 4-6h |

**Tempo total estimado:** 15-21 horas de desenvolvimento

---

## Observações

1. Os itens do **Bloco 1** são prioritários pois envolvem dados errados visíveis ao gerente e funcionalidades quebradas.
2. O item **2.2** (remover campo de mentorias) depende de confirmar que os dados de contrato do admin já estão completos no banco para todos os alunos.
3. O item **1.3** (Fale Conosco) precisa de investigação antes de estimar a complexidade real.
