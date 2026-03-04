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

describe("Performance calculation with cycles and aulas data", () => {
  const ctx = createAdminContext();
  const caller = appRouter.createCaller(ctx);

  describe("indicadores.visaoGeral", () => {
    it("returns visaoGeral with all 7 indicator averages", async () => {
      const result = await caller.indicadores.visaoGeral();
      expect(result).toHaveProperty("visaoGeral");
      const vg = result.visaoGeral;
      expect(vg).toHaveProperty("mediaParticipacaoMentorias");
      expect(vg).toHaveProperty("mediaAtividadesPraticas");
      expect(vg).toHaveProperty("mediaEngajamento");
      expect(vg).toHaveProperty("mediaPerformanceCompetencias");
      expect(vg).toHaveProperty("mediaPerformanceAprendizado");
      expect(vg).toHaveProperty("mediaParticipacaoEventos");
      expect(vg).toHaveProperty("mediaPerformanceGeral");
    });

    it("Ind 4 (Competências) is > 0 when student_performance has data", async () => {
      const result = await caller.indicadores.visaoGeral();
      expect(result.visaoGeral.mediaPerformanceCompetencias).toBeGreaterThan(0);
    });

    it("Ind 5 (Aprendizado) is > 0 when student_performance has data", async () => {
      const result = await caller.indicadores.visaoGeral();
      expect(result.visaoGeral.mediaPerformanceAprendizado).toBeGreaterThan(0);
    });

    it("Ind 7 (Geral) is average of 5 V2 indicators (Case is bonus on Ind5)", async () => {
      const result = await caller.indicadores.visaoGeral();
      const vg = result.visaoGeral;
      // V2: mediaPerformanceGeral = mediaInd7 = avg(ind1..ind5), Case is bonus on Ind5
      // V1 compat: mentorias=ind1, atividades=ind4, engajamento=ind5, competencias=ind3, aprendizado=ind2, eventos=ind1
      // mediaInd7 is the true average of 5 V2 indicators
      expect(vg.mediaPerformanceGeral).toBeGreaterThanOrEqual(0);
      expect(vg.mediaPerformanceGeral).toBeLessThanOrEqual(100);
      // Verify it equals mediaInd7 directly
      expect(vg.mediaPerformanceGeral).toBe(vg.mediaInd7);
    });

    it("All indicators are between 0 and 100", async () => {
      const result = await caller.indicadores.visaoGeral();
      const vg = result.visaoGeral;
      expect(vg.mediaPerformanceCompetencias).toBeGreaterThanOrEqual(0);
      expect(vg.mediaPerformanceCompetencias).toBeLessThanOrEqual(100);
      expect(vg.mediaPerformanceAprendizado).toBeGreaterThanOrEqual(0);
      expect(vg.mediaPerformanceAprendizado).toBeLessThanOrEqual(100);
      expect(vg.mediaPerformanceGeral).toBeGreaterThanOrEqual(0);
      expect(vg.mediaPerformanceGeral).toBeLessThanOrEqual(100);
    });
  });

  describe("jornada.completa returns aulas data from student_performance", () => {
    it("microJornadas include aulas fields when performance data exists", async () => {
      const result = await caller.jornada.completa({ alunoId: 30001 });
      if (result && result.macroJornadas.length > 0) {
        const mj = result.macroJornadas[0];
        if (mj.microJornadas.length > 0) {
          const micro = mj.microJornadas[0] as any;
          expect(micro).toHaveProperty("aulasDisponiveis");
          expect(micro).toHaveProperty("aulasConcluidas");
          expect(micro).toHaveProperty("aulasEmAndamento");
          expect(micro).toHaveProperty("notaPlataforma");
          expect(micro).toHaveProperty("progressoPlataforma");
          expect(typeof micro.aulasDisponiveis).toBe("number");
          expect(typeof micro.aulasConcluidas).toBe("number");
          expect(typeof micro.notaPlataforma).toBe("number");
        }
      }
    });

    it("aulas data is consistent (concluidas <= disponiveis)", async () => {
      const result = await caller.jornada.completa({ alunoId: 30001 });
      if (result && result.macroJornadas.length > 0) {
        for (const mj of result.macroJornadas) {
          for (const micro of mj.microJornadas) {
            const m = micro as any;
            if (m.aulasDisponiveis > 0) {
              expect(m.aulasConcluidas).toBeLessThanOrEqual(m.aulasDisponiveis);
            }
          }
        }
      }
    });

    it("at least some competencias have performance data from platform", async () => {
      const result = await caller.jornada.completa({ alunoId: 30001 });
      if (result && result.macroJornadas.length > 0) {
        let hasPerformanceData = false;
        for (const mj of result.macroJornadas) {
          for (const micro of mj.microJornadas) {
            const m = micro as any;
            if (m.notaPlataforma > 0 || m.progressoPlataforma > 0) {
              hasPerformanceData = true;
              break;
            }
          }
          if (hasPerformanceData) break;
        }
        expect(hasPerformanceData).toBe(true);
      }
    });
  });
});
