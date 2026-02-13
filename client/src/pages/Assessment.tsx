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
} from "lucide-react";

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

  // Data queries - filtrar por mentor logado quando não é admin
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

  // Assessment data for selected aluno
  const { data: assessments = [], refetch: refetchAssessments } = trpc.assessment.porAluno.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );

  // Congelar mutation
  const congelarMutation = trpc.assessment.congelar.useMutation({
    onSuccess: () => {
      toast.success("Trilha congelada com sucesso!");
      refetchAssessments();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  // Selected aluno info
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
            Assessment / PDI
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
            {/* Empresa - apenas para admin */}
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

            {/* Aluno */}
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
                {alunos.map(a => (
                  <option key={a.id} value={String(a.id)}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Botão Novo Assessment */}
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

      {/* Aluno Info + Assessments */}
      {selectedAlunoId && selectedAluno && (
        <>
          {/* Aluno Card */}
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

          {/* Assessments List */}
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

      {/* Empty state */}
      {!selectedAlunoId && (
        <Card>
          <CardContent className="py-16 text-center">
            <User className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-medium text-muted-foreground text-lg">Selecione um aluno</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Escolha uma empresa e um aluno para visualizar ou criar seu Assessment / PDI
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      {showCreateDialog && selectedAlunoId && (
        <CreateAssessmentDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
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
            setShowCreateDialog(false);
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
  const isCongelado = pdi.status === "congelado";
  const hoje = new Date();
  const macroTermino = new Date(pdi.macroTermino);
  const isExpirado = macroTermino < hoje && !isCongelado;

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
                {formatDate(pdi.macroInicio)} → {formatDate(pdi.macroTermino)}
                {pdi.consultorNome && ` • Mentora: ${pdi.consultorNome}`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {pdi.competencias.filter((c: any) => c.atingiuMeta).length}
              </div>
              <div className="text-xs text-muted-foreground">Meta atingida</div>
            </div>
          </div>

          {/* Competencias Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-semibold">Competência</TableHead>
                  <TableHead className="text-xs font-semibold text-center w-24">Peso</TableHead>
                  <TableHead className="text-xs font-semibold text-center w-24">Nota Corte</TableHead>
                  <TableHead className="text-xs font-semibold text-center w-24">Nota Atual</TableHead>
                  <TableHead className="text-xs font-semibold text-center w-20">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-center w-36">Micro Ciclo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pdi.competencias.map((comp: any) => {
                  const notaAtual = comp.notaAtual;
                  const notaCorte = parseFloat(comp.notaCorte);
                  const atingiu = comp.atingiuMeta;
                  const microTermino = comp.microTermino ? new Date(comp.microTermino) : null;
                  const microExpirado = microTermino && microTermino < new Date() && !atingiu;

                  return (
                    <TableRow key={comp.id} className={atingiu ? "bg-emerald-50/50" : microExpirado ? "bg-amber-50/50" : ""}>
                      <TableCell className="text-sm font-medium">{comp.competenciaNome}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={comp.peso === "obrigatoria" ? "default" : "outline"} className="text-[10px]">
                          {comp.peso === "obrigatoria" ? "Obrigatória" : "Opcional"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm font-mono">{notaCorte}</TableCell>
                      <TableCell className="text-center">
                        {notaAtual !== null ? (
                          <span className={`text-sm font-mono font-semibold ${atingiu ? "text-emerald-600" : "text-red-500"}`}>
                            {notaAtual.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {atingiu ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                        ) : notaAtual !== null ? (
                          <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                        ) : microExpirado ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto" />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {comp.microInicio || comp.microTermino ? (
                          <span className={microExpirado ? "text-amber-600 font-medium" : ""}>
                            {formatDate(comp.microInicio)} → {formatDate(comp.microTermino)}
                          </span>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
  const [step, setStep] = useState(1); // 1: Trilha + Macro, 2: Competências
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
    microInicio: string;
    microTermino: string;
  }>>([]);

  // Fetch competencias for selected trilha
  const { data: competenciasTrilha = [] } = trpc.competencias.byTrilha.useQuery(
    { trilhaId: parseInt(selectedTrilhaId) },
    { enabled: !!selectedTrilhaId }
  );

  // Update competencias config when trilha changes
  useEffect(() => {
    if (competenciasTrilha.length > 0) {
      setCompetenciasConfig(
        competenciasTrilha.map((c: any) => ({
          competenciaId: c.id,
          nome: c.nome || c.name || "Sem nome",
          selected: true,
          peso: "obrigatoria" as const,
          notaCorte: "80",
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
      toast.error("Preencha a trilha e as datas do macro ciclo");
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

    // Validate micro dates
    for (const comp of selectedComps) {
      if (comp.microInicio && comp.microInicio < macroInicio) {
        toast.error(`Micro ciclo de "${comp.nome}" não pode iniciar antes do macro ciclo`);
        return;
      }
      if (comp.microTermino && comp.microTermino > macroTermino) {
        toast.error(`Micro ciclo de "${comp.nome}" não pode terminar depois do macro ciclo`);
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-secondary" />
            Novo Assessment — {alunoName}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "Defina a trilha e o período do macro ciclo" : "Configure as competências do PDI"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-5 py-2">
            {/* Trilha */}
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

            {/* Mentora */}
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

            {/* Macro Ciclo */}
            <div className="space-y-2">
              <Label className="font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Macro Ciclo (Jornada)
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
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Trilha info */}
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

            {/* Competencias list */}
            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-1">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="text-xs font-semibold">Competência</TableHead>
                      <TableHead className="text-xs font-semibold text-center w-32">Peso</TableHead>
                      <TableHead className="text-xs font-semibold text-center w-24">Nota Corte</TableHead>
                      <TableHead className="text-xs font-semibold text-center w-36">Micro Início</TableHead>
                      <TableHead className="text-xs font-semibold text-center w-36">Micro Término</TableHead>
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
                          <Select
                            value={comp.peso}
                            onValueChange={(v) => {
                              setCompetenciasConfig(prev => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], peso: v as "obrigatoria" | "opcional" };
                                return next;
                              });
                            }}
                            disabled={!comp.selected}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="obrigatoria">Obrigatória</SelectItem>
                              <SelectItem value="opcional">Opcional</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={comp.notaCorte}
                            onChange={(e) => {
                              setCompetenciasConfig(prev => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], notaCorte: e.target.value };
                                return next;
                              });
                            }}
                            disabled={!comp.selected}
                            className="h-8 text-xs text-center w-20 mx-auto"
                          />
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
              Micro ciclos não podem ultrapassar as datas do macro ciclo ({macroInicio} → {macroTermino})
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <Button
                onClick={handleSubmit}
                disabled={criarMutation.isPending || competenciasConfig.filter(c => c.selected).length === 0}
                className="bg-secondary hover:bg-secondary/90"
              >
                {criarMutation.isPending ? "Criando..." : "Criar Assessment"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
