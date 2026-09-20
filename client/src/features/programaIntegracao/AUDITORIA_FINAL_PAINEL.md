# Auditoria final linha a linha - Painel da semana

Fonte funcional obrigatória: `trilha-integracao-codigo-completo_4.html`, especialmente `coletar()`, `viewPainel()`, `grupoHtml()`, `pessoaLinha()`, `kpiBtn()` e `pcard()`.

Implementação atual auditada: `components/PainelSemana.tsx` e helpers do Painel.

## 1. Coleta e janela temporal

Histórico:

- somente processos ativos entram na coleta de ações;
- ações concluídas ou fora de escopo não entram na lista principal;
- atrasados aparecem sempre;
- sem filtro, entram atrasados + semana atual + próxima semana.

Atual:

- `coletarAcoesPainel` trabalha com os processos ativos;
- filtros e agrupamento seguem o mesmo recorte temporal e de situação.

Resultado: equivalente.

## 2. Hero de respostas pendentes

Histórico:

- destaque no topo quando existem respostas aguardando revisão/vinculação;
- mostra até três referências e quantidade adicional;
- botão leva à revisão.

Atual:

- card de alerta no topo;
- mostra até três referências e quantidade adicional;
- `Revisar agora` abre a área administrativa correspondente.

Resultado: equivalente em função, adaptado visualmente ao EcoLíder.

## 3. Sete KPIs

Conferidos:

1. Atrasado
2. Atrasado - CKM
3. Atrasado - deles
4. Hoje
5. Tomar ação
6. Aguardando retorno
7. No prazo

Os KPIs atuais usam o catálogo `KPIS_PAINEL_ORIGINAL` e os mesmos filtros históricos.

Resultado: equivalente.

## 4. Filtros CKM / deles

Histórico:

- filtro `Depende da CKM`;
- filtro `Depende deles`;
- KPIs também funcionam como filtros;
- opção de voltar/ver tudo.

Atual:

- mesmos filtros funcionais;
- KPIs clicáveis;
- botão para limpar filtro.

Resultado: equivalente.

## 5. Agrupamento por tarefa

Histórico:

- a mesma ação de várias pessoas é agrupada pelo ID da tarefa;
- pior situação do grupo determina prioridade visual;
- grupo ordenado por pior estado e data mais antiga;
- apresenta quantidade de pessoas e total de tarefas.

Atual:

- `agruparAcoesPorTarefa` mantém o mesmo modelo;
- título, etapa, responsável, quantidade de pessoas, pior status e data mais antiga estão presentes.

Resultado: equivalente.

## 6. Operações em grupo

Histórico:

- marcar várias pessoas como feitas;
- aplicar mesma situação a todas as pessoas da tarefa.

Atual:

- `Marcar as N como feitas`;
- seletor de situação em massa.

Resultado: equivalente.

## 7. Linha da pessoa dentro da tarefa

Histórico:

- marcar/desmarcar/reabrir;
- abrir processo;
- mostrar situação;
- botões de e-mail;
- relatório de evolução quando aplicável;
- resposta quando existente;
- Agenda PDF quando aplicável;
- ficha da ação;
- última observação resumida.

Atual:

- todos esses controles estão presentes;
- resposta pode ser expandida no próprio Painel;
- microimportação é oferecida quando um formulário esperado ainda não possui resposta;
- ficha mantém situação, datas, justificativa e observações.

Resultado: equivalente ou ampliado. As diferenças históricas identificadas abaixo já foram corrigidas no código atual.

## 8. Ficha da ação

Histórico e atual contemplam:

- situação;
- data de conclusão/envio;
- programação de e-mail;
- justificativa para não se aplica / não será feita;
- observações registradas com data/hora;
- remoção de observação;
- controles associados ao formulário quando necessário.

Resultado: equivalente.

## 9. Cards dos processos

Histórico:

- nome/cargo/unidade;
- sinal geral;
- progresso concluído e fora de escopo;
- início;
- dia atual;
- concluídas/total;
- pendências CKM/deles;
- próxima etapa;
- abrir processo;
- Agenda;
- Relatório de Andamento;
- Checkpoint.

Atual:

- todos os elementos acima estão presentes.

Resultado: equivalente.

## 10. Processos encerrados

Histórico mostra encerrados na área inferior quando aplicável.

Atual também mostra os cards encerrados sem filtro ativo.

Resultado: equivalente.

## 11. Lacunas encontradas pela auditoria

### 11.1 Tutorial nas ações `tut:1`

O HTML histórico inclui o botão do tutorial nas ações marcadas com `tut:1`.

O Painel atual renderiza o download do PDF histórico nas ações marcadas com `tut:1`.

Ações afetadas:

- `d3-01`
- `d3-04`
- `d3-02`
- `pos3-12`

Correção concluída na branch de fechamento: o mesmo asset histórico usado na ficha/e-mails/configurações também está disponível no Painel.

### 11.2 Atalho clicável de `link`

Em `grupoHtml()` e `trowItem()`, o HTML histórico usa `linkChip(it.link)` para exibir um atalho clicável nas ações que possuem `link`.

O Painel React atual resolve `item.link` por `linkIntegracaoPorChave()` e exibe o botão `Abrir link` na linha da pessoa quando há destino configurado.

Assim, o atalho funcional equivalente ao `linkChip` histórico já está preservado no Painel atual.

## Resultado da auditoria

A auditoria final linha a linha do Painel foi concluída.

Confirmado como preservado:

- coleta;
- janela temporal;
- respostas pendentes;
- 7 KPIs;
- filtros;
- agrupamento;
- operações em massa;
- linha da pessoa;
- ficha da ação;
- cards dos processos;
- processos encerrados;
- PDFs e e-mails já ligados ao Painel.

Diferenças encontradas originalmente e posteriormente corrigidas:

1. tutorial nas quatro ações `tut:1` — corrigido;
2. atalho funcional equivalente ao `linkChip` — já presente por `Abrir link`.

A comparação funcional do Painel não mantém lacuna estática conhecida nesses dois pontos. A validação visual e os testes finais continuam separados no checklist.
