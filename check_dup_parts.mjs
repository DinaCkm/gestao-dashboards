import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Verificar se há alunos com mais de 1 participação no evento 30014
const [dupParts] = await conn.query(`
  SELECT alunoId, COUNT(*) as cnt, GROUP_CONCAT(id) as partIds, GROUP_CONCAT(status) as statuses
  FROM event_participation 
  WHERE eventId = 30014
  GROUP BY alunoId
  HAVING COUNT(*) > 1
  ORDER BY cnt DESC
`);

console.log('=== PARTICIPAÇÕES DUPLICADAS NO EVENTO 30014 ===');
console.log(`Alunos com mais de 1 participação: ${dupParts.length}`);

if (dupParts.length > 0) {
  for (const d of dupParts) {
    console.log(`  Aluno ${d.alunoId}: ${d.cnt} participações (IDs: ${d.partIds}) (Status: ${d.statuses})`);
  }
  
  // Total de participações duplicadas a remover
  const totalDups = dupParts.reduce((s, d) => s + d.cnt - 1, 0);
  console.log(`\nTotal de participações duplicadas a remover: ${totalDups}`);
  console.log(`Participações após limpeza: ${99 - totalDups}`);
} else {
  console.log('Nenhuma duplicata encontrada. Todos os 99 registros são de alunos únicos.');
}

// Verificar total de alunos únicos
const [uniqueAlunos] = await conn.query(`
  SELECT COUNT(DISTINCT alunoId) as cnt FROM event_participation WHERE eventId = 30014
`);
console.log(`\nAlunos únicos no evento 30014: ${uniqueAlunos[0].cnt}`);
console.log(`Total de registros: 99`);

await conn.end();
