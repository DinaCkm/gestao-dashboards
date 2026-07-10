import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const NONE_VALUE = "none";

const PERFIL_LABEL: Record<string, string> = {
  D: "Dominância",
  I: "Influência",
  S: "Estabilidade",
  C: "Conformidade",
};

export default function AplicacoesDISC() {
  return (
    <DashboardLayout>
      <AplicacoesDISCContent />
    </DashboardLayout>
  );
}

function AplicacoesDISCContent() {
  const [programId, setProgramId] = useState("");
  const numericProgramId = programId ? Number(programId) : undefined;
  const [filtroDepartamento, setFiltroDepartamento] = useState(NONE_VALUE);
  const [filtroEmpregado, setFiltroEmpregado] = useState("");
  const [resultadoAbertoId, setResultadoAbertoId] = useState<number | null>(null);

  const { data: empresas = [] } = trpc.admin.listEmpresas.useQuery();
  const { data: departamentos = [] } = trpc.departments.list.useQuery(
    { programId: numericProgramId as number, includeInactive: true },
    { enabled: !!numericProgramId }
  );

  const {
    data: aplicacoes = [],
    isLoading,
    refetch,
  } = trpc.disc360.listAplicacoesDISC.useQuery(
    { programId: numericProgramId as number },
    { enabled: !!numericProgramId }
  );

  const liberarOnboarding = trpc.admin.liberarOnboarding.useMutation({
    onSuccess: (data: any) => {
      if (data?.success !== false) {
        toast.success("Onboarding liberado!");
        refetch();
      } else {
        toast.error(data?.message || "Erro ao liberar onboarding.");
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  const aplicacoesFiltradas = (aplicacoes as any[])
    .filter((a) => (filtroDepartamento === NONE_VALUE ? true : String(a.departmentId ?? "") === filtroDepartamento))
    .filter((a) =>
      filtroEmpregado.trim() === ""
        ? true
        : (a.name ?? "").toLowerCase().includes(filtroEmpregado.trim().toLowerCase())
    );

  const aplicacaoAberta = (aplicacoes as any[]).find((a) => a.id === resultadoAbertoId) ?? null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <Link href="/disc360">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aplicações DISC</CardTitle>
          <CardDescription>
            Acompanhe, por colaborador: liberação de onboarding, vídeo explicativo do DISC assistido,
            conclusão do teste DISC e respostas de autoavaliação de competências.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Programa / Empresa</Label>
            <Select
              value={programId}
              onValueChange={(v) => {
                setProgramId(v);
                setFiltroDepartamento(NONE_VALUE);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
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

          <div className="space-y-1">
            <Label>Departamento</Label>
            <Select value={filtroDepartamento} onValueChange={setFiltroDepartamento} disabled={!numericProgramId}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os departamentos" />
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

          <div className="space-y-1">
            <Label>Empregado</Label>
            <Input
              placeholder="Buscar por nome..."
              value={filtroEmpregado}
              onChange={(e) => setFiltroEmpregado(e.target.value)}
              disabled={!numericProgramId}
            />
          </div>
        </CardContent>
      </Card>

      {!numericProgramId && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Selecione um programa/empresa para ver os colaboradores.
          </CardContent>
        </Card>
      )}

      {numericProgramId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
            {!isLoading && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Onboarding</TableHead>
                    <TableHead>Vídeo DISC</TableHead>
                    <TableHead>Teste DISC</TableHead>
                    <TableHead>Competências</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aplicacoesFiltradas.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>
                        {a.onboardingLiberado ? (
                          <Badge variant="secondary">Liberado</Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={liberarOnboarding.isPending}
                            onClick={() => liberarOnboarding.mutate({ alunoId: a.id })}
                          >
                            Liberar onboarding
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        {a.discVideoWatchedAt ? (
                          <Badge variant="secondary">Assistido</Badge>
                        ) : (
                          <Badge variant="outline">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {a.discConcluido ? (
                          <Badge variant="secondary">
                            Concluído · {a.discPerfilPredominante}
                            {a.discPerfilSecundario ? `/${a.discPerfilSecundario}` : ""}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {a.competenciasRespondidas} resposta(s)
                        </span>
                      </TableCell>
                      <TableCell>
                        {a.discConcluido && (
                          <Button variant="ghost" size="sm" onClick={() => setResultadoAbertoId(a.id)}>
                            Ver resultado completo
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {aplicacoesFiltradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        Nenhum colaborador encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {aplicacaoAberta && (
        <Dialog open={!!resultadoAbertoId} onOpenChange={(open) => !open && setResultadoAbertoId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resultado DISC — {aplicacaoAberta.name}</DialogTitle>
              <DialogDescription>
                Perfil predominante: <strong>{PERFIL_LABEL[aplicacaoAberta.discPerfilPredominante] ?? aplicacaoAberta.discPerfilPredominante}</strong>
                {aplicacaoAberta.discPerfilSecundario
                  ? ` · Secundário: ${PERFIL_LABEL[aplicacaoAberta.discPerfilSecundario] ?? aplicacaoAberta.discPerfilSecundario}`
                  : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              {(["D", "I", "S", "C"] as const).map((eixo) => (
                <div key={eixo} className="border rounded-md p-3">
                  <p className="text-xs text-muted-foreground">
                    {eixo} — {PERFIL_LABEL[eixo]}
                  </p>
                  <p className="text-lg font-semibold">
                    {aplicacaoAberta.discScores ? Number(aplicacaoAberta.discScores[eixo]) : "—"}%
                  </p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
