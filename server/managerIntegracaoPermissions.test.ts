import { describe, expect, it } from "vitest";
import {
  buildManagerIntegracaoPermissions,
  mergeGeneralManagerPermissionsPreservingIntegracao,
  parseManagerIntegracaoPermissions,
  replaceIntegracaoPermissions,
} from "./managerIntegracaoPermissions";

describe("managerIntegracaoPermissions", () => {
  it("interpreta configuração independente com empresa e escopo gestor", () => {
    const parsed = parseManagerIntegracaoPermissions([
      "scope:manager:special",
      "/dashboard/gestor",
      "/gestor/integracao",
      "scope:integracao:program:42",
      "scope:integracao:mode:gestor",
    ]);

    expect(parsed).toEqual({
      enabled: true,
      programId: 42,
      mode: "gestor",
      processIds: [],
      legacyScopeAll: false,
    });
  });

  it("mantém compatibilidade com scope:integracao:all legado", () => {
    const parsed = parseManagerIntegracaoPermissions([
      "scope:manager:special",
      "/gestor/integracao",
      "scope:integracao:all",
    ]);

    expect(parsed.enabled).toBe(true);
    expect(parsed.programId).toBeNull();
    expect(parsed.mode).toBe("all");
    expect(parsed.legacyScopeAll).toBe(true);
  });

  it("gera seleção manual por IDs técnicos únicos e ordenados", () => {
    expect(buildManagerIntegracaoPermissions({
      enabled: true,
      programId: 99,
      mode: "manual",
      processIds: [8, 3, 8, 5],
    })).toEqual([
      "/gestor/integracao",
      "scope:integracao:program:99",
      "scope:integracao:mode:manual",
      "scope:integracao:process:3",
      "scope:integracao:process:5",
      "scope:integracao:process:8",
    ]);
  });

  it("troca somente tokens da Integração e preserva acessos gerais", () => {
    const result = replaceIntegracaoPermissions(
      [
        "scope:manager:special",
        "/dashboard/gestor",
        "/relatorios",
        "/gestor/integracao",
        "scope:integracao:all",
        "scope:integracao:program:17",
        "scope:integracao:mode:all",
      ],
      {
        enabled: true,
        programId: 23,
        mode: "gestor",
      },
    );

    expect(result).toContain("scope:manager:special");
    expect(result).toContain("/dashboard/gestor");
    expect(result).toContain("/relatorios");
    expect(result).toContain("/gestor/integracao");
    expect(result).toContain("scope:integracao:program:23");
    expect(result).toContain("scope:integracao:mode:gestor");
    expect(result).not.toContain("scope:integracao:program:17");
    expect(result).not.toContain("scope:integracao:all");
  });

  it("alterar menus gerais preserva configuração independente da Integração", () => {
    const result = mergeGeneralManagerPermissionsPreservingIntegracao(
      [
        "scope:manager:special",
        "/dashboard/gestor",
        "/gestor/integracao",
        "scope:integracao:program:23",
        "scope:integracao:mode:manual",
        "scope:integracao:process:101",
        "scope:integracao:process:102",
      ],
      [
        "scope:manager:special",
        "/relatorios",
      ],
    );

    expect(result).toEqual([
      "scope:manager:special",
      "/relatorios",
      "/gestor/integracao",
      "scope:integracao:program:23",
      "scope:integracao:mode:manual",
      "scope:integracao:process:101",
      "scope:integracao:process:102",
    ]);
  });

  it("configuração antiga continua obedecendo o salvamento histórico até migração explícita", () => {
    const result = mergeGeneralManagerPermissionsPreservingIntegracao(
      [
        "scope:manager:special",
        "/gestor/integracao",
        "scope:integracao:all",
      ],
      ["/dashboard/gestor"],
    );

    expect(result).toEqual(["/dashboard/gestor"]);
  });

  it("desabilitar Integração remove somente seus tokens", () => {
    const result = replaceIntegracaoPermissions(
      [
        "scope:manager:special",
        "/dashboard/gestor",
        "/gestor/integracao",
        "scope:integracao:program:23",
        "scope:integracao:mode:all",
        "scope:integracao:all",
      ],
      {
        enabled: false,
        programId: null,
        mode: "gestor",
      },
    );

    expect(result).toEqual([
      "scope:manager:special",
      "/dashboard/gestor",
    ]);
  });
});
