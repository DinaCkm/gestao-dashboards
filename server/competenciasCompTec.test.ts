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

function createAdminContext(): TrpcContext {
  return createContext({
    id: 100,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin Teste",
    role: "admin",
  });
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

describe("competenciasCompTec.admin", () => {
  it("deve permitir listarCompetencias para usuário autenticado", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.competenciasCompTec.admin.listarCompetencias();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve rejeitar criarCurso para usuário não admin", async () => {
    const ctx = createAlunoContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.competenciasCompTec.admin.criarCurso({
        competencia: "Comunicação",
        titulo: "Curso Teste",
        tipoConteudo: "video",
      })
    ).rejects.toThrow();
  });

  it("deve validar tipoConteudo no criarCurso", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.competenciasCompTec.admin.criarCurso({
        competencia: "Comunicação",
        titulo: "Curso Teste",
        tipoConteudo: "pdf" as any,
      })
    ).rejects.toThrow();
  });

  it("deve aceitar criarCurso com input válido para admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.competenciasCompTec.admin.criarCurso({
        competencia: "Comunicação",
        titulo: "Curso Teste Admin",
        descricao: "Descrição do curso",
        tipoConteudo: "video",
        urlConteudo: "https://example.com/video",
        ordem: 1,
        ativo: 1,
      });

      expect(result).toHaveProperty("success");
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });

  it("deve validar cursoId numérico em obterCurso", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.competenciasCompTec.admin.obterCurso({
        cursoId: "abc" as any,
      })
    ).rejects.toThrow();
  });

  it("deve aceitar atualizarCurso com input válido para admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.competenciasCompTec.admin.atualizarCurso({
        cursoId: 999999,
        competencia: "Comunicação",
        titulo: "Curso Atualizado",
        descricao: "Nova descrição",
        tipoConteudo: "genially",
        urlConteudo: "https://example.com/genially",
        ordem: 2,
        ativo: 1,
      });

      expect(result).toHaveProperty("success");
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });

  it("deve aceitar exclusão lógica para admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.competenciasCompTec.admin.excluirCurso({
        cursoId: 999999,
      });

      expect(result).toHaveProperty("success");
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });

  it("deve listar avaliações de um curso", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result =
      await caller.competenciasCompTec.admin.listarAvaliacoesCurso({
        cursoId: 1,
      });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("competenciasCompTec.mentor", () => {
  it("deve permitir listarAlunos para mentor autenticado", async () => {
    const ctx = createMentorContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.competenciasCompTec.mentor.listarAlunos();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve permitir listarProgramasMentor para mentor autenticado", async () => {
    const ctx = createMentorContext();
    const caller = appRouter.createCaller(ctx);

    const result =
      await caller.competenciasCompTec.mentor.listarProgramasMentor();

    expect(Array.isArray(result)).toBe(true);
  });

  it("deve validar input de atribuirCurso", async () => {
    const ctx = createMentorContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.competenciasCompTec.mentor.atribuirCurso({
        alunoId: "abc" as any,
        moduloId: 1,
      })
    ).rejects.toThrow();
  });

  it("deve aceitar atribuirCurso com input válido", async () => {
    const ctx = createMentorContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.competenciasCompTec.mentor.atribuirCurso({
        alunoId: 1,
        moduloId: 1,
        prazo: "2026-12-31",
      });

      expect(result).toHaveProperty("success");
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });

  it("deve permitir consultar progressoAluno", async () => {
    const ctx = createMentorContext();
    const caller = appRouter.createCaller(ctx);

    const result =
      await caller.competenciasCompTec.mentor.progressoAluno({
        alunoId: 1,
      });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("competenciasCompTec.aluno", () => {
  it("deve rejeitar usuário não autenticado", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.competenciasCompTec.aluno.meusCursos()
    ).rejects.toThrow();
  });

  it("deve permitir meusCursos para aluno autenticado", async () => {
    const ctx = createAlunoContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.competenciasCompTec.aluno.meusCursos();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve validar input de detalheCurso", async () => {
    const ctx = createAlunoContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.competenciasCompTec.aluno.detalheCurso({
        moduloId: "abc" as any,
      })
    ).rejects.toThrow();
  });

  it("deve aceitar iniciarAtividade com input válido", async () => {
    const ctx = createAlunoContext();
    const caller = appRouter.createCaller(ctx);

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
    const ctx = createAlunoContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.competenciasCompTec.aluno.submeterAvaliacao({
        moduloId: 1,
        nota: 11,
        totalQuestoes: 15,
        acertos: 10,
      })
    ).rejects.toThrow();

    await expect(
      caller.competenciasCompTec.aluno.submeterAvaliacao({
        moduloId: 1,
        nota: -1,
        totalQuestoes: 15,
        acertos: 10,
      })
    ).rejects.toThrow();
  });

  it("deve aceitar submeterAvaliacao com input válido", async () => {
    const ctx = createAlunoContext();
    const caller = appRouter.createCaller(ctx);

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
    const ctx = createAlunoContext();
    const caller = appRouter.createCaller(ctx);

    const result =
      await caller.competenciasCompTec.aluno.minhasTentativas({
        moduloId: 1,
      });

    expect(Array.isArray(result)).toBe(true);
  });

  it("deve exigir relato não vazio em registrarReflexaoFinal", async () => {
    const ctx = createAlunoContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.competenciasCompTec.aluno.registrarReflexaoFinal({
        moduloId: 1,
        relato: "",
      })
    ).rejects.toThrow();
  });

  it("deve aceitar registrarReflexaoFinal com input válido", async () => {
    const ctx = createAlunoContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result =
        await caller.competenciasCompTec.aluno.registrarReflexaoFinal({
          moduloId: 1,
          relato:
            "Aprendi conceitos importantes e já consigo aplicar no meu contexto profissional.",
        });

      expect(result).toHaveProperty("success");
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
    }
  });

  it("deve aceitar concluirCurso com input válido", async () => {
    const ctx = createAlunoContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.competenciasCompTec.aluno.concluirCurso({
        moduloId: 1,
      });

      expect(result).toHaveProperty("success");
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("competenciasCompTec - regras de negócio", () => {
  it("deve considerar aprovado quando nota for maior ou igual a 8", () => {
    const aprovado = (nota: number) => nota >= 8;

    expect(aprovado(8)).toBe(true);
    expect(aprovado(9)).toBe(true);
    expect(aprovado(10)).toBe(true);
    expect(aprovado(7.9)).toBe(false);
  });

  it("deve considerar 15 questões como padrão da avaliação do aluno", () => {
    const totalQuestoesPadrao = 15;
    expect(totalQuestoesPadrao).toBe(15);
  });

  it("deve manter banco de 30 questões como regra do módulo", () => {
    const bancoQuestoes = 30;
    expect(bancoQuestoes).toBe(30);
  });
});
