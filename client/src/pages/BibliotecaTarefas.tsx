import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  Library,
  Plus,
  Search,
  Pencil,
  BookOpen,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Target,
  Gift,
} from "lucide-react";

type TaskItem = {
  id: number;
  competencia: string;
  nome: string;
  resumo: string | null;
  oQueFazer: string | null;
  oQueGanha: string | null;
  isActive: number;
  createdAt: Date;
};

type FormData = {
  competencia: string;
  nome: string;
  resumo: string;
  oQueFazer: string;
  oQueGanha: string;
};

const emptyForm: FormData = {
  competencia: "",
  nome: "",
  resumo: "",
  oQueFazer: "",
  oQueGanha: "",
};

export default function BibliotecaTarefas() {
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showInactive, setShowInactive] = useState(false);

  const utils = trpc.useUtils();
  const { data: tasks, isLoading } = trpc.taskLibrary.list.useQuery();

  const createMutation = trpc.taskLibrary.create.useMutation({
    onSuccess: () => {
      toast.success("Tarefa criada com sucesso!");
      utils.taskLibrary.list.invalidate();
      handleCloseDialog();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.taskLibrary.update.useMutation({
    onSuccess: () => {
      toast.success("Tarefa atualizada com sucesso!");
      utils.taskLibrary.list.invalidate();
      handleCloseDialog();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.taskLibrary.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      utils.taskLibrary.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Agrupar tarefas por competência
  const groupedTasks = useMemo(() => {
    if (!tasks) return {};
    const filtered = tasks.filter((t: TaskItem) => {
      const matchSearch =
        !search ||
        t.competencia.toLowerCase().includes(search.toLowerCase()) ||
        t.nome.toLowerCase().includes(search.toLowerCase());
      const matchActive = showInactive || t.isActive === 1;
      return matchSearch && matchActive;
    });

    const groups: Record<string, TaskItem[]> = {};
    filtered.forEach((t: TaskItem) => {
      if (!groups[t.competencia]) groups[t.competencia] = [];
      groups[t.competencia].push(t);
    });

    // Ordenar por nome da competência
    const sorted: Record<string, TaskItem[]> = {};
    Object.keys(groups)
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .forEach((key) => {
        sorted[key] = groups[key];
      });
    return sorted;
  }, [tasks, search, showInactive]);

  const competencias = Object.keys(groupedTasks);
  const totalTarefas = tasks?.length ?? 0;
  const tarefasAtivas = tasks?.filter((t: TaskItem) => t.isActive === 1).length ?? 0;

  function handleOpenCreate() {
    setEditingTask(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function handleOpenEdit(task: TaskItem) {
    setEditingTask(task);
    setForm({
      competencia: task.competencia,
      nome: task.nome,
      resumo: task.resumo ?? "",
      oQueFazer: task.oQueFazer ?? "",
      oQueGanha: task.oQueGanha ?? "",
    });
    setShowDialog(true);
  }

  function handleCloseDialog() {
    setTimeout(() => {
      setShowDialog(false);
      setEditingTask(null);
      setForm(emptyForm);
    }, 100);
  }

  function handleSubmit() {
    if (!form.competencia.trim() || !form.nome.trim()) {
      toast.error("Competência e Nome são obrigatórios");
      return;
    }

    const payload = {
      competencia: form.competencia.trim(),
      nome: form.nome.trim(),
      resumo: form.resumo.trim() || null,
      oQueFazer: form.oQueFazer.trim() || null,
      oQueGanha: form.oQueGanha.trim() || null,
    };

    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleToggleActive(task: TaskItem) {
    toggleMutation.mutate({
      id: task.id,
      isActive: task.isActive === 1 ? 0 : 1,
    });
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Library className="h-7 w-7 text-primary" />
            Biblioteca de Tarefas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as ações e desafios disponíveis para atribuição nas mentorias e assessments
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTarefas}</p>
                <p className="text-sm text-muted-foreground">Total de Tarefas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tarefasAtivas}</p>
                <p className="text-sm text-muted-foreground">Tarefas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{competencias.length}</p>
                <p className="text-sm text-muted-foreground">Competências</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por competência ou nome da tarefa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive" className="text-sm whitespace-nowrap">
                Mostrar inativas
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks by Competency */}
      {competencias.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhuma tarefa encontrada
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? "Tente ajustar o filtro de busca"
                : "Clique em 'Nova Tarefa' para adicionar a primeira"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {competencias.map((comp) => (
            <AccordionItem
              key={comp}
              value={comp}
              className="border rounded-lg px-0 overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3 text-left">
                  <Badge variant="secondary" className="font-medium">
                    {comp}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {groupedTasks[comp].length}{" "}
                    {groupedTasks[comp].length === 1 ? "tarefa" : "tarefas"}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                {groupedTasks[comp].map((task, idx) => (
                  <div key={task.id}>
                    {idx > 0 && <Separator />}
                    <div
                      className={`px-6 py-4 ${
                        task.isActive === 0 ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-base">
                              {task.nome}
                            </h3>
                            {task.isActive === 0 && (
                              <Badge variant="outline" className="text-xs text-red-500 border-red-300">
                                Inativa
                              </Badge>
                            )}
                          </div>

                          {task.resumo && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {task.resumo}
                            </p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            {task.oQueFazer && (
                              <div className="flex gap-2 text-sm">
                                <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-medium text-foreground">
                                    O que fazer:
                                  </span>
                                  <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap">
                                    {task.oQueFazer}
                                  </p>
                                </div>
                              </div>
                            )}
                            {task.oQueGanha && (
                              <div className="flex gap-2 text-sm">
                                <Gift className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-medium text-foreground">
                                    O que ganha:
                                  </span>
                                  <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap">
                                    {task.oQueGanha}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(task)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={task.isActive === 1}
                            onCheckedChange={() => handleToggleActive(task)}
                            title={
                              task.isActive === 1
                                ? "Desativar tarefa"
                                : "Ativar tarefa"
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
            </DialogTitle>
            <DialogDescription>
              {editingTask
                ? "Atualize os dados da tarefa abaixo"
                : "Preencha os dados para criar uma nova tarefa na biblioteca"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="competencia">
                Competência <span className="text-red-500">*</span>
              </Label>
              <Input
                id="competencia"
                placeholder="Ex: Liderança, Comunicação, Gestão do Tempo..."
                value={form.competencia}
                onChange={(e) =>
                  setForm((f) => ({ ...f, competencia: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome da Tarefa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome"
                placeholder="Ex: Feedback 360° Simplificado"
                value={form.nome}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nome: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resumo">Resumo</Label>
              <Textarea
                id="resumo"
                placeholder="Breve descrição da tarefa..."
                value={form.resumo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, resumo: e.target.value }))
                }
                rows={2}
                className="overflow-auto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oQueFazer">O que fazer</Label>
              <Textarea
                id="oQueFazer"
                placeholder="Descreva as ações que o aluno deve realizar..."
                value={form.oQueFazer}
                onChange={(e) =>
                  setForm((f) => ({ ...f, oQueFazer: e.target.value }))
                }
                rows={4}
                className="overflow-auto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oQueGanha">O que ganha</Label>
              <Textarea
                id="oQueGanha"
                placeholder="Descreva os benefícios e ganhos ao completar a tarefa..."
                value={form.oQueGanha}
                onChange={(e) =>
                  setForm((f) => ({ ...f, oQueGanha: e.target.value }))
                }
                rows={4}
                className="overflow-auto"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Salvando..."
                : editingTask
                ? "Salvar Alterações"
                : "Criar Tarefa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
