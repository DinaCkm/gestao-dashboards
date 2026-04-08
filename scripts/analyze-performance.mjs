import XLSX from 'xlsx';

const file = '/home/ubuntu/upload/relatorio-de-performance.xlsx';
const wb = XLSX.readFile(file);
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('=== ANÁLISE DA PLANILHA DE PERFORMANCE ===');
console.log('Total de registros:', data.length);

// Coletar IDs únicos de usuários
const usuarios = new Map();
const turmas = new Set();
const competencias = new Set();

for (const row of data) {
  const idUsuario = row['Id Usuário'];
  const nome = row['Nome Usuário'];
  const email = row['E-mail'];
  const idTurma = row['Id Turma (agrupador 1)'];
  const turma = row['Turma (agrupador 1)'];
  const idCompetencia = row['Id Competência (agrupador 2)'];
  const competencia = row['Competência (agrupador 2)'];
  
  if (!usuarios.has(idUsuario)) {
    usuarios.set(idUsuario, { nome, email, idTurma, turma });
  }
  
  turmas.add(turma);
  competencias.add(competencia);
}

console.log('\nUsuários únicos:', usuarios.size);
console.log('Turmas únicas:', turmas.size);
console.log('Competências únicas:', competencias.size);

console.log('\n=== TURMAS ENCONTRADAS ===');
[...turmas].forEach(t => console.log('-', t));

console.log('\n=== COMPETÊNCIAS ENCONTRADAS ===');
[...competencias].slice(0, 10).forEach(c => console.log('-', c));
if (competencias.size > 10) console.log('... e mais', competencias.size - 10);

console.log('\n=== AMOSTRA DE USUÁRIOS ===');
let count = 0;
for (const [id, user] of usuarios) {
  if (count++ >= 5) break;
  console.log('ID:', id, '| Nome:', user.nome, '| Email:', user.email, '| Turma:', user.turma);
}
