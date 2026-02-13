import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 1. Mentores na tabela consultors
const [mentores] = await conn.query('SELECT id, name, email, role, canLogin FROM consultors WHERE role = ? ORDER BY id', ['mentor']);
console.log('=== MENTORES NA TABELA CONSULTORS ===');
console.log('Total:', mentores.length);
for (const m of mentores) {
  console.log(`  id=${m.id} ${m.name} (${m.email || 'sem email'}) canLogin=${m.canLogin}`);
}

// 2. Mentores na tabela users (role=manager com consultorId)
const [mentoresUsers] = await conn.query('SELECT id, name, email, role, consultorId FROM users WHERE role = ? AND consultorId IS NOT NULL', ['manager']);
console.log('\n=== MENTORES NA TABELA USERS (role=manager + consultorId) ===');
console.log('Total:', mentoresUsers.length);
for (const m of mentoresUsers) {
  console.log(`  id=${m.id} ${m.name} consultorId=${m.consultorId}`);
}

// 3. Contagem por role na tabela users
const [counts] = await conn.query('SELECT role, COUNT(*) as c FROM users GROUP BY role');
console.log('\n=== CONTAGEM USERS POR ROLE ===');
for (const r of counts) {
  console.log(`  ${r.role}: ${r.c}`);
}

// 4. Alunos "Primeiro usuario" que parecem ser de teste
const [primeiros] = await conn.query("SELECT id, name, email FROM users WHERE name LIKE 'Primeiro usu%' ORDER BY id");
console.log('\n=== REGISTROS Primeiro usuario ===');
console.log('Total:', primeiros.length);
for (const u of primeiros) {
  console.log(`  id=${u.id} ${u.name} (${u.email})`);
}

// 5. Verificar como a contagem de mentores é feita na Gestão de Acesso
const [mentorCount] = await conn.query("SELECT COUNT(*) as c FROM users WHERE role = 'manager' AND consultorId IS NOT NULL");
console.log('\n=== CONTAGEM MENTORES (users com consultorId) ===');
console.log('Total:', mentorCount[0].c);

await conn.end();
