import type { ProcessoIntegracao } from '../types';
import { IDS_ITENS_PLANO_REAL, TOTAL_ITENS_PLANO_REAL } from './planoReal';
import { cronogramaReal, dataPrevistaItemCronograma } from './painelAcoes';
import { calcularStatusItem, normalizarRegistroFeito, PESO_STATUS_ITEM, type StatusItemPainel } from './statusHelpers';

export interface ProgressoProcessoPainel {
  total: number;
  concluidas: number;
  foraEscopo: number;
  abertas: number;
  percentualConcluido: number;
  percentualForaEscopo: number;
}

export interface PendenciasProcessoPainel {
  ckm: number;
  eles: number;
}

export interface SinalProcessoPainel {
  k: 'late' | 'act' | 'ok' | 'off';
  i: '!' | '•' | '✓';
  t: string;
}

export interface ProximaEtapaPainel {
  titulo: string;
  status: StatusItemPainel;
  data: string;
}

export interface CardProcessoPainel {
  processo: ProcessoIntegracao;
  processoId: string;
  progresso: ProgressoProcessoPainel;
  diaAtual: number | null;
  pendencias: PendenciasProcessoPainel;
  sinal: SinalProcessoPainel;
  proximaEtapa: ProximaEtapaPainel | null;
}

function hojeIso(hojeRef: string | Date = new Date()): string {
  if (typeof hojeRef === 'string') return hojeRef.slice(0, 10);
  const y = hojeRef.getFullYear();
  const m = String(hojeRef.getMonth() + 1).padStart(2, '0');
  const d = String(hojeRef.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function diffDias(inicio: string, fim: string): number {
  const [iy, im, id] = inicio.slice(0, 10).split('-').map(Number);
  const [fy, fm, fd] = fim.slice(0, 10).split('-').map(Number);
  const a = Date.UTC(iy, im - 1, id);
  const b = Date.UTC(fy, fm - 1, fd);
  return Math.round((b - a) / 86400000);
}

function estadoSalvo(valor: unknown): string {
  const reg = normalizarRegistroFeito(valor);
  return reg?.s ? String(reg.s) : '';
}

function plural(n: number, singular: string, pluralTxt: string): string {
  return `${n} ${n === 1 ? singular : pluralTxt}`;
}

/** Espelho da função progresso(p) do HTML original, limitado aos IDs reais do plano. */
export function progressoRealProcesso(processo: ProcessoIntegracao): ProgressoProcessoPainel {
  let concluidas = 0;
  let foraEscopo = 0;

  Object.entries(processo.feito || {}).forEach(([itemId, valor]) => {
    if (!IDS_ITENS_PLANO_REAL.has(itemId)) return;
    const s = estadoSalvo(valor);
    if (s === 'ok') concluidas++;
    else if (s === 'na' || s === 'wont') foraEscopo++;
  });

  const total = TOTAL_ITENS_PLANO_REAL;
  const abertas = Math.max(0, total - concluidas - foraEscopo);

  return {
    total,
    concluidas,
    foraEscopo,
    abertas,
    percentualConcluido: total ? Math.round((concluidas * 100) / total) : 0,
    percentualForaEscopo: total ? Math.round((foraEscopo * 100) / total) : 0,
  };
}

/** Espelho de diaAtual(p): primeiro dia da unidade = dia 1. */
export function diaAtualReal(processo: ProcessoIntegracao, hojeRef: string | Date = new Date()): number | null {
  if (!processo.inicio) return null;
  return diffDias(processo.inicio, hojeIso(hojeRef)) + 1;
}

export function pendenciasReaisProcesso(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): PendenciasProcessoPainel {
  let ckm = 0;
  let eles = 0;

  cronogramaReal(processo, feriados, hojeRef).forEach((etapa) => {
    etapa.itens.forEach((item) => {
      const st = calcularStatusItem(processo, item.id, dataPrevistaItemCronograma(etapa, item), hojeRef);
      if (st.k === 'ok' || st.k === 'off') return;
      if (item.r === 'CKM') ckm++;
      else eles++;
    });
  });

  return { ckm, eles };
}

/** Espelho da função sinal(p): destaca apenas o que ainda depende da CKM. */
export function sinalRealProcesso(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): SinalProcessoPainel {
  if (processo.situacao === 'encerrado') {
    return { k: 'off', i: '✓', t: 'Processo encerrado' };
  }

  let atrasadas = 0;
  let agora = 0;

  cronogramaReal(processo, feriados, hojeRef).forEach((etapa) => {
    etapa.itens.forEach((item) => {
      if (item.r !== 'CKM') return;
      const st = calcularStatusItem(processo, item.id, dataPrevistaItemCronograma(etapa, item), hojeRef);
      if (st.k === 'late') atrasadas++;
      else if (st.k === 'act') agora++;
    });
  });

  if (atrasadas > 0) {
    return { k: 'late', i: '!', t: plural(atrasadas, 'ação da CKM atrasada', 'ações da CKM atrasadas') };
  }
  if (agora > 0) {
    return { k: 'act', i: '•', t: plural(agora, 'ação da CKM para agora', 'ações da CKM para agora') };
  }
  return { k: 'ok', i: '✓', t: 'Nada pendente com a CKM' };
}

export function proximaEtapaRealProcesso(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): ProximaEtapaPainel | null {
  const cronograma = cronogramaReal(processo, feriados, hojeRef);

  for (const etapa of cronograma) {
    let pior: StatusItemPainel | null = null;
    let abertas = 0;

    etapa.itens.forEach((item) => {
      const st = calcularStatusItem(processo, item.id, dataPrevistaItemCronograma(etapa, item), hojeRef);
      if (st.k === 'ok' || st.k === 'off') return;
      abertas++;
      if (!pior || PESO_STATUS_ITEM[st.k] < PESO_STATUS_ITEM[pior.k]) pior = st;
    });

    if (abertas > 0 && pior) {
      return { titulo: etapa.et.t, status: pior, data: etapa.data };
    }
  }

  return null;
}

export function montarCardProcessoPainel(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): CardProcessoPainel {
  return {
    processo,
    processoId: processo.id || processo.nome,
    progresso: progressoRealProcesso(processo),
    diaAtual: diaAtualReal(processo, hojeRef),
    pendencias: pendenciasReaisProcesso(processo, feriados, hojeRef),
    sinal: sinalRealProcesso(processo, feriados, hojeRef),
    proximaEtapa: proximaEtapaRealProcesso(processo, feriados, hojeRef),
  };
}
