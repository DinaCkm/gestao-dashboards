import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { 
  ClipboardCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  MessageSquare, 
  User, 
  Building2, 
  GraduationCap,
  AlertCircle,
  Loader2,
  Eye,
  Send
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { formatDateSafe } from "@/lib/dateUtils";

type StatusFilter = "todas" | "pendente" | "em_analise" | "resolvida" | "cancelada";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock; bgClass: string }> = {
  pendente: { label: "Pendente", color: "text-amber-600", icon: Clock, bgClass: "bg-amber-50 text-amber-700 border-amber-200" },
  em_analise: { label: "Em Análise", color: "text-blue-600", icon: Eye, bgClass: "bg-blue-50 text-blue-700 border-blue-200" },
  resolvida: { label: "Resolvida", color: "text-green-600", icon: CheckCircle2, bgClass: "bg-green-50 text-green-700 border-green-200" },
  cancelada: { label: "Cancelada", color: "text-gray-500", icon: XCircle, bgClass: "bg-gray-50 text-gray-500 border-gray-200" },
};

export default function PainelRevisoes() {
  return (
    <DashboardLayout>
      <PainelRevisoesContent />
    </DashboardLayout>
  );
}

function PainelRevisoesContent() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRevisao, setSelectedRevisao] = useState<any>(null);
  const [resposta, setResposta] = useState("");
  const [respondendo, setRespondendo] = useState(false);

  const utils = trpc.useUtils();

  const { data: revisoes, isLoading } = trpc.onboarding.listarRevisoes.useQuery(
    statusFilter !== "todas" ? { status: statusFilter as any } : undefined,
    { refetchInterval: 30000 }
  );

  const { data: pendentesCount } = trpc.onboarding.contarRevisoesPendentes.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const responderMutation = trpc.onboarding.responderRevisao.useMutation({
    onSuccess: () => {
      toast.success("Revisão atualizada com sucesso!");
      utils.onboarding.listarRevisoes.invalidate();
      utils.onboarding.contarRevisoesPendentes.invalidate();
      setSelectedRevisao(null);
      setResposta("");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar revisão: " + error.message);
    },
  });

  const filteredRevisoes = useMemo(() => {
    if (!revisoes) return [];
    if (!searchTerm) return revisoes;
    const term = searchTerm.toLowerCase();
    return revisoes.filter((r: any) =>
      r.alunoNome?.toLowerCase().includes(term) ||
      r.mentorNome?.toLowerCase().includes(term) ||
      r.programaNome?.toLowerCase().includes(term) ||
      r.justificativa?.toLowerCase().includes(term)
    );
  }, [revisoes, searchTerm]);

  const handleResponder = async (status: 'em_analise' | 'resolvida' | 'cancelada') => {
    if (!selectedRevisao) return;
    setRespondendo(true);
    try {
      await responderMutation.mutateAsync({
        revisaoId: selectedRevisao.id,
        status,
        respostaAdmin: resposta || undefined,
      });
    } finally {
      setRespondendo(false);
    }
  };

  const pendentes = pendentesCount?.count || 0;

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardCheck className="h-7 w-7 text-[#1E3A5F]" />
          Painel de Revisões do PDI
          {pendentes > 0 && (
            <Badge variant="destructive" className="ml-2 text-sm">
              {pendentes} pendente{pendentes !== 1 ? 's' : ''}
            </Badge>
          )}
        </h1>
        <p className="text-gray-500 mt-1">
          Gerencie as solicitações de revisão do Plano de Desenvolvimento Individual enviadas pelos alunos durante o onboarding
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["pendente", "em_analise", "resolvida", "cancelada"] as const).map((status) => {
          const config = statusConfig[status];
          const count = revisoes?.filter((r: any) => r.status === status).length || 0;
          const StatusIcon = config.icon;
          return (
            <Card 
              key={status} 
              className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === status ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStatusFilter(statusFilter === status ? "todas" : status)}
            >
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center justify-between">
                  <StatusIcon className={`h-5 w-5 ${config.color}`} />
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por aluno, mentor, empresa ou justificativa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm bg-background"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="em_analise">Em Análise</SelectItem>
            <SelectItem value="resolvida">Resolvidas</SelectItem>
            <SelectItem value="cancelada">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Revision List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredRevisoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Nenhuma solicitação de revisão encontrada</p>
            <p className="text-sm text-gray-400 mt-1">
              {statusFilter !== "todas" ? "Tente ajustar os filtros" : "As solicitações aparecerão aqui quando alunos pedirem revisão do PDI"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRevisoes.map((revisao: any) => {
            const config = statusConfig[revisao.status] || statusConfig.pendente;
            const StatusIcon = config.icon;
            return (
              <Card key={revisao.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${config.bgClass} border`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          #{revisao.id} — {revisao.createdAt ? formatDateSafe(revisao.createdAt) : 'Data não disponível'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <strong>{revisao.alunoNome}</strong>
                        </span>
                        {revisao.programaNome && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
                            {revisao.programaNome}
                          </span>
                        )}
                        {revisao.mentorNome && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <GraduationCap className="h-3.5 w-3.5" />
                            Mentora: {revisao.mentorNome}
                          </span>
                        )}
                      </div>

                      <div className="bg-muted/50 rounded-md p-3 text-sm">
                        <p className="font-medium text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> Justificativa do aluno:
                        </p>
                        <p className="text-foreground whitespace-pre-wrap">{revisao.justificativa}</p>
                      </div>

                      {revisao.respostaAdmin && (
                        <div className="bg-green-50 rounded-md p-3 text-sm border border-green-100">
                          <p className="font-medium text-xs text-green-700 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Resposta ({revisao.resolvidoPorNome || 'Admin'}):
                          </p>
                          <p className="text-green-800 whitespace-pre-wrap">{revisao.respostaAdmin}</p>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    {(revisao.status === 'pendente' || revisao.status === 'em_analise') && (
                      <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            setSelectedRevisao(revisao);
                            setResposta("");
                          }}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Responder
                        </Button>
                        {revisao.status === 'pendente' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={async () => {
                              await responderMutation.mutateAsync({
                                revisaoId: revisao.id,
                                status: 'em_analise',
                              });
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Em Análise
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={!!selectedRevisao} onOpenChange={(open) => { if (!open) { setSelectedRevisao(null); setResposta(""); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Responder Solicitação de Revisão
            </DialogTitle>
            <DialogDescription>
              Aluno: <strong>{selectedRevisao?.alunoNome}</strong>
              {selectedRevisao?.programaNome && ` — ${selectedRevisao.programaNome}`}
            </DialogDescription>
          </DialogHeader>

          {selectedRevisao && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                <p className="font-medium text-xs text-muted-foreground mb-1">Justificativa do aluno:</p>
                <p className="text-foreground whitespace-pre-wrap">{selectedRevisao.justificativa}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sua resposta (opcional)</label>
                <Textarea
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value)}
                  placeholder="Descreva as ações tomadas ou orientações para o aluno..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => handleResponder('cancelada')}
              disabled={respondendo}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancelar Solicitação
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleResponder('resolvida')}
              disabled={respondendo}
            >
              {respondendo ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              )}
              Marcar como Resolvida
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
