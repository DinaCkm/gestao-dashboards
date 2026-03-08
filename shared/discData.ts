/**
 * Dados do Teste DISC - 28 afirmações (7 por dimensão)
 * Escala Likert: 1 (Discordo totalmente) a 5 (Concordo totalmente)
 * 
 * D = Dominância: foco em resultados, decisão, controle
 * I = Influência: foco em pessoas, comunicação, entusiasmo
 * S = Estabilidade: foco em cooperação, paciência, consistência
 * C = Conformidade: foco em qualidade, precisão, análise
 */

export type DiscDimensao = "D" | "I" | "S" | "C";

export interface DiscPergunta {
  index: number;
  dimensao: DiscDimensao;
  texto: string;
}

export const DISC_PERGUNTAS: DiscPergunta[] = [
  // === DOMINÂNCIA (D) - 7 perguntas ===
  { index: 0, dimensao: "D", texto: "Eu gosto de assumir o controle das situações e tomar decisões rapidamente." },
  { index: 1, dimensao: "D", texto: "Quando enfrento um desafio, minha primeira reação é agir imediatamente." },
  { index: 2, dimensao: "D", texto: "Prefiro liderar do que seguir instruções de outras pessoas." },
  { index: 3, dimensao: "D", texto: "Sou direto(a) ao comunicar minhas opiniões, mesmo que possam gerar desconforto." },
  { index: 4, dimensao: "D", texto: "Resultados concretos são mais importantes para mim do que o processo para alcançá-los." },
  { index: 5, dimensao: "D", texto: "Sinto-me motivado(a) por competição e pela busca de metas ambiciosas." },
  { index: 6, dimensao: "D", texto: "Tenho facilidade em tomar decisões difíceis, mesmo sob pressão." },

  // === INFLUÊNCIA (I) - 7 perguntas ===
  { index: 7, dimensao: "I", texto: "Gosto de interagir com pessoas e criar novas conexões sociais." },
  { index: 8, dimensao: "I", texto: "Consigo motivar e entusiasmar as pessoas ao meu redor com facilidade." },
  { index: 9, dimensao: "I", texto: "Prefiro trabalhar em equipe do que sozinho(a)." },
  { index: 10, dimensao: "I", texto: "Sou otimista e costumo ver o lado positivo das situações." },
  { index: 11, dimensao: "I", texto: "Tenho facilidade para me expressar e comunicar minhas ideias." },
  { index: 12, dimensao: "I", texto: "Gosto de ambientes dinâmicos e criativos, onde posso compartilhar ideias." },
  { index: 13, dimensao: "I", texto: "As pessoas costumam me procurar quando precisam de apoio emocional ou motivação." },

  // === ESTABILIDADE (S) - 7 perguntas ===
  { index: 14, dimensao: "S", texto: "Valorizo a estabilidade e prefiro ambientes previsíveis e organizados." },
  { index: 15, dimensao: "S", texto: "Sou paciente e consigo manter a calma mesmo em situações de conflito." },
  { index: 16, dimensao: "S", texto: "Prefiro ouvir e entender todos os lados antes de me posicionar." },
  { index: 17, dimensao: "S", texto: "Sou leal às pessoas e aos compromissos que assumo." },
  { index: 18, dimensao: "S", texto: "Mudanças repentinas me deixam desconfortável; prefiro transições graduais." },
  { index: 19, dimensao: "S", texto: "Gosto de ajudar os outros e me sinto bem quando contribuo para o bem-estar da equipe." },
  { index: 20, dimensao: "S", texto: "Prefiro manter a harmonia do grupo, mesmo que isso signifique ceder em algumas situações." },

  // === CONFORMIDADE (C) - 7 perguntas ===
  { index: 21, dimensao: "C", texto: "Antes de tomar uma decisão, preciso analisar todos os dados e informações disponíveis." },
  { index: 22, dimensao: "C", texto: "Sou detalhista e me preocupo com a qualidade e a precisão do meu trabalho." },
  { index: 23, dimensao: "C", texto: "Prefiro seguir regras e procedimentos estabelecidos." },
  { index: 24, dimensao: "C", texto: "Costumo questionar informações e buscar evidências antes de aceitar algo." },
  { index: 25, dimensao: "C", texto: "Organização e planejamento são essenciais para mim antes de iniciar qualquer tarefa." },
  { index: 26, dimensao: "C", texto: "Sinto-me desconfortável quando o trabalho é feito de forma improvisada ou sem padrão." },
  { index: 27, dimensao: "C", texto: "Valorizo a lógica e a razão acima das emoções na tomada de decisões." },
];

export const DISC_ESCALA_LABELS: Record<number, string> = {
  1: "Discordo totalmente",
  2: "Discordo parcialmente",
  3: "Neutro",
  4: "Concordo parcialmente",
  5: "Concordo totalmente",
};

export interface DiscScores {
  D: number;
  I: number;
  S: number;
  C: number;
}

export interface DiscResultadoCalc {
  scores: DiscScores;
  perfilPredominante: DiscDimensao;
  perfilSecundario: DiscDimensao;
}

/**
 * Calcula os scores DISC a partir das respostas
 * Cada dimensão: soma das 7 respostas (7-35), normalizada para 0-100
 */
export function calcularDiscScores(respostas: { dimensao: DiscDimensao; resposta: number }[]): DiscResultadoCalc {
  const somas: DiscScores = { D: 0, I: 0, S: 0, C: 0 };
  const contagens: DiscScores = { D: 0, I: 0, S: 0, C: 0 };

  for (const r of respostas) {
    somas[r.dimensao] += r.resposta;
    contagens[r.dimensao]++;
  }

  // Normalizar para 0-100 (min=7, max=35 por dimensão)
  const scores: DiscScores = {
    D: contagens.D > 0 ? Math.round(((somas.D - contagens.D) / (contagens.D * 4)) * 100) : 0,
    I: contagens.I > 0 ? Math.round(((somas.I - contagens.I) / (contagens.I * 4)) * 100) : 0,
    S: contagens.S > 0 ? Math.round(((somas.S - contagens.S) / (contagens.S * 4)) * 100) : 0,
    C: contagens.C > 0 ? Math.round(((somas.C - contagens.C) / (contagens.C * 4)) * 100) : 0,
  };

  // Determinar perfil predominante e secundário
  const sorted = (Object.entries(scores) as [DiscDimensao, number][])
    .sort((a, b) => b[1] - a[1]);

  return {
    scores,
    perfilPredominante: sorted[0][0],
    perfilSecundario: sorted[1][0],
  };
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
