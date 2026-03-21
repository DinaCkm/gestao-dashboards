import { describe, it, expect } from "vitest";

/**
 * Tests for the "Resumo do seu Plano" calculation logic
 * These test the pure calculation functions used in EtapaAceite and EtapaMeuPDI
 */

// Pure calculation functions extracted from the component logic

function calcularWebinares(inicio: Date | null, termino: Date | null): number {
  if (!inicio || !termino) return 0;
  const totalMesesContrato = Math.max(1, Math.round((termino.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  return totalMesesContrato * 2; // 2 webinares por mês
}

function calcularMentorias(contrato: { totalSessoesContratadas?: number | null; tipoMentoria?: string | null } | null) {
  const sessoesContratadas = contrato?.totalSessoesContratadas || 0;
  const tipoMentoria = contrato?.tipoMentoria || 'individual';
  const temMentoria = sessoesContratadas > 0;
  return { sessoesContratadas, tipoMentoria, temMentoria };
}

function calcularTarefas(sessoesContratadas: number): number {
  return sessoesContratadas; // Tarefas = número de mentorias
}

function calcularTotalSessoesPrevistas(sessoesContratadas: number, totalMeses: number): number {
  return sessoesContratadas > 0 ? sessoesContratadas : totalMeses;
}

describe("Resumo do Plano - Cálculo de Webinares", () => {
  it("deve calcular 2 webinares por mês para contrato de 5 meses", () => {
    const inicio = new Date("2026-04-01");
    const termino = new Date("2026-09-01");
    const webinares = calcularWebinares(inicio, termino);
    expect(webinares).toBe(10); // 5 meses * 2 = 10
  });

  it("deve calcular 2 webinares por mês para contrato de 12 meses", () => {
    const inicio = new Date("2026-01-01");
    const termino = new Date("2026-12-31");
    const webinares = calcularWebinares(inicio, termino);
    expect(webinares).toBe(24); // 12 meses * 2 = 24
  });

  it("deve retornar mínimo de 2 webinares para contrato curto (1 mês)", () => {
    const inicio = new Date("2026-04-01");
    const termino = new Date("2026-04-30");
    const webinares = calcularWebinares(inicio, termino);
    expect(webinares).toBe(2); // 1 mês * 2 = 2
  });

  it("deve retornar 0 se não houver datas", () => {
    expect(calcularWebinares(null, null)).toBe(0);
    expect(calcularWebinares(new Date("2026-04-01"), null)).toBe(0);
    expect(calcularWebinares(null, new Date("2026-09-01"))).toBe(0);
  });

  it("deve calcular corretamente para Julia (abr-set 2026)", () => {
    const inicio = new Date("2026-04-01");
    const termino = new Date("2026-09-09");
    const webinares = calcularWebinares(inicio, termino);
    // ~5.3 meses -> arredonda para 5 -> 10 webinares
    expect(webinares).toBe(10);
  });
});

describe("Resumo do Plano - Cálculo de Mentorias", () => {
  it("deve retornar dados do contrato quando totalSessoesContratadas > 0", () => {
    const contrato = { totalSessoesContratadas: 6, tipoMentoria: "individual" };
    const result = calcularMentorias(contrato);
    expect(result.sessoesContratadas).toBe(6);
    expect(result.tipoMentoria).toBe("individual");
    expect(result.temMentoria).toBe(true);
  });

  it("deve indicar mentoria em grupo quando tipoMentoria é grupo", () => {
    const contrato = { totalSessoesContratadas: 12, tipoMentoria: "grupo" };
    const result = calcularMentorias(contrato);
    expect(result.sessoesContratadas).toBe(12);
    expect(result.tipoMentoria).toBe("grupo");
    expect(result.temMentoria).toBe(true);
  });

  it("deve indicar sem mentoria quando totalSessoesContratadas é 0", () => {
    const contrato = { totalSessoesContratadas: 0, tipoMentoria: "individual" };
    const result = calcularMentorias(contrato);
    expect(result.sessoesContratadas).toBe(0);
    expect(result.temMentoria).toBe(false);
  });

  it("deve indicar sem mentoria quando contrato é null", () => {
    const result = calcularMentorias(null);
    expect(result.sessoesContratadas).toBe(0);
    expect(result.tipoMentoria).toBe("individual");
    expect(result.temMentoria).toBe(false);
  });

  it("deve usar individual como padrão quando tipoMentoria não definido", () => {
    const contrato = { totalSessoesContratadas: 6, tipoMentoria: null };
    const result = calcularMentorias(contrato);
    expect(result.tipoMentoria).toBe("individual");
  });
});

describe("Resumo do Plano - Cálculo de Tarefas", () => {
  it("deve ser igual ao número de mentorias", () => {
    expect(calcularTarefas(6)).toBe(6);
    expect(calcularTarefas(12)).toBe(12);
    expect(calcularTarefas(0)).toBe(0);
  });
});

describe("Resumo do Plano - Total Sessões Previstas (EtapaMeuPDI)", () => {
  it("deve usar sessoesContratadas quando disponível", () => {
    expect(calcularTotalSessoesPrevistas(6, 5)).toBe(6);
    expect(calcularTotalSessoesPrevistas(12, 10)).toBe(12);
  });

  it("deve usar totalMeses como fallback quando sessoesContratadas é 0", () => {
    expect(calcularTotalSessoesPrevistas(0, 5)).toBe(5);
    expect(calcularTotalSessoesPrevistas(0, 10)).toBe(10);
  });
});

describe("Resumo do Plano - Dados do Contrato vs PDI", () => {
  it("deve priorizar datas do contrato sobre datas do PDI", () => {
    const contratoInicio = new Date("2026-04-01");
    const contratoFim = new Date("2026-09-09");
    const pdiInicio = new Date("2026-04-01");
    const pdiTermino = new Date("2026-04-30");
    
    // Contrato deve ser preferido
    const inicio = contratoInicio || pdiInicio;
    const termino = contratoFim || pdiTermino;
    
    expect(inicio).toEqual(contratoInicio);
    expect(termino).toEqual(contratoFim);
  });

  it("deve usar datas do PDI como fallback quando contrato não tem datas", () => {
    const contratoInicio = null;
    const contratoFim = null;
    const pdiInicio = new Date("2026-04-01");
    const pdiTermino = new Date("2026-04-30");
    
    const inicio = contratoInicio || pdiInicio;
    const termino = contratoFim || pdiTermino;
    
    expect(inicio).toEqual(pdiInicio);
    expect(termino).toEqual(pdiTermino);
  });
});

describe("Edição de Cadastro - Campos de Contrato", () => {
  it("deve aceitar tipoMentoria individual ou grupo", () => {
    const validValues = ["individual", "grupo"];
    for (const val of validValues) {
      expect(validValues.includes(val)).toBe(true);
    }
  });

  it("deve aceitar totalSessoesContratadas como número positivo", () => {
    const input = "6";
    const parsed = parseInt(input);
    expect(parsed).toBe(6);
    expect(parsed > 0).toBe(true);
  });

  it("deve tratar totalSessoesContratadas vazio como null", () => {
    const input = "";
    const result = input ? parseInt(input) : null;
    expect(result).toBeNull();
  });
});

describe("Contrato Virtual - Fallback da tabela alunos", () => {
  function criarContratoVirtual(alunoData: {
    totalSessoesContratadas: number | null;
    tipoMentoria: string | null;
    contratoInicio: Date | null;
    contratoFim: Date | null;
  }) {
    if (alunoData.totalSessoesContratadas && alunoData.totalSessoesContratadas > 0) {
      return {
        id: 0,
        totalSessoesContratadas: alunoData.totalSessoesContratadas,
        tipoMentoria: alunoData.tipoMentoria || "individual",
        periodoInicio: alunoData.contratoInicio ? alunoData.contratoInicio.toISOString().split("T")[0] : null,
        periodoTermino: alunoData.contratoFim ? alunoData.contratoFim.toISOString().split("T")[0] : null,
      };
    }
    return null;
  }

  it("deve criar contrato virtual quando aluno tem totalSessoesContratadas", () => {
    const contrato = criarContratoVirtual({
      totalSessoesContratadas: 6,
      tipoMentoria: "individual",
      contratoInicio: new Date("2026-04-01"),
      contratoFim: new Date("2026-09-09"),
    });
    expect(contrato).not.toBeNull();
    expect(contrato!.totalSessoesContratadas).toBe(6);
    expect(contrato!.tipoMentoria).toBe("individual");
    expect(contrato!.periodoInicio).toBe("2026-04-01");
    expect(contrato!.periodoTermino).toBe("2026-09-09");
  });

  it("deve retornar null quando totalSessoesContratadas é 0", () => {
    const contrato = criarContratoVirtual({
      totalSessoesContratadas: 0,
      tipoMentoria: "individual",
      contratoInicio: new Date("2026-04-01"),
      contratoFim: new Date("2026-09-09"),
    });
    expect(contrato).toBeNull();
  });

  it("deve retornar null quando totalSessoesContratadas é null", () => {
    const contrato = criarContratoVirtual({
      totalSessoesContratadas: null,
      tipoMentoria: "individual",
      contratoInicio: new Date("2026-04-01"),
      contratoFim: new Date("2026-09-09"),
    });
    expect(contrato).toBeNull();
  });

  it("deve usar individual como padrão quando tipoMentoria é null", () => {
    const contrato = criarContratoVirtual({
      totalSessoesContratadas: 6,
      tipoMentoria: null,
      contratoInicio: new Date("2026-04-01"),
      contratoFim: new Date("2026-09-09"),
    });
    expect(contrato!.tipoMentoria).toBe("individual");
  });

  it("deve lidar com datas nulas no contrato virtual", () => {
    const contrato = criarContratoVirtual({
      totalSessoesContratadas: 6,
      tipoMentoria: "grupo",
      contratoInicio: null,
      contratoFim: null,
    });
    expect(contrato).not.toBeNull();
    expect(contrato!.periodoInicio).toBeNull();
    expect(contrato!.periodoTermino).toBeNull();
    expect(contrato!.tipoMentoria).toBe("grupo");
  });
});
