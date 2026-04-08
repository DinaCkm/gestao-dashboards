import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// O grupo de duplicatas identificado:
// ID 30014 (mantido) - "2025/19 - Aula 01 – Estrutura e Conceitos..."
// ID 30024 (duplicata) - "2025/19 - Aula 01 –Estrutura e Conceitos..."
// ID 30025 (duplicata) - "2025/19 - Estrutura e Conceitos..."
// ID 30032 (duplicata) - "2025/19 - Aula 01 - Estrutura e Conceitos..."

const KEPT_ID = 30014;
const DUPLICATE_IDS = [30024, 30025, 30032];

console.log('=== CORREÇÃO DE DUPLICATAS DE EVENTOS ===');
console.log(`ID mantido: ${KEPT_ID}`);
console.log(`IDs duplicados a unificar: ${DUPLICATE_IDS.join(', ')}`);

// PASSO 1: Verificar participações atuais
const [keptParts] = await conn.query(
  'SELECT alunoId, status FROM event_participation WHERE eventId = ?', [KEPT_ID]
);
console.log(`\nParticipações no ID ${KEPT_ID} (mantido): ${keptParts.length}`);

const keptAlunoIds = new Set(keptParts.map(p => p.alunoId));

// PASSO 2: Para cada duplicata, mover participações que NÃO existem no ID mantido
let totalMoved = 0;
let totalSkipped = 0;

for (const dupId of DUPLICATE_IDS) {
  const [dupParts] = await conn.query(
    'SELECT id, alunoId, status, batchId FROM event_participation WHERE eventId = ?', [dupId]
  );
  console.log(`\nProcessando ID ${dupId}: ${dupParts.length} participações`);
  
  for (const part of dupParts) {
    if (keptAlunoIds.has(part.alunoId)) {
      // Aluno já tem participação no ID mantido - apenas deletar a duplicata
      console.log(`  Aluno ${part.alunoId}: já tem presença no ${KEPT_ID}, deletando duplicata`);
      await conn.query('DELETE FROM event_participation WHERE id = ?', [part.id]);
      totalSkipped++;
    } else {
      // Aluno NÃO tem participação no ID mantido - mover para o ID mantido
      console.log(`  Aluno ${part.alunoId}: movendo presença de ${dupId} para ${KEPT_ID}`);
      await conn.query(
        'UPDATE event_participation SET eventId = ? WHERE id = ?', [KEPT_ID, part.id]
      );
      keptAlunoIds.add(part.alunoId); // Marcar como já existente
      totalMoved++;
    }
  }
}

console.log(`\n=== RESULTADO ===`);
console.log(`Participações movidas para ID ${KEPT_ID}: ${totalMoved}`);
console.log(`Participações duplicadas deletadas: ${totalSkipped}`);

// PASSO 3: Deletar os eventos duplicados da tabela events
console.log(`\nDeletando eventos duplicados...`);
for (const dupId of DUPLICATE_IDS) {
  // Verificar se ainda há participações pendentes
  const [remaining] = await conn.query(
    'SELECT COUNT(*) as cnt FROM event_participation WHERE eventId = ?', [dupId]
  );
  if (remaining[0].cnt > 0) {
    console.log(`  AVISO: ID ${dupId} ainda tem ${remaining[0].cnt} participações! Não deletando.`);
  } else {
    await conn.query('DELETE FROM events WHERE id = ?', [dupId]);
    console.log(`  Evento ID ${dupId} deletado.`);
  }
}

// PASSO 4: Verificar resultado final
const [finalParts] = await conn.query(
  'SELECT COUNT(*) as cnt FROM event_participation WHERE eventId = ?', [KEPT_ID]
);
const [finalEvents] = await conn.query('SELECT COUNT(*) as cnt FROM events');
console.log(`\n=== VERIFICAÇÃO FINAL ===`);
console.log(`Participações no ID ${KEPT_ID}: ${finalParts[0].cnt}`);
console.log(`Total de eventos na tabela: ${finalEvents[0].cnt}`);

await conn.end();
