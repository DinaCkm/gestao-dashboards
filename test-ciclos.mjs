import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await createConnection(process.env.DATABASE_URL);

// 1. Buscar PDIs ativos do Fabio
const [pdis] = await conn.query(`SELECT id, trilhaId FROM assessment_pdi WHERE alunoId = 30001 AND status = 'ativo'`);
console.log('PDIs ativos:', pdis.length);
pdis.forEach(p => console.log(`  PDI ${p.id}: trilhaId=${p.trilhaId}`));

// 2. Buscar trilhas
const [trilhasList] = await conn.query('SELECT id, name FROM trilhas');
const trilhaMap = new Map(trilhasList.map(t => [t.id, t.name]));

// 3. Buscar competências com micro ciclo
if (pdis.length > 0) {
  const pdiIds = pdis.map(p => p.id);
  const [comps] = await conn.query(`
    SELECT id, assessmentPdiId, competenciaId, peso, microInicio, microTermino
    FROM assessment_competencias 
    WHERE assessmentPdiId IN (${pdiIds.join(',')})
  `);
  
  for (const pdi of pdis) {
    const trilhaNome = trilhaMap.get(pdi.trilhaId) || 'Unknown';
    const pdiComps = comps.filter(c => c.assessmentPdiId === pdi.id);
    console.log(`\nPDI ${pdi.id} (Trilha: ${trilhaNome}):`);
    
    const cicloGroups = new Map();
    for (const comp of pdiComps) {
      if (comp.microInicio == null || comp.microTermino == null) {
        console.log(`  SKIP: comp ${comp.competenciaId} - sem datas`);
        continue;
      }
      const inicio = new Date(comp.microInicio).toISOString().split('T')[0];
      const termino = new Date(comp.microTermino).toISOString().split('T')[0];
      const key = inicio + '|' + termino;
      if (cicloGroups.get(key) == null) cicloGroups.set(key, []);
      cicloGroups.get(key).push(comp);
    }
    
    console.log(`  Ciclos gerados: ${cicloGroups.size}`);
    for (const [key, grp] of cicloGroups) {
      const [ini, fim] = key.split('|');
      const nomeCiclo = trilhaNome + ' - comps';
      console.log(`  Ciclo: ${ini} a ${fim} | ${grp.length} comps | peso: ${grp.map(c => c.peso).join(',')} | trilhaNome extraído: "${nomeCiclo.split(' - ')[0]}"`);
    }
  }
}

// 4. Verificar: qual é o trilhaNome da macroJornada Master?
const [masterTrilha] = await conn.query(`SELECT id, name FROM trilhas WHERE id = 3`);
console.log('\n=== Trilha Master no banco ===');
console.log(masterTrilha);

await conn.end();
