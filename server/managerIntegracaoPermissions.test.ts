import { describe, expect, it } from "vitest";
import {
  buildManagerIntegracaoPermissions,
  mergeGeneralManagerPermissionsPreservingIntegracao,
  parseManagerIntegracaoPermissions,
  replaceIntegracaoPermissions,
} from "./managerIntegracaoPermissions";

describe("managerIntegracaoPermissions", () => {
  it("interpreta configuração independente com nível Gestor e escopo por vínculo de gestor", () => {
    const parsed = parseManagerIntegracaoPermissions([
      "scope:manager:special",
      "/dashboard/gestor",
      "/gestor/integracao",
      "scope:integracao:program:42",
      "scope:integracao:access:gestor",
      "scope:integracao:mode:gestor",
    ]);

    expect(parsed).toEqual({
      enabled: true,
      programId: 42,
      accessLevel: "gestor",
      mode: "gestor",
      processIds: [],
      legacyScopeAll: false,
      legacyUgpRestrita: false,
      demoOnly: false,
      ugpResponsible: false,
    });
  });

  it("mantém compatibilidade com scope all legado sem reduzir acesso histórico", () => {
    const parsed = parseManagerIntegracaoPermissions([
      "scope:manager:special",
      "/gestor/integracao",
      "scope:integracao:all",
    ]);

    expect(parsed.enabled).toBe(true);
    expect(parsed.programId).toBeNull();
    expect(parsed.accessLevel).toBe("ugp");
    expect(parsed.mode).toBe("all");
    expect(parsed.legacyScopeAll).toBe(true);
  });

  it("converte UGP restrita legada para nível UGP + escopo manual", () => {
    const parsed = parseManagerIntegracaoPermissions([
      "/gestor/integracao",
      "scope:integracao:program:17",
      "scope:integracao:mode:ugp_restrita",
      "scope:integracao:demo-only",
      "scope:integracao:process:301",
      "scope:integracao:process:302",
    ]);

    expect(parsed.accessLevel).toBe("ugp");
    expect(parsed.mode).toBe("manual");
    expect(parsed.processIds).toEqual([301, 302]);
    expect(parsed.legacyUgpRestrita).toBe(true);
    expect(parsed.demoOnly).toBe(true);
  });

  it("gera seleção manual por IDs técnicos únicos e ordenados sem elevar o nível do Gestor", () => {
    expect(buildManagerIntegracaoPermissions({
      enabled: true,
      programId: 99,
      accessLevel: "gestor",
      mode: "manual",
      processIds: [8, 3, 8, 5],
    })).toEqual([
      "/gestor/integracao",
      "scope:integracao:program:99",
      "scope:integracao:access:gestor",
      "scope:integracao:mode:manual",
      "scope:integracao:process:3",
      "scope:integracao:process:5",
      "scope:integracao:process:8",
    ]);
  });

  it("mantém nível UGP mesmo quando a visualização é restrita a colaboradores selecionados", () => {
    const permissions = buildManagerIntegracaoPermissions({
      enabled: true,
      programId: 17,
      accessLevel: "ugp",
      mode: "manual",
      processIds: [303, 301, 302],
      demoOnly: true,
      ugpResponsible: true,
    });

    expect(permissions).toEqual([
      "/gestor/integracao",
      "scope:integracao:program:17",
      "scope:integracao:access:ugp",
      "scope:integracao:mode:manual",
      "scope:integracao:demo-only",
      "scope:integracao:ugp-responsavel",
      "scope:integracao:process:301",
      "scope:integracao:process:302",
      "scope:integracao:process:303",
    ]);

    expect(parseManagerIntegracaoPermissions(permissions)).toEqual({
      enabled: true,
      programId: 17,
      accessLevel: "ugp",
      mode: "manual",
      processIds: [301, 302, 303],
      legacyScopeAll: false,
      legacyUgpRestrita: false,
      demoOnly: true,
      ugpResponsible: true,
    });
  });

  it("não permite declarar responsável UGP com nível Gestor", () => {
    expect(() => buildManagerIntegracaoPermissions({
      enabled: true,
      programId: 17,
      accessLevel: "gestor",
      mode: "all",
      ugpResponsible: true,
    })).toThrow("responsável UGP/RH");
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
        accessLevel: "gestor",
        mode: "gestor",
      },
    );

    expect(result).toContain("scope:manager:special");
    expect(result).toContain("/dashboard/gestor");
    expect(result).toContain("/relatorios");
    expect(result).toContain("/gestor/integracao");
    expect(result).toContain("scope:integracao:program:23");
    expect(result).toContain("scope:integracao:access:gestor");
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
        "scope:integracao:access:ugp",
        "scope:integracao:mode:manual",
        "scope:integracao:ugp-responsavel",
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
      "scope:integracao:access:ugp",
      "scope:integracao:mode:manual",
      "scope:integracao:ugp-responsavel",
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
        "scope:integracao:access:ugp",
        "scope:integracao:mode:all",
        "scope:integracao:all",
        "scope:integracao:ugp-responsavel",
      ],
      {
        enabled: false,
        programId: null,
        accessLevel: "gestor",
        mode: "gestor",
      },
    );

    expect(result).toEqual([
      "scope:manager:special",
      "/dashboard/gestor",
    ]);
  });
});
