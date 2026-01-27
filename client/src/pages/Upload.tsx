import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Building2
} from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

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

  const createBatchMutation = trpc.uploads.createBatch.useMutation();
  const uploadFileMutation = trpc.uploads.uploadFile.useMutation();
  const completeBatchMutation = trpc.uploads.completeBatch.useMutation();

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

    Array.from(selectedFiles).forEach(file => {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(ext)) {
        toast.error(`Arquivo ${file.name} não é uma planilha válida`);
        return;
      }

      // Detectar automaticamente o tipo baseado no nome do arquivo
      let detectedType: FileType = selectedFileType;
      const lowerName = file.name.toLowerCase();
      
      if (lowerName.includes('sebraeacre') || lowerName.includes('sebrae acre') || lowerName.includes('sebrae-acre')) {
        detectedType = lowerName.includes('evento') ? 'sebraeacre_eventos' : 'sebraeacre_mentorias';
      } else if (lowerName.includes('sebraeto') || lowerName.includes('sebrae to') || lowerName.includes('bs2')) {
        detectedType = lowerName.includes('evento') ? 'sebraeto_eventos' : 'sebraeto_mentorias';
      } else if (lowerName.includes('embrapii')) {
        detectedType = lowerName.includes('evento') ? 'embrapii_eventos' : 'embrapii_mentorias';
      } else if (lowerName.includes('performance') || lowerName.includes('relatorio')) {
        detectedType = 'performance';
      }

      newFiles.push({
        name: file.name,
        type: detectedType,
        status: "pending"
      });
      newFileObjects.set(file.name, file);
    });

    setFiles(prev => [...prev, ...newFiles]);
    setFileObjects(newFileObjects);
    event.target.value = "";
  }, [files.length, selectedFileType, fileObjects]);

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
                            {file.status === "pending" ? (
                              <Select 
                                value={file.type} 
                                onValueChange={(v) => updateFileType(file.name, v as FileType)}
                              >
                                <SelectTrigger className="h-6 text-xs mt-1 bg-transparent border-0 p-0 w-auto">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(FILE_TYPE_CONFIG).map(([key, cfg]) => (
                                    <SelectItem key={key} value={key} className="text-xs">
                                      {cfg.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                {config.label}
                              </p>
                            )}
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

        {/* Instructions - Organized by Company */}
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Arquivos Esperados por Empresa
            </CardTitle>
            <CardDescription>
              São 7 arquivos no total: 2 por empresa (Mentorias + Eventos) + 1 Relatório de Performance consolidado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {EMPRESAS.map((empresa) => (
                <div key={empresa.nome} className={`p-4 rounded-lg border ${empresa.color}`}>
                  <h3 className="font-semibold mb-3">{empresa.nome}</h3>
                  <div className="space-y-2">
                    {empresa.tipos.map((tipo) => {
                      const config = FILE_TYPE_CONFIG[tipo];
                      const Icon = config.icon;
                      return (
                        <div key={tipo} className="flex items-start gap-2">
                          <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
                          <div>
                            <p className="text-sm font-medium">
                              {tipo.includes('mentorias') ? 'Mentorias' : 
                               tipo.includes('eventos') ? 'Eventos' : 'Performance'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {config.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
