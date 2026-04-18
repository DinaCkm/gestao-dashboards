export interface AplicabilidadeTaskInput {
  notaAlunoAplicabilidade?: number | null;
  notaMentoraAplicabilidade?: number | null;
}

export interface AplicabilidadeResultado {
  percentualFinal: number | null;
  microTarefaPercentual: number | null;
  microCasePercentual: number | null;
  caseAplicavel: boolean;
  provisoria: boolean;
  totalTarefasComAplicabilidade: number;
  totalCasesConsiderados: number;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function toPercentFrom0to10(score: number): number {
  return round(Math.max(0, Math.min(10, score)) * 10);
}

export function calcularMicroTarefaAplicabilidade(
  tarefas: AplicabilidadeTaskInput[],
): { percentual: number | null; provisoria: boolean; total: number } {
  const tarefasValidas = tarefas.filter(
    (t) => t.notaAlunoAplicabilidade != null || t.notaMentoraAplicabilidade != null,
  );

  if (tarefasValidas.length === 0) {
    return { percentual: null, provisoria: false, total: 0 };
  }

  const notasFinais = tarefasValidas.map((t) =>
    t.notaMentoraAplicabilidade != null
      ? Number(t.notaMentoraAplicabilidade)
      : Number(t.notaAlunoAplicabilidade),
  );

  const provisoria = tarefasValidas.some(
    (t) => t.notaMentoraAplicabilidade == null && t.notaAlunoAplicabilidade != null,
  );

  const media = notasFinais.reduce((acc, n) => acc + n, 0) / notasFinais.length;

  return {
    percentual: toPercentFrom0to10(media),
    provisoria,
    total: tarefasValidas.length,
  };
}

export function calcularAplicabilidadeFinal(params: {
  microTarefaPercentual: number | null;
  microCasePercentual: number | null;
  caseAplicavel: boolean;
  totalTarefasComAplicabilidade: number;
  totalCasesConsiderados: number;
  provisoria: boolean;
}): AplicabilidadeResultado {
  const validos: number[] = [];
  if (params.microTarefaPercentual != null) validos.push(params.microTarefaPercentual);
  if (params.caseAplicavel && params.microCasePercentual != null) validos.push(params.microCasePercentual);

  return {
    percentualFinal: validos.length ? round(validos.reduce((a, b) => a + b, 0) / validos.length) : null,
    microTarefaPercentual: params.microTarefaPercentual,
    microCasePercentual: params.microCasePercentual,
    caseAplicavel: params.caseAplicavel,
    provisoria: params.provisoria,
    totalTarefasComAplicabilidade: params.totalTarefasComAplicabilidade,
    totalCasesConsiderados: params.totalCasesConsiderados,
  };
}
