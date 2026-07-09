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
  explicacao: string;
};

export type Disc360CultureQuestion = {
  id: string;
  tema: string;
  pergunta: string;
  objetivo: string;
  alternativas: Disc360CultureAlternativa[];
};

export const DISC360_CULTURE_QUESTIONS: Disc360CultureQuestion[] = [
  {
    id: "q1",
    tema: "Tomada de decisão",
    pergunta: "Quando uma decisão importante precisa ser tomada, a empresa espera que as lideranças:",
    objetivo: "Avalia como a cultura espera que decisões relevantes sejam conduzidas: pela velocidade e assunção de responsabilidade, pelo consenso das pessoas envolvidas, pela cautela com a estabilidade do time, ou pelo rigor da análise técnica.",
    alternativas: [
      { id: "q1_D", dimensao: "D", texto: "Decidam com firmeza e rapidez, assumindo responsabilidade pelo resultado.", explicacao: "Mede a orientação para resultado: decidir rápido e assumir a responsabilidade pelo desfecho." },
      { id: "q1_I", dimensao: "I", texto: "Mobilizem as pessoas envolvidas e construam adesão antes de decidir.", explicacao: "Mede a orientação relacional: buscar adesão e engajamento das pessoas antes de decidir." },
      { id: "q1_S", dimensao: "S", texto: "Ponderem com calma, preservando a estabilidade e evitando rupturas bruscas.", explicacao: "Mede a orientação para estabilidade: decidir com calma, evitando rupturas no grupo." },
      { id: "q1_C", dimensao: "C", texto: "Analisem dados, riscos e procedimentos antes da decisão.", explicacao: "Mede a orientação técnica: basear a decisão em dados, riscos e procedimentos." },
    ],
  },
  {
    id: "q2",
    tema: "Papel do líder",
    pergunta: "O papel principal de um líder nesta empresa é:",
    objetivo: "Avalia qual estilo de liderança a cultura valoriza e espera no dia a dia das lideranças.",
    alternativas: [
      { id: "q2_D", dimensao: "D", texto: "Direcionar, cobrar e garantir o resultado.", explicacao: "Mede a expectativa de liderança direta: cobrança e garantia de resultado." },
      { id: "q2_I", dimensao: "I", texto: "Inspirar, comunicar e engajar as pessoas.", explicacao: "Mede a expectativa de liderança inspiradora: comunicação e engajamento das pessoas." },
      { id: "q2_S", dimensao: "S", texto: "Apoiar, desenvolver e manter o time unido e estável.", explicacao: "Mede a expectativa de liderança de apoio: cuidado com o time e manutenção da união." },
      { id: "q2_C", dimensao: "C", texto: "Organizar, controlar e assegurar qualidade e método.", explicacao: "Mede a expectativa de liderança organizadora: controle de processos e qualidade." },
    ],
  },
  {
    id: "q3",
    tema: "Mudança e adaptação",
    pergunta: "Quando há mudanças importantes na empresa, espera-se que as pessoas:",
    objetivo: "Avalia como a empresa espera que as pessoas reajam diante de mudanças importantes.",
    alternativas: [
      { id: "q3_D", dimensao: "D", texto: "Assumam a frente e façam a mudança acontecer rapidamente.", explicacao: "Mede a prontidão para agir: assumir a frente e acelerar a mudança." },
      { id: "q3_I", dimensao: "I", texto: "Comuniquem bem, influenciem e envolvam os demais na transição.", explicacao: "Mede a capacidade de mobilizar: comunicar e envolver os demais na transição." },
      { id: "q3_S", dimensao: "S", texto: "Se adaptem com equilíbrio, preservando o que já funciona bem.", explicacao: "Mede a busca por equilíbrio: adaptar-se preservando o que já funciona." },
      { id: "q3_C", dimensao: "C", texto: "Sigam um plano estruturado, com critérios e controles claros.", explicacao: "Mede a necessidade de estrutura: seguir um plano com critérios claros." },
    ],
  },
  {
    id: "q4",
    tema: "Alta performance e entrega",
    pergunta: "Uma equipe de alta performance, para esta empresa, é aquela que:",
    objetivo: "Avalia o que a empresa entende por uma equipe de alta performance.",
    alternativas: [
      { id: "q4_D", dimensao: "D", texto: "Entrega metas desafiadoras e supera obstáculos com velocidade.", explicacao: "Mede o foco em superar metas e obstáculos com velocidade." },
      { id: "q4_I", dimensao: "I", texto: "Gera conexão, energia e colaboração ativa entre as pessoas.", explicacao: "Mede o foco em energia e colaboração entre as pessoas do time." },
      { id: "q4_S", dimensao: "S", texto: "Mantém constância, confiança e cooperação ao longo do tempo.", explicacao: "Mede o foco em constância e confiança ao longo do tempo." },
      { id: "q4_C", dimensao: "C", texto: "Trabalha com método, qualidade e baixa margem de erro.", explicacao: "Mede o foco em método, qualidade e baixa margem de erro." },
    ],
  },
  {
    id: "q5",
    tema: "Normas e processos",
    pergunta: "Em relação a normas e processos, a empresa espera que as pessoas:",
    objetivo: "Avalia a relação que a empresa espera que as pessoas tenham com normas e processos internos.",
    alternativas: [
      { id: "q5_D", dimensao: "D", texto: "Usem os processos como apoio, mas priorizem sempre o resultado final.", explicacao: "Mede a visão instrumental do processo: usá-lo como apoio, sem travar o resultado." },
      { id: "q5_I", dimensao: "I", texto: "Comuniquem os processos de forma clara e envolvam as pessoas neles.", explicacao: "Mede a visão comunicativa do processo: explicá-lo e envolver as pessoas nele." },
      { id: "q5_S", dimensao: "S", texto: "Respeitem os processos para manter segurança e estabilidade.", explicacao: "Mede a visão protetiva do processo: segui-lo para manter segurança e estabilidade." },
      { id: "q5_C", dimensao: "C", texto: "Sigam padrões, controles e regras com rigor.", explicacao: "Mede a visão rigorosa do processo: cumprir padrões e regras com exatidão." },
    ],
  },
  {
    id: "q6",
    tema: "Ambiente de trabalho",
    pergunta: "O ambiente de trabalho mais desejado pela empresa é:",
    objetivo: "Avalia que tipo de ambiente de trabalho a cultura da empresa busca criar.",
    alternativas: [
      { id: "q6_D", dimensao: "D", texto: "Desafiador, competitivo e orientado a metas.", explicacao: "Mede a preferência por um ambiente competitivo e orientado a metas." },
      { id: "q6_I", dimensao: "I", texto: "Comunicativo, dinâmico e integrador.", explicacao: "Mede a preferência por um ambiente comunicativo e integrador." },
      { id: "q6_S", dimensao: "S", texto: "Colaborativo, estável e acolhedor.", explicacao: "Mede a preferência por um ambiente colaborativo e acolhedor." },
      { id: "q6_C", dimensao: "C", texto: "Organizado, técnico e orientado à excelência.", explicacao: "Mede a preferência por um ambiente organizado e técnico." },
    ],
  },
  {
    id: "q7",
    tema: "Gestão de conflitos",
    pergunta: "Quando surgem conflitos internos, a empresa espera que as lideranças:",
    objetivo: "Avalia como a empresa espera que as lideranças conduzam conflitos internos.",
    alternativas: [
      { id: "q7_D", dimensao: "D", texto: "Enfrentem o problema diretamente e decidam o encaminhamento.", explicacao: "Mede a postura de confronto direto: encarar o problema e decidir o encaminhamento." },
      { id: "q7_I", dimensao: "I", texto: "Conversem, influenciem e busquem acordo entre as partes.", explicacao: "Mede a postura de mediação: dialogar e buscar acordo entre as partes." },
      { id: "q7_S", dimensao: "S", texto: "Preservem o relacionamento e reduzam as tensões com cuidado.", explicacao: "Mede a postura protetiva: preservar o relacionamento e reduzir tensões." },
      { id: "q7_C", dimensao: "C", texto: "Analisem fatos, regras e responsabilidades antes de agir.", explicacao: "Mede a postura analítica: avaliar fatos e responsabilidades antes de agir." },
    ],
  },
  {
    id: "q8",
    tema: "Ritmo organizacional",
    pergunta: "O ritmo de trabalho ideal para esta empresa é:",
    objetivo: "Avalia qual ritmo de trabalho a empresa considera ideal.",
    alternativas: [
      { id: "q8_D", dimensao: "D", texto: "Rápido, objetivo e voltado à execução.", explicacao: "Mede a preferência por um ritmo rápido e voltado à execução." },
      { id: "q8_I", dimensao: "I", texto: "Dinâmico, participativo e com troca constante entre pessoas.", explicacao: "Mede a preferência por um ritmo dinâmico, com troca constante entre pessoas." },
      { id: "q8_S", dimensao: "S", texto: "Constante, previsível e sustentável ao longo do tempo.", explicacao: "Mede a preferência por um ritmo constante e sustentável." },
      { id: "q8_C", dimensao: "C", texto: "Planejado, controlado e baseado em método.", explicacao: "Mede a preferência por um ritmo planejado e baseado em método." },
    ],
  },
  {
    id: "q9",
    tema: "Inovação",
    pergunta: "Para a empresa, inovar significa principalmente:",
    objetivo: "Avalia o que a empresa entende como inovar.",
    alternativas: [
      { id: "q9_D", dimensao: "D", texto: "Agir antes dos concorrentes e assumir riscos calculados.", explicacao: "Mede a inovação pela ousadia: agir antes dos concorrentes, assumindo riscos." },
      { id: "q9_I", dimensao: "I", texto: "Criar ideias em conjunto, com trocas e influência entre pessoas.", explicacao: "Mede a inovação pela criação coletiva: gerar ideias em conjunto." },
      { id: "q9_S", dimensao: "S", texto: "Melhorar continuamente, sem desorganizar o que já funciona.", explicacao: "Mede a inovação pela evolução gradual: melhorar sem desorganizar." },
      { id: "q9_C", dimensao: "C", texto: "Testar, validar e estruturar mudanças com critérios técnicos.", explicacao: "Mede a inovação pelo rigor técnico: testar e validar com critérios." },
    ],
  },
  {
    id: "q10",
    tema: "Relação com clientes",
    pergunta: "Na relação com clientes, a empresa valoriza mais:",
    objetivo: "Avalia o que a empresa mais valoriza na relação com seus clientes.",
    alternativas: [
      { id: "q10_D", dimensao: "D", texto: "Agilidade, solução objetiva e entrega rápida.", explicacao: "Mede a valorização da agilidade e da entrega objetiva." },
      { id: "q10_I", dimensao: "I", texto: "Encantamento, comunicação próxima e relacionamento.", explicacao: "Mede a valorização do encantamento e da proximidade no relacionamento." },
      { id: "q10_S", dimensao: "S", texto: "Confiança, continuidade e cuidado ao longo do tempo.", explicacao: "Mede a valorização da confiança e da continuidade ao longo do tempo." },
      { id: "q10_C", dimensao: "C", texto: "Precisão, qualidade e cumprimento exato do combinado.", explicacao: "Mede a valorização da precisão e do cumprimento exato do combinado." },
    ],
  },
  {
    id: "q11",
    tema: "Reconhecimento e recompensa",
    pergunta: "A empresa tende a reconhecer e recompensar mais quem:",
    objetivo: "Avalia qual comportamento a empresa tende a reconhecer e recompensar mais.",
    alternativas: [
      { id: "q11_D", dimensao: "D", texto: "Assume desafios e entrega resultados relevantes.", explicacao: "Mede o reconhecimento a quem assume desafios e entrega resultado." },
      { id: "q11_I", dimensao: "I", texto: "Mobiliza pessoas e fortalece relacionamentos internos e externos.", explicacao: "Mede o reconhecimento a quem mobiliza pessoas e fortalece relações." },
      { id: "q11_S", dimensao: "S", texto: "Sustenta o time, colabora e mantém a estabilidade do grupo.", explicacao: "Mede o reconhecimento a quem sustenta e estabiliza o time." },
      { id: "q11_C", dimensao: "C", texto: "Garante qualidade, organização e confiabilidade no trabalho.", explicacao: "Mede o reconhecimento a quem garante qualidade e confiabilidade." },
    ],
  },
  {
    id: "q12",
    tema: "Estratégia e crescimento",
    pergunta: "Para crescer e se desenvolver no futuro, a empresa acredita que precisa principalmente de:",
    objetivo: "Avalia o que a empresa acredita ser mais necessário para crescer no futuro.",
    alternativas: [
      { id: "q12_D", dimensao: "D", texto: "Ambição, decisão rápida e foco em novas oportunidades.", explicacao: "Mede a crença de que o crescimento vem da ambição e de decisões rápidas." },
      { id: "q12_I", dimensao: "I", texto: "Marca forte, relacionamento e influência no mercado.", explicacao: "Mede a crença de que o crescimento vem da marca e do relacionamento no mercado." },
      { id: "q12_S", dimensao: "S", texto: "Uma equipe comprometida, estável e com continuidade.", explicacao: "Mede a crença de que o crescimento vem de uma equipe estável e comprometida." },
      { id: "q12_C", dimensao: "C", texto: "Gestão, controle, processos bem definidos e qualidade.", explicacao: "Mede a crença de que o crescimento vem de gestão e processos bem definidos." },
    ],
  },
  {
    id: "q13",
    tema: "Autonomia",
    pergunta: "Sobre autonomia no trabalho, a empresa espera que as pessoas:",
    objetivo: "Avalia o grau e o tipo de autonomia que a empresa espera das pessoas.",
    alternativas: [
      { id: "q13_D", dimensao: "D", texto: "Tomem iniciativa e decidam dentro de sua responsabilidade.", explicacao: "Mede a autonomia como iniciativa: decidir dentro da própria responsabilidade." },
      { id: "q13_I", dimensao: "I", texto: "Busquem alinhamento e envolvam as pessoas certas antes de agir.", explicacao: "Mede a autonomia como articulação: alinhar com as pessoas certas antes de agir." },
      { id: "q13_S", dimensao: "S", texto: "Ajam com responsabilidade, sem gerar instabilidade no grupo.", explicacao: "Mede a autonomia como responsabilidade cuidadosa: agir sem gerar instabilidade." },
      { id: "q13_C", dimensao: "C", texto: "Sigam critérios, limites e padrões bem definidos.", explicacao: "Mede a autonomia como disciplina: seguir critérios e limites definidos." },
    ],
  },
  {
    id: "q14",
    tema: "Comunicação interna",
    pergunta: "A comunicação interna ideal, para esta empresa, deve ser:",
    objetivo: "Avalia que estilo de comunicação interna a empresa considera ideal.",
    alternativas: [
      { id: "q14_D", dimensao: "D", texto: "Direta, objetiva e voltada à ação.", explicacao: "Mede a preferência por comunicação direta e voltada à ação." },
      { id: "q14_I", dimensao: "I", texto: "Inspiradora, envolvente e mobilizadora.", explicacao: "Mede a preferência por comunicação inspiradora e mobilizadora." },
      { id: "q14_S", dimensao: "S", texto: "Cuidadosa, acolhedora e que preserva o clima do time.", explicacao: "Mede a preferência por comunicação cuidadosa, que preserva o clima do time." },
      { id: "q14_C", dimensao: "C", texto: "Clara, documentada e precisa.", explicacao: "Mede a preferência por comunicação clara, documentada e precisa." },
    ],
  },
  {
    id: "q15",
    tema: "Gestão de riscos",
    pergunta: "Diante de situações de risco, a empresa espera que as pessoas ajam com:",
    objetivo: "Avalia como a empresa espera que as pessoas ajam diante de situações de risco.",
    alternativas: [
      { id: "q15_D", dimensao: "D", texto: "Coragem para decidir e agir rapidamente, mesmo sob incerteza.", explicacao: "Mede a coragem de decidir e agir rapidamente mesmo sob incerteza." },
      { id: "q15_I", dimensao: "I", texto: "Capacidade de envolver pessoas e gerar confiança na condução.", explicacao: "Mede a capacidade de envolver pessoas e gerar confiança na condução do risco." },
      { id: "q15_S", dimensao: "S", texto: "Prudência, para não comprometer a estabilidade do time ou da operação.", explicacao: "Mede a prudência para não comprometer a estabilidade do time ou da operação." },
      { id: "q15_C", dimensao: "C", texto: "Análise técnica cuidadosa, controles e prevenção.", explicacao: "Mede o rigor da análise técnica, dos controles e da prevenção." },
    ],
  },
  {
    id: "q16",
    tema: "Tratamento de erros e falhas",
    pergunta: "Quando um erro ou falha acontece, a empresa espera que as pessoas:",
    objetivo: "Avalia como a empresa espera que as pessoas reajam quando um erro acontece.",
    alternativas: [
      { id: "q16_D", dimensao: "D", texto: "Corrijam rapidamente e sigam em frente, focando no próximo resultado.", explicacao: "Mede a reação de correção rápida, seguindo em frente para o próximo resultado." },
      { id: "q16_I", dimensao: "I", texto: "Conversem abertamente sobre o ocorrido, envolvendo quem for necessário.", explicacao: "Mede a reação de diálogo aberto sobre o ocorrido, envolvendo quem for necessário." },
      { id: "q16_S", dimensao: "S", texto: "Tratem o erro com calma, sem gerar clima de culpa ou instabilidade.", explicacao: "Mede a reação de calma, sem gerar clima de culpa ou instabilidade." },
      { id: "q16_C", dimensao: "C", texto: "Investiguem a causa raiz e ajustem o processo para não repetir.", explicacao: "Mede a reação de investigação da causa raiz para evitar repetição." },
    ],
  },
  {
    id: "q17",
    tema: "Aprendizado e desenvolvimento",
    pergunta: "Sobre aprendizado e desenvolvimento das pessoas, a empresa espera que:",
    objetivo: "Avalia como a empresa espera que o aprendizado das pessoas aconteça.",
    alternativas: [
      { id: "q17_D", dimensao: "D", texto: "O aprendizado esteja a serviço de metas e resultados concretos e rápidos.", explicacao: "Mede o aprendizado a serviço de metas e resultados concretos e rápidos." },
      { id: "q17_I", dimensao: "I", texto: "As pessoas aprendam trocando experiências e se inspirando umas nas outras.", explicacao: "Mede o aprendizado pela troca de experiências entre pessoas." },
      { id: "q17_S", dimensao: "S", texto: "O desenvolvimento seja constante, gradual e sem pressão excessiva.", explicacao: "Mede o aprendizado como processo constante, gradual e sem pressão excessiva." },
      { id: "q17_C", dimensao: "C", texto: "O aprendizado siga trilhas estruturadas, com método e critérios claros.", explicacao: "Mede o aprendizado como trilha estruturada, com método e critérios." },
    ],
  },
  {
    id: "q18",
    tema: "Colaboração entre áreas",
    pergunta: "Na colaboração entre diferentes áreas da empresa, o esperado é que as pessoas:",
    objetivo: "Avalia como a empresa espera que diferentes áreas colaborem entre si.",
    alternativas: [
      { id: "q18_D", dimensao: "D", texto: "Ajam com foco no resultado do negócio, mesmo que isso gere tensão pontual entre áreas.", explicacao: "Mede a priorização do resultado do negócio, mesmo com tensão pontual entre áreas." },
      { id: "q18_I", dimensao: "I", texto: "Construam pontes, negociem e mantenham boas relações entre os times.", explicacao: "Mede a construção de pontes e boas relações entre os times." },
      { id: "q18_S", dimensao: "S", texto: "Cooperem de forma estável e continuada, sem gerar atritos.", explicacao: "Mede a cooperação estável e continuada, sem gerar atritos." },
      { id: "q18_C", dimensao: "C", texto: "Sigam processos claros de interface entre as áreas, com papéis bem definidos.", explicacao: "Mede o uso de processos claros de interface entre as áreas." },
    ],
  },
  {
    id: "q19",
    tema: "Uso de dados e indicadores",
    pergunta: "Sobre o uso de dados e indicadores, a empresa espera que as decisões sejam tomadas:",
    objetivo: "Avalia como a empresa espera que as decisões usem dados e indicadores.",
    alternativas: [
      { id: "q19_D", dimensao: "D", texto: "Com base em dados, mas sem perder velocidade na hora de agir.", explicacao: "Mede o uso de dados sem perder velocidade na hora de agir." },
      { id: "q19_I", dimensao: "I", texto: "Compartilhando os dados de forma que engajem e mobilizem as pessoas.", explicacao: "Mede o uso de dados de forma que engajem e mobilizem as pessoas." },
      { id: "q19_S", dimensao: "S", texto: "De forma consistente, sem mudar de direção com frequência.", explicacao: "Mede o uso de dados de forma consistente, sem mudar de direção com frequência." },
      { id: "q19_C", dimensao: "C", texto: "Com base rigorosa em dados, análises e indicadores bem estruturados.", explicacao: "Mede o uso rigoroso de dados, análises e indicadores estruturados." },
    ],
  },
  {
    id: "q20",
    tema: "Diversidade e inclusão",
    pergunta: "Em relação à diversidade e inclusão, a empresa espera que as lideranças:",
    objetivo: "Avalia como a empresa espera que as lideranças conduzam o tema de diversidade e inclusão.",
    alternativas: [
      { id: "q20_D", dimensao: "D", texto: "Tomem decisões objetivas para garantir avanço rápido do tema, com metas claras.", explicacao: "Mede a condução por metas objetivas e avanço rápido do tema." },
      { id: "q20_I", dimensao: "I", texto: "Promovam diálogo, escuta e construção conjunta em torno do tema.", explicacao: "Mede a condução por diálogo, escuta e construção conjunta." },
      { id: "q20_S", dimensao: "S", texto: "Criem um ambiente estável, seguro e acolhedor para todas as pessoas.", explicacao: "Mede a condução pela criação de um ambiente estável e acolhedor para todos." },
      { id: "q20_C", dimensao: "C", texto: "Estruturem políticas, critérios e processos formais sobre o tema.", explicacao: "Mede a condução por políticas, critérios e processos formais." },
    ],
  },
  {
    id: "q21",
    tema: "Modelos de trabalho",
    pergunta: "Sobre modelos de trabalho (presencial, remoto ou híbrido), a empresa espera que as pessoas:",
    objetivo: "Avalia a expectativa da empresa sobre modelos de trabalho (presencial, remoto ou híbrido).",
    alternativas: [
      { id: "q21_D", dimensao: "D", texto: "Tenham liberdade para escolher o formato que gera mais resultado.", explicacao: "Mede a preferência pela liberdade de escolher o formato que gera mais resultado." },
      { id: "q21_I", dimensao: "I", texto: "Mantenham conexão e boa comunicação, independentemente do formato.", explicacao: "Mede a preferência por manter conexão e comunicação, seja qual for o formato." },
      { id: "q21_S", dimensao: "S", texto: "Tenham estabilidade e previsibilidade na rotina de trabalho.", explicacao: "Mede a preferência por estabilidade e previsibilidade na rotina." },
      { id: "q21_C", dimensao: "C", texto: "Sigam regras e critérios claros definidos para cada formato.", explicacao: "Mede a preferência por seguir regras e critérios definidos para cada formato." },
    ],
  },
  {
    id: "q22",
    tema: "Ética e transparência",
    pergunta: "Sobre ética e transparência, a empresa espera que as pessoas:",
    objetivo: "Avalia o que a empresa espera das pessoas em relação a ética e transparência.",
    alternativas: [
      { id: "q22_D", dimensao: "D", texto: "Ajam com integridade, mesmo que isso signifique decisões difíceis e rápidas.", explicacao: "Mede a integridade mesmo em decisões difíceis e rápidas." },
      { id: "q22_I", dimensao: "I", texto: "Comuniquem de forma aberta e honesta, fortalecendo a confiança mútua.", explicacao: "Mede a comunicação aberta e honesta que fortalece a confiança mútua." },
      { id: "q22_S", dimensao: "S", texto: "Mantenham consistência e coerência entre discurso e prática ao longo do tempo.", explicacao: "Mede a consistência entre discurso e prática ao longo do tempo." },
      { id: "q22_C", dimensao: "C", texto: "Sigam rigorosamente normas, políticas e critérios formais de conduta.", explicacao: "Mede o rigor no cumprimento de normas e critérios formais de conduta." },
    ],
  },
  {
    id: "q23",
    tema: "Cultura desejada",
    pergunta: "A cultura desejada pela empresa deve ser reconhecida principalmente por:",
    objetivo: "Avalia por qual característica principal a empresa quer que sua cultura seja reconhecida.",
    alternativas: [
      { id: "q23_D", dimensao: "D", texto: "Alta performance e foco em resultados.", explicacao: "Mede o reconhecimento pela alta performance e foco em resultados." },
      { id: "q23_I", dimensao: "I", texto: "Relacionamento, influência e entusiasmo das pessoas.", explicacao: "Mede o reconhecimento pelo relacionamento e entusiasmo das pessoas." },
      { id: "q23_S", dimensao: "S", texto: "Cooperação, estabilidade e confiança mútua.", explicacao: "Mede o reconhecimento pela cooperação e confiança mútua." },
      { id: "q23_C", dimensao: "C", texto: "Excelência, organização e conformidade.", explicacao: "Mede o reconhecimento pela excelência e conformidade." },
    ],
  },
  {
    id: "q24",
    tema: "Integração de novas pessoas",
    pergunta: "Ao integrar uma nova pessoa na empresa, o mais importante é que ela:",
    objetivo: "Avalia o que a empresa considera mais importante ao integrar uma nova pessoa.",
    alternativas: [
      { id: "q24_D", dimensao: "D", texto: "Comece a gerar resultado e assuma responsabilidades rapidamente.", explicacao: "Mede a prioridade de gerar resultado e assumir responsabilidades rapidamente." },
      { id: "q24_I", dimensao: "I", texto: "Se conecte bem com o time e construa bons relacionamentos desde o início.", explicacao: "Mede a prioridade de se conectar bem com o time desde o início." },
      { id: "q24_S", dimensao: "S", texto: "Se sinta acolhida e segura durante o processo de adaptação.", explicacao: "Mede a prioridade de se sentir acolhida e segura durante a adaptação." },
      { id: "q24_C", dimensao: "C", texto: "Aprenda corretamente os processos, padrões e ferramentas da empresa.", explicacao: "Mede a prioridade de aprender corretamente processos e padrões." },
    ],
  },
];

 const DISC360_CULTURE_TOTAL_PERGUNTAS = DISC360_CULTURE_QUESTIONS.length;
