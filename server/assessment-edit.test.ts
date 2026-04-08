import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createMentorContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "mentor-user",
    email: "mentor@example.com",
    name: "Mentor User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("assessment.atualizar", () => {
  it("should reject invalid macro dates (inicio >= termino)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.assessment.atualizar({
        pdiId: 999999,
        macroInicio: "2026-06-01",
        macroTermino: "2026-01-01",
      })
    ).rejects.toThrow(/anterior/);
  });

  it("should accept valid input schema for atualizar", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // This will fail because pdiId 999999 doesn't exist, but it validates the schema
    try {
      await caller.assessment.atualizar({
        pdiId: 999999,
        trilhaId: 1,
        consultorId: null,
        turmaId: null,
        programId: null,
        macroInicio: "2025-01-01",
        macroTermino: "2026-12-31",
        observacoes: "Teste de observação",
      });
    } catch (e: any) {
      // We expect a NOT_FOUND or similar error, not a validation error
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("assessment.adicionarCompetencia", () => {
  it("should accept valid input schema for adding competencia", async () => {
    const ctx = createMentorContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.assessment.adicionarCompetencia({
        assessmentPdiId: 999999,
        competenciaId: 1,
        peso: "obrigatoria",
        microInicio: "2025-05-01",
        microTermino: "2025-08-01",
      });
    } catch (e: any) {
      // Expect DB error, not validation error
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("should validate peso enum values", async () => {
    const ctx = createMentorContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.assessment.adicionarCompetencia({
        assessmentPdiId: 999999,
        competenciaId: 1,
        peso: "invalido" as any,
      })
    ).rejects.toThrow();
  });
});

describe("assessment.removerCompetencia", () => {
  it("should accept valid input schema for removing competencia", async () => {
    const ctx = createMentorContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.assessment.removerCompetencia({
        assessmentCompetenciaId: 999999,
      });
    } catch (e: any) {
      // Expect DB error, not validation error
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("assessment.excluir", () => {
  it("should accept valid input schema for deleting assessment", async () => {
    const ctx = createMentorContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.assessment.excluir({
        pdiId: 999999,
      });
    } catch (e: any) {
      // Expect DB error, not validation error
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});
