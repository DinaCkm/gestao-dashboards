import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL + '&ssl={"rejectUnauthorized":true}');
  
  // 1. Find Bruno
  const [brunos] = await conn.execute("SELECT id, name, email, programId, turmaId, consultorId FROM alunos WHERE name LIKE '%Bruno%'");
  console.log('\n=== Alunos Bruno ===');
  console.table(brunos);
  
  if (brunos.length === 0) {
    console.log('No Bruno found');
    await conn.end();
    return;
  }
  
  // 2. Check assessment_pdi for each Bruno
  for (const bruno of brunos) {
    console.log(`\n=== Assessment PDI for ${bruno.name} (ID: ${bruno.id}) ===`);
    const [pdis] = await conn.execute("SELECT id, alunoId, trilhaId, turmaId, status, macroInicio, macroTermino FROM assessment_pdi WHERE alunoId = ?", [bruno.id]);
    console.table(pdis);
    
    if (pdis.length > 0) {
      // 3. Check assessment_competencias
      for (const pdi of pdis) {
        console.log(`\n--- Competencias for PDI ${pdi.id} (trilha ${pdi.trilhaId}) ---`);
        const [comps] = await conn.execute(
          "SELECT ac.id, ac.competenciaId, ac.nivelAtual, ac.metaFinal, ac.metaCiclo1, ac.metaCiclo2, ac.notaCorte, ac.peso, c.nome as compNome FROM assessment_competencias ac LEFT JOIN competencias c ON c.id = ac.competenciaId WHERE ac.assessmentPdiId = ?",
          [pdi.id]
        );
        console.table(comps);
      }
      
      // 4. Check student_performance
      console.log(`\n--- Student Performance for ${bruno.name} ---`);
      const [perfs] = await conn.execute(
        "SELECT id, competenciaId, competenciaName, progressoTotal, aulasDisponiveis, aulasConcluidas FROM student_performance WHERE alunoId = ?",
        [bruno.id]
      );
      console.table(perfs);
      
      // 5. Check plano_individual
      console.log(`\n--- Plano Individual for ${bruno.name} ---`);
      const [planos] = await conn.execute(
        "SELECT id, competenciaId, notaAtual FROM plano_individual WHERE alunoId = ?",
        [bruno.id]
      );
      console.table(planos);
    }
  }
  
  // 6. Check a sample of assessment_competencias to see if nivelAtual/metaFinal are generally populated
  console.log('\n=== Sample: assessment_competencias with nivelAtual/metaFinal values ===');
  const [sampleWithValues] = await conn.execute(
    "SELECT ac.id, ac.assessmentPdiId, ac.competenciaId, ac.nivelAtual, ac.metaFinal, c.nome FROM assessment_competencias ac LEFT JOIN competencias c ON c.id = ac.competenciaId WHERE ac.nivelAtual IS NOT NULL AND ac.nivelAtual != '' LIMIT 10"
  );
  console.table(sampleWithValues);
  
  console.log('\n=== Count: assessment_competencias with NULL nivelAtual ===');
  const [countNull] = await conn.execute(
    "SELECT COUNT(*) as total, SUM(CASE WHEN nivelAtual IS NULL OR nivelAtual = '' THEN 1 ELSE 0 END) as nullNivel, SUM(CASE WHEN metaFinal IS NULL OR metaFinal = '' THEN 1 ELSE 0 END) as nullMeta FROM assessment_competencias"
  );
  console.table(countNull);
  
  await conn.end();
}

main().catch(console.error);
