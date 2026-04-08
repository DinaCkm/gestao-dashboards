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
    loginMethod: "manus",
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

describe("Bug fixes - Admin endpoints", () => {
  const ctx = createAdminContext();
  const caller = appRouter.createCaller(ctx);

  describe("admin.listEmpresas", () => {
    it("returns a list of empresas/programs", async () => {
      const result = await caller.admin.listEmpresas();
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("name");
        expect(result[0]).toHaveProperty("code");
        expect(result[0]).toHaveProperty("isActive");
      }
    });
  });

  describe("admin.updateEmpresa", () => {
    it("updates an existing empresa name", async () => {
      const empresas = await caller.admin.listEmpresas();
      if (empresas.length > 0) {
        const empresa = empresas[0];
        const originalName = empresa.name;
        
        // Update name
        const result = await caller.admin.updateEmpresa({
          id: empresa.id,
          name: originalName + " TEST",
        });
        expect(result).toEqual({ success: true });
        
        // Verify update
        const updated = await caller.admin.listEmpresas();
        const updatedEmpresa = updated.find(e => e.id === empresa.id);
        expect(updatedEmpresa?.name).toBe(originalName + " TEST");
        
        // Restore original name
        await caller.admin.updateEmpresa({
          id: empresa.id,
          name: originalName,
        });
      }
    });
  });

  describe("admin.toggleEmpresaStatus", () => {
    it("toggles empresa active status", async () => {
      const empresas = await caller.admin.listEmpresas();
      if (empresas.length > 0) {
        const empresa = empresas[0];
        const originalStatus = empresa.isActive;
        
        // Toggle status
        const result = await caller.admin.toggleEmpresaStatus({ id: empresa.id });
        expect(result.success).toBe(true);
        
        // Verify toggle
        const updated = await caller.admin.listEmpresas();
        const updatedEmpresa = updated.find(e => e.id === empresa.id);
        expect(updatedEmpresa?.isActive).toBe(originalStatus === 1 ? 0 : 1);
        
        // Restore original status
        await caller.admin.toggleEmpresaStatus({ id: empresa.id });
      }
    });
  });

  describe("admin.editGerente", () => {
    it("updates gerente name and email", async () => {
      const gerentes = await caller.admin.listGerentes();
      if (gerentes.length > 0) {
        const gerente = gerentes[0];
        const originalName = gerente.name;
        const originalEmail = gerente.email;
        
        // Update
        const result = await caller.admin.editGerente({
          consultorId: gerente.id,
          name: "Test Gerente Name",
          email: "test-gerente@example.com",
        });
        expect(result).toEqual({ success: true });
        
        // Verify
        const updated = await caller.admin.listGerentes();
        const updatedGerente = updated.find(g => g.id === gerente.id);
        expect(updatedGerente?.name).toBe("Test Gerente Name");
        expect(updatedGerente?.email).toBe("test-gerente@example.com");
        
        // Restore
        await caller.admin.editGerente({
          consultorId: gerente.id,
          name: originalName,
          email: originalEmail || undefined,
        });
      }
    });
  });

  describe("admin.listGerentes", () => {
    it("returns a list of gerentes", async () => {
      const result = await caller.admin.listGerentes();
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("name");
        expect(result[0]).toHaveProperty("role");
        expect(result[0].role).toBe("gerente");
      }
    });
  });
});

describe("Bug fixes - Mentor especialidade field", () => {
  const ctx = createAdminContext();
  const caller = appRouter.createCaller(ctx);

  describe("admin.listMentores - especialidade field", () => {
    it("returns mentores with especialidade field", async () => {
      const result = await caller.admin.listMentores();
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("name");
        // especialidade can be null or string
        expect("especialidade" in result[0]).toBe(true);
      }
    });
  });

  describe("admin.editMentor - update especialidade", () => {
    it("updates mentor especialidade", async () => {
      const mentores = await caller.admin.listMentores();
      if (mentores.length > 0) {
        const mentor = mentores[0];
        const originalEspecialidade = mentor.especialidade;
        
        // Update especialidade
        const result = await caller.admin.editMentor({
          consultorId: mentor.id,
          especialidade: "Gestão e Liderança",
        });
        expect(result).toEqual({ success: true });
        
        // Verify update
        const updated = await caller.admin.listMentores();
        const updatedMentor = updated.find(m => m.id === mentor.id);
        expect(updatedMentor?.especialidade).toBe("Gestão e Liderança");
        
        // Restore original
        await caller.admin.editMentor({
          consultorId: mentor.id,
          especialidade: originalEspecialidade || undefined,
        });
      }
    });
  });
});

describe("Bug fixes - Assessment nota de corte scale", () => {
  const ctx = createAdminContext();
  const caller = appRouter.createCaller(ctx);

  describe("assessment.porAluno - nota de corte scale 0-10", () => {
    it("returns nota de corte values in 0-10 scale", async () => {
      // Check a student that has assessment data
      const result = await caller.assessment.porAluno({ alunoId: 30001 });
      
      if (result.length > 0) {
        const pdi = result[0];
        for (const comp of pdi.competencias) {
          const notaCorte = parseFloat(comp.notaCorte);
          // After conversion, all nota de corte should be between 0 and 10
          expect(notaCorte).toBeGreaterThanOrEqual(0);
          expect(notaCorte).toBeLessThanOrEqual(10);
        }
      }
    });

    it("correctly determines atingiuMeta based on 0-10 scale", async () => {
      const result = await caller.assessment.porAluno({ alunoId: 30001 });
      
      if (result.length > 0) {
        const pdi = result[0];
        for (const comp of pdi.competencias) {
          if (comp.notaAtual !== null) {
            const notaCorte = parseFloat(comp.notaCorte);
            const expectedAtingiu = comp.notaAtual >= notaCorte;
            expect(comp.atingiuMeta).toBe(expectedAtingiu);
          }
        }
      }
    });
  });
});

describe("Bug fixes - Access user management", () => {
  const ctx = createAdminContext();
  const caller = appRouter.createCaller(ctx);

  describe("admin.listAccessUsers", () => {
    it("returns a list of access users", async () => {
      const result = await caller.admin.listAccessUsers();
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("name");
        expect(result[0]).toHaveProperty("email");
        expect(result[0]).toHaveProperty("role");
      }
    });
  });
});

// ============ Bug 2: alertaCasePendente must include trilhaId ============
import { calcularIndicadoresAluno } from "./indicatorsCalculatorV2";
import type { CicloDataV2, CaseSucessoData } from "./indicatorsCalculatorV2";

describe("Bug 2 - alertaCasePendente includes trilhaId", () => {
  it("should include trilhaId field in alertaCasePendente when case is pending", () => {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + 15); // 15 days from now
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 30);

    const ciclos: CicloDataV2[] = [
      {
        id: 1,
        nomeCiclo: "Visão de Futuro - Ciclo 1",
        trilhaNome: "Visão de Futuro",
        dataInicio: pastDate.toISOString().split("T")[0],
        dataFim: futureDate.toISOString().split("T")[0],
        competenciaIds: [101, 102],
      },
    ];

    const casesData: CaseSucessoData[] = [];

    const result = calcularIndicadoresAluno(
      "user-123",
      [],
      [],
      [],
      ciclos,
      new Map(),
      casesData,
      now
    );

    expect(result.alertaCasePendente.length).toBeGreaterThan(0);

    for (const alerta of result.alertaCasePendente) {
      expect(alerta).toHaveProperty("trilhaId");
      expect(alerta).toHaveProperty("trilhaNome");
      expect(alerta).toHaveProperty("diasRestantes");
      expect(alerta).toHaveProperty("dataLimite");
      expect(alerta).toHaveProperty("ativo");
    }
  });

  it("should not show alert when case is already submitted", () => {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + 15);
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 30);

    const ciclos: CicloDataV2[] = [
      {
        id: 1,
        nomeCiclo: "Visão de Futuro - Ciclo 1",
        trilhaNome: "Visão de Futuro",
        dataInicio: pastDate.toISOString().split("T")[0],
        dataFim: futureDate.toISOString().split("T")[0],
        competenciaIds: [101, 102],
      },
    ];

    const casesData: CaseSucessoData[] = [
      {
        alunoId: 1,
        trilhaId: 1,
        trilhaNome: "Visão de Futuro",
        entregue: true,
      },
    ];

    const result = calcularIndicadoresAluno(
      "user-123",
      [],
      [],
      [],
      ciclos,
      new Map(),
      casesData,
      now
    );

    expect(result.alertaCasePendente.length).toBe(0);
  });

  it("should not show alert when ciclo ends more than 30 days from now", () => {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + 60);
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 30);

    const ciclos: CicloDataV2[] = [
      {
        id: 1,
        nomeCiclo: "Visão de Futuro - Ciclo 1",
        trilhaNome: "Visão de Futuro",
        dataInicio: pastDate.toISOString().split("T")[0],
        dataFim: futureDate.toISOString().split("T")[0],
        competenciaIds: [101, 102],
      },
    ];

    const result = calcularIndicadoresAluno(
      "user-123",
      [],
      [],
      [],
      ciclos,
      new Map(),
      [],
      now
    );

    expect(result.alertaCasePendente.length).toBe(0);
  });
});

describe("Bug 3-4 - V2 calculator preserves trilhaNome in ciclos", () => {
  it("should preserve trilhaNome in ciclosFinalizados and ciclosEmAndamento", () => {
    const now = new Date();
    const pastDate1 = new Date(now);
    pastDate1.setDate(pastDate1.getDate() - 90);
    const pastDate2 = new Date(now);
    pastDate2.setDate(pastDate2.getDate() - 30);
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + 30);

    const ciclos: CicloDataV2[] = [
      {
        id: 1,
        nomeCiclo: "Basic - Ciclo 1",
        trilhaNome: "Basic",
        dataInicio: pastDate1.toISOString().split("T")[0],
        dataFim: pastDate2.toISOString().split("T")[0],
        competenciaIds: [101],
      },
      {
        id: 2,
        nomeCiclo: "Essencial - Ciclo 1",
        trilhaNome: "Essencial",
        dataInicio: pastDate2.toISOString().split("T")[0],
        dataFim: futureDate.toISOString().split("T")[0],
        competenciaIds: [201],
      },
    ];

    const result = calcularIndicadoresAluno(
      "user-123",
      [],
      [],
      [],
      ciclos,
      new Map(),
      [],
      now
    );

    const basicCiclos = result.ciclosFinalizados.filter(
      (c) => c.trilhaNome === "Basic"
    );
    expect(basicCiclos.length).toBeGreaterThan(0);

    const essencialCiclos = result.ciclosEmAndamento.filter(
      (c) => c.trilhaNome === "Essencial"
    );
    expect(essencialCiclos.length).toBeGreaterThan(0);
  });

  it("should correctly identify multiple trilhas for the same aluno", () => {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 30);
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + 30);

    const ciclos: CicloDataV2[] = [
      {
        id: 1,
        nomeCiclo: "Basic - Ciclo 1",
        trilhaNome: "Basic",
        dataInicio: pastDate.toISOString().split("T")[0],
        dataFim: futureDate.toISOString().split("T")[0],
        competenciaIds: [101],
      },
      {
        id: 2,
        nomeCiclo: "Essencial - Ciclo 1",
        trilhaNome: "Essencial",
        dataInicio: pastDate.toISOString().split("T")[0],
        dataFim: futureDate.toISOString().split("T")[0],
        competenciaIds: [201],
      },
      {
        id: 3,
        nomeCiclo: "Visão de Futuro - Ciclo 1",
        trilhaNome: "Visão de Futuro",
        dataInicio: pastDate.toISOString().split("T")[0],
        dataFim: futureDate.toISOString().split("T")[0],
        competenciaIds: [301],
      },
    ];

    const result = calcularIndicadoresAluno(
      "user-123",
      [],
      [],
      [],
      ciclos,
      new Map(),
      [],
      now
    );

    const trilhasEmAndamento = new Set(
      result.ciclosEmAndamento.map((c) => c.trilhaNome)
    );
    expect(trilhasEmAndamento.has("Basic")).toBe(true);
    expect(trilhasEmAndamento.has("Essencial")).toBe(true);
    expect(trilhasEmAndamento.has("Visão de Futuro")).toBe(true);
  });
});
