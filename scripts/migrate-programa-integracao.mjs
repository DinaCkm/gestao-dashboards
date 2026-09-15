import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const TABLES = [
  "programa_integracao_processos",
  "programa_integracao_respostas",
  "programa_integracao_config",
  "programa_integracao_auditoria",
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ausente; migração não executada.");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const placeholders = TABLES.map(() => "?").join(",");
    const [before] = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN (${placeholders}) ORDER BY TABLE_NAME`,
      TABLES,
    );
    const existing = before.map(row => row.TABLE_NAME);
    if (existing.length === TABLES.length) {
      console.log("[ProgramaIntegracao] As quatro tabelas já existem; nenhuma alteração executada.");
    } else if (existing.length > 0) {
      throw new Error(`Situação parcial detectada. Tabelas já existentes: ${existing.join(", ")}. Nenhuma nova tabela foi criada.`);
    } else {
      const sql = await fs.readFile(new URL("../drizzle/0100_programa_integracao.sql", import.meta.url), "utf8");
      const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);
      for (const statement of statements) await connection.query(statement);
      console.log(`[ProgramaIntegracao] Migração executada: ${statements.length} comandos aditivos.`);
    }

    const [after] = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN (${placeholders}) ORDER BY TABLE_NAME`,
      TABLES,
    );
    const afterNames = after.map(row => row.TABLE_NAME);
    if (afterNames.length !== TABLES.length) throw new Error(`Validação falhou: encontradas ${afterNames.length} de ${TABLES.length} tabelas.`);

    for (const table of TABLES) {
      const [rows] = await connection.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
      const total = Number(rows[0]?.total ?? -1);
      if (total !== 0) throw new Error(`Validação interrompida: ${table} contém ${total} registro(s).`);
      console.log(`[ProgramaIntegracao] ${table}: OK, 0 registros.`);
    }
    console.log("[ProgramaIntegracao] Validação concluída. Nenhuma tabela preexistente foi alterada por este script.");
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error("[ProgramaIntegracao] MIGRAÇÃO INTERROMPIDA:", error?.message || error);
  process.exit(1);
});
