import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { eq } from 'drizzle-orm';
import { 
  getAssessmentPdiByAluno,
  getAssessmentCompetenciasByPdi,
  getTrilhaById,
  getContratoMentoriaByAluno,
  getSaldoMentoriasAluno,
  getJornadasPorTurma,
  getAlunoByUserId,
  getDb,
  getStudentPerformanceByAluno,
  getCompIdToCodigoMap
} from "../db";
import * as schema from '../../drizzle/schema';
const { programs } = schema;

const CalcularIndicadoresInput = z.object({
  alunoId: z.number().int().positive(),
});

const AtualizarFaseInput = z.object({
  alunoId: z.number().int().positive(),
  faseCodigo: z.string(),
});

function calcularMediaFinal(
  ind1: number,
  ind2: number,
  ind3: number,
  ind4: number,
  ind5: number
): number {
  return (ind1 + ind2 + ind3 + ind4 + ind5) / 5;
}

function determinarStatus(media: number): string {
  if (media >= 81) return "Excelência";
  if (media >= 61) return "Avançado";
  if (media >= 41) return "Intermediário";
  if (media >= 21) return "Básico";
  return "Iniciante";
}

export const jornadaRouter = router({
  // Rota para obter a jornada completa do aluno autenticado
  minha: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        return {
          macroJornadas: [],
          contrato: null,
          saldo: null,
        };
      }

      try {
        // 1. Obter o aluno a partir do usuário autenticado
        const aluno = await getAlunoByUserId(Number(ctx.user.id));
        if (!aluno) {
          return {
            macroJornadas: [],
            contrato: null,
            saldo: null,
          };
        }

        // 2. Buscar PDIs do aluno (assessment_pdi)
        const pdis = await getAssessmentPdiByAluno(aluno.id);
        if (!pdis || pdis.length === 0) {
          return {
            macroJornadas: [],
            contrato: null,
            saldo: null,
          };
        }

        // 3. Buscar competências vinculadas aos PDIs
        const competenciasMap = new Map();
        for (const pdi of pdis) {
          const comps = await getAssessmentCompetenciasByPdi(pdi.id);
          competenciasMap.set(pdi.id, comps || []);
        }

        // 4. Buscar trilhas para enriquecer dados
        const trilhasMap = new Map();
        for (const pdi of pdis) {
          if (pdi.trilhaId) {
            const trilha = await getTrilhaById(pdi.trilhaId);
            if (trilha) trilhasMap.set(pdi.trilhaId, trilha);
          }
        }

        // 5. Buscar dados de student_performance do aluno (upload Scaffold)
        const studentPerf = await getStudentPerformanceByAluno(aluno.id);
        
        // 6. Buscar mapa competenciaId -> codigoIntegracao para cruzamento
        const compIdToCodigoMap = await getCompIdToCodigoMap();
        
        // 7. Criar mapa de performance por codigoIntegracao para lookup rápido
        const perfMap = new Map<string, any>();
        for (const perf of studentPerf) {
          if (perf.externalCompetenciaId) {
            // Usar externalCompetenciaId como chave (case-insensitive)
            perfMap.set(perf.externalCompetenciaId.toLowerCase(), perf);
          }
        }

        // 8. Montar macroJornadas com dados de performance enriquecidos
        const macroJornadas = pdis.map((pdi: any) => {
          const trilha = trilhasMap.get(pdi.trilhaId);
          const competencias = competenciasMap.get(pdi.id) || [];

          return {
            id: pdi.id,
            trilhaNome: trilha?.name || 'Trilha não definida',
            trilhaId: pdi.trilhaId,
            status: pdi.status, // 'ativo' ou 'congelado'
            macroInicio: pdi.macroInicio,
            macroTermino: pdi.macroTermino,
            microJornadas: competencias.map((comp: any) => {
              // Cruzar competência com student_performance via codigoIntegracao
              const codigo = compIdToCodigoMap.get(comp.competenciaId);
              let perfComp: any = null;
              
              if (codigo) {
                // Tentar match exato por codigoIntegracao
                perfComp = perfMap.get(codigo.toLowerCase());
                
                // Se não encontrou, tentar match parcial (nome contém código)
                if (!perfComp) {
                  for (const perf of studentPerf) {
                    if (perf.externalCompetenciaId?.toLowerCase() === codigo.toLowerCase() ||
                        perf.competenciaName?.toLowerCase()?.includes(codigo.toLowerCase())) {
                      perfComp = perf;
                      break;
                    }
                  }
                }
              }
              
              // Se não encontrou por código, tentar por competenciaId direto
              if (!perfComp) {
                perfComp = studentPerf.find(p => p.competenciaId === comp.competenciaId);
              }

              return {
                id: comp.id,
                competenciaId: comp.competenciaId,
                competenciaNome: comp.nome || `Competência #${comp.competenciaId}`,
                peso: comp.peso || 'obrigatoria',
                microInicio: comp.microInicio,
                microTermino: comp.microTermino,
                nivelAtual: comp.nivelAtual,
                metaFinal: comp.metaFinal,
                // Dados de student_performance (upload Scaffold)
                aulasDisponiveis: perfComp?.aulasDisponiveis ?? 0,
                aulasConcluidas: perfComp?.aulasConcluidas ?? 0,
                aulasEmAndamento: perfComp?.aulasEmAndamento ?? 0,
                progressoTotal: perfComp?.progressoTotal ?? 0,
                notaPlataforma: perfComp?.mediaAvaliacoesFinais 
                  ? Number(perfComp.mediaAvaliacoesFinais) * 10 
                  : (perfComp?.mediaAvaliacoesRespondidas 
                    ? Number(perfComp.mediaAvaliacoesRespondidas) * 10 
                    : 0),
                avaliacoesRespondidas: perfComp?.avaliacoesRespondidas ?? 0,
                avaliacoesDisponiveis: perfComp?.avaliacoesDisponiveis ?? 0,
                justificativa: comp.justificativa || null,
              };
            })
          };
        });

        // 9. Buscar contrato (primeira mentoria ativa do aluno)
        const contrato = await getContratoMentoriaByAluno(aluno.id);

        // 10. Calcular saldo de mentorias
        const saldo = await getSaldoMentoriasAluno(aluno.id);

        return {
          macroJornadas,
          contrato: contrato
            ? {
                periodoInicio: contrato.dataInicio,
                periodoTermino: contrato.dataTermino,
                tipoMentoria: contrato.tipoMentoria || 'individual',
              }
            : null,
          saldo: saldo
            ? {
                sessoesRealizadas: saldo.sessoesRealizadas || 0,
                saldoRestante: saldo.saldoRestante || 0,
                totalContratadas: saldo.totalContratadas || 0,
                percentualUsado: saldo.percentualUsado || 0,
              }
            : null,
        };
      } catch (error) {
        console.error('Erro ao buscar jornada do aluno:', error);
        return {
          macroJornadas: [],
          contrato: null,
          saldo: null,
        };
      }
    }),

  // Rotas existentes
  calcularIndicadores: protectedProcedure
    .input(CalcularIndicadoresInput)
    .mutation(async ({ input }) => {
      const { alunoId } = input;

      const db = await getDb();
      if (!db) {
        throw new Error("Banco de dados não disponível");
      }

      const ind1 = 0;
      const ind2 = 0;
      const ind3 = 0;
      const ind4 = 0;
      const ind5 = 0;
      const ind6 = 0;

      const media = calcularMediaFinal(ind1, ind2, ind3, ind4, ind5);
      const status = determinarStatus(media);

      return {
        sucesso: true,
        mensagem: "Router de jornada carregado com sucesso",
        alunoId,
        indicadores: {
          webinars: ind1,
          avaliacoes: ind2,
          competencias: ind3,
          tarefas: ind4,
          engajamento: ind5,
          aplicabilidade: ind6,
          media,
        },
        status,
      };
    }),

  obterIndicadores: protectedProcedure
    .input(CalcularIndicadoresInput)
    .query(async ({ input }) => {
      const { alunoId } = input;

      return {
        alunoId,
        indicador1Webinars: "0",
        indicador2Avaliacoes: "0",
        indicador3Competencias: "0",
        indicador4Tarefas: "0",
        indicador5Engajamento: "0",
        indicador6Aplicabilidade: "0",
        mediaFinal: "0",
        status: "Iniciante",
      };
    }),

  obterProgresso: protectedProcedure
    .input(CalcularIndicadoresInput)
    .query(async ({ input }) => {
      const { alunoId } = input;

      return {
        alunoId,
        faseAtual: "conexao",
        percentualConclusao: 0,
      };
    }),

  obterFases: protectedProcedure
    .input(CalcularIndicadoresInput)
    .query(async ({ input }) => {
      const { alunoId } = input;

      return [
        {
          alunoId,
          codigo: "conexao",
          titulo: "Conexão",
          ordem: 1,
          concluida: false,
        },
        {
          alunoId,
          codigo: "desenvolvimento",
          titulo: "Desenvolvimento",
          ordem: 2,
          concluida: false,
        },
        {
          alunoId,
          codigo: "aplicacao",
          titulo: "Aplicação",
          ordem: 3,
          concluida: false,
        },
      ];
    }),

  atualizarFase: protectedProcedure
    .input(AtualizarFaseInput)
    .mutation(async ({ input }) => {
      const { alunoId, faseCodigo } = input;

      return {
        sucesso: true,
        alunoId,
        faseAtual: faseCodigo,
      };
    }),

  obterHistoricoIndicadores: protectedProcedure
    .input(CalcularIndicadoresInput)
    .query(async ({ input }) => {
      const { alunoId } = input;

      return [
        {
          alunoId,
          indicador1Webinars: "0",
          indicador2Avaliacoes: "0",
          indicador3Competencias: "0",
          indicador4Tarefas: "0",
          indicador5Engajamento: "0",
          indicador6Aplicabilidade: "0",
          mediaFinal: "0",
          dataCalculo: new Date(),
        },
      ];
    }),

  obterHubVisual: protectedProcedure
    .input(CalcularIndicadoresInput)
    .query(async ({ input }) => {
      const { alunoId } = input;

      return {
        progresso: {
          alunoId,
          faseAtual: "conexao",
          percentualConclusao: 0,
        },
        indicadores: {
          alunoId,
          indicador1Webinars: "0",
          indicador2Avaliacoes: "0",
          indicador3Competencias: "0",
          indicador4Tarefas: "0",
          indicador5Engajamento: "0",
          indicador6Aplicabilidade: "0",
          mediaFinal: "0",
          status: "Iniciante",
        },
        fases: [
          {
            alunoId,
            codigo: "conexao",
            titulo: "Conexão",
            ordem: 1,
            concluida: false,
          },
          {
            alunoId,
            codigo: "desenvolvimento",
            titulo: "Desenvolvimento",
            ordem: 2,
            concluida: false,
          },
          {
            alunoId,
            codigo: "aplicacao",
            titulo: "Aplicação",
            ordem: 3,
            concluida: false,
          },
        ],
        atividades: [],
      };
    }),

  // Obter jornadas agrupadas por turma e empresa (para Gantt chart)
  porTurmaGeral: protectedProcedure
    .input(z.object({ empresa: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      try {
        // Pegar o aluno do usuário logado para obter o programId
        const aluno = await getAlunoByUserId(ctx.user.id);
        if (!aluno || !aluno.programId) {
          console.warn('[porTurmaGeral] Usuário sem programa associado');
          return [];
        }
        
        // Buscar o programa para pegar o nome
        const db = await getDb();
        if (!db) return [];
        const programResults = await db.select().from(programs).where(eq(programs.id, aluno.programId)).limit(1).execute();
        if (!programResults || programResults.length === 0) {
          console.warn('[porTurmaGeral] Programa não encontrado');
          return [];
        }
        
        // Passar o nome da empresa para filtrar apenas a empresa do gerente
        return await getJornadasPorTurma(programResults[0].name);
      } catch (error) {
        console.error('[porTurmaGeral] Erro:', error);
        return [];
      }
    }),
});