# Avaliacao dos 7 Ajustes Solicitados

## Item 1 - Micro Ciclo visivel na Trilha Basic mas nao na Master

**Situacao atual:** Na area do aluno (DashboardMeuPerfil.tsx), as datas de micro ciclo sao exibidas quando existem nos dados retornados pela procedure `jornada.completa`. O print mostra que na Trilha Basic do Fabio Silva De Oliveira as datas aparecem corretamente (09/04/2025 - 29/10/2025), mas na Trilha Master nao aparecem.

**Causa raiz:** Isso acontece porque as competencias da Trilha Master deste aluno nao possuem datas de micro ciclo (`microInicio` e `microTermino`) cadastradas no banco de dados (tabela `assessment_competencias`). Quando o assessment foi criado para a trilha Master, as datas de micro ciclo nao foram preenchidas. O codigo ja suporta a exibicao - o problema esta nos dados, nao no codigo.

**O que ja temos:** O frontend ja exibe as datas quando existem. A logica esta em `DashboardMeuPerfil.tsx` (linhas 1002-1006) que calcula o `cicloStatus` baseado em `microInicio` e `microTermino`.

**Solucao:** Verificar e preencher as datas de micro ciclo para as competencias da Trilha Master do Fabio (e de outros alunos que possam ter o mesmo problema). Isso pode ser feito pelo admin na tela de Assessment ao editar o assessment existente, ou via script de correcao no banco.

**Esforco estimado:** Baixo - correcao de dados, nao de codigo.

---

## Item 2 - Confirmacao do Item 1

Este item confirma o problema descrito no Item 1. A Trilha Master mostra "Macro Jornada: 09/10/2024 a 29/10/2026 - 5 competencias (0 obrigatorias, 5 opcionais)" mas sem datas de micro ciclo nas competencias individuais (Foco em Resultados, Presenca Executiva, Protagonismo).

**Mesma solucao do Item 1.**

---

## Item 3 - Diferenca entre abas Eventos e Webinarios

**Situacao atual:** Na area do aluno existem duas abas separadas:

| Aba | Conteudo | Fonte de dados |
|-----|----------|----------------|
| **Eventos** | Lista de participacao em todos os eventos (webinars, workshops, aulas) com status presente/ausente. Mostra historico consolidado. | Tabela `events` + `event_participation` (dados importados da planilha) |
| **Webinarios** | Webinarios agendados pelo admin (proximos, pendentes de presenca, realizados com gravacao). Permite marcar presenca e enviar reflexao. | Tabela `scheduled_webinars` (criados pelo admin no sistema) |

**Explicacao:** A aba **Eventos** mostra o historico de participacao importado da planilha de performance (dados do passado). A aba **Webinarios** e o sistema de webinarios criados diretamente no Ecossistema do BEM pelo admin, com funcionalidades interativas (confirmar presenca, enviar reflexao, assistir gravacao).

**Avaliacao:** Sao fontes de dados diferentes com propositos diferentes. Porem, do ponto de vista do aluno, a separacao pode gerar confusao. Ha duas opcoes:

1. **Manter separado** (recomendado por enquanto): Eventos = historico importado, Webinarios = interativo do sistema.
2. **Unificar em uma unica aba "Eventos e Webinarios"**: Combinar as duas visualizacoes em uma unica aba com sub-filtros. Esforco medio.

**Decisao necessaria:** O usuario deve decidir se quer unificar ou manter separado.

---

## Item 4 - Caixa de Dialogo "Reavaliacao de Competencias Pendente"

**Explicacao:** O alerta amarelo que aparece na tela do mentor (Assessment / Jornada de Desenvolvimento) ao selecionar o aluno Amaggeldo Barbosa diz:

> "Reavaliacao de Competencias Pendente - Este aluno ja realizou **6 sessoes** de mentoria desde a ultima atualizacao de nivel. Nenhuma atualizacao de nivel foi registrada ainda. E recomendado atualizar os niveis das competencias."

**O que significa:** O sistema conta quantas sessoes de mentoria foram registradas para aquele aluno desde a ultima vez que o mentor atualizou os niveis das competencias no assessment. Quando esse numero atinge um limite (configurado para 5 sessoes), o sistema exibe este alerta recomendando que o mentor faca uma reavaliacao dos niveis.

**Por que existe:** O objetivo e lembrar o mentor de que, apos varias sessoes de mentoria, e esperado que o aluno tenha evoluido e os niveis das competencias devem ser atualizados para refletir essa evolucao. Sem este lembrete, o mentor poderia esquecer de atualizar os niveis, e os dashboards ficariam desatualizados.

**Acao:** O mentor deve clicar em "Atualizar Niveis" para abrir o formulario de reavaliacao e atualizar os niveis das competencias do aluno.

**Codigo fonte:** `Assessment.tsx` linhas 231-261, procedure `jornada.checkReavaliacao`.

---

## Item 5 - Perfil do Mentor: Foto e Minicurriculo

**O que ja temos:**

| Componente | Status | Detalhes |
|-----------|--------|----------|
| Tabela `consultors` no banco | Parcial | Tem campo `especialidade` (texto), mas **NAO tem** campos `foto`, `miniCurriculo`, `biografia` |
| Onboarding do Aluno (`OnboardingAluno.tsx`) | Existe | Ja exibe foto e minicurriculo do mentor, porem os dados sao **gerados dinamicamente** a partir do campo `especialidade` (nao sao dados reais cadastrados pelo mentor) |
| Dashboard do Mentor (`DashboardMentor.tsx`) | Existe | Tem dashboard com metricas, mas **NAO tem** aba de perfil/configuracoes |

**O que precisa ser feito:**

1. **Adicionar campos no banco** (tabela `consultors`): `photoUrl` (varchar 500), `miniCurriculo` (text), `formacao` (text, opcional)
2. **Criar aba "Meu Perfil" no DashboardMentor**: Formulario com upload de foto (usando S3) e campo de texto rico para minicurriculo
3. **Atualizar o Onboarding** para usar os dados reais do banco em vez dos gerados

**O que podemos aproveitar:**
- O componente de upload de imagem ja existe no sistema (usado em Webinars para card de imagem)
- O `storagePut` do S3 ja esta configurado
- A estrutura do `DashboardMentor.tsx` ja existe e pode receber uma nova aba

**Esforco estimado:** Medio - ~3-4 horas de trabalho (schema + migration + backend + frontend).

---

## Item 6 - Agenda do Mentor: Datas, Horarios e Link do Google Meet

**O que ja temos:**

| Componente | Status |
|-----------|--------|
| Tabela de disponibilidade/agenda | **NAO existe** |
| Campo de link do Google Meet | **NAO existe** |
| Sessoes de mentoria (`mentoring_sessions`) | Existe, mas registra sessoes ja realizadas, nao agenda futura |

**O que precisa ser feito:**

1. **Criar nova tabela** `mentor_availability` no banco:
   - `id`, `consultorId`, `dayOfWeek` (0-6), `startTime` (hora), `endTime` (hora), `isRecurring` (boolean)
   - Ou alternativamente: `date` (data especifica), `startTime`, `endTime` para slots individuais
2. **Adicionar campo** `meetLink` (varchar 500) na tabela `consultors`
3. **Criar tela de configuracao** no DashboardMentor com:
   - Calendario semanal para selecionar horarios disponiveis
   - Campo para o link do Google Meet
4. **Opcional futuro:** Permitir que o aluno veja a disponibilidade e agende sessoes

**O que podemos aproveitar:**
- A estrutura do `DashboardMentor.tsx` para adicionar a aba de configuracoes
- Componentes de calendario/date-picker do shadcn/ui
- A tabela `mentoring_sessions` como referencia de estrutura

**Esforco estimado:** Alto - ~6-8 horas de trabalho (schema + migration + backend + frontend com calendario interativo).

---

## Item 7 - Visualizacao Truncada na Selecao de Trilha

**Situacao atual:** No print, quando a mentora abre o modal "Novo Assessment" e tenta selecionar alunos/trilha, a lista de nomes aparece cortada (truncada). Os nomes aparecem como "a Schmitz", "a Marques Righi Casemiro", "Figueiredo da Silva", "ernandes" - claramente cortados no inicio.

**Causa raiz:** O modal de novo assessment usa `SelectContentNoPortal` (um Select que renderiza sem Portal para nao fechar o Dialog). Porem, o container do modal tem `overflow: hidden` e o dropdown do Select fica limitado ao espaco do modal, causando o truncamento dos nomes.

**O que ja temos:** O componente `SelectContentNoPortal` ja existe em `client/src/components/ui/select.tsx` e e usado especificamente dentro de Dialogs para evitar que o Select feche o Dialog ao clicar.

**Solucao:** Ajustar o CSS do `SelectContentNoPortal` ou do container do modal para permitir que o dropdown tenha largura suficiente. Opcoes:
1. Adicionar `min-width` no SelectContent para garantir largura minima
2. Usar `position: fixed` no dropdown para que nao seja limitado pelo overflow do modal
3. Trocar o Select por um Combobox (campo de busca + lista) que e mais adequado para listas longas de nomes

**Esforco estimado:** Baixo - ~1 hora de trabalho.

---

## Resumo de Prioridades

| Item | Descricao | Esforco | Prioridade |
|------|-----------|---------|------------|
| 1-2 | Micro ciclo na Trilha Master (dados) | Baixo | Alta |
| 3 | Unificar Eventos/Webinarios | Medio | Media (decisao necessaria) |
| 4 | Explicacao do alerta (nenhuma acao) | Nenhum | Informativo |
| 5 | Foto + Minicurriculo do Mentor | Medio | Alta |
| 6 | Agenda do Mentor + Google Meet | Alto | Media |
| 7 | Truncamento na selecao de trilha | Baixo | Alta (bug visual) |
