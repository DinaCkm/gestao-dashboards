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
import { getEvolucaoStage } from "@/lib/evolucaoStages";
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
  Target
} from "lucide-react";

export default function RegistroMentoria() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const userConsultorId = (user as any)?.consultorId as number | null;

  const [selectedProgramId, setSelectedProgramId] = useState<string>("all");
  const [selectedAlunoId, setSelectedAlunoId] = useState<number | null>(null);
  const [editingSession, setEditingSession] = useState<number | null>(null);
  const [viewingSession, setViewingSession] = useState<number | null>(null);
  const [notaEvolucao, setNotaEvolucao] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");

  // Para admin: buscar todos os programas; para mentor: buscar apenas os programas do mentor
  const { data: allPrograms = [] } = trpc.programs.list.useQuery(undefined, { enabled: isAdmin });
  const { data: mentorPrograms = [] } = trpc.alunos.programsByConsultor.useQuery(
    { consultorId: userConsultorId! },
    { enabled: !!userConsultorId && !isAdmin }
  );

  const programs = isAdmin ? allPrograms : mentorPrograms;

  // Para admin: buscar todos os alunos (opcionalmente filtrados por programa)
  // Para mentor: buscar apenas os alunos do mentor (opcionalmente filtrados por programa)
  const { data: adminAlunos = [] } = trpc.alunos.list.useQuery(
    selectedProgramId !== "all" ? { programId: parseInt(selectedProgramId) } : undefined,
    { enabled: isAdmin }
  );

  const { data: mentorAlunos = [] } = trpc.alunos.byConsultor.useQuery(
    { 
      consultorId: userConsultorId!, 
      programId: selectedProgramId !== "all" ? parseInt(selectedProgramId) : undefined 
    },
    { enabled: !!userConsultorId && !isAdmin }
  );

  const alunos = isAdmin ? adminAlunos : mentorAlunos;

  // Buscar sessões de mentoria do aluno
  const { data: sessions = [], refetch: refetchSessions } = trpc.mentor.sessionsByAluno.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );

  // Mutation para atualizar sessão
  const updateSession = trpc.mentor.updateSession.useMutation({
    onSuccess: () => {
      toast.success("Sessão atualizada com sucesso!");
      refetchSessions();
      setEditingSession(null);
      setNotaEvolucao("");
      setFeedback("");
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    }
  });

  // Aluno selecionado
  const selectedAluno = useMemo(() => {
    return alunos.find(a => a.id === selectedAlunoId);
  }, [alunos, selectedAlunoId]);

  // Programa do aluno
  const alunoProgram = useMemo(() => {
    if (!selectedAluno?.programId) return null;
    return programs.find(p => p.id === selectedAluno.programId);
  }, [selectedAluno, programs]);

  // Mentor name
  const mentorName = (user as any)?.name || 'Mentor';

  // Sessão sendo visualizada
  const viewedSession = useMemo(() => {
    if (!viewingSession) return null;
    return sessions.find(s => s.id === viewingSession) || null;
  }, [sessions, viewingSession]);

  // Iniciar edição de uma sessão
  const handleEdit = (session: { id: number; notaEvolucao?: number | null; feedback?: string | null }) => {
    setEditingSession(session.id);
    setNotaEvolucao(session.notaEvolucao?.toString() || "");
    setFeedback(session.feedback || "");
  };

  // Salvar edição
  const handleSave = () => {
    if (!editingSession) return;
    
    const nota = notaEvolucao ? parseInt(notaEvolucao) : undefined;
    if (nota !== undefined && (nota < 0 || nota > 10)) {
      toast.error("A nota de evolução deve ser entre 0 e 10");
      return;
    }

    updateSession.mutate({
      sessionId: editingSession,
      notaEvolucao: nota,
      feedback: feedback || undefined
    });
  };

  // Cancelar edição
  const handleCancel = () => {
    setEditingSession(null);
    setNotaEvolucao("");
    setFeedback("");
  };

  // Função para obter cor da presença
  const getPresenceColor = (presence: string) => {
    return presence === 'presente' 
      ? 'bg-emerald-100 text-emerald-800' 
      : 'bg-red-100 text-red-800';
  };

  // Função para obter cor do status da tarefa
  const getTaskColor = (status: string | null) => {
    switch (status) {
      case 'entregue': return 'bg-emerald-100 text-emerald-800';
      case 'nao_entregue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter label do status da tarefa
  const getTaskLabel = (status: string | null) => {
    switch (status) {
      case 'entregue': return 'Entregue';
      case 'nao_entregue': return 'Não Entregue';
      case 'sem_tarefa': return 'Sem Tarefa';
      default: return 'Não Informado';
    }
  };

  // Pontuação de presença
  const getPresencePoints = (presence: string) => {
    return presence === 'presente' ? 100 : 0;
  };

  // Pontuação de tarefa
  const getTaskPoints = (status: string | null) => {
    if (status === 'entregue') return 100;
    if (status === 'nao_entregue') return 0;
    return null; // sem_tarefa ou não informado
  };

  // Reset aluno when program changes
  const handleProgramChange = (value: string) => {
    setSelectedProgramId(value);
    setSelectedAlunoId(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registro de Mentoria</h1>
            <p className="text-gray-500">Registre a nota de evolução (0-10) e feedback das sessões de mentoria</p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-[#1B3A5D]" />
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
              {/* Empresa/Programa - apenas para admin */}
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
                    if (val === "") {
                      setSelectedAlunoId(null);
                    } else {
                      const id = parseInt(val);
                      if (!isNaN(id)) setSelectedAlunoId(id);
                    }
                  }}
                >
                  <option value="">Selecione um aluno</option>
                  {alunos.map(a => (
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
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#1B3A5D] to-[#2D5A87] flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedAluno.name}</h2>
                  <div className="flex items-center gap-2">
                    {alunoProgram && (
                      <Badge variant="outline" className="text-[#1B3A5D] border-[#1B3A5D]">
                        {alunoProgram.name}
                      </Badge>
                    )}
                    <span className="text-sm text-gray-500">{sessions.length} sessões registradas</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Sessões */}
        {selectedAlunoId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#1B3A5D]" />
                Sessões de Mentoria
              </CardTitle>

            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((session) => {
                    const presencePoints = getPresencePoints(session.presence);
                    const isFirstSession = session.sessionNumber === 1;
                    const taskPoints = isFirstSession ? null : getTaskPoints(session.taskStatus);
                    
                    return (
                      <div 
                        key={session.id}
                        className="border rounded-lg hover:bg-gray-50/50 transition-colors overflow-hidden"
                      >
                        {editingSession === session.id ? (
                          // Modo de edição
                          <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <span className="font-medium">
                                  Sessão {session.sessionNumber || '-'} - {session.sessionDate ? new Date(session.sessionDate).toLocaleDateString('pt-BR') : 'Data não informada'}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={handleCancel}>
                                  Cancelar
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={handleSave}
                                  disabled={updateSession.isPending}
                                  className="bg-[#1B3A5D] hover:bg-[#2D5A87]"
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Salvar
                                </Button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="notaEvolucao" className="flex items-center gap-2">
                                  <Star className="h-4 w-4 text-amber-500" />
                                  Nota de Evolução (0-10)
                                </Label>
                                <Input
                                  id="notaEvolucao"
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={notaEvolucao}
                                  onChange={(e) => setNotaEvolucao(e.target.value)}
                                  placeholder="Digite a nota de 0 a 10"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="feedback">Feedback / Observações</Label>
                                <Textarea
                                  id="feedback"
                                  value={feedback}
                                  onChange={(e) => setFeedback(e.target.value)}
                                  placeholder="Observações sobre a sessão..."
                                  className="mt-1"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Modo de visualização
                          <>
                            {/* Linha principal da sessão */}
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
                                    {session.presence === 'presente' ? (
                                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Presente</>
                                    ) : (
                                      <><XCircle className="h-3 w-3 mr-1" /> Ausente</>
                                    )}
                                  </Badge>
                                  
                                  {isFirstSession ? (
                                    <Badge className="bg-gray-100 text-gray-500 border border-gray-200">
                                      <ClipboardCheck className="h-3 w-3 mr-1" /> Sem tarefa (1ª sessão)
                                    </Badge>
                                  ) : session.taskStatus && (
                                    <Badge className={getTaskColor(session.taskStatus)}>
                                      {session.taskStatus === 'entregue' ? (
                                        <><ClipboardCheck className="h-3 w-3 mr-1" /> Entregue</>
                                      ) : session.taskStatus === 'nao_entregue' ? (
                                        <><XCircle className="h-3 w-3 mr-1" /> Não Entregue</>
                                      ) : (
                                        'Sem Tarefa'
                                      )}
                                    </Badge>
                                  )}
                                  
                                  {session.engagementScore != null && (
                                    <div className="flex items-center gap-1 text-amber-600">
                                      <Star className="h-4 w-4 fill-current" />
                                      <span className="font-medium">{session.engagementScore}/10</span>
                                      <span className="text-sm text-gray-500">Engajamento</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  {session.notaEvolucao !== null && session.notaEvolucao !== undefined ? (() => {
                                    const stage = getEvolucaoStage(session.notaEvolucao);
                                    return (
                                      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${stage.bgColor} ${stage.borderColor}`}>
                                        <TrendingUp className={`h-4 w-4 ${stage.textColor}`} />
                                        <span className={`font-bold ${stage.textColor}`}>{session.notaEvolucao}/10</span>
                                        <Badge className={`text-xs ${stage.badgeBg} ${stage.badgeText} border-0`}>{stage.label}</Badge>
                                      </div>
                                    );
                                  })() : (
                                    <span className="text-sm text-gray-400 italic">Sem nota</span>
                                  )}
                                  
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setViewingSession(session.id)}
                                    className="text-[#1B3A5D] border-[#1B3A5D]/30 hover:bg-[#1B3A5D]/5"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Visualizar
                                  </Button>
                                  
                                  <Button size="sm" variant="outline" onClick={() => handleEdit(session)}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Editar
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Feedback resumido */}
                              {session.feedback && (
                                <div className="text-sm text-gray-600 bg-gray-50 rounded-md px-3 py-2 border-l-2 border-gray-300">
                                  <p className="line-clamp-2">{session.feedback}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Barra de pontuação abaixo da sessão */}
                            <div className="bg-slate-50 border-t px-4 py-2.5 flex flex-wrap items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Target className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-gray-500 font-medium">Pontuação:</span>
                              </div>
                              
                              {/* Presença */}
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className={`h-3.5 w-3.5 ${presencePoints === 100 ? 'text-emerald-600' : 'text-red-500'}`} />
                                <span className="text-gray-600">Presença:</span>
                                <span className={`font-bold ${presencePoints === 100 ? 'text-emerald-700' : 'text-red-600'}`}>
                                  {presencePoints} pts
                                </span>
                              </div>
                              
                              <span className="text-gray-300">|</span>
                              
                              {/* Tarefa */}
                              <div className="flex items-center gap-1.5">
                                <ClipboardCheck className={`h-3.5 w-3.5 ${taskPoints === 100 ? 'text-emerald-600' : taskPoints === 0 ? 'text-red-500' : 'text-gray-400'}`} />
                                <span className="text-gray-600">Tarefa:</span>
                                {isFirstSession ? (
                                  <span className="text-gray-400 italic">N/A (1ª sessão)</span>
                                ) : taskPoints !== null ? (
                                  <span className={`font-bold ${taskPoints === 100 ? 'text-emerald-700' : 'text-red-600'}`}>
                                    {taskPoints} pts
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">N/A</span>
                                )}
                              </div>
                              
                              <span className="text-gray-300">|</span>
                              
                              {/* Evolução */}
                              <div className="flex items-center gap-1.5">
                                <TrendingUp className={`h-3.5 w-3.5 ${session.notaEvolucao != null ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span className="text-gray-600">Evolução:</span>
                                {session.notaEvolucao != null ? (
                                  <span className="font-bold text-blue-700">
                                    {Math.round((session.notaEvolucao / 10) * 100)} pts
                                  </span>
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
              <p className="text-gray-500">
                Use os filtros acima para selecionar um aluno e visualizar suas sessões de mentoria.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Modal de Visualização da Sessão */}
        <Dialog open={!!viewingSession} onOpenChange={(open) => { if (!open) setTimeout(() => setViewingSession(null), 100); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#1B3A5D]" />
                Detalhes da Sessão {viewedSession?.sessionNumber || ''}
              </DialogTitle>
              <DialogDescription>
                {selectedAluno?.name} - {viewedSession?.sessionDate ? new Date(viewedSession.sessionDate).toLocaleDateString('pt-BR') : ''}
              </DialogDescription>
            </DialogHeader>
            
            {viewedSession && (
              <div className="space-y-4 mt-2">
                {/* Informações básicas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Sessão</p>
                    <p className="font-bold text-lg">{viewedSession.sessionNumber || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Data</p>
                    <p className="font-bold text-lg">
                      {viewedSession.sessionDate ? new Date(viewedSession.sessionDate).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                </div>
                
                {/* Presença e Tarefa */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-lg p-3 border ${viewedSession.presence === 'presente' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Presença
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge className={getPresenceColor(viewedSession.presence)}>
                        {viewedSession.presence === 'presente' ? 'Presente' : 'Ausente'}
                      </Badge>
                      <span className={`font-bold text-lg ${viewedSession.presence === 'presente' ? 'text-emerald-700' : 'text-red-600'}`}>
                        {getPresencePoints(viewedSession.presence)} pts
                      </span>
                    </div>
                  </div>
                  
                  <div className={`rounded-lg p-3 border ${
                    viewedSession.taskStatus === 'entregue' ? 'bg-emerald-50 border-emerald-200' : 
                    viewedSession.taskStatus === 'nao_entregue' ? 'bg-red-50 border-red-200' : 
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <ClipboardCheck className="h-3 w-3" /> Tarefa
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge className={getTaskColor(viewedSession.taskStatus)}>
                        {getTaskLabel(viewedSession.taskStatus)}
                      </Badge>
                      {(() => {
                        const pts = getTaskPoints(viewedSession.taskStatus);
                        return pts !== null ? (
                          <span className={`font-bold text-lg ${pts === 100 ? 'text-emerald-700' : 'text-red-600'}`}>
                            {pts} pts
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm italic">N/A</span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                {/* Engajamento e Evolução */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Star className="h-3 w-3" /> Engajamento
                    </p>
                    <div className="flex items-center gap-2">
                      {viewedSession.engagementScore != null ? (
                        <>
                          <span className="font-bold text-2xl text-amber-700">{viewedSession.engagementScore}</span>
                          <span className="text-amber-600">/10</span>
                        </>
                      ) : (
                        <span className="text-gray-400 italic">Não informado</span>
                      )}
                    </div>
                  </div>
                  
                  <div className={`rounded-lg p-3 border ${
                    viewedSession.notaEvolucao != null 
                      ? `${getEvolucaoStage(viewedSession.notaEvolucao).bgColor} ${getEvolucaoStage(viewedSession.notaEvolucao).borderColor}`
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Evolução
                    </p>
                    {viewedSession.notaEvolucao != null ? (() => {
                      const stage = getEvolucaoStage(viewedSession.notaEvolucao!);
                      return (
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-2xl ${stage.textColor}`}>{viewedSession.notaEvolucao}</span>
                          <span className={stage.textColor}>/10</span>
                          <Badge className={`text-xs ${stage.badgeBg} ${stage.badgeText} border-0`}>{stage.label}</Badge>
                        </div>
                      );
                    })() : (
                      <span className="text-gray-400 italic">Não informada</span>
                    )}
                  </div>
                </div>
                
                {/* Pontuação convertida */}
                <div className="bg-[#1B3A5D]/5 rounded-lg p-3 border border-[#1B3A5D]/10">
                  <p className="text-xs text-[#1B3A5D] font-medium mb-2">Pontuação Convertida (base 100)</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Presença</p>
                      <p className={`font-bold text-lg ${getPresencePoints(viewedSession.presence) === 100 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {getPresencePoints(viewedSession.presence)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tarefa</p>
                      {(() => {
                        const pts = getTaskPoints(viewedSession.taskStatus);
                        return pts !== null ? (
                          <p className={`font-bold text-lg ${pts === 100 ? 'text-emerald-700' : 'text-red-600'}`}>{pts}</p>
                        ) : (
                          <p className="text-gray-400 text-sm italic">N/A</p>
                        );
                      })()}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Evolução</p>
                      {viewedSession.notaEvolucao != null ? (
                        <p className="font-bold text-lg text-blue-700">{Math.round((viewedSession.notaEvolucao / 10) * 100)}</p>
                      ) : (
                        <p className="text-gray-400 text-sm italic">N/A</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Feedback */}
                {viewedSession.feedback && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">Feedback / Observações</p>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap overflow-y-auto max-h-40">
                      {viewedSession.feedback}
                    </div>
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
