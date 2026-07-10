/**
 * EcoDISC 360 - Servico de acesso a dados (CRUD) do modulo.
 * Mantem isolamento total do DISC legado (disc_respostas / disc_resultados).
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { sendEmail } from "./emailService";
import { randomUUID } from "crypto";
import {
  discAssessments,
  discAssessmentAnswers,
  discRoleProfiles,
  discOrgProfiles,
  discMatches,
  discGeneratedReports,
  discCultureSurveyAnswers,
  discRoleSurveyAnswers,
  discDiretoriaMembros,
  alunos,
  discResultados,
  autopercepcoesCompetencias,
  departments,
  programs,
  assessmentPdi,
  type InsertDiscAssessment,
  type InsertDiscAssessmentAnswer,
  type InsertDiscRoleProfile,
  type InsertDiscOrgProfile,
  type InsertDiscMatch,
  type InsertDiscGeneratedReport,
} from "../drizzle/schema";
import { calculateFullMatch, type DiscScores, calcularPerfilDiretoriaPorGrupo, type PessoaComScore, determinarPerfil } from "./discMatchService";
import { calcularDiscCargo, avaliarDivergenciaValidacao, obterFaixaTextoCargo, type RespostaRole, type RespostaValidacaoCargo } from "./discRoleService";
import {
  calcularDiscCulturaEmpresa,
  calcularDiscEmpresaConsolidado,
  calcularPredominanciaPorTema,
  obterTextoEixoFaixa,
  obterLeituraCombinada,
  obterRecomendacoesPorPredominancia,
  NOTA_METODOLOGICA_DISC,
  type RespostaCultura,
  type PredominanciaTema,
} from "./discCultureService";
import { DISC360_CULTURE_QUESTIONS, type Disc360CultureDimension } from "../shared/disc360CultureQuestions";
import type { getDb } from "./db";

type DbClient = NonNullable<Awaited<ReturnType<typeof getDb>>>;

// ---------------------------------------------------------------------------
// Assessments (DISC do empregado / cargo / empresa / diretoria)
// ---------------------------------------------------------------------------

export async function createAssessment(database: DbClient, data: InsertDiscAssessment) {
  const result: any = await database.insert(discAssessments).values(data);
  return result?.[0]?.insertId as number;
}

export async function saveAssessmentAnswers(
  database: DbClient,
  assessmentId: number,
  answers: Omit<InsertDiscAssessmentAnswer, "assessmentId">[]
) {
  if (!answers || answers.length === 0) return;
  await database.insert(discAssessmentAnswers).values(
    answers.map((answer) => ({ ...answer, assessmentId }))
  );
}

export async function getAssessmentById(database: DbClient, assessmentId: number) {
  const [assessment] = await database
    .select()
    .from(discAssessments)
    .where(eq(discAssessments.id, assessmentId))
    .limit(1);
  return assessment ?? null;
}

/**
 * Retorna a aplicacao DISC do empregado mais recente e concluida para um aluno,
 * dentro de um programa/empresa especifico.
 */
export async function getLatestEmployeeAssessment(
  database: DbClient,
  alunoId: number,
  programId: number
) {
  const rows = await database
    .select()
    .from(discAssessments)
    .where(
      and(
        eq(discAssessments.alunoId, alunoId),
        eq(discAssessments.programId, programId),
        eq(discAssessments.assessmentType, "empregado"),
        eq(discAssessments.status, "concluido")
      )
    )
    .orderBy(desc(discAssessments.completedAt))
    .limit(1);
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Perfis de cargo (DISC do Cargo)
// ---------------------------------------------------------------------------

export async function createRoleProfile(database: DbClient, data: InsertDiscRoleProfile) {
  const result: any = await database.insert(discRoleProfiles).values(data);
  return result?.[0]?.insertId as number;
}

export async function listRoleProfiles(database: DbClient, programId: number) {
  return database
    .select()
    .from(discRoleProfiles)
    .where(and(eq(discRoleProfiles.programId, programId), eq(discRoleProfiles.isActive, 1)))
    .orderBy(desc(discRoleProfiles.createdAt));
}

export async function getRoleProfileById(database: DbClient, id: number) {
  const rows = await database.select().from(discRoleProfiles).where(eq(discRoleProfiles.id, id)).limit(1);
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Perfis de empresa/diretoria (DISC da Empresa/Diretoria)
// ---------------------------------------------------------------------------

export async function createOrgProfile(database: DbClient, data: InsertDiscOrgProfile) {
  const result: any = await database.insert(discOrgProfiles).values(data);
  return result?.[0]?.insertId as number;
}

export async function listOrgProfiles(database: DbClient, programId: number, includeInactive = false) {
  const condition = includeInactive
    ? eq(discOrgProfiles.programId, programId)
    : and(eq(discOrgProfiles.programId, programId), eq(discOrgProfiles.isActive, 1));
  return database
    .select()
    .from(discOrgProfiles)
    .where(condition)
    .orderBy(desc(discOrgProfiles.createdAt));
}

export async function getOrgProfileById(database: DbClient, id: number) {
  const rows = await database.select().from(discOrgProfiles).where(eq(discOrgProfiles.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateOrgProfile(database: DbClient, id: number, data: Partial<InsertDiscOrgProfile>) {
  await database.update(discOrgProfiles).set(data).where(eq(discOrgProfiles.id, id));
  return getOrgProfileById(database, id);
}

// ---------------------------------------------------------------------------
// Matches (calculo e persistencia)
// ---------------------------------------------------------------------------

export type CalculateAndSaveMatchInput = {
  programId: number;
  alunoId: number;
  employeeAssessmentId: number;
  cargoProfileId?: number | null;
  orgProfileId?: number | null;
};

export async function calculateAndSaveMatch(database: DbClient, input: CalculateAndSaveMatchInput) {
  const assessment = await getAssessmentById(database, input.employeeAssessmentId);
  if (!assessment || !assessment.scores) {
    throw new Error("Aplicacao DISC do empregado nao encontrada ou sem scores calculados.");
  }

  const employeeScores = assessment.scores as unknown as DiscScores;

  const roleProfile = input.cargoProfileId ? await getRoleProfileById(database, input.cargoProfileId) : null;
  const orgProfile = input.orgProfileId ? await getOrgProfileById(database, input.orgProfileId) : null;

  const roleScores = (roleProfile?.expectedScores as unknown as DiscScores | null) ?? null;
  const orgScores = (orgProfile?.expectedScores as unknown as DiscScores | null) ?? null;

  const result = calculateFullMatch(employeeScores, roleScores, orgScores);

  const values: InsertDiscMatch = {
    programId: input.programId,
    alunoId: input.alunoId,
    employeeAssessmentId: input.employeeAssessmentId,
    cargoProfileId: input.cargoProfileId ?? null,
    orgProfileId: input.orgProfileId ?? null,
    matchEmployeeRole: result.matchEmployeeRole !== null ? String(result.matchEmployeeRole) : null,
    matchEmployeeOrg: result.matchEmployeeOrg !== null ? String(result.matchEmployeeOrg) : null,
    matchRoleOrg: result.matchRoleOrg !== null ? String(result.matchRoleOrg) : null,
    matchOverall: result.matchOverall !== null ? String(result.matchOverall) : null,
    classificationEmployeeRole: result.classificationEmployeeRole,
    classificationEmployeeOrg: result.classificationEmployeeOrg,
    classificationRoleOrg: result.classificationRoleOrg,
    classificationOverall: result.classificationOverall,
    strengths: result.strengths as any,
    gaps: result.gaps as any,
    risks: result.risks as any,
    recommendations: result.recommendations as any,
    calculatedAt: new Date(),
  };

  const insertId = await (async () => {
    const res: any = await database.insert(discMatches).values(values);
    return res?.[0]?.insertId as number;
  })();

  return { id: insertId, ...values };
}

export async function listMatchesByAluno(database: DbClient, alunoId: number) {
  return database
    .select()
    .from(discMatches)
    .where(eq(discMatches.alunoId, alunoId))
    .orderBy(desc(discMatches.createdAt));
}

/**
 * Matriz gerencial: lista os matches mais recentes de todos os colaboradores
 * de um programa/empresa, para visao consolidada do RH/diretoria.
 */
export async function getManagementMatrix(database: DbClient, programId: number) {
  return database
    .select()
    .from(discMatches)
    .where(eq(discMatches.programId, programId))
    .orderBy(desc(discMatches.calculatedAt));
}

// ---------------------------------------------------------------------------
// Relatorios gerados (controle/rastreabilidade)
// ---------------------------------------------------------------------------

export async function registerGeneratedReport(database: DbClient, data: InsertDiscGeneratedReport) {
  const result: any = await database.insert(discGeneratedReports).values(data);
  return result?.[0]?.insertId as number;
}

// ---------------------------------------------------------------------------
// Questionario de Cultura Comportamental da Empresa (Opcao A) e
// consolidacao do Perfil DISC da Empresa.
// ---------------------------------------------------------------------------

export type SubmitCultureSurveyInput = {
  programId: number;
  orgProfileId: number;
  respostas: RespostaCultura[];
  respondedByUserId?: number | null;
  respondentName?: string | null;
  respondentEmail?: string | null;
};

export async function submitCultureSurveyResponse(database: DbClient, input: SubmitCultureSurveyInput) {
  const resultado = calcularDiscCulturaEmpresa(input.respostas);

  const assessmentId = await createAssessment(database, {
    programId: input.programId,
    orgProfileId: input.orgProfileId,
    assessmentType: "empresa",
    respondedByUserId: input.respondedByUserId ?? null,
    respondentName: input.respondentName ?? null,
    respondentEmail: input.respondentEmail ?? null,
    status: "concluido",
    scores: resultado.scores as any,
    perfilPredominante: resultado.perfilPredominante as any,
    perfilSecundario: resultado.perfilSecundario as any,
    completedAt: new Date(),
  } as any);

  if (input.respostas.length > 0) {
    await database.insert(discCultureSurveyAnswers).values(
      input.respostas.map((resposta) => ({
        assessmentId,
        questionId: resposta.questionId,
        maisId: `${resposta.questionId}_${resposta.maisDimensao}`,
        menosId: `${resposta.questionId}_${resposta.menosDimensao}`,
        maisDimensao: resposta.maisDimensao,
        menosDimensao: resposta.menosDimensao,
      }))
    );
  }

  return { id: assessmentId, ...resultado };
}

/**
 * Lista as aplicacoes individuais (respondentes) do questionario de cultura
 * ja concluidas para um determinado Perfil DISC da Empresa.
 */
export async function listCultureAssessmentsByOrgProfile(database: DbClient, orgProfileId: number) {
  return database
    .select()
    .from(discAssessments)
    .where(
      and(
        eq(discAssessments.orgProfileId, orgProfileId),
        eq(discAssessments.assessmentType, "empresa"),
        eq(discAssessments.status, "concluido")
      )
    )
    .orderBy(desc(discAssessments.completedAt));
}

/**
 * Para cada uma das perguntas do questionario de cultura, retorna qual eixo
 * comportamental (D/I/S/C) foi mais escolhido entre os respondentes ja
 * concluidos de um Perfil DISC da Empresa, com o nivel de consenso entre
 * eles (unanime / majoritaria / dividida) e o texto da pergunta/tema.
 */
export async function getPredominanciaPorTema(database: DbClient, orgProfileId: number) {
  const assessments = await listCultureAssessmentsByOrgProfile(database, orgProfileId);
  const assessmentIds = assessments.map((assessment) => assessment.id);

  if (assessmentIds.length === 0) {
    return [];
  }

  const respostas = await database
    .select()
    .from(discCultureSurveyAnswers)
    .where(inArray(discCultureSurveyAnswers.assessmentId, assessmentIds));

  const predominancias = calcularPredominanciaPorTema(
    respostas.map((resposta) => ({
      questionId: resposta.questionId,
      maisDimensao: resposta.maisDimensao as Disc360CultureDimension,
      menosDimensao: resposta.menosDimensao as Disc360CultureDimension,
    }))
  );

  const perguntasPorId = new Map(DISC360_CULTURE_QUESTIONS.map((pergunta) => [pergunta.id, pergunta]));

  return predominancias.map((predominancia) => {
    const pergunta = perguntasPorId.get(predominancia.questionId);
    return {
      ...predominancia,
      tema: pergunta?.tema ?? null,
      pergunta: pergunta?.pergunta ?? null,
    };
  });
}

/**
 * Calcula a consolidacao do Perfil DISC da Empresa SEM salvar - usado para
 * mostrar uma previa do resultado antes de o admin validar oficialmente.
 */
export async function previewCultureConsolidation(database: DbClient, orgProfileId: number) {
  const assessments = await listCultureAssessmentsByOrgProfile(database, orgProfileId);
  const scoresIndividuais = assessments
    .map((assessment) => assessment.scores as unknown as DiscScores)
    .filter((scores) => !!scores);
  return calcularDiscEmpresaConsolidado(scoresIndividuais);
}

/**
 * Reune tudo que o Dashboard de Cultura precisa em uma unica chamada:
 * o consolidado geral (D/I/S/C medio, predominante/secundario, status,
 * concordancia), a predominancia por tema (24 perguntas) e o texto fixo
 * ja correto para cada eixo (para exibir direto nos cards).
 */
export async function getDashboardCultura(database: DbClient, orgProfileId: number) {
  const perfil = await getOrgProfileById(database, orgProfileId);
  const nomeEmpresa = perfil?.profileName ?? "a empresa";

  const consolidado = await previewCultureConsolidation(database, orgProfileId);
  const predominanciaPorTema = await getPredominanciaPorTema(database, orgProfileId);

  const dimensoes: Disc360CultureDimension[] = ["D", "I", "S", "C"];
  const textosPorEixo = Object.fromEntries(
    dimensoes.map((eixo) => [
      eixo,
      {
        percentual: consolidado.scoresMedios[eixo],
        texto: obterTextoEixoFaixa(eixo, consolidado.scoresMedios[eixo], nomeEmpresa),
      },
    ])
  );

  const eixoPredominante = consolidado.perfilPredominante as Disc360CultureDimension;
  const eixoSecundario = consolidado.perfilSecundario as Disc360CultureDimension;

  return {
    nomeEmpresa,
    consolidado,
    predominanciaPorTema,
    textosPorEixo,
    notaMetodologica: NOTA_METODOLOGICA_DISC,
    leituraCombinada: obterLeituraCombinada(eixoPredominante, eixoSecundario),
    recomendacoes: obterRecomendacoesPorPredominancia(eixoPredominante),
  };
}

/**
 * Consolida e SALVA o Perfil DISC da Empresa a partir das respostas do
 * questionario de cultura ja recebidas, marcando origemPerfil="questionario".
 */
export async function consolidateOrgProfileFromCulture(database: DbClient, orgProfileId: number) {
  const consolidado = await previewCultureConsolidation(database, orgProfileId);
  await updateOrgProfile(database, orgProfileId, {
    expectedScores: consolidado.scoresMedios as any,
    perfilDesejado: consolidado.perfilSugerido,
    origemPerfil: "questionario",
    statusConsistencia: consolidado.statusConsistencia,
    totalRespondentes: consolidado.totalRespondentes,
  } as any);
  return consolidado;
}

/**
 * Bloco 5 (revisado): consolidacao do Perfil DISC da Diretoria a partir do DISC
 * individual (legado) dos diretores selecionados manualmente pelo RH.
 *
 * IMPORTANTE: a funcao abaixo (getLegacyDiscResultForAluno) apenas LE dados de
 * disc_resultados. Nenhuma escrita, alteracao ou exclusao e feita nessa tabela.
 */

export async function getLegacyDiscResultForAluno(database: DbClient, alunoId: number) {
  const rows = await database
    .select()
    .from(discResultados)
    .where(eq(discResultados.alunoId, alunoId))
    .orderBy(desc(discResultados.ciclo), desc(discResultados.completedAt))
    .limit(1);
  return rows[0] || null;
}

export async function listDistinctCargosByProgram(database: DbClient, programId: number) {
  const rows = await database
    .selectDistinct({ cargo: alunos.cargo })
    .from(alunos)
    .where(eq(alunos.programId, programId));
  return rows
    .map((r) => r.cargo)
    .filter((c): c is string => !!c && c.trim().length > 0)
    .sort((a, b) => a.localeCompare(b));
}

export async function searchAlunosForSelection(
  database: DbClient,
  filters: { programId: number; departmentId?: number; cargo?: string }
) {
  const conditions = [eq(alunos.programId, filters.programId)];
  if (filters.departmentId) conditions.push(eq(alunos.departmentId, filters.departmentId));
  if (filters.cargo) conditions.push(eq(alunos.cargo, filters.cargo));
  return database
    .select({ id: alunos.id, name: alunos.name, email: alunos.email, cargo: alunos.cargo, departmentId: alunos.departmentId })
    .from(alunos)
    .where(and(...conditions))
    .orderBy(alunos.name);
}

export async function addDiretoriaMembro(database: DbClient, orgProfileId: number, alunoId: number) {
  const existentes = await database
    .select()
    .from(discDiretoriaMembros)
    .where(
      and(
        eq(discDiretoriaMembros.orgProfileId, orgProfileId),
        eq(discDiretoriaMembros.alunoId, alunoId)
      )
    );
  if (existentes.length > 0) return existentes[0];
  await database.insert(discDiretoriaMembros).values({ orgProfileId, alunoId });
  const inserted = await database
    .select()
    .from(discDiretoriaMembros)
    .where(
      and(
        eq(discDiretoriaMembros.orgProfileId, orgProfileId),
        eq(discDiretoriaMembros.alunoId, alunoId)
      )
    );
  return inserted[0];
}

export async function removeDiretoriaMembro(database: DbClient, orgProfileId: number, alunoId: number) {
  await database
    .delete(discDiretoriaMembros)
    .where(
      and(
        eq(discDiretoriaMembros.orgProfileId, orgProfileId),
        eq(discDiretoriaMembros.alunoId, alunoId)
      )
    );
}

export async function listDiretoriaMembrosComScores(database: DbClient, orgProfileId: number) {
  const membros = await database
    .select({ alunoId: discDiretoriaMembros.alunoId, nome: alunos.name })
    .from(discDiretoriaMembros)
    .innerJoin(alunos, eq(discDiretoriaMembros.alunoId, alunos.id))
    .where(eq(discDiretoriaMembros.orgProfileId, orgProfileId));

  const comScores = await Promise.all(
    membros.map(async (m) => {
      const resultado = await getLegacyDiscResultForAluno(database, m.alunoId);
      return {
        alunoId: m.alunoId,
        nome: m.nome,
        temDiscLegado: !!resultado,
        scores: resultado
          ? {
              D: Number(resultado.scoreD),
              I: Number(resultado.scoreI),
              S: Number(resultado.scoreS),
              C: Number(resultado.scoreC),
            }
          : null,
      };
    })
  );
  return comScores;
}

export async function previewDiretoriaConsolidacao(database: DbClient, orgProfileId: number) {
  const membros = await listDiretoriaMembrosComScores(database, orgProfileId);
  const comDisc: PessoaComScore[] = membros
    .filter((m) => m.scores !== null)
    .map((m) => ({ alunoId: m.alunoId, nome: m.nome, scores: m.scores as DiscScores }));

  if (comDisc.length === 0) {
    return {
      totalMembros: membros.length,
      totalComDisc: 0,
      resultado: null as ReturnType<typeof calcularPerfilDiretoriaPorGrupo> | null,
    };
  }

  const resultado = calcularPerfilDiretoriaPorGrupo(comDisc);
  return { totalMembros: membros.length, totalComDisc: comDisc.length, resultado };
}

export async function consolidateDiretoriaFromGrupo(database: DbClient, orgProfileId: number) {
  const preview = await previewDiretoriaConsolidacao(database, orgProfileId);
  if (!preview.resultado) {
    throw new Error("Nenhum membro selecionado possui DISC individual (legado) registrado.");
  }
  await updateOrgProfile(database, orgProfileId, {
    expectedScores: preview.resultado.scoresFinais,
    perfilDesejado: preview.resultado.perfilSugerido,
    origemPerfil: "grupo_diretores",
    totalRespondentes: preview.totalComDisc,
  });
  return preview;
}


// ---------------------------------------------------------------------------
// Convites de respondentes - Perfil DISC da Empresa (link direto, sem login)
// ---------------------------------------------------------------------------

export type ConviteCulturaInput = {
  alunoId?: number | null;
  respondentName: string;
  respondentEmail?: string | null;
};

export async function criarConvitesCulturaEmpresa(
  database: DbClient,
  input: { programId: number; orgProfileId: number; convites: ConviteCulturaInput[] }
) {
  const criados: Array<{ id: number; token: string; respondentName: string; emailEnviado: boolean }> = [];
  for (const convite of input.convites) {
    const conviteToken = randomUUID();
    const result: any = await database.insert(discAssessments).values({
      programId: input.programId,
      orgProfileId: input.orgProfileId,
      alunoId: convite.alunoId ?? null,
      assessmentType: "empresa",
      status: "pendente",
      respondentName: convite.respondentName,
      respondentEmail: convite.respondentEmail ?? null,
      conviteToken,
    } as any);
    const id = result?.[0]?.insertId as number;

    let emailEnviado = false;
    if (convite.respondentEmail) {
      const link = "https://ecolider.ecodobem.com/disc360/responder-convite/" + conviteToken;
      const nomeExibicao = convite.respondentName || "Colaborador(a)";
      const envio = await sendEmail({
        to: convite.respondentEmail,
        subject: "Convite: Pesquisa de Cultura da Empresa",
        html:
          "<p>Ola, " + nomeExibicao + ".</p>" +
          "<p>Voce foi convidado(a) a participar da pesquisa de cultura comportamental da empresa. " +
          "Clique no link abaixo para responder (leva poucos minutos, sem necessidade de login):</p>" +
          "<p><a href=\"" + link + "\">" + link + "</a></p>",
      });
      emailEnviado = !!envio?.success;
    }

    criados.push({ id, token: conviteToken, respondentName: convite.respondentName, emailEnviado });
  }
  return criados;
}

export async function listarConvitesCulturaEmpresa(database: DbClient, orgProfileId: number) {
  return database
    .select()
    .from(discAssessments)
    .where(
      and(
        eq(discAssessments.orgProfileId, orgProfileId),
        eq(discAssessments.assessmentType, "empresa")
      )
    )
    .orderBy(desc(discAssessments.createdAt));
}

export async function getConvitePorToken(database: DbClient, conviteToken: string) {
  const rows = await database
    .select()
    .from(discAssessments)
    .where(eq(discAssessments.conviteToken, conviteToken));
  return (rows as any[])[0] ?? null;
}

export async function responderConviteCulturaEmpresa(
  database: DbClient,
  input: { token: string; respostas: RespostaCultura[] }
) {
  const convite = await getConvitePorToken(database, input.token);
  if (!convite) {
    throw new Error("Convite nao encontrado.");
  }
  if (convite.status !== "pendente") {
    throw new Error("Este convite ja foi respondido.");
  }

  const resultado = calcularDiscCulturaEmpresa(input.respostas);

  await database
    .update(discAssessments)
    .set({
      status: "concluido",
      scores: resultado.scores as any,
      perfilPredominante: resultado.perfilPredominante as any,
      perfilSecundario: resultado.perfilSecundario as any,
      completedAt: new Date(),
    } as any)
    .where(eq(discAssessments.id, convite.id));

  if (input.respostas.length > 0) {
    await database.insert(discCultureSurveyAnswers).values(
      input.respostas.map((resposta) => ({
        assessmentId: convite.id,
        questionId: resposta.questionId,
        maisId: `${resposta.questionId}_${resposta.maisDimensao}`,
        menosId: `${resposta.questionId}_${resposta.menosDimensao}`,
        maisDimensao: resposta.maisDimensao,
        menosDimensao: resposta.menosDimensao,
      }))
    );
  }

  return { id: convite.id, ...resultado };
}

// ---------------------------------------------------------------------------
// Perfil DISC do Cargo - Questionario investigativo (lider + empregado)
// ---------------------------------------------------------------------------

export async function updateRoleProfile(database: DbClient, id: number, data: Partial<InsertDiscRoleProfile>) {
  await database.update(discRoleProfiles).set(data).where(eq(discRoleProfiles.id, id));
  return getRoleProfileById(database, id);
}

export type ConviteCargoInput = {
  papelRespondente: "lider" | "empregado";
  respondentName: string;
  respondentEmail?: string | null;
};

export async function criarConvitesCargoRole(
  database: DbClient,
  input: { programId: number; cargoProfileId: number; convites: ConviteCargoInput[] }
) {
  const criados: Array<{ id: number; token: string; papelRespondente: string; respondentName: string; emailEnviado: boolean }> = [];
  for (const convite of input.convites) {
    const conviteToken = randomUUID();
    const result: any = await database.insert(discAssessments).values({
      programId: input.programId,
      cargoProfileId: input.cargoProfileId,
      assessmentType: "cargo",
      status: "pendente",
      papelRespondente: convite.papelRespondente,
      respondentName: convite.respondentName,
      respondentEmail: convite.respondentEmail ?? null,
      conviteToken,
    } as any);
    const id = result?.[0]?.insertId as number;

    let emailEnviado = false;
    if (convite.respondentEmail) {
      const link = "https://ecolider.ecodobem.com/disc360/responder-convite-cargo/" + conviteToken;
      const nomeExibicao = convite.respondentName || "Colaborador(a)";
      const envio = await sendEmail({
        to: convite.respondentEmail,
        subject: "Convite: Perfil DISC do Cargo",
        html:
          "<p>Ola, " + nomeExibicao + ".</p>" +
          "<p>Voce foi convidado(a) a participar da identificacao do perfil comportamental esperado para um cargo. " +
          "Clique no link abaixo para responder (leva poucos minutos, sem necessidade de login):</p>" +
          "<p><a href=\"" + link + "\">" + link + "</a></p>",
      });
      emailEnviado = !!envio?.success;
    }

    criados.push({ id, token: conviteToken, papelRespondente: convite.papelRespondente, respondentName: convite.respondentName, emailEnviado });
  }
  return criados;
}

export async function listarConvitesCargoRole(database: DbClient, cargoProfileId: number) {
  return database
    .select()
    .from(discAssessments)
    .where(
      and(
        eq(discAssessments.cargoProfileId, cargoProfileId),
        eq(discAssessments.assessmentType, "cargo")
      )
    )
    .orderBy(desc(discAssessments.createdAt));
}

export async function responderConviteCargoPorToken(
  database: DbClient,
  input: { token: string; respostas: RespostaRole[]; respostaValidacao: RespostaValidacaoCargo }
) {
  const convite = await getConvitePorToken(database, input.token);
  if (!convite) {
    throw new Error("Convite nao encontrado.");
  }
  if (convite.status !== "pendente") {
    throw new Error("Este convite ja foi respondido.");
  }

  const resultado = calcularDiscCargo(input.respostas);
  const avaliacoesDivergencia = avaliarDivergenciaValidacao(resultado.scores, input.respostaValidacao);

  await database
    .update(discAssessments)
    .set({
      status: "concluido",
      scores: resultado.scores as any,
      perfilPredominante: resultado.perfilPredominante as any,
      perfilSecundario: resultado.perfilSecundario as any,
      respostaValidacaoD: input.respostaValidacao.D,
      respostaValidacaoI: input.respostaValidacao.I,
      respostaValidacaoS: input.respostaValidacao.S,
      respostaValidacaoC: input.respostaValidacao.C,
      completedAt: new Date(),
    } as any)
    .where(eq(discAssessments.id, convite.id));

  if (input.respostas.length > 0) {
    await database.insert(discRoleSurveyAnswers).values(
      input.respostas.map((resposta) => ({
        assessmentId: convite.id,
        questionId: resposta.questionId,
        maisId: `${resposta.questionId}_${resposta.maisDimensao}`,
        menosId: `${resposta.questionId}_${resposta.menosDimensao}`,
        maisDimensao: resposta.maisDimensao,
        menosDimensao: resposta.menosDimensao,
      }))
    );
  }

  return { id: convite.id, ...resultado, avaliacoesDivergencia };
}

export async function previewCargoConsolidacao(database: DbClient, cargoProfileId: number) {
  const assessments = await database
    .select()
    .from(discAssessments)
    .where(
      and(
        eq(discAssessments.cargoProfileId, cargoProfileId),
        eq(discAssessments.assessmentType, "cargo"),
        eq(discAssessments.status, "concluido")
      )
    );

  const respondentes = (assessments as any[]).map((a) => {
    const scores = (a.scores || { D: 0, I: 0, S: 0, C: 0 }) as DiscScores;
    const respostaValidacao = {
      D: a.respostaValidacaoD ?? 0,
      I: a.respostaValidacaoI ?? 0,
      S: a.respostaValidacaoS ?? 0,
      C: a.respostaValidacaoC ?? 0,
    };
    const avaliacoesDivergencia = avaliarDivergenciaValidacao(scores, respostaValidacao);
    return {
      papelRespondente: a.papelRespondente,
      respondentName: a.respondentName,
      scores,
      respostaValidacao,
      avaliacoesDivergencia,
    };
  });

  const totalRespondentes = respondentes.length;
  const scoresMedios: DiscScores = { D: 0, I: 0, S: 0, C: 0 };
  if (totalRespondentes > 0) {
    for (const r of respondentes) {
      scoresMedios.D += r.scores.D;
      scoresMedios.I += r.scores.I;
      scoresMedios.S += r.scores.S;
      scoresMedios.C += r.scores.C;
    }
    scoresMedios.D = Math.round((scoresMedios.D / totalRespondentes) * 100) / 100;
    scoresMedios.I = Math.round((scoresMedios.I / totalRespondentes) * 100) / 100;
    scoresMedios.S = Math.round((scoresMedios.S / totalRespondentes) * 100) / 100;
    scoresMedios.C = Math.round((scoresMedios.C / totalRespondentes) * 100) / 100;
  }

  const perfil = determinarPerfil(scoresMedios);
  const statusConsistencia = totalRespondentes >= 2 ? "suficiente" : "previa";

  return {
    respondentes,
    totalRespondentes,
    scoresMedios,
    perfilPredominante: perfil.predominante,
    perfilSecundario: perfil.secundario,
    perfilSugerido: perfil.sugerido,
    statusConsistencia,
  };
}

export async function consolidateRoleProfile(database: DbClient, cargoProfileId: number) {
  const consolidado = await previewCargoConsolidacao(database, cargoProfileId);
  await updateRoleProfile(database, cargoProfileId, {
    expectedScores: consolidado.scoresMedios as any,
    perfilEsperado: consolidado.perfilSugerido,
  } as any);
  return consolidado;
}

export async function getDashboardCargo(database: DbClient, cargoProfileId: number) {
  const cargoProfile = await getRoleProfileById(database, cargoProfileId);
  const consolidado = await previewCargoConsolidacao(database, cargoProfileId);

  const dimensoes: ("D" | "I" | "S" | "C")[] = ["D", "I", "S", "C"];
  const textosPorEixo = Object.fromEntries(
    dimensoes.map((eixo) => [
      eixo,
      {
        percentual: consolidado.scoresMedios[eixo],
        ...obterFaixaTextoCargo(eixo, consolidado.scoresMedios[eixo]),
      },
    ])
  );

  return {
    cargoProfile,
    consolidado,
    textosPorEixo,
  };
}

export async function listAplicacoesDISC(database: DbClient, programId: number) {
  const alunosRows = await database
    .select({
      id: alunos.id,
      name: alunos.name,
      email: alunos.email,
      departmentId: alunos.departmentId,
      cargo: alunos.cargo,
      isActive: alunos.isActive,
      canLogin: alunos.canLogin,
      onboardingLiberado: alunos.onboardingLiberado,
      discVideoWatchedAt: alunos.discVideoWatchedAt,
    })
    .from(alunos)
    .where(eq(alunos.programId, programId));

  const alunoIds = alunosRows.map((a) => a.id);
  if (alunoIds.length === 0) {
    return [];
  }

  const pdiRows = await database
    .select({ alunoId: assessmentPdi.alunoId })
    .from(assessmentPdi)
    .where(inArray(assessmentPdi.alunoId, alunoIds));
  const alunoIdsComPdi = new Set(pdiRows.map((r) => r.alunoId));

  const discRows = await database
    .select()
    .from(discResultados)
    .where(inArray(discResultados.alunoId, alunoIds))
    .orderBy(desc(discResultados.ciclo), desc(discResultados.completedAt));

  const latestDiscByAluno = new Map<number, (typeof discRows)[number]>();
  for (const row of discRows) {
    if (!latestDiscByAluno.has(row.alunoId)) {
      latestDiscByAluno.set(row.alunoId, row);
    }
  }

  const competenciaRows = await database
    .select({ alunoId: autopercepcoesCompetencias.alunoId })
    .from(autopercepcoesCompetencias)
    .where(inArray(autopercepcoesCompetencias.alunoId, alunoIds));

  const competenciaCountByAluno = new Map<number, number>();
  for (const row of competenciaRows) {
    competenciaCountByAluno.set(row.alunoId, (competenciaCountByAluno.get(row.alunoId) ?? 0) + 1);
  }

  return alunosRows.map((a) => {
    const disc = latestDiscByAluno.get(a.id) ?? null;
    return {
      ...a,
      hasPdi: alunoIdsComPdi.has(a.id),
      discConcluido: !!disc,
      discPerfilPredominante: disc?.perfilPredominante ?? null,
      discPerfilSecundario: disc?.perfilSecundario ?? null,
      discScores: disc
        ? { D: disc.scoreD, I: disc.scoreI, S: disc.scoreS, C: disc.scoreC }
        : null,
      discCompletedAt: disc?.completedAt ?? null,
      competenciasRespondidas: competenciaCountByAluno.get(a.id) ?? 0,
    };
  });
}

export async function getRelatorioIndividualDISC(database: DbClient, alunoId: number) {
  const [aluno] = await database.select().from(alunos).where(eq(alunos.id, alunoId)).limit(1);
  if (!aluno) return null;

  const disc = await getLegacyDiscResultForAluno(database, alunoId);

  let departmentName: string | null = null;
  let lider: { name: string; email: string | null } | null = null;
  if (aluno.departmentId) {
    const [dept] = await database
      .select()
      .from(departments)
      .where(eq(departments.id, aluno.departmentId))
      .limit(1);
    if (dept) {
      departmentName = dept.name;
      if (dept.managerId) {
        const [liderAluno] = await database
          .select()
          .from(alunos)
          .where(eq(alunos.id, dept.managerId))
          .limit(1);
        if (liderAluno) {
          lider = { name: liderAluno.name, email: liderAluno.email };
        }
      }
    }
  }

  let programName: string | null = null;
  if (aluno.programId) {
    const [prog] = await database.select().from(programs).where(eq(programs.id, aluno.programId)).limit(1);
    programName = prog?.name ?? null;
  }

  return {
    aluno: { id: aluno.id, name: aluno.name, email: aluno.email, cargo: aluno.cargo },
    programName,
    departmentName,
    lider,
    disc,
  };
}

export type EnviarRelatorioIndividualDISCInput = {
  alunoId: number;
  destinatarios: Array<"colaborador" | "lider">;
};

export async function enviarRelatorioIndividualDISC(
  database: DbClient,
  input: EnviarRelatorioIndividualDISCInput
) {
  const relatorio = await getRelatorioIndividualDISC(database, input.alunoId);
  if (!relatorio) {
    throw new Error("Colaborador nao encontrado.");
  }
  if (!relatorio.disc) {
    throw new Error("Este colaborador ainda nao concluiu o teste DISC.");
  }

  const url = `https://ecolider.ecodobem.com/disc360/relatorio-individual/${input.alunoId}`;

  const destinatariosEmail: { email: string; nome: string }[] = [];
  if (input.destinatarios.includes("colaborador") && relatorio.aluno.email) {
    destinatariosEmail.push({ email: relatorio.aluno.email, nome: relatorio.aluno.name });
  }
  if (input.destinatarios.includes("lider") && relatorio.lider?.email) {
    destinatariosEmail.push({ email: relatorio.lider.email, nome: relatorio.lider.name });
  }

  if (destinatariosEmail.length === 0) {
    throw new Error("Nenhum destinatario com email valido encontrado para o envio.");
  }

  const results: { email: string; success: boolean; error?: string }[] = [];
  for (const dest of destinatariosEmail) {
    const html = `
      <p>Olá, ${dest.nome}.</p>
      <p>O relatório individual de Perfil DISC de <strong>${relatorio.aluno.name}</strong> está disponível para visualização:</p>
      <p><a href="${url}">${url}</a></p>
    `;
    const result = await sendEmail({
      to: dest.email,
      subject: `Relatório DISC - ${relatorio.aluno.name}`,
      html,
    });
    results.push({ email: dest.email, success: result.success, error: result.error });
  }

  return { results };
}
