import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Colunas das tabelas
const [colsAlunos] = await conn.query('SHOW COLUMNS FROM alunos');
console.log('Colunas alunos:', colsAlunos.map(c => c.Field).join(', '));

const [colsTurmas] = await conn.query('SHOW COLUMNS FROM turmas');
console.log('Colunas turmas:', colsTurmas.map(c => c.Field).join(', '));

// Listar todas as tabelas
const [tables] = await conn.query('SHOW TABLES');
console.log('Tabelas:', tables.map(t => Object.values(t)[0]).join(', '));

// Total de alunos
const [total] = await conn.query('SELECT COUNT(*) as total FROM alunos');
console.log('\nTotal alunos cadastrados:', total[0].total);

// Alunos com mentoria
const [comMent] = await conn.query('SELECT COUNT(DISTINCT alunoId) as total FROM mentoring_sessions');
console.log('Alunos com mentoria:', comMent[0].total);

// Alunos sem mentoria
const [semMent] = await conn.query('SELECT COUNT(*) as total FROM alunos WHERE id NOT IN (SELECT DISTINCT alunoId FROM mentoring_sessions)');
console.log('Alunos sem mentoria:', semMent[0].total);

// Alunos sem mentoria - detalhes
const [semMentDetail] = await conn.query(`
  SELECT a.id, a.name, a.programId
  FROM alunos a 
  WHERE a.id NOT IN (SELECT DISTINCT alunoId FROM mentoring_sessions)
`);

// Agrupar por programa
const porPrograma = {};
for (const r of semMentDetail) {
  const prog = r.programId || 'sem_programa';
  if (!porPrograma[prog]) porPrograma[prog] = [];
  porPrograma[prog].push(r.name);
}

for (const [prog, alunos] of Object.entries(porPrograma)) {
  console.log(`\nPrograma ${prog} (${alunos.length} alunos sem mentoria):`);
  alunos.forEach(a => console.log(`  - ${a}`));
}

// Programas - verificar nome correto da tabela
try {
  const [progs] = await conn.query('SELECT * FROM programs');
  console.log('\nProgramas:');
  progs.forEach(p => console.log(`  ${JSON.stringify(p)}`));
} catch(e) {
  console.log('Tabela programs não existe, tentando outra...');
}

// Alunos por programa
const [porProg] = await conn.query('SELECT programId, COUNT(*) as total FROM alunos GROUP BY programId');
console.log('\nAlunos por programId:');
porProg.forEach(r => console.log(`  Programa ${r.programId}: ${r.total} alunos`));

await conn.end();
