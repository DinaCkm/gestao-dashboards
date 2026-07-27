/**
 * server/routers/relatorioMentorado.ts
 *
 * Relatório de mentorado gerado por IA: agrega indicadores de performance
 * e os comentários que a mentora registra em cada sessão (feedback interno
 * + mensagemAluno) e usa a API da Anthropic para sintetizar pontos
 * positivos e pontos de atenção.
 *
 * INTEGRAÇÃO NECESSÁRIA (3 passos, veja instruções no chat):
 * 1. Adicionar este arquivo em server/routers/
 * 2. Registrar no appRouter (server/routers.ts)
 * 3. Definir a variável de ambiente ANTHROPIC_API_KEY no Railway (aba Variables do serviço gestao-dashboards)
 *
 * PREMISSAS a validar com o schema real (ajuste se necessário):
 * - `mentoring_sessions.consultorId` = id do usuário mentor (tabela `users`)
 * - `db` (import { db } from "../db") expõe `.execute(sql\`...\`)` no estilo Drizzle + mysql2
 * - role de mentor é "mentor" ou "consultor" (ajuste a checagem em `assertMentorOwnsAluno` se o valor for outro)
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc"; // ajuste o caminho se seu setup de trpc tiver outro local
import { db } from "../db";

// ---------------------------------------------------------------------------
// Anthropic API (server-side, usa a variável de ambiente ANTHROPIC_API_KEY)
// ---------------------------------------------------------------------------
async function gerarSinteseIA(prompt: string): Promise<{ pontosPositivos: string; pontosAtencao: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "ANTHROPIC_API_KEY não configurada nas variáveis de ambiente do serviço.",
    });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Falha ao chamar a API da Anthropic (status ${response.status}): ${errText}`,
    });
  }

  const data = await response.json();
  const fullText = (data.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");

  const parts = fullText.split(/PONTOS DE ATEN[ÇC][ÃA]O:/i);
  const pontosPositivos = (parts[0] || "").replace(/PONTOS POSITIVOS:/i, "").trim();
  const pontosAtencao = (parts[1] || "").trim() || "(não retornado pela IA)";

  return { pontosPositivos, pontosAtencao };
}

// ---------------------------------------------------------------------------
// Helpers de dados
// ---------------------------------------------------------------------------
async function buscarDadosAluno(alunoId: number) {
  const [alunoRows]: any = await db.execute(
    sql`SELECT id, nome FROM alunos WHERE id = ${alunoId} LIMIT 1`
  );
  const aluno = alunoRows?.[0];
  if (!aluno) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado." });
  }

  const [statsRows]: any = await db.execute(sql`
    SELECT
      COUNT(*) AS sessoesRealizadas,
      SUM(CASE WHEN presence = 'ausente' THEN 1 ELSE 0 END) AS faltas,
      SUM(CASE WHEN taskStatus = 'validada' THEN 1 ELSE 0 END) AS metasValidadas,
      SUM(CASE WHEN taskStatus IN ('entregue','nao_entregue') THEN 1 ELSE 0 END) AS metasPendentes,
      ROUND(AVG(notaEvolucao), 1) AS notaEvolucaoMedia,
      ROUND(AVG(notaMentoraAplicabilidade), 1) AS notaAplicabilidadeMedia,
      ROUND(AVG(engagementScore), 1) AS engagementMedio
    FROM mentoring_sessions
    WHERE alunoId = ${alunoId} AND cancelada = 0
  `);
  const stats = statsRows?.[0] || {};

  const [sessionRows]: any = await db.execute(sql`
    SELECT sessionDate, feedback, mensagemAluno
    FROM mentoring_sessions
    WHERE alunoId = ${alunoId} AND cancelada = 0
      AND (feedback IS NOT NULL OR mensagemAluno IS NOT NULL)
    ORDER BY sessionDate DESC
    LIMIT 12
  `);

  return { aluno, stats, sessions: sessionRows || [] };
}

function montarPrompt(aluno: any, stats: any, sessions: any[]) {
  const sessionsText = sessions
    .map((s, i) => {
      const data = s.sessionDate ? new Date(s.sessionDate).toISOString().slice(0, 10) : "sem data";
      return `Sessão ${i + 1} (${data}):\n- Comentário interno da mentora: ${s.feedback || "(vazio)"}\n- Mensagem enviada ao aluno: ${s.mensagemAluno || "(vazio)"}`;
    })
    .join("\n\n") || "(nenhum comentário registrado)";

  return `Você é um assistente que ajuda uma equipe de gestão de mentorias (programa Ecolider) a sintetizar o progresso de um mentorado a partir de dados de performance e comentários que as mentoras registram em cada sessão.

Dados do aluno:
- Nome: ${aluno.nome}

Indicadores de performance:
- Sessões realizadas: ${stats.sessoesRealizadas ?? "não informado"}
- Faltas: ${stats.faltas ?? "não informado"}
- Metas validadas: ${stats.metasValidadas ?? "não informado"}
- Metas pendentes/não entregues: ${stats.metasPendentes ?? "não informado"}
- Nota de evolução média: ${stats.notaEvolucaoMedia ?? "não informado"}
- Nota de aplicabilidade média: ${stats.notaAplicabilidadeMedia ?? "não informado"}
- Engagement score médio: ${stats.engagementMedio ?? "não informado"}

Comentários registrados pela mentora ao longo das sessões (interno = uso administrativo; mensagem ao aluno = o que o próprio aluno vê):
${sessionsText}

Tarefa: com base SOMENTE nas informações acima, escreva uma síntese objetiva em português, em duas seções, no seguinte formato exato:

PONTOS POSITIVOS:
[lista com 3 a 5 pontos concretos, cada um em uma linha começando com "- ", citando evidências específicas dos dados quando possível]

PONTOS DE ATENÇÃO:
[lista com 3 a 5 pontos concretos sobre desenvolvimento e engajamento, cada um em uma linha começando com "- ", incluindo sinais de risco ou estagnação quando aplicável]

Não invente dados que não foram fornecidos. Se faltar informação relevante, mencione isso brevemente dentro da seção apropriada em vez de inventar. Seja direto e específico, evite generalidades vazias.`;
}

async function assertMentorOwnsAluno(userId: number, alunoId: number) {
  const [rows]: any = await db.execute(sql`
    SELECT 1 FROM mentoring_sessions
    WHERE alunoId = ${alunoId} AND consultorId = ${userId}
    LIMIT 1
  `);
  if (!rows || rows.length === 0) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Este aluno não é seu mentorado." });
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
export const relatorioMentoradoRouter = router({
  // Lista alunos para o seletor. Admin vê todos; mentor vê só os seus mentorados.
  listarAlunosDisponiveis: protectedProcedure.query(async ({ ctx }) => {
    const role = (ctx as any)?.user?.role;
    const userId = (ctx as any)?.user?.id;

    if (role === "admin" || role === "admin2") {
      const [rows]: any = await db.execute(
        sql`SELECT id, nome FROM alunos ORDER BY nome ASC`
      );
      return rows;
    }

    // mentor / consultor: só os próprios mentorados
    const [rows]: any = await db.execute(sql`
      SELECT DISTINCT a.id, a.nome
      FROM alunos a
      JOIN mentoring_sessions ms ON ms.alunoId = a.id
      WHERE ms.consultorId = ${userId}
      ORDER BY a.nome ASC
    `);
    return rows;
  }),

  // Gera o relatório de IA para um aluno específico.
  gerar: protectedProcedure
    .input(z.object({ alunoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const role = (ctx as any)?.user?.role;
      const userId = (ctx as any)?.user?.id;

      const isAdmin = role === "admin" || role === "admin2";
      if (!isAdmin) {
        await assertMentorOwnsAluno(userId, input.alunoId);
      }

      const { aluno, stats, sessions } = await buscarDadosAluno(input.alunoId);
      const prompt = montarPrompt(aluno, stats, sessions);
      const { pontosPositivos, pontosAtencao } = await gerarSinteseIA(prompt);

      return {
        aluno: { id: aluno.id, nome: aluno.nome },
        stats,
        pontosPositivos,
        pontosAtencao,
        geradoEm: new Date().toISOString(),
      };
    }),
});
