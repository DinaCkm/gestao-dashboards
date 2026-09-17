import type { ProcessoIntegracao } from '../types';
import { PLANO_REAL, LADO_RESPONSAVEL, type EtapaPlanoReal, type ItemPlanoReal } from './planoReal';
import { calcularStatusItem, type StatusItemPainel } from './statusHelpers';
import type { FaixaPainel } from './painelKpis';
import { FERIADOS_PADRAO_INTEGRACAO } from './configDefaults';

export interface CronogramaEtapaReal {
  et: EtapaPlanoReal;
  dia: number;
  alvo: string;
  data: string;
  ajustado: boolean;
  confirmado: boolean;
  itens: ItemPlanoReal[];
}

export interface AcaoPainelReal {
  pid: string;
  p: ProcessoIntegracao;
  e: CronogramaEtapaReal;
  it: ItemPlanoReal;
  st: StatusItemPainel;
  data: string;
  faixa: FaixaPainel;
  lado: 'ckm' | 'eles';
}

function D(s: string): Date {
  const [ano, mes, dia] = String(s).split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function isoD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function add(s: string, n: number): string {
  const d = D(s);
  d.setUTCDate(d.getUTCDate() + n);
  return isoD(d);
}

function dow(s: string): number {
  return D(s).getUTCDay();
}

function hojeIso(hojeRef: string | Date = new Date()): string {
  if (typeof hojeRef === 'string') return hojeRef.slice(0, 10);
  const y = hojeRef.getFullYear();
  const m = String(hojeRef.getMonth() + 1).padStart(2, '0');
  const d = String(hojeRef.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function util(s: string, feriados: string[]): boolean {
  const w = dow(s);
  return w !== 0 && w !== 6 && !feriados.includes(s);
}

function prox(s: string, feriados: string[]): string {
  let x = s;
  let i = 0;
  while (!util(x, feriados) && i < 40) {
    x = add(x, 1);
    i++;
  }
  return x;
}

function ant(s: string, feriados: string[]): string {
  let x = s;
  let i = 0;
  while (!util(x, feriados) && i < 40) {
    x = add(x, -1);
    i++;
  }
  return x;
}

function alinhamentoData(processo: ProcessoIntegracao, numero: number): string | null {
  const reg = processo.alin?.[numero] ?? processo.alin?.[String(numero)];
  return reg && typeof reg === 'object' && reg.data ? String(reg.data).slice(0, 10) : null;
}

/**
 * Espelho puro da função cronograma(p) do HTML original.
 * Não grava nada. Assim como `feriados()` do original, uma lista ausente ou
 * vazia usa os feriados padrão em vez de tratar todos os dias como úteis.
 */
export function cronogramaReal(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): CronogramaEtapaReal[] {
  const base = processo.inicio || hojeIso(hojeRef);
  const feriadosEfetivos = feriados.length ? feriados : FERIADOS_PADRAO_INTEGRACAO;

  return PLANO_REAL.map((et) => {
    const alvo = add(base, (et.dia - 1) + (et.off || 0));
    let d = alvo;

    if (et.ajuste === 'prox') d = prox(alvo, feriadosEfetivos);
    else if (et.ajuste === 'ant') d = ant(alvo, feriadosEfetivos);

    if (et.mais) {
      for (let j = 0; j < et.mais; j++) {
        d = prox(add(d, 1), feriadosEfetivos);
      }
    }

    let conf: string | null = null;

    if (et.al) {
      conf = alinhamentoData(processo, et.al);
    }

    if (et.mais) {
      const n = ({ pos1: 1, pos2: 2, pos3: 3, pos4: 4 } as Record<string, number>)[et.id];
      const dataAlinhamento = n ? alinhamentoData(processo, n) : null;
      if (dataAlinhamento) conf = prox(add(dataAlinhamento, 1), feriadosEfetivos);
    }

    if (et.id.startsWith('ag')) {
      const n = Number(et.id.slice(2));
      const dataAlinhamento = alinhamentoData(processo, n);
      if (dataAlinhamento) conf = ant(add(dataAlinhamento, -7), feriadosEfetivos);
    }

    const data = conf || d;

    return {
      et,
      dia: et.dia + (et.off || 0),
      alvo,
      data,
      ajustado: data !== alvo,
      confirmado: Boolean(conf),
      itens: et.itens,
    };
  }).sort((a, b) => a.data.localeCompare(b.data));
}

/** Igual ao fimSemana(n) do HTML original. */
export function fimSemanaPainel(n: number, hojeRef: string | Date = new Date()): string {
  const h = hojeIso(hojeRef);
  const d = dow(h);
  return add(h, (7 - d) + n * 7);
}

/**
 * Espelho da função coletar() do Painel original.
 * Considera apenas processos ativos e apenas itens ainda abertos.
 */
export function coletarAcoesPainel(
  processos: ProcessoIntegracao[],
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): AcaoPainelReal[] {
  const fimEsta = fimSemanaPainel(0, hojeRef);
  const fimProx = fimSemanaPainel(1, hojeRef);
  const out: AcaoPainelReal[] = [];

  processos
    .filter((p) => p.situacao === 'ativo')
    .forEach((p) => {
      const pid = p.id || p.nome;
      cronogramaReal(p, feriados, hojeRef).forEach((e) => {
        e.itens.forEach((it) => {
          const st = calcularStatusItem(p, it.id, e.data, hojeRef);
          if (st.k === 'ok' || st.k === 'off') return;

          const faixa: FaixaPainel = st.k === 'late'
            ? 'atras'
            : e.data <= fimEsta
              ? 'esta'
              : e.data <= fimProx
                ? 'prox'
                : 'depois';

          out.push({
            pid,
            p,
            e,
            it,
            st,
            data: e.data,
            faixa,
            lado: LADO_RESPONSAVEL[it.r] || 'ckm',
          });
        });
      });
    });

  return out;
}
