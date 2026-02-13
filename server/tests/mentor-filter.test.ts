import { describe, it, expect, afterAll } from 'vitest';
import * as db from '../db';

// Adriana Deus consultorId = 39

describe('Mentor filtering - alunos and programs by consultor', () => {
  
  it('should return only alunos linked to a specific mentor via mentoring sessions', async () => {
    const alunos = await db.getAlunosByConsultor(39); // Adriana Deus
    expect(alunos.length).toBeGreaterThan(0);
    expect(alunos.length).toBeLessThanOrEqual(20); // Adriana has 16 alunos, not 30+
    
    // All returned alunos should have valid names
    for (const aluno of alunos) {
      expect(aluno.name).toBeTruthy();
      expect(aluno.id).toBeGreaterThan(0);
    }
  });

  it('should filter alunos by programId when provided', async () => {
    const allAlunos = await db.getAlunosByConsultor(39);
    
    // Get unique programIds
    const programIds = Array.from(new Set(allAlunos.map(a => a.programId).filter(Boolean)));
    expect(programIds.length).toBeGreaterThanOrEqual(1);
    
    // Filter by first program
    const filteredAlunos = await db.getAlunosByConsultor(39, programIds[0]!);
    expect(filteredAlunos.length).toBeGreaterThan(0);
    expect(filteredAlunos.length).toBeLessThanOrEqual(allAlunos.length);
    
    // All filtered alunos should belong to the specified program
    for (const aluno of filteredAlunos) {
      expect(aluno.programId).toBe(programIds[0]);
    }
  });

  it('should return empty array for consultor with no sessions', async () => {
    const alunos = await db.getAlunosByConsultor(999999);
    expect(alunos).toEqual([]);
  });

  it('should return programs linked to a mentor via their alunos', async () => {
    const programs = await db.getProgramsByConsultor(39); // Adriana Deus
    expect(programs.length).toBeGreaterThan(0);
    
    // Each program should have id and name
    for (const program of programs) {
      expect(program.id).toBeGreaterThan(0);
      expect(program.name).toBeTruthy();
    }
  });

  it('should return empty programs for consultor with no sessions', async () => {
    const programs = await db.getProgramsByConsultor(999999);
    expect(programs).toEqual([]);
  });

  it('getConsultorStats should count only valid alunos (no orphans)', async () => {
    const stats = await db.getConsultorStats(39); // Adriana Deus
    expect(stats).not.toBeNull();
    
    if (stats) {
      // After cleanup, Adriana should have 26 sessions and 16 alunos
      expect(stats.totalMentorias).toBe(26);
      expect(stats.totalAlunos).toBe(16);
      expect(stats.totalEmpresas).toBe(2); // SEBRAE TO and EMBRAPII
      
      // All alunos should have valid names (no 'Desconhecido')
      for (const aluno of stats.alunosAtendidos) {
        expect((aluno as any).nome).not.toBe('Desconhecido');
        expect((aluno as any).nome).toBeTruthy();
      }
      
      // All sessions should reference valid alunos
      for (const sessao of stats.sessoes) {
        expect(sessao.aluno).not.toBe('Desconhecido');
      }
    }
  });

  it('no orphan mentoring sessions should exist in the database', async () => {
    // Verify there are no sessions referencing non-existent alunos
    const allAlunos = await db.getAlunos();
    const alunoIds = new Set(allAlunos.map(a => a.id));
    
    const allSessions = await db.getAllMentoringSessions();
    const orphanSessions = allSessions.filter(s => !alunoIds.has(s.alunoId));
    
    expect(orphanSessions.length).toBe(0);
  });
});
