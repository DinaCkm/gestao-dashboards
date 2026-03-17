import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get all assessment_competencias for Brenno (30035) and Ilda (30041)
  const [comps] = await conn.execute(`
    SELECT ac.competenciaId, ac.peso, ac.nivelAtual, ac.metaFinal,
           ap.alunoId
    FROM assessment_competencias ac
    JOIN assessment_pdi ap ON ac.assessmentPdiId = ap.id
    WHERE ap.alunoId IN (30035, 30041)
    ORDER BY ap.alunoId, ac.competenciaId
  `);
  
  // Group by alunoId+competenciaId to avoid duplicates (aluno can have same comp in multiple trilhas)
  const uniqueMap = new Map();
  for (const c of comps) {
    const key = c.alunoId + '_' + c.competenciaId;
    const existing = uniqueMap.get(key);
    if (!existing) {
      uniqueMap.set(key, c);
    } else if (c.peso === 'obrigatoria') {
      // If one is obrigatoria, keep that one
      uniqueMap.set(key, c);
    }
  }
  
  const entries = Array.from(uniqueMap.values());
  console.log('Inserting ' + entries.length + ' plano_individual records...');
  
  for (const c of entries) {
    const isObrigatoria = c.peso === 'obrigatoria' ? 1 : 0;
    const notaAtual = c.nivelAtual ? parseFloat(c.nivelAtual) : null;
    const metaNota = c.metaFinal ? parseFloat(c.metaFinal) : 7.00;
    
    await conn.execute(
      'INSERT INTO plano_individual (alunoId, competenciaId, isObrigatoria, notaAtual, metaNota, status) VALUES (?, ?, ?, ?, ?, ?)',
      [c.alunoId, c.competenciaId, isObrigatoria, notaAtual, metaNota, 'pendente']
    );
    console.log('  Inserted: alunoId=' + c.alunoId + ' compId=' + c.competenciaId + ' obrigatoria=' + isObrigatoria + ' nota=' + notaAtual + ' meta=' + metaNota);
  }
  
  // Verify
  const [verify] = await conn.execute('SELECT alunoId, COUNT(*) as cnt FROM plano_individual WHERE alunoId IN (30035, 30041) GROUP BY alunoId');
  console.log('\nVerificação:', JSON.stringify(verify));
  
  await conn.end();
}

main().catch(console.error);
