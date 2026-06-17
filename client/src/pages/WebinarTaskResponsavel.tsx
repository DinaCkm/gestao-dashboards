import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Loader2,
  ClipboardList,
  Link2,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  organizacao: "Organização",
  marketing: "Marketing",
  administrativo: "Administrativo",
  coordenacao: "Coordenação",
  palestrante: "Palestrante",
  solicitante: "Solicitante",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  waiting_delivery: "Aguardando entrega",
  waiting_approval: "Aguardando aprovação",
  adjustment_requested: "Ajuste solicitado",
  approved: "Aprovado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR");
}

function isOverdue(dueDate: string, status: string): boolean {
  if (status === "completed" || status === "cancelled") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  return due < today;
}

export default function WebinarTaskResponsavel() {
  const [, params] = useRoute("/tarefa-webinar/:token");
  const token = params?.token ?? "";

  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [completed, setCompleted] = useState(false);

  const { data: task, isLoading, error } = trpc.webinarTasks.getTaskByToken.useQuery(
    { token },
    {
      enabled: !!token,
      retry: false,
    }
  );

  const completeMutation = trpc.webinarTasks.completeTaskByToken.useMutation({
    onSuccess: () => {
      setCompleted(true);
      toast.success("Tarefa marcada como concluída!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao concluir tarefa");
    },
  });

  const handleComplete = () => {
    if (deliveryUrl && !isValidUrl(deliveryUrl)) {
      toast.error("Por favor, insira uma URL válida (ex: https://drive.google.com/...)");
      return;
    }
    completeMutation.mutate({
      token,
      deliveryUrl: deliveryUrl || undefined,
    });
  };

  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f2b3c] to-[#1a4a5e] flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 opacity-70" />
          <p className="text-lg opacity-70">Carregando tarefa...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f2b3c] to-[#1a4a5e] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <AlertTriangle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Link inválido</h1>
          <p className="text-gray-500 text-sm">
            {error?.message || "Esta tarefa não foi encontrada ou o link expirou."}
          </p>
          <p className="text-gray-400 text-xs mt-4">
            Se você acredita que isso é um erro, entre em contato com a equipe de organização.
          </p>
        </div>
      </div>
    );
  }

  const isTaskCompleted = task.status === "completed" || completed;
  const overdue = isOverdue(task.dueDate, task.status);

  // Success state after completing
  if (isTaskCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f2b3c] to-[#1a4a5e] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Tarefa Concluída!</h1>
          <p className="text-gray-500 text-sm mb-4">
            A tarefa <strong>"{task.title}"</strong> foi marcada como concluída com sucesso.
          </p>
          <p className="text-gray-400 text-xs">
            Webinar: {task.webinarTitle}
          </p>
          {task.deliveryUrl && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">Link do documento entregue:</p>
              <a
                href={task.deliveryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 underline break-all"
              >
                {task.deliveryUrl}
              </a>
            </div>
          )}
          <p className="text-gray-400 text-xs mt-6">
            Você não receberá mais e-mails de lembrete para esta tarefa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2b3c] to-[#1a4a5e] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f2b3c] to-[#1a4a5e] px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-1">
            <ClipboardList className="w-6 h-6 opacity-80" />
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
              Checklist de Produção — Webinar
            </p>
          </div>
          <h1 className="text-xl font-bold leading-tight">{task.webinarTitle}</h1>
          <p className="text-sm text-blue-200 mt-1">Data do evento: {task.webinarDate}</p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {/* Task card */}
          <div className={`rounded-xl border-2 p-5 mb-6 ${overdue ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-1">
                  📌 Sua Tarefa
                </p>
                <h2 className="text-lg font-bold text-gray-800">{task.title}</h2>
              </div>
              {task.isCritical && (
                <span className="flex-shrink-0 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full border border-red-200">
                  Crítica
                </span>
              )}
            </div>

            {/* Description */}
            {task.description && (
              <div className="text-sm text-gray-600 mb-4 whitespace-pre-line leading-relaxed bg-white rounded-lg p-3 border border-gray-100">
                {task.description}
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">📅 Prazo</p>
                <p className={`text-sm font-bold ${overdue ? "text-red-600" : "text-gray-800"}`}>
                  {formatDate(task.dueDate)}
                  {overdue && <span className="ml-1 text-xs font-normal">(vencida)</span>}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">👤 Responsável</p>
                <p className="text-sm font-semibold text-gray-800">
                  {task.responsibleName || "—"}
                </p>
                <p className="text-xs text-gray-400">
                  {ROLE_LABELS[task.responsibleRole] || task.responsibleRole}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100 col-span-2">
                <p className="text-xs text-gray-400 mb-1">📊 Status atual</p>
                <p className="text-sm font-semibold text-gray-700">
                  {STATUS_LABELS[task.status] || task.status}
                </p>
              </div>
            </div>

            {/* Existing delivery URL */}
            {task.deliveryUrl && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-1">📎 Documento já entregue:</p>
                <a
                  href={task.deliveryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  {task.deliveryUrl}
                </a>
              </div>
            )}
          </div>

          {/* Action section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Link2 className="w-4 h-4 inline mr-1" />
                Link do documento produzido{" "}
                <span className="text-gray-400 font-normal text-xs">(opcional)</span>
              </label>
              <Input
                type="url"
                placeholder="https://drive.google.com/... ou https://docs.google.com/..."
                value={deliveryUrl}
                onChange={(e) => setDeliveryUrl(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Cole o link do Google Drive, Notion, Canva ou qualquer outro documento produzido para esta tarefa.
              </p>
            </div>

            <Button
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-base rounded-xl"
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Marcar como Concluída ✓
                </>
              )}
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Ao confirmar, você não receberá mais e-mails de lembrete para esta tarefa.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            ECOSSISTEMA DO BEM — Gestão de Webinars
          </p>
        </div>
      </div>
    </div>
  );
}
