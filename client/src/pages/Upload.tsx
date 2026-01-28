import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
// Select removido para evitar erro de Portal
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
  Building2,
  Download,
  History,
  HelpCircle,
  Trash2
} from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// Tooltips removidos para evitar erro de Portal

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

// Agrupar por empresa para exibição
const EMPRESAS = [
  { 
    nome: "SEBRAE ACRE", 
    tipos: ["sebraeacre_mentorias", "sebraeacre_eventos"] as FileType[],
    color: "border-primary/30 bg-primary/5"
  },
  { 
    nome: "SEBRAE TO", 
    tipos: ["sebraeto_mentorias", "sebraeto_eventos"] as FileType[],
    color: "border-secondary/30 bg-secondary/5"
  },
  { 
    nome: "EMBRAPII", 
    tipos: ["embrapii_mentorias", "embrapii_eventos"] as FileType[],
    color: "border-chart-3/30 bg-chart-3/5"
  },
  { 
    nome: "Consolidado", 
    tipos: ["performance"] as FileType[],
    color: "border-chart-4/30 bg-chart-4/5"
  }
];

export default function UploadPage() {
  const { user } = useAuth();
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
  const [selectedFileType, setSelectedFileType] = useState<FileType>("sebraeacre_mentorias");
  const [fileObjects, setFileObjects] = useState<Map<string, File>>(new Map());
  
  // Estados para validação e histórico
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const createBatchMutation = trpc.uploads.createBatch.useMutation();
  const uploadFileMutation = trpc.uploads.uploadFile.useMutation();
  const completeBatchMutation = trpc.uploads.completeBatch.useMutation();
  const downloadTemplateMutation = trpc.uploads.downloadTemplate.useMutation();
  const validateFileMutation = trpc.uploads.validateFile.useMutation();
  
  // Query para histórico de uploads - sempre carrega para mostrar na seção visível
  const { data: uploadHistory, refetch: refetchHistory, isLoading: isLoadingHistory } = trpc.uploads.getUploadHistory.useQuery(
    { limit: 10 }
  );

  // Função para baixar template
  const handleDownloadTemplate = async (type: "mentorias" | "eventos" | "performance") => {
    setIsDownloadingTemplate(true);
    try {
      const result = await downloadTemplateMutation.mutateAsync({ type });
      
      // Converter base64 para blob e fazer download
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Usar URL.createObjectURL com link temporário sem manipulação direta do DOM
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      link.style.display = 'none';
      
      // Usar setTimeout para evitar conflitos com o React
      setTimeout(() => {
        link.click();
        // Limpar URL após download
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);
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

  const handleFileChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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

      // Verificar se o nome do arquivo é aceito
      const lowerName = file.name.toLowerCase();
      const detectedType = ACCEPTED_FILE_NAMES[lowerName];
      
      if (!detectedType) {
        // Nome não reconhecido - mostrar erro
        rejectedFiles.push(file.name);
        return;
      }

      newFiles.push({
        name: file.name,
        type: detectedType,
        status: "pending"
      });
      newFileObjects.set(file.name, file);
    });

    // Mostrar erro se houver arquivos rejeitados
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
      setValidationWarnings([]);
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

  const updateFileType = useCallback((fileName: string, newType: FileType) => {
    setFiles(prev => prev.map(f => 
      f.name === fileName ? { ...f, type: newType } : f
    ));
  }, []);

  const readFileAsBase64 = (fileName: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const file = fileObjects.get(fileName);
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
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
      // Create batch
      const batch = await createBatchMutation.mutateAsync({
        weekNumber,
        year,
        notes: notes || undefined
      });
      
      const currentBatchId = batch.id;
      setBatchId(currentBatchId);

      let successCount = 0;

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: "uploading" as const } : f
        ));

        try {
          const fileData = await readFileAsBase64(file.name);
          
          if (!fileData) {
            throw new Error("Não foi possível ler o arquivo");
          }

          const result = await uploadFileMutation.mutateAsync({
            batchId: currentBatchId!,
            fileName: file.name,
            fileData,
            fileType: file.type
          });

          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { 
              ...f, 
              status: "success" as const,
              sheets: result.sheets
            } : f
          ));
          successCount++;
        } catch (error) {
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { 
              ...f, 
              status: "error" as const,
              error: error instanceof Error ? error.message : "Erro desconhecido"
            } : f
          ));
        }
      }

      // Complete batch if all successful
      if (successCount === files.length) {
        await completeBatchMutation.mutateAsync({ batchId: currentBatchId! });
        toast.success("Upload concluído com sucesso! O administrador foi notificado.");
      } else if (successCount > 0) {
        toast.warning(`${successCount} de ${files.length} arquivos enviados com sucesso`);
      }

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gradient">Upload de Planilhas</h1>
          <p className="text-muted-foreground mt-1">
            Carregue os 7 arquivos semanais: Mentorias e Eventos de cada empresa + Relatório de Performance
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Configuration */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Configuração do Lote
              </CardTitle>
              <CardDescription>
                Defina o período dos dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="week">Semana</Label>
                  <Input
                    id="week"
                    type="number"
                    min={1}
                    max={53}
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Ano</Label>
                  <Input
                    id="year"
                    type="number"
                    min={2020}
                    max={2030}
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 2025)}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione observações sobre este lote..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-background/50 min-h-[80px]"
                />
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
              <CardDescription>
                Arraste ou selecione planilhas Excel (.xlsx, .xls)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drop Zone */}
              <label 
                htmlFor="file-upload"
                className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all block"
              >
                <UploadIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Clique para selecionar ou arraste arquivos aqui
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  O sistema detecta automaticamente o tipo pelo nome do arquivo
                </p>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isProcessing}
                />
              </label>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, index) => {
                    const config = FILE_TYPE_CONFIG[file.type];
                    const Icon = config.icon;
                    
                    return (
                      <div 
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/30"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg bg-background/50 shrink-0`}>
                            <Icon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {config.label}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {file.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.name)}
                              disabled={isProcessing}
                            >
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                          {file.status === "uploading" && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                          {file.status === "success" && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          {file.status === "error" && (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processando...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Upload Button */}
              <Button 
                onClick={handleUpload}
                disabled={!canUpload}
                className="w-full glow-orange"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Enviar {files.length > 0 ? `${files.length} arquivo(s)` : "Arquivos"}
                  </>
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
            <CardDescription>
              Baixe os modelos com o formato correto para cada tipo de arquivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium">Mentorias</span>
                  <span 
                    className="text-muted-foreground cursor-help" 
                    title="Colunas: Nome do Aluno, Turma, Mentor, Data, Mentoria (Presente/Ausente), Atividade proposta, Engajamento (1-5)"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Sessões de mentoria com presença, tarefas e engajamento</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleDownloadTemplate('mentorias')}
                  disabled={isDownloadingTemplate}
                >
                  {isDownloadingTemplate ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Baixar Modelo
                </Button>
              </div>
              
              <div className="p-4 rounded-lg border border-secondary/30 bg-secondary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-secondary" />
                  <span className="font-medium">Eventos</span>
                  <span 
                    className="text-muted-foreground cursor-help" 
                    title="Colunas: Nome do Aluno, Turma, Nome do Evento, Data, Tipo (Webinar/Workshop), Status Presença"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Participação em webinars e eventos</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleDownloadTemplate('eventos')}
                  disabled={isDownloadingTemplate}
                >
                  {isDownloadingTemplate ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Baixar Modelo
                </Button>
              </div>
              
              <div className="p-4 rounded-lg border border-chart-4/30 bg-chart-4/5">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-chart-4" />
                  <span className="font-medium">Desempenho</span>
                  <span 
                    className="text-muted-foreground cursor-help" 
                    title="Colunas: Nome do Aluno, Turma, Empresa, Competência 1-5, Média Competências"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Relatório consolidado de competências</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleDownloadTemplate('performance')}
                  disabled={isDownloadingTemplate}
                >
                  {isDownloadingTemplate ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Baixar Modelo
                </Button>
              </div>
            </div>
            
            {/* Botão de Histórico */}
            <div className="mt-4 pt-4 border-t border-border/30">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowHistoryDialog(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <History className="h-4 w-4 mr-2" />
                Ver Histórico de Uploads
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Nomes de Arquivos Aceitos */}
        <Card className="gradient-card border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Nomes de Arquivos Aceitos
            </CardTitle>
            <CardDescription>
              <strong className="text-foreground">IMPORTANTE:</strong> O sistema só aceita planilhas com os nomes exatos abaixo. 
              Renomeie seus arquivos antes de fazer upload.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="grid gap-2">
                <div className="flex items-center gap-3 p-2 rounded bg-primary/10 border border-primary/20">
                  <span className="font-mono text-sm bg-background px-2 py-1 rounded font-bold">01</span>
                  <code className="font-mono text-sm font-medium">SEBRAEACRE-Mentorias.xlsx</code>
                  <span className="text-xs text-muted-foreground ml-auto">Mentorias SEBRAE ACRE</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-primary/10 border border-primary/20">
                  <span className="font-mono text-sm bg-background px-2 py-1 rounded font-bold">02</span>
                  <code className="font-mono text-sm font-medium">SEBRAEACRE-Eventos.xlsx</code>
                  <span className="text-xs text-muted-foreground ml-auto">Eventos SEBRAE ACRE</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-secondary/10 border border-secondary/20">
                  <span className="font-mono text-sm bg-background px-2 py-1 rounded font-bold">03</span>
                  <code className="font-mono text-sm font-medium">SEBRAETO-Mentorias.xlsx</code>
                  <span className="text-xs text-muted-foreground ml-auto">Mentorias SEBRAE TO</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-secondary/10 border border-secondary/20">
                  <span className="font-mono text-sm bg-background px-2 py-1 rounded font-bold">04</span>
                  <code className="font-mono text-sm font-medium">SEBRAETO-Eventos.xlsx</code>
                  <span className="text-xs text-muted-foreground ml-auto">Eventos SEBRAE TO</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-chart-3/10 border border-chart-3/20">
                  <span className="font-mono text-sm bg-background px-2 py-1 rounded font-bold">05</span>
                  <code className="font-mono text-sm font-medium">EMBRAPII-Mentorias.xlsx</code>
                  <span className="text-xs text-muted-foreground ml-auto">Mentorias EMBRAPII</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-chart-3/10 border border-chart-3/20">
                  <span className="font-mono text-sm bg-background px-2 py-1 rounded font-bold">06</span>
                  <code className="font-mono text-sm font-medium">EMBRAPII-Eventos.xlsx</code>
                  <span className="text-xs text-muted-foreground ml-auto">Eventos EMBRAPII</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-chart-4/10 border border-chart-4/20">
                  <span className="font-mono text-sm bg-background px-2 py-1 rounded font-bold">07</span>
                  <code className="font-mono text-sm font-medium">relatorio-de-performance.xlsx</code>
                  <span className="text-xs text-muted-foreground ml-auto">Performance Consolidado</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/30">
                <strong>Dica:</strong> Copie o nome exato acima e cole ao renomear seu arquivo. 
                O sistema mantém as 3 últimas versões de cada arquivo.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Seção de Histórico de Uploads */}
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-secondary" />
              Histórico de Uploads
            </CardTitle>
            <CardDescription>
              Últimos arquivos enviados ao sistema. O sistema mantém as 3 versões mais recentes de cada tipo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Carregando histórico...</span>
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
                                <p className="text-sm font-medium truncate" title={file.fileName}>
                                  {file.fileName}
                                </p>
                                <p className="text-xs text-muted-foreground sm:hidden">
                                  {fileTypeConfig?.label || file.fileType?.replace('_', ' ')}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 hidden sm:table-cell">
                            <span className={`text-xs px-2 py-1 rounded ${fileTypeConfig?.color ? `bg-${fileTypeConfig.color.replace('text-', '')}/10` : 'bg-muted'}`}>
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
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
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
                <p className="text-sm text-muted-foreground mt-1">Os arquivos enviados aparecerão aqui.</p>
              </div>
            )}
            
            {/* Botão para atualizar */}
            <div className="mt-4 flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => refetchHistory()}
                className="text-muted-foreground hover:text-foreground"
              >
                <History className="h-4 w-4 mr-2" />
                Atualizar Histórico
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de Erros de Validação */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Arquivo Rejeitado
            </DialogTitle>
            <DialogDescription>
              O sistema só aceita planilhas com nomes específicos.
            </DialogDescription>
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
                    <div className="flex justify-between p-1 bg-background rounded">
                      <span>SEBRAEACRE-Mentorias.xlsx</span>
                      <span className="text-muted-foreground">Mentorias SEBRAE ACRE</span>
                    </div>
                    <div className="flex justify-between p-1 bg-background rounded">
                      <span>SEBRAEACRE-Eventos.xlsx</span>
                      <span className="text-muted-foreground">Eventos SEBRAE ACRE</span>
                    </div>
                    <div className="flex justify-between p-1 bg-background rounded">
                      <span>SEBRAETO-Mentorias.xlsx</span>
                      <span className="text-muted-foreground">Mentorias SEBRAE TO</span>
                    </div>
                    <div className="flex justify-between p-1 bg-background rounded">
                      <span>SEBRAETO-Eventos.xlsx</span>
                      <span className="text-muted-foreground">Eventos SEBRAE TO</span>
                    </div>
                    <div className="flex justify-between p-1 bg-background rounded">
                      <span>EMBRAPII-Mentorias.xlsx</span>
                      <span className="text-muted-foreground">Mentorias EMBRAPII</span>
                    </div>
                    <div className="flex justify-between p-1 bg-background rounded">
                      <span>EMBRAPII-Eventos.xlsx</span>
                      <span className="text-muted-foreground">Eventos EMBRAPII</span>
                    </div>
                    <div className="flex justify-between p-1 bg-background rounded">
                      <span>relatorio-de-performance.xlsx</span>
                      <span className="text-muted-foreground">Performance Consolidado</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidationDialog(false)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Histórico */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Uploads
            </DialogTitle>
            <DialogDescription>
              Últimos arquivos enviados. O sistema mantém as 3 versões mais recentes de cada tipo de planilha.
            </DialogDescription>
          </DialogHeader>
          
          {/* Tabela de Histórico */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Nome da Planilha</th>
                  <th className="text-left p-3 text-sm font-medium">Tipo</th>
                  <th className="text-left p-3 text-sm font-medium">Data</th>
                  <th className="text-left p-3 text-sm font-medium">Horário</th>
                  <th className="text-center p-3 text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {uploadHistory && uploadHistory.length > 0 ? (
                  uploadHistory.map((file, index) => {
                    const uploadDate = file.createdAt ? new Date(file.createdAt) : null;
                    return (
                      <tr key={file.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium truncate max-w-[200px]" title={file.fileName}>
                              {file.fileName}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                            {file.fileType?.replace('_', ' ').toUpperCase() || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          {uploadDate ? uploadDate.toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                          }) : '-'}
                        </td>
                        <td className="p-3 text-sm">
                          {uploadDate ? uploadDate.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit'
                          }) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-xs px-2 py-1 rounded ${
                            file.status === 'processed' 
                              ? 'bg-green-100 text-green-700' 
                              : file.status === 'error'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {file.status === 'processed' ? '✓ Processado' : 
                             file.status === 'error' ? '✗ Erro' : file.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Nenhum arquivo enviado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
