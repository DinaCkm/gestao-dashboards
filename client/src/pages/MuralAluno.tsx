import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Video, Calendar, Clock, ExternalLink, Youtube, Megaphone,
  BookOpen, Sparkles, Bell, ArrowRight, Users, Globe,
  GraduationCap, Zap, ChevronRight, PlayCircle, Info,
  CalendarDays, MapPin, Star, Loader2
} from "lucide-react";

// ============================================================
// HELPERS
// ============================================================

function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function formatTimeOnly(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function isUpcoming(dateStr: string | Date | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) > new Date();
}

function daysUntil(dateStr: string | Date | null | undefined): number {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  webinar: { label: "Webinar", icon: Video, color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  course: { label: "Curso", icon: GraduationCap, color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200" },
  activity: { label: "Atividade Extra", icon: Zap, color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200" },
  notice: { label: "Aviso", icon: Bell, color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200" },
  news: { label: "Novidade", icon: Sparkles, color: "text-rose-700", bgColor: "bg-rose-50 border-rose-200" },
};

// ============================================================
// HERO BANNER - Próximo Webinar em Destaque
// ============================================================

function HeroBanner({ webinar }: { webinar: any }) {
  const days = daysUntil(webinar.eventDate);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3A5D] via-[#1B3A5D] to-[#0D2240] text-white shadow-xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E87722] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="relative flex flex-col lg:flex-row items-center gap-6 p-6 lg:p-8">
        {/* Card Image */}
        {webinar.cardImageUrl ? (
          <div className="w-full lg:w-80 flex-shrink-0">
            <img
              src={webinar.cardImageUrl}
              alt={webinar.title}
              className="w-full h-48 lg:h-56 object-cover rounded-xl shadow-lg"
            />
          </div>
        ) : (
          <div className="w-full lg:w-80 h-48 lg:h-56 flex-shrink-0 rounded-xl bg-white/10 flex items-center justify-center">
            <Video className="h-16 w-16 text-white/30" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-[#E87722] text-white border-0 px-3 py-1 text-xs font-semibold">
              PRÓXIMO EVENTO
            </Badge>
            {days > 0 && days <= 7 && (
              <Badge className="bg-red-500/90 text-white border-0 px-3 py-1 text-xs font-semibold animate-pulse">
                Em {days} dia{days > 1 ? "s" : ""}!
              </Badge>
            )}
            {days === 0 && (
              <Badge className="bg-green-500 text-white border-0 px-3 py-1 text-xs font-semibold animate-pulse">
                HOJE!
              </Badge>
            )}
          </div>

          <h2 className="text-xl lg:text-2xl font-bold leading-tight">{webinar.title}</h2>

          {webinar.description && (
            <p className="text-white/70 text-sm lg:text-base line-clamp-2">{webinar.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-[#E87722]" />
              {formatDate(webinar.eventDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#E87722]" />
              {formatTimeOnly(webinar.eventDate)}
            </span>
            {webinar.duration && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#E87722]" />
                {webinar.duration} min
              </span>
            )}
            {webinar.speaker && (
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#E87722]" />
                {webinar.speaker}
              </span>
            )}
          </div>

          {webinar.theme && (
            <Badge variant="outline" className="text-white/80 border-white/30 text-xs">
              {webinar.theme}
            </Badge>
          )}

          <div className="flex gap-3 pt-2">
            {webinar.meetingLink && (
              <Button
                className="bg-[#E87722] hover:bg-[#E87722]/90 text-white shadow-lg"
                onClick={() => window.open(webinar.meetingLink, "_blank")}
              >
                <Video className="h-4 w-4 mr-2" />
                Participar
              </Button>
            )}
            {webinar.youtubeLink && (
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                onClick={() => window.open(webinar.youtubeLink, "_blank")}
              >
                <Youtube className="h-4 w-4 mr-2" />
                Assistir Gravação
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// WEBINAR CARD (para lista)
// ============================================================

function WebinarCard({ webinar, variant = "upcoming" }: { webinar: any; variant?: "upcoming" | "past" }) {
  const isPast = variant === "past";

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 overflow-hidden ${
      isPast ? "opacity-80 hover:opacity-100" : "border-l-4 border-l-[#E87722]"
    }`}>
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        {webinar.cardImageUrl ? (
          <div className="sm:w-40 h-32 sm:h-auto flex-shrink-0">
            <img
              src={webinar.cardImageUrl}
              alt={webinar.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-[#1B3A5D] transition-colors line-clamp-1">
                {webinar.title}
              </h3>
              {webinar.theme && (
                <span className="text-xs text-gray-500">{webinar.theme}</span>
              )}
            </div>
            {isPast && webinar.youtubeLink && (
              <Badge className="bg-red-50 text-red-600 border-red-200 text-xs flex-shrink-0">
                <PlayCircle className="h-3 w-3 mr-1" />
                Gravação
              </Badge>
            )}
            {!isPast && (
              <Badge className="bg-green-50 text-green-700 border-green-200 text-xs flex-shrink-0">
                Próximo
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateTime(webinar.eventDate)}
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

          {webinar.description && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-3">{webinar.description}</p>
          )}

          <div className="flex gap-2">
            {!isPast && webinar.meetingLink && (
              <Button
                size="sm"
                className="bg-[#1B3A5D] hover:bg-[#1B3A5D]/90 text-white text-xs h-8"
                onClick={() => window.open(webinar.meetingLink, "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Acessar
              </Button>
            )}
            {isPast && webinar.youtubeLink && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-8"
                onClick={() => window.open(webinar.youtubeLink, "_blank")}
              >
                <Youtube className="h-3 w-3 mr-1" />
                Assistir
              </Button>
            )}
            {isPast && webinar.meetingLink && !webinar.youtubeLink && (
              <Button
                size="sm"
                variant="outline"
                className="text-gray-500 border-gray-200 text-xs h-8"
                onClick={() => window.open(webinar.meetingLink, "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Link do Evento
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// ANNOUNCEMENT CARD
// ============================================================

function AnnouncementCard({ announcement }: { announcement: any }) {
  const config = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.notice;
  const Icon = config.icon;

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 border ${config.bgColor}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white shadow-sm`}>
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={`text-[10px] ${config.color} border-current`}>
                {config.label}
              </Badge>
              {announcement.priority > 5 && (
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              )}
            </div>
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-[#1B3A5D] transition-colors">
              {announcement.title}
            </h3>
            {announcement.content && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{announcement.content}</p>
            )}
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-gray-400">
                {formatDate(announcement.publishAt || announcement.createdAt)}
              </span>
              {announcement.actionUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 text-[#1B3A5D] hover:text-[#E87722]"
                  onClick={() => window.open(announcement.actionUrl, "_blank")}
                >
                  {announcement.actionLabel || "Saiba mais"}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
          {announcement.imageUrl && (
            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
              <img
                src={announcement.imageUrl}
                alt={announcement.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function MuralAluno() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("todos");

  // Hooks - todos declarados no topo
  const { data: upcomingWebinars, isLoading: loadingUpcoming } = trpc.webinars.upcoming.useQuery({ limit: 20 });
  const { data: pastWebinars, isLoading: loadingPast } = trpc.webinars.past.useQuery({ limit: 20 });
  const { data: activeAnnouncements, isLoading: loadingAnnouncements } = trpc.announcements.active.useQuery();

  const isLoading = loadingUpcoming || loadingPast || loadingAnnouncements;

  // Separar announcements por tipo
  const announcementsByType = useMemo(() => {
    if (!activeAnnouncements) return { courses: [], activities: [], notices: [], news: [], webinars: [] };
    return {
      courses: activeAnnouncements.filter((a: any) => a.type === "course"),
      activities: activeAnnouncements.filter((a: any) => a.type === "activity"),
      notices: activeAnnouncements.filter((a: any) => a.type === "notice"),
      news: activeAnnouncements.filter((a: any) => a.type === "news"),
      webinars: activeAnnouncements.filter((a: any) => a.type === "webinar"),
    };
  }, [activeAnnouncements]);

  // Todos os itens para a aba "Todos"
  const allItems = useMemo(() => {
    const items: { type: string; date: Date; data: any }[] = [];

    if (upcomingWebinars) {
      upcomingWebinars.forEach((w: any) => items.push({
        type: "upcoming_webinar",
        date: new Date(w.eventDate),
        data: w,
      }));
    }

    if (activeAnnouncements) {
      activeAnnouncements.forEach((a: any) => items.push({
        type: "announcement",
        date: new Date(a.publishAt || a.createdAt),
        data: a,
      }));
    }

    // Sort: upcoming webinars first (by date asc), then announcements (by priority desc, date desc)
    return items.sort((a, b) => {
      if (a.type === "upcoming_webinar" && b.type !== "upcoming_webinar") return -1;
      if (a.type !== "upcoming_webinar" && b.type === "upcoming_webinar") return 1;
      if (a.type === "upcoming_webinar" && b.type === "upcoming_webinar") {
        return a.date.getTime() - b.date.getTime();
      }
      return b.date.getTime() - a.date.getTime();
    });
  }, [upcomingWebinars, activeAnnouncements]);

  const firstName = user?.name?.split(" ")[0] || "Aluno";

  // Early return para loading
  if (isLoading) {
    return (
      <AlunoLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B3A5D] mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Carregando novidades...</p>
          </div>
        </div>
      </AlunoLayout>
    );
  }

  const nextWebinar = upcomingWebinars && upcomingWebinars.length > 0 ? upcomingWebinars[0] : null;
  const remainingUpcoming = upcomingWebinars ? upcomingWebinars.slice(1) : [];

  return (
    <AlunoLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Olá, <span className="text-[#E87722]">{firstName}</span>!
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Confira as novidades, webinars e atividades do seu programa
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <CalendarDays className="h-4 w-4" />
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* Hero Banner - Próximo Webinar */}
        {nextWebinar && <HeroBanner webinar={nextWebinar} />}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Video className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{(upcomingWebinars?.length || 0)}</p>
                <p className="text-[10px] text-blue-600/70 font-medium">Webinars Próximos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">{announcementsByType.courses.length}</p>
                <p className="text-[10px] text-purple-600/70 font-medium">Cursos Disponíveis</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{announcementsByType.activities.length}</p>
                <p className="text-[10px] text-emerald-600/70 font-medium">Atividades Extras</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{announcementsByType.notices.length + announcementsByType.news.length}</p>
                <p className="text-[10px] text-amber-600/70 font-medium">Avisos e Novidades</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-100 p-1 h-auto flex-wrap">
            <TabsTrigger value="todos" className="text-xs data-[state=active]:bg-white">
              <Globe className="h-3.5 w-3.5 mr-1.5" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="webinars" className="text-xs data-[state=active]:bg-white">
              <Video className="h-3.5 w-3.5 mr-1.5" />
              Webinars
            </TabsTrigger>
            <TabsTrigger value="cursos" className="text-xs data-[state=active]:bg-white">
              <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
              Cursos
            </TabsTrigger>
            <TabsTrigger value="atividades" className="text-xs data-[state=active]:bg-white">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Atividades
            </TabsTrigger>
            <TabsTrigger value="avisos" className="text-xs data-[state=active]:bg-white">
              <Bell className="h-3.5 w-3.5 mr-1.5" />
              Avisos
            </TabsTrigger>
            <TabsTrigger value="gravacoes" className="text-xs data-[state=active]:bg-white">
              <Youtube className="h-3.5 w-3.5 mr-1.5" />
              Gravações
            </TabsTrigger>
          </TabsList>

          {/* TAB: TODOS */}
          <TabsContent value="todos" className="mt-4 space-y-3">
            {allItems.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Nenhuma novidade no momento"
                description="Fique atento! Em breve teremos novos conteúdos e eventos para você."
              />
            ) : (
              allItems.map((item, idx) => (
                item.type === "upcoming_webinar" ? (
                  <WebinarCard key={`uw-${item.data.id}`} webinar={item.data} variant="upcoming" />
                ) : (
                  <AnnouncementCard key={`ann-${item.data.id}`} announcement={item.data} />
                )
              ))
            )}
          </TabsContent>

          {/* TAB: WEBINARS */}
          <TabsContent value="webinars" className="mt-4 space-y-6">
            {/* Próximos */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Próximos Webinars
              </h3>
              {upcomingWebinars && upcomingWebinars.length > 0 ? (
                <div className="space-y-3">
                  {upcomingWebinars.map((w: any) => (
                    <WebinarCard key={w.id} webinar={w} variant="upcoming" />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Video}
                  title="Nenhum webinar agendado"
                  description="Novos webinars serão publicados em breve."
                />
              )}
            </div>
          </TabsContent>

          {/* TAB: CURSOS */}
          <TabsContent value="cursos" className="mt-4 space-y-3">
            {announcementsByType.courses.length > 0 ? (
              announcementsByType.courses.map((a: any) => (
                <AnnouncementCard key={a.id} announcement={a} />
              ))
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="Nenhum curso disponível"
                description="Novos cursos serão divulgados aqui quando disponíveis."
              />
            )}
          </TabsContent>

          {/* TAB: ATIVIDADES */}
          <TabsContent value="atividades" className="mt-4 space-y-3">
            {announcementsByType.activities.length > 0 ? (
              announcementsByType.activities.map((a: any) => (
                <AnnouncementCard key={a.id} announcement={a} />
              ))
            ) : (
              <EmptyState
                icon={Zap}
                title="Nenhuma atividade extra"
                description="Atividades extras serão publicadas aqui quando disponíveis."
              />
            )}
          </TabsContent>

          {/* TAB: AVISOS */}
          <TabsContent value="avisos" className="mt-4 space-y-3">
            {(announcementsByType.notices.length + announcementsByType.news.length) > 0 ? (
              [...announcementsByType.notices, ...announcementsByType.news].map((a: any) => (
                <AnnouncementCard key={a.id} announcement={a} />
              ))
            ) : (
              <EmptyState
                icon={Bell}
                title="Nenhum aviso"
                description="Avisos e comunicados aparecerão aqui."
              />
            )}
          </TabsContent>

          {/* TAB: GRAVAÇÕES */}
          <TabsContent value="gravacoes" className="mt-4 space-y-3">
            {pastWebinars && pastWebinars.length > 0 ? (
              <div className="space-y-3">
                {pastWebinars.map((w: any) => (
                  <WebinarCard key={w.id} webinar={w} variant="past" />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Youtube}
                title="Nenhuma gravação disponível"
                description="As gravações dos webinars realizados aparecerão aqui."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AlunoLayout>
  );
}
