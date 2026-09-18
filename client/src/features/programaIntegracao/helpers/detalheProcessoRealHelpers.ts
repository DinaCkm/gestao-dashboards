import type { ProcessoIntegracao } from '../types';
import { cronogramaReal, type CronogramaEtapaReal } from './painelAcoes';
import type { ItemPlanoReal } from './planoReal';
import {
  calcularStatusItem,
  PESO_STATUS_ITEM,
  type StatusItemKey,
  type StatusItemPainel,
} from './statusHelpers';
import { fichaAcaoAtual } from './itemStateHelpers';
import { respostaDoItem } from './respostaItemHelpers';
import { responsabilidadeAtual } from './responsabilidadeAtualHelpers';

export type FiltroDetalheProcesso = '' | 'aberto' | 'feitas' | 'ckm' | 'eles' | 'late' | 'form';

export const FILTROS_DETALHE_PROCESSO: Array<[FiltroDetalheProcesso, string]> = [
  ['', 'Tudo'],
  ['aberto', 'Em aberto'],
  ['feitas', 'Feitas'],
  ['ckm', 'Depende da CKM'],
  ['eles', 'Depende deles'],
  ['late', 'Atrasado'],
  ['form', 'Formulários'],
];

export interface EstadoEtapaDetalhe {
  k: StatusItemKey;
  l: string;
  ok: number;
  off: number;
  t: number;
  ab: number;
  fim: string | null;
}

export interface EtapaDetalheProcesso {
  etapa: CronogramaEtapaReal;
  estado: EstadoEtapaDetalhe;
  itens: ItemPlanoReal[];
  abertaPorPadrao: boolean;
}

export interface ResumoAlinhamentoDetalhe {
  n: 1 | 2 | 3 | 4;
  marco: number;
  data: string;
  dataMarco: string;
  hora: string;
  link: string;
  dataEfetiva: string;
  etapaId: string;
  estado: EstadoEtapaDetalhe;
  agendamento: 'agendado' | 'aguardando gestor' | 'não agendado' | 'a agendar';
  realizado: boolean;
  relatorios: 'ok' | 'pendentes' | '';
}

export interface ResumoDetalheProcesso {
  total: number;
  feitas: number;
  foraEscopo: number;
  abertas: number;
  percentualFeitas: number;
  percentualForaEscopo: number;
  ckmAbertas: number;
  elesAbertas: number;
  formulariosAbertos: number;
  formulariosVencidos: number;
}

const ESTADO_ETAPA_LABEL: Record<StatusItemKey, string> = {
  ok: 'Feito',
  off: 'Fora do escopo',
  late: 'Atrasado',
  act: 'Tomar ação',
  wait: 'Aguardando',
  ontime: 'No prazo',
};

const MARCO: Record<number, number> = { 1: 15, 2: 45, 3: 75, 4: 150 };

function hojeIsoLocal(hojeRef: string | Date = new Date()): string {
  if (typeof hojeRef === 'string') return hojeRef.slice(0, 10);
  const y = hojeRef.getFullYear();
  const m = String(hojeRef.getMonth() + 1).padStart(2, '0');
  const d = String(hojeRef.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Espelha `estadoEtapa(p,e)` do HTML histórico. */
export function estadoEtapaDetalhe(
  processo: ProcessoIntegracao,
  etapa: CronogramaEtapaReal,
  hojeRef: string | Date = new Date(),
): EstadoEtapaDetalhe {
  let total = 0;
  let ok = 0;
  let off = 0;
  let pior: StatusItemKey = 'ok';
  let fim: string | null = null;

  etapa.itens.forEach((item) => {
    total++;
    const st = calcularStatusItem(processo, item.id, etapa.data, hojeRef);
    if (st.k === 'ok') {
      ok++;
      const data = fichaAcaoAtual(processo, item.id).d;
      if (data && (!fim || data > fim)) fim = data;
    } else if (st.k === 'off') {
      off++;
    }
    if (PESO_STATUS_ITEM[st.k] < PESO_STATUS_ITEM[pior]) pior = st.k;
  });

  const abertas = total - ok - off;
  if (abertas === 0) {
    return {
      k: 'ok',
      l: off > 0 && ok === 0 ? 'Encerrada sem ação' : 'Concluída',
      ok,
      off,
      t: total,
      ab: 0,
      fim,
    };
  }

  return {
    k: pior,
    l: ESTADO_ETAPA_LABEL[pior],
    ok,
    off,
    t: total,
    ab: abertas,
    fim,
  };
}

/** Espelha a função interna `passa(it,st)` de `viewPessoa`. */
export function itemPassaFiltroDetalhe(
  item: ItemPlanoReal,
  status: StatusItemPainel,
  filtro: FiltroDetalheProcesso,
  statusSalvo = '',
): boolean {
  const aberto = status.k !== 'ok' && status.k !== 'off';
  const responsabilidade = responsabilidadeAtual(item, statusSalvo);

  if (filtro === 'aberto') return aberto;
  if (filtro === 'feitas') return status.k === 'ok';
  if (filtro === 'ckm') return aberto && responsabilidade.lado === 'ckm';
  if (filtro === 'eles') return aberto && responsabilidade.lado === 'eles';
  if (filtro === 'late') return status.k === 'late';
  if (filtro === 'form') return Boolean(item.form) && aberto;
  return true;
}

/**
 * Reconstrói a linha do tempo filtrada de `viewPessoa`.
 * Etapas de alinhamento continuam visíveis mesmo quando o filtro não encontra itens nelas.
 */
export function etapasDetalheProcesso(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
  filtro: FiltroDetalheProcesso = '',
  hojeRef: string | Date = new Date(),
): EtapaDetalheProcesso[] {
  return cronogramaReal(processo, feriados, hojeRef).reduce<EtapaDetalheProcesso[]>((acc, etapa) => {
    const estado = estadoEtapaDetalhe(processo, etapa, hojeRef);
    const itens = etapa.itens.filter((item) => {
      const ficha = fichaAcaoAtual(processo, item.id);
      return itemPassaFiltroDetalhe(
        item,
        calcularStatusItem(processo, item.id, etapa.data, hojeRef),
        filtro,
        ficha.s,
      );
    });

    // Com filtro ativo, uma etapa sem nenhum item correspondente não deve aparecer.
    // Antes, etapas de alinhamento eram mantidas mesmo vazias; por isso "Em aberto"
    // ainda mostrava blocos já concluídos.
    if (filtro && !itens.length) return acc;
    acc.push({
      etapa,
      estado,
      itens,
      abertaPorPadrao: estado.k === 'late' || estado.k === 'act' || estado.k === 'wait' || Boolean(filtro),
    });
    return acc;
  }, []);
}

function alinhamentoRegistro(processo: ProcessoIntegracao, n: number): Record<string, any> {
  const valor = processo.alin?.[n] ?? processo.alin?.[String(n)];
  return valor && typeof valor === 'object' ? valor : {};
}

/** Espelha a tira compacta dos quatro alinhamentos de `viewPessoa`. */
export function resumosAlinhamentosDetalhe(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): ResumoAlinhamentoDetalhe[] {
  const cronograma = cronogramaReal(processo, feriados, hojeRef);
  return ([1, 2, 3, 4] as const).map((n) => {
    const etapa = cronograma.find((x) => x.et.al === n);
    const a = alinhamentoRegistro(processo, n);
    const estado = etapa
      ? estadoEtapaDetalhe(processo, etapa, hojeRef)
      : { k: 'ontime', l: 'No prazo', ok: 0, off: 0, t: 0, ab: 0, fim: null } as EstadoEtapaDetalhe;

    let agendamento: ResumoAlinhamentoDetalhe['agendamento'] = 'a agendar';
    if (a.agendado === 'sim') agendamento = 'agendado';
    else if (a.agendado === 'aguardando') agendamento = 'aguardando gestor';
    else if (a.agendado === 'nao') agendamento = 'não agendado';

    return {
      n,
      marco: MARCO[n],
      data: String(a.data || ''),
      dataMarco: etapa?.data || '',
      hora: String(a.hora || ''),
      link: String(a.link || ''),
      dataEfetiva: String(a.realizado || ''),
      etapaId: `d${MARCO[n]}`,
      estado,
      agendamento,
      realizado: Boolean(a.realizado),
      relatorios: a.relat === 'ok' ? 'ok' : a.relat === 'pend' ? 'pendentes' : '',
    };
  });
}

/** Espelha `progresso(p)` + contadores do filtro da tela individual. */
export function resumoDetalheProcesso(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): ResumoDetalheProcesso {
  let total = 0;
  let feitas = 0;
  let foraEscopo = 0;
  let ckmAbertas = 0;
  let elesAbertas = 0;
  let formulariosAbertos = 0;
  let formulariosVencidos = 0;
  const hoje = hojeIsoLocal(hojeRef);

  cronogramaReal(processo, feriados, hojeRef).forEach((etapa) => {
    etapa.itens.forEach((item) => {
      total++;
      const st = calcularStatusItem(processo, item.id, etapa.data, hojeRef);
      if (st.k === 'ok') feitas++;
      else if (st.k === 'off') foraEscopo++;
      else {
        const responsabilidade = responsabilidadeAtual(item, fichaAcaoAtual(processo, item.id).s);
        if (responsabilidade.lado === 'ckm') ckmAbertas++;
        else elesAbertas++;
        if (item.form) {
          formulariosAbertos++;
          if (etapa.data < hoje && !respostaDoItem(processo, item.id)) formulariosVencidos++;
        }
      }
    });
  });

  const abertas = total - feitas - foraEscopo;
  return {
    total,
    feitas,
    foraEscopo,
    abertas,
    percentualFeitas: total ? Math.round((feitas * 100) / total) : 0,
    percentualForaEscopo: total ? Math.round((foraEscopo * 100) / total) : 0,
    ckmAbertas,
    elesAbertas,
    formulariosAbertos,
    formulariosVencidos,
  };
}

export function diaAtualDetalhe(processo: ProcessoIntegracao, hojeRef: string | Date = new Date()): number | null {
  if (!processo.inicio) return null;
  const inicio = new Date(`${processo.inicio.slice(0, 10)}T00:00:00Z`).getTime();
  const hoje = new Date(`${hojeIsoLocal(hojeRef)}T00:00:00Z`).getTime();
  return Math.round((hoje - inicio) / 86400000) + 1;
}
