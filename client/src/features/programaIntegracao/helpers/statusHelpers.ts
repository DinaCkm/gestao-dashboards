// ============================================================
// HELPERS DE STATUS E PROGRESSO
// ============================================================

import { ProcessoIntegracao } from '../types';
import { listarEtapasOrdenadas, getPlanoCompleto } from './planoHelpers';

export type StatusItemKey = 'ok' | 'off' | 'late' | 'act' | 'wait' | 'ontime';

export interface StatusItemPainel {
  k: StatusItemKey;
  l: string;
  dif?: number;
  d?: string;
  extra?: string;
}

export const PESO_STATUS_ITEM: Record<StatusItemKey, number> = {
  late: 0,
  act: 1,
  wait: 2,
  ontime: 3,
  ok: 4,
  off: 5,
};

function isoDateLocal(data: string | Date): Date {
  if (data instanceof Date) {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate());
  }

  const match = String(data || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  const parsed = new Date(data);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function diferencaDias(dataBase: string, hoje: string | Date): number {
  const base = isoDateLocal(dataBase).getTime();
  const atual = isoDateLocal(hoje).getTime();
  return Math.round((atual - base) / 86400000);
}

function pluralDias(n: number): string {
  return `${n} ${n === 1 ? 'dia' : 'dias'}`;
}

function formatarDataCurta(data: string): string {
  const d = isoDateLocal(data);
  if (Number.isNaN(d.getTime())) return data;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Normaliza o formato historico salvo em feito[itemId].
 * O HTML original aceita registros antigos como boolean, string ou objeto.
 */
export function normalizarRegistroFeito(valor: unknown): Record<string, any> | null {
  if (valor == null || valor === false || valor === '') return null;

  if (valor === true) return { s: 'ok' };

  if (typeof valor === 'string') {
    const texto = valor.trim();
    if (!texto) return null;

    if (['ok', 'na', 'wont', 'prog', 'wait'].includes(texto)) {
      return { s: texto };
    }

    // Formatos historicos frequentemente guardavam apenas a data/timestamp da conclusao.
    return { s: 'ok', d: texto };
  }

  if (typeof valor === 'object') {
    const obj = valor as Record<string, any>;
    return { ...obj };
  }

  return null;
}

/**
 * Reproduz o vocabulario e as regras de estado de ITEM do HTML original.
 * `prevista` deve ser a data calculada do item/etapa no formato YYYY-MM-DD.
 * `hojeRef` existe para permitir testes deterministas.
 */
export function calcularStatusItem(
  processo: ProcessoIntegracao,
  itemId: string,
  prevista: string,
  hojeRef: string | Date = new Date(),
): StatusItemPainel {
  const registro = normalizarRegistroFeito(processo.feito?.[itemId]);
  const s = registro?.s ? String(registro.s) : '';

  if (s === 'ok') {
    const conclusao = registro?.d ? String(registro.d).slice(0, 10) : undefined;
    const atraso = conclusao && prevista ? diferencaDias(prevista, conclusao) : 0;
    return {
      k: 'ok',
      l: 'Feito',
      d: conclusao,
      extra: atraso > 0 ? `com ${pluralDias(atraso)} de atraso` : '',
    };
  }

  if (s === 'na' || s === 'wont') {
    return {
      k: 'off',
      l: s === 'na' ? 'Não se aplica' : 'Não será feita',
    };
  }

  const dif = prevista ? diferencaDias(prevista, hojeRef) : 0;

  if (s === 'prog') {
    if (dif > 0) {
      return {
        k: 'late',
        l: `Atrasado ${pluralDias(dif)} (envio programado não saiu)`,
        dif,
      };
    }

    const programado = registro?.prog ? ` p/ ${formatarDataCurta(String(registro.prog))}` : '';
    return { k: 'wait', l: `Programado${programado}`, dif };
  }

  if (s === 'wait') {
    if (dif > 0) {
      return {
        k: 'late',
        l: `Atrasado ${pluralDias(dif)} (aguardando retorno)`,
        dif,
      };
    }
    return { k: 'wait', l: 'Aguardando retorno', dif };
  }

  if (dif > 0) {
    return { k: 'late', l: `Atrasado ${pluralDias(dif)}`, dif };
  }

  if (dif === 0) {
    return { k: 'act', l: 'Tomar ação hoje', dif: 0 };
  }

  if (dif >= -3) {
    return { k: 'act', l: `Tomar ação — em ${pluralDias(-dif)}`, dif };
  }

  return { k: 'ontime', l: `No prazo — ${formatarDataCurta(prevista)}`, dif };
}

export function registroItem(processo: ProcessoIntegracao, itemId: string): Record<string, any> | null {
  return normalizarRegistroFeito(processo.feito?.[itemId]);
}

/**
 * Calcula status geral baseado em estado.feito
 */
export function calcularStatusGeral(processo: ProcessoIntegracao): 'nao_iniciado' | 'em_progresso' | 'concluido' | 'em_atraso' {
  const feito = processo.feito || {};
  const marcacoes = Object.keys(feito).length;
  const plano = getPlanoCompleto();
  
  if (marcacoes === 0) {
    return 'nao_iniciado';
  }
  
  if (marcacoes >= plano.length) {
    return 'concluido';
  }
  
  // Verifica se há desvios/atrasos nos dados
  if (processo.pendencias || (processo.notas && processo.notas.toLowerCase().includes('atraso'))) {
    return 'em_atraso';
  }
  
  return 'em_progresso';
}

/**
 * Calcula percentual de conclusão (0-100)
 */
export function calcularProgresso(processo: ProcessoIntegracao): number {
  const feito = processo.feito || {};
  const marcacoes = Object.keys(feito).length;
  const plano = getPlanoCompleto();
  
  if (plano.length === 0) return 0;
  
  return Math.round((marcacoes / plano.length) * 100);
}

/**
 * Calcula dias em programa
 */
export function calcularDiasEmPrograma(dataInicio: string): number {
  const inicio = new Date(dataInicio);
  const agora = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((agora.getTime() - inicio.getTime()) / msPerDay);
}

/**
 * Retorna cor visual para status
 */
export function getCorStatus(status: string): string {
  switch (status) {
    case 'concluido':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'em_andamento':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'pendente':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'desvio':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'em_progresso':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'nao_iniciado':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'em_atraso':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

/**
 * Retorna ícone para status
 */
export function getIconoStatus(status: string): string {
  switch (status) {
    case 'concluido':
      return '✓';
    case 'em_andamento':
      return '⏳';
    case 'desvio':
      return '⚠';
    case 'em_progresso':
      return '→';
    case 'nao_iniciado':
      return '○';
    case 'em_atraso':
      return '⚡';
    default:
      return '?';
  }
}

/**
 * Retorna label amigável
 */
export function getLabelStatus(status: string): string {
  const labels: Record<string, string> = {
    'concluido': 'Concluído',
    'em_andamento': 'Em Andamento',
    'em_progresso': 'Em Progresso',
    'pendente': 'Pendente',
    'desvio': 'Desvio',
    'nao_iniciado': 'Não Iniciado',
    'em_atraso': 'Em Atraso',
    'ativo': 'Ativo',
    'encerrado': 'Encerrado',
  };
  return labels[status] || status;
}

/**
 * Retorna resumo de status para um grupo de processos
 */
export function resumoStatusProcessos(processos: ProcessoIntegracao[]): {
  total: number;
  naoIniciados: number;
  emProgresso: number;
  concluidos: number;
  emAtraso: number;
  percentualConclusao: number;
} {
  const total = processos.length;
  let naoIniciados = 0;
  let emProgresso = 0;
  let concluidos = 0;
  let emAtraso = 0;
  
  processos.forEach((processo) => {
    const status = calcularStatusGeral(processo);
    switch (status) {
      case 'nao_iniciado':
        naoIniciados++;
        break;
      case 'em_progresso':
        emProgresso++;
        break;
      case 'concluido':
        concluidos++;
        break;
      case 'em_atraso':
        emAtraso++;
        break;
    }
  });
  
  return {
    total,
    naoIniciados,
    emProgresso,
    concluidos,
    emAtraso,
    percentualConclusao: total > 0 ? Math.round((concluidos / total) * 100) : 0,
  };
}

/**
 * Detecta se há atrasos
 */
export function temAtrasos(processo: ProcessoIntegracao): boolean {
  return !!processo.pendencias || (!!processo.notas && processo.notas.toLowerCase().includes('atraso'));
}

/**
 * Retorna próximas etapas não marcadas
 */
export function proximasEtapas(processo: ProcessoIntegracao, limite: number = 3): string[] {
  const feito = processo.feito || {};
  const resultado: string[] = [];
  
  for (const etapa of listarEtapasOrdenadas()) {
    if (!(etapa.id in feito)) {
      resultado.push(etapa.label);
      if (resultado.length >= limite) break;
    }
  }
  
  return resultado;
}
