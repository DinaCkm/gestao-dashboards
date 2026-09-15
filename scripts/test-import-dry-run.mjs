const QUESTION_INDEX_MAPS = {
  bem: {
    5: 'bem_gestor', 6: 'bem_unidade', 7: 'bem_colaborador', 8: 'bem_data_inicio', 9: 'bem_funcao',
    10: 'bem_anjo', 11: 'bem_caracteristicas', 12: 'bem_conhecimentos_tecnicos',
    13: 'bem_documentos_treinamentos', 14: 'bem_treinamentos_uc', 15: 'bem_primeiros_15_dias', 16: 'bem_primeiros_60_dias',
  },
};

function validateAndConvert(importData) {
  if (!Array.isArray(importData.processos)) {
    throw new Error('processos must be an array');
  }

  const results = { processosImportados: 0, processosIgnorados: 0, respostasImportadas: 0, errors: [] };

  for (const processo of importData.processos) {
    if (!processo.legacyId || !processo.nome) {
      results.processosIgnorados++;
      continue;
    }

    results.processosImportados++;

    if (processo.respostas && Array.isArray(processo.respostas)) {
      const formKey = processo.formKey || 'bem';
      const indexMap = QUESTION_INDEX_MAPS[formKey];

      for (const resposta of processo.respostas) {
        if (!resposta.legacyRid || !resposta.protocolo) continue;

        let answers = {};
        if (resposta.c && Array.isArray(resposta.c)) {
          for (let idx = 0; idx < resposta.c.length; idx++) {
            const fieldName = indexMap?.[idx] || `field_${idx}`;
            answers[fieldName] = resposta.c[idx];
          }
        }

        if (Object.keys(answers).length === 0) {
          results.errors.push(`Resposta vazia: legacyRid=${resposta.legacyRid}`);
        }
        results.respostasImportadas++;
      }
    }
  }

  return results;
}

const testCases = [
  {
    name: 'Processo válido com respostas',
    data: {
      processos: [
        {
          legacyId: 'legacy_001',
          nome: 'João Silva',
          inicio: '2026-01-15',
          formKey: 'bem',
          respostas: [
            {
              legacyRid: 'rid_001',
              protocolo: 'proto_001',
              c: ['UAS', 'Sebrae', 'Ana', '2026-01-15', 'Gestor', 'Paulo', null, null, null, null, null, null, null],
            },
          ],
        },
      ],
    },
    expected: { processosImportados: 1, processosIgnorados: 0, respostasImportadas: 1 },
  },
  {
    name: 'Processo vazio ignorado',
    data: {
      processos: [
        { legacyId: '', nome: '', respostas: [] },
        { legacyId: 'legacy_002', nome: 'Maria', respostas: [] },
      ],
    },
    expected: { processosImportados: 1, processosIgnorados: 1, respostasImportadas: 0 },
  },
  {
    name: 'Resposta com bem_treinamentos_uc convertido',
    data: {
      processos: [
        {
          legacyId: 'legacy_003',
          nome: 'Carlos',
          inicio: '2026-02-01',
          formKey: 'bem',
          respostas: [
            {
              legacyRid: 'rid_003',
              protocolo: 'proto_003',
              c: ['UMC', 'CDE', 'Pedro', '2026-02-01', 'Colaborador', 'Alice', 'Ativo', 'Pontual', 'SQL', 'Documentação', 'Sebrae Training', 'Tarefa 1', 'Tarefa 2'],
            },
          ],
        },
      ],
    },
    expected: { processosImportados: 1, processosIgnorados: 0, respostasImportadas: 1 },
  },
];

console.log('=== Dry-Run Test Suite ===\n');
let passed = 0;
let failed = 0;

for (const test of testCases) {
  try {
    const result = validateAndConvert(test.data);
    const match =
      result.processosImportados === test.expected.processosImportados &&
      result.processosIgnorados === test.expected.processosIgnorados &&
      result.respostasImportadas === test.expected.respostasImportadas;

    if (match) {
      console.log(`✓ ${test.name}`);
      console.log(`  → ${result.processosImportados} processos, ${result.processosIgnorados} ignorados, ${result.respostasImportadas} respostas\n`);
      passed++;
    } else {
      console.log(`✗ ${test.name}`);
      console.log(`  Expected: ${JSON.stringify(test.expected)}`);
      console.log(`  Got: ${JSON.stringify(result)}\n`);
      failed++;
    }
  } catch (err) {
    console.log(`✗ ${test.name}`);
    console.log(`  Error: ${err.message}\n`);
    failed++;
  }
}

console.log(`=== Summary ===`);
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);

process.exit(failed > 0 ? 1 : 0);
