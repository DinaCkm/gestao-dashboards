import { describe, it, expect } from "vitest";

/**
 * Tests for the onboarding progress logic.
 * The endpoint determines the current onboarding step based on:
 * - Step 1: Cadastro (default)
 * - Step 2: Assessment/DISC (after cadastro)
 * - Step 3: Mentora (after DISC + autopercepção)
 * - Step 4: Agendamento (after mentora chosen)
 * - Step 5: 1º Encontro (after agendamento)
 */

describe("Onboarding Progress Logic", () => {
  // Simulate the step determination logic from the endpoint
  function determineStep(params: {
    discCompleto: boolean;
    autopercepCompleta: boolean;
    mentoraEscolhida: boolean;
    agendamentoFeito: boolean;
  }) {
    const { discCompleto, autopercepCompleta, mentoraEscolhida, agendamentoFeito } = params;
    let step = 1;
    if (discCompleto && autopercepCompleta) step = 3;
    if (discCompleto && autopercepCompleta && mentoraEscolhida) step = 4;
    if (discCompleto && autopercepCompleta && mentoraEscolhida && agendamentoFeito) step = 5;
    return step;
  }

  it("should return step 1 when nothing is completed", () => {
    const step = determineStep({
      discCompleto: false,
      autopercepCompleta: false,
      mentoraEscolhida: false,
      agendamentoFeito: false,
    });
    expect(step).toBe(1);
  });

  it("should return step 1 when only DISC is completed (autopercepção missing)", () => {
    const step = determineStep({
      discCompleto: true,
      autopercepCompleta: false,
      mentoraEscolhida: false,
      agendamentoFeito: false,
    });
    expect(step).toBe(1);
  });

  it("should return step 3 when DISC and autopercepção are completed", () => {
    const step = determineStep({
      discCompleto: true,
      autopercepCompleta: true,
      mentoraEscolhida: false,
      agendamentoFeito: false,
    });
    expect(step).toBe(3);
  });

  it("should return step 4 when mentora is chosen", () => {
    const step = determineStep({
      discCompleto: true,
      autopercepCompleta: true,
      mentoraEscolhida: true,
      agendamentoFeito: false,
    });
    expect(step).toBe(4);
  });

  it("should return step 5 when agendamento is done", () => {
    const step = determineStep({
      discCompleto: true,
      autopercepCompleta: true,
      mentoraEscolhida: true,
      agendamentoFeito: true,
    });
    expect(step).toBe(5);
  });

  it("should not skip to step 3 if only autopercepção is done (no DISC)", () => {
    const step = determineStep({
      discCompleto: false,
      autopercepCompleta: true,
      mentoraEscolhida: false,
      agendamentoFeito: false,
    });
    expect(step).toBe(1);
  });

  it("should not jump to step 4 if mentora is chosen but DISC is not done", () => {
    const step = determineStep({
      discCompleto: false,
      autopercepCompleta: false,
      mentoraEscolhida: true,
      agendamentoFeito: false,
    });
    expect(step).toBe(1);
  });
});
