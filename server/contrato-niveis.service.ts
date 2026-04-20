import type { ContratoNivel, InsertContratoNivel } from "../drizzle/schema";

export type ContratoNivelStatus =
  | "planejado"
  | "em_andamento"
  | "fechamento"
  | "ajustes"
  | "encerrado"
  | "certificado";

export type ContratoNivelRepo = {
  findEmAndamento: (
    contratoId: number,
    alunoId: number,
    ignoreNivelId?: number
  ) => Promise<Array<Pick<ContratoNivel, "id">>>;
  insertNivel: (data: InsertContratoNivel) => Promise<number>;
  listByAluno: (alunoId: number) => Promise<ContratoNivel[]>;
  listByContrato: (contratoId: number) => Promise<ContratoNivel[]>;
  findVigenteByAluno: (alunoId: number) => Promise<ContratoNivel | null>;
};

const STATUS_EM_ANDAMENTO: ContratoNivelStatus = "em_andamento";

function normalizeDateOnly(value: string | Date) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("Data inválida");
    }
    return value.toISOString().split("T")[0];
  }
  return value;
}

export function assertContratoNivelDateConsistency(dataInicio: string | Date, dataFim: string | Date) {
  const inicio = new Date(normalizeDateOnly(dataInicio));
  const fim = new Date(normalizeDateOnly(dataFim));
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    throw new Error("Datas do nível inválidas");
  }
  if (inicio >= fim) {
    throw new Error("A data de início do nível deve ser menor que a data de fim");
  }
}

export async function validarNivelEmAndamentoUnicoRepo(
  repo: ContratoNivelRepo,
  contratoId: number,
  alunoId: number,
  ignoreNivelId?: number
) {
  const existing = await repo.findEmAndamento(contratoId, alunoId, ignoreNivelId);
  return existing.length === 0;
}

export async function createContratoNivelRepo(repo: ContratoNivelRepo, data: InsertContratoNivel) {
  assertContratoNivelDateConsistency(data.dataInicio, data.dataFim);

  if (data.status === STATUS_EM_ANDAMENTO) {
    const canCreate = await validarNivelEmAndamentoUnicoRepo(repo, data.contratoId, data.alunoId);
    if (!canCreate) {
      throw new Error("Já existe um nível em andamento para este aluno neste contrato");
    }
  }

  return repo.insertNivel({
    ...data,
    dataInicio: normalizeDateOnly(data.dataInicio),
    dataFim: normalizeDateOnly(data.dataFim),
    dataFechamentoOperacional: normalizeDateOnly(data.dataFechamentoOperacional),
    dataLimiteAjustes: normalizeDateOnly(data.dataLimiteAjustes),
  });
}

export async function getContratoNiveisByAlunoRepo(repo: ContratoNivelRepo, alunoId: number) {
  return repo.listByAluno(alunoId);
}

export async function getContratoNiveisByContratoRepo(repo: ContratoNivelRepo, contratoId: number) {
  return repo.listByContrato(contratoId);
}

export async function getContratoNivelVigenteByAlunoRepo(repo: ContratoNivelRepo, alunoId: number) {
  return repo.findVigenteByAluno(alunoId);
}
