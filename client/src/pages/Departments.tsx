import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { 
  Building2, 
  Plus,
  Pencil,
  Trash2,
  Users,
  Shield
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

export default function DepartmentsPage() {
  const { user: currentUser } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<{ id: number; name: string; description: string } | null>(null);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptDescription, setNewDeptDescription] = useState("");

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

  // Fetch departments
  const { data: departments, refetch } = trpc.departments.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();

  const createDeptMutation = trpc.departments.create.useMutation({
    onSuccess: () => {
      toast.success("Departamento criado com sucesso!");
      refetch();
      setIsDialogOpen(false);
      setNewDeptName("");
      setNewDeptDescription("");
    },
    onError: (error) => {
      toast.error("Erro ao criar departamento: " + error.message);
    }
  });

  const updateDeptMutation = trpc.departments.update.useMutation({
    onSuccess: () => {
      toast.success("Departamento atualizado!");
      refetch();
      setEditingDept(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    }
  });

  const deleteDeptMutation = trpc.departments.delete.useMutation({
    onSuccess: () => {
      toast.success("Departamento removido!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    }
  });

  const handleCreate = () => {
    if (!newDeptName.trim()) {
      toast.error("Digite um nome para o departamento");
      return;
    }
    createDeptMutation.mutate({
      name: newDeptName,
      description: newDeptDescription || undefined
    });
  };

  const handleUpdate = () => {
    if (!editingDept || !editingDept.name.trim()) {
      toast.error("Digite um nome para o departamento");
      return;
    }
    updateDeptMutation.mutate({
      id: editingDept.id,
      name: editingDept.name,
      description: editingDept.description || undefined
    });
  };

  const getUsersInDepartment = (deptId: number) => {
    return users?.filter(u => u.departmentId === deptId).length || 0;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="geometric-accent pl-4">
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-gradient">Departamentos</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie a estrutura organizacional do sistema
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="glow-orange">
                <Plus className="mr-2 h-4 w-4" />
                Novo Departamento
              </Button>
            </DialogTrigger>
            <DialogContent className="gradient-card">
              <DialogHeader>
                <DialogTitle>Criar Departamento</DialogTitle>
                <DialogDescription>
                  Adicione um novo departamento à estrutura organizacional
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="Ex: Vendas"
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={newDeptDescription}
                    onChange={(e) => setNewDeptDescription(e.target.value)}
                    placeholder="Descrição do departamento..."
                    className="bg-input resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createDeptMutation.isPending}>
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{departments?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Total de Departamentos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users?.filter(u => u.departmentId).length || 0}</p>
                  <p className="text-xs text-muted-foreground">Usuários Alocados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users?.filter(u => !u.departmentId).length || 0}</p>
                  <p className="text-xs text-muted-foreground">Sem Departamento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments && departments.length > 0 ? (
            departments.map((dept) => (
              <Card key={dept.id} className="gradient-card card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      {editingDept?.id === dept.id ? (
                        <Input
                          value={editingDept.name}
                          onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                          className="bg-input h-8"
                        />
                      ) : (
                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {editingDept?.id === dept.id ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setEditingDept(null)}>
                            Cancelar
                          </Button>
                          <Button size="sm" onClick={handleUpdate}>
                            Salvar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => setEditingDept({ 
                              id: dept.id, 
                              name: dept.name, 
                              description: dept.description || "" 
                            })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja remover este departamento?")) {
                                deleteDeptMutation.mutate({ id: dept.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingDept?.id === dept.id ? (
                    <Textarea
                      value={editingDept.description}
                      onChange={(e) => setEditingDept({ ...editingDept, description: e.target.value })}
                      placeholder="Descrição..."
                      className="bg-input resize-none text-sm"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">
                      {dept.description || "Sem descrição"}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {getUsersInDepartment(dept.id)} colaborador(es)
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="gradient-card col-span-full">
              <CardContent className="p-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">Nenhum departamento cadastrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie o primeiro departamento para organizar sua equipe
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Departamento
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
