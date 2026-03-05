import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Encontrar o aluno Amaggeldo Barbosa
const [alunos] = await conn.execute(
  `SELECT id, name, externalId FROM alunos WHERE name LIKE '%Amaggeldo%' LIMIT 5`
);
console.log('=== ALUNO ===');
console.log(alunos);

if (alunos.length === 0) {
  console.log('Aluno não encontrado');
  await conn.end();
  process.exit(0);
}

const alunoId = alunos[0].id;
const openId = alunos[0].externalId;
console.log(`\nAluno ID: ${alunoId}, OpenID: ${openId}`);

// Verificar mentorias do aluno no período do ciclo Decisões Ágeis (26/10/2025 — 26/01/2026)
const [mentorias] = await conn.execute(
  `SELECT id, data_sessao, presenca, atividade_entregue, nota_engajamento, id_usuario 
   FROM mentorias 
   WHERE id_usuario = ? 
   ORDER BY data_sessao`,
  [openId]
);
console.log(`\n=== TODAS AS MENTORIAS DO ALUNO (${mentorias.length}) ===`);
mentorias.forEach(m => {
  console.log(`  ${m.data_sessao} | presença: ${m.presenca} | atividade: ${m.atividade_entregue} | engajamento: ${m.nota_engajamento}`);
});

// Filtrar pelo período do ciclo
const cicloInicio = new Date('2025-10-26T00:00:00');
const cicloFim = new Date('2026-01-26T23:59:59');
const mentoriasCiclo = mentorias.filter(m => {
  if (m.data_sessao) {
    const d = new Date(m.data_sessao);
    return d >= cicloInicio && d <= cicloFim;
  }
  return true;
});
console.log(`\n=== MENTORIAS NO CICLO DECISÕES ÁGEIS (${cicloInicio.toISOString()} a ${cicloFim.toISOString()}) ===`);
console.log(`Total: ${mentoriasCiclo.length}`);
mentoriasCiclo.forEach(m => {
  console.log(`  ${m.data_sessao} | presença: ${m.presenca} | atividade: ${m.atividade_entregue} | engajamento: ${m.nota_engajamento}`);
});

// Verificar atividades com tarefa
const comTarefa = mentoriasCiclo.filter(m => m.atividade_entregue !== 'sem_tarefa');
console.log(`\n=== MENTORIAS COM TAREFA NO CICLO ===`);
console.log(`Total com tarefa: ${comTarefa.length}`);
comTarefa.forEach(m => {
  console.log(`  ${m.data_sessao} | atividade: ${m.atividade_entregue}`);
});

// Verificar eventos/webinars do aluno
const [eventos] = await conn.execute(
  `SELECT id, id_usuario, presenca, data_evento, nome_evento 
   FROM event_participation 
   WHERE id_usuario = ? 
   ORDER BY data_evento`,
  [openId]
);
console.log(`\n=== TODOS OS EVENTOS DO ALUNO (${eventos.length}) ===`);

// Filtrar pelo período do ciclo
const eventosCiclo = eventos.filter(e => {
  if (e.data_evento) {
    const d = new Date(e.data_evento);
    return d >= cicloInicio && d <= cicloFim;
  }
  return true;
});
console.log(`\n=== EVENTOS NO CICLO DECISÕES ÁGEIS ===`);
console.log(`Total: ${eventosCiclo.length}`);
const presentes = eventosCiclo.filter(e => e.presenca === 'presente').length;
console.log(`Presentes: ${presentes}/${eventosCiclo.length}`);

// Verificar valores distintos de atividade_entregue
const [distintos] = await conn.execute(
  `SELECT DISTINCT atividade_entregue, COUNT(*) as cnt FROM mentorias WHERE id_usuario = ? GROUP BY atividade_entregue`,
  [openId]
);
console.log('\n=== VALORES DISTINTOS DE atividade_entregue ===');
console.log(distintos);

await conn.end();
