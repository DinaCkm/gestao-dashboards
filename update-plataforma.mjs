import { db } from './server/_core/db.ts';
import { alunos, programs } from './drizzle/schema.ts';
import { eq, inArray } from 'drizzle-orm';

async function updatePlataformaAulas() {
  try {
    console.log('Iniciando atualização de plataformaAulas...');
    
    // Buscar todos os alunos das empresas Scaffold
    const alunosAtualizados = await db
      .update(alunos)
      .set({ plataformaAulas: 'scaffold' })
      .where(
        // Usar subquery para encontrar alunos das empresas específicas
        inArray(alunos.programId, 
          db.select({ id: programs.id })
            .from(programs)
            .where(inArray(programs.name, ['SEBRAE TO', 'SEBRAE ACRE', 'EMBRAPII']))
        )
      );
    
    console.log('✅ Atualização concluída!');
    
    // Contar quantos foram atualizados
    const scaffold = await db.select().from(alunos).where(eq(alunos.plataformaAulas, 'scaffold'));
    const sistema = await db.select().from(alunos).where(eq(alunos.plataformaAulas, 'sistema_interno'));
    
    console.log(`Total com Scaffold: ${scaffold.length}`);
    console.log(`Total com Sistema Interno: ${sistema.length}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

updatePlataformaAulas();
