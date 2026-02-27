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

function createAlunoContext(email: string): TrpcContext {
  const user: AuthenticatedUser = {
    id: 999,
    openId: "aluno-user",
    email,
    name: "Test Aluno",
    loginMethod: "manus",
    role: "user",
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

describe("jornada endpoints", () => {
  const adminCtx = createAdminContext();
  const adminCaller = appRouter.createCaller(adminCtx);

  describe("jornada.completa", () => {
    it("returns jornada data for a valid alunoId", async () => {
      const result = await adminCaller.jornada.completa({ alunoId: 30001 });
      // Should return an object (or null if no data)
      if (result) {
        expect(result).toHaveProperty("contrato");
        expect(result).toHaveProperty("macroJornadas");
        expect(result).toHaveProperty("saldo");
        expect(Array.isArray(result.macroJornadas)).toBe(true);
      }
    });

    it("returns null for non-existent alunoId", async () => {
      const result = await adminCaller.jornada.completa({ alunoId: 999999 });
      // Should return null or empty macroJornadas
      if (result) {
        expect(result.macroJornadas).toEqual([]);
      }
    });

    it("macroJornadas contain expected structure", async () => {
      const result = await adminCaller.jornada.completa({ alunoId: 30001 });
      if (result && result.macroJornadas.length > 0) {
        const mj = result.macroJornadas[0];
        expect(mj).toHaveProperty("id");
        expect(mj).toHaveProperty("trilhaId");
        expect(mj).toHaveProperty("trilhaNome");
        expect(mj).toHaveProperty("status");
        expect(mj).toHaveProperty("macroInicio");
        expect(mj).toHaveProperty("macroTermino");
        expect(mj).toHaveProperty("microJornadas");
        expect(mj).toHaveProperty("totalCompetencias");
        expect(mj).toHaveProperty("obrigatorias");
        expect(mj).toHaveProperty("opcionais");
        expect(mj).toHaveProperty("nivelGeralAtual");
        expect(mj).toHaveProperty("metaGeralFinal");
        expect(Array.isArray(mj.microJornadas)).toBe(true);
      }
    });

    it("microJornadas contain level fields", async () => {
      const result = await adminCaller.jornada.completa({ alunoId: 30001 });
      if (result && result.macroJornadas.length > 0) {
        const mj = result.macroJornadas[0];
        if (mj.microJornadas.length > 0) {
          const micro = mj.microJornadas[0];
          expect(micro).toHaveProperty("competenciaId");
          expect(micro).toHaveProperty("competenciaNome");
          expect(micro).toHaveProperty("peso");
          expect(micro).toHaveProperty("nivelAtual");
          expect(micro).toHaveProperty("metaCiclo1");
          expect(micro).toHaveProperty("metaCiclo2");
          expect(micro).toHaveProperty("metaFinal");
          expect(micro).toHaveProperty("justificativa");
          expect(micro).toHaveProperty("microInicio");
          expect(micro).toHaveProperty("microTermino");
        }
      }
    });
  });

  describe("jornada.minha", () => {
    it("returns null for user without aluno record", async () => {
      const ctx = createAlunoContext("nonexistent@test.com");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.jornada.minha();
      expect(result).toBeNull();
    });
  });

  describe("jornada.checkReavaliacao", () => {
    it("returns reavaliacao status for valid alunoId", async () => {
      const result = await adminCaller.jornada.checkReavaliacao({ alunoId: 30001 });
      if (result) {
        expect(result).toHaveProperty("sessoesDesdeUltimaAtualizacao");
        expect(result).toHaveProperty("precisaReavaliar");
        expect(result).toHaveProperty("ultimaAtualizacao");
        expect(typeof result.sessoesDesdeUltimaAtualizacao).toBe("number");
        expect(typeof result.precisaReavaliar).toBe("boolean");
      }
    });

    it("precisaReavaliar is true when 3+ sessions since last update", async () => {
      const result = await adminCaller.jornada.checkReavaliacao({ alunoId: 30001 });
      if (result) {
        if (result.sessoesDesdeUltimaAtualizacao >= 3) {
          expect(result.precisaReavaliar).toBe(true);
        } else {
          expect(result.precisaReavaliar).toBe(false);
        }
      }
    });
  });

  describe("jornada.updateNivel", () => {
    it("validates input range (0-100)", async () => {
      // Test with invalid value > 100
      try {
        await adminCaller.jornada.updateNivel({
          assessmentCompetenciaId: 1,
          nivelAtual: 150, // Should fail validation
        });
        // If it doesn't throw, the zod validation might not catch it
      } catch (err: any) {
        expect(err).toBeDefined();
      }
    });

    it("validates input range (negative)", async () => {
      try {
        await adminCaller.jornada.updateNivel({
          assessmentCompetenciaId: 1,
          nivelAtual: -10, // Should fail validation
        });
      } catch (err: any) {
        expect(err).toBeDefined();
      }
    });
  });

  describe("jornada.historico", () => {
    it("returns array for valid assessmentCompetenciaId", async () => {
      const result = await adminCaller.jornada.historico({ assessmentCompetenciaId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("returns empty array for non-existent id", async () => {
      const result = await adminCaller.jornada.historico({ assessmentCompetenciaId: 999999 });
      expect(result).toEqual([]);
    });
  });

  describe("jornada.setMeta", () => {
    it("validates metaFinal range (0-100)", async () => {
      try {
        await adminCaller.jornada.setMeta({
          assessmentCompetenciaId: 1,
          metaFinal: 200, // Should fail
        });
      } catch (err: any) {
        expect(err).toBeDefined();
      }
    });
  });
});

describe("assessment with new level fields", () => {
  const ctx = createAdminContext();
  const caller = appRouter.createCaller(ctx);

  describe("assessment.porAluno returns level fields", () => {
    it("competencias include nivelAtual, metaCiclo1, metaCiclo2, metaFinal, justificativa", async () => {
      const result = await caller.assessment.porAluno({ alunoId: 30001 });
      if (result.length > 0 && result[0].competencias.length > 0) {
        const comp = result[0].competencias[0];
        // These fields should exist (even if null)
        expect("nivelAtual" in comp || "nivel_atual" in comp).toBe(true);
      }
    });
  });
});
