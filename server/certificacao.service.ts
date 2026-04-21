export type NivelCertificacao = "I" | "II" | "III" | "IV";

export interface ElegibilidadeInput {
  statusOperacional: string | null | undefined;
  resultadoFinalFechado: boolean;
  engajamento: number;
  desafios: number;
  evidencias: number;
}

export interface ElegibilidadeOutput {
  elegivel: boolean;
  criterios: {
    nivelEncerrado: boolean;
    resultadoFinalFechado: boolean;
    engajamentoMin80: boolean;
    desafiosMin80: boolean;
    evidenciasMinimas: boolean;
  };
  metricas: {
    engajamento: number;
    desafios: number;
    evidencias: number;
  };
  motivo: string;
}

export function calcularElegibilidadeCertificacao(input: ElegibilidadeInput): ElegibilidadeOutput {
  const criterios = {
    nivelEncerrado: input.statusOperacional === "encerrado",
    resultadoFinalFechado: input.resultadoFinalFechado,
    engajamentoMin80: input.engajamento >= 80,
    desafiosMin80: input.desafios >= 80,
    evidenciasMinimas: input.evidencias > 0,
  };

  const elegivel =
    criterios.nivelEncerrado &&
    criterios.resultadoFinalFechado &&
    criterios.engajamentoMin80 &&
    criterios.desafiosMin80 &&
    criterios.evidenciasMinimas;

  const motivos: string[] = [];
  if (!criterios.nivelEncerrado) motivos.push("Nível não está encerrado.");
  if (!criterios.resultadoFinalFechado) motivos.push("Resultado final do nível não está fechado.");
  if (!criterios.engajamentoMin80) motivos.push("Engajamento final abaixo de 80%.");
  if (!criterios.desafiosMin80) motivos.push("Desafios concluídos abaixo de 80%.");
  if (!criterios.evidenciasMinimas) motivos.push("Sem evidências/cases entregues no nível.");

  return {
    elegivel,
    criterios,
    metricas: {
      engajamento: Number(input.engajamento.toFixed(2)),
      desafios: Number(input.desafios.toFixed(2)),
      evidencias: input.evidencias,
    },
    motivo: motivos.join(" "),
  };
}

export interface EmissaoPreconditionsInput {
  certificadoExistente: boolean;
  elegivel: boolean;
  motivoElegibilidade?: string;
  templateAtivo: boolean;
  assinaturaGerente: boolean;
  assinaturaGestorMaster: boolean;
  assinaturaMentora: boolean;
  totalMentorasNivel: number;
}

export function validarPrecondicoesEmissaoCertificacao(input: EmissaoPreconditionsInput): void {
  if (input.certificadoExistente) {
    throw new Error("Já existe certificado emitido para este nível.");
  }
  if (!input.elegivel) {
    throw new Error(input.motivoElegibilidade || "Nível não elegível para certificação.");
  }
  if (!input.templateAtivo) {
    throw new Error("Sem template ativo para este nível.");
  }
  if (!input.assinaturaGerente || !input.assinaturaGestorMaster || !input.assinaturaMentora) {
    throw new Error("Assinaturas obrigatórias (gerente/mentora/gestor_master) ausentes.");
  }
  if (input.totalMentorasNivel <= 0) {
    throw new Error("Nenhuma mentora válida encontrada no nível.");
  }
}

export function mapHistoricoCertificado(certificado: any) {
  if (!certificado) return null;
  return {
    id: certificado.id,
    status: certificado.status,
    arquivoUrl: certificado.arquivoUrl,
    emitidoEm: certificado.emitidoEm,
    hashDocumento: certificado.hashDocumento,
  };
}
