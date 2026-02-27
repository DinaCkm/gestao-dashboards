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
  ArrowLeft, Send
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

function daysUntil(dateStr: string | Date | null | undefined): number {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ============================================================
// VIEW TYPES
// ============================================================

type ViewType = "home" | "webinars" | "gravacoes" | "cursos" | "atividades" | "avisos";

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
  gravacoes: {
    title: "Gravações Disponíveis",
    icon: Youtube,
    emptyTitle: "Nenhuma gravação disponível",
    emptyDesc: "As gravações dos webinars realizados aparecerão aqui.",
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

function AttendanceBanner({ pendingCount, onOpenModal }: { pendingCount: number; onOpenModal: () => void }) {
  if (pendingCount === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 shadow-sm">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
      <div className="relative flex items-center gap-4 p-4 sm:p-5">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 ring-4 ring-amber-200/50">
          <HandHeart className="h-6 w-6 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-900 text-sm sm:text-base">
            Não deixe de marcar sua presença!
          </h3>
          <p className="text-xs sm:text-sm text-amber-700/80 mt-0.5">
            Você tem <strong>{pendingCount} evento{pendingCount > 1 ? "s" : ""}</strong> pendente{pendingCount > 1 ? "s" : ""} de confirmação.
          </p>
        </div>
        <Button
          onClick={onOpenModal}
          className="bg-amber-600 hover:bg-amber-700 text-white shadow-md flex-shrink-0"
          size="sm"
        >
          <MessageSquareText className="h-4 w-4 mr-1.5" />
          Marcar Presença
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// ATTENDANCE MODAL
// ============================================================

function AttendanceModal({
  open,
  onOpenChange,
  pendingWebinars,
  onMarkPresence,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingWebinars: any[];
  onMarkPresence: (eventId: number, reflexao: string) => void;
  isSubmitting: boolean;
}) {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [reflexao, setReflexao] = useState("");
  const [step, setStep] = useState<"list" | "reflexao">("list");

  const handleSelectEvent = (eventId: number) => {
    setSelectedEventId(eventId);
    setReflexao("");
    setStep("reflexao");
  };

  const handleBack = () => {
    setStep("list");
    setSelectedEventId(null);
    setReflexao("");
  };

  const handleSubmit = () => {
    if (!selectedEventId || reflexao.trim().length < 20) {
      toast.error("A reflexão deve ter pelo menos 20 caracteres.");
      return;
    }
    onMarkPresence(selectedEventId, reflexao.trim());
  };

  const selectedEvent = pendingWebinars.find((w: any) => w.eventId === selectedEventId);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setStep("list"); setSelectedEventId(null); setReflexao(""); } }}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1B3A5D]">
            <CheckCircle2 className="h-5 w-5 text-[#E87722]" />
            {step === "list" ? "Confirmar Presença em Eventos" : "Registrar Presença e Reflexão"}
          </DialogTitle>
          <DialogDescription className="text-left">
            {step === "list"
              ? "Selecione o evento para registrar sua presença e compartilhar sua reflexão."
              : `Evento: ${selectedEvent?.eventName || ""}`
            }
          </DialogDescription>
        </DialogHeader>

        {step === "list" && (
          <div className="space-y-3 mt-2">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                  Antes de registrar sua presença, compartilhe conosco suas percepções e insights sobre o evento.
                  Lembre-se: a participação nos webinars é uma oportunidade valiosa para o seu desenvolvimento
                  profissional e pessoal — o verdadeiro ganho está no aprendizado, não apenas no registro de presença.
                  Registrar presença sem ter participado de fato significa abrir mão de uma oportunidade real de
                  crescimento. <strong>O maior beneficiado — ou prejudicado — por essa escolha é você.</strong>
                </p>
              </div>
            </div>

            {pendingWebinars.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900">Tudo em dia!</p>
                <p className="text-xs text-gray-500 mt-1">Você não tem eventos pendentes de confirmação.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingWebinars.map((w: any) => (
                  <button
                    key={w.eventId}
                    onClick={() => handleSelectEvent(w.eventId)}
                    className="w-full text-left rounded-lg border border-gray-200 hover:border-[#E87722] hover:bg-orange-50/50 p-3 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 group-hover:text-[#1B3A5D] truncate">
                          {w.eventName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(w.eventDate)}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#E87722] flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "reflexao" && selectedEvent && (
          <div className="space-y-4 mt-2">
            <div className="rounded-lg bg-gray-50 border p-3">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-[#1B3A5D]" />
                <span className="text-sm font-medium text-gray-900">{selectedEvent.eventName}</span>
              </div>
              <span className="text-xs text-gray-500 ml-6">{formatDate(selectedEvent.eventDate)}</span>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Compartilhe o que aprendeu, o que mais chamou sua atenção e como pretende aplicar no seu dia a dia.
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Sua reflexão sobre o evento <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={reflexao}
                onChange={(e) => setReflexao(e.target.value)}
                placeholder="Escreva aqui suas percepções, insights e aprendizados do evento..."
                className="min-h-[120px] resize-none"
                maxLength={2000}
              />
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${reflexao.length < 20 ? "text-red-500" : "text-green-600"}`}>
                  {reflexao.length < 20 ? `Mínimo 20 caracteres (${reflexao.length}/20)` : `${reflexao.length}/2000 caracteres`}
                </span>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button variant="outline" onClick={handleBack} className="flex-1 sm:flex-none">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={reflexao.trim().length < 20 || isSubmitting}
                className="flex-1 sm:flex-none bg-[#E87722] hover:bg-[#E87722]/90 text-white"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="h-4 w-4 mr-1" /> Confirmar Presença</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
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
      !isPast ? "border-l-4 border-l-[#E87722]" : ""
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
              <CalendarDays className="h-3.5 w-3.5 text-[#1B3A5D]" />
              {formatDateTime(webinar.eventDate)}
            </span>
            {webinar.speaker && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-[#1B3A5D]" />
                {webinar.speaker}
              </span>
            )}
            {webinar.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#1B3A5D]" />
                {webinar.duration}min
              </span>
            )}
          </div>

          {/* ACTION BUTTONS - sempre visíveis para gravações */}
          <div className="flex flex-wrap gap-2">
            {!isPast && webinar.meetingLink && (
              <Button
                size="sm"
                className="bg-[#1B3A5D] hover:bg-[#1B3A5D]/90 text-white h-9 px-4"
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
                className="bg-[#E87722] hover:bg-[#E87722]/90 text-white h-9 px-4"
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3A5D] via-[#1B3A5D] to-[#0D2240] text-white shadow-xl">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E87722] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
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
            <p className="text-white/70 text-sm line-clamp-2">{webinar.description}</p>
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
            {webinar.speaker && (
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#E87722]" />
                {webinar.speaker}
              </span>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            {webinar.meetingLink && (
              <Button
                className="bg-[#E87722] hover:bg-[#E87722]/90 text-white shadow-lg"
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
        className="h-9 px-3 text-gray-600 hover:text-[#1B3A5D] hover:bg-[#1B3A5D]/5"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar
      </Button>
      <div className="h-6 w-px bg-gray-200" />
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#1B3A5D]" />
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
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);

  // Data hooks
  const { data: upcomingWebinars, isLoading: loadingUpcoming } = trpc.webinars.upcoming.useQuery({ limit: 20 });
  const { data: pastWebinars, isLoading: loadingPast } = trpc.webinars.past.useQuery({ limit: 50 });
  const { data: activeAnnouncements, isLoading: loadingAnnouncements } = trpc.announcements.active.useQuery();
  const { data: pendingAttendance, refetch: refetchPending } = trpc.attendance.pending.useQuery();
  const { data: myAttendance, refetch: refetchMyAttendance } = trpc.attendance.myAttendance.useQuery();

  const markPresenceMutation = trpc.attendance.markPresence.useMutation({
    onSuccess: () => {
      toast.success("Presença registrada com sucesso! Obrigado pela sua reflexão.");
      setAttendanceModalOpen(false);
      refetchPending();
      refetchMyAttendance();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar presença. Tente novamente.");
    },
  });

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
            <Loader2 className="h-8 w-8 animate-spin text-[#1B3A5D] mx-auto mb-4" />
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

          {/* Attendance Banner */}
          <AttendanceBanner
            pendingCount={pendingCount}
            onOpenModal={() => setAttendanceModalOpen(true)}
          />

          {/* Attendance Modal */}
          <AttendanceModal
            open={attendanceModalOpen}
            onOpenChange={setAttendanceModalOpen}
            pendingWebinars={pendingAttendance || []}
            onMarkPresence={(eventId, reflexao) => markPresenceMutation.mutate({ eventId, reflexao })}
            isSubmitting={markPresenceMutation.isPending}
          />

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
                icon={Youtube}
                count={pastWebinars?.length || 0}
                label="Gravações Disponíveis"
                gradientFrom="from-red-50"
                gradientBorder="border-red-100"
                iconBg="bg-red-100"
                iconColor="text-red-600"
                countColor="text-red-700"
                labelColor="text-red-600/70"
                onClick={() => setCurrentView("gravacoes")}
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

          {/* Quick preview: recent recordings with pending attendance */}
          {pendingCount > 0 && pendingAttendance && pendingAttendance.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Pendentes de Presença
              </h2>
              <div className="space-y-3">
                {pendingAttendance.slice(0, 3).map((w: any) => (
                  <div
                    key={w.eventId}
                    className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Video className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{w.eventName}</h4>
                        <span className="text-xs text-gray-500">{formatDate(w.eventDate)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 ml-3">
                      {w.youtubeLink && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => window.open(w.youtubeLink, "_blank")}
                        >
                          <Youtube className="h-3.5 w-3.5 mr-1" />
                          Assistir
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-[#E87722] hover:bg-[#E87722]/90 text-white"
                        onClick={() => setAttendanceModalOpen(true)}
                      >
                        <MessageSquareText className="h-3.5 w-3.5 mr-1" />
                        Presença
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingAttendance.length > 3 && (
                  <button
                    onClick={() => setAttendanceModalOpen(true)}
                    className="w-full text-center text-sm text-[#E87722] hover:text-[#E87722]/80 font-medium py-2"
                  >
                    Ver todos os {pendingAttendance.length} eventos pendentes
                  </button>
                )}
              </div>
            </div>
          )}
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

      case "gravacoes":
        return (
          <>
            <DrillDownHeader viewType="gravacoes" onBack={() => setCurrentView("home")} count={pastWebinars?.length || 0} />
            {pastWebinars && pastWebinars.length > 0 ? (
              <div className="space-y-3">
                {pastWebinars.map((w: any) => (
                  <WebinarListItem
                    key={w.id}
                    webinar={w}
                    variant="past"
                    attendanceStatus={getAttendanceStatus(w.id)}
                    onMarkPresence={() => setAttendanceModalOpen(true)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState icon={Youtube} title={VIEW_CONFIG.gravacoes.emptyTitle} description={VIEW_CONFIG.gravacoes.emptyDesc} />
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
        {/* Attendance Modal (always available) */}
        <AttendanceModal
          open={attendanceModalOpen}
          onOpenChange={setAttendanceModalOpen}
          pendingWebinars={pendingAttendance || []}
          onMarkPresence={(eventId, reflexao) => markPresenceMutation.mutate({ eventId, reflexao })}
          isSubmitting={markPresenceMutation.isPending}
        />

        {renderDrillDownContent()}
      </div>
    </AlunoLayout>
  );
}
