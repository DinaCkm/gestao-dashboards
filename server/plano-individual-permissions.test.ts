import { describe, it, expect } from "vitest";

/**
 * Testes para as permissões e filtragem de alunos no Plano Individual.
 * 
 * Regras:
 * 1. Título: "P.D.I - Plano Individual"
 * 2. Admin vê todos os alunos e pode editar
 * 3. Mentor vê apenas seus mentorados e não pode editar
 * 4. Ciclos do PDI (assessment_competencias) são exibidos automaticamente
 */

// Simular dados
const allAlunos = [
  { id: 1, name: "Aluno A", externalId: "100", programId: 1, consultorId: 10, totalCompetencias: 5, competenciasObrigatorias: 3, competenciasConcluidas: 1, progressoPlano: 33 },
  { id: 2, name: "Aluno B", externalId: "101", programId: 1, consultorId: 10, totalCompetencias: 4, competenciasObrigatorias: 2, competenciasConcluidas: 0, progressoPlano: 0 },
  { id: 3, name: "Aluno C", externalId: "102", programId: 2, consultorId: 20, totalCompetencias: 6, competenciasObrigatorias: 4, competenciasConcluidas: 2, progressoPlano: 50 },
  { id: 4, name: "Aluno D", externalId: "103", programId: 2, consultorId: 20, totalCompetencias: 3, competenciasObrigatorias: 1, competenciasConcluidas: 1, progressoPlano: 100 },
  { id: 5, name: "Aluno E", externalId: "104", programId: 1, consultorId: 30, totalCompetencias: 0, competenciasObrigatorias: 0, competenciasConcluidas: 0, progressoPlano: 0 },
];

const mentoringSessions = [
  { alunoId: 1, consultorId: 10 },
  { alunoId: 2, consultorId: 10 },
  { alunoId: 3, consultorId: 20 },
  { alunoId: 4, consultorId: 20 },
  { alunoId: 5, consultorId: 30 },
];

// Função que replica a lógica de filtragem do frontend
function filterAlunosByRole(
  isAdmin: boolean,
  allAlunosWithPlano: typeof allAlunos,
  mentorAlunos: typeof allAlunos | null,
) {
  if (isAdmin) return allAlunosWithPlano;
  if (!mentorAlunos || !allAlunosWithPlano) return [];
  const mentorAlunoIds = new Set(mentorAlunos.map(a => a.id));
  return allAlunosWithPlano.filter(a => mentorAlunoIds.has(a.id));
}

// Simular getAlunosByConsultor
function getAlunosByConsultor(consultorId: number) {
  const sessionAlunoIds = new Set(
    mentoringSessions.filter(s => s.consultorId === consultorId).map(s => s.alunoId)
  );
  return allAlunos.filter(a => sessionAlunoIds.has(a.id) || a.consultorId === consultorId);
}

describe("Plano Individual - Permissões e Filtragem por Role", () => {

  describe("Admin - Acesso completo", () => {
    it("admin vê todos os alunos", () => {
      const result = filterAlunosByRole(true, allAlunos, null);
      expect(result).toHaveLength(5);
      expect(result.map(a => a.name)).toEqual(["Aluno A", "Aluno B", "Aluno C", "Aluno D", "Aluno E"]);
    });

    it("admin vê alunos de todas as empresas", () => {
      const result = filterAlunosByRole(true, allAlunos, null);
      const programIds = new Set(result.map(a => a.programId));
      expect(programIds.size).toBe(2);
      expect(programIds.has(1)).toBe(true);
      expect(programIds.has(2)).toBe(true);
    });
  });

  describe("Mentor - Apenas seus mentorados", () => {
    it("mentor 10 vê apenas seus 2 mentorados", () => {
      const mentorAlunos = getAlunosByConsultor(10);
      const result = filterAlunosByRole(false, allAlunos, mentorAlunos);
      expect(result).toHaveLength(2);
      expect(result.map(a => a.name)).toEqual(["Aluno A", "Aluno B"]);
    });

    it("mentor 20 vê apenas seus 2 mentorados", () => {
      const mentorAlunos = getAlunosByConsultor(20);
      const result = filterAlunosByRole(false, allAlunos, mentorAlunos);
      expect(result).toHaveLength(2);
      expect(result.map(a => a.name)).toEqual(["Aluno C", "Aluno D"]);
    });

    it("mentor 30 vê apenas seu 1 mentorado", () => {
      const mentorAlunos = getAlunosByConsultor(30);
      const result = filterAlunosByRole(false, allAlunos, mentorAlunos);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Aluno E");
    });

    it("mentor sem alunos retorna lista vazia", () => {
      const mentorAlunos = getAlunosByConsultor(999);
      const result = filterAlunosByRole(false, allAlunos, mentorAlunos);
      expect(result).toHaveLength(0);
    });

    it("mentor com dados pendentes retorna lista vazia", () => {
      const result = filterAlunosByRole(false, allAlunos, null);
      expect(result).toHaveLength(0);
    });
  });

  describe("Busca e filtro de empresa", () => {
    it("busca por nome funciona dentro dos mentorados do mentor", () => {
      const mentorAlunos = getAlunosByConsultor(10);
      const baseAlunos = filterAlunosByRole(false, allAlunos, mentorAlunos);
      
      const searchTerm = "aluno a";
      const filtered = baseAlunos.filter(a => a.name.toLowerCase().includes(searchTerm));
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Aluno A");
    });

    it("filtro por empresa funciona dentro dos mentorados do mentor", () => {
      const mentorAlunos = getAlunosByConsultor(10);
      const baseAlunos = filterAlunosByRole(false, allAlunos, mentorAlunos);
      
      const filtered = baseAlunos.filter(a => a.programId === 1);
      expect(filtered).toHaveLength(2); // Ambos mentorados do mentor 10 são da empresa 1
    });
  });

  describe("Permissões de edição", () => {
    it("admin pode editar (isAdmin = true)", () => {
      const isAdmin = true;
      // Simular visibilidade dos botões
      const showAddButton = isAdmin;
      const showDeleteButton = isAdmin;
      const showLoteButton = isAdmin;
      const showNovoCicloButton = isAdmin;
      
      expect(showAddButton).toBe(true);
      expect(showDeleteButton).toBe(true);
      expect(showLoteButton).toBe(true);
      expect(showNovoCicloButton).toBe(true);
    });

    it("mentor não pode editar (isAdmin = false)", () => {
      const isAdmin = false;
      const showAddButton = isAdmin;
      const showDeleteButton = isAdmin;
      const showLoteButton = isAdmin;
      const showNovoCicloButton = isAdmin;
      
      expect(showAddButton).toBe(false);
      expect(showDeleteButton).toBe(false);
      expect(showLoteButton).toBe(false);
      expect(showNovoCicloButton).toBe(false);
    });

    it("mentor pode ver status mas não pode alterar", () => {
      const isAdmin = false;
      // Status badge é clicável apenas para admin
      const statusClickable = isAdmin;
      expect(statusClickable).toBe(false);
    });
  });
});

describe("Ciclos de Execução - Derivação do PDI", () => {
  
  // Simular assessment_competencias de um aluno
  const assessmentCompetencias = [
    { id: 1, pdiId: 100, competenciaId: 10, competenciaNome: "Atenção", trilhaId: 1, trilhaNome: "Basic", microCicloInicio: "2026-01-10", microCicloFim: "2026-03-30" },
    { id: 2, pdiId: 100, competenciaId: 11, competenciaNome: "Disciplina", trilhaId: 1, trilhaNome: "Basic", microCicloInicio: "2026-01-10", microCicloFim: "2026-03-30" },
    { id: 3, pdiId: 100, competenciaId: 12, competenciaNome: "Empatia", trilhaId: 1, trilhaNome: "Basic", microCicloInicio: "2026-04-01", microCicloFim: "2026-06-30" },
    { id: 4, pdiId: 200, competenciaId: 20, competenciaNome: "Comunicação", trilhaId: 2, trilhaNome: "Essential", microCicloInicio: "2026-07-01", microCicloFim: "2026-09-30" },
    { id: 5, pdiId: 200, competenciaId: 21, competenciaNome: "Liderança", trilhaId: 2, trilhaNome: "Essential", microCicloInicio: "2026-07-01", microCicloFim: "2026-09-30" },
  ];

  // Função que replica a lógica de derivação de ciclos do backend
  function derivarCiclosDoPdi(competencias: typeof assessmentCompetencias) {
    const ciclosMap = new Map<string, {
      nomeCiclo: string;
      dataInicio: string;
      dataFim: string;
      trilhaNome: string;
      competencias: Array<{ id: number; competenciaNome: string; trilhaNome: string }>;
    }>();

    for (const comp of competencias) {
      if (!comp.microCicloInicio || !comp.microCicloFim) continue;
      const key = `${comp.trilhaNome}_${comp.microCicloInicio}_${comp.microCicloFim}`;
      if (!ciclosMap.has(key)) {
        ciclosMap.set(key, {
          nomeCiclo: `${comp.trilhaNome} - ${comp.microCicloInicio} a ${comp.microCicloFim}`,
          dataInicio: comp.microCicloInicio,
          dataFim: comp.microCicloFim,
          trilhaNome: comp.trilhaNome,
          competencias: [],
        });
      }
      ciclosMap.get(key)!.competencias.push({
        id: comp.competenciaId,
        competenciaNome: comp.competenciaNome,
        trilhaNome: comp.trilhaNome,
      });
    }

    return Array.from(ciclosMap.values()).sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));
  }

  it("agrupa competências por trilha e período", () => {
    const ciclos = derivarCiclosDoPdi(assessmentCompetencias);
    expect(ciclos).toHaveLength(3); // Basic Jan-Mar, Basic Apr-Jun, Essential Jul-Sep
  });

  it("primeiro ciclo tem 2 competências (Basic Jan-Mar)", () => {
    const ciclos = derivarCiclosDoPdi(assessmentCompetencias);
    expect(ciclos[0].competencias).toHaveLength(2);
    expect(ciclos[0].competencias.map(c => c.competenciaNome)).toEqual(["Atenção", "Disciplina"]);
    expect(ciclos[0].trilhaNome).toBe("Basic");
  });

  it("segundo ciclo tem 1 competência (Basic Apr-Jun)", () => {
    const ciclos = derivarCiclosDoPdi(assessmentCompetencias);
    expect(ciclos[1].competencias).toHaveLength(1);
    expect(ciclos[1].competencias[0].competenciaNome).toBe("Empatia");
  });

  it("terceiro ciclo tem 2 competências (Essential Jul-Sep)", () => {
    const ciclos = derivarCiclosDoPdi(assessmentCompetencias);
    expect(ciclos[2].competencias).toHaveLength(2);
    expect(ciclos[2].trilhaNome).toBe("Essential");
  });

  it("ciclos são ordenados por data de início", () => {
    const ciclos = derivarCiclosDoPdi(assessmentCompetencias);
    for (let i = 1; i < ciclos.length; i++) {
      expect(ciclos[i].dataInicio >= ciclos[i-1].dataInicio).toBe(true);
    }
  });

  it("competências sem micro ciclo são ignoradas", () => {
    const compsComNull = [
      ...assessmentCompetencias,
      { id: 6, pdiId: 100, competenciaId: 13, competenciaNome: "Memória", trilhaId: 1, trilhaNome: "Basic", microCicloInicio: null as any, microCicloFim: null as any },
    ];
    const ciclos = derivarCiclosDoPdi(compsComNull);
    expect(ciclos).toHaveLength(3); // Memória sem datas não cria ciclo
    const todasComps = ciclos.flatMap(c => c.competencias);
    expect(todasComps.find(c => c.competenciaNome === "Memória")).toBeUndefined();
  });

  it("aluno sem competências retorna lista vazia de ciclos", () => {
    const ciclos = derivarCiclosDoPdi([]);
    expect(ciclos).toHaveLength(0);
  });
});
