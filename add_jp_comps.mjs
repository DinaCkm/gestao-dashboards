import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 1. Buscar trilhaId da Jornada Personalizada
const [jpRows] = await conn.query("SELECT id FROM trilhas WHERE name = 'Jornada Personalizada'");
const jpTrilhaId = jpRows[0].id;
console.log(`Jornada Personalizada trilhaId: ${jpTrilhaId}`);

// 2. Buscar todas as competências de todas as trilhas (exceto JP)
const [allComps] = await conn.query(`
  SELECT DISTINCT c.nome
  FROM competencias c
  JOIN trilhas t ON c.trilhaId = t.id
  WHERE t.name != 'Jornada Personalizada'
  ORDER BY c.nome
`);
console.log(`Total competências únicas nas outras trilhas: ${allComps.length}`);

// 3. Buscar competências já existentes na JP
const [jpExisting] = await conn.query(`
  SELECT nome FROM competencias WHERE trilhaId = ?
`, [jpTrilhaId]);
const jpExistingSet = new Set(jpExisting.map(r => r.nome));
console.log(`Competências já na JP: ${jpExistingSet.size}`);

// 4. Filtrar as que faltam
const toAdd = allComps.filter(c => !jpExistingSet.has(c.nome));
console.log(`Competências a adicionar: ${toAdd.length}`);

// 5. Inserir as competências faltantes na JP
let added = 0;
for (const comp of toAdd) {
  await conn.query(`
    INSERT INTO competencias (nome, trilhaId)
    VALUES (?, ?)
  `, [comp.nome, jpTrilhaId]);
  added++;
  console.log(`  Adicionada: ${comp.nome}`);
}
console.log(`\nTotal adicionadas: ${added}`);

// 6. Verificar total na JP agora
const [jpTotal] = await conn.query(`
  SELECT COUNT(*) as total FROM competencias WHERE trilhaId = ?
`, [jpTrilhaId]);
console.log(`Total competências na JP agora: ${jpTotal[0].total}`);

// 7. Reimportar os 4 registros faltantes da planilha
console.log('\n=== REIMPORTANDO REGISTROS FALTANTES ===');
const planilha = JSON.parse(readFileSync('/home/ubuntu/planilha_parsed.json', 'utf8'));

// Filtrar registros da Jornada Personalizada com competências que antes faltavam
const faltantesNomes = [
  'Gestão de Conflitos', 'Mentalidade Sistêmica', 'Relacionamentos Conectivos',
  'Gestão de Equipes', 'Inteligência Emocional', 'Comunicação Assertiva',
  'Arquitetura de Mudanças', 'Estratégia de Longo Alcance',
  'Adaptabilidade', 'Gestão da Comunicação', 'Tomada de Decisão',
  'Relacionamentos Conectivos'
];

const jpRecords = planilha.filter(r => 
  r.trilha && r.trilha.toLowerCase().includes('jornada personalizada')
);
console.log(`Registros JP na planilha: ${jpRecords.length}`);

// Buscar turmaId da Jornada Personalizada
const [turmaJP] = await conn.query(`
  SELECT id FROM turmas WHERE name LIKE '%Jornada Personalizada%'
`);
const turmaJPId = turmaJP[0]?.id;
console.log(`TurmaId JP: ${turmaJPId}`);

// Buscar todas as competências da JP agora (com IDs)
const [jpCompsNow] = await conn.query(`
  SELECT id, nome FROM competencias WHERE trilhaId = ?
`, [jpTrilhaId]);
const compMap = {};
for (const c of jpCompsNow) {
  compMap[c.nome.toLowerCase()] = c.id;
}

// Buscar alunos pelo externalId
const [alunosAll] = await conn.query(`SELECT id, externalId, consultorId FROM alunos`);
const alunoMap = {};
for (const a of alunosAll) {
  if (a.externalId) alunoMap[String(a.externalId)] = a;
}

// Para cada registro JP da planilha, verificar se já existe um assessment_pdi e competência
let reimported = 0;
for (const rec of jpRecords) {
  const aluno = alunoMap[String(rec.id_usuario)];
  if (!aluno) {
    console.log(`  AVISO: Aluno ${rec.nome} (${rec.id_usuario}) não encontrado no banco`);
    continue;
  }

  const compNome = rec.competencia === 'Gestão de Tempo' ? 'Gestão do Tempo' : rec.competencia;
  const compId = compMap[compNome.toLowerCase()];
  if (!compId) {
    console.log(`  AVISO: Competência "${compNome}" não encontrada na JP`);
    continue;
  }

  // Verificar se já existe PDI para este aluno + trilha JP
  const [existingPdi] = await conn.query(`
    SELECT id FROM assessment_pdi 
    WHERE alunoId = ? AND trilhaId = ? AND turmaId = ?
  `, [aluno.id, jpTrilhaId, turmaJPId]);

  let pdiId;
  if (existingPdi.length > 0) {
    pdiId = existingPdi[0].id;
  } else {
    // Criar PDI
    const macroInicio = rec.macro_inicio || null;
    const macroFim = rec.macro_fim || null;
    const [result] = await conn.query(`
      INSERT INTO assessment_pdi (alunoId, trilhaId, turmaId, consultorId, macroInicio, macroTermino)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [aluno.id, jpTrilhaId, turmaJPId, aluno.consultorId, macroInicio, macroFim]);
    pdiId = result.insertId;
    console.log(`  Criado PDI #${pdiId} para ${rec.nome} (JP)`);
  }

  // Verificar se competência já existe neste PDI
  const [existingComp] = await conn.query(`
    SELECT id FROM assessment_competencias 
    WHERE assessmentPdiId = ? AND competenciaId = ?
  `, [pdiId, compId]);

  if (existingComp.length === 0) {
    const peso = rec.tipo === 'Obrigatória' ? 'obrigatoria' : 'opcional';
    const microInicio = rec.micro_inicio || null;
    const microTermino = rec.micro_fim || null;
    await conn.query(`
      INSERT INTO assessment_competencias (assessmentPdiId, competenciaId, peso, microInicio, microTermino)
      VALUES (?, ?, ?, ?, ?)
    `, [pdiId, compId, peso, microInicio, microTermino]);
    reimported++;
    console.log(`  Importada: ${rec.nome} → ${compNome} (${peso})`);
  } else {
    console.log(`  Já existe: ${rec.nome} → ${compNome}`);
  }
}

console.log(`\nTotal reimportados: ${reimported}`);

// Verificação final
const [finalPdi] = await conn.query(`SELECT COUNT(*) as total FROM assessment_pdi`);
const [finalComp] = await conn.query(`SELECT COUNT(*) as total FROM assessment_competencias`);
console.log(`\n=== TOTAIS FINAIS ===`);
console.log(`PDIs: ${finalPdi[0].total}`);
console.log(`Competências: ${finalComp[0].total}`);

await conn.end();
