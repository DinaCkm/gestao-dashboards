import { Router, type NextFunction, type Request, type Response } from "express";
import { getRawConnection } from "./db";
import { sdk } from "./_core/sdk";

export const programaIntegracaoRestoreRouter = Router();

function asJson<T = any>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}

function plainObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function sanitizeLegacyId(value: unknown) {
  return String(value ?? "").trim().slice(0, 100);
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Acesso restrito ao administrador." });
    (req as any).authenticatedUser = user;
    next();
  } catch {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }
}

async function getConnectionOr503(res: Response) {
  const connection = await getRawConnection();
  if (!connection) {
    res.status(503).json({ error: "Banco de dados indisponível." });
    return null;
  }
  return connection;
}

function validarState(state: unknown): string | null {
  if (!plainObject(state)) return "Backup inválido.";
  if (!plainObject(state.config)) return "Backup sem configuração válida.";
  if (!plainObject(state.processos)) return "Backup sem processos válidos.";
  const ids = Object.keys(state.processos);
  if (ids.length > 5000) return "Backup excede o limite de processos permitido.";
  for (const id of ids) {
    if (!sanitizeLegacyId(id)) return "Há um processo sem identificador válido.";
    const p = state.processos[id];
    if (!plainObject(p) || !String(p.nome || "").trim()) return `Processo ${id} inválido ou sem nome.`;
    if (p.resp != null && !Array.isArray(p.resp)) return `Respostas do processo ${id} em formato inválido.`;
  }
  const pendentes = state.config.respostasPendentes;
  if (pendentes != null && !Array.isArray(pendentes)) return "Fila de respostas pendentes inválida.";
  try {
    if (JSON.stringify(state).length > 25_000_000) return "Backup grande demais para restauração administrativa.";
  } catch {
    return "Backup não pode ser serializado.";
  }
  return null;
}

function respostaChave(legacyId: string, r: any) {
  return `${legacyId}|${String(r?.form || "")}|${Number(r?.ciclo || 0)}|${String(r?.papel || "")}|${String(r?.rid || "")}`;
}

programaIntegracaoRestoreRouter.post(
  "/api/programa-integracao/restore",
  requireAdmin,
  async (req, res) => {
    if (String(req.body?.confirmacao || "") !== "RESTAURAR") {
      return res.status(400).json({ error: "Confirmação de restauração inválida." });
    }

    const state = req.body?.state;
    const validationError = validarState(state);
    if (validationError) return res.status(400).json({ error: validationError });

    const connection = await getConnectionOr503(res);
    if (!connection) return;

    let transactionStarted = false;
    try {
      await connection.beginTransaction();
      transactionStarted = true;

      const userId = Number((req as any).authenticatedUser?.id || 0) || null;
      const config = { ...(state.config || {}) };
      const pendentes = Array.isArray(config.respostasPendentes) ? config.respostasPendentes : [];
      delete config.respostasPendentes;

      const processos = state.processos as Record<string, any>;
      const ordemConfig = Array.isArray(config.ordem) ? config.ordem.map(String) : [];
      const idsBackup = Object.keys(processos);
      const ordemMap = new Map<string, number>();
      ordemConfig.forEach((id: string, i: number) => ordemMap.set(id, i));
      idsBackup.forEach((id, i) => { if (!ordemMap.has(id)) ordemMap.set(id, ordemMap.size + i); });
      config.ordem = [...idsBackup].sort((a, b) => (ordemMap.get(a) ?? 999999) - (ordemMap.get(b) ?? 999999));

      await connection.execute(
        `INSERT INTO programa_integracao_config (chave,valor,updatedByUserId)
         VALUES ('geral',?,?)
         ON DUPLICATE KEY UPDATE valor=VALUES(valor),updatedByUserId=VALUES(updatedByUserId),updatedAt=CURRENT_TIMESTAMP`,
        [JSON.stringify(config), userId],
      );

      const [atuaisRows] = (await connection.execute(
        `SELECT id,legacyId FROM programa_integracao_processos WHERE situacao<>'removido' FOR UPDATE`,
      )) as any;
      const backupSet = new Set(idsBackup);
      for (const row of atuaisRows || []) {
        if (!backupSet.has(String(row.legacyId))) {
          await connection.execute(
            `UPDATE programa_integracao_processos SET situacao='removido',updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
            [row.id],
          );
          await connection.execute(
            `UPDATE programa_integracao_respostas SET statusVinculo='descartada',statusResposta=CASE WHEN statusResposta='valido' THEN 'restauracao_snapshot' ELSE statusResposta END,updatedAt=CURRENT_TIMESTAMP WHERE processoId=? AND statusVinculo='vinculada'`,
            [row.id],
          );
        }
      }

      let respostasRestauradas = 0;
      for (const legacyIdRaw of idsBackup) {
        const legacyId = sanitizeLegacyId(legacyIdRaw);
        const p = processos[legacyIdRaw] || {};
        const ordem = ordemMap.get(legacyIdRaw) ?? 0;
        const estado = { ...p };
        delete estado.resp;
        const values = [
          legacyId, null, ordem, String(p.nome || "Sem nome"), p.cpf || null, p.nasc || null,
          p.email || null, p.emailCorporativo || null, p.tel || null, p.cargo || null, p.unidade || null,
          p.tipo || "Onboarding", p.inicio || new Date().toISOString().slice(0, 10), p.part || "Presencial",
          p.situacao || "ativo", p.gestor || null, p.gestorEmail || null, p.gestorTel || null,
          p.anjo || null, p.anjoEmail || null, p.consultora || null, p.mentorId || null, p.ugp || null,
          p.horarios || null, p.statusPdi || null, p.pendencias || null, p.statusCursos || null,
          p.consideracoes || null, p.notas || null, p.cor || null, JSON.stringify(estado),
        ];
        await connection.execute(
          `INSERT INTO programa_integracao_processos (legacyId,alunoId,ordem,nome,cpf,nasc,email,emailCorporativo,tel,cargo,unidade,tipo,inicio,participacao,situacao,gestor,gestorEmail,gestorTel,anjo,anjoEmail,consultora,mentorLegacyId,ugp,horarios,statusPdi,pendencias,statusCursos,consideracoes,notas,cor,estado)
           VALUES (${Array(31).fill("?").join(",")})
           ON DUPLICATE KEY UPDATE ordem=VALUES(ordem),nome=VALUES(nome),cpf=VALUES(cpf),nasc=VALUES(nasc),email=VALUES(email),emailCorporativo=VALUES(emailCorporativo),tel=VALUES(tel),cargo=VALUES(cargo),unidade=VALUES(unidade),tipo=VALUES(tipo),inicio=VALUES(inicio),participacao=VALUES(participacao),situacao=VALUES(situacao),gestor=VALUES(gestor),gestorEmail=VALUES(gestorEmail),gestorTel=VALUES(gestorTel),anjo=VALUES(anjo),anjoEmail=VALUES(anjoEmail),consultora=VALUES(consultora),mentorLegacyId=VALUES(mentorLegacyId),ugp=VALUES(ugp),horarios=VALUES(horarios),statusPdi=VALUES(statusPdi),pendencias=VALUES(pendencias),statusCursos=VALUES(statusCursos),consideracoes=VALUES(consideracoes),notas=VALUES(notas),cor=VALUES(cor),estado=VALUES(estado),updatedAt=CURRENT_TIMESTAMP`,
          values,
        );

        const [prow] = (await connection.execute(
          `SELECT id FROM programa_integracao_processos WHERE legacyId=? LIMIT 1`, [legacyId],
        )) as any;
        const processoId = Number(prow?.[0]?.id || 0);
        if (!processoId) throw new Error(`Processo ${legacyId} não pôde ser relido durante a restauração.`);

        const respostas = Array.isArray(p.resp) ? p.resp : [];
        const desired = new Set(respostas.map((r: any) => respostaChave(legacyId, r)));
        const [existentesResp] = (await connection.execute(
          `SELECT id,legacyRid,formKey,ciclo,papel FROM programa_integracao_respostas WHERE processoId=? AND statusVinculo='vinculada' FOR UPDATE`,
          [processoId],
        )) as any;
        for (const er of existentesResp || []) {
          const key = `${legacyId}|${er.formKey || ""}|${Number(er.ciclo || 0)}|${er.papel || ""}|${er.legacyRid || ""}`;
          if (!desired.has(key)) {
            await connection.execute(
              `UPDATE programa_integracao_respostas SET statusVinculo='descartada',statusResposta=CASE WHEN statusResposta='valido' THEN 'restauracao_snapshot' ELSE statusResposta END,updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
              [er.id],
            );
          }
        }

        for (const r of respostas) {
          const answers = plainObject(r?.answers) ? r.answers : {};
          const protocolo = String(r?.protocolo || "").trim() || null;
          const rid = String(r?.rid || "").trim() || null;
          const dedupeKey = respostaChave(legacyId, r);
          const [existing] = (await connection.execute(
            `SELECT id FROM programa_integracao_respostas WHERE (protocolo IS NOT NULL AND protocolo=?) OR (legacyRid IS NOT NULL AND legacyRid=?) LIMIT 1`,
            [protocolo, rid],
          )) as any;
          const params = [
            processoId, rid, protocolo, dedupeKey, r?.form || "", Number(r?.ciclo || 0), r?.papel || "",
            r?.itid || null, Number(r?.formVersion || 1), r?.status || "valido", r?.nomeOrig || null,
            r?.avaliador || null, r?.respondentName || null, r?.respondentEmail || null, r?.source || "restore",
            r?.media ?? null, JSON.stringify(r?.alertas || []), JSON.stringify(answers), r?.quando || null,
            r?.em || null, r?.submittedAt ? new Date(r.submittedAt) : new Date(),
          ];
          if (existing?.[0]?.id) {
            await connection.execute(
              `UPDATE programa_integracao_respostas SET processoId=?,legacyRid=?,protocolo=COALESCE(?,protocolo),dedupeKey=?,formKey=?,ciclo=?,papel=?,itemId=?,formVersion=?,statusVinculo='vinculada',statusResposta=?,nomeOrig=?,avaliador=?,respondentName=?,respondentEmail=?,source=?,media=?,alertas=?,answers=?,quandoOriginal=?,emOriginal=?,submittedAt=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
              [...params, existing[0].id],
            );
          } else {
            await connection.execute(
              `INSERT INTO programa_integracao_respostas (processoId,legacyRid,protocolo,dedupeKey,formKey,ciclo,papel,itemId,formVersion,statusVinculo,statusResposta,nomeOrig,avaliador,respondentName,respondentEmail,source,media,alertas,answers,quandoOriginal,emOriginal,submittedAt)
               VALUES (?,?,?,?,?,?,?,?,?,'vinculada',?,?,?,?,?,?,?,?,?,?,?,?)`,
              params,
            );
          }
          respostasRestauradas++;
        }
      }

      const protocolosPendentes = new Set<string>();
      for (const p of pendentes) {
        const protocolo = String(p?.protocolo || "").trim();
        if (!protocolo) continue;
        protocolosPendentes.add(protocolo);
        await connection.execute(
          `INSERT INTO programa_integracao_respostas (legacyRid,protocolo,formKey,ciclo,papel,statusVinculo,statusResposta,motivoPendencia,candidatos,nomeColaborador,unidade,dataInicio,emailColaborador,respondentName,source,answers,submittedAt)
           VALUES (?,?,?,?,?,'pendente',?,?,?,?,?,?,?,?, 'restore',?,?)
           ON DUPLICATE KEY UPDATE legacyRid=VALUES(legacyRid),ciclo=VALUES(ciclo),papel=VALUES(papel),statusVinculo='pendente',statusResposta=VALUES(statusResposta),motivoPendencia=VALUES(motivoPendencia),candidatos=VALUES(candidatos),nomeColaborador=VALUES(nomeColaborador),unidade=VALUES(unidade),dataInicio=VALUES(dataInicio),emailColaborador=VALUES(emailColaborador),respondentName=VALUES(respondentName),source='restore',answers=VALUES(answers),submittedAt=VALUES(submittedAt),updatedAt=CURRENT_TIMESTAMP`,
          [
            p?.id || null, protocolo, p?.formKey || "", Number(p?.cycle || 0), p?.role || "",
            p?.erroRegistro ? "registro_falhou" : null, p?.motivo || "ambiguo", JSON.stringify(p?.candidatos || []),
            p?.nomeColaborador || "", p?.unidade || "", p?.dataInicio || null, p?.emailColaborador || "",
            p?.respondentName || "", JSON.stringify(p?.answers || {}), p?.submittedAt ? new Date(p.submittedAt) : new Date(),
          ],
        );
      }

      const [pendingRows] = (await connection.execute(
        `SELECT id,protocolo FROM programa_integracao_respostas WHERE statusVinculo='pendente' FOR UPDATE`,
      )) as any;
      for (const row of pendingRows || []) {
        if (row.protocolo && !protocolosPendentes.has(String(row.protocolo))) {
          await connection.execute(
            `UPDATE programa_integracao_respostas SET statusVinculo='descartada',statusResposta='restauracao_snapshot',updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
            [row.id],
          );
        }
      }

      await connection.execute(
        `INSERT INTO programa_integracao_auditoria (processoId,respostaId,userId,acao,detalhe,metadata)
         VALUES (NULL,NULL,?,'backup_restaurado','Backup administrativo restaurado de forma transacional.',?)`,
        [userId, JSON.stringify({ processos: idsBackup.length, respostas: respostasRestauradas, pendentes: pendentes.length })],
      );

      await connection.commit();
      transactionStarted = false;

      res.setHeader("Cache-Control", "no-store");
      return res.json({
        ok: true,
        resumo: { processos: idsBackup.length, respostas: respostasRestauradas, pendentes: pendentes.length },
      });
    } catch (error) {
      if (transactionStarted) {
        try { await connection.rollback(); } catch (rollbackError) {
          console.error("[ProgramaIntegracao] rollback restauracao:", rollbackError);
        }
      }
      console.error("[ProgramaIntegracao] restaurar backup:", error);
      return res.status(500).json({ error: "A restauração falhou e foi revertida. Nenhuma restauração parcial foi confirmada." });
    }
  },
);
