import { Router, type NextFunction, type Request, type Response } from "express";
import { getRawConnection } from "./db";
import { sdk } from "./_core/sdk";
import { itemIdDoFormulario, type ProgramaIntegracaoFormKey } from "./programaIntegracaoDefinitions";

export const programaIntegracaoPendingRouter = Router();

const FORM_KEYS = new Set<ProgramaIntegracaoFormKey>(["controle", "bem", "pesquisa", "aval", "pdi"]);

function asJson<T = any>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}

function sanitizeLegacyId(value: unknown) {
  return String(value ?? "").trim().slice(0, 100);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nowBr() {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date()).replace(",", "");
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

async function audit(
  connection: any,
  req: Request,
  acao: string,
  detalhe: string,
  processoId?: number | null,
  respostaId?: number | null,
  metadata?: Record<string, unknown>,
) {
  const userId = Number((req as any).authenticatedUser?.id || 0) || null;
  await connection.execute(
    `INSERT INTO programa_integracao_auditoria (processoId,respostaId,userId,acao,detalhe,metadata) VALUES (?,?,?,?,?,?)`,
    [processoId ?? null, respostaId ?? null, userId, acao, detalhe, metadata ? JSON.stringify(metadata) : null],
  );
}

programaIntegracaoPendingRouter.patch(
  "/api/programa-integracao/respostas-pendentes/:legacyRid/vincular",
  requireAdmin,
  async (req, res) => {
    const connection = await getRawConnection();
    if (!connection) return res.status(503).json({ error: "Banco de dados indisponível." });

    const legacyRid = sanitizeLegacyId(req.params.legacyRid);
    const targetLegacyId = sanitizeLegacyId(req.body?.processoId);
    const cycleOverride = req.body?.cycle == null ? null : Number(req.body.cycle);
    const roleOverride = req.body?.role == null ? null : String(req.body.role).trim();

    if (!legacyRid || !targetLegacyId) return res.status(400).json({ error: "Resposta e processo são obrigatórios." });
    if (cycleOverride != null && (!Number.isInteger(cycleOverride) || cycleOverride < 0 || cycleOverride > 4)) {
      return res.status(400).json({ error: "Ciclo inválido." });
    }

    try {
      await connection.beginTransaction();

      const [responseRows] = (await connection.execute(
        `SELECT * FROM programa_integracao_respostas WHERE legacyRid=? AND statusVinculo='pendente' LIMIT 1 FOR UPDATE`,
        [legacyRid],
      )) as any;
      const resposta = responseRows?.[0];
      if (!resposta) {
        await connection.rollback();
        return res.status(404).json({ error: "Resposta pendente não encontrada ou já tratada." });
      }

      const formKey = String(resposta.formKey || "") as ProgramaIntegracaoFormKey;
      if (!FORM_KEYS.has(formKey)) throw new Error("Formulário pendente inválido.");

      const [processRows] = (await connection.execute(
        `SELECT id,legacyId,estado FROM programa_integracao_processos WHERE legacyId=? AND situacao<>'removido' LIMIT 1 FOR UPDATE`,
        [targetLegacyId],
      )) as any;
      const processo = processRows?.[0];
      if (!processo) {
        await connection.rollback();
        return res.status(404).json({ error: "Processo de destino não encontrado." });
      }

      const cycle = cycleOverride == null ? Number(resposta.ciclo || 0) : cycleOverride;
      const role = roleOverride == null ? String(resposta.papel || "") : roleOverride;
      if (formKey === "aval" && !["Gestor", "Anjo"].includes(role)) {
        await connection.rollback();
        return res.status(400).json({ error: "Na Avaliação do Programa, informe Gestor ou Anjo." });
      }

      const itemId = itemIdDoFormulario(formKey, cycle, role) || null;
      const processoId = Number(processo.id);
      const dedupeKey = `${formKey}|${processoId}|${cycle}|${role}|${resposta.id}`;

      await connection.execute(
        `UPDATE programa_integracao_respostas
         SET processoId=?,ciclo=?,papel=?,itemId=?,dedupeKey=?,statusVinculo='vinculada',statusResposta='valido',motivoPendencia=NULL,candidatos=NULL,updatedAt=CURRENT_TIMESTAMP
         WHERE id=? AND statusVinculo='pendente'`,
        [processoId, cycle, role || null, itemId, dedupeKey, resposta.id],
      );

      if (itemId) {
        const estado = asJson<Record<string, any>>(processo.estado, {});
        estado.feito = estado.feito || {};
        const ficha = estado.feito[itemId] && typeof estado.feito[itemId] === "object" ? estado.feito[itemId] : {};
        ficha.s = "ok";
        ficha.d = ficha.d || todayIso();
        ficha.notas = Array.isArray(ficha.notas) ? ficha.notas : [];
        ficha.notas.push({ d: nowBr(), t: "Resposta pública revisada e vinculada manualmente pelo administrador." });
        estado.feito[itemId] = ficha;
        await connection.execute(
          `UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
          [JSON.stringify(estado), processoId],
        );
      }

      await audit(
        connection,
        req,
        "resposta_pendente_vinculada",
        "Resposta pendente vinculada manualmente a um processo existente.",
        processoId,
        Number(resposta.id),
        { formKey, cycle, role },
      );

      await connection.commit();

      const [readbackRows] = (await connection.execute(
        `SELECT legacyRid,statusVinculo,processoId,ciclo,papel,itemId FROM programa_integracao_respostas WHERE id=? LIMIT 1`,
        [resposta.id],
      )) as any;
      const saved = readbackRows?.[0];
      if (!saved || saved.statusVinculo !== "vinculada" || Number(saved.processoId) !== processoId) {
        return res.status(500).json({ error: "A resposta foi processada, mas a confirmação de leitura falhou. Recarregue antes de tentar novamente." });
      }

      res.setHeader("Cache-Control", "no-store");
      return res.json({ ok: true, resposta: { legacyRid: saved.legacyRid, processoId: targetLegacyId, ciclo: Number(saved.ciclo || 0), papel: saved.papel || "", itemId: saved.itemId || "" } });
    } catch (error) {
      try { await connection.rollback(); } catch { /* sem ação adicional */ }
      console.error("[ProgramaIntegracao] vincular resposta pendente:", error);
      return res.status(500).json({ error: "Não foi possível vincular a resposta pendente. Nenhuma alteração parcial foi mantida." });
    }
  },
);

programaIntegracaoPendingRouter.delete(
  "/api/programa-integracao/respostas-pendentes/:legacyRid",
  requireAdmin,
  async (req, res) => {
    const connection = await getRawConnection();
    if (!connection) return res.status(503).json({ error: "Banco de dados indisponível." });
    const legacyRid = sanitizeLegacyId(req.params.legacyRid);
    if (!legacyRid) return res.status(400).json({ error: "Resposta inválida." });

    try {
      await connection.beginTransaction();
      const [rows] = (await connection.execute(
        `SELECT id FROM programa_integracao_respostas WHERE legacyRid=? AND statusVinculo='pendente' LIMIT 1 FOR UPDATE`,
        [legacyRid],
      )) as any;
      const resposta = rows?.[0];
      if (!resposta) {
        await connection.rollback();
        return res.status(404).json({ error: "Resposta pendente não encontrada ou já tratada." });
      }

      await connection.execute(
        `UPDATE programa_integracao_respostas SET statusVinculo='descartada',statusResposta='descartada_admin',updatedAt=CURRENT_TIMESTAMP WHERE id=? AND statusVinculo='pendente'`,
        [resposta.id],
      );
      await audit(
        connection,
        req,
        "resposta_pendente_descartada",
        "Resposta pendente descartada manualmente pelo administrador sem exclusão física.",
        null,
        Number(resposta.id),
      );
      await connection.commit();

      const [readbackRows] = (await connection.execute(
        `SELECT statusVinculo,statusResposta FROM programa_integracao_respostas WHERE id=? LIMIT 1`,
        [resposta.id],
      )) as any;
      const saved = readbackRows?.[0];
      if (!saved || saved.statusVinculo !== "descartada") {
        return res.status(500).json({ error: "O descarte foi processado, mas a confirmação de leitura falhou. Recarregue antes de tentar novamente." });
      }

      res.setHeader("Cache-Control", "no-store");
      return res.json({ ok: true });
    } catch (error) {
      try { await connection.rollback(); } catch { /* sem ação adicional */ }
      console.error("[ProgramaIntegracao] descartar resposta pendente:", error);
      return res.status(500).json({ error: "Não foi possível descartar a resposta pendente. Nenhuma alteração parcial foi mantida." });
    }
  },
);
