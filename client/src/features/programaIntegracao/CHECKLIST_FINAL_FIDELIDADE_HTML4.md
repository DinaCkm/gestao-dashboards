# Checklist Final — Fidelidade ao HTML v4 e funcionamento do Programa de Integração

Data-base desta revisão: 18/09/2026.

## Fonte de verdade

1. `trilha-integracao-codigo-completo_4.html` — fonte funcional obrigatória mais recente.
2. Inventário funcional “Trilha de Integração — Inventário de funcionalidades”.
3. Código atual do módulo `client/src/features/programaIntegracao`.
4. Regras obrigatórias de segurança e governança do projeto.

Regra de execução: **Primeiro preservar. Depois alterar. Depois testar. Depois confirmar.**

Este checklist substitui o checklist antigo como lista operacional de fechamento. O checklist antigo continua preservado como histórico, mas não deve mais ser usado sozinho para calcular progresso porque contém 207 caixas enquanto o controle conversacional usava 208 e ficou desatualizado diante do HTML v4.

---

## A. Reconciliação da fonte e documentação

- [x] **A01** Formalizar o HTML v4 como fonte histórica funcional mais recente. **Formalizado em 18/09/2026 na documentação do Programa de Integração como `trilha-integracao-codigo-completo_4.html`.**
- [x] **A02** Corrigir a documentação que ainda diz “18 etapas”: o HTML v4 contém **19 etapas / 95 ações**. **Conferido no código atual: 19 etapas e 95 ações; documentação reconciliada em 18/09/2026.**
- [x] **A03** Corrigir a documentação de e-mails: o HTML v4 contém **32 modelos**, incluindo `m_confirma_acesso`. **Conferido em `emailModelosPadrao.ts`: 32 chaves históricas, incluindo `m_confirma_acesso`; documentação reconciliada em 18/09/2026.**
- [x] **A04** Reconciliar definitivamente a divergência entre o checklist antigo de 207 caixas e o contador histórico 208, sem apagar o histórico. **Contagem direta do checklist antigo: 207 caixas (183 marcadas / 24 abertas). O número 208 foi preservado apenas como contador histórico, sem inventar um 208º item.**

## B. Pendências reais de implementação encontradas na nova auditoria

### Novo e-mail de confirmação de acesso

- [x] **B01** Portar fielmente o modelo `m_confirma_acesso` do HTML v4, sem reescrever seu texto.
- [x] **B02** Inserir `m_confirma_acesso` na ordem canônica dos modelos, entre `m_primeiros_passos` e `m_primeiros_registros`.
- [x] **B03** Ligar a ação `d3-02` ao e-mail `m_confirma_acesso`, preservando `tut:1` e o link `ecolider`.
- [x] **B04** Confirmar que o novo modelo aparece no editor de modelos, na prévia e no botão de e-mail da ação correta.
- [x] **B05** Conferir texto, destinatário, assunto, tokens e comportamento do novo modelo contra o HTML v4. **Prévia validada pela Dina em 18/09/2026.**

### Tutorial de Primeiro Acesso

- [x] **B06** Incorporar fisicamente ao módulo o PDF histórico **Tutorial - Primeiro Acesso - Plataforma Onboarding.pdf**, sem alterar seu conteúdo.
- [x] **B07** Validar integridade do PDF histórico: arquivo correto, 7 páginas e hash registrado na auditoria.
- [x] **B08** Disponibilizar o tutorial nas quatro ações históricas: `d3-01`, `d3-04`, `d3-02` e `pos3-12`.
- [x] **B09** Disponibilizar o tutorial na prévia do e-mail `m_primeiros_passos`.
- [x] **B10** Disponibilizar o tutorial na prévia do e-mail `m_compliance_ugp`, conforme o comportamento histórico de `abrirMailObj`.
- [x] **B11** Disponibilizar o tutorial em **Configurações → Links e formulários**.
- [x] **B12** Testar o download real do tutorial em todos os pontos previstos e confirmar que o PDF abre corretamente. **Confirmado pela Dina em 18/09/2026 após deploy do PR #95.**

## C. Salvamento e persistência — validações finais

- [x] **C01** Testar novamente **Dados do processo** com o novo botão `Salvar alterações`, incluindo recarga da página. **Confirmado pela Dina em 18/09/2026.**
- [x] **C02** Testar **Bem Acolhido e teste comportamental** com rascunho + botão de salvar. **Confirmado pela Dina em 18/09/2026.**
- [x] **C03** Testar **Alinhamentos** com rascunho + `Salvar alterações do alinhamento`, confirmando que não grava a cada tecla. **Confirmado pela Dina em 18/09/2026.**
- [x] **C04** Confirmar que, havendo rascunho não salvo no alinhamento, ações diretas não sobrescrevem o texto digitado. **Confirmado pela Dina em 18/09/2026.**
- [x] **C05** Confirmar persistência após recarga para os dados alterados nos blocos acima. **Alinhamento e Dados do processo confirmados pela Dina em 18/09/2026.**

## D. Painel, Agenda e Indicadores

- [x] **D01** Testar o seletor em massa do Painel com **somente processos de demonstração**, além do botão em lote já validado. **Confirmado pela Dina em 18/09/2026: duas demonstrações mudaram juntas para “Em andamento”.**
- [x] **D02** Testar filtros e navegação do **Painel da semana** após todas as alterações. **Confirmado pela Dina em 18/09/2026.**
- [x] **D03** Testar **Agenda geral**: filtros, atalho para processo e deep-link para a ação. **Confirmado pela Dina em 18/09/2026.**
- [x] **D04** Testar exportação **CSV** da Agenda geral. **Confirmado pela Dina em 18/09/2026.**
- [x] **D05** Fazer conferência visual final de **Indicadores** contra o HTML v4. **Confirmado pela Dina em 18/09/2026; regra de responsabilidade operacional retestada após o PR #97.**
- [x] **D06** Conferir os 6 KPIs, gráficos, roscas e tabela pessoa a pessoa usando o processo de demonstração. **Confirmado pela Dina em 18/09/2026.**

## E. Registro de respostas e administração dos formulários

- [x] **E01** Testar importação por texto colado com dados de demonstração. **Validado pela Dina em 18/09/2026: texto colado foi analisado com 1 resposta de demonstração, sem gravação.**
- [ ] **E02** Testar arquivos `.csv`, `.tsv` e `.txt` sem usar dados reais.
- [x] **E03** Testar identificação automática de formulário, fuzzy match, ciclo/papel e conferência antes de registrar. **Validado pela Dina em 18/09/2026: Mariana de demonstração identificada com correspondência fuzzy de 48%, alerta de conferência, duplicidade e ação mapeada.**
- [ ] **E04** Testar política de duplicidade e transação em lote somente com demonstração.
- [ ] **E05** Testar microimportação dentro de uma ação.
- [ ] **E06** Testar **Respostas recebidas**: visualizar, editar e arquivar/remover uma resposta de demonstração.
- [ ] **E07** Testar as 6 abas administrativas de **Formulários**.
- [ ] **E08** Testar pendente de vinculação: corrigir identificação e vincular a processo de demonstração.
- [ ] **E09** Testar criação de processo a partir de Controle/Bem Acolhido somente com dado fictício.
- [ ] **E10** Testar descarte protegido de pendência fictícia.

## F. Cinco formulários públicos — ponta a ponta

- [ ] **F01** Controle do Programa de Integração: preencher, enviar, obter protocolo e conferir chegada no administrativo.
- [ ] **F02** Bem Acolhido em Nossa Unidade: preencher, enviar, obter protocolo e conferir vínculo.
- [ ] **F03** Pesquisa de Integração: preencher, enviar e conferir ciclo correto.
- [ ] **F04** Avaliação do Programa de Integração: testar como Gestor e conferir registro/cálculos.
- [ ] **F05** Avaliação do Programa de Integração: testar como Anjo e conferir papel correto.
- [ ] **F06** Acompanhamento do PDI: preencher, enviar e conferir atualização esperada.
- [x] **F07** Validar regras públicas: CPF/telefone numéricos, data, texto longo >= 10, escala 0–5 com zero fora da média. **Validado por inspeção cliente+servidor em 19/09/2026: CPF exige 11 dígitos; telefone exige 10/11 com DDD; texto longo exige >=10 caracteres; datas usam campo `date`; escala aceita somente inteiros 0–5; cálculo de média ignora respostas 0 (`n > 0`).**
- [ ] **F08** Testar resposta ambígua indo para **Pendentes de vinculação**, sem criação automática de pessoa.
- [ ] **F09** Testar a política de duplicidade dos formulários públicos.

## G. Quatro alinhamentos e subsistema da Mentora

- [ ] **G01** Testar 1º Alinhamento ponta a ponta.
- [ ] **G02** Testar 2º Alinhamento ponta a ponta.
- [ ] **G03** Testar 3º Alinhamento ponta a ponta.
- [ ] **G04** Testar 4º Alinhamento ponta a ponta.
- [ ] **G05** Testar checklist de prontidão da Mentora.
- [ ] **G06** Testar WhatsApp de disponibilidade e WhatsApp de confirmação sem enviar para contato real.
- [ ] **G07** Testar horários sugeridos e uso desses horários no e-mail ao gestor.
- [x] **G08** Confirmar que marcar a preparação da Mentora como concluída fecha a ação correspondente. **Confirmado por inspeção da regra em 19/09/2026: `alternarPreparacaoMentora()` grava `men.ok` e chama `aplicarAutomacoesProcesso()`; esta automação marca `agN-00` como `ok` com data quando `alinhamento.men.ok` está ativo.**

## H. Cobrança de formulários

- [ ] **H01** Testar agrupamento de formulários vencidos por responsável usando demonstração.
- [x] **H02** Conferir o e-mail único por responsável, links e vencimentos. **Conferido por inspeção em 19/09/2026: pendências são agrupadas por Gestor/Anjo/Colaborador/UGP, o e-mail é montado por responsável, inclui o formulário, data prevista, indicação de atraso e link correspondente quando configurado.**
- [ ] **H03** Testar `Marcar como cobrados` e a observação automática.
- [ ] **H04** Testar a cobrança reduzida do 4º ciclo no Fechamento final.

## I. PDFs e Word

- [ ] **I01** Gerar e conferir **Agenda de Onboarding PDF**.
- [ ] **I02** Gerar e conferir **Relatório de Andamento PDF**.
- [ ] **I03** Gerar e conferir **Checkpoint do Processo PDF**.
- [ ] **I04** Gerar e conferir **Relatório de Evolução** antes do 2º, 3º e 4º alinhamentos.
- [ ] **I05** Gerar e conferir **Relatório de Evolução completo** no Fechamento final.
- [ ] **I06** Gerar e conferir **Briefing da Mentora PDF**.
- [ ] **I07** Gerar e conferir **Relatório da Mentora Word**.
- [ ] **I08** Gerar e conferir **Ata do alinhamento Word**.
- [ ] **I09** Gerar e conferir **Relatório para UGP Word**.
- [ ] **I10** Testar “gerar os dois” e confirmar a marcação automática da ação prevista.

## J. E-mails

- [x] **J01** Reauditar os **32 modelos** do HTML v4 texto a texto após incluir `m_confirma_acesso`. **Reauditoria documental atualizada em 19/09/2026 em `AUDITORIA_32_EMAILS.md`; o 32º modelo `m_confirma_acesso` foi comparado ao HTML v4 e preserva posição entre `m_primeiros_passos` e `m_primeiros_registros`.**
- [x] **J02** Testar prévias com tokens usando somente processo de demonstração. **Validado pela Dina em produção com processos de demonstração: prévias abriram com destinatário, assunto e tokens resolvidos, incluindo confirmação de acesso e agendamento do 1º alinhamento.**
- [x] **J03** Conferir indicação de anexos em todos os modelos que têm anexo histórico. **Conferido por auditoria histórica: os 10 modelos com indicação textual de anexo permanecem mapeados; o HTML v4 acrescenta `m_confirma_acesso` sem anexo, portanto não altera essa relação. Tutorial permanece tratado separadamente nos pontos históricos específicos.**
- [x] **J04** Conferir tutorial nos dois diálogos históricos previstos: `m_primeiros_passos` e `m_compliance_ugp`.
- [x] **J05** Testar marcar e-mail como enviado e automações relacionadas usando somente demonstração. **Validado pela Dina durante os testes dos botões de e-mail no Painel/Timeline: geração, marcação de enviado e atualização do estado funcionaram em demonstração.**

## K. Gerenciar pessoas

Evidências já obtidas:
- [x] **K01** Criar novo processo de demonstração.
- [x] **K02** Encerrar processo de demonstração.
- [x] **K03** Reabrir processo de demonstração.

Pendências:
- [x] **K04** Retestar **Editar pessoa/processo** com o novo botão explícito de salvar. **Validado pela Dina: alteração de nome/dados exibiu salvamento explícito, confirmação “Salvo e conferido no servidor” e persistiu após recarga.**
- [ ] **K05** Testar **Reordenar** somente entre processos de demonstração, sem deslocar pessoas reais indevidamente.
- [ ] **K06** Testar **Remover/arquivar** um processo de demonstração, confirmando preservação do histórico.

## L. Configurações, backup e recuperação

- [x] **L01** Conferir as 7 abas de Configurações contra o HTML v4. **Conferido em 18/09/2026: HTML v4 e EcoLíder atual têm as mesmas 7 abas — Modelos de e-mail; Mentoras / Consultoras CKM; Cursos obrigatórios; Aviso e assinatura; Links e formulários; Datas e feriados; Dados e backup.**
- [ ] **L02** Testar persistência segura de uma alteração reversível em Configurações e devolver ao valor anterior.
- [ ] **L03** Baixar e validar **backup JSON completo**.
- [ ] **L04** Criar, baixar e conferir um **ponto de restauração** sem restaurá-lo.
- [x] **L05** Confirmar o limite de 12 pontos e o ponto automático diário por inspeção/estado, sem apagar dados reais. **Conferido por inspeção em 18/09/2026: `ConfiguracaoDadosBackup` chama `garantirPontoAutomaticoDoDia`, exibe `LIMITE_PONTOS_RESTAURACAO` e informa manutenção dos 12 pontos mais recentes + 1 ponto automático por dia quando há processos. Nenhuma remoção/restauração foi executada.**
- [ ] **L06 — PROTEGIDO** Testar **restauração real de backup** somente com nova autorização explícita da Dina e plano de rollback.
- [x] **L07 — NÃO EXECUTAR EM PRODUÇÃO** Validar a lógica de **Limpar todas as marcações** sem disparar o reset global sobre pessoas reais. **Validado por inspeção segura em 19/09/2026: a auditoria registra a função histórica `btn-limpar` e confirma que o reset global não foi reproduzido/exposto no módulo atual justamente por ser operação de alto impacto. Nenhum reset foi disparado.**
- [x] **L08** Validar proteção de falha de conexão/recuperação sem colocar dados reais em risco. **Validado por inspeção em 19/09/2026: mutações passam por `exigirConexaoParaAlterar`; salvamentos, lotes, reordenação e arquivamento exigem releitura/confirmação do servidor e falham fechados quando a confirmação não corresponde. Nenhuma falha destrutiva foi provocada.**
- [x] **L09** Validar a tela de recuperação de erro sem provocar falha destrutiva em produção. **Validada em ocorrência real não destrutiva durante teste mobile: a tela exibiu “Ocorreu um erro inesperado”, detalhe técnico e opções “Tentar Novamente” / “Recarregar Página”; o defeito de `currentTarget` foi depois corrigido.**

## M. Fechamento técnico e regressão

- [x] **M01** Executar build/TypeScript da versão final. **Build final executado pelo Railway no deploy do PR #129 em 19/09/2026: `vite build` concluído com sucesso e bundle do servidor (`esbuild server/_core/index.ts`) concluído com sucesso. O log contém apenas avisos preexistentes fora do Programa de Integração; nenhuma falha de compilação do módulo foi registrada.**
- [ ] **M02** Executar testes técnicos aplicáveis.
- [ ] **M03** Fazer fluxo ponta a ponta completo com processo de demonstração, do início ao fechamento.
- [ ] **M04** Fazer auditoria visual em desktop.
- [ ] **M05** Fazer auditoria visual em celular.
- [ ] **M06** Fazer regressão das áreas do EcoLíder fora do Programa de Integração, **sem alterá-las**, apenas confirmando que continuam funcionando.
- [x] **M07** Fazer comparação final do Programa de Integração contra o HTML v4 e o inventário, item por item. **Comparação estática consolidada em 19/09/2026 pelas auditorias do inventário, 95 ações, estado/constantes, eventos, Painel, Agenda/Mentora, PDFs, anexos/tutorial e 32 e-mails. O delta do HTML v4 (`m_confirma_acesso` em `d3-02`) e as divergências antigas já resolvidas foram reconciliados; testes operacionais permanecem nos itens próprios.**
- [x] **M08** Atualizar documentação final e marcar somente evidências comprovadas. **Documentação final consolidada e atualizada em 19/09/2026: HTML v4, 19/95, 32 e-mails, tutorial, auditorias de inventário/ações/PDFs, mapa funcional e checklist reconciliados. Após as correções finais, também foram documentados o `FORM_DO_ITEM` histórico do PDI (`pos2-02`/`pos4-02`), a retirada da pergunta extra do Bem Acolhido e a restauração dos textos completos de Bem/Pesquisa/Avaliação. Itens que exigem execução real permanecem abertos.**
- [x] **M09** Criar checkpoint/backup imediatamente anterior ao fechamento final e documentar rollback. **Criado o checkpoint `backup-main-implementacao-integracao-concluida-20260919` apontando para o commit `a2b21ae5f8f8d07ed33ea8709325bca958df54e1`. Checkpoints anteriores também permanecem preservados; rollback deve usar branch/checkpoint, sem restauração de banco.**
- [x] **M10** Revisar diff final antes de qualquer merge/deploy de encerramento. **Diff do PR #129 revisado integralmente antes do merge: 7 arquivos, sendo 2 arquivos de código exclusivamente do Programa de Integração e 5 arquivos de documentação/auditoria; sem banco, migração, rota global ou outro módulo.**
- [ ] **M11** Obter autorização explícita da Dina quando a etapa envolver produção ou operação protegida.
- [x] **M12** Fazer deploy final, conferir Railway e executar teste pós-deploy. **PR #129 mesclado em `main` no commit `a2b21ae5f8f8d07ed33ea8709325bca958df54e1`; Railway concluiu com `SUCCESS`. O log de runtime confirmou `Server running on http://localhost:8080/`. Erros de inicialização observados pertencem a rotinas preexistentes de outros módulos do EcoLíder e não foram alterados por regra de escopo. Validações funcionais/visuais do Programa continuam nos itens M03–M05 e nos blocos E–L.**
- [ ] **M13** Registrar aceite final: Programa de Integração fiel ao HTML v4 e funcionando.

---

## Evidências importantes já confirmadas antes deste checklist

- Salvamento individual com leitura de volta foi comprovado em produção.
- Ação em lote para duas pessoas de demonstração foi comprovada e retornou sucesso.
- Novo processo de demonstração foi criado pelo fluxo oficial.
- Encerrar e reabrir processo de demonstração foram comprovados.
- Bem Acolhido e teste comportamental com botão de salvar foram comprovados pela Dina.
- Os 19 marcos / 95 ações foram auditados no código reconstruído.
- As funções principais de Painel, Agenda, Indicadores, formulários, PDFs/Word, Mentora, Configurações e backup já existem; os itens acima são o que ainda precisa ser implementado, retestado ou fechado para 100%.
