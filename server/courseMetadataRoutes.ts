import { Router, type NextFunction, type Request, type Response } from "express";
import { getRawConnection } from "./db";
import { sdk } from "./_core/sdk";

export const courseMetadataRouter = Router();

let metadataTableEnsured = false;

export async function ensureCourseMetadataTable() {
  if (metadataTableEnsured) return;

  const connection = await getRawConnection();
  if (!connection) {
    console.warn("[CourseMetadata] Banco indisponível; tabela de metadados não verificada.");
    return;
  }

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS curso_metadados (
      cursoId INT NOT NULL PRIMARY KEY,
      resumo TEXT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  metadataTableEnsured = true;
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await sdk.authenticateRequest(req);
    const role = (user as any)?.role;

    if (role !== "admin" && role !== "admin2") {
      return res.status(403).json({ error: "Acesso restrito ao administrador." });
    }

    (req as any).authenticatedUser = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Não autenticado." });
  }
}

function normalizeOptionalText(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

courseMetadataRouter.get(
  "/api/admin/cursos/:cursoId/metadata",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const cursoId = Number(req.params.cursoId);
      if (!Number.isInteger(cursoId) || cursoId <= 0) {
        return res.status(400).json({ error: "Curso inválido." });
      }

      await ensureCourseMetadataTable();
      const connection = await getRawConnection();
      if (!connection) {
        return res.status(503).json({ error: "Banco de dados indisponível." });
      }

      const [rows] = (await connection.execute(
        `SELECT c.id, c.titulo, c.descricao, m.resumo
           FROM cursos_competencias c
           LEFT JOIN curso_metadados m ON m.cursoId = c.id
          WHERE c.id = ?
          LIMIT 1`,
        [cursoId]
      )) as any;

      const curso = Array.isArray(rows) ? rows[0] : null;
      if (!curso) {
        return res.status(404).json({ error: "Curso não encontrado." });
      }

      return res.json({
        id: curso.id,
        titulo: curso.titulo ?? "",
        descricao: curso.descricao ?? "",
        resumo: curso.resumo ?? "",
      });
    } catch (error) {
      console.error("[CourseMetadata] Erro ao carregar curso:", error);
      return res.status(500).json({ error: "Não foi possível carregar os dados do curso." });
    }
  }
);

courseMetadataRouter.put(
  "/api/admin/cursos/:cursoId/metadata",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const cursoId = Number(req.params.cursoId);
      if (!Number.isInteger(cursoId) || cursoId <= 0) {
        return res.status(400).json({ error: "Curso inválido." });
      }

      const titulo = typeof req.body?.titulo === "string" ? req.body.titulo.trim() : "";
      if (!titulo) {
        return res.status(400).json({ error: "O título do curso é obrigatório." });
      }
      if (titulo.length > 255) {
        return res.status(400).json({ error: "O título deve ter no máximo 255 caracteres." });
      }

      const descricao = normalizeOptionalText(req.body?.descricao);
      const resumo = normalizeOptionalText(req.body?.resumo);

      await ensureCourseMetadataTable();
      const connection = await getRawConnection();
      if (!connection) {
        return res.status(503).json({ error: "Banco de dados indisponível." });
      }

      const [result] = (await connection.execute(
        `UPDATE cursos_competencias
            SET titulo = ?, descricao = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?`,
        [titulo, descricao, cursoId]
      )) as any;

      if (!result || result.affectedRows === 0) {
        return res.status(404).json({ error: "Curso não encontrado." });
      }

      await connection.execute(
        `INSERT INTO curso_metadados (cursoId, resumo)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE resumo = VALUES(resumo), updatedAt = CURRENT_TIMESTAMP`,
        [cursoId, resumo]
      );

      return res.json({ success: true });
    } catch (error) {
      console.error("[CourseMetadata] Erro ao atualizar curso:", error);
      return res.status(500).json({ error: "Não foi possível salvar as alterações do curso." });
    }
  }
);
