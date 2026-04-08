const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // 1. Listar tabelas
  const [tables] = await conn.execute("SHOW TABLES");
  console.log('=== TABELAS ===');
  tables.forEach(t => console.log('  ', Object.values(t)[0]));
  
  // 2. Verificar event_participation da Vanessa
  const [events] = await conn.execute(
    "SELECT COUNT(*) as total FROM event_participation WHERE alunoId = 30099"
  );
  console.log('\n=== EVENT PARTICIPATION DA VANESSA ===');
  console.log('Total:', events[0].total);
  
  // 3. Verificar mentoring_sessions da Vanessa
  const [sessions] = await conn.execute(
    "SELECT COUNT(*) as total FROM mentoring_sessions WHERE alunoId = 30099"
  );
  console.log('\n=== MENTORING SESSIONS DA VANESSA ===');
  console.log('Total:', sessions[0].total);
  
  // 4. Verificar competências da Vanessa
  try {
    const [comp] = await conn.execute(
      "SELECT COUNT(*) as total FROM aluno_competencias WHERE alunoId = 30099"
    );
    console.log('\n=== COMPETÊNCIAS DA VANESSA ===');
    console.log('Total:', comp[0].total);
  } catch(e) {
    console.log('\nTabela aluno_competencias não existe, tentando competencias...');
    try {
      const [comp2] = await conn.execute(
        "SELECT COUNT(*) as total FROM competencias WHERE alunoId = 30099"
      );
      console.log('Total:', comp2[0].total);
    } catch(e2) {
      console.log('Nenhuma tabela de competências encontrada');
    }
  }
  
  // 5. Verificar turma da Vanessa
  const [turma] = await conn.execute(
    "SELECT * FROM turmas WHERE id = 30002"
  );
  console.log('\n=== TURMA DA VANESSA (30002) ===');
  console.log(JSON.stringify(turma, null, 2));
  
  // 6. Verificar programa da Vanessa
  const [programa] = await conn.execute(
    "SELECT * FROM programs WHERE id = 18"
  );
  console.log('\n=== PROGRAMA DA VANESSA (18) ===');
  console.log(JSON.stringify(programa, null, 2));
  
  // 7. Verificar se a Vanessa tem alunoId no user
  const [user] = await conn.execute(
    "SELECT id, name, alunoId FROM users WHERE openId = 'aluno_30099'"
  );
  console.log('\n=== USER DA VANESSA ===');
  console.log(JSON.stringify(user, null, 2));
  
  // 8. Verificar colunas da tabela users
  const [userCols] = await conn.execute("DESCRIBE users");
  const hasAlunoId = userCols.some(c => c.Field === 'alunoId');
  console.log('\n=== TABELA USERS TEM COLUNA alunoId? ===', hasAlunoId);
  
  await conn.end();
})();
