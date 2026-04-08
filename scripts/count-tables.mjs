import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;
const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

const tables = ['users','programs','consultors','turmas','trilhas','competencias','plano_individual','alunos','mentoring_sessions','events','event_participation','upload_batches','uploaded_files','dashboard_metrics','reports','departments','calculation_formulas','processed_data'];

for (const t of tables) {
  try {
    const [rows] = await connection.execute('SELECT COUNT(*) as c FROM ' + t);
    console.log(`${t}: ${rows[0].c}`);
  } catch(e) {
    console.log(`${t}: ERROR - ${e.message}`);
  }
}

await connection.end();
