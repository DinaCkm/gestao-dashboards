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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface DetalheProcessoRealProps {
  processo: ProcessoIntegracao;
  config: BootstrapState['config'];
  feriados?: string[];
  onSalvarProcesso: (processo: ProcessoIntegracao) => Promise<void> | void;
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
}: DetalheProcessoRealProps) {
  const [filtro, setFiltro] = useState<FiltroDetalheProcesso>('');
  const [abertas, setAbertas] = useState<Record<string, boolean>>({});
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

  const salvar = async (proximo: ProcessoIntegracao) => onSalvarProcesso(proximo);

  const salvarCampoProcesso = async (campo: keyof ProcessoIntegracao, valor: string) => {
    if (String(processo[campo] ?? '') === valor) return;
    await salvar({ ...processo, [campo]: valor } as ProcessoIntegracao);
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
        key={`${String(campo)}-${String(processo[campo] ?? '')}`}
        type={type}
        defaultValue={String(processo[campo] ?? '')}
        placeholder={placeholder}
        onBlur={(e) => void salvarCampoProcesso(campo, e.currentTarget.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
        key={`${String(campo)}-${String(processo[campo] ?? '')}`}
        defaultValue={String(processo[campo] ?? '')}
        placeholder={placeholder}
        onBlur={(e) => void salvarCampoProcesso(campo, e.currentTarget.value)}
        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                {iniciais(processo.nome)}
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold truncate">{processo.nome}</h2>
                <p className="text-sm text-muted-foreground">{processo.cargo || 'Cargo não informado'}{processo.unidade ? ` · ${processo.unidade}` : ''}</p>
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
                value={processo.tipo || 'Onboarding'}
                onChange={(e) => void salvarCampoProcesso('tipo', e.currentTarget.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
          <p className="text-[11px] text-muted-foreground">Campos de texto são gravados apenas quando você sai do campo e somente se o conteúdo realmente mudou. A confirmação de leitura do processo continua sendo feita pelo cliente de persistência.</p>
        </div>
      </details>

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
                              <Badge variant="outline" className={statusClasses[st.k]}>{st.l}</Badge>
                              {ehEmail && (
                                <EmailActionButtons
                                  processo={processo}
                                  item={item}
                                  config={config}
                                  feriados={feriados}
                                  onAlternarEnviado={async () => salvar(aplicarStatusAcao(processo, item.id, ficha.s === 'ok' ? '' : 'ok'))}
                                />
                              )}
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-3">
                            <label className="space-y-1 text-xs">
                              <span className="font-medium text-muted-foreground">Situação</span>
                              <select
                                value={ficha.s}
                                onChange={(e) => salvar(aplicarStatusAcao(processo, item.id, e.target.value as StatusAcaoLegado))}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              >
                                {STATUS_ACAO.map(([valor, label]) => <option key={valor || 'pend'} value={valor}>{label}</option>)}
                              </select>
                            </label>
                            <label className="space-y-1 text-xs">
                              <span className="font-medium text-muted-foreground">Concluída/enviada em</span>
                              <input
                                key={`${item.id}-d-${ficha.d}`}
                                type="date"
                                defaultValue={ficha.d}
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
                              onBlur={(e) => {
                                if (e.currentTarget.value !== ficha.just) void salvar(aplicarCampoFichaAcao(processo, item.id, 'just', e.currentTarget.value));
                              }}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              placeholder="justificativa"
                            />
                          )}

                          {resposta && (
                            <div className="rounded-md border bg-muted/20 p-3 text-xs">
                              <b>Resposta registrada</b>{resposta.submittedAt ? ` · ${formatarData(String(resposta.submittedAt).slice(0, 10))}` : ''}
                              {resposta.media != null ? ` · média ${Number(resposta.media).toFixed(1).replace('.', ',')}` : ''}
                            </div>
                          )}
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
