import { describe, it, expect } from "vitest";

/**
 * Tests for the stepper navigation logic fix.
 * The fix ensures that when an aluno navigates to a previous step (already completed),
 * the step is shown in readOnly mode to prevent re-doing completed steps.
 */

describe("Stepper Navigation Logic", () => {
  // Simulate the readOnly calculation logic from OnboardingAluno
  function calculateReadOnly(params: {
    onboardingCompleto: boolean;
    hasPdi: boolean;
    needsOnboarding: boolean;
    currentStep: number;
    progressStep: number;
  }) {
    const globalReadOnly = params.onboardingCompleto || 
      (params.hasPdi && !params.needsOnboarding);
    const isViewingPreviousStep = !globalReadOnly && params.currentStep < params.progressStep;
    const readOnly = globalReadOnly || isViewingPreviousStep;
    return { globalReadOnly, isViewingPreviousStep, readOnly };
  }

  it("should be readOnly when onboarding is complete", () => {
    const result = calculateReadOnly({
      onboardingCompleto: true,
      hasPdi: true,
      needsOnboarding: false,
      currentStep: 8,
      progressStep: 8,
    });
    expect(result.globalReadOnly).toBe(true);
    expect(result.readOnly).toBe(true);
  });

  it("should be readOnly when hasPdi and does not need onboarding (veteran)", () => {
    const result = calculateReadOnly({
      onboardingCompleto: false,
      hasPdi: true,
      needsOnboarding: false,
      currentStep: 1,
      progressStep: 8,
    });
    expect(result.globalReadOnly).toBe(true);
    expect(result.readOnly).toBe(true);
  });

  it("should NOT be readOnly when at current progress step (active onboarding)", () => {
    const result = calculateReadOnly({
      onboardingCompleto: false,
      hasPdi: false,
      needsOnboarding: true,
      currentStep: 5,
      progressStep: 5,
    });
    expect(result.globalReadOnly).toBe(false);
    expect(result.isViewingPreviousStep).toBe(false);
    expect(result.readOnly).toBe(false);
  });

  it("should be readOnly when viewing a PREVIOUS step (the bug fix)", () => {
    // Julia is at step 8 (Aceite) but clicks on step 1 (Cadastro)
    const result = calculateReadOnly({
      onboardingCompleto: false,
      hasPdi: false,
      needsOnboarding: true,
      currentStep: 1,  // clicked on Cadastro
      progressStep: 8, // real progress is Aceite
    });
    expect(result.globalReadOnly).toBe(false);
    expect(result.isViewingPreviousStep).toBe(true);
    expect(result.readOnly).toBe(true);
  });

  it("should be readOnly when viewing step 2 while progress is at step 5", () => {
    const result = calculateReadOnly({
      onboardingCompleto: false,
      hasPdi: false,
      needsOnboarding: true,
      currentStep: 2,  // clicked on Assessment
      progressStep: 5, // real progress is 1º Encontro
    });
    expect(result.globalReadOnly).toBe(false);
    expect(result.isViewingPreviousStep).toBe(true);
    expect(result.readOnly).toBe(true);
  });

  it("should NOT be readOnly when viewing the current step", () => {
    const result = calculateReadOnly({
      onboardingCompleto: false,
      hasPdi: false,
      needsOnboarding: true,
      currentStep: 3,
      progressStep: 3,
    });
    expect(result.globalReadOnly).toBe(false);
    expect(result.isViewingPreviousStep).toBe(false);
    expect(result.readOnly).toBe(false);
  });

  it("should allow editing for new aluno at step 1", () => {
    const result = calculateReadOnly({
      onboardingCompleto: false,
      hasPdi: false,
      needsOnboarding: true,
      currentStep: 1,
      progressStep: 1,
    });
    expect(result.globalReadOnly).toBe(false);
    expect(result.isViewingPreviousStep).toBe(false);
    expect(result.readOnly).toBe(false);
  });

  it("should allow editing for aluno with onboarding liberado (new cycle)", () => {
    const result = calculateReadOnly({
      onboardingCompleto: false,
      hasPdi: true,
      needsOnboarding: true, // onboarding liberado
      currentStep: 1,
      progressStep: 1,
    });
    expect(result.globalReadOnly).toBe(false);
    expect(result.isViewingPreviousStep).toBe(false);
    expect(result.readOnly).toBe(false);
  });
});

describe("Stepper Step Click Blocking", () => {
  function shouldBlockStepClick(params: {
    globalReadOnly: boolean;
    progressStep: number;
    targetStep: number;
  }): boolean {
    // Block navigation to Mentora (3) and Agendamento (4) if already past those
    if (!params.globalReadOnly && params.progressStep >= 5 && 
        (params.targetStep === 3 || params.targetStep === 4)) {
      return true;
    }
    return false;
  }

  it("should block clicking Mentora when progress is past step 5", () => {
    expect(shouldBlockStepClick({ globalReadOnly: false, progressStep: 6, targetStep: 3 })).toBe(true);
  });

  it("should block clicking Agendamento when progress is past step 5", () => {
    expect(shouldBlockStepClick({ globalReadOnly: false, progressStep: 8, targetStep: 4 })).toBe(true);
  });

  it("should NOT block clicking Cadastro when progress is past step 5", () => {
    expect(shouldBlockStepClick({ globalReadOnly: false, progressStep: 8, targetStep: 1 })).toBe(false);
  });

  it("should NOT block any step when in globalReadOnly mode", () => {
    expect(shouldBlockStepClick({ globalReadOnly: true, progressStep: 8, targetStep: 3 })).toBe(false);
    expect(shouldBlockStepClick({ globalReadOnly: true, progressStep: 8, targetStep: 4 })).toBe(false);
  });

  it("should NOT block Mentora when progress is before step 5", () => {
    expect(shouldBlockStepClick({ globalReadOnly: false, progressStep: 3, targetStep: 3 })).toBe(false);
  });
});
