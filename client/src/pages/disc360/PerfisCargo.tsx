import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Copy } from "lucide-react";

const NONE_VALUE = "none";

export default function PerfisCargo() {
  return (
    <DashboardLayout>
      <PerfisCargoContent />
    </DashboardLayout>
  );
}

function PerfisCargoContent() {
  const [programId, setProgramId] = useState("");
  const numericProgramId = programId ? Number(programId) : undefined;

  const { data: empresas = [] } = trpc.admin.listEmpresas.useQuery();
  const { data: departamentos = [] } = trpc.departments.list.useQuery(
    { programId: numericProgramId as number, includeInactive: true },
    { enabled: !!numericProgramId }
  );
  const { data: cargosCatalogo = [] } = trpc.cargos.list.useQuery(
    { programId: numericProgramId as number, includeInactive: true },
    { enabled: !!numericProgramId }
  );
  const { data: gerentes = [] } = trpc.disc360.searchAlunosForSelection.useQuery(
    { programId: numericProgramId as number },
    { enabled: !!numericProgramId }
  );
  const {
    data: perfis = [],
    isLoading: loadingPerfis,
    refetch: refetchPerfis,
  } = trpc.disc360.listRoleProfiles.useQuery(
    { programId: numericProgramId as number },
    { enabled: !!numericProgramId }
  );

  const [departmentId, setDepartmentId] = useState(NONE_VALUE);
  const [cargoNome, setCargoNome] = useState("");
  const [leaderUserId, setLeaderUserId] = useState(NONE_VALUE);
  const [filtroDepartamento, setFiltroDepartamento] = useState(NONE_VALUE);
  const [acoesAbertoId, setAcoesAbertoId] = useState<number | null>(null);

  const createMutation = trpc.disc360.createRoleProfile.useMutation({
    onSuccess: () => {
      toast.success("Cargo cadastrado. Agora gere os convites para o líder e o empregado.");
      setCargoNome("");
      setDepartmentId(NONE_VALUE);
      setLeaderUserId(NONE_VALUE);
      refetchPerfis();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!numericProgramId || !cargoNome) {
      toast.error("Selecione o programa e o cargo.");
      return;
    }
    createMutation.mutate({
      programId: numericProgramId,
      departmentId: departmentId !== NONE_VALUE ? Number(departmentId) : null,
      cargoNome,
      leaderUserId: leaderUserId !== NONE_VALUE ? Number(leaderUserId) : null,
      expectedScores: { D: 50, I: 50, S: 50, C: 50 },
    });
  };

  const perfisFiltrados = (perfis as any[]).filter((p) =>
    filtroDepartamento === NONE_VALUE ? true : String(p.departmentId ?? "") === filtroDepartamento
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Link href="/disc360">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Perfis de Cargo</h1>
        <p className="text-muted-foreground">
          Cadastre o perfil comportamental (DISC) esperado para cada cargo, a partir do questionário
          respondido pelo líder da posição e por um empregado que ocupa o cargo.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="max-w-sm space-y-2">
            <Label>Programa / Empresa</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o programa" />
              </SelectTrigger>
              <SelectContent>
                {(empresas as any[]).map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {numericProgramId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cadastrar novo cargo</CardTitle>
              <CardDescription>
                Depois de cadastrar, você vai gerar os links de convite para o líder e para um
                empregado que ocupa o cargo responderem o questionário.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Sem departamento</SelectItem>
                    {(departamentos as any[]).map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Select value={cargoNome} onValueChange={setCargoNome}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {(cargosCatalogo as any[]).map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Líder do cargo (opcional)</Label>
                <Select value={leaderUserId} onValueChange={setLeaderUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um líder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Nenhum líder definido</SelectItem>
                    {(gerentes as any[]).map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-3">
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Cadastrando..." : "Cadastrar cargo"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">Cargos cadastrados</CardTitle>
                <div className="w-56">
                  <Select value={filtroDepartamento} onValueChange={setFiltroDepartamento}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Todos os departamentos</SelectItem>
                      {(departamentos as any[]).map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPerfis && <p className="text-sm text-muted-foreground">Carregando...</p>}
              {!loadingPerfis && perfisFiltrados.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum cargo cadastrado ainda.</p>
              )}
              {!loadingPerfis && perfisFiltrados.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Perfil esperado</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perfisFiltrados.map((p: any) => {
                      const depto = (departamentos as any[]).find((d) => d.id === p.departmentId);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.cargoNome}</TableCell>
                          <TableCell>{depto?.name ?? "—"}</TableCell>
                          <TableCell>
                            {p.perfilEsperado ? (
                              <Badge variant="secondary">{p.perfilEsperado}</Badge>
                            ) : (
                              <Badge variant="outline">Aguardando respostas</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => setAcoesAbertoId(p.id)}>
                              Convites e resultado
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

      {acoesAbertoId && (
        <CargoAcoesDialog
          cargoProfileId={acoesAbertoId}
          programId={numericProgramId as number}
          onClose={() => setAcoesAbertoId(null)}
          onConsolidado={() => refetchPerfis()}
        />
      )}
    </div>
  );
}
function CargoAcoesDialog({
  cargoProfileId,
  programId,
  onClose,
  onConsolidado,
}: {
  cargoProfileId: number;
  programId: number;
  onClose: () => void;
  onConsolidado: () => void;
}) {
  const { data: perfil } = trpc.disc360.getRoleProfileById.useQuery({ id: cargoProfileId });
  const { data: convites = [], refetch: refetchConvites } = trpc.disc360.listarConvitesCargoRole.useQuery({
    cargoProfileId,
  });
  const { data: preview, refetch: refetchPreview } = trpc.disc360.previewCargoConsolidacao.useQuery({
    cargoProfileId,
  });

  const [liderNome, setLiderNome] = useState("");
  const [liderEmail, setLiderEmail] = useState("");
  const [empregadoNome, setEmpregadoNome] = useState("");
  const [empregadoEmail, setEmpregadoEmail] = useState("");

  const criarConvitesMutation = trpc.disc360.criarConvitesCargoRole.useMutation({
    onSuccess: () => {
      toast.success("Convites gerados.");
      setLiderNome("");
      setLiderEmail("");
      setEmpregadoNome("");
      setEmpregadoEmail("");
      refetchConvites();
    },
    onError: (err) => toast.error(err.message),
  });

  const consolidarMutation = trpc.disc360.consolidateRoleProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil do cargo consolidado.");
      onConsolidado();
      refetchPreview();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCriarConvites = () => {
    if (!liderNome || !empregadoNome) {
      toast.error("Informe o nome do líder e do empregado.");
      return;
    }
    criarConvitesMutation.mutate({
      programId,
      cargoProfileId,
      convites: [
        { papelRespondente: "lider", respondentName: liderNome, respondentEmail: liderEmail || null },
        { papelRespondente: "empregado", respondentName: empregadoNome, respondentEmail: empregadoEmail || null },
      ],
    });
  };

  const copiarLink = (token: string) => {
    const link = `${window.location.origin}/disc360/responder-convite-cargo/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado.");
  };

  const jaTemConvites = (convites as any[]).length > 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{(perfil as any)?.cargoNome ?? "Cargo"}</DialogTitle>
          <DialogDescription>
            Convites, prévia do resultado e consolidação do perfil DISC esperado para este cargo.
          </DialogDescription>
        </DialogHeader>

        {!jaTemConvites && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Informe o líder da posição e um empregado que ocupa o cargo para gerar os links de convite.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome do líder</Label>
                <Input value={liderNome} onChange={(e) => setLiderNome(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>E-mail do líder (opcional)</Label>
                <Input value={liderEmail} onChange={(e) => setLiderEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nome do empregado</Label>
                <Input value={empregadoNome} onChange={(e) => setEmpregadoNome(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>E-mail do empregado (opcional)</Label>
                <Input value={empregadoEmail} onChange={(e) => setEmpregadoEmail(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleCriarConvites} disabled={criarConvitesMutation.isPending}>
              {criarConvitesMutation.isPending ? "Gerando..." : "Gerar convites"}
            </Button>
          </div>
        )}

        {jaTemConvites && (
          <div className="space-y-3">
            {(convites as any[]).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {c.papelRespondente === "lider" ? "Líder" : "Empregado"} — {c.respondentName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.status === "concluido" ? "Respondido" : "Aguardando resposta"}
                  </p>
                </div>
                {c.status !== "concluido" && (
                  <Button variant="outline" size="sm" onClick={() => copiarLink(c.conviteToken)}>
                    <Copy className="mr-1 h-3 w-3" />
                    Copiar link
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {preview && preview.totalRespondentes > 0 && (
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold">Prévia do resultado</h3>
            {preview.respondentes.map((r: any, i: number) => (
              <div key={i} className="rounded-md border p-3 text-sm">
                <p className="font-medium">
                  {r.papelRespondente === "lider" ? "Líder" : "Empregado"} — {r.respondentName}
                </p>
                <p className="text-muted-foreground">
                  D {r.scores.D} · I {r.scores.I} · S {r.scores.S} · C {r.scores.C}
                </p>
                {(r.avaliacoesDivergencia ?? []).filter((av: any) => av.divergente).map((av: any) => (
                  <p key={av.dimensao} className="mt-1 text-amber-600">
                    {av.texto}
                  </p>
                ))}
              </div>
            ))}
            <div className="rounded-md border border-dashed p-3 text-sm">
              <p className="font-medium">
                Consolidado ({preview.statusConsistencia === "suficiente" ? "base suficiente" : "prévia"})
              </p>
              <p className="text-muted-foreground">
                D {preview.scoresMedios.D} · I {preview.scoresMedios.I} · S {preview.scoresMedios.S} · C{" "}
                {preview.scoresMedios.C}
              </p>
              <p className="text-muted-foreground">
                Predominante: {preview.perfilPredominante} · Secundário: {preview.perfilSecundario}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => consolidarMutation.mutate({ cargoProfileId })}
                disabled={consolidarMutation.isPending}
              >
                {consolidarMutation.isPending ? "Salvando..." : "Consolidar e salvar perfil do cargo"}
              </Button>
              <Link href={`/disc360/relatorio-cargo/${cargoProfileId}`}>
                <Button variant="outline">Ver relatório para impressão</Button>
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
