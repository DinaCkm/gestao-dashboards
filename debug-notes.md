# Debug Notes - Meses de Jornada Fix

## Changes Made
1. **OnboardingAluno.tsx - EtapaMeuPDI**: 
   - `totalMeses` now uses contrato dates (contratoObj.periodoInicio/periodoTermino) as priority, fallback to PDI dates
   - Timeline Início/Término labels now use `jornadaInicio`/`jornadaFim` instead of `macroInicio`/`macroTermino`
   - Card label shows "Meses de Contrato" when using contrato dates

2. **AdminCadastros.tsx**:
   - Added "Mentorias: X sessões (Individual/Em Grupo)" line to expanded aluno card

## Status
- TypeScript: No errors
- LSP: No errors  
- Server: Running
- HMR: Applied
