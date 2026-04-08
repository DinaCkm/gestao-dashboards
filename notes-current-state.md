# Current State Notes

## Backend
- `getAllStudentsSessionProgress()` in db.ts already returns: ultimaSessao, diasSemSessao, atrasado30dias
- `alertasMentoria.enviarAlertas` endpoint exists in routers.ts (adminProcedure mutation)
- `cronAlertasMentoria.ts` exists but NOT integrated into server startup
- `emailAlertasLog` table exists in schema
- `buildMentoringAlertEmail` exists in emailService.ts

## Frontend - DemonstrativoMentorias.tsx
- Current StatusFilter: "todos" | "completo" | "em_andamento" | "atencao"
- Current filters: searchTerm, selectedEmpresa, selectedTurma, selectedTrilha, statusFilter
- Missing: selectedMentor filter
- Table columns: Aluno, Empresa(admin), Turma, Trilha, Mentor, Período, Real., Esp., Falt., Progresso, Status
- Missing: Última Sessão column
- No expandable rows
- No alert sending button
- Data from: trpc.mentor.allSessionProgress.useQuery()
- Toast: import { toast } from "sonner"
- Dialog components available
- Tooltip components available

## What needs to be done
1. Add "Última Sessão" column to table
2. Add "Atrasado 30+ dias" to StatusFilter
3. Add mentor filter dropdown
4. Make rows expandable/clickable with full detail view
5. Add "Enviar Alertas" button for manual email sending
6. Add red badge for 30+ days overdue
7. Integrate cron job in server startup
