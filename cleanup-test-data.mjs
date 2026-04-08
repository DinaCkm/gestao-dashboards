import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 1. Identificar registros de teste na tabela users
const [testUsers] = await conn.query(
  `SELECT id, name, email, role FROM users 
   WHERE name LIKE 'Test %' 
   OR name LIKE 'Primeiro usu%' 
   OR email LIKE '%.test.%@example.com' 
   OR email LIKE 'primeiro.%@exemplo.com'
   ORDER BY role, id`
);

console.log('=== REGISTROS DE TESTE NA TABELA USERS ===');
console.log('Total:', testUsers.length);

const byRole = {};
for (const u of testUsers) {
  if (!byRole[u.role]) byRole[u.role] = [];
  byRole[u.role].push(u);
}
for (const [role, users] of Object.entries(byRole)) {
  console.log(`${role}: ${users.length} registros`);
  for (const u of users) {
    console.log(`  id=${u.id} ${u.name} (${u.email})`);
  }
}

const testUserIds = testUsers.map(u => u.id);

if (testUserIds.length === 0) {
  console.log('\nNenhum registro de teste encontrado. Banco limpo!');
  await conn.end();
  process.exit(0);
}

// 2. Deletar registros de teste
console.log(`\n=== DELETANDO ${testUserIds.length} REGISTROS DE TESTE ===`);
const [result] = await conn.query(
  `DELETE FROM users WHERE id IN (${testUserIds.join(',')})`
);
console.log(`Deletados: ${result.affectedRows} registros da tabela users`);

// 3. Verificar contagem final
const [finalCount] = await conn.query(
  `SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role`
);
console.log('\n=== CONTAGEM FINAL POR ROLE ===');
for (const row of finalCount) {
  console.log(`${row.role}: ${row.count}`);
}

await conn.end();
console.log('\nLimpeza concluída com sucesso!');
