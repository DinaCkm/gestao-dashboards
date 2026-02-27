// Dados fake realistas para o Portal do Aluno - Apresentação
// Estes dados serão substituídos por dados reais do backend progressivamente

export const MENTOR_PHOTOS = {
  foto1: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663192322263/UmQCnGAEYfNAerFo.jpg",
  foto2: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663192322263/TeaaNBIqaAGbnZTF.jpg",
  foto3: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663192322263/dSXaYnyCcribfSlW.jpg",
  foto4: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663192322263/wDnXwUYQWrkQjBEG.jpg",
  foto5: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663192322263/vCubWpiiMVAcVhtD.jpg",
  foto6: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663192322263/DQvLFlAIFHEWVdgy.jpg",
  foto7: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663192322263/TqBFyutjlHIwoCkV.jpg",
  foto8: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663192322263/rLsvgrXMMKhVzakW.jpg",
};

export interface Mentora {
  id: number;
  nome: string;
  foto: string;
  especialidade: string;
  miniCurriculo: string;
  curriculoCompleto: string;
  formacao: string;
  experiencia: string;
  certificacoes: string[];
  areasAtuacao: string[];
  disponivel: boolean;
  totalMentorados: number;
}

export const MENTORAS_FAKE: Mentora[] = [
  {
    id: 1,
    nome: "Adriana Cavalcante",
    foto: MENTOR_PHOTOS.foto1,
    especialidade: "Liderança e Gestão de Pessoas",
    miniCurriculo: "Executive Coach com 15 anos de experiência em desenvolvimento de lideranças. Especialista em gestão de equipes de alta performance e transformação organizacional.",
    curriculoCompleto: "Adriana Cavalcante é Executive Coach certificada pelo ICF (International Coach Federation) com mais de 15 anos de experiência em desenvolvimento de lideranças corporativas. Atuou como Diretora de RH em empresas como Natura, Ambev e Itaú Unibanco. Possui MBA em Gestão Estratégica de Pessoas pela FGV e é Mestre em Psicologia Organizacional pela USP. Especialista em programas de desenvolvimento de líderes, gestão de mudanças e cultura organizacional. Já mentorou mais de 200 profissionais em suas jornadas de desenvolvimento.",
    formacao: "MBA em Gestão Estratégica de Pessoas - FGV | Mestrado em Psicologia Organizacional - USP",
    experiencia: "15 anos em desenvolvimento de lideranças corporativas",
    certificacoes: ["ICF Professional Certified Coach (PCC)", "DISC Assessment Certified", "Hogan Assessment Certified"],
    areasAtuacao: ["Liderança", "Gestão de Pessoas", "Cultura Organizacional", "Coaching Executivo"],
    disponivel: true,
    totalMentorados: 12,
  },
  {
    id: 2,
    nome: "Patrícia Mendes",
    foto: MENTOR_PHOTOS.foto2,
    especialidade: "Inovação e Empreendedorismo",
    miniCurriculo: "Mentora de startups e intraempreendedorismo. Fundadora de 3 empresas de tecnologia. Especialista em modelos de negócio e estratégia de crescimento.",
    curriculoCompleto: "Patrícia Mendes é empreendedora serial e mentora de startups com mais de 12 anos de experiência no ecossistema de inovação brasileiro. Fundou 3 empresas de tecnologia, sendo uma delas adquirida por um grupo multinacional em 2020. É mentora credenciada pelo SEBRAE e pela Endeavor Brasil. Possui formação em Engenharia de Produção pela UNICAMP e MBA em Empreendedorismo e Inovação pelo MIT Sloan. Atua como mentora em programas de aceleração e é palestrante frequente em eventos de inovação e tecnologia.",
    formacao: "Engenharia de Produção - UNICAMP | MBA em Empreendedorismo - MIT Sloan",
    experiencia: "12 anos em inovação e empreendedorismo",
    certificacoes: ["Mentora SEBRAE", "Mentora Endeavor", "Design Thinking Certified - IDEO"],
    areasAtuacao: ["Inovação", "Empreendedorismo", "Modelos de Negócio", "Estratégia de Crescimento"],
    disponivel: true,
    totalMentorados: 8,
  },
  {
    id: 3,
    nome: "Fernanda Oliveira",
    foto: MENTOR_PHOTOS.foto3,
    especialidade: "Marketing Digital e Comunicação",
    miniCurriculo: "Estrategista de marketing digital com passagem por grandes agências. Especialista em branding, posicionamento de marca e comunicação corporativa.",
    curriculoCompleto: "Fernanda Oliveira é estrategista de marketing digital e comunicação com mais de 10 anos de experiência. Atuou como Diretora de Marketing em agências como WMcCann, Ogilvy e DPZ&T. Liderou campanhas premiadas no Festival de Cannes e no Effie Awards. Possui graduação em Comunicação Social pela PUC-SP e pós-graduação em Marketing Digital pela ESPM. Atualmente é consultora independente e mentora de profissionais que buscam se destacar na área de marketing e comunicação estratégica.",
    formacao: "Comunicação Social - PUC-SP | Pós-graduação em Marketing Digital - ESPM",
    experiencia: "10 anos em marketing digital e comunicação",
    certificacoes: ["Google Ads Certified", "HubSpot Inbound Marketing", "Meta Blueprint Certified"],
    areasAtuacao: ["Marketing Digital", "Branding", "Comunicação Corporativa", "Estratégia de Conteúdo"],
    disponivel: true,
    totalMentorados: 15,
  },
  {
    id: 4,
    nome: "Luciana Santos",
    foto: MENTOR_PHOTOS.foto7,
    especialidade: "Finanças e Gestão Empresarial",
    miniCurriculo: "CFO com experiência em multinacionais. Especialista em planejamento financeiro, valuation e reestruturação empresarial.",
    curriculoCompleto: "Luciana Santos é executiva financeira com mais de 18 anos de experiência em gestão empresarial. Atuou como CFO em empresas como Magazine Luiza, Totvs e Localiza. É especialista em planejamento financeiro estratégico, fusões e aquisições, e reestruturação empresarial. Possui graduação em Administração pela FEA-USP, MBA em Finanças pelo Insper e é CFA Charterholder. Mentora de executivos e empreendedores na área financeira, com foco em tomada de decisão baseada em dados e crescimento sustentável.",
    formacao: "Administração - FEA-USP | MBA em Finanças - Insper | CFA Charterholder",
    experiencia: "18 anos em finanças corporativas",
    certificacoes: ["CFA Charterholder", "CPA-20 ANBIMA", "Lean Six Sigma Black Belt"],
    areasAtuacao: ["Finanças", "Gestão Empresarial", "Planejamento Estratégico", "Valuation"],
    disponivel: true,
    totalMentorados: 6,
  },
  {
    id: 5,
    nome: "Camila Rodrigues",
    foto: MENTOR_PHOTOS.foto5,
    especialidade: "Tecnologia e Transformação Digital",
    miniCurriculo: "CTO e especialista em transformação digital. Experiência em implementação de projetos de IA, cloud computing e metodologias ágeis.",
    curriculoCompleto: "Camila Rodrigues é executiva de tecnologia com mais de 14 anos de experiência em transformação digital. Atuou como CTO em empresas como iFood, Nubank e CI&T. Liderou projetos de implementação de inteligência artificial, migração para cloud e adoção de metodologias ágeis em escala. Possui graduação em Ciência da Computação pela UFMG e mestrado em Inteligência Artificial pela Stanford University. É palestrante em eventos como Web Summit e SXSW, e mentora de profissionais de tecnologia em transição de carreira.",
    formacao: "Ciência da Computação - UFMG | Mestrado em IA - Stanford University",
    experiencia: "14 anos em tecnologia e transformação digital",
    certificacoes: ["AWS Solutions Architect", "Scrum Master Certified", "Google Cloud Professional"],
    areasAtuacao: ["Tecnologia", "Transformação Digital", "Inteligência Artificial", "Metodologias Ágeis"],
    disponivel: false,
    totalMentorados: 20,
  },
  {
    id: 6,
    nome: "Beatriz Almeida",
    foto: MENTOR_PHOTOS.foto8,
    especialidade: "Desenvolvimento Pessoal e Carreira",
    miniCurriculo: "Psicóloga organizacional e coach de carreira. Especialista em autoconhecimento, inteligência emocional e transição de carreira.",
    curriculoCompleto: "Beatriz Almeida é psicóloga organizacional e coach de carreira com mais de 11 anos de experiência em desenvolvimento humano. Atuou como Head de Desenvolvimento Organizacional na Votorantim, Bradesco e Embraer. É especialista em programas de autoconhecimento, inteligência emocional e gestão de carreira. Possui graduação em Psicologia pela UFRJ, especialização em Psicologia Positiva pela University of Pennsylvania e certificação em Coaching Ontológico. Já auxiliou mais de 500 profissionais em processos de transição e desenvolvimento de carreira.",
    formacao: "Psicologia - UFRJ | Especialização em Psicologia Positiva - UPenn",
    experiencia: "11 anos em desenvolvimento humano e organizacional",
    certificacoes: ["Coach Ontológico Certificado", "MBTI Certified Practitioner", "Positive Psychology Certified"],
    areasAtuacao: ["Desenvolvimento Pessoal", "Inteligência Emocional", "Gestão de Carreira", "Autoconhecimento"],
    disponivel: true,
    totalMentorados: 10,
  },
];

export interface SlotAgenda {
  id: number;
  mentoraId: number;
  data: string; // ISO date
  horario: string;
  duracao: number; // minutos
  linkMeet: string;
  disponivel: boolean;
}

export const SLOTS_AGENDA_FAKE: SlotAgenda[] = [
  { id: 1, mentoraId: 1, data: "2026-03-03", horario: "09:00", duracao: 60, linkMeet: "https://meet.google.com/abc-defg-hij", disponivel: true },
  { id: 2, mentoraId: 1, data: "2026-03-03", horario: "14:00", duracao: 60, linkMeet: "https://meet.google.com/abc-defg-hij", disponivel: true },
  { id: 3, mentoraId: 1, data: "2026-03-05", horario: "10:00", duracao: 60, linkMeet: "https://meet.google.com/abc-defg-hij", disponivel: false },
  { id: 4, mentoraId: 1, data: "2026-03-05", horario: "15:00", duracao: 60, linkMeet: "https://meet.google.com/abc-defg-hij", disponivel: true },
  { id: 5, mentoraId: 1, data: "2026-03-07", horario: "09:00", duracao: 60, linkMeet: "https://meet.google.com/klm-nopq-rst", disponivel: true },
  { id: 6, mentoraId: 2, data: "2026-03-04", horario: "11:00", duracao: 60, linkMeet: "https://meet.google.com/uvw-xyza-bcd", disponivel: true },
  { id: 7, mentoraId: 2, data: "2026-03-06", horario: "14:00", duracao: 60, linkMeet: "https://meet.google.com/uvw-xyza-bcd", disponivel: true },
  { id: 8, mentoraId: 3, data: "2026-03-04", horario: "09:00", duracao: 60, linkMeet: "https://meet.google.com/efg-hijk-lmn", disponivel: true },
  { id: 9, mentoraId: 3, data: "2026-03-06", horario: "16:00", duracao: 60, linkMeet: "https://meet.google.com/efg-hijk-lmn", disponivel: true },
  { id: 10, mentoraId: 4, data: "2026-03-03", horario: "10:00", duracao: 60, linkMeet: "https://meet.google.com/opq-rstu-vwx", disponivel: true },
  { id: 11, mentoraId: 6, data: "2026-03-05", horario: "11:00", duracao: 60, linkMeet: "https://meet.google.com/yza-bcde-fgh", disponivel: true },
  { id: 12, mentoraId: 6, data: "2026-03-07", horario: "14:00", duracao: 60, linkMeet: "https://meet.google.com/yza-bcde-fgh", disponivel: true },
];

export interface WebinarFake {
  id: number;
  titulo: string;
  descricao: string;
  data: string;
  horario: string;
  palestrante: string;
  tipo: "proximo" | "passado";
  linkYoutube?: string;
  linkAoVivo?: string;
  presenca?: "presente" | "ausente";
}

export const WEBINARS_FAKE: WebinarFake[] = [
  {
    id: 1,
    titulo: "Liderança na Era Digital: Desafios e Oportunidades",
    descricao: "Como liderar equipes em ambientes híbridos e digitais, mantendo engajamento e produtividade.",
    data: "2026-03-10",
    horario: "19:00",
    palestrante: "Dr. Ricardo Bastos",
    tipo: "proximo",
    linkAoVivo: "https://meet.google.com/web-inar-001",
  },
  {
    id: 2,
    titulo: "Inteligência Emocional no Ambiente Corporativo",
    descricao: "Técnicas práticas para desenvolver inteligência emocional e melhorar relacionamentos profissionais.",
    data: "2026-03-17",
    horario: "19:00",
    palestrante: "Dra. Marina Costa",
    tipo: "proximo",
    linkAoVivo: "https://meet.google.com/web-inar-002",
  },
  {
    id: 3,
    titulo: "Gestão de Tempo e Produtividade para Líderes",
    descricao: "Ferramentas e metodologias para otimizar o tempo e aumentar a produtividade pessoal e da equipe.",
    data: "2026-02-10",
    horario: "19:00",
    palestrante: "Prof. André Lima",
    tipo: "passado",
    linkYoutube: "https://youtube.com/watch?v=exemplo1",
    presenca: "presente",
  },
  {
    id: 4,
    titulo: "Comunicação Assertiva e Feedback Construtivo",
    descricao: "Como dar e receber feedback de forma construtiva, fortalecendo a comunicação na equipe.",
    data: "2026-02-03",
    horario: "19:00",
    palestrante: "Dra. Carla Ferreira",
    tipo: "passado",
    linkYoutube: "https://youtube.com/watch?v=exemplo2",
    presenca: "presente",
  },
  {
    id: 5,
    titulo: "Inovação e Mindset de Crescimento",
    descricao: "Desenvolvendo uma mentalidade de crescimento para impulsionar a inovação no dia a dia.",
    data: "2026-01-20",
    horario: "19:00",
    palestrante: "Prof. Felipe Nascimento",
    tipo: "passado",
    linkYoutube: "https://youtube.com/watch?v=exemplo3",
    presenca: "ausente",
  },
];

export interface TarefaFake {
  id: number;
  sessaoNumero: number;
  nomeAcao: string;
  competencia: string;
  descricao: string;
  instrucoes: string;
  beneficios: string;
  prazo: string;
  status: "pendente" | "entregue" | "atrasada";
  relatoAluno?: string;
  feedbackMentora?: string;
  notaTarefa?: number;
}

export const TAREFAS_FAKE: TarefaFake[] = [
  {
    id: 1,
    sessaoNumero: 2,
    nomeAcao: "Mapeamento de Stakeholders",
    competencia: "Liderança",
    descricao: "Identificar e mapear todos os stakeholders relevantes do seu projeto ou área de atuação, classificando-os por nível de influência e interesse.",
    instrucoes: "1. Liste todos os stakeholders do seu projeto\n2. Classifique cada um em uma matriz de influência x interesse\n3. Defina estratégias de comunicação para cada quadrante\n4. Documente o plano de engajamento",
    beneficios: "Desenvolve visão estratégica, melhora a gestão de relacionamentos e fortalece a capacidade de influência.",
    prazo: "2026-02-28",
    status: "entregue",
    relatoAluno: "Realizei o mapeamento completo dos stakeholders do meu projeto de transformação digital. Identifiquei 15 stakeholders-chave, classificados em 4 quadrantes. Desenvolvi estratégias específicas para cada grupo, priorizando os de alta influência e alto interesse. O exercício me ajudou a entender melhor as dinâmicas de poder e a planejar comunicações mais efetivas.",
    feedbackMentora: "Excelente trabalho! O mapeamento está muito bem estruturado e demonstra boa capacidade analítica. Sugiro aprofundar a estratégia de comunicação com os stakeholders do quadrante 'manter satisfeitos'. Continue assim!",
    notaTarefa: 9,
  },
  {
    id: 2,
    sessaoNumero: 3,
    nomeAcao: "Plano de Desenvolvimento Individual (PDI)",
    competencia: "Autoconhecimento",
    descricao: "Elaborar um plano de desenvolvimento individual com metas SMART para os próximos 3 meses, alinhado com as competências identificadas no assessment.",
    instrucoes: "1. Revise os resultados do seu assessment\n2. Identifique 3 competências prioritárias para desenvolvimento\n3. Defina metas SMART para cada competência\n4. Estabeleça ações concretas e prazos\n5. Identifique recursos necessários e possíveis obstáculos",
    beneficios: "Promove autoconhecimento, clareza de objetivos e disciplina no processo de desenvolvimento pessoal e profissional.",
    prazo: "2026-03-15",
    status: "pendente",
  },
  {
    id: 3,
    sessaoNumero: 4,
    nomeAcao: "Feedback 360°",
    competencia: "Comunicação",
    descricao: "Conduzir um processo de feedback 360° informal, coletando percepções de superiores, pares e subordinados sobre suas competências de comunicação.",
    instrucoes: "1. Selecione 6-8 pessoas (2 superiores, 3 pares, 2-3 subordinados)\n2. Prepare 5 perguntas sobre suas competências de comunicação\n3. Conduza conversas individuais de 15-20 minutos\n4. Compile os resultados e identifique padrões\n5. Elabore um plano de ação baseado nos feedbacks",
    beneficios: "Amplia a autopercepção, fortalece relacionamentos profissionais e identifica pontos cegos no estilo de comunicação.",
    prazo: "2026-03-30",
    status: "pendente",
  },
];

export interface CursoFake {
  id: number;
  nome: string;
  modulo: string;
  progresso: number;
  totalAulas: number;
  aulasCompletas: number;
  status: "em_andamento" | "concluido" | "nao_iniciado";
}

export const CURSOS_FAKE: CursoFake[] = [
  { id: 1, nome: "Fundamentos de Liderança", modulo: "Módulo 1", progresso: 100, totalAulas: 8, aulasCompletas: 8, status: "concluido" },
  { id: 2, nome: "Comunicação Estratégica", modulo: "Módulo 2", progresso: 75, totalAulas: 6, aulasCompletas: 4, status: "em_andamento" },
  { id: 3, nome: "Gestão de Conflitos", modulo: "Módulo 3", progresso: 30, totalAulas: 5, aulasCompletas: 1, status: "em_andamento" },
  { id: 4, nome: "Pensamento Estratégico", modulo: "Módulo 4", progresso: 0, totalAulas: 7, aulasCompletas: 0, status: "nao_iniciado" },
  { id: 5, nome: "Inovação e Criatividade", modulo: "Módulo 5", progresso: 0, totalAulas: 6, aulasCompletas: 0, status: "nao_iniciado" },
];

export interface TrilhaCicloFake {
  id: number;
  nomeCiclo: string;
  status: "finalizado" | "em_andamento" | "futuro";
  dataInicio: string;
  dataFim: string;
  competencias: {
    nome: string;
    nota: number | null;
    meta: number;
    status: "concluida" | "em_progresso" | "pendente";
  }[];
}

export const TRILHA_FAKE: TrilhaCicloFake[] = [
  {
    id: 1,
    nomeCiclo: "Ciclo 1 — Fundamentos",
    status: "finalizado",
    dataInicio: "2026-01-06",
    dataFim: "2026-02-07",
    competencias: [
      { nome: "Autoconhecimento", nota: 8.5, meta: 7, status: "concluida" },
      { nome: "Comunicação Interpessoal", nota: 7.2, meta: 7, status: "concluida" },
      { nome: "Gestão do Tempo", nota: 9.0, meta: 7, status: "concluida" },
    ],
  },
  {
    id: 2,
    nomeCiclo: "Ciclo 2 — Desenvolvimento",
    status: "em_andamento",
    dataInicio: "2026-02-10",
    dataFim: "2026-03-14",
    competencias: [
      { nome: "Liderança de Equipes", nota: 6.8, meta: 7, status: "em_progresso" },
      { nome: "Pensamento Estratégico", nota: null, meta: 7, status: "pendente" },
      { nome: "Resolução de Problemas", nota: null, meta: 7, status: "pendente" },
    ],
  },
  {
    id: 3,
    nomeCiclo: "Ciclo 3 — Consolidação",
    status: "futuro",
    dataInicio: "2026-03-17",
    dataFim: "2026-04-18",
    competencias: [
      { nome: "Inovação e Criatividade", nota: null, meta: 7, status: "pendente" },
      { nome: "Gestão de Mudanças", nota: null, meta: 7, status: "pendente" },
      { nome: "Visão Sistêmica", nota: null, meta: 7, status: "pendente" },
    ],
  },
];

// Perfil fake do aluno para demonstração
export const ALUNO_PERFIL_FAKE = {
  nome: "",
  email: "",
  telefone: "",
  empresa: "",
  cargo: "",
  areaAtuacao: "",
  experiencia: "",
  programa: "",
  turma: "",
  foto: null as string | null,
};

// Sessões de mentoria fake para a Fase 3
export interface SessaoMentoriaFake {
  id: number;
  numero: number;
  data: string;
  horario: string;
  status: "realizada" | "agendada" | "cancelada";
  presenca: "presente" | "ausente" | null;
  engajamento: number | null;
  engajamentoLabel: string | null;
  feedback: string | null;
  tarefaAtribuida: string | null;
}

export const SESSOES_MENTORIA_FAKE: SessaoMentoriaFake[] = [
  {
    id: 1, numero: 1, data: "2026-01-15", horario: "09:00",
    status: "realizada", presenca: "presente", engajamento: null,
    engajamentoLabel: null,
    feedback: "Encontro inicial realizado com sucesso. Definimos a trilha de desenvolvimento e as expectativas do programa.",
    tarefaAtribuida: "Mapeamento de Stakeholders",
  },
  {
    id: 2, numero: 2, data: "2026-02-12", horario: "09:00",
    status: "realizada", presenca: "presente", engajamento: 8,
    engajamentoLabel: "Avançado",
    feedback: "Ótimo progresso no mapeamento de stakeholders. Maria Clara demonstrou visão estratégica e capacidade analítica acima da média.",
    tarefaAtribuida: "Plano de Desenvolvimento Individual (PDI)",
  },
  {
    id: 3, numero: 3, data: "2026-03-12", horario: "09:00",
    status: "agendada", presenca: null, engajamento: null,
    engajamentoLabel: null, feedback: null,
    tarefaAtribuida: null,
  },
];
