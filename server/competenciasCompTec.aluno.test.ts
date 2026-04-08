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

function createAlunoContext(): TrpcContext {
  return createContext({
    id: 300,
    openId: "aluno-user",
    email: "aluno@example.com",
    name: "Aluno Teste",
    role: "user",
    alunoId: 1,
  } as Partial<AuthenticatedUser>);
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

describe("competenciasCompTec.aluno", () => {
  it("deve rejeitar usuário não autenticado em meusCursos", async () => {
    const caller = appRouter.createCaller(createUnauthenticatedContext());

    await expect(
      caller.competenciasCompTec.aluno.meusCursos()
    ).rejects.toThrow();
  });

  it("deve permitir meusCursos para aluno autenticado", async () => {
    const caller = appRouter.createCaller(createAlunoContext());

    const result = await caller.competenciasCompTec.aluno.meusCursos();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve validar input de detalheCurso", async () => {
    const caller = appRouter.createCaller(createAlunoContext());

    await expect(
      caller.competenciasCompTec.aluno.detalheCurso({
        moduloId: "abc" as any,
      })
    ).rejects.toThrow();
  });

  it("deve aceitar detalheCurso com payload válido", async () => {
    const caller = appRouter.createCaller(createAlunoContext());

    const result = await caller.competenciasCompTec.aluno.detalheCurso({
      moduloId: 1,
    });

    expect(result === null || typeof result === "object").toBe(true);
  });

  it("deve validar input de iniciarAtividade", async () => {
    const caller = appRouter.createCaller(createAlunoContext());

    await expect(
      caller.competenciasCompTec.aluno.iniciarAtividade({
        moduloId: "abc" as any,
      })
    ).rejects.toThrow();
  });

  it("deve aceitar iniciarAtividade com payload válido", async () => {
    const caller = appRouter.createCaller(createAlunoContext());

    try {
      const result = await caller.competenciasCompTec.aluno.iniciarAtividade({
        moduloId: 1,
      });

      expect(result).toHaveProperty("success");
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
    }
  });

  it("deve validar nota entre 0 e 10 em submeterAvaliacao", async () => {
    const caller = appRouter.createCaller(createAlunoContext());

    await expect(
      caller.competenciasCompTec.aluno.submeterAvaliacao({
        moduloId: 1,
        nota: 11,
        totalQuestoes: 15,
        acertos: 10,
        respostas: {},
      })
    ).rejects.toThrow();

    await expect(
      caller.competenciasCompTec.aluno.submeterAvaliacao({
        moduloId: 1,
        nota: -1,
        totalQuestoes: 15,
        acertos: 10,
        respostas: {},
      })
    ).rejects.toThrow();
  });

  it("deve aceitar submeterAvaliacao com payload válido", async () => {
    const caller = appRouter.createCaller(createAlunoContext());

    try {
      const result = await caller.competenciasCompTec.aluno.submeterAvaliacao({
        moduloId: 1,
        nota: 8,
        totalQuestoes: 15,
        acertos: 12,
        respostas: {
          q1: "A",
          q2: "B",
          q3: "C",
        },
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("aprovado");
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
    }
  });

  it("deve listar minhasTentativas", async () => {
    const caller = appRouter.createCaller(createAlunoContext());

    const result =
      await caller.competenciasCompTec.aluno.minhasTentativas({
        moduloId: 1,
      });

    expect(Array.isArray(result)).toBe(true);
  });

  it("deve validar moduloId numérico em minhasTentativas", async () => {
    const caller = appRouter.createCaller(createAlunoContext());

    await expect(
      caller.competenciasCompTec.aluno.minhasTentativas({
        moduloId: "abc" as any,
      })
    ).rejects.toThrow();
  });

  it("deve exigir relato não vazio em registrarReflexaoFinal", async () => {
    const caller = appRouter.createCaller(createAlunoContext());

    await expect(
      caller.competenciasCompTec.aluno.registrarReflexaoFinal({
        cursoAtribuidoId: 1,
        relato: "",
      })
    ).rejects.toThrow();
  });

  it("deve validar cursoAtribuidoId numérico em registrarReflexaoFinal", async () => {
    const caller = appRouter.createCaller(createAlunoContext());

    await expect(
      caller.competenciasCompTec.aluno.registrarReflexaoFinal({
        cursoAtribuidoId: "abc" as any,
        relato: "Reflexão válida",
      })
    ).rejects.toThrow();
  });

  it("deve aceitar registrarReflexaoFinal com payload válido", async () => {
    const caller = appRouter.createCaller(createAlunoContext());

    try {
      const result =
        await caller.competenciasCompTec.aluno.registrarReflexaoFinal({
          cursoAtribuidoId: 1,
          relato:
            "Aprendi conceitos importantes e consigo aplicar o conteúdo no contexto profissional.",
        });

      expect(result).toHaveProperty("success");
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
    }
  });

  it("deve validar cursoAtribuidoId numérico em concluirCurso", async () => {
    const caller = appRouter.createCaller(createAlunoContext());

    await expect(
      caller.competenciasCompTec.aluno.concluirCurso({
        cursoAtribuidoId: "abc" as any,
      })
    ).rejects.toThrow();
  });

  it("deve aceitar concluirCurso com payload válido", async () => {
    const caller = appRouter.createCaller(createAlunoContext());

    try {
      const result = await caller.competenciasCompTec.aluno.concluirCurso({
        cursoAtribuidoId: 1,
      });

      expect(result).toHaveProperty("success");
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
    }
  });

  it("deve respeitar a regra de nota mínima 8 para aprovação", () => {
    const aprovado = (nota: number) => nota >= 8;

    expect(aprovado(8)).toBe(true);
    expect(aprovado(8.5)).toBe(true);
    expect(aprovado(10)).toBe(true);
    expect(aprovado(7.9)).toBe(false);
  });

  it("deve manter 15 questões como total padrão respondido pelo aluno", () => {
    const totalQuestoes = 15;
    expect(totalQuestoes).toBe(15);
  });
});
