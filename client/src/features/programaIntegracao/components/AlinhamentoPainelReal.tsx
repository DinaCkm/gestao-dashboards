import React, { useMemo, useState } from 'react';
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
  type CampoAlinhamento,
  type SituacaoAgendamento,
  type SituacaoRelatorioMentora,
} from '../helpers/alinhamentoStateHelpers';
import { fichaAcaoAtual, aplicarCampoFichaAcao, aplicarStatusAcao } from '../helpers/itemStateHelpers';
import { formatarData } from '../helpers/dateHelpers';
import { EmailActionButtons } from './EmailActionButtons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AlinhamentoPainelRealProps {
  processo: ProcessoIntegracao;
  numero: 1 | 2 | 3 | 4;
  feriados?: string[];
  config: BootstrapState['config'];
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
}: AlinhamentoPainelRealProps) {
  const estado = estadoAlinhamentoAtual(processo, numero);
  const [nota, setNota] = useState('');
  const agItem = itemAgendamento(numero);
  const etapaAg = useMemo(
    () => cronogramaReal(processo, feriados).find((etapa) => etapa.et.id === `ag${numero}`),
    [processo, feriados, numero],
  );
  const fichaEmail = fichaAcaoAtual(processo, `ag${numero}-01`);
  const statusEmail = etapaAg
    ? calcularStatusItem(processo, `ag${numero}-01`, etapaAg.data)
    : { k: 'ontime', l: 'No prazo', dif: 0 } as const;

  const salvar = async (proximo: ProcessoIntegracao) => {
    await onSalvarProcesso(proximo);
  };

  const mudarCampo = (campo: CampoAlinhamento, valor: string) => salvar(aplicarCampoAlinhamento(processo, numero, campo, valor));

  return (
    <div className="rounded-lg border bg-background px-4 py-1">
      {linha({
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
                  await salvar(aplicarStatusAcao(processo, `ag${numero}-01`, atual === 'ok' ? '' : 'ok'));
                }}
              />
            )}
            <input
              type="date"
              value={fichaEmail.d}
              onChange={(e) => salvar(aplicarCampoFichaAcao(processo, `ag${numero}-01`, 'd', e.target.value))}
              className={`h-8 rounded-md border bg-background px-2 text-xs ${fichaEmail.s === 'ok' && !fichaEmail.d ? 'border-amber-400' : 'border-input'}`}
              title="data de envio"
            />
            {fichaEmail.s !== 'ok' && (
              <>
                <span className="text-xs text-muted-foreground">ou programar:</span>
                <input
                  type="date"
                  value={fichaEmail.prog}
                  onChange={(e) => salvar(aplicarCampoFichaAcao(processo, `ag${numero}-01`, 'prog', e.target.value))}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
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
        children: (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {SITUACOES_AGENDAMENTO.map(([valor, label]) => (
                <Button
                  key={valor}
                  type="button"
                  size="sm"
                  variant={estado.agendado === valor ? 'default' : 'outline'}
                  onClick={() => salvar(aplicarSituacaoAgendamento(processo, numero, valor))}
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
                  value={estado.data}
                  onChange={(e) => mudarCampo('data', e.target.value)}
                  className={`h-9 rounded-md border bg-background px-3 text-sm ${estado.data ? 'border-input' : 'border-amber-400'}`}
                  title="data confirmada"
                />
                <input
                  value={estado.hora}
                  onChange={(e) => mudarCampo('hora', e.target.value)}
                  className="h-9 w-36 rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="horário"
                />
                <input
                  value={estado.link}
                  onChange={(e) => mudarCampo('link', e.target.value)}
                  className="h-9 min-w-[250px] flex-1 rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="link da reunião"
                />
              </div>
            )}
            {estado.agendado === 'nao' && (
              <input
                value={estado.just}
                onChange={(e) => mudarCampo('just', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
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
              value={estado.realizado}
              onChange={(e) => mudarCampo('realizado', e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
            <span className={estado.realizado ? 'text-xs font-medium text-emerald-700' : 'text-xs text-muted-foreground'}>
              {estado.realizado ? `realizada em ${formatarData(estado.realizado)}` : 'marque a data quando acontecer'}
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
                onClick={() => salvar(aplicarSituacaoRelatorioMentora(processo, numero, valor))}
                aria-pressed={estado.relat === valor}
              >
                {label}
              </Button>
            ))}
            {estado.relat && (
              <input
                type="date"
                value={estado.relatData}
                onChange={(e) => mudarCampo('relatData', e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
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
            value={estado.ata.texto}
            onChange={(e) => salvar(aplicarCampoAtaAlinhamento(processo, numero, 'texto', e.target.value))}
            className="min-h-[76px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="cole aqui a ata ou um resumo do que foi conversado"
          />
        ),
      })}

      {linha({
        label: 'Arquivo da ata',
        children: (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={estado.ata.link}
              onChange={(e) => salvar(aplicarCampoAtaAlinhamento(processo, numero, 'link', e.target.value))}
              className="h-9 min-w-[260px] flex-1 rounded-md border border-input bg-background px-3 text-sm"
              placeholder="link do Drive / SharePoint"
            />
            <Button
              type="button"
              size="sm"
              variant={estado.ata.drive ? 'default' : 'outline'}
              onClick={() => salvar(alternarAtaArquivadaAlinhamento(processo, numero))}
            >
              {estado.ata.drive ? '✓ Arquivada no Drive' : 'Marcar como arquivada no Drive'}
            </Button>
            {estado.ata.link && (
              <Button type="button" size="sm" variant="outline" asChild>
                <a href={estado.ata.link} target="_blank" rel="noopener noreferrer">Abrir</a>
              </Button>
            )}
          </div>
        ),
      })}

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
                  onClick={() => salvar(removerNotaAlinhamento(processo, numero, indice))}
                >
                  ×
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key !== 'Enter' || !nota.trim()) return;
                  e.preventDefault();
                  await salvar(adicionarNotaAlinhamento(processo, numero, nota));
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
                  await salvar(adicionarNotaAlinhamento(processo, numero, nota));
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
