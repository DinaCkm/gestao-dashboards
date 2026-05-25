import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { cursosCompetencias, atividadesCurso, avaliacoesAtividade } from "../drizzle/schema";

async function debug() {
  const db = await getDb();
  if (!db) {
    console.error("Banco não disponível");
    return;
  }

  try {
    console.log("=== BUSCANDO CURSO 'Mentalidade Sistêmica' ===");
    const courses = await db
      .select()
      .from(cursosCompetencias)
      .where((t) => t.titulo.like("%Mentalidade%"))
      .limit(10);

    if (courses.length === 0) {
      console.log("❌ Nenhum curso encontrado");
      return;
    }

    console.log(`✓ Encontrado:`, courses[0]);
    const cursoId = courses[0].id;

    console.log(`\n=== BUSCANDO ATIVIDADES DO CURSO ${cursoId} ===`);
    const activities = await db
      .select()
      .from(atividadesCurso)
      .where(eq(atividadesCurso.cursoId, cursoId));

    if (activities.length === 0) {
      console.log("❌ Nenhuma atividade encontrada");
      return;
    }

    console.log(`✓ Encontradas ${activities.length} atividades:`);
    activities.forEach((a) => console.log(`  - ID ${a.id}: ${a.titulo} (ativo: ${a.isActive})`));

    const atividadeId = activities[0].id;
    console.log(`\n=== ANALISANDO ATIVIDADE ${atividadeId} ===\n`);

    // SQL 1
    console.log("--- SQL 1: Atividade existe? ---");
    const atividade = await db
      .select()
      .from(atividadesCurso)
      .where(eq(atividadesCurso.id, atividadeId))
      .limit(1);
    console.log(JSON.stringify(atividade, null, 2));

    // SQL 3
    console.log("\n--- SQL 3: Avaliação existe? ---");
    const avaliacoes = await db
      .select()
      .from(avaliacoesAtividade)
      .where(eq(avaliacoesAtividade.atividadeId, atividadeId));
    console.log(JSON.stringify(avaliacoes, null, 2));

    // SQL 9 - Simular o LEFT JOIN como a procedure faz
    console.log("\n--- SQL 9: LEFT JOIN (como a procedure faz) ---");
    const [resultado] = await db
      .select({
        atividade: atividadesCurso,
        avaliacoes: avaliacoesAtividade,
      })
      .from(atividadesCurso)
      .leftJoin(avaliacoesAtividade, eq(atividadesCurso.id, avaliacoesAtividade.atividadeId))
      .where(eq(atividadesCurso.id, atividadeId))
      .limit(1);

    console.log(JSON.stringify(resultado, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

debug();
