export const MENU_PRINCIPAL_HTML = [
  { id: 'painel', label: 'Painel da semana' },
  { id: 'agenda', label: 'Agenda geral' },
  { id: 'indicadores', label: 'Indicadores' },
  { id: 'registrar', label: 'Registrar respostas' },
  { id: 'respostas', label: 'Respostas recebidas' },
  { id: 'formularios', label: 'Formulários' },
  { id: 'atas', label: 'Atas e relatórios' },
  { id: 'pessoas', label: 'Gerenciar pessoas' },
  { id: 'config', label: 'Configurações' },
] as const;

export const ABAS_FORMULARIOS_HTML = [
  { id: 'disponiveis', label: 'Formulários disponíveis' },
  { id: 'pessoas', label: 'Por pessoa' },
  { id: 'links', label: 'Links de resposta' },
  { id: 'pendentes', label: 'Pendentes de vinculação' },
  { id: 'respostas', label: 'Respostas recebidas' },
  { id: 'textos', label: 'Editar perguntas e textos' },
  { id: 'config', label: 'Configuração dos formulários' },
] as const;

export const ABAS_CONFIG_HTML = [
  { id: 'emails', label: 'Modelos de e-mail' },
  { id: 'mentoras', label: 'Mentoras / Consultoras CKM' },
  { id: 'cursos', label: 'Cursos obrigatórios' },
  { id: 'aviso', label: 'Aviso e assinatura' },
  { id: 'links', label: 'Links e formulários' },
  { id: 'datas', label: 'Datas e feriados' },
  { id: 'dados', label: 'Dados e backup' },
] as const;

/**
 * Rotas públicas permanentes já adotadas pelo EcoLíder.
 * São a equivalência atual dos links públicos únicos do HTML histórico.
 */
export const ROTAS_PUBLICAS_FORMULARIOS = {
  controle: '/formularios/controle-integracao',
  bem: '/formularios/bem-acolhido',
  pesquisa: '/formularios/pesquisa-integracao',
  aval: '/formularios/avaliacao-programa',
  pdi: '/formularios/acompanhamento-pdi',
} as const;

export const TOKENS_LINK_FORMULARIO = {
  LINK_CONTROLE: ROTAS_PUBLICAS_FORMULARIOS.controle,
  LINK_BEM_ACOLHIDO: ROTAS_PUBLICAS_FORMULARIOS.bem,
  LINK_PESQUISA: ROTAS_PUBLICAS_FORMULARIOS.pesquisa,
  LINK_AVAL_PROGRAMA: ROTAS_PUBLICAS_FORMULARIOS.aval,
  LINK_PDI_REL: ROTAS_PUBLICAS_FORMULARIOS.pdi,
} as const;

export type FormKeyPublico = keyof typeof ROTAS_PUBLICAS_FORMULARIOS;

export function rotaPublicaFormulario(formKey: FormKeyPublico): string {
  return ROTAS_PUBLICAS_FORMULARIOS[formKey];
}

export function urlPublicaFormulario(formKey: FormKeyPublico, origin?: string): string {
  const rota = rotaPublicaFormulario(formKey);
  if (!origin) return rota;
  return `${origin.replace(/\/$/, '')}${rota}`;
}
