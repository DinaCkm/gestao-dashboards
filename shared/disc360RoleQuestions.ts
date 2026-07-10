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
 * Perguntas de validacao objetiva (regua 0-100), UMA POR EIXO (D, I, S, C),
 * respondidas apos os 12 blocos de escolha forcada. Nao entram no calculo
 * do D/I/S/C pelas escolhas forcadas - servem para comparar, eixo a eixo,
 * com o score calculado pelas escolhas forcadas do mesmo respondente e
 * sinalizar possivel tendenciosidade/inconsistencia nas respostas.
 */
export type Disc360RoleValidacaoFaixa = {
  min: number;
  max: number;
  label: string;
  texto: string;
  pontosPositivos: string[];
  pontosAtencao: string[];
  pontosInvestigarSelecao: string[];
};

export type Disc360RoleValidacaoQuestion = {
  dimensao: Disc360RoleDimension;
  pergunta: string;
  faixas: Disc360RoleValidacaoFaixa[];
};

export const DISC360_ROLE_VALIDACAO_QUESTIONS: Disc360RoleValidacaoQuestion[] = [
  {
    dimensao: "D",
    pergunta:
      "Avaliando este cargo, quanto esta função exige Dominância para conduzir decisões, enfrentar desafios, lidar com pressão e entregar resultados?",
    faixas: [
      {
        min: 0,
        max: 25,
        label: "Dominância baixa",
        texto:
          "O cargo exige uma condução mais cautelosa, diplomática e pouco confrontativa. A pessoa ainda precisa se posicionar, mas deve fazer isso com prudência, validação e cuidado nas relações.",
        pontosPositivos: [
          "Toma decisões com cautela, reduzindo o risco de escolhas precipitadas.",
          "Evita atritos desnecessários e preserva o clima do time.",
          "Boa aceitação em contextos que exigem diplomacia e escuta antes de agir.",
        ],
        pontosAtencao: [
          "Pode demorar para decidir quando a situação exige rapidez.",
          "Tende a evitar confrontos mesmo quando são necessários.",
          "Pode ter dificuldade em cobrar resultados de forma direta.",
        ],
        pontosInvestigarSelecao: [
          "Peça exemplos de decisões que teve que tomar sob pressão, mesmo sem ter certeza total.",
          "Investigue como a pessoa reage diante de um conflito que não pode ser evitado.",
          "Avalie o nível de conforto ao dar um feedback direto ou dizer não.",
        ],
      },
      {
        min: 26,
        max: 50,
        label: "Dominância moderadamente baixa",
        texto:
          "O cargo exige alguma iniciativa e capacidade de decisão, mas com maior ponderação, menor exposição ao confronto e preferência por alinhamento antes da ação.",
        pontosPositivos: [
          "Equilibra ação e escuta, buscando alinhamento antes de decidir.",
          "Reduz o risco de decisões impulsivas ou mal avaliadas.",
          "Tende a construir apoio da equipe antes de agir.",
        ],
        pontosAtencao: [
          "Pode buscar validação em excesso antes de agir, perdendo tempo.",
          "Risco de perder o timing em decisões urgentes.",
          "Pode delegar decisões que deveria assumir pessoalmente.",
        ],
        pontosInvestigarSelecao: [
          "Pergunte como a pessoa age quando precisa decidir sozinha, sem tempo para consultar ninguém.",
          "Peça um exemplo de decisão tomada sem consenso da equipe.",
          "Avalie a velocidade de resposta em situações que descreveu como urgentes.",
        ],
      },
      {
        min: 51,
        max: 75,
        label: "Dominância moderadamente alta",
        texto:
          "O cargo exige posicionamento claro, responsabilidade por resultados e capacidade de decidir com firmeza, mas ainda preservando análise, escuta e cuidado com impactos.",
        pontosPositivos: [
          "Assume responsabilidade e decide com firmeza quando necessário.",
          "Orientação clara para resultado, sem abrir mão de ouvir antes de agir.",
          "Consegue equilibrar urgência com análise da situação.",
        ],
        pontosAtencao: [
          "Pode gerar atrito ao impor ritmo ou decisões ao time.",
          "Risco de impaciência com pessoas que decidem mais devagar.",
          "Pode subestimar o impacto emocional de suas decisões nos outros.",
        ],
        pontosInvestigarSelecao: [
          "Investigue como a pessoa lida com discordância da equipe após uma decisão já tomada.",
          "Peça um exemplo de como equilibrou urgência e escuta em uma situação real.",
          "Avalie como reage a um feedback que questiona diretamente uma decisão sua.",
        ],
      },
      {
        min: 76,
        max: 100,
        label: "Dominância alta",
        texto:
          "O cargo exige decisão rápida, assertividade, enfrentamento direto de obstáculos, cobrança de resultados, autonomia e sustentação de decisões mesmo sob pressão.",
        pontosPositivos: [
          "Assume riscos e responsabilidade sem se intimidar diante de obstáculos.",
          "Sustenta a posição mesmo sob pressão ou questionamento.",
          "Entrega resultado mesmo em cenários difíceis ou adversos.",
        ],
        pontosAtencao: [
          "Risco de atropelar pessoas ou processos ao buscar velocidade.",
          "Pode gerar conflitos desnecessários por excesso de assertividade.",
          "Pode ter dificuldade em ouvir e acolher posições contrárias.",
        ],
        pontosInvestigarSelecao: [
          "Pergunte como a pessoa lida com os próprios erros quando está sob pressão.",
          "Peça exemplos de conflitos gerados por decisões rápidas e como foram resolvidos.",
          "Avalie a capacidade de ouvir e mudar de posição quando confrontado com dados ou argumentos consistentes.",
        ],
      },
    ],
  },
  {
    dimensao: "I",
    pergunta:
      "Avaliando este cargo, quanto esta função exige Influência para comunicar, envolver pessoas, construir relacionamentos e mobilizar adesão?",
    faixas: [
      {
        min: 0,
        max: 25,
        label: "Influência baixa",
        texto:
          "O cargo exige uma comunicação mais reservada, técnica, objetiva e discreta. A pessoa se relaciona quando necessário, mas sem grande exposição social ou necessidade constante de persuasão.",
        pontosPositivos: [
          "Comunicação objetiva e direta, focada no conteúdo técnico.",
          "Menor desgaste em interações sociais frequentes.",
          "Discrição em temas sensíveis ou confidenciais.",
        ],
        pontosAtencao: [
          "Pode ter dificuldade em engajar ou motivar a equipe.",
          "Pode parecer distante em times que precisam de proximidade constante.",
          "Tende a evitar situações de exposição, como apresentações ou negociações.",
        ],
        pontosInvestigarSelecao: [
          "Investigue a experiência prévia liderando ou influenciando pessoas.",
          "Pergunte como a pessoa se sente ao apresentar para grupos ou públicos maiores.",
          "Peça exemplos de situações em que precisou convencer alguém de algo.",
        ],
      },
      {
        min: 26,
        max: 50,
        label: "Influência moderadamente baixa",
        texto:
          "O cargo exige boa comunicação funcional e relacionamento cordial, mas sem depender fortemente de entusiasmo, visibilidade, negociação ou mobilização frequente de pessoas.",
        pontosPositivos: [
          "Comunicação clara e sem excessos.",
          "Relacionamento cordial e profissional com a equipe e stakeholders.",
          "Menor risco de prometer além do que pode entregar.",
        ],
        pontosAtencao: [
          "Pode não gerar entusiasmo ou engajamento espontâneo na equipe.",
          "Tende a evitar papéis que exigem networking ativo ou negociação constante.",
        ],
        pontosInvestigarSelecao: [
          "Pergunte como a pessoa constrói relacionamento com stakeholders importantes.",
          "Peça exemplos de situações de negociação que já viveu.",
          "Avalie o nível de conforto ao lidar com públicos variados.",
        ],
      },
      {
        min: 51,
        max: 75,
        label: "Influência moderadamente alta",
        texto:
          "O cargo exige comunicação ativa, capacidade de envolver pessoas, negociar, criar vínculos e gerar adesão, ainda que de forma equilibrada e ajustada ao contexto.",
        pontosPositivos: [
          "Boa capacidade de engajar e negociar com diferentes pessoas.",
          "Cria vínculos com facilidade e se comunica bem em diferentes níveis.",
          "Consegue gerar adesão sem depender de imposição.",
        ],
        pontosAtencao: [
          "Pode priorizar aceitação e harmonia em detrimento de dados ou críticas necessárias.",
          "Risco de otimismo excessivo em previsões ou promessas.",
          "Pode se dispersar em interações sociais no lugar de focar na entrega.",
        ],
        pontosInvestigarSelecao: [
          "Investigue como a pessoa equilibra relacionamento e resultado no dia a dia.",
          "Peça um exemplo de feedback difícil que precisou dar a alguém.",
          "Pergunte como lida quando a boa comunicação não é suficiente para resolver um problema técnico.",
        ],
      },
      {
        min: 76,
        max: 100,
        label: "Influência alta",
        texto:
          "O cargo exige forte comunicação, presença, persuasão, entusiasmo, relacionamento constante, capacidade de engajar, inspirar confiança e mobilizar diferentes públicos.",
        pontosPositivos: [
          "Grande capacidade de engajar, inspirar e mobilizar pessoas.",
          "Forte presença e comunicação em diferentes contextos.",
          "Facilidade em criar redes de relacionamento amplas.",
        ],
        pontosAtencao: [
          "Risco de priorizar o discurso em detrimento de dado e planejamento.",
          "Pode superestimar acordos fechados apenas verbalmente.",
          "Pode ter dificuldade com tarefas solitárias ou de baixo contato humano.",
        ],
        pontosInvestigarSelecao: [
          "Pergunte como a pessoa organiza e acompanha compromissos assumidos verbalmente.",
          "Peça exemplos de entregas técnicas ou detalhadas sob sua responsabilidade direta.",
          "Avalie como lida com períodos de rotina de baixa interação social.",
        ],
      },
    ],
  },
  {
    dimensao: "S",
    pergunta:
      "Avaliando este cargo, quanto esta função exige Estabilidade para manter constância, cooperação, paciência, previsibilidade e equilíbrio na rotina?",
    faixas: [
      {
        min: 0,
        max: 25,
        label: "Estabilidade baixa",
        texto:
          "O cargo exige alta flexibilidade, adaptação rápida, agilidade e baixa dependência de rotina previsível. A pessoa precisa lidar bem com mudanças, interrupções e variações constantes.",
        pontosPositivos: [
          "Alta adaptabilidade a mudanças frequentes.",
          "Conforto em ambientes dinâmicos ou instáveis.",
          "Agilidade para mudar de prioridade quando necessário.",
        ],
        pontosAtencao: [
          "Pode se desgastar ou perder foco em rotinas longas e repetitivas.",
          "Pode gerar sensação de instabilidade percebida pela equipe.",
          "Risco de descontinuidade em processos que exigem constância.",
        ],
        pontosInvestigarSelecao: [
          "Pergunte como a pessoa se comporta diante de tarefas repetitivas de longo prazo.",
          "Peça exemplos de continuidade que manteve em projetos extensos.",
          "Avalie o nível de tolerância a rotina e processos padronizados.",
        ],
      },
      {
        min: 26,
        max: 50,
        label: "Estabilidade moderadamente baixa",
        texto:
          "O cargo exige alguma constância e cooperação, mas com forte necessidade de adaptação, alternância de prioridades e tolerância a ambientes menos previsíveis.",
        pontosPositivos: [
          "Equilibra rotina e mudança sem grande resistência.",
          "Coopera bem em contextos variáveis.",
          "Adapta-se com relativa facilidade a novas prioridades.",
        ],
        pontosAtencao: [
          "Pode ter dificuldade em ambientes totalmente estáveis e repetitivos.",
          "Alternância frequente de prioridades pode impactar a previsibilidade das entregas.",
        ],
        pontosInvestigarSelecao: [
          "Pergunte como a pessoa prioriza tarefas quando tudo muda com frequência.",
          "Peça um exemplo de como manteve a continuidade de um processo apesar das mudanças ao redor.",
        ],
      },
      {
        min: 51,
        max: 75,
        label: "Estabilidade moderadamente alta",
        texto:
          "O cargo exige continuidade, paciência, cooperação e equilíbrio, mas sem perder flexibilidade quando mudanças ou ajustes forem necessários.",
        pontosPositivos: [
          "Mantém constância no trabalho e coopera bem com o time.",
          "Sustenta ritmo estável mesmo diante de ajustes pontuais.",
          "Boa combinação de paciência com abertura a mudanças pontuais.",
        ],
        pontosAtencao: [
          "Pode resistir a mudanças bruscas ou repentinas.",
          "Pode levar mais tempo para se adaptar a reestruturações importantes.",
        ],
        pontosInvestigarSelecao: [
          "Investigue como a pessoa reage a mudanças de última hora.",
          "Peça um exemplo de adaptação a uma mudança organizacional significativa.",
        ],
      },
      {
        min: 76,
        max: 100,
        label: "Estabilidade alta",
        texto:
          "O cargo exige grande constância, paciência, previsibilidade, cooperação, cuidado com o ritmo do time e sustentação da segurança emocional e operacional ao longo do tempo.",
        pontosPositivos: [
          "Grande estabilidade emocional e operacional ao longo do tempo.",
          "Paciência e cooperação consistentes com a equipe.",
          "Cuida do ritmo do time e preserva a previsibilidade dos processos.",
        ],
        pontosAtencao: [
          "Pode resistir fortemente a mudanças.",
          "Pode ter dificuldade em ambientes de alta volatilidade ou urgência constante.",
          "Risco de desconforto diante de reestruturações frequentes.",
        ],
        pontosInvestigarSelecao: [
          "Pergunte como a pessoa lidou com uma mudança organizacional grande e inesperada.",
          "Avalie o nível de conforto com ambientes de alta incerteza.",
          "Peça exemplos de flexibilização da própria rotina quando isso foi necessário.",
        ],
      },
    ],
  },
  {
    dimensao: "C",
    pergunta:
      "Avaliando este cargo, quanto esta função exige Conformidade para seguir critérios, métodos, normas, padrões e controles de qualidade?",
    faixas: [
      {
        min: 0,
        max: 25,
        label: "Conformidade baixa",
        texto:
          "O cargo exige maior flexibilidade, autonomia e adaptação. A pessoa precisa entregar com qualidade, mas com liberdade para ajustar caminhos e menor dependência de regras rígidas.",
        pontosPositivos: [
          "Flexibilidade para adaptar processos conforme a necessidade.",
          "Autonomia para encontrar soluções alternativas.",
          "Menor rigidez burocrática no dia a dia.",
        ],
        pontosAtencao: [
          "Risco de menor padronização ou documentação dos processos.",
          "Pode negligenciar detalhes ou normas importantes.",
          "Risco de inconsistência em processos que exigem regulação.",
        ],
        pontosInvestigarSelecao: [
          "Pergunte como a pessoa lida com tarefas que exigem alta precisão ou documentação.",
          "Peça exemplos de erros cometidos por falta de atenção a detalhes.",
          "Avalie o nível de conforto seguindo normas e regras rígidas.",
        ],
      },
      {
        min: 26,
        max: 50,
        label: "Conformidade moderadamente baixa",
        texto:
          "O cargo exige atenção a critérios importantes, mas permite flexibilidade, bom senso e adaptação dos procedimentos conforme o contexto.",
        pontosPositivos: [
          "Equilibra regras e bom senso na execução do trabalho.",
          "Adapta processos quando faz sentido para o resultado.",
          "Atenção a critérios relevantes sem engessar o trabalho.",
        ],
        pontosAtencao: [
          "Pode relaxar padrões em momentos de pressão.",
          "Pode não documentar processos com o rigor necessário.",
        ],
        pontosInvestigarSelecao: [
          "Pergunte como a pessoa garante qualidade quando o prazo é curto.",
          "Peça exemplos de decisões entre seguir a norma à risca ou adaptar o processo.",
        ],
      },
      {
        min: 51,
        max: 75,
        label: "Conformidade moderadamente alta",
        texto:
          "O cargo exige método, organização, atenção a detalhes e respeito aos padrões, ainda com alguma possibilidade de adaptação quando a situação justificar.",
        pontosPositivos: [
          "Organização e atenção a detalhes no trabalho.",
          "Segue padrões e qualidade de forma consistente.",
          "Mantém certo grau de adaptabilidade quando justificado.",
        ],
        pontosAtencao: [
          "Pode ser mais lento para decidir quando falta uma regra clara.",
          "Pode gerar resistência a mudanças de processo sem justificativa técnica.",
        ],
        pontosInvestigarSelecao: [
          "Investigue como a pessoa se comporta diante de ambiguidade ou ausência de processo definido.",
          "Peça exemplos de melhorias de processo que já propôs.",
        ],
      },
      {
        min: 76,
        max: 100,
        label: "Conformidade alta",
        texto:
          "O cargo exige rigor técnico, precisão, análise cuidadosa, documentação, controle, atenção minuciosa a detalhes e cumprimento fiel de normas e processos definidos.",
        pontosPositivos: [
          "Alta precisão técnica e rigor na análise.",
          "Forte compromisso com qualidade e conformidade.",
          "Documentação e controle consistentes dos processos.",
        ],
        pontosAtencao: [
          "Risco de lentidão em decisões urgentes.",
          "Pode ter dificuldade com ambiguidade ou mudanças de última hora.",
          "Risco de perfeccionismo que atrasa entregas.",
        ],
        pontosInvestigarSelecao: [
          "Pergunte como a pessoa lida com prazos apertados que exigem abrir mão de parte do rigor.",
          "Peça exemplos de flexibilização de processo sob pressão de tempo.",
          "Avalie o nível de conforto com decisões tomadas com informação incompleta.",
        ],
      },
    ],
  },
];

// Diferenca (em pontos) entre a regua de validacao e o score calculado do
// mesmo eixo pelas escolhas forcadas, acima da qual acende um alerta de
// possivel tendenciosidade/inconsistencia na resposta do respondente.
export const DISC360_ROLE_ALERTA_LIMITE_DIVERGENCIA = 30;
