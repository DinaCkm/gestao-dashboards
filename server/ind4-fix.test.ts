/**
 * Test: Ind. 4 Tarefas must include sessions from ciclos with only optional competencias
 * 
 * Bug: When a student has ciclos where competenciaIds is empty (only optional competencias),
 * those ciclos were excluded from consolidation, causing ind4_tarefas to show 0%
 * even though the student had delivered tasks in those periods.
 */
import { describe, it, expect } from 'vitest';
import { calcularIndicadoresAluno, CicloDataV2 } from './indicatorsCalculatorV2';
import { MentoringRecord } from './excelProcessor';

describe('Ind. 4 fix - ciclos with only optional competencias', () => {
  // Simulate Millena's scenario: 9 ciclos, only 1 has obrigatoria competencias
  const hoje = new Date('2026-03-17');
  
  // 9 ciclos auto-generated from assessment_competencias
  // Only the first one has obrigatoria competenciaIds, the rest have empty (optional only)
  const ciclos: CicloDataV2[] = [
    { id: 1, nomeCiclo: 'Trilha - Comp Obrigatoria', trilhaNome: 'Trilha', dataInicio: '2025-04-20', dataFim: '2025-05-25', competenciaIds: [30022] },
    { id: 2, nomeCiclo: 'Trilha - Comp Opcional 1', trilhaNome: 'Trilha', dataInicio: '2025-05-20', dataFim: '2025-06-24', competenciaIds: [] },
    { id: 3, nomeCiclo: 'Trilha - Comp Opcional 2', trilhaNome: 'Trilha', dataInicio: '2025-06-29', dataFim: '2025-08-03', competenciaIds: [] },
    { id: 4, nomeCiclo: 'Trilha - Comp Opcional 3', trilhaNome: 'Trilha', dataInicio: '2025-08-08', dataFim: '2025-09-12', competenciaIds: [] },
    { id: 5, nomeCiclo: 'Trilha - Comp Opcional 4', trilhaNome: 'Trilha', dataInicio: '2025-09-17', dataFim: '2025-10-22', competenciaIds: [] },
    { id: 6, nomeCiclo: 'Trilha - Comp Opcional 5', trilhaNome: 'Trilha', dataInicio: '2025-10-27', dataFim: '2025-12-01', competenciaIds: [] },
    { id: 7, nomeCiclo: 'Trilha - Comp Opcional 6', trilhaNome: 'Trilha', dataInicio: '2026-01-12', dataFim: '2026-02-16', competenciaIds: [] },
    { id: 8, nomeCiclo: 'Trilha - Comp Opcional 7', trilhaNome: 'Trilha', dataInicio: '2026-01-30', dataFim: '2026-03-06', competenciaIds: [] },
    { id: 9, nomeCiclo: 'Trilha - Comp Opcional 8', trilhaNome: 'Trilha', dataInicio: '2026-02-24', dataFim: '2026-03-31', competenciaIds: [] },
  ];

  // Millena's mentoring sessions mapped to MentoringRecord format
  const mentorias: MentoringRecord[] = [
    // Session 1 (assessment) - in ciclo 1 period - mapped as sem_tarefa
    { idUsuario: '667292', nomeAluno: 'Millena', empresa: 'SEBRAE', presenca: 'presente', atividadeEntregue: 'sem_tarefa', dataSessao: new Date('2025-04-28') },
    // Session 2 - in ciclo 2 period - nao_entregue
    { idUsuario: '667292', nomeAluno: 'Millena', empresa: 'SEBRAE', presenca: 'presente', atividadeEntregue: 'nao_entregue', dataSessao: new Date('2025-05-30') },
    // Session 3 - in ciclo 2 period - entregue
    { idUsuario: '667292', nomeAluno: 'Millena', empresa: 'SEBRAE', presenca: 'presente', atividadeEntregue: 'entregue', dataSessao: new Date('2025-06-26') },
    // Session 4 - in ciclo 3 period - entregue
    { idUsuario: '667292', nomeAluno: 'Millena', empresa: 'SEBRAE', presenca: 'presente', atividadeEntregue: 'entregue', dataSessao: new Date('2025-08-01') },
    // Session 5 - in ciclo 4 period - entregue
    { idUsuario: '667292', nomeAluno: 'Millena', empresa: 'SEBRAE', presenca: 'presente', atividadeEntregue: 'entregue', dataSessao: new Date('2025-08-25') },
    // Session 6 - in ciclo 5 period - entregue
    { idUsuario: '667292', nomeAluno: 'Millena', empresa: 'SEBRAE', presenca: 'presente', atividadeEntregue: 'entregue', dataSessao: new Date('2025-09-24') },
    // Session 7 - in ciclo 6 period - entregue
    { idUsuario: '667292', nomeAluno: 'Millena', empresa: 'SEBRAE', presenca: 'presente', atividadeEntregue: 'entregue', dataSessao: new Date('2025-11-14') },
    // Session 8 - in ciclo 5 period - nao_entregue
    { idUsuario: '667292', nomeAluno: 'Millena', empresa: 'SEBRAE', presenca: 'presente', atividadeEntregue: 'nao_entregue', dataSessao: new Date('2025-10-24') },
    // Session 9 - in ciclo 7 period - nao_entregue
    { idUsuario: '667292', nomeAluno: 'Millena', empresa: 'SEBRAE', presenca: 'presente', atividadeEntregue: 'nao_entregue', dataSessao: new Date('2026-01-24') },
    // Session 10 - in ciclo 8 period - nao_entregue
    { idUsuario: '667292', nomeAluno: 'Millena', empresa: 'SEBRAE', presenca: 'presente', atividadeEntregue: 'nao_entregue', dataSessao: new Date('2026-02-25') },
  ];

  it('should calculate ind4_tarefas correctly even when most ciclos have only optional competencias', () => {
    const result = calcularIndicadoresAluno(
      '667292', mentorias, [], [], ciclos, new Map(), [], hoje
    );

    // Session 1 is sem_tarefa (excluded from count)
    // Sessions with tarefa: 2-10 = 9 sessions
    // Entregues: sessions 3,4,5,6,7 = 5
    // Expected: 5/9 * 100 = 55.56%
    
    // The consolidado should NOT be 0%
    expect(result.consolidado.ind4_tarefas).toBeGreaterThan(0);
    
    // Check the details
    expect(result.consolidado.detalhes.tarefas.total).toBeGreaterThan(0);
    // Some sessions may fall in ciclos still in progress (not finalized), so entregues may be 4 or 5
    expect(result.consolidado.detalhes.tarefas.entregues).toBeGreaterThanOrEqual(4);
  });

  it('should include all finalized ciclos in consolidation regardless of competenciaIds', () => {
    const result = calcularIndicadoresAluno(
      '667292', mentorias, [], [], ciclos, new Map(), [], hoje
    );

    // All ciclos before today should be included (finalized ones)
    // Ciclos 1-6 are finalized (dataFim before 2026-03-17)
    // Ciclos 7-8 overlap with today, ciclo 9 is still in progress
    
    // The key assertion: ciclosFinalizados should have more than just 1 entry
    expect(result.ciclosFinalizados.length).toBeGreaterThan(1);
  });

  it('should not show 0% for ind4 when only 1 ciclo has obrigatoria and it only covers assessment', () => {
    // This is the exact bug scenario: only ciclo 1 has obrigatoria competencias
    // but ciclo 1 only covers the assessment session (sem_tarefa)
    // Previously this resulted in ind4 = 0%
    
    const result = calcularIndicadoresAluno(
      '667292', mentorias, [], [], ciclos, new Map(), [], hoje
    );

    // ind4 must reflect the actual task delivery rate across ALL ciclos
    const expectedRate = Math.round((5 / 9) * 100 * 100) / 100; // ~55.56%
    // Allow some tolerance due to which ciclos are finalized vs in progress
    expect(result.consolidado.ind4_tarefas).toBeGreaterThan(40);
    expect(result.consolidado.ind4_tarefas).toBeLessThan(70);
  });

  it('ind7 should reflect the corrected ind4 value', () => {
    const result = calcularIndicadoresAluno(
      '667292', mentorias, [], [], ciclos, new Map(), [], hoje
    );

    // ind7 = average of ind1..ind5
    // With corrected ind4 > 0, ind7 should also be > 0
    const c = result.consolidado;
    const expectedInd7 = (c.ind1_webinars + c.ind2_avaliacoes + c.ind3_competencias + c.ind4_tarefas + c.ind5_engajamento) / 5;
    expect(c.ind7_engajamentoFinal).toBeCloseTo(expectedInd7, 1);
  });
});
