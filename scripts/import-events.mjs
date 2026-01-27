import XLSX from 'xlsx';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function getConnection() {
  return await mysql.createConnection(DATABASE_URL);
}

// Parse events file - todos têm estrutura similar na sheet PARTICIPAÇÃO_EVENTOS
function parseEventsFile(filePath, empresa) {
  console.log(`\nProcessando eventos: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  
  // Encontrar a sheet de participação em eventos
  const sheetName = workbook.SheetNames.find(s => s.includes('PARTICIPAÇÃO') || s.includes('EVENTOS'));
  if (!sheetName) {
    console.log('  Sheet de eventos não encontrada');
    return [];
  }
  
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Encontrar a linha de cabeçalho (contém "Nome do aluno" ou "Nome do Aluno")
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row && row.some(cell => String(cell).toLowerCase().includes('nome do aluno'))) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    console.log('  Cabeçalho não encontrado');
    return [];
  }
  
  const headers = data[headerRowIndex];
  console.log(`  Cabeçalho encontrado na linha ${headerRowIndex + 1}`);
  
  // Mapear índices das colunas
  const colIndex = {
    idUsuario: headers.findIndex(h => String(h).toLowerCase().includes('id usu')),
    nomeAluno: headers.findIndex(h => String(h).toLowerCase().includes('nome do aluno')),
    turma: headers.findIndex(h => String(h).toLowerCase().includes('turma')),
    tituloEvento: headers.findIndex(h => String(h).toLowerCase().includes('titulo')),
    statusPresenca: headers.findIndex(h => String(h).toLowerCase().includes('status') && String(h).toLowerCase().includes('presen'))
  };
  
  console.log(`  Colunas: idUsuario=${colIndex.idUsuario}, nomeAluno=${colIndex.nomeAluno}, turma=${colIndex.turma}, titulo=${colIndex.tituloEvento}, presenca=${colIndex.statusPresenca}`);
  
  const records = [];
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const idUsuario = colIndex.idUsuario >= 0 ? row[colIndex.idUsuario] : '';
    const nomeAluno = colIndex.nomeAluno >= 0 ? row[colIndex.nomeAluno] : '';
    const turma = colIndex.turma >= 0 ? row[colIndex.turma] : '';
    const tituloEvento = colIndex.tituloEvento >= 0 ? row[colIndex.tituloEvento] : '';
    const statusPresenca = colIndex.statusPresenca >= 0 ? row[colIndex.statusPresenca] : '';
    
    if (!nomeAluno || !idUsuario) continue;
    
    const presenca = String(statusPresenca).toLowerCase().includes('presente') ? 'presente' : 'ausente';
    
    records.push({
      idUsuario: String(idUsuario).trim(),
      nomeAluno: String(nomeAluno).trim(),
      empresa,
      turma: String(turma).trim(),
      tituloEvento: String(tituloEvento).trim(),
      presenca
    });
  }
  
  console.log(`  -> ${records.length} registros de eventos encontrados`);
  return records;
}

async function importEvents() {
  console.log('=== Iniciando importação de eventos ===');
  
  const conn = await getConnection();
  
  try {
    // Buscar IDs dos programas
    const [programs] = await conn.execute('SELECT id, code, name FROM programs');
    const programIds = {};
    for (const prog of programs) {
      programIds[prog.name] = prog.id;
    }
    console.log('Programas encontrados:', Object.keys(programIds));
    
    // Buscar alunos existentes
    const [alunos] = await conn.execute('SELECT id, externalId, programId FROM alunos');
    const alunoIds = {};
    for (const aluno of alunos) {
      const key = `${aluno.externalId}_${aluno.programId}`;
      alunoIds[key] = aluno.id;
    }
    console.log(`Alunos existentes: ${Object.keys(alunoIds).length}`);
    
    // Processar arquivos de eventos
    const eventosFiles = [
      { path: '/home/ubuntu/gestao-dashboards/sample-data/SEBRAEACRE-Eventos.xlsx', empresa: 'SEBRAE ACRE' },
      { path: '/home/ubuntu/gestao-dashboards/sample-data/BS2SEBRAETO-Eventos.xlsx', empresa: 'SEBRAE TO' },
      { path: '/home/ubuntu/gestao-dashboards/sample-data/EMBRAPII-Eventos.xlsx', empresa: 'EMBRAPII' }
    ];
    
    let totalEventos = 0;
    let eventosInseridos = 0;
    let alunosNaoEncontrados = new Set();
    
    for (const file of eventosFiles) {
      const records = parseEventsFile(file.path, file.empresa);
      totalEventos += records.length;
      
      const programId = programIds[file.empresa];
      if (!programId) {
        console.log(`  Programa não encontrado: ${file.empresa}`);
        continue;
      }
      
      // Inserir eventos em lote
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        for (const rec of batch) {
          const key = `${rec.idUsuario}_${programId}`;
          const alunoId = alunoIds[key];
          
          if (!alunoId) {
            alunosNaoEncontrados.add(`${rec.idUsuario} - ${rec.nomeAluno}`);
            continue;
          }
          
          await conn.execute(
            `INSERT INTO event_participation (alunoId, eventId, status) VALUES (?, 1, ?)`,
            [alunoId, rec.presenca]
          );
          eventosInseridos++;
        }
        
        // Mostrar progresso
        if ((i + batchSize) % 500 === 0 || i + batchSize >= records.length) {
          console.log(`  Progresso ${file.empresa}: ${Math.min(i + batchSize, records.length)}/${records.length}`);
        }
      }
    }
    
    console.log('\n=== Importação de eventos concluída ===');
    console.log(`Total de registros processados: ${totalEventos}`);
    console.log(`Eventos inseridos: ${eventosInseridos}`);
    console.log(`Alunos não encontrados: ${alunosNaoEncontrados.size}`);
    
    if (alunosNaoEncontrados.size > 0 && alunosNaoEncontrados.size <= 10) {
      console.log('Alunos não encontrados:');
      for (const aluno of alunosNaoEncontrados) {
        console.log(`  - ${aluno}`);
      }
    }
    
  } catch (error) {
    console.error('Erro durante importação:', error);
    throw error;
  } finally {
    await conn.end();
  }
}

importEvents().catch(console.error);
