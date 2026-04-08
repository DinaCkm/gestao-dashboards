import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Ler a planilha de CPFs
const content = fs.readFileSync('/home/ubuntu/upload/pasted_content.txt', 'utf-8');
const lines = content.trim().split('\n').slice(1);

const cpfData = lines.map(line => {
  const parts = line.split('\t');
  return {
    cpf: parts[0]?.trim(),
    nome: parts[1]?.trim(),
    email: parts[2]?.trim()?.toLowerCase(),
  };
}).filter(r => r.cpf && r.email && r.nome !== 'AdmAdm');

// Buscar TODOS os alunos
const [todosAlunos] = await conn.query('SELECT id, externalId, name, email, cpf, turmaId, programId FROM alunos');

// Buscar alunos do SEBRAE TO
const [alunosTO] = await conn.query(`
  SELECT a.id, a.externalId, a.name, a.email, a.cpf
  FROM alunos a
  LEFT JOIN turmas t ON a.turmaId = t.id
  WHERE t.programId = 17
`);

const alunosTOEmails = new Set(alunosTO.map(a => a.email?.toLowerCase()));

// Alunos da planilha que não foram encontrados por email no SEBRAE TO
const notFoundByEmail = cpfData.filter(r => {
  const found = alunosTO.find(a => a.email?.toLowerCase() === r.email);
  return !found;
});

console.log('Total na planilha: ' + cpfData.length);
console.log('Matched por email (SEBRAE TO): ' + (cpfData.length - notFoundByEmail.length));
console.log('Não encontrados por email: ' + notFoundByEmail.length);

// Tentar matching por nome (normalizado)
function normalize(s) {
  return s?.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim();
}

let matchedByName = 0;
let stillNotFound = [];
let nameUpdates = [];

for (const r of notFoundByEmail) {
  const normNome = normalize(r.nome);
  // Buscar em todos os alunos (não só SEBRAE TO)
  const aluno = todosAlunos.find(a => normalize(a.name) === normNome);
  if (aluno) {
    matchedByName++;
    nameUpdates.push({ alunoId: aluno.id, cpf: r.cpf, nome: r.nome, emailPlanilha: r.email, emailBanco: aluno.email });
    console.log('  Nome match: ' + r.nome + ' → aluno.id=' + aluno.id + ' email_banco=' + aluno.email + ' email_planilha=' + r.email);
  } else {
    stillNotFound.push(r);
  }
}

console.log('\nMatched por nome: ' + matchedByName);
console.log('Ainda não encontrados: ' + stillNotFound.length);

// Atualizar CPFs dos matched por nome
for (const u of nameUpdates) {
  await conn.query('UPDATE alunos SET cpf = ?, email = ? WHERE id = ?', [u.cpf, u.emailPlanilha, u.alunoId]);
  console.log('  Updated: ' + u.nome + ' → CPF=' + u.cpf + ', email=' + u.emailPlanilha);
}

// Mostrar os que ainda não foram encontrados
if (stillNotFound.length > 0) {
  console.log('\nAlunos da planilha que NÃO existem no banco (precisam ser criados):');
  stillNotFound.forEach(r => console.log('  ' + r.nome + ' | ' + r.email + ' | CPF: ' + r.cpf));
}

// Verificar resultado final
const [withCpf] = await conn.query('SELECT COUNT(*) as cnt FROM alunos WHERE cpf IS NOT NULL');
console.log('\nTotal de alunos com CPF no banco: ' + withCpf[0].cnt);

await conn.end();
