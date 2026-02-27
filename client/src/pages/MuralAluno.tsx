import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Video, Calendar, Clock, ExternalLink, Youtube, Megaphone,
  BookOpen, Sparkles, Bell, ArrowRight, Users, Globe,
  GraduationCap, Zap, ChevronRight, PlayCircle, Info,
  CalendarDays, MapPin, Star, Loader2, CheckCircle2,
  AlertTriangle, MessageSquareText, Send, HandHeart
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
// ATTENDANCE BANNER - Aviso para marcar presença
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
            Você tem <strong>{pendingCount} evento{pendingCount > 1 ? "s" : ""}</strong> pendente{pendingCount > 1 ? "s" : ""} de confirmação de presença.
          </p>
        </div>
        <Button
          onClick={onOpenModal}
          className="bg-amber-600 hover:bg-amber-700 text-white shadow-md flex-shrink-0"
          size="sm"
        >
          <MessageSquareText className="h-4 w-4 mr-1.5" />
          Clique aqui
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// ATTENDANCE MODAL - Marcar presença com reflexão
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

  const selectedEvent = pendingWebinars.find(w => w.eventId === selectedEventId);

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
            {/* Alerta educativo */}
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

            {/* Lista de eventos pendentes */}
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
                          {w.hasParticipation && w.status === "presente" && (
                            <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                              Presença registrada (planilha)
                            </Badge>
                          )}
                          {w.hasParticipation && w.status === "ausente" && (
                            <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px]">
                              Ausente (planilha)
                            </Badge>
                          )}
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
            {/* Info do evento selecionado */}
            <div className="rounded-lg bg-gray-50 border p-3">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-[#1B3A5D]" />
                <span className="text-sm font-medium text-gray-900">{selectedEvent.eventName}</span>
              </div>
              <span className="text-xs text-gray-500 ml-6">{formatDate(selectedEvent.eventDate)}</span>
            </div>

            {/* Alerta educativo compacto */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Compartilhe suas percepções e insights sobre o evento. O verdadeiro ganho está no aprendizado.
                  <strong> O maior beneficiado — ou prejudicado — por essa escolha é você.</strong>
                </p>
              </div>
            </div>

            {/* Campo de reflexão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sua reflexão sobre o evento <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={reflexao}
                onChange={(e) => setReflexao(e.target.value)}
                placeholder="Compartilhe o que você aprendeu, quais insights levou deste evento e como pretende aplicar esse conhecimento no seu dia a dia..."
                className="min-h-[140px] resize-y"
                maxLength={2000}
              />
              <div className="flex justify-between mt-1.5">
                <span className={`text-xs ${reflexao.length < 20 ? "text-red-500" : "text-gray-400"}`}>
                  {reflexao.length < 20 ? `Mínimo 20 caracteres (faltam ${20 - reflexao.length})` : ""}
                </span>
                <span className="text-xs text-gray-400">{reflexao.length}/2000</span>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || reflexao.trim().length < 20}
                className="bg-[#1B3A5D] hover:bg-[#1B3A5D]/90 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Confirmar Presença
                  </>
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
// WEBINAR CARD (para lista) - com badge de presença
// ============================================================

function WebinarCard({
  webinar,
  variant = "upcoming",
  attendanceStatus,
  onMarkPresence,
}: {
  webinar: any;
  variant?: "upcoming" | "past";
  attendanceStatus?: "confirmed" | "pending" | null;
  onMarkPresence?: () => void;
}) {
  const isPast = variant === "past";
  // Verificar se o evento já terminou (endDate ou eventDate)
  const eventEndDate = webinar.endDate || webinar.eventDate;
  const hasEnded = eventEndDate ? new Date(eventEndDate) < new Date() : isPast;

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
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Badge de presença */}
              {attendanceStatus === "confirmed" && (
                <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-0.5" />
                  Presença confirmada
                </Badge>
              )}
              {attendanceStatus === "pending" && isPast && (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-0.5" />
                  Pendente
                </Badge>
              )}
              {/* Badge de status do evento */}
              {isPast && webinar.youtubeLink && !attendanceStatus && (
                <Badge className="bg-red-50 text-red-600 border-red-200 text-xs">
                  <PlayCircle className="h-3 w-3 mr-1" />
                  Gravação
                </Badge>
              )}
              {!isPast && !hasEnded && (
                <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                  Próximo
                </Badge>
              )}
              {!isPast && hasEnded && (
                <Badge className="bg-gray-50 text-gray-600 border-gray-200 text-xs">
                  Em andamento
                </Badge>
              )}
            </div>
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
            {isPast && hasEnded && attendanceStatus === "pending" && onMarkPresence && (
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8"
                onClick={onMarkPresence}
              >
                <MessageSquareText className="h-3 w-3 mr-1" />
                Marcar Presença
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
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);

  // Hooks - todos declarados no topo
  const { data: upcomingWebinars, isLoading: loadingUpcoming } = trpc.webinars.upcoming.useQuery({ limit: 20 });
  const { data: pastWebinars, isLoading: loadingPast } = trpc.webinars.past.useQuery({ limit: 20 });
  const { data: activeAnnouncements, isLoading: loadingAnnouncements } = trpc.announcements.active.useQuery();
  const { data: pendingAttendance, isLoading: loadingPending, refetch: refetchPending } = trpc.attendance.pending.useQuery();
  const { data: myAttendance, refetch: refetchMyAttendance } = trpc.attendance.myAttendance.useQuery();

  const utils = trpc.useUtils();

  const markPresenceMutation = trpc.attendance.markPresence.useMutation({
    onSuccess: () => {
      toast.success("Presença registrada com sucesso! Obrigado pela sua reflexão.");
      setAttendanceModalOpen(false);
      refetchPending();
      refetchMyAttendance();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar presença. Tente novamente.");
    },
  });

  const isLoading = loadingUpcoming || loadingPast || loadingAnnouncements;

  // Map de eventIds confirmados pelo aluno
  const confirmedEventIds = useMemo(() => {
    if (!myAttendance) return new Set<number>();
    return new Set(myAttendance.map((a: any) => a.eventId));
  }, [myAttendance]);

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
        date: new Date(w.eventDate || w.startDate),
        data: w,
      }));
    }

    // Incluir gravações recentes (webinars passados) na aba Todos
    if (pastWebinars) {
      pastWebinars.slice(0, 10).forEach((w: any) => items.push({
        type: "past_webinar",
        date: new Date(w.eventDate || w.startDate),
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

    return items.sort((a, b) => {
      if (a.type === "upcoming_webinar" && b.type !== "upcoming_webinar") return -1;
      if (a.type !== "upcoming_webinar" && b.type === "upcoming_webinar") return 1;
      if (a.type === "upcoming_webinar" && b.type === "upcoming_webinar") {
        return a.date.getTime() - b.date.getTime();
      }
      return b.date.getTime() - a.date.getTime();
    });
  }, [upcomingWebinars, pastWebinars, activeAnnouncements]);

  const firstName = user?.name?.split(" ")[0] || "Aluno";
  const pendingCount = pendingAttendance?.length || 0;

  // Determinar status de presença de um webinar
  const getAttendanceStatus = (webinarId: number): "confirmed" | "pending" | null => {
    if (confirmedEventIds.has(webinarId)) return "confirmed";
    if (pendingAttendance?.some((p: any) => p.eventId === webinarId)) return "pending";
    return null;
  };

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

        {/* Banner de Presença Pendente */}
        <AttendanceBanner
          pendingCount={pendingCount}
          onOpenModal={() => setAttendanceModalOpen(true)}
        />

        {/* Modal de Presença/Reflexão */}
        <AttendanceModal
          open={attendanceModalOpen}
          onOpenChange={setAttendanceModalOpen}
          pendingWebinars={pendingAttendance || []}
          onMarkPresence={(eventId, reflexao) => markPresenceMutation.mutate({ eventId, reflexao })}
          isSubmitting={markPresenceMutation.isPending}
        />

        {/* Hero Banner - Próximo Webinar */}
        {nextWebinar && <HeroBanner webinar={nextWebinar} />}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("webinars")}>
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
          <Card className="bg-gradient-to-br from-red-50 to-white border-red-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("gravacoes")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Youtube className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">{(pastWebinars?.length || 0)}</p>
                <p className="text-[10px] text-red-600/70 font-medium">Gravações Disponíveis</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("cursos")}>
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
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("atividades")}>
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
          <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("avisos")}>
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
                ) : item.type === "past_webinar" ? (
                  <WebinarCard
                    key={`pw-${item.data.id}`}
                    webinar={item.data}
                    variant="past"
                    attendanceStatus={getAttendanceStatus(item.data.id)}
                    onMarkPresence={() => setAttendanceModalOpen(true)}
                  />
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
                  <WebinarCard
                    key={w.id}
                    webinar={w}
                    variant="past"
                    attendanceStatus={getAttendanceStatus(w.id)}
                    onMarkPresence={() => setAttendanceModalOpen(true)}
                  />
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
