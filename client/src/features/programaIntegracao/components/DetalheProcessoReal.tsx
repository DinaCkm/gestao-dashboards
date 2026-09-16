import React, { useMemo, useState } from 'react';
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
import { EmailActionButtons } from './EmailActionButtons';
import { AlinhamentoPainelReal } from './AlinhamentoPainelReal';
import { MentoraPreparacaoPainel } from './MentoraPreparacaoPainel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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
  const resumo = useMemo(() => resumoDetalheProcesso(processo, feriados), [processo, feriados]);
  const dia = useMemo(() => diaAtualDetalhe(processo), [processo]);
  const alinhamentos = useMemo(() => resumosAlinhamentosDetalhe(processo, feriados), [processo, feriados]);
  const etapas = useMemo(() => etapasDetalheProcesso(processo, feriados, filtro), [processo, feriados, filtro]);

  const salvar = async (proximo: ProcessoIntegracao) => onSalvarProcesso(proximo);

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
            <Badge variant="outline">{processo.situacao === 'encerrado' ? 'Encerrado' : 'Ativo'}</Badge>
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
                      />
                      <AlinhamentoPainelReal
                        processo={processo}
                        numero={etapa.et.al as 1 | 2 | 3 | 4}
                        feriados={feriados}
                        config={config}
                        onSalvarProcesso={salvar}
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
                        <div key={item.id} className="space-y-3 p-4">
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
                              <input type="date" value={ficha.d} onChange={(e) => salvar(aplicarCampoFichaAcao(processo, item.id, 'd', e.target.value))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </label>
                            {ehEmail && (
                              <label className="space-y-1 text-xs">
                                <span className="font-medium text-muted-foreground">Programar envio</span>
                                <input type="date" value={ficha.prog} onChange={(e) => salvar(aplicarCampoFichaAcao(processo, item.id, 'prog', e.target.value))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                              </label>
                            )}
                          </div>

                          {(ficha.s === 'na' || ficha.s === 'wont') && (
                            <input
                              value={ficha.just}
                              onChange={(e) => salvar(aplicarCampoFichaAcao(processo, item.id, 'just', e.target.value))}
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
    </div>
  );
}
