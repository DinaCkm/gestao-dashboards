import { describe, it, expect } from "vitest";
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

function createUnauthenticatedContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
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

const caller = (ctx: TrpcContext) => appRouter.createCaller(ctx);

describe("Activities Router", () => {
  // ---- LIST ----
  describe("activities.list", () => {
    it("should list activities for admin", async () => {
      const { ctx } = createAdminContext();
      const result = await caller(ctx).activities.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should list only active activities for non-admin", async () => {
      const { ctx } = createNonAdminContext();
      const result = await caller(ctx).activities.list();
      expect(Array.isArray(result)).toBe(true);
      // Non-admin should only see active activities
      for (const activity of result) {
        expect(activity.isActive).toBe(1);
      }
    });

    it("should reject unauthenticated users", async () => {
      const { ctx } = createUnauthenticatedContext();
      await expect(caller(ctx).activities.list()).rejects.toThrow();
    });
  });

  // ---- CREATE ----
  describe("activities.create", () => {
    it("should create an activity as admin", async () => {
      const { ctx } = createAdminContext();
      const result = await caller(ctx).activities.create({
        titulo: "Workshop de Teste Vitest",
        descricao: "Descrição do workshop de teste",
        tipo: "workshop",
        modalidade: "presencial",
        local: "Sala 101",
        vagas: 30,
        instrutor: "Prof. Teste",
      });
      expect(result).toHaveProperty("id");
      expect(typeof result.id).toBe("number");
    });

    it("should reject creation by non-admin", async () => {
      const { ctx } = createNonAdminContext();
      await expect(
        caller(ctx).activities.create({
          titulo: "Tentativa não autorizada",
          tipo: "workshop",
          modalidade: "online",
        })
      ).rejects.toThrow();
    });

    it("should reject creation with empty title", async () => {
      const { ctx } = createAdminContext();
      await expect(
        caller(ctx).activities.create({
          titulo: "",
          tipo: "workshop",
          modalidade: "presencial",
        })
      ).rejects.toThrow();
    });

    it("should create activity with all types", async () => {
      const { ctx } = createAdminContext();
      const tipos = ["workshop", "treinamento", "palestra", "evento", "outro"] as const;
      for (const tipo of tipos) {
        const result = await caller(ctx).activities.create({
          titulo: `Atividade tipo ${tipo}`,
          tipo,
          modalidade: "presencial",
        });
        expect(result).toHaveProperty("id");
      }
    });

    it("should create activity with all modalidades", async () => {
      const { ctx } = createAdminContext();
      const modalidades = ["presencial", "online", "hibrido"] as const;
      for (const modalidade of modalidades) {
        const result = await caller(ctx).activities.create({
          titulo: `Atividade ${modalidade}`,
          tipo: "workshop",
          modalidade,
        });
        expect(result).toHaveProperty("id");
      }
    });
  });

  // ---- UPDATE ----
  describe("activities.update", () => {
    it("should update an activity as admin", async () => {
      const { ctx } = createAdminContext();
      // Create first
      const created = await caller(ctx).activities.create({
        titulo: "Para Atualizar",
        tipo: "treinamento",
        modalidade: "online",
      });
      // Update
      const result = await caller(ctx).activities.update({
        id: created.id,
        titulo: "Atualizado com Sucesso",
        local: "Nova Sala",
      });
      expect(result.success).toBe(true);
    });

    it("should reject update by non-admin", async () => {
      const { ctx: adminCtx } = createAdminContext();
      const { ctx: userCtx } = createNonAdminContext();
      const created = await caller(adminCtx).activities.create({
        titulo: "Atividade para testar update",
        tipo: "palestra",
        modalidade: "presencial",
      });
      await expect(
        caller(userCtx).activities.update({ id: created.id, titulo: "Hack" })
      ).rejects.toThrow();
    });
  });

  // ---- TOGGLE ACTIVE ----
  describe("activities.toggleActive", () => {
    it("should toggle activity active status", async () => {
      const { ctx } = createAdminContext();
      const created = await caller(ctx).activities.create({
        titulo: "Para Toggle",
        tipo: "evento",
        modalidade: "hibrido",
      });
      // Deactivate
      const result = await caller(ctx).activities.toggleActive({ id: created.id, isActive: 0 });
      expect(result.success).toBe(true);
      // Reactivate
      const result2 = await caller(ctx).activities.toggleActive({ id: created.id, isActive: 1 });
      expect(result2.success).toBe(true);
    });
  });

  // ---- DELETE ----
  describe("activities.delete", () => {
    it("should delete an activity as admin", async () => {
      const { ctx } = createAdminContext();
      const created = await caller(ctx).activities.create({
        titulo: "Para Deletar",
        tipo: "outro",
        modalidade: "presencial",
      });
      const result = await caller(ctx).activities.delete({ id: created.id });
      expect(result.success).toBe(true);
    });

    it("should reject delete by non-admin", async () => {
      const { ctx: adminCtx } = createAdminContext();
      const { ctx: userCtx } = createNonAdminContext();
      const created = await caller(adminCtx).activities.create({
        titulo: "Não pode deletar",
        tipo: "workshop",
        modalidade: "online",
      });
      await expect(
        caller(userCtx).activities.delete({ id: created.id })
      ).rejects.toThrow();
    });
  });

  // ---- REGISTRATION ----
  describe("activities.register", () => {
    it("should register a user for an activity", async () => {
      const { ctx: adminCtx } = createAdminContext();
      const { ctx: userCtx } = createNonAdminContext();
      const created = await caller(adminCtx).activities.create({
        titulo: "Atividade para Inscrição",
        tipo: "workshop",
        modalidade: "presencial",
        vagas: 10,
      });
      const result = await caller(userCtx).activities.register({ activityId: created.id });
      expect(result).toHaveProperty("id");
    });

    it("should prevent duplicate registration", async () => {
      const { ctx: adminCtx } = createAdminContext();
      const { ctx: userCtx } = createNonAdminContext();
      const created = await caller(adminCtx).activities.create({
        titulo: "Sem Duplicata",
        tipo: "treinamento",
        modalidade: "online",
        vagas: 10,
      });
      await caller(userCtx).activities.register({ activityId: created.id });
      await expect(
        caller(userCtx).activities.register({ activityId: created.id })
      ).rejects.toThrow();
    });
  });

  // ---- UNREGISTER ----
  describe("activities.unregister", () => {
    it("should unregister a user from an activity", async () => {
      const { ctx: adminCtx } = createAdminContext();
      const { ctx: userCtx } = createNonAdminContext();
      const created = await caller(adminCtx).activities.create({
        titulo: "Para Cancelar Inscrição",
        tipo: "palestra",
        modalidade: "presencial",
      });
      await caller(userCtx).activities.register({ activityId: created.id });
      const result = await caller(userCtx).activities.unregister({ activityId: created.id });
      expect(result.success).toBe(true);
    });
  });
});
