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
  maisDimensao: Disc360CultureDimension;
  menosDimensao: Disc360CultureDimension;
};

export type ResultadoIndividualCultura = {
  scores: DiscScores;
  perfilPredominante: string;
  perfilSecundario: string;
  perfilSugerido: string;
  totalRespondidas: number;
};

/**
 * Calcula o resultado de UM respondente do questionario de cultura,
 * no modelo ipsativo (mais/menos) - o mesmo usado no DISC legado.
 * Cada pergunta soma 1 ponto bruto para o eixo escolhido como "mais"
 * e subtrai 1 ponto bruto do eixo escolhido como "menos". O score bruto
 * de cada eixo (de -total a +total) e reescalado de forma independente
 * para 0-100, onde 50 representa equilibrio entre mais e menos.
 */
export function calcularDiscCulturaEmpresa(respostas: RespostaCultura[]): ResultadoIndividualCultura {
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
 * comportamental (D/I/S/C) predomina entre os respondentes (no modelo
 * ipsativo mais/menos) e classifica o nivel de consenso:
 * - unanime: todos os respondentes escolheram o mesmo eixo como "mais",
 *   e nenhum escolheu esse eixo como "menos";
 * - majoritaria: um eixo teve o maior saldo (mais - menos), sem ser unanime;
 * - dividida: houve empate entre dois ou mais eixos.
 */
export function calcularPredominanciaPorTema(
  todasRespostas: { questionId: string; maisDimensao: Disc360CultureDimension; menosDimensao: Disc360CultureDimension }[]
): PredominanciaTema[] {
  const porPergunta = new Map<string, DiscScores>();
  const totalPorPergunta = new Map<string, number>();

  for (const resposta of todasRespostas) {
    if (!porPergunta.has(resposta.questionId)) {
      porPergunta.set(resposta.questionId, { D: 0, I: 0, S: 0, C: 0 });
      totalPorPergunta.set(resposta.questionId, 0);
    }
    const contagem = porPergunta.get(resposta.questionId)!;
    contagem[resposta.maisDimensao] += 1;
    contagem[resposta.menosDimensao] -= 1;
    totalPorPergunta.set(resposta.questionId, (totalPorPergunta.get(resposta.questionId) ?? 0) + 1);
  }

  const dimensoes: Disc360CultureDimension[] = ["D", "I", "S", "C"];
  const resultado: PredominanciaTema[] = [];

  for (const [questionId, contagem] of porPergunta.entries()) {
    const totalRespostas = totalPorPergunta.get(questionId) ?? 0;
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

const TEXTOS_EIXO_FAIXA: Record<Disc360CultureDimension, EixoTextoFaixa[]> = {
  D: [
    {
      min: 0,
      max: 25,
      texto:
        "A cultura da {{empresa}} tende a decidir de forma mais cautelosa, buscando validacao e ponderacao antes de agir, com menor confronto direto. Essa baixa intensidade nao significa ausencia de conducao: pode indicar uma forma de conduzir mais diplomatica e reguladora pela seguranca. O ponto de atencao e observar se essa cautela nao gera demora em decisoes que exigem urgencia.",
    },
    {
      min: 26,
      max: 50,
      texto:
        "A cultura da {{empresa}} parece equilibrar velocidade de decisao com ponderacao - nem tudo e decidido rapidamente, nem tudo passa por analise prolongada. Isso costuma permitir adaptar o ritmo conforme a urgencia real de cada situacao, embora possa gerar percepcao de ritmos diferentes entre areas.",
    },
    {
      min: 51,
      max: 75,
      texto:
        "A cultura da {{empresa}} tende a decidir com objetividade, buscar resultado e assumir responsabilidade diante de desafios, o que costuma acelerar entregas e fortalecer o senso de protagonismo. Vale cuidar da escuta antes de decisoes que afetam varias pessoas ou areas.",
    },
    {
      min: 76,
      max: 100,
      texto:
        "A cultura percebida e fortemente marcada por decisao rapida, foco em superacao de metas e disposicao para enfrentar problemas diretamente. Essa forca pode se tornar um ponto de atencao quando avanca sem escuta suficiente, gerando pressao excessiva, impaciencia com o ritmo alheio ou desgaste nas relacoes.",
    },
  ],
  I: [
    {
      min: 0,
      max: 25,
      texto:
        "A comunicacao na cultura da {{empresa}} tende a se expressar de forma mais objetiva, tecnica e reservada, com menor exposicao social. Isso nao indica ausencia de influencia: ela pode ocorrer pela consistencia, pela competencia tecnica e pela entrega, em vez do entusiasmo aberto. Vale observar se essa reserva nao esta gerando baixa mobilizacao em momentos de mudanca.",
    },
    {
      min: 26,
      max: 50,
      texto:
        "Ha um equilibrio entre objetividade e abertura na comunicacao da {{empresa}} - a cultura parece valorizar tanto o conteudo tecnico quanto alguma construcao de relacionamento, sem que um dos dois predomine amplamente.",
    },
    {
      min: 51,
      max: 75,
      texto:
        "A cultura da {{empresa}} tende a se comunicar de forma ativa, favorecer a construcao de vinculos e mobilizar as pessoas em torno de ideias, o que costuma fortalecer engajamento e integracao entre as equipes.",
    },
    {
      min: 76,
      max: 100,
      texto:
        "A comunicacao na cultura percebida aparece fortemente mobilizadora, entusiasmada e voltada a construcao de redes e relacoes. Esse traco tende a energizar o ambiente, mas em alta intensidade pode reduzir a objetividade, gerar dependencia de aprovacao social ou dificultar conversas sobre temas mais tecnicos ou impopulares.",
    },
  ],
  S: [
    {
      min: 0,
      max: 25,
      texto:
        "A cultura da {{empresa}} tende a priorizar mobilidade, agilidade e abertura a mudancas, com menor apego a rotinas fixas - o que pode ser uma forca em contextos de inovacao e urgencia. O ponto de atencao e observar se essa velocidade nao esta comprometendo a continuidade, a seguranca ou a cooperacao entre as pessoas.",
    },
    {
      min: 26,
      max: 50,
      texto:
        "Ha uma presenca moderada de estabilidade e cooperacao na cultura percebida. A {{empresa}} parece conseguir se adaptar a mudancas sem abrir mao de uma certa previsibilidade no dia a dia.",
    },
    {
      min: 51,
      max: 75,
      texto:
        "A cultura da {{empresa}} tende a valorizar continuidade e cooperacao, com trabalho em equipe constante, o que costuma gerar confianca e senso de pertencimento entre as pessoas.",
    },
    {
      min: 76,
      max: 100,
      texto:
        "A cultura percebida e fortemente estavel, paciente e cooperativa, o que tende a fortalecer a confianca e a continuidade das relacoes. O ponto de atencao e observar se essa solidez nao esta se transformando em resistencia a mudancas ou lentidao decisoria quando a situacao exige adaptacao rapida.",
    },
  ],
  C: [
    {
      min: 0,
      max: 25,
      texto:
        "A cultura da {{empresa}} tende a priorizar flexibilidade, improviso e menor dependencia de procedimentos formais, com a qualidade apoiada mais em julgamento pratico do que em regras escritas. O ponto de atencao e observar se essa flexibilidade preserva consistencia e rastreabilidade nos processos mais criticos.",
    },
    {
      min: 26,
      max: 50,
      texto:
        "Ha uma presenca moderada de estrutura e processo na cultura percebida. A {{empresa}} parece equilibrar flexibilidade com algum nivel de padronizacao, sem que a formalidade seja o traco dominante.",
    },
    {
      min: 51,
      max: 75,
      texto:
        "A cultura da {{empresa}} tende a valorizar processos, qualidade e conformidade a normas, o que costuma gerar consistencia e previsibilidade nas entregas.",
    },
    {
      min: 76,
      max: 100,
      texto:
        "A cultura percebida e fortemente estruturada, criteriosa e voltada a processos e normas, o que tende a garantir qualidade e consistencia. O ponto de atencao e observar se esse rigor nao esta gerando excesso de burocracia ou resistencia a solucoes fora do padrao.",
    },
  ],
};

/**
 * Nota metodologica fixa (baseada na Apostila Tecnica CKM de leitura DISC
 * aplicada a cultura organizacional): os eixos D/I/S/C nao sao notas de
 * desempenho. Alta e baixa intensidade tem significado proprio e podem ser
 * funcionais ou exigir atencao dependendo do contexto da empresa.
 */
export const NOTA_METODOLOGICA_DISC =
  "No DISC, os eixos D, I, S e C nao devem ser interpretados como notas de desempenho. Cada eixo representa uma tendencia comportamental que pode se manifestar em maior ou menor intensidade dentro da cultura da empresa. Tanto a alta quanto a baixa intensidade tem significado proprio e podem ser funcionais ou exigir atencao, dependendo do contexto, da estrategia e dos desafios da organizacao. Os percentuais representam a predominancia relativa dos eixos nas respostas dos participantes - nao medem qualidade, desempenho ou valor moral da empresa.";

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

const LEITURAS_COMBINADAS: Record<string, string> = {
  D_I:
    "A combinacao entre Dominancia e Influencia tende a gerar uma cultura de expansao, energia comercial e lideranca mobilizadora - decisoes rapidas aliadas a capacidade de engajar pessoas em torno delas. O ponto de atencao e observar se decisoes e promessas feitas com entusiasmo tem sustentacao operacional suficiente antes de serem comunicadas amplamente.",
  D_C:
    "A combinacao entre Dominancia e Conformidade tende a gerar uma cultura de resultado com controle - metas claras cobradas com criterios e padroes definidos. O ponto de atencao e observar se a pressao por resultado e o rigor de processo nao se somam a ponto de gerar burocracia e tensao simultaneas.",
  D_S:
    "A combinacao entre Dominancia e Estabilidade tende a gerar uma cultura que decide com objetividade sem abrir mao da continuidade e do cuidado com as relacoes - busca resultado sem perder a base de confianca construida. O ponto de atencao e observar se a necessidade de preservar estabilidade nao atrasa decisoes que exigem urgencia.",
  I_S:
    "A combinacao entre Influencia e Estabilidade tende a gerar uma cultura de acolhimento, integracao e relacoes fortes, com bom clima interno. O ponto de atencao e observar se essa valorizacao do relacionamento nao dificulta conversas dificeis ou decisoes impopulares quando necessarias.",
  I_C:
    "A combinacao entre Influencia e Conformidade tende a gerar uma cultura que busca unir comunicacao proxima com rigor tecnico e criterios claros - as pessoas se conectam, mas tambem valorizam precisao e metodo. O ponto de atencao e observar se a busca por controle nao reduz a espontaneidade da comunicacao, ou se o entusiasmo nao compromete o cuidado com dados e processos.",
  S_C:
    "A combinacao entre Estabilidade e Conformidade tende a gerar uma cultura de seguranca, metodo e previsibilidade, com processos bem estabelecidos. O ponto de atencao e observar se essa solidez nao esta se transformando em conservadorismo ou resistencia a mudancas necessarias.",
};

/**
 * Retorna a leitura combinada do eixo predominante + secundario (os dois
 * eixos mais escolhidos), conforme o modelo de "leitura combinada dos
 * fatores" da Apostila Tecnica CKM. A ordem dos eixos informados nao
 * importa - a combinacao e normalizada internamente.
 */
export function obterLeituraCombinada(
  eixoA: Disc360CultureDimension,
  eixoB: Disc360CultureDimension
): string | null {
  if (eixoA === eixoB) return null;
  const ordem: Disc360CultureDimension[] = ["D", "I", "S", "C"];
  const [x, y] = [eixoA, eixoB].sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
  return LEITURAS_COMBINADAS[`${x}_${y}`] ?? null;
}

const RECOMENDACOES_POR_PREDOMINANCIA: Record<Disc360CultureDimension, string[]> = {
  D: [
    "Desenvolver praticas de feedback com escuta ativa antes de decisoes importantes.",
    "Criar rituais de alinhamento e comunicacao antes de mudancas ou metas grandes.",
    "Equilibrar indicadores de resultado com indicadores de clima e qualidade.",
  ],
  I: [
    "Transformar boas conversas e ideias em planos documentados, com donos e prazos definidos.",
    "Fortalecer a disciplina de execucao e o acompanhamento das combinacoes feitas.",
    "Desenvolver a lideranca para conversas objetivas sobre temas dificeis ou impopulares.",
  ],
  S: [
    "Criar seguranca psicologica para conduzir mudancas de forma gradual.",
    "Definir prioridades e prazos claros para evitar acomodacao diante de urgencias.",
    "Desenvolver liderancas para sustentar conversas dificeis quando necessario.",
  ],
  C: [
    "Revisar processos que possam estar travando a entrega ou a agilidade.",
    "Comunicar com clareza o porque das regras, criterios e mudancas de processo.",
    "Criar pilotos controlados para testar inovacoes sem abrir mao da qualidade.",
  ],
};

/**
 * Retorna de 2 a 3 recomendacoes praticas de desenvolvimento, conforme o
 * eixo predominante da cultura (Apostila Tecnica CKM, secao 11).
 */
export function obterRecomendacoesPorPredominancia(
  eixoPredominante: Disc360CultureDimension
): string[] {
  return RECOMENDACOES_POR_PREDOMINANCIA[eixoPredominante] ?? [];
}
