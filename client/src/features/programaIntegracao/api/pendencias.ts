export type VincularPendentePayload = {
  processoId: string;
  cycle?: number;
  role?: string;
};

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return body?.error ? String(body.error) : fallback;
  } catch {
    return fallback;
  }
}

export async function vincularRespostaPendente(
  legacyRid: string,
  payload: VincularPendentePayload,
): Promise<{ ok: boolean; resposta?: { legacyRid: string; processoId: string; ciclo: number; papel: string; itemId: string } }> {
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

export async function descartarRespostaPendente(
  legacyRid: string,
): Promise<{ ok: boolean }> {
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
