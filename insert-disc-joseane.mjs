import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const url = new URL(DATABASE_URL);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '3306'),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: true },
  });

  // 1. Encontrar a Joseane
  const [alunos] = await conn.execute(
    "SELECT id, name, email FROM alunos WHERE name LIKE '%Joseane%'"
  );
  console.log('Alunos encontrados:', alunos);

  if (alunos.length === 0) {
    console.log('Joseane não encontrada no banco!');
    await conn.end();
    return;
  }

  const aluno = alunos[0];
  console.log(`\nAluno: ${aluno.name} (ID: ${aluno.id}, Email: ${aluno.email})`);

  // 2. Verificar se já tem DISC
  const [existingDisc] = await conn.execute(
    "SELECT * FROM disc_resultados WHERE alunoId = ?",
    [aluno.id]
  );
  console.log('\nDISC existente:', existingDisc.length > 0 ? existingDisc : 'Nenhum');

  if (existingDisc.length > 0) {
    console.log('\n⚠ Joseane já tem resultado DISC. Vou atualizar com os dados do ETALENT.');
    await conn.execute(
      `UPDATE disc_resultados SET 
        scoreD = 43.00, scoreI = 12.00, scoreS = 88.00, scoreC = 88.00,
        perfilPredominante = 'S', perfilSecundario = 'C',
        metodoCalculo = 'etalent',
        indiceConsistencia = NULL,
        alertaBaixaDiferenciacao = false,
        updatedAt = NOW()
      WHERE alunoId = ?`,
      [aluno.id]
    );
    console.log('✅ DISC atualizado com sucesso!');
  } else {
    console.log('\nInserindo novo resultado DISC...');
    await conn.execute(
      `INSERT INTO disc_resultados 
        (alunoId, ciclo, scoreD, scoreI, scoreS, scoreC, perfilPredominante, perfilSecundario, metodoCalculo, completedAt, createdAt, updatedAt)
      VALUES (?, 1, 43.00, 12.00, 88.00, 88.00, 'S', 'C', 'etalent', NOW(), NOW(), NOW())`,
      [aluno.id]
    );
    console.log('✅ DISC inserido com sucesso!');
  }

  // 3. Verificar resultado
  const [result] = await conn.execute(
    "SELECT * FROM disc_resultados WHERE alunoId = ?",
    [aluno.id]
  );
  console.log('\nResultado final:', result);

  await conn.end();
}

main().catch(console.error);
