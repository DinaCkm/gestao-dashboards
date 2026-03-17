import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDateSafe } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectContentNoPortal, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Pencil,
  Save,
  Calendar,
  Target,
  User,
  BookOpen,
  Plus,
  Trash2,
  AlertTriangle,
  Building2,
  Users,
  Route,
  CheckCircle2,
  X,
} from "lucide-react";

interface EditAssessmentDialogProps {
  open: boolean;
  onClose: () => void;
  pdi: any; // The assessment PDI object with competencias
  trilhas: any[];
  programs: any[];
  mentores: any[];
  turmas?: any[];
  isAdmin: boolean;
  onSuccess: () => void;
}

export default function EditAssessmentDialog({
  open,
  onClose,
  pdi,
  trilhas,
  programs,
  mentores,
  turmas: turmasProp,
  isAdmin,
  onSuccess,
}: EditAssessmentDialogProps) {
  const [activeTab, setActiveTab] = useState("geral");

  // ===== General info state =====
  const [trilhaId, setTrilhaId] = useState(String(pdi.trilhaId));
  const [consultorId, setConsultorId] = useState(pdi.consultorId ? String(pdi.consultorId) : "");
  const [programId, setProgramId] = useState(pdi.programId ? String(pdi.programId) : "");
  const [turmaId, setTurmaId] = useState(pdi.turmaId ? String(pdi.turmaId) : "");
  const [macroInicio, setMacroInicio] = useState(formatDateForInput(pdi.macroInicio));
  const [macroTermino, setMacroTermino] = useState(formatDateForInput(pdi.macroTermino));
  const [observacoes, setObservacoes] = useState(pdi.observacoes || "");

  // ===== Competencias state =====
  const [editingComps, setEditingComps] = useState<Map<number, CompEdit>>(new Map());
  const [showAddComp, setShowAddComp] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // ===== Add competencia state =====
  const [addCompTrilhaId, setAddCompTrilhaId] = useState(String(pdi.trilhaId));
  const [selectedNewCompId, setSelectedNewCompId] = useState<string>("");
  const [newCompPeso, setNewCompPeso] = useState<"obrigatoria" | "opcional">("obrigatoria");
  const [newCompMicroInicio, setNewCompMicroInicio] = useState("");
  const [newCompMicroTermino, setNewCompMicroTermino] = useState("");

  // Fetch turmas
  const { data: turmasData = [] } = trpc.turmas.list.useQuery(
    programId ? { programId: parseInt(programId) } : undefined
  );
  const turmasList = turmasProp || turmasData;

  // Fetch competencias by trilha for adding
  const { data: competenciasTrilha = [] } = trpc.competencias.byTrilha.useQuery(
    { trilhaId: parseInt(addCompTrilhaId) },
    { enabled: !!addCompTrilhaId }
  );

  // All competencias for reference
  const { data: allCompetencias = [] } = trpc.competencias.list.useQuery();

  // Filter out already-added competencias
  const availableComps = useMemo(() => {
    const existingIds = new Set(pdi.competencias?.map((c: any) => c.competenciaId) || []);
    return competenciasTrilha.filter((c: any) => !existingIds.has(c.id));
  }, [competenciasTrilha, pdi.competencias]);

  // Mutations
  const updatePdiMutation = trpc.assessment.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Dados gerais do assessment atualizados!");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateCompMutation = trpc.assessment.atualizarCompetencia.useMutation({
    onSuccess: () => {
      toast.success("Competência atualizada!");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const addCompMutation = trpc.assessment.adicionarCompetencia.useMutation({
    onSuccess: () => {
      toast.success("Competência adicionada ao assessment!");
      setShowAddComp(false);
      setSelectedNewCompId("");
      setNewCompPeso("obrigatoria");
      setNewCompMicroInicio("");
      setNewCompMicroTermino("");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeCompMutation = trpc.assessment.removerCompetencia.useMutation({
    onSuccess: () => {
      toast.success("Competência removida do assessment!");
      setDeleteConfirmId(null);
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  // Update nível mutation (reuse existing)
  const updateNivelMutation = trpc.jornada.updateNivel.useMutation({
    onSuccess: () => {
      toast.success("Níveis e metas atualizados!");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  // ===== Handlers =====
  const handleSaveGeneral = () => {
    if (macroInicio && macroTermino && macroInicio >= macroTermino) {
      toast.error("Data de início deve ser anterior à data de término");
      return;
    }

    updatePdiMutation.mutate({
      pdiId: pdi.id,
      trilhaId: parseInt(trilhaId),
      consultorId: consultorId ? parseInt(consultorId) : null,
      programId: programId ? parseInt(programId) : null,
      turmaId: turmaId ? parseInt(turmaId) : null,
      macroInicio,
      macroTermino,
      observacoes: observacoes || null,
    });
  };

  const handleSaveCompetencia = (comp: any) => {
    const edit = editingComps.get(comp.id);
    if (!edit) return;

    // Save micro dates and peso via atualizarCompetencia
    updateCompMutation.mutate({
      id: comp.id,
      peso: edit.peso,
      microInicio: edit.microInicio || null,
      microTermino: edit.microTermino || null,
    });

    // Save níveis and metas via updateNivel
    updateNivelMutation.mutate({
      assessmentCompetenciaId: comp.id,
      nivelAtual: edit.nivelAtual ? parseFloat(edit.nivelAtual) : undefined,
      metaCiclo1: edit.metaCiclo1 ? parseFloat(edit.metaCiclo1) : undefined,
      metaCiclo2: edit.metaCiclo2 ? parseFloat(edit.metaCiclo2) : undefined,
      metaFinal: edit.metaFinal ? parseFloat(edit.metaFinal) : undefined,
      justificativa: edit.justificativa || undefined,
    });

    // Remove from editing state
    setEditingComps(prev => {
      const next = new Map(prev);
      next.delete(comp.id);
      return next;
    });
  };

  const startEditComp = (comp: any) => {
    setEditingComps(prev => {
      const next = new Map(prev);
      next.set(comp.id, {
        peso: comp.peso,
        microInicio: formatDateForInput(comp.microInicio),
        microTermino: formatDateForInput(comp.microTermino),
        nivelAtual: comp.nivelAtualEfetivo?.toString() || comp.nivelAtual?.toString() || "",
        metaCiclo1: comp.metaCiclo1?.toString() || "",
        metaCiclo2: comp.metaCiclo2?.toString() || "",
        metaFinal: comp.metaFinal?.toString() || "",
        justificativa: comp.justificativa || "",
      });
      return next;
    });
  };

  const cancelEditComp = (compId: number) => {
    setEditingComps(prev => {
      const next = new Map(prev);
      next.delete(compId);
      return next;
    });
  };

  const handleAddCompetencia = () => {
    if (!selectedNewCompId) {
      toast.error("Selecione uma competência");
      return;
    }
    addCompMutation.mutate({
      assessmentPdiId: pdi.id,
      competenciaId: parseInt(selectedNewCompId),
      peso: newCompPeso,
      microInicio: newCompMicroInicio || null,
      microTermino: newCompMicroTermino || null,
    });
  };

  const handleRemoveCompetencia = (compId: number) => {
    removeCompMutation.mutate({ assessmentCompetenciaId: compId });
  };

  const hasGeneralChanges = useMemo(() => {
    return (
      trilhaId !== String(pdi.trilhaId) ||
      consultorId !== (pdi.consultorId ? String(pdi.consultorId) : "") ||
      programId !== (pdi.programId ? String(pdi.programId) : "") ||
      turmaId !== (pdi.turmaId ? String(pdi.turmaId) : "") ||
      macroInicio !== formatDateForInput(pdi.macroInicio) ||
      macroTermino !== formatDateForInput(pdi.macroTermino) ||
      observacoes !== (pdi.observacoes || "")
    );
  }, [trilhaId, consultorId, programId, turmaId, macroInicio, macroTermino, observacoes, pdi]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-5xl max-h-[85vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-secondary" />
            Editar Assessment — {pdi.trilhaNome}
          </DialogTitle>
          <DialogDescription>
            Edite todas as informações do assessment: dados gerais, competências, datas e metas
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="geral" className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Dados Gerais
            </TabsTrigger>
            <TabsTrigger value="competencias" className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Competências ({pdi.competencias?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB: Dados Gerais ===== */}
          <TabsContent value="geral" className="flex-1 overflow-y-auto mt-4 max-h-[calc(85vh-220px)]">
            <div className="space-y-5 pr-1">
              {/* Trilha */}
              <div className="space-y-2">
                <Label className="font-medium flex items-center gap-1.5">
                  <Route className="h-3.5 w-3.5 text-muted-foreground" />
                  Trilha
                </Label>
                <Select value={trilhaId} onValueChange={setTrilhaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a trilha" />
                  </SelectTrigger>
                  <SelectContentNoPortal>
                    {trilhas.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContentNoPortal>
                </Select>
              </div>

              {/* Mentora */}
              <div className="space-y-2">
                <Label className="font-medium flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Mentora Responsável
                </Label>
                <Select value={consultorId} onValueChange={setConsultorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a mentora" />
                  </SelectTrigger>
                  <SelectContentNoPortal>
                    {mentores.map((m: any) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                    ))}
                  </SelectContentNoPortal>
                </Select>
              </div>

              {/* Empresa e Turma */}
              {isAdmin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      Empresa
                    </Label>
                    <Select value={programId} onValueChange={(v) => { setProgramId(v); setTurmaId(""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContentNoPortal>
                        {programs.map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                      </SelectContentNoPortal>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      Turma
                    </Label>
                    <Select value={turmaId} onValueChange={setTurmaId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                      <SelectContentNoPortal>
                        {turmasList.map((t: any) => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                        ))}
                      </SelectContentNoPortal>
                    </Select>
                  </div>
                </div>
              )}

              {/* Macro Jornada */}
              <div className="space-y-2">
                <Label className="font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
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

              {/* Observações */}
              <div className="space-y-2">
                <Label className="font-medium">Observações</Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações sobre o assessment..."
                  className="h-20 resize-none"
                />
              </div>

              {/* Save button */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveGeneral}
                  disabled={updatePdiMutation.isPending || !hasGeneralChanges}
                  className="bg-secondary hover:bg-secondary/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updatePdiMutation.isPending ? "Salvando..." : "Salvar Dados Gerais"}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB: Competências ===== */}
          <TabsContent value="competencias" className="flex-1 flex flex-col mt-4 min-h-0 max-h-[calc(85vh-220px)]">
            {/* Add competencia button */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                {pdi.competencias?.length || 0} competências vinculadas
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddComp(!showAddComp)}
                className="text-secondary border-secondary/30 hover:bg-secondary/10"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar Competência
              </Button>
            </div>

            {/* Add competencia form */}
            {showAddComp && (
              <Card className="mb-3 border-secondary/30 bg-secondary/5">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Plus className="h-4 w-4 text-secondary" />
                    Nova Competência
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Trilha (para filtrar)</Label>
                      <Select value={addCompTrilhaId} onValueChange={setAddCompTrilhaId}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContentNoPortal>
                          {trilhas.map((t: any) => (
                            <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                          ))}
                        </SelectContentNoPortal>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Competência</Label>
                      <Select value={selectedNewCompId} onValueChange={setSelectedNewCompId}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContentNoPortal>
                          {availableComps.length === 0 ? (
                            <SelectItem value="__none" disabled>Nenhuma disponível</SelectItem>
                          ) : (
                            availableComps.map((c: any) => (
                              <SelectItem key={c.id} value={String(c.id)}>{c.nome || c.name}</SelectItem>
                            ))
                          )}
                        </SelectContentNoPortal>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Peso</Label>
                      <select
                        value={newCompPeso}
                        onChange={(e) => setNewCompPeso(e.target.value as "obrigatoria" | "opcional")}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="obrigatoria">Obrigatória</option>
                        <option value="opcional">Opcional</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Micro Início</Label>
                      <Input
                        type="date"
                        value={newCompMicroInicio}
                        min={macroInicio}
                        max={macroTermino}
                        onChange={(e) => setNewCompMicroInicio(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Micro Término</Label>
                      <Input
                        type="date"
                        value={newCompMicroTermino}
                        min={newCompMicroInicio || macroInicio}
                        max={macroTermino}
                        onChange={(e) => setNewCompMicroTermino(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setShowAddComp(false)}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddCompetencia}
                      disabled={addCompMutation.isPending || !selectedNewCompId || selectedNewCompId === "__none"}
                      className="bg-secondary hover:bg-secondary/90"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      {addCompMutation.isPending ? "Adicionando..." : "Adicionar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Competencias list */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="space-y-3">
                {(pdi.competencias || []).map((comp: any) => {
                  const isEditing = editingComps.has(comp.id);
                  const edit = editingComps.get(comp.id);
                  const isConfirmingDelete = deleteConfirmId === comp.id;

                  return (
                    <Card key={comp.id} className="border-gray-200">
                      <CardContent className="p-4">
                        {isEditing && edit ? (
                          /* ===== EDIT MODE ===== */
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                <Target className="h-4 w-4 text-secondary" />
                                {comp.competenciaNome}
                              </h4>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => cancelEditComp(comp.id)} className="h-7 px-2">
                                  <X className="h-3.5 w-3.5 mr-1" />
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveCompetencia(comp)}
                                  disabled={updateCompMutation.isPending || updateNivelMutation.isPending}
                                  className="h-7 px-2 bg-secondary hover:bg-secondary/90"
                                >
                                  <Save className="h-3.5 w-3.5 mr-1" />
                                  Salvar
                                </Button>
                              </div>
                            </div>

                            {/* Peso and Micro dates */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Peso</Label>
                                <select
                                  value={edit.peso}
                                  onChange={(e) => {
                                    setEditingComps(prev => {
                                      const next = new Map(prev);
                                      next.set(comp.id, { ...edit, peso: e.target.value as "obrigatoria" | "opcional" });
                                      return next;
                                    });
                                  }}
                                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                >
                                  <option value="obrigatoria">Obrigatória</option>
                                  <option value="opcional">Opcional</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Micro Jornada Início</Label>
                                <Input
                                  type="date"
                                  value={edit.microInicio}
                                  min={macroInicio}
                                  max={macroTermino}
                                  onChange={(e) => {
                                    setEditingComps(prev => {
                                      const next = new Map(prev);
                                      next.set(comp.id, { ...edit, microInicio: e.target.value });
                                      return next;
                                    });
                                  }}
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Micro Jornada Término</Label>
                                <Input
                                  type="date"
                                  value={edit.microTermino}
                                  min={edit.microInicio || macroInicio}
                                  max={macroTermino}
                                  onChange={(e) => {
                                    setEditingComps(prev => {
                                      const next = new Map(prev);
                                      next.set(comp.id, { ...edit, microTermino: e.target.value });
                                      return next;
                                    });
                                  }}
                                  className="h-9"
                                />
                              </div>
                            </div>

                            {/* Níveis and Metas */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Nível Atual (%)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={edit.nivelAtual}
                                  onChange={(e) => {
                                    setEditingComps(prev => {
                                      const next = new Map(prev);
                                      next.set(comp.id, { ...edit, nivelAtual: e.target.value });
                                      return next;
                                    });
                                  }}
                                  className="h-9"
                                  placeholder="0-100"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Meta Ciclo 1 (%)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={edit.metaCiclo1}
                                  onChange={(e) => {
                                    setEditingComps(prev => {
                                      const next = new Map(prev);
                                      next.set(comp.id, { ...edit, metaCiclo1: e.target.value });
                                      return next;
                                    });
                                  }}
                                  className="h-9"
                                  placeholder="0-100"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Meta Ciclo 2 (%)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={edit.metaCiclo2}
                                  onChange={(e) => {
                                    setEditingComps(prev => {
                                      const next = new Map(prev);
                                      next.set(comp.id, { ...edit, metaCiclo2: e.target.value });
                                      return next;
                                    });
                                  }}
                                  className="h-9"
                                  placeholder="0-100"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Meta Final (%)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={edit.metaFinal}
                                  onChange={(e) => {
                                    setEditingComps(prev => {
                                      const next = new Map(prev);
                                      next.set(comp.id, { ...edit, metaFinal: e.target.value });
                                      return next;
                                    });
                                  }}
                                  className="h-9"
                                  placeholder="0-100"
                                />
                              </div>
                            </div>

                            {/* Justificativa */}
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Justificativa da Mentora</Label>
                              <Textarea
                                value={edit.justificativa}
                                onChange={(e) => {
                                  setEditingComps(prev => {
                                    const next = new Map(prev);
                                    next.set(comp.id, { ...edit, justificativa: e.target.value });
                                    return next;
                                  });
                                }}
                                placeholder="Justificativa para a meta definida..."
                                className="h-16 resize-none text-sm"
                              />
                            </div>
                          </div>
                        ) : (
                          /* ===== VIEW MODE ===== */
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm">{comp.competenciaNome}</h4>
                                <Badge variant={comp.peso === "obrigatoria" ? "default" : "outline"} className="text-[10px]">
                                  {comp.peso === "obrigatoria" ? "Obrigatória" : "Opcional"}
                                </Badge>
                                {comp.nivelAutomatico && (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-blue-300 text-blue-600 bg-blue-50">
                                    Automático
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => startEditComp(comp)} className="h-7 w-7 p-0">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                {isConfirmingDelete ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-red-600 font-medium">Confirmar?</span>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleRemoveCompetencia(comp.id)}
                                      disabled={removeCompMutation.isPending}
                                      className="h-7 px-2 text-xs"
                                    >
                                      {removeCompMutation.isPending ? "..." : "Sim"}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)} className="h-7 px-2 text-xs">
                                      Não
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteConfirmId(comp.id)}
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Info grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                              <div>
                                <span className="text-muted-foreground">Micro Início:</span>{" "}
                                <span className="font-medium">{formatDateDisplay(comp.microInicio)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Micro Término:</span>{" "}
                                <span className="font-medium">{formatDateDisplay(comp.microTermino)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Nível Atual:</span>{" "}
                                <span className="font-medium">{comp.nivelAtualEfetivo ?? comp.nivelAtual ?? "—"}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Meta Final:</span>{" "}
                                <span className="font-medium">{comp.metaFinal ?? "—"}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Meta C1:</span>{" "}
                                <span className="font-medium">{comp.metaCiclo1 ?? "—"}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Meta C2:</span>{" "}
                                <span className="font-medium">{comp.metaCiclo2 ?? "—"}%</span>
                              </div>
                            </div>

                            {comp.justificativa && (
                              <p className="text-xs text-muted-foreground italic border-l-2 border-secondary/30 pl-2 mt-1">
                                {comp.justificativa}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {(!pdi.competencias || pdi.competencias.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma competência vinculada</p>
                    <p className="text-xs mt-1">Clique em "Adicionar Competência" para começar</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== Helper types and functions =====
interface CompEdit {
  peso: "obrigatoria" | "opcional";
  microInicio: string;
  microTermino: string;
  nivelAtual: string;
  metaCiclo1: string;
  metaCiclo2: string;
  metaFinal: string;
  justificativa: string;
}

function formatDateForInput(d: any): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function formatDateDisplay(d: any): string {
  return formatDateSafe(d);
}
