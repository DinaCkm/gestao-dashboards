import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from '@trpc/server';
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
  getCompIdToCodigoMap,
  getAllMentoringSessions,
  getAllEventParticipationWithDate,
  getAlunos,
  getPrograms,
  getAllPlanoIndividual,
  getAllCiclosForCalculatorV2,
  getCasesForCalculator,
  getMacrocicloPorAluno,
  getStudentPerformanceAsRecords,
  getEventsByProgramOrGlobal,
  getAlunoMacroInicioMap
} from "../db";
import { calcularIndicadoresTodosAlunos, CaseSucessoData } from '../indicatorsCalculatorV2';
import type { MentoringRecord, EventRecord, PerformanceRecord } from '../excelProcessor';
import * as schema from '../../drizzle/schema';
const { programs, ciclosExecucao } = schema;

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
          resumoOnboarding: {
            metasPrevistas: 0,
            casesPrevistos: 0,
          },
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
            resumoOnboarding: {
              metasPrevistas: 0,
              casesPrevistos: 0,
            },
          };
        }

        // 2. Buscar PDIs do aluno (assessment_pdi)
        const pdis = await getAssessmentPdiByAluno(aluno.id);
        if (!pdis || pdis.length === 0) {
          return {
            macroJornadas: [],
            contrato: null,
            saldo: null,
            resumoOnboarding: {
              metasPrevistas: 0,
              casesPrevistos: 0,
            },
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
                metaCiclo1: comp.metaCiclo1 ?? null,
                metaCiclo2: comp.metaCiclo2 ?? null,
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

        // 11. Resumo estático do onboarding (apenas dados planejados no assessment)
        const metasPrevistas = Array.from(competenciasMap.values())
          .flat()
          .filter((comp: any) =>
            comp.metaFinal != null ||
            comp.metaCiclo1 != null ||
            comp.metaCiclo2 != null
          ).length;

        // 1 ciclo definido pela mentora = 1 case previsto
        const ciclosAluno = await db
          .select({ id: ciclosExecucao.id })
          .from(ciclosExecucao)
          .where(eq(ciclosExecucao.alunoId, aluno.id));
        const casesPrevistos = ciclosAluno.length;

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
          resumoOnboarding: {
            metasPrevistas,
            casesPrevistos,
          },
        };
      } catch (error) {
        console.error('Erro ao buscar jornada do aluno:', error);
        return {
          macroJornadas: [],
          contrato: null,
          saldo: null,
          resumoOnboarding: {
            metasPrevistas: 0,
            casesPrevistos: 0,
          },
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

  // Performance dos alunos por ciclo (macrociclo) — tabela abaixo do Gantt
  performancePorCiclo: protectedProcedure
    .input(z.object({
      empresa: z.string(),
      macroInicio: z.string(), // YYYY-MM-DD
      macroTermino: z.string(), // YYYY-MM-DD
    }))
    .query(async ({ input }) => {
      try {
        const mentoringSessions = await getAllMentoringSessions();
        const eventParticipations = await getAllEventParticipationWithDate();
        const alunosList = await getAlunos();
        const programsList = await getPrograms();
        const allPlanoItems = await getAllPlanoIndividual();

        const mentorias: MentoringRecord[] = [];
        const eventos: EventRecord[] = [];
        const performance: PerformanceRecord[] = [];

        const alunoMap = new Map(alunosList.map(a => [a.id, a]));
        const programMap = new Map(programsList.map(p => [p.id, p]));

        for (const session of mentoringSessions) {
          const aluno = alunoMap.get(session.alunoId);
          if (!aluno) continue;
          const program = aluno.programId ? programMap.get(aluno.programId) : null;
          mentorias.push({
            idUsuario: aluno.externalId || String(aluno.id),
            nomeAluno: aluno.name,
            empresa: program?.name || 'Desconhecida',
            turma: String(aluno.turmaId || ''),
            dataSessao: session.sessionDate ? new Date(session.sessionDate) : undefined,
            presenca: session.presence as 'presente' | 'ausente',
            atividadeEntregue: session.isAssessment ? 'sem_tarefa' : ((session.taskStatus as 'entregue' | 'nao_entregue' | 'sem_tarefa') || 'sem_tarefa'),
            engajamento: session.engagementScore || undefined
          });
        }

        for (const participation of eventParticipations) {
          const aluno = alunoMap.get(participation.alunoId);
          if (!aluno) continue;
          const program = aluno.programId ? programMap.get(aluno.programId) : null;
          eventos.push({
            idUsuario: aluno.externalId || String(aluno.id),
            nomeAluno: aluno.name,
            empresa: program?.name || 'Desconhecida',
            tituloEvento: participation.eventTitle || 'Evento',
            dataEvento: participation.eventDate ? new Date(participation.eventDate) : undefined,
            presenca: participation.status as 'presente' | 'ausente'
          });
        }

        // Adicionar eventos ausentes
        {
          const epEvtIds = new Map<number, Set<number>>();
          for (const ep of eventParticipations) {
            if (!epEvtIds.has(ep.alunoId)) epEvtIds.set(ep.alunoId, new Set());
            epEvtIds.get(ep.alunoId)!.add(ep.eventId);
          }
          const evtsByProg = new Map<number, any[]>();
          for (const prog of programsList) {
            evtsByProg.set(prog.id, await getEventsByProgramOrGlobal(prog.id));
          }
          const macroInicioMap = await getAlunoMacroInicioMap();
          for (const a of alunosList) {
            if (!a.programId) continue;
            const progEvts = evtsByProg.get(a.programId) || [];
            const participated = epEvtIds.get(a.id) || new Set();
            const aIdStr = a.externalId || String(a.id);
            const prog = programMap.get(a.programId);
            const macroInicio = macroInicioMap.get(a.id);
            for (const evt of progEvts) {
              if (!participated.has(evt.id)) {
                if (macroInicio && evt.eventDate) {
                  const evtDate = new Date(evt.eventDate);
                  if (evtDate < macroInicio) continue;
                }
                eventos.push({
                  idUsuario: aIdStr,
                  nomeAluno: a.name,
                  empresa: prog?.name || 'Desconhecida',
                  tituloEvento: evt.title || 'Evento',
                  dataEvento: evt.eventDate ? new Date(evt.eventDate) : undefined,
                  presenca: 'ausente' as const,
                });
              }
            }
          }
        }

        for (const item of allPlanoItems) {
          if (item.notaAtual) {
            const aluno = alunoMap.get(item.alunoId);
            if (!aluno) continue;
            performance.push({
              idUsuario: aluno.externalId || String(aluno.id),
              nomeTurma: '',
              idCompetencia: String(item.competenciaId),
              nomeCompetencia: item.competenciaNome || '',
              notaAvaliacao: parseFloat(item.notaAtual),
              aprovado: parseFloat(item.notaAtual) >= 7,
            });
          }
        }

        const studentPerfRecords = await getStudentPerformanceAsRecords();
        const existingPerfKeys = new Set(performance.map(p => `${p.idUsuario}|${p.idCompetencia}`));
        for (const spRec of studentPerfRecords) {
          const key = `${spRec.idUsuario}|${spRec.idCompetencia}`;
          if (!existingPerfKeys.has(key)) {
            performance.push(spRec);
            existingPerfKeys.add(key);
          }
        }

        const ciclosPorAluno = await getAllCiclosForCalculatorV2();
        const compIdToCodigoMap = await getCompIdToCodigoMap();
        const casesMap = await getCasesForCalculator();
        const casesData: CaseSucessoData[] = [];
        for (const [, cases] of Array.from(casesMap.entries())) { casesData.push(...cases); }
        const macrocicloPorAluno = await getMacrocicloPorAluno();

        const todosIndicadores = calcularIndicadoresTodosAlunos(
          mentorias, eventos, performance, ciclosPorAluno, compIdToCodigoMap, casesData, undefined, macrocicloPorAluno
        );

        // Filtrar apenas alunos da empresa solicitada
        const alunosDaEmpresa = todosIndicadores.filter(a => a.empresa === input.empresa);

        // Para cada aluno, encontrar o ciclo que corresponde ao macrociclo selecionado
        const resultado = alunosDaEmpresa.map(aluno => {
          const todosCiclos = [...aluno.ciclosFinalizados, ...aluno.ciclosEmAndamento];
          // Encontrar ciclos que se sobrepõem ao período do macrociclo selecionado
          const ciclosNoPeriodo = todosCiclos.filter(c => {
            return c.dataInicio >= input.macroInicio && c.dataFim <= input.macroTermino;
          });

          // Consolidar indicadores dos ciclos no período (média ponderada)
          let ind1 = 0, ind2 = 0, ind3 = 0, ind4 = 0, ind5 = 0, ind6 = 0, ind7 = 0;
          if (ciclosNoPeriodo.length > 0) {
            ind1 = ciclosNoPeriodo.reduce((s, c) => s + c.ind1_webinars, 0) / ciclosNoPeriodo.length;
            ind2 = ciclosNoPeriodo.reduce((s, c) => s + c.ind2_avaliacoes, 0) / ciclosNoPeriodo.length;
            ind3 = ciclosNoPeriodo.reduce((s, c) => s + c.ind3_competencias, 0) / ciclosNoPeriodo.length;
            ind4 = ciclosNoPeriodo.reduce((s, c) => s + c.ind4_tarefas, 0) / ciclosNoPeriodo.length;
            ind5 = ciclosNoPeriodo.reduce((s, c) => s + c.ind5_engajamento, 0) / ciclosNoPeriodo.length;
            ind6 = ciclosNoPeriodo.reduce((s, c) => s + c.ind6_aplicabilidade, 0) / ciclosNoPeriodo.length;
            ind7 = ciclosNoPeriodo.reduce((s, c) => s + c.ind7_engajamentoFinal, 0) / ciclosNoPeriodo.length;
          }

          return {
            idUsuario: aluno.idUsuario,
            nomeAluno: aluno.nomeAluno,
            empresa: aluno.empresa,
            ind1_webinars: Math.round(ind1),
            ind2_avaliacoes: Math.round(ind2),
            ind3_competencias: Math.round(ind3),
            ind4_tarefas: Math.round(ind4),
            ind5_engajamento: Math.round(ind5),
            ind6_aplicabilidade: Math.round(ind6),
            ind7_engajamentoFinal: Math.round(ind7),
            ciclosEncontrados: ciclosNoPeriodo.length,
          };
        });

        return resultado.sort((a, b) => b.ind7_engajamentoFinal - a.ind7_engajamentoFinal);
      } catch (error) {
        console.error('[performancePorCiclo] Erro:', error);
        return [];
      }
    }),

  // Lista de alunos de uma empresa (para seletor no frontend)
  alunosDaEmpresa: protectedProcedure
    .input(z.object({ empresa: z.string() }))
    .query(async ({ input }) => {
      const alunosList = await getAlunos();
      const programsList = await getPrograms();
      const programMap = new Map(programsList.map(p => [p.id, p]));
      return alunosList
        .filter(a => {
          if (!a.programId) return false;
          const prog = programMap.get(a.programId);
          return prog?.name === input.empresa;
        })
        .filter(a => !a.name?.toLowerCase().includes('teste') && !a.name?.toLowerCase().includes('test'))
        .map(a => ({ id: a.id, nome: a.name }))
        .sort((a, b) => a.nome.localeCompare(b.nome));
    }),

  // Performance de um aluno por todos os seus ciclos (macrociclos)
  performancePorAluno: protectedProcedure
    .input(z.object({
      empresa: z.string(),
      alunoId: z.number(),
    }))
    .query(async ({ input }) => {
      try {
        const mentoringSessions = await getAllMentoringSessions();
        const eventParticipations = await getAllEventParticipationWithDate();
        const alunosList = await getAlunos();
        const programsList = await getPrograms();
        const allPlanoItems = await getAllPlanoIndividual();

        const mentorias: MentoringRecord[] = [];
        const eventos: EventRecord[] = [];
        const performance: PerformanceRecord[] = [];

        const alunoMap = new Map(alunosList.map(a => [a.id, a]));
        const programMap = new Map(programsList.map(p => [p.id, p]));

        for (const session of mentoringSessions) {
          const aluno = alunoMap.get(session.alunoId);
          if (!aluno) continue;
          const program = aluno.programId ? programMap.get(aluno.programId) : null;
          mentorias.push({
            idUsuario: aluno.externalId || String(aluno.id),
            nomeAluno: aluno.name,
            empresa: program?.name || 'Desconhecida',
            turma: String(aluno.turmaId || ''),
            dataSessao: session.sessionDate ? new Date(session.sessionDate) : undefined,
            presenca: session.presence as 'presente' | 'ausente',
            atividadeEntregue: session.isAssessment ? 'sem_tarefa' : ((session.taskStatus as 'entregue' | 'nao_entregue' | 'sem_tarefa') || 'sem_tarefa'),
            engajamento: session.engagementScore || undefined
          });
        }

        for (const participation of eventParticipations) {
          const aluno = alunoMap.get(participation.alunoId);
          if (!aluno) continue;
          const program = aluno.programId ? programMap.get(aluno.programId) : null;
          eventos.push({
            idUsuario: aluno.externalId || String(aluno.id),
            nomeAluno: aluno.name,
            empresa: program?.name || 'Desconhecida',
            tituloEvento: participation.eventTitle || 'Evento',
            dataEvento: participation.eventDate ? new Date(participation.eventDate) : undefined,
            presenca: participation.status as 'presente' | 'ausente'
          });
        }

        {
          const epEvtIds = new Map<number, Set<number>>();
          for (const ep of eventParticipations) {
            if (!epEvtIds.has(ep.alunoId)) epEvtIds.set(ep.alunoId, new Set());
            epEvtIds.get(ep.alunoId)!.add(ep.eventId);
          }
          const evtsByProg = new Map<number, any[]>();
          for (const prog of programsList) {
            evtsByProg.set(prog.id, await getEventsByProgramOrGlobal(prog.id));
          }
          const macroInicioMap = await getAlunoMacroInicioMap();
          for (const a of alunosList) {
            if (!a.programId) continue;
            const progEvts = evtsByProg.get(a.programId) || [];
            const participated = epEvtIds.get(a.id) || new Set();
            const aIdStr = a.externalId || String(a.id);
            const prog = programMap.get(a.programId);
            const macroInicio = macroInicioMap.get(a.id);
            for (const evt of progEvts) {
              if (!participated.has(evt.id)) {
                if (macroInicio && evt.eventDate) {
                  const evtDate = new Date(evt.eventDate);
                  if (evtDate < macroInicio) continue;
                }
                eventos.push({
                  idUsuario: aIdStr,
                  nomeAluno: a.name,
                  empresa: prog?.name || 'Desconhecida',
                  tituloEvento: evt.title || 'Evento',
                  dataEvento: evt.eventDate ? new Date(evt.eventDate) : undefined,
                  presenca: 'ausente' as const,
                });
              }
            }
          }
        }

        for (const item of allPlanoItems) {
          if (item.notaAtual) {
            const aluno = alunoMap.get(item.alunoId);
            if (!aluno) continue;
            performance.push({
              idUsuario: aluno.externalId || String(aluno.id),
              nomeTurma: '',
              idCompetencia: String(item.competenciaId),
              nomeCompetencia: item.competenciaNome || '',
              notaAvaliacao: parseFloat(item.notaAtual),
              aprovado: parseFloat(item.notaAtual) >= 7,
            });
          }
        }

        const studentPerfRecords = await getStudentPerformanceAsRecords();
        const existingPerfKeys = new Set(performance.map(p => `${p.idUsuario}|${p.idCompetencia}`));
        for (const spRec of studentPerfRecords) {
          const key = `${spRec.idUsuario}|${spRec.idCompetencia}`;
          if (!existingPerfKeys.has(key)) {
            performance.push(spRec);
            existingPerfKeys.add(key);
          }
        }

        const ciclosPorAluno = await getAllCiclosForCalculatorV2();
        const compIdToCodigoMap = await getCompIdToCodigoMap();
        const casesMap = await getCasesForCalculator();
        const casesData: CaseSucessoData[] = [];
        for (const [, cases] of Array.from(casesMap.entries())) { casesData.push(...cases); }
        const macrocicloPorAluno = await getMacrocicloPorAluno();

        const todosIndicadores = calcularIndicadoresTodosAlunos(
          mentorias, eventos, performance, ciclosPorAluno, compIdToCodigoMap, casesData, undefined, macrocicloPorAluno
        );

        // Encontrar o aluno solicitado
        const alunoTarget = alunoMap.get(input.alunoId);
        if (!alunoTarget) return [];
        const alunoIdStr = alunoTarget.externalId || String(alunoTarget.id);

        const alunoIndicadores = todosIndicadores.find(a => a.idUsuario === alunoIdStr || a.idUsuario === String(input.alunoId));
        if (!alunoIndicadores) return [];

        // Usar ciclos diretamente de todosIndicadores (mesma fonte do performancePorCiclo)
        const todosCiclos = [...alunoIndicadores.ciclosFinalizados, ...alunoIndicadores.ciclosEmAndamento]
          .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));

        const fmtDate = (d: string) => {
          const dt = new Date(d + 'T00:00:00');
          return dt.toLocaleDateString('pt-BR');
        };

        const resultado = todosCiclos.map(c => ({
          nomeAluno: alunoTarget.name,
          trilhaNome: c.trilhaNome || 'Ciclo',
          periodo: `${fmtDate(c.dataInicio)} – ${fmtDate(c.dataFim)}`,
          macroInicio: c.dataInicio,
          macroTermino: c.dataFim,
          ind1_webinars: Math.round(c.ind1_webinars),
          ind2_avaliacoes: Math.round(c.ind2_avaliacoes),
          ind3_competencias: Math.round(c.ind3_competencias),
          ind4_tarefas: Math.round(c.ind4_tarefas),
          ind5_engajamento: Math.round(c.ind5_engajamento),
          ind6_aplicabilidade: Math.round(c.ind6_aplicabilidade),
          ind7_engajamentoFinal: Math.round(c.ind7_engajamentoFinal),
        }));

        return resultado;
      } catch (error) {
        console.error('[performancePorAluno] Erro:', error);
        return [];
      }
    }),
});
