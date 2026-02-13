import { describe, it, expect } from 'vitest';
import {
  calcularIndicadoresAluno,
  calcularIndicadoresTodosAlunos,
  agregarIndicadores,
  classificarNota,
  classificarPercentual,
  determinarStatusCiclo,
  obterEmpresas,
  obterTurmas,
  gerarDashboardGeral,
  calcularPerformanceFiltrada,
  type CicloExecucaoData,
  type MentoringRecord,
  type EventRecord,
  type PerformanceRecord,
} from './indicatorsCalculator';

// ============================================================
// Dados de teste
// ============================================================
const mockMentorias: MentoringRecord[] = [
  {
    idUsuario: 'aluno1',
    nomeAluno: 'João Silva',
    empresa: 'SEBRAE ACRE',
    turma: 'Turma A',
    sessao: 1,
    presenca: 'presente',
    atividadeEntregue: 'sem_tarefa', // Assessment - sem tarefa
    engajamento: 5
  },
  {
    idUsuario: 'aluno1',
    nomeAluno: 'João Silva',
    empresa: 'SEBRAE ACRE',
    turma: 'Turma A',
    sessao: 2,
    presenca: 'presente',
    atividadeEntregue: 'entregue',
    engajamento: 4
  },
  {
    idUsuario: 'aluno1',
    nomeAluno: 'João Silva',
    empresa: 'SEBRAE ACRE',
    turma: 'Turma A',
    sessao: 3,
    presenca: 'ausente',
    atividadeEntregue: 'nao_entregue',
    engajamento: 3
  },
  {
    idUsuario: 'aluno2',
    nomeAluno: 'Maria Santos',
    empresa: 'SEBRAE TO',
    turma: 'Turma B',
    sessao: 1,
    presenca: 'presente',
    atividadeEntregue: 'sem_tarefa', // Assessment
    engajamento: 5
  },
  {
    idUsuario: 'aluno2',
    nomeAluno: 'Maria Santos',
    empresa: 'SEBRAE TO',
    turma: 'Turma B',
    sessao: 2,
    presenca: 'presente',
    atividadeEntregue: 'entregue',
    engajamento: 5
  }
];

const mockEventos: EventRecord[] = [
  { idUsuario: 'aluno1', nomeAluno: 'João Silva', empresa: 'SEBRAE ACRE', tituloEvento: 'Webinar 1', presenca: 'presente' },
  { idUsuario: 'aluno1', nomeAluno: 'João Silva', empresa: 'SEBRAE ACRE', tituloEvento: 'Webinar 2', presenca: 'ausente' },
  { idUsuario: 'aluno2', nomeAluno: 'Maria Santos', empresa: 'SEBRAE TO', tituloEvento: 'Webinar 1', presenca: 'presente' },
  { idUsuario: 'aluno2', nomeAluno: 'Maria Santos', empresa: 'SEBRAE TO', tituloEvento: 'Webinar 2', presenca: 'presente' },
];

const mockPerformance: PerformanceRecord[] = [
  { idUsuario: 'aluno1', idCompetencia: 'comp1', nomeCompetencia: 'Liderança', notaAvaliacao: 8, aprovado: true },
  { idUsuario: 'aluno1', idCompetencia: 'comp2', nomeCompetencia: 'Comunicação', notaAvaliacao: 6, aprovado: false },
  { idUsuario: 'aluno2', idCompetencia: 'comp1', nomeCompetencia: 'Liderança', notaAvaliacao: 9, aprovado: true },
  { idUsuario: 'aluno2', idCompetencia: 'comp2', nomeCompetencia: 'Comunicação', notaAvaliacao: 8, aprovado: true },
];

// ============================================================
// classificarNota (escala 0-10)
// ============================================================
describe('classificarNota', () => {
  it('classifica Excelência para nota >= 9', () => {
    expect(classificarNota(9)).toBe('Excelência');
    expect(classificarNota(10)).toBe('Excelência');
  });
  it('classifica Avançado para nota >= 7 e < 9', () => {
    expect(classificarNota(7)).toBe('Avançado');
    expect(classificarNota(8.9)).toBe('Avançado');
  });
  it('classifica Intermediário para nota >= 5 e < 7', () => {
    expect(classificarNota(5)).toBe('Intermediário');
    expect(classificarNota(6.9)).toBe('Intermediário');
  });
  it('classifica Básico para nota >= 3 e < 5', () => {
    expect(classificarNota(3)).toBe('Básico');
    expect(classificarNota(4.9)).toBe('Básico');
  });
  it('classifica Inicial para nota < 3', () => {
    expect(classificarNota(0)).toBe('Inicial');
    expect(classificarNota(2.9)).toBe('Inicial');
  });
});

// ============================================================
// classificarPercentual (escala 0-100)
// ============================================================
describe('classificarPercentual', () => {
  it('classifica Excelência para percentual >= 90', () => {
    expect(classificarPercentual(90)).toBe('Excelência');
    expect(classificarPercentual(100)).toBe('Excelência');
  });
  it('classifica Avançado para percentual >= 70 e < 90', () => {
    expect(classificarPercentual(70)).toBe('Avançado');
    expect(classificarPercentual(89)).toBe('Avançado');
  });
  it('classifica Intermediário para percentual >= 50 e < 70', () => {
    expect(classificarPercentual(50)).toBe('Intermediário');
  });
  it('classifica Básico para percentual >= 30 e < 50', () => {
    expect(classificarPercentual(30)).toBe('Básico');
  });
  it('classifica Inicial para percentual < 30', () => {
    expect(classificarPercentual(0)).toBe('Inicial');
    expect(classificarPercentual(29)).toBe('Inicial');
  });
});

// ============================================================
// determinarStatusCiclo
// ============================================================
describe('determinarStatusCiclo', () => {
  it('retorna finalizado quando data atual > dataFim', () => {
    expect(determinarStatusCiclo('2025-01-01', '2025-02-28', new Date('2025-03-15'))).toBe('finalizado');
  });
  it('retorna em_andamento quando data está entre inicio e fim', () => {
    expect(determinarStatusCiclo('2025-01-01', '2025-03-31', new Date('2025-02-15'))).toBe('em_andamento');
  });
  it('retorna futuro quando data atual < dataInicio', () => {
    expect(determinarStatusCiclo('2025-06-01', '2025-08-31', new Date('2025-03-15'))).toBe('futuro');
  });
});

// ============================================================
// Indicador 1 - Participação nas Mentorias
// ============================================================
describe('Indicador 1 - Participação nas Mentorias', () => {
  it('calcula presença corretamente para aluno1 (2/3 = 66.67%)', () => {
    const ind = calcularIndicadoresAluno('aluno1', mockMentorias, [], []);
    expect(ind.participacaoMentorias).toBeCloseTo(66.67, 1);
    expect(ind.totalMentorias).toBe(3);
    expect(ind.mentoriasPresente).toBe(2);
  });

  it('calcula 100% para aluno com todas presenças', () => {
    const mentorias: MentoringRecord[] = [
      { idUsuario: 'a', nomeAluno: 'A', empresa: 'E', presenca: 'presente', sessao: 1 },
      { idUsuario: 'a', nomeAluno: 'A', empresa: 'E', presenca: 'presente', sessao: 2 },
    ];
    const ind = calcularIndicadoresAluno('a', mentorias, [], []);
    expect(ind.participacaoMentorias).toBe(100);
  });

  it('retorna 0 quando não há mentorias', () => {
    const ind = calcularIndicadoresAluno('a', [], [], []);
    expect(ind.participacaoMentorias).toBe(0);
  });
});

// ============================================================
// Indicador 2 - Atividades Práticas (excluindo Assessment)
// ============================================================
describe('Indicador 2 - Atividades Práticas (excluindo Assessment)', () => {
  it('exclui 1ª mentoria (Assessment) do cálculo', () => {
    // aluno1: sessão 1 = Assessment (sem_tarefa), sessão 2 = entregue, sessão 3 = nao_entregue
    // Sem Assessment: sessão 2 (entregue) e sessão 3 (nao_entregue) = 1/2 = 50%
    const ind = calcularIndicadoresAluno('aluno1', mockMentorias, [], []);
    expect(ind.atividadesPraticas).toBe(50);
    expect(ind.totalAtividades).toBe(2);
    expect(ind.atividadesEntregues).toBe(1);
  });

  it('calcula 100% quando todas atividades entregues (excluindo Assessment)', () => {
    // aluno2: sessão 1 = Assessment (sem_tarefa), sessão 2 = entregue
    // Sem Assessment: sessão 2 (entregue) = 1/1 = 100%
    const ind = calcularIndicadoresAluno('aluno2', mockMentorias, [], []);
    expect(ind.atividadesPraticas).toBe(100);
  });

  it('ignora mentorias sem_tarefa no cálculo de atividades', () => {
    const mentorias: MentoringRecord[] = [
      { idUsuario: 'a', nomeAluno: 'A', empresa: 'E', sessao: 1, presenca: 'presente', atividadeEntregue: 'sem_tarefa' },
      { idUsuario: 'a', nomeAluno: 'A', empresa: 'E', sessao: 2, presenca: 'presente', atividadeEntregue: 'sem_tarefa' },
      { idUsuario: 'a', nomeAluno: 'A', empresa: 'E', sessao: 3, presenca: 'presente', atividadeEntregue: 'entregue' },
    ];
    const ind = calcularIndicadoresAluno('a', mentorias, [], []);
    // Sem Assessment (sessão 1): sessão 2 (sem_tarefa, ignorada) + sessão 3 (entregue) = 1/1 = 100%
    expect(ind.atividadesPraticas).toBe(100);
    expect(ind.totalAtividades).toBe(1);
  });
});

// ============================================================
// Indicador 3 - Engajamento (combinação de 3 componentes)
// ============================================================
describe('Indicador 3 - Engajamento (Ind.1 + Ind.2 + Nota Mentora) / 3', () => {
  it('calcula engajamento excluindo nota da 1ª sessão (encontro inicial)', () => {
    // aluno1: Ind.1 = 66.67%, Ind.2 = 50%
    // Nota mentora: 1ª sessão (eng=5) EXCLUÍDA, só conta sessão 2 (eng=4) e 3 (eng=3)
    // Média = (4+3)/2 = 3.5 → (3.5/10)*100 = 35%
    // Engajamento = (66.67 + 50 + 35) / 3 = 50.56%
    const ind = calcularIndicadoresAluno('aluno1', mockMentorias, [], []);
    expect(ind.engajamento).toBeCloseTo(50.56, 0);
  });

  it('retorna componentes do engajamento excluindo 1ª sessão', () => {
    const ind = calcularIndicadoresAluno('aluno1', mockMentorias, [], []);
    expect(ind.engajamentoComponentes).toBeDefined();
    expect(ind.engajamentoComponentes.presenca).toBeCloseTo(66.67, 1);
    expect(ind.engajamentoComponentes.atividades).toBe(50);
    // Sem 1ª sessão: (4+3)/2 = 3.5 → 35%
    expect(ind.engajamentoComponentes.notaMentora).toBe(35);
  });

  it('converte nota mentora 0-10 para percentual (edge case: 1 sessão mantém)', () => {
    // Edge case: quando só tem 1 sessão, mantém a nota (não exclui)
    const m0: MentoringRecord[] = [{ idUsuario: 'a', nomeAluno: 'A', empresa: 'E', sessao: 1, presenca: 'presente', engajamento: 0 }];
    const m2: MentoringRecord[] = [{ idUsuario: 'a', nomeAluno: 'A', empresa: 'E', sessao: 1, presenca: 'presente', engajamento: 2 }];
    const m5: MentoringRecord[] = [{ idUsuario: 'a', nomeAluno: 'A', empresa: 'E', sessao: 1, presenca: 'presente', engajamento: 5 }];
    const m7: MentoringRecord[] = [{ idUsuario: 'a', nomeAluno: 'A', empresa: 'E', sessao: 1, presenca: 'presente', engajamento: 7 }];
    const m10: MentoringRecord[] = [{ idUsuario: 'a', nomeAluno: 'A', empresa: 'E', sessao: 1, presenca: 'presente', engajamento: 10 }];

    // Edge case: só 1 sessão, mantém nota
    expect(calcularIndicadoresAluno('a', m0, [], []).engajamentoComponentes.notaMentora).toBe(0);
    expect(calcularIndicadoresAluno('a', m2, [], []).engajamentoComponentes.notaMentora).toBe(20);
    expect(calcularIndicadoresAluno('a', m5, [], []).engajamentoComponentes.notaMentora).toBe(50);
    expect(calcularIndicadoresAluno('a', m7, [], []).engajamentoComponentes.notaMentora).toBe(70);
    expect(calcularIndicadoresAluno('a', m10, [], []).engajamentoComponentes.notaMentora).toBe(100);
  });

  it('exclui 1ª sessão quando há múltiplas sessões', () => {
    // 2 sessões: sessão 1 (eng=8, EXCLUÍDA), sessão 2 (eng=6)
    // Nota mentora = 6 → 60%
    const m: MentoringRecord[] = [
      { idUsuario: 'a', nomeAluno: 'A', empresa: 'E', sessao: 1, presenca: 'presente', engajamento: 8 },
      { idUsuario: 'a', nomeAluno: 'A', empresa: 'E', sessao: 2, presenca: 'presente', engajamento: 6 },
    ];
    expect(calcularIndicadoresAluno('a', m, [], []).engajamentoComponentes.notaMentora).toBe(60);
  });

  it('estágios de evolução: Excelência (9-10), Avançado (7-8), Intermediário (5-6), Básico (3-4), Inicial (0-2)', () => {
    // Edge case: só 1 sessão, mantém nota
    const m9: MentoringRecord[] = [{ idUsuario: 'a', nomeAluno: 'A', empresa: 'E', sessao: 1, presenca: 'presente', engajamento: 9 }];
    expect(calcularIndicadoresAluno('a', m9, [], []).engajamentoComponentes.notaMentora).toBe(90);
    
    const m3: MentoringRecord[] = [{ idUsuario: 'a', nomeAluno: 'A', empresa: 'E', sessao: 1, presenca: 'presente', engajamento: 3 }];
    expect(calcularIndicadoresAluno('a', m3, [], []).engajamentoComponentes.notaMentora).toBe(30);
  });
});

// ============================================================
// Indicador 6 - Participação em Eventos
// ============================================================
describe('Indicador 6 - Participação em Eventos', () => {
  it('calcula presença em eventos corretamente', () => {
    const ind = calcularIndicadoresAluno('aluno1', [], mockEventos, []);
    expect(ind.participacaoEventos).toBe(50); // 1/2
    expect(ind.totalEventos).toBe(2);
    expect(ind.eventosPresente).toBe(1);
  });

  it('calcula 100% quando todos eventos presentes', () => {
    const ind = calcularIndicadoresAluno('aluno2', [], mockEventos, []);
    expect(ind.participacaoEventos).toBe(100); // 2/2
  });
});

// ============================================================
// Indicador 7 - Performance Geral (média dos 6)
// ============================================================
describe('Indicador 7 - Performance Geral', () => {
  it('calcula performance geral como média dos 6 indicadores', () => {
    const ind = calcularIndicadoresAluno('aluno1', mockMentorias, mockEventos, mockPerformance);
    // Ind.1: 66.67%, Ind.2: 50%, Ind.3: ~65.56%
    // Ind.4 e Ind.5: baseados em performance (sem ciclos, usa fallback)
    // Ind.6: 50%
    // performanceGeral = (Ind.1+Ind.2+Ind.3+Ind.4+Ind.5+Ind.6) / 6
    expect(ind.performanceGeral).toBeGreaterThan(0);
    expect(ind.performanceGeral).toBeLessThanOrEqual(100);
  });

  it('notaFinal é performanceGeral / 10', () => {
    const ind = calcularIndicadoresAluno('aluno1', mockMentorias, mockEventos, mockPerformance);
    expect(ind.notaFinal).toBeCloseTo(ind.performanceGeral / 10, 2);
  });

  it('classificação é baseada na notaFinal', () => {
    const ind = calcularIndicadoresAluno('aluno2', mockMentorias, mockEventos, mockPerformance);
    const expectedClass = classificarNota(ind.notaFinal);
    expect(ind.classificacao).toBe(expectedClass);
  });
});

// ============================================================
// Indicadores 4 e 5 com Ciclos
// ============================================================
describe('Indicadores 4 e 5 - Ciclos de Competências', () => {
  it('só inclui ciclos finalizados no cálculo', () => {
    const ciclos: CicloExecucaoData[] = [
      { id: 1, nomeCiclo: 'Ciclo 1', dataInicio: '2024-01-01', dataFim: '2024-03-31', competenciaIds: [1, 2] },
      { id: 2, nomeCiclo: 'Ciclo 2', dataInicio: '2027-06-01', dataFim: '2027-08-31', competenciaIds: [3, 4] },
    ];
    const ind = calcularIndicadoresAluno('aluno1', [], [], [], ciclos);
    expect(ind.ciclosFinalizados.length).toBe(1);
    expect(ind.ciclosFinalizados[0].nomeCiclo).toBe('Ciclo 1');
  });

  it('ciclos futuros são ignorados', () => {
    const ciclos: CicloExecucaoData[] = [
      { id: 1, nomeCiclo: 'Futuro', dataInicio: '2030-01-01', dataFim: '2030-06-30', competenciaIds: [1] },
    ];
    const ind = calcularIndicadoresAluno('aluno1', [], [], [], ciclos);
    expect(ind.ciclosFinalizados.length).toBe(0);
    expect(ind.ciclosEmAndamento.length).toBe(0);
  });

  it('sem ciclos definidos usa fallback com todas as competências', () => {
    const ind = calcularIndicadoresAluno('aluno1', [], [], mockPerformance);
    // Sem ciclos, usa lógica anterior
    expect(ind.performanceCompetencias).toBeGreaterThanOrEqual(0);
    expect(ind.performanceAprendizado).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// calcularIndicadoresTodosAlunos
// ============================================================
describe('calcularIndicadoresTodosAlunos', () => {
  it('calcula indicadores para todos os alunos', () => {
    const indicadores = calcularIndicadoresTodosAlunos(mockMentorias, mockEventos, mockPerformance);
    expect(indicadores.length).toBe(2);
    expect(indicadores.map(i => i.idUsuario).sort()).toEqual(['aluno1', 'aluno2']);
  });

  it('cada aluno tem os 7 indicadores', () => {
    const indicadores = calcularIndicadoresTodosAlunos(mockMentorias, mockEventos, mockPerformance);
    for (const ind of indicadores) {
      expect(ind.participacaoMentorias).toBeDefined();
      expect(ind.atividadesPraticas).toBeDefined();
      expect(ind.engajamento).toBeDefined();
      expect(ind.performanceCompetencias).toBeDefined();
      expect(ind.performanceAprendizado).toBeDefined();
      expect(ind.participacaoEventos).toBeDefined();
      expect(ind.performanceGeral).toBeDefined();
      expect(ind.engajamentoComponentes).toBeDefined();
    }
  });
});

// ============================================================
// agregarIndicadores
// ============================================================
describe('agregarIndicadores', () => {
  it('agrega indicadores gerais com médias dos 7 indicadores', () => {
    const indicadores = calcularIndicadoresTodosAlunos(mockMentorias, mockEventos, mockPerformance);
    const agregado = agregarIndicadores(indicadores, 'geral');
    expect(agregado.nivel).toBe('geral');
    expect(agregado.totalAlunos).toBe(2);
    expect(agregado.mediaPerformanceGeral).toBeGreaterThan(0);
    expect(agregado.mediaPerformanceAprendizado).toBeDefined();
  });

  it('filtra por empresa corretamente', () => {
    const indicadores = calcularIndicadoresTodosAlunos(mockMentorias, mockEventos, mockPerformance);
    const agregadoAcre = agregarIndicadores(indicadores, 'empresa', 'SEBRAE ACRE');
    const agregadoTO = agregarIndicadores(indicadores, 'empresa', 'SEBRAE TO');
    expect(agregadoAcre.totalAlunos).toBe(1);
    expect(agregadoTO.totalAlunos).toBe(1);
  });

  it('retorna zeros quando não há alunos', () => {
    const agregado = agregarIndicadores([], 'geral');
    expect(agregado.totalAlunos).toBe(0);
    expect(agregado.mediaPerformanceGeral).toBe(0);
  });

  it('calcula distribuição por classificação', () => {
    const indicadores = calcularIndicadoresTodosAlunos(mockMentorias, mockEventos, mockPerformance);
    const agregado = agregarIndicadores(indicadores, 'geral');
    expect(agregado.distribuicaoClassificacao.length).toBe(5);
    const totalDist = agregado.distribuicaoClassificacao.reduce((sum, d) => sum + d.quantidade, 0);
    expect(totalDist).toBe(2);
  });
});

// ============================================================
// calcularPerformanceFiltrada
// ============================================================
describe('calcularPerformanceFiltrada', () => {
  it('calcula percentual de aprovação corretamente', () => {
    const competencias = [
      { competenciaId: 1, codigoIntegracao: 'comp1', notaAtual: '8.5', metaNota: '7.00', status: 'concluida' },
      { competenciaId: 2, codigoIntegracao: 'comp2', notaAtual: '5.0', metaNota: '7.00', status: 'em_progresso' },
      { competenciaId: 3, codigoIntegracao: 'comp3', notaAtual: '9.0', metaNota: '7.00', status: 'concluida' },
    ];
    const result = calcularPerformanceFiltrada(competencias, []);
    expect(result.totalObrigatorias).toBe(3);
    expect(result.aprovadas).toBe(2);
    expect(result.percentualAprovacao).toBeCloseTo(66.67, 0);
  });

  it('retorna zeros quando não há competências', () => {
    const result = calcularPerformanceFiltrada([], []);
    expect(result.totalObrigatorias).toBe(0);
    expect(result.percentualAprovacao).toBe(0);
  });
});

// ============================================================
// obterEmpresas e obterTurmas
// ============================================================
describe('obterEmpresas e obterTurmas', () => {
  it('retorna empresas únicas', () => {
    const indicadores = calcularIndicadoresTodosAlunos(mockMentorias, mockEventos, mockPerformance);
    const empresas = obterEmpresas(indicadores);
    expect(empresas.length).toBe(2);
    expect(empresas).toContain('SEBRAE ACRE');
    expect(empresas).toContain('SEBRAE TO');
  });

  it('retorna turmas únicas', () => {
    const indicadores = calcularIndicadoresTodosAlunos(mockMentorias, mockEventos, mockPerformance);
    const turmas = obterTurmas(indicadores);
    expect(turmas.length).toBe(2);
    expect(turmas).toContain('Turma A');
    expect(turmas).toContain('Turma B');
  });

  it('filtra turmas por empresa', () => {
    const indicadores = calcularIndicadoresTodosAlunos(mockMentorias, mockEventos, mockPerformance);
    const turmasAcre = obterTurmas(indicadores, 'SEBRAE ACRE');
    expect(turmasAcre.length).toBe(1);
    expect(turmasAcre).toContain('Turma A');
  });
});

// ============================================================
// gerarDashboardGeral
// ============================================================
describe('gerarDashboardGeral', () => {
  it('gera dados completos para o dashboard', () => {
    const indicadores = calcularIndicadoresTodosAlunos(mockMentorias, mockEventos, mockPerformance);
    const dashboard = gerarDashboardGeral(indicadores);
    expect(dashboard.visaoGeral).toBeDefined();
    expect(dashboard.visaoGeral.totalAlunos).toBe(2);
    expect(dashboard.porEmpresa.length).toBe(2);
    expect(dashboard.topAlunos.length).toBeLessThanOrEqual(10);
  });
});
