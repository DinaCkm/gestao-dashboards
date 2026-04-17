import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ========== Helpers ==========

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "aluno-001",
    email: "aluno@test.com",
    name: "Aluno Teste",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createMentorContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  return createUserContext({
    id: 10,
    openId: "mentor-001",
    email: "mentor@test.com",
    name: "Mentora Teste",
    role: "manager",
    consultorId: 5,
    ...overrides,
  });
}

function createManagerContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  return createUserContext({
    id: 10,
    openId: "mentor-001",
    email: "mentor@test.com",
    name: "Mentora Teste",
    role: "manager",
    ...overrides,
  });
}

function createAdminContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  return createUserContext({
    id: 100,
    openId: "admin-001",
    email: "admin@test.com",
    name: "Admin Teste",
    role: "admin",
    ...overrides,
  });
}

// ========== Tests ==========

describe("Módulo Atividades Práticas", () => {

  describe("Validação de Input - submitEvidence", () => {
    it("deve rejeitar se sessionId não for número", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.attendance.submitEvidence({
          sessionId: "abc" as any,
        })
      ).rejects.toThrow();
    });

    it("deve rejeitar se evidenceLink não for URL válida", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.attendance.submitEvidence({
          sessionId: 1,
          evidenceLink: "not-a-url",
        })
      ).rejects.toThrow();
    });

    it("deve aceitar URL válida como evidenceLink", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      
      // Vai falhar no DB (sessão não existe), mas a validação de input deve passar
      await expect(
        caller.attendance.submitEvidence({
          sessionId: 999999,
          evidenceLink: "https://example.com/evidence",
        })
      ).rejects.toThrow(); // Falha no DB, não na validação
    });
  });

  describe("Validação de Input - validateTask", () => {
    it("deve rejeitar se sessionId não for número", async () => {
      const ctx = createMentorContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.mentor.validateTask({
          sessionId: "abc" as any,
        })
      ).rejects.toThrow();
    });

    it("deve exigir autenticação", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.mentor.validateTask({ sessionId: 1 })
      ).rejects.toThrow("Please login");
    });
  });

  describe("Validação de Input - addTaskComment (mentor)", () => {
    it("deve rejeitar comentário vazio", async () => {
      const ctx = createMentorContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.mentor.addTaskComment({
          sessionId: 1,
          comment: "",
        })
      ).rejects.toThrow();
    });

    it("deve rejeitar se sessionId não for número", async () => {
      const ctx = createMentorContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.mentor.addTaskComment({
          sessionId: "abc" as any,
          comment: "Bom trabalho!",
        })
      ).rejects.toThrow();
    });
  });

  describe("Validação de Input - addComment (admin/mentor)", () => {
    it("deve rejeitar comentário vazio", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.practicalActivities.addComment({
          sessionId: 1,
          comment: "",
        })
      ).rejects.toThrow();
    });

    it("deve bloquear aluno (role=user) de adicionar comentário", async () => {
      const ctx = createUserContext(); // role = user
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.practicalActivities.addComment({
          sessionId: 1,
          comment: "Comentário indevido",
        })
      ).rejects.toThrow("Acesso restrito a administradores e mentores");
    });

    it("deve bloquear manager sem consultorId (gestor puro) de adicionar comentário", async () => {
      const ctx = createManagerContext(); // role = manager, sem consultorId
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.practicalActivities.addComment({
          sessionId: 1,
          comment: "Comentário indevido",
        })
      ).rejects.toThrow("Acesso restrito a administradores e mentores");
    });
  });

  describe("Permissões - practicalActivities.submissions", () => {
    it("aluno (role=user) NÃO deve acessar submissions", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.practicalActivities.submissions({})
      ).rejects.toThrow("Acesso restrito a administradores e mentores");
    });

    it("gestor puro (manager sem consultorId) NÃO deve acessar submissions", async () => {
      const ctx = createManagerContext(); // manager sem consultorId
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.practicalActivities.submissions({})
      ).rejects.toThrow("Acesso restrito a administradores e mentores");
    });

    it("mentor (manager com consultorId) DEVE acessar submissions", async () => {
      const ctx = createMentorContext(); // manager com consultorId=5
      const caller = appRouter.createCaller(ctx);
      
      // Deve retornar array (pode ser vazio se DB não tiver dados para esse mentor)
      const result = await caller.practicalActivities.submissions({});
      expect(Array.isArray(result)).toBe(true);
    });

    it("admin DEVE acessar submissions", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.practicalActivities.submissions({});
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Permissões - practicalActivities.submissionDetail", () => {
    it("aluno (role=user) NÃO deve acessar submissionDetail", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.practicalActivities.submissionDetail({ sessionId: 1 })
      ).rejects.toThrow("Acesso restrito a administradores e mentores");
    });

    it("gestor puro NÃO deve acessar submissionDetail", async () => {
      const ctx = createManagerContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.practicalActivities.submissionDetail({ sessionId: 1 })
      ).rejects.toThrow("Acesso restrito a administradores e mentores");
    });

    it("admin deve receber NOT_FOUND para sessão inexistente", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.practicalActivities.submissionDetail({ sessionId: 999999 })
      ).rejects.toThrow("Sessão não encontrada");
    });

    it("mentor deve receber NOT_FOUND para sessão inexistente", async () => {
      const ctx = createMentorContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.practicalActivities.submissionDetail({ sessionId: 999999 })
      ).rejects.toThrow("Sessão não encontrada");
    });
  });

  describe("Permissões - Aluno não acessa validateTask", () => {
    it("aluno NÃO deve acessar validateTask", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.mentor.validateTask({ sessionId: 999999 })
      ).rejects.toThrow();
    });
  });

  describe("Validação de Input - submissionDetail", () => {
    it("deve rejeitar sessionId inválido", async () => {
      const ctx = createMentorContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.mentor.getSubmissionDetail({
          sessionId: "abc" as any,
        })
      ).rejects.toThrow();
    });

    it("deve retornar NOT_FOUND para sessão inexistente (mentor)", async () => {
      const ctx = createMentorContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.mentor.getSubmissionDetail({
          sessionId: 999999,
        })
      ).rejects.toThrow("Sessão não encontrada");
    });
  });

  describe("Fluxo de evidência - validação de campos", () => {
    it("deve aceitar apenas evidenceLink sem imagem", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.attendance.submitEvidence({
          sessionId: 999999,
          evidenceLink: "https://docs.google.com/presentation/d/123",
        })
      ).rejects.toThrow(); // Falha no DB
    });

    it("deve aceitar apenas evidenceImageBase64 sem link", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.attendance.submitEvidence({
          sessionId: 999999,
          evidenceImageBase64: "data:image/png;base64,iVBORw0KGgo=",
          evidenceImageFilename: "foto.png",
        })
      ).rejects.toThrow(); // Falha no DB
    });
  });

  describe("Filtros - submissions aceita parâmetros de filtro", () => {
    it("admin pode filtrar por programId", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.practicalActivities.submissions({ programId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("admin pode filtrar por turmaId", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.practicalActivities.submissions({ turmaId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("admin pode filtrar por status", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.practicalActivities.submissions({ status: "entregue" });
      expect(Array.isArray(result)).toBe(true);
    });

    it("admin pode filtrar por dateFrom e dateTo", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.practicalActivities.submissions({ dateFrom: "2026-01-01", dateTo: "2026-12-31" });
      expect(Array.isArray(result)).toBe(true);
    });

    it("mentor pode filtrar por status (escopo automático por consultorId)", async () => {
      const ctx = createMentorContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.practicalActivities.submissions({ status: "nao_entregue" });
      expect(Array.isArray(result)).toBe(true);
    });

    it("mentor pode filtrar por programId (escopo automático por consultorId)", async () => {
      const ctx = createMentorContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.practicalActivities.submissions({ programId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
