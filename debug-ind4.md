# Bug Analysis: Ind. 4 Tarefas showing 0%

## Millena's data in DB:
- 10 sessions total
- Session 1: isAssessment=1, taskStatus=nao_entregue, taskMode=sem_tarefa
- Session 2: taskStatus=nao_entregue, taskMode=sem_tarefa
- Session 3-7: taskStatus=entregue, taskMode=sem_tarefa
- Session 8-10: taskStatus=nao_entregue, taskMode=sem_tarefa

## Key finding: ALL sessions have taskMode='sem_tarefa'

## The mapping in routers.ts:
```
atividadeEntregue: session.isAssessment ? 'sem_tarefa' : ((session.taskStatus || 'sem_tarefa') as ...)
```
This maps taskStatus directly. So for Millena:
- Session 1 (assessment): atividadeEntregue = 'sem_tarefa' (correct)
- Session 2: atividadeEntregue = 'nao_entregue'
- Sessions 3-7: atividadeEntregue = 'entregue'
- Sessions 8-10: atividadeEntregue = 'nao_entregue'

## The Ind4 calculation:
```
const atividadesComTarefa = mentoriasAluno.filter(m => m.atividadeEntregue !== 'sem_tarefa');
```
This should get 9 sessions (all except assessment).
5 entregues / 9 total = 55.6%

## BUT WAIT - the issue is with CICLOS!
The calculator filters by ciclo date range. If Millena has no ciclos configured, 
or if the ciclos don't cover her session dates, the mentoriasAluno array would be EMPTY.

## ROOT CAUSE FOUND!

Millena has NO ciclos_execucao records. Ciclos are auto-generated from assessment_competencias.

Her 9 competencias have these periods:
- Comp 30022: 2025-04-20 to 2025-05-25 (peso=obrigatoria) 
- Comp 30013: 2025-05-20 to 2025-06-24 (peso=opcional)
- Comp 30028: 2025-06-29 to 2025-08-03 (peso=opcional)
- Comp 30021: 2025-08-08 to 2025-09-12 (peso=opcional)
- Comp 30016: 2025-09-17 to 2025-10-22 (peso=opcional)
- Comp 30015: 2025-10-27 to 2025-12-01 (peso=opcional)
- Comp 30034: 2026-01-12 to 2026-02-16 (peso=opcional)
- Comp 30035: 2026-01-30 to 2026-03-06 (peso=opcional)
- Comp 30036: 2026-02-24 to 2026-03-31 (peso=opcional)

Each competencia with a UNIQUE microInicio|microTermino pair becomes a separate ciclo.
Only 1 competencia is 'obrigatoria' (30022), the rest are 'opcional'.

In getAllCiclosForCalculator, competenciaIds is set to group.obrigatoriaIds.
So only the first ciclo (2025-04-20 to 2025-05-25) has competenciaIds with data.
The other 8 ciclos have competenciaIds = [] (empty) because they only have optional competencias.

In calcularIndicadoresAluno:
- ciclosFinalizadosComObrig filters ciclos where competenciaIds.length > 0
- Only 1 ciclo qualifies: 2025-04-20 to 2025-05-25
- This ciclo covers only session 1 (assessment, 2025-04-28) - which is filtered as 'sem_tarefa'
- So totalTarefas = 0, ind4 = 0%

The sessions 2-10 fall in ciclos with competenciaIds=[] (only optional), so they are EXCLUDED from consolidation.

FIX: The consolidation should include ciclos with only optional competencias for ind1/ind4/ind5 calculations,
or the filtering should be less strict about requiring obrigatoria competencias.
