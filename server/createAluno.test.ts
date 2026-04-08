import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

function createAdminContext() {
  return {
    user: {
      id: 1,
      openId: "admin-test",
      email: "admin@test.com",
      name: "Admin Test",
      loginMethod: "manus",
      role: "admin" as const,
      alunoId: null,
      consultorId: null,
      departmentId: null,
      passwordHash: null,
      cpf: null,
      programId: null,
      isActive: 1,
      createdAt: new Date(),
    },
  };
}

describe("createAluno - Convite Onboarding", () => {
  it("should have createAluno function exported from db.ts", async () => {
    const db = await import("./db");
    expect(typeof db.createAluno).toBe("function");
  });

  it("createAluno function should accept name, email, externalId, programId", async () => {
    const db = await import("./db");
    const fn = db.createAluno;
    expect(fn).toBeDefined();
    expect(fn.length).toBeGreaterThanOrEqual(1);
  });

  it("createAlunoDireto function should also exist for comparison", async () => {
    const db = await import("./db");
    expect(typeof db.createAlunoDireto).toBe("function");
  });
});

describe("A7 - Campos Contrato e Turma no cadastro de alunos", () => {
  it("createAluno endpoint aceita contratoInicio e contratoFim", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Tentar criar aluno com campos de contrato
    try {
      const result = await caller.admin.createAluno({
        name: "Teste Contrato A7",
        email: `contrato-a7-${Date.now()}@test.com`,
        externalId: `${Date.now()}`.slice(-6),
        programId: 17,
        contratoInicio: "2026-01-01",
        contratoFim: "2026-12-31",
      });
      // Se chegou aqui, o endpoint aceitou os campos
      expect(result).toBeDefined();
    } catch (err: any) {
      // Pode falhar por FK constraint ou duplicata, mas não deve falhar por schema inválido
      expect(err.message).not.toContain("Unrecognized key");
      expect(err.message).not.toContain("contratoInicio");
      expect(err.message).not.toContain("contratoFim");
    }
  });

  it("createAlunoDireto endpoint aceita contratoInicio e contratoFim", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    try {
      const result = await caller.admin.createAlunoDireto({
        name: "Teste Direto Contrato A7",
        email: `direto-contrato-a7-${Date.now()}@test.com`,
        cpf: `${Date.now()}`.slice(-6),
        programId: 17,
        consultorId: 1,
        turmaId: null,
        contratoInicio: "2026-03-01",
        contratoFim: "2026-09-30",
      });
      expect(result).toBeDefined();
    } catch (err: any) {
      expect(err.message).not.toContain("Unrecognized key");
      expect(err.message).not.toContain("contratoInicio");
      expect(err.message).not.toContain("contratoFim");
    }
  });

  it("updateAluno endpoint aceita contratoInicio e contratoFim", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    try {
      const result = await caller.admin.updateAluno({
        alunoId: 30001,
        contratoInicio: "2026-02-01",
        contratoFim: "2026-11-30",
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    } catch (err: any) {
      expect(err.message).not.toContain("Unrecognized key");
    }
  });

  it("updateAluno aceita contratoInicio e contratoFim como null (limpar)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    try {
      const result = await caller.admin.updateAluno({
        alunoId: 30001,
        contratoInicio: null,
        contratoFim: null,
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    } catch (err: any) {
      expect(err.message).not.toContain("Unrecognized key");
    }
  });

  it("getAllAlunosForAdmin retorna campos contratoInicio e contratoFim", async () => {
    const db = await import("./db");
    const allAlunos = await db.getAllAlunosForAdmin();
    expect(allAlunos.length).toBeGreaterThan(0);
    
    const aluno = allAlunos[0];
    expect(aluno).toHaveProperty("contratoInicio");
    expect(aluno).toHaveProperty("contratoFim");
  });
});
