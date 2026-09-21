import type { BootstrapState, ProcessoIntegracao } from '../types';
import { cronogramaReal, dataPrevistaItemCronograma } from './painelAcoes';
import { calcularStatusItem, type StatusItemPainel } from './statusHelpers';
import { adicionarNotaAcao, aplicarStatusAcao, statusAcaoAtual } from './itemStateHelpers';
import { formatarData } from './dateHelpers';
import { linkIntegracaoPorChave } from './emailLinksHelpers';
import { emailMarkdownParaTexto, type EmailMontadoIntegracao } from './emailCoreHelpers';
import { ASSINATURA_EMAIL_INTEGRACAO } from './emailModelosPadrao';
import { MARCADOR_EMAIL_VAZIO } from './emailValoresHelpers';
import type { EmailPreviewIntegracao } from './emailMontagemHelpers';
import type { ItemPlanoReal, ResponsavelIntegracao } from './planoReal';

export type PapelCobranca = 'Gestor' | 'Anjo' | 'Colaborador' | 'UGP';

export interface ItemCobrancaFormulario {
  it: ItemPlanoReal;
  data: string;
  etapa: string;
  papel: ResponsavelIntegracao;
  st: StatusItemPainel;
}

export interface GrupoCobrancaFormulario {
  grupos: Partial<Record<PapelCobranca, ItemCobrancaFormulario[]>>;
  total: number;
}

export interface DestinoCobrancaFormulario {
  para: string;
  nome: string;
  trat: string;
}

export const PAPEL_ORDEM_COBRANCA: PapelCobranca[] = ['Gestor', 'Anjo', 'Colaborador', 'UGP'];

function hojeIso(hojeRef: string | Date = new Date()): string {
  if (typeof hojeRef === 'string') return hojeRef.slice(0, 10);
  const y = hojeRef.getFullYear();
  const m = String(hojeRef.getMonth() + 1).padStart(2, '0');
  const d = String(hojeRef.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fechado(status: string): boolean {
  return status === 'ok' || status === 'na' || status === 'wont';
}

function primeiro(nome: string): string {
  return String(nome || '').trim().split(/\s+/).filter(Boolean)[0] || '';
}

export function formulariosPendentes(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): ItemCobrancaFormulario[] {
  const hoje = hojeIso(hojeRef);
  const out: ItemCobrancaFormulario[] = [];

  cronogramaReal(processo, feriados, hojeRef).forEach((etapa) => {
    etapa.itens.forEach((it) => {
      if (!it.form) return;
      if (fechado(statusAcaoAtual(processo, it.id))) return;
      const dataItem = dataPrevistaItemCronograma(etapa, it);
      if (dataItem >= hoje) return;
      out.push({
        it,
        data: dataItem,
        etapa: etapa.et.t,
        papel: it.r,
        st: calcularStatusItem(processo, it.id, dataItem, hojeRef),
      });
    });
  });

  return out;
}

export function pendentesPorPapel(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): GrupoCobrancaFormulario {
  const grupos: GrupoCobrancaFormulario['grupos'] = {};
  const lista = formulariosPendentes(processo, feriados, hojeRef);
  lista.forEach((item) => {
    if (!PAPEL_ORDEM_COBRANCA.includes(item.papel as PapelCobranca)) return;
    const papel = item.papel as PapelCobranca;
    (grupos[papel] ||= []).push(item);
  });
  return { grupos, total: lista.length };
}

export function pendentesCiclo(
  processo: ProcessoIntegracao,
  ciclo: 1 | 2 | 3 | 4,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): GrupoCobrancaFormulario {
  const marco: Record<number, number> = { 1: 15, 2: 45, 3: 75, 4: 150 };
  const re = new RegExp(`^(ag${ciclo}|d${marco[ciclo]}|pos${ciclo})`);
  const grupos: GrupoCobrancaFormulario['grupos'] = {};
  let total = 0;

  formulariosPendentes(processo, feriados, hojeRef).forEach((item) => {
    if (!re.test(item.it.id)) return;
    if (!PAPEL_ORDEM_COBRANCA.includes(item.papel as PapelCobranca)) return;
    const papel = item.papel as PapelCobranca;
    (grupos[papel] ||= []).push(item);
    total++;
  });

  return { grupos, total };
}

export function destinoPapel(processo: ProcessoIntegracao, papel: PapelCobranca): DestinoCobrancaFormulario {
  if (papel === 'Gestor') {
    return { para: processo.gestorEmail || '', nome: processo.gestor || '', trat: primeiro(processo.gestor) };
  }
  if (papel === 'Anjo') {
    return { para: processo.anjoEmail || '', nome: processo.anjo || '', trat: primeiro(processo.anjo) };
  }
  if (papel === 'Colaborador') {
    return {
      para: processo.emailCorporativo || processo.email || '',
      nome: processo.nome || '',
      trat: primeiro(processo.nome),
    };
  }
  return { para: processo.ugp || '', nome: 'UGP', trat: '' };
}

function textoLink(
  item: ItemCobrancaFormulario,
  config: BootstrapState['config'],
  origin?: string,
): string {
  if (!item.it.link) return '';
  const link = linkIntegracaoPorChave(item.it.link, config?.links || null, origin);
  return link?.u || '';
}

export function montarEmailCobranca(
  processo: ProcessoIntegracao,
  papel: PapelCobranca,
  itens: ItemCobrancaFormulario[],
  config: BootstrapState['config'],
  origin?: string,
): EmailPreviewIntegracao {
  const destino = destinoPapel(processo, papel);
  const colaborador = processo.nome || MARCADOR_EMAIL_VAZIO;
  const linhas = itens.map((item) => {
    const link = textoLink(item, config, origin);
    return `- **${item.it.form || item.it.t}** — previsto para ${formatarData(item.data)}` +
      (item.st.k === 'late' ? ' *(em atraso)*' : '') +
      (link ? `\n  ${link}` : '');
  }).join('\n');

  const abertura = papel === 'Colaborador'
    ? 'Passando para lembrar de um ponto rápido do seu processo de integração.'
    : `Estamos organizando os registros do processo de integração de **${colaborador}** e passamos para um lembrete rápido.`;

  const porque = papel === 'Colaborador'
    ? 'Suas respostas são o que nos mostra como está sendo a sua experiência — e é a partir delas que ajustamos o acompanhamento.'
    : papel === 'Anjo'
      ? 'Sua percepção como Anjo entra no acompanhamento do processo e ajuda a CKM a enxergar coisas que não aparecem nas conversas formais.'
      : papel === 'UGP'
        ? 'Esses registros são o que permite seguir com as próximas etapas do programa dentro do fluxo combinado.'
        : 'É a partir das suas respostas que conseguimos montar o relatório de evolução do colaborador e seguir com o acompanhamento.';

  let corpo =
    `Olá${destino.trat ? ` ${destino.trat}` : ''}, tudo bem?\n\n` +
    `${abertura} Pelos nossos registros, ${itens.length > 1 ? 'estes formulários ainda constam como não respondidos' : 'este formulário ainda consta como não respondido'}. ` +
    '**Se você já tiver respondido nos últimos dias, pode desconsiderar** — às vezes o retorno demora a chegar até nós.\n\n' +
    '**O que está pendente**\n' + linhas + '\n\n' +
    `> O preenchimento ${itens.length > 1 ? 'desses formulários é obrigatório' : 'desse formulário é obrigatório'} dentro do Programa de Integração.\n\n` +
    porque + '\n\n' +
    'Se aparecer qualquer dificuldade com o link ou com alguma pergunta, é só responder este e-mail que a gente ajuda.' +
    ASSINATURA_EMAIL_INTEGRACAO;

  const aviso = String(config?.aviso || '').trim();
  if (aviso) corpo = aviso.replace(/^>\s?/, '> ') + '\n\n' + corpo;

  const email: EmailMontadoIntegracao = {
    chave: `__cobranca_${papel}`,
    fase: 'Cobrança de formulários',
    nome: `Cobrança de formulários · ${papel}`,
    para: destino.para || MARCADOR_EMAIL_VAZIO,
    cc: '',
    anexo: '',
    assunto: `[Onboarding] ${papel === 'Colaborador' ? 'Lembrete: formulário do seu processo de integração' : `Formulários pendentes — integração de ${colaborador}`}`,
    corpo,
  };

  const textoSimples = emailMarkdownParaTexto(corpo);
  const paraMailto = email.para.includes(MARCADOR_EMAIL_VAZIO) ? '' : email.para;
  const mailto = `mailto:${encodeURIComponent(paraMailto)}?subject=${encodeURIComponent(email.assunto)}&body=${encodeURIComponent(textoSimples)}`;

  return {
    email,
    textoSimples,
    mailto,
    faltandoDados: !destino.para || corpo.includes(MARCADOR_EMAIL_VAZIO),
  };
}

export function marcarItensComoCobrados(
  processo: ProcessoIntegracao,
  itens: ItemCobrancaFormulario[],
  agoraRef: Date = new Date(),
): ProcessoIntegracao {
  let proximo = processo;
  itens.forEach((item) => {
    proximo = aplicarStatusAcao(proximo, item.it.id, 'wait', agoraRef);
    proximo = adicionarNotaAcao(proximo, item.it.id, 'Cobrança enviada por e-mail.', agoraRef);
  });
  return proximo;
}
