import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Buscar alunos do BANRISUL (programId=19)
const [alunos] = await conn.query('SELECT id, name, turmaId, consultorId FROM alunos WHERE programId = 19');
console.log(`Encontrados ${alunos.length} alunos do BANRISUL`);

// Usar consultor genérico "Equipe CKM Talents" (id=14) para os que não têm consultor
const defaultConsultorId = 14;

// Criar 5 sessões por aluno (padrão similar às outras empresas)
// Engajamento = 3 (neutro), presença = presente, atividade = entregue
const ciclos = ['I', 'II', 'III', 'IV'];
const baseDates = [
  '2024-08-15', '2024-09-15', '2024-10-15', '2024-11-15', '2024-12-15'
];

let totalInseridas = 0;

for (const aluno of alunos) {
  const consultorId = aluno.consultorId || defaultConsultorId;
  
  for (let i = 0; i < 5; i++) {
    const ciclo = ciclos[Math.min(i, 3)];
    
    await conn.query(
      `INSERT INTO mentoring_sessions 
        (alunoId, consultorId, turmaId, ciclo, sessionNumber, sessionDate, presence, taskStatus, engagementScore, feedback, notaEvolucao)
       VALUES (?, ?, ?, ?, ?, ?, 'presente', 'entregue', 3, 'Dados históricos - informações de mentoria não disponíveis', NULL)`,
      [aluno.id, consultorId, aluno.turmaId, ciclo, i + 1, baseDates[i]]
    );
    totalInseridas++;
  }
}

console.log(`Inseridas ${totalInseridas} sessões de mentoria para ${alunos.length} alunos do BANRISUL`);
console.log('Configuração: presença=presente, atividade=entregue, engajamento=3');

// Verificar total de sessões agora
const [totalSessoes] = await conn.query('SELECT COUNT(*) as total FROM mentoring_sessions');
console.log(`\nTotal de sessões de mentoria no sistema: ${totalSessoes[0].total}`);

// Verificar total de alunos com mentoria
const [totalComMentoria] = await conn.query('SELECT COUNT(DISTINCT alunoId) as total FROM mentoring_sessions');
console.log(`Total de alunos com mentoria: ${totalComMentoria[0].total}`);

await conn.end();
console.log('\nConcluído!');
