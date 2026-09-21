import type { ProcessoIntegracao } from '../types';
import { cronogramaReal, dataPrevistaItemCronograma } from './painelAcoes';
import { calcularStatusItem, normalizarRegistroFeito } from './statusHelpers';
import { progressoRealProcesso, diaAtualReal, sinalRealProcesso } from './painelProcessos';
import { responsabilidadeAtual } from './responsabilidadeAtualHelpers';

export const GRUPO_NOME = {
  pre: 'Pré-chegada',
  ini: 'Primeiros dias',
  a1: '1º ciclo',
  a2: '2º ciclo',
  a3: '3º ciclo',
  a4: '4º ciclo',
  fim: 'Encerramento',
} as const;

export const GRUPO_ORDEM = ['pre', 'ini', 'a1', 'a2', 'a3', 'a4', 'fim'] as const;
export const PAPEL_ORDEM = ['Gestor', 'Anjo', 'Colaborador', 'UGP'] as const;


type GrupoKey = (typeof GRUPO_ORDEM)[number];

function hojeIso(ref: string | Date = new Date()): string {
  if (typeof ref === 'string') return ref.slice(0, 10);
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, '0');
  const d = String(ref.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function statusSalvo(processo: ProcessoIntegracao, itemId: string): string {
  const reg = normalizarRegistroFeito(processo.feito?.[itemId]);
  return reg?.s ? String(reg.s) : '';
}

function fechado(status: string): boolean {
  return status === 'ok' || status === 'na' || status === 'wont';
}

export function grupoAtualReal(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): GrupoKey {
  const hoje = hojeIso(hojeRef);
  let grupo: GrupoKey = 'pre';
  cronogramaReal(processo, feriados, hojeRef).forEach((etapa) => {
    if (etapa.data <= hoje) grupo = (etapa.et.g || grupo) as GrupoKey;
  });
  return grupo;
}

function ultimoPdi(processo: ProcessoIntegracao) {
  let achou: (ProcessoIntegracao['resp'][number]) | null = null;
  (processo.resp || []).forEach((r) => {
    if (r.form !== 'pdi') return;
    if (!achou || (r.ciclo || 0) >= (achou.ciclo || 0)) achou = r;
  });
  return achou;
}

function percentualResposta(processo: ProcessoIntegracao, indice: number): number | null {
  const r = ultimoPdi(processo);
  if (!r) return null;
  let valor = '';
  (r.c || []).forEach(([idx, v]) => { if (idx === indice) valor = v; });
  const m = String(valor || '').match(/(\d{1,3})\s*%/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function pctJornadaReal(processo: ProcessoIntegracao): number | null {
  return percentualResposta(processo, 17);
}

export function pctPdiReal(processo: ProcessoIntegracao): number | null {
  return percentualResposta(processo, 14);
}

export function mediaLista(valores: Array<number | null>): number | null {
  const validos = valores.filter((v): v is number => v != null && !Number.isNaN(v));
  if (!validos.length) return null;
  return validos.reduce((soma, v) => soma + v, 0) / validos.length;
}

export interface IndicadoresProgramaReal {
  ativos: number;
  encerrados: number;
  atrasados: number;
  pendentes: number;
  porPapel: Record<string, number>;
  porGrupo: Record<GrupoKey, number>;
  acoesCkm: number;
  acoesEles: number;
  respostas: number;
  alinFeitos: number;
  alinPrevistos: number;
  jornada: number[];
  pdi: number[];
  progresso: number[];
  mediaCiclo: Record<1 | 2 | 3 | 4, number[]>;
  pessoas: Array<{
    id: string;
    nome: string;
    pct: number;
    dia: number | null;
    atraso: number;
    jornada: number | null;
    pdi: number | null;
    sinal: ReturnType<typeof sinalRealProcesso>;
  }>;
}

export function calcularIndicadoresProgramaReal(
  processosAtivos: ProcessoIntegracao[],
  processosEncerrados: ProcessoIntegracao[] = [],
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): IndicadoresProgramaReal {
  const porGrupo = Object.fromEntries(GRUPO_ORDEM.map((g) => [g, 0])) as Record<GrupoKey, number>;
  const mediaCiclo: Record<1 | 2 | 3 | 4, number[]> = { 1: [], 2: [], 3: [], 4: [] };
  const resultado: IndicadoresProgramaReal = {
    ativos: processosAtivos.length,
    encerrados: processosEncerrados.length,
    atrasados: 0,
    pendentes: 0,
    porPapel: {},
    porGrupo,
    acoesCkm: 0,
    acoesEles: 0,
    respostas: 0,
    alinFeitos: 0,
    alinPrevistos: 0,
    jornada: [],
    pdi: [],
    progresso: [],
    mediaCiclo,
    pessoas: [],
  };

  const hoje = hojeIso(hojeRef);

  processosAtivos.forEach((processo) => {
    const id = processo.id || processo.nome;
    const progresso = progressoRealProcesso(processo);
    const grupo = grupoAtualReal(processo, feriados, hojeRef);
    resultado.porGrupo[grupo] = (resultado.porGrupo[grupo] || 0) + 1;
    resultado.progresso.push(progresso.percentualConcluido);

    let atrasosPessoa = 0;
    cronogramaReal(processo, feriados, hojeRef).forEach((etapa) => {
      etapa.itens.forEach((item) => {
        const salvo = statusSalvo(processo, item.id);
        const responsabilidade = responsabilidadeAtual(item, salvo);
        if (item.form && !fechado(salvo) && etapa.data <= hoje) {
          const st = calcularStatusItem(processo, item.id, dataPrevistaItemCronograma(etapa, item), hojeRef);
          resultado.pendentes++;
          const papeisPendencia = responsabilidade.papeis.length ? responsabilidade.papeis : [item.r];
          papeisPendencia.forEach((papel) => {
            resultado.porPapel[papel] = (resultado.porPapel[papel] || 0) + 1;
          });
          if (st.k === 'late') {
            resultado.atrasados++;
            atrasosPessoa++;
          }
        }

        if (fechado(salvo) || etapa.data > hoje) return;
        if (responsabilidade.lado === 'ckm') resultado.acoesCkm++;
        else resultado.acoesEles++;
      });
    });

    [1, 2, 3, 4].forEach((n) => {
      let etapaAlinhamento: ReturnType<typeof cronogramaReal>[number] | null = null;
      cronogramaReal(processo, feriados, hojeRef).forEach((etapa) => {
        if (etapa.et.al === n) etapaAlinhamento = etapa;
      });
      if (etapaAlinhamento && etapaAlinhamento.data <= hoje) resultado.alinPrevistos++;
      if ((processo.alin as any)?.[n]?.realizado) resultado.alinFeitos++;
    });

    resultado.respostas += (processo.resp || []).length;
    const jornada = pctJornadaReal(processo);
    const pdi = pctPdiReal(processo);
    if (jornada != null) resultado.jornada.push(jornada);
    if (pdi != null) resultado.pdi.push(pdi);

    (processo.resp || []).forEach((r) => {
      if (r.form === 'aval' && r.papel === 'Gestor' && r.ciclo >= 1 && r.ciclo <= 4 && r.media != null) {
        mediaCiclo[r.ciclo as 1 | 2 | 3 | 4].push(Number(r.media));
      }
    });

    resultado.pessoas.push({
      id,
      nome: processo.nome || `Sem nome (${id})`,
      pct: progresso.percentualConcluido,
      dia: diaAtualReal(processo, hojeRef),
      atraso: atrasosPessoa,
      jornada,
      pdi,
      sinal: sinalRealProcesso(processo, feriados, hojeRef),
    });
  });

  processosEncerrados.forEach((processo) => {
    (processo.resp || []).forEach((r) => {
      if (r.form === 'aval' && r.papel === 'Gestor' && r.ciclo >= 1 && r.ciclo <= 4 && r.media != null) {
        mediaCiclo[r.ciclo as 1 | 2 | 3 | 4].push(Number(r.media));
      }
    });
  });

  return resultado;
}
