# Plano Mestre — Trilha de Integração acoplada ao EcoLíder

## Objetivo

Entregar o Programa de Integração 100% funcional dentro do EcoLíder, preservando tudo o que existe na Trilha de Integração original: telas, regras, ações, cálculos, documentos, e-mails, formulários, automações, configurações, backups, demonstração e comportamentos de segurança.

A aparência pode ser adaptada ao padrão visual do EcoLíder. A lógica funcional não pode ser simplificada, removida ou substituída por placeholders.

## Fonte funcional congelada

A referência obrigatória é o pacote original separado por blocos, remontado na ordem definida pelo próprio README. O HTML completo mais recente continua sendo usado para conferência final de comportamento e texto.

Ordem oficial dos blocos:

1. `01-css.html`
2. `02-css2.html`
3. `03-const.js`
4. `03b-forms.js`
5. `04-modelos.js`
6. `05-estado.js`
7. `06a.js`
8. `06b.js`
9. `07-render2.js`
10. `07b-mentora.js`
11. `08-config.js`
12. `08b-registros.js`
13. `08c-cobranca.js`
14. `08d-backup.js`
15. `08e-demo.js`
16. `09-pdf.js`
17. `09b-briefing.js`
18. `09c-word.js`
19. `11-respostas.js`
20. `12-atas.js`
21. `13-indicadores.js`
22. `14-tutorial.js`
23. `15-publico.js`
24. `10-eventos.js`

`10-eventos.js` permanece logicamente por último porque liga as interações e depende das definições dos demais blocos.

## Regras de trabalho

- Produção não é ambiente de teste.
- Todo trabalho permanece na branch `reconstrucao-integracao-completa-20260916` até validação final e autorização explícita.
- Alterações devem ser pequenas, rastreáveis e reversíveis.
- Antes de operação destrutiva, mudança global de configuração, restauração ou publicação: parar e obter autorização explícita.
- Dados históricos não devem ser reimportados nem substituídos apenas para facilitar desenvolvimento.
- Não considerar uma função concluída porque a tela existe. É necessário validar regra, interação, persistência e recarga.
- Não usar `PUT /config` como atalho para operações específicas de respostas pendentes, pessoas ou outras entidades.
- Onde o original usa estado global/localStorage, preservar a regra de negócio e adaptar apenas a camada de persistência ao banco/API do EcoLíder.

## Estados de auditoria

- `ORIGINAL`: função confirmada na fonte histórica.
- `PARCIAL`: há implementação no EcoLíder, mas não há paridade completa.
- `IMPLEMENTADO`: lógica portada, ainda aguardando teste integrado.
- `VALIDADO`: comparado com a fonte + persistência/teste confirmados.
- `BLOQUEADO-SEGURANÇA`: exige endpoint, autorização ou desenho seguro antes de habilitar escrita.

## Matriz dos 24 blocos-fonte

| # | Fonte original | Responsabilidade | Situação inicial no EcoLíder | Próxima ação |
|---|---|---|---|---|
| 1 | `01-css.html` | estrutura visual, tema, menu, cartões e estados | PARCIAL | auditoria visual ao final de cada tela |
| 2 | `02-css2.html` | estilos de timeline, tabelas, formulários, diálogos e gráficos | PARCIAL | portar apenas estilos necessários sem quebrar o design system |
| 3 | `03-const.js` | links, feriados, status, cursos, jornada e ações | IMPLEMENTADO/PARCIAL | conferir IDs, textos, responsáveis e metadados de todas as ações |
| 4 | `03b-forms.js` | definição dos 5 formulários + leitura/importação CSV/TSV/TXT | PARCIAL | portar o motor de importação integral |
| 5 | `04-modelos.js` | 30+ modelos de e-mail | IMPLEMENTADO | auditoria final modelo a modelo |
| 6 | `05-estado.js` | datas, dias úteis, estado, processo, ficha, alinhamentos e automações | PARCIAL | fechar adaptador de compatibilidade + persistência segura |
| 7 | `06a.js` | tokens e montagem de e-mails | IMPLEMENTADO/PARCIAL | conferir tokens, links, aviso e valores de contexto |
| 8 | `06b.js` | navegação e Painel da semana | PARCIAL | auditoria completa do Painel e navegação original |
| 9 | `07-render2.js` | página da pessoa + Agenda geral | PARCIAL | completar dados do processo, respostas, cobrança e linha do tempo |
| 10 | `07b-mentora.js` | preparação da mentora e reuniões | PARCIAL | completar seleção, checklist, WhatsApp e prontidão |
| 11 | `08-config.js` | 7 abas de Configurações | PENDENTE/PARCIAL | construir telas e endpoints específicos seguros |
| 12 | `08b-registros.js` | Registrar respostas + respostas na página da pessoa | PENDENTE | portar importação em massa e microimportação |
| 13 | `08c-cobranca.js` | cobrança agrupada de formulários | PENDENTE | portar regra e e-mail dinâmico |
| 14 | `08d-backup.js` | pontos de restauração + backup JSON | PENDENTE | desenhar persistência equivalente sem sobrescrita perigosa |
| 15 | `08e-demo.js` | processo de demonstração | PENDENTE | portar somente após CRUD seguro |
| 16 | `09-pdf.js` | Agenda, Andamento, Checkpoint, Evolução | IMPLEMENTADO/PARCIAL | comparar conteúdo e cálculos PDF por PDF |
| 17 | `09b-briefing.js` | Briefing da Mentora PDF | PENDENTE | portar conteúdo e validação de prontidão |
| 18 | `09c-word.js` | Relatório da Mentora Word | PENDENTE | portar DOCX + fallback |
| 19 | `11-respostas.js` | Respostas recebidas, filtros, edição e remoção | PENDENTE | criar tela + endpoints específicos |
| 20 | `12-atas.js` | Ata + Relatório UGP em Word | PENDENTE | portar editor + geração DOCX |
| 21 | `13-indicadores.js` | dashboard de Indicadores | IMPLEMENTADO/PARCIAL | substituir painel genérico pela lógica original exata |
| 22 | `14-tutorial.js` | tutorial de primeiro acesso PDF | PENDENTE | disponibilizar sem expor arquivo indevidamente |
| 23 | `15-publico.js` | 5 formulários públicos, vínculo, textos e políticas | PARCIAL | fechar validações, duplicidade e fila administrativa |
| 24 | `10-eventos.js` | todos os cliques, mudanças, diálogos, boot e sincronização | PENDENTE COMO AUDITORIA FINAL | mapear cada handler original para componente/ação EcoLíder |

## Sequência de implementação

### Fase 0 — Fonte e checklist

- [x] congelar os 24 blocos e sua ordem oficial;
- [x] manter `PARIDADE_HTML_TRILHA.md` como checklist funcional;
- [x] criar este Plano Mestre;
- [ ] conferir que cada função pública relevante dos 24 blocos aparece em uma linha de auditoria;
- [ ] manter mapa Original -> EcoLíder atualizado a cada commit.

### Fase 1 — Fundação e persistência

- [x] criar `legacy/legacyStateAdapter.ts` somente com leitura/estado/processo, sem escrita global destrutiva;
- [ ] conferir tipos do processo/resposta/config contra o estado original;
- [ ] criar operações específicas para mudanças que hoje dependeriam de `PUT /config`;
- [ ] garantir leitura de volta depois das gravações críticas;
- [ ] resolver estratégia para edição de texto sem gravação a cada tecla e sem perda de evento;
- [ ] testar recarga do estado após alterações.

### Fase 2 — Constantes, calendário e jornada

- [ ] comparar `03-const.js` com `planoReal` item por item;
- [ ] confirmar 19 etapas e todos os IDs/ações;
- [ ] confirmar responsável, lado CKM/Sebrae, `mail`, `mails`, `form`, `link`, `pdf`, `tut`;
- [ ] validar feriados 2025-2030 e regras `prox`/`ant`;
- [ ] validar datas 15/45/60/75/150 e etapas pré/pós;
- [ ] validar recalculo a partir de data confirmada de alinhamento.

### Fase 3 — Painel da semana

- [ ] paridade dos 7 KPIs;
- [ ] filtros e agrupamento por tarefa;
- [ ] pior situação do grupo;
- [ ] ações individuais/coletivas;
- [ ] ficha completa da ação;
- [ ] e-mails e estado enviado;
- [ ] resposta existente e ação para resposta ausente;
- [ ] PDFs e relatório de evolução;
- [ ] cartões ativos e encerrados;
- [ ] navegação exata.

### Fase 4 — Agenda geral

- [ ] linhas de todas as ações;
- [ ] linhas extras de comunicação com mentora;
- [ ] filtros de situação/responsável/pessoa;
- [ ] atalhos para e-mail e item da timeline;
- [ ] CSV exatamente compatível com o original;
- [ ] deep-link `?item=`.

### Fase 5 — Página individual completa

- [ ] cabeçalho e botões Agenda/Relatório/Checkpoint/Cobrar formulários;
- [ ] progresso e 4 cartões dos alinhamentos;
- [ ] bloco editável Dados do processo;
- [ ] Bem Acolhido;
- [ ] teste comportamental;
- [ ] respostas agrupadas por ciclo;
- [ ] filtros da timeline;
- [ ] 19 etapas e 95 ações;
- [ ] mural/observações e justificativas;
- [ ] ações especiais por item.

### Fase 6 — Alinhamentos e Mentora

- [ ] painel dos alinhamentos 1-4;
- [ ] data, hora, link, realizado e relatórios;
- [ ] ata/link/Drive/observações;
- [ ] seleção da mentora;
- [ ] compatibilidade com consultora legada;
- [ ] checklist de prontidão;
- [ ] WhatsApp de disponibilidade;
- [ ] horários e uso no e-mail do gestor;
- [ ] WhatsApp de confirmação;
- [ ] conclusão automática da preparação.

### Fase 7 — Documentos da Mentora

- [ ] Briefing PDF (`09b-briefing.js`);
- [ ] validação de dados mínimos antes de gerar;
- [ ] conteúdo específico do 1º ciclo;
- [ ] conteúdo específico dos ciclos 2-4;
- [ ] Relatório da Mentora DOCX (`09c-word.js`);
- [ ] fallback `.doc` quando aplicável.

### Fase 8 — E-mails

- [ ] conferir os 31 modelos;
- [ ] tokens e links oficiais;
- [ ] Para/CC/Assunto/Corpo/Anexo;
- [ ] aviso global;
- [ ] `PREENCHA AQUI`;
- [ ] copiar rico/texto;
- [ ] abertura no cliente de e-mail quando prevista;
- [ ] relatório de evolução nos agendamentos 2-4;
- [ ] tutorial nas mensagens previstas;
- [ ] editor completo em Configurações.

### Fase 9 — Registrar respostas

- [ ] escolher formulário ou detectar automaticamente;
- [ ] colar conteúdo;
- [ ] abrir `.csv`, `.tsv` e `.txt`;
- [ ] detectar separador;
- [ ] remontar células quebradas;
- [ ] identificar formulário pelo cabeçalho;
- [ ] fuzzy match da pessoa;
- [ ] ciclo/papel;
- [ ] conferência linha por linha;
- [ ] duplicidade substituir/adicional/não registrar;
- [ ] avisos e preenchimentos de cadastro;
- [ ] registrar lote;
- [ ] marcar ações correspondentes;
- [ ] resumo final;
- [ ] microimportação dentro da ação.

### Fase 10 — Respostas recebidas

- [ ] filtros processo/formulário/ciclo;
- [ ] agrupamento por pessoa;
- [ ] visualizar resposta;
- [ ] editar ciclo/papel/respondente/data/campos;
- [ ] recalcular média/alertas;
- [ ] remover de modo seguro/auditável;
- [ ] navegação para processo.

### Fase 11 — Formulários públicos e administração

- [ ] cinco links públicos fixos;
- [ ] wizard por páginas;
- [ ] textos de apresentação e conclusão;
- [ ] tipos de pergunta exatos;
- [ ] obrigatoriedade;
- [ ] texto longo mínimo;
- [ ] CPF/telefone/data;
- [ ] escala 0-5 com 0 fora da média;
- [ ] protocolo;
- [ ] localizar processo por nome + sinais auxiliares;
- [ ] fila de pendentes;
- [ ] vincular/corrigir/descartar;
- [ ] criar novo processo somente nos casos permitidos e com confirmação;
- [ ] 6 abas administrativas;
- [ ] edição de perguntas e textos;
- [ ] restaurar padrão;
- [ ] ativo/versão/política de duplicidade.

### Fase 12 — Cobrança

- [ ] detectar formulários vencidos sem resposta;
- [ ] agrupar por responsável;
- [ ] um e-mail por responsável;
- [ ] listar links e vencimentos;
- [ ] marcar todos como aguardando resposta;
- [ ] registrar observação automática;
- [ ] cobrança reduzida do 4º ciclo.

### Fase 13 — Atas e relatórios Word

- [ ] seleção de processo;
- [ ] seleção do alinhamento;
- [ ] percepção líder;
- [ ] percepção colaborador;
- [ ] conclusão da ata;
- [ ] percepção da consultora/UGP;
- [ ] confidencialidade;
- [ ] gerar ata;
- [ ] gerar relatório UGP;
- [ ] gerar os dois;
- [ ] marcar ação correspondente quando previsto.

### Fase 14 — Indicadores

- [ ] 6 KPIs originais;
- [ ] pessoas por fase;
- [ ] formulários vencidos por responsável;
- [ ] avaliação do gestor nos 4 ciclos;
- [ ] roscas Jornada/PDI;
- [ ] tabela pessoa a pessoa;
- [ ] ordenação por pendências;
- [ ] navegação.

### Fase 15 — Configurações

- [ ] Modelos de e-mail;
- [ ] Mentoras / Consultoras CKM;
- [ ] Cursos obrigatórios;
- [ ] Aviso e assinatura;
- [ ] Links e formulários;
- [ ] Datas e feriados;
- [ ] Dados e backup.

Cada gravação de Configuração deve preservar chaves não relacionadas. Onde isso não estiver garantido pelo endpoint atual, criar operação específica antes de liberar a interface.

### Fase 16 — Backup, offline e demonstração

- [ ] pontos de restauração;
- [ ] máximo 12;
- [ ] automático diário;
- [ ] manual;
- [ ] baixar;
- [ ] restaurar com ponto prévio;
- [ ] importar backup validado;
- [ ] remover ponto;
- [ ] backup completo JSON;
- [ ] equivalente seguro ao estado offline/local do original;
- [ ] mensagem de falha de conexão;
- [ ] processo de demonstração completo.

### Fase 17 — Gerenciar pessoas e permissões

- [ ] nova pessoa;
- [ ] editar;
- [ ] reordenar;
- [ ] encerrar;
- [ ] reabrir;
- [ ] remover com confirmação e proteção;
- [ ] administração restrita a perfil autorizado;
- [ ] formulários públicos acessíveis apenas pelas rotas públicas previstas.

### Fase 18 — Eventos, testes e fechamento

- [ ] mapear todos os seletores/handlers do `10-eventos.js` para ações reais;
- [ ] nenhum botão falso;
- [ ] nenhum placeholder;
- [ ] nenhum handler sem função;
- [ ] build TypeScript;
- [ ] testes aplicáveis;
- [ ] teste de persistência após recarga;
- [ ] teste do processo de demonstração ponta a ponta;
- [ ] teste dos 5 formulários;
- [ ] teste dos 4 alinhamentos;
- [ ] teste de todos os documentos;
- [ ] teste de regressão do restante do EcoLíder;
- [ ] auditoria visual final;
- [ ] auditoria do inventário funcional completo;
- [ ] backup pré-publicação + rollback;
- [ ] autorização explícita da Dina;
- [ ] somente então merge/deploy;
- [ ] teste pós-deploy.

## Critério de 100%

Só registrar o Programa de Integração como 100% quando todos os blocos-fonte estiverem classificados como `VALIDADO` e quando:

1. nenhuma função do inventário original estiver faltando;
2. nenhum botão ou menu for placeholder;
3. nenhuma ação administrativa depender de gravação global arriscada por conveniência;
4. dados históricos permanecerem preservados;
5. build e testes tiverem sido executados de fato;
6. o fluxo ponta a ponta tiver sido validado em ambiente seguro;
7. a publicação tiver rollback preparado e autorização explícita.

## Situação no início deste plano

- Branch segura: `reconstrucao-integracao-completa-20260916`.
- Produção: não alterar durante a reconstrução.
- Adaptador inicial criado em `legacy/legacyStateAdapter.ts`.
- API atual já possui bootstrap administrativo e persistência por processo.
- O endpoint global de configuração exige atenção especial porque também trata a fila de pendentes; não deve ser usado como atalho durante a reconstrução.
- `ProgramaIntegracao.tsx` ainda contém placeholders em Registrar respostas, Respostas recebidas, Atas/Relatórios e Configurações; portanto esses módulos não podem ser tratados como concluídos.

## Próximo bloco de execução

Começar pela Fase 1:

1. fechar o mapa de persistência do estado original para as tabelas/API atuais;
2. identificar quais operações precisam de endpoints específicos antes de qualquer UI de escrita;
3. corrigir o adaptador para preservar exatamente a ordem e os dados sem escrita global;
4. somente depois seguir para a auditoria completa de `03-const.js` e `05-estado.js`.
