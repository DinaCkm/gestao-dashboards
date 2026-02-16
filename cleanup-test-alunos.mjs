import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 1. Identificar registros de teste na tabela users (padrão "Primeiro usuário" e "First User" e "Second User")
const [testUsers] = await conn.query(
  `SELECT id, name, email, role, loginMethod FROM users 
   WHERE name LIKE 'Primeiro usu%' 
   OR name LIKE 'First User %'
   OR name LIKE 'Second User %'
   OR email LIKE 'primeiro.%@exemplo.com'
   OR email LIKE 'first.%@example.com'
   OR email LIKE 'second.%@example.com'
   ORDER BY id`
);

console.log('=== REGISTROS DE TESTE ENCONTRADOS ===');
console.log('Total:', testUsers.length);
for (const u of testUsers) {
  console.log(`  id=${u.id} ${u.name} (${u.email}) role=${u.role} login=${u.loginMethod}`);
}

if (testUsers.length === 0) {
  console.log('\nNenhum registro de teste encontrado. Banco limpo!');
  await conn.end();
  process.exit(0);
}

const testUserIds = testUsers.map(u => u.id);

// 2. Deletar registros de teste
console.log(`\n=== DELETANDO ${testUserIds.length} REGISTROS DE TESTE ===`);
const [result] = await conn.query(
  `DELETE FROM users WHERE id IN (${testUserIds.join(',')})`
);
console.log(`Deletados: ${result.affectedRows} registros`);

// 3. Contagem final
const [finalCount] = await conn.query(
  `SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role`
);
console.log('\n=== CONTAGEM FINAL POR ROLE ===');
for (const row of finalCount) {
  console.log(`  ${row.role}: ${row.count}`);
}

const [totalUsers] = await conn.query('SELECT COUNT(*) as c FROM users');
console.log(`\nTotal geral: ${totalUsers[0].c}`);

await conn.end();
console.log('\nLimpeza concluída com sucesso!');
