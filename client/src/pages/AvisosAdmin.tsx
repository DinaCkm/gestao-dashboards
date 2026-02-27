import DashboardLayout from "@/components/DashboardLayout";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  Calendar,
  Search,
  Filter,
  Image as ImageIcon,
  Upload,
  ExternalLink,
  GraduationCap,
  Zap,
  Bell,
  Newspaper,
  Video,
  Eye,
  EyeOff,
  Link2,
} from "lucide-react";
import { useState, useMemo } from "react";

type AnnouncementType = "webinar" | "course" | "activity" | "notice" | "news";
type TargetAudience = "all" | "sebrae_to" | "sebrae_acre" | "embrapii" | "banrisul";

const TYPE_LABELS: Record<AnnouncementType, string> = {
  webinar: "Webinar",
  course: "Curso",
  activity: "Atividade Extra",
  notice: "Aviso",
  news: "Novidade",
};

const TYPE_ICONS: Record<AnnouncementType, any> = {
  webinar: Video,
  course: GraduationCap,
  activity: Zap,
  notice: Bell,
  news: Newspaper,
};

const TYPE_COLORS: Record<AnnouncementType, string> = {
  webinar: "bg-blue-100 text-blue-700 border-blue-300",
  course: "bg-purple-100 text-purple-700 border-purple-300",
  activity: "bg-emerald-100 text-emerald-700 border-emerald-300",
  notice: "bg-amber-100 text-amber-700 border-amber-300",
  news: "bg-cyan-100 text-cyan-700 border-cyan-300",
};

const AUDIENCE_LABELS: Record<TargetAudience, string> = {
  all: "Todos os Programas",
  sebrae_to: "SEBRAE Tocantins",
  sebrae_acre: "SEBRAE Acre",
  embrapii: "EMBRAPII",
  banrisul: "BANRISUL",
};

interface AnnouncementForm {
  title: string;
  content: string;
  type: AnnouncementType;
  targetAudience: TargetAudience;
  actionUrl: string;
  actionLabel: string;
  priority: number;
  publishAt: string;
  expiresAt: string;
  isActive: number;
}

const emptyForm: AnnouncementForm = {
  title: "",
  content: "",
  type: "notice",
  targetAudience: "all",
  actionUrl: "",
  actionLabel: "",
  priority: 0,
  publishAt: "",
  expiresAt: "",
  isActive: 1,
};

export default function AvisosAdmin() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: announcements, isLoading, refetch } = trpc.announcements.list.useQuery();

  const createMutation = trpc.announcements.create.useMutation({
    onSuccess: () => {
      toast.success("Aviso criado com sucesso!");
      setShowCreateDialog(false);
      setForm(emptyForm);
      setImageFile(null);
      refetch();
    },
    onError: (err) => toast.error(`Erro ao criar: ${err.message}`),
  });

  const updateMutation = trpc.announcements.update.useMutation({
    onSuccess: () => {
      toast.success("Aviso atualizado com sucesso!");
      setEditingAnnouncement(null);
      setForm(emptyForm);
      setImageFile(null);
      refetch();
    },
    onError: (err) => toast.error(`Erro ao atualizar: ${err.message}`),
  });

  const deleteMutation = trpc.announcements.delete.useMutation({
    onSuccess: () => {
      toast.success("Aviso excluído com sucesso!");
      setDeleteConfirm(null);
      refetch();
    },
    onError: (err) => toast.error(`Erro ao excluir: ${err.message}`),
  });

  const toggleActiveMutation = trpc.announcements.update.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (err) => toast.error(`Erro ao alterar status: ${err.message}`),
  });

  const filteredAnnouncements = useMemo(() => {
    if (!announcements) return [];
    return announcements.filter((a: any) => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (statusFilter === "active" && !a.isActive) return false;
      if (statusFilter === "inactive" && a.isActive) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          a.title?.toLowerCase().includes(term) ||
          a.content?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [announcements, typeFilter, statusFilter, searchTerm]);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    let imageUrl: string | undefined;
    if (imageFile) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
      // For now, store as base64 or upload via separate mechanism
      imageUrl = base64;
    }

    const payload: any = {
      title: form.title,
      content: form.content || undefined,
      type: form.type,
      targetAudience: form.targetAudience,
      actionUrl: form.actionUrl || undefined,
      actionLabel: form.actionLabel || undefined,
      priority: form.priority,
      publishAt: form.publishAt || undefined,
      expiresAt: form.expiresAt || undefined,
      isActive: form.isActive,
    };

    if (imageUrl) {
      payload.imageUrl = imageUrl;
    }

    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (announcement: any) => {
    setEditingAnnouncement(announcement);
    setForm({
      title: announcement.title || "",
      content: announcement.content || "",
      type: announcement.type || "notice",
      targetAudience: announcement.targetAudience || "all",
      actionUrl: announcement.actionUrl || "",
      actionLabel: announcement.actionLabel || "",
      priority: announcement.priority || 0,
      publishAt: announcement.publishAt
        ? new Date(announcement.publishAt).toISOString().slice(0, 16)
        : "",
      expiresAt: announcement.expiresAt
        ? new Date(announcement.expiresAt).toISOString().slice(0, 16)
        : "",
      isActive: announcement.isActive ? 1 : 0,
    });
    setImageFile(null);
  };

  const handleToggleActive = (announcement: any) => {
    toggleActiveMutation.mutate({
      id: announcement.id,
      isActive: announcement.isActive ? 0 : 1,
    });
  };

  const stats = useMemo(() => {
    if (!announcements) return { total: 0, active: 0, courses: 0, activities: 0, notices: 0, news: 0 };
    return {
      total: announcements.length,
      active: announcements.filter((a: any) => a.isActive).length,
      courses: announcements.filter((a: any) => a.type === "course").length,
      activities: announcements.filter((a: any) => a.type === "activity").length,
      notices: announcements.filter((a: any) => a.type === "notice").length,
      news: announcements.filter((a: any) => a.type === "news").length,
    };
  }, [announcements]);

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

  const isDialogOpen = showCreateDialog || !!editingAnnouncement;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Megaphone className="h-7 w-7 text-amber-600" />
              Gestão de Avisos e Comunicados
            </h1>
            <p className="text-muted-foreground mt-1">
              Publique avisos de cursos, atividades extras, novidades e comunicados para os alunos
            </p>
          </div>
          <Button
            onClick={() => {
              setForm(emptyForm);
              setEditingAnnouncement(null);
              setImageFile(null);
              setShowCreateDialog(true);
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Aviso
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-l-4 border-l-slate-500">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-purple-600">{stats.courses}</p>
              <p className="text-xs text-muted-foreground">Cursos</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-emerald-600">{stats.activities}</p>
              <p className="text-xs text-muted-foreground">Atividades</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-amber-600">{stats.notices}</p>
              <p className="text-xs text-muted-foreground">Avisos</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-cyan-600">{stats.news}</p>
              <p className="text-xs text-muted-foreground">Novidades</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou conteúdo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="course">Cursos</SelectItem>
                    <SelectItem value="activity">Atividades</SelectItem>
                    <SelectItem value="notice">Avisos</SelectItem>
                    <SelectItem value="news">Novidades</SelectItem>
                    <SelectItem value="webinar">Webinars</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Announcements List */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-1/3 mb-3" />
                  <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-muted-foreground">
                {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                  ? "Nenhum aviso encontrado com os filtros selecionados"
                  : "Nenhum aviso cadastrado"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {!searchTerm && typeFilter === "all" && statusFilter === "all"
                  ? "Clique em \"Novo Aviso\" para criar o primeiro comunicado"
                  : "Tente ajustar os filtros para encontrar o que procura"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAnnouncements.map((announcement: any) => {
              const TypeIcon = TYPE_ICONS[announcement.type as AnnouncementType] || Bell;
              return (
                <Card
                  key={announcement.id}
                  className={`transition-all hover:shadow-md ${
                    !announcement.isActive ? "opacity-60" : ""
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      {/* Left: Info */}
                      <div className="flex gap-4 flex-1 min-w-0">
                        {/* Image thumbnail */}
                        {announcement.imageUrl ? (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                            <img
                              src={announcement.imageUrl}
                              alt={announcement.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-lg flex-shrink-0 bg-muted flex items-center justify-center">
                            <TypeIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {announcement.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className={TYPE_COLORS[announcement.type as AnnouncementType]}
                            >
                              {TYPE_LABELS[announcement.type as AnnouncementType] || announcement.type}
                            </Badge>
                            {announcement.isActive ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                <Eye className="h-3 w-3 mr-1" />
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-300">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Inativo
                              </Badge>
                            )}
                          </div>

                          {announcement.content && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {announcement.content}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Criado: {formatDate(announcement.createdAt)}
                            </span>
                            {announcement.publishAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Publica em: {formatDate(announcement.publishAt)}
                              </span>
                            )}
                            {announcement.expiresAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Expira em: {formatDate(announcement.expiresAt)}
                              </span>
                            )}
                            <span>
                              Público: {AUDIENCE_LABELS[announcement.targetAudience as TargetAudience] || "Todos"}
                            </span>
                            {announcement.priority > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Prioridade: {announcement.priority}
                              </Badge>
                            )}
                          </div>

                          {announcement.actionUrl && (
                            <a
                              href={announcement.actionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                            >
                              <Link2 className="h-3 w-3" />
                              {announcement.actionLabel || announcement.actionUrl}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-2 mr-2">
                          <Label htmlFor={`active-${announcement.id}`} className="text-xs text-muted-foreground">
                            {announcement.isActive ? "Ativo" : "Inativo"}
                          </Label>
                          <Switch
                            id={`active-${announcement.id}`}
                            checked={!!announcement.isActive}
                            onCheckedChange={() => handleToggleActive(announcement)}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(announcement)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteConfirm(announcement.id)}
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

        {/* Create/Edit Dialog */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setTimeout(() => {
                setShowCreateDialog(false);
                setEditingAnnouncement(null);
                setForm(emptyForm);
                setImageFile(null);
              }, 100);
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-amber-600" />
                {editingAnnouncement ? "Editar Aviso" : "Novo Aviso"}
              </DialogTitle>
              <DialogDescription>
                {editingAnnouncement
                  ? "Atualize as informações do aviso/comunicado"
                  : "Preencha os dados para criar um novo aviso ou comunicado"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Título */}
              <div className="grid gap-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Novo Curso de Liderança Disponível"
                />
              </div>

              {/* Tipo e Público */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v as AnnouncementType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">
                        <span className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" /> Curso
                        </span>
                      </SelectItem>
                      <SelectItem value="activity">
                        <span className="flex items-center gap-2">
                          <Zap className="h-4 w-4" /> Atividade Extra
                        </span>
                      </SelectItem>
                      <SelectItem value="notice">
                        <span className="flex items-center gap-2">
                          <Bell className="h-4 w-4" /> Aviso
                        </span>
                      </SelectItem>
                      <SelectItem value="news">
                        <span className="flex items-center gap-2">
                          <Newspaper className="h-4 w-4" /> Novidade
                        </span>
                      </SelectItem>
                      <SelectItem value="webinar">
                        <span className="flex items-center gap-2">
                          <Video className="h-4 w-4" /> Webinar
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                      <SelectItem value="all">Todos os Programas</SelectItem>
                      <SelectItem value="sebrae_to">SEBRAE Tocantins</SelectItem>
                      <SelectItem value="sebrae_acre">SEBRAE Acre</SelectItem>
                      <SelectItem value="embrapii">EMBRAPII</SelectItem>
                      <SelectItem value="banrisul">BANRISUL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="grid gap-2">
                <Label htmlFor="content">Conteúdo / Descrição</Label>
                <Textarea
                  id="content"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Descreva o aviso, curso ou atividade em detalhes..."
                  rows={4}
                  className="resize-y overflow-auto"
                />
              </div>

              {/* Imagem */}
              <div className="grid gap-2">
                <Label>Imagem de Capa</Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">
                      {imageFile ? imageFile.name : "Selecionar imagem"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {imageFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setImageFile(null)}
                      className="text-red-500"
                    >
                      Remover
                    </Button>
                  )}
                </div>
                {editingAnnouncement?.imageUrl && !imageFile && (
                  <p className="text-xs text-muted-foreground">
                    Imagem atual mantida. Selecione outra para substituir.
                  </p>
                )}
              </div>

              {/* Link de Ação */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="actionUrl">Link de Ação (opcional)</Label>
                  <Input
                    id="actionUrl"
                    value={form.actionUrl}
                    onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="actionLabel">Texto do Botão</Label>
                  <Input
                    id="actionLabel"
                    value={form.actionLabel}
                    onChange={(e) => setForm({ ...form, actionLabel: e.target.value })}
                    placeholder="Ex: Inscreva-se, Saiba mais..."
                  />
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="publishAt">Data de Publicação</Label>
                  <Input
                    id="publishAt"
                    type="datetime-local"
                    value={form.publishAt}
                    onChange={(e) => setForm({ ...form, publishAt: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe vazio para publicar imediatamente
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiresAt">Data de Expiração</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe vazio para não expirar
                  </p>
                </div>
              </div>

              {/* Prioridade e Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Input
                    id="priority"
                    type="number"
                    min={0}
                    max={100}
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maior número = mais destaque (0 = normal)
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-3 h-10">
                    <Switch
                      checked={form.isActive === 1}
                      onCheckedChange={(checked) =>
                        setForm({ ...form, isActive: checked ? 1 : 0 })
                      }
                    />
                    <span className="text-sm">
                      {form.isActive ? (
                        <span className="text-green-600 font-medium flex items-center gap-1">
                          <Eye className="h-4 w-4" /> Ativo (visível para alunos)
                        </span>
                      ) : (
                        <span className="text-gray-500 flex items-center gap-1">
                          <EyeOff className="h-4 w-4" /> Inativo (oculto)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setTimeout(() => {
                    setShowCreateDialog(false);
                    setEditingAnnouncement(null);
                    setForm(emptyForm);
                    setImageFile(null);
                  }, 100);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : editingAnnouncement
                  ? "Salvar Alterações"
                  : "Criar Aviso"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este aviso? Esta ação não pode ser desfeita.
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
    </DashboardLayout>
  );
}
