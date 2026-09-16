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
