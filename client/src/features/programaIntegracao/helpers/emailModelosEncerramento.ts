import type { ModeloEmailIntegracao } from './emailCoreHelpers';
import { ASSINATURA_EMAIL_INTEGRACAO } from './emailModelosPadrao';

const ASS = ASSINATURA_EMAIL_INTEGRACAO;
const TXT_PESQUISA =
  'Queremos ouvir a sua opinião sobre a sua experiência no Sebrae/TO e sobre como tem sido o seu processo de integração. ' +
  'Para isso, preparamos esta **pesquisa rápida e fácil de responder**: queremos saber o que você pensa sobre diferentes aspectos, ' +
  'desde a cultura da empresa até o seu relacionamento com colegas e gestores.';

export const MODELOS_EMAIL_ENCERRAMENTO_INTEGRACAO: Record<string, ModeloEmailIntegracao> = {
  m_pos4_colab: {
    fase: 'Encerramento',
    nome: 'Encerramento · Colaborador',
    para: '{{EMAIL_COLABORADOR}}',
    cc: '',
    assunto: '[Onboarding] Parabéns, {{PRIMEIRO_NOME}}! Você concluiu sua integração',
    corpo:
      'Olá {{PRIMEIRO_NOME}}, tudo bem?\n\n' +
      '**Parabéns!** Com a nossa conversa de **{{DATA_ALIN_4}}**, você concluiu o processo de Onboarding no Sebrae/TO.\n\n' +
      'Foram 150 dias desde o seu primeiro dia na unidade. Deu para ver de perto a sua evolução: o começo com muitas perguntas, a adaptação ao time, as entregas ganhando ritmo. Foi um prazer acompanhar essa caminhada.\n\n' +
      '**Para fechar oficialmente**\n' + TXT_PESQUISA + '\n\nO preenchimento desta última pesquisa é **obrigatório** para encerrarmos o processo:\n{{LINK_PESQUISA}}\n\n' +
      '**Pendências finais, se houver**\n{{PENDENCIAS}}\n\n' +
      'Se ainda faltar concluir alguma parte da **Jornada Compliance** ou dos **cursos obrigatórios** em Meus Cursos, ' +
      'este é o momento de fechar — e, se precisar de ajuda para localizar algo na plataforma, é só falar com a gente:\n{{LINK_ECOLIDER}}\n\n' +
      '---\n\n' +
      'O processo de integração termina aqui, mas o desenvolvimento continua. Siga usando a plataforma, conversando com {{GESTOR}} sobre seus objetivos e buscando o que faz sentido para a sua trajetória.\n\n' +
      '**Muito sucesso nos próximos desafios!** Seguimos à disposição sempre que precisar.' + ASS,
    anexo: '',
  },

  m_pos4_gestor: {
    fase: 'Encerramento',
    nome: 'Encerramento · Gestor',
    para: '{{EMAIL_GESTOR}}',
    cc: '',
    assunto: '[Onboarding] Encerramento do Onboarding de {{COLABORADOR}}',
    corpo:
      'Olá {{GESTOR_1}}, tudo bem?\n\n' +
      'Com a conversa de **{{DATA_ALIN_4}}**, encerramos oficialmente o ciclo de acompanhamento do Onboarding de **{{COLABORADOR}}**.\n\n' +
      'Queremos agradecer de verdade pela parceria nesses 150 dias: pela disponibilidade nas quatro conversas, pelo cuidado na recepção e pelo acompanhamento do desenvolvimento do colaborador. Nada disso funciona sem a gestão junto.\n\n' +
      '**Segue em anexo a Ata de Encerramento.**\n\n' +
      '**Status final do PDI**\n{{STATUS_PDI}}\n\n' +
      '**Pendências, se houver**\n{{PENDENCIAS}}\n\n' +
      '---\n\n' +
      '**Último pedido — obrigatório**\nPara fecharmos o registro do processo, o preenchimento do último **Formulário de Avaliação do Programa de Integração** é obrigatório:\n{{LINK_AVAL_PROGRAMA}}\n\n' +
      'E se puder incluir ali o que achou do programa em si — o que ajudou, o que atrapalhou, o que faria diferente — vamos ler com atenção.\n\n' +
      'Obrigado por tudo!' + ASS,
    anexo: 'Ata de Encerramento',
  },

  m_pos4_ugp: {
    fase: 'Encerramento',
    nome: 'Encerramento · UGP',
    para: '{{UGP}}',
    cc: '',
    assunto: '[Onboarding] Encerramento do Processo – {{COLABORADOR}}',
    corpo:
      'Olá, tudo bem?\n\n' +
      'Concluímos o **4º e último alinhamento** do Onboarding de **{{COLABORADOR}}** em **{{DATA_ALIN_4}}**, encerrando o ciclo de acompanhamento. Seguem os materiais finais.\n\n' +
      '**Documentos em anexo**\n' +
      '- Ata final de encerramento;\n' +
      '- Relatório completo final;\n' +
      '- Relatório de Acompanhamento do PDI, preenchido pela CKM.\n\n' +
      '**Status final do PDI**\n{{STATUS_PDI}}\n\n' +
      '**Jornada Compliance e cursos institucionais**\n{{STATUS_CURSOS}}\n\n' +
      '**Pendências**\n{{PENDENCIAS}}\n\n' +
      '{{BLOCO_CONSIDERACOES}}' +
      '**Status do processo:** [CONCLUÍDO / CONCLUÍDO COM PENDÊNCIAS]\n\n' +
      'Os e-mails de encerramento foram enviados separadamente ao colaborador, ao gestor e ao Anjo.\n\n' +
      'Ficamos à disposição caso seja necessária qualquer complementação.' + ASS,
    anexo: 'Ata final de encerramento; Relatório completo final',
  },

  m_pos4_anjo: {
    fase: 'Encerramento',
    nome: 'Encerramento · Anjo',
    para: '{{EMAIL_ANJO}}',
    cc: '',
    assunto: '[Onboarding] Obrigado por ter sido o Anjo de {{PRIMEIRO_NOME}}',
    corpo:
      'Olá {{ANJO_1}}, tudo bem?\n\n' +
      'Chegamos ao **encerramento do processo de integração de {{COLABORADOR}}** — e queremos agradecer pelo seu papel nessa história.\n\n' +
      'Ser Anjo é dar atenção a alguém que está chegando, muitas vezes no meio das próprias entregas. Esse cuidado aparece: a adaptação de {{PRIMEIRO_NOME}} passou pelas conversas que vocês tiveram, pelas dúvidas que você respondeu e pelas apresentações que você fez.\n\n' +
      '**Para concluirmos também a sua participação**, o preenchimento do último **Formulário de Avaliação do Programa de Integração** é obrigatório:\n{{LINK_AVAL_PROGRAMA}}\n\n' +
      'Muito obrigado pela parceria — e conte com a gente se um dia quiser ser Anjo de novo.' + ASS,
    anexo: '',
  },
};
