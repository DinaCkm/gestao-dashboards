import { getDb } from './server/_core/db.js';

(async () => {
  try {
    const db = await getDb();
    if (!db) {
      console.log('❌ Conexão com banco falhou');
      process.exit(1);
    }
    
    // Verificar colunas da tabela alunos
    const result = await db.execute('SHOW COLUMNS FROM alunos');
    console.log('✅ Colunas da tabela alunos:');
    console.log(result);
    
    // Verificar especificamente por plataformaAulas
    const hasPlataforma = result.some(col => col.Field === 'plataformaAulas');
    if (hasPlataforma) {
      console.log('\n✅ COLUNA plataformaAulas EXISTE no banco');
      const plataformaCol = result.find(col => col.Field === 'plataformaAulas');
      console.log('Detalhes:', plataformaCol);
    } else {
      console.log('\n❌ COLUNA plataformaAulas NÃO EXISTE no banco');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
})();
