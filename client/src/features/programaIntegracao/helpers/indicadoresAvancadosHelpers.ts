import type { ProcessoIntegracao } from '../types';
import type { EcoLiderAndamento } from '../api/ecoLider';
import { coletarAcoesPainel, cronogramaReal, dataPrevistaItemCronograma, type AcaoPainelReal } from './painelAcoes';
import { calcularKpisPainel } from './painelKpis';
import { progressoRealProcesso } from './painelProcessos';
import { calcularStatusItem, normalizarRegistroFeito } from './statusHelpers';
import { formKeyForItem } from './registrarRespostasParser';
import { respostaDoItem } from './respostaItemHelpers';

export type StatusPrioritarioIndicadores =
  | 'atrasado_ckm'
  | 'atrasado_eles'
  | 'hoje'
  | 'acao'
  | 'aguardando'
  | 'no_prazo'
  | 'concluido';

export const ROTULO_STATUS_PRIORITARIO: Record<StatusPrioritarioIndicadores, string> = {
  atrasado_ckm: 'Atrasado — CKM',
  atrasado_eles: 'Atrasado — Deles',
  hoje: 'Hoje',
  acao: 'Tomar ação',
  aguardando: 'Aguardando retorno',
  no_prazo: 'No prazo',
  concluido: 'Concluído',
};

function isoHoje(ref: string | Date = new Date()): string {
  if (typeof ref === 'string') return ref.slice(0, 10);
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, '0');
  const d = String(ref.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  const data = new Date(Date.UTC(a, m - 1, d + dias));
  return data.toISOString().slice(0, 10);
}

function diffDias(inicio: string, fim: string): number {
  const [ia, im, id] = inicio.slice(0, 10).split('-').map(Number);
  const [fa, fm, fd] = fim.slice(0, 10).split('-').map(Number);
  if (![ia, im, id, fa, fm, fd].every(Number.isFinite)) return 0;
  return Math.round((Date.UTC(fa, fm - 1, fd) - Date.UTC(ia, im - 1, id)) / 86400000);
}

function fechado(status: string): boolean {
  return status === 'ok' || status === 'na' || status === 'wont';
}

function statusSalvo(processo: ProcessoIntegracao, itemId: string): string {
  return String(normalizarRegistroFeito(processo.feito?.[itemId])?.s || '');
}

function dataConclusao(processo: ProcessoIntegracao, itemId: string): string {
  return String(normalizarRegistroFeito(processo.feito?.[itemId])?.d || '').slice(0, 10);
}

function media(valores: number[]): number | null {
  return valores.length ? valores.reduce((s, n) => s + n, 0) / valores.length : null;
}

function arred(n: number | null): number | null {
  return n == null ? null : Math.round(n * 10) / 10;
}

export function statusPrioritarioProcesso(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): StatusPrioritarioIndicadores {
  if (processo.situacao === 'encerrado') return 'concluido';
  const acoes = coletarAcoesPainel([processo], feriados, hojeRef);
  if (acoes.some((a) => a.st.k === 'late' && a.lado === 'ckm')) return 'atrasado_ckm';
  if (acoes.some((a) => a.st.k === 'late' && a.lado === 'eles')) return 'atrasado_eles';
  if (acoes.some((a) => a.st.k === 'act' && a.st.dif === 0)) return 'hoje';
  if (acoes.some((a) => a.st.k === 'act')) return 'acao';
  if (acoes.some((a) => a.st.k === 'wait')) return 'aguardando';
  return acoes.length ? 'no_prazo' : 'concluido';
}

export function etapaAtualProcesso(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): string {
  if (processo.situacao === 'encerrado') return 'Concluído';
  const cronograma = cronogramaReal(processo, feriados, hojeRef);
  const primeiraAberta = cronograma.find((etapa) =>
    etapa.itens.some((item) => !fechado(statusSalvo(processo, item.id))),
  );
  return primeiraAberta?.et.t || 'Concluído';
}

export interface IndicadoresAvancados {
  totalPessoas: number;
  ativos: number;
  encerrados: number;
  pessoasAtrasadas: number;
  pessoasDentroPrazo: number;
  pessoasComPendencia: number;
  pessoasAtencaoAgora: number;
  pessoasAguardandoRetorno: number;
  ecoVinculados: number;
  ecoSemVinculo: number;
  progressoMedio: number | null;
  pctDentroPrazo: number;
  pctComPendencia: number;

  itensAbertos: number;
  itensAtrasados: number;
  atrasadosCkm: number;
  atrasadosEles: number;
  vencemHoje: number;
  vencem7Dias: number;
  mediaDiasAtraso: number | null;

  respostasRegistradas: number;
  formulariosAbertos: number;
  formulariosAtrasados: number;
  alinhamentosFeitos: number;
  alinhamentosPrevistos: number;

  concluidosNoPrazo: number;
  concluidosComAtraso: number;

  statusDistribuicao: Array<{ name: string; value: number; key: string }>;
  pessoasPorEtapa: Array<{ name: string; value: number }>;
  pendenciasPorResponsavel: Array<{ name: string; value: number }>;
  gargalos: Array<{ name: string; value: number; atrasados: number }>;
  atrasosPorEtapa: Array<{ name: string; value: number }>;
  desempenhoEtapas: Array<{
    name: string;
    pessoasConcluidas: number;
    mediaDias: number | null;
    noPrazo: number;
    comAtraso: number;
    atrasosAbertos: number;
  }>;

  pdi: {
    comTarefas: number;
    semTarefas: number;
    media: number | null;
    concluidos100: number;
    pendentes: number;
    faixas: Array<{ name: string; value: number }>;
  };
  compliance: {
    comAtividades: number;
    semAtividades: number;
    media: number | null;
    naoIniciaram: number;
    andamento: number;
    concluidos100: number;
    faixas: Array<{ name: string; value: number }>;
  };

  principais: {
    ativos: number;
    ecoVinculadosAtivos: number;
    ecoSemVinculoAtivos: number;
    pdi: {
      totalTarefas: number;
      concluidas: number;
      percentual: number | null;
      pessoasComTarefas: number;
      pessoasSemTarefas: number;
    };
    compliance: {
      totalAtividades: number;
      concluidas: number;
      percentual: number | null;
      pessoasComAtividades: number;
      pessoasSemAtividades: number;
    };
    formulariosPos: {
      totalPendentes: number;
      gestor: number;
      anjo: number;
      colaborador: number;
    };
    formularios: {
      esperados: number;
      respondidos: number;
      pendentes: number;
      percentual: number | null;
    };
    alinhamentos: {
      previstos: number;
      realizados: number;
      pendentes: number;
      percentual: number | null;
    };
  };

  pessoas: Array<{
    id: string;
    nome: string;
    unidade: string;
    gestor: string;
    etapa: string;
    status: StatusPrioritarioIndicadores;
    progresso: number;
    atrasos: number;
    pdi: number | null;
    compliance: number | null;
  }>;
}

function faixasPercentuais(
  registros: Array<{ total: number; percentual: number | null }>,
  rotuloSemRegistro: string,
): Array<{ name: string; value: number }> {
  const out = [
    { name: rotuloSemRegistro, value: 0 },
    { name: '0%', value: 0 },
    { name: '1–25%', value: 0 },
    { name: '26–50%', value: 0 },
    { name: '51–75%', value: 0 },
    { name: '76–99%', value: 0 },
    { name: '100%', value: 0 },
  ];
  registros.forEach(({ total, percentual }) => {
    if (!total || percentual == null) out[0].value++;
    else if (percentual <= 0) out[1].value++;
    else if (percentual <= 25) out[2].value++;
    else if (percentual <= 50) out[3].value++;
    else if (percentual <= 75) out[4].value++;
    else if (percentual < 100) out[5].value++;
    else out[6].value++;
  });
  return out;
}

function ecoDoProcesso(
  processo: ProcessoIntegracao,
  ecoStatus: Record<string, EcoLiderAndamento>,
): EcoLiderAndamento | null {
  const alunoId = Number((processo.teste as any)?.ecoAlunoId || 0);
  return alunoId > 0 ? (ecoStatus[String(alunoId)] || null) : null;
}

export function calcularIndicadoresAvancados(
  processosAtivos: ProcessoIntegracao[],
  processosEncerrados: ProcessoIntegracao[] = [],
  feriados: string[] = [],
  ecoStatus: Record<string, EcoLiderAndamento> = {},
  hojeRef: string | Date = new Date(),
): IndicadoresAvancados {
  const todos = [...processosAtivos, ...processosEncerrados];
  const hoje = isoHoje(hojeRef);
  const em7 = addDias(hoje, 7);
  const acoes = coletarAcoesPainel(processosAtivos, feriados, hojeRef);
  const kpis = calcularKpisPainel(acoes);

  const acoesPorPessoa = new Map<string, AcaoPainelReal[]>();
  acoes.forEach((acao) => {
    const lista = acoesPorPessoa.get(acao.pid) || [];
    lista.push(acao);
    acoesPorPessoa.set(acao.pid, lista);
  });

  const idsAtrasados = new Set(acoes.filter((a) => a.st.k === 'late').map((a) => a.pid));
  const acoesAtencao = acoes.filter((a) => a.st.k === 'late' || a.st.k === 'act' || a.st.k === 'wait');
  const idsComPendencia = new Set(acoesAtencao.map((a) => a.pid));
  const idsAtencao = new Set(acoesAtencao.map((a) => a.pid));
  const idsAguardando = new Set(acoes.filter((a) => a.st.k === 'wait').map((a) => a.pid));
  const atrasosDias = acoes
    .filter((a) => a.st.k === 'late' && Number(a.st.dif) > 0)
    .map((a) => Number(a.st.dif));

  const statusDistribuicao = [
    { name: 'Atrasado — CKM', value: kpis.atrasadoCkm, key: 'atrasado_ckm' },
    { name: 'Atrasado — Deles', value: kpis.atrasadoEles, key: 'atrasado_eles' },
    { name: 'Hoje', value: kpis.hoje, key: 'hoje' },
    { name: 'Tomar ação', value: kpis.tomarAcao, key: 'acao' },
    { name: 'Aguardando retorno', value: kpis.aguardandoRetorno, key: 'aguardando' },
    { name: 'No prazo', value: kpis.noPrazo, key: 'no_prazo' },
  ];

  const porEtapa = new Map<string, number>();
  processosAtivos.forEach((p) => {
    const etapa = etapaAtualProcesso(p, feriados, hojeRef);
    porEtapa.set(etapa, (porEtapa.get(etapa) || 0) + 1);
  });

  const porResponsavel = new Map<string, number>();
  acoes.forEach((a) => {
    const nome = a.responsavelAtual || a.it.r || 'Não informado';
    porResponsavel.set(nome, (porResponsavel.get(nome) || 0) + 1);
  });

  const gargalosMap = new Map<string, { value: number; atrasados: number }>();
  acoes
    .filter((a) => a.st.k !== 'ontime')
    .forEach((a) => {
      const atual = gargalosMap.get(a.it.t) || { value: 0, atrasados: 0 };
      atual.value++;
      if (a.st.k === 'late') atual.atrasados++;
      gargalosMap.set(a.it.t, atual);
    });

  const atrasoEtapaMap = new Map<string, number>();
  acoes.filter((a) => a.st.k === 'late').forEach((a) => {
    atrasoEtapaMap.set(a.e.et.t, (atrasoEtapaMap.get(a.e.et.t) || 0) + 1);
  });

  let respostasRegistradas = 0;
  let formulariosAbertos = 0;
  let formulariosAtrasados = 0;
  let alinhamentosFeitos = 0;
  let alinhamentosPrevistos = 0;
  let concluidosNoPrazo = 0;
  let concluidosComAtraso = 0;

  const etapaDesempenho = new Map<string, {
    dias: number[];
    pessoasConcluidas: number;
    noPrazo: number;
    comAtraso: number;
    atrasosAbertos: number;
  }>();

  todos.forEach((processo) => {
    respostasRegistradas += (processo.resp || []).length;
    const cronograma = cronogramaReal(processo, feriados, hojeRef);
    cronograma.forEach((etapa) => {
      const metrica = etapaDesempenho.get(etapa.et.t) || {
        dias: [], pessoasConcluidas: 0, noPrazo: 0, comAtraso: 0, atrasosAbertos: 0,
      };
      let etapaTodaFechada = true;
      let ultimaConclusao = '';

      etapa.itens.forEach((item) => {
        const status = statusSalvo(processo, item.id);
        const dataFim = dataConclusao(processo, item.id);

        if (item.form && !fechado(status)) {
          formulariosAbertos++;
          const acao = calcularStatusItem(processo, item.id, dataPrevistaItemCronograma(etapa, item), hojeRef);
          if (acao.k === 'late') formulariosAtrasados++;
        }

        if (!fechado(status)) etapaTodaFechada = false;

        if (status === 'ok' && dataFim) {
          const atraso = diffDias(dataPrevistaItemCronograma(etapa, item), dataFim);
          if (atraso > 0) {
            concluidosComAtraso++;
            metrica.comAtraso++;
          } else {
            concluidosNoPrazo++;
            metrica.noPrazo++;
          }
          if (!ultimaConclusao || dataFim > ultimaConclusao) ultimaConclusao = dataFim;
        }
      });

      const atrasosAbertos = acoes.filter((a) => a.pid === (processo.id || processo.nome) && a.e.et.id === etapa.et.id && a.st.k === 'late').length;
      metrica.atrasosAbertos += atrasosAbertos;

      if (etapaTodaFechada && ultimaConclusao && processo.inicio) {
        metrica.pessoasConcluidas++;
        metrica.dias.push(Math.max(0, diffDias(processo.inicio, ultimaConclusao) + 1));
      }
      etapaDesempenho.set(etapa.et.t, metrica);
    });

    [1, 2, 3, 4].forEach((n) => {
      const etapa = cronograma.find((e) => e.et.al === n);
      if (etapa && etapa.data <= hoje) alinhamentosPrevistos++;
      if ((processo.alin as any)?.[n]?.realizado) alinhamentosFeitos++;
    });
  });

  const pdiRegistros: Array<{ total: number; percentual: number | null }> = [];
  const complianceRegistros: Array<{ total: number; percentual: number | null }> = [];
  let ecoVinculados = 0;
  todos.forEach((p) => {
    const eco = ecoDoProcesso(p, ecoStatus);
    if (!eco) return;
    ecoVinculados++;
    pdiRegistros.push({ total: Number(eco.pdi?.total || 0), percentual: eco.pdi?.percentual ?? null });
    complianceRegistros.push({ total: Number(eco.jornadaCompliance?.total || 0), percentual: eco.jornadaCompliance?.percentual ?? null });
  });

  const pdiComTarefas = pdiRegistros.filter((r) => r.total > 0);
  const complianceComAtividades = complianceRegistros.filter((r) => r.total > 0);
  const pdiPct = pdiComTarefas.map((r) => Number(r.percentual || 0));
  const compPct = complianceComAtividades.map((r) => Number(r.percentual || 0));

  let ecoVinculadosAtivos = 0;
  let pdiTotalTarefasAtivos = 0;
  let pdiConcluidasAtivos = 0;
  let pdiPessoasComTarefasAtivos = 0;
  let pdiPessoasSemTarefasAtivos = 0;
  let complianceTotalAtividadesAtivos = 0;
  let complianceConcluidasAtivos = 0;
  let compliancePessoasComAtividadesAtivos = 0;
  let compliancePessoasSemAtividadesAtivos = 0;

  processosAtivos.forEach((processo) => {
    const alunoId = Number((processo.teste as any)?.ecoAlunoId || 0);
    if (alunoId <= 0) return;
    ecoVinculadosAtivos++;
    const eco = ecoStatus[String(alunoId)] || null;
    if (!eco) return;

    const pdiTotal = Number(eco.pdi?.total || 0);
    const pdiConcluidas = Number(eco.pdi?.concluidas || 0);
    if (pdiTotal > 0) {
      pdiPessoasComTarefasAtivos++;
      pdiTotalTarefasAtivos += pdiTotal;
      pdiConcluidasAtivos += Math.min(pdiConcluidas, pdiTotal);
    } else {
      pdiPessoasSemTarefasAtivos++;
    }

    const complianceTotal = Number(eco.jornadaCompliance?.total || 0);
    const complianceConcluidas = Number(eco.jornadaCompliance?.concluidas || 0);
    if (complianceTotal > 0) {
      compliancePessoasComAtividadesAtivos++;
      complianceTotalAtividadesAtivos += complianceTotal;
      complianceConcluidasAtivos += Math.min(complianceConcluidas, complianceTotal);
    } else {
      compliancePessoasSemAtividadesAtivos++;
    }
  });

  let formulariosEsperadosAtivos = 0;
  let formulariosRespondidosAtivos = 0;
  let formulariosPosGestor = 0;
  let formulariosPosAnjo = 0;
  let formulariosPosColaborador = 0;
  let alinhamentosPrevistosAtivos = 0;
  let alinhamentosRealizadosAtivos = 0;
  const etapasPosAlinhamento = new Set(['pos1', 'pos2', 'pos3', 'pos4']);

  processosAtivos.forEach((processo) => {
    const cronograma = cronogramaReal(processo, feriados, hojeRef);

    cronograma.forEach((etapa) => {
      etapa.itens.forEach((item) => {
        if (!formKeyForItem(item.id)) return;
        const dataItem = dataPrevistaItemCronograma(etapa, item);
        if (dataItem > hoje) return;

        const status = statusSalvo(processo, item.id);
        if (status === 'na' || status === 'wont') return;

        formulariosEsperadosAtivos++;
        const respondido = Boolean(respostaDoItem(processo, item.id));
        if (respondido) {
          formulariosRespondidosAtivos++;
          return;
        }

        if (!etapasPosAlinhamento.has(etapa.et.id)) return;
        if (item.r === 'Gestor') formulariosPosGestor++;
        else if (item.r === 'Anjo') formulariosPosAnjo++;
        else if (item.r === 'Colaborador') formulariosPosColaborador++;
      });
    });

    [1, 2, 3, 4].forEach((n) => {
      const etapa = cronograma.find((e) => e.et.al === n);
      if (!etapa || etapa.data > hoje) return;
      alinhamentosPrevistosAtivos++;
      if ((processo.alin as any)?.[n]?.realizado) alinhamentosRealizadosAtivos++;
    });
  });

  const progressoTodos = todos.map((p) => progressoRealProcesso(p).percentualConcluido);
  const pessoas = todos.map((p) => {
    const id = p.id || p.nome;
    const eco = ecoDoProcesso(p, ecoStatus);
    const atrasos = (acoesPorPessoa.get(id) || []).filter((a) => a.st.k === 'late').length;
    return {
      id,
      nome: p.nome || 'Sem nome',
      unidade: p.unidade || 'Não informada',
      gestor: p.gestor || 'Não informado',
      etapa: etapaAtualProcesso(p, feriados, hojeRef),
      status: statusPrioritarioProcesso(p, feriados, hojeRef),
      progresso: progressoRealProcesso(p).percentualConcluido,
      atrasos,
      pdi: eco?.pdi?.total ? (eco.pdi.percentual ?? 0) : null,
      compliance: eco?.jornadaCompliance?.total ? (eco.jornadaCompliance.percentual ?? 0) : null,
    };
  });

  return {
    totalPessoas: todos.length,
    ativos: processosAtivos.length,
    encerrados: processosEncerrados.length,
    pessoasAtrasadas: idsAtrasados.size,
    pessoasDentroPrazo: Math.max(0, processosAtivos.length - idsAtrasados.size),
    pessoasComPendencia: idsComPendencia.size,
    pessoasAtencaoAgora: idsAtencao.size,
    pessoasAguardandoRetorno: idsAguardando.size,
    ecoVinculados,
    ecoSemVinculo: Math.max(0, todos.length - ecoVinculados),
    progressoMedio: arred(media(progressoTodos)),
    pctDentroPrazo: processosAtivos.length ? Math.round(((processosAtivos.length - idsAtrasados.size) * 100) / processosAtivos.length) : 100,
    pctComPendencia: processosAtivos.length ? Math.round((idsComPendencia.size * 100) / processosAtivos.length) : 0,

    itensAbertos: acoes.length,
    itensAtrasados: kpis.atrasado,
    atrasadosCkm: kpis.atrasadoCkm,
    atrasadosEles: kpis.atrasadoEles,
    vencemHoje: kpis.hoje,
    vencem7Dias: acoes.filter((a) => a.st.k !== 'late' && a.data > hoje && a.data <= em7).length,
    mediaDiasAtraso: arred(media(atrasosDias)),

    respostasRegistradas,
    formulariosAbertos,
    formulariosAtrasados,
    alinhamentosFeitos,
    alinhamentosPrevistos,

    concluidosNoPrazo,
    concluidosComAtraso,

    statusDistribuicao,
    pessoasPorEtapa: [...porEtapa.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    pendenciasPorResponsavel: [...porResponsavel.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    gargalos: [...gargalosMap.entries()]
      .map(([name, valor]) => ({ name, ...valor }))
      .sort((a, b) => b.atrasados - a.atrasados || b.value - a.value)
      .slice(0, 8),
    atrasosPorEtapa: [...atrasoEtapaMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8),
    desempenhoEtapas: [...etapaDesempenho.entries()].map(([name, valor]) => ({
      name,
      pessoasConcluidas: valor.pessoasConcluidas,
      mediaDias: arred(media(valor.dias)),
      noPrazo: valor.noPrazo,
      comAtraso: valor.comAtraso,
      atrasosAbertos: valor.atrasosAbertos,
    })).filter((x) => x.pessoasConcluidas || x.noPrazo || x.comAtraso || x.atrasosAbertos),

    pdi: {
      comTarefas: pdiComTarefas.length,
      semTarefas: pdiRegistros.filter((r) => r.total === 0).length,
      media: arred(media(pdiPct)),
      concluidos100: pdiComTarefas.filter((r) => Number(r.percentual || 0) >= 100).length,
      pendentes: pdiComTarefas.filter((r) => Number(r.percentual || 0) < 100).length,
      faixas: faixasPercentuais(pdiRegistros, 'Sem tarefas'),
    },
    compliance: {
      comAtividades: complianceComAtividades.length,
      semAtividades: complianceRegistros.filter((r) => r.total === 0).length,
      media: arred(media(compPct)),
      naoIniciaram: complianceComAtividades.filter((r) => Number(r.percentual || 0) <= 0).length,
      andamento: complianceComAtividades.filter((r) => Number(r.percentual || 0) > 0 && Number(r.percentual || 0) < 100).length,
      concluidos100: complianceComAtividades.filter((r) => Number(r.percentual || 0) >= 100).length,
      faixas: faixasPercentuais(complianceRegistros, 'Sem atividades'),
    },

    principais: {
      ativos: processosAtivos.length,
      ecoVinculadosAtivos,
      ecoSemVinculoAtivos: Math.max(0, processosAtivos.length - ecoVinculadosAtivos),
      pdi: {
        totalTarefas: pdiTotalTarefasAtivos,
        concluidas: pdiConcluidasAtivos,
        percentual: pdiTotalTarefasAtivos > 0 ? Math.round((pdiConcluidasAtivos * 100) / pdiTotalTarefasAtivos) : null,
        pessoasComTarefas: pdiPessoasComTarefasAtivos,
        pessoasSemTarefas: pdiPessoasSemTarefasAtivos,
      },
      compliance: {
        totalAtividades: complianceTotalAtividadesAtivos,
        concluidas: complianceConcluidasAtivos,
        percentual: complianceTotalAtividadesAtivos > 0 ? Math.round((complianceConcluidasAtivos * 100) / complianceTotalAtividadesAtivos) : null,
        pessoasComAtividades: compliancePessoasComAtividadesAtivos,
        pessoasSemAtividades: compliancePessoasSemAtividadesAtivos,
      },
      formulariosPos: {
        totalPendentes: formulariosPosGestor + formulariosPosAnjo + formulariosPosColaborador,
        gestor: formulariosPosGestor,
        anjo: formulariosPosAnjo,
        colaborador: formulariosPosColaborador,
      },
      formularios: {
        esperados: formulariosEsperadosAtivos,
        respondidos: formulariosRespondidosAtivos,
        pendentes: Math.max(0, formulariosEsperadosAtivos - formulariosRespondidosAtivos),
        percentual: formulariosEsperadosAtivos > 0
          ? Math.round((formulariosRespondidosAtivos * 100) / formulariosEsperadosAtivos)
          : null,
      },
      alinhamentos: {
        previstos: alinhamentosPrevistosAtivos,
        realizados: alinhamentosRealizadosAtivos,
        pendentes: Math.max(0, alinhamentosPrevistosAtivos - alinhamentosRealizadosAtivos),
        percentual: alinhamentosPrevistosAtivos > 0
          ? Math.round((alinhamentosRealizadosAtivos * 100) / alinhamentosPrevistosAtivos)
          : null,
      },
    },

    pessoas,
  };
}

