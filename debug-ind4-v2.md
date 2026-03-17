# Ind. 4 Refactoring: Use Contract Period Instead of Ciclos

## Data Sources for Contract Period:
1. `alunos.contratoInicio / contratoFim` - NULL for Millena
2. `contratos_aluno` table - No records for Millena
3. `assessment_pdi.macroInicio / macroTermino` - **HAS DATA**: 2025-04-20 to 2026-03-31

## Best source: assessment_pdi.macroInicio / macroTermino
This is the macro jornada (macrociclo) period, which represents the full contract execution period.

## Current flow:
- calcularIndicadoresCiclo() filters mentoriasAluno by ciclo date range
- ind4 is calculated per ciclo, then consolidated
- Problem: ciclos with only optional competencias are excluded from consolidation

## New approach:
- ind4 should NOT be calculated per ciclo
- Instead, use ALL mentoring sessions of the student within the macrociclo period
- The macrociclo period comes from assessment_pdi (macroInicio to macroTermino)
- For consolidation, ind4 should be calculated from ALL sessions across the entire contract

## Implementation plan:
1. In calcularIndicadoresAluno: calculate ind4 from ALL mentoriasAluno (not per ciclo)
2. In calcularIndicadoresCiclo: still calculate ind4 per ciclo for individual ciclo view
3. In consolidarCiclos: use the global ind4 value instead of averaging per-ciclo values
4. Pass macrociclo dates to the calculator so it can filter by contract period
