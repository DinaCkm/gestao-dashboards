import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AnjoRouteGuard from "@/features/programaIntegracao/components/AnjoRouteGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Clock3, CheckCircle2, FileText, Loader2, Sparkles, BarChart3 } from "lucide-react";
import { carregarFormulariosAnjo, type AnjoFormulariosResponse } from "@/features/programaIntegracao/api/anjo";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
          <h1 className="text-3xl font-bold tracking-tight">Acompanhar Integração</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe seus formulários e a evolução das avaliações que você mesmo respondeu ao longo da integração.
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
            {dados.indicadores.pendentes === 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 shadow-sm">
                <div className="mt-0.5 rounded-full bg-emerald-100 p-2">
                  <Sparkles className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <p className="font-semibold">Parabéns! Você está em dia com os formulários.</p>
                  <p className="mt-1 text-sm text-emerald-800">
                    Não há formulários pendentes no momento. Os que ainda não estão disponíveis serão liberados no momento previsto da integração.
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <Card><CardContent className="flex items-center gap-3 pt-6"><Clock3 className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Aguardando liberação</p><p className="text-2xl font-bold">{dados.indicadores.aguardando}</p></div></CardContent></Card>
              <Card><CardContent className="flex items-center gap-3 pt-6"><FileText className="h-5 w-5 text-amber-600" /><div><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-2xl font-bold">{dados.indicadores.pendentes}</p></div></CardContent></Card>
              <Card><CardContent className="flex items-center gap-3 pt-6"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><div><p className="text-xs text-muted-foreground">Respondidos</p><p className="text-2xl font-bold">{dados.indicadores.respondidos}</p></div></CardContent></Card>
            </div>

            {!!dados.evolucao?.length && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Minha evolução</p>
                  <h2 className="text-xl font-bold">Como minha percepção evoluiu</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Esta leitura considera exclusivamente as avaliações que você mesmo respondeu como Anjo.
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {dados.evolucao.map((item) => {
                    const chartData = item.ciclos.map((ciclo) => ({
                      momento: ciclo.label,
                      media: ciclo.mediaGeral,
                    }));
                    const ultimo = item.ciclos[item.ciclos.length - 1];
                    const pilares = [
                      ["Adaptação ao Trabalho", "adaptacao"],
                      ["Conduta Ética", "etica"],
                      ["Segurança da Informação", "seguranca"],
                      ["Postura no Trabalho", "postura"],
                      ["Trabalho em Equipe", "equipe"],
                      ["Qualidade do Trabalho", "qualidade"],
                    ] as const;
                    return (
                      <Card key={item.processoId} className="overflow-hidden border-violet-200/70">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <BarChart3 className="h-5 w-5 text-violet-600" />
                            {item.colaborador}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {item.cargo || "Cargo não informado"}{item.unidade ? ` · ${item.unidade}` : ""}
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                                <XAxis dataKey="momento" />
                                <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} />
                                <Tooltip formatter={(value: number) => Number(value).toFixed(2).replace(".", ",")} />
                                <Line type="monotone" dataKey="media" name="Minha percepção geral" stroke="#6D4BA3" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          {ultimo && (
                            <div>
                              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Última avaliação · {ultimo.label} alinhamento
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {pilares.map(([nome, chave]) => (
                                  <div key={chave} className="rounded-lg border bg-muted/15 p-3">
                                    <div className="text-xs text-muted-foreground">{nome}</div>
                                    <div className="mt-1 text-lg font-bold">
                                      {ultimo.pilares[chave] == null ? "—" : Number(ultimo.pilares[chave]).toFixed(2).replace(".", ",")}
                                      <span className="ml-1 text-xs font-normal text-muted-foreground">/ 5</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

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
