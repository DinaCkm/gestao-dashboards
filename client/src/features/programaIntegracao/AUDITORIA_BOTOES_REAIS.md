# Auditoria — nenhum botão falso no Programa de Integração

Fonte funcional: Programa de Integração reconstruído na branch `reconstrucao-integracao-completa-20260916`.

Objetivo desta auditoria: verificar se os controles exibidos nas rotas ativas do Programa de Integração executam uma ação real, navegam para um destino real, geram um arquivo real, alteram estado real ou ficam corretamente desabilitados quando não há operação disponível.

Esta auditoria **não substitui** build TypeScript, teste visual, teste de persistência ou fluxo ponta a ponta, que permanecem itens separados do checklist.

## Rotas ativas conferidas

- `/programa-integracao` → `ProgramaIntegracao.tsx`
- `/programa-integracao/detalhe/:processoId` → `ProgramaIntegracaoDetalhe.tsx`
- `/formularios/:slug` → formulário público do Programa de Integração

A rota individual usa `DetalheProcessoReal`. O componente antigo `DetalheProcesso.tsx` não é a ficha exibida pela rota atual.

## Painel da semana

Conferido em `PainelSemana.tsx` e componentes associados:

- filtros alteram o conjunto exibido;
- cartões abrem a ficha real do processo;
- alteração de status chama a persistência real do processo;
- conclusão individual e em grupo usa callbacks reais;
- PDFs chamam os geradores reais;
- e-mails usam `EmailActionButtons` e a prévia real;
- links usam `linkIntegracaoPorChave`, sem URL fictícia no botão;
- formulários acionam a microimportação real;
- observações usam gravação real.

Resultado: nenhum botão decorativo localizado.

## Agenda geral

Conferido em `AgendaGeral.tsx`:

- baixar CSV gera e baixa o arquivo;
- pessoa e seta abrem a ação correspondente na ficha;
- botão de e-mail abre a prévia real;
- marcar e-mail como enviado altera o status da ação;
- Relatório de Evolução chama o gerador real.

Resultado: nenhum botão decorativo localizado.

## Indicadores

Conferido em `Indicadores.tsx` e na montagem em `ProgramaIntegracao.tsx`:

- “Painel da semana” muda para a aba real;
- “Respostas recebidas” muda para a aba real;
- nome do colaborador abre a ficha real;
- os callbacks opcionais são fornecidos pela rota ativa.

Resultado: nenhum botão decorativo localizado.

## Gerenciar pessoas

Conferido em `GerenciarPessoas.tsx`:

- Nova Pessoa cria por API segura e confirma pela releitura;
- Criar demonstração usa a rota administrativa transacional e confirma pelo bootstrap;
- Editar e Timeline abrem a ficha real;
- Encerrar e Reabrir alteram situação com confirmação de leitura;
- setas de ordem usam a API real de reordenação;
- Remover executa arquivamento recuperável com confirmação, sem exclusão física.

Resultado: nenhum botão decorativo localizado.

## Ficha individual

Conferido em `ProgramaIntegracaoDetalhe.tsx`, `DetalheProcessoReal.tsx`, `AlinhamentoPainelReal.tsx`, `BemTesteProcesso.tsx`, `ObservacoesAcao.tsx`, `ControlesEspeciaisAcao.tsx`, `CobrancaFormulariosDialog.tsx` e componentes associados:

- Voltar navega para o Programa de Integração;
- campos gravam por `onSalvarProcesso` e releitura do bootstrap;
- status, datas, justificativas e observações alteram o estado real;
- links especiais abrem destinos resolvidos pela configuração oficial;
- Agenda PDF usa o gerador real;
- formulários abrem microimportação real;
- cobranças geram e-mail, abrem o cliente de e-mail e registram a cobrança;
- preparação da mentora grava disponibilidade, confirmação, checklist e observações;
- Briefing PDF e Relatório Word recebem, na rota ativa, os geradores reais;
- os textos de fallback “gerador ainda será conectado” existem apenas como defesa do componente e não são alcançados na montagem atual, porque os callbacks reais são sempre fornecidos.

Resultado: nenhum botão decorativo localizado.

## E-mails

Conferido em `EmailActionButtons.tsx`, `EmailPreviewDialog.tsx` e `ConfiguracaoEmails.tsx`:

- gerar prévia usa modelo real;
- copiar HTML/texto executa Clipboard API com fallback;
- abrir e-mail usa `mailto:` real;
- marcar como enviado altera a ação correspondente;
- Relatório de Evolução chama o gerador real quando previsto;
- editar modelo abre o editor real;
- salvar/restaurar modelos usa persistência de configuração e conferência de retorno.

O download do tutorial **ainda não existe** e permanece como item separado do checklist. Sua ausência não foi mascarada por botão fictício.

## Formulários e respostas

Conferido em `FormulariosIntegracaoAdmin.tsx`, `FormTextosEditor.tsx`, `PendenciasFormularioAdmin.tsx`, `RegistrarRespostas.tsx`, `MicroImportacaoAcao.tsx` e `RespostasRecebidas.tsx`:

- abrir/copiar link usa os links públicos reais;
- ativar/desativar e política de duplicidade persistem configuração real;
- editor de textos salva/restaura configuração real;
- vincular/descartar/criar processo a partir de pendência usa operações reais do servidor;
- analisar arquivo/texto executa parser real;
- registrar respostas usa persistência transacional;
- editar resposta grava e recalcula dados;
- remover resposta usa arquivamento seguro, não exclusão física.

Resultado: nenhum botão decorativo localizado.

## Atas e relatórios

Conferido em `AtasRelatoriosGeral.tsx` e `AtaRelatorioPainel.tsx`:

- pessoa e alinhamento selecionam registros reais;
- salvar percepções persiste no processo;
- gerar Ata produz Word real;
- gerar Relatório UGP produz Word real;
- gerar os dois executa ambos e marca a ação prevista.

Resultado: nenhum botão decorativo localizado.

## Configurações

Conferido em `ConfiguracaoDadosBackup.tsx`, `ConfiguracaoLinks.tsx`, `ConfiguracaoCursos.tsx`, `ConfiguracaoMentoras.tsx`, `ConfiguracaoAvisoDatas.tsx` e editor de e-mails:

- backup JSON baixa arquivo real;
- ponto de restauração é gravado localmente;
- seleção/validação/prévia de backup executa validações reais;
- restauração exige a confirmação literal e chama a rota real, com releitura posterior;
- links são salvos, abertos e copiados;
- cursos são adicionados, removidos, restaurados e persistidos;
- mentoras são adicionadas, ativadas/desativadas, removidas e persistidas;
- WhatsApp abre link real quando existe telefone;
- aviso e feriados são persistidos e conferidos no servidor.

Resultado: nenhum botão decorativo localizado.

## Componentes antigos / não exibidos

Arquivos antigos ainda presentes no diretório não foram usados para declarar a interface atual como funcional. A certificação acima considera as rotas efetivamente montadas pelo `App.tsx` e pelos componentes importados por `ProgramaIntegracao.tsx` e `ProgramaIntegracaoDetalhe.tsx`.

Em especial, `DetalheProcesso.tsx` não é a ficha usada pela rota atual; a rota usa `DetalheProcessoReal`.

## Pendência conhecida que NÃO é botão falso

O tutorial histórico em PDF continua pendente porque o arquivo binário original exato ainda não foi transportado de forma íntegra para o repositório. Não foi criado botão de mentira nem arquivo substituto. As quatro ações históricas com `tut:1` permanecem explicitamente sem esse controle até existir transporte binário seguro.

## Conclusão

Na interface ativa auditada, os botões e controles visíveis possuem operação real ou são exibidos/desabilitados de acordo com a disponibilidade da operação. Não foi localizado botão placeholder ou botão de fachada.

O item “Nenhum botão falso” pode ser encerrado como auditoria funcional de código. Build, teste visual, persistência, E2E e tutorial permanecem separados e ainda precisam de suas próprias validações.