# Paridade funcional — HTML histórico x EcoLíder

Fonte funcional obrigatória: `trilha-integracao-codigo-completo_3.html`.

Regra: nenhuma tela, menu, botão, cálculo ou interação é considerado concluído até ser conferido contra o HTML histórico. A aparência pode seguir o padrão visual do EcoLíder; comportamento e conteúdo funcional não podem ser simplificados.

Status usados neste checklist:
- `OK-FONTE`: lógica/conteúdo já reconstruído a partir do HTML, ainda sujeito a teste integrado.
- `PARCIAL`: existe estrutura, mas falta comportamento ou conteúdo.
- `PENDENTE`: ainda não reconstruído integralmente.
- `VALIDAR`: existe código, mas precisa de auditoria final contra o HTML.

## 1. Navegação principal

- [x] Painel da semana — `OK-FONTE` / auditoria final ainda necessária.
- [ ] Agenda geral — `PARCIAL`.
- [ ] Indicadores — `PARCIAL`.
- [ ] Registrar respostas — `PENDENTE`.
- [ ] Respostas recebidas — `PENDENTE`.
- [ ] Formulários — `PARCIAL`.
- [ ] Atas e relatórios — `PENDENTE`.
- [ ] Processos ativos com acesso individual — `PARCIAL`.
- [ ] Processos encerrados com acesso individual — `PARCIAL`.
- [ ] Gerenciar pessoas — `PARCIAL`.
- [ ] Configurações — `PARCIAL`.
- [x] Tema — existe no EcoLíder; conferir rótulo/posição na auditoria visual.
- [ ] Backup — `PENDENTE`; não manter botão sem função real.

## 2. Submenus de Formulários — rótulos exatos do HTML

- [ ] Formulários disponíveis
- [ ] Links de resposta
- [ ] Pendentes de vinculação
- [ ] Respostas recebidas
- [ ] Editar perguntas e textos
- [ ] Configuração dos formulários

### Interações obrigatórias da área Formulários

- [ ] listar os 5 formulários com definição, papel-alvo, versão, quantidade de perguntas exibidas e status ativo/inativo;
- [ ] abrir lista de perguntas de cada formulário;
- [ ] ativar/desativar formulário;
- [ ] gerar/exibir um link público único e reutilizável por formulário;
- [ ] copiar link público;
- [ ] abrir prévia da página pública;
- [ ] listar respostas pendentes de vinculação;
- [ ] mostrar resposta completa pendente;
- [ ] editar identificação da resposta pendente antes de vincular;
- [ ] sugerir candidatos de vínculo;
- [ ] vincular a processo existente;
- [ ] permitir criação consciente de novo processo somente pela ação administrativa prevista no HTML;
- [ ] descartar pendência com comportamento seguro e auditável;
- [ ] listar respostas recebidas com filtros;
- [ ] abrir detalhe completo de uma resposta;
- [ ] editar perguntas e textos conforme funções do HTML;
- [ ] preservar códigos internos fixos das perguntas;
- [ ] configurar versão, política de duplicidade e demais opções existentes no HTML;
- [ ] preservar wizard público, validações de obrigatório, escala 0–5, telas de sucesso e protocolo.

## 3. Submenus de Configurações — rótulos exatos do HTML

- [ ] Modelos de e-mail
- [ ] Mentoras / Consultoras CKM
- [ ] Cursos obrigatórios
- [ ] Aviso e assinatura
- [ ] Links e formulários
- [ ] Datas e feriados
- [ ] Dados e backup

### Interações obrigatórias de Configurações

#### Modelos de e-mail
- [x] 31 modelos históricos consolidados — `OK-FONTE`.
- [x] ordem histórica dos modelos — `OK-FONTE`.
- [x] substituição de tokens — `OK-FONTE`.
- [x] personalização parcial preservando padrão — `OK-FONTE`.
- [ ] lista agrupada por fase — `PENDENTE`.
- [ ] selecionar modelo — `PENDENTE`.
- [ ] editar Para / CC / Assunto / Corpo / Anexo — `PENDENTE`.
- [ ] indicação visual de modelo editado — `PENDENTE`.
- [ ] restaurar padrão do modelo — `PENDENTE`.
- [ ] inserir tokens clicáveis — `PENDENTE`.
- [ ] salvar sem risco de apagar configurações não relacionadas — `PENDENTE`.

#### Mentoras / Consultoras CKM
- [ ] listar mentoras;
- [ ] editar nome, telefone/WhatsApp, e-mail e observação;
- [ ] ativar/inativar;
- [ ] adicionar mentora;
- [ ] remover somente quando seguro, conforme HTML;
- [ ] mostrar quantidade de usos/processos;
- [ ] abrir contato/WhatsApp quando previsto;
- [ ] preservar mentora associada aos processos existentes.

#### Cursos obrigatórios
- [ ] reconstruir lista, inclusão, edição, ativação/inativação e remoção conforme HTML;
- [ ] preservar uso dos cursos nas comunicações e no acompanhamento.

#### Aviso e assinatura
- [ ] reconstruir campos e prévia;
- [ ] preservar aviso padrão e assinatura usados pelos modelos de e-mail.

#### Links e formulários
- [ ] reconstruir todos os links/tokens previstos;
- [ ] alinhar links públicos atuais da plataforma aos tokens dos e-mails;
- [ ] não fabricar URL que não exista.

#### Datas e feriados
- [x] cálculo de dias úteis e feriados no Painel — `OK-FONTE`.
- [ ] interface de gestão de datas/feriados — `PENDENTE`.

#### Dados e backup
- [ ] exportar backup real;
- [ ] importar/restaurar com validação e confirmação;
- [ ] respeitar proteção contra sobrescrita/destruição;
- [ ] manter reversão disponível.

## 4. Painel da semana — auditoria de paridade

### Estrutura e cálculos
- [x] 19 etapas / 95 ações reais.
- [x] calendário e dias úteis.
- [x] 7 KPIs.
- [x] filtros CKM / deles e filtros por status.
- [x] agrupamento por tarefa.
- [x] cards de processo com progresso.
- [x] respostas pendentes no topo.

### Interações por tarefa/pessoa
- [x] concluir ação individual.
- [x] seletor de situação individual/coletivo.
- [x] ficha da ação.
- [x] data de conclusão/envio.
- [x] programação.
- [x] justificativa.
- [x] observações com data/hora.
- [x] visualizar resposta real já registrada.
- [x] Agenda PDF.
- [x] Relatório de andamento PDF.
- [x] Checkpoint PDF.
- [x] Relatório de evolução — fonte reconstruída e pontos da jornada identificados.
- [ ] e-mails: abrir prévia, copiar, marcar enviado e refletir status exatamente como HTML.
- [ ] resposta ausente: mostrar ação para registrar/importar quando o item possui formulário.
- [ ] comportamento exato de checkbox ao marcar/reabrir e abertura automática da ficha.
- [ ] toast histórico após marcar como feito.
- [ ] botão coletivo considerar somente pessoas ainda abertas.
- [ ] avatar/iniciais e demais detalhes visuais da linha/card.
- [ ] auditoria final item a item antes de declarar Painel concluído.

## 5. Agenda geral

- [ ] reproduzir coleta, ordenação, agrupamentos e filtros do HTML;
- [ ] reproduzir ações/atalhos por linha;
- [ ] reproduzir navegação para pessoa;
- [ ] reproduzir exportações reais previstas;
- [ ] conferir processos ativos/encerrados conforme comportamento histórico.

## 6. Indicadores

- [ ] KPIs gerais do programa;
- [ ] pessoas por fase do processo;
- [ ] formulários vencidos por responsável;
- [ ] avaliação do gestor por alinhamento (média 1–5 das 32 perguntas);
- [ ] Jornada Compliance e PDI usando o último acompanhamento do PDI;
- [ ] tabela por pessoa com dia do programa, progresso, atraso, Jornada, PDI e sinal;
- [ ] botões para Painel da semana e Respostas recebidas;
- [ ] estados vazios equivalentes ao HTML.

## 7. Registrar respostas

- [ ] área de importação por texto colado;
- [ ] escolha do formulário;
- [ ] análise/separação das linhas;
- [ ] identificação de pessoa/processo;
- [ ] tratamento de duplicidade;
- [ ] aplicação/registro seletivo;
- [ ] mensagens de erro e aviso;
- [ ] persistência segura na arquitetura atual sem reintroduzir criação automática indevida.

## 8. Respostas recebidas

- [ ] listagem consolidada;
- [ ] filtros;
- [ ] detalhe completo;
- [ ] médias/alertas quando aplicável;
- [ ] identificação de fonte, ciclo, papel, data, avaliador/respondente;
- [ ] navegação para o processo relacionado;
- [ ] remoção/arquivamento sem exclusão física quando previsto na arquitetura atual.

## 9. Atas e relatórios

- [ ] tela de seleção pessoa/alinhamento;
- [ ] dados de briefing;
- [ ] ata por alinhamento;
- [ ] relatório completo;
- [ ] relatório de evolução;
- [ ] checkpoint;
- [ ] agenda;
- [ ] conteúdo, cálculos e nomes de arquivos conferidos com HTML.

## 10. Detalhe do processo / pessoa

- [ ] cabeçalho e dados do colaborador;
- [ ] sinal/status e progresso;
- [ ] timeline completa das 19 etapas;
- [ ] abrir/fechar etapa;
- [ ] marcações de ações;
- [ ] fichas das ações;
- [ ] bloco dos alinhamentos;
- [ ] mentora em passos;
- [ ] Bem Acolhido;
- [ ] Avaliação de Potencial / teste;
- [ ] PDI;
- [ ] respostas de formulários;
- [ ] atas/relatórios/atalhos;
- [ ] edição dos dados permitidos;
- [ ] encerramento/reativação conforme HTML.

## 11. Gerenciar pessoas

- [ ] nova pessoa/processo;
- [ ] editar pessoa/processo;
- [ ] visualizar timeline;
- [ ] ordenar quando aplicável;
- [ ] encerrar/reativar;
- [ ] validações e confirmações;
- [ ] nenhum `console.log` substituindo ação real.

## 12. Automação entre campos e etapas

Conferir integralmente `aplicarAutomacoes` do HTML:
- [x] programado vencido vira concluído na data programada — lógica reconstruída.
- [x] solicitação de alinhamento concluída pode levar `agN-02` a aguardando — lógica reconstruída.
- [x] alinhamento agendado marca `agN-02` e data — lógica reconstruída.
- [x] preparo da mentora marca `agN-00` — lógica reconstruída.
- [x] alinhamento realizado marca `d{marco}-01` — lógica reconstruída.
- [ ] auditar novamente após todas as telas estarem integradas para evitar regressão.

## 13. E-mails dentro das ações

- [x] `mail` e `mails` lidos do plano real.
- [x] rótulo curto e contexto de agendamento.
- [x] 31 modelos históricos disponíveis em registro único.
- [x] valores/tokens principais calculados sem escrita.
- [ ] prévia em diálogo com Para, CC, Assunto, Corpo e Anexo.
- [ ] aviso de `PREENCHA AQUI` destacado.
- [ ] copiar texto simples.
- [ ] copiar assunto/corpo conforme HTML.
- [ ] marcar como enviado usando o status da ação.
- [ ] editar modelo pela configuração.
- [ ] manter botão `enviado?` / `✓ enviado` conforme situação.

## 14. Formulários públicos

Rotas permanentes da plataforma:
- `/formularios/controle-integracao`
- `/formularios/bem-acolhido`
- `/formularios/pesquisa-integracao`
- `/formularios/avaliacao-programa`
- `/formularios/acompanhamento-pdi`

Auditoria obrigatória:
- [ ] identidade visual adaptada ao EcoLíder sem perder estrutura do HTML;
- [ ] wizard de passos;
- [ ] campos de identificação;
- [ ] perguntas/ordem/tipos;
- [ ] escala 0–5;
- [ ] regras condicionais;
- [ ] validações obrigatórias;
- [ ] mensagem de sucesso/protocolo;
- [ ] comportamento quando resposta fica pendente de vinculação;
- [ ] política de duplicidade;
- [ ] nenhum processo novo criado automaticamente por ambiguidade.

## 15. Critério para declarar 100%

Somente declarar paridade completa quando:
1. todos os itens acima estiverem implementados;
2. cada interação tiver sido conferida contra `trilha-integracao-codigo-completo_3.html`;
3. nenhum botão for decorativo/falso;
4. nenhum menu apontar para placeholder;
5. dados históricos permanecerem preservados;
6. configuração não puder descartar respostas pendentes por payload incompleto;
7. TypeScript/build/testes aplicáveis tiverem sido executados;
8. teste visual/funcional tiver sido feito em ambiente seguro;
9. somente depois disso houver decisão explícita sobre deploy.
