# Auditoria integral do inventário funcional histórico

Fonte funcional obrigatória: `trilha-integracao-codigo-completo_3.html`.

Documentos de apoio já concluídos:

- `MAPA_FUNCIONAL_ORIGINAL_ECOLIDER.md`
- `AUDITORIA_03_CONST_05_ESTADO.md`
- `AUDITORIA_10_EVENTOS.md`
- `AUDITORIA_AGENDA_MENTORA.md`
- `AUDITORIA_95_ACOES_FICHA.md`
- `AUDITORIA_31_EMAILS.md`
- `AUDITORIA_FINAL_PAINEL.md`
- `AUDITORIA_PDFS_09_PDF_PARCIAL.md`

## Escopo efetivamente inventariado

A auditoria consolidada cobre:

- 24 blocos-fonte históricos e ordem de montagem;
- 19 etapas;
- 95 ações;
- 164 atributos `data-*` históricos;
- 21 IDs tratados pelo dispatcher `cliqueId`;
- navegação principal;
- Painel da semana;
- Agenda geral;
- Indicadores;
- página individual;
- quatro alinhamentos;
- Mentora;
- 31 modelos de e-mail;
- formulários e respostas;
- administração dos formulários;
- cobrança;
- PDFs e Word;
- configurações;
- backup/restauração;
- offline/recuperação;
- demonstração;
- gerenciamento de pessoas;
- handlers globais e operações especiais.

## Resultado por grande grupo

### Preservados ou reconstruídos

Possuem equivalente atual conhecido e documentado:

- estado e bootstrap administrativo;
- persistência individual de processo;
- configuração segura por seção;
- calendário e feriados;
- 19 etapas / 95 ações;
- status e ficha das ações;
- Painel, seus 7 KPIs, filtros, agrupamento e cards;
- Agenda e CSV;
- Indicadores em lógica;
- página individual e mural;
- quatro alinhamentos;
- Mentora;
- 31 e-mails e tokens;
- importação e registro de respostas;
- Respostas recebidas;
- cinco formulários públicos;
- seis áreas administrativas dos formulários;
- cobrança de formulários;
- Atas e relatórios Word;
- pontos locais de restauração e exportação JSON;
- configurações de e-mails, mentoras, cursos, aviso, links e datas;
- infraestrutura segura para Gerenciar Pessoas.

## Pendências funcionais reais encontradas e explicitamente controladas

### 1. Tutorial histórico

O PDF original foi recuperado do `TUTORIAL_B64` e validado, mas ainda não foi incorporado fisicamente ao bundle/aplicativo.

Afeta:

- quatro ações `tut:1`;
- prévia dos e-mails históricos que oferecem o tutorial;
- área de arquivos/configuração prevista no original.

### 2. Atalho `linkChip` no Painel

O HTML histórico mostra link clicável junto às ações que possuem `link`. O Painel React atual ainda não renderiza esse atalho, embora a página individual e os helpers conheçam os links.

### 3. Relatório de Andamento

A auditoria contra `09-pdf.js` encontrou blocos históricos ainda não integralmente reproduzidos:

- visão geral histórica completa;
- classificação detalhada dos formulários;
- tabela completa de alinhamentos e agendamento;
- panorama de etapas abertas/concluídas;
- ações `Não serão feitas` com justificativa;
- atas e relatórios dos alinhamentos com detalhes históricos.

### 4. Restauração real de backup

A infraestrutura protegida existe, mas restauração completa ainda precisa de validação em ambiente com banco e leitura de volta real.

### 5. Falha de conexão / offline

O histórico possuía banner e proteção específica de operações sensíveis quando sem sincronização. A arquitetura atual é server-first e precisa de equivalente seguro, não de cópia cega do mecanismo antigo.

### 6. Tela de erro e recuperação

Existe erro básico com opção de recarregar, mas o conjunto histórico de recuperação segura ainda precisa ser fechado junto da estratégia offline/backup.

### 7. Processo de demonstração

O `criarDemo()` histórico foi mapeado, porém ainda não foi reconstruído integralmente na arquitetura atual.

### 8. Gerenciar Pessoas

As operações estão implementadas com APIs seguras, readback e arquivamento recuperável, mas criação, edição, reordenação, encerramento, reabertura e remoção ainda aguardam teste real de persistência antes de serem consideradas concluídas.

### 9. Build, testes e validações finais

Continuam pendentes como itens próprios:

- TypeScript/build;
- persistência após recarga;
- formulários públicos;
- quatro alinhamentos;
- PDFs/Word;
- regressão do restante do EcoLíder;
- auditoria visual;
- fluxo ponta a ponta;
- pós-deploy.

## Operação histórica destrutiva deliberadamente não recriada às cegas

### `btn-limpar` - apagar todas as marcações

No histórico, esta operação apagava globalmente marcações, observações/atas e datas confirmadas conforme a lógica do sistema antigo.

Ela não será simplesmente copiada para a reconstrução porque:

- é global;
- é destrutiva;
- pode causar perda operacional ampla;
- exige backup/reversão forte;
- precisa de confirmação reforçada e autorização específica da Dina antes de qualquer implementação/uso com dados reais.

A ausência desta operação não está escondida: ela permanece registrada como divergência de segurança na auditoria de `10-eventos.js` e deve ser decidida conscientemente antes do fechamento final.

## Adaptações conscientes de segurança

Alguns comportamentos históricos foram preservados em finalidade, mas tornados mais seguros:

- remoção física de processo -> arquivamento recuperável;
- restauração simples -> validação, dupla confirmação, transação, rollback e readback;
- gravação global de configuração -> gravação isolada por seção;
- operações críticas -> leitura de volta antes de sucesso.

Essas diferenças são adaptações de governança, não perda acidental de função.

## Conclusão

A auditoria integral do inventário funcional está concluída: as funções históricas possuem destino conhecido, equivalente reconstruído ou pendência explicitamente registrada.

Esta conclusão **não** significa que todas as pendências estão implementadas ou testadas. Ela significa que, após o inventário consolidado, não há uma área funcional histórica conhecida sendo silenciosamente ignorada.

As pendências listadas acima continuam abertas nos itens específicos de implementação, teste e fechamento.
