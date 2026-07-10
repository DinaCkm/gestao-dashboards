/**
 * EcoDISC 360 - Questionario de Perfil do Cargo.
 * Investiga o que a FUNCAO exige da pessoa no dia a dia (nao a cultura
 * geral da empresa). Mesmo formato de escolha forcada (mais/menos) usado
 * no questionario de Cultura da Empresa. Respondido por dois papeis fixos
 * por cargo: lider da posicao e um empregado que ocupa o cargo.
 */

export type Disc360RoleDimension = "D" | "I" | "S" | "C";

export type Disc360RoleAlternativa = {
  id: string;
  dimensao: Disc360RoleDimension;
  texto: string;
  explicacao: string;
};

export type Disc360RoleQuestion = {
  id: string;
  tema: string;
  pergunta: string;
  objetivo: string;
  alternativas: Disc360RoleAlternativa[];
};

export const DISC360_ROLE_QUESTIONS: Disc360RoleQuestion[] = [
  {
    id: "r1",
    tema: "Ritmo de trabalho",
    pergunta: "O ritmo de trabalho exigido por este cargo é mais parecido com:",
    objetivo: "Avalia a velocidade e intensidade de ação que a rotina do cargo demanda da pessoa.",
    alternativas: [
      { id: "r1_D", dimensao: "D", texto: "Rápido, orientado a resultado imediato, sem esperar por consenso.", explicacao: "Mede a exigência de ritmo acelerado e foco em entrega rápida." },
      { id: "r1_I", dimensao: "I", texto: "Dinâmico e social, alternando entre tarefas e interações com pessoas.", explicacao: "Mede a exigência de ritmo variável, com bastante interação social." },
      { id: "r1_S", dimensao: "S", texto: "Constante e previsível, sem grandes picos de urgência.", explicacao: "Mede a exigência de ritmo estável e previsível, sem urgência constante." },
      { id: "r1_C", dimensao: "C", texto: "Pausado e cuidadoso, priorizando exatidão sobre velocidade.", explicacao: "Mede a exigência de ritmo mais lento, priorizando precisão sobre velocidade." },
    ],
  },
  {
    id: "r2",
    tema: "Tomada de decisão no cargo",
    pergunta: "As decisões do dia a dia deste cargo costumam exigir:",
    objetivo: "Avalia o estilo de decisão que a função demanda da pessoa que a ocupa.",
    alternativas: [
      { id: "r2_D", dimensao: "D", texto: "Decidir rápido, mesmo com informação incompleta.", explicacao: "Mede a exigência de decisão rápida e assertiva, mesmo sob incerteza." },
      { id: "r2_I", dimensao: "I", texto: "Buscar a opinião e o apoio de outras pessoas antes de decidir.", explicacao: "Mede a exigência de decisão participativa, buscando consenso e apoio." },
      { id: "r2_S", dimensao: "S", texto: "Seguir o que já funcionou antes, evitando mudanças bruscas.", explicacao: "Mede a exigência de decisão cautelosa, baseada em rotina já validada." },
      { id: "r2_C", dimensao: "C", texto: "Analisar dados e critérios técnicos antes de decidir.", explicacao: "Mede a exigência de decisão analítica, baseada em dados e critérios técnicos." },
    ],
  },
  {
    id: "r3",
    tema: "Autonomia exigida",
    pergunta: "O nível de autonomia que este cargo exige é:",
    objetivo: "Avalia o grau de independência e responsabilidade individual exigido pela função.",
    alternativas: [
      { id: "r3_D", dimensao: "D", texto: "Alta — a pessoa precisa agir e assumir a responsabilidade sozinha.", explicacao: "Mede a exigência de alta autonomia e responsabilidade individual." },
      { id: "r3_I", dimensao: "I", texto: "Média, mas com bastante interação e troca com outras pessoas.", explicacao: "Mede a exigência de autonomia moderada, equilibrada com interação social." },
      { id: "r3_S", dimensao: "S", texto: "Baixa a média, com apoio e orientação constantes de outros.", explicacao: "Mede a exigência de baixa autonomia, com apoio e orientação constantes." },
      { id: "r3_C", dimensao: "C", texto: "Alta, mas dentro de regras e procedimentos bem definidos.", explicacao: "Mede a exigência de autonomia técnica, dentro de regras bem definidas." },
    ],
  },
  {
    id: "r4",
    tema: "Relacionamento com pessoas",
    pergunta: "A quantidade e o tipo de contato com pessoas que este cargo exige é:",
    objetivo: "Avalia o nível e o estilo de interação interpessoal necessários na função.",
    alternativas: [
      { id: "r4_D", dimensao: "D", texto: "Contato direto e objetivo, focado em resolver e avançar.", explicacao: "Mede a exigência de interação direta e orientada a resultado." },
      { id: "r4_I", dimensao: "I", texto: "Contato frequente, caloroso e voltado a construir relacionamentos.", explicacao: "Mede a exigência de interação social intensa e voltada a vínculos." },
      { id: "r4_S", dimensao: "S", texto: "Contato constante, mas calmo e baseado em confiança mútua.", explicacao: "Mede a exigência de interação estável, baseada em confiança e apoio." },
      { id: "r4_C", dimensao: "C", texto: "Contato pontual, formal e focado em informações precisas.", explicacao: "Mede a exigência de interação formal e centrada em precisão técnica." },
    ],
  },
  {
    id: "r5",
    tema: "Lidar com prazo e pressão",
    pergunta: "A forma como este cargo geralmente lida com prazos e pressão é:",
    objetivo: "Avalia a exposição e a resposta esperada da função diante de prazos e pressão.",
    alternativas: [
      { id: "r5_D", dimensao: "D", texto: "Alta pressão constante, com cobrança direta por resultado.", explicacao: "Mede a exigência de tolerância a alta pressão e cobrança por resultado." },
      { id: "r5_I", dimensao: "I", texto: "Pressão variável, aliviada pelo bom relacionamento com o time.", explicacao: "Mede a exigência de lidar com pressão através do apoio social." },
      { id: "r5_S", dimensao: "S", texto: "Pressão baixa e previsível, com prazos estáveis.", explicacao: "Mede a exigência de um ambiente de baixa pressão e prazos previsíveis." },
      { id: "r5_C", dimensao: "C", texto: "Pressão ligada à exatidão e conformidade com prazos técnicos.", explicacao: "Mede a exigência de pressão ligada a precisão e conformidade técnica." },
    ],
  },
  {
    id: "r6",
    tema: "Atenção a detalhes e qualidade",
    pergunta: "A atenção a detalhes exigida por este cargo é:",
    objetivo: "Avalia o grau de precisão e cuidado técnico necessário na execução das tarefas.",
    alternativas: [
      { id: "r6_D", dimensao: "D", texto: "Baixa — o foco está mais no resultado final do que no detalhe.", explicacao: "Mede baixa exigência de atenção a detalhes, com foco no resultado." },
      { id: "r6_I", dimensao: "I", texto: "Moderada, equilibrada com criatividade e comunicação.", explicacao: "Mede exigência moderada de detalhe, equilibrada com aspectos sociais." },
      { id: "r6_S", dimensao: "S", texto: "Moderada, priorizando consistência ao longo do tempo.", explicacao: "Mede exigência moderada de detalhe, com foco em consistência." },
      { id: "r6_C", dimensao: "C", texto: "Alta — erros pequenos têm impacto significativo no resultado.", explicacao: "Mede alta exigência de precisão e atenção a detalhes técnicos." },
    ],
  },
  {
    id: "r7",
    tema: "Rotina vs. variedade de tarefas",
    pergunta: "A rotina de trabalho deste cargo é:",
    objetivo: "Avalia se a função demanda mais repetição/estrutura ou mais variedade/novidade.",
    alternativas: [
      { id: "r7_D", dimensao: "D", texto: "Bastante variável, definida pelas prioridades e desafios do momento.", explicacao: "Mede a exigência de adaptação constante a novas prioridades." },
      { id: "r7_I", dimensao: "I", texto: "Variada, com bastante diversidade de pessoas e situações.", explicacao: "Mede a exigência de lidar com variedade de pessoas e contextos." },
      { id: "r7_S", dimensao: "S", texto: "Estável e repetitiva, com poucas mudanças na rotina.", explicacao: "Mede a exigência de rotina estável e previsível." },
      { id: "r7_C", dimensao: "C", texto: "Estruturada, seguindo processos e etapas bem definidas.", explicacao: "Mede a exigência de seguir processos e etapas padronizadas." },
    ],
  },
  {
    id: "r8",
    tema: "Comunicação exigida",
    pergunta: "O tipo de comunicação mais exigido por este cargo é:",
    objetivo: "Avalia o estilo de comunicação predominante que a função demanda.",
    alternativas: [
      { id: "r8_D", dimensao: "D", texto: "Direta e objetiva, focada em decisões e resultados.", explicacao: "Mede a exigência de comunicação direta e assertiva." },
      { id: "r8_I", dimensao: "I", texto: "Expressiva e envolvente, usada para engajar e influenciar pessoas.", explicacao: "Mede a exigência de comunicação expressiva e persuasiva." },
      { id: "r8_S", dimensao: "S", texto: "Calma e acolhedora, voltada a ouvir e apoiar as pessoas.", explicacao: "Mede a exigência de comunicação receptiva e voltada ao apoio." },
      { id: "r8_C", dimensao: "C", texto: "Formal e precisa, baseada em dados e documentação.", explicacao: "Mede a exigência de comunicação técnica e bem documentada." },
    ],
  },
  {
    id: "r9",
    tema: "Gestão de conflitos no dia a dia",
    pergunta: "Diante de um conflito no dia a dia, este cargo exige que a pessoa:",
    objetivo: "Avalia como a função espera que conflitos sejam enfrentados e resolvidos.",
    alternativas: [
      { id: "r9_D", dimensao: "D", texto: "Enfrente o conflito diretamente e busque resolvê-lo rápido.", explicacao: "Mede a exigência de enfrentamento direto e rápido do conflito." },
      { id: "r9_I", dimensao: "I", texto: "Busque conciliar as partes, mantendo o bom relacionamento.", explicacao: "Mede a exigência de conciliação e manutenção do relacionamento." },
      { id: "r9_S", dimensao: "S", texto: "Evite o confronto, buscando manter a harmonia do grupo.", explicacao: "Mede a exigência de evitar confronto e preservar a harmonia." },
      { id: "r9_C", dimensao: "C", texto: "Analise os fatos com neutralidade antes de posicionar-se.", explicacao: "Mede a exigência de análise neutra e baseada em fatos." },
    ],
  },
  {
    id: "r10",
    tema: "Uso de dados e análise",
    pergunta: "O quanto este cargo depende de dados e análises para o trabalho do dia a dia:",
    objetivo: "Avalia o peso da análise técnica e de dados na rotina da função.",
    alternativas: [
      { id: "r10_D", dimensao: "D", texto: "Pouco — as decisões são tomadas mais pela intuição e agilidade.", explicacao: "Mede baixa dependência de dados, com decisões mais intuitivas." },
      { id: "r10_I", dimensao: "I", texto: "Moderado, mas os dados servem mais para embasar conversas.", explicacao: "Mede dependência moderada de dados, usados para apoiar interações." },
      { id: "r10_S", dimensao: "S", texto: "Moderado, usado para manter consistência nos processos já estabelecidos.", explicacao: "Mede dependência moderada de dados, ligada à consistência." },
      { id: "r10_C", dimensao: "C", texto: "Alto — grande parte do trabalho envolve análise técnica de dados.", explicacao: "Mede alta dependência de dados e análise técnica no trabalho." },
    ],
  },
  {
    id: "r11",
    tema: "Flexibilidade a mudanças",
    pergunta: "Diante de mudanças (novos processos, prioridades ou ferramentas), este cargo exige que a pessoa:",
    objetivo: "Avalia a capacidade de adaptação a mudanças que a função demanda.",
    alternativas: [
      { id: "r11_D", dimensao: "D", texto: "Se adapte rápido e assuma a frente da mudança.", explicacao: "Mede a exigência de liderar e se adaptar rapidamente à mudança." },
      { id: "r11_I", dimensao: "I", texto: "Ajude a engajar outras pessoas na adaptação à mudança.", explicacao: "Mede a exigência de engajar pessoas durante a mudança." },
      { id: "r11_S", dimensao: "S", texto: "Precise de tempo e apoio para se adaptar com segurança.", explicacao: "Mede a exigência de tempo e suporte para lidar com mudanças." },
      { id: "r11_C", dimensao: "C", texto: "Avalie criteriosamente os impactos antes de aceitar a mudança.", explicacao: "Mede a exigência de avaliação criteriosa antes de aceitar mudanças." },
    ],
  },
  {
    id: "r12",
    tema: "Foco em resultado vs. processo",
    pergunta: "O que mais importa no desempenho deste cargo é:",
    objetivo: "Avalia se a função é medida mais pelo resultado alcançado ou pela forma/processo utilizado.",
    alternativas: [
      { id: "r12_D", dimensao: "D", texto: "Alcançar a meta, independente do caminho percorrido.", explicacao: "Mede a exigência de foco no resultado final, acima do processo." },
      { id: "r12_I", dimensao: "I", texto: "Alcançar a meta mantendo boas relações com todos envolvidos.", explicacao: "Mede a exigência de equilibrar resultado com relacionamento." },
      { id: "r12_S", dimensao: "S", texto: "Manter a estabilidade da equipe enquanto entrega os resultados.", explicacao: "Mede a exigência de equilibrar resultado com estabilidade da equipe." },
      { id: "r12_C", dimensao: "C", texto: "Seguir rigorosamente o processo definido para chegar ao resultado.", explicacao: "Mede a exigência de seguir o processo correto para alcançar o resultado." },
    ],
  },
];

/**
 * Pergunta de validacao objetiva (regua 0-100), respondida apos os 12
 * blocos de escolha forcada. Nao entra no calculo do D/I/S/C - serve para
 * comparar com o D calculado pelas escolhas forcadas do mesmo respondente
 * e sinalizar possivel tendenciosidade/inconsistencia nas respostas.
 */
export const DISC360_ROLE_PERGUNTA_VALIDACAO = {
  pergunta:
    "Numa régua de 0 a 100, o quanto você entende que a pessoa que ocupa este cargo deve conduzir um projeto ou um feedback:",
  extremoBaixo: "Mais perto de 0 = de forma mais cautelosa, diplomática e pouco confrontativa.",
  extremoAlto: "Mais perto de 100 = de forma mais direta, rápida e assertiva.",
};

// Diferenca (em pontos) entre a regua de validacao e o D calculado pelas
// escolhas forcadas, acima da qual acende um alerta de possivel
// tendenciosidade/inconsistencia na resposta do respondente.
export const DISC360_ROLE_ALERTA_LIMITE_DIVERGENCIA = 30;
