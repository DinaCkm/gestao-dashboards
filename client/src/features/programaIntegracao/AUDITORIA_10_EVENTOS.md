# Auditoria de paridade — `10-eventos.js`

## Objetivo

Este documento fecha o **mapeamento funcional** dos eventos do HTML histórico para a arquitetura atual do Programa de Integração no EcoLíder.

A fonte funcional obrigatória é o bloco `10-eventos.js` do HTML histórico `trilha-integracao-codigo-completo_4.html`, incluindo os despachantes `cliqueGeral`, `mudaGeral`, `digitaGeral`, o `keydown` de observações, `cliqueId` e o controle de tema.

> Regra de paridade: a reconstrução **não precisa preservar os nomes `data-*` nem o modelo de delegação de eventos do HTML antigo**. Ela precisa preservar a função, o comportamento e a persistência correspondentes. No React atual, os eventos foram distribuídos em componentes especializados e APIs seguras.

## Resultado do inventário

- **164 atributos `data-*`** usados pelos handlers históricos foram inventariados.
- **21 IDs de botão** tratados por `cliqueId` foram inventariados.
- Os eventos foram agrupados por função para evitar contar dezenas de atributos auxiliares como funções independentes.
- O mapeamento identifica explicitamente tanto as funções migradas quanto as lacunas que continuam abertas em outros itens do checklist.

## Mapa funcional por grupo

| Grupo histórico | Eventos/controles do original | Equivalente atual | Situação do mapa |
|---|---|---|---|
| Ações da jornada | `data-check`, `data-checkall`, `data-its`, `data-itd`, `data-itprog`, `data-itj`, `data-itopen`, `data-itclose`, `data-statusall` | `DetalheProcessoReal`, `PainelSemana`, `itemStateHelpers` | Mapeado; persistência por processo e leitura de volta já previstas |
| Observações | `data-notaadd`, `data-notadel`, `data-notainput` + Enter | `ObservacoesAcao` e observações dos alinhamentos | Mapeado; inclusão, remoção e Enter preservados |
| Navegação/deep-link | `data-nav`, `data-goetapa`, `data-goitem`, `data-close`, `data-dir`, `data-etapa` | Tabs do Programa, rota individual e `?item=` | Mapeado |
| PDFs da jornada | `data-pdf`, `data-rel`, `data-ckpt`, `data-relev`, `data-reln` | `PainelSemana`, `DetalheProcessoReal`, helpers de PDF | Mapeado; auditoria documental de `09-pdf.js` permanece separada |
| E-mails | `data-mail`, `data-mailsent`, `data-copy`, `data-tpl`, `data-tplgo`, `data-tplreset`, `data-usartel` | `EmailActionButtons`, `EmailPreviewDialog`, `ConfiguracaoEmails` | Mapeado; conferência texto a texto e anexos continuam em itens próprios |
| Alinhamentos | `data-ag`, `data-alin`, `data-alinf`, `data-alinn`, `data-relat`, `data-atadrive`, `data-ataboth`, `data-ataf`, `data-ataf2`, `data-atan`, `data-atann` | `AlinhamentoPainelReal`, `AtaRelatorioPainel`, `AtasRelatoriosGeral` | Mapeado |
| Mentora | `data-mentorsel`, `data-mentoranova`, `data-mencheck`, `data-menzap`, `data-zapcopy`, `data-zapfeito`, `data-horabre`, `data-horfecha`, `data-horadd`, `data-hordel`, `data-horuse`, `data-horf`, `data-hori`, `data-horn`, `data-confirmok`, `data-menok`, `data-brief`, `data-briefprev`, `data-usartel`, `data-meni`, `data-menf`, `data-menn`, `data-menativa`, `data-mendel` | `MentoraPreparacaoPainel`, `ConfiguracaoMentoras`, `mentoraStateHelpers` | Mapeado; Briefing PDF e Word estão conectados aos geradores reais na ficha individual |
| Cursos/configuração | `data-cursoi`, `data-cursof`, `data-cursodel`, `data-plataforma` | `ConfiguracaoCursos` | Mapeado |
| Microimportação | `data-microler`, `data-microreg`, `data-microlimpar`, `data-microtxt` | `MicroImportacaoAcao` | Mapeado |
| Importação em lote | `data-impform`, `data-imptxt`, `data-impinc`, `data-impdet`, `data-impalvo`, `data-impciclo`, `data-imppapel`, `data-impacao`, `data-impapl`, `data-irimportar` | `RegistrarRespostas`, parser e API transacional de importação | Mapeado |
| Respostas recebidas | `data-rfil`, `data-rform`, `data-rciclo`, `data-respopen`, `data-respdel`, `data-redit`, `data-redf`, `data-redescala`, `data-redescalaval`, `data-redmeta`, `data-redsave`, `data-redcancel` | `RespostasRecebidas`/editor seguro e backend de arquivamento | Mapeado |
| Atas e relatórios | `data-atasel`, `data-ataitem`, `data-atauma`, `data-ataboth`, `data-ataf`, `data-ataf2`, `data-atan`, `data-atann` | `AtaRelatorioPainel`, `AtasRelatoriosGeral` | Mapeado |
| Formulários — administração | `data-formaba`, `data-formalinks`, `data-formapend`, `data-formativa`, `data-formdup`, `data-formpid`, `data-txtpick`, `data-txtgrupo`, `data-txtintro`, `data-txtlabel`, `data-txtobrig`, `data-txtescolhas`, `data-txtoutro`, `data-txtreset` | `FormulariosIntegracaoAdmin`, `FormTextosEditor`, `PendenciasFormularioAdmin` | Mapeado |
| Pendências de formulário | `data-pendid`, `data-pendver`, `data-pendvincula`, `data-pendcriar`, `data-penddescarta`, `data-pendcorrigir`, `data-pendf` | `PendenciasFormularioAdmin` e APIs dedicadas | Mapeado; criação/vínculo/descarte protegidos |
| Formulários públicos | `data-pubf`, `data-pubescala`, `data-pubescalaval`, `data-pubmulti`, `data-pubmultiword`, `data-pubmeta`, `data-pubnext`, `data-pubprev`, `data-prevsel`, `data-pubsair`, `data-pubback` | `ProgramaIntegracaoFormularioPublico` e API pública | Mapeado |
| Cobrança | `data-cobrar`, `data-cobmail`, `data-cobwait`, `data-cobvolta`, `data-cobfinal` | `CobrancaFormulariosDialog`, `CobrancaFinalPainel` | Mapeado |
| Pessoas | `data-mv`, `data-sit`, `data-del` | `GerenciarPessoas` + `peopleClient` + arquivamento seguro | Mapeado; exclusão física histórica foi substituída por arquivamento recuperável por regra de governança |
| Backup | `data-bkbaixar`, `data-bkdel`, `data-bkrest`, `data-bkfile` | `ConfiguracaoDadosBackup`, `backupLocalHelpers`, restauração transacional | Mapeado; teste real de restauração continua pendente |
| Configuração geral | `data-cfg`, `data-aviso`, `data-lk`, `data-lf`, `data-holdel` | telas de Configurações com persistência por seção | Mapeado |
| Filtros/UI | `data-filtro`, `data-filtro2`, `data-ui` | estados React de filtros e `ThemeContext` | Mapeado |
| Tutorial | `data-*` indireto via `it.tut` e `btn-tutorial` | PDF histórico exato + `tutorialPrimeiroAcesso.ts`; acesso ligado à ficha, e-mails, Configurações e Painel | **Mapeado e implementado** |
| Demonstração | `btn-demo` / `criarDemo()` | criação transacional de processo fictício completo em `GerenciarPessoas`/API administrativa | **Mapeado e implementado; já usado em validações** |
| Proteção offline | guarda histórica antes de `data-del` e estado de sincronização | `connectionGuard`, bloqueio de mutações, banner de conexão e tentativa de reconexão | **Mapeado e implementado; validação segura já registrada** |
| Limpeza total | `btn-limpar` | original limpava `feito` e `alin` de todos os processos após confirmação | **Mapeado como lacuna; não será recriado sem desenho seguro e autorização adequada** |
| CSV da Agenda | `btn-csv` / `csv()` | exportação CSV já existente na Agenda Geral | Mapeado |
| Recarregar | `btn-recarregar` | recarga do navegador / recuperação de carregamento | Mapeado; tela de recuperação segura ainda é item separado |

## IDs tratados por `cliqueId`

Todos os 21 IDs históricos foram classificados:

| ID original | Função | Destino / situação atual |
|---|---|---|
| `btn-bk-add` | salvar ponto de restauração | `ConfiguracaoDadosBackup` |
| `btn-demo` | criar processo fictício completo | `GerenciarPessoas` + rota administrativa transacional de demonstração |
| `btn-men-add` | nova mentora | `ConfiguracaoMentoras` |
| `btn-curso-add` | adicionar curso | `ConfiguracaoCursos` |
| `btn-curso-reset` | restaurar cursos padrão | `ConfiguracaoCursos` |
| `btn-imp-ler` | analisar respostas | `RegistrarRespostas` |
| `btn-imp-gravar` | gravar respostas | `RegistrarRespostas` + API transacional |
| `btn-imp-limpar` | limpar prévia da importação | `RegistrarRespostas` |
| `btn-csv` | exportar `agenda-integracao.csv` | Agenda Geral |
| `btn-add` | nova pessoa | `GerenciarPessoas` + criação segura |
| `btn-backup` | baixar backup | `ConfiguracaoDadosBackup` |
| `btn-backup2` | baixar backup | `ConfiguracaoDadosBackup` |
| `btn-backup3` | baixar backup | `ConfiguracaoDadosBackup` |
| `btn-recarregar` | recarregar | navegador/recuperação |
| `btn-tutorial` | baixar tutorial de primeiro acesso | PDF histórico exato ligado aos pontos previstos, incluindo o Painel |
| `btn-bkimport` | escolher backup para restaurar | `ConfiguracaoDadosBackup` |
| `btn-avisoreset` | restaurar aviso padrão | `ConfiguracaoAviso` |
| `btn-holadd` | adicionar feriado | `ConfiguracaoDatas` |
| `btn-holreset` | restaurar feriados padrão | `ConfiguracaoDatas` |
| `btn-pub-enviar` | enviar formulário público | `ProgramaIntegracaoFormularioPublico` |
| `btn-limpar` | apagar marcações/atas/datas de todos os processos | lacuna conhecida; exige solução segura específica |

## Inventário dos 164 atributos `data-*`

A lista abaixo é mantida para auditoria de cobertura e para impedir que um seletor histórico seja esquecido:

`data-ag`, `data-agv`, `data-alin`, `data-alinf`, `data-alinn`, `data-ataboth`, `data-atadrive`, `data-ataf`, `data-ataf2`, `data-ataitem`, `data-atan`, `data-atann`, `data-atasel`, `data-atauma`, `data-aviso`, `data-bemf`, `data-bkbaixar`, `data-bkdel`, `data-bkfile`, `data-bkrest`, `data-bloco`, `data-brief`, `data-briefprev`, `data-cfg`, `data-check`, `data-checkall`, `data-checklist`, `data-ckpt`, `data-close`, `data-cobfinal`, `data-cobmail`, `data-cobrar`, `data-cobvolta`, `data-cobwait`, `data-confirmok`, `data-copy`, `data-cursodel`, `data-cursof`, `data-cursoi`, `data-del`, `data-dir`, `data-etapa`, `data-filtro`, `data-filtro2`, `data-fld`, `data-formaba`, `data-formalinks`, `data-formapend`, `data-formativa`, `data-formdup`, `data-formpid`, `data-goetapa`, `data-goitem`, `data-holdel`, `data-horabre`, `data-horadd`, `data-hordel`, `data-horf`, `data-horfecha`, `data-hori`, `data-horn`, `data-horuse`, `data-id`, `data-ids`, `data-impacao`, `data-impalvo`, `data-impapl`, `data-impciclo`, `data-impdet`, `data-impform`, `data-impinc`, `data-imppapel`, `data-imptxt`, `data-irimportar`, `data-itclose`, `data-itd`, `data-itj`, `data-itopen`, `data-itprog`, `data-its`, `data-lf`, `data-linkcopiar`, `data-lk`, `data-mail`, `data-mailsent`, `data-menativa`, `data-mencheck`, `data-mendel`, `data-menf`, `data-meni`, `data-menn`, `data-menok`, `data-mentoranova`, `data-mentorsel`, `data-menzap`, `data-microler`, `data-microlimpar`, `data-microreg`, `data-microtxt`, `data-mv`, `data-nav`, `data-notaadd`, `data-notadel`, `data-notainput`, `data-nref`, `data-ntipo`, `data-pdf`, `data-pendcorrigir`, `data-pendcriar`, `data-penddescarta`, `data-pendf`, `data-pendid`, `data-pendver`, `data-pendvincula`, `data-pid`, `data-plataforma`, `data-prevsel`, `data-pubback`, `data-pubescala`, `data-pubescalaval`, `data-pubf`, `data-pubmeta`, `data-pubmulti`, `data-pubmultiword`, `data-pubnext`, `data-pubprev`, `data-pubsair`, `data-rciclo`, `data-redcancel`, `data-redescala`, `data-redescalaval`, `data-redf`, `data-redit`, `data-redmeta`, `data-redsave`, `data-rel`, `data-relat`, `data-relev`, `data-reln`, `data-relv`, `data-respdel`, `data-respopen`, `data-rfil`, `data-rform`, `data-sit`, `data-statusall`, `data-testef`, `data-tf`, `data-tok`, `data-tpl`, `data-tplgo`, `data-tplreset`, `data-txtescolhas`, `data-txtgrupo`, `data-txtintro`, `data-txtlabel`, `data-txtobrig`, `data-txtoutro`, `data-txtpick`, `data-txtreset`, `data-ui`, `data-usartel`, `data-zapcopy`, `data-zapfeito`.

Atributos auxiliares como `data-id`, `data-ids`, `data-pid`, `data-fld`, `data-nref`, `data-ntipo`, `data-tf`, `data-tok`, `data-relv` e `data-bloco` transportavam contexto para os handlers; no React atual esse contexto é passado por props, estado tipado e parâmetros de função, portanto não requer recriação do atributo HTML.

## Eventos de entrada e mudança

### `mudaGeral`

Foi decomposto em `onChange`/`onBlur` controlados pelos componentes atuais. O escopo histórico cobria backup, status em lote, filtros, seleção de pessoa em ata, editor de resposta, mentora, BEM/teste, importação, ficha da ação, alinhamentos, dados do processo, duplicidade de formulário, formulário público, pendências e obrigatoriedade/textos de formulário. Todos estão classificados nos grupos acima.

### `digitaGeral`

Foi substituído por estados React locais e gravação controlada. Campos que no HTML antigo reagiam a cada tecla hoje evitam gravação desnecessária no servidor quando isso representa risco; campos de processo, por exemplo, são confirmados em eventos apropriados antes da persistência. Essa é uma adaptação de arquitetura e segurança, não perda funcional.

### `keydown`

O comportamento histórico de registrar observação com **Enter** existe tanto nas observações de ação quanto nas observações do alinhamento.

## Divergências intencionais de segurança

1. **Remover pessoa:** o HTML standalone removia de modo destrutivo; o EcoLíder arquiva (`situacao='removido'`) e preserva histórico.
2. **Restauração de backup:** o HTML substituía o estado após confirmação simples; o EcoLíder usa validação, dupla confirmação, ponto anterior, transação, rollback, arquivamento e leitura posterior.
3. **Persistência de configuração:** eventos antigos chamavam `salvarConfig()` globalmente; o EcoLíder usa endpoints por seção para evitar sobrescrever chaves não relacionadas.
4. **Falha de conexão:** o original bloqueava remoção quando não sincronizado. O equivalente atual usa guarda de conexão, falha fechada, readback, banner e tentativa de reconexão.
5. **Limpeza total:** o botão histórico que apagava todas as marcações não foi reproduzido automaticamente porque é uma operação de alto impacto. O mapeamento registra a existência da função para que ela só seja redesenhada com proteção adequada.

## Conclusão

O requisito **“Mapear todos os handlers de `10-eventos.js`”** está atendido: os despachantes, 164 atributos `data-*`, 21 IDs e suas famílias funcionais foram inventariados e associados à arquitetura atual ou a uma lacuna explícita.

Este fechamento registra que tutorial, demonstração, proteção de conexão e recuperação segura já possuem implementação atual. Continuam separados como validação operacional os testes finais, build, auditorias visuais e a limpeza global histórica, que permanece deliberadamente não recriada por segurança.
