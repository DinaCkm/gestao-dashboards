# Checklist vivo — Reconstrução da Trilha de Integração no EcoLíder

Este arquivo é o acompanhamento operacional do Plano Mestre. Um item só recebe `[x]` quando a implementação correspondente foi realmente feita na branch de reconstrução. Validação final, build, teste visual e deploy continuam separados e obrigatórios.

## 0. Fonte e governança
- [x] Congelar os 24 blocos-fonte e a ordem oficial de montagem.
- [x] Registrar o Plano Mestre no repositório.
- [x] Manter produção fora da reconstrução.
- [x] Criar adaptador inicial de compatibilidade do estado histórico com a API atual.
- [x] Mapear o risco do `PUT /config` global e proibir seu uso como atalho.
- [x] Criar operações específicas e seguras para gravações de configuração.
- [x] Criar backup da branch antes de iniciar a persistência segura de configuração.
- [x] Fechar o mapa completo Original -> EcoLíder por função pública.

## 1. Estado, persistência e calendário
- [x] Leitura do bootstrap administrativo atual.
- [x] Persistência individual de processo sem gravar configuração global.
- [x] Ordem dos processos preservada pelo bootstrap.
- [x] Persistência de configuração por seção com lista autorizada, preservando as demais chaves.
- [x] Bloquear `ordem` e `respostasPendentes` na nova gravação genérica por seção.
- [x] Validar formato básico de e-mails, mentoras, cursos, plataforma, aviso, links, feriados, configuração e textos dos formulários antes de persistir.
- [x] Registrar auditoria da alteração de configuração sem gravar o conteúdo da configuração no log.
- [x] Reler a seção persistida no servidor antes de confirmar sucesso da nova operação de configuração.
- [x] Evitar gravação por tecla nos campos editáveis da ficha.
- [x] Garantir leitura de volta após cada gravação crítica do módulo, não apenas configuração.
- [x] Auditar `03-const.js` item a item contra o plano atual.
- [x] Auditar `05-estado.js` integralmente.
- [x] Validar datas e recalculo dos quatro alinhamentos.

## 2. Painel da semana
- [x] 19 etapas / 95 ações na base reconstruída.
- [x] 7 indicadores do Painel.
- [x] Filtros CKM / deles e status.
- [x] Agrupamento por tarefa.
- [x] Cartões dos processos e progresso.
- [x] Ficha da ação e estados.
- [x] PDFs principais ligados ao Painel.
- [x] Registrar resposta ausente diretamente da ação.
- [ ] Tutorial nas ações aplicáveis.
- [ ] Auditoria final linha a linha do Painel.

## 3. Agenda geral
- [x] Estrutura de Agenda geral reconstruída.
- [x] Filtros principais.
- [x] Atalhos de e-mail e processo.
- [x] Exportação CSV existente.
- [x] Conferir todas as linhas extras da mentora com o original.
- [x] Consumir deep-link `?item=` na página individual.
- [x] Auditoria final linha a linha da Agenda.

## 4. Indicadores
- [x] Portar a regra dos 6 KPIs originais.
- [x] Pessoas por fase do processo.
- [x] Formulários vencidos por responsável.
- [x] Avaliação do gestor por alinhamento.
- [x] Jornada Compliance pelo último Acompanhamento do PDI.
- [x] PDI pelo último Acompanhamento do PDI.
- [x] Tabela pessoa a pessoa com dia, progresso, atraso, Jornada, PDI e sinal.
- [x] Ordenação por pendências.
- [x] Botões para Painel da semana e Respostas recebidas.
- [x] Navegação para a ficha da pessoa.
- [x] Estados vazios básicos.
- [x] Corrigir lado CKM/Sebrae conforme `LADO` do original.
- [x] Ligar Indicadores ao conjunto de processos ativos, encerrados e feriados reais.
- [ ] Executar build/TypeScript.
- [ ] Conferência visual final contra `13-indicadores.js`.

## 5. Página individual do processo
- [x] Rota individual conectada.
- [x] Timeline base das etapas.
- [x] Fichas de ação e status base.
- [x] Painel base dos alinhamentos.
- [x] Preparação base da mentora.
- [x] Cabeçalho completo com todos os botões do original.
- [x] Dados do processo editáveis de forma segura.
- [x] Bem Acolhido e teste comportamental completos.
- [x] Respostas agrupadas por ciclo.
- [x] Cobrar formulários.
- [x] Mural completo de observações.
- [ ] Auditoria das 95 ações na ficha individual.

## 6. Mentora
- [x] Estrutura inicial da preparação da mentora.
- [x] Cadastro completo de mentoras.
- [x] Seleção e vínculo no processo.
- [x] Checklist de prontidão completo.
- [x] WhatsApp de disponibilidade.
- [x] Horários sugeridos e uso no e-mail do gestor.
- [x] WhatsApp de confirmação.
- [x] Briefing da Mentora em PDF.
- [x] Relatório da Mentora em Word.
- [x] Automação final conferida.

## 7. E-mails
- [x] 31 modelos históricos consolidados.
- [x] Tokens principais reconstruídos.
- [x] Links oficiais dos cinco formulários.
- [x] Prévia de e-mail existente.
- [x] Botões de e-mail nas ações principais.
- [ ] Conferir todos os modelos texto a texto.
- [x] Editor completo em Configurações.
- [x] Restaurar padrão.
- [x] Inserção de tokens clicáveis.
- [ ] Anexos e tutorial em todos os casos previstos.
- [x] Cobrança dinâmica por responsável.

## 8. Registrar respostas
- [x] Importação por texto colado — motor de leitura portado do `03b-forms.js`.
- [x] Importação `.csv` com leitura local e análise sem gravação automática.
- [x] Importação `.tsv` com leitura local e análise sem gravação automática.
- [x] Importação `.txt` com leitura local e análise sem gravação automática.
- [x] Detecção automática de separador.
- [x] Detecção automática de formulário pelo cabeçalho.
- [x] Reconstrução de células/linhas quebradas do export do Forms.
- [x] Fuzzy match da pessoa com os mesmos limites históricos `SIM_MIN` e `SIM_BOA`.
- [x] Conferência linha por linha na interface antes de qualquer gravação.
- [x] Seleção/correção manual de pessoa, ciclo e papel na conferência.
- [x] Identificação visual de resposta duplicada e escolha prévia `substituir / manter as duas / não registrar`.
- [x] Visualização dos dados completos da linha e dos pontos de atenção antes de registrar.
- [x] Tela ligada à aba real `Registrar respostas` do Programa de Integração.
- [x] Política de duplicidade persistida no backend da importação, preservando substituída no histórico.
- [x] Registro em lote transacional, com rollback integral quando qualquer linha falha.
- [x] Auditoria por resposta importada/substituída sem registrar conteúdo sensível no log.
- [x] Marcação automática da ação correspondente na timeline após a importação vinculada.
- [x] Leitura de volta do bootstrap após a gravação do lote.
- [x] Resumo final da importação após persistência real.
- [x] Microimportação dentro da ação.

## 9. Respostas recebidas
- [x] Tela consolidada.
- [x] Filtros por processo, formulário e ciclo.
- [x] Detalhe completo da resposta em visualização.
- [x] Médias, alertas, fonte, versão, protocolo, avaliador/respondente e data exibidos quando disponíveis.
- [x] Navegação para o processo relacionado.
- [x] Edição de ciclo, papel, avaliador, data e campos, seguindo o editor do `11-respostas.js`.
- [x] Recalculo de média e alertas após edição.
- [x] Remoção/arquivamento seguro e auditável pela própria tela, sem exclusão física.

## 10. Formulários públicos
- [x] Catálogo dos cinco formulários no cliente.
- [x] Wizard público base.
- [x] Cinco rotas públicas fixas.
- [x] Envio para API pública existente.
- [x] Consulta pública de metadados criada no cliente.
- [x] Campos numéricos/data e escala 0-5 na UI base.
- [x] Regra de texto longo >= 10 na UI base.
- [x] Protocolo retornado pelo servidor.
- [x] Sem criação automática de processo em caso ambíguo.
- [x] Consumir ativo/inativo e textos personalizados na página pública.
- [x] Validar texto longo/CPF/telefone também no servidor.
- [x] Aplicar textos/opções/obrigatoriedade personalizados também na validação do servidor.
- [x] Implementar política bloquear/substituir/permitir adicional com preservação histórica.

## 11. Administração dos formulários
- [x] Estrutura das 6 abas criada.
- [x] Formulários disponíveis em modo de consulta.
- [x] Links públicos em modo de consulta/cópia.
- [x] Pendentes visíveis com candidatos sugeridos.
- [x] Respostas públicas vinculadas visíveis.
- [x] Backend dedicado para vincular pendência a processo existente, com transação, auditoria e leitura de volta.
- [x] Backend dedicado para descartar pendência sem exclusão física, com auditoria e leitura de volta.
- [x] Ativar/desativar por endpoint seguro, usando persistência isolada de `formConfig`.
- [x] Editar perguntas, obrigatoriedade, opções e textos pela seção segura `formTextos`, sem alterar códigos técnicos.
- [x] Restaurar textos oficiais removendo somente as personalizações do formulário, com confirmação.
- [x] Corrigir identificação da pendência e recalcular candidatos com o mesmo critério fuzzy do formulário público.
- [x] Vincular pendência a processo existente pela interface administrativa.
- [x] Criar processo permitido com confirmação, somente a partir de Controle/Bem Acolhido, em transação e com auditoria.
- [x] Descartar pendência pela interface administrativa com confirmação.
- [x] Configurar política de duplicidade por formulário com persistência segura e preservação histórica.

## 12. Cobrança de formulários
- [x] Detectar vencidos sem resposta por responsável.
- [x] Um e-mail por responsável.
- [x] Links e datas no e-mail.
- [x] Marcar como cobrados.
- [x] Observação automática.
- [x] Cobrança restrita ao 4º ciclo no fechamento final.

## 13. PDFs e Word
- [x] Agenda PDF base.
- [x] Relatório de Andamento PDF base.
- [x] Checkpoint PDF base.
- [x] Relatório de Evolução PDF base.
- [x] Evolução completa prevista na lógica.
- [ ] Conferir todos os PDFs contra `09-pdf.js`.
- [x] Briefing da Mentora PDF.
- [x] Relatório da Mentora Word.
- [x] Ata Word.
- [x] Relatório UGP Word.

## 14. Configurações
- [x] Base segura de persistência por seção disponível para as telas de Configurações.
- [x] Modelos de e-mail.
- [x] Mentoras / Consultoras CKM.
- [x] Cursos obrigatórios.
- [x] Aviso e assinatura.
- [x] Links e formulários.
- [x] Datas e feriados.
- [ ] Dados e backup.

## 15. Backup, offline e demonstração
- [x] Pontos de restauração.
- [x] Máximo de 12 pontos.
- [x] Ponto automático diário.
- [x] Backup JSON completo.
- [ ] Restaurar backup validado.
- [ ] Proteção equivalente para falha de conexão.
- [ ] Tela de erro com recuperação segura.
- [ ] Processo de demonstração completo.

## 16. Gerenciar pessoas
- [ ] Nova pessoa/processo.
- [ ] Editar pessoa/processo.
- [ ] Reordenar.
- [ ] Encerrar.
- [ ] Reabrir.
- [ ] Remover com proteção e confirmação.
- [ ] Eliminar `console.log` usados como placeholder.

## 17. Atas e relatórios
- [x] Tela de seleção pessoa/alinhamento.
- [x] Percepção do líder.
- [x] Percepção do colaborador.
- [x] Conclusão da ata.
- [x] Percepção da consultora para UGP.
- [x] Nota de confidencialidade.
- [x] Gerar ata.
- [x] Gerar relatório UGP.
- [x] Gerar os dois e marcar a ação prevista.

## 18. Fechamento 100%
- [ ] Mapear todos os handlers de `10-eventos.js`.
- [ ] Nenhum botão falso.
- [x] Nenhum menu placeholder.
- [ ] Build TypeScript concluído.
- [ ] Testes aplicáveis concluídos.
- [ ] Teste de persistência após recarga.
- [ ] Fluxo ponta a ponta com processo de demonstração.
- [ ] Teste dos cinco formulários públicos.
- [ ] Teste dos quatro alinhamentos.
- [ ] Teste de todos os PDFs/Word.
- [ ] Regressão do restante do EcoLíder.
- [ ] Auditoria visual final.
- [ ] Auditoria integral do inventário funcional.
- [ ] Backup pré-publicação e rollback documentado.
- [ ] Autorização explícita da Dina para produção.
- [ ] Merge/deploy.
- [ ] Teste pós-deploy.
