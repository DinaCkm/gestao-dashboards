import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import {
  diaAtualDetalhe,
  etapasDetalheProcesso,
  FILTROS_DETALHE_PROCESSO,
  resumoDetalheProcesso,
  resumosAlinhamentosDetalhe,
  type FiltroDetalheProcesso,
} from '../helpers/detalheProcessoRealHelpers';
import { calcularStatusItem } from '../helpers/statusHelpers';
import {
  aplicarCampoFichaAcao,
  aplicarStatusAcao,
  fichaAcaoAtual,
  type StatusAcaoLegado,
} from '../helpers/itemStateHelpers';
import { formatarData } from '../helpers/dateHelpers';
import { respostaDoItem } from '../helpers/respostaItemHelpers';
import type { PapelCobranca } from '../helpers/cobrancaFormulariosHelpers';
import { gerarBriefingMentoraPdf, gerarRelatorioMentoraWord } from '../helpers/mentoraDocumentos';
import { gerarAgendaOnboardingPdf } from '../helpers/agendaPdf';
import { gerarRelatorioAndamentoPdf } from '../helpers/relatorioAndamentoPdf';
import { gerarCheckpointPdf } from '../helpers/checkpointPdf';
import { EmailActionButtons } from './EmailActionButtons';
import { AlinhamentoPainelReal } from './AlinhamentoPainelReal';
import { AtaRelatorioPainel } from './AtaRelatorioPainel';
import { MentoraPreparacaoPainel } from './MentoraPreparacaoPainel';
import { CobrancaFinalPainel, CobrancaFormulariosDialog } from './CobrancaFormulariosDialog';
import { BemTesteProcesso } from './BemTesteProcesso';
import { RespostasProcessoAgrupadas } from './RespostasProcessoAgrupadas';
import { ObservacoesAcao } from './ObservacoesAcao';
import { ControlesEspeciaisAcao } from './ControlesEspeciaisAcao';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface DetalheProcessoRealProps {
  processo: ProcessoIntegracao;
  config: BootstrapState['config'];
  feriados?: string[];
  onSalvarProcesso: (processo: ProcessoIntegracao) => Promise<void> | void;
  saving?: boolean;
  onEditarModeloEmail?: (chave: string) => void;
}

const statusClasses = {
  late: 'border-red-300 bg-red-50 text-red-800',
  act: 'border-amber-300 bg-amber-50 text-amber-800',
  wait: 'border-orange-300 bg-orange-50 text-orange-800',
  ontime: 'border-blue-300 bg-blue-50 text-blue-800',
  ok: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  off: 'border-slate-300 bg-slate-50 text-slate-700',
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

function iniciais(nome: string): string {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  return `${partes[0]?.[0] || ''}${partes.length > 1 ? partes[partes.length - 1]?.[0] || '' : ''}`.toUpperCase();
}

export function DetalheProcessoReal({
  processo,
  config,
  feriados = [],
  onSalvarProcesso,
  saving = false,
  onEditarModeloEmail,
}: DetalheProcessoRealProps) {
  const [filtro, setFiltro] = useState<FiltroDetalheProcesso>('');
  const [abertas, setAbertas] = useState<Record<string, boolean>>({});
  const [statusTemporario, setStatusTemporario] = useState<Record<string, StatusAcaoLegado>>({});
  const [feedbackStatus, setFeedbackStatus] = useState<Record<string, 'salvando' | 'salvo' | 'erro'>>({});
  const [rascunhoProcesso, setRascunhoProcesso] = useState<ProcessoIntegracao>(processo);
  const [dadosAlterados, setDadosAlterados] = useState(false);
  const [dadosSalvos, setDadosSalvos] = useState(false);
  const timersFeedbackRef = useRef<Record<string, number>>({});
  const [cobrancaAberta, setCobrancaAberta] = useState(false);
  const [cobrancaCiclo, setCobrancaCiclo] = useState<1 | 2 | 3 | 4 | undefined>(undefined);
  const [cobrancaPapel, setCobrancaPapel] = useState<PapelCobranca | null>(null);
  const deepLinkAplicadoRef = useRef(false);
  const itemDeepLink = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('item') || '';
  }, []);
  const resumo = useMemo(() => resumoDetalheProcesso(processo, feriados), [processo, feriados]);
  const dia = useMemo(() => diaAtualDetalhe(processo), [processo]);
  const alinhamentos = useMemo(() => resumosAlinhamentosDetalhe(processo, feriados), [processo, feriados]);
  const etapas = useMemo(() => etapasDetalheProcesso(processo, feriados, filtro), [processo, feriados, filtro]);

  useEffect(() => {
    if (!itemDeepLink || deepLinkAplicadoRef.current) return;
    const alvo = etapas.find(({ itens }) => itens.some((item) => item.id === itemDeepLink));
    if (!alvo) return;

    deepLinkAplicadoRef.current = true;
    setFiltro('');
    setAbertas((atual) => ({ ...atual, [alvo.etapa.et.id]: true }));

    const primeiroFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(`integracao-item-${itemDeepLink}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    return () => window.cancelAnimationFrame(primeiroFrame);
  }, [etapas, itemDeepLink]);

  useEffect(() => {
    if (!dadosAlterados) setRascunhoProcesso(processo);
  }, [processo, dadosAlterados]);

  useEffect(() => {
    setStatusTemporario((atual) => {
      const proximo = { ...atual };
      let mudou = false;
      Object.entries(atual).forEach(([itemId, valor]) => {
        if (fichaAcaoAtual(processo, itemId).s === valor) {
          delete proximo[itemId];
          mudou = true;
        }
      });
      return mudou ? proximo : atual;
    });
  }, [processo]);

  useEffect(() => () => {
    Object.values(timersFeedbackRef.current).forEach((timer) => window.clearTimeout(timer));
  }, []);

  const salvar = async (proximo: ProcessoIntegracao) => onSalvarProcesso(proximo);

  const limparFeedbackDepois = (itemId: string) => {
    const anterior = timersFeedbackRef.current[itemId];
    if (anterior) window.clearTimeout(anterior);
    timersFeedbackRef.current[itemId] = window.setTimeout(() => {
      setFeedbackStatus((atual) => {
        if (!atual[itemId]) return atual;
        const proximo = { ...atual };
        delete proximo[itemId];
        return proximo;
      });
      delete timersFeedbackRef.current[itemId];
    }, 3500);
  };

  const alterarStatusItem = async (itemId: string, valor: StatusAcaoLegado) => {
    setStatusTemporario((atual) => ({ ...atual, [itemId]: valor }));
    setFeedbackStatus((atual) => ({ ...atual, [itemId]: 'salvando' }));

    try {
      await salvar(aplicarStatusAcao(processo, itemId, valor));
      setFeedbackStatus((atual) => ({ ...atual, [itemId]: 'salvo' }));
      limparFeedbackDepois(itemId);
    } catch (error) {
      setStatusTemporario((atual) => {
        const proximo = { ...atual };
        delete proximo[itemId];
        return proximo;
      });
      setFeedbackStatus((atual) => ({ ...atual, [itemId]: 'erro' }));
      limparFeedbackDepois(itemId);
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar a situação. O valor anterior foi restaurado.');
    }
  };

  const alterarDadoProcesso = (campo: keyof ProcessoIntegracao, valor: string) => {
    setRascunhoProcesso((atual) => ({ ...atual, [campo]: valor } as ProcessoIntegracao));
    setDadosAlterados(true);
    setDadosSalvos(false);
  };

  const salvarDadosProcesso = async () => {
    if (!dadosAlterados || saving) return;
    try {
      await salvar(rascunhoProcesso);
      setDadosAlterados(false);
      setDadosSalvos(true);
    } catch (error) {
      setDadosSalvos(false);
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar as alterações. Os dados editados foram mantidos na tela.');
    }
  };

  const gerarAgenda = () => {
    try { gerarAgendaOnboardingPdf(processo, feriados); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível gerar a Agenda de Onboarding.'); }
  };
  const gerarRelatorio = () => {
    try { gerarRelatorioAndamentoPdf(processo, feriados); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível gerar o Relatório de Andamento.'); }
  };
  const gerarCheckpoint = () => {
    try { gerarCheckpointPdf(processo, feriados); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível gerar o Checkpoint.'); }
  };

  const abrirCobranca = (papel?: PapelCobranca, ciclo?: 1 | 2 | 3 | 4) => {
    setCobrancaPapel(papel || null);
    setCobrancaCiclo(ciclo);
    setCobrancaAberta(true);
  };

  const campoTexto = (
    campo: keyof ProcessoIntegracao,
    label: string,
    type: React.HTMLInputTypeAttribute = 'text',
    placeholder = '',
  ) => (
    <label className="space-y-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={String(rascunhoProcesso[campo] ?? '')}
        placeholder={placeholder}
        disabled={saving}
        onChange={(e) => alterarDadoProcesso(campo, e.currentTarget.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-60"
      />
    </label>
  );

  const campoLongo = (
    campo: keyof ProcessoIntegracao,
    label: string,
    placeholder = '',
  ) => (
    <label className="space-y-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <textarea
        value={String(rascunhoProcesso[campo] ?? '')}
        placeholder={placeholder}
        disabled={saving}
        onChange={(e) => alterarDadoProcesso(campo, e.currentTarget.value)}
        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-60"
      />
    </label>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full border bg-muted font-semibold">
                {iniciais(rascunhoProcesso.nome)}
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold truncate">{rascunhoProcesso.nome}</h2>
                <p className="text-sm text-muted-foreground">{rascunhoProcesso.cargo || 'Cargo não informado'}{rascunhoProcesso.unidade ? ` · ${rascunhoProcesso.unidade}` : ''}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Início {processo.inicio ? formatarData(processo.inicio) : '—'} · {dia != null && dia > 0 ? `dia ${dia} de 150` : 'jornada ainda não iniciada'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button type="button" size="sm" onClick={gerarAgenda}>Agenda em PDF</Button>
              <Button type="button" size="sm" variant="secondary" onClick={gerarRelatorio}>Relatório</Button>
              <Button type="button" size="sm" variant="outline" onClick={gerarCheckpoint}>Checkpoint</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => abrirCobranca()}>
                {resumo.formulariosVencidos ? `Cobrar formulários (${resumo.formulariosVencidos})` : 'Formulários em dia'}
              </Button>
              <Badge variant="outline">{processo.situacao === 'encerrado' ? 'Encerrado' : 'Ativo'}</Badge>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span>Progresso geral</span>
              <span>{resumo.feitas}/{resumo.total} feitas · {resumo.percentualFeitas}%</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${resumo.percentualFeitas}%` }} />
              <div className="h-full bg-muted-foreground/30" style={{ width: `${resumo.percentualForaEscopo}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5 text-sm">
            <div><p className="text-xs text-muted-foreground">Em aberto</p><p className="font-semibold">{resumo.abertas}</p></div>
            <div><p className="text-xs text-muted-foreground">CKM</p><p className="font-semibold">{resumo.ckmAbertas}</p></div>
            <div><p className="text-xs text-muted-foreground">Eles</p><p className="font-semibold">{resumo.elesAbertas}</p></div>
            <div><p className="text-xs text-muted-foreground">Formulários abertos</p><p className="font-semibold">{resumo.formulariosAbertos}</p></div>
            <div><p className="text-xs text-muted-foreground">Formulários vencidos</p><p className="font-semibold">{resumo.formulariosVencidos}</p></div>
          </div>
        </CardContent>
      </Card>

      <details className="rounded-lg border bg-background">
        <summary className="cursor-pointer px-4 py-3 font-semibold">
          Dados do processo <span className="ml-2 text-xs font-normal text-muted-foreground">as datas e os e-mails usados no acompanhamento vêm daqui</span>
        </summary>
        <div className="border-t p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {campoTexto('nome', 'Colaborador', 'text', 'Nome completo')}
            {campoTexto('email', 'E-mail pessoal', 'email')}
            {campoTexto('emailCorporativo', 'E-mail corporativo', 'email')}
            {campoTexto('cargo', 'Cargo')}
            {campoTexto('unidade', 'Área / Unidade')}
            {campoTexto('cpf', 'CPF')}
            {campoTexto('nasc', 'Data de nascimento', 'date')}
            {campoTexto('tel', 'Telefone')}
            {campoTexto('part', 'Participação', 'text', 'Presencial')}
            <label className="space-y-1 text-xs">
              <span className="font-medium text-muted-foreground">Tipo</span>
              <select
                value={rascunhoProcesso.tipo || 'Onboarding'}
                disabled={saving}
                onChange={(e) => alterarDadoProcesso('tipo', e.currentTarget.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-60"
              >
                <option value="Onboarding">Onboarding</option>
                <option value="Crossboarding">Crossboarding</option>
              </select>
            </label>
            {campoTexto('inicio', '1º dia na unidade', 'date')}
            {campoTexto('gestor', 'Gestor receptor')}
            {campoTexto('gestorEmail', 'E-mail do gestor', 'email')}
            {campoTexto('gestorTel', 'Telefone / WhatsApp do gestor')}
            {campoTexto('anjo', 'Anjo')}
            {campoTexto('anjoEmail', 'E-mail do Anjo', 'email')}
            {campoTexto('ugp', 'Destinatário na UGP', 'text', 'nome ou e-mail')}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {campoLongo('horarios', 'Horários sugeridos (um por linha)', '09h00\n14h00')}
            {campoLongo('statusPdi', 'Status do PDI (usado só se não houver Acompanhamento do PDI respondido)')}
            {campoLongo('pendencias', 'Pendências extras (somadas às calculadas)')}
            {campoLongo('statusCursos', 'Status Jornada Compliance (usado só se não houver Acompanhamento do PDI respondido)')}
            {campoLongo('consideracoes', 'Considerações da CKM para a UGP')}
            {campoLongo('notas', 'Anotações internas')}
          </div>
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              {saving ? (
                <span className="font-medium text-amber-700">Salvando e conferindo as alterações no servidor...</span>
              ) : dadosAlterados ? (
                <span className="font-medium text-amber-700">Há alterações não salvas.</span>
              ) : dadosSalvos ? (
                <span className="font-medium text-emerald-700">✓ Alterações salvas e conferidas no servidor.</span>
              ) : (
                <span className="text-muted-foreground">Edite os dados e clique em “Salvar alterações”.</span>
              )}
            </div>
            <Button
              type="button"
              onClick={() => void salvarDadosProcesso()}
              disabled={saving || !dadosAlterados}
              className="shrink-0"
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </div>
      </details>

      <BemTesteProcesso processo={processo} config={config} onSalvarProcesso={salvar} />
      <RespostasProcessoAgrupadas processo={processo} />

      <div className="grid gap-3 md:grid-cols-4">
        {alinhamentos.map((alinhamento) => (
          <Card key={alinhamento.n}>
            <CardContent className="pt-5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{alinhamento.n}º alinhamento</p>
                <Badge variant="outline" className={statusClasses[alinhamento.estado.k]}>{alinhamento.estado.l}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Marco do {alinhamento.marco}º dia · {alinhamento.data ? formatarData(alinhamento.data) : 'data não definida'}</p>
              <p className="text-xs">Agendamento: <b>{alinhamento.agendamento}</b></p>
              <p className="text-xs">Reunião: <b>{alinhamento.realizado ? 'realizada' : 'não registrada'}</b></p>
              {alinhamento.relatorios && <p className="text-xs">Relatórios: <b>{alinhamento.relatorios}</b></p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS_DETALHE_PROCESSO.map(([valor, label]) => (
          <Button key={valor || 'todos'} type="button" size="sm" variant={filtro === valor ? 'default' : 'outline'} onClick={() => setFiltro(valor)}>
            {label}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {etapas.map(({ etapa, estado, itens, abertaPorPadrao }) => {
          const aberta = abertas[etapa.et.id] ?? abertaPorPadrao;
          return (
            <div key={etapa.et.id} className="overflow-hidden rounded-lg border bg-background">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-muted/30"
                onClick={() => setAbertas((atual) => ({ ...atual, [etapa.et.id]: !aberta }))}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{etapa.et.t}</span>
                    <Badge variant="outline">Dia {etapa.dia}</Badge>
                    <Badge variant="outline" className={statusClasses[estado.k]}>{estado.l}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatarData(etapa.data)} · {estado.ok} feita{estado.ok === 1 ? '' : 's'} · {estado.ab} em aberto</p>
                </div>
                <span className="text-muted-foreground">{aberta ? '−' : '+'}</span>
              </button>

              {aberta && (
                <div className="border-t">
                  {etapa.et.al && (
                    <div className="space-y-3 border-b bg-muted/10 p-4">
                      <MentoraPreparacaoPainel
                        processo={processo}
                        numero={etapa.et.al as 1 | 2 | 3 | 4}
                        feriados={feriados}
                        config={config}
                        onSalvarProcesso={salvar}
                        onGerarBriefing={() => gerarBriefingMentoraPdf(processo, etapa.et.al as 1 | 2 | 3 | 4, config, feriados)}
                        onGerarWord={() => gerarRelatorioMentoraWord(processo, etapa.et.al as 1 | 2 | 3 | 4, config, feriados)}
                      />
                      <AlinhamentoPainelReal
                        processo={processo}
                        numero={etapa.et.al as 1 | 2 | 3 | 4}
                        feriados={feriados}
                        config={config}
                        onSalvarProcesso={salvar}
                        onEditarModeloEmail={onEditarModeloEmail}
                      />
                      <AtaRelatorioPainel
                        processo={processo}
                        numero={etapa.et.al as 1 | 2 | 3 | 4}
                        config={config}
                        feriados={feriados}
                        onSalvarProcesso={salvar}
                      />
                    </div>
                  )}

                  {etapa.et.id === 'pos4' && (
                    <div className="border-b bg-muted/10 p-4">
                      <CobrancaFinalPainel
                        processo={processo}
                        feriados={feriados}
                        onCobrar={(papel) => abrirCobranca(papel, 4)}
                      />
                    </div>
                  )}

                  <div className="divide-y">
                    {itens.map((item) => {
                      const st = calcularStatusItem(processo, item.id, etapa.data);
                      const ficha = fichaAcaoAtual(processo, item.id);
                      const statusVisual = statusTemporario[item.id] ?? ficha.s;
                      const feedback = feedbackStatus[item.id];
                      const resposta = respostaDoItem(processo, item.id);
                      const ehEmail = Boolean(item.mail || item.mails?.length);
                      return (
                        <div id={`integracao-item-${item.id}`} key={item.id} className="space-y-3 p-4 scroll-mt-6">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <p className="font-medium">{item.t}</p>
                              <p className="mt-1 text-xs text-muted-foreground">Responsável: {item.r} · previsto para {formatarData(etapa.data)}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={feedback === 'salvando' ? 'border-amber-300 bg-amber-50 text-amber-800' : statusClasses[st.k]}>
                                {feedback === 'salvando' ? 'Salvando alteração...' : st.l}
                              </Badge>
                              {ehEmail && (
                                <EmailActionButtons
                                  processo={processo}
                                  item={item}
                                  config={config}
                                  feriados={feriados}
                                  onAlternarEnviado={async () => salvar(aplicarStatusAcao(processo, item.id, ficha.s === 'ok' ? '' : 'ok'))}
                                  onEditarModelo={onEditarModeloEmail}
                                />
                              )}
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-3">
                            <label className="space-y-1 text-xs">
                              <span className="font-medium text-muted-foreground">Situação</span>
                              <select
                                value={statusVisual}
                                disabled={saving || feedback === 'salvando'}
                                onChange={(e) => void alterarStatusItem(item.id, e.currentTarget.value as StatusAcaoLegado)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-60"
                              >
                                {STATUS_ACAO.map(([valor, label]) => <option key={valor || 'pend'} value={valor}>{label}</option>)}
                              </select>
                              <span className={`block min-h-4 text-[11px] ${
                                feedback === 'salvando'
                                  ? 'font-medium text-amber-700'
                                  : feedback === 'salvo'
                                    ? 'font-medium text-emerald-700'
                                    : feedback === 'erro'
                                      ? 'font-medium text-destructive'
                                      : 'text-muted-foreground'
                              }`}>
                                {feedback === 'salvando'
                                  ? 'Salvando e conferindo no servidor...'
                                  : feedback === 'salvo'
                                    ? '✓ Salvo no servidor'
                                    : feedback === 'erro'
                                      ? 'Não foi salvo — o valor anterior foi restaurado.'
                                      : 'Salva automaticamente'}
                              </span>
                            </label>
                            <label className="space-y-1 text-xs">
                              <span className="font-medium text-muted-foreground">Concluída/enviada em</span>
                              <input
                                key={`${item.id}-d-${ficha.d}`}
                                type="date"
                                defaultValue={ficha.d}
                                disabled={saving}
                                onBlur={(e) => {
                                  if (e.currentTarget.value !== ficha.d) void salvar(aplicarCampoFichaAcao(processo, item.id, 'd', e.currentTarget.value));
                                }}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              />
                            </label>
                            {ehEmail && (
                              <label className="space-y-1 text-xs">
                                <span className="font-medium text-muted-foreground">Programar envio</span>
                                <input
                                  key={`${item.id}-prog-${ficha.prog}`}
                                  type="date"
                                  defaultValue={ficha.prog}
                                  disabled={saving}
                                  onBlur={(e) => {
                                    if (e.currentTarget.value !== ficha.prog) void salvar(aplicarCampoFichaAcao(processo, item.id, 'prog', e.currentTarget.value));
                                  }}
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                              </label>
                            )}
                          </div>

                          {(ficha.s === 'na' || ficha.s === 'wont') && (
                            <input
                              key={`${item.id}-just-${ficha.just}`}
                              defaultValue={ficha.just}
                              disabled={saving}
                              onBlur={(e) => {
                                if (e.currentTarget.value !== ficha.just) void salvar(aplicarCampoFichaAcao(processo, item.id, 'just', e.currentTarget.value));
                              }}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              placeholder="justificativa"
                            />
                          )}

                          <ObservacoesAcao processo={processo} itemId={item.id} onSalvarProcesso={salvar} />

                          <ControlesEspeciaisAcao
                            processo={processo}
                            item={item}
                            resposta={resposta}
                            config={config}
                            feriados={feriados}
                            onSalvarProcesso={salvar}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CobrancaFormulariosDialog
        open={cobrancaAberta}
        onOpenChange={setCobrancaAberta}
        processo={processo}
        config={config}
        feriados={feriados}
        ciclo={cobrancaCiclo}
        initialPapel={cobrancaPapel}
        onSalvarProcesso={salvar}
      />
    </div>
  );
}
