import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Plus,
  Eye,
  Lock,
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
} from "lucide-react";

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

  // Gatilho de reavaliação a cada 3 sessões
  const { data: reavaliacao } = trpc.jornada.checkReavaliacao.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );

  const congelarMutation = trpc.assessment.congelar.useMutation({
    onSuccess: () => {
      toast.success("Trilha congelada com sucesso!");
      refetchAssessments();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const selectedAluno = useMemo(() => alunos.find(a => a.id === selectedAlunoId), [alunos, selectedAlunoId]);
  const alunoProgram = useMemo(() => {
    if (!selectedAluno?.programId) return null;
    return programs.find(p => p.id === selectedAluno.programId);
  }, [selectedAluno, programs]);

  const handleCongelar = (pdiId: number) => {
    const consultorId = userConsultorId || (selectedAluno?.consultorId as number);
    if (!consultorId) {
      toast.error("Consultor não identificado");
      return;
    }
    congelarMutation.mutate({ pdiId, consultorId });
  };

  const formatDate = (d: any) => {
    if (!d) return "—";
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString("pt-BR");
  };

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
                onClick={() => setShowCreateDialog(true)}
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

      {/* Banner de Reavaliação */}
      {selectedAlunoId && reavaliacao?.precisaReavaliar && (
        <Card className="border-amber-300 bg-amber-50 border-2">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-amber-800">Reavaliação de Competências Pendente</h4>
                <p className="text-sm text-amber-700">
                  Este aluno já realizou <strong>{reavaliacao.sessoesDesdeUltimaAtualizacao} sessões</strong> de mentoria desde a última atualização de nível.
                  {reavaliacao.ultimaAtualizacao 
                    ? ` Última atualização em ${new Date(reavaliacao.ultimaAtualizacao).toLocaleDateString('pt-BR')}.`
                    : ' Nenhuma atualização de nível foi registrada ainda.'}
                  É recomendado atualizar os níveis das competências.
                </p>
              </div>
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0"
                onClick={() => {
                  if (assessments.length > 0) {
                    setExpandedPdiId(assessments[0].id);
                  }
                }}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Atualizar Níveis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aluno Info + Assessments */}
      {selectedAlunoId && selectedAluno && (
        <>
          <Card className="border-l-4 border-l-secondary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
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
                  onCongelar={() => handleCongelar(pdi.id)}
                  formatDate={formatDate}
                  refetch={refetchAssessments}
                />
              ))}
            </div>
          )}
        </>
      )}

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
          onSuccess={() => {
            refetchAssessments();
            setTimeout(() => setShowCreateDialog(false), 100);
          }}
        />
      )}
    </div>
  );
}

// ============ Assessment Card Component ============
function AssessmentCard({
  pdi,
  isExpanded,
  onToggle,
  onCongelar,
  formatDate,
  refetch,
}: {
  pdi: any;
  isExpanded: boolean;
  onToggle: () => void;
  onCongelar: () => void;
  formatDate: (d: any) => string;
  refetch: () => void;
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
    setEditNivelAtual(comp.nivelAtual?.toString() || "");
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

  // Calcular médias gerais
  const compsComNivel = pdi.competencias?.filter((c: any) => c.nivelAtual !== null && c.nivelAtual !== undefined) || [];
  const mediaAtual = compsComNivel.length > 0
    ? Math.round(compsComNivel.reduce((sum: number, c: any) => sum + (parseFloat(c.nivelAtual) || 0), 0) / compsComNivel.length)
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
                  {isCongelado ? "Congelada" : isExpirado ? "Expirada" : "Ativa"}
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
            {!isCongelado && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onCongelar(); }}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Lock className="h-3.5 w-3.5 mr-1" />
                Congelar
              </Button>
            )}
            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && pdi.competencias && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />

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
              <div className="text-xs text-emerald-700">Nível Atual</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{mediaMetaFinal}%</div>
              <div className="text-xs text-blue-700">Meta Final</div>
            </div>
          </div>

          {/* Competencias - Card layout instead of table */}
          <div className="space-y-3">
            {pdi.competencias.map((comp: any) => {
              const nivelAtual = comp.nivelAtual !== null && comp.nivelAtual !== undefined ? parseFloat(comp.nivelAtual) : null;
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
                            <Label className="text-xs font-medium text-muted-foreground">Nível Atual (%)</Label>
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
                            <Label className="text-xs font-medium text-muted-foreground">Meta Ciclo 1 (%)</Label>
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
                            <Label className="text-xs font-medium text-muted-foreground">Meta Ciclo 2 (%)</Label>
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
                            label={`Nível Atual: ${nivelAtual ?? 0}%`}
                          />
                          <div className="flex gap-4 text-[10px] text-muted-foreground">
                            {metaCiclo1 !== null && <span>Meta C1: <strong className="text-foreground">{metaCiclo1}%</strong></span>}
                            {metaCiclo2 !== null && <span>Meta C2: <strong className="text-foreground">{metaCiclo2}%</strong></span>}
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
}) {
  const [step, setStep] = useState(1);
  const [selectedTrilhaId, setSelectedTrilhaId] = useState<string>("");
  const [selectedConsultorId, setSelectedConsultorId] = useState<string>(consultorId ? String(consultorId) : "");
  const [macroInicio, setMacroInicio] = useState("");
  const [macroTermino, setMacroTermino] = useState("");
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
      competencias: selectedComps.map(c => ({
        competenciaId: c.competenciaId,
        peso: c.peso,
        notaCorte: c.notaCorte,
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
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
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="font-medium">Trilha</Label>
              <Select value={selectedTrilhaId} onValueChange={setSelectedTrilhaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a trilha" />
                </SelectTrigger>
                <SelectContent>
                  {trilhas.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Mentora responsável</Label>
              <Select value={selectedConsultorId} onValueChange={setSelectedConsultorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a mentora" />
                </SelectTrigger>
                <SelectContent>
                  {mentores.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-1">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="text-xs font-semibold">Competência</TableHead>
                      <TableHead className="text-xs font-semibold text-center w-32">Peso</TableHead>
                      <TableHead className="text-xs font-semibold text-center w-36">Micro Jornada Início</TableHead>
                      <TableHead className="text-xs font-semibold text-center w-36">Micro Jornada Término</TableHead>
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

            <ScrollArea className="flex-1 border rounded-lg">
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
                            <Label className="text-xs text-muted-foreground">Nível Atual (%)</Label>
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
                            <Label className="text-xs text-muted-foreground">Meta Ciclo 1 (%)</Label>
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
                            <Label className="text-xs text-muted-foreground">Meta Ciclo 2 (%)</Label>
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
