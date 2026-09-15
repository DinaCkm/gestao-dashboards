import { Router, type NextFunction, type Request, type Response } from "express";
import { PROGRAMA_INTEGRACAO_CATALOG } from "./programaIntegracaoCatalog";
import { getRawConnection } from "./db";
import { sdk } from "./_core/sdk";
import {
  PROGRAMA_INTEGRACAO_ESCALAS,
  PROGRAMA_INTEGRACAO_QUESTION_INDEX,
  formKeyDoSlug,
  itemIdDoFormulario,
  type ProgramaIntegracaoFormKey,
} from "./programaIntegracaoDefinitions";

export const programaIntegracaoRouter = Router();

const FORM_NAMES: Record<ProgramaIntegracaoFormKey, string> = {
  controle: "Controle do Programa de Integração",
  bem: "Bem Acolhido em Nossa Unidade",
  pesquisa: "Pesquisa de Integração",
  aval: "Avaliação do Programa de Integração",
  pdi: "Acompanhamento do PDI",
};
const PROTO_PREFIX: Record<ProgramaIntegracaoFormKey, string> = {
  controle: "CTL", bem: "BEM", pesquisa: "PES", aval: "AVL", pdi: "PDI",
};
const SIM_BOA = 0.8;
const SIM_MIN = 0.4;

function asJson<T = any>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}
function normTxt(value: unknown) {
  return String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}
function bigr(s: string) { const out: string[] = []; for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2)); return out; }
function dice(a: string, b: string) {
  if (!a || !b) return 0; if (a === b) return 1; if (a.length < 2 || b.length < 2) return 0;
  const A = bigr(a), B = bigr(b), counts: Record<string, number> = {}; let hits = 0;
  A.forEach(x => { counts[x] = (counts[x] || 0) + 1; });
  B.forEach(x => { if ((counts[x] || 0) > 0) { counts[x]--; hits++; } });
  return (2 * hits) / (A.length + B.length);
}
function simNome(a0: unknown, b0: unknown) {
  const a = normTxt(a0), b = normTxt(b0); if (!a || !b) return 0; if (a === b) return 1;
  const d = dice(a, b), ta = a.split(" ").filter(x => x.length > 2), tb = b.split(" ").filter(x => x.length > 2);
  if (!ta.length || !tb.length) return d;
  let soma = 0;
  ta.forEach(x => { let best = 0; tb.forEach(y => { const s = x === y ? 1 : dice(x, y); if (s > best) best = s; }); if (best > 0.7) soma += best; });
  const cob = soma / Math.max(ta.length, tb.length), pri = ta[0] === tb[0] ? 1 : dice(ta[0], tb[0]);
  return Math.max(d, cob * 0.7 + pri * 0.3);
}
function todayIso() { return new Date().toISOString().slice(0, 10); }
function nowBr() {
  const n = new Date();
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(n).replace(",", "");
}
function sanitizeLegacyId(value: unknown) { return String(value ?? "").trim().slice(0, 100); }

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Acesso restrito ao administrador." });
    (req as any).authenticatedUser = user;
    next();
  } catch { return res.status(401).json({ error: "Sessão inválida ou expirada." }); }
}
async function getConnectionOr503(res: Response) {
  const connection = await getRawConnection();
  if (!connection) { res.status(503).json({ error: "Banco de dados indisponível." }); return null; }
  return connection;
}
async function audit(connection: any, req: Request | null, acao: string, detalhe: string, processoId?: number | null, respostaId?: number | null, metadata?: any) {
  try {
    const userId = req ? Number((req as any).authenticatedUser?.id || 0) || null : null;
    await connection.execute(
      `INSERT INTO programa_integracao_auditoria (processoId,respostaId,userId,acao,detalhe,metadata) VALUES (?,?,?,?,?,?)`,
      [processoId ?? null, respostaId ?? null, userId, acao, detalhe, metadata == null ? null : JSON.stringify(metadata)]
    );
  } catch (error) { console.warn("[ProgramaIntegracao] Falha ao registrar auditoria:", error); }
}

function responseToLegacy(row: any) {
  const answers = asJson<Record<string, any>>(row.answers, {});
  const qmap = PROGRAMA_INTEGRACAO_QUESTION_INDEX[row.formKey as ProgramaIntegracaoFormKey] || {};
  const c: Array<[number, string]> = [];
  Object.entries(answers).forEach(([code, value]) => {
    const idx = qmap[code]; if (idx != null && value != null && String(value).trim() !== "") c.push([idx, String(value)]);
  });
  return {
    rid: row.legacyRid || `db${row.id}`,
    protocolo: row.protocolo || "",
    form: row.formKey,
    ciclo: Number(row.ciclo || 0), papel: row.papel || "", quando: row.quandoOriginal || "",
    em: row.emOriginal || (row.submittedAt ? new Date(row.submittedAt).toISOString().slice(0, 10) : ""),
    itid: row.itemId || "", nomeOrig: row.nomeOrig || row.nomeColaborador || "", avaliador: row.avaliador || row.respondentName || "",
    c, media: row.media == null ? null : Number(row.media), alertas: asJson(row.alertas, []),
    source: row.source || "publico", status: row.statusResposta || "valido", formVersion: Number(row.formVersion || 1),
    processId: row.processoLegacyId || "", respondentName: row.respondentName || "", respondentEmail: row.respondentEmail || "",
    submittedAt: row.submittedAt ? new Date(row.submittedAt).toISOString() : "", answers,
  };
}
function pendingToLegacy(row: any) {
  return {
    id: row.legacyRid || `db${row.id}`, protocolo: row.protocolo || "", formKey: row.formKey,
    cycle: Number(row.ciclo || 0), role: row.papel || "", nomeColaborador: row.nomeColaborador || "",
    unidade: row.unidade || "", dataInicio: row.dataInicio ? String(row.dataInicio).slice(0, 10) : "",
    emailColaborador: row.emailColaborador || "", respondentName: row.respondentName || "",
    answers: asJson(row.answers, {}), motivo: row.motivoPendencia || "ambiguo", candidatos: asJson(row.candidatos, []),
    submittedAt: row.submittedAt ? new Date(row.submittedAt).toISOString() : "",
    erroRegistro: row.statusResposta === "registro_falhou" ? "Não foi possível registrar automaticamente; revise a resposta." : undefined,
  };
}

programaIntegracaoRouter.get("/api/programa-integracao/bootstrap", requireAdmin, async (req, res) => {
  try {
    const connection = await getConnectionOr503(res); if (!connection) return;
    const [configRows] = (await connection.execute(`SELECT chave, valor FROM programa_integracao_config WHERE chave='geral'`)) as any;
    const config = configRows?.[0] ? asJson(configRows[0].valor, {}) : {};
    const [processRows] = (await connection.execute(`SELECT * FROM programa_integracao_processos WHERE situacao <> 'removido' ORDER BY ordem,id`)) as any;
    const [responseRows] = (await connection.execute(`SELECT r.*, p.legacyId AS processoLegacyId FROM programa_integracao_respostas r LEFT JOIN programa_integracao_processos p ON p.id=r.processoId WHERE r.statusVinculo IN ('vinculada','pendente') ORDER BY r.id`)) as any;
    const processos: Record<string, any> = {};
    (processRows || []).forEach((row: any) => {
      const id = row.legacyId || `p${row.id}`;
      const estado = asJson<Record<string, any>>(row.estado, {});
      processos[id] = { ...estado,
        nome: row.nome || "", cpf: row.cpf || "", nasc: row.nasc ? String(row.nasc).slice(0,10) : "",
        email: row.email || "", emailCorporativo: row.emailCorporativo || "", tel: row.tel || "", cargo: row.cargo || "", unidade: row.unidade || "",
        tipo: row.tipo || "Onboarding", inicio: row.inicio ? String(row.inicio).slice(0,10) : "", part: row.participacao || "Presencial", situacao: row.situacao || "ativo",
        gestor: row.gestor || "", gestorEmail: row.gestorEmail || "", gestorTel: row.gestorTel || "", anjo: row.anjo || "", anjoEmail: row.anjoEmail || "",
        consultora: row.consultora || "", mentorId: row.mentorLegacyId || "", ugp: row.ugp || "", horarios: row.horarios || "",
        statusPdi: row.statusPdi || "", pendencias: row.pendencias || "", statusCursos: row.statusCursos || "", consideracoes: row.consideracoes || "", notas: row.notas || "", cor: row.cor || "",
        feito: estado.feito || {}, alin: estado.alin || {}, bem: estado.bem || {}, teste: estado.teste || {}, resp: [],
      };
    });
    const pendentes: any[] = [];
    (responseRows || []).forEach((row: any) => {
      if (row.statusVinculo === "pendente") pendentes.push(pendingToLegacy(row));
      else if (row.processoLegacyId && processos[row.processoLegacyId]) processos[row.processoLegacyId].resp.push(responseToLegacy(row));
    });
    const ordemBanco = (processRows || []).map((r: any) => r.legacyId || `p${r.id}`);
    const ordemConfig = Array.isArray(config.ordem) ? config.ordem.filter((id: string) => processos[id]) : [];
    ordemBanco.forEach((id: string) => { if (!ordemConfig.includes(id)) ordemConfig.push(id); });
    config.ordem = ordemConfig;
    config.respostasPendentes = pendentes;
    res.setHeader("Cache-Control", "no-store");
    return res.json({ ok: true, state: { config, processos } });
  } catch (error) {
    console.error("[ProgramaIntegracao] bootstrap:", error);
    return res.status(500).json({ error: "Não foi possível carregar o Programa de Integração." });
  }
});

programaIntegracaoRouter.put("/api/programa-integracao/config", requireAdmin, async (req, res) => {
  try {
    const connection = await getConnectionOr503(res); if (!connection) return;
    const incoming = req.body?.config && typeof req.body.config === "object" ? { ...req.body.config } : {};
    const pendentes = Array.isArray(incoming.respostasPendentes) ? incoming.respostasPendentes : [];
    delete incoming.respostasPendentes;
    await connection.execute(
      `INSERT INTO programa_integracao_config (chave,valor,updatedByUserId) VALUES ('geral',?,?) ON DUPLICATE KEY UPDATE valor=VALUES(valor),updatedByUserId=VALUES(updatedByUserId),updatedAt=CURRENT_TIMESTAMP`,
      [JSON.stringify(incoming), Number((req as any).authenticatedUser?.id || 0) || null]
    );
    const protocolos = new Set<string>();
    for (const p of pendentes) {
      const protocolo = String(p?.protocolo || "").trim(); if (!protocolo) continue; protocolos.add(protocolo);
      await connection.execute(
        `INSERT INTO programa_integracao_respostas (legacyRid,protocolo,formKey,ciclo,papel,statusVinculo,statusResposta,motivoPendencia,candidatos,nomeColaborador,unidade,dataInicio,emailColaborador,respondentName,source,answers,submittedAt)
         VALUES (?,?,?,?,?,'pendente',?,?,?,?,?,?,?,?, 'publico',?,?)
         ON DUPLICATE KEY UPDATE legacyRid=VALUES(legacyRid),ciclo=VALUES(ciclo),papel=VALUES(papel),motivoPendencia=VALUES(motivoPendencia),candidatos=VALUES(candidatos),nomeColaborador=VALUES(nomeColaborador),unidade=VALUES(unidade),dataInicio=VALUES(dataInicio),emailColaborador=VALUES(emailColaborador),respondentName=VALUES(respondentName),answers=VALUES(answers),updatedAt=CURRENT_TIMESTAMP`,
        [p.id || null, protocolo, p.formKey, Number(p.cycle || 0), p.role || "", p.erroRegistro ? "registro_falhou" : null, p.motivo || "ambiguo", JSON.stringify(p.candidatos || []), p.nomeColaborador || "", p.unidade || "", p.dataInicio || null, p.emailColaborador || "", p.respondentName || "", JSON.stringify(p.answers || {}), p.submittedAt ? new Date(p.submittedAt) : new Date()]
      );
    }
    const [pendingRows] = (await connection.execute(`SELECT id,protocolo FROM programa_integracao_respostas WHERE statusVinculo='pendente'`)) as any;
    for (const row of pendingRows || []) {
      if (row.protocolo && !protocolos.has(String(row.protocolo))) {
        await connection.execute(`UPDATE programa_integracao_respostas SET statusVinculo='descartada',statusResposta='descartada_admin',updatedAt=CURRENT_TIMESTAMP WHERE id=? AND statusVinculo='pendente'`, [row.id]);
        await audit(connection, req, "resposta_pendente_descartada", "Resposta retirada da fila de pendências pelo administrador.", null, Number(row.id));
      }
    }
    await audit(connection, req, "config_atualizada", "Configuração do Programa de Integração atualizada.");
    return res.json({ ok: true });
  } catch (error) {
    console.error("[ProgramaIntegracao] salvar config:", error);
    return res.status(500).json({ error: "Não foi possível salvar as configurações." });
  }
});

programaIntegracaoRouter.put("/api/programa-integracao/processos/:legacyId", requireAdmin, async (req, res) => {
  try {
    const connection = await getConnectionOr503(res); if (!connection) return;
    const legacyId = sanitizeLegacyId(req.params.legacyId); const p = req.body?.processo;
    if (!legacyId || !p || typeof p !== "object") return res.status(400).json({ error: "Processo inválido." });
    const ordem = Number(req.body?.ordem ?? 0) || 0;
    const estado = { ...p }; delete estado.resp;
    const values = [legacyId, null, ordem, String(p.nome || "Sem nome"), p.cpf || null, p.nasc || null, p.email || null, p.emailCorporativo || null, p.tel || null, p.cargo || null, p.unidade || null, p.tipo || "Onboarding", p.inicio || todayIso(), p.part || "Presencial", p.situacao || "ativo", p.gestor || null, p.gestorEmail || null, p.gestorTel || null, p.anjo || null, p.anjoEmail || null, p.consultora || null, p.mentorId || null, p.ugp || null, p.horarios || null, p.statusPdi || null, p.pendencias || null, p.statusCursos || null, p.consideracoes || null, p.notas || null, p.cor || null, JSON.stringify(estado)];
    await connection.execute(
      `INSERT INTO programa_integracao_processos (legacyId,alunoId,ordem,nome,cpf,nasc,email,emailCorporativo,tel,cargo,unidade,tipo,inicio,participacao,situacao,gestor,gestorEmail,gestorTel,anjo,anjoEmail,consultora,mentorLegacyId,ugp,horarios,statusPdi,pendencias,statusCursos,consideracoes,notas,cor,estado)
       VALUES (${Array(31).fill("?").join(",")}) ON DUPLICATE KEY UPDATE ordem=VALUES(ordem),nome=VALUES(nome),cpf=VALUES(cpf),nasc=VALUES(nasc),email=VALUES(email),emailCorporativo=VALUES(emailCorporativo),tel=VALUES(tel),cargo=VALUES(cargo),unidade=VALUES(unidade),tipo=VALUES(tipo),inicio=VALUES(inicio),participacao=VALUES(participacao),situacao=VALUES(situacao),gestor=VALUES(gestor),gestorEmail=VALUES(gestorEmail),gestorTel=VALUES(gestorTel),anjo=VALUES(anjo),anjoEmail=VALUES(anjoEmail),consultora=VALUES(consultora),mentorLegacyId=VALUES(mentorLegacyId),ugp=VALUES(ugp),horarios=VALUES(horarios),statusPdi=VALUES(statusPdi),pendencias=VALUES(pendencias),statusCursos=VALUES(statusCursos),consideracoes=VALUES(consideracoes),notas=VALUES(notas),cor=VALUES(cor),estado=VALUES(estado),updatedAt=CURRENT_TIMESTAMP`, values
    );
    const [prow] = (await connection.execute(`SELECT id FROM programa_integracao_processos WHERE legacyId=? LIMIT 1`, [legacyId])) as any;
    const processoId = Number(prow?.[0]?.id || 0);
    for (const r of Array.isArray(p.resp) ? p.resp : []) {
      const answers = r.answers && typeof r.answers === "object" ? r.answers : {};
      const protocolo = String(r.protocolo || "").trim() || null;
      const dedupeKey = `${legacyId}|${r.form || ""}|${Number(r.ciclo || 0)}|${r.papel || ""}|${r.rid || ""}`;
      const [existing] = (await connection.execute(`SELECT id FROM programa_integracao_respostas WHERE (protocolo IS NOT NULL AND protocolo=?) OR (legacyRid IS NOT NULL AND legacyRid=?) LIMIT 1`, [protocolo, r.rid || null])) as any;
      if (existing?.[0]?.id) {
        await connection.execute(`UPDATE programa_integracao_respostas SET processoId=?,legacyRid=?,protocolo=COALESCE(?,protocolo),dedupeKey=?,formKey=?,ciclo=?,papel=?,itemId=?,formVersion=?,statusVinculo='vinculada',statusResposta=?,nomeOrig=?,avaliador=?,respondentName=?,respondentEmail=?,source=?,media=?,alertas=?,answers=?,quandoOriginal=?,emOriginal=?,submittedAt=COALESCE(?,submittedAt),updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
          [processoId, r.rid || null, protocolo, dedupeKey, r.form, Number(r.ciclo || 0), r.papel || "", r.itid || null, Number(r.formVersion || 1), r.status || "valido", r.nomeOrig || null, r.avaliador || null, r.respondentName || null, r.respondentEmail || null, r.source || "admin", r.media ?? null, JSON.stringify(r.alertas || []), JSON.stringify(answers), r.quando || null, r.em || null, r.submittedAt ? new Date(r.submittedAt) : null, existing[0].id]);
      } else {
        await connection.execute(`INSERT INTO programa_integracao_respostas (processoId,legacyRid,protocolo,dedupeKey,formKey,ciclo,papel,itemId,formVersion,statusVinculo,statusResposta,nomeOrig,avaliador,respondentName,respondentEmail,source,media,alertas,answers,quandoOriginal,emOriginal,submittedAt) VALUES (?,?,?,?,?,?,?,?,?,'vinculada',?,?,?,?,?,?,?,?,?,?,?,?)`,
          [processoId, r.rid || null, protocolo, dedupeKey, r.form, Number(r.ciclo || 0), r.papel || "", r.itid || null, Number(r.formVersion || 1), r.status || "valido", r.nomeOrig || null, r.avaliador || null, r.respondentName || null, r.respondentEmail || null, r.source || "admin", r.media ?? null, JSON.stringify(r.alertas || []), JSON.stringify(answers), r.quando || null, r.em || null, r.submittedAt ? new Date(r.submittedAt) : new Date()]);
      }
    }
    await audit(connection, req, "processo_salvo", `Processo ${legacyId} salvo.`, processoId || null);
    return res.json({ ok: true, processoId });
  } catch (error) {
    console.error("[ProgramaIntegracao] salvar processo:", error);
    return res.status(500).json({ error: "Não foi possível salvar o processo." });
  }
});

programaIntegracaoRouter.delete("/api/programa-integracao/processos/:legacyId", requireAdmin, async (req, res) => {
  try {
    const connection = await getConnectionOr503(res); if (!connection) return;
    const legacyId = sanitizeLegacyId(req.params.legacyId);
    const [rows] = (await connection.execute(`SELECT id FROM programa_integracao_processos WHERE legacyId=? LIMIT 1`, [legacyId])) as any;
    if (!rows?.[0]) return res.json({ ok: true });
    await connection.execute(`UPDATE programa_integracao_processos SET situacao='removido',updatedAt=CURRENT_TIMESTAMP WHERE id=?`, [rows[0].id]);
    await audit(connection, req, "processo_arquivado", `Processo ${legacyId} removido da visão administrativa sem exclusão física.`, Number(rows[0].id));
    return res.json({ ok: true });
  } catch (error) { console.error("[ProgramaIntegracao] arquivar processo:", error); return res.status(500).json({ error: "Não foi possível remover o processo." }); }
});

programaIntegracaoRouter.delete("/api/programa-integracao/respostas/:legacyRid", requireAdmin, async (req, res) => {
  try {
    const connection = await getConnectionOr503(res); if (!connection) return;
    const rid = sanitizeLegacyId(req.params.legacyRid);
    const [rows] = (await connection.execute(`SELECT id,processoId FROM programa_integracao_respostas WHERE legacyRid=? LIMIT 1`, [rid])) as any;
    if (!rows?.[0]) return res.json({ ok: true });
    await connection.execute(`UPDATE programa_integracao_respostas SET statusVinculo='descartada',statusResposta='removida_admin',updatedAt=CURRENT_TIMESTAMP WHERE id=?`, [rows[0].id]);
    await audit(connection, req, "resposta_arquivada", `Resposta ${rid} removida da visão sem exclusão física.`, rows[0].processoId, rows[0].id);
    return res.json({ ok: true });
  } catch (error) { console.error("[ProgramaIntegracao] arquivar resposta:", error); return res.status(500).json({ error: "Não foi possível remover a resposta." }); }
});

programaIntegracaoRouter.get("/api/public/programa-integracao/forms/:slug", async (req, res) => {
  try {
    const formKey = formKeyDoSlug(req.params.slug); if (!formKey) return res.status(404).json({ error: "Formulário não encontrado." });
    const connection = await getConnectionOr503(res); if (!connection) return;
    const [rows] = (await connection.execute(`SELECT valor FROM programa_integracao_config WHERE chave='geral' LIMIT 1`)) as any;
    const config = rows?.[0] ? asJson(rows[0].valor, {}) : {};
    const cfg = config?.formConfig?.[formKey] || { active: true, version: 1 };
    res.setHeader("Cache-Control", "no-store");
    return res.json({ ok: true, formKey, formName: FORM_NAMES[formKey], active: cfg.active !== false, version: Number(cfg.version || 1), textos: config?.formTextos?.[formKey] || null });
  } catch (error) { console.error("[ProgramaIntegracao] public form:", error); return res.status(500).json({ error: "Não foi possível abrir o formulário." }); }
});

function calcMedia(formKey: ProgramaIntegracaoFormKey, answers: Record<string, any>) {
  const escala = PROGRAMA_INTEGRACAO_ESCALAS[formKey]; if (!escala) return { media: null, alertas: [] as number[] };
  const qmap = PROGRAMA_INTEGRACAO_QUESTION_INDEX[formKey] || {}; let soma = 0, qt = 0; const alertas: number[] = [];
  for (const [code, idx] of Object.entries(qmap)) {
    if (idx < escala.de || idx > escala.ate) continue;
    const n = Number(answers[code]); if (!Number.isFinite(n)) continue;
    const inv = !!escala.inverso?.includes(idx);
    if (n > 0) { soma += inv ? 6 - n : n; qt++; }
    if ((inv && n >= 4) || (!inv && n > 0 && n <= 2)) alertas.push(idx);
  }
  return { media: qt ? Math.round((soma / qt) * 10) / 10 : null, alertas };
}
async function findProcess(connection: any, data: any) {
  const [rows] = (await connection.execute(`SELECT id,legacyId,nome,email,emailCorporativo,unidade,inicio FROM programa_integracao_processos WHERE situacao<>'removido'`)) as any;
  const nome = String(data.nomeColaborador || "").trim(); if (!nome) return { status: "nenhum", candidatos: [] as any[] };
  const emailQ = normTxt(data.emailColaborador), unidQ = String(data.unidade || "").trim(), dataQ = String(data.dataInicio || "").slice(0,10);
  const candidatos = (rows || []).map((p: any) => {
    const s = Math.max(simNome(nome, p.nome), 0);
    const emailBate = !!(emailQ && ((p.email && normTxt(p.email) === emailQ) || (p.emailCorporativo && normTxt(p.emailCorporativo) === emailQ)));
    const unidBate = !!(unidQ && p.unidade && simNome(unidQ, p.unidade) >= SIM_BOA);
    const inicio = p.inicio ? String(p.inicio).slice(0,10) : ""; const dataBate = !!(dataQ && inicio === dataQ);
    const sinais: string[] = []; if (emailBate) sinais.push("e-mail"); if (unidBate) sinais.push("unidade"); if (dataBate) sinais.push("data de início");
    return { dbId: Number(p.id), id: p.legacyId || `p${p.id}`, nome: p.nome, nameScore: s, ajuste: s + (emailBate ? .35 : 0) + (unidBate ? .12 : 0) + (dataBate ? .12 : 0), sinais };
  }).filter((c: any) => c.nameScore > 0 || c.sinais.length).sort((a: any,b: any) => b.ajuste-a.ajuste);
  if (!candidatos.length) return { status: "nenhum", candidatos: [] };
  const top = candidatos[0], seg = candidatos[1];
  const forte = top.sinais.includes("e-mail") || (top.nameScore >= SIM_MIN && top.sinais.length >= 2) || top.nameScore >= SIM_BOA;
  const folga = !seg || top.ajuste - seg.ajuste >= .15;
  if (top.nameScore >= SIM_MIN && forte && folga) return { status: "ok", processo: top, candidatos: candidatos.slice(0,5) };
  return { status: candidatos.some((c:any) => c.nameScore >= SIM_MIN || c.sinais.length) ? "ambiguo" : "nenhum", candidatos: candidatos.slice(0,5) };
}
async function insertResponse(connection: any, data: any, formKey: ProgramaIntegracaoFormKey, version: number, match: any, statusVinculo: "vinculada"|"pendente", motivo: string | null) {
  const cycle = Number(data.cycle || 0), role = String(data.role || ""), answers = data.answers && typeof data.answers === "object" ? data.answers : {};
  const itemId = statusVinculo === "vinculada" ? itemIdDoFormulario(formKey, cycle, role) : null;
  const { media, alertas } = calcMedia(formKey, answers);
  const candidatos = (match?.candidatos || []).map((c:any) => ({ id: c.id, nome: c.nome, pct: Math.round(Math.min(c.ajuste,1)*100) }));
  const processoId = statusVinculo === "vinculada" ? Number(match.processo.dbId) : null;
  const [result] = (await connection.execute(
    `INSERT INTO programa_integracao_respostas (processoId,formKey,ciclo,papel,itemId,formVersion,statusVinculo,statusResposta,motivoPendencia,candidatos,nomeColaborador,unidade,dataInicio,emailColaborador,respondentName,respondentEmail,source,media,alertas,answers,submittedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
    [processoId, formKey, cycle, role || null, itemId, version, statusVinculo, motivo === "registro_falhou" ? "registro_falhou" : "valido", motivo, JSON.stringify(candidatos), String(data.nomeColaborador || "").trim(), String(data.unidade || "").trim() || null, data.dataInicio || null, String(data.emailColaborador || "").trim() || null, String(data.respondentName || data.nomeColaborador || "").trim(), String(data.emailColaborador || "").trim() || null, "publico", media, JSON.stringify(alertas), JSON.stringify(answers)]
  )) as any;
  const id = Number(result.insertId); const protocolo = `${PROTO_PREFIX[formKey]}-${String(id).padStart(6,"0")}`; const legacyRid = `rpi${id}`;
  await connection.execute(`UPDATE programa_integracao_respostas SET protocolo=?,legacyRid=?,dedupeKey=? WHERE id=?`, [protocolo, legacyRid, `${formKey}|${processoId || 0}|${cycle}|${role}|${id}`, id]);
  if (statusVinculo === "vinculada" && processoId && itemId) {
    const [pr] = (await connection.execute(`SELECT estado FROM programa_integracao_processos WHERE id=? LIMIT 1`, [processoId])) as any;
    const estado = asJson<Record<string, any>>(pr?.[0]?.estado, {}); estado.feito = estado.feito || {};
    const ficha = estado.feito[itemId] && typeof estado.feito[itemId] === "object" ? estado.feito[itemId] : {};
    ficha.s = "ok"; ficha.d = ficha.d || todayIso(); ficha.notas = Array.isArray(ficha.notas) ? ficha.notas : [];
    ficha.notas.push({ d: nowBr(), t: `Resposta registrada — ${FORM_NAMES[formKey]}${cycle ? ` · ${cycle}º ciclo` : ""}${role ? ` · ${role}` : ""}${media != null ? ` · média ${media.toFixed(1).replace('.',',')}` : ""}.` });
    estado.feito[itemId] = ficha;
    await connection.execute(`UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`, [JSON.stringify(estado), processoId]);
  }
  return { id, protocolo, legacyRid, processoId, itemId };
}

programaIntegracaoRouter.post("/api/public/programa-integracao/forms/:slug/responses", async (req, res) => {
  try {
    const formKey = formKeyDoSlug(req.params.slug); if (!formKey) return res.status(404).json({ ok:false, erro:"Formulário não encontrado." });
    const connection = await getConnectionOr503(res); if (!connection) return;
    const [cfgRows] = (await connection.execute(`SELECT valor FROM programa_integracao_config WHERE chave='geral' LIMIT 1`)) as any;
    const config = cfgRows?.[0] ? asJson(cfgRows[0].valor, {}) : {}; const cfg = config?.formConfig?.[formKey] || { active:true, version:1, dupPolicy:"bloquear" };
    if (cfg.active === false) return res.status(409).json({ ok:false, erro:"Este formulário está desativado no momento." });
    const data = req.body || {}; if (!String(data.nomeColaborador || "").trim()) return res.status(400).json({ ok:false, erro:"Informe o nome do colaborador.", campo:"nomeColaborador" });
    const catalog = PROGRAMA_INTEGRACAO_CATALOG[req.params.slug];
    if (!catalog) return res.status(404).json({ ok:false, erro:"Formulário não encontrado." });
    if (catalog.identity.unidade && !String(data.unidade || "").trim()) return res.status(400).json({ ok:false, erro:"Informe a unidade.", campo:"unidade" });
    if (catalog.identity.dataInicio && !String(data.dataInicio || "").trim()) return res.status(400).json({ ok:false, erro:"Informe a data de início.", campo:"dataInicio" });
    if (catalog.identity.respondent && !String(data.respondentName || "").trim()) return res.status(400).json({ ok:false, erro:"Informe o nome de quem está respondendo.", campo:"respondentName" });
    if (catalog.identity.cycle && !Number(data.cycle || 0)) return res.status(400).json({ ok:false, erro:"Informe o período desta resposta.", campo:"cycle" });
    if (formKey === "aval" && !["Gestor","Anjo"].includes(String(data.role || ""))) return res.status(400).json({ ok:false, erro:"Informe se a resposta é do Gestor ou do Anjo.", campo:"role" });
    const answers = data.answers && typeof data.answers === "object" ? data.answers : {};
    for (const section of catalog.sections) {
      for (const question of section.questions) {
        const conditionalGestor = question.code === "aval_reacao_feedback" && String(data.role || "") === "Gestor";
        const required = question.required !== false || conditionalGestor;
        const value = answers[question.code];
        if (required && (value === undefined || value === null || String(value).trim() === "")) {
          return res.status(400).json({ ok:false, erro:`Preencha: ${question.label}`, campo:question.code });
        }
        if (question.type === "scale" && value !== undefined && value !== null && String(value).trim() !== "") {
          const n = Number(value); if (!Number.isInteger(n) || n < 0 || n > 5) return res.status(400).json({ ok:false, erro:`Valor inválido em: ${question.label}`, campo:question.code });
        }
      }
    }
    const match = await findProcess(connection, data);
    if (match.status === "ok") {
      const processoId = Number(match.processo.dbId), cycle = Number(data.cycle || 0), role = String(data.role || "");
      const [dups] = (await connection.execute(`SELECT id FROM programa_integracao_respostas WHERE processoId=? AND formKey=? AND ciclo=? AND COALESCE(papel,'')=? AND statusVinculo='vinculada' LIMIT 1`, [processoId, formKey, cycle, role])) as any;
      if (dups?.[0]) {
        const saved = await insertResponse(connection, data, formKey, Number(cfg.version || 1), { candidatos: match.candidatos }, "pendente", "registro_falhou");
        return res.json({ ok:true, pendente:true, protocolo:saved.protocolo });
      }
      const saved = await insertResponse(connection, data, formKey, Number(cfg.version || 1), match, "vinculada", null);
      return res.json({ ok:true, pendente:false, protocolo:saved.protocolo, processId:match.processo.id, marcouEtapa:!!saved.itemId });
    }
    const saved = await insertResponse(connection, data, formKey, Number(cfg.version || 1), match, "pendente", match.status || "ambiguo");
    return res.json({ ok:true, pendente:true, protocolo:saved.protocolo });
  } catch (error) {
    console.error("[ProgramaIntegracao] envio público:", error);
    return res.status(500).json({ ok:false, erro:"Não foi possível registrar a resposta. Tente novamente." });
  }
});
