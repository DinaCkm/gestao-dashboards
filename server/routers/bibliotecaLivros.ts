import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

// ============ HELPERS ============
function mimeForExt(ext: string): string {
  const map: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  return map[ext.toLowerCase()] || "application/octet-stream";
}

async function getRawConn() {
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
  const conn = (database as any).$client?.promise
    ? (database as any).$client.promise()
    : (database as any).$client;
  if (!conn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Conexão indisponível" });
  return conn as { execute: (sql: string, params?: any[]) => Promise<[any[], any]> };
}

// ============ ROUTER ============
export const bibliotecaLivrosRouter = router({
  // Listar livros — acessível a todos os usuários autenticados
  listar: protectedProcedure
    .input(
      z.object({
        busca: z.string().optional(),
        categoria: z.string().optional(),
        apenasAtivos: z.boolean().optional().default(true),
      })
    )
    .query(async ({ input }) => {
      const conn = await getRawConn();
      let query = `
        SELECT id, titulo, autor, descricao, categoria, capa_url, pdf_url, link_externo, ativo, ordem, criado_em
        FROM biblioteca_livros
        WHERE 1=1
      `;
      const params: any[] = [];

      if (input.apenasAtivos) {
        query += " AND ativo = 1";
      }
      if (input.busca) {
        query += " AND (titulo LIKE ? OR autor LIKE ? OR descricao LIKE ? OR categoria LIKE ?)";
        const like = `%${input.busca}%`;
        params.push(like, like, like, like);
      }
      if (input.categoria) {
        query += " AND categoria = ?";
        params.push(input.categoria);
      }
      query += " ORDER BY ordem ASC, criado_em DESC";

      const [rows] = await conn.execute(query, params);
      return rows as any[];
    }),

  // Listar categorias únicas — acessível a todos
  listarCategorias: protectedProcedure.query(async () => {
    const conn = await getRawConn();
    const [rows] = await conn.execute(
      "SELECT DISTINCT categoria FROM biblioteca_livros WHERE ativo = 1 AND categoria IS NOT NULL AND categoria != '' ORDER BY categoria ASC"
    );
    return (rows as any[]).map((r: any) => r.categoria as string);
  }),

  // Contar livros ativos — para o card do Mural
  contar: protectedProcedure.query(async () => {
    const conn = await getRawConn();
    const [rows] = await conn.execute("SELECT COUNT(*) as total FROM biblioteca_livros WHERE ativo = 1");
    return { total: Number((rows as any[])[0]?.total ?? 0) };
  }),

  // Upload de arquivo (PDF ou imagem de capa) — apenas admin
  uploadArquivo: adminProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64
        tipo: z.enum(["pdf", "capa"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.fileData, "base64");
      const ext = input.fileName.split(".").pop() || (input.tipo === "pdf" ? "pdf" : "jpg");
      const key = `biblioteca/${ctx.user.id}/${Date.now()}-${nanoid(8)}.${ext}`;
      const contentType = mimeForExt(ext);
      const result = await storagePut(key, buffer, contentType);
      return { url: result.url, key: result.key };
    }),

  // Criar livro — apenas admin
  criar: adminProcedure
    .input(
      z.object({
        titulo: z.string().min(1),
        autor: z.string().optional(),
        descricao: z.string().optional(),
        categoria: z.string().optional(),
        capa_url: z.string().optional(),
        pdf_url: z.string().optional(),
        link_externo: z.string().optional(),
        ordem: z.number().optional().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const conn = await getRawConn();
      const [result] = await conn.execute(
        `INSERT INTO biblioteca_livros (titulo, autor, descricao, categoria, capa_url, pdf_url, link_externo, ordem)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.titulo,
          input.autor || null,
          input.descricao || null,
          input.categoria || null,
          input.capa_url || null,
          input.pdf_url || null,
          input.link_externo || null,
          input.ordem ?? 0,
        ]
      );
      return { id: (result as any).insertId };
    }),

  // Editar livro — apenas admin
  editar: adminProcedure
    .input(
      z.object({
        id: z.number(),
        titulo: z.string().min(1),
        autor: z.string().optional(),
        descricao: z.string().optional(),
        categoria: z.string().optional(),
        capa_url: z.string().optional(),
        pdf_url: z.string().optional(),
        link_externo: z.string().optional(),
        ativo: z.boolean().optional().default(true),
        ordem: z.number().optional().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const conn = await getRawConn();
      await conn.execute(
        `UPDATE biblioteca_livros SET titulo=?, autor=?, descricao=?, categoria=?, capa_url=?, pdf_url=?, link_externo=?, ativo=?, ordem=?
         WHERE id=?`,
        [
          input.titulo,
          input.autor || null,
          input.descricao || null,
          input.categoria || null,
          input.capa_url || null,
          input.pdf_url || null,
          input.link_externo || null,
          input.ativo ? 1 : 0,
          input.ordem ?? 0,
          input.id,
        ]
      );
      return { ok: true };
    }),

  // Excluir livro — apenas admin
  excluir: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const conn = await getRawConn();
      await conn.execute("DELETE FROM biblioteca_livros WHERE id = ?", [input.id]);
      return { ok: true };
    }),
});
