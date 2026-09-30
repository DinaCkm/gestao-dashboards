const BASE = '/api/programa-integracao/processos';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  let body: any = null;
  try { body = await response.json(); } catch { body = null; }
  if (!response.ok) throw new Error(String(body?.error || `Erro ${response.status}`));
  return body as T;
}

export interface AvaliacaoPotencialResultado {
  sintese: string;
  caracteristicasComportamentais: string[];
  competenciasObservadas: string[];
  convergencias: string[];
  pontosAtencao: string[];
  desenvolvimento: string[];
  aderenciaDemandas: string;
  recomendacoes: string[];
  limitacoes: string[];
}

export interface AvaliacaoPotencialSnapshot {
  versao: number;
  geradaEm: string;
  alunoId: number;
  modelo?: string;
  fontes?: Record<string, any>;
  resultado: AvaliacaoPotencialResultado;
  recomendacoesConsultoria?: Array<{
    nome: string;
    descricao: string;
    desenvolvimento: string;
  }>;
}

export interface SugestaoDesenvolvimento {
  id: string;
  titulo: string;
  comoFazer: string;
  comprovacao: string;
  prazoSugerido?: string;
  status: 'sugerida' | 'descartada' | 'inserida';
  sessionId?: number | null;
}

export interface TarefaCompetenciaPreview {
  id: string;
  titulo: string;
  comoFazer: string;
  comprovacao: string;
  criada: boolean;
  sessionId: number | null;
  prazo: string;
}

export interface CompetenciaTarefasPreview {
  nome: string;
  correspondencia: boolean;
  numero: number | null;
  tarefas: TarefaCompetenciaPreview[];
}

export interface TarefasCompetenciasPreview {
  disponivel: boolean;
  prazoSugerido: string | null;
  bloqueio: string;
  competencias: CompetenciaTarefasPreview[];
  criadasAtivas: Array<{
    bibliotecaId: string;
    competencia: string;
    titulo: string;
    sessionId: number;
    prazo: string;
  }>;
}

export interface ContextoAvaliacaoPotencial {
  ok: true;
  colaborador: { nome: string; cargo: string; unidade: string };
  vinculo: {
    seguro: boolean;
    motivo: string;
    precisaConfirmacao?: boolean;
    alunoId?: number;
    modo?: string;
    aluno: { id: number; nome: string; email: string } | null;
  };
  fontes: {
    bem: boolean;
    disc: boolean;
    autoavaliacoes: number;
    competenciasMentora: string[];
    observacoesMentora: string[];
  };
  avaliacao: AvaliacaoPotencialSnapshot | null;
  sugestoes: { itens: SugestaoDesenvolvimento[] } | null;
  tarefasPadrao: any;
  tarefasGestorPreview: {
    disponivel: boolean;
    prazo: string | null;
    faltantes: string[];
    bloqueio: string;
    itens: Array<{ titulo: string; descricao: string; prazo?: string | null }>;
  };
  tarefasCompetenciasPreview: TarefasCompetenciasPreview;
}

export async function buscarContextoAvaliacaoPotencial(legacyId: string) {
  return api<ContextoAvaliacaoPotencial>(`${BASE}/${encodeURIComponent(legacyId)}/avaliacao-potencial/contexto`);
}

export async function confirmarVinculoAvaliacaoPotencial(legacyId: string, alunoId: number) {
  return api<{ ok: true }>(`${BASE}/${encodeURIComponent(legacyId)}/vinculo-eco/confirmar-automacoes`, {
    method: 'POST',
    body: JSON.stringify({ alunoId }),
  });
}

export async function alterarVinculoAvaliacaoPotencial(legacyId: string, alunoId: number | null) {
  return api<{ ok: true; aluno: { id: number; nome: string; email: string } | null }>(
    `${BASE}/${encodeURIComponent(legacyId)}/vinculo-eco/alterar`,
    {
      method: 'POST',
      body: JSON.stringify({ alunoId }),
    },
  );
}

export async function gerarAvaliacaoPotencial(legacyId: string) {
  return api<{ ok: true; avaliacao: AvaliacaoPotencialSnapshot }>(`${BASE}/${encodeURIComponent(legacyId)}/avaliacao-potencial/gerar`, { method: 'POST' });
}

export async function criarTarefasGestorIntegracao(legacyId: string) {
  return api<{ ok: true; criadas: number; sessionIds: number[]; prazo: string }>(`${BASE}/${encodeURIComponent(legacyId)}/tarefas-gestor/criar`, { method: 'POST' });
}

export async function reverterTarefasGestorIntegracao(legacyId: string) {
  return api<{ ok: true; revertidas: number }>(`${BASE}/${encodeURIComponent(legacyId)}/tarefas-gestor/reverter`, { method: 'POST' });
}

export async function criarTarefasCompetenciasIntegracao(
  legacyId: string,
  tarefaIds: string[],
  prazo: string,
) {
  return api<{ ok: true; criadas: number; sessionIds: number[]; prazo: string }>(
    `${BASE}/${encodeURIComponent(legacyId)}/tarefas-competencias/criar`,
    {
      method: 'POST',
      body: JSON.stringify({ tarefaIds, prazo }),
    },
  );
}

export async function reverterTarefasCompetenciasIntegracao(
  legacyId: string,
  tarefaIds?: string[],
) {
  return api<{ ok: true; revertidas: number }>(
    `${BASE}/${encodeURIComponent(legacyId)}/tarefas-competencias/reverter`,
    {
      method: 'POST',
      body: JSON.stringify({ tarefaIds: tarefaIds || [] }),
    },
  );
}

export async function gerarSugestoesDesenvolvimento(legacyId: string) {
  return api<{ ok: true; sugestoes: { itens: SugestaoDesenvolvimento[] } }>(`${BASE}/${encodeURIComponent(legacyId)}/sugestoes-desenvolvimento/gerar`, { method: 'POST' });
}

export async function descartarSugestaoDesenvolvimento(legacyId: string, sugestaoId: string) {
  return api<{ ok: true }>(`${BASE}/${encodeURIComponent(legacyId)}/sugestoes-desenvolvimento/${encodeURIComponent(sugestaoId)}/descartar`, { method: 'POST' });
}

export async function regenerarSugestaoDesenvolvimento(legacyId: string, sugestaoId: string) {
  return api<{ ok: true; sugestao: SugestaoDesenvolvimento }>(`${BASE}/${encodeURIComponent(legacyId)}/sugestoes-desenvolvimento/${encodeURIComponent(sugestaoId)}/regenerar`, { method: 'POST' });
}

export async function inserirSugestaoDesenvolvimento(legacyId: string, sugestaoId: string) {
  return api<{ ok: true; sessionId: number; prazo: string }>(`${BASE}/${encodeURIComponent(legacyId)}/sugestoes-desenvolvimento/${encodeURIComponent(sugestaoId)}/inserir`, { method: 'POST' });
}

export async function reverterInsercaoSugestaoDesenvolvimento(legacyId: string, sugestaoId: string) {
  return api<{ ok: true }>(`${BASE}/${encodeURIComponent(legacyId)}/sugestoes-desenvolvimento/${encodeURIComponent(sugestaoId)}/reverter-insercao`, { method: 'POST' });
}
