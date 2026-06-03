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
    mp4: "video/mp4",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    zip: "application/zip",
  };
  return map[ext.toLowerCase()] || "application/octet-stream";
}

async function getConn() {
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
  const conn = (database as any).$client?.promise
    ? (database as any).$client.promise()
    : (database as any).$client;
  if (!conn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Conexão indisponível" });
  return conn as { execute: (sql: string, params?: any[]) => Promise<[any[], any]> };
}

const TIPOS = ["livro", "filme", "material"] as const;

// ============ ROUTER ============
export const bibliotecaLivrosRouter = router({

  // Listar itens — acessível a todos os usuários autenticados
  listar: protectedProcedure
    .input(
      z.object({
        tipo: z.enum(TIPOS).optional(),
        busca: z.string().optional(),
        categoria: z.string().optional(),
        apenasAtivos: z.boolean().optional().default(true),
      })
    )
    .query(async ({ input }) => {
      const conn = await getConn();
      let query = `
        SELECT id, tipo, titulo, autor, descricao, comentario, categoria,
               capa_url, pdf_url, link_externo, trailer_url, ativo, ordem, criado_em
        FROM biblioteca_livros
        WHERE 1=1
      `;
      const params: any[] = [];

      if (input.apenasAtivos) {
        query += " AND ativo = 1";
      }
      if (input.tipo) {
        query += " AND tipo = ?";
        params.push(input.tipo);
      }
      if (input.busca) {
        query += " AND (titulo LIKE ? OR autor LIKE ? OR descricao LIKE ? OR comentario LIKE ? OR categoria LIKE ?)";
        const like = `%${input.busca}%`;
        params.push(like, like, like, like, like);
      }
      if (input.categoria) {
        query += " AND categoria = ?";
        params.push(input.categoria);
      }
      query += " ORDER BY ordem ASC, criado_em DESC";

      const [rows] = await conn.execute(query, params);
      return rows as any[];
    }),

  // Listar categorias por tipo
  listarCategorias: protectedProcedure
    .input(z.object({ tipo: z.enum(TIPOS).optional() }))
    .query(async ({ input }) => {
      const conn = await getConn();
      let query = "SELECT DISTINCT categoria FROM biblioteca_livros WHERE ativo = 1 AND categoria IS NOT NULL AND categoria != ''";
      const params: any[] = [];
      if (input.tipo) {
        query += " AND tipo = ?";
        params.push(input.tipo);
      }
      query += " ORDER BY categoria ASC";
      const [rows] = await conn.execute(query, params);
      return (rows as any[]).map((r: any) => r.categoria as string);
    }),

  // Contar por tipo — para os cards do Mural
  contar: protectedProcedure.query(async () => {
    const conn = await getConn();
    const [rows] = await conn.execute(
      "SELECT tipo, COUNT(*) as total FROM biblioteca_livros WHERE ativo = 1 GROUP BY tipo"
    );
    const result: Record<string, number> = { livro: 0, filme: 0, material: 0, total: 0 };
    for (const r of rows as any[]) {
      result[r.tipo] = Number(r.total);
      result.total += Number(r.total);
    }
    return result;
  }),

  // Upload de arquivo — apenas admin
  uploadArquivo: adminProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64
        tipo: z.enum(["pdf", "capa", "material"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.fileData, "base64");
      const ext = input.fileName.split(".").pop() || "bin";
      const userId = (ctx.user as any).id || (ctx.user as any).openId || "admin";
      const key = `biblioteca/${userId}/${Date.now()}-${nanoid(8)}.${ext}`;
      const contentType = mimeForExt(ext);
      const result = await storagePut(key, buffer, contentType);
      return { url: result.url, key: result.key };
    }),

  // Criar item — apenas admin
  criar: adminProcedure
    .input(
      z.object({
        tipo: z.enum(TIPOS).default("livro"),
        titulo: z.string().min(1),
        autor: z.string().optional(),
        descricao: z.string().optional(),
        comentario: z.string().optional(),
        categoria: z.string().optional(),
        capa_url: z.string().optional(),
        pdf_url: z.string().optional(),
        link_externo: z.string().optional(),
        trailer_url: z.string().optional(),
        ordem: z.number().optional().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const conn = await getConn();
      const [result] = await conn.execute(
        `INSERT INTO biblioteca_livros (tipo, titulo, autor, descricao, comentario, categoria, capa_url, pdf_url, link_externo, trailer_url, ordem)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.tipo,
          input.titulo,
          input.autor || null,
          input.descricao || null,
          input.comentario || null,
          input.categoria || null,
          input.capa_url || null,
          input.pdf_url || null,
          input.link_externo || null,
          input.trailer_url || null,
          input.ordem ?? 0,
        ]
      );
      return { id: (result as any).insertId };
    }),

  // Editar item — apenas admin
  editar: adminProcedure
    .input(
      z.object({
        id: z.number(),
        tipo: z.enum(TIPOS).default("livro"),
        titulo: z.string().min(1),
        autor: z.string().optional(),
        descricao: z.string().optional(),
        comentario: z.string().optional(),
        categoria: z.string().optional(),
        capa_url: z.string().optional(),
        pdf_url: z.string().optional(),
        link_externo: z.string().optional(),
        trailer_url: z.string().optional(),
        ativo: z.boolean().optional().default(true),
        ordem: z.number().optional().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const conn = await getConn();
      await conn.execute(
        `UPDATE biblioteca_livros
         SET tipo=?, titulo=?, autor=?, descricao=?, comentario=?, categoria=?,
             capa_url=?, pdf_url=?, link_externo=?, trailer_url=?, ativo=?, ordem=?
         WHERE id=?`,
        [
          input.tipo,
          input.titulo,
          input.autor || null,
          input.descricao || null,
          input.comentario || null,
          input.categoria || null,
          input.capa_url || null,
          input.pdf_url || null,
          input.link_externo || null,
          input.trailer_url || null,
          input.ativo ? 1 : 0,
          input.ordem ?? 0,
          input.id,
        ]
      );
      return { ok: true };
    }),

  // Excluir item — apenas admin
  excluir: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const conn = await getConn();
      await conn.execute("DELETE FROM biblioteca_livros WHERE id = ?", [input.id]);
      return { ok: true };
    }),
});
