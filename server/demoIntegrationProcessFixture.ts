import { and, eq } from "drizzle-orm";
import { programs } from "../drizzle/schema";
import {
  programaIntegracaoProcessos,
  programaIntegracaoRespostas,
} from "../drizzle/programaIntegracaoSchema";
import { getDb } from "./db";

const DEMO = {
  tag: "ugp_demo_marina_20260925",
  legacyId: "demo-integracao-ugp-20260925",
  name: "[TESTE] Marina Demo Integração",
  email: "marina.demo.integracao@example.com",
  cpf: "88888888888",
  programId: 17,
  gestor: "[TESTE] Rafael Gestor Demo",
  gestorEmail: "rafael.gestor.demo@example.com",
  anjo: "[TESTE] Camila Anjo Demo",
  anjoEmail: "camila.anjo.demo@example.com",
};

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
  { ciclo: 1, data: "2026-05-13", pesquisa: "pos1-08", gestor: "pos1-09", anjo: "pos1-10", p: 3, g: 3, a: 3 },
  { ciclo: 2, data: "2026-06-12", pesquisa: "pos2-08", gestor: "pos2-09", anjo: "pos2-10", p: 4, g: 4, a: 3 },
  { ciclo: 3, data: "2026-07-12", pesquisa: "pos3-09", gestor: "pos3-10", anjo: "pos3-11", p: 4, g: 4, a: 4 },
  { ciclo: 4, data: "2026-09-25", pesquisa: "pos4-07", gestor: "pos4-08", anjo: "pos4-09", p: 4, g: 5, a: 4 },
];

function answersFor(keys: string[], base: number, ciclo: number) {
  return Object.fromEntries(
    keys.map((key, index) => [
      key,
      String(Math.min(5, Math.max(1, base + ((index + ciclo) % 7 === 0 ? 1 : 0)))),
    ]),
  );
}

function averageOf(answers: Record<string, any>) {
  const values = Object.values(answers)
    .map(Number)
    .filter((value) => Number.isFinite(value));
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

export async function ensureDemoIntegrationProcessFixture() {
  const db = await getDb();
  if (!db) return { ok: false, reason: "db_unavailable" as const };

  const [program] = await db
    .select({ id: programs.id, name: programs.name })
    .from(programs)
    .where(and(eq(programs.id, DEMO.programId), eq(programs.isActive, 1)))
    .limit(1);

  if (!program) {
    console.log("[DemoIntegracao] MARINA_SKIP program 17 unavailable");
    return { ok: true, skipped: true as const };
  }

  return await db.transaction(async (tx) => {
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
          {
            realizado: true,
            dataReal: cycle.data,
            data: cycle.data,
            hora: "09:00",
          },
        ]),
      ),
      bem: {},
      teste: {
        demoTag: DEMO.tag,
        empresaProgramId: program.id,
        empresaProgramNome: program.name,
      },
    };

    let [processo] = await tx
      .select({
        id: programaIntegracaoProcessos.id,
        estado: programaIntegracaoProcessos.estado,
      })
      .from(programaIntegracaoProcessos)
      .where(eq(programaIntegracaoProcessos.legacyId, DEMO.legacyId))
      .limit(1);

    if (!processo) {
      await tx.insert(programaIntegracaoProcessos).values({
        legacyId: DEMO.legacyId,
        ordem: 9999,
        nome: DEMO.name,
        cpf: DEMO.cpf,
        email: DEMO.email,
        emailCorporativo: DEMO.email,
        tel: "(63) 90000-0002",
        cargo: "Analista de Projetos",
        unidade: "Unidade de Desenvolvimento [TESTE]",
        tipo: "Onboarding",
        inicio: "2026-04-29",
        participacao: "Presencial",
        situacao: "ativo",
        gestor: DEMO.gestor,
        gestorEmail: DEMO.gestorEmail,
        gestorTel: "(63) 90000-0001",
        anjo: DEMO.anjo,
        anjoEmail: DEMO.anjoEmail,
        consultora: "[TESTE] Mentora Demo",
        ugp: "[TESTE] UGP Integração SEBRAE TO",
        horarios: "09:00\n14:00\n16:00",
        statusPdi: "",
        pendencias: "",
        statusCursos: "",
        consideracoes:
          "Processo fictício criado exclusivamente para demonstração da Visão UGP/RH.",
        notas: "Não representa colaborador real.",
        cor: "#6D4BA3",
        estado,
      });

      [processo] = await tx
        .select({
          id: programaIntegracaoProcessos.id,
          estado: programaIntegracaoProcessos.estado,
        })
        .from(programaIntegracaoProcessos)
        .where(eq(programaIntegracaoProcessos.legacyId, DEMO.legacyId))
        .limit(1);

      if (!processo) throw new Error("[DemoIntegracao] MARINA_CREATE failed");

      console.log(
        "[DemoIntegracao] MARINA_CREATED",
        JSON.stringify({ processoId: processo.id, programId: program.id }),
      );
    } else {
      const currentState = (processo.estado || {}) as Record<string, any>;
      const teste = currentState.teste || {};
      if (
        teste.demoTag !== DEMO.tag ||
        Number(teste.empresaProgramId) !== DEMO.programId
      ) {
        throw new Error(
          "[DemoIntegracao] MARINA_ABORT existing legacyId is not the expected fixture",
        );
      }
    }

    const processoId = processo.id;

    const ensureResponse = async (
      cycle: (typeof CYCLES)[number],
      formKey: string,
      papel: string,
      itemId: string,
      respondentName: string,
      respondentEmail: string,
      answers: Record<string, any>,
    ) => {
      const dedupeKey = `${DEMO.tag}:${formKey}:${papel.toLowerCase()}:${cycle.ciclo}`;
      const [existing] = await tx
        .select({ id: programaIntegracaoRespostas.id })
        .from(programaIntegracaoRespostas)
        .where(eq(programaIntegracaoRespostas.dedupeKey, dedupeKey))
        .limit(1);

      if (existing) return;

      await tx.insert(programaIntegracaoRespostas).values({
        processoId,
        legacyRid: dedupeKey,
        protocolo: `DEMO-${formKey === "pesquisa" ? "PES" : papel === "Gestor" ? "GES" : "ANJ"}-${cycle.ciclo}`,
        dedupeKey,
        formKey,
        ciclo: cycle.ciclo,
        papel,
        itemId,
        formVersion: 1,
        statusVinculo: "vinculada",
        statusResposta: "valido",
        nomeColaborador: DEMO.name,
        unidade: "Unidade de Desenvolvimento [TESTE]",
        dataInicio: "2026-04-29",
        emailColaborador: DEMO.email,
        nomeOrig: DEMO.name,
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
        cycle,
        "pesquisa",
        "Colaborador",
        cycle.pesquisa,
        DEMO.name,
        DEMO.email,
        answersFor(PESQUISA_KEYS, cycle.p, cycle.ciclo),
      );

      for (const role of ["Gestor", "Anjo"] as const) {
        const isGestor = role === "Gestor";
        const answers = answersFor(
          AVAL_KEYS,
          isGestor ? cycle.g : cycle.a,
          cycle.ciclo,
        );
        const conceito =
          cycle.ciclo === 1
            ? "50%"
            : cycle.ciclo === 4 && isGestor
              ? "100%"
              : "75%";

        answers.aval_desenvolvimento_conceito = conceito;
        answers.aval_produtividade_conceito = conceito;
        answers.aval_conceito_geral = conceito;
        answers.aval_potencialidades = isGestor
          ? "Organização, proatividade e boa interação com a equipe."
          : "Cooperação e abertura para orientações.";
        answers.aval_menos_favoraveis = isGestor
          ? "Ampliar segurança em decisões complexas."
          : "Ainda busca validação em alguns momentos.";
        answers.aval_orientacoes_desenvolvimento =
          "Aprofundar priorização, comunicação de avanços e tomada de decisão.";

        await ensureResponse(
          cycle,
          "aval",
          role,
          isGestor ? cycle.gestor : cycle.anjo,
          isGestor ? DEMO.gestor : DEMO.anjo,
          isGestor ? DEMO.gestorEmail : DEMO.anjoEmail,
          answers,
        );
      }
    }

    const respostas = await tx
      .select({ id: programaIntegracaoRespostas.id })
      .from(programaIntegracaoRespostas)
      .where(
        and(
          eq(programaIntegracaoRespostas.processoId, processoId),
          eq(programaIntegracaoRespostas.statusVinculo, "vinculada"),
        ),
      );

    if (respostas.length < 12) {
      throw new Error(
        `[DemoIntegracao] MARINA_VERIFY expected 12 responses, found ${respostas.length}`,
      );
    }

    console.log(
      "[DemoIntegracao] MARINA_OK",
      JSON.stringify({
        processoId,
        programId: program.id,
        respostas: respostas.length,
      }),
    );

    return { ok: true, processoId, respostas: respostas.length };
  });
}
