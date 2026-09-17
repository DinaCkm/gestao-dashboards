import type { BootstrapState, ProcessoIntegracao } from '../types';
import { fetchBootstrap } from './client';

async function apiJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || 'Não foi possível concluir a operação.');
  return payload as T;
}

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

function novaCor(indice: number) {
  const cores = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#9333ea', '#0f766e'];
  return cores[Math.abs(indice) % cores.length];
}

export function novoProcessoVazio(nome: string, cpf: string, indice: number): ProcessoIntegracao {
  return {
    nome: nome.trim(),
    cpf: cpf.trim(),
    nasc: '',
    email: '',
    emailCorporativo: '',
    tel: '',
    cargo: '',
    unidade: '',
    tipo: 'Onboarding',
    inicio: hojeIso(),
    part: 'Presencial',
    situacao: 'ativo',
    gestor: '',
    gestorEmail: '',
    gestorTel: '',
    anjo: '',
    anjoEmail: '',
    consultora: '',
    mentorId: '',
    ugp: 'Elisângela/UGP',
    horarios: '09h00\n14h00\n16h30',
    statusPdi: '',
    pendencias: '',
    statusCursos: '',
    consideracoes: '',
    notas: '',
    cor: novaCor(indice),
    feito: {},
    alin: {},
    bem: {},
    teste: {},
    resp: [],
  };
}

function gerarLegacyId() {
  return `p${Date.now().toString(36)}`;
}

async function confirmarProcesso(legacyId: string): Promise<BootstrapState> {
  const bootstrap = await fetchBootstrap();
  if (!bootstrap.ok || !bootstrap.state) {
    throw new Error('A alteração foi enviada, mas não foi possível confirmar a leitura depois da gravação.');
  }
  if (!bootstrap.state.processos?.[legacyId]) {
    throw new Error('A alteração foi enviada, mas o processo não apareceu na confirmação de leitura.');
  }
  return bootstrap.state;
}

export async function criarProcessoSeguro(nome: string, cpf: string, indice: number) {
  let ultimaFalha: unknown = null;
  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    const legacyId = gerarLegacyId() + (tentativa ? tentativa.toString(36) : '');
    const processo = novoProcessoVazio(nome, cpf, indice);
    try {
      await apiJson('/api/programa-integracao/processos', {
        method: 'POST',
        body: JSON.stringify({ legacyId, ordem: indice, processo }),
      });
      const state = await confirmarProcesso(legacyId);
      return { legacyId, processo: { ...state.processos[legacyId], id: legacyId }, state };
    } catch (error) {
      ultimaFalha = error;
      if (!(error instanceof Error) || !error.message.toLowerCase().includes('identificador já existe')) throw error;
    }
  }
  throw ultimaFalha instanceof Error
    ? ultimaFalha
    : new Error('Não foi possível gerar um identificador exclusivo para a nova pessoa.');
}

export async function alterarSituacaoProcessoSeguro(legacyId: string, situacao: 'ativo' | 'encerrado') {
  await apiJson(`/api/programa-integracao/processos/${encodeURIComponent(legacyId)}/situacao`, {
    method: 'PATCH',
    body: JSON.stringify({ situacao }),
  });
  const state = await confirmarProcesso(legacyId);
  if (state.processos[legacyId]?.situacao !== situacao) {
    throw new Error('A situação foi enviada, mas a confirmação de leitura não correspondeu ao valor gravado.');
  }
  return state;
}

export async function reordenarProcessosSeguro(ordem: string[]) {
  await apiJson('/api/programa-integracao/processos/ordem', {
    method: 'PATCH',
    body: JSON.stringify({ ordem }),
  });
  const bootstrap = await fetchBootstrap();
  if (!bootstrap.ok || !bootstrap.state) {
    throw new Error('A ordem foi enviada, mas não foi possível confirmar a leitura depois da gravação.');
  }
  const confirmada = bootstrap.state.config?.ordem || [];
  if (confirmada.length !== ordem.length || confirmada.some((id, index) => id !== ordem[index])) {
    throw new Error('A ordem foi enviada, mas a confirmação de leitura ficou diferente do solicitado.');
  }
  return bootstrap.state;
}
