import { useMemo, useState, useRef, useEffect } from "react";
import { formatDateSafe, formatDateCustomSafe } from "@/lib/dateUtils";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
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
  AlertTriangle, Briefcase, HelpCircle, Upload, Paperclip, FileUp, Bell, Lock, Snowflake,
  Cloud, Link2, Share2, Linkedin,
} from "lucide-react";
import { toast } from "sonner";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, PieChart, Pie,
} from "recharts";
import { InfoTooltip, GLOSSARIO, INDICADORES_INFO } from "@/components/InfoTooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DualIndicators from "@/components/DualIndicators";
import { lazy, Suspense } from "react";
const RelatorioAutoconhecimentoTab = lazy(() => import("./TesteDiscOnboarding").then(m => ({ default: m.default })));

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
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Verificar se o aluno precisa de onboarding (sem PDI ou admin liberou novo ciclo)
  const { data: onboardingStatus } = trpc.aluno.onboardingStatus.useQuery(undefined, {
    enabled: !!user && (user.role === 'user' || (user.role === 'manager' && !!(user as any).alunoId)),
  });

  useEffect(() => {
    if (onboardingStatus?.needsOnboarding) {
      setLocation('/onboarding');
    }
  }, [onboardingStatus, setLocation]);

  const { data, isLoading } = trpc.indicadores.meuDashboard.useQuery();
  const { data: jornadaData } = trpc.jornada.minha.useQuery();
  const [pdiStatusFilter, setPdiStatusFilter] = useState<"todos" | "ativo" | "congelado">("todos");
  // Filtro de indicadores: "consolidado" | "trilha:NomeTrilha" | "ciclo:CicloId"
  const [indicadorFiltro, setIndicadorFiltro] = useState<string>("consolidado");
  const [showGlossario, setShowGlossario] = useState(false);
  const [showAllTrilhasCard, setShowAllTrilhasCard] = useState(false);

  // Dados de indicadores - declarado cedo para uso nos useMemo
  const v2 = data?.found ? ((data as any).indicadoresV2 as {
    ciclosFinalizados: any[];
    ciclosEmAndamento: any[];
    consolidado: any;
    alertaCasePendente: any[];
  } | undefined) : undefined;

  // Metas de desenvolvimento do aluno (para indicador de Desenvolvimento)
  const { data: metasData } = trpc.metas.minhas.useQuery();

  // Queries para as novas abas
  const { data: myTasks } = trpc.attendance.myTasks.useQuery();
  const { data: upcomingWebinars } = trpc.webinars.upcoming.useQuery();
  const { data: pastWebinars } = trpc.webinars.past.useQuery();
  const { data: myAttendance } = trpc.attendance.myAttendance.useQuery();
  const { data: pendingWebinars } = trpc.attendance.pending.useQuery();

  // State para relato de tarefa
  const [relatoText, setRelatoText] = useState<Record<number, string>>({});
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  // State para envio de evidência
  const [evidenceLink, setEvidenceLink] = useState<Record<number, string>>({});
  const [evidenceFile, setEvidenceFile] = useState<Record<number, File | null>>({});
  const evidenceFileRef = useRef<HTMLInputElement>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState<number | null>(null);

  // State para reflexão de webinar e eventos importados
  const [reflexaoText, setReflexaoText] = useState<Record<number, string>>({});
  const [expandedWebinar, setExpandedWebinar] = useState<number | null>(null);
  const [expandedEventoImportado, setExpandedEventoImportado] = useState<number | null>(null);

  // Mutations
  const utils = trpc.useUtils();
  const submitRelato = trpc.mentor.submitRelato.useMutation({
    onSuccess: () => {
      utils.attendance.myTasks.invalidate();
      setExpandedTask(null);
    },
  });
  const submitEvidence = trpc.attendance.submitEvidence.useMutation({
    onSuccess: () => {
      utils.attendance.myTasks.invalidate();
      setEvidenceLink({});
      setEvidenceFile({});
      setTaskDetailOpen(null);
    },
  });

  const handleEvidenceSubmit = async (sessionId: number) => {
    const link = evidenceLink[sessionId];
    const file = evidenceFile[sessionId];
    if (!link && !file) return;
    let base64: string | undefined;
    let fileName: string | undefined;
    if (file) {
      const reader = new FileReader();
      const result = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      base64 = result.split(',')[1];
      fileName = file.name;
    }
    await submitEvidence.mutateAsync({
      sessionId,
      evidenceLink: link || undefined,
      evidenceImageBase64: base64,
      evidenceImageName: fileName,
    });
  };
  const markPresence = trpc.attendance.markPresence.useMutation({
    onSuccess: () => {
      utils.attendance.myAttendance.invalidate();
      utils.attendance.pending.invalidate();
      utils.indicadores.meuDashboard.invalidate();
      setExpandedWebinar(null);
      setExpandedEventoImportado(null);
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
        .filter((c: any) => c.trilhaNome === trilhaNome)
        .filter((c: any) => {
          // Excluir ciclos com apenas competências opcionais (competenciaIds vazio) do cálculo
          // total = número de competências obrigatórias no ciclo (ciclo.competenciaIds.length no backend)
          return (c.detalhes?.competencias?.total ?? 0) > 0;
        });
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

  // Item 1: Bloquear portal completo até mentora fazer assessment
  const hasAssessment = assessments && assessments.length > 0;
  const hasActiveAssessment = assessments && assessments.some((a: any) => a.status === 'ativo');

  if (!hasAssessment) {
    return (
      <AlunoLayout>
        <div className="space-y-6">
          {/* Header básico com informações do aluno */}
          <Card className="bg-gradient-to-br from-[#0A1E3E] to-[#132d54] border-0 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{aluno.name}</h1>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className="bg-white/20 text-white border-white/30">
                      <GraduationCap className="h-3 w-3 mr-1" />{aluno.programa}
                    </Badge>
                    {aluno.mentor && aluno.mentor !== 'Não definido' && (
                      <Badge className="bg-white/20 text-white border-white/30">
                        <User className="h-3 w-3 mr-1" />Mentor: {aluno.mentor}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mensagem de bloqueio */}
          <Card className="border-2 border-amber-200 bg-amber-50">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
                  <Lock className="h-10 w-10 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-amber-900">Portal em Preparação</h2>
                <p className="text-amber-800 max-w-lg">
                  Seu portal completo será liberado assim que sua mentora realizar o <strong>Assessment inicial</strong> e definir seu plano de desenvolvimento.
                </p>
                <div className="mt-4 p-4 rounded-lg bg-white border border-amber-200 max-w-md">
                  <p className="text-sm text-gray-600">
                    <strong>O que acontece agora?</strong>
                  </p>
                  <ul className="text-sm text-gray-500 mt-2 space-y-1 text-left">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Seu cadastro foi realizado com sucesso</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Seu perfil DISC foi preenchido</li>
                    <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500 shrink-0" /> Aguardando assessment da mentora</li>
                    <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-gray-400 shrink-0" /> Portal completo será liberado após o assessment</li>
                  </ul>
                </div>
                {aluno.mentor && aluno.mentor !== 'Não definido' && (
                  <p className="text-sm text-amber-700 mt-2">
                    Sua mentora <strong>{aluno.mentor}</strong> será notificada para realizar o assessment.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Aba de Autoconhecimento (DISC) - permitir acesso mesmo sem assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-primary" />
                Relatório de Autoconhecimento (DISC)
              </CardTitle>
              <CardDescription>Visualize seu perfil DISC preenchido durante o onboarding</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                <RelatorioAutoconhecimentoTab alunoId={aluno.id} onComplete={() => {}} readOnly />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </AlunoLayout>
    );
  }

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
                      <User className="h-3 w-3 mr-1" />Mentor: {aluno.mentor}
                    </Badge>
                    {assessments && assessments.length > 0 && (
                      <Badge className="bg-[#F5991F]/30 text-[#F5991F] border-[#F5991F]/40">
                        <Route className="h-3 w-3 mr-1" />{assessments.length} trilha(s) • {assessments.filter((a: any) => a.status === 'ativo').length} ativa(s)
                      </Badge>
                    )}
                  </div>
                  {/* Trilhas e Ciclos de Execução - Agrupados por Turma */}
                  {assessments && assessments.length > 0 && (() => {
                    const formatDateCard = (d: any) => {
                      if (!d) return '—';
                      if (d instanceof Date || (typeof d === 'object' && d.toISOString)) {
                        const dt = new Date(d);
                        return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
                      }
                      const str = String(d);
                      const parts = str.split('-');
                      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : str;
                    };
                    // Agrupar assessments por turma
                    const turmaGroups = new Map<string, any[]>();
                    assessments.forEach((a: any) => {
                      const key = a.turmaNome || 'Sem Turma';
                      if (!turmaGroups.has(key)) turmaGroups.set(key, []);
                      turmaGroups.get(key)!.push(a);
                    });
                    const groups = Array.from(turmaGroups.entries());
                    return (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1">
                            <Route className="h-3 w-3" /> Trilhas e Ciclos de Execução
                          </p>
                          <button
                            onClick={() => setShowAllTrilhasCard(!showAllTrilhasCard)}
                            className="text-xs text-[#F5991F] hover:text-[#F5991F]/80 flex items-center gap-1"
                          >
                            {showAllTrilhasCard ? 'Recolher' : `Expandir (${assessments.length} trilhas)`}
                            {showAllTrilhasCard ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        </div>
                        {/* Resumo compacto */}
                        {!showAllTrilhasCard && (
                          <div className="space-y-1">
                            {groups.map(([turmaName, turmaAssessments]) => (
                              <div key={turmaName} className="flex items-center gap-2 text-xs">
                                <span className="text-white/80 font-medium truncate max-w-[200px]">{turmaName}</span>
                                <span className="text-white/40">•</span>
                                <div className="flex gap-1">
                                  {turmaAssessments.map((a: any) => (
                                    <Badge key={a.id} className={`text-[9px] px-1 py-0 font-bold ${
                                      a.trilhaNome === 'Master' ? 'bg-purple-500/30 text-purple-300 border-purple-400/40' :
                                      a.trilhaNome === 'Essential' ? 'bg-blue-500/30 text-blue-300 border-blue-400/40' :
                                      a.trilhaNome === 'Basic' ? 'bg-green-500/30 text-green-300 border-green-400/40' :
                                      'bg-amber-500/30 text-amber-300 border-amber-400/40'
                                    }`}>{a.trilhaNome}</Badge>
                                  ))}
                                </div>
                                <span className="text-white/40 text-[10px]">
                                  {turmaAssessments.reduce((sum: number, a: any) => sum + (a.competencias?.length || a.totalCompetencias || 0), 0)} comp.
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Detalhes expandidos - agrupados por turma com competências */}
                        {showAllTrilhasCard && (
                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {groups.map(([turmaName, turmaAssessments]) => (
                              <div key={turmaName} className="rounded-lg bg-white/5 p-3">
                                <p className="text-xs font-bold text-white/90 mb-2 flex items-center gap-2">
                                  <Users className="h-3 w-3 text-[#F5991F]" />
                                  {turmaName}
                                </p>
                                {turmaAssessments.map((a: any) => (
                                  <div key={a.id} className="mb-2 last:mb-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge className={`text-[9px] px-1.5 py-0 font-bold ${
                                        a.trilhaNome === 'Master' ? 'bg-purple-500/30 text-purple-300 border-purple-400/40' :
                                        a.trilhaNome === 'Essential' ? 'bg-blue-500/30 text-blue-300 border-blue-400/40' :
                                        a.trilhaNome === 'Basic' ? 'bg-green-500/30 text-green-300 border-green-400/40' :
                                        'bg-amber-500/30 text-amber-300 border-amber-400/40'
                                      }`}>{a.trilhaNome}</Badge>
                                      <span className="text-[10px] text-white/50">
                                        {a.totalCompetencias} comp. ({a.obrigatorias} obrig. / {a.opcionais} opc.)
                                      </span>
                                      {a.status === 'congelado' && (
                                        <Badge className="bg-gray-500/30 text-gray-300 border-gray-400/40 text-[9px] px-1 py-0">Finalizada</Badge>
                                      )}
                                      {a.status === 'ativo' && (
                                        <Badge className="bg-emerald-500/30 text-emerald-300 border-emerald-400/40 text-[9px] px-1 py-0">Em Andamento</Badge>
                                      )}
                                    </div>
                                    {/* Tabela de competências */}
                                    {a.competencias && a.competencias.length > 0 && (
                                      <div className="ml-4 border-l border-white/10 pl-3">
                                        <table className="w-full text-[10px]">
                                          <thead>
                                            <tr className="text-white/40">
                                              <th className="text-left font-medium pb-1">Competência</th>
                                              <th className="text-left font-medium pb-1 w-[90px]">Início</th>
                                              <th className="text-left font-medium pb-1 w-[90px]">Fim</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {a.competencias.map((c: any) => (
                                              <tr key={c.id} className="text-white/70 hover:text-white/90">
                                                <td className="py-0.5 pr-2">{c.competenciaNome}</td>
                                                <td className="py-0.5 font-medium text-white/80">{formatDateCard(c.microInicio)}</td>
                                                <td className="py-0.5 font-medium text-white/80">{formatDateCard(c.microTermino)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/70 mb-1 flex items-center gap-1 justify-end">
                    Engajamento Final
                    <InfoTooltip text={INDICADORES_INFO.ind7.explicacao} className="text-white/50 hover:text-white/80" />
                  </p>
                  <div className="text-4xl font-black text-[#F5991F]">
                    {(v2Filtrado?.ind7_engajamentoFinal ?? performanceGeral).toFixed(0)}%
                  </div>
                  <Badge className={`mt-1 ${getClassificacaoBadge(v2Filtrado?.classificacao ?? indicadores.classificacao)}`}>
                    {v2Filtrado?.classificacao ?? indicadores.classificacao}
                  </Badge>
                </div>
              </div>

              {/* Explicação do Engajamento Final */}
              {v2Filtrado && (
                <div className="mt-3 p-3 rounded-lg bg-white/10 text-xs text-white/70">
                  <p className="font-semibold mb-1 text-white/90">Ind. 7 — Engajamento Final:</p>
                  <p>Média dos 5 indicadores: ({(v2Filtrado.ind1_webinars ?? 0).toFixed(0)} + {(v2Filtrado.ind2_avaliacoes ?? 0).toFixed(0)} + {(v2Filtrado.ind3_competencias ?? 0).toFixed(0)} + {(v2Filtrado.ind4_tarefas ?? 0).toFixed(0)} + {(v2Filtrado.ind5_engajamento ?? 0).toFixed(0)}) / 5 = <span className="text-[#F5991F] font-bold">{(v2Filtrado.ind7_engajamentoFinal ?? 0).toFixed(0)}%</span>{v2Filtrado.ind6_aplicabilidade > 0 ? <span className="text-green-400 ml-1">(Case entregue: +10% no Engajamento)</span> : null}</p>
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

        {/* === INDICADORES DE DESTAQUE: Engajamento e Desenvolvimento === */}
        <DualIndicators
          engajamento={
            v2?.consolidado?.ind7_engajamentoFinal ??
            performanceGeral ??
            0
          }
          desenvolvimento={
            metasData?.resumo?.percentual ?? 0
          }
          engajamentoDetalhes={
            v2?.consolidado
              ? {
                  ind1_webinars: v2.consolidado.ind1_webinars,
                  ind2_avaliacoes: v2.consolidado.ind2_avaliacoes,
                  ind3_competencias: v2.consolidado.ind3_competencias,
                  ind4_tarefas: v2.consolidado.ind4_tarefas,
                  ind5_engajamento: v2.consolidado.ind5_engajamento,
                }
              : undefined
          }
          desenvolvimentoDetalhes={
            metasData?.resumo
              ? {
                  total: metasData.resumo.total,
                  cumpridas: metasData.resumo.cumpridas,
                }
              : undefined
          }
        />

        {/* Aviso de PDI Congelado */}
        {data.pdisCongelados && data.pdisCongelados.length > 0 && (
          <Card className="bg-blue-50 border-2 border-blue-300 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-blue-100 shrink-0">
                  <Snowflake className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-blue-900 text-base flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Trilha(s) Congelada(s)
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    Este aluno possui <strong>{data.pdisCongelados.length} trilha(s) congelada(s)</strong>. 
                    Os indicadores de performance <strong>não consideram</strong> trilhas congeladas no cálculo.
                  </p>
                  <div className="mt-3 space-y-2">
                    {data.pdisCongelados.map((pdi: any) => (
                      <div key={pdi.id} className="p-2 bg-white/70 rounded-lg border border-blue-200 flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-blue-900">{pdi.trilhaNome}</span>
                          {pdi.congeladoEm && (
                            <span className="text-xs text-blue-600 ml-2">
                              (congelada em {formatDateSafe(pdi.congeladoEm)})
                            </span>
                          )}
                          {pdi.motivoCongelamento && (
                            <p className="text-xs text-blue-700 italic mt-0.5">Motivo: {pdi.motivoCongelamento}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Convite para Case de Sucesso */}
        {v2?.alertaCasePendente && v2.alertaCasePendente.length > 0 && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 shadow-md">
            <CardContent className="p-5">
              {v2.alertaCasePendente.map((alerta: any, idx: number) => (
                <div key={idx} className={`${idx > 0 ? 'mt-4 pt-4 border-t border-amber-200' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-amber-100 shrink-0">
                      <PartyPopper className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-amber-900 text-base">Compartilhe sua Experiência!</p>
                      <p className="text-sm text-amber-800 mt-2">
                        A trilha <strong>{alerta.trilhaNome}</strong> está chegando ao final! 
                        Este é o momento de documentar tudo o que você aprendeu e como aplicou na prática.
                      </p>
                      <div className="mt-3 p-3 bg-white/70 rounded-lg border border-amber-200">
                        <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-amber-600" />
                          Bônus de +10% no Engajamento
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Ao entregar o Case de Sucesso, você recebe um bônus de <strong>+10%</strong> no seu 
                          Indicador 5 (Engajamento), aumentando sua nota final. É a sua chance de valorizar 
                          ainda mais sua jornada de desenvolvimento!
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-xs text-amber-700">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            Entrega até <strong>{alerta.dataLimite ? formatDateSafe(alerta.dataLimite + 'T00:00:00') : `${alerta.diasRestantes} dias`}</strong>
                            {alerta.diasRestantes !== undefined && ` (${alerta.diasRestantes} dias restantes)`}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-[#F5991F] hover:bg-[#e08a1a] text-white font-semibold"
                          onClick={() => {
                            setCaseTrilhaId(alerta.trilhaId);
                            setCaseTrilhaNome(alerta.trilhaNome);
                            setCaseTitulo('');
                            setCaseDescricao('');
                            setCaseFile(null);
                            setCaseDialogOpen(true);
                          }}
                        >
                          <FileUp className="h-3.5 w-3.5 mr-1.5" />
                          Enviar Case
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
              numero={6} icon={Briefcase} label="Case (Bônus)"
              valor={v2Filtrado.ind6_aplicabilidade > 0 ? "Entregue ✅" : "Pendente"} total="+10% no Ind.5"
              percentual={v2Filtrado.ind6_aplicabilidade ?? 0}
              color="bg-rose-100 text-rose-600" borderColor="border-rose-200"
              regras={[INDICADORES_INFO.ind6.explicacao, INDICADORES_INFO.ind6.formula]}
            />
          </div>
        )}

        {/* Card ECO_EVOLUIR - apenas para SEBRAE TO */}
        {aluno.programa && aluno.programa.toUpperCase().includes('SEBRAE') && aluno.programa.toUpperCase().includes('TO') && (
        <a
          href="https://www.evoluirckm.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block relative overflow-hidden rounded-2xl border border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1E3E] via-[#0A1E3E]/95 to-[#0A1E3E]/80" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
          <div className="relative flex items-center gap-4 p-4 sm:p-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 backdrop-blur-sm ring-2 ring-amber-400/30 shadow-lg">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_evoluir_logo_00dbbab4.png"
                alt="ECO_EVOLUIR"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white mb-0.5">
                ECO_EVOLUIR
              </h3>
              <p className="text-xs sm:text-sm text-gray-300">
                Acesse aqui e realize seu PDI
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center group-hover:bg-amber-400 transition-colors shadow-lg">
                <ExternalLink className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </a>
        )}

        {/* Card B.E.M. - Área de Aulas */}
        <a
          href="https://sebraeto.competenciasdobem.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="block relative overflow-hidden rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white via-blue-50/80 to-amber-50/60" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
          <div className="relative flex items-center gap-4 p-4 sm:p-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white ring-2 ring-blue-100 shadow-lg p-2">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png"
                alt="eco do bem"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-[#0A1E3E] mb-0.5">
                B.E.M. - Área de Aulas
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Acesse a área de aulas e conteúdos do programa
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#0A1E3E] flex items-center justify-center group-hover:bg-[#0A1E3E]/80 transition-colors shadow-lg">
                <ExternalLink className="h-4 w-4 text-amber-400" />
              </div>
            </div>
          </div>
        </a>

        {/* Tabs com seções detalhadas */}
        <Tabs defaultValue={new URLSearchParams(window.location.search).get('tab') || 'jornada'} className="w-full">
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

            <TabsTrigger value="cursos" className="flex-1 min-w-[120px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-gray-600">
              <GraduationCap className="h-4 w-4 mr-1" /> Cursos
            </TabsTrigger>
            <TabsTrigger value="cases" className="flex-1 min-w-[120px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-gray-600">
              <Briefcase className="h-4 w-4 mr-1" /> Cases de Sucesso
            </TabsTrigger>
            <TabsTrigger value="meu-perfil-disc" className="flex-1 min-w-[120px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-gray-600">
              <Activity className="h-4 w-4 mr-1" /> Meu Perfil
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
                              {formatDateSafe(jornadaData.contrato.periodoInicio)} a {formatDateSafe(jornadaData.contrato.periodoTermino)}
                            </p>
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 font-medium mt-1">
                              Mentoria: {jornadaData.contrato.tipoMentoria === 'grupo' ? 'Em Grupo' : 'Individual'}
                            </span>
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
                    const labelMap = { todos: "Todos", ativo: "Em Andamento", congelado: "Finalizada" };
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
                            Macro Jornada: {formatDateSafe(macroJornada.macroInicio)} a {formatDateSafe(macroJornada.macroTermino)}
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
                            {macroJornada.status === "ativo" ? "Em Andamento" : "Finalizada"}
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
                              // Match por allCompetenciaIds (inclui obrigatórias + opcionais)
                              if (ciclo.allCompetenciaIds && ciclo.allCompetenciaIds.includes(micro.competenciaId)) {
                                const key = String(ciclo.cicloId || ciclo.nomeCiclo);
                                if (!microsPorCiclo.has(key)) microsPorCiclo.set(key, []);
                                microsPorCiclo.get(key)!.push(micro);
                                encontrouCiclo = true;
                                break;
                              }
                              // Fallback: match por competenciasDetalhe (apenas obrigatórias)
                              if (!encontrouCiclo && ciclo.detalhes?.competencias?.competenciasDetalhe) {
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
                            {/* Ciclos com competências integradas — ordenados do mais recente para o mais antigo */}
                            {temCiclos && [...ciclosParaMostrar]
                              .sort((a: any, b: any) => {
                                // Em andamento primeiro, depois finalizados por data decrescente
                                if (a.status === 'em_andamento' && b.status !== 'em_andamento') return -1;
                                if (a.status !== 'em_andamento' && b.status === 'em_andamento') return 1;
                                return new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime();
                              })
                              .map((ciclo: any, idx: number) => {
                              const statusColors = getCicloStatusColor(ciclo.status);
                              const isEmAndamento = ciclo.status === 'em_andamento';
                              const totalDias = isEmAndamento ? Math.max(1, Math.ceil((new Date(ciclo.dataFim).getTime() - new Date(ciclo.dataInicio).getTime()) / (1000 * 60 * 60 * 24))) : 0;
                              const diasPassados = isEmAndamento ? Math.ceil((Date.now() - new Date(ciclo.dataInicio).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                              const progressoCiclo = isEmAndamento ? Math.min(100, Math.max(0, (diasPassados / totalDias) * 100)) : 0;
                              const diasRestantes = isEmAndamento ? Math.max(0, totalDias - diasPassados) : 0;
                              const det = ciclo.detalhes || {};
                              const key = String(ciclo.cicloId || ciclo.nomeCiclo);
                              const microsDesteCiclo = microsPorCiclo.get(key) || [];
                              const temApenas1Comp = microsDesteCiclo.length === 1;
                              const microUnico = temApenas1Comp ? microsDesteCiclo[0] : null;

                              // Se tem apenas 1 competência, renderizar tudo em uma barra única
                              if (temApenas1Comp && microUnico) {
                                const aulasDisp = microUnico.aulasDisponiveis ?? 0;
                                const aulasConc = microUnico.aulasConcluidas ?? 0;
                                const aulasAnd = microUnico.aulasEmAndamento ?? 0;
                                const competenciaConcluida = aulasDisp > 0 && aulasConc >= aulasDisp;
                                const notaPlataforma = microUnico.notaPlataforma ?? 0;
                                const progressoAulas = aulasDisp > 0 ? (aulasConc / aulasDisp) * 100 : 0;
                                const nivel = microUnico.nivelAtual ?? 0;
                                const meta = microUnico.metaFinal ?? 100;
                                const barColor = competenciaConcluida ? "bg-emerald-500" : 
                                  progressoAulas >= 70 ? "bg-amber-500" : 
                                  progressoAulas > 0 ? "bg-blue-500" : "bg-gray-300";

                                return (
                                  <div key={ciclo.cicloId || idx} className={`rounded-xl border overflow-hidden ${
                                    isEmAndamento ? 'border-blue-300' : 'border-gray-200'
                                  }`}>
                                    {/* Barra única: cabeçalho + competência fundidos */}
                                    <div className={`px-4 py-3 ${
                                      isEmAndamento ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 
                                      competenciaConcluida ? 'bg-emerald-50/50' : 'bg-gray-50'
                                    }`}>
                                      {/* Linha 1: Nome + status + datas */}
                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-2.5 h-2.5 rounded-full ${statusColors.bg}`} />
                                          <span className="text-sm font-semibold text-gray-900">{ciclo.nomeCiclo}</span>
                                          {isEmAndamento && <InfoTooltip text="Este é o seu ciclo atual. Os indicadores são parciais e se atualizam conforme você avança." />}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs text-gray-500">
                                            {formatDateSafe(ciclo.dataInicio)} — {formatDateSafe(ciclo.dataFim)}
                                          </span>
                                          <Badge variant="outline" className={`text-xs ${statusColors.badge}`}>
                                            {getCicloStatusLabel(ciclo.status)}
                                          </Badge>
                                          {isEmAndamento && (
                                            <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                                              {diasRestantes} dias restantes
                                            </Badge>
                                          )}
                                          {competenciaConcluida && (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px] px-1.5 py-0">Concluída</Badge>
                                          )}
                                          {ciclo.status === 'finalizado' && !competenciaConcluida && microUnico.peso === 'obrigatoria' && (
                                            <Badge className="bg-red-100 text-red-700 border-red-300 text-[10px] px-1.5 py-0">Vencida</Badge>
                                          )}
                                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${microUnico.peso === 'obrigatoria' ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                                            {microUnico.peso === 'obrigatoria' ? 'Obrigatória' : 'Opcional'}
                                          </Badge>
                                        </div>
                                      </div>

                                      {/* Linha 2: Barra de progresso única */}
                                      <div className="flex items-center gap-2 mt-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${progressoAulas}%` }} />
                                        </div>
                                        <span className={`text-xs font-bold min-w-[35px] text-right ${competenciaConcluida ? 'text-emerald-600' : progressoAulas > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                          {progressoAulas > 0 ? `${progressoAulas.toFixed(0)}%` : '—'}
                                        </span>
                                      </div>

                                      {/* Linha 3: Métricas em linha */}
                                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[10px] text-gray-500">
                                        {aulasDisp > 0 && <span>Aulas: <strong className="text-gray-700">{aulasConc}/{aulasDisp}</strong></span>}
                                        {aulasAnd > 0 && <span>Em andamento: <strong className="text-blue-600">{aulasAnd}</strong></span>}
                                        {det.webinars && <span className="flex items-center gap-0.5"><Video className="h-2.5 w-2.5 text-blue-500" />{det.webinars.presentes || 0}/{det.webinars.total || 0} webinars</span>}
                                        {det.tarefas && <span className="flex items-center gap-0.5"><ClipboardCheck className="h-2.5 w-2.5 text-emerald-500" />{det.tarefas.entregues || 0}/{det.tarefas.total || 0} tarefas</span>}
                                        {det.avaliacoes && det.avaliacoes.provasRealizadas > 0 && <span className="flex items-center gap-0.5"><GraduationCap className="h-2.5 w-2.5 text-red-500" />{det.avaliacoes.provasRealizadas} provas</span>}
                                        {notaPlataforma > 0 && <span>Nota: <strong className={notaPlataforma >= 70 ? 'text-emerald-600' : 'text-amber-600'}>{notaPlataforma.toFixed(0)}</strong></span>}
                                        {nivel > 0 && <span>Nível Mentora: <strong className="text-gray-700">{nivel.toFixed(0)}%</strong></span>}
                                        <span>Meta: <strong className="text-gray-700">{meta > 0 ? `${meta.toFixed(0)}%` : '—'}</strong></span>
                                      </div>
                                      {microUnico.justificativa && (
                                        <div className="mt-1.5 p-1.5 rounded bg-blue-50 border border-blue-100 text-[10px] text-gray-700">
                                          <strong>Justificativa:</strong> {microUnico.justificativa}
                                        </div>
                                      )}
                                    </div>

                                  </div>
                                );
                               }
                              // Se tem múltiplas competências, manter cabeçalho do ciclo + cards individuais
                              return (
                                <div key={ciclo.cicloId || idx} className={`rounded-xl border overflow-hidden ${
                                  isEmAndamento ? 'border-blue-300' : 'border-gray-200'
                                }`}>
                                  {/* Cabeçalho do ciclo (múltiplas competências) */}
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
                                          {formatDateSafe(ciclo.dataInicio)} — {formatDateSafe(ciclo.dataFim)}
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
                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500 flex-wrap">
                                      <span>{isEmAndamento ? (det.competencias?.finalizadas || 0) : (ciclo.competenciasConcluidas || 0)} de {isEmAndamento ? (det.competencias?.total || 0) : (ciclo.totalCompetencias || 0)} competências concluídas</span>
                                      {det.webinars && <span className="flex items-center gap-0.5"><Video className="h-2.5 w-2.5 text-blue-500" />{det.webinars.presentes || 0}/{det.webinars.total || 0} webinars</span>}
                                      {det.tarefas && <span className="flex items-center gap-0.5"><ClipboardCheck className="h-2.5 w-2.5 text-emerald-500" />{det.tarefas.entregues || 0}/{det.tarefas.total || 0} tarefas</span>}
                                      {det.avaliacoes && det.avaliacoes.provasRealizadas > 0 && <span className="flex items-center gap-0.5"><GraduationCap className="h-2.5 w-2.5 text-red-500" />{det.avaliacoes.provasRealizadas} provas</span>}
                                    </div>
                                  </div>

                                  {/* Corpo: competências individuais (sem cards de indicadores repetidos) */}
                                  <div className="px-4 py-3 space-y-3">
                                    <div className="space-y-2">
                                      {microsDesteCiclo.map((micro: any) => renderMicro(micro))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Competências sem ciclo associado (fallback) */}
                            {microsOrfaos.length > 0 && (
                              <div className="space-y-2">
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

                      {/* Observações do assessment - ocultas para o aluno (campo interno da mentora) */}
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
            {/* Alerta: Faltam X mentorias para finalizar */}
            {jornadaData?.saldo && jornadaData.saldo.saldoRestante > 0 && (
              <div className="mb-4 p-4 rounded-xl border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <Bell className="h-6 w-6 text-blue-700" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-blue-900">
                    Faltam <span className="text-xl font-bold text-blue-700">{jornadaData.saldo.saldoRestante}</span> mentoria{jornadaData.saldo.saldoRestante !== 1 ? 's' : ''} para finalizar a sua jornada!
                  </p>
                  <p className="text-sm text-blue-700/80 mt-0.5">
                    Você já realizou {jornadaData.saldo.sessoesRealizadas} de {jornadaData.saldo.totalContratadas} sessões contratadas ({jornadaData.saldo.percentualUsado}% concluído)
                  </p>
                </div>
                <div className="w-16 h-16 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e0e7ff" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${jornadaData.saldo.percentualUsado}, 100`} strokeLinecap="round" />
                    <text x="18" y="20.5" textAnchor="middle" className="text-[0.5rem] font-bold fill-blue-700">{jornadaData.saldo.percentualUsado}%</text>
                  </svg>
                </div>
              </div>
            )}
            {jornadaData?.saldo && jornadaData.saldo.saldoRestante === 0 && (
              <div className="mb-4 p-4 rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 flex items-center gap-4">
                <div className="p-3 rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-6 w-6 text-emerald-700" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-emerald-900">
                    Parabéns! Você completou todas as {jornadaData.saldo.totalContratadas} mentorias da sua jornada!
                  </p>
                </div>
              </div>
            )}

            {/* Card do Perfil do Mentor */}
            {aluno.mentorId && <MentorProfileCard mentorId={aluno.mentorId} mentorName={aluno.mentor} />}

            {/* Agendamento de Sessão + Convites de Grupo */}
            {aluno.mentorId && <AlunoAgendamentoSection alunoId={aluno.id} consultorId={aluno.mentorId} mentorName={aluno.mentor} />}

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
                                {sessao.sessionDate ? formatDateCustomSafe(sessao.sessionDate, { day: "2-digit", month: "long", year: "numeric" }) : "Data não registrada"}
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
                              <TrendingUp className="h-3.5 w-3.5" />Evolução: {sessao.notaEvolucao}/10
                            </div>
                          )}
                        </div>
                        {/* Descritivo da nota de evolução + feedback da mentora */}
                        {(sessao.notaEvolucao || sessao.mensagemAluno) && (
                          <div className="mt-2 ml-11 space-y-1.5">
                            {sessao.notaEvolucao && (() => {
                              const nota = sessao.notaEvolucao;
                              const descritivos: Record<number, { titulo: string; descricao: string; cor: string; bgCor: string; borderCor: string; icone: string }> = {
                                1: {
                                  titulo: "Fase Inicial",
                                  descricao: "O(a) aluno(a) está no início da sua jornada de desenvolvimento. Neste estágio, é natural que haja um período de adaptação ao processo de mentoria. O foco deve ser em compreender as expectativas, estabelecer uma relação de confiança com a mentora e identificar as principais áreas de desenvolvimento.",
                                  cor: "text-red-700", bgCor: "bg-red-50", borderCor: "border-red-200", icone: "🌱"
                                },
                                2: {
                                  titulo: "Em Adaptação",
                                  descricao: "O(a) aluno(a) demonstra os primeiros sinais de engajamento com o processo. Está começando a compreender a dinâmica da mentoria e a identificar seus pontos de melhoria. É importante manter a consistência na participação e buscar aplicar as orientações recebidas no dia a dia profissional.",
                                  cor: "text-red-600", bgCor: "bg-red-50", borderCor: "border-red-200", icone: "🌿"
                                },
                                3: {
                                  titulo: "Desenvolvimento Inicial",
                                  descricao: "O(a) aluno(a) está construindo uma base sólida para seu crescimento. Já demonstra compreensão dos conceitos trabalhados e começa a aplicar algumas práticas sugeridas pela mentora. O próximo passo é aprofundar o comprometimento com as atividades e buscar maior consistência na execução das ações de desenvolvimento.",
                                  cor: "text-orange-700", bgCor: "bg-orange-50", borderCor: "border-orange-200", icone: "📊"
                                },
                                4: {
                                  titulo: "Progresso Gradual",
                                  descricao: "O(a) aluno(a) apresenta evolução perceptível em relação ao início da jornada. Demonstra maior engajamento nas sessões, participa ativamente das discussões e começa a traduzir os aprendizados em ações concretas. Recomenda-se intensificar a prática das competências trabalhadas e manter o ritmo de desenvolvimento.",
                                  cor: "text-orange-600", bgCor: "bg-orange-50", borderCor: "border-orange-200", icone: "📈"
                                },
                                5: {
                                  titulo: "Intermediário",
                                  descricao: "O(a) aluno(a) atingiu um nível intermediário de desenvolvimento. Demonstra boa compreensão dos temas abordados, participa com regularidade e já consegue aplicar parte significativa dos aprendizados em seu contexto profissional. Para avançar ao próximo nível, é importante buscar maior profundidade na aplicação prática e assumir desafios mais complexos.",
                                  cor: "text-amber-700", bgCor: "bg-amber-50", borderCor: "border-amber-200", icone: "⭐"
                                },
                                6: {
                                  titulo: "Bom Progresso",
                                  descricao: "O(a) aluno(a) demonstra consistência no seu desenvolvimento e já apresenta resultados visíveis na aplicação das competências trabalhadas. Mostra proatividade nas sessões, entrega as atividades com qualidade e busca feedback para aprimoramento contínuo. Está no caminho certo para alcançar um nível avançado de maturidade profissional.",
                                  cor: "text-amber-600", bgCor: "bg-amber-50", borderCor: "border-amber-200", icone: "🌟"
                                },
                                7: {
                                  titulo: "Avançado",
                                  descricao: "O(a) aluno(a) apresenta um nível avançado de desenvolvimento. Demonstra domínio dos conceitos trabalhados, aplica os aprendizados de forma autônoma e consistente, e já é capaz de identificar oportunidades de melhoria por conta própria. Sua postura é madura, engajada e orientada a resultados. Continue investindo no aprofundamento das competências para alcançar a excelência.",
                                  cor: "text-blue-700", bgCor: "bg-blue-50", borderCor: "border-blue-200", icone: "🚀"
                                },
                                8: {
                                  titulo: "Muito Avançado",
                                  descricao: "O(a) aluno(a) se destaca pelo alto nível de comprometimento e evolução. Aplica os aprendizados com excelência, demonstra pensamento crítico e estratégico, e já influencia positivamente seu ambiente de trabalho. Sua capacidade de autoavaliação e busca por melhoria contínua são notáveis. Está muito próximo(a) de atingir o nível de excelência em sua jornada.",
                                  cor: "text-blue-600", bgCor: "bg-blue-50", borderCor: "border-blue-200", icone: "🏆"
                                },
                                9: {
                                  titulo: "Excelência",
                                  descricao: "O(a) aluno(a) atingiu um nível de excelência em seu desenvolvimento. Demonstra maestria nas competências trabalhadas, é referência para colegas e contribui ativamente para o crescimento da equipe. Sua jornada de mentoria é um exemplo de dedicação, consistência e transformação profissional. Recomenda-se que assuma papéis de liderança e multiplicação do conhecimento.",
                                  cor: "text-emerald-700", bgCor: "bg-emerald-50", borderCor: "border-emerald-200", icone: "🎖️"
                                },
                                10: {
                                  titulo: "Desempenho Excepcional",
                                  descricao: "O(a) aluno(a) alcançou o nível máximo de evolução. Representa o mais alto padrão de desenvolvimento dentro do programa de mentoria. Demonstra liderança, visão estratégica, autonomia plena e capacidade de inspirar e desenvolver outras pessoas. Sua transformação ao longo da jornada é excepcional e merece reconhecimento. Parabéns pelo resultado extraordinário!",
                                  cor: "text-emerald-600", bgCor: "bg-emerald-50", borderCor: "border-emerald-200", icone: "👑"
                                },
                              };
                              const desc = descritivos[nota] || descritivos[5];
                              return (
                                <div className={`p-3 rounded-lg ${desc.bgCor} border ${desc.borderCor}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-base">{desc.icone}</span>
                                    <span className={`text-xs font-bold ${desc.cor}`}>Evolução {nota}/10 — {desc.titulo}</span>
                                  </div>
                                  <p className="text-xs text-gray-700 leading-relaxed">{desc.descricao}</p>
                                </div>
                              );
                            })()}
                            {sessao.mensagemAluno && (
                              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <MessageSquare className="h-3.5 w-3.5 text-blue-700" />
                                  <span className="text-xs font-bold text-blue-800">Feedback da Mentora</span>
                                </div>
                                <p className="text-xs text-gray-700 leading-relaxed italic">"{sessao.mensagemAluno}"</p>
                              </div>
                            )}
                          </div>
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

          {/* === EVENTOS - LISTA UNIFICADA === */}
          <TabsContent value="eventos" className="mt-4">
            <div className="space-y-6">
              {/* Resumo com contadores visuais - usa apenas eventos dentro do macrociclo */}
              {(() => {
                const eventosDentro = pendingWebinars?.events?.filter((e: any) => e.dentroDoMacrociclo) || [];
                const presencasDentro = eventosDentro.filter((e: any) => e.status === 'presente').length;
                const totalDentro = eventosDentro.length;
                const ausenciasDentro = totalDentro - presencasDentro;
                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200">
                        <CardContent className="p-4 text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-200/60 mb-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                          </div>
                          <p className="text-2xl font-bold text-emerald-800">{presencasDentro}</p>
                          <p className="text-xs text-emerald-600 font-medium">Presenças</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200">
                        <CardContent className="p-4 text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-200/60 mb-2">
                            <XCircle className="h-5 w-5 text-red-700" />
                          </div>
                          <p className="text-2xl font-bold text-red-800">{ausenciasDentro}</p>
                          <p className="text-xs text-red-600 font-medium">Ausências</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
                        <CardContent className="p-4 text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-200/60 mb-2">
                            <Video className="h-5 w-5 text-blue-700" />
                          </div>
                          <p className="text-2xl font-bold text-blue-800">{totalDentro}</p>
                          <p className="text-xs text-blue-600 font-medium">Total de Eventos</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Explicação da lógica de cálculo */}
                    {pendingWebinars?.periodoInicio && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex-shrink-0 mt-0.5">
                          <Info className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-xs text-blue-800 space-y-1">
                          <p>
                            <span className="font-semibold">Como funciona o cálculo:</span> Os indicadores acima consideram apenas os eventos dentro do seu período de avaliação:{" "}
                            <span className="font-bold">{formatDateSafe(pendingWebinars.periodoInicio)}</span>
                            {" "}a{" "}
                            <span className="font-bold">{pendingWebinars.periodoFim ? formatDateSafe(pendingWebinars.periodoFim) : "atual"}</span>.
                          </p>
                          <p className="text-blue-700">
                            Eventos realizados fora deste período aparecem na lista abaixo para que você possa assistir, mas <strong>não impactam sua nota de performance</strong> (não penalizam como ausência e não pontuam como presença).
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Dica informativa */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex-shrink-0 mt-0.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-xs text-amber-800">
                  <span className="font-semibold">Dica:</span> Se você não assistiu ao vivo, pode assistir a gravação e marcar presença a qualquer momento. Clique em &quot;Assistir&quot; para ver o vídeo e depois em &quot;Marcar Presença&quot;.
                </p>
              </div>

              {/* === LISTA UNIFICADA DE EVENTOS === */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0A1E3E]">
                      <Video className="h-3.5 w-3.5 text-white" />
                    </div>
                    Meus Eventos
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-xs">
                    Todos os eventos do seu programa. Assista a gravação e marque presença nos eventos com status Ausente.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingWebinars?.events && pendingWebinars.events.length > 0 ? (
                    <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
                      {pendingWebinars.events.map((evt: any) => (
                        <div key={evt.eventId} className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                          !evt.dentroDoMacrociclo
                            ? "bg-gradient-to-r from-gray-50/50 to-gray-50/30 border-gray-200 opacity-70 hover:opacity-90"
                            : evt.status === "ausente"
                              ? "bg-gradient-to-r from-red-50/50 to-white border-red-200 hover:shadow-sm"
                              : "bg-gradient-to-r from-emerald-50/30 to-white border-emerald-100 hover:shadow-sm"
                        }`}>
                          <div className="flex items-center gap-3 p-3">
                            {/* Ícone de status */}
                            <div className="flex-shrink-0">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                                evt.status === "presente" ? "bg-emerald-100" : "bg-red-100"
                              }`}>
                                {evt.status === "presente" ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                            </div>

                            {/* Nome e Data */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium leading-tight ${!evt.dentroDoMacrociclo ? 'text-gray-500' : 'text-gray-900'}`}>{evt.title}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {evt.eventDate && (
                                  <span className="text-xs text-gray-500">
                                    {formatDateCustomSafe(evt.eventDate, { day: "2-digit", month: "short", year: "numeric" })}
                                  </span>
                                )}
                                {!evt.dentroDoMacrociclo && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                    <Clock className="h-2.5 w-2.5" />
                                    Fora do período de avaliação
                                  </span>
                                )}
                              </div>
                              {evt.status === "presente" && evt.selfReportedAt && (
                                <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Presença confirmada em {formatDateSafe(evt.selfReportedAt)}
                                </p>
                              )}
                            </div>

                            {/* Botões: Assistir + Status/Marcar Presença */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Botão Assistir ou aviso de link em breve */}
                              {evt.videoLink ? (
                                <a
                                  href={evt.videoLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                                >
                                  <Play className="h-3 w-3" /> Assistir
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
                                  <Clock className="h-3 w-3" /> Link em breve
                                </span>
                              )}

                              {/* Status Badge + Botão Marcar Presença */}
                              {evt.status === "presente" ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-medium">
                                  Presente
                                </Badge>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-red-100 text-red-700 border-red-200 font-medium">
                                    Ausente
                                  </Badge>
                                  {evt.videoLink && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setExpandedWebinar(expandedWebinar === evt.eventId ? null : evt.eventId)}
                                      className={expandedWebinar === evt.eventId
                                        ? "border-gray-300 text-gray-600 text-xs"
                                        : "border-[#F5991F] text-[#F5991F] hover:bg-[#F5991F]/10 text-xs"
                                      }
                                    >
                                      {expandedWebinar === evt.eventId ? "Fechar" : "Marcar Presença"}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Compartilhar no LinkedIn - aparece para eventos com presença confirmada e videoLink */}
                          {evt.status === "presente" && evt.videoLink && (
                            <div className="px-4 pb-3 border-t border-emerald-100 bg-emerald-50/30">
                              <div className="flex items-center justify-between pt-2.5">
                                <p className="text-xs text-gray-600">
                                  <span className="font-medium text-gray-700">Assistiu este curso?</span> Compartilhe com os amigos, conte o que achou!
                                </p>
                                <a
                                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(evt.videoLink)}&title=${encodeURIComponent(`Acabei de assistir: ${evt.title} \n\nRecomendo demais! Assista também pelo link abaixo. \n\n#ecolider #desenvolvimento #ckmtalents @dinamakiyama`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-[#0A66C2] hover:bg-[#004182] px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                >
                                  <Linkedin className="h-3.5 w-3.5" />
                                  Compartilhar no LinkedIn
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Formulário de marcação de presença (expandido) */}
                          {evt.status === "ausente" && expandedWebinar === evt.eventId && (
                            <div className="px-4 pb-4 space-y-3 border-t border-red-100 bg-white/80">
                              {evt.videoLink && (
                                <div className="flex items-center gap-2 pt-3 pb-1">
                                  <Play className="h-4 w-4 text-blue-600" />
                                  <a href={evt.videoLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-medium">
                                    Clique aqui para assistir a gravação antes de marcar presença
                                  </a>
                                </div>
                              )}
                              <p className={`text-xs text-gray-600 ${!evt.videoLink ? 'pt-3' : ''}`}>Escreva uma reflexão sobre o evento (mínimo 20 caracteres):</p>
                              <Textarea
                                placeholder="O que você aprendeu neste evento? Como pretende aplicar no seu dia a dia?"
                                value={reflexaoText[evt.eventId] || ""}
                                onChange={(e) => setReflexaoText(prev => ({ ...prev, [evt.eventId]: e.target.value }))}
                                className="border-gray-200 focus:border-amber-400 text-gray-900 text-sm min-h-[80px] bg-white"
                              />
                              <div className="flex items-center gap-3">
                                <Button
                                  size="sm"
                                  onClick={() => markPresence.mutate({ eventId: evt.eventId, reflexao: reflexaoText[evt.eventId] || "" })}
                                  disabled={!reflexaoText[evt.eventId] || reflexaoText[evt.eventId].length < 20 || markPresence.isPending}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <Send className="h-3 w-3 mr-1.5" />
                                  {markPresence.isPending ? "Enviando..." : "Confirmar Presença"}
                                </Button>
                                {reflexaoText[evt.eventId] && reflexaoText[evt.eventId].length < 20 && (
                                  <p className="text-xs text-amber-600">{20 - (reflexaoText[evt.eventId]?.length || 0)} caracteres restantes</p>
                                )}
                              </div>
                              {markPresence.isError && (
                                <p className="text-xs text-red-600">{markPresence.error?.message || "Erro ao marcar presença"}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Video className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">Nenhum evento registrado ainda</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>


          {/* === TAREFAS PRÁTICAS === */}
          <TabsContent value="tarefas" className="mt-4">
            {/* Cards de Resumo de Tarefas */}
            {(() => {
              const sessoesComTarefa = sessoes.filter((s: any) => s.taskStatus && s.taskStatus !== 'sem_tarefa' && s.sessionNumber !== 1);
              const totalTarefas = sessoesComTarefa.length;
              const entregues = sessoesComTarefa.filter((s: any) => s.taskStatus === 'entregue').length;
              const validadas = sessoesComTarefa.filter((s: any) => s.taskStatus === 'validada').length;
              const pendentes = sessoesComTarefa.filter((s: any) => s.taskStatus === 'nao_entregue').length;
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <Card className="bg-blue-50 border border-blue-200 shadow-sm">
                    <CardContent className="pt-5 pb-5 flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                        <ClipboardCheck className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{totalTarefas}</p>
                      <p className="text-xs text-blue-700 font-medium">Total de Tarefas</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50 border border-amber-200 shadow-sm">
                    <CardContent className="pt-5 pb-5 flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <p className="text-2xl font-bold text-amber-900">{pendentes}</p>
                      <p className="text-xs text-amber-700 font-medium">Pendentes</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-emerald-50 border border-emerald-200 shadow-sm">
                    <CardContent className="pt-5 pb-5 flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <p className="text-2xl font-bold text-emerald-900">{entregues}</p>
                      <p className="text-xs text-emerald-700 font-medium">Entregues</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 border border-purple-200 shadow-sm">
                    <CardContent className="pt-5 pb-5 flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                        <Award className="h-5 w-5 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-purple-900">{validadas}</p>
                      <p className="text-xs text-purple-700 font-medium">Validadas</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Instrução sobre envio de tarefas na nuvem */}
            <Card className="bg-blue-50 border border-blue-200 shadow-sm mb-4">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <Cloud className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-2">
                      <Share2 className="h-4 w-4" /> Como enviar suas atividades
                    </p>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Salve sua atividade na nuvem (Google Drive, OneDrive, Dropbox ou outro serviço de armazenamento) e 
                      <strong> compartilhe o arquivo com o e-mail do(a) seu(sua) mentor(a)</strong> para que ele(a) possa abrir e analisar.
                      {aluno.mentorEmail && (
                        <span className="block mt-1.5 p-2 bg-white/60 rounded border border-blue-200">
                          <strong>E-mail do(a) mentor(a):</strong>{" "}
                          <a href={`mailto:${aluno.mentorEmail}`} className="text-blue-700 font-medium hover:underline">{aluno.mentorEmail}</a>
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-blue-700 mt-1.5 italic">
                      Depois de compartilhar, cole o link do arquivo no campo abaixo para registrar a entrega.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumo de atividades por sessão */}
            <Card className="bg-white border border-gray-200 shadow-sm mb-4">
              <CardHeader>
                <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-[#F5991F]" />
                  Atividades por Sessão de Mentoria
                </CardTitle>
                <CardDescription className="text-gray-500">
                  {(() => {
                    const sessoesComTarefa = sessoes.filter((s: any) => s.taskStatus && s.taskStatus !== 'sem_tarefa' && s.sessionNumber !== 1);
                    const entregues = sessoesComTarefa.filter((s: any) => s.taskStatus === 'entregue' || s.taskStatus === 'validada');
                    return `${entregues.length} de ${sessoesComTarefa.length} atividades entregues`;
                  })()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessoes && sessoes.length > 0 ? (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                    {sessoes.map((sessao: any, idx: number) => {
                      const isAssessment = sessao.sessionNumber === 1;
                      const taskStatusConfig = sessao.taskStatus === 'validada'
                        ? { label: 'Validada', className: 'bg-purple-50 text-purple-700 border-purple-300', icon: <Award className="h-3 w-3" />, color: 'border-l-purple-500' }
                        : sessao.taskStatus === 'entregue'
                        ? { label: 'Entregue', className: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: <CheckCircle2 className="h-3 w-3" />, color: 'border-l-emerald-500' }
                        : sessao.taskStatus === 'nao_entregue'
                        ? { label: 'Não Entregue', className: 'bg-red-50 text-red-700 border-red-300', icon: <XCircle className="h-3 w-3" />, color: 'border-l-red-500' }
                        : { label: 'Sem Tarefa', className: 'bg-gray-100 text-gray-600 border-gray-300', icon: <Minus className="h-3 w-3" />, color: 'border-l-gray-300' };

                      return (
                        <div key={sessao.id || idx} className={`p-3 rounded-lg bg-gray-50 border border-gray-100 border-l-4 ${taskStatusConfig.color} hover:bg-gray-100 transition-colors`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                                {sessao.sessionNumber || idx + 1}
                              </div>
                              <div>
                                <p className="text-sm text-gray-900 font-medium">
                                  Sessão {sessao.sessionNumber || idx + 1}
                                  {isAssessment && <Badge className="ml-2 text-xs bg-amber-100 text-amber-700 border-amber-300">Assessment</Badge>}
                                  {sessao.ciclo && <span className="text-gray-500 ml-2 text-xs">• Ciclo {sessao.ciclo}</span>}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {sessao.sessionDate ? formatDateCustomSafe(sessao.sessionDate, { day: "2-digit", month: "long", year: "numeric" }) : "Data não registrada"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={taskStatusConfig.className}>
                                <span className="flex items-center gap-1">{taskStatusConfig.icon} {isAssessment ? 'Assessment' : taskStatusConfig.label}</span>
                              </Badge>
                              {/* Botão de envio de link para sessões pendentes */}
                              {!isAssessment && sessao.taskStatus === 'nao_entregue' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setTaskDetailOpen(sessao.id)}
                                  className="text-[#F5991F] border-[#F5991F] hover:bg-[#F5991F]/10 text-xs"
                                >
                                  <Link2 className="h-3 w-3 mr-1" /> Enviar Link
                                </Button>
                              )}
                              {!isAssessment && (sessao.taskStatus === 'entregue' || sessao.taskStatus === 'validada') && sessao.evidenceLink && (
                                <a href={sessao.evidenceLink} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 text-xs">
                                    <ExternalLink className="h-3 w-3 mr-1" /> Ver Link
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Dialog de envio de link para a sessão */}
                          <Dialog open={taskDetailOpen === sessao.id} onOpenChange={(open) => { if (!open) setTimeout(() => setTaskDetailOpen(null), 100); }}>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle className="text-gray-900 flex items-center gap-2">
                                  <Link2 className="h-5 w-5 text-[#F5991F]" />
                                  Enviar Atividade — Sessão {sessao.sessionNumber}
                                </DialogTitle>
                                <DialogDescription className="text-gray-500">
                                  {sessao.sessionDate ? formatDateCustomSafe(sessao.sessionDate, { day: "2-digit", month: "long", year: "numeric" }) : ""}
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4">
                                {/* Instrução de compartilhamento na nuvem */}
                                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                                  <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center gap-2">
                                    <Cloud className="h-4 w-4" /> Instruções de envio
                                  </p>
                                  <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                                    <li>Salve sua atividade na nuvem (Google Drive, OneDrive, Dropbox, etc.)</li>
                                    <li>Compartilhe o arquivo com o e-mail do(a) seu(sua) mentor(a){aluno.mentorEmail ? `: ` : ''}
                                      {aluno.mentorEmail && <strong className="text-blue-900">{aluno.mentorEmail}</strong>}
                                    </li>
                                    <li>Copie o link de compartilhamento e cole no campo abaixo</li>
                                  </ol>
                                </div>

                                {/* Campo de link */}
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-700 flex items-center gap-1">
                                    <Link2 className="h-3 w-3" /> Link do arquivo na nuvem
                                  </Label>
                                  <Input
                                    type="url"
                                    placeholder="https://drive.google.com/... ou https://onedrive.live.com/..."
                                    value={evidenceLink[sessao.id] || ''}
                                    onChange={(e) => setEvidenceLink(prev => ({ ...prev, [sessao.id]: e.target.value }))}
                                    className="text-sm"
                                  />
                                </div>

                                {/* Campo de imagem opcional */}
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-700">Imagem de evidência (opcional, máx 5MB: JPG, PNG, WebP)</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/jpeg,image/png,image/webp';
                                        input.onchange = (e: any) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            if (file.size > 5 * 1024 * 1024) {
                                              alert('Imagem deve ter no máximo 5MB');
                                              return;
                                            }
                                            setEvidenceFile(prev => ({ ...prev, [sessao.id]: file }));
                                          }
                                        };
                                        input.click();
                                      }}
                                      className="text-xs"
                                    >
                                      <Paperclip className="h-3 w-3 mr-1" /> Anexar Imagem
                                    </Button>
                                    {evidenceFile[sessao.id] && (
                                      <span className="text-xs text-gray-600 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                        {evidenceFile[sessao.id]!.name}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Relato opcional */}
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-700">Relato (opcional)</Label>
                                  <Textarea
                                    placeholder="Descreva como foi a realização desta atividade..."
                                    value={relatoText[sessao.id] || ''}
                                    onChange={(e) => setRelatoText(prev => ({ ...prev, [sessao.id]: e.target.value }))}
                                    className="text-sm min-h-[60px] overflow-auto"
                                  />
                                </div>

                                {/* Botão de envio */}
                                <Button
                                  onClick={async () => {
                                    if (relatoText[sessao.id]) {
                                      await submitRelato.mutateAsync({ sessionId: sessao.id, relatoAluno: relatoText[sessao.id] });
                                    }
                                    await handleEvidenceSubmit(sessao.id);
                                    toast.success('Atividade enviada com sucesso!');
                                    setTimeout(() => setTaskDetailOpen(null), 100);
                                  }}
                                  disabled={(!evidenceLink[sessao.id] && !evidenceFile[sessao.id]) || submitEvidence.isPending}
                                  className="w-full bg-[#F5991F] hover:bg-[#F5991F]/90 text-white"
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  {submitEvidence.isPending ? 'Enviando...' : 'Enviar Atividade'}
                                </Button>
                                {submitEvidence.isError && (
                                  <p className="text-xs text-red-600">{submitEvidence.error?.message}</p>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma sessão de mentoria registrada ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tarefas Práticas atribuídas (da biblioteca de tarefas) */}
            {myTasks && myTasks.length > 0 && (
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-[#F5991F]" />
                  Tarefas Práticas Atribuídas
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Atividades específicas atribuídas pela sua mentora com detalhes e instruções
                </CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {myTasks.map((task: any) => {
                      const statusConfig = task.taskStatus === 'validada'
                        ? { label: 'Validada', className: 'bg-purple-50 text-purple-700 border-purple-300', icon: <Award className="h-3 w-3" /> }
                        : task.taskStatus === 'entregue'
                        ? { label: 'Entregue', className: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: <CheckCircle2 className="h-3 w-3" /> }
                        : task.taskStatus === 'nao_entregue'
                        ? { label: 'Pendente', className: 'bg-amber-50 text-amber-700 border-amber-300', icon: <Clock className="h-3 w-3" /> }
                        : { label: 'Sem Tarefa', className: 'bg-gray-100 text-gray-600 border-gray-300', icon: <Minus className="h-3 w-3" /> };
                      const isOverdue = task.taskDeadline && task.taskStatus !== 'validada' && task.taskStatus !== 'entregue' && new Date(task.taskDeadline) < new Date();
                      return (
                        <div key={task.sessionId} className={`p-4 rounded-lg border transition-colors ${isOverdue ? 'bg-red-50/50 border-red-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm font-medium text-gray-900">{task.taskName}</span>
                                <Badge variant="outline" className={statusConfig.className}>
                                  <span className="flex items-center gap-1">{statusConfig.icon} {statusConfig.label}</span>
                                </Badge>
                                {isOverdue && (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                                    <AlertTriangle className="h-3 w-3 mr-1" /> Atrasada
                                  </Badge>
                                )}
                              </div>
                              {task.taskCompetencia && (
                                <p className="text-xs text-blue-600 mb-1">Competência: {task.taskCompetencia}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                Sessão {task.sessionNumber} • {task.sessionDate ? formatDateSafe(task.sessionDate) : ""}
                                {task.taskDeadline && (<> • Prazo: <span className={isOverdue ? 'text-red-600 font-medium' : ''}>{formatDateSafe(task.taskDeadline)}</span></>)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {task.taskStatus === 'nao_entregue' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setTaskDetailOpen(task.sessionId)}
                                  className="text-[#F5991F] border-[#F5991F] hover:bg-[#F5991F]/10 text-xs"
                                >
                                  <Upload className="h-3 w-3 mr-1" /> Entregar
                                </Button>
                              )}
                              {(task.taskStatus === 'entregue' || task.taskStatus === 'validada') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setTaskDetailOpen(task.sessionId)}
                                  className="text-gray-600 hover:text-gray-900 text-xs"
                                >
                                  <FileText className="h-3 w-3 mr-1" /> {task.taskStatus === 'validada' ? 'Ver Feedback' : 'Ver Envio'}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedTask(expandedTask === task.sessionId ? null : task.sessionId)}
                                className="text-gray-500 hover:text-gray-900"
                              >
                                {expandedTask === task.sessionId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </div>
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
                            </div>
                          )}

                          {/* Dialog de Detalhe da Tarefa */}
                          <Dialog open={taskDetailOpen === task.sessionId} onOpenChange={(open) => { if (!open) setTimeout(() => setTaskDetailOpen(null), 100); }}>
                            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-gray-900 flex items-center gap-2">
                                  <ClipboardCheck className="h-5 w-5 text-[#F5991F]" />
                                  {task.taskName}
                                </DialogTitle>
                                <DialogDescription className="text-gray-500">
                                  Sessão {task.sessionNumber} • {task.taskCompetencia}
                                  {task.taskDeadline && (<> • Prazo: {formatDateSafe(task.taskDeadline)}</>)}
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4">
                                {/* Instruções */}
                                {task.taskOQueFazer && (
                                  <div className="p-3 rounded bg-blue-50 border border-blue-100">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">O que fazer:</p>
                                    <p className="text-xs text-gray-600">{task.taskOQueFazer}</p>
                                  </div>
                                )}

                                {/* Instrução de compartilhamento na nuvem */}
                                {task.taskStatus === 'nao_entregue' && (
                                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                                    <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center gap-2">
                                      <Cloud className="h-4 w-4" /> Lembre-se
                                    </p>
                                    <p className="text-xs text-blue-800">
                                      Salve o arquivo na nuvem e compartilhe com {aluno.mentorEmail ? <strong>{aluno.mentorEmail}</strong> : 'o e-mail do(a) seu(sua) mentor(a)'}.
                                    </p>
                                  </div>
                                )}

                                {/* Status */}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-700">Status:</span>
                                  <Badge variant="outline" className={statusConfig.className}>
                                    <span className="flex items-center gap-1">{statusConfig.icon} {statusConfig.label}</span>
                                  </Badge>
                                </div>

                                {/* Se PENDENTE: formulário de envio */}
                                {task.taskStatus === 'nao_entregue' && (
                                  <div className="space-y-3 p-4 rounded-lg bg-amber-50/50 border border-amber-200">
                                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                      <Upload className="h-4 w-4 text-[#F5991F]" /> Enviar Evidência
                                    </h4>
                                    <div className="space-y-2">
                                      <Label className="text-xs text-gray-700 flex items-center gap-1">
                                        <Link2 className="h-3 w-3" /> Link do arquivo na nuvem
                                      </Label>
                                      <Input
                                        type="url"
                                        placeholder="https://drive.google.com/... ou https://onedrive.live.com/..."
                                        value={evidenceLink[task.sessionId] || ''}
                                        onChange={(e) => setEvidenceLink(prev => ({ ...prev, [task.sessionId]: e.target.value }))}
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs text-gray-700">Imagem (opcional, máx 5MB: JPG, PNG, WebP)</Label>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/jpeg,image/png,image/webp';
                                            input.onchange = (e: any) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                if (file.size > 5 * 1024 * 1024) {
                                                  alert('Imagem deve ter no máximo 5MB');
                                                  return;
                                                }
                                                setEvidenceFile(prev => ({ ...prev, [task.sessionId]: file }));
                                              }
                                            };
                                            input.click();
                                          }}
                                          className="text-xs"
                                        >
                                          <Paperclip className="h-3 w-3 mr-1" /> Anexar Imagem
                                        </Button>
                                        {evidenceFile[task.sessionId] && (
                                          <span className="text-xs text-gray-600 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                            {evidenceFile[task.sessionId]!.name}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs text-gray-700">Relato (opcional)</Label>
                                      <Textarea
                                        placeholder="Descreva como foi a realização desta tarefa..."
                                        value={relatoText[task.sessionId] || ''}
                                        onChange={(e) => setRelatoText(prev => ({ ...prev, [task.sessionId]: e.target.value }))}
                                        className="text-sm min-h-[60px]"
                                      />
                                    </div>
                                    <Button
                                      onClick={async () => {
                                        if (relatoText[task.sessionId]) {
                                          await submitRelato.mutateAsync({ sessionId: task.sessionId, relatoAluno: relatoText[task.sessionId] });
                                        }
                                        await handleEvidenceSubmit(task.sessionId);
                                      }}
                                      disabled={(!evidenceLink[task.sessionId] && !evidenceFile[task.sessionId]) || submitEvidence.isPending}
                                      className="w-full bg-[#F5991F] hover:bg-[#F5991F]/90 text-white"
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      {submitEvidence.isPending ? 'Enviando...' : 'Enviar Evidência'}
                                    </Button>
                                    {submitEvidence.isError && (
                                      <p className="text-xs text-red-600">{submitEvidence.error?.message}</p>
                                    )}
                                  </div>
                                )}

                                {/* Se ENTREGUE ou VALIDADA: mostrar evidência enviada */}
                                {(task.taskStatus === 'entregue' || task.taskStatus === 'validada') && (
                                  <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-emerald-600" /> Minha Entrega
                                    </h4>
                                    {task.submittedAt && (
                                      <p className="text-xs text-gray-500">Enviado em: {new Date(task.submittedAt).toLocaleString("pt-BR")}</p>
                                    )}
                                    {task.evidenceLink && (
                                      <div className="p-3 rounded bg-gray-50 border border-gray-200">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Link:</p>
                                        <a href={task.evidenceLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                          <ExternalLink className="h-3 w-3" /> {task.evidenceLink}
                                        </a>
                                      </div>
                                    )}
                                    {task.evidenceImageUrl && (
                                      <div className="p-3 rounded bg-gray-50 border border-gray-200">
                                        <p className="text-xs font-medium text-gray-700 mb-2">Imagem:</p>
                                        <img src={task.evidenceImageUrl} alt="Evidência" className="max-w-full max-h-64 rounded-lg border" />
                                      </div>
                                    )}
                                    {task.relatoAluno && (
                                      <div className="p-3 rounded bg-gray-50 border border-gray-200">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Relato:</p>
                                        <p className="text-xs text-gray-600">{task.relatoAluno}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Validação */}
                                {task.taskStatus === 'validada' && task.validatedAt && (
                                  <div className="p-3 rounded bg-purple-50 border border-purple-200">
                                    <p className="text-xs font-semibold text-purple-700 flex items-center gap-1">
                                      <Award className="h-3 w-3" /> Atividade Validada
                                    </p>
                                    <p className="text-xs text-purple-600 mt-1">
                                      Validada em: {new Date(task.validatedAt).toLocaleString("pt-BR")}
                                    </p>
                                  </div>
                                )}

                                {/* Comentários */}
                                {task.comments && task.comments.length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                      <MessageSquare className="h-4 w-4 text-blue-600" /> Comentários ({task.comments.length})
                                    </h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {task.comments.map((c: any) => (
                                        <div key={c.id} className="p-3 rounded bg-gray-50 border border-gray-200">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-gray-700">{c.authorName}</span>
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                              {c.authorRole === 'mentor' ? 'Mentora' : 'Admin'}
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-gray-600">{c.comment}</p>
                                          <p className="text-[10px] text-gray-400 mt-1">{new Date(c.createdAt).toLocaleString("pt-BR")}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      );
                    })}
                  </div>
              </CardContent>
            </Card>
            )}
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
                        Ao final de cada trilha (Basic, Essential, Master, etc.), você deve entregar um Case de Sucesso 
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
                              <span>Entregue em {caseEntregue.dataEntrega ? formatDateSafe(caseEntregue.dataEntrega) : '-'}</span>
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

          {/* === MEU PERFIL DISC === */}
          <TabsContent value="meu-perfil-disc" className="mt-4">
            <Suspense fallback={
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-8 w-8 border-4 border-[#0A1E3E] border-t-transparent rounded-full" />
              </div>
            }>
              <RelatorioAutoconhecimentoTab
                alunoId={aluno.id}
                onComplete={() => {}}
              />
            </Suspense>
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
                disabled={!caseTitulo || !caseFile || !caseTrilhaId || enviarCase.isPending}
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


function MentorProfileCard({ mentorId, mentorName }: { mentorId: number; mentorName: string }) {
  const { data: profile } = trpc.mentor.getProfile.useQuery({ consultorId: mentorId });
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Foto */}
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-200 bg-white flex items-center justify-center shrink-0">
            {profile?.photoUrl ? (
              <img src={profile.photoUrl} alt={mentorName} className="w-full h-full object-cover" />
            ) : (
              <User className="h-8 w-8 text-blue-300" />
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-blue-900">{mentorName}</p>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Mentor(a)</Badge>
            </div>
            {profile?.especialidade && (
              <p className="text-sm text-blue-700 mt-0.5">{profile.especialidade}</p>
            )}
            {profile?.miniCurriculo && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline cursor-pointer"
              >
                {expanded ? 'Ocultar minicurrículo' : 'Ver minicurrículo'}
              </button>
            )}
          </div>
        </div>
        {expanded && profile?.miniCurriculo && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-sm text-blue-800 whitespace-pre-wrap">{profile.miniCurriculo}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


function AlunoAgendamentoSection({ alunoId, consultorId, mentorName }: { alunoId: number; consultorId: number; mentorName: string }) {
  const { data: availability } = trpc.mentor.getAvailability.useQuery({ consultorId });
  const { data: myAppointments } = trpc.mentor.getAppointments.useQuery({ consultorId });
  const bookMutation = trpc.mentor.bookAppointment.useMutation();
  const respondMutation = trpc.mentor.respondToInvite.useMutation();
  const utils = trpc.useUtils();

  const [showBooking, setShowBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{ id?: number; startTime: string; endTime: string; googleMeetLink?: string | null } | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');

  const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  // Filtrar convites de grupo pendentes para este aluno
  const pendingInvites = (myAppointments || []).filter(
    a => a.type === 'grupo' && a.participants.some((p: any) => p.alunoId === alunoId && p.status === 'convidado')
  );

  // Meus agendamentos (individuais e grupo confirmados)
  const myBookings = (myAppointments || []).filter(
    a => a.participants.some((p: any) => p.alunoId === alunoId && (p.status === 'confirmado' || p.status === 'agendado'))
  );

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot) {
      toast.error('Selecione uma data e horário');
      return;
    }
    try {
      await bookMutation.mutateAsync({
        consultorId,
        availabilityId: selectedSlot.id || 0,
        scheduledDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: bookingNotes || undefined,
      });
      utils.mentor.getAppointments.invalidate();
      toast.success('Sessão agendada com sucesso!');
      setShowBooking(false);
      setSelectedDate('');
      setSelectedSlot(null);
      setBookingNotes('');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao agendar sessão');
    }
  };

  const handleRespond = async (appointmentId: number, response: 'confirmado' | 'recusado') => {
    try {
      await respondMutation.mutateAsync({ appointmentId, response });
      utils.mentor.getAppointments.invalidate();
      toast.success(response === 'confirmado' ? 'Presença confirmada!' : 'Convite recusado');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao responder');
    }
  };

  // Horários disponíveis do mentor agrupados por dia
  const activeSlots = (availability || []).filter(a => a.isActive === 1);

  return (
    <div className="space-y-4 mb-4">
      {/* Convites de Grupo Pendentes */}
      {pendingInvites.length > 0 && (
        <Card className="border-2 border-amber-300 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-800">
              <Bell className="h-5 w-5 animate-pulse" />
              Convites de Sessão de Grupo ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvites.map(invite => (
              <div key={invite.id} className="p-4 bg-white rounded-lg border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{invite.title || 'Sessão de Grupo'}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(invite.scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {invite.startTime} — {invite.endTime}
                      </span>
                    </div>
                    {invite.description && <p className="text-sm text-gray-500 mt-1">{invite.description}</p>}
                    {invite.googleMeetLink && (
                      <a href={invite.googleMeetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1">
                        <Video className="h-3.5 w-3.5" /> Link do Google Meet
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRespond(invite.id, 'confirmado')}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={respondMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRespond(invite.id, 'recusado')}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      disabled={respondMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Recusar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Meus Agendamentos */}
      {myBookings.length > 0 && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="h-4 w-4 text-blue-600" />
              Minhas Sessões Agendadas ({myBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myBookings.map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <Badge variant={booking.type === 'grupo' ? 'default' : 'secondary'} className="text-xs">
                      {booking.type === 'grupo' ? 'Grupo' : 'Individual'}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {booking.title || `Sessão com ${mentorName}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} • {booking.startTime} — {booking.endTime}
                      </p>
                    </div>
                  </div>
                  {booking.googleMeetLink && (
                    <a href={booking.googleMeetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                      <Video className="h-4 w-4" /> Entrar
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão para Agendar Nova Sessão */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="h-4 w-4 text-green-600" />
              Agendar Sessão de Mentoria
            </CardTitle>
            <Button
              size="sm"
              variant={showBooking ? 'outline' : 'default'}
              onClick={() => setShowBooking(!showBooking)}
              className={showBooking ? '' : 'bg-[#1E3A5F] hover:bg-[#2a4f7f]'}
            >
              {showBooking ? 'Fechar' : 'Agendar Sessão'}
            </Button>
          </div>
        </CardHeader>
        {showBooking && (
          <CardContent className="space-y-4">
            {activeSlots.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>O mentor ainda não configurou horários disponíveis.</p>
              </div>
            ) : (
              <>
                {/* Horários disponíveis do mentor */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Horários disponíveis do mentor:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {DAYS_OF_WEEK.map((dayName, dayIdx) => {
                      const daySlots = activeSlots.filter(a => a.dayOfWeek === dayIdx);
                      if (daySlots.length === 0) return null;
                      return (
                        <div key={dayIdx} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                          <p className="text-xs font-semibold text-gray-600 mb-1">{dayName}</p>
                          {daySlots.map((slot, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedSlot(slot)}
                              className={`block w-full text-left text-sm p-2 rounded mt-1 transition-colors ${
                                selectedSlot?.startTime === slot.startTime && selectedSlot?.endTime === slot.endTime
                                  ? 'bg-blue-100 border border-blue-300 text-blue-800'
                                  : 'bg-white border border-gray-200 hover:bg-blue-50 text-gray-700'
                              }`}
                            >
                              {slot.startTime} — {slot.endTime}
                              {slot.googleMeetLink && <Video className="h-3 w-3 inline ml-2 text-blue-500" />}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedSlot && (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Data da sessão:</Label>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={e => {
                          const val = e.target.value;
                          setSelectedDate(val);
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1"
                      />
                      {/* A4 FIX: Validar dia da semana */}
                      {selectedDate && (() => {
                        const dateObj = new Date(selectedDate + 'T12:00:00');
                        const dayOfWeek = dateObj.getDay();
                        const slotDay = (activeSlots.find(s => s.startTime === selectedSlot.startTime && s.endTime === selectedSlot.endTime) as any)?.dayOfWeek;
                        if (slotDay !== undefined && dayOfWeek !== slotDay) {
                          return (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <span>&#9888;</span> O horário selecionado é para <strong>{DAYS_OF_WEEK[slotDay]}</strong>, mas a data escolhida é <strong>{DAYS_OF_WEEK[dayOfWeek]}</strong>. Selecione uma data que caia em {DAYS_OF_WEEK[slotDay]}.
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Observações (opcional):</Label>
                      <Textarea
                        placeholder="Descreva o tema que gostaria de abordar na sessão..."
                        value={bookingNotes}
                        onChange={e => setBookingNotes(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleBook}
                        disabled={bookMutation.isPending || !selectedDate || (() => {
                          // A4 FIX: Desabilitar se dia da semana não corresponde ao slot
                          if (!selectedDate) return true;
                          const dateObj = new Date(selectedDate + 'T12:00:00');
                          const dayOfWeek = dateObj.getDay();
                          const slotDay = (activeSlots.find(s => s.startTime === selectedSlot.startTime && s.endTime === selectedSlot.endTime) as any)?.dayOfWeek;
                          return slotDay !== undefined && dayOfWeek !== slotDay;
                        })()}
                        className="bg-[#1E3A5F] hover:bg-[#2a4f7f]"
                      >
                        <Calendar className="h-4 w-4 mr-2" /> Confirmar Agendamento
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
