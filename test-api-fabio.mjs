import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await createConnection(process.env.DATABASE_URL);

// Simular o que getCiclosForCalculator retorna para o Fabio
const [pdis] = await conn.query(`SELECT id, trilhaId, status FROM assessment_pdi WHERE alunoId = 30001 AND status = 'ativo'`);
console.log('PDIs ativos:', pdis.map(p => `${p.id}(trilha=${p.trilhaId})`).join(', '));

const [trilhasList] = await conn.query('SELECT id, name FROM trilhas');
const trilhaMap = new Map(trilhasList.map(t => [t.id, t.name]));

const pdiIds = pdis.map(p => p.id);
const [comps] = await conn.query(`
  SELECT id, assessmentPdiId, competenciaId, peso, microInicio, microTermino
  FROM assessment_competencias 
  WHERE assessmentPdiId IN (${pdiIds.join(',')})
`);

const [allCompetencias] = await conn.query('SELECT id, nome FROM competencias');
const compNomeMap = new Map(allCompetencias.map(c => [c.id, c.nome]));

// Gerar ciclos como getCiclosForCalculator faz
const result = [];
let autoId = 200000;

for (const pdi of pdis) {
  const trilhaNome = trilhaMap.get(pdi.trilhaId) || `Trilha ${pdi.trilhaId}`;
  const pdiComps = comps.filter(c => c.assessmentPdiId === pdi.id);
  
  const cicloGroups = new Map();
  for (const comp of pdiComps) {
    if (comp.microInicio == null || comp.microTermino == null) continue;
    const inicio = new Date(comp.microInicio).toISOString().split('T')[0];
    const termino = new Date(comp.microTermino).toISOString().split('T')[0];
    const key = inicio + '|' + termino;
    if (cicloGroups.get(key) == null) cicloGroups.set(key, { allCompIds: [], obrigatoriaIds: [], inicio, termino });
    const group = cicloGroups.get(key);
    group.allCompIds.push(comp.competenciaId);
    if (comp.peso === 'obrigatoria') group.obrigatoriaIds.push(comp.competenciaId);
  }
  
  for (const [, group] of cicloGroups) {
    if (group.allCompIds.length === 0) continue;
    const namesForTitle = group.obrigatoriaIds.length > 0 ? group.obrigatoriaIds : group.allCompIds;
    const allNames = namesForTitle.map(id => compNomeMap.get(id) || `Comp ${id}`);
    const compNames = allNames.length <= 2
      ? allNames.join(', ')
      : `${allNames.slice(0, 2).join(', ')} +${allNames.length - 2}`;
    
    const ciclo = {
      id: autoId++,
      nomeCiclo: `${trilhaNome} - ${compNames}`,
      dataInicio: group.inicio,
      dataFim: group.termino,
      competenciaIds: group.obrigatoriaIds,
      allCompetenciaIds: group.allCompIds,
    };
    result.push(ciclo);
  }
}

console.log('\n=== CICLOS GERADOS ===');
result.forEach(c => {
  console.log(`  ${c.nomeCiclo}`);
  console.log(`    dataInicio=${c.dataInicio}, dataFim=${c.dataFim}`);
  console.log(`    competenciaIds (obrigatórias)=${JSON.stringify(c.competenciaIds)}`);
  console.log(`    allCompetenciaIds=${JSON.stringify(c.allCompetenciaIds)}`);
  
  // Determinar status
  const now = new Date();
  const inicio = new Date(c.dataInicio + 'T00:00:00');
  const fim = new Date(c.dataFim + 'T23:59:59');
  const status = now > fim ? 'finalizado' : (now >= inicio && now <= fim ? 'em_andamento' : 'futuro');
  console.log(`    status=${status}`);
  
  // trilhaNome extraído
  const trilhaNome = c.nomeCiclo.split(' - ')[0];
  console.log(`    trilhaNome extraído="${trilhaNome}"`);
});

// Agora verificar: no frontend, o filtro é:
// ciclosV2DaTrilha = v2.ciclosFinalizados/EmAndamento.filter(c => c.trilhaNome === macroJornada.trilhaNome)
// macroJornada.trilhaNome vem de trilhaMap[primaryPdi.trilhaId]
// Verificar se os nomes batem
console.log('\n=== NOMES DAS TRILHAS ===');
for (const [id, name] of trilhaMap) {
  console.log(`  Trilha ${id}: "${name}"`);
}

await conn.end();
