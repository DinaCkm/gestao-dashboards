import { describe, expect, it } from "vitest";
import { protectedProcedure, router } from "./_core/trpc";
import type { TrpcContext } from "./_core/context";

const guardRouter = router({
  probe: protectedProcedure.query(() => ({ ok: true })),
});

function contextFor(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const baseUser = {
  id: 900001,
  openId: "test-user",
  name: "Pessoa Teste",
  email: "pessoa.teste@example.com",
  cpf: "12345678901",
  passwordHash: null,
  programId: null,
  departmentId: null,
  isActive: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: null,
} as const;

describe("Angel-only protectedProcedure guard", () => {
  it("blocks a pure Angel-only account from generic protected APIs", async () => {
    const caller = guardRouter.createCaller(contextFor({
      ...baseUser,
      role: "user",
      loginMethod: "angel",
      alunoId: null,
      consultorId: null,
    } as any));

    await expect(caller.probe()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps a regular student user allowed", async () => {
    const caller = guardRouter.createCaller(contextFor({
      ...baseUser,
      role: "user",
      loginMethod: "email_cpf",
      alunoId: 101,
      consultorId: null,
    } as any));

    await expect(caller.probe()).resolves.toEqual({ ok: true });
  });

  it("allows the same Angel account after it receives an alunoId", async () => {
    const caller = guardRouter.createCaller(contextFor({
      ...baseUser,
      role: "user",
      loginMethod: "angel",
      alunoId: 202,
      consultorId: null,
    } as any));

    await expect(caller.probe()).resolves.toEqual({ ok: true });
  });

  it("allows managers even if loginMethod retains the technical marker", async () => {
    const caller = guardRouter.createCaller(contextFor({
      ...baseUser,
      role: "manager",
      loginMethod: "angel",
      alunoId: null,
      consultorId: null,
    } as any));

    await expect(caller.probe()).resolves.toEqual({ ok: true });
  });
});
