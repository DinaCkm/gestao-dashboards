import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log("=== TURMAS ===");
const [turmas] = await conn.execute("SELECT id, name FROM turmas ORDER BY name");
console.table(turmas);

// Find BS2
const bs2 = turmas.find(t => t.name.toLowerCase().includes('bs2') || t.name.toLowerCase().includes('bs 2'));
if (bs2) {
  console.log(`\nTurma BS2 encontrada: id=${bs2.id}, name=${bs2.name}`);
  
  const [ciclos] = await conn.execute(
    `SELECT ce.id, ce.alunoId, a.name AS aluno, ce.nomeCiclo, ce.dataInicio, ce.dataFim
     FROM ciclos_execucao ce
     JOIN alunos a ON ce.alunoId = a.id
     WHERE a.turmaId = ?
     ORDER BY a.name, ce.dataInicio`, [bs2.id]
  );
  console.log(`\n=== CICLOS DA TURMA ${bs2.name} (${ciclos.length} registros) ===`);
  console.table(ciclos);
} else {
  console.log("\nTurma BS2 não encontrada. Turmas disponíveis:");
  turmas.forEach(t => console.log(`  - [${t.id}] ${t.name}`));
}

await conn.end();
