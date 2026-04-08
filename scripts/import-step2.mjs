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
  // Ler planilha de Performance
  console.log('Lendo planilha de Performance...');
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
    
    if (!idUsuario || idUsuario === 'Id Usuário') continue;
    
    const empresa = identificarEmpresa(nomeTurma);
    if (!empresa) continue;
    
    if (!usuariosPerformance.has(idUsuario)) {
      usuariosPerformance.set(idUsuario, { idUsuario, nome, email, idTurma, nomeTurma, empresa });
    }
    
    if (!turmasPerformance.has(idTurma)) {
      turmasPerformance.set(idTurma, { idTurma, nome: nomeTurma, empresa, ano: extrairAno(nomeTurma) });
    }
  }
  
  console.log('Usuários:', usuariosPerformance.size);
  console.log('Turmas:', turmasPerformance.size);
  
  // Conectar ao banco
  const conn = await mysql.createConnection(DATABASE_URL);
  
  // Buscar IDs das empresas
  const [empresasRows] = await conn.execute('SELECT id, name FROM programs');
  const empresasMap = new Map();
  empresasRows.forEach(r => empresasMap.set(r.name, r.id));
  console.log('Empresas no banco:', empresasMap);
  
  // Criar turmas
  console.log('\\nCriando turmas...');
  const turmasMap = new Map();
  
  for (const [idTurma, turma] of turmasPerformance) {
    const programId = empresasMap.get(turma.empresa);
    if (!programId) {
      console.log('Empresa não encontrada:', turma.empresa);
      continue;
    }
    
    try {
      const [result] = await conn.execute(
        'INSERT INTO turmas (name, code, programId, year) VALUES (?, ?, ?, ?)',
        [turma.nome, idTurma, programId, turma.ano]
      );
      turmasMap.set(idTurma, result.insertId);
    } catch (e) {
      console.log('Erro turma:', turma.nome, e.message);
    }
  }
  console.log('Turmas criadas:', turmasMap.size);
  
  // Criar alunos
  console.log('\\nCriando alunos...');
  let alunosCount = 0;
  
  for (const [idUsuario, user] of usuariosPerformance) {
    const turmaId = turmasMap.get(user.idTurma);
    if (!turmaId) {
      console.log('Turma não encontrada para:', user.nome);
      continue;
    }
    
    try {
      await conn.execute(
        'INSERT INTO alunos (name, idUsuario, email, turmaId, loginId, isActive) VALUES (?, ?, ?, ?, ?, 1)',
        [user.nome, idUsuario, user.email, turmaId, idUsuario]
      );
      alunosCount++;
    } catch (e) {
      console.log('Erro aluno:', user.nome, e.message);
    }
  }
  console.log('Alunos criados:', alunosCount);
  
  await conn.end();
  console.log('\\nConcluído!');
}

main().catch(console.error);
