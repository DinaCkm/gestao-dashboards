import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import * as db from "./db";
import { contratoNiveis, contratosAluno } from "../drizzle/schema";

describe("Contrato Níveis - Fase 1", () => {
  const integrationEnabled = Boolean(process.env.DATABASE_URL);
  const createdContratoIds: number[] = [];
  const createdNivelIds: number[] = [];

  async function createContratoBase() {
    const alunos = await db.getAlunos();
    expect(alunos.length).toBeGreaterThan(0);

    const aluno = alunos.find((a) => a.programId) ?? alunos[0];
    const contractId = await db.createContrato({
      alunoId: aluno.id,
      programId: aluno.programId ?? 1,
      turmaId: aluno.turmaId ?? null,
      periodoInicio: "2026-01-01",
      periodoTermino: "2026-12-31",
      totalSessoesContratadas: 12,
      observacoes: "Contrato teste níveis",
      criadoPor: null,
      isActive: 1,
    });

    createdContratoIds.push(contractId);
    return { alunoId: aluno.id, contratoId: contractId };
  }

  afterAll(async () => {
    const client = await db.getDb();
    if (!client) return;

    for (const nivelId of createdNivelIds) {
      await client.delete(contratoNiveis).where(eq(contratoNiveis.id, nivelId));
    }

    for (const contratoId of createdContratoIds) {
      await client.delete(contratosAluno).where(eq(contratosAluno.id, contratoId));
    }
  });

  it("exporta funções de contrato_niveis no backend", () => {
    expect(typeof db.createContratoNivel).toBe("function");
    expect(typeof db.getContratoNiveisByAluno).toBe("function");
    expect(typeof db.getContratoNivelVigenteByAluno).toBe("function");
    expect(typeof db.getContratoNiveisByContrato).toBe("function");
    expect(typeof db.validarNivelEmAndamentoUnico).toBe("function");
  });

  it.skipIf(!integrationEnabled)("cria nível I com assessmentPdiId nulo", async () => {
    const { alunoId, contratoId } = await createContratoBase();

    const nivelId = await db.createContratoNivel({
      contratoId,
      alunoId,
      nivel: "I",
      dataInicio: "2026-01-01",
      dataFim: "2026-03-31",
      dataFechamentoOperacional: "2026-04-05",
      dataLimiteAjustes: "2026-04-10",
      status: "em_andamento",
      assessmentPdiId: null,
      mentoraPrincipalId: null,
    });

    createdNivelIds.push(nivelId);

    const historico = await db.getContratoNiveisByAluno(alunoId);
    const created = historico.find((item) => item.id === nivelId);

    expect(created).toBeDefined();
    expect(created?.nivel).toBe("I");
    expect(created?.assessmentPdiId).toBeNull();
  });

  it.skipIf(!integrationEnabled)("permite múltiplos níveis para um mesmo contrato e ordena histórico por dataInicio desc", async () => {
    const { alunoId, contratoId } = await createContratoBase();

    const nivelI = await db.createContratoNivel({
      contratoId,
      alunoId,
      nivel: "I",
      dataInicio: "2026-01-01",
      dataFim: "2026-03-31",
      dataFechamentoOperacional: "2026-04-05",
      dataLimiteAjustes: "2026-04-10",
      status: "encerrado",
      assessmentPdiId: null,
      mentoraPrincipalId: null,
    });

    const nivelII = await db.createContratoNivel({
      contratoId,
      alunoId,
      nivel: "II",
      dataInicio: "2026-04-01",
      dataFim: "2026-06-30",
      dataFechamentoOperacional: "2026-07-05",
      dataLimiteAjustes: "2026-07-10",
      status: "planejado",
      assessmentPdiId: null,
      mentoraPrincipalId: null,
    });

    createdNivelIds.push(nivelI, nivelII);

    const historico = await db.getContratoNiveisByAluno(alunoId);
    const indexNivelII = historico.findIndex((item) => item.id === nivelII);
    const indexNivelI = historico.findIndex((item) => item.id === nivelI);

    expect(indexNivelII).toBeGreaterThanOrEqual(0);
    expect(indexNivelI).toBeGreaterThanOrEqual(0);
    expect(indexNivelII).toBeLessThan(indexNivelI);

    const porContrato = await db.getContratoNiveisByContrato(contratoId);
    expect(porContrato.length).toBeGreaterThanOrEqual(2);
  });

  it.skipIf(!integrationEnabled)("busca nível vigente do aluno", async () => {
    const { alunoId, contratoId } = await createContratoBase();

    const nivelId = await db.createContratoNivel({
      contratoId,
      alunoId,
      nivel: "III",
      dataInicio: "2026-08-01",
      dataFim: "2026-10-31",
      dataFechamentoOperacional: "2026-11-05",
      dataLimiteAjustes: "2026-11-10",
      status: "em_andamento",
      assessmentPdiId: null,
      mentoraPrincipalId: null,
    });

    createdNivelIds.push(nivelId);

    const vigente = await db.getContratoNivelVigenteByAluno(alunoId);
    expect(vigente).not.toBeNull();
    expect(vigente?.id).toBe(nivelId);
    expect(vigente?.status).toBe("em_andamento");
  });

  it.skipIf(!integrationEnabled)("bloqueia dois níveis simultâneos em andamento no mesmo contrato", async () => {
    const { alunoId, contratoId } = await createContratoBase();

    const nivelId = await db.createContratoNivel({
      contratoId,
      alunoId,
      nivel: "I",
      dataInicio: "2026-01-01",
      dataFim: "2026-03-31",
      dataFechamentoOperacional: "2026-04-05",
      dataLimiteAjustes: "2026-04-10",
      status: "em_andamento",
      assessmentPdiId: null,
      mentoraPrincipalId: null,
    });

    createdNivelIds.push(nivelId);

    await expect(
      db.createContratoNivel({
        contratoId,
        alunoId,
        nivel: "II",
        dataInicio: "2026-04-01",
        dataFim: "2026-06-30",
        dataFechamentoOperacional: "2026-07-05",
        dataLimiteAjustes: "2026-07-10",
        status: "em_andamento",
        assessmentPdiId: null,
        mentoraPrincipalId: null,
      })
    ).rejects.toThrow("Já existe um nível em andamento");
  });

  it.skipIf(!integrationEnabled)("valida consistência de datas: dataInicio deve ser menor que dataFim", async () => {
    const { alunoId, contratoId } = await createContratoBase();

    await expect(
      db.createContratoNivel({
        contratoId,
        alunoId,
        nivel: "I",
        dataInicio: "2026-04-10",
        dataFim: "2026-04-10",
        dataFechamentoOperacional: "2026-04-15",
        dataLimiteAjustes: "2026-04-20",
        status: "planejado",
        assessmentPdiId: null,
        mentoraPrincipalId: null,
      })
    ).rejects.toThrow("data de início");
  });
});
