export type PublicQuestionType = 'text' | 'textarea' | 'date' | 'cpf' | 'tel' | 'select' | 'scale' | 'multi';
export type PublicQuestion = { code: string; label: string; type: PublicQuestionType; required?: boolean; options?: Array<string | { value: string; label: string }>; hint?: string };
export type PublicSection = { title: string; intro?: string; questions: PublicQuestion[] };
export type PublicFormCatalog = {
  key: 'controle' | 'bem' | 'pesquisa' | 'aval' | 'pdi';
  slug: 'controle-integracao' | 'bem-acolhido' | 'pesquisa-integracao' | 'avaliacao-programa' | 'acompanhamento-pdi';
  name: string;
  description: string;
  targetRole: string;
  intro: string[];
  outro?: string[];
  identity: { unidade?: boolean; dataInicio?: boolean; email?: boolean; respondent?: boolean; cycle?: boolean; role?: boolean };
  cycleOptions?: Array<{ value: string; cycle: number; label: string }>;
  sections: PublicSection[];
};

export const UNIDADES_INTEGRACAO = ['UAS','UMC','UGE','URI','UAC','UAR','UTIC','UCI','AUD','UGOC','UGP','CDE','RBP','RMN','RVA','RME','RNO','RPJ','RSG','RSU','RSE','URC','Regional Norte','Regional Bico do Papagaio','Outras Regionais'];
export const QUALIDADES_BEM = ['Animado','Atencioso','Ativo','Audaz','Autêntico','Autoconfiante','Autoritário','Calado','Calmo','Carismático','Cativante','Competitivo','Compreensivo','Convincente','Corajoso','Cortês','Criativo','Decidido','Desconfiado','Destemido','Diplomático','Direto','Disciplinado','Dócil','Egoísta','Empreendedor','Encantador','Enérgico','Entusiasta','Envergonhado','Envolvente','Esclarecido','Espontâneo','Extrovertido','Firme','Flexível','Formal','Generoso','Gentil','Humilde','Impaciente','Influente','Irreverente','Leal','Livre','Meticuloso','Original','Ousado','Paciente','Pacífico','Passivo','Perfeccionista','Persistente','Persuasivo','Preocupado','Proativo','Prudente','Querido','Realista','Receoso','Respeitoso','Retraído','Satisfeito','Saudável','Sensato','Sensível','Sério','Simpático','Simples','Sociável','Sossegado','Suave','Teimoso','Tímido','Tolerante','Tradicional','Versátil'];

const scale = (code: string, label: string): PublicQuestion => ({ code, label, type: 'scale', required: true });
const text = (code: string, label: string, required = true, hint?: string): PublicQuestion => ({ code, label, type: label.length > 70 ? 'textarea' : 'text', required, hint });

export const PUBLIC_FORM_CATALOG: Record<PublicFormCatalog['slug'], PublicFormCatalog> = {
  'controle-integracao': {
    key:'controle', slug:'controle-integracao', name:'Controle do Programa de Integração', description:'Cadastro do novo colaborador, preenchido pela UGP.', targetRole:'UGP',
    intro:['Olá equipe do Núcleo de Desenvolvimento,','Esse cadastro é pra gente colocar os dados importantes do novo contratado que vão ser usados na Avaliação das Competências.','Só pra dar um toque, é bom preencher isso com no mínimo 7 dias de antecedência, pra dar tempo pro responsável pela avaliação se preparar direitinho.','Unidade de Gestão de Pessoas - UGP'],
    outro:['Gestor(a),','Parabéns por concluir o preenchimento do formulário! Suas respostas serão enviadas para a empresa responsável pela avaliação de perfil.','Agora, para complementar esses dados também será necessário o preenchimento do Formulário Bem Acolhido em nossa unidade, pelo gestor que estará recebendo o novo contratado.','Um abraço!','Núcleo de Desenvolvimento - UGP'],
    identity:{unidade:true,dataInicio:true,email:true,respondent:true},
    sections:[
      {title:'Dados complementares',questions:[
        {code:'controle_cpf',label:'Número do CPF do colaborador:',type:'cpf',required:true},
        {code:'controle_nascimento',label:'Data de Nascimento do colaborador:',type:'date',required:false},
        {code:'controle_telefone',label:'Número de telefone do Novo Colaborador (WhatsApp):',type:'tel',required:false,hint:'Somente números, com DDD (ex.: 63999998888).'},
        {code:'controle_denominacao',label:'Qual a denominação do novo contratado dentro do Programa de Integração?',type:'select',required:false,options:['Onboarding','Crossboarding','Estagiário']},
      ]},
      {title:'Dados principais',questions:[text('controle_funcao','Função do novo colaborador:',true,'Descreva brevemente a função (cargo) do colaborador.'),text('controle_gestor','Nome do Gestor Responsável:')]},
      {title:'Descrição da função',questions:[text('controle_descricao_funcao','De acordo com a contratação realizada, qual a descrição da função do novo contratado?')]},
    ],
  },
  'bem-acolhido': {
    key:'bem', slug:'bem-acolhido', name:'Bem Acolhido em Nossa Unidade', description:'Preparação da chegada, respondida pelo gestor. Traz o Anjo escolhido e o que foi planejado para os primeiros 15 e 60 dias.', targetRole:'Gestor',
    intro:['Oi, gestor(a)!','Estamos precisando da sua ajuda para preencher um formulário bem legal. Ele serve para coletar informações sobre o perfil ideal para a vaga que o novo contratado vai ocupar no seu departamento, além de detalhar as atividades que ele vai realizar nos primeiros 30 dias.','Sabe por que é tão importante preencher esse formulário? Bom, ele vai ser a base para avaliar as habilidades do novo contratado, criar um plano de desenvolvimento personalizado e também ajudar na avaliação das entregas de tarefas e no feedback do Programa Onboarding.','Queremos garantir que tudo corra bem e que o novo membro da equipe tenha um início promissor. Por isso, pedimos que reserve um tempinho para preencher o formulário. Todos os itens são importantes e vão direcionar todo o processo de avaliação.','Contamos com a sua colaboração para construir um ambiente de trabalho incrível e contribuir para o sucesso do novo integrante da equipe. Ah, e pode ficar tranquilo(a), estamos aqui para te ajudar caso surjam dúvidas durante o preenchimento.','Valeu por participar e obrigado(a) pela sua atenção!','Unidade de Gestão de Pessoas - UGP'],
    outro:['Gestor(a),','Parabéns por concluir o preenchimento do formulário! Suas respostas serão enviadas para a empresa responsável pela avaliação de perfil, para o Núcleo de Desenvolvimento - UGP e também serão documentadas no processo do Programa de Integração.','Agora, vamos avançar juntos para a próxima etapa: preparar uma recepção calorosa para o novo colaborador.','Um abraço!','CKM Talents e Núcleo de Desenvolvimento - UGP SEBRAE Tocantins'],
    identity:{unidade:true,dataInicio:true,respondent:true},
    sections:[
      {title:'Dados principais',questions:[text('bem_funcao','Função do novo colaborador:'),text('bem_anjo','Nome do Anjo Veterano escolhido para acompanhar o novo colaborador:',true,'A função do Anjo Veterano pode ser consultada no Anexo VI.')]},
      {title:'Perfil',questions:[{code:'bem_caracteristicas',label:'Dentre as palavras abaixo, assinale TODAS as palavras que representam como colaborador deve atuar na sua unidade:',type:'multi',required:true,options:QUALIDADES_BEM}]},
      {title:'Conhecimentos',questions:[text('bem_conhecimentos_tecnicos','Liste os conhecimentos técnicos imprescindíveis para uma atuação de 6 meses:',true,'Informe os conhecimentos técnicos que a pessoa precisa aprender ou dominar para exercer a função. Ex.: sistemas, ferramentas, procedimentos ou conhecimentos específicos da área.'),text('bem_documentos_treinamentos','Liste os documentos, manuais e treinamentos da UC/Sebrae/TO relacionados à unidade que são imprescindíveis para uma atuação adequada nos primeiros 6 meses.'),text('bem_treinamentos_uc','Treinamentos UC/Sebrae/TO imprescindíveis:',false,'Informe os treinamentos e capacitações oferecidos pela UC/Sebrae/TO que são essenciais para o desempenho adequado da função.')]},
      {title:'Planejamento de atividades/demandas',questions:[text('bem_primeiros_15_dias','Primeiros 15 dias: Descreva as principais tarefas e demandas planejadas para os primeiros 15 dias do recém-contratado, considerando as atividades iniciais necessárias para conhecer a rotina, a equipe, os processos e começar a atuar na função.'),text('bem_primeiros_60_dias','Primeiros 60 dias: Descreva as tarefas, demandas e entregas planejadas para os primeiros 60 dias do recém-contratado, incluindo as atividades que ele deverá desenvolver, acompanhar ou começar a assumir com maior autonomia ao longo desse período.')]},
    ],
  },
  'pesquisa-integracao': {
    key:'pesquisa', slug:'pesquisa-integracao', name:'Pesquisa de Integração', description:'Respondida pelo colaborador depois de cada alinhamento.', targetRole:'Colaborador',
    intro:['Oi, colaborador(a)!','Queremos ouvir sua opinião sobre sua experiência aqui no Sebrae/TO e como tem sido seu processo de integração. Para isso, preparamos esta pesquisa rápida e fácil de responder.','Sua opinião é muito valiosa para nós! Queremos garantir que você se sinta pertencente ao Sebrae/TO, que tenha orgulho do seu trabalho e que possa progredir profissionalmente.','Obrigado pela colaboração e estamos ansiosos para receber seu feedback! Unidade de Gestão de Pessoas - UGP · Núcleo de Desenvolvimento'],
    outro:['Você arrasou! Pesquisa concluída!','Valeu por ter reservado um tempinho para responder nossas perguntas. Sua opinião é mega importante para nós.','Agradecemos pela sua colaboração e por ser parte da nossa equipe. Você faz toda a diferença!','Abraços,','Unidade de Gestão de Pessoas - UGP','Núcleo de Desenvolvimento'],
    identity:{unidade:true,cycle:true},
    cycleOptions:[{value:'15',cycle:1,label:'15º dia (Minha primeira resposta)'},{value:'45',cycle:2,label:'45º dia'},{value:'60',cycle:4,label:'60º dia (Somente para participantes do Crossboarding)'},{value:'75',cycle:3,label:'75º dia'},{value:'150',cycle:4,label:'150º dia'}],
    sections:[
      {title:'Programa',questions:[{code:'pesquisa_programa',label:'Qual o seu programa?',type:'select',required:true,options:[{value:'Onboarding',label:'Onboarding - (Recém-Contratado do Sebrae/TO)'},'Crossboarding']}]},
      {title:'Cultura e pertencimento',questions:[scale('pesquisa_cultura_valores','A cultura do Sebrae/TO está alinhada aos meus valores.'),scale('pesquisa_pertencimento','Me sinto pertencente à empresa.'),scale('pesquisa_dia_a_dia','O dia a dia de trabalho é agradável para mim.'),scale('pesquisa_orgulho','Trabalhar aqui é motivo de orgulho para mim.'),scale('pesquisa_importancia_atividades','Entendo a importância das minhas atividades para os objetivos do Sebrae.')]},
      {title:'Anjo e colegas',questions:[scale('pesquisa_anjo_ajuda','O "Anjo" tem ajudado muito no meu progresso profissional.'),scale('pesquisa_conforto_colegas','Me sinto confortável com os meus colegas de trabalho.'),scale('pesquisa_confianca_colegas','Confio nos meus colegas de trabalho.'),scale('pesquisa_ajuda_colegas','Os meus colegas de trabalho me ajudam quando há necessidade.'),scale('pesquisa_lacos_amizade','Criei laços de amizade aqui no Sebrae/TO.')]},
      {title:'Gestão',questions:[scale('pesquisa_gestor_clareza','O meu gestor é claro nas funções que delega.'),scale('pesquisa_comunicacao_transparente','A comunicação entre gestor e funcionários é transparente.'),scale('pesquisa_gestor_incentivo','Acredito que o meu gestor me incentiva a aprender cada dia mais.')]},
      {title:'Trabalho e desenvolvimento',questions:[scale('pesquisa_satisfacao_funcoes','Estou satisfeito com as funções desempenhadas no meu dia a dia.'),scale('pesquisa_sobrecarga','Me sinto sobrecarregado com as minhas atividades.'),scale('pesquisa_conhecimento_tecnico','Já estou atuando com o conhecimento técnico que possuo.'),scale('pesquisa_busca_apoio','Busco informações e apoio técnico para atividades complexas.'),scale('pesquisa_propoe_melhorias','Já consigo propor melhorias no meu processo de trabalho.'),scale('pesquisa_cooperacao_equipe','Contribuo de forma cooperativa na realização das atividades da equipe.'),scale('pesquisa_progresso_pdi','Estou progredindo no meu plano de desenvolvimento Onboarding/Crossboarding.')]},
    ],
  },
  'avaliacao-programa': {
    key:'aval', slug:'avaliacao-programa', name:'Avaliação do Programa de Integração', description:'Respondida pelo gestor e pelo Anjo depois de cada alinhamento.', targetRole:'Gestor / Anjo',
    intro:['Olá Gestor e Anjo!','Gostaríamos de solicitar sua contribuição preenchendo este formulário com o intuito de obter sua percepção sobre o novo colaborador que está atualmente participando do Programa de Integração.','Essa percepção será utilizada para alinhar ações e registrar o período de experiência do colaborador em questão no controle interno do Sebrae/TO.','Atenciosamente, Unidade de Gestão de Pessoas - UGP · Núcleo de Desenvolvimento.'],
    outro:['Você arrasou! Pesquisa concluída!','Valeu por ter reservado um tempinho para responder nossas perguntas. Sua opinião é mega importante para nós.','Agradecemos pela sua colaboração e por ser parte da nossa equipe.','Unidade de Gestão de Pessoas - UGP · Núcleo de Desenvolvimento'],
    identity:{cycle:true,role:true,respondent:true},
    cycleOptions:[{value:'1',cycle:1,label:'1º Feedback'},{value:'2',cycle:2,label:'2º Feedback'},{value:'3',cycle:3,label:'3º Feedback'},{value:'4',cycle:4,label:'4º Feedback'}],
    sections:[
      {title:'Adaptação ao trabalho',questions:[scale('aval_compromissos','Cumpre os compromissos assumidos, inclusive o seu horário de trabalho.'),scale('aval_parceria','Estabelece relação de parceria com as pessoas, viabilizando o alcance das metas da Unidade.'),scale('aval_compartilha_informacoes','Compartilha informações e experiências que contribuam para o desempenho da equipe.'),scale('aval_persistencia','Demonstra persistência para atingir os objetivos, superando obstáculos.'),scale('aval_interesse_entusiasmo','Expressa interesse, entusiasmo e envolvimento com suas atividades.'),scale('aval_expressao','Expressa-se de forma lógica, fluente e objetiva, na comunicação oral e escrita.')]},
      {title:'Conduta ética',questions:[scale('aval_padroes_eticos','Atua com base em padrões éticos definidos pelo Sebrae/TO e pela sociedade.'),scale('aval_transparencia','Age com transparência, responsabilidade e honestidade nas suas decisões e relacionamentos profissionais.'),scale('aval_respeito','Trata as pessoas com respeito, cortesia e sem preconceitos relacionados à origem, raça, sexo, cor, idade, religião, credo, classe social e limitação física.')]},
      {title:'Segurança da informação',questions:[scale('aval_sigilo','Mantém sigilo das informações às quais tem acesso pelo exercício profissional no Sebrae/TO.'),scale('aval_consistencia_informacoes','Zela pela consistência das informações geradas.'),scale('aval_analise_decisao','Analisa as informações e seleciona aquelas relevantes para tomada de decisão.')]},
      {title:'Postura no trabalho',questions:[scale('aval_conhecimento_tecnico','Domina e aplica conhecimentos técnicos na sua área de atuação.'),scale('aval_conhecimento_pratica','Revela, na sua prática profissional, o conhecimento técnico que possui.'),scale('aval_atividades_previstas','Coloca em prática as atividades previstas para o seu cargo, com base nas normas internas.'),scale('aval_apoio_tecnico','Busca informações e apoio técnico para atividades complexas.'),scale('aval_interpretacao','Interpreta as informações adequadamente para a realização de suas responsabilidades.'),scale('aval_melhorias','Propõe melhorias no seu processo de trabalho.')]},
      {title:'Trabalho em equipe',questions:[scale('aval_participa_discussoes','Participa das discussões em equipe, ouvindo com atenção as pessoas e emitindo sua opinião.'),scale('aval_cooperacao','Contribui de forma cooperativa na realização das atividades da equipe.'),scale('aval_clareza_ideias','Transmite suas ideias com clareza.'),scale('aval_aceita_pontos_vista','Aceita os diferentes pontos de vista das pessoas.'),scale('aval_articulacao','Articula-se com facilidade com pessoas de sua área, de outras áreas e com parceiros externos.'),scale('aval_postura_equipe','Mantém postura que agrega valor à equipe.')]},
      {title:'Qualidade do trabalho',questions:[scale('aval_foco_resultados','Foca o seu trabalho nas atividades e resultados estabelecidos para o seu cargo.'),scale('aval_cumpre_prazos','Cumpre prazos em relação às demandas cotidianas.'),scale('aval_cumpre_metas','Cumpre metas específicas, relacionadas com o seu campo de atuação.'),scale('aval_prioridades','Direciona o seu esforço em função das prioridades.'),scale('aval_parcerias','Estabelece parcerias alinhadas aos objetivos.'),scale('aval_qualidade','Finaliza as atividades sob sua responsabilidade, com a qualidade desejada.'),scale('aval_postura_critica','Mantém uma postura crítica e objetiva em suas análises e proposições.'),scale('aval_tempo_resposta','Atua de forma a reduzir o tempo de resposta das atividades que executa.')]},
      {title:'Conceitos e devolutiva',questions:[
        {code:'aval_desenvolvimento_conceito',label:'DESENVOLVIMENTO (conceito)',type:'select',required:true,hint:'Considerar de uma maneira geral, a evolução e aplicabilidade do colaborador no dia-a-dia.',options:['100% - Excelente progresso e altos índices de desenvolvimento e aplicabilidade à função.','75% - Apresenta bom índice de desenvolvimento, demonstrando interesse e condições de aplicabilidade à função.','50% - Esforça-se, porém está encontrando dificuldades em desenvolver-se e aplicar os conhecimentos na função.','25% - Realiza as atividades por obrigação.','0% - Não apresentou interesse e progresso.']},
        {code:'aval_produtividade_conceito',label:'PRODUTIVIDADE (conceito)',type:'select',required:true,hint:'Considerar o volume de trabalho executado em função do tempo gasto.',options:['100% - Consegue atingir altos índices de produtividade.','75% - Adequada produtividade para o período.','50% - Produtividade baixa, entretanto se esforça para melhorar.','25% - Produtividade insuficiente. Apresenta interesse, mas tem encontrado dificuldades nas ações.','0% - Produtividade insuficiente. Não se esforça para melhorar.']},
        {code:'aval_conceito_geral',label:'CONCEITO GERAL',type:'select',required:true,hint:'Considerar o período de trabalho e o tempo ainda no Programa de Integração.',options:['100% - EXCELENTE - É uma excelente aquisição para o SEBRAE/TO.','75% - MUITO BOM - Possui ótimas perspectivas para o futuro.','50% - SATISFATÓRIO - Tem algumas possibilidades, com o desenvolvimento de algumas competências.','25% - ADEQUADO - Precisa de um trabalho de desenvolvimento e acompanhamento.','0% - INADEQUADO - Poucas possibilidades futuras.']},
      ]},
      {title:'Devolutiva',questions:[text('aval_potencialidades','Quais comportamentos/competências de potencialidade que o novo colaborador apresenta?'),text('aval_menos_favoraveis','Quais comportamentos/competências menos favoráveis que o novo colaborador está apresentando?'),text('aval_orientacoes_desenvolvimento','Quais orientações foram dadas ao novo colaborador para desenvolvimento?'),text('aval_reacao_feedback','Qual foi a reação que o novo colaborador teve no feedback? (Somente Gestor)',false,'Esta pergunta se aplica apenas quando quem está respondendo é o Gestor.')]},
    ],
  },
  'acompanhamento-pdi': {
    key:'pdi', slug:'acompanhamento-pdi', name:'Acompanhamento do PDI', description:'Preenchido pela CKM e enviado à UGP no 45º e no 150º dia.', targetRole:'CKM',
    intro:['Olá Núcleo de Desenvolvimento,','Este formulário desempenha um papel fundamental na avaliação do progresso dos colaboradores no âmbito do Programa de Integração.'],
    identity:{unidade:true,respondent:true,cycle:true},
    cycleOptions:[{value:'2',cycle:2,label:'45º dia'},{value:'60',cycle:4,label:'60º dia (Crossboarding - finalização)'},{value:'150',cycle:4,label:'150º dia (Onboarding - finalização)'}],
    sections:[
      {title:'Dados principais',questions:[{code:'pdi_programa',label:'Qual o programa de integração o avaliado faz parte?',type:'select',required:true,options:['Onboarding','Crossboarding']},{code:'pdi_data_avaliacao',label:'Data desta avaliação:',type:'date',required:true},{code:'pdi_periodo',label:'Esse acompanhamento se refere a qual período do Programa de Integração:',type:'select',required:true,options:['45º dia (Onboarding e Crossboarding)','60º dia (Crossboarding - Finalização)','150º dia (Onboarding - Finalização)']}]},
      {title:'Acompanhamento',questions:[
        {code:'pdi_concluiu_no_prazo',label:'Com relação às ações para desenvolvimento elencadas no PDI, o novo colaborador conseguiu concluir alguma ação no prazo estipulado?',type:'select',required:true,options:['SIM','NÃO','Ainda está dentro do prazo estipulado']},
        {code:'pdi_relatou_dificuldade',label:'Existe alguma ação em que o novo colaborador relatou dificuldade em executar?',type:'select',required:true,options:['Sim','Não']},
        text('pdi_qual_acao_motivo','Se a resposta anterior for sim, qual ação? E qual o motivo alegado?',false),
        {code:'pdi_percentual_execucao',label:'Na sua avaliação, quantos % o novo colaborador atingiu de execução do PDI?',type:'select',required:true,options:['0%','25%','50%','75%','100%']},
        {code:'pdi_houve_readequacao',label:'Na reunião de acompanhamento, referente ao 45º dia foi necessária readequação no Plano de Desenvolvimento do Programa de Integração?',type:'select',required:true,options:['Sim','Não']},
        text('pdi_qual_alteracao','Se a resposta anterior for sim, qual foi a alteração?',false),
        {code:'pdi_percentual_jornada_compliance',label:'Na sua avaliação, quantos % o novo colaborador atingiu de execução da Jornada Compliance?',type:'select',required:true,options:['0%','25%','50%','75%','100%']},
        {code:'pdi_realinhamento_postura',label:'Foi necessário realinhamento sobre a postura profissional do novo colaborador?',type:'select',required:true,options:['Sim','Não']},
        text('pdi_qual_realinhamento','Se a resposta anterior for sim, qual realinhamento foi sugerido?',false),
      ]},
    ],
  },
};

export const DICAS_ESCALA = [
  'Leia cada pergunta com calma, sem pressa.',
  'Seja sincero(a) e diga o que realmente pensa.',
  'Se uma afirmação não fizer muito sentido para você, você pode marcar que não tem opinião sobre.',
  'Lembre-se, é tudo confidencial, então fique à vontade para se expressar.',
  'Se bater alguma dúvida, é só nos chamar!',
];

export const LEGENDA_ESCALA = [
  '1 - Discordo totalmente',
  '2 - Discordo',
  '3 - Não concordo nem discordo',
  '4 - Concordo',
  '5 - Concordo totalmente',
  '0 - Ainda não tenho opinião sobre',
];

export function optionValueLabel(option: string | { value: string; label: string }): { value: string; label: string } {
  return typeof option === 'string' ? { value: option, label: option } : option;
}
