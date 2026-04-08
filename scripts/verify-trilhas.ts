import { createConnection } from 'mysql2/promise';

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL!);
  const [rows] = await conn.execute('SELECT id, name, codigo, ordem FROM trilhas ORDER BY ordem') as any;
  console.log("=== 5 TRILHAS (JORNADAS) DO SISTEMA ===");
  for (const r of rows) {
    console.log(`  ID: ${r.id} | Nome: ${r.name} | Codigo: ${r.codigo} | Ordem: ${r.ordem}`);
  }
  await conn.end();
}

main().catch(e => console.error(e.message));
