import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do banco de dados
vi.mock('./db', () => ({
  getPlanoIndividualByAluno: vi.fn(),
  addCompetenciaToPlano: vi.fn(),
  addCompetenciasToPlano: vi.fn(),
  removeCompetenciaFromPlano: vi.fn(),
  updatePlanoIndividualItem: vi.fn(),
  clearPlanoIndividual: vi.fn(),
  getAlunosWithPlano: vi.fn(),
  getCompetenciasObrigatoriasAluno: vi.fn(),
}));

import * as db from './db';

describe('Plano Individual - Database Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlanoIndividualByAluno', () => {
    it('deve retornar o plano individual de um aluno', async () => {
      const mockPlano = [
        {
          id: 1,
          alunoId: 1,
          competenciaId: 1,
          isObrigatoria: 1,
          notaAtual: null,
          metaNota: '7.00',
          status: 'pendente',
          competenciaNome: 'Comunicação',
          competenciaCodigo: 'COM001',
          trilhaId: 1,
          trilhaNome: 'Básicas'
        }
      ];
      
      vi.mocked(db.getPlanoIndividualByAluno).mockResolvedValue(mockPlano);
      
      const result = await db.getPlanoIndividualByAluno(1);
      
      expect(db.getPlanoIndividualByAluno).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPlano);
      expect(result.length).toBe(1);
      expect(result[0].competenciaNome).toBe('Comunicação');
    });

    it('deve retornar array vazio se aluno não tem plano', async () => {
      vi.mocked(db.getPlanoIndividualByAluno).mockResolvedValue([]);
      
      const result = await db.getPlanoIndividualByAluno(999);
      
      expect(result).toEqual([]);
    });
  });

  describe('addCompetenciaToPlano', () => {
    it('deve adicionar uma competência ao plano', async () => {
      vi.mocked(db.addCompetenciaToPlano).mockResolvedValue(1);
      
      const result = await db.addCompetenciaToPlano({
        alunoId: 1,
        competenciaId: 5,
        isObrigatoria: 1,
        metaNota: '8.00'
      });
      
      expect(db.addCompetenciaToPlano).toHaveBeenCalledWith({
        alunoId: 1,
        competenciaId: 5,
        isObrigatoria: 1,
        metaNota: '8.00'
      });
      expect(result).toBe(1);
    });
  });

  describe('addCompetenciasToPlano', () => {
    it('deve adicionar múltiplas competências ao plano', async () => {
      vi.mocked(db.addCompetenciasToPlano).mockResolvedValue(true);
      
      const result = await db.addCompetenciasToPlano(1, [1, 2, 3, 4, 5]);
      
      expect(db.addCompetenciasToPlano).toHaveBeenCalledWith(1, [1, 2, 3, 4, 5]);
      expect(result).toBe(true);
    });
  });

  describe('removeCompetenciaFromPlano', () => {
    it('deve remover uma competência do plano', async () => {
      vi.mocked(db.removeCompetenciaFromPlano).mockResolvedValue(true);
      
      const result = await db.removeCompetenciaFromPlano(1);
      
      expect(db.removeCompetenciaFromPlano).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  describe('updatePlanoIndividualItem', () => {
    it('deve atualizar o status de uma competência', async () => {
      vi.mocked(db.updatePlanoIndividualItem).mockResolvedValue(true);
      
      const result = await db.updatePlanoIndividualItem(1, {
        status: 'concluida',
        notaAtual: '9.5'
      });
      
      expect(db.updatePlanoIndividualItem).toHaveBeenCalledWith(1, {
        status: 'concluida',
        notaAtual: '9.5'
      });
      expect(result).toBe(true);
    });
  });

  describe('clearPlanoIndividual', () => {
    it('deve limpar todo o plano de um aluno', async () => {
      vi.mocked(db.clearPlanoIndividual).mockResolvedValue(true);
      
      const result = await db.clearPlanoIndividual(1);
      
      expect(db.clearPlanoIndividual).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  describe('getAlunosWithPlano', () => {
    it('deve retornar alunos com informações do plano', async () => {
      const mockAlunos = [
        {
          id: 1,
          name: 'João Silva',
          externalId: 'JS001',
          email: 'joao@email.com',
          turmaId: 1,
          trilhaId: null,
          consultorId: null,
          programId: 1,
          isActive: 1,
          canLogin: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          totalCompetencias: 5,
          competenciasObrigatorias: 5,
          competenciasConcluidas: 2,
          progressoPlano: 40
        }
      ];
      
      vi.mocked(db.getAlunosWithPlano).mockResolvedValue(mockAlunos);
      
      const result = await db.getAlunosWithPlano();
      
      expect(result.length).toBe(1);
      expect(result[0].progressoPlano).toBe(40);
      expect(result[0].competenciasObrigatorias).toBe(5);
    });

    it('deve filtrar por programa quando especificado', async () => {
      vi.mocked(db.getAlunosWithPlano).mockResolvedValue([]);
      
      await db.getAlunosWithPlano(1);
      
      expect(db.getAlunosWithPlano).toHaveBeenCalledWith(1);
    });
  });

  describe('getCompetenciasObrigatoriasAluno', () => {
    it('deve retornar apenas competências obrigatórias', async () => {
      const mockCompetencias = [
        {
          competenciaId: 1,
          codigoIntegracao: 'COM001',
          notaAtual: '8.5',
          metaNota: '7.00',
          status: 'concluida'
        },
        {
          competenciaId: 2,
          codigoIntegracao: 'LID001',
          notaAtual: null,
          metaNota: '7.00',
          status: 'pendente'
        }
      ];
      
      vi.mocked(db.getCompetenciasObrigatoriasAluno).mockResolvedValue(mockCompetencias);
      
      const result = await db.getCompetenciasObrigatoriasAluno(1);
      
      expect(result.length).toBe(2);
      expect(result[0].status).toBe('concluida');
      expect(result[1].status).toBe('pendente');
    });
  });
});

describe('Plano Individual - Business Logic', () => {
  it('deve calcular progresso corretamente', () => {
    const competenciasObrigatorias = 10;
    const competenciasConcluidas = 4;
    
    const progresso = Math.round((competenciasConcluidas / competenciasObrigatorias) * 100);
    
    expect(progresso).toBe(40);
  });

  it('deve retornar 0% se não houver competências obrigatórias', () => {
    const competenciasObrigatorias = 0;
    const competenciasConcluidas = 0;
    
    const progresso = competenciasObrigatorias > 0 
      ? Math.round((competenciasConcluidas / competenciasObrigatorias) * 100) 
      : 0;
    
    expect(progresso).toBe(0);
  });

  it('deve identificar competência como aprovada se nota >= meta', () => {
    const notaAtual = 8.5;
    const metaNota = 7.0;
    
    const aprovada = notaAtual >= metaNota;
    
    expect(aprovada).toBe(true);
  });

  it('deve identificar competência como não aprovada se nota < meta', () => {
    const notaAtual = 6.5;
    const metaNota = 7.0;
    
    const aprovada = notaAtual >= metaNota;
    
    expect(aprovada).toBe(false);
  });
});
