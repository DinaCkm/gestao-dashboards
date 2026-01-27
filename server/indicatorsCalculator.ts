import { MentoringRecord, EventRecord, PerformanceRecord } from './excelProcessor';

/**
 * Estrutura de indicadores de um aluno
 */
export interface StudentIndicators {
  idUsuario: string;
  nomeAluno: string;
  empresa: string;
  turma?: string;
  trilha?: string;
  
  // 5 Indicadores (cada um vale 20%)
  participacaoMentorias: number;      // % de presença nas mentorias
  atividadesPraticas: number;         // % de atividades entregues
  engajamento: number;                // Média das notas de engajamento (1-5 -> 0-100)
  performanceCompetencias: number;    // % de competências aprovadas (nota >= 7)
  participacaoEventos: number;        // % de presença em eventos
  
  // Nota final e classificação
  notaFinal: number;                  // Média ponderada dos 5 indicadores
  classificacao: string;              // Excelência, Avançado, Intermediário, Básico, Inicial
  
  // Dados brutos para detalhamento
  totalMentorias: number;
  mentoriasPresente: number;
  totalAtividades: number;
  atividadesEntregues: number;
  totalEventos: number;
  eventosPresente: number;
  totalCompetencias: number;
  competenciasAprovadas: number;
  mediaEngajamentoRaw: number;        // Média original (1-5)
}

/**
 * Estrutura de indicadores agregados (por turma, empresa ou geral)
 */
export interface AggregatedIndicators {
  nivel: 'geral' | 'empresa' | 'turma';
  identificador: string;              // Nome da empresa ou turma
  
  // Médias dos 5 indicadores
  mediaParticipacaoMentorias: number;
  mediaAtividadesPraticas: number;
  mediaEngajamento: number;
  mediaPerformanceCompetencias: number;
  mediaParticipacaoEventos: number;
  mediaNotaFinal: number;
  
  // Distribuição por classificação
  totalAlunos: number;
  alunosExcelencia: number;
  alunosAvancado: number;
  alunosIntermediario: number;
  alunosBasico: number;
  alunosInicial: number;
  
  // Dados para gráficos
  distribuicaoClassificacao: { nome: string; quantidade: number; percentual: number }[];
  evolucaoIndicadores?: { periodo: string; indicadores: number[] }[];
}

/**
 * Classifica a nota final em estágios
 * Excelência: 9-10, Avançado: 7-8, Intermediário: 5-6, Básico: 3-4, Inicial: 0-2
 */
export function classificarNota(nota: number): string {
  if (nota >= 9) return 'Excelência';
  if (nota >= 7) return 'Avançado';
  if (nota >= 5) return 'Intermediário';
  if (nota >= 3) return 'Básico';
  return 'Inicial';
}

/**
 * Converte nota de engajamento (1-5) para escala 0-100
 */
function engajamentoParaPercentual(nota: number): number {
  // 1 = 0%, 2 = 25%, 3 = 50%, 4 = 75%, 5 = 100%
  return ((nota - 1) / 4) * 100;
}

/**
 * Calcula indicadores de um aluno individual
 */
export function calcularIndicadoresAluno(
  idUsuario: string,
  mentorias: MentoringRecord[],
  eventos: EventRecord[],
  performance: PerformanceRecord[]
): StudentIndicators {
  // Filtrar registros do aluno
  const mentoriasAluno = mentorias.filter(m => m.idUsuario === idUsuario);
  const eventosAluno = eventos.filter(e => e.idUsuario === idUsuario);
  const performanceAluno = performance.filter(p => p.idUsuario === idUsuario);

  // Dados básicos do aluno
  const primeiroRegistro = mentoriasAluno[0] || eventosAluno[0];
  const nomeAluno = primeiroRegistro?.nomeAluno || 'Desconhecido';
  const empresa = primeiroRegistro?.empresa || 'Desconhecida';
  const turma = mentoriasAluno[0]?.turma || eventosAluno[0]?.turma;
  const trilha = mentoriasAluno[0]?.trilha || eventosAluno[0]?.trilha;

  // 1. Participação nas Mentorias (20%)
  const totalMentorias = mentoriasAluno.length;
  const mentoriasPresente = mentoriasAluno.filter(m => m.presenca === 'presente').length;
  const participacaoMentorias = totalMentorias > 0 
    ? (mentoriasPresente / totalMentorias) * 100 
    : 0;

  // 2. Atividades Práticas (20%)
  const atividadesComTarefa = mentoriasAluno.filter(m => m.atividadeEntregue !== 'sem_tarefa');
  const totalAtividades = atividadesComTarefa.length;
  const atividadesEntregues = atividadesComTarefa.filter(m => m.atividadeEntregue === 'entregue').length;
  const atividadesPraticas = totalAtividades > 0 
    ? (atividadesEntregues / totalAtividades) * 100 
    : 0;

  // 3. Engajamento (20%)
  const notasEngajamento = mentoriasAluno
    .filter(m => m.engajamento !== undefined)
    .map(m => m.engajamento!);
  const mediaEngajamentoRaw = notasEngajamento.length > 0
    ? notasEngajamento.reduce((a, b) => a + b, 0) / notasEngajamento.length
    : 0;
  const engajamento = engajamentoParaPercentual(mediaEngajamentoRaw);

  // 4. Performance de Competências (20%)
  const totalCompetencias = performanceAluno.length;
  const competenciasAprovadas = performanceAluno.filter(p => p.aprovado === true).length;
  const performanceCompetencias = totalCompetencias > 0
    ? (competenciasAprovadas / totalCompetencias) * 100
    : 0;

  // 5. Participação em Eventos (20%)
  const totalEventos = eventosAluno.length;
  const eventosPresente = eventosAluno.filter(e => e.presenca === 'presente').length;
  const participacaoEventos = totalEventos > 0
    ? (eventosPresente / totalEventos) * 100
    : 0;

  // Nota Final (média ponderada - todos com peso igual de 20%)
  const notaFinal = (
    participacaoMentorias * 0.20 +
    atividadesPraticas * 0.20 +
    engajamento * 0.20 +
    performanceCompetencias * 0.20 +
    participacaoEventos * 0.20
  ) / 10; // Converter de 0-100 para 0-10

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
    participacaoEventos,
    notaFinal,
    classificacao,
    totalMentorias,
    mentoriasPresente,
    totalAtividades,
    atividadesEntregues,
    totalEventos,
    eventosPresente,
    totalCompetencias,
    competenciasAprovadas,
    mediaEngajamentoRaw
  };
}

/**
 * Calcula indicadores para todos os alunos
 */
export function calcularIndicadoresTodosAlunos(
  mentorias: MentoringRecord[],
  eventos: EventRecord[],
  performance: PerformanceRecord[]
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

  // Calcular indicadores para cada aluno
  const indicadores: StudentIndicators[] = [];
  for (const idUsuario of idsUsuariosSet) {
    const indicador = calcularIndicadoresAluno(idUsuario, mentorias, eventos, performance);
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
  // Filtrar alunos conforme o nível
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
      mediaParticipacaoEventos: 0,
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

  // Calcular médias
  const mediaParticipacaoMentorias = alunosFiltrados.reduce((sum, a) => sum + a.participacaoMentorias, 0) / totalAlunos;
  const mediaAtividadesPraticas = alunosFiltrados.reduce((sum, a) => sum + a.atividadesPraticas, 0) / totalAlunos;
  const mediaEngajamento = alunosFiltrados.reduce((sum, a) => sum + a.engajamento, 0) / totalAlunos;
  const mediaPerformanceCompetencias = alunosFiltrados.reduce((sum, a) => sum + a.performanceCompetencias, 0) / totalAlunos;
  const mediaParticipacaoEventos = alunosFiltrados.reduce((sum, a) => sum + a.participacaoEventos, 0) / totalAlunos;
  const mediaNotaFinal = alunosFiltrados.reduce((sum, a) => sum + a.notaFinal, 0) / totalAlunos;

  // Contar por classificação
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
    mediaParticipacaoEventos,
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
  
  // Top 10 alunos
  const topAlunos = [...indicadores]
    .sort((a, b) => b.notaFinal - a.notaFinal)
    .slice(0, 10);
  
  // Alunos que precisam de atenção (nota < 5)
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
