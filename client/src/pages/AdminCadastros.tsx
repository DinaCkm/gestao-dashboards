import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Building2, Users, UserCheck, KeyRound, Pencil, CheckCircle, AlertCircle, Power } from "lucide-react";
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
  user: "Aluno",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-600",
  manager: "bg-blue-600",
  user: "bg-green-600",
};

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
              <KeyRound className="h-4 w-4" />
              Gestão de Acesso
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

          {/* Gestão de Acesso Tab */}
          <TabsContent value="acesso">
            <GestaoAcessoTab
              accessUsers={accessUsers || []}
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
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// ============ GESTÃO DE ACESSO TAB ============
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
  const [role, setRole] = useState("");
  const [programId, setProgramId] = useState("");

  // Edit form
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editProgramId, setEditProgramId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      toast.error("CPF deve conter 11 dígitos");
      return;
    }
    if (!role) {
      toast.error("Selecione o perfil do usuário");
      return;
    }
    if ((role === "manager" || role === "user") && !programId) {
      toast.error("Selecione a empresa vinculada");
      return;
    }
    onCreate({ 
      name: nome, 
      email, 
      cpf: cpfDigits,
      role: role as "user" | "admin" | "manager",
      programId: programId ? parseInt(programId) : null,
    });
    setNome("");
    setEmail("");
    setCpf("");
    setRole("");
    setProgramId("");
    setOpen(false);
  };

  const handleEditOpen = (user: any) => {
    setEditUser(user);
    setEditNome(user.name || "");
    setEditEmail(user.email || "");
    setEditCpf(displayCpf(user.cpf));
    setEditRole(user.role);
    setEditProgramId(user.programId ? user.programId.toString() : "");
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    const cpfDigits = editCpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      toast.error("CPF deve conter 11 dígitos");
      return;
    }
    onUpdate({
      userId: editUser.id,
      name: editNome,
      email: editEmail,
      cpf: cpfDigits,
      role: editRole as "user" | "admin" | "manager",
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
            <KeyRound className="h-5 w-5" />
            Gestão de Acesso
          </CardTitle>
          <CardDescription>
            Cadastre e gerencie usuários que acessam a plataforma por Email + CPF.
            O sistema detecta automaticamente o perfil (Admin, Gestor ou Aluno) ao fazer login.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) setOpen(false); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent className="z-50" onPointerDownOutside={(e) => e.preventDefault()}>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os dados do usuário. Ele fará login com Email + CPF.
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
                  <Label htmlFor="access-cpf">CPF *</Label>
                  <Input 
                    id="access-cpf" 
                    value={cpf} 
                    onChange={(e) => setCpf(formatCpf(e.target.value))} 
                    placeholder="000.000.000-00" 
                    required 
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access-role">Perfil de Acesso *</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="manager">Gestor de Empresa</SelectItem>
                      <SelectItem value="user">Aluno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(role === "manager" || role === "user") && (
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
                )}
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
                <DialogTitle>Editar Usuário</DialogTitle>
                <DialogDescription>Altere os dados do usuário</DialogDescription>
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
                  <Label>CPF *</Label>
                  <Input 
                    value={editCpf} 
                    onChange={(e) => setEditCpf(formatCpf(e.target.value))} 
                    required 
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Perfil de Acesso *</Label>
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="manager">Gestor de Empresa</SelectItem>
                      <SelectItem value="user">Aluno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(editRole === "manager" || editRole === "user") && (
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
                )}
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
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold">{accessUsers.filter(u => u.role === 'admin').length}</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-muted-foreground">Gestores</p>
                <p className="text-2xl font-bold">{accessUsers.filter(u => u.role === 'manager').length}</p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-muted-foreground">Alunos</p>
                <p className="text-2xl font-bold">{accessUsers.filter(u => u.role === 'user').length}</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{displayCpf(user.cpf)}</TableCell>
                    <TableCell>
                      <Badge className={ROLE_COLORS[user.role] || "bg-gray-600"}>
                        {ROLE_LABELS[user.role] || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.programId 
                        ? empresas.find(e => e.id === user.programId)?.name || "-"
                        : "-"
                      }
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum usuário cadastrado. Clique em "Novo Usuário" para começar.
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
function EmpresasTab({ empresas, loading, onCreate, isCreating }: {
  empresas: any[];
  loading: boolean;
  onCreate: (data: any) => void;
  isCreating: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ name: nome, code: codigo, description: descricao });
    setNome("");
    setCodigo("");
    setDescricao("");
    setOpen(false);
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Status</TableHead>
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
                </TableRow>
              ))}
              {empresas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhuma empresa cadastrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ============ MENTORES TAB ============
function MentoresTab({ mentores, empresas, loading, onCreate, onUpdateAcesso, isCreating }: {
  mentores: any[];
  empresas: any[];
  loading: boolean;
  onCreate: (data: any) => void;
  onUpdateAcesso: (data: any) => void;
  isCreating: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loginId, setLoginId] = useState("");
  const [programId, setProgramId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ 
      name: nome, 
      email, 
      loginId: loginId || undefined,
      programId: programId ? parseInt(programId) : undefined 
    });
    setNome("");
    setEmail("");
    setLoginId("");
    setProgramId("");
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Mentores</CardTitle>
          <CardDescription>Gerencie os mentores/consultores do programa</CardDescription>
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
                  <Label htmlFor="email-mentor">Email</Label>
                  <Input id="email-mentor" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginId-mentor">ID de Login (opcional)</Label>
                  <Input id="loginId-mentor" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="Ex: M0001" />
                  <p className="text-xs text-muted-foreground">Se não informado, será gerado automaticamente ao ativar o acesso</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="programa-mentor">Empresa/Programa (opcional)</Label>
                  <Select value={programId} onValueChange={setProgramId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>ID Login</TableHead>
                <TableHead>Acesso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mentores.map((mentor) => (
                <TableRow key={mentor.id}>
                  <TableCell>{mentor.id}</TableCell>
                  <TableCell className="font-medium">{mentor.name}</TableCell>
                  <TableCell>{mentor.email || "-"}</TableCell>
                  <TableCell>{mentor.loginId || "-"}</TableCell>
                  <TableCell>
                    {mentor.canLogin ? (
                      <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Ativo</Badge>
                    ) : (
                      <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant={mentor.canLogin ? "destructive" : "default"} 
                      size="sm"
                      onClick={() => handleToggleAcesso(mentor.id, mentor.loginId, mentor.email)}
                    >
                      {mentor.canLogin ? "Desativar" : "Ativar Acesso"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {mentores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum mentor cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ============ GERENTES TAB ============
function GerentesTab({ gerentes, empresas, loading, onCreate, onUpdateAcesso, isCreating }: {
  gerentes: any[];
  empresas: any[];
  loading: boolean;
  onCreate: (data: any) => void;
  onUpdateAcesso: (data: any) => void;
  isCreating: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loginId, setLoginId] = useState("");
  const [managedProgramId, setManagedProgramId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedProgramId) {
      alert("Selecione a empresa que o gerente irá gerenciar");
      return;
    }
    onCreate({ 
      name: nome, 
      email, 
      loginId: loginId || undefined,
      managedProgramId: parseInt(managedProgramId)
    });
    setNome("");
    setEmail("");
    setLoginId("");
    setManagedProgramId("");
    setOpen(false);
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
                  <Label htmlFor="loginId-gerente">ID de Login (opcional)</Label>
                  <Input id="loginId-gerente" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="Ex: G0001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa-gerente">Empresa que Gerencia *</Label>
                  <Select value={managedProgramId} onValueChange={setManagedProgramId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>ID Login</TableHead>
                <TableHead>Acesso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gerentes.map((gerente) => (
                <TableRow key={gerente.id}>
                  <TableCell>{gerente.id}</TableCell>
                  <TableCell className="font-medium">{gerente.name}</TableCell>
                  <TableCell>{gerente.email || "-"}</TableCell>
                  <TableCell>{empresas.find(e => e.id === gerente.managedProgramId)?.name || "-"}</TableCell>
                  <TableCell>{gerente.loginId || "-"}</TableCell>
                  <TableCell>
                    {gerente.canLogin ? (
                      <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Ativo</Badge>
                    ) : (
                      <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant={gerente.canLogin ? "destructive" : "default"} 
                      size="sm"
                      onClick={() => handleToggleAcesso(gerente.id, gerente.loginId)}
                    >
                      {gerente.canLogin ? "Desativar" : "Ativar Acesso"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {gerentes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum gerente cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
