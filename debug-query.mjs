import { getDb } from './server/_core/db.mjs';

async function testQuery() {
  const db = await getDb();
  if (!db) {
    console.log('❌ Database connection failed');
    return;
  }

  console.log('✅ Database connected');

  try {
    // Test 1: Count assessment_pdi
    console.log('\n📊 Test 1: Count assessment_pdi');
    const countResult = await db.execute('SELECT COUNT(*) as count FROM assessment_pdi');
    console.log('Count:', countResult);

    // Test 2: Count turmas
    console.log('\n📊 Test 2: Count turmas');
    const turmasCount = await db.execute('SELECT COUNT(*) as count FROM turmas');
    console.log('Count:', turmasCount);

    // Test 3: Count programs
    console.log('\n📊 Test 3: Count programs');
    const programsCount = await db.execute('SELECT COUNT(*) as count FROM programs');
    console.log('Count:', programsCount);

    // Test 4: Run the actual query
    console.log('\n📊 Test 4: Run porTurmaGeral query');
    const jornadas = await db.execute(`
      SELECT 
        ap.id,
        ap.turmaId,
        t.name as turmaNome,
        ap.trilhaId,
        tr.name as trilhaNome,
        p.name as empresaNome,
        ap.macroInicio,
        ap.macroTermino,
        ap.status
      FROM assessment_pdi ap
      LEFT JOIN turmas t ON ap.turmaId = t.id
      LEFT JOIN programs p ON t.programId = p.id
      LEFT JOIN trilhas tr ON ap.trilhaId = tr.id
      ORDER BY p.name, t.name, ap.macroInicio
      LIMIT 10
    `);
    console.log('Results:', JSON.stringify(jornadas, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

testQuery();
