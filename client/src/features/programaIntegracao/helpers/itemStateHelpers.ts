import type { ProcessoIntegracao } from '../types';

export type StatusAcaoLegado = '' | 'prog' | 'doing' | 'wait' | 'ok' | 'na' | 'wont';

const MARCO_POR_ALINHAMENTO: Record<number, number> = {
  1: 15,
  2: 45,
  3: 75,
  4: 150,
};

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

function clonarFeito(feito: Record<string, any> | undefined): Record<string, any> {
  return Object.fromEntries(
    Object.entries(feito || {}).map(([itemId, ficha]) => [itemId, normalizarFicha(ficha)]),
  );
}

function clonarAlinhamentos(alin: Record<string, any> | undefined): Record<string, any> {
  return Object.fromEntries(
    Object.entries(alin || {}).map(([numero, alinhamento]) => [
      numero,
      alinhamento && typeof alinhamento === 'object' ? { ...alinhamento } : alinhamento,
    ]),
  );
}

function fichaDe(feito: Record<string, any>, itemId: string): Record<string, any> {
  if (!feito[itemId]) {
    feito[itemId] = { s: '', d: '', prog: '', just: '', notas: [] };
  } else {
    feito[itemId] = normalizarFicha(feito[itemId]);
  }
  return feito[itemId];
}

function statusNoFeito(feito: Record<string, any>, itemId: string): StatusAcaoLegado {
  const ficha = feito[itemId];
  if (!ficha) return '';
  return (normalizarFicha(ficha).s || '') as StatusAcaoLegado;
}

function limparFichaVazia(feito: Record<string, any>, itemId: string): void {
  const ficha = feito[itemId];
  if (!ficha) return;
  const vazia = !ficha.s && !ficha.d && !ficha.prog && !ficha.just && (!ficha.notas || ficha.notas.length === 0);
  if (vazia) delete feito[itemId];
}

/**
 * Espelha `aplicarAutomacoes()` do HTML original.
 * Atua somente sobre uma cópia do processo, preservando o objeto recebido.
 */
function aplicarAutomacoes(
  feito: Record<string, any>,
  alin: Record<string, any>,
  hoje: string,
): void {
  Object.keys(feito).forEach((itemId) => {
    const ficha = fichaDe(feito, itemId);
    if (ficha.prog && (!ficha.s || ficha.s === 'prog') && ficha.prog <= hoje) {
      ficha.s = 'ok';
      ficha.d = ficha.prog;
      ficha.prog = '';
    }
  });

  [1, 2, 3, 4].forEach((numero) => {
    const alinhamento = alin[String(numero)] ?? alin[numero];
    if (!alinhamento || typeof alinhamento !== 'object') return;

    if (statusNoFeito(feito, `ag${numero}-01`) === 'ok' && !alinhamento.agendado) {
      alinhamento.agendado = 'aguardando';
    }

    if (alinhamento.agendado === 'sim' && statusNoFeito(feito, `ag${numero}-02`) !== 'ok') {
      const ficha = fichaDe(feito, `ag${numero}-02`);
      ficha.s = 'ok';
      ficha.d = ficha.d || alinhamento.data || hoje;
    }

    if (alinhamento.men?.ok && statusNoFeito(feito, `ag${numero}-00`) !== 'ok') {
      const ficha = fichaDe(feito, `ag${numero}-00`);
      ficha.s = 'ok';
      ficha.d = ficha.d || hoje;
    }

    if (alinhamento.realizado) {
      const marco = MARCO_POR_ALINHAMENTO[numero];
      const itemRealizado = `d${marco}-01`;
      if (statusNoFeito(feito, itemRealizado) !== 'ok') {
        const ficha = fichaDe(feito, itemRealizado);
        ficha.s = 'ok';
        ficha.d = alinhamento.realizado;
      }
    }
  });
}

/**
 * Espelha a alteração de situação feita por `marcar()` no HTML original.
 * Preserva just/prog/notas e quaisquer outros campos históricos existentes.
 * Depois da alteração, executa as mesmas automações internas da jornada.
 */
export function aplicarStatusAcao(
  processo: ProcessoIntegracao,
  itemId: string,
  status: StatusAcaoLegado,
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  const hoje = hojeIso(hojeRef);
  const novoFeito = clonarFeito(processo.feito);
  const novoAlin = clonarAlinhamentos(processo.alin);
  const novaFicha = fichaDe(novoFeito, itemId);

  novaFicha.s = status;

  if (status === 'ok' && !novaFicha.d) {
    novaFicha.d = hoje;
  }

  if (!status) {
    novaFicha.d = '';
    novaFicha.prog = '';
  }

  limparFichaVazia(novoFeito, itemId);
  aplicarAutomacoes(novoFeito, novoAlin, hoje);

  return {
    ...processo,
    feito: novoFeito,
    alin: novoAlin,
  };
}

export function statusAcaoAtual(processo: ProcessoIntegracao, itemId: string): StatusAcaoLegado {
  const ficha = normalizarFicha(processo.feito?.[itemId]);
  return (ficha.s || '') as StatusAcaoLegado;
}
