import { Router, type NextFunction, type Request, type Response } from "express";
import {
  BEM_HISTORICO_CLUSTERS,
  BEM_MATRIZ_ATUAL_PUBLICADA_EM,
  BEM_MATRIZ_ATUAL_VERSAO,
  INTEGRACAO_CLUSTERS,
} from "@shared/integracaoAssessment";
import { PROGRAMA_INTEGRACAO_CATALOG } from "./programaIntegracaoCatalog";
import { getRawConnection } from "./db";
import mysql from "mysql2/promise";
import { sdk } from "./_core/sdk";
import {
  PROGRAMA_INTEGRACAO_ESCALAS,
  PROGRAMA_INTEGRACAO_QUESTION_INDEX,
  formKeyDoSlug,
  itemIdDoFormulario,
  type ProgramaIntegracaoFormKey,
} from "./programaIntegracaoDefinitions";

export const programaIntegracaoRouter = Router();

const FORM_NAMES: Record<ProgramaIntegracaoFormKey, string> = {
  controle: "Controle do Programa de Integração",
  bem: "Bem Acolhido em Nossa Unidade",
  pesquisa: "Pesquisa de Integração",
  aval: "Avaliação do Programa de Integração",
  pdi: "Acompanhamento do PDI",
};
const PROTO_PREFIX: Record<ProgramaIntegracaoFormKey, string> = {
  controle: "CTL", bem: "BEM", pesquisa: "PES", aval: "AVL", pdi: "PDI",
};
const SIM_BOA = 0.8;
const SIM_MIN = 0.4;
const MIN_TEXTO_LIVRE = 10;

function asJson<T = any>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}
function normTxt(value: unknown) {
  return String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function listaTextoMulti(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    return valor.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (valor && typeof valor === "object") {
    return Object.values(valor as Record<string, unknown>)
      .flatMap((item) => listaTextoMulti(item))
      .filter(Boolean);
  }
  const texto = String(valor || "").trim();
  if (!texto) return [];
  if (texto.startsWith("[") && texto.endsWith("]")) {
    try {
      const parsed = JSON.parse(texto);
      if (Array.isArray(parsed)) return listaTextoMulti(parsed);
    } catch {}
  }
  return texto
    .split(/[\n,;|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function detectarMatrizBem(row: any): "historica" | "atual" {
  const versao = Number(row?.formVersion || 0);
  if (versao >= BEM_MATRIZ_ATUAL_VERSAO) return "atual";

  // Importações com versão 1 representam o acervo histórico e não devem ser
  // reclassificadas só porque foram tecnicamente importadas em uma data recente.
  if (versao === 1 && String(row?.source || "") === "importacao") return "historica";

  // A primeira publicação da nova lista ocorreu antes de o formVersion ser
  // elevado para 2. Para esse pequeno intervalo de respostas públicas, a data
  // funciona como fallback sem tocar no dado original armazenado.
  const submittedAt = row?.submittedAt ? new Date(row.submittedAt).getTime() : 0;
  const corte = new Date(BEM_MATRIZ_ATUAL_PUBLICADA_EM).getTime();
  if (submittedAt && Number.isFinite(submittedAt) && submittedAt >= corte) return "atual";

  return "historica";
}

function normalizarPrioridades(clustersBase: any[]) {
  const maiorIndice = Math.max(0, ...clustersBase.map((item) => Number(item.indice || 0)));
  return clustersBase.map((item) => {
    const prioridade = maiorIndice > 0 ? (Number(item.indice || 0) / maiorIndice) * 100 : 0;
    const nivel = prioridade <= 0
      ? "Não priorizada"
      : prioridade >= 75
        ? "Alta prioridade"
        : prioridade >= 40
          ? "Média prioridade"
          : "Baixa prioridade";
    return { ...item, prioridade, nivel };
  });
}

function calcularExpectativaGestorBem(row: any | null) {
  if (!row) {
    return {
      temRespostaBem: false,
      matriz: null,
      descritoresReconhecidos: 0,
      compatibilidade: null,
      motivo: "Ainda não há informações suficientes para comparar o perfil do colaborador com a expectativa do gestor.",
      clusters: [],
    };
  }

  const answers = asJson<Record<string, any>>(row.answers, {});
  const selecionadosOriginais = listaTextoMulti(
    answers.bem_caracteristicas ??
    answers["11"] ??
    answers.field_11 ??
    answers.caracteristicas
  );
  const selecionadosNorm = new Set(selecionadosOriginais.map(normTxt));
  const matriz = detectarMatrizBem(row);

  if (matriz === "historica") {
    const clustersBase = BEM_HISTORICO_CLUSTERS.map((cluster) => {
      const reconhecidos = Object.entries(cluster.pesos)
        .filter(([palavra]) => selecionadosNorm.has(normTxt(palavra)));
      const pesoSelecionado = reconhecidos.reduce((soma, [, peso]) => soma + Number(peso), 0);
      const indice = cluster.pesoTotalPossivel > 0
        ? (pesoSelecionado / cluster.pesoTotalPossivel) * 100
        : 0;
      return {
        key: cluster.key,
        nome: cluster.nome,
        selecionados: reconhecidos.map(([palavra]) => palavra),
        quantidadeSelecionada: reconhecidos.length,
        pesoSelecionado,
        totalDescritores: cluster.pesoTotalPossivel,
        indice,
      };
    });

    const reconhecidosUnicos = new Set(
      clustersBase.flatMap((cluster) => cluster.selecionados.map(normTxt)),
    ).size;
    const clusters = normalizarPrioridades(clustersBase);

    return {
      temRespostaBem: true,
      matriz,
      descritoresReconhecidos: reconhecidosUnicos,
      compatibilidade: null,
      motivo: reconhecidosUnicos
        ? null
        : "Ainda não há informações suficientes para comparar o perfil do colaborador com a expectativa do gestor.",
      clusters,
    };
  }

  const clustersBase = INTEGRACAO_CLUSTERS.map((cluster) => {
    const escolhidos = cluster.descritoresGestor.filter((item) => selecionadosNorm.has(normTxt(item)));
    const total = cluster.descritoresGestor.length;
    const indice = total > 0 ? (escolhidos.length / total) * 100 : 0;
    return {
      key: cluster.key,
      nome: cluster.nome,
      selecionados: escolhidos,
      quantidadeSelecionada: escolhidos.length,
      pesoSelecionado: escolhidos.length,
      totalDescritores: total,
      indice,
    };
  });

  const reconhecidos = clustersBase.reduce((soma, item) => soma + item.quantidadeSelecionada, 0);
  const clusters = normalizarPrioridades(clustersBase);

  return {
    temRespostaBem: true,
    matriz,
    descritoresReconhecidos: reconhecidos,
    compatibilidade: null,
    motivo: reconhecidos
      ? null
      : "Ainda não há informações suficientes para comparar o perfil do colaborador com a expectativa do gestor.",
    clusters,
  };
}

function combinarExpectativaComPerfil(expectativa: any, autoClusters: any[]) {
  const autoPorKey = new Map((autoClusters || []).map((item: any) => [item.key, item]));
  const clusters = (expectativa?.clusters || []).map((item: any) => ({
    ...item,
    perfilColaborador: autoPorKey.get(item.key)?.percentual ?? null,
  }));

  if (!expectativa?.descritoresReconhecidos) {
    return { ...expectativa, clusters, compatibilidade: null };
  }

  const priorizados = clusters.filter((item: any) => Number(item.prioridade || 0) > 0);
  const faltantes = priorizados.filter((item: any) => {
    const perfil = item.perfilColaborador == null ? null : Number(item.perfilColaborador);
    return perfil == null || !Number.isFinite(perfil);
  });

  if (faltantes.length) {
    return {
      ...expectativa,
      clusters,
      compatibilidade: null,
      motivo: "A autoavaliação ainda não possui informações suficientes em todos os clusters priorizados pelo gestor para calcular a compatibilidade.",
    };
  }

  const somaPesos = priorizados.reduce((soma: number, item: any) => soma + Number(item.prioridade || 0), 0);
  const somaPonderada = priorizados.reduce(
    (soma: number, item: any) => soma + Number(item.perfilColaborador) * Number(item.prioridade || 0),
    0,
  );

  return {
    ...expectativa,
    clusters,
    compatibilidade: somaPesos > 0 ? somaPonderada / somaPesos : null,
    motivo: somaPesos > 0
      ? null
      : "Ainda não há informações suficientes para comparar o perfil do colaborador com a expectativa do gestor.",
  };
}

async function perfisAssessmentAlunos(connection: any, alunoIds: number[]) {
  const ids = [...new Set(alunoIds.filter((id) => Number.isInteger(id) && id > 0))];
  const saida: Record<string, any> = {};
  for (const id of ids) {
    saida[String(id)] = { disc: null, autoavaliacaoClusters: [] };
  }
  if (!ids.length) return saida;

  const placeholders = ids.map(() => "?").join(",");
  const [discRows] = (await connection.execute(
    `SELECT id,alunoId,scoreD,scoreI,scoreS,scoreC,perfilPredominante,perfilSecundario,ciclo,completedAt
     FROM disc_resultados
     WHERE alunoId IN (${placeholders})
     ORDER BY alunoId ASC,ciclo DESC,completedAt DESC,id DESC`,
    ids,
  )) as any;

  const discVisto = new Set<number>();
  for (const row of discRows || []) {
    const alunoId = Number(row.alunoId || 0);
    if (!alunoId || discVisto.has(alunoId) || !saida[String(alunoId)]) continue;
    discVisto.add(alunoId);
    saida[String(alunoId)].disc = {
      scoreD: Number(row.scoreD),
      scoreI: Number(row.scoreI),
      scoreS: Number(row.scoreS),
      scoreC: Number(row.scoreC),
      perfilPredominante: row.perfilPredominante || null,
      perfilSecundario: row.perfilSecundario || null,
      ciclo: Number(row.ciclo || 0),
      completedAt: row.completedAt ? new Date(row.completedAt).toISOString() : null,
    };
  }

  const [autoRows] = (await connection.execute(
    `SELECT ap.id,ap.alunoId,ap.competenciaId,c.nome AS competenciaNome,ap.nota,ap.createdAt
     FROM autopercepcoes_competencias ap
     LEFT JOIN competencias c ON c.id=ap.competenciaId
     WHERE ap.alunoId IN (${placeholders})
     ORDER BY ap.alunoId ASC,ap.createdAt DESC,ap.id DESC`,
    ids,
  )) as any;

  const ultimas = new Map<string, any>();
  for (const row of autoRows || []) {
    const alunoId = Number(row.alunoId || 0);
    const competenciaId = Number(row.competenciaId || 0);
    const chave = `${alunoId}:${competenciaId}`;
    if (alunoId && competenciaId && !ultimas.has(chave)) ultimas.set(chave, row);
  }

  const porAluno = new Map<number, any[]>();
  for (const row of ultimas.values()) {
    const alunoId = Number(row.alunoId || 0);
    const lista = porAluno.get(alunoId) || [];
    lista.push(row);
    porAluno.set(alunoId, lista);
  }

  for (const alunoId of ids) {
    const auto = porAluno.get(alunoId) || [];
    saida[String(alunoId)].autoavaliacaoClusters = INTEGRACAO_CLUSTERS.map((cluster) => {
      const nomesEsperados = new Set(cluster.competencias.map(normTxt));
      const encontrados = auto.filter((item) => nomesEsperados.has(normTxt(item.competenciaNome)));
      const notas = encontrados
        .map((item) => Number(item.nota))
        .filter((nota) => Number.isFinite(nota) && nota >= 1 && nota <= 5);
      const media = notas.length ? notas.reduce((soma, nota) => soma + nota, 0) / notas.length : null;
      return {
        key: cluster.key,
        nome: cluster.nome,
        competencias: cluster.competencias,
        competenciasEncontradas: encontrados.map((item) => String(item.competenciaNome || "")),
        totalCompetencias: cluster.competencias.length,
        totalAvaliadas: notas.length,
        media,
        percentual: media == null ? null : (media / 5) * 100,
      };
    });
  }

  return saida;
}

function bigr(s: string) { const out: string[] = []; for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2)); return out; }
function dice(a: string, b: string) {
  if (!a || !b) return 0; if (a === b) return 1; if (a.length < 2 || b.length < 2) return 0;
  const A = bigr(a), B = bigr(b), counts: Record<string, number> = {}; let hits = 0;
  A.forEach(x => { counts[x] = (counts[x] || 0) + 1; });
  B.forEach(x => { if ((counts[x] || 0) > 0) { counts[x]--; hits++; } });
  return (2 * hits) / (A.length + B.length);
}
function simNome(a0: unknown, b0: unknown) {
  const a = normTxt(a0), b = normTxt(b0); if (!a || !b) return 0; if (a === b) return 1;
  const d = dice(a, b), ta = a.split(" ").filter(x => x.length > 2), tb = b.split(" ").filter(x => x.length > 2);
  if (!ta.length || !tb.length) return d;
  let soma = 0;
  ta.forEach(x => { let best = 0; tb.forEach(y => { const s = x === y ? 1 : dice(x, y); if (s > best) best = s; }); if (best > 0.7) soma += best; });
  const cob = soma / Math.max(ta.length, tb.length), pri = ta[0] === tb[0] ? 1 : dice(ta[0], tb[0]);
  return Math.max(d, cob * 0.7 + pri * 0.3);
}
function todayIso() { return new Date().toISOString().slice(0, 10); }
function sqlDateToIso(value: unknown): string {
  if (value == null || value === "") return "";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    const ano = value.getFullYear();
    const mes = String(value.getMonth() + 1).padStart(2, "0");
    const dia = String(value.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  const texto = String(value).trim();
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const data = new Date(texto);
  if (Number.isNaN(data.getTime())) return "";
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}
function nowBr() {
  const n = new Date();
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(n).replace(",", "");
}
function sanitizeLegacyId(value: unknown) { return String(value ?? "").trim().slice(0, 100); }

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Acesso restrito ao administrador." });
    (req as any).authenticatedUser = user;
    next();
  } catch { return res.status(401).json({ error: "Sessão inválida ou expirada." }); }
}

async function requireAcompanharIntegracao(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) return res.status(401).json({ error: "Sessão inválida ou expirada." });
    if (user.role === "admin") {
      (req as any).authenticatedUser = user;
      (req as any).integracaoScopeAll = true;
      return next();
    }
    if (user.role !== "manager") {
      return res.status(403).json({ error: "Acesso restrito ao Gestor/UGP." });
    }

    const connection = await getConnectionOr503(res);
    if (!connection) return;
    const [rows] = (await connection.execute(
      "SELECT permissions FROM admin_page_permissions WHERE userId=? LIMIT 1",
      [Number((user as any).id || 0)],
    )) as any;
    let permissions: string[] = [];
    try {
      const raw = rows?.[0]?.permissions;
      permissions = Array.isArray(raw) ? raw : JSON.parse(String(raw || "[]"));
    } catch { permissions = []; }

    if (!permissions.includes("scope:manager:special")) {
      return res.status(403).json({ error: "Acompanhar Integração está disponível somente para Gerente Especial autorizado." });
    }
    if (!permissions.includes("/gestor/integracao")) {
      return res.status(403).json({ error: "Acompanhar Integração não está liberado para este Gerente Especial." });
    }

    (req as any).authenticatedUser = user;
    (req as any).integracaoScopeAll = permissions.includes("scope:integracao:all");
    next();
  } catch {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }
}
let programaIntegracaoFallbackConnection: mysql.Connection | null = null;

async function conexaoProgramaIntegracaoSaudavel(connection: any): Promise<boolean> {
  if (!connection) return false;
  try {
    await connection.execute("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

async function getConnectionOr503(res: Response) {
  const connection = await getRawConnection();
  if (await conexaoProgramaIntegracaoSaudavel(connection)) return connection;

  if (programaIntegracaoFallbackConnection) {
    if (await conexaoProgramaIntegracaoSaudavel(programaIntegracaoFallbackConnection)) {
      return programaIntegracaoFallbackConnection;
    }
    try { await programaIntegracaoFallbackConnection.end(); } catch {}
    programaIntegracaoFallbackConnection = null;
  }

  try {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ausente");
    programaIntegracaoFallbackConnection = await mysql.createConnection(process.env.DATABASE_URL);
    if (await conexaoProgramaIntegracaoSaudavel(programaIntegracaoFallbackConnection)) {
      console.warn("[ProgramaIntegracao] Conexão SQL bruta global indisponível; usando conexão própria de contingência do módulo.");
      return programaIntegracaoFallbackConnection;
    }
  } catch (error) {
    console.error("[ProgramaIntegracao] Falha ao restabelecer conexão SQL do módulo:", error);
    programaIntegracaoFallbackConnection = null;
  }

  res.status(503).json({ error: "Banco de dados indisponível para o Programa de Integração." });
  return null;
}
async function audit(connection: any, req: Request | null, acao: string, detalhe: string, processoId?: number | null, respostaId?: number | null, metadata?: any) {
  try {
    const userId = req ? Number((req as any).authenticatedUser?.id || 0) || null : null;
    await connection.execute(
      `INSERT INTO programa_integracao_auditoria (processoId,respostaId,userId,acao,detalhe,metadata) VALUES (?,?,?,?,?,?)`,
      [processoId ?? null, respostaId ?? null, userId, acao, detalhe, metadata == null ? null : JSON.stringify(metadata)]
    );
  } catch (error) { console.warn("[ProgramaIntegracao] Falha ao registrar auditoria:", error); }
}

function responseToLegacy(row: any) {
  const answers = asJson<Record<string, any>>(row.answers, {});
  const qmap = PROGRAMA_INTEGRACAO_QUESTION_INDEX[row.formKey as ProgramaIntegracaoFormKey] || {};
  const c: Array<[number, string]> = [];
  Object.entries(answers).forEach(([code, value]) => {
    const idx = qmap[code]; if (idx != null && value != null && String(value).trim() !== "") c.push([idx, String(value)]);
  });
  return {
    rid: row.legacyRid || `db${row.id}`,
    protocolo: row.protocolo || "",
    form: row.formKey,
    ciclo: Number(row.ciclo || 0), papel: row.papel || "", quando: row.quandoOriginal || "",
    em: row.emOriginal || (row.submittedAt ? new Date(row.submittedAt).toISOString().slice(0, 10) : ""),
    itid: row.itemId || "", nomeOrig: row.nomeOrig || row.nomeColaborador || "", avaliador: row.avaliador || row.respondentName || "",
    c, media: row.media == null ? null : Number(row.media), alertas: asJson(row.alertas, []),
    source: row.source || "publico", status: row.statusResposta || "valido", formVersion: Number(row.formVersion || 1),
    processId: row.processoLegacyId || "", respondentName: row.respondentName || "", respondentEmail: row.respondentEmail || "",
    submittedAt: row.submittedAt ? new Date(row.submittedAt).toISOString() : "", answers,
  };
}
function pendingToLegacy(row: any) {
  return {
    id: row.legacyRid || `db${row.id}`, protocolo: row.protocolo || "", formKey: row.formKey,
    cycle: Number(row.ciclo || 0), role: row.papel || "", nomeColaborador: row.nomeColaborador || "",
    unidade: row.unidade || "", dataInicio: sqlDateToIso(row.dataInicio),
    emailColaborador: row.emailColaborador || "", respondentName: row.respondentName || "",
    answers: asJson(row.answers, {}), motivo: row.motivoPendencia || "ambiguo", candidatos: asJson(row.candidatos, []),
    submittedAt: row.submittedAt ? new Date(row.submittedAt).toISOString() : "",
    erroRegistro: row.statusResposta === "registro_falhou" ? "Não foi possível registrar automaticamente; revise a resposta." : undefined,
  };
}


function diasEntreIso(inicio: string, fim: string): number {
  const a = new Date(`${inicio}T12:00:00`);
  const b = new Date(`${fim}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

function addDiasIso(iso: string, dias: number): string {
  const data = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(data.getTime())) return "";
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

function respostaCompacta(row: any) {
  const answers = asJson<Record<string, any>>(row.answers, {});
  const qmap = PROGRAMA_INTEGRACAO_QUESTION_INDEX[row.formKey as ProgramaIntegracaoFormKey] || {};
  const c: Array<[number, string]> = [];
  Object.entries(answers).forEach(([code, value]) => {
    const idx = qmap[code];
    if (idx != null && value != null && String(value).trim() !== "") c.push([idx, String(value)]);
  });
  return {
    form: row.formKey,
    ciclo: Number(row.ciclo || 0),
    papel: row.papel || "",
    c,
  };
}

function temRespostaCiclo(respostas: any[], form: string, papel: string, ciclo: number): boolean {
  return respostas.some((r) =>
    r.form === form &&
    Number(r.ciclo || 0) === ciclo &&
    (
      // A Pesquisa de Integração é do colaborador, mas historicamente/publicamente
      // é salva sem papel. Por isso a existência da resposta deve ser validada
      // pelo formulário + alinhamento, sem exigir "Colaborador" em papel.
      form === "pesquisa" ||
      String(r.papel || "") === papel
    )
  );
}

function chaveGerenteAcompanhamento(nome: unknown, email: unknown): string {
  const emailNormalizado = String(email || "").trim().toLowerCase();
  if (emailNormalizado) return `email:${emailNormalizado}`;
  const nomeNormalizado = normTxt(nome);
  return nomeNormalizado ? `nome:${nomeNormalizado}` : "";
}

programaIntegracaoRouter.get("/api/programa-integracao/bootstrap", requireAdmin, async (req, res) => {
  try {
    const connection = await getConnectionOr503(res); if (!connection) return;
    const [configRows] = (await connection.execute(`SELECT chave, valor FROM programa_integracao_config WHERE chave='geral'`)) as any;
    const config = configRows?.[0] ? asJson(configRows[0].valor, {}) : {};
    const [processRows] = (await connection.execute(`SELECT * FROM programa_integracao_processos WHERE situacao <> 'removido' ORDER BY ordem,id`)) as any;
    const [responseRows] = (await connection.execute(`SELECT r.*, p.legacyId AS processoLegacyId FROM programa_integracao_respostas r LEFT JOIN programa_integracao_processos p ON p.id=r.processoId WHERE r.statusVinculo IN ('vinculada','pendente') ORDER BY r.id`)) as any;
    const processos: Record<string, any> = {};
    (processRows || []).forEach((row: any) => {
      const id = row.legacyId || `p${row.id}`;
      const estado = asJson<Record<string, any>>(row.estado, {});
      processos[id] = { ...estado,
        nome: row.nome || "", cpf: row.cpf || "", nasc: sqlDateToIso(row.nasc),
        email: row.email || "", emailCorporativo: row.emailCorporativo || "", tel: row.tel || "", cargo: row.cargo || "", unidade: row.unidade || "",
        tipo: row.tipo || "Onboarding", inicio: sqlDateToIso(row.inicio), part: row.participacao || "Presencial", situacao: row.situacao || "ativo",
        gestor: row.gestor || "", gestorEmail: row.gestorEmail || "", gestorTel: row.gestorTel || "", anjo: row.anjo || "", anjoEmail: row.anjoEmail || "",
        consultora: row.consultora || "", mentorId: row.mentorLegacyId || "", ugp: row.ugp || "", horarios: row.horarios || "",
        statusPdi: row.statusPdi || "", pendencias: row.pendencias || "", statusCursos: row.statusCursos || "", consideracoes: row.consideracoes || "", notas: row.notas || "", cor: row.cor || "",
        feito: estado.feito || {}, alin: estado.alin || {}, bem: estado.bem || {}, teste: estado.teste || {}, resp: [],
      };
    });
    const pendentes: any[] = [];
    (responseRows || []).forEach((row: any) => {
      if (row.statusVinculo === "pendente") pendentes.push(pendingToLegacy(row));
      else if (row.processoLegacyId && processos[row.processoLegacyId]) processos[row.processoLegacyId].resp.push(responseToLegacy(row));
    });
    const ordemBanco = (processRows || []).map((r: any) => r.legacyId || `p${r.id}`);
    const ordemConfig = Array.isArray(config.ordem) ? config.ordem.filter((id: string) => processos[id]) : [];
    ordemBanco.forEach((id: string) => { if (!ordemConfig.includes(id)) ordemConfig.push(id); });
    config.ordem = ordemConfig;
    config.respostasPendentes = pendentes;
    res.setHeader("Cache-Control", "no-store");
    return res.json({ ok: true, state: { config, processos } });
  } catch (error) {
    console.error("[ProgramaIntegracao] bootstrap:", error);
    return res.status(500).json({ error: "Não foi possível carregar o Programa de Integração." });
  }
});



programaIntegracaoRouter.get("/api/programa-integracao/gestor/acompanhamento", requireAcompanharIntegracao, async (req, res) => {
  try {
    const connection = await getConnectionOr503(res); if (!connection) return;
    const user = (req as any).authenticatedUser || {};
    const scopeAll = Boolean((req as any).integracaoScopeAll);
    const nomeGerente = normTxt(user.name || "");
    const emailGerente = String(user.email || "").trim().toLowerCase();

    // Regra multiempresa: gerente sempre precisa estar vinculado a uma empresa.
    // managedProgramId vem do registro de consultor; programId é o vínculo direto do usuário.
    const empresaId = Number(user.managedProgramId ?? user.programId ?? 0) || 0;
    if (user.role === "manager" && !empresaId) {
      return res.status(403).json({ error: "Este gerente não possui empresa vinculada." });
    }

    const [processRows] = (await connection.execute(
      `SELECT id,legacyId,alunoId,nome,email,cpf,cargo,unidade,inicio,situacao,gestor,gestorEmail,anjo,estado
       FROM programa_integracao_processos
       WHERE situacao='ativo' AND tipo='Onboarding'
       ORDER BY ordem,id`,
    )) as any;

    // No Admin, permitir alternar entre a visão UGP/RH (todos) e a visão exata
    // de cada gerente, usando os vínculos já existentes nos processos ativos.
    const gestoresMap = new Map<string, { key: string; nome: string; email: string; colaboradores: number }>();
    for (const row of processRows || []) {
      const key = chaveGerenteAcompanhamento(row.gestor, row.gestorEmail);
      if (!key) continue;
      const atual = gestoresMap.get(key);
      if (atual) {
        atual.colaboradores += 1;
      } else {
        gestoresMap.set(key, {
          key,
          nome: String(row.gestor || "").trim() || "Gerente sem nome",
          email: String(row.gestorEmail || "").trim().toLowerCase(),
          colaboradores: 1,
        });
      }
    }
    const gestoresDisponiveis = Array.from(gestoresMap.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }),
    );
    const gestorViewKey = user.role === "admin" ? String(req.query.gestor || "").trim() : "";
    const gestorSelecionado = user.role === "admin" && gestorViewKey && gestorViewKey !== "all"
      ? gestoresMap.get(gestorViewKey) || null
      : null;
    if (user.role === "admin" && gestorViewKey && gestorViewKey !== "all" && !gestorSelecionado) {
      return res.status(400).json({ error: "O gerente selecionado não foi encontrado entre os processos ativos." });
    }

    // A empresa é resolvida usando o cadastro ECO Líderes (alunos.programId),
    // sem confiar apenas no nome do gestor e sem abrir dados globais para UGP/RH.
    const alunosEmpresa = user.role === "admin"
      ? []
      : await listarAlunosAtivosDaEmpresa(connection, empresaId);
    const alunosEmpresaPorId = new Map(alunosEmpresa.map((a: any) => [Number(a.id), a]));

    function resolverAlunoDaEmpresa(row: any): any | null {
      if (user.role === "admin") return { id: Number(row.alunoId || 0) || null };

      const estado = asJson<Record<string, any>>(row.estado, {});
      const empresaTesteId = Number(estado?.teste?.empresaProgramId || 0);
      if (scopeAll && empresaTesteId > 0 && empresaTesteId === empresaId) {
        // Processos fictícios/demonstração podem não ter aluno real na EcoLíder.
        // Para a visão UGP/RH, aceitar somente quando a empresa do teste estiver
        // explicitamente vinculada e coincidir com a empresa do usuário.
        return { id: null, programId: empresaId, demoEmpresa: true };
      }

      const alunoIdDireto = Number(row.alunoId || 0);
      if (alunoIdDireto && alunosEmpresaPorId.has(alunoIdDireto)) {
        return alunosEmpresaPorId.get(alunoIdDireto) || null;
      }

      const ecoAlunoId = Number(estado?.teste?.ecoAlunoId || 0);
      if (ecoAlunoId && alunosEmpresaPorId.has(ecoAlunoId)) {
        return alunosEmpresaPorId.get(ecoAlunoId) || null;
      }

      const match = escolherCorrespondenciaEcoSegura(
        String(row.nome || ""),
        String(row.email || ""),
        alunosEmpresa,
      );
      return match.status === "automatico_seguro" ? match.aluno : null;
    }

    const alunoEmpresaPorProcesso = new Map<number, any>();
    const permitidos = (processRows || []).filter((row: any) => {
      if (user.role === "admin") {
        if (!gestorSelecionado) return true;
        return chaveGerenteAcompanhamento(row.gestor, row.gestorEmail) === gestorSelecionado.key;
      }

      const alunoEmpresa = resolverAlunoDaEmpresa(row);
      if (!alunoEmpresa) return false; // fail closed: sem vínculo seguro com a empresa, não exibe.
      alunoEmpresaPorProcesso.set(Number(row.id), alunoEmpresa);

      if (scopeAll) return true; // UGP/RH: todos, porém somente da própria empresa.

      const gestorNome = normTxt(row.gestor || "");
      const gestorEmail = String(row.gestorEmail || "").trim().toLowerCase();
      return Boolean(
        (emailGerente && gestorEmail && emailGerente === gestorEmail) ||
        (nomeGerente && gestorNome && nomeGerente === gestorNome)
      );
    });

    if (!permitidos.length) {
      return res.json({
        ok: true,
        scope: user.role === "admin" ? (gestorSelecionado ? "gestor" : "all") : (scopeAll ? "all" : "gestor"),
        adminView: user.role === "admin",
        gestoresDisponiveis: user.role === "admin" ? gestoresDisponiveis : [],
        gestorSelecionado,
        empresaId: user.role === "admin" ? null : empresaId,
        atualizadoEm: new Date().toISOString(),
        colaboradores: [],
      });
    }

    const ids = permitidos.map((r: any) => Number(r.id));
    const placeholders = ids.map(() => "?").join(",");
    const [responseRows] = (await connection.execute(
      `SELECT r.*, p.legacyId AS processoLegacyId
       FROM programa_integracao_respostas r
       INNER JOIN programa_integracao_processos p ON p.id=r.processoId
       WHERE r.processoId IN (${placeholders})
         AND r.statusVinculo='vinculada'
         AND r.statusResposta<>'excluida'
       ORDER BY r.processoId,r.ciclo,r.id`,
      ids,
    )) as any;

    const respostasPorProcesso = new Map<number, any[]>();
    const respostasRawPorProcesso = new Map<number, any[]>();
    for (const row of responseRows || []) {
      const pid = Number(row.processoId);
      const arr = respostasPorProcesso.get(pid) || [];
      arr.push(respostaCompacta(row));
      respostasPorProcesso.set(pid, arr);

      const rawArr = respostasRawPorProcesso.get(pid) || [];
      rawArr.push(row);
      respostasRawPorProcesso.set(pid, rawArr);
    }

    const alunosEco = await listarAlunosEcoLiderDisponiveis(connection);
    const alunosEcoPermitidos = user.role === "admin"
      ? alunosEco
      : alunosEco.filter((a: any) => Number(a.programId || 0) === empresaId);
    const ecoIds: number[] = [];
    const alunoEcoPorProcesso = new Map<number, number>();

    for (const row of permitidos) {
      const pid = Number(row.id);
      const alunoEmpresa = alunoEmpresaPorProcesso.get(pid);
      let ecoId = Number(alunoEmpresa?.id || 0);

      if (!ecoId && user.role === "admin") {
        const estado = asJson<Record<string, any>>(row.estado, {});
        ecoId = Number(estado?.teste?.ecoAlunoId || row.alunoId || 0);
        if (!ecoId) {
          const match = escolherCorrespondenciaEcoSegura(String(row.nome || ""), String(row.email || ""), alunosEcoPermitidos);
          if (match.status === "automatico_seguro" && match.aluno?.id) ecoId = Number(match.aluno.id);
        }
      }

      // Status de PDI/Compliance só consulta IDs que também pertencem ao escopo da empresa.
      if (ecoId > 0 && (user.role === "admin" || alunosEcoPermitidos.some((a: any) => Number(a.id) === ecoId))) {
        ecoIds.push(ecoId);
        alunoEcoPorProcesso.set(pid, ecoId);
      }
    }
    const ecoStatus = await statusEcoLiderAlunos(connection, ecoIds);
    const perfisAssessment = await perfisAssessmentAlunos(connection, ecoIds);
    const hoje = todayIso();

    const colaboradores = permitidos.map((row: any) => {
      const estado = asJson<Record<string, any>>(row.estado, {});
      const respostas = respostasPorProcesso.get(Number(row.id)) || [];
      const alin = estado.alin || {};
      const alinhamentosFeitos = [1,2,3,4].filter((n) => {
        const a = alin[String(n)] ?? alin[n];
        return Boolean(a?.realizado);
      }).length;

      const formulariosPendentes: any[] = [];
      const feito = estado.feito && typeof estado.feito === "object" ? estado.feito : {};
      const solicitacoesPorCiclo: Record<number, Record<"Gestor" | "Anjo" | "Colaborador", string>> = {
        1: { Gestor: "pos1-05", Anjo: "pos1-07", Colaborador: "pos1-04" },
        2: { Gestor: "pos2-05", Anjo: "pos2-07", Colaborador: "pos2-04" },
        3: { Gestor: "pos3-03", Anjo: "pos3-05", Colaborador: "pos3-02" },
        4: { Gestor: "pos4-04", Anjo: "pos4-06", Colaborador: "pos4-03" },
      };

      [1,2,3,4].forEach((ciclo) => {
        const esperados = [
          { papel: "Gestor" as const, form: "aval", formulario: "Avaliação do Programa de Integração" },
          { papel: "Anjo" as const, form: "aval", formulario: "Avaliação do Programa de Integração" },
          { papel: "Colaborador" as const, form: "pesquisa", formulario: "Pesquisa de Integração" },
        ];

        esperados.forEach((item) => {
          const itemSolicitacao = solicitacoesPorCiclo[ciclo]?.[item.papel];
          const fichaSolicitacao = itemSolicitacao && feito[itemSolicitacao] && typeof feito[itemSolicitacao] === "object"
            ? feito[itemSolicitacao]
            : null;

          // Só vira pendência depois que a solicitação correspondente foi efetivamente enviada.
          // O alinhamento estar marcado/agendado, sozinho, não cria cobrança.
          if (!fichaSolicitacao || String(fichaSolicitacao.s || "") !== "ok") return;

          if (!temRespostaCiclo(respostas, item.form, item.papel, ciclo)) {
            const dataSolicitacao = String(fichaSolicitacao.d || "").slice(0,10);
            const prazo = /^\d{4}-\d{2}-\d{2}$/.test(dataSolicitacao)
              ? addDiasIso(dataSolicitacao, 2)
              : "";
            const cycleValue = item.form === "pesquisa"
              ? ({ 1: "15", 2: "45", 3: "75", 4: "150" } as Record<number, string>)[ciclo] || String(ciclo)
              : String(ciclo);
            formulariosPendentes.push({
              ciclo,
              formKey: item.form,
              cycleValue,
              papel: item.papel,
              formulario: item.formulario,
              prazo,
              solicitadoEm: dataSolicitacao || null,
              atrasado: Boolean(prazo && prazo < hoje),
            });
          }
        });
      });

      const ecoId = alunoEcoPorProcesso.get(Number(row.id));
      const andamento = ecoId ? ecoStatus[String(ecoId)] : null;
      const perfilAssessment = ecoId ? perfisAssessment[String(ecoId)] : null;
      const rawRespostas = respostasRawPorProcesso.get(Number(row.id)) || [];
      const ultimaRespostaBem = rawRespostas
        .filter((item: any) => item.formKey === "bem")
        .slice(-1)[0] || null;
      const expectativaGestor = combinarExpectativaComPerfil(
        calcularExpectativaGestorBem(ultimaRespostaBem),
        perfilAssessment?.autoavaliacaoClusters || [],
      );
      const inicio = sqlDateToIso(row.inicio);
      const diaRaw = inicio ? diasEntreIso(inicio, hoje) + 1 : 0;
      const dia = Math.max(0, Math.min(150, diaRaw));

      return {
        id: row.legacyId || `p${row.id}`,
        nome: row.nome || "",
        cargo: row.cargo || "",
        unidade: row.unidade || "",
        inicio,
        dia,
        totalDias: 150,
        gestor: row.gestor || "",
        anjo: row.anjo || "",
        alinhamentosFeitos,
        alinhamentosTotal: 4,
        jornadaCompliance: andamento?.jornadaCompliance || { total: 0, concluidas: 0, percentual: null },
        pdi: andamento?.pdi || { total: 0, concluidas: 0, percentual: null },
        acessouEcoLider: andamento?.acessouEcoLider ?? null,
        ultimaEntradaEcoLider: andamento?.ultimaEntradaEcoLider || null,
        assessmentPotencialConcluido: andamento?.assessmentPotencialConcluido ?? null,
        assessmentPotencialConcluidoEm: andamento?.assessmentPotencialConcluidoEm || null,
        perfilAssessment: {
          alunoEcoId: ecoId || null,
          disc: perfilAssessment?.disc || null,
          autoavaliacaoClusters: perfilAssessment?.autoavaliacaoClusters || [],
          expectativaGestor,
        },
        respostas: respostas.filter((r) =>
          (r.form === "aval" && (r.papel === "Gestor" || r.papel === "Anjo")) ||
          r.form === "pesquisa"
        ),
        formulariosPendentes,
      };
    });

    res.setHeader("Cache-Control", "no-store");
    return res.json({
      ok: true,
      scope: user.role === "admin" ? (gestorSelecionado ? "gestor" : "all") : (scopeAll ? "all" : "gestor"),
      adminView: user.role === "admin",
      gestoresDisponiveis: user.role === "admin" ? gestoresDisponiveis : [],
      gestorSelecionado,
      empresaId: user.role === "admin" ? null : empresaId,
      atualizadoEm: new Date().toISOString(),
      colaboradores,
    });
  } catch (error) {
    console.error("[ProgramaIntegracao] acompanhamento gestor:", error);
    return res.status(500).json({ error: "Não foi possível carregar o acompanhamento da Integração." });
  }
});

const PARTICULAS_NOME_ECO = new Set(["de", "da", "do", "das", "dos", "e"]);

function nomeCanonicoEco(value: unknown): string {
  return normTxt(value)
    .split(" ")
    .filter((token) => token && !PARTICULAS_NOME_ECO.has(token))
    .join(" ");
}

function tokensNomeEco(value: unknown): string[] {
  return nomeCanonicoEco(value).split(" ").filter(Boolean);
}

function escolherCorrespondenciaEcoSegura(nomeProcesso: string, emailProcesso: string, alunosEco: any[]) {
  const email = String(emailProcesso || "").trim().toLowerCase();
  if (email) {
    const porEmail = alunosEco.filter((a) => String(a.email || "").trim().toLowerCase() === email);
    if (porEmail.length === 1) {
      return { status: "automatico_seguro" as const, aluno: porEmail[0], score: 1, motivo: "email_exato" };
    }
    if (porEmail.length > 1) {
      return { status: "ambiguo" as const, aluno: null, score: 1, motivo: "email_duplicado" };
    }
  }

  const canon = nomeCanonicoEco(nomeProcesso);
  if (!canon) return { status: "nao_encontrado" as const, aluno: null, score: 0, motivo: "nome_vazio" };

  const exatos = alunosEco.filter((a) => nomeCanonicoEco(a.nome) === canon);
  if (exatos.length === 1) {
    return { status: "automatico_seguro" as const, aluno: exatos[0], score: 1, motivo: "nome_canonico_exato" };
  }
  if (exatos.length > 1) {
    return { status: "ambiguo" as const, aluno: null, score: 1, motivo: "mais_de_um_nome_equivalente" };
  }

  const tokens = tokensNomeEco(nomeProcesso);
  const primeiro = tokens[0] || "";
  const ultimo = tokens[tokens.length - 1] || "";
  const conjuntoProcesso = new Set(tokens);
  const pontuados = alunosEco
    .map((a) => {
      const t = tokensNomeEco(a.nome);
      const score = simNome(nomeProcesso, a.nome);
      const conjuntoAluno = new Set(t);
      const menor = tokens.length <= t.length ? tokens : t;
      const maior = tokens.length <= t.length ? conjuntoAluno : conjuntoProcesso;
      const menorContido = menor.length >= 2 && menor.every((token) => maior.has(token));
      const primeiroSimilar = Boolean(primeiro && t[0] && simNome(primeiro, t[0]) >= 0.86);
      const ultimoIgual = Boolean(ultimo && t[t.length - 1] === ultimo);
      const extremosIguais = Boolean(primeiro && ultimo && t[0] === primeiro && t[t.length - 1] === ultimo);
      return { aluno: a, score, menorContido, primeiroSimilar, ultimoIgual, extremosIguais };
    })
    .sort((a, b) => b.score - a.score);

  const top = pontuados[0];
  const segundo = pontuados[1];
  if (!top || top.score < 0.76) {
    return { status: "nao_encontrado" as const, aluno: null, score: top?.score || 0, motivo: "sem_nome_proximo" };
  }

  const margem = top.score - (segundo?.score || 0);
  const candidatosContidos = pontuados.filter((x) => x.menorContido && x.score >= 0.82);
  if (candidatosContidos.length === 1 && candidatosContidos[0].aluno.id === top.aluno.id && margem >= 0.06) {
    return { status: "automatico_seguro" as const, aluno: top.aluno, score: top.score, motivo: "nome_contido_unico" };
  }

  if (top.score >= 0.90 && top.extremosIguais && margem >= 0.06) {
    return { status: "automatico_seguro" as const, aluno: top.aluno, score: top.score, motivo: "similaridade_alta_com_margem" };
  }

  if (top.score >= 0.88 && top.primeiroSimilar && top.ultimoIgual && margem >= 0.08) {
    return { status: "automatico_seguro" as const, aluno: top.aluno, score: top.score, motivo: "variacao_grafia_com_sobrenome_seguro" };
  }

  return { status: "ambiguo" as const, aluno: null, score: top.score, motivo: "requer_selecao_manual" };
}

async function listarAlunosEcoLiderDisponiveis(connection: any) {
  const [rows] = (await connection.execute(
    `SELECT DISTINCT a.id,a.name AS nome,a.email,a.programId
     FROM alunos a
     INNER JOIN aluno_curso_atribuido aca ON aca.alunoId=a.id
     WHERE a.tipoPortal IN ('aluno_autonomo','assessment')
       AND COALESCE(a.isActive,1)=1
     ORDER BY a.name ASC,a.id ASC`,
  )) as any;

  return (rows || []).map((row: any) => ({
    id: Number(row.id),
    nome: String(row.nome || ""),
    email: String(row.email || ""),
    programId: Number(row.programId || 0) || null,
  }));
}

async function listarAlunosAtivosDaEmpresa(connection: any, programId: number) {
  const [rows] = (await connection.execute(
    `SELECT id,name AS nome,email,cpf,programId
     FROM alunos
     WHERE COALESCE(isActive,1)=1
       AND programId=?
     ORDER BY name ASC,id ASC`,
    [programId],
  )) as any;

  return (rows || []).map((row: any) => ({
    id: Number(row.id),
    nome: String(row.nome || ""),
    email: String(row.email || ""),
    cpf: String(row.cpf || ""),
    programId: Number(row.programId || 0) || null,
  }));
}

async function statusEcoLiderAlunos(connection: any, alunoIds: number[]) {
  const ids = [...new Set(alunoIds.filter((id) => Number.isInteger(id) && id > 0))];
  const saida: Record<string, any> = {};
  for (const alunoId of ids) {
    saida[String(alunoId)] = {
      pdi: { total: 0, concluidas: 0, percentual: null, statusTexto: "Ainda sem tarefas registradas no PDI." },
      jornadaCompliance: { total: 0, concluidas: 0, percentual: null, statusTexto: "Jornada Compliance: ainda sem atividades registradas." },
      acessouEcoLider: false,
      ultimaEntradaEcoLider: null,
      assessmentPotencialConcluido: false,
      assessmentPotencialConcluidoEm: null,
    };
  }
  if (!ids.length) return saida;

  const placeholders = ids.map(() => "?").join(",");

  // "Entrou na EcoLíder" precisa ser evidência de autenticação, não apenas cadastro.
  // O openId aluno_ID só nasce no primeiro login do aluno. Para usuários criados
  // previamente pelo Admin, aceitamos também lastSignedIn posterior a createdAt.
  const [acessoRows] = (await connection.execute(
    `SELECT alunoId,openId,createdAt,lastSignedIn
     FROM users
     WHERE alunoId IN (${placeholders})
       AND COALESCE(isActive,1)=1`,
    ids,
  )) as any;

  for (const row of acessoRows || []) {
    const alunoId = Number(row.alunoId || 0);
    const status = saida[String(alunoId)];
    if (!status) continue;
    const openId = String(row.openId || "");
    const createdAt = row.createdAt ? new Date(row.createdAt).getTime() : 0;
    const lastSignedIn = row.lastSignedIn ? new Date(row.lastSignedIn).getTime() : 0;
    const criadoNoPrimeiroLogin = openId === `aluno_${alunoId}`;
    const houveLoginPosterior = Boolean(createdAt && lastSignedIn && lastSignedIn > createdAt + 1000);
    if (criadoNoPrimeiroLogin || houveLoginPosterior) {
      status.acessouEcoLider = true;
      if (lastSignedIn) {
        const atual = status.ultimaEntradaEcoLider ? new Date(status.ultimaEntradaEcoLider).getTime() : 0;
        if (lastSignedIn > atual) status.ultimaEntradaEcoLider = new Date(lastSignedIn).toISOString();
      }
    }
  }

  // A tabela interna mantém a nomenclatura histórica, mas a interface exibe
  // exclusivamente "Assessment/Avaliação de Potencial", conforme regra do produto.
  const [assessmentRows] = (await connection.execute(
    `SELECT alunoId,MAX(completedAt) AS completedAt
     FROM disc_resultados
     WHERE alunoId IN (${placeholders})
     GROUP BY alunoId`,
    ids,
  )) as any;

  for (const row of assessmentRows || []) {
    const alunoId = Number(row.alunoId || 0);
    const status = saida[String(alunoId)];
    if (!status) continue;
    status.assessmentPotencialConcluido = true;
    status.assessmentPotencialConcluidoEm = row.completedAt
      ? new Date(row.completedAt).toISOString()
      : null;
  }

  const [tarefasRows] = (await connection.execute(
    `SELECT
       alunoId,
       COUNT(*) AS total,
       SUM(CASE WHEN taskStatus IN ('validada','concluida') THEN 1 ELSE 0 END) AS concluidas
     FROM mentoring_sessions
     WHERE alunoId IN (${placeholders})
       AND COALESCE(cancelada,0)=0
       AND (
         taskMode='livre'
         OR taskStatus IS NULL
         OR taskStatus<>'sem_tarefa'
         OR (customTaskTitle IS NOT NULL AND TRIM(customTaskTitle)<>'')
       )
     GROUP BY alunoId`,
    ids,
  )) as any;

  for (const row of tarefasRows || []) {
    const alunoId = Number(row.alunoId || 0);
    const total = Number(row.total || 0);
    const concluidas = Number(row.concluidas || 0);
    if (!saida[String(alunoId)]) continue;
    saida[String(alunoId)].pdi = {
      total,
      concluidas,
      percentual: total > 0 ? Math.round((concluidas / total) * 100) : null,
      statusTexto: total > 0
        ? `${concluidas} de ${total} tarefas concluídas`
        : "Ainda sem tarefas registradas no PDI.",
    };
  }

  const [complianceRows] = (await connection.execute(
    `SELECT
       aca.alunoId,
       COUNT(DISTINCT CONCAT(aca.id, ':', ac.id)) AS total,
       COUNT(DISTINCT CASE
         WHEN aap.status IN ('aprovada','concluida') THEN CONCAT(aca.id, ':', ac.id)
         ELSE NULL
       END) AS concluidas
     FROM aluno_curso_atribuido aca
     INNER JOIN atividades_curso ac
       ON ac.cursoId=aca.cursoId AND ac.isActive=1
     LEFT JOIN aluno_atividade_progresso aap
       ON aap.alunoId=aca.alunoId
      AND aap.cursoAtribuidoId=aca.id
      AND aap.atividadeId=ac.id
     WHERE aca.alunoId IN (${placeholders})
     GROUP BY aca.alunoId`,
    ids,
  )) as any;

  for (const row of complianceRows || []) {
    const alunoId = Number(row.alunoId || 0);
    const total = Number(row.total || 0);
    const concluidas = Number(row.concluidas || 0);
    if (!saida[String(alunoId)]) continue;
    const percentual = total > 0 ? Math.round((concluidas / total) * 100) : null;
    saida[String(alunoId)].jornadaCompliance = {
      total,
      concluidas,
      percentual,
      statusTexto: percentual != null
        ? `Jornada Compliance: ${percentual}%`
        : "Jornada Compliance: ainda sem atividades registradas.",
    };
  }

  return saida;
}

async function statusEcoLiderAluno(connection: any, alunoId: number) {
  const mapa = await statusEcoLiderAlunos(connection, [alunoId]);
  return mapa[String(alunoId)] || {
    pdi: { total: 0, concluidas: 0, percentual: null, statusTexto: "Ainda sem tarefas registradas no PDI." },
    jornadaCompliance: { total: 0, concluidas: 0, percentual: null, statusTexto: "Jornada Compliance: ainda sem atividades registradas." },
    acessouEcoLider: false,
    ultimaEntradaEcoLider: null,
    assessmentPotencialConcluido: false,
    assessmentPotencialConcluidoEm: null,
  };
}

async function perfilEcoLiderAluno(connection: any, alunoId: number) {
  const [discRows] = (await connection.execute(
    `SELECT scoreD,scoreI,scoreS,scoreC,perfilPredominante,perfilSecundario,ciclo,completedAt
     FROM disc_resultados
     WHERE alunoId=?
     ORDER BY ciclo DESC, completedAt DESC, id DESC
     LIMIT 1`,
    [alunoId],
  )) as any;
  const disc = discRows?.[0] || null;

  const [autoRows] = (await connection.execute(
    `SELECT ap.competenciaId,c.nome AS competenciaNome,c.ordem AS competenciaOrdem,ap.nota,ap.createdAt
     FROM autopercepcoes_competencias ap
     LEFT JOIN competencias c ON c.id=ap.competenciaId
     WHERE ap.alunoId=?
     ORDER BY ap.createdAt DESC, ap.id DESC`,
    [alunoId],
  )) as any;

  const porCompetencia = new Map<number, any>();
  for (const row of autoRows || []) {
    const id = Number(row.competenciaId || 0);
    if (id && !porCompetencia.has(id)) porCompetencia.set(id, row);
  }
  const autoavaliacoes = Array.from(porCompetencia.values()).sort((a: any, b: any) =>
    (Number(a.competenciaOrdem ?? 999) - Number(b.competenciaOrdem ?? 999)) ||
    String(a.competenciaNome || "").localeCompare(String(b.competenciaNome || ""), "pt-BR"),
  );

  const grupos: Record<string, string[]> = { "5": [], "4": [], "3": [], "2": [], "1": [] };
  for (const item of autoavaliacoes as any[]) {
    const nota = Math.round(Number(item.nota || 0));
    if (nota >= 1 && nota <= 5) {
      grupos[String(nota)].push(String(item.competenciaNome || `Competência ${item.competenciaId}`));
    }
  }

  const status = await statusEcoLiderAluno(connection, alunoId);
  return { disc, autoavaliacoes, grupos, ...status };
}

/**
 * Ponte SOMENTE LEITURA entre Programa de Integração e ECO Líderes.
 * Não altera cadastro, DISC ou autoavaliações do aluno.
 */
programaIntegracaoRouter.get("/api/programa-integracao/eco-lider/perfil", requireAdmin, async (req, res) => {
  try {
    const connection = await getConnectionOr503(res); if (!connection) return;
    const nome = String(req.query.nome || "").trim();
    const email = String(req.query.email || "").trim();
    const alunoIdManual = Number(req.query.alunoId || 0) || 0;
    const alunos = await listarAlunosEcoLiderDisponiveis(connection);

    let match: any;
    if (alunoIdManual) {
      const manual = alunos.find((a: any) => a.id === alunoIdManual) || null;
      match = manual
        ? { status: "manual", aluno: manual, score: 1, motivo: "vinculo_salvo_no_programa" }
        : { status: "nao_encontrado", aluno: null, score: 0, motivo: "vinculo_manual_nao_existe_mais" };
    } else {
      match = escolherCorrespondenciaEcoSegura(nome, email, alunos);
    }

    const perfil = match.aluno
      ? { aluno: match.aluno, ...(await perfilEcoLiderAluno(connection, Number(match.aluno.id))) }
      : null;

    res.setHeader("Cache-Control", "no-store");
    return res.json({ ok: true, match, alunos, perfil });
  } catch (error) {
    console.error("[ProgramaIntegracao] ECO Líderes perfil:", error);
    return res.status(500).json({ error: "Não foi possível consultar o Perfil DISC e a Autoavaliação no ECO Líderes." });
  }
});

programaIntegracaoRouter.post("/api/programa-integracao/eco-lider/resolver-vinculos", requireAdmin, async (req, res) => {
  try {
    const connection = await getConnectionOr503(res); if (!connection) return;
    const itens = Array.isArray(req.body?.processos) ? req.body.processos.slice(0, 200) : [];
    const alunos = await listarAlunosEcoLiderDisponiveis(connection);
    const resultados: Record<string, any> = {};

    for (const item of itens) {
      const id = String(item?.id || "").trim();
      if (!id) continue;
      const nome = String(item?.nome || "").trim();
      const email = String(item?.email || "").trim();
      const match = escolherCorrespondenciaEcoSegura(nome, email, alunos);
      resultados[id] = { match, perfil: null };
      if (match.status === "automatico_seguro" && match.aluno?.id) {
        resultados[id].perfil = {
          aluno: match.aluno,
          ...(await perfilEcoLiderAluno(connection, Number(match.aluno.id))),
        };
      }
    }

    res.setHeader("Cache-Control", "no-store");
    return res.json({ ok: true, alunos, resultados });
  } catch (error) {
    console.error("[ProgramaIntegracao] ECO Líderes resolver vínculos:", error);
    return res.status(500).json({ error: "Não foi possível localizar os alunos correspondentes no ECO Líderes." });
  }
});

programaIntegracaoRouter.get("/api/programa-integracao/eco-lider/status", requireAdmin, async (req, res) => {
  try {
    const connection = await getConnectionOr503(res); if (!connection) return;
    const ids = String(req.query.alunoIds || "")
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((x) => Number.isInteger(x) && x > 0);
    const unicos = [...new Set(ids)].slice(0, 200);
    const status = await statusEcoLiderAlunos(connection, unicos);
    res.setHeader("Cache-Control", "no-store");
    return res.json({ ok: true, status });
  } catch (error) {
    console.error("[ProgramaIntegracao] ECO Líderes status:", error);
    return res.status(500).json({ error: "Não foi possível consultar o andamento atual do ECO Líderes." });
  }
});

programaIntegracaoRouter.put("/api/programa-integracao/config", requireAdmin, async (req, res) => {
  try {
    const connection = await getConnectionOr503(res); if (!connection) return;
    const incoming = req.body?.config && typeof req.body.config === "object" ? { ...req.body.config } : {};
    const pendentes = Array.isArray(incoming.respostasPendentes) ? incoming.respostasPendentes : [];
    delete incoming.respostasPendentes;
    await connection.execute(
      `INSERT INTO programa_integracao_config (chave,valor,updatedByUserId) VALUES ('geral',?,?) ON DUPLICATE KEY UPDATE valor=VALUES(valor),updatedByUserId=VALUES(updatedByUserId),updatedAt=CURRENT_TIMESTAMP`,
      [JSON.stringify(incoming), Number((req as any).authenticatedUser?.id || 0) || null]
    );
    const protocolos = new Set<string>();
    for (const p of pendentes) {
      const protocolo = String(p?.protocolo || "").trim(); if (!protocolo) continue; protocolos.add(protocolo);
      await connection.execute(
        `INSERT INTO programa_integracao_respostas (legacyRid,protocolo,formKey,ciclo,papel,statusVinculo,statusResposta,motivoPendencia,candidatos,nomeColaborador,unidade,dataInicio,emailColaborador,respondentName,source,answers,submittedAt)
         VALUES (?,?,?,?,?,'pendente',?,?,?,?,?,?,?,?, 'publico',?,?)
         ON DUPLICATE KEY UPDATE legacyRid=VALUES(legacyRid),ciclo=VALUES(ciclo),papel=VALUES(papel),motivoPendencia=VALUES(motivoPendencia),candidatos=VALUES(candidatos),nomeColaborador=VALUES(nomeColaborador),unidade=VALUES(unidade),dataInicio=VALUES(dataInicio),emailColaborador=VALUES(emailColaborador),respondentName=VALUES(respondentName),answers=VALUES(answers),updatedAt=CURRENT_TIMESTAMP`,
        [p.id || null, protocolo, p.formKey, Number(p.cycle || 0), p.role || "", p.erroRegistro ? "registro_falhou" : null, p.motivo || "ambiguo", JSON.stringify(p.candidatos || []), p.nomeColaborador || "", p.unidade || "", p.dataInicio || null, p.emailColaborador || "", p.respondentName || "", JSON.stringify(p.answers || {}), p.submittedAt ? new Date(p.submittedAt) : new Date()]
      );
    }
    const [pendingRows] = (await connection.execute(`SELECT id,protocolo FROM programa_integracao_respostas WHERE statusVinculo='pendente'`)) as any;
    for (const row of pendingRows || []) {
      if (row.protocolo && !protocolos.has(String(row.protocolo))) {
        await connection.execute(`UPDATE programa_integracao_respostas SET statusVinculo='descartada',statusResposta='descartada_admin',updatedAt=CURRENT_TIMESTAMP WHERE id=? AND statusVinculo='pendente'`, [row.id]);
        await audit(connection, req, "resposta_pendente_descartada", "Resposta retirada da fila de pendências pelo administrador.", null, Number(row.id));
      }
    }
    await audit(connection, req, "config_atualizada", "Configuração do Programa de Integração atualizada.");
    return res.json({ ok: true });
  } catch (error) {
    console.error("[ProgramaIntegracao] salvar config:", error);
    return res.status(500).json({ error: "Não foi possível salvar as configurações." });
  }
});

function normalizarJsonParaComparacao(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(normalizarJsonParaComparacao);
  if (valor && typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([chave, conteudo]) => [chave, normalizarJsonParaComparacao(conteudo)]),
    );
  }
  return valor;
}

function jsonEquivalente(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizarJsonParaComparacao(a ?? {})) === JSON.stringify(normalizarJsonParaComparacao(b ?? {}));
}

programaIntegracaoRouter.put("/api/programa-integracao/processos/lote-estado", requireAdmin, async (req, res) => {
  const connection = await getConnectionOr503(res);
  if (!connection) return;

  const atualizacoes = Array.isArray(req.body?.atualizacoes) ? req.body.atualizacoes : [];
  if (!atualizacoes.length || atualizacoes.length > 100) {
    return res.status(400).json({ error: "Lote inválido. Informe de 1 a 100 processos." });
  }

  const ids = atualizacoes.map((item: any) => sanitizeLegacyId(item?.legacyId));
  if (ids.some((id: string) => !id) || new Set(ids).size !== ids.length) {
    return res.status(400).json({ error: "O lote contém identificadores inválidos ou repetidos." });
  }

  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const placeholders = ids.map(() => "?").join(",");
    const [rows] = (await connection.execute(
      `SELECT id,legacyId,estado FROM programa_integracao_processos WHERE legacyId IN (${placeholders}) AND situacao<>'removido' FOR UPDATE`,
      ids,
    )) as any;

    if ((rows || []).length !== ids.length) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(409).json({ error: "Um dos processos do lote não está mais disponível. Nada foi alterado." });
    }

    const porId = new Map((rows || []).map((row: any) => [String(row.legacyId), row]));

    for (const atualizacao of atualizacoes) {
      const legacyId = sanitizeLegacyId(atualizacao?.legacyId);
      const row: any = porId.get(legacyId);
      const estadoAtual = asJson<Record<string, any>>(row?.estado, {});

      if (
        !jsonEquivalente(estadoAtual.feito || {}, atualizacao?.baseFeito || {}) ||
        !jsonEquivalente(estadoAtual.alin || {}, atualizacao?.baseAlin || {})
      ) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({
          error: `O processo ${legacyId} mudou desde a última leitura. Nada do lote foi alterado; atualize a tela e tente novamente.`,
        });
      }
    }

    for (const atualizacao of atualizacoes) {
      const legacyId = sanitizeLegacyId(atualizacao?.legacyId);
      const row: any = porId.get(legacyId);
      const estadoAtual = asJson<Record<string, any>>(row.estado, {});
      const proximoEstado = {
        ...estadoAtual,
        feito: atualizacao?.feito && typeof atualizacao.feito === "object" ? atualizacao.feito : {},
        alin: atualizacao?.alin && typeof atualizacao.alin === "object" ? atualizacao.alin : {},
      };

      await connection.execute(
        `UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
        [JSON.stringify(proximoEstado), Number(row.id)],
      );
      await audit(
        connection,
        req,
        "estado_lote_atualizado",
        `Estado do processo ${legacyId} atualizado dentro de lote transacional.`,
        Number(row.id),
      );
    }

    await connection.commit();
    transactionStarted = false;
    return res.json({ ok: true, atualizados: ids.length });
  } catch (error) {
    if (transactionStarted) {
      try { await connection.rollback(); } catch { /* rollback de melhor esforço */ }
    }
    console.error("[ProgramaIntegracao] salvar lote de estados:", error);
    return res.status(500).json({ error: "Não foi possível concluir o lote. Nenhum dado deve ser considerado confirmado." });
  }
});

programaIntegracaoRouter.put("/api/programa-integracao/processos/:legacyId", requireAdmin, async (req, res) => {
  try {
    const connection = await getConnectionOr503(res); if (!connection) return;
    const legacyId = sanitizeLegacyId(req.params.legacyId); const p = req.body?.processo;
    if (!legacyId || !p || typeof p !== "object") return res.status(400).json({ error: "Processo inválido." });
    const ordem = Number(req.body?.ordem ?? 0) || 0;
    const estado = { ...p }; delete estado.resp;
    const values = [legacyId, null, ordem, String(p.nome || "Sem nome"), p.cpf || null, p.nasc || null, p.email || null, p.emailCorporativo || null, p.tel || null, p.cargo || null, p.unidade || null, p.tipo || "Onboarding", p.inicio || todayIso(), p.part || "Presencial", p.situacao || "ativo", p.gestor || null, p.gestorEmail || null, p.gestorTel || null, p.anjo || null, p.anjoEmail || null, p.consultora || null, p.mentorId || null, p.ugp || null, p.horarios || null, p.statusPdi || null, p.pendencias || null, p.statusCursos || null, p.consideracoes || null, p.notas || null, p.cor || null, JSON.stringify(estado)];
    await connection.execute(
      `INSERT INTO programa_integracao_processos (legacyId,alunoId,ordem,nome,cpf,nasc,email,emailCorporativo,tel,cargo,unidade,tipo,inicio,participacao,situacao,gestor,gestorEmail,gestorTel,anjo,anjoEmail,consultora,mentorLegacyId,ugp,horarios,statusPdi,pendencias,statusCursos,consideracoes,notas,cor,estado)
       VALUES (${Array(31).fill("?").join(",")}) ON DUPLICATE KEY UPDATE ordem=VALUES(ordem),nome=VALUES(nome),cpf=VALUES(cpf),nasc=VALUES(nasc),email=VALUES(email),emailCorporativo=VALUES(emailCorporativo),tel=VALUES(tel),cargo=VALUES(cargo),unidade=VALUES(unidade),tipo=VALUES(tipo),inicio=VALUES(inicio),participacao=VALUES(participacao),situacao=VALUES(situacao),gestor=VALUES(gestor),gestorEmail=VALUES(gestorEmail),gestorTel=VALUES(gestorTel),anjo=VALUES(anjo),anjoEmail=VALUES(anjoEmail),consultora=VALUES(consultora),mentorLegacyId=VALUES(mentorLegacyId),ugp=VALUES(ugp),horarios=VALUES(horarios),statusPdi=VALUES(statusPdi),pendencias=VALUES(pendencias),statusCursos=VALUES(statusCursos),consideracoes=VALUES(consideracoes),notas=VALUES(notas),cor=VALUES(cor),estado=VALUES(estado),updatedAt=CURRENT_TIMESTAMP`, values
    );
    const [prow] = (await connection.execute(`SELECT id FROM programa_integracao_processos WHERE legacyId=? LIMIT 1`, [legacyId])) as any;
    const processoId = Number(prow?.[0]?.id || 0);
    for (const r of Array.isArray(p.resp) ? p.resp : []) {
      const answers = r.answers && typeof r.answers === "object" ? r.answers : {};
      const protocolo = String(r.protocolo || "").trim() || null;
      const dedupeKey = `${legacyId}|${r.form || ""}|${Number(r.ciclo || 0)}|${r.papel || ""}|${r.rid || ""}`;
      const [existing] = (await connection.execute(`SELECT id FROM programa_integracao_respostas WHERE (protocolo IS NOT NULL AND protocolo=?) OR (legacyRid IS NOT NULL AND legacyRid=?) LIMIT 1`, [protocolo, r.rid || null])) as any;
      if (existing?.[0]?.id) {
        await connection.execute(`UPDATE programa_integracao_respostas SET processoId=?,legacyRid=?,protocolo=COALESCE(?,protocolo),dedupeKey=?,formKey=?,ciclo=?,papel=?,itemId=?,formVersion=?,statusVinculo='vinculada',statusResposta=?,nomeOrig=?,avaliador=?,respondentName=?,respondentEmail=?,source=?,media=?,alertas=?,answers=?,quandoOriginal=?,emOriginal=?,submittedAt=COALESCE(?,submittedAt),updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
          [processoId, r.rid || null, protocolo, dedupeKey, r.form, Number(r.ciclo || 0), r.papel || "", r.itid || null, Number(r.formVersion || 1), r.status || "valido", r.nomeOrig || null, r.avaliador || null, r.respondentName || null, r.respondentEmail || null, r.source || "admin", r.media ?? null, JSON.stringify(r.alertas || []), JSON.stringify(answers), r.quando || null, r.em || null, r.submittedAt ? new Date(r.submittedAt) : null, existing[0].id]);
      } else {
        await connection.execute(`INSERT INTO programa_integracao_respostas (processoId,legacyRid,protocolo,dedupeKey,formKey,ciclo,papel,itemId,formVersion,statusVinculo,statusResposta,nomeOrig,avaliador,respondentName,respondentEmail,source,media,alertas,answers,quandoOriginal,emOriginal,submittedAt) VALUES (?,?,?,?,?,?,?,?,?,'vinculada',?,?,?,?,?,?,?,?,?,?,?,?)`,
          [processoId, r.rid || null, protocolo, dedupeKey, r.form, Number(r.ciclo || 0), r.papel || "", r.itid || null, Number(r.formVersion || 1), r.status || "valido", r.nomeOrig || null, r.avaliador || null, r.respondentName || null, r.respondentEmail || null, r.source || "admin", r.media ?? null, JSON.stringify(r.alertas || []), JSON.stringify(answers), r.quando || null, r.em || null, r.submittedAt ? new Date(r.submittedAt) : new Date()]);
      }
    }
    await audit(connection, req, "processo_salvo", `Processo ${legacyId} salvo.`, processoId || null);
    return res.json({ ok: true, processoId });
  } catch (error) {
    console.error("[ProgramaIntegracao] salvar processo:", error);
    return res.status(500).json({ error: "Não foi possível salvar o processo." });
  }
});

programaIntegracaoRouter.delete("/api/programa-integracao/processos/:legacyId", requireAdmin, async (req, res) => {
  try {
    const connection = await getConnectionOr503(res); if (!connection) return;
    const legacyId = sanitizeLegacyId(req.params.legacyId);
    const [rows] = (await connection.execute(`SELECT id FROM programa_integracao_processos WHERE legacyId=? LIMIT 1`, [legacyId])) as any;
    if (!rows?.[0]) return res.json({ ok: true });
    await connection.execute(`UPDATE programa_integracao_processos SET situacao='removido',updatedAt=CURRENT_TIMESTAMP WHERE id=?`, [rows[0].id]);
    await audit(connection, req, "processo_arquivado", `Processo ${legacyId} removido da visão administrativa sem exclusão física.`, Number(rows[0].id));
    return res.json({ ok: true });
  } catch (error) { console.error("[ProgramaIntegracao] arquivar processo:", error); return res.status(500).json({ error: "Não foi possível remover o processo." }); }
});

function notaAutomaticaDeResposta(nota: any): boolean {
  const texto = String(nota?.t || "").trim();
  return /^Resposta (registrada|importada|restaurada) — /i.test(texto);
}

function limparItemParaPendente(estadoOriginal: unknown, itemId: string) {
  const estado = asJson<Record<string, any>>(estadoOriginal, {});
  estado.feito = estado.feito && typeof estado.feito === "object" ? { ...estado.feito } : {};
  if (!itemId) return estado;

  const atual = estado.feito[itemId] && typeof estado.feito[itemId] === "object"
    ? { ...estado.feito[itemId] }
    : {};
  const notas = Array.isArray(atual.notas)
    ? atual.notas.filter((nota: any) => !notaAutomaticaDeResposta(nota))
    : [];

  const proxima = {
    ...atual,
    s: "",
    d: "",
    prog: "",
    just: "",
    notas,
  };
  const vazia = !proxima.s && !proxima.d && !proxima.prog && !proxima.just && notas.length === 0;
  if (vazia) delete estado.feito[itemId];
  else estado.feito[itemId] = proxima;
  return estado;
}

function marcarItemComoRespondido(
  estadoOriginal: unknown,
  itemId: string,
  descricao: string,
  dataPreferida?: string,
) {
  const estado = asJson<Record<string, any>>(estadoOriginal, {});
  estado.feito = estado.feito && typeof estado.feito === "object" ? { ...estado.feito } : {};
  if (!itemId) return estado;

  const atual = estado.feito[itemId] && typeof estado.feito[itemId] === "object"
    ? { ...estado.feito[itemId] }
    : {};
  const notas = Array.isArray(atual.notas) ? [...atual.notas] : [];
  notas.push({ d: nowBr(), t: descricao });
  estado.feito[itemId] = {
    ...atual,
    s: "ok",
    d: String(dataPreferida || atual.d || todayIso()).slice(0, 10),
    prog: "",
    just: "",
    notas,
  };
  return estado;
}

async function existeOutraRespostaAtiva(
  connection: any,
  respostaId: number,
  processoId: number,
  itemId: string,
  formKey: string,
  ciclo: number,
  papel: string,
) {
  const [rows] = (await connection.execute(
    `SELECT id
       FROM programa_integracao_respostas
       WHERE processoId=?
         AND id<>?
         AND statusVinculo='vinculada'
         AND (
           (itemId IS NOT NULL AND itemId=?)
           OR (formKey=? AND ciclo=? AND COALESCE(papel,'')=?)
         )
       LIMIT 1
       FOR UPDATE`,
    [processoId, respostaId, itemId || null, formKey, ciclo, papel || ""],
  )) as any;
  return Boolean(rows?.[0]?.id);
}

programaIntegracaoRouter.get("/api/programa-integracao/respostas-excluidas", requireAdmin, async (req, res) => {
  try {
    const connection = await getConnectionOr503(res); if (!connection) return;
    const [rows] = (await connection.execute(
      `SELECT r.*, p.legacyId AS processoLegacyId, p.nome AS processoNome, p.situacao AS processoSituacao
       FROM programa_integracao_respostas r
       LEFT JOIN programa_integracao_processos p ON p.id=r.processoId
       WHERE r.statusVinculo='descartada' AND r.statusResposta='removida_admin'
       ORDER BY r.updatedAt DESC, r.id DESC`,
    )) as any;

    const respostas = (rows || []).map((row: any) => ({
      ...responseToLegacy(row),
      processoIdLocal: row.processoLegacyId || "",
      processoNome: row.processoNome || row.nomeOrig || row.nomeColaborador || "Sem nome",
      processoSituacao: row.processoSituacao || "",
      excluidaEm: row.updatedAt ? new Date(row.updatedAt).toISOString() : "",
    }));
    res.setHeader("Cache-Control", "no-store");
    return res.json({ ok: true, respostas });
  } catch (error) {
    console.error("[ProgramaIntegracao] listar respostas excluídas:", error);
    return res.status(500).json({ error: "Não foi possível carregar as respostas excluídas." });
  }
});

programaIntegracaoRouter.delete("/api/programa-integracao/respostas/:legacyRid", requireAdmin, async (req, res) => {
  const connection = await getConnectionOr503(res); if (!connection) return;
  let transactionStarted = false;
  try {
    const rid = sanitizeLegacyId(req.params.legacyRid);
    if (!rid) return res.status(400).json({ error: "Resposta inválida." });

    await connection.beginTransaction();
    transactionStarted = true;

    const [rows] = (await connection.execute(
      `SELECT id,processoId,formKey,ciclo,papel,itemId,statusVinculo,statusResposta
       FROM programa_integracao_respostas
       WHERE legacyRid=?
       LIMIT 1
       FOR UPDATE`,
      [rid],
    )) as any;
    const resposta = rows?.[0];
    if (!resposta) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).json({ error: "Resposta não encontrada." });
    }
    if (resposta.statusVinculo !== "vinculada") {
      await connection.rollback();
      transactionStarted = false;
      return res.status(409).json({ error: "Esta resposta não está ativa. Atualize a tela antes de tentar novamente." });
    }

    const processoId = Number(resposta.processoId || 0);
    const formKey = String(resposta.formKey || "");
    const ciclo = Number(resposta.ciclo || 0);
    const papel = String(resposta.papel || "");
    const itemId = String(resposta.itemId || itemIdDoFormulario(formKey as ProgramaIntegracaoFormKey, ciclo, papel) || "");

    const [processRows] = processoId
      ? (await connection.execute(
          `SELECT id,legacyId,estado FROM programa_integracao_processos WHERE id=? LIMIT 1 FOR UPDATE`,
          [processoId],
        )) as any
      : [[]] as any;
    const processo = processRows?.[0] || null;
    const estadoAntes = processo ? asJson<Record<string, any>>(processo.estado, {}) : {};
    const fichaAntes = itemId && estadoAntes?.feito?.[itemId] && typeof estadoAntes.feito[itemId] === "object"
      ? estadoAntes.feito[itemId]
      : null;

    const outraRespostaAtiva = processoId
      ? await existeOutraRespostaAtiva(connection, Number(resposta.id), processoId, itemId, formKey, ciclo, papel)
      : false;

    await connection.execute(
      `UPDATE programa_integracao_respostas
       SET statusVinculo='descartada',statusResposta='removida_admin',updatedAt=CURRENT_TIMESTAMP
       WHERE id=?`,
      [resposta.id],
    );

    const bemAntes = formKey === "bem" && !outraRespostaAtiva && estadoAntes?.bem && typeof estadoAntes.bem === "object"
      ? { ...estadoAntes.bem }
      : null;

    let itemVoltouPendente = false;
    if (processo && itemId && !outraRespostaAtiva) {
      const proximoEstado = limparItemParaPendente(estadoAntes, itemId);
      if (formKey === "bem") {
        const fonteBem = normTxt(proximoEstado?.bem?.fonte || "");
        if (fonteBem.includes("formulario")) {
          proximoEstado.bem = {};
        }
      }
      await connection.execute(
        `UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
        [JSON.stringify(proximoEstado), processoId],
      );
      itemVoltouPendente = true;
    }

    await audit(
      connection,
      req,
      "resposta_arquivada",
      `Resposta ${rid} excluída da visão ativa sem exclusão física.`,
      processoId || null,
      Number(resposta.id),
      {
        formKey,
        ciclo,
        papel,
        itemId,
        outraRespostaAtiva,
        itemVoltouPendente,
        fichaAntes,
        bemAntes,
      },
    );

    await connection.commit();
    transactionStarted = false;
    return res.json({ ok: true, itemId, itemVoltouPendente, outraRespostaAtiva });
  } catch (error) {
    if (transactionStarted) {
      try { await connection.rollback(); } catch { /* rollback de melhor esforço */ }
    }
    console.error("[ProgramaIntegracao] arquivar resposta:", error);
    return res.status(500).json({ error: "Não foi possível excluir a resposta. Nenhuma alteração parcial foi mantida." });
  }
});

programaIntegracaoRouter.post("/api/programa-integracao/respostas/:legacyRid/restaurar", requireAdmin, async (req, res) => {
  const connection = await getConnectionOr503(res); if (!connection) return;
  let transactionStarted = false;
  try {
    const rid = sanitizeLegacyId(req.params.legacyRid);
    if (!rid) return res.status(400).json({ error: "Resposta inválida." });

    await connection.beginTransaction();
    transactionStarted = true;

    const [rows] = (await connection.execute(
      `SELECT id,processoId,formKey,ciclo,papel,itemId,statusVinculo,statusResposta,submittedAt
       FROM programa_integracao_respostas
       WHERE legacyRid=?
       LIMIT 1
       FOR UPDATE`,
      [rid],
    )) as any;
    const resposta = rows?.[0];
    if (!resposta) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).json({ error: "Resposta excluída não encontrada." });
    }
    if (resposta.statusVinculo !== "descartada" || resposta.statusResposta !== "removida_admin") {
      await connection.rollback();
      transactionStarted = false;
      return res.status(409).json({ error: "Esta resposta não está na área de excluídas ou já foi restaurada." });
    }

    const processoId = Number(resposta.processoId || 0);
    if (!processoId) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(409).json({ error: "A resposta não possui processo vinculado e não pode ser restaurada automaticamente." });
    }

    const [processRows] = (await connection.execute(
      `SELECT id,legacyId,nome,situacao,estado
       FROM programa_integracao_processos
       WHERE id=?
       LIMIT 1
       FOR UPDATE`,
      [processoId],
    )) as any;
    const processo = processRows?.[0];
    if (!processo || processo.situacao === "removido") {
      await connection.rollback();
      transactionStarted = false;
      return res.status(409).json({ error: "O processo relacionado não está ativo. Reative o processo antes de restaurar a resposta." });
    }

    const formKey = String(resposta.formKey || "");
    const ciclo = Number(resposta.ciclo || 0);
    const papel = String(resposta.papel || "");
    const itemId = String(resposta.itemId || itemIdDoFormulario(formKey as ProgramaIntegracaoFormKey, ciclo, papel) || "");
    const outraRespostaAtiva = await existeOutraRespostaAtiva(
      connection,
      Number(resposta.id),
      processoId,
      itemId,
      formKey,
      ciclo,
      papel,
    );

    await connection.execute(
      `UPDATE programa_integracao_respostas
       SET statusVinculo='vinculada',statusResposta='restaurada_admin',updatedAt=CURRENT_TIMESTAMP
       WHERE id=?`,
      [resposta.id],
    );

    let itemMarcadoComoFeito = false;
    if (itemId && !outraRespostaAtiva) {
      const [audRows] = (await connection.execute(
        `SELECT metadata
         FROM programa_integracao_auditoria
         WHERE respostaId=? AND acao='resposta_arquivada'
         ORDER BY id DESC
         LIMIT 1`,
        [resposta.id],
      )) as any;
      const metadata = asJson<Record<string, any>>(audRows?.[0]?.metadata, {});
      const fichaAntes = metadata?.fichaAntes && typeof metadata.fichaAntes === "object" ? metadata.fichaAntes : {};
      const dataAnterior = String(fichaAntes?.d || "").slice(0, 10);
      const descricao = `Resposta restaurada — ${FORM_NAMES[formKey as ProgramaIntegracaoFormKey] || formKey}${ciclo ? ` · ${ciclo}º ciclo` : ""}${papel ? ` · ${papel}` : ""}.`;
      const proximoEstado = marcarItemComoRespondido(processo.estado, itemId, descricao, dataAnterior || undefined);
      if (formKey === "bem" && metadata?.bemAntes && typeof metadata.bemAntes === "object") {
        proximoEstado.bem = metadata.bemAntes;
      }
      await connection.execute(
        `UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
        [JSON.stringify(proximoEstado), processoId],
      );
      itemMarcadoComoFeito = true;
    }

    await audit(
      connection,
      req,
      "resposta_restaurada",
      `Resposta ${rid} restaurada para a visão ativa.`,
      processoId,
      Number(resposta.id),
      { formKey, ciclo, papel, itemId, outraRespostaAtiva, itemMarcadoComoFeito },
    );

    await connection.commit();
    transactionStarted = false;
    return res.json({ ok: true, itemId, itemMarcadoComoFeito, outraRespostaAtiva });
  } catch (error) {
    if (transactionStarted) {
      try { await connection.rollback(); } catch { /* rollback de melhor esforço */ }
    }
    console.error("[ProgramaIntegracao] restaurar resposta:", error);
    return res.status(500).json({ error: "Não foi possível restaurar a resposta. Nenhuma alteração parcial foi mantida." });
  }
});

programaIntegracaoRouter.get("/api/public/programa-integracao/opcoes-ativas", async (_req, res) => {
  try {
    const connection = await getConnectionOr503(res); if (!connection) return;
    const [rows] = (await connection.execute(
      `SELECT nome,gestor,anjo
       FROM programa_integracao_processos
       WHERE situacao='ativo' AND tipo='Onboarding'
       ORDER BY nome`
    )) as any;

    const unicos = (valores: string[]) =>
      [...new Set(valores.map((v) => String(v || '').trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const colaboradores = unicos((rows || []).map((r: any) => r.nome));
    const gestores = unicos((rows || []).map((r: any) => r.gestor));
    const anjos = unicos((rows || []).map((r: any) => r.anjo));

    res.setHeader("Cache-Control", "no-store");
    return res.json({ ok: true, colaboradores, gestores, anjos });
  } catch (error) {
    console.error("[ProgramaIntegracao] opções públicas ativas:", error);
    return res.status(500).json({ error: "Não foi possível carregar as opções ativas do Onboarding." });
  }
});

programaIntegracaoRouter.get("/api/public/programa-integracao/forms/:slug", async (req, res) => {
  try {
    const formKey = formKeyDoSlug(req.params.slug); if (!formKey) return res.status(404).json({ error: "Formulário não encontrado." });
    const connection = await getConnectionOr503(res); if (!connection) return;
    const [rows] = (await connection.execute(`SELECT valor FROM programa_integracao_config WHERE chave='geral' LIMIT 1`)) as any;
    const config = rows?.[0] ? asJson(rows[0].valor, {}) : {};
    const cfg = config?.formConfig?.[formKey] || { active: true, version: 1, dupPolicy: "bloquear" };
    res.setHeader("Cache-Control", "no-store");
    return res.json({
      ok: true,
      formKey,
      formName: FORM_NAMES[formKey],
      active: cfg.active !== false,
      version: Number(cfg.version || 1),
      dupPolicy: ["bloquear", "substituir", "adicional"].includes(String(cfg.dupPolicy)) ? cfg.dupPolicy : "bloquear",
      textos: config?.formTextos?.[formKey] || null,
    });
  } catch (error) { console.error("[ProgramaIntegracao] public form:", error); return res.status(500).json({ error: "Não foi possível abrir o formulário." }); }
});

function calcMedia(formKey: ProgramaIntegracaoFormKey, answers: Record<string, any>) {
  const escala = PROGRAMA_INTEGRACAO_ESCALAS[formKey]; if (!escala) return { media: null, alertas: [] as number[] };
  const qmap = PROGRAMA_INTEGRACAO_QUESTION_INDEX[formKey] || {}; let soma = 0, qt = 0; const alertas: number[] = [];
  for (const [code, idx] of Object.entries(qmap)) {
    if (idx < escala.de || idx > escala.ate) continue;
    const n = Number(answers[code]); if (!Number.isFinite(n)) continue;
    const inv = !!escala.inverso?.includes(idx);
    if (n > 0) { soma += inv ? 6 - n : n; qt++; }
    if ((inv && n >= 4) || (!inv && n > 0 && n <= 2)) alertas.push(idx);
  }
  return { media: qt ? Math.round((soma / qt) * 10) / 10 : null, alertas };
}

function publicQuestionRules(catalog: any, formKey: ProgramaIntegracaoFormKey, config: any) {
  const override = config?.formTextos?.[formKey] || {};
  return (catalog?.sections || []).flatMap((section: any) => (section.questions || []).map((question: any) => {
    const customRequired = override?.obrigatorias?.[question.code];
    const customLabel = override?.labels?.[question.code];
    const customChoices = String(override?.escolhas?.[question.code] || "").split("\n").map((line: string) => line.trim()).filter(Boolean).map((line: string) => {
      const pos = line.indexOf("|");
      return pos > 0 ? { value: line.slice(0, pos).trim(), label: line.slice(pos + 1).trim() } : line;
    });
    return {
      ...question,
      label: customLabel != null ? String(customLabel) : question.label,
      required: customRequired != null ? Boolean(customRequired) : question.required,
      options: customChoices.length ? customChoices : question.options,
    };
  }));
}

function valuePresent(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function optionValues(options: any[] | undefined) {
  return (options || []).map((option: any) => typeof option === "string" ? option : String(option?.value ?? option?.v ?? ""));
}

function validatePublicAnswers(catalog: any, formKey: ProgramaIntegracaoFormKey, config: any, data: any) {
  const answers = data.answers && typeof data.answers === "object" ? data.answers : {};
  const questions = publicQuestionRules(catalog, formKey, config);
  for (const question of questions) {
    const conditionalGestor = question.code === "aval_reacao_feedback" && String(data.role || "") === "Gestor";
    if (question.code === "aval_reacao_feedback" && !conditionalGestor) continue;
    const required = question.required !== false || conditionalGestor;
    const value = answers[question.code];
    if (required && !valuePresent(value)) return { erro: `Preencha: ${question.label}`, campo: question.code };
    if (!valuePresent(value)) continue;

    if (question.type === "scale") {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 0 || n > 5) return { erro: `Valor inválido em: ${question.label}`, campo: question.code };
    }
    if (question.type === "cpf" && !/^\d{11}$/.test(String(value).replace(/\D/g, ""))) {
      return { erro: "Informe o CPF com 11 números.", campo: question.code };
    }
    if (question.type === "tel") {
      const digits = String(value).replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 11) return { erro: "Informe o telefone com DDD, usando 10 ou 11 números.", campo: question.code };
    }
    if (question.type === "textarea" && String(value).trim().length < MIN_TEXTO_LIVRE) {
      return { erro: `A resposta de "${question.label}" precisa ter pelo menos ${MIN_TEXTO_LIVRE} caracteres.`, campo: question.code };
    }
    if (question.type === "select" && Array.isArray(question.options) && question.options.length) {
      if (!optionValues(question.options).includes(String(value))) return { erro: `Opção inválida em: ${question.label}`, campo: question.code };
    }
    if (question.type === "multi" && Array.isArray(question.options) && question.options.length) {
      const allowed = new Set(optionValues(question.options));
      const values = Array.isArray(value) ? value : String(value).split(",").map((v) => v.trim()).filter(Boolean);
      if (values.some((v: string) => !allowed.has(v))) return { erro: `Há uma opção inválida em: ${question.label}`, campo: question.code };
    }
  }
  return null;
}

async function findProcess(connection: any, data: any) {
  const [rows] = (await connection.execute(`SELECT id,legacyId,nome,email,emailCorporativo,unidade,inicio FROM programa_integracao_processos WHERE situacao<>'removido'`)) as any;
  const nome = String(data.nomeColaborador || "").trim(); if (!nome) return { status: "nenhum", candidatos: [] as any[] };
  const emailQ = normTxt(data.emailColaborador), unidQ = String(data.unidade || "").trim(), dataQ = String(data.dataInicio || "").slice(0,10);
  const candidatos = (rows || []).map((p: any) => {
    const s = Math.max(simNome(nome, p.nome), 0);
    const emailBate = !!(emailQ && ((p.email && normTxt(p.email) === emailQ) || (p.emailCorporativo && normTxt(p.emailCorporativo) === emailQ)));
    const unidBate = !!(unidQ && p.unidade && simNome(unidQ, p.unidade) >= SIM_BOA);
    const inicio = sqlDateToIso(p.inicio); const dataBate = !!(dataQ && inicio === dataQ);
    const sinais: string[] = []; if (emailBate) sinais.push("e-mail"); if (unidBate) sinais.push("unidade"); if (dataBate) sinais.push("data de início");
    return { dbId: Number(p.id), id: p.legacyId || `p${p.id}`, nome: p.nome, nameScore: s, ajuste: s + (emailBate ? .35 : 0) + (unidBate ? .12 : 0) + (dataBate ? .12 : 0), sinais };
  }).filter((c: any) => c.nameScore > 0 || c.sinais.length).sort((a: any,b: any) => b.ajuste-a.ajuste);
  if (!candidatos.length) return { status: "nenhum", candidatos: [] };
  const top = candidatos[0], seg = candidatos[1];
  const forte = top.sinais.includes("e-mail") || (top.nameScore >= SIM_MIN && top.sinais.length >= 2) || top.nameScore >= SIM_BOA;
  const folga = !seg || top.ajuste - seg.ajuste >= .15;
  if (top.nameScore >= SIM_MIN && forte && folga) return { status: "ok", processo: top, candidatos: candidatos.slice(0,5) };
  return { status: candidatos.some((c:any) => c.nameScore >= SIM_MIN || c.sinais.length) ? "ambiguo" : "nenhum", candidatos: candidatos.slice(0,5) };
}

async function insertResponse(connection: any, data: any, formKey: ProgramaIntegracaoFormKey, version: number, match: any, statusVinculo: "vinculada"|"pendente", motivo: string | null) {
  const cycle = Number(data.cycle || 0), role = String(data.role || ""), answers = data.answers && typeof data.answers === "object" ? data.answers : {};
  const itemId = statusVinculo === "vinculada" ? itemIdDoFormulario(formKey, cycle, role) : null;
  const { media, alertas } = calcMedia(formKey, answers);
  const candidatos = (match?.candidatos || []).map((c:any) => ({ id: c.id, nome: c.nome, pct: Math.round(Math.min(c.ajuste,1)*100) }));
  const processoId = statusVinculo === "vinculada" ? Number(match.processo.dbId) : null;
  const [result] = (await connection.execute(
    `INSERT INTO programa_integracao_respostas (processoId,formKey,ciclo,papel,itemId,formVersion,statusVinculo,statusResposta,motivoPendencia,candidatos,nomeColaborador,unidade,dataInicio,emailColaborador,respondentName,respondentEmail,source,media,alertas,answers,submittedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
    [processoId, formKey, cycle, role || null, itemId, version, statusVinculo, motivo === "registro_falhou" ? "registro_falhou" : "valido", motivo, JSON.stringify(candidatos), String(data.nomeColaborador || "").trim(), String(data.unidade || "").trim() || null, data.dataInicio || null, String(data.emailColaborador || "").trim() || null, String(data.respondentName || data.nomeColaborador || "").trim(), String(data.emailColaborador || "").trim() || null, "publico", media, JSON.stringify(alertas), JSON.stringify(answers)]
  )) as any;
  const id = Number(result.insertId); const protocolo = `${PROTO_PREFIX[formKey]}-${String(id).padStart(6,"0")}`; const legacyRid = `rpi${id}`;
  await connection.execute(`UPDATE programa_integracao_respostas SET protocolo=?,legacyRid=?,dedupeKey=? WHERE id=?`, [protocolo, legacyRid, `${formKey}|${processoId || 0}|${cycle}|${role}|${id}`, id]);
  if (statusVinculo === "vinculada" && processoId && itemId) {
    const [pr] = (await connection.execute(`SELECT estado FROM programa_integracao_processos WHERE id=? LIMIT 1`, [processoId])) as any;
    const estado = asJson<Record<string, any>>(pr?.[0]?.estado, {}); estado.feito = estado.feito || {};
    const ficha = estado.feito[itemId] && typeof estado.feito[itemId] === "object" ? estado.feito[itemId] : {};
    ficha.s = "ok"; ficha.d = ficha.d || todayIso(); ficha.notas = Array.isArray(ficha.notas) ? ficha.notas : [];
    ficha.notas.push({ d: nowBr(), t: `Resposta registrada — ${FORM_NAMES[formKey]}${cycle ? ` · ${cycle}º ciclo` : ""}${role ? ` · ${role}` : ""}${media != null ? ` · média ${media.toFixed(1).replace('.',',')}` : ""}.` });
    estado.feito[itemId] = ficha;
    await connection.execute(`UPDATE programa_integracao_processos SET estado=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?`, [JSON.stringify(estado), processoId]);
  }
  return { id, protocolo, legacyRid, processoId, itemId };
}

programaIntegracaoRouter.post("/api/public/programa-integracao/forms/:slug/responses", async (req, res) => {
  const connection = await getConnectionOr503(res); if (!connection) return;
  let transactionStarted = false;
  try {
    const formKey = formKeyDoSlug(req.params.slug); if (!formKey) return res.status(404).json({ ok:false, erro:"Formulário não encontrado." });
    const [cfgRows] = (await connection.execute(`SELECT valor FROM programa_integracao_config WHERE chave='geral' LIMIT 1`)) as any;
    const config = cfgRows?.[0] ? asJson(cfgRows[0].valor, {}) : {};
    const cfg = config?.formConfig?.[formKey] || { active:true, version:1, dupPolicy:"bloquear" };
    const effectiveFormVersion = formKey === "bem"
      ? Math.max(BEM_MATRIZ_ATUAL_VERSAO, Number(cfg.version || 1))
      : Number(cfg.version || 1);
    if (cfg.active === false) return res.status(409).json({ ok:false, erro:"Este formulário está desativado no momento." });
    const data = req.body || {};
    if (!String(data.nomeColaborador || "").trim()) return res.status(400).json({ ok:false, erro:"Informe o nome do colaborador.", campo:"nomeColaborador" });
    const catalog = PROGRAMA_INTEGRACAO_CATALOG[req.params.slug];
    if (!catalog) return res.status(404).json({ ok:false, erro:"Formulário não encontrado." });
    if (catalog.identity.unidade && !String(data.unidade || "").trim()) return res.status(400).json({ ok:false, erro:"Informe a unidade.", campo:"unidade" });
    if (catalog.identity.dataInicio && !String(data.dataInicio || "").trim()) return res.status(400).json({ ok:false, erro:"Informe a data de início.", campo:"dataInicio" });
    if (catalog.identity.respondent && !String(data.respondentName || "").trim()) return res.status(400).json({ ok:false, erro:"Informe o nome de quem está respondendo.", campo:"respondentName" });
    if (catalog.identity.cycle && !Number(data.cycle || 0)) return res.status(400).json({ ok:false, erro:"Informe o período desta resposta.", campo:"cycle" });
    if (formKey === "aval" && !["Gestor","Anjo"].includes(String(data.role || ""))) return res.status(400).json({ ok:false, erro:"Informe se a resposta é do Gestor ou do Anjo.", campo:"role" });

    const validationError = validatePublicAnswers(catalog, formKey, config, data);
    if (validationError) return res.status(400).json({ ok:false, ...validationError });

    const match = await findProcess(connection, data);
    if (match.status === "ok") {
      const processoId = Number(match.processo.dbId), cycle = Number(data.cycle || 0), role = String(data.role || "");
      const [dups] = (await connection.execute(
        `SELECT id FROM programa_integracao_respostas WHERE processoId=? AND formKey=? AND ciclo=? AND COALESCE(papel,'')=? AND statusVinculo='vinculada' ORDER BY id DESC LIMIT 1`,
        [processoId, formKey, cycle, role],
      )) as any;
      const duplicate = dups?.[0] || null;
      const dupPolicy = ["bloquear", "substituir", "adicional"].includes(String(cfg.dupPolicy)) ? String(cfg.dupPolicy) : "bloquear";

      if (duplicate && dupPolicy === "bloquear") {
        const saved = await insertResponse(connection, data, formKey, effectiveFormVersion, { candidatos: match.candidatos }, "pendente", "registro_falhou");
        return res.json({ ok:true, pendente:true, protocolo:saved.protocolo, motivo:"duplicado" });
      }

      await connection.beginTransaction();
      transactionStarted = true;
      if (duplicate && dupPolicy === "substituir") {
        await connection.execute(
          `UPDATE programa_integracao_respostas SET statusVinculo='substituida',statusResposta='substituida_publico',updatedAt=CURRENT_TIMESTAMP WHERE id=? AND statusVinculo='vinculada'`,
          [duplicate.id],
        );
      }
      const saved = await insertResponse(connection, data, formKey, effectiveFormVersion, match, "vinculada", null);
      await connection.commit();
      transactionStarted = false;
      return res.json({
        ok:true,
        pendente:false,
        protocolo:saved.protocolo,
        processId:match.processo.id,
        marcouEtapa:!!saved.itemId,
        duplicateAction: duplicate ? dupPolicy : null,
      });
    }

    const saved = await insertResponse(connection, data, formKey, effectiveFormVersion, match, "pendente", match.status || "ambiguo");
    return res.json({ ok:true, pendente:true, protocolo:saved.protocolo });
  } catch (error) {
    if (transactionStarted) {
      try { await connection.rollback(); } catch (rollbackError) { console.error("[ProgramaIntegracao] rollback formulário público:", rollbackError); }
    }
    console.error("[ProgramaIntegracao] envio público:", error);
    return res.status(500).json({ ok:false, erro:"Não foi possível registrar a resposta. Tente novamente." });
  }
});
