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
import { useLocation } from "wouter";
import { ArrowLeft, Building2, Pencil, Power } from "lucide-react";

type ProfileType = "empresa" | "diretoria";

type FormState = {
  editingId: number | null;
  profileType: ProfileType;
  profileName: string;
  scoreD: string;
  scoreI: string;
  scoreS: string;
  scoreC: string;
  perfilDesejado: string;
  culturalDescription: string;
  competencias: string;
};

const emptyForm: FormState = {
  editingId: null,
  profileType: "empresa",
  profileName: "",
  scoreD: "",
  scoreI: "",
  scoreS: "",
  scoreC: "",
  perfilDesejado: "",
  culturalDescription: "",
  competencias: "",
};

export default function PerfilEmpresaDiretoria() {
  return (
    <DashboardLayout>
      <PerfilEmpresaDiretoriaContent />
    </DashboardLayout>
  );
}

function PerfilEmpresaDiretoriaContent() {
  const [, setLocation] = useLocation();
  const [programId, setProgramId] = useState<string>("");
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: empresas = [], isLoading: loadingEmpresas } = trpc.admin.listEmpresas.useQuery();

  const numericProgramId = programId ? Number(programId) : undefined;

  const { data: perfis = [], isLoading: loadingPerfis, refetch: refetchPerfis } = trpc.disc360.listOrgProfiles.useQuery(
    { programId: numericProgramId as number, includeInactive: true },
    { enabled: !!numericProgramId }
  );

  const createMutation = trpc.disc360.createOrgProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil cadastrado com sucesso!");
      setForm(emptyForm);
      refetchPerfis();
    },
    onError: (err) => toast.error("Erro ao cadastrar perfil: " + err.message),
  });

  const updateMutation = trpc.disc360.updateOrgProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      setForm(emptyForm);
      refetchPerfis();
    },
    onError: (err) => toast.error("Erro ao atualizar perfil: " + err.message),
  });

  const resetForm = () => setForm(emptyForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericProgramId) {
      toast.error("Selecione um programa/empresa antes de cadastrar o perfil.");
      return;
    }
    if (!form.profileName.trim()) {
      toast.error("Informe o nome do perfil.");
      return;
    }
    const scores = {
      D: Number(form.scoreD) || 0,
      I: Number(form.scoreI) || 0,
      S: Number(form.scoreS) || 0,
      C: Number(form.scoreC) || 0,
    };
    const competenciasArray = form.competencias
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const payload = {
      profileType: form.profileType,
      profileName: form.profileName.trim(),
      expectedScores: scores,
      perfilDesejado: form.perfilDesejado.trim() || null,
      culturalDescription: form.culturalDescription.trim() || null,
      competenciasValorizadas: competenciasArray.length > 0 ? competenciasArray : null,
    };

    if (form.editingId) {
      updateMutation.mutate({ id: form.editingId, ...payload });
    } else {
      createMutation.mutate({ programId: numericProgramId, ...payload });
    }
  };

  const handleEdit = (perfil: any) => {
    const scores = (perfil.expectedScores || {}) as { D?: number; I?: number; S?: number; C?: number };
    setForm({
      editingId: perfil.id,
      profileType: perfil.profileType,
      profileName: perfil.profileName || "",
      scoreD: scores.D !== undefined ? String(scores.D) : "",
      scoreI: scores.I !== undefined ? String(scores.I) : "",
      scoreS: scores.S !== undefined ? String(scores.S) : "",
      scoreC: scores.C !== undefined ? String(scores.C) : "",
      perfilDesejado: perfil.perfilDesejado || "",
      culturalDescription: perfil.culturalDescription || "",
      competencias: Array.isArray(perfil.competenciasValorizadas) ? perfil.competenciasValorizadas.join(", ") : "",
    });
  };

  const handleToggleActive = (perfil: any) => {
    updateMutation.mutate({ id: perfil.id, isActive: perfil.isActive !== 1 });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/disc360")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Perfil DISC da Empresa/Diretoria</h1>
          <p className="text-muted-foreground text-sm">Defina o perfil comportamental desejado da empresa ou de uma diretoria.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Programa/Empresa</CardTitle>
          <CardDescription>Selecione o programa/empresa para cadastrar ou visualizar os perfis.</CardDescription>
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
              <CardTitle className="text-base">{form.editingId ? "Editar perfil" : "Novo perfil"}</CardTitle>
              <CardDescription>
                Preencha os percentuais D, I, S e C esperados (0 a 100) e as demais informações do perfil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de perfil</Label>
                    <Select value={form.profileType} onValueChange={(value) => setForm((f) => ({ ...f, profileType: value as ProfileType }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="empresa">Empresa</SelectItem>
                        <SelectItem value="diretoria">Diretoria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome do perfil</Label>
                    <Input
                      value={form.profileName}
                      onChange={(e) => setForm((f) => ({ ...f, profileName: e.target.value }))}
                      placeholder="Ex: Cultura Geral da Empresa, Diretoria Comercial..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>D (%)</Label>
                    <Input type="number" min={0} max={100} value={form.scoreD} onChange={(e) => setForm((f) => ({ ...f, scoreD: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>I (%)</Label>
                    <Input type="number" min={0} max={100} value={form.scoreI} onChange={(e) => setForm((f) => ({ ...f, scoreI: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>S (%)</Label>
                    <Input type="number" min={0} max={100} value={form.scoreS} onChange={(e) => setForm((f) => ({ ...f, scoreS: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>C (%)</Label>
                    <Input type="number" min={0} max={100} value={form.scoreC} onChange={(e) => setForm((f) => ({ ...f, scoreC: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Perfil desejado (ex: D/I, S/C...)</Label>
                  <Input value={form.perfilDesejado} onChange={(e) => setForm((f) => ({ ...f, perfilDesejado: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Descrição da cultura desejada</Label>
                  <Textarea rows={3} value={form.culturalDescription} onChange={(e) => setForm((f) => ({ ...f, culturalDescription: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Competências valorizadas (separadas por vírgula)</Label>
                  <Input value={form.competencias} onChange={(e) => setForm((f) => ({ ...f, competencias: e.target.value }))} placeholder="Ex: Colaboração, Inovação, Orientação a resultados" />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSaving}>
                    {form.editingId ? "Salvar alterações" : "Cadastrar perfil"}
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
              <CardTitle className="text-base">Perfis cadastrados</CardTitle>
              <CardDescription>Perfis de empresa/diretoria já cadastrados para este programa/empresa.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPerfis ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : perfis.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum perfil cadastrado ainda.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>D/I/S/C</TableHead>
                      <TableHead>Perfil desejado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perfis.map((perfil: any) => {
                      const scores = perfil.expectedScores || {};
                      return (
                        <TableRow key={perfil.id}>
                          <TableCell className="capitalize">{perfil.profileType}</TableCell>
                          <TableCell>{perfil.profileName}</TableCell>
                          <TableCell>
                            {scores.D ?? 0}/{scores.I ?? 0}/{scores.S ?? 0}/{scores.C ?? 0}
                          </TableCell>
                          <TableCell>{perfil.perfilDesejado || "-"}</TableCell>
                          <TableCell>
                            {perfil.isActive === 1 ? (
                              <Badge variant="secondary">Ativo</Badge>
                            ) : (
                              <Badge variant="outline">Inativo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(perfil)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleToggleActive(perfil)}>
                              <Power className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
