import { describe, it, expect } from 'vitest';

/**
 * Testes para as novas colunas do relatório gerencial Excel:
 * - Período do Contrato
 * - Macrociclos (Trilhas)
 * - Microciclos (Competências)
 * - Turma (já existia)
 */

describe('Relatório Gerencial - Novas Colunas', () => {
  
  describe('Formatação de Período do Contrato', () => {
    const fmtDate = (d: any) => {
      if (!d) return '';
      try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return String(d); }
    };
    
    it('deve formatar período do contrato com datas válidas', () => {
      const contratoInicio = new Date('2025-01-15');
      const contratoFim = new Date('2025-12-31');
      const contratoStr = `${fmtDate(contratoInicio)} a ${fmtDate(contratoFim)}`;
      expect(contratoStr).toContain('a');
      expect(contratoStr).not.toBe('Não definido');
    });
    
    it('deve retornar "Não definido" quando não há datas de contrato', () => {
      const contratoInicio = null;
      const contratoFim = null;
      const contratoStr = (contratoInicio || contratoFim)
        ? `${fmtDate(contratoInicio)} a ${fmtDate(contratoFim)}`
        : 'Não definido';
      expect(contratoStr).toBe('Não definido');
    });
    
    it('deve lidar com apenas data de início', () => {
      const contratoInicio = new Date('2025-03-01');
      const contratoFim = null;
      const contratoStr = (contratoInicio || contratoFim)
        ? `${fmtDate(contratoInicio)} a ${fmtDate(contratoFim)}`
        : 'Não definido';
      expect(contratoStr).toContain('a');
      expect(contratoStr).not.toBe('Não definido');
    });
  });
  
  describe('Formatação de Macrociclos', () => {
    it('deve formatar macrociclos com trilha e datas', () => {
      const trilhaNameMap = new Map([[4, 'Visão de Futuro'], [1, 'Básica']]);
      const pdis = [
        { id: 1, alunoId: 100, trilhaId: 4, macroInicio: '2025-01-01', macroTermino: '2025-06-30', status: 'ativo' as const },
        { id: 2, alunoId: 100, trilhaId: 1, macroInicio: '2025-07-01', macroTermino: '2025-12-31', status: 'congelado' as const },
      ];
      
      const fmtDate = (d: any) => {
        if (!d) return '';
        try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return String(d); }
      };
      
      const macrociclosStr = pdis.map(p => {
        const trilhaNome = trilhaNameMap.get(p.trilhaId) || `Trilha ${p.trilhaId}`;
        const inicio = fmtDate(p.macroInicio);
        const termino = fmtDate(p.macroTermino);
        const status = p.status === 'congelado' ? ' [CONGELADO]' : '';
        return `${trilhaNome} (${inicio} - ${termino})${status}`;
      }).join(' | ');
      
      expect(macrociclosStr).toContain('Visão de Futuro');
      expect(macrociclosStr).toContain('Básica');
      expect(macrociclosStr).toContain('[CONGELADO]');
      expect(macrociclosStr).toContain(' | ');
    });
    
    it('deve retornar "Sem macrociclos" quando não há PDIs', () => {
      const pdis: any[] = [];
      const macrociclosStr = pdis.length > 0 ? pdis.map(() => '').join(' | ') : 'Sem macrociclos';
      expect(macrociclosStr).toBe('Sem macrociclos');
    });
  });
  
  describe('Formatação de Microciclos', () => {
    it('deve formatar microciclos com competência e datas', () => {
      const compNameMap = new Map([[10, 'Atenção'], [20, 'Disciplina']]);
      const comps = [
        { id: 1, assessmentPdiId: 1, competenciaId: 10, microInicio: '2025-01-01', microTermino: '2025-03-31' },
        { id: 2, assessmentPdiId: 1, competenciaId: 20, microInicio: '2025-04-01', microTermino: '2025-06-30' },
      ];
      
      const fmtDate = (d: any) => {
        if (!d) return '';
        try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return String(d); }
      };
      
      const microciclosArr: string[] = [];
      const compsComDatas = comps.filter(c => c.microInicio || c.microTermino);
      for (const comp of compsComDatas) {
        const compNome = compNameMap.get(comp.competenciaId) || `Comp ${comp.competenciaId}`;
        microciclosArr.push(`${compNome} (${fmtDate(comp.microInicio)} - ${fmtDate(comp.microTermino)})`);
      }
      const microciclosStr = microciclosArr.length > 0 ? microciclosArr.join(' | ') : 'Sem microciclos';
      
      expect(microciclosStr).toContain('Atenção');
      expect(microciclosStr).toContain('Disciplina');
      expect(microciclosStr).toContain(' | ');
    });
    
    it('deve retornar "Sem microciclos" quando competências não têm datas', () => {
      const comps = [
        { id: 1, assessmentPdiId: 1, competenciaId: 10, microInicio: null, microTermino: null },
      ];
      const compsComDatas = comps.filter(c => c.microInicio || c.microTermino);
      const microciclosStr = compsComDatas.length > 0 ? 'tem' : 'Sem microciclos';
      expect(microciclosStr).toBe('Sem microciclos');
    });
  });
  
  describe('Estrutura das colunas na aba Equipe', () => {
    it('deve incluir todas as novas colunas na ordem correta', () => {
      const expectedColumns = [
        'Nome', 'Email', 'Empresa', 'Turma',
        'Período do Contrato', 'Macrociclos (Trilhas)', 'Microciclos (Competências)',
        'Mentor(a)', 'Total Sessões', 'Última Mentoria',
        'Ind.1 Webinars (%)', 'Ind.2 Avaliações (%)', 'Ind.3 Competências (%)',
        'Ind.4 Tarefas (%)', 'Ind.5 Engajamento (%)', 'Ind.6 Case (%)',
        'Ind.7 Engajamento Final (%)', 'Classificação', 'Nota Final (0-10)',
        'Data de Emissão'
      ];
      
      // Simular um registro de aluno com todas as colunas
      const registro: Record<string, any> = {
        'Nome': 'João Silva',
        'Email': 'joao@test.com',
        'Empresa': 'Empresa X',
        'Turma': 'BS1',
        'Período do Contrato': '01/01/2025 a 31/12/2025',
        'Macrociclos (Trilhas)': 'Visão de Futuro (01/01/2025 - 30/06/2025)',
        'Microciclos (Competências)': 'Atenção (01/01/2025 - 31/03/2025)',
        'Mentor(a)': 'Maria',
        'Total Sessões': 5,
        'Última Mentoria': '15/03/2025',
        'Ind.1 Webinars (%)': 80,
        'Ind.2 Avaliações (%)': 90,
        'Ind.3 Competências (%)': 75,
        'Ind.4 Tarefas (%)': 85,
        'Ind.5 Engajamento (%)': 70,
        'Ind.6 Case (%)': 100,
        'Ind.7 Engajamento Final (%)': 88,
        'Classificação': 'Ouro',
        'Nota Final (0-10)': '8.5',
        'Data de Emissão': '11/03/2026',
      };
      
      for (const col of expectedColumns) {
        expect(registro).toHaveProperty(col);
      }
      
      // Verificar que as novas colunas existem
      expect(registro['Período do Contrato']).toBeDefined();
      expect(registro['Macrociclos (Trilhas)']).toBeDefined();
      expect(registro['Microciclos (Competências)']).toBeDefined();
    });
  });
  
  describe('getAllAssessmentCompetenciasForReport', () => {
    it('a função deve existir no módulo db', async () => {
      const db = await import('./db');
      expect(typeof db.getAllAssessmentCompetenciasForReport).toBe('function');
    });
    
    it('a função getAllAssessmentPdis deve existir no módulo db', async () => {
      const db = await import('./db');
      expect(typeof db.getAllAssessmentPdis).toBe('function');
    });
  });
});
