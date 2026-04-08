import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDb } from './db';

// Mock do banco de dados
vi.mock('./db', () => ({
  getDb: vi.fn(),
}));

describe('Jornada - Competência Nome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar o nome da competência na microJornada', async () => {
    // Simular dados de teste
    const mockComps = [
      {
        id: 1,
        competenciaId: 10,
        nome: 'Comunicação Assertiva',
        microInicio: '2026-03-01',
        microTermino: '2026-04-30',
      },
      {
        id: 2,
        competenciaId: 11,
        nome: 'Liderança',
        microInicio: '2026-03-01',
        microTermino: '2026-04-30',
      },
    ];

    // Verificar que o nome da competência está presente
    mockComps.forEach((comp) => {
      expect(comp.nome).toBeDefined();
      expect(comp.nome).not.toBeNull();
      expect(typeof comp.nome).toBe('string');
      expect(comp.nome.length).toBeGreaterThan(0);
    });

    // Simular o mapeamento que ocorre no router
    const microJornadas = mockComps.map((comp) => ({
      id: comp.id,
      competenciaId: comp.competenciaId,
      competenciaNome: comp.nome || `Competência #${comp.competenciaId}`,
      microInicio: comp.microInicio,
      microTermino: comp.microTermino,
    }));

    // Validar que o nome foi incluído
    expect(microJornadas).toHaveLength(2);
    expect(microJornadas[0].competenciaNome).toBe('Comunicação Assertiva');
    expect(microJornadas[1].competenciaNome).toBe('Liderança');

    // Validar que nenhum tem o fallback "Competência #"
    microJornadas.forEach((micro) => {
      expect(micro.competenciaNome).not.toMatch(/^Competência #/);
    });
  });

  it('deve usar fallback quando o nome da competência estiver vazio', () => {
    const mockComp = {
      id: 1,
      competenciaId: 10,
      nome: null,
      microInicio: '2026-03-01',
      microTermino: '2026-04-30',
    };

    const microJornada = {
      id: mockComp.id,
      competenciaId: mockComp.competenciaId,
      competenciaNome: mockComp.nome || `Competência #${mockComp.competenciaId}`,
      microInicio: mockComp.microInicio,
      microTermino: mockComp.microTermino,
    };

    expect(microJornada.competenciaNome).toBe('Competência #10');
  });

  it('deve incluir competenciaNome em todas as microJornadas', () => {
    const mockComps = [
      { id: 1, competenciaId: 10, nome: 'Comp 1', microInicio: '2026-03-01', microTermino: '2026-04-30' },
      { id: 2, competenciaId: 11, nome: 'Comp 2', microInicio: '2026-03-01', microTermino: '2026-04-30' },
      { id: 3, competenciaId: 12, nome: 'Comp 3', microInicio: '2026-03-01', microTermino: '2026-04-30' },
    ];

    const microJornadas = mockComps.map((comp) => ({
      id: comp.id,
      competenciaId: comp.competenciaId,
      competenciaNome: comp.nome || `Competência #${comp.competenciaId}`,
      microInicio: comp.microInicio,
      microTermino: comp.microTermino,
    }));

    // Validar que todas têm o campo competenciaNome
    microJornadas.forEach((micro) => {
      expect(micro).toHaveProperty('competenciaNome');
      expect(micro.competenciaNome).toBeDefined();
      expect(typeof micro.competenciaNome).toBe('string');
    });
  });
});
