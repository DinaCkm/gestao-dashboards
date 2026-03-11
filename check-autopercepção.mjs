import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 1. Ver todas as trilhas
const [trilhas] = await conn.execute('SELECT * FROM trilhas');
console.log('=== TRILHAS ===');
for (const t of trilhas) {
  console.log(`  id: ${t.id}, name: ${t.name}, ordem: ${t.ordem}`);
}

// 2. Ver competências do assessment da Joseane com peso
const [comps] = await conn.execute(`
  SELECT ac.competenciaId, ac.peso, c.nome as compName,
         ap.trilhaId, t.name as trilhaName
  FROM assessment_competencias ac
  JOIN assessment_pdi ap ON ac.assessmentPdiId = ap.id
  LEFT JOIN competencias c ON ac.competenciaId = c.id
  LEFT JOIN trilhas t ON ap.trilhaId = t.id
  WHERE ap.alunoId = 30066
`);
console.log('\n=== COMPETÊNCIAS DO ASSESSMENT (Joseane) ===');
for (const c of comps) {
  console.log(`  ${c.compName} | trilha: ${c.trilhaName} (id: ${c.trilhaId}) | peso: ${c.peso}`);
}

// 3. Ver autopercepções inseridas
const [autos] = await conn.execute(`
  SELECT ap.*, c.nome as compName, t.name as trilhaName
  FROM autopercepcoes_competencias ap
  LEFT JOIN competencias c ON ap.competenciaId = c.id
  LEFT JOIN trilhas t ON ap.trilhaId = t.id
  WHERE ap.alunoId = 30066
`);
console.log('\n=== AUTOPERCEPÇÕES INSERIDAS (Joseane) ===');
for (const a of autos) {
  console.log(`  ${a.compName} | trilha: ${a.trilhaName} (id: ${a.trilhaId}) | nota: ${a.nota}`);
}

// 4. O mapa filtra por trilhas Basic, Essential, Master
// Verificar se trilha 4 (Visão de Futuro) tem name diferente
const [trilha4] = await conn.execute('SELECT * FROM trilhas WHERE id = 4');
console.log('\n=== TRILHA 4 ===');
console.log(trilha4[0]);

// 5. Verificar quais trilhas têm name "Basic", "Essential", "Master"
const [trilhasRelatorio] = await conn.execute("SELECT * FROM trilhas WHERE name IN ('Basic', 'Essential', 'Master')");
console.log('\n=== TRILHAS DO RELATÓRIO (Basic, Essential, Master) ===');
for (const t of trilhasRelatorio) {
  console.log(`  id: ${t.id}, name: ${t.name}`);
}

// 6. Verificar competências das trilhas Basic, Essential, Master
const [compsBasic] = await conn.execute(`
  SELECT c.id, c.nome, c.trilhaId, t.name as trilhaName
  FROM competencias c
  JOIN trilhas t ON c.trilhaId = t.id
  WHERE t.name IN ('Basic', 'Essential', 'Master')
  ORDER BY t.name, c.nome
`);
console.log(`\n=== COMPETÊNCIAS DAS TRILHAS BASIC/ESSENTIAL/MASTER (${compsBasic.length} total) ===`);
for (const c of compsBasic) {
  console.log(`  ${c.trilhaName}: ${c.nome} (id: ${c.id})`);
}

await conn.end();
