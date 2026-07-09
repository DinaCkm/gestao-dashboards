/**
 * EcoDISC 360 - Calculo do Perfil DISC da Cultura da Empresa.
 * Calculo matematico e rastreavel (sem uso de IA) a partir das
 * respostas ao questionario de Cultura Comportamental (Opcao A) ou
 * validado por preenchimento manual do RH/admin (Opcao B).
 */
import { determinarPerfil, calcularIndiceConcordancia, type DiscScores, type ClassificacaoConcordancia } from "./discMatchService";
import { DISC360_CULTURE_QUESTIONS, type Disc360CultureDimension } from "../shared/disc360CultureQuestions";

export type RespostaCultura = {
  questionId: string;
  dimensao: Disc360CultureDimension;
};

export type ResultadoIndividualCultura = {
  scores: DiscScores;
  perfilPredominante: string;
  perfilSecundario: string;
  perfilSugerido: string;
  totalRespondidas: number;
};

/**
 * Calcula o resultado de UM respondente do questionario de cultura.
 * Cada pergunta respondida soma 1 ponto para a dimensao escolhida;
 * o percentual de cada dimensao e pontos/total de perguntas respondidas.
 */
export function calcularDiscCulturaEmpresa(respostas: RespostaCultura[]): ResultadoIndividualCultura {
  const pontos: DiscScores = { D: 0, I: 0, S: 0, C: 0 };
  for (const resposta of respostas) {
    pontos[resposta.dimensao] += 1;
  }
  const total = respostas.length || 1;
  const scores: DiscScores = {
    D: Math.round((pontos.D / total) * 10000) / 100,
    I: Math.round((pontos.I / total) * 10000) / 100,
    S: Math.round((pontos.S / total) * 10000) / 100,
    C: Math.round((pontos.C / total) * 10000) / 100,
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

export type StatusConsistencia = "previa" | "suficiente";

export type ResultadoConsolidadoCultura = {
  scoresMedios: DiscScores;
  perfilPredominante: string;
  perfilSecundario: string;
  perfilSugerido: string;
  totalRespondentes: number;
  statusConsistencia: StatusConsistencia;
  indiceConcordancia: number;
  classificacaoConcordancia: ClassificacaoConcordancia;
  textoConcordancia: string;
};

export const MINIMO_RESPONDENTES_OFICIAL = 5;

const TEXTOS_CONCORDANCIA: Record<ClassificacaoConcordancia, string> = {
  alta: "Os respondentes apresentam percepções bastante alinhadas sobre a cultura da empresa, o que aumenta a confiabilidade do perfil resultante.",
  media: "Os respondentes apresentam algumas divergências na percepção da cultura, o que é normal, mas vale revisar se há grupos com visões bem diferentes.",
  baixa: "Os respondentes apresentam percepções bastante diferentes sobre a cultura da empresa. Recomenda-se revisar quem foi convidado a responder e, se possível, ampliar ou qualificar a amostra antes de validar o perfil oficial.",
};

/**
 * Consolida o Perfil DISC da Empresa a partir dos resultados individuais
 * de todos os respondentes elegiveis que ja concluiram o questionario.
 * statusConsistencia reflete a QUANTIDADE de respondentes (>=5 = suficiente).
 * classificacaoConcordancia reflete o QUANTO os respondentes concordam entre
 * si (alta/media/baixa) - as duas informacoes sao complementares: e possivel
 * ter quantidade suficiente e ainda assim baixa concordancia.
 */
export function calcularDiscEmpresaConsolidado(resultadosRespondentes: DiscScores[]): ResultadoConsolidadoCultura {
  const totalRespondentes = resultadosRespondentes.length;
  const dimensoes: (keyof DiscScores)[] = ["D", "I", "S", "C"];
  const scoresMedios: DiscScores = { D: 0, I: 0, S: 0, C: 0 };
  if (totalRespondentes > 0) {
    for (const dim of dimensoes) {
      const soma = resultadosRespondentes.reduce((acc, r) => acc + r[dim], 0);
      scoresMedios[dim] = Math.round((soma / totalRespondentes) * 100) / 100;
    }
  }
  const perfil = determinarPerfil(scoresMedios);
  const { diferencaMedia, classificacao } = calcularIndiceConcordancia(resultadosRespondentes, scoresMedios);
  const statusConsistencia: StatusConsistencia = totalRespondentes >= MINIMO_RESPONDENTES_OFICIAL ? "suficiente" : "previa";

  return {
    scoresMedios,
    perfilPredominante: perfil.predominante,
    perfilSecundario: perfil.secundario,
    perfilSugerido: perfil.sugerido,
    totalRespondentes,
    statusConsistencia,
    indiceConcordancia: diferencaMedia,
    classificacaoConcordancia: classificacao,
    textoConcordancia:
      totalRespondentes < MINIMO_RESPONDENTES_OFICIAL
        ? "Resultado preliminar: apenas " + totalRespondentes + " de " + MINIMO_RESPONDENTES_OFICIAL + " respondentes recomendados ate agora. Ainda nao e possivel avaliar com confianca o grau de concordancia entre as percepcoes - aguarde mais respostas antes de validar o perfil oficial."
        : TEXTOS_CONCORDANCIA[classificacao],
  };
}

/**
 * Valida se um preenchimento manual (D+I+S+C) soma 100, com tolerancia
 * de arredondamento de 0.5 ponto.
 */
export function validarSomaManual(scores: DiscScores): { valido: boolean; soma: number } {
  const soma = Math.round((scores.D + scores.I + scores.S + scores.C) * 100) / 100;
  return { valido: Math.abs(soma - 100) <= 0.5, soma };
}

export { DISC360_CULTURE_QUESTIONS };
