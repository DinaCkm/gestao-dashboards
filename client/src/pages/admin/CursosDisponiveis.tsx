import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
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
  GraduationCap,
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  Youtube,
  Clock,
  User,
  BookOpen,
  Filter,
  BarChart3,
} from "lucide-react";

type CourseItem = {
  id: number;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  competenciaRelacionada: string | null;
  tipo: "gratuito" | "online_pago" | "presencial";
  youtubeUrl: string | null;
  thumbnailUrl: string | null;
  duracao: string | null;
  instrutor: string | null;
  nivel: "iniciante" | "intermediario" | "avancado" | null;
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
  categoria: string;
  competenciaRelacionada: string;
  youtubeUrl: string;
  thumbnailUrl: string;
  duracao: string;
  instrutor: string;
  nivel: "iniciante" | "intermediario" | "avancado";
  ordem: number;
};

const emptyForm: FormData = {
  titulo: "",
  descricao: "",
  categoria: "",
  competenciaRelacionada: "",
  youtubeUrl: "",
  thumbnailUrl: "",
  duracao: "",
  instrutor: "",
  nivel: "iniciante",
  ordem: 0,
};

const CATEGORIAS = [
  "Liderança",
  "Comunicação",
  "Gestão de Pessoas",
  "Gestão do Tempo",
  "Produtividade",
  "Inteligência Emocional",
  "Estratégia",
  "Inovação",
  "Finanças",
  "Marketing",
  "Vendas",
  "Tecnologia",
  "Desenvolvimento Pessoal",
  "Empreendedorismo",
  "Outros",
];

const NIVEL_LABELS: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

const NIVEL_COLORS: Record<string, string> = {
  iniciante: "bg-green-500/10 text-green-700 border-green-300",
  intermediario: "bg-amber-500/10 text-amber-700 border-amber-300",
  avancado: "bg-red-500/10 text-red-700 border-red-300",
};

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getYouTubeThumbnail(url: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

export default function CursosDisponiveis() {
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showInactive, setShowInactive] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: courses, isLoading } = trpc.courses.list.useQuery();
  const { data: competenciasData } = trpc.competencias.listWithTrilha.useQuery();

  const createMutation = trpc.courses.create.useMutation({
    onSuccess: () => {
      toast.success("Curso criado com sucesso!");
      utils.courses.list.invalidate();
      handleCloseDialog();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.courses.update.useMutation({
    onSuccess: () => {
      toast.success("Curso atualizado com sucesso!");
      utils.courses.list.invalidate();
      handleCloseDialog();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.courses.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      utils.courses.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.courses.delete.useMutation({
    onSuccess: () => {
      toast.success("Curso removido!");
      utils.courses.list.invalidate();
      setDeleteConfirm(null);
    },
    onError: (err) => toast.error(err.message),
  });

  // Competências agrupadas por trilha para o select
  const competenciasByTrilha = useMemo(() => {
    if (!competenciasData) return {};
    const groups: Record<string, { id: number; nome: string }[]> = {};
    competenciasData.forEach((c: any) => {
      const trilhaNome = c.trilhaNome || "Sem Trilha";
      if (!groups[trilhaNome]) groups[trilhaNome] = [];
      groups[trilhaNome].push({ id: c.id, nome: c.nome });
    });
    return groups;
  }, [competenciasData]);

  // Filtrar cursos
  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    return (courses as CourseItem[]).filter((c) => {
      const matchSearch =
        !search ||
        c.titulo.toLowerCase().includes(search.toLowerCase()) ||
        (c.descricao && c.descricao.toLowerCase().includes(search.toLowerCase())) ||
        (c.instrutor && c.instrutor.toLowerCase().includes(search.toLowerCase()));
      const matchCategoria = filterCategoria === "all" || c.categoria === filterCategoria;
      const matchActive = showInactive || c.isActive === 1;
      return matchSearch && matchCategoria && matchActive;
    });
  }, [courses, search, filterCategoria, showInactive]);

  // Categorias únicas dos cursos existentes
  const existingCategories = useMemo(() => {
    if (!courses) return [];
    const cats = new Set((courses as CourseItem[]).map((c) => c.categoria).filter(Boolean));
    return Array.from(cats).sort() as string[];
  }, [courses]);

  const totalCursos = courses?.length ?? 0;
  const cursosAtivos = courses?.filter((c: any) => c.isActive === 1).length ?? 0;

  function handleOpenCreate() {
    setEditingCourse(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function handleOpenEdit(course: CourseItem) {
    setEditingCourse(course);
    setForm({
      titulo: course.titulo,
      descricao: course.descricao ?? "",
      categoria: course.categoria ?? "",
      competenciaRelacionada: course.competenciaRelacionada ?? "",
      youtubeUrl: course.youtubeUrl ?? "",
      thumbnailUrl: course.thumbnailUrl ?? "",
      duracao: course.duracao ?? "",
      instrutor: course.instrutor ?? "",
      nivel: (course.nivel as "iniciante" | "intermediario" | "avancado") ?? "iniciante",
      ordem: course.ordem ?? 0,
    });
    setShowDialog(true);
  }

  function handleCloseDialog() {
    setTimeout(() => {
      setShowDialog(false);
      setEditingCourse(null);
      setForm(emptyForm);
    }, 100);
  }

  function handleSubmit() {
    if (!form.titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    // Auto-gerar thumbnail do YouTube se não tiver
    let thumbnailUrl = form.thumbnailUrl.trim() || null;
    if (!thumbnailUrl && form.youtubeUrl.trim()) {
      thumbnailUrl = getYouTubeThumbnail(form.youtubeUrl.trim());
    }

    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      categoria: form.categoria || null,
      competenciaRelacionada: form.competenciaRelacionada || null,
      tipo: "gratuito" as const,
      youtubeUrl: form.youtubeUrl.trim() || null,
      thumbnailUrl,
      duracao: form.duracao.trim() || null,
      instrutor: form.instrutor.trim() || null,
      nivel: form.nivel,
      ordem: form.ordem,
    };

    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            Cursos Disponíveis
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os cursos gratuitos disponíveis para os alunos
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Curso
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCursos}</p>
                <p className="text-sm text-muted-foreground">Total de Cursos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Youtube className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cursosAtivos}</p>
                <p className="text-sm text-muted-foreground">Cursos Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{existingCategories.length}</p>
                <p className="text-sm text-muted-foreground">Categorias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descrição ou instrutor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3 items-center">
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                  id="show-inactive"
                />
                <Label htmlFor="show-inactive" className="text-sm whitespace-nowrap">
                  Mostrar inativos
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {search || filterCategoria !== "all"
                ? "Nenhum curso encontrado com os filtros aplicados"
                : "Nenhum curso cadastrado"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {!search && filterCategoria === "all" && "Clique em 'Novo Curso' para adicionar o primeiro"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => {
            const thumbnail =
              course.thumbnailUrl ||
              (course.youtubeUrl ? getYouTubeThumbnail(course.youtubeUrl) : null);

            return (
              <Card
                key={course.id}
                className={`overflow-hidden transition-all hover:shadow-md ${
                  course.isActive === 0 ? "opacity-60" : ""
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={course.titulo}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Youtube className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Badges overlay */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {course.nivel && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${NIVEL_COLORS[course.nivel] || ""}`}
                      >
                        {NIVEL_LABELS[course.nivel] || course.nivel}
                      </Badge>
                    )}
                    {course.isActive === 0 && (
                      <Badge variant="destructive" className="text-xs">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  {course.youtubeUrl && (
                    <a
                      href={course.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <div className="bg-red-600 rounded-full p-3">
                        <Youtube className="h-6 w-6 text-white" />
                      </div>
                    </a>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-2">{course.titulo}</h3>
                    {course.descricao && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {course.descricao}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {course.categoria && (
                      <Badge variant="secondary" className="text-xs">
                        {course.categoria}
                      </Badge>
                    )}
                    {course.competenciaRelacionada && (
                      <Badge variant="outline" className="text-xs">
                        {course.competenciaRelacionada}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {course.instrutor && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {course.instrutor}
                      </span>
                    )}
                    {course.duracao && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duracao}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(course)}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {course.youtubeUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <a
                            href={course.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir no YouTube"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(course.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Switch
                      checked={course.isActive === 1}
                      onCheckedChange={() =>
                        toggleMutation.mutate({
                          id: course.id,
                          isActive: course.isActive === 1 ? 0 : 1,
                        })
                      }
                      title={course.isActive === 1 ? "Desativar" : "Ativar"}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.
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

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? "Editar Curso" : "Novo Curso Gratuito"}
            </DialogTitle>
            <DialogDescription>
              {editingCourse
                ? "Atualize os dados do curso"
                : "Cadastre um novo curso gratuito com link para YouTube ou conteúdo externo"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="titulo">
                Título do Curso <span className="text-red-500">*</span>
              </Label>
              <Input
                id="titulo"
                placeholder="Ex: Liderança Situacional - Fundamentos"
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Breve descrição do conteúdo do curso..."
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                rows={3}
              />
            </div>

            {/* YouTube URL */}
            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">Link do YouTube</Label>
              <Input
                id="youtubeUrl"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.youtubeUrl}
                onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
              />
              {form.youtubeUrl && getYouTubeThumbnail(form.youtubeUrl) && (
                <div className="mt-2 rounded-lg overflow-hidden border max-w-xs">
                  <img
                    src={getYouTubeThumbnail(form.youtubeUrl)!}
                    alt="Preview"
                    className="w-full aspect-video object-cover"
                  />
                  <p className="text-xs text-muted-foreground p-2">
                    Thumbnail auto-extraída do YouTube
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.categoria || "none"}
                  onValueChange={(v) => setForm((f) => ({ ...f, categoria: v === "none" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Competência Relacionada */}
              <div className="space-y-2">
                <Label>Competência Relacionada</Label>
                <Select
                  value={form.competenciaRelacionada || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, competenciaRelacionada: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {Object.entries(competenciasByTrilha).map(([trilha, comps]) => (
                      <div key={trilha}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                          {trilha}
                        </div>
                        {comps.map((c) => (
                          <SelectItem key={c.id} value={c.nome}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Instrutor */}
              <div className="space-y-2">
                <Label htmlFor="instrutor">Instrutor / Canal</Label>
                <Input
                  id="instrutor"
                  placeholder="Nome do instrutor"
                  value={form.instrutor}
                  onChange={(e) => setForm((f) => ({ ...f, instrutor: e.target.value }))}
                />
              </div>

              {/* Duração */}
              <div className="space-y-2">
                <Label htmlFor="duracao">Duração</Label>
                <Input
                  id="duracao"
                  placeholder="Ex: 1h30, 45min"
                  value={form.duracao}
                  onChange={(e) => setForm((f) => ({ ...f, duracao: e.target.value }))}
                />
              </div>

              {/* Nível */}
              <div className="space-y-2">
                <Label>Nível</Label>
                <Select
                  value={form.nivel}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      nivel: v as "iniciante" | "intermediario" | "avancado",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciante">Iniciante</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Thumbnail URL (opcional, se quiser override) */}
            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">
                URL da Thumbnail (opcional — auto-extraída do YouTube)
              </Label>
              <Input
                id="thumbnailUrl"
                placeholder="https://... (deixe vazio para usar thumbnail do YouTube)"
                value={form.thumbnailUrl}
                onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
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
                : editingCourse
                ? "Salvar Alterações"
                : "Criar Curso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
