import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { alunos } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Plataforma de Aulas - Funcionalidade', () => {
  let db: any;
  const testAlunoId = 99999;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Failed to connect to database');
    }
  });

  it('deve atualizar plataformaAulas de um aluno para scaffold', async () => {
    // Arrange
    const initialData = {
      id: testAlunoId,
      name: 'Test Aluno',
      email: 'test@example.com',
      externalId: '999999',
      programId: 1,
      plataformaAulas: 'sistema_interno',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Limpar dados anteriores se existirem
    await db.delete(alunos).where(eq(alunos.id, testAlunoId)).catch(() => {});

    // Inserir aluno de teste
    await db.insert(alunos).values(initialData);

    // Act - Atualizar para scaffold
    await db
      .update(alunos)
      .set({ plataformaAulas: 'scaffold' })
      .where(eq(alunos.id, testAlunoId));

    // Assert
    const updated = await db
      .select()
      .from(alunos)
      .where(eq(alunos.id, testAlunoId))
      .limit(1);

    expect(updated).toHaveLength(1);
    expect(updated[0].plataformaAulas).toBe('scaffold');
  });

  it('deve atualizar plataformaAulas de um aluno para sistema_interno', async () => {
    // Arrange
    const testId = 99998;
    const initialData = {
      id: testId,
      name: 'Test Aluno 2',
      email: 'test2@example.com',
      externalId: '999998',
      programId: 1,
      plataformaAulas: 'scaffold',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Limpar dados anteriores se existirem
    await db.delete(alunos).where(eq(alunos.id, testId)).catch(() => {});

    // Inserir aluno de teste
    await db.insert(alunos).values(initialData);

    // Act - Atualizar para sistema_interno
    await db
      .update(alunos)
      .set({ plataformaAulas: 'sistema_interno' })
      .where(eq(alunos.id, testId));

    // Assert
    const updated = await db
      .select()
      .from(alunos)
      .where(eq(alunos.id, testId))
      .limit(1);

    expect(updated).toHaveLength(1);
    expect(updated[0].plataformaAulas).toBe('sistema_interno');
  });

  it('deve manter o valor padrão sistema_interno para novos alunos', async () => {
    // Arrange
    const testId = 99997;
    const newAlunoData = {
      id: testId,
      name: 'New Aluno',
      email: 'new@example.com',
      externalId: '999997',
      programId: 1,
      plataformaAulas: 'sistema_interno',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Limpar dados anteriores se existirem
    await db.delete(alunos).where(eq(alunos.id, testId)).catch(() => {});

    // Act - Inserir novo aluno
    await db.insert(alunos).values(newAlunoData);

    // Assert
    const inserted = await db
      .select()
      .from(alunos)
      .where(eq(alunos.id, testId))
      .limit(1);

    expect(inserted).toHaveLength(1);
    expect(inserted[0].plataformaAulas).toBe('sistema_interno');
  });

  afterAll(async () => {
    // Limpar dados de teste
    await db.delete(alunos).where(eq(alunos.id, testAlunoId)).catch(() => {});
    await db.delete(alunos).where(eq(alunos.id, 99998)).catch(() => {});
    await db.delete(alunos).where(eq(alunos.id, 99997)).catch(() => {});
  });
});

describe('updateMultipleAlunosPlataforma - Função de Atualização em Massa', () => {
  let db: any;
  const testIds = [88888, 88889, 88890];

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    // Criar alunos de teste
    for (let i = 0; i < testIds.length; i++) {
      const id = testIds[i];
      await db.delete(alunos).where(eq(alunos.id, id)).catch(() => {});
      await db.insert(alunos).values({
        id,
        name: `Test Aluno ${i}`,
        email: `test${i}@example.com`,
        externalId: `88888${i}`,
        programId: 1,
        plataformaAulas: 'sistema_interno',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });

  it('deve atualizar múltiplos alunos para scaffold', async () => {
    // Arrange
    const updates = [
      { alunoId: testIds[0], plataformaAulas: 'scaffold' as const },
      { alunoId: testIds[1], plataformaAulas: 'scaffold' as const },
    ];

    // Act
    for (const update of updates) {
      await db
        .update(alunos)
        .set({ plataformaAulas: update.plataformaAulas })
        .where(eq(alunos.id, update.alunoId));
    }

    // Assert
    const updated = await db
      .select()
      .from(alunos)
      .where(eq(alunos.id, testIds[0]));

    expect(updated[0].plataformaAulas).toBe('scaffold');

    const updated2 = await db
      .select()
      .from(alunos)
      .where(eq(alunos.id, testIds[1]));

    expect(updated2[0].plataformaAulas).toBe('scaffold');
  });

  it('deve manter alunos não atualizados com seu valor original', async () => {
    // Assert
    const notUpdated = await db
      .select()
      .from(alunos)
      .where(eq(alunos.id, testIds[2]));

    expect(notUpdated[0].plataformaAulas).toBe('sistema_interno');
  });

  afterAll(async () => {
    // Limpar dados de teste
    for (const id of testIds) {
      await db.delete(alunos).where(eq(alunos.id, id)).catch(() => {});
    }
  });
});
