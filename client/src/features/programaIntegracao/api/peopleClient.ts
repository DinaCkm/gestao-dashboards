import type { BootstrapState, ProcessoIntegracao } from '../types';
import { exigirConexaoParaAlterar } from '../helpers/connectionGuard';
import { MENTORA_DEMO, montarProcessoDemonstracao } from '../helpers/demoProcesso';
import { fetchBootstrap } from './client';

async function apiJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const metodo = String(init?.method || 'GET').toUpperCase();
  if (metodo !== 'GET' && metodo !== 'HEAD') exigirConexaoParaAlterar();

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
  const cores = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#6b3e8f', '#9333ea', '#0f766e'];
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

function gerarLegacyIdDemo() {
  return `demo${Date.now().toString(36)}`;
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
  exigirConexaoParaAlterar();
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

export interface DadosProcessoTesteVazio {
  nome: string;
  cpf: string;
  email?: string;
  cargo?: string;
  unidade?: string;
  inicio?: string;
  gestor?: string;
  gestorEmail?: string;
  anjo?: string;
  anjoEmail?: string;
  consultora?: string;
  consideracoes?: string;
}

export async function criarProcessoTesteVazioSeguro(
  dados: DadosProcessoTesteVazio,
  indice: number,
) {
  exigirConexaoParaAlterar();
  const nome = String(dados.nome || '').trim();
  const cpf = String(dados.cpf || '').trim();
  if (!nome || !cpf) throw new Error('Informe nome e CPF para criar o teste.');

  let ultimaFalha: unknown = null;
  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    const legacyId = gerarLegacyId() + (tentativa ? tentativa.toString(36) : '');
    const processo: ProcessoIntegracao = {
      ...novoProcessoVazio(nome, cpf, indice),
      email: String(dados.email || '').trim(),
      cargo: String(dados.cargo || '').trim(),
      unidade: String(dados.unidade || '').trim(),
      inicio: String(dados.inicio || hojeIso()).slice(0, 10),
      gestor: String(dados.gestor || '').trim(),
      gestorEmail: String(dados.gestorEmail || '').trim(),
      anjo: String(dados.anjo || '').trim(),
      anjoEmail: String(dados.anjoEmail || '').trim(),
      consultora: String(dados.consultora || '').trim(),
      consideracoes: String(
        dados.consideracoes || 'REGISTRO FICTÍCIO PARA TESTE DE FORMULÁRIOS',
      ).trim(),
      notas: 'Criado pelo modo de teste vazio. Nenhum formulário foi preenchido automaticamente.',
      feito: {},
      alin: {},
      bem: {},
      teste: { ...(novoProcessoVazio(nome, cpf, indice).teste || {}), modoTesteFormularioVazio: true },
      resp: [],
    };

    try {
      await apiJson('/api/programa-integracao/processos', {
        method: 'POST',
        body: JSON.stringify({ legacyId, ordem: indice, processo }),
      });
      const state = await confirmarProcesso(legacyId);
      const lido = state.processos[legacyId];
      if (!lido) throw new Error('O teste foi criado, mas não voltou na confirmação.');
      if ((lido.resp || []).length !== 0) {
        throw new Error('O teste voltou com respostas de formulário, quando deveria estar vazio.');
      }
      if (Object.keys(lido.feito || {}).length !== 0) {
        throw new Error('O teste voltou com ações marcadas, quando deveria iniciar vazio.');
      }
      return { legacyId, processo: { ...lido, id: legacyId }, state, respostas: 0 };
    } catch (error) {
      ultimaFalha = error;
      if (!(error instanceof Error) || !error.message.toLowerCase().includes('identificador já existe')) throw error;
    }
  }

  throw ultimaFalha instanceof Error
    ? ultimaFalha
    : new Error('Não foi possível gerar um identificador exclusivo para o teste vazio.');
}

export async function criarProcessoDemonstracaoSeguro(feriados: string[] = []) {
  exigirConexaoParaAlterar();
  let ultimaFalha: unknown = null;

  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    const legacyId = `${gerarLegacyIdDemo()}${tentativa ? tentativa.toString(36) : ''}`;
    const processo = montarProcessoDemonstracao(
      legacyId,
      'm-demo-adriana',
      MENTORA_DEMO.nome,
      feriados,
    );
    const esperadoRespostas = processo.resp?.length || 0;

    try {
      const retorno = await apiJson<{ ok: boolean; legacyId: string; respostas: number; mentoraId: string }>(
        '/api/programa-integracao/processos/demo',
        {
          method: 'POST',
          body: JSON.stringify({ confirmacao: 'CRIAR_DEMO', legacyId, processo }),
        },
      );
      if (retorno.legacyId !== legacyId || retorno.respostas !== esperadoRespostas) {
        throw new Error('O servidor criou a demonstração, mas o resumo retornado não corresponde ao modelo esperado.');
      }

      const state = await confirmarProcesso(legacyId);
      const lido = state.processos[legacyId];
      if (lido.nome !== processo.nome || lido.situacao !== 'ativo') {
        throw new Error('A demonstração foi criada, mas os dados principais voltaram diferentes na leitura de confirmação.');
      }
      if ((lido.resp || []).length !== esperadoRespostas) {
        throw new Error(`A demonstração foi criada, mas a confirmação retornou ${(lido.resp || []).length} de ${esperadoRespostas} resposta(s).`);
      }
      if (lido.mentorId !== retorno.mentoraId || lido.consultora !== MENTORA_DEMO.nome) {
        throw new Error('A demonstração foi criada, mas o vínculo da mentora não voltou como esperado.');
      }
      if (lido.feito?.['pos4-07']?.s || lido.feito?.['pos4-09']?.s) {
        throw new Error('A demonstração voltou com as pendências finais marcadas indevidamente.');
      }

      return { legacyId, processo: { ...lido, id: legacyId }, state, respostas: esperadoRespostas };
    } catch (error) {
      ultimaFalha = error;
      if (!(error instanceof Error) || !error.message.toLowerCase().includes('identificador')) throw error;
    }
  }

  throw ultimaFalha instanceof Error
    ? ultimaFalha
    : new Error('Não foi possível criar um identificador exclusivo para a demonstração.');
}

export async function alterarSituacaoProcessoSeguro(legacyId: string, situacao: 'ativo' | 'encerrado') {
  exigirConexaoParaAlterar();
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
  exigirConexaoParaAlterar();
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
