import { useState, useMemo } from "react";
import { formatDateCustomSafe } from "@/lib/dateUtils";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Target, CheckCircle2, XCircle, Clock, TrendingUp,
  ChevronDown, ChevronRight, AlertCircle, Flag, Calendar,
  MessageSquare, Loader2, BookOpen, Trophy, CircleDot
} from "lucide-react";
import DualIndicators from "@/components/DualIndicators";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell
} from "recharts";

// ============================================================
// HELPERS
// ============================================================
function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return formatDateCustomSafe(d, { day: "2-digit", month: "short", year: "numeric" });
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function getStatusColor(status: string) {
  switch (status) {
    case "cumprida": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "nao_cumprida": return "bg-red-100 text-red-700 border-red-200";
    case "parcial": return "bg-amber-100 text-amber-700 border-amber-200";
    default: return "bg-blue-50 text-blue-600 border-blue-200";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "cumprida": return "Cumprida";
    case "nao_cumprida": return "Não cumprida";
    case "parcial": return "Parcial";
    default: return "Em andamento";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "cumprida": return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "nao_cumprida": return <XCircle className="h-4 w-4 text-red-500" />;
    case "parcial": return <Clock className="h-4 w-4 text-amber-500" />;
    default: return <CircleDot className="h-4 w-4 text-blue-500" />;
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MinhasMetasAluno() {
  const { data, isLoading, isError } = trpc.metas.minhas.useQuery();
  const [expandedMicroMetas, setExpandedMicroMetas] = useState<Set<number>>(new Set());

  // Alerta de atualização de metas
  const alunoId = data?.alunoId;
  const { data: alertaMetas } = trpc.metas.alertaAtualizacao.useQuery(
    { alunoId: alunoId! },
    { enabled: !!alunoId }
  );

  // Indicadores V2 do aluno (para Engajamento)
  const { data: dashData } = trpc.indicadores.meuDashboard.useQuery();

  // Separar macro meta (primeira criada) e micro metas (demais)
  const { macroMeta, microMetas } = useMemo(() => {
    const metasList = data?.metas;
    if (!metasList || metasList.length === 0) return { macroMeta: null, microMetas: [] };
    const ordenadas = [...metasList].sort(
      (a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );
    return {
      macroMeta: ordenadas[0] ?? null,
      microMetas: ordenadas.slice(1),
    };
  }, [data?.metas]);

  // Calcular progresso das micro metas
  const progressoMicroMetas = useMemo(() => {
    if (microMetas.length === 0) return 0;
    const cumpridas = microMetas.filter((m: any) => m.ultimoStatus === "cumprida").length;
    return Math.round((cumpridas / microMetas.length) * 100);
  }, [microMetas]);

  // Dados para o gráfico de barras por competência (mantido para visão geral)
  const resumo = data?.resumo || { total: 0, cumpridas: 0, percentual: 0, porCompetencia: [] };
  const naoCumpridas = resumo.total - resumo.cumpridas;

  const toggleMicroMeta = (id: number) => {
    setExpandedMicroMetas(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <AlunoLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-[#E87B2F]" />
          <span className="ml-3 text-gray-500">Carregando suas metas...</span>
        </div>
      </AlunoLayout>
    );
  }

  // Error state
  if (isError) {
    return (
      <AlunoLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertCircle className="h-16 w-16 text-red-400" />
          <h2 className="text-xl font-semibold text-gray-700">Erro ao carregar metas</h2>
          <p className="text-gray-500">Tente recarregar a página.</p>
        </div>
      </AlunoLayout>
    );
  }

  return (
    <AlunoLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="bg-[#0A1E3E] p-3 rounded-xl">
            <Flag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Minhas Metas de Desenvolvimento</h1>
            <p className="text-gray-500 text-sm">Acompanhe o progresso das metas definidas pela sua mentora</p>
          </div>
        </div>

        {/* Alerta de Atualização de Metas */}
        {alertaMetas?.precisaAtualizar && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-full">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800">Lembrete: Atualização de Metas</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    {alertaMetas.sessoesDesdeUltimaAtualizacao >= 3
                      ? `Você já realizou ${alertaMetas.sessoesDesdeUltimaAtualizacao} sessões de mentoria desde a última atualização de metas.`
                      : alertaMetas.mesesDesdeUltimaAtualizacao >= 3
                      ? `Já se passaram ${alertaMetas.mesesDesdeUltimaAtualizacao} meses desde a última atualização de metas.`
                      : `Suas metas ainda não tiveram nenhum registro de acompanhamento.`
                    }
                    {" "}Lembre-se de revisar suas metas de desenvolvimento com a sua mentora na próxima sessão.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* === INDICADORES DE DESTAQUE === */}
        <DualIndicators
          engajamento={
            dashData?.found
              ? (dashData.indicadoresV2?.consolidado?.ind7_engajamentoFinal ??
                 dashData.indicadores?.performanceGeral ??
                 0)
              : 0
          }
          desenvolvimento={resumo.percentual}
          engajamentoDetalhes={
            dashData?.found && dashData.indicadoresV2?.consolidado
              ? {
                  ind1_webinars: dashData.indicadoresV2.consolidado.ind1_webinars,
                  ind2_avaliacoes: dashData.indicadoresV2.consolidado.ind2_avaliacoes,
                  ind3_competencias: dashData.indicadoresV2.consolidado.ind3_competencias,
                  ind4_tarefas: dashData.indicadoresV2.consolidado.ind4_tarefas,
                  ind5_engajamento: dashData.indicadoresV2.consolidado.ind5_engajamento,
                }
              : undefined
          }
          desenvolvimentoDetalhes={{
            total: resumo.total,
            cumpridas: resumo.cumpridas,
          }}
        />

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5 text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-[#0A1E3E]" />
              </div>
              <p className="text-3xl font-bold text-[#0A1E3E]">{resumo.total}</p>
              <p className="text-xs text-gray-500 mt-1">Total de Metas</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-emerald-600">{resumo.cumpridas}</p>
              <p className="text-xs text-gray-500 mt-1">Cumpridas</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5 text-center">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-red-500">{naoCumpridas}</p>
              <p className="text-xs text-gray-500 mt-1">Não Cumpridas</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-[#E87B2F]" />
              </div>
              <p className="text-3xl font-bold text-[#E87B2F]">{resumo.percentual}%</p>
              <p className="text-xs text-gray-500 mt-1">Atingimento</p>
              <Progress value={resumo.percentual} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Estado vazio */}
        {!macroMeta && (
          <Card className="border border-dashed border-gray-300">
            <CardContent className="p-12 text-center">
              <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma meta definida ainda</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Sua mentora ainda não definiu metas de desenvolvimento para você.
                As metas aparecerão aqui assim que forem criadas.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ====== MACRO META + MICRO METAS (CARD UNIFICADO) ====== */}
        {macroMeta && (
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            {/* ---- MACRO META ---- */}
            <div className="border-b border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <Flag className="h-5 w-5 text-[#0A1E3E]" />
                  Meta Desafiadora Principal
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-5 space-y-4">
                {/* Título e descrição */}
                <div>
                  <p className="text-lg font-bold text-gray-900">{(macroMeta as any).titulo}</p>
                  {(macroMeta as any).descricao && (
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      {(macroMeta as any).descricao}
                    </p>
                  )}
                </div>

                {/* Competência vinculada */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-400 mb-1">Competência vinculada</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {(macroMeta as any).competenciaNome || "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-400 mb-1">Status atual</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon((macroMeta as any).ultimoStatus || "")}
                      <span className="text-sm font-semibold text-gray-800">
                        {getStatusLabel((macroMeta as any).ultimoStatus || "")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progresso consolidado das micro metas */}
                {microMetas.length > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progresso consolidado (micro metas)</span>
                      <span className="font-semibold text-gray-700">{progressoMicroMetas}%</span>
                    </div>
                    <Progress value={progressoMicroMetas} className="h-2" />
                  </div>
                )}

                {/* Data e prazo */}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Criada em {formatDate((macroMeta as any).createdAt)}
                  </span>
                  {(macroMeta as any).ultimoMes && (macroMeta as any).ultimoAno && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Último registro: {meses[((macroMeta as any).ultimoMes as number) - 1]} {(macroMeta as any).ultimoAno}
                    </span>
                  )}
                </div>
              </CardContent>
            </div>

            {/* ---- MICRO METAS ---- */}
            {microMetas.length > 0 && (
              <div className="bg-gray-50/50">
                <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                  <CircleDot className="h-4 w-4 text-[#E87B2F]" />
                  <span className="text-sm font-semibold text-gray-700">
                    Micro Metas
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    {microMetas.filter((m: any) => m.ultimoStatus === "cumprida").length}/{microMetas.length} cumpridas
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {microMetas.map((micro: any, idx: number) => {
                    const isExpanded = expandedMicroMetas.has(micro.id);
                    const historico = micro.historicoAcompanhamento || [];
                    const contribuicao = microMetas.length > 0 ? Math.round(100 / microMetas.length) : 0;

                    return (
                      <div key={micro.id}>
                        {/* Micro Meta Header */}
                        <button
                          onClick={() => toggleMicroMeta(micro.id)}
                          className="w-full flex items-start justify-between px-6 py-4 hover:bg-white/70 transition-colors text-left"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <span className="text-sm font-bold text-gray-400 mt-0.5 shrink-0">
                              {idx + 1}.
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 leading-snug">
                                {micro.titulo}
                              </p>
                              {micro.descricao && (
                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                                  {micro.descricao}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                Criada em {formatDate(micro.createdAt)}
                                {micro.ultimoMes && micro.ultimoAno && (
                                  <> • Prazo: —</>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <Badge
                              variant="outline"
                              className={`text-xs whitespace-nowrap ${getStatusColor(micro.ultimoStatus || "")}`}
                            >
                              {getStatusLabel(micro.ultimoStatus || "")}
                            </Badge>
                            <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline">
                              Contribuição: {contribuicao}%
                            </span>
                            {isExpanded
                              ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                              : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                            }
                          </div>
                        </button>

                        {/* Micro Meta Detalhes (expandido) */}
                        {isExpanded && (
                          <div className="px-6 pb-4 bg-white border-t border-gray-50">
                            {micro.descricao && (
                              <p className="text-sm text-gray-600 mt-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100 leading-relaxed">
                                {micro.descricao}
                              </p>
                            )}

                            {/* Histórico de Acompanhamento */}
                            {historico.length > 0 ? (
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  Histórico de Acompanhamento
                                </h4>
                                <div className="space-y-2">
                                  {historico.map((acomp: any, hidx: number) => (
                                    <div key={hidx} className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                      <div className="mt-0.5">
                                        {getStatusIcon(acomp.status)}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xs font-medium text-gray-700">
                                            {meses[acomp.mes - 1]} {acomp.ano}
                                          </span>
                                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStatusColor(acomp.status)}`}>
                                            {getStatusLabel(acomp.status)}
                                          </Badge>
                                        </div>
                                        {acomp.observacao && (
                                          <p className="text-xs text-gray-500">{acomp.observacao}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-xs text-gray-400">
                                <Clock className="h-5 w-5 mx-auto mb-1 text-gray-300" />
                                Nenhum acompanhamento registrado ainda
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Estado: macro meta sem micro metas */}
            {microMetas.length === 0 && (
              <div className="px-6 py-5 bg-gray-50/50 text-center">
                <CircleDot className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Sem micro metas cadastradas.</p>
                <p className="text-xs text-gray-300 mt-1">Sua mentora adicionará as micro metas em breve.</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </AlunoLayout>
  );
}
