import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { read, utils } from 'xlsx';

// Excel serial date to YYYY-MM-DD
function excelDateToStr(serial) {
  if (typeof serial === 'string') return serial; // already a string
  if (!serial) return null;
  // Excel epoch: 1900-01-01 = serial 1 (with the 1900 leap year bug)
  const utcDays = Math.floor(serial - 25569);
  const d = new Date(utcDays * 86400000);
  return d.toISOString().split('T')[0];
}

// DB date to YYYY-MM-DD string
function dbDateToStr(d) {
  if (!d) return null;
  if (typeof d === 'string') return d;
  // It's a Date object
  return d.toISOString().split('T')[0];
}

// Read Excel
const workbook = read(readFileSync('/home/ubuntu/upload/atualizaçãodosciclosdosebraeto.xlsx'));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = utils.sheet_to_json(sheet);

console.log(`Planilha: ${rows.length} linhas`);

// Test date conversion
console.log(`\nTeste conversão: 45767 = ${excelDateToStr(45767)}, 46112 = ${excelDateToStr(46112)}`);

const alunosUnicos = [...new Set(rows.map(r => r['Nome']))];
console.log(`Alunos únicos na planilha: ${alunosUnicos.length}`);

const competenciasUnicas = [...new Set(rows.map(r => r['competência']))];
console.log(`Competências únicas: ${competenciasUnicas.length}`);
competenciasUnicas.forEach(c => console.log(`  - ${c}`));

// Show first aluno data from spreadsheet
console.log("\n=== DADOS DA PLANILHA (1 exemplo) ===");
const firstAluno = rows.filter(r => r['Nome'] === alunosUnicos[0]);
console.log(`Aluno: ${alunosUnicos[0]}`);
firstAluno.forEach(r => {
  const macroI = excelDateToStr(r['Início da Jornada Macro ']);
  const macroF = excelDateToStr(r['Fim da Jornada Macro ']);
  const microI = excelDateToStr(r['Início da micro jornada']);
  const microF = excelDateToStr(r['Fim da micro jornada ']);
  console.log(`  ${r['competência']} | Macro: ${macroI} → ${macroF} | Micro: ${microI} → ${microF} | ${r['tipo de competencia ']}`);
});

// Connect to DB
const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [dbAlunos] = await conn.execute(
  `SELECT a.id, a.name FROM alunos a WHERE a.turmaId = 30003 ORDER BY a.name`
);
console.log(`\nAlunos no banco (turma BS2): ${dbAlunos.length}`);

const alunoIds = dbAlunos.map(a => a.id);
const [pdis] = await conn.execute(
  `SELECT ap.id, ap.alunoId, a.name, ap.macroInicio, ap.macroTermino, ap.status
   FROM assessment_pdi ap
   JOIN alunos a ON ap.alunoId = a.id
   WHERE a.turmaId = 30003
   ORDER BY a.name`
);

const pdiIds = pdis.map(p => p.id);
const [comps] = await conn.execute(
  `SELECT apc.id, apc.assessmentPdiId, apc.competenciaId, c.nome as compNome, apc.microInicio, apc.microTermino, apc.peso
   FROM assessment_competencias apc
   LEFT JOIN competencias c ON apc.competenciaId = c.id
   WHERE apc.assessmentPdiId IN (${pdiIds.join(',')})
   ORDER BY apc.assessmentPdiId, apc.microInicio`
);

console.log(`\n========== COMPARAÇÃO (com conversão de datas) ==========`);

let macroDiffs = [];
let microDiffs = [];
let tipoDiffs = [];
let compNaoEncontrada = [];

for (const aluno of dbAlunos) {
  const planilhaRows = rows.filter(r => r['Nome'].trim().toLowerCase() === aluno.name.trim().toLowerCase());
  if (planilhaRows.length === 0) continue;
  
  const pdi = pdis.find(p => p.alunoId === aluno.id);
  if (!pdi) continue;
  
  // Compare macro dates
  const planMacroI = excelDateToStr(planilhaRows[0]['Início da Jornada Macro ']);
  const planMacroF = excelDateToStr(planilhaRows[0]['Fim da Jornada Macro ']);
  const dbMacroI = dbDateToStr(pdi.macroInicio);
  const dbMacroF = dbDateToStr(pdi.macroTermino);
  
  if (planMacroI !== dbMacroI || planMacroF !== dbMacroF) {
    macroDiffs.push({ aluno: aluno.name, pdiId: pdi.id, banco: `${dbMacroI} → ${dbMacroF}`, planilha: `${planMacroI} → ${planMacroF}` });
  }
  
  // Compare micro dates per competencia
  const alunoComps = comps.filter(c => c.assessmentPdiId === pdi.id);
  for (const pr of planilhaRows) {
    const compNomePlan = pr['competência'].trim().toLowerCase();
    const dbComp = alunoComps.find(c => c.compNome && c.compNome.trim().toLowerCase() === compNomePlan);
    
    if (!dbComp) {
      compNaoEncontrada.push({ aluno: aluno.name, comp: pr['competência'] });
      continue;
    }
    
    const planMicroI = excelDateToStr(pr['Início da micro jornada']);
    const planMicroF = excelDateToStr(pr['Fim da micro jornada ']);
    const dbMicroI = dbDateToStr(dbComp.microInicio);
    const dbMicroF = dbDateToStr(dbComp.microTermino);
    
    if (planMicroI !== dbMicroI || planMicroF !== dbMicroF) {
      microDiffs.push({ 
        aluno: aluno.name, pdiId: pdi.id, compId: dbComp.id, comp: pr['competência'],
        bancoDe: `${dbMicroI} → ${dbMicroF}`, planilhaPara: `${planMicroI} → ${planMicroF}`
      });
    }
    
    // Compare peso (normalize accents)
    const planTipo = pr['tipo de competencia ']?.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const dbTipo = dbComp.peso?.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (planTipo && dbTipo && planTipo !== dbTipo) {
      tipoDiffs.push({ aluno: aluno.name, comp: pr['competência'], banco: dbComp.peso, planilha: pr['tipo de competencia '] });
    }
  }
}

console.log(`\n--- MACRO DIFFS: ${macroDiffs.length} ---`);
macroDiffs.slice(0, 5).forEach(d => console.log(`  ${d.aluno}: Banco(${d.banco}) → Planilha(${d.planilha})`));
if (macroDiffs.length > 5) console.log(`  ... e mais ${macroDiffs.length - 5}`);

console.log(`\n--- MICRO DIFFS: ${microDiffs.length} ---`);
microDiffs.slice(0, 15).forEach(d => console.log(`  ${d.aluno} | ${d.comp}: Banco(${d.bancoDe}) → Planilha(${d.planilhaPara})`));
if (microDiffs.length > 15) console.log(`  ... e mais ${microDiffs.length - 15}`);

console.log(`\n--- TIPO/PESO DIFFS (após normalizar acentos): ${tipoDiffs.length} ---`);
tipoDiffs.slice(0, 5).forEach(d => console.log(`  ${d.aluno} | ${d.comp}: Banco(${d.banco}) → Planilha(${d.planilha})`));
if (tipoDiffs.length > 5) console.log(`  ... e mais ${tipoDiffs.length - 5}`);

console.log(`\n--- COMPETÊNCIAS NÃO ENCONTRADAS NO BANCO: ${compNaoEncontrada.length} ---`);
compNaoEncontrada.slice(0, 5).forEach(d => console.log(`  ${d.aluno}: ${d.comp}`));
if (compNaoEncontrada.length > 5) console.log(`  ... e mais ${compNaoEncontrada.length - 5}`);

// Summary of what needs to be updated
console.log("\n\n========== RESUMO DE ATUALIZAÇÕES NECESSÁRIAS ==========");
console.log(`Macro Jornada: ${macroDiffs.length} alunos com datas diferentes`);
console.log(`Micro Jornada: ${microDiffs.length} competências com datas diferentes`);
console.log(`Peso/Tipo: ${tipoDiffs.length} competências com tipo diferente`);
console.log(`Competências não encontradas: ${compNaoEncontrada.length}`);

// Show unique micro date changes to understand the pattern
if (microDiffs.length > 0) {
  const uniqueChanges = new Map();
  microDiffs.forEach(d => {
    const key = `${d.comp}: ${d.bancoDe} → ${d.planilhaPara}`;
    uniqueChanges.set(key, (uniqueChanges.get(key) || 0) + 1);
  });
  console.log(`\n--- PADRÕES DE MUDANÇA MICRO (únicos) ---`);
  for (const [change, count] of uniqueChanges) {
    console.log(`  [${count}x] ${change}`);
  }
}

await conn.end();
