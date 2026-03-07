import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const conn = await createConnection(process.env.DATABASE_URL);

const JOSEANE_ID = 30066;
const JOSEANE_EXT = '667285';

// 1. Buscar ciclos (competências do assessment_pdi)
const [comps] = await conn.execute(
  `SELECT ac.competenciaId, ac.microInicio, ac.microTermino, c.nome
   FROM assessment_competencias ac
   JOIN competencias c ON c.id = ac.competenciaId
   JOIN assessment_pdi ap ON ap.id = ac.assessmentPdiId
   WHERE ap.alunoId = ? AND ap.status = 'ativo'
   ORDER BY ac.microInicio`,
  [JOSEANE_ID]
);

const hoje = new Date('2026-03-07');

// 2. Buscar student_performance
const [perfRows] = await conn.execute(
  `SELECT competenciaId, progressoTotal, mediaAvaliacoesRespondidas, avaliacoesRespondidas, avaliacoesDisponiveis
   FROM student_performance WHERE alunoId = ?`,
  [JOSEANE_ID]
);
const perfMap = new Map(perfRows.map(p => [p.competenciaId, p]));

// 3. Buscar mentoring_sessions
const [sessRows] = await conn.execute(
  `SHOW COLUMNS FROM mentoring_sessions`
);
console.log('Colunas mentoring_sessions:', sessRows.map(c => c.Field).join(', '));

const [sessions] = await conn.execute(
  `SELECT * FROM mentoring_sessions WHERE alunoId = ?`,
  [JOSEANE_ID]
);
console.log(`\nSessões de mentoria: ${sessions.length}`);
if (sessions.length > 0) {
  console.log('Exemplo:', sessions[0]);
}

// 4. Buscar event_participation
const [evtCols] = await conn.execute(`SHOW COLUMNS FROM event_participation`);
console.log('\nColunas event_participation:', evtCols.map(c => c.Field).join(', '));

const [events] = await conn.execute(
  `SELECT ep.* FROM event_participation ep WHERE ep.alunoId = ?`,
  [JOSEANE_ID]
);
console.log(`Eventos: ${events.length}`);

// 5. Buscar plano_individual (tarefas)
const [piCols] = await conn.execute(`SHOW COLUMNS FROM plano_individual`);
console.log('\nColunas plano_individual:', piCols.map(c => c.Field).join(', '));

const [planoItems] = await conn.execute(
  `SELECT * FROM plano_individual WHERE alunoId = ?`,
  [JOSEANE_ID]
);
console.log(`Plano Individual items: ${planoItems.length}`);

// 6. Simular cálculo por ciclo
console.log('\n=== SIMULAÇÃO POR CICLO ===');
const ciclosFinalizados = [];

for (const comp of comps) {
  const inicio = new Date(comp.microInicio);
  const termino = new Date(comp.microTermino);
  const status = termino < hoje ? 'finalizado' : (inicio <= hoje ? 'em_andamento' : 'futuro');
  
  const perf = perfMap.get(comp.competenciaId);
  
  // Ind.3 Competências = progressoTotal
  const ind3 = perf ? Number(perf.progressoTotal) : 0;
  
  // Ind.2 Avaliações = mediaAvaliacoesRespondidas
  const ind2 = perf ? Number(perf.mediaAvaliacoesRespondidas) : 0;
  
  console.log(`\n${comp.nome} [${status}]:`);
  console.log(`  Ind.3 Competências (progresso): ${ind3}%`);
  console.log(`  Ind.2 Avaliações (média): ${ind2}%`);
  
  if (status === 'finalizado') {
    ciclosFinalizados.push({
      nome: comp.nome,
      ind3,
      ind2,
    });
  }
}

// Calcular médias consolidadas dos ciclos finalizados
if (ciclosFinalizados.length > 0) {
  console.log(`\n=== CONSOLIDADO (${ciclosFinalizados.length} ciclos finalizados) ===`);
  const avgInd2 = ciclosFinalizados.reduce((s, c) => s + c.ind2, 0) / ciclosFinalizados.length;
  const avgInd3 = ciclosFinalizados.reduce((s, c) => s + c.ind3, 0) / ciclosFinalizados.length;
  console.log(`Média Ind.2 Avaliações: ${avgInd2.toFixed(1)}%`);
  console.log(`Média Ind.3 Competências: ${avgInd3.toFixed(1)}%`);
}

await conn.end();
