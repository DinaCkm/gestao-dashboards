import { useState, useMemo, useEffect } from "react";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Flag, Plus, Target, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronRight, Search, User, BookOpen,
  Trash2, Edit3, MessageSquare, Calendar, TrendingUp,
  AlertCircle, Loader2, Library
} from "lucide-react";

// ============================================================
// HELPERS
// ============================================================
function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function getStatusColor(status: string) {
  switch (status) {
    case "cumprida": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "nao_cumprida": return "bg-red-100 text-red-700 border-red-200";
    case "parcial": return "bg-amber-100 text-amber-700 border-amber-200";
    default: return "bg-gray-100 text-gray-500 border-gray-200";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "cumprida": return "Cumprida";
    case "nao_cumprida": return "Não cumprida";
    case "parcial": return "Parcial";
    default: return "Pendente";
  }
}

function getStatusIcon(status: string) {
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
    const id = params.get('alunoId');
    return id ? parseInt(id) : null;
  }, []);

  // States
  const [selectedProgramId, setSelectedProgramId] = useState<string>("all");
  const [selectedAlunoId, setSelectedAlunoId] = useState<number | null>(urlAlunoId);
  const [expandedCompId, setExpandedCompId] = useState<number | null>(null);
  const [showAddMetaDialog, setShowAddMetaDialog] = useState(false);
  const [addMetaCompId, setAddMetaCompId] = useState<number | null>(null);
  const [addMetaAssCompId, setAddMetaAssCompId] = useState<number | null>(null);
  const [addMetaPdiId, setAddMetaPdiId] = useState<number | null>(null);
  const [showAcompDialog, setShowAcompDialog] = useState(false);
  const [acompMetaId, setAcompMetaId] = useState<number | null>(null);
  const [acompMetaTitulo, setAcompMetaTitulo] = useState("");
  const [searchAluno, setSearchAluno] = useState("");

  // New meta form
  const [metaTitulo, setMetaTitulo] = useState("");
  const [metaDescricao, setMetaDescricao] = useState("");
  const [metaFromLibrary, setMetaFromLibrary] = useState(false);
  const [selectedTaskLibraryId, setSelectedTaskLibraryId] = useState<number | null>(null);

  // Acompanhamento form
  const [acompMes, setAcompMes] = useState(new Date().getMonth() + 1);
  const [acompAno, setAcompAno] = useState(new Date().getFullYear());
  const [acompStatus, setAcompStatus] = useState<"cumprida" | "nao_cumprida" | "parcial">("nao_cumprida");
  const [acompObs, setAcompObs] = useState("");

  // Data queries
  const { data: allPrograms = [] } = trpc.programs.list.useQuery(undefined, { enabled: isAdmin });
  const { data: mentorPrograms = [] } = trpc.alunos.programsByConsultor.useQuery(
    { consultorId: userConsultorId! },
    { enabled: isMentor }
  );
  const programs = isAdmin ? allPrograms : mentorPrograms;

  // Admin: todos os alunos
  const { data: adminAlunos = [] } = trpc.alunos.list.useQuery(
    selectedProgramId !== "all" ? { programId: parseInt(selectedProgramId) } : undefined,
    { enabled: isAdmin }
  );
  // Mentor: alunos vinculados ao consultor
  const { data: mentorAlunos = [] } = trpc.alunos.byConsultor.useQuery(
    { consultorId: userConsultorId!, programId: selectedProgramId !== "all" ? parseInt(selectedProgramId) : undefined },
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

  const { data: metasDetalhadas = [], refetch: refetchMetas } = trpc.metas.listar.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );

  const { data: metasResumo, refetch: refetchResumo } = trpc.metas.resumo.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );

  const { data: acompanhamentos = [], refetch: refetchAcomp } = trpc.metas.acompanhamentos.useQuery(
    { alunoId: selectedAlunoId!, metaId: acompMetaId ?? undefined },
    { enabled: !!selectedAlunoId && !!acompMetaId }
  );

  const { data: taskLibrary = [] } = trpc.metas.biblioteca.useQuery(undefined, {
    enabled: showAddMetaDialog
  });

  // Mutations
  const criarMeta = trpc.metas.criar.useMutation({
    onSuccess: () => {
      toast.success("Meta criada com sucesso!");
      refetchMetas();
      refetchResumo();
      setShowAddMetaDialog(false);
      resetMetaForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const removerMeta = trpc.metas.remover.useMutation({
    onSuccess: () => {
      toast.success("Meta removida.");
      refetchMetas();
      refetchResumo();
    },
    onError: (err) => toast.error(err.message),
  });

  const registrarAcomp = trpc.metas.registrarAcompanhamento.useMutation({
    onSuccess: () => {
      toast.success("Acompanhamento registrado!");
      refetchAcomp();
      refetchMetas();
      refetchResumo();
      setShowAcompDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  // Filtered alunos
  const filteredAlunos = useMemo(() => {
    if (!searchAluno) return alunos;
    const s = searchAluno.toLowerCase();
    return alunos.filter((a: any) => a.name?.toLowerCase().includes(s) || a.email?.toLowerCase().includes(s));
  }, [alunos, searchAluno]);

  const selectedAluno = useMemo(() => alunos.find((a: any) => a.id === selectedAlunoId), [alunos, selectedAlunoId]);

  // Group metas by competencia
  const metasByCompetencia = useMemo(() => {
    const map = new Map<number, { competenciaId: number; competenciaNome: string; assessmentCompetenciaId: number; assessmentPdiId: number; metas: typeof metasDetalhadas }>();
    
    // First, add all competencias from assessments (even those without metas)
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
          metas: [meta]
        });
      }
    }

    return Array.from(map.values());
  }, [assessments, metasDetalhadas]);

  // Filter task library by competencia name
  const filteredLibrary = useMemo(() => {
    if (!addMetaCompId) return taskLibrary;
    const comp = metasByCompetencia.find(c => c.competenciaId === addMetaCompId);
    if (!comp) return taskLibrary;
    // Try to match by competencia name
    return taskLibrary.filter((t: any) => 
      t.competencia.toLowerCase().includes(comp.competenciaNome.toLowerCase()) ||
      comp.competenciaNome.toLowerCase().includes(t.competencia.toLowerCase())
    );
  }, [taskLibrary, addMetaCompId, metasByCompetencia]);

  const allLibraryItems = taskLibrary;

  function resetMetaForm() {
    setMetaTitulo("");
    setMetaDescricao("");
    setMetaFromLibrary(false);
    setSelectedTaskLibraryId(null);
    setAddMetaCompId(null);
    setAddMetaAssCompId(null);
    setAddMetaPdiId(null);
  }

  function handleAddMeta(compId: number, assCompId: number, pdiId: number) {
    setAddMetaCompId(compId);
    setAddMetaAssCompId(assCompId);
    setAddMetaPdiId(pdiId);
    setShowAddMetaDialog(true);
  }

  function handleSubmitMeta() {
    if (!selectedAlunoId || !addMetaCompId || !addMetaAssCompId || !addMetaPdiId) return;
    
    const titulo = metaFromLibrary && selectedTaskLibraryId
      ? taskLibrary.find((t: any) => t.id === selectedTaskLibraryId)?.nome || metaTitulo
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

  function handleOpenAcomp(metaId: number, metaTitulo: string) {
    setAcompMetaId(metaId);
    setAcompMetaTitulo(metaTitulo);
    setAcompMes(new Date().getMonth() + 1);
    setAcompAno(new Date().getFullYear());
    setAcompStatus("nao_cumprida");
    setAcompObs("");
    setShowAcompDialog(true);
  }

  function handleSubmitAcomp() {
    if (!acompMetaId || !selectedAlunoId) return;
    registrarAcomp.mutate({
      metaId: acompMetaId,
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
            Defina e acompanhe metas concretas para cada competência do aluno
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Programa */}
            <div className="w-full md:w-64">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Programa</label>
              <Select value={selectedProgramId} onValueChange={(v) => { setSelectedProgramId(v); setSelectedAlunoId(null); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos os programas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os programas</SelectItem>
                  {programs.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Busca aluno */}
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Aluno</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno por nome ou email..."
                  value={searchAluno}
                  onChange={(e) => setSearchAluno(e.target.value)}
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
                    onClick={() => { setSelectedAlunoId(a.id); setSearchAluno(""); }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.email}</p>
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
                <p className="text-xs text-muted-foreground">{(selectedAluno as any).email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setSelectedAlunoId(null); setExpandedCompId(null); }}>
                Trocar aluno
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
              <p className="text-2xl font-bold text-emerald-600">{metasResumo.cumpridas}</p>
              <p className="text-xs text-muted-foreground">Cumpridas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{metasResumo.total - metasResumo.cumpridas}</p>
              <p className="text-xs text-muted-foreground">Não Cumpridas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <p className="text-2xl font-bold text-primary">{metasResumo.percentual}%</p>
              </div>
              <p className="text-xs text-muted-foreground">Atingimento</p>
              <Progress value={metasResumo.percentual} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Competências e Metas */}
      {selectedAlunoId && (
        <div className="space-y-3">
          {assessments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Nenhum Assessment encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  O aluno precisa ter um Assessment/PDI definido antes de criar metas.
                </p>
              </CardContent>
            </Card>
          ) : metasByCompetencia.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Nenhuma competência encontrada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Defina competências no Assessment/PDI para criar metas.
                </p>
              </CardContent>
            </Card>
          ) : (
            metasByCompetencia.map((comp) => {
              const isExpanded = expandedCompId === comp.competenciaId;
              const totalMetas = comp.metas.length;
              const cumpridas = comp.metas.filter((m: any) => m.ultimoStatus === "cumprida").length;
              const pctComp = totalMetas > 0 ? Math.round((cumpridas / totalMetas) * 100) : 0;

              return (
                <Card key={comp.competenciaId} className="overflow-hidden">
                  {/* Competência Header */}
                  <button
                    onClick={() => setExpandedCompId(isExpanded ? null : comp.competenciaId)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors text-left"
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{comp.competenciaNome}</p>
                        <Badge variant="outline" className="text-xs">
                          {totalMetas} meta{totalMetas !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      {totalMetas > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={pctComp} className="h-1.5 flex-1 max-w-32" />
                          <span className="text-xs text-muted-foreground">{pctComp}% atingido</span>
                        </div>
                      )}
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </button>

                  {/* Metas expandidas */}
                  {isExpanded && (
                    <div className="border-t bg-muted/20">
                      {comp.metas.length === 0 ? (
                        <div className="p-6 text-center">
                          <Flag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Nenhuma meta definida para esta competência</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {comp.metas.map((meta: any) => (
                            <div key={meta.id} className="p-4 flex items-start gap-3">
                              <div className="mt-0.5">
                                {getStatusIcon(meta.ultimoStatus || "")}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium">{meta.titulo}</p>
                                  {meta.taskLibraryId && (
                                    <Badge variant="secondary" className="text-xs gap-1">
                                      <Library className="h-3 w-3" />
                                      Biblioteca
                                    </Badge>
                                  )}
                                </div>
                                {meta.descricao && (
                                  <p className="text-xs text-muted-foreground mt-1">{meta.descricao}</p>
                                )}
                                {meta.ultimoStatus && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge className={`text-xs ${getStatusColor(meta.ultimoStatus)}`}>
                                      {getStatusLabel(meta.ultimoStatus)}
                                    </Badge>
                                    {meta.ultimoMes && meta.ultimoAno && (
                                      <span className="text-xs text-muted-foreground">
                                        {meses[(meta.ultimoMes as number) - 1]} {meta.ultimoAno}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Registrar acompanhamento"
                                  onClick={() => handleOpenAcomp(meta.id, meta.titulo)}
                                >
                                  <Calendar className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                  title="Remover meta"
                                  onClick={() => {
                                    if (confirm("Remover esta meta?")) {
                                      removerMeta.mutate({ id: meta.id });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Botão adicionar meta */}
                      <div className="p-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => handleAddMeta(comp.competenciaId, comp.assessmentCompetenciaId, comp.assessmentPdiId)}
                        >
                          <Plus className="h-4 w-4" />
                          Adicionar Meta
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Dialog: Adicionar Meta */}
      <Dialog open={showAddMetaDialog} onOpenChange={(open) => { if (!open) { setShowAddMetaDialog(false); resetMetaForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" />
              Nova Meta
            </DialogTitle>
            <DialogDescription>
              Defina uma meta concreta para o desenvolvimento desta competência
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Escolher fonte */}
            <div className="flex gap-2">
              <Button
                variant={!metaFromLibrary ? "default" : "outline"}
                size="sm"
                onClick={() => { setMetaFromLibrary(false); setSelectedTaskLibraryId(null); }}
                className="flex-1 gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Meta Personalizada
              </Button>
              <Button
                variant={metaFromLibrary ? "default" : "outline"}
                size="sm"
                onClick={() => setMetaFromLibrary(true)}
                className="flex-1 gap-2"
              >
                <Library className="h-4 w-4" />
                Da Biblioteca
              </Button>
            </div>

            {metaFromLibrary ? (
              <>
                {/* Seleção da biblioteca */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Selecionar da Biblioteca de Ações</label>
                  {filteredLibrary.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {filteredLibrary.length} ação(ões) relacionada(s) à competência
                    </p>
                  )}
                  <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {(filteredLibrary.length > 0 ? filteredLibrary : allLibraryItems).map((t: any) => (
                      <button
                        key={t.id}
                        onClick={() => { setSelectedTaskLibraryId(t.id); setMetaTitulo(t.nome); }}
                        className={`w-full p-3 text-left hover:bg-accent/50 transition-colors ${selectedTaskLibraryId === t.id ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
                      >
                        <p className="text-sm font-medium">{t.nome}</p>
                        {t.resumo && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.resumo}</p>}
                        <Badge variant="secondary" className="text-xs mt-1">{t.competencia}</Badge>
                      </button>
                    ))}
                    {filteredLibrary.length === 0 && allLibraryItems.length === 0 && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Nenhuma ação na biblioteca
                      </div>
                    )}
                  </div>
                </div>
                {/* Descrição adicional */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Observação (opcional)</label>
                  <Textarea
                    placeholder="Adicione detalhes específicos para o aluno..."
                    value={metaDescricao}
                    onChange={(e) => setMetaDescricao(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Meta personalizada */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Título da Meta *</label>
                  <Input
                    placeholder="Ex: Fazer uma palestra para mais de 50 pessoas"
                    value={metaTitulo}
                    onChange={(e) => setMetaTitulo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Descrição (opcional)</label>
                  <Textarea
                    placeholder="Descreva os detalhes e critérios de cumprimento..."
                    value={metaDescricao}
                    onChange={(e) => setMetaDescricao(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddMetaDialog(false); resetMetaForm(); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitMeta}
              disabled={criarMeta.isPending || (!metaTitulo.trim() && !selectedTaskLibraryId)}
            >
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
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Acompanhamento Mensal
            </DialogTitle>
            <DialogDescription>
              {acompMetaTitulo}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mês/Ano */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Mês</label>
                <Select value={String(acompMes)} onValueChange={(v) => setAcompMes(parseInt(v))}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-28">
                <label className="text-sm font-medium mb-1 block">Ano</label>
                <Select value={String(acompAno)} onValueChange={(v) => setAcompAno(parseInt(v))}>
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
                  <CheckCircle2 className={`h-5 w-5 mx-auto mb-1 ${acompStatus === "cumprida" ? "text-emerald-600" : "text-muted-foreground"}`} />
                  <p className="text-xs font-medium">Cumprida</p>
                </button>
                <button
                  onClick={() => setAcompStatus("parcial")}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${acompStatus === "parcial" ? "border-amber-500 bg-amber-50" : "border-border hover:border-amber-300"}`}
                >
                  <Clock className={`h-5 w-5 mx-auto mb-1 ${acompStatus === "parcial" ? "text-amber-600" : "text-muted-foreground"}`} />
                  <p className="text-xs font-medium">Parcial</p>
                </button>
                <button
                  onClick={() => setAcompStatus("nao_cumprida")}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${acompStatus === "nao_cumprida" ? "border-red-500 bg-red-50" : "border-border hover:border-red-300"}`}
                >
                  <XCircle className={`h-5 w-5 mx-auto mb-1 ${acompStatus === "nao_cumprida" ? "text-red-600" : "text-muted-foreground"}`} />
                  <p className="text-xs font-medium">Não cumprida</p>
                </button>
              </div>
            </div>

            {/* Observação */}
            <div>
              <label className="text-sm font-medium mb-1 block">Observação (opcional)</label>
              <Textarea
                placeholder="Comentários sobre o progresso..."
                value={acompObs}
                onChange={(e) => setAcompObs(e.target.value)}
                rows={2}
              />
            </div>

            {/* Histórico */}
            {acompanhamentos.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Histórico</label>
                <div className="max-h-32 overflow-y-auto border rounded-lg divide-y">
                  {acompanhamentos.map((a: any) => (
                    <div key={a.id} className="p-2 flex items-center gap-2">
                      {getStatusIcon(a.status)}
                      <span className="text-xs font-medium">{meses[a.mes - 1]} {a.ano}</span>
                      <Badge className={`text-xs ${getStatusColor(a.status)}`}>
                        {getStatusLabel(a.status)}
                      </Badge>
                      {a.observacao && (
                        <span className="text-xs text-muted-foreground truncate flex-1">{a.observacao}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcompDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitAcomp} disabled={registrarAcomp.isPending}>
              {registrarAcomp.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
