import mysql from 'mysql2/promise';
import { createHash } from 'crypto';

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

      if (processoId) processoIdMap[legacyId] = processoId;
      processosImportados++;

      if (Array.isArray(processo.resp)) {
        for (const resposta of processo.resp) {
          if (!resposta.rid) continue;

          legacyRids.add(resposta.rid);
          const formKey = resposta.form || 'bem';
          const ciclo = resposta.ciclo ?? 0;
          const papel = resposta.papel || null;
          const dedupeKey = hashDedupeKey(legacyId, formKey, ciclo, papel, resposta.rid);
          const answers = convertLegacyAnswers(resposta.c || [], formKey);
          const statusResposta = resposta.status || 'valido';
          const submittedAt = parseSubmittedAt(resposta.em);

          const respostaValues = [
            processoId || null, resposta.rid, resposta.protocolo || null, dedupeKey, formKey, ciclo, papel,
            resposta.itid || null, 1, 'vinculada', statusResposta, null, null, resposta.nomeColaborador || null,
            resposta.unidade || null, resposta.dataInicio ? normalizeDateBR(resposta.dataInicio) : null,
            resposta.emailColaborador || null, resposta.nomeOrig || null, resposta.avaliador || null,
            resposta.respondentName || null, resposta.respondentEmail || null, 'importacao',
            resposta.media || null, JSON.stringify(resposta.alertas || {}), JSON.stringify(answers),
            null, resposta.quando || null, resposta.em || null, submittedAt,
          ];

          await connection.query(
            `INSERT INTO programa_integracao_respostas
             (processoId, legacyRid, protocolo, dedupeKey, formKey, ciclo, papel, itemId, formVersion,
              statusVinculo, statusResposta, motivoPendencia, candidatos, nomeColaborador, unidade, dataInicio,
              emailColaborador, nomeOrig, avaliador, respondentName, respondentEmail, source, media, alertas,
              answers, colunasOriginais, quandoOriginal, emOriginal, submittedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE answers = VALUES(answers), statusResposta = VALUES(statusResposta), updatedAt = NOW()`,
            respostaValues
          );

          respostasImportadas++;
        }
      }
    }

    // Config: merge conservador - ler existente, sanitizar import, preservar campos já existentes
    let existingConfig = {};
    try {
      const [rows] = await connection.query(
        `SELECT valor FROM programa_integracao_config WHERE chave = 'geral'`
      );
      if (rows.length > 0) {
        existingConfig = JSON.parse(rows[0].valor || '{}');
      }
    } catch (e) {
      existingConfig = {};
    }

    if (importData.config && typeof importData.config === 'object') {
      const cfg = importData.config;

      // Sanitizar: remover linksPublicos e respostasPendentes
      const sanitized = { ...cfg };
      delete sanitized.linksPublicos;
      delete sanitized.respostasPendentes;

      // Filtrar ordem aos legacyIds válidos
      const novaOrdem = Array.isArray(sanitized.ordem) ? sanitized.ordem.filter(id => legacyIds.has(id)) : [];

      // Merge conservador: preservar campos existentes, atualizar apenas ordem e campos importados
      const novaConfig = {
        ...existingConfig,
        ...sanitized,
        ordem: novaOrdem,
      };

      await connection.query(
        `INSERT INTO programa_integracao_config (chave, valor) VALUES ('geral', ?)
         ON DUPLICATE KEY UPDATE valor = VALUES(valor), updatedAt = NOW()`,
        [JSON.stringify(novaConfig)]
      );
    }

    // Validação final
    const [procCheck] = await connection.query(
      `SELECT COUNT(*) as count FROM programa_integracao_processos WHERE legacyId IN (${Array.from(legacyIds).map(() => '?').join(',')})`,
      Array.from(legacyIds)
    );

    const [respCheck] = await connection.query(
      `SELECT COUNT(*) as count FROM programa_integracao_respostas WHERE legacyRid IN (${Array.from(legacyRids).length > 0 ? Array.from(legacyRids).map(() => '?').join(',') : 'NULL'})`,
      Array.from(legacyRids).length > 0 ? Array.from(legacyRids) : []
    );

    const procCount = procCheck[0].count;
    const respCount = respCheck[0].count;

    if (procCount !== legacyIds.size) {
      throw new Error(`Validação processos: ${legacyIds.size} esperados, ${procCount} encontrados`);
    }

    if (legacyRids.size > 0 && respCount !== legacyRids.size) {
      throw new Error(`Validação respostas: ${legacyRids.size} esperadas, ${respCount} encontradas`);
    }

    console.log(`Import: ${processosImportados} processos, ${processosIgnorados} ignorados, ${respostasImportadas} respostas`);
    console.log(`Verify: ${procCount} processos, ${respCount} respostas`);

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
