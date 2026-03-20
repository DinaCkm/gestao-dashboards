import React, { useState, useEffect, useMemo } from "react";
import { formatDateSafe } from "@/lib/dateUtils";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useSearch } from "wouter";
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
import { Loader2, Plus, Building2, Users, UserCheck, KeyRound, Pencil, CheckCircle, AlertCircle, Power, GraduationCap, Search, X, Crown, ArrowLeftRight, UserPlus, Trash2, DollarSign, CalendarDays, Download, ChevronDown, ChevronRight, Mail, Hash, User, Calendar, RotateCcw, Camera, ImageIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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

// Helper to determine display role (mentor vs manager vs gerente)
function getDisplayRole(user: any): string {
  if (user.role === 'manager' && user.consultorRole === 'mentor') return 'mentor';
  if (user.role === 'manager' && user.consultorRole === 'gerente') return 'gerente';
  if (user.role === 'manager') return 'gerente';
  return user.role;
}

export default function AdminCadastros() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const tabFromUrl = new URLSearchParams(searchString).get("tab");
  const validTabs = ["acesso", "empresas", "mentores", "gerentes", "gerentes-empresa"];
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "acesso";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sincronizar tab quando URL muda
  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

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

  const toggleMentorStatus = trpc.admin.toggleMentorStatus.useMutation({
    onSuccess: (data) => {
      toast.success(data.isActive ? "Mentor ativado com sucesso!" : "Mentor inativado com sucesso!");
      refetchMentores();
    },
    onError: (err) => toast.error(`Erro ao alterar status: ${err.message}`),
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

  const toggleAlunoStatus = trpc.admin.toggleAlunoStatus.useMutation({
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success(data.isActive ? `${data.name} ativado(a) com sucesso!` : `${data.name} inativado(a) com sucesso!`);
        refetchAllAlunos();
        refetchAccessUsers();
      }
    },
    onError: (err: any) => toast.error(`Erro ao alterar status: ${err.message}`),
  });

  const liberarOnboarding = trpc.admin.liberarOnboarding.useMutation({
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success("Onboarding liberado para novo ciclo!");
        refetchAllAlunos();
      } else {
        toast.error(data.message || "Erro ao liberar onboarding");
      }
    },
    onError: (err: any) => toast.error(`Erro ao liberar onboarding: ${err.message}`),
  });

  const deleteAluno = trpc.admin.deleteAluno.useMutation({
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success("Aluno excluído com sucesso!");
        refetchAllAlunos();
        refetchAccessUsers();
      } else if (data.requiresConfirmation) {
        // handled in component
      } else {
        toast.error(data.message || "Erro ao excluir aluno");
      }
    },
    onError: (err: any) => toast.error(`Erro ao excluir aluno: ${err.message}`),
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
            <TabsTrigger value="gerentes-empresa" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Gerentes
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
              onDelete={deleteAluno.mutate}
              isDeleting={deleteAluno.isPending}
              onToggleStatus={toggleAlunoStatus.mutate}
              isTogglingStatus={toggleAlunoStatus.isPending}
              onLiberarOnboarding={liberarOnboarding.mutate}
              isLiberandoOnboarding={liberarOnboarding.isPending}
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
              onToggleStatus={(consultorId: number) => toggleMentorStatus.mutate({ consultorId })}
              isTogglingStatus={toggleMentorStatus.isPending}
            />
          </TabsContent>

          {/* Gerentes Tab */}
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
function AlunosTab({ alunos, empresas, mentoresList, turmasList, loading, onUpdate, onCreateAluno, isCreatingAluno, onCreateDireto, isCreatingDireto, isUpdating, onDelete, isDeleting, onToggleStatus, isTogglingStatus, onLiberarOnboarding, isLiberandoOnboarding }: {
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
  onDelete: (data: any) => void;
  isDeleting: boolean;
  onToggleStatus: (data: any) => void;
  isTogglingStatus: boolean;
  onLiberarOnboarding: (data: any) => void;
  isLiberandoOnboarding: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [editAluno, setEditAluno] = useState<any>(null);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteDeps, setDeleteDeps] = useState<any>(null);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'cascade'>('confirm');

  const depsQuery = trpc.admin.getAlunoDependencies.useQuery(
    { alunoId: deleteTarget?.id ?? 0 },
    { enabled: !!deleteTarget && deleteOpen }
  );

  useEffect(() => {
    if (depsQuery.data) {
      setDeleteDeps(depsQuery.data);
      if (depsQuery.data.totalRelated > 0) {
        setDeleteStep('cascade');
      }
    }
  }, [depsQuery.data]);

  const handleDeleteClick = (aluno: any) => {
    setDeleteTarget(aluno);
    setDeleteDeps(null);
    setDeleteStep('confirm');
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const hasDeps = deleteDeps && deleteDeps.totalRelated > 0;
    onDelete({ alunoId: deleteTarget.id, confirmCascade: hasDeps });
    setDeleteOpen(false);
    setDeleteTarget(null);
    setDeleteDeps(null);
  };

  // Export Excel function
  const [isExporting, setIsExporting] = useState(false);
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const XLSX = await import('xlsx');
      const data = filteredAlunos.map((a: any) => ({
        'Nome': a.name || '',
        'Email': a.email || '',
        'CPF': a.cpf ? displayCpf(a.cpf) : '',
        'ID Externo': a.externalId || '',
        'Empresa': a.programName || '',
        'Mentor(a)': a.mentorName || '',
        'Turma': a.turmaName || '',
        'Início Contrato': a.contratoInicio ? formatDateSafe(a.contratoInicio) : '',
        'Fim Contrato': a.contratoFim ? formatDateSafe(a.contratoFim) : '',
        'Status': a.isActive === 1 ? 'Ativo' : 'Inativo',
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      // Auto-width columns
      if (data.length > 0) {
        const colWidths = Object.keys(data[0]).map(key => ({
          wch: Math.max(key.length, ...data.map((r: any) => (r[key] || '').toString().length)) + 2
        }));
        ws['!cols'] = colWidths;
      }
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Alunos');
      XLSX.writeFile(wb, `alunos_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`${data.length} alunos exportados com sucesso!`);
    } catch (err: any) {
      toast.error(`Erro ao exportar: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Search/filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEmpresa, setFilterEmpresa] = useState("all");
  const [filterMentor, setFilterMentor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
  const [onboardContratoInicio, setOnboardContratoInicio] = useState("");
  const [onboardContratoFim, setOnboardContratoFim] = useState("");

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
      contratoInicio: onboardContratoInicio || undefined,
      contratoFim: onboardContratoFim || undefined,
    });
    setOnboardNome("");
    setOnboardEmail("");
    setOnboardId("");
    setOnboardProgramId("");
    setOnboardContratoInicio("");
    setOnboardContratoFim("");
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
  const [diretoContratoInicio, setDiretoContratoInicio] = useState("");
  const [diretoContratoFim, setDiretoContratoFim] = useState("");

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
    onCreateDireto({
      name: diretoNome,
      email: diretoEmail,
      cpf: credentialDigits,
      programId: parseInt(diretoProgramId),
      consultorId: diretoConsultorId ? parseInt(diretoConsultorId) : null,
      turmaId: diretoTurmaId ? parseInt(diretoTurmaId) : null,
      contratoInicio: diretoContratoInicio || undefined,
      contratoFim: diretoContratoFim || undefined,
    });
    setDiretoNome("");
    setDiretoEmail("");
    setDiretoCpf("");
    setDiretoProgramId("");
    setDiretoConsultorId("");
    setDiretoTurmaId("");
    setDiretoContratoInicio("");
    setDiretoContratoFim("");
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
  const [editContratoInicio, setEditContratoInicio] = useState("");
  const [editContratoFim, setEditContratoFim] = useState("");

  const handleEditOpen = (aluno: any) => {
    setEditAluno(aluno);
    setEditNome(aluno.name || "");
    setEditEmail(aluno.email || "");
    setEditCpf(aluno.cpf ? formatCpf(aluno.cpf) : "");
    setEditExternalId(aluno.externalId || "");
    setEditProgramId(aluno.programId ? aluno.programId.toString() : "");
    setEditConsultorId(aluno.consultorId ? aluno.consultorId.toString() : "");
    setEditTurmaId(aluno.turmaId ? aluno.turmaId.toString() : "");
    // Formatar datas de contrato para input type="date" (YYYY-MM-DD)
    setEditContratoInicio(aluno.contratoInicio ? new Date(aluno.contratoInicio).toISOString().split('T')[0] : "");
    setEditContratoFim(aluno.contratoFim ? new Date(aluno.contratoFim).toISOString().split('T')[0] : "");
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
      contratoInicio: editContratoInicio || null,
      contratoFim: editContratoFim || null,
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
          {/* Exportar Excel */}
          <Button variant="outline" onClick={handleExportExcel} disabled={isExporting || filteredAlunos.length === 0}>
            {isExporting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exportando...</> : <><Download className="h-4 w-4 mr-2" /> Exportar Excel</>}
          </Button>
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
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700 font-semibold flex items-center gap-1 mb-2"><CalendarDays className="h-3.5 w-3.5" /> Período do Contrato (Opcional)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Início</Label>
                        <Input type="date" value={onboardContratoInicio} onChange={(e) => setOnboardContratoInicio(e.target.value)} className="text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Fim</Label>
                        <Input type="date" value={onboardContratoFim} onChange={(e) => setOnboardContratoFim(e.target.value)} className="text-sm" />
                      </div>
                    </div>
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
                    Cadastre o aluno. O mentor será escolhido pelo aluno durante o onboarding.
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
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700 font-semibold flex items-center gap-1 mb-2"><CalendarDays className="h-3.5 w-3.5" /> Período do Contrato (Opcional)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Início</Label>
                        <Input type="date" value={diretoContratoInicio} onChange={(e) => setDiretoContratoInicio(e.target.value)} className="text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Fim</Label>
                        <Input type="date" value={diretoContratoFim} onChange={(e) => setDiretoContratoFim(e.target.value)} className="text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Mentor(a) (Opcional)</Label>
                    <select value={diretoConsultorId} onChange={(e) => setDiretoConsultorId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      <option value="">Aluno escolherá no onboarding</option>
                      {mentoresList.map((m: any) => (<option key={m.id} value={m.id.toString()}>{m.name}</option>))}
                    </select>
                    <p className="text-xs text-muted-foreground">O aluno sempre passará pelo onboarding e poderá escolher o mentor na etapa 3.</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDiretoOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isCreatingDireto} className="bg-emerald-600 hover:bg-emerald-700">
                    {isCreatingDireto ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cadastrando...</> : "Cadastrar Aluno"}
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
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 font-semibold flex items-center gap-1 mb-2"><CalendarDays className="h-3.5 w-3.5" /> Período do Contrato</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Início</Label>
                      <Input type="date" value={editContratoInicio} onChange={(e) => setEditContratoInicio(e.target.value)} className="text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fim</Label>
                      <Input type="date" value={editContratoFim} onChange={(e) => setEditContratoFim(e.target.value)} className="text-sm" />
                    </div>
                  </div>
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

            <div className="space-y-1">
              {filteredAlunos.map((aluno: any) => {
                const isExpanded = expandedId === aluno.id;
                return (
                  <div key={aluno.id} className={`border rounded-lg transition-all ${aluno.isActive !== 1 ? 'opacity-50' : ''} ${isExpanded ? 'ring-1 ring-primary/30 shadow-sm' : 'hover:bg-muted/30'}`}>
                    {/* Linha principal compacta - clicável */}
                    <div
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none"
                      onClick={() => setExpandedId(isExpanded ? null : aluno.id)}
                    >
                      <div className="text-muted-foreground">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{aluno.name}</span>
                      </div>
                      <div className="hidden sm:block text-xs text-muted-foreground truncate max-w-[200px]">
                        {aluno.programName || ''}
                      </div>
                      <div className="hidden md:block text-xs text-muted-foreground truncate max-w-[160px]">
                        {aluno.turmaName || ''}
                      </div>
                      <div
                        onClick={(e) => { e.stopPropagation(); onToggleStatus({ alunoId: aluno.id }); }}
                        className="cursor-pointer"
                        title={aluno.isActive === 1 ? "Clique para inativar" : "Clique para ativar"}
                      >
                        {aluno.isActive === 1 ? (
                          <Badge variant="default" className="bg-green-600 cursor-pointer text-[10px] px-1.5 py-0.5"><CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Ativo</Badge>
                        ) : (
                          <Badge variant="secondary" className="cursor-pointer text-[10px] px-1.5 py-0.5"><AlertCircle className="h-2.5 w-2.5 mr-0.5" /> Inativo</Badge>
                        )}
                      </div>
                    </div>

                    {/* Painel expandido com detalhes e ações */}
                    {isExpanded && (
                      <div className="border-t px-4 py-3 bg-muted/20">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">Email:</span>
                            <span className="truncate">{aluno.email || <span className="text-muted-foreground italic">não informado</span>}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Hash className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">CPF:</span>
                            <span className="font-mono">{aluno.cpf ? displayCpf(aluno.cpf) : <span className="text-muted-foreground italic">não informado</span>}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Hash className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">ID Externo:</span>
                            <span className="font-mono">{aluno.externalId || <span className="text-muted-foreground italic">-</span>}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">Empresa:</span>
                            <span>{aluno.programName || <span className="text-muted-foreground italic">-</span>}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">Mentor(a):</span>
                            <span>{aluno.mentorName || <span className="text-muted-foreground italic">não atribuído</span>}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">Turma:</span>
                            <span>{aluno.turmaName || <span className="text-muted-foreground italic">-</span>}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">Contrato:</span>
                            <span>
                              {aluno.contratoInicio || aluno.contratoFim ? (
                                <>
                                  {aluno.contratoInicio ? formatDateSafe(aluno.contratoInicio) : '?'}
                                  {' - '}
                                  {aluno.contratoFim ? formatDateSafe(aluno.contratoFim) : '?'}
                                </>
                              ) : (
                                <span className="text-muted-foreground italic">não definido</span>
                              )}
                            </span>
                          </div>
                        </div>
                        {/* Ações */}
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditOpen(aluno); }}>
                            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={aluno.isActive === 1 ? "text-amber-600 hover:bg-amber-600 hover:text-white" : "text-green-600 hover:bg-green-600 hover:text-white"}
                            onClick={(e) => { e.stopPropagation(); onToggleStatus({ alunoId: aluno.id }); }}
                            disabled={isTogglingStatus}
                          >
                            <Power className="h-3.5 w-3.5 mr-1.5" />
                            {aluno.isActive === 1 ? "Inativar" : "Ativar"}
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={(e) => { e.stopPropagation(); handleDeleteClick(aluno); }} disabled={isDeleting}>
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
                          </Button>
                          {aluno.hasPdi && (
                            <Button
                              variant="outline"
                              size="sm"
                              className={aluno.onboardingLiberado === 1 ? "text-orange-600 border-orange-300 bg-orange-50" : "text-blue-600 hover:bg-blue-600 hover:text-white"}
                              onClick={(e) => { e.stopPropagation(); onLiberarOnboarding({ alunoId: aluno.id }); }}
                              disabled={isLiberandoOnboarding || aluno.onboardingLiberado === 1}
                              title={aluno.onboardingLiberado === 1 ? "Onboarding j\u00e1 liberado para novo ciclo" : "Liberar onboarding para novo ciclo (renova\u00e7\u00e3o de contrato)"}
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                              {aluno.onboardingLiberado === 1 ? "Onboarding Liberado" : "Liberar Onboarding"}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredAlunos.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  {alunos.length === 0 ? "Nenhum aluno cadastrado." : "Nenhum aluno encontrado com os filtros aplicados."}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(open) => { if (!open) { setDeleteOpen(false); setDeleteTarget(null); setDeleteDeps(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir Aluno</DialogTitle>
            <DialogDescription>
              {deleteTarget && (
                <span>Tem certeza que deseja excluir <strong>{deleteTarget.name}</strong>?</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {depsQuery.isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Verificando dados relacionados...</span>
            </div>
          ) : deleteDeps && deleteDeps.totalRelated > 0 ? (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este aluno possui <strong>{deleteDeps.totalRelated}</strong> registros relacionados que serão excluídos permanentemente:
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {deleteDeps.pdis > 0 && <div>PDIs/Assessments: <strong>{deleteDeps.pdis}</strong></div>}
                {deleteDeps.sessions > 0 && <div>Sessões de mentoria: <strong>{deleteDeps.sessions}</strong></div>}
                {deleteDeps.participations > 0 && <div>Participações em eventos: <strong>{deleteDeps.participations}</strong></div>}
                {deleteDeps.performance > 0 && <div>Registros de performance: <strong>{deleteDeps.performance}</strong></div>}
                {deleteDeps.ciclos > 0 && <div>Ciclos de execução: <strong>{deleteDeps.ciclos}</strong></div>}
                {deleteDeps.disc > 0 && <div>Resultados DISC: <strong>{deleteDeps.disc}</strong></div>}
                {deleteDeps.metas > 0 && <div>Metas: <strong>{deleteDeps.metas}</strong></div>}
                {deleteDeps.contratos > 0 && <div>Contratos: <strong>{deleteDeps.contratos}</strong></div>}
              </div>
              <p className="text-sm text-destructive font-medium">Esta ação é irreversível!</p>
            </div>
          ) : deleteDeps ? (
            <p className="text-sm text-muted-foreground">Este aluno não possui dados relacionados. A exclusão será simples.</p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteTarget(null); setDeleteDeps(null); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={depsQuery.isLoading || isDeleting}>
              {isDeleting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Excluindo...</> : "Excluir Permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
function MentoresTab({ mentores, empresas, loading, onCreate, onUpdateAcesso, isCreating, onEdit, onToggleStatus, isTogglingStatus }: {
  mentores: any[];
  empresas: any[];
  loading: boolean;
  onCreate: (data: any) => void;
  onUpdateAcesso: (data: any) => void;
  isCreating: boolean;
  onEdit: (data: any) => void;
  onToggleStatus: (consultorId: number) => void;
  isTogglingStatus: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editMentor, setEditMentor] = useState<any>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpfMentor, setCpfMentor] = useState("");
  const [loginId, setLoginId] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [valorSessao, setValorSessao] = useState("");
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editEspecialidade, setEditEspecialidade] = useState("");
  const [editValorSessao, setEditValorSessao] = useState("");
  const [editMiniCurriculo, setEditMiniCurriculo] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const uploadPhotoMutation = trpc.mentor.uploadPhoto.useMutation({
    onSuccess: (data) => {
      setEditPhotoUrl(data.url);
      toast.success("Foto atualizada com sucesso!");
      setUploadingPhoto(false);
    },
    onError: (err) => {
      toast.error(`Erro ao enviar foto: ${err.message}`);
      setUploadingPhoto(false);
    },
  });
  // Precificação flexível
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricingMentor, setPricingMentor] = useState<any>(null);
  const [pricingRules, setPricingRules] = useState<Array<{ sessionFrom: string; sessionTo: string; valor: string; descricao: string }>>([]);
  const pricingQuery = trpc.admin.getMentorPricing.useQuery(
    { consultorId: pricingMentor?.id || 0 },
    { enabled: !!pricingMentor }
  );
  const setPricingMutation = trpc.admin.setMentorPricing.useMutation({
    onSuccess: () => {
      toast.success("Precificação salva com sucesso!");
      pricingQuery.refetch();
      setPricingOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

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
      loginId: loginId || undefined,
      valorSessao: valorSessao ? valorSessao : undefined
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

  const handlePricingOpen = (mentor: any) => {
    setPricingMentor(mentor);
    setPricingOpen(true);
  };

  // Sincronizar regras quando dados carregam
  React.useEffect(() => {
    if (pricingQuery.data && pricingOpen) {
      if (pricingQuery.data.length > 0) {
        setPricingRules(pricingQuery.data.map(r => ({
          sessionFrom: String(r.sessionFrom),
          sessionTo: String(r.sessionTo),
          valor: String(r.valor),
          descricao: r.descricao || '',
        })));
      } else {
        setPricingRules([{ sessionFrom: '1', sessionTo: '12', valor: pricingMentor?.valorSessao || '0', descricao: '' }]);
      }
    }
  }, [pricingQuery.data, pricingOpen]);

  const addPricingRule = () => {
    const lastTo = pricingRules.length > 0 ? Number(pricingRules[pricingRules.length - 1].sessionTo) : 0;
    setPricingRules([...pricingRules, { sessionFrom: String(lastTo + 1), sessionTo: String(lastTo + 4), valor: '', descricao: '' }]);
  };

  const removePricingRule = (index: number) => {
    setPricingRules(pricingRules.filter((_, i) => i !== index));
  };

  const updatePricingRule = (index: number, field: string, value: string) => {
    const updated = [...pricingRules];
    (updated[index] as any)[field] = value;
    setPricingRules(updated);
  };

  const handlePricingSave = () => {
    const rules = pricingRules.filter(r => r.valor && r.sessionFrom && r.sessionTo).map(r => ({
      sessionFrom: Number(r.sessionFrom),
      sessionTo: Number(r.sessionTo),
      valor: r.valor,
      descricao: r.descricao || undefined,
    }));
    setPricingMutation.mutate({ consultorId: pricingMentor.id, rules });
  };

  const handleEditOpen = (mentor: any) => {
    setEditMentor(mentor);
    setEditNome(mentor.name || "");
    setEditEmail(mentor.email || "");
    setEditCpf(mentor.cpf ? formatCpf(mentor.cpf) : "");
    setEditEspecialidade(mentor.especialidade || "");
    setEditValorSessao(mentor.valorSessao || "");
    setEditMiniCurriculo(mentor.miniCurriculo || "");
    setEditPhotoUrl(mentor.photoUrl || "");
    setEditOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editMentor) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem (JPG, PNG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      uploadPhotoMutation.mutate({
        consultorId: editMentor.id,
        photoBase64: base64,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
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
      especialidade: editEspecialidade || undefined,
      valorSessao: editValorSessao ? editValorSessao : undefined,
      miniCurriculo: editMiniCurriculo || undefined,
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
                <div className="space-y-2">
                  <Label htmlFor="valor-sessao-mentor">Valor por Sessão (R$)</Label>
                  <Input id="valor-sessao-mentor" type="number" step="0.01" min="0" value={valorSessao} onChange={(e) => setValorSessao(e.target.value)} placeholder="Ex: 150.00" />
                  <p className="text-xs text-muted-foreground">Valor cobrado por sessão de mentoria individual</p>
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
                <TableHead>Valor/Sessão</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell className="font-mono">{mentor.valorSessao ? `R$ ${Number(mentor.valorSessao).toFixed(2)}` : <span className="text-muted-foreground italic">-</span>}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleStatus(mentor.id)}
                      disabled={isTogglingStatus}
                      className={mentor.isActive ? "text-green-600 hover:text-red-600" : "text-red-600 hover:text-green-600"}
                      title={mentor.isActive ? "Clique para inativar" : "Clique para ativar"}
                    >
                      {mentor.isActive ? (
                        <Badge variant="default" className="bg-green-600 cursor-pointer"><CheckCircle className="h-3 w-3 mr-1" /> Ativo</Badge>
                      ) : (
                        <Badge variant="destructive" className="cursor-pointer"><AlertCircle className="h-3 w-3 mr-1" /> Inativo</Badge>
                      )}
                    </Button>
                  </TableCell>
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePricingOpen(mentor)}
                        title="Precificação por sessão"
                      >
                        <DollarSign className="h-3 w-3 mr-1" /> Preços
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {mentores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhum mentor cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* Dialog de Precificação Flexível */}
        <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Precificação por Sessão</DialogTitle>
              <DialogDescription>
                Defina valores diferentes por número de sessão para {pricingMentor?.name}.
                Valor padrão: R$ {pricingMentor?.valorSessao ? Number(pricingMentor.valorSessao).toFixed(2) : '0.00'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {pricingQuery.isLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center text-sm font-medium text-muted-foreground">
                    <span>Sessão De</span>
                    <span>Sessão Até</span>
                    <span>Valor (R$)</span>
                    <span></span>
                  </div>
                  {pricingRules.map((rule, index) => (
                    <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                      <Input
                        type="number"
                        min="1"
                        value={rule.sessionFrom}
                        onChange={(e) => updatePricingRule(index, 'sessionFrom', e.target.value)}
                        placeholder="1"
                      />
                      <Input
                        type="number"
                        min="1"
                        value={rule.sessionTo}
                        onChange={(e) => updatePricingRule(index, 'sessionTo', e.target.value)}
                        placeholder="12"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={rule.valor}
                        onChange={(e) => updatePricingRule(index, 'valor', e.target.value)}
                        placeholder="150.00"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePricingRule(index)}
                        disabled={pricingRules.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addPricingRule} className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Faixa
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Sessões não cobertas por nenhuma faixa usarão o valor padrão (R$ {pricingMentor?.valorSessao ? Number(pricingMentor.valorSessao).toFixed(2) : '0.00'}).
                    Exemplo: Sessões 1 e 12 = R$ 150, Sessões 2 a 11 = R$ 100.
                  </p>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPricingOpen(false)}>Cancelar</Button>
              <Button onClick={handlePricingSave} disabled={setPricingMutation.isPending}>
                {setPricingMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Salvar Precificação"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição de Mentor */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Editar Mentor</DialogTitle>
                <DialogDescription>Atualize os dados do mentor</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Foto do Mentor */}
                <div className="space-y-2">
                  <Label>Foto do Mentor</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
                      {editPhotoUrl ? (
                        <img src={editPhotoUrl} alt="Foto do mentor" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingPhoto}
                        onClick={() => document.getElementById('edit-photo-mentor')?.click()}
                      >
                        {uploadingPhoto ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                        ) : (
                          <><Camera className="h-4 w-4 mr-2" /> {editPhotoUrl ? 'Alterar Foto' : 'Adicionar Foto'}</>
                        )}
                      </Button>
                      <input
                        id="edit-photo-mentor"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                      <p className="text-xs text-muted-foreground">JPG, PNG ou WebP. Máx 5MB.</p>
                    </div>
                  </div>
                </div>

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
                <div className="space-y-2">
                  <Label htmlFor="edit-valor-sessao-mentor">Valor por Sessão (R$)</Label>
                  <Input id="edit-valor-sessao-mentor" type="number" step="0.01" min="0" value={editValorSessao} onChange={(e) => setEditValorSessao(e.target.value)} placeholder="Ex: 150.00" />
                </div>

                {/* Minicurrículo */}
                <div className="space-y-2">
                  <Label htmlFor="edit-minicurriculo-mentor">Minicurrículo</Label>
                  <Textarea
                    id="edit-minicurriculo-mentor"
                    value={editMiniCurriculo}
                    onChange={(e) => setEditMiniCurriculo(e.target.value)}
                    placeholder="Breve descrição profissional do mentor, formação, experiência e áreas de atuação..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">Biografia profissional que será exibida no perfil do mentor</p>
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
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
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
