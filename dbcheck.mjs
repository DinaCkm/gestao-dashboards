import { createConnection } from 'mysql2/promise';

const conn = await createConnection(process.env.DATABASE_URL);

// Turmas
const [turmas] = await conn.execute('SELECT id, name, externalId, programId, year FROM turmas ORDER BY externalId, name');
console.log('=== TURMAS ===');
console.log(JSON.stringify(turmas, null, 2));

// Turmas duplicadas
const [dupes] = await conn.execute('SELECT name, externalId, COUNT(*) as cnt FROM turmas GROUP BY name, externalId HAVING cnt > 1');
console.log('\n=== TURMAS DUPLICADAS ===');
console.log(JSON.stringify(dupes, null, 2));

// Trilhas
const [trilhas] = await conn.execute('SELECT id, name, code FROM trilhas ORDER BY id');
console.log('\n=== TRILHAS ===');
console.log(JSON.stringify(trilhas, null, 2));

// Programs
const [progs] = await conn.execute('SELECT id, name, code FROM programs ORDER BY id');
console.log('\n=== PROGRAMS ===');
console.log(JSON.stringify(progs, null, 2));

await conn.end();
process.exit(0);
