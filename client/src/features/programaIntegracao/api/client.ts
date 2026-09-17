// ============================================================
// API CLIENT PARA PROGRAMA DE INTEGRAÇÃO
// ============================================================

import { BootstrapResponse, ProcessoIntegracao, BootstrapState } from '../types';
import { exigirConexaoParaAlterar } from '../helpers/connectionGuard';

const API_BASE = '/api/programa-integracao';

export type ProgramaIntegracaoConfigSection =
  | 'emails'
  | 'mentoras'
  | 'cursos'
  | 'plataformaCursos'
  | 'aviso'
  | 'links'
  | 'feriados'
  | 'formConfig'
  | 'formTextos';

const CAMPOS_TEXTO_CONFIRMACAO_PROCESSO: Array<keyof ProcessoIntegracao> = [
  'nome', 'cpf', 'nasc', 'email', 'emailCorporativo', 'tel', 'cargo', 'unidade',
  'tipo', 'inicio', 'part', 'situacao', 'gestor', 'gestorEmail', 'gestorTel',
  'anjo', 'anjoEmail', 'consultora', 'mentorId', 'ugp', 'horarios', 'statusPdi',
  'pendencias', 'statusCursos', 'consideracoes', 'notas', 'cor',
];

const CAMPOS_ESTADO_CONFIRMACAO_PROCESSO: Array<keyof ProcessoIntegracao> = [
  'feito', 'alin', 'bem', 'teste',
];

function textoConfirmacao(valor: unknown): string {
  return valor == null ? '' : String(valor);
}

function confirmarProcessoLido(
  legacyId: string,
  esperado: ProcessoIntegracao,
  lido: ProcessoIntegracao | undefined,
): void {
  if (!lido) {
    throw new Error('O servidor respondeu ao salvamento, mas o processo não apareceu na leitura de confirmação.');
  }

  for (const campo of CAMPOS_TEXTO_CONFIRMACAO_PROCESSO) {
    if (textoConfirmacao(lido[campo]) !== textoConfirmacao(esperado[campo])) {
      throw new Error(`O processo ${legacyId} foi salvo, mas o campo ${String(campo)} voltou diferente na conferência.`);
    }
  }

  for (const campo of CAMPOS_ESTADO_CONFIRMACAO_PROCESSO) {
    const atual = JSON.stringify(lido[campo] || {});
    const previsto = JSON.stringify(esperado[campo] || {});
    if (atual !== previsto) {
      throw new Error(`O processo ${legacyId} foi salvo, mas o estado ${String(campo)} voltou diferente na conferência.`);
    }
  }
}

async function confirmarProcessoPersistido(
  legacyId: string,
  esperado: ProcessoIntegracao,
): Promise<void> {
  const leitura = await fetchBootstrap();
  if (!leitura.ok || !leitura.state) {
    throw new Error('O dado foi enviado, mas não foi possível reler o Programa de Integração para confirmar a gravação.');
  }
  confirmarProcessoLido(legacyId, esperado, leitura.state.processos?.[legacyId]);
}

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
 * Salva APENAS uma seção autorizada da configuração.
 *
 * Esta é a operação preferida para as telas de Configurações. O servidor lê a
 * configuração atual, altera somente a seção pedida e preserva as demais
 * chaves. `ordem` e `respostasPendentes` deliberadamente não fazem parte deste
 * contrato.
 */
export async function salvarSecaoConfig<T = unknown>(
  section: ProgramaIntegracaoConfigSection,
  value: T,
): Promise<{ ok: boolean; section: ProgramaIntegracaoConfigSection; value: T }> {
  exigirConexaoParaAlterar();
  const response = await fetch(`${API_BASE}/config-sections/${encodeURIComponent(section)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error ? `: ${body.error}` : '';
    } catch {
      // Mantém a mensagem pelo status quando a resposta não for JSON.
    }
    throw new Error(`Failed to save config section ${section}: ${response.status}${detail}`);
  }

  return response.json();
}

/**
 * Salva um processo (PUT /api/programa-integracao/processos/:legacyId)
 * SEMPRE envia o processo COMPLETO. Nenhuma mutação parcial.
 * Depois do PUT, relê o bootstrap e compara os campos críticos antes de
 * considerar a operação confirmada.
 */
export async function salvarProcesso(
  legacyId: string,
  processo: ProcessoIntegracao,
  ordem: number = 0
): Promise<{ ok: boolean; processoId?: number }> {
  exigirConexaoParaAlterar();
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

  const resultado = await response.json();
  await confirmarProcessoPersistido(legacyId, processo);
  return resultado;
}

/**
 * Salva config global (PUT /api/programa-integracao/config).
 *
 * LEGADO: não usar para edição comum das telas de Configurações. Esse endpoint
 * também sincroniza a fila de respostas pendentes e um payload incompleto pode
 * alterar essa fila. Para novas funções, usar `salvarSecaoConfig`.
 */
export async function salvarConfig(
  config: Record<string, any>
): Promise<{ ok: boolean }> {
  exigirConexaoParaAlterar();
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
 * Arquiva/remove um processo (DELETE -> situacao='removido') e confirma por
 * nova leitura que ele não continua visível no bootstrap administrativo.
 */
export async function arquivarProcesso(legacyId: string): Promise<{ ok: boolean }> {
  exigirConexaoParaAlterar();
  const response = await fetch(`${API_BASE}/processos/${encodeURIComponent(legacyId)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to archive processo: ${response.status}`);
  }

  const resultado = await response.json();
  const leitura = await fetchBootstrap();
  if (!leitura.ok || !leitura.state) {
    throw new Error('O processo foi enviado para arquivamento, mas não foi possível confirmar a leitura depois da operação.');
  }
  if (leitura.state.processos?.[legacyId]) {
    throw new Error('O servidor respondeu ao arquivamento, mas o processo ainda aparece na leitura de confirmação.');
  }
  return resultado;
}

/**
 * Atualiza apenas o estado (feito/alin/bem/teste/timeline) de um processo.
 * Antes de gravar, confirma a posição atual no bootstrap para não sobrescrever
 * a ordem do processo com zero durante uma simples atualização de status.
 * Depois de gravar, relê e compara os campos críticos.
 */
export async function atualizarEstadoProcesso(
  legacyId: string,
  processoCompleto: ProcessoIntegracao
): Promise<{ ok: boolean; processoId?: number }> {
  exigirConexaoParaAlterar();
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

  const resultado = await response.json();
  await confirmarProcessoPersistido(legacyId, processoCompleto);
  return resultado;
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
