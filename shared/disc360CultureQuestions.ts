/**
 * EcoDISC 360 - Questionario de Cultura Comportamental da Empresa.
 * Mede a cultura comportamental DESEJADA (nao a atual), a partir de
 * missao, visao, valores, estrategia e comportamentos esperados das
 * liderancas e equipes. Cada pergunta tem 4 alternativas, cada uma
 * mapeada para uma dimensao DISC (D, I, S ou C). Fixo em codigo nesta
 * primeira fase (sem tabela propria de perguntas).
 */

export type Disc360CultureDimension = "D" | "I" | "S" | "C";

export type Disc360CultureAlternativa = {
  id: string;
  dimensao: Disc360CultureDimension;
  texto: string;
};

export type Disc360CultureQuestion = {
  id: string;
  tema: string;
  pergunta: string;
  alternativas: Disc360CultureAlternativa[];
};

export const DISC360_CULTURE_QUESTIONS: Disc360CultureQuestion[] = [
  {
    id: "q1",
    tema: "Tomada de decisão",
    pergunta: "Quando uma decisão importante precisa ser tomada, a empresa espera que as lideranças:",
    alternativas: [
      { id: "q1_D", dimensao: "D", texto: "Decidam com firmeza e rapidez, assumindo responsabilidade pelo resultado." },
      { id: "q1_I", dimensao: "I", texto: "Mobilizem as pessoas envolvidas e construam adesão antes de decidir." },
      { id: "q1_S", dimensao: "S", texto: "Ponderem com calma, preservando a estabilidade e evitando rupturas bruscas." },
      { id: "q1_C", dimensao: "C", texto: "Analisem dados, riscos e procedimentos antes da decisão." },
    ],
  },
  {
    id: "q2",
    tema: "Papel do líder",
    pergunta: "O papel principal de um líder nesta empresa é:",
    alternativas: [
      { id: "q2_D", dimensao: "D", texto: "Direcionar, cobrar e garantir o resultado." },
      { id: "q2_I", dimensao: "I", texto: "Inspirar, comunicar e engajar as pessoas." },
      { id: "q2_S", dimensao: "S", texto: "Apoiar, desenvolver e manter o time unido e estável." },
      { id: "q2_C", dimensao: "C", texto: "Organizar, controlar e assegurar qualidade e método." },
    ],
  },
  {
    id: "q3",
    tema: "Mudança e adaptação",
    pergunta: "Quando há mudanças importantes na empresa, espera-se que as pessoas:",
    alternativas: [
      { id: "q3_D", dimensao: "D", texto: "Assumam a frente e façam a mudança acontecer rapidamente." },
      { id: "q3_I", dimensao: "I", texto: "Comuniquem bem, influenciem e envolvam os demais na transição." },
      { id: "q3_S", dimensao: "S", texto: "Se adaptem com equilíbrio, preservando o que já funciona bem." },
      { id: "q3_C", dimensao: "C", texto: "Sigam um plano estruturado, com critérios e controles claros." },
    ],
  },
  {
    id: "q4",
    tema: "Alta performance e entrega",
    pergunta: "Uma equipe de alta performance, para esta empresa, é aquela que:",
    alternativas: [
      { id: "q4_D", dimensao: "D", texto: "Entrega metas desafiadoras e supera obstáculos com velocidade." },
      { id: "q4_I", dimensao: "I", texto: "Gera conexão, energia e colaboração ativa entre as pessoas." },
      { id: "q4_S", dimensao: "S", texto: "Mantém constância, confiança e cooperação ao longo do tempo." },
      { id: "q4_C", dimensao: "C", texto: "Trabalha com método, qualidade e baixa margem de erro." },
    ],
  },
  {
    id: "q5",
    tema: "Normas e processos",
    pergunta: "Em relação a normas e processos, a empresa espera que as pessoas:",
    alternativas: [
      { id: "q5_D", dimensao: "D", texto: "Usem os processos como apoio, mas priorizem sempre o resultado final." },
      { id: "q5_I", dimensao: "I", texto: "Comuniquem os processos de forma clara e envolvam as pessoas neles." },
      { id: "q5_S", dimensao: "S", texto: "Respeitem os processos para manter segurança e estabilidade." },
      { id: "q5_C", dimensao: "C", texto: "Sigam padrões, controles e regras com rigor." },
    ],
  },
  {
    id: "q6",
    tema: "Ambiente de trabalho",
    pergunta: "O ambiente de trabalho mais desejado pela empresa é:",
    alternativas: [
      { id: "q6_D", dimensao: "D", texto: "Desafiador, competitivo e orientado a metas." },
      { id: "q6_I", dimensao: "I", texto: "Comunicativo, dinâmico e integrador." },
      { id: "q6_S", dimensao: "S", texto: "Colaborativo, estável e acolhedor." },
      { id: "q6_C", dimensao: "C", texto: "Organizado, técnico e orientado à excelência." },
    ],
  },
  {
    id: "q7",
    tema: "Gestão de conflitos",
    pergunta: "Quando surgem conflitos internos, a empresa espera que as lideranças:",
    alternativas: [
      { id: "q7_D", dimensao: "D", texto: "Enfrentem o problema diretamente e decidam o encaminhamento." },
      { id: "q7_I", dimensao: "I", texto: "Conversem, influenciem e busquem acordo entre as partes." },
      { id: "q7_S", dimensao: "S", texto: "Preservem o relacionamento e reduzam as tensões com cuidado." },
      { id: "q7_C", dimensao: "C", texto: "Analisem fatos, regras e responsabilidades antes de agir." },
    ],
  },
  {
    id: "q8",
    tema: "Ritmo organizacional",
    pergunta: "O ritmo de trabalho ideal para esta empresa é:",
    alternativas: [
      { id: "q8_D", dimensao: "D", texto: "Rápido, objetivo e voltado à execução." },
      { id: "q8_I", dimensao: "I", texto: "Dinâmico, participativo e com troca constante entre pessoas." },
      { id: "q8_S", dimensao: "S", texto: "Constante, previsível e sustentável ao longo do tempo." },
      { id: "q8_C", dimensao: "C", texto: "Planejado, controlado e baseado em método." },
    ],
  },
  {
    id: "q9",
    tema: "Inovação",
    pergunta: "Para a empresa, inovar significa principalmente:",
    alternativas: [
      { id: "q9_D", dimensao: "D", texto: "Agir antes dos concorrentes e assumir riscos calculados." },
      { id: "q9_I", dimensao: "I", texto: "Criar ideias em conjunto, com trocas e influência entre pessoas." },
      { id: "q9_S", dimensao: "S", texto: "Melhorar continuamente, sem desorganizar o que já funciona." },
      { id: "q9_C", dimensao: "C", texto: "Testar, validar e estruturar mudanças com critérios técnicos." },
    ],
  },
  {
    id: "q10",
    tema: "Relação com clientes",
    pergunta: "Na relação com clientes, a empresa valoriza mais:",
    alternativas: [
      { id: "q10_D", dimensao: "D", texto: "Agilidade, solução objetiva e entrega rápida." },
      { id: "q10_I", dimensao: "I", texto: "Encantamento, comunicação próxima e relacionamento." },
      { id: "q10_S", dimensao: "S", texto: "Confiança, continuidade e cuidado ao longo do tempo." },
      { id: "q10_C", dimensao: "C", texto: "Precisão, qualidade e cumprimento exato do combinado." },
    ],
  },
  {
    id: "q11",
    tema: "Reconhecimento e recompensa",
    pergunta: "A empresa tende a reconhecer e recompensar mais quem:",
    alternativas: [
      { id: "q11_D", dimensao: "D", texto: "Assume desafios e entrega resultados relevantes." },
      { id: "q11_I", dimensao: "I", texto: "Mobiliza pessoas e fortalece relacionamentos internos e externos." },
      { id: "q11_S", dimensao: "S", texto: "Sustenta o time, colabora e mantém a estabilidade do grupo." },
      { id: "q11_C", dimensao: "C", texto: "Garante qualidade, organização e confiabilidade no trabalho." },
    ],
  },
  {
    id: "q12",
    tema: "Estratégia e crescimento",
    pergunta: "Para crescer e se desenvolver no futuro, a empresa acredita que precisa principalmente de:",
    alternativas: [
      { id: "q12_D", dimensao: "D", texto: "Ambição, decisão rápida e foco em novas oportunidades." },
      { id: "q12_I", dimensao: "I", texto: "Marca forte, relacionamento e influência no mercado." },
      { id: "q12_S", dimensao: "S", texto: "Uma equipe comprometida, estável e com continuidade." },
      { id: "q12_C", dimensao: "C", texto: "Gestão, controle, processos bem definidos e qualidade." },
    ],
  },
  {
    id: "q13",
    tema: "Autonomia",
    pergunta: "Sobre autonomia no trabalho, a empresa espera que as pessoas:",
    alternativas: [
      { id: "q13_D", dimensao: "D", texto: "Tomem iniciativa e decidam dentro de sua responsabilidade." },
      { id: "q13_I", dimensao: "I", texto: "Busquem alinhamento e envolvam as pessoas certas antes de agir." },
      { id: "q13_S", dimensao: "S", texto: "Ajam com responsabilidade, sem gerar instabilidade no grupo." },
      { id: "q13_C", dimensao: "C", texto: "Sigam critérios, limites e padrões bem definidos." },
    ],
  },
  {
    id: "q14",
    tema: "Comunicação interna",
    pergunta: "A comunicação interna ideal, para esta empresa, deve ser:",
    alternativas: [
      { id: "q14_D", dimensao: "D", texto: "Direta, objetiva e voltada à ação." },
      { id: "q14_I", dimensao: "I", texto: "Inspiradora, envolvente e mobilizadora." },
      { id: "q14_S", dimensao: "S", texto: "Cuidadosa, acolhedora e que preserva o clima do time." },
      { id: "q14_C", dimensao: "C", texto: "Clara, documentada e precisa." },
    ],
  },
  {
    id: "q15",
    tema: "Gestão de riscos",
    pergunta: "Diante de situações de risco, a empresa espera que as pessoas ajam com:",
    alternativas: [
      { id: "q15_D", dimensao: "D", texto: "Coragem para decidir e agir rapidamente, mesmo sob incerteza." },
      { id: "q15_I", dimensao: "I", texto: "Capacidade de envolver pessoas e gerar confiança na condução." },
      { id: "q15_S", dimensao: "S", texto: "Prudência, para não comprometer a estabilidade do time ou da operação." },
      { id: "q15_C", dimensao: "C", texto: "Análise técnica cuidadosa, controles e prevenção." },
    ],
  },
  {
    id: "q16",
    tema: "Tratamento de erros e falhas",
    pergunta: "Quando um erro ou falha acontece, a empresa espera que as pessoas:",
    alternativas: [
      { id: "q16_D", dimensao: "D", texto: "Corrijam rapidamente e sigam em frente, focando no próximo resultado." },
      { id: "q16_I", dimensao: "I", texto: "Conversem abertamente sobre o ocorrido, envolvendo quem for necessário." },
      { id: "q16_S", dimensao: "S", texto: "Tratem o erro com calma, sem gerar clima de culpa ou instabilidade." },
      { id: "q16_C", dimensao: "C", texto: "Investiguem a causa raiz e ajustem o processo para não repetir." },
    ],
  },
  {
    id: "q17",
    tema: "Aprendizado e desenvolvimento",
    pergunta: "Sobre aprendizado e desenvolvimento das pessoas, a empresa espera que:",
    alternativas: [
      { id: "q17_D", dimensao: "D", texto: "O aprendizado esteja a serviço de metas e resultados concretos e rápidos." },
      { id: "q17_I", dimensao: "I", texto: "As pessoas aprendam trocando experiências e se inspirando umas nas outras." },
      { id: "q17_S", dimensao: "S", texto: "O desenvolvimento seja constante, gradual e sem pressão excessiva." },
      { id: "q17_C", dimensao: "C", texto: "O aprendizado siga trilhas estruturadas, com método e critérios claros." },
    ],
  },
  {
    id: "q18",
    tema: "Colaboração entre áreas",
    pergunta: "Na colaboração entre diferentes áreas da empresa, o esperado é que as pessoas:",
    alternativas: [
      { id: "q18_D", dimensao: "D", texto: "Ajam com foco no resultado do negócio, mesmo que isso gere tensão pontual entre áreas." },
      { id: "q18_I", dimensao: "I", texto: "Construam pontes, negociem e mantenham boas relações entre os times." },
      { id: "q18_S", dimensao: "S", texto: "Cooperem de forma estável e continuada, sem gerar atritos." },
      { id: "q18_C", dimensao: "C", texto: "Sigam processos claros de interface entre as áreas, com papéis bem definidos." },
    ],
  },
  {
    id: "q19",
    tema: "Uso de dados e indicadores",
    pergunta: "Sobre o uso de dados e indicadores, a empresa espera que as decisões sejam tomadas:",
    alternativas: [
      { id: "q19_D", dimensao: "D", texto: "Com base em dados, mas sem perder velocidade na hora de agir." },
      { id: "q19_I", dimensao: "I", texto: "Compartilhando os dados de forma que engajem e mobilizem as pessoas." },
      { id: "q19_S", dimensao: "S", texto: "De forma consistente, sem mudar de direção com frequência." },
      { id: "q19_C", dimensao: "C", texto: "Com base rigorosa em dados, análises e indicadores bem estruturados." },
    ],
  },
  {
    id: "q20",
    tema: "Diversidade e inclusão",
    pergunta: "Em relação à diversidade e inclusão, a empresa espera que as lideranças:",
    alternativas: [
      { id: "q20_D", dimensao: "D", texto: "Tomem decisões objetivas para garantir avanço rápido do tema, com metas claras." },
      { id: "q20_I", dimensao: "I", texto: "Promovam diálogo, escuta e construção conjunta em torno do tema." },
      { id: "q20_S", dimensao: "S", texto: "Criem um ambiente estável, seguro e acolhedor para todas as pessoas." },
      { id: "q20_C", dimensao: "C", texto: "Estruturem políticas, critérios e processos formais sobre o tema." },
    ],
  },
  {
    id: "q21",
    tema: "Modelos de trabalho",
    pergunta: "Sobre modelos de trabalho (presencial, remoto ou híbrido), a empresa espera que as pessoas:",
    alternativas: [
      { id: "q21_D", dimensao: "D", texto: "Tenham liberdade para escolher o formato que gera mais resultado." },
      { id: "q21_I", dimensao: "I", texto: "Mantenham conexão e boa comunicação, independentemente do formato." },
      { id: "q21_S", dimensao: "S", texto: "Tenham estabilidade e previsibilidade na rotina de trabalho." },
      { id: "q21_C", dimensao: "C", texto: "Sigam regras e critérios claros definidos para cada formato." },
    ],
  },
  {
    id: "q22",
    tema: "Ética e transparência",
    pergunta: "Sobre ética e transparência, a empresa espera que as pessoas:",
    alternativas: [
      { id: "q22_D", dimensao: "D", texto: "Ajam com integridade, mesmo que isso signifique decisões difíceis e rápidas." },
      { id: "q22_I", dimensao: "I", texto: "Comuniquem de forma aberta e honesta, fortalecendo a confiança mútua." },
      { id: "q22_S", dimensao: "S", texto: "Mantenham consistência e coerência entre discurso e prática ao longo do tempo." },
      { id: "q22_C", dimensao: "C", texto: "Sigam rigorosamente normas, políticas e critérios formais de conduta." },
    ],
  },
  {
    id: "q23",
    tema: "Cultura desejada",
    pergunta: "A cultura desejada pela empresa deve ser reconhecida principalmente por:",
    alternativas: [
      { id: "q23_D", dimensao: "D", texto: "Alta performance e foco em resultados." },
      { id: "q23_I", dimensao: "I", texto: "Relacionamento, influência e entusiasmo das pessoas." },
      { id: "q23_S", dimensao: "S", texto: "Cooperação, estabilidade e confiança mútua." },
      { id: "q23_C", dimensao: "C", texto: "Excelência, organização e conformidade." },
    ],
  },
  {
    id: "q24",
    tema: "Integração de novas pessoas",
    pergunta: "Ao integrar uma nova pessoa na empresa, o mais importante é que ela:",
    alternativas: [
      { id: "q24_D", dimensao: "D", texto: "Comece a gerar resultado e assuma responsabilidades rapidamente." },
      { id: "q24_I", dimensao: "I", texto: "Se conecte bem com o time e construa bons relacionamentos desde o início." },
      { id: "q24_S", dimensao: "S", texto: "Se sinta acolhida e segura durante o processo de adaptação." },
      { id: "q24_C", dimensao: "C", texto: "Aprenda corretamente os processos, padrões e ferramentas da empresa." },
    ],
  },
];

export const DISC360_CULTURE_TOTAL_PERGUNTAS = DISC360_CULTURE_QUESTIONS.length;
