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

describe("taskLibrary", () => {
  describe("access control", () => {
    it("should deny access to non-admin users for list", async () => {
      const { ctx } = createNonAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.taskLibrary.list()).rejects.toThrow("Acesso restrito a administradores");
    });

    it("should deny access to non-admin users for create", async () => {
      const { ctx } = createNonAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.taskLibrary.create({
          competencia: "Test",
          nome: "Test Task",
        })
      ).rejects.toThrow("Acesso restrito a administradores");
    });

    it("should deny access to non-admin users for update", async () => {
      const { ctx } = createNonAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.taskLibrary.update({
          id: 1,
          competencia: "Test",
          nome: "Test Task",
        })
      ).rejects.toThrow("Acesso restrito a administradores");
    });

    it("should deny access to non-admin users for toggleActive", async () => {
      const { ctx } = createNonAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.taskLibrary.toggleActive({ id: 1, isActive: 0 })
      ).rejects.toThrow("Acesso restrito a administradores");
    });
  });

  describe("input validation", () => {
    it("should reject create with empty competencia", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.taskLibrary.create({
          competencia: "",
          nome: "Test Task",
        })
      ).rejects.toThrow();
    });

    it("should reject create with empty nome", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.taskLibrary.create({
          competencia: "Test",
          nome: "",
        })
      ).rejects.toThrow();
    });

    it("should reject toggleActive with invalid isActive value", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.taskLibrary.toggleActive({ id: 1, isActive: 2 })
      ).rejects.toThrow();
    });
  });
});
