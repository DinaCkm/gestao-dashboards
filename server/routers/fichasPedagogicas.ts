import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  fichasPedagogicasCompetencias,
  fichasPedagogicasConteudos,
  competencias,
  trilhas,
  competenciasModulos,
} from "../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import * as XLSX from "xlsx";

// ============ HELPERS ============

function camposObrigatoriosCompetencia(data: Record<string, unknown>): string[] {
  const obrigatorios = [
    "linhaDesenvolvimento",
    "objetivoPedagogico",
    "oQueEnsina",
    "quandoIndicar",
    "sinaisObservaveis",
    "resumoMentor",
    "descricaoAluno",
    "sugestaoDesenvolvimentoCompetencia",
  ];
  return obrigatorios.filter((c) => !data[c] || String(data[c]).trim() === "");
}

function camposObrigatoriosConteudo(data: Record<string, unknown>): string[] {
  const obrigatorios = [
    "tipoConteudo",
    "nomeConteudo",
    "papelPedagogico",
    "oQueAlunoAprende",
    "reflexaoEsperada",
    "orientacaoMentor",
    "descricaoAluno",
  ];
  return obrigatorios.filter((c) => !data[c] || String(data[c]).trim() === "");
}

// ============ SCHEMAS ============

const fichaCompetenciaInput = z.object({
  competenciaId: z.number().int().positive(),
  linhaDesenvolvimento: z.string().min(1),
  objetivoPedagogico: z.string().min(1),
  oQueEnsina: z.string().min(1),
  quandoIndicar: z.string().min(1),
  sinaisObservaveis: z.string().min(1),
  cuidadoIndicacao: z.string().optional(),
  resumoMentor: z.string().min(1),
  descricaoAluno: z.string().min(1),
  sugestaoDesenvolvimentoCompetencia: z.string().min(1),
  status: z.enum(["rascunho", "publicada", "inativa"]).default("rascunho"),
});

const fichaConteudoInput = z.object({
  competenciaId: z.number().int().positive(),
  conteudoId: z.number().int().positive(),
  tipoConteudo: z.enum(["intro", "filme", "video", "tedtalk", "podcast", "livro", "curso", "outro"]),
  nomeConteudo: z.string().min(1),
  linkConteudo: z.string().optional(),
  papelPedagogico: z.string().min(1),
  oQueAlunoAprende: z.string().min(1),
  reflexaoEsperada: z.string().min(1),
  quandoUsar: z.string().optional(),
  orientacaoMentor: z.string().min(1),
  descricaoAluno: z.string().min(1),
  status: z.enum(["rascunho", "publicada", "inativa"]).default("rascunho"),
});

// ============ ROUTER ============

export const fichasPedagogicasRouter = router({

  // ---- LISTAGEM GERAL ----
  listarCompetenciasComStatus: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

    const todasCompetencias = await db
      .select({
        id: competencias.id,
        nome: competencias.nome,
        trilhaId: competencias.trilhaId,
        isActive: competencias.isActive,
      })
      .from(competencias)
      .orderBy(competencias.trilhaId, competencias.ordem);

    const todasTrilhas = await db.select().from(trilhas);
    const trilhaMap = new Map(todasTrilhas.map((t) => [t.id, t.name]));

    const fichasComp = await db.select().from(fichasPedagogicasCompetencias);
    const fichasCompMap = new Map(fichasComp.map((f) => [f.competenciaId, f]));

    const todosModulos = await db.select().from(competenciasModulos);
    const modulosPorComp = new Map<number, typeof todosModulos>();
    for (const m of todosModulos) {
      const lista = modulosPorComp.get(m.competenciaId) || [];
      lista.push(m);
      modulosPorComp.set(m.competenciaId, lista);
    }

    const fichasConteudo = await db.select().from(fichasPedagogicasConteudos);
    const fichasConteudoMap = new Map<number, typeof fichasConteudo>();
    for (const f of fichasConteudo) {
      const lista = fichasConteudoMap.get(f.competenciaId) || [];
      lista.push(f);
      fichasConteudoMap.set(f.competenciaId, lista);
    }

    return todasCompetencias.map((comp) => {
      const ficha = fichasCompMap.get(comp.id);
      const modulos = modulosPorComp.get(comp.id) || [];
      const fichasConts = fichasConteudoMap.get(comp.id) || [];
      const fichasPublicadas = fichasConts.filter((f) => f.status === "publicada").length;

      return {
        id: comp.id,
        nome: comp.nome,
        trilhaNome: trilhaMap.get(comp.trilhaId) || "—",
        trilhaId: comp.trilhaId,
        isActive: comp.isActive,
        fichaCompetencia: ficha
          ? { id: ficha.id, status: ficha.status, updatedAt: ficha.updatedAt }
          : null,
        totalConteudos: modulos.length,
        fichasConteudoPublicadas: fichasPublicadas,
        fichasConteudoTotal: fichasConts.length,
        ultimaAtualizacao: ficha?.updatedAt || null,
      };
    });
  }),

  // ---- DETALHE DA COMPETÊNCIA ----
  obterDetalheCompetencia: adminProcedure
    .input(z.object({ competenciaId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const [comp] = await db
        .select()
        .from(competencias)
        .where(eq(competencias.id, input.competenciaId));
      if (!comp) throw new TRPCError({ code: "NOT_FOUND", message: "Competência não encontrada" });

      const [trilha] = await db.select().from(trilhas).where(eq(trilhas.id, comp.trilhaId));

      const fichasComp = await db
        .select()
        .from(fichasPedagogicasCompetencias)
        .where(eq(fichasPedagogicasCompetencias.competenciaId, input.competenciaId));

      const modulos = await db
        .select()
        .from(competenciasModulos)
        .where(eq(competenciasModulos.competenciaId, input.competenciaId))
        .orderBy(competenciasModulos.ordem);

      const fichasConts = await db
        .select()
        .from(fichasPedagogicasConteudos)
        .where(eq(fichasPedagogicasConteudos.competenciaId, input.competenciaId));

      const fichasConteudoMap = new Map(fichasConts.map((f) => [f.conteudoId, f]));

      return {
        competencia: { ...comp, trilhaNome: trilha?.name || "—" },
        fichasCompetencia: fichasComp,
        conteudos: modulos.map((m) => ({
          ...m,
          ficha: fichasConteudoMap.get(m.id) || null,
        })),
      };
    }),

  // ---- FICHA DA COMPETÊNCIA: CRUD ----
  obterFichaCompetencia: adminProcedure
    .input(z.object({ competenciaId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      const fichas = await db
        .select()
        .from(fichasPedagogicasCompetencias)
        .where(eq(fichasPedagogicasCompetencias.competenciaId, input.competenciaId));
      return fichas[0] || null;
    }),

  criarFichaCompetencia: adminProcedure
    .input(fichaCompetenciaInput)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      // Verificar se competência existe
      const [comp] = await db.select().from(competencias).where(eq(competencias.id, input.competenciaId));
      if (!comp) throw new TRPCError({ code: "NOT_FOUND", message: "Competência não encontrada" });

      // Verificar se já existe ficha publicada
      if (input.status === "publicada") {
        const existente = await db
          .select()
          .from(fichasPedagogicasCompetencias)
          .where(
            and(
              eq(fichasPedagogicasCompetencias.competenciaId, input.competenciaId),
              eq(fichasPedagogicasCompetencias.status, "publicada")
            )
          );
        if (existente.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe uma ficha publicada para esta competência. Inative a ficha atual antes de publicar uma nova.",
          });
        }

        // Validar campos obrigatórios para publicação
        const faltando = camposObrigatoriosCompetencia(input as Record<string, unknown>);
        if (faltando.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Campos obrigatórios faltando para publicar: ${faltando.join(", ")}`,
          });
        }
      }

      const userName = ctx.user?.name || ctx.user?.email || "admin";
      await db.insert(fichasPedagogicasCompetencias).values({
        ...input,
        createdBy: userName,
        updatedBy: userName,
      });

      return { success: true };
    }),

  atualizarFichaCompetencia: adminProcedure
    .input(z.object({ id: z.number().int().positive() }).merge(fichaCompetenciaInput.partial()))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const { id, ...dados } = input;

      // Verificar se já existe outra ficha publicada (ao publicar)
      if (dados.status === "publicada" && dados.competenciaId) {
        const existente = await db
          .select()
          .from(fichasPedagogicasCompetencias)
          .where(
            and(
              eq(fichasPedagogicasCompetencias.competenciaId, dados.competenciaId),
              eq(fichasPedagogicasCompetencias.status, "publicada")
            )
          );
        const outra = existente.filter((f) => f.id !== id);
        if (outra.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe uma ficha publicada para esta competência.",
          });
        }

        // Validar campos obrigatórios
        const faltando = camposObrigatoriosCompetencia(dados as Record<string, unknown>);
        if (faltando.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Campos obrigatórios faltando para publicar: ${faltando.join(", ")}`,
          });
        }
      }

      const userName = ctx.user?.name || ctx.user?.email || "admin";
      await db
        .update(fichasPedagogicasCompetencias)
        .set({ ...dados, updatedBy: userName })
        .where(eq(fichasPedagogicasCompetencias.id, id));

      return { success: true };
    }),

  publicarFichaCompetencia: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const [ficha] = await db
        .select()
        .from(fichasPedagogicasCompetencias)
        .where(eq(fichasPedagogicasCompetencias.id, input.id));
      if (!ficha) throw new TRPCError({ code: "NOT_FOUND", message: "Ficha não encontrada" });

      const faltando = camposObrigatoriosCompetencia(ficha as unknown as Record<string, unknown>);
      if (faltando.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Campos obrigatórios faltando: ${faltando.join(", ")}`,
        });
      }

      // Verificar se já existe outra publicada
      const existente = await db
        .select()
        .from(fichasPedagogicasCompetencias)
        .where(
          and(
            eq(fichasPedagogicasCompetencias.competenciaId, ficha.competenciaId),
            eq(fichasPedagogicasCompetencias.status, "publicada")
          )
        );
      if (existente.some((f) => f.id !== input.id)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe uma ficha publicada para esta competência.",
        });
      }

      const userName = ctx.user?.name || ctx.user?.email || "admin";
      await db
        .update(fichasPedagogicasCompetencias)
        .set({ status: "publicada", updatedBy: userName })
        .where(eq(fichasPedagogicasCompetencias.id, input.id));

      return { success: true };
    }),

  inativarFichaCompetencia: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      const userName = ctx.user?.name || ctx.user?.email || "admin";
      await db
        .update(fichasPedagogicasCompetencias)
        .set({ status: "inativa", updatedBy: userName })
        .where(eq(fichasPedagogicasCompetencias.id, input.id));
      return { success: true };
    }),

  // ---- FICHA DO CONTEÚDO: CRUD ----
  listarConteudosDaCompetencia: adminProcedure
    .input(z.object({ competenciaId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const modulos = await db
        .select()
        .from(competenciasModulos)
        .where(eq(competenciasModulos.competenciaId, input.competenciaId))
        .orderBy(competenciasModulos.ordem);

      const fichas = await db
        .select()
        .from(fichasPedagogicasConteudos)
        .where(eq(fichasPedagogicasConteudos.competenciaId, input.competenciaId));

      const fichasMap = new Map(fichas.map((f) => [f.conteudoId, f]));

      return modulos.map((m) => ({
        ...m,
        ficha: fichasMap.get(m.id) || null,
      }));
    }),

  obterFichaConteudo: adminProcedure
    .input(z.object({ conteudoId: z.number().int().positive(), competenciaId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      const fichas = await db
        .select()
        .from(fichasPedagogicasConteudos)
        .where(
          and(
            eq(fichasPedagogicasConteudos.conteudoId, input.conteudoId),
            eq(fichasPedagogicasConteudos.competenciaId, input.competenciaId)
          )
        );
      return fichas[0] || null;
    }),

  criarFichaConteudo: adminProcedure
    .input(fichaConteudoInput)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      // Verificar se conteúdo existe e pertence à competência
      const [modulo] = await db
        .select()
        .from(competenciasModulos)
        .where(
          and(
            eq(competenciasModulos.id, input.conteudoId),
            eq(competenciasModulos.competenciaId, input.competenciaId)
          )
        );
      if (!modulo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `O conteúdo não foi encontrado vinculado à competência informada.`,
        });
      }

      // Verificar se já existe ficha publicada
      if (input.status === "publicada") {
        const existente = await db
          .select()
          .from(fichasPedagogicasConteudos)
          .where(
            and(
              eq(fichasPedagogicasConteudos.conteudoId, input.conteudoId),
              eq(fichasPedagogicasConteudos.competenciaId, input.competenciaId),
              eq(fichasPedagogicasConteudos.status, "publicada")
            )
          );
        if (existente.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe uma ficha publicada para este conteúdo.",
          });
        }

        const faltando = camposObrigatoriosConteudo(input as Record<string, unknown>);
        if (faltando.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Campos obrigatórios faltando para publicar: ${faltando.join(", ")}`,
          });
        }
      }

      const userName = ctx.user?.name || ctx.user?.email || "admin";
      await db.insert(fichasPedagogicasConteudos).values({
        ...input,
        createdBy: userName,
        updatedBy: userName,
      });

      return { success: true };
    }),

  atualizarFichaConteudo: adminProcedure
    .input(z.object({ id: z.number().int().positive() }).merge(fichaConteudoInput.partial()))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const { id, ...dados } = input;

      if (dados.status === "publicada" && dados.conteudoId && dados.competenciaId) {
        const existente = await db
          .select()
          .from(fichasPedagogicasConteudos)
          .where(
            and(
              eq(fichasPedagogicasConteudos.conteudoId, dados.conteudoId),
              eq(fichasPedagogicasConteudos.competenciaId, dados.competenciaId),
              eq(fichasPedagogicasConteudos.status, "publicada")
            )
          );
        if (existente.some((f) => f.id !== id)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe uma ficha publicada para este conteúdo.",
          });
        }

        const faltando = camposObrigatoriosConteudo(dados as Record<string, unknown>);
        if (faltando.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Campos obrigatórios faltando para publicar: ${faltando.join(", ")}`,
          });
        }
      }

      const userName = ctx.user?.name || ctx.user?.email || "admin";
      await db
        .update(fichasPedagogicasConteudos)
        .set({ ...dados, updatedBy: userName })
        .where(eq(fichasPedagogicasConteudos.id, id));

      return { success: true };
    }),

  publicarFichaConteudo: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const [ficha] = await db
        .select()
        .from(fichasPedagogicasConteudos)
        .where(eq(fichasPedagogicasConteudos.id, input.id));
      if (!ficha) throw new TRPCError({ code: "NOT_FOUND", message: "Ficha não encontrada" });

      const faltando = camposObrigatoriosConteudo(ficha as unknown as Record<string, unknown>);
      if (faltando.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Campos obrigatórios faltando: ${faltando.join(", ")}`,
        });
      }

      const existente = await db
        .select()
        .from(fichasPedagogicasConteudos)
        .where(
          and(
            eq(fichasPedagogicasConteudos.conteudoId, ficha.conteudoId),
            eq(fichasPedagogicasConteudos.competenciaId, ficha.competenciaId),
            eq(fichasPedagogicasConteudos.status, "publicada")
          )
        );
      if (existente.some((f) => f.id !== input.id)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe uma ficha publicada para este conteúdo.",
        });
      }

      const userName = ctx.user?.name || ctx.user?.email || "admin";
      await db
        .update(fichasPedagogicasConteudos)
        .set({ status: "publicada", updatedBy: userName })
        .where(eq(fichasPedagogicasConteudos.id, input.id));

      return { success: true };
    }),

  inativarFichaConteudo: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      const userName = ctx.user?.name || ctx.user?.email || "admin";
      await db
        .update(fichasPedagogicasConteudos)
        .set({ status: "inativa", updatedBy: userName })
        .where(eq(fichasPedagogicasConteudos.id, input.id));
      return { success: true };
    }),

  // ---- DOWNLOAD DO MODELO EXCEL ----
  gerarModeloExcel: adminProcedure.mutation(async () => {
    const wb = XLSX.utils.book_new();

    // Aba 1: Fichas das Competências
    const wsComp = XLSX.utils.aoa_to_sheet([
      [
        "nome_competencia",
        "linha_desenvolvimento",
        "objetivo_pedagogico",
        "o_que_ensina",
        "quando_indicar",
        "sinais_observaveis",
        "cuidado_indicacao",
        "resumo_mentor",
        "descricao_aluno",
        "sugestao_desenvolvimento_competencia",
        "status",
      ],
      [
        "Accountability",
        "Responsabilidade pessoal, protagonismo...",
        "Desenvolver a capacidade de assumir escolhas...",
        "Autonomia, excelência, cumprimento de combinados...",
        "Baixa iniciativa, excesso de justificativas...",
        "Espera cobrança para agir, transfere responsabilidade...",
        "Verificar se o problema não é falta de clareza...",
        "Indicada para mentorados com baixa autonomia...",
        "Nesta competência você vai desenvolver...",
        "Trabalhar uma situação real em que o mentorado...",
        "rascunho",
      ],
    ]);
    XLSX.utils.book_append_sheet(wb, wsComp, "Fichas das Competencias");

    // Aba 2: Fichas dos Cursos/Conteúdos
    const wsCont = XLSX.utils.aoa_to_sheet([
      [
        "nome_competencia",
        "nome_conteudo",
        "tipo_conteudo",
        "link_conteudo",
        "papel_pedagogico",
        "o_que_aluno_aprende",
        "reflexao_esperada",
        "quando_usar",
        "orientacao_mentor",
        "descricao_aluno",
        "status",
      ],
      [
        "Accountability",
        "Filme Whiplash",
        "filme",
        "",
        "Provocar reflexão sobre disciplina, pressão, excelência...",
        "Que evolução exige compromisso, esforço consciente...",
        "Como estou lidando com cobrança, exigência, superação...",
        "Quando o mentorado apresenta baixa disciplina...",
        "Usar o filme para discutir limites entre excelência...",
        "Este conteúdo ajuda você a refletir sobre esforço...",
        "rascunho",
      ],
    ]);
    XLSX.utils.book_append_sheet(wb, wsCont, "Fichas dos Conteudos");

    const buffer = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    return { base64: buffer, filename: "modelo_biblioteca_pedagogica.xlsx" };
  }),

  // ---- VALIDAR UPLOAD ----
  validarImportacao: adminProcedure
    .input(z.object({ base64: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const buffer = Buffer.from(input.base64, "base64");
      const wb = XLSX.read(buffer, { type: "buffer" });

      const todasCompetencias = await db.select().from(competencias);
      const compNomeMap = new Map(todasCompetencias.map((c) => [c.nome.toLowerCase().trim(), c]));

      const todosModulos = await db.select().from(competenciasModulos);

      const resultadosComp: Array<{
        linha: number;
        tipo: string;
        competencia: string;
        conteudo: string;
        status: string;
        resultado: string;
        erro: boolean;
        dados?: Record<string, string>;
      }> = [];

      const resultadosCont: typeof resultadosComp = [];

      // Processar aba de competências
      const wsComp = wb.Sheets["Fichas das Competencias"];
      if (wsComp) {
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wsComp, { defval: "" });
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const nomeComp = String(row["nome_competencia"] || "").trim();
          const status = String(row["status"] || "rascunho").trim().toLowerCase();
          const comp = compNomeMap.get(nomeComp.toLowerCase());

          let resultado = "OK";
          let erro = false;

          if (!nomeComp) {
            resultado = "Erro: nome_competencia vazio";
            erro = true;
          } else if (!comp) {
            resultado = `Erro: competência "${nomeComp}" não encontrada no sistema`;
            erro = true;
          } else if (!["rascunho", "publicada", "inativa"].includes(status)) {
            resultado = `Erro: status "${status}" inválido (use rascunho, publicada ou inativa)`;
            erro = true;
          } else {
            const camposObrig = [
              "linha_desenvolvimento",
              "objetivo_pedagogico",
              "o_que_ensina",
              "quando_indicar",
              "sinais_observaveis",
              "resumo_mentor",
              "descricao_aluno",
              "sugestao_desenvolvimento_competencia",
            ];
            const faltando = camposObrig.filter((c) => !row[c] || row[c].trim() === "");
            if (faltando.length > 0 && status === "publicada") {
              resultado = `Erro: campos obrigatórios vazios para publicar: ${faltando.join(", ")}`;
              erro = true;
            } else if (faltando.length > 0) {
              resultado = `Alerta: campos opcionais/incompletos — será salvo como rascunho`;
            }
          }

          resultadosComp.push({
            linha: i + 2,
            tipo: "Competência",
            competencia: nomeComp,
            conteudo: "—",
            status,
            resultado,
            erro,
            dados: comp ? { ...row, competenciaId: String(comp.id) } : undefined,
          });
        }
      }

      // Processar aba de conteúdos
      // REGRA: competência deve existir; conteúdo pode ser criado pelo upload
      const wsCont = wb.Sheets["Fichas dos Conteudos"];
      if (wsCont) {
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wsCont, { defval: "" });
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const nomeComp = String(row["nome_competencia"] || "").trim();
          const nomeCont = String(row["nome_conteudo"] || "").trim();
          const status = String(row["status"] || "rascunho").trim().toLowerCase();
          const comp = compNomeMap.get(nomeComp.toLowerCase());

          let resultado = "OK";
          let erro = false;

          if (!nomeComp) {
            resultado = "Erro: nome_competencia vazio";
            erro = true;
          } else if (!comp) {
            resultado = `Erro: competência "${nomeComp}" não encontrada no sistema`;
            erro = true;
          } else if (!nomeCont) {
            resultado = "Erro: nome_conteudo vazio";
            erro = true;
          } else if (!["rascunho", "publicada", "inativa"].includes(status)) {
            resultado = `Erro: status "${status}" inválido (use rascunho, publicada ou inativa)`;
            erro = true;
          } else {
            // Verificar se o conteúdo já existe (apenas informativo — não bloqueia)
            const moduloExistente = todosModulos.find(
              (m) =>
                m.competenciaId === comp.id &&
                m.titulo.toLowerCase().trim() === nomeCont.toLowerCase()
            );

            const camposObrig = [
              "papel_pedagogico",
              "o_que_aluno_aprende",
              "reflexao_esperada",
              "orientacao_mentor",
              "descricao_aluno",
            ];
            const faltando = camposObrig.filter((c) => !row[c] || row[c].trim() === "");
            if (faltando.length > 0 && status === "publicada") {
              resultado = `Erro: campos obrigatórios vazios para publicar: ${faltando.join(", ")}`;
              erro = true;
            } else if (faltando.length > 0) {
              resultado = `Alerta: campos incompletos — será salvo como rascunho`;
            } else if (!moduloExistente) {
              resultado = `Novo conteúdo — será criado e vinculado à competência`;
            }
          }

          resultadosCont.push({
            linha: i + 2,
            tipo: "Conteúdo",
            competencia: nomeComp,
            conteudo: nomeCont,
            status,
            resultado,
            erro,
            dados: comp ? { ...row, competenciaId: String(comp.id) } : undefined,
          });
        }
      }

      const todos = [...resultadosComp, ...resultadosCont];
      const temErrosCriticos = todos.some((r) => r.erro);

      return {
        resultados: todos,
        temErrosCriticos,
        totalLinhas: todos.length,
        totalErros: todos.filter((r) => r.erro).length,
        totalAlertas: todos.filter((r) => !r.erro && r.resultado !== "OK").length,
        totalOk: todos.filter((r) => !r.erro && r.resultado === "OK").length,
      };
    }),

  // ---- CONFIRMAR IMPORTAÇÃO ----
  confirmarImportacao: adminProcedure
    .input(z.object({ base64: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const buffer = Buffer.from(input.base64, "base64");
      const wb = XLSX.read(buffer, { type: "buffer" });

      const todasCompetencias = await db.select().from(competencias);
      const compNomeMap = new Map(todasCompetencias.map((c) => [c.nome.toLowerCase().trim(), c]));
      const todosModulos = await db.select().from(competenciasModulos);

      const userName = ctx.user?.name || ctx.user?.email || "admin";

      let compCriadas = 0, compAtualizadas = 0;
      let contCriadas = 0, contAtualizadas = 0;
      let rascunhos = 0, erros = 0;

      // Processar fichas de competências
      const wsComp = wb.Sheets["Fichas das Competencias"];
      if (wsComp) {
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wsComp, { defval: "" });
        for (const row of rows) {
          const nomeComp = String(row["nome_competencia"] || "").trim();
          const comp = compNomeMap.get(nomeComp.toLowerCase());
          if (!comp) { erros++; continue; }

          let status = String(row["status"] || "rascunho").trim().toLowerCase() as "rascunho" | "publicada" | "inativa";

          const dados = {
            competenciaId: comp.id,
            linhaDesenvolvimento: row["linha_desenvolvimento"] || "",
            objetivoPedagogico: row["objetivo_pedagogico"] || "",
            oQueEnsina: row["o_que_ensina"] || "",
            quandoIndicar: row["quando_indicar"] || "",
            sinaisObservaveis: row["sinais_observaveis"] || "",
            cuidadoIndicacao: row["cuidado_indicacao"] || undefined,
            resumoMentor: row["resumo_mentor"] || "",
            descricaoAluno: row["descricao_aluno"] || "",
            sugestaoDesenvolvimentoCompetencia: row["sugestao_desenvolvimento_competencia"] || "",
            status,
            updatedBy: userName,
          };

          // Verificar se já existe ficha
          const existente = await db
            .select()
            .from(fichasPedagogicasCompetencias)
            .where(eq(fichasPedagogicasCompetencias.competenciaId, comp.id));

          if (existente.length === 0) {
            await db.insert(fichasPedagogicasCompetencias).values({ ...dados, createdBy: userName });
            if (status === "rascunho") rascunhos++;
            compCriadas++;
          } else {
            const fichaAtual = existente[0];
            // Se ficha publicada, criar rascunho novo em vez de sobrescrever
            if (fichaAtual.status === "publicada" && status === "publicada") {
              status = "rascunho";
              rascunhos++;
            }
            await db
              .update(fichasPedagogicasCompetencias)
              .set({ ...dados, status })
              .where(eq(fichasPedagogicasCompetencias.id, fichaAtual.id));
            compAtualizadas++;
          }
        }
      }

      // Processar fichas de conteúdos
      // REGRA: competência deve existir; conteúdo pode ser criado pelo upload
      let modulosAtualizados = await db.select().from(competenciasModulos);

      const wsCont = wb.Sheets["Fichas dos Conteudos"];
      if (wsCont) {
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wsCont, { defval: "" });
        for (const row of rows) {
          const nomeComp = String(row["nome_competencia"] || "").trim();
          const nomeCont = String(row["nome_conteudo"] || "").trim();
          const comp = compNomeMap.get(nomeComp.toLowerCase());
          if (!comp || !nomeCont) { erros++; continue; }

          let status = String(row["status"] || "rascunho").trim().toLowerCase() as "rascunho" | "publicada" | "inativa";
          if (!["rascunho", "publicada", "inativa"].includes(status)) status = "rascunho";

          const tipoRaw = String(row["tipo_conteudo"] || "outro").trim().toLowerCase();
          const tiposValidos = ["intro", "filme", "video", "tedtalk", "podcast", "livro", "curso", "outro"];
          const tipoConteudo = tiposValidos.includes(tipoRaw)
            ? (tipoRaw as "intro" | "filme" | "video" | "tedtalk" | "podcast" | "livro" | "curso" | "outro")
            : "outro";

          // Buscar módulo existente pelo título
          let modulo = modulosAtualizados.find(
            (m) => m.competenciaId === comp.id && m.titulo.toLowerCase().trim() === nomeCont.toLowerCase()
          );

          // Se não existe, criar o módulo agora
          if (!modulo) {
            const tipoModuloValido = ["intro", "filme", "video", "tedtalk", "podcast", "livro"].includes(tipoConteudo)
              ? (tipoConteudo as "intro" | "filme" | "video" | "tedtalk" | "podcast" | "livro")
              : "intro";
            await db.insert(competenciasModulos).values({
              competenciaId: comp.id,
              tipoModulo: tipoModuloValido,
              titulo: nomeCont,
              descricao: row["descricao_aluno"] || "",
              urlGenially: row["link_conteudo"] || undefined,
              ordem: 0,
              ativo: 1,
            });
            // Recarregar para obter o ID gerado
            modulosAtualizados = await db.select().from(competenciasModulos);
            modulo = modulosAtualizados.find(
              (m) => m.competenciaId === comp.id && m.titulo.toLowerCase().trim() === nomeCont.toLowerCase()
            );
          }

          if (!modulo) { erros++; continue; }

          const dados = {
            competenciaId: comp.id,
            conteudoId: modulo.id,
            tipoConteudo,
            nomeConteudo: nomeCont,
            linkConteudo: row["link_conteudo"] || undefined,
            papelPedagogico: row["papel_pedagogico"] || "",
            oQueAlunoAprende: row["o_que_aluno_aprende"] || "",
            reflexaoEsperada: row["reflexao_esperada"] || "",
            quandoUsar: row["quando_usar"] || undefined,
            orientacaoMentor: row["orientacao_mentor"] || "",
            descricaoAluno: row["descricao_aluno"] || "",
            status,
            updatedBy: userName,
          };

          const existente = await db
            .select()
            .from(fichasPedagogicasConteudos)
            .where(
              and(
                eq(fichasPedagogicasConteudos.conteudoId, modulo.id),
                eq(fichasPedagogicasConteudos.competenciaId, comp.id)
              )
            );

          if (existente.length === 0) {
            await db.insert(fichasPedagogicasConteudos).values({ ...dados, createdBy: userName });
            if (status === "rascunho") rascunhos++;
            contCriadas++;
          } else {
            const fichaAtual = existente[0];
            if (fichaAtual.status === "publicada" && status === "publicada") {
              status = "rascunho";
              rascunhos++;
            }
            await db
              .update(fichasPedagogicasConteudos)
              .set({ ...dados, status })
              .where(eq(fichasPedagogicasConteudos.id, fichaAtual.id));
            contAtualizadas++;
          }
        }
      }

      return {
        success: true,
        fichasCompetenciaCriadas: compCriadas,
        fichasCompetenciaAtualizadas: compAtualizadas,
        fichasConteudoCriadas: contCriadas,
        fichasConteudoAtualizadas: contAtualizadas,
        fichasComErro: erros,
        fichasSalvasComoRascunho: rascunhos,
      };
    }),
});
