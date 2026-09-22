import type { ModeloEmailIntegracao } from './emailCoreHelpers';

/**
 * Assinatura literal usada pelos modelos históricos do Programa de Integração.
 * Mantida centralizada para preservar o texto e evitar divergências entre modelos.
 */
export const ASSINATURA_EMAIL_INTEGRACAO =
  '\n\nQualquer dúvida, é só responder este e-mail — estamos por aqui.\n\n' +
  'Atenciosamente,\n**Equipe CKM Talents**\nParceira do Sebrae/TO no Programa de Integração';

export const AVISO_PADRAO_EMAIL_INTEGRACAO =
  '> Este e-mail refere-se ao **Programa de Integração (Onboarding) do Sebrae/TO**, conduzido pela **CKM Talents**. Vale guardar a mensagem para acompanhar as próximas etapas do processo.';

const ASS = ASSINATURA_EMAIL_INTEGRACAO;

/**
 * Primeiro lote dos MODELOS_PADRAO reconstruído literalmente a partir do HTML
 * histórico mais recente. Modelos ainda não conferidos não entram neste mapa.
 */
export const MODELOS_EMAIL_PADRAO_INTEGRACAO: Record<string, ModeloEmailIntegracao> = {
  m_ugp_controle: {
    fase: 'Antes da chegada',
    nome: 'Controle do Programa · UGP',
    para: '{{UGP}}',
    cc: '',
    assunto: '[Onboarding] Controle do Programa de Integração – {{COLABORADOR}}',
    corpo:
      'Olá, tudo bem?\n\n' +
      'Recebemos a informação da chegada de **{{COLABORADOR}}**, que inicia na unidade em **{{DATA_INICIO}}** como **{{CARGO}}**, na área **{{AREA}}**. Já estamos organizando o processo de integração por aqui.\n\n' +
      'Para abrirmos o processo formalmente e gerarmos a agenda, o PDI e as comunicações, precisamos do **Controle do Programa de Integração** preenchido:\n{{LINK_CONTROLE}}\n\n' +
      '**O que precisamos que conste no cadastro**\n' +
      '- nome completo, CPF, cargo, área e e-mail do colaborador;\n' +
      '- data do primeiro dia efetivo na unidade;\n' +
      '- nome e e-mail do gestor receptor;\n' +
      '- nome e e-mail do colaborador que será o Anjo, se já definido;\n' +
      '- tipo de processo: onboarding ou crossboarding.\n\n' +
      'Assim que recebermos, seguimos com o e-mail de orientação ao gestor (junto do formulário **Bem Acolhido em Nossa Unidade**), a preparação da agenda e a liberação do acesso do colaborador à plataforma do Ecossistema do B.E.M.\n\n' +
      'Se algum dado ainda não estiver fechado, pode nos enviar o que já tiver que a gente complementa depois.' + ASS,
    anexo: '',
  },

  m_gestor_inicio: {
    fase: 'Antes da chegada',
    nome: 'Início do processo · Gestor',
    para: '{{EMAIL_GESTOR}}',
    cc: '',
    assunto: '[Onboarding] Vamos receber {{COLABORADOR}} — início do processo de integração',
    corpo:
      'Olá {{GESTOR_1}}, tudo bem?\n\n' +
      'Somos da **CKM Talents**, parceira do Sebrae/TO no **Programa de Integração**, e vamos acompanhar de perto a chegada de **{{COLABORADOR}}** à sua equipe, que começa em **{{DATA_INICIO}}** como **{{CARGO}}**.\n\n' +
      'Nosso papel é apoiar você nesse período: cuidamos da agenda, dos alinhamentos, do Plano de Desenvolvimento e de toda a comunicação, para que a adaptação do novo colega seja tranquila para ele e leve para você.\n\n' +
      '**Como funciona o processo**\n' +
      '- A jornada dura **150 dias**, contados a partir do primeiro dia na unidade.\n' +
      '- Teremos **quatro conversas de alinhamento** — no 15º, 45º, 75º e 150º dia. Nós agendamos cada uma com você, sempre com antecedência.\n' +
      '- Depois de cada conversa, enviamos a ata e pedimos que você responda um formulário curto de avaliação.\n' +
      '- O colaborador faz a Avaliação de Potencial, a Jornada Compliance e o PDI na plataforma do Ecossistema do B.E.M., que nós liberamos.\n\n' +
      '**Datas previstas dos nossos encontros**\n' +
      '- 1º Alinhamento (15º dia): {{DATA_ALIN_1}}\n' +
      '- 2º Alinhamento (45º dia): {{DATA_ALIN_2}}\n' +
      '- 3º Alinhamento (75º dia): {{DATA_ALIN_3}}\n' +
      '- 4º Alinhamento (150º dia): {{DATA_ALIN_4}}\n\n' +
      '---\n\n' +
      '**O que precisamos de você agora**\n\n' +
      '**1. O formulário Bem Acolhido em Nossa Unidade**\n' +
      'Ele nos conta como será a recepção e o que o colaborador vai encontrar. Se ainda não tiver preenchido, é rapidinho:\n{{LINK_BEM_ACOLHIDO}}\n\n' +
      '**2. Escolher o Anjo**\n' +
      'Um colega veterano da equipe que vai acompanhar {{PRIMEIRO_NOME}} nas primeiras semanas — tirar dúvidas do dia a dia, apresentar as pessoas, ajudar com a rotina. Nos avise quem será para incluirmos no processo.\n\n' +
      '**3. Preparar a chegada**\n' +
      '- organizar uma recepção de boas-vindas com a equipe;\n' +
      '- deixar prontos mesa, cadeira, computador, acessos e materiais;\n' +
      '- avisar o time sobre a chegada do novo colega;\n' +
      '- separar contatos e informações úteis da unidade.\n\n' +
      'Uma chegada bem preparada faz muita diferença nas primeiras impressões — e a gente sabe que a correria é grande, então conte com a gente para o que precisar.' + ASS,
    anexo: '',
  },

  m_anjo_inicio: {
    fase: 'Antes da chegada',
    nome: 'Início do processo · Anjo',
    para: '{{EMAIL_ANJO}}',
    cc: '',
    assunto: '[Onboarding] Você foi escolhido(a) como Anjo de {{COLABORADOR}}',
    corpo:
      'Olá {{ANJO_1}}, tudo bem?\n\n' +
      'Somos da **CKM Talents**, parceira do Sebrae/TO no Programa de Integração, e temos uma boa notícia: **você foi indicado(a) como Anjo** de **{{COLABORADOR}}**, que começa na unidade em **{{DATA_INICIO}}**.\n\n' +
      'Ser Anjo é ser a primeira referência amigável de alguém que está chegando. Não exige preparo nem tempo extra — é sobre estar por perto nas primeiras semanas.\n\n' +
      '**Na prática, o que se espera de você**\n' +
      '- receber {{PRIMEIRO_NOME}} com atenção nos primeiros dias;\n' +
      '- apresentar as pessoas da equipe e da unidade;\n' +
      '- responder às dúvidas do dia a dia, aquelas que a pessoa hesita em levar ao gestor;\n' +
      '- ajudar a entender a rotina, os combinados e o jeito de trabalhar da casa.\n\n' +
      '**Como vamos te acompanhar**\nDepois de cada uma das quatro conversas de alinhamento (15º, 45º, 75º e 150º dia), enviamos a você um **formulário curto** para conhecer sua percepção sobre a adaptação do colega. Leva poucos minutos e é muito valioso para nós — você enxerga coisas que ninguém mais enxerga.\n\n' +
      'Ao final do período de orientação você recebe o **Certificado de Participação do Anjo**, um reconhecimento pelo apoio que deu.\n\n' +
      'Obrigado por aceitar esse papel. Ele faz uma diferença enorme para quem está começando.' + ASS,
    anexo: '',
  },

  m_anjo_inicio_ugp: {
    fase: 'Antes da chegada',
    nome: 'Início do processo · Anjo (UGP já comunicou)',
    para: '{{EMAIL_ANJO}}',
    cc: '',
    assunto: '[Onboarding] Prazer, somos a CKM — acompanharemos você e {{COLABORADOR}}',
    corpo:
      'Olá {{ANJO_1}}, tudo bem?\n\n' +
      'Somos da **CKM Talents**, parceira do Sebrae/TO no Programa de Integração. Como a **UGP já comunicou**, você será o **Anjo** de **{{COLABORADOR}}**, que começa na unidade em **{{DATA_INICIO}}** — e este e-mail é para nos apresentarmos e combinar como será o nosso contato ao longo do processo.\n\n' +
      '**Só reforçando o seu papel**\n' +
      '- receber {{PRIMEIRO_NOME}} com atenção nos primeiros dias;\n' +
      '- apresentar as pessoas da equipe e da unidade;\n' +
      '- responder às dúvidas do dia a dia, aquelas que a pessoa hesita em levar ao gestor;\n' +
      '- ajudar a entender a rotina e o jeito de trabalhar da casa.\n\n' +
      '**Como vamos te acompanhar**\nA jornada dura 150 dias e tem quatro conversas de alinhamento — no 15º, 45º, 75º e 150º dia. Depois de cada uma delas enviamos a você um **formulário curto** de avaliação, para conhecer sua percepção sobre a adaptação do colega. Leva poucos minutos.\n\n' +
      'Ao final do período de orientação você recebe o **Certificado de Participação do Anjo**.\n\n' +
      'Fica combinado assim? Se tiver qualquer dúvida sobre o papel ou sobre o programa, é só chamar.' + ASS,
    anexo: '',
  },

  m_cobranca_bem: {
    fase: 'Antes da chegada',
    nome: 'Cobrança do Bem Acolhido · Gestor',
    para: '{{EMAIL_GESTOR}}',
    cc: '',
    assunto: '[Onboarding] {{GESTOR_1}}, ainda falta o formulário Bem Acolhido de {{COLABORADOR}}',
    corpo:
      'Olá {{GESTOR_1}}, tudo bem?\n\n' +
      'Estamos acompanhando a chegada de **{{COLABORADOR}}**, prevista para **{{DATA_INICIO}}**, e vimos por aqui que o formulário **"Bem Acolhido em Nossa Unidade"** ainda não chegou até nós.\n\n' +
      'Sabemos que a rotina é corrida, então deixamos o link direto — leva poucos minutos:\n{{LINK_BEM_ACOLHIDO}}\n\n' +
      '---\n\n' +
      '**Por que este formulário faz diferença**\n' +
      '- é nele que você indica **quem será o Anjo** de {{PRIMEIRO_NOME}} — sem esse nome não conseguimos iniciar o acompanhamento com o colega veterano;\n' +
      '- ali ficam registrados os **conhecimentos, documentos e treinamentos** que a pessoa precisa dominar nos primeiros seis meses;\n' +
      '- as **tarefas que você planejou para os primeiros 15 e 60 dias** entram direto na conversa do 1º Alinhamento e na construção do **PDI de Integração**;\n' +
      '- sem essas informações, o plano de desenvolvimento sai genérico e a adaptação tende a demorar mais.\n\n' +
      '**Como isso volta para você**\nCom o formulário respondido, chegamos ao 1º Alinhamento já sabendo o que você espera do colaborador — e a conversa rende muito mais. Depois de cada ciclo, você recebe a ata e o relatório de evolução.\n\n' +
      '---\n\n' +
      'Se alguma informação ainda não estiver fechada, pode preencher com o que já tem e nos avisar que complementamos depois. E se preferir, respondemos juntos: é só dizer um horário que a gente chama você.\n\n' +
      'Ficamos no aguardo!' + ASS,
    anexo: '',
  },

  m_agenda: {
    fase: 'Primeiros dias',
    nome: 'Agenda de integração · Colaborador',
    para: '{{EMAIL_COLABORADOR}}',
    cc: '{{EMAIL_GESTOR}}; {{UGP}}',
    assunto: '[Onboarding] Bem-vindo(a) ao Sebrae/TO, {{PRIMEIRO_NOME}}! Sua agenda de integração',
    corpo:
      'Olá {{PRIMEIRO_NOME}}, tudo bem?\n\n**Seja muito bem-vindo(a) ao Sebrae/TO!** Ficamos felizes em ter você na equipe.\n\n' +
      'Somos da **CKM Talents** e vamos acompanhar você durante todo o processo de integração. Pode contar com a gente sempre que precisar — para dúvidas, para falar sobre a adaptação, para o que for.\n\n' +
      '**Em anexo está a sua Agenda de Integração**, com tudo o que acontece nos próximos meses e o que se espera de cada pessoa envolvida: você, seu gestor {{GESTOR}}, seu Anjo {{ANJO}}, a UGP e a nossa equipe.\n\n' +
      '**Como será a sua jornada**\n' +
      '- **Primeiros dias:** boas-vindas na unidade e apresentação da equipe.\n' +
      '- **3º dia:** você recebe o acesso à plataforma do Ecossistema do B.E.M., onde faz a Avaliação de Potencial e a Jornada Compliance.\n' +
      '- **Quatro conversas de alinhamento**, com você e seu gestor, para falar de expectativas, avanços e dificuldades.\n' +
      '- **PDI de Integração:** depois da primeira conversa, montamos com você um plano de desenvolvimento para o período.\n\n' +
      '**Datas previstas dos alinhamentos**\n' +
      '- 1º Alinhamento (15º dia): {{DATA_ALIN_1}}\n' +
      '- 2º Alinhamento (45º dia): {{DATA_ALIN_2}}\n' +
      '- 3º Alinhamento (75º dia): {{DATA_ALIN_3}}\n' +
      '- 4º Alinhamento (150º dia): {{DATA_ALIN_4}}\n\n' +
      'As datas são **previstas** e podem mudar conforme a agenda da unidade — confirmamos cada encontro por e-mail com antecedência.\n\n' +
      'Leia a agenda com calma e guarde para consultar durante o processo. E não se preocupe em decorar nada: vamos avisando de cada passo na hora certa.\n\n' +
      '**Desejamos um ótimo começo!**' + ASS,
    anexo: 'Agenda de Onboarding de {{COLABORADOR}}',
  },

  m_primeiros_passos: {
    fase: 'Primeiros dias',
    nome: 'Primeiros passos · Plataforma do Ecossistema do B.E.M.',
    para: '{{EMAIL_COLABORADOR}}',
    cc: '',
    assunto: '[Onboarding] {{PRIMEIRO_NOME}}, seus primeiros passos na plataforma do Ecossistema do B.E.M.',
    corpo:
      'Olá {{PRIMEIRO_NOME}}, tudo bem?\n\n' +
      'Esperamos que os primeiros dias estejam sendo tranquilos! Agora chegou o momento dos seus primeiros passos no Programa de Integração.\n\n' +
      'Tudo acontece em um lugar só: a **plataforma do Ecossistema do B.E.M.**.\n{{LINK_ECOLIDER}}\n\n' +
      '**Sobre o acesso**\nVocê vai receber um e-mail da própria plataforma com seu login e senha. Se ele não chegar em até um dia útil, dê uma olhada na caixa de **spam** — e, se mesmo assim não aparecer, é só nos avisar que liberamos de novo na hora, pelo nosso e-mail de suporte:\n{{CONTATO_CKM}}\n\n' +
      '> Em anexo vai o **Tutorial de Primeiro Acesso**, com o passo a passo em imagens: entrar na plataforma, confirmar seu cadastro, fazer a Avaliação de Potencial, encontrar os cursos obrigatórios em Meus Cursos e, mais adiante, acompanhar as tarefas do PDI.\n\n' +
      '---\n\n' +
      '**O que fazer, nesta ordem**\n\n' +
      '**1. Avaliação de Potencial**\nAssim que você abrir a plataforma, ela já leva direto para lá: primeiro você confirma os seus dados, e na sequência já entra direto na Avaliação de Potencial — não precisa procurar nada. São instrumentos que nos ajudam a conhecer melhor o seu jeito de trabalhar, seus pontos fortes e suas expectativas. Não existe resposta certa ou errada, e nada disso é avaliação de desempenho — é sobre te conhecer. O resultado vira a base do seu PDI, que montamos juntos no 1º Alinhamento.\n\n' +
      '**2. Jornada Compliance e cursos obrigatórios**\nAssim que você terminar a Avaliação de Potencial, a **Jornada Compliance é liberada automaticamente** na mesma plataforma e você já pode começar. Ela fica em **Meus Cursos**, junto dos cursos institucionais obrigatórios. Dá para fazer aos poucos, no seu ritmo, ao longo do período de integração; se ficar alguma dúvida, é só nos perguntar.\n\n' +
      '**3. PDI de Integração**\nO seu **Plano de Desenvolvimento Individual** é montado com você no nosso 1º Alinhamento. Mais para frente, ele vai passar a ficar disponível neste mesmo sistema, em **Performance → Tarefas**. Assim que estiver liberado, avisamos por e-mail, com o passo a passo de como abrir, o que fazer em cada ação e como registrar o que foi concluído.\n\n' +
      '---\n\n' +
      'Vamos acompanhar seu progresso ao longo dos alinhamentos, dentro dos prazos combinados em cada etapa — o objetivo é te apoiar nesse processo.\n\n' +
      'Qualquer dificuldade de acesso ou dúvida sobre as atividades, fale com a gente.' + ASS,
    anexo: 'Tutorial de Primeiro Acesso (PDF)',
  },

  m_confirma_acesso: {
    fase: 'Primeiros dias',
    nome: 'Confirmar acesso · Plataforma do Ecossistema do B.E.M. · Colaborador',
    para: '{{EMAIL_COLABORADOR}}',
    cc: '',
    assunto: '[Onboarding] {{PRIMEIRO_NOME}}, deu tudo certo para acessar a plataforma?',
    corpo:
      'Olá {{PRIMEIRO_NOME}}, tudo bem?\n\n' +
      'Só passando para confirmar: o e-mail com o seu login e senha da **plataforma do Ecossistema do B.E.M.** chegou certinho, e você já conseguiu entrar?\n{{LINK_ECOLIDER}}\n\n' +
      '**Se deu tudo certo**, ótimo! Pode seguir com a Avaliação de Potencial — ela é o primeiro passo por lá, como te explicamos no e-mail anterior.\n\n' +
      '**Se o e-mail não chegou, ou se você tentou entrar e não conseguiu** (por exemplo, senha não reconhecida, ou nenhum e-mail apareceu nem na caixa de spam), é só responder esta mensagem ou falar com a gente por aqui:\n{{CONTATO_CKM}}\n\nLiberamos o acesso de novo na hora.\n\n' +
      'Qualquer dúvida, também é só chamar.' + ASS,
    anexo: '',
  },

  m_primeiros_registros: {
    fase: 'Primeiros dias',
    nome: 'Registros dos primeiros dias · Gestor, Anjo e Colaborador',
    para: '{{EMAIL_GESTOR}}; {{EMAIL_ANJO}}; {{EMAIL_COLABORADOR}}',
    cc: '',
    assunto: '[Onboarding] {{COLABORADOR}} — algum registro dos primeiros dias para guardarmos no processo?',
    corpo:
      'Olá, tudo bem?\n\n' +
      '**{{COLABORADOR}}** já está completando a primeira semana na unidade, e passamos aqui com um pedido rápido para os três: **{{GESTOR_1}}**, **{{ANJO_1}}** e **{{PRIMEIRO_NOME}}**.\n\n' +
      'Se durante a recepção e esses primeiros dias vocês tiraram alguma **foto do momento de boas-vindas**, guardaram algum **material que foi entregue** (kit, crachá, etc.) ou têm qualquer outro **registro dessa fase** — nada obrigatório, só o que já existir por aí — pode nos encaminhar respondendo este e-mail.\n\n' +
      '**Por que pedimos isso**\nGostamos de manter um registro simples de como foi a chegada de cada pessoa, para documentar o processo de integração e, quando fizer sentido, usar depois como memória do time.\n\n' +
      '**Se não tiver nada guardado, sem problema nenhum** — é só ignorar este e-mail ou nos avisar que não há registros desta vez. Não é uma cobrança, é só um convite para compartilhar caso exista algo.\n\n' +
      'Obrigado desde já!' + ASS,
    anexo: '',
  },
};

export const ORDEM_EMAILS_INTEGRACAO = [
  'm_ugp_controle', 'm_gestor_inicio', 'm_cobranca_bem', 'm_anjo_inicio', 'm_anjo_inicio_ugp',
  'm_agenda', 'm_primeiros_passos', 'm_confirma_acesso', 'm_primeiros_registros',
  'm_agendamento_1', 'm_confirmacao_agendamento_1', 'm_agendamento_2', 'm_agendamento_3', 'm_agendamento_4',
  'm_pos1_colab', 'm_pos1_gestor', 'm_pos1_ugp', 'm_pos1_anjo',
  'm_pos2_colab', 'm_pos2_gestor', 'm_pos2_ugp', 'm_pos2_anjo',
  'm_agradecimento_anjo',
  'm_pos3_colab', 'm_pos3_gestor', 'm_pos3_ugp', 'm_pos3_anjo', 'm_reconhecimento_anjo', 'm_compliance_ugp',
  'm_pos4_colab', 'm_pos4_gestor', 'm_pos4_ugp', 'm_pos4_anjo',
] as const;
