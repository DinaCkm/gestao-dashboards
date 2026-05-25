import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatDateSafe, formatDateCustomSafe } from "@/lib/dateUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { SelectContentNoPortal } from "@/components/ui/select";
import {
  Search, Plus, Trash2, BookOpen, Target, CheckCircle2, Clock, AlertCircle,
  Users, Building2, TrendingUp, Award, BarChart3, Calendar, Edit2, ChevronRight,
  Circle, ChevronDown, ChevronUp, Flag, User, Loader2, Library, Sparkles, Edit3,
  MessageSquare, XCircle, FileText, Snowflake, Play, ArrowLeft, ListChecks, AlertTriangle, Gauge, Mail, History
} from "lucide-react";
import DualIndicators from "@/components/DualIndicators";
import EditAssessmentDialog from "@/components/EditAssessmentDialog";

// ============================================================
// HELPERS
// ============================================================
function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return formatDateCustomSafe(d, { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateInput(d: string | Date | null | undefined): string {
  if (!d) return "";
  if (typeof d === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    return d.split("T")[0];
  }
  return new Date(d).toISOString().split("T")[0];
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function getMetaStatusColor(status: string) {
  switch (status) {
    case "cumprida": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "nao_cumprida": return "bg-red-100 text-red-700 border-red-200";
    case "parcial": return "bg-amber-100 text-amber-700 border-amber-200";
    default: return "bg-gray-100 text-gray-500 border-gray-200";
  }
}
function getMetaStatusLabel(status: string) {
  switch (status) {
    case "cumprida": return "Cumprida";
    case "nao_cumprida": return "Não cumprida";
    case "parcial": return "Parcial";
    default: return "Pendente";
  }
}
function getMetaStatusIcon(status: string) {
  switch (status) {
    case "cumprida": return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "nao_cumprida": return <XCircle className="h-4 w-4 text-red-500" />;
    case "parcial": return <Clock className="h-4 w-4 text-amber-500" />;
    default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function PlanoIndividual() {
  return (
    <DashboardLayout>
      <PlanoContent />
    </DashboardLayout>
  );
}

function PlanoContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const userConsultorId = (user as any)?.consultorId as number | null;
  const userProgramId = (user as any)?.programId as number | null;
  const isGestor = user?.role === "manager" && !userConsultorId;
  const isMentor = user?.role === "manager" && !!userConsultorId;

  // ============================================================
  // STATE
  // ============================================================
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("all");
  const [selectedAluno, setSelectedAluno] = useState<number | null>(null);

  // Plano competencias state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCompetencias, setSelectedCompetencias] = useState<number[]>([]);
  const [selectedTrilha, setSelectedTrilha] = useState<string>("all");
  const [isLoteDialogOpen, setIsLoteDialogOpen] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const [selectedCompetenciasLote, setSelectedCompetenciasLote] = useState<number[]>([]);
  const [selectedTrilhaLote, setSelectedTrilhaLote] = useState<string>("all");



  // Metas state
  const [expandedCompId, setExpandedCompId] = useState<number | null>(null);
  const [showAddMetaDialog, setShowAddMetaDialog] = useState(false);
  const [addMetaCompId, setAddMetaCompId] = useState<number | null>(null);
  const [addMetaAssCompId, setAddMetaAssCompId] = useState<number | null>(null);
  const [addMetaPdiId, setAddMetaPdiId] = useState<number | null>(null);
  const [showAcompDialog, setShowAcompDialog] = useState(false);
  const [acompMetaId, setAcompMetaId] = useState<number | null>(null);
  const [acompMetaTitulo, setAcompMetaTitulo] = useState("");
  const [metaTitulo, setMetaTitulo] = useState("");
  const [metaDescricao, setMetaDescricao] = useState("");
  const [metaFromLibrary, setMetaFromLibrary] = useState(false);
  const [selectedTaskLibraryId, setSelectedTaskLibraryId] = useState<number | null>(null);
  const [acompMes, setAcompMes] = useState(new Date().getMonth() + 1);
  const [acompAno, setAcompAno] = useState(new Date().getFullYear());
  const [acompStatus, setAcompStatus] = useState<"cumprida" | "nao_cumprida" | "parcial">("nao_cumprida");
  const [acompObs, setAcompObs] = useState("");

  // Assessment edit dialog state
  const [editAssessment, setEditAssessment] = useState<any>(null);

  // Novo Assessment wizard state
  const [showNovoAssessment, setShowNovoAssessment] = useState(false);
  const [novoStep, setNovoStep] = useState(1);
  const [novoTrilhaId, setNovoTrilhaId] = useState<string>("");
  const [novoConsultorId, setNovoConsultorId] = useState<string>("");
  const [novoMacroInicio, setNovoMacroInicio] = useState("");
  const [novoMacroTermino, setNovoMacroTermino] = useState("");
  const [novoTotalSessoes, setNovoTotalSessoes] = useState("");
  const [novoCompConfig, setNovoCompConfig] = useState<Array<{
    competenciaId: number;
    nome: string;
    selected: boolean;
    peso: "obrigatoria" | "opcional";
    notaCorte: string;
    microInicio: string;
    microTermino: string;
  }>>([]);

  // Contrato state
  const [showContratoDialog, setShowContratoDialog] = useState(false);
  const [editingContrato, setEditingContrato] = useState<any>(null);
  const [contratoInicio, setContratoInicio] = useState("");
  const [contratoFim, setContratoFim] = useState("");
  const [contratoSessoes, setContratoSessoes] = useState("");
  // valorContrato removed - column doesn't exist in DB schema
  const [contratoObs, setContratoObs] = useState("");

  // ============================================================
  // QUERIES
  // ============================================================
  const { data: alunosWithPlano, isLoading: loadingAlunos, refetch: refetchAlunos } = trpc.planoIndividual.alunosWithPlano.useQuery();
  const { data: mentorAlunos } = trpc.alunos.byConsultor.useQuery(
    { consultorId: userConsultorId! },
    { enabled: !!userConsultorId && !isAdmin }
  );
  const { data: empresas } = trpc.indicadores.empresas.useQuery();
  const { data: planoAluno, refetch: refetchPlano } = trpc.planoIndividual.byAluno.useQuery(
    { alunoId: selectedAluno! },
    { enabled: !!selectedAluno }
  );
  const { data: competencias } = trpc.competencias.listWithTrilha.useQuery();
  const { data: trilhas } = trpc.trilhas.list.useQuery();
  const { data: turmas } = trpc.turmas.list.useQuery();
  const { data: performanceFiltrada } = trpc.indicadores.performanceFiltrada.useQuery(
    { alunoId: selectedAluno! },
    { enabled: !!selectedAluno }
  );

  // Assessment queries
  const { data: assessments = [], refetch: refetchAssessments } = trpc.assessment.porAluno.useQuery(
    { alunoId: selectedAluno! },
    { enabled: !!selectedAluno }
  );

  // Contrato queries
  const { data: contratos = [], refetch: refetchContratos } = trpc.contratos.byAluno.useQuery(
    { alunoId: selectedAluno! },
    { enabled: !!selectedAluno }
  );
  const { data: saldoSessoes } = trpc.contratos.saldo.useQuery(
    { alunoId: selectedAluno! },
    { enabled: !!selectedAluno }
  );

  // Metas queries
  const { data: metasDetalhadas = [], refetch: refetchMetas } = trpc.metas.listar.useQuery(
    { alunoId: selectedAluno! },
    { enabled: !!selectedAluno }
  );
  const { data: metasResumo, refetch: refetchResumo } = trpc.metas.resumo.useQuery(
    { alunoId: selectedAluno! },
    { enabled: !!selectedAluno }
  );
  const { data: acompanhamentos = [], refetch: refetchAcomp } = trpc.metas.acompanhamentos.useQuery(
    { alunoId: selectedAluno!, metaId: acompMetaId ?? undefined },
    { enabled: !!selectedAluno && !!acompMetaId }
  );
  const { data: taskLibrary = [] } = trpc.metas.biblioteca.useQuery(undefined, {
    enabled: showAddMetaDialog
  });

  // Resumo do plano do aluno (cursos, sessões, webinars)
  const { data: resumoPlano } = trpc.planoIndividual.resumoPlanoAluno.useQuery(
    { alunoId: selectedAluno! },
    { enabled: !!selectedAluno }
  );
  // DISC
  const { data: discResultado } = trpc.disc.resultado.useQuery(
    { alunoId: selectedAluno! },
    { enabled: !!selectedAluno }
  );

  // Autopercepção de competências
  const { data: autopercepcoesData = [] } = (trpc as any).autopercepção.porAluno.useQuery(
    { alunoId: selectedAluno! },
    { enabled: !!selectedAluno }
  );

  // Mentores list
  const { data: mentores = [] } = trpc.mentor.list.useQuery();

  // Competencias by trilha for novo assessment wizard
  const { data: compsByTrilha = [] } = trpc.competencias.byTrilha.useQuery(
    { trilhaId: parseInt(novoTrilhaId) },
    { enabled: !!novoTrilhaId }
  );

  // Programs for mentor
  const { data: allPrograms = [] } = trpc.programs.list.useQuery(undefined, { enabled: isAdmin });
  const { data: mentorPrograms = [] } = trpc.alunos.programsByConsultor.useQuery(
    { consultorId: userConsultorId! },
    { enabled: isMentor }
  );
  const programs = isAdmin ? allPrograms : mentorPrograms;

  // ============================================================
  // MUTATIONS
  // ============================================================
  // Plano mutations
  const addMultipleMutation = trpc.planoIndividual.addMultiple.useMutation({
    onSuccess: () => { toast.success("Competências adicionadas ao plano!"); refetchPlano(); refetchAlunos(); setIsAddDialogOpen(false); setSelectedCompetencias([]); },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });
  const removeMutation = trpc.planoIndividual.remove.useMutation({
    onSuccess: () => { toast.success("Competência removida do plano!"); refetchPlano(); refetchAlunos(); },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });
  const updateMutation = trpc.planoIndividual.update.useMutation({
    onSuccess: () => { toast.success("Plano atualizado!"); refetchPlano(); refetchAlunos(); },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });
  const addToTurmaMutation = trpc.planoIndividual.addToTurma.useMutation({
    onSuccess: (data) => { toast.success(`Competências atribuídas a ${data.alunosAtualizados} de ${data.totalAlunos} alunos!`); refetchAlunos(); setIsLoteDialogOpen(false); setSelectedCompetenciasLote([]); setSelectedTurma(""); },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });



  // Contrato mutations
  const criarContratoMutation = trpc.contratos.create.useMutation({
    onSuccess: () => { toast.success("Contrato salvo!"); refetchContratos(); resetContratoForm(); },
    onError: (error: any) => toast.error(`Erro: ${error.message}`),
  });
  const atualizarContratoMutation = trpc.contratos.update.useMutation({
    onSuccess: () => { toast.success("Contrato atualizado!"); refetchContratos(); resetContratoForm(); },
    onError: (error: any) => toast.error(`Erro: ${error.message}`),
  });
  const excluirContratoMutation = trpc.contratos.delete.useMutation({
    onSuccess: () => { toast.success("Contrato excluído!"); refetchContratos(); },
    onError: (error: any) => toast.error(`Erro: ${error.message}`),
  });
  // Metas mutationss
  const criarMeta = trpc.metas.criar.useMutation({
    onSuccess: () => { toast.success("Meta criada com sucesso!"); refetchMetas(); refetchResumo(); setShowAddMetaDialog(false); resetMetaForm(); },
    onError: (err) => toast.error(err.message),
  });
  const removerMeta = trpc.metas.remover.useMutation({
    onSuccess: () => { toast.success("Meta removida."); refetchMetas(); refetchResumo(); },
    onError: (err) => toast.error(err.message),
  });
  const registrarAcomp = trpc.metas.registrarAcompanhamento.useMutation({
    onSuccess: () => { toast.success("Acompanhamento registrado!"); refetchAcomp(); refetchMetas(); refetchResumo(); setShowAcompDialog(false); },
    onError: (err) => toast.error(err.message),
  });
  const sugerirIAMutation = trpc.metas.sugerirComIA.useMutation({
    onSuccess: () => { setMetaFromLibrary(false); toast.success("Sugestão gerada pela IA!"); },
    onError: (err) => toast.error("Erro ao gerar sugestão: " + err.message),
  });

  // Enviar P.D.I. por e-mail (instrução 10b)
  const enviarPdiEmailMutation = trpc.planoIndividual.enviarPorEmail.useMutation({
    onSuccess: (data: any) => toast.success(`P.D.I. enviado com sucesso para ${data.email}`),
    onError: (err: any) => toast.error(`Erro ao enviar e-mail: ${err.message}`),
  });

  // Criar assessment mutation
  const criarAssessmentMutation = trpc.assessment.criar.useMutation({
    onSuccess: (data: any) => {
      if (data?.addedToExisting) {
        toast.success(`${data.addedCount} competência(s) adicionada(s) à trilha existente!`);
      } else {
        toast.success("Assessment/PDI criado com sucesso!");
      }
      refetchAssessments(); refetchPlano(); refetchAlunos();
      resetNovoAssessmentForm();
    },
    onError: (err) => toast.error(err.message),
  });

  // ============================================================
  // COMPUTED VALUES
  // ============================================================
  const baseAlunos = useMemo(() => {
    if (isAdmin) return alunosWithPlano || [];
    if (!mentorAlunos || !alunosWithPlano) return [];
    const mentorAlunoIds = new Set(mentorAlunos.map((a: any) => a.id));
    return alunosWithPlano.filter(a => mentorAlunoIds.has(a.id));
  }, [isAdmin, alunosWithPlano, mentorAlunos]);

  const filteredAlunos = baseAlunos.filter(aluno => {
    const matchesSearch = aluno.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aluno.externalId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmpresa = selectedEmpresa === "all" || aluno.programId === parseInt(selectedEmpresa);
    return matchesSearch && matchesEmpresa;
  });

  const selectedAlunoData = alunosWithPlano?.find(a => a.id === selectedAluno);

  const competenciasDisponiveis = competencias?.filter(comp => {
    const jaNoPlano = planoAluno?.some(p => p.competenciaId === comp.id);
    const matchesTrilha = selectedTrilha === "all" || comp.trilhaId === parseInt(selectedTrilha);
    return !jaNoPlano && matchesTrilha;
  }) || [];

  const planoAgrupado = planoAluno?.reduce((acc, item) => {
    const trilha = item.trilhaNome || "Sem Trilha";
    if (!acc[trilha]) acc[trilha] = [];
    acc[trilha].push(item);
    return acc;
  }, {} as Record<string, typeof planoAluno>) || {};


  const competenciasLoteDisponiveis = competencias?.filter(comp => {
    const matchesTrilha = selectedTrilhaLote === "all" || comp.trilhaId === parseInt(selectedTrilhaLote);
    return matchesTrilha;
  }) || [];

  // Metas grouped by competencia
  const metasByCompetencia = useMemo(() => {
    const map = new Map<number, { competenciaId: number; competenciaNome: string; assessmentCompetenciaId: number; assessmentPdiId: number; metas: typeof metasDetalhadas }>();
    for (const ass of assessments) {
      for (const comp of (ass as any).competencias || []) {
        if (!map.has(comp.competenciaId)) {
          map.set(comp.competenciaId, {
            competenciaId: comp.competenciaId,
            competenciaNome: comp.competenciaNome,
            assessmentCompetenciaId: comp.id,
            assessmentPdiId: (ass as any).id,
            metas: []
          });
        }
      }
    }
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
          metas: [meta]
        });
      }
    }
    return Array.from(map.values());
  }, [assessments, metasDetalhadas]);

  const filteredLibrary = useMemo(() => {
    if (!addMetaCompId) return taskLibrary;
    const comp = metasByCompetencia.find(c => c.competenciaId === addMetaCompId);
    if (!comp) return taskLibrary;
    return taskLibrary.filter((t: any) =>
      t.competencia.toLowerCase().includes(comp.competenciaNome.toLowerCase()) ||
      comp.competenciaNome.toLowerCase().includes(t.competencia.toLowerCase())
    );
  }, [taskLibrary, addMetaCompId, metasByCompetencia]);

  const allLibraryItems = taskLibrary;

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleAddCompetencias = () => {
    if (!selectedAluno || selectedCompetencias.length === 0) return;
    addMultipleMutation.mutate({ alunoId: selectedAluno, competenciaIds: selectedCompetencias });
  };
  const handleRemove = (id: number) => {
    if (confirm("Remover esta competência do plano?")) removeMutation.mutate({ id });
  };
  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "concluida" ? "pendente" : "concluida";
    updateMutation.mutate({ id, status: newStatus as "pendente" | "em_progresso" | "concluida" });
  };
  const handleAddToTurma = () => {
    if (!selectedTurma || selectedCompetenciasLote.length === 0) { toast.error("Selecione uma turma e pelo menos uma competência"); return; }
    addToTurmaMutation.mutate({ turmaId: parseInt(selectedTurma), competenciaIds: selectedCompetenciasLote });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "concluida": return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Concluída</Badge>;
      case "em_progresso": return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Em Progresso</Badge>;
      default: return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" /> Pendente</Badge>;
    }
  };


  // Contrato handlers
  const resetContratoForm = () => {
    setShowContratoDialog(false); setEditingContrato(null);
    setContratoInicio(""); setContratoFim(""); setContratoSessoes(""); setContratoObs("");
  };
  const openEditContrato = (c: any) => {
    setEditingContrato(c);
    setContratoInicio(formatDateInput(c.periodoInicio));
    setContratoFim(formatDateInput(c.periodoTermino));
    setContratoSessoes(c.totalSessoesContratadas ? String(c.totalSessoesContratadas) : "");
    setContratoObs(c.observacoes || "");
    setShowContratoDialog(true);
  };
  const handleSaveContrato = () => {
    if (!contratoInicio || !contratoFim) { toast.error("Preencha as datas do contrato"); return; }
    if (editingContrato) {
      atualizarContratoMutation.mutate({
        id: editingContrato.id,
        periodoInicio: contratoInicio,
        periodoTermino: contratoFim,
        totalSessoesContratadas: contratoSessoes ? parseInt(contratoSessoes) : undefined,
        observacoes: contratoObs || undefined,
      });
    } else {
      const programId = selectedAlunoData?.programId || 1;
      criarContratoMutation.mutate({
        alunoId: selectedAluno!,
        programId,
        periodoInicio: contratoInicio,
        periodoTermino: contratoFim,
        totalSessoesContratadas: contratoSessoes ? parseInt(contratoSessoes) : 1,
        observacoes: contratoObs || undefined,
      });
    }
  };

  // Novo Assessment handlers
  function resetNovoAssessmentForm() {
    setShowNovoAssessment(false); setNovoStep(1);
    setNovoTrilhaId(""); setNovoConsultorId(""); setNovoMacroInicio(""); setNovoMacroTermino("");
    setNovoTotalSessoes(""); setNovoCompConfig([]);
  }
  function openNovoAssessment() {
    resetNovoAssessmentForm();
    // Pre-fill consultorId for mentors
    if (userConsultorId) setNovoConsultorId(String(userConsultorId));
    else if (selectedAlunoData && (selectedAlunoData as any).consultorId) setNovoConsultorId(String((selectedAlunoData as any).consultorId));
    setShowNovoAssessment(true);
  }
  // FIX: Detectar trilhas que já existem para este aluno (ativas)
  const existingTrilhaIds = new Set(
    assessments
      .filter((a: any) => a.status === 'ativo')
      .map((a: any) => a.trilhaId)
  );
  const novoTrilhaExists = novoTrilhaId ? existingTrilhaIds.has(parseInt(novoTrilhaId)) : false;
  const existingCompetenciaIdsNovo = new Set(
    assessments
      .filter((a: any) => a.status === 'ativo' && a.trilhaId === parseInt(novoTrilhaId))
      .flatMap((a: any) => (a.competencias || []).map((c: any) => c.competenciaId))
  );

  // Sync competencias when trilha changes
  const compsByTrilhaKey = useMemo(() => compsByTrilha.map((c: any) => c.id).join(","), [compsByTrilha]);
  useEffect(() => {
    if (!compsByTrilhaKey) { setNovoCompConfig([]); return; }
    setNovoCompConfig(compsByTrilha.map((c: any) => {
      const alreadyExists = existingCompetenciaIdsNovo.has(c.id);
      return {
        competenciaId: c.id,
        nome: c.nome || "Sem nome",
        selected: !alreadyExists,
        peso: "obrigatoria" as const,
        notaCorte: "80",
        microInicio: "",
        microTermino: "",
      };
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compsByTrilhaKey, novoTrilhaId]);

  function handleSubmitNovoAssessment() {
    if (!selectedAluno || !novoTrilhaId) {
      toast.error("Selecione uma trilha"); return;
    }
    if (!novoTrilhaExists && (!novoMacroInicio || !novoMacroTermino)) {
      toast.error("Preencha as datas da Macro Jornada"); return;
    }
    if (!novoTrilhaExists && novoMacroInicio >= novoMacroTermino) {
      toast.error("Data de início deve ser anterior à data de término"); return;
    }
    const selectedComps = novoCompConfig.filter(c => c.selected);
    if (selectedComps.length === 0) {
      toast.error("Selecione pelo menos uma competência"); return;
    }
    if (!novoTrilhaExists) {
      for (const comp of selectedComps) {
        if (comp.microInicio && comp.microInicio < novoMacroInicio) {
          toast.error(`Micro Jornada de "${comp.nome}" não pode iniciar antes da Macro Jornada`); return;
        }
        if (comp.microTermino && comp.microTermino > novoMacroTermino) {
          toast.error(`Micro Jornada de "${comp.nome}" não pode terminar depois da Macro Jornada`); return;
        }
      }
    }
    const effectiveMacroInicio = novoTrilhaExists ? '2000-01-01' : novoMacroInicio;
    const effectiveMacroTermino = novoTrilhaExists ? '2099-12-31' : novoMacroTermino;
    criarAssessmentMutation.mutate({
      alunoId: selectedAluno,
      trilhaId: parseInt(novoTrilhaId),
      turmaId: (selectedAlunoData as any)?.turmaId || null,
      programId: (selectedAlunoData as any)?.programId || null,
      consultorId: novoConsultorId ? parseInt(novoConsultorId) : null,
      macroInicio: effectiveMacroInicio,
      macroTermino: effectiveMacroTermino,
      competencias: selectedComps.map(c => ({
        competenciaId: c.competenciaId,
        peso: c.peso,
        notaCorte: c.notaCorte,
        microInicio: c.microInicio || null,
        microTermino: c.microTermino || null,
      })),
    });
  }

  // Metas handlers
  function resetMetaForm() {
    setMetaTitulo(""); setMetaDescricao(""); setMetaFromLibrary(false); setSelectedTaskLibraryId(null);
    setAddMetaCompId(null); setAddMetaAssCompId(null); setAddMetaPdiId(null);
  }
  function handleAddMeta(compId: number, assCompId: number, pdiId: number) {
    setMetaTitulo(""); setMetaDescricao(""); setMetaFromLibrary(false); setSelectedTaskLibraryId(null);
    sugerirIAMutation.reset();
    setAddMetaCompId(compId); setAddMetaAssCompId(assCompId); setAddMetaPdiId(pdiId);
    setShowAddMetaDialog(true);
  }
  function handleSubmitMeta() {
    if (!selectedAluno || !addMetaCompId || !addMetaAssCompId || !addMetaPdiId) return;
    const titulo = metaFromLibrary && selectedTaskLibraryId
      ? taskLibrary.find((t: any) => t.id === selectedTaskLibraryId)?.nome || metaTitulo
      : metaTitulo;
    if (!titulo.trim()) { toast.error("Informe o título da meta"); return; }
    criarMeta.mutate({
      alunoId: selectedAluno, assessmentCompetenciaId: addMetaAssCompId,
      competenciaId: addMetaCompId, assessmentPdiId: addMetaPdiId,
      taskLibraryId: metaFromLibrary ? selectedTaskLibraryId : null,
      titulo: titulo.trim(), descricao: metaDescricao.trim() || null,
    });
  }
  function handleOpenAcomp(metaId: number, titulo: string) {
    setAcompMetaId(metaId); setAcompMetaTitulo(titulo);
    setAcompMes(new Date().getMonth() + 1); setAcompAno(new Date().getFullYear());
    setAcompStatus("nao_cumprida"); setAcompObs(""); setShowAcompDialog(true);
  }
  function handleSubmitAcomp() {
    if (!acompMetaId || !selectedAluno) return;
    registrarAcomp.mutate({
      metaId: acompMetaId, alunoId: selectedAluno,
      mes: acompMes, ano: acompAno, status: acompStatus, observacao: acompObs.trim() || null,
    });
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">P.D.I - Plano de Desenvolvimento Individual</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visão unificada: contrato, jornada, competências, ciclos e metas do aluno
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isLoteDialogOpen} onOpenChange={setIsLoteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                <Users className="w-4 h-4 mr-2" />
                Atribuir em Lote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Atribuir Competências em Lote</DialogTitle>
                <DialogDescription>Selecione uma turma e as competências para atribuir a todos os alunos da turma</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Turma</Label>
                  <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                    <SelectTrigger><SelectValue placeholder="Selecione uma turma" /></SelectTrigger>
                    <SelectContent>
                      {turmas?.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Filtrar por Trilha</Label>
                  <Select value={selectedTrilhaLote} onValueChange={setSelectedTrilhaLote}>
                    <SelectTrigger><SelectValue placeholder="Todas as trilhas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as trilhas</SelectItem>
                      {trilhas?.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Competências ({selectedCompetenciasLote.length} selecionadas)</Label>
                  <div className="border rounded-lg max-h-60 overflow-y-auto p-2 space-y-1">
                    {competenciasLoteDisponiveis.map(comp => (
                      <div key={comp.id} className="flex items-center gap-2 p-2 hover:bg-accent/30 rounded">
                        <Checkbox checked={selectedCompetenciasLote.includes(comp.id)} onCheckedChange={(checked) => {
                          if (checked) setSelectedCompetenciasLote([...selectedCompetenciasLote, comp.id]);
                          else setSelectedCompetenciasLote(selectedCompetenciasLote.filter(id => id !== comp.id));
                        }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{comp.nome}</p>
                          <p className="text-xs text-muted-foreground">{comp.trilhaNome}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsLoteDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddToTurma} disabled={addToTurmaMutation.isPending || !selectedTurma || selectedCompetenciasLote.length === 0} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  {addToTurmaMutation.isPending ? "Atribuindo..." : "Atribuir Competências"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg"><Users className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
                <p className="text-2xl font-bold">{baseAlunos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg"><Target className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Com Plano Definido</p>
                <p className="text-2xl font-bold">{alunosWithPlano?.filter(a => a.totalCompetencias > 0).length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg"><BookOpen className="w-5 h-5 text-purple-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Competências</p>
                <p className="text-2xl font-bold">{competencias?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/10 rounded-lg"><Building2 className="w-5 h-5 text-secondary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Empresas</p>
                <p className="text-2xl font-bold">{empresas?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ===== LISTA DE ALUNOS (sidebar) ===== */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Alunos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar aluno..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-9" />
            </div>
            <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Filtrar por empresa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {empresas?.map(emp => <SelectItem key={emp.id} value={String(emp.id)}>{emp.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="max-h-[600px] overflow-y-auto space-y-1">
              {loadingAlunos ? (
                <p className="text-center text-muted-foreground py-4 text-sm">Carregando...</p>
              ) : filteredAlunos.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">Nenhum aluno encontrado</p>
              ) : (
                filteredAlunos.map(aluno => (
                  <button
                    key={aluno.id}
                    onClick={() => { setSelectedAluno(aluno.id); setExpandedCompId(null); }}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedAluno === aluno.id ? "bg-primary/10 border-primary/30" : "hover:bg-accent/30 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{aluno.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {aluno.externalId}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant={aluno.totalCompetencias > 0 ? "default" : "outline"} className="text-xs">
                          {aluno.competenciasObrigatorias} obrig.
                        </Badge>
                        {aluno.progressoPlano > 0 && (
                          <p className="text-xs text-green-600 mt-1">{aluno.progressoPlano}%</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* ===== CONTEÚDO PRINCIPAL (sequencial) ===== */}
        <div className="lg:col-span-3 space-y-6">
          {!selectedAluno ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Target className="w-12 h-12 mb-4 opacity-30" />
                <p className="font-medium">Selecione um aluno na lista ao lado</p>
                <p className="text-sm mt-1">Para visualizar e gerenciar o plano de desenvolvimento individual</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Aluno selecionado header */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold">{selectedAlunoData?.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        ID: {selectedAlunoData?.externalId} | {selectedAlunoData?.competenciasObrigatorias} competências obrigatórias
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          Mentoria: {(selectedAlunoData as any)?.tipoMentoria === 'grupo' ? 'Em Grupo' : 'Individual'}
                        </span>
                        {(() => {
                          const sessoes = contratos.length > 0
                            ? contratos[0]?.totalSessoesContratadas
                            : (selectedAlunoData as any)?.totalSessoesContratadas;
                          return sessoes ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                              {sessoes} sessões contratadas
                            </span>
                          ) : null;
                        })()}
                        {(() => {
                          const cInicio = (selectedAlunoData as any)?.contratoInicio;
                          const cFim = (selectedAlunoData as any)?.contratoFim;
                          return (cInicio || cFim) ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                              Contrato: {cInicio ? new Date(cInicio).toLocaleDateString('pt-BR') : '—'} a {cFim ? new Date(cFim).toLocaleDateString('pt-BR') : '—'}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={() => { if (selectedAluno) enviarPdiEmailMutation.mutate({ alunoId: selectedAluno }); }}
                        disabled={enviarPdiEmailMutation.isPending || !selectedAluno}
                        title="Envia o P.D.I. completo por e-mail ao aluno"
                      >
                        {enviarPdiEmailMutation.isPending
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                          : <><Mail className="h-4 w-4" /> Enviar P.D.I. por e-mail</>}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedAluno(null)}>Trocar aluno</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ===== SEÇÃO 1: CONTRATO — REMOVIDA (instrução 02) ===== */}

              {/* ===== SEÇÃO 2: JORNADA / ASSESSMENT PDI ===== */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Jornada / Assessment PDI</CardTitle>
                    </div>

                  </div>
                  <CardDescription>Trilhas, competências vinculadas, níveis e metas por ciclo</CardDescription>
                </CardHeader>
                <CardContent>
                  {assessments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="p-4 bg-amber-50 rounded-full mb-4">
                        <AlertTriangle className="h-8 w-8 text-amber-500" />
                      </div>
                      <h3 className="font-semibold text-base mb-1">Nenhum Assessment / PDI encontrado</h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-md">
                        Este aluno ainda não possui um Plano de Desenvolvimento Individual. Crie o primeiro assessment para definir trilha, competências e metas.
                      </p>
                      <Button onClick={openNovoAssessment} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                        <Plus className="h-4 w-4 mr-2" /> Criar Primeiro Assessment
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* PDIs ATIVOS — ciclo atual, exibidos primeiro */}
                      {assessments.filter((a: any) => a.status === 'ativo').map((ass: any) => (
                        <div key={ass.id} className="border rounded-lg overflow-hidden">
                          <div className="p-4 bg-muted/30 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  PDI {String(ass.numeroPdi ?? 1).padStart(3, '0')}
                                </span>
                                <h4 className="font-semibold text-sm">{ass.trilhaNome || "Trilha"}</h4>
                                <Badge className="bg-green-500">
                                  <Play className="h-3 w-3 mr-1" /> ativo
                                </Badge>
                                {ass.consultorNome && <span className="text-xs text-muted-foreground">Mentora: {ass.consultorNome}</span>}
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span>Macro: {formatDate(ass.macroInicio)} — {formatDate(ass.macroTermino)}</span>
                                {ass.totalSessoesPrevistas && <span>{ass.totalSessoesPrevistas} sessões previstas</span>}
                                <span>{(ass.competencias || []).length} competências</span>
                              </div>
                            </div>
                          </div>
                          {(ass.competencias || []).length > 0 && (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">Competência</TableHead>
                                    <TableHead className="text-xs w-20">Peso</TableHead>
                                    <TableHead className="text-xs w-20">Nível</TableHead>
                                    <TableHead className="text-xs w-20">Meta Final</TableHead>
                                    <TableHead className="text-xs w-40">Micro Jornada</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(ass.competencias || []).map((comp: any) => (
                                    <TableRow key={comp.id}>
                                      <TableCell className="text-sm font-medium">{comp.competenciaNome}</TableCell>
                                      <TableCell>
                                        <Badge variant={comp.peso === 'obrigatoria' ? 'default' : 'outline'} className="text-xs">
                                          {comp.peso === 'obrigatoria' ? 'Obrig.' : 'Opc.'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-sm">{comp.nivelAtualEfetivo ?? comp.nivelAtual ?? "—"}%</TableCell>
                                      <TableCell className="text-sm">{comp.metaFinal ?? "—"}%</TableCell>
                                      <TableCell className="text-xs text-muted-foreground">
                                        {comp.microInicio || comp.microTermino
                                          ? `${formatDate(comp.microInicio)} — ${formatDate(comp.microTermino)}`
                                          : "—"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* PDIs CONGELADOS — ciclos anteriores, colapsados por padrão */}
                      {assessments.filter((a: any) => a.status === 'congelado').length > 0 && (() => {
                        const congelados = assessments.filter((a: any) => a.status === 'congelado');
                        return (
                          <details className="group">
                            <summary className="cursor-pointer list-none">
                              <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <History className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Ciclos Anteriores — PDIs Congelados ({congelados.length})
                                </span>
                                <ChevronDown className="h-4 w-4 text-gray-400 ml-auto group-open:hidden" />
                                <ChevronUp className="h-4 w-4 text-gray-400 ml-auto hidden group-open:block" />
                              </div>
                            </summary>
                            <div className="mt-2 space-y-3 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                              {congelados.map((ass: any) => (
                                <div key={ass.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden opacity-80">
                                  <div className="p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                          PDI {String(ass.numeroPdi ?? 1).padStart(3, '0')}
                                        </span>
                                        <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">{ass.trilhaNome || "Trilha"}</h4>
                                        <Badge className="bg-gray-400 text-white text-xs">
                                          <Snowflake className="h-3 w-3 mr-1" /> Ciclo Anterior — PDI Congelado
                                        </Badge>
                                        {ass.congeladoEm && (
                                          <span className="text-xs text-gray-400">Congelado em {formatDate(ass.congeladoEm)}</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                        <span>Macro: {formatDate(ass.macroInicio)} — {formatDate(ass.macroTermino)}</span>
                                        <span>{(ass.competencias || []).length} competências</span>
                                      </div>
                                    </div>
                                  </div>
                                  {(ass.competencias || []).length > 0 && (
                                    <div className="overflow-x-auto">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-gray-50 dark:bg-gray-900">
                                            <TableHead className="text-xs text-gray-400">Competência</TableHead>
                                            <TableHead className="text-xs w-20 text-gray-400">Peso</TableHead>
                                            <TableHead className="text-xs w-20 text-gray-400">Nível</TableHead>
                                            <TableHead className="text-xs w-20 text-gray-400">Meta Final</TableHead>
                                            <TableHead className="text-xs w-40 text-gray-400">Micro Jornada</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {(ass.competencias || []).map((comp: any) => (
                                            <TableRow key={comp.id} className="opacity-70">
                                              <TableCell className="text-sm font-medium text-gray-500">{comp.competenciaNome}</TableCell>
                                              <TableCell>
                                                <Badge variant={comp.peso === 'obrigatoria' ? 'default' : 'outline'} className="text-xs opacity-60">
                                                  {comp.peso === 'obrigatoria' ? 'Obrig.' : 'Opc.'}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="text-sm text-gray-500">{comp.nivelAtualEfetivo ?? comp.nivelAtual ?? "—"}%</TableCell>
                                              <TableCell className="text-sm text-gray-500">{comp.metaFinal ?? "—"}%</TableCell>
                                              <TableCell className="text-xs text-gray-400">
                                                {comp.microInicio || comp.microTermino
                                                  ? `${formatDate(comp.microInicio)} — ${formatDate(comp.microTermino)}`
                                                  : "—"}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ===== SEÇÃO 3: COMPETÊNCIAS DO PLANO — OCULTA (instrução 04) ===== */}
              {false && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Competências do Plano</CardTitle>
                    </div>
                    {isAdmin && selectedAluno && (
                      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Adicionar Competências ao Plano</DialogTitle>
                            <DialogDescription>Selecione as competências obrigatórias para {selectedAlunoData?.name}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Select value={selectedTrilha} onValueChange={setSelectedTrilha}>
                              <SelectTrigger><SelectValue placeholder="Filtrar por trilha" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todas as trilhas</SelectItem>
                                {trilhas?.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                              {competenciasDisponiveis.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4 text-sm">Todas as competências já estão no plano</p>
                              ) : (
                                competenciasDisponiveis.map(comp => (
                                  <div key={comp.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/30">
                                    <Checkbox checked={selectedCompetencias.includes(comp.id)} onCheckedChange={(checked) => {
                                      if (checked) setSelectedCompetencias([...selectedCompetencias, comp.id]);
                                      else setSelectedCompetencias(selectedCompetencias.filter(id => id !== comp.id));
                                    }} />
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{comp.nome}</p>
                                      <p className="text-xs text-muted-foreground">{comp.trilhaNome}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleAddCompetencias} disabled={selectedCompetencias.length === 0 || addMultipleMutation.isPending}>
                              {addMultipleMutation.isPending ? "Adicionando..." : `Adicionar ${selectedCompetencias.length} competência(s)`}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!planoAluno || planoAluno.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma competência definida no plano</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(planoAgrupado).map(([trilha, items]) => (
                        <div key={trilha}>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                            {trilha}
                            <Badge variant="outline" className="text-xs">{items?.length || 0}</Badge>
                          </h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Competência</TableHead>
                                <TableHead className="text-xs w-32">Status</TableHead>
                                <TableHead className="text-xs w-24">Meta</TableHead>
                                {isAdmin && <TableHead className="text-xs w-20">Ações</TableHead>}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items?.map(item => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <p className="font-medium text-sm">{item.competenciaNome}</p>
                                    {item.competenciaCodigo && <p className="text-xs text-muted-foreground">{item.competenciaCodigo}</p>}
                                  </TableCell>
                                  <TableCell>
                                    {isAdmin ? (
                                      <button onClick={() => handleToggleStatus(item.id, item.status)}>{getStatusBadge(item.status)}</button>
                                    ) : getStatusBadge(item.status)}
                                  </TableCell>
                                  <TableCell className="text-sm">&ge; {item.metaNota}</TableCell>
                                  {isAdmin && (
                                    <TableCell>
                                      <Button variant="ghost" size="sm" onClick={() => handleRemove(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              )}

              {/* ===== SEÇÃO 4: DISC ===== */}
              {discResultado && (
                <Card className="border-secondary/30 bg-gradient-to-r from-secondary/5 to-transparent">
                  <CardContent className="py-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4" />
                      Perfil Comportamental DISC
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      {[
                        { label: 'Dominância (D)', score: discResultado.scoreD, color: 'bg-red-500' },
                        { label: 'Influência (I)', score: discResultado.scoreI, color: 'bg-yellow-500' },
                        { label: 'Estabilidade (S)', score: discResultado.scoreS, color: 'bg-green-500' },
                        { label: 'Conformidade (C)', score: discResultado.scoreC, color: 'bg-blue-500' },
                      ].map(dim => (
                        <div key={dim.label} className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">{dim.label}</div>
                          <div className="relative h-2.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${dim.color}`} style={{ width: `${Math.min(Number(dim.score), 100)}%` }} />
                          </div>
                          <div className="text-sm font-bold mt-1">{(Number(dim?.score ?? 0) ?? 0).toFixed(0)}%</div>
                        </div>
                      ))}
                    </div>
                    {discResultado.perfilPredominante && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary text-primary-foreground">Primário: {discResultado.perfilPredominante}</Badge>
                        {discResultado.perfilSecundario && <Badge variant="outline">Secundário: {discResultado.perfilSecundario}</Badge>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ===== SEÇÃO 6: INDICADORES DUAIS — OCULTA (instrução 06) ===== */}

              {/* ===== SEÇÃO 5: AUTOPERCEPÇÃO DE COMPETÊNCIAS (instrução 08b) ===== */}
              {autopercepcoesData.length > 0 && competencias && trilhas && (() => {
                const TRILHAS_BASE = ["Basic", "Essential", "Master"];
                const notaLabels: Record<number, string> = {
                  1: "Preciso desenvolver muito",
                  2: "Preciso desenvolver",
                  3: "Razoável",
                  4: "Bom domínio",
                  5: "Domino com excelência",
                };
                const notaCores: Record<number, string> = {
                  1: "bg-red-500", 2: "bg-orange-400", 3: "bg-yellow-400", 4: "bg-emerald-400", 5: "bg-emerald-600"
                };
                const trilhaCoresMap: Record<string, string> = {
                  "Basic": "#3B82F6", "Essential": "#10B981", "Master": "#8B5CF6", "Visão de Futuro": "#F59E0B",
                };
                const trilhasComAuto = new Set((autopercepcoesData as any[]).map((a: any) => a.trilhaId));
                const trilhasOrdenadas = [...(trilhas as any[])]
                  .filter((t: any) => TRILHAS_BASE.includes(t.name) || trilhasComAuto.has(t.id))
                  .sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0));
                const porTrilha = trilhasOrdenadas.map((trilha: any) => {
                  const comps = (competencias as any[]).filter((c: any) => c.trilhaId === trilha.id);
                  const avaliacoes = comps.map((c: any) => {
                    const av = (autopercepcoesData as any[]).find((a: any) => a.competenciaId === c.id);
                    return { competencia: c, nota: av?.nota || 0 };
                  }).filter((a: any) => a.nota > 0);
                  const media = avaliacoes.length > 0
                    ? avaliacoes.reduce((sum: number, a: any) => sum + a.nota, 0) / avaliacoes.length
                    : 0;
                  return { trilha, avaliacoes, media };
                }).filter(t => t.avaliacoes.length > 0);

                return (
                  <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white">
                      <h3 className="text-base font-bold flex items-center gap-2">
                        <Gauge className="h-5 w-5" /> Autopercepção de Competências
                      </h3>
                      <p className="text-white/80 text-xs mt-1">Como o aluno se avalia em cada competência das trilhas de desenvolvimento</p>
                    </div>
                    <CardContent className="pt-5 space-y-5">
                      {porTrilha.map(({ trilha, avaliacoes, media }: any) => (
                        <div key={trilha.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: trilhaCoresMap[trilha.name] || "#6B7280" }} />
                              <h4 className="font-semibold text-sm text-gray-800">{trilha.name}</h4>
                            </div>
                            <Badge variant="outline" className="text-xs">Média: {media.toFixed(1)}/5</Badge>
                          </div>
                          <div className="space-y-1.5">
                            {avaliacoes.map(({ competencia, nota }: any) => (
                              <div key={competencia.id} className="flex items-center gap-3">
                                <span className="text-xs text-gray-600 w-44 shrink-0 truncate" title={competencia.nome}>{competencia.nome}</span>
                                <div className="flex-1 flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <div key={n} className={`h-3.5 flex-1 rounded-sm ${
                                      n <= nota ? notaCores[nota] : "bg-gray-200"
                                    }`} />
                                  ))}
                                </div>
                                <span className="text-xs font-medium text-gray-700 w-8 text-right">{nota}/5</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-3">
                        <p className="text-xs text-muted-foreground font-medium mb-2">Legenda:</p>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div key={n} className="flex items-center gap-1">
                              <div className={`w-3 h-3 rounded-sm ${notaCores[n]}`} />
                              <span className="text-xs text-gray-600">{n} — {notaLabels[n]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* ===== SEÇÃO 7: METAS DE DESENVOLVIMENTO — OCULTA ===== */}
              {false && <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Flag className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Metas de Desenvolvimento</CardTitle>
                  </div>
                  <CardDescription>Objetivo macro por competência e micrometas para atingí-lo</CardDescription>
                </CardHeader>
                <CardContent>
                  {assessments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">O aluno precisa ter um Assessment/PDI para criar metas.</p>
                  ) : metasByCompetencia.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma competência encontrada no Assessment.</p>
                  ) : (
                    <div className="space-y-2">
                      {metasByCompetencia.map((comp) => {
                        const isExpanded = expandedCompId === comp.competenciaId;
                        // Separar meta macro (primeira sem número) das micrometas (numeradas)
                        const metaMacro = comp.metas.find((m: any) => !/^\d+\./.test(m.titulo.trim()));
                        const micrometas = comp.metas.filter((m: any) => /^\d+\./.test(m.titulo.trim()));
                        const totalMicro = micrometas.length;
                        const microCumpridas = micrometas.filter((m: any) => m.ultimoStatus === 'cumprida').length;
                        const pctMicro = totalMicro > 0 ? Math.round((microCumpridas / totalMicro) * 100) : 0;
                        return (
                          <div key={comp.competenciaId} className="border rounded-lg overflow-hidden">
                            {/* Cabeçalho da competência */}
                            <button
                              onClick={() => setExpandedCompId(isExpanded ? null : comp.competenciaId)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors text-left"
                            >
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Target className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">{comp.competenciaNome}</p>
                                  {totalMicro > 0 && (
                                    <Badge variant="outline" className="text-xs">{microCumpridas}/{totalMicro} micrometa{totalMicro !== 1 ? 's' : ''}</Badge>
                                  )}
                                  {comp.metas.length === 0 && (
                                    <Badge variant="outline" className="text-xs text-muted-foreground">0 metas</Badge>
                                  )}
                                </div>
                                {totalMicro > 0 && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Progress value={pctMicro} className="h-1.5 flex-1 max-w-32" />
                                    <span className="text-xs text-muted-foreground">{pctMicro}%</span>
                                  </div>
                                )}
                              </div>
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            </button>

                            {isExpanded && (
                              <div className="border-t bg-muted/10">
                                {comp.metas.length === 0 ? (
                                  <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma meta definida</div>
                                ) : (
                                  <div className="p-3 space-y-3">
                                    {/* META MACRO */}
                                    {metaMacro && (
                                      <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-3">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex items-start gap-2 flex-1 min-w-0">
                                            <Flag className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">Objetivo Principal</p>
                                              <p className="text-sm font-medium">{metaMacro.titulo}</p>
                                              {metaMacro.descricao && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{metaMacro.descricao}</p>
                                              )}
                                              {metaMacro.ultimoStatus && (
                                                <div className="flex items-center gap-2 mt-1.5">
                                                  <Badge className={`text-xs ${getMetaStatusColor(metaMacro.ultimoStatus)}`}>{getMetaStatusLabel(metaMacro.ultimoStatus)}</Badge>
                                                  {metaMacro.ultimoMes && metaMacro.ultimoAno && <span className="text-xs text-muted-foreground">{meses[(metaMacro.ultimoMes as number) - 1]} {metaMacro.ultimoAno}</span>}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Acompanhamento" onClick={() => handleOpenAcomp(metaMacro.id, metaMacro.titulo)}>
                                              <Calendar className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" title="Remover" onClick={() => { if (confirm('Remover esta meta?')) removerMeta.mutate({ id: metaMacro.id }); }}>
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* MICROMETAS */}
                                    {micrometas.length > 0 && (
                                      <div className="ml-3 space-y-1.5">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Micrometas</p>
                                        {micrometas.map((meta: any) => (
                                          <div key={meta.id} className="flex items-start gap-2 p-2.5 rounded-lg border bg-card">
                                            <div className="mt-0.5 shrink-0">{getMetaStatusIcon(meta.ultimoStatus || '')}</div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm">{meta.titulo}</p>
                                                {meta.taskLibraryId && <Badge variant="secondary" className="text-xs gap-1"><Library className="h-3 w-3" />Biblioteca</Badge>}
                                              </div>
                                              {meta.descricao && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{meta.descricao}</p>}
                                              {meta.ultimoStatus && (
                                                <div className="flex items-center gap-2 mt-1">
                                                  <Badge className={`text-xs ${getMetaStatusColor(meta.ultimoStatus)}`}>{getMetaStatusLabel(meta.ultimoStatus)}</Badge>
                                                  {meta.ultimoMes && meta.ultimoAno && <span className="text-xs text-muted-foreground">{meses[(meta.ultimoMes as number) - 1]} {meta.ultimoAno}</span>}
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Acompanhamento" onClick={() => handleOpenAcomp(meta.id, meta.titulo)}>
                                                <Calendar className="h-3.5 w-3.5" />
                                              </Button>
                                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" title="Remover" onClick={() => { if (confirm('Remover esta meta?')) removerMeta.mutate({ id: meta.id }); }}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="p-2 border-t">
                                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => handleAddMeta(comp.competenciaId, comp.assessmentCompetenciaId, comp.assessmentPdiId)}>
                                    <Plus className="h-4 w-4" /> Adicionar Meta
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>}

              {/* ===== SEÇÃO 8: PERFORMANCE FILTRADA — OCULTA (instrução 08a) ===== */}
              {false && performanceFiltrada && planoAluno && planoAluno.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Performance Filtrada</CardTitle>
                    </div>
                    <CardDescription>Indicadores calculados com as competências obrigatórias do plano</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg text-center">
                        <Award className="w-5 h-5 text-primary mx-auto mb-1" />
                        <p className="text-2xl font-bold text-primary">{(performanceFiltrada.indicadoresV2?.consolidado?.ind7_engajamentoFinal ?? performanceFiltrada.indicadores.notaFinal).toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Engajamento Final</p>
                        <Badge className={`mt-1 text-xs ${performanceFiltrada.indicadores.classificacao === 'Excelência' ? 'bg-green-500' : performanceFiltrada.indicadores.classificacao === 'Avançado' ? 'bg-blue-500' : performanceFiltrada.indicadores.classificacao === 'Intermediário' ? 'bg-yellow-500' : 'bg-orange-500'}`}>
                          {performanceFiltrada.indicadores.classificacao}
                        </Badge>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-700">{performanceFiltrada.planoIndividual.competenciasAprovadas}/{performanceFiltrada.planoIndividual.totalCompetencias}</p>
                        <p className="text-xs text-muted-foreground">Competências Aprovadas</p>
                        <p className="text-xs text-green-600 mt-1">{(performanceFiltrada?.planoIndividual?.percentualAprovacao ?? 0).toFixed(0)}%</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-700">{(performanceFiltrada?.planoIndividual?.mediaNotas ?? 0).toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Média Notas</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-lg text-center">
                        <p className="text-2xl font-bold text-secondary">{(performanceFiltrada.indicadoresV2?.consolidado?.ind1_webinars ?? performanceFiltrada.indicadores.participacaoMentorias).toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">Webinars / Eventos</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Indicadores V2</h4>
                      {[
                        { label: "1. Webinars / Eventos", value: performanceFiltrada.indicadoresV2?.consolidado?.ind1_webinars ?? performanceFiltrada.indicadores.participacaoMentorias },
                        { label: "2. Avaliações", value: performanceFiltrada.indicadoresV2?.consolidado?.ind2_avaliacoes ?? performanceFiltrada.indicadores.atividadesPraticas },
                        { label: "3. Competências", value: performanceFiltrada.indicadoresV2?.consolidado?.ind3_competencias ?? performanceFiltrada.indicadores.engajamento },
                        { label: "4. Tarefas", value: performanceFiltrada.indicadoresV2?.consolidado?.ind4_tarefas ?? performanceFiltrada.indicadores.performanceCompetencias },
                        { label: "5. Engajamento", value: performanceFiltrada.indicadoresV2?.consolidado?.ind5_engajamento ?? (performanceFiltrada.indicadores as any).performanceAprendizado ?? 0 },
                        { label: "6. Aplicabilidade", value: performanceFiltrada.indicadoresV2?.consolidado?.ind6_aplicabilidade ?? performanceFiltrada.indicadores.participacaoEventos },
                      ].map(ind => (
                        <div key={ind.label}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{ind.label}</span>
                            <span className="text-xs font-medium">{(ind?.value ?? 0).toFixed(0)}%</span>
                          </div>
                          <Progress value={ind.value} className="h-1.5" />
                        </div>
                      ))}
                      <Separator />
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-semibold">7. Engajamento Final (Média dos 5)</span>
                          <span className="text-sm font-bold text-primary">{(performanceFiltrada.indicadoresV2?.consolidado?.ind7_engajamentoFinal ?? performanceFiltrada.indicadores.notaFinal).toFixed(1)}%</span>
                        </div>
                        <Progress value={performanceFiltrada.indicadoresV2?.consolidado?.ind7_engajamentoFinal ?? performanceFiltrada.indicadores.notaFinal} className="h-2.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ===== SEÇÃO 9: MAPA RESUMO DO PLANO (instrução 09) ===== */}
              {resumoPlano && (
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-white">
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <Target className="h-5 w-5" /> Mapa do Plano de Desenvolvimento
                    </h3>
                    <p className="text-white/80 text-xs mt-1">Visão geral de tudo que o aluno deve realizar durante a jornada</p>
                  </div>
                  <CardContent className="pt-5">
                    {/* Linha 1: Trilha + Programa + Período */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                      <div className="p-3 bg-white rounded-xl text-center border shadow-sm">
                        <p className="text-xs text-muted-foreground mb-1">Trilha</p>
                        <p className="text-sm font-bold text-primary">{resumoPlano.aluno?.trilhaNome || '—'}</p>
                        {resumoPlano.aluno?.programaNome && <p className="text-xs text-muted-foreground mt-0.5">{resumoPlano.aluno.programaNome}</p>}
                      </div>
                      <div className="p-3 bg-white rounded-xl text-center border shadow-sm">
                        <p className="text-xs text-muted-foreground mb-1">Início</p>
                        <p className="text-sm font-bold text-primary">
                          {resumoPlano.periodo?.inicio ? new Date(resumoPlano.periodo.inicio).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                      <div className="p-3 bg-white rounded-xl text-center border shadow-sm">
                        <p className="text-xs text-muted-foreground mb-1">Término</p>
                        <p className="text-sm font-bold text-amber-600">
                          {resumoPlano.periodo?.fim ? new Date(resumoPlano.periodo.fim).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Linha 2: Metas numéricas do contrato */}
                    {resumoPlano.metas && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl text-center border border-purple-100">
                          <Calendar className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-purple-700">{resumoPlano.metas.mesesContrato}</p>
                          <p className="text-xs font-medium text-purple-800">Meses de Contrato</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl text-center border border-emerald-100">
                          <Users className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-emerald-700">{resumoPlano.metas.sessoesMinimas}</p>
                          <p className="text-xs font-medium text-emerald-800">Mentorias</p>
                          <p className="text-xs text-muted-foreground">{resumoPlano.aluno?.tipoMentoria === 'grupo' ? 'Em Grupo' : 'Individual'}</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl text-center border border-amber-100">
                          <ListChecks className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-amber-700">{resumoPlano.metas.tarefasMinimas}</p>
                          <p className="text-xs font-medium text-amber-800">Tarefas Mínimas</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl text-center border border-blue-100">
                          <Play className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-blue-700">{resumoPlano.metas.webinarsMinimos}</p>
                          <p className="text-xs font-medium text-blue-800">Webinars Mínimos</p>
                        </div>
                      </div>
                    )}

                    {/* Linha 3: Competências + Cursos + Metas */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-white rounded-xl text-center border shadow-sm">
                        <BookOpen className="w-4 h-4 text-primary mx-auto mb-1" />
                        <p className="text-2xl font-bold text-primary">{resumoPlano.competenciasAssessment?.length ?? 0}</p>
                        <p className="text-xs font-medium text-gray-700">Competências</p>
                        <p className="text-xs text-muted-foreground">no plano</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl text-center border shadow-sm">
                        <BarChart3 className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-indigo-700">{resumoPlano.cursosAtribuidos?.length ?? 0}</p>
                        <p className="text-xs font-medium text-gray-700">Cursos</p>
                        <p className="text-xs text-muted-foreground">atribuídos</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl text-center border shadow-sm">
                        <Flag className="w-4 h-4 text-rose-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-rose-700">{metasDetalhadas?.length ?? 0}</p>
                        <p className="text-xs font-medium text-gray-700">Metas</p>
                        <p className="text-xs text-muted-foreground">de desenvolvimento</p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-4 text-center border-t pt-3">
                      Regra: a cada 6 meses de contrato → 5 sessões de mentoria, 5 tarefas e 10 webinars mínimos
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* ===== SEÇÃO 10: COMPETÊNCIAS COM MICROCICLOS (ASSESSMENT) ===== */}
              {/* Card ocultado a pedido — dados já aparecem no PDI ativo acima */}
              {false && resumoPlano?.competenciasAssessment && resumoPlano.competenciasAssessment.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Competências — Microciclos Definidos</CardTitle>
                    </div>
                    <CardDescription>
                      Competências que o aluno deve desenvolver, com período e nota mínima exigida pelo mentor
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {resumoPlano.competenciasAssessment.map((comp: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Target className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{comp.competenciaNome}</p>
                              {comp.categoria && <p className="text-xs text-muted-foreground">{comp.categoria}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 ml-3 text-right">
                            {(comp.microInicio || comp.microTermino) && (
                              <div>
                                <p className="text-xs text-muted-foreground">Período</p>
                                <p className="text-xs font-medium">
                                  {comp.microInicio ? new Date(comp.microInicio).toLocaleDateString('pt-BR', {month:'short',year:'numeric'}) : '—'}
                                  {' → '}
                                  {comp.microTermino ? new Date(comp.microTermino).toLocaleDateString('pt-BR', {month:'short',year:'numeric'}) : '—'}
                                </p>
                              </div>
                            )}
                            {comp.notaCorte && (
                              <div>
                                <p className="text-xs text-muted-foreground">Nota mín.</p>
                                <p className="text-xs font-bold text-primary">{Number(comp.notaCorte).toFixed(1)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ===== SEÇÃO 11: CATÁLOGO DE CURSOS POR COMPETÊNCIA (instrução 10a) ===== */}
              {resumoPlano?.cursosAtribuidos && resumoPlano.cursosAtribuidos.length > 0 && (() => {
                // Agrupar cursos por competência
                const cursosAgrupados: Record<string, { competenciaNome: string; cursos: any[] }> = {};
                resumoPlano.cursosAtribuidos.forEach((curso: any) => {
                  const chave = curso.competenciaNome || 'Sem competência vinculada';
                  if (!cursosAgrupados[chave]) cursosAgrupados[chave] = { competenciaNome: chave, cursos: [] };
                  cursosAgrupados[chave].cursos.push(curso);
                });
                const grupos = Object.values(cursosAgrupados);
                return (
                  <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 text-white">
                      <h3 className="text-base font-bold flex items-center gap-2">
                        <BookOpen className="h-5 w-5" /> Catálogo de Cursos por Competência
                      </h3>
                      <p className="text-white/80 text-xs mt-1">
                        {resumoPlano.cursosAtribuidos.length} curso{resumoPlano.cursosAtribuidos.length !== 1 ? 's' : ''} atribuído{resumoPlano.cursosAtribuidos.length !== 1 ? 's' : ''} em {grupos.length} competência{grupos.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <CardContent className="pt-4 space-y-4">
                      {grupos.map((grupo) => (
                        <div key={grupo.competenciaNome}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-6 rounded-md bg-indigo-100 flex items-center justify-center shrink-0">
                              <Target className="h-3.5 w-3.5 text-indigo-600" />
                            </div>
                            <h4 className="font-semibold text-sm text-gray-800">{grupo.competenciaNome}</h4>
                            <Badge variant="outline" className="text-xs ml-auto">{grupo.cursos.length} curso{grupo.cursos.length !== 1 ? 's' : ''}</Badge>
                          </div>
                          <div className="space-y-1.5 ml-8">
                            {grupo.cursos.map((curso: any) => (
                              <div key={curso.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-gray-50/50">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="h-6 w-6 rounded bg-blue-100 flex items-center justify-center shrink-0">
                                    <BookOpen className="h-3 w-3 text-blue-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{curso.cursoTitulo || 'Curso sem título'}</p>
                                    {curso.cursoDescricao && <p className="text-xs text-muted-foreground truncate">{curso.cursoDescricao}</p>}
                                  </div>
                                </div>
                                {curso.dataPrazo && (
                                  <div className="text-right shrink-0 ml-3">
                                    <p className="text-xs text-muted-foreground">Prazo</p>
                                    <p className="text-xs font-medium">{new Date(curso.dataPrazo).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* ===== SEÇÃO 12: WEBINARES DO ALUNO ===== */}
              {resumoPlano?.webinares && resumoPlano.webinares.length > 0 && (() => {
                const dataReset = resumoPlano.dataUltimoReset ? new Date(resumoPlano.dataUltimoReset) : null;

                // Separar webinares por ciclo (se houver reset)
                const webinaresCicloAtual = dataReset
                  ? resumoPlano.webinares.filter((w: any) => w.eventDate && new Date(w.eventDate) >= dataReset)
                  : resumoPlano.webinares;
                const webinaresHistorico = dataReset
                  ? resumoPlano.webinares.filter((w: any) => !w.eventDate || new Date(w.eventDate) < dataReset)
                  : [];

                const renderListaWebinares = (lista: any[], corBg: string, metaWebinars?: number) => {
                  const presentes = lista.filter((w: any) => w.status === 'presente');
                  const ausentes = lista.filter((w: any) => w.status !== 'presente');
                  return (
                    <>
                      <div className={`flex items-center gap-4 mb-3 p-3 ${corBg} rounded-lg`}>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-700">{presentes.length}</p>
                          <p className="text-xs text-blue-600">Presenças</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-500">{ausentes.length}</p>
                          <p className="text-xs text-gray-500">Ausências</p>
                        </div>
                        {metaWebinars && (
                          <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-700">
                              {Math.round((presentes.length / metaWebinars) * 100)}%
                            </p>
                            <p className="text-xs text-emerald-600">da meta ({metaWebinars})</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5 max-h-64 overflow-y-auto">
                        {lista.map((w: any) => (
                          <div key={w.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-gray-50/50">
                            <div className="flex items-center gap-2 min-w-0">
                              {w.status === 'presente'
                                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                : <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                              <p className="text-sm truncate">{w.eventoTitulo || 'Evento sem título'}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              {w.eventDate && <span className="text-xs text-muted-foreground">{new Date(w.eventDate).toLocaleDateString('pt-BR')}</span>}
                              <Badge variant={w.status === 'presente' ? 'default' : 'secondary'} className="text-xs">
                                {w.status === 'presente' ? 'Presente' : 'Ausente'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                };

                return (
                  <div className="space-y-4">
                    {/* Ciclo Atual */}
                    <Card className="overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                        <h3 className="text-base font-bold flex items-center gap-2">
                          <Play className="h-5 w-5" />
                          Webinares {dataReset ? '— Ciclo Atual' : ''}
                        </h3>
                        <p className="text-white/80 text-xs mt-1">
                          {dataReset
                            ? `A partir de ${dataReset.toLocaleDateString('pt-BR')} (pós-reset)`
                            : `${webinaresCicloAtual.filter((w: any) => w.status === 'presente').length} presença(s) de ${webinaresCicloAtual.length} evento(s)`}
                        </p>
                      </div>
                      <CardContent className="pt-4">
                        {webinaresCicloAtual.length > 0
                          ? renderListaWebinares(webinaresCicloAtual, 'bg-blue-50', resumoPlano.metas?.webinarsMinimos)
                          : <p className="text-sm text-muted-foreground text-center py-4">Nenhum webinar registrado neste ciclo ainda.</p>
                        }
                      </CardContent>
                    </Card>

                    {/* Histórico (pré-reset) */}
                    {dataReset && webinaresHistorico.length > 0 && (
                      <details className="group">
                        <summary className="cursor-pointer list-none">
                          <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <History className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Webinares — Ciclos Anteriores ({webinaresHistorico.length} evento{webinaresHistorico.length !== 1 ? 's' : ''})
                            </span>
                            <ChevronDown className="h-4 w-4 text-gray-400 ml-auto group-open:hidden" />
                            <ChevronUp className="h-4 w-4 text-gray-400 ml-auto hidden group-open:block" />
                          </div>
                        </summary>
                        <div className="mt-2">
                          <Card className="overflow-hidden opacity-80">
                            <div className="bg-gray-400 p-4 text-white">
                              <h3 className="text-base font-bold flex items-center gap-2">
                                <History className="h-5 w-5" /> Webinares — Histórico (pré-reset)
                              </h3>
                              <p className="text-white/80 text-xs mt-1">
                                Antes de {dataReset.toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <CardContent className="pt-4">
                              {renderListaWebinares(webinaresHistorico, 'bg-gray-50')}
                            </CardContent>
                          </Card>
                        </div>
                      </details>
                    )}
                  </div>
                );
              })()}

              {/* ===== SEÇÃO 13: TAREFAS DO ALUNO ===== */}
              {resumoPlano?.todasSessoes && resumoPlano.todasSessoes.length > 0 && (() => {
                const sessoesComTarefa = resumoPlano.todasSessoes.filter((s: any) =>
                  s.taskMode && s.taskMode !== 'sem_tarefa' && (s.tarefaNome || s.customTaskTitle)
                );
                if (sessoesComTarefa.length === 0) return null;
                const entregues = sessoesComTarefa.filter((s: any) => s.taskStatus === 'entregue' || s.taskStatus === 'validada');
                const pendentes = sessoesComTarefa.filter((s: any) => s.taskStatus !== 'entregue' && s.taskStatus !== 'validada');
                return (
                  <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white">
                      <h3 className="text-base font-bold flex items-center gap-2">
                        <ListChecks className="h-5 w-5" /> Tarefas Práticas
                      </h3>
                      <p className="text-white/80 text-xs mt-1">
                        {entregues.length} entregue{entregues.length !== 1 ? 's' : ''} de {sessoesComTarefa.length} tarefa{sessoesComTarefa.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-4 mb-3 p-3 bg-amber-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-amber-700">{sessoesComTarefa.length}</p>
                          <p className="text-xs text-amber-600">Total</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-emerald-700">{entregues.length}</p>
                          <p className="text-xs text-emerald-600">Entregues</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-500">{pendentes.length}</p>
                          <p className="text-xs text-red-500">Pendentes</p>
                        </div>
                        {resumoPlano.metas?.tarefasMinimas && (
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-700">
                              {Math.round((entregues.length / resumoPlano.metas.tarefasMinimas) * 100)}%
                            </p>
                            <p className="text-xs text-blue-600">da meta ({resumoPlano.metas.tarefasMinimas})</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5 max-h-64 overflow-y-auto">
                        {sessoesComTarefa.map((s: any) => {
                          const nome = s.customTaskTitle || s.tarefaNome || 'Tarefa sem título';
                          const isEntregue = s.taskStatus === 'entregue' || s.taskStatus === 'validada';
                          return (
                            <div key={s.sessaoId} className="flex items-center justify-between p-2.5 rounded-lg border bg-gray-50/50">
                              <div className="flex items-center gap-2 min-w-0">
                                {isEntregue
                                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                  : <Clock className="h-4 w-4 text-amber-500 shrink-0" />}
                                <div className="min-w-0">
                                  <p className="text-sm truncate">{nome}</p>
                                  {s.tarefaCompetencia && <p className="text-xs text-muted-foreground">{s.tarefaCompetencia}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                {s.sessionDate && <span className="text-xs text-muted-foreground">{new Date(s.sessionDate).toLocaleDateString('pt-BR')}</span>}
                                <Badge variant={isEntregue ? 'default' : 'secondary'} className="text-xs">
                                  {s.taskStatus === 'validada' ? 'Validada' : s.taskStatus === 'entregue' ? 'Entregue' : 'Pendente'}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* ===== SEÇÃO 14: METAS DESAFIO ===== */}
              {resumoPlano?.metasDesafio && resumoPlano.metasDesafio.length > 0 && (() => {
                // Agrupar por competência
                const porComp: Record<string, any[]> = {};
                resumoPlano.metasDesafio.forEach((m: any) => {
                  const k = m.competenciaNome || 'Sem competência';
                  if (!porComp[k]) porComp[k] = [];
                  porComp[k].push(m);
                });
                // Contar apenas micrometas (numeradas) para o resumo
                const todasMicro = resumoPlano.metasDesafio.filter((m: any) => /^\d+\./.test(m.titulo.trim()));
                const microCumpridas = todasMicro.filter((m: any) => m.ultimoStatus === 'cumprida');
                const totalComps = Object.keys(porComp).length;
                return (
                  <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-4 text-white">
                      <h3 className="text-base font-bold flex items-center gap-2">
                        <Flag className="h-5 w-5" /> Metas de Desenvolvimento
                      </h3>
                      <p className="text-white/80 text-xs mt-1">
                        {totalComps} competência{totalComps !== 1 ? 's' : ''} • {microCumpridas.length}/{todasMicro.length} micrometa{todasMicro.length !== 1 ? 's' : ''} cumprida{microCumpridas.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        {Object.entries(porComp).map(([comp, metas]: [string, any[]]) => {
                          const macro = metas.find((m: any) => !/^\d+\./.test(m.titulo.trim()));
                          const micros = metas.filter((m: any) => /^\d+\./.test(m.titulo.trim()));
                          const microsCumpridas = micros.filter((m: any) => m.ultimoStatus === 'cumprida').length;
                          return (
                          <div key={comp} className="border rounded-lg overflow-hidden">
                            <div className="flex items-center gap-2 p-3 bg-rose-50/50">
                              <Target className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                              <h4 className="font-semibold text-xs text-gray-700 uppercase tracking-wide flex-1">{comp}</h4>
                              {micros.length > 0 && <Badge variant="outline" className="text-xs">{microsCumpridas}/{micros.length} micrometas</Badge>}
                            </div>
                            {/* Objetivo Principal (macro) */}
                            {macro && (
                              <div className="mx-3 mb-2 mt-1 rounded-lg border-l-4 border-rose-400 bg-rose-50/60 p-2.5">
                                <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-0.5">Objetivo Principal</p>
                                <p className="text-sm font-medium">{macro.titulo}</p>
                                {macro.descricao && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{macro.descricao}</p>}
                              </div>
                            )}
                            {/* Micrometas */}
                            {micros.length > 0 && (
                              <div className="mx-3 mb-3 space-y-1.5">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Micrometas</p>
                                {micros.map((m: any) => (
                                  <div key={m.id} className="flex items-start justify-between p-2 rounded-lg border bg-gray-50/50">
                                    <div className="flex items-start gap-2 min-w-0">
                                      {m.ultimoStatus === 'cumprida'
                                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        : m.ultimoStatus === 'nao_cumprida'
                                          ? <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                                          : m.ultimoStatus === 'parcial'
                                            ? <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                            : <Circle className="h-3.5 w-3.5 text-gray-300 shrink-0 mt-0.5" />}
                                      <p className="text-sm">{m.titulo}</p>
                                    </div>
                                    {m.ultimoStatus && (
                                      <Badge
                                        className={`text-xs shrink-0 ml-2 ${
                                          m.ultimoStatus === 'cumprida' ? 'bg-emerald-100 text-emerald-700'
                                          : m.ultimoStatus === 'nao_cumprida' ? 'bg-red-100 text-red-700'
                                          : 'bg-amber-100 text-amber-700'
                                        }`}
                                      >
                                        {m.ultimoStatus === 'cumprida' ? 'Cumprida'
                                          : m.ultimoStatus === 'nao_cumprida' ? 'Não cumprida'
                                          : 'Parcial'}
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* ===== SEÇÃO 15: OBSERVAÇÕES DO MENTOR ===== */}
              {resumoPlano?.assessment?.observacoes && (
                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base text-muted-foreground">Observações do Mentor</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{resumoPlano.assessment.observacoes}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== DIALOGS ===== */}

      {/* Dialog: Contrato */}
      <Dialog open={showContratoDialog} onOpenChange={(open) => { if (!open) resetContratoForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingContrato ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
            <DialogDescription>Registre o período e sessões contratadas</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Data Início *</Label><Input type="date" value={contratoInicio} onChange={e => setContratoInicio(e.target.value)} /></div>
              <div><Label className="text-xs">Data Fim *</Label><Input type="date" value={contratoFim} onChange={e => setContratoFim(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Sessões Contratadas</Label><Input type="number" min="1" placeholder="Ex: 12" value={contratoSessoes} onChange={e => setContratoSessoes(e.target.value)} /></div>

            </div>
            <div><Label className="text-xs">Observações</Label><Textarea placeholder="Observações..." value={contratoObs} onChange={e => setContratoObs(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetContratoForm}>Cancelar</Button>
            <Button onClick={handleSaveContrato} disabled={criarContratoMutation.isPending || atualizarContratoMutation.isPending}>
              {criarContratoMutation.isPending || atualizarContratoMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Adicionar Meta */}
      <Dialog open={showAddMetaDialog} onOpenChange={(open) => { if (!open) { setShowAddMetaDialog(false); resetMetaForm(); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Flag className="h-5 w-5 text-primary" />Nova Meta</DialogTitle>
            <DialogDescription>Defina um desafio de desenvolvimento para esta competência.</DialogDescription>
          </DialogHeader>
          {(() => {
            const comp = metasByCompetencia.find(c => c.competenciaId === addMetaCompId);
            return comp ? (
              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <Target className="h-5 w-5 text-primary shrink-0" />
                <div><p className="text-xs text-muted-foreground">Competência</p><p className="font-semibold text-primary text-sm">{comp.competenciaNome}</p></div>
              </div>
            ) : null;
          })()}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button variant={!metaFromLibrary ? "default" : "outline"} size="sm" onClick={() => { setMetaFromLibrary(false); setSelectedTaskLibraryId(null); }} className="gap-1.5">
                <Edit3 className="h-4 w-4" />Personalizada
              </Button>
              <Button variant={metaFromLibrary ? "default" : "outline"} size="sm" onClick={() => setMetaFromLibrary(true)} className="gap-1.5">
                <Library className="h-4 w-4" />Biblioteca
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const comp = metasByCompetencia.find(c => c.competenciaId === addMetaCompId);
                if (!comp) { toast.error("Selecione uma competência"); return; }
                sugerirIAMutation.mutate({ competencia: comp.competenciaNome, alunoNome: selectedAlunoData?.name || undefined });
              }} disabled={sugerirIAMutation.isPending} className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50">
                {sugerirIAMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Sugerir com IA
              </Button>
            </div>
            {sugerirIAMutation.data && !metaFromLibrary && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-amber-700"><Sparkles className="h-4 w-4" /><span className="text-xs font-semibold">Sugestão da IA</span></div>
                <p className="text-sm font-medium">{sugerirIAMutation.data.titulo}</p>
                <p className="text-xs text-muted-foreground">{sugerirIAMutation.data.descricao}</p>
                <Button variant="outline" size="sm" onClick={() => { setMetaTitulo(sugerirIAMutation.data!.titulo); setMetaDescricao(sugerirIAMutation.data!.descricao); toast.success("Sugestão aplicada!"); }} className="w-full gap-1.5 mt-1">
                  <CheckCircle2 className="h-4 w-4" />Usar esta sugestão
                </Button>
              </div>
            )}
            {metaFromLibrary ? (
              <>
                <div>
                  <Label className="mb-1 block">Selecionar da Biblioteca</Label>
                  <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {(filteredLibrary.length > 0 ? filteredLibrary : allLibraryItems).map((t: any) => (
                      <button key={t.id} onClick={() => { setSelectedTaskLibraryId(t.id); setMetaTitulo(t.nome); }}
                        className={`w-full p-3 text-left hover:bg-accent/50 transition-colors ${selectedTaskLibraryId === t.id ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}>
                        <p className="text-sm font-medium">{t.nome}</p>
                        {t.resumo && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.resumo}</p>}
                        <Badge variant="secondary" className="text-xs mt-1">{t.competencia}</Badge>
                      </button>
                    ))}
                    {filteredLibrary.length === 0 && allLibraryItems.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma ação na biblioteca</div>}
                  </div>
                </div>
                <div><Label className="mb-1 block">Observação (opcional)</Label><Textarea placeholder="Detalhes específicos..." value={metaDescricao} onChange={(e) => setMetaDescricao(e.target.value)} rows={2} /></div>
              </>
            ) : (
              <>
                <div><Label className="mb-1 block">Título da Meta *</Label><Input placeholder="Ex: Fazer uma palestra para mais de 50 pessoas" value={metaTitulo} onChange={(e) => setMetaTitulo(e.target.value)} /></div>
                <div><Label className="mb-1 block">Descrição (opcional)</Label><Textarea placeholder="Descreva os detalhes..." value={metaDescricao} onChange={(e) => setMetaDescricao(e.target.value)} rows={3} /></div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddMetaDialog(false); resetMetaForm(); }}>Cancelar</Button>
            <Button onClick={handleSubmitMeta} disabled={criarMeta.isPending || (!metaTitulo.trim() && !selectedTaskLibraryId)}>
              {criarMeta.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Criar Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Acompanhamento Mensal */}
      <Dialog open={showAcompDialog} onOpenChange={setShowAcompDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Acompanhamento Mensal</DialogTitle>
            <DialogDescription>{acompMetaTitulo}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="mb-1 block text-xs">Mês</Label>
                <Select value={String(acompMes)} onValueChange={(v) => setAcompMes(parseInt(v))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{meses.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="w-28">
                <Label className="mb-1 block text-xs">Ano</Label>
                <Select value={String(acompAno)} onValueChange={(v) => setAcompAno(parseInt(v))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-2 block text-xs">Status</Label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setAcompStatus("cumprida")} className={`p-3 rounded-lg border-2 text-center transition-all ${acompStatus === "cumprida" ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-300"}`}>
                  <CheckCircle2 className={`h-5 w-5 mx-auto mb-1 ${acompStatus === "cumprida" ? "text-emerald-600" : "text-muted-foreground"}`} />
                  <p className="text-xs font-medium">Cumprida</p>
                </button>
                <button onClick={() => setAcompStatus("parcial")} className={`p-3 rounded-lg border-2 text-center transition-all ${acompStatus === "parcial" ? "border-amber-500 bg-amber-50" : "border-border hover:border-amber-300"}`}>
                  <Clock className={`h-5 w-5 mx-auto mb-1 ${acompStatus === "parcial" ? "text-amber-600" : "text-muted-foreground"}`} />
                  <p className="text-xs font-medium">Parcial</p>
                </button>
                <button onClick={() => setAcompStatus("nao_cumprida")} className={`p-3 rounded-lg border-2 text-center transition-all ${acompStatus === "nao_cumprida" ? "border-red-500 bg-red-50" : "border-border hover:border-red-300"}`}>
                  <XCircle className={`h-5 w-5 mx-auto mb-1 ${acompStatus === "nao_cumprida" ? "text-red-600" : "text-muted-foreground"}`} />
                  <p className="text-xs font-medium">Não cumprida</p>
                </button>
              </div>
            </div>
            <div><Label className="mb-1 block text-xs">Observação (opcional)</Label><Textarea placeholder="Comentários sobre o progresso..." value={acompObs} onChange={(e) => setAcompObs(e.target.value)} rows={2} /></div>
            {acompanhamentos.length > 0 && (
              <div>
                <Label className="mb-2 block text-xs">Histórico</Label>
                <div className="max-h-32 overflow-y-auto border rounded-lg divide-y">
                  {acompanhamentos.map((a: any) => (
                    <div key={a.id} className="p-2 flex items-center gap-2">
                      {getMetaStatusIcon(a.status)}
                      <span className="text-xs font-medium">{meses[a.mes - 1]} {a.ano}</span>
                      <Badge className={`text-xs ${getMetaStatusColor(a.status)}`}>{getMetaStatusLabel(a.status)}</Badge>
                      {a.observacao && <span className="text-xs text-muted-foreground truncate flex-1">{a.observacao}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcompDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmitAcomp} disabled={registrarAcomp.isPending}>
              {registrarAcomp.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== NOVO ASSESSMENT WIZARD DIALOG ===== */}
      <Dialog open={showNovoAssessment} onOpenChange={(open) => { if (!open) resetNovoAssessmentForm(); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              {novoStep === 1 ? "Novo Assessment — Configuração" : "Novo Assessment — Competências"}
            </DialogTitle>
            <DialogDescription>
              {novoStep === 1
                ? `Defina a trilha, mentora e período da Macro Jornada para ${selectedAlunoData?.name || "o aluno"}`
                : `Selecione e configure as competências para a trilha ${trilhas?.find(t => t.id === parseInt(novoTrilhaId))?.name || ""}`
              }
            </DialogDescription>
          </DialogHeader>

          {novoStep === 1 ? (
            <div className="space-y-4 py-2">
              {/* Trilha */}
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Trilha *</Label>
                <Select value={novoTrilhaId} onValueChange={setNovoTrilhaId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a trilha" /></SelectTrigger>
                  <SelectContent>
                    {trilhas?.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Mentora */}
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Mentora Responsável</Label>
                <Select value={novoConsultorId} onValueChange={setNovoConsultorId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a mentora" /></SelectTrigger>
                  <SelectContent>
                    {(mentores || []).map((m: any) => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Macro Jornada */}
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Macro Jornada (Duração da Trilha) *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Início</Label>
                    <Input type="date" value={novoMacroInicio} onChange={(e) => setNovoMacroInicio(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Término</Label>
                    <Input type="date" value={novoMacroTermino} onChange={(e) => setNovoMacroTermino(e.target.value)} />
                  </div>
                </div>
              </div>
              {/* Campo Total Sessões removido - definido pelo admin no contrato */}
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {/* Bulk actions */}
              <div className="flex items-center gap-2 mb-2">
                <Button variant="outline" size="sm" onClick={() => setNovoCompConfig(prev => prev.map(c => ({ ...c, selected: true })))}>
                  Selecionar Todas
                </Button>
                <Button variant="outline" size="sm" onClick={() => setNovoCompConfig(prev => prev.map(c => ({ ...c, selected: false })))}>
                  Desmarcar Todas
                </Button>
                <span className="text-xs text-muted-foreground ml-auto">
                  {novoCompConfig.filter(c => c.selected).length} de {novoCompConfig.length} selecionadas
                </span>
              </div>
              {novoCompConfig.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma competência encontrada para esta trilha</p>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {novoCompConfig.map((comp, idx) => (
                    <div key={comp.competenciaId} className={`border rounded-lg p-3 transition-colors ${
                      comp.selected ? "bg-primary/5 border-primary/20" : "opacity-60"
                    }`}>
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={comp.selected}
                          onCheckedChange={(checked) => {
                            setNovoCompConfig(prev => prev.map((c, i) => i === idx ? { ...c, selected: !!checked } : c));
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{comp.nome}</p>
                        </div>
                        <Select
                          value={comp.peso}
                          onValueChange={(val) => setNovoCompConfig(prev => prev.map((c, i) => i === idx ? { ...c, peso: val as any } : c))}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContentNoPortal>
                            <SelectItem value="obrigatoria">Obrigatória</SelectItem>
                            <SelectItem value="opcional">Opcional</SelectItem>
                          </SelectContentNoPortal>
                        </Select>
                      </div>
                      {comp.selected && (
                        <div className="grid grid-cols-3 gap-2 mt-2 pl-8">
                          <div>
                            <Label className="text-xs text-muted-foreground">Nota de Corte (%)</Label>
                            <Input className="h-8 text-xs" type="number" min="0" max="100" value={comp.notaCorte}
                              onChange={(e) => setNovoCompConfig(prev => prev.map((c, i) => i === idx ? { ...c, notaCorte: e.target.value } : c))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Micro Início</Label>
                            <Input className="h-8 text-xs" type="date" value={comp.microInicio}
                              onChange={(e) => setNovoCompConfig(prev => prev.map((c, i) => i === idx ? { ...c, microInicio: e.target.value } : c))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Micro Término</Label>
                            <Input className="h-8 text-xs" type="date" value={comp.microTermino}
                              onChange={(e) => setNovoCompConfig(prev => prev.map((c, i) => i === idx ? { ...c, microTermino: e.target.value } : c))}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between">
            {novoStep === 2 && (
              <Button variant="outline" onClick={() => setNovoStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={resetNovoAssessmentForm}>Cancelar</Button>
              {novoStep === 1 ? (
                <Button
                  onClick={() => {
                    if (!novoTrilhaId) { toast.error("Selecione uma trilha"); return; }
                    if (!novoMacroInicio || !novoMacroTermino) { toast.error("Defina as datas da Macro Jornada"); return; }
                    setNovoStep(2);
                  }}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  Próximo: Competências <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitNovoAssessment}
                  disabled={criarAssessmentMutation.isPending}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  {criarAssessmentMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Criar Assessment</>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EditAssessmentDialog */}
      {editAssessment && (
        <EditAssessmentDialog
          open={!!editAssessment}
          onClose={() => { setEditAssessment(null); refetchAssessments(); }}
          pdi={editAssessment}
          trilhas={trilhas || []}
          programs={programs || []}
          mentores={mentores || []}
          isAdmin={isAdmin}
          onSuccess={() => { setEditAssessment(null); refetchAssessments(); refetchPlano(); refetchMetas(); }}
        />
      )}
    </div>
  );
}
