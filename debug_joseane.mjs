import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config();

// Import the actual calculator functions
const { calcularIndicadoresAlunoV2, calcularIndicadoresTodosAlunos } = require('./server/indicatorsCalculatorV2.ts');

// We need to get the actual data from the DB
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  const alunoId = 30066;
  const externalId = '667285';
  
  // Get all data needed
  const [allSessions] = await conn.query('SELECT * FROM mentoring_sessions');
  const [allAlunos] = await conn.query('SELECT * FROM alunos');
  const [allPrograms] = await conn.query('SELECT * FROM programs');
  const [allTurmas] = await conn.query('SELECT * FROM turmas');
  const [allEventPart] = await conn.query('SELECT ep.*, e.title as eventTitle, e.eventDate FROM event_participation ep JOIN events e ON e.id = ep.eventId');
  const [allPdis] = await conn.query("SELECT * FROM assessment_pdi WHERE status = 'ativo'");
  const [allComps] = await conn.query('SELECT ac.*, c.nome as compNome FROM assessment_competencias ac LEFT JOIN competencias c ON c.id = ac.competenciaId');
  const [allTrilhas] = await conn.query('SELECT * FROM trilhas');
  const [allCompetencias] = await conn.query('SELECT * FROM competencias');
  const [studentPerf] = await conn.query('SELECT * FROM student_performance');
  
  // Build maps
  const alunoMap = new Map(allAlunos.map(a => [a.id, a]));
  const programMap = new Map(allPrograms.map(p => [p.id, p]));
  const turmaMap = new Map(allTurmas.map(t => [t.id, t]));
  const trilhaMap = new Map(allTrilhas.map(t => [t.id, t]));
  const compNomeMap = new Map(allCompetencias.map(c => [c.id, c.nome]));
  
  // Build mentorias
  const mentorias = allSessions.map(s => {
    const al = alunoMap.get(s.alunoId);
    if (!al) return null;
    const prog = al.programId ? programMap.get(al.programId) : null;
    const turma = al.turmaId ? turmaMap.get(al.turmaId) : null;
    return {
      idUsuario: al.externalId || String(al.id),
      nomeAluno: al.name,
      empresa: prog?.name || 'Desconhecida',
      turma: turma?.name || '',
      trilha: '',
      ciclo: s.ciclo || '',
      sessao: s.sessionNumber || 0,
      dataSessao: s.sessionDate ? new Date(s.sessionDate) : undefined,
      presenca: s.presence,
      atividadeEntregue: s.taskStatus || 'sem_tarefa',
      engajamento: s.engagementScore || undefined,
      feedback: s.feedback || '',
    };
  }).filter(Boolean);
  
  // Build eventos
  const eventos = allEventPart.map(ep => {
    const al = alunoMap.get(ep.alunoId);
    if (!al) return null;
    const prog = al.programId ? programMap.get(al.programId) : null;
    return {
      idUsuario: al.externalId || String(al.id),
      nomeAluno: al.name,
      empresa: prog?.name || 'Desconhecida',
      turma: '',
      trilha: '',
      tituloEvento: ep.eventTitle || 'Evento',
      dataEvento: ep.eventDate ? new Date(ep.eventDate) : undefined,
      presenca: ep.status,
    };
  }).filter(Boolean);
  
  // Build performance
  const performance = studentPerf.map(sp => {
    const mediaResp = parseFloat(sp.mediaAvaliacoesRespondidas) || 0;
    const mediaDisp = parseFloat(sp.mediaAvaliacoesDisponiveis) || 0;
    const notaBase = mediaResp > 0 ? mediaResp : (mediaDisp > 0 ? mediaDisp : 0);
    const nota010 = notaBase / 10;
    return {
      idUsuario: sp.externalUserId || String(sp.alunoId),
      nomeTurma: sp.turmaName || '',
      idCompetencia: sp.externalCompetenciaId || String(sp.competenciaId),
      nomeCompetencia: sp.competenciaName || '',
      notaAvaliacao: nota010,
      aprovado: nota010 >= 7,
    };
  });
  
  // Build ciclos for Joseane (individual - same as getCiclosForCalculator)
  const joseanePdis = allPdis.filter(p => p.alunoId === alunoId);
  const joseaneComps = allComps.filter(c => joseanePdis.some(p => p.id === c.assessmentPdiId));
  
  console.log('=== JOSEANE CICLOS (from assessment_competencias) ===');
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
      const ciclo = {
        id: autoId++,
        nomeCiclo: `${trilhaNome} - ${compNames}`,
        trilhaNome: trilhaNome,
        dataInicio: group.inicio,
        dataFim: group.termino,
        competenciaIds: group.obrigatoriaIds,
        allCompetenciaIds: group.allCompIds,
      };
      ciclosJoseane.push(ciclo);
      const now = new Date();
      const fim = new Date(group.termino);
      console.log(`  ${ciclo.nomeCiclo} | ${group.inicio} → ${group.termino} | finalizado: ${fim < now}`);
    }
  }
  
  // Filter mentorias/eventos for Joseane
  const mentoriasJoseane = mentorias.filter(m => m.idUsuario === externalId);
  const eventosJoseane = eventos.filter(e => e.idUsuario === externalId);
  const perfJoseane = performance.filter(p => p.idUsuario === externalId);
  
  console.log('\n=== JOSEANE DATA ===');
  console.log('Mentorias:', mentoriasJoseane.length);
  console.log('Eventos:', eventosJoseane.length);
  console.log('Performance:', perfJoseane.length);
  console.log('Ciclos:', ciclosJoseane.length);
  
  // Now check: what does the V2 calculator see for Joseane?
  // The issue might be that getAllCiclosForCalculatorV2 builds ciclos differently
  // Let's build ciclos for ALL alunos the same way
  
  const ciclosPorAluno = new Map();
  autoId = 100000;
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
      if (comp.peso === 'obrigatoria') {
        group.obrigatoriaIds.push(comp.competenciaId);
      }
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
    if (existing.length > 0) {
      ciclosPorAluno.set(alunoKey, existing);
    }
  }
  
  // Check Joseane's ciclos from the global map
  const joseaneCiclosGlobal = ciclosPorAluno.get(externalId) || [];
  console.log('\n=== CICLOS GLOBAL MAP for Joseane ===');
  joseaneCiclosGlobal.forEach(c => {
    const now = new Date();
    const fim = new Date(c.dataFim);
    console.log(`  ${c.nomeCiclo} | ${c.dataInicio} → ${c.dataFim} | finalizado: ${fim < now} | compIds: [${c.competenciaIds}] | allCompIds: [${c.allCompetenciaIds}]`);
  });
  
  // Now let's manually calculate what each indicator would be
  // For the individual calc: uses ciclosJoseane
  // For the global calc: uses ciclosPorAluno.get(externalId)
  
  // They should be the same! Let's verify
  const individualSame = JSON.stringify(ciclosJoseane) === JSON.stringify(joseaneCiclosGlobal);
  console.log('\n=== CICLOS MATCH? ===', individualSame);
  
  if (!individualSame) {
    console.log('Individual ciclos count:', ciclosJoseane.length);
    console.log('Global ciclos count:', joseaneCiclosGlobal.length);
  }
  
  await conn.end();
}

main().catch(console.error);
