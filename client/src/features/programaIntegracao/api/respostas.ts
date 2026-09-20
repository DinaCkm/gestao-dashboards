import { exigirConexaoParaAlterar } from '../helpers/connectionGuard';

export type AtualizarRespostaPayload = {
  ciclo: number;
  papel: string;
  avaliador: string;
  quando: string;
  pairs: Array<[number, string]>;
};

export type AtualizarRespostaResult = {
  ok: boolean;
  media: number | null;
  alertas: number[];
};

export async function atualizarRespostaRecebida(
  legacyRid: string,
  payload: AtualizarRespostaPayload,
): Promise<AtualizarRespostaResult> {
  exigirConexaoParaAlterar();
  const response = await fetch(`/api/programa-integracao/respostas/${encodeURIComponent(legacyRid)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error ? `: ${body.error}` : '';
    } catch {
      // Mantém o status HTTP quando a resposta não é JSON.
    }
    throw new Error(`Não foi possível atualizar a resposta (${response.status})${detail}`);
  }

  return response.json();
}

export async function arquivarRespostaRecebida(
  legacyRid: string,
): Promise<{ ok: boolean }> {
  exigirConexaoParaAlterar();
  const response = await fetch(`/api/programa-integracao/respostas/${encodeURIComponent(legacyRid)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error ? `: ${body.error}` : '';
    } catch {
      // Mantém o status HTTP quando a resposta não é JSON.
    }
    throw new Error(`Não foi possível arquivar a resposta (${response.status})${detail}`);
  }

  return response.json();
}


export type RespostaExcluida = {
  rid: string;
  protocolo: string;
  form: 'controle' | 'bem' | 'pesquisa' | 'aval' | 'pdi';
  ciclo: number;
  papel: string;
  quando: string;
  em: string;
  itid: string;
  nomeOrig: string;
  avaliador: string;
  c: Array<[number, string]>;
  media: number | null;
  alertas: number[];
  source: string;
  status: string;
  formVersion: number;
  processId: string;
  respondentName: string;
  respondentEmail: string;
  submittedAt: string;
  answers: Record<string, any>;
  processoIdLocal: string;
  processoNome: string;
  processoSituacao: string;
  excluidaEm: string;
};

export async function listarRespostasExcluidas(): Promise<RespostaExcluida[]> {
  const response = await fetch('/api/programa-integracao/respostas-excluidas', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error ? `: ${body.error}` : '';
    } catch {
      // Mantém o status HTTP quando a resposta não é JSON.
    }
    throw new Error(`Não foi possível carregar as respostas excluídas (${response.status})${detail}`);
  }

  const body = await response.json();
  return Array.isArray(body?.respostas) ? body.respostas : [];
}

export async function restaurarRespostaRecebida(
  legacyRid: string,
): Promise<{ ok: boolean; itemId?: string; itemMarcadoComoFeito?: boolean; outraRespostaAtiva?: boolean }> {
  exigirConexaoParaAlterar();
  const response = await fetch(`/api/programa-integracao/respostas/${encodeURIComponent(legacyRid)}/restaurar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error ? `: ${body.error}` : '';
    } catch {
      // Mantém o status HTTP quando a resposta não é JSON.
    }
    throw new Error(`Não foi possível restaurar a resposta (${response.status})${detail}`);
  }

  return response.json();
}
