import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Par 1: 30019 (64 participações originais) e 30026 (participações de outra planilha)
// Par 2: 30020 (64 participações originais) e 30027 (participações de outra planilha)
// Precisamos decidir qual manter - vamos verificar quantas participações cada um tem

const pairs = [
  { ids: [30019, 30026], date: '2026-01-21', desc: 'Código de Aprendizagem - O Preparo' },
  { ids: [30020, 30027], date: '2026-01-28', desc: 'Código de Aprendizagem - A Execução' },
];

for (const pair of pairs) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`PAR: ${pair.desc} (${pair.date})`);
  console.log('='.repeat(70));
  
  for (const id of pair.ids) {
    const [evt] = await conn.query('SELECT id, title FROM events WHERE id = ?', [id]);
    const [parts] = await conn.query('SELECT COUNT(*) as cnt FROM event_participation WHERE eventId = ?', [id]);
    console.log(`  ID ${id}: ${parts[0].cnt} participações | ${evt[0]?.title?.substring(0, 70)}`);
  }
  
  // Verificar sobreposição de alunos
  const [p1] = await conn.query('SELECT alunoId FROM event_participation WHERE eventId = ?', [pair.ids[0]]);
  const [p2] = await conn.query('SELECT alunoId FROM event_participation WHERE eventId = ?', [pair.ids[1]]);
  const set1 = new Set(p1.map(p => p.alunoId));
  const set2 = new Set(p2.map(p => p.alunoId));
  
  let overlap = 0;
  let onlyIn1 = 0;
  let onlyIn2 = 0;
  for (const id of set1) { if (set2.has(id)) overlap++; else onlyIn1++; }
  for (const id of set2) { if (!set1.has(id)) onlyIn2++; }
  
  console.log(`  Sobreposição: ${overlap} alunos em ambos`);
  console.log(`  Apenas no ID ${pair.ids[0]}: ${onlyIn1}`);
  console.log(`  Apenas no ID ${pair.ids[1]}: ${onlyIn2}`);
  
  // Manter o que tem mais participações
  const keptId = p1.length >= p2.length ? pair.ids[0] : pair.ids[1];
  const removedId = keptId === pair.ids[0] ? pair.ids[1] : pair.ids[0];
  
  console.log(`\n  >>> Mantendo ID ${keptId}, removendo ID ${removedId}`);
  
  // Mover participações do removido para o mantido
  const keptSet = keptId === pair.ids[0] ? set1 : set2;
  const [removedParts] = await conn.query(
    'SELECT id, alunoId, status FROM event_participation WHERE eventId = ?', [removedId]
  );
  
  let moved = 0;
  let deleted = 0;
  for (const part of removedParts) {
    if (keptSet.has(part.alunoId)) {
      await conn.query('DELETE FROM event_participation WHERE id = ?', [part.id]);
      deleted++;
    } else {
      await conn.query('UPDATE event_participation SET eventId = ? WHERE id = ?', [keptId, part.id]);
      keptSet.add(part.alunoId);
      moved++;
    }
  }
  
  console.log(`  Participações movidas: ${moved}`);
  console.log(`  Participações duplicadas deletadas: ${deleted}`);
  
  // Deletar evento duplicado
  const [remaining] = await conn.query(
    'SELECT COUNT(*) as cnt FROM event_participation WHERE eventId = ?', [removedId]
  );
  if (remaining[0].cnt === 0) {
    await conn.query('DELETE FROM events WHERE id = ?', [removedId]);
    console.log(`  Evento ID ${removedId} deletado.`);
  } else {
    console.log(`  AVISO: Evento ${removedId} ainda tem ${remaining[0].cnt} participações!`);
  }
}

// Verificação final
console.log('\n' + '='.repeat(70));
console.log('VERIFICAÇÃO FINAL');
console.log('='.repeat(70));
const [totalEvents] = await conn.query('SELECT COUNT(*) as cnt FROM events');
console.log(`Total de eventos na tabela: ${totalEvents[0].cnt}`);

// Verificar Ruama
const [ruamaParts] = await conn.query(
  `SELECT ep.eventId, ep.status, e.title, e.eventDate 
   FROM event_participation ep 
   JOIN events e ON ep.eventId = e.id 
   WHERE ep.alunoId = 30009 
   ORDER BY e.eventDate`
);
const presentes = ruamaParts.filter(p => p.status === 'presente').length;
console.log(`\nRuama: ${ruamaParts.length} participações, ${presentes} presenças`);

// Eventos sem participação da Ruama
const [allEvts] = await conn.query('SELECT id, title, eventDate FROM events ORDER BY eventDate');
const ruamaEventIds = new Set(ruamaParts.map(p => p.eventId));
const semPart = allEvts.filter(e => !ruamaEventIds.has(e.id));
console.log(`Eventos sem participação da Ruama: ${semPart.length}`);
for (const e of semPart) {
  console.log(`  - ID ${e.id} | ${new Date(e.eventDate).toISOString().split('T')[0]} | ${e.title?.substring(0, 60)}`);
}

await conn.end();
