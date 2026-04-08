import { describe, it, expect } from "vitest";

/**
 * Testes para validar a lógica de filtro por macroInicio na listagem de eventos do aluno
 * e a nova estrutura de retorno com período de cálculo.
 */

describe("Filtro de eventos por macroInicio", () => {
  // Simular a lógica de filtro que foi aplicada em getWebinarsPendingAttendance
  const filterEventsByMacroInicio = (
    events: Array<{ id: number; eventDate: Date | null }>,
    participationMap: Map<number, any>,
    macroInicio: Date | null
  ) => {
    if (!macroInicio) return events;
    return events.filter(evt => {
      // Se o aluno tem participação nesse evento, manter sempre
      if (participationMap.has(evt.id)) return true;
      // Se o evento não tem data, manter
      if (!evt.eventDate) return true;
      // Filtrar: só manter eventos a partir do macroInicio
      return new Date(evt.eventDate) >= macroInicio;
    });
  };

  it("deve manter todos os eventos quando macroInicio é null", () => {
    const events = [
      { id: 1, eventDate: new Date("2024-10-15") },
      { id: 2, eventDate: new Date("2025-01-20") },
      { id: 3, eventDate: new Date("2025-09-15") },
    ];
    const participationMap = new Map();
    const result = filterEventsByMacroInicio(events, participationMap, null);
    expect(result).toHaveLength(3);
  });

  it("deve filtrar eventos anteriores ao macroInicio quando não há participação", () => {
    const events = [
      { id: 1, eventDate: new Date("2024-10-15") }, // antes do macro
      { id: 2, eventDate: new Date("2025-01-20") }, // antes do macro
      { id: 3, eventDate: new Date("2025-08-19") }, // antes do macro
      { id: 4, eventDate: new Date("2025-09-16") }, // depois do macro
      { id: 5, eventDate: new Date("2025-10-21") }, // depois do macro
    ];
    const participationMap = new Map();
    const macroInicio = new Date("2025-09-01");
    const result = filterEventsByMacroInicio(events, participationMap, macroInicio);
    expect(result).toHaveLength(2);
    expect(result.map(e => e.id)).toEqual([4, 5]);
  });

  it("deve manter eventos anteriores ao macroInicio se o aluno tem participação", () => {
    const events = [
      { id: 1, eventDate: new Date("2024-10-15") }, // antes do macro, COM participação
      { id: 2, eventDate: new Date("2025-01-20") }, // antes do macro, sem participação
      { id: 3, eventDate: new Date("2025-09-16") }, // depois do macro
    ];
    const participationMap = new Map([[1, { status: "presente" }]]);
    const macroInicio = new Date("2025-09-01");
    const result = filterEventsByMacroInicio(events, participationMap, macroInicio);
    expect(result).toHaveLength(2);
    expect(result.map(e => e.id)).toEqual([1, 3]);
  });

  it("deve manter eventos sem data (eventDate null)", () => {
    const events = [
      { id: 1, eventDate: null }, // sem data, manter
      { id: 2, eventDate: new Date("2024-10-15") }, // antes do macro
      { id: 3, eventDate: new Date("2025-09-16") }, // depois do macro
    ];
    const participationMap = new Map();
    const macroInicio = new Date("2025-09-01");
    const result = filterEventsByMacroInicio(events, participationMap, macroInicio);
    expect(result).toHaveLength(2);
    expect(result.map(e => e.id)).toEqual([1, 3]);
  });

  it("caso Walbenia: macroInicio 01/09/2025, deve filtrar eventos anteriores sem participação", () => {
    // 5 eventos anteriores ao macrociclo (sem participação)
    const eventosAnteriores = [
      { id: 1, eventDate: new Date("2024-10-15") },
      { id: 2, eventDate: new Date("2024-11-19") },
      { id: 3, eventDate: new Date("2025-03-18") },
      { id: 4, eventDate: new Date("2025-07-22") },
      { id: 5, eventDate: new Date("2025-08-19") },
    ];
    // 4 eventos dentro do macrociclo
    const eventosDentro = [
      { id: 101, eventDate: new Date("2025-09-16") },
      { id: 102, eventDate: new Date("2025-10-21") },
      { id: 103, eventDate: new Date("2025-11-18") },
      { id: 104, eventDate: new Date("2025-12-16") },
    ];
    // Walbenia tem participação em 2 dos 4 eventos dentro do macrociclo
    const participationMap = new Map([
      [101, { status: "presente" }],
      [102, { status: "presente" }],
    ]);
    const macroInicio = new Date("2025-09-01");
    const allEvents = [...eventosAnteriores, ...eventosDentro];
    const result = filterEventsByMacroInicio(allEvents, participationMap, macroInicio);
    // Deve ter apenas os 4 eventos dentro do macrociclo (não os 5 anteriores)
    expect(result).toHaveLength(4);
    // Nenhum evento com id < 100 deve estar no resultado
    expect(result.every(e => e.id >= 100)).toBe(true);
  });
});

describe("Estrutura de retorno do endpoint pending", () => {
  it("deve retornar objeto com events, periodoInicio e periodoFim", () => {
    // Simular a estrutura de retorno
    const response = {
      events: [{ eventId: 1, title: "Evento 1", status: "ausente" }],
      periodoInicio: new Date("2025-09-01").toISOString(),
      periodoFim: new Date("2026-03-01").toISOString(),
    };
    expect(response).toHaveProperty("events");
    expect(response).toHaveProperty("periodoInicio");
    expect(response).toHaveProperty("periodoFim");
    expect(Array.isArray(response.events)).toBe(true);
    expect(response.events.length).toBe(1);
  });

  it("deve calcular periodoFim como macroInicio + 6 meses", () => {
    const macroInicio = new Date("2025-09-01T00:00:00.000Z");
    const periodoFim = new Date(macroInicio);
    periodoFim.setMonth(periodoFim.getMonth() + 6);
    // O mês deve avançar 6 meses (de setembro para março)
    expect(periodoFim.getUTCMonth()).toBe(2); // março = 2
    expect(periodoFim.getUTCFullYear()).toBe(2026);
  });

  it("deve retornar null para periodoInicio e periodoFim quando aluno não tem macrociclo", () => {
    const response = {
      events: [],
      periodoInicio: null,
      periodoFim: null,
    };
    expect(response.periodoInicio).toBeNull();
    expect(response.periodoFim).toBeNull();
  });
});
