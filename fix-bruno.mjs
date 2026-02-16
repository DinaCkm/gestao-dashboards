import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [bruno] = await conn.query("SELECT id, name, email, cpf, role, alunoId, programId FROM users WHERE email = 'bruno.rodrigues@to.sebrae.com.br'");
  console.log('Bruno na tabela users:', bruno[0]);
  
  const [brunoAluno] = await conn.query("SELECT id, name, email, externalId, programId FROM alunos WHERE email = 'bruno.rodrigues@to.sebrae.com.br'");
  console.log('Bruno na tabela alunos:', brunoAluno[0]);
  
  if (bruno[0] && brunoAluno[0]) {
    // Vincular alunoId se não vinculado
    if (bruno[0].alunoId === null) {
      await conn.query('UPDATE users SET alunoId = ?, programId = ? WHERE id = ?', [brunoAluno[0].id, brunoAluno[0].programId, bruno[0].id]);
      console.log('Bruno atualizado com alunoId:', brunoAluno[0].id);
    } else {
      console.log('Bruno já tem alunoId:', bruno[0].alunoId);
    }
    
    // Marcar canLogin
    await conn.query('UPDATE alunos SET canLogin = 1 WHERE id = ?', [brunoAluno[0].id]);
    console.log('canLogin ativado para Bruno');
  }
  
  // Verificação final
  const [updated] = await conn.query("SELECT id, name, email, cpf, role, alunoId, programId FROM users WHERE email = 'bruno.rodrigues@to.sebrae.com.br'");
  console.log('\nBruno atualizado:', updated[0]);
  
  await conn.end();
}

main().catch(console.error);
