import { db } from './db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS relatorio_mentorias_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        data_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        tipo ENUM('previa', 'definitivo', 'manual') NOT NULL,
        periodo_inicio DATE NOT NULL,
        periodo_fim DATE NOT NULL,
        destinatarios JSON NOT NULL,
        total_sessoes INT NOT NULL,
        total_valor DECIMAL(10,2) NOT NULL,
        enviado_por VARCHAR(255) NULL
      );
    `);
    console.log('Tabela relatorio_mentorias_log criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
  }
  process.exit(0);
}

main();
