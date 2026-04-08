import { createConnection } from 'mysql2/promise';

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL!);
  
  // Query consultors
  const [consultors] = await conn.execute('SELECT id, name, email, role FROM consultors ORDER BY id') as any;
  console.log("=== CONSULTORES ===");
  for (const c of consultors) {
    console.log(`ID: ${c.id} | Nome: ${c.name} | Email: ${c.email} | Role: ${c.role}`);
  }
  
  // Query alunos from EMBRAPII program
  const [alunos] = await conn.execute(`
    SELECT a.id, a.name, a.email, a.consultorId, a.turmaId, t.name as turmaName, p.name as programName
    FROM alunos a
    LEFT JOIN turmas t ON a.turmaId = t.id
    LEFT JOIN programs p ON a.programId = p.id
    WHERE p.name LIKE '%Embrapii%' OR p.name LIKE '%EMBRAPII%' OR t.name LIKE '%Embrapii%' OR t.name LIKE '%EMBRAPII%'
    ORDER BY a.name
  `) as any;
  console.log(`\n=== ALUNOS EMBRAPII (${alunos.length}) ===`);
  for (const a of alunos) {
    console.log(`ID: ${a.id} | Nome: ${a.name} | ConsultorId: ${a.consultorId} | Turma: ${a.turmaName}`);
  }
  
  // Also check programs
  const [programs] = await conn.execute('SELECT id, name FROM programs ORDER BY id') as any;
  console.log("\n=== PROGRAMAS ===");
  for (const p of programs) {
    console.log(`ID: ${p.id} | Nome: ${p.name}`);
  }

  // Check turmas
  const [turmas] = await conn.execute('SELECT id, name, programId FROM turmas ORDER BY id') as any;
  console.log("\n=== TURMAS ===");
  for (const t of turmas) {
    console.log(`ID: ${t.id} | Nome: ${t.name} | ProgramId: ${t.programId}`);
  }
  
  await conn.end();
}

main().catch(e => console.error(e.message));
