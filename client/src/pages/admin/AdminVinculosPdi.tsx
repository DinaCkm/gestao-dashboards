import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle, Link as LinkIcon, Search, Trash2 } from "lucide-react";

// Vínculos com o PDI: cada competência de origem das ações do PDI (foco comportamental ou
// eixo técnico, lido do catálogo do PDI) é ligada às competências do EcoLíder cujos cursos
// podem ser indicados como ação. Só os cursos dessas competências aparecem no PDI.

type ItemCatalogo = {
  codigo: string;
  tipo: "COMPORTAMENTAL" | "TECNICA";
  competencia: string;
  nivel: string | null;
  grupo: string;
  conflito: boolean;
  nomesEncontrados?: string[];
};

function rotuloDoItem(item: ItemCatalogo) {
  return item.tipo === "TECNICA"
    ? `Eixo técnico: ${item.competencia}`
    : `${item.grupo} › ${item.competencia} (${item.nivel})`;
}

export default function AdminVinculosPdi() {
  const utils = trpc.useUtils();
  const catalogo = trpc.vinculosPdi.catalogoPdi.useQuery(undefined, { retry: false });
  const competencias = trpc.vinculosPdi.competenciasEcolider.useQuery();
  const vinculos = trpc.vinculosPdi.listar.useQuery();
  const [tipo, setTipo] = useState<"COMPORTAMENTAL" | "TECNICA">("COMPORTAMENTAL");
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<ItemCatalogo | null>(null);
  const [competenciaEscolhida, setCompetenciaEscolhida] = useState("");

  const vincular = trpc.vinculosPdi.vincular.useMutation({
    onSuccess: () => {
      toast.success("Vínculo salvo.");
      setCompetenciaEscolhida("");
      utils.vinculosPdi.listar.invalidate();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const desvincular = trpc.vinculosPdi.desvincular.useMutation({
    onSuccess: () => {
      toast.success("Vínculo removido.");
      utils.vinculosPdi.listar.invalidate();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const vinculosPorCodigo = useMemo(() => {
    const mapa = new Map<string, any[]>();
    for (const v of (vinculos.data ?? []) as any[]) {
      mapa.set(v.codigoPdi, [...(mapa.get(v.codigoPdi) ?? []), v]);
    }
    return mapa;
  }, [vinculos.data]);

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return ((catalogo.data ?? []) as ItemCatalogo[])
      .filter((item) => item.tipo === tipo)
      .filter((item) => !termo || rotuloDoItem(item).toLowerCase().includes(termo));
  }, [catalogo.data, tipo, busca]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, ItemCatalogo[]>();
    for (const item of itensFiltrados) mapa.set(item.grupo, [...(mapa.get(item.grupo) ?? []), item]);
    return Array.from(mapa.entries());
  }, [itensFiltrados]);

  // Vínculos cujo código não está mais no catálogo do PDI
  const orfaos = useMemo(() => {
    if (!catalogo.data) return [];
    const codigos = new Set((catalogo.data as ItemCatalogo[]).map((i) => i.codigo));
    return ((vinculos.data ?? []) as any[]).filter((v) => !codigos.has(v.codigoPdi));
  }, [catalogo.data, vinculos.data]);

  const vinculosDoSelecionado = selecionado ? vinculosPorCodigo.get(selecionado.codigo) ?? [] : [];
  const competenciasDisponiveis = ((competencias.data ?? []) as any[]).filter(
    (c) => !vinculosDoSelecionado.some((v) => Number(v.competenciaId) === Number(c.id))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Vínculos com o PDI</h1>
          <p className="text-muted-foreground">
            Ligue cada competência do PDI às competências do EcoLíder. Os cursos ativos dessas competências
            poderão ser indicados como ação de desenvolvimento no PDI.
          </p>
        </div>

        {catalogo.error && (
          <Card className="border-red-300">
            <CardContent className="pt-6 flex gap-3 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Não foi possível ler o catálogo do PDI.</p>
                <p className="text-sm">{catalogo.error.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Competências do PDI</CardTitle>
              <CardDescription>Escolha a competência que recebe a ação no PDI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={tipo} onValueChange={(v) => { setTipo(v as any); setSelecionado(null); }}>
                <TabsList>
                  <TabsTrigger value="COMPORTAMENTAL">Comportamentais</TabsTrigger>
                  <TabsTrigger value="TECNICA">Eixos técnicos</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="buscaCatalogoPdi" className="pl-9" placeholder="Buscar competência..." value={busca} onChange={(e) => setBusca(e.target.value)} />
              </div>
              {catalogo.isLoading && <p className="text-sm text-muted-foreground">Carregando catálogo do PDI...</p>}
              <div className="max-h-[520px] overflow-y-auto space-y-4 pr-1">
                {grupos.map(([grupo, itens]) => (
                  <div key={grupo} className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{grupo}</p>
                    {itens.map((item) => {
                      const total = vinculosPorCodigo.get(item.codigo)?.length ?? 0;
                      const ativo = selecionado?.codigo === item.codigo;
                      return (
                        <button
                          key={item.codigo}
                          type="button"
                          onClick={() => setSelecionado(item)}
                          className={`w-full text-left rounded-md border px-3 py-2 text-sm flex items-center justify-between gap-2 ${ativo ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                        >
                          <span>
                            {item.competencia}
                            {item.nivel && <span className="text-muted-foreground"> · {item.nivel}</span>}
                          </span>
                          <span className="flex gap-1">
                            {item.conflito && <Badge variant="destructive">Revisar</Badge>}
                            {total > 0 && <Badge variant="secondary"><LinkIcon className="h-3 w-3 mr-1" />{total}</Badge>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
                {!catalogo.isLoading && grupos.length === 0 && !catalogo.error && (
                  <p className="text-sm text-muted-foreground">Nenhuma competência encontrada.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Competências do EcoLíder vinculadas</CardTitle>
              <CardDescription>
                {selecionado ? rotuloDoItem(selecionado) : "Selecione uma competência do PDI ao lado."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selecionado?.conflito && (
                <div className="rounded-md border border-red-300 p-3 text-sm text-red-700">
                  Este código de eixo aparece com nomes diferentes nas matrizes do PDI
                  ({selecionado.nomesEncontrados?.join(", ")}). Corrija no PDI antes de vincular.
                </div>
              )}
              {selecionado && !selecionado.conflito && (
                <>
                  <div className="space-y-2">
                    {vinculosDoSelecionado.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhuma competência vinculada. Nenhum curso aparece no PDI para esta competência.</p>
                    )}
                    {vinculosDoSelecionado.map((v) => (
                      <div key={v.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <span>{v.competenciaNome ?? `Competência ${v.competenciaId}`}{v.trilhaNome && <span className="text-muted-foreground"> · {v.trilhaNome}</span>}</span>
                        <Button variant="ghost" size="sm" onClick={() => desvincular.mutate({ id: Number(v.id) })} aria-label="Remover vínculo">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select value={competenciaEscolhida} onValueChange={setCompetenciaEscolhida}>
                      <SelectTrigger id="competenciaEcolider"><SelectValue placeholder="Competência do EcoLíder" /></SelectTrigger>
                      <SelectContent>
                        {competenciasDisponiveis.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.trilhaNome ? `${c.trilhaNome} › ` : ""}{c.nome} ({c.totalCursos} {c.totalCursos === 1 ? "curso" : "cursos"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      disabled={!competenciaEscolhida || vincular.isPending}
                      onClick={() => vincular.mutate({ codigoPdi: selecionado.codigo, rotuloPdi: rotuloDoItem(selecionado), competenciaId: Number(competenciaEscolhida) })}
                    >
                      Vincular
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {orfaos.length > 0 && (
          <Card className="border-amber-300">
            <CardHeader>
              <CardTitle>Vínculos sem correspondência no PDI</CardTitle>
              <CardDescription>O código destes vínculos não está mais no catálogo do PDI. Revise e remova se não forem mais usados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {orfaos.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>{v.rotuloPdi} → {v.competenciaNome ?? v.competenciaId}</span>
                  <Button variant="ghost" size="sm" onClick={() => desvincular.mutate({ id: Number(v.id) })} aria-label="Remover vínculo">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
