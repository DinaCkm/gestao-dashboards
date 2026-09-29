export interface CompetenciaConsultoria {
  nome: string;
  descricao: string;
  desenvolvimento: string;
}

const itens: CompetenciaConsultoria[] = [
  ["Accountability","Capacidade de assumir responsabilidade pelas próprias entregas, decisões e resultados, mantendo transparência sobre compromissos e consequências.","Fortalecer acordos claros, acompanhar o que foi assumido, comunicar desvios com antecedência e concluir entregas com senso de responsabilidade."],
  ["Adaptabilidade","Capacidade de ajustar comportamentos, prioridades e formas de atuação diante de mudanças de contexto ou necessidade.","Praticar abertura a novas formas de trabalho, rever planos quando necessário e responder às mudanças sem perder qualidade e foco."],
  ["Adaptabilidade Dinâmica","Capacidade de se ajustar rapidamente a mudanças simultâneas, alternando prioridades e estratégias de forma consciente.","Exercitar leitura rápida de contexto, revisão frequente de prioridades e tomada de ação flexível diante de cenários em movimento."],
  ["Agilidade","Capacidade de responder às demandas com rapidez adequada, fluidez e objetividade, sem comprometer a qualidade.","Reduzir etapas desnecessárias, definir próximos passos claros e acompanhar prazos curtos com disciplina."],
  ["Aprendizagem Contínua","Disposição para buscar novos conhecimentos, refletir sobre experiências e incorporar aprendizados à prática profissional.","Criar rotina de aprendizagem, pedir feedback, registrar aprendizados e aplicar novos conhecimentos em situações reais."],
  ["Arquitetura de Mudanças","Capacidade de estruturar mudanças de forma planejada, considerando etapas, impactos, pessoas e sustentação.","Mapear impactos, envolver partes interessadas, definir etapas e acompanhar a adoção das mudanças ao longo do tempo."],
  ["Atenção","Capacidade de manter concentração nos detalhes relevantes, reduzindo falhas e omissões nas atividades.","Criar rotinas de conferência, reduzir interrupções e utilizar checklists para tarefas que exigem precisão."],
  ["Autoconfiança","Capacidade de agir com segurança compatível com seus conhecimentos e responsabilidades, sem perder abertura ao aprendizado.","Reconhecer pontos fortes, preparar-se para situações desafiadoras e comunicar decisões com clareza e serenidade."],
  ["Autoconhecimento","Capacidade de reconhecer características pessoais, forças, limitações, valores e padrões de comportamento.","Buscar feedback, refletir sobre situações recorrentes e identificar como seus comportamentos afetam resultados e relações."],
  ["Autonomia","Capacidade de conduzir responsabilidades e tomar iniciativas dentro dos limites de atuação, recorrendo a apoio quando necessário.","Ampliar domínio sobre processos, antecipar necessidades e propor soluções antes de depender de direcionamentos detalhados."],
  ["Autopercepção","Capacidade de observar e compreender o próprio comportamento, emoções e impacto sobre outras pessoas.","Praticar reflexão após situações importantes, comparar intenção e impacto e solicitar percepções de pessoas de confiança."],
  ["Autorregulação","Capacidade de administrar emoções, impulsos e reações para manter comportamento adequado aos objetivos e ao contexto.","Identificar gatilhos, criar pausas antes de reagir e escolher respostas mais conscientes em situações de pressão."],
  ["Capacidade Analítica","Capacidade de examinar informações, identificar relações, comparar alternativas e construir conclusões fundamentadas.","Estruturar problemas, separar fatos de hipóteses, conferir dados e registrar critérios utilizados nas análises."],
  ["Colaboração","Capacidade de contribuir de forma construtiva com outras pessoas para alcançar objetivos compartilhados.","Compartilhar informações, oferecer apoio, combinar responsabilidades e valorizar contribuições do grupo."],
  ["Comunicação Assertiva","Capacidade de expressar ideias, necessidades e posicionamentos com clareza, respeito e objetividade.","Praticar mensagens diretas, contextualizar pedidos, verificar entendimento e tratar divergências sem agressividade ou omissão."],
  ["Comunicação Escrita","Capacidade de transmitir informações por escrito com clareza, organização, correção e adequação ao público.","Planejar a mensagem antes de escrever, revisar estrutura e linguagem e destacar objetivo, contexto e ação esperada."],
  ["Comunicação Interpessoal","Capacidade de estabelecer trocas claras, respeitosas e produtivas nas relações profissionais.","Adaptar linguagem ao interlocutor, escutar antes de responder e confirmar alinhamentos importantes."],
  ["Comunicação Verbal","Capacidade de transmitir ideias oralmente de forma clara, organizada e adequada ao contexto.","Preparar pontos principais, falar com objetividade, observar reações e ajustar a explicação conforme o entendimento do público."],
  ["Criatividade","Capacidade de gerar ideias, alternativas e conexões novas para responder a necessidades e desafios.","Explorar referências diferentes, questionar soluções habituais e testar alternativas de baixo risco."],
  ["Curiosidade","Disposição para investigar, fazer perguntas e buscar compreensão mais ampla sobre situações e assuntos.","Ampliar perguntas antes de concluir, buscar fontes diversas e reservar tempo para explorar temas relevantes ao trabalho."],
  ["Decisões Ágeis","Capacidade de tomar decisões em tempo adequado, utilizando as informações disponíveis e considerando riscos essenciais.","Definir critérios de decisão, distinguir o que exige análise profunda do que pode ser decidido rapidamente e revisar resultados."],
  ["Delegação","Capacidade de distribuir responsabilidades de forma clara, considerando capacidade, contexto e acompanhamento necessário.","Definir resultado esperado, prazo, autonomia e pontos de acompanhamento, evitando tanto abandono quanto microgestão."],
  ["Disciplina","Capacidade de manter constância, organização e cumprimento de combinados mesmo diante de distrações ou dificuldades.","Criar rotinas, estabelecer prioridades diárias e acompanhar compromissos até a conclusão."],
  ["Empatia","Capacidade de compreender perspectivas, necessidades e sentimentos de outras pessoas sem perder objetividade.","Escutar com interesse genuíno, evitar conclusões precipitadas e considerar o contexto do outro antes de responder."],
  ["Escuta Ativa","Capacidade de ouvir com atenção plena, buscando compreender a mensagem antes de formular a resposta.","Reduzir interrupções, fazer perguntas de confirmação e resumir o que foi entendido antes de avançar."],
  ["Estratégia de Longo Alcance","Capacidade de considerar impactos futuros e construir caminhos sustentáveis para objetivos de longo prazo.","Relacionar decisões atuais a objetivos futuros, acompanhar tendências e revisar cenários periodicamente."],
  ["Ética Profissional","Capacidade de atuar com integridade, responsabilidade, respeito às normas e coerência entre princípios e condutas.","Conhecer diretrizes aplicáveis, explicitar conflitos de interesse e priorizar decisões transparentes e responsáveis."],
  ["Flexibilidade","Capacidade de ajustar abordagens e comportamentos quando novas necessidades ou informações surgem.","Evitar apego a uma única solução, considerar alternativas e adaptar o plano preservando o objetivo principal."],
  ["Foco","Capacidade de direcionar atenção e esforço para o que é prioritário, reduzindo dispersões.","Definir poucas prioridades por vez, criar blocos de concentração e limitar interrupções durante atividades críticas."],
  ["Foco em Resultados","Capacidade de direcionar esforços para entregas concretas e objetivos acordados, acompanhando progresso e qualidade.","Traduzir objetivos em entregas mensuráveis, acompanhar indicadores e corrigir desvios com rapidez."],
  ["Gestão da Comunicação","Capacidade de planejar, organizar e coordenar comunicações para públicos e momentos distintos.","Definir público, mensagem, canal, responsável e momento adequado para cada comunicação relevante."],
  ["Gestão de Conflitos","Capacidade de reconhecer divergências e conduzi-las de forma construtiva, buscando solução e preservação das relações.","Separar fatos de interpretações, ouvir as partes, explicitar interesses e construir acordos verificáveis."],
  ["Gestão de Mudanças","Capacidade de conduzir transições organizacionais considerando objetivos, impactos, comunicação e adesão.","Planejar etapas, comunicar razões e impactos, acompanhar resistências e apoiar a incorporação das novas práticas."],
  ["Gestão de Prioridades","Capacidade de ordenar demandas conforme importância, urgência, impacto e recursos disponíveis.","Definir critérios objetivos de prioridade, revisar a lista de demandas e renegociar prazos quando houver conflito."],
  ["Gestão de Stakeholders","Capacidade de identificar, compreender e administrar relações com pessoas ou grupos relevantes para uma iniciativa.","Mapear interesses e influência, combinar expectativas e manter comunicação adequada com cada parte interessada."],
  ["Gestão do Tempo","Capacidade de organizar o uso do tempo de forma coerente com prioridades, prazos e volume de demandas.","Planejar a semana, estimar duração de atividades, reservar margens para imprevistos e revisar atrasos recorrentes."],
  ["Influência","Capacidade de mobilizar pessoas e construir adesão por meio de argumentos, relações e credibilidade.","Compreender interesses do interlocutor, sustentar propostas com evidências e construir pontos de convergência."],
  ["Iniciativa","Capacidade de agir diante de necessidades e oportunidades sem depender sempre de solicitação direta.","Observar problemas e oportunidades, propor próximos passos e assumir ações compatíveis com sua responsabilidade."],
  ["Inovação","Capacidade de transformar ideias em melhorias, soluções ou práticas que agreguem valor.","Identificar problemas relevantes, testar hipóteses em pequena escala e aprender com os resultados antes de ampliar."],
  ["Inteligência Emocional","Capacidade de reconhecer e administrar emoções próprias e compreender sinais emocionais nas relações.","Ampliar autopercepção, identificar gatilhos e escolher respostas adequadas em interações de maior tensão."],
  ["Inteligência Emocional Tática","Capacidade de usar consciência emocional de forma prática para conduzir interações e decisões em situações específicas.","Observar emoções presentes, ajustar abordagem ao contexto e escolher o momento e a forma mais eficaz de agir."],
  ["Leitura de Cenário","Capacidade de compreender contexto, tendências, atores e fatores que influenciam uma situação.","Reunir informações relevantes, identificar forças em jogo e revisar hipóteses antes de decidir."],
  ["Liderança","Capacidade de mobilizar pessoas, dar direção, criar condições de desempenho e sustentar responsabilidades coletivas.","Comunicar direção, combinar expectativas, acompanhar entregas, oferecer feedback e desenvolver autonomia da equipe."],
  ["Mediação de Conflitos","Capacidade de facilitar o diálogo entre partes em divergência, favorecendo entendimento e construção de acordos.","Manter neutralidade, organizar a conversa, explicitar interesses e registrar acordos e responsabilidades."],
  ["Memória","Capacidade de reter e recuperar informações relevantes para a execução das atividades.","Utilizar registros, associações, revisões periódicas e organização de informações para reduzir dependência da memória imediata."],
  ["Mentalidade de Crescimento","Disposição para compreender capacidades como passíveis de desenvolvimento por esforço, prática e aprendizagem.","Tratar erros como fonte de aprendizado, buscar desafios progressivos e acompanhar evolução ao longo do tempo."],
  ["Mentalidade Sistêmica","Capacidade de compreender relações entre partes de um sistema e os efeitos de decisões em diferentes áreas.","Mapear conexões, considerar impactos indiretos e consultar áreas afetadas antes de decisões de maior alcance."],
  ["Mindset Visionário","Capacidade de imaginar possibilidades futuras e inspirar direção a partir de oportunidades e transformações emergentes.","Acompanhar tendências, construir cenários e traduzir ideias de futuro em hipóteses e iniciativas concretas."],
  ["Negociação","Capacidade de construir acordos equilibrando interesses, limites e possibilidades das partes envolvidas.","Preparar objetivos e limites, investigar interesses, gerar alternativas e formalizar acordos claros."],
  ["Networking","Capacidade de construir e manter uma rede de relações profissionais baseada em troca, confiança e reciprocidade.","Cultivar contatos de forma contínua, contribuir antes de solicitar apoio e manter vínculos relevantes ativos."],
  ["Orientação ao Cliente","Capacidade de compreender necessidades do cliente e direcionar ações para gerar valor e boa experiência.","Ouvir necessidades, esclarecer expectativas, acompanhar entregas e utilizar feedback para melhorar o atendimento."],
  ["Orientação para Soluções","Capacidade de direcionar energia para alternativas viáveis e próximos passos diante de dificuldades.","Definir claramente o problema, gerar opções e transformar discussões em ações concretas com responsáveis e prazos."],
  ["Pensamento Crítico","Capacidade de avaliar informações e argumentos de forma criteriosa, identificando evidências, premissas e inconsistências.","Questionar fontes, diferenciar fatos de opiniões, comparar explicações e justificar conclusões com evidências."],
  ["Pensamento Estratégico","Capacidade de conectar objetivos, contexto, escolhas e recursos para orientar decisões de maior impacto.","Analisar cenários, explicitar prioridades e relacionar decisões do presente aos objetivos estratégicos."],
  ["Pensamento Sistêmico","Capacidade de compreender problemas e decisões como parte de um conjunto de relações interdependentes.","Mapear causas, efeitos e dependências, evitando soluções locais que criem problemas em outras partes do sistema."],
  ["Perseverança","Capacidade de manter esforço e compromisso diante de dificuldades, ajustando a estratégia sem abandonar o objetivo.","Dividir desafios em etapas, acompanhar progresso e buscar alternativas quando a abordagem inicial não funcionar."],
  ["Planejamento e Organização","Capacidade de estruturar atividades, recursos, prazos e sequência de execução para alcançar objetivos.","Transformar objetivos em etapas, utilizar agenda ou ferramenta de acompanhamento e revisar prioridades regularmente."],
  ["Presença Executiva","Capacidade de transmitir segurança, clareza, credibilidade e adequação em situações profissionais de maior exposição.","Preparar mensagens-chave, cuidar da objetividade, desenvolver postura segura e adaptar comunicação ao público."],
  ["Priorização","Capacidade de escolher o que deve receber atenção primeiro com base em relevância, urgência e impacto.","Estabelecer critérios, limitar o número de prioridades simultâneas e revisar escolhas quando o contexto mudar."],
  ["Proatividade","Capacidade de antecipar necessidades e agir de forma construtiva antes que seja necessária uma cobrança ou intervenção externa.","Observar riscos e oportunidades, propor alternativas e comunicar ações preventivas com antecedência."],
  ["Protagonismo","Capacidade de assumir papel ativo na própria atuação e desenvolvimento, responsabilizando-se por escolhas e contribuições.","Definir objetivos pessoais, buscar recursos, pedir feedback e propor ações em vez de aguardar direcionamento completo."],
  ["Raciocínio Lógico e Espacial","Capacidade de organizar relações lógicas e compreender posições, formas ou estruturas espaciais para resolver problemas.","Praticar decomposição de problemas, representação visual e verificação passo a passo do raciocínio utilizado."],
  ["Radar de Cenários","Capacidade de monitorar sinais, tendências e mudanças que podem alterar riscos ou oportunidades futuras.","Definir temas a monitorar, revisar fontes periodicamente e registrar sinais que possam exigir ajuste de decisão."],
  ["Relacionamentos Conectivos","Capacidade de criar conexões entre pessoas, áreas e conhecimentos, favorecendo cooperação e circulação de informações.","Aproximar pessoas com interesses complementares, compartilhar contextos e facilitar trocas entre áreas."],
  ["Resiliência","Capacidade de recuperar equilíbrio e continuar atuando de forma produtiva diante de pressão, frustração ou mudança.","Reconhecer limites, buscar apoio, reorganizar prioridades e transformar experiências difíceis em aprendizado."],
  ["Resolução de Problemas","Capacidade de identificar causas, avaliar alternativas e implementar soluções adequadas para problemas do trabalho.","Definir o problema com precisão, investigar causas, comparar opções e acompanhar se a solução produziu o efeito esperado."],
  ["Responsabilidade","Capacidade de cumprir compromissos e assumir consequências de suas escolhas e entregas.","Registrar compromissos, acompanhar prazos, comunicar impedimentos e concluir o que foi acordado."],
  ["Responsabilidade Social","Capacidade de considerar impactos sociais e coletivos das decisões e práticas profissionais.","Avaliar impactos sobre diferentes públicos, respeitar princípios éticos e buscar alternativas que conciliem resultado e responsabilidade."],
  ["Senso de Dono","Capacidade de agir com responsabilidade ampliada sobre resultados, recursos e sustentabilidade do trabalho.","Cuidar de recursos, antecipar problemas e tomar decisões considerando o impacto para o conjunto da organização."],
  ["Senso de Urgência","Capacidade de reconhecer prioridades, compreender o impacto dos prazos e agir com agilidade diante das demandas, mantendo a qualidade das entregas.","Fortalecer a percepção sobre prioridades e impactos, aprimorar a gestão do tempo, acompanhar prazos com atenção, comunicar impedimentos antecipadamente e buscar soluções com agilidade."],
  ["Tomada de Decisão","Capacidade de escolher caminhos de ação com base em informações, critérios, riscos e consequências.","Definir critérios antes de decidir, reunir informações suficientes, considerar riscos e revisar resultados das decisões tomadas."],
  ["Trabalho em Equipe","Capacidade de atuar de forma cooperativa, compartilhando responsabilidades e contribuindo para objetivos comuns.","Combinar papéis, compartilhar informações, apoiar colegas e tratar divergências com respeito e foco no objetivo coletivo."],
  ["Visão Estratégica","Capacidade de compreender direção, prioridades e impactos de longo prazo para orientar decisões relevantes.","Relacionar atividades aos objetivos estratégicos, acompanhar contexto externo e considerar impactos futuros nas escolhas."],
  ["Visão de Negócio","Capacidade de compreender como a organização gera valor, utiliza recursos e atende seus públicos.","Conhecer objetivos, indicadores, clientes e processos-chave e relacionar decisões do dia a dia aos resultados do negócio."],
  ["Visão de Futuro","Capacidade de antecipar possibilidades e considerar tendências para preparar decisões e caminhos futuros.","Acompanhar mudanças, construir cenários e traduzir sinais de futuro em perguntas e ações de preparação."],
  ["Adaptabilidade à Mudança","Capacidade de ajustar comportamento e forma de trabalho diante de mudanças em processos, prioridades ou contexto.","Reconhecer impactos da mudança, experimentar novas práticas e buscar rapidamente os conhecimentos necessários para a adaptação."],
  ["Comunicação com Diferentes Públicos","Capacidade de adaptar linguagem, profundidade e forma de comunicação às características de públicos distintos.","Identificar necessidades do público, ajustar vocabulário e nível de detalhe e confirmar compreensão."],
  ["Gestão de Pressão","Capacidade de manter organização, qualidade e equilíbrio em situações de alta demanda ou tensão.","Reorganizar prioridades, comunicar limites, criar pausas de recuperação e evitar decisões impulsivas sob pressão."],
  ["Orientação para Resultados","Capacidade de manter atenção em objetivos e entregas, convertendo esforço em resultados observáveis.","Definir metas claras, acompanhar progresso e ajustar ações quando os resultados estiverem abaixo do esperado."],
  ["Visão Sistêmica","Capacidade de perceber interdependências entre áreas, processos e decisões dentro de um contexto mais amplo.","Mapear conexões entre atividades, consultar áreas impactadas e considerar efeitos indiretos antes de decidir."],
  ["Adaptabilidade Cognitiva","Capacidade de mudar modelos mentais, interpretações e estratégias de raciocínio quando novas informações surgem.","Questionar premissas, comparar perspectivas e experimentar formas diferentes de compreender e resolver uma situação."],
  ["Agilidade de Aprendizagem","Capacidade de aprender rapidamente com experiências e aplicar conhecimentos em situações novas.","Buscar feedback rápido, testar aprendizados em situações reais e transferir lições de um contexto para outro."],
  ["Autogestão","Capacidade de organizar prioridades, comportamento e energia para cumprir responsabilidades com autonomia.","Planejar compromissos, acompanhar execução e ajustar rotina, foco e esforço conforme as demandas."],
  ["Capacidade de Síntese","Capacidade de reunir informações essenciais e apresentá-las de forma concisa, organizada e compreensível.","Identificar mensagem principal, separar essencial de acessório e praticar resumos com conclusão e próximos passos."],
  ["Clareza na Comunicação","Capacidade de transmitir mensagens de forma simples, precisa e compreensível, reduzindo ambiguidades.","Organizar a mensagem, utilizar exemplos quando necessário e confirmar se o entendimento do interlocutor corresponde ao pretendido."],
  ["Comprometimento","Capacidade de manter envolvimento e responsabilidade com objetivos, acordos e entregas assumidas.","Conectar atividades aos objetivos, acompanhar compromissos e comunicar antecipadamente qualquer risco de não cumprimento."],
  ["Consciência Organizacional","Capacidade de compreender normas, cultura, relações e funcionamento da organização para atuar de forma adequada.","Conhecer papéis, processos e regras, observar como as decisões circulam e entender impactos entre áreas."],
  ["Construção de Relacionamentos","Capacidade de desenvolver relações profissionais baseadas em confiança, respeito e cooperação.","Manter contato consistente, demonstrar interesse genuíno, cumprir acordos e criar oportunidades de colaboração."],
  ["Cooperação","Capacidade de contribuir com outras pessoas e compartilhar esforços para alcançar objetivos comuns.","Oferecer ajuda, dividir informações e negociar responsabilidades de maneira equilibrada."],
  ["Gestão de Crises","Capacidade de organizar resposta a situações críticas, priorizando continuidade, informação e redução de impactos.","Estabelecer prioridades, definir responsáveis, manter comunicação objetiva e registrar decisões durante a crise."],
  ["Gestão de Expectativas","Capacidade de alinhar o que pode ser entregue, em que condições e em qual prazo, reduzindo desalinhamentos.","Explicitar escopo, limites e prazos, confirmar entendimento e atualizar as partes quando houver mudanças."],
  ["Gestão de Riscos","Capacidade de identificar incertezas, avaliar impactos e definir medidas de prevenção ou resposta.","Mapear riscos relevantes, estimar probabilidade e impacto e estabelecer ações preventivas e planos de contingência."],
  ["Inteligência Social","Capacidade de perceber dinâmicas sociais e ajustar a atuação de forma adequada às pessoas e ao contexto.","Observar sinais do ambiente, considerar diferentes perspectivas e adaptar interação sem perder autenticidade."],
  ["Orientação para Melhoria Contínua","Capacidade de buscar aperfeiçoamentos sucessivos em processos, práticas e resultados.","Registrar problemas recorrentes, testar pequenos ajustes, acompanhar efeito e incorporar o que funcionar."],
  ["Pensamento Inovador","Capacidade de questionar padrões e construir abordagens novas ou significativamente melhoradas.","Combinar referências, formular hipóteses diferentes e testar ideias com rapidez antes de ampliar."],
  ["Persuasão","Capacidade de construir argumentos capazes de gerar entendimento e adesão, respeitando a autonomia do interlocutor.","Conhecer o público, utilizar evidências, antecipar objeções e apresentar benefícios e impactos com clareza."],
  ["Senso Crítico","Capacidade de avaliar situações com discernimento, questionando informações e identificando inconsistências ou riscos.","Comparar fontes, pedir evidências, explicitar critérios e testar conclusões antes de aceitá-las como definitivas."],
  ["Solução de Problemas Complexos","Capacidade de lidar com problemas de múltiplas causas, variáveis e partes envolvidas, estruturando caminhos de solução.","Decompor o problema, mapear relações e restrições, testar hipóteses e combinar soluções em etapas."],
  ["Visão Integrada","Capacidade de reunir diferentes perspectivas e informações para compreender uma situação como um conjunto conectado.","Cruzar dados de áreas diferentes, identificar relações e considerar impactos conjuntos antes de definir uma ação."]
].map(([nome, descricao, desenvolvimento]) => ({ nome, descricao, desenvolvimento }));

export const COMPETENCIAS_CONSULTORIA: readonly CompetenciaConsultoria[] = itens;

const porNome = new Map(itens.map((item) => [item.nome.toLocaleLowerCase('pt-BR'), item]));

export function competenciaConsultoriaPorNome(nome: unknown): CompetenciaConsultoria | null {
  const chave = String(nome || '').trim().toLocaleLowerCase('pt-BR');
  return chave ? porNome.get(chave) || null : null;
}

export function recomendacoesConsultoria(nomes: unknown[]): CompetenciaConsultoria[] {
  const vistos = new Set<string>();
  const saida: CompetenciaConsultoria[] = [];
  for (const nome of nomes || []) {
    const item = competenciaConsultoriaPorNome(nome);
    if (!item) continue;
    const chave = item.nome.toLocaleLowerCase('pt-BR');
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    saida.push(item);
    if (saida.length >= 4) break;
  }
  return saida;
}
