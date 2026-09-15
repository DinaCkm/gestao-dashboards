import { Pool } from 'pg';

const QUESTION_INDEX_MAPS = {
  controle: {
    5: 'controle_nome', 6: 'controle_cpf', 7: 'controle_nascimento', 8: 'controle_email_pessoal',
    9: 'controle_telefone', 10: 'controle_data_inicio', 11: 'controle_denominacao', 12: 'controle_funcao',
    13: 'controle_unidade', 14: 'controle_gestor', 15: 'controle_descricao_funcao',
  },
  bem: {
    5: 'bem_gestor', 6: 'bem_unidade', 7: 'bem_colaborador', 8: 'bem_data_inicio', 9: 'bem_funcao',
    10: 'bem_anjo', 11: 'bem_caracteristicas', 12: 'bem_conhecimentos_tecnicos',
    13: 'bem_documentos_treinamentos', 14: 'bem_treinamentos_uc', 15: 'bem_primeiros_15_dias', 16: 'bem_primeiros_60_dias',
  },
  pesquisa: {
    6: 'pesquisa_unidade', 7: 'pesquisa_programa', 8: 'pesquisa_periodo',
    9: 'pesquisa_cultura_valores', 10: 'pesquisa_pertencimento', 11: 'pesquisa_dia_a_dia',
    12: 'pesquisa_orgulho', 13: 'pesquisa_importancia_atividades', 14: 'pesquisa_anjo_ajuda',
    15: 'pesquisa_conforto_colegas', 16: 'pesquisa_confianca_colegas', 17: 'pesquisa_ajuda_colegas',
    18: 'pesquisa_lacos_amizade', 19: 'pesquisa_gestor_clareza', 20: 'pesquisa_comunicacao_transparente',
    21: 'pesquisa_gestor_incentivo', 22: 'pesquisa_satisfacao_funcoes', 23: 'pesquisa_sobrecarga',
    24: 'pesquisa_conhecimento_tecnico', 25: 'pesquisa_busca_apoio', 26: 'pesquisa_propoe_melhorias',
    27: 'pesquisa_cooperacao_equipe', 28: 'pesquisa_progresso_pdi',
  },
};

async function importProgramaIntegracao() {
  const importB64 = process.env.PROGRAMA_INTEGRACAO_IMPORT_B64;
  const databaseUrl = process.env.DATABASE_URL;

  if (!importB64) {
    console.error('Error: PROGRAMA_INTEGRACAO_IMPORT_B64 environment variable not set');
    process.exit(1);
  }

  if (!databaseUrl) {
    console.error('Error: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  let importData;
  try {
    const jsonStr = Buffer.from(importB64, 'base64').toString('utf-8');
    importData = JSON.parse(jsonStr);
  } catch (err) {
    console.error('Error: Failed to decode or parse PROGRAMA_INTEGRACAO_IMPORT_B64:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(importData.processos)) {
    console.error('Error: Invalid import data format - processos must be an array');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    await pool.query('BEGIN');

    let processosImportados = 0;
    let processosIgnorados = 0;
    let respostasImportadas = 0;
    let legacyIds = new Set();
    let legacyRids = new Set();

    for (const processo of importData.processos) {
      if (!processo.legacyId || !processo.nome || !processo.inicio) {
        processosIgnorados++;
        continue;
      }

      legacyIds.add(processo.legacyId);
      const unidade = processo.unidade || null;
      const dataInicio = processo.inicio || null;
      const email = processo.email || null;

      await pool.query(
        `INSERT INTO "ProgramaIntegracaoProcesso" 
         (id, legacyId, formKey, nome, unidade, dataInicio, email, source, createdAt, updatedAt)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (legacyId) DO UPDATE SET
           formKey = EXCLUDED.formKey,
           nome = EXCLUDED.nome,
           unidade = EXCLUDED.unidade,
           dataInicio = EXCLUDED.dataInicio,
           email = EXCLUDED.email,
           updatedAt = NOW()`,
        [processo.legacyId, processo.formKey || 'bem', processo.nome, unidade, dataInicio, email, 'importacao']
      );

      processosImportados++;

      if (processo.respostas && Array.isArray(processo.respostas)) {
        for (const resposta of processo.respostas) {
          if (!resposta.legacyRid || !resposta.protocolo) continue;

          legacyRids.add(resposta.legacyRid);
          const formKey = processo.formKey || 'bem';
          const indexMap = QUESTION_INDEX_MAPS[formKey] || {};

          let answers = {};
          if (resposta.c && Array.isArray(resposta.c)) {
            for (let idx = 0; idx < resposta.c.length; idx++) {
              const fieldName = indexMap[idx] || `field_${idx}`;
              answers[fieldName] = resposta.c[idx];
            }
          }

          await pool.query(
            `INSERT INTO "ProgramaIntegracaoResposta"
             (id, legacyRid, legacyProcessoId, protocolo, formKey, ciclo, papel, answers, source, createdAt, updatedAt)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
             ON CONFLICT (legacyRid, protocolo) DO UPDATE SET
               answers = EXCLUDED.answers,
               updatedAt = NOW()`,
            [resposta.legacyRid, processo.legacyId, resposta.protocolo, formKey, 
             resposta.ciclo || 1, resposta.papel || null, JSON.stringify(answers), 'importacao']
          );

          respostasImportadas++;
        }
      }
    }

    if (importData.config) {
      const cfg = importData.config;
      const ordemFiltrada = Array.isArray(cfg.ordem)
        ? cfg.ordem.filter(id => legacyIds.has(id))
        : [];

      await pool.query(
        `INSERT INTO "ProgramaIntegracaoConfig" (id, ordem, createdAt, updatedAt)
         VALUES (gen_random_uuid(), $1, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [JSON.stringify(ordemFiltrada)]
      );
    }

    console.log(`Import completed: ${processosImportados} processos, ${processosIgnorados} ignorados, ${respostasImportadas} respostas`);

    const result = await pool.query(
      `SELECT COUNT(*) as count FROM "ProgramaIntegracaoProcesso" WHERE source = 'importacao'`
    );
    console.log(`Verification: ${result.rows[0].count} processos importados no DB`);

    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error during import:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

importProgramaIntegracao();
