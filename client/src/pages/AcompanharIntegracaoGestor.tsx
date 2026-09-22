import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, BarChart3, ClipboardList, Download, Info, Loader2, Search, Sparkles, UserCheck, Users } from 'lucide-react';
import { DISC_PERFIL_RESUMO, INTEGRACAO_CLUSTERS } from '@shared/integracaoAssessment';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  evolucaoPorPapel,
  evolucaoPesquisaColaborador,
  INDICES_PESQUISA_COLABORADOR,
  PILARES_ACOMPANHAMENTO,
  percentualNumero,
  type RespostaAcompanhamento,
} from '@/features/programaIntegracao/helpers/evolucaoAcompanhamento';
import { gerarAcompanhamentoIntegracaoPdf } from '@/features/programaIntegracao/helpers/acompanhamentoIntegracaoPdf';

interface Pendencia {
  ciclo: number;
  etapa?: string;
  formKey?: string;
  cycleValue?: string;
  papel: string;
  formulario: string;
  prazo: string;
  atrasado: boolean;
}

interface GestorDisponivel {
  key: string;
  nome: string;
  email: string;
  colaboradores: number;
}

interface ClusterAutoavaliacao {
  key: string;
  nome: string;
  competencias: string[];
  competenciasEncontradas: string[];
  totalCompetencias: number;
  totalAvaliadas: number;
  media: number | null;
  percentual: number | null;
}

interface ClusterExpectativa {
  key: string;
  nome: string;
  selecionados: string[];
  quantidadeSelecionada: number;
  totalDescritores: number;
  indice: number;
  prioridade: number;
  nivel: string;
  perfilColaborador: number | null;
}

interface PerfilAssessment {
  alunoEcoId: number | null;
  disc: {
    scoreD: number;
    scoreI: number;
    scoreS: number;
    scoreC: number;
    perfilPredominante?: string | null;
    perfilSecundario?: string | null;
    ciclo?: number;
    completedAt?: string | null;
  } | null;
  autoavaliacaoClusters: ClusterAutoavaliacao[];
  expectativaGestor: {
    temRespostaBem: boolean;
    descritoresReconhecidos: number;
    compatibilidade: number | null;
    motivo: string | null;
    matriz?: 'historica' | 'atual' | null;
    clusters: ClusterExpectativa[];
  };
}

interface ColaboradorAcompanhamento {
  id: string;
  nome: string;
  cargo: string;
  unidade: string;
  inicio: string;
  dia: number;
  totalDias: number;
  gestor: string;
  anjo: string;
  alinhamentosFeitos: number;
  alinhamentosTotal: number;
  jornadaCompliance: { total: number; concluidas: number; percentual: number | null };
  pdi: { total: number; concluidas: number; percentual: number | null };
  acessouEcoLider: boolean | null;
  ultimaEntradaEcoLider: string | null;
  assessmentPotencialConcluido: boolean | null;
  assessmentPotencialConcluidoEm: string | null;
  perfilAssessment: PerfilAssessment;
  respostas: RespostaAcompanhamento[];
  formulariosPendentes: Pendencia[];
}

interface AcompanhamentoResponse {
  ok: boolean;
  scope: 'all' | 'gestor';
  adminView?: boolean;
  gestoresDisponiveis?: GestorDisponivel[];
  gestorSelecionado?: GestorDisponivel | null;
  atualizadoEm: string;
  colaboradores: ColaboradorAcompanhamento[];
}

const CORES = ['#6D4BA3', '#2563EB', '#0F8A8A', '#A65A8A', '#D08A2D', '#4F6F52'];

function fmtPct(n: number | null) {
  return n == null ? '—' : `${Math.round(n)}%`;
}

function dataBr(iso: string) {
  if (!iso) return '—';
  const d = new Date(`${iso.slice(0,10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}

function linkPreencherFormulario(colaborador: ColaboradorAcompanhamento, pendencia: Pendencia): string | null {
  const slug = pendencia.formKey === 'aval'
    ? 'avaliacao-programa'
    : pendencia.formKey === 'pesquisa'
      ? 'pesquisa-integracao'
      : pendencia.formKey === 'bem'
        ? 'bem-acolhido'
        : null;
  if (!slug) return null;

  const params = new URLSearchParams();
  params.set('nome', colaborador.nome);
  if (colaborador.unidade) params.set('unidade', colaborador.unidade);
  if (pendencia.formKey !== 'bem') {
    params.set('ciclo', pendencia.cycleValue || String(pendencia.ciclo));
  }

  if (pendencia.formKey === 'bem') {
    if (colaborador.gestor) params.set('respondente', colaborador.gestor);
  } else if (pendencia.formKey === 'aval') {
    params.set('papel', pendencia.papel);
    const respondente = pendencia.papel === 'Gestor'
      ? colaborador.gestor
      : pendencia.papel === 'Anjo'
        ? colaborador.anjo
        : '';
    if (respondente) params.set('respondente', respondente);
  }

  return `/formularios/${slug}?${params.toString()}`;
}

function fmtPct1(n: number | null | undefined) {
  return n == null || !Number.isFinite(Number(n))
    ? '—'
    : `${Number(n).toFixed(1).replace('.', ',')}%`;
}

function PerfilAssessmentModal({
  colaborador,
  open,
  onOpenChange,
}: {
  colaborador: ColaboradorAcompanhamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!colaborador) return null;

  const perfil = colaborador.perfilAssessment;
  const disc = perfil?.disc;
  const autoPorKey = new Map<string, ClusterAutoavaliacao>(
    (perfil?.autoavaliacaoClusters || []).map((item) => [item.key, item] as const),
  );
  const expectativaPorKey = new Map<string, ClusterExpectativa>(
    (perfil?.expectativaGestor?.clusters || []).map((item) => [item.key, item] as const),
  );
  const leituraComparacao = (prioridade: number, perfilColaborador: number | null | undefined) => {
    if (perfilColaborador == null || !Number.isFinite(Number(perfilColaborador)) || prioridade <= 0) {
      return {
        classes: 'border-slate-200 bg-white border-t-[3px] border-t-slate-300',
        badge: 'border-slate-300 bg-white text-slate-700',
        rotulo: prioridade <= 0 ? 'Não priorizada' : 'Sem autoavaliação',
      };
    }

    const perfilNumero = Number(perfilColaborador);
    if (perfilNumero >= prioridade) {
      return {
        classes: 'border-slate-200 bg-white border-t-[3px] border-t-emerald-500',
        badge: 'border-emerald-300 bg-emerald-100 text-emerald-900',
        rotulo: 'Perfil atende ou supera a prioridade',
      };
    }

    const diferenca = prioridade - perfilNumero;
    if (diferenca <= 5) {
      return {
        classes: 'border-slate-200 bg-white border-t-[3px] border-t-emerald-500',
        badge: 'border-emerald-300 bg-emerald-100 text-emerald-900',
        rotulo: 'Muito próximo · até 5 p.p.',
      };
    }
    if (diferenca <= 20) {
      return {
        classes: 'border-slate-200 bg-white border-t-[3px] border-t-blue-500',
        badge: 'border-blue-300 bg-blue-100 text-blue-900',
        rotulo: 'Próximo · até 20 p.p.',
      };
    }
    if (diferenca <= 40) {
      return {
        classes: 'border-slate-200 bg-white border-t-[3px] border-t-amber-400',
        badge: 'border-amber-300 bg-amber-100 text-amber-950',
        rotulo: 'Atenção · 20 a 40 p.p.',
      };
    }
    return {
      classes: 'border-slate-200 bg-white border-t-[3px] border-t-orange-500',
      badge: 'border-orange-400 bg-orange-100 text-orange-950',
      rotulo: 'Diferença alta · acima de 40 p.p.',
    };
  };

  const discCards = DISC_PERFIL_RESUMO.map((item) => {
    const score = item.key === 'D'
      ? disc?.scoreD
      : item.key === 'I'
        ? disc?.scoreI
        : item.key === 'S'
          ? disc?.scoreS
          : disc?.scoreC;
    const classes = item.key === 'D'
      ? 'border-slate-200 bg-white text-slate-950 border-t-[3px] border-t-red-500'
      : item.key === 'I'
        ? 'border-slate-200 bg-white text-slate-950 border-t-[3px] border-t-amber-400'
        : item.key === 'S'
          ? 'border-slate-200 bg-white text-slate-950 border-t-[3px] border-t-emerald-500'
          : 'border-slate-200 bg-white text-slate-950 border-t-[3px] border-t-blue-500';
    return { ...item, score: score == null ? null : Number(score), classes };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-assessment-modal="true"
        className="assessment-profile-modal max-h-[95vh] !w-[98vw] !max-w-[1780px] gap-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-[#F6F8FB] p-0 shadow-[0_24px_70px_rgba(15,23,42,0.20)] sm:!w-[97vw] sm:!max-w-[1780px]"
      >
        <style>{`
          [data-slot="dialog-portal"]:has(.assessment-profile-modal) > [data-slot="dialog-overlay"] {
            background: rgba(15, 23, 42, 0.48);
          }
          .assessment-profile-modal [data-slot="dialog-close"] {
            top: 16px;
            right: 16px;
            display: grid;
            width: 36px;
            height: 36px;
            place-items: center;
            border-radius: 9999px;
            background: rgba(255, 255, 255, 0.08);
            color: white;
            opacity: 1;
            transition: background-color 160ms ease, transform 160ms ease;
          }
          .assessment-profile-modal [data-slot="dialog-close"]:hover {
            background: rgba(255, 255, 255, 0.14);
          }
          .assessment-profile-modal [data-slot="dialog-close"]:active {
            transform: scale(.94);
          }
          .assessment-profile-modal [data-slot="dialog-close"]:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px rgba(255, 255, 255, .24);
          }
          .assessment-profile-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(75, 61, 150, .35) transparent;
          }
          .assessment-profile-scroll::-webkit-scrollbar {
            width: 7px;
          }
          .assessment-profile-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .assessment-profile-scroll::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background: rgba(75, 61, 150, .35);
          }
          .assessment-profile-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(75, 61, 150, .55);
          }
          .assessment-section {
            box-shadow:
              0 2px 8px rgba(15, 23, 42, .025),
              0 6px 20px rgba(15, 23, 42, .025);
            animation: assessment-fade-up 360ms cubic-bezier(.2,.75,.25,1) both;
          }
          .assessment-card {
            transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
            animation: assessment-fade-up 340ms cubic-bezier(.2,.75,.25,1) both;
          }
          .assessment-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 9px 24px rgba(15, 23, 42, .07);
          }
          .assessment-stagger > .assessment-card:nth-child(2) { animation-delay: 35ms; }
          .assessment-stagger > .assessment-card:nth-child(3) { animation-delay: 70ms; }
          .assessment-stagger > .assessment-card:nth-child(4) { animation-delay: 105ms; }
          .assessment-stagger > .assessment-card:nth-child(5) { animation-delay: 140ms; }
          .assessment-progress-fill {
            transform-origin: left center;
            animation: assessment-fill 600ms cubic-bezier(.2,.75,.25,1) both;
          }
          .assessment-details-body {
            animation: assessment-details 260ms ease both;
          }
          @keyframes assessment-fade-up {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes assessment-fill {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
          @keyframes assessment-details {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .assessment-section,
            .assessment-card,
            .assessment-progress-fill,
            .assessment-details-body {
              animation: none !important;
              transition-duration: .01ms !important;
            }
            .assessment-card:hover,
            .assessment-profile-modal [data-slot="dialog-close"]:active {
              transform: none !important;
            }
          }
        `}</style>

        <div className="border-b border-white/10 bg-[linear-gradient(115deg,#35147D_0%,#5B21D6_52%,#4938E8_100%)] px-5 py-5 pr-14 text-white sm:px-6 lg:px-7">
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="text-xl font-bold leading-tight text-white">
              Perfil do Assessment
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-white/80 sm:text-sm">
              {colaborador.nome} · perfil comportamental, autoavaliação de competências e expectativa do gestor.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="assessment-profile-scroll max-h-[calc(94vh-92px)] overflow-y-auto overflow-x-hidden bg-[#F6F8FB] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 xl:px-10">
          <TooltipProvider>
            <div className="space-y-5 sm:space-y-6">
              <section className="assessment-section rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6">
                <div className="mb-4 sm:mb-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-700">1. Perfil Comportamental</div>
                  <h3 className="mt-1.5 text-[17px] font-bold leading-tight text-[#132536]">Perfil Comportamental</h3>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">
                    Percentuais do resultado mais recente do Assessment/Avaliação de Potencial.
                  </p>
                </div>

                {!disc ? (
                  <Alert className="border-amber-200 bg-amber-50 text-amber-950">
                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                    <AlertTitle>Assessment/Avaliação de Potencial ainda não realizado</AlertTitle>
                    <AlertDescription>
                      Este colaborador ainda não possui resultado de Assessment disponível. Nenhum percentual é apresentado como zero para evitar interpretação incorreta.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="assessment-stagger grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {discCards.map((item) => (
                      <div key={item.key} className={`assessment-card min-w-0 rounded-xl border p-4 sm:p-5 ${item.classes}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 text-sm font-bold leading-snug text-slate-800">{item.nome}</div>
                          <UiTooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                                aria-label={`Informações sobre ${item.nome}`}
                              >
                                <Info className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs leading-relaxed">{item.descricao}</TooltipContent>
                          </UiTooltip>
                        </div>
                        <div className="mt-5 text-[27px] font-bold leading-none tracking-[-0.02em] text-slate-950">{fmtPct1(item.score)}</div>
                        <div className="mt-2 text-sm font-semibold text-slate-600">{item.rotulo}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="assessment-section rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6">
                <div className="mb-4 sm:mb-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-700">2. Autoavaliação</div>
                  <h3 className="mt-1.5 text-[17px] font-bold leading-tight text-[#132536]">Autoavaliação de Competências</h3>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">
                    Esta autoavaliação mostra como o próprio colaborador percebe suas competências em cada dimensão.
                  </p>
                </div>

                <div className="assessment-stagger grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {INTEGRACAO_CLUSTERS.map((cluster) => {
                    const dados = autoPorKey.get(cluster.key);
                    return (
                      <div key={cluster.key} className="assessment-card flex min-w-0 flex-col rounded-xl border border-slate-200 bg-slate-50/45 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 text-sm font-semibold leading-snug text-slate-800">{cluster.nome}</div>
                          <UiTooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 transition-colors hover:bg-white hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                                aria-label={`Competências de ${cluster.nome}`}
                              >
                                <Info className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm text-xs leading-relaxed">
                              {cluster.competencias.join(', ')}.
                            </TooltipContent>
                          </UiTooltip>
                        </div>
                        <div className="mt-4 text-[27px] font-bold leading-none tracking-[-0.02em] text-slate-950">{fmtPct1(dados?.percentual)}</div>
                        <div className="mt-2 min-h-[34px] text-xs leading-relaxed text-slate-500">
                          {dados?.totalAvaliadas
                            ? `${dados.totalAvaliadas} de ${dados.totalCompetencias} competências com autoavaliação`
                            : 'Sem autoavaliação registrada neste cluster'}
                        </div>
                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-violet-100/80">
                          <div
                            className="assessment-progress-fill h-full rounded-full bg-violet-600"
                            style={{ width: `${dados?.percentual ?? 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="assessment-section rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-700">3. Expectativa do Gestor</div>
                    <h3 className="mt-1.5 text-[17px] font-bold leading-tight text-[#132536]">Expectativa do Gestor</h3>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">
                      A prioridade do gestor é um peso relativo entre dimensões. Ela não representa uma nota esperada e a comparação acontece sempre cluster × cluster.
                    </p>
                  </div>
                </div>

                {perfil?.expectativaGestor?.compatibilidade == null ? (
                  <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {perfil?.expectativaGestor?.motivo ||
                        'Ainda não há informações suficientes para comparar o perfil do colaborador com a expectativa do gestor.'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="mb-5 rounded-[14px] border border-violet-300/50 bg-[linear-gradient(135deg,rgba(104,65,255,0.065),rgba(104,65,255,0.025))] p-5 sm:p-6">
                    <div className="text-sm font-semibold text-violet-800">Compatibilidade com a expectativa do gestor</div>
                    <div className="mt-2 text-[34px] font-bold leading-none tracking-[-0.025em] text-violet-950">
                      {fmtPct1(perfil.expectativaGestor.compatibilidade)}
                    </div>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-violet-100">
                      <div
                        className="assessment-progress-fill h-full rounded-full bg-violet-600"
                        style={{ width: `${perfil.expectativaGestor.compatibilidade}%` }}
                      />
                    </div>
                    <div className="mt-3 text-xs leading-relaxed text-violet-800">
                      Resultado ponderado pelos clusters priorizados pelo gestor. Dimensões não priorizadas ficam fora do cálculo.
                    </div>
                  </div>
                )}

                <div className="assessment-stagger grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {INTEGRACAO_CLUSTERS.map((cluster) => {
                    const expectativa = expectativaPorKey.get(cluster.key);
                    const auto = autoPorKey.get(cluster.key);
                    const prioridade = expectativa?.prioridade ?? 0;
                    const leitura = leituraComparacao(prioridade, auto?.percentual);
                    return (
                      <div key={cluster.key} className={`assessment-card min-w-0 rounded-xl border p-4 ${leitura.classes}`}>
                        <div className="mb-4 flex min-h-[64px] flex-col gap-2">
                          <div className="text-sm font-bold leading-snug text-slate-800">{cluster.nome}</div>
                          <Badge variant="outline" className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold leading-tight ${leitura.badge}`}>
                            {leitura.rotulo}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-0">
                          <div className="min-w-0 sm:border-r sm:border-slate-200 sm:pr-3">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-700">Prioridade do gestor</div>
                            {perfil?.expectativaGestor?.descritoresReconhecidos ? (
                              prioridade > 0 ? (
                                <>
                                  <div className="mt-2 text-2xl font-bold leading-none text-violet-950">{fmtPct1(prioridade)}</div>
                                  <div className="mt-2 min-h-[32px] text-xs leading-relaxed text-violet-800">{expectativa?.nivel}</div>
                                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-violet-100">
                                    <div
                                      className="assessment-progress-fill h-full rounded-full bg-violet-600"
                                      style={{ width: `${prioridade}%` }}
                                    />
                                  </div>
                                </>
                              ) : (
                                <div className="mt-2 text-sm font-semibold text-slate-500">Não priorizada pelo gestor</div>
                              )
                            ) : (
                              <div className="mt-2 text-sm text-slate-500">Sem informação</div>
                            )}
                          </div>

                          <div className="min-w-0 sm:pl-3">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Perfil do colaborador</div>
                            <div className="mt-2 text-2xl font-bold leading-none text-slate-950">{fmtPct1(auto?.percentual)}</div>
                            <div className="mt-2 min-h-[32px] text-xs leading-relaxed text-slate-500">Autoavaliação do cluster</div>
                            <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="assessment-progress-fill h-full rounded-full bg-slate-700"
                                style={{ width: `${auto?.percentual ?? 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
                  <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                      <span><strong className="text-emerald-800">Verde:</strong> perfil igual ou maior que a prioridade, ou até 5 pontos percentuais abaixo.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-hidden="true" />
                      <span><strong className="text-blue-800">Azul:</strong> perfil entre mais de 5 e até 20 pontos percentuais abaixo da prioridade.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
                      <span><strong className="text-amber-800">Amarelo:</strong> diferença acima de 20 e até 40 pontos percentuais.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-500" aria-hidden="true" />
                      <span><strong className="text-orange-800">Laranja:</strong> diferença acima de 40 pontos percentuais.</span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-[11px] leading-5 text-slate-500">
                  Uma dimensão não priorizada não significa que o gestor espera ausência daquela competência. Ela apenas não recebeu peso na comparação.
                </p>
              </section>

              <details className="assessment-section group overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-300 sm:px-6">
                  <span>Como estes resultados são calculados?</span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 group-open:hidden">Ver explicação</span>
                  <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 group-open:inline">Ocultar explicação</span>
                </summary>
                <div className="assessment-details-body grid gap-3 border-t border-slate-200 px-5 py-5 text-sm leading-relaxed text-slate-700 sm:px-6 lg:grid-cols-2">
                  <div className="rounded-xl bg-slate-50/70 p-4">
                    <h4 className="font-bold text-slate-950">1. Perfil Comportamental</h4>
                    <p className="mt-2">
                      Os percentuais de Dominância, Influência, Estabilidade e Conformidade/Cautela vêm diretamente do resultado mais recente do Assessment/Avaliação de Potencial do colaborador.
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50/70 p-4">
                    <h4 className="font-bold text-slate-950">2. Autoavaliação de Competências</h4>
                    <p className="mt-2">
                      Representa como o próprio colaborador se percebe. As competências respondidas de 1 a 5 são agrupadas nos cinco clusters. O sistema calcula a média das competências encontradas em cada cluster e transforma essa média em percentual.
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50/70 p-4">
                    <h4 className="font-bold text-slate-950">3. Prioridade do Gestor</h4>
                    <p className="mt-2">
                      O BEM Acolhido não mede o nível esperado da competência. Ele mostra quais dimensões o gestor priorizou. Na lista atual, o sistema considera a proporção de descritores selecionados dentro de cada cluster. Nas respostas históricas, utiliza os pesos definidos para as palavras antigas, sem alterar a resposta original.
                    </p>
                    <p className="mt-2">
                      Depois, o maior índice encontrado vira 100% de prioridade e os demais são normalizados proporcionalmente.
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50/70 p-4">
                    <h4 className="font-bold text-slate-950">4. Compatibilidade</h4>
                    <p className="mt-2">
                      A prioridade do gestor funciona como peso para o perfil autopercebido do colaborador. O sistema multiplica o percentual do colaborador pela prioridade de cada cluster, soma os resultados e divide pela soma das prioridades.
                    </p>
                    <p className="mt-2">
                      Clusters não priorizados ficam fora dessa conta. Se faltar autoavaliação em uma dimensão priorizada, a compatibilidade não é calculada para evitar um resultado enganoso.
                    </p>
                  </div>
                </div>
              </details>

              <div className="flex justify-end border-t border-slate-200 pt-5">
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    className="rounded-lg border-slate-200 bg-white px-4 shadow-none transition-[background-color,border-color,transform,box-shadow] duration-150 hover:border-slate-300 hover:bg-slate-50 active:scale-[.98] focus-visible:ring-2 focus-visible:ring-violet-300"
                  >
                    Fechar janela
                  </Button>
                </DialogClose>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function alertasDoColaborador(colaborador: ColaboradorAcompanhamento): string[] {
  const alertas: string[] = [];
  if (colaborador.acessouEcoLider === false) {
    alertas.push('Esse colaborador ainda não entrou na EcoLíder.');
  }
  if (colaborador.assessmentPotencialConcluido === false) {
    alertas.push('Esse colaborador ainda não realizou o Assessment/Avaliação de Potencial.');
  }
  if (colaborador.jornadaCompliance.total > 0 && colaborador.jornadaCompliance.concluidas === 0) {
    alertas.push('Esse colaborador não iniciou a Jornada Compliance.');
  }
  if (colaborador.pdi.total > 0 && colaborador.pdi.concluidas === 0) {
    alertas.push('Esse colaborador ainda não realizou nenhuma das tarefas registradas no PDI.');
  }
  return alertas;
}

function EvolucaoPesquisaColaborador({ respostas }: { respostas: RespostaAcompanhamento[] }) {
  const momentos = useMemo(() => evolucaoPesquisaColaborador(respostas), [respostas]);
  const chartData = momentos.map((m) => ({
    momento: m.label,
    ...m.indices,
  }));

  return (
    <Card className="overflow-hidden border-indigo-200/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          Evolução — Colaborador (Pesquisa de Integração)
        </CardTitle>
        <CardDescription>
          Evolução da percepção do próprio colaborador ao longo dos alinhamentos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!momentos.length ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            O colaborador ainda não possui Pesquisa de Integração respondida.
          </div>
        ) : (
          <>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="momento" />
                  <YAxis domain={[0, 100]} ticks={[0,20,40,60,80,100]} tickFormatter={(v) => `${v}%`} />
                  <ChartTooltip formatter={(v: number) => `${Number(v).toFixed(1).replace('.', ',')}%`} />
                  <Legend />
                  {INDICES_PESQUISA_COLABORADOR.map((grupo, i) => (
                    <Line
                      key={grupo.chave}
                      type="monotone"
                      dataKey={grupo.chave}
                      name={grupo.nome}
                      stroke={CORES[i % CORES.length]}
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Índice</th>
                    {momentos.map((m) => (
                      <th key={m.ciclo} className="px-3 py-2 text-center">Alinhamento {m.ciclo}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INDICES_PESQUISA_COLABORADOR.map((grupo) => (
                    <tr key={grupo.chave} className="border-t">
                      <td className="px-3 py-2 font-medium">{grupo.nome}</td>
                      {momentos.map((m) => (
                        <td key={m.ciclo} className="px-3 py-2 text-center font-semibold">
                          {m.indices[grupo.chave] == null
                            ? '—'
                            : `${m.indices[grupo.chave]!.toFixed(1).replace('.', ',')}%`}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
              Índices calculados a partir das questões de cada bloco da Pesquisa de Integração.
              Respostas 0 (“sem opinião”) não entram na média. No item de sobrecarga, a escala é invertida
              para que percentuais maiores mantenham sempre o mesmo sentido de percepção mais favorável.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EvolucaoBloco({ titulo, respostas, papel }: {
  titulo: string;
  respostas: RespostaAcompanhamento[];
  papel: 'Gestor' | 'Anjo';
}) {
  const momentos = useMemo(() => evolucaoPorPapel(respostas, papel), [respostas, papel]);
  const chartData = momentos.map((m) => ({
    momento: m.label,
    ...m.pilares,
  }));
  const ultimo = momentos[momentos.length - 1];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-violet-600" />
          {titulo}
        </CardTitle>
        <CardDescription>Médias por pilar ao longo dos feedbacks registrados.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!momentos.length ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Ainda não há avaliações registradas nesta visão.
          </div>
        ) : (
          <>
            <div className="h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="momento" />
                  <YAxis domain={[0, 5]} ticks={[0,1,2,3,4,5]} />
                  <ChartTooltip formatter={(v: number) => Number(v).toFixed(2).replace('.', ',')} />
                  <Legend />
                  {PILARES_ACOMPANHAMENTO.map((p, i) => (
                    <Line
                      key={p.chave}
                      type="monotone"
                      dataKey={p.chave}
                      name={p.nome}
                      stroke={CORES[i % CORES.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Pilar</th>
                    {momentos.map((m) => <th key={m.ciclo} className="px-3 py-2 text-center">{m.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PILARES_ACOMPANHAMENTO.map((p) => (
                    <tr key={p.chave} className="border-t">
                      <td className="px-3 py-2 font-medium">{p.nome}</td>
                      {momentos.map((m) => (
                        <td key={m.ciclo} className="px-3 py-2 text-center">
                          {m.pilares[p.chave] == null ? '—' : m.pilares[p.chave]!.toFixed(2).replace('.', ',')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {papel === 'Gestor' && ultimo && (
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Desenvolvimento', ultimo.desenvolvimento],
                  ['Produtividade', ultimo.produtividade],
                  ['Conceito Geral', ultimo.conceitoGeral],
                ].map(([label, value]) => {
                  const n = percentualNumero(value);
                  return (
                    <div key={label} className="rounded-xl border bg-muted/20 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
                      <div className="mt-1 text-2xl font-bold">{n == null ? value : `${n}%`}</div>
                      {n != null && <Progress value={n} className="mt-3 h-2" />}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function AcompanharIntegracaoGestor() {
  const [dados, setDados] = useState<AcompanhamentoResponse | null>(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [selecionadoId, setSelecionadoId] = useState('');
  const [gestorView, setGestorView] = useState('all');
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [perfilColaborador, setPerfilColaborador] = useState<ColaboradorAcompanhamento | null>(null);

  const abrirPerfil = (item: ColaboradorAcompanhamento) => {
    setPerfilColaborador(item);
    setPerfilOpen(true);
  };

  const carregar = async (gestor = gestorView) => {
    setLoading(true);
    setErro('');
    try {
      const params = new URLSearchParams();
      if (gestor && gestor !== 'all') params.set('gestor', gestor);
      const url = `/api/programa-integracao/gestor/acompanhamento${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Não foi possível carregar o acompanhamento.');
      setDados(json);
      if (json?.adminView) {
        setGestorView(json?.gestorSelecionado?.key || 'all');
      }
      setSelecionadoId((atual) => atual && json.colaboradores.some((c: any) => c.id === atual)
        ? atual
        : json.colaboradores[0]?.id || '');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar o acompanhamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void carregar(); }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = dados?.colaboradores || [];
    if (!termo) return lista;
    return lista.filter((c) =>
      c.nome.toLowerCase().includes(termo) ||
      c.cargo.toLowerCase().includes(termo) ||
      c.unidade.toLowerCase().includes(termo));
  }, [dados, busca]);

  const colaborador = (dados?.colaboradores || []).find((c) => c.id === selecionadoId) || filtrados[0] || null;
  const alertasColaborador = colaborador ? alertasDoColaborador(colaborador) : [];

  const trocarVisaoGerente = (value: string) => {
    setGestorView(value);
    setBusca('');
    setSelecionadoId('');
    void carregar(value);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1500px] space-y-6 p-1">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-violet-600">
              {dados?.adminView ? 'Visão Administrativa' : 'Visão do Gestor'}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Acompanhar Integração</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhamento executivo e evolução dos colaboradores ativos no Programa de Integração.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            {dados?.adminView && (
              <div className="min-w-[290px] space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visualizar como</div>
                <Select value={gestorView} onValueChange={trocarVisaoGerente} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a visão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">UGP/RH — todos os colaboradores</SelectItem>
                    {(dados.gestoresDisponiveis || []).map((g) => (
                      <SelectItem key={g.key} value={g.key}>
                        {g.nome} — {g.colaboradores} colaborador(es)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {dados?.scope === 'all' ? (
              <Badge variant="secondary">Visão UGP/RH</Badge>
            ) : dados?.gestorSelecionado ? (
              <Badge variant="secondary">Visão do gerente: {dados.gestorSelecionado.nome}</Badge>
            ) : null}
            <Button variant="outline" onClick={() => void carregar(gestorView)} disabled={loading}>Atualizar</Button>
          </div>
        </div>

        {loading ? (
          <Card><CardContent className="flex items-center justify-center gap-3 py-16"><Loader2 className="h-5 w-5 animate-spin" />Carregando acompanhamento...</CardContent></Card>
        ) : erro ? (
          <Card><CardContent className="py-12 text-center"><p className="font-semibold text-destructive">{erro}</p><Button className="mt-4" onClick={() => void carregar()}>Tentar novamente</Button></CardContent></Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
            <Card className="h-fit xl:sticky xl:top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />Colaboradores</CardTitle>
                <CardDescription>{dados?.colaboradores.length || 0} ativo(s) disponível(is)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Buscar colaborador..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
                  {filtrados.map((c) => (
                    <div
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelecionadoId(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setSelecionadoId(c.id);
                      }}
                      className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-colors ${colaborador?.id === c.id ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/20' : 'hover:bg-muted/40'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold">{c.nome}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{c.cargo || 'Cargo não informado'} · {c.unidade || 'Unidade não informada'}</div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 shrink-0 gap-1 px-2 text-[11px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirPerfil(c);
                          }}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Assessment
                        </Button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span>Dia {c.dia}/{c.totalDias}</span>
                        {!!c.formulariosPendentes.length && <span className="font-semibold text-amber-700">{c.formulariosPendentes.length} pendência(s)</span>}
                        {alertasDoColaborador(c).length > 0 && (
                          <span className="font-semibold text-red-700">{alertasDoColaborador(c).length} alerta(s)</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {!filtrados.length && <div className="py-8 text-center text-sm text-muted-foreground">Nenhum colaborador encontrado.</div>}
                </div>
              </CardContent>
            </Card>

            {colaborador ? (
              <div className="space-y-6">
                <Card className="overflow-hidden rounded-xl border-0 bg-gradient-to-r from-[#32106f] via-[#6518d9] to-[#4b2ee8] shadow-md">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold !text-white drop-shadow-sm">{colaborador.nome}</h2>
                        <p className="mt-1 text-sm !text-white/90">{colaborador.cargo || 'Cargo não informado'} · {colaborador.unidade || 'Unidade/Regional não informada'}</p>
                        <p className="mt-2 text-xs !text-white/80">Início: {dataBr(colaborador.inicio)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="gap-2 border-0 bg-white/95 text-violet-900 hover:bg-white"
                          onClick={() => abrirPerfil(colaborador)}
                        >
                          <Sparkles className="h-4 w-4" /> Perfil do Assessment
                        </Button>
                        <Button
                          variant="secondary"
                          className="gap-2 border-0 bg-amber-400 text-black hover:bg-amber-300"
                          onClick={() => gerarAcompanhamentoIntegracaoPdf(colaborador)}
                        >
                          <Download className="h-4 w-4" /> Exportar relatório completo PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {alertasColaborador.length > 0 && (
                  <div className="space-y-2">
                    {alertasColaborador.map((mensagem) => (
                      <Alert key={mensagem} className="border-amber-300 bg-amber-50 text-amber-950">
                        <AlertTriangle className="h-4 w-4 text-amber-700" />
                        <AlertTitle className="font-bold">Atenção</AlertTitle>
                        <AlertDescription>{mensagem}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Card><CardContent className="pt-5"><div className="text-xs font-semibold uppercase text-muted-foreground">Dia do Onboarding</div><div className="mt-2 text-3xl font-bold">{colaborador.dia}<span className="text-base text-muted-foreground">/{colaborador.totalDias}</span></div><Progress className="mt-3" value={(colaborador.dia/colaborador.totalDias)*100} /></CardContent></Card>
                  <Card><CardContent className="pt-5"><div className="text-xs font-semibold uppercase text-muted-foreground">Jornada Compliance</div><div className="mt-2 text-3xl font-bold">{fmtPct(colaborador.jornadaCompliance.percentual)}</div><Progress className="mt-3" value={colaborador.jornadaCompliance.percentual || 0} /><div className="mt-2 text-xs text-muted-foreground">{colaborador.jornadaCompliance.concluidas} de {colaborador.jornadaCompliance.total} atividades</div></CardContent></Card>
                  <Card><CardContent className="pt-5"><div className="text-xs font-semibold uppercase text-muted-foreground">Tarefas do PDI</div><div className="mt-2 text-3xl font-bold">{fmtPct(colaborador.pdi.percentual)}</div><Progress className="mt-3" value={colaborador.pdi.percentual || 0} /><div className="mt-2 text-xs text-muted-foreground">{colaborador.pdi.total ? `${colaborador.pdi.concluidas} de ${colaborador.pdi.total} tarefas` : 'Sem tarefas registradas'}</div></CardContent></Card>
                  <Card><CardContent className="pt-5"><div className="text-xs font-semibold uppercase text-muted-foreground">Alinhamentos realizados</div><div className="mt-2 text-3xl font-bold">{colaborador.alinhamentosFeitos}<span className="text-base text-muted-foreground">/{colaborador.alinhamentosTotal}</span></div><Progress className="mt-3" value={(colaborador.alinhamentosFeitos/colaborador.alinhamentosTotal)*100} /></CardContent></Card>
                </div>

                <EvolucaoBloco titulo="Evolução — Gestor" respostas={colaborador.respostas} papel="Gestor" />
                <EvolucaoBloco titulo="Evolução — Anjo" respostas={colaborador.respostas} papel="Anjo" />

                {dados?.scope === 'all' && (
                  <EvolucaoPesquisaColaborador respostas={colaborador.respostas} />
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><ClipboardList className="h-5 w-5 text-indigo-600" />Formulários pendentes</CardTitle>
                    <CardDescription>Pendências de formulários que já foram efetivamente solicitados ao Gestor, Anjo ou Colaborador.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!colaborador.formulariosPendentes.length ? (
                      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum formulário pendente.</div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-[650px] text-sm">
                          <thead className="bg-muted/50">
                            <tr><th className="px-3 py-2 text-left">Responsável</th><th className="px-3 py-2 text-left">Formulário</th><th className="px-3 py-2 text-center">Etapa / Alinhamento</th><th className="px-3 py-2 text-center">Prazo</th><th className="px-3 py-2 text-center">Situação</th><th className="px-3 py-2 text-center">Ação</th></tr>
                          </thead>
                          <tbody>
                            {colaborador.formulariosPendentes.map((p, i) => (
                              <tr key={`${p.papel}-${p.ciclo}-${i}`} className="border-t">
                                <td className="px-3 py-2 font-medium">{p.papel}</td>
                                <td className="px-3 py-2">{p.formulario}</td>
                                <td className="px-3 py-2 text-center">{p.ciclo === 0 ? (p.etapa || 'Pré-integração') : `${p.ciclo}º alinhamento`}</td>
                                <td className="px-3 py-2 text-center">{dataBr(p.prazo)}</td>
                                <td className="px-3 py-2 text-center"><Badge variant={p.atrasado ? 'destructive' : 'secondary'}>{p.atrasado ? 'Atrasado' : 'Pendente'}</Badge></td>
                                <td className="px-3 py-2 text-center">
                                  {linkPreencherFormulario(colaborador, p) ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(linkPreencherFormulario(colaborador, p)!, '_blank', 'noopener,noreferrer')}
                                    >
                                      Preencher
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="text-right text-xs text-muted-foreground">
                  Dados atualizados em {dados?.atualizadoEm ? new Date(dados.atualizadoEm).toLocaleString('pt-BR') : '—'}
                </div>
              </div>
            ) : (
              <Card><CardContent className="py-16 text-center"><UserCheck className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-muted-foreground">Nenhum colaborador disponível para este acesso.</p></CardContent></Card>
            )}
          </div>
        )}
        <PerfilAssessmentModal
          colaborador={perfilColaborador}
          open={perfilOpen}
          onOpenChange={setPerfilOpen}
        />
      </div>
    </DashboardLayout>
  );
}
