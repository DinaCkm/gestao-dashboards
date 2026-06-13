import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Pencil,
  X,
  CheckCheck,
  Loader2,
  ClipboardList,
} from "lucide-react";

type WebinarTaskStatus =
  | "pending"
  | "in_progress"
  | "waiting_delivery"
  | "waiting_approval"
  | "adjustment_requested"
  | "approved"
  | "completed"
  | "cancelled";

const STATUS_LABELS: Record<WebinarTaskStatus, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  waiting_delivery: "Aguardando entrega",
  waiting_approval: "Aguardando aprovação",
  adjustment_requested: "Ajuste solicitado",
  approved: "Aprovado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<WebinarTaskStatus, string> = {
  pending: "bg-gray-100 text-gray-700 border-gray-300",
  in_progress: "bg-blue-100 text-blue-700 border-blue-300",
  waiting_delivery: "bg-yellow-100 text-yellow-700 border-yellow-300",
  waiting_approval: "bg-purple-100 text-purple-700 border-purple-300",
  adjustment_requested: "bg-orange-100 text-orange-700 border-orange-300",
  approved: "bg-teal-100 text-teal-700 border-teal-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
};

const ROLE_LABELS: Record<string, string> = {
  organizacao: "Organização",
  marketing: "Marketing",
  administrativo: "Administrativo",
  coordenacao: "Coordenação",
  palestrante: "Palestrante",
  solicitante: "Solicitante",
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR");
}

function isOverdue(dueDate: string, status: WebinarTaskStatus): boolean {
  if (status === "completed" || status === "cancelled") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  return due < today;
}

function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface EditResponsibleState {
  taskId: number;
  name: string;
  email: string;
}

interface Props {
  webinarId: number;
  webinarTitle: string;
  open: boolean;
  onClose: () => void;
}

export default function WebinarChecklistModal({ webinarId, webinarTitle, open, onClose }: Props) {
  const [editingResponsible, setEditingResponsible] = useState<EditResponsibleState | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [sendingReminderId, setSendingReminderId] = useState<number | null>(null);

  const { data: tasks, isLoading, refetch } = trpc.webinarTasks.listByWebinar.useQuery(
    { webinarId },
    { enabled: open }
  );

  const { data: summary } = trpc.webinarTasks.getSummaryByWebinar.useQuery(
    { webinarId },
    { enabled: open }
  );

  const updateStatusMutation = trpc.webinarTasks.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      setUpdatingStatusId(null);
      refetch();
    },
    onError: (err) => {
      toast.error(`Erro: ${err.message}`);
      setUpdatingStatusId(null);
    },
  });

  const updateResponsibleMutation = trpc.webinarTasks.updateResponsible.useMutation({
    onSuccess: () => {
      toast.success("Responsável atualizado!");
      setEditingResponsible(null);
      refetch();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const sendReminderMutation = trpc.webinarTasks.sendInternalReminder.useMutation({
    onSuccess: (data) => {
      if (data.emailSent) {
        toast.success(`Lembrete enviado para ${data.to}`);
      } else {
        toast.warning(`E-mail não enviado: ${data.error || "Verifique as configurações de SMTP"}`);
      }
      setSendingReminderId(null);
    },
    onError: (err) => {
      toast.error(`Erro: ${err.message}`);
      setSendingReminderId(null);
    },
  });

  const handleStatusChange = (taskId: number, status: WebinarTaskStatus) => {
    setUpdatingStatusId(taskId);
    updateStatusMutation.mutate({ taskId, status });
  };

  const handleSaveResponsible = () => {
    if (!editingResponsible) return;
    updateResponsibleMutation.mutate({
      taskId: editingResponsible.taskId,
      name: editingResponsible.name,
      email: editingResponsible.email,
    });
  };

  const handleSendReminder = (taskId: number) => {
    setSendingReminderId(taskId);
    sendReminderMutation.mutate({ taskId, webinarId });
  };

  const riskColor =
    summary?.riskLevel === "Alto"
      ? "bg-red-100 text-red-700 border-red-300"
      : summary?.riskLevel === "Médio"
      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
      : "bg-green-100 text-green-700 border-green-300";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="w-[95vw] max-w-[1200px] max-h-[92vh] overflow-hidden flex flex-col p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            Checklist Interno de Produção
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-foreground/70 font-medium truncate">
            {webinarTitle}
          </DialogDescription>

          {/* Summary bar */}
          {summary && (
            <div className="flex items-center gap-3 flex-wrap mt-3">
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">{summary.completed}</strong>/{summary.total} concluídas
              </span>
              {summary.overdue > 0 && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-xs gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {summary.overdue} atrasada{summary.overdue > 1 ? "s" : ""}
                </Badge>
              )}
              {summary.atRisk > 0 && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs gap-1">
                  <Clock className="h-3 w-3" />
                  {summary.atRisk} vencendo em breve
                </Badge>
              )}
              <Badge variant="outline" className={`text-xs ${riskColor}`}>
                Risco: {summary.riskLevel}
              </Badge>
            </div>
          )}
        </div>

        {/* Task table — scrollable body */}
        <div className="flex-1 overflow-y-auto overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !tasks || tasks.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-base">Nenhuma tarefa encontrada para este webinar.</p>
            </div>
          ) : (
            <table className="w-full text-sm" style={{ minWidth: "800px" }}>
              <thead className="sticky top-0 bg-background z-10 border-b shadow-sm">
                <tr className="text-left">
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground w-32">Prazo</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Tarefa</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground w-52">Responsável</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground w-52">Status</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground w-32 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task: any) => {
                  const overdue = isOverdue(task.dueDate, task.status);
                  const days = daysUntil(task.dueDate);
                  const isAtRisk =
                    task.status !== "completed" &&
                    task.status !== "cancelled" &&
                    days >= 0 &&
                    days <= 5;
                  const isDone =
                    task.status === "completed" || task.status === "cancelled";

                  return (
                    <tr
                      key={task.id}
                      className={`border-b transition-colors hover:bg-muted/30 ${
                        overdue && !isDone
                          ? "bg-red-50/60"
                          : isAtRisk
                          ? "bg-yellow-50/60"
                          : isDone
                          ? "bg-green-50/30"
                          : ""
                      }`}
                    >
                      {/* Prazo */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`font-semibold text-sm ${
                              overdue && !isDone
                                ? "text-red-600"
                                : isAtRisk
                                ? "text-yellow-700"
                                : "text-gray-700"
                            }`}
                          >
                            {formatDate(task.dueDate)}
                          </span>
                          {overdue && !isDone && (
                            <span className="text-xs text-red-500 font-bold">ATRASADA</span>
                          )}
                          {isAtRisk && (
                            <span className="text-xs text-yellow-600 font-medium">
                              {days === 0 ? "Hoje" : `${days}d`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tarefa */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-start gap-2">
                          {task.isCritical && (
                            <span className="text-red-500 text-sm mt-0.5 flex-shrink-0" title="Tarefa crítica">●</span>
                          )}
                          <div>
                            <p className={`font-semibold text-sm leading-snug ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                                {task.description}
                              </p>
                            )}
                            <span className="text-xs text-muted-foreground mt-1 block">
                              {ROLE_LABELS[task.responsibleRole] || task.responsibleRole}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Responsável */}
                      <td className="py-3 px-4 align-top">
                        {editingResponsible?.taskId === task.id ? (
                          <div className="space-y-1.5">
                            <Input
                              value={editingResponsible?.name ?? ""}
                              onChange={(e) =>
                                setEditingResponsible((prev) => prev ? { ...prev, name: e.target.value } : null)
                              }
                              placeholder="Nome"
                              className="h-8 text-sm"
                            />
                            <Input
                              value={editingResponsible?.email ?? ""}
                              onChange={(e) =>
                                setEditingResponsible((prev) => prev ? { ...prev, email: e.target.value } : null)
                              }
                              placeholder="Email"
                              className="h-8 text-sm"
                            />
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                className="h-7 text-xs px-3"
                                onClick={handleSaveResponsible}
                                disabled={updateResponsibleMutation.isPending}
                              >
                                {updateResponsibleMutation.isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCheck className="h-3.5 w-3.5" />
                                )}
                                <span className="ml-1">Salvar</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs px-2"
                                onClick={() => setEditingResponsible(null)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            {task.responsibleName ? (
                              <>
                                <p className="text-sm font-medium leading-snug">{task.responsibleName}</p>
                                {task.responsibleEmail && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[190px]">
                                    {task.responsibleEmail}
                                  </p>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">Não definido</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 align-top">
                        {updatingStatusId === task.id ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Atualizando...</span>
                          </div>
                        ) : (
                          <Select
                            value={task.status}
                            onValueChange={(v) => handleStatusChange(task.id, v as WebinarTaskStatus)}
                          >
                            <SelectTrigger className="h-8 text-sm w-full">
                              <SelectValue>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${STATUS_COLORS[task.status as WebinarTaskStatus] || ""}`}
                                >
                                  {STATUS_LABELS[task.status as WebinarTaskStatus] || task.status}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key} className="text-sm">
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Marcar concluída */}
                          {task.status !== "completed" && task.status !== "cancelled" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Marcar como concluída"
                              onClick={() => handleStatusChange(task.id, "completed")}
                              disabled={updatingStatusId === task.id}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {/* Editar responsável */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            title="Editar responsável"
                            onClick={() =>
                              setEditingResponsible({
                                taskId: task.id,
                                name: task.responsibleName || "",
                                email: task.responsibleEmail || "",
                              })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {/* Enviar lembrete */}
                          {task.responsibleEmail && task.status !== "completed" && task.status !== "cancelled" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title={`Enviar lembrete para ${task.responsibleEmail}`}
                              onClick={() => handleSendReminder(task.id)}
                              disabled={sendingReminderId === task.id}
                            >
                              {sendingReminderId === task.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Legend — sticky footer */}
        <div className="border-t px-6 py-3 flex items-center gap-5 text-xs text-muted-foreground flex-wrap bg-background">
          <span className="flex items-center gap-1.5">
            <span className="text-red-500 text-sm">●</span> Tarefa crítica
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-red-100 border border-red-300 inline-block" /> Atrasada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-yellow-100 border border-yellow-300 inline-block" /> Vencendo em ≤5 dias
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-green-100 border border-green-300 inline-block" /> Concluída
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
