import mysql from 'mysql2/promise';
import { createHash } from 'crypto';
import { gunzipSync } from 'zlib';

const QUESTION_INDEX_MAPS = {
  bem: {
    5: 'bem_gestor', 6: 'bem_unidade', 7: 'bem_colaborador', 8: 'bem_data_inicio', 9: 'bem_funcao',
    10: 'bem_anjo', 11: 'bem_caracteristicas', 12: 'bem_conhecimentos_tecnicos',
    13: 'bem_documentos_treinamentos', 14: 'bem_treinamentos_uc', 15: 'bem_primeiros_15_dias', 16: 'bem_primeiros_60_dias',
  },
  controle: {
    5: 'controle_nome', 6: 'controle_cpf', 7: 'controle_nascimento', 8: 'controle_email_pessoal',
    9: 'controle_telefone', 10: 'controle_data_inicio', 11: 'controle_denominacao', 12: 'controle_funcao',
    13: 'controle_unidade', 14: 'controle_gestor', 15: 'controle_descricao_funcao',
  },
};

function convertLegacyAnswers(c, formKey) {
  const indexMap = QUESTION_INDEX_MAPS[formKey] || {};
  const answers = {};
  if (Array.isArray(c)) {
    for (const [idx, valor] of c) {
      const fieldName = indexMap[parseInt(idx)] || `field_${idx}`;
      answers[fieldName] = valor;
    }
  }
  return answers;
}

function normalizeDateBR(dateStr) {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m}-${d}`;
  }
  return null;
}

function parseSubmittedAt(emStr) {
  if (!emStr) return new Date();
  try {
    const date = new Date(emStr);
    return isNaN(date.getTime()) ? new Date() : date;
  } catch {
    return new Date();
  }
}

function hashDedupeKey(legacyId, form, ciclo, papel, rid) {
  const key = `${legacyId}|${form}|${ciclo || 0}|${papel || ''}|${rid}`;
  return createHash('sha256').update(key).digest('hex').substring(0, 255);
}

function decodeImportData() {
  const gzipB64 = process.env.PROGRAMA_INTEGRACAO_IMPORT_GZIP_B64;
  const plainB64 = process.env.PROGRAMA_INTEGRACAO_IMPORT_B64;

  let importData;

  // Preferência: gzip com descompressão
  if (gzipB64) {
    try {
      const compressed = Buffer.from(gzipB64, 'base64');
      const jsonStr = gunzipSync(compressed).toString('utf-8');
      importData = JSON.parse(jsonStr);
      console.log('✓ Decoded via PROGRAMA_INTEGRACAO_IMPORT_GZIP_B64 + gunzip');
      return importData;
    } catch (err) {
      console.error('Error: Failed to decompress or parse PROGRAMA_INTEGRACAO_IMPORT_GZIP_B64:', err.message);
      process.exit(1);
    }
  }

  // Fallback: plain base64
  if (plainB64) {
    try {
      const jsonStr = Buffer.from(plainB64, 'base64').toString('utf-8');
      importData = JSON.parse(jsonStr);
      console.log('✓ Decoded via PROGRAMA_INTEGRACAO_IMPORT_B64 (fallback)');
      return importData;
    } catch (err) {
      console.error('Error: Failed to decode or parse PROGRAMA_INTEGRACAO_IMPORT_B64:', err.message);
      process.exit(1);
    }
  }

  console.error('Error: Neither PROGRAMA_INTEGRACAO_IMPORT_GZIP_B64 nor PROGRAMA_INTEGRACAO_IMPORT_B64 set');
  process.exit(1);
}

async function importProgramaIntegracao() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('Error: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  const importData = decodeImportData();

  if (typeof importData.processos !== 'object' || importData.processos === null) {
    console.error('Error: Invalid import data format - processos must be an object');
    process.exit(1);
  }

  const connection = await mysql.createConnection(databaseUrl);

  try {
    await connection.beginTransaction();

    let processosImportados = 0;
    let processosIgnorados = 0;
    let respostasImportadas = 0;
    let legacyIds = new Set();
    let legacyRids = new Set();
    let processoIdMap = {};
    let processoRidsMap = {}; // para validação final: processoId -> [rids esperados]

    // Derivar ordem dos processos a partir de importData.config.ordem
    const configOrdem = Array.isArray(importData.config?.ordem) ? importData.config.ordem : [];
    const ordemMap = new Map(configOrdem.map((id, idx) => [id, idx]));

    for (const [legacyId, processo] of Object.entries(importData.processos)) {
      if (!processo.nome || !processo.inicio) {
        processosIgnorados++;
        continue;
      }

      legacyIds.add(legacyId);

      // Derivar ordem da posição em config.ordem
      const ordem = ordemMap.has(legacyId) ? ordemMap.get(legacyId) : 0;

      const estado = {
        feito: processo.feito || {},
        alin: processo.alin || {},
        bem: processo.bem || {},
        teste: processo.teste || {},
      };

      const inicio = normalizeDateBR(processo.inicio);
      const mentorLegacyId = processo.mentorId || null;
      const participacao = processo.part || 'Presencial';

      const values = [
        legacyId, ordem, processo.nome, processo.cpf || null,
        normalizeDateBR(processo.nasc) || null, processo.email || null, processo.emailCorporativo || null,
        processo.tel || null, processo.cargo || null, processo.unidade || null, processo.tipo || 'Onboarding',
        inicio, participacao, processo.situacao || 'ativo', processo.gestor || null, processo.gestorEmail || null,
        processo.gestorTel || null, processo.anjo || null, processo.anjoEmail || null, processo.consultora || null,
        mentorLegacyId, processo.ugp || null, processo.horarios || null, processo.statusPdi || null,
        processo.pendencias || null, processo.statusCursos || null, processo.consideracoes || null,
        processo.notas || null, processo.cor || null, JSON.stringify(estado),
      ];

      const [result] = await connection.query(
        `INSERT INTO programa_integracao_processos
         (legacyId, ordem, nome, cpf, nasc, email, emailCorporativo, tel, cargo, unidade, tipo, inicio,
          participacao, situacao, gestor, gestorEmail, gestorTel, anjo, anjoEmail, consultora, mentorLegacyId,
          ugp, horarios, statusPdi, pendencias, statusCursos, consideracoes, notas, cor, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           ordem = VALUES(ordem), nome = VALUES(nome), cpf = VALUES(cpf), nasc = VALUES(nasc),
           email = VALUES(email), emailCorporativo = VALUES(emailCorporativo), tel = VALUES(tel),
           cargo = VALUES(cargo), unidade = VALUES(unidade), tipo = VALUES(tipo), inicio = VALUES(inicio),
           participacao = VALUES(participacao), situacao = VALUES(situacao), gestor = VALUES(gestor),
           gestorEmail = VALUES(gestorEmail), gestorTel = VALUES(gestorTel), anjo = VALUES(anjo),
           anjoEmail = VALUES(anjoEmail), consultora = VALUES(consultora), mentorLegacyId = VALUES(mentorLegacyId),
           ugp = VALUES(ugp), horarios = VALUES(horarios), statusPdi = VALUES(statusPdi),
           pendencias = VALUES(pendencias), statusCursos = VALUES(statusCursos), consideracoes = VALUES(consideracoes),
           notas = VALUES(notas), cor = VALUES(cor), estado = VALUES(estado), updatedAt = NOW()`,
        values
      );

      const processoId = result.insertId ||
        (await connection.query(`SELECT id FROM programa_integracao_processos WHERE legacyId = ?`, [legacyId]))[0][0]?.id;

      if (processoId) {
        processoIdMap[legacyId] = processoId;
        processoRidsMap[processoId] = [];
      }
      processosImportados++;

      if (Array.isArray(processo.resp)) {
        for (const resposta of processo.resp) {
          if (!resposta.rid) continue;

          legacyRids.add(resposta.rid);
          if (processoId) {
            processoRidsMap[processoId].push(resposta.rid);
          }

          const formKey = resposta.form || 'bem';
          const ciclo = resposta.ciclo ?? 0;
          const papel = resposta.papel || null;
          const dedupeKey = hashDedupeKey(legacyId, formKey, ciclo, papel, resposta.rid);
          const answers = convertLegacyAnswers(resposta.c || [], formKey);
          const statusResposta = resposta.status || 'valido';
          const submittedAt = parseSubmittedAt(resposta.em);

          // SELECT para validar existência por legacyRid
          const [existingRows] = await connection.query(
            `SELECT id, legacyRid, protocolo, dedupeKey FROM programa_integracao_respostas WHERE legacyRid = ? LIMIT 1`,
            [resposta.rid]
          );

          const respostaValues = [
            processoId || null, resposta.rid, resposta.protocolo || null, dedupeKey, formKey, ciclo, papel,
            resposta.itid || null, 1, 'vinculada', statusResposta, null, null, resposta.nomeColaborador || null,
            resposta.unidade || null, resposta.dataInicio ? normalizeDateBR(resposta.dataInicio) : null,
            resposta.emailColaborador || null, resposta.nomeOrig || null, resposta.avaliador || null,
            resposta.respondentName || null, resposta.respondentEmail || null, 'importacao',
            resposta.media || null, JSON.stringify(resposta.alertas || {}), JSON.stringify(answers),
            null, resposta.quando || null, resposta.em || null, submittedAt,
          ];

          if (existingRows.length > 0) {
            // UPDATE: apenas esse id com campos históricos, explicitamente statusVinculo='vinculada'
            const existingId = existingRows[0].id;
            const updateValues = [
              processoId || null, dedupeKey, formKey, ciclo, papel,
              resposta.itid || null, 1, 'vinculada', statusResposta, null, null, resposta.nomeColaborador || null,
              resposta.unidade || null, resposta.dataInicio ? normalizeDateBR(resposta.dataInicio) : null,
              resposta.emailColaborador || null, resposta.nomeOrig || null, resposta.avaliador || null,
              resposta.respondentName || null, resposta.respondentEmail || null, 'importacao',
              resposta.media || null, JSON.stringify(resposta.alertas || {}), JSON.stringify(answers),
              null, resposta.quando || null, resposta.em || null, submittedAt,
              existingId
            ];

            await connection.query(
              `UPDATE programa_integracao_respostas SET
                 processoId = ?, dedupeKey = ?, formKey = ?, ciclo = ?, papel = ?,
                 itemId = ?, formVersion = ?, statusVinculo = ?, statusResposta = ?, motivoPendencia = ?,
                 candidatos = ?, nomeColaborador = ?, unidade = ?, dataInicio = ?,
                 emailColaborador = ?, nomeOrig = ?, avaliador = ?,
                 respondentName = ?, respondentEmail = ?, source = ?,
                 media = ?, alertas = ?, answers = ?,
                 colunasOriginais = ?, quandoOriginal = ?, emOriginal = ?, submittedAt = ?,
                 updatedAt = NOW()
               WHERE id = ?`,
              updateValues
            );
          } else {
            // INSERT: novo registro
            await connection.query(
              `INSERT INTO programa_integracao_respostas
               (processoId, legacyRid, protocolo, dedupeKey, formKey, ciclo, papel, itemId, formVersion,
                statusVinculo, statusResposta, motivoPendencia, candidatos, nomeColaborador, unidade, dataInicio,
                emailColaborador, nomeOrig, avaliador, respondentName, respondentEmail, source, media, alertas,
                answers, colunasOriginais, quandoOriginal, emOriginal, submittedAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              respostaValues
            );
          }

          respostasImportadas++;
        }
      }
    }

    // Config: APENAS ordem. Nenhum outro campo histórico.
    let existingConfig = {};
    try {
      const [rows] = await connection.query(
        `SELECT valor FROM programa_integracao_config WHERE chave = 'geral'`
      );
      if (rows.length > 0) {
        const valor = rows[0].valor;
        existingConfig = typeof valor === 'string' ? JSON.parse(valor) : (valor || {});
      }
    } catch (e) {
      existingConfig = {};
    }

    // Filtrar ordem aos legacyIds válidos
    const novaOrdem = Array.isArray(importData.config?.ordem)
      ? importData.config.ordem.filter(id => legacyIds.has(id))
      : [];

    // Merge SOMENTE ordem: {...existingConfig, ordem: novaOrdem}
    const novaConfig = {
      ...existingConfig,
      ordem: novaOrdem,
    };

    await connection.query(
      `INSERT INTO programa_integracao_config (chave, valor) VALUES ('geral', ?)
       ON DUPLICATE KEY UPDATE valor = VALUES(valor), updatedAt = NOW()`,
      [JSON.stringify(novaConfig)]
    );

    // Validação final: verificar relação correta rid -> processo
    for (const [processoId, expectedRids] of Object.entries(processoRidsMap)) {
      if (expectedRids.length === 0) continue;

      const [respCheckRows] = await connection.query(
        `SELECT legacyRid, statusVinculo FROM programa_integracao_respostas
         WHERE processoId = ? AND legacyRid IN (${expectedRids.map(() => '?').join(',')})`,
        [parseInt(processoId), ...expectedRids]
      );

      if (respCheckRows.length !== expectedRids.length) {
        throw new Error(
          `Validação resposta-processo falhou: esperados ${expectedRids.length} rids, encontrados ${respCheckRows.length} para processoId ${processoId}`
        );
      }

      for (const row of respCheckRows) {
        if (row.statusVinculo !== 'vinculada') {
          throw new Error(
            `Validação statusVinculo falhou: legacyRid ${row.legacyRid} com status ${row.statusVinculo} != 'vinculada'`
          );
        }
      }
    }

    // Validação final: todos os legacyIds/legacyRids existem
    if (legacyIds.size > 0) {
      const [procCheck] = await connection.query(
        `SELECT COUNT(*) as count FROM programa_integracao_processos WHERE legacyId IN (${Array.from(legacyIds).map(() => '?').join(',')})`,
        Array.from(legacyIds)
      );

      const procCount = procCheck[0].count;
      if (procCount !== legacyIds.size) {
        throw new Error(`Validação processos: ${legacyIds.size} esperados, ${procCount} encontrados`);
      }
    }

    if (legacyRids.size > 0) {
      const [respCheck] = await connection.query(
        `SELECT COUNT(*) as count FROM programa_integracao_respostas WHERE legacyRid IN (${Array.from(legacyRids).map(() => '?').join(',')})`,
        Array.from(legacyRids)
      );

      const respCount = respCheck[0].count;
      if (respCount !== legacyRids.size) {
        throw new Error(`Validação respostas: ${legacyRids.size} esperadas, ${respCount} encontradas`);
      }
    }

    console.log(`Import: ${processosImportados} processos, ${processosIgnorados} ignorados, ${respostasImportadas} respostas`);
    console.log(`Verify: ${legacyIds.size} legacyIds, ${legacyRids.size} legacyRids validados`);

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

importProgramaIntegracao();
