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
