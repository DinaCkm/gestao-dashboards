import React, { useEffect, useMemo, useState } from 'react';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import { PLANO_REAL } from '../helpers/planoReal';
import { cronogramaReal } from '../helpers/painelAcoes';
import { calcularStatusItem } from '../helpers/statusHelpers';
import {
  adicionarNotaAlinhamento,
  alternarAtaArquivadaAlinhamento,
  aplicarCampoAlinhamento,
  aplicarCampoAtaAlinhamento,
  aplicarSituacaoAgendamento,
  aplicarSituacaoRelatorioMentora,
  estadoAlinhamentoAtual,
  removerNotaAlinhamento,
  registrarRealizacaoAlinhamento,
  registrarRealizacaoERecalcularAgenda,
  type CampoAlinhamento,
  type SituacaoAgendamento,
  type SituacaoRelatorioMentora,
} from '../helpers/alinhamentoStateHelpers';
import { fichaAcaoAtual, aplicarCampoFichaAcao, aplicarStatusAcao } from '../helpers/itemStateHelpers';
import { formatarData } from '../helpers/dateHelpers';
import { EmailActionButtons } from './EmailActionButtons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AlinhamentoPainelRealProps {
  processo: ProcessoIntegracao;
  numero: 1 | 2 | 3 | 4;
  feriados?: string[];
  config: BootstrapState['config'];
  onSalvarProcesso: (processo: ProcessoIntegracao) => Promise<void> | void;
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

const SITUACOES_AGENDAMENTO: Array<[Exclude<SituacaoAgendamento, ''>, string]> = [
  ['sim', 'Sim'],
  ['aguardando', 'Aguardando'],
  ['nao', 'Não'],
];

const SITUACOES_RELATORIO: Array<[Exclude<SituacaoRelatorioMentora, ''>, string]> = [
  ['ok', 'Recebidos'],
  ['parcial', 'Parcial'],
  ['pend', 'Pendentes'],
];

function itemAgendamento(numero: number) {
  return PLANO_REAL.find((etapa) => etapa.id === `ag${numero}`)?.itens.find((item) => item.id === `ag${numero}-01`) || null;
}

function linha({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-b py-3 last:border-b-0 md:grid-cols-[170px_minmax(0,1fr)] md:items-start">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function AlinhamentoPainelReal({
  processo,
  numero,
  feriados = [],
  config,
  onSalvarProcesso,
  onEditarModeloEmail,
}: AlinhamentoPainelRealProps) {
  const estado = estadoAlinhamentoAtual(processo, numero);
  const [nota, setNota] = useState('');
  const [rascunho, setRascunho] = useState<ProcessoIntegracao>(processo);
  const [statusEdicao, setStatusEdicao] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const agItem = itemAgendamento(numero);

  useEffect(() => {
    if (statusEdicao === 'dirty' || statusEdicao === 'saving') return;
    setRascunho(processo);
  }, [processo, statusEdicao]);

  const estadoRascunho = estadoAlinhamentoAtual(rascunho, numero);
  const fichaEmail = fichaAcaoAtual(processo, `ag${numero}-01`);
  const fichaEmailRascunho = fichaAcaoAtual(rascunho, `ag${numero}-01`);

  const etapaAg = useMemo(
    () => cronogramaReal(processo, feriados).find((etapa) => etapa.et.id === `ag${numero}`),
    [processo, feriados, numero],
  );
  const statusEmail = etapaAg
    ? calcularStatusItem(processo, `ag${numero}-01`, etapaAg.data)
    : { k: 'ontime', l: 'No prazo', dif: 0 } as const;

  const salvarDireto = async (proximo: ProcessoIntegracao) => {
    if (statusEdicao === 'dirty' || statusEdicao === 'saving') {
      toast.warning('Salve primeiro as alterações digitadas neste alinhamento.');
      return;
    }
    await onSalvarProcesso(proximo);
  };

  const alterarRascunho = (proximo: ProcessoIntegracao) => {
    setRascunho(proximo);
    setStatusEdicao('dirty');
  };

  const mudarCampo = (campo: CampoAlinhamento, valor: string) => {
    alterarRascunho(aplicarCampoAlinhamento(rascunho, numero, campo, valor));
  };

  const mudarCampoAta = (campo: 'texto' | 'link', valor: string) => {
    alterarRascunho(aplicarCampoAtaAlinhamento(rascunho, numero, campo, valor));
  };

  const mudarCampoEmail = (campo: 'd' | 'prog', valor: string) => {
    alterarRascunho(aplicarCampoFichaAcao(rascunho, `ag${numero}-01`, campo, valor));
  };

  const salvarAlteracoes = async () => {
    if (statusEdicao !== 'dirty') return;
    try {
      setStatusEdicao('saving');
      let proximo = rascunho;
      const realizadoAnterior = estado.realizado;
      const realizadoNovo = estadoRascunho.realizado;

      if (realizadoNovo && realizadoNovo !== realizadoAnterior) {
        const previstaAtual = cronogramaReal(processo, feriados).find((etapa) => etapa.et.al === numero)?.data || '';
        if (previstaAtual && realizadoNovo !== previstaAtual) {
          const recalcular = window.confirm(
            `O ${numero}º alinhamento estava previsto para ${formatarData(previstaAtual)} e foi realizado em ${formatarData(realizadoNovo)}.\n\nDeseja recalcular a agenda futura com base na data real deste alinhamento?\n\nOK = Recalcular agenda futura\nCancelar = Manter agenda atual`
          );
          proximo = recalcular
            ? registrarRealizacaoERecalcularAgenda(rascunho, numero, realizadoNovo, feriados)
            : registrarRealizacaoAlinhamento(rascunho, numero, realizadoNovo);
        } else {
          proximo = registrarRealizacaoAlinhamento(rascunho, numero, realizadoNovo);
        }
      }

      await onSalvarProcesso(proximo);
      setRascunho(proximo);
      setStatusEdicao('saved');
    } catch {
      setStatusEdicao('error');
    }
  };

  return (
    <div className="rounded-lg border bg-background px-4 py-1">
      {numero !== 1 && linha({
                label: 'E-mail de agendamento',
                children: (
                  <div className="flex flex-wrap items-center gap-2">
                    {agItem && (
                      <EmailActionButtons
                        processo={processo}
                        item={agItem}
                        config={config}
                        feriados={feriados}
                        onAlternarEnviado={async () => {
                          const atual = fichaAcaoAtual(processo, `ag${numero}-01`).s;
                          await salvarDireto(aplicarStatusAcao(processo, `ag${numero}-01`, atual === 'ok' ? '' : 'ok'));
                        }}
                        onEditarModelo={onEditarModeloEmail}
                      />
                    )}
                    <input
                      type="date"
                      value={fichaEmailRascunho.d}
                      disabled={statusEdicao === 'saving'}
                      onChange={(e) => mudarCampoEmail('d', e.currentTarget.value)}
                      className={`h-8 rounded-md border bg-background px-2 text-xs disabled:opacity-60 ${fichaEmail.s === 'ok' && !fichaEmailRascunho.d ? 'border-amber-400' : 'border-input'}`}
                      title="data de envio"
                    />
                    {fichaEmail.s !== 'ok' && (
                      <>
                        <span className="text-xs text-muted-foreground">ou programar:</span>
                        <input
                          type="date"
                          value={fichaEmailRascunho.prog}
                          disabled={statusEdicao === 'saving'}
                          onChange={(e) => mudarCampoEmail('prog', e.currentTarget.value)}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-60"
                          title="programar envio"
                        />
                      </>
                    )}
                    <Badge variant="outline" className={statusClasses[statusEmail.k]}>{statusEmail.l}</Badge>
                    {etapaAg && <span className="text-xs text-muted-foreground">previsto {formatarData(etapaAg.data)}</span>}
                  </div>
                ),
              })}

      {linha({
        label: 'Já foi agendado?',
        children: numero === 1 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={estado.agendado === 'aguardando'
                  ? 'border-blue-300 bg-blue-50 text-blue-800'
                  : 'border-slate-300 bg-slate-50 text-slate-700'}
              >
                {estado.agendado === 'aguardando' ? 'Aguardando' : 'Ainda não agendado'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Atualizado automaticamente pela etapa “Gerar Link do Meet e Enviar o Convite”.
              </span>
            </div>
            {(estado.data || estado.hora || estado.link) ? (
              <div className="grid gap-2 rounded-md border bg-muted/20 p-3 sm:grid-cols-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase text-muted-foreground">Data agendada</div>
                  <div className="mt-1 text-sm font-medium">{estado.data ? formatarData(estado.data) : '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase text-muted-foreground">Horário</div>
                  <div className="mt-1 text-sm font-medium">{estado.hora || '—'}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase text-muted-foreground">Link da reunião</div>
                  {estado.link ? (
                    <a
                      href={estado.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block truncate text-sm font-medium text-violet-700 underline"
                      title={estado.link}
                    >
                      {estado.link}
                    </a>
                  ) : (
                    <div className="mt-1 text-sm font-medium">—</div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Preencha data, horário e link na etapa de agendamento para que as informações apareçam aqui.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {SITUACOES_AGENDAMENTO.map(([valor, label]) => (
                <Button
                  key={valor}
                  type="button"
                  size="sm"
                  variant={estado.agendado === valor ? 'default' : 'outline'}
                  onClick={() => void salvarDireto(aplicarSituacaoAgendamento(processo, numero, valor))}
                  aria-pressed={estado.agendado === valor}
                >
                  {label}
                </Button>
              ))}
            </div>
            {estado.agendado === 'sim' && (
              <div className="flex flex-wrap gap-2">
                <input
                  type="date"
                  value={estadoRascunho.data}
                  disabled={statusEdicao === 'saving'}
                  onChange={(e) => mudarCampo('data', e.currentTarget.value)}
                  className={`h-9 rounded-md border bg-background px-3 text-sm disabled:opacity-60 ${estadoRascunho.data ? 'border-input' : 'border-amber-400'}`}
                  title="data confirmada"
                />
                <input
                  value={estadoRascunho.hora}
                  disabled={statusEdicao === 'saving'}
                  onChange={(e) => mudarCampo('hora', e.currentTarget.value)}
                  className="h-9 w-36 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
                  placeholder="horário"
                />
                <input
                  value={estadoRascunho.link}
                  disabled={statusEdicao === 'saving'}
                  onChange={(e) => mudarCampo('link', e.currentTarget.value)}
                  className="h-9 min-w-[250px] flex-1 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
                  placeholder="link da reunião"
                />
              </div>
            )}
            {estado.agendado === 'nao' && (
              <input
                value={estadoRascunho.just}
                disabled={statusEdicao === 'saving'}
                onChange={(e) => mudarCampo('just', e.currentTarget.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
                placeholder="por que ainda não? o que está travando?"
              />
            )}
            {estado.agendado === 'aguardando' && (
              <p className="text-xs text-muted-foreground">e-mail enviado, esperando o gestor responder</p>
            )}
          </div>
        ),
      })}

      {linha({
        label: 'Reunião realizada',
        children: (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={estadoRascunho.realizado}
              disabled={statusEdicao === 'saving'}
              onChange={(e) => mudarCampo('realizado', e.currentTarget.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            />
            <span className={estadoRascunho.realizado ? 'text-xs font-medium text-emerald-700' : 'text-xs text-muted-foreground'}>
              {estadoRascunho.realizado ? `realizada em ${formatarData(estadoRascunho.realizado)}` : 'marque a data quando acontecer'}
            </span>
          </div>
        ),
      })}

      {linha({
        label: 'Relatórios da mentora',
        children: (
          <div className="flex flex-wrap items-center gap-2">
            {SITUACOES_RELATORIO.map(([valor, label]) => (
              <Button
                key={valor}
                type="button"
                size="sm"
                variant={estado.relat === valor ? 'default' : 'outline'}
                onClick={() => void salvarDireto(aplicarSituacaoRelatorioMentora(processo, numero, valor))}
                aria-pressed={estado.relat === valor}
              >
                {label}
              </Button>
            ))}
            {estado.relat && (
              <input
                type="date"
                value={estadoRascunho.relatData}
                disabled={statusEdicao === 'saving'}
                onChange={(e) => mudarCampo('relatData', e.currentTarget.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-60"
                title="recebido em"
              />
            )}
            <span className="text-xs text-muted-foreground">{processo.consultora || 'mentora'}</span>
          </div>
        ),
      })}

      {linha({
        label: 'Ata e registros',
        children: (
          <textarea
            value={estadoRascunho.ata.texto}
            disabled={statusEdicao === 'saving'}
            onChange={(e) => mudarCampoAta('texto', e.currentTarget.value)}
            className="min-h-[76px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
            placeholder="cole aqui a ata ou um resumo do que foi conversado"
          />
        ),
      })}

      {linha({
        label: 'Arquivo da ata',
        children: (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={estadoRascunho.ata.link}
              disabled={statusEdicao === 'saving'}
              onChange={(e) => mudarCampoAta('link', e.currentTarget.value)}
              className="h-9 min-w-[260px] flex-1 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
              placeholder="link do Drive / SharePoint"
            />
            <Button
              type="button"
              size="sm"
              variant={estado.ata.drive ? 'default' : 'outline'}
              onClick={() => void salvarDireto(alternarAtaArquivadaAlinhamento(processo, numero))}
            >
              {estado.ata.drive ? '✓ Arquivada no Drive' : 'Marcar como arquivada no Drive'}
            </Button>
            {estadoRascunho.ata.link && (
              <Button type="button" size="sm" variant="outline" asChild>
                <a href={estadoRascunho.ata.link} target="_blank" rel="noopener noreferrer">Abrir</a>
              </Button>
            )}
          </div>
        ),
      })}

      <div className="flex flex-col gap-3 border-b py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm">
          {statusEdicao === 'dirty' && <span className="font-medium text-amber-700">Há alterações não salvas neste alinhamento.</span>}
          {statusEdicao === 'saving' && <span className="font-medium text-amber-700">Salvando e conferindo no servidor...</span>}
          {statusEdicao === 'saved' && <span className="font-medium text-emerald-700">✓ Alterações do alinhamento salvas e conferidas.</span>}
          {statusEdicao === 'error' && <span className="font-medium text-destructive">Não foi possível salvar. O rascunho foi mantido.</span>}
          {statusEdicao === 'idle' && <span className="text-muted-foreground">Campos digitáveis só são gravados ao clicar em “Salvar alterações do alinhamento”.</span>}
        </span>
        <Button type="button" onClick={() => void salvarAlteracoes()} disabled={statusEdicao !== 'dirty'}>
          {statusEdicao === 'saving' ? 'Salvando...' : 'Salvar alterações do alinhamento'}
        </Button>
      </div>

      {linha({
        label: 'Observações',
        children: (
          <div className="space-y-2">
            {estado.notas.map((registro, indice) => (
              <div key={`${registro.d}-${indice}`} className="flex items-start gap-3 border-b border-dashed pb-2 text-sm">
                <span className="w-24 flex-shrink-0 font-mono text-[11px] text-muted-foreground">{registro.d || '—'}</span>
                <span className="min-w-0 flex-1">{registro.t}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remover observação"
                  onClick={() => void salvarDireto(removerNotaAlinhamento(processo, numero, indice))}
                >
                  ×
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={nota}
                onChange={(e) => setNota(e.currentTarget.value)}
                onKeyDown={async (e) => {
                  if (e.key !== 'Enter' || !nota.trim()) return;
                  e.preventDefault();
                  if (statusEdicao === 'dirty' || statusEdicao === 'saving') {
                    toast.warning('Salve primeiro as alterações digitadas neste alinhamento.');
                    return;
                  }
                  await onSalvarProcesso(adicionarNotaAlinhamento(processo, numero, nota));
                  setNota('');
                }}
                className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="nova observação — fica registrada com data e hora"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!nota.trim()}
                onClick={async () => {
                  if (statusEdicao === 'dirty' || statusEdicao === 'saving') {
                    toast.warning('Salve primeiro as alterações digitadas neste alinhamento.');
                    return;
                  }
                  await onSalvarProcesso(adicionarNotaAlinhamento(processo, numero, nota));
                  setNota('');
                }}
              >
                Registrar
              </Button>
            </div>
          </div>
        ),
      })}
    </div>
  );
}
