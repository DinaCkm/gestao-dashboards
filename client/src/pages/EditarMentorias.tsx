import { useState, useMemo } from "react";
import { formatDateSafe } from "@/lib/dateUtils";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Edit3, Calendar, ChevronLeft, ChevronRight, X, Trash2, AlertTriangle, Plus, Eye, FileText, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function EditarMentorias() {
  const { user, loading } = useAuth();

  // Filters
  const [programFilter, setProgramFilter] = useState<string>("");
  const [turmaFilter, setTurmaFilter] = useState<string>("");
  const [consultorFilter, setConsultorFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 30;

  // Edit dialog state
  const [editSession, setEditSession] = useState<any | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editSessionNumber, setEditSessionNumber] = useState("");
  const [editConsultorId, setEditConsultorId] = useState("");
  const [editTaskStatus, setEditTaskStatus] = useState("");
  const [editPresence, setEditPresence] = useState("");

  // Delete confirmation dialog state
  const [deleteSession, setDeleteSession] = useState<any | null>(null);

  // Create session dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createAlunoId, setCreateAlunoId] = useState("");
  const [createConsultorId, setCreateConsultorId] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [createSessionNumber, setCreateSessionNumber] = useState("");
  const [createPresence, setCreatePresence] = useState("presente");
  const [createTaskStatus, setCreateTaskStatus] = useState("sem_tarefa");
  const [createNotaEvolucao, setCreateNotaEvolucao] = useState("");
  const [createFeedback, setCreateFeedback] = useState("");
  const [createTurmaFilter, setCreateTurmaFilter] = useState("");
  const [createAlunoSearch, setCreateAlunoSearch] = useState("");

  // Student detail sheet state
  const [selectedAlunoId, setSelectedAlunoId] = useState<number | null>(null);

  // Data queries
  const { data: empresas } = trpc.admin.listEmpresas.useQuery(undefined, {
    enabled: !loading && !!user && user.role === "admin",
  });
  const { data: turmasData } = trpc.turmas.list.useQuery(undefined, {
    enabled: !loading && !!user && user.role === "admin",
  });
  const { data: mentores } = trpc.admin.listMentores.useQuery(undefined, {
    enabled: !loading && !!user && user.role === "admin",
  });
  const { data: allAlunos } = trpc.alunos.list.useQuery(undefined, {
    enabled: !loading && !!user && user.role === "admin",
  });

  // Student detail data (from demonstrativo-mentorias)
  const { data: progressData } = trpc.mentor.allSessionProgress.useQuery(undefined, {
    enabled: !loading && !!user && (user.role === "admin" || user.role === "manager"),
  });

  // Build query input
  const queryInput = useMemo(() => ({
    programId: programFilter ? Number(programFilter) : undefined,
    turmaId: turmaFilter ? Number(turmaFilter) : undefined,
    consultorId: consultorFilter ? Number(consultorFilter) : undefined,
    page,
    pageSize,
  }), [programFilter, turmaFilter, consultorFilter, page]);

  const { data: sessionsData, isLoading: loadingSessions, refetch } = trpc.admin.listMentoringSessions.useQuery(queryInput, {
    enabled: !loading && !!user && user.role === "admin",
  });

  const updateSessionMutation = trpc.admin.updateSessionDate.useMutation({
    onSuccess: () => {
      toast.success("Sessão atualizada com sucesso!");
      closeEditDialog();
      refetch();
    },
    onError: (err) => {
      toast.error("Erro ao atualizar: " + err.message);
    },
  });

  const deleteSessionMutation = trpc.admin.deleteSession.useMutation({
    onSuccess: () => {
      toast.success("Sessão de mentoria excluída com sucesso!");
      setDeleteSession(null);
      refetch();
    },
    onError: (err) => {
      toast.error("Erro ao excluir sessão: " + err.message);
    },
  });

  const createSessionMutation = trpc.admin.adminCreateSession.useMutation({
    onSuccess: () => {
      toast.success("Sessão de mentoria criada com sucesso! Notificação enviada por e-mail.");
      closeCreateDialog();
      refetch();
    },
    onError: (err) => {
      toast.error("Erro ao criar sessão: " + err.message);
    },
  });

  // Filter turmas by selected program
  const filteredTurmas = useMemo(() => {
    if (!turmasData) return [];
    if (!programFilter) return turmasData;
    return turmasData.filter((t: any) => t.programId === Number(programFilter));
  }, [turmasData, programFilter]);

  // Filter alunos by turma for create dialog — also consider PDI-based turma association
  const filteredAlunosForCreate = useMemo(() => {
    if (!allAlunos) return [];
    if (!createTurmaFilter) {
      // No turma filter — show all, optionally filtered by search
      const list = allAlunos;
      if (!createAlunoSearch.trim()) return list;
      const term = createAlunoSearch.toLowerCase();
      return list.filter((a: any) => a.name?.toLowerCase().includes(term));
    }
    
    // Get the turma name to extract trilha info
    const selectedTurma = turmasData?.find((t: any) => String(t.id) === createTurmaFilter);
    const turmaId = Number(createTurmaFilter);
    
    // Filter: aluno belongs to this turma directly OR has a PDI for a trilha matching this turma
    // Since we can't query PDI from frontend easily, we use progressData which has trilhaId per PDI
    const alunoIdsFromPdi = new Set<number>();
    if (progressData && selectedTurma) {
      // progressData items have alunoId and turmaId/trilhaId
      for (const p of progressData) {
        // Match by turma name containing the same program+trilha pattern
        if (p.turmaNome === selectedTurma.name) {
          alunoIdsFromPdi.add(p.alunoId);
        }
      }
    }
    
    const list = allAlunos.filter((a: any) => 
      a.turmaId === turmaId || alunoIdsFromPdi.has(a.id)
    );
    
    if (!createAlunoSearch.trim()) return list;
    const term = createAlunoSearch.toLowerCase();
    return list.filter((a: any) => a.name?.toLowerCase().includes(term));
  }, [allAlunos, createTurmaFilter, createAlunoSearch, turmasData, progressData]);

  // Client-side search filter on the results
  const filteredSessions = useMemo(() => {
    if (!sessionsData?.sessions) return [];
    if (!searchTerm.trim()) return sessionsData.sessions;
    const term = searchTerm.toLowerCase();
    return sessionsData.sessions.filter((s: any) =>
      s.alunoNome?.toLowerCase().includes(term) ||
      s.consultorNome?.toLowerCase().includes(term) ||
      s.turmaNome?.toLowerCase().includes(term) ||
      String(s.sessionNumber).includes(term)
    );
  }, [sessionsData, searchTerm]);

  const totalPages = sessionsData ? Math.ceil(sessionsData.total / pageSize) : 0;

  // Find selected aluno detail from progressData
  const selectedAlunoDetail = useMemo(() => {
    if (!selectedAlunoId || !progressData) return null;
    return progressData.find((p: any) => p.alunoId === selectedAlunoId) || null;
  }, [selectedAlunoId, progressData]);

  function handleEditClick(session: any) {
    setEditSession(session);
    if (session.sessionDate) {
      const d = new Date(session.sessionDate);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      setEditDate(`${year}-${month}-${day}`);
    } else {
      setEditDate("");
    }
    setEditSessionNumber(String(session.sessionNumber || ""));
    setEditConsultorId(session.consultorId ? String(session.consultorId) : "");
    setEditTaskStatus(session.taskStatus || "sem_tarefa");
    setEditPresence(session.presence || "presente");
  }

  function closeEditDialog() {
    setEditSession(null);
    setEditDate("");
    setEditSessionNumber("");
    setEditConsultorId("");
    setEditTaskStatus("");
    setEditPresence("");
  }

  function handleSaveEdit() {
    if (!editSession) return;

    const payload: any = { sessionId: editSession.id };

    if (editDate) {
      const origDate = editSession.sessionDate
        ? (() => { const d = new Date(editSession.sessionDate); return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`; })()
        : "";
      if (editDate !== origDate) {
        payload.sessionDate = editDate;
      }
    }

    const newNum = Number(editSessionNumber);
    if (!isNaN(newNum) && newNum > 0 && newNum !== editSession.sessionNumber) {
      payload.sessionNumber = newNum;
    }

    if (editConsultorId && Number(editConsultorId) !== editSession.consultorId) {
      payload.consultorId = Number(editConsultorId);
    }

    if (editTaskStatus && editTaskStatus !== editSession.taskStatus) {
      payload.taskStatus = editTaskStatus;
    }

    if (editPresence && editPresence !== editSession.presence) {
      payload.presence = editPresence;
    }

    if (Object.keys(payload).length <= 1) {
      toast.info("Nenhuma alteração detectada.");
      return;
    }

    updateSessionMutation.mutate(payload);
  }

  function handleDeleteClick(session: any) {
    setDeleteSession(session);
  }

  function handleConfirmDelete() {
    if (!deleteSession) return;
    deleteSessionMutation.mutate({
      sessionId: deleteSession.id,
    });
  }

  function openCreateDialog() {
    setShowCreateDialog(true);
    setCreateAlunoId("");
    setCreateConsultorId("");
    setCreateDate("");
    setCreateSessionNumber("");
    setCreatePresence("presente");
    setCreateTaskStatus("sem_tarefa");
    setCreateNotaEvolucao("");
    setCreateFeedback("");
    setCreateTurmaFilter("");
    setCreateAlunoSearch("");
  }

  function closeCreateDialog() {
    setShowCreateDialog(false);
    setCreateAlunoId("");
    setCreateConsultorId("");
    setCreateDate("");
    setCreateSessionNumber("");
    setCreatePresence("presente");
    setCreateTaskStatus("sem_tarefa");
    setCreateNotaEvolucao("");
    setCreateFeedback("");
    setCreateTurmaFilter("");
    setCreateAlunoSearch("");
  }

  function handleCreateSession() {
    if (!createAlunoId || !createConsultorId || !createDate || !createSessionNumber) {
      toast.error("Preencha todos os campos obrigatórios: Aluno, Mentor, Data e Nº da Sessão.");
      return;
    }

    const sessionNum = Number(createSessionNumber);
    if (isNaN(sessionNum) || sessionNum < 1) {
      toast.error("Número da sessão deve ser um valor positivo.");
      return;
    }

    createSessionMutation.mutate({
      alunoId: Number(createAlunoId),
      consultorId: Number(createConsultorId),
      sessionDate: createDate,
      sessionNumber: sessionNum,
      presence: createPresence as "presente" | "ausente",
      taskStatus: createTaskStatus as "entregue" | "nao_entregue" | "sem_tarefa",
      notaEvolucao: createNotaEvolucao ? Number(createNotaEvolucao) : null,
      feedback: createFeedback || undefined,
    });
  }

  function clearFilters() {
    setProgramFilter("");
    setTurmaFilter("");
    setConsultorFilter("");
    setSearchTerm("");
    setPage(1);
  }

  function getTaskStatusLabel(status: string) {
    switch (status) {
      case "entregue": return "Entregue";
      case "nao_entregue": return "Não entregue";
      case "sem_tarefa": return "Sem tarefa";
      case "validada": return "Validada";
      default: return status || "—";
    }
  }

  function getTaskStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
    switch (status) {
      case "entregue": return "default";
      case "validada": return "default";
      case "nao_entregue": return "destructive";
      default: return "secondary";
    }
  }

  function getProgressColor(pct: number) {
    if (pct >= 100) return "bg-emerald-500";
    if (pct >= 75) return "bg-blue-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-red-500";
  }

  function formatDate(dateStr: string | Date | null | undefined) {
    if (!dateStr) return "—";
    const d = dateStr instanceof Date ? dateStr : new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Acesso restrito a administradores.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Mentorias</h1>
            <p className="text-muted-foreground mt-1">
              Pesquise, edite, exclua ou crie sessões de mentoria.
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Sessão
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Empresa */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Empresa</Label>
                <Select value={programFilter} onValueChange={(v) => { setProgramFilter(v); setTurmaFilter(""); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas?.map((e: any) => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Turma */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Turma</Label>
                <Select value={turmaFilter} onValueChange={(v) => { setTurmaFilter(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTurmas?.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mentor */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Mentor</Label>
                <Select value={consultorFilter} onValueChange={(v) => { setConsultorFilter(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os mentores" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentores?.map((m: any) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Buscar aluno</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome do aluno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {/* Clear filters */}
            {(programFilter || turmaFilter || consultorFilter || searchTerm) && (
              <div className="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Limpar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Sessões de Mentoria
                {sessionsData && (
                  <Badge variant="secondary" className="ml-2">
                    {sessionsData.total} registro{sessionsData.total !== 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loadingSessions ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <p>Nenhuma sessão encontrada.</p>
                <p className="text-xs mt-1">Ajuste os filtros para buscar sessões.</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">ID</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Mentor</TableHead>
                        <TableHead>Turma</TableHead>
                        <TableHead className="text-center">Sessão</TableHead>
                        <TableHead className="text-center">Data</TableHead>
                        <TableHead className="text-center">Presença</TableHead>
                        <TableHead className="text-center">Tarefa</TableHead>
                        <TableHead className="text-center w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSessions.map((session: any) => (
                        <TableRow 
                          key={session.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedAlunoId(session.alunoId)}
                        >
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {session.id}
                          </TableCell>
                          <TableCell className="font-medium text-sm max-w-[200px] truncate">
                            <span className="flex items-center gap-1.5">
                              <Eye className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              {session.alunoNome}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate">
                            {session.consultorNome || "—"}
                          </TableCell>
                          <TableCell className="text-xs max-w-[180px] truncate">
                            {session.turmaNome || "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs">
                              #{session.sessionNumber}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {formatDateSafe(session.sessionDate)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={session.presence === "presente" ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {session.presence === "presente" ? "Presente" : "Ausente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={getTaskStatusVariant(session.taskStatus)}
                              className="text-xs"
                            >
                              {getTaskStatusLabel(session.taskStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleEditClick(session); }}
                                className="h-7 w-7 p-0"
                                title="Editar sessão"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(session); }}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Excluir sessão"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-muted-foreground">
                      Página {page} de {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit Session Dialog */}
        <Dialog open={!!editSession} onOpenChange={(open) => { if (!open) closeEditDialog(); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Editar Sessão de Mentoria
              </DialogTitle>
              <DialogDescription>
                Altere os dados da sessão de mentoria selecionada.
              </DialogDescription>
            </DialogHeader>

            {editSession && (
              <div className="space-y-4 py-2">
                {/* Session info (read-only) */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono font-medium">{editSession.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Aluno:</span>
                    <span className="font-medium">{editSession.alunoNome}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Turma:</span>
                    <span className="font-medium">{editSession.turmaNome || "—"}</span>
                  </div>
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="editSessionNumber" className="text-sm">Nº da Sessão</Label>
                    <Input
                      id="editSessionNumber"
                      type="number"
                      min={1}
                      value={editSessionNumber}
                      onChange={(e) => setEditSessionNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="editDate" className="text-sm">Data</Label>
                    <Input
                      id="editDate"
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Mentor</Label>
                  <Select value={editConsultorId} onValueChange={setEditConsultorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o mentor" />
                    </SelectTrigger>
                    <SelectContent>
                      {mentores?.map((m: any) => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Presença</Label>
                    <Select value={editPresence} onValueChange={setEditPresence}>
                      <SelectTrigger>
                        <SelectValue placeholder="Presença" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="presente">Presente</SelectItem>
                        <SelectItem value="ausente">Ausente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Tarefa</Label>
                    <Select value={editTaskStatus} onValueChange={setEditTaskStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status da tarefa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entregue">Entregue</SelectItem>
                        <SelectItem value="nao_entregue">Não entregue</SelectItem>
                        <SelectItem value="sem_tarefa">Sem tarefa</SelectItem>
                        <SelectItem value="validada">Validada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeEditDialog}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateSessionMutation.isPending}
              >
                {updateSessionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteSession} onOpenChange={(open) => { if (!open) setDeleteSession(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Excluir Sessão de Mentoria
              </DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. A sessão será permanentemente removida do sistema.
              </DialogDescription>
            </DialogHeader>

            {deleteSession && (
              <div className="space-y-4 py-2">
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono font-medium">{deleteSession.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Aluno:</span>
                    <span className="font-medium">{deleteSession.alunoNome}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sessão:</span>
                    <span className="font-medium">#{deleteSession.sessionNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Data:</span>
                    <span className="font-medium">{formatDateSafe(deleteSession.sessionDate)}</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteSession(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteSessionMutation.isPending}
              >
                {deleteSessionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Sessão
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Session Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) closeCreateDialog(); }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nova Sessão de Mentoria
              </DialogTitle>
              <DialogDescription>
                Crie uma nova sessão de mentoria para um aluno. Uma notificação será enviada por e-mail ao administrador.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Turma filter to help find aluno */}
              <div className="space-y-1.5">
                <Label className="text-sm">Turma <span className="text-xs text-muted-foreground">(filtro para facilitar a busca do aluno)</span></Label>
                <Select value={createTurmaFilter} onValueChange={(v) => { setCreateTurmaFilter(v); setCreateAlunoId(""); setCreateAlunoSearch(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmasData?.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Aluno */}
              <div className="space-y-1.5">
                <Label className="text-sm">Aluno <span className="text-destructive">*</span></Label>
                {/* Search input for aluno */}
                <div className="relative mb-1.5">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Nome do aluno..."
                    value={createAlunoSearch}
                    onChange={(e) => setCreateAlunoSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <Select value={createAlunoId} onValueChange={setCreateAlunoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAlunosForCreate?.map((a: any) => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                    ))}
                    {filteredAlunosForCreate?.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                        Nenhum aluno encontrado
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Mentor */}
              <div className="space-y-1.5">
                <Label className="text-sm">Mentor <span className="text-destructive">*</span></Label>
                <Select value={createConsultorId} onValueChange={setCreateConsultorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentores?.map((m: any) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Session Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="createSessionNumber" className="text-sm">Nº da Sessão <span className="text-destructive">*</span></Label>
                  <Input
                    id="createSessionNumber"
                    type="number"
                    min={1}
                    placeholder="Ex: 1"
                    value={createSessionNumber}
                    onChange={(e) => setCreateSessionNumber(e.target.value)}
                  />
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="createDate" className="text-sm">Data <span className="text-destructive">*</span></Label>
                  <Input
                    id="createDate"
                    type="date"
                    value={createDate}
                    onChange={(e) => setCreateDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Presence */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Presença</Label>
                  <Select value={createPresence} onValueChange={setCreatePresence}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presente">Presente</SelectItem>
                      <SelectItem value="ausente">Ausente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Task Status */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Tarefa</Label>
                  <Select value={createTaskStatus} onValueChange={setCreateTaskStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entregue">Entregue</SelectItem>
                      <SelectItem value="nao_entregue">Não entregue</SelectItem>
                      <SelectItem value="sem_tarefa">Sem tarefa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Nota Evolução */}
              <div className="space-y-1.5">
                <Label htmlFor="createNotaEvolucao" className="text-sm">Nota de Evolução <span className="text-xs text-muted-foreground">(0 a 10, opcional)</span></Label>
                <Input
                  id="createNotaEvolucao"
                  type="number"
                  min={0}
                  max={10}
                  placeholder="Ex: 7"
                  value={createNotaEvolucao}
                  onChange={(e) => setCreateNotaEvolucao(e.target.value)}
                />
              </div>

              {/* Feedback */}
              <div className="space-y-1.5">
                <Label htmlFor="createFeedback" className="text-sm">Parecer/Feedback <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                <textarea
                  id="createFeedback"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Observações sobre a sessão..."
                  value={createFeedback}
                  onChange={(e) => setCreateFeedback(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeCreateDialog}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateSession}
                disabled={createSessionMutation.isPending}
                className="gap-2"
              >
                {createSessionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Criar Sessão
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Student Detail Sheet */}
        <Sheet open={!!selectedAlunoId} onOpenChange={(open) => { if (!open) setSelectedAlunoId(null); }}>
          <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto">
            {selectedAlunoDetail ? (
              <>
                <SheetHeader className="pb-4">
                  <SheetTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5 text-[#1E3A5F]" />
                    Detalhes do Aluno
                  </SheetTitle>
                  <SheetDescription>
                    Visão completa do progresso de mentoria
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-4">
                  {/* Aluno Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 text-base mb-3">{selectedAlunoDetail.alunoNome}</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500 text-xs block">Empresa</span>
                        <span className="font-medium text-gray-800">{selectedAlunoDetail.programaNome || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">Turma</span>
                        <span className="font-medium text-gray-800">{selectedAlunoDetail.turmaNome || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">Trilha</span>
                        <span className="font-medium text-gray-800">{selectedAlunoDetail.trilhaNome || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">Mentor</span>
                        <span className="font-medium text-gray-800">{selectedAlunoDetail.consultorNome || <span className="text-gray-400 italic">Não atribuído</span>}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">E-mail Aluno</span>
                        <span className="font-medium text-gray-800 text-xs">{selectedAlunoDetail.alunoEmail || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">E-mail Mentor</span>
                        <span className="font-medium text-gray-800 text-xs">{selectedAlunoDetail.consultorEmail || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Período */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" /> Período do Contrato
                    </h4>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 text-xs block">Início</span>
                        <span className="font-medium">{formatDate(selectedAlunoDetail.macroInicio)}</span>
                      </div>
                      <span className="text-gray-400">→</span>
                      <div>
                        <span className="text-gray-500 text-xs block">Término</span>
                        <span className="font-medium">{formatDate(selectedAlunoDetail.macroTermino)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <span className="text-gray-500 text-xs block mb-1">Status Progresso</span>
                      <Badge className={selectedAlunoDetail.cicloCompleto ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}>
                        {selectedAlunoDetail.cicloCompleto ? "Completo" : "Em andamento"}
                      </Badge>
                    </div>
                    <div className="rounded-lg border p-3">
                      <span className="text-gray-500 text-xs block mb-1">Status Sessão</span>
                      <Badge className={selectedAlunoDetail.atrasado30dias ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                        {selectedAlunoDetail.atrasado30dias ? "Atrasado" : "Em dia"}
                      </Badge>
                    </div>
                  </div>

                  {/* Sessões */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#1E3A5F]" /> Sessões de Mentoria
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-2xl font-bold text-[#1E3A5F]">{selectedAlunoDetail.sessoesRealizadas}</p>
                        <p className="text-[10px] text-gray-500">Realizadas</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-2xl font-bold text-gray-600">{selectedAlunoDetail.totalSessoesEsperadas}</p>
                        <p className="text-[10px] text-gray-500">Esperadas</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <p className={`text-2xl font-bold ${selectedAlunoDetail.sessoesFaltantes === 0 ? 'text-emerald-600' : 'text-red-600'}`}>{selectedAlunoDetail.sessoesFaltantes}</p>
                        <p className="text-[10px] text-gray-500">Faltantes</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progresso</span>
                        <span className="font-semibold">{selectedAlunoDetail.percentualProgresso}%</span>
                      </div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${getProgressColor(selectedAlunoDetail.percentualProgresso)}`}
                          style={{ width: `${Math.min(100, selectedAlunoDetail.percentualProgresso)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Última Sessão */}
                  <div className={`rounded-lg p-4 ${selectedAlunoDetail.atrasado30dias ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                    <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                      <Clock className={`h-4 w-4 ${selectedAlunoDetail.atrasado30dias ? 'text-red-600' : 'text-green-600'}`} /> Última Sessão
                    </h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {selectedAlunoDetail.ultimaSessao 
                            ? new Date(selectedAlunoDetail.ultimaSessao).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
                            : "Nenhuma sessão registrada"
                          }
                        </p>
                        {selectedAlunoDetail.diasSemSessao !== null && (
                          <p className={`text-xs mt-1 font-semibold ${selectedAlunoDetail.atrasado30dias ? 'text-red-700' : 'text-green-700'}`}>
                            {selectedAlunoDetail.diasSemSessao} dia(s) atrás
                          </p>
                        )}
                      </div>
                      {selectedAlunoDetail.atrasado30dias && (
                        <AlertCircle className="h-8 w-8 text-red-400" />
                      )}
                    </div>
                  </div>

                  {/* Histórico de Sessões */}
                  <AlunoSessionsList alunoId={selectedAlunoDetail.alunoId} />
                </div>
              </>
            ) : selectedAlunoId ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p className="text-sm">Carregando dados do aluno...</p>
              </div>
            ) : null}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}

// Inline component for session history in the detail sheet
function AlunoSessionsList({ alunoId }: { alunoId: number }) {
  const { data: sessions, isLoading } = trpc.mentor.sessionsByAluno.useQuery(
    { alunoId },
    { enabled: !!alunoId }
  );

  const sortedSessions = useMemo(() => {
    if (!sessions) return [];
    return [...sessions].sort((a, b) => (a.sessionNumber ?? 0) - (b.sessionNumber ?? 0));
  }, [sessions]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#1E3A5F]" /> Histórico de Sessões
        </h4>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-xs text-gray-500">Carregando sessões...</span>
        </div>
      </div>
    );
  }

  if (!sortedSessions.length) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#1E3A5F]" /> Histórico de Sessões
        </h4>
        <p className="text-xs text-gray-500 text-center py-2">Nenhuma sessão registrada.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-[#1E3A5F]" /> Histórico de Sessões ({sortedSessions.length})
      </h4>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {sortedSessions.map((s: any) => (
          <div key={s.id} className="bg-white rounded-md border p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs font-mono">
                #{s.sessionNumber}
              </Badge>
              <div>
                <p className="text-xs font-medium">
                  {s.sessionDate ? new Date(s.sessionDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }) : "Sem data"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={s.presence === "presente" ? "default" : "destructive"}
                className="text-[10px]"
              >
                {s.presence === "presente" ? "Presente" : "Ausente"}
              </Badge>
              {s.taskStatus && s.taskStatus !== "sem_tarefa" && (
                <Badge
                  variant={s.taskStatus === "entregue" || s.taskStatus === "validada" ? "default" : "destructive"}
                  className="text-[10px]"
                >
                  {s.taskStatus === "entregue" ? "Entregue" : s.taskStatus === "validada" ? "Validada" : "Não entregue"}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
