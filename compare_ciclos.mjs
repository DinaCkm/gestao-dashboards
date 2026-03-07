import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { read, utils } from 'xlsx';

// Read Excel
const workbook = read(readFileSync('/home/ubuntu/upload/atualizaçãodosciclosdosebraeto.xlsx'));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = utils.sheet_to_json(sheet);

console.log(`Planilha: ${rows.length} linhas`);

// Get unique alunos from spreadsheet
const alunosUnicos = [...new Set(rows.map(r => r['Nome']))];
console.log(`Alunos únicos na planilha: ${alunosUnicos.length}`);

// Get unique competencias
const competenciasUnicas = [...new Set(rows.map(r => r['competência']))];
console.log(`Competências únicas: ${competenciasUnicas.length}`);
competenciasUnicas.forEach(c => console.log(`  - ${c}`));

// Summarize: for each aluno, show macro dates and micro dates per competencia
console.log("\n=== DADOS DA PLANILHA (resumo por aluno, 1 exemplo) ===");
const firstAluno = rows.filter(r => r['Nome'] === alunosUnicos[0]);
console.log(`Aluno: ${alunosUnicos[0]}`);
firstAluno.forEach(r => {
  console.log(`  ${r['competência']} | Macro: ${r['Início da Jornada Macro ']} → ${r['Fim da Jornada Macro ']} | Micro: ${r['Início da micro jornada']} → ${r['Fim da micro jornada ']} | ${r['tipo de competencia ']}`);
});

// Connect to DB
const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get alunos from turma BS2 (id=30003)
const [dbAlunos] = await conn.execute(
  `SELECT a.id, a.name FROM alunos a WHERE a.turmaId = 30003 ORDER BY a.name`
);
console.log(`\n=== ALUNOS NO BANCO (turma BS2): ${dbAlunos.length} ===`);

// Get assessment PDIs for these alunos
const alunoIds = dbAlunos.map(a => a.id);
if (alunoIds.length > 0) {
  const [pdis] = await conn.execute(
    `SELECT ap.id, ap.alunoId, a.name, ap.macroInicio, ap.macroTermino, ap.status, t.name as trilhaNome
     FROM assessment_pdi ap
     JOIN alunos a ON ap.alunoId = a.id
     LEFT JOIN trilhas t ON ap.trilhaId = t.id
     WHERE a.turmaId = 30003
     ORDER BY a.name`
  );
  console.log(`\n=== ASSESSMENT PDIs NO BANCO (turma BS2): ${pdis.length} ===`);
  pdis.forEach(p => console.log(`  [${p.id}] ${p.name} | Macro: ${p.macroInicio} → ${p.macroTermino} | Status: ${p.status} | Trilha: ${p.trilhaNome}`));

  // Get competencias from assessment_pdi_competencias
  if (pdis.length > 0) {
    const pdiIds = pdis.map(p => p.id);
    const [comps] = await conn.execute(
      `SELECT apc.id, apc.assessmentPdiId, apc.competenciaId, c.nome as compNome, apc.microInicio, apc.microTermino, apc.peso
       FROM assessment_competencias apc
       LEFT JOIN competencias c ON apc.competenciaId = c.id
       WHERE apc.assessmentPdiId IN (${pdiIds.join(',')})
       ORDER BY apc.assessmentPdiId, apc.microInicio`
    );
    console.log(`\n=== COMPETÊNCIAS PDI NO BANCO: ${comps.length} ===`);
    
    // Show first aluno's competencias
    const firstPdi = pdis[0];
    const firstComps = comps.filter(c => c.assessmentPdiId === firstPdi.id);
    console.log(`\nExemplo - ${firstPdi.name} (PDI ${firstPdi.id}):`);
    firstComps.forEach(c => console.log(`  ${c.compNome} | Micro: ${c.microInicio} → ${c.microTermino} | Tipo: ${c.tipo}`));
    
    // Now compare: planilha vs banco
    console.log("\n\n========== COMPARAÇÃO PLANILHA vs BANCO ==========");
    
    let diferencas = [];
    
    for (const aluno of dbAlunos) {
      const planilhaRows = rows.filter(r => {
        const nPlanilha = r['Nome'].trim().toLowerCase();
        const nBanco = aluno.name.trim().toLowerCase();
        return nPlanilha === nBanco;
      });
      
      if (planilhaRows.length === 0) continue;
      
      const pdi = pdis.find(p => p.alunoId === aluno.id);
      if (!pdi) {
        diferencas.push({ aluno: aluno.name, tipo: 'SEM_PDI', detalhe: 'Aluno na planilha mas sem PDI no banco' });
        continue;
      }
      
      // Compare macro dates
      const planilhaMacroInicio = planilhaRows[0]['Início da Jornada Macro '];
      const planilhaMacroFim = planilhaRows[0]['Fim da Jornada Macro '];
      const bancoMacroInicio = pdi.macroInicio;
      const bancoMacroFim = pdi.macroTermino;
      
      if (planilhaMacroInicio !== bancoMacroInicio || planilhaMacroFim !== bancoMacroFim) {
        diferencas.push({ 
          aluno: aluno.name, pdiId: pdi.id, tipo: 'MACRO_DIFF', 
          detalhe: `Macro: Banco(${bancoMacroInicio}→${bancoMacroFim}) vs Planilha(${planilhaMacroInicio}→${planilhaMacroFim})` 
        });
      }
      
      // Compare micro dates per competencia
      const alunoComps = comps.filter(c => c.assessmentPdiId === pdi.id);
      for (const pr of planilhaRows) {
        const compNomePlanilha = pr['competência'].trim().toLowerCase();
        const dbComp = alunoComps.find(c => c.compNome && c.compNome.trim().toLowerCase() === compNomePlanilha);
        
        if (!dbComp) {
          diferencas.push({ aluno: aluno.name, pdiId: pdi.id, tipo: 'COMP_NAO_ENCONTRADA', detalhe: `Competência "${pr['competência']}" na planilha mas não no banco` });
          continue;
        }
        
        const planilhaMicroInicio = pr['Início da micro jornada'];
        const planilhaMicroFim = pr['Fim da micro jornada '];
        const bancoMicroInicio = dbComp.microInicio;
        const bancoMicroFim = dbComp.microTermino;
        
        if (planilhaMicroInicio !== bancoMicroInicio || planilhaMicroFim !== bancoMicroFim) {
          diferencas.push({ 
            aluno: aluno.name, pdiId: pdi.id, compId: dbComp.id, comp: pr['competência'], tipo: 'MICRO_DIFF', 
            detalhe: `Micro: Banco(${bancoMicroInicio}→${bancoMicroFim}) vs Planilha(${planilhaMicroInicio}→${planilhaMicroFim})` 
          });
        }
        
        // Compare tipo
        const planilhaTipo = pr['tipo de competencia ']?.trim().toLowerCase();
        const bancoTipo = dbComp.peso?.trim().toLowerCase();
        if (planilhaTipo && bancoTipo && planilhaTipo !== bancoTipo) {
          diferencas.push({ 
            aluno: aluno.name, pdiId: pdi.id, compId: dbComp.id, comp: pr['competência'], tipo: 'TIPO_DIFF', 
            detalhe: `Peso: Banco(${bancoTipo}) vs Planilha(${planilhaTipo})` 
          });
        }
      }
    }
    
    console.log(`\nTotal de diferenças encontradas: ${diferencas.length}`);
    
    // Group by tipo
    const grouped = {};
    diferencas.forEach(d => {
      if (!grouped[d.tipo]) grouped[d.tipo] = [];
      grouped[d.tipo].push(d);
    });
    
    for (const [tipo, items] of Object.entries(grouped)) {
      console.log(`\n--- ${tipo} (${items.length}) ---`);
      items.slice(0, 10).forEach(d => console.log(`  ${d.aluno}: ${d.detalhe}`));
      if (items.length > 10) console.log(`  ... e mais ${items.length - 10}`);
    }
  }
}

await conn.end();
