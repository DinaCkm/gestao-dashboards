import type { ProcessoIntegracao } from '../types';
import { aplicarAutomacoesProcesso } from './itemStateHelpers';

export type SituacaoAgendamento = '' | 'sim' | 'aguardando' | 'nao';
export type SituacaoRelatorioMentora = '' | 'ok' | 'parcial' | 'pend';
export type CampoAlinhamento = 'data' | 'hora' | 'link' | 'just' | 'realizado' | 'relatData';
export type CampoAtaAlinhamento = 'texto' | 'link';

function hojeIso(hojeRef: string | Date = new Date()): string {
  if (typeof hojeRef === 'string') return hojeRef.slice(0, 10);
  const y = hojeRef.getFullYear();
  const m = String(hojeRef.getMonth() + 1).padStart(2, '0');
  const d = String(hojeRef.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function agoraIso(agoraRef: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(agoraRef.getDate())}/${pad(agoraRef.getMonth() + 1)} ${pad(agoraRef.getHours())}:${pad(agoraRef.getMinutes())}`;
}

function clonarAlinhamentosComFilhos(alin: Record<string, any> | undefined): Record<string, any> {
  return Object.fromEntries(Object.entries(alin || {}).map(([numero, valor]) => {
    if (!valor || typeof valor !== 'object') return [numero, valor];
    return [numero, {
      ...valor,
      notas: Array.isArray(valor.notas) ? valor.notas.map((n: any) => ({ ...n })) : valor.notas,
      ata: valor.ata && typeof valor.ata === 'object' ? { ...valor.ata } : valor.ata,
      men: valor.men && typeof valor.men === 'object'
        ? {
            ...valor.men,
            hor: Array.isArray(valor.men.hor) ? valor.men.hor.map((h: any) => ({ ...h })) : valor.men.hor,
          }
        : valor.men,
    }];
  }));
}

function registroAlinhamento(alin: Record<string, any>, numero: number): Record<string, any> {
  const chave = String(numero);
  const existente = alin[chave] ?? alin[numero];
  if (existente && typeof existente === 'object') {
    if (alin[chave] !== existente) alin[chave] = existente;
    if (!Array.isArray(existente.notas)) existente.notas = [];
    if (!existente.ata || typeof existente.ata !== 'object') existente.ata = {};
    return existente;
  }
  const novo = { agendado: '', data: '', hora: '', link: '', just: '', realizado: '', relat: '', relatData: '', notas: [], ata: {}, men: { hor: [] } };
  alin[chave] = novo;
  return novo;
}

function processoComAlinhamentos(processo: ProcessoIntegracao): [ProcessoIntegracao, Record<string, any>] {
  const alin = clonarAlinhamentosComFilhos(processo.alin);
  return [{ ...processo, alin }, alin];
}

/** Espelha o clique dos botões Sim/Aguardando/Não de `alinPainel`. */
export function aplicarSituacaoAgendamento(
  processo: ProcessoIntegracao,
  numero: number,
  valor: Exclude<SituacaoAgendamento, ''>,
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  const [copia, alin] = processoComAlinhamentos(processo);
  const registro = registroAlinhamento(alin, numero);
  registro.agendado = registro.agendado === valor ? '' : valor;
  if (registro.agendado !== 'sim') registro.data = '';
  return aplicarAutomacoesProcesso(copia, hojeRef);
}

/** Espelha `data-alinf` do HTML histórico. */
export function aplicarCampoAlinhamento(
  processo: ProcessoIntegracao,
  numero: number,
  campo: CampoAlinhamento,
  valor: string,
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  const [copia, alin] = processoComAlinhamentos(processo);
  registroAlinhamento(alin, numero)[campo] = valor;
  return aplicarAutomacoesProcesso(copia, hojeRef);
}

/** Espelha o clique Recebidos/Parcial/Pendentes dos relatórios da mentora. */
export function aplicarSituacaoRelatorioMentora(
  processo: ProcessoIntegracao,
  numero: number,
  valor: Exclude<SituacaoRelatorioMentora, ''>,
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  const [copia, alin] = processoComAlinhamentos(processo);
  const registro = registroAlinhamento(alin, numero);
  registro.relat = registro.relat === valor ? '' : valor;
  if (registro.relat === 'ok' && !registro.relatData) registro.relatData = hojeIso(hojeRef);
  return aplicarAutomacoesProcesso(copia, hojeRef);
}

/** Espelha `data-ataf="texto|link"` do HTML histórico. */
export function aplicarCampoAtaAlinhamento(
  processo: ProcessoIntegracao,
  numero: number,
  campo: CampoAtaAlinhamento,
  valor: string,
): ProcessoIntegracao {
  const [copia, alin] = processoComAlinhamentos(processo);
  const registro = registroAlinhamento(alin, numero);
  registro.ata = { ...(registro.ata || {}), [campo]: valor };
  return copia;
}

/** Espelha `data-atadrive`: apenas alterna a marca histórica do arquivo. */
export function alternarAtaArquivadaAlinhamento(
  processo: ProcessoIntegracao,
  numero: number,
): ProcessoIntegracao {
  const [copia, alin] = processoComAlinhamentos(processo);
  const registro = registroAlinhamento(alin, numero);
  registro.ata = { ...(registro.ata || {}), drive: !Boolean(registro.ata?.drive) };
  return copia;
}

/** Espelha `addNota(id,'alin',n,txt)`. */
export function adicionarNotaAlinhamento(
  processo: ProcessoIntegracao,
  numero: number,
  texto: string,
  agoraRef: Date = new Date(),
): ProcessoIntegracao {
  const limpo = texto.trim();
  if (!limpo) return processo;
  const [copia, alin] = processoComAlinhamentos(processo);
  const registro = registroAlinhamento(alin, numero);
  registro.notas = Array.isArray(registro.notas) ? [...registro.notas] : [];
  registro.notas.push({ d: agoraIso(agoraRef), t: limpo });
  return copia;
}

/** Espelha `delNota(id,'alin',n,i)`. */
export function removerNotaAlinhamento(
  processo: ProcessoIntegracao,
  numero: number,
  indice: number,
): ProcessoIntegracao {
  const [copia, alin] = processoComAlinhamentos(processo);
  const registro = registroAlinhamento(alin, numero);
  registro.notas = Array.isArray(registro.notas) ? [...registro.notas] : [];
  if (indice >= 0 && indice < registro.notas.length) registro.notas.splice(indice, 1);
  return copia;
}

export interface EstadoAlinhamentoAtual {
  agendado: SituacaoAgendamento;
  data: string;
  hora: string;
  link: string;
  just: string;
  realizado: string;
  relat: SituacaoRelatorioMentora;
  relatData: string;
  ata: {
    texto: string;
    link: string;
    drive: boolean;
  };
  notas: Array<{ d: string; t: string }>;
}

export function estadoAlinhamentoAtual(processo: ProcessoIntegracao, numero: number): EstadoAlinhamentoAtual {
  const registro = processo.alin?.[String(numero)] ?? processo.alin?.[numero];
  const r = registro && typeof registro === 'object' ? registro : {};
  return {
    agendado: (r.agendado || '') as SituacaoAgendamento,
    data: String(r.data || ''),
    hora: String(r.hora || ''),
    link: String(r.link || ''),
    just: String(r.just || ''),
    realizado: String(r.realizado || ''),
    relat: (r.relat || '') as SituacaoRelatorioMentora,
    relatData: String(r.relatData || ''),
    ata: {
      texto: String(r.ata?.texto || ''),
      link: String(r.ata?.link || ''),
      drive: Boolean(r.ata?.drive),
    },
    notas: Array.isArray(r.notas)
      ? r.notas.map((nota: any) => ({ d: String(nota?.d || ''), t: String(nota?.t || '') }))
      : [],
  };
}
