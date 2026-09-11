import { useState, useMemo } from "react";
import { formatDateSafe } from "@/lib/dateUtils";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ClipboardCheck, Search, Filter, Eye, Calendar, User, Award,
  CheckCircle2, Clock, XCircle, ExternalLink, MessageSquare,
  Send, FileText, Image as ImageIcon, AlertTriangle, Minus, Zap
} from "lucide-react";

export default function AtividadesPraticas() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isMentor = user?.role === "manager" && !!(user as any)?.consultorId;

  // Filtros
  const [filterMentor, setFilterMentor] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [filterTurma, setFilterTurma] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [viewingSubmission, setViewingSubmission] = useState<number | null>(null);
  const [commentText, setCommentText] = useState<string>("");

  // Modal de Criar Ação
  const [showModalAcao, setShowModalAcao] = useState(false);
  const [acaoAlunoId, setAcaoAlunoId] = useState<number | null>(null);
  const [acaoAlunoNome, setAcaoAlunoNome] = useState<string>("");
  const [acaoTrilhaId, setAcaoTrilhaId] = useState<string>("");
  const [acaoCompetenciaId, setAcaoCompetenciaId] = useState<string>("");
  const [acaoTitulo, setAcaoTitulo] = useState("");
  const [acaoDescricao, setAcaoDescricao] = useState("");
  const [acaoPrazo, setAcaoPrazo] = useState("");

  // Queries
  const { data: programs = [] } = trpc.programs.list.useQuery();

  // Queries para o modal Criar Ação
  const { data: trilhasComCompetencias = [] } = trpc.competenciasCompTec.admin.listarTrilhasComCompetencias.useQuery(
    undefined,
    { enabled: showModalAcao }
  );
  const competenciasDaTrilha = (trilhasComCompetencias as any[])
    .find(t => String(t.id) === acaoTrilhaId)?.competencias ?? [];
  const { data: turmas = [] } = trpc.turmas.list.useQuery();
  const { data: submissions = [], refetch: refetchSubmissions } = trpc.practicalActivities.submissions.useQuery({
    consultorId: filterMentor !== "all" ? parseInt(filterMentor) : undefined,
    status: filterStatus !== "all" ? filterStatus as any : undefined,
    programId: filterProgram !== "all" ? parseInt(filterProgram) : undefined,
    turmaId: filterTurma !== "all" ? parseInt(filterTurma) : undefined,
    dateFrom: filterDateFrom || undefined,
    dateTo: filterDateTo || undefined,
  });

  const { data: submissionDetail } = trpc.practicalActivities.submissionDetail.useQuery(
    { sessionId: viewingSubmission! },
    { enabled: !!viewingSubmission }
  );

  // Mutations
  const criarAcaoMutation = trpc.mentor.createSession.useMutation({
    onSuccess: () => {
      toast.success("Ação criada com sucesso!");
      setShowModalAcao(false);
      setAcaoAlunoId(null);
      setAcaoAlunoNome("");
      setAcaoTrilhaId("");
      setAcaoCompetenciaId("");
      setAcaoTitulo("");
      setAcaoDescricao("");
      setAcaoPrazo("");
      refetchSubmissions();
    },
    onError: (err: any) => toast.error(err.message ?? "Erro ao criar ação."),
  });

  function handleCriarAcao() {
    if (!acaoAlunoId) { toast.error("Selecione um aluno."); return; }
    if (!acaoCompetenciaId) { toast.error("Selecione a competência."); return; }
    if (!acaoTitulo.trim()) { toast.error("Informe o título da ação."); return; }
    if (!acaoPrazo) { toast.error("Informe o prazo."); return; }
    const hoje = new Date().toISOString().split("T")[0];
    criarAcaoMutation.mutate({
      alunoId: acaoAlunoId,
      sessionDate: hoje,
      presence: "presente",
      taskStatus: "nao_entregue",
      engagementScore: null,
      notaEvolucao: null,
      taskDeadline: acaoPrazo,
      taskMode: "livre",
      customTaskTitle: acaoTitulo.trim(),
      customTaskDescription: acaoDescricao.trim() || undefined,
      tipoSessao: "individual_normal",
    });
  }

  const addComment = trpc.practicalActivities.addComment.useMutation({
    onSuccess: () => {
      toast.success("Comentário adicionado!");
      setCommentText("");
      refetchSubmissions();
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  // Mentores únicos da lista de submissions
  const mentors = useMemo(() => {
    const map = new Map<number, string>();
    submissions.forEach((s: any) => {
      if (s.consultorId && s.consultorNome) map.set(s.consultorId, s.consultorNome);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [submissions]);

  // Turmas filtradas pelo programa selecionado
  const filteredTurmas = useMemo(() => {
    if (filterProgram === "all") return turmas;
    return turmas.filter((t: any) => t.programId === parseInt(filterProgram));
  }, [turmas, filterProgram]);

  // Filtro de busca por texto
  const filteredSubmissions = useMemo(() => {
    if (!searchText.trim()) return submissions;
    const search = searchText.toLowerCase();
    return submissions.filter((s: any) =>
      s.alunoNome?.toLowerCase().includes(search) ||
      s.taskName?.toLowerCase().includes(search) ||
      s.consultorNome?.toLowerCase().includes(search)
    );
  }, [submissions, searchText]);

  // Contadores
  const counts = useMemo(() => {
    const total = submissions.length;
    const pendentes = submissions.filter((s: any) => s.taskStatus === 'nao_entregue').length;
    const entregues = submissions.filter((s: any) => s.taskStatus === 'entregue').length;
    const validadas = submissions.filter((s: any) => s.taskStatus === 'validada').length;
    return { total, pendentes, entregues, validadas };
  }, [submissions]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'validada': return { label: 'Validada', className: 'bg-purple-50 text-purple-700 border-purple-300', icon: <Award className="h-3 w-3" /> };
      case 'entregue': return { label: 'Entregue', className: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: <CheckCircle2 className="h-3 w-3" /> };
      case 'nao_entregue': return { label: 'Pendente', className: 'bg-amber-50 text-amber-700 border-amber-300', icon: <Clock className="h-3 w-3" /> };
      default: return { label: 'Sem Tarefa', className: 'bg-gray-100 text-gray-600 border-gray-300', icon: <Minus className="h-3 w-3" /> };
    }
  };

  if (!isAdmin && !isMentor) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-gray-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Acesso restrito a administradores e mentores.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-[#F5991F]" />
            Atividades Práticas
          </h1>
          <p className="text-sm text-gray-500 mt-1">Governança e auditoria das atividades práticas atribuídas nas mentorias</p>
        </div>
        <Button
          onClick={() => setShowModalAcao(true)}
          className="bg-[#0A1E3E] hover:bg-[#2D5A87]"
        >
          <Zap className="h-4 w-4 mr-2" /> Criar Ação
        </Button>

        {/* Contadores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border border-amber-200">
            <CardContent className="p-4">
              <p className="text-xs text-amber-700">Pendentes</p>
              <p className="text-2xl font-bold text-amber-700">{counts.pendentes}</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border border-emerald-200">
            <CardContent className="p-4">
              <p className="text-xs text-emerald-700">Entregues</p>
              <p className="text-2xl font-bold text-emerald-700">{counts.entregues}</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border border-purple-200">
            <CardContent className="p-4">
              <p className="text-xs text-purple-700">Validadas</p>
              <p className="text-2xl font-bold text-purple-700">{counts.validadas}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Busca</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Aluno, tarefa ou mentor..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Programa</label>
                <Select value={filterProgram} onValueChange={(v) => { setFilterProgram(v); setFilterTurma("all"); }}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Programas</SelectItem>
                    {programs.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Turma</label>
                <Select value={filterTurma} onValueChange={setFilterTurma}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Turmas</SelectItem>
                    {filteredTurmas.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isAdmin && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Mentor</label>
                <Select value={filterMentor} onValueChange={setFilterMentor}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Mentores</SelectItem>
                    {mentors.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              )}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="nao_entregue">Pendente</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                    <SelectItem value="validada">Validada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Período De</label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Período Até</label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    setFilterMentor("all");
                    setFilterStatus("all");
                    setFilterProgram("all");
                    setFilterTurma("all");
                    setFilterDateFrom("");
                    setFilterDateTo("");
                    setSearchText("");
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Atividades */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm text-gray-700">
              Entregas ({filteredSubmissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSubmissions.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredSubmissions.map((sub: any) => {
                  const statusConfig = getStatusConfig(sub.taskStatus);
                  const isOverdue = sub.taskDeadline && sub.taskStatus !== 'validada' && sub.taskStatus !== 'entregue' && new Date(sub.taskDeadline) < new Date();
                  return (
                    <div
                      key={sub.sessionId}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${isOverdue ? 'bg-red-50/30 border-red-200' : 'bg-white border-gray-100'}`}
                      onClick={() => setViewingSubmission(sub.sessionId)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">{sub.taskName || 'Sem tarefa'}</span>
                            <Badge variant="outline" className={statusConfig.className}>
                              <span className="flex items-center gap-1">{statusConfig.icon} {statusConfig.label}</span>
                            </Badge>
                            {isOverdue && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                                <AlertTriangle className="h-3 w-3 mr-1" /> Atrasada
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" /> {sub.alunoNome}
                            </span>
                            {sub.consultorNome && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" /> Mentor: {sub.consultorNome}
                              </span>
                            )}
                            {sub.empresaNome && sub.empresaNome !== 'N/A' && (
                              <span className="text-blue-600">{sub.empresaNome}</span>
                            )}
                            {sub.taskDeadline && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Prazo: <span className={isOverdue ? 'text-red-600 font-medium' : ''}>{formatDateSafe(sub.taskDeadline)}</span>
                              </span>
                            )}
                            {sub.submittedAt && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                Enviado: {formatDateSafe(sub.submittedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-gray-500">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma atividade prática encontrada</p>
                <p className="text-xs mt-1">Ajuste os filtros para ver resultados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Detalhe */}
        <Dialog open={!!viewingSubmission} onOpenChange={(open) => { if (!open) setTimeout(() => setViewingSubmission(null), 100); }}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-900 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-[#F5991F]" />
                Detalhe da Entrega
              </DialogTitle>
              {submissionDetail && (
                <DialogDescription className="text-gray-500">
                  {submissionDetail.alunoNome} • {submissionDetail.taskName || 'Sem tarefa'}
                </DialogDescription>
              )}
            </DialogHeader>

            {submissionDetail && (
              <div className="space-y-4">
                {/* Info básica */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Aluno</p>
                    <p className="text-sm font-medium text-gray-900">{submissionDetail.alunoNome}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Mentor</p>
                    <p className="text-sm font-medium text-gray-900">{submissionDetail.consultorNome || '-'}</p>
                  </div>
                </div>

                {/* Data de solicitação e Sessão de mentoria */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                    <p className="text-xs text-gray-500 mb-1">Data da Solicitação</p>
                    <p className="text-sm font-medium text-gray-900">
                      {submissionDetail.createdAt
                        ? new Date(submissionDetail.createdAt).toLocaleDateString('pt-BR')
                        : '-'}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                    <p className="text-xs text-gray-500 mb-1">Sessão de Mentoria</p>
                    <p className="text-sm font-medium text-gray-900">
                      {submissionDetail.sessionNumber
                        ? `Sessão ${submissionDetail.sessionNumber}${submissionDetail.sessionDate ? ` — ${new Date(submissionDetail.sessionDate + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}`
                        : '-'}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">Status:</span>
                  {(() => {
                    const sc = getStatusConfig(submissionDetail.taskStatus || 'sem_tarefa');
                    return (
                      <Badge variant="outline" className={sc.className}>
                        <span className="flex items-center gap-1">{sc.icon} {sc.label}</span>
                      </Badge>
                    );
                  })()}
                  {submissionDetail.taskDeadline && (
                    <span className="text-xs text-gray-500">
                      Prazo: {formatDateSafe(submissionDetail.taskDeadline)}
                    </span>
                  )}
                </div>

                {/* Tarefa */}
                {submissionDetail.taskOQueFazer && (
                  <div className="p-3 rounded bg-blue-50 border border-blue-100">
                    <p className="text-xs font-semibold text-gray-700 mb-1">O que fazer:</p>
                    <p className="text-xs text-gray-600">{submissionDetail.taskOQueFazer}</p>
                  </div>
                )}

                {/* Evidência */}
                {(submissionDetail.evidenceLink || submissionDetail.evidenceImageUrl || submissionDetail.submittedAt) && (
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
                        <p className="text-xs font-medium text-gray-700 mb-1">Relato:</p>
                        <p className="text-xs text-gray-600 whitespace-pre-wrap">{submissionDetail.relatoAluno}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Validação */}
                {submissionDetail.taskStatus === 'validada' && submissionDetail.validatedAt && (
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

                {/* Nota: Admin NÃO valida */}
                {submissionDetail.taskStatus === 'entregue' && submissionDetail.submittedAt && (
                  <div className="p-3 rounded bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Aguardando validação do mentor. Admin não valida entregas.
                    </p>
                  </div>
                )}

                {/* Comentários */}
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
                    onClick={() => addComment.mutate({ sessionId: viewingSubmission!, comment: commentText || '' })}
                    disabled={!commentText.trim() || addComment.isPending}
                    className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {addComment.isPending ? 'Enviando...' : 'Enviar Comentário'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    {/* Modal Criar Ação */}
      <Dialog open={showModalAcao} onOpenChange={setShowModalAcao}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#0A1E3E]" />
              Criar Ação
            </DialogTitle>
            <DialogDescription>
              Crie uma ação de desenvolvimento para um aluno. Ela aparecerá aqui em Atividades Práticas e na Performance do aluno.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Busca de aluno */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Aluno *</Label>
              <Input
                value={acaoAlunoNome}
                onChange={e => setAcaoAlunoNome(e.target.value)}
                placeholder="Nome do aluno..."
              />
              {/* Lista de sugestões baseada nas submissions */}
              {acaoAlunoNome.length >= 2 && !acaoAlunoId && (() => {
                const sugestoes = Array.from(
                  new Map(submissions
                    .filter((s: any) => s.alunoNome?.toLowerCase().includes(acaoAlunoNome.toLowerCase()))
                    .map((s: any) => [s.alunoId, s])
                  ).values()
                ).slice(0, 5);
                return sugestoes.length > 0 ? (
                  <div className="border rounded-md shadow-sm mt-1">
                    {sugestoes.map((s: any) => (
                      <button key={s.alunoId}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => { setAcaoAlunoId(s.alunoId); setAcaoAlunoNome(s.alunoNome); }}
                      >
                        {s.alunoNome}
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}
              {acaoAlunoId && (
                <div className="flex items-center justify-between text-xs text-green-700 font-medium">
                  <span>✓ {acaoAlunoNome} selecionado</span>
                  <button className="text-muted-foreground underline" onClick={() => { setAcaoAlunoId(null); setAcaoAlunoNome(""); }}>Trocar</button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Trilha</Label>
              <Select value={acaoTrilhaId || "__none__"} onValueChange={v => { setAcaoTrilhaId(v === "__none__" ? "" : v); setAcaoCompetenciaId(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione</SelectItem>
                  {(trilhasComCompetencias as any[]).map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Competência</Label>
              <Select value={acaoCompetenciaId || "__none__"} onValueChange={v => setAcaoCompetenciaId(v === "__none__" ? "" : v)} disabled={!acaoTrilhaId}>
                <SelectTrigger><SelectValue placeholder={acaoTrilhaId ? "Selecione" : "Selecione a trilha primeiro"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione</SelectItem>
                  {competenciasDaTrilha.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Título da ação *</Label>
              <Input value={acaoTitulo} onChange={e => setAcaoTitulo(e.target.value)} placeholder="Ex: Aplicar feedback estruturado na próxima reunião" maxLength={500} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Descrição / Instruções</Label>
              <Textarea value={acaoDescricao} onChange={e => setAcaoDescricao(e.target.value)} placeholder="Descreva o que o aluno precisa fazer e como comprovar..." rows={3} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Prazo de entrega *</Label>
              <Input type="date" value={acaoPrazo} onChange={e => setAcaoPrazo(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowModalAcao(false)}>Cancelar</Button>
            <Button onClick={handleCriarAcao} disabled={criarAcaoMutation.isPending} className="bg-[#0A1E3E] hover:bg-[#2D5A87]">
              {criarAcaoMutation.isPending ? "Criando..." : <><Zap className="h-4 w-4 mr-1" /> Criar Ação</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
