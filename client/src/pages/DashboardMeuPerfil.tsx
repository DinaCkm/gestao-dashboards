import { useMemo, useState } from "react";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  User, Target, Calendar, Award, TrendingUp, BookOpen, Users,
  CheckCircle2, XCircle, Clock, GraduationCap, Trophy, Star, Zap,
  Activity, Video, MessageSquare, Minus, Info, ChevronDown, ChevronUp, PartyPopper, Filter,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, PieChart, Pie,
} from "recharts";

function getClassificacaoColor(classificacao: string): string {
  switch (classificacao) {
    case "Excelência": return "text-emerald-400";
    case "Avançado": return "text-blue-400";
    case "Intermediário": return "text-yellow-400";
    case "Básico": return "text-orange-400";
    case "Inicial": return "text-red-400";
    default: return "text-gray-400";
  }
}

function getClassificacaoBadge(classificacao: string): string {
  switch (classificacao) {
    case "Excelência": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "Avançado": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "Intermediário": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "Básico": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "Inicial": return "bg-red-500/20 text-red-400 border-red-500/30";
    default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

function getPresencaIcon(presenca: string) {
  if (presenca === "presente") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  return <XCircle className="h-4 w-4 text-red-400" />;
}

function getTaskIcon(task: string) {
  if (task === "entregue") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (task === "nao_entregue") return <XCircle className="h-4 w-4 text-red-400" />;
  return <Minus className="h-4 w-4 text-gray-500" />;
}

function getEngajamentoStars(score: number | null) {
  if (!score) return <span className="text-gray-500 text-xs">—</span>;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= score ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`} />
      ))}
    </div>
  );
}

function getCicloStatusColor(status: string) {
  switch (status) {
    case "finalizado": return { bg: "bg-emerald-500", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    case "em_andamento": return { bg: "bg-blue-500", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    case "atrasado": return { bg: "bg-red-500", text: "text-red-400", badge: "bg-red-500/20 text-red-400 border-red-500/30" };
    case "futuro": return { bg: "bg-gray-500", text: "text-gray-400", badge: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
    default: return { bg: "bg-gray-500", text: "text-gray-400", badge: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
  }
}

function getCicloStatusLabel(status: string) {
  switch (status) {
    case "finalizado": return "Finalizado";
    case "em_andamento": return "Em Andamento";
    case "atrasado": return "Atrasado";
    case "futuro": return "Futuro";
    default: return status;
  }
}

// Competência visual no caminho - verde/vermelho/azul
function getCompetenciaCaminhoColor(concluida: boolean, cicloStatus: string) {
  if (concluida && cicloStatus === "em_andamento") return { cor: "#3b82f6", label: "Adiantado" }; // Azul - Excelência
  if (concluida) return { cor: "#10b981", label: "No prazo" }; // Verde
  if (cicloStatus === "finalizado" || cicloStatus === "atrasado") return { cor: "#ef4444", label: "Atrasado" }; // Vermelho
  return { cor: "#6b7280", label: "Pendente" }; // Cinza - futuro/em andamento
}

function IndicadorCardAluno({ 
  numero, icon: Icon, label, valor, total, percentual, color, regras 
}: {
  numero: number; icon: React.ElementType; label: string;
  valor: number | string; total: number | string; percentual: number;
  color: string; regras: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xs text-gray-400">Ind. {numero}: {label}</p>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-gray-300 transition-colors" title="Ver explicação">
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-lg font-bold text-white">{percentual.toFixed(0)}%</p>
        <Progress value={percentual} className="h-1.5 mb-1" />
        <p className="text-xs text-gray-500">{valor} de {total}</p>
        {expanded && (
          <div className="mt-2 p-2 bg-gray-900/50 rounded text-xs space-y-0.5">
            <p className="font-semibold text-gray-400">Como é calculado:</p>
            {regras.map((r, i) => <p key={i} className="text-gray-500">• {r}</p>)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardMeuPerfil() {
  const { data, isLoading } = trpc.indicadores.meuDashboard.useQuery();
  const [pdiStatusFilter, setPdiStatusFilter] = useState<"todos" | "ativo" | "congelado">("todos");

  const filteredAssessments = useMemo(() => {
    if (!data || !data.found || !data.assessments) return [];
    if (pdiStatusFilter === "todos") return data.assessments;
    return data.assessments.filter((a: any) => a.status === pdiStatusFilter);
  }, [data, pdiStatusFilter]);

  const radarData = useMemo(() => {
    if (!data || !data.found) return [];
    const ind = data.indicadores;
    return [
      { subject: "Mentorias", value: ind.participacaoMentorias, fullMark: 100 },
      { subject: "Atividades", value: ind.atividadesPraticas, fullMark: 100 },
      { subject: "Engajamento", value: ind.engajamento, fullMark: 100 },
      { subject: "Competências", value: ind.performanceCompetencias, fullMark: 100 },
      { subject: "Aprendizado", value: ind.performanceAprendizado || 0, fullMark: 100 },
      { subject: "Eventos", value: ind.participacaoEventos, fullMark: 100 },
    ];
  }, [data]);

  const competenciasChart = useMemo(() => {
    if (!data || !data.found || !data.planoIndividual) return [];
    return data.planoIndividual
      .filter((p: any) => p.notaAtual)
      .map((p: any) => ({
        nome: (p.competenciaNome || "").length > 20 ? (p.competenciaNome || "").substring(0, 20) + "..." : (p.competenciaNome || ""),
        nomeCompleto: p.competenciaNome || "",
        nota: parseFloat(p.notaAtual || "0"),
        meta: parseFloat(p.metaNota || "7"),
        aprovado: parseFloat(p.notaAtual || "0") >= parseFloat(p.metaNota || "7"),
      }));
  }, [data]);

  const trilhaStats = useMemo(() => {
    if (!data || !data.found || !data.planoIndividual) return { total: 0, concluidas: 0, emProgresso: 0, pendentes: 0 };
    const items = data.planoIndividual;
    return {
      total: items.length,
      concluidas: items.filter((i: any) => i.status === "concluida").length,
      emProgresso: items.filter((i: any) => i.status === "em_progresso").length,
      pendentes: items.filter((i: any) => i.status === "pendente").length,
    };
  }, [data]);

  const pieData = useMemo(() => {
    if (!trilhaStats.total) return [];
    return [
      { name: "Concluídas", value: trilhaStats.concluidas, color: "#10b981" },
      { name: "Em Progresso", value: trilhaStats.emProgresso, color: "#3b82f6" },
      { name: "Pendentes", value: trilhaStats.pendentes, color: "#6b7280" },
    ].filter(d => d.value > 0);
  }, [trilhaStats]);

  if (isLoading) {
    return (
      <AlunoLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AlunoLayout>
    );
  }

  if (!data || !data.found) {
    return (
      <AlunoLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <User className="h-16 w-16 text-gray-500" />
          <h2 className="text-xl font-semibold text-gray-300">Perfil não encontrado</h2>
          <p className="text-gray-500 text-center max-w-md">
            {data && !data.found ? data.message : "Não foi possível carregar seus dados. Entre em contato com o administrador."}
          </p>
        </div>
      </AlunoLayout>
    );
  }

  const { aluno, indicadores, ranking, sessoes, eventos, planoIndividual, assessments } = data;
  const performanceGeral = indicadores.performanceGeral ?? (indicadores.notaFinal * 10);
  const ciclosFinalizados = indicadores.ciclosFinalizados || [];
  const ciclosEmAndamento = indicadores.ciclosEmAndamento || [];
  const engComp = indicadores.engajamentoComponentes || { presenca: indicadores.participacaoMentorias, atividades: indicadores.atividadesPraticas, notaMentora: indicadores.engajamento };

  return (
    <AlunoLayout>
      <div className="space-y-6">
        {/* Header com informações do aluno */}
        <div className="flex flex-col lg:flex-row gap-6">
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 flex-1">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">{aluno.name}</h1>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-blue-400 border-blue-500/30 bg-blue-500/10">
                      <GraduationCap className="h-3 w-3 mr-1" />{aluno.programa}
                    </Badge>
                    <Badge variant="outline" className="text-purple-400 border-purple-500/30 bg-purple-500/10">
                      <Users className="h-3 w-3 mr-1" />{aluno.turma}
                    </Badge>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                      <Target className="h-3 w-3 mr-1" />Trilha: {aluno.trilha}
                    </Badge>
                    <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10">
                      <Clock className="h-3 w-3 mr-1" />Ciclo: {aluno.cicloAtual}
                    </Badge>
                    <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 bg-cyan-500/10">
                      <User className="h-3 w-3 mr-1" />Mentor: {aluno.mentor}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Performance Geral</p>
                  <div className={`text-4xl font-black ${getClassificacaoColor(indicadores.classificacao)}`}>
                    {performanceGeral.toFixed(0)}%
                  </div>
                  <Badge className={`mt-1 ${getClassificacaoBadge(indicadores.classificacao)}`}>
                    {indicadores.classificacao}
                  </Badge>
                </div>
              </div>
              {ranking && ranking.posicao > 0 && (
                <div className="flex items-center gap-3 mt-4 p-3 rounded-lg bg-gray-700/50">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <div>
                    <span className="text-white font-semibold">{ranking.posicao}º lugar</span>
                    <span className="text-gray-400 text-sm ml-2">de {ranking.totalAlunos} alunos na empresa</span>
                  </div>
                </div>
              )}
              {/* Explicação da Performance Geral */}
              <div className="mt-3 p-3 rounded-lg bg-gray-700/30 text-xs text-gray-400">
                <p className="font-semibold mb-1">Ind. 7 — Performance Geral:</p>
                <p>Média dos 6 indicadores: ({indicadores.participacaoMentorias.toFixed(0)} + {indicadores.atividadesPraticas.toFixed(0)} + {indicadores.engajamento.toFixed(0)} + {indicadores.performanceCompetencias.toFixed(0)} + {(indicadores.performanceAprendizado || 0).toFixed(0)} + {indicadores.participacaoEventos.toFixed(0)}) / 6 = <span className="text-white font-bold">{performanceGeral.toFixed(0)}%</span></p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 w-full lg:w-80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Radar de Performance (6 Indicadores)</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} isAnimationActive={false} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 6 Indicadores individuais com explicações */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <IndicadorCardAluno
            numero={1} icon={MessageSquare} label="Mentorias"
            valor={indicadores.mentoriasPresente} total={indicadores.totalMentorias}
            percentual={indicadores.participacaoMentorias}
            color="bg-blue-500/20 text-blue-400"
            regras={["(Sessões presentes / Total sessões) × 100", "Presente = 100%, Ausente = 0%"]}
          />
          <IndicadorCardAluno
            numero={2} icon={Zap} label="Atividades"
            valor={indicadores.atividadesEntregues} total={indicadores.totalAtividades}
            percentual={indicadores.atividadesPraticas}
            color="bg-purple-500/20 text-purple-400"
            regras={["(Atividades entregues / Total) × 100", "1ª mentoria (Assessment) excluída", "Sessões sem tarefa não contam"]}
          />
          <IndicadorCardAluno
            numero={3} icon={Activity} label="Engajamento"
            valor={`${indicadores.engajamento.toFixed(0)}%`} total="100%"
            percentual={indicadores.engajamento}
            color="bg-cyan-500/20 text-cyan-400"
            regras={[
              "Média de 3 componentes, todos convertidos para base 100:",
              `1) Presença nas Mentorias: ${engComp.presenca?.toFixed(0) || 0}% (presente=100, ausente=0)`,
              `2) Entrega de Tarefas: ${engComp.atividades?.toFixed(0) || 0}% (entregue=100, não entregue=0)`,
              `3) Nota Evolução da Mentora (0-10 → nota/10 × 100): ${engComp.notaMentora?.toFixed(0) || 0}%`,
              "Fórmula: (Comp.1 + Comp.2 + Comp.3) / 3"
            ]}
          />
          <IndicadorCardAluno
            numero={4} icon={BookOpen} label="Competências"
            valor={indicadores.competenciasAprovadas} total={indicadores.totalCompetencias}
            percentual={indicadores.performanceCompetencias}
            color="bg-emerald-500/20 text-emerald-400"
            regras={["% de conteúdos concluídos por competência (aulas, filmes, livros, podcasts, vídeos)", "Somente ciclos finalizados entram", `${ciclosFinalizados.length} ciclo(s) finalizado(s)`]}
          />
          <IndicadorCardAluno
            numero={5} icon={GraduationCap} label="Aprendizado"
            valor={`${(indicadores.performanceAprendizado || 0).toFixed(0)}%`} total="100%"
            percentual={indicadores.performanceAprendizado || 0}
            color="bg-red-500/20 text-red-400"
            regras={["Média das notas das provas por aula", "Somente ciclos finalizados entram", "Notas convertidas para % (base 100)"]}
          />
          <IndicadorCardAluno
            numero={6} icon={Video} label="Eventos"
            valor={indicadores.eventosPresente} total={indicadores.totalEventos}
            percentual={indicadores.participacaoEventos}
            color="bg-orange-500/20 text-orange-400"
            regras={["(Eventos presentes / Total eventos) × 100", "Inclui webinários e encontros coletivos"]}
          />
        </div>

        {/* Visualização de Ciclos (se existirem) */}
        {(ciclosFinalizados.length > 0 || ciclosEmAndamento.length > 0) && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Caminho de Realização das Competências
              </CardTitle>
              <CardDescription className="text-gray-500">
                Progresso nos ciclos de competências • <span className="text-emerald-400">Verde = No prazo</span> • <span className="text-red-400">Vermelho = Atrasado</span> • <span className="text-blue-400">Azul = Adiantado</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...ciclosFinalizados, ...ciclosEmAndamento].map((ciclo: any, idx: number) => {
                  const statusColors = getCicloStatusColor(ciclo.status);
                  return (
                    <div key={ciclo.cicloId || idx} className="p-4 rounded-lg bg-gray-700/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${statusColors.bg}`} />
                          <span className="text-white font-medium text-sm">{ciclo.nomeCiclo}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">
                            {new Date(ciclo.dataInicio).toLocaleDateString("pt-BR")} — {new Date(ciclo.dataFim).toLocaleDateString("pt-BR")}
                          </span>
                          <Badge variant="outline" className={statusColors.badge}>
                            {getCicloStatusLabel(ciclo.status)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Progress value={ciclo.percentualConclusao} className="h-2 flex-1" />
                        <span className="text-xs text-gray-300 font-semibold w-12 text-right">{ciclo.percentualConclusao.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{ciclo.competenciasConcluidas} de {ciclo.totalCompetencias} competências concluídas</span>
                        {ciclo.mediaNotasProvas > 0 && (
                          <span>Média provas: {ciclo.mediaNotasProvas.toFixed(0)}%</span>
                        )}
                      </div>
                      {ciclo.status === "finalizado" && (
                        <p className="text-xs text-emerald-500 mt-1">Este ciclo entra no cálculo da Performance Geral</p>
                      )}
                      {ciclo.status === "em_andamento" && (
                        <p className="text-xs text-blue-500 mt-1">Ciclo em andamento — não entra na Performance Geral ainda</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs com seções detalhadas */}
        <Tabs defaultValue="trilha" className="w-full">
          <TabsList className="bg-gray-800 border-gray-700 w-full flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="trilha" className="flex-1 min-w-[120px] data-[state=active]:bg-blue-600">
              <Target className="h-4 w-4 mr-1" /> Trilha
            </TabsTrigger>
            <TabsTrigger value="competencias" className="flex-1 min-w-[120px] data-[state=active]:bg-blue-600">
              <BookOpen className="h-4 w-4 mr-1" /> Competências
            </TabsTrigger>
            <TabsTrigger value="mentorias" className="flex-1 min-w-[120px] data-[state=active]:bg-blue-600">
              <MessageSquare className="h-4 w-4 mr-1" /> Mentorias
            </TabsTrigger>
            <TabsTrigger value="eventos" className="flex-1 min-w-[120px] data-[state=active]:bg-blue-600">
              <Video className="h-4 w-4 mr-1" /> Eventos
            </TabsTrigger>
            <TabsTrigger value="pdi" className="flex-1 min-w-[120px] data-[state=active]:bg-blue-600">
              <Award className="h-4 w-4 mr-1" /> PDI
            </TabsTrigger>
          </TabsList>

          {/* === TRILHA DE DESENVOLVIMENTO === */}
          <TabsContent value="trilha" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-300">Progresso da Trilha</CardTitle>
                  <CardDescription className="text-gray-500">{trilhaStats.total} competências no plano</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center mb-4">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" isAnimationActive={false}>
                          {pieData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span>Concluídas</span>
                      <span className="text-white font-semibold">{trilhaStats.concluidas}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span>Em Progresso</span>
                      <span className="text-white font-semibold">{trilhaStats.emProgresso}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-500"></span>Pendentes</span>
                      <span className="text-white font-semibold">{trilhaStats.pendentes}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-300">Competências do Plano Individual</CardTitle>
                  <CardDescription className="text-gray-500">Competências definidas para sua jornada de desenvolvimento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {planoIndividual && planoIndividual.length > 0 ? (
                      planoIndividual.map((item: any, idx: number) => {
                        const nota = item.notaAtual ? parseFloat(item.notaAtual) : 0;
                        const meta = item.metaNota ? parseFloat(item.metaNota) : 7;
                        const aprovado = nota >= meta;
                        const statusColor = item.status === "concluida" ? "text-emerald-400" : item.status === "em_progresso" ? "text-blue-400" : "text-gray-500";
                        const statusLabel = item.status === "concluida" ? "Concluída" : item.status === "em_progresso" ? "Em Progresso" : "Pendente";
                        return (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                            <div className="flex-shrink-0">
                              {item.status === "concluida" ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> :
                                item.status === "em_progresso" ? <Clock className="h-5 w-5 text-blue-400" /> :
                                <Target className="h-5 w-5 text-gray-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium truncate">{item.competenciaNome}</p>
                              <p className="text-xs text-gray-500">{item.trilhaNome || "Trilha não definida"}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className={`text-sm font-bold ${aprovado ? "text-emerald-400" : nota > 0 ? "text-yellow-400" : "text-gray-500"}`}>
                                  {nota > 0 ? nota.toFixed(1) : "—"}
                                </p>
                                <p className="text-xs text-gray-500">Meta: {meta.toFixed(0)}</p>
                              </div>
                              <Badge variant="outline" className={`text-xs ${statusColor} border-current/30`}>{statusLabel}</Badge>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma competência definida no plano individual</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === JORNADA DE COMPETÊNCIAS === */}
          <TabsContent value="competencias" className="mt-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm text-gray-300">Notas por Competência</CardTitle>
                <CardDescription className="text-gray-500">Desempenho em cada competência cursada na jornada</CardDescription>
              </CardHeader>
              <CardContent>
                {competenciasChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(300, competenciasChart.length * 40)}>
                    <BarChart data={competenciasChart} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" domain={[0, 10]} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                      <YAxis type="category" dataKey="nome" width={150} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                        labelStyle={{ color: "#fff" }}
                        formatter={(value: number, name: string) => [value.toFixed(1), name === "nota" ? "Nota" : "Meta"]}
                        labelFormatter={(label: string, payload: any[]) => payload?.[0]?.payload?.nomeCompleto || label}
                      />
                      <Bar dataKey="nota" name="Nota" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                        {competenciasChart.map((entry: any, index: number) => (
                          <Cell key={index} fill={entry.aprovado ? "#10b981" : "#f59e0b"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma nota de competência registrada ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === HISTÓRICO DE MENTORIAS === */}
          <TabsContent value="mentorias" className="mt-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm text-gray-300">Histórico de Sessões de Mentoria</CardTitle>
                <CardDescription className="text-gray-500">
                  {sessoes.length} sessões registradas • {indicadores.mentoriasPresente} presenças • {indicadores.atividadesEntregues} atividades entregues
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessoes && sessoes.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {sessoes.map((sessao: any, idx: number) => (
                      <div key={sessao.id || idx} className="p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">
                              {sessao.sessionNumber || idx + 1}
                            </div>
                            <div>
                              <p className="text-sm text-white font-medium">
                                Sessão {sessao.sessionNumber || idx + 1}
                                {sessao.sessionNumber === 1 && <Badge variant="outline" className="ml-2 text-xs text-yellow-400 border-yellow-500/30">Assessment</Badge>}
                                {sessao.ciclo && <span className="text-gray-500 ml-2">• Ciclo {sessao.ciclo}</span>}
                              </p>
                              <p className="text-xs text-gray-500">
                                {sessao.sessionDate ? new Date(sessao.sessionDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "Data não registrada"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5" title="Presença">
                              {getPresencaIcon(sessao.presence)}
                              <span className="text-xs text-gray-400">{sessao.presence === "presente" ? "Presente" : "Ausente"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 ml-11 text-xs">
                          <div className="flex items-center gap-1.5" title="Atividade">
                            {getTaskIcon(sessao.taskStatus)}
                            <span className="text-gray-400">
                              {sessao.sessionNumber === 1 ? "Assessment (sem tarefa)" :
                                sessao.taskStatus === "entregue" ? "Atividade entregue" :
                                sessao.taskStatus === "nao_entregue" ? "Atividade não entregue" : "Sem tarefa"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5" title="Engajamento">
                            {getEngajamentoStars(sessao.engagementScore)}
                          </div>
                          {sessao.notaEvolucao && (
                            <div className="flex items-center gap-1 text-gray-400">
                              <TrendingUp className="h-3.5 w-3.5" />Evolução: {sessao.notaEvolucao}
                            </div>
                          )}
                        </div>
                        {sessao.feedback && (
                          <div className="mt-2 ml-11 p-2 rounded bg-gray-800/50 text-xs text-gray-400 italic">"{sessao.feedback}"</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma sessão de mentoria registrada ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === PARTICIPAÇÃO EM EVENTOS === */}
          <TabsContent value="eventos" className="mt-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm text-gray-300">Participação em Eventos e Webinars</CardTitle>
                <CardDescription className="text-gray-500">{indicadores.eventosPresente} presenças de {indicadores.totalEventos} eventos</CardDescription>
              </CardHeader>
              <CardContent>
                {eventos && eventos.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {eventos.map((evento: any, idx: number) => (
                      <div key={evento.id || idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                        <div className="flex-shrink-0">
                          <Video className={`h-5 w-5 ${evento.status === "presente" ? "text-emerald-400" : "text-red-400"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium">{evento.titulo}</p>
                          <p className="text-xs text-gray-500">
                            {evento.tipo === "webinar" ? "Webinar" : evento.tipo === "workshop" ? "Workshop" : "Evento"}
                            {evento.data && (<> • {new Date(evento.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</>)}
                          </p>
                        </div>
                        <Badge variant="outline" className={evento.status === "presente" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-red-400 border-red-500/30 bg-red-500/10"}>
                          {evento.status === "presente" ? "Presente" : "Ausente"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum evento registrado ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === PDI / ASSESSMENT === */}
          <TabsContent value="pdi" className="mt-4">
            {assessments && assessments.length > 0 ? (
              <div className="space-y-4">
                {/* Filtro por status */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-400 mr-1">Filtrar:</span>
                  {(["todos", "ativo", "congelado"] as const).map((status) => {
                    const count = status === "todos"
                      ? assessments.length
                      : assessments.filter((a: any) => a.status === status).length;
                    const isActive = pdiStatusFilter === status;
                    const colorMap = {
                      todos: isActive ? "bg-blue-600 text-white border-blue-500" : "bg-gray-800/50 text-gray-400 border-gray-600 hover:bg-gray-700/50",
                      ativo: isActive ? "bg-emerald-600 text-white border-emerald-500" : "bg-gray-800/50 text-gray-400 border-gray-600 hover:bg-gray-700/50",
                      congelado: isActive ? "bg-gray-500 text-white border-gray-400" : "bg-gray-800/50 text-gray-400 border-gray-600 hover:bg-gray-700/50",
                    };
                    const labelMap = { todos: "Todos", ativo: "Ativos", congelado: "Congelados" };
                    return (
                      <button
                        key={status}
                        onClick={() => setPdiStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${colorMap[status]}`}
                      >
                        {labelMap[status]} ({count})
                      </button>
                    );
                  })}
                </div>

                {filteredAssessments.length === 0 ? (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="py-8">
                      <div className="text-center text-gray-500">
                        <Filter className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhum PDI com status "{pdiStatusFilter === "ativo" ? "Ativo" : "Congelado"}"</p>
                        <button onClick={() => setPdiStatusFilter("todos")} className="text-blue-400 hover:text-blue-300 text-xs mt-2 underline">Ver todos</button>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {filteredAssessments.map((assessment: any) => (
                  <Card key={assessment.id} className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                            <Award className="h-4 w-4 text-amber-400" />
                            Trilha: {assessment.trilhaNome}
                          </CardTitle>
                          <CardDescription className="text-gray-500">
                            {assessment.consultorNome && `Mentora: ${assessment.consultorNome} • `}
                            Macro ciclo: {new Date(assessment.macroInicio).toLocaleDateString("pt-BR")} a {new Date(assessment.macroTermino).toLocaleDateString("pt-BR")}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={assessment.status === "ativo" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-gray-400 border-gray-500/30 bg-gray-500/10"}>
                          {assessment.status === "ativo" ? "Ativo" : "Congelado"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-3 flex items-center gap-4 text-xs text-gray-400">
                        <span>{assessment.totalCompetencias} competências</span>
                        <span>{assessment.obrigatorias} obrigatórias</span>
                        <span>{assessment.opcionais} opcionais</span>
                      </div>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {assessment.competencias.map((comp: any) => {
                          const notaCorte = parseFloat(comp.notaCorte);
                          const notaAtual = comp.notaAtual;
                          const atingiu = comp.atingiuMeta;
                          return (
                            <div key={comp.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                              <div className="flex-shrink-0">
                                {atingiu ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                ) : notaAtual !== null && notaAtual > 0 ? (
                                  <Clock className="h-5 w-5 text-yellow-400" />
                                ) : (
                                  <Target className="h-5 w-5 text-gray-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium truncate">{comp.competenciaNome}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Badge variant="outline" className={comp.peso === 'obrigatoria' ? "text-amber-400 border-amber-500/30" : "text-gray-400 border-gray-500/30"}>
                                    {comp.peso === 'obrigatoria' ? 'Obrigatória' : 'Opcional'}
                                  </Badge>
                                  {comp.microInicio && comp.microTermino && (
                                    <span>Micro: {new Date(comp.microInicio).toLocaleDateString("pt-BR")} a {new Date(comp.microTermino).toLocaleDateString("pt-BR")}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className={`text-sm font-bold ${atingiu ? "text-emerald-400" : notaAtual !== null && notaAtual > 0 ? "text-yellow-400" : "text-gray-500"}`}>
                                    {notaAtual !== null && notaAtual > 0 ? notaAtual.toFixed(1) : "—"}
                                  </p>
                                  <p className="text-xs text-gray-500">Corte: {notaCorte.toFixed(1)}</p>
                                </div>
                                <div className="w-16">
                                  <Progress value={notaAtual !== null ? Math.min((notaAtual / 10) * 100, 100) : 0} className="h-1.5" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {assessment.observacoes && (
                        <div className="mt-3 p-3 rounded-lg bg-gray-900/50 text-xs text-gray-400">
                          <p className="font-semibold mb-1">Observações:</p>
                          <p>{assessment.observacoes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="py-12">
                  <div className="text-center text-gray-500">
                    <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum PDI/Assessment registrado ainda</p>
                    <p className="text-xs mt-1">O PDI será criado pela sua mentora durante o assessment</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AlunoLayout>
  );
}
