import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlayCircle, Search, Clock, CheckCircle2, BookOpen,
  User, CalendarDays, ClipboardCheck, Users2, Video,
  Target, BarChart3, FileText, GraduationCap, Sparkles,
  ChevronRight, ExternalLink
} from "lucide-react";

// ============================================================
// DADOS FAKE DOS TUTORIAIS
// ============================================================

interface Tutorial {
  id: number;
  titulo: string;
  descricao: string;
  duracao: string;
  categoria: string;
  icon: React.ElementType;
  videoUrl: string;
  thumbnailColor: string;
  assistido: boolean;
  ordem: number;
}

const TUTORIAIS_FAKE: Tutorial[] = [
  {
    id: 1,
    titulo: "Primeiros Passos na Plataforma",
    descricao: "Aprenda a navegar pela plataforma, atualizar seu perfil e entender as principais funcionalidades disponíveis para você.",
    duracao: "5:30",
    categoria: "Início",
    icon: User,
    videoUrl: "https://www.youtube.com/watch?v=exemplo1",
    thumbnailColor: "from-blue-500 to-blue-700",
    assistido: true,
    ordem: 1,
  },
  {
    id: 2,
    titulo: "Como Realizar o Assessment",
    descricao: "Entenda o que é o assessment, como acessar a avaliação de perfil comportamental e o que esperar dos resultados.",
    duracao: "4:15",
    categoria: "Assessment",
    icon: ClipboardCheck,
    videoUrl: "https://www.youtube.com/watch?v=exemplo2",
    thumbnailColor: "from-purple-500 to-purple-700",
    assistido: true,
    ordem: 2,
  },
  {
    id: 3,
    titulo: "Escolhendo sua Mentora",
    descricao: "Saiba como visualizar os perfis das mentoras disponíveis, analisar especialidades e fazer a melhor escolha para seu desenvolvimento.",
    duracao: "3:45",
    categoria: "Mentoria",
    icon: Users2,
    videoUrl: "https://www.youtube.com/watch?v=exemplo3",
    thumbnailColor: "from-pink-500 to-pink-700",
    assistido: false,
    ordem: 3,
  },
  {
    id: 4,
    titulo: "Agendando Sessões de Mentoria",
    descricao: "Aprenda a verificar a disponibilidade da sua mentora, escolher horários e acessar o link do Google Meet para as sessões.",
    duracao: "4:00",
    categoria: "Mentoria",
    icon: CalendarDays,
    videoUrl: "https://www.youtube.com/watch?v=exemplo4",
    thumbnailColor: "from-green-500 to-green-700",
    assistido: false,
    ordem: 4,
  },
  {
    id: 5,
    titulo: "Participando da Sessão de Mentoria",
    descricao: "Dicas para aproveitar ao máximo suas sessões: como se preparar, o que levar e como interagir com sua mentora.",
    duracao: "6:20",
    categoria: "Mentoria",
    icon: Video,
    videoUrl: "https://www.youtube.com/watch?v=exemplo5",
    thumbnailColor: "from-teal-500 to-teal-700",
    assistido: false,
    ordem: 5,
  },
  {
    id: 6,
    titulo: "Entendendo sua Trilha de Competências",
    descricao: "Veja como funciona a trilha de desenvolvimento, os ciclos de competências e como acompanhar seu progresso ao longo do programa.",
    duracao: "5:00",
    categoria: "Trilha",
    icon: Target,
    videoUrl: "https://www.youtube.com/watch?v=exemplo6",
    thumbnailColor: "from-orange-500 to-orange-700",
    assistido: false,
    ordem: 6,
  },
  {
    id: 7,
    titulo: "Acessando Cursos e Módulos",
    descricao: "Como acessar a plataforma de cursos, acompanhar seu progresso nos módulos e completar as atividades obrigatórias.",
    duracao: "3:30",
    categoria: "Cursos",
    icon: GraduationCap,
    videoUrl: "https://www.youtube.com/watch?v=exemplo7",
    thumbnailColor: "from-indigo-500 to-indigo-700",
    assistido: false,
    ordem: 7,
  },
  {
    id: 8,
    titulo: "Participando dos Webinars",
    descricao: "Saiba como se inscrever nos webinars, participar ao vivo e acessar as gravações dos eventos anteriores.",
    duracao: "3:15",
    categoria: "Webinars",
    icon: PlayCircle,
    videoUrl: "https://www.youtube.com/watch?v=exemplo8",
    thumbnailColor: "from-red-500 to-red-700",
    assistido: false,
    ordem: 8,
  },
  {
    id: 9,
    titulo: "Realizando Tarefas Práticas",
    descricao: "Entenda como receber, executar e relatar suas tarefas práticas atribuídas pela mentora durante o programa.",
    duracao: "4:45",
    categoria: "Tarefas",
    icon: FileText,
    videoUrl: "https://www.youtube.com/watch?v=exemplo9",
    thumbnailColor: "from-amber-500 to-amber-700",
    assistido: false,
    ordem: 9,
  },
  {
    id: 10,
    titulo: "Acompanhando sua Performance",
    descricao: "Aprenda a ler seu dashboard de performance, entender os 5 indicadores e acompanhar sua evolução ao longo do programa.",
    duracao: "5:50",
    categoria: "Performance",
    icon: BarChart3,
    videoUrl: "https://www.youtube.com/watch?v=exemplo10",
    thumbnailColor: "from-cyan-500 to-cyan-700",
    assistido: false,
    ordem: 10,
  },
];

const CATEGORIAS = ["Todos", "Início", "Assessment", "Mentoria", "Trilha", "Cursos", "Webinars", "Tarefas", "Performance"];

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function Tutoriais() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "Aluno";
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [tutoriaisAssistidos, setTutoriaisAssistidos] = useState<Set<number>>(
    new Set(TUTORIAIS_FAKE.filter(t => t.assistido).map(t => t.id))
  );

  const tutoriaisFiltrados = TUTORIAIS_FAKE.filter(t => {
    const matchSearch = t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = categoriaAtiva === "Todos" || t.categoria === categoriaAtiva;
    return matchSearch && matchCategoria;
  });

  const totalAssistidos = tutoriaisAssistidos.size;
  const totalTutoriais = TUTORIAIS_FAKE.length;
  const progressoPercent = Math.round((totalAssistidos / totalTutoriais) * 100);

  const handleAssistir = (tutorial: Tutorial) => {
    setTutoriaisAssistidos(prev => {
      const next = new Set(prev);
      next.add(tutorial.id);
      return next;
    });
    window.open(tutorial.videoUrl, "_blank");
  };

  return (
    <AlunoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-[#1B3A5D] to-[#2a5a8a] p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="h-7 w-7 text-[#E87722]" />
                Tutoriais da Plataforma
              </h1>
              <p className="mt-1 text-white/80">
                Aprenda a usar todas as funcionalidades do Ecossistema do BEM
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#E87722]">{progressoPercent}%</div>
              <div className="text-sm text-white/70">{totalAssistidos}/{totalTutoriais} assistidos</div>
            </div>
          </div>
          {/* Barra de progresso */}
          <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#E87722] to-[#f59e0b] transition-all duration-500"
              style={{ width: `${progressoPercent}%` }}
            />
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar tutoriais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIAS.map(cat => (
              <Button
                key={cat}
                variant={categoriaAtiva === cat ? "default" : "outline"}
                size="sm"
                className={categoriaAtiva === cat
                  ? "bg-[#1B3A5D] hover:bg-[#1B3A5D]/90 text-white"
                  : "text-gray-600 hover:text-[#1B3A5D]"
                }
                onClick={() => setCategoriaAtiva(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Jornada Recomendada */}
        {categoriaAtiva === "Todos" && !searchTerm && (
          <Card className="border-[#E87722]/20 bg-gradient-to-r from-orange-50 to-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#E87722]" />
                Jornada Recomendada
              </CardTitle>
              <CardDescription>
                Assista os tutoriais na ordem para aproveitar melhor a plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {TUTORIAIS_FAKE.slice(0, 5).map((t, i) => {
                  const isAssistido = tutoriaisAssistidos.has(t.id);
                  return (
                    <div key={t.id} className="flex items-center gap-2">
                      <div className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                        ${isAssistido
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                        }
                      `}>
                        {isAssistido ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center text-[10px]">
                            {t.ordem}
                          </span>
                        )}
                        {t.titulo.split(" ").slice(0, 3).join(" ")}
                      </div>
                      {i < 4 && <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Tutoriais */}
        <div className="grid gap-4 md:grid-cols-2">
          {tutoriaisFiltrados.map(tutorial => {
            const isAssistido = tutoriaisAssistidos.has(tutorial.id);
            const TutorialIcon = tutorial.icon;

            return (
              <Card
                key={tutorial.id}
                className={`overflow-hidden transition-all hover:shadow-md ${
                  isAssistido ? "border-green-200 bg-green-50/30" : ""
                }`}
              >
                <div className="flex">
                  {/* Thumbnail */}
                  <div className={`
                    w-32 shrink-0 bg-gradient-to-br ${tutorial.thumbnailColor}
                    flex flex-col items-center justify-center text-white relative
                  `}>
                    <TutorialIcon className="h-8 w-8 mb-1" />
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {tutorial.duracao}
                    </div>
                    {isAssistido && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="h-5 w-5 text-white drop-shadow" />
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {tutorial.categoria}
                          </Badge>
                          <span className="text-[10px] text-gray-400">#{tutorial.ordem}</span>
                          {isAssistido && (
                            <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">
                              Assistido
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900 leading-tight">
                          {tutorial.titulo}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {tutorial.descricao}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        className={isAssistido
                          ? "bg-green-600 hover:bg-green-700 text-white text-xs h-7"
                          : "bg-[#E87722] hover:bg-[#d06a1e] text-white text-xs h-7"
                        }
                        onClick={() => handleAssistir(tutorial)}
                      >
                        <PlayCircle className="h-3.5 w-3.5 mr-1" />
                        {isAssistido ? "Assistir Novamente" : "Assistir Tutorial"}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {tutoriaisFiltrados.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-600">Nenhum tutorial encontrado</h3>
            <p className="text-sm text-gray-400 mt-1">Tente buscar com outros termos ou altere o filtro</p>
          </div>
        )}

        {/* Dica */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Dica</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Recomendamos assistir os tutoriais na ordem da jornada para entender melhor cada etapa do programa.
                  Em caso de dúvidas, entre em contato com sua mentora ou com o suporte do programa.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AlunoLayout>
  );
}
