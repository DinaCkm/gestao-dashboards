import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL + '&ssl={"rejectUnauthorized":true}');
  
  // Test the matching logic for Bruno Henrique Vila Verde (ID: 30056)
  // assessment_competencias has competenciaId 30034 = "Adaptabilidade Dinâmica"
  // student_performance has competenciaId 60003 = "Adaptabilidade Dinâmica - Visão de Futuro" with progressoTotal 0
  
  // Get assessment competencias
  const [assessComps] = await conn.execute(
    `SELECT ac.competenciaId, c.nome as compNome, ac.nivelAtual
     FROM assessment_competencias ac
     LEFT JOIN competencias c ON c.id = ac.competenciaId
     WHERE ac.assessmentPdiId = 60393`
  );
  
  // Get student_performance
  const [perfRecords] = await conn.execute(
    `SELECT competenciaId, competenciaName, progressoTotal
     FROM student_performance
     WHERE alunoId = 30056`
  );
  
  console.log('\n=== Matching Test for Bruno Henrique Vila Verde ===\n');
  
  // Build the same maps as the code
  const perfByCompName = new Map();
  const perfByFullName = new Map();
  
  for (const p of perfRecords) {
    if (p.competenciaName && p.progressoTotal !== null) {
      const baseName = p.competenciaName.split(' - ')[0].trim().toLowerCase();
      const existing = perfByCompName.get(baseName) || 0;
      if (p.progressoTotal > existing) {
        perfByCompName.set(baseName, p.progressoTotal);
      }
      const fullName = p.competenciaName.trim().toLowerCase();
      const existingFull = perfByFullName.get(fullName) || 0;
      if (p.progressoTotal > existingFull) {
        perfByFullName.set(fullName, p.progressoTotal);
      }
    }
  }
  
  console.log('perfByCompName (base names):');
  for (const [k, v] of perfByCompName.entries()) {
    console.log(`  "${k}" => ${v}%`);
  }
  
  console.log('\nMatching results:');
  let matched = 0;
  let unmatched = 0;
  
  for (const ac of assessComps) {
    const compNome = ac.compNome?.toLowerCase()?.trim() || '';
    let nivelAtualEfetivo = null;
    let matchMethod = 'none';
    
    // 2. By base name
    const perfByName = perfByCompName.get(compNome);
    if (perfByName !== undefined && perfByName > 0) {
      nivelAtualEfetivo = perfByName;
      matchMethod = 'baseName';
    }
    
    // 3. By partial name
    if (nivelAtualEfetivo === null && compNome) {
      for (const [fullName, progresso] of perfByFullName.entries()) {
        if (fullName.includes(compNome) || compNome.includes(fullName.split(' - ')[0].trim())) {
          if (progresso > 0) {
            nivelAtualEfetivo = progresso;
            matchMethod = 'partial';
            break;
          }
        }
      }
    }
    
    if (nivelAtualEfetivo !== null) {
      matched++;
      console.log(`  ✅ "${ac.compNome}" => ${nivelAtualEfetivo}% (via ${matchMethod})`);
    } else {
      unmatched++;
      // Check if there's a match with 0%
      const perfByName0 = perfByCompName.get(compNome);
      if (perfByName0 !== undefined) {
        console.log(`  ⚠️  "${ac.compNome}" => ${perfByName0}% (match found but 0%, showing as 0)`);
      } else {
        // Check partial match with 0
        let found = false;
        for (const [fullName, progresso] of perfByFullName.entries()) {
          if (fullName.includes(compNome) || compNome.includes(fullName.split(' - ')[0].trim())) {
            console.log(`  ⚠️  "${ac.compNome}" => ${progresso}% (partial match: "${fullName}", but 0%)`);
            found = true;
            break;
          }
        }
        if (!found) {
          console.log(`  ❌ "${ac.compNome}" => NO MATCH`);
        }
      }
    }
  }
  
  console.log(`\nSummary: ${matched} matched (>0%), ${unmatched} unmatched/zero`);
  
  // Also test for Bruno de Jesus Rodrigues (ID: 30080) - Trilha Básica
  console.log('\n\n=== Matching Test for Bruno de Jesus Rodrigues (Básica) ===\n');
  
  const [assessComps2] = await conn.execute(
    `SELECT ac.competenciaId, c.nome as compNome, ac.nivelAtual
     FROM assessment_competencias ac
     LEFT JOIN competencias c ON c.id = ac.competenciaId
     WHERE ac.assessmentPdiId = 60395`
  );
  
  const [perfRecords2] = await conn.execute(
    `SELECT competenciaId, competenciaName, progressoTotal
     FROM student_performance
     WHERE alunoId = 30080`
  );
  
  const perfByCompName2 = new Map();
  const perfByFullName2 = new Map();
  
  for (const p of perfRecords2) {
    if (p.competenciaName && p.progressoTotal !== null) {
      const baseName = p.competenciaName.split(' - ')[0].trim().toLowerCase();
      const existing = perfByCompName2.get(baseName) || 0;
      if (p.progressoTotal > existing) {
        perfByCompName2.set(baseName, p.progressoTotal);
      }
      const fullName = p.competenciaName.trim().toLowerCase();
      const existingFull = perfByFullName2.get(fullName) || 0;
      if (p.progressoTotal > existingFull) {
        perfByFullName2.set(fullName, p.progressoTotal);
      }
    }
  }
  
  console.log('perfByCompName2 (base names):');
  for (const [k, v] of perfByCompName2.entries()) {
    console.log(`  "${k}" => ${v}%`);
  }
  
  console.log('\nMatching results:');
  let matched2 = 0;
  let unmatched2 = 0;
  
  for (const ac of assessComps2) {
    const compNome = ac.compNome?.toLowerCase()?.trim() || '';
    let nivelAtualEfetivo = null;
    let matchMethod = 'none';
    
    const perfByName = perfByCompName2.get(compNome);
    if (perfByName !== undefined && perfByName > 0) {
      nivelAtualEfetivo = perfByName;
      matchMethod = 'baseName';
    }
    
    if (nivelAtualEfetivo === null && compNome) {
      for (const [fullName, progresso] of perfByFullName2.entries()) {
        if (fullName.includes(compNome) || compNome.includes(fullName.split(' - ')[0].trim())) {
          if (progresso > 0) {
            nivelAtualEfetivo = progresso;
            matchMethod = 'partial';
            break;
          }
        }
      }
    }
    
    if (nivelAtualEfetivo !== null) {
      matched2++;
      console.log(`  ✅ "${ac.compNome}" => ${nivelAtualEfetivo}% (via ${matchMethod})`);
    } else {
      unmatched2++;
      const perfByName0 = perfByCompName2.get(compNome);
      if (perfByName0 !== undefined) {
        console.log(`  ⚠️  "${ac.compNome}" => ${perfByName0}% (match found but 0%)`);
      } else {
        let found = false;
        for (const [fullName, progresso] of perfByFullName2.entries()) {
          if (fullName.includes(compNome) || compNome.includes(fullName.split(' - ')[0].trim())) {
            console.log(`  ⚠️  "${ac.compNome}" => ${progresso}% (partial match: "${fullName}", but 0%)`);
            found = true;
            break;
          }
        }
        if (!found) {
          console.log(`  ❌ "${ac.compNome}" => NO MATCH`);
        }
      }
    }
  }
  
  console.log(`\nSummary: ${matched2} matched (>0%), ${unmatched2} unmatched/zero`);
  
  await conn.end();
}

main().catch(console.error);
