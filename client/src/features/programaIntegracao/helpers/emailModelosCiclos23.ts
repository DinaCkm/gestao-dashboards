import type { ModeloEmailIntegracao } from './emailCoreHelpers';
import { ASSINATURA_EMAIL_INTEGRACAO } from './emailModelosPadrao';

const ASS = ASSINATURA_EMAIL_INTEGRACAO;

const TXT_PESQUISA =
  'Queremos ouvir a sua opinião sobre a sua experiência no Sebrae/TO e sobre como tem sido o seu processo de integração. ' +
  'Para isso, preparamos esta **pesquisa rápida e fácil de responder**: queremos saber o que você pensa sobre diferentes aspectos, ' +
  'desde a cultura da empresa até o seu relacionamento com colegas e gestores.';

const LEMBRETE_CURSOS =
  '---\n\n' +
  '**Sobre a Jornada Compliance e os cursos obrigatórios**\n' +
  'Se você já estiver em dia com isso, ótimo — pode desconsiderar este lembrete. Se ainda não deu tempo de começar, sem problema: ' +
  'vale reservar alguns momentos na agenda daqui pra frente.\n' +
  '- A **Jornada Compliance** e os **cursos institucionais obrigatórios** fazem parte do seu período de integração.\n' +
  '- Eles ficam em **Meus Cursos**, na plataforma:\n{{LINK_ECOLIDER}}\n' +
  '- Se ficar qualquer dúvida sobre como acessar ou concluir, é só nos perguntar que a gente explica.\n\n' +
  'A ideia não é acumular tudo no fim: um pouco por semana costuma ser bem mais tranquilo.';

function ciclo(
  n: 2 | 3,
  dtok: 'DATA_ALIN_2' | 'DATA_ALIN_3',
  abertura: string,
  midGestor: string,
): Record<string, ModeloEmailIntegracao> {
  return {
    [`m_pos${n}_colab`]: {
      fase: `Pós ${n}º Alinhamento`,
      nome: `${n}º Alinhamento · Colaborador`,
      para: '{{EMAIL_COLABORADOR}}',
      cc: '',
      assunto: `[Onboarding] {{PRIMEIRO_NOME}}, sobre o nosso ${n}º Alinhamento`,
      corpo:
        'Olá {{PRIMEIRO_NOME}}, tudo bem?\n\n' +
        `Obrigado pela conversa em **{{${dtok}}}**! ${abertura}\n\n` +
        '**Continue registrando as ações do seu PDI** na plataforma do Ecossistema do B.E.M. — é o que nos permite acompanhar sua evolução e ajustar o que for preciso:\n{{LINK_ECOLIDER}}\n\n' +
        '---\n\n' +
        '**Pesquisa de Integração — obrigatória**\n' + TXT_PESQUISA + '\n\nO preenchimento é obrigatório:\n{{LINK_PESQUISA}}\n\n' +
        LEMBRETE_CURSOS + ASS,
      anexo: '',
    },

    [`m_pos${n}_gestor`]: {
      fase: `Pós ${n}º Alinhamento`,
      nome: `${n}º Alinhamento · Gestor`,
      para: '{{EMAIL_GESTOR}}',
      cc: '',
      assunto: `[Onboarding] ${n}º Alinhamento de {{COLABORADOR}} — ata e formulário`,
      corpo:
        'Olá {{GESTOR_1}}, tudo bem?\n\n' +
        `Obrigado pela conversa de **{{${dtok}}}**. Segue **em anexo a ata** do alinhamento para o seu acompanhamento.\n\n` +
        midGestor + '\n\n' +
        '---\n\n' +
        '**Um pedido rápido — formulário obrigatório**\nPara fechar este ciclo, o preenchimento do **Formulário de Avaliação do Programa de Integração** é obrigatório:\n{{LINK_AVAL_PROGRAMA}}\n\n' +
        'São poucos minutos e é o que alimenta o relatório de evolução que enviamos antes do próximo encontro.\n\n' +
        'Obrigado pela parceria de sempre!' + ASS,
      anexo: `Ata do ${n}º Alinhamento`,
    },

    [`m_pos${n}_anjo`]: {
      fase: `Pós ${n}º Alinhamento`,
      nome: `${n}º Alinhamento · Anjo`,
      para: '{{EMAIL_ANJO}}',
      cc: '',
      assunto: `[Onboarding] Sua percepção sobre {{PRIMEIRO_NOME}} — ${n}º ciclo`,
      corpo:
        'Olá {{ANJO_1}}, tudo bem?\n\n' +
        `Concluímos o **${n}º Alinhamento** do Onboarding de **{{COLABORADOR}}** e queremos de novo contar com o seu olhar sobre esse período.\n\n` +
        '**Formulário de Avaliação do Programa de Integração — obrigatório:**\n{{LINK_AVAL_PROGRAMA}}\n\n' +
        'Leva poucos minutos. Se houver algo que você prefira comentar fora do formulário, é só responder este e-mail.\n\n' +
        'Obrigado por seguir acompanhando o colega!' + ASS,
      anexo: '',
    },
  };
}

const C2 = ciclo(
  2,
  'DATA_ALIN_2',
  'Foi bom ver os avanços que você já fez nesse período e conversar sobre os pontos que seguimos acompanhando juntos.',
  'Neste ciclo olhamos a evolução do PDI, o que já foi concluído e os pontos que ainda merecem atenção. Se surgir algo no dia a dia que valha ajustar no plano, é só nos avisar.',
);

const C3 = ciclo(
  3,
  'DATA_ALIN_3',
  'Já dá para ver bem a sua evolução desde o começo. Conversamos sobre o andamento do PDI e sobre o que ainda queremos trabalhar até o encerramento.',
  'Estamos na reta final do acompanhamento. Conversamos sobre a evolução do colaborador, o andamento do PDI e as pendências que precisam ser resolvidas antes do encerramento.',
);

export const MODELOS_EMAIL_CICLOS_23_INTEGRACAO: Record<string, ModeloEmailIntegracao> = {
  ...C2,
  m_pos2_ugp: {
    fase: 'Pós 2º Alinhamento',
    nome: '2º Alinhamento · UGP',
    para: '{{UGP}}',
    cc: '',
    assunto: '[Onboarding] 2º Alinhamento – {{COLABORADOR}}',
    corpo:
      'Olá, tudo bem?\n\n' +
      'Realizamos o **2º Alinhamento** do Onboarding de **{{COLABORADOR}}** em **{{DATA_ALIN_2}}**. Seguem os materiais deste ciclo.\n\n' +
      '- **Ata do 2º Alinhamento** — em anexo;\n' +
      '- **Relatório completo de acompanhamento** — em anexo;\n' +
      '- **Status do PDI:** {{STATUS_PDI}};\n' +
      '- **Relatório de Acompanhamento do PDI** — em anexo.\n\n' +
      '**Pendências**\n{{PENDENCIAS}}\n\n' +
      '{{BLOCO_CONSIDERACOES}}' +
      'Os formulários do colaborador, do gestor e do Anjo foram encaminhados aos respectivos responsáveis e seguimos acompanhando as devolutivas.\n\n' +
      'Ficamos à disposição.' + ASS,
    anexo: 'Ata do 2º Alinhamento; Relatório completo de acompanhamento',
  },

  m_agradecimento_anjo: {
    fase: '60º dia',
    nome: 'Agradecimento · Anjo',
    para: '{{EMAIL_ANJO}}',
    cc: '{{EMAIL_GESTOR}}',
    assunto: '[Onboarding] Obrigado pelo seu apoio como Anjo, {{ANJO_1}}',
    corpo:
      'Olá {{ANJO_1}}, tudo bem?\n\n' +
      '**{{COLABORADOR}}** já passou de **60 dias** na unidade — e boa parte da tranquilidade dessa adaptação passou por você.\n\n' +
      'Ser Anjo é dar atenção a quem está chegando no meio das próprias entregas: responder a dúvida que a pessoa hesita em levar ao gestor, ' +
      'apresentar quem é quem, explicar o combinado que ninguém escreve em lugar nenhum. É um cuidado que quase não aparece — mas faz toda a diferença ' +
      'para quem está começando.\n\n' +
      '**Queremos registrar o nosso obrigado.** O seu **Certificado de Participação do Anjo** está sendo preparado e chega até você em breve.\n\n' +
      'Seguimos acompanhando {{PRIMEIRO_NOME}} até o encerramento do processo.' + ASS,
    anexo: '',
  },

  ...C3,
  m_pos3_ugp: {
    fase: 'Pós 3º Alinhamento',
    nome: '3º Alinhamento · UGP',
    para: '{{UGP}}',
    cc: '',
    assunto: '[Onboarding] 3º Alinhamento – {{COLABORADOR}}',
    corpo:
      'Olá, tudo bem?\n\n' +
      'Realizamos o **3º Alinhamento** do Onboarding de **{{COLABORADOR}}** em **{{DATA_ALIN_3}}**. Seguem os materiais para acompanhamento.\n\n' +
      '- **Ata do 3º Alinhamento** — em anexo;\n' +
      '- **Relatório completo do alinhamento** — em anexo;\n' +
      '- **Status atual do PDI:** {{STATUS_PDI}};\n\n' +
      '**Pendências**\n{{PENDENCIAS}}\n\n' +
      '{{BLOCO_CONSIDERACOES}}' +
      'Os formulários deste ciclo foram encaminhados ao colaborador, ao gestor e ao Anjo. O reconhecimento do Anjo também foi orientado à gestão da unidade.\n\n' +
      'Ficamos à disposição.' + ASS,
    anexo: 'Ata do 3º Alinhamento; Relatório completo',
  },

  m_reconhecimento_anjo: {
    fase: 'Pós 3º Alinhamento',
    nome: 'Reconhecimento do Anjo · Gestor',
    para: '{{EMAIL_GESTOR}}',
    cc: '',
    assunto: '[Onboarding] Um agradecimento ao Anjo {{ANJO}}',
    corpo:
      'Olá {{GESTOR_1}}, tudo bem?\n\n' +
      '**{{COLABORADOR}}** já completou cerca de **75 dias** na unidade — e boa parte da adaptação tranquila desse período se deve ao apoio de **{{ANJO}}**, que acompanhou o colega desde o primeiro dia.\n\n' +
      'O fluxo do Programa de Integração prevê um **reconhecimento pela participação do Anjo** neste marco. Não precisa ser nada elaborado: um agradecimento na reunião de equipe, um café coletivo, uma mensagem reconhecendo o apoio. O que importa é a equipe ver que esse cuidado tem valor.\n\n' +
      'Nós preparamos o **Certificado de Participação do Anjo**, que pode ser entregue nesse momento.\n\n' +
      'Obrigado por conduzir isso com a gente!' + ASS,
    anexo: '',
  },

  m_compliance_ugp: {
    fase: 'Pós 3º Alinhamento',
    nome: 'Jornada Compliance · UGP',
    para: '{{UGP}}',
    cc: '',
    assunto: '[Onboarding] Progresso da Jornada Compliance – {{COLABORADOR}}',
    corpo:
      'Olá, tudo bem?\n\n' +
      'Conforme o fluxo do Onboarding, encaminhamos a atualização do progresso de **{{COLABORADOR}}** na **Jornada Compliance** e nos cursos obrigatórios, realizados em Meus Cursos na plataforma do Ecossistema do B.E.M.\n\n' +
      '**Status atual**\n{{STATUS_CURSOS}}\n\n' +
      '**Pendências, se houver**\n{{PENDENCIAS}}\n\n' +
      'Seguimos acompanhando até o encerramento do processo e avisamos caso haja risco de alguma trilha não ser concluída no prazo.' + ASS,
    anexo: '',
  },
};
