// Simular a lógica de determinarStatusCiclo
function determinarStatusCiclo(dataInicio, dataFim, hoje) {
  const now = hoje || new Date();
  const inicio = new Date(dataInicio + 'T00:00:00');
  const fim = new Date(dataFim + 'T23:59:59');
  
  console.log(`  now = ${now.toISOString()}`);
  console.log(`  inicio = ${inicio.toISOString()}`);
  console.log(`  fim = ${fim.toISOString()}`);
  console.log(`  now > fim? ${now > fim}`);
  console.log(`  now >= inicio? ${now >= inicio}`);
  console.log(`  now <= fim? ${now <= fim}`);
  
  if (now > fim) return 'finalizado';
  if (now >= inicio && now <= fim) return 'em_andamento';
  return 'futuro';
}

console.log('=== Ciclo Master: 2025-11-30 a 2026-05-10 ===');
const status = determinarStatusCiclo('2025-11-30', '2026-05-10');
console.log(`Status: ${status}`);

console.log('\n=== Ciclo Basic: 2025-04-10 a 2025-10-30 ===');
const status2 = determinarStatusCiclo('2025-04-10', '2025-10-30');
console.log(`Status: ${status2}`);

console.log('\n=== Ciclo Essential: 2025-07-10 a 2025-12-31 ===');
const status3 = determinarStatusCiclo('2025-07-10', '2025-12-31');
console.log(`Status: ${status3}`);
