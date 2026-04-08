import 'dotenv/config';
import mysql2 from 'mysql2/promise';
import fs from 'fs';

const conn = await mysql2.createConnection(process.env.DATABASE_URL);

// 1. Buscar todos os assessments PDI com competências
const [assessments] = await conn.execute(`
  SELECT ap.id, ap.alunoId, ap.trilhaId, ap.macroInicio, ap.macroTermino, ap.status,
         a.name as alunoNome, a.externalId as alunoExternalId, a.email as alunoEmail,
         t.name as trilhaNome,
         p.name as programaNome
  FROM assessment_pdi ap
  LEFT JOIN alunos a ON ap.alunoId = a.id
  LEFT JOIN trilhas t ON ap.trilhaId = t.id
  LEFT JOIN programs p ON ap.programId = p.id
  ORDER BY ap.alunoId, ap.trilhaId
`);
console.log(`\n=== ASSESSMENTS NO BANCO ===`);
console.log(`Total de assessments: ${assessments.length}`);

// 2. Buscar competências de cada assessment
const [competencias] = await conn.execute(`
  SELECT ac.id, ac.assessmentPdiId, ac.competenciaId, ac.peso, ac.microInicio, ac.microTermino,
         c.nome as competenciaNome,
         ap.alunoId, a.externalId as alunoExternalId, a.name as alunoNome,
         t.name as trilhaNome
  FROM assessment_competencias ac
  LEFT JOIN assessment_pdi ap ON ac.assessmentPdiId = ap.id
  LEFT JOIN competencias c ON ac.competenciaId = c.id
  LEFT JOIN alunos a ON ap.alunoId = a.id
  LEFT JOIN trilhas t ON ap.trilhaId = t.id
  ORDER BY ap.alunoId, t.name, c.nome
`);
console.log(`Total de assessment_competencias: ${competencias.length}`);

// 3. Buscar trilhas e competências cadastradas
const [trilhas] = await conn.execute(`SELECT id, name FROM trilhas ORDER BY id`);
console.log(`\nTrilhas cadastradas: ${trilhas.length}`);
trilhas.forEach(t => console.log(`  ID ${t.id}: ${t.name}`));

const [comps] = await conn.execute(`SELECT id, nome, trilhaId FROM competencias ORDER BY trilhaId, nome`);
console.log(`\nCompetências cadastradas: ${comps.length}`);

// 4. Carregar planilha parseada
const planilhaData = JSON.parse(fs.readFileSync('/home/ubuntu/planilha_parsed.json', 'utf-8'));

// 5. Agrupar dados do banco por aluno (externalId) + trilha + competência
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
    microInicio: c.microInicio,
    microTermino: c.microTermino,
  };
}

// 6. Agrupar dados da planilha por id_usuario + trilha + competência
const planilhaMap = {};
for (const r of planilhaData) {
  const key = `${r.id_usuario}|${r.trilha}|${r.competencia}`;
  planilhaMap[key] = {
    empresa: r.empresa,
    idUsuario: r.id_usuario,
    nome: r.nome,
    trilha: r.trilha,
    competencia: r.competencia,
    tipo: r.tipo,
    macroInicio: r.macro_inicio ? r.macro_inicio.split(' ')[0] : '',
    macroFim: r.macro_fim ? r.macro_fim.split(' ')[0] : '',
    microInicio: r.micro_inicio ? r.micro_inicio.split(' ')[0] : '',
    microFim: r.micro_fim ? r.micro_fim.split(' ')[0] : '',
  };
}

// 7. Comparação
const soNaPlanilha = [];
const soNoBanco = [];
const divergencias = [];
const iguais = [];

// Verificar planilha vs banco
for (const [key, plan] of Object.entries(planilhaMap)) {
  if (bancoMap[key]) {
    const banco = bancoMap[key];
    const bancoMicroInicio = banco.microInicio ? String(banco.microInicio).split('T')[0] : '';
    const bancoMicroTermino = banco.microTermino ? String(banco.microTermino).split('T')[0] : '';
    const planMicroInicio = plan.microInicio;
    const planMicroFim = plan.microFim;
    
    if (bancoMicroInicio !== planMicroInicio || bancoMicroTermino !== planMicroFim) {
      divergencias.push({
        key,
        aluno: plan.nome,
        idUsuario: plan.idUsuario,
        trilha: plan.trilha,
        competencia: plan.competencia,
        banco_microInicio: bancoMicroInicio,
        banco_microTermino: bancoMicroTermino,
        plan_microInicio: planMicroInicio,
        plan_microFim: planMicroFim,
        banco_peso: banco.peso,
        plan_tipo: plan.tipo,
      });
    } else {
      iguais.push(key);
    }
  } else {
    soNaPlanilha.push(plan);
  }
}

// Verificar banco vs planilha
for (const [key, banco] of Object.entries(bancoMap)) {
  if (!planilhaMap[key]) {
    soNoBanco.push(banco);
  }
}

console.log(`\n=== RESULTADO DA COMPARAÇÃO ===`);
console.log(`Registros iguais (sem mudança): ${iguais.length}`);
console.log(`Registros com divergência de datas: ${divergencias.length}`);
console.log(`Registros só na planilha (novos): ${soNaPlanilha.length}`);
console.log(`Registros só no banco (não estão na planilha): ${soNoBanco.length}`);

if (divergencias.length > 0) {
  console.log(`\n=== DIVERGÊNCIAS (primeiras 20) ===`);
  divergencias.slice(0, 20).forEach(d => {
    console.log(`  ${d.aluno} (${d.idUsuario}) | ${d.trilha} | ${d.competencia}`);
    console.log(`    Banco:    micro ${d.banco_microInicio} -> ${d.banco_microTermino} | peso: ${d.banco_peso}`);
    console.log(`    Planilha: micro ${d.plan_microInicio} -> ${d.plan_microFim} | tipo: ${d.plan_tipo}`);
  });
}

if (soNaPlanilha.length > 0) {
  console.log(`\n=== SÓ NA PLANILHA - primeiros 20 (precisam ser criados no banco) ===`);
  soNaPlanilha.slice(0, 20).forEach(p => {
    console.log(`  ${p.nome} (${p.idUsuario}) | ${p.trilha} | ${p.competencia}`);
  });
}

if (soNoBanco.length > 0) {
  console.log(`\n=== SÓ NO BANCO - primeiros 20 (não estão na planilha) ===`);
  soNoBanco.slice(0, 20).forEach(b => {
    console.log(`  ${b.alunoNome} (${b.alunoExternalId}) | ${b.trilha} | ${b.competencia}`);
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
  },
  divergencias,
  so_na_planilha: soNaPlanilha,
  so_no_banco: soNoBanco,
};

fs.writeFileSync('/home/ubuntu/relatorio_comparacao.json', JSON.stringify(relatorio, null, 2));
console.log(`\nRelatório completo salvo em /home/ubuntu/relatorio_comparacao.json`);

await conn.end();
