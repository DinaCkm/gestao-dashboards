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
 * SEMPRE envia o processo COMPLETO. Nenhuma mutação parcial.
 */
export async function salvarProcesso(
  legacyId: string,
  processo: ProcessoIntegracao,
  ordem: number = 0
): Promise<{ ok: boolean; processoId?: number }> {
  // Validar que processo não é parcial
  if (!processo.nome || !processo.cpf) {
    throw new Error('Processo incompleto: nome e CPF são obrigatórios');
  }
  
  const response = await fetch(`${API_BASE}/processos/${encodeURIComponent(legacyId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      processo, // Sempre processo COMPLETO
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
 * Arquivo/remove um processo (DELETE -> situacao='removido')
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
 * Atualiza apenas o estado (feito/alin/bem/teste/timeline) de um processo.
 * Antes de gravar, confirma a posição atual no bootstrap para não sobrescrever
 * a ordem do processo com zero durante uma simples atualização de status.
 */
export async function atualizarEstadoProcesso(
  legacyId: string,
  processoCompleto: ProcessoIntegracao
): Promise<{ ok: boolean; processoId?: number }> {
  // Validar que processo é completo
  if (!processoCompleto.nome || !processoCompleto.cpf) {
    throw new Error('Processo incompleto: nome e CPF são obrigatórios');
  }

  const bootstrap = await fetchBootstrap();
  const ordemAtual = Object.keys(bootstrap.state?.processos || {}).indexOf(legacyId);

  // Falha fechada: se não conseguirmos confirmar a posição atual, não gravamos.
  if (ordemAtual < 0) {
    throw new Error('Não foi possível confirmar a ordem atual do processo antes de salvar.');
  }

  const response = await fetch(`${API_BASE}/processos/${encodeURIComponent(legacyId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      processo: processoCompleto, // Sempre COMPLETO
      ordem: ordemAtual,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update estado: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Gera CSV da agenda no cliente (sem chamar endpoint inexistente)
 * Converte processos em linhas CSV e retorna um Blob
 */
export function gerarAgendaCSV(
  processos: ProcessoIntegracao[],
  situacao: 'ativo' | 'encerrado' | 'todos' = 'ativo'
): Blob {
  // Filtrar por situação
  const processosFiltered = processos.filter(p => {
    if (situacao === 'todos') return true;
    return p.situacao === situacao;
  });

  // Cabeçalho
  const headers = [
    'Nome',
    'CPF',
    'Email',
    'Email Corporativo',
    'Cargo',
    'Unidade',
    'Data Início',
    'Gestor',
    'Anjo/Responsável',
    'Situação',
    'Status PDI',
    'Observações',
  ];

  // Linhas
  const rows = processosFiltered.map(p => [
    p.nome || '',
    p.cpf || '',
    p.email || '',
    p.emailCorporativo || '',
    p.cargo || '',
    p.unidade || '',
    p.inicio || '',
    p.gestor || '',
    p.anjo || '',
    p.situacao || '',
    p.statusPdi || '',
    p.notas || '',
  ]);

  // Escapar CSV
  const escapeCSV = (field: string) => {
    if (!field) return '';
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  // Montar CSV
  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ].join('\n');

  // Retornar como Blob
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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

