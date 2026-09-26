import { and, desc, eq, like, or } from "drizzle-orm";
import { alunos, discResultados, programs } from "../drizzle/schema";
import {
  programaIntegracaoProcessos,
  programaIntegracaoRespostas,
} from "../drizzle/programaIntegracaoSchema";
import { getDb } from "./db";

const PROGRAM_ID = 17;

const DEMOS = [
  {
    tag: "ugp_demo_marina_20260925",
    legacyId: "demo-integracao-ugp-20260925",
    name: "[TESTE] Marina Demo Integração",
    email: "marina.demo.integracao@example.com",
    cpf: "88888888888",
    ordem: 9998,
    scenario: "evolucao" as const,
    profilePatterns: ["%Jade%Marcia%"],
    gestor: "[TESTE] Rafael Gestor Demo",
    gestorEmail: "rafael.gestor.demo@example.com",
    anjo: "[TESTE] Camila Anjo Demo",
    anjoEmail: "camila.anjo.demo@example.com",
  },
  {
    tag: "ugp_demo_queda_20260925",
    legacyId: "demo-integracao-queda-20260925",
    name: "[TESTE] Cenário Queda de Integração",
    email: "cenario.queda.integracao@example.com",
    cpf: "77777777777",
    ordem: 9999,
    scenario: "queda" as const,
    profilePatterns: ["%Último%Usuário%Teste%", "%Ultimo%Usuario%Teste%", "%Usu%rio%Teste%"],
    gestor: "[TESTE] Gestor Cenário Queda",
    gestorEmail: "gestor.queda.demo@example.com",
    anjo: "[TESTE] Anjo Cenário Queda",
    anjoEmail: "anjo.queda.demo@example.com",
  },
] as const;

const PESQUISA_KEYS = [
  "pesquisa_cultura_valores","pesquisa_pertencimento","pesquisa_dia_a_dia","pesquisa_orgulho","pesquisa_importancia_atividades",
  "pesquisa_anjo_ajuda","pesquisa_conforto_colegas","pesquisa_confianca_colegas","pesquisa_ajuda_colegas","pesquisa_lacos_amizade",
  "pesquisa_gestor_clareza","pesquisa_comunicacao_transparente","pesquisa_gestor_incentivo",
  "pesquisa_satisfacao_funcoes","pesquisa_sobrecarga","pesquisa_conhecimento_tecnico","pesquisa_busca_apoio","pesquisa_propoe_melhorias",
  "pesquisa_cooperacao_equipe","pesquisa_progresso_pdi",
];

const AVAL_KEYS = [
  "aval_compromissos","aval_parceria","aval_compartilha_informacoes","aval_persistencia","aval_interesse_entusiasmo","aval_expressao",
  "aval_padroes_eticos","aval_transparencia","aval_respeito","aval_sigilo","aval_consistencia_informacoes","aval_analise_decisao",
  "aval_conhecimento_tecnico","aval_conhecimento_pratica","aval_atividades_previstas","aval_apoio_tecnico","aval_interpretacao","aval_melhorias",
  "aval_participa_discussoes","aval_cooperacao","aval_clareza_ideias","aval_aceita_pontos_vista","aval_articulacao","aval_postura_equipe",
  "aval_foco_resultados","aval_cumpre_prazos","aval_cumpre_metas","aval_prioridades","aval_parcerias","aval_qualidade","aval_postura_critica","aval_tempo_resposta",
];

const CYCLES = [
  { ciclo: 1, data: "2026-05-13", pesquisa: "pos1-08", gestor: "pos1-09", anjo: "pos1-10" },
  { ciclo: 2, data: "2026-06-12", pesquisa: "pos2-08", gestor: "pos2-09", anjo: "pos2-10" },
  { ciclo: 3, data: "2026-07-12", pesquisa: "pos3-09", gestor: "pos3-10", anjo: "pos3-11" },
  { ciclo: 4, data: "2026-09-25", pesquisa: "pos4-07", gestor: "pos4-08", anjo: "pos4-09" },
] as const;

const DIMENSOES = {
  cultura: PESQUISA_KEYS.slice(0, 5),
  anjo: PESQUISA_KEYS.slice(5, 10),
  gestao: PESQUISA_KEYS.slice(10, 13),
  trabalho: PESQUISA_KEYS.slice(13, 20),
};

function pesquisaAnswers(
  scenario: "evolucao" | "queda",
  ciclo: number,
): Record<string, string> {
  const matriz = scenario === "evolucao"
    ? [
        { cultura: 3, anjo: 3, gestao: 3, trabalho: 3 },
        { cultura: 4, anjo: 4, gestao: 4, trabalho: 4 },
        { cultura: 5, anjo: 4, gestao: 5, trabalho: 4 },
        { cultura: 5, anjo: 3, gestao: 5, trabalho: 4 },
      ]
    : [
        { cultura: 5, anjo: 5, gestao: 5, trabalho: 5 },
        { cultura: 5, anjo: 4, gestao: 5, trabalho: 4 },
        { cultura: 4, anjo: 3, gestao: 4, trabalho: 3 },
        { cultura: 3, anjo: 2, gestao: 3, trabalho: 2 },
      ];
  const alvo = matriz[Math.max(0, Math.min(3, ciclo - 1))];
  const answers: Record<string, string> = {};
  (Object.keys(DIMENSOES) as Array<keyof typeof DIMENSOES>).forEach((dimensao) => {
    const nota = alvo[dimensao];
    DIMENSOES[dimensao].forEach((key) => {
      answers[key] = String(key === "pesquisa_sobrecarga" ? 6 - nota : nota);
    });
  });
  return answers;
}

function avaliacaoAnswers(
  scenario: "evolucao" | "queda",
  ciclo: number,
  papel: "Gestor" | "Anjo",
): Record<string, string> {
  const base = scenario === "evolucao"
    ? (papel === "Gestor" ? [3,4,4,5][ciclo - 1] : [3,3,4,4][ciclo - 1])
    : (papel === "Gestor" ? [5,5,4,4][ciclo - 1] : [5,4,3,2][ciclo - 1]);
  const answers = Object.fromEntries(
    AVAL_KEYS.map((key, index) => [
      key,
      String(Math.max(1, Math.min(5, base + ((index + ciclo) % 11 === 0 ? 1 : 0)))),
    ]),
  ) as Record<string, string>;
  const conceito = scenario === "queda"
    ? ["100%","100%","75%","50%"][ciclo - 1]
    : ["50%","75%","75%","100%"][ciclo - 1];
  answers.aval_desenvolvimento_conceito = conceito;
  answers.aval_produtividade_conceito = conceito;
  answers.aval_conceito_geral = conceito;
  answers.aval_potencialidades = papel === "Gestor"
    ? "Organização, proatividade e boa interação com a equipe."
    : "Cooperação e abertura para orientações.";
  answers.aval_menos_favoraveis = scenario === "queda"
    ? "Foi percebida redução de segurança e participação ao longo dos últimos ciclos."
    : "Pode ampliar segurança em decisões de maior complexidade.";
  answers.aval_orientacoes_desenvolvimento =
    "Aprofundar priorização, comunicação de avanços e tomada de decisão.";
  return answers;
}

function averageOf(answers: Record<string, any>) {
  const values = Object.values(answers)
    .map(Number)
    .filter((value) => Number.isFinite(value));
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

async function resolveProfile(tx: any, patterns: readonly string[], fallbackLatestTest = false) {
  const condicoes = patterns.map((pattern) => like(alunos.name, pattern));
  let candidatos = await tx
    .select({ id: alunos.id, name: alunos.name, programId: alunos.programId })
    .from(alunos)
    .where(or(...condicoes))
    .orderBy(desc(alunos.id))
    .limit(20);

  if (!candidatos.length && fallbackLatestTest) {
    candidatos = await tx
      .select({ id: alunos.id, name: alunos.name, programId: alunos.programId })
      .from(alunos)
      .where(like(alunos.name, "%teste%"))
      .orderBy(desc(alunos.id))
      .limit(30);
  }

  for (const candidato of candidatos) {
    const [disc] = await tx
      .select({ id: discResultados.id })
      .from(discResultados)
      .where(eq(discResultados.alunoId, candidato.id))
      .orderBy(desc(discResultados.completedAt), desc(discResultados.id))
      .limit(1);
    if (disc) return candidato;
  }
  return null;
}

async function ensureDemo(tx: any, program: { id: number; name: string }, demo: typeof DEMOS[number], profile: any | null) {
  const feito: Record<string, any> = {};
  for (const cycle of CYCLES) {
    for (const itemId of [cycle.pesquisa, cycle.gestor, cycle.anjo]) {
      feito[itemId] = { s: "ok", d: cycle.data };
    }
  }

  const estado = {
    feito,
    alin: Object.fromEntries(
      CYCLES.map((cycle) => [
        String(cycle.ciclo),
        { realizado: true, dataReal: cycle.data, data: cycle.data, hora: "09:00" },
      ]),
    ),
    bem: {},
    teste: {
      demoTag: demo.tag,
      demoScenario: demo.scenario,
      empresaProgramId: program.id,
      empresaProgramNome: program.name,
      ecoAlunoId: profile?.id || null,
      ecoAlunoNome: profile?.name || null,
      perfilDemoAutorizado: Boolean(profile?.id),
      perfilDemoFonte: profile?.name || null,
    },
  };

  let [processo] = await tx
    .select({ id: programaIntegracaoProcessos.id, estado: programaIntegracaoProcessos.estado })
    .from(programaIntegracaoProcessos)
    .where(eq(programaIntegracaoProcessos.legacyId, demo.legacyId))
    .limit(1);

  if (!processo) {
    await tx.insert(programaIntegracaoProcessos).values({
      legacyId: demo.legacyId,
      ordem: demo.ordem,
      nome: demo.name,
      cpf: demo.cpf,
      email: demo.email,
      emailCorporativo: demo.email,
      tel: "(63) 90000-0002",
      cargo: demo.scenario === "queda" ? "Analista de Relacionamento" : "Analista de Projetos",
      unidade: "Unidade de Desenvolvimento [TESTE]",
      tipo: "Onboarding",
      inicio: "2026-04-29",
      participacao: "Presencial",
      situacao: "ativo",
      gestor: demo.gestor,
      gestorEmail: demo.gestorEmail,
      gestorTel: "(63) 90000-0001",
      anjo: demo.anjo,
      anjoEmail: demo.anjoEmail,
      consultora: "[TESTE] Mentora Demo",
      ugp: "[TESTE] UGP Integração SEBRAE TO",
      horarios: "09:00\n14:00\n16:00",
      statusPdi: "",
      pendencias: "",
      statusCursos: "",
      consideracoes: "Processo fictício criado exclusivamente para demonstração da Visão UGP/RH.",
      notas: "Não representa colaborador real.",
      cor: demo.scenario === "queda" ? "#B45309" : "#6D4BA3",
      estado,
    });
    [processo] = await tx
      .select({ id: programaIntegracaoProcessos.id, estado: programaIntegracaoProcessos.estado })
      .from(programaIntegracaoProcessos)
      .where(eq(programaIntegracaoProcessos.legacyId, demo.legacyId))
      .limit(1);
    if (!processo) throw new Error(`[DemoIntegracao] ${demo.tag} create failed`);
  } else {
    const currentState = (processo.estado || {}) as Record<string, any>;
    const teste = currentState.teste || {};
    if (teste.demoTag !== demo.tag || Number(teste.empresaProgramId) !== PROGRAM_ID) {
      throw new Error(`[DemoIntegracao] ${demo.tag} abort: existing legacyId is not expected fixture`);
    }
    await tx
      .update(programaIntegracaoProcessos)
      .set({ estado, nome: demo.name, gestor: demo.gestor, gestorEmail: demo.gestorEmail, anjo: demo.anjo, anjoEmail: demo.anjoEmail })
      .where(eq(programaIntegracaoProcessos.id, processo.id));
  }

  const processoId = Number(processo.id);

  const ensureResponse = async (
    cycle: typeof CYCLES[number],
    formKey: string,
    papel: string,
    itemId: string,
    respondentName: string,
    respondentEmail: string,
    answers: Record<string, any>,
  ) => {
    const dedupeKey = `${demo.tag}:${formKey}:${papel.toLowerCase()}:${cycle.ciclo}`;
    const [existing] = await tx
      .select({ id: programaIntegracaoRespostas.id })
      .from(programaIntegracaoRespostas)
      .where(eq(programaIntegracaoRespostas.dedupeKey, dedupeKey))
      .limit(1);
    if (existing) return;

    await tx.insert(programaIntegracaoRespostas).values({
      processoId,
      legacyRid: dedupeKey,
      protocolo: `DEMO-${demo.scenario === "queda" ? "Q" : "M"}-${formKey === "pesquisa" ? "PES" : papel === "Gestor" ? "GES" : "ANJ"}-${cycle.ciclo}`,
      dedupeKey,
      formKey,
      ciclo: cycle.ciclo,
      papel,
      itemId,
      formVersion: 1,
      statusVinculo: "vinculada",
      statusResposta: "valido",
      nomeColaborador: demo.name,
      unidade: "Unidade de Desenvolvimento [TESTE]",
      dataInicio: "2026-04-29",
      emailColaborador: demo.email,
      nomeOrig: demo.name,
      avaliador: respondentName,
      respondentName,
      respondentEmail,
      source: "admin",
      media: averageOf(answers).toFixed(2),
      alertas: [],
      answers,
      quandoOriginal: cycle.data,
      emOriginal: cycle.data,
      submittedAt: new Date(`${cycle.data}T12:00:00.000Z`),
    });
  };

  for (const cycle of CYCLES) {
    await ensureResponse(
      cycle, "pesquisa", "Colaborador", cycle.pesquisa, demo.name, demo.email,
      pesquisaAnswers(demo.scenario, cycle.ciclo),
    );
    for (const role of ["Gestor", "Anjo"] as const) {
      await ensureResponse(
        cycle, "aval", role, role === "Gestor" ? cycle.gestor : cycle.anjo,
        role === "Gestor" ? demo.gestor : demo.anjo,
        role === "Gestor" ? demo.gestorEmail : demo.anjoEmail,
        avaliacaoAnswers(demo.scenario, cycle.ciclo, role),
      );
    }
  }

  const respostas = await tx
    .select({ id: programaIntegracaoRespostas.id })
    .from(programaIntegracaoRespostas)
    .where(and(
      eq(programaIntegracaoRespostas.processoId, processoId),
      eq(programaIntegracaoRespostas.statusVinculo, "vinculada"),
    ));
  if (respostas.length < 12) {
    throw new Error(`[DemoIntegracao] ${demo.tag} verify expected 12 responses, found ${respostas.length}`);
  }

  return {
    processoId,
    respostas: respostas.length,
    profileId: profile?.id || null,
    profileName: profile?.name || null,
  };
}

export async function ensureDemoIntegrationProcessFixture() {
  const db = await getDb();
  if (!db) return { ok: false, reason: "db_unavailable" as const };

  const [program] = await db
    .select({ id: programs.id, name: programs.name })
    .from(programs)
    .where(and(eq(programs.id, PROGRAM_ID), eq(programs.isActive, 1)))
    .limit(1);

  if (!program) {
    console.log("[DemoIntegracao] DEMOS_SKIP program 17 unavailable");
    return { ok: true, skipped: true as const };
  }

  return await db.transaction(async (tx) => {
    const resultados = [];
    for (const demo of DEMOS) {
      const profile = await resolveProfile(tx, demo.profilePatterns, demo.scenario === "queda");
      const result = await ensureDemo(tx, program, demo, profile);
      resultados.push({ tag: demo.tag, ...result });
      console.log("[DemoIntegracao] DEMO_OK", JSON.stringify({ tag: demo.tag, ...result }));
    }
    return { ok: true, demos: resultados };
  });
}
