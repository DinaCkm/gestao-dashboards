import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Onboarding data persistence", () => {
  // Test that updateAluno accepts the new fields
  it("should accept telefone, cargo, areaAtuacao, experiencia in updateAluno", async () => {
    // Get any existing aluno to test update
    const alunos = await db.getAlunos();
    expect(alunos.length).toBeGreaterThan(0);
    
    const testAluno = alunos[0];
    // Update with new onboarding fields (use current values to not break data)
    const result = await db.updateAluno(testAluno.id, {
      telefone: testAluno.telefone || "(11) 99999-0000",
      cargo: testAluno.cargo || "Analista",
      areaAtuacao: testAluno.areaAtuacao || "Tecnologia",
      experiencia: testAluno.experiencia || "5 anos",
    });
    
    expect(result).toBeTruthy();
  });

  it("should update consultorId when choosing a mentor in onboarding", async () => {
    // Verify that updateAluno can set consultorId
    const alunos = await db.getAlunos();
    const testAluno = alunos[0];
    
    // Save original consultorId
    const originalConsultorId = testAluno.consultorId;
    
    // Update consultorId (use same value to not break data)
    if (originalConsultorId) {
      const result = await db.updateAluno(testAluno.id, {
        consultorId: originalConsultorId,
      });
      expect(result).toBeTruthy();
    }
  });

  it("should return aluno with new fields via getAlunoById", async () => {
    const alunos = await db.getAlunos();
    const testAluno = alunos[0];
    
    const aluno = await db.getAlunoById(testAluno.id);
    expect(aluno).toBeTruthy();
    // Verify the fields exist in the returned object (may be null)
    expect(aluno).toHaveProperty("telefone");
    expect(aluno).toHaveProperty("cargo");
    expect(aluno).toHaveProperty("areaAtuacao");
    expect(aluno).toHaveProperty("experiencia");
  });
});

describe("DISC result visibility for mentors", () => {
  it("should return DISC resultado with correct fields", async () => {
    // Find an aluno that has DISC results
    const alunos = await db.getAlunos();
    let discResult = null;
    
    for (const aluno of alunos) {
      const result = await db.getDiscResultado(aluno.id);
      if (result) {
        discResult = result;
        break;
      }
    }
    
    // If any aluno has DISC results, verify the structure
    if (discResult) {
      expect(discResult).toHaveProperty("scoreD");
      expect(discResult).toHaveProperty("scoreI");
      expect(discResult).toHaveProperty("scoreS");
      expect(discResult).toHaveProperty("scoreC");
      expect(discResult).toHaveProperty("perfilPredominante");
      expect(discResult).toHaveProperty("perfilSecundario");
      expect(discResult).toHaveProperty("alunoId");
    }
  });

  it("should return null for aluno without DISC results", async () => {
    // Use a non-existent alunoId
    const result = await db.getDiscResultado(999999);
    expect(result).toBeNull();
  });
});

describe("Mentor can see alunos linked via consultorId", () => {
  it("should include alunos linked via consultorId in getAlunosByConsultor", async () => {
    // Get all consultors
    const consultors = await db.getConsultors();
    expect(consultors.length).toBeGreaterThan(0);
    
    // Find a consultor that has alunos linked via consultorId
    const allAlunos = await db.getAlunos();
    const alunosWithConsultor = allAlunos.filter(a => a.consultorId);
    
    if (alunosWithConsultor.length > 0) {
      const consultorId = alunosWithConsultor[0].consultorId!;
      const mentorAlunos = await db.getAlunosByConsultor(consultorId);
      
      // The aluno linked via consultorId should be in the list
      const linkedAluno = mentorAlunos.find(a => a.id === alunosWithConsultor[0].id);
      expect(linkedAluno).toBeTruthy();
    }
  });
});
