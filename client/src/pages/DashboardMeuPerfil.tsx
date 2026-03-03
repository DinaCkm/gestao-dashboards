import { useMemo, useState, useRef } from "react";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User, Target, Calendar, Award, TrendingUp, BookOpen, Users,
  CheckCircle2, XCircle, Clock, GraduationCap, Trophy, Star, Zap,
  Activity, Video, MessageSquare, Minus, Info, ChevronDown, ChevronUp, PartyPopper, Filter,
  ClipboardCheck, Play, ExternalLink, FileText, Send, Route, FileBarChart,
  AlertTriangle, Briefcase, HelpCircle, Upload, Paperclip, FileUp,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, PieChart, Pie,
} from "recharts";
import { InfoTooltip, GLOSSARIO, INDICADORES_INFO } from "@/components/InfoTooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const { data: jornadaData } = trpc.jornada.minha.useQuery();
  const [pdiStatusFilter, setPdiStatusFilter] = useState<"todos" | "ativo" | "congelado">("todos");
  // Filtro de indicadores: "consolidado" | "trilha:NomeTrilha" | "ciclo:CicloId"
  const [indicadorFiltro, setIndicadorFiltro] = useState<string>("consolidado");
  const [showGlossario, setShowGlossario] = useState(false);

  // Dados de indicadores - declarado cedo para uso nos useMemo
  const v2 = data?.found ? ((data as any).indicadoresV2 as {
    ciclosFinalizados: any[];
    ciclosEmAndamento: any[];
    consolidado: any;
    alertaCasePendente: any[];
  } | undefined) : undefined;

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

  // === Case de Sucesso ===
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const [caseTrilhaId, setCaseTrilhaId] = useState<number | null>(null);
  const [caseTrilhaNome, setCaseTrilhaNome] = useState("");
  const [caseTitulo, setCaseTitulo] = useState("");
  const [caseDescricao, setCaseDescricao] = useState("");
  const [caseFile, setCaseFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const enviarCase = trpc.cases.enviar.useMutation({
    onSuccess: () => {
      utils.indicadores.meuDashboard.invalidate();
      setCaseDialogOpen(false);
      setCaseTitulo("");
      setCaseDescricao("");
      setCaseFile(null);
      setCaseTrilhaId(null);
    },
  });

  const handleCaseSubmit = async () => {
    if (!caseFile || !caseTrilhaId || !caseTitulo) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      await enviarCase.mutateAsync({
        trilhaId: caseTrilhaId,
        trilhaNome: caseTrilhaNome,
        titulo: caseTitulo,
        descricao: caseDescricao || undefined,
        fileBase64: base64,
        fileName: caseFile.name,
        mimeType: caseFile.type || 'application/pdf',
      });
    };
    reader.readAsDataURL(caseFile);
  };

  // Cases do aluno e trilhas disponíveis
  const casesAluno = data?.found ? (data as any).casesAluno || [] : [];
  const trilhasDisponiveis = data?.found ? (data as any).trilhasDisponiveis || [] : [];

  // Set de eventIds já confirmados
  const confirmedEventIds = useMemo(() => {
    return new Set((myAttendance || []).map((a: any) => a.eventId));
  }, [myAttendance]);

  // Dados filtrados conforme seleção
  const v2Filtrado = useMemo(() => {
    if (!v2) return null;
    if (indicadorFiltro === "consolidado") {
      return v2.consolidado;
    }
    if (indicadorFiltro.startsWith("trilha:")) {
      const trilhaNome = indicadorFiltro.replace("trilha:", "");
      const ciclosDaTrilha = [...(v2.ciclosFinalizados || []), ...(v2.ciclosEmAndamento || [])]
        .filter((c: any) => c.trilhaNome === trilhaNome);
      if (ciclosDaTrilha.length === 0) return v2.consolidado;
      // Média dos ciclos da trilha
      const avg = (key: string) => {
        const vals = ciclosDaTrilha.map((c: any) => c[key] ?? c.indicadores?.[key] ?? 0);
        return vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
      };
      return {
        ind1_webinars: avg('ind1_webinars'),
        ind2_avaliacoes: avg('ind2_avaliacoes'),
        ind3_competencias: avg('ind3_competencias'),
        ind4_tarefas: avg('ind4_tarefas'),
        ind5_engajamento: avg('ind5_engajamento'),
        ind6_aplicabilidade: avg('ind6_aplicabilidade'),
        ind7_engajamentoFinal: avg('ind7_engajamentoFinal'),
      };
    }
    if (indicadorFiltro.startsWith("ciclo:")) {
      const cicloId = indicadorFiltro.replace("ciclo:", "");
      const ciclo = [...(v2.ciclosFinalizados || []), ...(v2.ciclosEmAndamento || [])]
        .find((c: any) => String(c.cicloId) === cicloId);
      if (!ciclo) return v2.consolidado;
      // Os campos podem estar no root ou em ciclo.indicadores
      return {
        ind1_webinars: ciclo.ind1_webinars ?? ciclo.indicadores?.ind1_webinars ?? 0,
        ind2_avaliacoes: ciclo.ind2_avaliacoes ?? ciclo.indicadores?.ind2_avaliacoes ?? 0,
        ind3_competencias: ciclo.ind3_competencias ?? ciclo.indicadores?.ind3_competencias ?? 0,
        ind4_tarefas: ciclo.ind4_tarefas ?? ciclo.indicadores?.ind4_tarefas ?? 0,
        ind5_engajamento: ciclo.ind5_engajamento ?? ciclo.indicadores?.ind5_engajamento ?? 0,
        ind6_aplicabilidade: ciclo.ind6_aplicabilidade ?? ciclo.indicadores?.ind6_aplicabilidade ?? 0,
        ind7_engajamentoFinal: ciclo.ind7_engajamentoFinal ?? ciclo.indicadores?.ind7_engajamentoFinal ?? 0,
      };
    }
    return v2.consolidado;
  }, [v2, indicadorFiltro]);

  // Opções de filtro disponíveis
  const filtroOpcoes = useMemo(() => {
    if (!v2) return [];
    const opcoes: { value: string; label: string; group: string }[] = [
      { value: "consolidado", label: "Consolidado (Todos os ciclos finalizados)", group: "Geral" },
    ];
    const trilhas = new Set<string>();
    const allCiclos = [...(v2.ciclosFinalizados || []), ...(v2.ciclosEmAndamento || [])];
    allCiclos.forEach((c: any) => {
      if (c.trilhaNome && !trilhas.has(c.trilhaNome)) {
        trilhas.add(c.trilhaNome);
        opcoes.push({ value: `trilha:${c.trilhaNome}`, label: `Trilha: ${c.trilhaNome}`, group: "Por Trilha" });
      }
    });
    allCiclos.forEach((c: any) => {
      const status = c.status === 'em_andamento' ? ' (Em Andamento)' : '';
      opcoes.push({ value: `ciclo:${c.cicloId}`, label: `${c.nomeCiclo}${status}`, group: "Por Microciclo" });
    });
    return opcoes;
  }, [v2]);

  const radarData = useMemo(() => {
    if (!data || !data.found) return [];
    // Usar dados filtrados se disponíveis
    if (v2Filtrado) {
      return [
        { subject: "Webinars", value: v2Filtrado.ind1_webinars ?? 0, fullMark: 100 },
        { subject: "Avaliações", value: v2Filtrado.ind2_avaliacoes ?? 0, fullMark: 100 },
        { subject: "Competências", value: v2Filtrado.ind3_competencias ?? 0, fullMark: 100 },
        { subject: "Tarefas", value: v2Filtrado.ind4_tarefas ?? 0, fullMark: 100 },
        { subject: "Engajamento", value: v2Filtrado.ind5_engajamento ?? 0, fullMark: 100 },
        { subject: "Cases", value: v2Filtrado.ind6_aplicabilidade ?? 0, fullMark: 100 },
      ];
    }
    const ind = data.indicadores;
    return [
      { subject: "Mentorias", value: ind.participacaoMentorias, fullMark: 100 },
      { subject: "Atividades", value: ind.atividadesPraticas, fullMark: 100 },
      { subject: "Engajamento", value: ind.engajamento, fullMark: 100 },
      { subject: "Competências", value: ind.performanceCompetencias, fullMark: 100 },
      { subject: "Aprendizado", value: ind.performanceAprendizado || 0, fullMark: 100 },
      { subject: "Eventos", value: ind.participacaoEventos, fullMark: 100 },
    ];
  }, [data, v2Filtrado]);

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
  // v2 já declarado acima
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
                  <p className="text-xs text-white/70 mb-1 flex items-center gap-1 justify-end">
                    Engajamento Final
                    <InfoTooltip text={INDICADORES_INFO.ind7.explicacao} className="text-white/50 hover:text-white/80" />
                  </p>
                  <div className="text-4xl font-black text-[#F5991F]">
                    {(v2Filtrado?.ind7_engajamentoFinal ?? performanceGeral).toFixed(0)}%
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
              {/* Explicação do Engajamento Final */}
              {v2Filtrado && (
                <div className="mt-3 p-3 rounded-lg bg-white/10 text-xs text-white/70">
                  <p className="font-semibold mb-1 text-white/90">Ind. 7 — Engajamento Final:</p>
                  <p>Média dos 6 indicadores: ({(v2Filtrado.ind1_webinars ?? 0).toFixed(0)} + {(v2Filtrado.ind2_avaliacoes ?? 0).toFixed(0)} + {(v2Filtrado.ind3_competencias ?? 0).toFixed(0)} + {(v2Filtrado.ind4_tarefas ?? 0).toFixed(0)} + {(v2Filtrado.ind5_engajamento ?? 0).toFixed(0)} + {(v2Filtrado.ind6_aplicabilidade ?? 0).toFixed(0)}) / 6 = <span className="text-[#F5991F] font-bold">{(v2Filtrado.ind7_engajamentoFinal ?? 0).toFixed(0)}%</span></p>
                </div>
              )}
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

        {/* Alerta de Case de Sucesso Pendente */}
        {v2?.alertaCasePendente && v2.alertaCasePendente.length > 0 && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">Entrega de Case de Sucesso Pendente</p>
                  {v2.alertaCasePendente.map((alerta: any, idx: number) => (
                    <p key={idx} className="text-sm text-amber-700 mt-1">
                      O ciclo <strong>{alerta.trilhaNome}</strong> está finalizando
                      {alerta.diasRestantes !== undefined && ` (${alerta.diasRestantes} dias restantes)`}.
                      Lembre-se de entregar o <strong>Case de Sucesso</strong> para completar a avaliação do macrociclo.
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}



        {/* Glossário de Termos */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <button
              onClick={() => setShowGlossario(!showGlossario)}
              className="flex items-center gap-2 w-full text-left"
            >
              <HelpCircle className="h-5 w-5 text-[#F5991F]" />
              <span className="text-sm font-semibold text-gray-700">Glossário de Termos do Programa</span>
              <InfoTooltip text="Clique para expandir e ver a explicação de cada termo usado no sistema" />
              {showGlossario ? <ChevronUp className="h-4 w-4 text-gray-400 ml-auto" /> : <ChevronDown className="h-4 w-4 text-gray-400 ml-auto" />}
            </button>
            {showGlossario && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {([
                  { termo: "Jornada", desc: GLOSSARIO.jornada, icon: Route, color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
                  { termo: "Macrociclo", desc: GLOSSARIO.macrociclo, icon: Target, color: "bg-blue-50 border-blue-200 text-blue-700" },
                  { termo: "Trilha", desc: GLOSSARIO.trilha, icon: TrendingUp, color: "bg-purple-50 border-purple-200 text-purple-700" },
                  { termo: "Microciclo", desc: GLOSSARIO.microciclo, icon: Clock, color: "bg-cyan-50 border-cyan-200 text-cyan-700" },
                  { termo: "Competência", desc: GLOSSARIO.competencia, icon: BookOpen, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                  { termo: "Aula", desc: GLOSSARIO.aula, icon: GraduationCap, color: "bg-amber-50 border-amber-200 text-amber-700" },
                  { termo: "Webinar", desc: GLOSSARIO.webinar, icon: Video, color: "bg-orange-50 border-orange-200 text-orange-700" },
                  { termo: "Mentoria", desc: GLOSSARIO.mentoria, icon: MessageSquare, color: "bg-pink-50 border-pink-200 text-pink-700" },
                  { termo: "Tarefa Prática", desc: GLOSSARIO.tarefa, icon: ClipboardCheck, color: "bg-teal-50 border-teal-200 text-teal-700" },
                  { termo: "Case de Sucesso", desc: GLOSSARIO.caseSucesso, icon: Briefcase, color: "bg-rose-50 border-rose-200 text-rose-700" },
                ]).map(({ termo, desc, icon: Icon, color }) => (
                  <div key={termo} className={`p-3 rounded-lg border ${color}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-semibold">{termo}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filtro de Período para Indicadores */}
        {filtroOpcoes.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Visualizar indicadores por:</span>
              <InfoTooltip text="Selecione o período para filtrar os indicadores. O consolidado mostra a média de todos os ciclos finalizados. Você também pode filtrar por trilha ou por microciclo específico." />
            </div>
            <Select value={indicadorFiltro} onValueChange={setIndicadorFiltro}>
              <SelectTrigger className="w-[320px] bg-white">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {filtroOpcoes.map((opcao) => (
                  <SelectItem key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 6 Indicadores com Tooltips */}
        {v2Filtrado && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <IndicadorCardAluno
              numero={1} icon={Video} label="Webinars"
              valor={`${(v2Filtrado.ind1_webinars ?? 0).toFixed(0)}%`} total="100%"
              percentual={v2Filtrado.ind1_webinars ?? 0}
              color="bg-blue-100 text-blue-600" borderColor="border-blue-200"
              regras={[INDICADORES_INFO.ind1.explicacao, INDICADORES_INFO.ind1.formula]}
            />
            <IndicadorCardAluno
              numero={2} icon={GraduationCap} label="Avaliações"
              valor={`${(v2Filtrado.ind2_avaliacoes ?? 0).toFixed(0)}%`} total="100%"
              percentual={v2Filtrado.ind2_avaliacoes ?? 0}
              color="bg-red-100 text-red-600" borderColor="border-red-200"
              regras={[INDICADORES_INFO.ind2.explicacao, INDICADORES_INFO.ind2.formula]}
            />
            <IndicadorCardAluno
              numero={3} icon={BookOpen} label="Competências"
              valor={`${(v2Filtrado.ind3_competencias ?? 0).toFixed(0)}%`} total="100%"
              percentual={v2Filtrado.ind3_competencias ?? 0}
              color="bg-purple-100 text-purple-600" borderColor="border-purple-200"
              regras={[INDICADORES_INFO.ind3.explicacao, INDICADORES_INFO.ind3.formula]}
            />
            <IndicadorCardAluno
              numero={4} icon={ClipboardCheck} label="Tarefas"
              valor={`${(v2Filtrado.ind4_tarefas ?? 0).toFixed(0)}%`} total="100%"
              percentual={v2Filtrado.ind4_tarefas ?? 0}
              color="bg-emerald-100 text-emerald-600" borderColor="border-emerald-200"
              regras={[INDICADORES_INFO.ind4.explicacao, INDICADORES_INFO.ind4.formula]}
            />
            <IndicadorCardAluno
              numero={5} icon={Star} label="Engajamento"
              valor={`${(v2Filtrado.ind5_engajamento ?? 0).toFixed(0)}%`} total="100%"
              percentual={v2Filtrado.ind5_engajamento ?? 0}
              color="bg-amber-100 text-amber-600" borderColor="border-amber-200"
              regras={[INDICADORES_INFO.ind5.explicacao, INDICADORES_INFO.ind5.formula]}
            />
            <IndicadorCardAluno
              numero={6} icon={Briefcase} label="Cases"
              valor={`${(v2Filtrado.ind6_aplicabilidade ?? 0).toFixed(0)}%`} total="100%"
              percentual={v2Filtrado.ind6_aplicabilidade ?? 0}
              color="bg-rose-100 text-rose-600" borderColor="border-rose-200"
              regras={[INDICADORES_INFO.ind6.explicacao, INDICADORES_INFO.ind6.formula]}
            />
          </div>
        )}

        {/* Tabs com seções detalhadas */}
        <Tabs defaultValue="jornada" className="w-full">
          <TabsList className="bg-gray-100 border border-gray-200 w-full flex flex-wrap h-auto gap-1 p-1 rounded-xl">
            <TabsTrigger value="jornada" className="flex-1 min-w-[120px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-gray-600">
              <Route className="h-4 w-4 mr-1" /> Minha Jornada
            </TabsTrigger>
            <TabsTrigger value="mentorias" className="flex-1 min-w-[120px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-gray-600">
              <MessageSquare className="h-4 w-4 mr-1" /> Mentorias
            </TabsTrigger>
            <TabsTrigger value="eventos" className="flex-1 min-w-[120px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-gray-600">
              <Video className="h-4 w-4 mr-1" /> Eventos
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
            <TabsTrigger value="cases" className="flex-1 min-w-[120px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-gray-600">
              <Briefcase className="h-4 w-4 mr-1" /> Cases de Sucesso
            </TabsTrigger>
          </TabsList>

          {/* === MINHA JORNADA (unificada: Trilha + PDI + Competências) === */}
          <TabsContent value="jornada" className="mt-4">
            {jornadaData && jornadaData.macroJornadas && jornadaData.macroJornadas.length > 0 ? (
              <div className="space-y-6">
                {/* Card de Contrato */}
                {jornadaData.contrato && (
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <FileBarChart className="h-5 w-5 text-blue-700" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Contrato Ativo</p>
                            <p className="text-xs text-gray-600">
                              {new Date(jornadaData.contrato.periodoInicio).toLocaleDateString("pt-BR")} a {new Date(jornadaData.contrato.periodoTermino).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        {jornadaData.saldo && (
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-lg font-bold text-gray-900">{jornadaData.saldo.sessoesRealizadas}</p>
                              <p className="text-xs text-gray-500">Realizadas</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-blue-700">{jornadaData.saldo.saldoRestante}</p>
                              <p className="text-xs text-gray-500">Restantes</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-gray-600">{jornadaData.saldo.totalContratadas}</p>
                              <p className="text-xs text-gray-500">Total</p>
                            </div>
                            <div className="w-24">
                              <Progress value={jornadaData.saldo.percentualUsado} className="h-2" />
                              <p className="text-xs text-gray-500 text-center mt-1">{jornadaData.saldo.percentualUsado}% usado</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Alertas de Micro Ciclos com prazo próximo */}
                {(() => {
                  const alertas: any[] = [];
                  const hoje = new Date();
                  jornadaData.macroJornadas.forEach((mj: any) => {
                    mj.microJornadas.forEach((micro: any) => {
                      if (micro.peso !== 'obrigatoria') return;
                      if (!micro.microTermino) return;
                      const termino = new Date(micro.microTermino);
                      const diasRestantes = Math.ceil((termino.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                      // Alertar se: em andamento (não concluída) e prazo <= 30 dias
                      const concluida = micro.aulasDisponiveis > 0 && micro.aulasConcluidas >= micro.aulasDisponiveis;
                      if (!concluida && diasRestantes >= 0 && diasRestantes <= 30) {
                        alertas.push({ ...micro, trilhaNome: mj.trilhaNome, diasRestantes });
                      }
                    });
                  });
                  alertas.sort((a: any, b: any) => a.diasRestantes - b.diasRestantes);
                  if (alertas.length === 0) return null;
                  return (
                    <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 rounded-lg bg-amber-100">
                            <Clock className="h-4 w-4 text-amber-700" />
                          </div>
                          <p className="text-sm font-semibold text-amber-800">Atenção: Competências com prazo próximo</p>
                          <Badge className="bg-amber-200 text-amber-800 border-amber-400 text-xs">{alertas.length}</Badge>
                        </div>
                        <div className="space-y-2">
                          {alertas.map((a: any, i: number) => (
                            <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg border ${
                              a.diasRestantes <= 7 ? 'bg-red-50 border-red-200' : 
                              a.diasRestantes <= 14 ? 'bg-orange-50 border-orange-200' : 
                              'bg-amber-50 border-amber-200'
                            }`}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{a.competenciaNome}</p>
                                <p className="text-xs text-gray-500">
                                  {a.trilhaNome} • Aulas: {a.aulasConcluidas || 0}/{a.aulasDisponiveis || '?'}
                                  {a.notaPlataforma > 0 && ` • Nota: ${a.notaPlataforma.toFixed(0)}`}
                                </p>
                              </div>
                              <div className={`text-right ml-3 ${
                                a.diasRestantes <= 7 ? 'text-red-700' : 
                                a.diasRestantes <= 14 ? 'text-orange-700' : 
                                'text-amber-700'
                              }`}>
                                <p className="text-sm font-bold">{a.diasRestantes === 0 ? 'Hoje!' : `${a.diasRestantes}d`}</p>
                                <p className="text-xs">restantes</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Filtro por status */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-500 mr-1">Filtrar:</span>
                  {(["todos", "ativo", "congelado"] as const).map((status) => {
                    const count = status === "todos"
                      ? jornadaData.macroJornadas.length
                      : jornadaData.macroJornadas.filter((a: any) => a.status === status).length;
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

                {/* Macro Jornadas (por trilha) */}
                {jornadaData.macroJornadas
                  .filter((mj: any) => pdiStatusFilter === "todos" || mj.status === pdiStatusFilter)
                  .map((macroJornada: any) => (
                  <Card key={macroJornada.id} className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                            <Route className="h-5 w-5 text-[#F5991F]" />
                            Trilha: {macroJornada.trilhaNome}
                          </CardTitle>
                          <CardDescription className="text-gray-500 mt-1">
                            Macro Jornada: {new Date(macroJornada.macroInicio).toLocaleDateString("pt-BR")} a {new Date(macroJornada.macroTermino).toLocaleDateString("pt-BR")}
                            {" "}• {macroJornada.totalCompetencias} competências ({macroJornada.obrigatorias} obrigatórias, {macroJornada.opcionais} opcionais)
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                          {macroJornada.nivelGeralAtual !== null && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Nível Geral</p>
                              <p className="text-lg font-bold text-gray-900">{macroJornada.nivelGeralAtual.toFixed(0)}%</p>
                            </div>
                          )}
                          {macroJornada.metaGeralFinal !== null && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Meta Final</p>
                              <p className="text-lg font-bold text-blue-700">{macroJornada.metaGeralFinal.toFixed(0)}%</p>
                            </div>
                          )}
                          <Badge variant="outline" className={macroJornada.status === "ativo" ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-gray-100 text-gray-600 border-gray-300"}>
                            {macroJornada.status === "ativo" ? "Ativo" : "Congelado"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* === Visão Unificada: Ciclos + Competências === */}
                      {(() => {
                        const ciclosDaTrilha = [...(ciclosFinalizados || []), ...(ciclosEmAndamento || [])]
                          .filter((c: any) => c.trilhaNome === macroJornada.trilhaNome);
                        const ciclosV2DaTrilha = v2 ? [...(v2.ciclosFinalizados || []), ...(v2.ciclosEmAndamento || [])]
                          .filter((c: any) => c.trilhaNome === macroJornada.trilhaNome) : [];
                        const ciclosParaMostrar = ciclosV2DaTrilha.length > 0 ? ciclosV2DaTrilha : ciclosDaTrilha;
                        const temCiclos = ciclosParaMostrar.length > 0;

                        // Agrupar microJornadas por ciclo (usando datas de início/término)
                        const microsPorCiclo = new Map<string, any[]>();
                        const microsOrfaos: any[] = [];

                        macroJornada.microJornadas.forEach((micro: any) => {
                          let encontrouCiclo = false;
                          if (temCiclos) {
                            for (const ciclo of ciclosParaMostrar) {
                              // Match por competenciaIds se disponível
                              if (ciclo.detalhes?.competencias?.competenciasDetalhe) {
                                const compIds = ciclo.detalhes.competencias.competenciasDetalhe.map((cd: any) => cd.competenciaId);
                                if (compIds.includes(micro.competenciaId)) {
                                  const key = String(ciclo.cicloId || ciclo.nomeCiclo);
                                  if (!microsPorCiclo.has(key)) microsPorCiclo.set(key, []);
                                  microsPorCiclo.get(key)!.push(micro);
                                  encontrouCiclo = true;
                                  break;
                                }
                              }
                              // Fallback: match por datas
                              if (micro.microInicio && micro.microTermino && ciclo.dataInicio && ciclo.dataFim) {
                                const microIni = new Date(micro.microInicio).toISOString().slice(0, 10);
                                const microFim = new Date(micro.microTermino).toISOString().slice(0, 10);
                                const cicloIni = new Date(ciclo.dataInicio).toISOString().slice(0, 10);
                                const cicloFim = new Date(ciclo.dataFim).toISOString().slice(0, 10);
                                if (microIni === cicloIni && microFim === cicloFim) {
                                  const key = String(ciclo.cicloId || ciclo.nomeCiclo);
                                  if (!microsPorCiclo.has(key)) microsPorCiclo.set(key, []);
                                  microsPorCiclo.get(key)!.push(micro);
                                  encontrouCiclo = true;
                                  break;
                                }
                              }
                            }
                          }
                          if (!encontrouCiclo) microsOrfaos.push(micro);
                        });

                        // Função para renderizar uma competência inline
                        const renderMicro = (micro: any) => {
                          const aulasDisp = micro.aulasDisponiveis ?? 0;
                          const aulasConc = micro.aulasConcluidas ?? 0;
                          const aulasAnd = micro.aulasEmAndamento ?? 0;
                          const competenciaConcluida = aulasDisp > 0 && aulasConc >= aulasDisp;
                          const notaPlataforma = micro.notaPlataforma ?? 0;
                          const progressoAulas = aulasDisp > 0 ? (aulasConc / aulasDisp) * 100 : 0;
                          const nivel = micro.nivelAtual ?? 0;
                          const meta = micro.metaFinal ?? 100;
                          const hoje = new Date();
                          const microInicio = micro.microInicio ? new Date(micro.microInicio) : null;
                          const microTermino = micro.microTermino ? new Date(micro.microTermino) : null;
                          const cicloStatus = !microInicio || !microTermino ? 'indefinido' :
                            hoje < microInicio ? 'futuro' :
                            hoje > microTermino ? 'finalizado' : 'em_andamento';
                          const diasRestantes = microTermino ? Math.ceil((microTermino.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)) : null;
                          const barColor = competenciaConcluida ? "bg-emerald-500" : 
                            progressoAulas >= 70 ? "bg-amber-500" : 
                            progressoAulas > 0 ? "bg-blue-500" : "bg-gray-300";
                          const statusIcon = competenciaConcluida ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                            aulasConc > 0 ? <TrendingUp className="h-4 w-4 text-amber-500" /> :
                            cicloStatus === 'futuro' ? <Clock className="h-4 w-4 text-gray-300" /> :
                            <Target className="h-4 w-4 text-gray-400" />;

                          return (
                            <div key={micro.id} className={`p-3 rounded-lg border ${
                              competenciaConcluida ? 'bg-emerald-50/50 border-emerald-200' :
                              cicloStatus === 'futuro' ? 'bg-gray-50/50 border-gray-100 opacity-60' :
                              cicloStatus === 'finalizado' && aulasConc === 0 ? 'bg-red-50/50 border-red-200' :
                              'bg-white/50 border-gray-100'
                            }`}>
                              <div className="flex items-center gap-2 mb-1.5">
                                {statusIcon}
                                <span className="text-sm font-semibold text-gray-900 flex-1">{micro.competenciaNome}</span>
                                <div className="flex items-center gap-1">
                                  {cicloStatus === 'em_andamento' && diasRestantes !== null && diasRestantes <= 14 && !competenciaConcluida && micro.peso === 'obrigatoria' && (
                                    <Badge className={`text-[10px] px-1.5 py-0 ${diasRestantes <= 7 ? 'bg-red-100 text-red-700 border-red-300' : 'bg-amber-100 text-amber-700 border-amber-300'}`}>
                                      <Clock className="h-2.5 w-2.5 mr-0.5" />{diasRestantes}d
                                    </Badge>
                                  )}
                                  {cicloStatus === 'finalizado' && !competenciaConcluida && micro.peso === 'obrigatoria' && (
                                    <Badge className="bg-red-100 text-red-700 border-red-300 text-[10px] px-1.5 py-0">Vencida</Badge>
                                  )}
                                  {competenciaConcluida && (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px] px-1.5 py-0">Concluída</Badge>
                                  )}
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${micro.peso === 'obrigatoria' ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                                    {micro.peso === 'obrigatoria' ? 'Obrigatória' : 'Opcional'}
                                  </Badge>
                                </div>
                              </div>
                              {/* Barra + métricas em linha */}
                              <div className="flex items-center gap-2 mb-1">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${progressoAulas}%` }} />
                                </div>
                                <span className={`text-xs font-bold min-w-[35px] text-right ${competenciaConcluida ? 'text-emerald-600' : progressoAulas > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                  {progressoAulas > 0 ? `${progressoAulas.toFixed(0)}%` : '—'}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-500">
                                {aulasDisp > 0 && <span>Aulas: <strong className="text-gray-700">{aulasConc}/{aulasDisp}</strong></span>}
                                {aulasAnd > 0 && <span>Em andamento: <strong className="text-blue-600">{aulasAnd}</strong></span>}
                                {notaPlataforma > 0 && <span>Nota: <strong className={notaPlataforma >= 70 ? 'text-emerald-600' : 'text-amber-600'}>{notaPlataforma.toFixed(0)}</strong></span>}
                                {nivel > 0 && <span>Nível Mentora: <strong className="text-gray-700">{nivel.toFixed(0)}%</strong></span>}
                                <span>Meta: <strong className="text-gray-700">{meta > 0 ? `${meta.toFixed(0)}%` : '—'}</strong></span>
                              </div>
                              {micro.justificativa && (
                                <div className="mt-1.5 p-1.5 rounded bg-blue-50 border border-blue-100 text-[10px] text-gray-700">
                                  <strong>Justificativa:</strong> {micro.justificativa}
                                </div>
                              )}
                            </div>
                          );
                        };

                        return (
                          <div className="space-y-4">
                            {/* Ciclos com competências integradas */}
                            {temCiclos && ciclosParaMostrar.map((ciclo: any, idx: number) => {
                              const statusColors = getCicloStatusColor(ciclo.status);
                              const isEmAndamento = ciclo.status === 'em_andamento';
                              const totalDias = isEmAndamento ? Math.max(1, Math.ceil((new Date(ciclo.dataFim).getTime() - new Date(ciclo.dataInicio).getTime()) / (1000 * 60 * 60 * 24))) : 0;
                              const diasPassados = isEmAndamento ? Math.ceil((Date.now() - new Date(ciclo.dataInicio).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                              const progressoCiclo = isEmAndamento ? Math.min(100, Math.max(0, (diasPassados / totalDias) * 100)) : 0;
                              const diasRestantes = isEmAndamento ? Math.max(0, totalDias - diasPassados) : 0;
                              const det = ciclo.detalhes || {};
                              const key = String(ciclo.cicloId || ciclo.nomeCiclo);
                              const microsDesteCiclo = microsPorCiclo.get(key) || [];

                              return (
                                <div key={ciclo.cicloId || idx} className={`rounded-xl border overflow-hidden ${
                                  isEmAndamento ? 'border-blue-300' : 'border-gray-200'
                                }`}>
                                  {/* Cabeçalho do ciclo */}
                                  <div className={`px-4 py-3 ${
                                    isEmAndamento ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 'bg-gray-50'
                                  }`}>
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${statusColors.bg}`} />
                                        <span className="text-sm font-semibold text-gray-900">{ciclo.nomeCiclo}</span>
                                        {isEmAndamento && <InfoTooltip text="Este é o seu ciclo atual. Os indicadores são parciais e se atualizam conforme você avança." />}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">
                                          {new Date(ciclo.dataInicio).toLocaleDateString('pt-BR')} — {new Date(ciclo.dataFim).toLocaleDateString('pt-BR')}
                                        </span>
                                        <Badge variant="outline" className={`text-xs ${statusColors.badge}`}>
                                          {getCicloStatusLabel(ciclo.status)}
                                        </Badge>
                                        {isEmAndamento && (
                                          <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                                            {diasRestantes} dias restantes
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    {/* Barra de progresso do ciclo */}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Progress value={isEmAndamento ? progressoCiclo : ciclo.percentualConclusao} className="h-1.5 flex-1" />
                                      <span className="text-xs text-gray-600 font-semibold w-10 text-right">
                                        {isEmAndamento ? `${progressoCiclo.toFixed(0)}%` : `${(ciclo.percentualConclusao ?? 0).toFixed(0)}%`}
                                      </span>
                                    </div>
                                    {/* Resumo rápido */}
                                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500 flex-wrap">
                                      <span>{isEmAndamento ? (det.competencias?.finalizadas || 0) : (ciclo.competenciasConcluidas || 0)} de {isEmAndamento ? (det.competencias?.total || 0) : (ciclo.totalCompetencias || 0)} competências concluídas</span>
                                      {det.webinars && <span className="flex items-center gap-0.5"><Video className="h-2.5 w-2.5 text-blue-500" />{det.webinars.presentes || 0}/{det.webinars.total || 0} webinars</span>}
                                      {det.tarefas && <span className="flex items-center gap-0.5"><ClipboardCheck className="h-2.5 w-2.5 text-emerald-500" />{det.tarefas.entregues || 0}/{det.tarefas.total || 0} tarefas</span>}
                                      {det.avaliacoes && det.avaliacoes.provasRealizadas > 0 && <span className="flex items-center gap-0.5"><GraduationCap className="h-2.5 w-2.5 text-red-500" />{det.avaliacoes.provasRealizadas} provas</span>}
                                    </div>
                                  </div>

                                  {/* Corpo: indicadores + competências */}
                                  <div className="px-4 py-3 space-y-3">
                                    {/* 7 indicadores em linha compacta */}
                                    {ciclo.ind1_webinars !== undefined && (
                                      <div className="grid grid-cols-7 gap-1.5">
                                        {[
                                          { label: 'Webinars', valor: ciclo.ind1_webinars, icon: Video, color: 'text-blue-600 bg-blue-100' },
                                          { label: 'Avaliações', valor: ciclo.ind2_avaliacoes, icon: GraduationCap, color: 'text-red-600 bg-red-100' },
                                          { label: 'Competências', valor: ciclo.ind3_competencias, icon: BookOpen, color: 'text-purple-600 bg-purple-100' },
                                          { label: 'Tarefas', valor: ciclo.ind4_tarefas, icon: ClipboardCheck, color: 'text-emerald-600 bg-emerald-100' },
                                          { label: 'Engajamento', valor: ciclo.ind5_engajamento, icon: Star, color: 'text-amber-600 bg-amber-100' },
                                          { label: 'Cases', valor: ciclo.ind6_aplicabilidade, icon: Briefcase, color: 'text-rose-600 bg-rose-100' },
                                          { label: 'Eng. Final', valor: ciclo.ind7_engajamentoFinal, icon: Trophy, color: 'text-[#F5991F] bg-orange-100' },
                                        ].map(({ label, valor, icon: Icon, color }) => (
                                          <div key={label} className="bg-gray-50 rounded-lg p-1.5 border border-gray-100 text-center">
                                            <div className={`inline-flex p-0.5 rounded ${color.split(' ')[1]} mb-0.5`}>
                                              <Icon className={`h-2.5 w-2.5 ${color.split(' ')[0]}`} />
                                            </div>
                                            <p className="text-xs font-bold text-gray-800">{(valor ?? 0).toFixed(0)}%</p>
                                            <p className="text-[8px] text-gray-500 leading-tight">{label}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {isEmAndamento && ciclo.ind1_webinars !== undefined && (
                                      <p className="text-[10px] text-blue-600 italic text-center">Indicadores parciais — baseados nos dados disponíveis até o momento</p>
                                    )}
                                    {ciclo.status === 'finalizado' && (
                                      <p className="text-[10px] text-emerald-600 text-center">Este ciclo entra no cálculo do Desempenho Geral</p>
                                    )}

                                    {/* Competências deste ciclo */}
                                    {microsDesteCiclo.length > 0 && (
                                      <div className="space-y-2">
                                        {microsDesteCiclo.map((micro: any) => renderMicro(micro))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Competências sem ciclo associado */}
                            {microsOrfaos.length > 0 && (
                              <div className="space-y-2">
                                {temCiclos && (
                                  <p className="text-xs text-gray-500 font-medium">Outras competências</p>
                                )}
                                {microsOrfaos.map((micro: any) => renderMicro(micro))}
                              </div>
                            )}

                            {/* Fallback: se não tem ciclos, mostrar todas as microJornadas */}
                            {!temCiclos && microsOrfaos.length === 0 && macroJornada.microJornadas.length > 0 && (
                              <div className="space-y-2">
                                {macroJornada.microJornadas.map((micro: any) => renderMicro(micro))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Observações do assessment */}
                      {macroJornada.observacoes && (
                        <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-gray-700">
                          <p className="font-semibold mb-1 text-gray-800">Observações da Mentora:</p>
                          <p>{macroJornada.observacoes}</p>
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
                    <Route className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma jornada de desenvolvimento definida ainda</p>
                    <p className="text-xs mt-1">Sua mentora definirá suas trilhas e competências após o assessment</p>
                  </div>
                </CardContent>
              </Card>
            )}
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

          {/* === CASES DE SUCESSO === */}
          <TabsContent value="cases" className="mt-4">
            <div className="space-y-4">
              {/* Explicação */}
              <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-800 text-sm">Case de Sucesso</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Ao final de cada trilha (Básicas, Essenciais, Master, etc.), você deve entregar um Case de Sucesso 
                        documentando a aplicação prática dos aprendizados. A entrega do case é obrigatória e impacta 
                        diretamente no seu Indicador 6 (Aplicabilidade Prática).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cards por trilha */}
              <div className="grid gap-4 md:grid-cols-2">
                {trilhasDisponiveis.map((trilha: any) => {
                  const caseEntregue = casesAluno.find((c: any) => c.trilhaId === trilha.id);
                  return (
                    <Card key={trilha.id} className={`border shadow-sm transition-all ${
                      caseEntregue?.entregue 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-white border-gray-200 hover:border-amber-300'
                    }`}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${caseEntregue?.entregue ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                              <Briefcase className={`h-4 w-4 ${caseEntregue?.entregue ? 'text-emerald-600' : 'text-gray-500'}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-gray-800">Trilha {trilha.name}</p>
                              <InfoTooltip text="Case de Sucesso: documento que comprova a aplicação prática dos aprendizados da trilha" />
                            </div>
                          </div>
                          <Badge className={caseEntregue?.entregue 
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-300' 
                            : 'bg-gray-100 text-gray-600 border-gray-300'}>
                            {caseEntregue?.entregue ? 'Entregue' : 'Pendente'}
                          </Badge>
                        </div>

                        {caseEntregue?.entregue ? (
                          <div className="space-y-2">
                            <p className="text-sm text-emerald-700 font-medium">{caseEntregue.titulo}</p>
                            {caseEntregue.descricao && (
                              <p className="text-xs text-gray-600">{caseEntregue.descricao}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Entregue em {caseEntregue.dataEntrega ? new Date(caseEntregue.dataEntrega).toLocaleDateString('pt-BR') : '-'}</span>
                            </div>
                            {caseEntregue.fileUrl && (
                              <a href={caseEntregue.fileUrl} target="_blank" rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1">
                                <FileText className="h-3.5 w-3.5" />
                                {caseEntregue.fileName || 'Ver arquivo'}
                              </a>
                            )}
                            {/* Botão para reenviar */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 text-xs"
                              onClick={() => {
                                setCaseTrilhaId(trilha.id);
                                setCaseTrilhaNome(trilha.name);
                                setCaseTitulo(caseEntregue.titulo || '');
                                setCaseDescricao(caseEntregue.descricao || '');
                                setCaseDialogOpen(true);
                              }}
                            >
                              <Upload className="h-3.5 w-3.5 mr-1" /> Atualizar Case
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-xs text-gray-500">
                              Envie seu Case de Sucesso para a trilha {trilha.name}. 
                              Formatos aceitos: PDF, DOC, DOCX, PPT, PPTX (máx. 10MB).
                            </p>
                            <Button
                              className="w-full bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white"
                              onClick={() => {
                                setCaseTrilhaId(trilha.id);
                                setCaseTrilhaNome(trilha.name);
                                setCaseTitulo('');
                                setCaseDescricao('');
                                setCaseFile(null);
                                setCaseDialogOpen(true);
                              }}
                            >
                              <FileUp className="h-4 w-4 mr-2" /> Enviar Case de Sucesso
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {trilhasDisponiveis.length === 0 && (
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardContent className="text-center py-12 text-gray-500">
                    <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma trilha disponível</p>
                    <p className="text-xs mt-1">As trilhas serão disponibilizadas pelo administrador do programa</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog de envio de Case */}
        <Dialog open={caseDialogOpen} onOpenChange={setCaseDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-amber-600" />
                Enviar Case de Sucesso
              </DialogTitle>
              <DialogDescription>
                Trilha: <strong>{caseTrilhaNome}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="case-titulo">Título do Case *</Label>
                <Input 
                  id="case-titulo" 
                  placeholder="Ex: Implementação de melhoria no processo de atendimento"
                  value={caseTitulo}
                  onChange={e => setCaseTitulo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="case-descricao">Descrição (opcional)</Label>
                <Textarea 
                  id="case-descricao" 
                  placeholder="Descreva brevemente o que foi aplicado e os resultados obtidos..."
                  value={caseDescricao}
                  onChange={e => setCaseDescricao(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Arquivo do Case *</Label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {caseFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <Paperclip className="h-5 w-5 text-amber-600" />
                      <span className="text-sm text-gray-700 font-medium">{caseFile.name}</span>
                      <span className="text-xs text-gray-500">({(caseFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Clique para selecionar o arquivo</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, PPT, PPTX (máx. 10MB)</p>
                    </div>
                  )}
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 10 * 1024 * 1024) {
                      setCaseFile(file);
                    } else if (file) {
                      alert('Arquivo muito grande. Máximo: 10MB');
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCaseDialogOpen(false)}>Cancelar</Button>
              <Button 
                className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white"
                onClick={handleCaseSubmit}
                disabled={!caseTitulo || !caseFile || enviarCase.isPending}
              >
                {enviarCase.isPending ? (
                  <><Clock className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Enviar Case</>
                )}
              </Button>
            </DialogFooter>
            {enviarCase.isError && (
              <p className="text-xs text-red-600 mt-2">{enviarCase.error?.message || 'Erro ao enviar case'}</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AlunoLayout>
  );
}
