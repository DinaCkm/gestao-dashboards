import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatDateSafe } from "@/lib/dateUtils";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectContentNoPortal, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import ContratoInfoReadonly from "@/components/ContratoInfoReadonly";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Plus,
  Eye,
  Lock,
  LockOpen,
  Calendar,
  Target,
  User,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Building2,
  TrendingUp,
  Pencil,
  Save,
  Route,
  Users,
  PlayCircle,
  Video,
  ChevronRight,
  FileText,
  Heart,
  Briefcase,
  Star,
  RotateCcw,
  Trash2,
} from "lucide-react";
import EditAssessmentDialog from "@/components/EditAssessmentDialog";

// ============ Progress Bar Component ============
function ProgressBar({ value, meta, label }: { value: number; meta?: number; label?: string }) {
  const getColor = (v: number) => {
    if (v >= 75) return "bg-emerald-500";
    if (v >= 50) return "bg-amber-500";
    return "bg-red-500";
  };
  const getTextColor = (v: number) => {
    if (v >= 75) return "text-emerald-700";
    if (v >= 50) return "text-amber-700";
    return "text-red-700";
  };

  return (
    <div className="w-full">
      {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all ${getColor(value)}`}
            style={{ width: `${Math.min(value, 100)}%` }}
          />
          {meta !== undefined && meta > 0 && (
            <div
              className="absolute top-0 h-full w-0.5 bg-gray-800"
              style={{ left: `${Math.min(meta, 100)}%` }}
              title={`Meta: ${meta}%`}
            />
          )}
        </div>
        <span className={`text-xs font-bold min-w-[36px] text-right ${getTextColor(value)}`}>
          {value}%
        </span>
      </div>
    </div>
  );
}

export default function Assessment() {
  return (
    <DashboardLayout>
      <AssessmentContent />
    </DashboardLayout>
  );
}

function AssessmentContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const userConsultorId = (user as any)?.consultorId as number | null;

  const [selectedProgramId, setSelectedProgramId] = useState<string>("all");
  const [selectedAlunoId, setSelectedAlunoId] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedPdiId, setExpandedPdiId] = useState<number | null>(null);
  const [trilhasExpanded, setTrilhasExpanded] = useState(false);

  // Data queries
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
  const { data: trilhas = [] } = trpc.trilhas.list.useQuery();
  const { data: mentores = [] } = trpc.mentor.list.useQuery();

  const { data: assessments = [], refetch: refetchAssessments } = trpc.assessment.porAluno.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );

  // Buscar resultado do teste DISC do aluno
  const { data: discResultado, refetch: refetchDisc } = trpc.disc.resultado.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );

  // Buscar autopercepções de competências do aluno
  const { data: autopercepcoesAluno = [] } = trpc.autopercepção.porAluno.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );

  // Buscar lista de competências para nomes
  const { data: competenciasList = [] } = trpc.competencias.list.useQuery();

  // Resumo de metas do aluno (substituiu reavaliação de nível)
  const { data: metasResumo } = trpc.metas.resumo.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );
  const [, setLocation] = useLocation();

  // ---- Reset DISC: diálogo de confirmação ----
  const [resetDiscDialogOpen, setResetDiscDialogOpen] = useState(false);
  const resetDiscMutation = trpc.disc.resetAluno.useMutation({
    onSuccess: (data) => {
      toast.success(`Teste DISC de ${data.alunoNome} foi resetado. O aluno poderá refazer o teste.`);
      setResetDiscDialogOpen(false);
      refetchDisc();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  // ---- Congelar: diálogo de confirmação com motivo obrigatório ----
  const [editPdi, setEditPdi] = useState<any>(null);
  const [congelarDialogOpen, setCongelarDialogOpen] = useState(false);
  const [congelarPdiId, setCongelarPdiId] = useState<number | null>(null);
  const [congelarMotivo, setCongelarMotivo] = useState("");

  const congelarMutation = trpc.assessment.congelar.useMutation({
    onSuccess: () => {
      toast.success("Trilha congelada com sucesso!");
      setCongelarDialogOpen(false);
      setCongelarPdiId(null);
      setCongelarMotivo("");
      refetchAssessments();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const descongelarMutation = trpc.assessment.descongelar.useMutation({
    onSuccess: () => {
      toast.success("Trilha descongelada com sucesso! Os indicadores serão recalculados.");
      refetchAssessments();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const selectedAluno = useMemo(() => alunos.find(a => a.id === selectedAlunoId), [alunos, selectedAlunoId]);
  const alunoProgram = useMemo(() => {
    if (!selectedAluno?.programId) return null;
    return programs.find(p => p.id === selectedAluno.programId);
  }, [selectedAluno, programs]);

  const handleCongelarClick = (pdiId: number) => {
    setCongelarPdiId(pdiId);
    setCongelarMotivo("");
    setCongelarDialogOpen(true);
  };

  const handleCongelarConfirm = () => {
    if (!congelarPdiId) return;
    const consultorId = userConsultorId || (selectedAluno?.consultorId as number);
    if (!consultorId) {
      toast.error("Consultor não identificado");
      return;
    }
    if (!congelarMotivo.trim()) {
      toast.error("Informe o motivo do congelamento");
      return;
    }
    congelarMutation.mutate({ pdiId: congelarPdiId, consultorId, motivo: congelarMotivo.trim() });
  };

  const handleDescongelar = (pdiId: number) => {
    const consultorId = userConsultorId || (selectedAluno?.consultorId as number);
    if (!consultorId) {
      toast.error("Consultor não identificado");
      return;
    }
    descongelarMutation.mutate({ pdiId, consultorId });
  };

  const formatDate = (d: any) => formatDateSafe(d);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-secondary" />
            Assessment / Jornada de Desenvolvimento
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o Plano de Desenvolvimento Individual dos alunos
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
            {isAdmin && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Empresa
                </Label>
                <Select value={selectedProgramId} onValueChange={(v) => { setSelectedProgramId(v); setSelectedAlunoId(null); }}>
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

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Aluno
              </Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none cursor-pointer"
                value={selectedAlunoId ? String(selectedAlunoId) : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedAlunoId(val === "" ? null : parseInt(val));
                }}
              >
                <option value="">Selecione um aluno</option>
                {[...alunos].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(a => (
                  <option key={a.id} value={String(a.id)}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 flex items-end">
              <Button
                onClick={() => selectedAlunoId && setLocation(`/assessment/novo/${selectedAlunoId}`)}
                disabled={!selectedAlunoId}
                className="w-full bg-secondary hover:bg-secondary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Assessment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo de Metas de Desenvolvimento */}
      {selectedAlunoId && metasResumo && metasResumo.total > 0 && (
        <Card className="border-[#0A1E3E]/20 bg-gradient-to-r from-[#0A1E3E]/5 to-transparent border-2">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-[#0A1E3E] mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Metas de Desenvolvimento
                </h4>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-[#0A1E3E]">{metasResumo.total}</span>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-emerald-600">{metasResumo.cumpridas}</span>
                    <p className="text-[10px] text-muted-foreground">Cumpridas</p>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-red-500">{metasResumo.total - metasResumo.cumpridas}</span>
                    <p className="text-[10px] text-muted-foreground">Pendentes</p>
                  </div>
                  <div className="flex-1 max-w-[200px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Atingimento</span>
                      <span className="text-sm font-bold text-[#0A1E3E]">{metasResumo.percentual}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          metasResumo.percentual >= 75 ? 'bg-emerald-500' :
                          metasResumo.percentual >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${metasResumo.percentual}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white flex-shrink-0"
                onClick={() => setLocation(`/metas?alunoId=${selectedAlunoId}`)}
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Ver Metas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {selectedAlunoId && metasResumo && metasResumo.total === 0 && assessments.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 border-2">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-amber-800">Nenhuma Meta Definida</h4>
                <p className="text-sm text-amber-700">
                  Este aluno possui assessment mas ainda não tem metas de desenvolvimento definidas.
                  Defina metas para acompanhar a evolução das competências.
                </p>
              </div>
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0"
                onClick={() => setLocation(`/metas?alunoId=${selectedAlunoId}`)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Definir Metas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== RELATÓRIO COMPLETO DO ALUNO ===== */}
      {selectedAlunoId && selectedAluno && (
        <Card className="border-[#F5991F]/30 bg-gradient-to-br from-[#F5991F]/5 via-transparent to-[#0A1E3E]/5 border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-[#0A1E3E]">
              <FileText className="h-5 w-5" />
              Relatório Completo do Aluno
            </CardTitle>
            <CardDescription>Visão consolidada: DISC, Autopercepção, Minicurrículo e Perfil Pessoal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* 1. DISC */}
            <div className="border rounded-lg p-4 bg-white/60">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-[#0A1E3E] flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#F5991F]" />
                  1. Perfil Comportamental DISC
                </h4>
                {isAdmin && discResultado && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                    onClick={() => setResetDiscDialogOpen(true)}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Solicitar Refazer
                  </Button>
                )}
              </div>
              {discResultado ? (
                <>
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
                        <div className="text-sm font-bold mt-1">{Number(dim.score).toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>
                  {discResultado.perfilPredominante && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#0A1E3E] text-white">
                        Perfil Primário: {discResultado.perfilPredominante}
                      </Badge>
                      {discResultado.perfilSecundario && (
                        <Badge variant="outline" className="border-[#0A1E3E] text-[#0A1E3E]">
                          Secundário: {discResultado.perfilSecundario}
                        </Badge>
                      )}
                    </div>
                  )}
                  {discResultado.indiceConsistencia !== null && discResultado.indiceConsistencia !== undefined && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Índice de consistência: {discResultado.indiceConsistencia}%
                      {discResultado.alertaBaixaDiferenciacao && (
                        <span className="ml-2 text-amber-600 font-medium">
                          ⚠ Baixa diferenciação entre dimensões
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Teste DISC não realizado</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Este aluno ainda não completou o teste de perfil comportamental DISC no Onboarding.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Autopercepção de Competências */}
            <div className="border rounded-lg p-4 bg-white/60">
              <h4 className="font-semibold text-[#0A1E3E] mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-[#F5991F]" />
                2. Autopercepção de Competências (Percepção Pessoal)
              </h4>
              {autopercepcoesAluno.length > 0 ? (() => {
                // Filtrar apenas competências com nota abaixo de 4
                const abaixoDe4 = autopercepcoesAluno.filter((ap: any) => ap.nota < 4);
                
                // Ordem das trilhas: Basic(1) → Essential(2) → Master(3) → Visão de Futuro(4) → demais
                const ordemTrilhas = [1, 2, 3, 4];
                const trilhaOrdemMap = new Map(ordemTrilhas.map((id, idx) => [id, idx]));
                
                // Agrupar por trilha
                const porTrilha = new Map<number, any[]>();
                for (const ap of abaixoDe4) {
                  const tid = ap.trilhaId;
                  if (!porTrilha.has(tid)) porTrilha.set(tid, []);
                  porTrilha.get(tid)!.push(ap);
                }
                
                // Ordenar trilhas pela ordem definida
                const trilhasOrdenadas = Array.from(porTrilha.keys()).sort((a, b) => {
                  const oa = trilhaOrdemMap.get(a) ?? 99;
                  const ob = trilhaOrdemMap.get(b) ?? 99;
                  return oa - ob;
                });
                
                if (abaixoDe4.length === 0) {
                  return (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-emerald-800">Todas as competências com nota 4 ou superior</p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          Este aluno avaliou todas as suas competências com nota 4 ou 5 na autopercepção.
                        </p>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <p className="text-xs text-amber-700">
                        Exibindo apenas competências com autopercepção <strong>abaixo de 4</strong> — pontos de atenção para o desenvolvimento.
                        Total: <strong>{abaixoDe4.length}</strong> competência(s) identificada(s).
                      </p>
                    </div>
                    {trilhasOrdenadas.map(trilhaId => {
                      const trilha = trilhas.find((t: any) => t.id === trilhaId);
                      const trilhaNome = trilha?.name || `Trilha #${trilhaId}`;
                      const aps = porTrilha.get(trilhaId) || [];
                      const trilhaColors: Record<string, string> = {
                        'Basic': 'border-blue-300 bg-blue-50',
                        'Essential': 'border-emerald-300 bg-emerald-50',
                        'Master': 'border-purple-300 bg-purple-50',
                        'Visão de Futuro': 'border-amber-300 bg-amber-50',
                      };
                      const colorClass = trilhaColors[trilhaNome] || 'border-gray-300 bg-gray-50';
                      
                      return (
                        <div key={trilhaId} className={`border rounded-lg p-3 ${colorClass}`}>
                          <h5 className="text-sm font-semibold text-[#0A1E3E] mb-2 flex items-center gap-2">
                            <Route className="h-3.5 w-3.5" />
                            {trilhaNome}
                            <Badge variant="outline" className="text-xs">{aps.length} competência(s)</Badge>
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {aps.map((ap: any) => {
                              const comp = competenciasList.find((c: any) => c.id === ap.competenciaId);
                              return (
                                <div key={ap.id} className="flex items-center justify-between p-2 bg-white/80 rounded-md">
                                  <span className="text-sm text-gray-700">{comp?.nome || `Competência #${ap.competenciaId}`}</span>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map(n => (
                                      <div
                                        key={n}
                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                          n <= ap.nota
                                            ? ap.nota <= 2 ? 'bg-red-500 text-white' : 'bg-[#F5991F] text-white'
                                            : 'bg-gray-200 text-gray-400'
                                        }`}
                                      >
                                        {n}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })() : (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Autopercepção não realizada</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Este aluno ainda não preencheu a autoavaliação de competências no Onboarding.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Minicurrículo */}
            <div className="border rounded-lg p-4 bg-white/60">
              <h4 className="font-semibold text-[#0A1E3E] mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#F5991F]" />
                3. Minicurrículo
              </h4>
              {(selectedAluno as any).minicurriculo ? (
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded-md">
                  {(selectedAluno as any).minicurriculo}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Aluno ainda não preencheu o minicurrículo.</p>
              )}
              {(selectedAluno as any).cargo && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Cargo: {(selectedAluno as any).cargo}
                  </Badge>
                  {(selectedAluno as any).areaAtuacao && (
                    <Badge variant="outline" className="text-xs">
                      Área: {(selectedAluno as any).areaAtuacao}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* 4. Quem é Você */}
            <div className="border rounded-lg p-4 bg-white/60">
              <h4 className="font-semibold text-[#0A1E3E] mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-[#F5991F]" />
                4. Quem é Você?
              </h4>
              {(selectedAluno as any).quemEVoce ? (
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded-md">
                  {(selectedAluno as any).quemEVoce}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Aluno ainda não preencheu o campo "Quem é Você".</p>
              )}
            </div>

          </CardContent>
        </Card>
      )}

      {/* Aluno Info + Assessments */}
      {selectedAlunoId && selectedAluno && (
        <>
          <Card className="border-l-4 border-l-secondary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{selectedAluno.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {alunoProgram?.name || "Sem empresa"} • ID: {selectedAluno.externalId || selectedAluno.id}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {assessments.length} trilha{assessments.length !== 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {assessments.filter(a => a.status === "ativo").length} ativa{assessments.filter(a => a.status === "ativo").length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
              {/* Dados do contrato do aluno - visível para o mentor */}
              <div className="mb-3">
                <ContratoInfoReadonly alunoId={selectedAlunoId} />
              </div>
              {assessments.length > 0 && (() => {
                // Agrupar assessments por turma
                const turmaGroups = new Map<string, any[]>();
                assessments.forEach((a: any) => {
                  const key = a.turmaNome || 'Sem Turma';
                  if (!turmaGroups.has(key)) turmaGroups.set(key, []);
                  turmaGroups.get(key)!.push(a);
                });
                const groups = Array.from(turmaGroups.entries());
                return (
                  <div className="border-t pt-3">
                    <button
                      type="button"
                      onClick={() => setTrilhasExpanded(!trilhasExpanded)}
                      className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 w-full cursor-pointer hover:text-foreground transition-colors"
                    >
                      <Route className="h-3.5 w-3.5" />
                      Trilhas e Ciclos de Execução
                      <span className="ml-auto flex items-center gap-1 text-[10px] normal-case font-normal">
                        {trilhasExpanded ? 'Recolher' : `Expandir (${assessments.length} trilhas)`}
                        {trilhasExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </span>
                    </button>
                    {/* Resumo compacto */}
                    {!trilhasExpanded && (
                      <div className="space-y-1">
                        {groups.map(([turmaName, turmaAssessments]) => (
                          <div key={turmaName} className="flex items-center gap-2 text-xs flex-wrap">
                            <span className="font-medium truncate max-w-[250px]">{turmaName}</span>
                            <span className="text-muted-foreground/40">•</span>
                            <div className="flex gap-1">
                              {turmaAssessments.map((a: any) => (
                                <Badge key={a.id} variant="outline" className={`text-[9px] px-1 py-0 font-bold ${
                                  a.trilhaNome === 'Master' ? 'text-purple-600 border-purple-300' :
                                  a.trilhaNome === 'Essential' ? 'text-blue-600 border-blue-300' :
                                  a.trilhaNome === 'Basic' ? 'text-green-600 border-green-300' :
                                  'text-amber-600 border-amber-300'
                                }`}>{a.trilhaNome}</Badge>
                              ))}
                            </div>
                            <span className="text-muted-foreground/60 text-[10px]">
                              {turmaAssessments.reduce((sum: number, a: any) => sum + (a.competencias?.length || a.totalCompetencias || 0), 0)} comp.
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Detalhes expandidos - agrupados por turma com competências */}
                    {trilhasExpanded && (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {groups.map(([turmaName, turmaAssessments]) => (
                          <div key={turmaName} className="rounded-lg bg-muted/50 p-3">
                            <p className="text-xs font-bold mb-2 flex items-center gap-2">
                              <Users className="h-3 w-3 text-primary" />
                              {turmaName}
                            </p>
                            {turmaAssessments.map((a: any) => (
                              <div key={a.id} className="mb-2 last:mb-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-bold ${
                                    a.trilhaNome === 'Master' ? 'text-purple-600 border-purple-300' :
                                    a.trilhaNome === 'Essential' ? 'text-blue-600 border-blue-300' :
                                    a.trilhaNome === 'Basic' ? 'text-green-600 border-green-300' :
                                    'text-amber-600 border-amber-300'
                                  }`}>{a.trilhaNome}</Badge>
                                  <span className="text-[10px] text-muted-foreground">
                                    {a.totalCompetencias} comp. ({a.obrigatorias} obrig. / {a.opcionais} opc.)
                                  </span>
                                  {a.status === 'congelado' && (
                                    <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300">Em Andamento</Badge>
                                  )}
                                </div>
                                {/* Tabela de competências */}
                                {a.competencias && a.competencias.length > 0 && (
                                  <div className="ml-4 border-l border-border pl-3">
                                    <table className="w-full text-[11px]">
                                      <thead>
                                        <tr className="text-muted-foreground/60">
                                          <th className="text-left font-medium pb-1">Competência</th>
                                          <th className="text-left font-medium pb-1 w-[90px]">Início</th>
                                          <th className="text-left font-medium pb-1 w-[90px]">Fim</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {a.competencias.map((c: any) => (
                                          <tr key={c.id} className="text-foreground/80 hover:text-foreground">
                                            <td className="py-0.5 pr-2">{c.competenciaNome}</td>
                                            <td className="py-0.5 font-medium">{formatDate(c.microInicio)}</td>
                                            <td className="py-0.5 font-medium">{formatDate(c.microTermino)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {assessments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhum assessment cadastrado</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Clique em "Novo Assessment" para criar o PDI deste aluno
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assessments.map((pdi: any) => (
                <AssessmentCard
                  key={pdi.id}
                  pdi={pdi}
                  isExpanded={expandedPdiId === pdi.id}
                  onToggle={() => setExpandedPdiId(expandedPdiId === pdi.id ? null : pdi.id)}
                  onCongelar={() => handleCongelarClick(pdi.id)}
                  onDescongelar={() => handleDescongelar(pdi.id)}
                  isDescongelando={descongelarMutation.isPending}
                  formatDate={formatDate}
                  refetch={refetchAssessments}
                  onEdit={() => setEditPdi(pdi)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Guia do Mentor - Vídeo e Resumo */}
      <Card className="border-secondary/30 overflow-hidden">
        <div className="bg-gradient-to-r from-[#0A1E3E] to-[#1a3a5c] px-6 py-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Video className="h-5 w-5 text-secondary" />
            Guia do Mentor
          </h3>
          <p className="text-white/70 text-sm mt-0.5">
            Assista ao vídeo antes de iniciar a mentoria com seu aluno
          </p>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vídeo Player */}
            <div className="rounded-xl overflow-hidden bg-black shadow-lg">
              <video
                controls
                className="w-full aspect-video"
                poster=""
                preload="metadata"
              >
                <source src="https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/O_Guia_do_Mentor_9a814982.mp4" type="video/mp4" />
                Seu navegador não suporta a reprodução de vídeo.
              </video>
            </div>

            {/* Resumo do Conteúdo */}
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-[#0A1E3E] text-base flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-secondary" />
                  Como definir as competências de desenvolvimento
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Leia com atenção os resultados dos testes que o aluno realizou no onboarding, assim como as percepções que ele registrou sobre o próprio desenvolvimento. Essas informações são o ponto de partida para a conversa de mentoria.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                  Converse com o aluno para entender suas necessidades e prioridades. Juntos, definam quais competências farão parte da trilha de desenvolvimento, sempre em comum acordo.
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-bold text-[#0A1E3E] text-base flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-secondary" />
                  Depois das competências: definição de metas
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Após trabalhar as competências, acessem a página de Metas para definir desafios práticos que comprovem que o desenvolvimento realmente aconteceu.
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-bold text-[#0A1E3E] text-base flex items-center gap-2 mb-2">
                  <PlayCircle className="h-4 w-4 text-secondary" />
                  Seu papel como mentor(a)
                </h4>
                <ul className="space-y-1.5">
                  {[
                    'Ler os resultados dos testes realizados no onboarding',
                    'Analisar as percepções de desenvolvimento do aluno',
                    'Conduzir a conversa para definição das competências',
                    'Alinhar prazos realistas para as atividades',
                    'Apoiar na definição de metas e desafios práticos',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="h-3.5 w-3.5 text-secondary mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedAlunoId && (
        <Card>
          <CardContent className="py-16 text-center">
            <User className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-medium text-muted-foreground text-lg">Selecione um aluno</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Escolha uma empresa e um aluno para visualizar ou criar seu Assessment / Jornada
            </p>
          </CardContent>
        </Card>
      )}

      {showCreateDialog && selectedAlunoId && (
        <CreateAssessmentDialog
          open={showCreateDialog}
          onClose={() => setTimeout(() => setShowCreateDialog(false), 100)}
          alunoId={selectedAlunoId}
          alunoName={selectedAluno?.name || ""}
          programId={selectedAluno?.programId || undefined}
          turmaId={selectedAluno?.turmaId || undefined}
          consultorId={userConsultorId || selectedAluno?.consultorId || undefined}
          trilhas={trilhas}
          programs={programs}
          mentores={mentores}
          isAdmin={isAdmin}
          onSuccess={() => {
            refetchAssessments();
            setTimeout(() => setShowCreateDialog(false), 100);
          }}
        />
      )}

      {/* Diálogo de Edição do Assessment */}
      {editPdi && (
        <EditAssessmentDialog
          open={!!editPdi}
          onClose={() => setEditPdi(null)}
          pdi={editPdi}
          trilhas={trilhas}
          programs={programs}
          mentores={mentores}
          isAdmin={isAdmin}
          onSuccess={() => {
            refetchAssessments();
          }}
        />
      )}

      {/* Diálogo de Confirmação de Congelamento */}
      <Dialog open={congelarDialogOpen} onOpenChange={(open) => { if (!open) { setCongelarDialogOpen(false); setCongelarPdiId(null); setCongelarMotivo(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700">
              <Lock className="h-5 w-5" />
              Confirmar Congelamento
            </DialogTitle>
            <DialogDescription>
              Ao congelar esta trilha, os indicadores do aluno serão zerados e a trilha ficará inativa.
              Você poderá descongelar depois, se necessário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <strong>Atenção:</strong> PDIs congelados são excluídos do cálculo de indicadores.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Motivo do congelamento <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={congelarMotivo}
                onChange={(e) => setCongelarMotivo(e.target.value)}
                placeholder="Ex: Trilha finalizada, aluno desligado, troca de trilha..."
                className="h-24 resize-none"
              />
              {congelarMotivo.trim().length === 0 && (
                <p className="text-xs text-muted-foreground">O motivo é obrigatório para registrar o congelamento.</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => { setCongelarDialogOpen(false); setCongelarPdiId(null); setCongelarMotivo(""); }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCongelarConfirm}
              disabled={!congelarMotivo.trim() || congelarMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Lock className="h-3.5 w-3.5 mr-1" />
              {congelarMutation.isPending ? "Congelando..." : "Confirmar Congelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Reset DISC */}
      <Dialog open={resetDiscDialogOpen} onOpenChange={(open) => { if (!open) setResetDiscDialogOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <RotateCcw className="h-5 w-5" />
              Solicitar que Aluno Refaça o Teste DISC
            </DialogTitle>
            <DialogDescription>
              Esta ação irá <strong>remover todas as respostas e resultados DISC</strong> do aluno <strong>{selectedAluno?.name}</strong>.
              O aluno verá o teste DISC novamente no Onboarding e poderá refazê-lo.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Atenção:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>O histórico de resultados anteriores será removido</li>
                  <li>O aluno precisará completar o teste novamente</li>
                  <li>Esta ação não pode ser desfeita</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResetDiscDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedAlunoId) {
                  resetDiscMutation.mutate({ alunoId: selectedAlunoId });
                }
              }}
              disabled={resetDiscMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {resetDiscMutation.isPending ? "Resetando..." : "Confirmar Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ Assessment Card Component ============
function AssessmentCard({
  pdi,
  isExpanded,
  onToggle,
  onCongelar,
  onDescongelar,
  isDescongelando,
  formatDate,
  refetch,
  onEdit,
}: {
  pdi: any;
  isExpanded: boolean;
  onToggle: () => void;
  onCongelar: () => void;
  onDescongelar: () => void;
  isDescongelando: boolean;
  formatDate: (d: any) => string;
  refetch: () => void;
  onEdit: () => void;
}) {
  const [editingCompId, setEditingCompId] = useState<number | null>(null);
  const [editNivelAtual, setEditNivelAtual] = useState("");
  const [editMetaCiclo1, setEditMetaCiclo1] = useState("");
  const [editMetaCiclo2, setEditMetaCiclo2] = useState("");
  const [editMetaFinal, setEditMetaFinal] = useState("");
  const [editJustificativa, setEditJustificativa] = useState("");

  const isCongelado = pdi.status === "congelado";
  const hoje = new Date();
  const macroTermino = new Date(pdi.macroTermino);
  const isExpirado = macroTermino < hoje && !isCongelado;

  const updateNivelMutation = trpc.jornada.updateNivel.useMutation({
    onSuccess: () => {
      toast.success("Níveis atualizados com sucesso!");
      setEditingCompId(null);
      refetch();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const startEdit = (comp: any) => {
    setEditingCompId(comp.id);
    setEditNivelAtual(comp.nivelAtualEfetivo?.toString() || comp.nivelAtual?.toString() || "");
    setEditMetaCiclo1(comp.metaCiclo1?.toString() || "");
    setEditMetaCiclo2(comp.metaCiclo2?.toString() || "");
    setEditMetaFinal(comp.metaFinal?.toString() || "");
    setEditJustificativa(comp.justificativa || "");
  };

  const saveEdit = (compId: number) => {
    updateNivelMutation.mutate({
      assessmentCompetenciaId: compId,
      nivelAtual: editNivelAtual ? parseFloat(editNivelAtual) : undefined,
      metaCiclo1: editMetaCiclo1 ? parseFloat(editMetaCiclo1) : undefined,
      metaCiclo2: editMetaCiclo2 ? parseFloat(editMetaCiclo2) : undefined,
      metaFinal: editMetaFinal ? parseFloat(editMetaFinal) : undefined,
      justificativa: editJustificativa || undefined,
    });
  };

  // Calcular médias gerais (A2 FIX: usar nivelAtualEfetivo que inclui dados do student_performance)
  const compsComNivel = pdi.competencias?.filter((c: any) => c.nivelAtualEfetivo !== null && c.nivelAtualEfetivo !== undefined) || [];
  const mediaAtual = compsComNivel.length > 0
    ? Math.round(compsComNivel.reduce((sum: number, c: any) => sum + (c.nivelAtualEfetivo || 0), 0) / compsComNivel.length)
    : 0;
  const compsComMeta = pdi.competencias?.filter((c: any) => c.metaFinal !== null && c.metaFinal !== undefined) || [];
  const mediaMetaFinal = compsComMeta.length > 0
    ? Math.round(compsComMeta.reduce((sum: number, c: any) => sum + (parseFloat(c.metaFinal) || 0), 0) / compsComMeta.length)
    : 0;

  return (
    <Card className={`transition-all ${isCongelado ? "opacity-75 border-blue-200 bg-blue-50/30" : isExpirado ? "border-amber-200 bg-amber-50/30" : "border-border/50"}`}>
      <CardHeader className="pb-3 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCongelado ? "bg-blue-100" : isExpirado ? "bg-amber-100" : "bg-secondary/10"}`}>
              {isCongelado ? <Lock className="h-5 w-5 text-blue-600" /> : <BookOpen className="h-5 w-5 text-secondary" />}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {pdi.trilhaNome}
                <Badge variant={isCongelado ? "secondary" : isExpirado ? "destructive" : "default"} className="text-[10px]">
                  {isCongelado ? "Finalizada" : isExpirado ? "Expirada" : "Em Andamento"}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {pdi.turmaNome && `${pdi.turmaNome} • `}
                Macro Jornada: {formatDate(pdi.macroInicio)} → {formatDate(pdi.macroTermino)}
                {pdi.consultorNome && ` • Mentora: ${pdi.consultorNome}`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {compsComNivel.length > 0 && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Nível Geral</div>
                <div className={`text-lg font-bold ${mediaAtual >= 75 ? "text-emerald-600" : mediaAtual >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {mediaAtual}%
                </div>
              </div>
            )}
            <div className="text-right text-xs text-muted-foreground">
              <div>{pdi.obrigatorias} obrigatórias</div>
              <div>{pdi.opcionais} opcionais</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="text-secondary border-secondary/30 hover:bg-secondary/10"
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Editar
            </Button>
            {!isCongelado ? (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onCongelar(); }}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Lock className="h-3.5 w-3.5 mr-1" />
                Congelar
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onDescongelar(); }}
                disabled={isDescongelando}
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              >
                <LockOpen className="h-3.5 w-3.5 mr-1" />
                {isDescongelando ? "Descongelando..." : "Descongelar"}
              </Button>
            )}
            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && pdi.competencias && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />

          {/* Info de congelamento */}
          {isCongelado && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Trilha Congelada</span>
              </div>
              {pdi.congeladoEm && (
                <p className="text-xs text-blue-700">
                  Congelada em {formatDate(pdi.congeladoEm)}
                  {pdi.congeladoPorNome && ` por ${pdi.congeladoPorNome}`}
                </p>
              )}
              {pdi.motivoCongelamento && (
                <p className="text-xs text-blue-700 mt-1 italic border-l-2 border-blue-300 pl-2">
                  Motivo: {pdi.motivoCongelamento}
                </p>
              )}
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{pdi.totalCompetencias}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-secondary">{pdi.obrigatorias}</div>
              <div className="text-xs text-muted-foreground">Obrigatórias</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-muted-foreground">{pdi.opcionais}</div>
              <div className="text-xs text-muted-foreground">Opcionais</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-600">{mediaAtual}%</div>
              <div className="text-xs text-emerald-700">Nível Identificado</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{mediaMetaFinal}%</div>
              <div className="text-xs text-blue-700">Meta Final</div>
            </div>
          </div>

          {/* Competencias - Card layout instead of table */}
          <div className="space-y-3">
            {pdi.competencias.map((comp: any) => {
              // A2 FIX: usar nivelAtualEfetivo (inclui dados automáticos do student_performance)
              const nivelAtual = comp.nivelAtualEfetivo !== null && comp.nivelAtualEfetivo !== undefined ? Number(comp.nivelAtualEfetivo) : null;
              const isNivelAutomatico = comp.nivelAutomatico === true;
              const metaFinal = comp.metaFinal !== null && comp.metaFinal !== undefined ? parseFloat(comp.metaFinal) : null;
              const metaCiclo1 = comp.metaCiclo1 !== null && comp.metaCiclo1 !== undefined ? parseFloat(comp.metaCiclo1) : null;
              const metaCiclo2 = comp.metaCiclo2 !== null && comp.metaCiclo2 !== undefined ? parseFloat(comp.metaCiclo2) : null;
              const isEditing = editingCompId === comp.id;
              const microTerminoDate = comp.microTermino ? new Date(comp.microTermino) : null;
              const microExpirado = microTerminoDate && microTerminoDate < new Date() && (nivelAtual === null || (metaFinal !== null && nivelAtual < metaFinal));

              return (
                <Card key={comp.id} className={`border ${microExpirado ? "border-amber-200 bg-amber-50/30" : nivelAtual !== null && metaFinal !== null && nivelAtual >= metaFinal ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200"}`}>
                  <CardContent className="p-4">
                    {isEditing ? (
                      /* Edit Mode */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Target className="h-4 w-4 text-secondary" />
                            {comp.competenciaNome}
                          </h4>
                          <Badge variant={comp.peso === "obrigatoria" ? "default" : "outline"} className="text-[10px]">
                            {comp.peso === "obrigatoria" ? "Obrigatória" : "Opcional"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground">Nível Identificado (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={editNivelAtual}
                              onChange={(e) => setEditNivelAtual(e.target.value)}
                              className="h-9"
                              placeholder="0-100"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground">Evolução no Período 1 (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={editMetaCiclo1}
                              onChange={(e) => setEditMetaCiclo1(e.target.value)}
                              className="h-9"
                              placeholder="0-100"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground">Evolução no Período 2 (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={editMetaCiclo2}
                              onChange={(e) => setEditMetaCiclo2(e.target.value)}
                              className="h-9"
                              placeholder="0-100"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground">Meta Final (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={editMetaFinal}
                              onChange={(e) => setEditMetaFinal(e.target.value)}
                              className="h-9"
                              placeholder="0-100"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-muted-foreground">Justificativa da Mentora</Label>
                          <Textarea
                            value={editJustificativa}
                            onChange={(e) => setEditJustificativa(e.target.value)}
                            placeholder="Justificativa para a meta definida, observações sobre o desenvolvimento..."
                            className="h-20 resize-none"
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => setEditingCompId(null)}>
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveEdit(comp.id)}
                            disabled={updateNivelMutation.isPending}
                            className="bg-secondary hover:bg-secondary/90"
                          >
                            <Save className="h-3.5 w-3.5 mr-1" />
                            {updateNivelMutation.isPending ? "Salvando..." : "Salvar"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">{comp.competenciaNome}</h4>
                            <Badge variant={comp.peso === "obrigatoria" ? "default" : "outline"} className="text-[10px]">
                              {comp.peso === "obrigatoria" ? "Obrigatória" : "Opcional"}
                            </Badge>
                            {isNivelAutomatico && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-blue-300 text-blue-600 bg-blue-50">
                                Automático
                              </Badge>
                            )}
                            {nivelAtual !== null && metaFinal !== null && nivelAtual >= metaFinal && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {(comp.microInicio || comp.microTermino) && (
                              <span className={`text-[10px] ${microExpirado ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                                Micro Jornada: {formatDate(comp.microInicio)} → {formatDate(comp.microTermino)}
                              </span>
                            )}
                            {!isCongelado && (
                              <Button variant="ghost" size="sm" onClick={() => startEdit(comp)} className="h-7 w-7 p-0">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Progress bars */}
                        <div className="space-y-1.5">
                          <ProgressBar
                            value={nivelAtual ?? 0}
                            meta={metaFinal ?? undefined}
                            label={`Nível Identificado: ${nivelAtual ?? 0}%`}
                          />
                          <div className="flex gap-4 text-[10px] text-muted-foreground">
                            {metaCiclo1 !== null && <span>Evol. P1: <strong className="text-foreground">{metaCiclo1}%</strong></span>}
                            {metaCiclo2 !== null && <span>Evol. P2: <strong className="text-foreground">{metaCiclo2}%</strong></span>}
                            {metaFinal !== null && <span>Meta Final: <strong className="text-blue-600">{metaFinal}%</strong></span>}
                          </div>
                        </div>

                        {comp.justificativa && (
                          <p className="text-xs text-muted-foreground italic border-l-2 border-secondary/30 pl-2">
                            {comp.justificativa}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ============ Create Assessment Dialog ============
function CreateAssessmentDialog({
  open,
  onClose,
  alunoId,
  alunoName,
  programId,
  turmaId,
  consultorId,
  trilhas,
  programs,
  mentores,
  onSuccess,
  isAdmin,
}: {
  open: boolean;
  onClose: () => void;
  alunoId: number;
  alunoName: string;
  programId?: number;
  turmaId?: number;
  consultorId?: number | null;
  trilhas: any[];
  programs: any[];
  mentores: any[];
  onSuccess: () => void;
  isAdmin: boolean;
}) {
  const [step, setStep] = useState(1);
  const [selectedTrilhaId, setSelectedTrilhaId] = useState<string>("");
  const [selectedConsultorId, setSelectedConsultorId] = useState<string>(consultorId ? String(consultorId) : "");
  const [macroInicio, setMacroInicio] = useState("");
  const [macroTermino, setMacroTermino] = useState("");
  // Campo totalSessoesPrevistas removido - definido pelo admin no contrato
  const [competenciasConfig, setCompetenciasConfig] = useState<Array<{
    competenciaId: number;
    nome: string;
    selected: boolean;
    peso: "obrigatoria" | "opcional";
    notaCorte: string;
    nivelAtual: string;
    metaCiclo1: string;
    metaCiclo2: string;
    metaFinal: string;
    justificativa: string;
    microInicio: string;
    microTermino: string;
  }>>([]);

  const { data: competenciasTrilha = [] } = trpc.competencias.byTrilha.useQuery(
    { trilhaId: parseInt(selectedTrilhaId) },
    { enabled: !!selectedTrilhaId }
  );

  useEffect(() => {
    if (competenciasTrilha.length > 0) {
      setCompetenciasConfig(
        competenciasTrilha.map((c: any) => ({
          competenciaId: c.id,
          nome: c.nome || c.name || "Sem nome",
          selected: true,
          peso: "obrigatoria" as const,
          notaCorte: "80",
          nivelAtual: "",
          metaCiclo1: "",
          metaCiclo2: "",
          metaFinal: "",
          justificativa: "",
          microInicio: "",
          microTermino: "",
        }))
      );
    }
  }, [competenciasTrilha]);

  const criarMutation = trpc.assessment.criar.useMutation({
    onSuccess: () => {
      toast.success("Assessment criado com sucesso!");
      onSuccess();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!selectedTrilhaId || !macroInicio || !macroTermino) {
      toast.error("Preencha a trilha e as datas da Macro Jornada");
      return;
    }

    if (macroInicio >= macroTermino) {
      toast.error("Data de início deve ser anterior à data de término");
      return;
    }

    const selectedComps = competenciasConfig.filter(c => c.selected);
    if (selectedComps.length === 0) {
      toast.error("Selecione pelo menos uma competência");
      return;
    }

    for (const comp of selectedComps) {
      if (comp.microInicio && comp.microInicio < macroInicio) {
        toast.error(`Micro Jornada de "${comp.nome}" não pode iniciar antes da Macro Jornada`);
        return;
      }
      if (comp.microTermino && comp.microTermino > macroTermino) {
        toast.error(`Micro Jornada de "${comp.nome}" não pode terminar depois da Macro Jornada`);
        return;
      }
    }

    criarMutation.mutate({
      alunoId,
      trilhaId: parseInt(selectedTrilhaId),
      turmaId: turmaId || null,
      programId: programId || null,
      consultorId: selectedConsultorId ? parseInt(selectedConsultorId) : null,
      macroInicio,
      macroTermino,
      // totalSessoesPrevistas removido - definido pelo admin no contrato
      competencias: selectedComps.map(c => ({
        competenciaId: c.competenciaId,
        peso: c.peso,
        notaCorte: c.notaCorte,
        nivelAtual: c.nivelAtual ? parseInt(c.nivelAtual) : null,
        metaCiclo1: c.metaCiclo1 ? parseInt(c.metaCiclo1) : null,
        metaCiclo2: c.metaCiclo2 ? parseInt(c.metaCiclo2) : null,
        metaFinal: c.metaFinal ? parseInt(c.metaFinal) : null,
        justificativa: c.justificativa || null,
        microInicio: c.microInicio || null,
        microTermino: c.microTermino || null,
      })),
    });
  };

  const toggleAll = (selected: boolean) => {
    setCompetenciasConfig(prev => prev.map(c => ({ ...c, selected })));
  };

  const setAllPeso = (peso: "obrigatoria" | "opcional") => {
    setCompetenciasConfig(prev => prev.map(c => c.selected ? { ...c, peso } : c));
  };

  const selectedTrilha = trilhas.find(t => t.id === parseInt(selectedTrilhaId));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-secondary" />
            Novo Assessment — {alunoName}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "Defina a trilha e o período da Macro Jornada" : step === 2 ? "Selecione as competências e defina os pesos" : "Defina os níveis e metas de cada competência"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-5 py-2 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label className="font-medium">Trilha</Label>
              <Select value={selectedTrilhaId} onValueChange={setSelectedTrilhaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a trilha" />
                </SelectTrigger>
                <SelectContentNoPortal>
                  {trilhas.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContentNoPortal>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Mentora responsável</Label>
              {isAdmin ? (
                <Select value={selectedConsultorId} onValueChange={setSelectedConsultorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a mentora" />
                  </SelectTrigger>
                  <SelectContentNoPortal>
                    {mentores.map(m => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                    ))}
                  </SelectContentNoPortal>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <Input 
                    value={mentores.find(m => String(m.id) === selectedConsultorId)?.name || 'Mentor vinculado'} 
                    disabled 
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Definido automaticamente. Para alterar, solicite ao administrador.</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Macro Jornada (Duração da Trilha)
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Início</Label>
                  <Input type="date" value={macroInicio} onChange={e => setMacroInicio(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Término</Label>
                  <Input type="date" value={macroTermino} onChange={e => setMacroTermino(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Info do contrato - somente leitura (definido pelo admin) */}
            <ContratoInfoReadonly alunoId={alunoId} />

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedTrilhaId || !macroInicio || !macroTermino}
                className="bg-secondary hover:bg-secondary/90"
              >
                Próximo: Competências
              </Button>
            </DialogFooter>
          </div>
        ) : step === 2 ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm">
                <span className="font-medium">{selectedTrilha?.name}</span>
                <span className="text-muted-foreground ml-2">
                  {macroInicio} → {macroTermino}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>Selecionar todas</Button>
                <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>Desmarcar todas</Button>
                <Button variant="outline" size="sm" onClick={() => setAllPeso("obrigatoria")}>Todas obrigatórias</Button>
                <Button variant="outline" size="sm" onClick={() => setAllPeso("opcional")}>Todas opcionais</Button>
              </div>
            </div>

            <ScrollArea className="flex-1 border rounded-lg min-h-0" type="always">
              <div className="p-1">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="text-xs font-semibold">Competência</TableHead>
                      <TableHead className="text-xs font-semibold text-center w-28">Peso</TableHead>
                      <TableHead className="text-xs font-semibold text-center w-40">Micro Jornada Início</TableHead>
                      <TableHead className="text-xs font-semibold text-center w-40">Micro Jornada Término</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competenciasConfig.map((comp, idx) => (
                      <TableRow key={comp.competenciaId} className={!comp.selected ? "opacity-50" : ""}>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={comp.selected}
                            onCheckedChange={(checked) => {
                              setCompetenciasConfig(prev => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], selected: !!checked };
                                return next;
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-sm font-medium">{comp.nome}</TableCell>
                        <TableCell className="text-center">
                          <select
                            value={comp.peso}
                            onChange={(e) => {
                              setCompetenciasConfig(prev => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], peso: e.target.value as "obrigatoria" | "opcional" };
                                return next;
                              });
                            }}
                            disabled={!comp.selected}
                            className="h-8 text-xs rounded-md border border-input bg-background px-2"
                          >
                            <option value="obrigatoria">Obrigatória</option>
                            <option value="opcional">Opcional</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="date"
                            value={comp.microInicio}
                            min={macroInicio}
                            max={macroTermino}
                            onChange={(e) => {
                              setCompetenciasConfig(prev => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], microInicio: e.target.value };
                                return next;
                              });
                            }}
                            disabled={!comp.selected}
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="date"
                            value={comp.microTermino}
                            min={comp.microInicio || macroInicio}
                            max={macroTermino}
                            onChange={(e) => {
                              setCompetenciasConfig(prev => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], microTermino: e.target.value };
                                return next;
                              });
                            }}
                            disabled={!comp.selected}
                            className="h-8 text-xs"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
              <ScrollBar orientation="vertical" />
            </ScrollArea>

            <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Micro Jornadas não podem ultrapassar as datas da Macro Jornada ({macroInicio} → {macroTermino})
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <Button
                onClick={() => setStep(3)}
                disabled={competenciasConfig.filter(c => c.selected).length === 0}
                className="bg-secondary hover:bg-secondary/90"
              >
                Próximo: Definir Níveis e Metas
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Step 3: Definir Níveis e Metas */
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="text-sm mb-3">
              <span className="font-medium">{selectedTrilha?.name}</span>
              <span className="text-muted-foreground ml-2">
                — {competenciasConfig.filter(c => c.selected).length} competências selecionadas
              </span>
            </div>

            <ScrollArea className="flex-1 border rounded-lg min-h-0" type="always">
              <div className="p-4 space-y-4">
                {competenciasConfig.filter(c => c.selected).map((comp, idx) => {
                  const realIdx = competenciasConfig.findIndex(c => c.competenciaId === comp.competenciaId);
                  return (
                    <Card key={comp.competenciaId} className="border border-gray-200">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Target className="h-4 w-4 text-secondary" />
                            {comp.nome}
                          </h4>
                          <Badge variant={comp.peso === "obrigatoria" ? "default" : "outline"} className="text-[10px]">
                            {comp.peso === "obrigatoria" ? "Obrigatória" : "Opcional"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Nível Identificado (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={comp.nivelAtual}
                              onChange={(e) => {
                                setCompetenciasConfig(prev => {
                                  const next = [...prev];
                                  next[realIdx] = { ...next[realIdx], nivelAtual: e.target.value };
                                  return next;
                                });
                              }}
                              className="h-9"
                              placeholder="Ex: 42"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Evolução no Período 1 (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={comp.metaCiclo1}
                              onChange={(e) => {
                                setCompetenciasConfig(prev => {
                                  const next = [...prev];
                                  next[realIdx] = { ...next[realIdx], metaCiclo1: e.target.value };
                                  return next;
                                });
                              }}
                              className="h-9"
                              placeholder="Ex: 55"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Evolução no Período 2 (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={comp.metaCiclo2}
                              onChange={(e) => {
                                setCompetenciasConfig(prev => {
                                  const next = [...prev];
                                  next[realIdx] = { ...next[realIdx], metaCiclo2: e.target.value };
                                  return next;
                                });
                              }}
                              className="h-9"
                              placeholder="Ex: 65"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Meta Final (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={comp.metaFinal}
                              onChange={(e) => {
                                setCompetenciasConfig(prev => {
                                  const next = [...prev];
                                  next[realIdx] = { ...next[realIdx], metaFinal: e.target.value };
                                  return next;
                                });
                              }}
                              className="h-9"
                              placeholder="Ex: 75"
                            />
                          </div>
                        </div>

                        {/* Preview bar */}
                        {comp.nivelAtual && (
                          <ProgressBar
                            value={parseInt(comp.nivelAtual) || 0}
                            meta={parseInt(comp.metaFinal) || undefined}
                          />
                        )}

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Justificativa da Mentora</Label>
                          <Textarea
                            value={comp.justificativa}
                            onChange={(e) => {
                              setCompetenciasConfig(prev => {
                                const next = [...prev];
                                next[realIdx] = { ...next[realIdx], justificativa: e.target.value };
                                return next;
                              });
                            }}
                            placeholder="Justificativa para a meta, observações..."
                            className="h-16 resize-none text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
              <Button
                onClick={handleSubmit}
                disabled={criarMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {criarMutation.isPending ? "Criando..." : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Salvar e Liberar Trilha
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
