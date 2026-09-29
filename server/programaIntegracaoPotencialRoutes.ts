import { randomUUID } from "crypto";
import { Router, type NextFunction, type Request, type Response } from "express";
import { assertNivelPermiteNovasAtribuicoes, createNotification, getAllUsers, getContratoNivelVigenteByAluno, getMentoringSessionsByAluno, getMentoringSessionsByAlunoAndNivel, getRawConnection } from "./db";
import { sdk } from "./_core/sdk";

export const programaIntegracaoPotencialRouter = Router();

const TASK_TITLES = [
  "Tarefa solicitada pelo gestor para os primeiros 15 dias",
  "Tarefa solicitada pelo gestor para os primeiros 60 dias",
  "Conhecimentos técnicos solicitados pelo gestor",
  "Concluir os cursos obrigatórios da Universidade Sebrae",
] as const;

function asJson<T = any>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}

function sanitizeLegacyId(value: unknown) {
  return String(value ?? "").trim().slice(0, 100);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function dataIsoValida(value: unknown): string | null {
  const text = String(value ?? "").trim();
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (
    Number.isNaN(d.getTime()) ||
    d.getUTCFullYear() !== Number(m[1]) ||
    d.getUTCMonth() !== Number(m[2]) - 1 ||
    d.getUTCDate() !== Number(m[3])
  ) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function addDiasIso(value: string, dias: number): string {
  const iso = dataIsoValida(value);
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function diaSemanaIso(value: string): number {
  return new Date(`${value}T12:00:00Z`).getUTCDay();
}

function proximoDiaUtil(value: string, feriados: Set<string>): string {
  let atual = value;
  for (let i = 0; i < 40; i += 1) {
    const dow = diaSemanaIso(atual);
    if (dow !== 0 && dow !== 6 && !feriados.has(atual)) return atual;
    atual = addDiasIso(atual, 1);
  }
  return value;
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Acesso restrito ao administrador." });
    }
    (req as any).authenticatedUser = user;
    next();
  } catch {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }
}

async function getConnectionOr503(res: Response) {
  const connection = await getRawConnection();
  if (!connection) {
    res.status(503).json({ error: "Banco de dados indisponível." });
    return null;
  }
  return connection;
}

async function audit(
  connection: any,
  req: Request,
  acao: string,
  detalhe: string,
  processoId: number,
  metadata?: any,
) {
  try {
    const userId = Number((req as any).authenticatedUser?.id || 0) || null;
    await connection.execute(
      `INSERT INTO programa_integracao_auditoria
       (processoId,respostaId,userId,acao,detalhe,metadata)
       VALUES (?,NULL,?,?,?,?)`,
      [processoId, userId, acao, detalhe, metadata == null ? null : JSON.stringify(metadata)],
    );
  } catch (error) {
    console.warn("[ProgramaIntegracaoPotencial] Falha ao registrar auditoria:", error);
  }
}

async function carregarProcesso(connection: any, legacyId: string, lock = false) {
  const [rows] = (await connection.execute(
    `SELECT id,legacyId,nome,cpf,email,emailCorporativo,cargo,unidade,inicio,situacao,estado
     FROM programa_integracao_processos
     WHERE legacyId=? AND situacao<>'removido'
     LIMIT 1${lock ? " FOR UPDATE" : ""}`,
    [legacyId],
  )) as any;
  return rows?.[0] || null;
}

async function carregarBem(connection: any, processoId: number) {
  const [rows] = (await connection.execute(
    `SELECT id,answers,submittedAt,updatedAt
     FROM programa_integracao_respostas
     WHERE processoId=?
       AND formKey='bem'
       AND statusVinculo='vinculada'
       AND COALESCE(statusResposta,'valido') NOT IN ('removida_admin','substituida_publico')
     ORDER BY submittedAt DESC,id DESC
     LIMIT 1`,
    [processoId],
  )) as any;
  return rows?.[0] || null;
}

async function carregarAluno(connection: any, alunoId: number) {
  const [rows] = (await connection.execute(
    `SELECT id,name,email,cpf,programId,consultorId,turmaId,trilhaId,isActive
     FROM alunos
     WHERE id=?
     LIMIT 1`,
    [alunoId],
  )) as any;
  return rows?.[0] || null;
}

async function carregarPerfil(connection: any, alunoId: number) {
  const [discRows] = (await connection.execute(
    `SELECT scoreD,scoreI,scoreS,scoreC,perfilPredominante,perfilSecundario,ciclo,completedAt
     FROM disc_resultados
     WHERE alunoId=?
     ORDER BY ciclo DESC,completedAt DESC,id DESC
     LIMIT 1`,
    [alunoId],
  )) as any;

  const [autoRows] = (await connection.execute(
    `SELECT ap.competenciaId,c.nome AS competenciaNome,ap.nota,ap.createdAt
     FROM autopercepcoes_competencias ap
     LEFT JOIN competencias c ON c.id=ap.competenciaId
     WHERE ap.alunoId=?
     ORDER BY ap.createdAt DESC,ap.id DESC`,
    [alunoId],
  )) as any;

  const porCompetencia = new Map<number, any>();
  for (const row of autoRows || []) {
    const id = Number(row.competenciaId || 0);
    if (id > 0 && !porCompetencia.has(id)) porCompetencia.set(id, row);
  }

  return {
    disc: discRows?.[0] || null,
    autoavaliacoes: Array.from(porCompetencia.values()).map((row: any) => ({
      competencia: String(row.competenciaNome || `Competência ${row.competenciaId}`),
      nota: Number(row.nota || 0),
    })),
  };
}

function dadosMentora(estado: Record<string, any>) {
  const ficha = estado?.feito?.["d15-03"] && typeof estado.feito["d15-03"] === "object"
    ? estado.feito["d15-03"]
    : {};
  const competencias = Array.isArray(ficha.competencias)
    ? ficha.competencias.map((x: any) => String(x || "").trim()).filter(Boolean).slice(0, 4)
    : [];
  const observacoes = Array.isArray(ficha.notas)
    ? ficha.notas.map((n: any) => String(n?.t || "").trim()).filter(Boolean)
    : [];
  return { competencias, observacoes };
}

function validarVinculo(processo: any, estado: Record<string, any>, aluno: any) {
  const alunoId = Number(estado?.teste?.ecoAlunoId || 0);
  if (!alunoId) {
    return { seguro: false, motivo: "Colaborador ainda não está vinculado a um aluno do ECO Líderes." };
  }
  if (!aluno || Number(aluno.id) !== alunoId || Number(aluno.isActive ?? 1) !== 1) {
    return { seguro: false, motivo: "O vínculo salvo aponta para um aluno inexistente ou inativo no ECO Líderes." };
  }

  const modo = String(estado?.teste?.ecoVinculoModo || "");
  const confirmado = estado?.teste?.ecoAutomacaoConfirmada;
  const confirmacaoValida = Number(confirmado?.alunoId || 0) === alunoId;

  // Para estas automações não reaproveitamos a lógica de correspondência
  // aproximada do vínculo histórico. Só aceitamos o aluno selecionado
  // manualmente no Programa ou uma confirmação explícita do Admin para este ID.
  const manual = modo === "manual";
  const seguro = manual || confirmacaoValida;

  return {
    seguro,
    motivo: seguro
      ? manual
        ? "Vínculo selecionado manualmente no Programa de Integração."
        : "Vínculo confirmado explicitamente para automações."
      : "O vínculo salvo pode ter vindo de uma correspondência automática. Confirme explicitamente este aluno antes de continuar.",
    precisaConfirmacao: !seguro,
    alunoId,
    modo,
  };
}

async function contexto(connection: any, legacyId: string, lock = false) {
  const processo = await carregarProcesso(connection, legacyId, lock);
  if (!processo) throw Object.assign(new Error("Processo de integração não encontrado."), { statusCode: 404 });

  const estado = asJson<Record<string, any>>(processo.estado, {});
  const alunoId = Number(estado?.teste?.ecoAlunoId || 0);
  const aluno = alunoId ? await carregarAluno(connection, alunoId) : null;
  const vinculo = validarVinculo(processo, estado, aluno);
  const bem = await carregarBem(connection, Number(processo.id));
  const perfil = alunoId && aluno ? await carregarPerfil(connection, alunoId) : { disc: null, autoavaliacoes: [] };
  const mentora = dadosMentora(estado);

  return { processo, estado, aluno, alunoId, vinculo, bem, perfil, mentora };
}

function requireContextoSeguro(ctx: Awaited<ReturnType<typeof contexto>>, opts?: { bem?: boolean; disc?: boolean; mentora?: boolean }) {
  if (!ctx.vinculo.seguro) {
    throw Object.assign(new Error(ctx.vinculo.motivo), { statusCode: 409, code: "VINCULO_NAO_CONFIRMADO" });
  }
  if (opts?.bem && !ctx.bem) {
    throw Object.assign(new Error("O formulário Bem Acolhido deste colaborador ainda não foi encontrado."), { statusCode: 409, code: "BEM_AUSENTE" });
  }
  if (opts?.disc && !ctx.perfil.disc) {
    throw Object.assign(new Error("O Perfil DISC deste aluno ainda não está disponível."), { statusCode: 409, code: "DISC_AUSENTE" });
  }
  if (opts?.mentora && ctx.mentora.competencias.length === 0 && ctx.mentora.observacoes.length === 0) {
    throw Object.assign(new Error("Registre as competências/soft skills ou observações da consultora no item do 15º dia antes de gerar a avaliação."), { statusCode: 409, code: "MENTORA_AUSENTE" });
  }
}

function answer(answers: Record<string, any>, key: string) {
  const value = answers?.[key];
  if (Array.isArray(value)) return value.map((x) => String(x || "").trim()).filter(Boolean).join("; ");
  return String(value ?? "").trim();
}

function sourceKey(ctx: Awaited<ReturnType<typeof contexto>>) {
  const bemSubmittedAt = ctx.bem?.submittedAt ? new Date(ctx.bem.submittedAt).toISOString() : "";
  const discAt = ctx.perfil.disc?.completedAt ? new Date(ctx.perfil.disc.completedAt).toISOString() : "";
  return JSON.stringify({
    processoId: Number(ctx.processo.id),
    alunoId: ctx.alunoId,
    bemId: Number(ctx.bem?.id || 0),
    bemSubmittedAt,
    bemUpdatedAt: ctx.bem?.updatedAt ? new Date(ctx.bem.updatedAt).toISOString() : "",
    discCiclo: Number(ctx.perfil.disc?.ciclo || 0),
    discAt,
    competencias: ctx.mentora.competencias,
    observacoes: ctx.mentora.observacoes,
    autoavaliacoes: ctx.perfil.autoavaliacoes,
  });
}

function llmText(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => typeof part === "string" ? part : String(part?.text || "")).join("");
  }
  return "";
}

async function invokeJsonComSingleRetry(
  invokeLLM: (params: any) => Promise<any>,
  params: any,
  finalMessage: string,
) {
  for (let tentativa = 1; tentativa <= 2; tentativa += 1) {
    const response = await invokeLLM(params);
    const raw = llmText(response?.choices?.[0]?.message?.content).trim();
    if (raw) return { response, raw };

    console.warn("[ProgramaIntegracaoPotencial] IA respondeu sem conteúdo.", {
      tentativa,
      modelo: String(response?.model || ""),
      finishReason: String(response?.choices?.[0]?.finish_reason || ""),
      choices: Array.isArray(response?.choices) ? response.choices.length : 0,
    });
  }

  throw new Error(finalMessage);
}

async function gerarAvaliacaoComIa(ctx: Awaited<ReturnType<typeof contexto>>) {
  const answers = asJson<Record<string, any>>(ctx.bem?.answers, {});
  const disc = ctx.perfil.disc;
  const dados = {
    colaborador: {
      cargo: String(ctx.processo.cargo || ""),
      unidade: String(ctx.processo.unidade || ""),
    },
    consultora: {
      competencias: ctx.mentora.competencias,
      observacoes: ctx.mentora.observacoes,
    },
    gestorBemAcolhido: {
      caracteristicasEsperadas: answer(answers, "bem_caracteristicas"),
      primeiros15Dias: answer(answers, "bem_primeiros_15_dias"),
      primeiros60Dias: answer(answers, "bem_primeiros_60_dias"),
      conhecimentosTecnicos: answer(answers, "bem_conhecimentos_tecnicos"),
      documentosTreinamentos: answer(answers, "bem_documentos_treinamentos"),
    },
    disc: disc ? {
      predominante: String(disc.perfilPredominante || ""),
      secundario: String(disc.perfilSecundario || ""),
      D: Number(disc.scoreD || 0),
      I: Number(disc.scoreI || 0),
      S: Number(disc.scoreS || 0),
      C: Number(disc.scoreC || 0),
    } : null,
    autoavaliacoes: ctx.perfil.autoavaliacoes,
  };

  const { invokeLLM } = await import("./_core/llm");
  const { response, raw } = await invokeJsonComSingleRetry(
    invokeLLM,
    {
      messages: [
        {
          role: "system",
          content: [
            "Você atua como especialista em desenvolvimento organizacional e deve produzir uma Avaliação de Potencial breve, profissional e útil para RH.",
            "Use exclusivamente os dados fornecidos. Não invente fatos, diagnósticos, características ou motivações.",
            "Diferencie fatos registrados das interpretações integradas. Quando os dados não sustentarem uma conclusão, declare a limitação.",
            "Dê peso especial às competências e observações registradas pela consultora, cruzando-as com a expectativa do gestor, DISC e autoavaliações.",
            "Evite rótulos definitivos. Fale em comportamentos observados, tendências, aderências e aspectos a desenvolver.",
            "Retorne somente JSON válido com exatamente estas chaves: sintese (string), caracteristicasComportamentais (array de strings), competenciasObservadas (array de strings), convergencias (array de strings), pontosAtencao (array de strings), desenvolvimento (array de strings), aderenciaDemandas (string), recomendacoes (array de strings) e limitacoes (array de strings).",
            "Se o DISC estiver ausente, registre essa ausência em limitacoes e prossiga com as demais fontes; não invente um perfil DISC.",
          ].join("\n"),
        },
        { role: "user", content: JSON.stringify(dados) },
      ],
      response_format: { type: "json_object" },
    },
    "A IA não retornou conteúdo após uma nova tentativa. Tente novamente em alguns instantes.",
  );
  const parsed = JSON.parse(raw);
  const arr = (value: any) => Array.isArray(value) ? value.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 12) : [];
  const resultado = {
    sintese: String(parsed?.sintese || "").trim(),
    caracteristicasComportamentais: arr(parsed?.caracteristicasComportamentais),
    competenciasObservadas: arr(parsed?.competenciasObservadas),
    convergencias: arr(parsed?.convergencias),
    pontosAtencao: arr(parsed?.pontosAtencao),
    desenvolvimento: arr(parsed?.desenvolvimento),
    aderenciaDemandas: String(parsed?.aderenciaDemandas || "").trim(),
    recomendacoes: arr(parsed?.recomendacoes),
    limitacoes: arr(parsed?.limitacoes),
  };
  if (!resultado.sintese) throw new Error("A IA retornou uma avaliação sem síntese válida.");
  return { resultado, modelo: String(response.model || ""), dadosFontes: dados };
}

async function gerarSugestoesComIa(
  ctx: Awaited<ReturnType<typeof contexto>>,
  avaliacao: any,
  quantidade: number,
  excluirTitulos: string[] = [],
) {
  const answers = asJson<Record<string, any>>(ctx.bem?.answers, {});
  const dados = {
    competenciasMentora: ctx.mentora.competencias,
    observacoesMentora: ctx.mentora.observacoes,
    avaliacaoPotencial: avaliacao?.resultado || avaliacao,
    expectativasGestor: {
      caracteristicasEsperadas: answer(answers, "bem_caracteristicas"),
      conhecimentosTecnicos: answer(answers, "bem_conhecimentos_tecnicos"),
      primeiros60Dias: answer(answers, "bem_primeiros_60_dias"),
    },
    disc: ctx.perfil.disc ? {
      predominante: String(ctx.perfil.disc.perfilPredominante || ""),
      secundario: String(ctx.perfil.disc.perfilSecundario || ""),
      D: Number(ctx.perfil.disc.scoreD || 0),
      I: Number(ctx.perfil.disc.scoreI || 0),
      S: Number(ctx.perfil.disc.scoreS || 0),
      C: Number(ctx.perfil.disc.scoreC || 0),
    } : null,
    excluirTitulos,
    quantidade,
  };

  const { invokeLLM } = await import("./_core/llm");
  const { raw } = await invokeJsonComSingleRetry(
    invokeLLM,
    {
      messages: [
        {
          role: "system",
          content: [
            "Gere ações práticas e independentes de desenvolvimento para um colaborador em onboarding.",
            "A prioridade deve ser: competências/soft skills apontadas pela consultora; lacunas da Avaliação de Potencial; diferenças entre o que o gestor espera e o que os dados indicam; DISC como contexto complementar.",
            "As ações NÃO são sequenciais e nenhuma depende da outra.",
            "Prefira atividades simples, concretas, dinâmicas e aplicáveis ao dia a dia: pequenos relatórios, agenda/planejamento, pesquisa orientada, observação prática, apresentação curta, TED Talk, filme/série, leitura curta de capítulos de livro, checklist, reflexão estruturada ou exercício semelhante.",
            "Se citar um livro, TED Talk, filme ou série pelo nome, use apenas uma obra real e amplamente conhecida; não invente títulos, autores, links, episódios ou materiais. Se houver dúvida, proponha uma pesquisa orientada sem nomear uma obra específica.",
            "Não use propostas genéricas como 'melhorar comunicação'. Não invente fatos sobre a pessoa.",
            "Cada ação deve conter SOMENTE: titulo, comoFazer e comprovacao.",
            "Não inclua justificativa, motivo da sugestão, resultado esperado nem prazo.",
            "Retorne somente JSON no formato {\"acoes\":[...]}.",
          ].join("\n"),
        },
        { role: "user", content: JSON.stringify(dados) },
      ],
      response_format: { type: "json_object" },
    },
    "A IA não retornou sugestões após uma nova tentativa. Tente novamente em alguns instantes.",
  );
  const parsed = JSON.parse(raw);
  const acoes = Array.isArray(parsed?.acoes) ? parsed.acoes : [];
  const normalizadas = acoes.map((item: any) => ({
    titulo: String(item?.titulo || "").trim(),
    comoFazer: String(item?.comoFazer || "").trim(),
    comprovacao: String(item?.comprovacao || "").trim(),
  })).filter((item: any) => item.titulo && item.comoFazer && item.comprovacao).slice(0, quantidade);
  if (normalizadas.length !== quantidade) {
    throw new Error("A IA não retornou a quantidade esperada de sugestões válidas.");
  }
  return normalizadas;
}

async function dataFimOnboarding(connection: any, processo: any, estado: Record<string, any>) {
  const alinhamento4 = estado?.alin?.["4"] ?? estado?.alin?.[4];
  const confirmada = dataIsoValida(alinhamento4?.realizado) || dataIsoValida(alinhamento4?.data);
  if (confirmada) return confirmada;

  const inicio = dataIsoValida(processo.inicio);
  const alinhamento1 = estado?.alin?.["1"] ?? estado?.alin?.[1];
  const primeiroAlinhamento = dataIsoValida(alinhamento1?.realizado) || dataIsoValida(alinhamento1?.data);
  if (!inicio && !primeiroAlinhamento) {
    throw Object.assign(new Error("Não há uma data válida de início nem do 1º alinhamento para calcular os prazos do onboarding."), { statusCode: 409 });
  }

  const offset = Number(estado?.teste?.agendaRecalculo?.offsetDias || 0);
  // O 4º alinhamento corresponde ao marco de 150 dias. Quando o cadastro
  // histórico não possui início válido, a data real/agendada do 1º
  // alinhamento (marco de 15 dias) é a referência segura já registrada.
  let fim = inicio
    ? addDiasIso(inicio, 149 + (Number.isFinite(offset) ? offset : 0))
    : addDiasIso(primeiroAlinhamento as string, 135);

  const [cfgRows] = (await connection.execute(
    "SELECT valor FROM programa_integracao_config WHERE chave='geral' LIMIT 1",
  )) as any;
  const cfg = cfgRows?.[0] ? asJson<Record<string, any>>(cfgRows[0].valor, {}) : {};
  const feriados = new Set<string>(
    Array.isArray(cfg?.feriados) ? cfg.feriados.map((x: any) => String(x || "").slice(0, 10)).filter(Boolean) : [],
  );
  fim = proximoDiaUtil(fim, feriados);
  return fim;
}

async function montarPreviewTarefasGestor(
  connection: any,
  ctx: Awaited<ReturnType<typeof contexto>>,
) {
  if (!ctx.bem) {
    return {
      disponivel: false,
      prazo: null as string | null,
      faltantes: ["Formulário Bem Acolhido"],
      bloqueio: "",
      itens: [] as Array<{ titulo: string; descricao: string; prazo: string | null }>,
    };
  }

  const respostas = asJson<Record<string, any>>(ctx.bem.answers, {});
  const v15 = answer(respostas, "bem_primeiros_15_dias");
  const v60 = answer(respostas, "bem_primeiros_60_dias");
  const conhecimentos = answer(respostas, "bem_conhecimentos_tecnicos");
  const documentos = answer(respostas, "bem_documentos_treinamentos");
  const faltantes = [
    !v15 && "Primeiros 15 dias",
    !v60 && "Primeiros 60 dias",
    (!conhecimentos && !documentos) && "Conhecimentos técnicos / documentos, manuais e treinamentos",
  ].filter(Boolean) as string[];

  let prazo: string | null = null;
  let prazoPrimeiraTarefa: string | null = null;
  let bloqueio = "";
  try {
    prazo = await dataFimOnboarding(connection, ctx.processo, ctx.estado);
    const alinhamento1 = ctx.estado?.alin?.["1"] ?? ctx.estado?.alin?.[1];
    const dataPrimeiroAlinhamento = dataIsoValida(alinhamento1?.realizado) || dataIsoValida(alinhamento1?.data);
    if (dataPrimeiroAlinhamento) {
      prazoPrimeiraTarefa = addDiasIso(dataPrimeiroAlinhamento, 15);
    } else {
      const inicio = dataIsoValida(ctx.processo.inicio);
      prazoPrimeiraTarefa = inicio ? addDiasIso(inicio, 29) : null;
    }
    if (prazo < todayIso()) {
      bloqueio = "O prazo final do onboarding já passou. Nenhuma tarefa será criada automaticamente.";
    } else if (!prazoPrimeiraTarefa) {
      bloqueio = "Não há uma data válida do 1º alinhamento para calcular o prazo da primeira tarefa.";
    } else if (prazoPrimeiraTarefa < todayIso()) {
      // Se a configuração estiver sendo feita depois do marco de 30 dias,
      // preserva tempo real de execução em vez de criar uma tarefa já vencida.
      prazoPrimeiraTarefa = addDiasIso(todayIso(), 15);
    }
  } catch (error: any) {
    bloqueio = String(error?.message || "Não foi possível calcular os prazos do onboarding.");
  }

  const descricoes = [
    v15,
    v60,
    [
      conhecimentos ? `Conhecimentos técnicos imprescindíveis:\n${conhecimentos}` : "",
      documentos ? `Documentos, manuais e treinamentos imprescindíveis:\n${documentos}` : "",
    ].filter(Boolean).join("\n\n"),
    "Consulte o PDF de orientação disponível na Jornada Compliance, identifique todos os cursos obrigatórios, conclua cada um deles diretamente na Universidade Sebrae até o fim do onboarding e envie todos os prints das telas de conclusão dos cursos como comprovação.",
  ];

  return {
    disponivel: Boolean(prazo) && faltantes.length === 0 && !bloqueio,
    prazo,
    faltantes,
    bloqueio,
    itens: TASK_TITLES.map((titulo, index) => ({
      titulo,
      descricao: descricoes[index] || "",
      prazo: index === 0 ? prazoPrimeiraTarefa : prazo,
    })),
  };
}

function datasSugestoes(hoje: string, fim: string, max = 5) {
  const inicio = new Date(`${hoje}T12:00:00Z`).getTime();
  const final = new Date(`${fim}T12:00:00Z`).getTime();
  const dias = Math.floor((final - inicio) / 86400000);
  if (dias < 20) return [] as string[];

  const datas: string[] = [];
  let deslocamento = 20;
  while (datas.length < max && deslocamento <= dias) {
    datas.push(addDiasIso(hoje, deslocamento));
    deslocamento += 25;
  }
  return datas;
}

async function consultorParaAluno(connection: any, aluno: any) {
  const direto = Number(aluno?.consultorId || 0);
  if (direto) return direto;
  const [rows] = (await connection.execute(
    `SELECT consultorId FROM mentoring_sessions
     WHERE alunoId=? AND COALESCE(cancelada,0)=0 AND consultorId IS NOT NULL
     ORDER BY id DESC LIMIT 1`,
    [Number(aluno.id)],
  )) as any;
  const historico = Number(rows?.[0]?.consultorId || 0);
  if (!historico) {
    throw Object.assign(new Error("O aluno não possui mentor/consultor vinculado. Nenhuma tarefa foi criada."), { statusCode: 409 });
  }
  return historico;
}

async function notificarAlunoSobreTarefas(
  alunoId: number,
  quantidade: number,
  titulo?: string,
) {
  try {
    const allUsers = await getAllUsers();
    const alunoUser = allUsers.find((u: any) => Number(u.alunoId || 0) === Number(alunoId));
    if (!alunoUser) return;

    const varias = quantidade > 1;
    await createNotification({
      userId: alunoUser.id,
      title: varias ? `${quantidade} novas tarefas no seu PDI` : "Nova tarefa no seu PDI",
      message: varias
        ? `Você recebeu ${quantidade} novas tarefas do Programa de Integração. Consulte seu PDI para ver os prazos e realizar as entregas.`
        : `Você recebeu uma nova tarefa no seu PDI${titulo ? `: ${titulo}` : "."}`,
      type: "action",
      category: "mentoria",
      link: "/meu-dashboard",
    });
  } catch (error) {
    console.warn("[ProgramaIntegracaoPotencial] Falha ao notificar aluno sobre nova tarefa:", error);
  }
}

async function inserirTarefa(
  connection: any,
  input: {
    aluno: any;
    consultorId: number;
    trilhaId: number | null;
    contratoNivelId: number | null;
    titulo: string;
    descricao: string;
    prazo: string;
    sessionNumber: number;
  },
) {
  const [result] = (await connection.execute(
    `INSERT INTO mentoring_sessions
     (alunoId,contratoNivelId,consultorId,turmaId,trilhaId,sessionNumber,sessionDate,presence,taskStatus,
      taskDeadline,customTaskTitle,customTaskDescription,taskMode,tipoSessao,cancelada,createdAt)
     VALUES (?,?,?,?,?,?,?,'presente','nao_entregue',?,?,?, 'livre','individual_normal',0,CURRENT_TIMESTAMP)`,
    [
      Number(input.aluno.id),
      input.contratoNivelId,
      input.consultorId,
      input.aluno.turmaId || null,
      input.trilhaId,
      input.sessionNumber,
      todayIso(),
      input.prazo,
      input.titulo,
      input.descricao,
    ],
  )) as any;
  return Number(result.insertId);
}

async function contextoNovaTarefa(alunoId: number) {
  try {
    await assertNivelPermiteNovasAtribuicoes(alunoId, null, "programa-integracao.atividade-pratica");
  } catch (error: any) {
    throw Object.assign(
      new Error(error?.message || "O nível atual do aluno não permite novas atribuições."),
      { statusCode: 409, code: "NIVEL_BLOQUEADO" },
    );
  }
  const nivel = await getContratoNivelVigenteByAluno(alunoId);
  const contratoNivelId = nivel?.id ?? null;
  const sessoesDoNivel = contratoNivelId
    ? await getMentoringSessionsByAlunoAndNivel(alunoId, contratoNivelId)
    : [];
  const base = sessoesDoNivel.length > 0
    ? sessoesDoNivel
    : await getMentoringSessionsByAluno(alunoId);
  const proximoNumero = base.length
    ? Math.max(...base.map((s: any) => Number(s.sessionNumber || 0))) + 1
    : 1;
  return { contratoNivelId, proximoNumero };
}

function httpError(res: Response, error: any, fallback: string) {
  const status = Number(error?.statusCode || 500);
  if (status >= 500) console.error("[ProgramaIntegracaoPotencial]", error);
  return res.status(status).json({ error: error?.message || fallback, code: error?.code || undefined });
}

programaIntegracaoPotencialRouter.get(
  "/api/programa-integracao/processos/:legacyId/avaliacao-potencial/contexto",
  requireAdmin,
  async (req, res) => {
    try {
      const connection = await getConnectionOr503(res); if (!connection) return;
      const legacyId = sanitizeLegacyId(req.params.legacyId);
      const ctx = await contexto(connection, legacyId);
      const teste = ctx.estado?.teste || {};
      return res.json({
        ok: true,
        colaborador: { nome: ctx.processo.nome, cargo: ctx.processo.cargo || "", unidade: ctx.processo.unidade || "" },
        vinculo: {
          ...ctx.vinculo,
          aluno: ctx.aluno ? { id: Number(ctx.aluno.id), nome: String(ctx.aluno.name || ""), email: String(ctx.aluno.email || "") } : null,
        },
        fontes: {
          bem: Boolean(ctx.bem),
          disc: Boolean(ctx.perfil.disc),
          autoavaliacoes: ctx.perfil.autoavaliacoes.length,
          competenciasMentora: ctx.mentora.competencias,
          observacoesMentora: ctx.mentora.observacoes,
        },
        avaliacao: teste.avaliacaoPotencialIntegrada || null,
        sugestoes: teste.sugestoesDesenvolvimento || null,
        tarefasPadrao: teste.tarefasIntegracaoPadrao || null,
        tarefasGestorPreview: await montarPreviewTarefasGestor(connection, ctx),
      });
    } catch (error) {
      return httpError(res, error, "Não foi possível carregar o contexto da Avaliação de Potencial.");
    }
  },
);

programaIntegracaoPotencialRouter.post(
  "/api/programa-integracao/processos/:legacyId/vinculo-eco/confirmar-automacoes",
  requireAdmin,
  async (req, res) => {
    const connection = await getConnectionOr503(res); if (!connection) return;
    let tx = false;
    try {
      const legacyId = sanitizeLegacyId(req.params.legacyId);
      const esperado = Number(req.body?.alunoId || 0);
      if (!esperado) return res.status(400).json({ error: "Aluno inválido." });

      await connection.beginTransaction(); tx = true;
      const ctx = await contexto(connection, legacyId, true);
      if (!ctx.alunoId || ctx.alunoId !== esperado || !ctx.aluno) {
        throw Object.assign(new Error("O vínculo mudou desde a última leitura. Atualize a tela antes de confirmar."), { statusCode: 409 });
      }
      ctx.estado.teste = ctx.estado.teste || {};
      ctx.estado.teste.ecoAutomacaoConfirmada = {
        alunoId: esperado,
        em: new Date().toISOString(),
        porUserId: Number((req as any).authenticatedUser?.id || 0) || null,
      };
      await connection.execute(
        "UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?",
        [JSON.stringify(ctx.estado), Number(ctx.processo.id)],
      );
      await audit(connection, req, "vinculo_eco_confirmado_automacoes", "Vínculo ECO confirmado para automações do Programa de Integração.", Number(ctx.processo.id), { alunoId: esperado });
      await connection.commit(); tx = false;
      return res.json({ ok: true });
    } catch (error) {
      if (tx) try { await connection.rollback(); } catch {}
      return httpError(res, error, "Não foi possível confirmar o vínculo.");
    }
  },
);

programaIntegracaoPotencialRouter.post(
  "/api/programa-integracao/processos/:legacyId/avaliacao-potencial/gerar",
  requireAdmin,
  async (req, res) => {
    try {
      const connection = await getConnectionOr503(res); if (!connection) return;
      const legacyId = sanitizeLegacyId(req.params.legacyId);
      const ctx = await contexto(connection, legacyId);
      requireContextoSeguro(ctx, { bem: true, mentora: true });
      const chaveFontes = sourceKey(ctx);
      const gerada = await gerarAvaliacaoComIa(ctx);

      await connection.beginTransaction();
      try {
        const atual = await contexto(connection, legacyId, true);
        requireContextoSeguro(atual, { bem: true, mentora: true });
        if (sourceKey(atual) !== chaveFontes) {
          throw Object.assign(new Error("Os dados do colaborador mudaram enquanto a avaliação era gerada. Nenhuma avaliação foi salva; gere novamente."), { statusCode: 409 });
        }
        atual.estado.teste = atual.estado.teste || {};
        const snapshot = {
          versao: 1,
          geradaEm: new Date().toISOString(),
          geradaPorUserId: Number((req as any).authenticatedUser?.id || 0) || null,
          alunoId: atual.alunoId,
          modelo: gerada.modelo,
          fontes: {
            bemRespostaId: Number(atual.bem?.id || 0),
            bemSubmittedAt: atual.bem?.submittedAt ? new Date(atual.bem.submittedAt).toISOString() : null,
            bemUpdatedAt: atual.bem?.updatedAt ? new Date(atual.bem.updatedAt).toISOString() : null,
            discCiclo: Number(atual.perfil.disc?.ciclo || 0),
            discCompletedAt: atual.perfil.disc?.completedAt ? new Date(atual.perfil.disc.completedAt).toISOString() : null,
            competenciasMentora: atual.mentora.competencias,
            observacoesMentora: atual.mentora.observacoes,
            dadosUtilizados: gerada.dadosFontes,
          },
          resultado: gerada.resultado,
        };
        atual.estado.teste.avaliacaoPotencialIntegrada = snapshot;
        delete atual.estado.teste.sugestoesDesenvolvimento;
        await connection.execute(
          "UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?",
          [JSON.stringify(atual.estado), Number(atual.processo.id)],
        );
        await audit(connection, req, "avaliacao_potencial_ia_gerada", "Avaliação de Potencial integrada gerada e registrada.", Number(atual.processo.id), { alunoId: atual.alunoId, modelo: gerada.modelo });
        await connection.commit();
        return res.json({ ok: true, avaliacao: snapshot });
      } catch (error) {
        try { await connection.rollback(); } catch {}
        throw error;
      }
    } catch (error) {
      return httpError(res, error, "Não foi possível gerar a Avaliação de Potencial.");
    }
  },
);

programaIntegracaoPotencialRouter.post(
  "/api/programa-integracao/processos/:legacyId/tarefas-gestor/criar",
  requireAdmin,
  async (req, res) => {
    const connection = await getConnectionOr503(res); if (!connection) return;
    let tx = false;
    try {
      const legacyId = sanitizeLegacyId(req.params.legacyId);
      await connection.beginTransaction(); tx = true;
      const ctx = await contexto(connection, legacyId, true);
      requireContextoSeguro(ctx, { bem: true });

      const preview = await montarPreviewTarefasGestor(connection, ctx);
      if (preview.faltantes.length) {
        throw Object.assign(new Error(`O Bem Acolhido está sem: ${preview.faltantes.join(", ")}. Nenhuma tarefa foi criada.`), { statusCode: 409 });
      }
      if (preview.bloqueio) {
        throw Object.assign(new Error(preview.bloqueio), { statusCode: 409 });
      }
      if (!preview.prazo || !preview.disponivel) {
        throw Object.assign(new Error("A prévia das tarefas ainda não está pronta para criação."), { statusCode: 409 });
      }

      const anterior = ctx.estado?.teste?.tarefasIntegracaoPadrao;
      if (anterior && !anterior.revertidasEm) {
        if (Number(anterior.alunoId || 0) !== ctx.alunoId) {
          throw Object.assign(new Error("Já existe um histórico de tarefas padrão ligado a outro aluno. Revise o vínculo antes de continuar."), { statusCode: 409 });
        }
        const ids = Object.values(anterior.sessionIds || {}).map(Number).filter((id) => id > 0);
        if (ids.length) {
          const placeholders = ids.map(() => "?").join(",");
          const [existentes] = (await connection.execute(
            `SELECT id FROM mentoring_sessions WHERE id IN (${placeholders}) AND alunoId=? AND COALESCE(cancelada,0)=0`,
            [...ids, ctx.alunoId],
          )) as any;
          if ((existentes || []).length === ids.length && ids.length === 4) {
            throw Object.assign(new Error("As quatro tarefas padrão já foram criadas para este colaborador. Nenhuma duplicação foi feita."), { statusCode: 409, code: "TAREFAS_JA_CRIADAS" });
          }
          throw Object.assign(new Error("Existe um histórico parcial de tarefas padrão. Nenhuma nova tarefa foi criada; revise as Atividades Práticas antes de continuar."), { statusCode: 409 });
        }
      }

      const [duplicadas] = (await connection.execute(
        `SELECT id,customTaskTitle FROM mentoring_sessions
         WHERE alunoId=? AND COALESCE(cancelada,0)=0 AND customTaskTitle IN (?,?,?,?)`,
        [ctx.alunoId, ...TASK_TITLES],
      )) as any;
      if (duplicadas?.length) {
        throw Object.assign(new Error("Já existem tarefas com os títulos padrão para este aluno. Nenhuma duplicação foi feita."), { statusCode: 409 });
      }

      // Reutiliza a mesma classificacao das tarefas livres ja criadas em Atividades Praticas:
      // trilha atual do aluno, taskMode='livre' e taskId nulo. Nao cria biblioteca
      // paralela nem associa artificialmente a tarefa a Jornada Compliance.
      const trilhaId = Number(ctx.aluno.trilhaId || 0) || null;
      const consultorId = await consultorParaAluno(connection, ctx.aluno);
      const prazo = preview.prazo;

      const sessaoContexto = await contextoNovaTarefa(ctx.alunoId);
      const base = sessaoContexto.proximoNumero;

      const ids: number[] = [];
      for (let i = 0; i < preview.itens.length; i += 1) {
        const item = preview.itens[i];
        ids.push(await inserirTarefa(connection, {
          aluno: ctx.aluno,
          consultorId,
          trilhaId,
          contratoNivelId: sessaoContexto.contratoNivelId,
          titulo: item.titulo,
          descricao: item.descricao,
          prazo: item.prazo || prazo,
          sessionNumber: base + i,
        }));
      }

      ctx.estado.teste = ctx.estado.teste || {};
      ctx.estado.teste.tarefasIntegracaoPadrao = {
        versao: 1,
        alunoId: ctx.alunoId,
        trilhaId,
        taskMode: "livre",
        criadasEm: new Date().toISOString(),
        prazo,
        prazos: {
          primeiros15Dias: preview.itens[0]?.prazo || prazo,
          primeiros60Dias: preview.itens[1]?.prazo || prazo,
          conhecimentosTecnicos: preview.itens[2]?.prazo || prazo,
          universidadeSebrae: preview.itens[3]?.prazo || prazo,
        },
        sessionIds: {
          primeiros15Dias: ids[0],
          primeiros60Dias: ids[1],
          conhecimentosTecnicos: ids[2],
          universidadeSebrae: ids[3],
        },
      };
      await connection.execute(
        "UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?",
        [JSON.stringify(ctx.estado), Number(ctx.processo.id)],
      );
      await audit(connection, req, "tarefas_gestor_criadas", "Quatro tarefas padrão do onboarding criadas em Atividades Práticas.", Number(ctx.processo.id), { alunoId: ctx.alunoId, sessionIds: ids, prazo });
      await connection.commit(); tx = false;
      await notificarAlunoSobreTarefas(ctx.alunoId, 4);
      return res.json({ ok: true, criadas: 4, sessionIds: ids, prazo });
    } catch (error) {
      if (tx) try { await connection.rollback(); } catch {}
      return httpError(res, error, "Não foi possível criar as tarefas do gestor.");
    }
  },
);

programaIntegracaoPotencialRouter.post(
  "/api/programa-integracao/processos/:legacyId/sugestoes-desenvolvimento/gerar",
  requireAdmin,
  async (req, res) => {
    try {
      const connection = await getConnectionOr503(res); if (!connection) return;
      const legacyId = sanitizeLegacyId(req.params.legacyId);
      const ctx = await contexto(connection, legacyId);
      requireContextoSeguro(ctx, { bem: true, mentora: true });
      const avaliacao = ctx.estado?.teste?.avaliacaoPotencialIntegrada;
      if (!avaliacao || Number(avaliacao.alunoId || 0) !== ctx.alunoId) {
        throw Object.assign(new Error("Gere primeiro a Avaliação de Potencial deste colaborador."), { statusCode: 409 });
      }
      const fim = await dataFimOnboarding(connection, ctx.processo, ctx.estado);
      const datas = datasSugestoes(todayIso(), fim, 5);
      if (!datas.length) {
        throw Object.assign(new Error("Não há tempo suficiente até o fim do onboarding para sugerir uma nova ação com prazo adequado."), { statusCode: 409 });
      }
      const quantidade = Math.min(5, datas.length);
      const chave = sourceKey(ctx);
      const acoes = await gerarSugestoesComIa(ctx, avaliacao, quantidade);

      await connection.beginTransaction();
      try {
        const atual = await contexto(connection, legacyId, true);
        requireContextoSeguro(atual, { bem: true, mentora: true });
        if (sourceKey(atual) !== chave) {
          throw Object.assign(new Error("Os dados do colaborador mudaram enquanto as sugestões eram geradas. Nada foi salvo; gere novamente."), { statusCode: 409 });
        }
        const avaliacaoAtual = atual.estado?.teste?.avaliacaoPotencialIntegrada;
        if (!avaliacaoAtual || String(avaliacaoAtual.geradaEm || "") !== String(avaliacao.geradaEm || "")) {
          throw Object.assign(new Error("A Avaliação de Potencial mudou. Gere novamente as sugestões."), { statusCode: 409 });
        }
        atual.estado.teste = atual.estado.teste || {};
        const pacote = {
          versao: 1,
          alunoId: atual.alunoId,
          avaliacaoGeradaEm: avaliacao.geradaEm,
          geradasEm: new Date().toISOString(),
          itens: acoes.map((acao: any, index: number) => ({
            id: randomUUID(),
            ...acao,
            prazoSugerido: datas[index],
            status: "sugerida",
            sessionId: null,
          })),
        };
        atual.estado.teste.sugestoesDesenvolvimento = pacote;
        await connection.execute(
          "UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?",
          [JSON.stringify(atual.estado), Number(atual.processo.id)],
        );
        await audit(connection, req, "sugestoes_desenvolvimento_ia_geradas", "Sugestões independentes de desenvolvimento geradas.", Number(atual.processo.id), { alunoId: atual.alunoId, quantidade });
        await connection.commit();
        return res.json({ ok: true, sugestoes: pacote });
      } catch (error) {
        try { await connection.rollback(); } catch {}
        throw error;
      }
    } catch (error) {
      return httpError(res, error, "Não foi possível gerar as sugestões de desenvolvimento.");
    }
  },
);

programaIntegracaoPotencialRouter.post(
  "/api/programa-integracao/processos/:legacyId/sugestoes-desenvolvimento/:sugestaoId/descartar",
  requireAdmin,
  async (req, res) => {
    const connection = await getConnectionOr503(res); if (!connection) return;
    let tx = false;
    try {
      const legacyId = sanitizeLegacyId(req.params.legacyId);
      const sugestaoId = String(req.params.sugestaoId || "");
      await connection.beginTransaction(); tx = true;
      const ctx = await contexto(connection, legacyId, true);
      requireContextoSeguro(ctx);
      const pacote = ctx.estado?.teste?.sugestoesDesenvolvimento;
      const item = pacote?.itens?.find((x: any) => String(x.id) === sugestaoId);
      if (!item) throw Object.assign(new Error("Sugestão não encontrada."), { statusCode: 404 });
      if (item.status === "inserida") {
        throw Object.assign(new Error("Esta sugestão já foi inserida nas tarefas e não pode ser descartada por este botão."), { statusCode: 409 });
      }
      item.status = "descartada";
      item.descartadaEm = new Date().toISOString();
      await connection.execute(
        "UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?",
        [JSON.stringify(ctx.estado), Number(ctx.processo.id)],
      );
      await audit(connection, req, "sugestao_desenvolvimento_descartada", "Sugestão de desenvolvimento descartada.", Number(ctx.processo.id), { sugestaoId });
      await connection.commit(); tx = false;
      return res.json({ ok: true });
    } catch (error) {
      if (tx) try { await connection.rollback(); } catch {}
      return httpError(res, error, "Não foi possível descartar a sugestão.");
    }
  },
);

programaIntegracaoPotencialRouter.post(
  "/api/programa-integracao/processos/:legacyId/sugestoes-desenvolvimento/:sugestaoId/regenerar",
  requireAdmin,
  async (req, res) => {
    try {
      const connection = await getConnectionOr503(res); if (!connection) return;
      const legacyId = sanitizeLegacyId(req.params.legacyId);
      const sugestaoId = String(req.params.sugestaoId || "");
      const ctx = await contexto(connection, legacyId);
      requireContextoSeguro(ctx, { bem: true, mentora: true });
      const pacote = ctx.estado?.teste?.sugestoesDesenvolvimento;
      const item = pacote?.itens?.find((x: any) => String(x.id) === sugestaoId);
      if (!item) throw Object.assign(new Error("Sugestão não encontrada."), { statusCode: 404 });
      if (item.status === "inserida") throw Object.assign(new Error("Esta sugestão já foi inserida e não pode ser substituída."), { statusCode: 409 });
      const avaliacao = ctx.estado?.teste?.avaliacaoPotencialIntegrada;
      if (!avaliacao) throw Object.assign(new Error("A Avaliação de Potencial não está disponível."), { statusCode: 409 });
      const excluir = (pacote.itens || []).filter((x: any) => x.id !== sugestaoId && x.status !== "descartada").map((x: any) => String(x.titulo || "")).filter(Boolean);
      const chave = sourceKey(ctx);
      const [nova] = await gerarSugestoesComIa(ctx, avaliacao, 1, excluir);

      await connection.beginTransaction();
      try {
        const atual = await contexto(connection, legacyId, true);
        if (sourceKey(atual) !== chave) throw Object.assign(new Error("Os dados mudaram durante a geração. Nenhuma sugestão foi substituída."), { statusCode: 409 });
        const pacoteAtual = atual.estado?.teste?.sugestoesDesenvolvimento;
        const itemAtual = pacoteAtual?.itens?.find((x: any) => String(x.id) === sugestaoId);
        if (!itemAtual || itemAtual.status === "inserida") throw Object.assign(new Error("A sugestão mudou. Atualize a tela."), { statusCode: 409 });
        Object.assign(itemAtual, nova, { status: "sugerida", regeneradaEm: new Date().toISOString(), descartadaEm: null });
        await connection.execute(
          "UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?",
          [JSON.stringify(atual.estado), Number(atual.processo.id)],
        );
        await audit(connection, req, "sugestao_desenvolvimento_regenerada", "Uma sugestão de desenvolvimento foi substituída por nova alternativa.", Number(atual.processo.id), { sugestaoId });
        await connection.commit();
        return res.json({ ok: true, sugestao: itemAtual });
      } catch (error) {
        try { await connection.rollback(); } catch {}
        throw error;
      }
    } catch (error) {
      return httpError(res, error, "Não foi possível gerar uma nova sugestão.");
    }
  },
);

programaIntegracaoPotencialRouter.post(
  "/api/programa-integracao/processos/:legacyId/sugestoes-desenvolvimento/:sugestaoId/inserir",
  requireAdmin,
  async (req, res) => {
    const connection = await getConnectionOr503(res); if (!connection) return;
    let tx = false;
    try {
      const legacyId = sanitizeLegacyId(req.params.legacyId);
      const sugestaoId = String(req.params.sugestaoId || "");
      await connection.beginTransaction(); tx = true;
      const ctx = await contexto(connection, legacyId, true);
      requireContextoSeguro(ctx);
      const pacote = ctx.estado?.teste?.sugestoesDesenvolvimento;
      const item = pacote?.itens?.find((x: any) => String(x.id) === sugestaoId);
      if (!item) throw Object.assign(new Error("Sugestão não encontrada."), { statusCode: 404 });
      if (item.status === "inserida" || Number(item.sessionId || 0) > 0) {
        throw Object.assign(new Error("Esta sugestão já foi inserida nas tarefas. Nenhuma duplicação foi feita."), { statusCode: 409 });
      }
      if (item.status === "descartada") {
        throw Object.assign(new Error("Esta sugestão foi descartada. Gere uma nova antes de inserir."), { statusCode: 409 });
      }
      const prazo = dataIsoValida(item.prazoSugerido);
      if (!prazo || prazo < todayIso()) {
        throw Object.assign(new Error("O prazo sugerido não é mais válido. Gere novamente esta sugestão."), { statusCode: 409 });
      }

      const [duplicada] = (await connection.execute(
        `SELECT id FROM mentoring_sessions
         WHERE alunoId=? AND COALESCE(cancelada,0)=0 AND customTaskTitle=?
         ORDER BY id DESC LIMIT 1`,
        [ctx.alunoId, String(item.titulo || "").trim()],
      )) as any;
      if (duplicada?.[0]) {
        throw Object.assign(new Error("Já existe uma tarefa ativa com este mesmo título para o aluno. Nenhuma duplicação foi feita."), { statusCode: 409 });
      }

      // Sugestao aprovada entra no mesmo fluxo de tarefa livre do ECO Lider,
      // usando a trilha atual do aluno e sem criar item artificial na biblioteca.
      const trilhaId = Number(ctx.aluno.trilhaId || 0) || null;
      const consultorId = await consultorParaAluno(connection, ctx.aluno);
      const sessaoContexto = await contextoNovaTarefa(ctx.alunoId);
      const numero = sessaoContexto.proximoNumero;
      const descricao = `Como fazer:\n${String(item.comoFazer || "").trim()}\n\nO que enviar para comprovar:\n${String(item.comprovacao || "").trim()}`;

      const sessionId = await inserirTarefa(connection, {
        aluno: ctx.aluno,
        consultorId,
        trilhaId,
        contratoNivelId: sessaoContexto.contratoNivelId,
        titulo: String(item.titulo || "").trim(),
        descricao,
        prazo,
        sessionNumber: numero,
      });

      item.status = "inserida";
      item.sessionId = sessionId;
      item.inseridaEm = new Date().toISOString();
      await connection.execute(
        "UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?",
        [JSON.stringify(ctx.estado), Number(ctx.processo.id)],
      );
      await audit(connection, req, "sugestao_desenvolvimento_inserida", "Sugestão de desenvolvimento inserida em Atividades Práticas.", Number(ctx.processo.id), { sugestaoId, sessionId, alunoId: ctx.alunoId, prazo });
      await connection.commit(); tx = false;
      await notificarAlunoSobreTarefas(ctx.alunoId, 1, String(item.titulo || "").trim());
      return res.json({ ok: true, sessionId, prazo });
    } catch (error) {
      if (tx) try { await connection.rollback(); } catch {}
      return httpError(res, error, "Não foi possível inserir a sugestão nas tarefas.");
    }
  },
);


programaIntegracaoPotencialRouter.post(
  "/api/programa-integracao/processos/:legacyId/tarefas-gestor/reverter",
  requireAdmin,
  async (req, res) => {
    const connection = await getConnectionOr503(res); if (!connection) return;
    let tx = false;
    try {
      const legacyId = sanitizeLegacyId(req.params.legacyId);
      await connection.beginTransaction(); tx = true;
      const ctx = await contexto(connection, legacyId, true);
      requireContextoSeguro(ctx);
      const registro = ctx.estado?.teste?.tarefasIntegracaoPadrao;
      if (!registro || Number(registro.alunoId || 0) !== ctx.alunoId) {
        throw Object.assign(new Error("Não existe um conjunto de tarefas padrão registrado para reversão."), { statusCode: 409 });
      }
      const ids = Object.values(registro.sessionIds || {}).map(Number).filter((id) => id > 0);
      if (ids.length !== 4) {
        throw Object.assign(new Error("O histórico das quatro tarefas está incompleto. A reversão automática foi bloqueada para evitar cancelar registros errados."), { statusCode: 409 });
      }
      const placeholders = ids.map(() => "?").join(",");
      const [rows] = (await connection.execute(
        `SELECT id,alunoId,evidenceLink,evidenceImageUrl,submittedAt,validatedAt,cancelada
         FROM mentoring_sessions
         WHERE id IN (${placeholders})
         FOR UPDATE`,
        ids,
      )) as any;
      if ((rows || []).length !== 4 || rows.some((row: any) => Number(row.alunoId) !== ctx.alunoId)) {
        throw Object.assign(new Error("As tarefas registradas não correspondem integralmente ao aluno atual. Nenhum registro foi alterado."), { statusCode: 409 });
      }
      if (rows.some((row: any) => row.evidenceLink || row.evidenceImageUrl || row.submittedAt || row.validatedAt)) {
        throw Object.assign(new Error("Uma ou mais tarefas já possuem evidência, entrega ou validação. A reversão automática foi bloqueada para preservar o histórico."), { statusCode: 409 });
      }
      await connection.execute(
        `UPDATE mentoring_sessions SET cancelada=1 WHERE id IN (${placeholders}) AND alunoId=?`,
        [...ids, ctx.alunoId],
      );
      ctx.estado.teste.tarefasIntegracaoPadrao = {
        ...registro,
        revertidasEm: new Date().toISOString(),
        revertidasPorUserId: Number((req as any).authenticatedUser?.id || 0) || null,
      };
      await connection.execute(
        "UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?",
        [JSON.stringify(ctx.estado), Number(ctx.processo.id)],
      );
      await audit(connection, req, "tarefas_gestor_revertidas", "As quatro tarefas padrão foram canceladas de forma reversível.", Number(ctx.processo.id), { alunoId: ctx.alunoId, sessionIds: ids });
      await connection.commit(); tx = false;
      return res.json({ ok: true, revertidas: 4 });
    } catch (error) {
      if (tx) try { await connection.rollback(); } catch {}
      return httpError(res, error, "Não foi possível reverter as tarefas padrão.");
    }
  },
);

programaIntegracaoPotencialRouter.post(
  "/api/programa-integracao/processos/:legacyId/sugestoes-desenvolvimento/:sugestaoId/reverter-insercao",
  requireAdmin,
  async (req, res) => {
    const connection = await getConnectionOr503(res); if (!connection) return;
    let tx = false;
    try {
      const legacyId = sanitizeLegacyId(req.params.legacyId);
      const sugestaoId = String(req.params.sugestaoId || "");
      await connection.beginTransaction(); tx = true;
      const ctx = await contexto(connection, legacyId, true);
      requireContextoSeguro(ctx);
      const pacote = ctx.estado?.teste?.sugestoesDesenvolvimento;
      const item = pacote?.itens?.find((x: any) => String(x.id) === sugestaoId);
      const sessionId = Number(item?.sessionId || 0);
      if (!item || item.status !== "inserida" || !sessionId) {
        throw Object.assign(new Error("Esta sugestão não possui uma inserção ativa para reverter."), { statusCode: 409 });
      }
      const [rows] = (await connection.execute(
        `SELECT id,alunoId,evidenceLink,evidenceImageUrl,submittedAt,validatedAt,cancelada
         FROM mentoring_sessions WHERE id=? LIMIT 1 FOR UPDATE`,
        [sessionId],
      )) as any;
      const sessao = rows?.[0];
      if (!sessao || Number(sessao.alunoId) !== ctx.alunoId || Number(sessao.cancelada || 0) === 1) {
        throw Object.assign(new Error("A tarefa vinculada não está ativa para este aluno. Nenhum registro foi alterado."), { statusCode: 409 });
      }
      if (sessao.evidenceLink || sessao.evidenceImageUrl || sessao.submittedAt || sessao.validatedAt) {
        throw Object.assign(new Error("A tarefa já possui evidência, entrega ou validação. A reversão automática foi bloqueada para preservar o histórico."), { statusCode: 409 });
      }
      await connection.execute(
        "UPDATE mentoring_sessions SET cancelada=1 WHERE id=? AND alunoId=?",
        [sessionId, ctx.alunoId],
      );
      item.status = "sugerida";
      item.sessionId = null;
      item.insercaoRevertidaEm = new Date().toISOString();
      await connection.execute(
        "UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?",
        [JSON.stringify(ctx.estado), Number(ctx.processo.id)],
      );
      await audit(connection, req, "sugestao_desenvolvimento_insercao_revertida", "Inserção da sugestão em Atividades Práticas revertida por cancelamento seguro.", Number(ctx.processo.id), { sugestaoId, sessionId, alunoId: ctx.alunoId });
      await connection.commit(); tx = false;
      return res.json({ ok: true });
    } catch (error) {
      if (tx) try { await connection.rollback(); } catch {}
      return httpError(res, error, "Não foi possível reverter a inserção desta sugestão.");
    }
  },
);
