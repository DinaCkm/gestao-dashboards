import * as XLSX from 'xlsx';
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const FILES = [
  { path: '/home/ubuntu/upload/SEBRAEACRE-Mentorias.xlsx', program: 'SEBRAE ACRE' },
  { path: '/home/ubuntu/upload/BS2SEBRAETO-Tutorias(respostas).xlsx', program: 'SEBRAE TO' },
  { path: '/home/ubuntu/upload/EMBRAPII-Mentorias.xlsx', program: 'EMBRAPII' }
];

async function importMentors() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get program IDs
  const [programs] = await conn.query('SELECT id, name FROM programs');
  const programMap = new Map(programs.map(p => [p.name, p.id]));
  
  console.log('Programas:', programMap);
  
  // Collect all mentors from all files
  const mentorsByName = new Map();
  
  for (const file of FILES) {
    console.log(`\nProcessando ${file.path}...`);
    
    const buffer = readFileSync(file.path);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Find the sheet with mentoring data
    let sheetName = workbook.SheetNames.find(name => 
      name.includes('MENTORIAS') || name.includes('Mentorias') || name.includes('TUTORIAS')
    ) || workbook.SheetNames[0];
    
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Find header row (look for "Consultor" column)
    let headerRowIndex = -1;
    let consultorColIndex = -1;
    
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (!row) continue;
      
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').toLowerCase();
        if (cell.includes('consultor') || cell.includes('mentor')) {
          headerRowIndex = i;
          consultorColIndex = j;
          break;
        }
      }
      if (headerRowIndex >= 0) break;
    }
    
    if (headerRowIndex < 0) {
      console.log(`  Coluna de consultor não encontrada em ${file.path}`);
      continue;
    }
    
    console.log(`  Header na linha ${headerRowIndex}, coluna consultor: ${consultorColIndex}`);
    
    // Extract mentor names
    const programId = programMap.get(file.program);
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      const consultorName = String(row[consultorColIndex] || '').trim();
      if (!consultorName || consultorName === '-' || consultorName === 'N/A') continue;
      
      if (!mentorsByName.has(consultorName)) {
        mentorsByName.set(consultorName, {
          name: consultorName,
          programs: new Set(),
          count: 0
        });
      }
      
      const mentor = mentorsByName.get(consultorName);
      mentor.programs.add(file.program);
      mentor.count++;
    }
  }
  
  console.log(`\nTotal de mentores únicos encontrados: ${mentorsByName.size}`);
  
  // Insert mentors into database
  const mentorIdMap = new Map();
  
  for (const [name, mentor] of mentorsByName) {
    // Use the first program as the primary
    const primaryProgram = Array.from(mentor.programs)[0];
    const programId = programMap.get(primaryProgram) || null;
    
    const [result] = await conn.query(
      'INSERT INTO consultors (name, programId, isActive) VALUES (?, ?, 1)',
      [name, programId]
    );
    
    mentorIdMap.set(name, result.insertId);
    console.log(`  Inserido: ${name} (ID: ${result.insertId}, ${mentor.count} mentorias)`);
  }
  
  // Now update mentoring_sessions with correct consultorId
  console.log('\nAtualizando sessões de mentoria...');
  
  for (const file of FILES) {
    const buffer = readFileSync(file.path);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    let sheetName = workbook.SheetNames.find(name => 
      name.includes('MENTORIAS') || name.includes('Mentorias') || name.includes('TUTORIAS')
    ) || workbook.SheetNames[0];
    
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Find columns
    let headerRowIndex = -1;
    let consultorColIndex = -1;
    let alunoColIndex = -1;
    let idUsuarioColIndex = -1;
    
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (!row) continue;
      
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').toLowerCase();
        if (cell.includes('consultor') || cell.includes('mentor')) {
          headerRowIndex = i;
          consultorColIndex = j;
        }
        if (cell.includes('nome') && !cell.includes('consultor')) {
          alunoColIndex = j;
        }
        if (cell.includes('id') && cell.includes('usu')) {
          idUsuarioColIndex = j;
        }
      }
      if (headerRowIndex >= 0) break;
    }
    
    if (headerRowIndex < 0) continue;
    
    // Get alunos for this program
    const programId = programMap.get(file.program);
    const [alunos] = await conn.query(
      'SELECT id, externalId, name FROM alunos WHERE programId = ?',
      [programId]
    );
    const alunoByExternalId = new Map(alunos.map(a => [a.externalId, a]));
    const alunoByName = new Map(alunos.map(a => [a.name.toLowerCase(), a]));
    
    let updatedCount = 0;
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      const consultorName = String(row[consultorColIndex] || '').trim();
      const consultorId = mentorIdMap.get(consultorName);
      
      if (!consultorId) continue;
      
      // Find the aluno
      let aluno = null;
      if (idUsuarioColIndex >= 0) {
        const externalId = String(row[idUsuarioColIndex] || '').trim();
        aluno = alunoByExternalId.get(externalId);
      }
      if (!aluno && alunoColIndex >= 0) {
        const alunoName = String(row[alunoColIndex] || '').trim().toLowerCase();
        aluno = alunoByName.get(alunoName);
      }
      
      if (aluno) {
        // Update sessions for this aluno with the correct consultorId
        await conn.query(
          'UPDATE mentoring_sessions SET consultorId = ? WHERE alunoId = ? AND consultorId = 1',
          [consultorId, aluno.id]
        );
        updatedCount++;
      }
    }
    
    console.log(`  ${file.program}: ${updatedCount} sessões atualizadas`);
  }
  
  // Verify results
  const [finalStats] = await conn.query(`
    SELECT c.name, COUNT(ms.id) as total 
    FROM consultors c 
    LEFT JOIN mentoring_sessions ms ON c.id = ms.consultorId 
    GROUP BY c.id, c.name 
    ORDER BY total DESC 
    LIMIT 10
  `);
  
  console.log('\nTop 10 Mentores por sessões:');
  finalStats.forEach((row, i) => {
    console.log(`  ${i + 1}. ${row.name}: ${row.total} sessões`);
  });
  
  await conn.end();
  console.log('\nImportação concluída!');
}

importMentors().catch(console.error);
