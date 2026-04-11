/**
 * Formata um número com um número específico de casas decimais
 * Retorna uma string com o número formatado ou "0" se o valor for inválido
 */
export function safeToFixed(value: any, digits: number = 0): string {
  try {
    const num = Number(value);
    if (isNaN(num)) return "0";
    return num.toFixed(digits);
  } catch {
    return "0";
  }
}

/**
 * Formata um número para exibição em porcentagem
 */
export function formatPercentage(value: any, digits: number = 0): string {
  return `${safeToFixed(value, digits)}%`;
}
