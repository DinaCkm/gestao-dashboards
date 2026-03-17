/**
 * Tests for macrociclo-based calculation of Ind.1, Ind.4, Ind.5
 * 
 * These indicators should be calculated based on the macrociclo period
 * (assessment_pdi.macroInicio/macroTermino) instead of per-microciclo.
 */
import { describe, it, expect } from 'vitest';
import { 
  calcularIndicadoresAluno, 
  CicloDataV2, 
  CaseSucessoData,
  MacrocicloData 
} from './indicatorsCalculatorV2';
import { MentoringRecord, EventRecord, PerformanceRecord } from './excelProcessor';

// Helper to create mentoring records
function mkMentoria(overrides: Partial<MentoringRecord> = {}): MentoringRecord {
  return {
    idUsuario: 'aluno1',
    nomeAluno: 'Millena',
    empresa: 'Empresa X',
    sessao: 1,
    presenca: 'presente',
    ...overrides,
  };
}

// Helper to create event records
function mkEvento(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    idUsuario: 'aluno1',
    nomeAluno: 'Millena',
    empresa: 'Empresa X',
    presenca: 'presente',
    ...overrides,
  };
}

// Helper to create ciclo
function mkCiclo(overrides: Partial<CicloDataV2> = {}): CicloDataV2 {
  return {
    id: 1,
    nomeCiclo: 'Ciclo I',
    trilhaNome: 'Trilha Gestão',
    dataInicio: '2025-04-20',
    dataFim: '2025-05-25',
    competenciaIds: [1],
    ...overrides,
  };
}

const emptyMap = new Map<number, string>();

describe('Macrociclo-based Ind.1, Ind.4, Ind.5 calculation', () => {
  
  describe('Ind.4 (Tarefas) - Cenário Millena', () => {
    it('deve calcular tarefas pelo macrociclo, não por microciclo', () => {
      // Millena: 9 sessões, 5 entregues, 1 assessment, 1 não entregue, 2 sem info
      // Macrociclo: 20/04/2025 a 31/03/2026
      const macrociclo: MacrocicloData = {
        macroInicio: '2025-04-20',
        macroTermino: '2026-03-31',
      };
      
      const mentorias: MentoringRecord[] = [
        mkMentoria({ sessao: 1, dataSessao: '2025-04-28', atividadeEntregue: 'sem_tarefa' }), // Assessment
        mkMentoria({ sessao: 2, dataSessao: '2025-05-30', atividadeEntregue: 'nao_entregue' }),
        mkMentoria({ sessao: 3, dataSessao: '2025-06-26', atividadeEntregue: 'entregue' }),
        mkMentoria({ sessao: 4, dataSessao: '2025-08-01', atividadeEntregue: 'entregue' }),
        mkMentoria({ sessao: 5, dataSessao: '2025-08-25', atividadeEntregue: 'entregue' }),
        mkMentoria({ sessao: 6, dataSessao: '2025-09-24', atividadeEntregue: 'entregue' }),
        mkMentoria({ sessao: 7, dataSessao: '2025-11-14', atividadeEntregue: 'entregue' }),
        mkMentoria({ sessao: 8, dataSessao: '2025-12-10', atividadeEntregue: 'nao_entregue' }),
        mkMentoria({ sessao: 9, dataSessao: '2026-01-15', atividadeEntregue: 'nao_entregue' }),
      ];
      
      // Only 1 ciclo with obrigatória competência (covers only session 1)
      const ciclos: CicloDataV2[] = [
        mkCiclo({ id: 1, nomeCiclo: 'Comp 30022', dataInicio: '2025-04-20', dataFim: '2025-05-25', competenciaIds: [30022] }),
        mkCiclo({ id: 2, nomeCiclo: 'Comp 30023', dataInicio: '2025-05-26', dataFim: '2025-06-30', competenciaIds: [] }),
        mkCiclo({ id: 3, nomeCiclo: 'Comp 30024', dataInicio: '2025-07-01', dataFim: '2025-08-15', competenciaIds: [] }),
        mkCiclo({ id: 4, nomeCiclo: 'Comp 30025', dataInicio: '2025-08-16', dataFim: '2025-09-30', competenciaIds: [] }),
        mkCiclo({ id: 5, nomeCiclo: 'Comp 30026', dataInicio: '2025-10-01', dataFim: '2025-11-30', competenciaIds: [] }),
        mkCiclo({ id: 6, nomeCiclo: 'Comp 30027', dataInicio: '2025-12-01', dataFim: '2026-01-31', competenciaIds: [] }),
      ];
      
      const result = calcularIndicadoresAluno(
        'aluno1', mentorias, [], [], ciclos, emptyMap, [], undefined, macrociclo
      );
      
      // 8 sessões com tarefa (excluindo sem_tarefa), 5 entregues
      // Ind.4 = (5/8) * 100 = 62.5%
      expect(result.consolidado.ind4_tarefas).toBeCloseTo(62.5, 1);
      expect(result.consolidado.detalhes.tarefas.total).toBe(8);
      expect(result.consolidado.detalhes.tarefas.entregues).toBe(5);
    });
    
    it('sem macrociclo definido, deve usar todas as mentorias do aluno', () => {
      const mentorias: MentoringRecord[] = [
        mkMentoria({ sessao: 1, atividadeEntregue: 'entregue' }),
        mkMentoria({ sessao: 2, atividadeEntregue: 'nao_entregue' }),
        mkMentoria({ sessao: 3, atividadeEntregue: 'entregue' }),
      ];
      
      const ciclos: CicloDataV2[] = [
        mkCiclo({ dataInicio: '2025-01-01', dataFim: '2025-12-31' }),
      ];
      
      // Sem macrociclo, deve usar todas as mentorias
      const result = calcularIndicadoresAluno(
        'aluno1', mentorias, [], [], ciclos, emptyMap, []
      );
      
      // 3 tarefas, 2 entregues = 66.67%
      expect(result.consolidado.ind4_tarefas).toBeCloseTo(66.67, 1);
    });
  });
  
  describe('Ind.1 (Webinars) - Calculado pelo macrociclo', () => {
    it('deve calcular webinars pelo período do macrociclo', () => {
      const macrociclo: MacrocicloData = {
        macroInicio: '2025-04-01',
        macroTermino: '2025-12-31',
      };
      
      const eventos: EventRecord[] = [
        mkEvento({ dataEvento: '2025-03-15', presenca: 'presente' }), // FORA do macrociclo
        mkEvento({ dataEvento: '2025-05-10', presenca: 'presente' }), // Dentro
        mkEvento({ dataEvento: '2025-06-15', presenca: 'ausente' }),  // Dentro
        mkEvento({ dataEvento: '2025-09-20', presenca: 'presente' }), // Dentro
        mkEvento({ dataEvento: '2026-01-10', presenca: 'presente' }), // FORA do macrociclo
      ];
      
      const ciclos: CicloDataV2[] = [
        mkCiclo({ dataInicio: '2025-04-01', dataFim: '2025-12-31' }),
      ];
      
      const result = calcularIndicadoresAluno(
        'aluno1', [], eventos, [], ciclos, emptyMap, [], undefined, macrociclo
      );
      
      // 3 eventos dentro do macrociclo, 2 presentes
      // Ind.1 = (2/3) * 100 = 66.67%
      expect(result.consolidado.ind1_webinars).toBeCloseTo(66.67, 1);
      expect(result.consolidado.detalhes.webinars.total).toBe(3);
      expect(result.consolidado.detalhes.webinars.presentes).toBe(2);
    });
  });
  
  describe('Ind.5 (Engajamento) - Calculado pelo macrociclo', () => {
    it('deve calcular engajamento pelo período do macrociclo', () => {
      const macrociclo: MacrocicloData = {
        macroInicio: '2025-04-01',
        macroTermino: '2025-12-31',
      };
      
      const mentorias: MentoringRecord[] = [
        mkMentoria({ sessao: 1, dataSessao: '2025-03-01', engajamento: 10 }), // FORA
        mkMentoria({ sessao: 2, dataSessao: '2025-05-10', engajamento: 8 }),  // Dentro
        mkMentoria({ sessao: 3, dataSessao: '2025-07-15', engajamento: 6 }),  // Dentro
        mkMentoria({ sessao: 4, dataSessao: '2025-10-20', engajamento: 9 }),  // Dentro
        mkMentoria({ sessao: 5, dataSessao: '2026-02-01', engajamento: 10 }), // FORA
      ];
      
      const ciclos: CicloDataV2[] = [
        mkCiclo({ dataInicio: '2025-04-01', dataFim: '2025-12-31' }),
      ];
      
      const result = calcularIndicadoresAluno(
        'aluno1', mentorias, [], [], ciclos, emptyMap, [], undefined, macrociclo
      );
      
      // 3 sessões dentro do macrociclo: notas 8, 6, 9
      // Média = (8+6+9)/3 = 7.67 → convertido para 0-100 = 76.67%
      expect(result.consolidado.ind5_engajamento).toBeCloseTo(76.67, 0);
      expect(result.consolidado.detalhes.engajamento.sessoes).toBe(3);
    });
  });
  
  describe('Ind.2 e Ind.3 continuam por microciclo', () => {
    it('Ind.2 e Ind.3 devem continuar usando microciclos para cálculo', () => {
      const macrociclo: MacrocicloData = {
        macroInicio: '2025-01-01',
        macroTermino: '2025-12-31',
      };
      
      const performance: PerformanceRecord[] = [
        { idUsuario: 'aluno1', nomeAluno: 'Millena', empresa: 'Empresa X', idCompetencia: 'COMP001', nomeCompetencia: 'Comp 1', notaAvaliacao: 8, aulasConcluidas: 10, aulasDisponiveis: 10 },
        { idUsuario: 'aluno1', nomeAluno: 'Millena', empresa: 'Empresa X', idCompetencia: 'COMP002', nomeCompetencia: 'Comp 2', notaAvaliacao: 10, aulasConcluidas: 10, aulasDisponiveis: 10 },
      ];
      
      const compMap = new Map<number, string>([[1, 'COMP001'], [2, 'COMP002']]);
      
      const ciclos: CicloDataV2[] = [
        mkCiclo({ id: 1, nomeCiclo: 'Ciclo I', dataInicio: '2025-01-01', dataFim: '2025-06-30', competenciaIds: [1, 2] }),
      ];
      
      const result = calcularIndicadoresAluno(
        'aluno1', [], [], performance, ciclos, compMap, [], undefined, macrociclo
      );
      
      // Ind.2 should still work from microciclo
      // Ciclo finalizado (ends 2025-06-30, today is 2026-03-17)
      // notaAvaliacao 8 and 10 -> converted to 0-100: 80 and 100 -> avg = 90
      expect(result.consolidado.ind2_avaliacoes).toBe(90);
    });
  });
  
  describe('Ind.7 (Engajamento Final) - Média dos 5 indicadores', () => {
    it('deve calcular Ind.7 como média de Ind.1-5 usando valores do macrociclo para 1/4/5', () => {
      const macrociclo: MacrocicloData = {
        macroInicio: '2025-01-01',
        macroTermino: '2025-12-31',
      };
      
      const mentorias: MentoringRecord[] = [
        mkMentoria({ sessao: 1, dataSessao: '2025-05-10', atividadeEntregue: 'entregue', engajamento: 8 }),
        mkMentoria({ sessao: 2, dataSessao: '2025-07-15', atividadeEntregue: 'entregue', engajamento: 8 }),
      ];
      
      const eventos: EventRecord[] = [
        mkEvento({ dataEvento: '2025-06-10', presenca: 'presente' }),
        mkEvento({ dataEvento: '2025-08-20', presenca: 'presente' }),
      ];
      
      const ciclos: CicloDataV2[] = [
        mkCiclo({ dataInicio: '2025-01-01', dataFim: '2025-12-31', competenciaIds: [1] }),
      ];
      
      const result = calcularIndicadoresAluno(
        'aluno1', mentorias, eventos, [], ciclos, emptyMap, [], undefined, macrociclo
      );
      
      // Ind.1 = 100% (2/2 presentes)
      // Ind.4 = 100% (2/2 entregues)
      // Ind.5 = 80% (média 8/10 * 100)
      // Ind.2 = 0 (sem provas)
      // Ind.3 = 0 (sem competências finalizadas)
      // Ind.7 = (100 + 0 + 0 + 100 + 80) / 5 = 56
      expect(result.consolidado.ind1_webinars).toBe(100);
      expect(result.consolidado.ind4_tarefas).toBe(100);
      expect(result.consolidado.ind5_engajamento).toBe(80);
      expect(result.consolidado.ind7_engajamentoFinal).toBeCloseTo(56, 0);
    });
  });
});
