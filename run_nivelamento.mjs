// Executa o nivelamento_producao.sql usando a conexão do próprio app (DATABASE_URL)
import fs from 'fs';
import mysql from 'mysql2/promise';

const sql = fs.readFileSync(new URL('./nivelamento_producao.sql', import.meta.url), 'utf8');
const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL, multipleStatements: true });
console.log('Conectado. Executando nivelamento...');
try {
  await conn.query(sql);
  console.log('✅ NIVELAMENTO CONCLUÍDO SEM ERROS');
  const [cols] = await conn.query(
    "SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='disc_org_profiles' AND COLUMN_NAME IN ('origemPerfil','statusConsistencia','totalRespondentes')");
  console.log('Colunas críticas presentes em disc_org_profiles:', cols[0].n, '/ 3');
} catch (e) {
  console.error('❌ ERRO:', e.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
