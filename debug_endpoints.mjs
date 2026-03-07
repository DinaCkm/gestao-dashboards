import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const conn = await createConnection(process.env.DATABASE_URL);

// Encontrar Joseane
const [alunos] = await conn.execute(
  `SELECT id, name, externalId, programId, turmaId, consultorId FROM alunos WHERE name LIKE '%Joseane%'`
);
const joseane = alunos[0];
console.log('=== JOSEANE ===');
console.log(joseane);

// Buscar assessment_pdi da Joseane
const [pdis] = await conn.execute(
  `SELECT id, alunoId, trilhaId, status, macroInicio, macroTermino FROM assessment_pdi WHERE alunoId = ?`,
  [joseane.id]
);
console.log('\n=== PDIs ===');
console.log(pdis);

// Buscar competências do assessment
for (const pdi of pdis) {
  const [comps] = await conn.execute(
    `SELECT ac.id, ac.assessmentPdiId, ac.competenciaId, ac.peso, ac.microInicio, ac.microTermino, c.nome
     FROM assessment_competencias ac
     JOIN competencias c ON c.id = ac.competenciaId
     WHERE ac.assessmentPdiId = ?
     ORDER BY ac.microInicio`,
    [pdi.id]
  );
  console.log(`\n=== Competências PDI ${pdi.id} (${comps.length} comps) ===`);
  
  const hoje = new Date('2026-03-07');
  let ciclosFinalizados = 0;
  let ciclosEmAndamento = 0;
  
  for (const comp of comps) {
    const inicio = new Date(comp.microInicio);
    const termino = new Date(comp.microTermino);
    const status = termino < hoje ? 'finalizado' : (inicio <= hoje ? 'em_andamento' : 'futuro');
    if (status === 'finalizado') ciclosFinalizados++;
    if (status === 'em_andamento') ciclosEmAndamento++;
    console.log(`  ${comp.nome}: ${comp.microInicio} → ${comp.microTermino} [${status}]`);
  }
  console.log(`  Finalizados: ${ciclosFinalizados}, Em andamento: ${ciclosEmAndamento}`);
}

// Buscar student_performance
const [perf] = await conn.execute(
  `SELECT * FROM student_performance WHERE alunoId = ?`,
  [joseane.id]
);
console.log(`\n=== Student Performance (${perf.length} registros) ===`);
if (perf.length > 0) {
  console.log('Colunas:', Object.keys(perf[0]).join(', '));
  // Mostrar últimos 3
  for (const p of perf.slice(-3)) {
    console.log(p);
  }
}

// Buscar mentoring sessions
const [sessions] = await conn.execute(
  `SELECT id, alunoId, dataSessao, notaEngajamento FROM mentoring_sessions WHERE alunoId = ?`,
  [joseane.id]
);
console.log(`\n=== Sessões de Mentoria (${sessions.length}) ===`);
for (const s of sessions) {
  console.log(`  ${s.dataSessao} - Nota: ${s.notaEngajamento}`);
}

// Buscar event participations
const [events] = await conn.execute(
  `SELECT ep.*, e.nome as eventoNome, e.data as eventoData
   FROM event_participation ep
   JOIN events e ON e.id = ep.eventId
   WHERE ep.alunoId = ?`,
  [joseane.id]
);
console.log(`\n=== Participação em Eventos (${events.length}) ===`);

await conn.end();
