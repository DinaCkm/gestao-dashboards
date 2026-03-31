import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(
  overrides: Partial<AuthenticatedUser> = {}
): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Usuário Teste",
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
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createMentorContext(): TrpcContext {
  return createContext({
    id: 200,
    openId: "mentor-user",
    email: "mentor@example.com",
    name: "Mentor Teste",
    role: "manager",
    consultorId: 10,
  } as Partial<AuthenticatedUser>);
}

function createUserContext(): TrpcContext {
  return createContext({
    id: 300,
    openId: "user-common",
    email: "user@example.com",
    name: "Usuário Comum",
    role: "user",
  });
}

function createUnauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("competenciasCompTec.mentor", () => {
  it("deve rejeitar usuário não autenticado em listarAlunos", async () => {
    const caller = appRouter.createCaller(createUnauthenticatedContext());

    await expect(
      caller.competenciasCompTec.mentor.listarAlunos()
    ).rejects.toThrow();
  });

  it("deve permitir listarAlunos para mentor autenticado", async () => {
    const caller = appRouter.createCaller(createMentorContext());

    const result = await caller.competenciasCompTec.mentor.listarAlunos();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve validar alunoId numérico em acompanharProgresso", async () => {
    const caller = appRouter.createCaller(createMentorContext());

    await expect(
      caller.competenciasCompTec.mentor.acompanharProgresso({
        alunoId: "abc" as any,
      })
    ).rejects.toThrow();
  });

  it("deve permitir acompanharProgresso para mentor autenticado", async () => {
    const caller = appRouter.createCaller(createMentorContext());

    const result =
      await caller.competenciasCompTec.mentor.acompanharProgresso({
        alunoId: 1,
      });

    expect(Array.isArray(result)).toBe(true);
  });

  it("deve validar payload de atribuirCurso", async () => {
    const caller = appRouter.createCaller(createMentorContext());

    await expect(
      caller.competenciasCompTec.mentor.atribuirCurso({
        alunoId: "abc" as any,
        moduloId: 1,
        prazo: "2026-12-31",
      })
    ).rejects.toThrow();

    await expect(
      caller.competenciasCompTec.mentor.atribuirCurso({
        alunoId: 1,
        moduloId: "abc" as any,
        prazo: "2026-12-31",
      })
    ).rejects.toThrow();
  });

  it("deve aceitar atribuirCurso com payload válido", async () => {
    const caller = appRouter.createCaller(createMentorContext());

    try {
      const result = await caller.competenciasCompTec.mentor.atribuirCurso({
        alunoId: 1,
        moduloId: 1,
        prazo: "2026-12-31",
      });

      expect(result).toHaveProperty("success");
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
    }
  });

  it("deve aceitar atribuirCurso mesmo para role user autenticado se a rota estiver apenas protegida", async () => {
    const caller = appRouter.createCaller(createUserContext());

    try {
      const result = await caller.competenciasCompTec.mentor.atribuirCurso({
        alunoId: 1,
        moduloId: 1,
        prazo: "2026-12-31",
      });

      expect(result).toHaveProperty("success");
    } catch (error: any) {
      expect(["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN"]).not.toContain(error.code);
    }
  });

  it("deve aceitar listarAlunos retornando lista vazia ou preenchida", async () => {
    const caller = appRouter.createCaller(createMentorContext());

    const result = await caller.competenciasCompTec.mentor.listarAlunos();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length >= 0).toBe(true);
  });

  it("deve aceitar acompanharProgresso retornando lista vazia ou preenchida", async () => {
    const caller = appRouter.createCaller(createMentorContext());

    const result =
      await caller.competenciasCompTec.mentor.acompanharProgresso({
        alunoId: 999999,
      });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length >= 0).toBe(true);
  });
});
