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

    it("each student has the expected shape with steps object", async () => {
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

        // Check steps object has all 6 step keys
        expect(student.steps).toHaveProperty("conviteEnviado");
        expect(student.steps).toHaveProperty("cadastroPreenchido");
        expect(student.steps).toHaveProperty("testeRealizado");
        expect(student.steps).toHaveProperty("mentoriaAgendada");
        expect(student.steps).toHaveProperty("pdiPublicado");
        expect(student.steps).toHaveProperty("termoAssinado");

        // totalSteps should always be 6
        expect(student.totalSteps).toBe(6);

        // completedSteps should be between 0 and 6
        expect(student.completedSteps).toBeGreaterThanOrEqual(0);
        expect(student.completedSteps).toBeLessThanOrEqual(6);
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
