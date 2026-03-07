import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Calendar,
  Target,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  ListChecks,
  BarChart3,
  User,
} from "lucide-react";

// ============ Progress Bar ============
function ProgressBar({ value, meta }: { value: number; meta?: number }) {
  const getColor = (v: number) => {
    if (v >= 75) return "bg-emerald-500";
    if (v >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
          <div className={`h-full rounded-full ${getColor(value)}`} style={{ width: `${Math.min(value, 100)}%` }} />
          {meta && (
            <div
              className="absolute top-0 h-full w-0.5 bg-gray-400"
              style={{ left: `${Math.min(meta, 100)}%` }}
            />
          )}
        </div>
        <span className="text-xs font-semibold w-10 text-right">{value}%</span>
      </div>
    </div>
  );
}

// ============ Step Indicator ============
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, title: "Configuração", icon: Calendar, description: "Trilha e período" },
    { number: 2, title: "Competências", icon: ListChecks, description: "Seleção e pesos" },
    { number: 3, title: "Níveis e Metas", icon: BarChart3, description: "Definir metas" },
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

  // Step 2/3 state
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

  // Get user's consultorId for non-admin
  const { data: userRecord } = trpc.auth.me.useQuery();
  const userConsultorId = (userRecord as any)?.consultorId;

  // Queries
  const { data: trilhas = [] } = trpc.trilhas.list.useQuery();
  const { data: mentores = [] } = trpc.mentor.list.useQuery();
  const { data: allPrograms = [] } = trpc.programs.list.useQuery(undefined, { enabled: isAdmin });

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

  const sidebarItems = isAdmin
    ? [{ label: "Assessment / PDI", icon: ClipboardCheck, href: "/assessment" }]
    : isManager
    ? [{ label: "Assessment / PDI", icon: ClipboardCheck, href: "/assessment" }]
    : [{ label: "Assessment / PDI", icon: ClipboardCheck, href: "/assessment" }];

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

        {/* ============ STEP 2: Competências ============ */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
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
                      <TableHead className="text-sm font-semibold text-center w-32">Peso</TableHead>
                      <TableHead className="text-sm font-semibold text-center w-44">Micro Jornada Início</TableHead>
                      <TableHead className="text-sm font-semibold text-center w-44">Micro Jornada Término</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competenciasConfig.map((comp, idx) => (
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
                            className="h-9 text-sm rounded-md border border-input bg-background px-3 w-full"
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-3 text-sm text-muted-foreground flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                Micro Jornadas não podem ultrapassar as datas da Macro Jornada ({macroInicio} → {macroTermino})
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
                  onClick={() => setStep(3)}
                  disabled={competenciasConfig.filter(c => c.selected).length === 0}
                  className="bg-secondary hover:bg-secondary/90 gap-1.5"
                  size="lg"
                >
                  Próximo: Níveis e Metas
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============ STEP 3: Níveis e Metas ============ */}
        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-secondary" />
                  Definir Níveis e Metas
                </CardTitle>
                <CardDescription>
                  <span className="font-medium text-foreground">{selectedTrilha?.name}</span>
                  <span className="mx-2">•</span>
                  {competenciasConfig.filter(c => c.selected).length} competências selecionadas
                </CardDescription>
              </CardHeader>
            </Card>

            {competenciasConfig.filter(c => c.selected).map((comp) => {
              const realIdx = competenciasConfig.findIndex(c => c.competenciaId === comp.competenciaId);
              return (
                <Card key={comp.competenciaId} className="border-l-4 border-l-secondary/50">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Target className="h-4 w-4 text-secondary" />
                        {comp.nome}
                      </h4>
                      <Badge variant={comp.peso === "obrigatoria" ? "default" : "outline"}>
                        {comp.peso === "obrigatoria" ? "Obrigatória" : "Opcional"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground">Nível Atual (%)</Label>
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
                          className="h-11"
                          placeholder="Ex: 42"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground">Meta Ciclo 1 (%)</Label>
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
                          className="h-11"
                          placeholder="Ex: 55"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground">Meta Ciclo 2 (%)</Label>
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
                          className="h-11"
                          placeholder="Ex: 65"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground">Meta Final (%)</Label>
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
                          className="h-11"
                          placeholder="Ex: 75"
                        />
                      </div>
                    </div>

                    {comp.nivelAtual && (
                      <ProgressBar
                        value={parseInt(comp.nivelAtual) || 0}
                        meta={parseInt(comp.metaFinal) || undefined}
                      />
                    )}

                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">Justificativa da Mentora</Label>
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
                        className="resize-none"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={criarMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                    size="lg"
                  >
                    {criarMutation.isPending ? "Criando..." : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Salvar e Liberar Trilha
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
