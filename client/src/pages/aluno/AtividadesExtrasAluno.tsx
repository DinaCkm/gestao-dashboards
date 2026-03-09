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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Zap,
  Search,
  Calendar,
  MapPin,
  Users,
  UserCheck,
  Clock,
  Monitor,
  Building2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type ActivityItem = {
  id: number;
  titulo: string;
  descricao: string | null;
  tipo: string;
  modalidade: string;
  dataInicio: string | null;
  dataFim: string | null;
  local: string | null;
  vagas: number | null;
  instrutor: string | null;
  imagemUrl: string | null;
  competenciaRelacionada: string | null;
  isActive: number;
};

const tipoLabels: Record<string, string> = {
  workshop: "Workshop",
  treinamento: "Treinamento",
  palestra: "Palestra",
  evento: "Evento",
  outro: "Outro",
};

const modalidadeLabels: Record<string, string> = {
  presencial: "Presencial",
  online: "Online",
  hibrido: "Híbrido",
};

const tipoBadgeColors: Record<string, string> = {
  workshop: "bg-blue-100 text-blue-800 border-blue-200",
  treinamento: "bg-green-100 text-green-800 border-green-200",
  palestra: "bg-purple-100 text-purple-800 border-purple-200",
  evento: "bg-orange-100 text-orange-800 border-orange-200",
  outro: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function AtividadesExtrasAluno() {
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Usa listForStudent que filtra por turma do aluno
  const { data: activitiesData, isLoading } = trpc.activities.listForStudent.useQuery();
  const utils = trpc.useUtils();

  const registerMutation = trpc.activities.register.useMutation({
    onSuccess: () => {
      toast.success("Inscrição realizada com sucesso!");
      utils.activities.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const unregisterMutation = trpc.activities.unregister.useMutation({
    onSuccess: () => {
      toast.success("Inscrição cancelada");
      utils.activities.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredActivities = useMemo(() => {
    if (!activitiesData) return [];
    return (activitiesData as ActivityItem[]).filter((a) => {
      if (filterTipo !== "all" && a.tipo !== filterTipo) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          a.titulo.toLowerCase().includes(s) ||
          (a.descricao && a.descricao.toLowerCase().includes(s)) ||
          (a.instrutor && a.instrutor.toLowerCase().includes(s))
        );
      }
      return true;
    });
  }, [activitiesData, search, filterTipo]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return filteredActivities.filter((a) => !a.dataInicio || new Date(a.dataInicio) >= now);
  }, [filteredActivities]);

  const past = useMemo(() => {
    const now = new Date();
    return filteredActivities.filter((a) => a.dataInicio && new Date(a.dataInicio) < now);
  }, [filteredActivities]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "A definir";
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return "A definir";
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const handleOpenDetail = (activity: ActivityItem) => {
    setSelectedActivity(activity);
    setShowDetailDialog(true);
  };

  if (isLoading) {
    return (
      <AlunoLayout>
        <div className="p-6 space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </AlunoLayout>
    );
  }

  return (
    <AlunoLayout>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-7 w-7 text-primary" />
          Atividades Extras
        </h1>
        <p className="text-muted-foreground mt-1">
          Workshops, treinamentos, palestras e eventos disponíveis para você
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar atividades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="workshop">Workshop</SelectItem>
            <SelectItem value="treinamento">Treinamento</SelectItem>
            <SelectItem value="palestra">Palestra</SelectItem>
            <SelectItem value="evento">Evento</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Upcoming Activities */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Próximas Atividades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onViewDetail={handleOpenDetail}
                onRegister={(id) => registerMutation.mutate({ activityId: id })}
                onUnregister={(id) => unregisterMutation.mutate({ activityId: id })}
                isRegistering={registerMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Activities */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Atividades Anteriores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {past.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                isPast
                onViewDetail={handleOpenDetail}
                onRegister={(id) => registerMutation.mutate({ activityId: id })}
                onUnregister={(id) => unregisterMutation.mutate({ activityId: id })}
                isRegistering={registerMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredActivities.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhuma atividade disponível no momento</p>
            <p className="text-sm text-muted-foreground mt-1">Novas atividades serão publicadas em breve</p>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      {selectedActivity && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedActivity.titulo}
              </DialogTitle>
              <DialogDescription>
                Detalhes da atividade
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${tipoBadgeColors[selectedActivity.tipo]}`}>
                  {tipoLabels[selectedActivity.tipo]}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {modalidadeLabels[selectedActivity.modalidade]}
                </span>
              </div>

              {selectedActivity.descricao && (
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedActivity.descricao}</p>
              )}

              <div className="space-y-2 text-sm">
                {selectedActivity.dataInicio && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Início:</strong> {formatDate(selectedActivity.dataInicio)}</span>
                  </div>
                )}
                {selectedActivity.dataFim && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Término:</strong> {formatDate(selectedActivity.dataFim)}</span>
                  </div>
                )}
                {selectedActivity.local && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Local:</strong> {selectedActivity.local}</span>
                  </div>
                )}
                {selectedActivity.instrutor && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Instrutor:</strong> {selectedActivity.instrutor}</span>
                  </div>
                )}
                {selectedActivity.vagas && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Vagas:</strong> {selectedActivity.vagas}</span>
                  </div>
                )}
                {selectedActivity.competenciaRelacionada && (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Competência:</strong> {selectedActivity.competenciaRelacionada}</span>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
    </AlunoLayout>
  );
}

// Sub-component: Card de atividade
function ActivityCard({
  activity,
  isPast,
  onViewDetail,
  onRegister,
  onUnregister,
  isRegistering,
}: {
  activity: ActivityItem;
  isPast?: boolean;
  onViewDetail: (a: ActivityItem) => void;
  onRegister: (id: number) => void;
  onUnregister: (id: number) => void;
  isRegistering: boolean;
}) {
  const { data: myRegistration } = trpc.activities.myRegistration.useQuery({ activityId: activity.id });
  const { data: regCount } = trpc.activities.countRegistrations.useQuery({ activityId: activity.id });

  const isRegistered = !!myRegistration && (myRegistration as any).status !== "cancelado";
  const vagasRestantes = activity.vagas ? activity.vagas - (regCount as number || 0) : null;
  const esgotado = vagasRestantes !== null && vagasRestantes <= 0 && !isRegistered;

  const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return "A definir";
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${isPast ? "opacity-70" : ""}`}>
      {/* Color bar based on type */}
      <div className={`h-1.5 ${
        activity.tipo === "workshop" ? "bg-blue-500" :
        activity.tipo === "treinamento" ? "bg-green-500" :
        activity.tipo === "palestra" ? "bg-purple-500" :
        activity.tipo === "evento" ? "bg-orange-500" :
        "bg-gray-400"
      }`} />
      <CardContent className="pt-4 space-y-3">
        {/* Type & Modalidade badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoBadgeColors[activity.tipo]}`}>
            {tipoLabels[activity.tipo]}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1">
            {activity.modalidade === "presencial" ? <Building2 className="h-3 w-3" /> : 
             activity.modalidade === "online" ? <Monitor className="h-3 w-3" /> :
             <><Building2 className="h-2.5 w-2.5" /><Monitor className="h-2.5 w-2.5" /></>}
            {modalidadeLabels[activity.modalidade]}
          </span>
          {isPast && <Badge variant="secondary" className="text-xs">Encerrada</Badge>}
        </div>

        {/* Title */}
        <h3 className="font-semibold line-clamp-2">{activity.titulo}</h3>

        {/* Details */}
        <div className="space-y-1.5 text-sm text-muted-foreground">
          {activity.dataInicio && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{formatShortDate(activity.dataInicio)}</span>
            </div>
          )}
          {activity.local && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{activity.local}</span>
            </div>
          )}
          {activity.instrutor && (
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 shrink-0" />
              <span>{activity.instrutor}</span>
            </div>
          )}
          {activity.vagas && (
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>
                {vagasRestantes !== null && vagasRestantes > 0
                  ? `${vagasRestantes} vaga${vagasRestantes !== 1 ? "s" : ""} restante${vagasRestantes !== 1 ? "s" : ""}`
                  : esgotado
                  ? "Vagas esgotadas"
                  : `${activity.vagas} vagas`}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewDetail(activity)}>
            Ver Detalhes
          </Button>
          {!isPast && (
            isRegistered ? (
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 gap-1"
                onClick={() => onUnregister(activity.id)}
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancelar
              </Button>
            ) : (
              <Button
                size="sm"
                className="flex-1 gap-1"
                onClick={() => onRegister(activity.id)}
                disabled={esgotado || isRegistering}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {esgotado ? "Esgotado" : "Inscrever-se"}
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
