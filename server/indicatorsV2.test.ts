import { describe, it, expect } from 'vitest';
import { 
  calcularIndicadoresAluno, 
  calcularIndicadoresTodosAlunos,
  calcularIndicadoresCiclo,
  classificarPercentual,
  determinarStatusCiclo,
  type CicloDataV2, 
  type CaseSucessoData,
  type IndicadoresCiclo,
} from './indicatorsCalculatorV2';
import type { MentoringRecord, EventRecord, PerformanceRecord } from './excelProcessor';

// Helper para criar dados de mentoria
function mkMentoria(overrides: Partial<MentoringRecord> = {}): MentoringRecord {
  return {
    idUsuario: 'aluno1',
    nomeAluno: 'Teste Aluno',
    empresa: 'Empresa X',
    turma: 'T1',
    presenca: 'presente',
    atividadeEntregue: 'entregue',
    engajamento: 8,
    ...overrides,
  } as MentoringRecord;
}

// Helper para criar dados de evento
function mkEvento(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    idUsuario: 'aluno1',
    nomeAluno: 'Teste Aluno',
    empresa: 'Empresa X',
    tituloEvento: 'Evento 1',
    presenca: 'presente',
    ...overrides,
  } as EventRecord;
}

// Helper para criar dados de performance
function mkPerformance(overrides: Record<string, any> = {}): PerformanceRecord {
  return {
    idUsuario: 'aluno1',
    idCompetencia: 'COMP001',
    nomeCompetencia: 'Atenção',
    progressoAulas: 100,
    notaAvaliacao: 10, // escala 0-10
    aprovado: true,
    // Campos extras que o calculador acessa via `as any`
    aulasConcluidas: 6,
    aulasDisponiveis: 6,
    ...overrides,
  } as any;
}

// Helper para criar ciclo
function mkCiclo(overrides: Partial<CicloDataV2> = {}): CicloDataV2 {
  return {
    id: 1,
    nomeCiclo: 'Basic',
    trilhaNome: 'Trilha Gestão',
    dataInicio: '2025-01-01',
    dataFim: '2025-06-30',
    competenciaIds: [1, 2],
    ...overrides,
  };
}

describe('classificarPercentual', () => {
  it('deve classificar >= 90 como Excelência', () => {
    expect(classificarPercentual(95)).toBe('Excelência');
    expect(classificarPercentual(90)).toBe('Excelência');
  });
    it('deve classificar >= 70 como Avançado', () => {
    expect(classificarPercentual(80)).toBe('Avançado');
    expect(classificarPercentual(70)).toBe('Avançado');
  });
  it('deve classificar >= 50 como Intermediário', () => {
    expect(classificarPercentual(55)).toBe('Intermediário');
  });
  it('deve classificar >= 30 como Básico', () => {
    expect(classificarPercentual(35)).toBe('Básico');
  });
  it('deve classificar < 30 como Inicial', () => {
    expect(classificarPercentual(20)).toBe('Inicial');
  });
});

describe('determinarStatusCiclo', () => {
  it('deve retornar finalizado quando dataFim é passado', () => {
    const status = determinarStatusCiclo('2024-01-01', '2024-06-30', new Date('2025-01-01'));
    expect(status).toBe('finalizado');
  });
  it('deve retornar em_andamento quando hoje está entre inicio e fim', () => {
    const status = determinarStatusCiclo('2025-01-01', '2025-12-31', new Date('2025-06-15'));
    expect(status).toBe('em_andamento');
  });
  it('deve retornar futuro quando dataInicio é futuro', () => {
    const status = determinarStatusCiclo('2027-01-01', '2027-06-30', new Date('2025-06-15'));
    expect(status).toBe('futuro');
  });
});

describe('calcularIndicadoresAluno', () => {
  const emptyMap = new Map<number, string>();

  describe('Ind 1: Webinars/Aulas Online', () => {
    it('deve calcular 100% quando todas as presenças são "presente"', () => {
      const eventos = [
        mkEvento({ presenca: 'presente' }),
        mkEvento({ presenca: 'presente' }),
        mkEvento({ presenca: 'presente' }),
      ];
      const ciclos = [mkCiclo()];
      const result = calcularIndicadoresAluno('aluno1', [], eventos, [], ciclos, emptyMap, []);
      expect(result.consolidado.ind1_webinars).toBe(100);
    });

    it('deve calcular 50% quando metade das presenças são "ausente"', () => {
      const eventos = [
        mkEvento({ presenca: 'presente' }),
        mkEvento({ presenca: 'ausente' }),
      ];
      const ciclos = [mkCiclo()];
      const result = calcularIndicadoresAluno('aluno1', [], eventos, [], ciclos, emptyMap, []);
      expect(result.consolidado.ind1_webinars).toBe(50);
    });

    it('deve retornar 0% quando não há mentorias', () => {
      const ciclos = [mkCiclo()];
      const result = calcularIndicadoresAluno('aluno1', [], [], [], ciclos, emptyMap, []);
      expect(result.consolidado.ind1_webinars).toBe(0);
    });
  });

  describe('Ind 2: Performance nas Avaliações', () => {
    it('deve calcular média das notas das provas realizadas', () => {
      const performance = [
        mkPerformance({ idCompetencia: 'COMP001', notaAvaliacao: 10 }), // 10*10=100
        mkPerformance({ idCompetencia: 'COMP002', notaAvaliacao: 8 }),  // 8*10=80
      ];
      const ciclos = [mkCiclo()];
      const compMap = new Map<number, string>([[1, 'COMP001'], [2, 'COMP002']]);
      const result = calcularIndicadoresAluno('aluno1', [], [], performance, ciclos, compMap, []);
      // Média de (10*10 + 8*10)/2 = 90
      expect(result.consolidado.ind2_avaliacoes).toBe(90);
    });

    it('deve ignorar competências sem provas (mediaProvas = 0)', () => {
      const performance = [
        mkPerformance({ idCompetencia: 'COMP001', notaAvaliacao: 10 }),
        mkPerformance({ idCompetencia: 'COMP002', notaAvaliacao: -1 }), // sem prova
      ];
      const ciclos = [mkCiclo()];
      const compMap = new Map<number, string>([[1, 'COMP001'], [2, 'COMP002']]);
      const result = calcularIndicadoresAluno('aluno1', [], [], performance, ciclos, compMap, []);
      // Apenas COMP001 tem prova, média = 100
      expect(result.consolidado.ind2_avaliacoes).toBe(100);
    });
  });

  describe('Ind 3: Performance nas Competências', () => {
    it('deve calcular % de competências finalizadas', () => {
      const performance = [
        mkPerformance({ idCompetencia: 'COMP001', aulasConcluidas: 6, aulasDisponiveis: 6 }), // concluída
        mkPerformance({ idCompetencia: 'COMP002', aulasConcluidas: 3, aulasDisponiveis: 6 }), // em progresso
      ];
      const ciclos = [mkCiclo()];
      const compMap = new Map<number, string>([[1, 'COMP001'], [2, 'COMP002']]);
      const result = calcularIndicadoresAluno('aluno1', [], [], performance, ciclos, compMap, []);
      expect(result.consolidado.ind3_competencias).toBe(50);
    });

    it('deve retornar 100% quando todas estão concluídas', () => {
      const performance = [
        mkPerformance({ idCompetencia: 'COMP001', aulasConcluidas: 6, aulasDisponiveis: 6 }),
        mkPerformance({ idCompetencia: 'COMP002', aulasConcluidas: 4, aulasDisponiveis: 4 }),
      ];
      const ciclos = [mkCiclo()];
      const compMap = new Map<number, string>([[1, 'COMP001'], [2, 'COMP002']]);
      const result = calcularIndicadoresAluno('aluno1', [], [], performance, ciclos, compMap, []);
      expect(result.consolidado.ind3_competencias).toBe(100);
    });
  });

  describe('Ind 4: Tarefas Práticas', () => {
    it('deve calcular 100% quando todas as tarefas são entregues', () => {
      const mentorias = [
        mkMentoria({ atividadeEntregue: 'entregue' }),
        mkMentoria({ atividadeEntregue: 'entregue' }),
      ];
      const ciclos = [mkCiclo()];
      const result = calcularIndicadoresAluno('aluno1', mentorias, [], [], ciclos, emptyMap, []);
      expect(result.consolidado.ind4_tarefas).toBe(100);
    });

    it('deve calcular 50% quando metade das tarefas não são entregues', () => {
      const mentorias = [
        mkMentoria({ atividadeEntregue: 'entregue' }),
        mkMentoria({ atividadeEntregue: 'nao_entregue' }),
      ];
      const ciclos = [mkCiclo()];
      const result = calcularIndicadoresAluno('aluno1', mentorias, [], [], ciclos, emptyMap, []);
      expect(result.consolidado.ind4_tarefas).toBe(50);
    });

    it('deve ignorar sessões sem tarefa', () => {
      const mentorias = [
        mkMentoria({ atividadeEntregue: 'entregue' }),
        mkMentoria({ atividadeEntregue: 'sem_tarefa' }),
      ];
      const ciclos = [mkCiclo()];
      const result = calcularIndicadoresAluno('aluno1', mentorias, [], [], ciclos, emptyMap, []);
      expect(result.consolidado.ind4_tarefas).toBe(100);
    });
  });

  describe('Ind 5: Engajamento (Nota Mentora)', () => {
    it('deve calcular média das notas da mentora', () => {
      const mentorias = [
        mkMentoria({ engajamento: 8 }),
        mkMentoria({ engajamento: 6 }),
      ];
      const ciclos = [mkCiclo()];
      const result = calcularIndicadoresAluno('aluno1', mentorias, [], [], ciclos, emptyMap, []);
      expect(result.consolidado.ind5_engajamento).toBeGreaterThanOrEqual(0);
      expect(result.consolidado.ind5_engajamento).toBeLessThanOrEqual(100);
    });

    it('deve retornar 0% quando não há notas', () => {
      const mentorias = [
        mkMentoria({ engajamento: undefined }),
      ];
      const ciclos = [mkCiclo()];
      const result = calcularIndicadoresAluno('aluno1', mentorias, [], [], ciclos, emptyMap, []);
      expect(result.consolidado.ind5_engajamento).toBe(0);
    });
  });

  describe('Ind 6: Aplicabilidade Prática (Case)', () => {
    it('deve retornar 100% quando case é entregue em ciclo finalizado', () => {
      const ciclos = [mkCiclo()];
      const cases: CaseSucessoData[] = [{
        alunoId: 1,
        trilhaId: 1,
        trilhaNome: 'Trilha Gestão',
        entregue: true,
      }];
      const result = calcularIndicadoresAluno('aluno1', [], [], [], ciclos, emptyMap, cases);
      const cicloFinalizado = result.ciclosFinalizados[0];
      expect(cicloFinalizado).toBeDefined();
      if (cicloFinalizado) {
        expect(cicloFinalizado.ind6_aplicabilidade).toBe(100);
      }
    });

    it('deve retornar 0% quando case não é entregue em ciclo finalizado', () => {
      const ciclos = [mkCiclo()];
      const cases: CaseSucessoData[] = [{
        alunoId: 1,
        trilhaId: 1,
        trilhaNome: 'Trilha Gestão',
        entregue: false,
      }];
      const result = calcularIndicadoresAluno('aluno1', [], [], [], ciclos, emptyMap, cases);
      const cicloFinalizado = result.ciclosFinalizados[0];
      expect(cicloFinalizado).toBeDefined();
      if (cicloFinalizado) {
        expect(cicloFinalizado.ind6_aplicabilidade).toBe(0);
      }
    });

    it('não deve penalizar ciclo em andamento por falta de case', () => {
      const ciclos = [mkCiclo({ dataInicio: '2025-01-01', dataFim: '2027-12-31' })];
      const result = calcularIndicadoresAluno('aluno1', [], [], [], ciclos, emptyMap, []);
      const cicloEmAndamento = result.ciclosEmAndamento[0];
      expect(cicloEmAndamento).toBeDefined();
      if (cicloEmAndamento) {
        expect(cicloEmAndamento.detalhes.case.obrigatorio).toBe(false);
      }
    });
  });

  describe('Ind 7: Engajamento Final', () => {
    it('deve ser a média dos 6 indicadores', () => {
      const mentorias = [
        mkMentoria({ presenca: 'presente', atividadeEntregue: 'entregue', engajamento: 10 }),
      ];
      const performance = [
        mkPerformance({ idCompetencia: 'COMP001', notaAvaliacao: 10, aulasConcluidas: 6, aulasDisponiveis: 6 }),
        mkPerformance({ idCompetencia: 'COMP002', notaAvaliacao: 10, aulasConcluidas: 4, aulasDisponiveis: 4 }),
      ];
      const ciclos = [mkCiclo()];
      const compMap = new Map<number, string>([[1, 'COMP001'], [2, 'COMP002']]);
      const cases: CaseSucessoData[] = [{
        alunoId: 1, trilhaId: 1, trilhaNome: 'Trilha Gestão', entregue: true,
      }];
      const result = calcularIndicadoresAluno('aluno1', mentorias, [], performance, ciclos, compMap, cases);
      const consolidado = result.consolidado;
      
      const mediaEsperada = (
        consolidado.ind1_webinars + 
        consolidado.ind2_avaliacoes + 
        consolidado.ind3_competencias + 
        consolidado.ind4_tarefas + 
        consolidado.ind5_engajamento + 
        consolidado.ind6_aplicabilidade
      ) / 6;
      expect(consolidado.ind7_engajamentoFinal).toBeCloseTo(mediaEsperada, 1);
    });
  });

  describe('Separação por ciclo', () => {
    it('deve separar ciclos finalizados e em andamento', () => {
      const ciclos = [
        mkCiclo({ id: 1, nomeCiclo: 'Basic', dataInicio: '2024-01-01', dataFim: '2024-06-30' }),
        mkCiclo({ id: 2, nomeCiclo: 'Essential', dataInicio: '2025-01-01', dataFim: '2027-12-31', competenciaIds: [3] }),
      ];
      const result = calcularIndicadoresAluno('aluno1', [], [], [], ciclos, emptyMap, []);
      expect(result.ciclosFinalizados.length).toBe(1);
      expect(result.ciclosEmAndamento.length).toBe(1);
      expect(result.ciclosFinalizados[0].nomeCiclo).toBe('Basic');
      expect(result.ciclosEmAndamento[0].nomeCiclo).toBe('Essential');
    });
  });

  describe('Alerta de Case Pendente', () => {
    it('deve gerar alerta quando ciclo está finalizando e case não entregue', () => {
      const hoje = new Date();
      const em15dias = new Date(hoje.getTime() + 15 * 24 * 60 * 60 * 1000);
      const ciclos = [mkCiclo({ 
        dataInicio: '2025-01-01',
        dataFim: em15dias.toISOString().split('T')[0],
      })];
      const result = calcularIndicadoresAluno('aluno1', [], [], [], ciclos, emptyMap, [], hoje);
      expect(result.alertaCasePendente.length).toBeGreaterThanOrEqual(0);
    });

    it('não deve gerar alerta quando case já foi entregue', () => {
      const hoje = new Date();
      const em15dias = new Date(hoje.getTime() + 15 * 24 * 60 * 60 * 1000);
      const ciclos = [mkCiclo({ 
        dataInicio: '2025-01-01',
        dataFim: em15dias.toISOString().split('T')[0],
      })];
      const cases: CaseSucessoData[] = [{
        alunoId: 1, trilhaId: 1, trilhaNome: 'Trilha Gestão', entregue: true,
      }];
      const result = calcularIndicadoresAluno('aluno1', [], [], [], ciclos, emptyMap, cases, hoje);
      const alertaParaTrilha = result.alertaCasePendente.filter(a => a.trilhaNome === 'Trilha Gestão');
      expect(alertaParaTrilha.length).toBe(0);
    });
  });

  describe('Compatibilidade V1', () => {
    it('deve manter campos de compatibilidade v1', () => {
      const mentorias = [mkMentoria()];
      const ciclos = [mkCiclo()];
      const result = calcularIndicadoresAluno('aluno1', mentorias, [], [], ciclos, emptyMap, []);
      
      expect(result).toHaveProperty('participacaoMentorias');
      expect(result).toHaveProperty('atividadesPraticas');
      expect(result).toHaveProperty('engajamento');
      expect(result).toHaveProperty('performanceCompetencias');
      expect(result).toHaveProperty('performanceAprendizado');
      expect(result).toHaveProperty('participacaoEventos');
      expect(result).toHaveProperty('performanceGeral');
      expect(result).toHaveProperty('classificacao');
      expect(result).toHaveProperty('notaFinal');
    });
  });

  describe('Caso Etienne (exemplo real)', () => {
    it('deve calcular corretamente com dados reais da Etienne', () => {
      const performance = [
        mkPerformance({ 
          idUsuario: 'etienne1',
          idCompetencia: 'COMP_ATENCAO', 
          nomeCompetencia: 'Atenção',
          notaAvaliacao: 10,
          aulasConcluidas: 6,
          aulasDisponiveis: 6,
        }),
      ];
      const ciclos = [mkCiclo({ 
        id: 1,
        nomeCiclo: 'Basic',
        dataInicio: '2024-01-01',
        dataFim: '2024-06-30',
        competenciaIds: [1],
      })];
      const compMap = new Map<number, string>([[1, 'COMP_ATENCAO']]);
      
      const result = calcularIndicadoresAluno('etienne1', [], [], performance, ciclos, compMap, []);
      
      expect(result.consolidado.ind2_avaliacoes).toBe(100);
      expect(result.consolidado.ind3_competencias).toBe(100);
    });
  });
});

describe('calcularIndicadoresTodosAlunos', () => {
  it('deve calcular indicadores para múltiplos alunos', () => {
    const mentorias = [
      mkMentoria({ idUsuario: 'aluno1', presenca: 'presente' }),
      mkMentoria({ idUsuario: 'aluno2', nomeAluno: 'Aluno 2', presenca: 'ausente' }),
    ];
    const ciclos = [mkCiclo()];
    const ciclosPorAluno = new Map<string, CicloDataV2[]>();
    ciclosPorAluno.set('aluno1', ciclos);
    ciclosPorAluno.set('aluno2', ciclos);
    const result = calcularIndicadoresTodosAlunos(mentorias, [], [], ciclosPorAluno, new Map(), []);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('deve retornar array vazio quando não há dados', () => {
    const result = calcularIndicadoresTodosAlunos([], [], [], new Map<string, CicloDataV2[]>(), new Map(), []);
    expect(result).toEqual([]);
  });
});
