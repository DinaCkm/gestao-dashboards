import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, Calendar, Hash, Building2, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ContratoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alunoId: number;
  alunoNome: string;
  empresas: { id: number; name: string }[];
}

export function ContratoDialog({ open, onOpenChange, alunoId, alunoNome, empresas }: ContratoDialogProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [programId, setProgramId] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoTermino, setPeriodoTermino] = useState("");
  const [totalSessoes, setTotalSessoes] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const { data: contratos, isLoading, refetch } = trpc.contratos.byAluno.useQuery(
    { alunoId },
    { enabled: open }
  );

  const { data: saldo } = trpc.contratos.saldo.useQuery(
    { alunoId },
    { enabled: open }
  );

  const createMutation = trpc.contratos.create.useMutation({
    onSuccess: () => {
      toast.success("Contrato criado com sucesso");
      resetForm();
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.contratos.update.useMutation({
    onSuccess: () => {
      toast.success("Contrato atualizado com sucesso");
      resetForm();
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.contratos.delete.useMutation({
    onSuccess: () => {
      toast.success("Contrato removido");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setProgramId("");
    setPeriodoInicio("");
    setPeriodoTermino("");
    setTotalSessoes("");
    setObservacoes("");
  }

  function handleEdit(contrato: any) {
    setEditingId(contrato.id);
    setProgramId(contrato.programId?.toString() || "");
    setPeriodoInicio(contrato.periodoInicio ? new Date(contrato.periodoInicio).toISOString().split("T")[0] : "");
    setPeriodoTermino(contrato.periodoTermino ? new Date(contrato.periodoTermino).toISOString().split("T")[0] : "");
    setTotalSessoes(contrato.totalSessoesContratadas?.toString() || "");
    setObservacoes(contrato.observacoes || "");
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!programId || !periodoInicio || !periodoTermino || !totalSessoes) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const data = {
      programId: parseInt(programId),
      periodoInicio,
      periodoTermino,
      totalSessoesContratadas: parseInt(totalSessoes),
      observacoes: observacoes || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate({ alunoId, ...data });
    }
  }

  const formatDate = (d: any) => {
    if (!d) return "-";
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto z-50" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Definições Contratuais
          </DialogTitle>
          <DialogDescription>
            Gerencie os contratos de <strong>{alunoNome}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Saldo de Sessões */}
        {saldo && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
              <p className="text-xs text-blue-600 font-medium">Contratadas</p>
              <p className="text-2xl font-bold text-blue-700">{saldo.totalContratadas}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
              <p className="text-xs text-green-600 font-medium">Realizadas</p>
              <p className="text-2xl font-bold text-green-700">{saldo.sessoesRealizadas}</p>
            </div>
            <div className={`p-3 rounded-lg text-center ${saldo.saldoRestante <= 2 ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
              <p className={`text-xs font-medium ${saldo.saldoRestante <= 2 ? "text-red-600" : "text-amber-600"}`}>Restantes</p>
              <p className={`text-2xl font-bold ${saldo.saldoRestante <= 2 ? "text-red-700" : "text-amber-700"}`}>{saldo.saldoRestante}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <>
            {/* Lista de contratos existentes */}
            {contratos && contratos.length > 0 ? (
              <div className="space-y-3">
                {contratos.map((contrato: any) => (
                  <Card key={contrato.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {empresas.find(e => e.id === contrato.programId)?.name || `Empresa #${contrato.programId}`}
                            </span>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Ativo
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(contrato.periodoInicio)} a {formatDate(contrato.periodoTermino)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Hash className="h-3.5 w-3.5" />
                              {contrato.totalSessoesContratadas} sessões
                            </span>
                          </div>
                          {contrato.observacoes && (
                            <p className="text-sm text-gray-500 italic">{contrato.observacoes}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(contrato)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              if (confirm("Deseja remover este contrato?")) {
                                deleteMutation.mutate({ id: contrato.id });
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !showForm ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p>Nenhum contrato cadastrado para este aluno.</p>
                <p className="text-sm">Clique em "Novo Contrato" para começar.</p>
              </div>
            ) : null}

            {/* Formulário de criação/edição */}
            {showForm ? (
              <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4 mt-4">
                <h4 className="font-medium text-sm text-gray-700">
                  {editingId ? "Editar Contrato" : "Novo Contrato"}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Empresa (Programa) *</Label>
                    <select
                      value={programId}
                      onChange={(e) => setProgramId(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      required
                    >
                      <option value="">Selecione a empresa</option>
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id.toString()}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Período Início *</Label>
                    <Input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Período Término *</Label>
                    <Input type="date" value={periodoTermino} onChange={(e) => setPeriodoTermino(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Nº Total de Sessões *</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      value={totalSessoes} 
                      onChange={(e) => setTotalSessoes(e.target.value)} 
                      placeholder="Ex: 10" 
                      required 
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Observações</Label>
                    <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações sobre o contrato..." />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
                    ) : editingId ? "Atualizar" : "Criar Contrato"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex justify-end pt-2">
                <Button onClick={() => setShowForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Novo Contrato
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
