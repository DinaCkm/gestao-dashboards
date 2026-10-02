import type { BootstrapState, ProcessoIntegracao } from '../types';
import { cronogramaReal, dataPrevistaItemCronograma } from './painelAcoes';
import { calcularStatusItem, dependenciaItemPendente, type StatusItemPainel } from './statusHelpers';
import {
  adicionarNotaAcao,
  aplicarStatusAcao,
  metadadosCobrancaFormularioAcao,
  registrarCobrancaFormularioAcao,
  statusAcaoAtual,
} from './itemStateHelpers';
import { formatarData } from './dateHelpers';
import { linkIntegracaoPorChave } from './emailLinksHelpers';
import {
  emailMarkdownParaTexto,
  emailTemDadoFaltante,
  montarEmailComModelo,
  type EmailMontadoIntegracao,
  type ValoresEmailIntegracao,
} from './emailCoreHelpers';
import { ASSINATURA_EMAIL_INTEGRACAO, AVISO_PADRAO_EMAIL_INTEGRACAO } from './emailModelosPadrao';
import { MARCADOR_EMAIL_VAZIO } from './emailValoresHelpers';
import type { EmailPreviewIntegracao } from './emailMontagemHelpers';
import type { ItemPlanoReal, ResponsavelIntegracao } from './planoReal';
import { FERIADOS_PADRAO_INTEGRACAO } from './configDefaults';
import { modeloEmailIntegracao } from './emailModelosIntegracao';
import { CHAVE_MODELO_COBRANCA } from './emailModelosCobranca';

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

function dataIsoUtc(data: string): Date | null {
  const m = String(data || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

function isoUtc(data: Date): string {
  return data.toISOString().slice(0, 10);
}

function adicionarDiaIso(data: string, dias = 1): string {
  const d = dataIsoUtc(data);
  if (!d) return data;
  d.setUTCDate(d.getUTCDate() + dias);
  return isoUtc(d);
}

function diaUtil(data: string, feriados: string[]): boolean {
  const d = dataIsoUtc(data);
  if (!d) return false;
  const semana = d.getUTCDay();
  return semana !== 0 && semana !== 6 && !feriados.includes(data);
}

function feriadosEfetivos(feriados: string[]): string[] {
  return feriados.length ? feriados : FERIADOS_PADRAO_INTEGRACAO;
}

export function dataReforcoCobranca(
  primeiraEm: string,
  feriados: string[] = [],
): string | null {
  const inicio = String(primeiraEm || '').slice(0, 10);
  if (!dataIsoUtc(inicio)) return null;
  const listaFeriados = feriadosEfetivos(feriados);
  let atual = inicio;
  let uteis = 0;
  let guarda = 0;
  while (uteis < 3 && guarda < 20) {
    atual = adicionarDiaIso(atual, 1);
    if (diaUtil(atual, listaFeriados)) uteis += 1;
    guarda += 1;
  }
  return uteis === 3 ? atual : null;
}

function primeiraCobrancaLegadaIso(
  processo: ProcessoIntegracao,
  itemId: string,
  hojeRef: string | Date = new Date(),
): string | null {
  const ficha = processo.feito?.[itemId] as any;
  const notas = Array.isArray(ficha?.notas) ? ficha.notas : [];
  const nota = [...notas].reverse().find((item: any) =>
    String(item?.t || '').trim() === 'Cobrança enviada por e-mail.');
  if (!nota?.d) return null;

  const match = String(nota.d).match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hoje = typeof hojeRef === 'string' ? new Date(`${hojeRef.slice(0, 10)}T12:00:00`) : hojeRef;
  const ano = hoje.getFullYear();
  const candidata = new Date(ano, Number(match[2]) - 1, Number(match[1]), Number(match[3]), Number(match[4]));
  if (Number.isNaN(candidata.getTime()) || candidata.getTime() > hoje.getTime()) return null;
  const diferencaDias = Math.floor((hoje.getTime() - candidata.getTime()) / 86400000);
  if (diferencaDias < 0 || diferencaDias > 30) return null;
  return candidata.toISOString();
}

export function primeiraCobrancaRegistrada(
  processo: ProcessoIntegracao,
  itemId: string,
  hojeRef: string | Date = new Date(),
): boolean {
  const meta = metadadosCobrancaFormularioAcao(processo, itemId);
  return Boolean(meta.primeiraEm || primeiraCobrancaLegadaIso(processo, itemId, hojeRef));
}

export function segundaCobrancaDisponivel(
  processo: ProcessoIntegracao,
  itemId: string,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): boolean {
  const meta = metadadosCobrancaFormularioAcao(processo, itemId);
  if (meta.segundaEm) return false;
  const primeiraEm = meta.primeiraEm || primeiraCobrancaLegadaIso(processo, itemId, hojeRef);
  if (!primeiraEm) return false;
  const dataReforco = dataReforcoCobranca(primeiraEm, feriados);
  if (!dataReforco) return false;
  return hojeIso(hojeRef) >= dataReforco;
}

function primeiro(nome: string): string {
  return String(nome || '').trim().split(/\s+/).filter(Boolean)[0] || '';
}

function chaveModeloCobranca(
  modo: 'primeira' | 'segunda',
  papel: PapelCobranca,
): string {
  return CHAVE_MODELO_COBRANCA[modo][papel];
}

function avisoCobranca(config: BootstrapState['config']): string {
  return config?.aviso == null
    ? AVISO_PADRAO_EMAIL_INTEGRACAO
    : String(config.aviso || '');
}

function valoresBaseCobranca(
  processo: ProcessoIntegracao,
  papel: PapelCobranca,
): ValoresEmailIntegracao {
  const destino = destinoPapel(processo, papel);
  return {
    COLABORADOR: processo.nome || '',
    PRIMEIRO_NOME: primeiro(processo.nome),
    EMAIL_COLABORADOR: processo.emailCorporativo || processo.email || '',
    GESTOR: processo.gestor || '',
    GESTOR_1: primeiro(processo.gestor),
    EMAIL_GESTOR: processo.gestorEmail || '',
    ANJO: processo.anjo || '',
    ANJO_1: primeiro(processo.anjo),
    EMAIL_ANJO: processo.anjoEmail || '',
    UGP: processo.ugpResponsavelEmail || '',
    DESTINATARIO_1: destino.trat || primeiro(destino.nome),
  };
}

function finalizarPreviewCobranca(
  emailBase: EmailMontadoIntegracao,
  destino: DestinoCobrancaFormulario,
): EmailPreviewIntegracao {
  const email = {
    ...emailBase,
    corpo: emailBase.corpo + ASSINATURA_EMAIL_INTEGRACAO,
  };
  const textoSimples = emailMarkdownParaTexto(email.corpo);
  const paraMailto = email.para.includes(MARCADOR_EMAIL_VAZIO) ? '' : email.para;
  const ccMailto = email.cc && !email.cc.includes(MARCADOR_EMAIL_VAZIO) ? email.cc : '';
  const mailto =
    `mailto:${encodeURIComponent(paraMailto)}` +
    `?subject=${encodeURIComponent(email.assunto)}` +
    `&body=${encodeURIComponent(textoSimples)}` +
    (ccMailto ? `&cc=${encodeURIComponent(ccMailto)}` : '');

  return {
    email,
    textoSimples,
    mailto,
    faltandoDados: !destino.para || emailTemDadoFaltante(email, MARCADOR_EMAIL_VAZIO),
  };
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
      if (dependenciaItemPendente(processo, it.id)) return;
      const dataItem = dataPrevistaItemCronograma(etapa, it);
      if (dataItem > hoje) return;
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
  const nomeUgp = processo.ugpResponsavelNome || '';
  return {
    para: processo.ugpResponsavelEmail || '',
    nome: nomeUgp || 'UGP/RH',
    trat: primeiro(nomeUgp),
  };
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
  const chave = chaveModeloCobranca('primeira', papel);
  const modelo = modeloEmailIntegracao(chave, config?.emails || null);
  const destino = destinoPapel(processo, papel);
  if (!modelo) {
    const vazio: EmailMontadoIntegracao = {
      chave,
      fase: 'Cobrança de formulários',
      nome: 'Cobrança de formulários',
      para: MARCADOR_EMAIL_VAZIO,
      cc: '',
      assunto: MARCADOR_EMAIL_VAZIO,
      corpo: MARCADOR_EMAIL_VAZIO,
      anexo: '',
    };
    return finalizarPreviewCobranca(vazio, destino);
  }

  const lista = itens.map((item) => {
    const link = textoLink(item, config, origin);
    return `- **${item.it.form || item.it.t}** — previsto para ${formatarData(item.data)}` +
      (item.st.k === 'late' ? ' *(em atraso)*' : '') +
      (link ? `\n  ${link}` : '');
  }).join('\n');

  const valores: ValoresEmailIntegracao = {
    ...valoresBaseCobranca(processo, papel),
    LISTA_FORMULARIOS: lista,
    FORMULARIO: itens.length === 1 ? (itens[0].it.form || itens[0].it.t) : '',
    LINK_FORMULARIO: itens.length === 1 ? textoLink(itens[0], config, origin) : '',
  };

  const email = montarEmailComModelo(
    chave,
    modelo,
    valores,
    MARCADOR_EMAIL_VAZIO,
    avisoCobranca(config),
  );
  return finalizarPreviewCobranca(email, destino);
}

export function montarEmailReforcoCobranca(
  processo: ProcessoIntegracao,
  papel: PapelCobranca,
  item: ItemCobrancaFormulario,
  config: BootstrapState['config'],
  origin?: string,
): EmailPreviewIntegracao {
  const chave = chaveModeloCobranca('segunda', papel);
  const modelo = modeloEmailIntegracao(chave, config?.emails || null);
  const destino = destinoPapel(processo, papel);
  if (!modelo) {
    const vazio: EmailMontadoIntegracao = {
      chave,
      fase: 'Reforço de cobrança de formulário',
      nome: 'Reforço de cobrança',
      para: MARCADOR_EMAIL_VAZIO,
      cc: '',
      assunto: MARCADOR_EMAIL_VAZIO,
      corpo: MARCADOR_EMAIL_VAZIO,
      anexo: '',
    };
    return finalizarPreviewCobranca(vazio, destino);
  }

  const link = textoLink(item, config, origin);
  const valores: ValoresEmailIntegracao = {
    ...valoresBaseCobranca(processo, papel),
    FORMULARIO: item.it.form || item.it.t || 'Formulário',
    LINK_FORMULARIO: link,
    LISTA_FORMULARIOS: `- **${item.it.form || item.it.t}**\n  ${link}`,
  };

  const email = montarEmailComModelo(
    chave,
    modelo,
    valores,
    MARCADOR_EMAIL_VAZIO,
    avisoCobranca(config),
  );
  const preview = finalizarPreviewCobranca(email, destino);
  return {
    ...preview,
    faltandoDados: preview.faltandoDados || !link,
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
    proximo = registrarCobrancaFormularioAcao(proximo, item.it.id, 'primeira', agoraRef);
    proximo = adicionarNotaAcao(proximo, item.it.id, 'Cobrança enviada por e-mail.', agoraRef);
  });
  return proximo;
}

export function marcarItemComoReforcado(
  processo: ProcessoIntegracao,
  item: ItemCobrancaFormulario,
  agoraRef: Date = new Date(),
): ProcessoIntegracao {
  let proximo = registrarCobrancaFormularioAcao(processo, item.it.id, 'segunda', agoraRef);
  proximo = adicionarNotaAcao(proximo, item.it.id, 'Reforço de cobrança enviado por e-mail.', agoraRef);
  return proximo;
}
