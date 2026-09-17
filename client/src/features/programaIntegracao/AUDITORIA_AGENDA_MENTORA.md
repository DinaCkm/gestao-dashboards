# Auditoria funcional — Agenda Geral e automação da Mentora

Fonte funcional obrigatória: `trilha-integracao-codigo-completo_3.html`.

Branch auditada: `reconstrucao-integracao-completa-20260916`.

## Objetivo

Conferir, sem alterar comportamento já correto, os itens pendentes do checklist referentes a:

1. linhas extras da mentora na Agenda Geral;
2. auditoria final da Agenda Geral;
3. automação final da preparação da mentora.

## 1. Linhas extras da mentora na Agenda

O HTML histórico adiciona, para cada um dos 4 alinhamentos, 5 linhas derivadas da preparação da mentora:

1. Solicitar disponibilidade da mentora;
2. Aguardando resposta da mentora;
3. Enviar as opções de horário ao gestor;
4. Gerar o briefing do alinhamento;
5. Confirmar a reunião com a mentora.

Total: 20 linhas derivadas possíveis, além das 95 ações do plano.

A implementação atual em `helpers/agendaRealHelpers.ts` reproduz os mesmos 5 passos para cada alinhamento e usa os mesmos sinais históricos:

- `pedidoEm || ok` para disponibilidade;
- horários preenchidos ou `ok` para resposta da mentora;
- `agN-01 === ok` para opções enviadas ao gestor;
- `briefEm` para briefing;
- `confirmEm || (data && ok)` para confirmação.

A data usada é a etapa `agN`, o marco exibido é `MARCO[n] - 7`, o responsável é CKM e o item técnico continua `agN-00`, como no original.

**Resultado:** paridade funcional confirmada.

## 2. Auditoria final da Agenda Geral

### Coleta

A Agenda atual percorre o cronograma real de cada processo e inclui todas as ações do plano, preservando:

- pessoa/processo;
- cor;
- data prevista;
- dia/marco;
- etapa;
- ação;
- responsável;
- modelo de e-mail;
- item técnico;
- situação salva;
- estado calculado;
- data de conclusão;
- justificativa;
- observações;
- lado CKM/Sebrae;
- processo encerrado.

### Filtros

Os filtros atuais correspondem aos históricos:

- situação: Em aberto / Concluídas / Fora do escopo / Todas;
- responsável: Todos / CKM / UGP / Gestor / Anjo / Colaborador;
- pessoa.

### Ordenação

A ordenação permanece por data e depois por nome da pessoa.

### Tabela

A tabela mantém as colunas funcionais do original:

- Prevista;
- Pessoa;
- Ação;
- Responsável;
- Situação;
- Concluída em;
- Ações.

Justificativa e histórico de observações continuam exibidos dentro da ação.

### Atalhos

- botão de e-mail abre a prévia quando a ação possui modelo;
- botão de navegação abre a pessoa e passa o `itemId`;
- o detalhe individual já consome o deep-link `?item=` e abre a etapa/ação correspondente.

### CSV

`gerarAgendaCsvHistorica()` preserva o formato histórico:

- BOM UTF-8;
- separador `;`;
- 12 colunas;
- previsão;
- dia da semana;
- marco;
- pessoa;
- etapa;
- ação;
- responsável;
- depende de;
- situação;
- concluída em;
- justificativa;
- histórico de observações.

**Resultado:** auditoria funcional final da Agenda concluída. Teste visual e build permanecem no bloco de fechamento e não são considerados concluídos por esta auditoria.

## 3. Automação final da Mentora

O HTML histórico possui os seguintes comportamentos principais na preparação da mentora:

- selecionar/vincular mentora;
- pedir disponibilidade e registrar `pedidoEm`;
- colocar `agN-00` em andamento quando o pedido é registrado;
- registrar/remover horários;
- usar os horários no campo usado pelo e-mail do gestor;
- gerar briefing e registrar `briefEm`;
- gerar relatório Word e registrar `checklistEm`;
- copiar/abrir WhatsApp de disponibilidade;
- copiar/abrir WhatsApp de confirmação;
- registrar `confirmEm`;
- marcar preparação como concluída (`men.ok`);
- ao concluir, `aplicarAutomacoes()` fecha `agN-00`;
- ao reabrir, limpar o status/data de `agN-00` e reaplicar automações.

A implementação atual distribui essa lógica entre:

- `components/MentoraPreparacaoPainel.tsx`;
- `helpers/mentoraStateHelpers.ts`;
- `helpers/itemStateHelpers.ts`.

A auditoria confirmou a equivalência funcional desses gatilhos. A arquitetura React usa edição local dos horários e gravação explícita, o que é mais seguro do que gravar a cada tecla e não altera a regra de negócio.

### Conferência de dados da mentora

O HTML histórico também tenta:

- sugerir telefone do gestor a partir de respostas antigas ou de outro processo;
- mostrar alerta de curso com carga horária inválida;
- calcular segunda data sugerida respeitando feriados.

Esses pontos pertencem à conferência/qualidade de dados, não à automação de fechamento da mentora. Eles não foram inventados nem preenchidos automaticamente nesta auditoria. Qualquer evolução deve respeitar a estrutura atual dos formulários públicos e a regra de não fabricar dados.

**Resultado:** automação final da mentora conferida.

## Conclusão

Itens funcionais concluídos nesta auditoria:

- linhas extras da mentora na Agenda;
- auditoria final linha a linha da Agenda;
- automação final da mentora.

Nenhuma alteração de banco, produção, deploy, merge ou restauração de dados foi executada nesta etapa.
