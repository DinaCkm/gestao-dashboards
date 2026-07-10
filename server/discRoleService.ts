import { determinarPerfil, type DiscScores } from "./discMatchService";
import type { Disc360RoleDimension } from "../shared/disc360RoleQuestions";
import { DISC360_ROLE_VALIDACAO_QUESTIONS } from "../shared/disc360RoleQuestions";

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

// Diferenca (em pontos) entre a regua de validacao e o score calculado do
// mesmo eixo pelas escolhas forcadas, acima da qual acende um alerta de
// possivel tendenciosidade/inconsistencia na resposta do respondente.
export const DISC360_ROLE_ALERTA_LIMITE_DIVERGENCIA = 30;

export type RespostaValidacaoCargo = {
  D: number;
  I: number;
  S: number;
  C: number;
};

export type AvaliacaoDivergenciaEixo = {
  dimensao: Disc360RoleDimension;
  divergente: boolean;
  diferenca: number;
  texto: string | null;
};

/**
 * Compara, EIXO A EIXO, a regua de validacao (0-100, percepcao direta do
 * respondente) com o score calculado pelas escolhas forcadas do MESMO
 * respondente. Se algum eixo divergir muito, sinaliza possivel
 * tendenciosidade naquele eixo especificamente.
 */
export function avaliarDivergenciaValidacao(
  scores: DiscScores,
  respostaValidacao: RespostaValidacaoCargo,
  limite: number = DISC360_ROLE_ALERTA_LIMITE_DIVERGENCIA
): AvaliacaoDivergenciaEixo[] {
  const dimensoes: Disc360RoleDimension[] = ["D", "I", "S", "C"];
  return dimensoes.map((dimensao) => {
    const diferenca = Math.round(Math.abs(respostaValidacao[dimensao] - scores[dimensao]));
    if (diferenca > limite) {
      return {
        dimensao,
        divergente: true,
        diferenca,
        texto: `Atenção: a régua de ${dimensao} (${respostaValidacao[dimensao]}) diverge do ${dimensao} calculado pelas escolhas forçadas (${scores[dimensao]}). Reveja essa resposta com atenção.`,
      };
    }
    return { dimensao, divergente: false, diferenca, texto: null };
  });
}

// Retorna o rotulo e o texto de interpretacao da faixa (0-25/26-50/51-75/76-100)
// em que um score medio de eixo do CARGO se encaixa, reaproveitando os
// mesmos textos por faixa escritos para as perguntas de validacao (regua).
export function obterFaixaTextoCargo(
  dimensao: Disc360RoleDimension,
  valor: number
): { label: string; texto: string } {
  const questao = DISC360_ROLE_VALIDACAO_QUESTIONS.find((q) => q.dimensao === dimensao);
  const faixa = questao?.faixas.find((f) => valor >= f.min && valor <= f.max);
  return {
    label: faixa?.label ?? "",
    texto: faixa?.texto ?? "",
  };
}
