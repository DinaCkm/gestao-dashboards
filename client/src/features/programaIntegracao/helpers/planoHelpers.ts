// ============================================================
// HELPERS DO PLANO DE INTEGRAÇÃO COM IDs REAIS
// ============================================================

/**
 * Etapas do Programa de Integração com IDs reais
 * Estrutura: 19 etapas com 95 itens totais
 * Cada item tem: id, titulo, responsavel
 * Cada etapa tem: id, titulo, dia, off (opcional), ajuste (opcional), mais (opcional), itens[]
 */

export interface ItemPlano {
  id: string; // ID real do item (ex: 'pre-00', 'd1-01')
  titulo: string; // Descrição da ação
  responsavel: string; // 'CKM' | 'UGP' | 'Gestor' | 'Anjo' | 'Colaborador'
}

export interface EtapaPlano {
  id: string; // ID único da etapa (ex: 'PRE', 'D1', 'AG1')
  titulo: string;
  dia: number; // Dia após início (pode ser negativo)
  off?: number; // Offset opcional (ex: -1, -7)
  ajuste?: 'prox' | 'ant'; // 'prox' (próximo) ou 'ant' (anterior)
  mais?: number; // Descrição adicional numérica (ex: 1)
  itens: ItemPlano[];
}

// ============================================================
// PLANO REAL COM 19 ETAPAS E 95 ITENS
// ============================================================

export const PLANO_ETAPAS: EtapaPlano[] = [
  // ETAPA 1: PRE (dia 1, off: -1, ajuste: ant)
  {
    id: 'PRE',
    titulo: 'Antes da Chegada',
    dia: 1,
    off: -1,
    ajuste: 'ant',
    itens: [
      { id: 'pre-00', titulo: 'Solicitar Controle à UGP', responsavel: 'CKM' },
      { id: 'pre-01', titulo: 'Admissão/Comunicar treinamento CKM', responsavel: 'UGP' },
      { id: 'pre-02', titulo: 'Preencher Controle', responsavel: 'UGP' },
      { id: 'pre-03', titulo: 'Enviar dados de admissão/chegada', responsavel: 'UGP' },
      { id: 'pre-05', titulo: 'Email início ao gestor + Bem-vindo', responsavel: 'CKM' },
      { id: 'pre-04b', titulo: 'Devolver Bem-vindo', responsavel: 'Gestor' },
      { id: 'pre-06', titulo: 'Email início ao Anjo', responsavel: 'CKM' },
      { id: 'pre-07', titulo: 'Escolher/Orientar Anjo', responsavel: 'Gestor' },
      { id: 'pre-08', titulo: 'Organizar recepção/avisar equipe', responsavel: 'Gestor' },
      { id: 'pre-09', titulo: 'Kit/Manual de boas-vindas', responsavel: 'UGP' },
      { id: 'pre-10', titulo: 'Confirmar ações dia 1/Avaliar Bem', responsavel: 'CKM' },
    ],
  },

  // ETAPA 2: D1 (dia 1)
  {
    id: 'D1',
    titulo: 'Dia 1',
    dia: 1,
    itens: [
      { id: 'd1-01', titulo: 'Receber', responsavel: 'Gestor' },
      { id: 'd1-02', titulo: 'Avisar veteranos', responsavel: 'Gestor' },
      { id: 'd1-04', titulo: 'Boas-vindas UGP fim dia 1', responsavel: 'UGP' },
    ],
  },

  // ETAPA 3: D2 (dia 2)
  {
    id: 'D2',
    titulo: 'Dia 2',
    dia: 2,
    itens: [
      { id: 'd1-03', titulo: 'Preparar/enviar Agenda', responsavel: 'CKM' },
      { id: 'd2-01', titulo: 'Acolher dia 2', responsavel: 'Gestor' },
      { id: 'd2-02', titulo: 'Primeiros contatos/apresentações', responsavel: 'Anjo' },
    ],
  },

  // ETAPA 4: D3 (dia 3)
  {
    id: 'D3',
    titulo: 'Dia 3',
    dia: 3,
    itens: [
      { id: 'd3-01', titulo: 'Liberar Eco BEM + email primeiros passos', responsavel: 'CKM' },
      { id: 'd3-03', titulo: 'Avaliação de Potencial', responsavel: 'Colaborador' },
      { id: 'd3-04', titulo: 'Iniciar Jornada Compliance', responsavel: 'Colaborador' },
    ],
  },

  // ETAPA 5: D4 (dia 4)
  {
    id: 'D4',
    titulo: 'Dia 4',
    dia: 4,
    itens: [
      { id: 'd3-02', titulo: 'Confirmar acesso', responsavel: 'CKM' },
    ],
  },

  // ETAPA 6: SEM1 (dia 7)
  {
    id: 'SEM1',
    titulo: 'Fim de Semana 1',
    dia: 7,
    itens: [
      { id: 'sem1-01', titulo: 'Solicitar registros primeiros dias', responsavel: 'CKM' },
    ],
  },

  // ETAPA 7: AG1 (dia 15, off: -7, ajuste: ant)
  {
    id: 'AG1',
    titulo: 'Agendamento 1',
    dia: 15,
    off: -7,
    ajuste: 'ant',
    itens: [
      { id: 'ag1-00', titulo: 'Preparar mentoria', responsavel: 'CKM' },
      { id: 'ag1-01', titulo: 'Solicitar horários gestor', responsavel: 'CKM' },
      { id: 'ag1-02', titulo: 'Gestor confirmar horário', responsavel: 'Gestor' },
      { id: 'ag1-03', titulo: 'Enviar convite', responsavel: 'CKM' },
    ],
  },

  // ETAPA 8: D15 (dia 15)
  {
    id: 'D15',
    titulo: 'Dia 15',
    dia: 15,
    itens: [
      { id: 'd15-01', titulo: '1º Feedback', responsavel: 'Gestor' },
      { id: 'd15-02', titulo: 'Mediar/Registrar', responsavel: 'CKM' },
      { id: 'd15-03', titulo: '4 Competências Comportamentais', responsavel: 'CKM' },
    ],
  },

  // ETAPA 9: POS1 (dia 15, mais: 1)
  {
    id: 'POS1',
    titulo: 'Pós-Integração 1',
    dia: 15,
    mais: 1,
    itens: [
      { id: 'pos1-01', titulo: 'Ata + Relatório', responsavel: 'CKM' },
      { id: 'pos1-02', titulo: 'Consolidar Potencial', responsavel: 'CKM' },
      { id: 'pos1-03', titulo: 'PDI/Publicar', responsavel: 'CKM' },
      { id: 'pos1-04', titulo: 'Email colaborador PDI + Pesquisa', responsavel: 'CKM' },
      { id: 'pos1-05', titulo: 'Gestor Ata/PDI/Avaliação', responsavel: 'Gestor' },
      { id: 'pos1-06', titulo: 'UGP Ata/Relatório/Potencial/PDI/Bem', responsavel: 'UGP' },
      { id: 'pos1-07', titulo: 'Email Anjo avaliação', responsavel: 'CKM' },
      { id: 'pos1-08', titulo: 'Pesquisa 1', responsavel: 'Colaborador' },
      { id: 'pos1-09', titulo: 'Avaliação Gestor 1', responsavel: 'Gestor' },
      { id: 'pos1-10', titulo: 'Avaliação Anjo 1', responsavel: 'Anjo' },
    ],
  },

  // ETAPA 10: AG2 (dia 45, off: -7, ajuste: ant)
  {
    id: 'AG2',
    titulo: 'Agendamento 2',
    dia: 45,
    off: -7,
    ajuste: 'ant',
    itens: [
      { id: 'ag2-00', titulo: 'Preparar mentoria', responsavel: 'CKM' },
      { id: 'ag2-01', titulo: 'Solicitar horários gestor', responsavel: 'CKM' },
      { id: 'ag2-02', titulo: 'Gestor confirmar horário', responsavel: 'Gestor' },
      { id: 'ag2-03', titulo: 'Enviar convite', responsavel: 'CKM' },
    ],
  },

  // ETAPA 11: D45 (dia 45)
  {
    id: 'D45',
    titulo: 'Dia 45',
    dia: 45,
    itens: [
      { id: 'd45-01', titulo: '2º Feedback', responsavel: 'Gestor' },
      { id: 'd45-02', titulo: 'Atividades/Projetos dias 31-140', responsavel: 'Gestor' },
      { id: 'd45-03', titulo: 'Status PDI', responsavel: 'CKM' },
      { id: 'd45-04', titulo: 'Mediar', responsavel: 'CKM' },
    ],
  },

  // ETAPA 12: POS2 (dia 45, mais: 1)
  {
    id: 'POS2',
    titulo: 'Pós-Integração 2',
    dia: 45,
    mais: 1,
    itens: [
      { id: 'pos2-01', titulo: 'Ata + Relatório', responsavel: 'CKM' },
      { id: 'pos2-02', titulo: 'Relatório acompanhamento PDI/UGP', responsavel: 'CKM' },
      { id: 'pos2-03', titulo: 'Atualizar plano 31-140', responsavel: 'CKM' },
      { id: 'pos2-04', titulo: 'Email colaborador Pesquisa', responsavel: 'CKM' },
      { id: 'pos2-05', titulo: 'Gestor Ata/Avaliação', responsavel: 'Gestor' },
      { id: 'pos2-06', titulo: 'UGP Ata/Relatório/Status/Pendências', responsavel: 'UGP' },
      { id: 'pos2-07', titulo: 'Anjo avaliação', responsavel: 'Anjo' },
      { id: 'pos2-08', titulo: 'Pesquisa 2', responsavel: 'Colaborador' },
      { id: 'pos2-09', titulo: 'Avaliação Gestor 2', responsavel: 'Gestor' },
      { id: 'pos2-10', titulo: 'Avaliação Anjo 2', responsavel: 'Anjo' },
    ],
  },

  // ETAPA 13: D60 (dia 60)
  {
    id: 'D60',
    titulo: 'Dia 60',
    dia: 60,
    itens: [
      { id: 'd60-01', titulo: 'Certificado Anjo', responsavel: 'CKM' },
      { id: 'd60-02', titulo: 'Reconhecer/Agradecer Anjo', responsavel: 'Gestor' },
    ],
  },

  // ETAPA 14: AG3 (dia 75, off: -7, ajuste: ant)
  {
    id: 'AG3',
    titulo: 'Agendamento 3',
    dia: 75,
    off: -7,
    ajuste: 'ant',
    itens: [
      { id: 'ag3-00', titulo: 'Preparar mentoria', responsavel: 'CKM' },
      { id: 'ag3-01', titulo: 'Solicitar horários gestor', responsavel: 'CKM' },
      { id: 'ag3-02', titulo: 'Gestor confirmar horário', responsavel: 'Gestor' },
      { id: 'ag3-03', titulo: 'Enviar convite', responsavel: 'CKM' },
    ],
  },

  // ETAPA 15: D75 (dia 75)
  {
    id: 'D75',
    titulo: 'Dia 75',
    dia: 75,
    itens: [
      { id: 'd75-01', titulo: '3º Feedback com UGP', responsavel: 'Gestor' },
      { id: 'd75-02', titulo: 'Mediar', responsavel: 'CKM' },
      { id: 'd75-03', titulo: 'Celebrar Anjo', responsavel: 'Gestor' },
    ],
  },

  // ETAPA 16: POS3 (dia 75, mais: 1)
  {
    id: 'POS3',
    titulo: 'Pós-Integração 3',
    dia: 75,
    mais: 1,
    itens: [
      { id: 'pos3-01', titulo: 'Ata + Relatório', responsavel: 'CKM' },
      { id: 'pos3-02', titulo: 'Email colaborador Pesquisa', responsavel: 'CKM' },
      { id: 'pos3-03', titulo: 'Gestor Ata/Avaliação', responsavel: 'Gestor' },
      { id: 'pos3-04', titulo: 'UGP Ata/Relatório/Status', responsavel: 'UGP' },
      { id: 'pos3-05', titulo: 'Anjo avaliação', responsavel: 'Anjo' },
      { id: 'pos3-06', titulo: 'Reconhecimento Anjo', responsavel: 'Gestor' },
      { id: 'pos3-07', titulo: 'Enviar avaliações UGP', responsavel: 'CKM' },
      { id: 'pos3-08', titulo: 'Relatório Jornada Compliance', responsavel: 'UGP' },
      { id: 'pos3-09', titulo: 'Pesquisa 3', responsavel: 'Colaborador' },
      { id: 'pos3-10', titulo: 'Avaliação Gestor 3', responsavel: 'Gestor' },
      { id: 'pos3-11', titulo: 'Avaliação Anjo 3', responsavel: 'Anjo' },
      { id: 'pos3-12', titulo: 'Concluir Jornada Compliance', responsavel: 'Colaborador' },
    ],
  },

  // ETAPA 17: AG4 (dia 150, off: -7, ajuste: ant)
  {
    id: 'AG4',
    titulo: 'Agendamento 4',
    dia: 150,
    off: -7,
    ajuste: 'ant',
    itens: [
      { id: 'ag4-00', titulo: 'Preparar mentoria', responsavel: 'CKM' },
      { id: 'ag4-01', titulo: 'Solicitar horários gestor', responsavel: 'CKM' },
      { id: 'ag4-02', titulo: 'Gestor confirmar horário', responsavel: 'Gestor' },
      { id: 'ag4-03', titulo: 'Enviar convite', responsavel: 'CKM' },
    ],
  },

  // ETAPA 18: D150 (dia 150)
  {
    id: 'D150',
    titulo: 'Dia 150',
    dia: 150,
    itens: [
      { id: 'd150-01', titulo: '4º Feedback/Finalizar PDI', responsavel: 'Gestor' },
      { id: 'd150-02', titulo: 'Mediar', responsavel: 'CKM' },
      { id: 'd150-03', titulo: 'Celebrar colaborador', responsavel: 'Gestor' },
    ],
  },

  // ETAPA 19: POS4 (dia 150, mais: 1)
  {
    id: 'POS4',
    titulo: 'Fechamento Final',
    dia: 150,
    mais: 1,
    itens: [
      { id: 'pos4-01', titulo: 'Ata encerramento + Relatório final', responsavel: 'CKM' },
      { id: 'pos4-02', titulo: 'Acompanhar/Finalizar PDI', responsavel: 'CKM' },
      { id: 'pos4-03', titulo: 'Email colaborador encerramento + Pesquisa', responsavel: 'CKM' },
      { id: 'pos4-04', titulo: 'Gestor encerramento/Ata/Avaliação', responsavel: 'Gestor' },
      { id: 'pos4-05', titulo: 'UGP encerramento', responsavel: 'UGP' },
      { id: 'pos4-06', titulo: 'Anjo encerramento/Avaliação', responsavel: 'Anjo' },
      { id: 'pos4-07', titulo: 'Pesquisa 4', responsavel: 'Colaborador' },
      { id: 'pos4-08', titulo: 'Avaliação Gestor 4', responsavel: 'Gestor' },
      { id: 'pos4-09', titulo: 'Avaliação Anjo 4', responsavel: 'Anjo' },
      { id: 'pos4-10', titulo: 'Status final CKM', responsavel: 'CKM' },
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
 * Encontra item pelo ID
 */
export function encontrarItem(itemId: string): ItemPlano | undefined {
  for (const etapa of PLANO_ETAPAS) {
    const item = etapa.itens.find((i) => i.id === itemId);
    if (item) return item;
  }
  return undefined;
}

/**
 * Retorna lista de etapas ordenadas por dia
 */
export function listarEtapasOrdenadas(): EtapaPlano[] {
  return [...PLANO_ETAPAS].sort((a, b) => a.dia - b.dia);
}

/**
 * Retorna todos os itens do plano em uma lista flat
 */
export function listarTodosOsItens(): ItemPlano[] {
  const itens: ItemPlano[] = [];
  for (const etapa of PLANO_ETAPAS) {
    itens.push(...etapa.itens);
  }
  return itens;
}

/**
 * Calcula progresso (0-100%) baseado no número de itens completos
 */
export function calcularProgressoPrograma(
  estadoFeito: Record<string, any>
): number {
  const totalItens = listarTodosOsItens().length;
  const itensConcluidos = listarTodosOsItens().filter((item) => item.id in estadoFeito).length;
  if (totalItens === 0) return 0;
  return Math.round((itensConcluidos / totalItens) * 100);
}

/**
 * Retorna próximo item não marcado
 */
export function proximoItemNaoMarcado(
  estadoFeito: Record<string, any>
): ItemPlano | undefined {
  const itens = listarTodosOsItens();
  for (const item of itens) {
    if (!(item.id in estadoFeito)) {
      return item;
    }
  }
  return undefined;
}

/**
 * Retorna estatísticas do plano
 */
export function getEstatisticasPlano() {
  const totalItens = listarTodosOsItens().length;
  const responsaveis = new Set(listarTodosOsItens().map((i) => i.responsavel));
  
  return {
    totalEtapas: PLANO_ETAPAS.length,
    totalItens,
    totalResponsaveis: responsaveis.size,
    responsaveisUnicos: Array.from(responsaveis),
  };
}

