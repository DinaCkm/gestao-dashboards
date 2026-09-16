// ============================================================
// HELPERS DE DATA
// ============================================================

/**
 * Formata data ISO para display
 */
export function formatarData(dataISO: string, locale: string = 'pt-BR'): string {
  try {
    const date = new Date(dataISO + 'T00:00:00Z');
    return date.toLocaleDateString(locale, { timeZone: 'America/Sao_Paulo' });
  } catch {
    return dataISO;
  }
}

/**
 * Formata datetime ISO para display com hora
 */
export function formatarDataHora(dataISO: string, locale: string = 'pt-BR'): string {
  try {
    const date = new Date(dataISO);
    return date.toLocaleString(locale, { timeZone: 'America/Sao_Paulo' });
  } catch {
    return dataISO;
  }
}

/**
 * Calcula dias restantes até uma data
 */
export function diasRestantes(dataFim: string): number {
  const fim = new Date(dataFim + 'T00:00:00Z');
  const agora = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((fim.getTime() - agora.getTime()) / msPerDay);
}

/**
 * Calcula dias passados desde uma data
 */
export function diasPassados(dataInicio: string): number {
  const inicio = new Date(dataInicio + 'T00:00:00Z');
  const agora = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((agora.getTime() - inicio.getTime()) / msPerDay);
}

/**
 * Retorna status visual baseado em dias restantes
 */
export function getStatusVisualdDiasRestantes(diasRestantes: number): {
  status: 'dentro_prazo' | 'proximo_vencimento' | 'vencido';
  color: string;
  label: string;
} {
  if (diasRestantes < 0) {
    return { 
      status: 'vencido', 
      color: 'text-red-600 bg-red-50', 
      label: `Vencido há ${Math.abs(diasRestantes)} dias`
    };
  }
  if (diasRestantes <= 3) {
    return { 
      status: 'proximo_vencimento', 
      color: 'text-yellow-600 bg-yellow-50',
      label: `Vence em ${diasRestantes} dias`
    };
  }
  return { 
    status: 'dentro_prazo', 
    color: 'text-green-600 bg-green-50',
    label: `Vence em ${diasRestantes} dias`
  };
}

/**
 * Retorna data de hoje em ISO
 */
export function hoje(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Adiciona dias a uma data
 */
export function adicionarDias(dataISO: string, dias: number): string {
  const data = new Date(dataISO + 'T00:00:00Z');
  data.setDate(data.getDate() + dias);
  return data.toISOString().split('T')[0];
}

/**
 * Compara duas datas (retorna -1, 0 ou 1)
 */
export function compararDatas(data1: string, data2: string): number {
  const d1 = new Date(data1).getTime();
  const d2 = new Date(data2).getTime();
  return d1 < d2 ? -1 : d1 > d2 ? 1 : 0;
}

/**
 * Verifica se data é no passado
 */
export function ehPassado(dataISO: string): boolean {
  return new Date(dataISO) < new Date();
}

/**
 * Verifica se data é hoje
 */
export function ehHoje(dataISO: string): boolean {
  const data = new Date(dataISO + 'T00:00:00Z');
  const agora = new Date();
  return data.toDateString() === agora.toDateString();
}

