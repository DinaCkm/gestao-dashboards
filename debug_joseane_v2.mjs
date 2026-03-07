import dotenv from 'dotenv';
dotenv.config();
import { calcularIndicadoresAluno } from './server/indicatorsCalculatorV2.ts';
import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const alunoId = 30066;
  const externalId = '667285';
  
  // Get all data
  const [allAlunos] = await conn.query('SELECT * FROM alunos');
  const [allPrograms] = await conn.query('SELECT * FROM programs');
  const [allTurmas] = await conn.query('SELECT * FROM turmas');
  const [allSessions] = await conn.query('SELECT * FROM mentoring_sessions');
  const [allEventPart] = await conn.query('SELECT ep.*, e.title as eventTitle, e.eventDate FROM event_participation ep JOIN events e ON e.id = ep.eventId');
  const [allPdis] = await conn.query("SELECT * FROM assessment_pdi WHERE status = 'ativo'");
  const [allComps] = await conn.query('SELECT ac.*, c.nome as compNome, c.codigoIntegracao FROM assessment_competencias ac LEFT JOIN competencias c ON c.id = ac.competenciaId');
  const [allTrilhas] = await conn.query('SELECT * FROM trilhas');
  const [allCompetencias] = await conn.query('SELECT * FROM competencias');
  const [studentPerf] = await conn.query('SELECT * FROM student_performance');
  const [allEvents] = await conn.query('SELECT * FROM events');
  
  const alunoMap = new Map(allAlunos.map(a => [a.id, a]));
  const programMap = new Map(allPrograms.map(p => [p.id, p]));
  const turmaMap = new Map(allTurmas.map(t => [t.id, t]));
  const trilhaMap = new Map(allTrilhas.map(t => [t.id, t]));
  const compNomeMap = new Map(allCompetencias.map(c => [c.id, c.nome]));
  
  // Build mentorias (same as routers.ts)
  const mentorias = [];
  for (const session of allSessions) {
    const al = alunoMap.get(session.alunoId);
    if (!al) continue;
    const prog = al.programId ? programMap.get(al.programId) : null;
    const turma = al.turmaId ? turmaMap.get(al.turmaId) : null;
    mentorias.push({
      idUsuario: al.externalId || String(al.id),
      nomeAluno: al.name,
      empresa: prog?.name || 'Desconhecida',
      turma: turma?.name || '',
      trilha: '',
      ciclo: session.ciclo || '',
      sessao: session.sessionNumber || 0,
      dataSessao: session.sessionDate ? new Date(session.sessionDate) : undefined,
      presenca: session.presence,
      atividadeEntregue: session.taskStatus || 'sem_tarefa',
      engajamento: session.engagementScore || undefined,
      feedback: session.feedback || '',
    });
  }
  
  // Build eventos (same as routers.ts)
  const eventos = [];
  for (const ep of allEventPart) {
    const al = alunoMap.get(ep.alunoId);
    if (!al) continue;
    const prog = al.programId ? programMap.get(al.programId) : null;
    eventos.push({
      idUsuario: al.externalId || String(al.id),
      nomeAluno: al.name,
      empresa: prog?.name || 'Desconhecida',
      turma: '',
      trilha: '',
      tituloEvento: ep.eventTitle || 'Evento',
      dataEvento: ep.eventDate ? new Date(ep.eventDate) : undefined,
      presenca: ep.status,
    });
  }
  
  // Add absent events (same logic as meuDashboard)
  const eventParticipationEventIds = new Map();
  for (const ep of allEventPart) {
    if (!eventParticipationEventIds.has(ep.alunoId)) {
      eventParticipationEventIds.set(ep.alunoId, new Set());
    }
    eventParticipationEventIds.get(ep.alunoId).add(ep.eventId);
  }
  
  const eventsByProgram = new Map();
  for (const evt of allEvents) {
    const progId = evt.programId;
    if (!eventsByProgram.has(progId)) eventsByProgram.set(progId, []);
    eventsByProgram.get(progId).push(evt);
    // Also add global events (programId null)
  }
  // Add global events to all programs
  const globalEvents = allEvents.filter(e => !e.programId);
  
  for (const a of allAlunos) {
    if (!a.programId) continue;
    const progEvents = [...(eventsByProgram.get(a.programId) || []), ...globalEvents];
    const alunoParticipatedEvents = eventParticipationEventIds.get(a.id) || new Set();
    const alunoIdStr = a.externalId || String(a.id);
    const program = programMap.get(a.programId);
    for (const evt of progEvents) {
      if (!alunoParticipatedEvents.has(evt.id)) {
        eventos.push({
          idUsuario: alunoIdStr,
          nomeAluno: a.name,
          empresa: program?.name || 'Desconhecida',
          turma: '',
          trilha: '',
          tituloEvento: evt.title || 'Evento',
          dataEvento: evt.eventDate ? new Date(evt.eventDate) : undefined,
          presenca: 'ausente',
        });
      }
    }
  }
  
  // Build performance
  const performance = [];
  // From student_performance
  for (const sp of studentPerf) {
    const mediaResp = parseFloat(sp.mediaAvaliacoesRespondidas) || 0;
    const mediaDisp = parseFloat(sp.mediaAvaliacoesDisponiveis) || 0;
    const notaBase = mediaResp > 0 ? mediaResp : (mediaDisp > 0 ? mediaDisp : 0);
    const nota010 = notaBase / 10;
    performance.push({
      idUsuario: sp.externalUserId || String(sp.alunoId),
      nomeTurma: sp.turmaName || '',
      idCompetencia: sp.externalCompetenciaId || String(sp.competenciaId),
      nomeCompetencia: sp.competenciaName || '',
      notaAvaliacao: nota010,
      aprovado: nota010 >= 7,
      aulasConcluidas: parseInt(sp.aulasConcluidas) || 0,
      aulasDisponiveis: parseInt(sp.aulasDisponiveis) || 0,
    });
  }
  
  // Build compIdToCodigoMap
  const compIdToCodigoMap = new Map();
  for (const c of allCompetencias) {
    if (c.codigoIntegracao) {
      compIdToCodigoMap.set(c.id, c.codigoIntegracao);
    }
  }
  
  // Build ciclos for Joseane (individual)
  const joseanePdis = allPdis.filter(p => p.alunoId === alunoId);
  const joseaneComps = allComps.filter(c => joseanePdis.some(p => p.id === c.assessmentPdiId));
  
  const ciclosJoseane = [];
  let autoId = 100000;
  for (const pdi of joseanePdis) {
    const trilhaNome = trilhaMap.get(pdi.trilhaId)?.name || `Trilha ${pdi.trilhaId}`;
    const comps = joseaneComps.filter(c => c.assessmentPdiId === pdi.id);
    
    const cicloGroups = new Map();
    for (const comp of comps) {
      if (!comp.microInicio || !comp.microTermino) continue;
      const inicio = new Date(comp.microInicio).toISOString().split('T')[0];
      const termino = new Date(comp.microTermino).toISOString().split('T')[0];
      const key = `${inicio}|${termino}`;
      const group = cicloGroups.get(key) || { allCompIds: [], obrigatoriaIds: [], inicio, termino };
      group.allCompIds.push(comp.competenciaId);
      if (comp.peso === 'obrigatoria') {
        group.obrigatoriaIds.push(comp.competenciaId);
      }
      cicloGroups.set(key, group);
    }
    
    const sortedGroups = Array.from(cicloGroups.entries()).sort((a, b) => a[1].inicio.localeCompare(b[1].inicio));
    for (const [, group] of sortedGroups) {
      if (group.allCompIds.length === 0) continue;
      const namesForTitle = group.obrigatoriaIds.length > 0 ? group.obrigatoriaIds : group.allCompIds;
      const allNames = namesForTitle.map(id => compNomeMap.get(id) || `Comp ${id}`);
      const compNames = allNames.length <= 2 ? allNames.join(', ') : `${allNames.slice(0, 2).join(', ')} +${allNames.length - 2}`;
      ciclosJoseane.push({
        id: autoId++,
        nomeCiclo: `${trilhaNome} - ${compNames}`,
        trilhaNome: trilhaNome,
        dataInicio: group.inicio,
        dataFim: group.termino,
        competenciaIds: group.obrigatoriaIds,
        allCompetenciaIds: group.allCompIds,
      });
    }
  }
  
  // Calculate V2 individual
  const resultIndividual = calcularIndicadoresAluno(
    externalId, mentorias, eventos, performance, ciclosJoseane, compIdToCodigoMap, []
  );
  
  console.log('=== V2 INDIVIDUAL ===');
  console.log('Ciclos finalizados:', resultIndividual.ciclosFinalizados.length);
  console.log('Ciclos em andamento:', resultIndividual.ciclosEmAndamento.length);
  console.log('Consolidado ind7:', resultIndividual.consolidado.ind7_engajamentoFinal);
  console.log('notaFinal:', resultIndividual.notaFinal);
  console.log('performanceGeral:', resultIndividual.performanceGeral);
  console.log('Consolidado details:');
  console.log('  ind1_webinars:', resultIndividual.consolidado.ind1_webinars);
  console.log('  ind2_avaliacoes:', resultIndividual.consolidado.ind2_avaliacoes);
  console.log('  ind3_competencias:', resultIndividual.consolidado.ind3_competencias);
  console.log('  ind4_tarefas:', resultIndividual.consolidado.ind4_tarefas);
  console.log('  ind5_engajamento:', resultIndividual.consolidado.ind5_engajamento);
  console.log('  ind7_engajamentoFinal:', resultIndividual.consolidado.ind7_engajamentoFinal);
  
  console.log('\n=== PER CYCLE DETAILS ===');
  for (const ciclo of [...resultIndividual.ciclosFinalizados, ...resultIndividual.ciclosEmAndamento]) {
    const cicloOrig = ciclosJoseane.find(c => c.nomeCiclo === ciclo.nomeCiclo);
    console.log(`${ciclo.nomeCiclo} [${ciclo.status}] compIds=[${cicloOrig?.competenciaIds}]`);
    console.log(`  ind1=${ciclo.ind1_webinars} ind2=${ciclo.ind2_avaliacoes} ind3=${ciclo.ind3_competencias} ind4=${ciclo.ind4_tarefas} ind5=${ciclo.ind5_engajamento} ind7=${ciclo.ind7_engajamentoFinal}`);
  }
  
  // Now calculate using calcularIndicadoresTodosAlunos
  const { calcularIndicadoresTodosAlunos } = await import('./server/indicatorsCalculatorV2.ts');
  
  // Build ciclosPorAluno for all
  const ciclosPorAluno = new Map();
  autoId = 200000;
  for (const pdi of allPdis) {
    const al = alunoMap.get(pdi.alunoId);
    const alunoKey = al?.externalId || String(pdi.alunoId);
    const trilhaNome = trilhaMap.get(pdi.trilhaId)?.name || `Trilha ${pdi.trilhaId}`;
    const comps = allComps.filter(c => c.assessmentPdiId === pdi.id);
    
    const cicloGroups = new Map();
    for (const comp of comps) {
      if (!comp.microInicio || !comp.microTermino) continue;
      const inicio = new Date(comp.microInicio).toISOString().split('T')[0];
      const termino = new Date(comp.microTermino).toISOString().split('T')[0];
      const key = `${inicio}|${termino}`;
      const group = cicloGroups.get(key) || { allCompIds: [], obrigatoriaIds: [], inicio, termino };
      group.allCompIds.push(comp.competenciaId);
      if (comp.peso === 'obrigatoria') group.obrigatoriaIds.push(comp.competenciaId);
      cicloGroups.set(key, group);
    }
    
    const existing = ciclosPorAluno.get(alunoKey) || [];
    const sortedGroups = Array.from(cicloGroups.entries()).sort((a, b) => a[1].inicio.localeCompare(b[1].inicio));
    for (const [, group] of sortedGroups) {
      if (group.allCompIds.length === 0) continue;
      const namesForTitle = group.obrigatoriaIds.length > 0 ? group.obrigatoriaIds : group.allCompIds;
      const allNames = namesForTitle.map(id => compNomeMap.get(id) || `Comp ${id}`);
      const compNames = allNames.length <= 2 ? allNames.join(', ') : `${allNames.slice(0, 2).join(', ')} +${allNames.length - 2}`;
      existing.push({
        id: autoId++,
        nomeCiclo: `${trilhaNome} - ${compNames}`,
        trilhaNome: trilhaNome,
        dataInicio: group.inicio,
        dataFim: group.termino,
        competenciaIds: group.obrigatoriaIds,
        allCompetenciaIds: group.allCompIds,
      });
    }
    if (existing.length > 0) ciclosPorAluno.set(alunoKey, existing);
  }
  
  const todosIndicadores = calcularIndicadoresTodosAlunos(mentorias, eventos, performance, ciclosPorAluno, compIdToCodigoMap, []);
  const joseaneGlobal = todosIndicadores.find(i => i.idUsuario === externalId);
  
  console.log('\n=== V2 GLOBAL (calcularIndicadoresTodosAlunos) ===');
  if (joseaneGlobal) {
    console.log('Ciclos finalizados:', joseaneGlobal.ciclosFinalizados.length);
    console.log('Ciclos em andamento:', joseaneGlobal.ciclosEmAndamento.length);
    console.log('Consolidado ind7:', joseaneGlobal.consolidado.ind7_engajamentoFinal);
    console.log('notaFinal:', joseaneGlobal.notaFinal);
    console.log('performanceGeral:', joseaneGlobal.performanceGeral);
    console.log('Consolidado details:');
    console.log('  ind1_webinars:', joseaneGlobal.consolidado.ind1_webinars);
    console.log('  ind2_avaliacoes:', joseaneGlobal.consolidado.ind2_avaliacoes);
    console.log('  ind3_competencias:', joseaneGlobal.consolidado.ind3_competencias);
    console.log('  ind4_tarefas:', joseaneGlobal.consolidado.ind4_tarefas);
    console.log('  ind5_engajamento:', joseaneGlobal.consolidado.ind5_engajamento);
    console.log('  ind7_engajamentoFinal:', joseaneGlobal.consolidado.ind7_engajamentoFinal);
  } else {
    console.log('Joseane NOT FOUND in global indicators!');
  }
  
  console.log('\n=== COMPARISON ===');
  console.log('Individual ind7:', resultIndividual.consolidado.ind7_engajamentoFinal);
  console.log('Global ind7:', joseaneGlobal?.consolidado.ind7_engajamentoFinal);
  console.log('MATCH:', resultIndividual.consolidado.ind7_engajamentoFinal === joseaneGlobal?.consolidado.ind7_engajamentoFinal);
  
  await conn.end();
}

main().catch(console.error);
