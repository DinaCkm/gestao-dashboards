import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import * as XLSX from 'xlsx';
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { alunos, programs, studentPerformance, mentoringSessions } from "../../drizzle/schema";

// Manager or Admin procedure
const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'manager') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a gerentes e administradores' });
  }
  return next({ ctx });
});

export const relatorioPerformanceRouter = router({
  gerarExcel: managerProcedure
    .input(z.object({
      alunoId: z.number().optional(),
      programId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }: any) => {
      try {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco indisponível' });

        // Validar permissões: Gerente vê apenas sua empresa, Admin vê todas
        let programIdFilter = input.programId;
        if (ctx.user.role === 'manager' && ctx.user.programId) {
          if (input.programId && input.programId !== ctx.user.programId) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito à sua empresa' });
          }
          programIdFilter = ctx.user.programId;
        }

        // Buscar alunos com suas empresas
        const alunosData = await database
          .selectDistinct({
            alunoId: alunos.id,
            alunoNome: alunos.name,
            alunoEmail: alunos.email,
            empresaId: programs.id,
            empresaNome: programs.name,
          })
          .from(alunos)
          .leftJoin(programs, eq(alunos.programId, programs.id))
          .where(
            and(
              eq(alunos.isActive, 1),
              eq(programs.isActive, 1),
              input.alunoId ? eq(alunos.id, input.alunoId) : undefined,
              programIdFilter ? eq(programs.id, programIdFilter) : undefined
            )
          );

        // Criar workbook Excel
        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Cabeçalho
        wsData.push([
          'Empresa',
          'Aluno',
          'Email',
          'Ind. 1: Webinars (%)',
          'Ind. 2: Avaliações (%)',
          'Ind. 3: Competências (%)',
          'Ind. 4: Tarefas (%)',
          'Ind. 5: Engajamento (%)',
          'Ind. 6: Aplicabilidade (%)',
          'Performance Geral (%)',
          'Data de Emissão',
        ]);

        // Processar cada aluno
        for (const aluno of alunosData) {
          // Buscar performances do aluno
          const performances = await database
            .select()
            .from(studentPerformance)
            .where(eq(studentPerformance.alunoId, aluno.alunoId));

          // Buscar sessões de mentoria do aluno
          const mentoringSessions_data = await database
            .select()
            .from(mentoringSessions)
            .where(eq(mentoringSessions.alunoId, aluno.alunoId));

          // Calcular indicadores
          const ind1_webinars = performances.length > 0
            ? Math.round(
                performances.reduce((sum, p) => sum + (Number(p.progressoTotal) || 0), 0) /
                performances.length
              )
            : 0;

          const ind2_avaliacoes = performances.length > 0
            ? Math.round(
                performances.reduce((sum, p) => sum + (Number(p.mediaAvaliacoesFinais) || 0), 0) /
                performances.length
              )
            : 0;

          const ind3_competencias = performances.length > 0
            ? Math.round(
                (performances.filter(p => (Number(p.progressoTotal) || 0) >= 80).length * 100) /
                performances.length
              )
            : 0;

          const validatedTasks = mentoringSessions_data.filter(m => m.taskStatus === 'validada').length;
          const totalTasks = mentoringSessions_data.filter(m => m.taskStatus !== null).length;
          const ind4_tarefas = totalTasks > 0
            ? Math.round((validatedTasks * 100) / totalTasks)
            : 0;

          const ind5_engajamento = mentoringSessions_data.length > 0
            ? Math.round(
                mentoringSessions_data.reduce((sum, m) => sum + (Number(m.engagementScore) || 0), 0) /
                mentoringSessions_data.length
              )
            : 0;

          const aplicabilidadeSessions = mentoringSessions_data.filter(m => m.notaMentoraAplicabilidade !== null);
          const ind6_aplicabilidade = aplicabilidadeSessions.length > 0
            ? Math.round(
                aplicabilidadeSessions.reduce((sum, m) => sum + (Number(m.notaMentoraAplicabilidade) || 0), 0) /
                aplicabilidadeSessions.length
              )
            : 0;

          const performanceGeral = Math.round(
            (ind1_webinars + ind2_avaliacoes + ind3_competencias + 
             ind4_tarefas + ind5_engajamento + ind6_aplicabilidade) / 6
          );

          wsData.push([
            aluno.empresaNome,
            aluno.alunoNome,
            aluno.alunoEmail,
            ind1_webinars,
            ind2_avaliacoes,
            ind3_competencias,
            ind4_tarefas,
            ind5_engajamento,
            ind6_aplicabilidade,
            performanceGeral,
            new Date().toLocaleString('pt-BR'),
          ]);
        }

        // Criar worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Formatar colunas
        ws['!cols'] = [
          { wch: 20 },  // Empresa
          { wch: 25 },  // Aluno
          { wch: 30 },  // Email
          { wch: 18 },  // Ind 1
          { wch: 18 },  // Ind 2
          { wch: 18 },  // Ind 3
          { wch: 18 },  // Ind 4
          { wch: 18 },  // Ind 5
          { wch: 18 },  // Ind 6
          { wch: 18 },  // Performance Geral
          { wch: 25 },  // Data
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Performance');

        // Gerar buffer
        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        // Upload para S3
        const fileName = `relatorio-performance-${Date.now()}.xlsx`;
        const { url } = await storagePut(
          `relatorios/${fileName}`,
          buffer,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        return {
          success: true,
          url,
          fileName,
          totalRegistros: alunosData.length,
        };
      } catch (error: any) {
        console.error('[relatorioPerformance] Erro:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Erro ao gerar relatório',
        });
      }
    }),
});
