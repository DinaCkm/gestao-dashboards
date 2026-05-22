import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("./db", () => ({
  getDb: mocks.getDb,
}));

const { appRouter } = await import("./routers");
const { generateSlots } = await import("./routers/processosSeletivos");

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(role: "admin" | "manager" | "user", id = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id,
    openId: `${role}-${id}`,
    email: `${role}${id}@example.com`,
    name: `${role} ${id}`,
    loginMethod: "test",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createUnauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function selectChain(result: unknown[]) {
  const chain = {
    from: vi.fn(() => ({
      orderBy: vi.fn(async () => result),
      where: vi.fn(() => ({
        orderBy: vi.fn(async () => result),
        limit: vi.fn(async () => result),
      })),
      limit: vi.fn(async () => result),
    })),
  };
  return chain;
}

describe("processosSeletivos router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lista processos para admin sem depender de outros modulos", async () => {
    const processos = [
      {
        id: 1,
        nome: "Processo Banrisul",
        clienteNome: "Banrisul",
        clienteEmail: "cliente@example.com",
        descricao: null,
        status: "ativo",
        dataInicio: null,
        dataFim: null,
        responsavelCkmId: null,
        criadoPor: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mocks.getDb.mockResolvedValue({ select: vi.fn(() => selectChain(processos)) });

    const caller = appRouter.createCaller(createContext("admin"));
    await expect(caller.processosSeletivos.listarProcessos()).resolves.toEqual(processos);
  });

  it("bloqueia criacao de processo para usuario comum antes de tocar no banco", async () => {
    const caller = appRouter.createCaller(createContext("user", 2));

    await expect(
      caller.processosSeletivos.criarProcesso({
        nome: "Processo bloqueado",
        clienteNome: "Cliente",
        status: "ativo",
      }),
    ).rejects.toThrow(/administradores CKM/i);

    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it("exige autenticacao para listar processos", async () => {
    const caller = appRouter.createCaller(createUnauthenticatedContext());
    await expect(caller.processosSeletivos.listarProcessos()).rejects.toThrow();
  });
});


describe("processosSeletivos.generateSlots", () => {
  it("gera slots ordenados e nao cria slots dentro do intervalo", () => {
    const slots = generateSlots({
      dataAgenda: "2026-06-01",
      inicio: "09:00",
      fim: "12:00",
      intervaloInicio: "10:00",
      intervaloFim: "11:00",
      duracaoMinutos: 30,
    });

    expect(slots.map((slot) => `${slot.inicio}-${slot.fim}`)).toEqual([
      "09:00-09:30",
      "09:30-10:00",
      "11:00-11:30",
      "11:30-12:00",
    ]);
  });
});
