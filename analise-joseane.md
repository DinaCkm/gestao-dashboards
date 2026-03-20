# Análise Joseane - Indicadores

## Dados de Mentoring Sessions (11 sessões)
- Sessão 1: presente, nao_entregue, eng=6
- Sessão 2: presente, entregue, eng=7
- Sessão 3: presente, entregue, eng=8
- Sessão 4: presente, entregue, eng=8
- Sessão 5: presente, entregue, eng=7
- Sessão 6: presente, entregue, eng=9
- Sessão 7: ausente, sem_tarefa, eng=NULL
- Sessão 8: presente, entregue, eng=8
- Sessão 9: presente, entregue, eng=8
- Sessão 10: ausente, nao_entregue, eng=6
- Sessão 11: presente, nao_entregue, eng=8

## Cálculo correto de Ind.4 (Tarefas):
- Sessões com tarefa (excluindo sem_tarefa): 10 sessões (1,2,3,4,5,6,8,9,10,11)
- Tarefas entregues: 7 (sessões 2,3,4,5,6,8,9)
- Ind.4 = 7/10 = 70%

O bug reportado dizia "7/8 = 87,5% mas mostra 50%". 
Na verdade, com os dados atuais: 7/10 = 70%.

Se o sistema mostra 50%, o problema pode ser que o cálculo está filtrando por microciclo 
em vez de macrociclo, e algum microciclo tem menos sessões.

## Verificação: O macrociclo está sendo passado corretamente?
Preciso verificar se getMacrocicloPorAluno retorna dados para a Joseane.
