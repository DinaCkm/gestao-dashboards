import type { BootstrapState } from '../types';

export interface PontoRestauracaoLocal {
  id: string;
  em: string;
  quando: string;
  nota: string;
  auto: boolean;
  tam: string;
  pessoas: number;
  dados: string;
}

const BK_LS = 'programa-integracao-backups-local';
const BK_LIMITE = 12;
const BK_MAX_PROCESSOS = 5000;
const BK_MAX_CARACTERES = 25_000_000;

function hojeIsoLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

function quandoLocal(): string {
  return new Date().toLocaleString('pt-BR');
}

function objetoSimples(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function identificadorBackupValido(id: string): boolean {
  return Boolean(id) && id === id.trim() && id.length <= 100;
}

export function tamanhoBackup(txt: string): string {
  const kb = Math.round(txt.length / 1024);
  return kb > 1024 ? `${(kb / 1024).toFixed(1).replace('.', ',')} MB` : `${kb} KB`;
}

export function listarPontosLocais(): PontoRestauracaoLocal[] {
  if (typeof window === 'undefined') return [];
  try {
    const bruto = window.localStorage.getItem(BK_LS);
    const lista = bruto ? JSON.parse(bruto) : [];
    if (!Array.isArray(lista)) return [];
    return lista
      .filter((item) => item && typeof item === 'object' && typeof item.id === 'string' && typeof item.dados === 'string')
      .sort((a, b) => String(b.em || '').localeCompare(String(a.em || '')))
      .slice(0, BK_LIMITE);
  } catch {
    return [];
  }
}

function salvarListaLocal(lista: PontoRestauracaoLocal[]): PontoRestauracaoLocal[] {
  const ordenada = [...lista]
    .sort((a, b) => String(b.em || '').localeCompare(String(a.em || '')))
    .slice(0, BK_LIMITE);
  window.localStorage.setItem(BK_LS, JSON.stringify(ordenada));
  return ordenada;
}

export function criarPontoLocal(
  state: BootstrapState,
  nota = '',
  auto = false,
): PontoRestauracaoLocal[] {
  if (typeof window === 'undefined') return [];
  const dados = JSON.stringify(state);
  const hoje = hojeIsoLocal();
  const ponto: PontoRestauracaoLocal = {
    id: auto ? `auto-${hoje}` : `bk${Date.now().toString(36)}`,
    em: new Date().toISOString(),
    quando: quandoLocal(),
    nota: nota || (auto ? 'Cópia automática do dia' : ''),
    auto,
    tam: tamanhoBackup(dados),
    pessoas: Object.keys(state.processos || {}).length,
    dados,
  };

  const atuais = listarPontosLocais();
  const semMesmoId = atuais.filter((item) => item.id !== ponto.id);
  return salvarListaLocal([ponto, ...semMesmoId]);
}

export function garantirPontoAutomaticoDoDia(state: BootstrapState): PontoRestauracaoLocal[] {
  const lista = listarPontosLocais();
  if (!Object.keys(state.processos || {}).length) return lista;
  const idHoje = `auto-${hojeIsoLocal()}`;
  if (lista.some((item) => item.id === idHoje)) return lista;
  return criarPontoLocal(state, '', true);
}

export function removerPontoLocal(id: string): PontoRestauracaoLocal[] {
  if (typeof window === 'undefined') return [];
  return salvarListaLocal(listarPontosLocais().filter((item) => item.id !== id));
}

export function baixarTextoJson(nomeArquivo: string, conteudo: string): void {
  const blob = new Blob([conteudo], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function baixarBackupCompleto(state: BootstrapState): void {
  const nome = `trilha-integracao-${hojeIsoLocal()}.json`;
  baixarTextoJson(nome, JSON.stringify(state, null, 1));
}

export function baixarPontoLocal(ponto: PontoRestauracaoLocal): void {
  baixarTextoJson(`trilha-integracao-${ponto.id}.json`, ponto.dados);
}

export function validarArquivoBackupTexto(texto: string): { ok: true; state: BootstrapState; quantidade: number; nomes: string[] } | { ok: false; erro: string } {
  try {
    if (texto.length > BK_MAX_CARACTERES) {
      return { ok: false, erro: 'O arquivo excede o limite seguro para restauração administrativa.' };
    }

    const state = JSON.parse(texto) as BootstrapState;
    if (!objetoSimples(state) || !objetoSimples(state.config) || !objetoSimples(state.processos)) {
      return { ok: false, erro: 'Esse arquivo não parece um backup do Programa de Integração.' };
    }

    const ids = Object.keys(state.processos);
    if (ids.length > BK_MAX_PROCESSOS) {
      return { ok: false, erro: 'O backup excede o limite de processos permitido.' };
    }

    const nomes: string[] = [];
    for (const id of ids) {
      if (!identificadorBackupValido(id)) {
        return { ok: false, erro: `O backup contém um identificador de processo inválido: ${id || '(vazio)'}.` };
      }
      const processo = state.processos[id];
      if (!objetoSimples(processo) || !String(processo.nome || '').trim()) {
        return { ok: false, erro: `O processo ${id} está inválido ou sem nome.` };
      }
      if (processo.resp != null && !Array.isArray(processo.resp)) {
        return { ok: false, erro: `As respostas do processo ${id} estão em formato inválido.` };
      }
      nomes.push(String(processo.nome));
    }

    if (state.config.respostasPendentes != null && !Array.isArray(state.config.respostasPendentes)) {
      return { ok: false, erro: 'A fila de respostas pendentes do backup está em formato inválido.' };
    }

    return { ok: true, state, quantidade: ids.length, nomes };
  } catch {
    return { ok: false, erro: 'Arquivo JSON inválido ou corrompido.' };
  }
}

export const LIMITE_PONTOS_RESTAURACAO = BK_LIMITE;
