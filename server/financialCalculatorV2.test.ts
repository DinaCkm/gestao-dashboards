import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ============ HELPERS ============

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

function createManagerContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "manager-user",
    email: "manager@example.com",
    name: "Manager User",
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

// ============ TESTES ============

describe("Relatório Financeiro V2", () => {
  it("retorna estrutura correta do relatório V2 sem filtro de período", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.mentor.relatorioFinanceiroV2();

    // Verificar estrutura básica
    expect(result).toHaveProperty("mentores");
    expect(result).toHaveProperty("totalGeral");
    expect(result).toHaveProperty("totalSessoesGeral");
    expect(result).toHaveProperty("totalMentores");
    expect(result).toHaveProperty("totalPendentes");
    expect(result).toHaveProperty("alertas");
    expect(result).toHaveProperty("gapsAgendamento");

    // Verificar tipos
    expect(Array.isArray(result.mentores)).toBe(true);
    expect(typeof result.totalGeral).toBe("number");
    expect(typeof result.totalSessoesGeral).toBe("number");
    expect(typeof result.totalMentores).toBe("number");
    expect(typeof result.totalPendentes).toBe("number");
    expect(Array.isArray(result.alertas)).toBe(true);
    expect(Array.isArray(result.gapsAgendamento)).toBe(true);
  });

  it("retorna relatório V2 filtrado por período de março/2026", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.mentor.relatorioFinanceiroV2({
      dateFrom: "2026-03-01",
      dateTo: "2026-03-31",
    });

    expect(result).toHaveProperty("mentores");
    expect(result.totalSessoesGeral).toBeGreaterThanOrEqual(0);
    expect(result.totalGeral).toBeGreaterThanOrEqual(0);

    // Verificar que cada mentor tem a estrutura V2 completa
    for (const mentor of result.mentores) {
      expect(mentor).toHaveProperty("consultorId");
      expect(mentor).toHaveProperty("consultorNome");
      expect(mentor).toHaveProperty("totalSessoes");
      expect(mentor).toHaveProperty("totalSessoesGrupais");
      expect(mentor).toHaveProperty("totalSessoesIndividuais");
      expect(mentor).toHaveProperty("totalValor");
      expect(mentor).toHaveProperty("totalPendentes");
      expect(mentor).toHaveProperty("sessoes");
      expect(Array.isArray(mentor.sessoes)).toBe(true);

      // Verificar que total = individuais + grupais
      expect(mentor.totalSessoes).toBe(mentor.totalSessoesIndividuais + mentor.totalSessoesGrupais);
    }
  });

  it("cada sessão no relatório V2 tem campos obrigatórios", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.mentor.relatorioFinanceiroV2({
      dateFrom: "2026-03-01",
      dateTo: "2026-03-31",
    });

    for (const mentor of result.mentores) {
      for (const sessao of mentor.sessoes) {
        expect(sessao).toHaveProperty("sessionId");
        expect(sessao).toHaveProperty("tipoSessao");
        expect(sessao).toHaveProperty("valor");
        expect(sessao).toHaveProperty("origemPreco");
        expect(sessao).toHaveProperty("isGrupal");
        expect(sessao).toHaveProperty("isPendente");
        expect(sessao).toHaveProperty("alertas");

        // tipoSessao deve ser um dos valores válidos
        expect(["individual_normal", "individual_assessment", "grupo_normal", "grupo_assessment"])
          .toContain(sessao.tipoSessao);

        // origemPreco deve ser um dos valores válidos
        expect(["empresa_mentor", "mentor", "empresa", "legado_faixa", "legado_padrao", "zero"])
          .toContain(sessao.origemPreco);

        // valor deve ser um número >= 0
        expect(typeof sessao.valor).toBe("number");
        expect(sessao.valor).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("gaps de agendamento têm estrutura correta", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.mentor.relatorioFinanceiroV2({
      dateFrom: "2026-03-01",
      dateTo: "2026-03-31",
    });

    for (const gap of result.gapsAgendamento) {
      expect(gap).toHaveProperty("appointmentId");
      expect(gap).toHaveProperty("appointmentDate");
      expect(gap).toHaveProperty("consultorId");
      expect(gap).toHaveProperty("consultorNome");
      expect(gap).toHaveProperty("participantes");
      expect(Array.isArray(gap.participantes)).toBe(true);

      for (const p of gap.participantes) {
        expect(p).toHaveProperty("alunoId");
        expect(p).toHaveProperty("alunoNome");
      }
    }
  });

  it("totalGeral é a soma dos totalValor de cada mentor", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.mentor.relatorioFinanceiroV2({
      dateFrom: "2026-03-01",
      dateTo: "2026-03-31",
    });

    const somaManual = result.mentores.reduce((sum, m) => sum + m.totalValor, 0);
    // Usar toBeCloseTo para evitar problemas de ponto flutuante
    expect(result.totalGeral).toBeCloseTo(somaManual, 2);
  });
});

describe("CRUD Precificação V2", () => {
  it("lista regras de precificação V2", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const rules = await caller.mentor.getPricingRulesV2();

    expect(Array.isArray(rules)).toBe(true);
    // Cada regra deve ter campos obrigatórios
    for (const rule of rules) {
      expect(rule).toHaveProperty("id");
      expect(rule).toHaveProperty("tipoSessao");
      expect(rule).toHaveProperty("valor");
      expect(rule).toHaveProperty("isActive");
    }
  });

  it("cria, atualiza e desativa regra de precificação V2", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Criar regra (empresa e mentor obrigatórios)
    const newRuleId = await caller.mentor.createPricingRuleV2({
      programId: 90002, // Ckm Talents (empresa de teste)
      consultorId: 39, // Adriana Deus (mentora de teste)
      tipoSessao: "individual_normal",
      valor: "999.99",
      descricao: "Regra de teste unitário",
      validoDesde: "2099-01-01",
      validoAte: "2099-12-31",
    });

    // Retorno é { id, success }
    expect(newRuleId).toHaveProperty('success', true);
    expect(newRuleId).toHaveProperty('id');
    const ruleId = (newRuleId as any).id;
    expect(typeof ruleId).toBe('number');

    // Verificar que a regra aparece na listagem
    const rulesAfterCreate = await caller.mentor.getPricingRulesV2();
    const createdRule = rulesAfterCreate.find((r: any) => r.id === ruleId);
    expect(createdRule).toBeDefined();
    expect(createdRule?.descricao).toBe("Regra de teste unitário");

    // Atualizar regra
    await caller.mentor.updatePricingRuleV2({
      id: ruleId,
      valor: "1500.00",
      descricao: "Regra atualizada pelo teste",
    });

    const rulesAfterUpdate = await caller.mentor.getPricingRulesV2();
    const updatedRule = rulesAfterUpdate.find((r: any) => r.id === ruleId);
    expect(updatedRule?.descricao).toBe("Regra atualizada pelo teste");

    // Desativar regra (soft delete)
    await caller.mentor.deletePricingRuleV2({ id: ruleId });

    const rulesAfterDelete = await caller.mentor.getPricingRulesV2();
    const deletedRule = rulesAfterDelete.find((r: any) => r.id === ruleId);
    // Regra desativada não deve aparecer na listagem ativa (depende da implementação)
    // Se a listagem mostra todas, verificar isActive = 0
    if (deletedRule) {
      expect(deletedRule.isActive).toBe(0);
    }
  });
});

describe("Relatório Financeiro Legado (compatibilidade)", () => {
  it("rota legada ainda funciona", async () => {
    const ctx = createManagerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.mentor.relatorioFinanceiro();

    expect(result).toHaveProperty("mentores");
    expect(result).toHaveProperty("totalGeral");
    expect(result).toHaveProperty("totalSessoesGeral");
    expect(result).toHaveProperty("totalMentores");
  });
});
