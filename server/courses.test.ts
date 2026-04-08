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

function createNonAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
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

describe("courses", () => {
  describe("access control", () => {
    it("should deny access to non-admin users for list (admin)", async () => {
      const { ctx } = createNonAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.courses.list()).rejects.toThrow("Acesso restrito a administradores");
    });

    it("should allow non-admin users to access listActive", async () => {
      const { ctx } = createNonAdminContext();
      const caller = appRouter.createCaller(ctx);

      // listActive uses protectedProcedure, so regular users can access it
      const result = await caller.courses.listActive();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should deny access to non-admin users for create", async () => {
      const { ctx } = createNonAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.courses.create({
          titulo: "Test Course",
        })
      ).rejects.toThrow("Acesso restrito a administradores");
    });

    it("should deny access to non-admin users for update", async () => {
      const { ctx } = createNonAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.courses.update({
          id: 1,
          titulo: "Test Course",
        })
      ).rejects.toThrow("Acesso restrito a administradores");
    });

    it("should deny access to non-admin users for toggleActive", async () => {
      const { ctx } = createNonAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.courses.toggleActive({ id: 1, isActive: 0 })
      ).rejects.toThrow("Acesso restrito a administradores");
    });

    it("should deny access to non-admin users for delete", async () => {
      const { ctx } = createNonAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.courses.delete({ id: 1 })
      ).rejects.toThrow("Acesso restrito a administradores");
    });
  });

  describe("input validation", () => {
    it("should reject create with empty titulo", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.courses.create({
          titulo: "",
        })
      ).rejects.toThrow();
    });

    it("should reject update with empty titulo", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.courses.update({
          id: 1,
          titulo: "",
        })
      ).rejects.toThrow();
    });

    it("should reject toggleActive with invalid isActive value", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.courses.toggleActive({ id: 1, isActive: 5 })
      ).rejects.toThrow();
    });

    it("should reject create with invalid tipo", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.courses.create({
          titulo: "Test",
          tipo: "invalid_type" as any,
        })
      ).rejects.toThrow();
    });

    it("should reject create with invalid nivel", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.courses.create({
          titulo: "Test",
          nivel: "expert" as any,
        })
      ).rejects.toThrow();
    });
  });

  describe("admin operations", () => {
    it("should allow admin to list courses", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.courses.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should accept valid create input with all fields", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // This tests that the input validation passes for a complete course
      // The actual DB insert may fail in test env but the validation should pass
      try {
        const result = await caller.courses.create({
          titulo: "Liderança Situacional",
          descricao: "Aprenda os fundamentos da liderança situacional",
          categoria: "Liderança",
          competenciaRelacionada: "Liderança",
          tipo: "gratuito",
          youtubeUrl: "https://www.youtube.com/watch?v=test123",
          duracao: "1h30",
          instrutor: "João Silva",
          nivel: "intermediario",
          ordem: 1,
        });
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("success", true);
      } catch (e: any) {
        // If DB is not available in test, that's OK - we validated the input
        if (!e.message?.includes("Database not available")) {
          throw e;
        }
      }
    });
  });
});
