import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, Users, Video, Filter, Search, CalendarDays, UserCheck, XCircle, CheckCircle2, AlertCircle, RefreshCw, Pencil } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  agendado: { label: "Agendado", variant: "default", icon: <CalendarDays className="w-3 h-3" /> },
  confirmado: { label: "Confirmado", variant: "secondary", icon: <CheckCircle2 className="w-3 h-3" /> },
  realizado: { label: "Realizado", variant: "outline", icon: <UserCheck className="w-3 h-3" /> },
  cancelado: { label: "Cancelado", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
};

const typeConfig: Record<string, { label: string; color: string }> = {
  individual: { label: "Individual", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  grupo: { label: "Grupo", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export default function AdminAgendamentos() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [mentorFilter, setMentorFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [editingAppt, setEditingAppt] = useState<{ id: number; scheduledDate: string; startTime: string; endTime: string; googleMeetLink: string } | null>(null);

  const updateMutation = trpc.mentor.updateAppointment.useMutation();

  const handleUpdate = async () => {
    if (!editingAppt) return;
    try {
      await updateMutation.mutateAsync({
        appointmentId: editingAppt.id,
        scheduledDate: editingAppt.scheduledDate,
        startTime: editingAppt.startTime,
        endTime: editingAppt.endTime,
        googleMeetLink: editingAppt.googleMeetLink || undefined,
      });
      toast.success('Agendamento reagendado com sucesso! Os participantes serão notificados por email.');
      setEditingAppt(null);
      refetch();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao reagendar');
    }
  };

  const filters = useMemo(() => {
    const f: any = {};
    if (statusFilter && statusFilter !== "all") f.status = statusFilter;
    if (typeFilter && typeFilter !== "all") f.type = typeFilter;
    if (mentorFilter && mentorFilter !== "all") f.consultorId = Number(mentorFilter);
    if (dateFrom) f.dateFrom = dateFrom;
    if (dateTo) f.dateTo = dateTo;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [statusFilter, typeFilter, mentorFilter, dateFrom, dateTo]);

  const { data: appointments, isLoading, isError, refetch } = trpc.admin.allAppointments.useQuery(filters);
  const { data: mentores } = trpc.admin.listMentoresAtivos.useQuery();

  // Filtro local por busca de texto (nome do aluno ou mentor)
  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    if (!searchTerm.trim()) return appointments;
    const term = searchTerm.toLowerCase();
    return appointments.filter((a: any) =>
      a.mentorName?.toLowerCase().includes(term) ||
      a.participants?.some((p: any) => p.alunoName?.toLowerCase().includes(term)) ||
      a.title?.toLowerCase().includes(term)
    );
  }, [appointments, searchTerm]);

  // Métricas resumo
  const metrics = useMemo(() => {
    if (!appointments) return { total: 0, agendados: 0, confirmados: 0, realizados: 0, cancelados: 0 };
    return {
      total: appointments.length,
      agendados: appointments.filter((a: any) => a.status === "agendado").length,
      confirmados: appointments.filter((a: any) => a.status === "confirmado").length,
      realizados: appointments.filter((a: any) => a.status === "realizado").length,
      cancelados: appointments.filter((a: any) => a.status === "cancelado").length,
    };
  }, [appointments]);

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setMentorFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
  };

  if (isError) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-8">
            <AlertCircle className="w-6 h-6 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Erro ao carregar agendamentos</p>
              <p className="text-sm text-muted-foreground">Tente novamente em alguns instantes.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
              <RefreshCw className="w-4 h-4 mr-1" /> Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel de Agendamentos</h1>
          <p className="text-muted-foreground">Visualize todos os agendamentos realizados na plataforma</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold mt-1">{metrics.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground font-medium">Agendados</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-blue-600">{metrics.agendados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground font-medium">Confirmados</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600">{metrics.confirmados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground font-medium">Realizados</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{metrics.realizados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground font-medium">Cancelados</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{metrics.cancelados}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Busca por texto */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por aluno, mentor ou título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="agendado">Agendado</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="realizado">Realizado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            {/* Tipo */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="grupo">Grupo</SelectItem>
              </SelectContent>
            </Select>

            {/* Mentor */}
            <Select value={mentorFilter} onValueChange={setMentorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Mentor(a)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os mentores</SelectItem>
                {mentores?.map((m: any) => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Limpar filtros */}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
              Limpar filtros
            </Button>
          </div>

          {/* Filtros de data */}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Período:</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
              placeholder="De"
            />
            <span className="text-sm text-muted-foreground">até</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
              placeholder="Até"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de agendamentos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Agendamentos ({filteredAppointments.length})
          </CardTitle>
          <CardDescription>
            Lista completa de todos os agendamentos da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Carregando agendamentos...</span>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Nenhum agendamento encontrado</p>
              <p className="text-sm">Ajuste os filtros ou aguarde novos agendamentos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead className="w-[100px]">Horário</TableHead>
                    <TableHead>Mentor(a)</TableHead>
                    <TableHead>Aluno(s)</TableHead>
                    <TableHead className="w-[100px]">Tipo</TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                    <TableHead>Título / Observações</TableHead>
                    <TableHead className="w-[80px]">Sala</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appt: any) => {
                    const sc = statusConfig[appt.status] || statusConfig.agendado;
                    const tc = typeConfig[appt.type] || typeConfig.individual;
                    return (
                      <TableRow key={appt.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {formatDate(appt.scheduledDate)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {appt.startTime} - {appt.endTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{appt.mentorName}</p>
                            {appt.mentorEspecialidade && (
                              <p className="text-xs text-muted-foreground">{appt.mentorEspecialidade}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {appt.participants?.map((p: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <Users className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm">{p.alunoName}</span>
                                {p.status === "confirmado" && (
                                  <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                                )}
                                {p.status === "recusado" && (
                                  <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                                )}
                              </div>
                            ))}
                            {(!appt.participants || appt.participants.length === 0) && (
                              <span className="text-xs text-muted-foreground">Sem participantes</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tc.color}`}>
                            {tc.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sc.variant} className="gap-1">
                            {sc.icon}
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            {appt.title && (
                              <p className="text-sm font-medium truncate">{appt.title}</p>
                            )}
                            {appt.description && (
                              <p className="text-xs text-muted-foreground truncate">{appt.description}</p>
                            )}
                            {appt.participants?.some((p: any) => p.notes) && (
                              <p className="text-xs text-muted-foreground truncate italic">
                                {appt.participants.find((p: any) => p.notes)?.notes}
                              </p>
                            )}
                            {!appt.title && !appt.description && !appt.participants?.some((p: any) => p.notes) && (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {appt.googleMeetLink ? (
                            <a
                              href={appt.googleMeetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <Video className="w-3 h-3" />
                              Meet
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {appt.status !== 'cancelado' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              onClick={() => setEditingAppt({
                                id: appt.id,
                                scheduledDate: appt.scheduledDate,
                                startTime: appt.startTime,
                                endTime: appt.endTime,
                                googleMeetLink: appt.googleMeetLink || '',
                              })}
                            >
                              <Pencil className="w-3 h-3 mr-1" />
                              Reagendar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Dialog de Reagendamento (Admin - sem restrição de data) */}
      <Dialog open={!!editingAppt} onOpenChange={(open) => { if (!open) setEditingAppt(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-600" />
              Reagendar Sessão (Admin)
            </DialogTitle>
            <DialogDescription>
              Como administrador, você pode alterar para qualquer data, inclusive retroativa. Os participantes serão notificados por email.
            </DialogDescription>
          </DialogHeader>
          {editingAppt && (
            <div className="space-y-4 py-2">
              <div>
                <Label>Nova Data</Label>
                <Input
                  type="date"
                  value={editingAppt.scheduledDate}
                  onChange={e => setEditingAppt(prev => prev ? { ...prev, scheduledDate: e.target.value } : null)}
                />
                <p className="text-xs text-muted-foreground mt-1">Admin: sem restrição de data (pode ser retroativa ou futura).</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Horário Início</Label>
                  <Input
                    type="time"
                    value={editingAppt.startTime}
                    onChange={e => setEditingAppt(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label>Horário Fim</Label>
                  <Input
                    type="time"
                    value={editingAppt.endTime}
                    onChange={e => setEditingAppt(prev => prev ? { ...prev, endTime: e.target.value } : null)}
                  />
                </div>
              </div>
              <div>
                <Label>Link do Google Meet</Label>
                <Input
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={editingAppt.googleMeetLink}
                  onChange={e => setEditingAppt(prev => prev ? { ...prev, googleMeetLink: e.target.value } : null)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAppt(null)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="bg-[#1E3A5F] hover:bg-[#2a4f7f]">
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
