/**
 * server/routers/relatorioMentorado.ts
 *
 * Relatório de mentorado gerado por IA: agrega indicadores de performance,
 * os comentários que a mentora registra em cada sessão (feedback interno +
 * mensagemAluno) e os resultados de assessment DISC do aluno, e usa a API
 * da Anthropic para gerar um relatório sintético de acompanhamento seguindo
 * um formato estruturado com regras rígidas contra invenção de dados.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb, getAllDiscResultadosByAluno, getAlunoFromCtx } from "../db";
import { DISC_PERFIS } from "../../shared/discData";

// ---------------------------------------------------------------------------
// Anthropic API (server-side, usa a variável de ambiente ANTHROPIC_API_KEY)
// ---------------------------------------------------------------------------
async function gerarSinteseIA(prompt: string): Promise<string> {
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
      max_tokens: 2000,
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

  return fullText.trim();
}

// ---------------------------------------------------------------------------
// Helpers de dados
// ---------------------------------------------------------------------------
async function buscarDadosAluno(alunoId: number) {
  const database = await getDb();
  if (!database) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Sem conexão com o banco de dados." });
  }

  const [alunoRows]: any = await database.execute(
    sql`SELECT id, name AS nome FROM alunos WHERE id = ${alunoId} LIMIT 1`
  );
  const aluno = alunoRows?.[0];
  if (!aluno) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado." });
  }

  const [statsRows]: any = await database.execute(sql`
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

  const [sessionRows]: any = await database.execute(sql`
    SELECT sessionDate, feedback, mensagemAluno
    FROM mentoring_sessions
    WHERE alunoId = ${alunoId} AND cancelada = 0
      AND (feedback IS NOT NULL OR mensagemAluno IS NOT NULL)
    ORDER BY sessionDate DESC
    LIMIT 12
  `);

  let discResultados: any[] = [];
  try {
    discResultados = await getAllDiscResultadosByAluno(alunoId);
  } catch (e) {
    console.warn("[relatorioMentorado] Falha ao buscar DISC:", e);
  }

  return { aluno, stats, sessions: sessionRows || [], discResultados };
}

function montarBlocoDisc(discResultados: any[]): string {
  if (!discResultados || discResultados.length === 0) {
    return "Não há assessment DISC registrado para este mentorado.";
  }

  const ordenados = [...discResultados].sort(
    (a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
  );
  const maisRecente = ordenados[0];
  const perfil = DISC_PERFIS[maisRecente.perfilPredominante as keyof typeof DISC_PERFIS];

  let bloco = `PERFIL PREDOMINANTE (ciclo ${maisRecente.ciclo || "não informado"}): ${maisRecente.perfilPredominante}`;
  bloco += `\nÍNDICES: D=${maisRecente.scoreD} | I=${maisRecente.scoreI} | S=${maisRecente.scoreS} | C=${maisRecente.scoreC}`;

  if (perfil) {
    bloco += `\nTÍTULO DO PERFIL: ${perfil.titulo}`;
    if (perfil.pontosFortes) bloco += `\nPONTOS FORTES TÍPICOS DO PERFIL: ${perfil.pontosFortes}`;
    if (perfil.areasDesenvolvimento) bloco += `\nÁREAS DE DESENVOLVIMENTO TÍPICAS DO PERFIL: ${perfil.areasDesenvolvimento}`;
  }

  if (ordenados.length > 1) {
    const primeiro = ordenados[ordenados.length - 1];
    bloco += `\n\nEVOLUÇÃO DESDE O PRIMEIRO ASSESSMENT (ciclo ${primeiro.ciclo || "não informado"}):`;
    bloco += `\nD: ${primeiro.scoreD} → ${maisRecente.scoreD}`;
    bloco += `\nI: ${primeiro.scoreI} → ${maisRecente.scoreI}`;
    bloco += `\nS: ${primeiro.scoreS} → ${maisRecente.scoreS}`;
    bloco += `\nC: ${primeiro.scoreC} → ${maisRecente.scoreC}`;
    bloco += `\nTOTAL DE APLICAÇÕES DO ASSESSMENT: ${ordenados.length}`;
  }

  return bloco;
}

function montarBlocoSessoes(sessions: any[]): string {
  if (!sessions || sessions.length === 0) {
    return "Não há registros de sessões de mentoria com comentários disponíveis.";
  }
  return sessions
    .map((s) => {
      const data = s.sessionDate ? new Date(s.sessionDate).toISOString().slice(0, 10) : "não informada";
      return `DATA DA SESSÃO:\n${data}\n\nCOMENTÁRIO INTERNO DA MENTORA:\n${s.feedback || "não registrado"}\n\nMENSAGEM DIRECIONADA AO MENTORADO:\n${s.mensagemAluno || "não registrada"}`;
    })
    .join("\n\n---\n\n");
}

function montarPrompt(aluno: any, stats: any, sessions: any[], discResultados: any[]) {
  const blocoDisc = montarBlocoDisc(discResultados);
  const blocoSessoes = montarBlocoSessoes(sessions);

  return `Você é um assistente especializado em análise de desenvolvimento humano e acompanhamento de mentorias do Programa Ecolíder.

Sua tarefa é elaborar um RELATÓRIO SINTÉTICO DE ACOMPANHAMENTO a partir dos indicadores de performance, dos registros realizados pelas mentoras durante as sessões e dos resultados do assessment comportamental DISC.

Utilize SOMENTE as informações fornecidas. Não complete lacunas com suposições, interpretações genéricas ou informações que não estejam expressamente registradas.

DADOS DO MENTORADO

NOME:
${aluno.nome}

INDICADORES DE PERFORMANCE

SESSÕES REALIZADAS:
${stats.sessoesRealizadas ?? "não informado"}

FALTAS:
${stats.faltas ?? "não informado"}

METAS VALIDADAS:
${stats.metasValidadas ?? "não informado"}

METAS PENDENTES OU NÃO ENTREGUES:
${stats.metasPendentes ?? "não informado"}

NOTA MÉDIA DE EVOLUÇÃO:
${stats.notaEvolucaoMedia ?? "não informado"}

NOTA MÉDIA DE APLICABILIDADE:
${stats.notaAplicabilidadeMedia ?? "não informado"}

ENGAGEMENT SCORE MÉDIO:
${stats.engagementMedio ?? "não informado"}

RESULTADO DO ASSESSMENT COMPORTAMENTAL DISC

${blocoDisc}

REGISTROS DAS SESSÕES DE MENTORIA

${blocoSessoes}

REGRAS OBRIGATÓRIAS PARA A ANÁLISE

1. Utilize exclusivamente os dados apresentados neste prompt.
2. Não invente comportamentos, resultados, dificuldades, avanços, metas ou conclusões que não estejam sustentados pelos registros.
3. Todos os TÍTULOS, SUBTÍTULOS E CAMPOS QUE REPRESENTAM DADOS devem ser escritos em LETRAS MAIÚSCULAS.
4. Os textos de análise devem ser escritos normalmente, sem o uso integral de letras maiúsculas. Essa diferenciação deve permitir a identificação visual entre:
   * DADOS OBJETIVOS;
   * ANÁLISE E INTERPRETAÇÃO.
5. Somente mencione metas quando existirem registros objetivos de metas definidas, validadas, entregues, pendentes ou não entregues.
6. Quando não forem localizadas metas nos indicadores ou nos registros das sessões, considere internamente que a mentora não definiu ou não registrou metas. Nesse caso:
   * não fale sobre metas no relatório;
   * não diga que o mentorado não possui metas;
   * não atribua ao mentorado falta de entrega, engajamento ou comprometimento;
   * não apresente a ausência de metas como ponto de atenção;
   * não mencione que a mentora deixou de defini-las;
   * simplesmente omita qualquer análise relacionada a metas.
7. Diferencie ausência de informação de resultado negativo. Um dado não registrado não pode ser interpretado como falta de desempenho, falta de comprometimento ou ausência de evolução.
8. Considere as faltas apenas quando o número estiver expressamente informado. Não interprete ausência de registro de sessões como falta.
9. Utilize o DISC somente como elemento complementar da análise. Não transforme características típicas do perfil em afirmações definitivas sobre o mentorado.
10. Uma característica do DISC somente poderá ser relacionada ao comportamento do mentorado quando houver evidência correspondente nos registros das sessões ou nos indicadores.
11. Caso não exista assessment DISC, mencione apenas que não há dados comportamentais disponíveis para complementar a análise. Não estime ou atribua um perfil.
12. Considere a evolução entre ciclos apenas quando houver mais de um assessment ou registros comparáveis.
13. Evite expressões genéricas, como:
    * "demonstra grande potencial";
    * "precisa melhorar";
    * "deve se desenvolver mais";
    * "apresenta bom desempenho".
    Sempre explique qual dado ou registro sustenta a conclusão.

FORMATO OBRIGATÓRIO DO RELATÓRIO

RELATÓRIO SINTÉTICO DE ACOMPANHAMENTO – PROGRAMA ECOLÍDER

IDENTIFICAÇÃO DO MENTORADO

NOME:
[nome do aluno]

DADOS OBJETIVOS DE ACOMPANHAMENTO

SESSÕES REALIZADAS:
[valor]

FALTAS:
[valor]

METAS VALIDADAS:
[apresentar somente se houver informação]

METAS PENDENTES OU NÃO ENTREGUES:
[apresentar somente se houver informação]

NOTA MÉDIA DE EVOLUÇÃO:
[valor]

NOTA MÉDIA DE APLICABILIDADE:
[valor]

ENGAGEMENT SCORE MÉDIO:
[valor]

PERFIL COMPORTAMENTAL DISC

PERFIL PREDOMINANTE:
[valor, se disponível]

ÍNDICES DISC:
D: [valor] | I: [valor] | S: [valor] | C: [valor]

SÍNTESE DO PERFIL:
[síntese breve e objetiva, somente quando houver assessment]

ANÁLISE DO ACOMPANHAMENTO

PONTOS POSITIVOS:

* Apresente de 3 a 5 pontos concretos.
* Cada ponto deve começar com "- ".
* Relacione cada conclusão a evidências específicas dos indicadores ou dos registros das sessões.
* Quando pertinente, relacione os pontos fortes do DISC aos comportamentos efetivamente observados.
* Não repita o mesmo argumento com palavras diferentes.

PONTOS DE ATENÇÃO:

* Apresente de 3 a 5 pontos concretos.
* Cada ponto deve começar com "- ".
* Considere aspectos de desenvolvimento, participação, aplicabilidade, evolução e engajamento.
* Apresente sinais de risco ou estagnação somente quando existirem evidências objetivas.
* Utilize as áreas de desenvolvimento do DISC apenas quando houver registros que confirmem essa relação.
* Não apresente a ausência de dados como deficiência do mentorado.
* Não mencione metas caso elas não tenham sido expressamente registradas.

SÍNTESE CONCLUSIVA:

Elabore um parágrafo curto, objetivo e profissional, consolidando o momento atual do mentorado.

A conclusão deve:
* integrar os principais indicadores e registros;
* apresentar a evolução observada, quando houver;
* indicar os aspectos que devem continuar sendo acompanhados;
* evitar diagnósticos, julgamentos pessoais ou conclusões sem evidência;
* não mencionar metas quando não houver metas registradas.

ESTILO DO TEXTO

* Linguagem profissional, técnica e objetiva.
* Tom institucional e respeitoso.
* Frases claras e diretas.
* Não utilizar emojis.
* Não utilizar linguagem excessivamente elogiosa ou punitiva.
* Não apresentar recomendações que não estejam relacionadas aos dados.
* Não repetir os indicadores sem interpretá-los.
* Manter todos os títulos e campos de dados em LETRAS MAIÚSCULAS.
* Manter os textos de análise em escrita normal.`;
}

async function assertMentorOwnsAluno(userId: number, alunoId: number) {
  const database = await getDb();
  if (!database) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Sem conexão com o banco de dados." });
  }
  const [rows]: any = await database.execute(sql`
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
  listarAlunosDisponiveis: protectedProcedure.query(async ({ ctx }) => {
    const role = (ctx as any)?.user?.role;
    const userId = (ctx as any)?.user?.id;
    const database = await getDb();
    if (!database) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Sem conexão com o banco de dados." });
    }

    if (role === "admin" || role === "admin2") {
      const [rows]: any = await database.execute(
        sql`SELECT id, name AS nome FROM alunos ORDER BY name ASC`
      );
      return rows;
    }

    // Autoacesso: aluno logado só vê a si mesmo na listagem.
    if (role === "user") {
      const aluno = await getAlunoFromCtx(ctx.user as any);
      if (!aluno) return [];
      return [{ id: aluno.id, nome: aluno.name }];
    }

    const [rows]: any = await database.execute(sql`
      SELECT DISTINCT a.id, a.name AS nome
      FROM alunos a
      JOIN mentoring_sessions ms ON ms.alunoId = a.id
      WHERE ms.consultorId = ${userId}
      ORDER BY a.name ASC
    `);
    return rows;
  }),

  gerar: protectedProcedure
    .input(z.object({ alunoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const role = (ctx as any)?.user?.role;
      const userId = (ctx as any)?.user?.id;

      const isAdmin = role === "admin" || role === "admin2";
      if (isAdmin) {
        // segue direto
      } else if (role === "user") {
        // Autoacesso do aluno: resolve o alunoId real a partir do contexto de login
        // (não assume ctx.user.id === alunoId — nem todo fluxo de login do aluno gera essa igualdade).
        const alunoCtx = await getAlunoFromCtx(ctx.user as any);
        if (!alunoCtx || alunoCtx.id !== input.alunoId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você só pode gerar o relatório do seu próprio perfil." });
        }
      } else {
        await assertMentorOwnsAluno(userId, input.alunoId);
      }

      const { aluno, stats, sessions, discResultados } = await buscarDadosAluno(input.alunoId);
      const prompt = montarPrompt(aluno, stats, sessions, discResultados);
      const relatorioTexto = await gerarSinteseIA(prompt);

      return {
        aluno: { id: aluno.id, nome: aluno.nome },
        stats,
        temDisc: discResultados.length > 0,
        relatorioTexto,
        geradoEm: new Date().toISOString(),
      };
    }),
});
