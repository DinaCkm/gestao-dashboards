import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const ids = [30035, 30041]; // Brenno e Ilda

// student_performance
try {
  const [results] = await conn.execute(
    `SELECT * FROM student_performance WHERE alunoId IN (${ids.join(',')}) LIMIT 10`
  );
  console.log("=== STUDENT_PERFORMANCE ===");
  console.log(`Total: ${results.length}`);
  for (const r of results) console.log(JSON.stringify(r, null, 2));
} catch(e) { console.log("student_performance:", e.message); }

// assessment_competencias
try {
  const [results] = await conn.execute(
    `SELECT * FROM assessment_competencias WHERE alunoId IN (${ids.join(',')}) LIMIT 10`
  );
  console.log("\n=== ASSESSMENT_COMPETENCIAS ===");
  console.log(`Total: ${results.length}`);
  for (const r of results) console.log(JSON.stringify(r, null, 2));
} catch(e) { console.log("assessment_competencias:", e.message); }

// assessment_pdi
try {
  const [results] = await conn.execute(
    `SELECT * FROM assessment_pdi WHERE alunoId IN (${ids.join(',')}) LIMIT 10`
  );
  console.log("\n=== ASSESSMENT_PDI ===");
  console.log(`Total: ${results.length}`);
  for (const r of results) console.log(JSON.stringify(r, null, 2));
} catch(e) { console.log("assessment_pdi:", e.message); }

// contratos_aluno
try {
  const [results] = await conn.execute(
    `SELECT * FROM contratos_aluno WHERE alunoId IN (${ids.join(',')}) LIMIT 10`
  );
  console.log("\n=== CONTRATOS_ALUNO ===");
  console.log(`Total: ${results.length}`);
  for (const r of results) console.log(JSON.stringify(r, null, 2));
} catch(e) { console.log("contratos_aluno:", e.message); }

// ciclos_execucao
try {
  const [results] = await conn.execute(
    `SELECT * FROM ciclos_execucao WHERE alunoId IN (${ids.join(',')}) LIMIT 10`
  );
  console.log("\n=== CICLOS_EXECUCAO ===");
  console.log(`Total: ${results.length}`);
  for (const r of results) console.log(JSON.stringify(r, null, 2));
} catch(e) { console.log("ciclos_execucao:", e.message); }

// metas
try {
  const [results] = await conn.execute(
    `SELECT * FROM metas WHERE alunoId IN (${ids.join(',')}) LIMIT 10`
  );
  console.log("\n=== METAS ===");
  console.log(`Total: ${results.length}`);
  for (const r of results) console.log(JSON.stringify(r, null, 2));
} catch(e) { console.log("metas:", e.message); }

// plano_individual
try {
  const [results] = await conn.execute(
    `SELECT * FROM plano_individual WHERE alunoId IN (${ids.join(',')}) LIMIT 10`
  );
  console.log("\n=== PLANO_INDIVIDUAL ===");
  console.log(`Total: ${results.length}`);
  for (const r of results) console.log(JSON.stringify(r, null, 2));
} catch(e) { console.log("plano_individual:", e.message); }

// scheduled_webinars participações via event_participation
try {
  const [results] = await conn.execute(
    `SELECT * FROM event_participation WHERE alunoId IN (${ids.join(',')}) LIMIT 10`
  );
  console.log("\n=== EVENT_PARTICIPATION ===");
  console.log(`Total: ${results.length}`);
  for (const r of results) console.log(JSON.stringify(r, null, 2));
} catch(e) { console.log("event_participation:", e.message); }

// disc_resultados
try {
  const [results] = await conn.execute(
    `SELECT * FROM disc_resultados WHERE alunoId IN (${ids.join(',')}) LIMIT 10`
  );
  console.log("\n=== DISC_RESULTADOS ===");
  console.log(`Total: ${results.length}`);
  for (const r of results) console.log(JSON.stringify(r, null, 2));
} catch(e) { console.log("disc_resultados:", e.message); }

await conn.end();
