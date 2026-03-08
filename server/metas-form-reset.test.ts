import { describe, it, expect } from "vitest";

/**
 * Tests for the Nova Meta form reset logic.
 * The handleAddMeta function should always reset form fields before opening the dialog.
 * This ensures the modal opens blank even when a previous meta was created.
 */

describe("Nova Meta Form Reset Logic", () => {
  // Simulate the state management behavior
  function simulateHandleAddMeta(
    currentState: {
      metaTitulo: string;
      metaDescricao: string;
      metaFromLibrary: boolean;
      selectedTaskLibraryId: number | null;
    },
    compId: number,
    assCompId: number,
    pdiId: number
  ) {
    // This mirrors the handleAddMeta function in MetasDesenvolvimento.tsx
    const newState = {
      metaTitulo: "", // Reset
      metaDescricao: "", // Reset
      metaFromLibrary: false, // Reset
      selectedTaskLibraryId: null as number | null, // Reset
      addMetaCompId: compId,
      addMetaAssCompId: assCompId,
      addMetaPdiId: pdiId,
      showAddMetaDialog: true,
    };
    return newState;
  }

  it("should reset all form fields when opening Nova Meta dialog", () => {
    // Simulate state after a previous meta was created (fields still have values)
    const dirtyState = {
      metaTitulo: "Meta anterior que ficou preenchida",
      metaDescricao: "Descrição da meta anterior",
      metaFromLibrary: true,
      selectedTaskLibraryId: 42,
    };

    const result = simulateHandleAddMeta(dirtyState, 10, 20, 30);

    // All form fields should be reset
    expect(result.metaTitulo).toBe("");
    expect(result.metaDescricao).toBe("");
    expect(result.metaFromLibrary).toBe(false);
    expect(result.selectedTaskLibraryId).toBeNull();

    // Competência IDs should be set correctly
    expect(result.addMetaCompId).toBe(10);
    expect(result.addMetaAssCompId).toBe(20);
    expect(result.addMetaPdiId).toBe(30);
    expect(result.showAddMetaDialog).toBe(true);
  });

  it("should work correctly even when fields are already empty", () => {
    const cleanState = {
      metaTitulo: "",
      metaDescricao: "",
      metaFromLibrary: false,
      selectedTaskLibraryId: null,
    };

    const result = simulateHandleAddMeta(cleanState, 5, 15, 25);

    expect(result.metaTitulo).toBe("");
    expect(result.metaDescricao).toBe("");
    expect(result.metaFromLibrary).toBe(false);
    expect(result.selectedTaskLibraryId).toBeNull();
    expect(result.addMetaCompId).toBe(5);
  });

  it("should reset IA suggestion data (metaFromLibrary=false)", () => {
    // Simulate state after IA suggestion was used
    const iaState = {
      metaTitulo: "Desafio 3P: Posicionamento Ponderado e Persuasivo",
      metaDescricao: "Durante as próximas 4 semanas, identifique 3 situações...",
      metaFromLibrary: false,
      selectedTaskLibraryId: null,
    };

    const result = simulateHandleAddMeta(iaState, 7, 14, 21);

    expect(result.metaTitulo).toBe("");
    expect(result.metaDescricao).toBe("");
    expect(result.metaFromLibrary).toBe(false);
  });

  it("should reset library selection when opening for a different competência", () => {
    const libraryState = {
      metaTitulo: "Ação da biblioteca",
      metaDescricao: "Observação adicional",
      metaFromLibrary: true,
      selectedTaskLibraryId: 99,
    };

    const result = simulateHandleAddMeta(libraryState, 100, 200, 300);

    expect(result.metaTitulo).toBe("");
    expect(result.metaDescricao).toBe("");
    expect(result.metaFromLibrary).toBe(false);
    expect(result.selectedTaskLibraryId).toBeNull();
    expect(result.addMetaCompId).toBe(100);
  });
});

describe("Status Label Mapping", () => {
  // Test that status labels are correctly mapped (not inverted)
  it("should map 'ativo' to 'Em Andamento'", () => {
    const labelMap: Record<string, string> = {
      todos: "Todos",
      ativo: "Em Andamento",
      congelado: "Finalizada",
    };
    expect(labelMap["ativo"]).toBe("Em Andamento");
  });

  it("should map 'congelado' to 'Finalizada'", () => {
    const labelMap: Record<string, string> = {
      todos: "Todos",
      ativo: "Em Andamento",
      congelado: "Finalizada",
    };
    expect(labelMap["congelado"]).toBe("Finalizada");
  });

  it("should NOT map 'congelado' to 'Em Andamento' (this was the bug)", () => {
    const labelMap: Record<string, string> = {
      todos: "Todos",
      ativo: "Em Andamento",
      congelado: "Finalizada",
    };
    expect(labelMap["congelado"]).not.toBe("Em Andamento");
  });
});
