import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load env
const dotenv = require('dotenv');
dotenv.config();

// Use the db module directly
const { getCompetenciasObrigatoriasAluno, getStudentPerformanceAsRecords, getAllCiclosFromAssessments } = require('../server/db.ts');

async function main() {
  const alunoId = 30038; // Etienne
  
  console.log('=== Competências Obrigatórias ===');
  const comps = await getCompetenciasObrigatoriasAluno(alunoId);
  console.log(`Total: ${comps.length}`);
  comps.forEach(c => console.log(`  - ${c.competenciaId}: ${c.nome} (peso: ${c.peso}, micro: ${c.microInicio} -> ${c.microTermino})`));
  
  console.log('\n=== Student Performance Records ===');
  const perf = await getStudentPerformanceAsRecords(alunoId);
  console.log(`Total: ${perf.length}`);
  perf.forEach(p => console.log(`  - ${p.competencia}: aulas=${p.aulasConcluidas}/${p.aulasDisponiveis}, nota=${p.mediaRespondidas}`));
  
  console.log('\n=== Ciclos from Assessments ===');
  const ciclos = await getAllCiclosFromAssessments(alunoId);
  console.log(`Total: ${ciclos.length}`);
  ciclos.forEach(c => console.log(`  - ${c.inicio} -> ${c.termino}: ${c.competencias.length} comps, status: ${c.status}`));
}

main().catch(console.error);
