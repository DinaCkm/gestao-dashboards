import { useAuth } from "@/_core/hooks/useAuth";
import { formatDateSafe } from "@/lib/dateUtils";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { 
  FileText, 
  Download, 
  FileSpreadsheet,
  Calendar,
  Loader2,
  Clock,
  User,
  Users,
  BarChart3,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<"admin" | "manager" | "individual" | "financeiro_mentora" | "financeiro_empresa">("individual");
  const [reportFormat, setReportFormat] = useState<"pdf" | "excel">("excel");
  const [reportName, setReportName] = useState("");
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  const isAdmin = user?.role === "admin";
  const consultorRole = (user as any)?.consultorRole as string | null | undefined;
  // Mentor = user com consultorId E consultorRole='mentor' (não inclui gerente puro)
  const isMentor = !!(user as any)?.consultorId && consultorRole === 'mentor';
  // Gestor de empresa = manager com consultorRole='gerente' OU manager sem consultorId
  const isGestorEmpresa = user?.role === "manager" && !isMentor;
  // A5 FIX: Mentores (com consultorId) também devem ver a opção Gerencial
  const isManager = user?.role === "manager" || isAdmin || isMentor;

  // Fetch alunos list for individual report filter
  const { data: alunos } = trpc.alunos.list.useQuery(undefined, {
    enabled: reportType === "individual" && isManager,
  });

  // Fetch programs for manager filter
  const { data: programs } = trpc.programs.list.useQuery(undefined, {
    enabled: isManager,
  });

  // Fetch mentor's own alunos if user is a mentor (not gerente puro)
  const consultorId = (user as any)?.consultorId;
  const { data: mentorAlunos } = trpc.alunos.byConsultor.useQuery(
    { consultorId: consultorId! },
    { enabled: !!consultorId && isMentor && reportType === "individual" }
  );

  // Filter alunos by manager's company or mentor's linked alunos
  const filteredAlunos = useMemo(() => {
    // Mentor: show only their linked alunos
    if (isMentor && mentorAlunos) {
      return mentorAlunos;
    }
    if (!alunos) return [];
    // Gestor de empresa: filtrar pela empresa (programId)
    if (user?.role === "manager" && user.programId) {
      return alunos.filter((a: any) => a.programId === user.programId);
    }
    return alunos;
  }, [alunos, mentorAlunos, user, isMentor]);

  // Fetch reports history - refetch every 5 seconds to catch status updates
  const { data: reports, refetch } = trpc.reports.list.useQuery({ limit: 20 }, {
    refetchInterval: 5000,
  });

  const generateReportMutation = trpc.reports.generate.useMutation({
    onSuccess: () => {
      toast.success("Relatório gerado com sucesso! O arquivo estará disponível para download em instantes.");
      refetch();
      setReportName("");
      setSelectedAlunoId("");
    },
    onError: (error: any) => {
      toast.error("Erro ao gerar relatório: " + error.message);
    }
  });

  const handleGenerateReport = async (overrides?: {
    name?: string;
    type?: "admin" | "manager" | "individual" | "financeiro_mentora" | "financeiro_empresa";
    format?: "pdf" | "excel";
    scopeId?: number;
  }) => {
    const name = overrides?.name || reportName;
    const type = overrides?.type || reportType;
    const format = overrides?.format || reportFormat;
    const scopeId = overrides?.scopeId || (selectedAlunoId ? parseInt(selectedAlunoId) : undefined);
    const reportDateFrom = dateFrom || undefined;
    const reportDateTo = dateTo || undefined;

    if (!name.trim()) {
      toast.error("Digite um nome para o relatório");
      return;
    }

    if (type === "individual" && isManager && !scopeId) {
      toast.error("Selecione um aluno para o relatório individual");
      return;
    }

    setIsGenerating(true);
    try {
      await generateReportMutation.mutateAsync({
        name,
        type,
        format,
        scopeId,
        dateFrom: reportDateFrom,
        dateTo: reportDateTo,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "admin": return "Administrativo";
      case "manager": return "Gerencial";
      case "individual": return "Individual";
      case "financeiro_mentora": return "Financeiro por Mentora";
      case "financeiro_empresa": return "Financeiro por Empresa";
      default: return type;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="geometric-accent pl-4">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-gradient">Relatórios</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Gere e exporte relatórios personalizados em Excel
          </p>
        </div>

        {/* Atalhos Rápidos para Mentores */}
        {isMentor && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="gradient-card cursor-pointer hover:shadow-md transition-all" onClick={() => {
              handleGenerateReport({
                name: `Gerencial ${new Date().toLocaleDateString('pt-BR')}`,
                type: 'manager',
                format: 'excel',
              });
            }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Relatório Gerencial Rápido</p>
                    <p className="text-sm text-muted-foreground">Consolidado de todos os seus mentorados (Excel)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="gradient-card cursor-pointer hover:shadow-md transition-all" onClick={() => {
              setReportType('individual');
              setReportFormat('excel');
              setReportName(`Individual ${new Date().toLocaleDateString('pt-BR')}`);
            }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-100">
                    <User className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Relatório Individual</p>
                    <p className="text-sm text-muted-foreground">Selecione um aluno para gerar relatório detalhado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Generate Report Card */}
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Gerar Novo Relatório
            </CardTitle>
            <CardDescription>
              Configure e gere um relatório personalizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="report-name">Nome do Relatório</Label>
                <Input
                  id="report-name"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Ex: Relatório Semanal"
                  className="bg-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Relatório</Label>
                <Select 
                  value={reportType} 
                  onValueChange={(v) => {
                    setReportType(v as "admin" | "manager" | "individual" | "financeiro_mentora" | "financeiro_empresa");
                    setSelectedAlunoId("");
                  }}
                >
                  <SelectTrigger className="bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    {isManager && <SelectItem value="manager">Gerencial</SelectItem>}
                    {isAdmin && <SelectItem value="admin">Administrativo</SelectItem>}
                    {isAdmin && <SelectItem value="financeiro_mentora">Financeiro por Mentora</SelectItem>}
                    {isAdmin && <SelectItem value="financeiro_empresa">Financeiro por Empresa</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Aluno - aparece quando tipo é Individual e user é manager/admin */}
              {reportType === "individual" && isManager && (
                <div className="space-y-2">
                  <Label>Aluno</Label>
                  <Select 
                    value={selectedAlunoId} 
                    onValueChange={setSelectedAlunoId}
                  >
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Selecione um aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAlunos.map((aluno: any) => (
                        <SelectItem key={aluno.id} value={String(aluno.id)}>
                          {aluno.name || aluno.email || `Aluno #${aluno.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filtro de Período */}
              <div className="space-y-2">
                <Label>Período - De</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Período - Até</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Formato</Label>
                <Select 
                  value={reportFormat} 
                  onValueChange={(v) => setReportFormat(v as "pdf" | "excel")}
                >
                  <SelectTrigger className="bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel
                      </div>
                    </SelectItem>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        PDF
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                onClick={() => handleGenerateReport()}
                disabled={isGenerating || !reportName.trim() || (reportType === "individual" && isManager && !selectedAlunoId)}
                className="glow-orange"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Gerar Relatório
                  </>
                )}
              </Button>
            </div>

            {/* Report Type Description */}
            <div className="p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                {reportType === "admin" && <><BarChart3 className="h-4 w-4" /> Relatório Administrativo</>}
                {reportType === "manager" && <><Users className="h-4 w-4" /> Relatório Gerencial</>}
                {reportType === "individual" && <><User className="h-4 w-4" /> Relatório Individual</>}
                {reportType === "financeiro_mentora" && <><FileSpreadsheet className="h-4 w-4" /> Relatório Financeiro por Mentora</>}
                {reportType === "financeiro_empresa" && <><FileSpreadsheet className="h-4 w-4" /> Relatório Financeiro por Empresa</>}
              </h4>
              <p className="text-sm text-muted-foreground">
                {reportType === "admin" && "Visão consolidada de todos os dados do sistema, incluindo métricas de todos os alunos, mentorias e eventos."}
                {reportType === "manager" && (isMentor ? "Relatório consolidado de todos os seus mentorados: resumo geral, total de sessões, presença, indicadores V2 e sessões por mês." : "Dados da equipe da empresa, incluindo lista de alunos, sessões de mentoria e performance individual.")}
                {reportType === "individual" && "Relatório Individual, mostra a performance do aluno com indicadores por ciclo, engajamento e evolução."}
                {reportType === "financeiro_mentora" && "Demonstrativo financeiro por mentora: sessões realizadas, alunos atendidos, empresas, valor por sessão e total a pagar no período."}
                {reportType === "financeiro_empresa" && "Demonstrativo financeiro por empresa: sessões realizadas, alunos atendidos, mentoras responsáveis, valor por sessão e total gasto no período."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reports History */}
        <Card className="gradient-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-secondary" />
                  Histórico de Relatórios
                </CardTitle>
                <CardDescription>
                  Relatórios gerados anteriormente
                </CardDescription>
              </div>
              {reports && reports.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistoryExpanded(!historyExpanded)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {historyExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Recolher
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Expandir ({reports.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          {historyExpanded && (
            <CardContent>
              {reports && reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.map((report: any) => (
                    <div 
                      key={report.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          report.format === 'pdf' 
                            ? 'bg-red-500/20' 
                            : 'bg-green-500/20'
                        }`}>
                          {report.format === 'pdf' ? (
                            <FileText className="h-5 w-5 text-red-400" />
                          ) : (
                            <FileSpreadsheet className="h-5 w-5 text-green-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{report.name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateSafe(report.createdAt)}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-muted">
                              {getReportTypeLabel(report.type)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (report.fileUrl) {
                            window.open(report.fileUrl, '_blank');
                          } else {
                            // Force refetch to check if file is ready now
                            refetch();
                            toast.info("Relatório ainda em processamento. Aguarde alguns instantes.");
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {report.fileUrl ? 'Baixar' : 'Processando...'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhum relatório gerado</p>
                  <p className="text-sm">Gere seu primeiro relatório usando o formulário acima</p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
