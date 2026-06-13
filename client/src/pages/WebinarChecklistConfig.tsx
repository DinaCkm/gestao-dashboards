import { useState } from "react";
import { trpc } from "../utils/trpc";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  organizacao: "Organização",
  marketing: "Marketing",
  administrativo: "Administrativo",
  coordenacao: "Coordenação",
  palestrante: "Palestrante",
  solicitante: "Solicitante",
};

const ROLE_COLORS: Record<string, string> = {
  organizacao: "bg-blue-100 text-blue-700",
  marketing: "bg-purple-100 text-purple-700",
  administrativo: "bg-orange-100 text-orange-700",
  coordenacao: "bg-teal-100 text-teal-700",
  palestrante: "bg-pink-100 text-pink-700",
  solicitante: "bg-gray-100 text-gray-700",
};

type Template = {
  id: number;
  title: string;
  description: string | null;
  daysOffset: number;
  defaultRole: string;
  isCritical: number;
  sortOrder: number;
  isActive: number;
};

const emptyForm = {
  title: "",
  description: "",
  daysOffset: -7,
  defaultRole: "organizacao" as string,
  isCritical: 1,
};

function formatDaysOffset(offset: number): string {
  if (offset === 0) return "Dia do evento";
  if (offset > 0) return `D+${offset}`;
  return `D${offset}`;
}

export default function WebinarChecklistConfig() {
  const { data: templates, isLoading, refetch } = trpc.webinarTaskTemplates.list.useQuery();

  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Template | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showInactive, setShowInactive] = useState(false);

  const createMutation = trpc.webinarTaskTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Tarefa criada com sucesso!");
      setShowDialog(false);
      setForm(emptyForm);
      refetch();
    },
    onError: (err) => toast.error(`Erro ao criar: ${err.message}`),
  });

  const updateMutation = trpc.webinarTaskTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Tarefa atualizada com sucesso!");
      setShowDialog(false);
      setEditingTemplate(null);
      setForm(emptyForm);
      refetch();
    },
    onError: (err) => toast.error(`Erro ao atualizar: ${err.message}`),
  });

  const deleteMutation = trpc.webinarTaskTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Tarefa removida do template!");
      setDeleteConfirm(null);
      refetch();
    },
    onError: (err) => toast.error(`Erro ao remover: ${err.message}`),
  });

  const toggleActiveMutation = trpc.webinarTaskTemplates.update.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const handleOpenEdit = (tpl: Template) => {
    setEditingTemplate(tpl);
    setForm({
      title: tpl.title,
      description: tpl.description || "",
      daysOffset: tpl.daysOffset,
      defaultRole: tpl.defaultRole,
      isCritical: tpl.isCritical,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }
    if (editingTemplate) {
      updateMutation.mutate({
        id: editingTemplate.id,
        title: form.title,
        description: form.description,
        daysOffset: form.daysOffset,
        defaultRole: form.defaultRole as any,
        isCritical: form.isCritical,
      });
    } else {
      createMutation.mutate({
        title: form.title,
        description: form.description,
        daysOffset: form.daysOffset,
        defaultRole: form.defaultRole as any,
        isCritical: form.isCritical,
        sortOrder: (templates?.length ?? 0) + 1,
      });
    }
  };

  const handleToggleActive = (tpl: Template) => {
    toggleActiveMutation.mutate({
      id: tpl.id,
      isActive: tpl.isActive === 1 ? 0 : 1,
    });
  };

  const activeTemplates = templates?.filter((t) => t.isActive === 1) ?? [];
  const inactiveTemplates = templates?.filter((t) => t.isActive === 0) ?? [];
  const displayTemplates = showInactive ? templates ?? [] : activeTemplates;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Template do Checklist de Webinar</h1>
            <p className="text-sm text-muted-foreground">
              Configure as tarefas padrão geradas automaticamente para cada novo webinar
            </p>
          </div>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{activeTemplates.length}</p>
          <p className="text-sm text-muted-foreground">Tarefas ativas</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {activeTemplates.filter((t) => t.isCritical).length}
          </p>
          <p className="text-sm text-muted-foreground">Tarefas críticas</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-500">{inactiveTemplates.length}</p>
          <p className="text-sm text-muted-foreground">Tarefas inativas</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Tarefas do Template
          </h2>
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showInactive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showInactive ? "Ocultar inativas" : `Ver inativas (${inactiveTemplates.length})`}
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : displayTemplates.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma tarefa no template. Clique em "Nova Tarefa" para adicionar.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-20">Prazo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tarefa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-36">Responsável</th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-20">Crítica</th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-24">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {displayTemplates.map((tpl, idx) => (
                <tr
                  key={tpl.id}
                  className={`border-b last:border-0 hover:bg-gray-50/50 transition-colors ${
                    tpl.isActive === 0 ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className={`font-mono text-sm font-semibold ${
                      tpl.daysOffset < 0 ? "text-blue-700" :
                      tpl.daysOffset > 0 ? "text-orange-600" : "text-green-600"
                    }`}>
                      {formatDaysOffset(tpl.daysOffset)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      {tpl.isCritical === 1 && (
                        <span className="mt-0.5 h-2 w-2 rounded-full bg-red-500 flex-shrink-0" title="Tarefa crítica" />
                      )}
                      <div>
                        <p className="font-medium">{tpl.title}</p>
                        {tpl.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tpl.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[tpl.defaultRole] || "bg-gray-100 text-gray-700"}`}>
                      {ROLE_LABELS[tpl.defaultRole] || tpl.defaultRole}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {tpl.isCritical === 1 ? (
                      <AlertTriangle className="h-4 w-4 text-red-500 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(tpl)}
                      title={tpl.isActive === 1 ? "Desativar tarefa" : "Ativar tarefa"}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                        tpl.isActive === 1
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {tpl.isActive === 1 ? (
                        <><CheckCircle2 className="h-3 w-3" /> Ativa</>
                      ) : (
                        <><EyeOff className="h-3 w-3" /> Inativa</>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleOpenEdit(tpl)}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteConfirm(tpl)}
                        title="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Legenda */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-semibold text-blue-700">D-30</span>
          <span>= 30 dias antes do evento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-semibold text-green-600">D0</span>
          <span>= dia do evento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-semibold text-orange-600">D+2</span>
          <span>= 2 dias após o evento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span>Tarefa crítica (impacta nível de risco)</span>
        </div>
      </div>

      {/* Dialog Criar/Editar */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); setEditingTemplate(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Editar Tarefa do Template" : "Nova Tarefa do Template"}</DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Altere os dados da tarefa. As mudanças valem para novos webinars criados a partir de agora."
                : "Adicione uma nova tarefa ao template. Ela será gerada automaticamente em todos os novos webinars."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Título */}
            <div>
              <label className="text-sm font-medium mb-1 block">Título da Tarefa *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Confirmar palestrante"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="text-sm font-medium mb-1 block">Descrição / Instruções</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descreva o que precisa ser feito nesta tarefa..."
                rows={3}
              />
            </div>

            {/* Prazo (D+/-) e Role */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Prazo (dias em relação ao evento)
                </label>
                <Input
                  type="number"
                  value={form.daysOffset}
                  onChange={(e) => setForm({ ...form, daysOffset: parseInt(e.target.value) || 0 })}
                  placeholder="-7"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Negativo = antes do evento (ex: -7 = D-7). Positivo = após (ex: 2 = D+2).
                </p>
                {form.daysOffset !== 0 && (
                  <p className="text-xs font-semibold mt-1 text-primary">
                    → {formatDaysOffset(form.daysOffset)}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Responsável padrão</label>
                <Select
                  value={form.defaultRole}
                  onValueChange={(v) => setForm({ ...form, defaultRole: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Crítica */}
            <div>
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  type="checkbox"
                  checked={form.isCritical === 1}
                  onChange={(e) => setForm({ ...form, isCritical: e.target.checked ? 1 : 0 })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <span className="font-medium text-sm">Tarefa crítica</span>
                  <p className="text-xs text-muted-foreground">
                    Tarefas críticas atrasadas elevam o nível de risco do webinar para Alto
                  </p>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditingTemplate(null); setForm(emptyForm); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Salvando..."
                : editingTemplate ? "Salvar Alterações" : "Criar Tarefa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover Tarefa do Template</DialogTitle>
            <DialogDescription>
              A tarefa <strong>"{deleteConfirm?.title}"</strong> será desativada e não será mais gerada em novos webinars. Webinars já criados não são afetados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate({ id: deleteConfirm.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
