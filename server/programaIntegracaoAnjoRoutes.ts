import { Router, type NextFunction, type Request, type Response } from "express";
import { getRawConnection } from "./db";
import { sdk } from "./_core/sdk";

export const programaIntegracaoAnjoRouter = Router();

const ITENS_AVALIACAO_ANJO: Record<number, string> = {
  1: "pos1-10",
  2: "pos2-10",
  3: "pos3-11",
  4: "pos4-09",
};

function sanitizeLegacyId(value: unknown) {
  return String(value ?? "").trim().slice(0, 100);
}

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeCpf(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 20);
}

function asJson<T = any>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}

async function requireAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) return res.status(401).json({ error: "Sessão inválida ou expirada." });
    (req as any).authenticatedUser = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) return res.status(401).json({ error: "Sessão inválida ou expirada." });
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Acesso restrito ao administrador." });
    }
    (req as any).authenticatedUser = user;
    return next();
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
      `INSERT INTO programa_integracao_auditoria (processoId,respostaId,userId,acao,detalhe,metadata)
       VALUES (?,NULL,?,?,?,?)`,
      [processoId ?? null, userId, acao, detalhe, metadata == null ? null : JSON.stringify(metadata)],
    );
  } catch (error) {
    console.warn("[ProgramaIntegracaoAnjo] Falha ao registrar auditoria:", error);
  }
}

async function activeAssignments(connection: any, userId: number) {
  const [rows] = (await connection.execute(
    `SELECT id,legacyId,nome,email,cargo,unidade,tipo,inicio,situacao,anjo,anjoEmail,anjoUserId,estado
     FROM programa_integracao_processos
     WHERE anjoUserId=? AND situacao='ativo'
     ORDER BY inicio ASC,id ASC`,
    [userId],
  )) as any;
  return rows || [];
}

programaIntegracaoAnjoRouter.get(
  "/api/programa-integracao/anjo/status",
  requireAuthenticated,
  async (req, res) => {
    const connection = await getConnectionOr503(res);
    if (!connection) return;
    try {
      const user = (req as any).authenticatedUser;
      const userId = Number(user.id);
      const ativos = await activeAssignments(connection, userId);
      const pureAngel = user.role === "user" && user.loginMethod === "angel" && !user.alunoId && !user.consultorId;
      return res.json({
        ok: true,
        hasActiveAssignments: ativos.length > 0,
        activeAssignments: ativos.length,
        pureAngel,
        angelOnlyWithoutActiveAssignment: pureAngel && ativos.length === 0,
      });
    } catch (error) {
      console.error("[ProgramaIntegracaoAnjo] status:", error);
      return res.status(500).json({ error: "Não foi possível verificar o acesso do Anjo." });
    }
  },
);

programaIntegracaoAnjoRouter.get(
  "/api/programa-integracao/anjo/formularios",
  requireAuthenticated,
  async (req, res) => {
    const connection = await getConnectionOr503(res);
    if (!connection) return;
    try {
      const userId = Number((req as any).authenticatedUser.id);
      const processos = await activeAssignments(connection, userId);
      if (!processos.length) {
        return res.json({ ok: true, indicadores: { aguardando: 0, pendentes: 0, respondidos: 0 }, formularios: [] });
      }

      const processoIds = processos.map((p: any) => Number(p.id));
      const placeholders = processoIds.map(() => "?").join(",");
      const [respostas] = (await connection.execute(
        `SELECT id,processoId,ciclo,itemId,respondentName,submittedAt
         FROM programa_integracao_respostas
         WHERE processoId IN (${placeholders})
           AND formKey='aval'
           AND papel='Anjo'
           AND statusVinculo='vinculada'
           AND COALESCE(statusResposta,'')<>'excluida'
         ORDER BY submittedAt DESC,id DESC`,
        processoIds,
      )) as any;

      const respostaPorChave = new Map<string, any>();
      for (const resposta of respostas || []) {
        const chave = `${Number(resposta.processoId)}|${Number(resposta.ciclo)}`;
        if (!respostaPorChave.has(chave)) respostaPorChave.set(chave, resposta);
      }

      const formularios: any[] = [];
      const indicadores = { aguardando: 0, pendentes: 0, respondidos: 0 };

      for (const processo of processos) {
        const estado = asJson<Record<string, any>>(processo.estado, {});
        const alinhamentos = estado.alin && typeof estado.alin === "object" ? estado.alin : {};

        for (const ciclo of [1, 2, 3, 4]) {
          const resposta = respostaPorChave.get(`${Number(processo.id)}|${ciclo}`);
          const alinhamento = alinhamentos[String(ciclo)] ?? alinhamentos[ciclo] ?? {};
          const realizado = Boolean(alinhamento?.realizado);
          const status = resposta ? "respondido" : realizado ? "pendente" : "aguardando_liberacao";
          if (status === "respondido") indicadores.respondidos += 1;
          else if (status === "pendente") indicadores.pendentes += 1;
          else indicadores.aguardando += 1;

          formularios.push({
            processoId: Number(processo.id),
            legacyId: String(processo.legacyId || ""),
            colaborador: String(processo.nome || ""),
            cargo: String(processo.cargo || ""),
            unidade: String(processo.unidade || ""),
            ciclo,
            itemId: ITENS_AVALIACAO_ANJO[ciclo],
            nome: "Avaliação do Programa de Integração",
            status,
            alinhamentoRealizado: realizado,
            bloqueioMotivo: !resposta && !realizado
              ? `Disponível após a realização do ${ciclo}.º alinhamento.`
              : null,
            respondidoEm: resposta?.submittedAt ? new Date(resposta.submittedAt).toISOString() : null,
            rotaPublica: `/formularios/avaliacao-programa?nome=${encodeURIComponent(String(processo.nome || ""))}&unidade=${encodeURIComponent(String(processo.unidade || ""))}&ciclo=${ciclo}&papel=Anjo&respondente=${encodeURIComponent(String((req as any).authenticatedUser?.name || ""))}&inicio=${encodeURIComponent(String(processo.inicio || ""))}&email=${encodeURIComponent(String(processo.email || ""))}`,
          });
        }
      }

      return res.json({ ok: true, indicadores, formularios });
    } catch (error) {
      console.error("[ProgramaIntegracaoAnjo] formularios:", error);
      return res.status(500).json({ error: "Não foi possível carregar os formulários do Anjo." });
    }
  },
);

programaIntegracaoAnjoRouter.get(
  "/api/programa-integracao/admin/anjo/usuarios",
  requireAdmin,
  async (req, res) => {
    const connection = await getConnectionOr503(res);
    if (!connection) return;
    try {
      const busca = String(req.query?.q || "").trim();
      const like = `%${busca.replace(/[%_]/g, "")}%`;
      const params: any[] = [];
      let where = `isActive=1 AND role IN ('user','manager')`;
      if (busca) {
        where += ` AND (name LIKE ? OR email LIKE ? OR cpf LIKE ?)`;
        params.push(like, like, like);
      }
      const [rows] = (await connection.execute(
        `SELECT u.id,u.name,u.email,u.cpf,u.role,u.programId,u.alunoId,u.consultorId,u.isActive,
                p.name AS programName
         FROM users u
         LEFT JOIN programs p ON p.id=u.programId
         WHERE ${where.replace(/\b(isActive|role|name|email|cpf)\b/g, "u.$1")}
         ORDER BY u.name ASC,u.id ASC
         LIMIT 100`,
        params,
      )) as any;
      return res.json({ ok: true, usuarios: rows || [] });
    } catch (error) {
      console.error("[ProgramaIntegracaoAnjo] listar usuários:", error);
      return res.status(500).json({ error: "Não foi possível listar usuários para vínculo." });
    }
  },
);

programaIntegracaoAnjoRouter.get(
  "/api/programa-integracao/admin/processos/:legacyId/anjo-vinculo",
  requireAdmin,
  async (req, res) => {
    const connection = await getConnectionOr503(res);
    if (!connection) return;
    const legacyId = sanitizeLegacyId(req.params.legacyId);
    try {
      const [rows] = (await connection.execute(
        `SELECT p.id,p.legacyId,p.anjo,p.anjoEmail,p.anjoUserId,
                u.name AS userName,u.email AS userEmail,u.cpf AS userCpf,u.role AS userRole,u.alunoId,u.consultorId,u.isActive,
                pr.name AS programName
         FROM programa_integracao_processos p
         LEFT JOIN users u ON u.id=p.anjoUserId
         LEFT JOIN programs pr ON pr.id=u.programId
         WHERE p.legacyId=? AND p.situacao<>'removido'
         LIMIT 1`,
        [legacyId],
      )) as any;
      if (!rows?.[0]) return res.status(404).json({ error: "Processo não encontrado." });
      return res.json({ ok: true, vinculo: rows[0] });
    } catch (error) {
      console.error("[ProgramaIntegracaoAnjo] consultar vínculo:", error);
      return res.status(500).json({ error: "Não foi possível consultar o vínculo do Anjo." });
    }
  },
);

programaIntegracaoAnjoRouter.post(
  "/api/programa-integracao/admin/processos/:legacyId/anjo-vinculo",
  requireAdmin,
  async (req, res) => {
    const connection = await getConnectionOr503(res);
    if (!connection) return;
    const legacyId = sanitizeLegacyId(req.params.legacyId);
    const userIdRaw = req.body?.userId;
    const userId = userIdRaw == null || userIdRaw === "" ? null : Number(userIdRaw);
    if (userId !== null && (!Number.isInteger(userId) || userId <= 0)) {
      return res.status(400).json({ error: "Usuário inválido." });
    }

    try {
      const [processos] = (await connection.execute(
        `SELECT id,anjo,anjoEmail,anjoUserId,situacao FROM programa_integracao_processos
         WHERE legacyId=? AND situacao<>'removido' LIMIT 1`,
        [legacyId],
      )) as any;
      const processo = processos?.[0];
      if (!processo) return res.status(404).json({ error: "Processo não encontrado." });
      if (String(processo.situacao) !== "ativo") {
        return res.status(409).json({ error: "O processo não está ativo. Nenhum novo vínculo de Anjo pode ser criado." });
      }

      let usuario: any = null;
      if (userId !== null) {
        const [usuarios] = (await connection.execute(
          `SELECT id,name,email,cpf,role,alunoId,consultorId,isActive
           FROM users WHERE id=? LIMIT 1`,
          [userId],
        )) as any;
        usuario = usuarios?.[0];
        if (!usuario || Number(usuario.isActive) !== 1) {
          return res.status(400).json({ error: "O usuário selecionado não está ativo." });
        }
        if (!["user", "manager"].includes(String(usuario.role))) {
          return res.status(400).json({ error: "Administradores não podem ser vinculados como Colaborador Anjo por esta função." });
        }
      }

      await connection.execute(
        `UPDATE programa_integracao_processos SET anjoUserId=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
        [userId, Number(processo.id)],
      );
      await audit(
        connection,
        req,
        userId ? "anjo_usuario_vinculado" : "anjo_usuario_desvinculado",
        userId
          ? `Usuário EcoLíder vinculado ao Colaborador Anjo do processo ${legacyId}.`
          : `Vínculo de usuário do Colaborador Anjo removido do processo ${legacyId}; nome e e-mail históricos foram preservados.`,
        Number(processo.id),
        {
          anterior: processo.anjoUserId == null ? null : Number(processo.anjoUserId),
          atual: userId,
          nomeHistorico: processo.anjo || null,
          emailHistorico: processo.anjoEmail || null,
        },
      );
      return res.json({ ok: true, userId, usuario });
    } catch (error) {
      console.error("[ProgramaIntegracaoAnjo] vincular usuário:", error);
      return res.status(500).json({ error: "Não foi possível alterar o vínculo do Anjo." });
    }
  },
);

programaIntegracaoAnjoRouter.post(
  "/api/programa-integracao/admin/processos/:legacyId/anjo-acesso",
  requireAdmin,
  async (req, res) => {
    const connection = await getConnectionOr503(res);
    if (!connection) return;
    const legacyId = sanitizeLegacyId(req.params.legacyId);
    const nome = String(req.body?.nome || "").trim();
    const email = normalizeEmail(req.body?.email);
    const cpf = normalizeCpf(req.body?.cpf);
    const programId = Number(req.body?.programId || 0);

    if (!nome || !email || !/^\S+@\S+\.\S+$/.test(email) || cpf.length !== 11) {
      return res.status(400).json({ error: "Informe nome, e-mail válido e CPF com 11 dígitos." });
    }
    if (!Number.isInteger(programId) || programId <= 0) {
      return res.status(400).json({ error: "Selecione a empresa do Colaborador Anjo." });
    }

    let transactionStarted = false;
    try {
      await connection.beginTransaction();
      transactionStarted = true;

      const [programas] = (await connection.execute(
        `SELECT id FROM programs WHERE id=? AND isActive=1 LIMIT 1`,
        [programId],
      )) as any;
      if (!programas?.[0]) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(400).json({ error: "A empresa selecionada não está ativa ou não existe." });
      }

      const [processos] = (await connection.execute(
        `SELECT id,anjo,anjoEmail,anjoUserId,situacao FROM programa_integracao_processos
         WHERE legacyId=? AND situacao<>'removido' LIMIT 1 FOR UPDATE`,
        [legacyId],
      )) as any;
      const processo = processos?.[0];
      if (!processo) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(404).json({ error: "Processo não encontrado." });
      }
      if (String(processo.situacao) !== "ativo") {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({ error: "O processo não está ativo. Nenhum acesso de Anjo pode ser criado." });
      }

      const [existentes] = (await connection.execute(
        `SELECT id,name,email,cpf,role,programId,alunoId,consultorId,isActive
         FROM users
         WHERE email=? OR cpf=?
         ORDER BY id ASC`,
        [email, cpf],
      )) as any;

      if (existentes?.length) {
        await connection.rollback();
        transactionStarted = false;
        const exatosEmail = existentes.filter((u: any) => normalizeEmail(u.email) === email);
        const exatosCpf = existentes.filter((u: any) => normalizeCpf(u.cpf) === cpf);
        const ids = new Set([...exatosEmail, ...exatosCpf].map((u: any) => Number(u.id)));
        return res.status(409).json({
          error: ids.size === 1
            ? "Já existe um usuário com este e-mail ou CPF. Use “Vincular usuário existente”."
            : "Foram encontrados cadastros diferentes para o e-mail e o CPF informados. Revise antes de vincular.",
          existingUsers: existentes,
        });
      }

      const openId = `access_angel_${cpf}`;
      const [insert] = (await connection.execute(
        `INSERT INTO users
           (openId,name,email,cpf,loginMethod,role,programId,alunoId,consultorId,isActive,lastSignedIn)
         VALUES (?,?,?,?,'angel','user',?,NULL,NULL,1,NULL)`,
        [openId, nome, email, cpf, programId],
      )) as any;
      const newUserId = Number(insert?.insertId || 0);
      if (!newUserId) throw new Error("Usuário do Anjo não retornou identificador.");

      await connection.execute(
        `UPDATE programa_integracao_processos SET anjoUserId=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
        [newUserId, Number(processo.id)],
      );
      await audit(
        connection,
        req,
        "anjo_acesso_criado",
        `Acesso mínimo do Colaborador Anjo criado e vinculado ao processo ${legacyId}.`,
        Number(processo.id),
        {
          userId: newUserId,
          email,
          programId,
          preservado: { anjo: processo.anjo || null, anjoEmail: processo.anjoEmail || null },
        },
      );

      await connection.commit();
      transactionStarted = false;
      return res.status(201).json({
        ok: true,
        user: {
          id: newUserId,
          name: nome,
          email,
          role: "user",
          programId,
          alunoId: null,
          consultorId: null,
        },
      });
    } catch (error: any) {
      if (transactionStarted) {
        try { await connection.rollback(); } catch {}
      }
      if (error?.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "Já existe um usuário com os dados informados. Nenhum cadastro foi duplicado." });
      }
      console.error("[ProgramaIntegracaoAnjo] criar acesso:", error);
      return res.status(500).json({ error: "Não foi possível criar o acesso do Anjo. A operação foi revertida." });
    }
  },
);
