import XLSX from 'xlsx';
import mysql from 'mysql2/promise';

// Database connection
const DATABASE_URL = process.env.DATABASE_URL;

async function getConnection() {
  return await mysql.createConnection(DATABASE_URL);
}

// Parse mentoring file (SEBRAE ACRE, SEBRAE TO, EMBRAPII)
function parseMentoringFile(filePath, empresa) {
  console.log(`Processando mentorias: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  const records = [];
  for (const row of data) {
    // Nomes das colunas baseados na análise das planilhas reais
    const idUsuario = row['Id Usuário '] || row['Id Usuário'] || row['ID Usuário'] || '';
    const nomeAluno = row['Nome do aluno'] || row['Nome do Aluno'] || row['Nome'] || '';
    const turma = row['Grupo/Turma'] || row['Turma'] || row['Id Turma'] || '';
    const trilha = row['TRILHA'] || row['Trilha'] || '';
    const consultor = row['Nome do Consultor'] || row['Consultor'] || '';
    const ciclo = row['Ciclo'] || '';
    const mentoria = row['Mentoria'] || '';
    
    // Presença - verificar se contém "Presente"
    const presencaRaw = String(mentoria || '');
    const presenca = presencaRaw.toLowerCase().includes('presente') ? 'presente' : 'ausente';
    
    // Atividade
    const atividadeRaw = row['Atividade proposta'] || '';
    let atividadeEntregue = 'sem_tarefa';
    const atividadeStr = String(atividadeRaw).toLowerCase();
    if (atividadeStr.includes('entregue') && !atividadeStr.includes('não')) {
      atividadeEntregue = 'entregue';
    } else if (atividadeStr.includes('não') || atividadeStr.includes('nao')) {
      atividadeEntregue = 'nao_entregue';
    } else if (atividadeStr.length > 0) {
      atividadeEntregue = 'entregue'; // Se tem descrição, considera entregue
    }
    
    // Engajamento (nota 1-5)
    const engajamentoRaw = row['Evolução/Engajamento'] || row['Engajamento'] || '';
    const engajamento = parseInt(engajamentoRaw) || null;
    
    if (nomeAluno && String(idUsuario)) {
      records.push({
        idUsuario: String(idUsuario).trim(),
        nomeAluno: String(nomeAluno).trim(),
        empresa,
        turma: String(turma).trim(),
        trilha: String(trilha).trim(),
        consultor: String(consultor).trim(),
        ciclo: String(ciclo).trim(),
        mentoria: String(mentoria).trim(),
        presenca,
        atividadeEntregue,
        engajamento
      });
    }
  }
  
  console.log(`  -> ${records.length} registros de mentoria encontrados`);
  return records;
}

// Parse events file
function parseEventsFile(filePath, empresa) {
  console.log(`Processando eventos: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  // Mostrar cabeçalhos para debug
  if (data.length > 0) {
    console.log(`  Colunas encontradas: ${Object.keys(data[0]).join(', ')}`);
  }
  
  const records = [];
  for (const row of data) {
    const idUsuario = row['Id Usuário '] || row['Id Usuário'] || row['ID Usuário'] || row['Id Usuario'] || '';
    const nomeAluno = row['Nome do aluno'] || row['Nome do Aluno'] || row['Nome'] || row['Participante'] || '';
    const tituloEvento = row['Título do Evento'] || row['Evento'] || row['Nome do Evento'] || row['Webinar'] || row['Título'] || '';
    
    // Presença
    const presencaRaw = row['Status Presença'] || row['Presença'] || row['Status'] || row['Presenca'] || '';
    const presenca = String(presencaRaw).toLowerCase().includes('presente') ? 'presente' : 'ausente';
    
    if (nomeAluno && String(idUsuario)) {
      records.push({
        idUsuario: String(idUsuario).trim(),
        nomeAluno: String(nomeAluno).trim(),
        empresa,
        tituloEvento: String(tituloEvento).trim(),
        presenca
      });
    }
  }
  
  console.log(`  -> ${records.length} registros de eventos encontrados`);
  return records;
}

// Parse performance report
function parsePerformanceFile(filePath) {
  console.log(`Processando relatório de performance: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  // Mostrar cabeçalhos para debug
  if (data.length > 0) {
    console.log(`  Colunas encontradas: ${Object.keys(data[0]).slice(0, 10).join(', ')}...`);
  }
  
  const records = [];
  for (const row of data) {
    const idUsuario = row['Id Usuário '] || row['Id Usuário'] || row['ID Usuário'] || '';
    const nomeAluno = row['Nome do aluno'] || row['Nome do Aluno'] || row['Nome'] || '';
    
    // Coletar todas as notas de competências
    const notas = [];
    for (const [key, value] of Object.entries(row)) {
      // Procurar colunas que parecem ser notas (números entre 0 e 10)
      if (typeof value === 'number' && value >= 0 && value <= 10) {
        notas.push({ competencia: key, nota: value });
      }
    }
    
    if (nomeAluno) {
      records.push({
        idUsuario: String(idUsuario).trim(),
        nomeAluno: String(nomeAluno).trim(),
        notas
      });
    }
  }
  
  console.log(`  -> ${records.length} registros de performance encontrados`);
  return records;
}

async function importData() {
  console.log('=== Iniciando importação de dados ===\n');
  
  const conn = await getConnection();
  
  try {
    // 1. Criar programas (empresas)
    console.log('1. Criando programas...');
    const programas = [
      { code: 'SEBRAE_ACRE', name: 'SEBRAE ACRE', description: 'Programa SEBRAE Acre' },
      { code: 'SEBRAE_TO', name: 'SEBRAE TO', description: 'Programa SEBRAE Tocantins' },
      { code: 'EMBRAPII', name: 'EMBRAPII', description: 'Programa EMBRAPII' }
    ];
    
    const programIds = {};
    for (const prog of programas) {
      await conn.execute(
        `INSERT INTO programs (code, name, description, isActive) 
         VALUES (?, ?, ?, 1) 
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [prog.code, prog.name, prog.description]
      );
      const [rows] = await conn.execute('SELECT id FROM programs WHERE code = ?', [prog.code]);
      programIds[prog.name] = rows[0].id;
      console.log(`  -> Programa ${prog.name} criado (ID: ${programIds[prog.name]})`);
    }
    
    // 2. Processar arquivos de mentorias
    console.log('\n2. Processando arquivos de mentorias...');
    const mentoriasFiles = [
      { path: '/home/ubuntu/gestao-dashboards/sample-data/SEBRAEACRE-Mentorias.xlsx', empresa: 'SEBRAE ACRE' },
      { path: '/home/ubuntu/gestao-dashboards/sample-data/BS2SEBRAETO-Tutorias(respostas).xlsx', empresa: 'SEBRAE TO' },
      { path: '/home/ubuntu/gestao-dashboards/sample-data/EMBRAPII-Mentorias.xlsx', empresa: 'EMBRAPII' }
    ];
    
    const allMentorias = [];
    const alunosMap = new Map();
    const turmasMap = new Map();
    
    for (const file of mentoriasFiles) {
      const records = parseMentoringFile(file.path, file.empresa);
      allMentorias.push(...records);
      
      // Coletar alunos únicos
      for (const rec of records) {
        const key = `${rec.idUsuario}_${rec.empresa}`;
        if (!alunosMap.has(key)) {
          alunosMap.set(key, {
            externalId: rec.idUsuario,
            name: rec.nomeAluno,
            empresa: rec.empresa,
            turma: rec.turma,
            trilha: rec.trilha
          });
        }
        
        // Coletar turmas únicas
        if (rec.turma) {
          const turmaKey = `${rec.turma}_${rec.empresa}`;
          if (!turmasMap.has(turmaKey)) {
            turmasMap.set(turmaKey, {
              externalId: rec.turma,
              name: rec.turma,
              empresa: rec.empresa
            });
          }
        }
      }
    }
    
    // 3. Processar arquivos de eventos
    console.log('\n3. Processando arquivos de eventos...');
    const eventosFiles = [
      { path: '/home/ubuntu/gestao-dashboards/sample-data/SEBRAEACRE-Eventos.xlsx', empresa: 'SEBRAE ACRE' },
      { path: '/home/ubuntu/gestao-dashboards/sample-data/BS2SEBRAETO-Eventos.xlsx', empresa: 'SEBRAE TO' },
      { path: '/home/ubuntu/gestao-dashboards/sample-data/EMBRAPII-Eventos.xlsx', empresa: 'EMBRAPII' }
    ];
    
    const allEventos = [];
    for (const file of eventosFiles) {
      const records = parseEventsFile(file.path, file.empresa);
      allEventos.push(...records);
      
      // Coletar alunos únicos dos eventos
      for (const rec of records) {
        const key = `${rec.idUsuario}_${rec.empresa}`;
        if (!alunosMap.has(key) && rec.idUsuario) {
          alunosMap.set(key, {
            externalId: rec.idUsuario,
            name: rec.nomeAluno,
            empresa: rec.empresa,
            turma: '',
            trilha: ''
          });
        }
      }
    }
    
    // 4. Processar relatório de performance
    console.log('\n4. Processando relatório de performance...');
    const performanceRecords = parsePerformanceFile('/home/ubuntu/gestao-dashboards/sample-data/relatorio-de-performance.xlsx');
    
    // 5. Inserir turmas
    console.log('\n5. Inserindo turmas...');
    const turmaIds = {};
    for (const [key, turma] of turmasMap) {
      const programId = programIds[turma.empresa];
      if (!programId) continue;
      
      // Criar um ID externo único baseado no nome da turma
      const externalId = turma.externalId.substring(0, 100);
      
      await conn.execute(
        `INSERT INTO turmas (externalId, name, programId, year, isActive) 
         VALUES (?, ?, ?, 2024, 1) 
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [externalId, turma.name.substring(0, 255), programId]
      );
      const [rows] = await conn.execute('SELECT id FROM turmas WHERE externalId = ? AND programId = ?', [externalId, programId]);
      if (rows[0]) {
        turmaIds[key] = rows[0].id;
      }
    }
    console.log(`  -> ${turmasMap.size} turmas inseridas`);
    
    // 6. Inserir alunos
    console.log('\n6. Inserindo alunos...');
    const alunoIds = {};
    let alunosInseridos = 0;
    for (const [key, aluno] of alunosMap) {
      const programId = programIds[aluno.empresa];
      if (!programId) continue;
      
      const turmaKey = `${aluno.turma}_${aluno.empresa}`;
      const turmaId = turmaIds[turmaKey] || null;
      
      const externalId = aluno.externalId.substring(0, 100);
      
      await conn.execute(
        `INSERT INTO alunos (externalId, name, programId, turmaId, isActive) 
         VALUES (?, ?, ?, ?, 1) 
         ON DUPLICATE KEY UPDATE name = VALUES(name), turmaId = VALUES(turmaId)`,
        [externalId, aluno.name.substring(0, 255), programId, turmaId]
      );
      const [rows] = await conn.execute('SELECT id FROM alunos WHERE externalId = ? AND programId = ?', [externalId, programId]);
      if (rows[0]) {
        alunoIds[key] = rows[0].id;
        alunosInseridos++;
      }
    }
    console.log(`  -> ${alunosInseridos} alunos inseridos`);
    
    // 7. Inserir sessões de mentoria
    console.log('\n7. Inserindo sessões de mentoria...');
    let mentoriasInseridas = 0;
    for (const rec of allMentorias) {
      const key = `${rec.idUsuario}_${rec.empresa}`;
      const alunoId = alunoIds[key];
      if (!alunoId) continue;
      
      await conn.execute(
        `INSERT INTO mentoring_sessions (alunoId, consultorId, presence, taskStatus, engagementScore) 
         VALUES (?, 1, ?, ?, ?)`,
        [alunoId, rec.presenca, rec.atividadeEntregue, rec.engajamento]
      );
      mentoriasInseridas++;
    }
    console.log(`  -> ${mentoriasInseridas} sessões de mentoria inseridas`);
    
    // 8. Inserir participações em eventos
    console.log('\n8. Inserindo participações em eventos...');
    let eventosInseridos = 0;
    for (const rec of allEventos) {
      const key = `${rec.idUsuario}_${rec.empresa}`;
      const alunoId = alunoIds[key];
      if (!alunoId) continue;
      
      await conn.execute(
        `INSERT INTO event_participation (alunoId, eventId, status) 
         VALUES (?, 1, ?)`,
        [alunoId, rec.presenca]
      );
      eventosInseridos++;
    }
    console.log(`  -> ${eventosInseridos} participações em eventos inseridas`);
    
    // 9. Resumo
    console.log('\n=== Importação concluída ===');
    console.log(`Programas: ${Object.keys(programIds).length}`);
    console.log(`Turmas: ${turmasMap.size}`);
    console.log(`Alunos: ${alunosInseridos}`);
    console.log(`Sessões de Mentoria: ${mentoriasInseridas}`);
    console.log(`Participações em Eventos: ${eventosInseridos}`);
    
  } catch (error) {
    console.error('Erro durante importação:', error);
    throw error;
  } finally {
    await conn.end();
  }
}

importData().catch(console.error);
