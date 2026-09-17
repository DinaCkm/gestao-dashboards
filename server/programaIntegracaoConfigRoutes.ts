import { Router, type NextFunction, type Request, type Response } from "express";
import { getRawConnection } from "./db";
import { sdk } from "./_core/sdk";

export const programaIntegracaoConfigRouter = Router();

type ConfigSection =
  | "emails"
  | "mentoras"
  | "cursos"
  | "plataformaCursos"
  | "aviso"
  | "links"
  | "feriados"
  | "formConfig"
  | "formTextos";

const CONFIG_SECTIONS = new Set<ConfigSection>([
  "emails",
  "mentoras",
  "cursos",
  "plataformaCursos",
  "aviso",
  "links",
  "feriados",
  "formConfig",
  "formTextos",
]);

function asJson<T = any>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

function plainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function payloadSizeOk(value: unknown) {
  try {
    return JSON.stringify(value).length <= 2_000_000;
  } catch {
    return false;
  }
}

function validarSecao(section: ConfigSection, value: unknown): string | null {
  if (!payloadSizeOk(value)) return "Conteúdo de configuração inválido ou grande demais.";

  switch (section) {
    case "emails":
    case "links":
    case "formConfig":
    case "formTextos":
      return plainObject(value) ? null : "Esta configuração precisa ser um objeto.";

    case "mentoras":
      if (!Array.isArray(value)) return "A lista de mentoras precisa ser uma lista.";
      for (const item of value) {
        if (!plainObject(item)) return "Há uma mentora com formato inválido.";
        if (item.id != null && typeof item.id !== "string") return "Há uma mentora com identificador inválido.";
        if (item.nome != null && typeof item.nome !== "string") return "Há uma mentora com nome inválido.";
        if (item.tel != null && typeof item.tel !== "string") return "Há uma mentora com telefone inválido.";
        if (item.email != null && typeof item.email !== "string") return "Há uma mentora com e-mail inválido.";
        if (item.obs != null && typeof item.obs !== "string") return "Há uma mentora com observação inválida.";
        if (item.ativa != null && typeof item.ativa !== "boolean") return "Há uma mentora com situação inválida.";
      }
      return null;

    case "cursos":
      if (!Array.isArray(value)) return "A lista de cursos precisa ser uma lista.";
      for (const item of value) {
        if (!plainObject(item)) return "Há um curso com formato inválido.";
        if (item.n != null && typeof item.n !== "string") return "Há um curso com nome inválido.";
        if (item.h != null && typeof item.h !== "string" && typeof item.h !== "number") {
          return "Há um curso com carga horária inválida.";
        }
      }
      return null;

    case "plataformaCursos":
    case "aviso":
      return typeof value === "string" ? null : "Esta configuração precisa ser um texto.";

    case "feriados":
      if (!Array.isArray(value)) return "A lista de feriados precisa ser uma lista.";
      if (!value.every((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))) {
        return "Há uma data de feriado em formato inválido.";
      }
      return null;
  }
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

/**
 * Atualiza SOMENTE uma seção autorizada de config.
 *
 * Segurança:
 * - lê a configuração atual antes de alterar;
 * - preserva todas as demais chaves, inclusive ordem e qualquer chave histórica desconhecida;
 * - não aceita respostasPendentes nem ordem por esta rota;
 * - usa transação curta com SELECT ... FOR UPDATE para não perder edição concorrente;
 * - registra auditoria sem copiar o conteúdo sensível para o log;
 * - relê o valor persistido antes de responder.
 */
programaIntegracaoConfigRouter.patch(
  "/api/programa-integracao/config-sections/:section",
  requireAdmin,
  async (req, res) => {
    const section = String(req.params.section || "") as ConfigSection;
    if (!CONFIG_SECTIONS.has(section)) {
      return res.status(400).json({ error: "Seção de configuração não autorizada." });
    }

    if (!Object.prototype.hasOwnProperty.call(req.body || {}, "value")) {
      return res.status(400).json({ error: "Informe o valor da configuração." });
    }

    const value = req.body.value;
    const validationError = validarSecao(section, value);
    if (validationError) return res.status(400).json({ error: validationError });

    const connection = await getConnectionOr503(res);
    if (!connection) return;

    let transactionStarted = false;
    try {
      await connection.beginTransaction();
      transactionStarted = true;

      const [rows] = (await connection.execute(
        `SELECT valor FROM programa_integracao_config WHERE chave='geral' LIMIT 1 FOR UPDATE`,
      )) as any;
      const current = rows?.[0] ? asJson<Record<string, any>>(rows[0].valor, {}) : {};

      // Nunca transportar a fila calculada pelo bootstrap para a configuração persistida.
      delete current.respostasPendentes;
      current[section] = value;

      const userId = Number((req as any).authenticatedUser?.id || 0) || null;
      await connection.execute(
        `INSERT INTO programa_integracao_config (chave,valor,updatedByUserId)
         VALUES ('geral',?,?)
         ON DUPLICATE KEY UPDATE valor=VALUES(valor),updatedByUserId=VALUES(updatedByUserId),updatedAt=CURRENT_TIMESTAMP`,
        [JSON.stringify(current), userId],
      );

      await connection.execute(
        `INSERT INTO programa_integracao_auditoria (processoId,respostaId,userId,acao,detalhe,metadata)
         VALUES (NULL,NULL,?,'config_secao_atualizada',?,?)`,
        [
          userId,
          `Seção ${section} atualizada sem alterar as demais configurações.`,
          JSON.stringify({ section }),
        ],
      );

      await connection.commit();
      transactionStarted = false;

      const [savedRows] = (await connection.execute(
        `SELECT valor FROM programa_integracao_config WHERE chave='geral' LIMIT 1`,
      )) as any;
      const persisted = savedRows?.[0] ? asJson<Record<string, any>>(savedRows[0].valor, {}) : {};

      res.setHeader("Cache-Control", "no-store");
      return res.json({ ok: true, section, value: persisted[section] });
    } catch (error) {
      if (transactionStarted) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("[ProgramaIntegracao] rollback config por seção:", rollbackError);
        }
      }
      console.error("[ProgramaIntegracao] salvar config por seção:", error);
      return res.status(500).json({ error: "Não foi possível salvar esta configuração." });
    }
  },
);
