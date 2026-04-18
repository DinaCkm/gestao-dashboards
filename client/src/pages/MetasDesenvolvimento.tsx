import { useState, useMemo, useEffect } from "react";
import { formatDateCustomSafe } from "@/lib/dateUtils";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Flag,
  Plus,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  User,
  BookOpen,
  Trash2,
  Edit3,
  MessageSquare,
  Calendar,
  TrendingUp,
  AlertCircle,
  Loader2,
  Library,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import DualIndicators from "@/components/DualIndicators";

// ============================================================
// HELPERS
// ============================================================
function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return formatDateCustomSafe(d, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const meses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function getStatusColor(status: string) {
  switch (status) {
    case "cumprida":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "nao_cumprida":
      return "bg-red-100 text-red-700 border-red-200";
    case "parcial":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-gray-100 text-gray-500 border-gray-200";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "cumprida":
      return "Cumprida";
    case "nao_cumprida":
      return "Não cumprida";
    case "parcial":
      return "Parcial";
    default:
      return "Pendente";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "cumprida":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "nao_cumprida":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "parcial":
      return <Clock className="h-4 w-4 text-amber-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MetasDesenvolvimento() {
  return (
    <DashboardLayout>
      <MetasContent />
    </DashboardLayout>
  );
}

function MetasContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const userConsultorId = (user as any)?.consultorId as number | null;
  const userProgramId = (user as any)?.programId as number | null;
  const isGestor = user?.role === "manager" && !userConsultorId; // Gestor de empresa (sem consultorId)
  const isMentor = user?.role === "manager" && !!userConsultorId; // Mentor (com consultorId)

  // Ler alunoId da URL (query param) para pré-selecionar aluno vindo do Assessment
  const urlAlunoId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("alunoId");
    return id ? parseInt(id) : null;
  }, []);

  // States
  const [selectedProgramId, setSelectedProgramId] = useState<string>("all");
  const [selectedAlunoId, setSelectedAlunoId] = useState<number | null>(
    urlAlunoId
  );
  const [expandedMetaId, setExpandedMetaId] = useState<number | null>(null);
  const [showAddMetaDialog, setShowAddMetaDialog] = useState(false);
  const [addMetaCompId, setAddMetaCompId] = useState<number | null>(null);
  const [addMetaAssCompId, setAddMetaAssCompId] = useState<number | null>(null);
  const [addMetaPdiId, setAddMetaPdiId] = useState<number | null>(null);
  const [showEditMetaDialog, setShowEditMetaDialog] = useState(false);
  const [editMetaId, setEditMetaId] = useState<number | null>(null);
  const [progressMetaId, setProgressMetaId] = useState<number | null>(null);
  const [searchAluno, setSearchAluno] = useState("");
  const [feedbackMetaId, setFeedbackMetaId] = useState<number | null>(null);
  const [feedbackAction, setFeedbackAction] = useState<"ajuste" | "reprovar">(
    "ajuste"
  );
  const [feedbackText, setFeedbackText] = useState("");

  // New meta form
  const [metaTitulo, setMetaTitulo] = useState("");
  const [metaDescricao, setMetaDescricao] = useState("");
  const [metaFromLibrary, setMetaFromLibrary] = useState(false);
  const [selectedTaskLibraryId, setSelectedTaskLibraryId] = useState<
    number | null
  >(null);

  // Acompanhamento form
  const [acompMes, setAcompMes] = useState(new Date().getMonth() + 1);
  const [acompAno, setAcompAno] = useState(new Date().getFullYear());
  const [acompStatus, setAcompStatus] = useState<
    "cumprida" | "nao_cumprida" | "parcial"
  >("nao_cumprida");
  const [acompObs, setAcompObs] = useState("");

  // Data queries
  const { data: allPrograms = [] } = trpc.programs.list.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: mentorPrograms = [] } =
    trpc.alunos.programsByConsultor.useQuery(
      { consultorId: userConsultorId! },
      { enabled: isMentor }
    );
  const programs = isAdmin ? allPrograms : mentorPrograms;

  // Admin: todos os alunos
  const { data: adminAlunos = [] } = trpc.alunos.list.useQuery(
    selectedProgramId !== "all"
      ? { programId: parseInt(selectedProgramId) }
      : undefined,
    { enabled: isAdmin }
  );
  // Mentor: alunos vinculados ao consultor
  const { data: mentorAlunos = [] } = trpc.alunos.byConsultor.useQuery(
    {
      consultorId: userConsultorId!,
      programId:
        selectedProgramId !== "all" ? parseInt(selectedProgramId) : undefined,
    },
    { enabled: isMentor }
  );
  // Gestor de empresa: alunos do programa
  const { data: gestorAlunos = [] } = trpc.alunos.list.useQuery(
    { programId: userProgramId! },
    { enabled: isGestor && !!userProgramId }
  );
  const alunos = isAdmin ? adminAlunos : isMentor ? mentorAlunos : gestorAlunos;

  const { data: assessments = [] } = trpc.assessment.porAluno.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );

  // Buscar resultado do teste DISC do aluno
  const { data: discResultado } = trpc.disc.resultado.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );

  const { data: metasDetalhadas = [], refetch: refetchMetas } =
    trpc.metas.listar.useQuery(
      { alunoId: selectedAlunoId! },
      { enabled: !!selectedAlunoId }
    );

  const { data: metasResumo, refetch: refetchResumo } =
    trpc.metas.resumo.useQuery(
      { alunoId: selectedAlunoId! },
      { enabled: !!selectedAlunoId }
    );

  const { data: acompanhamentos = [], refetch: refetchAcomp } =
    trpc.metas.acompanhamentos.useQuery(
      { alunoId: selectedAlunoId! },
      { enabled: !!selectedAlunoId }
    );

  const { data: taskLibrary = [] } = trpc.metas.biblioteca.useQuery(undefined, {
    enabled: showAddMetaDialog,
  });

  const { data: mentorSubmissions = [], refetch: refetchMentorSubmissions } =
    trpc.practicalActivities.submissions.useQuery(
      { alunoId: selectedAlunoId ?? undefined },
      { enabled: !!selectedAlunoId }
    );

  // Indicadores V2 do aluno selecionado (para Engajamento)
  const { data: performanceFiltrada } =
    trpc.indicadores.performanceFiltrada.useQuery(
      { alunoId: selectedAlunoId! },
      { enabled: !!selectedAlunoId }
    );

  // Mutations
  const criarMeta = trpc.metas.criar.useMutation({
    onSuccess: () => {
      toast.success("Meta criada com sucesso!");
      refetchMetas();
      refetchResumo();
      setShowAddMetaDialog(false);
      resetMetaForm();
    },
    onError: err => toast.error(err.message),
  });

  const removerMeta = trpc.metas.remover.useMutation({
    onSuccess: () => {
      toast.success("Meta removida.");
      refetchMetas();
      refetchResumo();
    },
    onError: err => toast.error(err.message),
  });

  const atualizarMeta = trpc.metas.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Meta atualizada com sucesso!");
      refetchMetas();
      setShowEditMetaDialog(false);
      setEditMetaId(null);
    },
    onError: err => toast.error(err.message),
  });

  const registrarAcomp = trpc.metas.registrarAcompanhamento.useMutation({
    onSuccess: () => {
      toast.success("Acompanhamento registrado!");
      refetchAcomp();
      refetchMetas();
      refetchResumo();
      setProgressMetaId(null);
    },
    onError: err => toast.error(err.message),
  });

  const sugerirIAMutation = trpc.metas.sugerirComIA.useMutation({
    onSuccess: data => {
      setMetaFromLibrary(false);
      toast.success(
        "Sugestão gerada pela IA! Clique em 'Usar esta sugestão' para aplicar."
      );
    },
    onError: err => toast.error("Erro ao gerar sugestão: " + err.message),
  });

  const validarEvidencia = trpc.mentor.validateTask.useMutation({
    onSuccess: () => {
      toast.success("Evidência aprovada e validada.");
      refetchMentorSubmissions();
    },
    onError: err => toast.error(err.message),
  });

  const adicionarComentario = trpc.mentor.addTaskComment.useMutation({
    onSuccess: () => {
      refetchMentorSubmissions();
      toast.success("Feedback registrado.");
    },
    onError: err => toast.error(err.message),
  });

  // Filtered alunos
  const filteredAlunos = useMemo(() => {
    if (!searchAluno) return alunos;
    const s = searchAluno.toLowerCase();
    return alunos.filter(
      (a: any) =>
        a.name?.toLowerCase().includes(s) || a.email?.toLowerCase().includes(s)
    );
  }, [alunos, searchAluno]);

  const selectedAluno = useMemo(
    () => alunos.find((a: any) => a.id === selectedAlunoId),
    [alunos, selectedAlunoId]
  );

  // Group metas by competencia
  const metasByCompetencia = useMemo(() => {
    const map = new Map<
      number,
      {
        competenciaId: number;
        competenciaNome: string;
        assessmentCompetenciaId: number;
        assessmentPdiId: number;
        metas: typeof metasDetalhadas;
      }
    >();

    // First, add all competencias from assessments (even those without metas)
    for (const ass of assessments) {
      for (const comp of (ass as any).competencias || []) {
        if (!map.has(comp.competenciaId)) {
          map.set(comp.competenciaId, {
            competenciaId: comp.competenciaId,
            competenciaNome: comp.competenciaNome,
            assessmentCompetenciaId: comp.id,
            assessmentPdiId: (ass as any).id,
            metas: [],
          });
        }
      }
    }

    // Then add metas to their competencias
    for (const meta of metasDetalhadas) {
      const existing = map.get(meta.competenciaId);
      if (existing) {
        existing.metas = [...existing.metas, meta];
      } else {
        map.set(meta.competenciaId, {
          competenciaId: meta.competenciaId,
          competenciaNome: (meta as any).competenciaNome || "Competência",
          assessmentCompetenciaId: meta.assessmentCompetenciaId,
          assessmentPdiId: meta.assessmentPdiId,
          metas: [meta],
        });
      }
    }

    return Array.from(map.values());
  }, [assessments, metasDetalhadas]);

  // Filter task library by competencia name
  const filteredLibrary = useMemo(() => {
    if (!addMetaCompId) return taskLibrary;
    const comp = metasByCompetencia.find(
      c => c.competenciaId === addMetaCompId
    );
    if (!comp) return taskLibrary;
    // Try to match by competencia name
    return taskLibrary.filter(
      (t: any) =>
        t.competencia
          .toLowerCase()
          .includes(comp.competenciaNome.toLowerCase()) ||
        comp.competenciaNome.toLowerCase().includes(t.competencia.toLowerCase())
    );
  }, [taskLibrary, addMetaCompId, metasByCompetencia]);

  const allLibraryItems = taskLibrary;

  const assessmentCompetencias = useMemo(() => {
    return assessments.flatMap((ass: any) =>
      (ass.competencias || []).map((comp: any) => ({
        assessmentPdiId: ass.id,
        assessmentCompetenciaId: comp.id,
        competenciaId: comp.competenciaId,
        competenciaNome: comp.competenciaNome,
        notaAtual: Number(comp.notaAtual || 0),
        metaNota: Number(comp.metaNota || 0),
        status: comp.status,
      }))
    );
  }, [assessments]);

  const metasOrdenadas = useMemo(() => {
    return [...metasDetalhadas].sort(
      (a: any, b: any) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime()
    );
  }, [metasDetalhadas]);

  const metaPrincipal = metasOrdenadas[0] ?? null;
  const microMetas = metasOrdenadas.slice(1);

  const principalDificuldade = useMemo(() => {
    if (!assessmentCompetencias.length) return null;
    return [...assessmentCompetencias].sort(
      (a, b) => a.notaAtual - b.notaAtual
    )[0];
  }, [assessmentCompetencias]);

  const competenciasSecundarias = useMemo(() => {
    if (!metaPrincipal) return [];
    const principalNome = (metaPrincipal as any).competenciaNome;
    return Array.from(
      new Set(
        microMetas
          .map((m: any) => m.competenciaNome)
          .filter((n: string) => n && n !== principalNome)
      )
    );
  }, [metaPrincipal, microMetas]);

  const submissaoPorMeta = useMemo(() => {
    const map = new Map<number, any>();
    for (const meta of metasOrdenadas as any[]) {
      const candidatos = (mentorSubmissions || []).filter(
        (s: any) => Number(s.taskId) === Number(meta.taskLibraryId)
      );
      if (candidatos.length > 0) {
        const escolhido = [...candidatos].sort(
          (a: any, b: any) =>
            new Date(b.sessionDate || 0).getTime() -
            new Date(a.sessionDate || 0).getTime()
        )[0];
        map.set(meta.id, escolhido);
      }
    }
    return map;
  }, [metasOrdenadas, mentorSubmissions]);

  const expandedMetaSubmission = expandedMetaId
    ? submissaoPorMeta.get(expandedMetaId)
    : null;
  const { data: expandedSubmissionDetail } =
    trpc.mentor.getSubmissionDetail.useQuery(
      { sessionId: expandedMetaSubmission?.sessionId ?? 0 },
      { enabled: !!expandedMetaSubmission?.sessionId }
    );

  function resetMetaForm() {
    setMetaTitulo("");
    setMetaDescricao("");
    setMetaFromLibrary(false);
    setSelectedTaskLibraryId(null);
    setAddMetaCompId(null);
    setAddMetaAssCompId(null);
    setAddMetaPdiId(null);
  }

  function handleAddMeta(prefill?: {
    compId: number;
    assCompId: number;
    pdiId: number;
  }) {
    // Limpar todos os campos do formulário antes de abrir
    setMetaTitulo("");
    setMetaDescricao("");
    setMetaFromLibrary(false);
    setSelectedTaskLibraryId(null);
    sugerirIAMutation.reset();
    // Definir a competência selecionada
    setAddMetaCompId(prefill?.compId ?? null);
    setAddMetaAssCompId(prefill?.assCompId ?? null);
    setAddMetaPdiId(prefill?.pdiId ?? null);
    setShowAddMetaDialog(true);
  }

  function handleSubmitMeta() {
    if (
      !selectedAlunoId ||
      !addMetaCompId ||
      !addMetaAssCompId ||
      !addMetaPdiId
    )
      return;

    const titulo =
      metaFromLibrary && selectedTaskLibraryId
        ? taskLibrary.find((t: any) => t.id === selectedTaskLibraryId)?.nome ||
          metaTitulo
        : metaTitulo;

    if (!titulo.trim()) {
      toast.error("Informe o título da meta");
      return;
    }

    criarMeta.mutate({
      alunoId: selectedAlunoId,
      assessmentCompetenciaId: addMetaAssCompId,
      competenciaId: addMetaCompId,
      assessmentPdiId: addMetaPdiId,
      taskLibraryId: metaFromLibrary ? selectedTaskLibraryId : null,
      titulo: titulo.trim(),
      descricao: metaDescricao.trim() || null,
    });
  }

  function handleOpenAcomp(metaId: number) {
    setProgressMetaId(metaId);
    setAcompMes(new Date().getMonth() + 1);
    setAcompAno(new Date().getFullYear());
    setAcompStatus("nao_cumprida");
    setAcompObs("");
  }

  function handleSubmitAcomp(metaId?: number) {
    if (!metaId || !selectedAlunoId) return;
    registrarAcomp.mutate({
      metaId,
      alunoId: selectedAlunoId,
      mes: acompMes,
      ano: acompAno,
      status: acompStatus,
      observacao: acompObs.trim() || null,
    });
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Flag className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Metas de Desenvolvimento</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie Meta Desafiadora, Micro Metas, evidências e validação da
            mentoria
          </p>
        </div>
      </div>

      {/* Orientação para a mentora */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-800">
                Orientação sobre Metas de Desenvolvimento
              </p>
              <ul className="text-xs text-amber-700 space-y-1 list-disc ml-4">
                <li>
                  <strong>Meta Desafiadora</strong> representa o objetivo
                  principal de evolução do aluno na jornada.
                </li>
                <li>
                  <strong>Micro Metas</strong> são os passos práticos que
                  compõem a evolução da meta principal.
                </li>
                <li>
                  <strong>Evidências e validação</strong> devem ser acompanhadas
                  na mesma estrutura que o aluno visualiza no dashboard.
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Programa */}
            <div className="w-full md:w-64">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Programa
              </label>
              <Select
                value={selectedProgramId}
                onValueChange={v => {
                  setSelectedProgramId(v);
                  setSelectedAlunoId(null);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos os programas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os programas</SelectItem>
                  {programs.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Busca aluno */}
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Aluno
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno por nome ou email..."
                  value={searchAluno}
                  onChange={e => setSearchAluno(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
          </div>

          {/* Lista de alunos */}
          {!selectedAlunoId && (
            <div className="mt-3 max-h-60 overflow-y-auto border rounded-lg divide-y">
              {filteredAlunos.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhum aluno encontrado
                </div>
              ) : (
                filteredAlunos.map((a: any) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setSelectedAlunoId(a.id);
                      setSearchAluno("");
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {a.email}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Aluno selecionado */}
          {selectedAluno && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{(selectedAluno as any).name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedAluno as any).email}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAlunoId(null);
                  setExpandedMetaId(null);
                }}
              >
                Trocar aluno
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Relatório DISC do Aluno */}
      {selectedAlunoId && discResultado && (
        <Card className="border-[#F5991F]/30 bg-gradient-to-r from-[#F5991F]/5 to-transparent border-2">
          <CardContent className="py-4">
            <h4 className="font-semibold text-[#0A1E3E] mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Perfil Comportamental DISC
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              {[
                {
                  label: "Dominância (D)",
                  score: discResultado.scoreD,
                  color: "bg-red-500",
                },
                {
                  label: "Influência (I)",
                  score: discResultado.scoreI,
                  color: "bg-yellow-500",
                },
                {
                  label: "Estabilidade (S)",
                  score: discResultado.scoreS,
                  color: "bg-green-500",
                },
                {
                  label: "Conformidade (C)",
                  score: discResultado.scoreC,
                  color: "bg-blue-500",
                },
              ].map(dim => (
                <div key={dim.label} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    {dim.label}
                  </div>
                  <div className="relative h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${dim.color}`}
                      style={{ width: `${Math.min(Number(dim.score), 100)}%` }}
                    />
                  </div>
                  <div className="text-sm font-bold mt-1">
                    {(Number(dim?.score ?? 0) ?? 0).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
            {discResultado.perfilPredominante && (
              <div className="flex items-center gap-2">
                <Badge className="bg-[#0A1E3E] text-white">
                  Perfil Primário: {discResultado.perfilPredominante}
                </Badge>
                {discResultado.perfilSecundario && (
                  <Badge
                    variant="outline"
                    className="border-[#0A1E3E] text-[#0A1E3E]"
                  >
                    Secundário: {discResultado.perfilSecundario}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* === INDICADORES DE DESTAQUE === */}
      {selectedAlunoId && metasResumo && (
        <DualIndicators
          engajamento={
            performanceFiltrada?.indicadoresV2?.consolidado
              ?.ind7_engajamentoFinal ??
            performanceFiltrada?.indicadores?.performanceGeral ??
            0
          }
          desenvolvimento={metasResumo.percentual}
          engajamentoDetalhes={
            performanceFiltrada?.indicadoresV2?.consolidado
              ? {
                  ind1_webinars:
                    performanceFiltrada.indicadoresV2.consolidado.ind1_webinars,
                  ind2_avaliacoes:
                    performanceFiltrada.indicadoresV2.consolidado
                      .ind2_avaliacoes,
                  ind3_competencias:
                    performanceFiltrada.indicadoresV2.consolidado
                      .ind3_competencias,
                  ind4_tarefas:
                    performanceFiltrada.indicadoresV2.consolidado.ind4_tarefas,
                  ind5_engajamento:
                    performanceFiltrada.indicadoresV2.consolidado
                      .ind5_engajamento,
                }
              : undefined
          }
          desenvolvimentoDetalhes={{
            total: metasResumo.total,
            cumpridas: metasResumo.cumpridas,
          }}
        />
      )}

      {/* Resumo de metas */}
      {selectedAlunoId && metasResumo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{metasResumo.total}</p>
              <p className="text-xs text-muted-foreground">Total de Metas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {metasResumo.cumpridas}
              </p>
              <p className="text-xs text-muted-foreground">Cumpridas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">
                {metasResumo.total - metasResumo.cumpridas}
              </p>
              <p className="text-xs text-muted-foreground">Não Cumpridas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <p className="text-2xl font-bold text-primary">
                  {metasResumo.percentual}%
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Atingimento</p>
              <Progress value={metasResumo.percentual} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Meta Desafiadora + Micro Metas */}
      {selectedAlunoId && (
        <div className="space-y-4">
          {assessments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Nenhum Assessment encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  O aluno precisa ter um Assessment/PDI definido antes de
                  estruturar a Meta Desafiadora.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="flex items-center gap-2">
                      <Flag className="h-5 w-5 text-primary" />
                      Meta Desafiadora Principal
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMeta()}
                      >
                        {metaPrincipal
                          ? "Adicionar Micro Meta"
                          : "Definir Meta Desafiadora"}
                      </Button>
                      {metaPrincipal && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditMetaId(metaPrincipal.id);
                            setMetaTitulo(metaPrincipal.titulo || "");
                            setMetaDescricao(metaPrincipal.descricao || "");
                            setShowEditMetaDialog(true);
                          }}
                        >
                          <Edit3 className="h-4 w-4 mr-1" /> Editar
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!metaPrincipal ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma Meta Desafiadora definida ainda para este aluno.
                    </p>
                  ) : (
                    <>
                      <div>
                        <p className="text-lg font-semibold">
                          {metaPrincipal.titulo}
                        </p>
                        {metaPrincipal.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {metaPrincipal.descricao}
                          </p>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 rounded-lg border bg-muted/30">
                          <p className="text-xs text-muted-foreground">
                            Dificuldade principal no assessment
                          </p>
                          <p className="font-medium">
                            {principalDificuldade?.competenciaNome || "—"}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg border bg-muted/30">
                          <p className="text-xs text-muted-foreground">
                            Competência principal vinculada
                          </p>
                          <p className="font-medium">
                            {(metaPrincipal as any).competenciaNome || "—"}
                          </p>
                        </div>
                      </div>
                      {competenciasSecundarias.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Competências secundárias
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {competenciasSecundarias.map(comp => (
                              <Badge key={comp} variant="outline">
                                {comp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progresso consolidado (micro metas)</span>
                          <span className="font-semibold">
                            {metasResumo?.percentual ?? 0}%
                          </span>
                        </div>
                        <Progress
                          value={metasResumo?.percentual ?? 0}
                          className="h-2"
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                        <Badge
                          className={getStatusColor(
                            (metasResumo?.percentual ?? 0) >= 100
                              ? "cumprida"
                              : (metasResumo?.percentual ?? 0) > 0
                                ? "parcial"
                                : "nao_cumprida"
                          )}
                        >
                          {(metasResumo?.percentual ?? 0) >= 100
                            ? "Concluída"
                            : "Em andamento"}
                        </Badge>
                        <span>
                          Criada em: {formatDate(metaPrincipal.createdAt)}
                        </span>
                        <span>
                          Prazo:{" "}
                          {formatDate(
                            submissaoPorMeta.get(metaPrincipal.id)?.taskDeadline
                          )}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={(metasResumo?.percentual ?? 0) < 100}
                          onClick={() => {
                            if (!selectedAlunoId) return;
                            registrarAcomp.mutate({
                              metaId: metaPrincipal.id,
                              alunoId: selectedAlunoId,
                              mes: new Date().getMonth() + 1,
                              ano: new Date().getFullYear(),
                              status: "cumprida",
                              observacao:
                                "Meta Desafiadora encerrada com 100% das micro metas.",
                            });
                          }}
                        >
                          Encerrar Meta
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Micro Metas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {microMetas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Sem micro metas cadastradas.
                    </p>
                  ) : (
                    microMetas.map((meta: any) => {
                      const submission = submissaoPorMeta.get(meta.id);
                      const historicoMeta = acompanhamentos.filter(
                        (a: any) => a.metaId === meta.id
                      );
                      const expanded = expandedMetaId === meta.id;
                      return (
                        <div
                          key={meta.id}
                          className="rounded-lg border bg-muted/20"
                        >
                          <button
                            className="w-full p-4 text-left"
                            onClick={() =>
                              setExpandedMetaId(expanded ? null : meta.id)
                            }
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium">{meta.titulo}</p>
                                  <Badge
                                    className={`text-xs ${getStatusColor(meta.ultimoStatus || "nao_cumprida")}`}
                                  >
                                    {getStatusLabel(
                                      meta.ultimoStatus || "nao_cumprida"
                                    )}
                                  </Badge>
                                  <Badge variant="outline">
                                    Contribuição:{" "}
                                    {microMetas.length > 0
                                      ? Math.round(100 / microMetas.length)
                                      : 0}
                                    %
                                  </Badge>
                                </div>
                                {meta.descricao && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {meta.descricao}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  Criada em {formatDate(meta.createdAt)} •
                                  Prazo: {formatDate(submission?.taskDeadline)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setEditMetaId(meta.id);
                                    setMetaTitulo(meta.titulo || "");
                                    setMetaDescricao(meta.descricao || "");
                                    setShowEditMetaDialog(true);
                                  }}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={e => {
                                    e.stopPropagation();
                                    if (confirm("Remover esta micro meta?"))
                                      removerMeta.mutate({ id: meta.id });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </button>

                          {expanded && (
                            <div className="border-t bg-white p-4 space-y-3">
                              <div className="p-3 rounded-lg border bg-blue-50">
                                <p className="text-xs font-semibold text-blue-800 mb-1">
                                  Evidência enviada pelo aluno
                                </p>
                                {!expandedSubmissionDetail ||
                                expandedMetaId !== meta.id ? (
                                  <p className="text-xs text-muted-foreground">
                                    {submission
                                      ? "Carregando detalhes da evidência..."
                                      : "Ainda não há evidência enviada para esta micro meta."}
                                  </p>
                                ) : (
                                  <div className="space-y-2 text-xs">
                                    <p>
                                      Status atual:{" "}
                                      <strong>
                                        {expandedSubmissionDetail.taskStatus ||
                                          "—"}
                                      </strong>
                                    </p>
                                    <p>
                                      Data de envio:{" "}
                                      {formatDate(
                                        expandedSubmissionDetail.submittedAt
                                      )}
                                    </p>
                                    {expandedSubmissionDetail.relatoAluno && (
                                      <p>
                                        Relato:{" "}
                                        {expandedSubmissionDetail.relatoAluno}
                                      </p>
                                    )}
                                    {expandedSubmissionDetail.evidenceLink && (
                                      <a
                                        href={
                                          expandedSubmissionDetail.evidenceLink
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                      >
                                        <ExternalLink className="h-3 w-3" />{" "}
                                        Abrir link enviado
                                      </a>
                                    )}
                                    {expandedSubmissionDetail.evidenceImageUrl && (
                                      <img
                                        src={
                                          expandedSubmissionDetail.evidenceImageUrl
                                        }
                                        alt="Evidência do aluno"
                                        className="max-h-40 rounded border"
                                      />
                                    )}
                                  </div>
                                )}
                              </div>

                              {submission && (
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      validarEvidencia.mutate({
                                        sessionId: submission.sessionId,
                                      })
                                    }
                                    disabled={
                                      validarEvidencia.isPending ||
                                      submission.taskStatus !== "entregue"
                                    }
                                  >
                                    Aprovar evidência
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setFeedbackMetaId(meta.id);
                                      setFeedbackAction("ajuste");
                                      setFeedbackText("");
                                    }}
                                  >
                                    Solicitar ajuste
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setFeedbackMetaId(meta.id);
                                      setFeedbackAction("reprovar");
                                      setFeedbackText("");
                                    }}
                                  >
                                    Reprovar evidência
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenAcomp(meta.id)}
                                  >
                                    Marcar concluída
                                  </Button>
                                </div>
                              )}

                              <div>
                                <p className="text-xs font-semibold mb-1">
                                  Histórico
                                </p>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <p>
                                    • Criação da micro meta em{" "}
                                    {formatDate(meta.createdAt)}
                                  </p>
                                  {submission?.submittedAt && (
                                    <p>
                                      • Evidência enviada em{" "}
                                      {formatDate(submission.submittedAt)}
                                    </p>
                                  )}
                                  {submission?.validatedAt && (
                                    <p>
                                      • Evidência validada em{" "}
                                      {formatDate(submission.validatedAt)}
                                    </p>
                                  )}
                                  {historicoMeta.map((h: any) => (
                                    <p key={h.id}>
                                      • {meses[h.mes - 1]} {h.ano}:{" "}
                                      {getStatusLabel(h.status)}{" "}
                                      {h.observacao ? `— ${h.observacao}` : ""}
                                    </p>
                                  ))}
                                  {expandedSubmissionDetail?.comments?.map(
                                    (c: any) => (
                                      <p key={c.id}>
                                        • Feedback ({c.authorRole}): {c.comment}
                                      </p>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Dialog: Adicionar Meta */}
      <Dialog
        open={showAddMetaDialog}
        onOpenChange={open => {
          if (!open) {
            setShowAddMetaDialog(false);
            resetMetaForm();
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" />
              {metaPrincipal ? "Nova Micro Meta" : "Nova Meta Desafiadora"}
            </DialogTitle>
            <DialogDescription>
              Estruture a evolução do aluno em Meta Desafiadora e Micro Metas
              com evidências e validação.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Competência de referência *
            </label>
            <Select
              value={addMetaAssCompId ? String(addMetaAssCompId) : ""}
              onValueChange={v => {
                const comp = assessmentCompetencias.find(
                  (c: any) => c.assessmentCompetenciaId === Number(v)
                );
                setAddMetaAssCompId(comp?.assessmentCompetenciaId ?? null);
                setAddMetaCompId(comp?.competenciaId ?? null);
                setAddMetaPdiId(comp?.assessmentPdiId ?? null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a competência principal" />
              </SelectTrigger>
              <SelectContent>
                {assessmentCompetencias.map((comp: any) => (
                  <SelectItem
                    key={comp.assessmentCompetenciaId}
                    value={String(comp.assessmentCompetenciaId)}
                  >
                    {comp.competenciaNome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {/* Escolher fonte */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={!metaFromLibrary ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setMetaFromLibrary(false);
                  setSelectedTaskLibraryId(null);
                }}
                className="gap-1.5"
              >
                <Edit3 className="h-4 w-4" />
                Personalizada
              </Button>
              <Button
                variant={metaFromLibrary ? "default" : "outline"}
                size="sm"
                onClick={() => setMetaFromLibrary(true)}
                className="gap-1.5"
              >
                <Library className="h-4 w-4" />
                Biblioteca
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const comp = assessmentCompetencias.find(
                    c => c.competenciaId === addMetaCompId
                  );
                  if (!comp) {
                    toast.error("Selecione uma competência");
                    return;
                  }
                  sugerirIAMutation.mutate({
                    competencia: comp.competenciaNome,
                    alunoNome: (selectedAluno as any)?.name || undefined,
                  });
                }}
                disabled={sugerirIAMutation.isPending}
                className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
              >
                {sugerirIAMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Sugerir com IA
              </Button>
            </div>

            {/* Resultado da IA */}
            {sugerirIAMutation.data && !metaFromLibrary && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-amber-700">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-semibold">Sugestão da IA</span>
                </div>
                <p className="text-sm font-medium">
                  {sugerirIAMutation.data.titulo}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sugerirIAMutation.data.descricao}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMetaTitulo(sugerirIAMutation.data!.titulo);
                    setMetaDescricao(sugerirIAMutation.data!.descricao);
                    toast.success(
                      "Sugestão aplicada! Você pode editar antes de criar."
                    );
                  }}
                  className="w-full gap-1.5 mt-1"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Usar esta sugestão
                </Button>
              </div>
            )}

            {metaFromLibrary ? (
              <>
                {/* Seleção da biblioteca */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Selecionar da Biblioteca de Ações
                  </label>
                  {filteredLibrary.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {filteredLibrary.length} ação(ões) relacionada(s) à
                      competência
                    </p>
                  )}
                  <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {(filteredLibrary.length > 0
                      ? filteredLibrary
                      : allLibraryItems
                    ).map((t: any) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedTaskLibraryId(t.id);
                          setMetaTitulo(t.nome);
                        }}
                        className={`w-full p-3 text-left hover:bg-accent/50 transition-colors ${selectedTaskLibraryId === t.id ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
                      >
                        <p className="text-sm font-medium">{t.nome}</p>
                        {t.resumo && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {t.resumo}
                          </p>
                        )}
                        <Badge variant="secondary" className="text-xs mt-1">
                          {t.competencia}
                        </Badge>
                      </button>
                    ))}
                    {filteredLibrary.length === 0 &&
                      allLibraryItems.length === 0 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Nenhuma ação na biblioteca
                        </div>
                      )}
                  </div>
                </div>
                {/* Descrição adicional */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Observação (opcional)
                  </label>
                  <Textarea
                    placeholder="Adicione detalhes específicos para o aluno..."
                    value={metaDescricao}
                    onChange={e => setMetaDescricao(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Meta personalizada */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Título da Meta *
                  </label>
                  <Input
                    placeholder="Ex: Fazer uma palestra para mais de 50 pessoas"
                    value={metaTitulo}
                    onChange={e => setMetaTitulo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Descrição (opcional)
                  </label>
                  <Textarea
                    placeholder="Descreva os detalhes e critérios de cumprimento..."
                    value={metaDescricao}
                    onChange={e => setMetaDescricao(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddMetaDialog(false);
                resetMetaForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitMeta}
              disabled={
                criarMeta.isPending ||
                !addMetaCompId ||
                (!metaTitulo.trim() && !selectedTaskLibraryId)
              }
            >
              {criarMeta.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Meta */}
      <Dialog open={showEditMetaDialog} onOpenChange={setShowEditMetaDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Título</label>
              <Input
                value={metaTitulo}
                onChange={e => setMetaTitulo(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Descrição
              </label>
              <Textarea
                value={metaDescricao}
                onChange={e => setMetaDescricao(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditMetaDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!editMetaId) return;
                atualizarMeta.mutate({
                  id: editMetaId,
                  titulo: metaTitulo.trim(),
                  descricao: metaDescricao.trim() || null,
                });
              }}
              disabled={atualizarMeta.isPending || !metaTitulo.trim()}
            >
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Feedback (ajuste/reprovação) */}
      <Dialog
        open={!!feedbackMetaId}
        onOpenChange={open => {
          if (!open) {
            setFeedbackMetaId(null);
            setFeedbackText("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {feedbackAction === "ajuste"
                ? "Solicitar ajuste"
                : "Reprovar evidência"}
            </DialogTitle>
            <DialogDescription>
              Informe uma justificativa para registrar no histórico da micro
              meta.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={feedbackText}
            onChange={e => setFeedbackText(e.target.value)}
            placeholder="Escreva o feedback orientador para o aluno..."
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFeedbackMetaId(null);
                setFeedbackText("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const meta = metasDetalhadas.find(
                  (m: any) => m.id === feedbackMetaId
                );
                const submission = meta ? submissaoPorMeta.get(meta.id) : null;
                if (!meta || !submission || !feedbackText.trim()) return;
                const prefixo =
                  feedbackAction === "ajuste"
                    ? "Solicitação de ajuste"
                    : "Evidência reprovada";
                adicionarComentario.mutate({
                  sessionId: submission.sessionId,
                  comment: `${prefixo}: ${feedbackText.trim()}`,
                });
                setAcompStatus(
                  feedbackAction === "ajuste" ? "parcial" : "nao_cumprida"
                );
                setAcompObs(feedbackText.trim());
                registrarAcomp.mutate({
                  metaId: meta.id,
                  alunoId: selectedAlunoId!,
                  mes: acompMes,
                  ano: acompAno,
                  status:
                    feedbackAction === "ajuste" ? "parcial" : "nao_cumprida",
                  observacao: feedbackText.trim(),
                });
                setFeedbackMetaId(null);
                setFeedbackText("");
              }}
              disabled={adicionarComentario.isPending || !feedbackText.trim()}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Acompanhamento / Conclusão */}
      <Dialog
        open={!!progressMetaId}
        onOpenChange={open => {
          if (!open) setProgressMetaId(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Registrar Evolução da Micro Meta
            </DialogTitle>
            <DialogDescription>
              Atualize o status da micro meta com base na evidência e no
              acompanhamento da mentoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mês/Ano */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Mês</label>
                <Select
                  value={String(acompMes)}
                  onValueChange={v => setAcompMes(parseInt(v))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-28">
                <label className="text-sm font-medium mb-1 block">Ano</label>
                <Select
                  value={String(acompAno)}
                  onValueChange={v => setAcompAno(parseInt(v))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setAcompStatus("cumprida")}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${acompStatus === "cumprida" ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-300"}`}
                >
                  <CheckCircle2
                    className={`h-5 w-5 mx-auto mb-1 ${acompStatus === "cumprida" ? "text-emerald-600" : "text-muted-foreground"}`}
                  />
                  <p className="text-xs font-medium">Cumprida</p>
                </button>
                <button
                  onClick={() => setAcompStatus("parcial")}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${acompStatus === "parcial" ? "border-amber-500 bg-amber-50" : "border-border hover:border-amber-300"}`}
                >
                  <Clock
                    className={`h-5 w-5 mx-auto mb-1 ${acompStatus === "parcial" ? "text-amber-600" : "text-muted-foreground"}`}
                  />
                  <p className="text-xs font-medium">Parcial</p>
                </button>
                <button
                  onClick={() => setAcompStatus("nao_cumprida")}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${acompStatus === "nao_cumprida" ? "border-red-500 bg-red-50" : "border-border hover:border-red-300"}`}
                >
                  <XCircle
                    className={`h-5 w-5 mx-auto mb-1 ${acompStatus === "nao_cumprida" ? "text-red-600" : "text-muted-foreground"}`}
                  />
                  <p className="text-xs font-medium">Não cumprida</p>
                </button>
              </div>
            </div>

            {/* Observação */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Observação (opcional)
              </label>
              <Textarea
                placeholder="Comentários sobre o progresso..."
                value={acompObs}
                onChange={e => setAcompObs(e.target.value)}
                rows={2}
              />
            </div>

            {/* Histórico */}
            {acompanhamentos.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Histórico
                </label>
                <div className="max-h-32 overflow-y-auto border rounded-lg divide-y">
                  {acompanhamentos.map((a: any) => (
                    <div key={a.id} className="p-2 flex items-center gap-2">
                      {getStatusIcon(a.status)}
                      <span className="text-xs font-medium">
                        {meses[a.mes - 1]} {a.ano}
                      </span>
                      <Badge className={`text-xs ${getStatusColor(a.status)}`}>
                        {getStatusLabel(a.status)}
                      </Badge>
                      {a.observacao && (
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {a.observacao}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressMetaId(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => handleSubmitAcomp(progressMetaId ?? undefined)}
              disabled={registrarAcomp.isPending}
            >
              {registrarAcomp.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
