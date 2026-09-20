# Fonte histórica funcional mais recente

A referência histórica funcional para o fechamento desta reconstrução é o **`trilha-integracao-codigo-completo_4.html` (HTML v4)**. A contagem confirmada é **19 etapas / 95 ações / 32 modelos de e-mail**.

# Mapa funcional completo — Trilha histórica → EcoLíder

Fonte funcional obrigatória para o fechamento: `trilha-integracao-codigo-completo_4.html`.

Objetivo deste documento: localizar, por função pública, onde cada comportamento histórico está representado na reconstrução do EcoLíder. Este mapa não transforma item pendente em concluído; ele apenas impede que uma função do original fique sem destino conhecido.

## 1. Navegação principal

| Função histórica | EcoLíder atual | Situação |
|---|---|---|
| Painel da semana | `components/PainelSemana.tsx` | reconstruído; filtros, links e controles especiais auditados |
| Agenda geral | `components/AgendaGeral.tsx` + `helpers/agendaRealHelpers.ts` | reconstruído e auditado |
| Indicadores | `components/Indicadores.tsx` + helpers de indicadores | reconstruído e validado funcionalmente; build/visual final permanecem no fechamento |
| Registrar respostas | `components/RegistrarRespostas.tsx` + `helpers/registrarRespostasParser.ts` + `api/importResponses.ts` | reconstruído |
| Respostas recebidas | `components/RespostasRecebidas.tsx` + API dedicada | reconstruído |
| Formulários | `components/FormulariosIntegracaoAdmin.tsx` + rotas públicas | reconstruído |
| Atas e relatórios | `components/AtasRelatoriosGeral.tsx` + helpers Word/PDF | reconstruído |
| Gerenciar pessoas | `components/GerenciarPessoas.tsx` | criação demo, edição, encerrar e reabrir já validados; reordenação/arquivamento ainda exigem teste operacional |
| Configurações | componentes `Configuracao*` | reconstruídas por seção; 7 abas e backup local auditados; restauração real continua protegida |
| Tema | `ThemeContext` / botão na página principal | existente no EcoLíder |

## 2. Processos ativos e encerrados

| Função histórica | EcoLíder atual | Situação |
|---|---|---|
| Lista de ativos | bootstrap + filtro em `ProgramaIntegracao.tsx` | reconstruído |
| Lista de encerrados | bootstrap + filtro em `ProgramaIntegracao.tsx` | reconstruído |
| Abrir pessoa/processo | rota `/programa-integracao/detalhe/:processoId` | reconstruído |
| Sinal do processo | `helpers/painelProcessos.ts` | reconstruído |
| Progresso | `helpers/painelProcessos.ts` | reconstruído |
| Dia atual | `helpers/painelProcessos.ts` | reconstruído |
| Próxima etapa | `helpers/painelProcessos.ts` | reconstruído |

## 3. Plano, calendário e ações

| Função histórica | EcoLíder atual | Situação |
|---|---|---|
| 19 etapas | `helpers/planoReal.ts` | reconstruído |
| 95 ações | `helpers/planoReal.ts` | reconstruído |
| Responsáveis CKM/UGP/Gestor/Anjo/Colaborador | `LADO_RESPONSAVEL` / plano real | reconstruído |
| Dias corridos desde o primeiro dia | `helpers/painelAcoes.ts` | reconstruído |
| Próximo/anterior dia útil | `helpers/painelAcoes.ts` | reconstruído |
| Feriados padrão | `helpers/configDefaults.ts` | reconstruído |
| Feriados configurados | `ConfiguracaoDatas.tsx` | reconstruído |
| Fallback para feriados padrão | `cronogramaReal()` | reconstruído e auditado |
| Datas confirmadas dos alinhamentos | `processo.alin[n].data` + `cronogramaReal()` | reconstruído |
| Pós-alinhamento no próximo útil | `cronogramaReal()` | reconstruído |
| Agendamento 7 dias antes | `cronogramaReal()` | reconstruído |

## 4. Ficha da ação

| Função histórica | EcoLíder atual | Situação |
|---|---|---|
| Pendente / Programado / Em andamento / Aguardando / Feito / Não se aplica / Não será feita | `itemStateHelpers.ts` | reconstruído |
| Data de conclusão | ficha da ação | reconstruído |
| Programar envio | ficha da ação | reconstruído |
| Justificativa | ficha da ação | reconstruído |
| Observações com data/hora | ficha da ação | reconstruído |
| Marcar/reabrir | `aplicarStatusAcao()` | reconstruído |
| Automação de programado vencido | `aplicarAutomacoesProcesso()` | reconstruído |
| Leitura de volta após gravação | `api/client.ts` | reconstruído |
| Evitar gravação por tecla na ficha individual | `DetalheProcessoReal.tsx` | reconstruído |
| Microimportação de resposta na própria ação | `MicroImportacaoAcao.tsx` | conectado à ficha e ao Painel; teste operacional final permanece separado |

## 5. Painel da semana

| Função histórica | EcoLíder atual | Situação |
|---|---|---|
| Coletar somente ações abertas | `coletarAcoesPainel()` | reconstruído |
| 7 KPIs | `painelKpis.ts` + `PainelSemana.tsx` | reconstruído |
| Filtros por status | Painel | reconstruído |
| Depende CKM / deles | Painel | reconstruído |
| Agrupar por tarefa | `painelAgrupamento.ts` | reconstruído |
| Ação coletiva | Painel | reconstruído |
| Cartões dos processos | `painelProcessos.ts` | reconstruído |
| Respostas pendentes no topo | Painel | reconstruído |
| Visualizar resposta já registrada | Painel | reconstruído |
| Registrar/importar resposta ausente na ação | `MicroImportacaoAcao.tsx` | conexão real auditada; teste operacional ainda pendente |
| E-mails por ação | `EmailActionButtons.tsx` | reconstruído |
| PDFs por ação | helpers PDF | reconstruído; auditoria funcional de `09-pdf.js` concluída; geração visual real continua no checklist |
| Tutorial de primeiro acesso | asset histórico + `tutorialPrimeiroAcesso.ts` | arquivo exato incorporado; ligado à ficha, e-mails, Configurações e às quatro ações históricas no Painel |

## 6. Agenda geral

| Função histórica | EcoLíder atual | Situação |
|---|---|---|
| Linhas das 95 ações | `linhasAgendaReal()` | reconstruído |
| 5 passos de mentora × 4 alinhamentos | `linhasAgendaReal()` | reconstruído e auditado |
| Filtro situação | `AgendaGeral.tsx` | reconstruído |
| Filtro responsável | Agenda | reconstruído |
| Filtro pessoa | Agenda | reconstruído |
| Acesso à ação exata | `?item=` + detalhe | reconstruído |
| E-mail por linha | Agenda | reconstruído |
| CSV histórico de 12 colunas | `gerarAgendaCsvHistorica()` | reconstruído |

## 7. Alinhamentos 1 a 4

| Função histórica | EcoLíder atual | Situação |
|---|---|---|
| Marcos 15/45/75/150 | plano + cronograma | reconstruído |
| Situação de agendamento | `alinhamentoStateHelpers.ts` | reconstruído |
| Data/hora/link | alinhamento | reconstruído |
| Justificativa | alinhamento | reconstruído |
| Realizado em | alinhamento | reconstruído |
| Relatório da mentora | alinhamento | reconstruído |
| Ata texto/link/arquivada | alinhamento | reconstruído |
| Notas | alinhamento | reconstruído |
| Automação `agN-02` | `itemStateHelpers.ts` | reconstruído |
| Automação `d{marco}-01` | `itemStateHelpers.ts` | reconstruído |

## 8. Mentora

| Função histórica | EcoLíder atual | Situação |
|---|---|---|
| Cadastro de mentoras | `ConfiguracaoMentoras.tsx` | reconstruído |
| Vínculo por `mentorId` | `mentoraStateHelpers.ts` | reconstruído |
| Compatibilidade com `consultora` legado | `mentoraVinculada()` | reconstruído |
| Checklist de prontidão | `checarPreparacaoMentora()` | reconstruído |
| WhatsApp de disponibilidade | mentora helpers + painel | reconstruído |
| Horários recebidos | mentora helpers + painel | reconstruído |
| Usar horários no e-mail do gestor | `usarHorariosMentoraNoGestor()` | reconstruído |
| Briefing PDF | helper específico | reconstruído |
| Relatório Word | helper específico | reconstruído |
| WhatsApp de confirmação | mentora helpers | reconstruído |
| Concluir/reabrir preparação | `alternarPreparacaoMentora()` | reconstruído |

## 9. E-mails

| Função histórica | EcoLíder atual | Situação |
|---|---|---|
| Modelos padrão | `emailModelosPadrao.ts` | 32 modelos consolidados e reaudtados contra o HTML v4, incluindo `m_confirma_acesso` |
| Personalização | `ConfiguracaoEmails.tsx` | reconstruído |
| Restaurar padrão | Configuração de e-mails | reconstruído |
| Tokens | `emailValoresHelpers.ts` | reconstruído |
| Links | `emailLinksHelpers.ts` | reconstruído |
| Prévia | `EmailPreviewDialog.tsx` | reconstruído |
| Mailto/cópia | helpers e diálogo | reconstruído |
| Marcar enviado | status da ação | reconstruído |
| Cobrança dinâmica | `cobrancaFormulariosHelpers.ts` | reconstruído |
| Anexos/tutoriais | ações previstas | textos históricos preservados; tutorial real conectado aos pontos previstos |

## 10. Respostas de formulários

| Função histórica | EcoLíder atual | Situação |
|---|---|---|
| Colar texto/exportação | `RegistrarRespostas.tsx` | reconstruído |
| CSV/TSV/TXT | Registrar respostas | reconstruído |
| Detectar separador | parser | reconstruído |
| Detectar formulário | parser | reconstruído |
| Reconstruir linhas quebradas | parser | reconstruído |
| Similaridade de nomes | parser | reconstruído |
| Conferência antes de gravar | Registrar respostas | reconstruído |
| Duplicidade | interface + backend | reconstruído |
| Registro transacional | API de importação | reconstruído |
| Marcar ação correspondente | backend de importação | reconstruído |
| Respostas recebidas | tela consolidada | reconstruído |
| Editar resposta | tela/API dedicada | reconstruído |
| Arquivar preservando histórico | tela/API dedicada | reconstruído |

## 11. Formulários públicos

| Função histórica | EcoLíder atual | Situação |
|---|---|---|
| Controle | `/formularios/controle-integracao` | reconstruído |
| Bem Acolhido | `/formularios/bem-acolhido` | reconstruído |
| Pesquisa de Integração | `/formularios/pesquisa-integracao` | reconstruído |
| Avaliação do Programa | `/formularios/avaliacao-programa` | reconstruído |
| Acompanhamento do PDI | `/formularios/acompanhamento-pdi` + `formKeyForItem()` para `pos2-02`/`pos4-02` | reconstruído; vínculo histórico `FORM_DO_ITEM` restaurado |
| Ativo/inativo | configuração | reconstruído |
| Textos personalizados | configuração | reconstruído |
| Obrigatoriedade/opções | configuração | reconstruído; códigos/obrigatoriedade reaudtados contra o HTML v4 |
| Textos oficiais de abertura/encerramento | catálogos cliente/servidor | reconciliados com HTML v4 em 19/09/2026; Bem Acolhido, Pesquisa e Avaliação tiveram textos completos restaurados |
| Protocolo | backend público | reconstruído |
| Política de duplicidade | backend público | reconstruído |
| Resposta ambígua fica pendente | backend público | reconstruído |

## 12. Administração dos formulários

As seis abas históricas estão mapeadas em `FormulariosIntegracaoAdmin.tsx`:

1. Formulários disponíveis;
2. Links de resposta;
3. Pendentes de vinculação;
4. Respostas recebidas;
5. Editar perguntas e textos;
6. Configuração dos formulários.

As operações de vincular, descartar, criar conscientemente nos formulários permitidos, configurar duplicidade e editar textos possuem endpoints/ações específicas e auditáveis.

## 13. Indicadores

| Função histórica | EcoLíder atual | Situação |
|---|---|---|
| KPIs gerais | Indicadores | reconstruído |
| Pessoas por fase | Indicadores | reconstruído |
| Formulários vencidos por responsável | Indicadores | reconstruído |
| Média do gestor por ciclo | Indicadores | reconstruído |
| Jornada Compliance | Indicadores | reconstruído |
| PDI | Indicadores | reconstruído |
| Tabela pessoa a pessoa | Indicadores | reconstruído |
| Navegação Painel/Respostas/Pessoa | Indicadores | reconstruído |
| Build/visual final | fechamento | pendente |

## 14. PDFs e Word

| Documento histórico | EcoLíder atual | Situação |
|---|---|---|
| Agenda de Onboarding PDF | `agendaPdf.ts` | reconstruído |
| Relatório de Andamento PDF | `relatorioAndamentoPdf.ts` | reconstruído |
| Checkpoint PDF | `checkpointPdf.ts` | reconstruído |
| Relatório de Evolução PDF | `relatorioEvolucaoPdf.ts` | reconstruído |
| Briefing da Mentora PDF | helper específico | reconstruído |
| Relatório da Mentora Word | helper específico | reconstruído |
| Ata Word | helper específico | reconstruído |
| Relatório UGP Word | helper específico | reconstruído |
| Tutorial primeiro acesso PDF | asset histórico exato | incorporado; integridade/hash histórico preservados |
| Conferência integral de `09-pdf.js` | `AUDITORIA_PDFS_09_PDF_COMPLETA.md` | concluída funcionalmente; geração visual real permanece separada |

## 15. Configurações

As sete áreas históricas possuem destino conhecido:

1. Modelos de e-mail → `ConfiguracaoEmails.tsx`;
2. Mentoras / Consultoras CKM → `ConfiguracaoMentoras.tsx`;
3. Cursos obrigatórios → `ConfiguracaoCursos.tsx`;
4. Aviso e assinatura → `ConfiguracaoAviso.tsx`;
5. Links e formulários → `ConfiguracaoLinks.tsx`;
6. Datas e feriados → `ConfiguracaoDatas.tsx`;
7. Dados e backup → `ConfiguracaoDadosBackup.tsx`.

A restauração real permanece protegida/pendente porque substituição de estado é operação de maior risco.

## 16. Backup, offline e recuperação

| Função histórica | EcoLíder atual | Situação |
|---|---|---|
| Ponto de restauração | `backupLocalHelpers.ts` | reconstruído |
| Máximo de 12 | backup local | reconstruído |
| Ponto automático diário | backup local | reconstruído |
| Exportação JSON | backup local | reconstruído |
| Validar arquivo antes de restaurar | backup local | reconstruído |
| Restaurar efetivamente | protegido | pendente |
| Proteção de falha de conexão | `connectionGuard` + readback | validada por inspeção; mutações falham fechadas sem confirmação |
| Processo de demonstração | rota/admin segura | criação validada e usada nos testes administrativos |

## 17. Gerenciar pessoas

| Função histórica | EcoLíder atual | Situação |
|---|---|---|
| Buscar/filtrar | `GerenciarPessoas.tsx` | reconstruído |
| Nova pessoa | `GerenciarPessoas.tsx` + `peopleClient.ts` | implementação segura concluída com criação e readback |
| Editar | rota de detalhe + salvamento explícito | implementação concluída e persistência já validada |
| Timeline | rota de detalhe | reconstruído |
| Reordenar | persistência específica | implementado com readback; teste operacional final ainda pendente |
| Encerrar | operação segura | validado com demonstração |
| Reabrir | operação segura | validado com demonstração |
| Remover com confirmação | arquivamento recuperável | implementado; teste operacional final ainda pendente |

## 18. Estado histórico e persistência

O detalhamento de onde cada estrutura histórica é persistida está em `MAPA_PERSISTENCIA_TRILHA_ECOLIDER.md`.

Princípios já adotados:

- processo é gravado por processo, com objeto completo;
- configuração é gravada por seção autorizada;
- fila de pendências não é tratada como JSON genérico de configuração;
- respostas usam tabela/API própria;
- gravações críticas são relidas antes de confirmação;
- nenhuma restauração destrutiva foi habilitada sem proteção específica.

## 19. Fechamento

Este mapa cobre as funções públicas do HTML histórico e aponta um destino explícito no EcoLíder para cada grupo funcional. Os itens ainda `pendente` continuam no checklist vivo e não são considerados implementados por causa deste documento.

O checklist operacional permanece em `CHECKLIST_EXECUCAO_RECONSTRUCAO.md` e é a referência para o percentual de conclusão.
