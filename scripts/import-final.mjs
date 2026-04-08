import XLSX from 'xlsx';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

function identificarEmpresa(nomeTurma) {
  if (!nomeTurma) return null;
  const turmaLower = nomeTurma.toLowerCase();
  if (turmaLower.includes('banrisul')) return 'BANRISUL';
  if (turmaLower.includes('sebrae acre')) return 'SEBRAE ACRE';
  if (turmaLower.includes('sebrae tocantins')) return 'SEBRAE TO';
  if (turmaLower.includes('embrapii')) return 'EMBRAPII';
  return null;
}

function extrairAno(nomeTurma) {
  if (!nomeTurma) return 2025;
  const match = nomeTurma.match(/\[(\d{4})\]/);
  return match ? parseInt(match[1]) : 2025;
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  // Ler planilha de Performance
  console.log('=== IMPORTAÇÃO BASEADA NA PLANILHA DE PERFORMANCE ===\n');
  console.log('1. Lendo planilha de Performance...');
  const perfFile = '/home/ubuntu/upload/relatorio-de-performance.xlsx';
  const perfWb = XLSX.readFile(perfFile);
  const perfSheet = perfWb.Sheets[perfWb.SheetNames[0]];
  const perfData = XLSX.utils.sheet_to_json(perfSheet);
  
  const usuariosPerformance = new Map();
  const turmasPerformance = new Map();
  
  for (const row of perfData) {
    const idUsuario = String(row['Id Usuário'] || '').trim();
    const nome = row['Nome Usuário'] || '';
    const email = row['E-mail'] || '';
    const idTurma = String(row['Id Turma (agrupador 1)'] || '').trim();
    const nomeTurma = row['Turma (agrupador 1)'] || '';
    
    // Ignorar linha de cabeçalho
    if (!idUsuario || idUsuario === 'Id Usuário' || idTurma === 'Id Turma (agrupador 1)') continue;
    
    const empresa = identificarEmpresa(nomeTurma);
    if (!empresa) {
      console.log('Empresa não identificada para turma:', nomeTurma);
      continue;
    }
    
    if (!usuariosPerformance.has(idUsuario)) {
      usuariosPerformance.set(idUsuario, { idUsuario, nome, email, idTurma, nomeTurma, empresa });
    }
    
    if (!turmasPerformance.has(idTurma)) {
      turmasPerformance.set(idTurma, { idTurma, nome: nomeTurma, empresa, ano: extrairAno(nomeTurma) });
    }
  }
  
  console.log('   - Usuários únicos:', usuariosPerformance.size);
  console.log('   - Turmas únicas:', turmasPerformance.size);
  
  // Buscar IDs das empresas
  console.log('\n2. Buscando empresas no banco...');
  const [empresasRows] = await conn.execute('SELECT id, name FROM programs');
  const empresasMap = new Map();
  empresasRows.forEach(r => empresasMap.set(r.name, r.id));
  console.log('   - Empresas encontradas:', [...empresasMap.keys()].join(', '));
  
  // Criar turmas
  console.log('\n3. Criando turmas...');
  const turmasMap = new Map();
  
  for (const [idTurma, turma] of turmasPerformance) {
    const programId = empresasMap.get(turma.empresa);
    if (!programId) {
      console.log('   ERRO: Empresa não encontrada:', turma.empresa);
      continue;
    }
    
    try {
      const [result] = await conn.execute(
        'INSERT INTO turmas (externalId, name, programId, year, isActive) VALUES (?, ?, ?, ?, 1)',
        [idTurma, turma.nome, programId, turma.ano]
      );
      turmasMap.set(idTurma, result.insertId);
      console.log('   + Turma criada:', turma.nome);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        // Buscar ID existente
        const [existing] = await conn.execute('SELECT id FROM turmas WHERE externalId = ?', [idTurma]);
        if (existing.length > 0) {
          turmasMap.set(idTurma, existing[0].id);
          console.log('   = Turma já existe:', turma.nome);
        }
      } else {
        console.log('   ERRO turma:', turma.nome, e.message);
      }
    }
  }
  console.log('   - Total turmas:', turmasMap.size);
  
  // Criar alunos
  console.log('\n4. Criando alunos...');
  let alunosCount = 0;
  const alunosMap = new Map();
  
  for (const [idUsuario, user] of usuariosPerformance) {
    const turmaId = turmasMap.get(user.idTurma);
    if (!turmaId) {
      console.log('   ERRO: Turma não encontrada para:', user.nome, '| idTurma:', user.idTurma);
      continue;
    }
    
    try {
      const [result] = await conn.execute(
        'INSERT INTO alunos (name, externalId, email, turmaId, canLogin, isActive) VALUES (?, ?, ?, ?, 1, 1)',
        [user.nome, idUsuario, user.email, turmaId]
      );
      alunosMap.set(idUsuario, result.insertId);
      alunosCount++;
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        const [existing] = await conn.execute('SELECT id FROM alunos WHERE externalId = ?', [idUsuario]);
        if (existing.length > 0) {
          alunosMap.set(idUsuario, existing[0].id);
        }
      } else {
        console.log('   ERRO aluno:', user.nome, e.message);
      }
    }
  }
  console.log('   - Alunos criados:', alunosCount);
  
  // Importar sessões de mentoria
  console.log('\n5. Importando sessões de mentoria...');
  const mentoriasFiles = [
    { path: '/home/ubuntu/upload/SEBRAEACRE-Mentorias.xlsx', empresa: 'SEBRAE ACRE' },
    { path: '/home/ubuntu/upload/BS2SEBRAETO-Tutorias(respostas).xlsx', empresa: 'SEBRAE TO' },
    { path: '/home/ubuntu/upload/EMBRAPII-Mentorias.xlsx', empresa: 'EMBRAPII' }
  ];
  
  // Primeiro, criar consultores
  const consultoresSet = new Set();
  const sessoesList = [];
  
  for (const file of mentoriasFiles) {
    try {
      const wb = XLSX.readFile(file.path);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
      
      for (const row of data) {
        const idUsuario = String(row['Id Usuário '] || row['Id Usuário'] || '').trim();
        const consultor = row['Nome do Consultor'] || row['Consultor'] || '';
        const mentoria = row['Mentoria'] || '';
        const atividade = row['Atividade proposta'] || '';
        const engajamento = row['Evolução/Engajamento'] || '';
        
        if (!idUsuario) continue;
        if (consultor) consultoresSet.add(consultor);
        
        sessoesList.push({
          idUsuario,
          consultor,
          mentoria,
          atividade,
          engajamento,
          empresa: file.empresa
        });
      }
      console.log('   - ' + file.empresa + ':', data.length, 'registros');
    } catch (e) {
      console.log('   ERRO:', file.empresa, e.message);
    }
  }
  
  // Criar consultores
  console.log('\n6. Criando consultores...');
  const consultoresMap = new Map();
  
  for (const nome of consultoresSet) {
    try {
      const [result] = await conn.execute(
        'INSERT INTO consultors (name, isActive) VALUES (?, 1)',
        [nome]
      );
      consultoresMap.set(nome, result.insertId);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        const [existing] = await conn.execute('SELECT id FROM consultors WHERE name = ?', [nome]);
        if (existing.length > 0) {
          consultoresMap.set(nome, existing[0].id);
        }
      }
    }
  }
  console.log('   - Consultores:', consultoresMap.size);
  
  // Criar sessões
  console.log('\n7. Criando sessões de mentoria...');
  let sessoesCount = 0;
  
  for (const sessao of sessoesList) {
    const alunoId = alunosMap.get(sessao.idUsuario);
    const consultorId = consultoresMap.get(sessao.consultor) || 1;
    
    if (!alunoId) continue; // Aluno não está na Performance
    
    const presencaRaw = String(sessao.mentoria || '').toLowerCase();
    const presenca = presencaRaw.includes('presente') ? 'presente' : 'ausente';
    
    const atividadeRaw = String(sessao.atividade || '').toLowerCase();
    let atividadeStatus = 'sem_tarefa';
    if (atividadeRaw.includes('entregue') && !atividadeRaw.includes('não') && !atividadeRaw.includes('nao')) {
      atividadeStatus = 'entregue';
    } else if (atividadeRaw.includes('não') || atividadeRaw.includes('nao')) {
      atividadeStatus = 'nao_entregue';
    }
    
    const engajamento = parseInt(sessao.engajamento) || null;
    
    try {
      await conn.execute(
        `INSERT INTO mentoring_sessions 
         (alunoId, consultorId, presenca, atividadeStatus, engajamento, ciclo, empresa) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [alunoId, consultorId, presenca, atividadeStatus, engajamento, '', sessao.empresa]
      );
      sessoesCount++;
    } catch (e) {
      // Ignorar erros de duplicação
    }
  }
  console.log('   - Sessões criadas:', sessoesCount);
  
  await conn.end();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ IMPORTAÇÃO CONCLUÍDA!');
  console.log('='.repeat(50));
  console.log('Resumo:');
  console.log('- Empresas: 4 (SEBRAE ACRE, SEBRAE TO, EMBRAPII, BANRISUL)');
  console.log('- Turmas:', turmasMap.size);
  console.log('- Alunos:', alunosCount);
  console.log('- Consultores:', consultoresMap.size);
  console.log('- Sessões de mentoria:', sessoesCount);
}

main().catch(console.error);
