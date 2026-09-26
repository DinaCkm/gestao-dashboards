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
    profilePatterns: ["%Jade%Marcia%"],
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

const DEMO_ALL_ACTION_IDS = [
  "pre-00","pre-01","pre-02","pre-03","pre-05","pre-04b","pre-06","pre-07","pre-08","pre-09","pre-10",
  "d1-01","d1-02","d1-04","d1-03","d2-01","d2-02","d3-01","d3-03","d3-04","d3-02","sem1-01",
  "ag1-00","ag1-01","ag1-02","ag1-03","d15-01","d15-02","d15-03","pos1-01","pos1-02","pos1-03","pos1-04","pos1-05","pos1-06","pos1-07","pos1-08","pos1-09","pos1-10",
  "ag2-00","ag2-01","ag2-02","ag2-03","d45-01","d45-02","d45-03","d45-04","pos2-01","pos2-02","pos2-03","pos2-04","pos2-05","pos2-06","pos2-07","pos2-08","pos2-09","pos2-10",
  "d60-01","d60-02","ag3-00","ag3-01","ag3-02","ag3-03","d75-01","d75-02","d75-03","pos3-01","pos3-02","pos3-03","pos3-04","pos3-05","pos3-06","pos3-07","pos3-08","pos3-09","pos3-10","pos3-11","pos3-12",
  "ag4-00","ag4-01","ag4-02","ag4-03","d150-01","d150-02","d150-03","pos4-01","pos4-02","pos4-03","pos4-04","pos4-05","pos4-06","pos4-07","pos4-08","pos4-09","pos4-10",
] as const;

function demoActionDate(itemId: string) {
  if (itemId.startsWith("ag4") || itemId.startsWith("d150") || itemId.startsWith("pos4")) return "2026-09-25";
  if (itemId.startsWith("ag3") || itemId.startsWith("d75") || itemId.startsWith("pos3")) return "2026-07-12";
  if (itemId.startsWith("d60")) return "2026-06-27";
  if (itemId.startsWith("ag2") || itemId.startsWith("d45") || itemId.startsWith("pos2")) return "2026-06-12";
  if (itemId.startsWith("ag1") || itemId.startsWith("d15") || itemId.startsWith("pos1")) return "2026-05-13";
  if (itemId.startsWith("d3") || itemId.startsWith("sem1")) return "2026-05-02";
  if (itemId.startsWith("d2")) return "2026-05-01";
  if (itemId.startsWith("d1")) return "2026-04-30";
  return "2026-04-29";
}

function demoCompletedActionMap() {
  return Object.fromEntries(
    DEMO_ALL_ACTION_IDS.map((itemId) => [itemId, { s: "ok", d: demoActionDate(itemId) }]),
  );
}

function demoAtaFields(scenario: "evolucao" | "queda", ciclo: number) {
  const evolucao = [
    {
      lider: "O líder relata boa receptividade, interesse em aprender e adaptação inicial positiva. Ainda precisa de referências mais claras para priorizar demandas e ganhar segurança nas decisões.",
      colab: "O colaborador relata acolhimento pela equipe e boa compreensão inicial da cultura e da rotina. Diz que ainda está organizando prioridades e conhecendo melhor os fluxos internos.",
      conclusao: "Manter acompanhamento próximo nas próximas semanas, reforçar prioridades da função e combinar checkpoints curtos com o gestor e o Anjo.",
      consultora: "A integração inicia de forma positiva e coerente com o período de adaptação. Recomenda-se manter orientação frequente, com clareza de prioridades e espaço para dúvidas.",
    },
    {
      lider: "O líder percebe evolução na autonomia, na organização das entregas e na interação com a equipe. A pessoa já demanda menos direcionamento para atividades recorrentes.",
      colab: "O colaborador relata maior segurança para executar as atividades e melhor compreensão das expectativas da função. Percebe avanço no relacionamento com equipe e gestor.",
      conclusao: "Dar continuidade ao ganho de autonomia, reforçar o PDI e ampliar gradualmente a responsabilidade sobre entregas de maior complexidade.",
      consultora: "Há evolução consistente entre o primeiro e o segundo alinhamento. O cenário indica adaptação progressiva e maior clareza sobre responsabilidades e desenvolvimento.",
    },
    {
      lider: "O líder observa estabilidade positiva, boa qualidade das entregas e participação mais ativa nas discussões da equipe. Ainda há espaço para ampliar iniciativa em decisões menos estruturadas.",
      colab: "O colaborador relata sentimento de pertencimento mais consolidado e segurança para buscar apoio quando necessário. Considera que já compreende bem a rotina e os principais processos.",
      conclusao: "Consolidar os comportamentos já desenvolvidos, estimular decisões com maior autonomia e manter foco nas metas do PDI.",
      consultora: "O processo apresenta consolidação da adaptação, sem sinais relevantes de regressão. O foco passa a ser desenvolvimento e sustentação da autonomia.",
    },
    {
      lider: "O líder considera a integração concluída de forma satisfatória, com autonomia adequada, boa interação e domínio das principais responsabilidades da função.",
      colab: "O colaborador relata estar integrado à equipe, compreender seu papel e sentir segurança para conduzir as atividades. Identifica como próximo passo continuar avançando no PDI.",
      conclusao: "Encerrar formalmente o Programa de Integração e manter o desenvolvimento por meio do PDI e dos acompanhamentos regulares da liderança.",
      consultora: "A integração foi concluída com evolução consistente. Os dados dos alinhamentos e formulários indicam adaptação positiva e condições para continuidade do desenvolvimento fora do programa.",
    },
  ];

  const queda = [
    {
      lider: "O líder relata início positivo, boa participação e disponibilidade para aprender. A adaptação inicial ocorre dentro do esperado.",
      colab: "O colaborador relata bom acolhimento, clareza inicial das atividades e percepção favorável sobre equipe, gestor e rotina.",
      conclusao: "Manter o acompanhamento previsto e reforçar os canais de apoio durante a adaptação.",
      consultora: "O primeiro alinhamento apresenta sinais positivos e não indica necessidade de ação adicional além do acompanhamento regular.",
    },
    {
      lider: "O líder ainda percebe boa entrega, mas nota menor iniciativa para buscar informações e maior necessidade de confirmação antes de avançar.",
      colab: "O colaborador relata que algumas demandas e prioridades ficaram menos claras e que passou a depender mais de orientação para organizar a rotina.",
      conclusao: "Reforçar expectativas, prioridades e critérios de decisão, com conversas curtas de acompanhamento entre os alinhamentos formais.",
      consultora: "Há uma mudança moderada em relação ao primeiro alinhamento. Recomenda-se aprofundar causas operacionais e reforçar clareza de prioridades, sem antecipar conclusões.",
    },
    {
      lider: "O líder percebe queda de participação e maior hesitação diante de demandas novas. As entregas seguem acontecendo, mas com necessidade maior de direcionamento.",
      colab: "O colaborador relata menor segurança, mais dificuldade para organizar prioridades e percepção de apoio menos consistente no dia a dia.",
      conclusao: "Criar um plano curto de acompanhamento, revisar prioridades da função e combinar pontos semanais com gestor e Anjo.",
      consultora: "A trajetória passou a apresentar queda mais clara. É recomendável investigar mudanças de contexto, comunicação e apoio antes de atribuir causas ao comportamento individual.",
    },
    {
      lider: "O líder relata necessidade de acompanhamento mais próximo e redução da autonomia em comparação aos primeiros meses.",
      colab: "O colaborador relata experiência de integração menos favorável, com menor sensação de apoio e mais dificuldade para compreender prioridades e expectativas.",
      conclusao: "Encerrar o ciclo formal com plano de continuidade, responsabilidades claras e acompanhamento estruturado da liderança nas próximas semanas.",
      consultora: "O último alinhamento confirma queda em relação aos anteriores. A recomendação é tratar o cenário como tema de acompanhamento gerencial, revisar fatores de contexto e pactuar ações objetivas de suporte e desenvolvimento.",
    },
  ];

  return (scenario === "queda" ? queda : evolucao)[Math.max(0, Math.min(3, ciclo - 1))];
}

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
  const feito: Record<string, any> = demoCompletedActionMap();

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
          ataEm: cycle.data,
          ata: demoAtaFields(demo.scenario, cycle.ciclo),
        },
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
      perfilDemoFullEcoAutorizado: Boolean(profile?.id),
      ecoVinculoModo: "manual_demo_autorizado",
      perfilDemoFonte: profile?.name || null,
    },
  };

  let [processo] = await tx
    .select({ id: programaIntegracaoProcessos.id, nome: programaIntegracaoProcessos.nome, estado: programaIntegracaoProcessos.estado })
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
    if (String(processo.nome || "") !== demo.name) {
      throw new Error(`[DemoIntegracao] ${demo.tag} existing record name mismatch`);
    }
    const estadoNormalizado = {
      ...currentState,
      ...estado,
      teste: {
        ...(currentState.teste || {}),
        ...(estado.teste || {}),
        demoTag: demo.tag,
        empresaProgramId: PROGRAM_ID,
      },
    };
    await tx
      .update(programaIntegracaoProcessos)
      .set({ estado: estadoNormalizado, nome: demo.name, gestor: demo.gestor, gestorEmail: demo.gestorEmail, anjo: demo.anjo, anjoEmail: demo.anjoEmail })
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
    const protocolo = `DEMO-${demo.scenario === "queda" ? "Q" : "M"}-${formKey === "pesquisa" ? "PES" : papel === "Gestor" ? "GES" : "ANJ"}-${cycle.ciclo}`;
    const [existing] = await tx
      .select({ id: programaIntegracaoRespostas.id })
      .from(programaIntegracaoRespostas)
      .where(or(
        eq(programaIntegracaoRespostas.dedupeKey, dedupeKey),
        eq(programaIntegracaoRespostas.legacyRid, dedupeKey),
        eq(programaIntegracaoRespostas.protocolo, protocolo),
      ))
      .limit(1);
    if (existing) return;

    await tx.insert(programaIntegracaoRespostas).values({
      processoId,
      legacyRid: dedupeKey,
      protocolo,
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

  const bemDedupeKey = `${demo.tag}:bem:gestor:0`;
  const bemProtocolo = `DEMO-${demo.scenario === "queda" ? "Q" : "M"}-BEM`;
  const [bemExistente] = await tx
    .select({ id: programaIntegracaoRespostas.id })
    .from(programaIntegracaoRespostas)
    .where(or(
      eq(programaIntegracaoRespostas.dedupeKey, bemDedupeKey),
      eq(programaIntegracaoRespostas.legacyRid, bemDedupeKey),
      eq(programaIntegracaoRespostas.protocolo, bemProtocolo),
    ))
    .limit(1);

  if (!bemExistente) {
    const caracteristicas = demo.scenario === "queda"
      ? ["Analítico","Detalhista","Prudente","Determinado","Acolhedor","Comunicativo","Orientador","Estratégico"]
      : ["Analítico","Criativo","Detalhista","Flexível","Acolhedor","Atencioso","Comunicativo","Estratégico"];

    const bemAnswers: Record<string, any> = {
      bem_gestor: demo.gestor,
      bem_unidade: "Unidade de Desenvolvimento [TESTE]",
      bem_colaborador: demo.name,
      bem_data_inicio: "2026-04-29",
      bem_funcao: demo.scenario === "queda" ? "Analista de Relacionamento" : "Analista de Projetos",
      bem_anjo: demo.anjo,
      bem_caracteristicas: caracteristicas,
      bem_conhecimentos_tecnicos: demo.scenario === "queda"
        ? "Atendimento consultivo, registro de demandas, análise de informações e organização da rotina."
        : "Gestão de projetos, organização de rotinas, análise de informações e acompanhamento de entregas.",
      bem_documentos_treinamentos: "Manual do colaborador, normas internas, materiais da unidade e conteúdos de integração.",
      bem_treinamentos_uc: "Integração institucional, proteção de dados e segurança da informação.",
      bem_primeiros_15_dias: "Conhecer a equipe, a rotina, os principais processos, sistemas e prioridades da unidade, com acompanhamento próximo do Gestor e do Anjo.",
      bem_primeiros_60_dias: "Assumir entregas de forma progressiva, ampliar autonomia, revisar aprendizados e alinhar pontos de desenvolvimento com o Gestor.",
    };

    await tx.insert(programaIntegracaoRespostas).values({
      processoId,
      legacyRid: bemDedupeKey,
      protocolo: bemProtocolo,
      dedupeKey: bemDedupeKey,
      formKey: "bem",
      ciclo: 0,
      papel: "Gestor",
      itemId: "pre-04b",
      formVersion: 2,
      statusVinculo: "vinculada",
      statusResposta: "valido",
      nomeColaborador: demo.name,
      unidade: "Unidade de Desenvolvimento [TESTE]",
      dataInicio: "2026-04-29",
      emailColaborador: demo.email,
      nomeOrig: demo.name,
      avaliador: demo.gestor,
      respondentName: demo.gestor,
      respondentEmail: demo.gestorEmail,
      source: "admin",
      media: null,
      alertas: [],
      answers: bemAnswers,
      quandoOriginal: "2026-04-25",
      emOriginal: "2026-04-25",
      submittedAt: new Date("2026-04-25T12:00:00.000Z"),
    });
  }

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
  if (respostas.length < 13) {
    throw new Error(`[DemoIntegracao] ${demo.tag} verify expected at least 13 responses (including BEM), found ${respostas.length}`);
  }

  const [processoVerificado] = await tx
    .select({ estado: programaIntegracaoProcessos.estado })
    .from(programaIntegracaoProcessos)
    .where(eq(programaIntegracaoProcessos.id, processoId))
    .limit(1);
  const feitoVerificado = ((processoVerificado?.estado || {}) as Record<string, any>).feito || {};
  const acoesConcluidas = DEMO_ALL_ACTION_IDS.filter((itemId) => String(feitoVerificado?.[itemId]?.s || "") === "ok").length;
  const alinhamentosRegistrados = Object.values((((processoVerificado?.estado || {}) as Record<string, any>).alin || {}))
    .filter((item: any) => Boolean(item?.realizado)).length;
  if (acoesConcluidas !== DEMO_ALL_ACTION_IDS.length || alinhamentosRegistrados !== 4) {
    throw new Error(
      `[DemoIntegracao] ${demo.tag} verify incomplete demo: actions ${acoesConcluidas}/${DEMO_ALL_ACTION_IDS.length}, alignments ${alinhamentosRegistrados}/4`,
    );
  }

  return {
    processoId,
    respostas: respostas.length,
    acoesConcluidas,
    alinhamentosRegistrados,
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
      const profile = await resolveProfile(tx, demo.profilePatterns, false);
      const result = await ensureDemo(tx, program, demo, profile);
      resultados.push({ tag: demo.tag, ...result });
      console.log("[DemoIntegracao] DEMO_OK", JSON.stringify({ tag: demo.tag, ...result }));
    }

    const jade = await resolveProfile(tx, ["%Jade%Marcia%"], false);
    if (jade?.id) {
      const marianas = await tx
        .select({
          id: programaIntegracaoProcessos.id,
          legacyId: programaIntegracaoProcessos.legacyId,
          nome: programaIntegracaoProcessos.nome,
          estado: programaIntegracaoProcessos.estado,
        })
        .from(programaIntegracaoProcessos)
        .where(eq(programaIntegracaoProcessos.nome, "Mariana Alves Teixeira (demonstração)"))
        .limit(5);

      for (const processo of marianas) {
        const estadoAtual = (processo.estado || {}) as Record<string, any>;
        const testeAtual = estadoAtual.teste || {};
        const novoEstado = {
          ...estadoAtual,
          teste: {
            ...testeAtual,
            demoTag: testeAtual.demoTag || "ugp_demo_mariana_historica",
            empresaProgramId: Number(testeAtual.empresaProgramId || PROGRAM_ID),
            empresaProgramNome: testeAtual.empresaProgramNome || program.name,
            ecoAlunoId: jade.id,
            ecoAlunoNome: jade.name,
            perfilDemoAutorizado: true,
            perfilDemoFullEcoAutorizado: true,
            ecoVinculoModo: "manual_demo_autorizado",
            perfilDemoFonte: jade.name,
          },
        };
        await tx
          .update(programaIntegracaoProcessos)
          .set({ estado: novoEstado })
          .where(eq(programaIntegracaoProcessos.id, processo.id));

        console.log("[DemoIntegracao] DEMO_FULL_ECO_LINK_OK", JSON.stringify({
          processoId: processo.id,
          legacyId: processo.legacyId,
          nome: processo.nome,
          ecoAlunoId: jade.id,
          ecoAlunoNome: jade.name,
        }));
      }
    }

    return { ok: true, demos: resultados };
  });
}
