// Debug: Comparar cálculo V2 individual vs global para a Joseane
import * as db from './server/db';
import { calcularIndicadoresAluno, calcularIndicadoresTodosAlunos, CaseSucessoData } from './server/indicatorsCalculatorV2';
import { MentoringRecord, EventRecord, PerformanceRecord } from './server/excelProcessor';

async function main() {
  const alunosList = await db.getAlunos();
  const joseane = alunosList.find(a => a.name.includes('Joseane'));
  if (!joseane) { console.log('Joseane não encontrada'); return; }
  console.log(`Joseane: id=${joseane.id}, externalId=${joseane.externalId}`);
  const idUsuario = joseane.externalId || String(joseane.id);

  // === Montar dados compartilhados ===
  const allSessions = await db.getAllMentoringSessions();
  const allEventParticipations = await db.getAllEventParticipationWithDate();
  const programsList = await db.getPrograms();
  const turmasList = await db.getTurmas();
  const allPlanoItems = await db.getAllPlanoIndividual();

  const alunoMap = new Map(alunosList.map(a => [a.id, a]));
  const programMap = new Map(programsList.map(p => [p.id, p]));
  const turmaMap = new Map(turmasList.map(t => [t.id, t]));

  const mentorias: MentoringRecord[] = [];
  const eventos: EventRecord[] = [];
  const performance: PerformanceRecord[] = [];

  for (const session of allSessions) {
    const sessionAluno = alunoMap.get(session.alunoId);
    if (!sessionAluno) continue;
    const program = sessionAluno.programId ? programMap.get(sessionAluno.programId) : null;
    const turma = sessionAluno.turmaId ? turmaMap.get(sessionAluno.turmaId) : null;
    mentorias.push({
      idUsuario: sessionAluno.externalId || String(sessionAluno.id),
      nomeAluno: sessionAluno.name,
      empresa: program?.name || 'Desconhecida',
      turma: turma?.name || '',
      trilha: '',
      ciclo: session.ciclo || '',
      sessao: session.sessionNumber || 0,
      dataSessao: session.sessionDate ? new Date(session.sessionDate) : undefined,
      presenca: session.presence as 'presente' | 'ausente',
      atividadeEntregue: (session.taskStatus || 'sem_tarefa') as 'entregue' | 'nao_entregue' | 'sem_tarefa',
      engajamento: session.engagementScore || undefined,
      feedback: session.feedback || '',
    });
  }

  for (const ep of allEventParticipations) {
    const epAluno = alunoMap.get(ep.alunoId);
    if (!epAluno) continue;
    const program = epAluno.programId ? programMap.get(epAluno.programId) : null;
    eventos.push({
      idUsuario: epAluno.externalId || String(epAluno.id),
      nomeAluno: epAluno.name,
      empresa: program?.name || 'Desconhecida',
      turma: '',
      trilha: '',
      tituloEvento: ep.eventTitle || 'Evento',
      dataEvento: ep.eventDate ? new Date(ep.eventDate) : undefined,
      presenca: ep.status as 'presente' | 'ausente',
    });
  }

  // Adicionar eventos ausentes (unificação)
  const eventParticipationEventIds = new Map<number, Set<number>>();
  for (const ep of allEventParticipations) {
    if (!eventParticipationEventIds.has(ep.alunoId)) eventParticipationEventIds.set(ep.alunoId, new Set());
    eventParticipationEventIds.get(ep.alunoId)!.add(ep.eventId);
  }
  const eventsByProgram = new Map<number, any[]>();
  for (const prog of programsList) {
    const progEvents = await db.getEventsByProgramOrGlobal(prog.id);
    eventsByProgram.set(prog.id, progEvents);
  }
  for (const a of alunosList) {
    if (!a.programId) continue;
    const progEvents = eventsByProgram.get(a.programId) || [];
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
          presenca: 'ausente' as const,
        });
      }
    }
  }

  // === Performance (porEmpresa style - plano individual + student_performance) ===
  const performancePorEmpresa: PerformanceRecord[] = [];
  for (const item of allPlanoItems) {
    if (item.notaAtual) {
      const aluno = alunoMap.get(item.alunoId);
      if (!aluno) continue;
      performancePorEmpresa.push({
        idUsuario: aluno.externalId || String(aluno.id),
        nomeTurma: '',
        idCompetencia: String(item.competenciaId),
        nomeCompetencia: item.competenciaNome || '',
        notaAvaliacao: parseFloat(item.notaAtual),
        aprovado: parseFloat(item.notaAtual) >= 7,
      });
    }
  }
  const studentPerfRecords = await db.getStudentPerformanceAsRecords();
  const existingPerfKeys = new Set(performancePorEmpresa.map(p => `${p.idUsuario}|${p.idCompetencia}`));
  for (const spRec of studentPerfRecords) {
    const key = `${spRec.idUsuario}|${spRec.idCompetencia}`;
    if (!existingPerfKeys.has(key)) {
      performancePorEmpresa.push(spRec);
      existingPerfKeys.add(key);
    }
  }

  // === Performance (meuDashboard style - plano individual do aluno + student_performance) ===
  const performanceMeuDash: PerformanceRecord[] = [];
  const planoItems = await db.getPlanoIndividualByAluno(joseane.id);
  for (const item of planoItems) {
    if (item.notaAtual) {
      performanceMeuDash.push({
        idUsuario: joseane.externalId || String(joseane.id),
        nomeTurma: '',
        idCompetencia: String(item.competenciaId),
        nomeCompetencia: item.competenciaNome || '',
        notaAvaliacao: parseFloat(item.notaAtual),
        aprovado: parseFloat(item.notaAtual) >= 7,
      });
    }
  }
  const existingPerfKeys2 = new Set(performanceMeuDash.map(p => `${p.idUsuario}|${p.idCompetencia}`));
  for (const spRec of studentPerfRecords) {
    const key = `${spRec.idUsuario}|${spRec.idCompetencia}`;
    if (!existingPerfKeys2.has(key)) {
      performanceMeuDash.push(spRec);
      existingPerfKeys2.add(key);
    }
  }

  // === Ciclos individuais (meuDashboard) ===
  const ciclosIndividuais = await db.getCiclosForCalculator(joseane.id);
  
  // === Ciclos globais (porEmpresa) ===
  const ciclosPorAluno = await db.getAllCiclosForCalculatorV2();
  const ciclosGlobais = ciclosPorAluno.get(idUsuario) || [];

  console.log('\n=== CICLOS INDIVIDUAIS ===');
  for (const c of ciclosIndividuais) {
    console.log(`  ${c.nomeCiclo}: ${c.dataInicio} → ${c.dataFim} | compIds: [${c.competenciaIds.join(',')}]`);
  }

  console.log('\n=== CICLOS GLOBAIS ===');
  for (const c of ciclosGlobais) {
    console.log(`  ${c.nomeCiclo}: ${c.dataInicio} → ${c.dataFim} | compIds: [${c.competenciaIds.join(',')}]`);
  }

  // === Performance da Joseane em cada fonte ===
  const josePerfPorEmpresa = performancePorEmpresa.filter(p => p.idUsuario === idUsuario);
  const josePerfMeuDash = performanceMeuDash.filter(p => p.idUsuario === idUsuario);
  
  console.log('\n=== PERFORMANCE JOSEANE (porEmpresa) ===');
  for (const p of josePerfPorEmpresa) {
    console.log(`  ${p.nomeCompetencia || p.idCompetencia}: nota=${p.notaAvaliacao}`);
  }
  
  console.log('\n=== PERFORMANCE JOSEANE (meuDashboard) ===');
  for (const p of josePerfMeuDash) {
    console.log(`  ${p.nomeCompetencia || p.idCompetencia}: nota=${p.notaAvaliacao}`);
  }

  // === Calcular V2 individual ===
  const compIdToCodigoMap = await db.getCompIdToCodigoMap();
  const casesAluno = await db.getCasesSucessoByAluno(joseane.id);
  const casesDataAluno: CaseSucessoData[] = casesAluno.map(c => ({
    alunoId: c.alunoId,
    trilhaId: c.trilhaId,
    trilhaNome: c.trilhaNome,
    entregue: c.entregue === 1,
  }));
  
  const ciclosV2Individual = ciclosIndividuais.map(c => ({
    ...c,
    trilhaNome: c.nomeCiclo.split(' - ')[0] || 'Geral',
  }));
  
  const resultIndividual = calcularIndicadoresAluno(
    idUsuario, mentorias, eventos, performanceMeuDash, ciclosV2Individual, compIdToCodigoMap, casesDataAluno
  );

  // === Calcular V2 global ===
  const casesMapAll = await db.getCasesForCalculator();
  const casesDataAll: CaseSucessoData[] = [];
  for (const [, cases] of Array.from(casesMapAll.entries())) { casesDataAll.push(...cases); }
  
  const todosIndicadores = calcularIndicadoresTodosAlunos(mentorias, eventos, performancePorEmpresa, ciclosPorAluno, compIdToCodigoMap, casesDataAll);
  const joseaneGlobal = todosIndicadores.find(i => i.idUsuario === idUsuario);

  console.log('\n=== RESULTADO V2 INDIVIDUAL (meuDashboard) ===');
  console.log(`  ind7_engajamentoFinal (consolidado): ${resultIndividual.consolidado?.ind7_engajamentoFinal}`);
  console.log(`  ind1: ${resultIndividual.consolidado?.ind1_webinars}`);
  console.log(`  ind2: ${resultIndividual.consolidado?.ind2_avaliacoes}`);
  console.log(`  ind3: ${resultIndividual.consolidado?.ind3_competencias}`);
  console.log(`  ind4: ${resultIndividual.consolidado?.ind4_tarefas}`);
  console.log(`  ind5: ${resultIndividual.consolidado?.ind5_engajamento}`);
  console.log(`  Ciclos finalizados: ${resultIndividual.ciclosFinalizados.length}`);
  for (const c of resultIndividual.ciclosFinalizados) {
    console.log(`    ${c.nomeCiclo}: ind7=${c.ind7_engajamentoFinal} | ind1=${c.ind1_webinars} ind2=${c.ind2_avaliacoes} ind3=${c.ind3_competencias} ind4=${c.ind4_tarefas} ind5=${c.ind5_engajamento}`);
  }

  console.log('\n=== RESULTADO V2 GLOBAL (porEmpresa) ===');
  if (joseaneGlobal) {
    console.log(`  notaFinal: ${joseaneGlobal.notaFinal}`);
    console.log(`  performanceGeral: ${joseaneGlobal.performanceGeral}`);
    console.log(`  ind7 consolidado: ${joseaneGlobal.consolidado?.ind7_engajamentoFinal}`);
    console.log(`  ind1: ${joseaneGlobal.consolidado?.ind1_webinars}`);
    console.log(`  ind2: ${joseaneGlobal.consolidado?.ind2_avaliacoes}`);
    console.log(`  ind3: ${joseaneGlobal.consolidado?.ind3_competencias}`);
    console.log(`  ind4: ${joseaneGlobal.consolidado?.ind4_tarefas}`);
    console.log(`  ind5: ${joseaneGlobal.consolidado?.ind5_engajamento}`);
    console.log(`  Ciclos finalizados: ${joseaneGlobal.ciclosFinalizados?.length}`);
    if (joseaneGlobal.ciclosFinalizados) {
      for (const c of joseaneGlobal.ciclosFinalizados) {
        console.log(`    ${c.nomeCiclo}: ind7=${c.ind7_engajamentoFinal} | ind1=${c.ind1_webinars} ind2=${c.ind2_avaliacoes} ind3=${c.ind3_competencias} ind4=${c.ind4_tarefas} ind5=${c.ind5_engajamento}`);
      }
    }
  } else {
    console.log('  Joseane NÃO ENCONTRADA no cálculo global!');
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
