import { createConnection } from 'mysql2/promise';

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL!);
  
  // 1. Programas
  const [programs] = await conn.execute('SELECT id, name FROM programs ORDER BY id') as any;
  console.log("=== PROGRAMAS ===");
  for (const p of programs) {
    console.log(`  ID: ${p.id} | Nome: ${p.name}`);
  }
  
  // 2. Trilhas (colunas: id, externalId, name, codigo, ordem, programId)
  const [trilhas] = await conn.execute('SELECT id, externalId, name, codigo, ordem, programId FROM trilhas ORDER BY programId, ordem, id') as any;
  console.log(`\n=== TRILHAS (${trilhas.length}) ===`);
  for (const t of trilhas) {
    console.log(`  ID: ${t.id} | Nome: ${t.name} | Codigo: ${t.codigo || '-'} | Ordem: ${t.ordem} | ProgramId: ${t.programId}`);
  }
  
  // 3. Turmas (colunas: id, externalId, name, programId, year)
  const [turmas] = await conn.execute('SELECT id, name, programId, year FROM turmas ORDER BY programId, id') as any;
  console.log(`\n=== TURMAS (${turmas.length}) ===`);
  for (const t of turmas) {
    console.log(`  ID: ${t.id} | Nome: ${t.name} | ProgramId: ${t.programId} | Ano: ${t.year}`);
  }
  
  // 4. Competências por trilha (colunas: id, nome, trilhaId, codigoIntegracao, descricao, ordem)
  const [competencias] = await conn.execute('SELECT id, nome, trilhaId, codigoIntegracao, ordem FROM competencias ORDER BY trilhaId, ordem, id') as any;
  console.log(`\n=== COMPETÊNCIAS (${competencias.length} total) ===`);
  let currentTrilha: any = null;
  for (const c of competencias) {
    if (c.trilhaId !== currentTrilha) {
      currentTrilha = c.trilhaId;
      const trilha = trilhas.find((t: any) => t.id === c.trilhaId);
      console.log(`\n  --- Trilha ${c.trilhaId}: ${trilha?.name || 'N/A'} ---`);
    }
    console.log(`    ID: ${c.id} | Nome: ${c.nome} | Codigo: ${c.codigoIntegracao || '-'} | Ordem: ${c.ordem}`);
  }
  
  // 5. Distribuição de alunos por programa/turma/trilha
  const [alunosDist] = await conn.execute(`
    SELECT p.name as programName, t.name as turmaName, tr.name as trilhaName, COUNT(*) as total
    FROM alunos a
    LEFT JOIN turmas t ON a.turmaId = t.id
    LEFT JOIN trilhas tr ON a.trilhaId = tr.id
    LEFT JOIN programs p ON a.programId = p.id
    GROUP BY p.name, t.name, tr.name
    ORDER BY p.name, t.name, tr.name
  `) as any;
  console.log("\n=== DISTRIBUIÇÃO ALUNOS POR PROGRAMA/TURMA/TRILHA ===");
  for (const d of alunosDist) {
    console.log(`  Programa: ${d.programName || 'NULL'} | Turma: ${d.turmaName || 'NULL'} | Trilha: ${d.trilhaName || 'NULL'} | Alunos: ${d.total}`);
  }
  
  // 6. Total de alunos por programa
  const [alunosProg] = await conn.execute(`
    SELECT p.name as programName, COUNT(*) as total
    FROM alunos a
    LEFT JOIN programs p ON a.programId = p.id
    GROUP BY p.name
    ORDER BY p.name
  `) as any;
  console.log("\n=== TOTAL ALUNOS POR PROGRAMA ===");
  for (const d of alunosProg) {
    console.log(`  ${d.programName || 'NULL'}: ${d.total} alunos`);
  }

  // 7. Trilhas usadas nas sessões de mentoria (campo trilhaId)
  const [sessoesTrilhas] = await conn.execute(`
    SELECT tr.name as trilhaName, ms.trilhaId, COUNT(*) as total
    FROM mentoring_sessions ms
    LEFT JOIN trilhas tr ON ms.trilhaId = tr.id
    GROUP BY tr.name, ms.trilhaId
    ORDER BY total DESC
  `) as any;
  console.log("\n=== TRILHAS NAS SESSÕES DE MENTORIA ===");
  for (const s of sessoesTrilhas) {
    console.log(`  TrilhaId: ${s.trilhaId} | Nome: ${s.trilhaName || 'NULL'} | Sessões: ${s.total}`);
  }

  // 8. Alunos sem trilha definida
  const [semTrilha] = await conn.execute(`
    SELECT a.id, a.name, p.name as programName, t.name as turmaName
    FROM alunos a
    LEFT JOIN programs p ON a.programId = p.id
    LEFT JOIN turmas t ON a.turmaId = t.id
    WHERE a.trilhaId IS NULL
    ORDER BY p.name, a.name
  `) as any;
  console.log(`\n=== ALUNOS SEM TRILHA DEFINIDA (${semTrilha.length}) ===`);
  for (const a of semTrilha) {
    console.log(`  ID: ${a.id} | Nome: ${a.name} | Programa: ${a.programName || 'NULL'} | Turma: ${a.turmaName || 'NULL'}`);
  }
  
  await conn.end();
}

main().catch(e => console.error(e.message));
