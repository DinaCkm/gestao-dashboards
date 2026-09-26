import { randomUUID } from "crypto";
import { Router, type NextFunction, type Request, type Response } from "express";
import { getRawConnection } from "./db";
import { sdk } from "./_core/sdk";
import { storageDelete, storageDownloadBuffer, storageGet, storagePut } from "./storage";

export const programaIntegracaoRegistrosRouter = Router();

type RegistroTipo = "foto" | "documento" | "relato" | "outro" | "nao_informado";
type RegistroOrigem = "Colaborador" | "Gestor" | "Anjo" | "UGP" | "CKM / Consultora" | "Não informado";
type RegistroAlinhamento = "Preparação" | "15 dias" | "45 dias" | "75 dias" | "150 dias" | "Geral" | "Não informado";

interface RegistroIntegracao {
  id: string;
  tipo: RegistroTipo;
  titulo: string;
  descricao: string;
  dataAcontecimento: string;
  origem: RegistroOrigem;
  alinhamento: RegistroAlinhamento;
  fileKey?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  cadastradoPorUserId: number | null;
  cadastradoPorNome: string;
  cadastradoEm: string;
  atualizadoEm?: string;
  excluidoEm?: string | null;
  excluidoPorUserId?: number | null;
  excluidoPorNome?: string | null;
}

const TIPOS = new Set<RegistroTipo>(["foto", "documento", "relato", "outro", "nao_informado"]);
const ORIGENS = new Set<RegistroOrigem>(["Colaborador", "Gestor", "Anjo", "UGP", "CKM / Consultora", "Não informado"]);
const ALINHAMENTOS = new Set<RegistroAlinhamento>(["Preparação", "15 dias", "45 dias", "75 dias", "150 dias", "Geral", "Não informado"]);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const FOTO_EXT = new Set(["jpg", "jpeg", "png", "webp"]);
const DOCUMENTO_EXT = new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"]);

function sanitizeLegacyId(value: unknown) {
  return String(value ?? "").trim().slice(0, 100);
}

function sanitizeText(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function asJson<T = any>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}

function nomeArquivoSeguro(value: unknown) {
  return sanitizeText(value, 180)
    .replace(/[\\/]+/g, "-")
    .replace(/[^a-zA-Z0-9._() -]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extensaoArquivo(fileName: string) {
  return String(fileName.split(".").pop() || "").toLowerCase();
}

function registrosDoEstado(estado: Record<string, any>): RegistroIntegracao[] {
  const raw = estado?.registrosIntegracao;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item) => item && typeof item === "object" && typeof item.id === "string") as RegistroIntegracao[];
}

function actor(req: Request) {
  const user = (req as any).authenticatedUser || {};
  const id = Number(user.id || 0) || null;
  const nome = sanitizeText(user.name || user.email || (id ? `Usuário ${id}` : "Administrador"), 160) || "Administrador";
  return { id, nome };
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
  processoId: number,
  metadata?: any,
) {
  try {
    const userId = Number((req as any).authenticatedUser?.id || 0) || null;
    await connection.execute(
      `INSERT INTO programa_integracao_auditoria (processoId,respostaId,userId,acao,detalhe,metadata)
       VALUES (?,NULL,?,?,?,?)`,
      [processoId, userId, acao, detalhe, metadata == null ? null : JSON.stringify(metadata)],
    );
  } catch (error) {
    console.warn("[ProgramaIntegracaoRegistros] Falha ao registrar auditoria:", error);
  }
}

function validarPayload(body: any, editando = false) {
  const tipoRaw = sanitizeText(body?.tipo, 20);
  const tipo = (tipoRaw || "nao_informado") as RegistroTipo;
  const titulo = sanitizeText(body?.titulo, 160) || "Não informado";
  const descricao = sanitizeText(body?.descricao, 6000);
  const dataAcontecimento = sanitizeText(body?.dataAcontecimento, 10);
  const origemRaw = sanitizeText(body?.origem, 40);
  const origem = (origemRaw || "Não informado") as RegistroOrigem;
  const alinhamentoRaw = sanitizeText(body?.alinhamento, 30);
  const alinhamento = (alinhamentoRaw || "Não informado") as RegistroAlinhamento;

  if (!TIPOS.has(tipo)) return { error: "Tipo de registro inválido." };
  if (dataAcontecimento && !/^\d{4}-\d{2}-\d{2}$/.test(dataAcontecimento)) {
    return { error: "A data do acontecimento deve estar no formato AAAA-MM-DD." };
  }
  if (!ORIGENS.has(origem)) return { error: "Origem do registro inválida." };
  if (!ALINHAMENTOS.has(alinhamento)) return { error: "Alinhamento relacionado inválido." };

  if (!editando && (tipo === "foto" || tipo === "documento") && !body?.fileData) {
    return { error: tipo === "foto" ? "Selecione uma foto." : "Selecione um documento." };
  }

  return { value: { tipo, titulo, descricao, dataAcontecimento, origem, alinhamento } };
}

async function carregarProcesso(connection: any, legacyId: string, lock = false) {
  const [rows] = (await connection.execute(
    `SELECT id,legacyId,nome,estado FROM programa_integracao_processos
     WHERE legacyId=? AND situacao<>'removido' LIMIT 1${lock ? " FOR UPDATE" : ""}`,
    [legacyId],
  )) as any;
  return rows?.[0] || null;
}

function registroPublico(item: RegistroIntegracao) {
  return {
    id: item.id,
    tipo: item.tipo,
    titulo: item.titulo,
    descricao: item.descricao,
    dataAcontecimento: item.dataAcontecimento,
    origem: item.origem,
    alinhamento: item.alinhamento,
    fileName: item.fileName || "",
    mimeType: item.mimeType || "",
    sizeBytes: Number(item.sizeBytes || 0),
    hasFile: Boolean(item.fileKey),
    cadastradoPorUserId: item.cadastradoPorUserId,
    cadastradoPorNome: item.cadastradoPorNome,
    cadastradoEm: item.cadastradoEm,
    atualizadoEm: item.atualizadoEm || "",
    excluidoEm: item.excluidoEm || null,
    excluidoPorNome: item.excluidoPorNome || null,
  };
}

programaIntegracaoRegistrosRouter.get(
  "/api/programa-integracao/processos/:legacyId/registros",
  requireAdmin,
  async (req, res) => {
    try {
      const connection = await getConnectionOr503(res); if (!connection) return;
      const legacyId = sanitizeLegacyId(req.params.legacyId);
      const processo = await carregarProcesso(connection, legacyId);
      if (!processo) return res.status(404).json({ error: "Processo não encontrado." });

      const estado = asJson<Record<string, any>>(processo.estado, {});
      const registros = registrosDoEstado(estado)
        .slice()
        .sort((a, b) => String(b.cadastradoEm || "").localeCompare(String(a.cadastradoEm || "")))
        .map(registroPublico);

      res.setHeader("Cache-Control", "no-store");
      return res.json({ ok: true, processo: { legacyId, nome: String(processo.nome || "") }, registros });
    } catch (error) {
      console.error("[ProgramaIntegracaoRegistros] listar:", error);
      return res.status(500).json({ error: "Não foi possível carregar os registros da integração." });
    }
  },
);

programaIntegracaoRegistrosRouter.post(
  "/api/programa-integracao/processos/:legacyId/registros",
  requireAdmin,
  async (req, res) => {
    const validacao = validarPayload(req.body, false);
    if ("error" in validacao) return res.status(400).json({ error: validacao.error });

    const connection = await getConnectionOr503(res); if (!connection) return;
    let transactionStarted = false;
    let uploadedFileKey: string | null = null;

    try {
      await connection.beginTransaction();
      transactionStarted = true;

      const legacyId = sanitizeLegacyId(req.params.legacyId);
      const processo = await carregarProcesso(connection, legacyId, true);
      if (!processo) {
        await connection.rollback(); transactionStarted = false;
        return res.status(404).json({ error: "Processo não encontrado." });
      }

      const estado = asJson<Record<string, any>>(processo.estado, {});
      const registros = registrosDoEstado(estado);
      const dados = validacao.value;
      const agora = new Date().toISOString();
      const usuario = actor(req);

      let fileKey: string | undefined;
      let fileName: string | undefined;
      let mimeType: string | undefined;
      let sizeBytes: number | undefined;

      if (req.body?.fileData) {
        fileName = nomeArquivoSeguro(req.body?.fileName);
        const ext = extensaoArquivo(fileName);
        if (!fileName || !MIME_BY_EXT[ext]) {
          await connection.rollback(); transactionStarted = false;
          return res.status(400).json({ error: "Tipo de arquivo não permitido." });
        }
        if (dados.tipo === "foto" && !FOTO_EXT.has(ext)) {
          await connection.rollback(); transactionStarted = false;
          return res.status(400).json({ error: "Para Foto, use JPG, JPEG, PNG ou WEBP." });
        }
        if (dados.tipo === "documento" && !DOCUMENTO_EXT.has(ext)) {
          await connection.rollback(); transactionStarted = false;
          return res.status(400).json({ error: "Para Documento, use PDF, Word, Excel ou PowerPoint." });
        }

        const base64 = String(req.body.fileData || "");
        if (base64.length > 14 * 1024 * 1024) {
          await connection.rollback(); transactionStarted = false;
          return res.status(400).json({ error: "O arquivo deve ter no máximo 10 MB." });
        }

        let buffer: Buffer;
        try {
          buffer = Buffer.from(base64, "base64");
        } catch {
          await connection.rollback(); transactionStarted = false;
          return res.status(400).json({ error: "Arquivo inválido." });
        }

        sizeBytes = buffer.byteLength;
        if (!sizeBytes || sizeBytes > MAX_FILE_BYTES) {
          await connection.rollback(); transactionStarted = false;
          return res.status(400).json({ error: "O arquivo deve ter no máximo 10 MB." });
        }

        mimeType = MIME_BY_EXT[ext];
        fileKey = `programa-integracao/registros/${Number(processo.id)}/${randomUUID()}.${ext}`;
        await storagePut(fileKey, buffer, mimeType, "private, max-age=0, no-store");
        uploadedFileKey = fileKey;
      }

      const registro: RegistroIntegracao = {
        id: `reg-${randomUUID()}`,
        ...dados,
        fileKey,
        fileName,
        mimeType,
        sizeBytes,
        cadastradoPorUserId: usuario.id,
        cadastradoPorNome: usuario.nome,
        cadastradoEm: agora,
        excluidoEm: null,
        excluidoPorUserId: null,
        excluidoPorNome: null,
      };

      estado.registrosIntegracao = [...registros, registro];
      await connection.execute(
        `UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
        [JSON.stringify(estado), Number(processo.id)],
      );
      await audit(
        connection,
        req,
        "registro_integracao_criado",
        `Registro "${registro.titulo}" criado no processo ${legacyId}.`,
        Number(processo.id),
        { registroId: registro.id, tipo: registro.tipo, origem: registro.origem, alinhamento: registro.alinhamento, hasFile: Boolean(registro.fileKey) },
      );

      await connection.commit();
      transactionStarted = false;
      return res.status(201).json({ ok: true, registro: registroPublico(registro) });
    } catch (error) {
      if (transactionStarted) {
        try { await connection.rollback(); } catch {}
      }
      if (uploadedFileKey) {
        try { await storageDelete(uploadedFileKey); } catch (cleanupError) {
          console.warn("[ProgramaIntegracaoRegistros] Falha ao limpar upload após rollback:", cleanupError);
        }
      }
      console.error("[ProgramaIntegracaoRegistros] criar:", error);
      return res.status(500).json({ error: "Não foi possível criar o registro. Nenhuma alteração parcial foi confirmada." });
    }
  },
);

programaIntegracaoRegistrosRouter.patch(
  "/api/programa-integracao/processos/:legacyId/registros/:registroId",
  requireAdmin,
  async (req, res) => {
    const validacao = validarPayload(req.body, true);
    if ("error" in validacao) return res.status(400).json({ error: validacao.error });

    const connection = await getConnectionOr503(res); if (!connection) return;
    let transactionStarted = false;

    try {
      await connection.beginTransaction();
      transactionStarted = true;

      const legacyId = sanitizeLegacyId(req.params.legacyId);
      const registroId = sanitizeText(req.params.registroId, 100);
      const processo = await carregarProcesso(connection, legacyId, true);
      if (!processo) {
        await connection.rollback(); transactionStarted = false;
        return res.status(404).json({ error: "Processo não encontrado." });
      }

      const estado = asJson<Record<string, any>>(processo.estado, {});
      const registros = registrosDoEstado(estado);
      const indice = registros.findIndex((item) => item.id === registroId);
      if (indice < 0) {
        await connection.rollback(); transactionStarted = false;
        return res.status(404).json({ error: "Registro não encontrado." });
      }
      if (registros[indice].excluidoEm) {
        await connection.rollback(); transactionStarted = false;
        return res.status(409).json({ error: "Restaure o registro antes de editá-lo." });
      }

      const anterior = registros[indice];
      if (anterior.fileKey && validacao.value.tipo !== anterior.tipo) {
        await connection.rollback(); transactionStarted = false;
        return res.status(409).json({ error: "O tipo de um registro com arquivo não pode ser alterado. Crie um novo registro se precisar trocar Foto por Documento ou vice-versa." });
      }
      const atualizado: RegistroIntegracao = {
        ...anterior,
        ...validacao.value,
        atualizadoEm: new Date().toISOString(),
      };
      registros[indice] = atualizado;
      estado.registrosIntegracao = registros;

      await connection.execute(
        `UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
        [JSON.stringify(estado), Number(processo.id)],
      );
      await audit(
        connection,
        req,
        "registro_integracao_editado",
        `Registro "${atualizado.titulo}" editado no processo ${legacyId}.`,
        Number(processo.id),
        { registroId, tipoAntes: anterior.tipo, tipoDepois: atualizado.tipo },
      );

      await connection.commit();
      transactionStarted = false;
      return res.json({ ok: true, registro: registroPublico(atualizado) });
    } catch (error) {
      if (transactionStarted) {
        try { await connection.rollback(); } catch {}
      }
      console.error("[ProgramaIntegracaoRegistros] editar:", error);
      return res.status(500).json({ error: "Não foi possível editar o registro. Nenhuma alteração parcial foi confirmada." });
    }
  },
);

programaIntegracaoRegistrosRouter.delete(
  "/api/programa-integracao/processos/:legacyId/registros/:registroId",
  requireAdmin,
  async (req, res) => {
    const connection = await getConnectionOr503(res); if (!connection) return;
    let transactionStarted = false;

    try {
      await connection.beginTransaction();
      transactionStarted = true;

      const legacyId = sanitizeLegacyId(req.params.legacyId);
      const registroId = sanitizeText(req.params.registroId, 100);
      const processo = await carregarProcesso(connection, legacyId, true);
      if (!processo) {
        await connection.rollback(); transactionStarted = false;
        return res.status(404).json({ error: "Processo não encontrado." });
      }

      const estado = asJson<Record<string, any>>(processo.estado, {});
      const registros = registrosDoEstado(estado);
      const indice = registros.findIndex((item) => item.id === registroId);
      if (indice < 0) {
        await connection.rollback(); transactionStarted = false;
        return res.status(404).json({ error: "Registro não encontrado." });
      }

      const usuario = actor(req);
      const atual = registros[indice];
      if (!atual.excluidoEm) {
        registros[indice] = {
          ...atual,
          excluidoEm: new Date().toISOString(),
          excluidoPorUserId: usuario.id,
          excluidoPorNome: usuario.nome,
        };
        estado.registrosIntegracao = registros;
        await connection.execute(
          `UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
          [JSON.stringify(estado), Number(processo.id)],
        );
        await audit(
          connection,
          req,
          "registro_integracao_excluido",
          `Registro "${atual.titulo}" arquivado no processo ${legacyId}; arquivo físico preservado.`,
          Number(processo.id),
          { registroId, tipo: atual.tipo, hasFile: Boolean(atual.fileKey) },
        );
      }

      await connection.commit();
      transactionStarted = false;
      return res.json({ ok: true });
    } catch (error) {
      if (transactionStarted) {
        try { await connection.rollback(); } catch {}
      }
      console.error("[ProgramaIntegracaoRegistros] excluir:", error);
      return res.status(500).json({ error: "Não foi possível excluir o registro. Nenhuma alteração parcial foi confirmada." });
    }
  },
);

programaIntegracaoRegistrosRouter.post(
  "/api/programa-integracao/processos/:legacyId/registros/:registroId/restaurar",
  requireAdmin,
  async (req, res) => {
    const connection = await getConnectionOr503(res); if (!connection) return;
    let transactionStarted = false;

    try {
      await connection.beginTransaction();
      transactionStarted = true;

      const legacyId = sanitizeLegacyId(req.params.legacyId);
      const registroId = sanitizeText(req.params.registroId, 100);
      const processo = await carregarProcesso(connection, legacyId, true);
      if (!processo) {
        await connection.rollback(); transactionStarted = false;
        return res.status(404).json({ error: "Processo não encontrado." });
      }

      const estado = asJson<Record<string, any>>(processo.estado, {});
      const registros = registrosDoEstado(estado);
      const indice = registros.findIndex((item) => item.id === registroId);
      if (indice < 0) {
        await connection.rollback(); transactionStarted = false;
        return res.status(404).json({ error: "Registro não encontrado." });
      }

      const atual = registros[indice];
      const restaurado: RegistroIntegracao = {
        ...atual,
        excluidoEm: null,
        excluidoPorUserId: null,
        excluidoPorNome: null,
        atualizadoEm: new Date().toISOString(),
      };
      registros[indice] = restaurado;
      estado.registrosIntegracao = registros;

      await connection.execute(
        `UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
        [JSON.stringify(estado), Number(processo.id)],
      );
      await audit(
        connection,
        req,
        "registro_integracao_restaurado",
        `Registro "${restaurado.titulo}" restaurado no processo ${legacyId}.`,
        Number(processo.id),
        { registroId, tipo: restaurado.tipo },
      );

      await connection.commit();
      transactionStarted = false;
      return res.json({ ok: true, registro: registroPublico(restaurado) });
    } catch (error) {
      if (transactionStarted) {
        try { await connection.rollback(); } catch {}
      }
      console.error("[ProgramaIntegracaoRegistros] restaurar:", error);
      return res.status(500).json({ error: "Não foi possível restaurar o registro. Nenhuma alteração parcial foi confirmada." });
    }
  },
);

programaIntegracaoRegistrosRouter.get(
  "/api/programa-integracao/processos/:legacyId/registros/:registroId/arquivo",
  requireAdmin,
  async (req, res) => {
    try {
      const connection = await getConnectionOr503(res); if (!connection) return;
      const legacyId = sanitizeLegacyId(req.params.legacyId);
      const registroId = sanitizeText(req.params.registroId, 100);
      const processo = await carregarProcesso(connection, legacyId);
      if (!processo) return res.status(404).json({ error: "Processo não encontrado." });

      const estado = asJson<Record<string, any>>(processo.estado, {});
      const registro = registrosDoEstado(estado).find((item) => item.id === registroId);
      if (!registro || !registro.fileKey) return res.status(404).json({ error: "Arquivo não encontrado." });

      if (String(req.query.download || "") === "1") {
        const buffer = await storageDownloadBuffer(registro.fileKey);
        const fileName = String(registro.fileName || "arquivo").replace(/[\r\n"]/g, "");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Content-Type", registro.mimeType || "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        return res.send(buffer);
      }

      const arquivo = await storageGet(registro.fileKey);
      res.setHeader("Cache-Control", "no-store");
      return res.json({
        ok: true,
        url: arquivo.url,
        fileName: registro.fileName || "arquivo",
        mimeType: registro.mimeType || "application/octet-stream",
      });
    } catch (error) {
      console.error("[ProgramaIntegracaoRegistros] arquivo:", error);
      return res.status(500).json({ error: "Não foi possível abrir o arquivo." });
    }
  },
);
