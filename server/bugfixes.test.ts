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
