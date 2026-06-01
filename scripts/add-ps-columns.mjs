import { createConnection } from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL não definida');
  process.exit(1);
}

const conn = await createConnection(url);

try {
  await conn.execute('ALTER TABLE processos_seletivos ADD COLUMN IF NOT EXISTS data_fim DATE NULL COMMENT "Data de encerramento do processo"');
  console.log('✅ Coluna data_fim adicionada');
} catch (e) {
  console.log('data_fim:', e.message);
}

try {
  await conn.execute('ALTER TABLE processos_seletivos ADD COLUMN IF NOT EXISTS emails_relatorio TEXT NULL COMMENT "E-mails separados por vírgula para relatório diário"');
  console.log('✅ Coluna emails_relatorio adicionada');
} catch (e) {
  console.log('emails_relatorio:', e.message);
}

const [rows] = await conn.execute('SHOW COLUMNS FROM processos_seletivos');
console.log('\nEstrutura atual:');
rows.forEach(r => console.log(' -', r.Field, r.Type, r.Null));

await conn.end();
