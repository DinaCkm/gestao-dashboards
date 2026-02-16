import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'app_db'
};

(async () => {
  const conn = await mysql.createConnection(config);
  
  // Buscar Vera por email
  const [alunos] = await conn.execute(
    'SELECT * FROM alunos WHERE email = ?',
    ['vera.braga@to.sebrae.com.br']
  );
  
  if (alunos.length === 0) {
    console.log('❌ Aluno não encontrado');
    await conn.end();
    return;
  }
  
  const vera = alunos[0];
  console.log('=== DADOS DA VERA ===');
  console.log('ID:', vera.id);
  console.log('Nome:', vera.name);
  console.log('consultorId:', vera.consultorId);
  console.log('turmaId:', vera.turmaId);
  console.log('programId:', vera.programId);
  
  // Buscar ciclos
  const [ciclos] = await conn.execute(
    'SELECT * FROM execucao_trilha WHERE alunoId = ?',
    [vera.id]
  );
  console.log('\n=== CICLOS ===');
  console.log('Total:', ciclos.length);
  
  // Buscar mentores disponíveis
  const [mentores] = await conn.execute(
    'SELECT id, name FROM consultors WHERE isActive = 1 LIMIT 10'
  );
  console.log('\n=== MENTORES DISPONÍVEIS ===');
  mentores.forEach(m => console.log(`${m.id} - ${m.name}`));
  
  // Buscar Assessment/PDI
  const [pdis] = await conn.execute(
    'SELECT * FROM assessment_pdi WHERE alunoId = ?',
    [vera.id]
  );
  console.log('\n=== ASSESSMENTS ===');
  console.log('Total:', pdis.length);
  
  await conn.end();
})();
