// ============================================================
// API CLIENT PARA PROGRAMA DE INTEGRAÇÃO
// ============================================================

import { BootstrapResponse, ProcessoIntegracao, BootstrapState } from '../types';

const API_BASE = '/api/programa-integracao';

/**
 * Fetch bootstrap data (config, processos com estado)
 */
export async function fetchBootstrap(): Promise<BootstrapResponse> {
  const response = await fetch(`${API_BASE}/bootstrap`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch bootstrap: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Salva um processo (PUT /api/programa-integracao/processos/:legacyId)
 * Atualiza dados e estado (feito, alin, bem, teste)
 */
export async function salvarProcesso(
  legacyId: string,
  processo: ProcessoIntegracao,
  ordem: number = 0
): Promise<{ ok: boolean; processoId?: number }> {
  const response = await fetch(`${API_BASE}/processos/${encodeURIComponent(legacyId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      processo,
      ordem,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to save processo: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Salva config global (PUT /api/programa-integracao/config)
 */
export async function salvarConfig(
  config: Record<string, any>
): Promise<{ ok: boolean }> {
  const response = await fetch(`${API_BASE}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to save config: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Arquivo/remove um processo (PUT -> situacao='removido')
 */
export async function arquivarProcesso(legacyId: string): Promise<{ ok: boolean }> {
  const response = await fetch(`${API_BASE}/processos/${encodeURIComponent(legacyId)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to archive processo: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Atualiza apenas o estado (feito/alin/bem/teste/timeline) de um processo
 * Utiliza PUT /api/programa-integracao/processos/:legacyId
 */
export async function atualizarEstadoProcesso(
  legacyId: string,
  updates: {
    feito?: Record<string, any>;
    alin?: Record<string, any>;
    bem?: Record<string, any>;
    teste?: Record<string, any>;
    timeline?: any[];
    notas?: string;
  }
): Promise<{ ok: boolean; processoId?: number }> {
  const response = await fetch(`${API_BASE}/processos/${encodeURIComponent(legacyId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      processo: updates,
      ordem: 0,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update estado: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Exporta agenda como CSV
 */
export async function exportarAgendaCSV(
  processoId?: string,
  situacao: 'ativo' | 'encerrado' | 'todos' = 'ativo'
): Promise<Blob> {
  const params = new URLSearchParams();
  if (processoId) params.set('processoId', processoId);
  params.set('situacao', situacao);
  
  const response = await fetch(`${API_BASE}/export/agenda?${params}`, {
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to export agenda: ${response.status}`);
  }
  
  return response.blob();
}

/**
 * Helper: Inicia um novo processo com defaults
 */
export function criarNovoProcesso(dados: Partial<ProcessoIntegracao>): ProcessoIntegracao {
  const hoje = new Date().toISOString().split('T')[0];
  
  return {
    nome: dados.nome || '',
    cpf: dados.cpf || '',
    nasc: dados.nasc || '',
    email: dados.email || '',
    emailCorporativo: dados.emailCorporativo || '',
    tel: dados.tel || '',
    cargo: dados.cargo || '',
    unidade: dados.unidade || '',
    tipo: 'Onboarding',
    inicio: dados.inicio || hoje,
    part: 'Presencial',
    situacao: 'ativo',
    gestor: dados.gestor || '',
    gestorEmail: dados.gestorEmail || '',
    gestorTel: dados.gestorTel || '',
    anjo: dados.anjo || '',
    anjoEmail: dados.anjoEmail || '',
    consultora: dados.consultora || '',
    mentorId: dados.mentorId || '',
    ugp: dados.ugp || '',
    horarios: dados.horarios || '',
    statusPdi: dados.statusPdi || '',
    pendencias: '',
    statusCursos: '',
    consideracoes: dados.consideracoes || '',
    notas: dados.notas || '',
    cor: dados.cor || '',
    feito: {},
    alin: {},
    bem: {},
    teste: {},
    resp: [],
  };
}

