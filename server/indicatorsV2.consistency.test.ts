import { describe, it, expect } from 'vitest';
import {
  calcularIndicadoresAluno,
  calcularIndicadoresTodosAlunos,
  agregarIndicadores,
  gerarDashboardGeral,
  gerarDashboardEmpresa,
  type MentoringRecord,
  type EventRecord,
  type PerformanceRecord,
  type CicloExecucao,
  type CaseSucessoData,
} from './indicatorsCalculatorV2';

// Dados de teste fixos
const mentorias: MentoringRecord[] = [
  { idUsuario: 'A1', nomeAluno: 'Alice', empresa: 'EmpA', turma: 'T1', presenca: 'presente', atividadeEntregue: 'entregue', engajamento: 8 },
  { idUsuario: 'A1', nomeAluno: 'Alice', empresa: 'EmpA', turma: 'T1', presenca: 'presente', atividadeEntregue: 'entregue', engajamento: 7 },
  { idUsuario: 'A1', nomeAluno: 'Alice', empresa: 'EmpA', turma: 'T1', presenca: 'ausente', atividadeEntregue: 'nao_entregue', engajamento: 5 },
  { idUsuario: 'B1', nomeAluno: 'Bob', empresa: 'EmpA', turma: 'T1', presenca: 'presente', atividadeEntregue: 'entregue', engajamento: 9 },
  { idUsuario: 'B1', nomeAluno: 'Bob', empresa: 'EmpA', turma: 'T1', presenca: 'presente', atividadeEntregue: 'entregue', engajamento: 8 },
];

const eventos: EventRecord[] = [
  { idUsuario: 'A1', nomeAluno: 'Alice', empresa: 'EmpA', tituloEvento: 'Webinar 1', presenca: 'presente', dataEvento: new Date('2025-01-15') },
  { idUsuario: 'A1', nomeAluno: 'Alice', empresa: 'EmpA', tituloEvento: 'Webinar 2', presenca: 'ausente', dataEvento: new Date('2025-02-15') },
  { idUsuario: 'B1', nomeAluno: 'Bob', empresa: 'EmpA', tituloEvento: 'Webinar 1', presenca: 'presente', dataEvento: new Date('2025-01-15') },
  { idUsuario: 'B1', nomeAluno: 'Bob', empresa: 'EmpA', tituloEvento: 'Webinar 2', presenca: 'presente', dataEvento: new Date('2025-02-15') },
];

const performance: PerformanceRecord[] = [
  { idUsuario: 'A1', idCompetencia: 'C1', nomeCompetencia: 'Comp1', totalConteudos: 10, conteudosConcluidos: 8, nota: 85 },
  { idUsuario: 'A1', idCompetencia: 'C2', nomeCompetencia: 'Comp2', totalConteudos: 10, conteudosConcluidos: 6, nota: 70 },
  { idUsuario: 'B1', idCompetencia: 'C1', nomeCompetencia: 'Comp1', totalConteudos: 10, conteudosConcluidos: 10, nota: 95 },
  { idUsuario: 'B1', idCompetencia: 'C2', nomeCompetencia: 'Comp2', totalConteudos: 10, conteudosConcluidos: 9, nota: 90 },
];

const compIdToCodigoMap = new Map<number, string>([
  [1, 'C1'],
  [2, 'C2'],
]);

const casesData: CaseSucessoData[] = [];

const hoje = new Date('2025-06-01');

// Ciclos para Alice
const ciclosAlice: CicloExecucao[] = [
  {
    cicloId: 1,
    nomeCiclo: 'Ciclo 1 - Trilha A',
    dataInicio: new Date('2025-01-01'),
    dataFim: new Date('2025-03-31'),
    competenciaIds: [1, 2],
    trilhaNome: 'Trilha A',
  },
];

// Ciclos para Bob
const ciclosBob: CicloExecucao[] = [
  {
    cicloId: 2,
    nomeCiclo: 'Ciclo 1 - Trilha A',
    dataInicio: new Date('2025-01-01'),
    dataFim: new Date('2025-03-31'),
    competenciaIds: [1, 2],
    trilhaNome: 'Trilha A',
  },
];

describe('Indicadores V2 - Consistência entre cálculos individual e global', () => {
  it('deve retornar valores idênticos para o mesmo aluno calculado individualmente vs globalmente', () => {
    // Cálculo individual para Alice
    const aliceIndividual = calcularIndicadoresAluno(
      'A1', mentorias, eventos, performance, ciclosAlice, compIdToCodigoMap, casesData, hoje
    );

    // Cálculo global para todos
    const ciclosPorAluno = new Map<string, CicloExecucao[]>();
    ciclosPorAluno.set('A1', ciclosAlice);
    ciclosPorAluno.set('B1', ciclosBob);

    const todosIndicadores = calcularIndicadoresTodosAlunos(
      mentorias, eventos, performance, ciclosPorAluno, compIdToCodigoMap, casesData, hoje
    );

    const aliceGlobal = todosIndicadores.find(i => i.idUsuario === 'A1');
    expect(aliceGlobal).toBeDefined();

    // Comparar consolidado
    expect(aliceIndividual.consolidado.ind1_webinars).toBe(aliceGlobal!.consolidado.ind1_webinars);
    expect(aliceIndividual.consolidado.ind2_avaliacoes).toBe(aliceGlobal!.consolidado.ind2_avaliacoes);
    expect(aliceIndividual.consolidado.ind3_competencias).toBe(aliceGlobal!.consolidado.ind3_competencias);
    expect(aliceIndividual.consolidado.ind4_tarefas).toBe(aliceGlobal!.consolidado.ind4_tarefas);
    expect(aliceIndividual.consolidado.ind5_engajamento).toBe(aliceGlobal!.consolidado.ind5_engajamento);
    expect(aliceIndividual.consolidado.ind6_aplicabilidade).toBe(aliceGlobal!.consolidado.ind6_aplicabilidade);
    expect(aliceIndividual.consolidado.ind7_engajamentoFinal).toBe(aliceGlobal!.consolidado.ind7_engajamentoFinal);

    // Comparar classificação
    expect(aliceIndividual.classificacao).toBe(aliceGlobal!.classificacao);
    expect(aliceIndividual.notaFinal).toBe(aliceGlobal!.notaFinal);
  });

  it('deve retornar valores idênticos para Bob calculado individualmente vs globalmente', () => {
    const bobIndividual = calcularIndicadoresAluno(
      'B1', mentorias, eventos, performance, ciclosBob, compIdToCodigoMap, casesData, hoje
    );

    const ciclosPorAluno = new Map<string, CicloExecucao[]>();
    ciclosPorAluno.set('A1', ciclosAlice);
    ciclosPorAluno.set('B1', ciclosBob);

    const todosIndicadores = calcularIndicadoresTodosAlunos(
      mentorias, eventos, performance, ciclosPorAluno, compIdToCodigoMap, casesData, hoje
    );

    const bobGlobal = todosIndicadores.find(i => i.idUsuario === 'B1');
    expect(bobGlobal).toBeDefined();

    expect(bobIndividual.consolidado.ind1_webinars).toBe(bobGlobal!.consolidado.ind1_webinars);
    expect(bobIndividual.consolidado.ind2_avaliacoes).toBe(bobGlobal!.consolidado.ind2_avaliacoes);
    expect(bobIndividual.consolidado.ind3_competencias).toBe(bobGlobal!.consolidado.ind3_competencias);
    expect(bobIndividual.consolidado.ind4_tarefas).toBe(bobGlobal!.consolidado.ind4_tarefas);
    expect(bobIndividual.consolidado.ind5_engajamento).toBe(bobGlobal!.consolidado.ind5_engajamento);
    expect(bobIndividual.consolidado.ind6_aplicabilidade).toBe(bobGlobal!.consolidado.ind6_aplicabilidade);
    expect(bobIndividual.consolidado.ind7_engajamentoFinal).toBe(bobGlobal!.consolidado.ind7_engajamentoFinal);

    expect(bobIndividual.classificacao).toBe(bobGlobal!.classificacao);
    expect(bobIndividual.notaFinal).toBe(bobGlobal!.notaFinal);
  });

  it('agregarIndicadores deve calcular médias corretas dos campos V2', () => {
    const ciclosPorAluno = new Map<string, CicloExecucao[]>();
    ciclosPorAluno.set('A1', ciclosAlice);
    ciclosPorAluno.set('B1', ciclosBob);

    const todosIndicadores = calcularIndicadoresTodosAlunos(
      mentorias, eventos, performance, ciclosPorAluno, compIdToCodigoMap, casesData, hoje
    );

    const agregado = agregarIndicadores(todosIndicadores, 'geral');

    // Médias devem ser a média dos valores individuais
    const alice = todosIndicadores.find(i => i.idUsuario === 'A1')!;
    const bob = todosIndicadores.find(i => i.idUsuario === 'B1')!;

    expect(agregado.mediaInd1).toBeCloseTo((alice.consolidado.ind1_webinars + bob.consolidado.ind1_webinars) / 2, 2);
    expect(agregado.mediaInd2).toBeCloseTo((alice.consolidado.ind2_avaliacoes + bob.consolidado.ind2_avaliacoes) / 2, 2);
    expect(agregado.mediaInd3).toBeCloseTo((alice.consolidado.ind3_competencias + bob.consolidado.ind3_competencias) / 2, 2);
    expect(agregado.mediaInd4).toBeCloseTo((alice.consolidado.ind4_tarefas + bob.consolidado.ind4_tarefas) / 2, 2);
    expect(agregado.mediaInd5).toBeCloseTo((alice.consolidado.ind5_engajamento + bob.consolidado.ind5_engajamento) / 2, 2);
    expect(agregado.mediaInd6).toBeCloseTo((alice.consolidado.ind6_aplicabilidade + bob.consolidado.ind6_aplicabilidade) / 2, 2);
    expect(agregado.mediaInd7).toBeCloseTo((alice.consolidado.ind7_engajamentoFinal + bob.consolidado.ind7_engajamentoFinal) / 2, 2);

    // Compatibilidade v1 deve ser mapeada corretamente
    expect(agregado.mediaPerformanceGeral).toBe(agregado.mediaInd7);
    expect(agregado.mediaNotaFinal).toBeCloseTo(agregado.mediaInd7 / 10, 2);
    expect(agregado.totalAlunos).toBe(2);
  });

  it('gerarDashboardGeral deve retornar dados consistentes', () => {
    const ciclosPorAluno = new Map<string, CicloExecucao[]>();
    ciclosPorAluno.set('A1', ciclosAlice);
    ciclosPorAluno.set('B1', ciclosBob);

    const todosIndicadores = calcularIndicadoresTodosAlunos(
      mentorias, eventos, performance, ciclosPorAluno, compIdToCodigoMap, casesData, hoje
    );

    const dashboard = gerarDashboardGeral(todosIndicadores);

    expect(dashboard.visaoGeral.totalAlunos).toBe(2);
    // mediaInd7 pode ser 0 se os ciclos não tiverem dados suficientes
    expect(dashboard.visaoGeral.mediaInd7).toBeGreaterThanOrEqual(0);
    expect(dashboard.topAlunos.length).toBeLessThanOrEqual(10);
    
    // topAlunos deve estar ordenado por notaFinal decrescente
    for (let i = 1; i < dashboard.topAlunos.length; i++) {
      expect(dashboard.topAlunos[i - 1].notaFinal).toBeGreaterThanOrEqual(dashboard.topAlunos[i].notaFinal);
    }
  });

  it('gerarDashboardEmpresa deve retornar dados consistentes para EmpA', () => {
    const ciclosPorAluno = new Map<string, CicloExecucao[]>();
    ciclosPorAluno.set('A1', ciclosAlice);
    ciclosPorAluno.set('B1', ciclosBob);

    const todosIndicadores = calcularIndicadoresTodosAlunos(
      mentorias, eventos, performance, ciclosPorAluno, compIdToCodigoMap, casesData, hoje
    );

    const dashEmpresa = gerarDashboardEmpresa(todosIndicadores, 'EmpA');

    expect(dashEmpresa.visaoEmpresa.totalAlunos).toBe(2);
    expect(dashEmpresa.alunos.length).toBe(2);
    // mediaInd7 pode ser 0 se os ciclos não tiverem dados suficientes
    expect(dashEmpresa.visaoEmpresa.mediaInd7).toBeGreaterThanOrEqual(0);
    
    // Cada aluno deve ter consolidado
    for (const aluno of dashEmpresa.alunos) {
      expect(aluno.consolidado).toBeDefined();
      expect(aluno.consolidado.ind7_engajamentoFinal).toBeGreaterThanOrEqual(0);
    }
  });

  it('agregarIndicadores com lista vazia deve retornar zeros', () => {
    const agregado = agregarIndicadores([], 'geral');
    
    expect(agregado.mediaInd1).toBe(0);
    expect(agregado.mediaInd2).toBe(0);
    expect(agregado.mediaInd3).toBe(0);
    expect(agregado.mediaInd4).toBe(0);
    expect(agregado.mediaInd5).toBe(0);
    expect(agregado.mediaInd6).toBe(0);
    expect(agregado.mediaInd7).toBe(0);
    expect(agregado.totalAlunos).toBe(0);
  });

  it('ind7_engajamentoFinal deve ser a média dos 5 indicadores (exceto ind6)', () => {
    const aliceIndividual = calcularIndicadoresAluno(
      'A1', mentorias, eventos, performance, ciclosAlice, compIdToCodigoMap, casesData, hoje
    );

    const c = aliceIndividual.consolidado;
    const mediaEsperada = (c.ind1_webinars + c.ind2_avaliacoes + c.ind3_competencias + c.ind4_tarefas + c.ind5_engajamento) / 5;
    
    expect(c.ind7_engajamentoFinal).toBeCloseTo(mediaEsperada, 2);
  });
});
