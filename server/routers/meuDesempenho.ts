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
import { renderPdfFromUrl, montarCabecalhoRodapeRelatorio } from "../pdfRenderer";
import { cacheInvalidate } from "../dataCache";
import { sql } from "drizzle-orm";
import {
  getAlunoFromCtx,
  getAlunoById,
  getContratoNiveisByAluno,
  avaliarElegibilidadeCertificacao,
  getNivelCertificateByAlunoNivel,
  getNivelCertificateByAlunoNiveis,
  getMacrociclosByAluno,
  getPedagogiaPorMacrociclo,
  getCertificationSignatures,
  getDb,
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
            // Bloco "Plano Congelado" pode cobrir vários níveis — o
            // certificado pode ter sido emitido contra qualquer um deles,
            // não só o representante (m.contratoNivelId). Ver comentário
            // em getNivelCertificateByAlunoNiveis.
            const idsParaBuscar: number[] = Array.isArray(m.contratoNivelIds) && m.contratoNivelIds.length > 0
              ? m.contratoNivelIds
              : [m.contratoNivelId];
            const cert = await getNivelCertificateByAlunoNiveis(alunoId, idsParaBuscar);
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
          // Bloco "Plano Congelado" pode juntar vários níveis (ex.: Nível I
          // e II) num único macrociclo, cujo contratoNivelId representante
          // é sempre o do ÚLTIMO nível do bloco (ver getMacrociclosByAluno).
          // O certificado, porém, pode ter sido emitido contra QUALQUER
          // nível do bloco — buscar só pelo representante deixava o Código
          // de Identificação em branco no relatório sempre que a emissão
          // não foi feita exatamente contra o último nível (caso da
          // Joseane, EDB-LID-2026-0005, emitido contra o Nível I).
          const idsParaBuscarCertificado: number[] = Array.isArray(macrociclo.contratoNivelIds) && macrociclo.contratoNivelIds.length > 0
            ? macrociclo.contratoNivelIds
            : [macrociclo.contratoNivelId];
          const [elegibilidadeRaw, certificado] = await Promise.all([
            avaliarElegibilidadeCertificacao(alunoId, macrociclo.contratoNivelId, macrociclo.historicoId),
            getNivelCertificateByAlunoNiveis(alunoId, idsParaBuscarCertificado),
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

      const ORDEM_NIVEL: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
      const todosNiveisAluno = await getContratoNiveisByAluno(alunoId);
      const todosNiveis = todosNiveisAluno
        // Só o STATUS decide o que é "encerrado" — não uma comparação
        // contra "hoje". Uma data de término corrigida pode legitimamente
        // cair no futuro mesmo com o nível já encerrado administrativamente
        // (ex.: contrato que vai até uma data futura); exigir "já passou"
        // além do status fazia o nível sumir do cabeçalho e do espelho.
        .filter((n: any) => {
          const temStatusEncerrado = n.status === "encerrado" || n.status === "certificado";
          return temStatusEncerrado && (n.nivelInicio || n.nivelFim || n.dataInicio || n.dataFim);
        })
        .sort((a: any, b: any) => (ORDEM_NIVEL[a.nivel] ?? 99) - (ORDEM_NIVEL[b.nivel] ?? 99))
        .map((n: any) => ({
          nivel: n.nivel,
          dataInicio: n.nivelInicio ?? n.dataInicio ?? null,
          dataFim: n.nivelFim ?? n.dataFim ?? null,
        }));

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
        todosNiveis,
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

      // Limpa o cache de dados (sessões, eventos, performance etc.) antes de
      // renderizar — garante que este download sob demanda sempre reflita o
      // estado mais recente, nunca uma versão calculada minutos atrás.
      cacheInvalidate();

      // Código de identificação do certificado deste nível (se já emitido) —
      // pra repetir no cabeçalho de cada página do PDF, junto com o link de
      // verificação. Sem certificado emitido ainda, sai sem essa parte (não
      // tem código nenhum pra mostrar).
      let headerTemplate: string | undefined;
      let footerTemplate: string | undefined;
      if (macrociclo.contratoNivelId) {
        const database = await getDb();
        if (database) {
          // Mesmo raciocínio do porMacrociclo acima: o bloco pode cobrir
          // vários níveis, e o certificado pode ter sido emitido contra
          // qualquer um deles — não só o representante do bloco.
          const idsParaBuscar: number[] = Array.isArray(macrociclo.contratoNivelIds) && macrociclo.contratoNivelIds.length > 0
            ? macrociclo.contratoNivelIds
            : [macrociclo.contratoNivelId];
          const placeholders = idsParaBuscar.map((id: number) => Number(id)).join(",");
          const [certRows]: any = await database.execute(sql.raw(
            `SELECT hashDocumento FROM nivel_certificates WHERE contratoNivelId IN (${placeholders}) AND alunoId = ${alunoId} AND status = 'emitido' ORDER BY id DESC LIMIT 1`
          ));
          const codigo = Array.isArray(certRows) && certRows[0]?.hashDocumento ? certRows[0].hashDocumento : null;
          if (codigo) {
            const tpl = montarCabecalhoRodapeRelatorio(codigo, `${baseUrl.replace(/^https?:\/\//, '')}/certificados/verificar/${codigo}`);
            headerTemplate = tpl.headerTemplate;
            footerTemplate = tpl.footerTemplate;
          }
        }
      }

      try {
        const pdfBuffer = await renderPdfFromUrl({
          url,
          cookie: ctx.req.headers.cookie,
          marginTop: headerTemplate ? "16mm" : "8mm",
          marginBottom: footerTemplate ? "14mm" : "8mm",
          marginLeft: "8mm",
          marginRight: "8mm",
          headerTemplate,
          footerTemplate,
        });
        return { pdfBase64: pdfBuffer.toString("base64") };
      } catch (err) {
        console.error("[meuDesempenho.gerarRelatorioPdf] Falha ao gerar PDF:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível gerar o PDF do relatório agora." });
      }
    }),
});
