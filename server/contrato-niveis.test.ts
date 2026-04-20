import { describe, expect, it } from "vitest";
import type { ContratoNivel, InsertContratoNivel } from "../drizzle/schema";
import {
  assertContratoNivelDateConsistency,
  createContratoNivelRepo,
  getContratoNivelVigenteByAlunoRepo,
  getContratoNiveisByAlunoRepo,
  getContratoNiveisByContratoRepo,
  validarNivelEmAndamentoUnicoRepo,
  type ContratoNivelRepo,
} from "./contrato-niveis.service";

function makeInMemoryRepo(seed: ContratoNivel[] = []): ContratoNivelRepo {
  const data: ContratoNivel[] = [...seed];
  let idSeq = data.reduce((max, item) => Math.max(max, item.id), 0) + 1;

  return {
    async findEmAndamento(contratoId, alunoId, ignoreNivelId) {
      return data
        .filter((item) => item.contratoId === contratoId && item.alunoId === alunoId && item.status === "em_andamento")
        .filter((item) => (ignoreNivelId ? item.id !== ignoreNivelId : true))
        .map((item) => ({ id: item.id }));
    },

    async insertNivel(payload) {
      const entity: ContratoNivel = {
        id: idSeq++,
        contratoId: payload.contratoId,
        alunoId: payload.alunoId,
        nivel: payload.nivel,
        dataInicio: String(payload.dataInicio),
        dataFim: String(payload.dataFim),
        dataFechamentoOperacional: String(payload.dataFechamentoOperacional),
        dataLimiteAjustes: String(payload.dataLimiteAjustes),
        status: payload.status ?? "planejado",
        assessmentPdiId: payload.assessmentPdiId ?? null,
        mentoraPrincipalId: payload.mentoraPrincipalId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      data.push(entity);
      return entity.id;
    },

    async listByAluno(alunoId) {
      return [...data]
        .filter((item) => item.alunoId === alunoId)
        .sort((a, b) => {
          if (a.dataInicio === b.dataInicio) return b.createdAt.getTime() - a.createdAt.getTime();
          return a.dataInicio < b.dataInicio ? 1 : -1;
        });
    },

    async listByContrato(contratoId) {
      return [...data]
        .filter((item) => item.contratoId === contratoId)
        .sort((a, b) => {
          if (a.dataInicio === b.dataInicio) return a.id - b.id;
          return a.dataInicio < b.dataInicio ? -1 : 1;
        });
    },

    async findVigenteByAluno(alunoId) {
      const vigente = [...data]
        .filter((item) => item.alunoId === alunoId && item.status === "em_andamento")
        .sort((a, b) => (a.dataInicio < b.dataInicio ? 1 : -1))[0];
      return vigente ?? null;
    },
  };
}

const base: InsertContratoNivel = {
  contratoId: 10,
  alunoId: 20,
  nivel: "I",
  dataInicio: "2026-01-01",
  dataFim: "2026-03-31",
  dataFechamentoOperacional: "2026-04-05",
  dataLimiteAjustes: "2026-04-10",
  status: "planejado",
  assessmentPdiId: null,
  mentoraPrincipalId: null,
};

describe("Contrato Níveis - Fase 1", () => {
  it("criação de nível aprovada (nível I e assessmentPdiId nulo)", async () => {
    const repo = makeInMemoryRepo();
    const id = await createContratoNivelRepo(repo, {
      ...base,
      nivel: "I",
      status: "em_andamento",
      assessmentPdiId: null,
    });

    const historico = await getContratoNiveisByAlunoRepo(repo, base.alunoId);
    const created = historico.find((item) => item.id === id);

    expect(created).toBeDefined();
    expect(created?.nivel).toBe("I");
    expect(created?.assessmentPdiId).toBeNull();
  });

  it("busca nível vigente aprovada", async () => {
    const repo = makeInMemoryRepo();

    await createContratoNivelRepo(repo, { ...base, nivel: "I", status: "encerrado" });
    const vigenteId = await createContratoNivelRepo(repo, {
      ...base,
      nivel: "II",
      status: "em_andamento",
      dataInicio: "2026-04-01",
      dataFim: "2026-06-30",
    });

    const vigente = await getContratoNivelVigenteByAlunoRepo(repo, base.alunoId);
    expect(vigente?.id).toBe(vigenteId);
    expect(vigente?.status).toBe("em_andamento");
  });

  it("histórico de níveis aprovado (múltiplos níveis + ordenação)", async () => {
    const repo = makeInMemoryRepo();

    const idI = await createContratoNivelRepo(repo, { ...base, nivel: "I", status: "encerrado" });
    const idII = await createContratoNivelRepo(repo, {
      ...base,
      nivel: "II",
      status: "planejado",
      dataInicio: "2026-04-01",
      dataFim: "2026-06-30",
      dataFechamentoOperacional: "2026-07-05",
      dataLimiteAjustes: "2026-07-10",
    });

    const historico = await getContratoNiveisByAlunoRepo(repo, base.alunoId);
    expect(historico[0]?.id).toBe(idII);
    expect(historico[1]?.id).toBe(idI);

    const porContrato = await getContratoNiveisByContratoRepo(repo, base.contratoId);
    expect(porContrato.map((x) => x.id)).toEqual([idI, idII]);
  });

  it("bloqueio de duplicidade de nível em andamento aprovado", async () => {
    const repo = makeInMemoryRepo();

    await createContratoNivelRepo(repo, { ...base, status: "em_andamento" });

    await expect(
      createContratoNivelRepo(repo, {
        ...base,
        nivel: "II",
        dataInicio: "2026-04-01",
        dataFim: "2026-06-30",
        dataFechamentoOperacional: "2026-07-05",
        dataLimiteAjustes: "2026-07-10",
        status: "em_andamento",
      })
    ).rejects.toThrow("Já existe um nível em andamento");

    const unico = await validarNivelEmAndamentoUnicoRepo(repo, base.contratoId, base.alunoId);
    expect(unico).toBe(false);
  });

  it("consistência de datas aprovada (dataInicio < dataFim)", () => {
    expect(() => assertContratoNivelDateConsistency("2026-01-01", "2026-03-31")).not.toThrow();
    expect(() => assertContratoNivelDateConsistency("2026-04-10", "2026-04-10")).toThrow(
      "data de início"
    );
  });
});
