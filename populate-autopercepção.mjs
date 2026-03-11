import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const ALUNO_ID = 30066; // Joseane

// 1. Buscar competências do assessment da Joseane
const [comps] = await conn.execute(`
  SELECT ac.competenciaId, ac.nivelAtual, ac.metaFinal, c.nome as compNome,
         ap.trilhaId
  FROM assessment_competencias ac
  LEFT JOIN competencias c ON ac.competenciaId = c.id
  JOIN assessment_pdi ap ON ac.assessmentPdiId = ap.id
  WHERE ap.alunoId = ?
`, [ALUNO_ID]);

console.log(`Encontradas ${comps.length} competências no assessment da Joseane:`);
for (const c of comps) {
  console.log(`  - ${c.compNome} (id: ${c.competenciaId}, trilha: ${c.trilhaId}, nivelAtual: ${c.nivelAtual}, metaFinal: ${c.metaFinal})`);
}

// 2. Verificar se já tem autopercepção
const [existing] = await conn.execute(
  'SELECT COUNT(*) as cnt FROM autopercepcoes_competencias WHERE alunoId = ?',
  [ALUNO_ID]
);
console.log(`\nAutopercepções existentes: ${existing[0].cnt}`);

if (existing[0].cnt > 0) {
  console.log('Já tem autopercepção, pulando...');
  await conn.end();
  process.exit(0);
}

// 3. Inserir autopercepção baseada no nivelAtual do assessment
// Converter nivelAtual (0-100%) para nota (1-5):
// 0-20% = 1, 21-40% = 2, 41-60% = 3, 61-80% = 4, 81-100% = 5
function nivelToNota(nivel) {
  if (!nivel || nivel === null) return 3; // default médio se não tem dado
  const n = parseFloat(nivel);
  if (n <= 20) return 1;
  if (n <= 40) return 2;
  if (n <= 60) return 3;
  if (n <= 80) return 4;
  return 5;
}

for (const c of comps) {
  const nota = nivelToNota(c.nivelAtual);
  await conn.execute(
    'INSERT INTO autopercepcoes_competencias (alunoId, competenciaId, trilhaId, nota, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
    [ALUNO_ID, c.competenciaId, c.trilhaId, nota]
  );
  console.log(`  Inserido: ${c.compNome} -> nota ${nota} (baseado em nivelAtual: ${c.nivelAtual}%)`);
}

console.log(`\n✅ Autopercepção inserida com sucesso para Joseane (${comps.length} competências)`);

// 4. Verificar resultado final
const [verify] = await conn.execute(
  'SELECT COUNT(*) as cnt FROM autopercepcoes_competencias WHERE alunoId = ?',
  [ALUNO_ID]
);
console.log(`Verificação: ${verify[0].cnt} registros de autopercepção`);

await conn.end();
