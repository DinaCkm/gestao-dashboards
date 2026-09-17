import { exigirConexaoParaAlterar } from '../helpers/connectionGuard';

export type VincularPendentePayload = {
  processoId: string;
  cycle?: number;
  role?: string;
};

export type RebuscarPendentePayload = {
  nomeColaborador: string;
  unidade?: string;
  dataInicio?: string;
  emailColaborador?: string;
};

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return body?.error ? String(body.error) : fallback;
  } catch {
    return fallback;
  }
}

export async function rebuscarRespostaPendente(
  legacyRid: string,
  payload: RebuscarPendentePayload,
): Promise<{ ok: boolean; status: string; candidatos: any[] }> {
  exigirConexaoParaAlterar();
  const response = await fetch(
    `/api/programa-integracao/respostas-pendentes/${encodeURIComponent(legacyRid)}/rebuscar`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await readError(response, `Não foi possível buscar novamente (${response.status}).`));
  }

  return response.json();
}

export async function vincularRespostaPendente(
  legacyRid: string,
  payload: VincularPendentePayload,
): Promise<{ ok: boolean; resposta?: { legacyRid: string; processoId: string; ciclo: number; papel: string; itemId: string } }> {
  exigirConexaoParaAlterar();
  const response = await fetch(
    `/api/programa-integracao/respostas-pendentes/${encodeURIComponent(legacyRid)}/vincular`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await readError(response, `Não foi possível vincular a resposta (${response.status}).`));
  }

  return response.json();
}

export async function criarProcessoDaRespostaPendente(
  legacyRid: string,
): Promise<{ ok: boolean; processoId: string; nome: string }> {
  exigirConexaoParaAlterar();
  const response = await fetch(
    `/api/programa-integracao/respostas-pendentes/${encodeURIComponent(legacyRid)}/criar-processo`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (!response.ok) {
    throw new Error(await readError(response, `Não foi possível criar o processo (${response.status}).`));
  }

  return response.json();
}

export async function descartarRespostaPendente(
  legacyRid: string,
): Promise<{ ok: boolean }> {
  exigirConexaoParaAlterar();
  const response = await fetch(
    `/api/programa-integracao/respostas-pendentes/${encodeURIComponent(legacyRid)}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (!response.ok) {
    throw new Error(await readError(response, `Não foi possível descartar a resposta (${response.status}).`));
  }

  return response.json();
}
