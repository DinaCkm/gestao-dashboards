import { createConnection } from 'mysql2/promise';

const conn = await createConnection(process.env.DATABASE_URL);

// Trilhas
const [trilhas] = await conn.execute('SELECT id, name, codigo, ordem FROM trilhas ORDER BY id');
console.log('=== TRILHAS ===');
console.log(JSON.stringify(trilhas, null, 2));

// Programs
const [progs] = await conn.execute('SELECT id, name FROM programs ORDER BY id');
console.log('\n=== PROGRAMS ===');
console.log(JSON.stringify(progs, null, 2));

// Alunos por turma duplicada - verificar se alunos estão em ambas
const [alunosDupes] = await conn.execute(`
  SELECT t.id as turmaId, t.name as turmaName, t.externalId, COUNT(a.id) as alunoCount
  FROM turmas t
  LEFT JOIN alunos a ON a.turmaId = t.id
  GROUP BY t.id, t.name, t.externalId
  ORDER BY t.externalId, t.id
`);
console.log('\n=== ALUNOS POR TURMA ===');
console.log(JSON.stringify(alunosDupes, null, 2));

await conn.end();
process.exit(0);
