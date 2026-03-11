import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [ruama] = await conn.query("SELECT id, name FROM alunos WHERE name LIKE '%Ruama%'");
console.log('Ruama:', ruama[0]);

const [parts] = await conn.query(
  'SELECT ep.eventId, ep.status, e.title, e.eventDate FROM event_participation ep JOIN events e ON ep.eventId = e.id WHERE ep.alunoId = ? ORDER BY e.eventDate',
  [ruama[0].id]
);
console.log('Total participações:', parts.length);
const presentes = parts.filter(p => p.status === 'presente').length;
const ausentes = parts.filter(p => p.status === 'ausente').length;
console.log('Presenças:', presentes);
console.log('Ausências:', ausentes);

// Verificar macrociclo
const [macros] = await conn.query(
  "SELECT id, macroInicio FROM assessment_pdi WHERE alunoId = ? ORDER BY macroInicio",
  [ruama[0].id]
);
console.log('Macrociclos:', macros.map(m => ({ id: m.id, inicio: new Date(m.macroInicio).toISOString().split('T')[0] })));

const macroInicio = macros.length > 0 ? new Date(macros[0].macroInicio) : null;
console.log('MacroInicio:', macroInicio ? macroInicio.toISOString().split('T')[0] : 'N/A');

// Participações dentro do macrociclo
if (macroInicio) {
  const dentroMacro = parts.filter(p => new Date(p.eventDate) >= macroInicio);
  const foraMacro = parts.filter(p => new Date(p.eventDate) < macroInicio);
  console.log('\nDentro do macrociclo:', dentroMacro.length, '(presenças:', dentroMacro.filter(p => p.status === 'presente').length, ')');
  console.log('Fora do macrociclo:', foraMacro.length);
}

// Todos os eventos e quais a Ruama não tem participação
const [allEvents] = await conn.query('SELECT id, title, eventDate FROM events ORDER BY eventDate');
const partEventIds = new Set(parts.map(p => p.eventId));
const semPart = allEvents.filter(e => {
  return !partEventIds.has(e.id);
});
console.log('\nEventos SEM participação da Ruama:', semPart.length);
for (const e of semPart) {
  const d = e.eventDate ? new Date(e.eventDate).toISOString().split('T')[0] : 'null';
  const dentroMacro = macroInicio && e.eventDate ? new Date(e.eventDate) >= macroInicio : false;
  console.log(`  - ID ${e.id} | ${d} | ${dentroMacro ? 'DENTRO macrociclo' : 'FORA macrociclo'} | ${e.title?.substring(0, 60)}`);
}

await conn.end();
