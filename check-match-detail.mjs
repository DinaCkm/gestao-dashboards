import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL + '&ssl={"rejectUnauthorized":true}');
  
  // For Bruno Henrique (30056), check the 5 unmatched competencias
  const unmatched = ['Decisões Ágeis', 'Mentalidade Sistêmica', 'Adaptabilidade Dinâmica', 'Gestão da Comunicação', 'Inteligência Emocional Tática'];
  
  for (const name of unmatched) {
    const [results] = await conn.execute(
      `SELECT competenciaName, progressoTotal 
       FROM student_performance 
       WHERE alunoId = 30056 
       AND competenciaName LIKE ?`,
      [`%${name}%`]
    );
    console.log(`\n"${name}" matches in student_performance:`);
    if (results.length > 0) {
      for (const r of results) {
        console.log(`  → "${r.competenciaName}" = ${r.progressoTotal}%`);
        // Check matching logic
        const baseName = r.competenciaName.split(' - ')[0].trim().toLowerCase();
        const assessName = name.toLowerCase();
        console.log(`    baseName: "${baseName}" vs assessName: "${assessName}"`);
        console.log(`    baseName === assessName: ${baseName === assessName}`);
        console.log(`    fullName includes assessName: ${r.competenciaName.toLowerCase().includes(assessName)}`);
        console.log(`    assessName includes baseName: ${assessName.includes(baseName)}`);
      }
    } else {
      console.log('  → NO DATA in student_performance');
    }
  }
  
  await conn.end();
}

main().catch(console.error);
