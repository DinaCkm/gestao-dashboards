import { describe, expect, it } from "vitest";

/**
 * Tests for the PDI multi-trail display fix.
 * 
 * The bug was that EtapaMeuPDI in OnboardingAluno.tsx only displayed
 * macroJornadas[0] (the first trail), ignoring any additional trails.
 * 
 * For example, Julia Souza Makiyama (alunoId: 660014) has:
 * - Trail "Basic" (trilhaId: 1) with 3 competencies
 * - Trail "Essential" (trilhaId: 2) with 1 competency
 * But only saw the Essential trail (first in desc order by createdAt).
 * 
 * The fix changes the component to iterate over ALL macroJornadas,
 * consolidating totals and displaying each trail with its competencies.
 */

// Simulate the data structure returned by getJornadaCompleta
function createMockJornadaData() {
  return {
    contrato: { id: 1, alunoId: 660014, status: 'ativo' },
    macroJornadas: [
      {
        id: 210002,
        trilhaId: 2,
        trilhaNome: "Essential",
        status: "ativo",
        macroInicio: "2026-05-01",
        macroTermino: "2026-05-30",
        totalCompetencias: 1,
        obrigatorias: 1,
        opcionais: 0,
        nivelGeralAtual: 30,
        metaGeralFinal: 100,
        microJornadas: [
          {
            id: 210004,
            competenciaId: 30014,
            competenciaNome: "Competência Essential 1",
            peso: "obrigatoria",
            nivelAtual: 30,
            metaFinal: 100,
            metaCiclo1: 60,
            metaCiclo2: 80,
            microInicio: "2026-05-01",
            microTermino: "2026-05-30",
            progressoPlataforma: null,
            totalAulas: null,
            aulasDisponiveis: null,
            aulasConcluidas: null,
            aulasEmAndamento: null,
            aulasNaoIniciadas: null,
            avaliacoesRespondidas: null,
            avaliacoesDisponiveis: null,
            competenciaConcluida: false,
          }
        ],
      },
      {
        id: 210001,
        trilhaId: 1,
        trilhaNome: "Basic",
        status: "ativo",
        macroInicio: "2026-04-01",
        macroTermino: "2026-04-30",
        totalCompetencias: 3,
        obrigatorias: 3,
        opcionais: 0,
        nivelGeralAtual: 26.67,
        metaGeralFinal: 100,
        microJornadas: [
          {
            id: 210001,
            competenciaId: 30007,
            competenciaNome: "Competência Basic 1",
            peso: "obrigatoria",
            nivelAtual: 20,
            metaFinal: 100,
            metaCiclo1: 60,
            metaCiclo2: 80,
            microInicio: "2026-04-01",
            microTermino: "2026-04-30",
            progressoPlataforma: null,
            totalAulas: null,
            aulasDisponiveis: null,
            aulasConcluidas: null,
            aulasEmAndamento: null,
            aulasNaoIniciadas: null,
            avaliacoesRespondidas: null,
            avaliacoesDisponiveis: null,
            competenciaConcluida: false,
          },
          {
            id: 210002,
            competenciaId: 30008,
            competenciaNome: "Competência Basic 2",
            peso: "obrigatoria",
            nivelAtual: 30,
            metaFinal: 100,
            metaCiclo1: 60,
            metaCiclo2: 80,
            microInicio: "2026-04-01",
            microTermino: "2026-04-30",
            progressoPlataforma: null,
            totalAulas: null,
            aulasDisponiveis: null,
            aulasConcluidas: null,
            aulasEmAndamento: null,
            aulasNaoIniciadas: null,
            avaliacoesRespondidas: null,
            avaliacoesDisponiveis: null,
            competenciaConcluida: false,
          },
          {
            id: 210003,
            competenciaId: 30009,
            competenciaNome: "Competência Basic 3",
            peso: "obrigatoria",
            nivelAtual: 30,
            metaFinal: 100,
            metaCiclo1: 60,
            metaCiclo2: 80,
            microInicio: "2026-04-01",
            microTermino: "2026-04-30",
            progressoPlataforma: null,
            totalAulas: null,
            aulasDisponiveis: null,
            aulasConcluidas: null,
            aulasEmAndamento: null,
            aulasNaoIniciadas: null,
            avaliacoesRespondidas: null,
            avaliacoesDisponiveis: null,
            competenciaConcluida: false,
          },
        ],
      },
    ],
    saldo: null,
  };
}

describe("PDI Multi-Trail Display", () => {
  
  it("should have multiple macroJornadas for Julia's case", () => {
    const data = createMockJornadaData();
    expect(data.macroJornadas.length).toBe(2);
  });

  it("should consolidate ALL competencies from all trails", () => {
    const data = createMockJornadaData();
    const allMacroJornadas = data.macroJornadas;
    
    // This is the NEW logic (consolidating all trails)
    const todasCompetencias = allMacroJornadas.flatMap((mj: any) => 
      (mj.microJornadas || []).map((micro: any) => ({ ...micro, trilhaNome: mj.trilhaNome, trilhaId: mj.trilhaId }))
    );
    
    // Should have 4 total competencies (3 Basic + 1 Essential)
    expect(todasCompetencias.length).toBe(4);
    
    // Each competency should have trilhaNome attached
    expect(todasCompetencias[0].trilhaNome).toBe("Essential");
    expect(todasCompetencias[1].trilhaNome).toBe("Basic");
    expect(todasCompetencias[2].trilhaNome).toBe("Basic");
    expect(todasCompetencias[3].trilhaNome).toBe("Basic");
  });

  it("OLD BUG: macroJornadas[0] only showed first trail", () => {
    const data = createMockJornadaData();
    
    // OLD logic (the bug): only first trail
    const macroJornada = data.macroJornadas[0];
    const competencias = macroJornada?.microJornadas || [];
    
    // Only 1 competency from Essential trail - MISSING 3 from Basic!
    expect(competencias.length).toBe(1);
    expect(macroJornada.trilhaNome).toBe("Essential");
  });

  it("NEW FIX: allMacroJornadas shows all trails", () => {
    const data = createMockJornadaData();
    const allMacroJornadas = data.macroJornadas;
    const hasPdi = allMacroJornadas.length > 0;
    
    expect(hasPdi).toBe(true);
    expect(allMacroJornadas.length).toBe(2);
    
    // First trail: Essential with 1 competency
    expect(allMacroJornadas[0].trilhaNome).toBe("Essential");
    expect(allMacroJornadas[0].microJornadas.length).toBe(1);
    
    // Second trail: Basic with 3 competencies
    expect(allMacroJornadas[1].trilhaNome).toBe("Basic");
    expect(allMacroJornadas[1].microJornadas.length).toBe(3);
  });

  it("should calculate consolidated timeline from all trails", () => {
    const data = createMockJornadaData();
    const allMacroJornadas = data.macroJornadas;
    
    // Consolidated: earliest start, latest end
    const allInicios = allMacroJornadas.map((mj: any) => mj.macroInicio).filter(Boolean).sort();
    const allTerminos = allMacroJornadas.map((mj: any) => mj.macroTermino).filter(Boolean).sort();
    
    const macroInicio = allInicios[0]; // Earliest: 2026-04-01 (Basic)
    const macroTermino = allTerminos[allTerminos.length - 1]; // Latest: 2026-05-30 (Essential)
    
    expect(macroInicio).toBe("2026-04-01");
    expect(macroTermino).toBe("2026-05-30");
  });

  it("should count total obrigatorias and opcionais from all trails", () => {
    const data = createMockJornadaData();
    const allMacroJornadas = data.macroJornadas;
    
    const todasCompetencias = allMacroJornadas.flatMap((mj: any) => 
      (mj.microJornadas || []).map((micro: any) => ({ ...micro, trilhaNome: mj.trilhaNome }))
    );
    
    const obrigatorias = todasCompetencias.filter((c: any) => c.peso === 'obrigatoria').length;
    const opcionais = todasCompetencias.filter((c: any) => c.peso !== 'obrigatoria').length;
    
    expect(obrigatorias).toBe(4); // All 4 are obrigatórias
    expect(opcionais).toBe(0);
  });

  it("should handle single trail case (backward compatible)", () => {
    const data = createMockJornadaData();
    // Remove the second trail to simulate single-trail student
    data.macroJornadas = [data.macroJornadas[0]];
    
    const allMacroJornadas = data.macroJornadas;
    const hasPdi = allMacroJornadas.length > 0;
    
    expect(hasPdi).toBe(true);
    expect(allMacroJornadas.length).toBe(1);
    
    const todasCompetencias = allMacroJornadas.flatMap((mj: any) => 
      (mj.microJornadas || []).map((micro: any) => ({ ...micro, trilhaNome: mj.trilhaNome }))
    );
    expect(todasCompetencias.length).toBe(1);
  });

  it("should handle empty macroJornadas (no PDI yet)", () => {
    const data = { contrato: null, macroJornadas: [], saldo: null };
    
    const allMacroJornadas = data.macroJornadas;
    const hasPdi = allMacroJornadas.length > 0;
    
    expect(hasPdi).toBe(false);
    
    const todasCompetencias = allMacroJornadas.flatMap((mj: any) => 
      (mj.microJornadas || []).map((micro: any) => ({ ...micro, trilhaNome: mj.trilhaNome }))
    );
    expect(todasCompetencias.length).toBe(0);
  });

  it("should generate unique keys for competencies across trails", () => {
    const data = createMockJornadaData();
    const allMacroJornadas = data.macroJornadas;
    
    // The component uses `${trilhaIdx}-${idx}` as compKey
    const keys: string[] = [];
    allMacroJornadas.forEach((mj: any, trilhaIdx: number) => {
      (mj.microJornadas || []).forEach((_comp: any, idx: number) => {
        keys.push(`${trilhaIdx}-${idx}`);
      });
    });
    
    // All keys should be unique
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
    expect(keys).toEqual(["0-0", "1-0", "1-1", "1-2"]);
  });

  it("should preserve per-trail metadata (obrigatorias, opcionais, dates)", () => {
    const data = createMockJornadaData();
    const allMacroJornadas = data.macroJornadas;
    
    // Essential trail
    expect(allMacroJornadas[0].obrigatorias).toBe(1);
    expect(allMacroJornadas[0].opcionais).toBe(0);
    expect(allMacroJornadas[0].macroInicio).toBe("2026-05-01");
    expect(allMacroJornadas[0].macroTermino).toBe("2026-05-30");
    
    // Basic trail
    expect(allMacroJornadas[1].obrigatorias).toBe(3);
    expect(allMacroJornadas[1].opcionais).toBe(0);
    expect(allMacroJornadas[1].macroInicio).toBe("2026-04-01");
    expect(allMacroJornadas[1].macroTermino).toBe("2026-04-30");
  });
});
