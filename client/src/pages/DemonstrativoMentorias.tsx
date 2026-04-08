import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatDateSafe, formatDateLongSafe } from "@/lib/dateUtils";
import { useAuth } from "@/_core/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Users, Calendar, CheckCircle2, AlertTriangle, Search, 
  Download, Filter, X, TrendingUp, Clock, UserCheck, DollarSign, FileText,
  Mail, AlertCircle, Loader2, ChevronLeft, ChevronRight, Eye, Info,
  ArrowLeft, FileDown, Printer
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet";

type StatusProgressoFilter = "todos" | "completo" | "em_andamento" | "atencao";
type StatusSessaoFilter = "todos" | "em_dia" | "atrasado_30";

const ITEMS_PER_PAGE = 30;

export default function DemonstrativoMentorias() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-[#1E3A5F]" />
            Demonstrativo de Sessões de Mentoria
          </h1>
          <p className="text-gray-500 mt-1">
            Acompanhe o progresso {isAdmin ? 'e financeiro ' : ''}das sessões de mentoria
          </p>
        </div>
        {isAdmin ? (
        <Tabs defaultValue="progresso">
          <TabsList>
            <TabsTrigger value="progresso" className="gap-2"><FileText className="h-4 w-4" /> Progresso</TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-2"><DollarSign className="h-4 w-4" /> Financeiro</TabsTrigger>
          </TabsList>
          <TabsContent value="progresso">
            <DemonstrativoContent />
          </TabsContent>
          <TabsContent value="financeiro">
            <RelatorioFinanceiro />
          </TabsContent>
        </Tabs>
        ) : (
          <DemonstrativoContent />
        )}
      </div>
    </DashboardLayout>
  );
}

function DemonstrativoContent() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("todas");
  const [selectedTurma, setSelectedTurma] = useState<string>("todas");
  const [selectedTrilha, setSelectedTrilha] = useState<string>("todas");
  const [selectedMentor, setSelectedMentor] = useState<string>("todos");
  const [statusProgressoFilter, setStatusProgressoFilter] = useState<StatusProgressoFilter>("todos");
  const [statusSessaoFilter, setStatusSessaoFilter] = useState<StatusSessaoFilter>("todos");
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertSending, setAlertSending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAluno, setSelectedAluno] = useState<any>(null);

  const { data: progressData, isLoading } = trpc.mentor.allSessionProgress.useQuery();
  const enviarAlertasMutation = trpc.alertasMentoria.enviarAlertas.useMutation();

  // Extract unique filters from data
  const filterOptions = useMemo(() => {
    if (!progressData) return { empresas: [], turmas: [], trilhas: [], mentores: [] };

    const empresasSet = new Set<string>();
    const turmasSet = new Set<string>();
    const trilhasSet = new Set<string>();
    const mentoresSet = new Set<string>();

    progressData.forEach((p: any) => {
      if (p.programaNome) empresasSet.add(p.programaNome);
      if (p.turmaNome) turmasSet.add(p.turmaNome);
      if (p.trilhaNome) trilhasSet.add(p.trilhaNome);
      if (p.consultorNome) mentoresSet.add(p.consultorNome);
    });

    return {
      empresas: Array.from(empresasSet).sort(),
      turmas: Array.from(turmasSet).sort(),
      trilhas: Array.from(trilhasSet).sort(),
      mentores: Array.from(mentoresSet).sort(),
    };
  }, [progressData]);

  // Filter turmas based on selected empresa
  const filteredTurmaOptions = useMemo(() => {
    if (!progressData || selectedEmpresa === "todas") return filterOptions.turmas;
    const turmasSet = new Set<string>();
    progressData.forEach((p: any) => {
      if (p.programaNome === selectedEmpresa && p.turmaNome) {
        turmasSet.add(p.turmaNome);
      }
    });
    return Array.from(turmasSet).sort();
  }, [progressData, selectedEmpresa, filterOptions.turmas]);

  // Apply all filters
  const filteredData = useMemo(() => {
    if (!progressData) return [];

    let result = [...progressData] as any[];

    // For manager role, filter by their programId
    if (user?.role === "manager" && user?.programId) {
      result = result.filter((p: any) => p.programId === user.programId);
    }

    if (selectedEmpresa !== "todas") {
      result = result.filter((p: any) => p.programaNome === selectedEmpresa);
    }
    if (selectedTurma !== "todas") {
      result = result.filter((p: any) => p.turmaNome === selectedTurma);
    }
    if (selectedTrilha !== "todas") {
      result = result.filter((p: any) => p.trilhaNome === selectedTrilha);
    }
    if (selectedMentor !== "todos") {
      result = result.filter((p: any) => p.consultorNome === selectedMentor);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((p: any) => 
        p.alunoNome?.toLowerCase().includes(term) ||
        p.consultorNome?.toLowerCase().includes(term)
      );
    }

    // Status Progresso filter
    if (statusProgressoFilter !== "todos") {
      if (statusProgressoFilter === "completo") {
        result = result.filter((p: any) => p.cicloCompleto);
      } else if (statusProgressoFilter === "em_andamento") {
        result = result.filter((p: any) => !p.cicloCompleto && !p.faltaUmaSessao);
      } else if (statusProgressoFilter === "atencao") {
        result = result.filter((p: any) => p.faltaUmaSessao);
      }
    }

    // Status Sessão filter
    if (statusSessaoFilter !== "todos") {
      if (statusSessaoFilter === "em_dia") {
        result = result.filter((p: any) => !p.atrasado30dias);
      } else if (statusSessaoFilter === "atrasado_30") {
        result = result.filter((p: any) => p.atrasado30dias && !p.cicloCompleto);
      }
    }

    // Sort by name
    result.sort((a: any, b: any) => (a.alunoNome || "").localeCompare(b.alunoNome || ""));

    return result;
  }, [progressData, selectedEmpresa, selectedTurma, selectedTrilha, selectedMentor, searchTerm, statusProgressoFilter, statusSessaoFilter, user]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedEmpresa, selectedTurma, selectedTrilha, selectedMentor, searchTerm, statusProgressoFilter, statusSessaoFilter]);

  // Count atrasados for KPI (unfiltered)
  const atrasadosCount = useMemo(() => {
    if (!progressData) return 0;
    let data = [...progressData] as any[];
    if (user?.role === "manager" && user?.programId) {
      data = data.filter((p: any) => p.programId === user.programId);
    }
    return data.filter((p: any) => p.atrasado30dias && !p.cicloCompleto).length;
  }, [progressData, user]);

  // Summary KPIs
  const kpis = useMemo(() => {
    if (!filteredData.length) return { totalAlunos: 0, completos: 0, emAndamento: 0, atencao: 0, atrasados: 0, mediaProgresso: 0, totalSessoes: 0, totalFaltantes: 0 };
    const alunosDistintos = new Set(filteredData.map((p: any) => p.alunoId)).size;
    const completos = filteredData.filter((p: any) => p.cicloCompleto).length;
    const atencao = filteredData.filter((p: any) => p.faltaUmaSessao).length;
    const atrasados = filteredData.filter((p: any) => p.atrasado30dias && !p.cicloCompleto).length;
    const emAndamento = filteredData.length - completos - atencao;
    const mediaProgresso = Math.round(filteredData.reduce((sum: number, p: any) => sum + p.percentualProgresso, 0) / filteredData.length);
    const totalSessoes = filteredData.reduce((sum: number, p: any) => sum + p.sessoesRealizadas, 0);
    const totalFaltantes = filteredData.reduce((sum: number, p: any) => sum + p.sessoesFaltantes, 0);
    return { totalAlunos: alunosDistintos, completos, emAndamento, atencao, atrasados, mediaProgresso, totalSessoes, totalFaltantes };
  }, [filteredData]);

  const hasActiveFilters = selectedEmpresa !== "todas" || selectedTurma !== "todas" || selectedTrilha !== "todas" || selectedMentor !== "todos" || searchTerm !== "" || statusProgressoFilter !== "todos" || statusSessaoFilter !== "todos";

  const clearFilters = () => {
    setSelectedEmpresa("todas");
    setSelectedTurma("todas");
    setSelectedTrilha("todas");
    setSelectedMentor("todos");
    setSearchTerm("");
    setStatusProgressoFilter("todos");
    setStatusSessaoFilter("todos");
  };

  const formatDate = (dateStr: string | null) => formatDateSafe(dateStr);

  const getStatusProgressoBadge = (item: any) => {
    if (item.cicloCompleto) {
      return <Badge className="bg-emerald-100 text-emerald-800 border-0 whitespace-nowrap text-[10px] px-1.5 py-0.5"><CheckCircle2 className="h-3 w-3 mr-0.5" /> Completo</Badge>;
    }
    if (item.faltaUmaSessao) {
      return <Badge className="bg-amber-100 text-amber-800 border-0 whitespace-nowrap text-[10px] px-1.5 py-0.5 animate-pulse"><AlertTriangle className="h-3 w-3 mr-0.5" /> Falta 1!</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 border-0 whitespace-nowrap text-[10px] px-1.5 py-0.5"><Clock className="h-3 w-3 mr-0.5" /> Em andamento</Badge>;
  };

  const getStatusSessaoBadge = (item: any) => {
    // Alunos com ciclo completo não devem aparecer como atrasados
    if (item.cicloCompleto) {
      return <Badge className="bg-emerald-50 text-emerald-700 border-0 whitespace-nowrap text-[10px] px-1.5 py-0.5"><CheckCircle2 className="h-3 w-3 mr-0.5" /> Finalizado</Badge>;
    }
    if (item.atrasado30dias) {
      return <Badge className="bg-red-100 text-red-800 border-0 whitespace-nowrap text-[10px] px-1.5 py-0.5"><AlertCircle className="h-3 w-3 mr-0.5" /> Atrasado {item.diasSemSessao !== null ? `${item.diasSemSessao}d` : ''}</Badge>;
    }
    if (item.diasSemSessao !== null && item.diasSemSessao >= 15) {
      return <Badge className="bg-amber-50 text-amber-700 border-0 whitespace-nowrap text-[10px] px-1.5 py-0.5"><Clock className="h-3 w-3 mr-0.5" /> {item.diasSemSessao}d</Badge>;
    }
    return <Badge className="bg-green-50 text-green-700 border-0 whitespace-nowrap text-[10px] px-1.5 py-0.5"><CheckCircle2 className="h-3 w-3 mr-0.5" /> Em dia</Badge>;
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "bg-emerald-500";
    if (percent >= 75) return "bg-blue-500";
    if (percent >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const formatUltimaSessao = (item: any) => {
    if (!item.ultimaSessao) {
      return <span className="text-gray-400 italic text-[10px]">Nenhuma</span>;
    }
    const dateStr = formatDateSafe(item.ultimaSessao);
    const dias = item.diasSemSessao;
    const isLate = dias >= 30;
    return (
      <div className="flex flex-col items-center gap-0">
        <span className="text-[10px] text-gray-600">{dateStr}</span>
        <span className={`text-[10px] font-semibold ${isLate ? 'text-red-600' : dias >= 15 ? 'text-amber-600' : 'text-gray-500'}`}>
          ({dias}d atrás)
        </span>
      </div>
    );
  };

  // Handle sending alerts
  const handleEnviarAlertas = async (dryRun: boolean) => {
    setAlertSending(true);
    try {
      const result = await enviarAlertasMutation.mutateAsync({ diasMinimo: 30, dryRun });
      if (result.success) {
        if (dryRun) {
          if (result.totalAlertas === 0) {
            toast.info("Nenhum aluno com 30+ dias sem sessão encontrado.");
          } else {
            toast.success(`${result.totalAlertas} aluno(s) com 30+ dias sem sessão identificados. Clique em "Enviar E-mails" para disparar os alertas.`);
          }
        } else {
          toast.success(`${result.emailsEnviados} e-mail(s) de alerta enviado(s) com sucesso!`);
        }
      } else {
        toast.error("Erro ao processar alertas.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar alertas.");
    } finally {
      setAlertSending(false);
      if (!dryRun) setShowAlertDialog(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredData.length) return;
    const headers = ["Aluno", "Empresa", "Turma", "Trilha", "Mentor", "Início", "Término", "Sessões Realizadas", "Total Esperadas", "Faltantes", "Progresso %", "Status Progresso", "Status Sessão", "Última Sessão", "Dias sem Sessão"];
    const rows = filteredData.map((p: any) => [
      p.alunoNome,
      p.programaNome || "",
      p.turmaNome || "",
      p.trilhaNome || "",
      p.consultorNome || "",
      formatDate(p.macroInicio),
      formatDate(p.macroTermino),
      p.sessoesRealizadas,
      p.totalSessoesEsperadas,
      p.sessoesFaltantes,
      p.percentualProgresso,
      p.cicloCompleto ? "Completo" : p.faltaUmaSessao ? "Falta 1 sessão" : "Em andamento",
      p.atrasado30dias ? `Atrasado ${p.diasSemSessao}d` : "Em dia",
      p.ultimaSessao ? formatDateSafe(p.ultimaSessao) : "Nenhuma",
      p.diasSemSessao !== null ? p.diasSemSessao : "N/A"
    ]);
    const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `demonstrativo-mentorias-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="border-l-4 border-l-[#1E3A5F]">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="h-3.5 w-3.5 text-[#1E3A5F]" />
              <span className="text-[10px] text-gray-500">Total Alunos</span>
            </div>
            <p className="text-xl font-bold text-[#1E3A5F]">{kpis.totalAlunos}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[10px] text-gray-500">Completos</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">{kpis.completos}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-[10px] text-gray-500">Em Andamento</span>
            </div>
            <p className="text-xl font-bold text-blue-600">{kpis.emAndamento}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-[10px] text-gray-500">Falta 1 Sessão</span>
            </div>
            <p className="text-xl font-bold text-amber-600">{kpis.atencao}</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 border-l-red-500 ${kpis.atrasados > 0 ? 'ring-1 ring-red-200' : ''}`}>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle className="h-3.5 w-3.5 text-red-600" />
              <span className="text-[10px] text-gray-500">Atrasados 30+</span>
            </div>
            <p className="text-xl font-bold text-red-600">{kpis.atrasados}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#F5A623]">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-[#F5A623]" />
              <span className="text-[10px] text-gray-500">Progresso Médio</span>
            </div>
            <p className="text-xl font-bold text-[#F5A623]">{kpis.mediaProgresso}%</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
              <span className="text-[10px] text-gray-500">Total Sessões</span>
            </div>
            <p className="text-xl font-bold text-indigo-600">{kpis.totalSessoes}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-[10px] text-gray-500">Faltantes</span>
            </div>
            <p className="text-xl font-bold text-gray-600">{kpis.totalFaltantes}</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar horizontal - filtros + ações */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[180px] flex-1 max-w-[280px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Buscar aluno ou mentor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            {/* Empresa */}
            {user?.role === "admin" && (
              <Select value={selectedEmpresa} onValueChange={(v) => { setSelectedEmpresa(v); setSelectedTurma("todas"); }}>
                <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas Empresas</SelectItem>
                  {filterOptions.empresas.map(e => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Turma */}
            <Select value={selectedTurma} onValueChange={setSelectedTurma}>
              <SelectTrigger className="h-8 text-xs w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Turmas</SelectItem>
                {filteredTurmaOptions.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Trilha */}
            <Select value={selectedTrilha} onValueChange={setSelectedTrilha}>
              <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Trilhas</SelectItem>
                {filterOptions.trilhas.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Mentor */}
            <Select value={selectedMentor} onValueChange={setSelectedMentor}>
              <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Mentores</SelectItem>
                {filterOptions.mentores.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Progresso */}
            <Select value={statusProgressoFilter} onValueChange={(v) => setStatusProgressoFilter(v as StatusProgressoFilter)}>
              <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Progresso: Todos</SelectItem>
                <SelectItem value="completo">Completo</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="atencao">Falta 1 Sessão</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Sessão */}
            <Select value={statusSessaoFilter} onValueChange={(v) => setStatusSessaoFilter(v as StatusSessaoFilter)}>
              <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Sessão: Todos</SelectItem>
                <SelectItem value="em_dia">Em dia</SelectItem>
                <SelectItem value="atrasado_30">Atrasado 30+ dias</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-gray-500 gap-1 px-2">
                <X className="h-3.5 w-3.5" /> Limpar
              </Button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Action buttons */}
            {user?.role === "admin" && atrasadosCount > 0 && (
              <Button 
                onClick={() => setShowAlertDialog(true)} 
                variant="outline" 
                size="sm"
                className="h-8 text-xs gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
              >
                <Mail className="h-3.5 w-3.5" /> 
                Alertas ({atrasadosCount})
              </Button>
            )}
            <Button onClick={handleExportCSV} variant="outline" size="sm" className="h-8 text-xs gap-1.5" disabled={!filteredData.length}>
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-[#1E3A5F]" />
                Sessões por Aluno
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {filteredData.length} registro(s)
                {hasActiveFilters && " filtrado(s)"}
                {" — Página "}{currentPage} de {totalPages}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Info className="h-3.5 w-3.5" />
              <span>Clique sobre o nome do aluno e abra o card com todas as informações detalhadas</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-2 overflow-hidden">
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Nenhum aluno encontrado</p>
              <p className="text-sm mt-1">Tente ajustar os filtros</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-w-full border rounded-md" style={{ scrollbarWidth: 'auto', scrollbarColor: '#94a3b8 #f1f5f9' }}>
                <Table className="text-xs" style={{ minWidth: '1200px' }}>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700 text-[11px] py-1.5 px-2 min-w-[160px]">Aluno</TableHead>
                      {user?.role === "admin" && <TableHead className="font-semibold text-gray-700 text-[11px] py-1.5 px-2">Empresa</TableHead>}
                      <TableHead className="font-semibold text-gray-700 text-[11px] py-1.5 px-2">Turma</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-[11px] py-1.5 px-2">Trilha</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-[11px] py-1.5 px-2">Mentor</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-[11px] text-center py-1.5 px-2">Período</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-[11px] text-center py-1.5 px-1">Real.</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-[11px] text-center py-1.5 px-1">Esp.</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-[11px] text-center py-1.5 px-1">Falt.</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-[11px] min-w-[100px] py-1.5 px-2">Progresso</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-[11px] text-center py-1.5 px-2">Últ. Sessão</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-[11px] text-center py-1.5 px-2">Progresso</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-[11px] text-center py-1.5 px-2">Sessão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item: any, idx: number) => {
                      const isAtrasado = item.atrasado30dias;
                      
                      return (
                        <TableRow 
                          key={`${item.alunoId}-${item.assessmentPdiId}-${idx}`} 
                          className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${isAtrasado ? 'bg-red-50/40' : ''}`}
                          onClick={() => setSelectedAluno(item)}
                        >
                          <TableCell className={`font-medium whitespace-nowrap py-1.5 px-2 text-xs ${isAtrasado ? 'text-red-900' : 'text-gray-900'}`}>
                            {item.alunoNome}
                          </TableCell>
                          {user?.role === "admin" && (
                            <TableCell className="text-gray-600 whitespace-nowrap py-1.5 px-2 text-[11px]">
                              {item.programaNome || "—"}
                            </TableCell>
                          )}
                          <TableCell className="text-gray-600 py-1.5 px-2">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.turmaNome || "—"}</Badge>
                          </TableCell>
                          <TableCell className="text-gray-600 whitespace-nowrap py-1.5 px-2 text-[11px]">
                            {item.trilhaNome || "—"}
                          </TableCell>
                          <TableCell className="text-gray-600 whitespace-nowrap py-1.5 px-2 text-[11px]">
                            {item.consultorNome || <span className="text-gray-400 italic">Não atribuído</span>}
                          </TableCell>
                          <TableCell className="text-center text-[10px] text-gray-500 whitespace-nowrap py-1.5 px-2">
                            {formatDate(item.macroInicio)} — {formatDate(item.macroTermino)}
                          </TableCell>
                          <TableCell className="text-center py-1.5 px-1">
                            <span className="text-xs font-bold text-[#1E3A5F]">{item.sessoesRealizadas}</span>
                          </TableCell>
                          <TableCell className="text-center py-1.5 px-1">
                            <span className="text-gray-600 text-[11px]">{item.totalSessoesEsperadas}</span>
                          </TableCell>
                          <TableCell className="text-center py-1.5 px-1">
                            <span className={`font-semibold text-xs ${item.sessoesFaltantes === 0 ? 'text-emerald-600' : item.faltaUmaSessao ? 'text-amber-600' : 'text-gray-700'}`}>
                              {item.sessoesFaltantes}
                            </span>
                          </TableCell>
                          <TableCell className="py-1.5 px-2">
                            <div className="flex items-center gap-1">
                              <div className="flex-1">
                                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all ${getProgressColor(item.percentualProgresso)}`}
                                    style={{ width: `${Math.min(100, item.percentualProgresso)}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-[10px] font-semibold text-gray-600 w-7 text-right">
                                {item.percentualProgresso}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-1.5 px-2">
                            {formatUltimaSessao(item)}
                          </TableCell>
                          <TableCell className="text-center py-1.5 px-1">
                            {getStatusProgressoBadge(item)}
                          </TableCell>
                          <TableCell className="text-center py-1.5 px-1">
                            {getStatusSessaoBadge(item)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 px-2 border-t mt-2">
                  <span className="text-xs text-gray-500">
                    Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className="h-7 w-7 p-0 text-xs"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Sheet - Detalhe do Aluno */}
      <Sheet open={!!selectedAluno} onOpenChange={(open) => { if (!open) setSelectedAluno(null); }}>
        <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto">
          {selectedAluno && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5 text-[#1E3A5F]" />
                  Detalhes do Aluno
                </SheetTitle>
                <SheetDescription>
                  Visão completa do progresso de mentoria
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4">
                {/* Aluno Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 text-base mb-3">{selectedAluno.alunoNome}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs block">Empresa</span>
                      <span className="font-medium text-gray-800">{selectedAluno.programaNome || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">Turma</span>
                      <span className="font-medium text-gray-800">{selectedAluno.turmaNome || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">Trilha</span>
                      <span className="font-medium text-gray-800">{selectedAluno.trilhaNome || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">Mentor</span>
                      <span className="font-medium text-gray-800">{selectedAluno.consultorNome || <span className="text-gray-400 italic">Não atribuído</span>}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">E-mail Aluno</span>
                      <span className="font-medium text-gray-800 text-xs">{selectedAluno.alunoEmail || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">E-mail Mentor</span>
                      <span className="font-medium text-gray-800 text-xs">{selectedAluno.consultorEmail || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Período */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" /> Período do Contrato
                  </h4>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs block">Início</span>
                      <span className="font-medium">{formatDate(selectedAluno.macroInicio)}</span>
                    </div>
                    <span className="text-gray-400">→</span>
                    <div>
                      <span className="text-gray-500 text-xs block">Término</span>
                      <span className="font-medium">{formatDate(selectedAluno.macroTermino)}</span>
                    </div>
                  </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <span className="text-gray-500 text-xs block mb-1">Status Progresso</span>
                    {getStatusProgressoBadge(selectedAluno)}
                  </div>
                  <div className="rounded-lg border p-3">
                    <span className="text-gray-500 text-xs block mb-1">Status Sessão</span>
                    {getStatusSessaoBadge(selectedAluno)}
                  </div>
                </div>

                {/* Sessões */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#1E3A5F]" /> Sessões de Mentoria
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-2xl font-bold text-[#1E3A5F]">{selectedAluno.sessoesRealizadas}</p>
                      <p className="text-[10px] text-gray-500">Realizadas</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-2xl font-bold text-gray-600">{selectedAluno.totalSessoesEsperadas}</p>
                      <p className="text-[10px] text-gray-500">Esperadas</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className={`text-2xl font-bold ${selectedAluno.sessoesFaltantes === 0 ? 'text-emerald-600' : 'text-red-600'}`}>{selectedAluno.sessoesFaltantes}</p>
                      <p className="text-[10px] text-gray-500">Faltantes</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progresso</span>
                      <span className="font-semibold">{selectedAluno.percentualProgresso}%</span>
                    </div>
                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getProgressColor(selectedAluno.percentualProgresso)}`}
                        style={{ width: `${Math.min(100, selectedAluno.percentualProgresso)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Última Sessão */}
                <div className={`rounded-lg p-4 ${selectedAluno.atrasado30dias ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${selectedAluno.atrasado30dias ? 'text-red-600' : 'text-green-600'}`} /> Última Sessão
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {selectedAluno.ultimaSessao 
                          ? formatDateLongSafe(selectedAluno.ultimaSessao)
                          : "Nenhuma sessão registrada"
                        }
                      </p>
                      {selectedAluno.diasSemSessao !== null && (
                        <p className={`text-xs mt-1 font-semibold ${selectedAluno.atrasado30dias ? 'text-red-700' : 'text-green-700'}`}>
                          {selectedAluno.diasSemSessao} dia(s) atrás
                        </p>
                      )}
                    </div>
                    {selectedAluno.atrasado30dias && (
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    )}
                  </div>
                </div>

                {/* Histórico de Sessões */}
                <AlunoSessionsList alunoId={selectedAluno.alunoId} />

                {/* Enviar Alerta Individual */}
                {user?.role === "admin" && selectedAluno.atrasado30dias && selectedAluno.alunoEmail && (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setShowAlertDialog(true);
                      // Keep the sheet open so user can see context
                    }}
                  >
                    <Mail className="h-4 w-4" />
                    Enviar Alerta por E-mail
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog de Envio de Alertas */}
      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-red-600" />
              Enviar Alertas de Mentoria
            </DialogTitle>
            <DialogDescription>
              Enviar e-mail de alerta para todos os alunos com 30+ dias sem sessão de mentoria.
              O e-mail será enviado ao aluno, com cópia para o mentor e administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-medium">
                {atrasadosCount} aluno(s) com 30+ dias sem sessão
              </p>
              <p className="text-xs text-red-600 mt-1">
                Os e-mails serão enviados apenas para alunos que não receberam alerta nos últimos 7 dias.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAlertDialog(false)} disabled={alertSending}>
              Cancelar
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleEnviarAlertas(true)} 
              disabled={alertSending}
              className="gap-2"
            >
              {alertSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Verificar
            </Button>
            <Button 
              onClick={() => handleEnviarAlertas(false)} 
              disabled={alertSending}
              className="gap-2 bg-red-600 hover:bg-red-700"
            >
              {alertSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Enviar E-mails
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ RELATÓRIO FINANCEIRO V2 ============

const TIPO_SESSAO_LABELS: Record<string, string> = {
  individual_normal: "Individual",
  individual_assessment: "Assessment",
  grupo_normal: "Grupo",
  grupo_assessment: "Grupo Assessment",
};

const ORIGEM_PRECO_LABELS: Record<string, string> = {
  empresa_mentor: "Empresa+Mentor",
  mentor: "Mentor",
  empresa: "Empresa",
  legado_faixa: "Faixa (legado)",
  legado_padrao: "Padrão (legado)",
  zero: "Sem preço",
};

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png";

function RelatorioFinanceiro() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState<string | undefined>();
  const [appliedTo, setAppliedTo] = useState<string | undefined>();
  const [expandedMentor, setExpandedMentor] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"resumo" | "detalhado" | "demonstrativo">("resumo");
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(null);

  const { data, isLoading } = trpc.mentor.relatorioFinanceiroV2.useQuery(
    appliedFrom || appliedTo ? { dateFrom: appliedFrom, dateTo: appliedTo } : undefined
  );

  // Query para demonstrativo detalhado do mentor selecionado
  const mentorDetailQuery = trpc.mentor.relatorioDetalhadoMentor.useQuery(
    {
      consultorId: selectedMentorId!,
      dateFrom: appliedFrom || '2020-01-01',
      dateTo: appliedTo || new Date().toISOString().slice(0, 10),
    },
    { enabled: viewMode === 'demonstrativo' && !!selectedMentorId }
  );

  const handleFilter = () => {
    setAppliedFrom(dateFrom || undefined);
    setAppliedTo(dateTo || undefined);
  };

  const handleClear = () => {
    setDateFrom("");
    setDateTo("");
    setAppliedFrom(undefined);
    setAppliedTo(undefined);
  };

  const handleVerDemonstrativo = useCallback((consultorId: number) => {
    setSelectedMentorId(consultorId);
    setViewMode('demonstrativo');
  }, []);

  const handleVoltarResumo = useCallback(() => {
    setViewMode('resumo');
    setSelectedMentorId(null);
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDateBR = (d: string | null) => {
    if (!d) return '-';
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
  };

  // ===== Exportação CSV Resumo =====
  const handleExportCSV = () => {
    if (!data?.mentores.length) return;
    const headers = ["Mentor", "Individuais", "Grupais", "Total Sessões", "Pendentes", "Total (R$)"];
    const rows = data.mentores.map(m => [
      m.consultorNome,
      m.totalSessoesIndividuais,
      m.totalSessoesGrupais,
      m.totalSessoes,
      m.totalPendentes,
      m.totalValor.toFixed(2),
    ]);
    rows.push(["", "", "", String(data.totalSessoesGeral), String(data.totalPendentes), data.totalGeral.toFixed(2)]);
    const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-financeiro-resumo-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ===== Exportação CSV Detalhado =====
  const handleExportDetailedCSV = () => {
    if (!data?.mentores.length) return;
    const headers = ["Mentor", "Data", "Aluno", "Empresa", "Tipo Sessão", "Sessão #", "Valor (R$)", "Origem Preço", "Agendamento", "Alertas"];
    const rows: string[][] = [];
    for (const m of data.mentores) {
      for (const s of m.sessoes) {
        rows.push([
          s.consultorNome,
          formatDateBR(s.sessionDate),
          s.alunoNome,
          s.programNome,
          TIPO_SESSAO_LABELS[s.tipoSessao] || s.tipoSessao,
          String(s.sessionNumber || '-'),
          s.valor.toFixed(2),
          ORIGEM_PRECO_LABELS[s.origemPreco] || s.origemPreco,
          s.appointmentId ? `#${s.appointmentId}` : 'Sem agendamento',
          s.alertas.join(' | ') || '-',
        ]);
      }
    }
    const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-financeiro-detalhado-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ===== Exportação Markdown do Demonstrativo do Mentor =====
  const handleExportMentorMarkdown = useCallback(() => {
    const detail = mentorDetailQuery.data;
    if (!detail) return;

    const periodoStr = `${formatDateBR(detail.periodo.de)} a ${formatDateBR(detail.periodo.ate)}`;
    const now = new Date().toLocaleString('pt-BR');

    let md = '';
    md += `# Demonstrativo de Sessões de Mentoria\n\n`;
    md += `**Plataforma:** Ecossistema do B.E.M.\n\n`;
    md += `---\n\n`;
    md += `## Mentor(a): ${detail.mentor.nome}\n\n`;
    md += `**E-mail:** ${detail.mentor.email || '-'}\n\n`;
    md += `**Período:** ${periodoStr}\n\n`;
    md += `**Data de emissão:** ${now}\n\n`;
    md += `---\n\n`;

    // Resumo
    md += `## Resumo\n\n`;
    md += `| Indicador | Valor |\n`;
    md += `|---|---|\n`;
    md += `| Total de Sessões | ${detail.resumo.totalSessoes} |\n`;
    md += `| Sessões Individuais | ${detail.resumo.totalIndividuais} |\n`;
    md += `| Sessões Grupais | ${detail.resumo.totalGrupais} |\n`;
    md += `| Sessões Pendentes (sem agendamento) | ${detail.resumo.totalPendentes} |\n`;
    md += `| **Valor Total** | **${formatCurrency(detail.resumo.totalValor)}** |\n`;
    md += `\n`;

    // Detalhamento
    md += `## Detalhamento das Sessões\n\n`;
    if (detail.linhas.length > 0) {
      md += `| # | Data Sessão | Agendamento | Aluno | Empresa | Tipo | Valor |\n`;
      md += `|---|---|---|---|---|---|---|\n`;
      let seq = 0;
      for (const l of detail.linhas) {
        seq++;
        const dataSessao = formatDateBR(l.sessionDate);
        const agendInfo = l.appointmentDate
          ? `${formatDateBR(l.appointmentDate)} ${l.appointmentTime || ''}`
          : 'Sem agendamento';
        const tipo = TIPO_SESSAO_LABELS[l.tipoSessao] || l.tipoSessao;
        md += `| ${seq} | ${dataSessao} | ${agendInfo} | ${l.alunoNome} | ${l.empresaNome} | ${tipo} | ${formatCurrency(l.valor)} |\n`;
      }
      md += `\n`;
    } else {
      md += `Nenhuma sessão registrada no período.\n\n`;
    }

    // Gaps
    if (detail.gapsAgendamento && detail.gapsAgendamento.length > 0) {
      md += `## Agendamentos sem Sessão Registrada\n\n`;
      md += `| Data | Agendamento | Tipo | Participantes |\n`;
      md += `|---|---|---|---|\n`;
      for (const g of detail.gapsAgendamento) {
        const data2 = g.appointmentDate ? formatDateBR(g.appointmentDate) : '-';
        const titulo = g.appointmentTitle || `#${g.appointmentId}`;
        const tipo = g.appointmentType === 'grupo' ? 'Grupo' : 'Individual';
        const parts = g.participantes.map((p: any) => p.alunoNome).join(', ');
        md += `| ${data2} | ${titulo} | ${tipo} | ${parts} |\n`;
      }
      md += `\n`;
    }

    // Rodapé
    md += `---\n\n`;
    md += `### Total a Pagar: ${formatCurrency(detail.resumo.totalValor)}\n\n`;
    md += `*Documento gerado automaticamente pela plataforma Ecossistema do B.E.M.*\n`;

    // Download
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const mentorSlug = detail.mentor.nome.replace(/\s+/g, '-').toLowerCase();
    link.download = `demonstrativo-${mentorSlug}-${detail.periodo.de}-a-${detail.periodo.ate}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Demonstrativo exportado em Markdown');
  }, [mentorDetailQuery.data]);

  // ===== Exportação CSV do Demonstrativo do Mentor =====
  const handleExportMentorCSV = useCallback(() => {
    const detail = mentorDetailQuery.data;
    if (!detail) return;

    const headers = ["#", "Data Sessão", "Data Agendamento", "Horário Agendamento", "Aluno", "Empresa", "Tipo", "Participantes", "Valor (R$)", "Origem Preço", "Alertas"];
    const rows: string[][] = [];
    let seq = 0;
    for (const l of detail.linhas) {
      seq++;
      rows.push([
        String(seq),
        formatDateBR(l.sessionDate),
        formatDateBR(l.appointmentDate),
        l.appointmentTime || '-',
        l.alunoNome,
        l.empresaNome,
        TIPO_SESSAO_LABELS[l.tipoSessao] || l.tipoSessao,
        l.participantes.join('; '),
        l.valor.toFixed(2),
        ORIGEM_PRECO_LABELS[l.origemPreco] || l.origemPreco,
        l.alertas.join(' | ') || '-',
      ]);
    }
    rows.push(["", "", "", "", "", "", "", "TOTAL", detail.resumo.totalValor.toFixed(2), "", ""]);
    const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const mentorSlug = detail.mentor.nome.replace(/\s+/g, '-').toLowerCase();
    link.download = `demonstrativo-${mentorSlug}-${detail.periodo.de}-a-${detail.periodo.ate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Demonstrativo exportado em CSV');
  }, [mentorDetailQuery.data]);

  return (
    <div className="space-y-6">
      {/* ===== FILTRO DE PERÍODO (topo, compartilhado) ===== */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">De</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-44" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Até</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-44" />
            </div>
            <Button onClick={handleFilter} className="gap-2">
              <Filter className="h-4 w-4" /> Filtrar
            </Button>
            {(appliedFrom || appliedTo) && (
              <Button variant="ghost" onClick={handleClear} className="gap-2">
                <X className="h-4 w-4" /> Limpar
              </Button>
            )}
            <div className="ml-auto text-sm text-gray-500">
              {appliedFrom || appliedTo
                ? `Período: ${appliedFrom ? formatDateBR(appliedFrom) : 'Início'} a ${appliedTo ? formatDateBR(appliedTo) : 'Hoje'}`
                : 'Todas as sessões (sem filtro de período)'
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== ALERTAS GLOBAIS ===== */}
      {data && data.alertas.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Alertas de Auditoria</p>
                <ul className="text-sm text-amber-700 mt-1 space-y-0.5">
                  {data.alertas.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== KPIs ===== */}
      {data && viewMode !== 'demonstrativo' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-[#1E3A5F]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-[#1E3A5F]" />
                <span className="text-xs text-gray-500">Mentores Ativos</span>
              </div>
              <p className="text-2xl font-bold text-[#1E3A5F]">{data.totalMentores}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-gray-500">Total de Sessões</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{data.totalSessoesGeral}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span className="text-xs text-gray-500">Total Geral</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(data.totalGeral)}
              </p>
            </CardContent>
          </Card>
          {data.totalPendentes > 0 && (
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-gray-500">Pendentes</span>
                </div>
                <p className="text-2xl font-bold text-amber-600">{data.totalPendentes}</p>
                <p className="text-xs text-gray-400">Sem agendamento</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ===== TOGGLE: Resumo / Detalhado ===== */}
      {viewMode !== 'demonstrativo' && (
        <div className="flex gap-2">
          <Button
            variant={viewMode === "resumo" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("resumo")}
          >
            Resumo por Mentor
          </Button>
          <Button
            variant={viewMode === "detalhado" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("detalhado")}
          >
            Detalhado por Sessão
          </Button>
        </div>
      )}

      {/* ===== VISÃO 1: RESUMO POR MENTOR ===== */}
      {viewMode === "resumo" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Demonstrativo Financeiro por Mentor</CardTitle>
                <CardDescription className="mt-1">
                  Clique em "Ver Demonstrativo" para abrir o detalhamento individual do mentor
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2" disabled={!data?.mentores.length}>
                  <Download className="h-4 w-4" /> Resumo CSV
                </Button>
                <Button onClick={handleExportDetailedCSV} variant="outline" size="sm" className="gap-2" disabled={!data?.mentores.length}>
                  <Download className="h-4 w-4" /> Detalhado CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : !data?.mentores.length ? (
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma sessão encontrada no período selecionado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mentor</TableHead>
                      <TableHead className="text-right">Individuais</TableHead>
                      <TableHead className="text-right">Grupais</TableHead>
                      <TableHead className="text-right">Total Sessões</TableHead>
                      <TableHead className="text-right">Pendentes</TableHead>
                      <TableHead className="text-right">Total (R$)</TableHead>
                      <TableHead className="text-center">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.mentores.map((m) => (
                      <TableRow key={m.consultorId} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{m.consultorNome}</TableCell>
                        <TableCell className="text-right font-mono">{m.totalSessoesIndividuais}</TableCell>
                        <TableCell className="text-right font-mono">{m.totalSessoesGrupais}</TableCell>
                        <TableCell className="text-right font-mono">{m.totalSessoes}</TableCell>
                        <TableCell className="text-right">
                          {m.totalPendentes > 0 ? (
                            <Badge variant="outline" className="text-amber-700 border-amber-300">
                              {m.totalPendentes}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-emerald-700">
                          {formatCurrency(m.totalValor)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerDemonstrativo(m.consultorId);
                            }}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Ver Demonstrativo
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Linha de Total */}
                    <TableRow className="bg-gray-50 font-bold border-t-2">
                      <TableCell>TOTAL GERAL</TableCell>
                      <TableCell className="text-right font-mono">
                        {data.mentores.reduce((s, m) => s + m.totalSessoesIndividuais, 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {data.mentores.reduce((s, m) => s + m.totalSessoesGrupais, 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono">{data.totalSessoesGeral}</TableCell>
                      <TableCell className="text-right">
                        {data.totalPendentes > 0 && (
                          <Badge variant="outline" className="text-amber-700 border-amber-300">
                            {data.totalPendentes}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-700">
                        {formatCurrency(data.totalGeral)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== GAPS: Agendamentos sem Sessão ===== */}
      {viewMode !== 'demonstrativo' && data && data.gapsAgendamento && data.gapsAgendamento.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Agendamentos sem Sessão Registrada
            </CardTitle>
            <CardDescription>
              {data.gapsAgendamento.length} agendamento(s) passado(s) com participantes sem sessão registrada no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Agendamento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Participantes sem Sessão</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.gapsAgendamento.map((g) => (
                    <TableRow key={g.appointmentId} className="bg-red-50/30">
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDateBR(g.appointmentDate)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-medium">{g.appointmentTitle || `Agendamento #${g.appointmentId}`}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {g.appointmentType === 'grupo' ? 'Grupo' : 'Individual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{g.consultorNome}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-wrap gap-1">
                          {g.participantes.map((p) => (
                            <Badge key={p.alunoId} variant="secondary" className="text-xs">
                              {p.alunoNome}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-700 font-semibold">
                        {g.participantes.length}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== VISÃO 2: DETALHADO POR SESSÃO ===== */}
      {viewMode === "detalhado" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Todas as Sessões — Visão Detalhada</CardTitle>
                <CardDescription className="mt-1">
                  Lista completa de todas as sessões com valores e status
                </CardDescription>
              </div>
              <Button onClick={handleExportDetailedCSV} variant="outline" size="sm" className="gap-2" disabled={!data?.mentores.length}>
                <Download className="h-4 w-4" /> Detalhado CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : !data?.mentores.length ? (
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma sessão encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Mentor</TableHead>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Agend.</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.mentores.flatMap(m => m.sessoes).sort((a, b) => {
                      const dateA = a.sessionDate || '';
                      const dateB = b.sessionDate || '';
                      return dateB.localeCompare(dateA);
                    }).map((s) => (
                      <TableRow key={s.sessionId} className={s.isPendente ? "bg-amber-50/50" : ""}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {formatDateBR(s.sessionDate)}
                        </TableCell>
                        <TableCell className="text-sm">{s.consultorNome}</TableCell>
                        <TableCell className="text-sm">{s.alunoNome}</TableCell>
                        <TableCell className="text-sm">{s.programNome}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {TIPO_SESSAO_LABELS[s.tipoSessao] || s.tipoSessao}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-mono">{s.sessionNumber || '-'}</TableCell>
                        <TableCell className="text-right text-sm font-mono font-semibold">
                          {formatCurrency(s.valor)}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">{ORIGEM_PRECO_LABELS[s.origemPreco] || s.origemPreco}</span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {s.appointmentId ? (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-[10px]">#{s.appointmentId}</Badge>
                          ) : (
                            <span className="text-amber-600 text-xs">Sem</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {s.alertas.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              {s.alertas.map((a, i) => (
                                <Badge key={i} variant="outline" className="text-[10px] text-amber-700 border-amber-300 whitespace-nowrap">
                                  {a}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== VISÃO 3: DEMONSTRATIVO INDIVIDUAL DO MENTOR ===== */}
      {viewMode === 'demonstrativo' && (
        <DemonstrativoMentor
          mentorDetailQuery={mentorDetailQuery}
          onVoltar={handleVoltarResumo}
          onExportMarkdown={handleExportMentorMarkdown}
          onExportCSV={handleExportMentorCSV}
          formatCurrency={formatCurrency}
          formatDateBR={formatDateBR}
        />
      )}
    </div>
  );
}

// ===== Componente: Demonstrativo Individual do Mentor =====
function DemonstrativoMentor({
  mentorDetailQuery,
  onVoltar,
  onExportMarkdown,
  onExportCSV,
  formatCurrency,
  formatDateBR,
}: {
  mentorDetailQuery: any;
  onVoltar: () => void;
  onExportMarkdown: () => void;
  onExportCSV: () => void;
  formatCurrency: (val: number) => string;
  formatDateBR: (d: string | null) => string;
}) {
  const { data: detail, isLoading, error } = mentorDetailQuery;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#1E3A5F]" />
            <span className="text-gray-500">Carregando demonstrativo do mentor...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !detail) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-600">Erro ao carregar demonstrativo</p>
            <Button variant="outline" className="mt-4 gap-2" onClick={onVoltar}>
              <ArrowLeft className="h-4 w-4" /> Voltar ao Resumo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com botão voltar e ações */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2" onClick={onVoltar}>
          <ArrowLeft className="h-4 w-4" /> Voltar ao Resumo
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={onExportCSV}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={onExportMarkdown}>
            <FileDown className="h-4 w-4" /> Markdown
          </Button>
        </div>
      </div>

      {/* Cabeçalho do Demonstrativo */}
      <Card className="border-[#1E3A5F]/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <img src={LOGO_URL} alt="B.E.M." className="h-14 w-auto" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#1E3A5F]">Demonstrativo de Sessões de Mentoria</h2>
              <p className="text-sm text-gray-500 mt-1">Ecossistema do B.E.M.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-gray-500 block">Mentor(a)</span>
              <span className="font-semibold text-gray-900">{detail.mentor.nome}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">E-mail</span>
              <span className="text-sm text-gray-700">{detail.mentor.email || '-'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Período</span>
              <span className="text-sm text-gray-700">
                {formatDateBR(detail.periodo.de)} a {formatDateBR(detail.periodo.ate)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs do Mentor */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3">
            <span className="text-xs text-gray-500">Total Sessões</span>
            <p className="text-xl font-bold text-blue-600">{detail.resumo.totalSessoes}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-3">
            <span className="text-xs text-gray-500">Individuais</span>
            <p className="text-xl font-bold text-indigo-600">{detail.resumo.totalIndividuais}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-3">
            <span className="text-xs text-gray-500">Grupais</span>
            <p className="text-xl font-bold text-purple-600">{detail.resumo.totalGrupais}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-3">
            <span className="text-xs text-gray-500">Pendentes</span>
            <p className="text-xl font-bold text-amber-600">{detail.resumo.totalPendentes}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-3">
            <span className="text-xs text-gray-500">Valor Total</span>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(detail.resumo.totalValor)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada de Sessões */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sessões Detalhadas</CardTitle>
          <CardDescription>
            {detail.linhas.length} sessão(ões) registrada(s) | {detail.totalAgendamentos} agendamento(s) no período
          </CardDescription>
        </CardHeader>
        <CardContent>
          {detail.linhas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>Nenhuma sessão registrada no período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Data Sessão</TableHead>
                    <TableHead>Agendamento</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Participantes</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.linhas.map((l: any, idx: number) => (
                    <TableRow key={l.sessionId} className={l.alertas.length > 0 ? "bg-amber-50/30" : ""}>
                      <TableCell className="text-sm font-mono text-gray-400">{idx + 1}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDateBR(l.sessionDate)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {l.appointmentDate ? (
                          <div>
                            <span className="font-medium">{formatDateBR(l.appointmentDate)}</span>
                            {l.appointmentTime && (
                              <span className="text-xs text-gray-500 ml-1">{l.appointmentTime}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-600 text-xs">Sem agendamento</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{l.alunoNome}</TableCell>
                      <TableCell className="text-sm">{l.empresaNome}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {TIPO_SESSAO_LABELS[l.tipoSessao] || l.tipoSessao}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {l.participantes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {l.participantes.map((p: string, pi: number) => (
                              <Badge key={pi} variant="secondary" className="text-[10px]">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-sm">
                        {formatCurrency(l.valor)}
                      </TableCell>
                      <TableCell>
                        {l.alertas.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {l.alertas.map((a: string, ai: number) => (
                              <Badge key={ai} variant="outline" className="text-[10px] text-amber-700 border-amber-300 whitespace-nowrap">
                                {a}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Linha de Total */}
                  <TableRow className="bg-gray-50 font-bold border-t-2">
                    <TableCell colSpan={7} className="text-right">TOTAL A PAGAR</TableCell>
                    <TableCell className="text-right font-mono text-emerald-700 text-base">
                      {formatCurrency(detail.resumo.totalValor)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gaps do Mentor */}
      {detail.gapsAgendamento && detail.gapsAgendamento.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              Agendamentos sem Sessão Registrada ({detail.gapsAgendamento.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Agendamento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Participantes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.gapsAgendamento.map((g: any) => (
                    <TableRow key={g.appointmentId} className="bg-red-50/30">
                      <TableCell className="text-sm">{formatDateBR(g.appointmentDate)}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {g.appointmentTitle || `#${g.appointmentId}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {g.appointmentType === 'grupo' ? 'Grupo' : 'Individual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-wrap gap-1">
                          {g.participantes.map((p: any) => (
                            <Badge key={p.alunoId} variant="secondary" className="text-xs">
                              {p.alunoNome}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rodapé do Demonstrativo */}
      <Card className="bg-gray-50">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-gray-500">
            Documento gerado automaticamente pela plataforma Ecossistema do B.E.M. em {new Date().toLocaleString('pt-BR')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


// ============ HISTÓRICO DE SESSÕES DO ALUNO ============

function AlunoSessionsList({ alunoId }: { alunoId: number }) {
  const { data: sessions, isLoading } = trpc.mentor.sessionsByAluno.useQuery(
    { alunoId },
    { enabled: !!alunoId }
  );

  // Sort sessions by sessionNumber ascending
  const sortedSessions = useMemo(() => {
    if (!sessions) return [];
    return [...sessions].sort((a, b) => (a.sessionNumber ?? 0) - (b.sessionNumber ?? 0));
  }, [sessions]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#1E3A5F]" /> Histórico de Sessões
        </h4>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-xs text-gray-500">Carregando sessões...</span>
        </div>
      </div>
    );
  }

  if (!sortedSessions.length) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#1E3A5F]" /> Histórico de Sessões
        </h4>
        <p className="text-xs text-gray-500 text-center py-2">Nenhuma sessão registrada.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-[#1E3A5F]" /> Histórico de Sessões
        <Badge variant="secondary" className="text-[10px] ml-auto">{sortedSessions.length} sessão(ões)</Badge>
      </h4>
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
        {sortedSessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center gap-3 bg-white rounded-md border px-3 py-2 text-xs"
          >
            {/* Session number */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center font-bold text-xs">
              {session.sessionNumber ?? "—"}
            </div>

            {/* Date */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">
                {session.sessionDate ? formatDateSafe(session.sessionDate) : "Sem data"}
              </p>
            </div>

            {/* Presence badge */}
            <div className="flex-shrink-0">
              {session.presence === "presente" ? (
                <Badge variant="default" className="text-[10px] px-1.5 py-0.5 bg-emerald-600">
                  <CheckCircle2 className="h-3 w-3 mr-0.5" />
                  Presente
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                  <X className="h-3 w-3 mr-0.5" />
                  Ausente
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
