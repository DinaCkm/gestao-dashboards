// Direct import of the V2 calculator functions to debug Joseane
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get Joseane's alunoId and externalId
const [alunoRows] = await conn.execute(`SELECT id, externalId, name, programId FROM alunos WHERE name LIKE '%Joseane%'`);
const joseane = alunoRows[0];
console.log('Joseane:', joseane);
const idUsuario = joseane.externalId;

// 1. Get all mentorias for Joseane
const [mentorias] = await conn.execute(`
  SELECT ms.externalUserId as idUsuario, ms.sessionDate as dataSessao, 
         a.name as nomeAluno, p.name as empresa, t.name as turma, tr.nome as trilha
  FROM mentoring_sessions ms
  LEFT JOIN alunos a ON a.id = ms.alunoId
  LEFT JOIN programs p ON p.id = a.programId
  LEFT JOIN turmas t ON t.id = a.turmaId
  LEFT JOIN assessment_pdi ap ON ap.alunoId = a.id
  LEFT JOIN trilhas tr ON tr.id = ap.trilhaId
  WHERE a.id = ?
`, [joseane.id]);
console.log(`\nMentorias: ${mentorias.length}`);

// 2. Get events for Joseane
const [eventos] = await conn.execute(`
  SELECT ep.externalUserId as idUsuario, ep.eventDate as dataEvento,
         a.name as nomeAluno, p.name as empresa, t.name as turma
  FROM event_participations ep
  LEFT JOIN alunos a ON a.id = ep.alunoId
  LEFT JOIN programs p ON p.id = a.programId
  LEFT JOIN turmas t ON t.id = a.turmaId
  WHERE a.id = ?
`, [joseane.id]);
console.log(`Eventos: ${eventos.length}`);

// 3. Get performance
const [perf] = await conn.execute(`
  SELECT sp.externalUserId, sp.externalCompetenciaId, sp.competenciaName,
         sp.progressoTotal, sp.mediaAvaliacoesRespondidas, sp.mediaAvaliacoesDisponiveis,
         sp.totalAulas, sp.aulasDisponiveis, sp.aulasConcluidas, sp.aulasEmAndamento
  FROM student_performance sp
  WHERE sp.alunoId = ?
`, [joseane.id]);
console.log(`Performance records: ${perf.length}`);

// 4. Get assessment PDI cycles (V2 format)
const [assessComps] = await conn.execute(`
  SELECT ac.competenciaId, ac.microInicio, ac.microTermino, ac.peso,
         c.nome as compNome, c.codigoIntegracao,
         ap.macroInicio, ap.macroTermino, ap.trilhaId,
         tr.nome as trilhaNome, t.name as turmaNome
  FROM assessment_competencias ac
  JOIN assessment_pdi ap ON ap.id = ac.assessmentPdiId
  JOIN competencias c ON c.id = ac.competenciaId
  LEFT JOIN trilhas tr ON tr.id = ap.trilhaId
  LEFT JOIN turmas t ON t.id = ap.turmaId
  WHERE ap.alunoId = ? AND ap.status = 'ativo'
  ORDER BY ac.microInicio
`, [joseane.id]);
console.log(`Assessment competências: ${assessComps.length}`);

// Build ciclos V2 (same logic as getAllCiclosForCalculatorV2)
const ciclosMap = new Map();
for (const ac of assessComps) {
  const key = `${ac.microInicio}_${ac.microTermino}`;
  if (!ciclosMap.has(key)) {
    ciclosMap.set(key, {
      cicloId: ciclosMap.size + 1,
      nomeCiclo: `${ac.turmaNome || ''} - ${ac.compNome}`,
      trilhaNome: ac.trilhaNome || '',
      dataInicio: ac.microInicio,
      dataFim: ac.microTermino,
      competenciaIds: [],
    });
  }
  ciclosMap.get(key).competenciaIds.push(ac.competenciaId);
}
const ciclosV2 = Array.from(ciclosMap.values());
console.log(`\nCiclos V2: ${ciclosV2.length}`);

// Build compIdToCodigoMap
const compIdToCodigoMap = new Map();
for (const ac of assessComps) {
  if (ac.codigoIntegracao) {
    compIdToCodigoMap.set(ac.competenciaId, ac.codigoIntegracao);
  }
}

// Determine status of each ciclo
const hoje = new Date();
for (const ciclo of ciclosV2) {
  const inicio = new Date(ciclo.dataInicio + 'T00:00:00');
  const fim = new Date(ciclo.dataFim + 'T23:59:59');
  if (hoje > fim) ciclo.status = 'finalizado';
  else if (hoje >= inicio) ciclo.status = 'em_andamento';
  else ciclo.status = 'futuro';
}

console.log('\n=== CICLOS ===');
for (const c of ciclosV2) {
  console.log(`  ${c.nomeCiclo} | ${c.dataInicio} → ${c.dataFim} | status: ${c.status} | comps: ${c.competenciaIds.join(',')}`);
}

// Now simulate the V2 calculation for each finalized ciclo
console.log('\n=== CÁLCULO POR CICLO FINALIZADO ===');

// Build PerformanceRecord-like objects
const perfRecords = perf.map(p => ({
  idUsuario: p.externalUserId || idUsuario,
  idCompetencia: p.externalCompetenciaId || '',
  nomeCompetencia: p.competenciaName || '',
  progressoAulas: p.progressoTotal || 0,
  notaAvaliacao: (() => {
    const mediaResp = p.mediaAvaliacoesRespondidas ? parseFloat(String(p.mediaAvaliacoesRespondidas)) : 0;
    const mediaDisp = p.mediaAvaliacoesDisponiveis ? parseFloat(String(p.mediaAvaliacoesDisponiveis)) : 0;
    const notaBase = mediaResp > 0 ? mediaResp : (mediaDisp > 0 ? mediaDisp : 0);
    const naoCursou = mediaResp === 0 && mediaDisp === 0;
    return naoCursou ? -1 : notaBase / 10;
  })(),
  aulasDisponiveis: p.aulasDisponiveis || 0,
  aulasConcluidas: p.aulasConcluidas || 0,
  totalAulas: p.totalAulas || 0,
  competenciaConcluida: (p.aulasDisponiveis || 0) > 0 && (p.aulasConcluidas || 0) >= (p.aulasDisponiveis || 0),
}));

const ciclosFinalizados = ciclosV2.filter(c => c.status === 'finalizado');
const allInd7s = [];

for (const ciclo of ciclosFinalizados) {
  // IND 2: Avaliações
  let somaNotas = 0, provasRealizadas = 0;
  for (const compId of ciclo.competenciaIds) {
    const codigo = compIdToCodigoMap.get(compId);
    const perfComp = perfRecords.find(p => p.idCompetencia === codigo);
    if (perfComp && perfComp.notaAvaliacao >= 0) {
      somaNotas += perfComp.notaAvaliacao * 10;
      provasRealizadas++;
    }
  }
  const ind2 = provasRealizadas > 0 ? somaNotas / provasRealizadas : 0;

  // IND 3: Competências
  let totalComps = ciclo.competenciaIds.length, compsFinalizadas = 0;
  for (const compId of ciclo.competenciaIds) {
    const codigo = compIdToCodigoMap.get(compId);
    const perfComp = perfRecords.find(p => p.idCompetencia === codigo);
    if (perfComp && perfComp.competenciaConcluida) compsFinalizadas++;
  }
  const ind3 = totalComps > 0 ? (compsFinalizadas / totalComps) * 100 : 0;

  // IND 1: Webinars (events in ciclo period)
  const cicloInicio = new Date(ciclo.dataInicio + 'T00:00:00');
  const cicloFim = new Date(ciclo.dataFim + 'T23:59:59');
  const eventosNoCiclo = eventos.filter(e => {
    const d = new Date(e.dataEvento);
    return d >= cicloInicio && d <= cicloFim;
  });
  // Simplified: assume 1 webinar per ciclo
  const ind1 = eventosNoCiclo.length > 0 ? 100 : 0;

  // IND 4: Tarefas (mentorias in ciclo period)
  const mentoriasNoCiclo = mentorias.filter(m => {
    const d = new Date(m.dataSessao);
    return d >= cicloInicio && d <= cicloFim;
  });
  const ind4 = mentoriasNoCiclo.length > 0 ? 100 : 0;

  // IND 5: Engajamento (simplified: average of ind1-4)
  const ind5 = (ind1 + ind2 + ind3 + ind4) / 4;

  // IND 7: Engajamento Final = average of 5 indicators
  const ind7 = (ind1 + ind2 + ind3 + ind4 + ind5) / 5;

  allInd7s.push(ind7);

  console.log(`  ${ciclo.nomeCiclo}:`);
  console.log(`    ind1(webinars)=${ind1.toFixed(1)} ind2(aval)=${ind2.toFixed(1)} ind3(comp)=${ind3.toFixed(1)} ind4(tarefas)=${ind4.toFixed(1)} ind5(eng)=${ind5.toFixed(1)} => ind7=${ind7.toFixed(1)}`);
  console.log(`    eventos: ${eventosNoCiclo.length}, mentorias: ${mentoriasNoCiclo.length}, provasRealizadas: ${provasRealizadas}, compsFinalizadas: ${compsFinalizadas}/${totalComps}`);
}

// Consolidado = média dos ind7 de cada ciclo
const consolidadoInd7 = allInd7s.length > 0 ? allInd7s.reduce((a, b) => a + b, 0) / allInd7s.length : 0;
console.log(`\n=== CONSOLIDADO ===`);
console.log(`Média dos ind7 de ${allInd7s.length} ciclos finalizados: ${consolidadoInd7.toFixed(1)}%`);
console.log(`Nota (escala 0-10): ${(consolidadoInd7 / 10).toFixed(2)}`);

await conn.end();
