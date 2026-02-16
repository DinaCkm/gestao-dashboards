import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { 
  Calculator, 
  Plus,
  Pencil,
  Trash2,
  Shield,
  Code,
  Info
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export default function FormulasPage() {
  const { user: currentUser } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<{
    id: number;
    name: string;
    description: string;
    formula: string;
    isActive: boolean;
  } | null>(null);
  const [newFormula, setNewFormula] = useState({
    name: "",
    description: "",
    formula: "",
    isActive: true
  });

  // Check admin access
  if (currentUser?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="gradient-card max-w-md">
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
              <p className="text-muted-foreground">
                Esta página é restrita a administradores do sistema.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Fetch formulas
  const { data: formulas, refetch } = trpc.formulas.list.useQuery();

  const createFormulaMutation = trpc.formulas.create.useMutation({
    onSuccess: () => {
      toast.success("Fórmula criada com sucesso!");
      refetch();
      setIsDialogOpen(false);
      setNewFormula({ name: "", description: "", formula: "", isActive: true });
    },
    onError: (error) => {
      toast.error("Erro ao criar fórmula: " + error.message);
    }
  });

  const updateFormulaMutation = trpc.formulas.update.useMutation({
    onSuccess: () => {
      toast.success("Fórmula atualizada!");
      refetch();
      setEditingFormula(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    }
  });

  const deleteFormulaMutation = trpc.formulas.delete.useMutation({
    onSuccess: () => {
      toast.success("Fórmula removida!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    }
  });

  const handleCreate = () => {
    if (!newFormula.name.trim() || !newFormula.formula.trim()) {
      toast.error("Preencha o nome e a fórmula");
      return;
    }
    createFormulaMutation.mutate(newFormula);
  };

  const handleUpdate = () => {
    if (!editingFormula || !editingFormula.name.trim() || !editingFormula.formula.trim()) {
      toast.error("Preencha o nome e a fórmula");
      return;
    }
    updateFormulaMutation.mutate({
      id: editingFormula.id,
      name: editingFormula.name,
      description: editingFormula.description || undefined,
      formula: editingFormula.formula
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="geometric-accent pl-4">
            <h1 className="text-3xl font-bold tracking-tight">
              Fórmulas de <span className="text-gradient">Cálculo</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure as fórmulas utilizadas para processar os dados das planilhas
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="glow-orange">
                <Plus className="mr-2 h-4 w-4" />
                Nova Fórmula
              </Button>
            </DialogTrigger>
            <DialogContent className="gradient-card max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Fórmula</DialogTitle>
                <DialogDescription>
                  Defina uma nova fórmula de cálculo para o sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Fórmula</Label>
                  <Input
                    id="name"
                    value={newFormula.name}
                    onChange={(e) => setNewFormula({ ...newFormula, name: e.target.value })}
                    placeholder="Ex: Cálculo de Performance"
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newFormula.description}
                    onChange={(e) => setNewFormula({ ...newFormula, description: e.target.value })}
                    placeholder="Descreva o que esta fórmula calcula..."
                    className="bg-input resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formula">Fórmula</Label>
                  <Textarea
                    id="formula"
                    value={newFormula.formula}
                    onChange={(e) => setNewFormula({ ...newFormula, formula: e.target.value })}
                    placeholder="Ex: (vendas / meta) * 100"
                    className="bg-input resize-none font-mono text-sm h-24"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use nomes de colunas das planilhas como variáveis
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Fórmula Ativa</Label>
                  <Switch
                    id="active"
                    checked={newFormula.isActive}
                    onCheckedChange={(checked) => setNewFormula({ ...newFormula, isActive: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createFormulaMutation.isPending}>
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Card */}
        <Card className="gradient-card border-secondary/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Como funcionam as fórmulas</p>
                <p className="text-sm text-muted-foreground">
                  As fórmulas são aplicadas automaticamente aos dados das planilhas durante o processamento. 
                  Use nomes de colunas como variáveis (ex: vendas, meta, horas_trabalhadas). 
                  Operadores suportados: +, -, *, /, (), %.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formulas?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Total de Fórmulas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formulas?.filter(f => f.isActive).length || 0}</p>
                  <p className="text-xs text-muted-foreground">Fórmulas Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formulas?.filter(f => !f.isActive).length || 0}</p>
                  <p className="text-xs text-muted-foreground">Fórmulas Inativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulas List */}
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle>Fórmulas Cadastradas</CardTitle>
            <CardDescription>
              Gerencie as fórmulas de cálculo do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formulas && formulas.length > 0 ? (
                formulas.map((formula) => (
                  <div 
                    key={formula.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      formula.isActive === 1 
                        ? 'bg-muted/30 border-border hover:bg-muted/50' 
                        : 'bg-muted/10 border-border/50 opacity-60'
                    }`}
                  >
                    {editingFormula?.id === formula.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                              value={editingFormula.name}
                              onChange={(e) => setEditingFormula({ ...editingFormula, name: e.target.value })}
                              className="bg-input"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input
                              value={editingFormula.description}
                              onChange={(e) => setEditingFormula({ ...editingFormula, description: e.target.value })}
                              className="bg-input"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Fórmula</Label>
                          <Textarea
                            value={editingFormula.formula}
                            onChange={(e) => setEditingFormula({ ...editingFormula, formula: e.target.value })}
                            className="bg-input font-mono text-sm resize-none"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editingFormula.isActive}
                              onCheckedChange={(checked) => setEditingFormula({ ...editingFormula, isActive: checked })}
                            />
                            <Label>Ativa</Label>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setEditingFormula(null)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleUpdate}>
                              Salvar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            formula.isActive === 1 ? 'bg-primary/20' : 'bg-muted'
                          }`}>
                            <Calculator className={`h-5 w-5 ${formula.isActive === 1 ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{formula.name}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                formula.isActive === 1 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {formula.isActive === 1 ? 'Ativa' : 'Inativa'}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formula.description || "Sem descrição"}
                            </p>
                            <div className="mt-3 p-2 rounded bg-muted/50 font-mono text-sm flex items-center gap-2">
                              <Code className="h-4 w-4 text-secondary" />
                              <code>{formula.formula}</code>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => setEditingFormula({
                              id: formula.id,
                              name: formula.name,
                              description: formula.description || "",
                              formula: formula.formula,
                              isActive: formula.isActive === 1
                            })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja remover esta fórmula?")) {
                                deleteFormulaMutation.mutate({ id: formula.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold mb-2">Nenhuma fórmula cadastrada</h3>
                  <p className="text-sm mb-4">
                    Crie a primeira fórmula para processar os dados das planilhas
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Fórmula
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
