# Auditoria completa dos PDFs contra `09-pdf.js`

Fonte funcional obrigatória: `trilha-integracao-codigo-completo_3.html`.

Esta auditoria confere a **paridade funcional** dos geradores históricos de PDF. Ela não substitui o teste real de geração, a conferência visual final nem a regressão, que permanecem itens separados no checklist.

## Inventário histórico confirmado

O bloco histórico possui quatro geradores principais:

1. `agendaPDF(id)`
2. `relatorioPDF(id)`
3. `checkpointPDF(id)`
4. `relEvolucaoPDF(id,n)`

## 1. Agenda de Onboarding

Fonte histórica: `agendaPDF(id)` + `agendaBlocos(p)`.

Gerador atual: `helpers/agendaPdf.ts`.

Conferido:

- 8 marcos históricos: 1º, 2º, 3º, 15º, 45º, 60º, 75º e 150º dia;
- responsáveis e textos principais de cada marco;
- dados de colaborador, gestor e Anjo;
- datas provenientes do cronograma real;
- período previsto;
- linha do tempo;
- nome do arquivo e rodapé.

Resultado funcional: alinhado.

## 2. Relatório de Andamento

Fonte histórica: `relatorioPDF(id)`.

Gerador atual: `helpers/relatorioAndamentoPdf.ts`.

A divergência encontrada na auditoria anterior foi corrigida. A versão atual preserva:

- cabeçalho, dados da pessoa, dia atual, progresso e quantidade de atrasos;
- barra de progresso geral;
- seção **VISÃO GERAL** com Jornada Compliance, Atividades do PDI e Alinhamentos realizados;
- gráfico/contagem de pendências reais por responsável;
- linha dos quatro alinhamentos;
- **SITUAÇÃO ATUAL — pendências em aberto**, com a mesma regra de considerar atraso, vence hoje ou aguardando retorno;
- **FORMULÁRIOS**, separados em já respondidos, com prazo vencido e não se aplica/não será respondido;
- somente formulários registráveis do Programa, sem tratar Avaliação de Potencial/Jornada Compliance como formulário de resposta;
- **ALINHAMENTOS E AGENDAMENTO**, com previsto, situação do e-mail, agendamento, confirmação e realização, incluindo motivo quando aplicável;
- **ETAPAS COM SITUAÇÃO EM ABERTO OU CONCLUÍDA**, reproduzindo a regra de agregação do estado dos itens da etapa;
- **AÇÕES MARCADAS COMO “NÃO SERÃO FEITAS”**, com justificativa;
- **ATAS E RELATÓRIOS DOS ALINHAMENTOS**, com situação dos relatórios da mentora, Drive/link e texto da ata;
- **SITUAÇÃO REGISTRADA PELA CKM**;
- rodapé e nome de arquivo.

Resultado funcional: alinhado após a correção registrada no commit `1c09fbf8e430002ebfaa0333ebd00b89305e3c9e`.

## 3. Checkpoint do Processo

Fonte histórica: `checkpointDados(p)` + `checkpointPDF(id)`.

Gerador atual: `helpers/checkpointPdf.ts`.

Conferido:

- pendências verdadeiras somente para Gestor, Anjo e Colaborador;
- regra histórica de pendência: atrasado, aguardando retorno ou vence hoje;
- percentual do PDI pela resposta de Acompanhamento do PDI, campo 14, com fallback no status registrado;
- percentual da Jornada Compliance pelo campo 17, com fallback no status registrado;
- quantidade de alinhamentos realizados;
- 3 KPIs principais;
- linha dos quatro alinhamentos;
- formulários pendentes por responsável;
- detalhamento das pendências.

Resultado funcional: alinhado.

## 4. Relatório de Evolução

Fonte histórica: `relEvolucaoPDF(id,n)`, `PILARES`, `CICLOS_REL`, `respostasGestor(...)` e cálculo de médias por pilar.

Gerador atual: `helpers/relatorioEvolucaoPdf.ts`.

Conferido:

- mesmos seis pilares e intervalos de perguntas;
- mesmos conjuntos de ciclos por relatório;
- somente respostas do Gestor no formulário de Avaliação do Programa;
- médias por pilar;
- média geral;
- preservação das notas originais;
- indicação de ciclos esperados ainda sem resposta;
- considerações descritivas de evolução;
- relatório completo do 1º ao 4º alinhamento quando acionado no encerramento.

Resultado funcional: alinhado.

## Documentos relacionados, mas fora de `09-pdf.js`

O Briefing da Mentora PDF pertence ao bloco histórico específico de briefing e já foi conferido no bloco da Mentora. Os documentos Word possuem itens próprios no checklist e não são confundidos com esta auditoria.

## Conclusão

Os quatro geradores principais de `09-pdf.js` possuem equivalentes funcionais reconstruídos e conferidos contra a fonte histórica.

Esta conclusão é **funcional/estática**. Permanecem obrigatórios e separados:

- build/TypeScript;
- teste real de geração dos PDFs/Word;
- conferência visual final;
- regressão do EcoLíder;
- teste ponta a ponta antes de qualquer publicação.
