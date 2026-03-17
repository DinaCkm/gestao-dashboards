import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Users, Calendar, CheckCircle2, AlertTriangle, Search, 
  Download, Filter, X, TrendingUp, Clock, UserCheck, DollarSign, FileText,
  Mail, AlertCircle, Loader2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

type StatusFilter = "todos" | "completo" | "em_andamento" | "atencao" | "atrasado_30";

export default function DemonstrativoMentorias() {
  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-[#1E3A5F]" />
            Demonstrativo de Sessões de Mentoria
          </h1>
          <p className="text-gray-500 mt-1">
            Acompanhe o progresso e financeiro das sessões de mentoria
          </p>
        </div>
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertSending, setAlertSending] = useState(false);

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
    if (statusFilter !== "todos") {
      if (statusFilter === "completo") {
        result = result.filter((p: any) => p.cicloCompleto);
      } else if (statusFilter === "em_andamento") {
        result = result.filter((p: any) => !p.cicloCompleto && !p.faltaUmaSessao && !p.atrasado30dias);
      } else if (statusFilter === "atencao") {
        result = result.filter((p: any) => p.faltaUmaSessao);
      } else if (statusFilter === "atrasado_30") {
        result = result.filter((p: any) => p.atrasado30dias);
      }
    }

    // Sort by name
    result.sort((a: any, b: any) => (a.alunoNome || "").localeCompare(b.alunoNome || ""));

    return result;
  }, [progressData, selectedEmpresa, selectedTurma, selectedTrilha, selectedMentor, searchTerm, statusFilter, user]);

  // Count atrasados for KPI
  const atrasadosCount = useMemo(() => {
    if (!progressData) return 0;
    let data = [...progressData] as any[];
    if (user?.role === "manager" && user?.programId) {
      data = data.filter((p: any) => p.programId === user.programId);
    }
    return data.filter((p: any) => p.atrasado30dias).length;
  }, [progressData, user]);

  // Summary KPIs
  const kpis = useMemo(() => {
    if (!filteredData.length) return { totalAlunos: 0, completos: 0, emAndamento: 0, atencao: 0, mediaProgresso: 0, totalSessoes: 0, totalFaltantes: 0 };
    const alunosDistintos = new Set(filteredData.map((p: any) => p.alunoId)).size;
    const completos = filteredData.filter((p: any) => p.cicloCompleto).length;
    const atencao = filteredData.filter((p: any) => p.faltaUmaSessao).length;
    const emAndamento = filteredData.length - completos - atencao;
    const mediaProgresso = Math.round(filteredData.reduce((sum: number, p: any) => sum + p.percentualProgresso, 0) / filteredData.length);
    const totalSessoes = filteredData.reduce((sum: number, p: any) => sum + p.sessoesRealizadas, 0);
    const totalFaltantes = filteredData.reduce((sum: number, p: any) => sum + p.sessoesFaltantes, 0);
    return { totalAlunos: alunosDistintos, completos, emAndamento, atencao, mediaProgresso, totalSessoes, totalFaltantes };
  }, [filteredData]);

  const hasActiveFilters = selectedEmpresa !== "todas" || selectedTurma !== "todas" || selectedTrilha !== "todas" || selectedMentor !== "todos" || searchTerm !== "" || statusFilter !== "todos";

  const clearFilters = () => {
    setSelectedEmpresa("todas");
    setSelectedTurma("todas");
    setSelectedTrilha("todas");
    setSelectedMentor("todos");
    setSearchTerm("");
    setStatusFilter("todos");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("pt-BR");
    } catch {
      return "—";
    }
  };

  const getStatusBadge = (item: any) => {
    if (item.atrasado30dias) {
      return <Badge className="bg-red-100 text-red-800 border-0 whitespace-nowrap"><AlertCircle className="h-3 w-3 mr-1" /> Atrasado {item.diasSemSessao !== null ? `${item.diasSemSessao}d` : ''}</Badge>;
    }
    if (item.cicloCompleto) {
      return <Badge className="bg-emerald-100 text-emerald-800 border-0 whitespace-nowrap"><CheckCircle2 className="h-3 w-3 mr-1" /> Completo</Badge>;
    }
    if (item.faltaUmaSessao) {
      return <Badge className="bg-amber-100 text-amber-800 border-0 whitespace-nowrap animate-pulse"><AlertTriangle className="h-3 w-3 mr-1" /> Falta 1!</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 border-0 whitespace-nowrap"><Clock className="h-3 w-3 mr-1" /> Em andamento</Badge>;
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
    const d = new Date(item.ultimaSessao);
    const dateStr = d.toLocaleDateString("pt-BR");
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
    const headers = ["Aluno", "Empresa", "Turma", "Trilha", "Mentor", "Início", "Término", "Sessões Realizadas", "Total Esperadas", "Faltantes", "Progresso %", "Status", "Última Sessão", "Dias sem Sessão"];
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
      p.cicloCompleto ? "Completo" : p.faltaUmaSessao ? "Falta 1 sessão" : p.atrasado30dias ? "Atrasado 30+" : "Em andamento",
      p.ultimaSessao ? new Date(p.ultimaSessao).toLocaleDateString("pt-BR") : "Nenhuma",
      p.diasSemSessao !== null ? p.diasSemSessao : "N/A"
    ]);
    const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
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
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        {user?.role === "admin" && atrasadosCount > 0 && (
          <Button 
            onClick={() => setShowAlertDialog(true)} 
            variant="outline" 
            className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
          >
            <Mail className="h-4 w-4" /> 
            Enviar Alertas ({atrasadosCount})
          </Button>
        )}
        <Button onClick={handleExportCSV} variant="outline" className="gap-2" disabled={!filteredData.length}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="border-l-4 border-l-[#1E3A5F]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-[#1E3A5F]" />
              <span className="text-xs text-gray-500">Total Alunos</span>
            </div>
            <p className="text-2xl font-bold text-[#1E3A5F]">{kpis.totalAlunos}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-gray-500">Completos</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{kpis.completos}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-500">Em Andamento</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{kpis.emAndamento}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-gray-500">Falta 1 Sessão</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{kpis.atencao}</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 border-l-red-500 ${atrasadosCount > 0 ? 'ring-1 ring-red-200' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-gray-500">Atrasados 30+</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{atrasadosCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#F5A623]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-[#F5A623]" />
              <span className="text-xs text-gray-500">Progresso Médio</span>
            </div>
            <p className="text-2xl font-bold text-[#F5A623]">{kpis.mediaProgresso}%</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-4 w-4 text-indigo-600" />
              <span className="text-xs text-gray-500">Total Sessões</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{kpis.totalSessoes}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">Sessões Faltantes</span>
            </div>
            <p className="text-2xl font-bold text-gray-600">{kpis.totalFaltantes}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Buscar Aluno</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome do aluno ou mentor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            {user?.role === "admin" && (
              <div className="min-w-[180px]">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Empresa</label>
                <Select value={selectedEmpresa} onValueChange={(v) => { setSelectedEmpresa(v); setSelectedTurma("todas"); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Empresas</SelectItem>
                    {filterOptions.empresas.map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="min-w-[200px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Turma</label>
              <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Turmas</SelectItem>
                  {filteredTurmaOptions.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Trilha</label>
              <Select value={selectedTrilha} onValueChange={setSelectedTrilha}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Trilhas</SelectItem>
                  {filterOptions.trilhas.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Mentor</label>
              <Select value={selectedMentor} onValueChange={setSelectedMentor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Mentores</SelectItem>
                  {filterOptions.mentores.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[180px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="completo">Completo</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="atencao">Falta 1 Sessão</SelectItem>
                  <SelectItem value="atrasado_30">Atrasado 30+ dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 gap-1">
                <X className="h-4 w-4" /> Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-[#1E3A5F]" />
            Sessões por Aluno
          </CardTitle>
          <CardDescription>
            {filteredData.length} aluno(s) encontrado(s)
            {hasActiveFilters && " com os filtros aplicados"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3">
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Nenhum aluno encontrado</p>
              <p className="text-sm mt-1">Tente ajustar os filtros</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-w-full" style={{ scrollbarWidth: 'thin' }}>
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700 text-xs py-1.5 px-2">Aluno</TableHead>
                    {user?.role === "admin" && <TableHead className="font-semibold text-gray-700 text-xs py-1.5 px-2">Empresa</TableHead>}
                    <TableHead className="font-semibold text-gray-700 text-xs py-1.5 px-2">Turma</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-xs py-1.5 px-2">Trilha</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-xs py-1.5 px-2">Mentor</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-xs text-center py-1.5 px-2">Período</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-xs text-center py-1.5 px-1">Real.</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-xs text-center py-1.5 px-1">Esp.</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-xs text-center py-1.5 px-1">Falt.</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-xs min-w-[120px] py-1.5 px-2">Progresso</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-xs text-center py-1.5 px-2">Últ. Sessão</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-xs text-center py-1.5 px-2">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item: any, idx: number) => {
                    const turmaCode = item.turmaNome?.match(/\[(BS\d+)\]/)?.[1] || item.turmaNome || "—";
                    const isAtrasado = item.atrasado30dias;
                    
                    return (
                      <TableRow 
                        key={`${item.alunoId}-${item.assessmentPdiId}-${idx}`} 
                        className={`hover:bg-gray-50/50 ${isAtrasado ? 'bg-red-50/40' : ''}`}
                      >
                        <TableCell className={`font-medium whitespace-nowrap py-1 px-2 text-xs ${isAtrasado ? 'text-red-900' : 'text-gray-900'}`}>
                          {item.alunoNome}
                        </TableCell>
                        {user?.role === "admin" && (
                          <TableCell className="text-gray-600 whitespace-nowrap py-1 px-2 text-xs">
                            {item.programaNome || "—"}
                          </TableCell>
                        )}
                        <TableCell className="text-gray-600 py-1 px-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{turmaCode}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-600 whitespace-nowrap py-1 px-2 text-xs">
                          {item.trilhaNome || "—"}
                        </TableCell>
                        <TableCell className="text-gray-600 whitespace-nowrap py-1 px-2 text-xs">
                          {item.consultorNome || "—"}
                        </TableCell>
                        <TableCell className="text-center text-[10px] text-gray-500 whitespace-nowrap py-1 px-2">
                          {formatDate(item.macroInicio)} — {formatDate(item.macroTermino)}
                        </TableCell>
                        <TableCell className="text-center py-1 px-1">
                          <span className="text-sm font-bold text-[#1E3A5F]">{item.sessoesRealizadas}</span>
                        </TableCell>
                        <TableCell className="text-center py-1 px-1">
                          <span className="text-gray-600 text-xs">{item.totalSessoesEsperadas}</span>
                        </TableCell>
                        <TableCell className="text-center py-1 px-1">
                          <span className={`font-semibold text-xs ${item.sessoesFaltantes === 0 ? 'text-emerald-600' : item.faltaUmaSessao ? 'text-amber-600' : 'text-gray-700'}`}>
                            {item.sessoesFaltantes}
                          </span>
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          <div className="flex items-center gap-1">
                            <div className="flex-1">
                              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${getProgressColor(item.percentualProgresso)}`}
                                  style={{ width: `${Math.min(100, item.percentualProgresso)}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-gray-600 w-8 text-right">
                              {item.percentualProgresso}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-1 px-2">
                          {formatUltimaSessao(item)}
                        </TableCell>
                        <TableCell className="text-center py-1 px-2">
                          {getStatusBadge(item)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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

// ============ RELATÓRIO FINANCEIRO ============

function RelatorioFinanceiro() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState<string | undefined>();
  const [appliedTo, setAppliedTo] = useState<string | undefined>();

  const { data, isLoading } = trpc.mentor.relatorioFinanceiro.useQuery(
    appliedFrom || appliedTo ? { dateFrom: appliedFrom, dateTo: appliedTo } : undefined
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

  const handleExportCSV = () => {
    if (!data?.mentores.length) return;
    const headers = ["Mentor", "Valor/Sessão (R$)", "Sessões Realizadas", "Total (R$)"];
    const rows = data.mentores.map(m => [
      m.consultorNome,
      m.valorSessao.toFixed(2),
      m.totalSessoes,
      m.totalValor.toFixed(2),
    ]);
    rows.push(["", "", String(data.totalSessoesGeral), data.totalGeral.toFixed(2)]);
    const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-financeiro-mentorias-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filtros de período */}
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
            <div className="ml-auto">
              <Button onClick={handleExportCSV} variant="outline" className="gap-2" disabled={!data?.mentores.length}>
                <Download className="h-4 w-4" /> Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.totalGeral)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela por Mentor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Demonstrativo Financeiro por Mentor</CardTitle>
          <CardDescription>
            {appliedFrom || appliedTo
              ? `Período: ${appliedFrom ? new Date(appliedFrom + 'T12:00:00').toLocaleDateString('pt-BR') : 'Início'} a ${appliedTo ? new Date(appliedTo + 'T12:00:00').toLocaleDateString('pt-BR') : 'Hoje'}`
              : 'Todas as sessões (sem filtro de período)'
            }
          </CardDescription>
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
                    <TableHead className="text-right">Valor/Sessão</TableHead>
                    <TableHead className="text-right">Sessões Realizadas</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.mentores.map((m) => (
                    <TableRow key={m.consultorId}>
                      <TableCell className="font-medium">{m.consultorNome}</TableCell>
                      <TableCell className="text-right font-mono">
                        {m.valorSessao > 0
                          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.valorSessao)
                          : <span className="text-muted-foreground italic">Não definido</span>
                        }
                      </TableCell>
                      <TableCell className="text-right font-mono">{m.totalSessoes}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.totalValor)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Linha de Total */}
                  <TableRow className="bg-gray-50 font-bold border-t-2">
                    <TableCell>TOTAL GERAL</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-mono">{data.totalSessoesGeral}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-700">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.totalGeral)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
