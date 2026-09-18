import React, { useMemo, useState } from 'react';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import type { ResponsavelIntegracao } from '../helpers/planoReal';
import {
  gerarAgendaCsvHistorica,
  linhasAgendaReal,
  type FiltroStatusAgenda,
  type LinhaAgendaReal,
} from '../helpers/agendaRealHelpers';
import { montarPreviewEmailIntegracao } from '../helpers/emailMontagemHelpers';
import { fichaAcaoAtual, type StatusAcaoLegado } from '../helpers/itemStateHelpers';
import { gerarRelatorioEvolucaoPdf } from '../helpers/relatorioEvolucaoPdf';
import { formatarData } from '../helpers/dateHelpers';
import { EmailPreviewDialog } from './EmailPreviewDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface AgendaGeralProps {
  processos: ProcessoIntegracao[];
  feriados?: string[];
  config: BootstrapState['config'];
  onProcessoClick?: (processId: string, itemId?: string) => void;
  onAlterarStatusAcao?: (processId: string, itemId: string, status: StatusAcaoLegado) => Promise<void> | void;
}

const RESPONSAVEIS: Array<[ResponsavelIntegracao | '', string]> = [
  ['', 'Todos'],
  ['CKM', 'CKM'],
  ['UGP', 'UGP'],
  ['Gestor', 'Gestor'],
  ['Anjo', 'Anjo'],
  ['Colaborador', 'Colaborador'],
];

const STATUS: Array<[FiltroStatusAgenda, string]> = [
  ['aberto', 'Em aberto'],
  ['feito', 'Concluídas'],
  ['na', 'Fora do escopo'],
  ['', 'Todas'],
];

const statusClasses = {
  late: 'border-red-300 bg-red-50 text-red-800',
  act: 'border-amber-300 bg-amber-50 text-amber-800',
  wait: 'border-orange-300 bg-orange-50 text-orange-800',
  ontime: 'border-blue-300 bg-blue-50 text-blue-800',
  ok: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  off: 'border-slate-300 bg-slate-50 text-slate-700',
} as const;

const responsavelClasses: Record<ResponsavelIntegracao, string> = {
  CKM: 'border-red-200 bg-red-50 text-red-800',
  UGP: 'border-slate-300 bg-slate-50 text-slate-800',
  Gestor: 'border-amber-300 bg-amber-50 text-amber-800',
  Anjo: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  Colaborador: 'border-orange-300 bg-orange-50 text-orange-800',
};

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

function diaSemana(iso: string): string {
  const [ano, mes, dia] = String(iso || '').slice(0, 10).split('-').map(Number);
  if (!ano || !mes || !dia) return '';
  return DIAS[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()] || '';
}

function processoDaLinha(processos: ProcessoIntegracao[], linha: LinhaAgendaReal): ProcessoIntegracao | null {
  return processos.find((p) => (p.id || p.nome) === linha.pid) || null;
}

function alinhamentoRelatorio(chave: string): number | null {
  const m = /^m_agendamento_([234])$/.exec(chave || '');
  return m ? Number(m[1]) : null;
}

export function AgendaGeral({
  processos,
  feriados = [],
  config,
  onProcessoClick,
  onAlterarStatusAcao,
}: AgendaGeralProps) {
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusAgenda>('aberto');
  const [filtroResponsavel, setFiltroResponsavel] = useState<ResponsavelIntegracao | ''>('');
  const [filtroPessoa, setFiltroPessoa] = useState('');
  const [emailAberto, setEmailAberto] = useState<{ linha: LinhaAgendaReal; processo: ProcessoIntegracao } | null>(null);

  const linhas = useMemo(
    () => linhasAgendaReal(
      processos,
      feriados,
      { status: filtroStatus, responsavel: filtroResponsavel, pessoa: filtroPessoa },
      config,
    ),
    [processos, feriados, filtroStatus, filtroResponsavel, filtroPessoa, config],
  );

  const previewEmail = useMemo(() => {
    if (!emailAberto?.linha.mail) return null;
    return montarPreviewEmailIntegracao(
      emailAberto.linha.mail,
      emailAberto.processo,
      config,
      feriados,
      typeof window !== 'undefined' ? window.location.origin : undefined,
    );
  }, [emailAberto, config, feriados]);

  const baixarCsv = () => {
    const blob = gerarAgendaCsvHistorica(linhas);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agenda-integracao.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const relN = emailAberto?.linha.mail ? alinhamentoRelatorio(emailAberto.linha.mail) : null;
  const enviado = emailAberto
    ? fichaAcaoAtual(emailAberto.processo, emailAberto.linha.itid).s === 'ok'
    : false;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-700">Agenda</p>
          <h2 className="text-2xl font-bold">Todas as ações, por data</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Dias corridos a partir do 1º dia. Marcos caem no próximo dia útil; agendamentos são antecipados para o dia útil anterior.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={baixarCsv}>
          <Download className="h-4 w-4" />
          Baixar planilha (CSV)
        </Button>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Situação</span>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as FiltroStatusAgenda)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {STATUS.map(([valor, label]) => <option key={valor || 'todas'} value={valor}>{label}</option>)}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Responsável</span>
              <select
                value={filtroResponsavel}
                onChange={(e) => setFiltroResponsavel(e.target.value as ResponsavelIntegracao | '')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {RESPONSAVEIS.map(([valor, label]) => <option key={valor || 'todos'} value={valor}>{label}</option>)}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Pessoa</span>
              <select
                value={filtroPessoa}
                onChange={(e) => setFiltroPessoa(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Todas</option>
                {processos.map((p) => <option key={p.id || p.nome} value={p.id || p.nome}>{p.nome}</option>)}
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {linhas.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma ação encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-muted/60">
                  <tr className="border-b">
                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Prevista</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Pessoa</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Ação</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Responsável</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Situação</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Concluída em</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((linha, indice) => {
                    const processo = processoDaLinha(processos, linha);
                    return (
                      <tr key={`${linha.pid}-${linha.itid}-${linha.men ? 'men' : 'plano'}-${indice}`} className="border-b last:border-b-0 hover:bg-muted/30">
                        <td className="whitespace-nowrap px-3 py-3 align-top font-mono text-xs">
                          <div className="font-semibold text-foreground">{formatarData(linha.data)}</div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground">{diaSemana(linha.data)} · {linha.dia < 1 ? 'pré' : `D${linha.dia}`}</div>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <button
                            type="button"
                            onClick={() => onProcessoClick?.(linha.pid, linha.itid)}
                            className="inline-flex rounded-full border px-2 py-1 text-xs font-semibold hover:opacity-80"
                            style={linha.cor ? { borderColor: linha.cor, color: linha.cor } : undefined}
                          >
                            {linha.pnome}
                          </button>
                        </td>
                        <td className="min-w-[320px] px-3 py-3 align-top">
                          <div className="font-medium">{linha.t}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{linha.etapa}</div>
                          {linha.just && <div className="mt-2 border-l-2 pl-2 text-xs text-muted-foreground"><b>Justificativa:</b> {linha.just}</div>}
                          {linha.obs && <div className="mt-2 border-l-2 pl-2 text-xs text-muted-foreground">{linha.obs}</div>}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Badge variant="outline" className={linha.papeisAtuais.length === 1 ? responsavelClasses[linha.papeisAtuais[0]] : undefined}>{linha.responsavelAtual}</Badge>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Badge variant="outline" className={statusClasses[linha.st.k]}>{linha.st.l}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 align-top font-mono text-xs">{linha.fim ? formatarData(linha.fim) : '—'}</td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex gap-1">
                            {linha.mail && processo && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                title="Gerar e-mail"
                                onClick={() => setEmailAberto({ linha, processo })}
                              >
                                ✉
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              title="Abrir esta ação no processo"
                              onClick={() => onProcessoClick?.(linha.pid, linha.itid)}
                            >
                              ›
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <EmailPreviewDialog
        open={Boolean(emailAberto && previewEmail)}
        onOpenChange={(open) => { if (!open) setEmailAberto(null); }}
        preview={previewEmail}
        nomePessoa={emailAberto?.processo.nome || ''}
        enviado={enviado}
        onAlternarEnviado={emailAberto && onAlterarStatusAcao ? async () => {
          const atual = fichaAcaoAtual(emailAberto.processo, emailAberto.linha.itid).s;
          await onAlterarStatusAcao(emailAberto.linha.pid, emailAberto.linha.itid, atual === 'ok' ? '' : 'ok');
        } : undefined}
        onGerarRelatorioEvolucao={emailAberto && relN ? () => {
          try {
            gerarRelatorioEvolucaoPdf(emailAberto.processo, relN);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Não foi possível gerar o Relatório de Evolução.');
          }
        } : undefined}
      />
    </div>
  );
}
