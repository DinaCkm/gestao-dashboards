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

export type PredominanciaTema = {
  questionId: string;
  contagem: DiscScores;
  totalRespostas: number;
  eixoPredominante: Disc360CultureDimension;
  classificacaoConsenso: "unanime" | "majoritaria" | "dividida";
};

/**
 * Para cada pergunta do questionario de cultura, identifica qual eixo
 * comportamental (D/I/S/C) foi mais escolhido entre os respondentes e
 * classifica o nivel de consenso:
 * - unanime: todos os respondentes escolheram o mesmo eixo;
 * - majoritaria: um eixo teve mais escolhas que os demais, sem ser unanime;
 * - dividida: houve empate entre dois ou mais eixos.
 */
export function calcularPredominanciaPorTema(
  todasRespostas: { questionId: string; dimensao: Disc360CultureDimension }[]
): PredominanciaTema[] {
  const porPergunta = new Map<string, DiscScores>();

  for (const resposta of todasRespostas) {
    if (!porPergunta.has(resposta.questionId)) {
      porPergunta.set(resposta.questionId, { D: 0, I: 0, S: 0, C: 0 });
    }
    porPergunta.get(resposta.questionId)![resposta.dimensao] += 1;
  }

  const dimensoes: Disc360CultureDimension[] = ["D", "I", "S", "C"];
  const resultado: PredominanciaTema[] = [];

  for (const [questionId, contagem] of porPergunta.entries()) {
    const totalRespostas = contagem.D + contagem.I + contagem.S + contagem.C;
    const maiorValor = Math.max(contagem.D, contagem.I, contagem.S, contagem.C);
    const empatados = dimensoes.filter((dim) => contagem[dim] === maiorValor);
    const eixoPredominante = empatados[0];

    let classificacaoConsenso: "unanime" | "majoritaria" | "dividida";
    if (empatados.length > 1) {
      classificacaoConsenso = "dividida";
    } else if (totalRespostas > 0 && maiorValor === totalRespostas) {
      classificacaoConsenso = "unanime";
    } else {
      classificacaoConsenso = "majoritaria";
    }

    resultado.push({
      questionId,
      contagem,
      totalRespostas,
      eixoPredominante,
      classificacaoConsenso,
    });
  }

  return resultado.sort((a, b) =>
    a.questionId.localeCompare(b.questionId, undefined, { numeric: true })
  );
}

export type EixoTextoFaixa = {
  min: number;
  max: number;
  texto: string;
};

/**
 * Banco de textos fixos (revisados por profissional DISC), um por eixo e
 * faixa de intensidade. O placeholder {{empresa}} e substituido pelo nome
 * real da empresa antes de ser exibido. Sem uso de IA - texto sempre
 * previsivel e rastreavel para o mesmo resultado calculado.
 */
const TEXTOS_EIXO_FAIXA: Record<Disc360CultureDimension, EixoTextoFaixa[]> = {
  D: [
    {
      min: 0,
      max: 25,
      texto:
        "A cultura da {{empresa}} parece dar pouco peso a urgencia e a tomada de decisao rapida. Isso pode significar um ambiente mais deliberativo, em que decisoes sao amadurecidas com calma - mas vale observar se isso nao esta gerando lentidao em momentos que pedem agilidade.",
    },
    {
      min: 26,
      max: 50,
      texto:
        "Ha uma presenca moderada de foco em resultado e decisao rapida na cultura percebida. A empresa parece equilibrar ritmo de execucao com outras prioridades, sem que a pressao por resultado domine o ambiente.",
    },
    {
      min: 51,
      max: 75,
      texto:
        "A cultura da {{empresa}} e percebida como orientada a resultados, com valorizacao de decisoes rapidas e foco em metas. Esse traco tende a impulsionar a execucao, mas pode exigir atencao para que o ritmo nao gere desgaste nas equipes.",
    },
    {
      min: 76,
      max: 100,
      texto:
        "A cultura percebida e fortemente orientada a resultado, ritmo e decisao rapida. Esse e um traco que costuma impulsionar entregas e superacao de metas, mas em intensidade muito alta pode sinalizar pressao excessiva ou pouca tolerancia a pausas para reflexao - vale um olhar atento sobre isso.",
    },
  ],
  I: [
    {
      min: 0,
      max: 25,
      texto:
        "A comunicacao aberta e o reconhecimento publico parecem ter pouco espaco na cultura percebida. Isso pode indicar um ambiente mais reservado ou formal - o que nao e necessariamente negativo, mas pode dificultar a troca espontanea entre as pessoas.",
    },
    {
      min: 26,
      max: 50,
      texto:
        "Ha um equilibrio moderado entre formalidade e abertura na comunicacao. A cultura percebida valoriza relacionamento e reconhecimento, mas sem que isso seja o traco dominante do ambiente.",
    },
    {
      min: 51,
      max: 75,
      texto:
        "A cultura da {{empresa}} e percebida como comunicativa e voltada ao relacionamento, com valorizacao do reconhecimento e da troca entre pessoas. Isso tende a favorecer engajamento e clima positivo.",
    },
    {
      min: 76,
      max: 100,
      texto:
        "A cultura percebida e marcadamente comunicativa, entusiasmada e voltada ao relacionamento. Esse traco costuma gerar um ambiente energizado e colaborativo, mas em intensidade muito alta pode sinalizar dificuldade em lidar com temas mais formais, tecnicos ou de menor visibilidade.",
    },
  ],
  S: [
    {
      min: 0,
      max: 25,
      texto:
        "A cultura percebida parece dar pouco valor a estabilidade e a previsibilidade. Isso pode refletir um ambiente mais dinamico e sujeito a mudancas frequentes - o que pede atencao redobrada para manter as pessoas alinhadas durante transicoes.",
    },
    {
      min: 26,
      max: 50,
      texto:
        "Ha uma presenca moderada de estabilidade e cooperacao na cultura percebida. A empresa parece conseguir se adaptar a mudancas sem abrir mao de uma certa previsibilidade no dia a dia.",
    },
    {
      min: 51,
      max: 75,
      texto:
        "A cultura da {{empresa}} e percebida como estavel e cooperativa, com valorizacao da continuidade e do trabalho em equipe de forma constante. Isso tende a gerar seguranca e senso de pertencimento.",
    },
    {
      min: 76,
      max: 100,
      texto:
        "A cultura percebida e fortemente estavel, paciente e cooperativa. Esse traco costuma fortalecer a confianca e a continuidade das relacoes, mas em intensidade muito alta pode indicar resistencia a mudancas ou dificuldade em se adaptar rapidamente quando necessario.",
    },
  ],
  C: [
    {
      min: 0,
      max: 25,
      texto:
        "Regras, processos e padroes formais parecem ter pouco peso na cultura percebida. Isso pode indicar um ambiente mais flexivel e informal - o que pede atencao para garantir consistencia e qualidade em processos criticos.",
    },
    {
      min: 26,
      max: 50,
      texto:
        "Ha uma presenca moderada de estrutura e processo na cultura percebida. A empresa parece equilibrar flexibilidade com algum nivel de padronizacao, sem que a formalidade seja o traco dominante.",
    },
    {
      min: 51,
      max: 75,
      texto:
        "A cultura da {{empresa}} e percebida como estruturada, com valorizacao de processos, qualidade e conformidade a normas. Isso tende a gerar consistencia e previsibilidade nas entregas.",
    },
    {
      min: 76,
      max: 100,
      texto:
        "A cultura percebida e fortemente estruturada, criteriosa e voltada a processos e normas. Esse traco costuma garantir qualidade e consistencia, mas em intensidade muito alta pode sinalizar excesso de burocracia ou resistencia a solucoes fora do padrao.",
    },
  ],
};

/**
 * Retorna o texto fixo correspondente ao eixo e percentual calculado,
 * com {{empresa}} ja substituido pelo nome informado.
 */
export function obterTextoEixoFaixa(
  eixo: Disc360CultureDimension,
  percentual: number,
  nomeEmpresa: string
): string {
  const faixas = TEXTOS_EIXO_FAIXA[eixo];
  const faixa =
    faixas.find((f) => percentual >= f.min && percentual <= f.max) ?? faixas[faixas.length - 1];
  return faixa.texto.replace(/\{\{empresa\}\}/g, nomeEmpresa);
}
