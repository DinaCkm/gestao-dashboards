import { gzipSync, gunzipSync } from 'zlib';

const QUESTION_INDEX_MAPS = {
  bem: {
    5: 'bem_gestor', 6: 'bem_unidade', 7: 'bem_colaborador', 8: 'bem_data_inicio', 9: 'bem_funcao',
    10: 'bem_anjo', 11: 'bem_caracteristicas', 12: 'bem_conhecimentos_tecnicos',
    13: 'bem_documentos_treinamentos', 14: 'bem_treinamentos_uc', 15: 'bem_primeiros_15_dias', 16: 'bem_primeiros_60_dias',
  },
};

function convertLegacyAnswers(c, formKey) {
  const indexMap = QUESTION_INDEX_MAPS[formKey] || {};
  const answers = {};
  if (Array.isArray(c)) for (const [idx, valor] of c) answers[indexMap[parseInt(idx)] || `field_${idx}`] = valor;
  return answers;
}

function validateAndConvert(importData) {
  if (typeof importData.processos !== 'object' || !importData.processos) throw new Error('processos must be object');
  const results = { processosImportados: 0, processosIgnorados: 0, respostasImportadas: 0 };
  const ordemMap = new Map((importData.config?.ordem || []).map((id, idx) => [id, idx]));
  for (const [legacyId, processo] of Object.entries(importData.processos)) {
    if (!processo.nome || !processo.inicio) { results.processosIgnorados++; continue; }
    results.processosImportados++;
    if (Array.isArray(processo.resp)) {
      const formKey = processo.form || 'bem';
      for (const r of processo.resp) if (r.rid) results.respostasImportadas++;
    }
  }
  return results;
}

function testGzipRoundtrip() {
  try {
    const testData = { test: 'data', value: 123 };
    const jsonStr = JSON.stringify(testData);
    const compressed = gzipSync(jsonStr);
    const decompressed = gunzipSync(compressed).toString('utf-8');
    const result = JSON.parse(decompressed);
    return result.test === 'data' && result.value === 123;
  } catch (e) {
    console.error('gzip test error:', e.message);
    return false;
  }
}

const testCases = [
  {
    name: '4 válidos + 1 vazio, 2 resp cada = 4/1/8',
    data: {
      config: { ordem: ['l1', 'l2', 'l3', 'l4', 'lempty'] },
      processos: {
        l1: { nome: 'P1', inicio: '2026-01-15', form: 'bem', resp: [{ rid: 'r1a', c: [[14, 'T']] }, { rid: 'r1b', c: [[15, 'T']] }] },
        l2: { nome: 'P2', inicio: '2026-02-01', form: 'bem', resp: [{ rid: 'r2a', c: [[16, 'T']] }, { rid: 'r2b', c: [[14, 'T']] }] },
        l3: { nome: 'P3', inicio: '2026-03-01', form: 'bem', resp: [{ rid: 'r3a', c: [[15, 'T']] }, { rid: 'r3b', c: [[13, 'T']] }] },
        l4: { nome: 'P4', inicio: '2026-04-01', form: 'bem', resp: [{ rid: 'r4a', c: [[12, 'T']] }, { rid: 'r4b', c: [[14, 'T']] }] },
        lempty: { nome: '', inicio: '', resp: [] },
      },
    },
    expected: { processosImportados: 4, processosIgnorados: 1, respostasImportadas: 8 },
  },
  {
    name: 'Ordem derivada e filtrada, config SOMENTE ordem',
    data: {
      config: { ordem: ['la', 'lb', 'invalid'], formConfig: 'drop', linksPublicos: 'drop' },
      processos: {
        la: { nome: 'A', inicio: '2026-01-01', resp: [{ rid: 'ra', c: [[14, 'T']] }] },
        lb: { nome: 'B', inicio: '2026-01-02', resp: [{ rid: 'rb', c: [[15, 'T']] }] },
      },
    },
    expected: { processosImportados: 2, processosIgnorados: 0, respostasImportadas: 2 },
  },
  {
    name: 'bem_treinamentos_uc 14, bem_primeiros_15_dias 15, bem_primeiros_60_dias 16',
    data: {
      processos: {
        ltest: {
          nome: 'Teste', inicio: '2026-05-01',
          resp: [
            { rid: 'r14', c: [[14, 'val14']] },
            { rid: 'r15', c: [[15, 'val15']] },
            { rid: 'r16', c: [[16, 'val16']] },
          ],
        },
      },
    },
    expected: { processosImportados: 1, processosIgnorados: 0, respostasImportadas: 3 },
  },
];

console.log('=== Dry-Run Test (Realista) ===\n');
let passed = 0, failed = 0;

for (const test of testCases) {
  try {
    const result = validateAndConvert(test.data);
    const ok = result.processosImportados === test.expected.processosImportados &&
              result.processosIgnorados === test.expected.processosIgnorados &&
              result.respostasImportadas === test.expected.respostasImportadas;
    if (ok) {
      console.log(`✓ ${test.name}`);
      console.log(`  → ${result.processosImportados} proc, ${result.processosIgnorados} ign, ${result.respostasImportadas} resp\n`);
      passed++;
    } else {
      console.log(`✗ ${test.name} | Exp: ${JSON.stringify(test.expected)} Got: ${JSON.stringify(result)}\n`);
      failed++;
    }
  } catch (e) {
    console.log(`✗ ${test.name} | Error: ${e.message}\n`);
    failed++;
  }
}

// Test gzip roundtrip (real gzipSync + gunzipSync)
try {
  const gzipOk = testGzipRoundtrip();
  if (gzipOk) {
    console.log(`✓ gzip roundtrip (gzipSync + gunzipSync) OK\n`);
    passed++;
  } else {
    console.log(`✗ gzip roundtrip failed\n`);
    failed++;
  }
} catch (e) {
  console.log(`✗ gzip roundtrip error: ${e.message}\n`);
  failed++;
}

console.log(`=== Summary: ${passed}/${testCases.length + 1} passed ===`);
process.exit(failed > 0 ? 1 : 0);
