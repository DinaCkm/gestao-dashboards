import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "custom",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
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

function createManagerAlunoContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 660188,
    openId: "manager-aluno",
    email: "vera.braga@to.sebrae.com.br",
    name: "Vera Lucia Teodoro Braga",
    loginMethod: "custom",
    role: "manager",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    alunoId: 30078,
    programId: 17,
  } as any;

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

function createManagerPuroContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 570344,
    openId: "manager-puro",
    email: "gestor@sebraeto.com",
    name: "Gestor SEBRAE TO",
    loginMethod: "custom",
    role: "manager",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  } as any;

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

describe("Gerente de Empresa - Visão Dupla", () => {
  describe("admin.listGerentesEmpresa", () => {
    it("retorna lista de gerentes de empresa para admin", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.admin.listGerentesEmpresa();
      expect(Array.isArray(result)).toBe(true);
      // Deve conter pelo menos os 4 gerentes que vinculamos
      expect(result.length).toBeGreaterThanOrEqual(4);
      // Cada gerente deve ter os campos esperados
      if (result.length > 0) {
              const gerente = result[0];
        expect(gerente).toHaveProperty("id");
        expect(gerente).toHaveProperty("name");
        expect(gerente).toHaveProperty("email");
        expect(gerente).toHaveProperty("programName");
        expect(gerente).toHaveProperty("alunoId");
        expect(gerente).toHaveProperty("isAlsoStudent");
      }
    });

    it("gerentes com alunoId devem ter tipo Aluno + Gerente", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.admin.listGerentesEmpresa();
      const veraGerente = result.find((g: any) => g.name === "Vera Lucia Teodoro Braga");
      expect(veraGerente).toBeDefined();
      expect(veraGerente?.alunoId).toBe(30078);
      expect(veraGerente?.isAlsoStudent).toBe(true);
      expect(veraGerente?.isAlsoStudent).toBe(true);
    });
  });

  describe("admin.alunosByProgram", () => {
    it("retorna alunos de um programa específico", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      // Program 17 = SEBRAE TO
      const result = await caller.admin.alunosByProgram({ programId: 17 });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      const aluno = result[0];
      expect(aluno).toHaveProperty("id");
      expect(aluno).toHaveProperty("name");
    });
  });

  describe("Acesso do manager com alunoId ao aluno.onboardingStatus", () => {
    it("manager com alunoId pode acessar onboardingStatus", async () => {
      const ctx = createManagerAlunoContext();
      const caller = appRouter.createCaller(ctx);
      // Deve retornar sem erro (o manager com alunoId tem acesso)
      const result = await caller.aluno.onboardingStatus();
      expect(result).toHaveProperty("needsOnboarding");
    });
  });

  describe("Contexto de papel duplo", () => {
    it("manager com alunoId tem isManagerAluno = true", () => {
      const ctx = createManagerAlunoContext();
      const user = ctx.user as any;
      const isManagerAluno = user.role === "manager" && !!user.alunoId;
      const isGerentePuro = user.role === "manager" && !user.alunoId && !user.consultorId;
      expect(isManagerAluno).toBe(true);
      expect(isGerentePuro).toBe(false);
    });

    it("manager sem alunoId e sem consultorId é gerente puro", () => {
      const ctx = createManagerPuroContext();
      const user = ctx.user as any;
      const isManagerAluno = user.role === "manager" && !!user.alunoId;
      const isGerentePuro = user.role === "manager" && !user.alunoId && !user.consultorId;
      expect(isManagerAluno).toBe(false);
      expect(isGerentePuro).toBe(true);
    });
  });
});
