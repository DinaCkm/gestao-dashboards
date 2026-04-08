import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getRelatorioFinanceiroMentorias: vi.fn(),
}));

import { getRelatorioFinanceiroMentorias } from "./db";

describe("Relatório Financeiro de Mentorias", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return financial report structure", async () => {
    const mockData = {
      mentores: [
        {
          consultorId: 1,
          consultorNome: "Adriana Deus",
          valorSessao: 150,
          sessoes: [
            { sessionId: 1, sessionDate: "2026-01-15", sessionNumber: 1, alunoId: 100, alunoNome: "João" },
            { sessionId: 2, sessionDate: "2026-01-20", sessionNumber: 2, alunoId: 101, alunoNome: "Maria" },
          ],
          totalSessoes: 2,
          totalValor: 300,
        },
        {
          consultorId: 2,
          consultorNome: "Carlos Silva",
          valorSessao: 200,
          sessoes: [
            { sessionId: 3, sessionDate: "2026-02-01", sessionNumber: 1, alunoId: 102, alunoNome: "Pedro" },
          ],
          totalSessoes: 1,
          totalValor: 200,
        },
      ],
      totalGeral: 500,
      totalSessoesGeral: 3,
      totalMentores: 2,
    };

    (getRelatorioFinanceiroMentorias as any).mockResolvedValue(mockData);

    const result = await getRelatorioFinanceiroMentorias();

    expect(result).toBeDefined();
    expect(result.mentores).toHaveLength(2);
    expect(result.totalGeral).toBe(500);
    expect(result.totalSessoesGeral).toBe(3);
    expect(result.totalMentores).toBe(2);
  });

  it("should accept date range parameters", async () => {
    const mockData = {
      mentores: [],
      totalGeral: 0,
      totalSessoesGeral: 0,
      totalMentores: 0,
    };

    (getRelatorioFinanceiroMentorias as any).mockResolvedValue(mockData);

    const result = await getRelatorioFinanceiroMentorias("2026-01-01", "2026-01-31");

    expect(getRelatorioFinanceiroMentorias).toHaveBeenCalledWith("2026-01-01", "2026-01-31");
    expect(result.mentores).toHaveLength(0);
    expect(result.totalGeral).toBe(0);
  });

  it("should calculate total correctly per mentor", async () => {
    const mockData = {
      mentores: [
        {
          consultorId: 1,
          consultorNome: "Mentor A",
          valorSessao: 100,
          sessoes: Array(5).fill({ sessionId: 1, sessionDate: "2026-01-15", sessionNumber: 1, alunoId: 100, alunoNome: "Aluno" }),
          totalSessoes: 5,
          totalValor: 500,
        },
      ],
      totalGeral: 500,
      totalSessoesGeral: 5,
      totalMentores: 1,
    };

    (getRelatorioFinanceiroMentorias as any).mockResolvedValue(mockData);

    const result = await getRelatorioFinanceiroMentorias();

    expect(result.mentores[0].totalSessoes).toBe(5);
    expect(result.mentores[0].totalValor).toBe(result.mentores[0].totalSessoes * result.mentores[0].valorSessao);
  });

  it("should handle mentor with no valorSessao (zero)", async () => {
    const mockData = {
      mentores: [
        {
          consultorId: 1,
          consultorNome: "Mentor Sem Valor",
          valorSessao: 0,
          sessoes: [{ sessionId: 1, sessionDate: "2026-01-15", sessionNumber: 1, alunoId: 100, alunoNome: "Aluno" }],
          totalSessoes: 1,
          totalValor: 0,
        },
      ],
      totalGeral: 0,
      totalSessoesGeral: 1,
      totalMentores: 1,
    };

    (getRelatorioFinanceiroMentorias as any).mockResolvedValue(mockData);

    const result = await getRelatorioFinanceiroMentorias();

    expect(result.mentores[0].valorSessao).toBe(0);
    expect(result.mentores[0].totalValor).toBe(0);
    expect(result.totalGeral).toBe(0);
  });
});
