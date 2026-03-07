// Call the actual tRPC endpoints to compare results for Joseane
const BASE = 'http://localhost:3000/api/trpc';

async function callTrpc(procedure, input) {
  const url = `${BASE}/${procedure}?input=${encodeURIComponent(JSON.stringify(input))}`;
  const res = await fetch(url);
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (data.error) console.log('  tRPC error:', JSON.stringify(data.error).slice(0, 200));
    return data.result?.data;
  } catch(e) {
    console.log('  Raw response:', text.slice(0, 300));
    return null;
  }
}

// 1. Dashboard Gestor (porEmpresa) - shows 73% and 7.3
console.log('=== porEmpresa (SEBRAE TO) ===');
try {
  const empresaData = await callTrpc('indicadores.porEmpresa', { empresa: 'SEBRAE TO' });
  if (empresaData) {
    console.log('mediaPerformanceGeral:', empresaData.visaoEmpresa?.mediaPerformanceGeral);
    console.log('mediaNotaFinal:', empresaData.visaoEmpresa?.mediaNotaFinal);
    console.log('mediaInd7:', empresaData.visaoEmpresa?.mediaInd7);
    
    // Find Joseane in alunos
    const joseane = empresaData.alunos?.find(a => a.nomeAluno?.includes('Joseane'));
    if (joseane) {
      console.log('\nJoseane no porEmpresa:');
      console.log('  performanceGeral:', joseane.performanceGeral);
      console.log('  notaFinal:', joseane.notaFinal);
      console.log('  ind7_engajamentoFinal:', joseane.consolidado?.ind7_engajamentoFinal);
      console.log('  ind1:', joseane.consolidado?.ind1_webinars);
      console.log('  ind2:', joseane.consolidado?.ind2_avaliacoes);
      console.log('  ind3:', joseane.consolidado?.ind3_competencias);
      console.log('  ind4:', joseane.consolidado?.ind4_tarefas);
      console.log('  ind5:', joseane.consolidado?.ind5_engajamento);
    }
  }
} catch(e) { console.log('Error porEmpresa:', e.message); }

// 2. meuDashboard (individual) - shows 66%
// This needs auth, so let's try the detalheAluno endpoint instead
console.log('\n=== detalheAluno (Joseane) ===');
try {
  const detalhe = await callTrpc('indicadores.detalheAluno', { alunoId: '30066' });
  if (detalhe) {
    console.log('indicadoresV2 consolidado:');
    console.log('  ind1:', detalhe.indicadoresV2?.consolidado?.ind1_webinars);
    console.log('  ind2:', detalhe.indicadoresV2?.consolidado?.ind2_avaliacoes);
    console.log('  ind3:', detalhe.indicadoresV2?.consolidado?.ind3_competencias);
    console.log('  ind4:', detalhe.indicadoresV2?.consolidado?.ind4_tarefas);
    console.log('  ind5:', detalhe.indicadoresV2?.consolidado?.ind5_engajamento);
    console.log('  ind7:', detalhe.indicadoresV2?.consolidado?.ind7_engajamentoFinal);
    
    console.log('\nciclosFinalizados:');
    for (const c of (detalhe.indicadoresV2?.ciclosFinalizados || [])) {
      console.log(`  ${c.nomeCiclo}: ind7=${c.ind7_engajamentoFinal} | ind1=${c.ind1_webinars} ind2=${c.ind2_avaliacoes} ind3=${c.ind3_competencias} ind4=${c.ind4_tarefas} ind5=${c.ind5_engajamento}`);
    }
  }
} catch(e) { console.log('Error detalheAluno:', e.message); }

// 3. Also check the meuDashboard endpoint (needs auth cookie, may fail)
console.log('\n=== individualDashboard (Joseane 30066) ===');
try {
  const indiv = await callTrpc('indicadores.meuDashboard', {});
  if (indiv) {
    console.log('indicadoresV2 consolidado:');
    console.log('  ind1:', indiv.indicadoresV2?.consolidado?.ind1_webinars);
    console.log('  ind2:', indiv.indicadoresV2?.consolidado?.ind2_avaliacoes);
    console.log('  ind3:', indiv.indicadoresV2?.consolidado?.ind3_competencias);
    console.log('  ind4:', indiv.indicadoresV2?.consolidado?.ind4_tarefas);
    console.log('  ind5:', indiv.indicadoresV2?.consolidado?.ind5_engajamento);
    console.log('  ind7:', indiv.indicadoresV2?.consolidado?.ind7_engajamentoFinal);
  }
} catch(e) { console.log('Error individualDashboard:', e.message); }
