import { createConnection } from 'mysql2/promise';

// Mapeamento: alunoId no banco -> consultorId mais recente (baseado na planilha)
const alunoMentorMap: Record<number, number> = {
  30100: 32, // Alexandre Crepory Abbott de Oliveira -> Luciana Pereira Figueiredo da Silva
  30034: 28, // Allan Kassio De Oliveira Santos Ribeiro -> Ana Carolina Cardoso Viana Rocha
  30035: 28, // Brenno Soffredi Passoni -> Ana Carolina Cardoso Viana Rocha
  30036: 28, // Carolina Borges Moreira -> Ana Carolina Cardoso Viana Rocha
  30037: 28, // Diego Renyer de Miranda Araújo -> Ana Carolina Cardoso Viana Rocha
  30038: 28, // Etienne Lopes Ribeiro de Arruda -> Ana Carolina Cardoso Viana Rocha
  30039: 28, // Fabio Maya Cavalcante -> Ana Carolina Cardoso Viana Rocha
  30040: 28, // Flavia Pereira Balieiro Salgado -> Ana Carolina Cardoso Viana Rocha
  30041: 35, // Ilda Bisinotti -> Andressa Santos
  30042: 35, // Ingrid de Sousa Pereira -> Andressa Santos
  30043: 28, // Luan Saldanha Oliveira -> Ana Carolina Cardoso Viana Rocha
  30044: 28, // Luciano Cunha de Sousa -> Ana Carolina Cardoso Viana Rocha
  30090: 39, // Mayara Rodrigues de Freitas -> Adriana Deus
  30046: 28, // Paulo Borges -> Ana Carolina Cardoso Viana Rocha
  30045: 28, // Thiago Bizerra Fideles -> Ana Carolina Cardoso Viana Rocha
  30099: 39, // Vanessa Bertholdo Vargas -> Adriana Deus
};

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL!);
  
  let updated = 0;
  let errors = 0;
  
  for (const [alunoId, consultorId] of Object.entries(alunoMentorMap)) {
    try {
      const [result] = await conn.execute(
        'UPDATE alunos SET consultorId = ? WHERE id = ?',
        [consultorId, parseInt(alunoId)]
      ) as any;
      
      if (result.affectedRows > 0) {
        updated++;
        console.log(`✅ Aluno ${alunoId} -> Consultor ${consultorId} (atualizado)`);
      } else {
        console.log(`⚠️ Aluno ${alunoId} não encontrado no banco`);
      }
    } catch (e: any) {
      errors++;
      console.error(`❌ Erro ao atualizar aluno ${alunoId}: ${e.message}`);
    }
  }
  
  console.log(`\n=== RESULTADO ===`);
  console.log(`Atualizados: ${updated}/${Object.keys(alunoMentorMap).length}`);
  console.log(`Erros: ${errors}`);
  
  // Verificar resultado
  const [alunos] = await conn.execute(`
    SELECT a.id, a.name, a.consultorId, c.name as consultorName
    FROM alunos a
    LEFT JOIN consultors c ON a.consultorId = c.id
    LEFT JOIN programs p ON a.programId = p.id
    WHERE p.name LIKE '%EMBRAPII%' OR p.name LIKE '%Embrapii%'
    ORDER BY a.name
  `) as any;
  
  console.log(`\n=== VERIFICAÇÃO ===`);
  for (const a of alunos) {
    const status = a.consultorId ? '✅' : '❌';
    console.log(`${status} ${a.name} -> ${a.consultorName || 'SEM MENTOR'} (consultorId: ${a.consultorId})`);
  }
  
  await conn.end();
}

main().catch(e => console.error(e.message));
