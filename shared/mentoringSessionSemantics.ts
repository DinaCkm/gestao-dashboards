/**
 * Semântica compartilhada para diferenciar um encontro real de mentoria
 * de uma tarefa isolada armazenada na mesma tabela mentoring_sessions.
 *
 * A regra é propositalmente conservadora: só classifica como tarefa isolada
 * quando há sinais claros de tarefa e nenhum sinal próprio de encontro real.
 */
export interface MentoringSessionSemanticInput {
  taskMode?: string | null;
  taskStatus?: string | null;
  customTaskTitle?: string | null;
  presence?: string | null;
  engagementScore?: number | string | null;
  notaEvolucao?: number | string | null;
  feedback?: string | null;
  mensagemAluno?: string | null;
  appointmentId?: number | string | null;
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasId(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric > 0 : true;
}

export function isStandaloneMentoringTask(session: MentoringSessionSemanticInput): boolean {
  const hasSessionSignal =
    hasId(session.appointmentId)
    || session.engagementScore !== null && session.engagementScore !== undefined
    || session.notaEvolucao !== null && session.notaEvolucao !== undefined
    || hasText(session.feedback)
    || hasText(session.mensagemAluno);

  return (
    session.taskMode === "livre"
    && session.presence === "presente"
    && session.taskStatus !== "sem_tarefa"
    && hasText(session.customTaskTitle)
    && !hasSessionSignal
  );
}

export function isRealMentoringSession(session: MentoringSessionSemanticInput): boolean {
  return !isStandaloneMentoringTask(session);
}
