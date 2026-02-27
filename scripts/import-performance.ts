import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, sql, desc } from 'drizzle-orm';
import { 
  alunos, turmas, competencias, studentPerformance, performanceUploads 
} from '../drizzle/schema';

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const db = drizzle(dbUrl);
  
  // Read CSV
  const csvPath = '/home/ubuntu/upload/relatorio-de-performance-2026-02-26-69a0f613e64cc.csv';
  const csvText = readFileSync(csvPath, 'utf-8').replace(/^\uFEFF/, '');
  
  // Parse CSV
  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  const lines = csvText.split('\n');
  const headers = parseCSVLine(lines[0]);
  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => { colMap[h.trim()] = i; });
  
  console.log('Colunas encontradas:', headers.length);
  console.log('Total de linhas (excl. header):', lines.length - 1);

  // Get alunos
  const alunosList = await db.select().from(alunos);
  const alunoByName = new Map<string, number>();
  const alunoByEmail = new Map<string, number>();
  for (const a of alunosList) {
    if (a.name) alunoByName.set(a.name.toLowerCase().trim(), a.id);
    if (a.email) alunoByEmail.set(a.email.toLowerCase().trim(), a.id);
  }
  console.log(`Alunos no banco: ${alunosList.length}`);

  // Get turmas
  const turmasList = await db.select().from(turmas);
  const turmaByName = new Map<string, number>();
  for (const t of turmasList) {
    if (t.name) turmaByName.set(t.name.toLowerCase().trim(), t.id);
  }
  console.log(`Turmas no banco: ${turmasList.length}`);

  // Get competencias
  const compList = await db.select().from(competencias);
  const compByName = new Map<string, number>();
  for (const c of compList) {
    if (c.nome) compByName.set(c.nome.toLowerCase().trim(), c.id);
  }
  console.log(`Competências no banco: ${compList.length}`);

  // Create upload record
  const [uploadResult] = await db.insert(performanceUploads).values({
    uploadedBy: 1,
    fileName: 'relatorio-de-performance-2026-02-26.csv',
    status: 'processing',
  });
  const uploadId = Number(uploadResult.insertId);
  console.log(`Upload ID: ${uploadId}`);

  // Delete existing data
  await db.delete(studentPerformance);
  console.log('Dados anteriores removidos');

  // Process rows
  const records: any[] = [];
  let skipped = 0;
  let totalRows = 0;
  const unmatchedStudents = new Set<string>();
  const unmatchedTurmas = new Set<string>();

  function getVal(values: string[], colName: string): string | undefined {
    const idx = colMap[colName];
    if (idx === undefined || idx >= values.length) return undefined;
    const val = values[idx]?.trim();
    if (!val || val === '-') return undefined;
    return val;
  }

  function parseIntSafe(val: string | undefined): number {
    if (!val || val === '-') return 0;
    const n = parseInt(val, 10);
    return isNaN(n) ? 0 : n;
  }

  function parseDecimalSafe(val: string | undefined): string | null {
    if (!val || val === '-' || val.includes('Sem avalia')) return null;
    const n = parseFloat(val.replace(',', '.'));
    return isNaN(n) ? null : n.toFixed(2);
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    totalRows++;

    const values = parseCSVLine(line);
    const externalUserId = getVal(values, 'Id Usuário');
    const userName = getVal(values, 'Nome Usuário');

    if (!externalUserId || !userName) {
      skipped++;
      continue;
    }

    const userEmail = getVal(values, 'E-mail');
    const turmaName = getVal(values, 'Turma (agrupador 1)');
    const compName = getVal(values, 'Competência (agrupador 2)');

    // Match aluno
    let alunoId: number | null = null;
    if (userEmail) {
      alunoId = alunoByEmail.get(userEmail.toLowerCase().trim()) || null;
    }
    if (!alunoId && userName) {
      alunoId = alunoByName.get(userName.toLowerCase().trim()) || null;
    }
    if (!alunoId) unmatchedStudents.add(userName);

    // Match turma
    let turmaId: number | null = null;
    if (turmaName) {
      turmaId = turmaByName.get(turmaName.toLowerCase().trim()) || null;
      if (!turmaId) unmatchedTurmas.add(turmaName);
    }

    // Match competencia
    let competenciaId: number | null = null;
    if (compName) {
      competenciaId = compByName.get(compName.toLowerCase().trim()) || null;
      if (!competenciaId) {
        const baseName = compName.replace(/\s*-\s*(Master|Essencial|Básica|Visão de Futuro|Jornada.*)$/i, '').trim();
        competenciaId = compByName.get(baseName.toLowerCase()) || null;
      }
    }

    records.push({
      alunoId,
      externalUserId,
      userName,
      userEmail: userEmail || null,
      lastAccess: getVal(values, 'Último acesso') || null,
      turmaId,
      externalTurmaId: getVal(values, 'Id Turma (agrupador 1)') || null,
      turmaName: turmaName || null,
      competenciaId,
      externalCompetenciaId: getVal(values, 'Id Competência (agrupador 2)') || null,
      competenciaName: compName || null,
      dataInicio: getVal(values, 'Data de início') || null,
      dataConclusao: getVal(values, 'Data de conclusão') || null,
      totalAulas: parseIntSafe(getVal(values, 'Total de aulas')),
      aulasDisponiveis: parseIntSafe(getVal(values, 'Aulas disponíveis')),
      aulasConcluidas: parseIntSafe(getVal(values, 'Aulas concluídas')),
      aulasEmAndamento: parseIntSafe(getVal(values, 'Aulas em andamento')),
      aulasNaoIniciadas: parseIntSafe(getVal(values, 'Aulas não iniciadas')),
      aulasAgendadas: parseIntSafe(getVal(values, 'Aulas agendadas')),
      progressoTotal: parseIntSafe(getVal(values, 'Progresso Total')),
      cargaHorariaTotal: getVal(values, 'Carga horária total') || null,
      cargaHorariaConcluida: getVal(values, 'Carga horária concluída') || null,
      progressoAulasDisponiveis: parseIntSafe(getVal(values, 'Progresso em aulas disponíveis')),
      avaliacoesDiagnostico: parseIntSafe(getVal(values, 'Avaliações de diagnóstico')),
      mediaAvaliacoesDiagnostico: parseDecimalSafe(getVal(values, 'Média das avaliações de diagnóstico')),
      avaliacoesFinais: parseIntSafe(getVal(values, 'Avaliações finais')),
      mediaAvaliacoesFinais: parseDecimalSafe(getVal(values, 'Média das avaliações finais')),
      avaliacoesDisponiveis: parseIntSafe(getVal(values, 'Avaliações disponíveis')),
      avaliacoesRespondidas: parseIntSafe(getVal(values, 'Avaliações respondidas')),
      avaliacoesPendentes: parseIntSafe(getVal(values, 'Avaliações pendentes')),
      avaliacoesAgendadas: parseIntSafe(getVal(values, 'Avaliações agendadas')),
      mediaAvaliacoesDisponiveis: parseDecimalSafe(getVal(values, 'Média em avaliações disponíveis')),
      mediaAvaliacoesRespondidas: parseDecimalSafe(getVal(values, 'Média em avaliações respondidas')),
      concluidoDentroPrazo: getVal(values, 'Concluído dentro do prazo (%)') || null,
      concluidoEmAtraso: getVal(values, 'Concluído em atraso (%)') || null,
      naoConcluidoDentroPrazo: getVal(values, 'Não Concluído e dentro do prazo (%)') || null,
      naoConcluidoEmAtraso: getVal(values, 'Não Concluído e em atraso (%)') || null,
      uploadId,
    });
  }

  // Insert in batches
  let inserted = 0;
  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100);
    await db.insert(studentPerformance).values(batch);
    inserted += batch.length;
    process.stdout.write(`\rInseridos: ${inserted}/${records.length}`);
  }
  console.log('');

  // Update upload record
  await db.update(performanceUploads).set({
    totalRecords: totalRows,
    processedRecords: inserted,
    skippedRecords: skipped,
    newAlunos: unmatchedStudents.size,
    updatedRecords: inserted,
    status: 'completed',
    summary: JSON.stringify({
      unmatchedStudents: Array.from(unmatchedStudents),
      unmatchedTurmas: Array.from(unmatchedTurmas),
    }),
  }).where(eq(performanceUploads.id, uploadId));

  console.log('\n=== RESULTADO ===');
  console.log(`Total linhas: ${totalRows}`);
  console.log(`Processados: ${inserted}`);
  console.log(`Ignorados: ${skipped}`);
  console.log(`Alunos não vinculados (${unmatchedStudents.size}): ${Array.from(unmatchedStudents).join(', ')}`);
  console.log(`Turmas não vinculadas (${unmatchedTurmas.size}): ${Array.from(unmatchedTurmas).join(', ')}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
