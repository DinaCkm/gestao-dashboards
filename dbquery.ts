import { getDb } from './server/db';
import { sql } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) { console.log("No DB"); process.exit(1); }
  
  const counts = await db.execute(sql`
    SELECT 'alunos' as t, COUNT(*) as c FROM alunos
    UNION ALL SELECT 'plano_individual', COUNT(*) FROM plano_individual
    UNION ALL SELECT 'competencias', COUNT(*) FROM competencias
    UNION ALL SELECT 'trilhas', COUNT(*) FROM trilhas
    UNION ALL SELECT 'turmas', COUNT(*) FROM turmas
    UNION ALL SELECT 'events', COUNT(*) FROM events
    UNION ALL SELECT 'event_participation', COUNT(*) FROM event_participation
    UNION ALL SELECT 'ciclos_execucao', COUNT(*) FROM ciclos_execucao
    UNION ALL SELECT 'ciclo_competencias', COUNT(*) FROM ciclo_competencias
    UNION ALL SELECT 'mentoring_sessions', COUNT(*) FROM mentoring_sessions
  `);
  console.log('COUNTS:', JSON.stringify(counts[0]));
  
  const trilhas = await db.execute(sql`SELECT id, name FROM trilhas ORDER BY id`);
  console.log('TRILHAS:', JSON.stringify(trilhas[0]));
  
  const sample = await db.execute(sql`
    SELECT a.id, a.name, a.turmaId, a.trilhaId, a.programId,
      t.name as turmaName, tr.name as trilhaName, p.name as programName
    FROM alunos a
    LEFT JOIN turmas t ON a.turmaId = t.id
    LEFT JOIN trilhas tr ON a.trilhaId = tr.id
    LEFT JOIN programs p ON a.programId = p.id
    LIMIT 5
  `);
  console.log('SAMPLE_ALUNOS:', JSON.stringify(sample[0]));
  
  const plano = await db.execute(sql`
    SELECT pi.alunoId, pi.notaAtual, pi.status, c.nome as compNome, tr.name as trilhaName
    FROM plano_individual pi
    JOIN competencias c ON pi.competenciaId = c.id
    JOIN trilhas tr ON c.trilhaId = tr.id
    LIMIT 10
  `);
  console.log('SAMPLE_PLANO:', JSON.stringify(plano[0]));
  
  const evts = await db.execute(sql`
    SELECT e.title, e.eventDate, e.eventType, ep.alunoId, ep.status
    FROM events e JOIN event_participation ep ON e.id = ep.eventId
    LIMIT 5
  `);
  console.log('SAMPLE_EVENTS:', JSON.stringify(evts[0]));
  
  const ciclos = await db.execute(sql`SELECT * FROM ciclos_execucao LIMIT 5`);
  console.log('SAMPLE_CICLOS:', JSON.stringify(ciclos[0]));
  
  // Check how many alunos have trilhaId set
  const trilhaStats = await db.execute(sql`
    SELECT COUNT(*) as total, SUM(CASE WHEN trilhaId IS NOT NULL THEN 1 ELSE 0 END) as comTrilha
    FROM alunos
  `);
  console.log('TRILHA_STATS:', JSON.stringify(trilhaStats[0]));
  
  process.exit(0);
}
main();
