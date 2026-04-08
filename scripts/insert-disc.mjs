import { createConnection } from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
console.log('Connecting to database...');

const connection = await createConnection(dbUrl);

// 1. Find Adelice Novak
const [adeliceRows] = await connection.execute(
  "SELECT id, name, email FROM alunos WHERE name LIKE '%Adelice%' OR name LIKE '%Novak%'"
);
console.log('Adelice results:', adeliceRows);

// 2. Find Ana Flávia Mendes Borges
const [anaRows] = await connection.execute(
  "SELECT id, name, email FROM alunos WHERE name LIKE '%Ana Fl%' OR name LIKE '%Borges%'"
);
console.log('Ana Flávia results:', anaRows);

// 3. Check existing DISC records
const allIds = [...adeliceRows.map(r => r.id), ...anaRows.map(r => r.id)];
if (allIds.length > 0) {
  const [existing] = await connection.execute(
    `SELECT alunoId, scoreD, scoreI, scoreS, scoreC FROM disc_resultados WHERE alunoId IN (${allIds.join(',')})`
  );
  console.log('Existing DISC records:', existing);
}

// Insert DISC data for Adelice if found and no existing record
if (adeliceRows.length > 0) {
  const adeliceId = adeliceRows[0].id;
  const [existCheck] = await connection.execute(
    'SELECT id FROM disc_resultados WHERE alunoId = ?', [adeliceId]
  );
  if (existCheck.length === 0) {
    // Adelice: D=50, I=45, S=67, C=48 (Estrutural), predominante=S, secundário=D
    await connection.execute(
      `INSERT INTO disc_resultados (alunoId, ciclo, scoreD, scoreI, scoreS, scoreC, perfilPredominante, perfilSecundario, metodoCalculo, completedAt)
       VALUES (?, 1, 50, 45, 67, 48, 'S', 'D', 'etalent', NOW())`,
      [adeliceId]
    );
    console.log(`Inserted DISC for Adelice (id=${adeliceId}): D=50, I=45, S=67, C=48`);
  } else {
    console.log(`DISC already exists for Adelice (id=${adeliceId})`);
  }
}

// Insert DISC data for Ana Flávia if found and no existing record
if (anaRows.length > 0) {
  const anaId = anaRows[0].id;
  const [existCheck] = await connection.execute(
    'SELECT id FROM disc_resultados WHERE alunoId = ?', [anaId]
  );
  if (existCheck.length === 0) {
    // Ana Flávia: D=39, I=87, S=67, C=53 (Estrutural), predominante=I, secundário=S
    await connection.execute(
      `INSERT INTO disc_resultados (alunoId, ciclo, scoreD, scoreI, scoreS, scoreC, perfilPredominante, perfilSecundario, metodoCalculo, completedAt)
       VALUES (?, 1, 39, 87, 67, 53, 'I', 'S', 'etalent', NOW())`,
      [anaId]
    );
    console.log(`Inserted DISC for Ana Flávia (id=${anaId}): D=39, I=87, S=67, C=53`);
  } else {
    console.log(`DISC already exists for Ana Flávia (id=${anaId})`);
  }
}

await connection.end();
console.log('Done!');
