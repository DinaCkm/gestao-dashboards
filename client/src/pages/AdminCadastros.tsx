import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
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
import { Loader2, Plus, Building2, Users, UserCheck, KeyRound, Pencil, CheckCircle, AlertCircle, Power, GraduationCap, Search, X, Crown, ArrowLeftRight, UserPlus, Trash2 } from "lucide-react";
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
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("acesso");

  // ALL hooks must be called before any early return (React rules of hooks)
  // Queries
  const { data: empresas, refetch: refetchEmpresas, isLoading: loadingEmpresas } = trpc.admin.listEmpresas.useQuery(undefined, { enabled: !loading && !!user && user.role === 'admin' });
  const { data: mentores, refetch: refetchMentores, isLoading: loadingMentores } = trpc.admin.listMentores.useQuery(undefined, { enabled: !loading && !!user && user.role === 'admin' });
  const { data: gerentes, refetch: refetchGerentes, isLoading: loadingGerentes } = trpc.admin.listGerentes.useQuery(undefined, { enabled: !loading && !!user && user.role === 'admin' });
  const { data: accessUsers, refetch: refetchAccessUsers, isLoading: loadingAccessUsers } = trpc.admin.listAccessUsers.useQuery(undefined, { enabled: !loading && !!user && user.role === 'admin' });
  const { data: allAlunos, refetch: refetchAllAlunos, isLoading: loadingAllAlunos } = trpc.admin.listAlunos.useQuery(undefined, { enabled: !loading && !!user && user.role === 'admin' });

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

  // Queries para Cadastro Direto
  const { data: mentoresList } = trpc.mentor.list.useQuery(undefined, { enabled: !loading && !!user && user.role === 'admin' });
  const { data: turmasList } = trpc.turmas.list.useQuery(undefined, { enabled: !loading && !!user && user.role === 'admin' });

  // Queries para Gerentes de Empresa (Visão Dupla)
  const { data: gerentesEmpresa, refetch: refetchGerentesEmpresa, isLoading: loadingGerentesEmpresa } = trpc.admin.listGerentesEmpresa.useQuery(undefined, { enabled: !loading && !!user && user.role === 'admin' });

  const promoteToGerente = trpc.admin.promoteToGerente.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Aluno promovido a gerente!");
        refetchGerentesEmpresa();
        refetchAccessUsers();
      } else {
        toast.error(data.message || "Erro ao promover aluno");
      }
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const createGerentePuro = trpc.admin.createGerentePuro.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Gerente puro criado!");
        refetchGerentesEmpresa();
        refetchAccessUsers();
      } else {
        toast.error(data.message || "Erro ao criar gerente");
      }
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const removeGerente = trpc.admin.removeGerente.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Papel de gerente removido!");
        refetchGerentesEmpresa();
        refetchAccessUsers();
      } else {
        toast.error(data.message || "Erro ao remover gerente");
      }
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const createAluno = trpc.admin.createAluno.useMutation({
    onSuccess: () => {
      toast.success("Aluno cadastrado! Ele receberá acesso ao Onboarding para iniciar sua participação no programa.");
      refetchAllAlunos();
      refetchAccessUsers();
    },
    onError: (err) => toast.error(`Erro ao cadastrar aluno: ${err.message}`),
  });

  const createAlunoDireto = trpc.admin.createAlunoDireto.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Aluno cadastrado com sucesso! Mentor vinculado e bypass de onboarding ativado.");
        refetchAccessUsers();
        refetchAllAlunos();
      } else {
        toast.error(data.message || "Erro ao cadastrar aluno");
      }
    },
    onError: (err) => toast.error(`Erro ao cadastrar aluno: ${err.message}`),
  });

  const updateAluno = trpc.admin.updateAluno.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Aluno atualizado com sucesso!");
        refetchAllAlunos();
      } else {
        toast.error(data.message || "Erro ao atualizar aluno");
      }
    },
    onError: (err) => toast.error(`Erro ao atualizar aluno: ${err.message}`),
  });

  // Proteger página: apenas admin pode acessar — redirecionar para página correta do role
  useEffect(() => {
    if (loading || !user) return;
    if (user.role === 'admin') return; // admin pode acessar
    
    if (user.role === 'manager') {
      const userAny = user as any;
      if (userAny.consultorId) {
        setLocation('/dashboard/mentor');
      } else {
        setLocation('/dashboard/gestor');
      }
    } else if (user.role === 'user') {
      setLocation('/meu-dashboard');
    } else {
      setLocation('/');
    }
  }, [user, loading, setLocation]);

  // Enquanto carrega ou se não é admin, mostra loading (redirecionamento acontece no useEffect)
  if (loading || !user || user.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Redirecionando...</div>
        </div>
      </DashboardLayout>
    );
  }

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
          <TabsList className="grid w-full grid-cols-5">
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
            <TabsTrigger value="gerentes-empresa" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Visão Dupla
            </TabsTrigger>
          </TabsList>

          {/* Alunos Tab */}
          <TabsContent value="acesso">
            <AlunosTab
              alunos={allAlunos || []}
              empresas={empresas || []}
              mentoresList={mentoresList || []}
              turmasList={turmasList || []}
              loading={loadingAllAlunos}
              onUpdate={updateAluno.mutate}
              onCreateAluno={createAluno.mutate}
              isCreatingAluno={createAluno.isPending}
              onCreateDireto={createAlunoDireto.mutate}
              isCreatingDireto={createAlunoDireto.isPending}
              isUpdating={updateAluno.isPending}
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

          {/* Gerentes de Empresa - Visão Dupla Tab */}
          <TabsContent value="gerentes-empresa">
            <GerentesEmpresaTab
              gerentesEmpresa={gerentesEmpresa || []}
              empresas={empresas || []}
              loading={loadingGerentesEmpresa}
              onPromote={promoteToGerente.mutate}
              onCreatePuro={createGerentePuro.mutate}
              onRemove={removeGerente.mutate}
              isPromoting={promoteToGerente.isPending}
              isCreatingPuro={createGerentePuro.isPending}
              isRemoving={removeGerente.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// ============ ALUNOS TAB ============
function AlunosTab({ alunos, empresas, mentoresList, turmasList, loading, onUpdate, onCreateAluno, isCreatingAluno, onCreateDireto, isCreatingDireto, isUpdating }: {
  alunos: any[];
  empresas: any[];
  mentoresList: any[];
  turmasList: any[];
  loading: boolean;
  onUpdate: (data: any) => void;
  onCreateAluno: (data: any) => void;
  isCreatingAluno: boolean;
  onCreateDireto: (data: any) => void;
  isCreatingDireto: boolean;
  isUpdating: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [editAluno, setEditAluno] = useState<any>(null);

  // Search/filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEmpresa, setFilterEmpresa] = useState("all");
  const [filterMentor, setFilterMentor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");

  // Extrair lista única de mentores dos alunos
  const mentoresUnicos = useMemo(() => {
    const mentorSet = new Map<string, string>();
    alunos.forEach((a: any) => {
      if (a.mentorName) {
        mentorSet.set(a.mentorName, a.mentorName);
      }
    });
    return Array.from(mentorSet.values()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [alunos]);

  // Filtered and sorted alunos
  const filteredAlunos = useMemo(() => {
    return alunos
      .filter((a: any) => {
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch = !term ||
          (a.name || "").toLowerCase().includes(term) ||
          (a.email || "").toLowerCase().includes(term) ||
          (a.externalId || "").toLowerCase().includes(term) ||
          (a.programName || "").toLowerCase().includes(term) ||
          (a.mentorName || "").toLowerCase().includes(term) ||
          (a.turmaName || "").toLowerCase().includes(term);
        const matchesEmpresa = filterEmpresa === "all" ||
          (a.programId && a.programId.toString() === filterEmpresa);
        const matchesMentor = filterMentor === "all" ||
          (filterMentor === "sem_mentor" ? !a.mentorName : a.mentorName === filterMentor);
        const matchesStatus = filterStatus === "all" ||
          (filterStatus === "active" ? a.isActive === 1 : a.isActive !== 1);
        return matchesSearch && matchesEmpresa && matchesMentor && matchesStatus;
      })
      .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || "", 'pt-BR'));
  }, [alunos, searchTerm, filterEmpresa, filterMentor, filterStatus]);

  // Create form (Convite Onboarding - sem mentor)
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboardNome, setOnboardNome] = useState("");
  const [onboardEmail, setOnboardEmail] = useState("");
  const [onboardId, setOnboardId] = useState("");
  const [onboardProgramId, setOnboardProgramId] = useState("");

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const idDigits = onboardId.replace(/\D/g, '');
    if (idDigits.length === 0) {
      toast.error("ID do aluno deve ser informado");
      return;
    }
    if (!onboardProgramId) {
      toast.error("Selecione a empresa vinculada");
      return;
    }
    onCreateAluno({
      name: onboardNome,
      email: onboardEmail,
      externalId: idDigits,
      programId: parseInt(onboardProgramId),
    });
    setOnboardNome("");
    setOnboardEmail("");
    setOnboardId("");
    setOnboardProgramId("");
    setOnboardOpen(false);
  };

  // Create form (Cadastro Direto - com mentor vinculado)
  const [diretoOpen, setDiretoOpen] = useState(false);
  const [diretoNome, setDiretoNome] = useState("");
  const [diretoEmail, setDiretoEmail] = useState("");
  const [diretoCpf, setDiretoCpf] = useState("");
  const [diretoProgramId, setDiretoProgramId] = useState("");
  const [diretoConsultorId, setDiretoConsultorId] = useState("");
  const [diretoTurmaId, setDiretoTurmaId] = useState("");

  const handleDiretoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const credentialDigits = diretoCpf.replace(/\D/g, '');
    if (credentialDigits.length === 0) {
      toast.error("ID do aluno deve ser informado");
      return;
    }
    if (!diretoProgramId) {
      toast.error("Selecione a empresa vinculada");
      return;
    }
    if (!diretoConsultorId) {
      toast.error("Selecione o mentor para vincular ao aluno");
      return;
    }
    onCreateDireto({
      name: diretoNome,
      email: diretoEmail,
      cpf: credentialDigits,
      programId: parseInt(diretoProgramId),
      consultorId: parseInt(diretoConsultorId),
      turmaId: diretoTurmaId ? parseInt(diretoTurmaId) : null,
    });
    setDiretoNome("");
    setDiretoEmail("");
    setDiretoCpf("");
    setDiretoProgramId("");
    setDiretoConsultorId("");
    setDiretoTurmaId("");
    setDiretoOpen(false);
  };

  // Edit form
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editExternalId, setEditExternalId] = useState("");
  const [editProgramId, setEditProgramId] = useState("");
  const [editConsultorId, setEditConsultorId] = useState("");
  const [editTurmaId, setEditTurmaId] = useState("");

  const handleEditOpen = (aluno: any) => {
    setEditAluno(aluno);
    setEditNome(aluno.name || "");
    setEditEmail(aluno.email || "");
    setEditCpf(aluno.cpf ? formatCpf(aluno.cpf) : "");
    setEditExternalId(aluno.externalId || "");
    setEditProgramId(aluno.programId ? aluno.programId.toString() : "");
    setEditConsultorId(aluno.consultorId ? aluno.consultorId.toString() : "");
    setEditTurmaId(aluno.turmaId ? aluno.turmaId.toString() : "");
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAluno) return;
    const cpfDigits = editCpf.replace(/\D/g, '');
    // CPF validation: must be 11 digits if provided
    if (cpfDigits && cpfDigits.length !== 11) {
      toast.error("CPF deve conter exatamente 11 dígitos");
      return;
    }
    onUpdate({
      alunoId: editAluno.id,
      name: editNome,
      email: editEmail,
      cpf: cpfDigits || null,
      programId: editProgramId ? parseInt(editProgramId) : null,
      consultorId: editConsultorId ? parseInt(editConsultorId) : null,
      turmaId: editTurmaId ? parseInt(editTurmaId) : null,
    });
    setEditOpen(false);
    setEditAluno(null);
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
            Visualização e gerenciamento de todos os alunos cadastrados no sistema.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {/* Convite Onboarding Dialog */}
          <Dialog open={onboardOpen} onOpenChange={setOnboardOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50"><UserPlus className="h-4 w-4 mr-2" /> Convite Onboarding</Button>
            </DialogTrigger>
            <DialogContent className="z-50 max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
              <form onSubmit={handleOnboardSubmit}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                    Cadastrar Aluno para Onboarding
                  </DialogTitle>
                  <DialogDescription>
                    Cadastre o aluno com os dados básicos. Ele receberá acesso ao Onboarding onde poderá iniciar sua participação no programa e escolher o mentor.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700"><strong>Fluxo:</strong> O aluno fará login com Email + ID, acessará a área de Onboarding e iniciará sua participação no programa. O mentor <strong>não</strong> é vinculado neste momento — será definido posteriormente.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input value={onboardNome} onChange={(e) => setOnboardNome(e.target.value)} placeholder="Nome completo" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={onboardEmail} onChange={(e) => setOnboardEmail(e.target.value)} placeholder="email@exemplo.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label>ID do Aluno *</Label>
                    <Input value={onboardId} onChange={(e) => setOnboardId(e.target.value.replace(/\D/g, ''))} placeholder="Ex: 667306" required maxLength={10} />
                  </div>
                  <div className="space-y-2">
                    <Label>Empresa Vinculada *</Label>
                    <select value={onboardProgramId} onChange={(e) => setOnboardProgramId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
                      <option value="">Selecione a empresa</option>
                      {empresas.map((emp) => (<option key={emp.id} value={emp.id.toString()}>{emp.name}</option>))}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOnboardOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isCreatingAluno} className="bg-blue-600 hover:bg-blue-700">
                    {isCreatingAluno ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cadastrando...</> : "Cadastrar e Enviar Convite"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Cadastro Direto Dialog */}
          <Dialog open={diretoOpen} onOpenChange={setDiretoOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700"><UserCheck className="h-4 w-4 mr-2" /> Cadastro Direto</Button>
            </DialogTrigger>
            <DialogContent className="z-50 max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
              <form onSubmit={handleDiretoSubmit}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                    Cadastro Direto de Aluno
                  </DialogTitle>
                  <DialogDescription>
                    Cadastre o aluno e vincule o mentor diretamente.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input value={diretoNome} onChange={(e) => setDiretoNome(e.target.value)} placeholder="Nome completo" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={diretoEmail} onChange={(e) => setDiretoEmail(e.target.value)} placeholder="email@exemplo.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label>ID do Aluno *</Label>
                    <Input value={diretoCpf} onChange={(e) => setDiretoCpf(e.target.value.replace(/\D/g, ''))} placeholder="Ex: 667306" required maxLength={10} />
                  </div>
                  <div className="space-y-2">
                    <Label>Empresa Vinculada *</Label>
                    <select value={diretoProgramId} onChange={(e) => setDiretoProgramId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
                      <option value="">Selecione a empresa</option>
                      {empresas.map((emp) => (<option key={emp.id} value={emp.id.toString()}>{emp.name}</option>))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Turma (Opcional)</Label>
                    <select value={diretoTurmaId} onChange={(e) => setDiretoTurmaId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      <option value="">Nenhuma turma</option>
                      {turmasList.map((t: any) => (<option key={t.id} value={t.id.toString()}>{t.name}</option>))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-emerald-700 font-semibold">Vincular Mentor(a) *</Label>
                    <select value={diretoConsultorId} onChange={(e) => setDiretoConsultorId(e.target.value)} className="flex h-9 w-full rounded-md border-2 border-emerald-300 bg-emerald-50 px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500" required>
                      <option value="">Selecione o mentor(a)</option>
                      {mentoresList.map((m: any) => (<option key={m.id} value={m.id.toString()}>{m.name}</option>))}
                    </select>
                    <p className="text-xs text-muted-foreground">O aluno será vinculado a este mentor e pulará o fluxo de onboarding.</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDiretoOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isCreatingDireto} className="bg-emerald-600 hover:bg-emerald-700">
                    {isCreatingDireto ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cadastrando...</> : "Cadastrar com Mentor"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="z-50 max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onPointerDownOutside={(e) => e.preventDefault()}>
            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 min-h-0">
              <DialogHeader>
                <DialogTitle>Editar Aluno</DialogTitle>
                <DialogDescription>Altere os dados do aluno</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input 
                    value={editCpf} 
                    onChange={(e) => setEditCpf(formatCpf(e.target.value))} 
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                  <p className="text-xs text-muted-foreground">Formato: 000.000.000-00 (11 dígitos). Deixe vazio se não houver CPF.</p>
                </div>
                <div className="space-y-2">
                  <Label>ID Externo</Label>
                  <Input value={editExternalId} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">ID importado da planilha (somente leitura).</p>
                </div>
                <div className="space-y-2">
                  <Label>Empresa Vinculada</Label>
                  <select value={editProgramId} onChange={(e) => setEditProgramId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">Sem empresa</option>
                    {empresas.map((emp) => (<option key={emp.id} value={emp.id.toString()}>{emp.name}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Mentor(a) Vinculado(a)</Label>
                  <select value={editConsultorId} onChange={(e) => setEditConsultorId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">Sem mentor atribuído</option>
                    {mentoresList.map((m: any) => (<option key={m.id} value={m.id.toString()}>{m.name}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Turma</Label>
                  <select value={editTurmaId} onChange={(e) => setEditTurmaId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">Sem turma</option>
                    {turmasList.map((t: any) => (<option key={t.id} value={t.id.toString()}>{t.name}</option>))}
                  </select>
                </div>
              </div>
              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Salvar Alterações"}
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
            {/* Search and filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, e-mail, CPF, empresa, mentor ou turma..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <select value={filterEmpresa} onChange={(e) => setFilterEmpresa(e.target.value)} className="flex h-9 min-w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="all">Todas as Empresas</option>
                {empresas.map((emp) => (<option key={emp.id} value={emp.id.toString()}>{emp.name}</option>))}
              </select>
              <select value={filterMentor} onChange={(e) => setFilterMentor(e.target.value)} className="flex h-9 min-w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="all">Todos os Mentores</option>
                <option value="sem_mentor">Sem mentor atribuído</option>
                {mentoresUnicos.map((nome) => (<option key={nome} value={nome}>{nome}</option>))}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex h-9 min-w-[120px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
                <option value="all">Todos</option>
              </select>
            </div>

            {/* Filtered count indicator */}
            <div className="text-sm text-muted-foreground mb-3">
              Mostrando {filteredAlunos.length} de {alunos.length} alunos (ordem alfabética)
              {filterMentor !== "all" && filterMentor !== "sem_mentor" && (
                <span className="ml-1">| Mentor(a): <strong>{filterMentor}</strong></span>
              )}
              {filterMentor === "sem_mentor" && (
                <span className="ml-1">| <strong>Sem mentor atribuído</strong></span>
              )}
            </div>

            {/* Summary cards - por empresa */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
                <p className="text-2xl font-bold">{alunos.filter(a => a.isActive === 1).length}</p>
              </div>
              {empresas.map((emp: any) => {
                const count = alunos.filter(a => a.programId === emp.id && a.isActive === 1).length;
                if (count === 0) return null;
                return (
                  <div key={emp.id} className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-muted-foreground">{emp.name}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                );
              })}
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>ID Externo</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Mentor(a)</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlunos.map((aluno: any) => (
                    <TableRow key={aluno.id} className={aluno.isActive !== 1 ? "opacity-50" : ""}>
                      <TableCell className="font-medium whitespace-nowrap">{aluno.name}</TableCell>
                      <TableCell className="text-sm">{aluno.email || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">{aluno.cpf ? displayCpf(aluno.cpf) : <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell className="font-mono text-sm">{aluno.externalId || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{aluno.programName || <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{aluno.mentorName || <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{aluno.turmaName || <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell>
                        {aluno.isActive === 1 ? (
                          <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Ativo</Badge>
                        ) : (
                          <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleEditOpen(aluno)}>
                          <Pencil className="h-3 w-3 mr-1" /> Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAlunos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        {alunos.length === 0 ? "Nenhum aluno cadastrado." : "Nenhum aluno encontrado com os filtros aplicados."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
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


// ============ GERENTES DE EMPRESA - VISÃO DUPLA ============
function GerentesEmpresaTab({ gerentesEmpresa, empresas, loading, onPromote, onCreatePuro, onRemove, isPromoting, isCreatingPuro, isRemoving }: {
  gerentesEmpresa: any[];
  empresas: any[];
  loading: boolean;
  onPromote: (data: { alunoId: number; programId: number }) => void;
  onCreatePuro: (data: { name: string; email: string; cpf?: string; programId: number }) => void;
  onRemove: (data: { userId: number }) => void;
  isPromoting: boolean;
  isCreatingPuro: boolean;
  isRemoving: boolean;
}) {
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [puroOpen, setPuroOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [searchAluno, setSearchAluno] = useState("");
  const [selectedAlunoId, setSelectedAlunoId] = useState("");

  // Gerente Puro form
  const [puroNome, setPuroNome] = useState("");
  const [puroEmail, setPuroEmail] = useState("");
  const [puroCpf, setPuroCpf] = useState("");
  const [puroProgramId, setPuroProgramId] = useState("");

  // Query alunos da empresa selecionada (para promoção)
  const { data: alunosProgram } = trpc.admin.alunosByProgram.useQuery(
    { programId: parseInt(selectedProgramId) },
    { enabled: !!selectedProgramId && promoteOpen }
  );

  const filteredAlunos = (alunosProgram || []).filter((a: any) =>
    !searchAluno || a.name.toLowerCase().includes(searchAluno.toLowerCase()) || a.email?.toLowerCase().includes(searchAluno.toLowerCase())
  );

  const handlePromote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlunoId || !selectedProgramId) {
      toast.error("Selecione a empresa e o aluno");
      return;
    }
    onPromote({ alunoId: parseInt(selectedAlunoId), programId: parseInt(selectedProgramId) });
    setSelectedAlunoId("");
    setSearchAluno("");
    setSelectedProgramId("");
    setPromoteOpen(false);
  };

  const handleCreatePuro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!puroProgramId) {
      toast.error("Selecione a empresa");
      return;
    }
    const cpfDigits = puroCpf.replace(/\D/g, '');
    if (cpfDigits.length > 0 && cpfDigits.length !== 11) {
      toast.error("CPF deve conter 11 dígitos");
      return;
    }
    onCreatePuro({
      name: puroNome,
      email: puroEmail,
      cpf: cpfDigits || undefined,
      programId: parseInt(puroProgramId),
    });
    setPuroNome("");
    setPuroEmail("");
    setPuroCpf("");
    setPuroProgramId("");
    setPuroOpen(false);
  };

  const handleRemove = (userId: number, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover o papel de gerente de "${name}"? O usuário voltará a ser apenas aluno.`)) {
      onRemove({ userId });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Gerentes de Empresa (Visão Dupla)
            </CardTitle>
            <CardDescription className="mt-1">
              Gerencie quem tem visão gerencial da empresa. Gerentes com perfil de aluno podem alternar entre as duas visões.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Promover Aluno
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <form onSubmit={handlePromote}>
                  <DialogHeader>
                    <DialogTitle>Promover Aluno a Gerente</DialogTitle>
                    <DialogDescription>
                      O aluno manterá seu perfil de aluno e ganhará acesso à visão gerencial da empresa.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Empresa *</Label>
                      <Select value={selectedProgramId} onValueChange={(v) => { setSelectedProgramId(v); setSelectedAlunoId(""); setSearchAluno(""); }}>
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
                    {selectedProgramId && (
                      <div className="space-y-2">
                        <Label>Buscar Aluno *</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="Digite o nome ou email do aluno..."
                            value={searchAluno}
                            onChange={(e) => setSearchAluno(e.target.value)}
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto border rounded-md">
                          {filteredAlunos.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-3 text-center">
                              {alunosProgram ? "Nenhum aluno encontrado" : "Carregando..."}
                            </p>
                          ) : (
                            filteredAlunos.map((aluno: any) => (
                              <button
                                key={aluno.id}
                                type="button"
                                onClick={() => setSelectedAlunoId(aluno.id.toString())}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between ${
                                  selectedAlunoId === aluno.id.toString() ? "bg-primary/10 text-primary font-medium" : ""
                                }`}
                              >
                                <div>
                                  <p className="font-medium">{aluno.name}</p>
                                  <p className="text-xs text-muted-foreground">{aluno.email || "Sem email"}</p>
                                </div>
                                {selectedAlunoId === aluno.id.toString() && (
                                  <CheckCircle className="h-4 w-4 text-primary" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isPromoting || !selectedAlunoId}>
                      {isPromoting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Promovendo...</> : "Promover a Gerente"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={puroOpen} onOpenChange={setPuroOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Gerente Puro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreatePuro}>
                  <DialogHeader>
                    <DialogTitle>Cadastrar Gerente Puro</DialogTitle>
                    <DialogDescription>
                      Este gerente NÃO será aluno do programa. Terá apenas a visão gerencial da empresa.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nome Completo *</Label>
                      <Input value={puroNome} onChange={(e) => setPuroNome(e.target.value)} placeholder="Nome do gerente" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" value={puroEmail} onChange={(e) => setPuroEmail(e.target.value)} placeholder="email@exemplo.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF</Label>
                      <Input value={puroCpf} onChange={(e) => setPuroCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                      <p className="text-xs text-muted-foreground">CPF é usado para login (Email + CPF)</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Empresa que Gerencia *</Label>
                      <Select value={puroProgramId} onValueChange={setPuroProgramId}>
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
                    <Button type="submit" disabled={isCreatingPuro}>
                      {isCreatingPuro ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</> : "Criar Gerente Puro"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            {/* Info Banner */}
            <Alert className="mb-4 border-amber-200 bg-amber-50">
              <Crown className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Promover Aluno:</strong> O aluno ganha visão gerencial e pode alternar entre Aluno e Gerente.{" "}
                <strong>Gerente Puro:</strong> Pessoa que NÃO é aluno, só tem visão gerencial.
              </AlertDescription>
            </Alert>

            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gerentesEmpresa.map((g: any) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{g.name}</p>
                        {g.alunoId && <p className="text-xs text-muted-foreground">Aluno #{g.alunoId}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{g.email || "-"}</TableCell>
                    <TableCell className="text-sm font-mono">
                      {g.cpf ? g.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : "-"}
                    </TableCell>
                    <TableCell>{g.programName || "-"}</TableCell>
                    <TableCell className="text-sm">{g.turmaName || "-"}</TableCell>
                    <TableCell className="text-sm">
                      {g.mentorName ? (
                        <div>
                          <p>{g.mentorName}</p>
                          {g.mentorId && <p className="text-xs text-muted-foreground">ID: {g.mentorId}</p>}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {g.isAlsoStudent ? (
                        <Badge className="bg-blue-600">
                          <ArrowLeftRight className="h-3 w-3 mr-1" />
                          Aluno + Gerente
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Building2 className="h-3 w-3 mr-1" />
                          Gerente Puro
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemove(g.id, g.name)}
                        disabled={isRemoving}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {gerentesEmpresa.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhum gerente de empresa com visão dupla cadastrado. Use "Promover Aluno" ou "Gerente Puro" para adicionar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
