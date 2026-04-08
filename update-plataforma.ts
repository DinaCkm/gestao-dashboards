import { db } from './server/_core/db';
import { alunos, programs } from './drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

async function updatePlataformaAulas() {
  try {
    console.log('🔄 Iniciando atualização de plataformaAulas...');
    
    // Primeiro, buscar os IDs das empresas Scaffold
    const empresasScaffold = await db
      .select({ id: programs.id, name: programs.name })
      .from(programs)
      .where(inArray(programs.name, ['SEBRAE TO', 'SEBRAE ACRE', 'EMBRAPII']));
    
    console.log(`📍 Empresas encontradas: ${empresasScaffold.map(e => e.name).join(', ')}`);
    
    const programIds = empresasScaffold.map(e => e.id);
    
    // Atualizar todos os alunos dessas empresas
    const result = await db
      .update(alunos)
      .set({ plataformaAulas: 'scaffold' })
      .where(inArray(alunos.programId, programIds));
    
    console.log('✅ Atualização concluída!');
    
    // Contar quantos foram atualizados
    const scaffold = await db
      .select()
      .from(alunos)
      .where(eq(alunos.plataformaAulas, 'scaffold'));
    
    const sistema = await db
      .select()
      .from(alunos)
      .where(eq(alunos.plataformaAulas, 'sistema_interno'));
    
    console.log(`\n📊 Resultado final:`);
    console.log(`   • Alunos com Scaffold: ${scaffold.length}`);
    console.log(`   • Alunos com Sistema Interno: ${sistema.length}`);
    console.log(`   • Total: ${scaffold.length + sistema.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

updatePlataformaAulas();
