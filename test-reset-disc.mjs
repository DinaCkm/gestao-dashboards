/**
 * Script de teste: simula o reset de ciclo do TESTE2 (alunoId=570032)
 * e valida que os dados DISC são preservados no histórico.
 */
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('DATABASE_URL não encontrada');
  process.exit(1);
}

// Parsear a URL do banco
const url = new URL(DB_URL);
const conn = await createConnection({
  host: url.hostname,
  port: parseInt(url.port),
  user: url.username,
  password: url.password,
  database: url.pathname.replace('/', ''),
});

const alunoId = 570032;
console.log(`\n=== TESTE DE RESET - TESTE2 (alunoId=${alunoId}) ===\n`);

// 1. Estado ANTES
console.log('--- ANTES DO RESET ---');
const [discAntes] = await conn.execute(
  'SELECT id, scoreD, scoreI, scoreS, scoreC, perfilPredominante, perfilSecundario FROM disc_resultados WHERE alunoId = ?',
  [alunoId]
);
console.log('DISC:', discAntes);

const [pdiAntes] = await conn.execute(
  'SELECT id, status, trilhaId FROM assessment_pdi WHERE alunoId = ?',
  [alunoId]
);
console.log('PDI:', pdiAntes);

// 2. Simular o arquivamento (parte central do arquivarCicloAtual)
console.log('\n--- EXECUTANDO ARQUIVAMENTO ---');

// Buscar DISC com scores
const [[discRow]] = await conn.execute(
  'SELECT id, ciclo, scoreD, scoreI, scoreS, scoreC, perfilPredominante, perfilSecundario FROM disc_resultados WHERE alunoId = ? ORDER BY ciclo DESC, createdAt DESC LIMIT 1',
  [alunoId]
);
console.log('DISC encontrado:', discRow);

// Buscar PDI ativo
const [[pdiRow]] = await conn.execute(
  "SELECT id FROM assessment_pdi WHERE alunoId = ? AND status = 'ativo' ORDER BY createdAt DESC LIMIT 1",
  [alunoId]
);
console.log('PDI encontrado:', pdiRow);

// Inserir histórico com snapshot DISC
const discScoreD = discRow?.scoreD ?? null;
const discScoreI = discRow?.scoreI ?? null;
const discScoreS = discRow?.scoreS ?? null;
const discScoreC = discRow?.scoreC ?? null;
const discPerfil = discRow?.perfilPredominante ?? null;
const discPerfilSec = discRow?.perfilSecundario ?? null;
const discId = discRow?.id ?? null;
const pdiId = pdiRow?.id ?? null;

await conn.execute(`
  INSERT INTO historico_ciclos_aluno (
    alunoId, numeroCiclo, discResultadoId, assessmentPdiId,
    dataInicio, dataConclusao,
    snapshotDiscD, snapshotDiscI, snapshotDiscS, snapshotDiscC,
    snapshotDiscPerfil, snapshotDiscPerfilSecundario,
    createdAt, updatedAt
  ) VALUES (?, 1, ?, ?, NOW(), NOW(), ?, ?, ?, ?, ?, ?, NOW(), NOW())
`, [alunoId, discId, pdiId, discScoreD, discScoreI, discScoreS, discScoreC, discPerfil, discPerfilSec]);

console.log('Histórico inserido com snapshot DISC ✅');

// Congelar PDI
if (pdiId) {
  await conn.execute("UPDATE assessment_pdi SET status = 'congelado' WHERE id = ?", [pdiId]);
  console.log(`PDI ${pdiId} congelado ✅`);
}

// NÃO deletar disc_resultados (correção aplicada)
// Deletar apenas disc_respostas
const [respostasResult] = await conn.execute('DELETE FROM disc_respostas WHERE alunoId = ?', [alunoId]);
console.log(`disc_respostas deletadas: ${respostasResult.affectedRows}`);

// 3. Estado DEPOIS
console.log('\n--- DEPOIS DO RESET ---');
const [discDepois] = await conn.execute(
  'SELECT id, scoreD, scoreI, scoreS, scoreC, perfilPredominante FROM disc_resultados WHERE alunoId = ?',
  [alunoId]
);
console.log('DISC preservado:', discDepois);

const [historicoDepois] = await conn.execute(
  'SELECT id, numeroCiclo, discResultadoId, snapshotDiscD, snapshotDiscI, snapshotDiscS, snapshotDiscC, snapshotDiscPerfil, snapshotDiscPerfilSecundario FROM historico_ciclos_aluno WHERE alunoId = ?',
  [alunoId]
);
console.log('Histórico criado:', historicoDepois);

// 4. Validação final
console.log('\n--- VALIDAÇÃO ---');
const hist = historicoDepois[0];
if (hist) {
  console.log(`✅ snapshotDiscD = ${hist.snapshotDiscD} (esperado: 57)`);
  console.log(`✅ snapshotDiscI = ${hist.snapshotDiscI} (esperado: 54)`);
  console.log(`✅ snapshotDiscS = ${hist.snapshotDiscS} (esperado: 46)`);
  console.log(`✅ snapshotDiscC = ${hist.snapshotDiscC} (esperado: 43)`);
  console.log(`✅ snapshotDiscPerfil = ${hist.snapshotDiscPerfil} (esperado: D)`);
  console.log(`✅ discResultadoId = ${hist.discResultadoId} (esperado: 180013)`);
  
  const discOriginal = discDepois[0];
  if (discOriginal) {
    console.log(`\n✅ DISC ORIGINAL PRESERVADO: id=${discOriginal.id}, scoreD=${discOriginal.scoreD}`);
  } else {
    console.log(`\n❌ DISC ORIGINAL FOI DELETADO — BUG!`);
  }
} else {
  console.log('❌ Histórico não foi criado!');
}

await conn.end();
console.log('\n=== TESTE CONCLUÍDO ===');
