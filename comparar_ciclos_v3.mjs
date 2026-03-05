import 'dotenv/config';
import mysql2 from 'mysql2/promise';
import fs from 'fs';

const conn = await mysql2.createConnection(process.env.DATABASE_URL);

// Mapeamento: coluna "Trilha" da planilha → turmaId no banco + trilha real
// A coluna "Trilha" da planilha é na verdade a TURMA (ano + cliente + trilha + batch)
const turmaMapping = {
  '[2024] SEBRAE Acre - Turma 1.0':                    { turmaId: 30001, trilha: 'Basic' },
  '[2025] Sebrae Acre - B.E.M. | Básicas':             { turmaId: 30004, trilha: 'Basic' },
  '[2025] Sebrae Acre - B.E.M. | Essenciais':          { turmaId: 30006, trilha: 'Essential' },
  '[2025] Sebrae Acre - B.E.M. | Masters':             { turmaId: 30010, trilha: 'Master' },
  '[2025] Embrapii | Básicas':                          { turmaId: 30002, trilha: 'Basic' },
  '[2025] Embrapii | Jornada Personalizada':            { turmaId: 30009, trilha: 'Jornada Personalizada' },
  '[2026] Embrapii | Visão Do Futuro':                  { turmaId: 30011, trilha: 'Visão de Futuro' },
  '[2025] SEBRAE Tocantins - Básicas [BS1]':            { turmaId: 30005, trilha: 'Basic' },
  '[2025] SEBRAE Tocantins - Básicas [BS3]':            { turmaId: 30008, trilha: 'Basic' },
  '[2025] SEBRAE Tocantins - Essenciais [BS1]':         { turmaId: 30007, trilha: 'Essential' },
  '[2025] SEBRAE Tocantins - Visão de Futuro [BS2]':    { turmaId: 30003, trilha: 'Visão de Futuro' },
  '[2026] SEBRAE Tocantins - Essenciais [BS3]':         { turmaId: null, trilha: 'Essential' }, // TURMA NÃO EXISTE NO BANCO
};

function normalizeDate(d) {
  if (!d) return '';
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  try {
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
  } catch(e) {}
  const m = s.match(/(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  return s;
}

// 1. Buscar dados do banco: assessment_competencias com JOIN completo
const [bancoRows] = await conn.execute(`
  SELECT ac.id as acId, ac.assessmentPdiId, ac.competenciaId, ac.peso, 
         ac.microInicio, ac.microTermino,
         c.nome as competenciaNome,
         ap.alunoId, ap.trilhaId, ap.turmaId, ap.macroInicio, ap.macroTermino, ap.status as pdiStatus,
         a.externalId, a.name as alunoNome,
         t.name as trilhaNome,
         tu.name as turmaNome,
         p.name as programaNome
  FROM assessment_competencias ac
  JOIN assessment_pdi ap ON ac.assessmentPdiId = ap.id
  JOIN competencias c ON ac.competenciaId = c.id
  JOIN alunos a ON ap.alunoId = a.id
  LEFT JOIN trilhas t ON ap.trilhaId = t.id
  LEFT JOIN turmas tu ON ap.turmaId = tu.id
  LEFT JOIN programs p ON ap.programId = p.id
  ORDER BY a.externalId, t.name, c.nome
`);
console.log(`Total assessment_competencias no banco: ${bancoRows.length}`);

// 2. Buscar competências e seus IDs
const [compsDb] = await conn.execute(`SELECT id, nome, trilhaId FROM competencias ORDER BY id`);
const compByNameTrilha = {};
for (const c of compsDb) {
  const [trilhaRow] = await conn.execute(`SELECT name FROM trilhas WHERE id = ?`, [c.trilhaId]);
  const trilhaNome = trilhaRow[0]?.name || '';
  compByNameTrilha[`${c.nome}|${trilhaNome}`] = c.id;
}

// 3. Carregar planilha
const planilhaData = JSON.parse(fs.readFileSync('/home/ubuntu/planilha_parsed.json', 'utf-8'));
console.log(`Total registros na planilha: ${planilhaData.length}`);

// 4. Mapear banco: chave = externalId + trilhaNome + competenciaNome
const bancoMap = {};
for (const r of bancoRows) {
  const key = `${r.externalId}|${r.trilhaNome}|${r.competenciaNome}`;
  bancoMap[key] = {
    acId: r.acId,
    assessmentPdiId: r.assessmentPdiId,
    alunoId: r.alunoId,
    externalId: r.externalId,
    alunoNome: r.alunoNome,
    trilha: r.trilhaNome,
    trilhaId: r.trilhaId,
    turma: r.turmaNome,
    turmaId: r.turmaId,
    competencia: r.competenciaNome,
    competenciaId: r.competenciaId,
    peso: r.peso,
    microInicio: normalizeDate(r.microInicio),
    microTermino: normalizeDate(r.microTermino),
    macroInicio: normalizeDate(r.macroInicio),
    macroTermino: normalizeDate(r.macroTermino),
    pdiStatus: r.pdiStatus,
    programa: r.programaNome,
  };
}

// 5. Mapear planilha: chave = id_usuario + trilha real + competência
const planilhaMap = {};
for (const r of planilhaData) {
  const mapping = turmaMapping[r.trilha];
  if (!mapping) {
    console.log(`AVISO: Trilha não mapeada: ${r.trilha}`);
    continue;
  }
  const trilhaReal = mapping.trilha;
  const key = `${r.id_usuario}|${trilhaReal}|${r.competencia}`;
  planilhaMap[key] = {
    empresa: r.empresa,
    idUsuario: r.id_usuario,
    nome: r.nome,
    turmaOriginal: r.trilha,
    turmaId: mapping.turmaId,
    trilha: trilhaReal,
    competencia: r.competencia,
    tipo: r.tipo,
    macroInicio: normalizeDate(r.macro_inicio),
    macroFim: normalizeDate(r.macro_fim),
    microInicio: normalizeDate(r.micro_inicio),
    microFim: normalizeDate(r.micro_fim),
  };
}

// 6. Comparação
const iguais = [];
const divergencias = [];
const soNaPlanilha = [];
const soNoBanco = [];

for (const [key, plan] of Object.entries(planilhaMap)) {
  if (bancoMap[key]) {
    const banco = bancoMap[key];
    const changes = [];
    
    if (banco.microInicio !== plan.microInicio) {
      changes.push({ campo: 'microInicio', banco: banco.microInicio, planilha: plan.microInicio });
    }
    if (banco.microTermino !== plan.microFim) {
      changes.push({ campo: 'microTermino', banco: banco.microTermino, planilha: plan.microFim });
    }
    if (banco.macroInicio !== plan.macroInicio) {
      changes.push({ campo: 'macroInicio', banco: banco.macroInicio, planilha: plan.macroInicio });
    }
    if (banco.macroTermino !== plan.macroFim) {
      changes.push({ campo: 'macroTermino', banco: banco.macroTermino, planilha: plan.macroFim });
    }
    const planPeso = plan.tipo.toLowerCase() === 'obrigatória' ? 'obrigatoria' : 'opcional';
    if (banco.peso !== planPeso) {
      changes.push({ campo: 'peso', banco: banco.peso, planilha: planPeso });
    }
    
    if (changes.length > 0) {
      divergencias.push({
        aluno: plan.nome, idUsuario: plan.idUsuario, trilha: plan.trilha,
        turma: plan.turmaOriginal, competencia: plan.competencia,
        acId: banco.acId, assessmentPdiId: banco.assessmentPdiId,
        changes, banco, planilha: plan,
      });
    } else {
      iguais.push(key);
    }
  } else {
    soNaPlanilha.push(plan);
  }
}

for (const [key, banco] of Object.entries(bancoMap)) {
  if (!planilhaMap[key]) {
    soNoBanco.push(banco);
  }
}

// 7. Resumo
console.log(`\n========================================`);
console.log(`  RELATÓRIO DE IMPACTO`);
console.log(`========================================`);
console.log(`Registros iguais (sem mudança):     ${iguais.length}`);
console.log(`Registros com divergência:          ${divergencias.length}`);
console.log(`Registros novos (só na planilha):   ${soNaPlanilha.length}`);
console.log(`Registros só no banco:              ${soNoBanco.length}`);

// Tipos de divergência
const changeCount = {};
for (const d of divergencias) {
  for (const c of d.changes) {
    changeCount[c.campo] = (changeCount[c.campo] || 0) + 1;
  }
}
console.log(`\nDetalhamento das divergências:`);
for (const [campo, cnt] of Object.entries(changeCount)) {
  console.log(`  ${campo}: ${cnt} registros`);
}

// Novos por turma
const novosPorTurma = {};
for (const p of soNaPlanilha) {
  novosPorTurma[p.turmaOriginal] = (novosPorTurma[p.turmaOriginal] || 0) + 1;
}
console.log(`\nNovos registros por turma:`);
for (const [t, cnt] of Object.entries(novosPorTurma).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t}: ${cnt}`);
}

// Alunos novos (que não têm nenhum assessment no banco)
const alunosNovos = new Set();
for (const p of soNaPlanilha) {
  const temNoBanco = bancoRows.some(b => b.externalId === p.idUsuario);
  if (!temNoBanco) alunosNovos.add(p.idUsuario);
}
console.log(`\nAlunos completamente novos (sem nenhum assessment): ${alunosNovos.size}`);
if (alunosNovos.size > 0) {
  const nomes = soNaPlanilha.filter(p => alunosNovos.has(p.idUsuario));
  const unique = [...new Set(nomes.map(n => `${n.nome} (${n.idUsuario})`))];
  unique.forEach(n => console.log(`  ${n}`));
}

// Só no banco por trilha
const bancoPorTrilha = {};
for (const b of soNoBanco) {
  bancoPorTrilha[`${b.turma || 'sem turma'} | ${b.trilha}`] = (bancoPorTrilha[`${b.turma || 'sem turma'} | ${b.trilha}`] || 0) + 1;
}
console.log(`\nRegistros só no banco (por turma|trilha):`);
for (const [t, cnt] of Object.entries(bancoPorTrilha).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t}: ${cnt}`);
}

// Exemplos de divergências
if (divergencias.length > 0) {
  console.log(`\n=== EXEMPLOS DE DIVERGÊNCIAS (primeiras 10) ===`);
  divergencias.slice(0, 10).forEach(d => {
    console.log(`  ${d.aluno} (${d.idUsuario}) | ${d.turma} | ${d.competencia}`);
    d.changes.forEach(c => console.log(`    ${c.campo}: "${c.banco}" → "${c.planilha}"`));
  });
}

// Salvar relatório completo
const relatorio = {
  resumo: {
    total_planilha: Object.keys(planilhaMap).length,
    total_banco: Object.keys(bancoMap).length,
    iguais: iguais.length,
    divergencias: divergencias.length,
    so_na_planilha: soNaPlanilha.length,
    so_no_banco: soNoBanco.length,
    tipos_divergencia: changeCount,
    alunos_completamente_novos: alunosNovos.size,
  },
  divergencias: divergencias.map(d => ({
    aluno: d.aluno, idUsuario: d.idUsuario, trilha: d.trilha,
    turma: d.turma, competencia: d.competencia,
    acId: d.acId, assessmentPdiId: d.assessmentPdiId,
    changes: d.changes,
  })),
  novos: soNaPlanilha,
  so_no_banco: soNoBanco,
};

fs.writeFileSync('/home/ubuntu/relatorio_impacto_final.json', JSON.stringify(relatorio, null, 2));
console.log(`\nRelatório completo salvo em /home/ubuntu/relatorio_impacto_final.json`);

await conn.end();
