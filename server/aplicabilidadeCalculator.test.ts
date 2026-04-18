import { describe, expect, it } from "vitest";
import { calcularAplicabilidadeFinal, calcularMicroTarefaAplicabilidade } from "./aplicabilidadeCalculator";

describe("aplicabilidadeCalculator", () => {
  it("calcula micro tarefa usando nota da mentora como oficial", () => {
    const micro = calcularMicroTarefaAplicabilidade([
      { notaAlunoAplicabilidade: 8, notaMentoraAplicabilidade: 7 },
      { notaAlunoAplicabilidade: 9, notaMentoraAplicabilidade: 6 },
    ]);

    expect(micro.percentual).toBe(65);
    expect(micro.provisoria).toBe(false);
    expect(micro.total).toBe(2);
  });

  it("marca provisória quando só há nota do aluno", () => {
    const micro = calcularMicroTarefaAplicabilidade([
      { notaAlunoAplicabilidade: 7, notaMentoraAplicabilidade: null },
    ]);

    expect(micro.percentual).toBe(70);
    expect(micro.provisoria).toBe(true);
  });

  it("aplica média dos microindicadores válidos (tarefa + case)", () => {
    const result = calcularAplicabilidadeFinal({
      microTarefaPercentual: 70,
      microCasePercentual: 100,
      caseAplicavel: true,
      provisoria: false,
      totalTarefasComAplicabilidade: 1,
      totalCasesConsiderados: 1,
    });

    expect(result.percentualFinal).toBe(85);
  });

  it("não penaliza quando case ainda não é aplicável", () => {
    const result = calcularAplicabilidadeFinal({
      microTarefaPercentual: 70,
      microCasePercentual: null,
      caseAplicavel: false,
      provisoria: false,
      totalTarefasComAplicabilidade: 1,
      totalCasesConsiderados: 0,
    });

    expect(result.percentualFinal).toBe(70);
  });
});
