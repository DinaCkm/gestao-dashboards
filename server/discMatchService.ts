/**
 * EcoDISC 360 - Servico de calculo de aderencia (match) comportamental.
 *
 * Calcula o grau de aderencia entre ate tres perfis DISC (percentuais D, I, S, C):
 *   - DISC do colaborador (empregado)
 *   - DISC do cargo (perfil esperado pela funcao)
 *   - DISC da empresa/diretoria (perfil cultural desejado)
 *
 * O calculo usa a diferenca absoluta entre os percentuais de cada dimensao
 * (D, I, S, C). Uma diferenca total de 0 = 100% de aderencia; uma diferenca
 * total de 200 (o maximo teorico) = 0% de aderencia.
 *
 * Parte do modulo EcoDISC 360 - nao interfere no DISC legado
 * (disc_respostas / disc_resultados).
 */

export type DiscDimension = "D" | "I" | "S" | "C";

export type DiscScores = {
  D: number;
  I: number;
  S: number;
  C: number;
};

// ---------------------------------------------------------------------------
// Determinacao de perfil (predominante/secundario) com regra de desempate
// e indice de concordancia entre respondentes (reaproveitavel por qualquer
// consolidacao que precise comparar varios DiscScores individuais a uma media:
// usado hoje pela consolidacao da Cultura da Empresa, e podera ser reaproveitado
// futuramente pela consolidacao do Perfil da Diretoria).
// ---------------------------------------------------------------------------

// Ordem de prioridade em caso de empate entre dimensoes: D > I > S > C.
const ORDEM_PRIORIDADE_DISC: (keyof DiscScores)[] = ["D", "I", "S", "C"];

export function determinarPerfil(scores: DiscScores): { predominante: keyof DiscScores; secundario: keyof DiscScores; sugerido: string } {
  const ordenado = [...ORDEM_PRIORIDADE_DISC].sort((a, b) => {
    if (scores[b] !== scores[a]) return scores[b] - scores[a];
    return ORDEM_PRIORIDADE_DISC.indexOf(a) - ORDEM_PRIORIDADE_DISC.indexOf(b);
  });
  const predominante = ordenado[0];
  const secundario = ordenado[1];
  return { predominante, secundario, sugerido: predominante + "/" + secundario };
}

export type ClassificacaoConcordancia = "alta" | "media" | "baixa";

export function calcularIndiceConcordancia(
  scoresIndividuais: DiscScores[],
  scoresMedios: DiscScores
): { diferencaMedia: number; classificacao: ClassificacaoConcordancia } {
  if (!scoresIndividuais || scoresIndividuais.length === 0) {
    return { diferencaMedia: 0, classificacao: "alta" };
  }
  const diferencasPorRespondente = scoresIndividuais.map((scores) => {
    const somaDiferencas = ORDEM_PRIORIDADE_DISC.reduce((acc, dim) => acc + Math.abs(scores[dim] - scoresMedios[dim]), 0);
    return somaDiferencas / ORDEM_PRIORIDADE_DISC.length;
  });
  const diferencaMedia = diferencasPorRespondente.reduce((acc, v) => acc + v, 0) / diferencasPorRespondente.length;
  let classificacao: ClassificacaoConcordancia;
  if (diferencaMedia <= 10) classificacao = "alta";
  else if (diferencaMedia <= 20) classificacao = "media";
  else classificacao = "baixa";
  return { diferencaMedia: Math.round(diferencaMedia * 100) / 100, classificacao };
}

export type MatchClassification = "alto" | "bom" | "medio" | "baixo" | "desalinhado";

/**
 * Classifica um percentual de match de acordo com a regua definida no projeto EcoDISC 360:
 *   85-100 alto | 70-84 bom | 55-69 medio | 40-54 baixo | <40 desalinhado
 */
export function classifyMatch(percentual: number): MatchClassification {
  if (percentual >= 85) return "alto";
  if (percentual >= 70) return "bom";
  if (percentual >= 55) return "medio";
  if (percentual >= 40) return "baixo";
  return "desalinhado";
}

/**
 * Calcula o percentual de aderencia entre dois conjuntos de percentuais DISC.
 * Soma a diferenca absoluta de cada dimensao (D, I, S, C), normaliza pelo maximo
 * teorico (200 pontos) e converte em percentual de aderencia (100 = identico).
 */
export function calculateDiscMatch(scoresA: DiscScores, scoresB: DiscScores): number {
  const dimensions: DiscDimension[] = ["D", "I", "S", "C"];
  const totalDifference = dimensions.reduce((sum, dim) => {
    const a = Number(scoresA?.[dim] ?? 0);
    const b = Number(scoresB?.[dim] ?? 0);
    return sum + Math.abs(a - b);
  }, 0);

  const maxDifference = 200;
  const raw = 100 - (totalDifference / maxDifference) * 100;
  const clamped = Math.max(0, Math.min(100, raw));
  return Math.round(clamped * 100) / 100;
}

/**
 * Identifica pontos de convergencia (strengths) e diferenca (gaps) entre dois perfis,
 * dimensao a dimensao, com base num limiar de diferenca.
 */
export function compareDimensions(
  scoresA: DiscScores,
  scoresB: DiscScores,
  threshold = 15
): { strengths: DiscDimension[]; gaps: DiscDimension[] } {
  const dimensions: DiscDimension[] = ["D", "I", "S", "C"];
  const strengths: DiscDimension[] = [];
  const gaps: DiscDimension[] = [];

  for (const dim of dimensions) {
    const diff = Math.abs(Number(scoresA?.[dim] ?? 0) - Number(scoresB?.[dim] ?? 0));
    if (diff <= threshold) {
      strengths.push(dim);
    } else {
      gaps.push(dim);
    }
  }

  return { strengths, gaps };
}

const RISK_DESCRIPTIONS: Record<DiscDimension, string> = {
  D: "Possivel diferenca no ritmo de tomada de decisao e assertividade esperados.",
  I: "Possivel diferenca no estilo de comunicacao e relacionamento esperado.",
  S: "Possivel diferenca no ritmo de adaptacao a mudancas e estabilidade esperada.",
  C: "Possivel diferenca no nivel de atencao a normas, dados e processos esperado.",
};

/**
 * Traduz gaps de dimensao em riscos comportamentais descritos em linguagem
 * de desenvolvimento (nunca punitiva ou classificatoria negativa).
 */
export function buildRisks(gaps: DiscDimension[]): string[] {
  return gaps.map((dim) => RISK_DESCRIPTIONS[dim]);
}

const RECOMMENDATION_BY_DIMENSION: Record<DiscDimension, string> = {
  D: "Desenvolver autonomia e agilidade na tomada de decisao.",
  I: "Desenvolver habilidades de comunicacao e influencia interpessoal.",
  S: "Desenvolver flexibilidade e adaptacao a mudancas de ritmo.",
  C: "Desenvolver atencao a processos, normas e qualidade tecnica.",
};

/**
 * Gera recomendacoes de desenvolvimento simples a partir dos gaps identificados.
 * Serve como ponto de partida para o PDI (Fase 2 do projeto).
 */
export function buildRecommendations(gaps: DiscDimension[]): string[] {
  return gaps.map((dim) => RECOMMENDATION_BY_DIMENSION[dim]);
}

export type FullMatchResult = {
  matchEmployeeRole: number | null;
  matchEmployeeOrg: number | null;
  matchRoleOrg: number | null;
  matchOverall: number | null;
  classificationEmployeeRole: MatchClassification | null;
  classificationEmployeeOrg: MatchClassification | null;
  classificationRoleOrg: MatchClassification | null;
  classificationOverall: MatchClassification | null;
  strengths: DiscDimension[];
  gaps: DiscDimension[];
  risks: string[];
  recommendations: string[];
};

/**
 * Calcula o match completo entre o DISC do colaborador, do cargo e da empresa/diretoria.
 * roleScores e orgScores sao opcionais: nem todo colaborador tera os tres perfis
 * cadastrados ainda (ex: cargo sem perfil definido).
 */
export function calculateFullMatch(
  employeeScores: DiscScores,
  roleScores: DiscScores | null | undefined,
  orgScores: DiscScores | null | undefined
): FullMatchResult {
  const matchEmployeeRole = roleScores ? calculateDiscMatch(employeeScores, roleScores) : null;
  const matchEmployeeOrg = orgScores ? calculateDiscMatch(employeeScores, orgScores) : null;
  const matchRoleOrg = roleScores && orgScores ? calculateDiscMatch(roleScores, orgScores) : null;

  const overallInputs = [matchEmployeeRole, matchEmployeeOrg].filter(
    (v): v is number => v !== null
  );
  const matchOverall =
    overallInputs.length > 0
      ? Math.round((overallInputs.reduce((sum, v) => sum + v, 0) / overallInputs.length) * 100) / 100
      : null;

  const comparisonBase = roleScores ?? orgScores ?? null;
  const { strengths, gaps } = comparisonBase
    ? compareDimensions(employeeScores, comparisonBase)
    : { strengths: [] as DiscDimension[], gaps: [] as DiscDimension[] };

  return {
    matchEmployeeRole,
    matchEmployeeOrg,
    matchRoleOrg,
    matchOverall,
    classificationEmployeeRole: matchEmployeeRole !== null ? classifyMatch(matchEmployeeRole) : null,
    classificationEmployeeOrg: matchEmployeeOrg !== null ? classifyMatch(matchEmployeeOrg) : null,
    classificationRoleOrg: matchRoleOrg !== null ? classifyMatch(matchRoleOrg) : null,
    classificationOverall: matchOverall !== null ? classifyMatch(matchOverall) : null,
    strengths,
    gaps,
    risks: buildRisks(gaps),
    recommendations: buildRecommendations(gaps),
  };
}

/**
 * Consolidacao do Perfil DISC da Diretoria a partir do DISC individual (legado)
 * dos diretores selecionados manualmente pelo RH.
 *
 * Diferente do calculo de "aderencia" acima (que compara PERFIS diferentes entre si),
 * aqui o objetivo e encontrar o "numero ideal" de cada indicador (D, I, S, C) que
 * representa o FATOR PREDOMINANTE do grupo de diretores.
 *
 * Regra (definida com a Dina): para cada indicador, se o grupo se dividir em
 * subgrupos com mais de 30 pontos de diferenca entre eles, usamos a media do
 * MAIOR subgrupo e desconsideramos os demais (para nao diluir o fator predominante).
 * Se nao houver um subgrupo claramente maior (empate), usamos a media de todos.
 */

export type PessoaComScore = {
  alunoId: number;
  nome: string;
  scores: DiscScores;
};

export type DetalheIndicador = {
  valorFinal: number;
  grupoUsado: "maioria" | "todos";
  incluidos: { alunoId: number; nome: string; valor: number }[];
  excluidos: { alunoId: number; nome: string; valor: number }[];
};

export type ResultadoGrupoDiretoria = {
  scoresFinais: DiscScores;
  detalhePorIndicador: Record<"D" | "I" | "S" | "C", DetalheIndicador>;
  perfilPredominante: "D" | "I" | "S" | "C";
  perfilSecundario: "D" | "I" | "S" | "C";
  perfilSugerido: string;
};

const LIMITE_QUEBRA_GRUPO_DIRETORIA = 30;

function mediaSimples(valores: number[]): number {
  const soma = valores.reduce((acc, v) => acc + v, 0);
  return Math.round((soma / valores.length) * 100) / 100;
}

function calcularIndicadorPorMaioria(
  pessoas: { alunoId: number; nome: string; valor: number }[]
): DetalheIndicador {
  const ordenado = [...pessoas].sort((a, b) => a.valor - b.valor);

  const grupos: (typeof ordenado)[] = [];
  let grupoAtual: typeof ordenado = [ordenado[0]];
  for (let i = 1; i < ordenado.length; i++) {
    if (ordenado[i].valor - ordenado[i - 1].valor > LIMITE_QUEBRA_GRUPO_DIRETORIA) {
      grupos.push(grupoAtual);
      grupoAtual = [];
    }
    grupoAtual.push(ordenado[i]);
  }
  grupos.push(grupoAtual);

  if (grupos.length === 1) {
    return {
      valorFinal: mediaSimples(pessoas.map((p) => p.valor)),
      grupoUsado: "todos",
      incluidos: pessoas,
      excluidos: [],
    };
  }

  const maiorTamanho = Math.max(...grupos.map((g) => g.length));
  const maiores = grupos.filter((g) => g.length === maiorTamanho);

  if (maiores.length > 1) {
    return {
      valorFinal: mediaSimples(pessoas.map((p) => p.valor)),
      grupoUsado: "todos",
      incluidos: pessoas,
      excluidos: [],
    };
  }

  const grupoMaioria = maiores[0];
  const idsIncluidos = new Set(grupoMaioria.map((p) => p.alunoId));
  const incluidos = pessoas.filter((p) => idsIncluidos.has(p.alunoId));
  const excluidos = pessoas.filter((p) => !idsIncluidos.has(p.alunoId));

  return {
    valorFinal: mediaSimples(grupoMaioria.map((p) => p.valor)),
    grupoUsado: "maioria",
    incluidos,
    excluidos,
  };
}

export function calcularPerfilDiretoriaPorGrupo(pessoas: PessoaComScore[]): ResultadoGrupoDiretoria {
  const dimensoes: ("D" | "I" | "S" | "C")[] = ["D", "I", "S", "C"];
  const detalhePorIndicador = {} as Record<"D" | "I" | "S" | "C", DetalheIndicador>;

  for (const dim of dimensoes) {
    const valores = pessoas.map((p) => ({ alunoId: p.alunoId, nome: p.nome, valor: p.scores[dim] }));
    detalhePorIndicador[dim] = calcularIndicadorPorMaioria(valores);
  }

  const scoresFinais: DiscScores = {
    D: detalhePorIndicador.D.valorFinal,
    I: detalhePorIndicador.I.valorFinal,
    S: detalhePorIndicador.S.valorFinal,
    C: detalhePorIndicador.C.valorFinal,
  };

  const perfil = determinarPerfil(scoresFinais);

  return {
    scoresFinais,
    detalhePorIndicador,
    perfilPredominante: perfil.predominante,
    perfilSecundario: perfil.secundario,
    perfilSugerido: perfil.sugerido,
  };
}


// ---------------------------------------------------------------------------
// Bloco 6 - Resultado/Match: Indice de Match Pessoa x Cargo.
//
// Regra definida com a Dina: para cada um dos 4 indicadores DISC (D, I, S, C),
// calculamos a diferenca absoluta entre a pontuacao da pessoa e a pontuacao
// ideal do cargo. Se a diferenca for <= 30 pontos, o indicador conta para o
// match. O Indice de Match e (indicadores dentro da faixa / 4) x 100, ou seja,
// so pode assumir os valores 0, 25, 50, 75 ou 100.
//
// Nunca exibimos, por indicador, um rotulo de "deu match" / "nao deu match" -
// apenas o percentual agregado. Mesmo em 100%, ainda ha pontos de
// desenvolvimento a mostrar, a menos que a pessoa seja numericamente identica
// ao cargo nos 4 eixos (diferenca = 0 em todos).
// ---------------------------------------------------------------------------

export const LIMITE_ADERENCIA_INDICADOR = 30;

export type DetalheIndicadorMatchCargo = {
  diferenca: number;
  dentroFaixa: boolean;
};

export type IndiceMatchCargoResult = {
  indiceMatch: number;
  detalhePorIndicador: Record<DiscDimension, DetalheIndicadorMatchCargo>;
  identico: boolean;
};

export function calcularIndiceMatchCargo(
  pessoaScores: DiscScores,
  cargoScores: DiscScores
): IndiceMatchCargoResult {
  const dimensoes: DiscDimension[] = ["D", "I", "S", "C"];
  const detalhePorIndicador = {} as Record<DiscDimension, DetalheIndicadorMatchCargo>;
  let dentroDaFaixaCount = 0;
  let identico = true;

  for (const dim of dimensoes) {
    const pessoa = Number(pessoaScores?.[dim] ?? 0);
    const cargo = Number(cargoScores?.[dim] ?? 0);
    const diferenca = Math.round(Math.abs(pessoa - cargo) * 100) / 100;
    const dentroFaixa = diferenca <= LIMITE_ADERENCIA_INDICADOR;
    if (dentroFaixa) dentroDaFaixaCount += 1;
    if (diferenca !== 0) identico = false;
    detalhePorIndicador[dim] = { diferenca, dentroFaixa };
  }

  const indiceMatch = Math.round((dentroDaFaixaCount / dimensoes.length) * 100);

  return { indiceMatch, detalhePorIndicador, identico };
}

export type JustificativaEixo = {
  eixo: DiscDimension;
  diferenca: number;
  tipo: "alinhamento_total" | "ajuste_fino" | "desenvolvimento";
  texto: string;
};

const EIXO_TEMA_MATCH_CARGO: Record<DiscDimension, string> = {
  D: "ritmo de decisao, autonomia e assertividade",
  I: "estilo de comunicacao e construcao de relacionamentos",
  S: "ritmo de adaptacao, cooperacao e estabilidade",
  C: "atencao a normas, dados e processos",
};

const EIXO_DESENVOLVER_ACIMA: Record<DiscDimension, string> = {
  D: "calibrar o ritmo de decisao em momentos que pedem mais escuta e construcao coletiva",
  I: "equilibrar a comunicacao com momentos de maior objetividade e foco na tarefa",
  S: "desenvolver maior tolerancia a mudancas de ritmo e a situacoes menos previsiveis",
  C: "flexibilizar a atencao a detalhes e processos quando o contexto pedir agilidade",
};

const EIXO_DESENVOLVER_ABAIXO: Record<DiscDimension, string> = {
  D: "ampliar a autonomia e a assertividade na tomada de decisao",
  I: "desenvolver mais abertura na comunicacao e na construcao de relacionamentos",
  S: "desenvolver maior estabilidade e constancia diante de mudancas de ritmo",
  C: "fortalecer a atencao a normas, dados e processos no dia a dia",
};

function classificarDiferencaMatchCargo(diferenca: number): "alinhamento_total" | "ajuste_fino" | "desenvolvimento" {
  if (diferenca === 0) return "alinhamento_total";
  if (diferenca <= LIMITE_ADERENCIA_INDICADOR) return "ajuste_fino";
  return "desenvolvimento";
}

/**
 * Gera, para cada um dos 4 eixos DISC, uma justificativa em tom de
 * desenvolvimento (nunca punitiva, nunca rotulando "match"/"nao-match").
 * So deixa de listar um ponto de desenvolvimento quando a diferenca naquele
 * eixo for exatamente zero.
 */
export function buildJustificativasMatchCargo(
  pessoaScores: DiscScores,
  cargoScores: DiscScores
): JustificativaEixo[] {
  const dimensoes: DiscDimension[] = ["D", "I", "S", "C"];
  const justificativas: JustificativaEixo[] = [];

  for (const dim of dimensoes) {
    const pessoa = Number(pessoaScores?.[dim] ?? 0);
    const cargo = Number(cargoScores?.[dim] ?? 0);
    const diferenca = Math.round(Math.abs(pessoa - cargo) * 100) / 100;
    const tipo = classificarDiferencaMatchCargo(diferenca);

    if (tipo === "alinhamento_total") {
      justificativas.push({
        eixo: dim,
        diferenca,
        tipo,
        texto: "Em " + EIXO_TEMA_MATCH_CARGO[dim] + ", seu perfil esta numericamente identico ao ideal do cargo neste eixo - nao ha ponto de desenvolvimento a destacar aqui.",
      });
      continue;
    }

    const acima = pessoa > cargo;
    const sugestao = acima ? EIXO_DESENVOLVER_ACIMA[dim] : EIXO_DESENVOLVER_ABAIXO[dim];
    const intensidade = tipo === "ajuste_fino" ? "um ajuste fino" : "um ponto de atencao maior para o desenvolvimento";

    justificativas.push({
      eixo: dim,
      diferenca,
      tipo,
      texto: "Em " + EIXO_TEMA_MATCH_CARGO[dim] + ", a diferenca em relacao ao ideal do cargo (" + diferenca + " pontos) representa " + intensidade + ": vale " + sugestao + ".",
    });
  }

  return justificativas;
}
