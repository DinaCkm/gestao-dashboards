import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const jpTrilhaId = 60001;

// Buscar competências da JP com IDs atualizados
const [jpComps] = await conn.query(`SELECT id, nome FROM competencias WHERE trilhaId = ?`, [jpTrilhaId]);
const compMap = {};
for (const c of jpComps) {
  compMap[c.nome.toLowerCase()] = c.id;
}
console.log(`Competências na JP: ${jpComps.length}`);

// Buscar turmaId da JP
const [turmaJP] = await conn.query(`SELECT id FROM turmas WHERE name LIKE '%Jornada Personalizada%'`);
const turmaJPId = turmaJP[0].id;

// Buscar alunos
const [alunosAll] = await conn.query(`SELECT id, externalId, consultorId FROM alunos`);
const alunoMap = {};
for (const a of alunosAll) {
  if (a.externalId) alunoMap[String(a.externalId)] = a;
}

// Registros faltantes: Gestão de Conflitos (Brenno, Diego), Mentalidade Sistêmica (Carolina), Relacionamentos Conectivos (Etienne)
const faltantes = [
  { id_usuario: '651877', nome: 'Brenno Soffredi Passoni', competencia: 'Gestão de Conflitos', tipo: 'Opcional' },
  { id_usuario: '651879', nome: 'Diego Renyer De Miranda Araújo', competencia: 'Gestão de Conflitos', tipo: 'Opcional' },
  { id_usuario: '651878', nome: 'Carolina Borges Moreira', competencia: 'Mentalidade Sistêmica', tipo: 'Opcional' },
  { id_usuario: '651880', nome: 'Etienne Lopes Ribeiro De Arruda', competencia: 'Relacionamentos Conectivos', tipo: 'Opcional' },
];

let imported = 0;
for (const rec of faltantes) {
  const aluno = alunoMap[rec.id_usuario];
  if (!aluno) {
    console.log(`AVISO: Aluno ${rec.nome} (${rec.id_usuario}) não encontrado`);
    continue;
  }

  const compId = compMap[rec.competencia.toLowerCase()];
  if (!compId) {
    console.log(`AVISO: Competência "${rec.competencia}" não encontrada na JP`);
    continue;
  }

  // Buscar PDI existente
  const [existingPdi] = await conn.query(`
    SELECT id FROM assessment_pdi WHERE alunoId = ? AND trilhaId = ? AND turmaId = ?
  `, [aluno.id, jpTrilhaId, turmaJPId]);

  let pdiId;
  if (existingPdi.length > 0) {
    pdiId = existingPdi[0].id;
  } else {
    console.log(`AVISO: PDI não encontrado para ${rec.nome} na JP`);
    continue;
  }

  // Verificar se já existe
  const [existing] = await conn.query(`
    SELECT id FROM assessment_competencias WHERE assessmentPdiId = ? AND competenciaId = ?
  `, [pdiId, compId]);

  if (existing.length === 0) {
    const peso = rec.tipo === 'Obrigatória' ? 'obrigatoria' : 'opcional';
    // Buscar datas do micro ciclo da planilha original
    const planilha = JSON.parse(readFileSync('/home/ubuntu/planilha_parsed.json', 'utf8'));
    const planRec = planilha.find(r => 
      String(r.id_usuario) === rec.id_usuario && 
      r.competencia === rec.competencia &&
      r.trilha && r.trilha.toLowerCase().includes('jornada personalizada')
    );
    const microInicio = planRec?.micro_inicio || null;
    const microTermino = planRec?.micro_fim || null;

    await conn.query(`
      INSERT INTO assessment_competencias (assessmentPdiId, competenciaId, peso, microInicio, microTermino)
      VALUES (?, ?, ?, ?, ?)
    `, [pdiId, compId, peso, microInicio, microTermino]);
    imported++;
    console.log(`OK: ${rec.nome} → ${rec.competencia} (${peso}, micro: ${microInicio} → ${microTermino})`);
  } else {
    console.log(`Já existe: ${rec.nome} → ${rec.competencia}`);
  }
}

console.log(`\nTotal importados: ${imported}`);

// Verificação final
const [finalComp] = await conn.query(`SELECT COUNT(*) as total FROM assessment_competencias`);
console.log(`Total competências no banco: ${finalComp[0].total}`);

await conn.end();
