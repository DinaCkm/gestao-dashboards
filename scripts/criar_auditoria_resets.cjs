/**
 * Script para:
 * 1. Criar tabela auditoria_resets_ciclo no banco de produção
 * 2. Inserir registros retroativos para alunos que já foram resetados
 *    (detectados por terem historico_ciclos_aluno com numeroCiclo > 0 e todos os PDIs congelados)
 */
const mysql = require('mysql2/promise');

const DB_URL = 'mysql://root:CJPFcPSxxMioBMvTEHSkxGjsuDKqItho@gondola.proxy.rlwy.net:49182/railway';

async function run() {
  const conn = await mysql.createConnection(DB_URL);

  // 1. Criar tabela
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS auditoria_resets_ciclo (
      id INT AUTO_INCREMENT PRIMARY KEY,
      alunoId INT NOT NULL,
      alunoNome VARCHAR(255) NULL,
      adminId INT NULL,
      adminNome VARCHAR(255) NULL,
      numeroCicloArquivado INT NOT NULL,
      historicoId INT NULL,
      pdisCongelados INT DEFAULT 0,
      microciclosCongelados INT DEFAULT 0,
      ind7Snapshot DECIMAL(5,2) NULL,
      observacoes TEXT NULL,
      criadoEm DATETIME DEFAULT NOW(),
      INDEX idx_alunoId (alunoId),
      INDEX idx_criadoEm (criadoEm)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ Tabela auditoria_resets_ciclo criada/verificada.');

  // 2. Detectar alunos resetados: têm historico_ciclos_aluno e TODOS os PDIs congelados (nenhum ativo)
  const [alunosResetados] = await conn.execute(`
    SELECT DISTINCT
      hca.alunoId,
      a.name AS alunoNome,
      MAX(hca.numeroCiclo) AS ultimoCicloArquivado,
      MAX(hca.id) AS ultimoHistoricoId,
      MAX(hca.ind7EngajamentoFinal) AS ind7Snapshot,
      MAX(hca.createdAt) AS dataReset
    FROM historico_ciclos_aluno hca
    JOIN alunos a ON a.id = hca.alunoId
    WHERE hca.alunoId NOT IN (
      SELECT alunoId FROM assessment_pdi WHERE status = 'ativo'
    )
    AND hca.alunoId NOT IN (
      SELECT alunoId FROM auditoria_resets_ciclo
    )
    GROUP BY hca.alunoId, a.name
  `);

  console.log(`\n📋 Alunos resetados sem registro de auditoria: ${alunosResetados.length}`);
  
  for (const aluno of alunosResetados) {
    // Contar PDIs congelados
    const [pdisRows] = await conn.execute(
      `SELECT COUNT(*) as total FROM assessment_pdi WHERE alunoId = ? AND status = 'congelado'`,
      [aluno.alunoId]
    );
    const pdisCongelados = pdisRows[0].total;

    await conn.execute(`
      INSERT INTO auditoria_resets_ciclo
        (alunoId, alunoNome, adminId, adminNome, numeroCicloArquivado, historicoId, pdisCongelados, ind7Snapshot, observacoes, criadoEm)
      VALUES (?, ?, NULL, 'Sistema (retroativo)', ?, ?, ?, ?, 'Registro retroativo - reset anterior à criação da tabela de auditoria', ?)
    `, [
      aluno.alunoId,
      aluno.alunoNome,
      aluno.ultimoCicloArquivado,
      aluno.ultimoHistoricoId,
      pdisCongelados,
      aluno.ind7Snapshot ?? null,
      aluno.dataReset
    ]);
    console.log(`  ✅ ${aluno.alunoNome} — Ciclo ${aluno.ultimoCicloArquivado} arquivado, ind7=${aluno.ind7Snapshot ?? 'N/A'}%`);
  }

  console.log('\n✅ Concluído!');
  await conn.end();
}

run().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
