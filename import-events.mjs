import { createPool } from 'mysql2/promise';
import { readFileSync } from 'fs';
import XLSX from 'xlsx';

const DATABASE_URL = process.env.DATABASE_URL;
const pool = createPool(DATABASE_URL);

// Files to import
const FILES = [
  { path: '/home/ubuntu/upload/EMBRAPII-Eventos.xlsx', empresa: 'EMBRAPII' },
  { path: '/home/ubuntu/upload/SEBRAEACRE-Eventos.xlsx', empresa: 'SEBRAE ACRE' },
  { path: '/home/ubuntu/upload/BS2SEBRAETO-Eventos.xlsx', empresa: 'SEBRAE TO' },
];

function normalizeEventType(raw) {
  const t = raw.trim().toUpperCase();
  if (t === 'WEBINAR') return 'webinar';
  if (t === 'AULA' || t === 'AULA ') return 'aula';
  if (t === 'CURSO ONLINE') return 'curso_online';
  if (t === 'WORKSHOP') return 'workshop';
  return 'outro';
}

function normalizeTitle(title) {
  return title.trim().replace(/\s+/g, ' ');
}

function formatDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  // Excel serial number
  if (typeof val === 'number') {
    const date = new Date((val - 25569) * 86400 * 1000);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(val).trim();
  // dd/mm/yyyy
  const dmyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2,'0')}-${dmyMatch[1].padStart(2,'0')}`;
  }
  // yyyy-mm-dd already
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }
  // Try Date parse
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return formatDate(d);
  }
  return null;
}

async function main() {
  console.log('🔄 Iniciando importação de eventos...\n');

  // Get programs
  const [programs] = await pool.query('SELECT id, name FROM programs');
  const programMap = {};
  for (const p of programs) {
    programMap[p.name] = p.id;
  }
  console.log('📋 Programas:', JSON.stringify(programMap));

  // Get turmas
  const [turmas] = await pool.query('SELECT id, name, programId FROM turmas');
  const turmaMap = {};
  for (const t of turmas) {
    turmaMap[t.name] = { id: t.id, programId: t.programId };
  }
  console.log('📋 Turmas:', Object.keys(turmaMap).length);

  // Get alunos by externalId
  const [alunos] = await pool.query('SELECT id, externalId, name, turmaId FROM alunos');
  const alunoByExtId = {};
  for (const a of alunos) {
    alunoByExtId[a.externalId] = a;
  }
  console.log('📋 Alunos:', Object.keys(alunoByExtId).length);

  // Get trilhas
  const [trilhas] = await pool.query('SELECT id, name FROM trilhas');
  const trilhaMap = {};
  for (const t of trilhas) {
    trilhaMap[t.name] = t.id;
  }

  // Get competencias (uses 'nome' and 'descricao' columns)
  const [competencias] = await pool.query('SELECT id, nome, descricao, trilhaId FROM competencias');
  const compMap = {};
  for (const c of competencias) {
    // Map by descricao (e.g. "Gestão de Conflitos - Master") and also by nome
    if (c.descricao) compMap[c.descricao] = { id: c.id, trilhaId: c.trilhaId };
    if (c.nome) compMap[c.nome] = { id: c.id, trilhaId: c.trilhaId };
  }

  // Step 1: Delete old events and participations (except BANRISUL)
  // BANRISUL alunos have id < 30000
  console.log('\n🗑️ Limpando eventos e participações antigos (exceto BANRISUL)...');
  
  // Delete participations for non-BANRISUL alunos
  const [delParts] = await pool.query('DELETE FROM event_participation WHERE alunoId >= 30000 OR alunoId < 199');
  console.log(`   ✅ ${delParts.affectedRows} participações removidas (não-BANRISUL)`);
  
  // Delete events for non-BANRISUL programs
  const banrisulProgId = programMap['BANRISUL'];
  const [delEvents] = await pool.query('DELETE FROM events WHERE programId != ? OR programId IS NULL', [banrisulProgId]);
  console.log(`   ✅ ${delEvents.affectedRows} eventos removidos (não-BANRISUL)`);

  // Step 2: Parse and import events from all files
  let totalEvents = 0;
  let totalParticipations = 0;
  let notFoundAlunos = new Set();

  for (const file of FILES) {
    console.log(`\n📂 Processando: ${file.empresa} (${file.path})`);
    
    const workbook = XLSX.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });
    
    // Find header row (contains "Id Usu" or "Nome do aluno")
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const rowStr = rawData[i].join(' ');
      if (rowStr.includes('Id Usu') || rowStr.includes('Id Nomes')) {
        headerRowIdx = i;
        break;
      }
    }
    
    if (headerRowIdx === -1) {
      // Try row after title
      headerRowIdx = 2;
    }
    
    console.log(`   Header row: ${headerRowIdx}`);
    
    // Parse data rows
    const headers = rawData[headerRowIdx];
    const dataRows = rawData.slice(headerRowIdx + 1).filter(row => row[0] && !isNaN(row[0]));
    
    console.log(`   ${dataRows.length} registros de participação`);
    
    // Collect unique events
    const eventMap = new Map(); // key: title+date -> event data
    const participations = []; // { eventKey, alunoExternalId, status }
    
    const programId = programMap[file.empresa];
    
    for (const row of dataRows) {
      const alunoExternalId = String(row[0]).trim();
      const alunoName = String(row[1] || '').trim();
      const turmaName = String(row[3] || '').trim();
      const trilhaName = String(row[6] || '').trim();
      const eventType = normalizeEventType(String(row[7] || 'webinar'));
      const eventTitle = normalizeTitle(String(row[8] || ''));
      const eventDateRaw = row[9];
      const status = String(row[10] || '').trim().toLowerCase();
      
      if (!eventTitle || !alunoExternalId) continue;
      
      // Parse date
      let eventDate = null;
      if (eventDateRaw) {
        // Try parsing as date string
        const d = new Date(eventDateRaw);
        if (!isNaN(d.getTime())) {
          eventDate = formatDate(d);
        } else {
          eventDate = formatDate(eventDateRaw);
        }
      }
      
      // Find trilhaId from competencia name
      let trilhaId = null;
      if (trilhaName) {
        // Try exact match on competencia name
        const comp = compMap[trilhaName];
        if (comp) {
          trilhaId = comp.trilhaId;
        } else {
          // Try partial match
          const compName = Object.keys(compMap).find(k => 
            k.toLowerCase().replace(/\s+/g, '') === trilhaName.toLowerCase().replace(/\s+/g, '')
          );
          if (compName) {
            trilhaId = compMap[compName].trilhaId;
          }
        }
      }
      
      // Create event key
      const eventKey = `${eventTitle}||${eventDate}||${programId}`;
      
      if (!eventMap.has(eventKey)) {
        eventMap.set(eventKey, {
          title: eventTitle,
          eventType,
          eventDate,
          programId,
          trilhaId,
        });
      }
      
      participations.push({
        eventKey,
        alunoExternalId,
        status: status === 'presente' ? 'presente' : 'ausente',
      });
    }
    
    console.log(`   ${eventMap.size} eventos únicos`);
    
    // Insert events
    const eventIdMap = new Map(); // eventKey -> eventId
    
    for (const [key, evt] of eventMap) {
      const [result] = await pool.query(
        'INSERT INTO events (title, eventType, eventDate, programId, trilhaId) VALUES (?, ?, ?, ?, ?)',
        [evt.title, evt.eventType, evt.eventDate, evt.programId, evt.trilhaId]
      );
      eventIdMap.set(key, result.insertId);
      totalEvents++;
    }
    
    console.log(`   ✅ ${eventMap.size} eventos inseridos`);
    
    // Insert participations
    let fileParticipations = 0;
    let fileNotFound = 0;
    
    // Batch insert for performance
    const batchSize = 100;
    const partValues = [];
    
    for (const part of participations) {
      const eventId = eventIdMap.get(part.eventKey);
      const aluno = alunoByExtId[part.alunoExternalId];
      
      if (!aluno) {
        if (!notFoundAlunos.has(part.alunoExternalId)) {
          notFoundAlunos.add(part.alunoExternalId);
        }
        fileNotFound++;
        continue;
      }
      
      partValues.push([eventId, aluno.id, part.status]);
      fileParticipations++;
    }
    
    // Batch insert
    for (let i = 0; i < partValues.length; i += batchSize) {
      const batch = partValues.slice(i, i + batchSize);
      const placeholders = batch.map(() => '(?, ?, ?)').join(', ');
      const values = batch.flat();
      await pool.query(
        `INSERT INTO event_participation (eventId, alunoId, status) VALUES ${placeholders}`,
        values
      );
    }
    
    totalParticipations += fileParticipations;
    console.log(`   ✅ ${fileParticipations} participações inseridas`);
    if (fileNotFound > 0) {
      console.log(`   ⚠️ ${fileNotFound} participações ignoradas (aluno não encontrado)`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA IMPORTAÇÃO DE EVENTOS');
  console.log('='.repeat(60));
  
  const [totalEventsDb] = await pool.query('SELECT COUNT(*) as total FROM events');
  const [totalPartsDb] = await pool.query('SELECT COUNT(*) as total FROM event_participation');
  const [partsByStatus] = await pool.query('SELECT status, COUNT(*) as total FROM event_participation GROUP BY status');
  const [eventsByProg] = await pool.query(`
    SELECT p.name, COUNT(e.id) as total 
    FROM events e 
    JOIN programs p ON e.programId = p.id 
    GROUP BY p.name
  `);
  const [partsByProg] = await pool.query(`
    SELECT p.name, COUNT(ep.id) as total 
    FROM event_participation ep 
    JOIN events e ON ep.eventId = e.id 
    JOIN programs p ON e.programId = p.id 
    GROUP BY p.name
  `);
  
  console.log(`  Total eventos no banco: ${totalEventsDb[0].total}`);
  console.log(`  Total participações no banco: ${totalPartsDb[0].total}`);
  console.log(`  Por status: ${JSON.stringify(partsByStatus)}`);
  console.log(`  Eventos por empresa: ${JSON.stringify(eventsByProg)}`);
  console.log(`  Participações por empresa: ${JSON.stringify(partsByProg)}`);
  
  if (notFoundAlunos.size > 0) {
    console.log(`\n  ⚠️ Alunos não encontrados no banco: ${[...notFoundAlunos].join(', ')}`);
  }
  
  console.log('\n✅ Importação de eventos concluída!');
  
  await pool.end();
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
