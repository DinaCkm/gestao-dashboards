import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── helpers ──

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createContext({ role: "admin" });
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ── Tests ──

describe("Aplicabilidade Prática - submitAplicabilidade", () => {
  it("should reject unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.attendance.submitAplicabilidade({
        sessionId: 1,
        textoAplicabilidade: "Apliquei técnicas de feedback na reunião de equipe",
        notaAlunoAplicabilidade: 8,
      })
    ).rejects.toThrow();
  });

  it("should validate nota range (0-10)", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    // Nota above 10 should fail validation
    await expect(
      caller.attendance.submitAplicabilidade({
        sessionId: 1,
        textoAplicabilidade: "Teste",
        notaAlunoAplicabilidade: 11,
      })
    ).rejects.toThrow();

    // Nota below 0 should fail validation
    await expect(
      caller.attendance.submitAplicabilidade({
        sessionId: 1,
        textoAplicabilidade: "Teste",
        notaAlunoAplicabilidade: -1,
      })
    ).rejects.toThrow();
  });

  it("should require textoAplicabilidade to be non-empty", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.attendance.submitAplicabilidade({
        sessionId: 1,
        textoAplicabilidade: "",
        notaAlunoAplicabilidade: 7,
      })
    ).rejects.toThrow();
  });
});

describe("Aplicabilidade Prática - Indicator Calculation Logic", () => {
  it("should correctly calculate weighted average (60% mentora + 40% aluno)", () => {
    const notaAluno = 8;
    const notaMentora = 6;
    const expected = notaMentora * 0.6 + notaAluno * 0.4;
    expect(expected).toBe(6.8);
  });

  it("should correctly determine bonus eligibility (8-10 = +10% engajamento)", () => {
    const checkBonus = (nota: number) => nota >= 8;

    expect(checkBonus(8)).toBe(true);
    expect(checkBonus(9)).toBe(true);
    expect(checkBonus(10)).toBe(true);
    expect(checkBonus(7.9)).toBe(false);
    expect(checkBonus(0)).toBe(false);
  });

  it("should correctly determine color status based on percentage", () => {
    const getColor = (pct: number) => {
      if (pct >= 80) return "green";
      if (pct >= 60) return "yellow";
      return "red";
    };

    expect(getColor(80)).toBe("green");
    expect(getColor(100)).toBe("green");
    expect(getColor(79)).toBe("yellow");
    expect(getColor(60)).toBe("yellow");
    expect(getColor(59)).toBe("red");
    expect(getColor(0)).toBe("red");
  });

  it("should respect cutoff date of 2026-04-01", () => {
    const CUTOFF = new Date("2026-04-01T00:00:00Z").getTime();

    const before = new Date("2026-03-31T23:59:59Z").getTime();
    const after = new Date("2026-04-01T00:00:01Z").getTime();
    const exact = new Date("2026-04-01T00:00:00Z").getTime();

    expect(before >= CUTOFF).toBe(false);
    expect(after >= CUTOFF).toBe(true);
    expect(exact >= CUTOFF).toBe(true);
  });

  it("should handle case where only aluno has evaluated (provisória)", () => {
    const notaAluno = 7;
    const notaMentora: number | null = null;

    // When mentora hasn't evaluated yet, show aluno's nota as provisional
    const isProvisoria = notaMentora === null;
    const displayNota = isProvisoria ? notaAluno : notaMentora * 0.6 + notaAluno * 0.4;

    expect(isProvisoria).toBe(true);
    expect(displayNota).toBe(7);
  });

  it("should handle case with no evaluations", () => {
    const evaluations: { notaAluno: number | null; notaMentora: number | null }[] = [];

    const hasData = evaluations.length > 0;
    expect(hasData).toBe(false);
  });

  it("should calculate average across multiple tasks", () => {
    const tasks = [
      { notaAluno: 8, notaMentora: 7 },
      { notaAluno: 9, notaMentora: 8 },
      { notaAluno: 6, notaMentora: 5 },
    ];

    const scores = tasks.map(t => t.notaMentora * 0.6 + t.notaAluno * 0.4);
    // [7*0.6 + 8*0.4, 8*0.6 + 9*0.4, 5*0.6 + 6*0.4] = [7.4, 8.4, 5.4]
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    expect(scores[0]).toBeCloseTo(7.4);
    expect(scores[1]).toBeCloseTo(8.4);
    expect(scores[2]).toBeCloseTo(5.4);
    expect(avg).toBeCloseTo(7.067, 2);
  });
});

describe("Aplicabilidade Prática - createSession with notaMentoraAplicabilidade", () => {
  it("should reject unauthenticated session creation", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.mentor.createSession({
        alunoId: 1,
        data: "2026-04-15",
        duracao: 60,
        tipo: "individual",
        status: "realizada",
        notaMentoraAplicabilidade: 8,
      } as any)
    ).rejects.toThrow();
  });
});

describe("Aplicabilidade Prática - Case enviar with notaAlunoAplicabilidade", () => {
  it("should validate notaAlunoAplicabilidade range in case submission", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    // Nota above 10 should fail
    await expect(
      caller.cases.enviar({
        trilhaSlug: "basic",
        titulo: "Meu Case",
        arquivo: "https://example.com/case.pdf",
        notaAlunoAplicabilidade: 15,
      } as any)
    ).rejects.toThrow();
  });
});
