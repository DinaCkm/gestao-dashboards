import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const TABLE = "programa_integracao_processos";
const COLUMN = "anjoUserId";
const INDEX = "idx_pi_processos_anjo_user";
const APPLY = process.env.PROGRAMA_INTEGRACAO_ANJO_APPLY === "YES";

async function inspect(connection) {
  const [tables] = await connection.execute(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?`,
    [TABLE],
  );
  if (Number(tables[0]?.total || 0) !== 1) {
    throw new Error(`Tabela ${TABLE} não encontrada. Nenhuma alteração executada.`);
  }

  const [columns] = await connection.execute(
    `SELECT COLUMN_NAME,DATA_TYPE,IS_NULLABLE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?`,
    [TABLE, COLUMN],
  );
  const [indexes] = await connection.execute(
    `SELECT INDEX_NAME,COLUMN_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND INDEX_NAME=?`,
    [TABLE, INDEX],
  );
  const [rows] = await connection.query(`SELECT COUNT(*) AS total FROM \`${TABLE}\``);

  return {
    column: columns[0] || null,
    index: indexes[0] || null,
    totalProcessos: Number(rows[0]?.total ?? -1),
  };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL ausente; migração não executada.");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const before = await inspect(connection);
    console.log("[ProgramaIntegracaoAnjo] Verificação inicial:", JSON.stringify(before));

    const hasColumn = Boolean(before.column);
    const hasIndex = Boolean(before.index);

    if (hasColumn && hasIndex) {
      console.log("[ProgramaIntegracaoAnjo] Coluna e índice já existem; nenhuma alteração executada.");
      return;
    }

    if (hasColumn !== hasIndex) {
      throw new Error(
        `Situação parcial detectada (coluna=${hasColumn}, índice=${hasIndex}). Nenhuma alteração executada. Revisão manual obrigatória.`,
      );
    }

    if (!APPLY) {
      console.log(
        "[ProgramaIntegracaoAnjo] DRY-RUN: estrutura pronta para receber a migration 0101. " +
        "Nenhuma alteração foi executada. Para aplicar conscientemente, defina PROGRAMA_INTEGRACAO_ANJO_APPLY=YES.",
      );
      return;
    }

    const sql = await fs.readFile(
      new URL("../drizzle/0101_programa_integracao_anjo_user.sql", import.meta.url),
      "utf8",
    );
    const statements = sql
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    if (statements.length !== 2) {
      throw new Error(`Esperados exatamente 2 comandos aditivos em 0101; encontrados ${statements.length}. Nada será aplicado.`);
    }

    for (const statement of statements) {
      await connection.query(statement);
    }

    const after = await inspect(connection);
    if (!after.column || !after.index) {
      throw new Error("Validação pós-migration falhou: coluna ou índice não foram encontrados.");
    }
    if (after.column.DATA_TYPE !== "int" || after.column.IS_NULLABLE !== "YES") {
      throw new Error(
        `Validação pós-migration falhou: ${COLUMN} deveria ser INT NULL; encontrado ${after.column.DATA_TYPE} nullable=${after.column.IS_NULLABLE}.`,
      );
    }
    if (after.totalProcessos !== before.totalProcessos) {
      throw new Error(
        `Validação pós-migration falhou: quantidade de processos mudou de ${before.totalProcessos} para ${after.totalProcessos}.`,
      );
    }

    const [linkedRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM \`${TABLE}\` WHERE \`${COLUMN}\` IS NOT NULL`,
    );
    const linked = Number(linkedRows[0]?.total ?? -1);
    if (linked !== 0) {
      throw new Error(
        `Validação pós-migration falhou: ${linked} processo(s) histórico(s) receberam vínculo inesperado.`,
      );
    }

    console.log(
      `[ProgramaIntegracaoAnjo] Migration 0101 aplicada e validada. ${before.totalProcessos} processo(s) preservado(s); 0 vínculo(s) criado(s) automaticamente.`,
    );
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("[ProgramaIntegracaoAnjo] MIGRAÇÃO INTERROMPIDA:", error?.message || error);
  process.exit(1);
});
