// Regra única de conclusão de um curso atribuído (a mesma de submeterAvaliacao):
// o curso está concluído quando TODAS as atividades ativas estão aprovadas. Atividade
// com avaliação só é aprovada com 80% de acerto (nota >= 8); atividade sem avaliação é
// aprovada ao ser concluída. A nota final é a média das notas das atividades avaliadas,
// o mesmo cálculo que alimenta o Ind. 3 (syncStudentPerformanceFromPlatform).

export type ProgressoAtividade = {
  atividadeId: number;
  status: string;
  notaFinal: string | number | null;
};

export type DecisaoConclusao = {
  concluido: boolean;
  notaFinal: number | null; // escala 0-10, uma casa decimal
  pendentes: number;
};

export function decidirConclusaoCurso(atividadesAtivasIds: number[], progresso: ProgressoAtividade[]): DecisaoConclusao {
  const porAtividade = new Map(progresso.map((p) => [Number(p.atividadeId), p]));
  const pendentes = atividadesAtivasIds.filter((id) => porAtividade.get(id)?.status !== "aprovada").length;
  const notas = atividadesAtivasIds
    .map((id) => porAtividade.get(id)?.notaFinal)
    .filter((nota): nota is string | number => nota !== null && nota !== undefined && String(nota).trim() !== "")
    .map((nota) => Number(nota))
    .filter((nota) => Number.isFinite(nota));
  const notaFinal = notas.length > 0
    ? Math.round((notas.reduce((soma, nota) => soma + nota, 0) / notas.length) * 10) / 10
    : null;
  return { concluido: atividadesAtivasIds.length > 0 && pendentes === 0, notaFinal, pendentes };
}
