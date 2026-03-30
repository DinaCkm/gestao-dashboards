import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";

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
});
