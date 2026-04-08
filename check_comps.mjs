import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await conn.query(`
  SELECT t.name as trilha, t.id as trilhaId, c.nome as competencia, c.id as compId
  FROM competencias c
  JOIN trilhas t ON c.trilhaId = t.id
  ORDER BY t.name, c.nome
`);

const byTrilha = {};
const allComps = new Set();
for (const r of rows) {
  if (!(r.trilha in byTrilha)) byTrilha[r.trilha] = [];
  byTrilha[r.trilha].push(r.competencia);
  allComps.add(r.competencia);
}

console.log('=== COMPETÊNCIAS POR TRILHA ===');
for (const [trilha, comps] of Object.entries(byTrilha).sort()) {
  console.log(`\n${trilha} (${comps.length} competências):`);
  comps.sort().forEach(c => console.log(`  - ${c}`));
}

// Identificar faltantes na Jornada Personalizada
const jpComps = new Set(byTrilha['Jornada Personalizada'] || []);
const faltantes = [...allComps].filter(c => jpComps.has(c) === false).sort();
console.log(`\n=== FALTANTES NA JORNADA PERSONALIZADA (${faltantes.length}) ===`);
faltantes.forEach(c => console.log(`  - ${c}`));

// Buscar trilhaId da Jornada Personalizada
const [jpTrilha] = await conn.query("SELECT id FROM trilhas WHERE name = 'Jornada Personalizada'");
console.log(`\nTrilhaId Jornada Personalizada: ${jpTrilha[0]?.id}`);

await conn.end();
