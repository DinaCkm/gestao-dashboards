import { describe, it, expect } from "vitest";

/**
 * Testes para as melhorias na página Editar Mentorias:
 * 1. Ordenação por número de sessão (ascendente)
 * 2. Busca/filtro de alunos por nome
 * 3. Filtro de alunos por turma no formulário Nova Sessão (considerando PDI)
 */

describe("Editar Mentorias - Ordenação por Número de Sessão", () => {
  // Simula a ordenação que o backend agora faz (asc sessionNumber)
  function sortBySessionNumber(sessions: Array<{ id: number; sessionNumber: number; sessionDate: string }>) {
    return [...sessions].sort((a, b) => {
      // Primary: sessionNumber ascending
      if (a.sessionNumber !== b.sessionNumber) return a.sessionNumber - b.sessionNumber;
      // Secondary: sessionDate descending
      return new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime();
    });
  }

  it("ordena sessões por número ascendente", () => {
    const sessions = [
      { id: 1, sessionNumber: 5, sessionDate: "2026-03-01" },
      { id: 2, sessionNumber: 1, sessionDate: "2026-01-01" },
      { id: 3, sessionNumber: 3, sessionDate: "2026-02-01" },
      { id: 4, sessionNumber: 2, sessionDate: "2026-01-15" },
    ];

    const sorted = sortBySessionNumber(sessions);
    expect(sorted.map(s => s.sessionNumber)).toEqual([1, 2, 3, 5]);
  });

  it("sessões com mesmo número são ordenadas por data decrescente", () => {
    const sessions = [
      { id: 1, sessionNumber: 1, sessionDate: "2026-01-01" },
      { id: 2, sessionNumber: 1, sessionDate: "2026-02-01" },
      { id: 3, sessionNumber: 2, sessionDate: "2026-03-01" },
    ];

    const sorted = sortBySessionNumber(sessions);
    expect(sorted[0].sessionDate).toBe("2026-02-01"); // mais recente primeiro
    expect(sorted[1].sessionDate).toBe("2026-01-01");
    expect(sorted[2].sessionNumber).toBe(2);
  });

  it("lista vazia retorna vazia", () => {
    const sorted = sortBySessionNumber([]);
    expect(sorted).toHaveLength(0);
  });
});

describe("Editar Mentorias - Busca por Nome de Aluno", () => {
  const sessions = [
    { id: 1, alunoNome: "Wandemberg Silva", consultorNome: "Ana Mentor", turmaNome: "Embrapii Basic", sessionNumber: 1 },
    { id: 2, alunoNome: "Flavia Balieiro", consultorNome: "Carlos Mentor", turmaNome: "Embrapii Jornada", sessionNumber: 2 },
    { id: 3, alunoNome: "João Santos", consultorNome: "Ana Mentor", turmaNome: "Embrapii Basic", sessionNumber: 3 },
    { id: 4, alunoNome: "Maria Oliveira", consultorNome: "Carlos Mentor", turmaNome: "Embrapii Essential", sessionNumber: 1 },
  ];

  function filterSessions(list: typeof sessions, searchTerm: string) {
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(s =>
      s.alunoNome?.toLowerCase().includes(term) ||
      s.consultorNome?.toLowerCase().includes(term) ||
      s.turmaNome?.toLowerCase().includes(term) ||
      String(s.sessionNumber).includes(term)
    );
  }

  it("filtra por nome do aluno (parcial)", () => {
    const result = filterSessions(sessions, "wand");
    expect(result).toHaveLength(1);
    expect(result[0].alunoNome).toBe("Wandemberg Silva");
  });

  it("filtra por nome do mentor", () => {
    const result = filterSessions(sessions, "ana");
    expect(result).toHaveLength(2);
  });

  it("filtra por nome da turma", () => {
    const result = filterSessions(sessions, "essential");
    expect(result).toHaveLength(1);
    expect(result[0].alunoNome).toBe("Maria Oliveira");
  });

  it("busca vazia retorna todos", () => {
    const result = filterSessions(sessions, "");
    expect(result).toHaveLength(4);
  });

  it("busca sem resultados retorna vazio", () => {
    const result = filterSessions(sessions, "xyz123");
    expect(result).toHaveLength(0);
  });

  it("busca é case-insensitive", () => {
    const result = filterSessions(sessions, "FLAVIA");
    expect(result).toHaveLength(1);
    expect(result[0].alunoNome).toBe("Flavia Balieiro");
  });
});

describe("Editar Mentorias - Filtro de Alunos por Turma (com PDI)", () => {
  // Simula a lógica do frontend que agora considera PDI
  const allAlunos = [
    { id: 1, name: "Wandemberg Silva", turmaId: 30002 },  // turma Basic
    { id: 2, name: "Flavia Balieiro", turmaId: 30002 },   // turma Basic, mas tem PDI para Jornada Personalizada
    { id: 3, name: "João Santos", turmaId: 30009 },        // turma Jornada Personalizada
    { id: 4, name: "Maria Oliveira", turmaId: 30003 },     // turma Essential
  ];

  // Simula progressData que vem do allSessionProgress
  const progressData = [
    { alunoId: 1, turmaNome: "[2025] Embrapii | Basic", trilhaNome: "Basic" },
    { alunoId: 2, turmaNome: "[2025] Embrapii | Basic", trilhaNome: "Basic" },
    { alunoId: 2, turmaNome: "[2025] Embrapii | Jornada Personalizada", trilhaNome: "Jornada Personalizada" }, // Flavia tem PDI aqui
    { alunoId: 3, turmaNome: "[2025] Embrapii | Jornada Personalizada", trilhaNome: "Jornada Personalizada" },
    { alunoId: 4, turmaNome: "[2025] Embrapii | Essential", trilhaNome: "Essential" },
  ];

  const turmasData = [
    { id: 30002, name: "[2025] Embrapii | Basic" },
    { id: 30003, name: "[2025] Embrapii | Essential" },
    { id: 30009, name: "[2025] Embrapii | Jornada Personalizada" },
  ];

  function filterAlunosByTurma(turmaId: number) {
    const selectedTurma = turmasData.find(t => t.id === turmaId);
    
    // Get alunoIds from PDI that match this turma
    const alunoIdsFromPdi = new Set<number>();
    if (selectedTurma) {
      for (const p of progressData) {
        if (p.turmaNome === selectedTurma.name) {
          alunoIdsFromPdi.add(p.alunoId);
        }
      }
    }
    
    return allAlunos.filter(a => a.turmaId === turmaId || alunoIdsFromPdi.has(a.id));
  }

  it("filtrando por turma Basic mostra alunos com turmaId=30002", () => {
    const result = filterAlunosByTurma(30002);
    expect(result.map(a => a.name)).toContain("Wandemberg Silva");
    expect(result.map(a => a.name)).toContain("Flavia Balieiro");
  });

  it("filtrando por turma Jornada Personalizada mostra Flavia (via PDI) e João (via turmaId)", () => {
    const result = filterAlunosByTurma(30009);
    const names = result.map(a => a.name);
    
    // João está diretamente na turma 30009
    expect(names).toContain("João Santos");
    
    // Flavia tem PDI para Jornada Personalizada, mesmo que turmaId=30002
    expect(names).toContain("Flavia Balieiro");
    
    // Wandemberg NÃO tem PDI para Jornada Personalizada
    expect(names).not.toContain("Wandemberg Silva");
    
    // Maria NÃO tem PDI para Jornada Personalizada
    expect(names).not.toContain("Maria Oliveira");
  });

  it("filtrando por turma Essential mostra apenas Maria", () => {
    const result = filterAlunosByTurma(30003);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Maria Oliveira");
  });

  it("Flavia aparece em 2 turmas diferentes (Basic direto + Jornada via PDI)", () => {
    const basicResult = filterAlunosByTurma(30002);
    const jornadaResult = filterAlunosByTurma(30009);
    
    expect(basicResult.map(a => a.name)).toContain("Flavia Balieiro");
    expect(jornadaResult.map(a => a.name)).toContain("Flavia Balieiro");
  });
});
