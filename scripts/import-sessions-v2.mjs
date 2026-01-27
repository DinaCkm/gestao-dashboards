import XLSX from 'xlsx';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  console.log('=== IMPORTANDO SESSÕES DE MENTORIA ===\n');
  
  // Buscar mapa de alunos
  console.log('1. Buscando alunos...');
  const [alunosRows] = await conn.execute('SELECT id, externalId FROM alunos');
  const alunosMap = new Map();
  alunosRows.forEach(r => alunosMap.set(r.externalId, r.id));
  console.log('   - Alunos encontrados:', alunosMap.size);
  
  // Buscar mapa de consultores
  console.log('2. Buscando consultores...');
  const [consultoresRows] = await conn.execute('SELECT id, name FROM consultors');
  const consultoresMap = new Map();
  consultoresRows.forEach(r => consultoresMap.set(r.name, r.id));
  console.log('   - Consultores encontrados:', consultoresMap.size);
  
  // Ler planilhas de mentorias
  console.log('3. Lendo planilhas de mentorias...');
  const mentoriasFiles = [
    { path: '/home/ubuntu/upload/SEBRAEACRE-Mentorias.xlsx', empresa: 'SEBRAE ACRE' },
    { path: '/home/ubuntu/upload/BS2SEBRAETO-Tutorias(respostas).xlsx', empresa: 'SEBRAE TO' },
    { path: '/home/ubuntu/upload/EMBRAPII-Mentorias.xlsx', empresa: 'EMBRAPII' }
  ];
  
  let totalSessoes = 0;
  let sessoesIgnoradas = 0;
  const alertas = [];
  
  for (const file of mentoriasFiles) {
    console.log('\n   Processando:', file.empresa);
    try {
      const wb = XLSX.readFile(file.path);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
      
      let count = 0;
      for (const row of data) {
        const idUsuario = String(row['Id Usuário '] || row['Id Usuário'] || '').trim();
        const nomeAluno = row['Nome do aluno'] || '';
        const consultor = row['Nome do Consultor'] || row['Consultor'] || '';
        const mentoria = row['Mentoria'] || '';
        const atividade = row['Atividade proposta'] || '';
        const engajamento = row['Evolução/Engajamento'] || '';
        
        if (!idUsuario) continue;
        
        const alunoId = alunosMap.get(idUsuario);
        let consultorId = consultoresMap.get(consultor);
        
        // Se consultor não existe, criar
        if (!consultorId && consultor) {
          try {
            const [result] = await conn.execute(
              'INSERT INTO consultors (name, isActive) VALUES (?, 1)',
              [consultor]
            );
            consultorId = result.insertId;
            consultoresMap.set(consultor, consultorId);
          } catch (e) {
            consultorId = 1;
          }
        }
        
        if (!alunoId) {
          alertas.push({
            tipo: 'ALUNO_NAO_ENCONTRADO',
            empresa: file.empresa,
            idUsuario,
            nome: nomeAluno,
            mensagem: `Aluno "${nomeAluno}" (ID: ${idUsuario}) está na planilha de ${file.empresa} mas NÃO está na planilha de Performance`
          });
          sessoesIgnoradas++;
          continue;
        }
        
        const presencaRaw = String(mentoria || '').toLowerCase();
        const presence = presencaRaw.includes('presente') ? 'presente' : 'ausente';
        
        const atividadeRaw = String(atividade || '').toLowerCase();
        let taskStatus = 'sem_tarefa';
        if (atividadeRaw.includes('entregue') && !atividadeRaw.includes('não') && !atividadeRaw.includes('nao')) {
          taskStatus = 'entregue';
        } else if (atividadeRaw.includes('não') || atividadeRaw.includes('nao')) {
          taskStatus = 'nao_entregue';
        }
        
        const engagementScore = parseInt(engajamento) || null;
        
        try {
          await conn.execute(
            `INSERT INTO mentoring_sessions 
             (alunoId, consultorId, presence, taskStatus, engagementScore) 
             VALUES (?, ?, ?, ?, ?)`,
            [alunoId, consultorId || 1, presence, taskStatus, engagementScore]
          );
          count++;
          totalSessoes++;
        } catch (e) {
          console.log('   ERRO sessão:', e.message);
        }
      }
      console.log('   - Sessões criadas:', count);
    } catch (e) {
      console.log('   ERRO:', e.message);
    }
  }
  
  await conn.end();
  
  console.log('\n' + '='.repeat(60));
  console.log('=== RESULTADO DA IMPORTAÇÃO ===');
  console.log('='.repeat(60));
  console.log('Total de sessões criadas:', totalSessoes);
  console.log('Sessões ignoradas (aluno não na Performance):', sessoesIgnoradas);
  
  if (alertas.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('=== ALERTAS DE INCONSISTÊNCIA ===');
    console.log('='.repeat(60));
    
    const alertasPorEmpresa = {};
    alertas.forEach(a => {
      if (!alertasPorEmpresa[a.empresa]) alertasPorEmpresa[a.empresa] = [];
      alertasPorEmpresa[a.empresa].push(a);
    });
    
    for (const [empresa, lista] of Object.entries(alertasPorEmpresa)) {
      console.log('\n' + empresa + ':');
      lista.slice(0, 10).forEach(a => {
        console.log('  ⚠️', a.nome, '(ID:', a.idUsuario + ')');
      });
      if (lista.length > 10) {
        console.log('  ... e mais', lista.length - 10, 'alunos');
      }
    }
  }
}

main().catch(console.error);
