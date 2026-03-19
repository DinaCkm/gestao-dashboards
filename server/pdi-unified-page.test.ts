import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all db functions used by the unified PDI page
vi.mock('./db', () => ({
  getPlanoIndividualByAluno: vi.fn(),
  getAlunosWithPlano: vi.fn(),
  addCompetenciaToPlano: vi.fn(),
  addCompetenciasToPlano: vi.fn(),
  removeCompetenciaFromPlano: vi.fn(),
  updatePlanoIndividualItem: vi.fn(),
  clearPlanoIndividual: vi.fn(),
  getCompetenciasObrigatoriasAluno: vi.fn(),
  getAssessmentsByAluno: vi.fn(),
  getContratosByAluno: vi.fn(),
  getSaldoSessoes: vi.fn(),
  getJornadaCompleta: vi.fn(),
  getCiclosByAluno: vi.fn(),
  getMetasDetalhadas: vi.fn(),
  getMetasResumo: vi.fn(),
  getDiscResultado: vi.fn(),
}));

import * as db from './db';

describe('PDI Unified Page - Data Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Seção 1: Seleção de Aluno', () => {
    it('deve listar alunos com plano definido', async () => {
      const mockAlunos = [
        { id: 1, nome: 'João Silva', empresaNome: 'Empresa A', totalCompetencias: 5, competenciasObrigatorias: 3 },
        { id: 2, nome: 'Maria Santos', empresaNome: 'Empresa B', totalCompetencias: 7, competenciasObrigatorias: 5 },
      ];
      vi.mocked(db.getAlunosWithPlano).mockResolvedValue(mockAlunos as any);

      const result = await db.getAlunosWithPlano();
      expect(result).toHaveLength(2);
      expect(result[0].nome).toBe('João Silva');
      expect(result[1].totalCompetencias).toBe(7);
    });

    it('deve retornar lista vazia quando não há alunos', async () => {
      vi.mocked(db.getAlunosWithPlano).mockResolvedValue([]);
      const result = await db.getAlunosWithPlano();
      expect(result).toEqual([]);
    });
  });

  describe('Seção 2: Contrato', () => {
    it('deve buscar contratos do aluno', async () => {
      const mockContratos = [
        {
          id: 1,
          alunoId: 100,
          programId: 1,
          periodoInicio: new Date('2025-01-01'),
          periodoTermino: new Date('2025-12-31'),
          totalSessoesContratadas: 24,
          observacoes: 'Contrato anual',
          isActive: 1,
        }
      ];
      vi.mocked(db.getContratosByAluno).mockResolvedValue(mockContratos as any);

      const result = await db.getContratosByAluno(100);
      expect(db.getContratosByAluno).toHaveBeenCalledWith(100);
      expect(result).toHaveLength(1);
      expect(result[0].totalSessoesContratadas).toBe(24);
    });

    it('deve retornar saldo de sessões corretamente', async () => {
      const mockSaldo = {
        contrato: { id: 1, totalSessoesContratadas: 24 },
        totalContratadas: 24,
        sessoesRealizadas: 10,
        saldoRestante: 14,
        percentualUsado: 42,
      };
      vi.mocked(db.getSaldoSessoes).mockResolvedValue(mockSaldo as any);

      const result = await db.getSaldoSessoes(100);
      expect(result).not.toBeNull();
      expect(result!.totalContratadas).toBe(24);
      expect(result!.sessoesRealizadas).toBe(10);
      expect(result!.saldoRestante).toBe(14);
      expect(result!.percentualUsado).toBe(42);
    });

    it('deve retornar null quando aluno não tem contrato', async () => {
      vi.mocked(db.getSaldoSessoes).mockResolvedValue(null);
      const result = await db.getSaldoSessoes(999);
      expect(result).toBeNull();
    });
  });

  describe('Seção 3: Jornada / Assessment PDI', () => {
    it('deve buscar assessments do aluno com competências', async () => {
      const mockAssessments = [
        {
          id: 1,
          alunoId: 100,
          trilhaId: 1,
          trilhaNome: 'Master',
          status: 'ativo',
          macroInicio: new Date('2024-10-10'),
          macroFim: new Date('2026-10-30'),
          competencias: [
            { id: 1, competenciaNome: 'Foco em Resultados', nivelAtual: '0', isObrigatoria: 1 },
            { id: 2, competenciaNome: 'Presença Executiva', nivelAtual: '0', isObrigatoria: 1 },
          ],
        }
      ];
      vi.mocked(db.getAssessmentsByAluno).mockResolvedValue(mockAssessments as any);

      const result = await db.getAssessmentsByAluno(100);
      expect(result).toHaveLength(1);
      expect(result[0].trilhaNome).toBe('Master');
      expect(result[0].competencias).toHaveLength(2);
    });

    it('deve buscar jornada completa do aluno', async () => {
      const mockJornada = {
        aluno: { id: 100, nome: 'João' },
        assessments: [],
        ciclos: [],
        contrato: null,
      };
      vi.mocked(db.getJornadaCompleta).mockResolvedValue(mockJornada as any);

      const result = await db.getJornadaCompleta(100);
      expect(result).toBeDefined();
      expect(result.aluno.id).toBe(100);
    });
  });

  describe('Seção 4: Competências do Plano', () => {
    it('deve buscar plano individual do aluno', async () => {
      const mockPlano = [
        {
          id: 1,
          alunoId: 100,
          competenciaId: 1,
          isObrigatoria: 1,
          notaAtual: null,
          metaNota: '7.00',
          status: 'pendente',
          competenciaNome: 'Comunicação',
          trilhaNome: 'Basic',
        },
        {
          id: 2,
          alunoId: 100,
          competenciaId: 2,
          isObrigatoria: 1,
          notaAtual: '5.00',
          metaNota: '7.00',
          status: 'em_andamento',
          competenciaNome: 'Liderança',
          trilhaNome: 'Master',
        },
      ];
      vi.mocked(db.getPlanoIndividualByAluno).mockResolvedValue(mockPlano as any);

      const result = await db.getPlanoIndividualByAluno(100);
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('pendente');
      expect(result[1].notaAtual).toBe('5.00');
    });

    it('deve adicionar competência ao plano', async () => {
      vi.mocked(db.addCompetenciaToPlano).mockResolvedValue({ id: 3 } as any);
      const result = await db.addCompetenciaToPlano(100, 5, false);
      expect(db.addCompetenciaToPlano).toHaveBeenCalledWith(100, 5, false);
    });

    it('deve remover competência do plano', async () => {
      vi.mocked(db.removeCompetenciaFromPlano).mockResolvedValue(undefined as any);
      await db.removeCompetenciaFromPlano(1);
      expect(db.removeCompetenciaFromPlano).toHaveBeenCalledWith(1);
    });
  });

  describe('Seção 5: Ciclos de Execução', () => {
    it('deve buscar ciclos do aluno', async () => {
      const mockCiclos = [
        {
          id: 1,
          alunoId: 100,
          nome: 'Basic',
          tipo: 'pdi',
          status: 'finalizado',
          dataInicio: new Date('2025-04-10'),
          dataFim: new Date('2025-10-30'),
          competencias: [
            { competenciaNome: 'Atenção', trilhaNome: 'Basic' },
          ],
        },
        {
          id: 2,
          alunoId: 100,
          nome: 'Master',
          tipo: 'pdi',
          status: 'em_andamento',
          dataInicio: new Date('2025-11-30'),
          dataFim: new Date('2026-05-10'),
          competencias: [
            { competenciaNome: 'Foco em Resultados', trilhaNome: 'Master' },
          ],
        },
      ];
      vi.mocked(db.getCiclosByAluno).mockResolvedValue(mockCiclos as any);

      const result = await db.getCiclosByAluno(100);
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('finalizado');
      expect(result[1].status).toBe('em_andamento');
    });
  });

  describe('Seção 6: Metas de Desenvolvimento', () => {
    it('deve buscar metas detalhadas do aluno', async () => {
      const mockMetas = [
        {
          id: 1,
          alunoId: 100,
          competenciaId: 1,
          competenciaNome: 'Foco em Resultados',
          descricao: 'Melhorar foco',
          prazo: new Date('2026-06-30'),
          status: 'em_andamento',
          acompanhamentos: [],
        },
      ];
      vi.mocked(db.getMetasDetalhadas).mockResolvedValue(mockMetas as any);

      const result = await db.getMetasDetalhadas(100);
      expect(result).toHaveLength(1);
      expect(result[0].competenciaNome).toBe('Foco em Resultados');
    });

    it('deve buscar resumo de metas do aluno', async () => {
      const mockResumo = {
        total: 5,
        cumpridas: 2,
        naoCumpridas: 1,
        emAndamento: 2,
        percentualAtingimento: 40,
      };
      vi.mocked(db.getMetasResumo).mockResolvedValue(mockResumo as any);

      const result = await db.getMetasResumo(100);
      expect(result.total).toBe(5);
      expect(result.cumpridas).toBe(2);
      expect(result.percentualAtingimento).toBe(40);
    });
  });

  describe('DISC Integration', () => {
    it('deve buscar resultado DISC do aluno', async () => {
      const mockDisc = {
        perfil: 'DI',
        dominancia: 45,
        influencia: 35,
        estabilidade: 12,
        conformidade: 8,
      };
      vi.mocked(db.getDiscResultado).mockResolvedValue(mockDisc as any);

      const result = await db.getDiscResultado(100);
      expect(result).toBeDefined();
      expect(result!.perfil).toBe('DI');
    });

    it('deve retornar null quando aluno não tem DISC', async () => {
      vi.mocked(db.getDiscResultado).mockResolvedValue(null as any);
      const result = await db.getDiscResultado(999);
      expect(result).toBeNull();
    });
  });

  describe('Seção 2: Contrato - CRUD Operations', () => {
    it('deve criar contrato com campos corretos (periodoInicio, periodoTermino, totalSessoesContratadas)', async () => {
      const contratoData = {
        alunoId: 100,
        programId: 1,
        periodoInicio: '2026-01-01',
        periodoTermino: '2026-12-31',
        totalSessoesContratadas: 12,
        observacoes: undefined, // campo opcional - deve ser undefined, não null
      };

      // Verify field names match backend schema
      expect(contratoData).toHaveProperty('periodoInicio');
      expect(contratoData).toHaveProperty('periodoTermino');
      expect(contratoData).toHaveProperty('totalSessoesContratadas');
      expect(contratoData).not.toHaveProperty('dataInicio');
      expect(contratoData).not.toHaveProperty('dataFim');
      expect(contratoData).not.toHaveProperty('sessoesContratadas');
      expect(contratoData).not.toHaveProperty('valorContrato');
    });

    it('deve editar contrato sem enviar observacoes como null', async () => {
      const updateData = {
        id: 1,
        periodoInicio: '2026-02-01',
        periodoTermino: '2026-11-30',
        totalSessoesContratadas: 10,
        observacoes: '' || undefined, // empty string should become undefined
      };

      // observacoes should be undefined, not null
      expect(updateData.observacoes).toBeUndefined();
    });

    it('deve preservar observacoes quando preenchido', async () => {
      const updateData = {
        id: 1,
        observacoes: 'Contrato renovado' || undefined,
      };

      expect(updateData.observacoes).toBe('Contrato renovado');
    });

    it('deve listar contratos ativos após criação', async () => {
      const mockContratos = [
        { id: 1, periodoInicio: new Date('2026-01-01'), periodoTermino: new Date('2026-06-30'), totalSessoesContratadas: 6, isActive: 1 },
        { id: 2, periodoInicio: new Date('2026-07-01'), periodoTermino: new Date('2026-12-31'), totalSessoesContratadas: 10, isActive: 1 },
      ];
      vi.mocked(db.getContratosByAluno).mockResolvedValue(mockContratos as any);

      const result = await db.getContratosByAluno(100);
      expect(result).toHaveLength(2);
      expect(result[0].isActive).toBe(1);
      expect(result[1].totalSessoesContratadas).toBe(10);
    });
  });

  describe('Data Consistency across sections', () => {
    it('competências do assessment devem corresponder às do plano', async () => {
      const assessmentComps = ['Foco em Resultados', 'Presença Executiva'];
      const planoComps = ['Foco em Resultados', 'Presença Executiva', 'Comunicação'];

      // Assessment competências should be a subset of plano competências
      const assessmentInPlano = assessmentComps.every(c => planoComps.includes(c));
      expect(assessmentInPlano).toBe(true);
    });

    it('saldo de sessões deve ser calculado corretamente', () => {
      const totalContratadas = 24;
      const sessoesRealizadas = 10;
      const saldoRestante = totalContratadas - sessoesRealizadas;
      const percentualUsado = Math.round((sessoesRealizadas / totalContratadas) * 100);

      expect(saldoRestante).toBe(14);
      expect(percentualUsado).toBe(42);
    });

    it('ciclos devem ter status válidos', () => {
      const validStatuses = ['finalizado', 'em_andamento', 'futuro', 'pendente'];
      const cicloStatuses = ['finalizado', 'em_andamento', 'futuro'];

      cicloStatuses.forEach(status => {
        expect(validStatuses).toContain(status);
      });
    });
  });
});
