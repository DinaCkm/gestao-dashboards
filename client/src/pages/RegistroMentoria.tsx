import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Calendar, 
  User, 
  Star, 
  CheckCircle2, 
  XCircle,
  Edit,
  Save,
  TrendingUp
} from "lucide-react";

export default function RegistroMentoria() {
  const [selectedProgramId, setSelectedProgramId] = useState<string>("all");
  const [selectedAlunoId, setSelectedAlunoId] = useState<number | null>(null);
  const [editingSession, setEditingSession] = useState<number | null>(null);
  const [notaEvolucao, setNotaEvolucao] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");

  // Buscar lista de programas
  const { data: programs = [] } = trpc.programs.list.useQuery();
  
  // Buscar lista de alunos
  const { data: alunos = [] } = trpc.alunos.list.useQuery(
    selectedProgramId !== "all" ? { programId: parseInt(selectedProgramId) } : undefined
  );

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
              Selecionar Aluno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Empresa/Programa</label>
                <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
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
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Aluno</label>
                <Select 
                  value={selectedAlunoId ? String(selectedAlunoId) : ""} 
                  onValueChange={(v) => setSelectedAlunoId(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {alunos.map(a => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <CardDescription>
                Clique em "Editar" para registrar a nota de evolução
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div 
                      key={session.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {editingSession === session.id ? (
                        // Modo de edição
                        <div className="space-y-4">
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
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
                            
                            {session.taskStatus && (
                              <Badge className={getTaskColor(session.taskStatus)}>
                                {session.taskStatus === 'entregue' ? 'Tarefa Entregue' : 
                                 session.taskStatus === 'nao_entregue' ? 'Tarefa Não Entregue' : 'Sem Tarefa'}
                              </Badge>
                            )}
                            
                            {session.engagementScore && (
                              <div className="flex items-center gap-1 text-amber-600">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="font-medium">{session.engagementScore}/5</span>
                                <span className="text-sm text-gray-500">Engajamento</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {session.notaEvolucao !== null && session.notaEvolucao !== undefined ? (
                              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                <span className="font-bold text-emerald-700">{session.notaEvolucao}/10</span>
                                <span className="text-sm text-emerald-600">Evolução</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Sem nota de evolução</span>
                            )}
                            
                            <Button size="sm" variant="outline" onClick={() => handleEdit(session)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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
      </div>
    </DashboardLayout>
  );
}
