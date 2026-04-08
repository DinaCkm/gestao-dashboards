import { describe, it, expect } from "vitest";

/**
 * Tests for the onboarding progress logic.
 * The endpoint determines the current onboarding step based on:
 * - Step 1: Cadastro (default - needs name + email)
 * - Step 2: Assessment/DISC (after cadastro preenchido)
 * - Step 3: Mentora (after DISC + autopercepção)
 * - Step 4: Agendamento (after mentora chosen)
 * - Step 5: 1º Encontro (after agendamento)
 */

describe("Onboarding Progress Logic", () => {
  // Simulate the updated step determination logic from the endpoint
  function determineStep(params: {
    cadastroPreenchido: boolean;
    discCompleto: boolean;
    autopercepCompleta: boolean;
    mentoraEscolhida: boolean;
    agendamentoFeito: boolean;
    mentoraId?: number | null;
  }) {
    const { cadastroPreenchido, discCompleto, autopercepCompleta, mentoraEscolhida, agendamentoFeito, mentoraId } = params;
    let step = 1;
    if (cadastroPreenchido) step = 2;
    if (cadastroPreenchido && discCompleto && autopercepCompleta) step = 3;
    if (cadastroPreenchido && discCompleto && autopercepCompleta && mentoraEscolhida) step = 4;
    if (cadastroPreenchido && discCompleto && autopercepCompleta && mentoraEscolhida && agendamentoFeito) step = 5;
    return { step, mentoraId: mentoraId || null };
  }

  it("should return step 1 when nothing is completed (no cadastro)", () => {
    const result = determineStep({
      cadastroPreenchido: false,
      discCompleto: false,
      autopercepCompleta: false,
      mentoraEscolhida: false,
      agendamentoFeito: false,
    });
    expect(result.step).toBe(1);
  });

  it("should return step 2 when cadastro is filled but DISC not done", () => {
    const result = determineStep({
      cadastroPreenchido: true,
      discCompleto: false,
      autopercepCompleta: false,
      mentoraEscolhida: false,
      agendamentoFeito: false,
    });
    expect(result.step).toBe(2);
  });

  it("should return step 1 when DISC is done but cadastro is NOT filled", () => {
    const result = determineStep({
      cadastroPreenchido: false,
      discCompleto: true,
      autopercepCompleta: true,
      mentoraEscolhida: false,
      agendamentoFeito: false,
    });
    expect(result.step).toBe(1);
  });

  it("should return step 3 when cadastro + DISC + autopercepção are completed", () => {
    const result = determineStep({
      cadastroPreenchido: true,
      discCompleto: true,
      autopercepCompleta: true,
      mentoraEscolhida: false,
      agendamentoFeito: false,
    });
    expect(result.step).toBe(3);
  });

  it("should return step 4 when mentora is chosen and return mentoraId", () => {
    const result = determineStep({
      cadastroPreenchido: true,
      discCompleto: true,
      autopercepCompleta: true,
      mentoraEscolhida: true,
      agendamentoFeito: false,
      mentoraId: 5,
    });
    expect(result.step).toBe(4);
    expect(result.mentoraId).toBe(5);
  });

  it("should return step 5 when agendamento is done", () => {
    const result = determineStep({
      cadastroPreenchido: true,
      discCompleto: true,
      autopercepCompleta: true,
      mentoraEscolhida: true,
      agendamentoFeito: true,
      mentoraId: 5,
    });
    expect(result.step).toBe(5);
  });

  it("should not skip to step 3 if only autopercepção is done (no DISC)", () => {
    const result = determineStep({
      cadastroPreenchido: true,
      discCompleto: false,
      autopercepCompleta: true,
      mentoraEscolhida: false,
      agendamentoFeito: false,
    });
    expect(result.step).toBe(2);
  });

  it("should not jump to step 4 if mentora is chosen but DISC is not done", () => {
    const result = determineStep({
      cadastroPreenchido: true,
      discCompleto: false,
      autopercepCompleta: false,
      mentoraEscolhida: true,
      agendamentoFeito: false,
    });
    expect(result.step).toBe(2);
  });

  it("should persist mentoraId when aluno returns to step 4", () => {
    const result = determineStep({
      cadastroPreenchido: true,
      discCompleto: true,
      autopercepCompleta: true,
      mentoraEscolhida: true,
      agendamentoFeito: false,
      mentoraId: 7,
    });
    expect(result.step).toBe(4);
    expect(result.mentoraId).toBe(7);
  });

  it("should return null mentoraId when no mentora is chosen", () => {
    const result = determineStep({
      cadastroPreenchido: true,
      discCompleto: true,
      autopercepCompleta: true,
      mentoraEscolhida: false,
      agendamentoFeito: false,
    });
    expect(result.step).toBe(3);
    expect(result.mentoraId).toBeNull();
  });
});
