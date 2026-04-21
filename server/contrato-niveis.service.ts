import type { ContratoNivel, InsertContratoNivel } from "../drizzle/schema";

export type ContratoNivelStatus =
  | "planejado"
  | "em_andamento"
  | "fechamento"
  | "ajustes"
  | "encerrado"
  | "certificado";

export type ContratoNivelOperationalStatus =
  | "em_andamento"
  | "fechamento"
  | "ajustes"
  | "encerrado";

/**
 * ContratoNivel enriquecido com as datas vindas de contratos_aluno (fonte única).
 * dataInicio = contratos_aluno.periodoInicio
 * dataFim    = contratos_aluno.periodoTermino
 */
export type ContratoNivelComDatas = ContratoNivel & {
  dataInicio: string;
  dataFim: string;
};

export type ContratoNivelRepo = {
  findEmAndamento: (
    contratoId: number,
    alunoId: number,
    ignoreNivelId?: number
  ) => Promise<Array<Pick<ContratoNivel, "id">>>;
  insertNivel: (data: InsertContratoNivel) => Promise<number>;
  listByAluno: (alunoId: number) => Promise<ContratoNivelComDatas[]>;
  listByContrato: (contratoId: number) => Promise<ContratoNivelComDatas[]>;
  findVigenteByAluno: (alunoId: number) => Promise<ContratoNivelComDatas | null>;
};

const STATUS_EM_ANDAMENTO: ContratoNivelStatus = "em_andamento";
const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeDateOnly(value: string | Date) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("Data inválida");
    }
    return value.toISOString().split("T")[0];
  }
  return value;
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
  if (data.status === STATUS_EM_ANDAMENTO) {
    const canCreate = await validarNivelEmAndamentoUnicoRepo(repo, data.contratoId, data.alunoId);
    if (!canCreate) {
      throw new Error("Já existe um nível em andamento para este aluno neste contrato");
    }
  }
  return repo.insertNivel(data);
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

export function calcularDataFechamentoOperacional(dataFim: string | Date): string {
  const fim = new Date(normalizeDateOnly(dataFim));
  if (Number.isNaN(fim.getTime())) {
    throw new Error("Data final do nível inválida");
  }
  const fechamento = new Date(fim.getTime() - 15 * DAY_MS);
  return fechamento.toISOString().split("T")[0];
}

export function getContratoNivelOperationalStatus(
  nivel: Pick<ContratoNivelComDatas, "status" | "dataFim">,
  referenceDate = new Date()
): ContratoNivelOperationalStatus {
  const hoje = new Date(referenceDate.toISOString().split("T")[0]);
  const dataFim = new Date(normalizeDateOnly(nivel.dataFim));
  const dataFechamento = new Date(calcularDataFechamentoOperacional(nivel.dataFim));

  if (!Number.isNaN(dataFim.getTime()) && hoje >= dataFim) {
    return "encerrado";
  }

  if (!Number.isNaN(dataFechamento.getTime()) && hoje >= dataFechamento) {
    if (nivel.status === "ajustes") return "ajustes";
    return "fechamento";
  }

  return "em_andamento";
}

export function isContratoNivelBloqueadoParaNovasAtribuicoes(status: ContratoNivelOperationalStatus): boolean {
  return status === "fechamento" || status === "ajustes" || status === "encerrado";
}

export function isContratoNivelEncerrado(status: ContratoNivelOperationalStatus): boolean {
  return status === "encerrado";
}
