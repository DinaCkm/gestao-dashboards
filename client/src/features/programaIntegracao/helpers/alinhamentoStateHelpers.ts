import type { ProcessoIntegracao } from '../types';
import { aplicarAutomacoesProcesso } from './itemStateHelpers';
import { cronogramaReal } from './painelAcoes';
import { FERIADOS_PADRAO_INTEGRACAO } from './configDefaults';

export type SituacaoAgendamento = '' | 'sim' | 'aguardando' | 'nao';
export type SituacaoRelatorioMentora = '' | 'ok' | 'parcial' | 'pend';
export type CampoAlinhamento = 'data' | 'hora' | 'link' | 'just' | 'realizado' | 'relatData';
export type CampoAtaAlinhamento = 'texto' | 'link';

function hojeIso(hojeRef: string | Date = new Date()): string {
  if (typeof hojeRef === 'string') return hojeRef.slice(0, 10);
  const y = hojeRef.getFullYear();
  const m = String(hojeRef.getMonth() + 1).padStart(2, '0');
  const d = String(hojeRef.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function agoraIso(agoraRef: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(agoraRef.getDate())}/${pad(agoraRef.getMonth() + 1)} ${pad(agoraRef.getHours())}:${pad(agoraRef.getMinutes())}`;
}

function dataIsoValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [ano, mes, dia] = valor.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

function adicionarDiasIso(iso: string, dias: number): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return data.toISOString().slice(0, 10);
}

function diferencaDiasIso(origem: string, destino: string): number {
  const [ao, mo, do_] = origem.split('-').map(Number);
  const [ad, md, dd] = destino.split('-').map(Number);
  const a = Date.UTC(ao, mo - 1, do_);
  const b = Date.UTC(ad, md - 1, dd);
  return Math.round((b - a) / 86400000);
}

function proximoDiaUtil(iso: string, feriados: string[]): string {
  let atual = iso;
  for (let i = 0; i < 40; i++) {
    const [ano, mes, dia] = atual.split('-').map(Number);
    const semana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
    if (semana !== 0 && semana !== 6 && !feriados.includes(atual)) return atual;
    atual = adicionarDiasIso(atual, 1);
  }
  return atual;
}

function clonarAlinhamentosComFilhos(alin: Record<string, any> | undefined): Record<string, any> {
  return Object.fromEntries(Object.entries(alin || {}).map(([numero, valor]) => {
    if (!valor || typeof valor !== 'object') return [numero, valor];
    return [numero, {
      ...valor,
      notas: Array.isArray(valor.notas) ? valor.notas.map((n: any) => ({ ...n })) : valor.notas,
      ata: valor.ata && typeof valor.ata === 'object' ? { ...valor.ata } : valor.ata,
      men: valor.men && typeof valor.men === 'object'
        ? {
            ...valor.men,
            hor: Array.isArray(valor.men.hor) ? valor.men.hor.map((h: any) => ({ ...h })) : valor.men.hor,
          }
        : valor.men,
    }];
  }));
}

function registroAlinhamento(alin: Record<string, any>, numero: number): Record<string, any> {
  const chave = String(numero);
  const existente = alin[chave] ?? alin[numero];
  if (existente && typeof existente === 'object') {
    if (alin[chave] !== existente) alin[chave] = existente;
    if (!Array.isArray(existente.notas)) existente.notas = [];
    if (!existente.ata || typeof existente.ata !== 'object') existente.ata = {};
    return existente;
  }
  const novo = { agendado: '', data: '', hora: '', link: '', just: '', realizado: '', relat: '', relatData: '', notas: [], ata: {}, men: { hor: [] } };
  alin[chave] = novo;
  return novo;
}

function processoComAlinhamentos(processo: ProcessoIntegracao): [ProcessoIntegracao, Record<string, any>] {
  const alin = clonarAlinhamentosComFilhos(processo.alin);
  return [{ ...processo, alin }, alin];
}

export interface DadosAgendamentoPrimeiroAlinhamento {
  data: string;
  hora: string;
  link: string;
}

/**
 * Centraliza o agendamento efetivo do 1º alinhamento na ação ag1-03.
 * Os mesmos campos de alin[1] continuam sendo a fonte única usada no marco
 * do 15º dia, agenda, timeline e e-mails; não cria estado paralelo.
 */
export function registrarAgendamentoPrimeiroAlinhamento(
  processo: ProcessoIntegracao,
  dados: DadosAgendamentoPrimeiroAlinhamento,
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  const data = String(dados.data || '').trim();
  const hora = String(dados.hora || '').trim();
  const link = String(dados.link || '').trim();
  if (!dataIsoValida(data) || !hora || !link) return processo;

  const [copia, alin] = processoComAlinhamentos(processo);
  const registro = registroAlinhamento(alin, 1);
  registro.data = data;
  registro.hora = hora;
  registro.link = link;
  registro.agendado = 'aguardando';
  registro.just = '';

  return aplicarAutomacoesProcesso(copia, hojeRef);
}

/** Espelha o clique dos botões Sim/Aguardando/Não de `alinPainel`. */
export function aplicarSituacaoAgendamento(
  processo: ProcessoIntegracao,
  numero: number,
  valor: Exclude<SituacaoAgendamento, ''>,
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  const [copia, alin] = processoComAlinhamentos(processo);
  const registro = registroAlinhamento(alin, numero);
  registro.agendado = registro.agendado === valor ? '' : valor;
  if (registro.agendado !== 'sim') registro.data = '';
  return aplicarAutomacoesProcesso(copia, hojeRef);
}

/** Espelha `data-alinf` do HTML histórico. */
export function aplicarCampoAlinhamento(
  processo: ProcessoIntegracao,
  numero: number,
  campo: CampoAlinhamento,
  valor: string,
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  const [copia, alin] = processoComAlinhamentos(processo);
  registroAlinhamento(alin, numero)[campo] = valor;
  return aplicarAutomacoesProcesso(copia, hojeRef);
}

/**
 * Registra a data real do alinhamento sem alterar a agenda futura.
 * A data prevista/confirmada permanece preservada em alin[n].data.
 */
export function registrarRealizacaoAlinhamento(
  processo: ProcessoIntegracao,
  numero: number,
  dataReal: string,
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  if (dataReal && !dataIsoValida(dataReal)) return processo;
  const [copia, alin] = processoComAlinhamentos(processo);
  registroAlinhamento(alin, numero).realizado = dataReal;
  return aplicarAutomacoesProcesso(copia, hojeRef);
}

/**
 * Registra a data real e desloca somente o que ainda é futuro.
 * O deslocamento é cumulativo: um novo recálculo parte da agenda já vigente.
 */
export function registrarRealizacaoERecalcularAgenda(
  processo: ProcessoIntegracao,
  numero: number,
  dataReal: string,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  if (!dataIsoValida(dataReal)) return processo;

  const cronogramaAntes = cronogramaReal(processo, feriados, hojeRef);
  const etapaAtual = cronogramaAntes.find((etapa) => etapa.et.al === numero);
  const previstaAntes = etapaAtual?.data || '';
  if (!previstaAntes || !dataIsoValida(previstaAntes)) {
    return registrarRealizacaoAlinhamento(processo, numero, dataReal, hojeRef);
  }

  const deslocamentoNovo = diferencaDiasIso(previstaAntes, dataReal);
  const deslocamentoAnterior = Number((processo.teste as any)?.agendaRecalculo?.offsetDias || 0);
  const offsetDias = deslocamentoAnterior + deslocamentoNovo;
  const feriadosEfetivos = feriados.length ? feriados : FERIADOS_PADRAO_INTEGRACAO;

  const [copia, alin] = processoComAlinhamentos(processo);
  registroAlinhamento(alin, numero).realizado = dataReal;

  for (let futuro = numero + 1; futuro <= 4; futuro++) {
    const registro = alin[String(futuro)] ?? alin[futuro];
    if (!registro || typeof registro !== 'object' || !registro.data || !dataIsoValida(String(registro.data))) continue;
    registro.data = proximoDiaUtil(adicionarDiasIso(String(registro.data), deslocamentoNovo), feriadosEfetivos);
  }

  copia.teste = {
    ...(copia.teste || {}),
    agendaRecalculo: {
      numero,
      realizado: dataReal,
      previstaAntes,
      deslocamentoNovo,
      offsetDias,
      recalculadoEm: hojeIso(hojeRef),
    },
  };

  return aplicarAutomacoesProcesso(copia, hojeRef);
}

/** Espelha o clique Recebidos/Parcial/Pendentes dos relatórios da mentora. */
export function aplicarSituacaoRelatorioMentora(
  processo: ProcessoIntegracao,
  numero: number,
  valor: Exclude<SituacaoRelatorioMentora, ''>,
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  const [copia, alin] = processoComAlinhamentos(processo);
  const registro = registroAlinhamento(alin, numero);
  registro.relat = registro.relat === valor ? '' : valor;
  if (registro.relat === 'ok' && !registro.relatData) registro.relatData = hojeIso(hojeRef);
  return aplicarAutomacoesProcesso(copia, hojeRef);
}

/** Espelha `data-ataf="texto|link"` do HTML histórico. */
export function aplicarCampoAtaAlinhamento(
  processo: ProcessoIntegracao,
  numero: number,
  campo: CampoAtaAlinhamento,
  valor: string,
): ProcessoIntegracao {
  const [copia, alin] = processoComAlinhamentos(processo);
  const registro = registroAlinhamento(alin, numero);
  registro.ata = { ...(registro.ata || {}), [campo]: valor };
  return copia;
}

/** Espelha `data-atadrive`: apenas alterna a marca histórica do arquivo. */
export function alternarAtaArquivadaAlinhamento(
  processo: ProcessoIntegracao,
  numero: number,
): ProcessoIntegracao {
  const [copia, alin] = processoComAlinhamentos(processo);
  const registro = registroAlinhamento(alin, numero);
  registro.ata = { ...(registro.ata || {}), drive: !Boolean(registro.ata?.drive) };
  return copia;
}

/** Espelha `addNota(id,'alin',n,txt)`. */
export function adicionarNotaAlinhamento(
  processo: ProcessoIntegracao,
  numero: number,
  texto: string,
  agoraRef: Date = new Date(),
): ProcessoIntegracao {
  const limpo = texto.trim();
  if (!limpo) return processo;
  const [copia, alin] = processoComAlinhamentos(processo);
  const registro = registroAlinhamento(alin, numero);
  registro.notas = Array.isArray(registro.notas) ? [...registro.notas] : [];
  registro.notas.push({ d: agoraIso(agoraRef), t: limpo });
  return copia;
}

/** Espelha `delNota(id,'alin',n,i)`. */
export function removerNotaAlinhamento(
  processo: ProcessoIntegracao,
  numero: number,
  indice: number,
): ProcessoIntegracao {
  const [copia, alin] = processoComAlinhamentos(processo);
  const registro = registroAlinhamento(alin, numero);
  registro.notas = Array.isArray(registro.notas) ? [...registro.notas] : [];
  if (indice >= 0 && indice < registro.notas.length) registro.notas.splice(indice, 1);
  return copia;
}

export interface EstadoAlinhamentoAtual {
  agendado: SituacaoAgendamento;
  data: string;
  hora: string;
  link: string;
  just: string;
  realizado: string;
  relat: SituacaoRelatorioMentora;
  relatData: string;
  ata: {
    texto: string;
    link: string;
    drive: boolean;
  };
  notas: Array<{ d: string; t: string }>;
}

export function estadoAlinhamentoAtual(processo: ProcessoIntegracao, numero: number): EstadoAlinhamentoAtual {
  const registro = processo.alin?.[String(numero)] ?? processo.alin?.[numero];
  const r = registro && typeof registro === 'object' ? registro : {};
  return {
    agendado: (r.agendado || '') as SituacaoAgendamento,
    data: String(r.data || ''),
    hora: String(r.hora || ''),
    link: String(r.link || ''),
    just: String(r.just || ''),
    realizado: String(r.realizado || ''),
    relat: (r.relat || '') as SituacaoRelatorioMentora,
    relatData: String(r.relatData || ''),
    ata: {
      texto: String(r.ata?.texto || ''),
      link: String(r.ata?.link || ''),
      drive: Boolean(r.ata?.drive),
    },
    notas: Array.isArray(r.notas)
      ? r.notas.map((nota: any) => ({ d: String(nota?.d || ''), t: String(nota?.t || '') }))
      : [],
  };
}
