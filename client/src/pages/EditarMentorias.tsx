import React, { useState, useMemo } from "react";
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
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Edit3, Calendar, ChevronLeft, ChevronRight, X, Trash2, AlertTriangle } from "lucide-react";
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
  const [newDate, setNewDate] = useState("");

  // Delete confirmation dialog state
  const [deleteSession, setDeleteSession] = useState<any | null>(null);

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

  const updateDateMutation = trpc.admin.updateSessionDate.useMutation({
    onSuccess: () => {
      toast.success("Data da sessão atualizada com sucesso!");
      setEditSession(null);
      setNewDate("");
      refetch();
    },
    onError: (err) => {
      toast.error("Erro ao atualizar data: " + err.message);
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

  // Filter turmas by selected program
  const filteredTurmas = useMemo(() => {
    if (!turmasData) return [];
    if (!programFilter) return turmasData;
    return turmasData.filter((t: any) => t.programId === Number(programFilter));
  }, [turmasData, programFilter]);

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

  function handleEditDate(session: any) {
    setEditSession(session);
    // Convert the session date to YYYY-MM-DD for the input
    if (session.sessionDate) {
      const d = new Date(session.sessionDate);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      setNewDate(`${year}-${month}-${day}`);
    } else {
      setNewDate("");
    }
  }

  function handleSaveDate() {
    if (!editSession || !newDate) return;
    updateDateMutation.mutate({
      sessionId: editSession.id,
      sessionDate: newDate,
    });
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

  function clearFilters() {
    setProgramFilter("");
    setTurmaFilter("");
    setConsultorFilter("");
    setSearchTerm("");
    setPage(1);
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Mentorias</h1>
          <p className="text-muted-foreground mt-1">
            Pesquise e ajuste a data das sessões de mentoria já lançadas no sistema, ou exclua registros incorretos.
          </p>
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
                        <TableHead>Trilha</TableHead>
                        <TableHead className="text-center">Sessão</TableHead>
                        <TableHead className="text-center">Data</TableHead>
                        <TableHead className="text-center">Presença</TableHead>
                        <TableHead className="text-center w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSessions.map((session: any) => (
                        <TableRow key={session.id}>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {session.id}
                          </TableCell>
                          <TableCell className="font-medium text-sm max-w-[200px] truncate">
                            {session.alunoNome}
                          </TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate">
                            {session.consultorNome || "—"}
                          </TableCell>
                          <TableCell className="text-xs max-w-[180px] truncate">
                            {session.turmaNome || "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {session.trilhaNome || "—"}
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
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditDate(session)}
                                className="h-7 w-7 p-0"
                                title="Editar data da sessão"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(session)}
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
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
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

        {/* Edit Date Dialog */}
        <Dialog open={!!editSession} onOpenChange={(open) => { if (!open) { setEditSession(null); setNewDate(""); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Editar Data da Sessão
              </DialogTitle>
              <DialogDescription>
                Altere a data da sessão de mentoria selecionada.
              </DialogDescription>
            </DialogHeader>

            {editSession && (
              <div className="space-y-4 py-2">
                {/* Session info */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Aluno:</span>
                    <span className="font-medium">{editSession.alunoNome}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sessão:</span>
                    <span className="font-medium">#{editSession.sessionNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Data atual:</span>
                    <span className="font-medium">{formatDateSafe(editSession.sessionDate)}</span>
                  </div>
                  {editSession.consultorNome && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mentor:</span>
                      <span className="font-medium">{editSession.consultorNome}</span>
                    </div>
                  )}
                </div>

                {/* New date input */}
                <div className="space-y-1.5">
                  <Label htmlFor="newDate">Nova data</Label>
                  <Input
                    id="newDate"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditSession(null); setNewDate(""); }}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveDate}
                disabled={!newDate || updateDateMutation.isPending}
              >
                {updateDateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
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
                  {deleteSession.consultorNome && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mentor:</span>
                      <span className="font-medium">{deleteSession.consultorNome}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Presença:</span>
                    <span className="font-medium">{deleteSession.presence === "presente" ? "Presente" : "Ausente"}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Tem certeza que deseja excluir esta sessão?
                </p>
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
      </div>
    </DashboardLayout>
  );
}
