import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { alunos, consultors, mentoringSessions } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const pool = mysql.createPool(process.env.DATABASE_URL);
const db = drizzle(pool);

const names = ['Eliwania', 'Alencar Hubner', 'Paula Dos Reis', 'Renata Moura', 'Admary'];
const allAlunos = await db.select().from(alunos);
const matchedAlunos = allAlunos.filter(a => names.some(n => a.name.includes(n)));

const allConsultors = await db.select().from(consultors);
const consultorMap = new Map(allConsultors.map(c => [c.id, c.name]));

const allSessions = await db.select().from(mentoringSessions);

for (const a of matchedAlunos) {
  const currentMentor = a.consultorId ? consultorMap.get(a.consultorId) : 'Sem mentor';
  const alunoSessions = allSessions.filter(s => s.alunoId === a.id).sort((x,y) => String(y.sessionDate).localeCompare(String(x.sessionDate)));
  const lastSession = alunoSessions[0];
  const lastMentor = lastSession ? consultorMap.get(lastSession.consultorId) : 'N/A';
  
  const sessionsWithCurrent = alunoSessions.filter(s => s.consultorId === a.consultorId);
  const lastWithCurrent = sessionsWithCurrent[0];
  
  console.log('---');
  console.log('Aluno:', a.name, '(id:', a.id, ')');
  console.log('Mentor ATUAL (cadastro):', currentMentor, '(id:', a.consultorId, ')');
  console.log('Total sessões:', alunoSessions.length);
  console.log('Última sessão (qualquer mentor):', lastSession?.sessionDate, '- mentor:', lastMentor);
  console.log('Sessões com mentor atual:', sessionsWithCurrent.length);
  console.log('Última sessão com mentor atual:', lastWithCurrent?.sessionDate || 'NENHUMA');
}

await pool.end();
