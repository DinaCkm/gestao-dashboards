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
import { AlertTriangle, BarChart3, ClipboardList, Download, Info, Loader2, Search, Sparkles, Trash2, UserCheck, Users } from 'lucide-react';
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
import { arquivarRespostaRecebida } from '@/features/programaIntegracao/api/respostas';
import { toast } from 'sonner';

interface Pendencia {
  ciclo: number;
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
  bemAcolhidoAtual?: {
    rid: string;
    protocolo: string;
    formVersion: number;
    submittedAt: string | null;
    matriz: 'historica' | 'atual' | null;
  } | null;
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
      : null;
  if (!slug) return null;

  const params = new URLSearchParams();
  params.set('nome', colaborador.nome);
  if (colaborador.unidade) params.set('unidade', colaborador.unidade);
  params.set('ciclo', pendencia.cycleValue || String(pendencia.ciclo));

  if (pendencia.formKey === 'aval') {
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
  adminView,
  onRespostaArquivada,
}: {
  colaborador: ColaboradorAcompanhamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminView?: boolean;
  onRespostaArquivada?: () => Promise<void> | void;
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
  const [arquivandoBem, setArquivandoBem] = useState(false);

  const classeComparacao = (prioridade: number, perfilColaborador: number | null | undefined) => {
    if (perfilColaborador == null || !Number.isFinite(Number(perfilColaborador)) || prioridade <= 0) {
      return 'border-slate-200 bg-slate-50';
    }
    const perfilNumero = Number(perfilColaborador);
    if (perfilNumero >= prioridade) return 'border-emerald-300 bg-emerald-50';
    const diferenca = prioridade - perfilNumero;
    if (diferenca <= 5) return 'border-emerald-300 bg-emerald-50';
    if (diferenca <= 20) return 'border-blue-300 bg-blue-50';
    if (diferenca <= 40) return 'border-amber-300 bg-amber-50';
    return 'border-orange-300 bg-orange-50';
  };

  const arquivarBemAtual = async () => {
    const bem = perfil?.bemAcolhidoAtual;
    if (!bem?.rid) return;
    const confirmar = window.confirm(
      'Excluir esta resposta do BEM Acolhido da visão ativa?\n\nA resposta não será apagada. Ela ficará guardada em Respostas Recebidas > Excluídas e poderá ser restaurada depois. Todos os cálculos passarão a considerar apenas respostas ativas.',
    );
    if (!confirmar) return;
    try {
      setArquivandoBem(true);
      await arquivarRespostaRecebida(bem.rid);
      toast.success('Resposta do BEM Acolhido movida para Excluídas.');
      onOpenChange(false);
      await onRespostaArquivada?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir a resposta.');
    } finally {
      setArquivandoBem(false);
    }
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
      ? 'border-red-200 bg-red-50 text-red-950'
      : item.key === 'I'
        ? 'border-amber-200 bg-amber-50 text-amber-950'
        : item.key === 'S'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
          : 'border-blue-200 bg-blue-50 text-blue-950';
    return { ...item, score: score == null ? null : Number(score), classes };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] w-[calc(100vw-0.75rem)] max-w-[1480px] gap-0 overflow-hidden p-0 sm:w-[96vw]">
        <div className="border-b bg-gradient-to-r from-violet-950 via-violet-800 to-indigo-700 px-5 py-5 pr-12 text-white sm:px-7">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-bold text-white sm:text-2xl">
              Perfil do Assessment
            </DialogTitle>
            <DialogDescription className="text-sm text-white/80">
              {colaborador.nome} · perfil comportamental, autoavaliação de competências e expectativa do gestor.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[calc(92vh-96px)] overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6 lg:px-7">
          <TooltipProvider>
            <div className="space-y-6">
              <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">1. Perfil Comportamental</div>
                  <h3 className="mt-1 text-lg font-bold">Perfil Comportamental</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {discCards.map((item) => (
                      <div key={item.key} className={`min-w-0 rounded-xl border p-4 ${item.classes}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 text-sm font-bold leading-snug">{item.nome}</div>
                          <UiTooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="shrink-0 rounded-full p-1 opacity-80 hover:bg-white/60 hover:opacity-100"
                                aria-label={`Informações sobre ${item.nome}`}
                              >
                                <Info className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs leading-relaxed">{item.descricao}</TooltipContent>
                          </UiTooltip>
                        </div>
                        <div className="mt-4 text-3xl font-bold">{fmtPct1(item.score)}</div>
                        <div className="mt-1 text-sm font-semibold">{item.rotulo}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">2. Autoavaliação</div>
                  <h3 className="mt-1 text-lg font-bold">Autoavaliação de Competências</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Esta autoavaliação mostra como o próprio colaborador percebe suas competências em cada dimensão.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {INTEGRACAO_CLUSTERS.map((cluster) => {
                    const dados = autoPorKey.get(cluster.key);
                    return (
                      <div key={cluster.key} className="min-w-0 rounded-xl border bg-muted/20 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 text-sm font-semibold leading-snug">{cluster.nome}</div>
                          <UiTooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
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
                        <div className="mt-3 text-3xl font-bold">{fmtPct1(dados?.percentual)}</div>
                        <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {dados?.totalAvaliadas
                            ? `${dados.totalAvaliadas} de ${dados.totalCompetencias} competências com autoavaliação`
                            : 'Sem autoavaliação registrada neste cluster'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">3. Expectativa do Gestor</div>
                    <h3 className="mt-1 text-lg font-bold">Expectativa do Gestor</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      A prioridade do gestor é um peso relativo entre dimensões. Ela não representa uma nota esperada e a comparação acontece sempre cluster × cluster.
                    </p>
                  </div>
                  {adminView && perfil?.bemAcolhidoAtual?.rid && (
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                      disabled={arquivandoBem}
                      onClick={() => void arquivarBemAtual()}
                    >
                      {arquivandoBem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      Excluir resposta do BEM
                    </Button>
                  )}
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
                  <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 p-4 sm:p-5">
                    <div className="text-sm font-semibold text-violet-800">Compatibilidade com a expectativa do gestor</div>
                    <div className="mt-1 text-4xl font-bold text-violet-950">
                      {fmtPct1(perfil.expectativaGestor.compatibilidade)}
                    </div>
                    <div className="mt-2 text-xs leading-relaxed text-violet-800">
                      Resultado ponderado pelos clusters priorizados pelo gestor. Dimensões não priorizadas ficam fora do cálculo.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {INTEGRACAO_CLUSTERS.map((cluster) => {
                    const expectativa = expectativaPorKey.get(cluster.key);
                    const auto = autoPorKey.get(cluster.key);
                    const prioridade = expectativa?.prioridade ?? 0;
                    return (
                      <div key={cluster.key} className={`min-w-0 rounded-xl border p-4 ${classeComparacao(prioridade, auto?.percentual)}`}>
                        <div className="mb-3 text-sm font-bold leading-snug">{cluster.nome}</div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-violet-50 p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">Prioridade do gestor</div>
                            {perfil?.expectativaGestor?.descritoresReconhecidos ? (
                              prioridade > 0 ? (
                                <>
                                  <div className="mt-1 text-2xl font-bold text-violet-950">{fmtPct1(prioridade)}</div>
                                  <div className="mt-1 text-xs text-violet-800">{expectativa?.nivel}</div>
                                </>
                              ) : (
                                <div className="mt-2 text-sm font-semibold text-muted-foreground">Não priorizada pelo gestor</div>
                              )
                            ) : (
                              <div className="mt-2 text-sm text-muted-foreground">Sem informação</div>
                            )}
                          </div>
                          <div className="rounded-lg bg-slate-50 p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Perfil do colaborador</div>
                            <div className="mt-1 text-2xl font-bold text-slate-950">{fmtPct1(auto?.percentual)}</div>
                            <div className="mt-1 text-xs text-slate-600">Autoavaliação do cluster</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 space-y-2 rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                  <p>0% de prioridade não significa ausência de competência esperada. Significa apenas que aquela dimensão não foi priorizada pelo gestor e, por isso, não participa do cálculo de compatibilidade.</p>
                  <p>
                    Cores da comparação: verde quando o perfil do colaborador é igual/superior à prioridade do gestor ou está até 5 pontos abaixo; azul quando está entre 5 e 20 pontos abaixo; amarelo entre 20 e 40 pontos abaixo; laranja quando a diferença supera 40 pontos.
                  </p>
                  {adminView && (
                    <p>
                      Respostas excluídas não entram nos cálculos e permanecem preservadas em Programa de Integração → Respostas Recebidas → Excluídas, onde podem ser restauradas.
                    </p>
                  )}
                </div>
              </section>

              <div className="flex justify-end border-t pt-4">
                <DialogClose asChild>
                  <Button variant="outline">Fechar janela</Button>
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
                    <CardDescription>Somente pendências de Gestor, Anjo e Colaborador.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!colaborador.formulariosPendentes.length ? (
                      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum formulário pendente.</div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-[650px] text-sm">
                          <thead className="bg-muted/50">
                            <tr><th className="px-3 py-2 text-left">Responsável</th><th className="px-3 py-2 text-left">Formulário</th><th className="px-3 py-2 text-center">Alinhamento Nº</th><th className="px-3 py-2 text-center">Prazo</th><th className="px-3 py-2 text-center">Situação</th><th className="px-3 py-2 text-center">Ação</th></tr>
                          </thead>
                          <tbody>
                            {colaborador.formulariosPendentes.map((p, i) => (
                              <tr key={`${p.papel}-${p.ciclo}-${i}`} className="border-t">
                                <td className="px-3 py-2 font-medium">{p.papel}</td>
                                <td className="px-3 py-2">{p.formulario}</td>
                                <td className="px-3 py-2 text-center">{p.ciclo}º</td>
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
          adminView={dados?.adminView}
          onRespostaArquivada={async () => {
            await carregar(gestorView);
            setPerfilColaborador(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
