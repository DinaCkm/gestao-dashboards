import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const SUGESTOES_DEPARTAMENTO = [
  "Presidência",
  "Diretoria Executiva",
  "Recursos Humanos",
  "Desenvolvimento Humano e Organizacional",
  "Departamento Pessoal",
  "Financeiro",
  "Contabilidade",
  "Controladoria",
  "Jurídico",
  "Compliance",
  "Auditoria Interna",
  "Compras",
  "Suprimentos",
  "Operações",
  "Produção",
  "Logística",
  "Supply Chain",
  "Comercial",
  "Marketing",
  "Comunicação",
  "Atendimento ao Cliente",
  "Sucesso do Cliente",
  "Tecnologia da Informação",
  "Segurança da Informação",
  "Produtos",
  "Engenharia",
  "Pesquisa e Desenvolvimento",
  "Qualidade",
  "Processos e Melhoria Contínua",
  "Projetos / PMO",
  "Planejamento Estratégico",
  "Inteligência de Mercado / BI",
  "Dados e Analytics",
  "Sustentabilidade / ESG",
  "Saúde e Segurança do Trabalho",
  "Facilities",
  "Administração",
  "Patrimônio",
  "Treinamento e Desenvolvimento",
  "Recrutamento e Seleção",
  "Remuneração e Benefícios",
  "Relações Trabalhistas",
  "Relações Institucionais",
  "Governança Corporativa",
  "Novos Negócios",
  "Exportação e Importação",
  "Almoxarifado / Estoque",
  "Manutenção",
];
import { useLocation } from "wouter";
import { ArrowLeft, Network, Pencil, Power } from "lucide-react";

type FormState = {
  editingId: number | null;
  name: string;
  description: string;
  parentDepartmentId: string;
  managerId: string;
};

const emptyForm: FormState = {
  editingId: null,
  name: "",
  description: "",
  parentDepartmentId: "none",
  managerId: "none",
};

const NONE_VALUE = "none";

export default function EstruturaOrganizacional() {
  return (
    <DashboardLayout>
      <EstruturaOrganizacionalContent />
    </DashboardLayout>
  );
}

function EstruturaOrganizacionalContent() {
  const [, setLocation] = useLocation();
  const [programId, setProgramId] = useState<string>("");
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: empresas = [], isLoading: loadingEmpresas } = trpc.admin.listEmpresas.useQuery();
  const { data: gerentes = [], isLoading: loadingGerentes } = trpc.disc360.searchAlunosForSelection.useQuery(
    { programId: numericProgramId as number },
    { enabled: !!numericProgramId }
  );
  const [nomeCargo, setNomeCargo] = useState("");
  const [descricaoCargo, setDescricaoCargo] = useState("");
  const [editandoCargoId, setEditandoCargoId] = useState<number | null>(null);

  const {
    data: cargosLista = [],
    isLoading: loadingCargos,
    refetch: refetchCargos,
  } = trpc.cargos.list.useQuery(
    { programId: numericProgramId as number, includeInactive: true },
    { enabled: !!numericProgramId }
  );

  const createCargoMutation = trpc.cargos.create.useMutation({
    onSuccess: () => {
      toast.success("Cargo cadastrado com sucesso.");
      setNomeCargo("");
      setDescricaoCargo("");
      setEditandoCargoId(null);
      refetchCargos();
    },
    onError: (err) => toast.error("Erro ao cadastrar cargo: " + err.message),
  });

  const updateCargoMutation = trpc.cargos.update.useMutation({
    onSuccess: () => {
      toast.success("Cargo atualizado com sucesso.");
      setNomeCargo("");
      setDescricaoCargo("");
      setEditandoCargoId(null);
      refetchCargos();
    },
    onError: (err) => toast.error("Erro ao atualizar cargo: " + err.message),
  });

  const handleSubmitCargo = () => {
    if (!numericProgramId) {
      toast.error("Selecione um programa/empresa.");
      return;
    }
    if (!nomeCargo.trim()) {
      toast.error("Informe o nome do cargo.");
      return;
    }
    if (editandoCargoId) {
      updateCargoMutation.mutate({ id: editandoCargoId, name: nomeCargo.trim(), description: descricaoCargo.trim() || undefined });
    } else {
      createCargoMutation.mutate({ programId: numericProgramId, name: nomeCargo.trim(), description: descricaoCargo.trim() || undefined });
    }
  };

  const handleEditCargo = (cargo: any) => {
    setEditandoCargoId(cargo.id);
    setNomeCargo(cargo.name);
    setDescricaoCargo(cargo.description || "");
  };

  const handleToggleCargoAtivo = (cargo: any) => {
    updateCargoMutation.mutate({ id: cargo.id, isActive: cargo.isActive !== 1 });
  };

  const numericProgramId = programId ? Number(programId) : undefined;

  const { data: departamentos = [], isLoading: loadingDepartamentos, refetch: refetchDepartamentos } = trpc.departments.list.useQuery(
    { programId: numericProgramId as number, includeInactive: true },
    { enabled: !!numericProgramId }
  );

  const createMutation = trpc.departments.create.useMutation({
    onSuccess: () => {
      toast.success("Departamento cadastrado com sucesso!");
      setForm(emptyForm);
      refetchDepartamentos();
    },
    onError: (err) => toast.error("Erro ao cadastrar departamento: " + err.message),
  });

  const updateMutation = trpc.departments.update.useMutation({
    onSuccess: () => {
      toast.success("Departamento atualizado com sucesso!");
      setForm(emptyForm);
      refetchDepartamentos();
    },
    onError: (err) => toast.error("Erro ao atualizar departamento: " + err.message),
  });

  const resetForm = () => setForm(emptyForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericProgramId) {
      toast.error("Selecione um programa/empresa antes de cadastrar o departamento.");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Informe o nome do departamento.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      managerId: form.managerId !== NONE_VALUE ? Number(form.managerId) : null,
      parentDepartmentId: form.parentDepartmentId !== NONE_VALUE ? Number(form.parentDepartmentId) : null,
    };

    if (form.editingId) {
      updateMutation.mutate({ id: form.editingId, ...payload });
    } else {
      createMutation.mutate({ programId: numericProgramId, ...payload });
    }
  };

  const handleEdit = (dept: any) => {
    setForm({
      editingId: dept.id,
      name: dept.name || "",
      description: dept.description || "",
      parentDepartmentId: dept.parentDepartmentId ? String(dept.parentDepartmentId) : NONE_VALUE,
      managerId: dept.managerId ? String(dept.managerId) : NONE_VALUE,
    });
  };

  const handleToggleActive = (dept: any) => {
    updateMutation.mutate({ id: dept.id, isActive: dept.isActive !== 1 });
  };

  const getNomeDepartamentoPai = (parentId: number | null) => {
    if (!parentId) return "-";
    const pai = departamentos.find((d: any) => d.id === parentId);
    return pai ? pai.name : "-";
  };

  const getNomeLider = (managerId: number | null) => {
    if (!managerId) return "-";
    const lider = gerentes.find((g: any) => g.id === managerId);
    return lider ? lider.name : "-";
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/disc360")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Network className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estrutura Organizacional</h1>
          <p className="text-muted-foreground text-sm">Departamentos, hierarquia e líderes por empresa.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Programa/Empresa</CardTitle>
          <CardDescription>Selecione o programa/empresa para cadastrar ou visualizar os departamentos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={programId} onValueChange={(value) => { setProgramId(value); resetForm(); }}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder={loadingEmpresas ? "Carregando..." : "Selecione um programa/empresa"} />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((emp: any) => (
                <SelectItem key={emp.id} value={String(emp.id)}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {numericProgramId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{form.editingId ? "Editar departamento" : "Novo departamento"}</CardTitle>
              <CardDescription>
                Departamentos podem ser organizados em hierarquia (departamento pai) e ter um líder responsável.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do departamento</Label>
                    <Select
                      value={SUGESTOES_DEPARTAMENTO.includes(form.name) ? form.name : (form.name ? "outro" : "")}
                      onValueChange={(v) => {
                        if (v === "outro") {
                          setForm((f) => ({ ...f, name: "" }));
                        } else {
                          setForm((f) => ({ ...f, name: v }));
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione um nome sugerido" /></SelectTrigger>
                      <SelectContent>
                        {SUGESTOES_DEPARTAMENTO.map((nome) => (
                          <SelectItem key={nome} value={nome}>{nome}</SelectItem>
                        ))}
                        <SelectItem value="outro">Outro departamento</SelectItem>
                      </SelectContent>
                    </Select>
                    {!SUGESTOES_DEPARTAMENTO.includes(form.name) && (
                      <Input
                        className="mt-2"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Digite o nome do departamento"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Departamento pai (opcional)</Label>
                    <Select value={form.parentDepartmentId} onValueChange={(value) => setForm((f) => ({ ...f, parentDepartmentId: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>Nenhum (departamento raiz)</SelectItem>
                        {departamentos
                          .filter((d: any) => d.id !== form.editingId)
                          .map((d: any) => (
                            <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Líder do departamento (opcional)</Label>
                  <Select value={form.managerId} onValueChange={(value) => setForm((f) => ({ ...f, managerId: value }))}>
                    <SelectTrigger className="w-full sm:w-80">
                      <SelectValue placeholder={loadingGerentes ? "Carregando..." : "Selecione um líder"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Nenhum líder definido</SelectItem>
                      {gerentes.map((g: any) => (
                        <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSaving}>
                    {form.editingId ? "Salvar alterações" : "Cadastrar departamento"}
                  </Button>
                  {form.editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar edição
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Departamentos cadastrados</CardTitle>
              <CardDescription>Departamentos deste programa/empresa.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDepartamentos ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : departamentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum departamento cadastrado ainda.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Departamento pai</TableHead>
                      <TableHead>Líder</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departamentos.map((dept: any) => (
                      <TableRow key={dept.id}>
                        <TableCell>{dept.name}</TableCell>
                        <TableCell>{getNomeDepartamentoPai(dept.parentDepartmentId)}</TableCell>
                        <TableCell>{getNomeLider(dept.managerId)}</TableCell>
                        <TableCell>
                          {dept.isActive === 1 ? (
                            <Badge variant="secondary">Ativo</Badge>
                          ) : (
                            <Badge variant="outline">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(dept)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleToggleActive(dept)}>
                            <Power className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{editandoCargoId ? "Editar cargo" : "Novo cargo"}</CardTitle>
              <CardDescription>Cargos cadastrados aqui ficam disponiveis para selecionar no cadastro de qualquer aluno/colaborador desta empresa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do cargo</Label>
                  <Input value={nomeCargo} onChange={(e) => setNomeCargo(e.target.value)} placeholder="Ex: Diretor, Supervisor, Analista..." />
                </div>
                <div className="space-y-2">
                  <Label>Descricao (opcional)</Label>
                  <Textarea rows={1} value={descricaoCargo} onChange={(e) => setDescricaoCargo(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmitCargo} disabled={createCargoMutation.isPending || updateCargoMutation.isPending}>
                  {editandoCargoId ? "Salvar alteracoes" : "Cadastrar cargo"}
                </Button>
                {editandoCargoId && (
                  <Button variant="outline" onClick={() => { setEditandoCargoId(null); setNomeCargo(""); setDescricaoCargo(""); }}>
                    Cancelar
                  </Button>
                )}
              </div>

              {loadingCargos ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : cargosLista.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum cargo cadastrado ainda.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descricao</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargosLista.map((cargo: any) => (
                      <TableRow key={cargo.id}>
                        <TableCell>{cargo.name}</TableCell>
                        <TableCell>{cargo.description || "-"}</TableCell>
                        <TableCell>
                          {cargo.isActive === 1 ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditCargo(cargo)}>Editar</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleCargoAtivo(cargo)}>Ativar/Inativar</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
