import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get Joseane's id
  const [alunos] = await conn.execute(`SELECT id, externalId, name FROM alunos WHERE name LIKE '%Joseane%'`);
  console.log('Joseane:', alunos[0]);
  const alunoId = alunos[0].id;
  
  // Get her sessions
  const [rows] = await conn.execute(
    `SELECT sessionNumber, sessionDate, taskStatus, isAssessment, ciclo
     FROM mentoring_sessions WHERE alunoId = ? ORDER BY sessionNumber`,
    [alunoId]
  );
  
  console.log('\nJoseane sessions:');
  for (const r of rows) {
    const isAssess = r.isAssessment ? 'ASSESSMENT' : '';
    const date = r.sessionDate ? new Date(r.sessionDate).toLocaleDateString('pt-BR') : 'N/A';
    console.log(`S${r.sessionNumber} | ${date} | task=${r.taskStatus} | ${isAssess} | ciclo=${r.ciclo}`);
  }
  
  // With fix: assessment sessions are treated as sem_tarefa
  const withFix = rows.filter(r => {
    const taskStatus = r.isAssessment ? 'sem_tarefa' : (r.taskStatus || 'sem_tarefa');
    return taskStatus !== 'sem_tarefa';
  });
  const entregues = withFix.filter(r => r.taskStatus === 'entregue');
  console.log(`\nCom fix (assessment=sem_tarefa): ${withFix.length} sessoes com tarefa, ${entregues.length} entregues`);
  console.log(`Percentual bruto: ${(entregues.length / withFix.length * 100).toFixed(1)}%`);
  
  // Without fix (original)
  const withoutFix = rows.filter(r => (r.taskStatus || 'sem_tarefa') !== 'sem_tarefa');
  const entreguesSemFix = withoutFix.filter(r => r.taskStatus === 'entregue');
  console.log(`\nSem fix (original): ${withoutFix.length} sessoes com tarefa, ${entreguesSemFix.length} entregues`);
  console.log(`Percentual bruto: ${(entreguesSemFix.length / withoutFix.length * 100).toFixed(1)}%`);
  
  await conn.end();
}
main();
