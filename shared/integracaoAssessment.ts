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
