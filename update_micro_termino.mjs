import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { read, utils } from 'xlsx';

// Excel serial date to YYYY-MM-DD
function excelDateToStr(serial) {
  if (typeof serial === 'string') return serial;
  if (!serial) return null;
  const utcDays = Math.floor(serial - 25569);
  const d = new Date(utcDays * 86400000);
  return d.toISOString().split('T')[0];
}

function dbDateToStr(d) {
  if (!d) return null;
  if (typeof d === 'string') return d;
  return d.toISOString().split('T')[0];
}

// Read Excel
const workbook = read(readFileSync('/home/ubuntu/upload/atualizaçãodosciclosdosebraeto.xlsx'));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = utils.sheet_to_json(sheet);

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get alunos from turma BS2
const [dbAlunos] = await conn.execute(
  `SELECT a.id, a.name FROM alunos a WHERE a.turmaId = 30003 ORDER BY a.name`
);

// Get PDIs
const [pdis] = await conn.execute(
  `SELECT ap.id, ap.alunoId FROM assessment_pdi ap
   JOIN alunos a ON ap.alunoId = a.id
   WHERE a.turmaId = 30003`
);

// Get competencias
const pdiIds = pdis.map(p => p.id);
const [comps] = await conn.execute(
  `SELECT apc.id, apc.assessmentPdiId, c.nome as compNome, apc.microInicio, apc.microTermino
   FROM assessment_competencias apc
   LEFT JOIN competencias c ON apc.competenciaId = c.id
   WHERE apc.assessmentPdiId IN (${pdiIds.join(',')})
   ORDER BY apc.assessmentPdiId`
);

// Build updates
let updates = [];
let skipped = 0;

for (const aluno of dbAlunos) {
  const planilhaRows = rows.filter(r => r['Nome'].trim().toLowerCase() === aluno.name.trim().toLowerCase());
  if (planilhaRows.length === 0) continue;
  
  const pdi = pdis.find(p => p.alunoId === aluno.id);
  if (!pdi) continue;
  
  const alunoComps = comps.filter(c => c.assessmentPdiId === pdi.id);
  
  for (const pr of planilhaRows) {
    const compNomePlan = pr['competência'].trim().toLowerCase();
    const dbComp = alunoComps.find(c => c.compNome && c.compNome.trim().toLowerCase() === compNomePlan);
    
    if (!dbComp) continue;
    
    const planMicroF = excelDateToStr(pr['Fim da micro jornada ']);
    const dbMicroF = dbDateToStr(dbComp.microTermino);
    
    if (planMicroF !== dbMicroF) {
      updates.push({
        id: dbComp.id,
        aluno: aluno.name,
        comp: pr['competência'],
        oldMicroTermino: dbMicroF,
        newMicroTermino: planMicroF
      });
    } else {
      skipped++;
    }
  }
}

console.log(`\n=== ATUALIZAÇÕES A APLICAR ===`);
console.log(`Total: ${updates.length} registros para atualizar`);
console.log(`Já corretos (skipped): ${skipped}`);

// Show first 10
updates.slice(0, 10).forEach(u => {
  console.log(`  [${u.id}] ${u.aluno} | ${u.comp}: ${u.oldMicroTermino} → ${u.newMicroTermino}`);
});
if (updates.length > 10) console.log(`  ... e mais ${updates.length - 10}`);

// Apply updates
console.log(`\nAplicando ${updates.length} atualizações...`);

let success = 0;
let errors = 0;

for (const u of updates) {
  try {
    await conn.execute(
      `UPDATE assessment_competencias SET microTermino = ? WHERE id = ?`,
      [u.newMicroTermino, u.id]
    );
    success++;
  } catch (err) {
    console.error(`  ERRO ao atualizar id=${u.id}: ${err.message}`);
    errors++;
  }
}

console.log(`\n=== RESULTADO ===`);
console.log(`Sucesso: ${success}`);
console.log(`Erros: ${errors}`);

// Verify a sample
console.log(`\nVerificação (primeiro aluno):`);
const firstAluno = dbAlunos[0];
const firstPdi = pdis.find(p => p.alunoId === firstAluno.id);
if (firstPdi) {
  const [verify] = await conn.execute(
    `SELECT apc.id, c.nome, apc.microInicio, apc.microTermino
     FROM assessment_competencias apc
     LEFT JOIN competencias c ON apc.competenciaId = c.id
     WHERE apc.assessmentPdiId = ?
     ORDER BY apc.microInicio`,
    [firstPdi.id]
  );
  console.log(`${firstAluno.name}:`);
  verify.forEach(v => {
    const mi = dbDateToStr(v.microInicio);
    const mt = dbDateToStr(v.microTermino);
    console.log(`  ${v.nome}: ${mi} → ${mt}`);
  });
}

await conn.end();
