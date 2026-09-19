# Lote final de validação com demonstração — Programa de Integração

Objetivo: fechar o maior número possível de itens restantes com **uma única demonstração**, sem tocar em pessoas reais e sem alterar qualquer área externa ao Programa de Integração.

## Regras obrigatórias

- usar somente processo claramente fictício/demonstração;
- não usar restauração real de backup sem nova autorização explícita;
- não usar "Limpar todas as marcações";
- não alterar módulos externos ao Programa de Integração;
- após cada gravação crítica, confirmar leitura de volta;
- gerar arquivos apenas a partir da demonstração;
- se qualquer passo divergir, parar o lote e registrar a falha antes de continuar.

## Lote A — Formulários administrativos (E)

Com a demonstração:
1. testar importação por arquivo .csv, .tsv e .txt;
2. testar duplicidade em modo substituir/adicional/pular;
3. testar microimportação dentro de uma ação;
4. em Respostas recebidas, abrir, editar e arquivar resposta fictícia;
5. percorrer as 6 abas de Formulários;
6. criar resposta ambígua fictícia, corrigir identificação e vincular;
7. criar processo a partir de Controle/Bem Acolhido fictício;
8. descartar uma pendência fictícia e confirmar preservação em auditoria.

Itens-alvo: E02, E04, E05, E06, E07, E08, E09, E10.

## Lote B — Cinco formulários públicos (F)

Usar exclusivamente nomes/e-mails fictícios e a demonstração:
1. Controle;
2. Bem Acolhido;
3. Pesquisa de Integração;
4. Avaliação como Gestor;
5. Avaliação como Anjo;
6. Acompanhamento do PDI;
7. gerar uma resposta ambígua para Pendentes de vinculação;
8. repetir uma resposta para conferir duplicidade.

Itens-alvo: F01, F02, F03, F04, F05, F06, F08, F09.
F07 já está fechado por validação cliente+servidor.

## Lote C — Quatro alinhamentos e Mentora (G)

Na mesma demonstração:
1. validar 1º, 2º, 3º e 4º alinhamentos;
2. checklist da Mentora;
3. WhatsApp de disponibilidade e confirmação sem envio real;
4. horários sugeridos e uso no e-mail ao gestor;
5. concluir preparação e confirmar fechamento de agN-00.

Itens-alvo: G01-G07.
G08 já está fechado por inspeção da automação.

## Lote D — Cobrança (H)

1. verificar agrupamento por responsável;
2. marcar itens fictícios como cobrados;
3. confirmar status Aguardando resposta e nota automática;
4. validar bloco reduzido do 4º ciclo.

Itens-alvo: H01, H03, H04.
H02 já está fechado por auditoria.

## Lote E — PDFs e Word (I)

Gerar e abrir:
1. Agenda de Onboarding;
2. Relatório de Andamento;
3. Checkpoint;
4. Relatórios de Evolução 2º/3º/4º;
5. Evolução completa final;
6. Briefing da Mentora;
7. Relatório da Mentora Word;
8. Ata Word;
9. Relatório UGP Word;
10. "Gerar os dois" + marcação automática.

Itens-alvo: I01-I10.

## Lote F — Pessoas e backup seguro (K/L)

Somente demonstrações:
1. reordenar duas demonstrações e recarregar;
2. arquivar uma demonstração e confirmar que some da visão mas não é apagada;
3. alterar uma configuração reversível e devolver ao original;
4. baixar backup JSON e validar;
5. criar/baixar ponto de restauração sem restaurar.

Itens-alvo: K05, K06, L02, L03, L04.

L06 continua PROTEGIDO e não entra neste lote.

## Lote G — Fechamento técnico (M)

Depois dos lotes anteriores:
- M01 build/TypeScript;
- M02 testes técnicos;
- M03 fluxo ponta a ponta;
- M04 visual desktop;
- M05 visual celular;
- M06 regressão externa somente leitura;
- M09 checkpoint final;
- M10 diff final;
- M11 autorização explícita para etapa protegida/final;
- M12 deploy final + pós-deploy;
- M13 aceite final.

M07 e M08 já estão fechados.

## Resultado esperado

Esse lote foi desenhado para evitar testes fragmentados. Se executado com sucesso, a mesma demonstração fecha a maior parte dos itens restantes sem tocar em usuários reais.
