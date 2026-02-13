import { createPool } from 'mysql2/promise';
import XLSX from 'xlsx';

const DATABASE_URL = process.env.DATABASE_URL;
const pool = createPool(DATABASE_URL);

const FILES = [
  { path: '/home/ubuntu/upload/SEBRAEACRE-Mentorias.xlsx', empresa: 'SEBRAE ACRE', programKey: 'SEBRAE ACRE' },
  { path: '/home/ubuntu/upload/BS2SEBRAETO-Tutorias(respostas).xlsx', empresa: 'SEBRAE TO', programKey: 'SEBRAE TO' },
  { path: '/home/ubuntu/upload/EMBRAPII-Mentorias.xlsx', empresa: 'EMBRAPII', programKey: 'EMBRAPII' },
];

function formatDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'number') {
    const date = new Date((val - 25569) * 86400 * 1000);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(val).trim();
  const dmyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2,'0')}-${dmyMatch[1].padStart(2,'0')}`;
  }
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return formatDate(d);
  }
  return null;
}

function parseCiclo(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase();
  if (s.includes('IV') || s.includes('4')) return 'IV';
  if (s.includes('III') || s === 'CICLO 3') return 'III';
  if (s.includes('II') || s === 'CICLO 2') return 'II';
  if (s.includes('I') || s.includes('00') || s.includes('0') || s === 'CICLO 1') return 'I';
  return null;
}

function parseTaskStatus(raw) {
  if (!raw) return 'sem_tarefa';
  const s = String(raw).trim().toUpperCase();
  if (s.includes('ENTREGUE') && !s.includes('NÃO') && !s.includes('NAO')) return 'entregue';
  if (s.includes('NÃO') || s.includes('NAO')) return 'nao_entregue';
  if (s.includes('DEVOLUTIVA') || s.includes('NÃO TEM') || s.includes('NAO TEM')) return 'sem_tarefa';
  return 'sem_tarefa';
}

function parseSessionNumber(raw) {
  if (!raw) return null;
  const s = String(raw);
  const match = s.match(/(\d+)[ªº]/);
  if (match) return parseInt(match[1]);
  // "1ª Sessão" pattern
  const match2 = s.match(/(\d+)/);
  if (match2) return parseInt(match2[1]);
  return null;
}

async function main() {
  console.log('🔄 Iniciando importação de mentorias...\n');

  // Get programs
  const [programs] = await pool.query('SELECT id, name FROM programs');
  const programMap = {};
  for (const p of programs) programMap[p.name] = p.id;
  console.log('📋 Programas:', JSON.stringify(programMap));

  // Get turmas
  const [turmas] = await pool.query('SELECT id, name, programId FROM turmas');
  const turmaMap = {};
  for (const t of turmas) turmaMap[t.name] = { id: t.id, programId: t.programId };

  // Get alunos by externalId
  const [alunos] = await pool.query('SELECT id, externalId, name, turmaId FROM alunos');
  const alunoByExtId = {};
  for (const a of alunos) alunoByExtId[a.externalId] = a;
  console.log('📋 Alunos:', Object.keys(alunoByExtId).length);

  // Get consultors by name
  const [consultors] = await pool.query('SELECT id, name FROM consultors');
  const consultorByName = {};
  for (const c of consultors) consultorByName[c.name.toLowerCase().trim()] = c;
  console.log('📋 Consultores:', consultors.length);

  // Get trilhas
  const [trilhas] = await pool.query('SELECT id, name FROM trilhas');
  const trilhaMap = {};
  for (const t of trilhas) trilhaMap[t.name.toLowerCase().trim()] = t.id;

  // Get competencias
  const [competencias] = await pool.query('SELECT id, nome, descricao, trilhaId FROM competencias');
  const compMap = {};
  for (const c of competencias) {
    if (c.descricao) compMap[c.descricao.toLowerCase().trim()] = { id: c.id, trilhaId: c.trilhaId };
    if (c.nome) compMap[c.nome.toLowerCase().trim()] = { id: c.id, trilhaId: c.trilhaId };
  }

  // Step 1: Delete old mentoring sessions (except BANRISUL)
  console.log('\n🗑️ Limpando sessões de mentoria antigas (exceto BANRISUL)...');
  const [delSessions] = await pool.query('DELETE FROM mentoring_sessions WHERE alunoId >= 30000');
  console.log(`   ✅ ${delSessions.affectedRows} sessões removidas`);

  // Step 2: Parse and import mentorias
  let totalSessions = 0;
  let newConsultors = [];
  const notFoundAlunos = new Set();

  for (const file of FILES) {
    console.log(`\n📂 Processando: ${file.empresa} (${file.path})`);

    const workbook = XLSX.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });

    // Find header row
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const rowStr = rawData[i].join(' ').toLowerCase();
      if (rowStr.includes('consultor') || rowStr.includes('aluno') || rowStr.includes('carimbo')) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = rawData[headerRowIdx];
    console.log(`   Headers (row ${headerRowIdx}): ${headers.slice(0, 8).join(', ')}...`);

    // Detect column positions by name
    const colMap = {};
    for (let i = 0; i < headers.length; i++) {
      const h = String(headers[i] || '').toLowerCase().trim();
      if (h.includes('consultor') && !h.includes('id')) colMap.consultorName = i;
      if (h.includes('id usu') || h.includes('id nomes')) colMap.alunoExtId = i;
      if (h.includes('nome do aluno') || h.includes('nome aluno')) colMap.alunoName = i;
      if (h.includes('grupo') || h.includes('turma')) colMap.turmaName = i;
      if (h.includes('trilha') && !h.includes('id')) colMap.trilhaName = i;
      if (h.includes('ciclo')) colMap.ciclo = i;
      if (h.includes('data da mentoria') || h.includes('data da tutoria')) colMap.sessionDate = i;
      if (h.includes('mentoria') && !h.includes('data') && !h.includes('registro')) colMap.presence = i;
      if (h.includes('atividade')) colMap.taskStatus = i;
      if (h.includes('evolu') || h.includes('engajamento')) colMap.engagement = i;
      if (h.includes('parecer') || h.includes('breve')) colMap.feedback = i;
    }

    // For SEBRAE TO, column order is slightly different (Id Trilha before TRILHA, Ciclo after TRILHA)
    // Let's also try index-based for common structure
    if (!colMap.sessionDate) {
      // Fallback: try column 10 for date
      colMap.sessionDate = 10;
    }

    console.log(`   Column mapping:`, JSON.stringify(colMap));

    const dataRows = rawData.slice(headerRowIdx + 1).filter(row => {
      // Must have aluno external id
      const extId = row[colMap.alunoExtId];
      return extId && !isNaN(extId);
    });

    console.log(`   ${dataRows.length} registros de mentoria`);

    let fileSessions = 0;
    let fileNotFound = 0;
    const batchValues = [];

    for (const row of dataRows) {
      const consultorName = String(row[colMap.consultorName] || '').trim();
      const alunoExtId = String(row[colMap.alunoExtId]).trim();
      const turmaName = String(row[colMap.turmaName] || '').trim();
      const trilhaName = String(row[colMap.trilhaName] || '').trim();
      const cicloRaw = row[colMap.ciclo];
      const sessionDateRaw = row[colMap.sessionDate];
      const presenceRaw = String(row[colMap.presence] || '').trim().toLowerCase();
      const taskStatusRaw = row[colMap.taskStatus];
      const engagementRaw = row[colMap.engagement];
      const feedbackRaw = row[colMap.feedback];

      // Find aluno
      const aluno = alunoByExtId[alunoExtId];
      if (!aluno) {
        notFoundAlunos.add(alunoExtId);
        fileNotFound++;
        continue;
      }

      // Find or create consultor
      let consultorId = null;
      const consultorKey = consultorName.toLowerCase().trim();
      // Remove " - Coordenação" suffix
      const cleanConsultorKey = consultorKey.replace(/ - coordenação/i, '').trim();

      if (consultorByName[cleanConsultorKey]) {
        consultorId = consultorByName[cleanConsultorKey].id;
      } else if (consultorByName[consultorKey]) {
        consultorId = consultorByName[consultorKey].id;
      } else if (consultorName) {
        // Create new consultor
        const cleanName = consultorName.replace(/ - Coordenação/i, '').trim();
        const [result] = await pool.query(
          'INSERT INTO consultors (name, role) VALUES (?, ?)',
          [cleanName, 'mentor']
        );
        consultorId = result.insertId;
        consultorByName[cleanConsultorKey] = { id: consultorId, name: cleanName };
        newConsultors.push(cleanName);
        console.log(`   ➕ Novo consultor: ${cleanName} (id: ${consultorId})`);
      }

      // Find turma
      const turma = turmaMap[turmaName];
      const turmaId = turma ? turma.id : null;

      // Find trilha
      let trilhaId = null;
      const trilhaKey = trilhaName.toLowerCase().trim();
      const comp = compMap[trilhaKey];
      if (comp) {
        trilhaId = comp.trilhaId;
      } else {
        // Try partial match - extract trilha name from "Competencia - Trilha"
        const parts = trilhaName.split(' - ');
        if (parts.length > 1) {
          const tName = parts[parts.length - 1].trim().toLowerCase();
          if (trilhaMap[tName]) trilhaId = trilhaMap[tName];
        }
      }

      // Parse fields
      const ciclo = parseCiclo(cicloRaw);
      const sessionDate = formatDate(sessionDateRaw);
      const presence = presenceRaw === 'presente' ? 'presente' : 'ausente';
      const taskStatus = parseTaskStatus(taskStatusRaw);
      const sessionNumber = parseSessionNumber(String(taskStatusRaw || ''));
      const engagement = engagementRaw ? parseInt(engagementRaw) : null;
      const feedback = feedbackRaw ? String(feedbackRaw).substring(0, 10000) : null;

      batchValues.push([
        aluno.id,
        consultorId || 14, // fallback to "Equipe CKM Talents"
        turmaId,
        trilhaId,
        ciclo,
        sessionNumber,
        sessionDate,
        presence,
        taskStatus,
        engagement,
        feedback,
      ]);

      fileSessions++;
    }

    // Batch insert
    const batchSize = 50;
    for (let i = 0; i < batchValues.length; i += batchSize) {
      const batch = batchValues.slice(i, i + batchSize);
      const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const values = batch.flat();
      await pool.query(
        `INSERT INTO mentoring_sessions (alunoId, consultorId, turmaId, trilhaId, ciclo, sessionNumber, sessionDate, presence, taskStatus, engagementScore, feedback) VALUES ${placeholders}`,
        values
      );
    }

    totalSessions += fileSessions;
    console.log(`   ✅ ${fileSessions} sessões inseridas`);
    if (fileNotFound > 0) {
      console.log(`   ⚠️ ${fileNotFound} sessões ignoradas (aluno não encontrado)`);
    }
  }

  // Register upload batch for mentorias
  console.log('\n📝 Registrando lote no histórico...');
  const [batch] = await pool.query(
    'INSERT INTO upload_batches (weekNumber, year, uploadedBy, status, notes, totalRecords) VALUES (?, ?, ?, ?, ?, ?)',
    [7, 2026, 1, 'completed', `Importação de mentorias atualizadas - 3 planilhas: SEBRAE Acre, SEBRAE TO, EMBRAPII - ${totalSessions} sessões`, totalSessions]
  );
  const batchId = batch.insertId;

  const mentoriaFiles = [
    { name: 'SEBRAEACRE-Mentorias.xlsx', type: 'sebraeacre_mentorias', rows: 524 },
    { name: 'BS2SEBRAETO-Tutorias(respostas).xlsx', type: 'sebraeto_mentorias', rows: 406 },
    { name: 'EMBRAPII-Mentorias.xlsx', type: 'embrapii_mentorias', rows: 152 },
  ];

  for (const f of mentoriaFiles) {
    await pool.query(
      'INSERT INTO uploaded_files (batchId, fileName, fileKey, fileUrl, fileType, rowCount, columnCount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [batchId, f.name, 'manual-import/' + f.name, 'manual-import/' + f.name, f.type, f.rows, 15, 'processed']
    );
  }
  console.log('   ✅ Lote registrado no histórico');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA IMPORTAÇÃO DE MENTORIAS');
  console.log('='.repeat(60));

  const [totalDb] = await pool.query('SELECT COUNT(*) as total FROM mentoring_sessions');
  const [byPresence] = await pool.query('SELECT presence, COUNT(*) as total FROM mentoring_sessions GROUP BY presence');
  const [byTask] = await pool.query('SELECT taskStatus, COUNT(*) as total FROM mentoring_sessions GROUP BY taskStatus');

  console.log(`  Total sessões no banco: ${totalDb[0].total}`);
  console.log(`  Sessões importadas agora: ${totalSessions}`);
  console.log(`  Por presença: ${JSON.stringify(byPresence)}`);
  console.log(`  Por tarefa: ${JSON.stringify(byTask)}`);

  if (newConsultors.length > 0) {
    console.log(`  Novos consultores criados: ${newConsultors.join(', ')}`);
  }
  if (notFoundAlunos.size > 0) {
    console.log(`  ⚠️ Alunos não encontrados: ${[...notFoundAlunos].join(', ')}`);
  }

  console.log('\n✅ Importação de mentorias concluída!');
  await pool.end();
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
