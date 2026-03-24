import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  DollarSign, Plus, Pencil, Trash2, Loader2, AlertTriangle, Info, Building2, UserCheck, Filter, X
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const TIPO_SESSAO_LABELS: Record<string, string> = {
  individual_normal: "Individual — Normal",
  individual_assessment: "Individual — Assessment",
  grupo_normal: "Grupo — Normal",
  grupo_assessment: "Grupo — Assessment",
};

const TIPO_SESSAO_OPTIONS = [
  { value: "individual_normal", label: "Individual — Normal" },
  { value: "individual_assessment", label: "Individual — Assessment" },
  { value: "grupo_normal", label: "Grupo — Normal" },
  { value: "grupo_assessment", label: "Grupo — Assessment" },
];

export default function PrecificacaoSessoes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [filterMentor, setFilterMentor] = useState<string>("todos");
  const [filterEmpresa, setFilterEmpresa] = useState<string>("todos");

  // Form state
  const [formProgramId, setFormProgramId] = useState<string>("");
  const [formConsultorId, setFormConsultorId] = useState<string>("");
  const [formTipoSessao, setFormTipoSessao] = useState<string>("individual_normal");
  const [formValor, setFormValor] = useState<string>("");
  const [formDescricao, setFormDescricao] = useState<string>("");
  const [formValidoDesde, setFormValidoDesde] = useState<string>("");
  const [formValidoAte, setFormValidoAte] = useState<string>("");

  // Queries
  const { data: rules, isLoading, refetch } = trpc.mentor.getPricingRulesV2.useQuery();
  const { data: mentores } = trpc.admin.listMentores.useQuery();
  const { data: empresas } = trpc.admin.listEmpresas.useQuery();

  // Mutations
  const createMutation = trpc.mentor.createPricingRuleV2.useMutation({
    onSuccess: () => {
      toast.success("Regra de precificação criada com sucesso!");
      refetch();
      handleCloseDialog();
    },
    onError: (err) => toast.error(`Erro ao criar regra: ${err.message}`),
  });

  const updateMutation = trpc.mentor.updatePricingRuleV2.useMutation({
    onSuccess: () => {
      toast.success("Regra atualizada com sucesso!");
      refetch();
      handleCloseDialog();
    },
    onError: (err) => toast.error(`Erro ao atualizar: ${err.message}`),
  });

  const deleteMutation = trpc.mentor.deletePricingRuleV2.useMutation({
    onSuccess: () => {
      toast.success("Regra desativada com sucesso!");
      refetch();
    },
    onError: (err) => toast.error(`Erro ao desativar: ${err.message}`),
  });

  // Filtered rules
  const filteredRules = useMemo(() => {
    if (!rules) return [];
    return rules.filter(r => {
      if (filterMentor !== "todos" && String(r.consultorId) !== filterMentor) return false;
      if (filterEmpresa !== "todos" && String(r.programId) !== filterEmpresa) return false;
      return true;
    });
  }, [rules, filterMentor, filterEmpresa]);

  // Unique mentors and programs from rules for filter dropdowns
  const mentorOptions = useMemo(() => {
    if (!mentores) return [];
    return mentores.map((m: any) => ({ id: m.id, name: m.name }));
  }, [mentores]);

  const empresaOptions = useMemo(() => {
    if (!empresas) return [];
    return empresas.map((e: any) => ({ id: e.id, name: e.name }));
  }, [empresas]);

  const handleOpenNew = () => {
    setEditingRule(null);
    setFormProgramId("");
    setFormConsultorId("");
    setFormTipoSessao("individual_normal");
    setFormValor("");
    setFormDescricao("");
    setFormValidoDesde(new Date().toISOString().slice(0, 10));
    setFormValidoAte("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (rule: any) => {
    setEditingRule(rule);
    setFormProgramId(rule.programId ? String(rule.programId) : "");
    setFormConsultorId(rule.consultorId ? String(rule.consultorId) : "");
    setFormTipoSessao(rule.tipoSessao);
    setFormValor(rule.valor);
    setFormDescricao(rule.descricao || "");
    setFormValidoDesde(rule.validoDesde ? String(rule.validoDesde).slice(0, 10) : "");
    setFormValidoAte(rule.validoAte ? String(rule.validoAte).slice(0, 10) : "");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRule(null);
  };

  const handleSave = () => {
    if (!formValor || !formValidoDesde) {
      toast.error("Valor e Data de Início são obrigatórios.");
      return;
    }

    const data = {
      programId: formProgramId ? Number(formProgramId) : null,
      consultorId: formConsultorId ? Number(formConsultorId) : null,
      tipoSessao: formTipoSessao as any,
      valor: formValor,
      descricao: formDescricao || undefined,
      validoDesde: formValidoDesde,
      validoAte: formValidoAte || null,
    };

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Deseja desativar esta regra de precificação?")) {
      deleteMutation.mutate({ id });
    }
  };

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="h-7 w-7 text-[#1E3A5F]" />
          Precificação de Sessões V2
        </h1>
        <p className="text-gray-500 mt-1">
          Configure valores por empresa, mentor, tipo de sessão e modalidade com validade temporal.
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-medium">Regras de Prioridade na Precificação:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
                <li><strong>Empresa + Mentor</strong> — regra mais específica (ex: SEBRAE + Ana Carolina)</li>
                <li><strong>Só Mentor</strong> — valor padrão do mentor para qualquer empresa</li>
                <li><strong>Só Empresa</strong> — valor padrão da empresa para qualquer mentor</li>
                <li><strong>Fallback Legado</strong> — precificação por faixa de sessão (sistema antigo)</li>
              </ol>
              <p className="text-blue-600 mt-2">
                Sessões grupais são cobradas uma única vez por agendamento (não multiplica por aluno).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters + Add Button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Mentor</label>
              <Select value={filterMentor} onValueChange={setFilterMentor}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Todos os mentores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os mentores</SelectItem>
                  {mentorOptions.map((m: any) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Empresa</label>
              <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as empresas</SelectItem>
                  {empresaOptions.map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(filterMentor !== "todos" || filterEmpresa !== "todos") && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterMentor("todos"); setFilterEmpresa("todos"); }} className="gap-1">
                <X className="h-4 w-4" /> Limpar
              </Button>
            )}
            <div className="ml-auto">
              <Button onClick={handleOpenNew} className="gap-2 bg-[#1E3A5F] hover:bg-[#152d4a]">
                <Plus className="h-4 w-4" /> Nova Regra
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Regras de Precificação</CardTitle>
          <CardDescription>
            {filteredRules.length} regra(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma regra de precificação cadastrada</p>
              <p className="text-sm mt-1">Clique em "Nova Regra" para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Tipo de Sessão</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule: any) => {
                    const isActive = rule.isActive === 1;
                    const hoje = new Date().toISOString().slice(0, 10);
                    const vigente = isActive && 
                      (!rule.validoDesde || String(rule.validoDesde).slice(0, 10) <= hoje) && 
                      (!rule.validoAte || String(rule.validoAte).slice(0, 10) >= hoje);

                    return (
                      <TableRow key={rule.id} className={!isActive ? "opacity-50" : ""}>
                        <TableCell>
                          {rule.programNome ? (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5 text-gray-400" />
                              {rule.programNome}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Todas</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {rule.consultorNome ? (
                            <span className="flex items-center gap-1">
                              <UserCheck className="h-3.5 w-3.5 text-gray-400" />
                              {rule.consultorNome}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Todos</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {TIPO_SESSAO_LABELS[rule.tipoSessao] || rule.tipoSessao}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-emerald-700">
                          {formatCurrency(rule.valor)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span>
                            {rule.validoDesde ? new Date(rule.validoDesde + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                          </span>
                          <span className="text-gray-400 mx-1">→</span>
                          <span>
                            {rule.validoAte ? new Date(rule.validoAte + 'T12:00:00').toLocaleDateString('pt-BR') : 'Indefinido'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {vigente ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Vigente</Badge>
                          ) : !isActive ? (
                            <Badge variant="secondary" className="text-gray-500">Inativa</Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-700 border-amber-300">Fora de vigência</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                          {rule.descricao || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(rule)} title="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {isActive && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(rule.id)} title="Desativar">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criação/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#1E3A5F]" />
              {editingRule ? "Editar Regra de Precificação" : "Nova Regra de Precificação"}
            </DialogTitle>
            <DialogDescription>
              Defina o valor para uma combinação específica de empresa, mentor e tipo de sessão.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Empresa */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Empresa (opcional)</label>
              <Select value={formProgramId || "none"} onValueChange={(v) => setFormProgramId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas as empresas (regra global)</SelectItem>
                  {empresaOptions.map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mentor */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Mentor (opcional)</label>
              <Select value={formConsultorId || "none"} onValueChange={(v) => setFormConsultorId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os mentores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos os mentores (regra global)</SelectItem>
                  {mentorOptions.map((m: any) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Sessão */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Tipo de Sessão</label>
              <Select value={formTipoSessao} onValueChange={setFormTipoSessao}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_SESSAO_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Valor (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formValor}
                onChange={(e) => setFormValor(e.target.value)}
              />
            </div>

            {/* Vigência */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Válido desde</label>
                <Input
                  type="date"
                  value={formValidoDesde}
                  onChange={(e) => setFormValidoDesde(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Válido até (opcional)</label>
                <Input
                  type="date"
                  value={formValidoAte}
                  onChange={(e) => setFormValidoAte(e.target.value)}
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Descrição (opcional)</label>
              <Input
                placeholder="Ex: Contrato 2026, Assessment trimestral..."
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[#1E3A5F] hover:bg-[#152d4a]"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
              ) : editingRule ? "Salvar Alterações" : "Criar Regra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
