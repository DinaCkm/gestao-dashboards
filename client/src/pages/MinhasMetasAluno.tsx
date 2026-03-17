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
  MessageSquare, Loader2, BookOpen, Trophy
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
    default: return "bg-gray-100 text-gray-500 border-gray-200";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "cumprida": return "Cumprida";
    case "nao_cumprida": return "Não cumprida";
    case "parcial": return "Parcial";
    default: return "Pendente";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "cumprida": return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "nao_cumprida": return <XCircle className="h-4 w-4 text-red-500" />;
    case "parcial": return <Clock className="h-4 w-4 text-amber-500" />;
    default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MinhasMetasAluno() {
  const { data, isLoading, isError } = trpc.metas.minhas.useQuery();
  const [expandedCompetencias, setExpandedCompetencias] = useState<Set<string>>(new Set());
  const [expandedMetas, setExpandedMetas] = useState<Set<number>>(new Set());

  // Alerta de atualização de metas
  const alunoId = data?.alunoId;
  const { data: alertaMetas } = trpc.metas.alertaAtualizacao.useQuery(
    { alunoId: alunoId! },
    { enabled: !!alunoId }
  );

  // Indicadores V2 do aluno (para Engajamento)
  const { data: dashData } = trpc.indicadores.meuDashboard.useQuery();

  // Agrupar metas por competência
  const metasPorCompetencia = useMemo(() => {
    const metasList = data?.metas;
    if (!metasList || metasList.length === 0) return [];
    const map = new Map<string, { competenciaNome: string; competenciaId: number; metas: typeof metasList }>();
    for (const meta of metasList) {
      const key = meta.competenciaNome;
      if (!map.has(key)) {
        map.set(key, { competenciaNome: key, competenciaId: meta.competenciaId, metas: [] as unknown as typeof metasList });
      }
      (map.get(key)!.metas as any[]).push(meta);
    }
    return Array.from(map.values());
  }, [data?.metas]);

  // Dados para o gráfico de barras por competência
  const chartData = useMemo(() => {
    if (!data?.resumo?.porCompetencia || data.resumo.porCompetencia.length === 0) return [];
    return metasPorCompetencia.map(group => ({
      name: group.competenciaNome.length > 20
        ? group.competenciaNome.substring(0, 18) + "..."
        : group.competenciaNome,
      fullName: group.competenciaNome,
      percentual: (() => {
        const comp = data.resumo.porCompetencia.find(
          (c: any) => c.competenciaId === group.competenciaId
        );
        return comp?.percentual ?? 0;
      })(),
      cumpridas: (() => {
        const comp = data.resumo.porCompetencia.find(
          (c: any) => c.competenciaId === group.competenciaId
        );
        return comp?.cumpridas ?? 0;
      })(),
      total: (() => {
        const comp = data.resumo.porCompetencia.find(
          (c: any) => c.competenciaId === group.competenciaId
        );
        return comp?.total ?? 0;
      })(),
    }));
  }, [data?.resumo?.porCompetencia, metasPorCompetencia]);

  const toggleCompetencia = (nome: string) => {
    setExpandedCompetencias(prev => {
      const next = new Set(prev);
      if (next.has(nome)) next.delete(nome);
      else next.add(nome);
      return next;
    });
  };

  const toggleMeta = (id: number) => {
    setExpandedMetas(prev => {
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

  const resumo = data?.resumo || { total: 0, cumpridas: 0, percentual: 0, porCompetencia: [] };
  const naoCumpridas = resumo.total - resumo.cumpridas;

  return (
    <AlunoLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
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

        {/* Gráfico de Evolução por Competência */}
        {chartData.length > 0 && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#E87B2F]" />
                Evolução por Competência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 60)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={160}
                    tick={{ fontSize: 12, fill: "#374151" }}
                  />
                  <Tooltip
                    formatter={(value: number, _name: string, props: any) => [
                      `${value}% (${props.payload.cumpridas}/${props.payload.total} metas)`,
                      "Atingimento"
                    ]}
                    labelFormatter={(label: string, payload: any[]) =>
                      payload?.[0]?.payload?.fullName || label
                    }
                  />
                  <Bar dataKey="percentual" radius={[0, 6, 6, 0]} barSize={28}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.percentual >= 80 ? "#059669" :
                          entry.percentual >= 50 ? "#E87B2F" :
                          entry.percentual >= 25 ? "#d97706" :
                          "#dc2626"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Estado vazio */}
        {metasPorCompetencia.length === 0 && (
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

        {/* Lista de Competências com Metas */}
        {metasPorCompetencia.map(group => {
          const isExpanded = expandedCompetencias.has(group.competenciaNome);
          const compResumo = resumo.porCompetencia.find(
            (c: any) => c.competenciaId === group.competenciaId
          );
          const compPercentual = compResumo?.percentual ?? 0;
          const compCumpridas = compResumo?.cumpridas ?? 0;

          return (
            <Card key={group.competenciaNome} className="border border-gray-200 shadow-sm overflow-hidden">
              {/* Competência Header */}
              <button
                onClick={() => toggleCompetencia(group.competenciaNome)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded
                    ? <ChevronDown className="h-5 w-5 text-gray-400" />
                    : <ChevronRight className="h-5 w-5 text-gray-400" />
                  }
                  <BookOpen className="h-5 w-5 text-[#0A1E3E]" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">{group.competenciaNome}</h3>
                    <p className="text-xs text-gray-500">
                      {group.metas.length} meta{group.metas.length !== 1 ? "s" : ""} &middot; {compCumpridas} cumprida{compCumpridas !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <span className={`text-sm font-bold ${
                      compPercentual >= 80 ? "text-emerald-600" :
                      compPercentual >= 50 ? "text-[#E87B2F]" :
                      "text-red-500"
                    }`}>
                      {compPercentual}%
                    </span>
                  </div>
                  <div className="w-24">
                    <Progress value={compPercentual} className="h-2" />
                  </div>
                </div>
              </button>

              {/* Metas da Competência */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {group.metas.map(meta => {
                    const isMetaExpanded = expandedMetas.has(meta.id);
                    const historico = (meta as any).historicoAcompanhamento || [];

                    return (
                      <div key={meta.id} className="border-b border-gray-50 last:border-b-0">
                        {/* Meta Header */}
                        <button
                          onClick={() => toggleMeta(meta.id)}
                          className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {getStatusIcon(meta.ultimoStatus || "")}
                            <div className="text-left">
                              <p className="text-sm font-medium text-gray-800">{meta.titulo}</p>
                              {meta.descricao && (
                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{meta.descricao}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-xs ${getStatusColor(meta.ultimoStatus || "")}`}>
                              {getStatusLabel(meta.ultimoStatus || "")}
                            </Badge>
                            {isMetaExpanded
                              ? <ChevronDown className="h-4 w-4 text-gray-400" />
                              : <ChevronRight className="h-4 w-4 text-gray-400" />
                            }
                          </div>
                        </button>

                        {/* Detalhes da Meta (expandido) */}
                        {isMetaExpanded && (
                          <div className="px-6 pb-4 bg-gray-50/30">
                            {/* Info da Meta */}
                            <div className="flex flex-wrap gap-4 mb-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Criada em {formatDate(meta.createdAt)}
                              </span>
                              {meta.ultimoMes && meta.ultimoAno && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Último registro: {meses[(meta.ultimoMes as number) - 1]} {meta.ultimoAno}
                                </span>
                              )}
                            </div>

                            {meta.descricao && (
                              <p className="text-sm text-gray-600 mb-3 bg-white p-3 rounded-lg border border-gray-100">
                                {meta.descricao}
                              </p>
                            )}

                            {/* Histórico de Acompanhamento */}
                            {historico.length > 0 ? (
                              <div>
                                <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  Histórico de Acompanhamento
                                </h4>
                                <div className="space-y-2">
                                  {historico.map((acomp: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-100">
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
              )}
            </Card>
          );
        })}
      </div>
    </AlunoLayout>
  );
}
