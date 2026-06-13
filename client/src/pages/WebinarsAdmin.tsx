import { useState, useMemo } from "react";
import { formatDateTimeBrazil, utcToLocalDatetimeInput, localDatetimeInputToUTC } from "@/lib/dateUtils";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectContentNoPortal,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Video,
  Calendar,
  Clock,
  Users,
  Upload,
  Send,
  ExternalLink,
  Search,
  Filter,
  Image as ImageIcon,
  Link2,
  Youtube,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import WebinarChecklistModal from "@/components/WebinarChecklistModal";

type WebinarStatus = "draft" | "published" | "completed" | "cancelled";
type TargetAudience = "all" | "sebrae_to" | "sebrae_acre" | "embrapii" | "banrisul";
type ResponsibleRole = "organizacao" | "marketing" | "administrativo" | "coordenacao" | "palestrante" | "solicitante";

const STATUS_LABELS: Record<WebinarStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<WebinarStatus, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  published: "bg-green-100 text-green-700 border-green-300",
  completed: "bg-blue-100 text-blue-700 border-blue-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
};

const AUDIENCE_LABELS: Record<TargetAudience, string> = {
  all: "Todos os Programas",
  sebrae_to: "SEBRAE Tocantins",
  sebrae_acre: "SEBRAE Acre",
  embrapii: "EMBRAPII",
  banrisul: "BANRISUL",
};

const RESPONSIBLE_ROLES: { value: ResponsibleRole; label: string; description: string }[] = [
  { value: "coordenacao", label: "Coordenadora/Organizadora", description: "Responsável pela coordenação geral do evento" },
  { value: "marketing", label: "Marketing", description: "Responsável pela divulgação e materiais visuais" },
  { value: "administrativo", label: "Administrativo/Financeiro", description: "Responsável por contratos e pagamentos" },
  { value: "palestrante", label: "Palestrante/Professor", description: "Responsável pela apresentação e conteúdo" },
  { value: "solicitante", label: "Solicitante/Aprovador", description: "Quem solicitou e aprova o evento" },
  { value: "organizacao", label: "Organização", description: "Equipe de organização do evento" },
];

interface WebinarForm {
  title: string;
  description: string;
  theme: string;
  speaker: string;
  speakerBio: string;
  eventDate: string;
  startDate: string;
  endDate: string;
  duration: number;
  meetingLink: string;
  youtubeLink: string;
  targetAudience: TargetAudience;
  status: WebinarStatus;
}

interface ResponsibleForm {
  role: ResponsibleRole;
  name: string;
  email: string;
  phone: string;
}

const emptyForm: WebinarForm = {
  title: "",
  description: "",
  theme: "",
  speaker: "",
  speakerBio: "",
  eventDate: "",
  startDate: "",
  endDate: "",
  duration: 60,
  meetingLink: "",
  youtubeLink: "",
  targetAudience: "all",
  status: "draft",
};

const emptyResponsibles: ResponsibleForm[] = RESPONSIBLE_ROLES.map((r) => ({
  role: r.value,
  name: "",
  email: "",
  phone: "",
}));

// Componente para o badge de resumo do checklist
function ChecklistSummaryBadge({ webinarId }: { webinarId: number }) {
  const { data: summary } = trpc.webinarTasks.getSummaryByWebinar.useQuery({ webinarId });
  if (!summary) return null;

  const riskColor =
    summary.riskLevel === "Alto"
      ? "bg-red-100 text-red-700 border-red-300"
      : summary.riskLevel === "Médio"
      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
      : "bg-green-100 text-green-700 border-green-300";

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Badge variant="outline" className="text-xs bg-gray-50">
        <ClipboardList className="h-3 w-3 mr-1" />
        {summary.completed}/{summary.total}
      </Badge>
      {summary.overdue > 0 && (
        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {summary.overdue} atrasada{summary.overdue > 1 ? "s" : ""}
        </Badge>
      )}
      <Badge variant="outline" className={`text-xs ${riskColor}`}>
        Risco: {summary.riskLevel}
      </Badge>
    </div>
  );
}

export default function WebinarsAdmin() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWebinar, setEditingWebinar] = useState<any | null>(null);
  const [form, setForm] = useState<WebinarForm>(emptyForm);
  const [responsibles, setResponsibles] = useState<ResponsibleForm[]>(emptyResponsibles);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [reminderDialogWebinarId, setReminderDialogWebinarId] = useState<number | null>(null);
  const [reminderRecipients, setReminderRecipients] = useState<string[]>(['alunos', 'gerentes', 'mentores']);
  const [checklistWebinar, setChecklistWebinar] = useState<{ id: number; title: string } | null>(null);
  const [showResponsiblesSection, setShowResponsiblesSection] = useState(false);

  const { data: webinars, isLoading, refetch } = trpc.webinars.list.useQuery(
    { status: statusFilter === "all" ? undefined : statusFilter }
  );

  const createMutation = trpc.webinars.create.useMutation({
    onSuccess: async (data) => {
      toast.success("Webinar criado com sucesso!");
      // Salvar responsáveis se algum foi preenchido
      const filledResponsibles = responsibles.filter((r) => r.name.trim() || r.email.trim());
      if (filledResponsibles.length > 0 && data.id) {
        try {
          await upsertResponsiblesMutation.mutateAsync({
            webinarId: data.id,
            responsibles: filledResponsibles,
          });
        } catch (e) {
          console.warn("Erro ao salvar responsáveis:", e);
        }
      }
      setShowCreateDialog(false);
      setForm(emptyForm);
      setResponsibles(emptyResponsibles);
      refetch();
    },
    onError: (err) => toast.error(`Erro ao criar: ${err.message}`),
  });

  const updateMutation = trpc.webinars.update.useMutation({
    onSuccess: async () => {
      toast.success("Webinar atualizado com sucesso!");
      // Salvar responsáveis se algum foi preenchido
      if (editingWebinar) {
        const filledResponsibles = responsibles.filter((r) => r.name.trim() || r.email.trim());
        if (filledResponsibles.length > 0) {
          try {
            await upsertResponsiblesMutation.mutateAsync({
              webinarId: editingWebinar.id,
              responsibles: filledResponsibles,
            });
          } catch (e) {
            console.warn("Erro ao salvar responsáveis:", e);
          }
        }
      }
      setEditingWebinar(null);
      setForm(emptyForm);
      setResponsibles(emptyResponsibles);
      refetch();
    },
    onError: (err) => toast.error(`Erro ao atualizar: ${err.message}`),
  });

  const deleteMutation = trpc.webinars.delete.useMutation({
    onSuccess: () => {
      toast.success("Webinar excluído!");
      setDeleteConfirm(null);
      refetch();
    },
    onError: (err) => toast.error(`Erro ao excluir: ${err.message}`),
  });

  const uploadCardMutation = trpc.webinars.uploadCard.useMutation({
    onSuccess: () => {
      toast.success("Cartão de divulgação enviado!");
      setCardFile(null);
      refetch();
    },
    onError: (err) => toast.error(`Erro ao enviar cartão: ${err.message}`),
  });

  const reminderMutation = trpc.webinars.sendReminder.useMutation({
    onSuccess: (data) => {
      const parts: string[] = [];
      if (data.groupCounts) {
        Object.entries(data.groupCounts).forEach(([group, count]) => {
          parts.push(`${count} ${group}`);
        });
      }
      const details: string[] = [];
      if (data.emailsSent > 0) details.push(`${data.emailsSent} emails enviados`);
      if (data.emailsFailed > 0) details.push(`${data.emailsFailed} emails falharam`);
      if (data.notificationsCreated > 0) details.push(`${data.notificationsCreated} notificações in-app`);
      toast.success(`Lembrete enviado para ${parts.join(', ')}! ${details.join(', ')}.`);
      setReminderDialogWebinarId(null);
      refetch();
    },
    onError: (err) => toast.error(`Erro ao enviar lembrete: ${err.message}`),
  });

  const upsertResponsiblesMutation = trpc.webinarTasks.upsertResponsibles.useMutation({
    onError: (err) => console.warn("Erro ao salvar responsáveis:", err.message),
  });

  const toggleRecipient = (group: string) => {
    setReminderRecipients(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const handleSendReminder = () => {
    if (!reminderDialogWebinarId || reminderRecipients.length === 0) {
      toast.error('Selecione pelo menos um grupo de destinatários');
      return;
    }
    reminderMutation.mutate({
      webinarId: reminderDialogWebinarId,
      recipients: reminderRecipients as any,
    });
  };

  const filteredWebinars = useMemo(() => {
    if (!webinars) return [];
    if (!searchTerm) return webinars;
    const term = searchTerm.toLowerCase();
    return webinars.filter(
      (w: any) =>
        w.title?.toLowerCase().includes(term) ||
        w.speaker?.toLowerCase().includes(term) ||
        w.theme?.toLowerCase().includes(term)
    );
  }, [webinars, searchTerm]);

  const handleCreate = () => {
    setForm(emptyForm);
    setResponsibles(emptyResponsibles);
    setShowResponsiblesSection(false);
    setShowCreateDialog(true);
  };

  const handleEdit = async (webinar: any) => {
    setForm({
      title: webinar.title || "",
      description: webinar.description || "",
      theme: webinar.theme || "",
      speaker: webinar.speaker || "",
      speakerBio: webinar.speakerBio || "",
      eventDate: utcToLocalDatetimeInput(webinar.eventDate),
      startDate: utcToLocalDatetimeInput(webinar.startDate),
      endDate: utcToLocalDatetimeInput(webinar.endDate),
      duration: webinar.duration || 60,
      meetingLink: webinar.meetingLink || "",
      youtubeLink: webinar.youtubeLink || "",
      targetAudience: (webinar.targetAudience as TargetAudience) || "all",
      status: (webinar.status as WebinarStatus) || "draft",
    });
    setResponsibles(emptyResponsibles);
    setShowResponsiblesSection(false);
    setEditingWebinar(webinar);
  };

  const handleSubmitCreate = () => {
    if (!form.title || (!form.startDate && !form.eventDate)) {
      toast.error("Preencha título e data de início");
      return;
    }
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      theme: form.theme || undefined,
      speaker: form.speaker || undefined,
      speakerBio: form.speakerBio || undefined,
      eventDate: localDatetimeInputToUTC(form.eventDate),
      startDate: form.startDate ? localDatetimeInputToUTC(form.startDate) : undefined,
      endDate: form.endDate ? localDatetimeInputToUTC(form.endDate) : undefined,
      duration: form.duration || undefined,
      meetingLink: form.meetingLink || undefined,
      youtubeLink: form.youtubeLink || undefined,
      targetAudience: form.targetAudience,
      status: form.status,
    });
  };

  const handleSubmitEdit = () => {
    if (!editingWebinar) return;
    updateMutation.mutate({
      id: editingWebinar.id,
      title: form.title || undefined,
      description: form.description || undefined,
      theme: form.theme || undefined,
      speaker: form.speaker || undefined,
      speakerBio: form.speakerBio || undefined,
      eventDate: form.eventDate ? localDatetimeInputToUTC(form.eventDate) : undefined,
      startDate: form.startDate ? localDatetimeInputToUTC(form.startDate) : undefined,
      endDate: form.endDate ? localDatetimeInputToUTC(form.endDate) : undefined,
      duration: form.duration || undefined,
      meetingLink: form.meetingLink || undefined,
      youtubeLink: form.youtubeLink || undefined,
      targetAudience: form.targetAudience,
      status: form.status,
    });
  };

  const handleUploadCard = async (webinarId: number) => {
    if (!cardFile) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadCardMutation.mutate({
        webinarId,
        fileBase64: base64,
        fileName: cardFile.name,
        mimeType: cardFile.type,
      });
    };
    reader.readAsDataURL(cardFile);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return formatDateTimeBrazil(dateStr);
  };

  const stats = useMemo(() => {
    if (!webinars) return { total: 0, published: 0, completed: 0, upcoming: 0 };
    const now = new Date();
    return {
      total: webinars.length,
      published: webinars.filter((w: any) => w.status === "published").length,
      completed: webinars.filter((w: any) => w.status === "completed").length,
      upcoming: webinars.filter(
        (w: any) => w.status === "published" && new Date(w.eventDate) > now
      ).length,
    };
  }, [webinars]);

  // Seção de responsáveis internos (reutilizada em criar e editar)
  const responsiblesSection = (
    <div className="border rounded-lg p-4 space-y-3 mt-2">
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-primary" />
        <Label className="text-sm font-semibold">Responsáveis Internos</Label>
        <span className="text-xs text-muted-foreground">(opcional — para o checklist de produção)</span>
      </div>
      <div className="space-y-3">
        {RESPONSIBLE_ROLES.map((roleInfo, idx) => {
          const resp = responsibles.find((r) => r.role === roleInfo.value);
          const respIdx = responsibles.findIndex((r) => r.role === roleInfo.value);
          return (
            <div key={roleInfo.value} className="grid grid-cols-[1fr_1fr] gap-2 items-start">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">{roleInfo.label}</Label>
                <Input
                  value={resp?.name || ""}
                  onChange={(e) =>
                    setResponsibles((prev) =>
                      prev.map((r, i) => (i === respIdx ? { ...r, name: e.target.value } : r))
                    )
                  }
                  placeholder="Nome"
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground invisible">Email</Label>
                <Input
                  value={resp?.email || ""}
                  onChange={(e) =>
                    setResponsibles((prev) =>
                      prev.map((r, i) => (i === respIdx ? { ...r, email: e.target.value } : r))
                    )
                  }
                  placeholder="Email"
                  type="email"
                  className="h-8 text-sm mt-1"
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Os responsáveis serão vinculados automaticamente às tarefas do checklist de produção.
      </p>
    </div>
  );

  // webinarFormFields is a JSX variable (not a component function) to prevent
  // React from remounting the DOM on every re-render, which was causing input focus loss.
  const webinarFormFields = (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Ex: 2026/05 - Liderança com João Silva"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="startDate">Data/Hora Início *</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => {
              const startDate = e.target.value;
              setForm((prev) => ({
                ...prev,
                startDate,
                eventDate: startDate || prev.eventDate,
              }));
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endDate">Data/Hora Término *</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
          />
          <p className="text-[10px] text-amber-600">A presença só será liberada após este horário</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="eventDate">Data de Referência</Label>
          <Input
            id="eventDate"
            type="datetime-local"
            value={form.eventDate}
            onChange={(e) => setForm((prev) => ({ ...prev, eventDate: e.target.value }))}
          />
          <p className="text-[10px] text-gray-400">Preenchido automaticamente com a data de início</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="duration">Duração (min)</Label>
          <Input
            id="duration"
            type="number"
            value={form.duration}
            onChange={(e) => setForm((prev) => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="speaker">Palestrante</Label>
          <Input
            id="speaker"
            value={form.speaker}
            onChange={(e) => setForm((prev) => ({ ...prev, speaker: e.target.value }))}
            placeholder="Nome do palestrante"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="theme">Tema</Label>
          <Input
            id="theme"
            value={form.theme}
            onChange={(e) => setForm((prev) => ({ ...prev, theme: e.target.value }))}
            placeholder="Ex: Liderança, IA, Gestão"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Descrição do webinar..."
          rows={3}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="speakerBio">Bio do Palestrante</Label>
        <Textarea
          id="speakerBio"
          value={form.speakerBio}
          onChange={(e) => setForm((prev) => ({ ...prev, speakerBio: e.target.value }))}
          placeholder="Breve biografia do palestrante..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="meetingLink">Link da Reunião (Zoom/Meet)</Label>
          <Input
            id="meetingLink"
            value={form.meetingLink}
            onChange={(e) => setForm((prev) => ({ ...prev, meetingLink: e.target.value }))}
            placeholder="https://zoom.us/j/..."
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="youtubeLink">Link do YouTube (gravação)</Label>
          <Input
            id="youtubeLink"
            value={form.youtubeLink}
            onChange={(e) => setForm((prev) => ({ ...prev, youtubeLink: e.target.value }))}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Público-alvo</Label>
          <Select
            value={form.targetAudience}
            onValueChange={(v) => setForm((prev) => ({ ...prev, targetAudience: v as TargetAudience }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContentNoPortal>
              {Object.entries(AUDIENCE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContentNoPortal>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as WebinarStatus }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContentNoPortal>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContentNoPortal>
          </Select>
        </div>
      </div>

      {/* Toggle responsáveis */}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          onClick={() => setShowResponsiblesSection((prev) => !prev)}
        >
          <UserCheck className="h-3.5 w-3.5" />
          {showResponsiblesSection ? "Ocultar responsáveis internos" : "Definir responsáveis internos"}
        </Button>
        {showResponsiblesSection && responsiblesSection}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Webinars</h1>
          <p className="text-muted-foreground">
            Cadastre, edite e gerencie webinars e eventos online
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Webinar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Video className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
                <p className="text-xs text-muted-foreground">Próximos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.published}</p>
                <p className="text-xs text-muted-foreground">Publicados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, palestrante ou tema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Webinar List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
      ) : filteredWebinars.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhum webinar encontrado para esta busca" : "Nenhum webinar cadastrado ainda"}
            </p>
            <Button onClick={handleCreate} variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Criar primeiro webinar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredWebinars.map((webinar: any) => {
            const isPast = webinar.eventDate && new Date(webinar.eventDate) < new Date();
            return (
              <Card key={webinar.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    {/* Card image or placeholder */}
                    <div className="hidden sm:flex w-20 h-20 rounded-lg bg-muted items-center justify-center flex-shrink-0 overflow-hidden">
                      {webinar.cardImageUrl ? (
                        <img
                          src={webinar.cardImageUrl}
                          alt={webinar.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Video className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-base truncate">{webinar.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(webinar.eventDate)}
                            </span>
                            {webinar.speaker && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {webinar.speaker}
                              </span>
                            )}
                            {webinar.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {webinar.duration}min
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[webinar.status as WebinarStatus] || ""}
                        >
                          {STATUS_LABELS[webinar.status as WebinarStatus] || webinar.status}
                        </Badge>
                      </div>

                      {/* Links */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {webinar.meetingLink && (
                          <a
                            href={webinar.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <Link2 className="h-3 w-3" />
                            Link da reunião
                          </a>
                        )}
                        {webinar.youtubeLink && (
                          <a
                            href={webinar.youtubeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                          >
                            <Youtube className="h-3 w-3" />
                            Gravação
                          </a>
                        )}
                        {webinar.reminderSent ? (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            <Send className="h-3 w-3 mr-1" />
                            Lembrete enviado
                          </Badge>
                        ) : null}
                      </div>

                      {/* Checklist summary badge */}
                      <div className="mt-2">
                        <ChecklistSummaryBadge webinarId={webinar.id} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Checklist interno */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setChecklistWebinar({ id: webinar.id, title: webinar.title })}
                        title="Checklist interno de produção"
                        className="text-primary hover:text-primary/80"
                      >
                        <ClipboardList className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(webinar)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!isPast && webinar.status === "published" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setReminderDialogWebinarId(webinar.id);
                            setReminderRecipients(['alunos', 'gerentes', 'mentores']);
                          }}
                          disabled={reminderMutation.isPending}
                          title={webinar.reminderSent ? "Reenviar lembrete" : "Enviar lembrete"}
                          className={webinar.reminderSent ? "text-green-600 hover:text-green-700" : ""}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(webinar.id)}
                        title="Excluir"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Novo Webinar
            </DialogTitle>
            <DialogDescription className="mt-1">
              Preencha os dados do novo webinar. Campos com * são obrigatórios.
            </DialogDescription>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {webinarFormFields}
          </div>
          <div className="px-6 py-4 border-t bg-background flex-shrink-0 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Criando..." : "Criar Webinar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingWebinar} onOpenChange={(open) => !open && setTimeout(() => setEditingWebinar(null), 100)}>
        <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Webinar
            </DialogTitle>
            <DialogDescription className="mt-1">
              Atualize os dados do webinar. Você pode incluir links de gravação para webinars passados.
            </DialogDescription>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {webinarFormFields}

            {/* Card upload section */}
            {editingWebinar && (
              <div className="border rounded-lg p-4 space-y-3">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Cartão de Divulgação
                </Label>
                {editingWebinar.cardImageUrl && (
                  <div className="relative w-full max-w-xs">
                    <img
                      src={editingWebinar.cardImageUrl}
                      alt="Cartão atual"
                      className="rounded-lg border max-h-48 object-contain"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCardFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUploadCard(editingWebinar.id)}
                    disabled={!cardFile || uploadCardMutation.isPending}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {uploadCardMutation.isPending ? "Enviando..." : "Enviar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t bg-background flex-shrink-0 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setTimeout(() => setEditingWebinar(null), 100)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reminder Recipients Dialog */}
      <Dialog open={!!reminderDialogWebinarId} onOpenChange={(open) => !open && setReminderDialogWebinarId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Enviar Lembrete
            </DialogTitle>
            <DialogDescription>
              Selecione quem deve receber o lembrete deste webinar por email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm font-medium text-muted-foreground">Destinatários:</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  type="checkbox"
                  checked={reminderRecipients.includes('alunos')}
                  onChange={() => toggleRecipient('alunos')}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <span className="font-medium">Alunos</span>
                  <p className="text-xs text-muted-foreground">Todos os alunos ativos com email cadastrado</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  type="checkbox"
                  checked={reminderRecipients.includes('gerentes')}
                  onChange={() => toggleRecipient('gerentes')}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <span className="font-medium">Gerentes</span>
                  <p className="text-xs text-muted-foreground">Todos os gerentes ativos com email cadastrado</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  type="checkbox"
                  checked={reminderRecipients.includes('mentores')}
                  onChange={() => toggleRecipient('mentores')}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <span className="font-medium">Mentores</span>
                  <p className="text-xs text-muted-foreground">Todos os mentores ativos com email cadastrado</p>
                </div>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderDialogWebinarId(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendReminder}
              disabled={reminderMutation.isPending || reminderRecipients.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {reminderMutation.isPending ? "Enviando..." : `Enviar Lembrete`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este webinar? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate({ id: deleteConfirm })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checklist Interno Modal */}
      {checklistWebinar && (
        <WebinarChecklistModal
          webinarId={checklistWebinar.id}
          webinarTitle={checklistWebinar.title}
          open={!!checklistWebinar}
          onClose={() => setChecklistWebinar(null)}
        />
      )}
    </div>
    </DashboardLayout>
  );
}
