import { describe, expect, it, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Track test emails for cleanup
const createdTestEmails: string[] = [];

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

// Cleanup: delete test users by email pattern after all tests
afterAll(async () => {
  if (createdTestEmails.length > 0) {
    try {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const allUsers = await caller.admin.listAccessUsers();
      for (const user of allUsers) {
        if (createdTestEmails.includes(user.email)) {
          await caller.admin.toggleAccessUserStatus({ userId: user.id });
          // Actually delete by setting isActive to 0 (soft delete)
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  }
});

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

  it("returns error for invalid credentials", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.emailCpfLogin({
      email: "test@test.com",
      cpf: "123",
    });
    expect(result.success).toBe(false);
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
    const testEmail = `gestor.test.${ts}@example.com`;
    createdTestEmails.push(testEmail);
    const result = await caller.admin.createAccessUser({
      name: `Test Gestor ${ts}`,
      email: testEmail,
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
    const firstEmail = `first.${ts}@example.com`;
    createdTestEmails.push(firstEmail);
    
    // First creation should succeed
    await caller.admin.createAccessUser({
      name: `First User ${ts}`,
      email: firstEmail,
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

describe("admin.accessUsers - programName field", () => {
  it("returns programName field in access users list", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.listAccessUsers();
    expect(Array.isArray(result)).toBe(true);
    // All users should have the programName field (may be null if no matching program)
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("programName");
    }
  });

  it("returns non-null programName for users with valid programId", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.listAccessUsers();
    // Find users whose programId matches a real program (16, 17, 18)
    const usersWithValidProgram = result.filter((u: any) => u.programId && [16, 17, 18].includes(u.programId));
    if (usersWithValidProgram.length > 0) {
      expect(usersWithValidProgram[0].programName).toBeTruthy();
    }
  });
});

describe("admin.editMentor", () => {
  it("updates mentor name and email", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const mentores = await caller.admin.listMentores();
    if (mentores.length > 0) {
      const mentor = mentores[0];
      const originalName = mentor.name;
      const originalEmail = mentor.email;
      
      // Update
      const result = await caller.admin.editMentor({
        consultorId: mentor.id,
        name: "Test Mentor Name",
        email: "test-mentor@example.com",
      });
      expect(result).toEqual({ success: true });
      
      // Verify
      const updated = await caller.admin.listMentores();
      const updatedMentor = updated.find((m: any) => m.id === mentor.id);
      expect(updatedMentor?.name).toBe("Test Mentor Name");
      expect(updatedMentor?.email).toBe("test-mentor@example.com");
      
      // Restore
      await caller.admin.editMentor({
        consultorId: mentor.id,
        name: originalName,
        email: originalEmail || undefined,
      });
    }
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
