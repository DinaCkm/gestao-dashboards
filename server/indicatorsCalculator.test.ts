import { describe, it, expect } from 'vitest';
import {
  calcularIndicadoresAluno,
  calcularIndicadoresTodosAlunos,
  agregarIndicadores,
  classificarNota,
  obterEmpresas,
  obterTurmas,
  gerarDashboardGeral,
  MentoringRecord,
  EventRecord,
  PerformanceRecord
} from './indicatorsCalculator';

// Dados de teste
const mockMentorias: MentoringRecord[] = [
  {
    idUsuario: 'aluno1',
    nomeAluno: 'João Silva',
    empresa: 'SEBRAE ACRE',
    turma: 'Turma A',
    presenca: 'presente',
    atividadeEntregue: 'entregue',
    engajamento: 5
  },
  {
    idUsuario: 'aluno1',
    nomeAluno: 'João Silva',
    empresa: 'SEBRAE ACRE',
    turma: 'Turma A',
    presenca: 'presente',
    atividadeEntregue: 'entregue',
    engajamento: 4
  },
  {
    idUsuario: 'aluno1',
    nomeAluno: 'João Silva',
    empresa: 'SEBRAE ACRE',
    turma: 'Turma A',
    presenca: 'ausente',
    atividadeEntregue: 'nao_entregue',
    engajamento: 3
  },
  {
    idUsuario: 'aluno2',
    nomeAluno: 'Maria Santos',
    empresa: 'SEBRAE TO',
    turma: 'Turma B',
    presenca: 'presente',
    atividadeEntregue: 'entregue',
    engajamento: 5
  },
  {
    idUsuario: 'aluno2',
    nomeAluno: 'Maria Santos',
    empresa: 'SEBRAE TO',
    turma: 'Turma B',
    presenca: 'presente',
    atividadeEntregue: 'entregue',
    engajamento: 5
  }
];

const mockEventos: EventRecord[] = [
  {
    idUsuario: 'aluno1',
    nomeAluno: 'João Silva',
    empresa: 'SEBRAE ACRE',
    tituloEvento: 'Webinar 1',
    presenca: 'presente'
  },
  {
    idUsuario: 'aluno1',
    nomeAluno: 'João Silva',
    empresa: 'SEBRAE ACRE',
    tituloEvento: 'Webinar 2',
    presenca: 'ausente'
  },
  {
    idUsuario: 'aluno2',
    nomeAluno: 'Maria Santos',
    empresa: 'SEBRAE TO',
    tituloEvento: 'Webinar 1',
    presenca: 'presente'
  },
  {
    idUsuario: 'aluno2',
    nomeAluno: 'Maria Santos',
    empresa: 'SEBRAE TO',
    tituloEvento: 'Webinar 2',
    presenca: 'presente'
  }
];

const mockPerformance: PerformanceRecord[] = [
  {
    idUsuario: 'aluno1',
    idCompetencia: 'comp1',
    nomeCompetencia: 'Liderança',
    notaAvaliacao: 8,
    aprovado: true
  },
  {
    idUsuario: 'aluno1',
    idCompetencia: 'comp2',
    nomeCompetencia: 'Comunicação',
    notaAvaliacao: 6,
    aprovado: false
  },
  {
    idUsuario: 'aluno2',
    idCompetencia: 'comp1',
    nomeCompetencia: 'Liderança',
    notaAvaliacao: 9,
    aprovado: true
  },
  {
    idUsuario: 'aluno2',
    idCompetencia: 'comp2',
    nomeCompetencia: 'Comunicação',
    notaAvaliacao: 8,
    aprovado: true
  }
];

describe('classificarNota', () => {
  it('deve classificar nota 9-10 como Excelência', () => {
    expect(classificarNota(9)).toBe('Excelência');
    expect(classificarNota(10)).toBe('Excelência');
    expect(classificarNota(9.5)).toBe('Excelência');
  });

  it('deve classificar nota 7-8 como Avançado', () => {
    expect(classificarNota(7)).toBe('Avançado');
    expect(classificarNota(8)).toBe('Avançado');
    expect(classificarNota(8.9)).toBe('Avançado');
  });

  it('deve classificar nota 5-6 como Intermediário', () => {
    expect(classificarNota(5)).toBe('Intermediário');
    expect(classificarNota(6)).toBe('Intermediário');
    expect(classificarNota(6.9)).toBe('Intermediário');
  });

  it('deve classificar nota 3-4 como Básico', () => {
    expect(classificarNota(3)).toBe('Básico');
    expect(classificarNota(4)).toBe('Básico');
    expect(classificarNota(4.9)).toBe('Básico');
  });

  it('deve classificar nota 0-2 como Inicial', () => {
    expect(classificarNota(0)).toBe('Inicial');
    expect(classificarNota(1)).toBe('Inicial');
    expect(classificarNota(2)).toBe('Inicial');
    expect(classificarNota(2.9)).toBe('Inicial');
  });
});

describe('calcularIndicadoresAluno', () => {
  it('deve calcular indicadores corretamente para aluno1', () => {
    const indicadores = calcularIndicadoresAluno(
      'aluno1',
      mockMentorias,
      mockEventos,
      mockPerformance
    );

    expect(indicadores.idUsuario).toBe('aluno1');
    expect(indicadores.nomeAluno).toBe('João Silva');
    expect(indicadores.empresa).toBe('SEBRAE ACRE');
    
    // Participação Mentorias: 2/3 = 66.67%
    expect(indicadores.participacaoMentorias).toBeCloseTo(66.67, 1);
    
    // Atividades: 2/3 = 66.67%
    expect(indicadores.atividadesPraticas).toBeCloseTo(66.67, 1);
    
    // Engajamento: média (5+4+3)/3 = 4 -> (4-1)/4*100 = 75%
    expect(indicadores.engajamento).toBeCloseTo(75, 0);
    
    // Performance: 1/2 = 50%
    expect(indicadores.performanceCompetencias).toBe(50);
    
    // Eventos: 1/2 = 50%
    expect(indicadores.participacaoEventos).toBe(50);
    
    // Nota final deve estar entre 0 e 10
    expect(indicadores.notaFinal).toBeGreaterThan(0);
    expect(indicadores.notaFinal).toBeLessThanOrEqual(10);
  });

  it('deve calcular indicadores corretamente para aluno2 (melhor desempenho)', () => {
    const indicadores = calcularIndicadoresAluno(
      'aluno2',
      mockMentorias,
      mockEventos,
      mockPerformance
    );

    expect(indicadores.idUsuario).toBe('aluno2');
    expect(indicadores.nomeAluno).toBe('Maria Santos');
    expect(indicadores.empresa).toBe('SEBRAE TO');
    
    // Participação Mentorias: 2/2 = 100%
    expect(indicadores.participacaoMentorias).toBe(100);
    
    // Atividades: 2/2 = 100%
    expect(indicadores.atividadesPraticas).toBe(100);
    
    // Engajamento: média 5 -> (5-1)/4*100 = 100%
    expect(indicadores.engajamento).toBe(100);
    
    // Performance: 2/2 = 100%
    expect(indicadores.performanceCompetencias).toBe(100);
    
    // Eventos: 2/2 = 100%
    expect(indicadores.participacaoEventos).toBe(100);
    
    // Nota final deve ser 10 (100% em todos)
    expect(indicadores.notaFinal).toBe(10);
    expect(indicadores.classificacao).toBe('Excelência');
  });
});

describe('calcularIndicadoresTodosAlunos', () => {
  it('deve calcular indicadores para todos os alunos', () => {
    const indicadores = calcularIndicadoresTodosAlunos(
      mockMentorias,
      mockEventos,
      mockPerformance
    );

    expect(indicadores.length).toBe(2);
    expect(indicadores.map(i => i.idUsuario).sort()).toEqual(['aluno1', 'aluno2']);
  });
});

describe('agregarIndicadores', () => {
  it('deve agregar indicadores gerais corretamente', () => {
    const indicadoresAlunos = calcularIndicadoresTodosAlunos(
      mockMentorias,
      mockEventos,
      mockPerformance
    );

    const agregado = agregarIndicadores(indicadoresAlunos, 'geral');

    expect(agregado.nivel).toBe('geral');
    expect(agregado.totalAlunos).toBe(2);
    expect(agregado.mediaNotaFinal).toBeGreaterThan(0);
  });

  it('deve agregar indicadores por empresa corretamente', () => {
    const indicadoresAlunos = calcularIndicadoresTodosAlunos(
      mockMentorias,
      mockEventos,
      mockPerformance
    );

    const agregadoAcre = agregarIndicadores(indicadoresAlunos, 'empresa', 'SEBRAE ACRE');
    const agregadoTO = agregarIndicadores(indicadoresAlunos, 'empresa', 'SEBRAE TO');

    expect(agregadoAcre.totalAlunos).toBe(1);
    expect(agregadoTO.totalAlunos).toBe(1);
    expect(agregadoTO.mediaNotaFinal).toBe(10); // Maria tem 100% em tudo
  });
});

describe('obterEmpresas', () => {
  it('deve retornar lista de empresas únicas', () => {
    const indicadoresAlunos = calcularIndicadoresTodosAlunos(
      mockMentorias,
      mockEventos,
      mockPerformance
    );

    const empresas = obterEmpresas(indicadoresAlunos);

    expect(empresas.length).toBe(2);
    expect(empresas).toContain('SEBRAE ACRE');
    expect(empresas).toContain('SEBRAE TO');
  });
});

describe('obterTurmas', () => {
  it('deve retornar lista de turmas únicas', () => {
    const indicadoresAlunos = calcularIndicadoresTodosAlunos(
      mockMentorias,
      mockEventos,
      mockPerformance
    );

    const turmas = obterTurmas(indicadoresAlunos);

    expect(turmas.length).toBe(2);
    expect(turmas).toContain('Turma A');
    expect(turmas).toContain('Turma B');
  });

  it('deve filtrar turmas por empresa', () => {
    const indicadoresAlunos = calcularIndicadoresTodosAlunos(
      mockMentorias,
      mockEventos,
      mockPerformance
    );

    const turmasAcre = obterTurmas(indicadoresAlunos, 'SEBRAE ACRE');

    expect(turmasAcre.length).toBe(1);
    expect(turmasAcre).toContain('Turma A');
  });
});

describe('gerarDashboardGeral', () => {
  it('deve gerar dados completos para o dashboard geral', () => {
    const indicadoresAlunos = calcularIndicadoresTodosAlunos(
      mockMentorias,
      mockEventos,
      mockPerformance
    );

    const dashboard = gerarDashboardGeral(indicadoresAlunos);

    expect(dashboard.visaoGeral).toBeDefined();
    expect(dashboard.visaoGeral.totalAlunos).toBe(2);
    
    expect(dashboard.porEmpresa).toBeDefined();
    expect(dashboard.porEmpresa.length).toBe(2);
    
    expect(dashboard.topAlunos).toBeDefined();
    expect(dashboard.topAlunos.length).toBeLessThanOrEqual(10);
    
    // O primeiro do top deve ser Maria (nota 10)
    expect(dashboard.topAlunos[0].nomeAluno).toBe('Maria Santos');
  });
});
