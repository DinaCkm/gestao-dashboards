import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Eventos 30019 e 30020 - verificar detalhes
const [evts] = await conn.query('SELECT id, title, eventDate FROM events WHERE id IN (30019, 30020)');
console.log('=== EVENTOS SEM PARTICIPAÇÃO DA RUAMA ===');
for (const e of evts) {
  console.log(`ID ${e.id}: ${e.title} | ${new Date(e.eventDate).toISOString().split('T')[0]}`);
}

// Verificar se existem outros eventos na mesma data com título similar
console.log('\n=== TODOS OS EVENTOS NAS DATAS 2026-01-21 e 2026-01-28 ===');
const [sameDateEvts] = await conn.query(
  "SELECT id, title, eventDate FROM events WHERE eventDate IN ('2026-01-21', '2026-01-28') ORDER BY eventDate, id"
);
for (const e of sameDateEvts) {
  console.log(`ID ${e.id}: ${e.title} | ${new Date(e.eventDate).toISOString().split('T')[0]}`);
}

// Verificar participações da Ruama nesses eventos e em eventos da mesma data
const ruamaId = 30009;
console.log('\n=== PARTICIPAÇÕES DA RUAMA EM EVENTOS DE JAN/2026 ===');
const [ruamaParts] = await conn.query(
  `SELECT ep.eventId, ep.status, e.title, e.eventDate 
   FROM event_participation ep 
   JOIN events e ON ep.eventId = e.id 
   WHERE ep.alunoId = ? AND e.eventDate >= '2026-01-01' AND e.eventDate <= '2026-01-31'
   ORDER BY e.eventDate`,
  [ruamaId]
);
for (const p of ruamaParts) {
  console.log(`  Event ${p.eventId}: ${p.status} | ${p.title?.substring(0, 60)} | ${new Date(p.eventDate).toISOString().split('T')[0]}`);
}

// Verificar se 30026 e 30027 ainda existem (eram duplicatas que foram deletadas?)
console.log('\n=== VERIFICAR SE EVENTOS 30026 E 30027 EXISTEM ===');
const [check] = await conn.query('SELECT id, title, eventDate FROM events WHERE id IN (30026, 30027)');
if (check.length === 0) {
  console.log('Eventos 30026 e 30027 NÃO existem na tabela events.');
} else {
  for (const e of check) {
    console.log(`ID ${e.id}: ${e.title} | ${new Date(e.eventDate).toISOString().split('T')[0]}`);
  }
}

// Verificar se a Ruama tem participação nos eventos 30026 e 30027
console.log('\n=== PARTICIPAÇÕES DA RUAMA NOS EVENTOS 30026 E 30027 ===');
const [ruama2627] = await conn.query(
  'SELECT eventId, status FROM event_participation WHERE alunoId = ? AND eventId IN (30026, 30027)',
  [ruamaId]
);
if (ruama2627.length === 0) {
  console.log('Ruama NÃO tem participação nos eventos 30026 e 30027.');
} else {
  for (const p of ruama2627) {
    console.log(`  Event ${p.eventId}: ${p.status}`);
  }
}

// Verificar TODAS as participações da Ruama com título "Código"
console.log('\n=== TODAS AS PARTICIPAÇÕES DA RUAMA COM "CÓDIGO" ===');
const [ruamaCodigo] = await conn.query(
  `SELECT ep.eventId, ep.status, e.title, e.eventDate 
   FROM event_participation ep 
   JOIN events e ON ep.eventId = e.id 
   WHERE ep.alunoId = ? AND e.title LIKE '%C_digo%'
   ORDER BY e.eventDate`,
  [ruamaId]
);
if (ruamaCodigo.length === 0) {
  console.log('Ruama NÃO tem participação em nenhum evento com "Código" no título.');
  
  // Verificar se ela tem participação em eventos com IDs próximos
  console.log('\n=== PARTICIPAÇÕES DA RUAMA EM EVENTOS ID 30019-30027 ===');
  const [ruamaRange] = await conn.query(
    `SELECT ep.eventId, ep.status, e.title, e.eventDate 
     FROM event_participation ep 
     JOIN events e ON ep.eventId = e.id 
     WHERE ep.alunoId = ? AND ep.eventId BETWEEN 30019 AND 30027
     ORDER BY ep.eventId`,
    [ruamaId]
  );
  for (const p of ruamaRange) {
    console.log(`  Event ${p.eventId}: ${p.status} | ${p.title?.substring(0, 60)}`);
  }
} else {
  for (const p of ruamaCodigo) {
    console.log(`  Event ${p.eventId}: ${p.status} | ${p.title?.substring(0, 60)} | ${new Date(p.eventDate).toISOString().split('T')[0]}`);
  }
}

await conn.end();
