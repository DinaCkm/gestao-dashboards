import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
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

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createStudentContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "student-user",
    email: "student@example.com",
    name: "Student User",
    loginMethod: "manus",
    role: "user",
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
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("onboardingTracking", () => {
  describe("onboardingTracking.list", () => {
    it("returns an array when called by admin", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.onboardingTracking.list();

      expect(Array.isArray(result)).toBe(true);
    });

    it("each student has the expected shape with 5-step model (no PDI students)", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.onboardingTracking.list();

      if (result.length > 0) {
        const student = result[0];
        // Check required fields exist
        expect(student).toHaveProperty("alunoId");
        expect(student).toHaveProperty("name");
        expect(student).toHaveProperty("email");
        expect(student).toHaveProperty("steps");
        expect(student).toHaveProperty("completedSteps");
        expect(student).toHaveProperty("totalSteps");

        // Check steps object has all 5 step keys (no pdiPublicado or termoAssinado)
        expect(student.steps).toHaveProperty("conviteEnviado");
        expect(student.steps).toHaveProperty("cadastroPreenchido");
        expect(student.steps).toHaveProperty("testeRealizado");
        expect(student.steps).toHaveProperty("mentoriaAgendada");
        expect(student.steps).toHaveProperty("aceiteOnboarding");

        // Should NOT have pdiPublicado or termoAssinado (students with PDI are excluded)
        expect(student.steps).not.toHaveProperty("pdiPublicado");
        expect(student.steps).not.toHaveProperty("termoAssinado");

        // totalSteps should always be 5
        expect(student.totalSteps).toBe(5);

        // completedSteps should be between 0 and 5
        expect(student.completedSteps).toBeGreaterThanOrEqual(0);
        expect(student.completedSteps).toBeLessThanOrEqual(5);
      }
    });

    it("rejects non-admin users", async () => {
      const { ctx } = createStudentContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.onboardingTracking.list()).rejects.toThrow();
    });

    it("accepts optional programId filter", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Should not throw when passing programId
      const result = await caller.onboardingTracking.list({ programId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe("cronOnboardingReminders", () => {
  it("exports verificarEEnviarLembretesOnboarding function", async () => {
    const cronModule = await import('./cronOnboardingReminders');
    expect(typeof cronModule.verificarEEnviarLembretesOnboarding).toBe('function');
  });

  it("exports iniciarCronOnboardingReminders function", async () => {
    const cronModule = await import('./cronOnboardingReminders');
    expect(typeof cronModule.iniciarCronOnboardingReminders).toBe('function');
  });

  it("verificarEEnviarLembretesOnboarding returns expected structure in dry run", async () => {
    const { verificarEEnviarLembretesOnboarding } = await import('./cronOnboardingReminders');
    const result = await verificarEEnviarLembretesOnboarding({ dryRun: true });

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('totalAlunos');
    expect(result).toHaveProperty('totalLembretes');
    expect(result).toHaveProperty('emailsEnviados');
    expect(result).toHaveProperty('jaEnviadosIgnorados');
    expect(result).toHaveProperty('lembretes');
    expect(Array.isArray(result.lembretes)).toBe(true);
    expect(result.success).toBe(true);
    // In dry run, no emails should be sent
    expect(result.emailsEnviados).toBe(0);
  });

  it("each reminder item has the expected shape", async () => {
    const { verificarEEnviarLembretesOnboarding } = await import('./cronOnboardingReminders');
    const result = await verificarEEnviarLembretesOnboarding({ dryRun: true });

    if (result.lembretes.length > 0) {
      const lembrete = result.lembretes[0];
      expect(lembrete).toHaveProperty('alunoId');
      expect(lembrete).toHaveProperty('alunoName');
      expect(lembrete).toHaveProperty('alunoEmail');
      expect(lembrete).toHaveProperty('etapaPendente');
      expect(lembrete).toHaveProperty('emailEnviado');
      // In dry run, emailEnviado should be false
      expect(lembrete.emailEnviado).toBe(false);
    }
  });
});
