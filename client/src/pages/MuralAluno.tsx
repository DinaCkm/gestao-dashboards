import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Video, Calendar, Clock, ExternalLink, Youtube, Bell,
  Sparkles, GraduationCap, Zap, ChevronRight,
  Info, CalendarDays, Users, Star, Loader2,
  CheckCircle2, AlertTriangle, MessageSquareText, HandHeart,
  ArrowLeft, Send, BookOpen, TrendingUp
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

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

function daysUntil(dateStr: string | Date | null | undefined): number {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ============================================================
// VIEW TYPES
// ============================================================

type ViewType = "home" | "webinars" | "cursos" | "atividades" | "avisos";

const VIEW_CONFIG: Record<Exclude<ViewType, "home">, {
  title: string;
  icon: any;
  emptyTitle: string;
  emptyDesc: string;
}> = {
  webinars: {
    title: "Próximos Webinars",
    icon: Video,
    emptyTitle: "Nenhum webinar agendado",
    emptyDesc: "Novos webinars serão publicados em breve.",
  },

  cursos: {
    title: "Cursos Disponíveis",
    icon: GraduationCap,
    emptyTitle: "Nenhum curso disponível",
    emptyDesc: "Novos cursos serão divulgados aqui quando disponíveis.",
  },
  atividades: {
    title: "Atividades Extras",
    icon: Zap,
    emptyTitle: "Nenhuma atividade extra",
    emptyDesc: "Atividades extras serão publicadas aqui quando disponíveis.",
  },
  avisos: {
    title: "Avisos e Novidades",
    icon: Bell,
    emptyTitle: "Nenhum aviso",
    emptyDesc: "Avisos e comunicados aparecerão aqui.",
  },

};

// ============================================================
// ATTENDANCE BANNER
// ============================================================

function AttendanceBanner() {
  return (
    <a
      href="/portal-aluno?tab=eventos"
      className="block relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
      <div className="relative flex items-center gap-4 p-4 sm:p-5">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 ring-4 ring-amber-200/50">
          <HandHeart className="h-6 w-6 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-900 text-sm sm:text-base group-hover:text-amber-700 transition-colors">
            Clique aqui e veja se não tem eventos pendentes
          </h3>
        </div>
        <ChevronRight className="h-5 w-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
      </div>
    </a>
  );
}



// ============================================================
// STAT CARD (clickable)
// ============================================================

function StatCard({
  icon: Icon,
  count,
  label,
  gradientFrom,
  gradientBorder,
  iconBg,
  iconColor,
  countColor,
  labelColor,
  onClick,
}: {
  icon: any;
  count: number;
  label: string;
  gradientFrom: string;
  gradientBorder: string;
  iconBg: string;
  iconColor: string;
  countColor: string;
  labelColor: string;
  onClick: () => void;
}) {
  return (
    <Card
      className={`bg-gradient-to-br ${gradientFrom} to-white ${gradientBorder} cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group`}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-2xl font-bold ${countColor}`}>{count}</p>
            <p className={`text-[11px] ${labelColor} font-medium leading-tight`}>{label}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// WEBINAR LIST ITEM (for drill-down views)
// ============================================================

function WebinarListItem({
  webinar,
  variant,
  attendanceStatus,
  onMarkPresence,
}: {
  webinar: any;
  variant: "upcoming" | "past";
  attendanceStatus?: "confirmed" | "pending" | null;
  onMarkPresence?: () => void;
}) {
  const isPast = variant === "past";
  const eventEndDate = webinar.endDate || webinar.eventDate;
  const hasEnded = eventEndDate ? new Date(eventEndDate) < new Date() : isPast;
  const days = daysUntil(webinar.eventDate);

  return (
    <div className={`rounded-xl border bg-white hover:shadow-md transition-all duration-200 overflow-hidden ${
      !isPast ? "border-l-4 border-l-[#F5991F]" : ""
    }`}>
      <div className="flex flex-col sm:flex-row">
        {webinar.cardImageUrl && (
          <div className="sm:w-44 h-36 sm:h-auto flex-shrink-0">
            <img
              src={webinar.cardImageUrl}
              alt={webinar.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 p-4 sm:p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base line-clamp-1">
                {webinar.title}
              </h3>
              {webinar.theme && (
                <span className="text-xs text-gray-500">{webinar.theme}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {attendanceStatus === "confirmed" && (
                <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-0.5" />
                  Presença confirmada
                </Badge>
              )}
              {attendanceStatus === "pending" && isPast && hasEnded && (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-0.5" />
                  Presença pendente
                </Badge>
              )}
              {!isPast && days >= 0 && days <= 3 && (
                <Badge className="bg-red-50 text-red-600 border-red-200 text-xs animate-pulse">
                  {days === 0 ? "Hoje!" : `Em ${days} dia${days > 1 ? "s" : ""}`}
                </Badge>
              )}
              {!isPast && days > 3 && (
                <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                  Próximo
                </Badge>
              )}
            </div>
          </div>

          {webinar.description && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-3">{webinar.description}</p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 text-[#0A1E3E]" />
              {formatDateTime(webinar.eventDate)}
            </span>
            {webinar.speaker && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-[#0A1E3E]" />
                {webinar.speaker}
              </span>
            )}
            {webinar.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#0A1E3E]" />
                {webinar.duration}min
              </span>
            )}
          </div>

          {/* ACTION BUTTONS - sempre visíveis para gravações */}
          <div className="flex flex-wrap gap-2">
            {!isPast && webinar.meetingLink && (
              <Button
                size="sm"
                className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white h-9 px-4"
                onClick={() => window.open(webinar.meetingLink, "_blank")}
              >
                <Video className="h-4 w-4 mr-1.5" />
                Participar ao Vivo
              </Button>
            )}

            {isPast && (
              <Button
                size="sm"
                className={webinar.youtubeLink
                  ? "bg-red-600 hover:bg-red-700 text-white h-9 px-4"
                  : "bg-gray-300 text-gray-500 h-9 px-4 cursor-not-allowed"
                }
                disabled={!webinar.youtubeLink}
                onClick={() => webinar.youtubeLink && window.open(webinar.youtubeLink, "_blank")}
              >
                <Youtube className="h-4 w-4 mr-1.5" />
                {webinar.youtubeLink ? "Assistir Gravação" : "Link em breve"}
              </Button>
            )}

            {isPast && hasEnded && attendanceStatus === "confirmed" && (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md h-9 px-4">
                <CheckCircle2 className="h-4 w-4" />
                Presença já confirmada
              </span>
            )}

            {isPast && hasEnded && onMarkPresence && attendanceStatus !== "confirmed" && (
              <Button
                size="sm"
                className="bg-[#F5991F] hover:bg-[#F5991F]/90 text-white h-9 px-4"
                onClick={onMarkPresence}
              >
                <MessageSquareText className="h-4 w-4 mr-1.5" />
                Marcar Presença
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ANNOUNCEMENT LIST ITEM
// ============================================================

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  webinar: { label: "Webinar", icon: Video, color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  course: { label: "Curso", icon: GraduationCap, color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200" },
  activity: { label: "Atividade Extra", icon: Zap, color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200" },
  notice: { label: "Aviso", icon: Bell, color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200" },
  news: { label: "Novidade", icon: Sparkles, color: "text-rose-700", bgColor: "bg-rose-50 border-rose-200" },
};

function AnnouncementListItem({ announcement }: { announcement: any }) {
  const config = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.notice;
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border bg-white hover:shadow-md transition-all duration-200 overflow-hidden ${config.bgColor}`}>
      <div className="flex items-start gap-4 p-4 sm:p-5">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm">
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
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
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
                className="text-xs h-7 text-[#0A1E3E] hover:text-[#F5991F]"
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
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

// ============================================================
// NEXT WEBINAR HIGHLIGHT (compact, for home view)
// ============================================================

function NextWebinarHighlight({ webinar }: { webinar: any }) {
  const days = daysUntil(webinar.eventDate);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A1E3E] via-[#0A1E3E] to-[#061529] text-white shadow-xl">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5991F] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="relative flex flex-col lg:flex-row items-center gap-6 p-6 lg:p-8">
        {webinar.cardImageUrl ? (
          <div className="w-full lg:w-72 flex-shrink-0">
            <img
              src={webinar.cardImageUrl}
              alt={webinar.title}
              className="w-full h-44 lg:h-48 object-cover rounded-xl shadow-lg"
            />
          </div>
        ) : (
          <div className="w-full lg:w-72 h-44 lg:h-48 flex-shrink-0 rounded-xl bg-white/10 flex items-center justify-center">
            <Video className="h-16 w-16 text-white/30" />
          </div>
        )}

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-[#F5991F] text-white border-0 px-3 py-1 text-xs font-semibold">
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
            <p className="text-white/70 text-sm line-clamp-2">{webinar.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-[#F5991F]" />
              {formatDate(webinar.eventDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#F5991F]" />
              {formatTimeOnly(webinar.eventDate)}
            </span>
            {webinar.speaker && (
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#F5991F]" />
                {webinar.speaker}
              </span>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            {webinar.meetingLink && (
              <Button
                className="bg-[#F5991F] hover:bg-[#F5991F]/90 text-white shadow-lg"
                onClick={() => window.open(webinar.meetingLink, "_blank")}
              >
                <Video className="h-4 w-4 mr-2" />
                Participar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DRILL-DOWN VIEW HEADER
// ============================================================

function DrillDownHeader({
  viewType,
  onBack,
  count,
}: {
  viewType: Exclude<ViewType, "home">;
  onBack: () => void;
  count: number;
}) {
  const config = VIEW_CONFIG[viewType];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="h-9 px-3 text-gray-600 hover:text-[#0A1E3E] hover:bg-[#0A1E3E]/5"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar
      </Button>
      <div className="h-6 w-px bg-gray-200" />
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#0A1E3E]" />
        <h2 className="text-lg font-bold text-gray-900">{config.title}</h2>
        <Badge variant="outline" className="text-xs">{count}</Badge>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function MuralAluno() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>("home");


  // Data hooks
  const { data: upcomingWebinars, isLoading: loadingUpcoming } = trpc.webinars.upcoming.useQuery({ limit: 20 });
  const { data: pastWebinars, isLoading: loadingPast } = trpc.webinars.past.useQuery({ limit: 50 });
  const { data: activeAnnouncements, isLoading: loadingAnnouncements } = trpc.announcements.active.useQuery();
  const { data: pendingAttendance, refetch: refetchPending } = trpc.attendance.pending.useQuery();
  const { data: myAttendance, refetch: refetchMyAttendance } = trpc.attendance.myAttendance.useQuery();



  const isLoading = loadingUpcoming || loadingPast || loadingAnnouncements;

  // Confirmed scheduled webinar IDs (mapeados de events -> scheduled_webinars)
  const confirmedWebinarIds = useMemo(() => {
    if (!myAttendance) return new Set<number>();
    return new Set(
      myAttendance
        .filter((a: any) => a.scheduledWebinarId != null)
        .map((a: any) => a.scheduledWebinarId)
    );
  }, [myAttendance]);

  // Announcements by type
  const announcementsByType = useMemo(() => {
    if (!activeAnnouncements) return { courses: [], activities: [], notices: [], news: [] };
    return {
      courses: activeAnnouncements.filter((a: any) => a.type === "course"),
      activities: activeAnnouncements.filter((a: any) => a.type === "activity"),
      notices: activeAnnouncements.filter((a: any) => a.type === "notice"),
      news: activeAnnouncements.filter((a: any) => a.type === "news"),
    };
  }, [activeAnnouncements]);

  const firstName = user?.name?.split(" ")[0] || "Aluno";
  const pendingCount = pendingAttendance?.length || 0;

  const getAttendanceStatus = (webinarId: number): "confirmed" | "pending" | null => {
    // Comparar com scheduledWebinarId (mapeado de events -> scheduled_webinars)
    if (confirmedWebinarIds.has(webinarId)) return "confirmed";
    // pending também retorna scheduledWebinarId agora
    if (pendingAttendance?.some((p: any) => p.scheduledWebinarId === webinarId)) return "pending";
    return null;
  };

  // Loading state
  if (isLoading) {
    return (
      <AlunoLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#0A1E3E] mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Carregando novidades...</p>
          </div>
        </div>
      </AlunoLayout>
    );
  }

  const nextWebinar = upcomingWebinars && upcomingWebinars.length > 0 ? upcomingWebinars[0] : null;

  // ============================================================
  // HOME VIEW - Cards + Banner + Next Webinar
  // ============================================================

  if (currentView === "home") {
    return (
      <AlunoLayout>
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Logo + Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png"
                alt="eco do bem"
                className="h-14 object-contain hidden sm:block"
              />
              <div className="hidden sm:block w-px h-10 bg-gray-200" />
              <div>
                <h1 className="text-2xl font-bold text-[#0A1E3E]">
                  Olá, <span className="text-[#F5991F]">{firstName}</span>!
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Confira as novidades, webinars e atividades do seu programa
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <CalendarDays className="h-4 w-4" />
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          {/* Attendance Banner - redireciona para Portal do Aluno aba Eventos */}
          <AttendanceBanner />

          {/* Card ECO_EVOLUIR - apenas para SEBRAE TO (programId=17) */}
          {user?.programId === 17 && (
          <a
            href="https://www.evoluirckm.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block relative overflow-hidden rounded-2xl border border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A1E3E] via-[#0A1E3E]/95 to-[#0A1E3E]/80" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
            <div className="relative flex items-center gap-5 p-5 sm:p-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 backdrop-blur-sm ring-2 ring-amber-400/30 shadow-lg">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_evoluir_logo_00dbbab4.png"
                  alt="ECO_EVOLUIR"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Plataforma de Desenvolvimento</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                  ECO_EVOLUIR
                </h3>
                <p className="text-sm text-gray-300">
                  Acesse aqui e realize seu PDI
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center group-hover:bg-amber-400 transition-colors shadow-lg">
                  <ExternalLink className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </a>
          )}

          {/* Card B.E.M. - Área de Aulas */}
          <a
            href="https://sebraeto.competenciasdobem.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="block relative overflow-hidden rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white via-blue-50/80 to-amber-50/60" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
            <div className="relative flex items-center gap-5 p-5 sm:p-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white ring-2 ring-blue-100 shadow-lg p-2">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png"
                  alt="eco do bem"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#0A1E3E]">Plataforma de Aprendizagem</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0A1E3E] mb-1">
                  B.E.M. - Área de Aulas
                </h3>
                <p className="text-sm text-gray-600">
                  Acesse a área de aulas e conteúdos do programa
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#0A1E3E] flex items-center justify-center group-hover:bg-[#0A1E3E]/80 transition-colors shadow-lg">
                  <ExternalLink className="h-5 w-5 text-amber-400" />
                </div>
              </div>
            </div>
          </a>

          {/* Next Webinar Highlight */}
          {nextWebinar && <NextWebinarHighlight webinar={nextWebinar} />}

          {/* Stat Cards - Click to drill down */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Explore por Categoria
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard
                icon={Video}
                count={upcomingWebinars?.length || 0}
                label="Webinars Próximos"
                gradientFrom="from-blue-50"
                gradientBorder="border-blue-100"
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                countColor="text-blue-700"
                labelColor="text-blue-600/70"
                onClick={() => setCurrentView("webinars")}
              />

              <StatCard
                icon={GraduationCap}
                count={announcementsByType.courses.length}
                label="Cursos Disponíveis"
                gradientFrom="from-purple-50"
                gradientBorder="border-purple-100"
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
                countColor="text-purple-700"
                labelColor="text-purple-600/70"
                onClick={() => setCurrentView("cursos")}
              />
              <StatCard
                icon={Zap}
                count={announcementsByType.activities.length}
                label="Atividades Extras"
                gradientFrom="from-emerald-50"
                gradientBorder="border-emerald-100"
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
                countColor="text-emerald-700"
                labelColor="text-emerald-600/70"
                onClick={() => setCurrentView("atividades")}
              />
              <StatCard
                icon={Bell}
                count={announcementsByType.notices.length + announcementsByType.news.length}
                label="Avisos e Novidades"
                gradientFrom="from-amber-50"
                gradientBorder="border-amber-100"
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
                countColor="text-amber-700"
                labelColor="text-amber-600/70"
                onClick={() => setCurrentView("avisos")}
              />

            </div>
          </div>


        </div>
      </AlunoLayout>
    );
  }

  // ============================================================
  // DRILL-DOWN VIEWS
  // ============================================================

  const renderDrillDownContent = () => {
    switch (currentView) {
      case "webinars":
        return (
          <>
            <DrillDownHeader viewType="webinars" onBack={() => setCurrentView("home")} count={upcomingWebinars?.length || 0} />
            {upcomingWebinars && upcomingWebinars.length > 0 ? (
              <div className="space-y-3">
                {upcomingWebinars.map((w: any) => (
                  <WebinarListItem key={w.id} webinar={w} variant="upcoming" />
                ))}
              </div>
            ) : (
              <EmptyState icon={Video} title={VIEW_CONFIG.webinars.emptyTitle} description={VIEW_CONFIG.webinars.emptyDesc} />
            )}
          </>
        );



      case "cursos":
        return (
          <>
            <DrillDownHeader viewType="cursos" onBack={() => setCurrentView("home")} count={announcementsByType.courses.length} />
            {announcementsByType.courses.length > 0 ? (
              <div className="space-y-3">
                {announcementsByType.courses.map((a: any) => (
                  <AnnouncementListItem key={a.id} announcement={a} />
                ))}
              </div>
            ) : (
              <EmptyState icon={GraduationCap} title={VIEW_CONFIG.cursos.emptyTitle} description={VIEW_CONFIG.cursos.emptyDesc} />
            )}
          </>
        );

      case "atividades":
        return (
          <>
            <DrillDownHeader viewType="atividades" onBack={() => setCurrentView("home")} count={announcementsByType.activities.length} />
            {announcementsByType.activities.length > 0 ? (
              <div className="space-y-3">
                {announcementsByType.activities.map((a: any) => (
                  <AnnouncementListItem key={a.id} announcement={a} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Zap} title={VIEW_CONFIG.atividades.emptyTitle} description={VIEW_CONFIG.atividades.emptyDesc} />
            )}
          </>
        );

      case "avisos": {
        const allNotices = [...announcementsByType.notices, ...announcementsByType.news];
        return (
          <>
            <DrillDownHeader viewType="avisos" onBack={() => setCurrentView("home")} count={allNotices.length} />
            {allNotices.length > 0 ? (
              <div className="space-y-3">
                {allNotices.map((a: any) => (
                  <AnnouncementListItem key={a.id} announcement={a} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Bell} title={VIEW_CONFIG.avisos.emptyTitle} description={VIEW_CONFIG.avisos.emptyDesc} />
            )}
          </>
        );
      }

      default:
        return null;
    }
  };

  return (
    <AlunoLayout>
      <div className="animate-in fade-in duration-300">


        {renderDrillDownContent()}
      </div>
    </AlunoLayout>
  );
}
