import type { BootstrapState, ProcessoIntegracao } from '../types';
import { atualizarEstadoProcesso, fetchBootstrap } from '../api/client';

/**
 * Adaptador de compatibilidade entre a Trilha de Integracao historica e o EcoLider.
 *
 * Objetivo: permitir portar a logica original quase literalmente sem recriar regras
 * de negocio, mantendo a persistencia real sob controle da API atual.
 *
 * Regras de seguranca:
 * - leitura parte sempre do bootstrap atual do servidor;
 * - nenhuma escrita global de configuracao e feita aqui;
 * - processo so e persistido pelo endpoint ja existente e com objeto completo;
 * - o adaptador nunca cria, remove ou reordena processos automaticamente.
 */

export interface LegacyState {
  config: BootstrapState['config'];
  processos: Record<string, ProcessoIntegracao>;
}

export interface LegacyRuntime {
  state: LegacyState;
  ordem: () => string[];
  P: (id: string) => ProcessoIntegracao | null;
  ativos: () => string[];
  encerrados: () => string[];
  salvarProc: (id: string) => Promise<void>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function bootstrapParaLegacy(state: BootstrapState): LegacyState {
  return {
    config: clone(state.config || ({ ordem: [], respostasPendentes: [] } as BootstrapState['config'])),
    processos: clone(state.processos || {}),
  };
}

export async function carregarLegacyState(): Promise<LegacyState> {
  const bootstrap = await fetchBootstrap();
  if (!bootstrap?.ok || !bootstrap.state) {
    throw new Error('Nao foi possivel carregar os dados do Programa de Integracao.');
  }
  return bootstrapParaLegacy(bootstrap.state);
}

export function criarLegacyRuntime(stateInicial: LegacyState): LegacyRuntime {
  const state = bootstrapParaLegacy(stateInicial as BootstrapState);

  const ordem = () => {
    const configurada = Array.isArray(state.config?.ordem) ? state.config.ordem : [];
    const existentes = Object.keys(state.processos || {});
    const vistos = new Set<string>();
    return [...configurada, ...existentes].filter((id) => {
      if (!id || vistos.has(id) || !state.processos[id]) return false;
      vistos.add(id);
      return true;
    });
  };

  const P = (id: string): ProcessoIntegracao | null => state.processos[id] || null;
  const ativos = () => ordem().filter((id) => P(id)?.situacao !== 'encerrado');
  const encerrados = () => ordem().filter((id) => P(id)?.situacao === 'encerrado');

  const salvarProc = async (id: string) => {
    const processo = P(id);
    if (!processo) throw new Error(`Processo ${id} nao encontrado.`);
    await atualizarEstadoProcesso(id, clone(processo));
  };

  return { state, ordem, P, ativos, encerrados, salvarProc };
}

/**
 * Sincroniza novamente a memoria do adaptador com o servidor.
 * Util para o futuro modo de compatibilidade/offline sem assumir que uma escrita
 * local foi aceita pela API.
 */
export async function recarregarLegacyRuntime(): Promise<LegacyRuntime> {
  return criarLegacyRuntime(await carregarLegacyState());
}
