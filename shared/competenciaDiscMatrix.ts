import type { DiscDimensao } from "./discData";

export type FacilidadeDisc = "Alta" | "Moderada" | "Condicionada";

export interface CompetenciaDiscInfo {
  facilidade: FacilidadeDisc;
  ponto: string;
}

/**
 * Como cada perfil DISC tende a se relacionar com cada competência do catálogo B.E.M.
 * "facilidade" descreve uma tendência provável, não uma capacidade fixa: qualquer pessoa pode
 * desenvolver qualquer competência independentemente do perfil DISC. O objetivo aqui é sugerir,
 * para quem pontuou baixo em autopercepção nessa competência, um caminho de desenvolvimento
 * coerente com o próprio estilo comportamental — não rotular a pessoa.
 */
export const COMPETENCIA_DISC: Record<string, Record<DiscDimensao, CompetenciaDiscInfo>> = {
  "Gestão do Tempo": {
    D: { facilidade: "Moderada", ponto: "Reservar margem de segurança ao planejar prazos, evitando subestimar o tempo real das tarefas por pressa de concluir." },
    I: { facilidade: "Condicionada", ponto: "Usar lembretes e blocos de tempo protegido para tarefas de foco, já que o entusiasmo social tende a dispersar a agenda." },
    S: { facilidade: "Alta", ponto: "Revisar prazos quando a mudança é necessária, evitando rigidez excessiva com a rotina já estabelecida." },
    C: { facilidade: "Alta", ponto: "Evitar gastar tempo demais refinando detalhes que não mudam o resultado final." },
  },
  "Atenção": {
    D: { facilidade: "Condicionada", ponto: "Criar checkpoints de revisão antes de considerar a tarefa concluída, para não perder detalhes no caminho até o resultado." },
    I: { facilidade: "Condicionada", ponto: "Reduzir interrupções durante blocos que exigem concentração, já que estímulos sociais tendem a desviar o foco." },
    S: { facilidade: "Moderada", ponto: "Revisar informações periodicamente mesmo quando parece que está tudo igual." },
    C: { facilidade: "Alta", ponto: "Dosar o nível de profundidade da análise conforme a importância real da tarefa." },
  },
  "Autopercepção": {
    D: { facilidade: "Moderada", ponto: "Buscar feedback direto sobre como as próprias atitudes afetam a equipe, além do resultado entregue." },
    I: { facilidade: "Moderada", ponto: "Buscar critérios mais objetivos de autoavaliação, além da aprovação social recebida." },
    S: { facilidade: "Alta", ponto: "Expressar a autopercepção construída em vez de guardá-la só para si." },
    C: { facilidade: "Alta", ponto: "Evitar autocrítica excessiva diante de resultados imperfeitos." },
  },
  "Disciplina": {
    D: { facilidade: "Moderada", ponto: "Sustentar o mesmo padrão mesmo quando a tarefa deixa de ser desafiadora ou estimulante." },
    I: { facilidade: "Condicionada", ponto: "Criar estruturas externas — rotinas, lembretes, parceiros de cobrança — para manter o ritmo quando o entusiasmo inicial passa." },
    S: { facilidade: "Alta", ponto: "Revisar rotinas antigas que já não fazem mais sentido, em vez de repeti-las por hábito." },
    C: { facilidade: "Alta", ponto: "Flexibilizar o processo quando a situação pede adaptação, não repetição." },
  },
  "Empatia": {
    D: { facilidade: "Condicionada", ponto: "Pausar para considerar como a decisão é recebida pelas pessoas envolvidas, antes de priorizar só o resultado." },
    I: { facilidade: "Moderada", ponto: "Ouvir mais e resolver menos rápido, dando espaço para a outra pessoa se expressar por completo." },
    S: { facilidade: "Alta", ponto: "Cuidar para não absorver o peso emocional alheio como se fosse próprio." },
    C: { facilidade: "Condicionada", ponto: "Nomear explicitamente o aspecto humano da situação antes de apresentar a análise técnica." },
  },
  "Escuta Ativa": {
    D: { facilidade: "Condicionada", ponto: "Praticar pausas deliberadas antes de responder, no lugar de já formular a resposta enquanto o outro ainda fala." },
    I: { facilidade: "Moderada", ponto: "Fazer perguntas abertas e aguardar a resposta completa antes de continuar a conversa." },
    S: { facilidade: "Alta", ponto: "Usar essa escuta também para se posicionar, não só para acolher." },
    C: { facilidade: "Moderada", ponto: "Ouvir também o conteúdo emocional da fala, não só o factual." },
  },
  "Memória": {
    D: { facilidade: "Moderada", ponto: "Registrar por escrito decisões e combinados, sem depender só da lembrança do que foi relevante para a decisão." },
    I: { facilidade: "Condicionada", ponto: "Usar ferramentas externas de registro — agenda, anotações — como apoio para detalhes e prazos." },
    S: { facilidade: "Alta", ponto: "Atualizar lembranças de combinados quando eles mudam, para não seguir o padrão antigo." },
    C: { facilidade: "Alta", ponto: "Filtrar o que realmente precisa ser lembrado, para não sobrecarregar com informação irrelevante." },
  },
  "Raciocínio Lógico e Espacial": {
    D: { facilidade: "Moderada", ponto: "Reservar tempo para considerar mais de uma alternativa antes de decidir." },
    I: { facilidade: "Condicionada", ponto: "Usar estrutura — listas, fluxos — para organizar o raciocínio antes de agir." },
    S: { facilidade: "Moderada", ponto: "Ganhar mais confiança para expor um raciocínio ainda em construção." },
    C: { facilidade: "Alta", ponto: "Simplificar a comunicação do raciocínio para públicos menos técnicos." },
  },
  "Adaptabilidade": {
    D: { facilidade: "Alta", ponto: "Verificar se a mudança de rota foi combinada com quem depende dela, antes de segui-la." },
    I: { facilidade: "Alta", ponto: "Sustentar a adaptação além do entusiasmo inicial pela novidade." },
    S: { facilidade: "Condicionada", ponto: "Encarar a mudança em etapas menores, para reduzir o desconforto inicial." },
    C: { facilidade: "Condicionada", ponto: "Aceitar experimentar uma solução ainda não totalmente validada quando o tempo exige." },
  },
  "Comunicação Assertiva": {
    D: { facilidade: "Moderada", ponto: "Suavizar o tom sem perder a clareza da mensagem." },
    I: { facilidade: "Alta", ponto: "Incluir mais objetividade e menos rodeios quando a mensagem é sensível." },
    S: { facilidade: "Condicionada", ponto: "Praticar expressar discordância no momento em que ela surge, em vez de guardá-la." },
    C: { facilidade: "Moderada", ponto: "Adaptar a linguagem para quem não domina o mesmo nível de detalhe técnico." },
  },
  "Inteligência Emocional": {
    D: { facilidade: "Condicionada", ponto: "Reconhecer e nomear a própria emoção antes de agir sob pressão, em vez de minimizá-la em nome do resultado." },
    I: { facilidade: "Moderada", ponto: "Criar uma pausa entre sentir e reagir, já que perceber a emoção alheia é mais natural do que regular a própria." },
    S: { facilidade: "Alta", ponto: "Usar essa percepção emocional também para cuidar de si, não só dos outros." },
    C: { facilidade: "Condicionada", ponto: "Validar o componente emocional de uma situação antes de responder apenas com dados." },
  },
  "Leitura de Cenário": {
    D: { facilidade: "Moderada", ponto: "Considerar os efeitos de médio prazo antes de agir, além do resultado imediato." },
    I: { facilidade: "Condicionada", ponto: "Buscar dados objetivos para complementar a leitura intuitiva do clima social." },
    S: { facilidade: "Moderada", ponto: "Transformar a percepção do clima do grupo em ação mais rapidamente." },
    C: { facilidade: "Alta", ponto: "Evitar adiar a decisão em busca de mais informação do que o necessário." },
  },
  "Planejamento e Organização": {
    D: { facilidade: "Moderada", ponto: "Dedicar mais tempo ao planejamento antes de partir para a ação." },
    I: { facilidade: "Condicionada", ponto: "Esboçar um plano simples antes de iniciar, mesmo que informal." },
    S: { facilidade: "Alta", ponto: "Revisar o plano quando o contexto muda, sem se prender ao que já foi definido." },
    C: { facilidade: "Alta", ponto: "Evitar planejar em excesso quando o cenário pede mais agilidade." },
  },
  "Proatividade": {
    D: { facilidade: "Alta", ponto: "Alinhar a iniciativa com quem também é responsável pela decisão, antes de agir por conta própria." },
    I: { facilidade: "Alta", ponto: "Sustentar o envolvimento até a conclusão, não só no início da iniciativa." },
    S: { facilidade: "Condicionada", ponto: "Testar pequenas iniciativas próprias em contextos de baixo risco." },
    C: { facilidade: "Moderada", ponto: "Aceitar agir com informação parcial quando o cenário exige rapidez." },
  },
  "Resiliência": {
    D: { facilidade: "Alta", ponto: "Reservar um tempo para processar a experiência antes de partir para o próximo desafio." },
    I: { facilidade: "Moderada", ponto: "Desenvolver também estratégias individuais de recuperação, além do apoio de outras pessoas." },
    S: { facilidade: "Alta", ponto: "Comunicar quando a dificuldade realmente pesa, em vez de apenas suportar em silêncio." },
    C: { facilidade: "Condicionada", ponto: "Separar o erro pontual da competência como um todo, reduzindo a exigência consigo mesmo." },
  },
  "Gestão de Conflitos": {
    D: { facilidade: "Moderada", ponto: "Buscar acordo em vez de vitória na discussão." },
    I: { facilidade: "Moderada", ponto: "Não evitar abordar o ponto central do problema só para manter o clima leve." },
    S: { facilidade: "Condicionada", ponto: "Entender que adiar o conflito costuma agravá-lo, mesmo quando parece preservar a harmonia." },
    C: { facilidade: "Moderada", ponto: "Considerar também o componente emocional das partes envolvidas, além dos fatos." },
  },
  "Gestão de Equipes": {
    D: { facilidade: "Moderada", ponto: "Dedicar tempo a ouvir necessidades individuais da equipe, além de cobrar metas." },
    I: { facilidade: "Alta", ponto: "Equilibrar motivação com acompanhamento estruturado das metas." },
    S: { facilidade: "Alta", ponto: "Cobrar resultados com mais firmeza quando necessário, sem receio de gerar desconforto." },
    C: { facilidade: "Condicionada", ponto: "Dedicar atenção explícita ao lado humano da gestão, além do processo." },
  },
  "Accountability": {
    D: { facilidade: "Alta", ponto: "Reconhecer também a contribuição da equipe nos resultados alcançados." },
    I: { facilidade: "Condicionada", ponto: "Nomear com clareza o que não funcionou, sem se desculpar em excesso para preservar a relação." },
    S: { facilidade: "Moderada", ponto: "Se posicionar quando o combinado não depende só de si." },
    C: { facilidade: "Alta", ponto: "Aplicar o mesmo padrão de cobrança de forma menos punitiva consigo mesmo." },
  },
  "Foco em Resultados": {
    D: { facilidade: "Alta", ponto: "Considerar o custo humano do caminho até o resultado." },
    I: { facilidade: "Moderada", ponto: "Manter o foco quando o processo deixa de ser estimulante." },
    S: { facilidade: "Condicionada", ponto: "Lembrar que entregar o resultado também cuida da equipe, além do processo e da relação." },
    C: { facilidade: "Moderada", ponto: "Aceitar entregar algo bom antes de esperar pelo perfeito." },
  },
  "Influência": {
    D: { facilidade: "Alta", ponto: "Complementar a autoridade com escuta genuína das outras partes." },
    I: { facilidade: "Alta", ponto: "Sustentar a influência com argumentos consistentes, não só simpatia e carisma." },
    S: { facilidade: "Condicionada", ponto: "Se posicionar mais ativamente quando tem algo relevante a dizer, em vez de influenciar só pela confiança construída aos poucos." },
    C: { facilidade: "Moderada", ponto: "Conectar os dados a uma narrativa que engaje emocionalmente, além da evidência técnica." },
  },
  "Negociação": {
    D: { facilidade: "Alta", ponto: "Buscar também ganho para a outra parte, não só o resultado próprio." },
    I: { facilidade: "Moderada", ponto: "Manter o limite do que é aceitável mesmo diante da simpatia do outro lado." },
    S: { facilidade: "Condicionada", ponto: "Entrar na negociação com um limite mínimo definido antes de começar, para não ceder por desconforto." },
    C: { facilidade: "Alta", ponto: "Considerar também o fator relacional da negociação, além dos critérios objetivos." },
  },
  "Presença Executiva": {
    D: { facilidade: "Alta", ponto: "Equilibrar firmeza com abertura para o diálogo." },
    I: { facilidade: "Alta", ponto: "Sustentar essa presença também em momentos de menor visibilidade." },
    S: { facilidade: "Condicionada", ponto: "Praticar se posicionar em momentos-chave, mesmo sem ser solicitado." },
    C: { facilidade: "Moderada", ponto: "Comunicar o domínio técnico de forma mais acessível e confiante." },
  },
  "Protagonismo": {
    D: { facilidade: "Alta", ponto: "Abrir espaço para que outras pessoas também assumam protagonismo." },
    I: { facilidade: "Alta", ponto: "Sustentar o protagonismo com entrega consistente, não só presença e visibilidade." },
    S: { facilidade: "Condicionada", ponto: "Reconhecer e comunicar as próprias contribuições, em vez de preferir o segundo plano." },
    C: { facilidade: "Condicionada", ponto: "Se posicionar de forma mais visível quando a competência técnica já é reconhecida pelos outros." },
  },
  "Relacionamentos Conectivos": {
    D: { facilidade: "Condicionada", ponto: "Investir tempo em conexão para além do que é estritamente funcional." },
    I: { facilidade: "Alta", ponto: "Aprofundar menos relações, com mais consistência ao longo do tempo." },
    S: { facilidade: "Alta", ponto: "Ampliar a rede de relacionamentos para além do círculo já conhecido." },
    C: { facilidade: "Condicionada", ponto: "Investir em pequenos gestos de aproximação fora do contexto técnico." },
  },
  "Responsabilidade Social": {
    D: { facilidade: "Moderada", ponto: "Se envolver também quando o retorno não é imediato ou facilmente mensurável." },
    I: { facilidade: "Alta", ponto: "Sustentar o engajamento em causas coletivas além do impulso inicial." },
    S: { facilidade: "Alta", ponto: "Transformar a preocupação genuína com o impacto social em ação concreta." },
    C: { facilidade: "Moderada", ponto: "Permitir-se agir mesmo sem ter todos os dados de impacto disponíveis." },
  },
  "Tomada de Decisão": {
    D: { facilidade: "Alta", ponto: "Checar se a rapidez da decisão não está custando qualidade de análise." },
    I: { facilidade: "Moderada", ponto: "Buscar dados objetivos antes de fechar a decisão, além das impressões do momento." },
    S: { facilidade: "Condicionada", ponto: "Definir um prazo limite para decidir, mesmo sem 100% de conforto com a escolha." },
    C: { facilidade: "Condicionada", ponto: "Definir o nível de informação suficiente para decidir, e seguir com isso." },
  },
  "Visão Estratégica": {
    D: { facilidade: "Moderada", ponto: "Ampliar o horizonte de análise para o médio e longo prazo, além do resultado imediato." },
    I: { facilidade: "Condicionada", ponto: "Reservar tempo estruturado para pensar no cenário mais amplo, além do dia a dia tático." },
    S: { facilidade: "Moderada", ponto: "Considerar cenários que exigem ruptura com o que já é conhecido e funciona." },
    C: { facilidade: "Alta", ponto: "Conectar a estratégia a uma narrativa que mobilize e inspire pessoas." },
  },
  "Arquitetura de Mudanças": {
    D: { facilidade: "Alta", ponto: "Cuidar da adesão das pessoas ao processo, não só da velocidade da mudança." },
    I: { facilidade: "Moderada", ponto: "Sustentar a estrutura da mudança além do engajamento inicial que ela gera." },
    S: { facilidade: "Condicionada", ponto: "Participar ativamente do desenho da mudança, em vez de apenas reagir a ela." },
    C: { facilidade: "Moderada", ponto: "Acelerar a implementação quando o cenário exige menos planejamento e mais ação." },
  },
  "Decisões Ágeis": {
    D: { facilidade: "Alta", ponto: "Validar rapidamente com poucas pessoas-chave antes de seguir em frente." },
    I: { facilidade: "Moderada", ponto: "Complementar a intuição social com um critério objetivo mínimo." },
    S: { facilidade: "Condicionada", ponto: "Praticar decisões rápidas em contextos de baixo risco, para ganhar confiança no processo." },
    C: { facilidade: "Condicionada", ponto: "Definir previamente o tempo máximo de análise permitido antes de decidir." },
  },
  "Estratégia de Longo Alcance": {
    D: { facilidade: "Moderada", ponto: "Revisar premissas de longo prazo, não só as metas definidas." },
    I: { facilidade: "Condicionada", ponto: "Reservar tempo estruturado para pensar cenários de longo prazo, além do imediato." },
    S: { facilidade: "Moderada", ponto: "Considerar rupturas necessárias, mesmo quando desconfortáveis para a continuidade." },
    C: { facilidade: "Alta", ponto: "Comunicar a estratégia de longo prazo de forma mais inspiradora, além do rigor analítico." },
  },
  "Mentalidade Sistêmica": {
    D: { facilidade: "Condicionada", ponto: "Mapear efeitos indiretos das decisões no sistema como um todo, além do resultado direto." },
    I: { facilidade: "Condicionada", ponto: "Incluir também processos e dados na leitura do sistema, além das relações entre pessoas." },
    S: { facilidade: "Moderada", ponto: "Comunicar as interdependências percebidas para o grupo, não só observá-las." },
    C: { facilidade: "Alta", ponto: "Simplificar a comunicação da complexidade do sistema para públicos diversos." },
  },
  "Mindset Visionário": {
    D: { facilidade: "Alta", ponto: "Validar a visão de futuro com dados e com outras perspectivas." },
    I: { facilidade: "Alta", ponto: "Estruturar a visão em passos concretos e realizáveis." },
    S: { facilidade: "Condicionada", ponto: "Se permitir imaginar cenários mais ousados do que o habitual." },
    C: { facilidade: "Moderada", ponto: "Dar mais espaço à intuição e à ousadia na construção da visão de futuro." },
  },
  "Radar de Cenários": {
    D: { facilidade: "Moderada", ponto: "Ampliar o radar para sinais menos óbvios, além dos que afetam o resultado imediato." },
    I: { facilidade: "Condicionada", ponto: "Complementar a percepção do clima e das conversas com fontes objetivas de dados." },
    S: { facilidade: "Moderada", ponto: "Comunicar o que percebe antes que a mudança já esteja consolidada." },
    C: { facilidade: "Alta", ponto: "Agir mais rápido diante de sinais que já são suficientemente claros." },
  },
  "Adaptabilidade Dinâmica": {
    D: { facilidade: "Alta", ponto: "Verificar se a mudança de direção está alinhada com o time antes de segui-la." },
    I: { facilidade: "Alta", ponto: "Sustentar a adaptação com consistência ao longo do tempo, além do entusiasmo inicial." },
    S: { facilidade: "Condicionada", ponto: "Encarar a instabilidade como parte do processo, não como exceção indesejada." },
    C: { facilidade: "Condicionada", ponto: "Aceitar ajustar o processo com informação ainda incompleta." },
  },
  "Gestão da Comunicação": {
    D: { facilidade: "Moderada", ponto: "Adaptar o tom conforme quem recebe a mensagem." },
    I: { facilidade: "Alta", ponto: "Estruturar melhor a mensagem em contextos mais formais." },
    S: { facilidade: "Moderada", ponto: "Comunicar também as mensagens mais difíceis, não só as fáceis." },
    C: { facilidade: "Moderada", ponto: "Simplificar a comunicação técnica para públicos não especializados." },
  },
  "Inteligência Emocional Tática": {
    D: { facilidade: "Condicionada", ponto: "Nomear a própria emoção antes de tomar decisões em contextos de alta pressão." },
    I: { facilidade: "Moderada", ponto: "Usar a percepção emocional de forma mais deliberada nas decisões, não só intuitiva." },
    S: { facilidade: "Alta", ponto: "Usar essa mesma percepção emocional para se posicionar estrategicamente, não só para cuidar das relações." },
    C: { facilidade: "Condicionada", ponto: "Considerar o componente emocional como parte relevante da análise, além dos dados técnicos." },
  },
};
