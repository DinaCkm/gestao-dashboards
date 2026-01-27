import XLSX from 'xlsx';

const wb = XLSX.readFile('/home/ubuntu/upload/relatorio-de-performance.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

const turmas = new Map();
for (const row of data) {
  const idTurma = String(row['Id Turma (agrupador 1)'] || '').trim();
  const nomeTurma = row['Turma (agrupador 1)'] || '';
  if (idTurma && !turmas.has(idTurma)) {
    turmas.set(idTurma, nomeTurma);
  }
}

console.log('Turmas encontradas:');
for (const [id, nome] of turmas) {
  console.log('ID:', id, '| Nome:', nome);
}
