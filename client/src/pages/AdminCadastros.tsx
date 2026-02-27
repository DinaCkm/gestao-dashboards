import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectContentNoPortal, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Building2, Users, UserCheck, KeyRound, Pencil, CheckCircle, AlertCircle, Power, GraduationCap } from "lucide-react";
import { toast } from "sonner";

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function displayCpf(cpf: string | null): string {
  if (!cpf) return "-";
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  manager: "Gestor de Empresa",
  mentor: "Mentor",
  user: "Aluno",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-600",
  manager: "bg-blue-600",
  mentor: "bg-purple-600",
  user: "bg-green-600",
};

// Helper to determine display role (mentor vs manager)
function getDisplayRole(user: any): string {
  if (user.role === 'manager' && user.consultorId) return 'mentor';
  return user.role;
}

export default function AdminCadastros() {
  const [activeTab, setActiveTab] = useState("acesso");

  // Queries
  const { data: empresas, refetch: refetchEmpresas, isLoading: loadingEmpresas } = trpc.admin.listEmpresas.useQuery();
  const { data: mentores, refetch: refetchMentores, isLoading: loadingMentores } = trpc.admin.listMentores.useQuery();
  const { data: gerentes, refetch: refetchGerentes, isLoading: loadingGerentes } = trpc.admin.listGerentes.useQuery();
  const { data: accessUsers, refetch: refetchAccessUsers, isLoading: loadingAccessUsers } = trpc.admin.listAccessUsers.useQuery();

  // Mutations
  const createEmpresa = trpc.admin.createEmpresa.useMutation({
    onSuccess: () => {
      toast.success("Empresa criada com sucesso!");
      refetchEmpresas();
    },
    onError: (err) => toast.error(`Erro ao criar empresa: ${err.message}`),
  });

  const createMentor = trpc.admin.createMentor.useMutation({
    onSuccess: () => {
      toast.success("Mentor criado com sucesso!");
      refetchMentores();
    },
    onError: (err) => toast.error(`Erro ao criar mentor: ${err.message}`),
  });

  const createGerente = trpc.admin.createGerente.useMutation({
    onSuccess: () => {
      toast.success("Gerente criado com sucesso!");
      refetchGerentes();
    },
    onError: (err) => toast.error(`Erro ao criar gerente: ${err.message}`),
  });

  const updateAcessoMentor = trpc.admin.updateAcessoMentor.useMutation({
    onSuccess: () => {
      toast.success("Acesso do mentor atualizado!");
      refetchMentores();
    },
    onError: (err) => toast.error(`Erro ao atualizar acesso: ${err.message}`),
  });

  const updateAcessoGerente = trpc.admin.updateAcessoGerente.useMutation({
    onSuccess: () => {
      toast.success("Acesso do gerente atualizado!");
      refetchGerentes();
    },
    onError: (err) => toast.error(`Erro ao atualizar acesso: ${err.message}`),
  });

  const createAccessUser = trpc.admin.createAccessUser.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Usuário criado com sucesso!");
        refetchAccessUsers();
      } else {
        toast.error(data.message || "Erro ao criar usuário");
      }
    },
    onError: (err) => toast.error(`Erro ao criar usuário: ${err.message}`),
  });

  const toggleAccessUserStatus = trpc.admin.toggleAccessUserStatus.useMutation({
    onSuccess: () => {
      toast.success("Status do usuário atualizado!");
      refetchAccessUsers();
    },
    onError: (err) => toast.error(`Erro ao atualizar status: ${err.message}`),
  });

  const updateAccessUser = trpc.admin.updateAccessUser.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Usuário atualizado com sucesso!");
        refetchAccessUsers();
      } else {
        toast.error(data.message || "Erro ao atualizar usuário");
      }
    },
    onError: (err) => toast.error(`Erro ao atualizar usuário: ${err.message}`),
  });

  const updateEmpresa = trpc.admin.updateEmpresa.useMutation({
    onSuccess: () => {
      toast.success("Empresa atualizada com sucesso!");
      refetchEmpresas();
    },
    onError: (err) => toast.error(`Erro ao atualizar empresa: ${err.message}`),
  });

  const toggleEmpresaStatus = trpc.admin.toggleEmpresaStatus.useMutation({
    onSuccess: () => {
      toast.success("Status da empresa atualizado!");
      refetchEmpresas();
    },
    onError: (err) => toast.error(`Erro ao atualizar status: ${err.message}`),
  });

  const editMentor = trpc.admin.editMentor.useMutation({
    onSuccess: () => {
      toast.success("Mentor atualizado com sucesso!");
      refetchMentores();
    },
    onError: (err) => toast.error(`Erro ao atualizar mentor: ${err.message}`),
  });

  const editGerente = trpc.admin.editGerente.useMutation({
    onSuccess: () => {
      toast.success("Gerente atualizado com sucesso!");
      refetchGerentes();
    },
    onError: (err) => toast.error(`Erro ao atualizar gerente: ${err.message}`),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cadastros</h1>
          <p className="text-muted-foreground">
            Gerencie empresas, mentores, gerentes e acesso de usuários
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="acesso" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Alunos
            </TabsTrigger>
            <TabsTrigger value="empresas" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresas
            </TabsTrigger>
            <TabsTrigger value="mentores" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Mentores
            </TabsTrigger>
            <TabsTrigger value="gerentes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gerentes
            </TabsTrigger>
          </TabsList>

          {/* Alunos Tab */}
          <TabsContent value="acesso">
            <GestaoAcessoTab
              accessUsers={(accessUsers || []).filter((u: any) => u.role === 'user')}
              empresas={empresas || []}
              loading={loadingAccessUsers}
              onCreate={createAccessUser.mutate}
              onToggleStatus={toggleAccessUserStatus.mutate}
              onUpdate={updateAccessUser.mutate}
              isCreating={createAccessUser.isPending}
            />
          </TabsContent>

          {/* Empresas Tab */}
          <TabsContent value="empresas">
            <EmpresasTab 
              empresas={empresas || []} 
              loading={loadingEmpresas}
              onCreate={createEmpresa.mutate}
              isCreating={createEmpresa.isPending}
              onUpdate={updateEmpresa.mutate}
              onToggleStatus={toggleEmpresaStatus.mutate}
            />
          </TabsContent>

          {/* Mentores Tab */}
          <TabsContent value="mentores">
            <MentoresTab 
              mentores={mentores || []} 
              empresas={empresas || []}
              loading={loadingMentores}
              onCreate={createMentor.mutate}
              onUpdateAcesso={updateAcessoMentor.mutate}
              isCreating={createMentor.isPending}
              onEdit={editMentor.mutate}
            />
          </TabsContent>

          {/* Gerentes Tab */}
          <TabsContent value="gerentes">
            <GerentesTab 
              gerentes={gerentes || []} 
              empresas={empresas || []}
              loading={loadingGerentes}
              onCreate={createGerente.mutate}
              onUpdateAcesso={updateAcessoGerente.mutate}
              isCreating={createGerente.isPending}
              onEdit={editGerente.mutate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// ============ ALUNOS TAB ============
function GestaoAcessoTab({ accessUsers, empresas, loading, onCreate, onToggleStatus, onUpdate, isCreating }: {
  accessUsers: any[];
  empresas: any[];
  loading: boolean;
  onCreate: (data: any) => void;
  onToggleStatus: (data: any) => void;
  onUpdate: (data: any) => void;
  isCreating: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  
  // Create form
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [programId, setProgramId] = useState("");

  // Edit form
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editProgramId, setEditProgramId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const credentialDigits = cpf.replace(/\D/g, '');
    if (credentialDigits.length === 0) {
      toast.error("ID do aluno deve ser informado");
      return;
    }
    if (!programId) {
      toast.error("Selecione a empresa vinculada");
      return;
    }
    onCreate({ 
      name: nome, 
      email, 
      cpf: credentialDigits,
      role: "user" as "user" | "admin" | "manager",
      programId: parseInt(programId),
      isMentor: false,
    });
    setNome("");
    setEmail("");
    setCpf("");
    setProgramId("");
    setOpen(false);
  };

  const handleEditOpen = (user: any) => {
    setEditUser(user);
    setEditNome(user.name || "");
    setEditEmail(user.email || "");
    setEditCpf(user.cpf || "");
    setEditProgramId(user.programId ? user.programId.toString() : "");
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    const editCredentialDigits = editCpf.replace(/\D/g, '');
    if (editCredentialDigits.length === 0) {
      toast.error("ID do aluno deve ser informado");
      return;
    }
    onUpdate({
      userId: editUser.id,
      name: editNome,
      email: editEmail,
      cpf: editCredentialDigits,
      role: "user" as "user" | "admin" | "manager",
      programId: editProgramId ? parseInt(editProgramId) : null,
    });
    setEditOpen(false);
    setEditUser(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Alunos
          </CardTitle>
          <CardDescription>
            Cadastro e gerenciamento dos alunos que acessam a plataforma por Email + ID.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) setOpen(false); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Aluno</Button>
          </DialogTrigger>
          <DialogContent className="z-50" onPointerDownOutside={(e) => e.preventDefault()}>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
                <DialogDescription>
                  Preencha os dados do aluno. Ele fará login com Email + ID.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="access-nome">Nome Completo *</Label>
                  <Input id="access-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access-email">Email *</Label>
                  <Input id="access-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access-cpf">ID do Aluno *</Label>
                  <Input 
                    id="access-cpf" 
                    value={cpf} 
                    onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))} 
                    placeholder="Ex: 667306" 
                    required 
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access-empresa">Empresa Vinculada *</Label>
                  <select
                    id="access-empresa"
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Selecione a empresa</option>
                    {empresas.map((emp) => (
                      <option key={emp.id} value={emp.id.toString()}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="z-50" onPointerDownOutside={(e) => e.preventDefault()}>
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Editar Aluno</DialogTitle>
                <DialogDescription>Altere os dados do aluno</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>ID do Aluno *</Label>
                  <Input 
                    value={editCpf} 
                    onChange={(e) => setEditCpf(e.target.value.replace(/\D/g, ''))} 
                    required 
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Empresa Vinculada *</Label>
                  <select
                    value={editProgramId}
                    onChange={(e) => setEditProgramId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Selecione a empresa</option>
                    {empresas.map((emp) => (
                      <option key={emp.id} value={emp.id.toString()}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            {/* Summary cards - por empresa */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
                <p className="text-2xl font-bold">{accessUsers.length}</p>
              </div>
              {empresas.map((emp: any) => {
                const count = accessUsers.filter(u => u.programId === emp.id).length;
                if (count === 0) return null;
                return (
                  <div key={emp.id} className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-muted-foreground">{emp.name}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                );
              })}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...accessUsers].sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0)).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{user.cpf || "-"}</TableCell>
                    <TableCell>
{user.programName || "-"}
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Ativo</Badge>
                      ) : (
                        <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditOpen(user)}
                        >
                          <Pencil className="h-3 w-3 mr-1" /> Editar
                        </Button>
                        <Button 
                          variant={user.isActive ? "destructive" : "default"} 
                          size="sm"
                          onClick={() => onToggleStatus({ userId: user.id })}
                        >
                          <Power className="h-3 w-3 mr-1" />
                          {user.isActive ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {accessUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum aluno cadastrado. Clique em "Novo Aluno" para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============ EMPRESAS TAB ============
function EmpresasTab({ empresas, loading, onCreate, isCreating, onUpdate, onToggleStatus }: {
  empresas: any[];
  loading: boolean;
  onCreate: (data: any) => void;
  isCreating: boolean;
  onUpdate: (data: any) => void;
  onToggleStatus: (data: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editEmpresa, setEditEmpresa] = useState<any>(null);
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editNome, setEditNome] = useState("");
  const [editCodigo, setEditCodigo] = useState("");
  const [editDescricao, setEditDescricao] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ name: nome, code: codigo, description: descricao });
    setNome("");
    setCodigo("");
    setDescricao("");
    setOpen(false);
  };

  const handleEditOpen = (empresa: any) => {
    setEditEmpresa(empresa);
    setEditNome(empresa.name || "");
    setEditCodigo(empresa.code || "");
    setEditDescricao(empresa.description || "");
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmpresa) return;
    onUpdate({ id: editEmpresa.id, name: editNome, code: editCodigo, description: editDescricao });
    setEditOpen(false);
    setEditEmpresa(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Empresas / Programas</CardTitle>
          <CardDescription>Gerencie as empresas parceiras do programa</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Empresa</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
                <DialogDescription>Preencha os dados da empresa/programa</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Empresa</Label>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: SEBRAE ACRE" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex: SEBRAEACRE" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição (opcional)</Label>
                  <Input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição do programa" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresas.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell>{empresa.id}</TableCell>
                    <TableCell className="font-medium">{empresa.name}</TableCell>
                    <TableCell>{empresa.code}</TableCell>
                    <TableCell>
                      <Badge variant={empresa.isActive ? "default" : "secondary"}>
                        {empresa.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditOpen(empresa)}>
                          <Pencil className="h-3 w-3 mr-1" /> Editar
                        </Button>
                        <Button
                          variant={empresa.isActive ? "destructive" : "default"}
                          size="sm"
                          onClick={() => onToggleStatus({ id: empresa.id })}
                        >
                          <Power className="h-3 w-3 mr-1" />
                          {empresa.isActive ? "Inativar" : "Ativar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {empresas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhuma empresa cadastrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Dialog de Edição */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent>
                <form onSubmit={handleEditSubmit}>
                  <DialogHeader>
                    <DialogTitle>Editar Empresa</DialogTitle>
                    <DialogDescription>Atualize os dados da empresa</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nome da Empresa</Label>
                      <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Código</Label>
                      <Input value={editCodigo} onChange={(e) => setEditCodigo(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Input value={editDescricao} onChange={(e) => setEditDescricao(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Salvar Alterações</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============ MENTORES TAB ============
function MentoresTab({ mentores, empresas, loading, onCreate, onUpdateAcesso, isCreating, onEdit }: {
  mentores: any[];
  empresas: any[];
  loading: boolean;
  onCreate: (data: any) => void;
  onUpdateAcesso: (data: any) => void;
  isCreating: boolean;
  onEdit: (data: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editMentor, setEditMentor] = useState<any>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpfMentor, setCpfMentor] = useState("");
  const [loginId, setLoginId] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editEspecialidade, setEditEspecialidade] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const cpfDigits = cpfMentor.replace(/\D/g, '');
    
    // Validação obrigatória de email
    if (!trimmedEmail) {
      toast.error("Email é obrigatório");
      return;
    }
    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Email inválido. Informe um email válido (ex: nome@empresa.com)");
      return;
    }
    // Validação obrigatória de CPF
    if (!cpfDigits || cpfDigits.length !== 11) {
      toast.error("CPF é obrigatório e deve conter 11 dígitos");
      return;
    }
    
    onCreate({ 
      name: nome, 
      email: trimmedEmail, 
      cpf: cpfDigits,
      especialidade: especialidade || undefined,
      loginId: loginId || undefined
    });
    setNome("");
    setEmail("");
    setCpfMentor("");
    setLoginId("");
    setEspecialidade("");
    setOpen(false);
  };

  const handleToggleAcesso = (mentorId: number, currentLoginId: string | null, email: string) => {
    if (currentLoginId) {
      onUpdateAcesso({ consultorId: mentorId, loginId: null, canLogin: false });
    } else {
      const newLoginId = `M${mentorId.toString().padStart(4, '0')}`;
      onUpdateAcesso({ consultorId: mentorId, loginId: newLoginId, canLogin: true });
    }
  };

  const handleEditOpen = (mentor: any) => {
    setEditMentor(mentor);
    setEditNome(mentor.name || "");
    setEditEmail(mentor.email || "");
    setEditCpf(mentor.cpf ? formatCpf(mentor.cpf) : "");
    setEditEspecialidade(mentor.especialidade || "");
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMentor) return;
    const cpfDigits = editCpf.replace(/\D/g, '');
    onEdit({ 
      consultorId: editMentor.id, 
      name: editNome, 
      email: editEmail || undefined,
      cpf: cpfDigits || undefined,
      especialidade: editEspecialidade || undefined
    });
    setEditOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Mentores</CardTitle>
          <CardDescription>Gerencie os mentores do programa</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Mentor</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Mentor</DialogTitle>
                <DialogDescription>Preencha os dados do mentor</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome-mentor">Nome Completo</Label>
                  <Input id="nome-mentor" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do mentor" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-mentor">Email *</Label>
                  <Input id="email-mentor" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf-mentor">CPF *</Label>
                  <Input id="cpf-mentor" value={cpfMentor} onChange={(e) => setCpfMentor(formatCpf(e.target.value))} placeholder="000.000.000-00" maxLength={14} required />
                  <p className="text-xs text-muted-foreground">CPF é obrigatório e usado para login do mentor (Email + CPF)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="especialidade-mentor">Especialidade</Label>
                  <Input id="especialidade-mentor" value={especialidade} onChange={(e) => setEspecialidade(e.target.value)} placeholder="Ex: Gestão, Finanças, Marketing, Liderança" />
                  <p className="text-xs text-muted-foreground">Área de atuação principal do mentor</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginId-mentor">ID de Login (opcional)</Label>
                  <Input id="loginId-mentor" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="Ex: M0001" />
                  <p className="text-xs text-muted-foreground">Se não informado, será gerado automaticamente ao ativar o acesso</p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>ID Login</TableHead>
                <TableHead>Acesso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...mentores].sort((a, b) => (b.canLogin ? 1 : 0) - (a.canLogin ? 1 : 0)).map((mentor) => (
                <TableRow key={mentor.id}>
                  <TableCell>{mentor.id}</TableCell>
                  <TableCell className="font-medium">{mentor.name}</TableCell>
                  <TableCell>{mentor.especialidade || <span className="text-muted-foreground italic">Não informada</span>}</TableCell>
                  <TableCell>{mentor.email || "-"}</TableCell>
                  <TableCell className="font-mono text-sm">{mentor.cpf ? displayCpf(mentor.cpf) : "-"}</TableCell>
                  <TableCell>{mentor.loginId || "-"}</TableCell>
                  <TableCell>
                    {mentor.canLogin ? (
                      <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Ativo</Badge>
                    ) : (
                      <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditOpen(mentor)}
                      >
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                      <Button 
                        variant={mentor.canLogin ? "destructive" : "default"} 
                        size="sm"
                        onClick={() => handleToggleAcesso(mentor.id, mentor.loginId, mentor.email)}
                      >
                        {mentor.canLogin ? "Desativar" : "Ativar Acesso"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {mentores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum mentor cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* Dialog de Edição de Mentor */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Editar Mentor</DialogTitle>
                <DialogDescription>Atualize os dados do mentor</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nome-mentor">Nome Completo</Label>
                  <Input id="edit-nome-mentor" value={editNome} onChange={(e) => setEditNome(e.target.value)} placeholder="Nome do mentor" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email-mentor">Email</Label>
                  <Input id="edit-email-mentor" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="email@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cpf-mentor">CPF</Label>
                  <Input id="edit-cpf-mentor" value={editCpf} onChange={(e) => setEditCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-especialidade-mentor">Especialidade</Label>
                  <Input id="edit-especialidade-mentor" value={editEspecialidade} onChange={(e) => setEditEspecialidade(e.target.value)} placeholder="Ex: Gestão, Finanças, Marketing, Liderança" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ============ GERENTES TAB ============
function GerentesTab({ gerentes, empresas, loading, onCreate, onUpdateAcesso, isCreating, onEdit }: {
  gerentes: any[];
  empresas: any[];
  loading: boolean;
  onCreate: (data: any) => void;
  onUpdateAcesso: (data: any) => void;
  isCreating: boolean;
  onEdit: (data: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editGerente, setEditGerente] = useState<any>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpfGerente, setCpfGerente] = useState("");
  const [managedProgramId, setManagedProgramId] = useState("");
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editManagedProgramId, setEditManagedProgramId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedProgramId) {
      toast.error("Selecione a empresa que o gerente irá gerenciar");
      return;
    }
    const cpfDigits = cpfGerente.replace(/\D/g, '');
    if (cpfDigits.length > 0 && cpfDigits.length !== 11) {
      toast.error("CPF deve conter 11 dígitos");
      return;
    }
    onCreate({ 
      name: nome, 
      email, 
      cpf: cpfDigits || undefined,
      managedProgramId: parseInt(managedProgramId)
    });
    setNome("");
    setEmail("");
    setCpfGerente("");
    setManagedProgramId("");
    setOpen(false);
  };

  const handleEditOpen = (gerente: any) => {
    setEditGerente(gerente);
    setEditNome(gerente.name || "");
    setEditEmail(gerente.email || "");
    setEditManagedProgramId(gerente.managedProgramId?.toString() || "");
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGerente) return;
    onEdit({ 
      consultorId: editGerente.id, 
      name: editNome, 
      email: editEmail,
      managedProgramId: editManagedProgramId ? parseInt(editManagedProgramId) : undefined,
    });
    setEditOpen(false);
    setEditGerente(null);
  };

  const handleToggleAcesso = (gerenteId: number, currentLoginId: string | null) => {
    if (currentLoginId) {
      onUpdateAcesso({ consultorId: gerenteId, loginId: null, canLogin: false });
    } else {
      const newLoginId = `G${gerenteId.toString().padStart(4, '0')}`;
      onUpdateAcesso({ consultorId: gerenteId, loginId: newLoginId, canLogin: true });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerentes de Empresa</CardTitle>
          <CardDescription>Gerencie os gerentes responsáveis por cada empresa</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Gerente</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Gerente</DialogTitle>
                <DialogDescription>Preencha os dados do gerente de empresa</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome-gerente">Nome Completo</Label>
                  <Input id="nome-gerente" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do gerente" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-gerente">Email</Label>
                  <Input id="email-gerente" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf-gerente">CPF</Label>
                  <Input id="cpf-gerente" value={cpfGerente} onChange={(e) => setCpfGerente(formatCpf(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                  <p className="text-xs text-muted-foreground">CPF é usado para login do gerente (Email + CPF)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa-gerente">Empresa que Gerencia *</Label>
                  <Select value={managedProgramId} onValueChange={setManagedProgramId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContentNoPortal>
                      {empresas.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                      ))}
                    </SelectContentNoPortal>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Acesso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...gerentes].sort((a, b) => (b.canLogin ? 1 : 0) - (a.canLogin ? 1 : 0)).map((gerente) => (
                  <TableRow key={gerente.id}>
                    <TableCell>{gerente.id}</TableCell>
                    <TableCell className="font-medium">{gerente.name}</TableCell>
                    <TableCell>{gerente.email || "-"}</TableCell>
                    <TableCell>{empresas.find(e => e.id === gerente.managedProgramId)?.name || "-"}</TableCell>
                    <TableCell>
                      {gerente.canLogin ? (
                        <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Ativo</Badge>
                      ) : (
                        <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditOpen(gerente)}>
                          <Pencil className="h-3 w-3 mr-1" /> Editar
                        </Button>
                        <Button 
                          variant={gerente.canLogin ? "destructive" : "default"} 
                          size="sm"
                          onClick={() => handleToggleAcesso(gerente.id, gerente.loginId)}
                        >
                          {gerente.canLogin ? "Desativar" : "Ativar Acesso"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {gerentes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum gerente cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Dialog de Edição */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent>
                <form onSubmit={handleEditSubmit}>
                  <DialogHeader>
                    <DialogTitle>Editar Gerente</DialogTitle>
                    <DialogDescription>Atualize os dados do gerente</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Empresa que Gerencia</Label>
                      <Select value={editManagedProgramId} onValueChange={setEditManagedProgramId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                        <SelectContentNoPortal>
                          {empresas.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                          ))}
                        </SelectContentNoPortal>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Salvar Alterações</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}
