import type { ModeloEmailIntegracao } from './emailCoreHelpers';

export type ModoModeloCobranca = 'primeira' | 'segunda';
export type PapelModeloCobranca = 'Colaborador' | 'Gestor' | 'Anjo' | 'UGP';

export const CHAVE_MODELO_COBRANCA: Record<ModoModeloCobranca, Record<PapelModeloCobranca, string>> = {
  primeira: {
    Colaborador: 'm_cobranca_form_colaborador',
    Gestor: 'm_cobranca_form_gestor',
    Anjo: 'm_cobranca_form_anjo',
    UGP: 'm_cobranca_form_ugp',
  },
  segunda: {
    Colaborador: 'm_reforco_form_colaborador',
    Gestor: 'm_reforco_form_gestor',
    Anjo: 'm_reforco_form_anjo',
    UGP: 'm_reforco_form_ugp',
  },
};

export const ORDEM_EMAILS_COBRANCA_INTEGRACAO = [
  CHAVE_MODELO_COBRANCA.primeira.Colaborador,
  CHAVE_MODELO_COBRANCA.primeira.Gestor,
  CHAVE_MODELO_COBRANCA.primeira.Anjo,
  CHAVE_MODELO_COBRANCA.primeira.UGP,
  CHAVE_MODELO_COBRANCA.segunda.Colaborador,
  CHAVE_MODELO_COBRANCA.segunda.Gestor,
  CHAVE_MODELO_COBRANCA.segunda.Anjo,
  CHAVE_MODELO_COBRANCA.segunda.UGP,
] as const;

export const TOKENS_COBRANCA_INTEGRACAO = [
  ['DESTINATARIO_1', 'primeiro nome de quem receberá a cobrança'],
  ['COLABORADOR', 'nome completo do colaborador acompanhado'],
  ['LISTA_FORMULARIOS', 'lista dos formulários pendentes, com datas e links — usada na 1ª cobrança'],
  ['FORMULARIO', 'nome do formulário específico — usado no reforço'],
  ['LINK_FORMULARIO', 'link do formulário específico — usado no reforço'],
] as const;

const PRIMEIRA_BASE = {
  fase: 'Cobranças de formulários',
  cc: '',
  anexo: '',
};

const REFORCO_BASE = {
  fase: 'Cobranças de formulários',
  cc: '',
  anexo: '',
};

export const MODELOS_EMAIL_COBRANCA_INTEGRACAO: Record<string, ModeloEmailIntegracao> = {
  [CHAVE_MODELO_COBRANCA.primeira.Colaborador]: {
    ...PRIMEIRA_BASE,
    nome: '1ª cobrança · Colaborador',
    para: '{{EMAIL_COLABORADOR}}',
    assunto: '[Onboarding] Lembrete: formulários pendentes do seu processo de integração',
    corpo:
      'Olá {{DESTINATARIO_1}}, tudo bem?\n\n' +
      'Passando para lembrar de um ponto rápido do seu processo de integração. Em nosso acompanhamento, ainda não recebemos o retorno dos formulários indicados abaixo, que permanecem registrados como pendentes.\n\n' +
      'Caso você já tenha realizado o preenchimento, por favor nos informe para que possamos conferir o registro.\n\n' +
      '**O que está pendente**\n{{LISTA_FORMULARIOS}}\n\n' +
      '> O preenchimento dos formulários indicados faz parte do Programa de Integração.\n\n' +
      'O preenchimento costuma levar apenas alguns minutos e é importante para mantermos o acompanhamento atualizado e seguirmos com as próximas etapas.\n\n' +
      'Suas respostas nos ajudam a acompanhar como está sendo a sua experiência e a ajustar o suporte ao longo da integração.\n\n' +
      'Se aparecer qualquer dificuldade com o link ou com alguma pergunta, é só responder este e-mail que ajudamos.',
  },
  [CHAVE_MODELO_COBRANCA.primeira.Gestor]: {
    ...PRIMEIRA_BASE,
    nome: '1ª cobrança · Gestor',
    para: '{{EMAIL_GESTOR}}',
    assunto: '[Onboarding] Formulários pendentes — integração de {{COLABORADOR}}',
    corpo:
      'Olá {{DESTINATARIO_1}}, tudo bem?\n\n' +
      'Estamos organizando os registros do processo de integração de **{{COLABORADOR}}** e ainda não recebemos o retorno dos formulários indicados abaixo, que permanecem registrados como pendentes.\n\n' +
      'Caso você já tenha realizado o preenchimento, por favor nos informe para que possamos conferir o registro.\n\n' +
      '**O que está pendente**\n{{LISTA_FORMULARIOS}}\n\n' +
      '> O preenchimento dos formulários indicados faz parte do Programa de Integração.\n\n' +
      'O preenchimento costuma levar apenas alguns minutos e é importante para mantermos o acompanhamento atualizado e seguirmos com as próximas etapas.\n\n' +
      'É a partir das suas respostas que conseguimos consolidar a evolução do colaborador e seguir com o acompanhamento.\n\n' +
      'Se aparecer qualquer dificuldade com o link ou com alguma pergunta, é só responder este e-mail que ajudamos.',
  },
  [CHAVE_MODELO_COBRANCA.primeira.Anjo]: {
    ...PRIMEIRA_BASE,
    nome: '1ª cobrança · Anjo',
    para: '{{EMAIL_ANJO}}',
    assunto: '[Onboarding] Formulários pendentes — integração de {{COLABORADOR}}',
    corpo:
      'Olá {{DESTINATARIO_1}}, tudo bem?\n\n' +
      'Estamos organizando os registros do processo de integração de **{{COLABORADOR}}** e ainda não recebemos o retorno dos formulários indicados abaixo, que permanecem registrados como pendentes.\n\n' +
      'Caso você já tenha realizado o preenchimento, por favor nos informe para que possamos conferir o registro.\n\n' +
      '**O que está pendente**\n{{LISTA_FORMULARIOS}}\n\n' +
      '> O preenchimento dos formulários indicados faz parte do Programa de Integração.\n\n' +
      'Sua percepção como Anjo é importante para o acompanhamento e ajuda a CKM a enxergar aspectos da adaptação que nem sempre aparecem nas conversas formais.\n\n' +
      'Se aparecer qualquer dificuldade com o link ou com alguma pergunta, é só responder este e-mail que ajudamos.',
  },
  [CHAVE_MODELO_COBRANCA.primeira.UGP]: {
    ...PRIMEIRA_BASE,
    nome: '1ª cobrança · UGP/RH',
    para: '{{UGP}}',
    assunto: '[Onboarding] Formulários pendentes — integração de {{COLABORADOR}}',
    corpo:
      'Olá {{DESTINATARIO_1}}, tudo bem?\n\n' +
      'Estamos organizando os registros do processo de integração de **{{COLABORADOR}}** e ainda não recebemos o retorno dos formulários indicados abaixo, que permanecem registrados como pendentes.\n\n' +
      'Caso o preenchimento já tenha sido realizado, por favor nos informe para que possamos conferir o registro.\n\n' +
      '**O que está pendente**\n{{LISTA_FORMULARIOS}}\n\n' +
      '> O preenchimento dos formulários indicados faz parte do Programa de Integração.\n\n' +
      'Esses registros são importantes para manter o acompanhamento atualizado e permitir o avanço das próximas etapas do programa.\n\n' +
      'Se aparecer qualquer dificuldade com o link ou com alguma informação, é só responder este e-mail que ajudamos.',
  },
  [CHAVE_MODELO_COBRANCA.segunda.Colaborador]: {
    ...REFORCO_BASE,
    nome: 'Reforço · Colaborador',
    para: '{{EMAIL_COLABORADOR}}',
    assunto: '[Onboarding] Pendência de formulário',
    corpo:
      'Olá {{DESTINATARIO_1}}, tudo bem?\n\n' +
      'O formulário **{{FORMULARIO}}** continua pendente em nosso acompanhamento.\n\n' +
      'Pedimos, por favor, que realize o preenchimento pelo link abaixo:\n{{LINK_FORMULARIO}}\n\n' +
      'Caso já tenha respondido, por favor nos informe para que possamos conferir o registro.',
  },
  [CHAVE_MODELO_COBRANCA.segunda.Gestor]: {
    ...REFORCO_BASE,
    nome: 'Reforço · Gestor',
    para: '{{EMAIL_GESTOR}}',
    assunto: '[Onboarding] Pendência de formulário — {{COLABORADOR}}',
    corpo:
      'Olá {{DESTINATARIO_1}}, tudo bem?\n\n' +
      'O formulário **{{FORMULARIO}}**, referente à integração de **{{COLABORADOR}}**, continua pendente em nosso acompanhamento.\n\n' +
      'Pedimos, por favor, que realize o preenchimento pelo link abaixo:\n{{LINK_FORMULARIO}}\n\n' +
      'Caso já tenha respondido, por favor nos informe para que possamos conferir o registro.',
  },
  [CHAVE_MODELO_COBRANCA.segunda.Anjo]: {
    ...REFORCO_BASE,
    nome: 'Reforço · Anjo',
    para: '{{EMAIL_ANJO}}',
    assunto: '[Onboarding] Pendência de formulário — {{COLABORADOR}}',
    corpo:
      'Olá {{DESTINATARIO_1}}, tudo bem?\n\n' +
      'O formulário **{{FORMULARIO}}**, referente à integração de **{{COLABORADOR}}**, continua pendente em nosso acompanhamento.\n\n' +
      'Pedimos, por favor, que realize o preenchimento pelo link abaixo:\n{{LINK_FORMULARIO}}\n\n' +
      'Caso já tenha respondido, por favor nos informe para que possamos conferir o registro.',
  },
  [CHAVE_MODELO_COBRANCA.segunda.UGP]: {
    ...REFORCO_BASE,
    nome: 'Reforço · UGP/RH',
    para: '{{UGP}}',
    assunto: '[Onboarding] Pendência de formulário — {{COLABORADOR}}',
    corpo:
      'Olá {{DESTINATARIO_1}}, tudo bem?\n\n' +
      'O formulário **{{FORMULARIO}}**, referente à integração de **{{COLABORADOR}}**, continua pendente em nosso acompanhamento.\n\n' +
      'Pedimos, por favor, que seja realizado o preenchimento pelo link abaixo:\n{{LINK_FORMULARIO}}\n\n' +
      'Caso a resposta já tenha sido enviada, por favor nos informe para que possamos conferir o registro.',
  },
};

export function dadosModeloCobranca(chave: string): {
  modo: ModoModeloCobranca;
  papel: PapelModeloCobranca;
} | null {
  for (const modo of ['primeira', 'segunda'] as const) {
    for (const papel of ['Colaborador', 'Gestor', 'Anjo', 'UGP'] as const) {
      if (CHAVE_MODELO_COBRANCA[modo][papel] === chave) return { modo, papel };
    }
  }
  return null;
}

export function ehModeloCobranca(chave: string): boolean {
  return Boolean(dadosModeloCobranca(chave));
}
