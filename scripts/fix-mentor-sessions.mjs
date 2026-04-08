import * as XLSX from 'xlsx';
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const FILES = [
  { path: '/home/ubuntu/upload/SEBRAEACRE-Mentorias.xlsx', program: 'SEBRAE ACRE' },
  { path: '/home/ubuntu/upload/BS2SEBRAETO-Tutorias(respostas).xlsx', program: 'SEBRAE TO' },
  { path: '/home/ubuntu/upload/EMBRAPII-Mentorias.xlsx', program: 'EMBRAPII' }
];

async function fixSessions() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get all consultors
  const [consultors] = await conn.query('SELECT id, name FROM consultors');
  const consultorByName = new Map(consultors.map(c => [c.name.toLowerCase().trim(), c.id]));
  
  console.log('Consultores no banco:', consultorByName.size);
  
  // Get all alunos
  const [alunos] = await conn.query('SELECT id, externalId, name, programId FROM alunos');
  const alunoByExternalId = new Map(alunos.map(a => [a.externalId, a]));
  
  console.log('Alunos no banco:', alunos.length);
  
  // Get programs
  const [programs] = await conn.query('SELECT id, name FROM programs');
  const programMap = new Map(programs.map(p => [p.name, p.id]));
  
  // Delete all existing sessions and re-import with correct consultorId
  console.log('\nLimpando sessões existentes...');
  await conn.query('DELETE FROM mentoring_sessions');
  
  let totalInserted = 0;
  
  for (const file of FILES) {
    console.log(`\nProcessando ${file.program}...`);
    
    const buffer = readFileSync(file.path);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    let sheetName = workbook.SheetNames.find(name => 
      name.includes('MENTORIAS') || name.includes('Mentorias') || name.includes('TUTORIAS')
    ) || workbook.SheetNames[0];
    
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Find header row and columns
    let headerRowIndex = 0;
    const headers = data[0] || [];
    
    const colMap = {};
    headers.forEach((h, i) => {
      const header = String(h || '').toLowerCase();
      if (header.includes('id') && header.includes('usu')) colMap.idUsuario = i;
      if (header.includes('nome') && !header.includes('consultor')) colMap.nome = i;
      if (header.includes('consultor')) colMap.consultor = i;
      if (header.includes('ciclo')) colMap.ciclo = i;
      if (header.includes('mentoria') && !header.includes('data')) colMap.presenca = i;
      if (header.includes('atividade')) colMap.atividade = i;
      if (header.includes('engajamento') || header.includes('evolu')) colMap.engajamento = i;
      if (header.includes('data') && header.includes('mentoria')) colMap.data = i;
    });
    
    console.log('  Colunas encontradas:', colMap);
    
    const programId = programMap.get(file.program);
    let fileInserted = 0;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const externalId = colMap.idUsuario !== undefined ? String(row[colMap.idUsuario] || '').trim() : '';
      const consultorName = colMap.consultor !== undefined ? String(row[colMap.consultor] || '').trim() : '';
      const presenca = colMap.presenca !== undefined ? String(row[colMap.presenca] || '').toLowerCase() : '';
      const atividade = colMap.atividade !== undefined ? String(row[colMap.atividade] || '').toLowerCase() : '';
      const engajamento = colMap.engajamento !== undefined ? row[colMap.engajamento] : null;
      
      // Find aluno
      const aluno = alunoByExternalId.get(externalId);
      if (!aluno) continue;
      
      // Find consultor
      const consultorId = consultorByName.get(consultorName.toLowerCase().trim()) || 1;
      
      // Parse presence
      let presenceValue = 'ausente';
      if (presenca.includes('presente') || presenca.includes('sim') || presenca === 'p') {
        presenceValue = 'presente';
      }
      
      // Parse task status
      let taskStatus = 'sem_tarefa';
      if (atividade.includes('entregue') || atividade.includes('sim')) {
        taskStatus = 'entregue';
      } else if (atividade.includes('não') || atividade.includes('nao')) {
        taskStatus = 'nao_entregue';
      }
      
      // Parse engagement
      let engagementScore = null;
      if (engajamento !== null && engajamento !== undefined && engajamento !== '') {
        const num = parseFloat(engajamento);
        if (!isNaN(num) && num >= 1 && num <= 5) {
          engagementScore = Math.round(num);
        }
      }
      
      // Insert session
      await conn.query(`
        INSERT INTO mentoring_sessions (alunoId, consultorId, presence, taskStatus, engagementScore)
        VALUES (?, ?, ?, ?, ?)
      `, [aluno.id, consultorId, presenceValue, taskStatus, engagementScore]);
      
      fileInserted++;
    }
    
    console.log(`  ${file.program}: ${fileInserted} sessões inseridas`);
    totalInserted += fileInserted;
  }
  
  // Verify results
  console.log(`\nTotal de sessões inseridas: ${totalInserted}`);
  
  const [stats] = await conn.query(`
    SELECT c.name, COUNT(ms.id) as total 
    FROM consultors c 
    LEFT JOIN mentoring_sessions ms ON c.id = ms.consultorId 
    GROUP BY c.id, c.name 
    ORDER BY total DESC 
    LIMIT 10
  `);
  
  console.log('\nTop 10 Mentores por sessões:');
  stats.forEach((row, i) => {
    console.log(`  ${i + 1}. ${row.name}: ${row.total} sessões`);
  });
  
  await conn.end();
  console.log('\nConcluído!');
}

fixSessions().catch(console.error);
