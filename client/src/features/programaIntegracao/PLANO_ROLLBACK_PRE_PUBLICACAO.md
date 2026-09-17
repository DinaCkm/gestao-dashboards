# Plano de rollback pré-publicação — Programa de Integração

Este documento define **como voltar atrás com segurança** caso a futura publicação da reconstrução do Programa de Integração apresente qualquer comportamento inesperado.

Ele é preparatório. **Não autoriza merge, deploy, alteração de produção, restauração de banco ou exclusão de dados.** O backup final pré-publicação só deve ser criado imediatamente antes de uma publicação explicitamente autorizada pela Dina.

## 1. Regra principal

Ordem obrigatória:

1. preservar;
2. registrar o estado atual;
3. publicar somente com autorização explícita;
4. testar;
5. se algo falhar, interromper novas alterações;
6. voltar para o ponto preservado;
7. conferir novamente aplicação e dados.

Nunca usar `force`, exclusão definitiva ou alteração manual do banco como primeira opção de recuperação.

## 2. O que deve existir antes de qualquer publicação

Antes de merge/deploy, confirmar todos os itens abaixo:

- branch de reconstrução sem mudança inesperada;
- commit exato aprovado para publicação anotado;
- commit exato que está em produção antes da publicação anotado;
- branch/tag/checkpoint Git apontando para o estado anterior à publicação;
- backup JSON do Programa de Integração baixado e validado;
- ponto de restauração local criado;
- se a publicação envolver banco, backup do banco realizado pelo mecanismo operacional oficial do ambiente;
- lista dos testes mínimos pós-publicação pronta;
- autorização explícita da Dina registrada antes do merge/deploy.

Se qualquer um desses itens faltar, a publicação deve parar.

## 3. Identificadores que devem ser anotados

No momento pré-publicação, preencher:

- **Commit aprovado da reconstrução:** `<PREENCHER NO DIA>`
- **Commit anterior em produção:** `<PREENCHER NO DIA>`
- **Checkpoint Git pré-publicação:** `<CRIAR NO DIA>`
- **Backup JSON do módulo:** `<ARQUIVO / DATA / HASH SE DISPONÍVEL>`
- **Backup do banco/ambiente:** `<IDENTIFICADOR OFICIAL>`
- **Data/hora da publicação:** `<PREENCHER>`
- **Responsável pela execução:** `<PREENCHER>`

Não preencher antecipadamente com valores presumidos.

## 4. Critérios para interromper a publicação

Interromper imediatamente o avanço se ocorrer qualquer um dos seguintes sinais:

- aplicação não sobe normalmente;
- login ou navegação administrativa sofre regressão;
- Programa de Integração não carrega o bootstrap;
- processos desaparecem ou mudam de ordem inesperadamente;
- gravação não volta igual na releitura;
- formulários públicos deixam de abrir ou enviar;
- respostas deixam de aparecer vinculadas ao processo correto;
- ações, alinhamentos ou indicadores apresentam dados incompatíveis com o estado salvo;
- PDFs/Word deixam de gerar;
- restauração/backup apresenta erro;
- qualquer outra área do EcoLíder apresenta regressão causada pela publicação.

Nesses casos, não tentar “consertar rápido” diretamente em produção. Primeiro voltar ao ponto conhecido.

## 5. Rollback de código

Caminho preferencial:

1. identificar o commit que estava em produção antes da publicação;
2. criar/confirmar um checkpoint desse commit;
3. reverter a publicação pelo mecanismo normal do ambiente para esse commit;
4. **não usar force-push**;
5. aguardar a aplicação subir normalmente;
6. executar os testes mínimos de recuperação descritos abaixo.

Se a publicação tiver sido feita por PR/merge, preferir **revert do merge** ou redeploy explícito do commit anterior, conforme o mecanismo de deploy existente. Não apagar histórico Git.

## 6. Rollback de dados do Programa de Integração

A reconstrução foi desenhada para reduzir a necessidade de rollback de dados:

- remoção de processo é arquivamento, não exclusão física;
- remoção de resposta é arquivamento, não exclusão física;
- alterações críticas têm leitura de volta;
- restauração de backup é transacional e possui rollback em falha;
- configuração é persistida por seção para evitar sobrescrever chaves não relacionadas.

Se houver necessidade real de restaurar dados:

1. interromper novas gravações no módulo;
2. identificar o backup correto anterior ao problema;
3. validar o arquivo no mecanismo de prévia;
4. conferir quantidade de processos e estrutura antes da restauração;
5. criar novo ponto local imediatamente antes de restaurar;
6. usar somente a rota de restauração segura já implementada;
7. exigir a confirmação literal `RESTAURAR`;
8. aguardar a transação concluir;
9. reler o bootstrap;
10. comparar processos e chaves esperadas;
11. só declarar recuperação concluída depois da conferência.

Uma restauração real de banco/backup exige autorização da Dina no momento da execução.

## 7. O que não fazer durante rollback

- não excluir tabelas;
- não rodar `DELETE` manual em massa;
- não limpar todas as marcações;
- não alterar produção enquanto o diagnóstico ainda estiver incerto;
- não sobrescrever configuração global para “resolver rápido”;
- não forçar branch/commit;
- não reutilizar backup sem validar origem e conteúdo;
- não restaurar arquivo parcialmente lido ou corrompido;
- não continuar publicando novas correções em sequência sem voltar a um estado conhecido.

## 8. Testes mínimos depois de voltar ao estado anterior

Após rollback de código, conferir no mínimo:

1. login administrativo;
2. dashboard principal do EcoLíder;
3. abertura do Programa de Integração;
4. carregamento dos processos existentes;
5. abertura de uma ficha sem alterar dados;
6. navegação das demais áreas críticas do EcoLíder;
7. ausência de erro de servidor/console que impeça o uso normal.

Se também houver rollback de dados, acrescentar:

8. quantidade esperada de processos;
9. ordem dos processos;
10. respostas vinculadas;
11. configurações principais;
12. um registro de alinhamento conhecido;
13. estado de uma ação conhecida;
14. confirmação de que registros arquivados continuam preservados.

## 9. Testes mínimos depois de uma publicação bem-sucedida

Mesmo sem rollback, a publicação só pode ser considerada concluída depois de:

- Programa de Integração carregar normalmente;
- criar/editar/reordenar/encerrar/reabrir/remover de forma protegida em cenário controlado;
- persistência sobreviver a recarga;
- cinco formulários públicos funcionarem;
- quatro alinhamentos funcionarem;
- PDFs/Word principais gerarem;
- processo de demonstração funcionar ponta a ponta;
- restante do EcoLíder passar por regressão básica;
- auditoria visual final ser aprovada.

Esses itens continuam individualmente controlados no checklist vivo.

## 10. Condição para marcar o item do checklist

O item **“Backup pré-publicação e rollback documentado”** só pode ser marcado quando as duas partes estiverem verdadeiramente concluídas:

1. este plano de rollback estiver documentado e atualizado; **e**
2. o backup/checkpoint pré-publicação final tiver sido criado imediatamente antes da publicação autorizada.

Neste momento, somente a parte documental está preparada. O checklist deve permanecer aberto até o momento pré-publicação.
