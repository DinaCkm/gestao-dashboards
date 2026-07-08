import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { UserPlus, UserMinus } from "lucide-react";

type Props = {
  programId: number;
  orgProfileId: number;
};

export default function SelecaoDiretores({ programId, orgProfileId }: Props) {
  const [departmentId, setDepartmentId] = useState("");
  const [cargo, setCargo] = useState("");
  const [mostrarPrevia, setMostrarPrevia] = useState(false);

  const { data: departamentos = [] } = trpc.departments.list.useQuery(
    { programId, includeInactive: false },
    { enabled: !!programId }
  );

  const { data: cargos = [] } = trpc.disc360.listDistinctCargos.useQuery({ programId });

  const { data: encontrados = [], refetch: refetchBusca } = trpc.disc360.searchAlunosForSelection.useQuery(
    {
      programId,
      departmentId: departmentId && departmentId !== "todos" ? Number(departmentId) : undefined,
      cargo: cargo && cargo !== "todos" ? cargo : undefined,
    },
    { enabled: !!programId }
  );

  const {
    data: membros = [],
    refetch: refetchMembros,
  } = trpc.disc360.listDiretoriaMembros.useQuery({ orgProfileId });

  const {
    data: previa,
    refetch: refetchPrevia,
    isFetching: carregandoPrevia,
  } = trpc.disc360.previewDiretoriaConsolidacao.useQuery({ orgProfileId }, { enabled: false });

  const addMutation = trpc.disc360.addDiretoriaMembro.useMutation({
    onSuccess: () => {
      refetchMembros();
      toast.success("Pessoa adicionada ao grupo da Diretoria.");
    },
    onError: (err) => toast.error("Erro ao adicionar: " + err.message),
  });

  const removeMutation = trpc.disc360.removeDiretoriaMembro.useMutation({
    onSuccess: () => {
      refetchMembros();
      toast.success("Pessoa removida do grupo.");
    },
    onError: (err) => toast.error("Erro ao remover: " + err.message),
  });

  const consolidarMutation = trpc.disc360.consolidateDiretoriaFromGrupo.useMutation({
    onSuccess: () => {
      toast.success("Perfil Oficial da Diretoria validado e consolidado.");
      refetchMembros();
    },
    onError: (err) => toast.error("Erro ao consolidar: " + err.message),
  });

  const idsJaMembros = new Set(membros.map((m: any) => m.alunoId));
  const disponiveisParaAdicionar = encontrados.filter((a: any) => !idsJaMembros.has(a.id));

  const handleVerPrevia = () => {
    setMostrarPrevia(true);
    refetchPrevia();
  };

  const LABEL_INDICADOR: Record<string, string> = { D: "Dominancia (D)", I: "Influencia (I)", S: "Estabilidade (S)", C: "Conformidade (C)" };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Encontrar pessoas por Departamento e/ou Cargo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Departamento</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Todos os departamentos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os departamentos</SelectItem>
                  {departamentos.map((d: any) => (<SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cargo</Label>
              <Select value={cargo} onValueChange={setCargo}>
                <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Todos os cargos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os cargos</SelectItem>
                  {cargos.map((c: string) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            {disponiveisParaAdicionar.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma pessoa encontrada com esse filtro (ou todas ja fazem parte do grupo).</p>
            )}
            {disponiveisParaAdicionar.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border p-2">
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.cargo || "Sem cargo definido"}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => addMutation.mutate({ orgProfileId, alunoId: a.id })} disabled={addMutation.isPending}>
                  <UserPlus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Pessoas selecionadas para esta Diretoria ({membros.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {membros.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma pessoa selecionada ainda. Use a busca acima.</p>
          )}
          {membros.map((m: any) => (
            <div key={m.alunoId} className="flex items-center justify-between rounded-md border p-2">
              <div>
                <p className="text-sm font-medium">{m.nome}</p>
                {m.scores ? (
                  <p className="text-xs text-muted-foreground">D {m.scores.D} · I {m.scores.I} · S {m.scores.S} · C {m.scores.C}</p>
                ) : (
                  <p className="text-xs text-amber-600">Ainda nao possui DISC individual registrado na plataforma</p>
                )}
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeMutation.mutate({ orgProfileId, alunoId: m.alunoId })} disabled={removeMutation.isPending}>
                <UserMinus className="h-4 w-4 mr-1" /> Remover
              </Button>
            </div>
          ))}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleVerPrevia} disabled={carregandoPrevia || membros.length === 0}>
              Ver previa do calculo
            </Button>
            <Button size="sm" onClick={() => consolidarMutation.mutate({ orgProfileId })} disabled={consolidarMutation.isPending || membros.length === 0}>
              Validar Perfil Oficial da Diretoria
            </Button>
          </div>
        </CardContent>
      </Card>

      {mostrarPrevia && previa && previa.resultado && (
        <Card className="bg-muted/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Previa do resultado - como cada numero foi calculado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {previa.totalComDisc} de {previa.totalMembros} pessoa(s) selecionada(s) possuem DISC individual registrado e entraram no calculo.
            </p>
            {(["D", "I", "S", "C"] as const).map((dim) => {
              const detalhe = previa.resultado!.detalhePorIndicador[dim];
              return (
                <div key={dim} className="rounded-md border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{LABEL_INDICADOR[dim]}</span>
                    <Badge variant="secondary">{detalhe.valorFinal}</Badge>
                  </div>
                  {detalhe.grupoUsado === "todos" ? (
                    <p className="text-xs text-muted-foreground">
                      Media de todas as pessoas selecionadas: {detalhe.incluidos.map((p) => p.nome + " (" + p.valor + ")").join(", ")}.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Grupo com maioria parecida (usado no calculo): {detalhe.incluidos.map((p) => p.nome + " (" + p.valor + ")").join(", ")}.
                      </p>
                      <p className="text-xs text-amber-600">
                        Desconsiderado(s) neste indicador por divergir mais de 30 pontos do grupo majoritario: {detalhe.excluidos.map((p) => p.nome + " (" + p.valor + ")").join(", ")}.
                      </p>
                    </>
                  )}
                </div>
              );
            })}
            <p>Perfil sugerido da Diretoria: <strong>{previa.resultado.perfilSugerido}</strong></p>
          </CardContent>
        </Card>
      )}

      {mostrarPrevia && previa && !previa.resultado && (
        <p className="text-sm text-amber-600">Nenhuma das pessoas selecionadas possui DISC individual registrado ainda. Nao e possivel calcular a previa.</p>
      )}
    </div>
  );
}