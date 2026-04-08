import { drizzle } from "drizzle-orm/mysql2/http";
import { eq, sql } from "drizzle-orm";

// Configurar conexão com banco
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada!");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

// Importar schema
import("./drizzle/schema.ts").then(async (schema) => {
  const { assessmentPdi, assessmentCompetencias, turmas, trilhas, alunos, programs } = schema;

  console.log("\n📊 DIAGNÓSTICO DE JORNADAS\n");
  console.log("=" .repeat(60));

  try {
    // 1. Contar PDIs por status
    console.log("\n1️⃣ PDIs por Status:");
    const pdisByStatus = await db
      .select({
        status: assessmentPdi.status,
        total: sql`COUNT(*) as total`,
      })
      .from(assessmentPdi)
      .groupBy(assessmentPdi.status);
    
    console.table(pdisByStatus);

    // 2. Total de PDIs
    const totalPdis = await db.select({ count: sql`COUNT(*) as count` }).from(assessmentPdi);
    console.log(`\n📌 Total de PDIs: ${totalPdis[0]?.count || 0}`);

    // 3. PDIs ativos
    const activePdis = await db
      .select()
      .from(assessmentPdi)
      .where(eq(assessmentPdi.status, "ativo"));
    
    console.log(`\n✅ PDIs com status 'ativo': ${activePdis.length}`);

    if (activePdis.length > 0) {
      console.log("\n   Primeiros 3 PDIs ativos:");
      activePdis.slice(0, 3).forEach((pdi, idx) => {
        console.log(`   ${idx + 1}. ID: ${pdi.id}, Aluno: ${pdi.alunoId}, Turma: ${pdi.turmaId}, Trilha: ${pdi.trilhaId}`);
        console.log(`      Período: ${pdi.macroInicio} → ${pdi.macroTermino}`);
      });
    }

    // 4. Competências vinculadas aos PDIs ativos
    if (activePdis.length > 0) {
      const pdiIds = activePdis.map(p => p.id);
      const competenciasCount = await db
        .select({ count: sql`COUNT(*) as count` })
        .from(assessmentCompetencias)
        .where(sql`${assessmentCompetencias.assessmentPdiId} IN (${sql.join(pdiIds.map(id => sql`${id}`), sql`, `)})`);
      
      console.log(`\n📚 Competências vinculadas aos PDIs ativos: ${competenciasCount[0]?.count || 0}`);
    }

    // 5. Turmas com PDIs
    const turmasComPdis = await db
      .select({
        turmaId: assessmentPdi.turmaId,
        turmaNome: turmas.name,
        totalPdis: sql`COUNT(*) as total`,
      })
      .from(assessmentPdi)
      .leftJoin(turmas, eq(assessmentPdi.turmaId, turmas.id))
      .where(eq(assessmentPdi.status, "ativo"))
      .groupBy(assessmentPdi.turmaId);

    console.log(`\n🎓 Turmas com PDIs ativos: ${turmasComPdis.length}`);
    if (turmasComPdis.length > 0) {
      console.table(turmasComPdis);
    }

    // 6. Teste da função getJornadasPorTurma
    console.log("\n🧪 Teste da função getJornadasPorTurma:");
    console.log("   (Simulando o que a função faz)");

    const testPdis = await db
      .select({
        id: assessmentPdi.id,
        alunoId: assessmentPdi.alunoId,
        turmaId: assessmentPdi.turmaId,
        trilhaId: assessmentPdi.trilhaId,
        macroInicio: assessmentPdi.macroInicio,
        macroTermino: assessmentPdi.macroTermino,
        status: assessmentPdi.status,
      })
      .from(assessmentPdi)
      .where(eq(assessmentPdi.status, "ativo"));

    console.log(`   PDIs encontrados com status 'ativo': ${testPdis.length}`);

    if (testPdis.length === 0) {
      console.log("\n   ⚠️  PROBLEMA IDENTIFICADO:");
      console.log("   - Não há PDIs com status 'ativo'");
      console.log("   - A função retorna array vazio []");
      console.log("   - O gráfico não aparece no dashboard");
    } else {
      console.log(`\n   ✅ Há ${testPdis.length} PDIs ativos para exibir no gráfico`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ Diagnóstico concluído!\n");

  } catch (error) {
    console.error("❌ Erro durante diagnóstico:", error);
    process.exit(1);
  }
}).catch(err => {
  console.error("❌ Erro ao importar schema:", err);
  process.exit(1);
});
