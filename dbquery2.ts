import { getDb } from './server/db';
import { sql } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) { console.log("No DB"); process.exit(1); }
  
  const ep = await db.execute(sql`
    SELECT ep.id, ep.eventId, ep.alunoId, ep.status, ep.batchId
    FROM event_participation ep LIMIT 5
  `);
  console.log('EP:', JSON.stringify(ep[0]));
  
  const evCount = await db.execute(sql`SELECT COUNT(*) as c FROM events`);
  console.log('EVENTS_COUNT:', JSON.stringify(evCount[0]));
  
  const turmaNames = await db.execute(sql`SELECT id, name, programId FROM turmas ORDER BY id`);
  console.log('TURMAS:', JSON.stringify(turmaNames[0]));
  
  const trilhaDistrib = await db.execute(sql`
    SELECT tr.name as trilhaName, COUNT(*) as total, 
      SUM(CASE WHEN pi.status = 'concluida' THEN 1 ELSE 0 END) as concluidas,
      AVG(CAST(pi.notaAtual AS DECIMAL(5,2))) as mediaNotas
    FROM plano_individual pi
    JOIN competencias c ON pi.competenciaId = c.id
    JOIN trilhas tr ON c.trilhaId = tr.id
    GROUP BY tr.name
  `);
  console.log('TRILHA_DISTRIB:', JSON.stringify(trilhaDistrib[0]));
  
  // Check how many alunos per trilha (from plano_individual)
  const alunosTrilha = await db.execute(sql`
    SELECT tr.name as trilhaName, COUNT(DISTINCT pi.alunoId) as numAlunos
    FROM plano_individual pi
    JOIN competencias c ON pi.competenciaId = c.id
    JOIN trilhas tr ON c.trilhaId = tr.id
    GROUP BY tr.name
  `);
  console.log('ALUNOS_POR_TRILHA:', JSON.stringify(alunosTrilha[0]));
  
  process.exit(0);
}
main();
