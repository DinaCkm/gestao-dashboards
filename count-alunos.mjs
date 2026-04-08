import 'dotenv/config';
import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
const conn = await mysql.createConnection(url);

const [rows1] = await conn.execute('SELECT COUNT(*) as total FROM alunos');
console.log('Total alunos:', rows1[0].total);

const [rows2] = await conn.execute('SELECT COUNT(DISTINCT externalId) as unicos FROM alunos');
console.log('Alunos unicos (externalId):', rows2[0].unicos);

const [rows3] = await conn.execute('SELECT programa_id, COUNT(*) as qtd FROM alunos GROUP BY programa_id');
console.log('Por programa:', JSON.stringify(rows3));

const [rows4] = await conn.execute('SELECT ativo, COUNT(*) as qtd FROM alunos GROUP BY ativo');
console.log('Por status ativo:', JSON.stringify(rows4));

const [rows5] = await conn.execute('SELECT programa_id, nome FROM programas');
console.log('Programas:', JSON.stringify(rows5));

await conn.end();
