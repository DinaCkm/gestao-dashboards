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
}> = {
  D: {
    nome: "Dominância",
    titulo: "Executor Determinado",
    descricao: "Você é uma pessoa orientada a resultados, que gosta de assumir o controle e tomar decisões rápidas. Tem energia para enfrentar desafios e não tem medo de situações difíceis. Sua determinação e foco em objetivos são suas maiores forças.",
    pontosFortes: [
      "Tomada de decisão rápida e assertiva",
      "Foco em resultados e metas",
      "Capacidade de liderar em situações de pressão",
      "Determinação para superar obstáculos",
      "Iniciativa e proatividade"
    ],
    areasDesenvolvimento: [
      "Paciência com processos mais lentos",
      "Escuta ativa e empatia",
      "Delegação e confiança na equipe",
      "Flexibilidade diante de mudanças de plano"
    ],
    comoSeRelaciona: "Tende a ser direto e objetivo nas relações, valorizando eficiência e competência. Pode ser percebido como autoritário quando sob pressão.",
    cor: "#DC2626" // vermelho
  },
  I: {
    nome: "Influência",
    titulo: "Comunicador Inspirador",
    descricao: "Você é uma pessoa comunicativa, entusiasta e que inspira os outros com sua energia positiva. Tem facilidade para criar conexões e motivar equipes. Sua capacidade de influenciar e engajar pessoas é sua maior força.",
    pontosFortes: [
      "Comunicação persuasiva e envolvente",
      "Capacidade de motivar e inspirar equipes",
      "Criatividade e pensamento inovador",
      "Networking e construção de relacionamentos",
      "Otimismo e energia positiva"
    ],
    areasDesenvolvimento: [
      "Foco em detalhes e acompanhamento",
      "Organização e gestão do tempo",
      "Análise crítica antes de agir",
      "Consistência na execução de tarefas rotineiras"
    ],
    comoSeRelaciona: "Tende a ser caloroso e acessível, criando um ambiente positivo. Pode ser percebido como disperso quando há muitas ideias em andamento.",
    cor: "#F59E0B" // amarelo/âmbar
  },
  S: {
    nome: "Estabilidade",
    titulo: "Colaborador Consistente",
    descricao: "Você é uma pessoa confiável, paciente e que valoriza a harmonia nas relações. Tem grande capacidade de ouvir e apoiar os outros. Sua consistência e lealdade são suas maiores forças.",
    pontosFortes: [
      "Paciência e capacidade de escuta",
      "Lealdade e comprometimento",
      "Trabalho em equipe e cooperação",
      "Consistência e confiabilidade",
      "Mediação de conflitos"
    ],
    areasDesenvolvimento: [
      "Assertividade e posicionamento",
      "Adaptação a mudanças rápidas",
      "Tomada de decisão sob pressão",
      "Expressão de opiniões divergentes"
    ],
    comoSeRelaciona: "Tende a ser acolhedor e solidário, priorizando o bem-estar do grupo. Pode ser percebido como resistente a mudanças quando sai da zona de conforto.",
    cor: "#16A34A" // verde
  },
  C: {
    nome: "Conformidade",
    titulo: "Analista Preciso",
    descricao: "Você é uma pessoa analítica, detalhista e que busca excelência em tudo que faz. Tem grande capacidade de planejamento e organização. Sua precisão e pensamento lógico são suas maiores forças.",
    pontosFortes: [
      "Análise crítica e pensamento lógico",
      "Atenção a detalhes e qualidade",
      "Planejamento e organização",
      "Tomada de decisão baseada em dados",
      "Consistência e padrões elevados"
    ],
    areasDesenvolvimento: [
      "Flexibilidade e adaptação",
      "Comunicação emocional e empatia",
      "Velocidade na tomada de decisão",
      "Tolerância com imperfeições"
    ],
    comoSeRelaciona: "Tende a ser reservado e objetivo, valorizando competência e precisão. Pode ser percebido como excessivamente crítico quando os padrões não são atendidos.",
    cor: "#2563EB" // azul
  }
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
