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
  Shield,
  Users,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Configuração dos tipos de arquivo
const FILE_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  sebraeacre_mentorias: { label: "SEBRAE ACRE - Mentorias", color: "text-primary", bgColor: "bg-primary/20" },
  sebraeacre_eventos: { label: "SEBRAE ACRE - Eventos", color: "text-primary", bgColor: "bg-primary/10" },
  sebraeto_mentorias: { label: "SEBRAE TO - Mentorias", color: "text-secondary", bgColor: "bg-secondary/20" },
  sebraeto_eventos: { label: "SEBRAE TO - Eventos", color: "text-secondary", bgColor: "bg-secondary/10" },
  embrapii_mentorias: { label: "EMBRAPII - Mentorias", color: "text-chart-3", bgColor: "bg-chart-3/20" },
  embrapii_eventos: { label: "EMBRAPII - Eventos", color: "text-chart-3", bgColor: "bg-chart-3/10" },
  performance: { label: "Relatório de Performance", color: "text-chart-4", bgColor: "bg-chart-4/20" }
};

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

  const getFileConfig = (fileType: string) => {
    return FILE_TYPE_CONFIG[fileType] || { label: fileType, color: "text-muted-foreground", bgColor: "bg-muted" };
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('mentorias')) return Users;
    if (fileType.includes('eventos')) return Calendar;
    if (fileType === 'performance') return BarChart3;
    return FileSpreadsheet;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gradient">Histórico de Uploads</h1>
          <p className="text-muted-foreground mt-1">
            Visualize todos os lotes de planilhas enviados ao sistema
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Batch List */}
          <div className="lg:col-span-1">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Lotes Enviados
                </CardTitle>
                <CardDescription>
                  Selecione um lote para ver detalhes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : batches && batches.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {batches.map((batch) => (
                      <button
                        key={batch.id}
                        onClick={() => setSelectedBatchId(batch.id)}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          selectedBatchId === batch.id
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-background/30 border border-border/30 hover:bg-background/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              Semana {batch.weekNumber}/{batch.year}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {batch.totalRecords || 0} registro(s)
                            </p>
                          </div>
                          {getStatusIcon(batch.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(batch.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
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
                  {selectedBatchId 
                    ? `Arquivos do lote selecionado`
                    : "Selecione um lote para ver os arquivos"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedBatchId && batchFiles ? (
                  <div className="space-y-4">
                    {/* Batch Info */}
                    {batches && (
                      <div className="p-4 rounded-lg bg-background/30 border border-border/30">
                        {(() => {
                          const batch = batches.find(b => b.id === selectedBatchId);
                          if (!batch) return null;
                          return (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Semana</p>
                                <p className="font-medium">{batch.weekNumber}/{batch.year}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Arquivos</p>
                                <p className="font-medium">{batch.totalRecords || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Status</p>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(batch.status)}
                                  <span className="font-medium capitalize">{batch.status}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Data</p>
                                <p className="font-medium">
                                  {new Date(batch.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Files Grid */}
                    <div className="grid gap-3 md:grid-cols-2">
                      {batchFiles.map((file) => {
                        const config = getFileConfig(file.fileType);
                        const Icon = getFileIcon(file.fileType);
                        
                        return (
                          <div
                            key={file.id}
                            className="p-4 rounded-lg bg-background/30 border border-border/30"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                                  <Icon className={`h-4 w-4 ${config.color}`} />
                                </div>
                                <div>
                                  <p className="text-sm font-medium truncate max-w-[150px]">
                                    {file.fileName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {config.label}
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
                                className="w-full mt-3"
                                onClick={() => window.open(file.fileUrl, '_blank')}
                              >
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
      </div>
    </DashboardLayout>
  );
}
