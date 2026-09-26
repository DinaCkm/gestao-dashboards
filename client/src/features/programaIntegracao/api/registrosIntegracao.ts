import { exigirConexaoParaAlterar } from '../helpers/connectionGuard';

const API_BASE = '/api/programa-integracao';

export type RegistroIntegracaoTipo = 'foto' | 'documento' | 'relato' | 'outro';
export type RegistroIntegracaoOrigem = 'Colaborador' | 'Gestor' | 'Anjo' | 'UGP' | 'CKM / Consultora';
export type RegistroIntegracaoAlinhamento = 'Preparação' | '15 dias' | '45 dias' | '75 dias' | '150 dias' | 'Geral';

export interface RegistroIntegracaoItem {
  id: string;
  tipo: RegistroIntegracaoTipo;
  titulo: string;
  descricao: string;
  dataAcontecimento: string;
  origem: RegistroIntegracaoOrigem;
  alinhamento: RegistroIntegracaoAlinhamento;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  hasFile: boolean;
  cadastradoPorUserId: number | null;
  cadastradoPorNome: string;
  cadastradoEm: string;
  atualizadoEm: string;
  excluidoEm: string | null;
  excluidoPorNome: string | null;
}

export interface RegistroIntegracaoPayload {
  tipo: RegistroIntegracaoTipo;
  titulo: string;
  descricao: string;
  dataAcontecimento: string;
  origem: RegistroIntegracaoOrigem;
  alinhamento: RegistroIntegracaoAlinhamento;
  fileName?: string;
  fileData?: string;
}

async function erroDaResposta(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return body?.error || fallback;
  } catch {
    return fallback;
  }
}

export async function listarRegistrosIntegracao(legacyId: string): Promise<RegistroIntegracaoItem[]> {
  const response = await fetch(`${API_BASE}/processos/${encodeURIComponent(legacyId)}/registros`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(await erroDaResposta(response, 'Não foi possível carregar os registros da integração.'));
  const body = await response.json();
  return Array.isArray(body?.registros) ? body.registros : [];
}

export async function criarRegistroIntegracao(legacyId: string, payload: RegistroIntegracaoPayload) {
  exigirConexaoParaAlterar();
  const response = await fetch(`${API_BASE}/processos/${encodeURIComponent(legacyId)}/registros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await erroDaResposta(response, 'Não foi possível criar o registro.'));
  return response.json();
}

export async function editarRegistroIntegracao(
  legacyId: string,
  registroId: string,
  payload: Omit<RegistroIntegracaoPayload, 'fileName' | 'fileData'>,
) {
  exigirConexaoParaAlterar();
  const response = await fetch(
    `${API_BASE}/processos/${encodeURIComponent(legacyId)}/registros/${encodeURIComponent(registroId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) throw new Error(await erroDaResposta(response, 'Não foi possível editar o registro.'));
  return response.json();
}

export async function excluirRegistroIntegracao(legacyId: string, registroId: string) {
  exigirConexaoParaAlterar();
  const response = await fetch(
    `${API_BASE}/processos/${encodeURIComponent(legacyId)}/registros/${encodeURIComponent(registroId)}`,
    { method: 'DELETE', headers: { 'Content-Type': 'application/json' } },
  );
  if (!response.ok) throw new Error(await erroDaResposta(response, 'Não foi possível excluir o registro.'));
  return response.json();
}

export async function restaurarRegistroIntegracao(legacyId: string, registroId: string) {
  exigirConexaoParaAlterar();
  const response = await fetch(
    `${API_BASE}/processos/${encodeURIComponent(legacyId)}/registros/${encodeURIComponent(registroId)}/restaurar`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' } },
  );
  if (!response.ok) throw new Error(await erroDaResposta(response, 'Não foi possível restaurar o registro.'));
  return response.json();
}

export async function obterArquivoRegistroIntegracao(
  legacyId: string,
  registroId: string,
): Promise<{ url: string; fileName: string; mimeType: string }> {
  const response = await fetch(
    `${API_BASE}/processos/${encodeURIComponent(legacyId)}/registros/${encodeURIComponent(registroId)}/arquivo`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
  );
  if (!response.ok) throw new Error(await erroDaResposta(response, 'Não foi possível abrir o arquivo.'));
  return response.json();
}
