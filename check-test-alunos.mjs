import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Verificar alunos com padrão de teste
const [testAlunos] = await conn.query(
  `SELECT id, name, email, role FROM users 
   WHERE role = 'user' AND (
     name LIKE 'Test %' 
     OR name LIKE 'Primeiro usu%' 
     OR email LIKE '%.test.%@example.com' 
     OR email LIKE 'primeiro.%@exemplo.com'
     OR email LIKE '%test%'
   )
   ORDER BY id`
);

console.log('=== ALUNOS COM PADRÃO DE TESTE ===');
console.log('Total:', testAlunos.length);
for (const u of testAlunos) {
  console.log(`  id=${u.id} ${u.name} (${u.email})`);
}

// Verificar total de alunos
const [total] = await conn.query(`SELECT COUNT(*) as count FROM users WHERE role = 'user'`);
console.log('\nTotal de alunos:', total[0].count);

// Verificar se há alunos "Primeiro usuário" que são de teste
const [primeiros] = await conn.query(
  `SELECT id, name, email FROM users WHERE name LIKE 'Primeiro usu%' ORDER BY id`
);
console.log('\n=== REGISTROS "Primeiro usuário" ===');
console.log('Total:', primeiros.length);
for (const u of primeiros) {
  console.log(`  id=${u.id} ${u.name} (${u.email})`);
}

await conn.end();
