import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=== LIMPEZA DE DUPLICATAS NA TABELA CONSULTORS ===\n');
  
  // Plano de unificação baseado na análise:
  // IDs com sessões (segunda importação): 27-39
  // IDs sem sessões (primeira importação): 14-25 (exceto id 14 Equipe CKM com 130 sessões)
  // Joseane (id 30001) é cadastro manual, manter intacto
  
  const unifications = [
    {
      label: 'Adriana Deus + Adriana Deus - Coordenação',
      keepId: 39,  // Adriana Deus (35 sessões)
      mergeIds: [33, 26, 20],  // Adriana Deus - Coordenação (11 sessões) + duplicatas sem sessões
      finalName: 'Adriana Deus'
    },
    {
      label: 'Ana Carolina Cardoso Viana Rocha',
      keepId: 28,  // (1225 sessões)
      mergeIds: [15],
      finalName: 'Ana Carolina Cardoso Viana Rocha'
    },
    {
      label: 'Andressa Santos',
      keepId: 35,  // (52 sessões)
      mergeIds: [22],
      finalName: 'Andressa Santos'
    },
    {
      label: 'Deborah Franco',
      keepId: 31,  // (50 sessões)
      mergeIds: [18],
      finalName: 'Deborah Franco'
    },
    {
      label: 'Dina Makiyama + Maria Dinamar',
      keepId: 37,  // Dina Makiyama (16 sessões)
      mergeIds: [24, 34, 21],  // Dina dup (0) + Maria Dinamar (6 sessões) + Maria dup (0)
      finalName: 'Dina Makiyama'
    },
    {
      label: 'Equipe CKM Talents',
      keepId: 14,  // (130 sessões)
      mergeIds: [27],  // (66 sessões)
      finalName: 'Equipe CKM Talents'
    },
    {
      label: 'Giovanna Braga Schmitz',
      keepId: 30,  // (207 sessões)
      mergeIds: [17],
      finalName: 'Giovanna Braga Schmitz'
    },
    {
      label: 'Gislaine Fabiola Marques Righi Cassemiro',
      keepId: 36,  // (8 sessões)
      mergeIds: [23],
      finalName: 'Gislaine Fabiola Marques Righi Cassemiro'
    },
    {
      label: 'Luciana Pereira Figueiredo da Silva',
      keepId: 32,  // (286 sessões)
      mergeIds: [19],
      finalName: 'Luciana Pereira Figueiredo da Silva'
    },
    {
      label: 'Marcia Rocha + Marcia Rocha Fernandes',
      keepId: 29,  // Marcia Rocha (86 sessões)
      mergeIds: [38, 16, 25],  // Marcia Rocha Fernandes (42 sessões) + duplicatas sem sessões
      finalName: 'Marcia Rocha Fernandes'
    },
  ];
  
  let totalMoved = 0;
  let totalDeleted = 0;
  
  for (const u of unifications) {
    console.log(`\n--- ${u.label} ---`);
    console.log(`  Manter: id=${u.keepId}, Nome final: "${u.finalName}"`);
    
    for (const mergeId of u.mergeIds) {
      // Contar sessões que serão movidas
      const [[count]] = await conn.query(
        'SELECT COUNT(*) as total FROM mentoring_sessions WHERE consultorId = ?', [mergeId]
      );
      
      if (count.total > 0) {
        await conn.query(
          'UPDATE mentoring_sessions SET consultorId = ? WHERE consultorId = ?',
          [u.keepId, mergeId]
        );
        console.log(`  Movidas ${count.total} sessões de id=${mergeId} → id=${u.keepId}`);
        totalMoved += count.total;
      }
      
      // Deletar o registro duplicado
      await conn.query('DELETE FROM consultors WHERE id = ?', [mergeId]);
      console.log(`  Deletado id=${mergeId}`);
      totalDeleted++;
    }
    
    // Atualizar o nome final
    await conn.query('UPDATE consultors SET name = ? WHERE id = ?', [u.finalName, u.keepId]);
    console.log(`  Nome atualizado para: "${u.finalName}"`);
  }
  
  console.log(`\n\nTotal sessões movidas: ${totalMoved}`);
  console.log(`Total registros deletados: ${totalDeleted}`);
  
  // Verificação final
  console.log('\n=== VERIFICAÇÃO FINAL ===');
  const [remaining] = await conn.query('SELECT id, name, email FROM consultors ORDER BY name');
  console.log(`Total consultores: ${remaining.length}`);
  remaining.forEach(c => console.log(`  id=${c.id} | ${c.name} | ${c.email || '-'}`));
  
  // Sessões por consultor
  console.log('\nSessões por consultor:');
  let totalSessoes = 0;
  for (const c of remaining) {
    const [[count]] = await conn.query(
      'SELECT COUNT(*) as total FROM mentoring_sessions WHERE consultorId = ?', [c.id]
    );
    console.log(`  ${c.name}: ${count.total} sessões`);
    totalSessoes += count.total;
  }
  console.log(`Total sessões: ${totalSessoes}`);
  
  // Sessões órfãs
  const [[orphans]] = await conn.query(
    'SELECT COUNT(*) as total FROM mentoring_sessions ms LEFT JOIN consultors c ON ms.consultorId = c.id WHERE c.id IS NULL'
  );
  console.log(`Sessões órfãs (sem consultor válido): ${orphans.total}`);
  
  await conn.end();
  console.log('\nLimpeza concluída!');
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
