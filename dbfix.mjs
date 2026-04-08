import { createConnection } from 'mysql2/promise';

const conn = await createConnection(process.env.DATABASE_URL);

// IDs das turmas duplicadas SEM alunos (a remover)
const turmasToDelete = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35];

// Verificar se há referências a essas turmas em outras tabelas
console.log('=== Verificando referências ===');

const [alunosRef] = await conn.execute(`SELECT COUNT(*) as cnt FROM alunos WHERE turmaId IN (${turmasToDelete.join(',')})`);
console.log('Alunos referenciando turmas a deletar:', alunosRef[0].cnt);

const [sessionsRef] = await conn.execute(`SELECT COUNT(*) as cnt FROM mentoring_sessions WHERE turmaId IN (${turmasToDelete.join(',')})`);
console.log('Sessões referenciando turmas a deletar:', sessionsRef[0].cnt);

// Verificar se há plano_individual referenciando essas turmas
try {
  const [piRef] = await conn.execute(`SELECT COUNT(*) as cnt FROM plano_individual WHERE turmaId IN (${turmasToDelete.join(',')})`);
  console.log('Plano Individual referenciando turmas a deletar:', piRef[0].cnt);
} catch(e) {
  console.log('plano_individual não tem campo turmaId');
}

// Verificar se há execucao_trilha referenciando essas turmas
try {
  const [etRef] = await conn.execute(`SELECT COUNT(*) as cnt FROM execucao_trilha WHERE turmaId IN (${turmasToDelete.join(',')})`);
  console.log('Execução Trilha referenciando turmas a deletar:', etRef[0].cnt);
} catch(e) {
  console.log('execucao_trilha não tem campo turmaId');
}

// Verificar event_participants
try {
  const [epRef] = await conn.execute(`SELECT COUNT(*) as cnt FROM event_participants WHERE turmaId IN (${turmasToDelete.join(',')})`);
  console.log('Event Participants referenciando turmas a deletar:', epRef[0].cnt);
} catch(e) {
  console.log('event_participants não tem campo turmaId');
}

await conn.end();
process.exit(0);
