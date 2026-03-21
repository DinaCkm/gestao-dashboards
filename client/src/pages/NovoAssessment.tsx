import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectContentNoPortal, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  ListChecks,
  User,
  FileText,
  Info,
} from "lucide-react";

// ============ Step Indicator ============
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, title: "Configuração", icon: Calendar, description: "Trilha e período" },
    { number: 2, title: "Competências", icon: ListChecks, description: "Seleção, nível e metas" },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = currentStep === step.number;
        const isCompleted = currentStep > step.number;

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                  isActive
                    ? "border-secondary bg-secondary text-white shadow-lg shadow-secondary/30"
                    : isCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-gray-300 bg-white text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-sm font-semibold ${isActive ? "text-secondary" : isCompleted ? "text-emerald-600" : "text-gray-400"}`}>
                  {step.title}
                </p>
                <p className="text-[11px] text-muted-foreground">{step.description}</p>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-24 h-0.5 mx-3 mt-[-1.5rem] ${currentStep > step.number ? "bg-emerald-500" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============ Contract Info Card ============
function ContratoInfoCard({ contratos, alunoName, tipoMentoria, aluno }: { contratos: any[]; alunoName: string; tipoMentoria?: string | null; aluno?: any }) {
  const formatDate = (d: any) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR");
  };

  if (!contratos || contratos.length === 0) {
    // Fallback: mostrar dados inline do aluno
    const cInicio = aluno?.contratoInicio;
    const cFim = aluno?.contratoFim;
    const sessoes = aluno?.totalSessoesContratadas;
    const tipoM = aluno?.tipoMentoria || tipoMentoria;
    const hasInlineData = cInicio || cFim || sessoes || tipoM;

    if (hasInlineData) {
      const inicio = cInicio ? new Date(cInicio) : null;
      const fim = cFim ? new Date(cFim) : null;
      const diffMeses = inicio && fim ? Math.round((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;

      return (
        <div className="mb-6 border border-blue-200 bg-blue-50/50 rounded-lg px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-800">Informações do Contrato</h3>
            <Badge variant="outline" className="ml-auto text-xs border-blue-300 text-blue-700">
              Cadastro do Aluno
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-[11px] text-blue-600 uppercase tracking-wide font-medium">Início do Contrato</p>
              <p className="text-sm font-semibold text-blue-900">{formatDate(cInicio)}</p>
            </div>
            <div>
              <p className="text-[11px] text-blue-600 uppercase tracking-wide font-medium">Término do Contrato</p>
              <p className="text-sm font-semibold text-blue-900">{formatDate(cFim)}</p>
            </div>
            <div>
              <p className="text-[11px] text-blue-600 uppercase tracking-wide font-medium">Duração</p>
              <p className="text-sm font-semibold text-blue-900">{diffMeses > 0 ? `${diffMeses} meses` : '—'}</p>
            </div>
            <div>
              <p className="text-[11px] text-blue-600 uppercase tracking-wide font-medium">Sessões Contratadas</p>
              <p className="text-sm font-semibold text-blue-900">{sessoes || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] text-blue-600 uppercase tracking-wide font-medium">Tipo de Mentoria</p>
              <p className="text-sm font-semibold text-blue-900">
                {tipoM === 'grupo' ? 'Em Grupo' : tipoM === 'individual' ? 'Individual' : tipoM === 'sem_mentoria' ? 'Sem Mentoria' : '—'}
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-500">
            <Info className="h-3.5 w-3.5" />
            Os macrociclos e microciclos devem estar dentro do período do contrato.
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6 border border-amber-200 bg-amber-50 rounded-lg px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Nenhum contrato cadastrado para {alunoName}</p>
          <p className="text-xs text-amber-600 mt-0.5">
            O administrador precisa cadastrar o contrato do aluno (período, sessões de mentoria e tipo) no cadastro do aluno ou na seção de Contratos.
          </p>
        </div>
      </div>
    );
  }

  const activeContratos = contratos.filter((c: any) => c.isActive === 1);
  const contrato = activeContratos[0] || contratos[0];

  const inicio = new Date(contrato.periodoInicio);
  const fim = new Date(contrato.periodoTermino);
  const diffMs = fim.getTime() - inicio.getTime();
  const diffMeses = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30));

  return (
    <div className="mb-6 border border-blue-200 bg-blue-50/50 rounded-lg px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-blue-800">Informações do Contrato</h3>
        <Badge variant="outline" className="ml-auto text-xs border-blue-300 text-blue-700">
          {contrato.isActive === 1 ? "Ativo" : "Inativo"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <p className="text-[11px] text-blue-600 uppercase tracking-wide font-medium">Início do Contrato</p>
          <p className="text-sm font-semibold text-blue-900">{formatDate(contrato.periodoInicio)}</p>
        </div>
        <div>
          <p className="text-[11px] text-blue-600 uppercase tracking-wide font-medium">Término do Contrato</p>
          <p className="text-sm font-semibold text-blue-900">{formatDate(contrato.periodoTermino)}</p>
        </div>
        <div>
          <p className="text-[11px] text-blue-600 uppercase tracking-wide font-medium">Duração</p>
          <p className="text-sm font-semibold text-blue-900">{diffMeses} meses</p>
        </div>
        <div>
          <p className="text-[11px] text-blue-600 uppercase tracking-wide font-medium">Sessões Contratadas</p>
          <p className="text-sm font-semibold text-blue-900">{contrato.totalSessoesContratadas || "—"}</p>
        </div>
        <div>
          <p className="text-[11px] text-blue-600 uppercase tracking-wide font-medium">Tipo de Mentoria</p>
          <p className="text-sm font-semibold text-blue-900">
            {tipoMentoria === 'grupo' ? 'Em Grupo' : tipoMentoria === 'individual' ? 'Individual' : '—'}
          </p>
        </div>
      </div>
      {contrato.observacoes && (
        <p className="text-xs text-blue-600 mt-2 italic">Obs: {contrato.observacoes}</p>
      )}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-500">
        <Info className="h-3.5 w-3.5" />
        Os macrociclos e microciclos devem estar dentro do período do contrato.
      </div>
    </div>
  );
}

// ============ Main Page ============
export default function NovoAssessment() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ alunoId: string }>();
  const alunoId = parseInt(params.alunoId || "0");

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  // Step state
  const [step, setStep] = useState(1);

  // Step 1 state
  const [selectedTrilhaId, setSelectedTrilhaId] = useState<string>("");
  const [selectedConsultorId, setSelectedConsultorId] = useState<string>("");
  const [macroInicio, setMacroInicio] = useState("");
  const [macroTermino, setMacroTermino] = useState("");

  // Step 2 state - now includes nivelAtual, metaFinal, metaCiclo1, metaCiclo2, justificativa
  const [competenciasConfig, setCompetenciasConfig] = useState<Array<{
    competenciaId: number;
    nome: string;
    selected: boolean;
    peso: "obrigatoria" | "opcional";
    notaCorte: string;
    nivelAtual: string;
    metaFinal: string;
    metaCiclo1: string;
    metaCiclo2: string;
    justificativa: string;
    microInicio: string;
    microTermino: string;
  }>>([]);

  // Get user's consultorId for non-admin
  const { data: userRecord } = trpc.auth.me.useQuery();
  const userConsultorId = (userRecord as any)?.consultorId;

  // Queries
  const { data: trilhas = [] } = trpc.trilhas.list.useQuery();
  const { data: mentores = [] } = trpc.mentor.list.useQuery();
  const { data: allPrograms = [] } = trpc.programs.list.useQuery(undefined, { enabled: isAdmin });

  // Fetch contract data for this student (Item 2.3)
  const { data: contratos = [] } = trpc.contratos.byAluno.useQuery(
    { alunoId },
    { enabled: alunoId > 0 }
  );

  // Get aluno info - admin sees all, mentor sees own
  const { data: adminAlunos = [] } = trpc.alunos.list.useQuery(
    undefined,
    { enabled: isAdmin }
  );
  const { data: mentorAlunos = [] } = trpc.alunos.byConsultor.useQuery(
    { consultorId: userConsultorId! },
    { enabled: !!userConsultorId && !isAdmin }
  );
  const alunosList = isAdmin ? adminAlunos : mentorAlunos;
  const selectedAluno = alunosList.find((a: any) => a.id === alunoId);

  // Set consultor from aluno
  useEffect(() => {
    if (selectedAluno?.consultorId && !selectedConsultorId) {
      setSelectedConsultorId(String(selectedAluno.consultorId));
    }
  }, [selectedAluno]);
  useEffect(() => {
    if (userConsultorId && !selectedConsultorId) {
      setSelectedConsultorId(String(userConsultorId));
    }
  }, [userConsultorId]);

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
          metaFinal: "",
          metaCiclo1: "",
          metaCiclo2: "",
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
      navigate("/assessment");
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
      turmaId: selectedAluno?.turmaId || null,
      programId: selectedAluno?.programId || null,
      consultorId: selectedConsultorId ? parseInt(selectedConsultorId) : null,
      macroInicio,
      macroTermino,
      competencias: selectedComps.map(c => ({
        competenciaId: c.competenciaId,
        peso: c.peso,
        notaCorte: c.notaCorte,
        nivelAtual: c.nivelAtual ? parseFloat(c.nivelAtual) : null,
        metaFinal: c.metaFinal ? parseFloat(c.metaFinal) : null,
        metaCiclo1: c.metaCiclo1 ? parseFloat(c.metaCiclo1) : null,
        metaCiclo2: c.metaCiclo2 ? parseFloat(c.metaCiclo2) : null,
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

  const selectedTrilha = trilhas.find((t: any) => t.id === parseInt(selectedTrilhaId));

  // Expanded competencia detail state
  const [expandedComp, setExpandedComp] = useState<number | null>(null);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/assessment")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-secondary" />
              Novo Assessment
            </h1>
            {selectedAluno && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <User className="h-3.5 w-3.5" />
                {selectedAluno.name}
                {(selectedAluno as any).programName && <span className="text-muted-foreground/60">• {(selectedAluno as any).programName}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Contract Info Card (Item 2.3) */}
        <ContratoInfoCard contratos={contratos} alunoName={selectedAluno?.name || "este aluno"} tipoMentoria={selectedAluno?.tipoMentoria} aluno={selectedAluno} />

        {/* Step Indicator */}
        <StepIndicator currentStep={step} />

        {/* ============ STEP 1: Configuração ============ */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-secondary" />
                Configuração da Trilha
              </CardTitle>
              <CardDescription>
                Defina a trilha, mentora responsável e o período da Macro Jornada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-medium">Trilha *</Label>
                  <Select value={selectedTrilhaId} onValueChange={setSelectedTrilhaId}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione a trilha" />
                    </SelectTrigger>
                    <SelectContent>
                      {trilhas.map((t: any) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">Mentora Responsável</Label>
                  {isAdmin ? (
                    <Select value={selectedConsultorId} onValueChange={setSelectedConsultorId}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione a mentora" />
                      </SelectTrigger>
                      <SelectContent>
                        {mentores.map((m: any) => (
                          <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div>
                      <Input
                        value={mentores.find((m: any) => String(m.id) === selectedConsultorId)?.name || "Mentor vinculado"}
                        disabled
                        className="bg-muted cursor-not-allowed h-11"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Definido automaticamente</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="font-medium flex items-center gap-1.5 text-base">
                  <Calendar className="h-4 w-4 text-secondary" />
                  Macro Jornada (Duração da Trilha)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Data de Início *</Label>
                    <Input type="date" value={macroInicio} onChange={e => setMacroInicio(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Data de Término *</Label>
                    <Input type="date" value={macroTermino} onChange={e => setMacroTermino(e.target.value)} className="h-11" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center pt-2">
                <Button variant="outline" onClick={() => navigate("/assessment")} className="gap-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedTrilhaId || !macroInicio || !macroTermino}
                  className="bg-secondary hover:bg-secondary/90 gap-1.5"
                  size="lg"
                >
                  Próximo: Competências
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============ STEP 2: Competências com Nível e Meta ============ */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ListChecks className="h-5 w-5 text-secondary" />
                    Seleção de Competências
                  </CardTitle>
                  <CardDescription className="mt-1">
                    <span className="font-medium text-foreground">{selectedTrilha?.name}</span>
                    <span className="mx-2">•</span>
                    {macroInicio} → {macroTermino}
                  </CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>Selecionar todas</Button>
                  <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>Desmarcar todas</Button>
                  <Button variant="outline" size="sm" onClick={() => setAllPeso("obrigatoria")}>Todas obrigatórias</Button>
                  <Button variant="outline" size="sm" onClick={() => setAllPeso("opcional")}>Todas opcionais</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-12 text-center"></TableHead>
                      <TableHead className="text-sm font-semibold">Competência</TableHead>
                      <TableHead className="text-sm font-semibold text-center w-28">Peso</TableHead>
                      <TableHead className="text-sm font-semibold text-center w-24">Nível Identificado (%)</TableHead>
                      <TableHead className="text-sm font-semibold text-center w-24">Meta Final (%)</TableHead>
                      <TableHead className="text-sm font-semibold text-center w-36">Micro Início</TableHead>
                      <TableHead className="text-sm font-semibold text-center w-36">Micro Término</TableHead>
                      <TableHead className="text-sm font-semibold text-center w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competenciasConfig.map((comp, idx) => (
                      <>
                        <TableRow key={comp.competenciaId} className={`${!comp.selected ? "opacity-40 bg-muted/20" : "hover:bg-muted/10"}`}>
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
                          <TableCell className="font-medium">{comp.nome}</TableCell>
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
                              className="h-9 text-sm rounded-md border border-input bg-background px-2 w-full"
                            >
                              <option value="obrigatoria">Obrigatória</option>
                              <option value="opcional">Opcional</option>
                            </select>
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              placeholder="0"
                              value={comp.nivelAtual}
                              onChange={(e) => {
                                setCompetenciasConfig(prev => {
                                  const next = [...prev];
                                  next[idx] = { ...next[idx], nivelAtual: e.target.value };
                                  return next;
                                });
                              }}
                              disabled={!comp.selected}
                              className="h-9 text-center w-20 mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              placeholder="100"
                              value={comp.metaFinal}
                              onChange={(e) => {
                                setCompetenciasConfig(prev => {
                                  const next = [...prev];
                                  next[idx] = { ...next[idx], metaFinal: e.target.value };
                                  return next;
                                });
                              }}
                              disabled={!comp.selected}
                              className="h-9 text-center w-20 mx-auto"
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
                              className="h-9"
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
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={!comp.selected}
                              onClick={() => setExpandedComp(expandedComp === comp.competenciaId ? null : comp.competenciaId)}
                              title="Detalhes (metas por ciclo e justificativa)"
                            >
                              <ChevronRight className={`h-4 w-4 transition-transform ${expandedComp === comp.competenciaId ? "rotate-90" : ""}`} />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {/* Expanded row for meta ciclo1, ciclo2, justificativa */}
                        {expandedComp === comp.competenciaId && comp.selected && (
                          <TableRow key={`${comp.competenciaId}-detail`} className="bg-muted/10">
                            <TableCell colSpan={8}>
                              <div className="py-2 px-4 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Evolução no Período 1 (%)</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="1"
                                      placeholder="Ex: 50"
                                      value={comp.metaCiclo1}
                                      onChange={(e) => {
                                        setCompetenciasConfig(prev => {
                                          const next = [...prev];
                                          next[idx] = { ...next[idx], metaCiclo1: e.target.value };
                                          return next;
                                        });
                                      }}
                                      className="h-9"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Evolução no Período 2 (%)</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="1"
                                      placeholder="Ex: 80"
                                      value={comp.metaCiclo2}
                                      onChange={(e) => {
                                        setCompetenciasConfig(prev => {
                                          const next = [...prev];
                                          next[idx] = { ...next[idx], metaCiclo2: e.target.value };
                                          return next;
                                        });
                                      }}
                                      className="h-9"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Justificativa da Meta</Label>
                                    <Textarea
                                      placeholder="Justificativa para a meta definida..."
                                      value={comp.justificativa}
                                      onChange={(e) => {
                                        setCompetenciasConfig(prev => {
                                          const next = [...prev];
                                          next[idx] = { ...next[idx], justificativa: e.target.value };
                                          return next;
                                        });
                                      }}
                                      className="min-h-[60px] resize-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-3 text-sm text-muted-foreground flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                Micro Jornadas não podem ultrapassar as datas da Macro Jornada ({macroInicio} → {macroTermino})
              </div>

              <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                <Info className="h-4 w-4 text-blue-500 shrink-0" />
                Clique na seta à direita de cada competência para definir metas por ciclo e justificativa.
              </div>

              <Separator className="my-6" />

              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <div className="text-sm text-muted-foreground">
                  {competenciasConfig.filter(c => c.selected).length} de {competenciasConfig.length} competências selecionadas
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={competenciasConfig.filter(c => c.selected).length === 0 || criarMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                  size="lg"
                >
                  {criarMutation.isPending ? "Criando..." : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Criar Assessment e Liberar Trilha
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
