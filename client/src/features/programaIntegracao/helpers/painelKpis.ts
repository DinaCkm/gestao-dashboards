import type { LadoIntegracao } from './planoReal';
import type { StatusItemPainel } from './statusHelpers';

export type FiltroPainel = '' | 'late' | 'lateckm' | 'lateeles' | 'hoje' | 'act' | 'wait' | 'ckm' | 'eles';
export type FaixaPainel = 'atras' | 'esta' | 'prox' | 'depois';

export interface AcaoPainelBase {
  st: StatusItemPainel;
  lado: LadoIntegracao;
  faixa: FaixaPainel;
}

export interface KpisPainel {
  atrasado: number;
  atrasadoCkm: number;
  atrasadoEles: number;
  hoje: number;
  tomarAcao: number;
  aguardandoRetorno: number;
  noPrazo: number;
  dependeEles: number;
}

/**
 * Contagem idêntica ao HTML original do Painel.
 * Recebe somente ações abertas: itens `ok` e `off` não devem entrar nesta lista.
 */
export function calcularKpisPainel(acoes: AcaoPainelBase[]): KpisPainel {
  let atrasado = 0;
  let atrasadoCkm = 0;
  let atrasadoEles = 0;
  let hoje = 0;
  let tomarAcao = 0;
  let aguardandoRetorno = 0;
  let noPrazo = 0;
  let dependeEles = 0;

  acoes.forEach((acao) => {
    if (acao.st.k === 'late') {
      atrasado++;
      if (acao.lado === 'ckm') atrasadoCkm++;
      else atrasadoEles++;
    } else if (acao.st.k === 'act' && acao.st.dif === 0) {
      hoje++;
    } else if (acao.st.k === 'act') {
      tomarAcao++;
    } else if (acao.st.k === 'wait') {
      aguardandoRetorno++;
    } else {
      noPrazo++;
    }

    if (acao.lado === 'eles' && acao.st.k !== 'ontime') {
      dependeEles++;
    }
  });

  return {
    atrasado,
    atrasadoCkm,
    atrasadoEles,
    hoje,
    tomarAcao,
    aguardandoRetorno,
    noPrazo,
    dependeEles,
  };
}

/**
 * Filtros idênticos ao HTML original. Sem filtro, mostra atraso + esta semana + próxima semana,
 * ocultando apenas a faixa `depois`.
 */
export function filtrarAcoesPainel<T extends AcaoPainelBase>(acoes: T[], filtro: FiltroPainel): T[] {
  return acoes.filter((acao) => {
    if (filtro === 'late') return acao.st.k === 'late';
    if (filtro === 'lateckm') return acao.st.k === 'late' && acao.lado === 'ckm';
    if (filtro === 'lateeles') return acao.st.k === 'late' && acao.lado === 'eles';
    if (filtro === 'hoje') return acao.st.k === 'act' && acao.st.dif === 0;
    if (filtro === 'act') return acao.st.k === 'act' && acao.st.dif !== 0;
    if (filtro === 'wait') return acao.st.k === 'wait';
    if (filtro === 'ckm') return acao.lado === 'ckm' && acao.st.k !== 'ontime';
    if (filtro === 'eles') return acao.lado === 'eles' && acao.st.k !== 'ontime';
    return acao.faixa !== 'depois';
  });
}

export const ROTULOS_FILTRO_PAINEL: Record<Exclude<FiltroPainel, ''>, string> = {
  late: 'Só o que está atrasado',
  lateckm: 'Só o atrasado que depende da CKM',
  lateeles: 'Só o atrasado que depende deles — Gestor, Colaborador, Anjo ou UGP',
  hoje: 'Só as tarefas de hoje',
  act: 'Só o que vence nos próximos dias',
  wait: 'Só o que está aguardando retorno — de qualquer um: CKM, UGP, gestor, Anjo ou colaborador',
  ckm: 'Só o que depende da CKM',
  eles: 'Só o que depende deles',
};

export const KPIS_PAINEL_ORIGINAL = [
  { filtro: 'late' as const, titulo: 'Atrasado', descricao: 'precisa de ação já' },
  { filtro: 'lateckm' as const, titulo: 'Atrasado — CKM', descricao: 'a próxima ação atrasada é nossa' },
  { filtro: 'lateeles' as const, titulo: 'Atrasado — deles', descricao: 'esperando Gestor, Colaborador, Anjo ou UGP' },
  { filtro: 'hoje' as const, titulo: 'Hoje', descricao: 'tarefas do dia, para fazer agora' },
  { filtro: 'act' as const, titulo: 'Tomar ação', descricao: 'vence em até 3 dias' },
  { filtro: 'wait' as const, titulo: 'Aguardando retorno', descricao: 'de qualquer um — CKM, UGP, gestor, Anjo ou colaborador' },
  { filtro: '' as const, titulo: 'No prazo', descricao: 'sem urgência' },
];
