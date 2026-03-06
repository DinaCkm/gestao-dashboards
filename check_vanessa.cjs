const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Simular a query getAlunosByConsultor(39)
  const [sessions] = await conn.execute(
    'SELECT DISTINCT alunoId FROM mentoring_sessions WHERE consultorId = 39'
  );
  console.log('=== ALUNOS COM SESSÕES DO CONSULTOR 39 (Adriana) ===');
  console.log('Total:', sessions.length);
  
  const alunoIds = sessions.map(s => s.alunoId);
  console.log('IDs:', alunoIds);
  console.log('Vanessa (30099) está na lista?', alunoIds.includes(30099));
  
  // Buscar nomes
  if (alunoIds.length > 0) {
    const placeholders = alunoIds.map(() => '?').join(',');
    const [alunosAtivos] = await conn.execute(
      `SELECT id, name, isActive FROM alunos WHERE isActive = 1 AND id IN (${placeholders})`,
      alunoIds
    );
    console.log('\n=== ALUNOS ATIVOS DO CONSULTOR 39 ===');
    console.log('Total:', alunosAtivos.length);
    alunosAtivos.forEach(a => console.log(`  ${a.id}: ${a.name} (active=${a.isActive})`));
    
    const vanessa = alunosAtivos.find(a => a.id === 30099);
    console.log('\nVanessa na lista final?', !!vanessa);
  }
  
  // Verificar também: alunos vinculados ao consultorId=39 na tabela alunos mas SEM sessões
  const [alunosVinculados] = await conn.execute(
    'SELECT id, name FROM alunos WHERE consultorId = 39 AND isActive = 1'
  );
  console.log('\n=== ALUNOS VINCULADOS AO CONSULTOR 39 NA TABELA ALUNOS ===');
  console.log('Total:', alunosVinculados.length);
  alunosVinculados.forEach(a => console.log(`  ${a.id}: ${a.name}`));
  
  // Diferença: alunos vinculados mas sem sessão
  const comSessao = new Set(alunoIds);
  const semSessao = alunosVinculados.filter(a => !comSessao.has(a.id));
  if (semSessao.length > 0) {
    console.log('\n=== ALUNOS VINCULADOS MAS SEM SESSÃO COM CONSULTOR 39 ===');
    semSessao.forEach(a => console.log(`  ${a.id}: ${a.name}`));
  }
  
  await conn.end();
})();
