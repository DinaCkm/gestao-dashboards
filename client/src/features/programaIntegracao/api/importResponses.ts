import type { FormImportKey } from '../helpers/registrarRespostasParser';
import { exigirConexaoParaAlterar } from '../helpers/connectionGuard';

const API_BASE = '/api/programa-integracao';

export type DuplicateAction = 'sub' | 'reg' | 'skip';

export interface ImportResponseItemPayload {
  targetId: string;
  nome: string;
  cycle: number;
  role: string;
  evaluator: string;
  when: string;
  dateIso: string;
  pairs: Array<[number, string]>;
  duplicateAction: DuplicateAction;
}

export interface ImportBatchSummary {
  registradas: number;
  substituidas: number;
  adicionais: number;
  ignoradas: number;
  processosAtualizados: number;
}

export async function importarRespostasEmLote(
  formKey: FormImportKey,
  items: ImportResponseItemPayload[],
): Promise<{ ok: boolean; resumo: ImportBatchSummary }> {
  exigirConexaoParaAlterar();
  const response = await fetch(`${API_BASE}/respostas/importar-lote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ formKey, items }),
  });

  if (!response.ok) {
    let message = `Falha ao registrar respostas (${response.status}).`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // Mantém a mensagem baseada no status quando a resposta não for JSON.
    }
    throw new Error(message);
  }

  return response.json();
}
