import React, { useMemo, useState } from 'react';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import { coletarAcoesPainel } from '../helpers/painelAcoes';
import {
  calcularKpisPainel,
  filtrarAcoesPainel,
  KPIS_PAINEL_ORIGINAL,
  type FiltroPainel,
} from '../helpers/painelKpis';
import { agruparAcoesPorTarefa as agruparFiltradas } from '../helpers/painelAgrupamento';
import { montarCardProcessoPainel } from '../helpers/painelProcessos';
import { gerarAgendaOnboardingPdf } from '../helpers/agendaPdf';
import { gerarRelatorioAndamentoPdf } from '../helpers/relatorioAndamentoPdf';
import { gerarCheckpointPdf } from '../helpers/checkpointPdf';
import {
  ciclosRelatorioEvolucao,
  gerarRelatorioEvolucaoPdf,
  temDadosRelatorioEvolucao,
} from '../helpers/relatorioEvolucaoPdf';
import {
  fichaAcaoAtual,
  type CampoFichaAcao,
  type StatusAcaoLegado,
} from '../helpers/itemStateHelpers';
import {
  camposResposta,
  dataResposta,
  nomeFormularioResposta,
  respostaDoItem,
} from '../helpers/respostaItemHelpers';
import { linkIntegracaoPorChave } from '../helpers/emailLinksHelpers';
import { formKeyForItem } from '../helpers/registrarRespostasParser';
import { formatarData } from '../helpers/dateHelpers';
import {
  TUTORIAL_PRIMEIRO_ACESSO_NOME,
  TUTORIAL_PRIMEIRO_ACESSO_URL,
} from '../helpers/tutorialPrimeiroAcesso';
import { EmailActionButtons } from './EmailActionButtons';
import { MicroImportacaoAcao } from './MicroImportacaoAcao';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

type StatusGrupo = '' | 'prog' | 'doing' | 'wait' | 'na' | 'wont';

interface PainelSemanaProps {
  processosAtivos: ProcessoIntegracao[];
  processosEncerrados?: ProcessoIntegracao[];
  feriados?: string[];
  respostasPendentes?: any[];
  config: BootstrapState['config'];
  onProcessoClick?: (processId: string) => void;
  onRevisarRespostas?: () => void;
  onConcluirAcao?: (processId: string, itemId: string) => Promise<void> | void;
  onAlterarStatusAcao?: (processId: string, itemId: string, status: StatusAcaoLegado) => void;
  onAlterarCampoAcao?: (processId: string, itemId: string, campo: CampoFichaAcao, valor: string) => void;
  onAdicionarNotaAcao?: (processId: string, itemId: string, texto: string) => void;
  onRemoverNotaAcao?: (processId: string, itemId: string, indice: number) => void;
  onConcluirGrupo?: (itemId: string, processIds: string[]) => Promise<void> | void;
  onAplicarStatusGrupo?: (itemId: string, processIds: string[], status: StatusGrupo) => Promise<void> | void;
  onEditarModeloEmail?: (chave: string) => void;
}

const statusClasses = {
  late: 'border-red-300 bg-red-50 text-red-800',
  act: 'border-amber-300 bg-amber-50 text-amber-800',
  wait: 'border-blue-300 bg-blue-50 text-blue-800',
  ontime: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  ok: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  off: 'border-slate-300 bg-slate-50 text-slate-700',
} as const;

const sinalClasses = {
  late: 'border-red-300 bg-red-100 text-red-700',
  act: 'border-amber-300 bg-amber-100 text-amber-700',
  ok: 'border-emerald-300 bg-emerald-100 text-emerald-700',
  off: 'border-slate-300 bg-slate-100 text-slate-600',
} as const;

const STATUS_ACAO: Array<[StatusAcaoLegado, string]> = [
  ['', 'Pendente'],
  ['prog', 'Programado'],
  ['doing', 'Em andamento'],
  ['wait', 'Aguardando resposta'],
  ['ok', 'Feito'],
  ['na', 'Não se aplica'],
  ['wont', 'Não será feita'],
];

function textoPendente(item: any): string {
  const nome = item?.nome || item?.nomeOrig || item?.respondentName || item?.dados?.nome || 'Pessoa não identificada';
  const formulario = item?.formulario || item?.form || item?.tipoFormulario || 'Formulário';
  return `${nome} · ${formulario}`;
}

export function PainelSemana({
  processosAtivos,
  processosEncerrados = [],
  feriados = [],
  respostasPendentes = [],
  config,
  onProcessoClick,
  onRevisarRespostas,
  onConcluirAcao,
  onAlterarStatusAcao,
  onAlterarCampoAcao,
  onAdicionarNotaAcao,
  onRemoverNotaAcao,
  onConcluirGrupo,
  onAplicarStatusGrupo,
  onEditarModeloEmail,
}: PainelSemanaProps) {
  const [filtro, setFiltro] = useState<FiltroPainel>('');
  const [fichaAberta, setFichaAberta] = useState<string | null>(null);
  const [respostaAberta, setRespostaAberta] = useState<string | null>(null);
  const [rascunhosNota, setRascunhosNota] = useState<Record<string, string>>({});
  const [salvandoAcao, setSalvandoAcao] = useState<string | null>(null);
  const [salvandoGrupo, setSalvandoGrupo] = useState<string | null>(null);
  const [feedbackGrupo, setFeedbackGrupo] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const executarGrupo = async (
    chave: string,
    quantidade: number,
    operacao: () => Promise<void> | void,
    sucesso: string,
  ) => {
    if (salvandoGrupo) return;
    setSalvandoGrupo(chave);
    setFeedbackGrupo(null);
    try {
      await operacao();
      setFeedbackGrupo({ tipo: 'sucesso', texto: sucesso });
    } catch (error) {
      const texto = error instanceof Error ? error.message : 'Não foi possível concluir a alteração em grupo.';
      setFeedbackGrupo({ tipo: 'erro', texto });
    } finally {
      setSalvandoGrupo(null);
    }
  };

  const processosTodos = useMemo(
    () => [...processosAtivos, ...processosEncerrados],
    [processosAtivos, processosEncerrados],
  );
  const acoes = useMemo(
    () => coletarAcoesPainel(processosAtivos, feriados),
    [processosAtivos, feriados],
  );
  const kpis = useMemo(() => calcularKpisPainel(acoes), [acoes]);
  const acoesFiltradas = useMemo(() => filtrarAcoesPainel(acoes, filtro), [acoes, filtro]);
  const grupos = useMemo(() => agruparFiltradas(acoesFiltradas), [acoesFiltradas]);
  const cardsProcessosAtivos = useMemo(
    () => processosAtivos.map((processo) => montarCardProcessoPainel(processo, feriados)),
    [processosAtivos, feriados],
  );
  const cardsProcessosEncerrados = useMemo(
    () => processosEncerrados.map((processo) => montarCardProcessoPainel(processo, feriados)),
    [processosEncerrados, feriados],
  );
  const idsProcessosFiltrados = useMemo(
    () => new Set(acoesFiltradas.map((acao) => acao.pid)),
    [acoesFiltradas],
  );

  const valorKpi = (filtroKpi: FiltroPainel): number => {
    switch (filtroKpi) {
      case 'late': return kpis.atrasado;
      case 'lateckm': return kpis.atrasadoCkm;
      case 'lateeles': return kpis.atrasadoEles;
      case 'hoje': return kpis.hoje;
      case 'act': return kpis.tomarAcao;
      case 'wait': return kpis.aguardandoRetorno;
      default: return kpis.noPrazo;
    }
  };

  const cardPassaFiltro = (card: ReturnType<typeof montarCardProcessoPainel>): boolean => {
    if (!filtro) return true;
    return idsProcessosFiltrados.has(card.processoId);
  };

  const handleGerarAgenda = (processo: ProcessoIntegracao) => {
    try {
      gerarAgendaOnboardingPdf(processo, feriados);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível gerar a Agenda de Onboarding.');
    }
  };

  const handleGerarRelatorio = (processo: ProcessoIntegracao) => {
    try {
      gerarRelatorioAndamentoPdf(processo, feriados);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível gerar o Relatório de Andamento.');
    }
  };

  const handleGerarCheckpoint = (processo: ProcessoIntegracao) => {
    try {
      gerarCheckpointPdf(processo, feriados);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível gerar o Checkpoint do Processo.');
    }
  };

  const handleGerarRelatorioEvolucao = (processo: ProcessoIntegracao, relN: number) => {
    try {
      gerarRelatorioEvolucaoPdf(processo, relN);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível gerar o Relatório de Evolução.');
    }
  };

  const registrarNota = async (processoId: string, itemId: string, chave: string) => {
    const texto = (rascunhosNota[chave] || '').trim();
    if (!texto || !onAdicionarNotaAcao) return;
    await onAdicionarNotaAcao(processoId, itemId, texto);
    setRascunhosNota((atual) => ({ ...atual, [chave]: '' }));
  };

  const renderCardProcesso = (card: ReturnType<typeof montarCardProcessoPainel>) => {
    const p = card.processo;
    const proxima = card.proximaEtapa;
    const encerrado = p.situacao === 'encerrado';
    const hojeTexto = encerrado
      ? 'encerrado'
      : card.diaAtual != null && card.diaAtual > 0
        ? `dia ${card.diaAtual} de 150`
        : 'não iniciou';

    return (
      <Card key={card.processoId} className={encerrado ? 'overflow-hidden opacity-75' : 'overflow-hidden'}>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border flex-shrink-0" style={p.cor ? { backgroundColor: p.cor } : undefined} />
                <h3 className="font-semibold truncate">{p.nome}</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{p.cargo || 'Cargo não informado'}{p.unidade ? ` · ${p.unidade}` : ''}</p>
            </div>
            <span className={`grid h-7 w-7 place-items-center rounded-full border text-sm font-bold flex-shrink-0 ${sinalClasses[card.sinal.k]}`} title={card.sinal.t} aria-label={card.sinal.t}>{card.sinal.i}</span>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1"><span>Progresso</span><span>{card.progresso.percentualConcluido}% feito</span></div>
            <div className="h-2 rounded-full bg-muted overflow-hidden flex">
              <div className="h-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, card.progresso.percentualConcluido))}%` }} title={`${card.progresso.concluidas} feitas`} />
              <div className="h-full bg-muted-foreground/30" style={{ width: `${Math.max(0, Math.min(100, card.progresso.percentualForaEscopo))}%` }} title={`${card.progresso.foraEscopo} fora do escopo`} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div><span className="text-muted-foreground">Início</span><div className="font-medium mt-1">{p.inicio ? formatarData(p.inicio) : '—'}</div></div>
            <div><span className="text-muted-foreground">Hoje</span><div className="font-medium mt-1">{hojeTexto}</div></div>
            <div><span className="text-muted-foreground">Feito</span><div className="font-medium mt-1">{card.progresso.concluidas}/{card.progresso.total}</div></div>
            <div><span className="text-muted-foreground">CKM</span><div className="font-medium mt-1">{card.pendencias.ckm} em aberto</div></div>
            <div><span className="text-muted-foreground">Eles</span><div className="font-medium mt-1">{card.pendencias.eles} em aberto</div></div>
          </div>

          <div className="border rounded-md p-3 bg-muted/20">
            <p className="text-xs text-muted-foreground">Próxima etapa</p>
            {proxima ? (
              <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div><p className="text-sm font-medium">{proxima.titulo}</p><p className="text-xs text-muted-foreground">{formatarData(proxima.data)}</p></div>
                <Badge variant="outline" className={statusClasses[proxima.status.k]}>{proxima.status.l}</Badge>
              </div>
            ) : <p className="text-sm font-medium mt-1">Todas as etapas concluídas</p>}
          </div>

          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button type="button" size="sm" variant="ghost" onClick={() => onProcessoClick?.(card.processoId)}>Abrir</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => handleGerarAgenda(p)}>Agenda</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => handleGerarRelatorio(p)}>Relatório</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => handleGerarCheckpoint(p)} title="Checkpoint — versão enxuta e visual">Checkpoint</Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const cardsAtivosVisiveis = cardsProcessosAtivos.filter(cardPassaFiltro);

  return (
    <div className="pi-painel space-y-5">
      {respostasPendentes.length > 0 && (
        <Card className="border-orange-300 bg-orange-50"><CardContent className="pt-6"><div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0"><AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" /><div className="min-w-0">
            <h3 className="font-semibold text-orange-900">{respostasPendentes.length} {respostasPendentes.length === 1 ? 'resposta pendente de vinculação' : 'respostas pendentes de vinculação'}</h3>
            <p className="text-sm text-orange-700 mt-1">{respostasPendentes.slice(0, 3).map(textoPendente).join(', ')}{respostasPendentes.length > 3 ? ` e mais ${respostasPendentes.length - 3}` : ''}</p>
          </div></div>
          {onRevisarRespostas && <Button size="sm" onClick={onRevisarRespostas} className="bg-orange-600 hover:bg-orange-700 flex-shrink-0">Revisar agora</Button>}
        </div></CardContent></Card>
      )}

      <div><h2 className="text-2xl font-bold">O que fazer agora</h2><p className="text-muted-foreground mt-2">Atrasados, esta semana e próxima semana.</p></div>

      <div className="pi-kpis grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        {KPIS_PAINEL_ORIGINAL.map((item) => {
          const ativo = filtro === item.filtro;
          return <button key={item.titulo} type="button" onClick={() => setFiltro(ativo ? '' : item.filtro)} className={`pi-kpi text-left rounded-lg border p-3 transition ${ativo ? 'ring-2 ring-offset-1 ring-primary' : 'hover:bg-muted/40'}`}>
            <p className="text-xs font-medium text-muted-foreground">{item.titulo}</p><p className="text-2xl font-bold mt-1">{valorKpi(item.filtro)}</p><p className="text-[11px] text-muted-foreground mt-1">{item.descricao}</p>
          </button>;
        })}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button type="button" variant={filtro === 'ckm' ? 'default' : 'outline'} size="sm" onClick={() => setFiltro(filtro === 'ckm' ? '' : 'ckm')}>Depende da CKM</Button>
        <Button type="button" variant={filtro === 'eles' ? 'default' : 'outline'} size="sm" onClick={() => setFiltro(filtro === 'eles' ? '' : 'eles')}>Depende deles</Button>
        {filtro && <Button type="button" variant="ghost" size="sm" onClick={() => setFiltro('')}>Limpar filtro</Button>}
      </div>

      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><h3 className="text-lg font-semibold">Ações agrupadas</h3><p className="text-sm text-muted-foreground">{grupos.length} tarefas · {acoesFiltradas.length} no total</p></div>

      {salvandoGrupo && (
        <div className="fixed bottom-5 right-5 z-50 max-w-[calc(100vw-2rem)] rounded-lg border bg-background px-4 py-3 text-sm font-medium shadow-lg">
          Salvando e conferindo no servidor...
        </div>
      )}
      {feedbackGrupo && !salvandoGrupo && (
        <div className={`fixed bottom-5 right-5 z-50 max-w-[calc(100vw-2rem)] rounded-lg border bg-background px-4 py-3 text-sm font-medium shadow-lg ${feedbackGrupo.tipo === 'erro' ? 'text-red-700' : 'text-emerald-700'}`}>
          {feedbackGrupo.texto}
        </div>
      )}

      <div className="space-y-4">
        {grupos.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-12"><CheckCircle2 className="w-10 h-10 text-emerald-600 mb-3" /><p className="font-medium">Nenhuma ação nessa seleção.</p></CardContent></Card>
        ) : grupos.map((grupo) => {
          const classe = statusClasses[grupo.statusPior.k];
          const ids = grupo.pessoas.map((acao) => acao.pid);
          const abertos = grupo.pessoas.filter((acao) => acao.st.k !== 'ok' && acao.st.k !== 'off');
          const idsAbertos = abertos.map((acao) => acao.pid);
          return (
            <div key={grupo.itemId} className="pi-action-group border rounded-lg overflow-hidden bg-background">
              <div className={`pi-action-head p-4 border-b ${classe}`}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-background/70">{formatarData(grupo.dataMaisAntiga)}</Badge><Badge variant="outline" className="bg-background/70">{grupo.statusPior.l}</Badge><Badge variant="outline" className="bg-background/70">{grupo.responsavel}</Badge>{grupo.formulario && <Badge variant="outline" className="bg-background/70">Formulário</Badge>}
                  </div><h3 className="font-semibold text-base leading-snug">{grupo.item.t}</h3><p className="text-xs opacity-80 mt-1">{grupo.etapa.t} · {grupo.pessoas.length} pessoa{grupo.pessoas.length === 1 ? '' : 's'}</p></div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {abertos.length > 1 && onConcluirGrupo && <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={Boolean(salvandoGrupo)}
                      onClick={() => executarGrupo(
                        `concluir|${grupo.itemId}`,
                        abertos.length,
                        () => onConcluirGrupo(grupo.itemId, idsAbertos),
                        `${abertos.length} ações marcadas como feitas e conferidas no servidor.`,
                      )}
                    >{salvandoGrupo === `concluir|${grupo.itemId}` ? `Salvando e conferindo ${abertos.length} pessoas...` : `Marcar as ${abertos.length} como feitas`}</Button>}
                    {onAplicarStatusGrupo && <select value="__placeholder__" disabled={Boolean(salvandoGrupo)} onChange={async (event) => {
                      const valor = event.target.value;
                      if (valor === '__placeholder__') return;
                      const status: StatusGrupo = valor === '__pendente__' ? '' : valor as StatusGrupo;
                      await executarGrupo(
                        `status|${grupo.itemId}`,
                        ids.length,
                        () => onAplicarStatusGrupo(grupo.itemId, ids, status),
                        `Situação aplicada a ${ids.length} pessoas e conferida no servidor.`,
                      );
                    }} className="h-9 max-w-[190px] rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-60" title="Aplicar a mesma situação a todas as pessoas desta tarefa">
                      <option value="__placeholder__">Aplicar a {grupo.pessoas.length > 1 ? `todas as ${grupo.pessoas.length}` : 'esta'}…</option><option value="__pendente__">Pendente</option><option value="prog">Programado</option><option value="doing">Em andamento</option><option value="wait">Aguardando resposta</option><option value="na">Não se aplica</option><option value="wont">Não será feita</option>
                    </select>}
                  </div>
                </div>
              </div>

              <div className="divide-y">
                {grupo.pessoas.map((acao) => {
                  const chave = `${acao.pid}|${grupo.itemId}`;
                  const ficha = fichaAcaoAtual(acao.p, grupo.itemId);
                  const aberta = fichaAberta === chave;
                  const resposta = respostaDoItem(acao.p, grupo.itemId);
                  const respostaVisivel = respostaAberta === chave && resposta;
                  const ehEmail = Boolean(grupo.item.mail || (grupo.item.mails && grupo.item.mails.length));
                  const temRespostaFormulario = Boolean(formKeyForItem(grupo.itemId));
                  const relN = ciclosRelatorioEvolucao(grupo.itemId);
                  const temRelatorioEvolucao = relN ? temDadosRelatorioEvolucao(acao.p, relN) : false;
                  const linkAcao = grupo.item.link
                    ? linkIntegracaoPorChave(
                        grupo.item.link,
                        config?.links,
                        typeof window !== 'undefined' ? window.location.origin : '',
                      )
                    : null;
                  const ultimaNota = ficha.notas[ficha.notas.length - 1];
                  return (
                    <div key={chave} className={`${aberta || respostaVisivel ? 'pi-person-row pi-person-row-open' : 'pi-person-row'} ${aberta || respostaVisivel ? 'bg-muted/20' : 'bg-background hover:bg-muted/30 transition'}`}>
                      <div className="p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            {onConcluirAcao && <button
                              type="button"
                              disabled={salvandoAcao === chave}
                              onClick={async () => {
                                const reabrindo = ficha.s === 'ok' || ficha.s === 'na' || ficha.s === 'wont';
                                if (salvandoAcao === chave) return;
                                setSalvandoAcao(chave);
                                try {
                                  await onConcluirAcao(acao.pid, grupo.itemId);
                                  setFichaAberta(null);
                                  setRespostaAberta(null);
                                  toast.success(
                                    reabrindo
                                      ? 'Marcação removida e conferida no servidor.'
                                      : 'Ação marcada como feita e conferida no servidor.',
                                  );
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : 'Não foi possível confirmar a alteração.');
                                } finally {
                                  setSalvandoAcao(null);
                                }
                              }}
                              className={`mt-0.5 grid h-[18px] w-[18px] flex-shrink-0 place-items-center rounded-[5px] border text-[10px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60 ${ficha.s === 'ok' ? 'border-emerald-600 bg-emerald-600 text-white' : ficha.s === 'na' || ficha.s === 'wont' ? 'border-border bg-muted text-muted-foreground' : 'border-border bg-background text-transparent hover:border-emerald-600'}`}
                              title={salvandoAcao === chave ? 'Salvando e conferindo...' : ficha.s === 'ok' ? 'Desmarcar' : ficha.s === 'na' || ficha.s === 'wont' ? 'Reabrir' : 'Marcar como feito'}
                              aria-label={`${ficha.s === 'ok' ? 'Desmarcar' : 'Marcar'} ${grupo.item.t} para ${acao.p.nome}`}
                            >
                              {salvandoAcao === chave ? '…' : ficha.s === 'na' || ficha.s === 'wont' ? '–' : '✓'}
                            </button>}
                            {salvandoAcao === chave && <span className="mt-0.5 text-[11px] text-muted-foreground whitespace-nowrap">Salvando e conferindo...</span>}
                            <div className="min-w-0 flex-1">
                              <button type="button" className="text-left min-w-0" onClick={() => onProcessoClick?.(acao.pid)}>
                                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full border flex-shrink-0" style={acao.p.cor ? { backgroundColor: acao.p.cor } : undefined} /><span className="font-medium truncate">{acao.p.nome}</span></div>
                                <div className="text-xs text-muted-foreground mt-1 ml-4">{acao.p.cargo || 'Cargo não informado'}{acao.p.unidade ? ` · ${acao.p.unidade}` : ''}</div>
                              </button>
                              {ficha.just && <div className="mt-2 text-xs text-muted-foreground border-l-2 pl-2"><b>Justificativa:</b> {ficha.just}</div>}
                              {ultimaNota && !aberta && <div className="mt-2 text-xs text-muted-foreground border-l-2 pl-2"><b>{ultimaNota.d || 'Registro'}</b> — {ultimaNota.t}{ficha.notas.length > 1 ? ` (+${ficha.notas.length - 1})` : ''}</div>}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 md:justify-end">
                            <Badge variant="outline" className={statusClasses[acao.st.k]}>{acao.st.l}</Badge>
                            {linkAcao?.u && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                title={linkAcao.n}
                                onClick={() => window.open(linkAcao.u, '_blank', 'noopener,noreferrer')}
                              >
                                Abrir link
                              </Button>
                            )}
                            {grupo.item.tut && (
                              <Button type="button" size="sm" variant="outline" asChild>
                                <a
                                  href={TUTORIAL_PRIMEIRO_ACESSO_URL}
                                  download={TUTORIAL_PRIMEIRO_ACESSO_NOME}
                                  title={TUTORIAL_PRIMEIRO_ACESSO_NOME}
                                >
                                  Baixar tutorial
                                </a>
                              </Button>
                            )}
                            {ehEmail && (
                              <EmailActionButtons
                                processo={acao.p}
                                item={grupo.item}
                                config={config}
                                feriados={feriados}
                                onAlternarEnviado={onAlterarStatusAcao ? (processoId, itemId) => {
                                  const atual = fichaAcaoAtual(acao.p, itemId).s;
                                  onAlterarStatusAcao(processoId, itemId, atual === 'ok' ? '' : 'ok');
                                  if (atual !== 'ok') {
                                    setFichaAberta(chave);
                                    setRespostaAberta(null);
                                  }
                                } : undefined}
                                onGerarRelatorioEvolucao={handleGerarRelatorioEvolucao}
                                onEditarModelo={onEditarModeloEmail}
                              />
                            )}
                            {grupo.item.pdf && <Button type="button" size="sm" variant="outline" onClick={() => handleGerarAgenda(acao.p)}>Agenda PDF</Button>}
                            {relN && <Button type="button" size="sm" variant={temRelatorioEvolucao ? 'outline' : 'ghost'} onClick={() => handleGerarRelatorioEvolucao(acao.p, relN)} title={temRelatorioEvolucao ? (relN === 5 ? 'Gera o PDF com a evolução completa do 1º ao 4º alinhamento' : 'Gera o PDF de evolução do formulário do gestor para anexar neste e-mail') : 'Ainda não há formulário do gestor registrado para este relatório'}>{relN === 5 ? 'Relatório de evolução (completo)' : 'Relatório de evolução'}</Button>}
                            {resposta && <Button type="button" size="sm" variant="outline" onClick={() => { setRespostaAberta(respostaVisivel ? null : chave); if (!respostaVisivel) setFichaAberta(null); }}>{respostaVisivel ? 'Ocultar resposta' : 'Resposta'}</Button>}
                            {temRespostaFormulario && !resposta && <Button type="button" size="sm" variant="outline" onClick={() => { setFichaAberta(chave); setRespostaAberta(null); }}>Registrar resposta</Button>}
                            <Button type="button" size="sm" variant="ghost" onClick={() => { setFichaAberta(aberta ? null : chave); if (!aberta) setRespostaAberta(null); }}>{ficha.notas.length ? `✎ ${ficha.notas.length}` : '⋯ ficha'}</Button>
                          </div>
                        </div>
                      </div>

                      {respostaVisivel && (
                        <div className="border-t bg-background px-4 py-4 md:pl-11 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Resposta registrada</p>
                              <p className="text-sm font-semibold mt-1">{nomeFormularioResposta(resposta)}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {dataResposta(resposta)}
                                {resposta.ciclo ? ` · ${resposta.ciclo}º alinhamento` : ''}
                                {resposta.papel ? ` · ${resposta.papel}` : ''}
                                {resposta.avaliador ? ` · por ${resposta.avaliador}` : ''}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {resposta.media != null && <Badge variant="outline">Média {Number(resposta.media).toFixed(1).replace('.', ',')}</Badge>}
                              {resposta.alertas?.length > 0 && <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">{resposta.alertas.length} ponto{resposta.alertas.length === 1 ? '' : 's'} de atenção</Badge>}
                            </div>
                          </div>
                          <div className="rounded-md border divide-y max-h-72 overflow-auto">
                            {camposResposta(resposta).length ? camposResposta(resposta).map((campo, indice) => (
                              <div key={`${campo.rotulo}-${indice}`} className="grid grid-cols-1 md:grid-cols-[minmax(140px,0.7fr)_minmax(0,1.3fr)] gap-1 md:gap-4 px-3 py-2 text-xs">
                                <span className="font-medium text-muted-foreground break-words">{campo.rotulo}</span>
                                <span className="whitespace-pre-wrap break-words">{campo.valor}</span>
                              </div>
                            )) : <div className="px-3 py-4 text-sm text-muted-foreground">A resposta está registrada, mas não há campos detalhados disponíveis neste registro.</div>}
                          </div>
                          <div className="flex justify-end"><Button type="button" size="sm" variant="ghost" onClick={() => setRespostaAberta(null)}>Ocultar resposta</Button></div>
                        </div>
                      )}

                      {aberta && (
                        <div className="border-t bg-muted/30 px-4 py-4 md:pl-11 space-y-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ficha da ação</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <label className="space-y-1 text-xs"><span className="font-medium text-muted-foreground">Situação</span><select value={ficha.s} onChange={(e) => onAlterarStatusAcao?.(acao.pid, grupo.itemId, e.target.value as StatusAcaoLegado)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{STATUS_ACAO.map(([valor, label]) => <option key={valor || 'pendente'} value={valor}>{label}</option>)}</select></label>
                            <label className="space-y-1 text-xs"><span className="font-medium text-muted-foreground">{ehEmail ? 'Enviado em' : 'Concluída em'}</span><input type="date" value={ficha.d} onChange={(e) => onAlterarCampoAcao?.(acao.pid, grupo.itemId, 'd', e.target.value)} className={`w-full rounded-md border bg-background px-3 py-2 text-sm ${ficha.s === 'ok' && !ficha.d ? 'border-amber-400' : 'border-input'}`} /></label>
                            {ehEmail && <label className="space-y-1 text-xs"><span className="font-medium text-muted-foreground">Programar envio para</span><input type="date" value={ficha.prog} onChange={(e) => onAlterarCampoAcao?.(acao.pid, grupo.itemId, 'prog', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /><span className="block text-[11px] text-muted-foreground">Na data marcada vira “feito” sozinho.</span></label>}
                          </div>

                          {(ficha.s === 'wont' || ficha.s === 'na') && <label className="block space-y-1 text-xs"><span className="font-medium text-muted-foreground">Justificativa</span><input value={ficha.just} onChange={(e) => onAlterarCampoAcao?.(acao.pid, grupo.itemId, 'just', e.target.value)} placeholder="por que esta ação não será feita?" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></label>}

                          {temRespostaFormulario && !resposta && (
                            <MicroImportacaoAcao
                              processo={{ ...acao.p, id: acao.pid }}
                              processoId={acao.pid}
                              itemId={grupo.itemId}
                              processos={processosTodos}
                              onSaved={() => window.location.reload()}
                            />
                          )}

                          <div className="border-t pt-3 space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Observações{ficha.notas.length ? ` (${ficha.notas.length})` : ''}</p>
                            {ficha.notas.map((nota, indice) => <div key={`${nota.d}-${indice}`} className="flex items-start gap-3 border-b border-dashed pb-2 text-sm"><span className="w-24 flex-shrink-0 font-mono text-[11px] text-muted-foreground">{nota.d || '—'}</span><span className="min-w-0 flex-1">{nota.t}</span>{onRemoverNotaAcao && <button type="button" className="text-muted-foreground hover:text-destructive" aria-label="Remover observação" onClick={() => onRemoverNotaAcao(acao.pid, grupo.itemId, indice)}>×</button>}</div>)}
                            <div className="flex gap-2"><input value={rascunhosNota[chave] || ''} onChange={(e) => setRascunhosNota((atual) => ({ ...atual, [chave]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); registrarNota(acao.pid, grupo.itemId, chave); } }} placeholder="nova observação — fica registrada com data e hora" className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" /><Button type="button" size="sm" variant="outline" onClick={() => registrarNota(acao.pid, grupo.itemId, chave)}>Registrar</Button></div>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-1"><Button type="button" size="sm" variant="ghost" onClick={() => setFichaAberta(null)}>Fechar</Button><span className="text-xs text-muted-foreground">prevista para {formatarData(acao.data)}</span></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{filtro ? 'Processos desta seleção' : 'Processos ativos'}</h3>{cardsAtivosVisiveis.length > 0 ? <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{cardsAtivosVisiveis.map(renderCardProcesso)}</div> : <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhum processo nessa seleção.</CardContent></Card>}</div>

      {!filtro && cardsProcessosEncerrados.length > 0 && <div className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Encerrados</h3><div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{cardsProcessosEncerrados.map(renderCardProcesso)}</div></div>}
    </div>
  );
}
