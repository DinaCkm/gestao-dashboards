import 'dotenv/config';
import mysql2 from 'mysql2/promise';
import fs from 'fs';

const conn = await mysql2.createConnection(process.env.DATABASE_URL);

// Mapeamento: coluna "Trilha" da planilha → turmaId + trilha real + programId
const turmaMapping = {
  '[2024] SEBRAE Acre - Turma 1.0':                    { turmaId: 30001, trilha: 'Basic', programId: 16 },
  '[2025] Sebrae Acre - B.E.M. | Básicas':             { turmaId: 30004, trilha: 'Basic', programId: 16 },
  '[2025] Sebrae Acre - B.E.M. | Essenciais':          { turmaId: 30006, trilha: 'Essential', programId: 16 },
  '[2025] Sebrae Acre - B.E.M. | Masters':             { turmaId: 30010, trilha: 'Master', programId: 16 },
  '[2025] Embrapii | Básicas':                          { turmaId: 30002, trilha: 'Basic', programId: 18 },
  '[2025] Embrapii | Jornada Personalizada':            { turmaId: 30009, trilha: 'Jornada Personalizada', programId: 18 },
  '[2026] Embrapii | Visão Do Futuro':                  { turmaId: 30011, trilha: 'Visão de Futuro', programId: 18 },
  '[2025] SEBRAE Tocantins - Básicas [BS1]':            { turmaId: 30005, trilha: 'Basic', programId: 17 },
  '[2025] SEBRAE Tocantins - Básicas [BS3]':            { turmaId: 30008, trilha: 'Basic', programId: 17 },
  '[2025] SEBRAE Tocantins - Essenciais [BS1]':         { turmaId: 30007, trilha: 'Essential', programId: 17 },
  '[2025] SEBRAE Tocantins - Visão de Futuro [BS2]':    { turmaId: 30003, trilha: 'Visão de Futuro', programId: 17 },
  '[2026] SEBRAE Tocantins - Essenciais [BS3]':         { turmaId: null, trilha: 'Essential', programId: 17 }, // será criada
};

function normalizeDate(d) {
  if (!d) return null;
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  try {
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
  } catch(e) {}
  const m = s.match(/(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  return null;
}

try {
  // ============================================================
  // PASSO 1: Criar turma [2026] SEBRAE Tocantins - Essenciais [BS3] se não existir
  // ============================================================
  console.log('PASSO 1: Verificando turma [2026] SEBRAE Tocantins - Essenciais [BS3]...');
  const [existingTurma] = await conn.execute(
    `SELECT id FROM turmas WHERE name LIKE '%2026%Tocantins%Essential%BS3%'`
  );
  let novaTurmaId;
  if (existingTurma.length === 0) {
    const [result] = await conn.execute(
      `INSERT INTO turmas (name, externalId, programId, year, isActive) VALUES (?, ?, ?, ?, ?)`,
      ['[2026] SEBRAE Tocantins - Essential [BS3]', 'BS3_2026_TO', 17, 2026, 1]
    );
    novaTurmaId = result.insertId;
    console.log(`  Turma criada com ID: ${novaTurmaId}`);
  } else {
    novaTurmaId = existingTurma[0].id;
    console.log(`  Turma já existe com ID: ${novaTurmaId}`);
  }
  turmaMapping['[2026] SEBRAE Tocantins - Essenciais [BS3]'].turmaId = novaTurmaId;

  // ============================================================
  // PASSO 2: Carregar trilhas e competências do banco
  // ============================================================
  console.log('\nPASSO 2: Carregando trilhas e competências...');
  const [trilhasDb] = await conn.execute(`SELECT id, name FROM trilhas`);
  const trilhaByName = {};
  for (const t of trilhasDb) trilhaByName[t.name] = t.id;
  console.log(`  Trilhas: ${Object.keys(trilhaByName).join(', ')}`);

  const [compsDb] = await conn.execute(`SELECT id, nome, trilhaId FROM competencias`);
  // Mapear competência por nome + trilhaId
  const compMap = {};
  for (const c of compsDb) {
    const trilhaNome = trilhasDb.find(t => t.id === c.trilhaId)?.name || '';
    compMap[`${c.nome}|${trilhaNome}`] = c.id;
  }
  console.log(`  Competências carregadas: ${Object.keys(compMap).length}`);

  // ============================================================
  // PASSO 3: Verificar/criar alunos que não existem no banco
  // ============================================================
  console.log('\nPASSO 3: Verificando alunos...');
  const planilhaData = JSON.parse(fs.readFileSync('/home/ubuntu/planilha_parsed.json', 'utf-8'));
  
  // Alunos únicos da planilha
  const alunosPlanilha = {};
  for (const r of planilhaData) {
    if (!alunosPlanilha[r.id_usuario]) {
      const mapping = turmaMapping[r.trilha];
      alunosPlanilha[r.id_usuario] = {
        nome: r.nome,
        empresa: r.empresa,
        programId: mapping?.programId,
        turmaId: mapping?.turmaId,
      };
    }
  }

  // Verificar quais existem no banco
  const [alunosDb] = await conn.execute(`SELECT id, externalId, name FROM alunos WHERE externalId IS NOT NULL`);
  const alunoByExtId = {};
  for (const a of alunosDb) alunoByExtId[a.externalId] = a;

  let alunosCriados = 0;
  for (const [extId, info] of Object.entries(alunosPlanilha)) {
    if (!alunoByExtId[extId]) {
      const [result] = await conn.execute(
        `INSERT INTO alunos (externalId, name, programId, turmaId, isActive, canLogin) VALUES (?, ?, ?, ?, 1, 1)`,
        [extId, info.nome, info.programId, info.turmaId]
      );
      alunoByExtId[extId] = { id: result.insertId, externalId: extId, name: info.nome };
      alunosCriados++;
      console.log(`  Aluno criado: ${info.nome} (${extId}) → ID ${result.insertId}`);
    }
  }
  console.log(`  Alunos verificados: ${Object.keys(alunosPlanilha).length}, criados: ${alunosCriados}`);

  // ============================================================
  // PASSO 4: Apagar todos os assessments existentes
  // ============================================================
  console.log('\nPASSO 4: Apagando assessments existentes...');
  const [countComp] = await conn.execute(`SELECT COUNT(*) as cnt FROM assessment_competencias`);
  const [countPdi] = await conn.execute(`SELECT COUNT(*) as cnt FROM assessment_pdi`);
  console.log(`  assessment_competencias: ${countComp[0].cnt} registros`);
  console.log(`  assessment_pdi: ${countPdi[0].cnt} registros`);

  await conn.execute(`DELETE FROM assessment_competencias`);
  await conn.execute(`DELETE FROM assessment_pdi`);
  console.log(`  Todos os assessments apagados.`);

  // ============================================================
  // PASSO 5: Recriar assessments com base na planilha
  // ============================================================
  console.log('\nPASSO 5: Recriando assessments...');
  
  // Agrupar planilha por: aluno + turma (coluna Trilha) → um assessment_pdi por combinação
  const pdiGroups = {};
  for (const r of planilhaData) {
    const mapping = turmaMapping[r.trilha];
    if (!mapping) {
      console.log(`  AVISO: Trilha não mapeada: ${r.trilha}`);
      continue;
    }
    const aluno = alunoByExtId[r.id_usuario];
    if (!aluno) {
      console.log(`  AVISO: Aluno não encontrado: ${r.nome} (${r.id_usuario})`);
      continue;
    }
    
    const trilhaId = trilhaByName[mapping.trilha];
    if (!trilhaId) {
      console.log(`  AVISO: Trilha não encontrada no banco: ${mapping.trilha}`);
      continue;
    }

    const pdiKey = `${aluno.id}|${trilhaId}|${mapping.turmaId}`;
    if (!pdiGroups[pdiKey]) {
      pdiGroups[pdiKey] = {
        alunoId: aluno.id,
        trilhaId: trilhaId,
        turmaId: mapping.turmaId,
        programId: mapping.programId,
        macroInicio: normalizeDate(r.macro_inicio),
        macroTermino: normalizeDate(r.macro_fim),
        competencias: [],
      };
    }
    
    // Atualizar macro datas (pegar a mais ampla)
    const macroI = normalizeDate(r.macro_inicio);
    const macroF = normalizeDate(r.macro_fim);
    if (macroI && (!pdiGroups[pdiKey].macroInicio || macroI < pdiGroups[pdiKey].macroInicio)) {
      pdiGroups[pdiKey].macroInicio = macroI;
    }
    if (macroF && (!pdiGroups[pdiKey].macroTermino || macroF > pdiGroups[pdiKey].macroTermino)) {
      pdiGroups[pdiKey].macroTermino = macroF;
    }

    // Buscar competenciaId
    const compKey = `${r.competencia}|${mapping.trilha}`;
    let competenciaId = compMap[compKey];
    
    // Tentar variações de nome se não encontrou
    if (!competenciaId) {
      // Gestão de Tempo → Gestão do Tempo
      const variations = [
        `Gestão do Tempo|${mapping.trilha}`,
        `Gestão de Tempo|${mapping.trilha}`,
        `Mentalidade Sistêmica|${mapping.trilha}`,
        `Gestão de Conflitos|${mapping.trilha}`,
        `Relacionamentos Conectivos|${mapping.trilha}`,
      ];
      for (const v of variations) {
        if (compMap[v] && (r.competencia === 'Gestão de Tempo' || r.competencia === 'Gestão do Tempo' || 
            r.competencia === 'Mentalidade Sistêmica' || r.competencia === 'Gestão de Conflitos' ||
            r.competencia === 'Relacionamentos Conectivos')) {
          if (v.startsWith(r.competencia.replace('de Tempo', 'do Tempo').replace('de Tempo', 'de Tempo'))) {
            competenciaId = compMap[v];
            break;
          }
        }
      }
      // Busca mais genérica: por nome sem trilha
      if (!competenciaId) {
        for (const [k, v] of Object.entries(compMap)) {
          if (k.startsWith(r.competencia + '|')) {
            competenciaId = v;
            break;
          }
        }
      }
    }

    if (!competenciaId) {
      console.log(`  AVISO: Competência não encontrada: "${r.competencia}" na trilha "${mapping.trilha}"`);
      continue;
    }

    const peso = r.tipo.toLowerCase() === 'obrigatória' ? 'obrigatoria' : 'opcional';
    pdiGroups[pdiKey].competencias.push({
      competenciaId,
      peso,
      microInicio: normalizeDate(r.micro_inicio),
      microTermino: normalizeDate(r.micro_fim),
    });
  }

  console.log(`  PDIs a criar: ${Object.keys(pdiGroups).length}`);

  let totalPdis = 0;
  let totalComps = 0;
  let erros = 0;

  for (const [key, pdi] of Object.entries(pdiGroups)) {
    try {
      // Inserir assessment_pdi
      const [pdiResult] = await conn.execute(
        `INSERT INTO assessment_pdi (alunoId, trilhaId, turmaId, programId, macroInicio, macroTermino, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'ativo')`,
        [pdi.alunoId, pdi.trilhaId, pdi.turmaId, pdi.programId, pdi.macroInicio, pdi.macroTermino]
      );
      const pdiId = pdiResult.insertId;
      totalPdis++;

      // Inserir competências
      for (const comp of pdi.competencias) {
        await conn.execute(
          `INSERT INTO assessment_competencias (assessmentPdiId, competenciaId, peso, microInicio, microTermino) 
           VALUES (?, ?, ?, ?, ?)`,
          [pdiId, comp.competenciaId, comp.peso, comp.microInicio, comp.microTermino]
        );
        totalComps++;
      }
    } catch (err) {
      erros++;
      console.log(`  ERRO ao inserir PDI ${key}: ${err.message}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`  RESULTADO FINAL`);
  console.log(`========================================`);
  console.log(`  assessment_pdi criados:          ${totalPdis}`);
  console.log(`  assessment_competencias criados:  ${totalComps}`);
  console.log(`  Erros:                           ${erros}`);

  // Verificação final
  const [finalComp] = await conn.execute(`SELECT COUNT(*) as cnt FROM assessment_competencias`);
  const [finalPdi] = await conn.execute(`SELECT COUNT(*) as cnt FROM assessment_pdi`);
  console.log(`\n  Verificação no banco:`);
  console.log(`  assessment_pdi:          ${finalPdi[0].cnt}`);
  console.log(`  assessment_competencias: ${finalComp[0].cnt}`);

} catch (err) {
  console.error('ERRO FATAL:', err);
} finally {
  await conn.end();
}
