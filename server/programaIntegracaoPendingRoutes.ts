import { Router, type NextFunction, type Request, type Response } from "express";
import { getRawConnection } from "./db";
import { sdk } from "./_core/sdk";
import { itemIdDoFormulario, type ProgramaIntegracaoFormKey } from "./programaIntegracaoDefinitions";

export const programaIntegracaoPendingRouter = Router();

const FORM_KEYS = new Set<ProgramaIntegracaoFormKey>(["controle", "bem", "pesquisa", "aval", "pdi"]);
const SIM_BOA = 0.8;
const SIM_MIN = 0.4;

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

function normTxt(value: unknown) {
  return String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}
function bigr(s: string) {
  const out: string[] = [];
  for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
  return out;
}
function dice(a: string, b: string) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const A = bigr(a), B = bigr(b), counts: Record<string, number> = {};
  let hits = 0;
  A.forEach((x) => { counts[x] = (counts[x] || 0) + 1; });
  B.forEach((x) => { if ((counts[x] || 0) > 0) { counts[x]--; hits++; } });
  return (2 * hits) / (A.length + B.length);
}
function simNome(a0: unknown, b0: unknown) {
  const a = normTxt(a0), b = normTxt(b0);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const d = dice(a, b), ta = a.split(" ").filter((x) => x.length > 2), tb = b.split(" ").filter((x) => x.length > 2);
  if (!ta.length || !tb.length) return d;
  let soma = 0;
  ta.forEach((x) => {
    let best = 0;
    tb.forEach((y) => { const s = x === y ? 1 : dice(x, y); if (s > best) best = s; });
    if (best > 0.7) soma += best;
  });
  const cob = soma / Math.max(ta.length, tb.length), pri = ta[0] === tb[0] ? 1 : dice(ta[0], tb[0]);
  return Math.max(d, cob * 0.7 + pri * 0.3);
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

async function buscarCandidatos(connection: any, dados: { nomeColaborador: string; emailColaborador: string; unidade: string; dataInicio: string }) {
  const [rows] = (await connection.execute(
    `SELECT id,legacyId,nome,email,emailCorporativo,unidade,inicio FROM programa_integracao_processos WHERE situacao<>'removido'`,
  )) as any;
  const nome = String(dados.nomeColaborador || "").trim();
  if (!nome) return { status: "nenhum", candidatos: [] as any[] };
  const emailQ = normTxt(dados.emailColaborador), unidQ = String(dados.unidade || "").trim(), dataQ = String(dados.dataInicio || "").slice(0, 10);
  const candidatos = (rows || []).map((p: any) => {
    const s = Math.max(simNome(nome, p.nome), 0);
    const emailBate = !!(emailQ && ((p.email && normTxt(p.email) === emailQ) || (p.emailCorporativo && normTxt(p.emailCorporativo) === emailQ)));
    const unidBate = !!(unidQ && p.unidade && simNome(unidQ, p.unidade) >= SIM_BOA);
    const inicio = p.inicio ? String(p.inicio).slice(0, 10) : "";
    const dataBate = !!(dataQ && inicio === dataQ);
    const sinais: string[] = [];
    if (emailBate) sinais.push("e-mail");
    if (unidBate) sinais.push("unidade");
    if (dataBate) sinais.push("data de início");
    return {
      id: p.legacyId || `p${p.id}`,
      nome: p.nome,
      nameScore: s,
      ajuste: s + (emailBate ? 0.35 : 0) + (unidBate ? 0.12 : 0) + (dataBate ? 0.12 : 0),
      sinais,
    };
  }).filter((c: any) => c.nameScore > 0 || c.sinais.length).sort((a: any, b: any) => b.ajuste - a.ajuste);
  if (!candidatos.length) return { status: "nenhum", candidatos: [] };
  const top = candidatos[0], seg = candidatos[1];
  const forte = top.sinais.includes("e-mail") || (top.nameScore >= SIM_MIN && top.sinais.length >= 2) || top.nameScore >= SIM_BOA;
  const folga = !seg || top.ajuste - seg.ajuste >= 0.15;
  const status = top.nameScore >= SIM_MIN && forte && folga ? "ok" : "ambiguo";
  return {
    status,
    candidatos: candidatos.slice(0, 5).map((c: any) => ({ id: c.id, nome: c.nome, pct: Math.round(Math.min(c.ajuste, 1) * 100), sinais: c.sinais })),
  };
}

function aplicarMarcacaoResposta(estadoOriginal: unknown, itemId: string | null, nota: string) {
  const estado = asJson<Record<string, any>>(estadoOriginal, {});
  estado.feito = estado.feito || {};
  if (!itemId) return estado;
  const ficha = estado.feito[itemId] && typeof estado.feito[itemId] === "object" ? estado.feito[itemId] : {};
  ficha.s = "ok";
  ficha.d = ficha.d || todayIso();
  ficha.notas = Array.isArray(ficha.notas) ? ficha.notas : [];
  ficha.notas.push({ d: nowBr(), t: nota });
  estado.feito[itemId] = ficha;
  return estado;
}

programaIntegracaoPendingRouter.post(
  "/api/programa-integracao/respostas-pendentes/:legacyRid/rebuscar",
  requireAdmin,
  async (req, res) => {
    const connection = await getRawConnection();
    if (!connection) return res.status(503).json({ error: "Banco de dados indisponível." });
    const legacyRid = sanitizeLegacyId(req.params.legacyRid);
    if (!legacyRid) return res.status(400).json({ error: "Resposta inválida." });

    const dados = {
      nomeColaborador: String(req.body?.nomeColaborador || "").trim(),
      unidade: String(req.body?.unidade || "").trim(),
      dataInicio: String(req.body?.dataInicio || "").trim().slice(0, 10),
      emailColaborador: String(req.body?.emailColaborador || "").trim(),
    };
    if (!dados.nomeColaborador) return res.status(400).json({ error: "Informe o nome do colaborador antes de buscar novamente." });

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

      const busca = await buscarCandidatos(connection, dados);
      await connection.execute(
        `UPDATE programa_integracao_respostas SET nomeColaborador=?,unidade=?,dataInicio=?,emailColaborador=?,candidatos=?,motivoPendencia=?,updatedAt=CURRENT_TIMESTAMP WHERE id=? AND statusVinculo='pendente'`,
        [dados.nomeColaborador, dados.unidade || null, dados.dataInicio || null, dados.emailColaborador || null, JSON.stringify(busca.candidatos), busca.status, resposta.id],
      );
      await audit(connection, req, "resposta_pendente_rebuscada", "Dados de identificação da resposta pendente revisados e candidatos recalculados.", null, Number(resposta.id), { status: busca.status, totalCandidatos: busca.candidatos.length });
      await connection.commit();

      const [readback] = (await connection.execute(
        `SELECT nomeColaborador,unidade,dataInicio,emailColaborador,candidatos,motivoPendencia FROM programa_integracao_respostas WHERE id=? LIMIT 1`,
        [resposta.id],
      )) as any;
      const saved = readback?.[0];
      if (!saved) return res.status(500).json({ error: "A revisão foi processada, mas a leitura de confirmação falhou." });
      res.setHeader("Cache-Control", "no-store");
      return res.json({ ok: true, status: saved.motivoPendencia || busca.status, candidatos: asJson(saved.candidatos, []) });
    } catch (error) {
      try { await connection.rollback(); } catch { /* sem ação adicional */ }
      console.error("[ProgramaIntegracao] rebuscar resposta pendente:", error);
      return res.status(500).json({ error: "Não foi possível revisar e buscar novamente. Nenhuma alteração parcial foi mantida." });
    }
  },
);

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
        const estado = aplicarMarcacaoResposta(processo.estado, itemId, "Resposta pública revisada e vinculada manualmente pelo administrador.");
        await connection.execute(`UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`, [JSON.stringify(estado), processoId]);
      }

      await audit(connection, req, "resposta_pendente_vinculada", "Resposta pendente vinculada manualmente a um processo existente.", processoId, Number(resposta.id), { formKey, cycle, role });
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

programaIntegracaoPendingRouter.post(
  "/api/programa-integracao/respostas-pendentes/:legacyRid/criar-processo",
  requireAdmin,
  async (req, res) => {
    const connection = await getRawConnection();
    if (!connection) return res.status(503).json({ error: "Banco de dados indisponível." });
    const legacyRid = sanitizeLegacyId(req.params.legacyRid);
    if (!legacyRid) return res.status(400).json({ error: "Resposta inválida." });

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
      if (formKey !== "controle" && formKey !== "bem") {
        await connection.rollback();
        return res.status(400).json({ error: "A criação de processo a partir da resposta só é permitida para Controle do Programa ou Bem Acolhido." });
      }

      const answers = asJson<Record<string, any>>(resposta.answers, {});
      const nome = String(resposta.nomeColaborador || answers.controle_nome || answers.bem_colaborador || "").trim();
      if (!nome) {
        await connection.rollback();
        return res.status(400).json({ error: "A resposta não possui nome suficiente para criar um processo." });
      }
      const inicio = String(resposta.dataInicio || answers.controle_data_inicio || answers.bem_data_inicio || todayIso()).slice(0, 10);
      const unidade = String(resposta.unidade || answers.controle_unidade || answers.bem_unidade || "").trim();
      const email = String(resposta.emailColaborador || answers.controle_email_pessoal || "").trim();
      const cpf = String(answers.controle_cpf || "").trim();
      const nasc = String(answers.controle_nascimento || "").trim();
      const tel = String(answers.controle_telefone || "").trim();
      const cargo = String(answers.controle_funcao || answers.bem_funcao || "").trim();
      const tipo = String(answers.controle_denominacao || "Onboarding").trim() || "Onboarding";
      const gestor = String(answers.controle_gestor || answers.bem_gestor || "").trim();
      const anjo = String(answers.bem_anjo || "").trim();
      const legacyId = `pi-pendente-${Number(resposta.id)}`;

      const [existingRows] = (await connection.execute(
        `SELECT id FROM programa_integracao_processos WHERE legacyId=? LIMIT 1`,
        [legacyId],
      )) as any;
      if (existingRows?.[0]) {
        await connection.rollback();
        return res.status(409).json({ error: "Já existe um processo criado a partir desta resposta. Recarregue a tela antes de tentar novamente." });
      }
      const [orderRows] = (await connection.execute(`SELECT COALESCE(MAX(ordem),0) AS maxOrdem FROM programa_integracao_processos`)) as any;
      const ordem = Number(orderRows?.[0]?.maxOrdem || 0) + 1;
      const itemId = itemIdDoFormulario(formKey, 0, "") || null;
      const estado = aplicarMarcacaoResposta({ feito: {}, alin: {}, bem: {}, teste: {} }, itemId, "Processo criado a partir de resposta pública revisada pelo administrador.");

      const [insertResult] = (await connection.execute(
        `INSERT INTO programa_integracao_processos (legacyId,alunoId,ordem,nome,cpf,nasc,email,emailCorporativo,tel,cargo,unidade,tipo,inicio,participacao,situacao,gestor,gestorEmail,gestorTel,anjo,anjoEmail,consultora,mentorLegacyId,ugp,horarios,statusPdi,pendencias,statusCursos,consideracoes,notas,cor,estado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [legacyId, null, ordem, nome, cpf || null, nasc || null, email || null, null, tel || null, cargo || null, unidade || null, tipo, inicio, "Presencial", "ativo", gestor || null, null, null, anjo || null, null, null, null, null, null, null, null, null, null, null, null, JSON.stringify(estado)],
      )) as any;
      const processoId = Number(insertResult.insertId);
      const dedupeKey = `${formKey}|${processoId}|0||${resposta.id}`;
      await connection.execute(
        `UPDATE programa_integracao_respostas SET processoId=?,ciclo=0,papel='',itemId=?,dedupeKey=?,statusVinculo='vinculada',statusResposta='valido',motivoPendencia=NULL,candidatos=NULL,updatedAt=CURRENT_TIMESTAMP WHERE id=? AND statusVinculo='pendente'`,
        [processoId, itemId, dedupeKey, resposta.id],
      );
      await audit(connection, req, "processo_criado_de_resposta_pendente", "Novo processo criado a partir de resposta pendente confirmada pelo administrador.", processoId, Number(resposta.id), { formKey });
      await connection.commit();

      const [readback] = (await connection.execute(
        `SELECT p.legacyId,p.nome,r.statusVinculo,r.processoId FROM programa_integracao_processos p JOIN programa_integracao_respostas r ON r.processoId=p.id WHERE p.id=? AND r.id=? LIMIT 1`,
        [processoId, resposta.id],
      )) as any;
      const saved = readback?.[0];
      if (!saved || saved.statusVinculo !== "vinculada" || Number(saved.processoId) !== processoId) {
        return res.status(500).json({ error: "O processo foi criado, mas a leitura de confirmação falhou. Recarregue antes de tentar novamente." });
      }
      res.setHeader("Cache-Control", "no-store");
      return res.json({ ok: true, processoId: saved.legacyId, nome: saved.nome });
    } catch (error) {
      try { await connection.rollback(); } catch { /* sem ação adicional */ }
      console.error("[ProgramaIntegracao] criar processo de resposta pendente:", error);
      return res.status(500).json({ error: "Não foi possível criar o processo. Nenhuma alteração parcial foi mantida." });
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
      await audit(connection, req, "resposta_pendente_descartada", "Resposta pendente descartada manualmente pelo administrador sem exclusão física.", null, Number(resposta.id));
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
