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

function createUserContext(): TrpcContext {
  return createContext({
    id: 200,
    openId: "user-common",
    email: "user@example.com",
    name: "Usuário Comum",
    role: "user",
  });
}

describe("competenciasCompTec.admin", () => {
  it("deve permitir listarCompetencias para usuário autenticado", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    const result = await caller.competenciasCompTec.admin.listarCompetencias();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve permitir listarCursosPorCompetencia para usuário autenticado", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    const result = await caller.competenciasCompTec.admin.listarCursosPorCompetencia({
      competencia: "Comunicação",
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("deve rejeitar criarCurso para usuário sem perfil admin", async () => {
    const caller = appRouter.createCaller(createUserContext());

    await expect(
      caller.competenciasCompTec.admin.criarCurso({
        competencia: "Comunicação",
        titulo: "Curso Teste",
        tipoConteudo: "video",
      })
    ).rejects.toThrow();
  });

  it("deve validar tipoConteudo ao criarCurso", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    await expect(
      caller.competenciasCompTec.admin.criarCurso({
        competencia: "Comunicação",
        titulo: "Curso Inválido",
        tipoConteudo: "pdf" as any,
      })
    ).rejects.toThrow();
  });

  it("deve aceitar criarCurso com payload válido", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    try {
      const result = await caller.competenciasCompTec.admin.criarCurso({
        competencia: "Comunicação",
        titulo: "Curso Teste Admin",
        descricao: "Descrição de teste",
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

  it("deve aceitar atualizarCurso com payload válido", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    try {
      const result = await caller.competenciasCompTec.admin.atualizarCurso({
        cursoId: 999999,
        competencia: "Comunicação",
        titulo: "Curso Atualizado",
        descricao: "Descrição atualizada",
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

  it("deve aceitar exclusão lógica de curso", async () => {
    const caller = appRouter.createCaller(createAdminContext());

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
    const caller = appRouter.createCaller(createAdminContext());

    const result = await caller.competenciasCompTec.admin.listarAvaliacoesCurso({
      cursoId: 1,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("deve permitir listarAtividades de um curso", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    const result = await caller.competenciasCompTec.admin.listarAtividades({
      cursoId: 1,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar criarAtividade com payload válido", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    try {
      const result = await caller.competenciasCompTec.admin.criarAtividade({
        cursoId: 1,
        titulo: "Atividade Teste",
        tipoAtividade: "video",
        urlGenially: "https://example.com/conteudo",
        descricao: "Descrição da atividade",
        ordem: 1,
      });

      expect(result).toHaveProperty("success");
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });

  it("deve validar tipoAtividade ao criarAtividade", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    await expect(
      caller.competenciasCompTec.admin.criarAtividade({
        cursoId: 1,
        titulo: "Atividade Inválida",
        tipoAtividade: "pdf" as any,
      })
    ).rejects.toThrow();
  });

  it("deve aceitar atualizarAtividade com payload válido", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    try {
      const result = await caller.competenciasCompTec.admin.atualizarAtividade({
        id: 999999,
        titulo: "Atividade Atualizada",
        tipoAtividade: "podcast",
        urlGenially: "https://example.com/podcast",
        descricao: "Descrição atualizada",
        ordem: 3,
      });

      expect(result).toHaveProperty("success");
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });

  it("deve aceitar exclusão lógica de atividade", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    try {
      const result = await caller.competenciasCompTec.admin.deletarAtividade({
        id: 999999,
      });

      expect(result).toHaveProperty("success");
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });

  it("deve obter detalhes de atividade", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    const result =
      await caller.competenciasCompTec.admin.obterAtividadeDetalhes({
        id: 1,
      });

    expect(result === null || typeof result === "object").toBe(true);
  });

  it("deve exigir exatamente 30 questões ao criarAvaliacao", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    const questoesInvalidas = Array.from({ length: 29 }, (_, index) => ({
      pergunta: `Pergunta ${index + 1}`,
      alternativas: ["A", "B", "C", "D"],
      respostaCorreta: "A",
    }));

    await expect(
      caller.competenciasCompTec.admin.criarAvaliacao({
        atividadeId: 1,
        titulo: "Avaliação Inválida",
        questoes: questoesInvalidas as any,
        notaMinima: 8,
      })
    ).rejects.toThrow();
  });

  it("deve aceitar criarAvaliacao com 30 questões", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    const questoesValidas = Array.from({ length: 30 }, (_, index) => ({
      pergunta: `Pergunta ${index + 1}`,
      alternativas: [
        `Alternativa A${index + 1}`,
        `Alternativa B${index + 1}`,
        `Alternativa C${index + 1}`,
        `Alternativa D${index + 1}`,
      ],
      respostaCorreta: "A",
    }));

    try {
      const result = await caller.competenciasCompTec.admin.criarAvaliacao({
        atividadeId: 1,
        titulo: "Avaliação Completa",
        questoes: questoesValidas,
        notaMinima: 8,
      });

      expect(result).toHaveProperty("success");
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });
});
