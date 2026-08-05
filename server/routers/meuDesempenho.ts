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
  getMacrociclosByAluno,
  getPedagogiaPorMacrociclo,
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

  /**
   * Lista os macrociclos REAIS do aluno — um card por ciclo, usando resets
   * formais como fronteira quando existirem, ou os níveis (contrato_niveis)
   * como fallback pra quem nunca foi resetado.
   */
  listarMacrociclos: protectedProcedure
    .input(z.object({ alunoId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const alunoId = await resolverAlunoAlvo(ctx, input?.alunoId);
      const macrociclos = await getMacrociclosByAluno(alunoId);

      return Promise.all(
        macrociclos.map(async (m: any) => {
          let certificadoEmitido = false;
          if (m.contratoNivelId) {
            const cert = await getNivelCertificateByAlunoNivel(alunoId, m.contratoNivelId);
            certificadoEmitido = !!cert;
          }
          return { ...m, certificadoEmitido };
        })
      );
    }),

  /**
   * Visão completa de um macrociclo: indicadores, avaliação por competência e
   * status de certificação (quando o macrociclo está vinculado a um nível
   * formal — senão, indica que a certificação depende de emissão manual).
   * `chave` é o identificador retornado por listarMacrociclos.
   */
  porMacrociclo: protectedProcedure
    .input(z.object({ alunoId: z.number().optional(), chave: z.string() }))
    .query(async ({ ctx, input }) => {
      const alunoId = await resolverAlunoAlvo(ctx, input.alunoId);

      const aluno = await getAlunoById(alunoId);
      if (!aluno) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado." });
      }

      const macrociclos = await getMacrociclosByAluno(alunoId);
      const macrociclo = macrociclos.find((m: any) => m.chave === input.chave);
      if (!macrociclo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Macrociclo não encontrado para este aluno." });
      }

      const pedagogia = await getPedagogiaPorMacrociclo(alunoId, macrociclo);
      if (!pedagogia) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Não foi possível carregar os dados deste macrociclo." });
      }

      const competencias = pedagogia.competencias || [];
      const obrigatorias = competencias.filter((c: any) => c.obrigatoria);
      const obrigatoriasAprovadas = obrigatorias.filter((c: any) => c.nota !== null && c.nota >= c.meta).length;

      const avaliacaoCompetencias = competencias.map((c: any) => ({
        competenciaId: c.competenciaId,
        competenciaNome: c.competenciaNome,
        obrigatoria: c.obrigatoria,
        nota: c.nota,
        meta: c.meta,
        aprovada: c.nota !== null && c.nota >= c.meta,
      }));

      let indicadores: { competenciasTotal: number; competenciasAprovadas: number; engajamento: number; desafios: number; evidencias: number };
      if (pedagogia.snapshotIndicadores) {
        // Ciclo congelado — indicadores exatos, vindos do snapshot (não recalculados).
        indicadores = {
          competenciasTotal: obrigatorias.length,
          competenciasAprovadas: obrigatoriasAprovadas,
          engajamento: pedagogia.snapshotIndicadores.engajamento,
          desafios: pedagogia.snapshotIndicadores.desafios,
          evidencias: pedagogia.snapshotIndicadores.engajamentoFinal >= 80 ? 1 : 0,
        };
      } else {
        const metasLista = pedagogia.metas || [];
        const eventos = pedagogia.eventParticipation || [];
        const cases = pedagogia.casesSucesso || [];
        const engajamento = eventos.length > 0
          ? (eventos.filter((e: any) => e.status === "presente").length / eventos.length) * 100
          : 0;
        const desafios = metasLista.length > 0
          ? (metasLista.filter((m: any) => String(m.status || "").toLowerCase() === "validada").length / metasLista.length) * 100
          : 0;
        const evidencias = cases.filter((c: any) => c.entregue === 1).length;
        indicadores = {
          competenciasTotal: obrigatorias.length,
          competenciasAprovadas: obrigatoriasAprovadas,
          engajamento: Number(engajamento.toFixed(2)),
          desafios: Number(desafios.toFixed(2)),
          evidencias,
        };
      }

      // Certificação só existe quando o macrociclo está vinculado a um nível formal.
      let certificacao: any = {
        elegivel: false,
        motivo: "Este macrociclo ainda não está vinculado a um nível formal — a certificação, quando aplicável, depende de emissão manual do admin.",
        criterios: null,
        certificadoEmitido: null,
      };
      if (macrociclo.contratoNivelId) {
        const [elegibilidadeRaw, certificado] = await Promise.all([
          avaliarElegibilidadeCertificacao(alunoId, macrociclo.contratoNivelId),
          getNivelCertificateByAlunoNivel(alunoId, macrociclo.contratoNivelId),
        ]);
        const elegibilidade: any = elegibilidadeRaw;
        certificacao = {
          elegivel: elegibilidade.elegivel,
          motivo: elegibilidade.motivo || null,
          criterios: elegibilidade.criterios,
          contratoNivelId: macrociclo.contratoNivelId,
          certificadoEmitido: certificado
            ? {
                id: certificado.id,
                status: certificado.status,
                arquivoUrl: certificado.arquivoUrl,
                emitidoEm: certificado.emitidoEm,
                hashDocumento: certificado.hashDocumento,
              }
            : null,
        };
      }

      return {
        aluno: { id: aluno.id, nome: aluno.name },
        macrociclo: {
          chave: macrociclo.chave,
          origem: macrociclo.origem,
          numeroCiclo: macrociclo.numeroCiclo,
          status: macrociclo.status,
          periodo: { dataInicio: macrociclo.dataInicio, dataFim: macrociclo.dataFim },
          contratoNivelId: macrociclo.contratoNivelId,
          nivelLabel: macrociclo.nivelLabel ?? null,
        },
        indicadores,
        avaliacaoCompetencias,
        certificacao,
      };
    }),
});
