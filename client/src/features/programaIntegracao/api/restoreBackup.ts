import type { BootstrapState } from '../types';
import { exigirConexaoParaAlterar } from '../helpers/connectionGuard';

export async function restaurarBackupProtegido(state: BootstrapState): Promise<{ ok: boolean; resumo: { processos: number; respostas: number; pendentes: number } }> {
  exigirConexaoParaAlterar();
  const response = await fetch('/api/programa-integracao/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmacao: 'RESTAURAR', state }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || `Falha na restauração: ${response.status}`);
  return body;
}
