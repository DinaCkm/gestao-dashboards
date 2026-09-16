// ============================================================
// HELPERS DO PLANO DE INTEGRAÇÃO COM IDs REAIS
// ============================================================

/**
 * Etapas do Programa de Integração com IDs reais
 * Baseado em definitions existentes:
 * - pre-00 a pre-10: Antes da chegada
 * - d1-01, d2, d3, d4: Primeiros dias
 * - sem1: Fim de semana 1
 * - ag1: Agendamento 1
 * - d15: Dia 15
 * - pos1: Pós-integração 1
 * - ag2: Agendamento 2
 * - d45: Dia 45
 * - pos2: Pós-integração 2
 * - d60: Dia 60 (Certificado Anjo)
 * - ag3: Agendamento 3
 * - d75: Dia 75
 * - pos3: Pós-integração 3
 * - ag4: Agendamento 4
 * - d150: Dia 150
 * - pos4: Fechamento final
 */

export interface EtapaPlano {
  id: string; // ID único interno
  actionId?: string; // ID da ação no produto (ex: 'pre-00', 'd1-01')
  label: string;
  diasAposInicio: number;
  tipo: 'atividade' | 'agendamento' | 'marco' | 'reflexao';
  descricao: string;
  responsaveis: string[]; // ['Gestor', 'CKM', 'UGP', 'Anjo', 'Colaborador']
  tarefas?: string[];
}

export const PLANO_ETAPAS: EtapaPlano[] = [
  // === ANTES DA CHEGADA ===
  {
    id: 'pre',
    label: 'Antes da Chegada',
    diasAposInicio: -7,
    tipo: 'atividade',
    descricao: 'Preparação pré-integração',
    responsaveis: ['Gestor', 'CKM', 'UGP'],
    tarefas: [
      'Preparar ambiente de trabalho',
      'Criar credenciais de acesso',
      'Preparar documentação inicial',
      'Comunicar com o novo integrante',
    ],
  },

  // === PRIMEIROS DIAS ===
  {
    id: 'd1',
    actionId: 'd1-01',
    label: 'Dia 1',
    diasAposInicio: 0,
    tipo: 'atividade',
    descricao: 'Acolhimento e primeiro contato',
    responsaveis: ['Anjo', 'Gestor'],
    tarefas: [
      'Recepção e apresentações',
      'Tour nas dependências',
      'Entrega de documentação',
      'Primeiras orientações',
    ],
  },
  {
    id: 'd2',
    label: 'Dia 2',
    diasAposInicio: 1,
    tipo: 'atividade',
    descricao: 'Continuação da integração',
    responsaveis: ['Anjo', 'Colaborador'],
    tarefas: [
      'Ambientação de sistemas',
      'Conhecer colegas',
      'Iniciar treinamentos',
    ],
  },
  {
    id: 'd3',
    label: 'Dia 3',
    diasAposInicio: 2,
    tipo: 'atividade',
    descricao: 'Aprofundamento em processos',
    responsaveis: ['Anjo', 'Colaborador'],
    tarefas: [
      'Aprofundar processos operacionais',
      'Esclarecimentos de dúvidas',
      'Primeiros contatos com equipes',
    ],
  },
  {
    id: 'd4',
    label: 'Dia 4',
    diasAposInicio: 3,
    tipo: 'atividade',
    descricao: 'Consolidação da primeira semana',
    responsaveis: ['Anjo', 'Gestor'],
    tarefas: [
      'Revisão de primeira semana',
      'Feedback informal',
      'Preparação para fim de semana',
    ],
  },

  // === FIM DE SEMANA E CHECKPOINT ===
  {
    id: 'sem1',
    label: 'Fim de Semana 1',
    diasAposInicio: 7,
    tipo: 'reflexao',
    descricao: 'Reflexão sobre primeira semana',
    responsaveis: ['Colaborador'],
    tarefas: ['Reflexão pessoal', 'Avaliação inicial'],
  },

  // === AGENDAMENTO 1 E CHECKPOINT D15 ===
  {
    id: 'ag1',
    label: 'Agendamento 1',
    diasAposInicio: 7,
    tipo: 'agendamento',
    descricao: 'Primeira conversa de feedback',
    responsaveis: ['CKM', 'Gestor'],
    tarefas: ['Sessão de feedback', 'Alinhamento de expectativas'],
  },
  {
    id: 'd15',
    label: 'Dia 15',
    diasAposInicio: 14,
    tipo: 'marco',
    descricao: 'Checkpoint de duas semanas',
    responsaveis: ['CKM', 'Gestor'],
    tarefas: [
      'Avaliação de progresso',
      'Identificação de desvios',
      'Ajustes necessários',
    ],
  },

  // === PÓS-INTEGRAÇÃO 1 ===
  {
    id: 'pos1',
    label: 'Pós-Integração 1',
    diasAposInicio: 21,
    tipo: 'atividade',
    descricao: 'Avaliação de 3 semanas',
    responsaveis: ['CKM', 'Gestor', 'UGP'],
    tarefas: [
      'Avaliação de desempenho inicial',
      'Feedback estruturado',
      'Planejamento próximas etapas',
    ],
  },
  {
    id: 'ag2',
    label: 'Agendamento 2',
    diasAposInicio: 21,
    tipo: 'agendamento',
    descricao: 'Segunda sessão de coaching',
    responsaveis: ['CKM', 'Gestor'],
    tarefas: ['Sessão de coaching', 'Suporte contínuo'],
  },

  // === D45 E PÓS-INTEGRAÇÃO 2 ===
  {
    id: 'd45',
    label: 'Dia 45',
    diasAposInicio: 44,
    tipo: 'marco',
    descricao: 'Marco de 45 dias - avaliação',
    responsaveis: ['CKM', 'Gestor'],
    tarefas: [
      'Avaliação de andamento',
      'Revisão de competências',
      'Plano de desenvolvimento contínuo',
    ],
  },
  {
    id: 'pos2',
    label: 'Pós-Integração 2',
    diasAposInicio: 44,
    tipo: 'atividade',
    descricao: 'Avaliação consolidada da primeira metade',
    responsaveis: ['CKM', 'Gestor', 'UGP'],
    tarefas: [
      'Avaliação formal de 1.5 meses',
      'Feedback consolidado',
      'Ajustes finais',
    ],
  },

  // === D60 CERTIFICADO ANJO ===
  {
    id: 'd60',
    label: 'Dia 60 - Certificado Anjo',
    diasAposInicio: 59,
    tipo: 'marco',
    descricao: 'Certificação de bom desempenho inicial',
    responsaveis: ['Anjo', 'CKM', 'Gestor'],
    tarefas: [
      'Avaliação para certificado Anjo',
      'Emissão de certificado',
      'Reconhecimento inicial',
    ],
  },

  // === AGENDAMENTO 3 E D75 ===
  {
    id: 'ag3',
    label: 'Agendamento 3',
    diasAposInicio: 59,
    tipo: 'agendamento',
    descricao: 'Terceira sessão de alinhamento',
    responsaveis: ['CKM', 'Gestor'],
    tarefas: ['Sessão de alinhamento', 'Planejamento para reta final'],
  },
  {
    id: 'd75',
    label: 'Dia 75',
    diasAposInicio: 74,
    tipo: 'marco',
    descricao: 'Checkpoint de 75 dias',
    responsaveis: ['CKM', 'Gestor'],
    tarefas: [
      'Avaliação de estabilização',
      'Revisão de competências adquiridas',
      'Preparação para fechamento',
    ],
  },

  // === PÓS-INTEGRAÇÃO 3 E FINAL ===
  {
    id: 'pos3',
    label: 'Pós-Integração 3',
    diasAposInicio: 74,
    tipo: 'atividade',
    descricao: 'Avaliação de estabilização',
    responsaveis: ['CKM', 'Gestor', 'UGP'],
    tarefas: [
      'Avaliação final de estabilização',
      'Feedback para consolidação',
      'Plano de continuidade',
    ],
  },
  {
    id: 'ag4',
    label: 'Agendamento 4',
    diasAposInicio: 149,
    tipo: 'agendamento',
    descricao: 'Quarta e última sessão',
    responsaveis: ['CKM', 'Gestor'],
    tarefas: ['Sessão de encerramento', 'Plano de próximos passos'],
  },
  {
    id: 'd150',
    label: 'Dia 150',
    diasAposInicio: 149,
    tipo: 'marco',
    descricao: 'Marco final de 150 dias',
    responsaveis: ['CKM', 'Gestor'],
    tarefas: [
      'Avaliação final',
      'Relatório consolidado',
      'Preparação para encerramento',
    ],
  },
  {
    id: 'pos4',
    label: 'Fechamento Final',
    diasAposInicio: 150,
    tipo: 'atividade',
    descricao: 'Encerramento do programa',
    responsaveis: ['CKM', 'Gestor', 'UGP'],
    tarefas: [
      'Encerramento formal',
      'Relatório final',
      'Avaliação de aprendizado',
    ],
  },
];

/**
 * Retorna o plano completo
 */
export function getPlanoCompleto(): EtapaPlano[] {
  return PLANO_ETAPAS;
}

/**
 * Encontra etapa pelo ID
 */
export function encontrarEtapa(etapaId: string): EtapaPlano | undefined {
  return PLANO_ETAPAS.find((e) => e.id === etapaId);
}

/**
 * Retorna lista de etapas ordenadas
 */
export function listarEtapasOrdenadas(): EtapaPlano[] {
  return [...PLANO_ETAPAS].sort((a, b) => a.diasAposInicio - b.diasAposInicio);
}

/**
 * Calcula progresso (0-100%)
 */
export function calcularProgressoPrograma(
  estadoFeito: Record<string, any>
): number {
  const etapasComMarcacao = PLANO_ETAPAS.filter((e) => e.id in estadoFeito);
  if (etapasComMarcacao.length === 0) return 0;
  
  return Math.round((etapasComMarcacao.length / PLANO_ETAPAS.length) * 100);
}

/**
 * Retorna próxima etapa não marcada
 */
export function proximaEtapaNaoMarcada(
  estadoFeito: Record<string, any>
): EtapaPlano | undefined {
  return listarEtapasOrdenadas().find((e) => !(e.id in estadoFeito));
}

/**
 * Retorna estatísticas
 */
export function getEstatisticasPlano() {
  return {
    totalEtapas: PLANO_ETAPAS.length,
    atividades: PLANO_ETAPAS.filter((e) => e.tipo === 'atividade').length,
    agendamentos: PLANO_ETAPAS.filter((e) => e.tipo === 'agendamento').length,
    marcos: PLANO_ETAPAS.filter((e) => e.tipo === 'marco').length,
    reflexoes: PLANO_ETAPAS.filter((e) => e.tipo === 'reflexao').length,
  };
}

