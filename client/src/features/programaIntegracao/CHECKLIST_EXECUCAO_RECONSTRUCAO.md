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
- [ ] Fechar o mapa completo Original -> EcoLíder por função pública.

## 1. Estado, persistência e calendário
- [x] Leitura do bootstrap administrativo atual.
- [x] Persistência individual de processo sem gravar configuração global.
- [x] Ordem dos processos preservada pelo bootstrap.
- [x] Persistência de configuração por seção com lista autorizada, preservando as demais chaves.
- [x] Bloquear `ordem` e `respostasPendentes` na nova gravação genérica por seção.
- [x] Validar formato básico de e-mails, mentoras, cursos, plataforma, aviso, links, feriados, configuração e textos dos formulários antes de persistir.
- [x] Registrar auditoria da alteração de configuração sem gravar o conteúdo da configuração no log.
- [x] Reler a seção persistida no servidor antes de confirmar sucesso da nova operação de configuração.
- [ ] Evitar gravação por tecla nos campos editáveis da ficha.
- [ ] Garantir leitura de volta após cada gravação crítica do módulo, não apenas configuração.
- [ ] Auditar `03-const.js` item a item contra o plano atual.
- [ ] Auditar `05-estado.js` integralmente.
- [ ] Validar datas e recalculo dos quatro alinhamentos.

## 2. Painel da semana
- [x] 19 etapas / 95 ações na base reconstruída.
- [x] 7 indicadores do Painel.
- [x] Filtros CKM / deles e status.
- [x] Agrupamento por tarefa.
- [x] Cartões dos processos e progresso.
- [x] Ficha da ação e estados.
- [x] PDFs principais ligados ao Painel.
- [ ] Registrar resposta ausente diretamente da ação.
- [ ] Tutorial nas ações aplicáveis.
- [ ] Auditoria final linha a linha do Painel.

## 3. Agenda geral
- [x] Estrutura de Agenda geral reconstruída.
- [x] Filtros principais.
- [x] Atalhos de e-mail e processo.
- [x] Exportação CSV existente.
- [ ] Conferir todas as linhas extras da mentora com o original.
- [ ] Consumir deep-link `?item=` na página individual.
- [ ] Auditoria final linha a linha da Agenda.

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
- [ ] Cabeçalho completo com todos os botões do original.
- [ ] Dados do processo editáveis de forma segura.
- [ ] Bem Acolhido e teste comportamental completos.
- [ ] Respostas agrupadas por ciclo.
- [ ] Cobrar formulários.
- [ ] Mural completo de observações.
- [ ] Auditoria das 95 ações na ficha individual.

## 6. Mentora
- [x] Estrutura inicial da preparação da mentora.
- [ ] Cadastro completo de mentoras.
- [ ] Seleção e vínculo no processo.
- [ ] Checklist de prontidão completo.
- [ ] WhatsApp de disponibilidade.
- [ ] Horários sugeridos e uso no e-mail do gestor.
- [ ] WhatsApp de confirmação.
- [ ] Briefing da Mentora em PDF.
- [ ] Relatório da Mentora em Word.
- [ ] Automação final conferida.

## 7. E-mails
- [x] 31 modelos históricos consolidados.
- [x] Tokens principais reconstruídos.
- [x] Links oficiais dos cinco formulários.
- [x] Prévia de e-mail existente.
- [x] Botões de e-mail nas ações principais.
- [ ] Conferir todos os modelos texto a texto.
- [ ] Editor completo em Configurações.
- [ ] Restaurar padrão.
- [ ] Inserção de tokens clicáveis.
- [ ] Anexos e tutorial em todos os casos previstos.
- [ ] Cobrança dinâmica por responsável.

## 8. Registrar respostas
- [ ] Importação por texto colado.
- [ ] Importação `.csv`.
- [ ] Importação `.tsv`.
- [ ] Importação `.txt`.
- [ ] Detecção automática de separador.
- [ ] Detecção automática de formulário.
- [ ] Reconstrução de células quebradas.
- [ ] Fuzzy match da pessoa.
- [ ] Conferência linha por linha.
- [ ] Política de duplicidade na importação.
- [ ] Registro em lote.
- [ ] Resumo final da importação.
- [ ] Microimportação dentro da ação.

## 9. Respostas recebidas
- [ ] Tela consolidada.
- [ ] Filtros por processo, formulário e ciclo.
- [ ] Detalhe completo.
- [ ] Edição de ciclo, papel, avaliador, data e campos.
- [ ] Recalculo de média e alertas.
- [ ] Remoção/arquivamento seguro e auditável.

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
- [ ] Consumir ativo/inativo e textos personalizados na página pública.
- [ ] Validar texto longo/CPF/telefone também no servidor.
- [ ] Aplicar textos/opções/obrigatoriedade personalizados também na validação do servidor.
- [ ] Implementar política bloquear/substituir/permitir adicional com preservação histórica.

## 11. Administração dos formulários
- [x] Estrutura das 6 abas criada.
- [x] Formulários disponíveis em modo de consulta.
- [x] Links públicos em modo de consulta/cópia.
- [x] Pendentes visíveis com candidatos sugeridos.
- [x] Respostas públicas vinculadas visíveis.
- [ ] Ativar/desativar por endpoint seguro.
- [ ] Editar perguntas e textos.
- [ ] Restaurar padrão.
- [ ] Corrigir pendência e buscar novamente.
- [ ] Vincular pendência a processo existente.
- [ ] Criar processo permitido com confirmação.
- [ ] Descartar pendência com auditoria e confirmação.
- [ ] Configurar política de duplicidade.

## 12. Cobrança de formulários
- [ ] Detectar vencidos sem resposta por responsável.
- [ ] Um e-mail por responsável.
- [ ] Links e datas no e-mail.
- [ ] Marcar como cobrados.
- [ ] Observação automática.
- [ ] Cobrança restrita ao 4º ciclo no fechamento final.

## 13. PDFs e Word
- [x] Agenda PDF base.
- [x] Relatório de Andamento PDF base.
- [x] Checkpoint PDF base.
- [x] Relatório de Evolução PDF base.
- [x] Evolução completa prevista na lógica.
- [ ] Conferir todos os PDFs contra `09-pdf.js`.
- [ ] Briefing da Mentora PDF.
- [ ] Relatório da Mentora Word.
- [ ] Ata Word.
- [ ] Relatório UGP Word.

## 14. Configurações
- [x] Base segura de persistência por seção disponível para as telas de Configurações.
- [ ] Modelos de e-mail.
- [ ] Mentoras / Consultoras CKM.
- [ ] Cursos obrigatórios.
- [ ] Aviso e assinatura.
- [ ] Links e formulários.
- [ ] Datas e feriados.
- [ ] Dados e backup.

## 15. Backup, offline e demonstração
- [ ] Pontos de restauração.
- [ ] Máximo de 12 pontos.
- [ ] Ponto automático diário.
- [ ] Backup JSON completo.
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
- [ ] Tela de seleção pessoa/alinhamento.
- [ ] Percepção do líder.
- [ ] Percepção do colaborador.
- [ ] Conclusão da ata.
- [ ] Percepção da consultora para UGP.
- [ ] Nota de confidencialidade.
- [ ] Gerar ata.
- [ ] Gerar relatório UGP.
- [ ] Gerar os dois e marcar a ação prevista.

## 18. Fechamento 100%
- [ ] Mapear todos os handlers de `10-eventos.js`.
- [ ] Nenhum botão falso.
- [ ] Nenhum menu placeholder.
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
