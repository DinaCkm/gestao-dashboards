import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ProrrogacaoItem {
  id: number;
  alunoId: number;
  alunoNome: string;
  moduloId: number;
  moduloTitulo: string;
  competenciaNome: string;
  dataLimiteOriginal: Date;
  dataLimiteSolicitada: Date;
  motivoSolicitacao: string;
  status: "pendente" | "aprovada" | "rejeitada";
  dataSolicitacao: Date;
}

type TabType = "pendentes" | "aprovadas" | "rejeitadas";

export function MentorExtensionPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("pendentes");
  const [selectedProrrogacao, setSelectedProrrogacao] = useState<ProrrogacaoItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Query
  const { data: panel, isLoading, refetch } = trpc.course.getMentorPanel.useQuery();

  // Mutations
  const approveMutation = trpc.course.approveExtension.useMutation();

  const handleApprove = async (prorrogacaoId: number) => {
    setIsProcessing(true);
    try {
      await approveMutation.mutateAsync({
        prorrogacaoId,
        aprovar: true,
      });
      toast.success("Prorrogação aprovada!");
      refetch();
    } catch (error) {
      toast.error("Erro ao aprovar prorrogação");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProrrogacao || !motivoRejeicao.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }

    setIsProcessing(true);
    try {
      await approveMutation.mutateAsync({
        prorrogacaoId: selectedProrrogacao.id,
        aprovar: false,
        motivoRejeicao,
      });
      toast.success("Prorrogação rejeitada!");
      setIsDialogOpen(false);
      setMotivoRejeicao("");
      setSelectedProrrogacao(null);
      refetch();
    } catch (error) {
      toast.error("Erro ao rejeitar prorrogação");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user || (user.role !== "manager" && user.role !== "admin")) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Acesso restrito a mentores e administradores.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!panel) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Erro ao carregar painel de prorrogações.</AlertDescription>
      </Alert>
    );
  }

  const renderProrrogacaoCard = (item: ProrrogacaoItem) => (
    <Card key={item.id} className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-white">{item.alunoNome}</CardTitle>
            <CardDescription className="text-slate-400">{item.moduloTitulo}</CardDescription>
          </div>
          {activeTab === "pendentes" && (
            <Badge className="bg-yellow-600 text-white">Pendente</Badge>
          )}
          {activeTab === "aprovadas" && (
            <Badge className="bg-green-600 text-white">Aprovada</Badge>
          )}
          {activeTab === "rejeitadas" && (
            <Badge className="bg-red-600 text-white">Rejeitada</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Competência */}
        <div>
          <p className="text-sm text-slate-400">Competência</p>
          <p className="text-white font-semibold">{item.competenciaNome}</p>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-700 p-3 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">Prazo Original</p>
            <p className="text-white font-semibold text-sm">{formatDate(item.dataLimiteOriginal)}</p>
          </div>
          <div className="bg-slate-700 p-3 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">Prazo Solicitado</p>
            <p className="text-white font-semibold text-sm">{formatDate(item.dataLimiteSolicitada)}</p>
          </div>
        </div>

        {/* Motivo */}
        <div>
          <p className="text-sm text-slate-400">Motivo da Solicitação</p>
          <p className="text-slate-200 text-sm mt-1">{item.motivoSolicitacao}</p>
        </div>

        {/* Data de Solicitação */}
        <div>
          <p className="text-xs text-slate-500">Solicitado em: {formatDateTime(item.dataSolicitacao)}</p>
        </div>

        {/* Botões de Ação (apenas para pendentes) */}
        {activeTab === "pendentes" && (
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
              onClick={() => handleApprove(item.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aprovar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
              onClick={() => {
                setSelectedProrrogacao(item);
                setIsDialogOpen(true);
              }}
              disabled={isProcessing}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rejeitar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Clock className="w-8 h-8" />
            Painel de Prorrogações
          </h1>
          <p className="text-slate-400 mt-2">Gerencie solicitações de extensão de prazos</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("pendentes")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "pendentes"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🔴 Pendentes ({panel.pendentes.length})
          </button>
          <button
            onClick={() => setActiveTab("aprovadas")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "aprovadas"
                ? "text-green-400 border-b-2 border-green-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🟢 Aprovadas ({panel.aprovadas.length})
          </button>
          <button
            onClick={() => setActiveTab("rejeitadas")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "rejeitadas"
                ? "text-red-400 border-b-2 border-red-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🔵 Rejeitadas ({panel.rejeitadas.length})
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === "pendentes" && (
            <>
              {panel.pendentes.length === 0 ? (
                <Alert className="bg-slate-800 border-slate-700">
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                  <AlertDescription className="text-slate-400">
                    Nenhuma prorrogação pendente no momento.
                  </AlertDescription>
                </Alert>
              ) : (
                panel.pendentes.map(renderProrrogacaoCard)
              )}
            </>
          )}

          {activeTab === "aprovadas" && (
            <>
              {panel.aprovadas.length === 0 ? (
                <Alert className="bg-slate-800 border-slate-700">
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                  <AlertDescription className="text-slate-400">
                    Nenhuma prorrogação aprovada.
                  </AlertDescription>
                </Alert>
              ) : (
                panel.aprovadas.map(renderProrrogacaoCard)
              )}
            </>
          )}

          {activeTab === "rejeitadas" && (
            <>
              {panel.rejeitadas.length === 0 ? (
                <Alert className="bg-slate-800 border-slate-700">
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                  <AlertDescription className="text-slate-400">
                    Nenhuma prorrogação rejeitada.
                  </AlertDescription>
                </Alert>
              ) : (
                panel.rejeitadas.map(renderProrrogacaoCard)
              )}
            </>
          )}
        </div>
      </div>

      {/* Dialog de Rejeição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Rejeitar Prorrogação</DialogTitle>
            <DialogDescription className="text-slate-400">
              Informe o motivo da rejeição para {selectedProrrogacao?.alunoNome}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-slate-700 p-4 rounded-lg">
              <p className="text-sm text-slate-400">Módulo</p>
              <p className="font-semibold text-white">{selectedProrrogacao?.moduloTitulo}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Motivo da Rejeição</Label>
              <Textarea
                placeholder="Explique por que a prorrogação foi rejeitada..."
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsDialogOpen(false);
                  setMotivoRejeicao("");
                  setSelectedProrrogacao(null);
                }}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReject}
                disabled={isProcessing || !motivoRejeicao.trim()}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejeitando...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
