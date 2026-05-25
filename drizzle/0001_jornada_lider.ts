/**
 * MIGRATIONS DO DRIZZLE - JORNADA DO LÍDER
 */
import { sql } from "drizzle-orm";
import { mysqlTable, int, varchar, decimal, datetime, boolean, text, index } from "drizzle-orm/mysql-core";

export const jornadaLiderProgresso = mysqlTable(
  "jornada_lider_progresso",
  {
    id: int("id").primaryKey().autoincrement(),
    alunoId: int("aluno_id").notNull(),
    faseAtual: varchar("fase_atual", { length: 50 }).default("conexao"),
    percentualConclusao: int("percentual_conclusao").default(0),
    dataInicio: datetime("data_inicio").default(sql`CURRENT_TIMESTAMP`),
    dataUltimaAtualizacao: datetime("data_ultima_atualizacao").default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  }
);
// ... (O restante do código está no arquivo anexo)
