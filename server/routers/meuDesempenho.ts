/**
 * server/routers/meuDesempenho.ts
 *
 * Endpoint agregador para a tela de progresso/certificação do aluno.
 * Junta, por macrociclo (nível): indicadores de performance, a tabela de
 * avaliação por competência (nota x meta), e o status de elegibilidade/emissão
 * do certificado — tudo em uma única chamada, evitando que o front precise
 * combinar 4 endpoints diferentes.
 *
 * Não gera o relatório de IA aqui (isso continua em relatorioMentorado.gerar,
 * que é uma mutation sob demanda, não uma leitura agregada).
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getAlunoFromCtx,
  getAlunoById,
  getContratoNiveisByAluno,
  getContratoNivelVigenteByAluno,
  getPedagogiaByNivel,
  avaliarElegibilidadeCertificacao,
  getNivelCertificateByAlunoNivel,
} from "../db";

/**
 * Resolve o alunoId de destino a partir do contexto de autenticação e do input opcional.
 * - Aluno logado (role "user"): só pode ver a si mesmo.
 * - Admin/manager/mentor: pode consultar outro aluno via input.alunoId.
 */
async function resolverAlunoAlvo(ctx: any, alunoIdInput?: number): Promise<number> {
  const role = ctx?.user?.role;
  const isAdmin = role === "admin" || role === "admin2";
  const isManager = role === "manager";

  if (role === "user") {
    const alunoCtx = await getAlunoFromCtx(ctx.user);
    if (!alunoCtx) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado para o usuário logado." });
    }
    if (alunoIdInput && alunoIdInput !== alunoCtx.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Você só pode consultar o próprio desempenho." });
    }
    return alunoCtx.id;
  }

  if (isAdmin || isManager) {
    if (alunoIdInput) return alunoIdInput;
    const alunoCtx = await getAlunoFromCtx(ctx.user);
    if (alunoCtx) return alunoCtx.id;
    throw new TRPCError({ code: "BAD_REQUEST", message: "Informe o alunoId para consulta administrativa." });
  }

  // Mentor: só pode ver alunos vinculados — a checagem de vínculo específica fica
  // a cargo da tela que consome esse endpoint (reaproveita assertMentorOwnsAluno onde necessário).
  if (alunoIdInput) return alunoIdInput;
  throw new TRPCError({ code: "BAD_REQUEST", message: "Informe o alunoId." });
}

export const meuDesempenhoRouter = router({
  /**
   * Lista os macrociclos (níveis) do aluno, com status resumido — usado pra
   * montar a linha do tempo/seletor de nível na tela do aluno.
   */
  listarNiveis: protectedProcedure
    .input(z.object({ alunoId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const alunoId = await resolverAlunoAlvo(ctx, input?.alunoId);
      const niveis = await getContratoNiveisByAluno(alunoId);

      const comCertificado = await Promise.all(
        niveis.map(async (n: any) => {
          const certificado = await getNivelCertificateByAlunoNivel(alunoId, n.id);
          return {
            contratoNivelId: n.id,
            nivel: n.nivel,
            status: n.status,
            dataInicio: n.dataInicio ?? null,
            dataFim: n.dataFim ?? null,
            certificadoEmitido: !!certificado,
          };
        })
      );

      return comCertificado;
    }),

  /**
   * Visão completa de um macrociclo: indicadores, tabela de avaliação por
   * competência e status de certificação. Se contratoNivelId não for informado,
   * usa o nível vigente do aluno.
   */
  porNivel: protectedProcedure
    .input(z.object({ alunoId: z.number().optional(), contratoNivelId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const alunoId = await resolverAlunoAlvo(ctx, input?.alunoId);

      let contratoNivelId = input?.contratoNivelId ?? null;
      if (!contratoNivelId) {
        const vigente = await getContratoNivelVigenteByAluno(alunoId);
        if (!vigente) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não possui nível/macrociclo em andamento." });
        }
        contratoNivelId = vigente.id;
      }

      const aluno = await getAlunoById(alunoId);
      if (!aluno) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado." });
      }

      const [pedagogia, elegibilidadeRaw, certificado] = await Promise.all([
        getPedagogiaByNivel(alunoId, contratoNivelId),
        avaliarElegibilidadeCertificacao(alunoId, contratoNivelId),
        getNivelCertificateByAlunoNivel(alunoId, contratoNivelId),
      ]);
      // avaliarElegibilidadeCertificacao pode retornar um shape reduzido ({elegivel, motivo})
      // quando o nível não é encontrado; tratamos como any para acessar os campos extras com segurança.
      const elegibilidade: any = elegibilidadeRaw;

      const plano = pedagogia.planoIndividual || [];
      const obrigatorias = plano.filter((p: any) => Number(p.isObrigatoria ?? 1) === 1);
      const obrigatoriasAprovadas = obrigatorias.filter((p: any) => {
        const nota = Number(p.notaAtual ?? 0);
        const meta = Number(p.metaNota ?? 7);
        return Number.isFinite(nota) && nota >= meta;
      }).length;

      // Tabela de avaliação por competência — base do "relatório de avaliação" dentro do anexo de desempenho.
      const avaliacaoCompetencias = plano.map((p: any) => ({
        competenciaId: p.competenciaId,
        competenciaNome: p.competenciaNome,
        trilhaNome: p.trilhaNome,
        obrigatoria: Number(p.isObrigatoria ?? 1) === 1,
        nota: p.notaAtual !== null && p.notaAtual !== undefined ? Number(p.notaAtual) : null,
        meta: p.metaNota !== null && p.metaNota !== undefined ? Number(p.metaNota) : 7,
        status: p.status,
        aprovada: p.notaAtual !== null && p.notaAtual !== undefined
          ? Number(p.notaAtual) >= Number(p.metaNota ?? 7)
          : false,
      }));

      return {
        aluno: { id: aluno.id, nome: aluno.name },
        nivel: {
          id: contratoNivelId,
          nivel: elegibilidade.nivel?.nivel ?? null,
          status: elegibilidade.nivel?.status ?? null,
          periodo: (elegibilidade as any).periodo ?? { dataInicio: null, dataFim: null },
        },
        dadosNaoSegmentadosPorNivel: !!(pedagogia as any).dadosNaoSegmentadosPorNivel,
        indicadores: {
          competenciasTotal: obrigatorias.length,
          competenciasAprovadas: obrigatoriasAprovadas,
          engajamento: elegibilidade.metricas?.engajamento ?? null,
          desafios: elegibilidade.metricas?.desafios ?? null,
          evidencias: elegibilidade.metricas?.evidencias ?? null,
        },
        avaliacaoCompetencias,
        certificacao: {
          elegivel: elegibilidade.elegivel,
          motivo: elegibilidade.motivo || null,
          criterios: elegibilidade.criterios,
          certificadoEmitido: certificado
            ? {
                id: certificado.id,
                status: certificado.status,
                arquivoUrl: certificado.arquivoUrl,
                emitidoEm: certificado.emitidoEm,
                hashDocumento: certificado.hashDocumento,
              }
            : null,
        },
      };
    }),
});
