import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AnjoRouteGuard from "@/features/programaIntegracao/components/AnjoRouteGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Clock3, CheckCircle2, FileText, Loader2 } from "lucide-react";
import { carregarFormulariosAnjo, type AnjoFormulariosResponse } from "@/features/programaIntegracao/api/anjo";

function formatarData(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}

export default function AnjoFormularios() {
  const [dados, setDados] = useState<AnjoFormulariosResponse | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    carregarFormulariosAnjo()
      .then((res) => { if (ativo) setDados(res); })
      .catch((e) => { if (ativo) setErro(e instanceof Error ? e.message : "Não foi possível carregar os formulários."); })
      .finally(() => { if (ativo) setLoading(false); });
    return () => { ativo = false; };
  }, []);

  return (
    <DashboardLayout>
      <AnjoRouteGuard>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">Espaço do Anjo</p>
          <h1 className="text-3xl font-bold tracking-tight">Acompanhar Formulários</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe os formulários relacionados às integrações sob sua responsabilidade.
          </p>
        </div>

        {loading ? (
          <Card><CardContent className="flex items-center justify-center gap-3 py-12"><Loader2 className="h-5 w-5 animate-spin" /><span>Carregando seus acompanhamentos...</span></CardContent></Card>
        ) : erro ? (
          <Card><CardContent className="py-10 text-center text-sm text-destructive">{erro}</CardContent></Card>
        ) : !dados?.formularios.length ? (
          <Card><CardContent className="py-12 text-center"><ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-4 font-semibold">Você não possui integrações ativas sob seu acompanhamento no momento.</p><p className="mt-1 text-sm text-muted-foreground">Quando houver um processo ativo em que você esteja vinculado como Anjo, ele aparecerá aqui.</p></CardContent></Card>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card><CardContent className="flex items-center gap-3 pt-6"><Clock3 className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Aguardando liberação</p><p className="text-2xl font-bold">{dados.indicadores.aguardando}</p></div></CardContent></Card>
              <Card><CardContent className="flex items-center gap-3 pt-6"><FileText className="h-5 w-5 text-amber-600" /><div><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-2xl font-bold">{dados.indicadores.pendentes}</p></div></CardContent></Card>
              <Card><CardContent className="flex items-center gap-3 pt-6"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><div><p className="text-xs text-muted-foreground">Respondidos</p><p className="text-2xl font-bold">{dados.indicadores.respondidos}</p></div></CardContent></Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {dados.formularios.map((item) => (
                <Card key={`${item.processoId}-${item.ciclo}`}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">{item.colaborador}</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">{item.cargo || "Cargo não informado"}{item.unidade ? ` · ${item.unidade}` : ""}</p>
                      </div>
                      {item.status === "respondido" ? <Badge className="bg-emerald-600">Respondido</Badge> : item.status === "pendente" ? <Badge variant="secondary">Pendente</Badge> : <Badge variant="outline">Aguardando liberação</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-md border bg-muted/20 p-3 text-sm">
                      <p className="font-medium">{item.nome}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.ciclo}.º alinhamento · item {item.itemId}</p>
                    </div>
                    {item.status === "aguardando_liberacao" && <p className="text-sm text-muted-foreground">{item.bloqueioMotivo}</p>}
                    {item.status === "respondido" && <p className="text-sm text-muted-foreground">Resposta registrada em {formatarData(item.respondidoEm)}.</p>}
                    {item.status === "pendente" && <Button type="button" onClick={() => { window.location.href = item.rotaPublica; }}>Responder formulário</Button>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
      </AnjoRouteGuard>
    </DashboardLayout>
  );
}
