import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  Upload as UploadIcon, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Users,
  Calendar,
  BarChart3,
  AlertCircle,
  Download,
  History,
  HelpCircle,
  Eye,
  Clock,
  Trash2
} from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Tipos de arquivo específicos do sistema B.E.M.
type FileType = 
  | "sebraeacre_mentorias" 
  | "sebraeacre_eventos" 
  | "sebraeto_mentorias" 
  | "sebraeto_eventos" 
  | "embrapii_mentorias" 
  | "embrapii_eventos" 
  | "performance";

type UploadedFileInfo = {
  name: string;
  type: FileType;
  status: "pending" | "uploading" | "success" | "error";
  sheets?: { name: string; rows: number; columns: number }[];
  error?: string;
};

// Configuração dos 7 tipos de arquivos
const FILE_TYPE_CONFIG: Record<FileType, { 
  label: string; 
  icon: typeof FileSpreadsheet; 
  color: string;
  empresa: string;
  description: string;
}> = {
  sebraeacre_mentorias: { 
    label: "SEBRAE ACRE - Mentorias", 
    icon: Users, 
    color: "text-primary",
    empresa: "SEBRAE ACRE",
    description: "Sessões de mentoria com presença, tarefas e engajamento"
  },
  sebraeacre_eventos: { 
    label: "SEBRAE ACRE - Eventos", 
    icon: Calendar, 
    color: "text-primary",
    empresa: "SEBRAE ACRE",
    description: "Participação em webinars e eventos"
  },
  sebraeto_mentorias: { 
    label: "SEBRAE TO - Mentorias", 
    icon: Users, 
    color: "text-secondary",
    empresa: "SEBRAE TO",
    description: "Sessões de mentoria com presença, tarefas e engajamento"
  },
  sebraeto_eventos: { 
    label: "SEBRAE TO - Eventos", 
    icon: Calendar, 
    color: "text-secondary",
    empresa: "SEBRAE TO",
    description: "Participação em webinars e eventos"
  },
  embrapii_mentorias: { 
    label: "EMBRAPII - Mentorias", 
    icon: Users, 
    color: "text-chart-3",
    empresa: "EMBRAPII",
    description: "Sessões de mentoria com presença, tarefas e engajamento"
  },
  embrapii_eventos: { 
    label: "EMBRAPII - Eventos", 
    icon: Calendar, 
    color: "text-chart-3",
    empresa: "EMBRAPII",
    description: "Participação em webinars e eventos"
  },
  performance: { 
    label: "Relatório de Performance", 
    icon: BarChart3, 
    color: "text-chart-4",
    empresa: "Consolidado",
    description: "Progresso em competências, notas e avaliações"
  }
};

export default function UploadPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("upload");
  const [weekNumber, setWeekNumber] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  });
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<UploadedFileInfo[]>([]);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileObjects, setFileObjects] = useState<Map<string, File>>(new Map());
  
  // Estados para validação
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  // Estado para histórico (detalhes do lote)
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  const createBatchMutation = trpc.uploads.createBatch.useMutation();
  const uploadFileMutation = trpc.uploads.uploadFile.useMutation();
  const completeBatchMutation = trpc.uploads.completeBatch.useMutation();
  const downloadTemplateMutation = trpc.uploads.downloadTemplate.useMutation();
  
  // Query para histórico de uploads (tabela de arquivos recentes)
  const { data: uploadHistory, refetch: refetchHistory, isLoading: isLoadingHistory } = trpc.uploads.getUploadHistory.useQuery(
    { limit: 20 }
  );

  // Query para lotes (histórico por lote)
  const { data: batches, isLoading: isLoadingBatches, refetch: refetchBatches } = trpc.uploads.listBatches.useQuery({ limit: 50 });
  const { data: batchFiles } = trpc.uploads.getBatchFiles.useQuery(
    { batchId: selectedBatchId! },
    { enabled: !!selectedBatchId }
  );

  // Função para baixar template
  const handleDownloadTemplate = async (type: "mentorias" | "eventos" | "performance") => {
    setIsDownloadingTemplate(true);
    try {
      const result = await downloadTemplateMutation.mutateAsync({ type });
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      link.style.display = 'none';
      setTimeout(() => {
        link.click();
        setTimeout(() => { window.URL.revokeObjectURL(url); }, 100);
      }, 0);
      toast.success(`Modelo ${type} baixado com sucesso!`);
    } catch (error) {
      toast.error('Erro ao baixar modelo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // Nomes de arquivos aceitos pelo sistema
  const ACCEPTED_FILE_NAMES: Record<string, FileType> = {
    'sebraeacre-mentorias.xlsx': 'sebraeacre_mentorias',
    'sebraeacre-eventos.xlsx': 'sebraeacre_eventos',
    'sebraeto-mentorias.xlsx': 'sebraeto_mentorias',
    'sebraeto-eventos.xlsx': 'sebraeto_eventos',
    'embrapii-mentorias.xlsx': 'embrapii_mentorias',
    'embrapii-eventos.xlsx': 'embrapii_eventos',
    'relatorio-de-performance.xlsx': 'performance',
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (files.length + selectedFiles.length > 7) {
      toast.error("Máximo de 7 arquivos permitidos por lote");
      return;
    }

    const newFiles: UploadedFileInfo[] = [];
    const newFileObjects = new Map(fileObjects);
    const rejectedFiles: string[] = [];

    Array.from(selectedFiles).forEach(file => {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!validExtensions.includes(ext)) {
        toast.error(`Arquivo ${file.name} não é uma planilha válida`);
        return;
      }
      const lowerName = file.name.toLowerCase();
      const detectedType = ACCEPTED_FILE_NAMES[lowerName];
      if (!detectedType) {
        rejectedFiles.push(file.name);
        return;
      }
      newFiles.push({ name: file.name, type: detectedType, status: "pending" });
      newFileObjects.set(file.name, file);
    });

    if (rejectedFiles.length > 0) {
      setValidationErrors([
        `Nome(s) de arquivo não reconhecido(s):`,
        ...rejectedFiles.map(f => `\u2022 ${f}`),
        '',
        'Renomeie o arquivo usando um dos nomes aceitos:',
        '\u2022 SEBRAEACRE-Mentorias.xlsx',
        '\u2022 SEBRAEACRE-Eventos.xlsx',
        '\u2022 SEBRAETO-Mentorias.xlsx',
        '\u2022 SEBRAETO-Eventos.xlsx',
        '\u2022 EMBRAPII-Mentorias.xlsx',
        '\u2022 EMBRAPII-Eventos.xlsx',
        '\u2022 relatorio-de-performance.xlsx'
      ]);
      setShowValidationDialog(true);
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      setFileObjects(newFileObjects);
    }
    event.target.value = "";
  }, [files.length, fileObjects]);

  const removeFile = useCallback((fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
    setFileObjects(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileName);
      return newMap;
    });
  }, []);

  const readFileAsBase64 = (fileName: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const file = fileObjects.get(fileName);
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Selecione pelo menos um arquivo para upload");
      return;
    }
    setIsProcessing(true);
    try {
      const batch = await createBatchMutation.mutateAsync({
        weekNumber, year, notes: notes || undefined
      });
      const currentBatchId = batch.id;
      setBatchId(currentBatchId);
      let successCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "uploading" as const } : f));
        try {
          const fileData = await readFileAsBase64(file.name);
          if (!fileData) throw new Error("Não foi possível ler o arquivo");
          const result = await uploadFileMutation.mutateAsync({
            batchId: currentBatchId!, fileName: file.name, fileData, fileType: file.type
          });
          setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "success" as const, sheets: result.sheets } : f));
          successCount++;
        } catch (error) {
          setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "error" as const, error: error instanceof Error ? error.message : "Erro desconhecido" } : f));
        }
      }

      if (successCount === files.length) {
        await completeBatchMutation.mutateAsync({ batchId: currentBatchId! });
        toast.success("Upload concluído com sucesso! O administrador foi notificado.");
      } else if (successCount > 0) {
        toast.warning(`${successCount} de ${files.length} arquivos enviados com sucesso`);
      }
      // Atualizar histórico
      refetchHistory();
      refetchBatches();
    } catch (error) {
      toast.error("Erro ao processar upload: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    } finally {
      setIsProcessing(false);
    }
  };

  const progress = files.length > 0 
    ? (files.filter(f => f.status === "success" || f.status === "error").length / files.length) * 100
    : 0;
  const canUpload = files.length > 0 && !isProcessing && files.every(f => f.status === "pending");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processed":
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('mentorias')) return Users;
    if (fileType.includes('eventos')) return Calendar;
    if (fileType === 'performance') return BarChart3;
    return FileSpreadsheet;
  };

  const getFileConfig = (fileType: string) => {
    return FILE_TYPE_CONFIG[fileType as FileType] || { label: fileType, color: "text-muted-foreground", icon: FileSpreadsheet, empresa: "", description: "" };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gradient">Gestão de Planilhas</h1>
          <p className="text-muted-foreground mt-1">
            Envie planilhas semanais e acompanhe o histórico de todos os lotes processados
          </p>
        </div>

        {/* Tabs: Upload | Histórico */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <UploadIcon className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* ========== TAB: UPLOAD ========== */}
          <TabsContent value="upload" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Upload Configuration */}
              <Card className="gradient-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Configuração do Lote
                  </CardTitle>
                  <CardDescription>Defina o período dos dados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="week">Semana</Label>
                      <Input id="week" type="number" min={1} max={53} value={weekNumber}
                        onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)} className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Ano</Label>
                      <Input id="year" type="number" min={2020} max={2030} value={year}
                        onChange={(e) => setYear(parseInt(e.target.value) || 2025)} className="bg-background/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações (opcional)</Label>
                    <Textarea id="notes" placeholder="Adicione observações sobre este lote..."
                      value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-background/50 min-h-[80px]" />
                  </div>
                </CardContent>
              </Card>

              {/* File Upload Area */}
              <Card className="gradient-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UploadIcon className="h-5 w-5 text-secondary" />
                    Arquivos
                  </CardTitle>
                  <CardDescription>Arraste ou selecione planilhas Excel (.xlsx, .xls)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label htmlFor="file-upload"
                    className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all block">
                    <UploadIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">Clique para selecionar ou arraste arquivos aqui</p>
                    <p className="text-xs text-muted-foreground mt-1">O sistema detecta automaticamente o tipo pelo nome do arquivo</p>
                    <input id="file-upload" type="file" multiple accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange} className="hidden" disabled={isProcessing} />
                  </label>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((file, index) => {
                        const config = FILE_TYPE_CONFIG[file.type];
                        const Icon = config.icon;
                        return (
                          <div key={`${file.name}-${index}`}
                            className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/30">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="p-2 rounded-lg bg-background/50 shrink-0">
                                <Icon className={`h-4 w-4 ${config.color}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{config.label}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {file.status === "pending" && (
                                <Button variant="ghost" size="sm" onClick={() => removeFile(file.name)} disabled={isProcessing}>
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              )}
                              {file.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                              {file.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                              {file.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processando...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  <Button onClick={handleUpload} disabled={!canUpload} className="w-full glow-orange">
                    {isProcessing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</>
                    ) : (
                      <><UploadIcon className="h-4 w-4 mr-2" />Enviar {files.length > 0 ? `${files.length} arquivo(s)` : "Arquivos"}</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Templates Download Section */}
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-green-600" />
                  Modelos de Planilha
                </CardTitle>
                <CardDescription>Baixe os modelos com o formato correto para cada tipo de arquivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="font-medium">Mentorias</span>
                      <span className="text-muted-foreground cursor-help" title="Colunas: Nome do Aluno, Turma, Mentor, Data, Mentoria (Presente/Ausente), Atividade proposta, Engajamento (1-5)">
                        <HelpCircle className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Sessões de mentoria com presença, tarefas e engajamento</p>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleDownloadTemplate('mentorias')} disabled={isDownloadingTemplate}>
                      {isDownloadingTemplate ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                      Baixar Modelo
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg border border-secondary/30 bg-secondary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-secondary" />
                      <span className="font-medium">Eventos</span>
                      <span className="text-muted-foreground cursor-help" title="Colunas: Nome do Aluno, Turma, Nome do Evento, Data, Tipo (Webinar/Workshop), Status Presença">
                        <HelpCircle className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Participação em webinars e eventos</p>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleDownloadTemplate('eventos')} disabled={isDownloadingTemplate}>
                      {isDownloadingTemplate ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                      Baixar Modelo
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg border border-chart-4/30 bg-chart-4/5">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-chart-4" />
                      <span className="font-medium">Desempenho</span>
                      <span className="text-muted-foreground cursor-help" title="Colunas: Nome do Aluno, Turma, Empresa, Competência 1-5, Média Competências">
                        <HelpCircle className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Relatório consolidado de competências</p>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleDownloadTemplate('performance')} disabled={isDownloadingTemplate}>
                      {isDownloadingTemplate ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                      Baixar Modelo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nomes de Arquivos Aceitos */}
            <Card className="gradient-card border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Nomes de Arquivos Aceitos
                </CardTitle>
                <CardDescription>
                  <strong className="text-foreground">IMPORTANTE:</strong> O sistema só aceita planilhas com os nomes exatos abaixo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="grid gap-2">
                    {[
                      { num: "01", name: "SEBRAEACRE-Mentorias.xlsx", desc: "Mentorias SEBRAE ACRE", bg: "bg-primary/10 border-primary/20" },
                      { num: "02", name: "SEBRAEACRE-Eventos.xlsx", desc: "Eventos SEBRAE ACRE", bg: "bg-primary/10 border-primary/20" },
                      { num: "03", name: "SEBRAETO-Mentorias.xlsx", desc: "Mentorias SEBRAE TO", bg: "bg-secondary/10 border-secondary/20" },
                      { num: "04", name: "SEBRAETO-Eventos.xlsx", desc: "Eventos SEBRAE TO", bg: "bg-secondary/10 border-secondary/20" },
                      { num: "05", name: "EMBRAPII-Mentorias.xlsx", desc: "Mentorias EMBRAPII", bg: "bg-chart-3/10 border-chart-3/20" },
                      { num: "06", name: "EMBRAPII-Eventos.xlsx", desc: "Eventos EMBRAPII", bg: "bg-chart-3/10 border-chart-3/20" },
                      { num: "07", name: "relatorio-de-performance.xlsx", desc: "Performance Consolidado", bg: "bg-chart-4/10 border-chart-4/20" },
                    ].map(item => (
                      <div key={item.num} className={`flex items-center gap-3 p-2 rounded border ${item.bg}`}>
                        <span className="font-mono text-sm bg-background px-2 py-1 rounded font-bold">{item.num}</span>
                        <code className="font-mono text-sm font-medium">{item.name}</code>
                        <span className="text-xs text-muted-foreground ml-auto">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/30">
                    <strong>Dica:</strong> Copie o nome exato acima e cole ao renomear seu arquivo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== TAB: HISTÓRICO ========== */}
          <TabsContent value="historico" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Batch List */}
              <div className="lg:col-span-1">
                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Lotes Enviados
                    </CardTitle>
                    <CardDescription>Selecione um lote para ver detalhes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingBatches ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : batches && batches.length > 0 ? (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {batches.map((batch) => (
                          <button key={batch.id} onClick={() => setSelectedBatchId(batch.id)}
                            className={`w-full p-3 rounded-lg text-left transition-all ${
                              selectedBatchId === batch.id
                                ? "bg-primary/10 border border-primary/30"
                                : "bg-background/30 border border-border/30 hover:bg-background/50"
                            }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Semana {batch.weekNumber}/{batch.year}</p>
                                <p className="text-xs text-muted-foreground">{batch.totalRecords || 0} registro(s)</p>
                              </div>
                              {getStatusIcon(batch.status)}
                            </div>
                            {batch.notes && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{batch.notes}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(batch.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhum lote enviado ainda</p>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <Button variant="ghost" size="sm" onClick={() => refetchBatches()} className="w-full text-muted-foreground hover:text-foreground">
                        <History className="h-4 w-4 mr-2" />
                        Atualizar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Batch Details */}
              <div className="lg:col-span-2">
                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-secondary" />
                      Detalhes do Lote
                    </CardTitle>
                    <CardDescription>
                      {selectedBatchId ? "Arquivos do lote selecionado" : "Selecione um lote para ver os arquivos"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedBatchId && batchFiles ? (
                      <div className="space-y-4">
                        {/* Batch Info */}
                        {batches && (() => {
                          const batch = batches.find(b => b.id === selectedBatchId);
                          if (!batch) return null;
                          return (
                            <div className="p-4 rounded-lg bg-background/30 border border-border/30">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Semana</p>
                                  <p className="font-medium">{batch.weekNumber}/{batch.year}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Registros</p>
                                  <p className="font-medium">{batch.totalRecords || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Status</p>
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(batch.status)}
                                    <span className="font-medium capitalize">{batch.status === 'completed' ? 'Concluído' : batch.status}</span>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Data</p>
                                  <p className="font-medium">{new Date(batch.createdAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                              </div>
                              {batch.notes && (
                                <div className="mt-3 pt-3 border-t border-border/30">
                                  <p className="text-xs text-muted-foreground">{batch.notes}</p>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Files Grid */}
                        <div className="grid gap-3 md:grid-cols-2">
                          {batchFiles.map((file) => {
                            const config = getFileConfig(file.fileType);
                            const Icon = getFileIcon(file.fileType);
                            return (
                              <div key={file.id} className="p-4 rounded-lg bg-background/30 border border-border/30">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-primary/10`}>
                                      <Icon className={`h-4 w-4 ${config.color}`} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium truncate max-w-[150px]">{file.fileName}</p>
                                      <p className="text-xs text-muted-foreground">{config.label}</p>
                                    </div>
                                  </div>
                                  {getStatusIcon(file.status)}
                                </div>
                                <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                                  <div className="flex justify-between">
                                    <span>Linhas: {file.rowCount || '-'}</span>
                                    <span>Colunas: {file.columnCount || '-'}</span>
                                  </div>
                                </div>
                                {file.fileUrl && !file.fileUrl.startsWith('manual-import/') && (
                                  <Button variant="outline" size="sm" className="w-full mt-3"
                                    onClick={() => window.open(file.fileUrl, '_blank')}>
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Eye className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Selecione um lote na lista ao lado</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tabela de Arquivos Recentes */}
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-secondary" />
                  Últimos Arquivos Processados
                </CardTitle>
                <CardDescription>
                  Todos os arquivos enviados recentemente, independente do lote
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Carregando...</span>
                  </div>
                ) : uploadHistory && uploadHistory.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Arquivo</th>
                          <th className="text-left p-3 text-sm font-medium hidden sm:table-cell">Tipo</th>
                          <th className="text-left p-3 text-sm font-medium">Data/Hora</th>
                          <th className="text-center p-3 text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadHistory.map((file, index) => {
                          const uploadDate = file.createdAt ? new Date(file.createdAt) : null;
                          const fileTypeConfig = file.fileType ? FILE_TYPE_CONFIG[file.fileType as FileType] : null;
                          const Icon = fileTypeConfig?.icon || FileSpreadsheet;
                          return (
                            <tr key={file.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Icon className={`h-4 w-4 ${fileTypeConfig?.color || 'text-muted-foreground'} shrink-0`} />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate" title={file.fileName}>{file.fileName}</p>
                                    <p className="text-xs text-muted-foreground sm:hidden">
                                      {fileTypeConfig?.label || file.fileType?.replace('_', ' ')}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 hidden sm:table-cell">
                                <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                                  {fileTypeConfig?.label || file.fileType?.replace('_', ' ').toUpperCase() || 'N/A'}
                                </span>
                              </td>
                              <td className="p-3">
                                {uploadDate ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-3.5 w-3.5 text-primary" />
                                      <span className="text-sm font-semibold text-foreground">
                                        {uploadDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                      </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground pl-5">
                                      às {uploadDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                  </div>
                                ) : <span className="text-muted-foreground">-</span>}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                                  file.status === 'processed' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                    : file.status === 'error'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                  {file.status === 'processed' ? (
                                    <><CheckCircle2 className="h-3 w-3" /> Processado</>
                                  ) : file.status === 'error' ? (
                                    <><XCircle className="h-3 w-3" /> Erro</>
                                  ) : (
                                    <><Loader2 className="h-3 w-3" /> {file.status}</>
                                  )}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-8 border-2 border-dashed border-border/50 rounded-lg">
                    <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Nenhum arquivo enviado ainda.</p>
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => refetchHistory()} className="text-muted-foreground hover:text-foreground">
                    <History className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Diálogo de Erros de Validação */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Arquivo Rejeitado
            </DialogTitle>
            <DialogDescription>O sistema só aceita planilhas com nomes específicos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {validationErrors.length > 0 && (
              <div className="space-y-3">
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <h4 className="font-medium text-destructive mb-2">Arquivo(s) com nome incorreto:</h4>
                  <div className="space-y-1">
                    {validationErrors.filter(e => e.startsWith('•')).map((error, i) => (
                      <p key={i} className="text-sm font-mono bg-background px-2 py-1 rounded text-destructive">
                        {error.replace('• ', '')}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-primary/5 border border-primary/30 rounded-lg">
                  <h4 className="font-medium text-primary mb-2">Renomeie usando um destes nomes:</h4>
                  <div className="grid gap-1 text-xs font-mono">
                    {['SEBRAEACRE-Mentorias.xlsx', 'SEBRAEACRE-Eventos.xlsx', 'SEBRAETO-Mentorias.xlsx',
                      'SEBRAETO-Eventos.xlsx', 'EMBRAPII-Mentorias.xlsx', 'EMBRAPII-Eventos.xlsx',
                      'relatorio-de-performance.xlsx'].map(name => (
                      <div key={name} className="flex justify-between p-1 bg-background rounded">
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidationDialog(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
