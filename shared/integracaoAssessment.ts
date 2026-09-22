export type IntegracaoClusterKey =
  | "cognitivas_analiticas"
  | "intrapessoais_autogestao"
  | "interpessoais_relacionais"
  | "lideranca_gestao"
  | "estrategicas_organizacionais";

export interface IntegracaoClusterDef {
  key: IntegracaoClusterKey;
  nome: string;
  competencias: string[];
  descritoresGestor: string[];
}

export const INTEGRACAO_CLUSTERS: IntegracaoClusterDef[] = [
  {
    key: "cognitivas_analiticas",
    nome: "Competências Cognitivas e Analíticas",
    competencias: [
      "Atenção",
      "Memória",
      "Raciocínio Lógico e Espacial",
      "Leitura de Cenário",
      "Radar de Cenários",
    ],
    descritoresGestor: [
      "Analítico",
      "Criativo",
      "Curioso",
      "Detalhista",
      "Investigativo",
      "Meticuloso",
      "Observador",
      "Objetivo",
      "Prático",
      "Prudente",
      "Realista",
      "Reflexivo",
    ],
  },
  {
    key: "intrapessoais_autogestao",
    nome: "Competências Intrapessoais e de Autogestão",
    competencias: [
      "Gestão do Tempo",
      "Autopercepção",
      "Disciplina",
      "Accountability",
      "Adaptabilidade",
      "Inteligência Emocional",
      "Planejamento e Organização",
      "Proatividade",
      "Protagonismo",
      "Resiliência",
      "Adaptabilidade Dinâmica",
      "Inteligência Emocional Tática",
    ],
    descritoresGestor: [
      "Autêntico",
      "Autoconfiante",
      "Calmo",
      "Cauteloso",
      "Corajoso",
      "Determinado",
      "Equilibrado",
      "Flexível",
      "Impaciente",
      "Independente",
      "Ousado",
      "Paciente",
      "Persistente",
      "Seguro",
    ],
  },
  {
    key: "interpessoais_relacionais",
    nome: "Competências Interpessoais e Relacionais",
    competencias: [
      "Gestão de Conflitos",
      "Empatia",
      "Escuta Ativa",
      "Comunicação Assertiva",
      "Influência",
      "Negociação",
      "Relacionamentos Conectivos",
    ],
    descritoresGestor: [
      "Acolhedor",
      "Atencioso",
      "Carismático",
      "Compreensivo",
      "Comunicativo",
      "Diplomático",
      "Direto",
      "Extrovertido",
      "Gentil",
      "Persuasivo",
      "Receptivo",
      "Reservado",
      "Respeitoso",
      "Sensível",
      "Sociável",
      "Tolerante",
    ],
  },
  {
    key: "lideranca_gestao",
    nome: "Competências de Liderança e Gestão",
    competencias: [
      "Gestão de Equipes",
      "Gestão da Comunicação",
      "Presença Executiva",
      "Decisões Ágeis",
      "Tomada de Decisão",
      "Foco em Resultados",
    ],
    descritoresGestor: [
      "Assertivo",
      "Competitivo",
      "Decidido",
      "Empreendedor",
      "Exigente",
      "Firme",
      "Inspirador",
      "Mobilizador",
      "Motivador",
      "Orientador",
    ],
  },
  {
    key: "estrategicas_organizacionais",
    nome: "Competências Estratégicas e Organizacionais",
    competencias: [
      "Arquitetura de Mudanças",
      "Estratégia de Longo Alcance",
      "Mentalidade Sistêmica",
      "Mindset Visionário",
      "Responsabilidade Social",
      "Visão Estratégica",
    ],
    descritoresGestor: [
      "Arrojado",
      "Conservador",
      "Estratégico",
      "Inovador",
      "Pragmático",
      "Previsor",
      "Questionador",
      "Versátil",
    ],
  },
];

export const BEM_ACOLHIDO_DESCRITORES = INTEGRACAO_CLUSTERS.flatMap(
  (cluster) => cluster.descritoresGestor,
);

export const DISC_PERFIL_RESUMO = [
  {
    key: "D",
    nome: "Dominância (D)",
    rotulo: "Dominante",
    descricao:
      "Representa força, energia e objetividade. São pessoas diretas, competitivas, focadas em resultados rápidos, metas e desafios.",
  },
  {
    key: "I",
    nome: "Influência (I)",
    rotulo: "Influente",
    descricao:
      "Relaciona-se à extroversão, comunicação e otimismo. São indivíduos dinâmicos, entusiastas, persuasivos e focados em se conectar com os outros.",
  },
  {
    key: "S",
    nome: "Estabilidade (S)",
    rotulo: "Estável",
    descricao:
      "Simboliza equilíbrio, harmonia e paciência. Identifica pessoas calmas, leais, que evitam conflitos, valorizam segurança e apoiam o grupo.",
  },
  {
    key: "C",
    nome: "Conformidade / Cautela (C)",
    rotulo: "Conforme",
    descricao:
      "Relaciona-se à precisão, lógica e cautela. Define pessoas analíticas, detalhistas, organizadas e atentas a regras, padrões e qualidade.",
  },
] as const;


export type BemMatrixVersion = "historica" | "atual";

export const BEM_MATRIZ_ATUAL_VERSAO = 2;

// Momento em que a nova lista foi efetivamente publicada em produção.
// Respostas gravadas entre a publicação inicial e a correção do formVersion
// ainda podem ter formVersion=1; por isso a data funciona como fallback.
export const BEM_MATRIZ_ATUAL_PUBLICADA_EM = "2026-09-22T16:30:16.110Z";

export interface BemHistoricoClusterDef {
  key: IntegracaoClusterKey;
  nome: string;
  pesoTotalPossivel: number;
  pesos: Record<string, number>;
}

export const BEM_HISTORICO_CLUSTERS: BemHistoricoClusterDef[] = [
  {
    key: "cognitivas_analiticas",
    nome: "Competências Cognitivas e Analíticas",
    pesoTotalPossivel: 6,
    pesos: {
      "Esclarecido": 1,
      "Criativo": 0.5,
      "Desconfiado": 0.5,
      "Meticuloso": 0.5,
      "Original": 0.5,
      "Perfeccionista": 0.5,
      "Preocupado": 0.5,
      "Prudente": 0.5,
      "Realista": 0.5,
      "Receoso": 0.5,
      "Sensato": 0.5,
    },
  },
  {
    key: "intrapessoais_autogestao",
    nome: "Competências Intrapessoais e de Autogestão",
    pesoTotalPossivel: 23,
    pesos: {
      "Ativo": 1,
      "Autêntico": 1,
      "Calmo": 1,
      "Disciplinado": 1,
      "Impaciente": 1,
      "Livre": 1,
      "Satisfeito": 1,
      "Saudável": 1,
      "Sossegado": 1,
      "Teimoso": 1,
      "Animado": 0.5,
      "Audaz": 0.5,
      "Autoconfiante": 0.5,
      "Corajoso": 0.5,
      "Decidido": 0.5,
      "Destemido": 0.5,
      "Enérgico": 0.5,
      "Entusiasta": 0.5,
      "Espontâneo": 0.5,
      "Firme": 0.5,
      "Flexível": 0.5,
      "Humilde": 0.5,
      "Ousado": 0.5,
      "Paciente": 0.5,
      "Pacífico": 0.5,
      "Persistente": 0.5,
      "Preocupado": 0.5,
      "Proativo": 0.5,
      "Receoso": 0.5,
      "Sensato": 0.5,
      "Sensível": 0.5,
      "Sério": 0.5,
      "Simples": 0.5,
      "Suave": 0.5,
      "Tolerante": 0.5,
      "Versátil": 0.5,
    },
  },
  {
    key: "interpessoais_relacionais",
    nome: "Competências Interpessoais e Relacionais",
    pesoTotalPossivel: 28.5,
    pesos: {
      "Atencioso": 1,
      "Calado": 1,
      "Cativante": 1,
      "Compreensivo": 1,
      "Cortês": 1,
      "Dócil": 1,
      "Egoísta": 1,
      "Encantador": 1,
      "Envergonhado": 1,
      "Extrovertido": 1,
      "Generoso": 1,
      "Gentil": 1,
      "Leal": 1,
      "Querido": 1,
      "Respeitoso": 1,
      "Retraído": 1,
      "Simpático": 1,
      "Sociável": 1,
      "Tímido": 1,
      "Animado": 0.5,
      "Carismático": 0.5,
      "Convincente": 0.5,
      "Diplomático": 0.5,
      "Direto": 0.5,
      "Entusiasta": 0.5,
      "Envolvente": 0.5,
      "Espontâneo": 0.5,
      "Humilde": 0.5,
      "Influente": 0.5,
      "Irreverente": 0.5,
      "Paciente": 0.5,
      "Pacífico": 0.5,
      "Passivo": 0.5,
      "Persuasivo": 0.5,
      "Sensível": 0.5,
      "Simples": 0.5,
      "Suave": 0.5,
      "Tolerante": 0.5,
    },
  },
  {
    key: "lideranca_gestao",
    nome: "Competências de Liderança e Gestão",
    pesoTotalPossivel: 11,
    pesos: {
      "Autoritário": 1,
      "Competitivo": 1,
      "Autoconfiante": 0.5,
      "Carismático": 0.5,
      "Convincente": 0.5,
      "Corajoso": 0.5,
      "Decidido": 0.5,
      "Destemido": 0.5,
      "Diplomático": 0.5,
      "Direto": 0.5,
      "Empreendedor": 0.5,
      "Enérgico": 0.5,
      "Envolvente": 0.5,
      "Firme": 0.5,
      "Formal": 0.5,
      "Influente": 0.5,
      "Passivo": 0.5,
      "Persistente": 0.5,
      "Persuasivo": 0.5,
      "Proativo": 0.5,
    },
  },
  {
    key: "estrategicas_organizacionais",
    nome: "Competências Estratégicas e Organizacionais",
    pesoTotalPossivel: 8.5,
    pesos: {
      "Tradicional": 1,
      "Audaz": 0.5,
      "Criativo": 0.5,
      "Desconfiado": 0.5,
      "Empreendedor": 0.5,
      "Flexível": 0.5,
      "Formal": 0.5,
      "Irreverente": 0.5,
      "Meticuloso": 0.5,
      "Original": 0.5,
      "Ousado": 0.5,
      "Perfeccionista": 0.5,
      "Prudente": 0.5,
      "Realista": 0.5,
      "Sério": 0.5,
      "Versátil": 0.5,
    },
  },
];
