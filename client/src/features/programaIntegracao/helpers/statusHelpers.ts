// ============================================================
// HELPERS DE STATUS E PROGRESSO
// ============================================================

import { ProcessoIntegracao } from '../types';
import { listarEtapasOrdenadas, getPlanoCompleto } from './planoHelpers';

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

