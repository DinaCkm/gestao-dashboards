import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
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
} from "lucide-react";

type WebinarStatus = "draft" | "published" | "completed" | "cancelled";
type TargetAudience = "all" | "sebrae_to" | "sebrae_acre" | "embrapii" | "banrisul";

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

interface WebinarForm {
  title: string;
  description: string;
  theme: string;
  speaker: string;
  speakerBio: string;
  eventDate: string;
  duration: number;
  meetingLink: string;
  youtubeLink: string;
  targetAudience: TargetAudience;
  status: WebinarStatus;
}

const emptyForm: WebinarForm = {
  title: "",
  description: "",
  theme: "",
  speaker: "",
  speakerBio: "",
  eventDate: "",
  duration: 60,
  meetingLink: "",
  youtubeLink: "",
  targetAudience: "all",
  status: "draft",
};

export default function WebinarsAdmin() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWebinar, setEditingWebinar] = useState<any | null>(null);
  const [form, setForm] = useState<WebinarForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [cardFile, setCardFile] = useState<File | null>(null);

  const { data: webinars, isLoading, refetch } = trpc.webinars.list.useQuery(
    { status: statusFilter === "all" ? undefined : statusFilter }
  );

  const createMutation = trpc.webinars.create.useMutation({
    onSuccess: () => {
      toast.success("Webinar criado com sucesso!");
      setShowCreateDialog(false);
      setForm(emptyForm);
      refetch();
    },
    onError: (err) => toast.error(`Erro ao criar: ${err.message}`),
  });

  const updateMutation = trpc.webinars.update.useMutation({
    onSuccess: () => {
      toast.success("Webinar atualizado com sucesso!");
      setEditingWebinar(null);
      setForm(emptyForm);
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
      toast.success(`Lembrete enviado! Notificação enviada para ${data.emailsSent} alunos.`);
      refetch();
    },
    onError: (err) => toast.error(`Erro ao enviar lembrete: ${err.message}`),
  });

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
    setShowCreateDialog(true);
  };

  const handleEdit = (webinar: any) => {
    setForm({
      title: webinar.title || "",
      description: webinar.description || "",
      theme: webinar.theme || "",
      speaker: webinar.speaker || "",
      speakerBio: webinar.speakerBio || "",
      eventDate: webinar.eventDate
        ? new Date(webinar.eventDate).toISOString().slice(0, 16)
        : "",
      duration: webinar.duration || 60,
      meetingLink: webinar.meetingLink || "",
      youtubeLink: webinar.youtubeLink || "",
      targetAudience: (webinar.targetAudience as TargetAudience) || "all",
      status: (webinar.status as WebinarStatus) || "draft",
    });
    setEditingWebinar(webinar);
  };

  const handleSubmitCreate = () => {
    if (!form.title || !form.eventDate) {
      toast.error("Preencha título e data");
      return;
    }
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      theme: form.theme || undefined,
      speaker: form.speaker || undefined,
      speakerBio: form.speakerBio || undefined,
      eventDate: new Date(form.eventDate).toISOString(),
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
      eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : undefined,
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
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const WebinarFormFields = () => (
    <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid gap-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ex: 2026/05 - Liderança com João Silva"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="eventDate">Data e Hora *</Label>
          <Input
            id="eventDate"
            type="datetime-local"
            value={form.eventDate}
            onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="duration">Duração (min)</Label>
          <Input
            id="duration"
            type="number"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 60 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="speaker">Palestrante</Label>
          <Input
            id="speaker"
            value={form.speaker}
            onChange={(e) => setForm({ ...form, speaker: e.target.value })}
            placeholder="Nome do palestrante"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="theme">Tema</Label>
          <Input
            id="theme"
            value={form.theme}
            onChange={(e) => setForm({ ...form, theme: e.target.value })}
            placeholder="Ex: Liderança, IA, Gestão"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descrição do webinar..."
          rows={3}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="speakerBio">Bio do Palestrante</Label>
        <Textarea
          id="speakerBio"
          value={form.speakerBio}
          onChange={(e) => setForm({ ...form, speakerBio: e.target.value })}
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
            onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
            placeholder="https://zoom.us/j/..."
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="youtubeLink">Link do YouTube (gravação)</Label>
          <Input
            id="youtubeLink"
            value={form.youtubeLink}
            onChange={(e) => setForm({ ...form, youtubeLink: e.target.value })}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Público-alvo</Label>
          <Select
            value={form.targetAudience}
            onValueChange={(v) => setForm({ ...form, targetAudience: v as TargetAudience })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AUDIENCE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm({ ...form, status: v as WebinarStatus })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
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
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(webinar)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!isPast && webinar.status === "published" && !webinar.reminderSent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => reminderMutation.mutate({ webinarId: webinar.id })}
                          disabled={reminderMutation.isPending}
                          title="Enviar lembrete"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Novo Webinar
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do novo webinar. Campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <WebinarFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Criando..." : "Criar Webinar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingWebinar} onOpenChange={(open) => !open && setTimeout(() => setEditingWebinar(null), 100)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Webinar
            </DialogTitle>
            <DialogDescription>
              Atualize os dados do webinar. Você pode incluir links de gravação para webinars passados.
            </DialogDescription>
          </DialogHeader>
          <WebinarFormFields />

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
                    className="rounded-lg border max-h-40 object-contain"
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setTimeout(() => setEditingWebinar(null), 100)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
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
    </div>
  );
}
