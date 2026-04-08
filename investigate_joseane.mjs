import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // 1. Get Joseane's alunoId and externalId
  const [alunos] = await conn.query("SELECT id, externalId, name FROM alunos WHERE name LIKE '%Joseane%'");
  console.log('Aluno:', JSON.stringify(alunos[0]));
  const externalId = alunos[0].externalId;
  
  // 2. Get her sessions with dates and taskStatus
  const [sessions] = await conn.query(
    'SELECT sessionNumber, sessionDate, taskStatus, ciclo FROM mentoring_sessions WHERE alunoExternalId = ? ORDER BY sessionNumber',
    [externalId]
  );
  console.log('\n=== SESSÕES DA JOSEANE ===');
  sessions.forEach(s => console.log(`Sessão ${s.sessionNumber} | ${s.sessionDate?.toISOString()?.slice(0,10)} | taskStatus: ${s.taskStatus} | ciclo: ${s.ciclo}`));
  
  // 3. Get her ciclos from assessment
  const [pdis] = await conn.query('SELECT id FROM assessment_pdi WHERE alunoId = ?', [alunos[0].id]);
  console.log('\nPDI IDs:', pdis.map(p => p.id));
  
  if (pdis.length > 0) {
    const pdiIds = pdis.map(p => p.id);
    const [comps] = await conn.query(
      'SELECT id, pdiId, competenciaId, microInicio, microTermino, opcional FROM assessment_competencias WHERE pdiId IN (?) ORDER BY microInicio',
      [pdiIds]
    );
    
    console.log('\n=== MICROCICLOS (do assessment) ===');
    // Group by microInicio-microTermino
    const ciclos = new Map();
    comps.forEach(c => {
      const key = c.microInicio + '|' + c.microTermino;
      if (!ciclos.has(key)) ciclos.set(key, { inicio: c.microInicio, fim: c.microTermino, comps: [], opcional: [] });
      const entry = ciclos.get(key);
      if (c.opcional) entry.opcional.push(c.competenciaId);
      else entry.comps.push(c.competenciaId);
    });
    
    const hoje = new Date();
    let cicloNum = 0;
    const resultados = [];
    
    ciclos.forEach((ciclo, key) => {
      cicloNum++;
      const inicio = new Date(ciclo.inicio + 'T00:00:00');
      const fim = new Date(ciclo.fim + 'T23:59:59');
      const status = hoje > fim ? 'finalizado' : (hoje >= inicio ? 'em_andamento' : 'futuro');
      
      // Filter sessions by date range
      const sessoesNoCiclo = sessions.filter(s => {
        if (s.sessionDate === null || s.sessionDate === undefined) return false;
        const d = new Date(s.sessionDate);
        return d >= inicio && d <= fim;
      });
      
      // Calculate ind4
      const comTarefa = sessoesNoCiclo.filter(s => s.taskStatus !== 'sem_tarefa');
      const entregues = comTarefa.filter(s => s.taskStatus === 'entregue').length;
      const total = comTarefa.length;
      const ind4 = total > 0 ? (entregues / total) * 100 : 0;
      
      const temObrigatorias = ciclo.comps.length > 0;
      
      console.log(`\nCiclo ${cicloNum} | ${ciclo.inicio} a ${ciclo.fim} | status: ${status} | obrigatórias: ${temObrigatorias} (${ciclo.comps.length} comps)`);
      console.log(`  Sessões no período: ${sessoesNoCiclo.map(s => 'S' + s.sessionNumber + '(' + s.taskStatus + ')').join(', ') || 'nenhuma'}`);
      console.log(`  Com tarefa: ${total} | Entregues: ${entregues} | Ind4: ${ind4.toFixed(1)}%`);
      
      if (status !== 'futuro') {
        resultados.push({ cicloNum, status, temObrigatorias, ind4, total, entregues });
      }
    });
    
    // Consolidate - avg of finalizados com obrigatórias
    const finalizadosObrig = resultados.filter(r => r.status === 'finalizado' && r.temObrigatorias);
    const todosParaConsolidar = finalizadosObrig.length > 0 ? finalizadosObrig : resultados.filter(r => r.temObrigatorias);
    
    console.log('\n=== CONSOLIDAÇÃO (média por microciclo) ===');
    console.log(`Ciclos para consolidar: ${todosParaConsolidar.length}`);
    todosParaConsolidar.forEach(r => console.log(`  Ciclo ${r.cicloNum} | ind4: ${r.ind4.toFixed(1)}%`));
    
    const avgInd4 = todosParaConsolidar.reduce((s, r) => s + r.ind4, 0) / todosParaConsolidar.length;
    console.log(`\n>>> RESULTADO ATUAL (média dos microciclos): ${avgInd4.toFixed(1)}%`);
    
    // Alternative: macrociclo total
    const totalTarefas = todosParaConsolidar.reduce((s, r) => s + r.total, 0);
    const totalEntregues = todosParaConsolidar.reduce((s, r) => s + r.entregues, 0);
    const macroInd4 = totalTarefas > 0 ? (totalEntregues / totalTarefas) * 100 : 0;
    console.log(`>>> ALTERNATIVA (macrociclo total): ${macroInd4.toFixed(1)}% (${totalEntregues}/${totalTarefas})`);
  }
  
  await conn.end();
}
main().catch(console.error);
