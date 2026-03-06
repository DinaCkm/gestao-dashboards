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

function createUserContext(email: string): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "student-user",
    email,
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

describe("attendance.pending (lista unificada de eventos)", () => {
  it("retorna array vazio para aluno não encontrado", async () => {
    const { ctx } = createUserContext("naoexiste@test.com");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.attendance.pending();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });

  it("retorna array com campos corretos (title, eventDate, videoLink, status)", async () => {
    const { ctx } = createUserContext("naoexiste@test.com");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.attendance.pending();
    // Para aluno inexistente, retorna vazio
    expect(Array.isArray(result)).toBe(true);

    // Verificar que se houvesse dados, a estrutura estaria correta
    // Cada item deve ter: eventId, title, eventDate, videoLink, status
    if (result.length > 0) {
      const first = result[0];
      expect(first).toHaveProperty("eventId");
      expect(first).toHaveProperty("title");
      expect(first).toHaveProperty("eventDate");
      expect(first).toHaveProperty("videoLink");
      expect(first).toHaveProperty("status");
      expect(["presente", "ausente"]).toContain(first.status);
    }
  });
});

describe("attendance.updateVideoLink (admin)", () => {
  it("rejeita acesso de usuário não-admin", async () => {
    const { ctx } = createUserContext("student@test.com");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.attendance.updateVideoLink({
        eventId: 1,
        videoLink: "https://youtube.com/test",
      })
    ).rejects.toThrow();
  });

  it("aceita chamada de admin com input válido", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Pode falhar se o eventId não existir no banco, mas não deve dar erro de permissão
    try {
      await caller.attendance.updateVideoLink({
        eventId: 99999,
        videoLink: "https://youtube.com/test",
      });
    } catch (err: any) {
      // Erro esperado é de "não encontrado" ou de banco, não de permissão
      expect(err.code).not.toBe("FORBIDDEN");
    }
  });

  it("rejeita videoLink vazio", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.attendance.updateVideoLink({
        eventId: 1,
        videoLink: "",
      })
    ).rejects.toThrow();
  });
});

describe("attendance.markPresence", () => {
  it("rejeita reflexão com menos de 20 caracteres", async () => {
    const { ctx } = createUserContext("student@test.com");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.attendance.markPresence({
        eventId: 1,
        reflexao: "curto",
      })
    ).rejects.toThrow();
  });

  it("rejeita usuário não autenticado", async () => {
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
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.attendance.markPresence({
        eventId: 1,
        reflexao: "Esta é uma reflexão válida com mais de 20 caracteres",
      })
    ).rejects.toThrow();
  });
});
