import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Search,
  ExternalLink,
  Youtube,
  Clock,
  User,
  Filter,
  Play,
} from "lucide-react";

type CourseItem = {
  id: number;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  competenciaRelacionada: string | null;
  tipo: string;
  youtubeUrl: string | null;
  thumbnailUrl: string | null;
  duracao: string | null;
  instrutor: string | null;
  nivel: string | null;
  isActive: number;
};

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

export default function CursosAluno() {
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [filterNivel, setFilterNivel] = useState<string>("all");

  const { data: courses, isLoading } = trpc.courses.listActive.useQuery();

  // Categorias e níveis disponíveis
  const { categorias, niveis } = useMemo(() => {
    if (!courses) return { categorias: [], niveis: [] };
    const cats = new Set((courses as CourseItem[]).map((c) => c.categoria).filter(Boolean));
    const nivs = new Set((courses as CourseItem[]).map((c) => c.nivel).filter(Boolean));
    return {
      categorias: Array.from(cats).sort() as string[],
      niveis: Array.from(nivs) as string[],
    };
  }, [courses]);

  // Filtrar cursos
  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    return (courses as CourseItem[]).filter((c) => {
      const matchSearch =
        !search ||
        c.titulo.toLowerCase().includes(search.toLowerCase()) ||
        (c.descricao && c.descricao.toLowerCase().includes(search.toLowerCase())) ||
        (c.instrutor && c.instrutor.toLowerCase().includes(search.toLowerCase())) ||
        (c.categoria && c.categoria.toLowerCase().includes(search.toLowerCase()));
      const matchCategoria = filterCategoria === "all" || c.categoria === filterCategoria;
      const matchNivel = filterNivel === "all" || c.nivel === filterNivel;
      return matchSearch && matchCategoria && matchNivel;
    });
  }, [courses, search, filterCategoria, filterNivel]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <AlunoLayout>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary" />
          Cursos Disponíveis
        </h1>
        <p className="text-muted-foreground mt-1">
          Explore os cursos gratuitos selecionados para o seu desenvolvimento profissional
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cursos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {categorias.length > 0 && (
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {niveis.length > 1 && (
          <Select value={filterNivel} onValueChange={setFilterNivel}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Níveis</SelectItem>
              {niveis.map((niv) => (
                <SelectItem key={niv} value={niv}>
                  {NIVEL_LABELS[niv] || niv}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredCourses.length} curso{filteredCourses.length !== 1 ? "s" : ""} encontrado
        {filteredCourses.length !== 1 ? "s" : ""}
      </p>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {search || filterCategoria !== "all" || filterNivel !== "all"
                ? "Nenhum curso encontrado com os filtros aplicados"
                : "Nenhum curso disponível no momento"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Novos cursos serão adicionados em breve
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const thumbnail =
              course.thumbnailUrl ||
              (course.youtubeUrl ? getYouTubeThumbnail(course.youtubeUrl) : null);

            return (
              <Card
                key={course.id}
                className="overflow-hidden group transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Thumbnail */}
                <a
                  href={course.youtubeUrl || "#"}
                  target={course.youtubeUrl ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="block relative aspect-video bg-muted cursor-pointer"
                >
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
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/20">
                      <GraduationCap className="h-16 w-16 text-primary/30" />
                    </div>
                  )}
                  {/* Play overlay */}
                  {course.youtubeUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all">
                      <div className="bg-red-600 rounded-full p-3 shadow-lg scale-90 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all">
                        <Play className="h-6 w-6 text-white fill-white" />
                      </div>
                    </div>
                  )}
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {course.nivel && (
                      <Badge
                        variant="outline"
                        className={`text-xs backdrop-blur-sm ${NIVEL_COLORS[course.nivel] || ""}`}
                      >
                        {NIVEL_LABELS[course.nivel] || course.nivel}
                      </Badge>
                    )}
                  </div>
                  {course.duracao && (
                    <div className="absolute bottom-2 right-2">
                      <Badge className="text-xs bg-black/70 text-white border-0 backdrop-blur-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        {course.duracao}
                      </Badge>
                    </div>
                  )}
                </a>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-2 leading-tight">
                      {course.titulo}
                    </h3>
                    {course.descricao && (
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
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

                  {course.instrutor && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      <span>{course.instrutor}</span>
                    </div>
                  )}

                  {course.youtubeUrl && (
                    <Button
                      className="w-full gap-2 mt-2"
                      variant="outline"
                      asChild
                    >
                      <a
                        href={course.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Youtube className="h-4 w-4 text-red-600" />
                        Assistir no YouTube
                        <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
    </AlunoLayout>
  );
}
