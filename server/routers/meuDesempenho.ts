/**
 * server/routers/meuDesempenho.ts
 *
 * Endpoint agregador para a tela de progresso/certificação do aluno.
 * Junta, por macrociclo: a tabela de avaliação por competência (nota x meta)
 * e o status de elegibilidade/emissão do certificado.
 *
 * Os indicadores agregados (engajamento, desafios etc.) NÃO são calculados
 * aqui — a tela busca eles direto de indicadores.meuDashboard (ciclo atual)
 * ou indicadores.meuDashboardCongelado (ciclo já congelado por reset), os
 * mesmos endpoints testados que /performance e /evolucao já usam.
 *
 * Não gera o relatório de IA aqui (isso continua em relatorioMentorado.gerar,
 * que é uma mutation sob demanda, não uma leitura agregada).
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { renderPdfFromUrl } from "../pdfRenderer";
import {
  getAlunoFromCtx,
  getAlunoById,
  getContratoNiveisByAluno,
  avaliarElegibilidadeCertificacao,
  getNivelCertificateByAlunoNivel,
  getMacrociclosByAluno,
  getPedagogiaPorMacrociclo,
  getCertificationSignatures,
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
   * Lista os níveis formais (contrato_niveis) do aluno — usado hoje só pela
   * emissão manual de certificado no admin, pra escolher qual nível emitir.
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
   * Lista os macrociclos REAIS do aluno — um card por reset formal (mais o
   * ciclo atual), ou um único card "Progresso Atual" se o aluno nunca foi
   * resetado.
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
   * Avaliação por competência e status de certificação de um macrociclo.
   * Indicadores agregados não vêm daqui — a tela busca eles de
   * indicadores.meuDashboard ou indicadores.meuDashboardCongelado,
   * conforme a origem do macrociclo (`chave`, retornado por listarMacrociclos).
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

      let avaliacaoCompetencias: any[] = [];
      try {
        const pedagogia = await getPedagogiaPorMacrociclo(alunoId, macrociclo);
        const competencias = pedagogia?.competencias || [];
        avaliacaoCompetencias = competencias.map((c: any) => ({
          competenciaId: c.competenciaId,
          competenciaNome: c.competenciaNome,
          obrigatoria: c.obrigatoria,
          nota: c.nota,
          meta: c.meta,
          aprovada: c.nota !== null && c.nota >= c.meta,
        }));
      } catch (err) {
        console.error("[meuDesempenho.porMacrociclo] Falha ao carregar avaliação de competências:", err);
      }

      // Certificação só existe quando o macrociclo está vinculado a um nível formal.
      // Isolado em try/catch: se a checagem falhar por algum caso extremo de dados
      // legados, a página não deve cair inteira — só a seção de certificado fica
      // indisponível, o resto do macrociclo continua funcionando.
      let certificacao: any = {
        elegivel: false,
        motivo: "Este macrociclo ainda não está vinculado a um nível formal — a certificação, quando aplicável, depende de emissão manual do admin.",
        criterios: null,
        certificadoEmitido: null,
      };
      if (macrociclo.contratoNivelId) {
        try {
          const [elegibilidadeRaw, certificado] = await Promise.all([
            avaliarElegibilidadeCertificacao(alunoId, macrociclo.contratoNivelId, macrociclo.historicoId),
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
                  relatorioUrl: (certificado as any).relatorioUrl ?? null,
                  emitidoEm: certificado.emitidoEm,
                  hashDocumento: certificado.hashDocumento,
                }
              : null,
          };
        } catch (err) {
          console.error("[meuDesempenho.porMacrociclo] Falha ao avaliar certificação:", err);
          certificacao = {
            elegivel: false,
            motivo: "Não foi possível avaliar a certificação deste macrociclo no momento.",
            criterios: null,
            contratoNivelId: macrociclo.contratoNivelId,
            certificadoEmitido: null,
          };
        }
      }

      return {
        aluno: { id: aluno.id, nome: aluno.name },
        macrociclo: {
          chave: macrociclo.chave,
          origem: macrociclo.origem,
          historicoId: macrociclo.historicoId,
          numeroCiclo: macrociclo.numeroCiclo,
          status: macrociclo.status,
          periodo: { dataInicio: macrociclo.dataInicio, dataFim: macrociclo.dataFim },
          contratoNivelId: macrociclo.contratoNivelId,
          nivelLabel: macrociclo.nivelLabel ?? null,
        },
        avaliacaoCompetencias,
        certificacao,
        assinaturas: (await getCertificationSignatures()).map((a: any) => ({
          tipo: a.tipo,
          nomeExibicao: a.nomeExibicao,
          cargo: a.cargo,
        })),
      };
    }),

  /**
   * Gera o PDF do Relatório Final de um macrociclo, renderizando a página
   * /aluno/relatorio-final/:chave num Chromium headless real (mesma técnica já
   * usada pro certificado) — nunca mais via captura de tela no navegador, que
   * nunca produziu um layout confiável. Retorna o PDF em base64 pra download
   * direto, sem precisar persistir arquivo.
   */
  gerarRelatorioPdf: protectedProcedure
    .input(z.object({ chave: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const alunoId = await resolverAlunoAlvo(ctx);
      const macrociclos = await getMacrociclosByAluno(alunoId);
      const macrociclo = macrociclos.find((m: any) => m.chave === input.chave);
      if (!macrociclo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Macrociclo não encontrado." });
      }

      const forwardedProto = (ctx.req.headers["x-forwarded-proto"] as string) || (ctx.req as any).protocol || "https";
      const host = ctx.req.headers.host;
      const baseUrl = `${forwardedProto}://${host}`;
      const url = `${baseUrl}/aluno/relatorio-final/${encodeURIComponent(input.chave)}`;

      try {
        const pdfBuffer = await renderPdfFromUrl({
          url,
          cookie: ctx.req.headers.cookie,
          marginTop: "8mm",
          marginBottom: "8mm",
          marginLeft: "8mm",
          marginRight: "8mm",
        });
        return { pdfBase64: pdfBuffer.toString("base64") };
      } catch (err) {
        console.error("[meuDesempenho.gerarRelatorioPdf] Falha ao gerar PDF:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível gerar o PDF do relatório agora." });
      }
    }),
});
