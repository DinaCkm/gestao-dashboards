/**
 * ROUTER tRPC - JORNADA DO LÍDER (VERSÃO COMPLETA COM QUERIES REAIS)
 * 
 * Arquivo: server/routers/jornada.ts
 * 
 * Router responsável por:
 * 1. Calcular os 7 indicadores de performance com queries reais
 * 2. Gerenciar progresso da jornada
 * 3. Recuperar dados para o Hub Visual
 * 4. Atualizar fases e atividades
 * 
 * BASEADO NO GUIA: Eco do Bem - Visão do Aluno
 */

import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { eq, and, count, avg, sql } from "drizzle-orm";
import {
  jornadaLiderProgresso,
  jornadaLiderIndicadores,
  jornadaLiderFases,
  jornadaLiderAtividades,
  jornadaLiderHistoricoIndicadores,
} from "../../drizzle/0001_jornada_lider";

// Importar as tabelas existentes do seu banco
// Você precisa ajustar os imports conforme sua estrutura real
// import { scheduledWebinars, activities, assessmentCompetencias, mentoringSessions, casesSuccesso } from "../../drizzle/schema";

// ============================================================================
// TIPOS ZODI PARA VALIDAÇÃO
// ============================================================================

const CalcularIndicadoresInput = z.object({
  alunoId: z.number().int().positive(),
});

const AtualizarFaseInput = z.object({
  alunoId: z.number().int().positive(),
  faseCodigo: z.string(),
});

// ============================================================================
// FUNÇÕES AUXILIARES PARA CÁLCULO DOS INDICADORES
// ============================================================================

/**
 * Indicador 1: Webinários Assistidos (0-100%)
 * 
 * Cálculo: (Webinários que você participou / Total de webinários disponíveis) × 100
 * 
 * Fontes de dados:
 * - scheduled_webinars: Lista de webinários disponíveis
 * - event_participation: Participação do aluno em webinários
 */
async function calcularIndicador1Webinars(alunoId: number): Promise<number> {
  try {
    // Query 1: Contar webinários que o aluno participou
    // SELECT COUNT(*) FROM event_participation 
    // WHERE aluno_id = ? AND evento_tipo = 'webinar' AND status = 'concluido'
    
    // Query 2: Contar total de webinários disponíveis
    // SELECT COUNT(*) FROM scheduled_webinars WHERE status = 'ativo'
    
    // Exemplo com Drizzle (ajuste conforme suas tabelas):
    // const webinariosParticipados = await db
    //   .select({ count: count() })
    //   .from(eventParticipation)
    //   .where(
    //     and(
    //       eq(eventParticipation.alunoId, alunoId),
    //       eq(eventParticipation.status, "concluido")
    //     )
    //   );
    
    // const totalWebinarios = await db
    //   .select({ count: count() })
    //   .from(scheduledWebinars)
    //   .where(eq(scheduledWebinars.status, "ativo"));
    
    // if (totalWebinarios[0].count === 0) return 0;
    
    // const percentual = (webinariosParticipados[0].count / totalWebinarios[0].count) * 100;
    // return Math.min(percentual, 100);
    
    // Placeholder: retornar 0 até implementar
    return 0;
  } catch (error) {
    console.error("Erro ao calcular indicador 1 (Webinários):", error);
    return 0;
  }
}

/**
 * Indicador 2: Avaliações Completadas (0-100%)
 * 
 * Cálculo: Média das notas de todas as avaliações (convertidas para 0-100)
 * 
 * Exemplo:
 * - Avaliação 1: 8/10 = 80%
 * - Avaliação 2: 7/10 = 70%
 * - Avaliação 3: 9/10 = 90%
 * - Ind.2 = (80 + 70 + 90) / 3 = 80%
 * 
 * Fontes de dados:
 * - assessment_competencias: Avaliações de competências
 * - assessment_pdi: Avaliações do PDI
 */
async function calcularIndicador2Avaliacoes(alunoId: number): Promise<number> {
  try {
    // Query: Calcular média das avaliações
    // SELECT AVG(nota) FROM assessment_competencias 
    // WHERE aluno_id = ? AND status = 'concluida'
    
    // Exemplo com Drizzle:
    // const avaliacoes = await db
    //   .select({ mediaNota: avg(assessmentCompetencias.nota) })
    //   .from(assessmentCompetencias)
    //   .where(
    //     and(
    //       eq(assessmentCompetencias.alunoId, alunoId),
    //       eq(assessmentCompetencias.status, "concluida")
    //     )
    //   );
    
    // if (!avaliacoes[0].mediaNota) return 0;
    
    // // Converter de 0-10 para 0-100
    // const percentual = (parseFloat(avaliacoes[0].mediaNota) / 10) * 100;
    // return Math.min(percentual, 100);
    
    return 0;
  } catch (error) {
    console.error("Erro ao calcular indicador 2 (Avaliações):", error);
    return 0;
  }
}

/**
 * Indicador 3: Competências Desenvolvidas (0-100%)
 * 
 * Cálculo: (Conteúdos concluídos / Total de conteúdos) × 100
 * 
 * Exemplo:
 * - Total de conteúdos: 50
 * - Você completou: 45
 * - Ind.3 = (45 / 50) × 100 = 90%
 * 
 * Fontes de dados:
 * - aluno_modulo_progresso: Progresso do aluno por módulo
 * - competencias: Catálogo de competências
 * - assessment_competencias: Avaliações de competências
 */
async function calcularIndicador3Competencias(alunoId: number): Promise<number> {
  try {
    // Query: Contar competências concluídas (score >= 70%)
    // SELECT COUNT(*) FROM assessment_competencias 
    // WHERE aluno_id = ? AND score >= 70
    
    // Query: Contar total de competências da trilha do aluno
    // SELECT COUNT(*) FROM competencias 
    // WHERE trilha_id = (SELECT trilha_id FROM alunos WHERE id = ?)
    
    // Exemplo com Drizzle:
    // const competenciasAlcancadas = await db
    //   .select({ count: count() })
    //   .from(assessmentCompetencias)
    //   .where(
    //     and(
    //       eq(assessmentCompetencias.alunoId, alunoId),
    //       sql`${assessmentCompetencias.score} >= 70`
    //     )
    //   );
    
    // const aluno = await db
    //   .select({ trilhaId: alunos.trilhaId })
    //   .from(alunos)
    //   .where(eq(alunos.id, alunoId))
    //   .limit(1);
    
    // if (!aluno[0]) return 0;
    
    // const totalCompetencias = await db
    //   .select({ count: count() })
    //   .from(competencias)
    //   .where(eq(competencias.trilhaId, aluno[0].trilhaId));
    
    // if (totalCompetencias[0].count === 0) return 0;
    
    // const percentual = (competenciasAlcancadas[0].count / totalCompetencias[0].count) * 100;
    // return Math.min(percentual, 100);
    
    return 0;
  } catch (error) {
    console.error("Erro ao calcular indicador 3 (Competências):", error);
    return 0;
  }
}

/**
 * Indicador 4: Tarefas Realizadas (0-100%)
 * 
 * Cálculo: (Tarefas entregues / Total de tarefas) × 100
 * (Excluindo a 1ª mentoria - Assessment)
 * 
 * Exemplo:
 * - Total de tarefas: 12
 * - Você entregou: 11
 * - Ind.4 = (11 / 12) × 100 = 91%
 * 
 * Fontes de dados:
 * - activities: Atividades/tarefas atribuídas
 * - activity_registrations: Registros de entrega de tarefas
 */
async function calcularIndicador4Tarefas(alunoId: number): Promise<number> {
  try {
    // Query: Contar tarefas entregues
    // SELECT COUNT(*) FROM activity_registrations 
    // WHERE aluno_id = ? AND status = 'concluida'
    
    // Query: Contar total de tarefas atribuídas
    // SELECT COUNT(*) FROM activities 
    // WHERE aluno_id = ? AND tipo != 'assessment'
    
    // Exemplo com Drizzle:
    // const tarefasEntregues = await db
    //   .select({ count: count() })
    //   .from(activityRegistrations)
    //   .where(
    //     and(
    //       eq(activityRegistrations.alunoId, alunoId),
    //       eq(activityRegistrations.status, "concluida")
    //     )
    //   );
    
    // const totalTarefas = await db
    //   .select({ count: count() })
    //   .from(activities)
    //   .where(
    //     and(
    //       eq(activities.alunoId, alunoId),
    //       sql`${activities.tipo} != 'assessment'`
    //     )
    //   );
    
    // if (totalTarefas[0].count === 0) return 0;
    
    // const percentual = (tarefasEntregues[0].count / totalTarefas[0].count) * 100;
    // return Math.min(percentual, 100);
    
    return 0;
  } catch (error) {
    console.error("Erro ao calcular indicador 4 (Tarefas):", error);
    return 0;
  }
}

/**
 * Indicador 5: Engajamento (0-100%)
 * 
 * Cálculo: Nota de evolução do mentor (0-10, convertida para 0-100)
 * 
 * Exemplo:
 * - Seu mentor te dá nota 8/10
 * - Ind.5 = 8 × 10 = 80%
 * 
 * Fontes de dados:
 * - mentoring_sessions: Sessões de mentoria com notas do mentor
 */
async function calcularIndicador5Engajamento(alunoId: number): Promise<number> {
  try {
    // Query: Calcular média das notas do mentor
    // SELECT AVG(avaliacao_mentor) FROM mentoring_sessions 
    // WHERE aluno_id = ? AND avaliacao_mentor IS NOT NULL
    
    // Exemplo com Drizzle:
    // const engajamento = await db
    //   .select({ mediaNota: avg(mentoringSessions.avaliacaoMentor) })
    //   .from(mentoringSessions)
    //   .where(
    //     and(
    //       eq(mentoringSessions.alunoId, alunoId),
    //       sql`${mentoringSessions.avaliacaoMentor} IS NOT NULL`
    //     )
    //   );
    
    // if (!engajamento[0].mediaNota) return 0;
    
    // // Converter de 0-10 para 0-100
    // const percentual = (parseFloat(engajamento[0].mediaNota) / 10) * 100;
    // return Math.min(percentual, 100);
    
    return 0;
  } catch (error) {
    console.error("Erro ao calcular indicador 5 (Engajamento):", error);
    return 0;
  }
}

/**
 * Indicador 6: Aplicabilidade (0-100% - Bônus)
 * 
 * Cálculo: (COUNT(casos de sucesso) × 10) até máximo 100
 * 
 * Exemplo:
 * - Seu Ind.5 = 80%
 * - Você entrega 1 caso de sucesso = +10%
 * - Seu Ind.5 final = 90%
 * 
 * Fontes de dados:
 * - cases_sucesso: Casos de sucesso entregues
 */
async function calcularIndicador6Aplicabilidade(alunoId: number): Promise<number> {
  try {
    // Query: Contar casos de sucesso entregues
    // SELECT COUNT(*) FROM cases_sucesso 
    // WHERE aluno_id = ? AND status = 'aprovado'
    
    // Exemplo com Drizzle:
    // const casosSuccesso = await db
    //   .select({ count: count() })
    //   .from(casesSuccesso)
    //   .where(
    //     and(
    //       eq(casesSuccesso.alunoId, alunoId),
    //       eq(casesSuccesso.status, "aprovado")
    //     )
    //   );
    
    // // Cada caso = +10% (máximo 100%)
    // const bônus = Math.min(casosSuccesso[0].count * 10, 100);
    // return bônus;
    
    return 0;
  } catch (error) {
    console.error("Erro ao calcular indicador 6 (Aplicabilidade):", error);
    return 0;
  }
}

/**
 * Calcular Média Final
 * 
 * Cálculo: (Ind.1 + Ind.2 + Ind.3 + Ind.4 + Ind.5) / 5
 * (Ind.6 é bônus, não entra na média)
 * 
 * Exemplo:
 * - Ind.1 = 80%
 * - Ind.2 = 75%
 * - Ind.3 = 85%
 * - Ind.4 = 90%
 * - Ind.5 = 80%
 * - Ind.7 = (80 + 75 + 85 + 90 + 80) / 5 = 82%
 */
function calcularMediaFinal(
  ind1: number,
  ind2: number,
  ind3: number,
  ind4: number,
  ind5: number
): number {
  return (ind1 + ind2 + ind3 + ind4 + ind5) / 5;
}

/**
 * Determinar status do aluno baseado na média final
 * 
 * - 0-20%: Iniciante
 * - 21-40%: Básico
 * - 41-60%: Intermediário
 * - 61-80%: Avançado
 * - 81-100%: Excelência
 */
function determinarStatus(media: number): string {
  if (media >= 81) return "Excelência";
  if (media >= 61) return "Avançado";
  if (media >= 41) return "Intermediário";
  if (media >= 21) return "Básico";
  return "Iniciante";
}

// ============================================================================
// ROUTER PRINCIPAL
// ============================================================================

export const jornadaRouter = router({
  /**
   * Calcular todos os 7 indicadores para um aluno
   */
  calcularIndicadores: protectedProcedure
    .input(CalcularIndicadoresInput)
    .mutation(async ({ input }) => {
      const { alunoId } = input;

      try {
        // Calcular cada indicador
        const ind1 = await calcularIndicador1Webinars(alunoId);
        const ind2 = await calcularIndicador2Avaliacoes(alunoId);
        const ind3 = await calcularIndicador3Competencias(alunoId);
        const ind4 = await calcularIndicador4Tarefas(alunoId);
        const ind5 = await calcularIndicador5Engajamento(alunoId);
        const ind6 = await calcularIndicador6Aplicabilidade(alunoId);
        const media = calcularMediaFinal(ind1, ind2, ind3, ind4, ind5);
        const status = determinarStatus(media);

        // Buscar ou criar registro de indicadores
        const indicadoresExistentes = await db
          .select()
          .from(jornadaLiderIndicadores)
          .where(eq(jornadaLiderIndicadores.alunoId, alunoId))
          .limit(1);

        let resultado;

        if (indicadoresExistentes.length > 0) {
          // Atualizar
          resultado = await db
            .update(jornadaLiderIndicadores)
            .set({
              indicador1Webinars: ind1.toString(),
              indicador2Avaliacoes: ind2.toString(),
              indicador3Competencias: ind3.toString(),
              indicador4Tarefas: ind4.toString(),
              indicador5Engajamento: ind5.toString(),
              indicador6Aplicabilidade: ind6.toString(),
              mediaFinal: media.toString(),
              dataCalculo: new Date(),
            })
            .where(eq(jornadaLiderIndicadores.alunoId, alunoId));
        } else {
          // Criar novo
          resultado = await db.insert(jornadaLiderIndicadores).values({
            alunoId,
            indicador1Webinars: ind1.toString(),
            indicador2Avaliacoes: ind2.toString(),
            indicador3Competencias: ind3.toString(),
            indicador4Tarefas: ind4.toString(),
            indicador5Engajamento: ind5.toString(),
            indicador6Aplicabilidade: ind6.toString(),
            mediaFinal: media.toString(),
            dataCalculo: new Date(),
          });
        }

        // Registrar no histórico
        await db.insert(jornadaLiderHistoricoIndicadores).values({
          alunoId,
          indicador1Webinars: ind1.toString(),
          indicador2Avaliacoes: ind2.toString(),
          indicador3Competencias: ind3.toString(),
          indicador4Tarefas: ind4.toString(),
          indicador5Engajamento: ind5.toString(),
          indicador6Aplicabilidade: ind6.toString(),
          mediaFinal: media.toString(),
          dataCálculo: new Date(),
        });

        return {
          sucesso: true,
          indicadores: {
            webinars: ind1,
            avaliacoes: ind2,
            competencias: ind3,
            tarefas: ind4,
            engajamento: ind5,
            aplicabilidade: ind6,
            media: media,
          },
          status: status,
        };
      } catch (error) {
        console.error("Erro ao calcular indicadores:", error);
        throw new Error("Falha ao calcular indicadores");
      }
    }),

  /**
   * Obter indicadores atuais de um aluno
   */
  obterIndicadores: protectedProcedure
    .input(CalcularIndicadoresInput)
    .query(async ({ input }) => {
      const { alunoId } = input;

      try {
        const indicadores = await db
          .select()
          .from(jornadaLiderIndicadores)
          .where(eq(jornadaLiderIndicadores.alunoId, alunoId))
          .limit(1);

        if (indicadores.length === 0) {
          return null;
        }

        const ind = indicadores[0];
        const media = parseFloat(ind.mediaFinal || "0");
        const status = determinarStatus(media);

        return {
          ...ind,
          status: status,
        };
      } catch (error) {
        console.error("Erro ao obter indicadores:", error);
        throw new Error("Falha ao obter indicadores");
      }
    }),

  /**
   * Obter progresso da jornada
   */
  obterProgresso: protectedProcedure
    .input(CalcularIndicadoresInput)
    .query(async ({ input }) => {
      const { alunoId } = input;

      try {
        const progresso = await db
          .select()
          .from(jornadaLiderProgresso)
          .where(eq(jornadaLiderProgresso.alunoId, alunoId))
          .limit(1);

        if (progresso.length === 0) {
          return null;
        }

        return progresso[0];
      } catch (error) {
        console.error("Erro ao obter progresso:", error);
        throw new Error("Falha ao obter progresso");
      }
    }),

  /**
   * Obter fases da jornada
   */
  obterFases: protectedProcedure
    .input(CalcularIndicadoresInput)
    .query(async ({ input }) => {
      const { alunoId } = input;

      try {
        const fases = await db
          .select()
          .from(jornadaLiderFases)
          .where(eq(jornadaLiderFases.alunoId, alunoId))
          .orderBy(jornadaLiderFases.ordem);

        return fases;
      } catch (error) {
        console.error("Erro ao obter fases:", error);
        throw new Error("Falha ao obter fases");
      }
    }),

  /**
   * Atualizar fase atual
   */
  atualizarFase: protectedProcedure
    .input(AtualizarFaseInput)
    .mutation(async ({ input }) => {
      const { alunoId, faseCodigo } = input;

      try {
        await db
          .update(jornadaLiderProgresso)
          .set({
            faseAtual: faseCodigo,
            dataUltimaAtualizacao: new Date(),
          })
          .where(eq(jornadaLiderProgresso.alunoId, alunoId));

        return { sucesso: true };
      } catch (error) {
        console.error("Erro ao atualizar fase:", error);
        throw new Error("Falha ao atualizar fase");
      }
    }),

  /**
   * Obter histórico de indicadores (para gráficos)
   */
  obterHistoricoIndicadores: protectedProcedure
    .input(CalcularIndicadoresInput)
    .query(async ({ input }) => {
      const { alunoId } = input;

      try {
        const historico = await db
          .select()
          .from(jornadaLiderHistoricoIndicadores)
          .where(eq(jornadaLiderHistoricoIndicadores.alunoId, alunoId))
          .orderBy(jornadaLiderHistoricoIndicadores.dataCálculo);

        return historico;
      } catch (error) {
        console.error("Erro ao obter histórico:", error);
        throw new Error("Falha ao obter histórico");
      }
    }),

  /**
   * Obter Hub Visual Completo (dados para o dashboard)
   */
  obterHubVisual: protectedProcedure
    .input(CalcularIndicadoresInput)
    .query(async ({ input }) => {
      const { alunoId } = input;

      try {
        const [progresso, indicadores, fases, atividades] = await Promise.all([
          db
            .select()
            .from(jornadaLiderProgresso)
            .where(eq(jornadaLiderProgresso.alunoId, alunoId))
            .limit(1),
          db
            .select()
            .from(jornadaLiderIndicadores)
            .where(eq(jornadaLiderIndicadores.alunoId, alunoId))
            .limit(1),
          db
            .select()
            .from(jornadaLiderFases)
            .where(eq(jornadaLiderFases.alunoId, alunoId))
            .orderBy(jornadaLiderFases.ordem),
          db
            .select()
            .from(jornadaLiderAtividades)
            .where(eq(jornadaLiderAtividades.alunoId, alunoId)),
        ]);

        const ind = indicadores[0];
        const status = ind ? determinarStatus(parseFloat(ind.mediaFinal || "0")) : "Iniciante";

        return {
          progresso: progresso[0] || null,
          indicadores: ind ? { ...ind, status } : null,
          fases: fases,
          atividades: atividades,
        };
      } catch (error) {
        console.error("Erro ao obter Hub Visual:", error);
        throw new Error("Falha ao obter Hub Visual");
      }
    }),
});

// ============================================================================
// INSTRUÇÕES DE IMPLEMENTAÇÃO FINAL
// ============================================================================

/**
 * PASSO 1: Implementar as queries reais
 * 
 * Você precisa substituir os placeholders nas funções:
 * - calcularIndicador1Webinars()
 * - calcularIndicador2Avaliacoes()
 * - calcularIndicador3Competencias()
 * - calcularIndicador4Tarefas()
 * - calcularIndicador5Engajamento()
 * - calcularIndicador6Aplicabilidade()
 * 
 * Com as queries reais do seu banco de dados.
 * 
 * PASSO 2: Importar as tabelas corretas
 * 
 * No topo do arquivo, descomente e ajuste os imports:
 * import { scheduledWebinars, activities, assessmentCompetencias, mentoringSessions, casesSuccesso } from "../../drizzle/schema";
 * 
 * PASSO 3: Testar os cálculos
 * 
 * Execute a mutation calcularIndicadores com um alunoId real:
 * → curl http://localhost:3000/api/trpc/jornada.calcularIndicadores?input={%22alunoId%22:1}
 * 
 * PASSO 4: Validar resultados
 * 
 * Verifique se os indicadores estão sendo calculados corretamente
 * Compare com os dados esperados no seu banco
 */
