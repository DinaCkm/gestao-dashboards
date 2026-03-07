/**
 * Calculador de Indicadores v2 - Lógica Simplificada
 * 
 * 7 Indicadores POR CICLO (em andamento e finalizado separados):
 * 
 * 1. Webinars/Aulas Online: Presente=100, Ausente=0, média das presenças
 * 2. Performance nas Avaliações: Soma notas provas / nº provas REALIZADAS (nunca pelo total)
 * 3. Performance nas Competências: % competências/cursos finalizados por ciclo
 * 4. Tarefas Práticas: Entregue=100, Não entregue=0, média das entregas
 * 5. Engajamento (Nota da Mentora): Média notas 0-100 por sessão
 * 6. Aplicabilidade Prática (Case de Sucesso): Informativo apenas (não entra na média). Quem entrega recebe +10% no Ind. 5 (limitado a 100)
 * 7. Engajamento Final: Média dos 5 indicadores (1 a 5), POR CICLO
 */

import { MentoringRecord, EventRecord, PerformanceRecord } from './excelProcessor';

// ============================================================
// TIPOS
// ============================================================

export type CicloStatusV2 = 'finalizado' | 'em_andamento' | 'futuro';

/**
 * Indicadores calculados para um ciclo específico
 */
export interface IndicadoresCiclo {
  cicloId: number;
  nomeCiclo: string;
  trilhaNome: string;
  status: CicloStatusV2;
  dataInicio: string;
  dataFim: string;
  
  // 7 Indicadores (base 0-100)
  ind1_webinars: number;            // Webinars/Aulas Online
  ind2_avaliacoes: number;          // Performance nas Avaliações
  ind3_competencias: number;        // Performance nas Competências
  ind4_tarefas: number;             // Tarefas Práticas
  ind5_engajamento: number;         // Engajamento (Nota Mentora)
  ind6_aplicabilidade: number;      // Aplicabilidade Prática (Case)
  ind7_engajamentoFinal: number;    // Média dos 6 acima
  
  // Dados brutos para detalhamento
  detalhes: {
    webinars: { total: number; presentes: number };
    avaliacoes: { provasRealizadas: number; somaNotas: number };
    competencias: { total: number; finalizadas: number; emAndamento: number; competenciasDetalhe: CompetenciaDetalhe[] };
    tarefas: { total: number; entregues: number };
    engajamento: { sessoes: number; somaNotas: number };
    case: { entregue: boolean; obrigatorio: boolean }; // obrigatorio = macrociclo finalizado
  };
  
  // Todas as competências (obrigatórias + opcionais) para exibição
  allCompetenciaIds?: number[];
  
  // Classificação
  classificacao: string;
}

export interface CompetenciaDetalhe {
  competenciaId: number;
  nome: string;
  aulasConcluidas: number;
  aulasDisponiveis: number;
  notaAvaliacao: number | null;
  concluida: boolean;
}

/**
 * Indicadores consolidados de um aluno
 */
export interface StudentIndicatorsV2 {
  idUsuario: string;
  nomeAluno: string;
  empresa: string;
  turma?: string;
  trilha?: string;
  
  // Indicadores por ciclo
  ciclosFinalizados: IndicadoresCiclo[];
  ciclosEmAndamento: IndicadoresCiclo[];
  
  // Indicadores consolidados (média de todos os ciclos finalizados + em andamento)
  consolidado: IndicadoresCiclo; // Resumo geral
  
  // Compatibilidade com v1
  participacaoMentorias: number;
  atividadesPraticas: number;
  engajamento: number;
  performanceCompetencias: number;
  performanceAprendizado: number;
  participacaoEventos: number;
  performanceGeral: number;
  classificacao: string;
  notaFinal: number;
  
  // Dados brutos para compatibilidade
  totalMentorias: number;
  mentoriasPresente: number;
  totalAtividades: number;
  atividadesEntregues: number;
  totalEventos: number;
  eventosPresente: number;
  totalCompetencias: number;
  competenciasAprovadas: number;
  mediaEngajamentoRaw: number;
  engajamentoComponentes: {
    presenca: number;
    atividades: number;
    notaMentora: number;
  };
  ciclosFinalizadosLegacy: any[];
  ciclosEmAndamentoLegacy: any[];
  
  // Alerta de case pendente
  alertaCasePendente: {
    ativo: boolean;
    trilhaId: number | null;
    trilhaNome: string;
    diasRestantes: number;
    dataLimite: string;
  }[];
}

/**
 * Dados de case de sucesso por aluno/trilha
 */
export interface CaseSucessoData {
  alunoId: number;
  trilhaId: number | null;
  trilhaNome: string | null;
  entregue: boolean;
}

/**
 * Dados de ciclo para o calculador
 */
export interface CicloDataV2 {
  id: number;
  nomeCiclo: string;
  trilhaNome: string;
  dataInicio: string;
  dataFim: string;
  competenciaIds: number[];
  allCompetenciaIds?: number[]; // Todas as competências (obrigatórias + opcionais) para exibição
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

export function classificarPercentual(percentual: number): string {
  if (percentual >= 90) return 'Excelência';
  if (percentual >= 70) return 'Avançado';
  if (percentual >= 50) return 'Intermediário';
  if (percentual >= 30) return 'Básico';
  return 'Inicial';
}

export function classificarNota(nota: number): string {
  if (nota >= 9) return 'Excelência';
  if (nota >= 7) return 'Avançado';
  if (nota >= 5) return 'Intermediário';
  if (nota >= 3) return 'Básico';
  return 'Inicial';
}

export function determinarStatusCiclo(dataInicio: string, dataFim: string, hoje?: Date): CicloStatusV2 {
  const now = hoje || new Date();
  const inicio = new Date(dataInicio + 'T00:00:00');
  const fim = new Date(dataFim + 'T23:59:59');
  
  if (now > fim) return 'finalizado';
  if (now >= inicio && now <= fim) return 'em_andamento';
  return 'futuro';
}

function diasEntre(data1: string, data2: Date): number {
  const d1 = new Date(data1 + 'T00:00:00');
  return Math.ceil((d1.getTime() - data2.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================================
// CALCULADOR PRINCIPAL
// ============================================================

/**
 * Calcula os 7 indicadores de um aluno para um ciclo específico
 */
export function calcularIndicadoresCiclo(
  idUsuario: string,
  ciclo: CicloDataV2,
  mentorias: MentoringRecord[],
  eventos: EventRecord[],
  performance: PerformanceRecord[],
  compIdToCodigoMap: Map<number, string>,
  casesData: CaseSucessoData[],
  hoje?: Date
): IndicadoresCiclo {
  const status = determinarStatusCiclo(ciclo.dataInicio, ciclo.dataFim, hoje);
  
  // Filtrar registros do aluno E pelo período do ciclo
  const cicloInicio = new Date(ciclo.dataInicio + 'T00:00:00');
  const cicloFim = new Date(ciclo.dataFim + 'T23:59:59');
  
  const mentoriasAluno = mentorias.filter(m => {
    if (m.idUsuario !== idUsuario) return false;
    // Se tem data da sessão, filtrar pelo período do ciclo
    if (m.dataSessao) {
      const dataSessao = new Date(m.dataSessao);
      return dataSessao >= cicloInicio && dataSessao <= cicloFim;
    }
    // Se não tem data, incluir (fallback para dados antigos sem data)
    return true;
  });
  
  const eventosAluno = eventos.filter(e => {
    if (e.idUsuario !== idUsuario) return false;
    // Se tem data do evento, filtrar pelo período do ciclo
    if (e.dataEvento) {
      const dataEvento = new Date(e.dataEvento);
      return dataEvento >= cicloInicio && dataEvento <= cicloFim;
    }
    // Se não tem data, incluir (fallback para dados antigos sem data)
    return true;
  });
  
  const performanceAluno = performance.filter(p => p.idUsuario === idUsuario);
  
  // ============================================================
  // IND 1: Webinars/Aulas Online
  // Presente = 100, Ausente = 0, média das presenças
  // Usa eventos (webinars) do aluno
  // ============================================================
  const totalWebinars = eventosAluno.length;
  const webinarsPresente = eventosAluno.filter(e => e.presenca === 'presente').length;
  const ind1_webinars = totalWebinars > 0 
    ? (webinarsPresente / totalWebinars) * 100 
    : 0;
  
  // ============================================================
  // IND 2: Performance nas Avaliações
  // Soma notas provas / nº provas REALIZADAS (nunca pelo total)
  // Escala: notas das provas estão em 0-100
  // ============================================================
  let somaNotasProvas = 0;
  let provasRealizadas = 0;
  
  for (const compId of ciclo.competenciaIds) {
    const codigo = compIdToCodigoMap.get(compId);
    const perfComp = performanceAluno.find(p => {
      if (codigo) {
        return p.idCompetencia === codigo || 
               p.idCompetencia?.toLowerCase() === codigo.toLowerCase() ||
               p.nomeCompetencia?.toLowerCase()?.includes(codigo.toLowerCase());
      }
      return p.idCompetencia === String(compId);
    });
    
    if (perfComp && perfComp.notaAvaliacao !== undefined && perfComp.notaAvaliacao >= 0) {
      // Nota está em escala 0-10, converter para 0-100
      somaNotasProvas += perfComp.notaAvaliacao * 10;
      provasRealizadas++;
    }
  }
  
  // Dividir APENAS pelo número de provas realizadas, nunca pelo total
  const ind2_avaliacoes = provasRealizadas > 0 
    ? somaNotasProvas / provasRealizadas 
    : 0;
  
  // ============================================================
  // IND 3: Performance nas Competências
  // % competências/cursos finalizados por ciclo
  // Finalizado = todas as aulas disponíveis concluídas
  // ============================================================
  let totalComps = ciclo.competenciaIds.length;
  let compsFinalizadas = 0;
  let compsEmAndamento = 0;
  const competenciasDetalhe: CompetenciaDetalhe[] = [];
  
  for (const compId of ciclo.competenciaIds) {
    const codigo = compIdToCodigoMap.get(compId);
    const perfComp = performanceAluno.find(p => {
      if (codigo) {
        return p.idCompetencia === codigo || 
               p.idCompetencia?.toLowerCase() === codigo.toLowerCase() ||
               p.nomeCompetencia?.toLowerCase()?.includes(codigo.toLowerCase());
      }
      return p.idCompetencia === String(compId);
    }) as any;
    
    const aulasConcluidas = perfComp?.aulasConcluidas || 0;
    const aulasDisponiveis = perfComp?.aulasDisponiveis || 0;
    const concluida = aulasDisponiveis > 0 && aulasConcluidas >= aulasDisponiveis;
    const notaAvaliacao = perfComp?.notaAvaliacao !== undefined && perfComp?.notaAvaliacao >= 0 
      ? perfComp.notaAvaliacao * 10 : null;
    
    if (concluida) compsFinalizadas++;
    else if (aulasConcluidas > 0) compsEmAndamento++;
    
    competenciasDetalhe.push({
      competenciaId: compId,
      nome: perfComp?.nomeCompetencia || codigo || `Comp ${compId}`,
      aulasConcluidas,
      aulasDisponiveis,
      notaAvaliacao,
      concluida,
    });
  }
  
  const ind3_competencias = totalComps > 0 
    ? (compsFinalizadas / totalComps) * 100 
    : 0;
  
  // ============================================================
  // IND 4: Tarefas Práticas
  // Entregue = 100, Não entregue = 0, média das entregas
  // Usa dados de mentorias (atividades entregues)
  // ============================================================
  const atividadesComTarefa = mentoriasAluno.filter(m => m.atividadeEntregue !== 'sem_tarefa');
  const totalTarefas = atividadesComTarefa.length;
  const tarefasEntregues = atividadesComTarefa.filter(m => m.atividadeEntregue === 'entregue').length;
  const ind4_tarefas = totalTarefas > 0 
    ? (tarefasEntregues / totalTarefas) * 100 
    : 0;
  
  // ============================================================
  // IND 5: Engajamento (Nota da Mentora)
  // Média das notas 0-100 por sessão
  // Nota original é 0-10, converter para 0-100
  // BÔNUS: Se o aluno entregou o Case de Sucesso da trilha, +10% (limitado a 100)
  // ============================================================
  const notasEngajamento = mentoriasAluno
    .filter(m => m.engajamento !== undefined && m.engajamento !== null)
    .map(m => m.engajamento!);
  const totalSessoesEngajamento = notasEngajamento.length;
  const somaEngajamento = notasEngajamento.reduce((a, b) => a + b, 0);
  // Converter de 0-10 para 0-100
  let ind5_engajamento_base = totalSessoesEngajamento > 0 
    ? (somaEngajamento / totalSessoesEngajamento) * 10 
    : 0;
  
  // ============================================================
  // IND 6: Aplicabilidade Prática (Case de Sucesso)
  // Campo INFORMATIVO apenas — NÃO entra na média dos indicadores
  // Quem entrega o case recebe +10% no Ind. 5 (Engajamento), limitado a 100
  // ============================================================
  const isMacrocicloFinalizado = status === 'finalizado';
  const caseAluno = casesData.find(c => 
    c.trilhaNome?.toLowerCase() === ciclo.trilhaNome?.toLowerCase()
  );
  const caseEntregue = caseAluno?.entregue || false;
  const caseObrigatorio = isMacrocicloFinalizado; // Informativo: macrociclo finalizado
  
  let ind6_aplicabilidade = 0;
  if (caseObrigatorio) {
    ind6_aplicabilidade = caseEntregue ? 100 : 0;
  }
  
  // Aplicar bônus de +10% no Ind. 5 se o case foi entregue (limitado a 100)
  let ind5_engajamento = ind5_engajamento_base;
  if (caseEntregue && ind5_engajamento_base > 0) {
    ind5_engajamento = Math.min(100, ind5_engajamento_base * 1.10);
  }
  
  // ============================================================
  // IND 7: Engajamento Final
  // Média dos 5 indicadores (1 a 5), POR CICLO
  // Case NÃO entra na média — é apenas bônus no Ind. 5
  // ============================================================
  const somaIndicadores = ind1_webinars + ind2_avaliacoes + ind3_competencias + ind4_tarefas + ind5_engajamento;
  const numIndicadores = 5;
  
  const ind7_engajamentoFinal = numIndicadores > 0 
    ? somaIndicadores / numIndicadores 
    : 0;
  
  return {
    cicloId: ciclo.id,
    nomeCiclo: ciclo.nomeCiclo,
    trilhaNome: ciclo.trilhaNome,
    status,
    dataInicio: ciclo.dataInicio,
    dataFim: ciclo.dataFim,
    
    ind1_webinars: Math.round(ind1_webinars * 100) / 100,
    ind2_avaliacoes: Math.round(ind2_avaliacoes * 100) / 100,
    ind3_competencias: Math.round(ind3_competencias * 100) / 100,
    ind4_tarefas: Math.round(ind4_tarefas * 100) / 100,
    ind5_engajamento: Math.round(ind5_engajamento * 100) / 100,
    ind6_aplicabilidade: Math.round(ind6_aplicabilidade * 100) / 100,
    ind7_engajamentoFinal: Math.round(ind7_engajamentoFinal * 100) / 100,
    
    detalhes: {
      webinars: { total: totalWebinars, presentes: webinarsPresente },
      avaliacoes: { provasRealizadas, somaNotas: somaNotasProvas },
      competencias: { total: totalComps, finalizadas: compsFinalizadas, emAndamento: compsEmAndamento, competenciasDetalhe },
      tarefas: { total: totalTarefas, entregues: tarefasEntregues },
      engajamento: { sessoes: totalSessoesEngajamento, somaNotas: somaEngajamento },
      case: { entregue: caseEntregue, obrigatorio: caseObrigatorio },
    },
    
    allCompetenciaIds: ciclo.allCompetenciaIds || ciclo.competenciaIds,
    classificacao: classificarPercentual(ind7_engajamentoFinal),
  };
}

/**
 * Calcula indicadores de um aluno para TODOS os seus ciclos
 */
export function calcularIndicadoresAluno(
  idUsuario: string,
  mentorias: MentoringRecord[],
  eventos: EventRecord[],
  performance: PerformanceRecord[],
  ciclos: CicloDataV2[],
  compIdToCodigoMap: Map<number, string>,
  casesData: CaseSucessoData[],
  hoje?: Date
): StudentIndicatorsV2 {
  // Filtrar registros do aluno
  const mentoriasAluno = mentorias.filter(m => m.idUsuario === idUsuario);
  const eventosAluno = eventos.filter(e => e.idUsuario === idUsuario);
  
  // Dados básicos
  const primeiroRegistro = mentoriasAluno[0] || eventosAluno[0];
  const nomeAluno = primeiroRegistro?.nomeAluno || 'Desconhecido';
  const empresa = primeiroRegistro?.empresa || 'Desconhecida';
  const turma = mentoriasAluno[0]?.turma || eventosAluno[0]?.turma;
  const trilha = mentoriasAluno[0]?.trilha || eventosAluno[0]?.trilha;
  
  // Calcular indicadores por ciclo
  const todosCiclos: IndicadoresCiclo[] = [];
  const ciclosFinalizados: IndicadoresCiclo[] = [];
  const ciclosEmAndamento: IndicadoresCiclo[] = [];
  
  for (const ciclo of ciclos) {
    const indicadoresCiclo = calcularIndicadoresCiclo(
      idUsuario, ciclo, mentorias, eventos, performance, compIdToCodigoMap, casesData, hoje
    );
    
    if (indicadoresCiclo.status === 'futuro') continue; // Ignorar ciclos futuros
    
    todosCiclos.push(indicadoresCiclo);
    
    // Ciclos com competenciaIds vazio (apenas opcionais) são mantidos para exibição
    // mas NÃO entram no cálculo consolidado dos indicadores
    const temObrigatorias = ciclo.competenciaIds.length > 0;
    
    if (indicadoresCiclo.status === 'finalizado') {
      ciclosFinalizados.push(indicadoresCiclo);
    } else {
      ciclosEmAndamento.push(indicadoresCiclo);
    }
  }
  
  // Consolidar: média apenas dos ciclos FINALIZADOS que têm competências obrigatórias
  // Ciclos com apenas opcionais (competenciaIds vazio) não entram no cálculo
  // Ciclos em andamento não entram no consolidado (label = "Todos os ciclos finalizados")
  const ciclosFinalizadosComObrig = ciclosFinalizados
    .filter(c => {
      const cicloOriginal = ciclos.find(co => co.nomeCiclo === c.nomeCiclo);
      return cicloOriginal ? cicloOriginal.competenciaIds.length > 0 : true;
    });
  // Se não há finalizados com obrigatórias, usar todos (finalizados + em andamento) como fallback
  const ciclosParaConsolidar = ciclosFinalizadosComObrig.length > 0
    ? ciclosFinalizadosComObrig
    : [...ciclosFinalizados, ...ciclosEmAndamento].filter(c => {
        const cicloOriginal = ciclos.find(co => co.nomeCiclo === c.nomeCiclo);
        return cicloOriginal ? cicloOriginal.competenciaIds.length > 0 : true;
      });
  const consolidado = consolidarCiclos(ciclosParaConsolidar, trilha || 'Geral');
  
  // Alertas de case pendente (deduplicado por trilhaNome)
  const alertaCasePendente: { ativo: boolean; trilhaId: number | null; trilhaNome: string; diasRestantes: number; dataLimite: string }[] = [];
  const now = hoje || new Date();
  const trilhasAlertadas = new Set<string>();
  
  for (const ciclo of ciclosEmAndamento) {
    const diasRestantes = diasEntre(ciclo.dataFim, now);
    const trilhaKey = ciclo.trilhaNome?.toLowerCase() || '';
    // Deduplicar: apenas 1 alerta por trilha
    if (trilhasAlertadas.has(trilhaKey)) continue;
    // Alertar se faltam 30 dias ou menos para o fim do ciclo
    if (diasRestantes <= 30 && diasRestantes > 0) {
      const caseAluno = casesData.find(c => 
        c.trilhaNome?.toLowerCase() === trilhaKey
      );
      if (!caseAluno?.entregue) {
        trilhasAlertadas.add(trilhaKey);
        alertaCasePendente.push({
          ativo: true,
          trilhaId: null, // Will be resolved in the endpoint with trilhaNome -> trilhaId mapping
          trilhaNome: ciclo.trilhaNome,
          diasRestantes,
          dataLimite: ciclo.dataFim,
        });
      }
    }
  }
  
  // Dados brutos para compatibilidade v1
  const totalMentorias = mentoriasAluno.length;
  const mentoriasPresente = mentoriasAluno.filter(m => m.presenca === 'presente').length;
  const atividadesComTarefa = mentoriasAluno.filter(m => m.atividadeEntregue !== 'sem_tarefa');
  const totalAtividades = atividadesComTarefa.length;
  const atividadesEntregues = atividadesComTarefa.filter(m => m.atividadeEntregue === 'entregue').length;
  const totalEventos = eventosAluno.length;
  const eventosPresente = eventosAluno.filter(e => e.presenca === 'presente').length;
  const notasEng = mentoriasAluno
    .filter(m => m.engajamento !== undefined && m.engajamento !== null)
    .map(m => m.engajamento!);
  const mediaEngRaw = notasEng.length > 0 ? notasEng.reduce((a, b) => a + b, 0) / notasEng.length : 0;
  
  // Compatibilidade v1: mapear novos indicadores para campos antigos
  const participacaoMentorias = consolidado.ind1_webinars;
  const atividadesPraticas = consolidado.ind4_tarefas;
  const engajamento = consolidado.ind5_engajamento;
  const performanceCompetencias = consolidado.ind3_competencias;
  const performanceAprendizado = consolidado.ind2_avaliacoes;
  const participacaoEventos = consolidado.ind1_webinars; // Webinars = Eventos
  const performanceGeral = consolidado.ind7_engajamentoFinal;
  
  return {
    idUsuario,
    nomeAluno,
    empresa,
    turma,
    trilha,
    
    ciclosFinalizados,
    ciclosEmAndamento,
    consolidado,
    
    // Compatibilidade v1
    participacaoMentorias,
    atividadesPraticas,
    engajamento,
    performanceCompetencias,
    performanceAprendizado,
    participacaoEventos,
    performanceGeral,
    classificacao: consolidado.classificacao,
    notaFinal: consolidado.ind7_engajamentoFinal / 10, // Escala 0-10
    
    totalMentorias,
    mentoriasPresente,
    totalAtividades,
    atividadesEntregues,
    totalEventos,
    eventosPresente,
    totalCompetencias: consolidado.detalhes.competencias.total,
    competenciasAprovadas: consolidado.detalhes.competencias.finalizadas,
    mediaEngajamentoRaw: mediaEngRaw,
    engajamentoComponentes: {
      presenca: participacaoMentorias,
      atividades: atividadesPraticas,
      notaMentora: engajamento,
    },
    ciclosFinalizadosLegacy: ciclosFinalizados,
    ciclosEmAndamentoLegacy: ciclosEmAndamento,
    
    alertaCasePendente,
  };
}

/**
 * Consolida indicadores de múltiplos ciclos em um resumo
 */
function consolidarCiclos(ciclos: IndicadoresCiclo[], trilhaNome: string): IndicadoresCiclo {
  if (ciclos.length === 0) {
    return {
      cicloId: 0,
      nomeCiclo: 'Consolidado',
      trilhaNome,
      status: 'em_andamento',
      dataInicio: '',
      dataFim: '',
      ind1_webinars: 0,
      ind2_avaliacoes: 0,
      ind3_competencias: 0,
      ind4_tarefas: 0,
      ind5_engajamento: 0,
      ind6_aplicabilidade: 0,
      ind7_engajamentoFinal: 0,
      detalhes: {
        webinars: { total: 0, presentes: 0 },
        avaliacoes: { provasRealizadas: 0, somaNotas: 0 },
        competencias: { total: 0, finalizadas: 0, emAndamento: 0, competenciasDetalhe: [] },
        tarefas: { total: 0, entregues: 0 },
        engajamento: { sessoes: 0, somaNotas: 0 },
        case: { entregue: false, obrigatorio: false },
      },
      classificacao: 'Inicial',
    };
  }
  
  const n = ciclos.length;
  const avg = (field: keyof IndicadoresCiclo) => {
    const sum = ciclos.reduce((s, c) => s + (c[field] as number), 0);
    return Math.round((sum / n) * 100) / 100;
  };
  
  // Somar detalhes
  const totalWebinars = ciclos.reduce((s, c) => s + c.detalhes.webinars.total, 0);
  const totalPresentes = ciclos.reduce((s, c) => s + c.detalhes.webinars.presentes, 0);
  const totalProvas = ciclos.reduce((s, c) => s + c.detalhes.avaliacoes.provasRealizadas, 0);
  const somaNotas = ciclos.reduce((s, c) => s + c.detalhes.avaliacoes.somaNotas, 0);
  const totalComps = ciclos.reduce((s, c) => s + c.detalhes.competencias.total, 0);
  const compsFinalizadas = ciclos.reduce((s, c) => s + c.detalhes.competencias.finalizadas, 0);
  const compsEmAndamento = ciclos.reduce((s, c) => s + c.detalhes.competencias.emAndamento, 0);
  const totalTarefas = ciclos.reduce((s, c) => s + c.detalhes.tarefas.total, 0);
  const tarefasEntregues = ciclos.reduce((s, c) => s + c.detalhes.tarefas.entregues, 0);
  const totalSessoes = ciclos.reduce((s, c) => s + c.detalhes.engajamento.sessoes, 0);
  const somaEng = ciclos.reduce((s, c) => s + c.detalhes.engajamento.somaNotas, 0);
  const allCompsDetalhe = ciclos.flatMap(c => c.detalhes.competencias.competenciasDetalhe);
  const algumCaseEntregue = ciclos.some(c => c.detalhes.case.entregue);
  const algumCaseObrigatorio = ciclos.some(c => c.detalhes.case.obrigatorio);
  
  // Ind. 1 e Ind. 4: calculados pelo MACROCICLO (totais somados, não média por microciclo)
  const consolidadoInd1 = totalWebinars > 0 ? Math.round((totalPresentes / totalWebinars) * 100 * 100) / 100 : 0;
  const consolidadoInd4 = totalTarefas > 0 ? Math.round((tarefasEntregues / totalTarefas) * 100 * 100) / 100 : 0;
  const consolidadoInd2 = avg('ind2_avaliacoes');
  const consolidadoInd3 = avg('ind3_competencias');
  const consolidadoInd5 = avg('ind5_engajamento');
  
  // Ind. 7: recalcular com os valores consolidados corretos (macrociclo para ind1/ind4)
  const ind7 = Math.round(((consolidadoInd1 + consolidadoInd2 + consolidadoInd3 + consolidadoInd4 + consolidadoInd5) / 5) * 100) / 100;
  
  return {
    cicloId: 0,
    nomeCiclo: 'Consolidado',
    trilhaNome,
    status: ciclos.every(c => c.status === 'finalizado') ? 'finalizado' : 'em_andamento',
    dataInicio: ciclos[0]?.dataInicio || '',
    dataFim: ciclos[ciclos.length - 1]?.dataFim || '',
    ind1_webinars: consolidadoInd1,
    ind2_avaliacoes: consolidadoInd2,
    ind3_competencias: consolidadoInd3,
    ind4_tarefas: consolidadoInd4,
    ind5_engajamento: consolidadoInd5,
    ind6_aplicabilidade: avg('ind6_aplicabilidade'),
    ind7_engajamentoFinal: ind7,
    detalhes: {
      webinars: { total: totalWebinars, presentes: totalPresentes },
      avaliacoes: { provasRealizadas: totalProvas, somaNotas },
      competencias: { total: totalComps, finalizadas: compsFinalizadas, emAndamento: compsEmAndamento, competenciasDetalhe: allCompsDetalhe },
      tarefas: { total: totalTarefas, entregues: tarefasEntregues },
      engajamento: { sessoes: totalSessoes, somaNotas: somaEng },
      case: { entregue: algumCaseEntregue, obrigatorio: algumCaseObrigatorio },
    },
    classificacao: classificarPercentual(ind7),
  };
}

// ============================================================
// FUNÇÕES DE AGREGAÇÃO (para dashboards gerais)
// ============================================================

export interface AggregatedIndicatorsV2 {
  nivel: 'geral' | 'empresa' | 'turma';
  identificador: string;
  
  // Médias dos 7 indicadores
  mediaInd1: number;
  mediaInd2: number;
  mediaInd3: number;
  mediaInd4: number;
  mediaInd5: number;
  mediaInd6: number;
  mediaInd7: number;
  
  // Compatibilidade v1
  mediaParticipacaoMentorias: number;
  mediaAtividadesPraticas: number;
  mediaEngajamento: number;
  mediaPerformanceCompetencias: number;
  mediaPerformanceAprendizado: number;
  mediaParticipacaoEventos: number;
  mediaPerformanceGeral: number;
  mediaNotaFinal: number;
  
  totalAlunos: number;
  alunosExcelencia: number;
  alunosAvancado: number;
  alunosIntermediario: number;
  alunosBasico: number;
  alunosInicial: number;
  distribuicaoClassificacao: { nome: string; quantidade: number; percentual: number }[];
}

export function agregarIndicadores(
  indicadoresAlunos: StudentIndicatorsV2[],
  nivel: 'geral' | 'empresa' | 'turma',
  filtro?: string
): AggregatedIndicatorsV2 {
  let alunosFiltrados = indicadoresAlunos;
  let identificador = 'Geral';

  if (nivel === 'empresa' && filtro) {
    alunosFiltrados = indicadoresAlunos.filter(a => a.empresa === filtro);
    identificador = filtro;
  } else if (nivel === 'turma' && filtro) {
    alunosFiltrados = indicadoresAlunos.filter(a => a.turma === filtro);
    identificador = filtro;
  }

  const totalAlunos = alunosFiltrados.length;

  if (totalAlunos === 0) {
    return {
      nivel, identificador,
      mediaInd1: 0, mediaInd2: 0, mediaInd3: 0, mediaInd4: 0, mediaInd5: 0, mediaInd6: 0, mediaInd7: 0,
      mediaParticipacaoMentorias: 0, mediaAtividadesPraticas: 0, mediaEngajamento: 0,
      mediaPerformanceCompetencias: 0, mediaPerformanceAprendizado: 0, mediaParticipacaoEventos: 0,
      mediaPerformanceGeral: 0, mediaNotaFinal: 0,
      totalAlunos: 0, alunosExcelencia: 0, alunosAvancado: 0, alunosIntermediario: 0,
      alunosBasico: 0, alunosInicial: 0, distribuicaoClassificacao: [],
    };
  }

  const avg = (fn: (a: StudentIndicatorsV2) => number) => 
    alunosFiltrados.reduce((s, a) => s + fn(a), 0) / totalAlunos;

  const mediaInd1 = avg(a => a.consolidado.ind1_webinars);
  const mediaInd2 = avg(a => a.consolidado.ind2_avaliacoes);
  const mediaInd3 = avg(a => a.consolidado.ind3_competencias);
  const mediaInd4 = avg(a => a.consolidado.ind4_tarefas);
  const mediaInd5 = avg(a => a.consolidado.ind5_engajamento);
  const mediaInd6 = avg(a => a.consolidado.ind6_aplicabilidade);
  const mediaInd7 = avg(a => a.consolidado.ind7_engajamentoFinal);

  const alunosExcelencia = alunosFiltrados.filter(a => a.classificacao === 'Excelência').length;
  const alunosAvancado = alunosFiltrados.filter(a => a.classificacao === 'Avançado').length;
  const alunosIntermediario = alunosFiltrados.filter(a => a.classificacao === 'Intermediário').length;
  const alunosBasico = alunosFiltrados.filter(a => a.classificacao === 'Básico').length;
  const alunosInicial = alunosFiltrados.filter(a => a.classificacao === 'Inicial').length;

  return {
    nivel, identificador,
    mediaInd1, mediaInd2, mediaInd3, mediaInd4, mediaInd5, mediaInd6, mediaInd7,
    // Compatibilidade v1
    mediaParticipacaoMentorias: mediaInd1,
    mediaAtividadesPraticas: mediaInd4,
    mediaEngajamento: mediaInd5,
    mediaPerformanceCompetencias: mediaInd3,
    mediaPerformanceAprendizado: mediaInd2,
    mediaParticipacaoEventos: mediaInd1,
    mediaPerformanceGeral: mediaInd7,
    mediaNotaFinal: mediaInd7 / 10,
    totalAlunos,
    alunosExcelencia, alunosAvancado, alunosIntermediario, alunosBasico, alunosInicial,
    distribuicaoClassificacao: [
      { nome: 'Excelência', quantidade: alunosExcelencia, percentual: (alunosExcelencia / totalAlunos) * 100 },
      { nome: 'Avançado', quantidade: alunosAvancado, percentual: (alunosAvancado / totalAlunos) * 100 },
      { nome: 'Intermediário', quantidade: alunosIntermediario, percentual: (alunosIntermediario / totalAlunos) * 100 },
      { nome: 'Básico', quantidade: alunosBasico, percentual: (alunosBasico / totalAlunos) * 100 },
      { nome: 'Inicial', quantidade: alunosInicial, percentual: (alunosInicial / totalAlunos) * 100 },
    ],
  };
}

// ============================================================
// FUNÇÕES DE CONVENIÊNCIA
// ============================================================

/**
 * Calcula indicadores para TODOS os alunos
 */
export function calcularIndicadoresTodosAlunos(
  mentorias: MentoringRecord[],
  eventos: EventRecord[],
  performance: PerformanceRecord[],
  ciclosPorAluno: Map<string, CicloDataV2[]>,
  compIdToCodigoMap: Map<number, string>,
  casesData: CaseSucessoData[],
  hoje?: Date
): StudentIndicatorsV2[] {
  // Coletar todos os IDs únicos
  const idsUsuarios = new Set<string>();
  mentorias.forEach(m => idsUsuarios.add(m.idUsuario));
  eventos.forEach(e => idsUsuarios.add(e.idUsuario));
  performance.forEach(p => idsUsuarios.add(p.idUsuario));
  
  const resultados: StudentIndicatorsV2[] = [];
  
  for (const idUsuario of Array.from(idsUsuarios)) {
    const ciclosAluno = ciclosPorAluno.get(idUsuario) || [];
    const casesAluno = casesData.filter(c => c.trilhaNome !== null); // Filter valid cases
    
    const indicadores = calcularIndicadoresAluno(
      idUsuario, mentorias, eventos, performance, ciclosAluno, compIdToCodigoMap, casesAluno, hoje
    );
    
    resultados.push(indicadores);
  }
  
  return resultados;
}

export function obterEmpresas(indicadores: StudentIndicatorsV2[]): string[] {
  const empresas: string[] = [];
  indicadores.forEach(i => {
    if (!empresas.includes(i.empresa)) empresas.push(i.empresa);
  });
  return empresas.sort();
}

export function obterTurmas(indicadores: StudentIndicatorsV2[], empresa?: string): string[] {
  let filtrados = indicadores;
  if (empresa) {
    filtrados = indicadores.filter(i => i.empresa === empresa);
  }
  const turmasSet: string[] = [];
  filtrados.forEach(i => {
    if (i.turma && !turmasSet.includes(i.turma)) {
      turmasSet.push(i.turma);
    }
  });
  return turmasSet.sort();
}

export function gerarDashboardGeral(indicadores: StudentIndicatorsV2[]): {
  visaoGeral: AggregatedIndicatorsV2;
  porEmpresa: AggregatedIndicatorsV2[];
  topAlunos: StudentIndicatorsV2[];
  alunosAtencao: StudentIndicatorsV2[];
} {
  const visaoGeral = agregarIndicadores(indicadores, 'geral');
  const empresas = obterEmpresas(indicadores);
  const porEmpresa = empresas.map(emp => agregarIndicadores(indicadores, 'empresa', emp));
  const topAlunos = [...indicadores].sort((a, b) => b.notaFinal - a.notaFinal).slice(0, 10);
  const alunosAtencao = indicadores.filter(a => a.notaFinal < 5).sort((a, b) => a.notaFinal - b.notaFinal).slice(0, 10);
  return { visaoGeral, porEmpresa, topAlunos, alunosAtencao };
}

export function gerarDashboardEmpresa(
  indicadores: StudentIndicatorsV2[], 
  empresa: string
): {
  visaoEmpresa: AggregatedIndicatorsV2;
  porTurma: AggregatedIndicatorsV2[];
  alunos: StudentIndicatorsV2[];
} {
  const visaoEmpresa = agregarIndicadores(indicadores, 'empresa', empresa);
  const turmas = obterTurmas(indicadores, empresa);
  const porTurma = turmas.map(turma => agregarIndicadores(indicadores, 'turma', turma));
  const alunos = indicadores.filter(i => i.empresa === empresa).sort((a, b) => b.notaFinal - a.notaFinal);
  return { visaoEmpresa, porTurma, alunos };
}
