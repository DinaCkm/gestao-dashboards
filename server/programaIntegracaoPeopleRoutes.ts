import { Router, type NextFunction, type Request, type Response } from "express";
import { getRawConnection } from "./db";
import { sdk } from "./_core/sdk";
import {
  PROGRAMA_INTEGRACAO_ESCALAS,
  PROGRAMA_INTEGRACAO_QUESTION_INDEX,
  type ProgramaIntegracaoFormKey,
} from "./programaIntegracaoDefinitions";

export const programaIntegracaoPeopleRouter = Router();

function sanitizeLegacyId(value: unknown) {
  return String(value ?? "").trim().slice(0, 100);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function asJson<T = any>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Acesso restrito ao administrador." });
    }
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

async function audit(
  connection: any,
  req: Request,
  acao: string,
  detalhe: string,
  processoId?: number | null,
  metadata?: any,
) {
  try {
    const userId = Number((req as any).authenticatedUser?.id || 0) || null;
    await connection.execute(
      `INSERT INTO programa_integracao_auditoria (processoId,respostaId,userId,acao,detalhe,metadata) VALUES (?,NULL,?,?,?,?)`,
      [processoId ?? null, userId, acao, detalhe, metadata == null ? null : JSON.stringify(metadata)],
    );
  } catch (error) {
    console.warn("[ProgramaIntegracaoPessoas] Falha ao registrar auditoria:", error);
  }
}

function calcularMediaAlertasDemo(formKey: ProgramaIntegracaoFormKey, pares: Array<[number, string]>) {
  const escala = PROGRAMA_INTEGRACAO_ESCALAS[formKey];
  if (!escala) return { media: null as number | null, alertas: [] as number[] };
  const mapa = new Map<number, string>(pares);
  let soma = 0;
  let qtd = 0;
  const alertas: number[] = [];
  for (let indice = escala.de; indice <= escala.ate; indice += 1) {
    const bruto = mapa.get(indice);
    if (bruto == null || bruto === "") continue;
    const valor = Number(String(bruto).replace(",", "."));
    if (!Number.isFinite(valor)) continue;
    const inverso = escala.inverso?.includes(indice) || false;
    if (valor > 0) {
      soma += inverso ? 6 - valor : valor;
      qtd += 1;
    }
    if ((inverso && valor >= 4) || (!inverso && valor > 0 && valor <= 2)) alertas.push(indice);
  }
  return { media: qtd ? Math.round((soma / qtd) * 10) / 10 : null, alertas };
}

function respostasDemoValidas(resp: unknown): Array<any> | null {
  if (!Array.isArray(resp) || resp.length < 1 || resp.length > 100) return null;
  const forms = new Set<ProgramaIntegracaoFormKey>(["controle", "bem", "pesquisa", "aval", "pdi"]);
  for (const r of resp) {
    if (!r || typeof r !== "object" || !forms.has(r.form as ProgramaIntegracaoFormKey) || !Array.isArray(r.c)) return null;
    if (r.c.length > 100 || r.c.some((par: any) => !Array.isArray(par) || par.length < 2 || !Number.isInteger(Number(par[0])))) return null;
  }
  return resp;
}

function answersDoDemo(formKey: ProgramaIntegracaoFormKey, pares: Array<[number, string]>) {
  const indiceParaChave = new Map<number, string>();
  Object.entries(PROGRAMA_INTEGRACAO_QUESTION_INDEX[formKey]).forEach(([chave, indice]) => indiceParaChave.set(indice, chave));
  const answers: Record<string, string> = {};
  pares.forEach(([indice, valor]) => {
    const chave = indiceParaChave.get(Number(indice));
    if (chave) answers[chave] = String(valor ?? "");
  });
  return answers;
}

programaIntegracaoPeopleRouter.post(
  "/api/programa-integracao/processos",
  requireAdmin,
  async (req, res) => {
    const connection = await getConnectionOr503(res);
    if (!connection) return;

    const legacyId = sanitizeLegacyId(req.body?.legacyId);
    const p = req.body?.processo;
    const nome = String(p?.nome || "").trim();
    const cpf = String(p?.cpf || "").trim();

    if (!/^p[a-z0-9]+$/i.test(legacyId)) {
      return res.status(400).json({ error: "Identificador do processo inválido." });
    }
    if (!p || typeof p !== "object" || !nome || !cpf) {
      return res.status(400).json({ error: "Informe nome e CPF para criar a nova pessoa." });
    }

    try {
      const [existing] = (await connection.execute(
        `SELECT id,situacao FROM programa_integracao_processos WHERE legacyId=? LIMIT 1`,
        [legacyId],
      )) as any;
      if (existing?.[0]) {
        return res.status(409).json({
          error: "Este identificador já existe. Nenhum dado foi sobrescrito; tente criar novamente.",
        });
      }

      const [ordemRows] = (await connection.execute(
        `SELECT COALESCE(MAX(ordem),-1) AS maior FROM programa_integracao_processos WHERE situacao<>'removido'`,
      )) as any;
      const ordem = Number.isFinite(Number(req.body?.ordem))
        ? Number(req.body.ordem)
        : Number(ordemRows?.[0]?.maior ?? -1) + 1;

      const estado = { ...p };
      delete estado.resp;
      const values = [
        legacyId, null, ordem, nome, cpf, p.nasc || null, p.email || null,
        p.emailCorporativo || null, p.tel || null, p.cargo || null, p.unidade || null,
        p.tipo || "Onboarding", p.inicio || todayIso(), p.part || "Presencial", "ativo",
        p.gestor || null, p.gestorEmail || null, p.gestorTel || null, p.anjo || null,
        p.anjoEmail || null, p.consultora || null, p.mentorId || null, p.ugp || null,
        p.horarios || null, p.statusPdi || null, p.pendencias || null, p.statusCursos || null,
        p.consideracoes || null, p.notas || null, p.cor || null, JSON.stringify(estado),
      ];

      const [result] = (await connection.execute(
        `INSERT INTO programa_integracao_processos (legacyId,alunoId,ordem,nome,cpf,nasc,email,emailCorporativo,tel,cargo,unidade,tipo,inicio,participacao,situacao,gestor,gestorEmail,gestorTel,anjo,anjoEmail,consultora,mentorLegacyId,ugp,horarios,statusPdi,pendencias,statusCursos,consideracoes,notas,cor,estado)
         VALUES (${Array(31).fill("?").join(",")})`,
        values,
      )) as any;
      const processoId = Number(result?.insertId || 0);
      await audit(connection, req, "processo_criado", `Processo ${legacyId} criado sem sobrescrever registros existentes.`, processoId || null);
      return res.status(201).json({ ok: true, processoId, legacyId });
    } catch (error: any) {
      if (error?.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          error: "Este identificador já existe. Nenhum dado foi sobrescrito; tente criar novamente.",
        });
      }
      console.error("[ProgramaIntegracaoPessoas] criar processo:", error);
      return res.status(500).json({ error: "Não foi possível criar o processo." });
    }
  },
);

programaIntegracaoPeopleRouter.post(
  "/api/programa-integracao/processos/demo",
  requireAdmin,
  async (req, res) => {
    const connection = await getConnectionOr503(res);
    if (!connection) return;

    const legacyId = sanitizeLegacyId(req.body?.legacyId);
    const p = req.body?.processo;
    const respostas = respostasDemoValidas(p?.resp);
    const confirmacao = String(req.body?.confirmacao || "");
    if (confirmacao !== "CRIAR_DEMO") {
      return res.status(400).json({ error: "Confirmação do processo de demonstração inválida." });
    }
    if (!/^demo[a-z0-9]+$/i.test(legacyId) || !p || typeof p !== "object") {
      return res.status(400).json({ error: "Dados do processo de demonstração inválidos." });
    }
    if (String(p.nome || "").trim() !== "Mariana Alves Teixeira (demonstração)" || !respostas) {
      return res.status(400).json({ error: "O processo de demonstração não corresponde ao modelo autorizado." });
    }

    let transactionStarted = false;
    try {
      await connection.beginTransaction();
      transactionStarted = true;

      const [existing] = (await connection.execute(
        `SELECT id FROM programa_integracao_processos WHERE legacyId=? LIMIT 1 FOR UPDATE`,
        [legacyId],
      )) as any;
      if (existing?.[0]) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({ error: "Este identificador de demonstração já existe. Nada foi alterado." });
      }

      const userId = Number((req as any).authenticatedUser?.id || 0) || null;
      const [configRows] = (await connection.execute(
        `SELECT valor FROM programa_integracao_config WHERE chave='geral' LIMIT 1 FOR UPDATE`,
      )) as any;
      const config = configRows?.[0] ? asJson<Record<string, any>>(configRows[0].valor, {}) : {};
      const mentoras = Array.isArray(config.mentoras) ? [...config.mentoras] : [];
      let mentora = mentoras.find((m: any) => String(m?.nome || "").trim() === "Adriana Souza (demonstração)");
      if (!mentora) {
        mentora = {
          id: "m-demo-adriana",
          nome: "Adriana Souza (demonstração)",
          tel: "63991234567",
          email: "adriana@exemplo.com",
          ativa: true,
          obs: "Cadastro fictício usado somente no processo de demonstração do Programa de Integração.",
        };
        mentoras.push(mentora);
      }
      config.mentoras = mentoras;

      const [ordemRows] = (await connection.execute(
        `SELECT ordem FROM programa_integracao_processos WHERE situacao<>'removido' FOR UPDATE`,
      )) as any;
      const maiorOrdem = (ordemRows || []).reduce((maior: number, row: any) => Math.max(maior, Number(row?.ordem ?? -1)), -1);
      const ordem = maiorOrdem + 1;
      const ordemConfig = Array.isArray(config.ordem) ? config.ordem.filter((id: any) => String(id) !== legacyId) : [];
      ordemConfig.push(legacyId);
      config.ordem = ordemConfig;

      const estado = {
        ...p,
        mentorId: String(mentora.id),
        consultora: String(mentora.nome),
        situacao: "ativo",
      };
      delete estado.id;
      delete estado.resp;

      const values = [
        legacyId, null, ordem, String(p.nome), String(p.cpf || "000.000.000-00"), p.nasc || null, p.email || null,
        p.emailCorporativo || null, p.tel || null, p.cargo || null, p.unidade || null,
        p.tipo || "Onboarding", p.inicio || todayIso(), p.part || "Presencial", "ativo",
        p.gestor || null, p.gestorEmail || null, p.gestorTel || null, p.anjo || null,
        p.anjoEmail || null, String(mentora.nome), String(mentora.id), p.ugp || null,
        p.horarios || null, p.statusPdi || null, p.pendencias || null, p.statusCursos || null,
        p.consideracoes || null, p.notas || null, p.cor || null, JSON.stringify(estado),
      ];
      const [insertProcesso] = (await connection.execute(
        `INSERT INTO programa_integracao_processos (legacyId,alunoId,ordem,nome,cpf,nasc,email,emailCorporativo,tel,cargo,unidade,tipo,inicio,participacao,situacao,gestor,gestorEmail,gestorTel,anjo,anjoEmail,consultora,mentorLegacyId,ugp,horarios,statusPdi,pendencias,statusCursos,consideracoes,notas,cor,estado)
         VALUES (${Array(31).fill("?").join(",")})`,
        values,
      )) as any;
      const processoId = Number(insertProcesso?.insertId || 0);
      if (!processoId) throw new Error("O processo de demonstração não retornou identificador interno.");

      let respostasInseridas = 0;
      for (let indiceResposta = 0; indiceResposta < respostas.length; indiceResposta += 1) {
        const r = respostas[indiceResposta];
        const formKey = r.form as ProgramaIntegracaoFormKey;
        const pares = r.c.map((par: any) => [Number(par[0]), String(par[1] ?? "")] as [number, string]);
        const answers = answersDoDemo(formKey, pares);
        const { media, alertas } = calcularMediaAlertasDemo(formKey, pares);
        const rid = `${legacyId}-${formKey}-${String(indiceResposta + 1).padStart(2, "0")}`.slice(0, 100);
        const protocolo = `DEMO-${legacyId.toUpperCase()}-${String(indiceResposta + 1).padStart(2, "0")}`.slice(0, 40);
        const dedupeKey = `${legacyId}|${formKey}|${Number(r.ciclo || 0)}|${String(r.papel || "")}|${indiceResposta + 1}`.slice(0, 255);
        await connection.execute(
          `INSERT INTO programa_integracao_respostas (processoId,legacyRid,protocolo,dedupeKey,formKey,ciclo,papel,itemId,formVersion,statusVinculo,statusResposta,nomeOrig,avaliador,respondentName,respondentEmail,source,media,alertas,answers,quandoOriginal,emOriginal,submittedAt)
           VALUES (?,?,?,?,?,?,?,?,?,'vinculada',?,?,?,?,?,'admin',?,?,?,?,?,CURRENT_TIMESTAMP)`,
          [
            processoId, rid, protocolo, dedupeKey, formKey, Number(r.ciclo || 0), String(r.papel || ""),
            String(r.itid || ""), 1, "valido", String(r.nomeOrig || ""), String(r.avaliador || ""),
            String(r.respondentName || p.nome || ""), String(r.respondentEmail || ""), media,
            JSON.stringify(alertas), JSON.stringify(answers), String(r.quando || ""), String(r.em || ""),
          ],
        );
        respostasInseridas += 1;
      }

      await connection.execute(
        `INSERT INTO programa_integracao_config (chave,valor,updatedByUserId) VALUES ('geral',?,?)
         ON DUPLICATE KEY UPDATE valor=VALUES(valor),updatedByUserId=VALUES(updatedByUserId),updatedAt=CURRENT_TIMESTAMP`,
        [JSON.stringify(config), userId],
      );
      await audit(
        connection,
        req,
        "processo_demo_criado",
        `Processo fictício ${legacyId} criado para demonstração.`,
        processoId,
        { respostas: respostasInseridas, mentoraId: String(mentora.id) },
      );

      await connection.commit();
      transactionStarted = false;
      return res.status(201).json({ ok: true, legacyId, processoId, respostas: respostasInseridas, mentoraId: String(mentora.id) });
    } catch (error: any) {
      if (transactionStarted) {
        try { await connection.rollback(); } catch { /* rollback de melhor esforço */ }
      }
      if (error?.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "Já existe um registro de demonstração com o mesmo identificador. Nada foi sobrescrito." });
      }
      console.error("[ProgramaIntegracaoPessoas] criar demo:", error);
      return res.status(500).json({ error: "Não foi possível criar o processo de demonstração. A transação foi revertida." });
    }
  },
);

programaIntegracaoPeopleRouter.patch(
  "/api/programa-integracao/processos/ordem",
  requireAdmin,
  async (req, res) => {
    const connection = await getConnectionOr503(res);
    if (!connection) return;

    const ordem = Array.isArray(req.body?.ordem)
      ? req.body.ordem.map(sanitizeLegacyId).filter(Boolean)
      : [];
    if (new Set(ordem).size !== ordem.length) {
      return res.status(400).json({ error: "A ordem contém identificadores repetidos." });
    }

    let transactionStarted = false;
    try {
      await connection.beginTransaction();
      transactionStarted = true;

      const [rows] = (await connection.execute(
        `SELECT id,legacyId FROM programa_integracao_processos WHERE situacao<>'removido' ORDER BY ordem,id FOR UPDATE`,
      )) as any;
      const existentes = (rows || []).map((row: any) => String(row.legacyId));
      const existentesSet = new Set(existentes);
      const recebidosSet = new Set(ordem);
      const mesmaLista = existentes.length === ordem.length
        && existentes.every((id: string) => recebidosSet.has(id))
        && ordem.every((id: string) => existentesSet.has(id));
      if (!mesmaLista) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({
          error: "A lista de pessoas mudou enquanto você reordenava. Recarregue a tela antes de tentar novamente.",
        });
      }

      for (let i = 0; i < ordem.length; i += 1) {
        await connection.execute(
          `UPDATE programa_integracao_processos SET ordem=?,updatedAt=CURRENT_TIMESTAMP WHERE legacyId=? AND situacao<>'removido'`,
          [i, ordem[i]],
        );
      }

      const [configRows] = (await connection.execute(
        `SELECT valor FROM programa_integracao_config WHERE chave='geral' LIMIT 1 FOR UPDATE`,
      )) as any;
      const config = configRows?.[0] ? asJson<Record<string, any>>(configRows[0].valor, {}) : {};
      config.ordem = ordem;
      await connection.execute(
        `INSERT INTO programa_integracao_config (chave,valor,updatedByUserId) VALUES ('geral',?,?)
         ON DUPLICATE KEY UPDATE valor=VALUES(valor),updatedByUserId=VALUES(updatedByUserId),updatedAt=CURRENT_TIMESTAMP`,
        [JSON.stringify(config), Number((req as any).authenticatedUser?.id || 0) || null],
      );

      await audit(connection, req, "processos_reordenados", "Ordem dos processos atualizada.", null, { ordem });
      await connection.commit();
      transactionStarted = false;
      return res.json({ ok: true, ordem });
    } catch (error) {
      if (transactionStarted) {
        try { await connection.rollback(); } catch { /* rollback de melhor esforço */ }
      }
      console.error("[ProgramaIntegracaoPessoas] reordenar processos:", error);
      return res.status(500).json({ error: "Não foi possível reordenar os processos." });
    }
  },
);

programaIntegracaoPeopleRouter.patch(
  "/api/programa-integracao/processos/:legacyId/situacao",
  requireAdmin,
  async (req, res) => {
    const connection = await getConnectionOr503(res);
    if (!connection) return;

    const legacyId = sanitizeLegacyId(req.params.legacyId);
    const situacao = String(req.body?.situacao || "");
    if (!legacyId || !["ativo", "encerrado"].includes(situacao)) {
      return res.status(400).json({ error: "Situação inválida." });
    }

    try {
      const [rows] = (await connection.execute(
        `SELECT id,situacao FROM programa_integracao_processos WHERE legacyId=? AND situacao<>'removido' LIMIT 1`,
        [legacyId],
      )) as any;
      if (!rows?.[0]) return res.status(404).json({ error: "Processo não encontrado." });

      await connection.execute(
        `UPDATE programa_integracao_processos SET situacao=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
        [situacao, rows[0].id],
      );
      await audit(
        connection,
        req,
        situacao === "encerrado" ? "processo_encerrado" : "processo_reaberto",
        situacao === "encerrado"
          ? `Processo ${legacyId} encerrado com histórico preservado.`
          : `Processo ${legacyId} reaberto com histórico preservado.`,
        Number(rows[0].id),
      );
      return res.json({ ok: true, legacyId, situacao });
    } catch (error) {
      console.error("[ProgramaIntegracaoPessoas] alterar situação:", error);
      return res.status(500).json({ error: "Não foi possível alterar a situação do processo." });
    }
  },
);