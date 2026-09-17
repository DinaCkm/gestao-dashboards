import { Router, type NextFunction, type Request, type Response } from "express";
import { getRawConnection } from "./db";
import { sdk } from "./_core/sdk";
import {
  PROGRAMA_INTEGRACAO_QUESTION_INDEX,
  PROGRAMA_INTEGRACAO_ESCALAS,
  itemIdDoFormulario,
  type ProgramaIntegracaoFormKey,
} from "./programaIntegracaoDefinitions";

export const programaIntegracaoImportRouter = Router();

const FORM_KEYS = new Set<ProgramaIntegracaoFormKey>(["controle", "bem", "pesquisa", "aval", "pdi"]);
const FORM_NAMES: Record<ProgramaIntegracaoFormKey, string> = {
  controle: "Controle do Programa de Integração",
  bem: "Bem Acolhido em Nossa Unidade",
  pesquisa: "Pesquisa de Integração",
  aval: "Avaliação do Programa de Integração",
  pdi: "Acompanhamento do PDI",
};
const PROTO_PREFIX: Record<ProgramaIntegracaoFormKey, string> = {
  controle: "CTL",
  bem: "BEM",
  pesquisa: "PES",
  aval: "AVL",
  pdi: "PDI",
};

type DuplicateAction = "sub" | "reg" | "skip";
type ImportItem = {
  targetId?: string;
  nome?: string;
  cycle?: number;
  role?: string;
  evaluator?: string;
  when?: string;
  dateIso?: string;
  pairs?: Array<[number, string]>;
  duplicateAction?: DuplicateAction;
};

type EditResponseBody = {
  ciclo?: number;
  papel?: string;
  avaliador?: string;
  quando?: string;
  pairs?: Array<[number, string]>;
};

function asJson<T = any>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nowBr() {
  const n = new Date();
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(n).replace(",", "");
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

function answersFromPairs(formKey: ProgramaIntegracaoFormKey, pairs: Array<[number, string]>) {
  const qmap = PROGRAMA_INTEGRACAO_QUESTION_INDEX[formKey] || {};
  const byIndex = new Map<number, string>();
  Object.entries(qmap).forEach(([code, index]) => byIndex.set(Number(index), code));
  const answers: Record<string, string> = {};
  for (const pair of pairs) {
    if (!Array.isArray(pair) || pair.length < 2) continue;
    const index = Number(pair[0]);
    const code = byIndex.get(index);
    if (!code) continue;
    const value = String(pair[1] ?? "").trim();
    if (value !== "") answers[code] = value;
  }
  return answers;
}

function calcMedia(formKey: ProgramaIntegracaoFormKey, answers: Record<string, any>) {
  const escala = PROGRAMA_INTEGRACAO_ESCALAS[formKey];
  if (!escala) return { media: null as number | null, alertas: [] as number[] };
  const qmap = PROGRAMA_INTEGRACAO_QUESTION_INDEX[formKey] || {};
  let soma = 0;
  let qt = 0;
  const alertas: number[] = [];
  for (const [code, idx] of Object.entries(qmap)) {
    if (idx < escala.de || idx > escala.ate) continue;
    const n = Number(answers[code]);
    if (!Number.isFinite(n)) continue;
    const inverse = !!escala.inverso?.includes(idx);
    if (n > 0) {
      soma += inverse ? 6 - n : n;
      qt++;
    }
    if ((inverse && n >= 4) || (!inverse && n > 0 && n <= 2)) alertas.push(idx);
  }
  return { media: qt ? Math.round((soma / qt) * 10) / 10 : null, alertas };
}

function validateItem(formKey: ProgramaIntegracaoFormKey, item: ImportItem, index: number) {
  const targetId = String(item?.targetId || "").trim();
  if (!targetId || targetId === "__novo") return `Linha ${index + 1}: selecione um processo já existente antes de registrar.`;
  const cycle = Number(item?.cycle || 0);
  if (["pesquisa", "aval", "pdi"].includes(formKey) && (cycle < 1 || cycle > 4)) return `Linha ${index + 1}: alinhamento inválido.`;
  const role = String(item?.role || "");
  if (formKey === "aval" && !["Gestor", "Anjo"].includes(role)) return `Linha ${index + 1}: informe Gestor ou Anjo.`;
  const action = String(item?.duplicateAction || "sub");
  if (!new Set(["sub", "reg", "skip"]).has(action)) return `Linha ${index + 1}: política de duplicidade inválida.`;
  if (!Array.isArray(item?.pairs)) return `Linha ${index + 1}: conteúdo da resposta inválido.`;
  return null;
}

async function markTimelineItem(
  connection: any,
  processoId: number,
  itemId: string,
  formKey: ProgramaIntegracaoFormKey,
  cycle: number,
  role: string,
  media: number | null,
) {
  if (!itemId) return;
  const [rows] = (await connection.execute(
    `SELECT estado FROM programa_integracao_processos WHERE id=? LIMIT 1 FOR UPDATE`,
    [processoId],
  )) as any;
  const estado = asJson<Record<string, any>>(rows?.[0]?.estado, {});
  estado.feito = estado.feito || {};
  const ficha = estado.feito[itemId] && typeof estado.feito[itemId] === "object" ? estado.feito[itemId] : {};
  ficha.s = "ok";
  ficha.d = ficha.d || todayIso();
  ficha.notas = Array.isArray(ficha.notas) ? ficha.notas : [];
  ficha.notas.push({
    d: nowBr(),
    t: `Resposta importada — ${FORM_NAMES[formKey]}${cycle ? ` · ${cycle}º ciclo` : ""}${role ? ` · ${role}` : ""}${media != null ? ` · média ${media.toFixed(1).replace(".", ",")}` : ""}.`,
  });
  estado.feito[itemId] = ficha;
  await connection.execute(
    `UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
    [JSON.stringify(estado), processoId],
  );
}

programaIntegracaoImportRouter.post("/api/programa-integracao/respostas/importar-lote", requireAdmin, async (req, res) => {
  const connection = await getRawConnection();
  if (!connection) return res.status(503).json({ error: "Banco de dados indisponível." });

  const formKey = String(req.body?.formKey || "") as ProgramaIntegracaoFormKey;
  const items = Array.isArray(req.body?.items) ? req.body.items as ImportItem[] : [];
  if (!FORM_KEYS.has(formKey)) return res.status(400).json({ error: "Formulário inválido." });
  if (!items.length) return res.status(400).json({ error: "Nenhuma resposta selecionada para registrar." });
  if (items.length > 200) return res.status(400).json({ error: "O lote está grande demais. Registre no máximo 200 respostas por vez." });

  for (let i = 0; i < items.length; i++) {
    const validationError = validateItem(formKey, items[i], i);
    if (validationError) return res.status(400).json({ error: validationError });
  }

  const summary = { registradas: 0, substituidas: 0, adicionais: 0, ignoradas: 0, processos: new Set<string>() };

  try {
    await connection.beginTransaction();

    for (const item of items) {
      const action = (item.duplicateAction || "sub") as DuplicateAction;
      if (action === "skip") {
        summary.ignoradas++;
        continue;
      }

      const targetId = String(item.targetId || "").trim();
      const [processRows] = (await connection.execute(
        `SELECT id,legacyId,nome FROM programa_integracao_processos WHERE legacyId=? AND situacao<>'removido' LIMIT 1 FOR UPDATE`,
        [targetId],
      )) as any;
      const processRow = processRows?.[0];
      if (!processRow) throw new Error(`Processo ${targetId} não encontrado.`);

      const processoId = Number(processRow.id);
      const cycle = Number(item.cycle || 0);
      const role = String(item.role || "");
      const evaluator = String(item.evaluator || "").trim() || null;
      const whenOriginal = String(item.when || "").trim() || null;
      const emOriginal = String(item.dateIso || "").slice(0, 10) || null;
      const answers = answersFromPairs(formKey, item.pairs || []);
      const { media, alertas } = calcMedia(formKey, answers);
      const itemId = itemIdDoFormulario(formKey, cycle, role) || null;

      const [duplicates] = (await connection.execute(
        `SELECT id,legacyRid,protocolo FROM programa_integracao_respostas WHERE processoId=? AND formKey=? AND ciclo=? AND COALESCE(papel,'')=? AND statusVinculo='vinculada' ORDER BY id DESC LIMIT 1 FOR UPDATE`,
        [processoId, formKey, cycle, role],
      )) as any;
      const existing = duplicates?.[0] || null;

      if (existing && action === "sub") {
        await connection.execute(
          `UPDATE programa_integracao_respostas SET statusVinculo='descartada',statusResposta='substituida_admin',updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
          [existing.id],
        );
        await audit(
          connection,
          req,
          "resposta_substituida_importacao",
          "Resposta anterior preservada no histórico e substituída por nova importação administrativa.",
          processoId,
          Number(existing.id),
          { formKey, cycle, role },
        );
        summary.substituidas++;
      } else if (existing && action === "reg") {
        summary.adicionais++;
      }

      const [insert] = (await connection.execute(
        `INSERT INTO programa_integracao_respostas (processoId,formKey,ciclo,papel,itemId,formVersion,statusVinculo,statusResposta,nomeOrig,avaliador,respondentName,source,media,alertas,answers,quandoOriginal,emOriginal,submittedAt) VALUES (?,?,?,?,?,1,'vinculada','valido',?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
        [
          processoId,
          formKey,
          cycle,
          role || null,
          itemId,
          String(item.nome || processRow.nome || "").trim() || processRow.nome || null,
          evaluator,
          evaluator,
          "importacao",
          media,
          JSON.stringify(alertas),
          JSON.stringify(answers),
          whenOriginal,
          emOriginal,
        ],
      )) as any;

      const respostaId = Number(insert.insertId);
      const protocolo = `${PROTO_PREFIX[formKey]}-${String(respostaId).padStart(6, "0")}`;
      const legacyRid = `rpi${respostaId}`;
      const dedupeKey = `${formKey}|${processoId}|${cycle}|${role}|${respostaId}`;
      await connection.execute(
        `UPDATE programa_integracao_respostas SET protocolo=?,legacyRid=?,dedupeKey=? WHERE id=?`,
        [protocolo, legacyRid, dedupeKey, respostaId],
      );

      await markTimelineItem(connection, processoId, itemId || "", formKey, cycle, role, media);
      await audit(
        connection,
        req,
        "resposta_importada",
        "Resposta registrada por importação administrativa.",
        processoId,
        respostaId,
        { formKey, cycle, role, duplicateAction: action },
      );

      summary.registradas++;
      summary.processos.add(targetId);
    }

    await connection.commit();
    return res.json({
      ok: true,
      resumo: {
        registradas: summary.registradas,
        substituidas: summary.substituidas,
        adicionais: summary.adicionais,
        ignoradas: summary.ignoradas,
        processosAtualizados: summary.processos.size,
      },
    });
  } catch (error) {
    try { await connection.rollback(); } catch (rollbackError) { console.error("[ProgramaIntegracao] rollback importação:", rollbackError); }
    console.error("[ProgramaIntegracao] importar respostas:", error);
    return res.status(500).json({ error: "Nenhuma resposta foi gravada. O lote foi revertido porque ocorreu um erro." });
  }
});

programaIntegracaoImportRouter.patch("/api/programa-integracao/respostas/:legacyRid", requireAdmin, async (req, res) => {
  const connection = await getRawConnection();
  if (!connection) return res.status(503).json({ error: "Banco de dados indisponível." });
  const rid = String(req.params.legacyRid || "").trim().slice(0, 100);
  const body = (req.body || {}) as EditResponseBody;
  if (!rid) return res.status(400).json({ error: "Resposta inválida." });
  if (!Array.isArray(body.pairs)) return res.status(400).json({ error: "Campos da resposta inválidos." });

  try {
    await connection.beginTransaction();
    const [rows] = (await connection.execute(
      `SELECT id,processoId,formKey,ciclo,papel,itemId FROM programa_integracao_respostas WHERE legacyRid=? AND statusVinculo='vinculada' LIMIT 1 FOR UPDATE`,
      [rid],
    )) as any;
    const row = rows?.[0];
    if (!row) {
      await connection.rollback();
      return res.status(404).json({ error: "Resposta vinculada não encontrada." });
    }

    const formKey = String(row.formKey || "") as ProgramaIntegracaoFormKey;
    if (!FORM_KEYS.has(formKey)) throw new Error("Formulário da resposta é inválido.");
    const ciclo = Number(body.ciclo ?? row.ciclo ?? 0);
    if (ciclo < 0 || ciclo > 4) {
      await connection.rollback();
      return res.status(400).json({ error: "Momento/alinhamento inválido." });
    }
    const papel = String(body.papel ?? row.papel ?? "").trim();
    if (formKey === "aval" && !["Gestor", "Anjo"].includes(papel)) {
      await connection.rollback();
      return res.status(400).json({ error: "Na Avaliação do Programa, informe Gestor ou Anjo." });
    }
    const avaliador = String(body.avaliador ?? "").trim();
    const quando = String(body.quando ?? "").trim().slice(0, 80);
    const answers = answersFromPairs(formKey, body.pairs);
    const { media, alertas } = calcMedia(formKey, answers);

    await connection.execute(
      `UPDATE programa_integracao_respostas SET ciclo=?,papel=?,avaliador=?,answers=?,media=?,alertas=?,quandoOriginal=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
      [ciclo, papel || null, avaliador || null, JSON.stringify(answers), media, JSON.stringify(alertas), quando || null, row.id],
    );
    await audit(
      connection,
      req,
      "resposta_editada",
      "Resposta vinculada corrigida pelo administrador; média e alertas foram recalculados.",
      Number(row.processoId || 0) || null,
      Number(row.id),
      {
        formKey,
        cicloAnterior: Number(row.ciclo || 0),
        cicloNovo: ciclo,
        papelAnterior: String(row.papel || ""),
        papelNovo: papel,
        itemIdPreservado: String(row.itemId || ""),
      },
    );
    await connection.commit();
    return res.json({ ok: true, media, alertas });
  } catch (error) {
    try { await connection.rollback(); } catch (rollbackError) { console.error("[ProgramaIntegracao] rollback edição resposta:", rollbackError); }
    console.error("[ProgramaIntegracao] editar resposta:", error);
    return res.status(500).json({ error: "Não foi possível salvar a resposta. Nenhuma alteração parcial foi mantida." });
  }
});
