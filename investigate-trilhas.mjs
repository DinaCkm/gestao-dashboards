import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL + '&ssl={"rejectUnauthorized":true}');
  
  // 1. List all trilhas
  const [trilhas] = await conn.execute("SELECT id, name FROM trilhas ORDER BY id");
  console.log('\n=== Trilhas ===');
  console.table(trilhas);
  
  // 2. For each trilha, count PDIs and check competencias
  for (const t of trilhas) {
    const [pdis] = await conn.execute("SELECT COUNT(*) as cnt FROM assessment_pdi WHERE trilhaId = ?", [t.id]);
    const [comps] = await conn.execute(
      `SELECT DISTINCT c.id, c.nome 
       FROM assessment_competencias ac
       JOIN assessment_pdi ap ON ap.id = ac.assessmentPdiId
       JOIN competencias c ON c.id = ac.competenciaId
       WHERE ap.trilhaId = ?
       ORDER BY c.nome`, [t.id]
    );
    console.log(`\nTrilha ${t.id} "${t.name}" - ${pdis[0].cnt} PDIs, ${comps.length} competências distintas:`);
    for (const c of comps) {
      console.log(`  ${c.id}: ${c.nome}`);
    }
  }
  
  // 3. Check student_performance - what trilha suffixes exist
  const [spTrilhas] = await conn.execute(
    `SELECT DISTINCT SUBSTRING_INDEX(competenciaName, ' - ', -1) as trilhaSuffix, COUNT(*) as cnt
     FROM student_performance
     WHERE competenciaName LIKE '% - %'
     GROUP BY trilhaSuffix
     ORDER BY cnt DESC`
  );
  console.log('\n=== Student Performance - Trilha Suffixes ===');
  console.table(spTrilhas);
  
  // 4. The key question: for PDIs in trilha 4 (Visão de Futuro), 
  // the assessment_competencias have names like "Adaptabilidade Dinâmica", "Arquitetura de Mudanças"
  // But student_performance has "Adaptabilidade Dinâmica - Visão de Futuro"
  // The baseName extraction should work! Let me check why it doesn't for some
  
  // Check: which competencia names in assessment DON'T have a matching baseName in student_performance
  const [allAssessComps] = await conn.execute(
    `SELECT DISTINCT c.nome
     FROM assessment_competencias ac
     JOIN competencias c ON c.id = ac.competenciaId
     ORDER BY c.nome`
  );
  
  const [allSpNames] = await conn.execute(
    `SELECT DISTINCT SUBSTRING_INDEX(competenciaName, ' - ', 1) as baseName
     FROM student_performance
     ORDER BY baseName`
  );
  
  const spBaseNames = new Set(allSpNames.map(r => r.baseName.toLowerCase()));
  
  console.log('\n=== Competências do Assessment sem match no Student Performance ===');
  for (const ac of allAssessComps) {
    if (!spBaseNames.has(ac.nome.toLowerCase())) {
      console.log(`  ❌ "${ac.nome}" - sem match`);
    }
  }
  
  console.log('\n=== Competências do Student Performance sem match no Assessment ===');
  const assessNames = new Set(allAssessComps.map(r => r.nome.toLowerCase()));
  for (const sp of allSpNames) {
    if (!assessNames.has(sp.baseName.toLowerCase())) {
      console.log(`  ❌ "${sp.baseName}" - sem match`);
    }
  }
  
  await conn.end();
}

main().catch(console.error);
