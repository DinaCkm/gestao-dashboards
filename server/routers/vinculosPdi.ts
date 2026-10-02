import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "../_core/trpc";
import { getRawConnection } from "../db";
import { assinarIntegracao } from "../integracaoAssinatura";
import { CODIGO_PDI_REGEX, criarVinculo, listarVinculos, removerVinculo } from "../pdiVinculos";

// Tela "Vínculos com o PDI": o admin liga cada competência de origem das ações do PDI
// (catálogo lido do PDI) às competências do EcoLíder cujos cursos podem ser indicados.

const CATALOGO_PATH = "/api/integracao/ecolider/catalogo-competencias";

export type ItemCatalogoPdi = {
  codigo: string;
  tipo: "COMPORTAMENTAL" | "TECNICA";
  competencia: string;
  nivel: string | null;
  grupo: string;
  conflito: boolean;
  nomesEncontrados?: string[];
};

export async function buscarCatalogoPdi(opcoes: {
  secret: string | undefined;
  baseUrl: string;
  fetchImpl?: typeof fetch;
}): Promise<ItemCatalogoPdi[]> {
  if (!opcoes.secret) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Integração com o PDI não configurada (INTEGRACAO_PDI_ECOLIDER_SECRET)." });
  }
  const timestamp = String(Math.floor(Date.now() / 1000));
  const resposta = await (opcoes.fetchImpl ?? fetch)(`${opcoes.baseUrl.replace(/\/$/, "")}${CATALOGO_PATH}`, {
    headers: {
      "X-Integracao-Timestamp": timestamp,
      "X-Integracao-Assinatura": assinarIntegracao(opcoes.secret, timestamp, "GET", CATALOGO_PATH),
    },
  });
  if (!resposta.ok) {
    throw new TRPCError({ code: "BAD_GATEWAY", message: `O PDI não devolveu o catálogo (HTTP ${resposta.status}).` });
  }
  const corpo = (await resposta.json()) as { itens?: ItemCatalogoPdi[] };
  return Array.isArray(corpo.itens) ? corpo.itens : [];
}

export const vinculosPdiRouter = router({
  catalogoPdi: adminProcedure.query(async () =>
    buscarCatalogoPdi({
      secret: process.env.INTEGRACAO_PDI_ECOLIDER_SECRET,
      baseUrl: process.env.PDI_BASE_URL || "https://pdi.ecodobem.com",
    })
  ),

  competenciasEcolider: adminProcedure.query(async () => {
    const connection = await getRawConnection();
    if (!connection) return [];
    const [rows] = (await connection.execute(
      `SELECT comp.id, comp.nome, t.name AS trilhaNome,
              (SELECT COUNT(*) FROM cursos_competencias c WHERE c.competenciaId = comp.id AND c.isActive = 1) AS totalCursos
         FROM competencias comp
         LEFT JOIN trilhas t ON t.id = comp.trilhaId
        WHERE comp.isActive = 1
        ORDER BY t.name, comp.nome`
    )) as any;
    return (Array.isArray(rows) ? rows : []).map((r: any) => ({
      id: Number(r.id),
      nome: String(r.nome),
      trilhaNome: r.trilhaNome ?? null,
      totalCursos: Number(r.totalCursos ?? 0),
    }));
  }),

  listar: adminProcedure.query(async () => await listarVinculos()),

  vincular: adminProcedure
    .input(z.object({
      codigoPdi: z.string().regex(CODIGO_PDI_REGEX, "Código do PDI inválido"),
      rotuloPdi: z.string().min(1).max(255),
      competenciaId: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const connection = await getRawConnection();
      if (!connection) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      const [rows] = (await connection.execute(
        `SELECT id FROM competencias WHERE id = ? AND isActive = 1 LIMIT 1`,
        [input.competenciaId]
      )) as any;
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Competência do EcoLíder não encontrada ou inativa." });
      }
      await criarVinculo({
        codigoPdi: input.codigoPdi,
        tipo: input.codigoPdi.startsWith("TEC:") ? "TECNICA" : "COMPORTAMENTAL",
        rotuloPdi: input.rotuloPdi,
        competenciaId: input.competenciaId,
        criadoPor: Number(ctx.user.id) || null,
      });
      return { success: true };
    }),

  desvincular: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await removerVinculo(input.id);
      return { success: true };
    }),
});
