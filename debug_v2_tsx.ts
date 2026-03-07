import * as db from './server/db';
import { calcularIndicadoresAluno as calcularIndicadoresAlunoV2, calcularIndicadoresTodosAlunos, agregarIndicadores } from './server/indicatorsCalculatorV2';
import type { CaseSucessoData, CicloDataV2 } from './server/indicatorsCalculatorV2';

async function main() {
  // 1. Buscar dados como o endpoint porEmpresa faz
  const mentorias = await db.getAllMentoringSessions();
  const eventos = await db.getAllEventParticipationWithDate();
  const performance = await db.getStudentPerformanceAsRecords();
  const ciclosPorAluno = await db.getAllCiclosForCalculatorV2();
  const compIdToCodigoMap = await db.getCompIdToCodigoMap();
  const casesMap = await db.getCasesForCalculator();
  const casesData: CaseSucessoData[] = [];
  for (const [, cases] of Array.from(casesMap.entries())) { casesData.push(...cases); }

  // 2. Calcular indicadores para TODOS (como porEmpresa faz)
  const todosIndicadores = calcularIndicadoresTodosAlunos(mentorias, eventos, performance, ciclosPorAluno, compIdToCodigoMap, casesData);
  
  // 3. Encontrar Joseane nos resultados globais
  const joseaneGlobal = todosIndicadores.find(i => i.nomeAluno?.includes('Joseane'));
  if (joseaneGlobal) {
    console.log('=== JOSEANE - CÁLCULO GLOBAL (porEmpresa/visaoGeral) ===');
    console.log('nomeAluno:', joseaneGlobal.nomeAluno);
    console.log('idUsuario:', joseaneGlobal.idUsuario);
    console.log('performanceGeral:', joseaneGlobal.performanceGeral);
    console.log('notaFinal:', joseaneGlobal.notaFinal);
    console.log('consolidado.ind1_webinars:', joseaneGlobal.consolidado.ind1_webinars);
    console.log('consolidado.ind2_avaliacoes:', joseaneGlobal.consolidado.ind2_avaliacoes);
    console.log('consolidado.ind3_competencias:', joseaneGlobal.consolidado.ind3_competencias);
    console.log('consolidado.ind4_tarefas:', joseaneGlobal.consolidado.ind4_tarefas);
    console.log('consolidado.ind5_engajamento:', joseaneGlobal.consolidado.ind5_engajamento);
    console.log('consolidado.ind7_engajamentoFinal:', joseaneGlobal.consolidado.ind7_engajamentoFinal);
    
    console.log('\nCiclos finalizados:');
    for (const c of joseaneGlobal.ciclosFinalizados) {
      console.log(`  ${c.nomeCiclo}: ind1=${c.ind1_webinars} ind2=${c.ind2_avaliacoes} ind3=${c.ind3_competencias} ind4=${c.ind4_tarefas} ind5=${c.ind5_engajamento} ind7=${c.ind7_engajamentoFinal}`);
    }
  } else {
    console.log('Joseane NÃO encontrada no cálculo global!');
    console.log('Total de alunos calculados:', todosIndicadores.length);
    // List first 5
    for (const i of todosIndicadores.slice(0, 5)) {
      console.log(`  ${i.nomeAluno} (${i.idUsuario})`);
    }
  }

  // 4. Agora calcular INDIVIDUALMENTE (como meuDashboard faz)
  // Buscar Joseane no DB
  const alunosList = await db.getAlunos();
  const joseaneAluno = alunosList.find((a: any) => a.name?.includes('Joseane'));
  if (joseaneAluno) {
    console.log('\n\n=== JOSEANE - CÁLCULO INDIVIDUAL (meuDashboard) ===');
    console.log('alunoId:', joseaneAluno.id, 'externalId:', joseaneAluno.externalId);
    
    const idUsuario = joseaneAluno.externalId;
    
    // Get individual cycles
    const ciclosIndividual = await db.getCiclosForCalculatorV2(joseaneAluno.id);
    const ciclosV2Individual = ciclosIndividual.map((c: any) => ({
      ...c,
      trilhaNome: c.nomeCiclo.split(' - ')[0] || 'Geral',
    }));
    
    const casesAluno = await db.getCasesSucessoByAluno(joseaneAluno.id);
    const casesDataAluno: CaseSucessoData[] = casesAluno.map((c: any) => ({
      alunoId: c.alunoId,
      trilhaNome: c.trilhaNome || 'Geral',
      entregue: c.entregue === 1,
    }));
    
    const indicadoresV2Individual = calcularIndicadoresAlunoV2(
      idUsuario, mentorias, eventos, performance, ciclosV2Individual, compIdToCodigoMap, casesDataAluno
    );
    
    console.log('performanceGeral:', indicadoresV2Individual.performanceGeral);
    console.log('notaFinal:', indicadoresV2Individual.notaFinal);
    console.log('consolidado.ind1_webinars:', indicadoresV2Individual.consolidado.ind1_webinars);
    console.log('consolidado.ind2_avaliacoes:', indicadoresV2Individual.consolidado.ind2_avaliacoes);
    console.log('consolidado.ind3_competencias:', indicadoresV2Individual.consolidado.ind3_competencias);
    console.log('consolidado.ind4_tarefas:', indicadoresV2Individual.consolidado.ind4_tarefas);
    console.log('consolidado.ind5_engajamento:', indicadoresV2Individual.consolidado.ind5_engajamento);
    console.log('consolidado.ind7_engajamentoFinal:', indicadoresV2Individual.consolidado.ind7_engajamentoFinal);
    
    console.log('\nCiclos finalizados:');
    for (const c of indicadoresV2Individual.ciclosFinalizados) {
      console.log(`  ${c.nomeCiclo}: ind1=${c.ind1_webinars} ind2=${c.ind2_avaliacoes} ind3=${c.ind3_competencias} ind4=${c.ind4_tarefas} ind5=${c.ind5_engajamento} ind7=${c.ind7_engajamentoFinal}`);
    }
    
    // 5. Compare
    if (joseaneGlobal) {
      console.log('\n\n=== COMPARAÇÃO ===');
      console.log('Global ind7:', joseaneGlobal.consolidado.ind7_engajamentoFinal);
      console.log('Individual ind7:', indicadoresV2Individual.consolidado.ind7_engajamentoFinal);
      console.log('Global notaFinal:', joseaneGlobal.notaFinal);
      console.log('Individual notaFinal:', indicadoresV2Individual.notaFinal);
      console.log('IGUAIS?', joseaneGlobal.consolidado.ind7_engajamentoFinal === indicadoresV2Individual.consolidado.ind7_engajamentoFinal);
      
      // Compare ciclo by ciclo
      console.log('\nComparação ciclo a ciclo:');
      for (let i = 0; i < joseaneGlobal.ciclosFinalizados.length; i++) {
        const g = joseaneGlobal.ciclosFinalizados[i];
        const ind = indicadoresV2Individual.ciclosFinalizados[i];
        if (g && ind) {
          const diff = g.ind7_engajamentoFinal !== ind.ind7_engajamentoFinal;
          console.log(`  ${g.nomeCiclo}: global=${g.ind7_engajamentoFinal} vs individual=${ind.ind7_engajamentoFinal} ${diff ? '*** DIFERENTE ***' : 'OK'}`);
        }
      }
    }
  }
  
  process.exit(0);
}

main().catch(console.error);
