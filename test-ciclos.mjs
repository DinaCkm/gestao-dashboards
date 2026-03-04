import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Simular getCiclosForCalculator para alunoId=30001
const alunoId = 30001;

// Buscar PDIs ativos
const [pdis] = await conn.execute(
  `SELECT ap.id, ap.trilhaId FROM assessment_pdi ap WHERE ap.alunoId = ? AND ap.status = 'ativo'`,
  [alunoId]
);
console.log('PDIs ativos:', pdis.length);

// Buscar todas as competências dos PDIs
const pdiIds = pdis.map(p => p.id);
const [allComps] = await conn.execute(
  `SELECT ac.id, ac.assessmentPdiId, ac.competenciaId, ac.peso, ac.microInicio, ac.microTermino
   FROM assessment_competencias ac
   WHERE ac.assessmentPdiId IN (${pdiIds.join(',')})`
);

// Buscar trilhas
const [allTrilhas] = await conn.execute('SELECT id, name FROM trilhas');
const trilhaMap = new Map(allTrilhas.map(t => [t.id, t.name]));

// Buscar competências
const [allCompetencias] = await conn.execute('SELECT id, nome FROM competencias');
const compNomeMap = new Map(allCompetencias.map(c => [c.id, c.nome]));

let autoId = 200000;

for (const pdi of pdis) {
  const trilhaNome = trilhaMap.get(pdi.trilhaId) || `Trilha ${pdi.trilhaId}`;
  const comps = allComps.filter(c => c.assessmentPdiId === pdi.id);
  
  console.log(`\n=== ${trilhaNome} (PDI ${pdi.id}) ===`);
  console.log(`  Total competências: ${comps.length}`);
  
  // Agrupar por período
  const cicloGroups = new Map();
  
  for (const comp of comps) {
    if (!comp.microInicio || !comp.microTermino) continue;
    
    const inicio = new Date(comp.microInicio).toISOString().split('T')[0];
    const termino = new Date(comp.microTermino).toISOString().split('T')[0];
    const key = `${inicio}|${termino}`;
    
    const group = cicloGroups.get(key) || { allCompIds: [], obrigatoriaIds: [], inicio, termino };
    group.allCompIds.push(comp.competenciaId);
    if (comp.peso === 'obrigatoria') {
      group.obrigatoriaIds.push(comp.competenciaId);
    }
    cicloGroups.set(key, group);
  }
  
  for (const [key, group] of cicloGroups) {
    const namesForTitle = group.obrigatoriaIds.length > 0 ? group.obrigatoriaIds : group.allCompIds;
    const allNames = namesForTitle.map(id => compNomeMap.get(id) || `Comp ${id}`);
    const uniqueNames = [...new Set(allNames)];
    const compNames = uniqueNames.length <= 2
      ? uniqueNames.join(', ')
      : `${uniqueNames.slice(0, 2).join(', ')} +${uniqueNames.length - 2}`;
    
    console.log(`  Ciclo: ${trilhaNome} - ${compNames}`);
    console.log(`    Período: ${group.inicio} - ${group.termino}`);
    console.log(`    Obrigatórias: ${group.obrigatoriaIds.length} | Todas: ${group.allCompIds.length}`);
  }
}

await conn.end();
process.exit(0);
