/**
 * Importa dados da planilha CompetênciasObrigatórias-SEBRAETocantins
 * para as tabelas assessment_pdi e assessment_competencias
 */
import XLSX from 'xlsx';
import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const filepath = '/home/ubuntu/upload/CompetênciasObrigatórias-SEBRAETocantins13feb(1).xlsx';
const workbook = XLSX.readFile(filepath);
const sheet = workbook.Sheets['Planilha1'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

// Skip header rows (row 0 is header, row 1 is sub-header)
const dataRows = rows.slice(2).filter(r => r[0] && r[0] !== 'Nome' && r[0].trim() !== '');

console.log(`Total de linhas de dados: ${dataRows.length}`);

// Parse date helper - handles Excel serial numbers and string formats
function parseDate(val) {
  if (!val && val !== 0) return null;
  
  // Excel serial number (number type)
  if (typeof val === 'number' && val > 40000 && val < 60000) {
    // Excel epoch: Jan 1, 1900 (with the Lotus 1-2-3 bug)
    const d = new Date((val - 25569) * 86400 * 1000);
    return d.toISOString().split('T')[0];
  }
  
  const str = String(val).trim();
  if (!str) return null;
  
  // dd/mm/yy or dd/mm/yyyy
  const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (dmyMatch) {
    let year = parseInt(dmyMatch[3]);
    if (year < 100) year += 2000;
    return `${year}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  }
  
  // yyyy-mm-dd
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }
  
  console.warn(`  \u26a0 Data n\u00e3o reconhecida: "${val}" (type: ${typeof val})`);
  return null;
}

// Get program ID for SEBRAE TO
const [programs] = await conn.execute("SELECT id FROM programs WHERE code = 'SEBRAE_TO' OR name LIKE '%Tocantins%' OR name LIKE '%SEBRAE TO%' LIMIT 1");
const programId = programs[0]?.id;
console.log(`Program SEBRAE TO: id=${programId}`);

// Get turmas for SEBRAE TO
const [turmas] = await conn.execute("SELECT id, name FROM turmas WHERE programId = ?", [programId]);
console.log(`Turmas encontradas: ${turmas.map(t => `${t.id}:${t.name}`).join(', ')}`);

// Map turma codes to IDs - use exact bracket codes from turma names
const turmaMap = {};
for (const t of turmas) {
  if (t.name.includes('[BS1]')) turmaMap['BS1'] = t.id;
  if (t.name.includes('[BS2]')) turmaMap['BS2'] = t.id;
  if (t.name.includes('[BS3]')) turmaMap['BS3'] = t.id;
}
console.log(`Turma map: ${JSON.stringify(turmaMap)}`);

// Get trilhas
const [trilhas] = await conn.execute("SELECT id, name FROM trilhas");
console.log(`Trilhas: ${trilhas.map(t => `${t.id}:${t.name}`).join(', ')}`);

// Map competencia names to trilha IDs
const [competencias] = await conn.execute("SELECT id, nome, trilhaId FROM competencias");
const compMap = {};
for (const c of competencias) {
  compMap[c.nome.toLowerCase().trim()] = { id: c.id, trilhaId: c.trilhaId };
}

// Get alunos for SEBRAE TO
const [alunos] = await conn.execute("SELECT id, name FROM alunos WHERE programId = ?", [programId]);
const alunoMap = {};
for (const a of alunos) {
  alunoMap[a.name.toLowerCase().trim()] = a.id;
}
console.log(`Alunos SEBRAE TO: ${alunos.length}`);

// Group data by aluno + turma (each unique combination = 1 assessment_pdi)
const assessmentGroups = {};

for (const row of dataRows) {
  const nome = String(row[0]).trim();
  const competencia = String(row[1]).trim();
  const peso = String(row[2]).trim(); // Obrigatória ou Opcional
  const notaCorte = parseFloat(row[3]) || 80;
  const turmaCode = String(row[4]).trim(); // BS1, BS2, BS3
  const nomeLimpo = String(row[6] || row[0]).trim();
  const macroInicio = parseDate(row[7]);
  const macroTermino = parseDate(row[8]);
  const microInicio = parseDate(row[9]);
  const microTermino = parseDate(row[10]);
  
  if (!nome || nome === 'Nome') continue;
  
  const key = `${nomeLimpo.toLowerCase()}|${turmaCode}`;
  
  if (!assessmentGroups[key]) {
    assessmentGroups[key] = {
      nome: nomeLimpo,
      turmaCode,
      macroInicio,
      macroTermino,
      competencias: []
    };
  }
  
  // Update macro dates if better
  if (macroInicio && (!assessmentGroups[key].macroInicio || macroInicio < assessmentGroups[key].macroInicio)) {
    assessmentGroups[key].macroInicio = macroInicio;
  }
  if (macroTermino && (!assessmentGroups[key].macroTermino || macroTermino > assessmentGroups[key].macroTermino)) {
    assessmentGroups[key].macroTermino = macroTermino;
  }
  
  assessmentGroups[key].competencias.push({
    competencia,
    peso: peso === 'Obrigatória' ? 'obrigatoria' : 'opcional',
    notaCorte,
    microInicio,
    microTermino
  });
}

console.log(`\nGrupos de assessment: ${Object.keys(assessmentGroups).length}`);

// Import
let pdiCount = 0;
let compCount = 0;
let skippedAlunos = [];
let skippedComps = [];

for (const [key, group] of Object.entries(assessmentGroups)) {
  const alunoId = alunoMap[group.nome.toLowerCase().trim()];
  if (!alunoId) {
    skippedAlunos.push(group.nome);
    continue;
  }
  
  const turmaId = turmaMap[group.turmaCode];
  
  // Determine trilha based on competencias
  // Get the trilhaId from the first competencia
  let trilhaId = null;
  for (const comp of group.competencias) {
    const compInfo = compMap[comp.competencia.toLowerCase().trim()];
    if (compInfo) {
      trilhaId = compInfo.trilhaId;
      break;
    }
  }
  
  if (!trilhaId) {
    // Try to determine from turma code
    // BS1 = Básica + Essencial, BS2 = Visão de Futuro, BS3 = Básica
    const trilhaNames = {
      'BS1': null, // mixed, will use first comp
      'BS2': 'Visão de Futuro',
      'BS3': 'Básica'
    };
    const tn = trilhaNames[group.turmaCode];
    if (tn) {
      const t = trilhas.find(t => t.name === tn);
      if (t) trilhaId = t.id;
    }
  }
  
  if (!trilhaId) {
    console.warn(`  ⚠ Trilha não encontrada para ${group.nome} (${group.turmaCode})`);
    // Default to first trilha
    trilhaId = trilhas[0]?.id || 1;
  }
  
  // Validate macro dates
  let macroInicio = group.macroInicio || '2025-04-20';
  let macroTermino = group.macroTermino || '2026-03-31';
  
  // Insert assessment_pdi
  const [result] = await conn.execute(
    `INSERT INTO assessment_pdi (alunoId, trilhaId, turmaId, consultorId, programId, macroInicio, macroTermino, status, createdAt, updatedAt)
     VALUES (?, ?, ?, NULL, ?, ?, ?, 'ativo', NOW(), NOW())`,
    [alunoId, trilhaId, turmaId || null, programId, macroInicio, macroTermino]
  );
  
  const pdiId = result.insertId;
  pdiCount++;
  
  // Insert competencias
  for (const comp of group.competencias) {
    let compInfo = compMap[comp.competencia.toLowerCase().trim()];
    // Handle known name mismatches
    if (!compInfo && comp.competencia.toLowerCase().includes('gestão de tempo')) {
      compInfo = compMap['gestão do tempo'];
    }
    if (!compInfo) {
      skippedComps.push(comp.competencia);
      continue;
    }
    
    // Validate: micro dates must not exceed macro dates
    let microInicio = comp.microInicio;
    let microTermino = comp.microTermino;
    
    if (microInicio && microInicio < macroInicio) {
      microInicio = macroInicio;
    }
    if (microTermino && microTermino > macroTermino) {
      microTermino = macroTermino;
    }
    
    await conn.execute(
      `INSERT INTO assessment_competencias (assessmentPdiId, competenciaId, peso, notaCorte, microInicio, microTermino, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [pdiId, compInfo.id, comp.peso, comp.notaCorte, microInicio || null, microTermino || null]
    );
    compCount++;
  }
}

console.log(`\n=== RESULTADO ===`);
console.log(`PDIs criados: ${pdiCount}`);
console.log(`Competências vinculadas: ${compCount}`);

if (skippedAlunos.length > 0) {
  console.log(`\nAlunos não encontrados no banco (${skippedAlunos.length}):`);
  [...new Set(skippedAlunos)].forEach(a => console.log(`  - ${a}`));
}

if (skippedComps.length > 0) {
  console.log(`\nCompetências não encontradas no banco (${[...new Set(skippedComps)].length}):`);
  [...new Set(skippedComps)].forEach(c => console.log(`  - ${c}`));
}

// Verify
const [pdis] = await conn.execute("SELECT COUNT(*) as cnt FROM assessment_pdi");
const [comps2] = await conn.execute("SELECT COUNT(*) as cnt FROM assessment_competencias");
console.log(`\nVerificação: ${pdis[0].cnt} PDIs, ${comps2[0].cnt} competências no banco`);

await conn.end();
console.log('\n✅ Importação concluída!');
