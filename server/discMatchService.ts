import { COMPETENCIA_DISC } from '../shared/competenciaDiscMatrix';

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

export type NivelDiferencaEixo = 'aderente' | 'atencao';
export type DirecaoDiferenca = 'acima' | 'abaixo' | 'igual';

export type JustificativaEixo = {
  eixo: DiscDimension;
  nomeCompleto: string;
  diferenca: number;
  direcao: DirecaoDiferenca;
  nivel: NivelDiferencaEixo;
  maiorDistancia: boolean;
  paragrafo: string;
  bulletsIntro: string;
  bullets: string[];
  orientacao: string;
};

export type ResultadoJustificativasMatchCargo = {
  eixos: JustificativaEixo[];
  sintese: string;
};

const EIXO_NOME_COMPLETO: Record<DiscDimension, string> = {
  D: 'Dominância',
  I: 'Influência',
  S: 'Estabilidade',
  C: 'Conformidade',
};

const EIXO_TEMA_FRASE: Record<DiscDimension, string> = {
  D: 'o modo como a pessoa tende a tomar decisões, assumir autonomia e se posicionar diante de desafios',
  I: 'o estilo de comunicação, interação e construção de relacionamentos da pessoa',
  S: 'o ritmo de adaptação, cooperação e estabilidade da pessoa',
  C: 'o modo como a pessoa lida com normas, dados, detalhes, critérios e processos',
};

const EIXO_TEMA_CURTO: Record<DiscDimension, string> = {
  D: 'autonomia, posicionamento e tomada de decisão',
  I: 'adequação da comunicação e dos relacionamentos',
  S: 'estabilidade e adaptação a mudanças',
  C: 'atenção a processos e detalhes',
};

const EIXO_BULLETS_OBSERVAR_PROFISSIONAL: Record<DiscDimension, string[]> = {
  D: [
    'assume decisões com segurança',
    'consegue agir sem depender de validações constantes',
    'posiciona-se com clareza em situações de pressão',
    'mantém equilíbrio entre firmeza e abertura ao diálogo',
  ],
  I: [
    'comunica-se de forma clara e objetiva',
    'constrói relacionamentos de confiança com a equipe',
    'equilibra entusiasmo com foco na tarefa',
    'ajusta o tom de acordo com o contexto e o interlocutor',
  ],
  S: [
    'mantém constância mesmo diante de mudanças',
    'coopera e se ajusta ao ritmo da equipe',
    'lida bem com alterações de prioridade',
    'equilibra estabilidade com abertura a novidades',
  ],
  C: [
    'presta atenção a detalhes, dados e processos',
    'segue normas e procedimentos estabelecidos',
    'organiza informações de forma consistente',
    'toma decisões apoiadas em critérios e dados',
  ],
};

const EIXO_BULLETS_AVALIAR_CARGO: Record<DiscDimension, string[]> = {
  D: [
    'decisões rápidas e autônomas, com pouca dependência de validação',
    'posicionamento firme diante de conflitos ou pressão',
    'assunção de responsabilidade por resultados individuais',
    'tolerância a ambientes de maior exposição e cobrança',
  ],
  I: [
    'maior objetividade e síntese',
    'comunicação mais relacional e persuasiva',
    'maior exposição e interação com pessoas',
    'equilíbrio entre relacionamento e execução das tarefas',
  ],
  S: [
    'ritmo mais estável e previsível de trabalho',
    'cooperação constante e rotina bem definida',
    'menor exposição a mudanças abruptas de prioridade',
    'construção de relacionamentos de confiança ao longo do tempo',
  ],
  C: [
    'atenção rigorosa a detalhes, dados e conformidade',
    'seguimento estrito de normas e processos',
    'consistência e precisão nas entregas',
    'decisões apoiadas fortemente em critérios técnicos',
  ],
};

const EIXO_ACOMPANHAMENTO_ADERENTE: Record<DiscDimension, string> = {
  D: 'observar como a pessoa equilibra firmeza e escuta em momentos de maior pressão ou urgência',
  I: 'observar como a pessoa equilibra proximidade e objetividade em diferentes contextos de comunicação',
  S: 'observar como a pessoa reage em situações de mudança, pressão ou alteração de prioridades',
  C: 'observar como a pessoa mantém a atenção a detalhes e processos mesmo sob prazos apertados',
};

const EIXO_ORIENTACAO_ACIMA: Record<DiscDimension, string> = {
  D: 'calibrar o ritmo de decisão em momentos que pedem mais escuta e construção coletiva, reservando espaço para ouvir a equipe antes de fechar posições, especialmente em decisões que afetam várias pessoas',
  I: 'trabalhar a adequação da comunicação ao contexto, alternando momentos de interação e influência com maior objetividade, foco, escuta e direcionamento para resultados',
  S: 'desenvolver maior tolerância a mudanças de ritmo e a situações menos previsíveis, ampliando a flexibilidade diante de imprevistos e novas prioridades',
  C: 'flexibilizar a atenção a detalhes e processos quando o contexto pedir agilidade, equilibrando rigor técnico com rapidez de entrega',
};

const EIXO_ORIENTACAO_ABAIXO: Record<DiscDimension, string> = {
  D: 'ampliar gradualmente a autonomia, a segurança para decidir e a assertividade na comunicação, especialmente em situações que exigem rapidez, posicionamento e responsabilização',
  I: 'desenvolver mais abertura na comunicação e na construção de relacionamentos, ampliando a interação com pessoas e a capacidade de influenciar e mobilizar a equipe',
  S: 'desenvolver maior estabilidade e constância diante de mudanças de ritmo, fortalecendo a previsibilidade e a cooperação contínua com a equipe',
  C: 'fortalecer hábitos de conferência, planejamento, registro e acompanhamento dos processos, especialmente em atividades nas quais erros, descuidos ou ausência de padrão possam gerar impactos relevantes',
};

const LIMITE_ADERENCIA_EIXO = 8;
const LIMITE_MAIOR_DISTANCIA = 20;

function classificarNivelDiferenca(diferenca: number): NivelDiferencaEixo {
  return diferenca < LIMITE_ADERENCIA_EIXO ? 'aderente' : 'atencao';
}

function qualificarDiferenca(diferenca: number): string {
  if (diferenca < 15) return 'uma diferença pequena a moderada';
  if (diferenca < 25) return 'uma diferença moderada';
  return 'uma diferença mais relevante';
}

function formatarDiferenca(n: number): string {
  const arredondado = Math.round(n * 100) / 100;
  const str = Number.isInteger(arredondado) ? String(arredondado) : arredondado.toFixed(2);
  return str.replace('.', ',');
}

/**
 * Gera, para cada um dos 4 eixos DISC, uma leitura orientativa em tom de
 * desenvolvimento (nunca punitiva, nunca rotulando "match"/"nao-match"),
 * deixando explicito o tamanho da diferenca, a direcao (pessoa acima ou
 * abaixo do perfil esperado pelo cargo) e o que observar/desenvolver.
 * Tambem monta uma sintese final para o RH, apontando o eixo de maior
 * aderencia e o(s) eixo(s) que mais merecem atencao.
 */
export function buildJustificativasMatchCargo(
  pessoaScores: DiscScores,
  cargoScores: DiscScores
): ResultadoJustificativasMatchCargo {
  const dimensoes: DiscDimension[] = ['D', 'I', 'S', 'C'];

  const brutos = dimensoes.map((dim) => {
    const pessoa = Number(pessoaScores?.[dim] ?? 0);
    const cargo = Number(cargoScores?.[dim] ?? 0);
    const diferenca = Math.round(Math.abs(pessoa - cargo) * 100) / 100;
    const direcao: DirecaoDiferenca = diferenca === 0 ? 'igual' : pessoa > cargo ? 'acima' : 'abaixo';
    return { dim, diferenca, direcao };
  });

  const maiorDiferenca = Math.max(...brutos.map((b) => b.diferenca));
  const dimMaiorDistancia =
    maiorDiferenca >= LIMITE_MAIOR_DISTANCIA
      ? brutos.find((b) => b.diferenca === maiorDiferenca)?.dim
      : undefined;

  const eixos: JustificativaEixo[] = brutos.map(({ dim, diferenca, direcao }) => {
    const nomeCompleto = EIXO_NOME_COMPLETO[dim];
    const maiorDistancia = dim === dimMaiorDistancia;
    const direcaoTexto = direcao === 'igual' ? 'exatamente alinhada' : direcao;
    const diferencaFmt = formatarDiferenca(diferenca);

    if (direcao === 'igual') {
      return {
        eixo: dim,
        nomeCompleto,
        diferenca,
        direcao,
        nivel: 'aderente',
        maiorDistancia: false,
        paragrafo:
          'Em ' + EIXO_TEMA_FRASE[dim] + ', o perfil da pessoa está numericamente idêntico ao ideal do cargo neste eixo - não há ponto de desenvolvimento a destacar aqui.',
        bulletsIntro: '',
        bullets: [],
        orientacao: 'Orientação ao RH: considerar este eixo como um ponto de aderência total ao cargo.',
      };
    }

    const nivel = classificarNivelDiferenca(diferenca);

    if (nivel === 'aderente') {
      return {
        eixo: dim,
        nomeCompleto,
        diferenca,
        direcao,
        nivel,
        maiorDistancia: false,
        paragrafo:
          'Este resultado demonstra uma proximidade muito grande entre o comportamento apresentado e o perfil esperado para o cargo (diferença de ' +
          diferencaFmt +
          ' pontos, ' +
          direcaoTexto +
          ' do perfil esperado). Não há, neste eixo, uma necessidade relevante de desenvolvimento. O principal cuidado deve ser preservar esse equilíbrio e ' +
          EIXO_ACOMPANHAMENTO_ADERENTE[dim] +
          '.',
        bulletsIntro: '',
        bullets: [],
        orientacao:
          'Orientação ao RH: considerar este eixo como um ponto de aderência ao cargo, mantendo apenas o acompanhamento natural durante a integração e o desenvolvimento profissional.',
      };
    }

    const orientacaoBase = direcao === 'acima' ? EIXO_ORIENTACAO_ACIMA[dim] : EIXO_ORIENTACAO_ABAIXO[dim];

    if (maiorDistancia) {
      return {
        eixo: dim,
        nomeCompleto,
        diferenca,
        direcao,
        nivel,
        maiorDistancia: true,
        paragrafo:
          'Este é o eixo com maior distância em relação ao perfil esperado (diferença de ' +
          diferencaFmt +
          ' pontos, ' +
          direcaoTexto +
          ' do perfil esperado). O resultado sugere que ' +
          EIXO_TEMA_FRASE[dim] +
          ' pode estar menos alinhado ao que o cargo exige.',
        bulletsIntro: 'Para o RH e a liderança, recomenda-se avaliar se o cargo demanda:',
        bullets: EIXO_BULLETS_AVALIAR_CARGO[dim],
        orientacao: 'Orientação de desenvolvimento: ' + orientacaoBase + '.',
      };
    }

    return {
      eixo: dim,
      nomeCompleto,
      diferenca,
      direcao,
      nivel,
      maiorDistancia: false,
      paragrafo:
        'Este resultado indica ' +
        qualificarDiferenca(diferenca) +
        ' (diferença de ' +
        diferencaFmt +
        ' pontos) em ' +
        EIXO_TEMA_FRASE[dim] +
        ', com a pessoa ' +
        direcaoTexto +
        ' do perfil esperado pelo cargo neste eixo.',
      bulletsIntro: 'Para o RH e a liderança, recomenda-se observar se o profissional:',
      bullets: EIXO_BULLETS_OBSERVAR_PROFISSIONAL[dim],
      orientacao: 'Orientação de desenvolvimento: ' + orientacaoBase + '.',
    };
  });

  const sintese = montarSinteseMatchCargo(eixos);

  return { eixos, sintese };
}

function montarSinteseMatchCargo(eixos: JustificativaEixo[]): string {
  const ordenadoCrescente = [...eixos].sort((a, b) => a.diferenca - b.diferenca);
  const ordenadoDecrescente = [...eixos].sort((a, b) => b.diferenca - a.diferenca);

  const melhor = ordenadoCrescente[0];
  const segundoMelhor = ordenadoCrescente[1];
  const pior = ordenadoDecrescente[0];
  const segundoPior = ordenadoDecrescente[1];

  const usaSegundoMelhor = segundoMelhor.diferenca <= 10 && segundoMelhor.eixo !== melhor.eixo;
  const usaSegundoPior = segundoPior.diferenca >= 15 && segundoPior.eixo !== pior.eixo;

  const nomeAderencia =
    'eixo ' + melhor.nomeCompleto + (usaSegundoMelhor ? ', seguido de ' + segundoMelhor.nomeCompleto : '');

  const nomeAtencao =
    (usaSegundoPior ? 'eixos ' : 'eixo ') +
    pior.nomeCompleto +
    (usaSegundoPior ? ' e ' + segundoPior.nomeCompleto : '');

  const temasAtencao =
    EIXO_TEMA_CURTO[pior.eixo] + (usaSegundoPior ? ', ' + EIXO_TEMA_CURTO[segundoPior.eixo] : '');

  return (
    'De forma geral, o profissional apresenta maior aderência ao cargo no ' +
    nomeAderencia +
    '. Os principais pontos de atenção estão n' +
    (usaSegundoPior ? 'os ' : 'o ') +
    nomeAtencao +
    ', especialmente em relação a ' +
    temasAtencao +
    '. Essas diferenças não devem ser interpretadas automaticamente como incapacidade para exercer o cargo. Elas indicam aspectos que merecem ser investigados em entrevista, período de experiência, onboarding e plano de desenvolvimento. O resultado deve ser analisado em conjunto com experiência, competências técnicas, histórico profissional e desempenho observado.'
  );
}

// ---------------------------------------------------------------------------
// Bloco 6 - Pontos fortes / pontos de atencao via Matriz Competencia x DISC,
// a partir dos eixos DISC dominantes do cargo (perfil predominante + secundario)
// comparados ao perfil predominante do profissional. Reaproveita COMPETENCIA_DISC
// (shared/competenciaDiscMatrix.ts), que ja descreve a tendencia de facilidade
// ('Alta' | 'Moderada' | 'Condicionada') de cada eixo DISC para cada competencia
// do catalogo B.E.M., e o texto de desenvolvimento ('ponto') para quem tem menor
// facilidade tendencial naquela competencia.
// ---------------------------------------------------------------------------

export type PontoForteCompetencia = { competencia: string };
export type PontoAtencaoCompetencia = { competencia: string; dica: string };

export type CorrelacaoCompetenciasResult = {
  perfilCargo: string; // ex: "D/I" (predominante/secundario do cargo)
  perfilPessoa: keyof DiscScores;
  pontosFortes: PontoForteCompetencia[];
  pontosAtencao: PontoAtencaoCompetencia[];
};

const MAX_PONTOS_FORTES_COMPETENCIA = 10;
const MAX_PONTOS_ATENCAO_COMPETENCIA = 6;

export function buildCorrelacaoCompetencias(
  pessoaScores: DiscScores,
  cargoScores: DiscScores
): CorrelacaoCompetenciasResult {
  const cargoPerfil = determinarPerfil(cargoScores);
  const pessoaPerfil = determinarPerfil(pessoaScores);
  const eixosDominantesCargo: (keyof DiscScores)[] = [cargoPerfil.predominante, cargoPerfil.secundario];
  const eixoPessoa = pessoaPerfil.predominante;

  const pontosFortes: PontoForteCompetencia[] = [];
  const pontosAtencao: PontoAtencaoCompetencia[] = [];

  for (const [competencia, porEixo] of Object.entries(COMPETENCIA_DISC)) {
    const infoPessoa = porEixo[eixoPessoa];
    if (!infoPessoa) continue;
    const cargoTemAlta = eixosDominantesCargo.some((eixo) => porEixo[eixo]?.facilidade === 'Alta');
    if (!cargoTemAlta) continue;

    if (infoPessoa.facilidade === 'Alta' && pontosFortes.length < MAX_PONTOS_FORTES_COMPETENCIA) {
      pontosFortes.push({ competencia });
    } else if (infoPessoa.facilidade === 'Condicionada' && pontosAtencao.length < MAX_PONTOS_ATENCAO_COMPETENCIA) {
      pontosAtencao.push({ competencia, dica: infoPessoa.ponto });
    }
  }

  return {
    perfilCargo: cargoPerfil.sugerido,
    perfilPessoa: eixoPessoa,
    pontosFortes,
    pontosAtencao,
  };
}
