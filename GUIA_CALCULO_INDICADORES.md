# Guia de Cálculo dos Indicadores de Performance

## Ecossistema do Bem — Sistema de Gestão de Mentorias

**Versão:** 4.0 — Atualizado em 12/02/2026
**Autor:** Manus AI, com base nas especificações fornecidas pelo gestor do programa

---

## Visão Geral

O sistema de avaliação de performance dos alunos é composto por **7 indicadores**: 6 indicadores individuais e 1 indicador geral (consolidado). Todos os indicadores são calculados na **base 100 (percentual)** e a nota final é a **média aritmética simples** dos 6 indicadores individuais. Além dos indicadores, existe uma **visualização complementar** do caminho de realização das competências que aparece em todos os dashboards. Cada card de indicador exibe, abaixo do valor, a **explicação detalhada** de como o cálculo foi feito, com fórmula, números reais e regras aplicadas.

---

## Estrutura dos Indicadores

| # | Indicador | Tipo | Fonte de Dados |
|---|-----------|------|----------------|
| 1 | Participação nas Mentorias | Individual | Planilha de Mentorias |
| 2 | Atividades Práticas | Individual | Planilha de Mentorias |
| 3 | Evolução / Engajamento | Individual | Planilha de Mentorias |
| 4 | Performance das Competências | Individual | Planilha de Performance + Ciclos |
| 5 | Performance de Aprendizado | Individual | Planilha de Performance + Ciclos |
| 6 | Participação em Eventos | Individual | Planilha de Eventos |
| **7** | **Performance Geral** | **Consolidado** | **Média dos 6 indicadores** |

---

## Detalhamento de Cada Indicador

### Indicador 1 — Participação nas Mentorias

Este indicador reflete o **percentual de encontros de mentoria** em que o participante esteve presente.

**Fonte de dados:** Planilha de Mentorias — coluna "Mentoria" (Presente / Ausente)

**Fórmula:**

> **Participação nas Mentorias = (Mentorias com presença / Total de mentorias) × 100**

**Explicação no card:** "Você esteve presente em **X** de **Y** sessões de mentoria."

---

### Indicador 2 — Atividades Práticas

Representa a **quantidade de atividades práticas entregues** em relação ao total de atividades previstas no ciclo.

**Fonte de dados:** Planilha de Mentorias — coluna "Atividade proposta" (Entregue / Não entregue)

**Fórmula:**

> **Atividades Práticas = (Atividades entregues / Total de atividades previstas) × 100**

**Regra especial — 1ª Mentoria (Assessment):** A primeira sessão de mentoria é o Assessment (avaliação inicial feita pela mentora). Nessa sessão **nunca há entrega de trabalho prático**. Portanto, a 1ª mentoria **deve ser excluída** do cálculo — não entra nem no numerador nem no denominador.

**Explicação no card:** "Você entregou **X** de **Y** atividades práticas. A 1ª sessão (Assessment) não possui atividade prática."

---

### Indicador 3 — Evolução / Engajamento

Este é um indicador **qualitativo e quantitativo** que mede o **nível de envolvimento ativo** do participante. É um **conjunto de 3 informações combinadas:**

1. **Presença nas mentorias** — mesmo valor do Indicador 1
2. **Entrega de atividades** — mesmo valor do Indicador 2
3. **Nota da Mentora** — nota de 0 a 5 atribuída pela mentora, convertida para percentual

**Conversão da Nota da Mentora (0-5) para percentual:**

| Nota da Mentora | Percentual |
|-----------------|------------|
| 0 | 0% |
| 1 | 20% |
| 2 | 40% |
| 3 | 60% |
| 4 | 80% |
| 5 | 100% |

Quando há múltiplas sessões, a Nota da Mentora utilizada é a **média das notas** de todas as sessões.

**Fórmula:**

> **Engajamento = (Indicador 1 + Indicador 2 + Nota da Mentora em %) / 3**

**Explicação no card:** "Composto por: Presença (**X%**) + Atividades (**Y%**) + Nota da Mentora (**Z/5 = W%**). Média dos 3 componentes."

---

### Indicador 4 — Performance das Competências (Aulas Concluídas)

Mede o **percentual de aulas concluídas** dentro de cada competência. Cada competência é um módulo composto por diversas aulas.

**Fonte de dados:** Planilha de Performance + **Ciclos de Execução da Trilha**

**Fórmula por competência:**

> **Performance da Competência = (Aulas concluídas / Total de aulas da competência) × 100**

**Fórmula do Indicador 4:**

> **Indicador 4 = Média dos percentuais de conclusão de todas as competências de CICLOS FINALIZADOS**

**Regra dos Ciclos — Apenas ciclos finalizados entram no cálculo:**

| Status do Ciclo | Condição | Entra no Indicador 4? |
|-----------------|----------|----------------------|
| Finalizado | data_fim < hoje | **SIM** — entra na Performance Geral |
| Em andamento | data_inicio <= hoje <= data_fim | **NÃO** — aparece separado no dashboard |
| Futuro | data_inicio > hoje | **NÃO** — invisível |

Se o aluno **não terminou** um ciclo dentro do prazo, a nota baixa fica registrada e puxa a performance para baixo. Ele pode voltar e completar o ciclo atrasado a qualquer momento, melhorando sua Performance Geral.

**Explicação no card:** "Baseado em **N** ciclos finalizados com **X** competências. Ciclo atual (**nome**) em andamento não incluído — progresso atual: **Y%**."

---

### Indicador 5 — Performance de Aprendizado (Notas das Provas)

Refere-se ao **quanto o participante aprendeu**, medido pela **nota obtida nas provas** realizadas após cada aula concluída.

**Fonte de dados:** Planilha de Performance — colunas com notas por competência/aula

**Fórmula por competência:**

> **Performance na Competência = Média das notas das provas de todas as aulas da competência**

**Fórmula do Indicador 5:**

> **Indicador 5 = Média das performances de todas as competências de CICLOS FINALIZADOS**

Aplicam-se as **mesmas regras de ciclos** do Indicador 4 — apenas competências de ciclos finalizados são consideradas.

**Explicação no card:** "Média das notas de provas em **X** competências de ciclos finalizados. Nota média: **Y%**."

---

### Indicador 6 — Participação em Eventos / Aulas Online / Eventos Coletivos

Reflete a **presença do aluno em eventos coletivos** do programa. Cada evento é avaliado de forma binária: **Presente = 100, Não presente = 0**.

**Fonte de dados:** Planilhas de Eventos

**Fórmula:**

> **Participação em Eventos = (Eventos com presença / Total de eventos do programa) × 100**

**Explicação no card:** "Você participou de **X** de **Y** eventos/webinários do programa."

---

### Indicador 7 — Performance Geral (Consolidado)

Este é o indicador consolidado que representa a **performance geral do aluno**. É a **média aritmética simples** dos 6 indicadores individuais.

**Fórmula:**

> **Performance Geral = (Ind.1 + Ind.2 + Ind.3 + Ind.4 + Ind.5 + Ind.6) / 6**

**Explicação no card:** "Média dos 6 indicadores: Mentorias (**X%**) + Atividades (**Y%**) + Engajamento (**Z%**) + Competências (**W%**) + Aprendizado (**V%**) + Eventos (**U%**) = **Total/6**."

---

## Classificação — Estágios de Desenvolvimento

A Performance Geral (Indicador 7) é classificada conforme a tabela abaixo:

| Estágio | Faixa (%) | Nota equivalente (0-10) |
|---------|-----------|------------------------|
| Excelência | 90% a 100% | 9,0 a 10,0 |
| Avançado | 70% a 89% | 7,0 a 8,9 |
| Intermediário | 50% a 69% | 5,0 a 6,9 |
| Básico | 30% a 49% | 3,0 a 4,9 |
| Inicial | 0% a 29% | 0,0 a 2,9 |

---

## Sistema de Ciclos de Competências

A mentora, durante o Assessment (1ª sessão de mentoria), define **ciclos de competências** para cada aluno. Cada ciclo é um grupo de competências com período de execução definido.

### Estrutura de um Ciclo

| Campo | Descrição |
|-------|-----------|
| aluno_id | Identificador do aluno |
| nome_ciclo | Nome descritivo do ciclo (ex: "Ciclo 1 - Competências Básicas") |
| competencias | Lista de competências incluídas no ciclo |
| data_inicio | Data em que o ciclo é liberado para o aluno |
| data_fim | Data limite para conclusão do ciclo |
| definido_por | Mentora que definiu o ciclo |

### Regras dos Ciclos

O aluno pode ter **múltiplos ciclos rodando em paralelo**. Cada ciclo tem seu próprio status baseado na data atual:

| Status | Condição | Comportamento |
|--------|----------|---------------|
| **Finalizado** | data_fim < hoje | Entra no cálculo dos Indicadores 4, 5 e 7 (Performance Geral). Se o aluno não terminou, a nota baixa fica registrada. |
| **Em andamento** | data_inicio <= hoje <= data_fim | Aparece **separado** no dashboard como "Ciclo Atual". NÃO entra na Performance Geral. |
| **Futuro** | data_inicio > hoje | Completamente **invisível** no cálculo e na visualização. |
| **Atrasado** | data_fim < hoje E competências incompletas | Entra na Performance Geral com nota baixa. Aluno pode voltar e completar para melhorar a nota. |

### Exemplo Prático

Um aluno com 3 ciclos definidos pela mentora:

| Ciclo | Competências | Período | Status em 15/02/2026 | Performance |
|-------|-------------|---------|---------------------|-------------|
| Ciclo 1 | Atenção, Disciplina, Gestão de Tempo | 01/01 - 31/01 | Finalizado | 90% |
| Ciclo 2 | Liderança, Comunicação | 01/02 - 28/02 | Em andamento | 40% |
| Ciclo 3 | Inovação, Finanças | 01/03 - 31/03 | Futuro | — |

**Indicador 4 (Performance Geral) = 90%** (apenas Ciclo 1, que já finalizou)

O Ciclo 2 aparece separado no dashboard: "Ciclo em andamento: 40% concluído"

Quando chegar março e o Ciclo 2 finalizar:
- Se o aluno completou 70%: **Indicador 4 = (90 + 70) / 2 = 80%**
- Se o aluno completou apenas 30%: **Indicador 4 = (90 + 30) / 2 = 60%**

---

## Visualização Complementar — Caminho de Realização das Competências

Todos os dashboards (Admin, Gestor e Aluno) exibem uma **visualização do progresso do aluno na trilha de competências**. Esta visualização **não é um indicador** e **não entra no cálculo da nota final**.

**Sistema de cores por status de prazo:**

| Cor | Status | Significado |
|-----|--------|-------------|
| Verde | No prazo | O aluno está dentro do período de execução |
| Vermelho | Atrasado | O aluno passou do prazo e não concluiu |
| Azul | Adiantado / Excelência | O aluno concluiu antes do prazo |

---

## Transparência — Explicação nos Cards

Cada card de indicador nos dashboards exibe, abaixo do valor percentual, uma **explicação detalhada** contendo:

1. **Fórmula** usada no cálculo
2. **Números reais** que compõem o resultado (ex: "8 presenças de 10 sessões")
3. **Regras aplicadas** (ex: "1ª mentoria excluída por ser Assessment")
4. Para os Indicadores 4 e 5: quais **ciclos** entraram no cálculo e quais estão em andamento

Essa transparência ajuda alunos e gestores a entenderem exatamente como cada nota foi calculada.

---

## Regras Especiais

### 1ª Mentoria — Assessment

A primeira sessão de mentoria de cada aluno é o **Assessment**. Nessa sessão a mentora avalia o aluno, define quais competências ele vai cursar e define os ciclos de execução. **Nunca há entrega de trabalho prático** nessa sessão, portanto ela **deve ser excluída** do cálculo do **Indicador 2 (Atividades Práticas)**.

---

## Fontes de Dados

| Planilha | Dados utilizados | Indicadores que alimenta |
|----------|-----------------|--------------------------|
| Mentorias | Presença, atividades entregues, nota de engajamento (0-5) | Indicadores 1, 2 e 3 |
| Performance | Aulas concluídas, notas das provas por competência | Indicadores 4 e 5 |
| Eventos | Presença em webinários e eventos coletivos | Indicador 6 |
| Ciclos de Execução (sistema) | Períodos de liberação das competências por aluno | Filtra Indicadores 4 e 5 |

---

*Documento gerado para validação antes da implementação nos dashboards do sistema.*
