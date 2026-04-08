import 'dotenv/config';
import mysql2 from 'mysql2/promise';
import fs from 'fs';

const conn = await mysql2.createConnection(process.env.DATABASE_URL);

// Mapeamento de nomes de trilha da planilha para nomes no banco
// Planilha usa nomes descritivos, banco usa nomes genéricos
const trilhaMapping = {
  // Sebrae Acre
  '[2024] SEBRAE Acre - Turma 1.0': 'Basic', // Turma antiga
  '[2025] Sebrae Acre - B.E.M. | Básicas': 'Basic',
  '[2025] Sebrae Acre - B.E.M. | Essenciais': 'Essential',
  '[2025] Sebrae Acre - B.E.M. | Masters': 'Master',
  // Embrapii
  '[2025] Embrapii | Básicas': 'Basic',
  '[2025] Embrapii | Jornada Personalizada': 'Jornada Personalizada',
  '[2026] Embrapii | Visão Do Futuro': 'Visão de Futuro',
  // Sebrae Tocantins
  '[2025] SEBRAE Tocantins - Básicas [BS1]': 'Basic',
  '[2025] SEBRAE Tocantins - Básicas [BS3]': 'Basic',
  '[2025] SEBRAE Tocantins - Essenciais [BS1]': 'Essential',
  '[2025] SEBRAE Tocantins - Visão de Futuro [BS2]': 'Visão de Futuro',
  '[2026] SEBRAE Tocantins - Essenciais [BS3]': 'Essential',
};

// Mapeamento de competências (normalizar nomes com acentos/variações)
const compMapping = {
  'Gestão de Conflitos': 'Gestão de Conflitos',
  'Gestão de Tempo': 'Gestão do Tempo',
  'Mentalidade Sistêmica': 'Mentalidade Sistêmica',
  'Relacionamentos Conectivos': 'Relacionamentos Conectivos',
};

function normalizeDate(d) {
  if (!d) return '';
  const s = String(d);
  // Se já é YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Se é Date object ou string com timezone
  try {
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) {
      return dt.toISOString().split('T')[0];
    }
  } catch(e) {}
  // Tentar extrair YYYY-MM-DD do início
  const m = s.match(/(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  return s;
}

function normalizeTrilha(planilhaTrilha) {
  return trilhaMapping[planilhaTrilha] || planilhaTrilha;
}

function normalizeComp(comp) {
  return compMapping[comp] || comp;
}

// 1. Buscar dados do banco
const [competencias] = await conn.execute(`
  SELECT ac.id, ac.assessmentPdiId, ac.competenciaId, ac.peso, ac.microInicio, ac.microTermino,
         c.nome as competenciaNome,
         ap.alunoId, ap.macroInicio, ap.macroTermino,
         a.externalId as alunoExternalId, a.name as alunoNome,
         t.name as trilhaNome,
         p.name as programaNome
  FROM assessment_competencias ac
  LEFT JOIN assessment_pdi ap ON ac.assessmentPdiId = ap.id
  LEFT JOIN competencias c ON ac.competenciaId = c.id
  LEFT JOIN alunos a ON ap.alunoId = a.id
  LEFT JOIN trilhas t ON ap.trilhaId = t.id
  LEFT JOIN programs p ON ap.programId = p.id
  ORDER BY ap.alunoId, t.name, c.nome
`);

console.log(`Total assessment_competencias no banco: ${competencias.length}`);

// 2. Carregar planilha
const planilhaData = JSON.parse(fs.readFileSync('/home/ubuntu/planilha_parsed.json', 'utf-8'));
console.log(`Total registros na planilha: ${planilhaData.length}`);

// 3. Agrupar banco por externalId + trilha normalizada + competência
const bancoMap = {};
for (const c of competencias) {
  const key = `${c.alunoExternalId}|${c.trilhaNome}|${c.competenciaNome}`;
  bancoMap[key] = {
    assessmentCompId: c.id,
    assessmentPdiId: c.assessmentPdiId,
    alunoId: c.alunoId,
    alunoExternalId: c.alunoExternalId,
    alunoNome: c.alunoNome,
    trilha: c.trilhaNome,
    competencia: c.competenciaNome,
    peso: c.peso,
    microInicio: normalizeDate(c.microInicio),
    microTermino: normalizeDate(c.microTermino),
    macroInicio: normalizeDate(c.macroInicio),
    macroTermino: normalizeDate(c.macroTermino),
    programa: c.programaNome,
  };
}

// 4. Agrupar planilha por id_usuario + trilha normalizada + competência normalizada
const planilhaMap = {};
for (const r of planilhaData) {
  const trilhaNorm = normalizeTrilha(r.trilha);
  const compNorm = normalizeComp(r.competencia);
  const key = `${r.id_usuario}|${trilhaNorm}|${compNorm}`;
  planilhaMap[key] = {
    empresa: r.empresa,
    idUsuario: r.id_usuario,
    nome: r.nome,
    trilhaOriginal: r.trilha,
    trilhaNorm: trilhaNorm,
    competencia: r.competencia,
    competenciaNorm: compNorm,
    tipo: r.tipo,
    macroInicio: normalizeDate(r.macro_inicio),
    macroFim: normalizeDate(r.macro_fim),
    microInicio: normalizeDate(r.micro_inicio),
    microFim: normalizeDate(r.micro_fim),
  };
}

// 5. Comparação
const soNaPlanilha = [];
const soNoBanco = [];
const divergencias = [];
const iguais = [];

for (const [key, plan] of Object.entries(planilhaMap)) {
  if (bancoMap[key]) {
    const banco = bancoMap[key];
    const changes = [];
    
    if (banco.microInicio !== plan.microInicio) {
      changes.push(`microInicio: ${banco.microInicio} → ${plan.microInicio}`);
    }
    if (banco.microTermino !== plan.microFim) {
      changes.push(`microTermino: ${banco.microTermino} → ${plan.microFim}`);
    }
    if (banco.macroInicio !== plan.macroInicio) {
      changes.push(`macroInicio: ${banco.macroInicio} → ${plan.macroInicio}`);
    }
    if (banco.macroTermino !== plan.macroFim) {
      changes.push(`macroTermino: ${banco.macroTermino} → ${plan.macroFim}`);
    }
    // Comparar peso
    const planPeso = plan.tipo.toLowerCase() === 'obrigatória' ? 'obrigatoria' : 'opcional';
    if (banco.peso !== planPeso) {
      changes.push(`peso: ${banco.peso} → ${planPeso}`);
    }
    
    if (changes.length > 0) {
      divergencias.push({
        key,
        aluno: plan.nome,
        idUsuario: plan.idUsuario,
        trilha: plan.trilhaNorm,
        trilhaOriginal: plan.trilhaOriginal,
        competencia: plan.competenciaNorm,
        changes,
        banco,
        planilha: plan,
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

console.log(`\n=== RESULTADO DA COMPARAÇÃO (com mapeamento de trilhas) ===`);
console.log(`Registros iguais (sem mudança): ${iguais.length}`);
console.log(`Registros com divergência: ${divergencias.length}`);
console.log(`Registros só na planilha (novos): ${soNaPlanilha.length}`);
console.log(`Registros só no banco (não na planilha): ${soNoBanco.length}`);

// Resumo das divergências por tipo
const changeTypes = {};
for (const d of divergencias) {
  for (const c of d.changes) {
    const type = c.split(':')[0];
    changeTypes[type] = (changeTypes[type] || 0) + 1;
  }
}
console.log(`\nTipos de divergência:`);
for (const [type, cnt] of Object.entries(changeTypes)) {
  console.log(`  ${type}: ${cnt} registros`);
}

// Agrupar "só na planilha" por trilha original
const novoPorTrilha = {};
for (const p of soNaPlanilha) {
  novoPorTrilha[p.trilhaOriginal] = (novoPorTrilha[p.trilhaOriginal] || 0) + 1;
}
console.log(`\nNovos registros por trilha:`);
for (const [t, cnt] of Object.entries(novoPorTrilha).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t}: ${cnt}`);
}

// Agrupar "só no banco" por trilha
const bancoPorTrilha = {};
for (const b of soNoBanco) {
  bancoPorTrilha[b.trilha] = (bancoPorTrilha[b.trilha] || 0) + 1;
}
console.log(`\nRegistros só no banco por trilha:`);
for (const [t, cnt] of Object.entries(bancoPorTrilha).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t}: ${cnt}`);
}

// Mostrar exemplos de divergências
if (divergencias.length > 0) {
  console.log(`\n=== EXEMPLOS DE DIVERGÊNCIAS (primeiras 15) ===`);
  divergencias.slice(0, 15).forEach(d => {
    console.log(`  ${d.aluno} (${d.idUsuario}) | ${d.trilhaOriginal} | ${d.competencia}`);
    d.changes.forEach(c => console.log(`    ${c}`));
  });
}

// Mostrar exemplos de novos
if (soNaPlanilha.length > 0) {
  console.log(`\n=== EXEMPLOS DE NOVOS (primeiros 10) ===`);
  soNaPlanilha.slice(0, 10).forEach(p => {
    console.log(`  ${p.nome} (${p.idUsuario}) | ${p.trilhaOriginal} → ${p.trilhaNorm} | ${p.competencia}`);
  });
}

// Salvar relatório
const relatorio = {
  resumo: {
    total_planilha: Object.keys(planilhaMap).length,
    total_banco: Object.keys(bancoMap).length,
    iguais: iguais.length,
    divergencias: divergencias.length,
    so_na_planilha: soNaPlanilha.length,
    so_no_banco: soNoBanco.length,
    tipos_divergencia: changeTypes,
  },
  divergencias: divergencias.map(d => ({
    aluno: d.aluno, idUsuario: d.idUsuario, trilha: d.trilha, 
    trilhaOriginal: d.trilhaOriginal, competencia: d.competencia, changes: d.changes
  })),
  novos: soNaPlanilha,
  so_no_banco: soNoBanco,
};

fs.writeFileSync('/home/ubuntu/relatorio_comparacao_v2.json', JSON.stringify(relatorio, null, 2));
console.log(`\nRelatório salvo em /home/ubuntu/relatorio_comparacao_v2.json`);

await conn.end();
