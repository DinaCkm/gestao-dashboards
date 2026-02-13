import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext; cookies: Record<string, any>[] } {
  const cookies: Record<string, any>[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@test.com",
    name: "Admin User",
    loginMethod: "admin",
    role: "admin",
    cpf: null,
    programId: null,
    alunoId: null,
    consultorId: null,
    departmentId: null,
    passwordHash: null,
    isActive: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookies.push({ name, value, options });
      },
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx, cookies };
}

function createPublicContext(): { ctx: TrpcContext; cookies: Record<string, any>[] } {
  const cookies: Record<string, any>[] = [];
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookies.push({ name, value, options });
      },
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx, cookies };
}

function createManagerContext(programId: number): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "manager-user",
    email: "gestor@test.com",
    name: "Gestor SEBRAE TO",
    loginMethod: "emailcpf",
    role: "manager",
    cpf: "12345678900",
    programId,
    alunoId: null,
    consultorId: null,
    departmentId: null,
    passwordHash: null,
    isActive: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

describe("emailCpfLogin", () => {
  it("rejects login with invalid email/cpf combination", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.emailCpfLogin({
      email: "nonexistent@test.com",
      cpf: "00000000000",
    });
    expect(result.success).toBe(false);
    expect(result.message).toBeDefined();
  });

  it("requires valid email format", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.emailCpfLogin({
        email: "invalid-email",
        cpf: "12345678900",
      })
    ).rejects.toThrow();
  });

  it("requires minimum CPF length", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.emailCpfLogin({
        email: "test@test.com",
        cpf: "123",
      })
    ).rejects.toThrow();
  });
});

describe("admin.accessUsers", () => {
  it("admin can list access users", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.listAccessUsers();
    expect(Array.isArray(result)).toBe(true);
  });

  it("non-admin cannot list access users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.listAccessUsers()).rejects.toThrow();
  });

  it("admin can create an access user", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const ts = Date.now();
    const result = await caller.admin.createAccessUser({
      name: `Test Gestor ${ts}`,
      email: `gestor.test.${ts}@example.com`,
      cpf: `${ts}`.slice(-11).padStart(11, '9'),
      role: "manager",
      programId: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects duplicate CPF", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const ts = Date.now();
    const uniqueCpf = `${ts}`.slice(-11).padStart(11, '5');
    
    // First creation should succeed
    await caller.admin.createAccessUser({
      name: `First User ${ts}`,
      email: `first.${ts}@example.com`,
      cpf: uniqueCpf,
      role: "user",
      programId: 1,
    });

    // Second creation with same CPF should fail
    const result = await caller.admin.createAccessUser({
      name: `Second User ${ts}`,
      email: `second.${ts}@example.com`,
      cpf: uniqueCpf,
      role: "user",
      programId: 1,
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain("CPF");
  });
});

describe("manager access", () => {
  it("manager can access porEmpresa endpoint", async () => {
    const { ctx } = createManagerContext(1);
    const caller = appRouter.createCaller(ctx);
    // Manager should be able to call porEmpresa (it uses managerProcedure)
    // This will fail if the empresa doesn't exist, but it should not throw UNAUTHORIZED
    try {
      await caller.indicadores.porEmpresa({ empresa: "SEBRAE TO" });
    } catch (error: any) {
      // It should NOT be an UNAUTHORIZED error
      expect(error.code).not.toBe("UNAUTHORIZED");
    }
  });
});
