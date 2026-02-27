import { useState, useMemo } from "react";
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
  X
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

  // Filtered task library
  const filteredTasks = useMemo(() => {
    if (!taskSearch.trim()) return taskLibrary;
    const search = taskSearch.toLowerCase();
    return taskLibrary.filter(t => 
      t.competencia?.toLowerCase().includes(search) || 
      t.nome?.toLowerCase().includes(search)
    );
  }, [taskLibrary, taskSearch]);

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
  };

  const handleSave = () => {
    if (!editingSession) return;
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
    });
  };

  const handleCancel = () => {
    setEditingSession(null);
    setSelectedStage(null);
    setFeedback("");
    setMensagemAluno("");
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
  };

  const handleCreateSession = () => {
    if (!selectedAlunoId || !newSessionDate) {
      toast.error("Preencha a data da sessão");
      return;
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

  // Task selector component
  const TaskSelector = ({ value, onChange, deadline, onDeadlineChange }: { 
    value: number | null; onChange: (v: number | null) => void;
    deadline: string; onDeadlineChange: (v: string) => void;
  }) => {
    const selectedTask = taskLibrary.find(t => t.id === value);
    return (
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#0A1E3E]" />
          Tarefa da Biblioteca
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por competência ou nome da ação..."
            value={taskSearch}
            onChange={(e) => setTaskSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
          <button
            type="button"
            onClick={() => onChange(null)}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${!value ? 'bg-blue-50 font-medium' : ''}`}
          >
            Sem tarefa
          </button>
          {filteredTasks.map(task => (
            <button
              key={task.id}
              type="button"
              onClick={() => onChange(task.id)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${value === task.id ? 'bg-blue-50 font-medium' : ''}`}
            >
              <span className="font-medium text-[#0A1E3E]">{task.competencia}</span>
              <span className="text-gray-400 mx-1">—</span>
              <span>{task.nome}</span>
            </button>
          ))}
        </div>
        {selectedTask && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
            <p className="font-medium text-sm text-[#0A1E3E]">{selectedTask.competencia}: {selectedTask.nome}</p>
            <p className="text-xs text-gray-600"><strong>Resumo:</strong> {selectedTask.resumo}</p>
            <p className="text-xs text-gray-600"><strong>O que fazer:</strong> {selectedTask.oQueFazer}</p>
            <p className="text-xs text-gray-600"><strong>O que o aluno ganha:</strong> {selectedTask.oQueGanha}</p>
          </div>
        )}
        {value && (
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
              {sessionProgress && (
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
                      {sessionProgress.macroInicio ? new Date(sessionProgress.macroInicio).toLocaleDateString('pt-BR') : ''}
                      {' → '}
                      {sessionProgress.macroTermino ? new Date(sessionProgress.macroTermino).toLocaleDateString('pt-BR') : ''}
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
                          {new Date(sessionProgress.macroInicio).toLocaleDateString('pt-BR')}
                          {' a '}
                          {new Date(sessionProgress.macroTermino).toLocaleDateString('pt-BR')}
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
                <div className="mb-6 border-2 border-[#0A1E3E]/20 rounded-xl p-6 bg-[#0A1E3E]/5 space-y-6">
                  <h3 className="text-lg font-bold text-[#0A1E3E] flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Nova Sessão de Mentoria
                    <Badge className="bg-[#0A1E3E] text-white border-0">
                      Sessão {sessions.length > 0 ? Math.max(...sessions.map(s => s.sessionNumber ?? 0)) + 1 : 1}
                    </Badge>
                  </h3>

                  {/* Seção 1: Data */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-[#0A1E3E]" />
                      Data da Sessão *
                    </Label>
                    <Input type="date" value={newSessionDate} onChange={(e) => setNewSessionDate(e.target.value)} className="max-w-xs" />
                  </div>

                  {/* Seção 2: Presença */}
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

                  {/* Seção 3: Tarefa */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <ClipboardCheck className="h-4 w-4 text-[#0A1E3E]" />
                      Status da Tarefa
                    </Label>
                    <div className="flex gap-3 mb-3">
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
                    <TaskSelector 
                      value={newTaskId} 
                      onChange={setNewTaskId}
                      deadline={newTaskDeadline}
                      onDeadlineChange={setNewTaskDeadline}
                    />
                  </div>

                  {/* Seção 4: Nível de Engajamento */}
                  <StageSelector value={newSelectedStage} onChange={setNewSelectedStage} />

                  {/* Seção 5: Feedback ao Aluno */}
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
                                  Sessão {session.sessionNumber || '-'} - {session.sessionDate ? new Date(session.sessionDate).toLocaleDateString('pt-BR') : 'Data não informada'}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={handleCancel}>Cancelar</Button>
                                <Button size="sm" onClick={handleSave} disabled={updateSession.isPending} className="bg-[#0A1E3E] hover:bg-[#2D5A87]">
                                  <Save className="h-4 w-4 mr-1" /> Salvar
                                </Button>
                              </div>
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

                            {/* Status da Tarefa */}
                            <div>
                              <Label className="flex items-center gap-2 mb-2">Status da Tarefa</Label>
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

                            {/* Tarefa da Biblioteca */}
                            <TaskSelector value={editTaskId} onChange={setEditTaskId} deadline={editTaskDeadline} onDeadlineChange={setEditTaskDeadline} />

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
                                        {session.sessionDate ? new Date(session.sessionDate).toLocaleDateString('pt-BR') : 'Data não informada'}
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#0A1E3E]" />
                Detalhes da Sessão {viewedSession?.sessionNumber || ''}
              </DialogTitle>
              <DialogDescription>
                {selectedAluno?.name} - {viewedSession?.sessionDate ? new Date(viewedSession.sessionDate).toLocaleDateString('pt-BR') : ''}
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
                    <p className="font-bold text-lg">{viewedSession.sessionDate ? new Date(viewedSession.sessionDate).toLocaleDateString('pt-BR') : '-'}</p>
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
                
                {viewedSession.feedback && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">Feedback / Observações</p>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap overflow-y-auto max-h-40">{viewedSession.feedback}</div>
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
