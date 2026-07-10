/**
 * Teste DISC - Formato de Escolha Forçada (Ipsativo)
 * 
 * 28 blocos com 4 afirmações cada (uma por dimensão D, I, S, C).
 * O participante escolhe:
 *   - "MAIS parecido comigo" (+1 ponto para o fator)
 *   - "MENOS parecido comigo" (-1 ponto para o fator)
 * 
 * Isso cria equilíbrio matemático interno: se soma em um fator,
 * automaticamente reduz em outro. Impossível ter 100% em tudo.
 * 
 * D = Dominância: decisão, controle, desafio, resultados
 * I = Influência: comunicação, entusiasmo, persuasão, sociabilidade
 * S = Estabilidade: cooperação, paciência, harmonia, consistência
 * C = Conformidade: precisão, método, análise, qualidade
 */

export type DiscDimensao = "D" | "I" | "S" | "C";

export interface DiscOpcao {
  id: string;        // ex: "b1_D" (bloco 1, dimensão D)
  dimensao: DiscDimensao;
  texto: string;
}

export interface DiscBloco {
  index: number;      // 0-27
  instrucao: string;  // instrução do bloco
  opcoes: DiscOpcao[];
}

/**
 * 28 blocos de escolha forçada.
 * Cada bloco tem exatamente 4 opções: uma D, uma I, uma S, uma C.
 * Todas são afirmações positivas e socialmente equivalentes.
 */
export const DISC_BLOCOS: DiscBloco[] = [
  // --- Bloco 1 ---
  {
    index: 0,
    instrucao: "Escolha a alternativa que MAIS e a que MENOS descreve você:",
    opcoes: [
      { id: "b1_D", dimensao: "D", texto: "Sou direto e gosto de assumir decisões." },
      { id: "b1_I", dimensao: "I", texto: "Gosto de conversar e influenciar pessoas." },
      { id: "b1_S", dimensao: "S", texto: "Prefiro manter harmonia e cooperação no grupo." },
      { id: "b1_C", dimensao: "C", texto: "Valorizo precisão e seguir procedimentos." },
    ],
  },
  // --- Bloco 2 ---
  {
    index: 1,
    instrucao: "Entre as opções abaixo, escolha a MAIS e a MENOS parecida com você:",
    opcoes: [
      { id: "b2_D", dimensao: "D", texto: "Assumo desafios com rapidez." },
      { id: "b2_I", dimensao: "I", texto: "Animo o ambiente com entusiasmo." },
      { id: "b2_S", dimensao: "S", texto: "Sou paciente ao lidar com pessoas." },
      { id: "b2_C", dimensao: "C", texto: "Analiso detalhes antes de agir." },
    ],
  },
  // --- Bloco 3 ---
  {
    index: 2,
    instrucao: "Selecione a que MAIS e a que MENOS se aproxima de você:",
    opcoes: [
      { id: "b3_D", dimensao: "D", texto: "Prefiro controlar o rumo das atividades." },
      { id: "b3_I", dimensao: "I", texto: "Gosto de persuadir e motivar os outros." },
      { id: "b3_S", dimensao: "S", texto: "Busco estabilidade e previsibilidade." },
      { id: "b3_C", dimensao: "C", texto: "Procuro seguir padrões e métodos definidos." },
    ],
  },
  // --- Bloco 4 ---
  {
    index: 3,
    instrucao: "Escolha a descrição que MAIS e a que MENOS se aplica a você:",
    opcoes: [
      { id: "b4_D", dimensao: "D", texto: "Competitivo." },
      { id: "b4_I", dimensao: "I", texto: "Comunicativo." },
      { id: "b4_S", dimensao: "S", texto: "Leal." },
      { id: "b4_C", dimensao: "C", texto: "Cuidadoso." },
    ],
  },
  // --- Bloco 5 ---
  {
    index: 4,
    instrucao: "Marque a MAIS e a MENOS semelhante ao seu comportamento:",
    opcoes: [
      { id: "b5_D", dimensao: "D", texto: "Gosto de desafios e resultados rápidos." },
      { id: "b5_I", dimensao: "I", texto: "Tenho facilidade para me expressar e convencer." },
      { id: "b5_S", dimensao: "S", texto: "Sou consistente e persistente nas tarefas." },
      { id: "b5_C", dimensao: "C", texto: "Prefiro trabalhar com planejamento e análise." },
    ],
  },
  // --- Bloco 6 ---
  {
    index: 5,
    instrucao: "Escolha a alternativa MAIS e MENOS parecida com você:",
    opcoes: [
      { id: "b6_D", dimensao: "D", texto: "Determinado." },
      { id: "b6_I", dimensao: "I", texto: "Sociável." },
      { id: "b6_S", dimensao: "S", texto: "Colaborativo." },
      { id: "b6_C", dimensao: "C", texto: "Metódico." },
    ],
  },
  // --- Bloco 7 ---
  {
    index: 6,
    instrucao: "Escolha a que MAIS e a que MENOS descreve você:",
    opcoes: [
      { id: "b7_D", dimensao: "D", texto: "Tomo iniciativa e ajo com firmeza." },
      { id: "b7_I", dimensao: "I", texto: "Crio conexões e inspiro confiança." },
      { id: "b7_S", dimensao: "S", texto: "Mantenho a calma mesmo sob pressão." },
      { id: "b7_C", dimensao: "C", texto: "Verifico os fatos antes de decidir." },
    ],
  },
  // --- Bloco 8 ---
  {
    index: 7,
    instrucao: "Selecione a MAIS e a MENOS parecida com você:",
    opcoes: [
      { id: "b8_D", dimensao: "D", texto: "Foco em resultados concretos." },
      { id: "b8_I", dimensao: "I", texto: "Foco em relacionamentos e pessoas." },
      { id: "b8_S", dimensao: "S", texto: "Foco em manter a equipe unida." },
      { id: "b8_C", dimensao: "C", texto: "Foco em qualidade e excelência." },
    ],
  },
  // --- Bloco 9 ---
  {
    index: 8,
    instrucao: "Escolha a que MAIS e a que MENOS se aplica a você:",
    opcoes: [
      { id: "b9_D", dimensao: "D", texto: "Enfrento obstáculos de frente." },
      { id: "b9_I", dimensao: "I", texto: "Convenço os outros com entusiasmo." },
      { id: "b9_S", dimensao: "S", texto: "Ouço atentamente antes de responder." },
      { id: "b9_C", dimensao: "C", texto: "Planejo cada etapa com cuidado." },
    ],
  },
  // --- Bloco 10 ---
  {
    index: 9,
    instrucao: "Marque a MAIS e a MENOS semelhante ao seu comportamento:",
    opcoes: [
      { id: "b10_D", dimensao: "D", texto: "Assertivo." },
      { id: "b10_I", dimensao: "I", texto: "Entusiasmado." },
      { id: "b10_S", dimensao: "S", texto: "Confiável." },
      { id: "b10_C", dimensao: "C", texto: "Preciso." },
    ],
  },
  // --- Bloco 11 ---
  {
    index: 10,
    instrucao: "Escolha a alternativa que MAIS e a que MENOS descreve você:",
    opcoes: [
      { id: "b11_D", dimensao: "D", texto: "Gosto de liderar e definir o caminho." },
      { id: "b11_I", dimensao: "I", texto: "Gosto de interagir e trocar ideias." },
      { id: "b11_S", dimensao: "S", texto: "Gosto de apoiar e ajudar os colegas." },
      { id: "b11_C", dimensao: "C", texto: "Gosto de organizar e estruturar processos." },
    ],
  },
  // --- Bloco 12 ---
  {
    index: 11,
    instrucao: "Selecione a que MAIS e a que MENOS se aproxima de você:",
    opcoes: [
      { id: "b12_D", dimensao: "D", texto: "Decidido." },
      { id: "b12_I", dimensao: "I", texto: "Otimista." },
      { id: "b12_S", dimensao: "S", texto: "Paciente." },
      { id: "b12_C", dimensao: "C", texto: "Analítico." },
    ],
  },
  // --- Bloco 13 ---
  {
    index: 12,
    instrucao: "Escolha a descrição que MAIS e a que MENOS se aplica a você:",
    opcoes: [
      { id: "b13_D", dimensao: "D", texto: "Busco vencer e superar metas." },
      { id: "b13_I", dimensao: "I", texto: "Busco reconhecimento e aprovação." },
      { id: "b13_S", dimensao: "S", texto: "Busco segurança e continuidade." },
      { id: "b13_C", dimensao: "C", texto: "Busco perfeição e exatidão." },
    ],
  },
  // --- Bloco 14 ---
  {
    index: 13,
    instrucao: "Marque a MAIS e a MENOS parecida com você:",
    opcoes: [
      { id: "b14_D", dimensao: "D", texto: "Não tenho medo de confrontos necessários." },
      { id: "b14_I", dimensao: "I", texto: "Transformo ambientes tensos em descontraídos." },
      { id: "b14_S", dimensao: "S", texto: "Evito conflitos e busco consenso." },
      { id: "b14_C", dimensao: "C", texto: "Resolvo problemas com lógica e dados." },
    ],
  },
  // --- Bloco 15 ---
  {
    index: 14,
    instrucao: "Escolha a que MAIS e a que MENOS descreve você:",
    opcoes: [
      { id: "b15_D", dimensao: "D", texto: "Sou objetivo e vou direto ao ponto." },
      { id: "b15_I", dimensao: "I", texto: "Sou expressivo e gosto de compartilhar." },
      { id: "b15_S", dimensao: "S", texto: "Sou acolhedor e valorizo as pessoas." },
      { id: "b15_C", dimensao: "C", texto: "Sou criterioso e atento aos detalhes." },
    ],
  },
  // --- Bloco 16 ---
  {
    index: 15,
    instrucao: "Selecione a MAIS e a MENOS semelhante ao seu comportamento:",
    opcoes: [
      { id: "b16_D", dimensao: "D", texto: "Independente." },
      { id: "b16_I", dimensao: "I", texto: "Persuasivo." },
      { id: "b16_S", dimensao: "S", texto: "Compreensivo." },
      { id: "b16_C", dimensao: "C", texto: "Disciplinado." },
    ],
  },
  // --- Bloco 17 ---
  {
    index: 16,
    instrucao: "Escolha a alternativa que MAIS e a que MENOS se aplica a você:",
    opcoes: [
      { id: "b17_D", dimensao: "D", texto: "Prefiro agir do que ficar esperando." },
      { id: "b17_I", dimensao: "I", texto: "Prefiro conversar do que trabalhar sozinho." },
      { id: "b17_S", dimensao: "S", texto: "Prefiro rotina do que mudanças constantes." },
      { id: "b17_C", dimensao: "C", texto: "Prefiro planejar do que improvisar." },
    ],
  },
  // --- Bloco 18 ---
  {
    index: 17,
    instrucao: "Marque a MAIS e a MENOS parecida com você:",
    opcoes: [
      { id: "b18_D", dimensao: "D", texto: "Corajoso." },
      { id: "b18_I", dimensao: "I", texto: "Carismático." },
      { id: "b18_S", dimensao: "S", texto: "Gentil." },
      { id: "b18_C", dimensao: "C", texto: "Rigoroso." },
    ],
  },
  // --- Bloco 19 ---
  {
    index: 18,
    instrucao: "Escolha a que MAIS e a que MENOS descreve você:",
    opcoes: [
      { id: "b19_D", dimensao: "D", texto: "Quando vejo um problema, quero resolver logo." },
      { id: "b19_I", dimensao: "I", texto: "Quando vejo um problema, reúno as pessoas para discutir." },
      { id: "b19_S", dimensao: "S", texto: "Quando vejo um problema, avalio o impacto nas pessoas." },
      { id: "b19_C", dimensao: "C", texto: "Quando vejo um problema, investigo as causas com cuidado." },
    ],
  },
  // --- Bloco 20 ---
  {
    index: 19,
    instrucao: "Selecione a que MAIS e a que MENOS se aproxima de você:",
    opcoes: [
      { id: "b20_D", dimensao: "D", texto: "Ambicioso." },
      { id: "b20_I", dimensao: "I", texto: "Inspirador." },
      { id: "b20_S", dimensao: "S", texto: "Dedicado." },
      { id: "b20_C", dimensao: "C", texto: "Sistemático." },
    ],
  },
  // --- Bloco 21 ---
  {
    index: 20,
    instrucao: "Escolha a descrição que MAIS e a que MENOS se aplica a você:",
    opcoes: [
      { id: "b21_D", dimensao: "D", texto: "Gosto de ter autonomia para decidir." },
      { id: "b21_I", dimensao: "I", texto: "Gosto de trabalhar em grupo animado." },
      { id: "b21_S", dimensao: "S", texto: "Gosto de ambientes tranquilos e estáveis." },
      { id: "b21_C", dimensao: "C", texto: "Gosto de ter regras claras e definidas." },
    ],
  },
  // --- Bloco 22 ---
  {
    index: 21,
    instrucao: "Marque a MAIS e a MENOS semelhante ao seu comportamento:",
    opcoes: [
      { id: "b22_D", dimensao: "D", texto: "Prático." },
      { id: "b22_I", dimensao: "I", texto: "Criativo." },
      { id: "b22_S", dimensao: "S", texto: "Solidário." },
      { id: "b22_C", dimensao: "C", texto: "Perfeccionista." },
    ],
  },
  // --- Bloco 23 ---
  {
    index: 22,
    instrucao: "Escolha a alternativa que MAIS e a que MENOS descreve você:",
    opcoes: [
      { id: "b23_D", dimensao: "D", texto: "Sou rápido para tomar decisões." },
      { id: "b23_I", dimensao: "I", texto: "Sou bom em negociar e convencer." },
      { id: "b23_S", dimensao: "S", texto: "Sou bom ouvinte e conselheiro." },
      { id: "b23_C", dimensao: "C", texto: "Sou bom em encontrar erros e melhorias." },
    ],
  },
  // --- Bloco 24 ---
  {
    index: 23,
    instrucao: "Selecione a MAIS e a MENOS parecida com você:",
    opcoes: [
      { id: "b24_D", dimensao: "D", texto: "Resoluto." },
      { id: "b24_I", dimensao: "I", texto: "Animado." },
      { id: "b24_S", dimensao: "S", texto: "Tolerante." },
      { id: "b24_C", dimensao: "C", texto: "Exigente." },
    ],
  },
  // --- Bloco 25 ---
  {
    index: 24,
    instrucao: "Escolha a que MAIS e a que MENOS se aplica a você:",
    opcoes: [
      { id: "b25_D", dimensao: "D", texto: "Minha motivação vem de vencer desafios." },
      { id: "b25_I", dimensao: "I", texto: "Minha motivação vem do contato com pessoas." },
      { id: "b25_S", dimensao: "S", texto: "Minha motivação vem de fazer parte de um time." },
      { id: "b25_C", dimensao: "C", texto: "Minha motivação vem de fazer um trabalho bem feito." },
    ],
  },
  // --- Bloco 26 ---
  {
    index: 25,
    instrucao: "Marque a MAIS e a MENOS semelhante ao seu comportamento:",
    opcoes: [
      { id: "b26_D", dimensao: "D", texto: "Firme." },
      { id: "b26_I", dimensao: "I", texto: "Empolgante." },
      { id: "b26_S", dimensao: "S", texto: "Atencioso." },
      { id: "b26_C", dimensao: "C", texto: "Cauteloso." },
    ],
  },
  // --- Bloco 27 ---
  {
    index: 26,
    instrucao: "Escolha a alternativa que MAIS e a que MENOS descreve você:",
    opcoes: [
      { id: "b27_D", dimensao: "D", texto: "Sob pressão, eu acelero e busco soluções." },
      { id: "b27_I", dimensao: "I", texto: "Sob pressão, eu converso e busco apoio." },
      { id: "b27_S", dimensao: "S", texto: "Sob pressão, eu mantenho a calma e espero." },
      { id: "b27_C", dimensao: "C", texto: "Sob pressão, eu analiso e reviso os dados." },
    ],
  },
  // --- Bloco 28 ---
  {
    index: 27,
    instrucao: "Selecione a que MAIS e a que MENOS se aproxima de você:",
    opcoes: [
      { id: "b28_D", dimensao: "D", texto: "Valorizo eficiência e rapidez." },
      { id: "b28_I", dimensao: "I", texto: "Valorizo alegria e bom humor." },
      { id: "b28_S", dimensao: "S", texto: "Valorizo lealdade e confiança." },
      { id: "b28_C", dimensao: "C", texto: "Valorizo ordem e organização." },
    ],
  },
];

/**
 * Resposta de um bloco: qual opção é "mais" e qual é "menos"
 */
export interface DiscRespostaBloco {
  blocoIndex: number;
  maisId: string;    // id da opção escolhida como "mais parecido"
  menosId: string;   // id da opção escolhida como "menos parecido"
}

export interface DiscScores {
  D: number;
  I: number;
  S: number;
  C: number;
}

export interface DiscResultadoCalc {
  scores: DiscScores;                    // scores normalizados (0-100)
  scoresBrutos: DiscScores;              // scores brutos (soma +1/-1)
  perfilPredominante: DiscDimensao;
  perfilSecundario: DiscDimensao;
  indiceConsistencia: number;            // 0-100 (quanto maior, mais consistente)
  alertaBaixaDiferenciacao: boolean;     // true se scores muito próximos
}

/**
 * Calcula os scores DISC a partir das respostas de escolha forçada.
 * 
 * Algoritmo ipsativo:
 * - "Mais parecido" → +1 ponto para o fator
 * - "Menos parecido" → -1 ponto para o fator
 * - Os outros dois fatores do bloco → 0 pontos
 * 
 * Depois normaliza os scores brutos para escala 0-100.
 * Range bruto: mínimo -28 (sempre "menos"), máximo +28 (sempre "mais")
 */
export function calcularDiscScores(respostas: DiscRespostaBloco[]): DiscResultadoCalc {
  const scoresBrutos: DiscScores = { D: 0, I: 0, S: 0, C: 0 };

  // Mapear ids para dimensões
  const idToDimensao: Record<string, DiscDimensao> = {};
  for (const bloco of DISC_BLOCOS) {
    for (const opcao of bloco.opcoes) {
      idToDimensao[opcao.id] = opcao.dimensao;
    }
  }

  // Calcular scores brutos
  for (const resp of respostas) {
    const maisDim = idToDimensao[resp.maisId];
    const menosDim = idToDimensao[resp.menosId];
    
    if (maisDim) scoresBrutos[maisDim] += 1;
    if (menosDim) scoresBrutos[menosDim] -= 1;
  }

  // Normalizar para 0-100
  // Range bruto: -28 a +28 (56 pontos de range)
  // Fórmula: ((bruto + 28) / 56) * 100
  const normalizar = (bruto: number): number => {
    return Math.round(Math.max(0, Math.min(100, ((bruto + 28) / 56) * 100)));
  };

  const scores: DiscScores = {
    D: normalizar(scoresBrutos.D),
    I: normalizar(scoresBrutos.I),
    S: normalizar(scoresBrutos.S),
    C: normalizar(scoresBrutos.C),
  };

  // Determinar perfil predominante e secundário
  const sorted = (Object.entries(scores) as [DiscDimensao, number][])
    .sort((a, b) => b[1] - a[1]);

  // Calcular índice de consistência
  // Baseado na dispersão dos scores: quanto mais diferenciados, mais consistente
  const media = (scores.D + scores.I + scores.S + scores.C) / 4;
  const variancia = (
    Math.pow(scores.D - media, 2) +
    Math.pow(scores.I - media, 2) +
    Math.pow(scores.S - media, 2) +
    Math.pow(scores.C - media, 2)
  ) / 4;
  const desvioPadrao = Math.sqrt(variancia);
  
  // Normalizar índice de consistência (0-100)
  // Desvio padrão máximo teórico ~43.3 (quando um fator é 100 e outro 0)
  // Desvio padrão 0 = todos iguais = baixa consistência
  const indiceConsistencia = Math.round(Math.min(100, (desvioPadrao / 43.3) * 100));

  // Alerta de baixa diferenciação: quando desvio padrão < 8 (scores muito próximos)
  const alertaBaixaDiferenciacao = desvioPadrao < 8;

  return {
    scores,
    scoresBrutos,
    perfilPredominante: sorted[0][0],
    perfilSecundario: sorted[1][0],
    indiceConsistencia,
    alertaBaixaDiferenciacao,
  };
}

/**
 * Valida se as respostas estão completas e consistentes
 */
export function validarRespostas(respostas: DiscRespostaBloco[]): {
  valido: boolean;
  erros: string[];
} {
  const erros: string[] = [];

  if (respostas.length !== 28) {
    erros.push(`Esperado 28 blocos respondidos, encontrado ${respostas.length}.`);
  }

  for (const resp of respostas) {
    if (resp.maisId === resp.menosId) {
      erros.push(`Bloco ${resp.blocoIndex + 1}: "mais" e "menos" não podem ser a mesma opção.`);
    }
  }

  // Verificar se todos os blocos foram respondidos
  const blocosRespondidos = new Set(respostas.map(r => r.blocoIndex));
  for (let i = 0; i < 28; i++) {
    if (!blocosRespondidos.has(i)) {
      erros.push(`Bloco ${i + 1} não foi respondido.`);
    }
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Descrições dos perfis DISC
 */
export const DISC_PERFIS: Record<DiscDimensao, {
  nome: string;
  titulo: string;
  descricao: string;
  pontosFortes: string[];
  areasDesenvolvimento: string[];
  comoSeRelaciona: string;
  cor: string;
  subfatores: Partial<Record<DiscDimensao, string>>;
  percepcao: { comoSeVe: string; comoLiderancaVe: string; comoParesVeem: string };
}> = {
  D: {
    nome: "Dominância",
    titulo: "Executor Determinado",
    descricao: "Seu resultado indica uma tendência a assumir responsabilidades, agir com iniciativa e tomar decisões com rapidez, especialmente em situações desafiadoras ou com prazos reduzidos. Essa característica pode contribuir muito para impulsionar projetos, enfrentar obstáculos e manter o foco nos resultados.\n\nEm momentos de maior pressão, essa mesma agilidade pode levar você a decidir antes de considerar todos os pontos de vista. Por isso, pode ser útil reservar alguns instantes para ouvir outras opiniões e avaliar alternativas. Esse cuidado ajuda a tornar suas decisões ainda mais consistentes e fortalece a participação das pessoas ao seu redor.",
    pontosFortes: [
      "Tomada de decisão rápida e assertiva",
      "Foco em resultados e metas",
      "Capacidade de liderar em situações de pressão",
      "Determinação para superar obstáculos",
      "Iniciativa e proatividade"
    ],
    areasDesenvolvimento: [
      "Escuta Ativa — dar espaço para ouvir a equipe antes de decidir, evitando decisões apressadas",
      "Empatia — considerar o impacto emocional das decisões nas pessoas envolvidas",
      "Gestão de Conflitos — buscar acordos em vez de impor pontos de vista sob pressão",
      "Adaptabilidade — ajustar o ritmo quando o processo pede mais cautela do que velocidade"
    ],
    comoSeRelaciona: "Tende a ser direto e objetivo nas relações, valorizando eficiência e competência. Pode ser percebido como autoritário quando sob pressão.",
    cor: "#DC2626", // vermelho
    subfatores: {
      I: "Seu perfil secundário de Influência complementa muito bem a sua Dominância. Além de agir com objetividade e tomar decisões, você também tende a comunicar suas ideias com entusiasmo, envolver as pessoas e conquistar adesão para os objetivos que deseja alcançar.\n\nEm situações de maior pressão ou urgência, pode ser importante equilibrar a rapidez com alguns momentos de escuta e alinhamento. Antes de avançar, procure confirmar se as pessoas compreenderam a proposta, tiveram espaço para contribuir e sabem como participar da decisão.\n\nAo combinar sua capacidade de agir com uma comunicação mais aberta e cuidadosa, você amplia seu poder de influência, fortalece os relacionamentos e aumenta as chances de alcançar resultados com o apoio genuíno das pessoas.",
      S: "Seu perfil secundário de Estabilidade complementa muito bem a sua Dominância. Além de agir com decisão e buscar resultados, você também tende a considerar o impacto das suas escolhas nas pessoas e a manter mais consistência ao longo do caminho.\n\nEm situações de maior pressão ou urgência, pode ser importante equilibrar a vontade de resultado imediato com um momento de pausa para avaliar como a decisão afeta quem está ao seu redor.\n\nAo combinar sua agilidade com essa capacidade de ponderar, você toma decisões igualmente rápidas, mas mais sustentáveis, e fortalece a confiança de quem trabalha com você.",
      C: "Seu perfil secundário de Conformidade complementa muito bem a sua Dominância. Além de agir com rapidez, você também tende a validar dados e buscar critério antes de decidir, o que traz mais consistência às suas escolhas.\n\nEm situações de maior pressão ou urgência, pode ser importante reservar alguns instantes para checar as informações disponíveis antes de seguir apenas pelo instinto de agir rápido.\n\nAo combinar sua agilidade com esse cuidado analítico, suas decisões ganham mais precisão sem perder a velocidade que você já tem naturalmente.",
    },
    percepcao: {
      comoSeVe: "Você tende a se ver como alguém decidido, direto e orientado a resultados — a pessoa que assume o controle quando é preciso agir.",
      comoLiderancaVe: "Há uma forte tendência de que a liderança o perceba como alguém confiável para tocar entregas e tomar decisões difíceis, mas pode esperar mais paciência e escuta em momentos que exigem construção coletiva.",
      comoParesVeem: "Há uma forte tendência de que os pares o percebam como alguém enérgico e assertivo, que ajuda o grupo a avançar — mas que, sob pressão, pode soar impositivo ou pouco aberto a outras opiniões.",
    },
  },
  I: {
    nome: "Influência",
    titulo: "Comunicador Inspirador",
    descricao: "Seu resultado indica uma tendência a se comunicar com entusiasmo, criar conexões com facilidade e contagiar as pessoas ao redor com energia positiva. Essa característica pode contribuir muito para engajar equipes, gerar ideias novas e manter o ambiente motivado.\n\nEm momentos de maior pressão, essa mesma facilidade de se envolver em várias frentes pode levar você a assumir mais compromissos do que consegue cumprir com calma. Por isso, pode ser útil reservar um tempo para organizar prioridades antes de dizer sim a tudo. Esse cuidado ajuda a manter sua energia sustentável e fortalece a confiança das pessoas que contam com você.",
    pontosFortes: [
      "Comunicação persuasiva e envolvente",
      "Capacidade de motivar e inspirar equipes",
      "Criatividade e pensamento inovador",
      "Networking e construção de relacionamentos",
      "Otimismo e energia positiva"
    ],
    areasDesenvolvimento: [
      "Planejamento e Organização — estruturar um plano antes de agir, evitando começar várias coisas ao mesmo tempo",
      "Gestão do Tempo — criar rotinas de acompanhamento para não perder prazos",
      "Leitura de Cenário — analisar dados e contexto antes de se deixar levar pelo entusiasmo do momento",
      "Disciplina — manter constância na execução de tarefas repetitivas, mesmo sem estímulo imediato"
    ],
    comoSeRelaciona: "Tende a ser caloroso e acessível, criando um ambiente positivo. Pode ser percebido como disperso quando há muitas ideias em andamento.",
    cor: "#F59E0B", // amarelo/âmbar
    subfatores: {
      D: "Seu perfil secundário de Dominância complementa muito bem a sua Influência. Além de engajar e comunicar com entusiasmo, você também tende a buscar resultados concretos e a assumir o controle quando a situação exige.\n\nEm situações de maior pressão ou urgência, pode ser importante equilibrar o entusiasmo do momento com um pouco mais de planejamento antes de acelerar o ritmo.\n\nAo combinar sua capacidade de engajar pessoas com essa disposição para agir, você transforma entusiasmo em resultado com mais consistência.",
      S: "Seu perfil secundário de Estabilidade complementa muito bem a sua Influência. Além de se conectar e envolver as pessoas com facilidade, você também tende a construir relações de confiança mais duradouras e acolhedoras.\n\nEm situações de maior pressão ou urgência, pode ser importante equilibrar a busca por novidade e estímulo com momentos de rotina e constância, para que o entusiasmo inicial se sustente ao longo do tempo.\n\nAo combinar sua energia envolvente com essa capacidade de construir vínculos duradouros, você fortalece relações que vão além do primeiro impacto.",
      C: "Seu perfil secundário de Conformidade complementa muito bem a sua Influência. Além de se comunicar com entusiasmo, você também tende a ter atenção a detalhes e alguma precisão técnica nas suas entregas.\n\nEm situações de maior pressão ou urgência, pode ser importante equilibrar a vontade de avançar rápido com um pouco mais de tempo de análise antes de comunicar a proposta.\n\nAo combinar sua comunicação envolvente com esse cuidado técnico, você une entusiasmo e credibilidade nas suas ideias.",
    },
    percepcao: {
      comoSeVe: "Você tende a se ver como alguém comunicativo, otimista e capaz de motivar as pessoas ao seu redor.",
      comoLiderancaVe: "Há uma forte tendência de que a liderança o perceba como alguém que engaja times e dá energia ao ambiente, mas pode cobrar mais consistência no acompanhamento das entregas.",
      comoParesVeem: "Há uma forte tendência de que os pares o percebam como alguém acessível e agradável de trabalhar junto, ainda que às vezes pareça disperso ou inconstante em compromissos de rotina.",
    },
  },
  S: {
    nome: "Estabilidade",
    titulo: "Colaborador Consistente",
    descricao: "Seu resultado indica uma tendência a agir com paciência, buscar harmonia nas relações e oferecer apoio consistente às pessoas ao redor. Essa característica pode contribuir muito para fortalecer a confiança da equipe, manter a estabilidade em momentos difíceis e sustentar compromissos ao longo do tempo.\n\nEm momentos de maior pressão, essa mesma busca por harmonia pode levar você a evitar se posicionar mesmo quando discorda de algo importante. Por isso, pode ser útil expressar sua opinião logo quando ela surge, antes que o desconforto se acumule. Esse cuidado ajuda a tornar suas relações ainda mais verdadeiras e fortalece sua própria voz dentro do grupo.",
    pontosFortes: [
      "Paciência e capacidade de escuta",
      "Lealdade e comprometimento",
      "Trabalho em equipe e cooperação",
      "Consistência e confiabilidade",
      "Mediação de conflitos"
    ],
    areasDesenvolvimento: [
      "Comunicação Assertiva — expressar discordâncias e opiniões próprias de forma mais direta",
      "Adaptabilidade — se abrir mais rápido a mudanças de plano, mesmo fora da zona de conforto",
      "Tomada de Decisão — decidir com mais agilidade quando a situação exige resposta rápida",
      "Protagonismo — se posicionar e assumir mais visibilidade em vez de ficar em segundo plano"
    ],
    comoSeRelaciona: "Tende a ser acolhedor e solidário, priorizando o bem-estar do grupo. Pode ser percebido como resistente a mudanças quando sai da zona de conforto.",
    cor: "#16A34A", // verde
    subfatores: {
      D: "Seu perfil secundário de Dominância complementa muito bem a sua Estabilidade. Além de ser confiável e cooperativo, você também tende a ganhar mais disposição para se posicionar e tomar decisões rápidas quando necessário.\n\nEm situações de maior pressão ou urgência, pode ser importante equilibrar a busca por harmonia com a coragem de comunicar sua posição, mesmo quando ela pode gerar algum desconforto.\n\nAo combinar sua consistência com essa disposição para agir, você se torna alguém em quem as pessoas confiam tanto para manter a estabilidade quanto para avançar quando é preciso.",
      I: "Seu perfil secundário de Influência complementa muito bem a sua Estabilidade. Além de construir relações de confiança, você também tende a se expressar com mais entusiasmo e calor humano nas suas interações.\n\nEm situações de maior pressão ou urgência, pode ser importante equilibrar a preferência por rotina com uma abertura maior para a novidade e o estímulo social que o momento pode pedir.\n\nAo combinar sua confiabilidade com essa capacidade de se comunicar com entusiasmo, você fortalece relações que são ao mesmo tempo estáveis e calorosas.",
      C: "Seu perfil secundário de Conformidade complementa muito bem a sua Estabilidade. Além de ser confiável nas relações, você também tende a trazer mais método e precisão na execução técnica do seu trabalho.\n\nEm situações de maior pressão ou urgência, pode ser importante equilibrar a cautela natural dos dois fatores com um esforço consciente para responder com mais agilidade quando o momento exige.\n\nAo combinar sua confiabilidade com essa precisão técnica, você entrega resultados consistentes nos quais as pessoas podem confiar plenamente.",
    },
    percepcao: {
      comoSeVe: "Você tende a se ver como alguém confiável, paciente e disposto a apoiar o time sempre que possível.",
      comoLiderancaVe: "Há uma forte tendência de que a liderança o perceba como uma base estável do time, mas pode esperar mais iniciativa própria e posicionamento em momentos de decisão.",
      comoParesVeem: "Há uma forte tendência de que os pares o percebam como alguém leal e fácil de contar, ainda que, às vezes, percebam certa resistência a sair da rotina estabelecida.",
    },
  },
  C: {
    nome: "Conformidade",
    titulo: "Analista Preciso",
    descricao: "Seu resultado indica uma tendência a analisar com cuidado, buscar precisão e se dedicar à qualidade em tudo que faz. Essa característica pode contribuir muito para elevar o padrão dos resultados, antecipar riscos e trazer mais confiabilidade aos processos.\n\nEm momentos de maior pressão, essa mesma busca por precisão pode levar você a adiar decisões enquanto espera por mais informações. Por isso, pode ser útil definir um limite de tempo para a análise e seguir em frente mesmo sem 100% de certeza. Esse cuidado ajuda a manter a qualidade do seu trabalho sem perder o ritmo necessário.",
    pontosFortes: [
      "Análise crítica e pensamento lógico",
      "Atenção a detalhes e qualidade",
      "Planejamento e organização",
      "Tomada de decisão baseada em dados",
      "Consistência e padrões elevados"
    ],
    areasDesenvolvimento: [
      "Adaptabilidade — lidar melhor com mudanças de última hora e imprevistos",
      "Inteligência Emocional — equilibrar a análise técnica com mais sensibilidade ao lado humano das situações",
      "Tomada de Decisão — avançar com a informação disponível, sem esperar 100% de certeza",
      "Resiliência — lidar com erros e imperfeições de forma mais leve, sem exigência excessiva de si e dos outros"
    ],
    comoSeRelaciona: "Tende a ser reservado e objetivo, valorizando competência e precisão. Pode ser percebido como excessivamente crítico quando os padrões não são atendidos.",
    cor: "#2563EB", // azul
    subfatores: {
      D: "Seu perfil secundário de Dominância complementa muito bem a sua Conformidade. Além de analisar com rigor técnico, você também tende a ganhar mais disposição para decidir e agir quando a situação pede.\n\nEm situações de maior pressão ou urgência, pode ser importante equilibrar a busca por precisão com a urgência por resultado, definindo até onde a análise é realmente necessária antes de decidir.\n\nAo combinar seu rigor técnico com essa disposição para agir, você une qualidade e agilidade nas suas entregas.",
      I: "Seu perfil secundário de Influência complementa muito bem a sua Conformidade. Além de manter o rigor analítico, você também tende a ganhar mais facilidade para se comunicar e engajar pessoas em torno das suas conclusões.\n\nEm situações de maior pressão ou urgência, pode ser importante equilibrar o rigor da análise com a espontaneidade de comunicar suas ideias antes que estejam cem por cento prontas.\n\nAo combinar sua precisão analítica com essa facilidade de comunicação, você transforma boas análises em ideias que realmente engajam as pessoas.",
      S: "Seu perfil secundário de Estabilidade complementa muito bem a sua Conformidade. Além de buscar precisão e método, você também tende a ser confiável e constante nas relações e na rotina.\n\nEm situações de maior pressão ou urgência, pode ser importante equilibrar a cautela natural dos dois fatores com um esforço consciente para responder com mais agilidade quando o tempo é curto.\n\nAo combinar sua precisão técnica com essa constância nas relações, você se torna alguém em quem colegas e liderança confiam tanto pela qualidade quanto pela previsibilidade do seu trabalho.",
    },
    percepcao: {
      comoSeVe: "Você tende a se ver como alguém analítico, criterioso e comprometido com a qualidade do que entrega.",
      comoLiderancaVe: "Há uma forte tendência de que a liderança o perceba como alguém que traz segurança técnica e rigor às entregas, mas pode esperar mais flexibilidade diante de imprevistos e prazos apertados.",
      comoParesVeem: "Há uma forte tendência de que os pares o percebam como uma referência de qualidade e método, ainda que, às vezes, percebam certa rigidez ou crítica excessiva quando os padrões não são atendidos.",
    },
  }
};

/**
 * Como cada perfil tende a reagir sob pressão — e o caminho de autorregulação.
 * Descreve tendências prováveis, não determinações: a mesma pessoa pode reagir de formas
 * diferentes dependendo do contexto, do nível de energia e da experiência acumulada.
 */
export const PRESSAO_DISC: Record<DiscDimensao, {
  necessidadeAmeacada: string;
  reacaoRisco: string;
  respostaRegulada: string;
}> = {
  D: {
    necessidadeAmeacada: "Perda de controle ou de autonomia sobre a situação",
    reacaoRisco: "Impor decisões, atropelar opiniões e aumentar o tom de urgência mesmo quando não é necessário",
    respostaRegulada: "Nomear a pressão antes de agir, abrir um espaço breve de escuta antes de decidir e distinguir urgência real de urgência percebida",
  },
  I: {
    necessidadeAmeacada: "Perda de aprovação ou de reconhecimento social",
    reacaoRisco: "Evitar o conflito direto, prometer mais do que consegue entregar e dispersar o foco em várias frentes ao mesmo tempo",
    respostaRegulada: "Nomear o desconforto sem precisar agradar a todos, reduzir compromissos assumidos por impulso e buscar dados antes de reagir emocionalmente",
  },
  S: {
    necessidadeAmeacada: "Perda de previsibilidade ou de segurança na rotina",
    reacaoRisco: "Paralisar diante de mudanças bruscas, evitar se posicionar para não gerar atrito e acumular insatisfação sem comunicar",
    respostaRegulada: "Expressar a discordância assim que ela surge, permitir-se agir com informação parcial e buscar apoio para lidar com a mudança em vez de resistir sozinho",
  },
  C: {
    necessidadeAmeacada: "Perda de precisão ou de controle sobre a qualidade do resultado",
    reacaoRisco: "Travar em busca de mais dados, ser excessivamente crítico consigo ou com os outros e adiar decisões por medo do erro",
    respostaRegulada: "Definir um nível suficiente de informação para decidir, separar fato de interpretação antes de criticar e aceitar entregas boas o bastante quando o prazo exige",
  },
};

/**
 * Áreas de desenvolvimento na perspectiva "força preservada / repertório a ampliar":
 * evita o tom de fraqueza e mostra que o ponto de atenção é a mesma força usada em excesso
 * ou fora de hora — não uma limitação isolada.
 */
export const DESENVOLVIMENTO_DETALHADO: Record<DiscDimensao, {
  competencia: string;
  forcaPreservada: string;
  repertorioAmpliar: string;
}[]> = {
  D: [
    { competencia: "Escuta Ativa", forcaPreservada: "Agilidade para decidir e agir sem travar diante de incertezas", repertorioAmpliar: "Abrir espaço para ouvir a equipe antes de fechar a decisão, mesmo quando o instinto já indica um caminho" },
    { competencia: "Empatia", forcaPreservada: "Firmeza para manter o foco no resultado mesmo sob pressão", repertorioAmpliar: "Considerar o impacto emocional das decisões nas pessoas envolvidas antes de comunicá-las" },
    { competencia: "Gestão de Conflitos", forcaPreservada: "Coragem para lidar com situações difíceis sem evitá-las", repertorioAmpliar: "Buscar acordos em vez de impor pontos de vista quando a situação está tensa" },
    { competencia: "Adaptabilidade", forcaPreservada: "Disposição para agir rápido diante de mudanças", repertorioAmpliar: "Ajustar o ritmo quando o processo pede mais cautela do que velocidade" },
  ],
  I: [
    { competencia: "Planejamento e Organização", forcaPreservada: "Entusiasmo para começar novas iniciativas", repertorioAmpliar: "Estruturar um plano antes de agir, evitando começar várias coisas ao mesmo tempo" },
    { competencia: "Gestão de Tempo", forcaPreservada: "Energia para se envolver em múltiplas frentes", repertorioAmpliar: "Criar rotinas de acompanhamento para não perder prazos assumidos" },
    { competencia: "Leitura de Cenário", forcaPreservada: "Otimismo que mantém a equipe motivada", repertorioAmpliar: "Analisar dados e contexto antes de se deixar levar pelo entusiasmo do momento" },
    { competencia: "Disciplina", forcaPreservada: "Facilidade para engajar e mobilizar pessoas", repertorioAmpliar: "Manter constância na execução depois que o entusiasmo inicial passa" },
  ],
  S: [
    { competencia: "Comunicação Assertiva", forcaPreservada: "Capacidade de acolher e manter a harmonia do grupo", repertorioAmpliar: "Expressar discordâncias e opiniões próprias de forma mais direta" },
    { competencia: "Adaptabilidade", forcaPreservada: "Consistência que traz estabilidade para a equipe", repertorioAmpliar: "Se abrir mais rápido a mudanças de plano, mesmo fora da zona de conforto" },
    { competencia: "Tomada de Decisão", forcaPreservada: "Cautela que evita decisões precipitadas", repertorioAmpliar: "Decidir com mais agilidade quando a situação exige resposta rápida" },
    { competencia: "Protagonismo", forcaPreservada: "Discrição que facilita a cooperação e evita disputas", repertorioAmpliar: "Se posicionar e assumir mais visibilidade em vez de ficar em segundo plano" },
  ],
  C: [
    { competencia: "Adaptabilidade", forcaPreservada: "Rigor técnico que garante qualidade e consistência", repertorioAmpliar: "Lidar melhor com mudanças de última hora e imprevistos" },
    { competencia: "Inteligência Emocional", forcaPreservada: "Objetividade que reduz vieses na análise", repertorioAmpliar: "Equilibrar a análise técnica com mais sensibilidade ao lado humano das situações" },
    { competencia: "Tomada de Decisão", forcaPreservada: "Cuidado que evita erros por precipitação", repertorioAmpliar: "Avançar com a informação disponível, sem esperar 100% de certeza" },
    { competencia: "Resiliência", forcaPreservada: "Padrão elevado que eleva a qualidade do time", repertorioAmpliar: "Lidar com erros e imperfeições de forma mais leve, sem exigência excessiva de si e dos outros" },
  ],
};

/**
 * Labels da escala de autopercepção (1-5)
 */
export const AUTOPERCEPÇÃO_LABELS: Record<number, string> = {
  1: "Preciso desenvolver muito",
  2: "Preciso desenvolver",
  3: "Razoável",
  4: "Bom domínio",
  5: "Domino com excelência",
};
