import { MentoringRecord, EventRecord, PerformanceRecord } from './excelProcessor';

/**
 * Estrutura de um ciclo de execução com suas competências
 */
export interface CicloExecucaoData {
  id: number;
  nomeCiclo: string;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string;    // YYYY-MM-DD
  competenciaIds: number[];
}

/**
 * Status de um ciclo baseado na data atual
 */
export type CicloStatus = 'finalizado' | 'em_andamento' | 'futuro' | 'atrasado';

/**
 * Resultado do cálculo de um ciclo individual
 */
export interface CicloResult {
  cicloId: number;
  nomeCiclo: string;
  status: CicloStatus;
  dataInicio: string;
  dataFim: string;
  totalCompetencias: number;
  competenciasConcluidas: number;
  percentualConclusao: number;    // Indicador 4 do ciclo
  mediaNotasProvas: number;       // Indicador 5 do ciclo
  competenciasComNota: number;
}

/**
 * Estrutura de indicadores de um aluno - v4 (7 indicadores)
 */
export interface StudentIndicators {
  idUsuario: string;
  nomeAluno: string;
  empresa: string;
  turma?: string;
  trilha?: string;
  
  // 6 Indicadores individuais (base 100)
  participacaoMentorias: number;         // Ind.1: % de presença nas mentorias
  atividadesPraticas: number;            // Ind.2: % de atividades entregues (excluindo Assessment)
  engajamento: number;                   // Ind.3: Média de (Ind.1 + Ind.2 + Nota Mentora %)
  performanceCompetencias: number;       // Ind.4: % aulas concluídas (ciclos finalizados)
  performanceAprendizado: number;        // Ind.5: Média notas provas (ciclos finalizados)
  participacaoEventos: number;           // Ind.6: % de presença em eventos
  
  // Indicador 7: Performance Geral (consolidado)
  performanceGeral: number;              // Média dos 6 indicadores
  classificacao: string;                 // Excelência, Avançado, Intermediário, Básico, Inicial
  
  // Dados brutos para detalhamento/explicação nos cards
  totalMentorias: number;
  mentoriasPresente: number;
  totalAtividades: number;               // Excluindo Assessment
  atividadesEntregues: number;
  totalEventos: number;
  eventosPresente: number;
  totalCompetencias: number;
  competenciasAprovadas: number;
  mediaEngajamentoRaw: number;           // Média original (0-5)
  
  // Componentes do Indicador 3 (para explicação no card)
  engajamentoComponentes: {
    presenca: number;                    // Ind.1 value
    atividades: number;                  // Ind.2 value
    notaMentora: number;                 // Nota mentora convertida para %
  };
  
  // Dados de ciclos (para Indicadores 4 e 5)
  ciclosFinalizados: CicloResult[];
  ciclosEmAndamento: CicloResult[];
  
  // Legado: notaFinal (alias para performanceGeral convertida para 0-10)
  notaFinal: number;
}

/**
 * Estrutura de indicadores agregados (por turma, empresa ou geral)
 */
export interface AggregatedIndicators {
  nivel: 'geral' | 'empresa' | 'turma';
  identificador: string;
  
  // Médias dos 7 indicadores
  mediaParticipacaoMentorias: number;
  mediaAtividadesPraticas: number;
  mediaEngajamento: number;
  mediaPerformanceCompetencias: number;
  mediaPerformanceAprendizado: number;
  mediaParticipacaoEventos: number;
  mediaPerformanceGeral: number;
  
  // Legado
  mediaNotaFinal: number;
  
  // Distribuição por classificação
  totalAlunos: number;
  alunosExcelencia: number;
  alunosAvancado: number;
  alunosIntermediario: number;
  alunosBasico: number;
  alunosInicial: number;
  
  distribuicaoClassificacao: { nome: string; quantidade: number; percentual: number }[];
  evolucaoIndicadores?: { periodo: string; indicadores: number[] }[];
}

/**
 * Classifica a nota (0-10) em estágios
 */
export function classificarNota(nota: number): string {
  if (nota >= 9) return 'Excelência';
  if (nota >= 7) return 'Avançado';
  if (nota >= 5) return 'Intermediário';
  if (nota >= 3) return 'Básico';
  return 'Inicial';
}

/**
 * Classifica percentual (0-100) em estágios
 */
export function classificarPercentual(percentual: number): string {
  if (percentual >= 90) return 'Excelência';
  if (percentual >= 70) return 'Avançado';
  if (percentual >= 50) return 'Intermediário';
  if (percentual >= 30) return 'Básico';
  return 'Inicial';
}

/**
 * Converte nota de engajamento (0-5) para escala 0-100
 * Tabela de faixas: 0=0%, 1=20%, 2=40%, 3=60%, 4=80%, 5=100%
 */
function engajamentoParaPercentual(nota: number): number {
  return Math.min((nota / 5) * 100, 100);
}

/**
 * Determina o status de um ciclo baseado na data atual
 */
export function determinarStatusCiclo(dataInicio: string, dataFim: string, hoje?: Date): CicloStatus {
  const now = hoje || new Date();
  const inicio = new Date(dataInicio + 'T00:00:00');
  const fim = new Date(dataFim + 'T23:59:59');
  
  if (now > fim) return 'finalizado';
  if (now >= inicio && now <= fim) return 'em_andamento';
  return 'futuro';
}

/**
 * Interface para competência obrigatória do plano individual
 */
export interface CompetenciaObrigatoria {
  competenciaId: number;
  codigoIntegracao: string | null;
  notaAtual: string | null;
  metaNota: string | null;
  status: string;
}

/**
 * Calcula indicadores de um aluno individual - v4 (7 indicadores)
 */
export function calcularIndicadoresAluno(
  idUsuario: string,
  mentorias: MentoringRecord[],
  eventos: EventRecord[],
  performance: PerformanceRecord[],
  ciclos?: CicloExecucaoData[],
  competenciasObrigatorias?: CompetenciaObrigatoria[]
): StudentIndicators {
  // Filtrar registros do aluno
  const mentoriasAluno = mentorias.filter(m => m.idUsuario === idUsuario);
  const eventosAluno = eventos.filter(e => e.idUsuario === idUsuario);
  const performanceAluno = performance.filter(p => p.idUsuario === idUsuario);

  // Dados básicos do aluno
  const primeiroRegistro = mentoriasAluno[0] || eventosAluno[0];
  const nomeAluno = primeiroRegistro?.nomeAluno || 'Desconhecido';
  const empresa = primeiroRegistro?.empresa || performanceAluno[0]?.nomeTurma || 'Desconhecida';
  const turma = mentoriasAluno[0]?.turma || eventosAluno[0]?.turma;
  const trilha = mentoriasAluno[0]?.trilha || eventosAluno[0]?.trilha;

  // ============================================================
  // INDICADOR 1: Participação nas Mentorias
  // Fórmula: (Mentorias com presença / Total de mentorias) × 100
  // ============================================================
  const totalMentorias = mentoriasAluno.length;
  const mentoriasPresente = mentoriasAluno.filter(m => m.presenca === 'presente').length;
  const participacaoMentorias = totalMentorias > 0 
    ? (mentoriasPresente / totalMentorias) * 100 
    : 0;

  // ============================================================
  // INDICADOR 2: Atividades Práticas
  // Fórmula: (Atividades entregues / Total de atividades previstas) × 100
  // REGRA: Excluir 1ª mentoria (Assessment) - nunca tem entrega
  // ============================================================
  // Ordenar mentorias por data/número de sessão para identificar a 1ª (Assessment)
  const mentoriasOrdenadas = [...mentoriasAluno].sort((a, b) => {
    if (a.sessao !== undefined && b.sessao !== undefined) return a.sessao - b.sessao;
    if (a.dataSessao && b.dataSessao) return new Date(a.dataSessao).getTime() - new Date(b.dataSessao).getTime();
    return 0;
  });
  
  // Excluir a 1ª mentoria (Assessment) do cálculo de atividades
  const mentoriasSemAssessment = mentoriasOrdenadas.length > 1 
    ? mentoriasOrdenadas.slice(1) 
    : mentoriasOrdenadas; // Se só tem 1, mantém (edge case)
  
  const atividadesComTarefa = mentoriasSemAssessment.filter(m => m.atividadeEntregue !== 'sem_tarefa');
  const totalAtividades = atividadesComTarefa.length;
  const atividadesEntregues = atividadesComTarefa.filter(m => m.atividadeEntregue === 'entregue').length;
  const atividadesPraticas = totalAtividades > 0 
    ? (atividadesEntregues / totalAtividades) * 100 
    : 0;

  // ============================================================
  // INDICADOR 3: Evolução / Engajamento
  // Fórmula: (Ind.1 + Ind.2 + Nota Mentora %) / 3
  // Nota Mentora: média das notas (0-5) convertida para % via (nota/5)*100
  // ============================================================
  const notasEngajamento = mentoriasAluno
    .filter(m => m.engajamento !== undefined && m.engajamento !== null)
    .map(m => m.engajamento!);
  const mediaEngajamentoRaw = notasEngajamento.length > 0
    ? notasEngajamento.reduce((a, b) => a + b, 0) / notasEngajamento.length
    : 0;
  const notaMentoraPercentual = engajamentoParaPercentual(mediaEngajamentoRaw);
  
  // Engajamento = média dos 3 componentes
  const engajamento = (participacaoMentorias + atividadesPraticas + notaMentoraPercentual) / 3;
  
  const engajamentoComponentes = {
    presenca: participacaoMentorias,
    atividades: atividadesPraticas,
    notaMentora: notaMentoraPercentual,
  };

  // ============================================================
  // INDICADORES 4 e 5: Performance de Competências e Aprendizado
  // Baseados em ciclos de execução da trilha
  // Só entram ciclos FINALIZADOS (data_fim < hoje)
  // ============================================================
  let performanceCompetencias = 0;
  let performanceAprendizado = 0;
  let totalCompetencias = 0;
  let competenciasAprovadas = 0;
  let ciclosFinalizados: CicloResult[] = [];
  let ciclosEmAndamento: CicloResult[] = [];

  if (ciclos && ciclos.length > 0) {
    // Calcular por ciclo
    for (const ciclo of ciclos) {
      const status = determinarStatusCiclo(ciclo.dataInicio, ciclo.dataFim);
      
      // Buscar performance das competências deste ciclo
      let aulasConcluidas = 0;
      let totalAulas = 0;
      let somaNotas = 0;
      let competenciasComNota = 0;
      let competenciasConcluidas = 0;
      
      for (const compId of ciclo.competenciaIds) {
        // Buscar dados na performance pelo competenciaId
        const perfComp = performanceAluno.find(p => 
          p.idCompetencia === String(compId) || 
          p.nomeCompetencia === String(compId)
        );
        
        // Também buscar no plano individual via competenciasObrigatorias
        const compObrig = competenciasObrigatorias?.find(c => c.competenciaId === compId);
        
        let nota = 0;
        if (compObrig?.notaAtual) {
          nota = parseFloat(compObrig.notaAtual);
        } else if (perfComp?.notaAvaliacao) {
          nota = perfComp.notaAvaliacao;
        }
        
        totalAulas++;
        if (nota > 0) {
          aulasConcluidas++;
          somaNotas += nota;
          competenciasComNota++;
          if (nota >= 7) competenciasConcluidas++;
        }
      }
      
      const percentualConclusao = totalAulas > 0 ? (aulasConcluidas / totalAulas) * 100 : 0;
      const mediaNotas = competenciasComNota > 0 ? (somaNotas / competenciasComNota / 10) * 100 : 0;
      
      const cicloResult: CicloResult = {
        cicloId: ciclo.id,
        nomeCiclo: ciclo.nomeCiclo,
        status,
        dataInicio: ciclo.dataInicio,
        dataFim: ciclo.dataFim,
        totalCompetencias: ciclo.competenciaIds.length,
        competenciasConcluidas: aulasConcluidas,
        percentualConclusao,
        mediaNotasProvas: mediaNotas,
        competenciasComNota,
      };
      
      if (status === 'finalizado') {
        ciclosFinalizados.push(cicloResult);
      } else if (status === 'em_andamento') {
        ciclosEmAndamento.push(cicloResult);
      }
      // 'futuro' é ignorado
    }
    
    // Indicador 4: média dos percentuais de conclusão dos ciclos FINALIZADOS
    if (ciclosFinalizados.length > 0) {
      performanceCompetencias = ciclosFinalizados.reduce((sum, c) => sum + c.percentualConclusao, 0) / ciclosFinalizados.length;
      totalCompetencias = ciclosFinalizados.reduce((sum, c) => sum + c.totalCompetencias, 0);
      competenciasAprovadas = ciclosFinalizados.reduce((sum, c) => sum + c.competenciasConcluidas, 0);
    }
    
    // Indicador 5: média das notas de provas dos ciclos FINALIZADOS
    if (ciclosFinalizados.length > 0) {
      const ciclosComNota = ciclosFinalizados.filter(c => c.competenciasComNota > 0);
      if (ciclosComNota.length > 0) {
        performanceAprendizado = ciclosComNota.reduce((sum, c) => sum + c.mediaNotasProvas, 0) / ciclosComNota.length;
      }
    }
  } else {
    // Fallback: sem ciclos definidos, usar lógica anterior (todas as competências)
    // Isso mantém compatibilidade enquanto os ciclos não são configurados
    totalCompetencias = performanceAluno.length;
    competenciasAprovadas = performanceAluno.filter(p => p.aprovado === true).length;
    
    const notasComp = performanceAluno
      .filter(p => p.notaAvaliacao !== undefined && p.notaAvaliacao !== null && p.notaAvaliacao > 0)
      .map(p => p.notaAvaliacao!);
    
    if (notasComp.length > 0) {
      const mediaNotas = notasComp.reduce((a, b) => a + b, 0) / notasComp.length;
      performanceCompetencias = (competenciasAprovadas / totalCompetencias) * 100 || 0;
      performanceAprendizado = (mediaNotas / 10) * 100;
    }
    
    // Se tem competências obrigatórias, usar performance filtrada
    if (competenciasObrigatorias && competenciasObrigatorias.length > 0) {
      const perfFiltrada = calcularPerformanceFiltrada(competenciasObrigatorias, performanceAluno);
      totalCompetencias = perfFiltrada.totalObrigatorias;
      competenciasAprovadas = perfFiltrada.aprovadas;
      performanceCompetencias = perfFiltrada.percentualAprovacao;
      performanceAprendizado = (perfFiltrada.mediaNotas / 10) * 100;
    }
  }

  // ============================================================
  // INDICADOR 6: Participação em Eventos
  // Fórmula: (Eventos com presença / Total de eventos) × 100
  // ============================================================
  const totalEventos = eventosAluno.length;
  const eventosPresente = eventosAluno.filter(e => e.presenca === 'presente').length;
  const participacaoEventos = totalEventos > 0
    ? (eventosPresente / totalEventos) * 100
    : 0;

  // ============================================================
  // INDICADOR 7: Performance Geral (Consolidado)
  // Fórmula: (Ind.1 + Ind.2 + Ind.3 + Ind.4 + Ind.5 + Ind.6) / 6
  // ============================================================
  const performanceGeral = (
    participacaoMentorias +
    atividadesPraticas +
    engajamento +
    performanceCompetencias +
    performanceAprendizado +
    participacaoEventos
  ) / 6;

  // Converter para escala 0-10 para classificação e legado
  const notaFinal = performanceGeral / 10;
  const classificacao = classificarNota(notaFinal);

  return {
    idUsuario,
    nomeAluno,
    empresa,
    turma,
    trilha,
    participacaoMentorias,
    atividadesPraticas,
    engajamento,
    performanceCompetencias,
    performanceAprendizado,
    participacaoEventos,
    performanceGeral,
    classificacao,
    totalMentorias,
    mentoriasPresente,
    totalAtividades,
    atividadesEntregues,
    totalEventos,
    eventosPresente,
    totalCompetencias,
    competenciasAprovadas,
    mediaEngajamentoRaw,
    engajamentoComponentes,
    ciclosFinalizados,
    ciclosEmAndamento,
    notaFinal,
  };
}

/**
 * Calcula indicadores para todos os alunos
 */
export function calcularIndicadoresTodosAlunos(
  mentorias: MentoringRecord[],
  eventos: EventRecord[],
  performance: PerformanceRecord[],
  ciclosPorAluno?: Map<string, CicloExecucaoData[]>,
  competenciasPorAluno?: Map<string, CompetenciaObrigatoria[]>
): StudentIndicators[] {
  // Obter lista única de IDs de usuários
  const idsUsuariosSet: string[] = [];
  mentorias.forEach(m => {
    if (!idsUsuariosSet.includes(m.idUsuario)) idsUsuariosSet.push(m.idUsuario);
  });
  eventos.forEach(e => {
    if (!idsUsuariosSet.includes(e.idUsuario)) idsUsuariosSet.push(e.idUsuario);
  });
  performance.forEach(p => {
    if (!idsUsuariosSet.includes(p.idUsuario)) idsUsuariosSet.push(p.idUsuario);
  });

  const indicadores: StudentIndicators[] = [];
  for (const idUsuario of idsUsuariosSet) {
    const ciclosAluno = ciclosPorAluno?.get(idUsuario);
    const compsAluno = competenciasPorAluno?.get(idUsuario);
    const indicador = calcularIndicadoresAluno(
      idUsuario, mentorias, eventos, performance, ciclosAluno, compsAluno
    );
    indicadores.push(indicador);
  }

  return indicadores;
}

/**
 * Agrega indicadores por nível (geral, empresa ou turma)
 */
export function agregarIndicadores(
  indicadoresAlunos: StudentIndicators[],
  nivel: 'geral' | 'empresa' | 'turma',
  filtro?: string
): AggregatedIndicators {
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
      nivel,
      identificador,
      mediaParticipacaoMentorias: 0,
      mediaAtividadesPraticas: 0,
      mediaEngajamento: 0,
      mediaPerformanceCompetencias: 0,
      mediaPerformanceAprendizado: 0,
      mediaParticipacaoEventos: 0,
      mediaPerformanceGeral: 0,
      mediaNotaFinal: 0,
      totalAlunos: 0,
      alunosExcelencia: 0,
      alunosAvancado: 0,
      alunosIntermediario: 0,
      alunosBasico: 0,
      alunosInicial: 0,
      distribuicaoClassificacao: []
    };
  }

  const mediaParticipacaoMentorias = alunosFiltrados.reduce((sum, a) => sum + a.participacaoMentorias, 0) / totalAlunos;
  const mediaAtividadesPraticas = alunosFiltrados.reduce((sum, a) => sum + a.atividadesPraticas, 0) / totalAlunos;
  const mediaEngajamento = alunosFiltrados.reduce((sum, a) => sum + a.engajamento, 0) / totalAlunos;
  const mediaPerformanceCompetencias = alunosFiltrados.reduce((sum, a) => sum + a.performanceCompetencias, 0) / totalAlunos;
  const mediaPerformanceAprendizado = alunosFiltrados.reduce((sum, a) => sum + a.performanceAprendizado, 0) / totalAlunos;
  const mediaParticipacaoEventos = alunosFiltrados.reduce((sum, a) => sum + a.participacaoEventos, 0) / totalAlunos;
  const mediaPerformanceGeral = alunosFiltrados.reduce((sum, a) => sum + a.performanceGeral, 0) / totalAlunos;
  const mediaNotaFinal = alunosFiltrados.reduce((sum, a) => sum + a.notaFinal, 0) / totalAlunos;

  const alunosExcelencia = alunosFiltrados.filter(a => a.classificacao === 'Excelência').length;
  const alunosAvancado = alunosFiltrados.filter(a => a.classificacao === 'Avançado').length;
  const alunosIntermediario = alunosFiltrados.filter(a => a.classificacao === 'Intermediário').length;
  const alunosBasico = alunosFiltrados.filter(a => a.classificacao === 'Básico').length;
  const alunosInicial = alunosFiltrados.filter(a => a.classificacao === 'Inicial').length;

  const distribuicaoClassificacao = [
    { nome: 'Excelência', quantidade: alunosExcelencia, percentual: (alunosExcelencia / totalAlunos) * 100 },
    { nome: 'Avançado', quantidade: alunosAvancado, percentual: (alunosAvancado / totalAlunos) * 100 },
    { nome: 'Intermediário', quantidade: alunosIntermediario, percentual: (alunosIntermediario / totalAlunos) * 100 },
    { nome: 'Básico', quantidade: alunosBasico, percentual: (alunosBasico / totalAlunos) * 100 },
    { nome: 'Inicial', quantidade: alunosInicial, percentual: (alunosInicial / totalAlunos) * 100 }
  ];

  return {
    nivel,
    identificador,
    mediaParticipacaoMentorias,
    mediaAtividadesPraticas,
    mediaEngajamento,
    mediaPerformanceCompetencias,
    mediaPerformanceAprendizado,
    mediaParticipacaoEventos,
    mediaPerformanceGeral,
    mediaNotaFinal,
    totalAlunos,
    alunosExcelencia,
    alunosAvancado,
    alunosIntermediario,
    alunosBasico,
    alunosInicial,
    distribuicaoClassificacao
  };
}

/**
 * Obtém lista de empresas únicas
 */
export function obterEmpresas(indicadores: StudentIndicators[]): string[] {
  const empresas: string[] = [];
  indicadores.forEach(i => {
    if (!empresas.includes(i.empresa)) empresas.push(i.empresa);
  });
  return empresas.sort();
}

/**
 * Obtém lista de turmas únicas (opcionalmente filtradas por empresa)
 */
export function obterTurmas(indicadores: StudentIndicators[], empresa?: string): string[] {
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

/**
 * Gera dados para o dashboard geral
 */
export function gerarDashboardGeral(indicadores: StudentIndicators[]): {
  visaoGeral: AggregatedIndicators;
  porEmpresa: AggregatedIndicators[];
  topAlunos: StudentIndicators[];
  alunosAtencao: StudentIndicators[];
} {
  const visaoGeral = agregarIndicadores(indicadores, 'geral');
  
  const empresas = obterEmpresas(indicadores);
  const porEmpresa = empresas.map(emp => agregarIndicadores(indicadores, 'empresa', emp));
  
  const topAlunos = [...indicadores]
    .sort((a, b) => b.notaFinal - a.notaFinal)
    .slice(0, 10);
  
  const alunosAtencao = indicadores
    .filter(a => a.notaFinal < 5)
    .sort((a, b) => a.notaFinal - b.notaFinal)
    .slice(0, 10);

  return {
    visaoGeral,
    porEmpresa,
    topAlunos,
    alunosAtencao
  };
}

/**
 * Gera dados para o dashboard de uma empresa específica
 */
export function gerarDashboardEmpresa(
  indicadores: StudentIndicators[], 
  empresa: string
): {
  visaoEmpresa: AggregatedIndicators;
  porTurma: AggregatedIndicators[];
  alunos: StudentIndicators[];
} {
  const visaoEmpresa = agregarIndicadores(indicadores, 'empresa', empresa);
  
  const turmas = obterTurmas(indicadores, empresa);
  const porTurma = turmas.map(turma => agregarIndicadores(indicadores, 'turma', turma));
  
  const alunos = indicadores
    .filter(i => i.empresa === empresa)
    .sort((a, b) => b.notaFinal - a.notaFinal);

  return {
    visaoEmpresa,
    porTurma,
    alunos
  };
}


/**
 * Calcula performance filtrada considerando apenas competências obrigatórias do plano individual
 * BLOCO 3 - Performance Filtrada (mantido para compatibilidade)
 */
export function calcularPerformanceFiltrada(
  competenciasObrigatorias: CompetenciaObrigatoria[],
  performance: PerformanceRecord[]
): {
  totalObrigatorias: number;
  aprovadas: number;
  percentualAprovacao: number;
  mediaNotas: number;
  detalhes: {
    codigoIntegracao: string | null;
    notaAtual: number | null;
    metaNota: number;
    aprovada: boolean;
  }[];
} {
  if (competenciasObrigatorias.length === 0) {
    return {
      totalObrigatorias: 0,
      aprovadas: 0,
      percentualAprovacao: 0,
      mediaNotas: 0,
      detalhes: []
    };
  }

  const detalhes: {
    codigoIntegracao: string | null;
    notaAtual: number | null;
    metaNota: number;
    aprovada: boolean;
  }[] = [];

  let somaNotas = 0;
  let competenciasComNota = 0;
  let aprovadas = 0;

  for (const comp of competenciasObrigatorias) {
    const metaNota = parseFloat(comp.metaNota || '7.00');
    let notaAtual: number | null = null;
    let aprovada = false;

    if (comp.notaAtual) {
      notaAtual = parseFloat(comp.notaAtual);
    } else if (comp.codigoIntegracao) {
      const perfRecord = performance.find(p => 
        p.idCompetencia?.toLowerCase() === comp.codigoIntegracao?.toLowerCase() ||
        p.nomeCompetencia?.toLowerCase() === comp.codigoIntegracao?.toLowerCase()
      );
      if (perfRecord && perfRecord.notaAvaliacao !== undefined) {
        notaAtual = perfRecord.notaAvaliacao;
      }
    }

    if (notaAtual !== null) {
      somaNotas += notaAtual;
      competenciasComNota++;
      aprovada = notaAtual >= metaNota;
      if (aprovada) aprovadas++;
    }

    detalhes.push({
      codigoIntegracao: comp.codigoIntegracao,
      notaAtual,
      metaNota,
      aprovada
    });
  }

  const totalObrigatorias = competenciasObrigatorias.length;
  const percentualAprovacao = totalObrigatorias > 0 
    ? (aprovadas / totalObrigatorias) * 100 
    : 0;
  const mediaNotas = competenciasComNota > 0 
    ? somaNotas / competenciasComNota 
    : 0;

  return {
    totalObrigatorias,
    aprovadas,
    percentualAprovacao,
    mediaNotas,
    detalhes
  };
}

/**
 * Calcula indicadores de um aluno usando performance filtrada (mantido para compatibilidade)
 */
export function calcularIndicadoresAlunoFiltrado(
  idUsuario: string,
  mentorias: MentoringRecord[],
  eventos: EventRecord[],
  performance: PerformanceRecord[],
  competenciasObrigatorias: CompetenciaObrigatoria[],
  ciclos?: CicloExecucaoData[]
): StudentIndicators & { performanceFiltrada: ReturnType<typeof calcularPerformanceFiltrada> } {
  const indicadores = calcularIndicadoresAluno(
    idUsuario, mentorias, eventos, performance, ciclos, competenciasObrigatorias
  );
  
  const performanceFiltrada = calcularPerformanceFiltrada(
    competenciasObrigatorias, 
    performance.filter(p => p.idUsuario === idUsuario)
  );

  return {
    ...indicadores,
    performanceFiltrada
  };
}
