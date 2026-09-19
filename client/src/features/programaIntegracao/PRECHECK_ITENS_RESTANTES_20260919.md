# Pré-check técnico dos itens restantes — Programa de Integração

Data: 19/09/2026

Objetivo: separar o que ainda é **teste de execução** do que seria uma **lacuna de implementação**, sem tocar em dados reais e sem alterar qualquer área fora do Programa de Integração.

## Resultado geral

Após a reconciliação do HTML v4 e das auditorias, os itens ainda abertos no checklist final estão majoritariamente em uma destas situações:

1. funcionalidade implementada e aguardando teste real com demonstração;
2. geração de arquivo aguardando conferência visual;
3. operação protegida aguardando autorização específica;
4. fechamento técnico final.

Este pré-check foi atualizado após a auditoria complementar de 19/09/2026. Nessa rodada foram encontradas e corrigidas divergências estáticas adicionais antes dos testes operacionais: vínculo histórico `FORM_DO_ITEM` do PDI (`pos2-02`/`pos4-02`), uma pergunta extra no Bem Acolhido, contagem administrativa do Bem, textos oficiais truncados de Bem/Pesquisa/Avaliação e detalhes da jornada pública (identificação, página, protocolo e exibição das dicas de escala). Após essas correções, não ficou nova lacuna estática crítica conhecida neste bloco.

## E — Formulários administrativos

- E02: importação por arquivo — interface aceita .csv/.tsv/.txt; parser e análise estão conectados. Falta executar os três formatos.
- E04: duplicidade/lote — decisões substituir/adicional/pular e persistência transacional existem. Falta teste com demo.
- E05: microimportação — componente está conectado às ações com resposta histórica prevista. Desde o PR #112, isso inclui também o Acompanhamento do PDI em `pos2-02` e `pos4-02` via equivalente atual de `FORM_DO_ITEM`. Falta registrar em demo.
- E06: respostas recebidas — visualizar/editar/arquivar possuem API real e arquivamento lógico. Falta execução.
- E07: seis abas administrativas — as seis abas existem e estão montadas. Falta navegação manual completa.
- E08: pendência — rebuscar/corrigir/vincular existem. Falta pendência demo.
- E09: criação por Controle/Bem Acolhido — rota administrativa existe com confirmação. Falta dado fictício.
- E10: descarte — descarte preserva auditoria/arquivamento. Falta pendência fictícia.

## F — Formulários públicos

As cinco rotas públicas, validações, protocolo, cálculo e gravação existem. A auditoria complementar contra o HTML v4 também reconciliou perguntas/códigos, textos oficiais, identificação pública, contagens e detalhes da navegação. O servidor:
- aceita e valida as respostas;
- calcula média quando aplicável;
- gera protocolo;
- vincula quando há correspondência suficiente;
- envia ambiguidade para pendência;
- aplica política de duplicidade.

F01-F06, F08 e F09 permanecem abertos porque o critério final exige submissão real de dados fictícios e leitura administrativa de volta. As correções estáticas preparatórias já foram incorporadas; não devem ser confundidas com o teste ponta a ponta.

## G — Alinhamentos e Mentora

- quatro alinhamentos usam a mesma estrutura de estado e automações históricas;
- checklist de prontidão existe;
- WhatsApp é gerado por link wa.me, sem envio automático;
- horários da mentora são editados localmente e salvos explicitamente;
- botão "Usar horários no e-mail ao gestor" grava o texto consolidado;
- Briefing/Word usam geradores reais;
- concluir preparação fecha agN-00 (G08 já concluído).

G01-G07 aguardam somente execução real com demonstração.

## H — Cobrança

- agrupamento por responsável está implementado;
- um e-mail é montado por responsável;
- marcar cobrados altera para Aguardando resposta;
- nota "Cobrança enviada por e-mail." é registrada;
- painel final usa especificamente pendências do 4º ciclo.

H01, H03 e H04 aguardam execução com demo.

## I — Documentos

Geradores reais existentes e auditados:
- Agenda de Onboarding PDF;
- Relatório de Andamento PDF;
- Checkpoint PDF;
- Relatório de Evolução;
- Briefing da Mentora PDF;
- Relatório da Mentora Word;
- Ata Word;
- Relatório UGP Word;
- "gerar os dois" com marcação automática.

I01-I10 continuam abertos porque o critério exige gerar, abrir e conferir os arquivos.

## K — Gerenciar Pessoas

- reordenação usa endpoint próprio e readback;
- arquivamento é lógico, não exclusão física;
- criação/edição/encerrar/reabrir já foram validados anteriormente.

K05 e K06 aguardam teste final apenas entre demonstrações.

## L — Configuração e backup

- configuração comum salva por seção, não por payload global;
- backup JSON completo é gerado no navegador;
- ponto local de restauração é criado/baixado sem alterar o banco;
- validação de backup existe antes de restauração;
- restauração real tem confirmação dupla, checkpoint anterior, transação, rollback e readback.

L02-L04 aguardam teste real reversível.
L06 continua PROTEGIDO e exige nova autorização explícita.

## M — Fechamento

Já concluídos:
- M07 comparação final HTML v4/inventário;
- M08 documentação final.

Ainda exigem execução:
- M01 build/TypeScript;
- M02 testes técnicos;
- M03 E2E demo;
- M04 desktop;
- M05 celular;
- M06 regressão externa somente leitura;
- M09 checkpoint final;
- M10 diff final;
- M11 autorização explícita da etapa final/protegida;
- M12 deploy/pós-deploy;
- M13 aceite final.

## Ordem segura para fechar

1. executar E + F na mesma demonstração;
2. usar o mesmo processo para G + H;
3. gerar I;
4. fechar K + L02-L04;
5. executar M01-M06;
6. criar M09 e revisar M10;
7. somente então pedir a autorização explícita de M11;
8. M12 e M13 por último.

## Regra de integridade

Este documento não marca automaticamente nenhum item como concluído. Ele confirma apenas que os itens restantes possuem caminho técnico identificado e que o que falta é, em sua maior parte, evidência de execução.


## Correções estáticas incorporadas antes do lote final

- PR #112 — restaurou o equivalente atual de `FORM_DO_ITEM`, incluindo PDI em `pos2-02` e `pos4-02`;
- PR #113 — restaurou o texto literal histórico da cobrança final;
- PR #114 — removeu a pergunta extra `bem_treinamentos_uc`, inexistente no HTML v4;
- PR #115 — restaurou textos completos de abertura/encerramento de Bem Acolhido, Pesquisa e Avaliação;
- PR #116 — atualizou auditorias e mapa funcional após as correções;
- PR #117 — corrigiu a contagem administrativa do Bem Acolhido de 12 para 11;
- PR #118 — restaurou rótulos e orientações históricas da identificação pública;
- PR #119 — restaurou `Página X de Y`, orientação do protocolo e a exibição das dicas/legenda de escala somente na primeira página de conteúdo.

Essas correções não fecham automaticamente os itens E/F do checklist, pois esses itens pedem teste operacional real.
