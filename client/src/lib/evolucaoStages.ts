/**
 * Classificação por estágios de Evolução/Engajamento
 * Baseado no quadro oficial "Notas do Aluno" do programa BEM
 * 
 * Estágio 1: Excelência (9-10) - Alto nível de engajamento
 * Estágio 2: Avançado (7-8) - Bom nível de engajamento
 * Estágio 3: Intermediário (5-6) - Comprometimento adequado
 * Estágio 4: Básico (3-4) - Participação irregular
 * Estágio 5: Inicial (0-2) - Baixo engajamento
 */

export interface EvolucaoStage {
  level: number;
  label: string;
  range: string;
  description: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
}

export function getEvolucaoStage(nota: number): EvolucaoStage {
  if (nota >= 9) {
    return {
      level: 1,
      label: 'Excelência',
      range: '9-10',
      description: 'Alto nível de engajamento com a plataforma, webinars, tarefas da mentoria, aplicação dos aprendizados e evidente evolução das competências indicadas para o desenvolvimento no Diagnóstico.',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-300',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
    };
  }
  if (nota >= 7) {
    return {
      level: 2,
      label: 'Avançado',
      range: '7-8',
      description: 'Bom nível de engajamento com a plataforma, webinars, tarefas da mentoria, aplicação dos aprendizados e evidente evolução das competências indicadas para o desenvolvimento no Diagnóstico Inicial.',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-300',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-800',
    };
  }
  if (nota >= 5) {
    return {
      level: 3,
      label: 'Intermediário',
      range: '5-6',
      description: 'Comprometimento adequado, com pouco equilíbrio na realização entre as ferramentas disponibilizas como a plataforma, webinars, tarefas da mentoria, aplicação dos aprendizados e com uma evolução regular das competências indicadas para o desenvolvimento no Diagnóstico Inicial.',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-300',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
    };
  }
  if (nota >= 3) {
    return {
      level: 4,
      label: 'Básico',
      range: '3-4',
      description: 'Participação irregular, progresso limitado.',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-300',
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-800',
    };
  }
  return {
    level: 5,
    label: 'Inicial',
    range: '0-2',
    description: 'Baixo engajamento, pouca evolução.',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800',
  };
}

/**
 * Retorna a cor de fundo para uma nota de evolução (para uso em barras de progresso, etc.)
 */
export function getEvolucaoColor(nota: number): string {
  if (nota >= 9) return '#10b981'; // emerald-500
  if (nota >= 7) return '#3b82f6'; // blue-500
  if (nota >= 5) return '#f59e0b'; // amber-500
  if (nota >= 3) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}
