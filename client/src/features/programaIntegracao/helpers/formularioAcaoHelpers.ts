import type { ProcessoIntegracao, RespostaFormulario } from '../types';

export type FormularioIntegracaoKey = 'controle' | 'bem' | 'pesquisa' | 'aval' | 'pdi';

export interface FormularioDaAcao {
  f: FormularioIntegracaoKey;
  ciclo: number;
  papel: '' | 'Gestor' | 'Anjo';
}

const ITEM_PESQUISA: Record<number, string> = {
  1: 'pos1-08',
  2: 'pos2-08',
  3: 'pos3-09',
  4: 'pos4-07',
};

const ITEM_AVAL_G: Record<number, string> = {
  1: 'pos1-09',
  2: 'pos2-09',
  3: 'pos3-10',
  4: 'pos4-08',
};

const ITEM_AVAL_A: Record<number, string> = {
  1: 'pos1-10',
  2: 'pos2-10',
  3: 'pos3-11',
  4: 'pos4-09',
};

const FORM_DO_ITEM: Record<string, FormularioDaAcao> = {
  'pre-02': { f: 'controle', ciclo: 0, papel: '' },
  'pre-04b': { f: 'bem', ciclo: 0, papel: '' },
  'pos2-02': { f: 'pdi', ciclo: 2, papel: '' },
  'pos4-02': { f: 'pdi', ciclo: 4, papel: '' },
};

[1, 2, 3, 4].forEach((n) => {
  FORM_DO_ITEM[ITEM_PESQUISA[n]] = { f: 'pesquisa', ciclo: n, papel: '' };
  FORM_DO_ITEM[ITEM_AVAL_G[n]] = { f: 'aval', ciclo: n, papel: 'Gestor' };
  FORM_DO_ITEM[ITEM_AVAL_A[n]] = { f: 'aval', ciclo: n, papel: 'Anjo' };
});

/** Espelha `FORM_DO_ITEM` do HTML histórico mais recente. */
export function formularioDaAcao(itemId: string): FormularioDaAcao | null {
  return FORM_DO_ITEM[itemId] || null;
}

export function acaoTemFormularioRegistravel(itemId: string): boolean {
  return Boolean(FORM_DO_ITEM[itemId]);
}

/** Espelha `respDoItem(p,itid)`: retorna a resposta mais recente ligada à ação. */
export function respostaMaisRecenteDaAcao(
  processo: ProcessoIntegracao,
  itemId: string,
): RespostaFormulario | null {
  let ultima: RespostaFormulario | null = null;
  (processo.resp || []).forEach((resposta) => {
    if (resposta.itid !== itemId) return;
    ultima = resposta;
  });
  return ultima;
}

/**
 * Metadados esperados ao abrir o micro-registro de uma ação sem resposta.
 * Somente leitura: não cria nem grava resposta.
 */
export function contextoRegistroRespostaDaAcao(itemId: string): FormularioDaAcao | null {
  const d = formularioDaAcao(itemId);
  return d ? { ...d } : null;
}

export const MAPA_FORMULARIOS_POR_ACAO = Object.freeze({ ...FORM_DO_ITEM });
