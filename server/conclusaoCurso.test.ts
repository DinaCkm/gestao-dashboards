import { describe, it, expect } from "vitest";
import { decidirConclusaoCurso } from "./conclusaoCurso";

describe("regra de conclusão do curso", () => {
  it("conclui quando todas as atividades ativas estão aprovadas, com a média das notas", () => {
    const d = decidirConclusaoCurso([1, 2, 3], [
      { atividadeId: 1, status: "aprovada", notaFinal: "8.0" },
      { atividadeId: 2, status: "aprovada", notaFinal: "9.5" },
      { atividadeId: 3, status: "aprovada", notaFinal: null }, // atividade sem avaliação
    ]);
    expect(d).toEqual({ concluido: true, notaFinal: 8.8, pendentes: 0 });
  });

  it("não conclui com atividade reprovada, bloqueada ou sem progresso", () => {
    expect(decidirConclusaoCurso([1, 2], [
      { atividadeId: 1, status: "aprovada", notaFinal: "8.0" },
      { atividadeId: 2, status: "reprovada", notaFinal: "6.0" },
    ]).concluido).toBe(false);
    expect(decidirConclusaoCurso([1, 2], [{ atividadeId: 1, status: "aprovada", notaFinal: "9.0" }])).toMatchObject({ concluido: false, pendentes: 1 });
  });

  it("ignora progresso de atividades desativadas", () => {
    const d = decidirConclusaoCurso([1], [
      { atividadeId: 1, status: "aprovada", notaFinal: "10.0" },
      { atividadeId: 99, status: "reprovada", notaFinal: "2.0" },
    ]);
    expect(d).toEqual({ concluido: true, notaFinal: 10, pendentes: 0 });
  });

  it("curso sem atividades ativas não é concluído", () => {
    expect(decidirConclusaoCurso([], []).concluido).toBe(false);
  });

  it("curso só com atividades sem avaliação conclui sem nota", () => {
    expect(decidirConclusaoCurso([1], [{ atividadeId: 1, status: "aprovada", notaFinal: null }])).toEqual({ concluido: true, notaFinal: null, pendentes: 0 });
  });
});
