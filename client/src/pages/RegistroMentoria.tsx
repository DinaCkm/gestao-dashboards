import { useState, useMemo } from "react";
import { formatDateSafe } from "@/lib/dateUtils";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { getEvolucaoStage, EVOLUCAO_STAGES, getNotaFromStage } from "@/lib/evolucaoStages";
import { toast } from "sonner";
import { 
  Calendar, 
  User, 
  Star, 
  CheckCircle2, 
  XCircle,
  Edit,
  Save,
  TrendingUp,
  Eye,
  ClipboardCheck,
  BookOpen,
  Target,
  AlertTriangle,
  Trophy,
  Clock,
  Plus,
  Search,
  X,
  ExternalLink,
  MessageSquare,
  Award,
  Send,
  FileText,
  Image as ImageIcon,
  Snowflake,
  Library,
  Pencil,
  FileEdit,
  Ban,
  ArrowRight,
  Info,
  ListChecks
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function RegistroMentoria() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const userConsultorId = (user as any)?.consultorId as number | null;

  const [selectedProgramId, setSelectedProgramId] = useState<string>("all");
  const [selectedAlunoId, setSelectedAlunoId] = useState<number | null>(null);
  const [editingSession, setEditingSession] = useState<number | null>(null);
  const [viewingSession, setViewingSession] = useState<number | null>(null);
  
  // Edit form states
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [mensagemAluno, setMensagemAluno] = useState<string>("");
  const [editTaskId, setEditTaskId] = useState<number | null>(null);
  const [editTaskDeadline, setEditTaskDeadline] = useState<string>("");
  const [editTaskStatus, setEditTaskStatus] = useState<string>("");
  const [editPresence, setEditPresence] = useState<string>("");
  
  // New session form states
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSessionDate, setNewSessionDate] = useState<string>("");
  const [newPresence, setNewPresence] = useState<string>("presente");
  const [newTaskStatus, setNewTaskStatus] = useState<string>("sem_tarefa");
  const [newSelectedStage, setNewSelectedStage] = useState<number | null>(null);
  const [newFeedback, setNewFeedback] = useState<string>("");
  const [newMensagemAluno, setNewMensagemAluno] = useState<string>("");
  const [newTaskId, setNewTaskId] = useState<number | null>(null);
  const [newTaskDeadline, setNewTaskDeadline] = useState<string>("");
  const [taskSearch, setTaskSearch] = useState<string>("");
  // B1: Novos estados para modos de tarefa
  const [newTaskMode, setNewTaskMode] = useState<"biblioteca" | "personalizada" | "livre" | "sem_tarefa">("sem_tarefa");
  const [newCustomTaskTitle, setNewCustomTaskTitle] = useState<string>("");
  const [newCustomTaskDescription, setNewCustomTaskDescription] = useState<string>("");
  const [editTaskMode, setEditTaskMode] = useState<"biblioteca" | "personalizada" | "livre" | "sem_tarefa">("sem_tarefa");
  const [editCustomTaskTitle, setEditCustomTaskTitle] = useState<string>("");
  const [editCustomTaskDescription, setEditCustomTaskDescription] = useState<string>("");
  // Aplicabilidade Prática - nota da mentora
  const [newNotaMentoraAplic, setNewNotaMentoraAplic] = useState<number | null>(null);
  const [editNotaMentoraAplic, setEditNotaMentoraAplic] = useState<number | null>(null);

  // Queries
  const { data: allPrograms = [] } = trpc.programs.list.useQuery(undefined, { enabled: isAdmin });
  const { data: mentorPrograms = [] } = trpc.alunos.programsByConsultor.useQuery(
    { consultorId: userConsultorId! },
    { enabled: !!userConsultorId && !isAdmin }
  );
  const programs = isAdmin ? allPrograms : mentorPrograms;

  const { data: adminAlunos = [] } = trpc.alunos.list.useQuery(
    selectedProgramId !== "all" ? { programId: parseInt(selectedProgramId) } : undefined,
    { enabled: isAdmin }
  );
  const { data: mentorAlunos = [] } = trpc.alunos.byConsultor.useQuery(
    { consultorId: userConsultorId!, programId: selectedProgramId !== "all" ? parseInt(selectedProgramId) : undefined },
    { enabled: !!userConsultorId && !isAdmin }
  );
  const alunos = isAdmin ? adminAlunos : mentorAlunos;

  const { data: sessions = [], refetch: refetchSessions } = trpc.mentor.sessionsByAluno.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );
  const { data: sessionProgress } = trpc.mentor.sessionProgress.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );
  const { data: taskLibrary = [] } = trpc.mentor.getTaskLibrary.useQuery();

  // Alerta de atualização de metas
  const { data: alertaMetas } = trpc.metas.alertaAtualizacao.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );

  // Evidência / Validação / Comentários states
  const [commentText, setCommentText] = useState<string>("");

  // Mutations
  const updateSession = trpc.mentor.updateSession.useMutation({
    onSuccess: () => {
      toast.success("Sessão atualizada com sucesso!");
      refetchSessions();
      setEditingSession(null);
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    }
  });

  const createSession = trpc.mentor.createSession.useMutation({
    onSuccess: (data) => {
      toast.success(`Sessão ${data.sessionNumber} criada com sucesso!`);
      refetchSessions();
      resetNewSessionForm();
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro ao criar sessão: ${error.message}`);
    }
  });

  const validateTask = trpc.mentor.validateTask.useMutation({
    onSuccess: () => {
      toast.success("Atividade prática validada com sucesso!");
      refetchSessions();
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro ao validar: ${error.message}`);
    }
  });

  const addComment = trpc.mentor.addTaskComment.useMutation({
    onSuccess: () => {
      toast.success("Comentário adicionado!");
      setCommentText("");
      refetchSessions();
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const { data: submissionDetail } = trpc.mentor.getSubmissionDetail.useQuery(
    { sessionId: viewingSession! },
    { enabled: !!viewingSession }
  );

  // Computed
  const selectedAluno = useMemo(() => alunos.find(a => a.id === selectedAlunoId), [alunos, selectedAlunoId]);
  const alunoProgram = useMemo(() => {
    if (!selectedAluno?.programId) return null;
    return programs.find(p => p.id === selectedAluno.programId);
  }, [selectedAluno, programs]);
  const mentorName = (user as any)?.name || 'Mentor';
  const viewedSession = useMemo(() => {
    if (!viewingSession) return null;
    return sessions.find(s => s.id === viewingSession) || null;
  }, [sessions, viewingSession]);

  // Previous session (to show what task was assigned)
  const previousSession = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    // Sort by sessionNumber descending and get the latest
    const sorted = [...sessions].sort((a, b) => (b.sessionNumber ?? 0) - (a.sessionNumber ?? 0));
    return sorted[0] || null;
  }, [sessions]);

  // Helper to get task name from previous session
  const getPreviousTaskDescription = (session: any) => {
    if (!session) return null;
    if (session.taskMode === 'sem_tarefa' || (!session.taskId && !session.customTaskTitle)) {
      return null;
    }
    if (session.customTaskTitle) {
      return {
        title: session.customTaskTitle,
        description: session.customTaskDescription || null,
        mode: session.taskMode || 'livre',
        deadline: session.taskDeadline,
      };
    }
    if (session.taskId) {
      const task = taskLibrary.find(t => t.id === session.taskId);
      return {
        title: task?.nome || `Tarefa #${session.taskId}`,
        description: task?.resumo || task?.oQueFazer || null,
        mode: session.taskMode || 'biblioteca',
        deadline: session.taskDeadline,
      };
    }
    return null;
  };

  // Group task library by competencia
  const groupedTasks = useMemo(() => {
    const tasks = taskSearch.trim()
      ? taskLibrary.filter(t => 
          t.competencia?.toLowerCase().includes(taskSearch.toLowerCase()) || 
          t.nome?.toLowerCase().includes(taskSearch.toLowerCase())
        )
      : taskLibrary;
    const groups: Record<string, typeof taskLibrary> = {};
    tasks.forEach(t => {
      const comp = t.competencia || "Sem competência";
      if (!groups[comp]) groups[comp] = [];
      groups[comp].push(t);
    });
    return groups;
  }, [taskLibrary, taskSearch]);

  const competenciaNames = useMemo(() => Object.keys(groupedTasks).sort(), [groupedTasks]);
  const [expandedComp, setExpandedComp] = useState<string | null>(null);

  // Handlers
  const handleEdit = (session: any) => {
    setEditingSession(session.id);
    const nota = session.notaEvolucao ?? session.engagementScore;
    if (nota != null) {
      const stage = EVOLUCAO_STAGES.find(s => s.nota === nota) || EVOLUCAO_STAGES.find(s => nota >= (s.level === 5 ? 0 : s.level === 4 ? 3 : s.level === 3 ? 5 : s.level === 2 ? 7 : 9));
      setSelectedStage(stage?.level ?? null);
    } else {
      setSelectedStage(null);
    }
    setFeedback(session.feedback || "");
    setMensagemAluno(session.mensagemAluno || "");
    setEditTaskId(session.taskId || null);
    setEditTaskDeadline(session.taskDeadline ? new Date(session.taskDeadline).toISOString().split('T')[0] : "");
    setEditTaskStatus(session.taskStatus || "");
    setEditPresence(session.presence || "");
    setEditTaskMode(session.taskMode || "sem_tarefa");
    setEditCustomTaskTitle(session.customTaskTitle || "");
    setEditCustomTaskDescription(session.customTaskDescription || "");
  };

  const handleSave = () => {
    if (!editingSession) return;
    // Validar nota de aplicabilidade obrigatória quando aluno entregou com registro
    const editedSession = sessions.find(s => s.id === editingSession);
    if (editedSession && editTaskStatus === 'entregue') {
      const currentSessionNum = editedSession.sessionNumber ?? 0;
      const prevSess = sessions
        .filter(s => (s.sessionNumber ?? 0) < currentSessionNum)
        .sort((a, b) => (b.sessionNumber ?? 0) - (a.sessionNumber ?? 0))[0];
      if (prevSess) {
        const hasAplicRegistro = prevSess.textoAplicabilidade || prevSess.notaAlunoAplicabilidade !== null;
        if (hasAplicRegistro && (editNotaMentoraAplic === null || editNotaMentoraAplic === undefined)) {
          toast.error("O aluno registrou a aplicabilidade prática. Você precisa avaliar (nota de 0 a 10) antes de salvar.");
          return;
        }
      }
    }
    const nota = selectedStage ? getNotaFromStage(selectedStage) : undefined;
    updateSession.mutate({
      sessionId: editingSession,
      notaEvolucao: nota,
      engagementScore: nota,
      feedback: feedback || undefined,
      mensagemAluno: mensagemAluno || undefined,
      taskId: editTaskId,
      taskDeadline: editTaskDeadline || null,
      taskStatus: editTaskStatus as any || undefined,
      presence: editPresence as any || undefined,
      taskMode: editTaskMode,
      customTaskTitle: editCustomTaskTitle || null,
      customTaskDescription: editCustomTaskDescription || null,
      notaMentoraAplicabilidade: editNotaMentoraAplic ?? undefined,
    });
  };

  const handleCancel = () => {
    setEditingSession(null);
    setSelectedStage(null);
    setFeedback("");
    setMensagemAluno("");
    setEditNotaMentoraAplic(null);
  };

  const resetNewSessionForm = () => {
    setShowNewSession(false);
    setNewSessionDate("");
    setNewPresence("presente");
    setNewTaskStatus("sem_tarefa");
    setNewSelectedStage(null);
    setNewFeedback("");
    setNewMensagemAluno("");
    setNewTaskId(null);
    setNewTaskDeadline("");
    setTaskSearch("");
    setNewTaskMode("sem_tarefa");
    setNewCustomTaskTitle("");
    setNewCustomTaskDescription("");
    setNewNotaMentoraAplic(null);
  };

  const handleCreateSession = () => {
    if (!selectedAlunoId || !newSessionDate) {
      toast.error("Preencha a data da sessão");
      return;
    }
    // Validar nota de aplicabilidade obrigatória quando aluno entregou com registro
    if (previousSession && newTaskStatus === 'entregue') {
      const hasAplicRegistro = previousSession.textoAplicabilidade || previousSession.notaAlunoAplicabilidade !== null;
      if (hasAplicRegistro && (newNotaMentoraAplic === null || newNotaMentoraAplic === undefined)) {
        toast.error("O aluno registrou a aplicabilidade prática. Você precisa avaliar (nota de 0 a 10) antes de salvar.");
        return;
      }
    }
    const nota = newSelectedStage ? getNotaFromStage(newSelectedStage) : null;
    createSession.mutate({
      alunoId: selectedAlunoId,
      sessionDate: newSessionDate,
      presence: newPresence as "presente" | "ausente",
      taskStatus: newTaskStatus as any,
      engagementScore: nota,
      notaEvolucao: nota,
      feedback: newFeedback || undefined,
      mensagemAluno: newMensagemAluno || undefined,
      taskId: newTaskId,
      taskDeadline: newTaskDeadline || null,
      taskMode: newTaskMode,
      customTaskTitle: newCustomTaskTitle || null,
      customTaskDescription: newCustomTaskDescription || null,
      notaMentoraAplicabilidade: newNotaMentoraAplic ?? undefined,
    });
  };

  // Helpers
  const getPresenceColor = (p: string) => p === 'presente' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
  const getTaskColor = (s: string | null) => {
    if (s === 'entregue') return 'bg-emerald-100 text-emerald-800';
    if (s === 'nao_entregue') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };
  const getTaskLabel = (s: string | null) => {
    if (s === 'entregue') return 'Entregue';
    if (s === 'nao_entregue') return 'Não Entregue';
    if (s === 'sem_tarefa') return 'Sem Tarefa';
    return 'Não Informado';
  };
  const getPresencePoints = (p: string) => p === 'presente' ? 100 : 0;
  const getTaskPoints = (s: string | null) => {
    if (s === 'entregue') return 100;
    if (s === 'nao_entregue') return 0;
    return null;
  };
  const handleProgramChange = (value: string) => {
    setSelectedProgramId(value);
    setSelectedAlunoId(null);
  };

  // Stage selector component
  const StageSelector = ({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Star className="h-4 w-4 text-amber-500" />
        Nível de Engajamento
      </Label>
      <div className="grid grid-cols-1 gap-2">
        {EVOLUCAO_STAGES.map((stage) => (
          <button
            key={stage.level}
            type="button"
            onClick={() => onChange(value === stage.level ? null : stage.level)}
            className={`text-left p-3 rounded-lg border-2 transition-all ${
              value === stage.level 
                ? `${stage.borderColor} ${stage.bgColor} ring-2 ring-offset-1 ring-${stage.textColor.replace('text-', '')}` 
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Badge className={`${stage.badgeBg} ${stage.badgeText} border-0`}>{stage.label}</Badge>
                <span className="text-xs text-gray-500">({stage.range})</span>
              </div>
              {value === stage.level && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{stage.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  // B1: Task selector component with 4 modes
  const TaskSelector = ({ 
    value, onChange, deadline, onDeadlineChange,
    taskMode, onTaskModeChange,
    customTitle, onCustomTitleChange,
    customDescription, onCustomDescriptionChange
  }: { 
    value: number | null; onChange: (v: number | null) => void;
    deadline: string; onDeadlineChange: (v: string) => void;
    taskMode: "biblioteca" | "personalizada" | "livre" | "sem_tarefa";
    onTaskModeChange: (v: "biblioteca" | "personalizada" | "livre" | "sem_tarefa") => void;
    customTitle: string; onCustomTitleChange: (v: string) => void;
    customDescription: string; onCustomDescriptionChange: (v: string) => void;
  }) => {
    const selectedTask = taskLibrary.find(t => t.id === value);
    
    const TASK_MODES = [
      { key: "biblioteca" as const, label: "Biblioteca", icon: Library, color: "border-blue-500 bg-blue-50 text-blue-800", desc: "Selecionar da biblioteca de ações" },
      { key: "personalizada" as const, label: "Personalizar", icon: Pencil, color: "border-purple-500 bg-purple-50 text-purple-800", desc: "Adaptar uma ação da biblioteca" },
      { key: "livre" as const, label: "Texto Livre", icon: FileEdit, color: "border-amber-500 bg-amber-50 text-amber-800", desc: "Criar tarefa do zero" },
      { key: "sem_tarefa" as const, label: "Sem Tarefa", icon: Ban, color: "border-gray-500 bg-gray-50 text-gray-800", desc: "Nenhuma tarefa nesta sessão" },
    ];

    return (
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#0A1E3E]" />
          Atividade Prática / Tarefa
        </Label>
        
        {/* Mode selector - 4 buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TASK_MODES.map(mode => {
            const Icon = mode.icon;
            const isActive = taskMode === mode.key;
            return (
              <button
                key={mode.key}
                type="button"
                onClick={() => {
                  onTaskModeChange(mode.key);
                  if (mode.key === "sem_tarefa") {
                    onChange(null);
                    onCustomTitleChange("");
                    onCustomDescriptionChange("");
                  }
                  if (mode.key === "livre") {
                    onChange(null);
                  }
                }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-xs ${
                  isActive ? mode.color + ' ring-1 ring-offset-1' : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mode: Biblioteca - buscar e selecionar da biblioteca */}
        {taskMode === "biblioteca" && (
          <div className="space-y-2 border rounded-lg p-3 bg-blue-50/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por competência ou nome da ação..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <div className="max-h-52 overflow-y-auto border rounded-lg bg-white">
              {competenciaNames.map(comp => {
                const tasks = groupedTasks[comp];
                const isExpanded = expandedComp === comp;
                const hasSelected = tasks.some(t => t.id === value);
                return (
                  <div key={comp}>
                    <button
                      type="button"
                      onClick={() => setExpandedComp(isExpanded ? null : comp)}
                      className={`w-full text-left px-3 py-2 text-sm border-b flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        hasSelected ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`transition-transform text-xs ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                        <span className="font-semibold text-[#0A1E3E] text-sm">{comp}</span>
                        <Badge variant="secondary" className="text-[10px]">{tasks.length}</Badge>
                      </div>
                      {hasSelected && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />}
                    </button>
                    {isExpanded && (
                      <div className="bg-gray-50/50">
                        {tasks.map(task => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => onChange(task.id)}
                            className={`w-full text-left pl-7 pr-3 py-1.5 text-sm border-b hover:bg-blue-50/50 transition-colors ${
                              value === task.id ? 'bg-blue-100 font-medium border-l-2 border-l-blue-500' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {value === task.id ? (
                                <CheckCircle2 className="h-3 w-3 text-blue-600 shrink-0" />
                              ) : (
                                <Target className="h-3 w-3 text-gray-400 shrink-0" />
                              )}
                              <span className="text-sm">{task.nome}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {competenciaNames.length === 0 && (
                <div className="p-3 text-center text-sm text-gray-500">Nenhuma tarefa encontrada</div>
              )}
            </div>
            {selectedTask && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                <p className="font-medium text-sm text-[#0A1E3E]">{selectedTask.competencia}: {selectedTask.nome}</p>
                {selectedTask.resumo && <p className="text-xs text-gray-600"><strong>Resumo:</strong> {selectedTask.resumo}</p>}
                {selectedTask.oQueFazer && <p className="text-xs text-gray-600"><strong>O que fazer:</strong> {selectedTask.oQueFazer}</p>}
              </div>
            )}
          </div>
        )}

        {/* Mode: Personalizar - selecionar da biblioteca + editar título/descrição */}
        {taskMode === "personalizada" && (
          <div className="space-y-2 border rounded-lg p-3 bg-purple-50/30">
            <p className="text-xs text-purple-700 font-medium">Selecione uma ação da biblioteca como base e personalize:</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar ação base..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <div className="max-h-40 overflow-y-auto border rounded-lg bg-white">
              {competenciaNames.map(comp => {
                const tasks = groupedTasks[comp];
                const isExpanded = expandedComp === comp;
                const hasSelected = tasks.some(t => t.id === value);
                return (
                  <div key={comp}>
                    <button
                      type="button"
                      onClick={() => setExpandedComp(isExpanded ? null : comp)}
                      className={`w-full text-left px-3 py-2 text-sm border-b flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        hasSelected ? 'bg-purple-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`transition-transform text-xs ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                        <span className="font-semibold text-[#0A1E3E] text-sm">{comp}</span>
                        <Badge variant="secondary" className="text-[10px]">{tasks.length}</Badge>
                      </div>
                      {hasSelected && <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />}
                    </button>
                    {isExpanded && (
                      <div className="bg-gray-50/50">
                        {tasks.map(task => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => {
                              onChange(task.id);
                              // Pré-preencher com dados da biblioteca para personalização
                              if (!customTitle) onCustomTitleChange(task.nome);
                              if (!customDescription) onCustomDescriptionChange(task.resumo || task.oQueFazer || "");
                            }}
                            className={`w-full text-left pl-7 pr-3 py-1.5 text-sm border-b hover:bg-purple-50/50 transition-colors ${
                              value === task.id ? 'bg-purple-100 font-medium border-l-2 border-l-purple-500' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {value === task.id ? (
                                <CheckCircle2 className="h-3 w-3 text-purple-600 shrink-0" />
                              ) : (
                                <Target className="h-3 w-3 text-gray-400 shrink-0" />
                              )}
                              <span className="text-sm">{task.nome}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 pt-2 border-t border-purple-200">
              <div>
                <Label className="text-xs text-purple-700">Título personalizado</Label>
                <Input
                  placeholder="Ex: Praticar escuta ativa com a equipe"
                  value={customTitle}
                  onChange={(e) => onCustomTitleChange(e.target.value)}
                  className="mt-1 bg-white"
                />
              </div>
              <div>
                <Label className="text-xs text-purple-700">Descrição / Instruções</Label>
                <Textarea
                  placeholder="Descreva o que o aluno deve fazer..."
                  value={customDescription}
                  onChange={(e) => onCustomDescriptionChange(e.target.value)}
                  className="mt-1 bg-white min-h-[60px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Mode: Livre - texto livre sem biblioteca */}
        {taskMode === "livre" && (
          <div className="space-y-2 border rounded-lg p-3 bg-amber-50/30">
            <p className="text-xs text-amber-700 font-medium">Crie uma tarefa personalizada do zero:</p>
            <div>
              <Label className="text-xs text-amber-700">Título da tarefa</Label>
              <Input
                placeholder="Ex: Elaborar plano de ação para a equipe"
                value={customTitle}
                onChange={(e) => onCustomTitleChange(e.target.value)}
                className="mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs text-amber-700">Descrição / Instruções</Label>
              <Textarea
                placeholder="Descreva detalhadamente o que o aluno deve fazer, como entregar, etc."
                value={customDescription}
                onChange={(e) => onCustomDescriptionChange(e.target.value)}
                className="mt-1 bg-white min-h-[80px]"
              />
            </div>
          </div>
        )}

        {/* Mode: Sem Tarefa */}
        {taskMode === "sem_tarefa" && (
          <div className="border rounded-lg p-3 bg-gray-50 text-center">
            <Ban className="h-6 w-6 text-gray-400 mx-auto mb-1" />
            <p className="text-sm text-gray-500">Nenhuma tarefa será atribuída nesta sessão</p>
          </div>
        )}

        {/* Data de entrega - aparece para todos os modos exceto sem_tarefa */}
        {taskMode !== "sem_tarefa" && (
          <div>
            <Label>Data de Entrega da Tarefa</Label>
            <Input type="date" value={deadline} onChange={(e) => onDeadlineChange(e.target.value)} className="mt-1" />
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registro de Mentoria</h1>
            <p className="text-gray-500">Acompanhe as sessões de mentoria e o nível de engajamento dos alunos</p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-[#0A1E3E]" />
              {!isAdmin ? mentorName : "Selecionar Aluno"}
            </CardTitle>
            {!isAdmin && (
              <CardDescription>
                Mostrando apenas seus alunos ({alunos.length} aluno{alunos.length !== 1 ? 's' : ''})
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-2' : ''} gap-4`}>
              {isAdmin && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Empresa/Programa</label>
                  <Select value={selectedProgramId} onValueChange={handleProgramChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as empresas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as empresas</SelectItem>
                      {programs.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Aluno</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none cursor-pointer"
                  value={selectedAlunoId !== null ? String(selectedAlunoId) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") { setSelectedAlunoId(null); } else {
                      const id = parseInt(val);
                      if (!isNaN(id)) setSelectedAlunoId(id);
                    }
                  }}
                >
                  <option value="">Selecione um aluno</option>
                  {[...alunos].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(a => (
                    <option key={a.id} value={String(a.id)}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Aluno */}
        {selectedAluno && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#0A1E3E] to-[#2D5A87] flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedAluno.name}</h2>
                  <div className="flex items-center gap-2">
                    {alunoProgram && (
                      <Badge variant="outline" className="text-[#0A1E3E] border-[#0A1E3E]">{alunoProgram.name}</Badge>
                    )}
                    <span className="text-sm text-gray-500">{sessions.length} sessões registradas</span>
                  </div>
                </div>
              </div>

              {/* Progresso do Ciclo Macro */}
              {sessionProgress && !(sessionProgress as any).todosCongelados && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#0A1E3E]" />
                      <span className="text-sm font-medium text-gray-700">Progresso do Ciclo Macro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#0A1E3E]">
                        {sessionProgress.sessoesRealizadas}/{sessionProgress.totalSessoesEsperadas} sessões
                      </span>
                      <span className="text-xs text-gray-500">({sessionProgress.percentualProgresso}%)</span>
                    </div>
                  </div>
                  <Progress value={sessionProgress.percentualProgresso} className="h-2" />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {sessionProgress.macroInicio ? formatDateSafe(sessionProgress.macroInicio) : ''}
                      {' → '}
                      {sessionProgress.macroTermino ? formatDateSafe(sessionProgress.macroTermino) : ''}
                    </span>
                    {sessionProgress.cicloCompleto ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-0"><Trophy className="h-3 w-3 mr-1" /> Ciclo Completo</Badge>
                    ) : sessionProgress.faltaUmaSessao ? (
                      <Badge className="bg-amber-100 text-amber-800 border-0 animate-pulse"><AlertTriangle className="h-3 w-3 mr-1" /> Falta 1 sessão para fechar o ciclo!</Badge>
                    ) : sessionProgress.sessoesFaltantes > 0 ? (
                      <span className="text-xs text-gray-500">Faltam {sessionProgress.sessoesFaltantes} sessões para o término do Macro-Ciclo</span>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Aviso: PDIs congelados */}
              {sessionProgress && (sessionProgress as any).todosCongelados && selectedAlunoId && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                    <Snowflake className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">Todas as trilhas deste aluno estão <strong>congeladas</strong>. O progresso do ciclo macro não pode ser calculado enquanto as trilhas estiverem congeladas.</span>
                  </div>
                </div>
              )}

              {/* Aviso: PDI não cadastrado */}
              {!sessionProgress && selectedAlunoId && sessions.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">Assessment PDI não cadastrado — não é possível calcular o progresso do ciclo macro.</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Alerta de Atualização de Metas */}
        {selectedAlunoId && alertaMetas?.precisaAtualizar && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Target className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800">Atualização de Metas Recomendada</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    {alertaMetas.sessoesDesdeUltimaAtualizacao >= 3
                      ? `Já foram realizadas ${alertaMetas.sessoesDesdeUltimaAtualizacao} sessões de mentoria desde a última atualização de metas.`
                      : alertaMetas.mesesDesdeUltimaAtualizacao >= 3
                      ? `Já se passaram ${alertaMetas.mesesDesdeUltimaAtualizacao} meses desde a última atualização de metas.`
                      : `Nenhuma atualização de metas foi registrada ainda para este aluno.`
                    }
                    {" "}Lembre-se de revisar e atualizar as metas de desenvolvimento nesta sessão.
                  </p>
                </div>
                <a
                  href={`/metas?alunoId=${selectedAlunoId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium whitespace-nowrap"
                >
                  <Target className="h-4 w-4" />
                  Ver Metas
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Sessões */}
        {selectedAlunoId && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#0A1E3E]" />
                    Sessões de Mentoria
                  </CardTitle>
                  {sessionProgress && sessionProgress.macroInicio && sessionProgress.macroTermino && (
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#0A1E3E]" />
                        <span className="font-medium">Macro-Ciclo:</span>
                        <span>
                          {formatDateSafe(sessionProgress.macroInicio)}
                          {' a '}
                          {formatDateSafe(sessionProgress.macroTermino)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                {(isAdmin || userConsultorId) && (
                  <Button 
                    onClick={() => setShowNewSession(!showNewSession)}
                    className={showNewSession ? "bg-red-500 hover:bg-red-600" : "bg-[#0A1E3E] hover:bg-[#2D5A87]"}
                  >
                    {showNewSession ? <><X className="h-4 w-4 mr-1" /> Cancelar</> : <><Plus className="h-4 w-4 mr-1" /> Nova Sessão</>}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Formulário de Nova Sessão */}
              {showNewSession && (
                <div className="mb-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-[#0A1E3E] flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Nova Sessão de Mentoria
                    </h3>
                    <Badge className="bg-[#0A1E3E] text-white border-0">
                      Sessão {sessions.length > 0 ? Math.max(...sessions.map(s => s.sessionNumber ?? 0)) + 1 : 1}
                    </Badge>
                  </div>

                  {/* ═══════════════════════════════════════════════════════════ */}
                  {/* PARTE 1 - REGISTRO DA SESSÃO ATUAL                        */}
                  {/* ═══════════════════════════════════════════════════════════ */}
                  <div className="border-2 border-[#0A1E3E]/20 rounded-xl p-6 bg-[#0A1E3E]/5 space-y-6">
                    <div className="flex items-center gap-2 pb-3 border-b border-[#0A1E3E]/10">
                      <ListChecks className="h-5 w-5 text-[#0A1E3E]" />
                      <h4 className="text-base font-bold text-[#0A1E3E]">Parte 1 — Registro da Sessão Atual</h4>
                    </div>

                    {/* Data da Sessão */}
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-[#0A1E3E]" />
                        Data da Sessão *
                      </Label>
                      <Input type="date" value={newSessionDate} onChange={(e) => setNewSessionDate(e.target.value)} className="max-w-xs" />
                    </div>

                    {/* Presença */}
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-[#0A1E3E]" />
                        Presença *
                      </Label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setNewPresence("presente")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                            newPresence === "presente" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" /> Presente
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewPresence("ausente")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                            newPresence === "ausente" ? "border-red-500 bg-red-50 text-red-800" : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <XCircle className="h-4 w-4" /> Ausente
                        </button>
                      </div>
                    </div>

                    {/* Avaliação da Tarefa da Sessão Anterior */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 mb-1">
                        <ClipboardCheck className="h-4 w-4 text-[#0A1E3E]" />
                        Avaliação da Tarefa da Sessão Anterior
                      </Label>

                      {/* Mostrar qual era a tarefa anterior */}
                      {(() => {
                        const prevTask = getPreviousTaskDescription(previousSession);
                        const isFirstSession = sessions.length === 0;
                        if (isFirstSession) {
                          return (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
                              <Info className="h-4 w-4 text-gray-400 shrink-0" />
                              <p className="text-sm text-gray-500">Esta é a primeira sessão. Não há tarefa anterior para avaliar.</p>
                            </div>
                          );
                        }
                        if (!prevTask) {
                          return (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
                              <Info className="h-4 w-4 text-gray-400 shrink-0" />
                              <p className="text-sm text-gray-500">Nenhuma tarefa foi atribuída na sessão anterior (Sessão {previousSession?.sessionNumber}).</p>
                            </div>
                          );
                        }
                        return (
                          <div className={`rounded-lg p-3 border ${
                            prevTask.mode === 'personalizada' ? 'bg-purple-50/50 border-purple-200' 
                            : prevTask.mode === 'livre' ? 'bg-amber-50/50 border-amber-200'
                            : 'bg-blue-50/50 border-blue-200'
                          }`}>
                            <p className="text-xs text-gray-500 mb-1">Tarefa solicitada na Sessão {previousSession?.sessionNumber}:</p>
                            <p className="font-medium text-sm text-gray-900">{prevTask.title}</p>
                            {prevTask.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{prevTask.description}</p>
                            )}
                            {prevTask.deadline && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Prazo: {formatDateSafe(prevTask.deadline)}
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Status da Tarefa */}
                      {sessions.length > 0 && (
                        <div>
                          <Label className="text-sm text-gray-700 mb-2 block">O aluno entregou a tarefa?</Label>
                          <div className="flex gap-3">
                            {["entregue", "nao_entregue", "sem_tarefa"].map(status => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => setNewTaskStatus(status)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all text-sm ${
                                  newTaskStatus === status 
                                    ? status === "entregue" ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                      : status === "nao_entregue" ? "border-red-500 bg-red-50 text-red-800"
                                      : "border-gray-500 bg-gray-50 text-gray-800"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                              >
                                {status === "entregue" ? <><CheckCircle2 className="h-4 w-4" /> Entregue</> 
                                  : status === "nao_entregue" ? <><XCircle className="h-4 w-4" /> Não Entregue</> 
                                  : "Sem Tarefa"}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Avaliação de Aplicabilidade Prática */}
                    <div className="space-y-3 border rounded-lg p-4 bg-amber-50/50">
                      <Label className="flex items-center gap-2 text-amber-800 font-semibold">
                        <Target className="h-4 w-4" />
                        Avaliação de Aplicabilidade Prática
                      </Label>
                      <p className="text-xs text-gray-600">Avalie de 0 a 10 a aplicabilidade prática demonstrada pelo aluno na tarefa anterior. Esta avaliação é obrigatória quando o aluno entregou a tarefa com registro de aplicabilidade.</p>

                      {/* Registro do aluno (se preencheu) */}
                      {(() => {
                        if (!previousSession) return null;
                        const hasAplic = previousSession.textoAplicabilidade || previousSession.notaAlunoAplicabilidade !== null;
                        if (!hasAplic) {
                          return (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
                              <Info className="h-4 w-4 text-gray-400 shrink-0" />
                              <p className="text-sm text-gray-500">O aluno ainda não registrou a aplicabilidade prática desta tarefa.</p>
                            </div>
                          );
                        }
                        return (
                          <div className="bg-white border border-amber-300 rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Registro do Aluno</p>
                              {previousSession.notaAlunoAplicabilidade !== null && previousSession.notaAlunoAplicabilidade !== undefined && (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  Number(previousSession.notaAlunoAplicabilidade) >= 8 ? 'bg-emerald-100 text-emerald-800' 
                                  : Number(previousSession.notaAlunoAplicabilidade) >= 5 ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                                }`}>
                                  Autoavaliação: {previousSession.notaAlunoAplicabilidade}/10
                                </span>
                              )}
                            </div>
                            {previousSession.textoAplicabilidade && (
                              <div className="bg-amber-50/50 rounded p-3 border border-amber-200/50">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{previousSession.textoAplicabilidade}</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div>
                        <p className="text-xs font-medium text-amber-800 mb-2">Sua avaliação como mentora (0-10):</p>
                        <div className="flex gap-1 flex-wrap">
                          {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                            <Button
                              key={n}
                              type="button"
                              variant={newNotaMentoraAplic === n ? 'default' : 'outline'}
                              size="sm"
                              className={`w-9 h-9 text-xs ${newNotaMentoraAplic === n ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
                              onClick={() => setNewNotaMentoraAplic(n)}
                            >
                              {n}
                            </Button>
                          ))}
                        </div>
                      </div>
                      {newNotaMentoraAplic !== null && (
                        <p className="text-sm font-medium text-amber-700">Nota selecionada: {newNotaMentoraAplic}/10</p>
                      )}
                    </div>

                    {/* Nível de Engajamento */}
                    <StageSelector value={newSelectedStage} onChange={setNewSelectedStage} />

                    {/* Feedback ao Aluno */}
                    <div>
                      <Label className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[#0A1E3E]" />
                        Feedback ao Aluno
                      </Label>
                      <p className="text-xs text-gray-500 mb-2">Esta mensagem será visível ao aluno no dashboard dele</p>
                      <Textarea
                        value={newMensagemAluno}
                        onChange={(e) => setNewMensagemAluno(e.target.value)}
                        placeholder="Escreva aqui o feedback para o aluno..."
                        rows={3}
                      />
                    </div>

                    {/* Observações internas */}
                    <div>
                      <Label>Observações Internas (não visível ao aluno)</Label>
                      <Textarea
                        value={newFeedback}
                        onChange={(e) => setNewFeedback(e.target.value)}
                        placeholder="Observações internas sobre a sessão..."
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* ═══════════════════════════════════════════════════════════ */}
                  {/* PARTE 2 - TAREFA PARA O PRÓXIMO ENCONTRO                   */}
                  {/* ═══════════════════════════════════════════════════════════ */}
                  <div className="border-2 border-emerald-500/20 rounded-xl p-6 bg-emerald-50/30 space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-emerald-500/10">
                      <ArrowRight className="h-5 w-5 text-emerald-700" />
                      <h4 className="text-base font-bold text-emerald-800">Parte 2 — Tarefa para o Próximo Encontro</h4>
                    </div>

                    {/* Instrução clara */}
                    <div className="bg-white/70 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
                      <Info className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-emerald-800">
                        Defina abaixo uma tarefa ou peça ao seu mentorado para trazer uma <strong>aplicabilidade prática</strong> para o próximo encontro.
                        A tarefa definida aqui será exibida ao aluno no portal e avaliada na próxima sessão.
                      </p>
                    </div>

                    <TaskSelector 
                      value={newTaskId} 
                      onChange={setNewTaskId}
                      deadline={newTaskDeadline}
                      onDeadlineChange={setNewTaskDeadline}
                      taskMode={newTaskMode}
                      onTaskModeChange={setNewTaskMode}
                      customTitle={newCustomTaskTitle}
                      onCustomTitleChange={setNewCustomTaskTitle}
                      customDescription={newCustomTaskDescription}
                      onCustomDescriptionChange={setNewCustomTaskDescription}
                    />
                  </div>

                  {/* Botão Salvar */}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={resetNewSessionForm}>Cancelar</Button>
                    <Button 
                      onClick={handleCreateSession}
                      disabled={createSession.isPending || !newSessionDate}
                      className="bg-[#0A1E3E] hover:bg-[#2D5A87]"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {createSession.isPending ? "Salvando..." : "Registrar Sessão"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Lista de sessões existentes */}
              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((session) => {
                    const presencePoints = getPresencePoints(session.presence);
                    const isFirstSession = session.sessionNumber === 1;
                    const taskPoints = isFirstSession ? null : getTaskPoints(session.taskStatus);
                    
                    return (
                      <div key={session.id} className="border rounded-lg hover:bg-gray-50/50 transition-colors overflow-hidden">
                        {editingSession === session.id ? (
                          /* Modo de edição */
                          <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <span className="font-medium">
                                  Sessão {session.sessionNumber || '-'} - {session.sessionDate ? formatDateSafe(session.sessionDate) : 'Data não informada'}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={handleCancel}>Cancelar</Button>
                                <Button size="sm" onClick={handleSave} disabled={updateSession.isPending} className="bg-[#0A1E3E] hover:bg-[#2D5A87]">
                                  <Save className="h-4 w-4 mr-1" /> Salvar
                                </Button>
                              </div>
                            </div>

                            {/* ═══ PARTE 1 - REGISTRO DA SESSÃO ATUAL ═══ */}
                            <div className="border-2 border-[#0A1E3E]/15 rounded-xl p-4 bg-[#0A1E3E]/5 space-y-4">
                              <div className="flex items-center gap-2 pb-2 border-b border-[#0A1E3E]/10">
                                <ListChecks className="h-4 w-4 text-[#0A1E3E]" />
                                <h5 className="text-sm font-bold text-[#0A1E3E]">Parte 1 — Registro da Sessão Atual</h5>
                              </div>
                            
                              {/* Presença */}
                              <div>
                                <Label className="flex items-center gap-2 mb-2">Presença</Label>
                                <div className="flex gap-3">
                                  <button type="button" onClick={() => setEditPresence("presente")}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-sm ${editPresence === "presente" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-gray-200"}`}>
                                    <CheckCircle2 className="h-3 w-3" /> Presente
                                  </button>
                                  <button type="button" onClick={() => setEditPresence("ausente")}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-sm ${editPresence === "ausente" ? "border-red-500 bg-red-50 text-red-800" : "border-gray-200"}`}>
                                    <XCircle className="h-3 w-3" /> Ausente
                                  </button>
                                </div>
                              </div>

                              {/* Avaliação da Tarefa da Sessão Anterior */}
                              <div className="space-y-3">
                                <Label className="flex items-center gap-2">Avaliação da Tarefa Anterior</Label>
                                {/* Mostrar contexto da tarefa anterior para esta sessão */}
                                {(() => {
                                  // Para edição, buscar a sessão anterior a esta
                                  const currentSessionNum = session.sessionNumber ?? 0;
                                  const prevSess = sessions
                                    .filter(s => (s.sessionNumber ?? 0) < currentSessionNum)
                                    .sort((a, b) => (b.sessionNumber ?? 0) - (a.sessionNumber ?? 0))[0];
                                  const prevTask = getPreviousTaskDescription(prevSess);
                                  if (currentSessionNum <= 1) {
                                    return (
                                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center gap-2">
                                        <Info className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <p className="text-xs text-gray-500">Primeira sessão — sem tarefa anterior.</p>
                                      </div>
                                    );
                                  }
                                  if (!prevTask) {
                                    return (
                                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center gap-2">
                                        <Info className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <p className="text-xs text-gray-500">Nenhuma tarefa atribuída na sessão anterior{prevSess ? ` (Sessão ${prevSess.sessionNumber})` : ''}.</p>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className={`rounded-lg p-2 border text-xs ${
                                      prevTask.mode === 'personalizada' ? 'bg-purple-50/50 border-purple-200' 
                                      : prevTask.mode === 'livre' ? 'bg-amber-50/50 border-amber-200'
                                      : 'bg-blue-50/50 border-blue-200'
                                    }`}>
                                      <p className="text-gray-500 mb-0.5">Tarefa da Sessão {prevSess?.sessionNumber}:</p>
                                      <p className="font-medium text-gray-900">{prevTask.title}</p>
                                      {prevTask.description && <p className="text-gray-600 mt-0.5 line-clamp-2">{prevTask.description}</p>}
                                    </div>
                                  );
                                })()}

                                {/* Status da Tarefa */}
                                <div>
                                  <Label className="text-xs text-gray-700 mb-2 block">O aluno entregou a tarefa?</Label>
                                  <div className="flex gap-3">
                                    {["entregue", "nao_entregue", "sem_tarefa"].map(status => (
                                      <button key={status} type="button" onClick={() => setEditTaskStatus(status)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-sm ${
                                          editTaskStatus === status 
                                            ? status === "entregue" ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                              : status === "nao_entregue" ? "border-red-500 bg-red-50 text-red-800"
                                              : "border-gray-500 bg-gray-50"
                                            : "border-gray-200"
                                        }`}>
                                        {status === "entregue" ? "Entregue" : status === "nao_entregue" ? "Não Entregue" : "Sem Tarefa"}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Avaliação de Aplicabilidade Prática */}
                              <div className="space-y-3 border rounded-lg p-4 bg-amber-50/50">
                                <Label className="flex items-center gap-2 text-amber-800 font-semibold">
                                  <Target className="h-4 w-4" />
                                  Avaliação de Aplicabilidade Prática
                                </Label>
                                <p className="text-xs text-gray-600">Avalie de 0 a 10 a aplicabilidade prática demonstrada pelo aluno.</p>

                                {/* Registro do aluno (se preencheu) - para edição */}
                                {(() => {
                                  const currentSessionNum = session.sessionNumber ?? 0;
                                  const prevSess = sessions
                                    .filter(s => (s.sessionNumber ?? 0) < currentSessionNum)
                                    .sort((a, b) => (b.sessionNumber ?? 0) - (a.sessionNumber ?? 0))[0];
                                  if (!prevSess) return null;
                                  const hasAplic = prevSess.textoAplicabilidade || prevSess.notaAlunoAplicabilidade !== null;
                                  if (!hasAplic) {
                                    return (
                                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center gap-2">
                                        <Info className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <p className="text-xs text-gray-500">O aluno não registrou a aplicabilidade prática desta tarefa.</p>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className="bg-white border border-amber-300 rounded-lg p-3 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Registro do Aluno</p>
                                        {prevSess.notaAlunoAplicabilidade !== null && prevSess.notaAlunoAplicabilidade !== undefined && (
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                            Number(prevSess.notaAlunoAplicabilidade) >= 8 ? 'bg-emerald-100 text-emerald-800' 
                                            : Number(prevSess.notaAlunoAplicabilidade) >= 5 ? 'bg-amber-100 text-amber-800'
                                            : 'bg-red-100 text-red-800'
                                          }`}>
                                            Autoavaliação: {prevSess.notaAlunoAplicabilidade}/10
                                          </span>
                                        )}
                                      </div>
                                      {prevSess.textoAplicabilidade && (
                                        <div className="bg-amber-50/50 rounded p-2 border border-amber-200/50">
                                          <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">{prevSess.textoAplicabilidade}</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}

                                <div>
                                  <p className="text-xs font-medium text-amber-800 mb-2">Sua avaliação como mentora (0-10):</p>
                                  <div className="flex gap-1 flex-wrap">
                                    {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                                      <Button
                                        key={n}
                                        type="button"
                                        variant={editNotaMentoraAplic === n ? 'default' : 'outline'}
                                        size="sm"
                                        className={`w-9 h-9 text-xs ${editNotaMentoraAplic === n ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
                                        onClick={() => setEditNotaMentoraAplic(n)}
                                      >
                                        {n}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                                {editNotaMentoraAplic !== null && (
                                  <p className="text-sm font-medium text-amber-700">Nota selecionada: {editNotaMentoraAplic}/10</p>
                                )}
                              </div>

                              {/* Nível de Engajamento */}
                              <StageSelector value={selectedStage} onChange={setSelectedStage} />
                            
                              {/* Feedback ao Aluno */}
                              <div>
                                <Label className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-[#0A1E3E]" />
                                  Feedback ao Aluno (visível ao aluno)
                                </Label>
                                <Textarea value={mensagemAluno} onChange={(e) => setMensagemAluno(e.target.value)} placeholder="Mensagem para o aluno..." className="mt-1" rows={2} />
                              </div>

                              {/* Observações internas */}
                              <div>
                                <Label>Observações Internas</Label>
                                <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Observações internas..." className="mt-1" rows={2} />
                              </div>
                            </div>

                            {/* ═══ PARTE 2 - TAREFA PARA O PRÓXIMO ENCONTRO ═══ */}
                            <div className="border-2 border-emerald-500/15 rounded-xl p-4 bg-emerald-50/30 space-y-4">
                              <div className="flex items-center gap-2 pb-2 border-b border-emerald-500/10">
                                <ArrowRight className="h-4 w-4 text-emerald-700" />
                                <h5 className="text-sm font-bold text-emerald-800">Parte 2 — Tarefa para o Próximo Encontro</h5>
                              </div>

                              <div className="bg-white/70 border border-emerald-200 rounded-lg p-2 flex items-start gap-2">
                                <Info className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-emerald-800">
                                  Defina abaixo uma tarefa ou peça ao mentorado para trazer uma <strong>aplicabilidade prática</strong> para o próximo encontro.
                                </p>
                              </div>

                              <TaskSelector 
                                value={editTaskId} 
                                onChange={setEditTaskId} 
                                deadline={editTaskDeadline} 
                                onDeadlineChange={setEditTaskDeadline}
                                taskMode={editTaskMode}
                                onTaskModeChange={setEditTaskMode}
                                customTitle={editCustomTaskTitle}
                                onCustomTitleChange={setEditCustomTaskTitle}
                                customDescription={editCustomTaskDescription}
                                onCustomDescriptionChange={setEditCustomTaskDescription}
                              />
                            </div>
                          </div>
                        ) : (
                          /* Modo de visualização */
                          <>
                            <div className="p-4 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                    <div>
                                      <p className="font-medium">Sessão {session.sessionNumber || '-'}</p>
                                      <p className="text-sm text-gray-500">
                                        {session.sessionDate ? formatDateSafe(session.sessionDate) : 'Data não informada'}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge className={getPresenceColor(session.presence)}>
                                    {session.presence === 'presente' ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Presente</> : <><XCircle className="h-3 w-3 mr-1" /> Ausente</>}
                                  </Badge>
                                  {isFirstSession ? (
                                    <Badge className="bg-gray-100 text-gray-500 border border-gray-200">
                                      <ClipboardCheck className="h-3 w-3 mr-1" /> Sem tarefa (1ª sessão)
                                    </Badge>
                                  ) : session.taskStatus && (
                                    <Badge className={getTaskColor(session.taskStatus)}>
                                      {session.taskStatus === 'entregue' ? <><ClipboardCheck className="h-3 w-3 mr-1" /> Entregue</> 
                                        : session.taskStatus === 'nao_entregue' ? <><XCircle className="h-3 w-3 mr-1" /> Não Entregue</> : 'Sem Tarefa'}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  {isFirstSession ? (
                                    <Badge className="bg-gray-100 text-gray-500 border border-gray-200">
                                      <Star className="h-3 w-3 mr-1" /> Encontro Inicial (sem avaliação)
                                    </Badge>
                                  ) : session.notaEvolucao != null || session.engagementScore != null ? (() => {
                                    const nota = session.notaEvolucao ?? session.engagementScore!;
                                    const stage = getEvolucaoStage(nota);
                                    return (
                                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${stage.bgColor} ${stage.borderColor}`}>
                                        <Star className={`h-4 w-4 ${stage.textColor} fill-current`} />
                                        <span className={`font-bold ${stage.textColor}`}>{nota}/10</span>
                                        <span className="text-xs text-gray-500">Nível de Engajamento</span>
                                        <Badge className={`text-xs ${stage.badgeBg} ${stage.badgeText} border-0`}>{stage.label}</Badge>
                                      </div>
                                    );
                                  })() : (
                                    <span className="text-sm text-gray-400 italic">Sem nota</span>
                                  )}
                                  <Button size="sm" variant="outline" onClick={() => setViewingSession(session.id)} className="text-[#0A1E3E] border-[#0A1E3E]/30 hover:bg-[#0A1E3E]/5">
                                    <Eye className="h-4 w-4 mr-1" /> Visualizar
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleEdit(session)}>
                                    <Edit className="h-4 w-4 mr-1" /> Editar
                                  </Button>
                                </div>
                              </div>
                              {session.feedback && (
                                <div className="text-sm text-gray-600 bg-gray-50 rounded-md px-3 py-2 border-l-2 border-gray-300">
                                  <p className="line-clamp-2">{session.feedback}</p>
                                </div>
                              )}
                            </div>
                            {/* Barra de pontuação */}
                            <div className="bg-slate-50 border-t px-4 py-2.5 flex flex-wrap items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Target className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-gray-500 font-medium">Pontuação:</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className={`h-3.5 w-3.5 ${presencePoints === 100 ? 'text-emerald-600' : 'text-red-500'}`} />
                                <span className="text-gray-600">Presença:</span>
                                <span className={`font-bold ${presencePoints === 100 ? 'text-emerald-700' : 'text-red-600'}`}>{presencePoints} pts</span>
                              </div>
                              <span className="text-gray-300">|</span>
                              <div className="flex items-center gap-1.5">
                                <ClipboardCheck className={`h-3.5 w-3.5 ${taskPoints === 100 ? 'text-emerald-600' : taskPoints === 0 ? 'text-red-500' : 'text-gray-400'}`} />
                                <span className="text-gray-600">Tarefa:</span>
                                {isFirstSession ? (
                                  <span className="text-gray-400 italic">N/A (1ª sessão)</span>
                                ) : taskPoints !== null ? (
                                  <span className={`font-bold ${taskPoints === 100 ? 'text-emerald-700' : 'text-red-600'}`}>{taskPoints} pts</span>
                                ) : (
                                  <span className="text-gray-400 italic">N/A</span>
                                )}
                              </div>
                              <span className="text-gray-300">|</span>
                              <div className="flex items-center gap-1.5">
                                <TrendingUp className={`h-3.5 w-3.5 ${!isFirstSession && session.notaEvolucao != null ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span className="text-gray-600">Evolução:</span>
                                {isFirstSession ? (
                                  <span className="text-gray-400 italic">N/A (1ª sessão)</span>
                                ) : session.notaEvolucao != null ? (
                                  <span className="font-bold text-blue-700">{Math.round((session.notaEvolucao / 10) * 100)} pts</span>
                                ) : (
                                  <span className="text-gray-400 italic">N/A</span>
                                )}
                              </div>
                              {/* Aplicabilidade Prática - mini comparativo */}
                              {((session as any).notaAlunoAplicabilidade !== null || (session as any).notaMentoraAplicabilidade !== null) && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <div className="flex items-center gap-1.5">
                                    <Target className="h-3.5 w-3.5 text-indigo-500" />
                                    <span className="text-gray-600">Aplic.:</span>
                                    {(session as any).notaAlunoAplicabilidade !== null && (
                                      <span className={`font-medium ${(session as any).notaAlunoAplicabilidade >= 8 ? 'text-emerald-700' : (session as any).notaAlunoAplicabilidade >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                                        A:{(session as any).notaAlunoAplicabilidade}
                                      </span>
                                    )}
                                    {(session as any).notaMentoraAplicabilidade !== null && (
                                      <span className={`font-medium ${(session as any).notaMentoraAplicabilidade >= 8 ? 'text-emerald-700' : (session as any).notaMentoraAplicabilidade >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                                        M:{(session as any).notaMentoraAplicabilidade}
                                      </span>
                                    )}
                                    {(session as any).notaAlunoAplicabilidade !== null && (session as any).notaMentoraAplicabilidade !== null && (
                                      <Badge className={`text-[10px] px-1.5 py-0 border-0 ${
                                        ((session as any).notaAlunoAplicabilidade + (session as any).notaMentoraAplicabilidade) / 2 >= 8 
                                          ? 'bg-emerald-100 text-emerald-800' 
                                          : ((session as any).notaAlunoAplicabilidade + (session as any).notaMentoraAplicabilidade) / 2 >= 5 
                                            ? 'bg-amber-100 text-amber-800' 
                                            : 'bg-red-100 text-red-800'
                                      }`}>
                                        \u00d8{(((session as any).notaAlunoAplicabilidade + (session as any).notaMentoraAplicabilidade) / 2).toFixed(1)}
                                      </Badge>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma sessão de mentoria encontrada para este aluno.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mensagem quando nenhum aluno selecionado */}
        {!selectedAlunoId && (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione um Aluno</h3>
              <p className="text-gray-500">Use os filtros acima para selecionar um aluno e visualizar suas sessões de mentoria.</p>
            </CardContent>
          </Card>
        )}

        {/* Modal de Visualização da Sessão */}
        <Dialog open={!!viewingSession} onOpenChange={(open) => { if (!open) setTimeout(() => setViewingSession(null), 100); }}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#0A1E3E]" />
                Detalhes da Sessão {viewedSession?.sessionNumber || ''}
              </DialogTitle>
              <DialogDescription>
                {selectedAluno?.name} - {viewedSession?.sessionDate ? formatDateSafe(viewedSession.sessionDate) : ''}
              </DialogDescription>
            </DialogHeader>
            
            {viewedSession && (
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Sessão</p>
                    <p className="font-bold text-lg">{viewedSession.sessionNumber || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Data</p>
                    <p className="font-bold text-lg">{viewedSession.sessionDate ? formatDateSafe(viewedSession.sessionDate) : '-'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-lg p-3 border ${viewedSession.presence === 'presente' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Presença</p>
                    <div className="flex items-center justify-between">
                      <Badge className={getPresenceColor(viewedSession.presence)}>{viewedSession.presence === 'presente' ? 'Presente' : 'Ausente'}</Badge>
                      <span className={`font-bold text-lg ${viewedSession.presence === 'presente' ? 'text-emerald-700' : 'text-red-600'}`}>{getPresencePoints(viewedSession.presence)} pts</span>
                    </div>
                  </div>
                  <div className={`rounded-lg p-3 border ${viewedSession.taskStatus === 'entregue' ? 'bg-emerald-50 border-emerald-200' : viewedSession.taskStatus === 'nao_entregue' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><ClipboardCheck className="h-3 w-3" /> Tarefa</p>
                    <div className="flex items-center justify-between">
                      <Badge className={getTaskColor(viewedSession.taskStatus)}>{getTaskLabel(viewedSession.taskStatus)}</Badge>
                      {(() => {
                        const pts = getTaskPoints(viewedSession.taskStatus);
                        return pts !== null ? (
                          <span className={`font-bold text-lg ${pts === 100 ? 'text-emerald-700' : 'text-red-600'}`}>{pts} pts</span>
                        ) : (<span className="text-gray-400 text-sm italic">N/A</span>);
                      })()}
                    </div>
                  </div>
                </div>
                
                {/* Nível de Engajamento */}
                {(() => {
                  const nota = viewedSession.notaEvolucao ?? viewedSession.engagementScore;
                  if (nota == null) return (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Star className="h-3 w-3" /> Nível de Engajamento</p>
                      <span className="text-gray-400 italic">Não informado</span>
                    </div>
                  );
                  const stage = getEvolucaoStage(nota);
                  return (
                    <div className={`rounded-lg p-4 border ${stage.bgColor} ${stage.borderColor}`}>
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Star className="h-3 w-3" /> Nível de Engajamento</p>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-3xl ${stage.textColor}`}>{nota}</span>
                        <span className={`text-lg ${stage.textColor}`}>/10</span>
                        <Badge className={`text-sm px-3 py-1 ${stage.badgeBg} ${stage.badgeText} border-0`}>{stage.label}</Badge>
                      </div>
                    </div>
                  );
                })()}
                
                {/* === COMPARATIVO APLICABILIDADE PRÁTICA: Aluno vs Mentora === */}
                {(() => {
                  const notaAluno = (viewedSession as any).notaAlunoAplicabilidade;
                  const notaMentora = (viewedSession as any).notaMentoraAplicabilidade;
                  const textoAplic = (viewedSession as any).textoAplicabilidade;
                  const hasAny = notaAluno !== null || notaMentora !== null || textoAplic;
                  if (!hasAny) return null;
                  
                  const getNotaColor = (n: number | null) => {
                    if (n === null || n === undefined) return 'text-gray-400';
                    if (n >= 8) return 'text-emerald-700';
                    if (n >= 5) return 'text-amber-600';
                    return 'text-red-600';
                  };
                  const getNotaBg = (n: number | null) => {
                    if (n === null || n === undefined) return 'bg-gray-50 border-gray-200';
                    if (n >= 8) return 'bg-emerald-50 border-emerald-200';
                    if (n >= 5) return 'bg-amber-50 border-amber-200';
                    return 'bg-red-50 border-red-200';
                  };
                  
                  // Calculate average
                  const hasAvg = notaAluno !== null && notaAluno !== undefined && notaMentora !== null && notaMentora !== undefined;
                  const avg = hasAvg ? ((notaAluno + notaMentora) / 2).toFixed(1) : null;
                  
                  return (
                    <div className="rounded-lg border border-indigo-200 overflow-hidden">
                      <div className="bg-indigo-50 px-4 py-2.5 border-b border-indigo-200">
                        <p className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Aplicabilidade Pr\u00e1tica — Comparativo
                        </p>
                      </div>
                      <div className="p-4 space-y-3">
                        {/* Side by side comparison */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Nota do Aluno */}
                          <div className={`rounded-lg p-3 border ${getNotaBg(notaAluno)}`}>
                            <p className="text-xs text-gray-500 mb-1 font-medium">Autoavalia\u00e7\u00e3o do Aluno</p>
                            {notaAluno !== null && notaAluno !== undefined ? (
                              <div className="flex items-baseline gap-1">
                                <span className={`font-bold text-2xl ${getNotaColor(notaAluno)}`}>{notaAluno}</span>
                                <span className="text-gray-400 text-sm">/10</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-sm">N\u00e3o preenchido</span>
                            )}
                          </div>
                          {/* Nota da Mentora */}
                          <div className={`rounded-lg p-3 border ${getNotaBg(notaMentora)}`}>
                            <p className="text-xs text-gray-500 mb-1 font-medium">Avalia\u00e7\u00e3o da Mentora</p>
                            {notaMentora !== null && notaMentora !== undefined ? (
                              <div className="flex items-baseline gap-1">
                                <span className={`font-bold text-2xl ${getNotaColor(notaMentora)}`}>{notaMentora}</span>
                                <span className="text-gray-400 text-sm">/10</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-sm">N\u00e3o avaliado</span>
                            )}
                          </div>
                        </div>
                        {/* Average / Indicator */}
                        {hasAvg && avg && (
                          <div className={`rounded-lg p-3 border text-center ${Number(avg) >= 8 ? 'bg-emerald-50 border-emerald-300' : Number(avg) >= 5 ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-300'}`}>
                            <p className="text-xs text-gray-500 mb-1">M\u00e9dia (Indicador de Aplicabilidade)</p>
                            <span className={`font-bold text-xl ${Number(avg) >= 8 ? 'text-emerald-700' : Number(avg) >= 5 ? 'text-amber-600' : 'text-red-600'}`}>{avg}/10</span>
                            {Number(avg) >= 8 && (
                              <p className="text-xs text-emerald-600 mt-1 font-medium">B\u00f4nus de +10% no engajamento!</p>
                            )}
                          </div>
                        )}
                        {/* Texto descritivo do aluno */}
                        {textoAplic && (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1 font-medium">Relato do Aluno sobre a Aplica\u00e7\u00e3o Pr\u00e1tica</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{textoAplic}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Pontuação convertida */}
                <div className="bg-[#0A1E3E]/5 rounded-lg p-3 border border-[#0A1E3E]/10">
                  <p className="text-xs text-[#0A1E3E] font-medium mb-2">Pontuação Convertida (base 100)</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Presença</p>
                      <p className={`font-bold text-lg ${getPresencePoints(viewedSession.presence) === 100 ? 'text-emerald-700' : 'text-red-600'}`}>{getPresencePoints(viewedSession.presence)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tarefa</p>
                      {(() => {
                        const pts = getTaskPoints(viewedSession.taskStatus);
                        return pts !== null ? (<p className={`font-bold text-lg ${pts === 100 ? 'text-emerald-700' : 'text-red-600'}`}>{pts}</p>) : (<p className="text-gray-400 text-sm italic">N/A</p>);
                      })()}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Evolução</p>
                      {viewedSession.notaEvolucao != null ? (
                        <p className="font-bold text-lg text-blue-700">{Math.round((viewedSession.notaEvolucao / 10) * 100)}</p>
                      ) : (<p className="text-gray-400 text-sm italic">N/A</p>)}
                    </div>
                  </div>
                </div>
                
                {/* B1: Detalhes da tarefa personalizada/livre */}
                {(viewedSession as any).customTaskTitle && (
                  <div className={`rounded-lg p-3 border ${
                    (viewedSession as any).taskMode === 'personalizada' ? 'bg-purple-50 border-purple-200' 
                    : (viewedSession as any).taskMode === 'livre' ? 'bg-amber-50 border-amber-200' 
                    : 'bg-blue-50 border-blue-200'
                  }`}>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      {(viewedSession as any).taskMode === 'personalizada' ? <Pencil className="h-3 w-3" /> : <FileEdit className="h-3 w-3" />}
                      {(viewedSession as any).taskMode === 'personalizada' ? 'Tarefa Personalizada' : (viewedSession as any).taskMode === 'livre' ? 'Tarefa Livre' : 'Tarefa'}
                    </p>
                    <p className="font-medium text-sm">{(viewedSession as any).customTaskTitle}</p>
                    {(viewedSession as any).customTaskDescription && (
                      <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{(viewedSession as any).customTaskDescription}</p>
                    )}
                  </div>
                )}

                {viewedSession.feedback && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">Feedback / Observações</p>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap overflow-y-auto max-h-40">{viewedSession.feedback}</div>
                  </div>
                )}

                {/* === SEÇÃO DE EVIDÊNCIA DO ALUNO === */}
                {submissionDetail && (submissionDetail.evidenceLink || submissionDetail.evidenceImageUrl || submissionDetail.submittedAt) && (
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" /> Evidência do Aluno
                    </h4>
                    {submissionDetail.submittedAt && (
                      <p className="text-xs text-gray-500">Enviado em: {new Date(submissionDetail.submittedAt).toLocaleString('pt-BR')}</p>
                    )}
                    {submissionDetail.evidenceLink && (
                      <div className="p-3 rounded bg-blue-50 border border-blue-200">
                        <p className="text-xs font-medium text-gray-700 mb-1">Link:</p>
                        <a href={submissionDetail.evidenceLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> {submissionDetail.evidenceLink}
                        </a>
                      </div>
                    )}
                    {submissionDetail.evidenceImageUrl && (
                      <div className="p-3 rounded bg-gray-50 border border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Imagem:</p>
                        <img src={submissionDetail.evidenceImageUrl} alt="Evidência" className="max-w-full max-h-48 rounded-lg border cursor-pointer" onClick={() => window.open(submissionDetail.evidenceImageUrl!, '_blank')} />
                      </div>
                    )}
                    {submissionDetail.relatoAluno && (
                      <div className="p-3 rounded bg-gray-50 border border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-1">Relato do Aluno:</p>
                        <p className="text-xs text-gray-600 whitespace-pre-wrap">{submissionDetail.relatoAluno}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* === VALIDAÇÃO === */}
                {submissionDetail && viewedSession.taskStatus === 'entregue' && submissionDetail.submittedAt && (
                  <div className="border-t pt-4">
                    <Button
                      onClick={() => validateTask.mutate({ sessionId: viewedSession.id })}
                      disabled={validateTask.isPending}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      {validateTask.isPending ? 'Validando...' : 'Atividade Prática Entregue (Validar)'}
                    </Button>
                  </div>
                )}

                {/* === STATUS VALIDADA === */}
                {submissionDetail && viewedSession.taskStatus === 'validada' && submissionDetail.validatedAt && (
                  <div className="p-3 rounded bg-purple-50 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-700 flex items-center gap-1">
                      <Award className="h-3 w-3" /> Atividade Validada
                    </p>
                    <p className="text-xs text-purple-600 mt-1">Validada em: {new Date(submissionDetail.validatedAt).toLocaleString('pt-BR')}</p>
                    {submissionDetail.validatedByName && (
                      <p className="text-xs text-purple-600">Por: {submissionDetail.validatedByName}</p>
                    )}
                  </div>
                )}

                {/* === COMENTÁRIOS === */}
                {submissionDetail && (
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" /> Comentários
                      {submissionDetail.comments && submissionDetail.comments.length > 0 && (
                        <Badge variant="outline" className="text-xs">{submissionDetail.comments.length}</Badge>
                      )}
                    </h4>
                    {submissionDetail.comments && submissionDetail.comments.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {submissionDetail.comments.map((c: any) => (
                          <div key={c.id} className="p-3 rounded bg-gray-50 border border-gray-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-700">{c.authorName}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {c.authorRole === 'mentor' ? 'Mentora' : 'Admin'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">{c.comment}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(c.createdAt).toLocaleString('pt-BR')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Adicionar comentário..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="text-sm min-h-[60px] flex-1"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addComment.mutate({ sessionId: viewedSession.id, comment: commentText })}
                      disabled={!commentText.trim() || addComment.isPending}
                      className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {addComment.isPending ? 'Enviando...' : 'Enviar Comentário'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
