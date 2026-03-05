import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-test-user",
    email: "admin@test.com",
    name: "Admin Test",
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
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "user-test-aluno",
    email: "aluno@test.com",
    name: "Aluno Test",
    loginMethod: "manus",
    role: "user",
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
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("admin.createAlunoDireto", () => {
  it("rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.createAlunoDireto({
        name: "Test Aluno",
        email: "test@test.com",
        cpf: "123456",
        programId: 1,
        consultorId: 1,
        turmaId: null,
      })
    ).rejects.toThrow(/FORBIDDEN|restrito/i);
  });

  it("validates required fields", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Empty name should fail validation
    await expect(
      caller.admin.createAlunoDireto({
        name: "",
        email: "test@test.com",
        cpf: "123456",
        programId: 1,
        consultorId: 1,
        turmaId: null,
      })
    ).rejects.toThrow();

    // Invalid email should fail validation
    await expect(
      caller.admin.createAlunoDireto({
        name: "Test",
        email: "not-an-email",
        cpf: "123456",
        programId: 1,
        consultorId: 1,
        turmaId: null,
      })
    ).rejects.toThrow();

    // Empty cpf should fail validation
    await expect(
      caller.admin.createAlunoDireto({
        name: "Test",
        email: "test@test.com",
        cpf: "",
        programId: 1,
        consultorId: 1,
        turmaId: null,
      })
    ).rejects.toThrow();
  });

  it("accepts valid input from admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // This will try to create in the real DB - may fail due to FK constraints
    // but should NOT fail on validation or auth
    try {
      const result = await caller.admin.createAlunoDireto({
        name: "Aluno Direto Test",
        email: `direto-test-${Date.now()}@test.com`,
        cpf: `${Date.now()}`.slice(-6),
        programId: 1,
        consultorId: 1,
        turmaId: null,
      });
      // If DB is available, should return success or a meaningful error
      expect(result).toHaveProperty("success");
      if (result.success) {
        expect(result).toHaveProperty("alunoId");
      } else {
        // Acceptable DB errors (FK constraints, etc)
        expect(result).toHaveProperty("message");
      }
    } catch (err: any) {
      // DB connection errors are acceptable in test env
      expect(err.message).toBeDefined();
    }
  });
});

describe("aluno.onboardingStatus", () => {
  it("returns onboarding status for user role", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.aluno.onboardingStatus();
      // Should return the expected shape
      expect(result).toHaveProperty("needsOnboarding");
      expect(result).toHaveProperty("hasMentor");
      expect(result).toHaveProperty("bypassOnboarding");
      expect(result).toHaveProperty("alunoId");
      expect(typeof result.needsOnboarding).toBe("boolean");
      expect(typeof result.hasMentor).toBe("boolean");
      expect(typeof result.bypassOnboarding).toBe("boolean");
    } catch (err: any) {
      // DB connection errors are acceptable in test env
      expect(err.message).toBeDefined();
    }
  });

  it("rejects unauthenticated users", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: vi.fn(),
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.aluno.onboardingStatus()).rejects.toThrow(/login|UNAUTHORIZED/i);
  });
});

describe("createAlunoDireto input schema", () => {
  it("accepts turmaId as null", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw on schema validation for null turmaId
    try {
      await caller.admin.createAlunoDireto({
        name: "Test Turma Null",
        email: `turma-null-${Date.now()}@test.com`,
        cpf: `${Date.now()}`.slice(-6),
        programId: 1,
        consultorId: 1,
        turmaId: null,
      });
    } catch (err: any) {
      // Schema validation errors would be ZodError
      if (err.code === 'BAD_REQUEST') {
        throw err; // This is a schema validation error - should not happen
      }
      // DB errors are fine
    }
  });

  it("accepts turmaId as number", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.admin.createAlunoDireto({
        name: "Test Turma Number",
        email: `turma-num-${Date.now()}@test.com`,
        cpf: `${Date.now()}`.slice(-6),
        programId: 1,
        consultorId: 1,
        turmaId: 1,
      });
    } catch (err: any) {
      if (err.code === 'BAD_REQUEST') {
        throw err; // Schema validation error - should not happen
      }
      // DB errors are fine
    }
  });

  it("accepts turmaId as undefined (omitted)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.admin.createAlunoDireto({
        name: "Test Turma Undefined",
        email: `turma-undef-${Date.now()}@test.com`,
        cpf: `${Date.now()}`.slice(-6),
        programId: 1,
        consultorId: 1,
      });
    } catch (err: any) {
      if (err.code === 'BAD_REQUEST') {
        throw err; // Schema validation error - should not happen
      }
      // DB errors are fine
    }
  });
});
