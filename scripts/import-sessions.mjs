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
  
  for (const file of mentoriasFiles) {
    console.log('\n   Processando:', file.empresa);
    try {
      const wb = XLSX.readFile(file.path);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
      
      let count = 0;
      for (const row of data) {
        const idUsuario = String(row['Id Usuário '] || row['Id Usuário'] || '').trim();
        const consultor = row['Nome do Consultor'] || row['Consultor'] || '';
        const mentoria = row['Mentoria'] || '';
        const atividade = row['Atividade proposta'] || '';
        const engajamento = row['Evolução/Engajamento'] || '';
        
        if (!idUsuario) continue;
        
        const alunoId = alunosMap.get(idUsuario);
        const consultorId = consultoresMap.get(consultor) || 1;
        
        if (!alunoId) {
          sessoesIgnoradas++;
          continue;
        }
        
        const presencaRaw = String(mentoria || '').toLowerCase();
        const presenca = presencaRaw.includes('presente') ? 'presente' : 'ausente';
        
        const atividadeRaw = String(atividade || '').toLowerCase();
        let atividadeStatus = 'sem_tarefa';
        if (atividadeRaw.includes('entregue') && !atividadeRaw.includes('não') && !atividadeRaw.includes('nao')) {
          atividadeStatus = 'entregue';
        } else if (atividadeRaw.includes('não') || atividadeRaw.includes('nao')) {
          atividadeStatus = 'nao_entregue';
        }
        
        const engajamentoNum = parseInt(engajamento) || null;
        
        try {
          await conn.execute(
            `INSERT INTO mentoring_sessions 
             (alunoId, consultorId, presenca, atividadeStatus, engajamento, ciclo, empresa) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [alunoId, consultorId, presenca, atividadeStatus, engajamentoNum, '', file.empresa]
          );
          count++;
          totalSessoes++;
        } catch (e) {
          // Ignorar erros
        }
      }
      console.log('   - Sessões criadas:', count);
    } catch (e) {
      console.log('   ERRO:', e.message);
    }
  }
  
  await conn.end();
  
  console.log('\n=== RESULTADO ===');
  console.log('Total de sessões criadas:', totalSessoes);
  console.log('Sessões ignoradas (aluno não encontrado):', sessoesIgnoradas);
}

main().catch(console.error);
