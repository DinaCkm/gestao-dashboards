# Auditoria parcial dos PDFs contra `09-pdf.js`

Fonte funcional obrigatória: `trilha-integracao-codigo-completo_3.html`.

Esta auditoria é deliberadamente mantida como **parcial** porque encontrou uma diferença funcional real no Relatório de Andamento. O item geral do checklist não deve ser encerrado antes da correção e nova conferência.

## Agenda de Onboarding

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

Resultado funcional: alinhado. A paridade visual final continua sendo teste separado.

## Checkpoint do Processo

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

## Relatório de Evolução

Fonte histórica: `relEvolucaoPDF(id,n)`, `PILARES`, `CICLOS_REL`, `respostasGestor(...)` e `mediasPilar(...)`.

Gerador atual: `helpers/relatorioEvolucaoPdf.ts`.

Conferido:

- mesmos seis pilares e mesmos intervalos de perguntas;
- mesmos conjuntos de ciclos por relatório;
- somente respostas do Gestor no formulário de Avaliação do Programa;
- médias por pilar;
- média geral;
- preservação das notas originais;
- indicação de ciclos esperados ainda sem resposta;
- considerações descritivas de evolução.

Resultado funcional: alinhado. A apresentação gráfica não foi declarada como visualmente idêntica; isso permanece para auditoria visual final.

## Briefing da Mentora

Fonte histórica: `briefingPDF(id,n)`.

Gerador atual: `helpers/mentoraDocumentos.ts`.

O Briefing já havia sido reconstruído e conferido no bloco específico da Mentora, preservando roteiro do gestor, roteiro do colaborador, orientações obrigatórias, dados do alinhamento e preparação da consultora.

Resultado funcional: já coberto pelo item específico de Mentora.

## Relatório de Andamento - divergência encontrada

Fonte histórica: `relatorioPDF(id)`.

Gerador atual: `helpers/relatorioAndamentoPdf.ts`.

O gerador atual já preserva:

- cabeçalho e dados da pessoa;
- progresso geral;
- linha dos alinhamentos;
- regra de pendências reais;
- pendências agrupadas por responsável;
- informações dos alinhamentos;
- respostas registradas;
- situação registrada pela CKM;
- rodapé e nome de arquivo.

Entretanto, o HTML histórico possui blocos adicionais que ainda não estão reproduzidos integralmente no gerador atual:

1. **VISÃO GERAL** com os três KPIs históricos de Jornada Compliance, Atividades do PDI e Alinhamentos realizados, além do gráfico de pendências reais por responsável.
2. **FORMULÁRIOS**, separados em `JÁ RESPONDIDOS`, `COM PRAZO JÁ VENCIDO` e, quando aplicável, `NÃO SE APLICA / NÃO SERÁ RESPONDIDO`, considerando apenas os cinco formulários registráveis.
3. **ALINHAMENTOS E AGENDAMENTO** com colunas históricas de previsto, e-mail, agendado, confirmado e realizado, incluindo motivo quando o agendamento está marcado como não.
4. **ETAPAS COM SITUAÇÃO EM ABERTO OU CONCLUÍDA**, mostrando o panorama amplo do processo e não apenas pendências urgentes.
5. **AÇÕES MARCADAS COMO "NÃO SERÃO FEITAS"**, incluindo justificativa registrada.
6. **ATAS E RELATÓRIOS DOS ALINHAMENTOS**, incluindo situação de relatórios da mentora, Drive/link da ata e texto registrado.

O gerador atual contém parte dessas informações em formato mais resumido, mas não reproduz integralmente a estrutura funcional acima.

## Decisão de governança

O checklist `Conferir todos os PDFs contra 09-pdf.js` permanece **aberto**.

Não será declarado como concluído até:

- completar os blocos faltantes do Relatório de Andamento;
- conferir novamente a fonte histórica;
- executar a validação aplicável do PDF;
- manter a auditoria visual final como etapa separada.
