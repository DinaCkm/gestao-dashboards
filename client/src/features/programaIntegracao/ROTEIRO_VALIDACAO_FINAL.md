# Roteiro de validação final — Programa de Integração

Este roteiro organiza os testes que dependem de um ambiente executável e de persistência real. Ele **não autoriza produção** e não permite marcar itens do checklist apenas porque o passo está descrito aqui.

A regra é: executar um bloco pequeno, confirmar a leitura de volta, registrar o resultado e só então avançar.

## 1. Pré-condições

Antes de qualquer teste com gravação:

- usar ambiente autorizado para teste;
- confirmar qual commit está sendo testado;
- criar checkpoint Git do commit;
- baixar backup JSON do Programa de Integração;
- criar ponto de restauração local;
- confirmar que não há outra pessoa alterando os mesmos dados de teste;
- utilizar pessoa/processo fictício ou explicitamente autorizado.

Se o ambiente disponível for produção, parar e pedir autorização específica da Dina antes de qualquer gravação.

## 2. Build TypeScript

Objetivo: provar que cliente e servidor compilam sem erro introduzido pela reconstrução.

Registrar:

- comando oficial usado pelo próprio projeto;
- resultado completo;
- commit testado;
- erros, se houver, separados entre preexistentes e introduzidos pela reconstrução.

Critério de aprovação do item: build oficial concluir com sucesso, ou haver evidência inequívoca de que eventual erro é preexistente e não afeta o módulo — nesse segundo caso, não marcar automaticamente; revisar com a Dina.

## 3. Gerenciar Pessoas — Nova pessoa/processo

1. abrir Gerenciar Pessoas;
2. criar uma pessoa fictícia de teste com nome e CPF próprios para teste;
3. confirmar mensagem de sucesso;
4. abrir a ficha;
5. voltar para a lista;
6. recarregar a página inteira;
7. confirmar que a pessoa continua presente;
8. confirmar que não foi criado processo duplicado.

Critério de aprovação: persistência confirmada depois da recarga.

## 4. Gerenciar Pessoas — Editar

1. na pessoa fictícia, alterar um campo não crítico, por exemplo cargo ou unidade;
2. aguardar confirmação de gravação;
3. recarregar a página inteira;
4. abrir novamente a ficha;
5. confirmar valor editado;
6. confirmar que outros campos não mudaram.

Critério de aprovação: somente o dado solicitado muda e sobrevive à recarga.

## 5. Gerenciar Pessoas — Reordenar

1. anotar a ordem inicial de três pessoas de teste/permitidas;
2. mover uma posição por vez;
3. recarregar a página;
4. confirmar a ordem nova;
5. verificar que nenhuma pessoa desapareceu ou duplicou.

Critério de aprovação: ordem preservada pelo bootstrap após recarga.

## 6. Gerenciar Pessoas — Encerrar e reabrir

Encerrar:

1. encerrar a pessoa fictícia;
2. confirmar que sai de Ativos e aparece em Encerrados;
3. recarregar;
4. confirmar que continua encerrada;
5. abrir a ficha e confirmar histórico preservado.

Reabrir:

6. reabrir a mesma pessoa;
7. confirmar retorno a Ativos;
8. recarregar;
9. confirmar estado ativo e histórico preservado.

Critério de aprovação: transição persiste e não apaga histórico.

## 7. Gerenciar Pessoas — Remover com proteção

Usar somente processo fictício autorizado.

1. clicar Remover;
2. confirmar o aviso de que será arquivado, não apagado fisicamente;
3. confirmar que desaparece da visão administrativa comum;
4. recarregar;
5. confirmar que continua fora da lista;
6. verificar por meio administrativo/técnico permitido que o registro está com situação `removido`, não fisicamente excluído.

Critério de aprovação: remoção lógica confirmada e histórico preservado.

## 8. Persistência após recarga

Em uma única pessoa fictícia, alterar em etapas separadas:

- dado cadastral;
- status de uma ação;
- data/conclusão de uma ação;
- justificativa;
- observação;
- um alinhamento;
- campo Bem Acolhido/teste, se aplicável.

Depois de cada alteração crítica:

1. confirmar retorno do servidor;
2. recarregar a página inteira;
3. conferir o valor.

Critério de aprovação: todas as alterações persistem sem afetar dados não relacionados.

## 9. Processo de demonstração ponta a ponta

1. acionar Criar demonstração;
2. ler a confirmação e aceitar conscientemente;
3. confirmar criação de `Mariana Alves Teixeira (demonstração)`;
4. confirmar mentora `Adriana Souza (demonstração)`;
5. abrir a ficha;
6. conferir quatro alinhamentos;
7. conferir respostas de formulário;
8. conferir PDI e Jornada Compliance;
9. confirmar que somente as duas pendências finais históricas permanecem abertas;
10. abrir Indicadores e confirmar presença coerente do demo;
11. gerar ao menos um documento do demo;
12. recarregar e repetir a conferência principal;
13. ao fim do teste, arquivar o processo demo se a Dina autorizar a limpeza da visão.

Critério de aprovação: criação atômica, leitura completa e persistência após recarga.

## 10. Cinco formulários públicos

Testar separadamente:

1. Controle do Programa de Integração;
2. Bem Acolhido em Nossa Unidade;
3. Pesquisa de Integração;
4. Avaliação do Programa de Integração;
5. Acompanhamento do PDI.

Para cada formulário:

- abrir a rota pública correta;
- conferir título/textos/opções/obrigatoriedade;
- testar validações de campos;
- enviar resposta de teste;
- anotar protocolo retornado;
- confirmar resposta na administração;
- confirmar vínculo correto ou fila de pendência quando a identificação for ambígua;
- confirmar política de duplicidade conforme configurada;
- recarregar e confirmar persistência.

Critério de aprovação: os cinco fluxos funcionam de entrada pública até leitura administrativa.

## 11. Quatro alinhamentos

Para 1º, 2º, 3º e 4º alinhamentos, testar:

- data prevista;
- data confirmada e recálculo de agendamento/pós;
- hora;
- link de reunião;
- preparação da mentora;
- realizado;
- percepções/ata;
- relatório;
- ações pós-alinhamento relacionadas.

Critério de aprovação: os quatro ciclos funcionam e recalculam datas sem afetar os demais ciclos.

## 12. PDFs e Word

Gerar, abrir e conferir:

- Agenda de Onboarding PDF;
- Relatório de Andamento PDF;
- Checkpoint PDF;
- Relatórios de Evolução previstos;
- Briefing da Mentora PDF;
- Relatório da Mentora Word;
- Ata Word;
- Relatório UGP Word.

Para cada arquivo:

- arquivo abre sem corrupção;
- nome está correto;
- pessoa/ciclo corretos;
- datas corretas;
- não há texto cortado importante;
- tabelas e blocos principais aparecem;
- informações derivadas correspondem ao processo usado no teste.

Critério de aprovação: todos os documentos geram e abrem corretamente.

## 13. Backup e restauração real

Somente em ambiente autorizado e com dado de teste controlado.

1. criar dado identificável de teste;
2. baixar backup JSON;
3. criar ponto local;
4. alterar esse dado depois do backup;
5. selecionar o backup;
6. validar e revisar a prévia;
7. confirmar literalmente `RESTAURAR`;
8. aguardar resposta;
9. recarregar bootstrap;
10. confirmar retorno do dado ao estado anterior;
11. confirmar que demais processos/configurações esperados continuam presentes;
12. registrar resultado.

Critério de aprovação: restauração conclui em transação, leitura de volta é coerente e nenhum dado não previsto desaparece.

## 14. Regressão do restante do EcoLíder

Sem modificar dados desnecessariamente, conferir pelo menos:

- login/logout;
- dashboard administrativo;
- navegação lateral;
- páginas de alunos;
- páginas de mentoria;
- avaliações/assessment;
- cursos/trilhas;
- módulos que compartilham layout/autenticação;
- qualquer tela crítica apontada pela Dina.

Critério de aprovação: reconstrução não altera nem quebra módulos externos ao Programa de Integração.

## 15. Auditoria visual final

Conferir em desktop e largura menor:

- Painel da semana;
- Agenda;
- Indicadores contra `13-indicadores.js`;
- ficha individual;
- alinhamentos;
- mentora;
- e-mails;
- respostas;
- formulários administrativos;
- configurações;
- estados vazios, erros e offline.

Verificar:

- textos não cortados;
- botões visíveis;
- tabelas utilizáveis;
- hierarquia visual clara;
- ausência de campos sobrepostos;
- ausência de placeholders técnicos para o usuário;
- coerência com o padrão EcoLíder sem perda de função histórica.

## 16. Registro de evidência

Para cada bloco aprovado, registrar no checklist ou documento de teste:

- data;
- commit;
- ambiente;
- quem executou;
- resultado;
- evidência suficiente (mensagem, arquivo gerado, screenshot ou resposta do servidor, conforme o teste).

Só marcar `[x]` depois da evidência real.

## 17. Sequência recomendada

Executar nesta ordem:

1. build TypeScript;
2. testes automatizados aplicáveis;
3. criar pessoa e persistência;
4. editar/reordenar/encerrar/reabrir/remover;
5. demo ponta a ponta;
6. cinco formulários;
7. quatro alinhamentos;
8. documentos;
9. backup/restauração;
10. regressão EcoLíder;
11. auditoria visual;
12. backup pré-publicação;
13. autorização explícita da Dina;
14. merge/deploy;
15. teste pós-deploy.

Nenhuma etapa posterior substitui uma etapa anterior que falhou.