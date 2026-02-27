import { useMemo, useState } from "react";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  User, Target, Calendar, Award, TrendingUp, BookOpen, Users,
  CheckCircle2, XCircle, Clock, GraduationCap, Trophy, Star, Zap,
  Activity, Video, MessageSquare, Minus, Info, ChevronDown, ChevronUp, PartyPopper, Filter,
  ClipboardCheck, Play, ExternalLink, FileText, Send,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, PieChart, Pie,
} from "recharts";

function getClassificacaoColor(classificacao: string): string {
  switch (classificacao) {
    case "Excelência": return "text-emerald-600";
    case "Avançado": return "text-blue-600";
    case "Intermediário": return "text-yellow-600";
    case "Básico": return "text-orange-600";
    case "Inicial": return "text-red-600";
    default: return "text-gray-600";
  }
}

function getClassificacaoBadge(classificacao: string): string {
  switch (classificacao) {
    case "Excelência": return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "Avançado": return "bg-blue-100 text-blue-700 border-blue-300";
    case "Intermediário": return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "Básico": return "bg-orange-100 text-orange-700 border-orange-300";
    case "Inicial": return "bg-red-100 text-red-700 border-red-300";
    default: return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

function getPresencaIcon(presenca: string) {
  if (presenca === "presente") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

function getTaskIcon(task: string) {
  if (task === "entregue") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (task === "nao_entregue") return <XCircle className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

function getEngajamentoStars(score: number | null) {
  if (!score) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= score ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
      ))}
    </div>
  );
}

function getCicloStatusColor(status: string) {
  switch (status) {
    case "finalizado": return { bg: "bg-emerald-500", text: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700 border-emerald-300" };
    case "em_andamento": return { bg: "bg-blue-500", text: "text-blue-600", badge: "bg-blue-100 text-blue-700 border-blue-300" };
    case "atrasado": return { bg: "bg-red-500", text: "text-red-600", badge: "bg-red-100 text-red-700 border-red-300" };
    case "futuro": return { bg: "bg-gray-400", text: "text-gray-500", badge: "bg-gray-100 text-gray-600 border-gray-300" };
    default: return { bg: "bg-gray-400", text: "text-gray-500", badge: "bg-gray-100 text-gray-600 border-gray-300" };
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

function IndicadorCardAluno({ 
  numero, icon: Icon, label, valor, total, percentual, color, borderColor, regras 
}: {
  numero: number; icon: React.ElementType; label: string;
  valor: number | string; total: number | string; percentual: number;
  color: string; borderColor: string; regras: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className={`bg-white border ${borderColor} shadow-sm hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xs text-gray-500 font-medium">Ind. {numero}: {label}</p>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 transition-colors" title="Ver explicação">
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-lg font-bold text-gray-900">{percentual.toFixed(0)}%</p>
        <Progress value={percentual} className="h-1.5 mb-1" />
        <p className="text-xs text-gray-500">{valor} de {total}</p>
        {expanded && (
          <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-100 text-xs space-y-0.5">
            <p className="font-semibold text-gray-600">Como é calculado:</p>
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

  // Queries para as novas abas
  const { data: myTasks } = trpc.attendance.myTasks.useQuery();
  const { data: upcomingWebinars } = trpc.webinars.upcoming.useQuery();
  const { data: pastWebinars } = trpc.webinars.past.useQuery();
  const { data: myAttendance } = trpc.attendance.myAttendance.useQuery();
  const { data: pendingWebinars } = trpc.attendance.pending.useQuery();

  // State para relato de tarefa
  const [relatoText, setRelatoText] = useState<Record<number, string>>({});
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  // State para reflexão de webinar
  const [reflexaoText, setReflexaoText] = useState<Record<number, string>>({});
  const [expandedWebinar, setExpandedWebinar] = useState<number | null>(null);

  // Mutations
  const utils = trpc.useUtils();
  const submitRelato = trpc.mentor.submitRelato.useMutation({
    onSuccess: () => {
      utils.attendance.myTasks.invalidate();
      setExpandedTask(null);
    },
  });
  const markPresence = trpc.attendance.markPresence.useMutation({
    onSuccess: () => {
      utils.attendance.myAttendance.invalidate();
      utils.attendance.pending.invalidate();
      setExpandedWebinar(null);
    },
  });

  // Set de eventIds já confirmados
  const confirmedEventIds = useMemo(() => {
    return new Set((myAttendance || []).map((a: any) => a.eventId));
  }, [myAttendance]);

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
      { name: "Pendentes", value: trilhaStats.pendentes, color: "#d1d5db" },
    ].filter(d => d.value > 0);
  }, [trilhaStats]);

  if (isLoading) {
    return (
      <AlunoLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A1E3E]"></div>
        </div>
      </AlunoLayout>
    );
  }

  if (!data || !data.found) {
    return (
      <AlunoLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <User className="h-16 w-16 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-700">Perfil não encontrado</h2>
          <p className="text-gray-500 text-center max-w-md">
            {data && !data.found ? data.message : "Nenhum perfil de aluno vinculado a esta conta."}
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
          <Card className="bg-gradient-to-br from-[#0A1E3E] to-[#132d54] border-0 text-white flex-1 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{aluno.name}</h1>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className="bg-white/20 text-white border-white/30">
                      <GraduationCap className="h-3 w-3 mr-1" />{aluno.programa}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30">
                      <Users className="h-3 w-3 mr-1" />{aluno.turma}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30">
                      <Target className="h-3 w-3 mr-1" />Trilha: {aluno.trilha}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30">
                      <Clock className="h-3 w-3 mr-1" />Ciclo: {aluno.cicloAtual}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30">
                      <User className="h-3 w-3 mr-1" />Mentor: {aluno.mentor}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/70 mb-1">Performance Geral</p>
                  <div className="text-4xl font-black text-[#F5991F]">
                    {performanceGeral.toFixed(0)}%
                  </div>
                  <Badge className={`mt-1 ${getClassificacaoBadge(indicadores.classificacao)}`}>
                    {indicadores.classificacao}
                  </Badge>
                </div>
              </div>
              {ranking && ranking.posicao > 0 && (
                <div className="flex items-center gap-3 mt-4 p-3 rounded-lg bg-white/10">
                  <Trophy className="h-5 w-5 text-[#F5991F]" />
                  <div>
                    <span className="text-white font-semibold">{ranking.posicao}º lugar</span>
                    <span className="text-white/70 text-sm ml-2">de {ranking.totalAlunos} alunos na empresa</span>
                  </div>
                </div>
              )}
              {/* Explicação da Performance Geral */}
              <div className="mt-3 p-3 rounded-lg bg-white/10 text-xs text-white/70">
                <p className="font-semibold mb-1 text-white/90">Ind. 7 — Performance Geral:</p>
                <p>Média dos 6 indicadores: ({indicadores.participacaoMentorias.toFixed(0)} + {indicadores.atividadesPraticas.toFixed(0)} + {indicadores.engajamento.toFixed(0)} + {indicadores.performanceCompetencias.toFixed(0)} + {(indicadores.performanceAprendizado || 0).toFixed(0)} + {indicadores.participacaoEventos.toFixed(0)}) / 6 = <span className="text-[#F5991F] font-bold">{performanceGeral.toFixed(0)}%</span></p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm w-full lg:w-80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Radar de Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#374151", fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="#0A1E3E" fill="#0A1E3E" fillOpacity={0.2} isAnimationActive={false} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 6 Indicadores individuais */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <IndicadorCardAluno
            numero={1} icon={MessageSquare} label="Mentorias"
            valor={indicadores.mentoriasPresente} total={indicadores.totalMentorias}
            percentual={indicadores.participacaoMentorias}
            color="bg-blue-100 text-blue-600" borderColor="border-blue-200"
            regras={["(Sessões presentes / Total sessões) × 100", "Presente = 100%, Ausente = 0%"]}
          />
          <IndicadorCardAluno
            numero={2} icon={Zap} label="Atividades"
            valor={indicadores.atividadesEntregues} total={indicadores.totalAtividades}
            percentual={indicadores.atividadesPraticas}
            color="bg-purple-100 text-purple-600" borderColor="border-purple-200"
            regras={["(Atividades entregues / Total) × 100", "1ª mentoria (Assessment) excluída", "Sessões sem tarefa não contam"]}
          />
          <IndicadorCardAluno
            numero={3} icon={Activity} label="Engajamento"
            valor={`${indicadores.engajamento.toFixed(0)}%`} total="100%"
            percentual={indicadores.engajamento}
            color="bg-cyan-100 text-cyan-600" borderColor="border-cyan-200"
            regras={[
              "Média de 3 componentes, todos convertidos para base 100:",
              `1) Presença nas Mentorias: ${engComp.presenca?.toFixed(0) || 0}%`,
              `2) Entrega de Tarefas: ${engComp.atividades?.toFixed(0) || 0}%`,
              `3) Nota Evolução da Mentora: ${engComp.notaMentora?.toFixed(0) || 0}%`,
              "Fórmula: (Comp.1 + Comp.2 + Comp.3) / 3"
            ]}
          />
          <IndicadorCardAluno
            numero={4} icon={BookOpen} label="Competências"
            valor={indicadores.competenciasAprovadas} total={indicadores.totalCompetencias}
            percentual={indicadores.performanceCompetencias}
            color="bg-emerald-100 text-emerald-600" borderColor="border-emerald-200"
            regras={["% de conteúdos concluídos por competência", "Somente ciclos finalizados entram", `${ciclosFinalizados.length} ciclo(s) finalizado(s)`]}
          />
          <IndicadorCardAluno
            numero={5} icon={GraduationCap} label="Aprendizado"
            valor={`${(indicadores.performanceAprendizado || 0).toFixed(0)}%`} total="100%"
            percentual={indicadores.performanceAprendizado || 0}
            color="bg-red-100 text-red-600" borderColor="border-red-200"
            regras={["Média das notas das provas por aula", "Somente ciclos finalizados entram", "Notas convertidas para % (base 100)"]}
          />
          <IndicadorCardAluno
            numero={6} icon={Video} label="Eventos"
            valor={indicadores.eventosPresente} total={indicadores.totalEventos}
            percentual={indicadores.participacaoEventos}
            color="bg-orange-100 text-orange-600" borderColor="border-orange-200"
            regras={["(Eventos presentes / Total eventos) × 100", "Inclui webinários e encontros coletivos"]}
          />
        </div>

        {/* Visualização de Ciclos */}
        {(ciclosFinalizados.length > 0 || ciclosEmAndamento.length > 0) && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
                <Target className="h-4 w-4 text-[#0A1E3E]" />
                Caminho de Realização das Competências
              </CardTitle>
              <CardDescription className="text-gray-500">
                Progresso nos ciclos • <span className="text-emerald-600">Verde = No prazo</span> • <span className="text-red-600">Vermelho = Atrasado</span> • <span className="text-blue-600">Azul = Adiantado</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...ciclosFinalizados, ...ciclosEmAndamento].map((ciclo: any, idx: number) => {
                  const statusColors = getCicloStatusColor(ciclo.status);
                  return (
                    <div key={ciclo.cicloId || idx} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${statusColors.bg}`} />
                          <span className="text-gray-900 font-medium text-sm">{ciclo.nomeCiclo}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">
                            {new Date(ciclo.dataInicio).toLocaleDateString("pt-BR")} — {new Date(ciclo.dataFim).toLocaleDateString("pt-BR")}
                          </span>
                          <Badge variant="outline" className={statusColors.badge}>
                            {getCicloStatusLabel(ciclo.status)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Progress value={ciclo.percentualConclusao} className="h-2 flex-1" />
                        <span className="text-xs text-gray-700 font-semibold w-12 text-right">{ciclo.percentualConclusao.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{ciclo.competenciasConcluidas} de {ciclo.totalCompetencias} competências concluídas</span>
                        {ciclo.mediaNotasProvas > 0 && (
                          <span>Média provas: {ciclo.mediaNotasProvas.toFixed(0)}%</span>
                        )}
                      </div>
                      {ciclo.status === "finalizado" && (
                        <p className="text-xs text-emerald-600 mt-1">Este ciclo entra no cálculo da Performance Geral</p>
                      )}
                      {ciclo.status === "em_andamento" && (
                        <p className="text-xs text-blue-600 mt-1">Ciclo em andamento — não entra na Performance Geral ainda</p>
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
          <TabsList className="bg-gray-100 border border-gray-200 w-full flex flex-wrap h-auto gap-1 p-1 rounded-xl">
            <TabsTrigger value="trilha" className="flex-1 min-w-[120px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-gray-600">
              <Target className="h-4 w-4 mr-1" /> Trilha
            </TabsTrigger>
            <TabsTrigger value="competencias" className="flex-1 min-w-[120px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-gray-600">
              <BookOpen className="h-4 w-4 mr-1" /> Competências
            </TabsTrigger>
            <TabsTrigger value="mentorias" className="flex-1 min-w-[120px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-gray-600">
              <MessageSquare className="h-4 w-4 mr-1" /> Mentorias
            </TabsTrigger>
            <TabsTrigger value="eventos" className="flex-1 min-w-[120px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-gray-600">
              <Video className="h-4 w-4 mr-1" /> Eventos
            </TabsTrigger>
            <TabsTrigger value="pdi" className="flex-1 min-w-[120px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-gray-600">
              <Award className="h-4 w-4 mr-1" /> PDI
            </TabsTrigger>
            <TabsTrigger value="tarefas" className="flex-1 min-w-[120px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-gray-600">
              <ClipboardCheck className="h-4 w-4 mr-1" /> Tarefas
            </TabsTrigger>
            <TabsTrigger value="webinarios" className="flex-1 min-w-[120px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-gray-600">
              <Play className="h-4 w-4 mr-1" /> Webinários
            </TabsTrigger>
            <TabsTrigger value="cursos" className="flex-1 min-w-[120px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-gray-600">
              <GraduationCap className="h-4 w-4 mr-1" /> Cursos
            </TabsTrigger>
          </TabsList>

          {/* === TRILHA DE DESENVOLVIMENTO === */}
          <TabsContent value="trilha" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-700">Progresso da Trilha</CardTitle>
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
                      <span className="flex items-center gap-2 text-gray-600"><span className="w-3 h-3 rounded-full bg-emerald-500"></span>Concluídas</span>
                      <span className="text-gray-900 font-semibold">{trilhaStats.concluidas}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-600"><span className="w-3 h-3 rounded-full bg-blue-500"></span>Em Progresso</span>
                      <span className="text-gray-900 font-semibold">{trilhaStats.emProgresso}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-600"><span className="w-3 h-3 rounded-full bg-gray-300"></span>Pendentes</span>
                      <span className="text-gray-900 font-semibold">{trilhaStats.pendentes}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-700">Competências do Plano Individual</CardTitle>
                  <CardDescription className="text-gray-500">Competências definidas para sua jornada de desenvolvimento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {planoIndividual && planoIndividual.length > 0 ? (
                      planoIndividual.map((item: any, idx: number) => {
                        const nota = item.notaAtual ? parseFloat(item.notaAtual) : 0;
                        const meta = item.metaNota ? parseFloat(item.metaNota) : 7;
                        const aprovado = nota >= meta;
                        const statusColor = item.status === "concluida" ? "text-emerald-600" : item.status === "em_progresso" ? "text-blue-600" : "text-gray-500";
                        const statusLabel = item.status === "concluida" ? "Concluída" : item.status === "em_progresso" ? "Em Progresso" : "Pendente";
                        return (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                            <div className="flex-shrink-0">
                              {item.status === "concluida" ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> :
                                item.status === "em_progresso" ? <Clock className="h-5 w-5 text-blue-500" /> :
                                <Target className="h-5 w-5 text-gray-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 font-medium truncate">{item.competenciaNome}</p>
                              <p className="text-xs text-gray-500">{item.trilhaNome || "Trilha não definida"}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className={`text-sm font-bold ${aprovado ? "text-emerald-600" : nota > 0 ? "text-amber-600" : "text-gray-400"}`}>
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
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-gray-700">Notas por Competência</CardTitle>
                <CardDescription className="text-gray-500">Desempenho em cada competência cursada na jornada</CardDescription>
              </CardHeader>
              <CardContent>
                {competenciasChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(300, competenciasChart.length * 40)}>
                    <BarChart data={competenciasChart} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" domain={[0, 10]} tick={{ fill: "#374151", fontSize: 11 }} />
                      <YAxis type="category" dataKey="nome" width={150} tick={{ fill: "#374151", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}
                        labelStyle={{ color: "#111" }}
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
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-gray-700">Histórico de Sessões de Mentoria</CardTitle>
                <CardDescription className="text-gray-500">
                  {sessoes.length} sessões registradas • {indicadores.mentoriasPresente} presenças • {indicadores.atividadesEntregues} atividades entregues
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessoes && sessoes.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {sessoes.map((sessao: any, idx: number) => (
                      <div key={sessao.id || idx} className="p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                              {sessao.sessionNumber || idx + 1}
                            </div>
                            <div>
                              <p className="text-sm text-gray-900 font-medium">
                                Sessão {sessao.sessionNumber || idx + 1}
                                {sessao.sessionNumber === 1 && <Badge className="ml-2 text-xs bg-amber-100 text-amber-700 border-amber-300">Assessment</Badge>}
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
                              <span className="text-xs text-gray-600">{sessao.presence === "presente" ? "Presente" : "Ausente"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 ml-11 text-xs">
                          <div className="flex items-center gap-1.5" title="Atividade">
                            {getTaskIcon(sessao.taskStatus)}
                            <span className="text-gray-600">
                              {sessao.sessionNumber === 1 ? "Assessment (sem tarefa)" :
                                sessao.taskStatus === "entregue" ? "Atividade entregue" :
                                sessao.taskStatus === "nao_entregue" ? "Atividade não entregue" : "Sem tarefa"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5" title="Engajamento">
                            {getEngajamentoStars(sessao.engagementScore)}
                          </div>
                          {sessao.notaEvolucao && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <TrendingUp className="h-3.5 w-3.5" />Evolução: {sessao.notaEvolucao}
                            </div>
                          )}
                        </div>
                        {sessao.feedback && (
                          <div className="mt-2 ml-11 p-2 rounded bg-blue-50 border border-blue-100 text-xs text-gray-700 italic">"{sessao.feedback}"</div>
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
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-gray-700">Participação em Eventos e Webinars</CardTitle>
                <CardDescription className="text-gray-500">{indicadores.eventosPresente} presenças de {indicadores.totalEventos} eventos</CardDescription>
              </CardHeader>
              <CardContent>
                {eventos && eventos.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {eventos.map((evento: any, idx: number) => (
                      <div key={evento.id || idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                        <div className="flex-shrink-0">
                          <Video className={`h-5 w-5 ${evento.status === "presente" ? "text-emerald-600" : "text-red-500"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium">{evento.titulo}</p>
                          <p className="text-xs text-gray-500">
                            {evento.tipo === "webinar" ? "Webinar" : evento.tipo === "workshop" ? "Workshop" : "Evento"}
                            {evento.data && (<> • {new Date(evento.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</>)}
                          </p>
                        </div>
                        <Badge variant="outline" className={evento.status === "presente" ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-red-50 text-red-700 border-red-300"}>
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
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-500 mr-1">Filtrar:</span>
                  {(["todos", "ativo", "congelado"] as const).map((status) => {
                    const count = status === "todos"
                      ? assessments.length
                      : assessments.filter((a: any) => a.status === status).length;
                    const isActive = pdiStatusFilter === status;
                    const colorMap = {
                      todos: isActive ? "bg-[#0A1E3E] text-white border-[#0A1E3E]" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
                      ativo: isActive ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
                      congelado: isActive ? "bg-gray-500 text-white border-gray-500" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
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
                  <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardContent className="py-8">
                      <div className="text-center text-gray-500">
                        <Filter className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhum PDI com status "{pdiStatusFilter === "ativo" ? "Ativo" : "Congelado"}"</p>
                        <button onClick={() => setPdiStatusFilter("todos")} className="text-blue-600 hover:text-blue-700 text-xs mt-2 underline">Ver todos</button>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {filteredAssessments.map((assessment: any) => (
                  <Card key={assessment.id} className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
                            <Award className="h-4 w-4 text-[#F5991F]" />
                            Trilha: {assessment.trilhaNome}
                          </CardTitle>
                          <CardDescription className="text-gray-500">
                            {assessment.consultorNome && `Mentora: ${assessment.consultorNome} • `}
                            Macro ciclo: {new Date(assessment.macroInicio).toLocaleDateString("pt-BR")} a {new Date(assessment.macroTermino).toLocaleDateString("pt-BR")}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={assessment.status === "ativo" ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-gray-100 text-gray-600 border-gray-300"}>
                          {assessment.status === "ativo" ? "Ativo" : "Congelado"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
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
                            <div key={comp.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                              <div className="flex-shrink-0">
                                {atingiu ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : notaAtual !== null && notaAtual > 0 ? (
                                  <Clock className="h-5 w-5 text-amber-500" />
                                ) : (
                                  <Target className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 font-medium truncate">{comp.competenciaNome}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Badge variant="outline" className={comp.peso === 'obrigatoria' ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-gray-100 text-gray-600 border-gray-300"}>
                                    {comp.peso === 'obrigatoria' ? 'Obrigatória' : 'Opcional'}
                                  </Badge>
                                  {comp.microInicio && comp.microTermino && (
                                    <span>Micro: {new Date(comp.microInicio).toLocaleDateString("pt-BR")} a {new Date(comp.microTermino).toLocaleDateString("pt-BR")}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className={`text-sm font-bold ${atingiu ? "text-emerald-600" : notaAtual !== null && notaAtual > 0 ? "text-amber-600" : "text-gray-400"}`}>
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
                        <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-gray-700">
                          <p className="font-semibold mb-1 text-gray-800">Observações:</p>
                          <p>{assessment.observacoes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white border border-gray-200 shadow-sm">
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

          {/* === TAREFAS PRÁTICAS === */}
          <TabsContent value="tarefas" className="mt-4">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-[#F5991F]" />
                  Tarefas Práticas
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Atividades atribuídas pela sua mentora durante as sessões de mentoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myTasks && myTasks.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {myTasks.map((task: any) => (
                      <div key={task.sessionId} className="p-4 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">{task.taskName}</span>
                              <Badge variant="outline" className={task.taskStatus === "entregue" ? "bg-emerald-50 text-emerald-700 border-emerald-300" : task.taskStatus === "nao_entregue" ? "bg-red-50 text-red-700 border-red-300" : "bg-gray-100 text-gray-600 border-gray-300"}>
                                {task.taskStatus === "entregue" ? "Entregue" : task.taskStatus === "nao_entregue" ? "Não Entregue" : "Pendente"}
                              </Badge>
                            </div>
                            {task.taskCompetencia && (
                              <p className="text-xs text-blue-600 mb-1">Competência: {task.taskCompetencia}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              Sessão {task.sessionNumber} • {task.sessionDate ? new Date(task.sessionDate).toLocaleDateString("pt-BR") : ""}
                              {task.taskDeadline && (<> • Prazo: {new Date(task.taskDeadline).toLocaleDateString("pt-BR")}</>)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedTask(expandedTask === task.sessionId ? null : task.sessionId)}
                            className="text-gray-500 hover:text-gray-900"
                          >
                            {expandedTask === task.sessionId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                        {expandedTask === task.sessionId && (
                          <div className="mt-3 space-y-3">
                            {task.taskResumo && (
                              <div className="p-3 rounded bg-blue-50 border border-blue-100">
                                <p className="text-xs font-semibold text-gray-700 mb-1">Resumo:</p>
                                <p className="text-xs text-gray-600">{task.taskResumo}</p>
                              </div>
                            )}
                            {task.taskOQueFazer && (
                              <div className="p-3 rounded bg-blue-50 border border-blue-100">
                                <p className="text-xs font-semibold text-gray-700 mb-1">O que fazer:</p>
                                <p className="text-xs text-gray-600">{task.taskOQueFazer}</p>
                              </div>
                            )}
                            {task.taskOQueGanha && (
                              <div className="p-3 rounded bg-emerald-50 border border-emerald-100">
                                <p className="text-xs font-semibold text-gray-700 mb-1">O que você ganha:</p>
                                <p className="text-xs text-gray-600">{task.taskOQueGanha}</p>
                              </div>
                            )}
                            {task.taskStatus !== "entregue" && (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-700">Seu relato:</p>
                                <Textarea
                                  placeholder="Descreva como foi a realização desta tarefa..."
                                  value={relatoText[task.sessionId] || ""}
                                  onChange={(e) => setRelatoText(prev => ({ ...prev, [task.sessionId]: e.target.value }))}
                                  className="border-gray-300 text-gray-900 text-sm min-h-[80px]"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => submitRelato.mutate({ sessionId: task.sessionId, relatoAluno: relatoText[task.sessionId] || "" })}
                                  disabled={!relatoText[task.sessionId] || submitRelato.isPending}
                                  className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white"
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  {submitRelato.isPending ? "Enviando..." : "Enviar Relato"}
                                </Button>
                                {submitRelato.isError && (
                                  <p className="text-xs text-red-600">{submitRelato.error?.message || "Erro ao enviar relato"}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma tarefa prática atribuída ainda</p>
                    <p className="text-xs mt-1">As tarefas serão atribuídas pela sua mentora durante as sessões</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === WEBINÁRIOS === */}
          <TabsContent value="webinarios" className="mt-4">
            <div className="space-y-6">
              {/* Próximos Webinários */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
                    <Play className="h-4 w-4 text-blue-600" />
                    Próximos Webinários
                  </CardTitle>
                  <CardDescription className="text-gray-500">Webinários agendados para o seu programa</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingWebinars && upcomingWebinars.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {upcomingWebinars.map((w: any) => (
                        <div key={w.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                          {w.cardImageUrl && (
                            <img src={w.cardImageUrl} alt={w.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                          )}
                          <h4 className="text-sm font-medium text-gray-900 mb-1">{w.title}</h4>
                          {w.description && <p className="text-xs text-gray-600 mb-2 line-clamp-2">{w.description}</p>}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(w.eventDate).toLocaleDateString("pt-BR")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(w.eventDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {w.speaker && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {w.speaker}
                              </span>
                            )}
                          </div>
                          {w.meetingLink && (
                            <a href={w.meetingLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                              <ExternalLink className="h-3 w-3" /> Acessar reunião
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Play className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Nenhum webinário agendado no momento</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Webinários Pendentes de Presença */}
              {pendingWebinars && pendingWebinars.length > 0 && (
                <Card className="bg-white border-2 border-amber-300 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm text-amber-700 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Pendentes de Presença ({pendingWebinars.length})
                    </CardTitle>
                    <CardDescription className="text-gray-500">Marque sua presença e envie uma reflexão</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingWebinars.map((w: any) => (
                        <div key={w.eventId} className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{w.title}</h4>
                              <p className="text-xs text-gray-500">
                                {w.eventDate ? new Date(w.eventDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : ""}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedWebinar(expandedWebinar === w.eventId ? null : w.eventId)}
                              className="text-amber-700 hover:text-amber-900"
                            >
                              {expandedWebinar === w.eventId ? "Fechar" : "Marcar Presença"}
                            </Button>
                          </div>
                          {expandedWebinar === w.eventId && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs text-gray-600">Escreva uma reflexão sobre o webinário (mínimo 20 caracteres):</p>
                              <Textarea
                                placeholder="O que você aprendeu neste webinário? Como pretende aplicar no seu dia a dia?"
                                value={reflexaoText[w.eventId] || ""}
                                onChange={(e) => setReflexaoText(prev => ({ ...prev, [w.eventId]: e.target.value }))}
                                className="border-gray-300 text-gray-900 text-sm min-h-[80px]"
                              />
                              <Button
                                size="sm"
                                onClick={() => markPresence.mutate({ eventId: w.eventId, reflexao: reflexaoText[w.eventId] || "" })}
                                disabled={!reflexaoText[w.eventId] || reflexaoText[w.eventId].length < 20 || markPresence.isPending}
                                className="bg-[#F5991F] hover:bg-[#F5991F]/90 text-white"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                {markPresence.isPending ? "Enviando..." : "Confirmar Presença"}
                              </Button>
                              {markPresence.isError && (
                                <p className="text-xs text-red-600">{markPresence.error?.message || "Erro ao marcar presença"}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Webinários Passados com Gravação */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
                    <Video className="h-4 w-4 text-purple-600" />
                    Webinários Realizados
                  </CardTitle>
                  <CardDescription className="text-gray-500">Histórico de webinários com gravações disponíveis</CardDescription>
                </CardHeader>
                <CardContent>
                  {pastWebinars && pastWebinars.length > 0 ? (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {pastWebinars.map((w: any) => {
                        const isConfirmed = confirmedEventIds.has(w.id);
                        return (
                          <div key={w.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                            <div className="flex-shrink-0">
                              {isConfirmed ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 font-medium">{w.title}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(w.eventDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                                {w.speaker && ` • ${w.speaker}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isConfirmed && (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs">Presente</Badge>
                              )}
                              {w.youtubeLink && (
                                <a href={w.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-700">
                                  <Play className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Video className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Nenhum webinário realizado ainda</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === CURSOS === */}
          <TabsContent value="cursos" className="mt-4">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                  Cursos Disponíveis
                </CardTitle>
                <CardDescription className="text-gray-500">Cursos complementares para sua jornada de desenvolvimento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Em breve</p>
                  <p className="text-xs mt-1">Os cursos complementares serão disponibilizados em breve pelo administrador do programa</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AlunoLayout>
  );
}
