import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  FileSpreadsheet, 
  Calendar,
  Download,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function HistoryPage() {
  const { user } = useAuth();
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  // Check manager access
  if (user?.role !== "admin" && user?.role !== "manager") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="gradient-card max-w-md">
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
              <p className="text-muted-foreground">
                Esta página é restrita a gerentes e administradores.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Fetch batches
  const { data: batches, isLoading } = trpc.uploads.listBatches.useQuery({ limit: 50 });
  const { data: batchFiles } = trpc.uploads.getBatchFiles.useQuery(
    { batchId: selectedBatchId! },
    { enabled: !!selectedBatchId }
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "processed":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído";
      case "processed":
        return "Processado";
      case "error":
        return "Erro";
      case "processing":
        return "Processando";
      default:
        return "Pendente";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="geometric-accent pl-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Histórico de <span className="text-gradient">Uploads</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize todos os lotes de planilhas carregados no sistema
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{batches?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Total de Lotes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {batches?.filter(b => b.status === 'completed').length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Processados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {batches?.filter(b => b.status === 'pending' || b.status === 'processing').length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {batches?.filter(b => b.status === 'error').length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Com Erro</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Batches List */}
          <div className="lg:col-span-2">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle>Lotes de Upload</CardTitle>
                <CardDescription>
                  Clique em um lote para ver os arquivos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : batches && batches.length > 0 ? (
                  <div className="space-y-3">
                    {batches.map((batch) => (
                      <div 
                        key={batch.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedBatchId === batch.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-muted/30 border-border hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedBatchId(batch.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                              <FileSpreadsheet className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">Semana {batch.weekNumber}/{batch.year}</p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(batch.createdAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getStatusIcon(batch.status)}
                            <span className={`text-sm ${
                              batch.status === 'completed' ? 'text-green-400' :
                              batch.status === 'error' ? 'text-red-400' :
                              'text-muted-foreground'
                            }`}>
                              {getStatusLabel(batch.status)}
                            </span>
                          </div>
                        </div>
                        
                        {batch.notes && (
                          <p className="text-sm text-muted-foreground mt-3 pl-16">
                            {batch.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum upload realizado</p>
                    <p className="text-sm">Os lotes de planilhas aparecerão aqui</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Batch Details */}
          <div>
            <Card className="gradient-card sticky top-4">
              <CardHeader>
                <CardTitle>Arquivos do Lote</CardTitle>
                <CardDescription>
                  {selectedBatchId ? `Lote #${selectedBatchId}` : 'Selecione um lote'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedBatchId ? (
                  batchFiles && batchFiles.length > 0 ? (
                    <div className="space-y-3">
                      {batchFiles.map((file) => (
                        <div 
                          key={file.id}
                          className="p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                file.fileType === 'mentoria' 
                                  ? 'bg-primary/20' 
                                  : file.fileType === 'eventos' ? 'bg-secondary/20' : 'bg-chart-3/20'
                              }`}>
                                <FileSpreadsheet className={`h-4 w-4 ${
                                  file.fileType === 'mentoria' 
                                    ? 'text-primary' 
                                    : file.fileType === 'eventos' ? 'text-secondary' : 'text-chart-3'
                                }`} />
                              </div>
                              <div>
                                <p className="text-sm font-medium truncate max-w-[150px]">
                                  {file.fileName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {file.fileType === 'mentoria' ? 'Mentoria' : file.fileType === 'eventos' ? 'Eventos' : file.fileType === 'alunos' ? 'Alunos' : 'Outros'}
                                </p>
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
                          
                          {file.fileUrl && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => window.open(file.fileUrl, '_blank')}
                            >
                              <Download className="h-3 w-3 mr-2" />
                              Baixar
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum arquivo neste lote</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Selecione um lote para ver os arquivos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
