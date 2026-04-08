import XLSX from 'xlsx';

// Analisar mentores em SEBRAE ACRE
const wb1 = XLSX.readFile('/home/ubuntu/gestao-dashboards/sample-data/SEBRAEACRE-Mentorias.xlsx');
const sheet1 = wb1.Sheets[wb1.SheetNames[0]];
const data1 = XLSX.utils.sheet_to_json(sheet1);

const mentores = new Map();
for (const row of data1) {
  const consultor = row['Nome do Consultor'] || '';
  const aluno = row['Nome do aluno'] || '';
  const data = row['Data da Mentoria'] || '';
  
  if (consultor) {
    if (!mentores.has(consultor)) {
      mentores.set(consultor, { mentorias: 0, alunos: new Set(), datas: new Set(), empresa: 'SEBRAE ACRE' });
    }
    const m = mentores.get(consultor);
    m.mentorias++;
    if (aluno) m.alunos.add(aluno);
    if (data) m.datas.add(data);
  }
}

console.log('=== Mentores encontrados em SEBRAE ACRE ===');
for (const [nome, stats] of mentores) {
  console.log(`${nome}: ${stats.mentorias} mentorias, ${stats.alunos.size} alunos únicos`);
}

// Analisar SEBRAE TO
const wb2 = XLSX.readFile('/home/ubuntu/gestao-dashboards/sample-data/BS2SEBRAETO-Tutorias(respostas).xlsx');
const sheet2 = wb2.Sheets[wb2.SheetNames[0]];
const data2 = XLSX.utils.sheet_to_json(sheet2);

const mentores2 = new Map();
for (const row of data2) {
  const consultor = row['Nome do Consultor'] || '';
  const aluno = row['Nome do aluno'] || '';
  
  if (consultor) {
    if (!mentores2.has(consultor)) {
      mentores2.set(consultor, { mentorias: 0, alunos: new Set() });
    }
    const m = mentores2.get(consultor);
    m.mentorias++;
    if (aluno) m.alunos.add(aluno);
  }
}

console.log('\n=== Mentores encontrados em SEBRAE TO ===');
for (const [nome, stats] of mentores2) {
  console.log(`${nome}: ${stats.mentorias} mentorias, ${stats.alunos.size} alunos únicos`);
}

// Analisar EMBRAPII
const wb3 = XLSX.readFile('/home/ubuntu/gestao-dashboards/sample-data/EMBRAPII-Mentorias.xlsx');
const sheet3 = wb3.Sheets[wb3.SheetNames[0]];
const data3 = XLSX.utils.sheet_to_json(sheet3);

const mentores3 = new Map();
for (const row of data3) {
  const consultor = row['Nome do Consultor'] || '';
  const aluno = row['Nome do aluno'] || '';
  
  if (consultor) {
    if (!mentores3.has(consultor)) {
      mentores3.set(consultor, { mentorias: 0, alunos: new Set() });
    }
    const m = mentores3.get(consultor);
    m.mentorias++;
    if (aluno) m.alunos.add(aluno);
  }
}

console.log('\n=== Mentores encontrados em EMBRAPII ===');
for (const [nome, stats] of mentores3) {
  console.log(`${nome}: ${stats.mentorias} mentorias, ${stats.alunos.size} alunos únicos`);
}
