import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=== Importação de Alunos para Gestão de Acesso ===\n');
  
  // 1. Buscar todos os 100 alunos não-BANRISUL
  const [alunos] = await conn.query(
    'SELECT id, name, email, externalId, programId FROM alunos WHERE programId != 19 ORDER BY programId, name'
  );
  console.log(`Total de alunos a importar: ${alunos.length}`);
  
  // 2. Buscar emails já existentes na tabela users para evitar duplicatas
  const [existingUsers] = await conn.query('SELECT email, id FROM users');
  const existingEmails = new Set(existingUsers.map(u => u.email?.toLowerCase()));
  console.log(`Emails já na tabela users: ${existingUsers.length}`);
  
  // 3. Buscar externalIds já usados como cpf na tabela users
  const existingCpfs = new Set(existingUsers.map(u => u.cpf).filter(Boolean));
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const skippedList = [];
  
  for (const aluno of alunos) {
    const email = aluno.email?.trim().toLowerCase();
    const externalId = aluno.externalId?.trim();
    
    if (!email) {
      console.log(`  SKIP (sem email): ${aluno.name}`);
      skipped++;
      skippedList.push({ name: aluno.name, reason: 'sem email' });
      continue;
    }
    
    // Verificar se email já existe
    if (existingEmails.has(email)) {
      // Atualizar o registro existente para vincular ao alunoId se não estiver vinculado
      const [existing] = await conn.query('SELECT id, alunoId, cpf FROM users WHERE email = ?', [email]);
      if (existing.length > 0 && !existing[0].alunoId) {
        await conn.query(
          'UPDATE users SET alunoId = ?, cpf = COALESCE(cpf, ?), name = ? WHERE id = ?',
          [aluno.id, externalId, aluno.name, existing[0].id]
        );
        console.log(`  UPDATE: ${aluno.name} (${email}) - vinculado alunoId=${aluno.id}`);
        imported++;
      } else {
        console.log(`  SKIP (email já existe): ${aluno.name} (${email})`);
        skipped++;
        skippedList.push({ name: aluno.name, reason: 'email já existe' });
      }
      continue;
    }
    
    // Verificar se externalId já está como cpf
    if (externalId && existingCpfs.has(externalId)) {
      console.log(`  SKIP (ID já existe como cpf): ${aluno.name} (${externalId})`);
      skipped++;
      skippedList.push({ name: aluno.name, reason: 'ID duplicado' });
      continue;
    }
    
    try {
      // Inserir novo registro na tabela users
      // openId é gerado como 'aluno_' + alunoId para ser único
      const openId = `aluno_${aluno.id}`;
      
      await conn.query(
        `INSERT INTO users (openId, name, email, cpf, role, loginMethod, programId, alunoId, isActive)
         VALUES (?, ?, ?, ?, 'user', 'email_cpf', ?, ?, 1)`,
        [openId, aluno.name, email, externalId, aluno.programId, aluno.id]
      );
      
      // Marcar na tabela alunos que pode fazer login
      await conn.query('UPDATE alunos SET canLogin = 1 WHERE id = ?', [aluno.id]);
      
      existingEmails.add(email);
      if (externalId) existingCpfs.add(externalId);
      imported++;
      
    } catch (err) {
      console.log(`  ERRO: ${aluno.name} (${email}) - ${err.message}`);
      errors++;
    }
  }
  
  console.log('\n=== RESUMO ===');
  console.log(`Importados: ${imported}`);
  console.log(`Ignorados: ${skipped}`);
  console.log(`Erros: ${errors}`);
  
  if (skippedList.length > 0) {
    console.log('\nIgnorados:');
    skippedList.forEach(s => console.log(`  - ${s.name}: ${s.reason}`));
  }
  
  // Verificação final
  const [[totalUsers]] = await conn.query('SELECT COUNT(*) as total FROM users');
  const [[totalAlunos]] = await conn.query("SELECT COUNT(*) as total FROM users WHERE role = 'user'");
  const [[totalComAlunoId]] = await conn.query('SELECT COUNT(*) as total FROM users WHERE alunoId IS NOT NULL');
  
  console.log('\n=== VERIFICAÇÃO FINAL ===');
  console.log(`Total users: ${totalUsers.total}`);
  console.log(`Total users com role 'user': ${totalAlunos.total}`);
  console.log(`Total users com alunoId vinculado: ${totalComAlunoId.total}`);
  
  // Verificar por empresa
  for (const progId of [16, 17, 18]) {
    const [[count]] = await conn.query(
      "SELECT COUNT(*) as total FROM users WHERE programId = ? AND role = 'user'",
      [progId]
    );
    const progName = { 16: 'SEBRAE ACRE', 17: 'SEBRAE TO', 18: 'EMBRAPII' }[progId];
    console.log(`  ${progName}: ${count.total} alunos com acesso`);
  }
  
  await conn.end();
  console.log('\nImportação concluída!');
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
