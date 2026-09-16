import type { ProcessoIntegracao } from '../types';

export type StatusAcaoLegado = '' | 'prog' | 'doing' | 'wait' | 'ok' | 'na' | 'wont';
export type CampoFichaAcao = 'd' | 'prog' | 'just';

export interface NotaAcao {
  d: string;
  t: string;
}

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

function agoraIso(agoraRef: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(agoraRef.getDate())}/${pad(agoraRef.getMonth() + 1)} ${pad(agoraRef.getHours())}:${pad(agoraRef.getMinutes())}`;
}

function normalizarFicha(valor: unknown): Record<string, any> {
  if (valor && typeof valor === 'object') {
    const atual = valor as Record<string, any>;
    const notasLegadas = Array.isArray(atual.notas)
      ? atual.notas.map((nota: any) => ({ ...nota }))
      : atual.obs
        ? [{ d: '', t: String(atual.obs) }]
        : [];
    const copia = {
      ...atual,
      s: atual.s || '',
      d: atual.d || '',
      prog: atual.prog || '',
      just: atual.just || '',
      notas: notasLegadas,
    };
    if ('obs' in copia) delete copia.obs;
    return copia;
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

/** Espelho de `marcar(id,itid,null,campo,valor)` do HTML original. */
export function aplicarCampoFichaAcao(
  processo: ProcessoIntegracao,
  itemId: string,
  campo: CampoFichaAcao,
  valor: string,
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  const hoje = hojeIso(hojeRef);
  const novoFeito = clonarFeito(processo.feito);
  const novoAlin = clonarAlinhamentos(processo.alin);
  const ficha = fichaDe(novoFeito, itemId);

  ficha[campo] = valor;

  if (campo === 'd' && valor && !ficha.s) {
    ficha.s = 'ok';
  }

  if (campo === 'prog') {
    if (valor && (!ficha.s || ficha.s === 'prog')) ficha.s = 'prog';
    else if (!valor && ficha.s === 'prog') ficha.s = '';
  }

  limparFichaVazia(novoFeito, itemId);
  aplicarAutomacoes(novoFeito, novoAlin, hoje);

  return {
    ...processo,
    feito: novoFeito,
    alin: novoAlin,
  };
}

export function adicionarNotaAcao(
  processo: ProcessoIntegracao,
  itemId: string,
  texto: string,
  agoraRef: Date = new Date(),
): ProcessoIntegracao {
  const limpo = texto.trim();
  if (!limpo) return processo;

  const novoFeito = clonarFeito(processo.feito);
  const ficha = fichaDe(novoFeito, itemId);
  ficha.notas = Array.isArray(ficha.notas) ? [...ficha.notas] : [];
  ficha.notas.push({ d: agoraIso(agoraRef), t: limpo });

  return { ...processo, feito: novoFeito };
}

export function removerNotaAcao(
  processo: ProcessoIntegracao,
  itemId: string,
  indice: number,
): ProcessoIntegracao {
  const novoFeito = clonarFeito(processo.feito);
  const ficha = fichaDe(novoFeito, itemId);
  ficha.notas = Array.isArray(ficha.notas) ? [...ficha.notas] : [];
  if (indice >= 0 && indice < ficha.notas.length) ficha.notas.splice(indice, 1);
  limparFichaVazia(novoFeito, itemId);
  return { ...processo, feito: novoFeito };
}

export function fichaAcaoAtual(processo: ProcessoIntegracao, itemId: string): {
  s: StatusAcaoLegado;
  d: string;
  prog: string;
  just: string;
  notas: NotaAcao[];
} {
  const ficha = normalizarFicha(processo.feito?.[itemId]);
  return {
    s: (ficha.s || '') as StatusAcaoLegado,
    d: String(ficha.d || ''),
    prog: String(ficha.prog || ''),
    just: String(ficha.just || ''),
    notas: Array.isArray(ficha.notas)
      ? ficha.notas.map((nota: any) => ({ d: String(nota?.d || ''), t: String(nota?.t || '') }))
      : [],
  };
}

export function statusAcaoAtual(processo: ProcessoIntegracao, itemId: string): StatusAcaoLegado {
  const ficha = normalizarFicha(processo.feito?.[itemId]);
  return (ficha.s || '') as StatusAcaoLegado;
}
