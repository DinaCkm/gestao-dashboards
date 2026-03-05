import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Ler a planilha de CPFs
const content = fs.readFileSync('/home/ubuntu/upload/pasted_content.txt', 'utf-8');
const lines = content.trim().split('\n').slice(1); // Pular header

const cpfData = lines.map(line => {
  const parts = line.split('\t');
  return {
    cpf: parts[0]?.trim(),
    nome: parts[1]?.trim(),
    email: parts[2]?.trim()?.toLowerCase(),
  };
}).filter(r => r.cpf && r.email);

console.log(`Total de registros na planilha: ${cpfData.length}`);

// Buscar todos os alunos do SEBRAE TO
const [alunosTO] = await conn.query(`
  SELECT a.id, a.externalId, a.name, a.email, a.cpf, t.name as turma
  FROM alunos a
  LEFT JOIN turmas t ON a.turmaId = t.id
  LEFT JOIN programs p ON t.programId = p.id
  WHERE p.id = 17
`);
console.log(`Alunos SEBRAE TO no banco: ${alunosTO.length}`);

// Fazer matching por email
let matched = 0;
let notFound = 0;
const notFoundList = [];

for (const cpfRecord of cpfData) {
  // Ignorar o registro AdmAdm (admin)
  if (cpfRecord.nome === 'AdmAdm') continue;
  
  const aluno = alunosTO.find(a => a.email?.toLowerCase() === cpfRecord.email);
  
  if (aluno) {
    // Atualizar CPF do aluno
    await conn.query('UPDATE alunos SET cpf = ? WHERE id = ?', [cpfRecord.cpf, aluno.id]);
    matched++;
    console.log(`  ✓ ${aluno.name} (${aluno.email}) → CPF: ${cpfRecord.cpf}`);
  } else {
    notFound++;
    notFoundList.push(cpfRecord);
  }
}

console.log(`\n=== Resultado ===`);
console.log(`Matched: ${matched}`);
console.log(`Não encontrados no banco: ${notFound}`);

if (notFoundList.length > 0) {
  console.log(`\nAlunos da planilha NÃO encontrados no banco (por email):`);
  for (const r of notFoundList) {
    console.log(`  ✗ ${r.nome} (${r.email}) CPF: ${r.cpf}`);
  }
}

// Verificar resultado
const [updated] = await conn.query('SELECT COUNT(*) as cnt FROM alunos WHERE cpf IS NOT NULL');
console.log(`\nTotal de alunos com CPF no banco: ${updated[0].cnt}`);

await conn.end();
