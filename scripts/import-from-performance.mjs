import XLSX from 'xlsx';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function getConnection() {
  return await mysql.createConnection({
    uri: DATABASE_URL,
    connectTimeout: 60000,
    waitForConnections: true
  });
}

// Função para identificar a empresa a partir do nome da turma
function identificarEmpresa(nomeTurma) {
  if (!nomeTurma) return null;
  const turmaLower = nomeTurma.toLowerCase();
  
  if (turmaLower.includes('banrisul')) return 'BANRISUL';
  if (turmaLower.includes('sebrae acre')) return 'SEBRAE ACRE';
  if (turmaLower.includes('sebrae tocantins')) return 'SEBRAE TO';
  if (turmaLower.includes('embrapii')) return 'EMBRAPII';
  
  return null;
}

// Função para extrair o ano da turma
function extrairAno(nomeTurma) {
  if (!nomeTurma) return 2025;
  const match = nomeTurma.match(/\[(\d{4})\]/);
  return match ? parseInt(match[1]) : 2025;
}

async function main() {
  const conn = await getConnection();
  
  console.log('=== IMPORTAÇÃO BASEADA NA PLANILHA DE PERFORMANCE ===\n');
  
  // 1. Ler planilha de Performance (BASE PRINCIPAL)
  console.log('1. Lendo planilha de Performance (BASE PRINCIPAL)...');
  const perfFile = '/home/ubuntu/upload/relatorio-de-performance.xlsx';
  const perfWb = XLSX.readFile(perfFile);
  const perfSheet = perfWb.Sheets[perfWb.SheetNames[0]];
  const perfData = XLSX.utils.sheet_to_json(perfSheet);
  
  // Coletar usuários únicos da Performance
  const usuariosPerformance = new Map();
  const turmasPerformance = new Map();
  const empresasSet = new Set();
  
  for (const row of perfData) {
    const idUsuario = String(row['Id Usuário'] || '').trim();
    const nome = row['Nome Usuário'] || '';
    const email = row['E-mail'] || '';
    const idTurma = String(row['Id Turma (agrupador 1)'] || '').trim();
    const nomeTurma = row['Turma (agrupador 1)'] || '';
    
    if (!idUsuario || idUsuario === 'Id Usuário') continue;
    
    const empresa = identificarEmpresa(nomeTurma);
    if (!empresa) continue;
    
    empresasSet.add(empresa);
    
    if (!usuariosPerformance.has(idUsuario)) {
      usuariosPerformance.set(idUsuario, { 
        idUsuario, 
        nome, 
        email, 
        idTurma, 
        nomeTurma, 
        empresa 
      });
    }
    
    if (!turmasPerformance.has(idTurma)) {
      turmasPerformance.set(idTurma, {
        idTurma,
        nome: nomeTurma,
        empresa,
        ano: extrairAno(nomeTurma)
      });
    }
  }
  
  console.log(`   - ${usuariosPerformance.size} usuários únicos encontrados`);
  console.log(`   - ${turmasPerformance.size} turmas encontradas`);
  console.log(`   - ${empresasSet.size} empresas: ${[...empresasSet].join(', ')}`);
  
  // 2. Ler planilhas de Mentorias
  console.log('\n2. Lendo planilhas de Mentorias...');
  const mentoriasFiles = [
    { path: '/home/ubuntu/upload/SEBRAEACRE-Mentorias.xlsx', empresa: 'SEBRAE ACRE' },
    { path: '/home/ubuntu/upload/BS2SEBRAETO-Tutorias(respostas).xlsx', empresa: 'SEBRAE TO' },
    { path: '/home/ubuntu/upload/EMBRAPII-Mentorias.xlsx', empresa: 'EMBRAPII' }
  ];
  
  const usuariosMentorias = new Map();
  const sessoesMentorias = [];
  
  for (const file of mentoriasFiles) {
    try {
      const wb = XLSX.readFile(file.path);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
      
      for (const row of data) {
        const idUsuario = String(row['Id Usuário '] || row['Id Usuário'] || '').trim();
        const nomeAluno = row['Nome do aluno'] || '';
        const consultor = row['Nome do Consultor'] || row['Consultor'] || '';
        const mentoria = row['Mentoria'] || '';
        const atividade = row['Atividade proposta'] || '';
        const engajamento = row['Evolução/Engajamento'] || '';
        const dataMentoria = row['Data da Mentoria'] || '';
        
        if (!idUsuario) continue;
        
        if (!usuariosMentorias.has(idUsuario)) {
          usuariosMentorias.set(idUsuario, { idUsuario, nome: nomeAluno, empresa: file.empresa });
        }
        
        sessoesMentorias.push({
          idUsuario,
          consultor,
          mentoria,
          atividade,
          engajamento,
          dataMentoria,
          empresa: file.empresa
        });
      }
      
      console.log(`   - ${file.empresa}: ${data.length} registros`);
    } catch (e) {
      console.log(`   - ${file.empresa}: ERRO - ${e.message}`);
    }
  }
  
  console.log(`   - Total: ${usuariosMentorias.size} usuários únicos em mentorias`);
  
  // 3. Ler planilhas de Eventos
  console.log('\n3. Lendo planilhas de Eventos...');
  const eventosFiles = [
    { path: '/home/ubuntu/upload/SEBRAEACRE-Eventos.xlsx', empresa: 'SEBRAE ACRE' },
    { path: '/home/ubuntu/upload/BS2SEBRAETO-Eventos.xlsx', empresa: 'SEBRAE TO' },
    { path: '/home/ubuntu/upload/EMBRAPII-Eventos.xlsx', empresa: 'EMBRAPII' }
  ];
  
  const usuariosEventos = new Map();
  
  for (const file of eventosFiles) {
    try {
      const wb = XLSX.readFile(file.path);
      // Eventos tem sheet PARTICIPAÇÃO_EVENTOS
      const sheetName = wb.SheetNames.find(s => s.includes('PARTICIPA')) || wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { range: 2 }); // Cabeçalho na linha 3
      
      for (const row of data) {
        const idUsuario = String(row['Id Usuário'] || row['Id Usuário '] || '').trim();
        const nomeAluno = row['Nome do aluno'] || row['Nome'] || '';
        
        if (!idUsuario) continue;
        
        if (!usuariosEventos.has(idUsuario)) {
          usuariosEventos.set(idUsuario, { idUsuario, nome: nomeAluno, empresa: file.empresa });
        }
      }
      
      console.log(`   - ${file.empresa}: ${data.length} registros`);
    } catch (e) {
      console.log(`   - ${file.empresa}: ERRO - ${e.message}`);
    }
  }
  
  console.log(`   - Total: ${usuariosEventos.size} usuários únicos em eventos`);
  
  // 4. VALIDAÇÃO CRUZADA - Gerar Alertas
  console.log('\n' + '='.repeat(60));
  console.log('=== RELATÓRIO DE INCONSISTÊNCIAS ===');
  console.log('='.repeat(60));
  
  const alertas = {
    mentoriaSemPerformance: [],
    eventosSemPerformance: [],
    performanceSemMentoria: [],
    performanceSemEventos: []
  };
  
  // Alunos em Mentoria mas NÃO na Performance
  for (const [id, user] of usuariosMentorias) {
    if (!usuariosPerformance.has(id)) {
      alertas.mentoriaSemPerformance.push({
        id,
        nome: user.nome,
        empresa: user.empresa
      });
    }
  }
  
  // Alunos em Eventos mas NÃO na Performance
  for (const [id, user] of usuariosEventos) {
    if (!usuariosPerformance.has(id)) {
      alertas.eventosSemPerformance.push({
        id,
        nome: user.nome,
        empresa: user.empresa
      });
    }
  }
  
  // Alunos na Performance mas NÃO na Mentoria (exceto Banrisul que não tem planilha de mentoria)
  for (const [id, user] of usuariosPerformance) {
    if (user.empresa !== 'BANRISUL' && !usuariosMentorias.has(id)) {
      alertas.performanceSemMentoria.push({
        id,
        nome: user.nome,
        empresa: user.empresa
      });
    }
  }
  
  // Alunos na Performance mas NÃO nos Eventos (exceto Banrisul)
  for (const [id, user] of usuariosPerformance) {
    if (user.empresa !== 'BANRISUL' && !usuariosEventos.has(id)) {
      alertas.performanceSemEventos.push({
        id,
        nome: user.nome,
        empresa: user.empresa
      });
    }
  }
  
  // Exibir alertas
  console.log('\n⚠️  ALERTA: Alunos em MENTORIA mas NÃO na PERFORMANCE:');
  if (alertas.mentoriaSemPerformance.length === 0) {
    console.log('   ✅ Nenhum encontrado');
  } else {
    alertas.mentoriaSemPerformance.forEach(a => {
      console.log(`   - ID: ${a.id} | ${a.nome} | ${a.empresa}`);
    });
  }
  
  console.log('\n⚠️  ALERTA: Alunos em EVENTOS mas NÃO na PERFORMANCE:');
  if (alertas.eventosSemPerformance.length === 0) {
    console.log('   ✅ Nenhum encontrado');
  } else {
    alertas.eventosSemPerformance.forEach(a => {
      console.log(`   - ID: ${a.id} | ${a.nome} | ${a.empresa}`);
    });
  }
  
  console.log('\n⚠️  ALERTA: Alunos na PERFORMANCE mas NÃO na MENTORIA:');
  if (alertas.performanceSemMentoria.length === 0) {
    console.log('   ✅ Nenhum encontrado');
  } else {
    alertas.performanceSemMentoria.slice(0, 20).forEach(a => {
      console.log(`   - ID: ${a.id} | ${a.nome} | ${a.empresa}`);
    });
    if (alertas.performanceSemMentoria.length > 20) {
      console.log(`   ... e mais ${alertas.performanceSemMentoria.length - 20} alunos`);
    }
  }
  
  console.log('\n⚠️  ALERTA: Alunos na PERFORMANCE mas NÃO nos EVENTOS:');
  if (alertas.performanceSemEventos.length === 0) {
    console.log('   ✅ Nenhum encontrado');
  } else {
    alertas.performanceSemEventos.slice(0, 20).forEach(a => {
      console.log(`   - ID: ${a.id} | ${a.nome} | ${a.empresa}`);
    });
    if (alertas.performanceSemEventos.length > 20) {
      console.log(`   ... e mais ${alertas.performanceSemEventos.length - 20} alunos`);
    }
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('=== RESUMO ===');
  console.log('='.repeat(60));
  console.log(`Total de alunos na Performance (BASE): ${usuariosPerformance.size}`);
  console.log(`Total de alunos em Mentorias: ${usuariosMentorias.size}`);
  console.log(`Total de alunos em Eventos: ${usuariosEventos.size}`);
  console.log(`\nInconsistências encontradas:`);
  console.log(`- Em Mentoria mas não na Performance: ${alertas.mentoriaSemPerformance.length}`);
  console.log(`- Em Eventos mas não na Performance: ${alertas.eventosSemPerformance.length}`);
  console.log(`- Na Performance mas não em Mentoria: ${alertas.performanceSemMentoria.length}`);
  console.log(`- Na Performance mas não em Eventos: ${alertas.performanceSemEventos.length}`);
  
  // Perguntar se deve continuar com a importação
  console.log('\n' + '='.repeat(60));
  console.log('Deseja continuar com a importação? (Os dados serão importados)');
  console.log('='.repeat(60));
  
  // 5. LIMPAR DADOS ANTIGOS
  console.log('\n5. Limpando dados antigos...');
  await conn.execute('DELETE FROM mentoring_sessions');
  await conn.execute('DELETE FROM alunos');
  await conn.execute('DELETE FROM turmas');
  await conn.execute('DELETE FROM consultors');
  await conn.execute('DELETE FROM programs');
  console.log('   ✅ Dados antigos removidos');
  
  // 6. CRIAR EMPRESAS
  console.log('\n6. Criando empresas...');
  const empresasMap = new Map();
  const empresasList = ['SEBRAE ACRE', 'SEBRAE TO', 'EMBRAPII', 'BANRISUL'];
  
  for (const empresa of empresasList) {
    const code = empresa.replace(/ /g, '_').toUpperCase();
    const [result] = await conn.execute(
      'INSERT INTO programs (name, code, description, isActive) VALUES (?, ?, ?, 1)',
      [empresa, code, `Programa ${empresa}`, 1]
    );
    empresasMap.set(empresa, result.insertId);
    console.log(`   - ${empresa} (ID: ${result.insertId})`);
  }
  
  // 7. CRIAR TURMAS
  console.log('\n7. Criando turmas...');
  const turmasMap = new Map();
  
  for (const [idTurma, turma] of turmasPerformance) {
    const programId = empresasMap.get(turma.empresa);
    if (!programId) continue;
    
    const [result] = await conn.execute(
      'INSERT INTO turmas (name, code, programId, year) VALUES (?, ?, ?, ?)',
      [turma.nome, idTurma, programId, turma.ano]
    );
    turmasMap.set(idTurma, result.insertId);
  }
  console.log(`   - ${turmasMap.size} turmas criadas`);
  
  // 8. CRIAR ALUNOS (da Performance)
  console.log('\n8. Criando alunos (da planilha de Performance)...');
  const alunosMap = new Map();
  
  for (const [idUsuario, user] of usuariosPerformance) {
    const turmaId = turmasMap.get(user.idTurma);
    if (!turmaId) continue;
    
    const [result] = await conn.execute(
      'INSERT INTO alunos (name, idUsuario, email, turmaId, loginId, isActive) VALUES (?, ?, ?, ?, ?, 1)',
      [user.nome, idUsuario, user.email, turmaId, idUsuario]
    );
    alunosMap.set(idUsuario, result.insertId);
  }
  console.log(`   - ${alunosMap.size} alunos criados`);
  
  // 9. CRIAR CONSULTORES
  console.log('\n9. Criando consultores...');
  const consultoresSet = new Set();
  for (const sessao of sessoesMentorias) {
    if (sessao.consultor) {
      consultoresSet.add(sessao.consultor);
    }
  }
  
  const consultoresMap = new Map();
  for (const nome of consultoresSet) {
    const [result] = await conn.execute(
      'INSERT INTO consultors (name, isActive) VALUES (?, 1)',
      [nome]
    );
    consultoresMap.set(nome, result.insertId);
  }
  console.log(`   - ${consultoresMap.size} consultores criados`);
  
  // 10. CRIAR SESSÕES DE MENTORIA
  console.log('\n10. Criando sessões de mentoria...');
  let sessoesCount = 0;
  
  for (const sessao of sessoesMentorias) {
    const alunoId = alunosMap.get(sessao.idUsuario);
    const consultorId = consultoresMap.get(sessao.consultor);
    
    if (!alunoId) continue; // Aluno não está na Performance
    
    // Determinar presença
    const presencaRaw = String(sessao.mentoria || '').toLowerCase();
    const presenca = presencaRaw.includes('presente') ? 'presente' : 'ausente';
    
    // Determinar atividade
    const atividadeRaw = String(sessao.atividade || '').toLowerCase();
    let atividadeStatus = 'sem_tarefa';
    if (atividadeRaw.includes('entregue') && !atividadeRaw.includes('não')) {
      atividadeStatus = 'entregue';
    } else if (atividadeRaw.includes('não') || atividadeRaw.includes('nao')) {
      atividadeStatus = 'nao_entregue';
    }
    
    // Engajamento
    const engajamento = parseInt(sessao.engajamento) || null;
    
    await conn.execute(
      `INSERT INTO mentoring_sessions 
       (alunoId, consultorId, presenca, atividadeStatus, engajamento, ciclo, empresa) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [alunoId, consultorId || 1, presenca, atividadeStatus, engajamento, '', sessao.empresa]
    );
    sessoesCount++;
  }
  console.log(`   - ${sessoesCount} sessões de mentoria criadas`);
  
  // 11. SALVAR ALERTAS NO BANCO
  console.log('\n11. Salvando alertas de inconsistências...');
  // Criar tabela de alertas se não existir
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS data_alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tipo VARCHAR(100) NOT NULL,
      idUsuario VARCHAR(50),
      nome VARCHAR(255),
      empresa VARCHAR(100),
      descricao TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Limpar alertas antigos
  await conn.execute('DELETE FROM data_alerts');
  
  // Inserir novos alertas
  for (const a of alertas.mentoriaSemPerformance) {
    await conn.execute(
      'INSERT INTO data_alerts (tipo, idUsuario, nome, empresa, descricao) VALUES (?, ?, ?, ?, ?)',
      ['MENTORIA_SEM_PERFORMANCE', a.id, a.nome, a.empresa, 'Aluno encontrado em Mentorias mas não consta na base de Performance']
    );
  }
  
  for (const a of alertas.eventosSemPerformance) {
    await conn.execute(
      'INSERT INTO data_alerts (tipo, idUsuario, nome, empresa, descricao) VALUES (?, ?, ?, ?, ?)',
      ['EVENTOS_SEM_PERFORMANCE', a.id, a.nome, a.empresa, 'Aluno encontrado em Eventos mas não consta na base de Performance']
    );
  }
  
  for (const a of alertas.performanceSemMentoria) {
    await conn.execute(
      'INSERT INTO data_alerts (tipo, idUsuario, nome, empresa, descricao) VALUES (?, ?, ?, ?, ?)',
      ['PERFORMANCE_SEM_MENTORIA', a.id, a.nome, a.empresa, 'Aluno consta na Performance mas não foi encontrado em Mentorias']
    );
  }
  
  for (const a of alertas.performanceSemEventos) {
    await conn.execute(
      'INSERT INTO data_alerts (tipo, idUsuario, nome, empresa, descricao) VALUES (?, ?, ?, ?, ?)',
      ['PERFORMANCE_SEM_EVENTOS', a.id, a.nome, a.empresa, 'Aluno consta na Performance mas não foi encontrado em Eventos']
    );
  }
  
  const totalAlertas = alertas.mentoriaSemPerformance.length + 
                       alertas.eventosSemPerformance.length + 
                       alertas.performanceSemMentoria.length + 
                       alertas.performanceSemEventos.length;
  console.log(`   - ${totalAlertas} alertas salvos`);
  
  await conn.end();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('='.repeat(60));
  console.log(`\nResumo final:`);
  console.log(`- ${empresasList.length} empresas`);
  console.log(`- ${turmasMap.size} turmas`);
  console.log(`- ${alunosMap.size} alunos`);
  console.log(`- ${consultoresMap.size} consultores`);
  console.log(`- ${sessoesCount} sessões de mentoria`);
  console.log(`- ${totalAlertas} alertas de inconsistência`);
}

main().catch(console.error);
