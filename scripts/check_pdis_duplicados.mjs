import { createConnection } from 'mysql2/promise';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('DATABASE_URL não definida');
  process.exit(1);
}

const conn = await createConnection(DB_URL);

const [rows] = await conn.execute(`
  SELECT 
    ap.alunoId,
    a.name,
    a.programId,
    COUNT(*) as qtd_pdis_ativos,
    GROUP_CONCAT(ap.id ORDER BY ap.macroInicio SEPARATOR ', ') as pdi_ids,
    GROUP_CONCAT(DATE(ap.macroInicio) ORDER BY ap.macroInicio SEPARATOR ' | ') as inicios,
    GROUP_CONCAT(DATE(ap.macroTermino) ORDER BY ap.macroInicio SEPARATOR ' | ') as terminos,
    (SELECT COUNT(*) FROM auditoria_resets_ciclo arc WHERE arc.alunoId = ap.alunoId) as qtd_resets
  FROM assessment_pdi ap
  JOIN alunos a ON a.id = ap.alunoId
  WHERE ap.status = 'ativo'
  GROUP BY ap.alunoId, a.name, a.programId
  HAVING COUNT(*) > 1
  ORDER BY a.name
`);

console.log(`\nAlunos com DOIS PDIs ativos simultaneamente: ${rows.length}\n`);
console.log('Nome | PDI IDs | Inícios | Términos | Qtd Resets');
console.log('-'.repeat(100));
for (const r of rows) {
  console.log(`${r.name} | PDIs: ${r.pdi_ids} | ${r.inicios} | ${r.terminos} | Resets: ${r.qtd_resets}`);
}

await conn.end();
