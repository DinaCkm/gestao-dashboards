import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Zap,
  Plus,
  Search,
  Pencil,
  Calendar,
  MapPin,
  Users,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  Monitor,
  Building2,
} from "lucide-react";

type ActivityItem = {
  id: number;
  titulo: string;
  descricao: string | null;
  tipo: string;
  modalidade: string;
  dataInicio: string | null;
  dataFim: string | null;
  local: string | null;
  vagas: number | null;
  instrutor: string | null;
  imagemUrl: string | null;
  competenciaRelacionada: string | null;
  programId: number | null;
  isActive: number;
  ordem: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
};

type FormData = {
  titulo: string;
  descricao: string;
  tipo: string;
  modalidade: string;
  dataInicio: string;
  dataFim: string;
  local: string;
  vagas: string;
  instrutor: string;
  imagemUrl: string;
  competenciaRelacionada: string;
};

const emptyForm: FormData = {
  titulo: "",
  descricao: "",
  tipo: "workshop",
  modalidade: "presencial",
  dataInicio: "",
  dataFim: "",
  local: "",
  vagas: "",
  instrutor: "",
  imagemUrl: "",
  competenciaRelacionada: "",
};

const tipoLabels: Record<string, string> = {
  workshop: "Workshop",
  treinamento: "Treinamento",
  palestra: "Palestra",
  evento: "Evento",
  outro: "Outro",
};

const modalidadeLabels: Record<string, string> = {
  presencial: "Presencial",
  online: "Online",
  hibrido: "Híbrido",
};

const tipoBadgeColors: Record<string, string> = {
  workshop: "bg-blue-100 text-blue-800",
  treinamento: "bg-green-100 text-green-800",
  palestra: "bg-purple-100 text-purple-800",
  evento: "bg-orange-100 text-orange-800",
  outro: "bg-gray-100 text-gray-800",
};

const modalidadeIcons: Record<string, React.ReactNode> = {
  presencial: <Building2 className="h-3.5 w-3.5" />,
  online: <Monitor className="h-3.5 w-3.5" />,
  hibrido: <><Building2 className="h-3 w-3" /><Monitor className="h-3 w-3" /></>,
};

export default function AtividadesExtrasAdmin() {
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showInactive, setShowInactive] = useState(false);
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: activitiesData, isLoading } = trpc.activities.list.useQuery();
  const { data: competenciasData } = trpc.competencias.listWithTrilha.useQuery();

  const createMutation = trpc.activities.create.useMutation({
    onSuccess: () => {
      toast.success("Atividade criada com sucesso!");
      utils.activities.list.invalidate();
      handleCloseDialog();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.activities.update.useMutation({
    onSuccess: () => {
      toast.success("Atividade atualizada com sucesso!");
      utils.activities.list.invalidate();
      handleCloseDialog();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.activities.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      utils.activities.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingActivity(null);
    setForm(emptyForm);
  };

  const handleOpenCreate = () => {
    setEditingActivity(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const handleOpenEdit = (activity: ActivityItem) => {
    setEditingActivity(activity);
    setForm({
      titulo: activity.titulo,
      descricao: activity.descricao || "",
      tipo: activity.tipo,
      modalidade: activity.modalidade,
      dataInicio: activity.dataInicio ? new Date(activity.dataInicio).toISOString().slice(0, 16) : "",
      dataFim: activity.dataFim ? new Date(activity.dataFim).toISOString().slice(0, 16) : "",
      local: activity.local || "",
      vagas: activity.vagas ? String(activity.vagas) : "",
      instrutor: activity.instrutor || "",
      imagemUrl: activity.imagemUrl || "",
      competenciaRelacionada: activity.competenciaRelacionada || "",
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!form.titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || undefined,
      tipo: form.tipo as any,
      modalidade: form.modalidade as any,
      dataInicio: form.dataInicio || undefined,
      dataFim: form.dataFim || undefined,
      local: form.local.trim() || undefined,
      vagas: form.vagas ? parseInt(form.vagas) : undefined,
      instrutor: form.instrutor.trim() || undefined,
      imagemUrl: form.imagemUrl.trim() || undefined,
      competenciaRelacionada: form.competenciaRelacionada || undefined,
    };

    if (editingActivity) {
      updateMutation.mutate({ id: editingActivity.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const allCompetencias = useMemo(() => {
    if (!competenciasData) return [];
    return (competenciasData as any[]).map((c: any) => c.nome).sort();
  }, [competenciasData]);

  const filteredActivities = useMemo(() => {
    if (!activitiesData) return [];
    return (activitiesData as ActivityItem[]).filter((a) => {
      if (!showInactive && a.isActive === 0) return false;
      if (filterTipo !== "all" && a.tipo !== filterTipo) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          a.titulo.toLowerCase().includes(s) ||
          (a.descricao && a.descricao.toLowerCase().includes(s)) ||
          (a.instrutor && a.instrutor.toLowerCase().includes(s)) ||
          (a.local && a.local.toLowerCase().includes(s))
        );
      }
      return true;
    });
  }, [activitiesData, search, showInactive, filterTipo]);

  const stats = useMemo(() => {
    if (!activitiesData) return { total: 0, ativas: 0, proximas: 0 };
    const all = activitiesData as ActivityItem[];
    const now = new Date();
    return {
      total: all.length,
      ativas: all.filter((a) => a.isActive === 1).length,
      proximas: all.filter((a) => a.isActive === 1 && a.dataInicio && new Date(a.dataInicio) > now).length,
    };
  }, [activitiesData]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-7 w-7 text-primary" />
            Atividades Extras
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie workshops, treinamentos presenciais, palestras e eventos
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Atividade
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de Atividades</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.ativas}</p>
                <p className="text-sm text-muted-foreground">Atividades Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.proximas}</p>
                <p className="text-sm text-muted-foreground">Próximas Atividades</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, instrutor ou local..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="treinamento">Treinamento</SelectItem>
                <SelectItem value="palestra">Palestra</SelectItem>
                <SelectItem value="evento">Evento</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch checked={showInactive} onCheckedChange={setShowInactive} />
              <Label className="text-sm whitespace-nowrap">Mostrar inativas</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhuma atividade encontrada</p>
            <Button variant="outline" className="mt-4" onClick={handleOpenCreate}>
              Criar primeira atividade
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity) => {
            const isExpanded = expandedId === activity.id;
            const isPast = activity.dataInicio && new Date(activity.dataInicio) < new Date();
            return (
              <Card key={activity.id} className={`transition-all ${activity.isActive === 0 ? "opacity-60" : ""}`}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-3">
                    {/* Main row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-lg">{activity.titulo}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoBadgeColors[activity.tipo] || "bg-gray-100 text-gray-800"}`}>
                            {tipoLabels[activity.tipo] || activity.tipo}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1">
                            {modalidadeIcons[activity.modalidade]}
                            {modalidadeLabels[activity.modalidade] || activity.modalidade}
                          </span>
                          {isPast && <Badge variant="secondary" className="text-xs">Encerrada</Badge>}
                          {activity.isActive === 0 && <Badge variant="destructive" className="text-xs">Inativa</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                          {activity.dataInicio && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(activity.dataInicio)}
                            </span>
                          )}
                          {activity.local && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {activity.local}
                            </span>
                          )}
                          {activity.instrutor && (
                            <span className="flex items-center gap-1">
                              <UserCheck className="h-3.5 w-3.5" />
                              {activity.instrutor}
                            </span>
                          )}
                          {activity.vagas && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {activity.vagas} vagas
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={activity.isActive === 1}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ id: activity.id, isActive: checked ? 1 : 0 })
                          }
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(activity)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setExpandedId(isExpanded ? null : activity.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t pt-3 mt-1 space-y-2">
                        {activity.descricao && (
                          <p className="text-sm text-muted-foreground">{activity.descricao}</p>
                        )}
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          {activity.dataFim && (
                            <div>
                              <span className="text-muted-foreground">Término:</span>{" "}
                              <span className="font-medium">{formatDate(activity.dataFim)}</span>
                            </div>
                          )}
                          {activity.competenciaRelacionada && (
                            <div>
                              <span className="text-muted-foreground">Competência:</span>{" "}
                              <Badge variant="outline" className="text-xs">{activity.competenciaRelacionada}</Badge>
                            </div>
                          )}
                        </div>
                        <RegistrationsList activityId={activity.id} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingActivity ? "Editar Atividade" : "Nova Atividade"}</DialogTitle>
            <DialogDescription>
              {editingActivity ? "Atualize os dados da atividade" : "Preencha os dados para criar uma nova atividade"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                placeholder="Ex: Workshop de Liderança Transformadora"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Descreva a atividade, objetivos e público-alvo..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="treinamento">Treinamento</SelectItem>
                    <SelectItem value="palestra">Palestra</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modalidade</Label>
                <Select value={form.modalidade} onValueChange={(v) => setForm((f) => ({ ...f, modalidade: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data/Hora Início</Label>
                <Input
                  type="datetime-local"
                  value={form.dataInicio}
                  onChange={(e) => setForm((f) => ({ ...f, dataInicio: e.target.value }))}
                />
              </div>
              <div>
                <Label>Data/Hora Fim</Label>
                <Input
                  type="datetime-local"
                  value={form.dataFim}
                  onChange={(e) => setForm((f) => ({ ...f, dataFim: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Local / Link</Label>
                <Input
                  value={form.local}
                  onChange={(e) => setForm((f) => ({ ...f, local: e.target.value }))}
                  placeholder="Endereço ou link da sala virtual"
                />
              </div>
              <div>
                <Label>Vagas</Label>
                <Input
                  type="number"
                  value={form.vagas}
                  onChange={(e) => setForm((f) => ({ ...f, vagas: e.target.value }))}
                  placeholder="Deixe vazio para ilimitado"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Instrutor / Facilitador</Label>
                <Input
                  value={form.instrutor}
                  onChange={(e) => setForm((f) => ({ ...f, instrutor: e.target.value }))}
                  placeholder="Nome do instrutor"
                />
              </div>
              <div>
                <Label>Competência Relacionada</Label>
                <Select
                  value={form.competenciaRelacionada}
                  onValueChange={(v) => setForm((f) => ({ ...f, competenciaRelacionada: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhuma">Nenhuma</SelectItem>
                    {allCompetencias.map((c: string) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>URL da Imagem de Capa</Label>
              <Input
                value={form.imagemUrl}
                onChange={(e) => setForm((f) => ({ ...f, imagemUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Salvando..."
                : editingActivity
                ? "Salvar Alterações"
                : "Criar Atividade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}

// Sub-component: Lista de inscritos em uma atividade
function RegistrationsList({ activityId }: { activityId: number }) {
  const { data: registrations, isLoading } = trpc.activities.listRegistrations.useQuery({ activityId });
  const utils = trpc.useUtils();

  const updateStatusMutation = trpc.activities.updateRegistrationStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      utils.activities.listRegistrations.invalidate({ activityId });
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando inscritos...</div>;

  const regs = (registrations || []) as any[];

  if (regs.length === 0) {
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-1">
        <Users className="h-3.5 w-3.5" />
        Nenhum inscrito ainda
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    inscrito: "bg-blue-100 text-blue-800",
    confirmado: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800",
    presente: "bg-emerald-100 text-emerald-800",
    ausente: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium flex items-center gap-1">
        <Users className="h-4 w-4" />
        {regs.length} inscrito{regs.length !== 1 ? "s" : ""}
      </p>
      <div className="space-y-1">
        {regs.map((reg: any) => (
          <div key={reg.id} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-2">
            <div className="flex items-center gap-2">
              <span>Usuário #{reg.userId}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[reg.status] || "bg-gray-100"}`}>
                {reg.status}
              </span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => updateStatusMutation.mutate({ registrationId: reg.id, status: "confirmado" })}
                disabled={reg.status === "confirmado"}
              >
                <UserCheck className="h-3 w-3 mr-1" />
                Confirmar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive"
                onClick={() => updateStatusMutation.mutate({ registrationId: reg.id, status: "cancelado" })}
                disabled={reg.status === "cancelado"}
              >
                <UserX className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
