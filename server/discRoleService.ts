import { determinarPerfil, type DiscScores } from "./discMatchService";
import type { Disc360RoleDimension } from "../shared/disc360RoleQuestions";

export type RespostaRole = {
  questionId: string;
  maisDimensao: Disc360RoleDimension;
  menosDimensao: Disc360RoleDimension;
};

export type ResultadoIndividualRole = {
  scores: DiscScores;
  perfilPredominante: string;
  perfilSecundario: string;
  perfilSugerido: string;
  totalRespondidas: number;
};

/**
 * Calcula o resultado de UM respondente do questionario de Perfil do Cargo,
 * no mesmo modelo ipsativo (mais/menos) usado na Cultura da Empresa e no
 * DISC legado. Cada bloco soma 1 ponto bruto para o eixo "mais" e subtrai
 * 1 ponto bruto do eixo "menos". O score bruto (de -total a +total) e
 * reescalado de forma independente para 0-100 por eixo.
 */
export function calcularDiscCargo(respostas: RespostaRole[]): ResultadoIndividualRole {
  const bruto: DiscScores = { D: 0, I: 0, S: 0, C: 0 };
  for (const resposta of respostas) {
    bruto[resposta.maisDimensao] += 1;
    bruto[resposta.menosDimensao] -= 1;
  }
  const total = respostas.length || 1;
  const scores: DiscScores = {
    D: Math.round(((bruto.D + total) / (2 * total)) * 10000) / 100,
    I: Math.round(((bruto.I + total) / (2 * total)) * 10000) / 100,
    S: Math.round(((bruto.S + total) / (2 * total)) * 10000) / 100,
    C: Math.round(((bruto.C + total) / (2 * total)) * 10000) / 100,
  };
  const perfil = determinarPerfil(scores);
  return {
    scores,
    perfilPredominante: perfil.predominante,
    perfilSecundario: perfil.secundario,
    perfilSugerido: perfil.sugerido,
    totalRespondidas: respostas.length,
  };
}

// Diferenca (em pontos) entre a regua de validacao e o D calculado pelas
// escolhas forcadas, acima da qual acende um alerta de possivel
// tendenciosidade/inconsistencia na resposta do respondente.
export const DISC360_ROLE_ALERTA_LIMITE_DIVERGENCIA = 30;

export type AvaliacaoDivergenciaValidacao = {
  divergente: boolean;
  diferenca: number | null;
  texto: string | null;
};

/**
 * Compara a resposta da regua de validacao (0-100, percepcao direta do
 * respondente) com o D calculado pelas escolhas forcadas do MESMO
 * respondente. Se divergirem muito, sinaliza possivel tendenciosidade.
 */
export function avaliarDivergenciaValidacao(
  scoreD: number,
  respostaValidacaoDireta: number | null | undefined,
  limite: number = DISC360_ROLE_ALERTA_LIMITE_DIVERGENCIA
): AvaliacaoDivergenciaValidacao {
  if (respostaValidacaoDireta === null || respostaValidacaoDireta === undefined) {
    return { divergente: false, diferenca: null, texto: null };
  }
  const diferenca = Math.round(Math.abs(respostaValidacaoDireta - scoreD));
  if (diferenca > limite) {
    const leituraRegua =
      respostaValidacaoDireta >= 50 ? "mais direto/assertivo" : "mais cauteloso/diplomático";
    return {
      divergente: true,
      diferenca,
      texto: `Atenção: a resposta da régua (${respostaValidacaoDireta} = ${leituraRegua}) diverge do D calculado pelas escolhas forçadas (${scoreD}). Reveja essa resposta com atenção.`,
    };
  }
  return { divergente: false, diferenca, texto: null };
}
