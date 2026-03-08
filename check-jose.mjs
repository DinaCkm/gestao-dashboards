import { createConnection } from 'mysql2/promise';

const url = process.env.DATABASE_URL;
const conn = await createConnection(url);

// 1. Verificar José da Silva
const [joseRows] = await conn.execute(
  "SELECT id, name, email, consultorId, turmaId, programId FROM alunos WHERE name LIKE '%Jos%Silva%'"
);
console.log('=== José da Silva ===');
console.log(JSON.stringify(joseRows, null, 2));

// 2. Verificar Adriana Deus (mentora)
const [adrianaRows] = await conn.execute(
  "SELECT id, name, email, userId FROM consultors WHERE name LIKE '%Adriana%'"
);
console.log('\n=== Adriana Deus (mentora) ===');
console.log(JSON.stringify(adrianaRows, null, 2));

// 3. Verificar todos os alunos vinculados à Adriana
if (adrianaRows.length > 0) {
  const adrianaId = adrianaRows[0].id;
  const [alunosAdriana] = await conn.execute(
    "SELECT id, name, consultorId FROM alunos WHERE consultorId = ?", [adrianaId]
  );
  console.log(`\n=== Alunos vinculados à Adriana (consultorId=${adrianaId}) ===`);
  console.log(`Total: ${alunosAdriana.length}`);
  console.log(JSON.stringify(alunosAdriana.slice(0, 5), null, 2));
}

// 4. Verificar teste DISC do José
if (joseRows.length > 0) {
  const joseId = joseRows[0].id;
  const [discRows] = await conn.execute(
    "SELECT * FROM disc_results WHERE alunoId = ?", [joseId]
  );
  console.log(`\n=== Teste DISC do José (alunoId=${joseId}) ===`);
  console.log(JSON.stringify(discRows, null, 2));
  
  // 5. Verificar assessment_pdi do José
  const [assessRows] = await conn.execute(
    "SELECT * FROM assessment_pdi WHERE alunoId = ?", [joseId]
  );
  console.log(`\n=== Assessment PDI do José ===`);
  console.log(JSON.stringify(assessRows, null, 2));
}

await conn.end();
