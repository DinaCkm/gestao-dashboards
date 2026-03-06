import { useAuth } from "@/_core/hooks/useAuth";
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
  BarChart3
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<"admin" | "manager" | "individual">("individual");
  const [reportFormat, setReportFormat] = useState<"pdf" | "excel">("excel");
  const [reportName, setReportName] = useState("");
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager" || isAdmin;

  // Fetch alunos list for individual report filter
  const { data: alunos } = trpc.alunos.list.useQuery(undefined, {
    enabled: reportType === "individual" && isManager,
  });

  // Fetch programs for manager filter
  const { data: programs } = trpc.programs.list.useQuery(undefined, {
    enabled: isManager,
  });

  // Filter alunos by manager's company
  const filteredAlunos = useMemo(() => {
    if (!alunos) return [];
    if (user?.role === "manager" && user.programId) {
      return alunos.filter((a: any) => a.programId === user.programId);
    }
    return alunos;
  }, [alunos, user]);

  // Fetch reports history
  const { data: reports, refetch } = trpc.reports.list.useQuery({ limit: 20 });

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
    type?: "admin" | "manager" | "individual";
    format?: "pdf" | "excel";
    scopeId?: number;
  }) => {
    const name = overrides?.name || reportName;
    const type = overrides?.type || reportType;
    const format = overrides?.format || reportFormat;
    const scopeId = overrides?.scopeId || (selectedAlunoId ? parseInt(selectedAlunoId) : undefined);

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
                    setReportType(v as "admin" | "manager" | "individual");
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
              </h4>
              <p className="text-sm text-muted-foreground">
                {reportType === "admin" && "Visão consolidada de todos os dados do sistema, incluindo métricas de todos os alunos, mentorias e eventos."}
                {reportType === "manager" && "Dados da equipe da empresa, incluindo lista de alunos, sessões de mentoria e performance individual."}
                {reportType === "individual" && "Relatório Individual, mostra a performance do aluno com indicadores por ciclo, engajamento e evolução."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reports History */}
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-secondary" />
              Histórico de Relatórios
            </CardTitle>
            <CardDescription>
              Relatórios gerados anteriormente
            </CardDescription>
          </CardHeader>
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
                            {new Date(report.createdAt).toLocaleDateString('pt-BR')}
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
                          toast.info("Relatório em processamento. Atualize a página e tente novamente.");
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
        </Card>

        {/* Quick Templates */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Templates Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className="gradient-card card-hover cursor-pointer"
              onClick={async () => {
                if (reportType === "individual" && isManager && !selectedAlunoId) {
                  // For individual reports, fill the form and ask to select student
                  setReportName("Relatório Semanal");
                  setReportType("individual");
                  setReportFormat("excel");
                  toast.info("Selecione um aluno acima e clique em 'Gerar Relatório'.");
                } else if (!isManager) {
                  // Regular user - cannot generate
                  setReportName("Relatório Semanal");
                  setReportType("individual");
                  setReportFormat("excel");
                  toast.info("Template carregado. Clique em 'Gerar Relatório'.");
                } else {
                  // Manager/admin with no student needed or already selected
                  setReportName("Relatório Semanal");
                  setReportType("individual");
                  setReportFormat("excel");
                  toast.info("Selecione um aluno acima e clique em 'Gerar Relatório'.");
                }
              }}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold mb-1">Relatório Semanal</h3>
                <p className="text-sm text-muted-foreground">
                  Resumo individual do aluno em Excel
                </p>
              </CardContent>
            </Card>

            {isManager && (
              <Card 
                className="gradient-card card-hover cursor-pointer"
                onClick={async () => {
                  // Auto-generate manager report
                  setReportName("Performance da Equipe");
                  setReportType("manager");
                  setReportFormat("excel");
                  
                  setIsGenerating(true);
                  try {
                    await generateReportMutation.mutateAsync({
                      name: "Performance da Equipe",
                      type: "manager",
                      format: "excel",
                    });
                  } catch {
                    // Error handled by mutation onError
                  } finally {
                    setIsGenerating(false);
                  }
                }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center mb-4">
                    <FileSpreadsheet className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">Performance da Equipe</h3>
                  <p className="text-sm text-muted-foreground">
                    Dados da equipe em planilha Excel
                  </p>
                  {isGenerating && reportName === "Performance da Equipe" && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-primary">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Gerando...
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isAdmin && (
              <Card 
                className="gradient-card card-hover cursor-pointer"
                onClick={async () => {
                  // Auto-generate admin report
                  setReportName("Relatório Executivo");
                  setReportType("admin");
                  setReportFormat("excel");
                  
                  setIsGenerating(true);
                  try {
                    await generateReportMutation.mutateAsync({
                      name: "Relatório Executivo",
                      type: "admin",
                      format: "excel",
                    });
                  } catch {
                    // Error handled by mutation onError
                  } finally {
                    setIsGenerating(false);
                  }
                }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-chart-3 to-chart-3/80 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">Relatório Executivo</h3>
                  <p className="text-sm text-muted-foreground">
                    Visão consolidada em Excel
                  </p>
                  {isGenerating && reportName === "Relatório Executivo" && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-primary">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Gerando...
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
