import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await createConnection(process.env.DATABASE_URL);

// Simular getJornadaCompleta para alunoId=30001 (Fabio)
// 1. Buscar TODOS os PDIs (sem filtro de status)
const [pdis] = await conn.query(`
  SELECT id, alunoId, trilhaId, macroInicio, macroTermino, status, createdAt
  FROM assessment_pdi WHERE alunoId = 30001
  ORDER BY createdAt DESC
`);
console.log('=== TODOS OS PDIs DO FABIO ===');
pdis.forEach(p => console.log(`  PDI ${p.id}: trilha=${p.trilhaId}, status=${p.status}`));

// 2. Buscar trilhas
const [trilhasList] = await conn.query('SELECT id, name FROM trilhas');
const trilhaMap = new Map(trilhasList.map(t => [t.id, t.name]));

// 3. Agrupar PDIs por trilha (como getJornadaCompleta faz)
const trilhaGroups = new Map();
for (const pdi of pdis) {
  const key = pdi.trilhaId ? String(pdi.trilhaId) : `no-trilha-${pdi.id}`;
  if (trilhaGroups.get(key) == null) trilhaGroups.set(key, []);
  trilhaGroups.get(key).push(pdi);
}

console.log('\n=== AGRUPAMENTO POR TRILHA ===');
for (const [key, groupPdis] of trilhaGroups) {
  const trilhaNome = trilhaMap.get(parseInt(key)) || 'Unknown';
  console.log(`Trilha ${key} (${trilhaNome}): ${groupPdis.length} PDIs`);
  for (const pdi of groupPdis) {
    console.log(`  PDI ${pdi.id}: status=${pdi.status}`);
    // Buscar competências
    const [comps] = await conn.query(`
      SELECT id, competenciaId, microInicio, microTermino, peso
      FROM assessment_competencias WHERE assessmentPdiId = ${pdi.id}
    `);
    console.log(`    ${comps.length} competências`);
    for (const c of comps) {
      console.log(`    comp ${c.competenciaId}: micro=${c.microInicio ? 'SIM' : 'NÃO'} peso=${c.peso}`);
    }
  }
}

// 4. Verificar: a macroJornada Master deveria ter trilhaNome="Master"
// e os ciclosV2DaTrilha filtram por c.trilhaNome === macroJornada.trilhaNome
// Ciclo V2 Master tem trilhaNome="Master" (extraído de nomeCiclo.split(' - ')[0])
// macroJornada.trilhaNome = trilhaMap[3] = "Master"
// Eles DEVEM bater.

console.log('\n=== VERIFICAÇÃO FINAL ===');
console.log('macroJornada Master trilhaNome:', trilhaMap.get(3));
console.log('cicloV2 Master trilhaNome: "Master" (extraído de "Master - Foco em Resultados, Presença Executiva +3".split(" - ")[0])');
console.log('Match:', trilhaMap.get(3) === 'Master');

await conn.end();
