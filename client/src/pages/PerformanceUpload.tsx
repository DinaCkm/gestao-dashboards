import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Upload as UploadIcon,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
  AlertCircle,
  Clock,
  Users,
  BookOpen,
  GraduationCap,
  RefreshCw,
  Info,
  AlertTriangle,
} from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function PerformanceUpload() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    totalRows: number;
    processedRecords: number;
    skippedRecords: number;
    unmatchedStudents: string[];
    unmatchedTurmas: string[];
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.performanceReport.upload.useMutation();
  const { data: summary, refetch: refetchSummary, isLoading: isLoadingSummary } = trpc.performanceReport.summary.useQuery();
  const { data: uploads, refetch: refetchUploads, isLoading: isLoadingUploads } = trpc.performanceReport.listUploads.useQuery({ limit: 10 });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (ext !== '.csv') {
      toast.error("Apenas arquivos CSV são aceitos. Exporte o relatório de performance como CSV.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. O limite é 10MB.");
      return;
    }

    setSelectedFile(file);
    setLastResult(null);
  }, []);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setShowConfirmDialog(false);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(30);
      const fileData = await readFileAsBase64(selectedFile);
      
      setUploadProgress(50);
      const result = await uploadMutation.mutateAsync({
        fileName: selectedFile.name,
        fileData,
        replaceAll: true,
      });

      setUploadProgress(100);
      setLastResult(result);
      
      if (result.success) {
        toast.success(`Relatório processado com sucesso! ${result.processedRecords} registros importados.`);
        refetchSummary();
        refetchUploads();
      }
    } catch (error) {
      toast.error(`Erro ao processar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setLastResult(null);
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Acesso restrito a administradores.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Relatório de Performance
          </h1>
          <p className="text-muted-foreground mt-1">
            Faça upload do relatório de performance CSV para atualizar os dados de progresso dos alunos.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registros</p>
                  <p className="text-2xl font-bold">{isLoadingSummary ? '...' : (summary?.totalRecords || 0).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Alunos</p>
                  <p className="text-2xl font-bold">{isLoadingSummary ? '...' : (summary?.uniqueStudents || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <BookOpen className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Competências</p>
                  <p className="text-2xl font-bold">{isLoadingSummary ? '...' : (summary?.uniqueCompetencias || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <GraduationCap className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Turmas</p>
                  <p className="text-2xl font-bold">{isLoadingSummary ? '...' : (summary?.uniqueTurmas || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="h-5 w-5" />
              Upload do Relatório
            </CardTitle>
            <CardDescription>
              Selecione o arquivo CSV exportado da plataforma de ensino. Os dados existentes serão substituídos pelo novo relatório.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Formato esperado</AlertTitle>
              <AlertDescription>
                O arquivo deve ser um CSV com as colunas: Id Usuário, Nome Usuário, E-mail, Id Turma, Turma, Id Competência, Competência, Progresso Total, etc. 
                Cada upload <strong>substitui todos os dados anteriores</strong> de performance.
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="performance-file"
              />
              <label
                htmlFor="performance-file"
                className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                {selectedFile ? (
                  <div className="text-center">
                    <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 text-primary" />
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <UploadIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium">Clique para selecionar o arquivo CSV</p>
                    <p className="text-sm text-muted-foreground">ou arraste e solte aqui</p>
                  </div>
                )}
              </label>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processando relatório...</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={!selectedFile || isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Enviar e Processar
                  </>
                )}
              </Button>
              {selectedFile && !isUploading && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Last Upload Result */}
        {lastResult && (
          <Card className={lastResult.success ? "border-green-500/50" : "border-red-500/50"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {lastResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Resultado do Processamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{lastResult.totalRows}</p>
                  <p className="text-sm text-muted-foreground">Total de linhas</p>
                </div>
                <div className="text-center p-3 bg-green-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{lastResult.processedRecords}</p>
                  <p className="text-sm text-muted-foreground">Processados</p>
                </div>
                <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{lastResult.skippedRecords}</p>
                  <p className="text-sm text-muted-foreground">Ignorados</p>
                </div>
              </div>

              {lastResult.unmatchedStudents.length > 0 && (
                <Alert variant="default">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Alunos não vinculados ({lastResult.unmatchedStudents.length})</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">Os seguintes alunos do relatório não foram encontrados no cadastro do sistema:</p>
                    <div className="max-h-32 overflow-y-auto text-sm">
                      {lastResult.unmatchedStudents.map((name, i) => (
                        <Badge key={i} variant="outline" className="mr-1 mb-1">{name}</Badge>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {lastResult.unmatchedTurmas.length > 0 && (
                <Alert variant="default">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Turmas não vinculadas ({lastResult.unmatchedTurmas.length})</AlertTitle>
                  <AlertDescription>
                    <div className="max-h-32 overflow-y-auto text-sm">
                      {lastResult.unmatchedTurmas.map((name, i) => (
                        <Badge key={i} variant="outline" className="mr-1 mb-1">{name}</Badge>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Histórico de Uploads
                </CardTitle>
                <CardDescription>Últimos uploads de relatório de performance</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => { refetchUploads(); refetchSummary(); }}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingUploads ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !uploads || uploads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Nenhum upload realizado ainda.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Processados</TableHead>
                    <TableHead className="text-center">Ignorados</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell className="text-sm">{formatDate(upload.createdAt)}</TableCell>
                      <TableCell className="font-medium text-sm">{upload.fileName}</TableCell>
                      <TableCell className="text-center">{upload.totalRecords}</TableCell>
                      <TableCell className="text-center text-green-600">{upload.processedRecords}</TableCell>
                      <TableCell className="text-center text-yellow-600">{upload.skippedRecords}</TableCell>
                      <TableCell className="text-center">
                        {upload.status === 'completed' && (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Concluído
                          </Badge>
                        )}
                        {upload.status === 'processing' && (
                          <Badge variant="default" className="bg-blue-500">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Processando
                          </Badge>
                        )}
                        {upload.status === 'error' && (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Erro
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Confirmar Upload
              </DialogTitle>
              <DialogDescription>
                Esta ação irá <strong>substituir todos os dados de performance existentes</strong> pelos dados do novo relatório.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{selectedFile?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile && (selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              {summary && summary.totalRecords > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Atualmente existem <strong>{summary.totalRecords.toLocaleString('pt-BR')}</strong> registros de performance 
                  de <strong>{summary.uniqueStudents}</strong> alunos que serão substituídos.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpload} className="bg-primary">
                <UploadIcon className="mr-2 h-4 w-4" />
                Confirmar e Processar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
