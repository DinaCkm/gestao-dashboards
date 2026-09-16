import type { ProcessoIntegracao } from '../types';

export type StatusAcaoLegado = '' | 'prog' | 'doing' | 'wait' | 'ok' | 'na' | 'wont';

function hojeIso(hojeRef: string | Date = new Date()): string {
  if (typeof hojeRef === 'string') return hojeRef.slice(0, 10);
  const y = hojeRef.getFullYear();
  const m = String(hojeRef.getMonth() + 1).padStart(2, '0');
  const d = String(hojeRef.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizarFicha(valor: unknown): Record<string, any> {
  if (valor && typeof valor === 'object') {
    const atual = valor as Record<string, any>;
    return {
      ...atual,
      s: atual.s || '',
      d: atual.d || '',
      prog: atual.prog || '',
      just: atual.just || '',
      notas: Array.isArray(atual.notas) ? [...atual.notas] : [],
    };
  }

  if (valor) {
    return { s: 'ok', d: '', prog: '', just: '', notas: [] };
  }

  return { s: '', d: '', prog: '', just: '', notas: [] };
}

/**
 * Espelha a parte segura de `marcar()` do HTML original.
 * Preserva just/prog/notas e nunca substitui a ficha por timestamp/string.
 */
export function aplicarStatusAcao(
  processo: ProcessoIntegracao,
  itemId: string,
  status: StatusAcaoLegado,
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  const feitoAtual = processo.feito || {};
  const ficha = normalizarFicha(feitoAtual[itemId]);
  const novaFicha = { ...ficha, notas: [...ficha.notas] };

  novaFicha.s = status;

  if (status === 'ok' && !novaFicha.d) {
    novaFicha.d = hojeIso(hojeRef);
  }

  if (!status) {
    novaFicha.d = '';
    novaFicha.prog = '';
  }

  const novoFeito = { ...feitoAtual };
  const vazia = !novaFicha.s && !novaFicha.d && !novaFicha.prog && !novaFicha.just && novaFicha.notas.length === 0;

  if (vazia) delete novoFeito[itemId];
  else novoFeito[itemId] = novaFicha;

  return { ...processo, feito: novoFeito };
}

export function statusAcaoAtual(processo: ProcessoIntegracao, itemId: string): StatusAcaoLegado {
  const ficha = normalizarFicha(processo.feito?.[itemId]);
  return (ficha.s || '') as StatusAcaoLegado;
}
