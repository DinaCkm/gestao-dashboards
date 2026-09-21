import type { ProcessoIntegracao } from '../types';
import { PLANO_REAL, type EtapaPlanoReal, type ItemPlanoReal } from './planoReal';
import { calcularStatusItem, type StatusItemPainel } from './statusHelpers';
import { fichaAcaoAtual } from './itemStateHelpers';
import { responsabilidadeAtual } from './responsabilidadeAtualHelpers';
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
  responsavelAtual: string;
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

/**
 * Normaliza datas históricas apenas para cálculo do cronograma.
 *
 * O HTML original calcula tudo em YYYY-MM-DD, mas alguns registros antigos de
 * alinhamento podem ter sido preservados como DD/MM/YYYY. A normalização é
 * somente em memória: nada é gravado ou alterado no banco.
 *
 * Datas realmente inválidas retornam null para que não derrubem o módulo com
 * RangeError: Invalid time value.
 */
function normalizarDataCronograma(valor: unknown): string | null {
  const texto = String(valor ?? '').trim();
  if (!texto) return null;

  let ano: number;
  let mes: number;
  let dia: number;

  const iso = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    ano = Number(iso[1]);
    mes = Number(iso[2]);
    dia = Number(iso[3]);
  } else {
    const br = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!br) return null;
    dia = Number(br[1]);
    mes = Number(br[2]);
    ano = Number(br[3]);
  }

  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (
    Number.isNaN(data.getTime()) ||
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    return null;
  }

  return `${String(ano).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
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
  if (!reg || typeof reg !== 'object' || !reg.data) return null;
  return normalizarDataCronograma(reg.data);
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
  const base = normalizarDataCronograma(processo.inicio) || hojeIso(hojeRef);
  const feriadosEfetivos = feriados.length ? feriados : FERIADOS_PADRAO_INTEGRACAO;

  const recalculo = (processo.teste as any)?.agendaRecalculo;
  const numeroAncora = Number(recalculo?.numero || 0);
  const offsetAgenda = Number(recalculo?.offsetDias || 0);
  const indiceAncora = numeroAncora
    ? PLANO_REAL.findIndex((etapa) => etapa.al === numeroAncora)
    : -1;

  return PLANO_REAL.map((et, etapaIndex) => {
    const alvoOriginal = add(base, (et.dia - 1) + (et.off || 0));
    const deveRecalcular = indiceAncora >= 0 && etapaIndex > indiceAncora && Number.isFinite(offsetAgenda) && offsetAgenda !== 0;
    const alvo = deveRecalcular ? add(alvoOriginal, offsetAgenda) : alvoOriginal;
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
      const realizadoAncora = n === numeroAncora ? normalizarDataCronograma(recalculo?.realizado) : null;
      const dataAlinhamento = realizadoAncora || (n ? alinhamentoData(processo, n) : null);
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

          const ficha = fichaAcaoAtual(p, it.id);
          const responsabilidade = responsabilidadeAtual(it, ficha.s);

          out.push({
            pid,
            p,
            e,
            it,
            st,
            data: e.data,
            faixa,
            lado: responsabilidade.lado,
            responsavelAtual: responsabilidade.rotulo,
          });
        });
      });
    });

  return out;
}
