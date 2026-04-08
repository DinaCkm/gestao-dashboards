import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const CSV_PATH = '/home/ubuntu/upload/relatorio-de-performance-2026-02-13-698f2d6ebbe45.csv';

// Mapeamento de competências da planilha → trilha
const COMPETENCIA_TRILHA_MAP = {
  'Atenção - Básica': 'Básica',
  'Autopercepção - Básica': 'Básica',
  'Disciplina - Básica': 'Básica',
  'Empatia - Básica': 'Básica',
  'Escuta Ativa - Básica': 'Básica',
  'Gestão do Tempo - Básica': 'Básica',
  'Memória - Básica': 'Básica',
  'Raciocínio Lógico e Espacial - Básica': 'Básica',
  'Adaptabilidade - Essencial': 'Essencial',
  'Comunicação Assertiva - Essencial': 'Essencial',
  'Inteligência Emocional - Essencial': 'Essencial',
  'Leitura de Cenário - Essencial': 'Essencial',
  'Planejamento e Organização - Essencial': 'Essencial',
  'Proatividade - Essencial': 'Essencial',
  'Resiliência - Essencial': 'Essencial',
  'Accountability - Master': 'Master',
  'Foco em Resultados - Master': 'Master',
  'Gestão de Conflitos - Master': 'Master',
  'Gestão de Equipes - Master': 'Master',
  'Influência - Master': 'Master',
  'Negociação - Master': 'Master',
  'Presença Executiva - Master': 'Master',
  'Protagonismo - Master': 'Master',
  'Relacionamentos Conectivos - Master': 'Master',
  'Responsabilidade Social - Master': 'Master',
  'Tomada de Decisão - Master': 'Master',
  'Visão Estratégica - Master': 'Master',
  'Adaptabilidade Dinâmica - Visão de Futuro': 'Visão de Futuro',
  'Arquitetura de Mudanças - Visão de Futuro': 'Visão de Futuro',
  'Decisões Ágeis - Visão de Futuro': 'Visão de Futuro',
  'Estratégia de Longo Alcance - Visão de Futuro': 'Visão de Futuro',
  'Gestão da Comunicação - Visão de Futuro': 'Visão de Futuro',
  'Inteligência Emocional Tática - Visão de Futuro': 'Visão de Futuro',
  'Mentalidade Sistêmica - Visão de Futuro': 'Visão de Futuro',
  'Mindset Visionário - Visão de Futuro': 'Visão de Futuro',
  'Radar de Cenários - Visão de Futuro': 'Visão de Futuro',
};

// Extrair nome limpo da competência (sem " - Trilha")
function cleanCompName(fullName) {
  const parts = fullName.split(' - ');
  if (parts.length > 1) {
    return parts.slice(0, -1).join(' - ');
  }
  return fullName;
}

// Identificar empresa a partir do nome da turma
function identifyProgram(turmaName) {
  if (turmaName.includes('SEBRAE Acre')) return 'SEBRAE_ACRE';
  if (turmaName.includes('SEBRAE Tocantins')) return 'SEBRAE_TO';
  if (turmaName.includes('Embrapii') || turmaName.includes('EMBRAPII')) return 'EMBRAPII';
  return null;
}

// Identificar ano da turma
function extractYear(turmaName) {
  const match = turmaName.match(/\[(\d{4})\]/);
  return match ? parseInt(match[1]) : 2025;
}

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL);
  
  // 1. Ler CSV
  console.log('📖 Lendo planilha CSV...');
  const csvContent = readFileSync(CSV_PATH, 'utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true, bom: true });
  console.log(`   ${records.length} registros lidos`);
  
  // 2. Obter IDs dos programas
  const [programRows] = await pool.query('SELECT id, code FROM programs');
  const programMap = {};
  for (const p of programRows) {
    programMap[p.code] = p.id;
  }
  console.log('📋 Programas:', programMap);
  
  const BANRISUL_ID = programMap['BANRISUL'];
  
  // 3. Obter turmas do BANRISUL para preservar
  const [banrisulTurmas] = await pool.query('SELECT id FROM turmas WHERE programId = ?', [BANRISUL_ID]);
  const banrisulTurmaIds = banrisulTurmas.map(t => t.id);
  console.log(`🏦 BANRISUL: ${banrisulTurmaIds.length} turmas preservadas`);
  
  // 4. Obter alunos do BANRISUL para preservar
  const [banrisulAlunos] = await pool.query('SELECT id FROM alunos WHERE programId = ?', [BANRISUL_ID]);
  const banrisulAlunoIds = banrisulAlunos.map(a => a.id);
  console.log(`🏦 BANRISUL: ${banrisulAlunoIds.length} alunos preservados`);
  
  // 5. Limpar dados antigos (exceto BANRISUL)
  console.log('\n🗑️ Limpando dados antigos (exceto BANRISUL)...');
  
  // 5a. Limpar plano_individual dos alunos não-BANRISUL
  if (banrisulAlunoIds.length > 0) {
    await pool.query(`DELETE FROM plano_individual WHERE alunoId NOT IN (${banrisulAlunoIds.join(',')})`);
  } else {
    await pool.query('DELETE FROM plano_individual');
  }
  console.log('   ✅ plano_individual limpo');
  
  // 5b. Limpar ciclo_competencias e ciclos_execucao dos alunos não-BANRISUL
  if (banrisulAlunoIds.length > 0) {
    const [ciclosNaoBanrisul] = await pool.query(`SELECT id FROM ciclos_execucao WHERE alunoId NOT IN (${banrisulAlunoIds.join(',')})`);
    if (ciclosNaoBanrisul.length > 0) {
      const cicloIds = ciclosNaoBanrisul.map(c => c.id);
      await pool.query(`DELETE FROM ciclo_competencias WHERE cicloId IN (${cicloIds.join(',')})`);
      await pool.query(`DELETE FROM ciclos_execucao WHERE id IN (${cicloIds.join(',')})`);
    }
  } else {
    await pool.query('DELETE FROM ciclo_competencias');
    await pool.query('DELETE FROM ciclos_execucao');
  }
  console.log('   ✅ ciclos limpos');
  
  // 5c. Limpar alunos não-BANRISUL
  if (banrisulAlunoIds.length > 0) {
    await pool.query(`DELETE FROM alunos WHERE programId != ? OR programId IS NULL`, [BANRISUL_ID]);
  } else {
    await pool.query('DELETE FROM alunos');
  }
  const [remainingAlunos] = await pool.query('SELECT COUNT(*) as c FROM alunos');
  console.log(`   ✅ alunos limpos (${remainingAlunos[0].c} restantes = BANRISUL)`);
  
  // 5d. Limpar turmas não-BANRISUL
  if (banrisulTurmaIds.length > 0) {
    await pool.query(`DELETE FROM turmas WHERE programId != ?`, [BANRISUL_ID]);
  } else {
    await pool.query('DELETE FROM turmas');
  }
  const [remainingTurmas] = await pool.query('SELECT COUNT(*) as c FROM turmas');
  console.log(`   ✅ turmas limpas (${remainingTurmas[0].c} restantes = BANRISUL)`);
  
  // 6. Atualizar trilhas - renomear "Jornada do Futuro" para "Visão de Futuro" e "Básicas" para "Básica"
  console.log('\n🔄 Atualizando trilhas...');
  await pool.query("UPDATE trilhas SET name = 'Básica', codigo = 'BASICA' WHERE codigo = 'BASICAS'");
  await pool.query("UPDATE trilhas SET name = 'Essencial', codigo = 'ESSENCIAL' WHERE codigo = 'ESSENCIAIS'");
  await pool.query("UPDATE trilhas SET name = 'Visão de Futuro', codigo = 'VISAO_FUTURO' WHERE codigo = 'JORNADA_FUTURO'");
  
  // Obter trilhas atualizadas
  const [trilhaRows] = await pool.query('SELECT id, name, codigo FROM trilhas');
  const trilhaMap = {};
  for (const t of trilhaRows) {
    trilhaMap[t.name] = t.id;
  }
  console.log('   Trilhas:', JSON.stringify(trilhaMap));
  
  // 7. Limpar competências antigas e criar novas
  console.log('\n🔄 Atualizando competências...');
  
  // Limpar competências antigas (os plano_individual já foram limpos)
  await pool.query('DELETE FROM competencias');
  
  // Criar novas competências da planilha
  const uniqueComps = [...new Set(records.map(r => r['Competência (agrupador 2)']))];
  const compMap = {}; // nome completo → id
  
  for (let i = 0; i < uniqueComps.length; i++) {
    const fullName = uniqueComps[i];
    const trilhaName = COMPETENCIA_TRILHA_MAP[fullName];
    const cleanName = cleanCompName(fullName);
    const trilhaId = trilhaMap[trilhaName];
    const externalId = records.find(r => r['Competência (agrupador 2)'] === fullName)['Id Competência (agrupador 2)'];
    
    if (!trilhaId) {
      console.log(`   ⚠️ Trilha não encontrada para: ${fullName} (trilha: ${trilhaName})`);
      continue;
    }
    
    const codigo = cleanName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
    
    const [result] = await pool.query(
      'INSERT INTO competencias (nome, trilhaId, codigoIntegracao, descricao, ordem, isActive) VALUES (?, ?, ?, ?, ?, 1)',
      [cleanName, trilhaId, externalId, fullName, i + 1]
    );
    compMap[fullName] = result.insertId;
  }
  console.log(`   ✅ ${Object.keys(compMap).length} competências criadas`);
  
  // 8. Criar turmas da planilha
  console.log('\n📚 Criando turmas...');
  const uniqueTurmas = {};
  for (const r of records) {
    const turmaId = r['Id Turma (agrupador 1)'];
    if (!uniqueTurmas[turmaId]) {
      uniqueTurmas[turmaId] = r['Turma (agrupador 1)'];
    }
  }
  
  const turmaMap = {}; // externalId → db id
  for (const [extId, turmaName] of Object.entries(uniqueTurmas)) {
    const programCode = identifyProgram(turmaName);
    const programId = programMap[programCode];
    const year = extractYear(turmaName);
    
    if (!programId) {
      console.log(`   ⚠️ Programa não identificado para turma: ${turmaName}`);
      continue;
    }
    
    const [result] = await pool.query(
      'INSERT INTO turmas (externalId, name, programId, year, isActive) VALUES (?, ?, ?, ?, 1)',
      [extId, turmaName, programId, year]
    );
    turmaMap[extId] = result.insertId;
    console.log(`   ✅ Turma: ${turmaName} (ID: ${result.insertId})`);
  }
  
  // 9. Criar alunos
  console.log('\n👤 Criando alunos...');
  const uniqueAlunos = {};
  for (const r of records) {
    const alunoExtId = r['Id Usuário'];
    if (!uniqueAlunos[alunoExtId]) {
      uniqueAlunos[alunoExtId] = {
        name: r['Nome Usuário'],
        email: r['E-mail'],
        turmaExtId: r['Id Turma (agrupador 1)'],
        turmaName: r['Turma (agrupador 1)'],
      };
    }
  }
  
  const alunoMap = {}; // externalId → db id
  for (const [extId, aluno] of Object.entries(uniqueAlunos)) {
    const turmaDbId = turmaMap[aluno.turmaExtId];
    const programCode = identifyProgram(aluno.turmaName);
    const programId = programMap[programCode];
    
    // Determinar trilha principal do aluno baseada na turma
    let trilhaId = null;
    const turmaName = aluno.turmaName;
    if (turmaName.includes('Básica') || turmaName.includes('Turma 1.0')) trilhaId = trilhaMap['Básica'];
    else if (turmaName.includes('Essencia')) trilhaId = trilhaMap['Essencial'];
    else if (turmaName.includes('Master')) trilhaId = trilhaMap['Master'];
    else if (turmaName.includes('Visão') || turmaName.includes('Jornada')) trilhaId = trilhaMap['Visão de Futuro'];
    
    const [result] = await pool.query(
      'INSERT INTO alunos (externalId, name, email, turmaId, trilhaId, programId, isActive, canLogin) VALUES (?, ?, ?, ?, ?, ?, 1, 1)',
      [extId, aluno.name, aluno.email?.toLowerCase(), turmaDbId, trilhaId, programId]
    );
    alunoMap[extId] = result.insertId;
  }
  console.log(`   ✅ ${Object.keys(alunoMap).length} alunos criados`);
  
  // 10. Importar plano_individual (competências + notas)
  console.log('\n📊 Importando plano individual (competências + notas)...');
  let piCount = 0;
  let piSkipped = 0;
  
  for (const r of records) {
    const alunoExtId = r['Id Usuário'];
    const compName = r['Competência (agrupador 2)'];
    const alunoDbId = alunoMap[alunoExtId];
    const compDbId = compMap[compName];
    
    if (!alunoDbId || !compDbId) {
      piSkipped++;
      continue;
    }
    
    // Nota: usar "Média em avaliações disponíveis" (0-100)
    let nota = null;
    const notaStr = r['Média em avaliações disponíveis'];
    if (notaStr && notaStr !== '' && notaStr !== '-') {
      const notaNum = parseFloat(notaStr);
      if (!isNaN(notaNum)) {
        nota = notaNum;
      }
    }
    
    // Progresso
    const progresso = parseInt(r['Progresso Total']) || 0;
    
    // Status
    let status = 'pendente';
    if (progresso === 100) status = 'concluida';
    else if (progresso > 0) status = 'em_progresso';
    
    // Converter nota de base 100 para base 10 para o campo notaAtual
    const notaBase10 = nota !== null ? (nota / 10).toFixed(2) : null;
    
    await pool.query(
      'INSERT INTO plano_individual (alunoId, competenciaId, isObrigatoria, notaAtual, metaNota, status) VALUES (?, ?, 1, ?, 7.00, ?)',
      [alunoDbId, compDbId, notaBase10, status]
    );
    piCount++;
  }
  console.log(`   ✅ ${piCount} registros importados (${piSkipped} ignorados)`);
  
  // 11. Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA IMPORTAÇÃO');
  console.log('='.repeat(60));
  
  const [totalAlunos] = await pool.query('SELECT COUNT(*) as c FROM alunos');
  const [totalTurmas] = await pool.query('SELECT COUNT(*) as c FROM turmas');
  const [totalComps] = await pool.query('SELECT COUNT(*) as c FROM competencias');
  const [totalPI] = await pool.query('SELECT COUNT(*) as c FROM plano_individual');
  const [totalTrilhas] = await pool.query('SELECT COUNT(*) as c FROM trilhas');
  
  const [alunosPorProg] = await pool.query(`
    SELECT p.name, COUNT(a.id) as total 
    FROM alunos a 
    JOIN programs p ON a.programId = p.id 
    GROUP BY p.name 
    ORDER BY p.name
  `);
  
  console.log(`  Alunos total: ${totalAlunos[0].c}`);
  console.log(`  Turmas total: ${totalTurmas[0].c}`);
  console.log(`  Trilhas: ${totalTrilhas[0].c}`);
  console.log(`  Competências: ${totalComps[0].c}`);
  console.log(`  Plano Individual: ${totalPI[0].c}`);
  console.log('\n  Alunos por empresa:');
  for (const row of alunosPorProg) {
    console.log(`    ${row.name}: ${row.total}`);
  }
  
  await pool.end();
  console.log('\n✅ Importação concluída com sucesso!');
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
