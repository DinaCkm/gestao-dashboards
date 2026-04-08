import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [pdis] = await conn.query('SELECT id FROM assessment_pdi WHERE alunoId = 30066');
  const pdiIds = pdis.map(p => p.id);
  const [comps] = await conn.query('SELECT competenciaId, microInicio, microTermino, peso FROM assessment_competencias WHERE assessmentPdiId IN (?) ORDER BY microInicio', [pdiIds]);
  
  // Show raw data types
  if (comps.length > 0) {
    console.log('Raw microInicio type:', typeof comps[0].microInicio, comps[0].microInicio);
    console.log('Raw microTermino type:', typeof comps[0].microTermino, comps[0].microTermino);
  }
  
  // Group by microInicio-microTermino
  const ciclos = new Map();
  comps.forEach(c => {
    // Convert dates to ISO string for key
    const inicioStr = c.microInicio instanceof Date ? c.microInicio.toISOString().slice(0,10) : String(c.microInicio);
    const fimStr = c.microTermino instanceof Date ? c.microTermino.toISOString().slice(0,10) : String(c.microTermino);
    const key = inicioStr + '|' + fimStr;
    if (ciclos.has(key)) {
      const entry = ciclos.get(key);
      if (c.peso === 'opcional') entry.opcional.push(c.competenciaId);
      else entry.obrig.push(c.competenciaId);
    } else {
      const entry = { inicio: new Date(c.microInicio), fim: new Date(c.microTermino), inicioStr, fimStr, obrig: [], opcional: [] };
      if (c.peso === 'opcional') entry.opcional.push(c.competenciaId);
      else entry.obrig.push(c.competenciaId);
      ciclos.set(key, entry);
    }
  });
  
  // Sessions
  const [sessions] = await conn.query('SELECT sessionNumber, sessionDate, taskStatus, isAssessment FROM mentoring_sessions WHERE alunoId = 30066 ORDER BY sessionNumber');
  
  console.log('\n=== SESSOES DA JOSEANE ===');
  sessions.forEach(s => {
    const dt = s.sessionDate ? new Date(s.sessionDate).toISOString().slice(0,10) : 'null';
    console.log(`S${s.sessionNumber} | ${dt} | task: ${s.taskStatus} | assessment: ${s.isAssessment}`);
  });
  
  const hoje = new Date();
  let cicloNum = 0;
  const resultados = [];
  
  ciclos.forEach((ciclo, key) => {
    cicloNum++;
    const inicio = ciclo.inicio;
    // Set fim to end of day
    const fim = new Date(ciclo.fim);
    fim.setHours(23, 59, 59, 999);
    
    const status = hoje > fim ? 'FIN' : (hoje >= inicio ? 'AND' : 'FUT');
    
    const sessoesNoCiclo = sessions.filter(s => {
      if (s.sessionDate === null || s.sessionDate === undefined) return false;
      const d = new Date(s.sessionDate);
      return d >= inicio && d <= fim;
    });
    
    const comTarefa = sessoesNoCiclo.filter(s => s.taskStatus !== 'sem_tarefa');
    const entregues = comTarefa.filter(s => s.taskStatus === 'entregue').length;
    const total = comTarefa.length;
    const ind4 = total > 0 ? (entregues / total) * 100 : 0;
    const temObrig = ciclo.obrig.length > 0;
    
    console.log(`\nCiclo ${cicloNum} | ${ciclo.inicioStr} a ${ciclo.fimStr} | ${status} | obrig: ${temObrig} (${ciclo.obrig.length})`);
    console.log(`  Sessoes: ${sessoesNoCiclo.map(s => 'S' + s.sessionNumber + '(' + s.taskStatus + ',assess=' + s.isAssessment + ')').join(', ') || 'nenhuma'}`);
    console.log(`  ComTarefa: ${total} | Entregues: ${entregues} | Ind4: ${ind4.toFixed(1)}%`);
    
    if (status !== 'FUT') {
      resultados.push({ cicloNum, status, temObrig, ind4, total, entregues });
    }
  });
  
  const finObrig = resultados.filter(r => r.status === 'FIN' && r.temObrig);
  const paraConsolidar = finObrig.length > 0 ? finObrig : resultados.filter(r => r.temObrig);
  
  console.log('\n=== CONSOLIDACAO ===');
  console.log(`Ciclos consolidados: ${paraConsolidar.length}`);
  paraConsolidar.forEach(r => console.log(`  Ciclo ${r.cicloNum} | ind4: ${r.ind4.toFixed(1)}%`));
  const avg = paraConsolidar.length > 0 ? paraConsolidar.reduce((s, r) => s + r.ind4, 0) / paraConsolidar.length : 0;
  console.log(`\n>>> MEDIA (atual - por microciclo): ${avg.toFixed(1)}%`);
  
  const totalT = paraConsolidar.reduce((s, r) => s + r.total, 0);
  const totalE = paraConsolidar.reduce((s, r) => s + r.entregues, 0);
  const macro = totalT > 0 ? (totalE / totalT * 100) : 0;
  console.log(`>>> MACROCICLO (total): ${macro.toFixed(1)}% (${totalE}/${totalT})`);
  
  await conn.end();
}
main().catch(console.error);
