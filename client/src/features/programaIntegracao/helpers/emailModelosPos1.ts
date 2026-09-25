import type { ModeloEmailIntegracao } from './emailCoreHelpers';
import { ASSINATURA_EMAIL_INTEGRACAO } from './emailModelosPadrao';

export const LEMBRETE_CURSOS_EMAIL_INTEGRACAO =
  '---\n\n' +
  '**Sobre a Jornada Compliance e os cursos obrigatórios**\n' +
  'Se você já estiver em dia com isso, ótimo — pode desconsiderar este lembrete. Se ainda não deu tempo de começar, sem problema: ' +
  'vale reservar alguns momentos na agenda daqui pra frente.\n' +
  '- A **Jornada Compliance** e os **cursos institucionais obrigatórios** fazem parte do seu período de integração.\n' +
  '- Eles ficam em **Meus Cursos**, na plataforma:\n{{LINK_ECOLIDER}}\n' +
  '- Se ficar qualquer dúvida sobre como acessar ou concluir, é só nos perguntar que a gente explica.\n\n' +
  'A ideia não é acumular tudo no fim: um pouco por semana costuma ser bem mais tranquilo.';

export const TEXTO_PESQUISA_EMAIL_INTEGRACAO =
  'Queremos ouvir a sua opinião sobre a sua experiência no Sebrae/TO e sobre como tem sido o seu processo de integração. ' +
  'Para isso, preparamos esta **pesquisa rápida e fácil de responder**: queremos saber o que você pensa sobre diferentes aspectos, ' +
  'desde a cultura da empresa até o seu relacionamento com colegas e gestores.';

const ASS = ASSINATURA_EMAIL_INTEGRACAO;
const TXT_PESQUISA = TEXTO_PESQUISA_EMAIL_INTEGRACAO;
const LEMBRETE_CURSOS = LEMBRETE_CURSOS_EMAIL_INTEGRACAO;

/** Modelos literais do bloco “Pós 1º Alinhamento” do HTML histórico mais recente. */
export const MODELOS_EMAIL_POS1_INTEGRACAO: Record<string, ModeloEmailIntegracao> = {
  m_pos1_colab: {
    fase: 'Pós 1º Alinhamento',
    nome: 'PDI disponível · Colaborador',
    para: '{{EMAIL_COLABORADOR}}',
    cc: '',
    assunto: '[Onboarding] {{PRIMEIRO_NOME}}, seu PDI de Integração já está disponível',
    corpo:
      'Olá {{PRIMEIRO_NOME}}, tudo bem?\n\n' +
      'Obrigado pela conversa em **{{DATA_ALIN_1}}** — foi ótimo ouvir como estão sendo esses primeiros dias.\n\n' +
      'A partir do que conversamos com você e com {{GESTOR}}, montamos o seu **PDI de Integração**. Ele já está disponível na plataforma do Ecossistema do B.E.M.\n\n' +
      '**Como acessar**\n' +
      '- Entre na plataforma: {{LINK_ECOLIDER}}\n' +
      '- Use o mesmo login que você recebeu no início do processo.\n' +
      '- Abra a área do **PDI de Integração**: lá estão as ações combinadas, os prazos de cada uma e o espaço para registrar o que já foi feito.\n\n' +
      '**Como funciona daqui pra frente**\nO plano não é uma lista de cobranças — são ações pensadas para apoiar o seu desenvolvimento neste período. Algumas pedem uma evidência simples: um registro, um documento, um breve relato. Vá fazendo no seu ritmo, dentro dos prazos, e acompanhamos juntos nas próximas conversas.\n\n' +
      'Seu gestor também tem acesso ao plano, para poder apoiar você no dia a dia.\n\n' +
      '---\n\n' +
      '**Uma última coisa, rapidinha**\n' +
      TXT_PESQUISA +
      '\n\nO preenchimento é **obrigatório** e leva poucos minutos:\n{{LINK_PESQUISA}}\n\n' +
      LEMBRETE_CURSOS +
      ASS,
    anexo: '',
  },

  m_pos1_gestor: {
    fase: 'Pós 1º Alinhamento',
    nome: '1º Alinhamento · Gestor',
    para: '{{EMAIL_GESTOR}}',
    cc: '',
    assunto: '[Onboarding] 1º Alinhamento de {{COLABORADOR}} — ata, PDI e um pedido',
    corpo:
      'Olá {{GESTOR_1}}, tudo bem?\n\n' +
      'Obrigado pelo tempo e pela abertura na nossa conversa de **{{DATA_ALIN_1}}**. Suas percepções foram fundamentais para desenhar o plano de desenvolvimento de {{PRIMEIRO_NOME}}.\n\n' +
      '**Segue em anexo a ata** do alinhamento, com o que foi conversado e os pontos combinados.\n\n' +
      '**O PDI de Integração já está publicado** na plataforma do Ecossistema do B.E.M.\n\n' +
      '**Você pode escolher como prefere acompanhar**\n' +
      '- Se quiser acompanhar a evolução do processo, as ações do PDI e a situação dos formulários/preenchimentos, acesse o EcoLíder:\n{{LINK_ECOLIDER}}\n' +
      '- Entre com o seu **e-mail e CPF**. Se o seu acesso ainda não estiver habilitado, ou se tiver qualquer dúvida para entrar, é só nos avisar que ajudamos.\n' +
      '- Se preferir apenas responder o formulário deste ciclo, não precisa entrar na plataforma: você pode usar diretamente o link abaixo.\n\n' +
      'Nos próximos ciclos vamos revisitar esse plano com você — se em algum momento achar que faz sentido ajustar alguma ação, é só nos dizer.\n\n' +
      '---\n\n' +
      '**Um pedido rápido — formulário obrigatório**\nPara registrarmos sua avaliação deste primeiro ciclo, o preenchimento do **Formulário de Avaliação do Programa de Integração** é obrigatório. Você pode responder diretamente por este link, **sem precisar fazer login**:\n{{LINK_AVAL_PROGRAMA}}\n\n' +
      'São poucos minutos, e é com base nele que conseguimos preparar o relatório de evolução do colaborador para as próximas conversas.\n\n' +
      'Obrigado pela parceria!' + ASS,
    anexo: 'Ata do 1º Alinhamento',
  },

  m_pos1_ugp: {
    fase: 'Pós 1º Alinhamento',
    nome: '1º Alinhamento · UGP',
    para: '{{UGP}}',
    cc: '',
    assunto: '[Onboarding] 1º Alinhamento – {{COLABORADOR}}',
    corpo:
      'Olá, tudo bem?\n\n' +
      'Realizamos o **1º Alinhamento** do Onboarding de **{{COLABORADOR}}** com {{GESTOR}} em **{{DATA_ALIN_1}}**. Seguem os materiais para acompanhamento, conforme o fluxo do programa.\n\n' +
      '- **Ata do 1º Alinhamento** — em anexo;\n' +
      '- **Relatório completo do alinhamento** — em anexo;\n' +
      '- **Avaliação de Potencial consolidada** — em anexo;\n' +
      '- **PDI de Integração** — publicado na plataforma do Ecossistema do B.E.M.;\n' +
      '- **Formulário Bem Acolhido em Nossa Unidade** — {{STATUS_PDI}}.\n\n' +
      'O colaborador já recebeu as orientações de acesso ao PDI e a gestão foi comunicada para acompanhamento. Os formulários deste ciclo foram encaminhados ao colaborador, ao gestor e ao Anjo.\n\n' +
      'Ficamos à disposição para qualquer esclarecimento.' + ASS,
    anexo: 'Ata do 1º Alinhamento; Relatório completo; Avaliação de Potencial consolidada',
  },

  m_pos1_anjo: {
    fase: 'Pós 1º Alinhamento',
    nome: '1º Alinhamento · Anjo',
    para: '{{EMAIL_ANJO}}',
    cc: '',
    assunto: '[Onboarding] Como está sendo acompanhar {{PRIMEIRO_NOME}}?',
    corpo:
      'Olá {{ANJO_1}}, tudo bem?\n\n' +
      'Fizemos há pouco o **1º Alinhamento** do processo de integração de **{{COLABORADOR}}**, e agora gostaríamos de ouvir você.\n\n' +
      'Como Anjo, você acompanha o dia a dia de perto e enxerga coisas que não aparecem numa conversa formal: como {{PRIMEIRO_NOME}} está se enturmando, se está à vontade para perguntar, o que ainda parece difícil.\n\n' +
      '**Você pode escolher como prefere acompanhar**\n' +
      '- Se quiser acompanhar a evolução do processo e a situação dos seus formulários, acesse o EcoLíder:\n{{LINK_ECOLIDER}}\n' +
      '- Entre com o seu **e-mail e CPF**. No **Espaço do Anjo** você pode acompanhar o que está aguardando liberação, o que está pendente, o que já foi respondido e consultar as orientações do seu papel.\n' +
      '- Se ainda não conseguir acessar, ou se tiver qualquer dúvida, é só nos avisar que ajudamos.\n' +
      '- Se preferir apenas responder este formulário agora, não precisa entrar na plataforma.\n\n' +
      '**Formulário de Avaliação do Programa de Integração — preenchimento obrigatório:**\nVocê pode responder diretamente por este link, **sem precisar fazer login**:\n{{LINK_AVAL_PROGRAMA}}\n\n' +
      'São poucos minutos e sua percepção entra no acompanhamento do processo.\n\n' +
      'E, claro: se estiver sentindo qualquer dificuldade no papel de Anjo, ou notar algo que mereça atenção, fale com a gente a qualquer momento — não precisa esperar o formulário.\n\n' +
      'Obrigado pelo apoio!' + ASS,
    anexo: '',
  },
};
