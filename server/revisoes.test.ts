import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
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

describe("system.notifyOwner permission", () => {
  it("should allow admin to call notifyOwner", async () => {
    const ctx = createContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);
    
    // This should not throw FORBIDDEN - it may fail due to missing env but should not be auth error
    try {
      await caller.system.notifyOwner({ title: "Test", content: "Test content" });
    } catch (error: any) {
      // Should NOT be FORBIDDEN since we changed from adminProcedure to protectedProcedure
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });

  it("should allow manager to call notifyOwner (was previously blocked)", async () => {
    const ctx = createContext({ role: "manager" });
    const caller = appRouter.createCaller(ctx);
    
    try {
      await caller.system.notifyOwner({ title: "Reunião", content: "Gestor solicita reunião" });
    } catch (error: any) {
      // Should NOT be FORBIDDEN anymore
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });

  it("should allow regular user to call notifyOwner", async () => {
    const ctx = createContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    
    try {
      await caller.system.notifyOwner({ title: "Contato", content: "Aluno solicita contato" });
    } catch (error: any) {
      // Should NOT be FORBIDDEN
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });

  it("should reject unauthenticated users", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.system.notifyOwner({ title: "Test", content: "Test" })
    ).rejects.toThrow();
  });
});

describe("onboarding.listarRevisoes", () => {
  it("should require manager role", async () => {
    const ctx = createContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.onboarding.listarRevisoes()
    ).rejects.toThrow();
  });

  it("should allow admin to list revisoes", async () => {
    const ctx = createContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);
    
    // Should not throw auth error
    try {
      const result = await caller.onboarding.listarRevisoes();
      expect(Array.isArray(result)).toBe(true);
    } catch (error: any) {
      // May fail due to DB but should not be auth error
      expect(error.code).not.toBe("FORBIDDEN");
      expect(error.code).not.toBe("UNAUTHORIZED");
    }
  });

  it("should allow manager to list revisoes", async () => {
    const ctx = createContext({ role: "manager" });
    const caller = appRouter.createCaller(ctx);
    
    try {
      const result = await caller.onboarding.listarRevisoes();
      expect(Array.isArray(result)).toBe(true);
    } catch (error: any) {
      expect(error.code).not.toBe("FORBIDDEN");
      expect(error.code).not.toBe("UNAUTHORIZED");
    }
  });
});

describe("onboarding.contarRevisoesPendentes", () => {
  it("should allow admin to count pending revisoes", async () => {
    const ctx = createContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);
    
    try {
      const result = await caller.onboarding.contarRevisoesPendentes();
      expect(result).toHaveProperty("count");
      expect(typeof result.count).toBe("number");
    } catch (error: any) {
      expect(error.code).not.toBe("FORBIDDEN");
      expect(error.code).not.toBe("UNAUTHORIZED");
    }
  });
});
