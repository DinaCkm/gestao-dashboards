import { getDb } from './server/db.ts';
import { consultors, alunos, mentoringSessions } from './drizzle/schema.ts';
import { eq, and, desc, sql } from 'drizzle-orm';

async function check() {
  const db = await getDb();
  
  // Find Ana Carolina
  const anaCarolina = await db.select().from(consultors).where(sql`name LIKE '%Ana Carolina%'`);
  console.log('Ana Carolina:', anaCarolina.map(c => ({id: c.id, name: c.name})));
  
  const anaId = anaCarolina[0].id;
  
  // Get alunos currently assigned to Ana Carolina
  const currentAlunos = await db.select().from(alunos).where(and(eq(alunos.consultorId, anaId), eq(alunos.isActive, 1)));
  
  console.log(`\nAlunos ATUALMENTE vinculados a Ana Carolina (consultorId=${anaId}): ${currentAlunos.length}`);
  
  // Check specific alunos from the screenshot
  const nomes = ['Adonay', 'Adriana Elizabete', 'Adrielle', 'Aldemar', 'Ana Claudia', 'Cezarinete'];
  for (const nome of nomes) {
    const aluno = currentAlunos.find(a => a.name.includes(nome));
    if (aluno) {
      // Get last session for this aluno with ANY mentor
      const lastSession = await db.select().from(mentoringSessions)
        .where(eq(mentoringSessions.alunoId, aluno.id))
        .orderBy(desc(mentoringSessions.sessionDate))
        .limit(3);
      
      console.log(`\n  ${aluno.name} (id:${aluno.id}, consultorId:${aluno.consultorId}):`);
      if (lastSession.length > 0) {
        for (const s of lastSession) {
          const dias = Math.floor((Date.now() - new Date(s.sessionDate).getTime()) / (1000*60*60*24));
          console.log(`    Sessão: ${s.sessionDate} (consultorId:${s.consultorId}) - ${dias} dias atrás`);
        }
      } else {
        console.log('    Nenhuma sessão encontrada');
      }
    } else {
      console.log(`\n  ${nome}: NÃO encontrado nos alunos da Ana Carolina`);
    }
  }
  
  // Also check: are these alunos from SEBRAE ACRE? What's their empresaId?
  console.log('\n--- Empresas dos alunos da Ana Carolina ---');
  const empresaIds = [...new Set(currentAlunos.map(a => a.empresaId))];
  console.log('EmpresaIds:', empresaIds);
  
  // Check if these SEBRAE ACRE alunos were previously with another mentor
  for (const nome of nomes) {
    const aluno = currentAlunos.find(a => a.name.includes(nome));
    if (aluno) {
      // Get ALL sessions grouped by mentor
      const allSessions = await db.select().from(mentoringSessions)
        .where(eq(mentoringSessions.alunoId, aluno.id))
        .orderBy(desc(mentoringSessions.sessionDate));
      
      const mentorSessions = {};
      for (const s of allSessions) {
        if (!mentorSessions[s.consultorId]) mentorSessions[s.consultorId] = [];
        mentorSessions[s.consultorId].push(s.sessionDate);
      }
      
      console.log(`\n  ${aluno.name}: ${allSessions.length} sessões total`);
      for (const [mentorId, dates] of Object.entries(mentorSessions)) {
        console.log(`    Mentor ${mentorId}: ${dates.length} sessões, última: ${dates[0]}`);
      }
    }
  }
  
  process.exit(0);
}
check();
