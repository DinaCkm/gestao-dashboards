import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Dimensao = "D" | "I" | "S" | "C";

const DIMENSOES: Dimensao[] = ["D", "I", "S", "C"];

const EIXO_INFO: Record<Dimensao, { label: string; color: string }> = {
  D: { label: "Dominância / Determinação", color: "#DC2626" },
  I: { label: "Influência / Comunicação", color: "#F59E0B" },
  S: { label: "Estabilidade / Cooperação", color: "#16A34A" },
  C: { label: "Conformidade / Cautela", color: "#2563EB" },
};

const STATUS_LABELS: Record<string, string> = {
  previa: "Prévia (aguardando mais respostas)",
  suficiente: "Consolidado (base suficiente)",
};

const CONCORDANCIA_LABELS: Record<string, string> = {
  alta: "Alta concordância",
  media: "Concordância média",
  baixa: "Baixa concordância",
};

const CONSENSO_LABELS: Record<string, string> = {
  unanime: "Unânime",
  majoritaria: "Majoritária",
  dividida: "Dividida",
};

export default function DashboardCultura() {
  return (
    <DashboardLayout>
      <DashboardCulturaContent />
    </DashboardLayout>
  );
}

function DashboardCulturaContent() {
  const [, params] = useRoute("/disc360/dashboard-cultura/:orgProfileId");
  const orgProfileId = params?.orgProfileId ? Number(params.orgProfileId) : null;

  const { data, isLoading, error } = trpc.disc360.getDashboardCultura.useQuery(
    { orgProfileId: orgProfileId ?? 0 },
    { enabled: !!orgProfileId }
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Link href="/disc360/perfis-empresa">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      {!orgProfileId && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Perfil da empresa não identificado.
          </CardContent>
        </Card>
      )}

      {orgProfileId && isLoading && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Carregando resultado...</CardContent>
        </Card>
      )}

      {orgProfileId && error && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            Não foi possível carregar o resultado: {error.message}
          </CardContent>
        </Card>
      )}

      {orgProfileId && data && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>{data.nomeEmpresa}</CardTitle>
                  <CardDescription>Dashboard de Cultura Comportamental (DISC)</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={data.consolidado.statusConsistencia === "suficiente" ? "default" : "outline"}>
                    {STATUS_LABELS[data.consolidado.statusConsistencia] ?? data.consolidado.statusConsistencia}
                  </Badge>
                  <Badge variant="outline">
                    {CONCORDANCIA_LABELS[data.consolidado.classificacaoConcordancia] ??
                      data.consolidado.classificacaoConcordancia}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>{data.consolidado.totalRespondentes} respondente(s) considerados neste resultado.</p>
              <p>{data.consolidado.textoConcordancia}</p>
            </CardContent>
          </Card>

          {data.notaMetodologica && (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="pt-4 text-xs text-muted-foreground">{data.notaMetodologica}</CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Perfil geral (D/I/S/C)</CardTitle>
              <CardDescription>
                Predominante: <strong>{data.consolidado.perfilPredominante}</strong> · Secundário:{" "}
                <strong>{data.consolidado.perfilSecundario}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={DIMENSOES.map((eixo) => ({ eixo, valor: data.consolidado.scoresMedios[eixo] }))}
                  margin={{ top: 24, right: 24, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="eixo" tickFormatter={(v: Dimensao) => `${v} — ${EIXO_INFO[v].label.split(" / ")[0]}`} />
                  <YAxis domain={[0, 100]} unit="%" />
                  <ReferenceLine
                    y={50}
                    stroke="#64748b"
                    strokeDasharray="4 4"
                    label={{ value: "50% (média)", position: "insideTopRight", fontSize: 11, fill: "#64748b" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Percentual"]}
                    labelFormatter={(v: Dimensao) => EIXO_INFO[v]?.label ?? v}
                  />
                  <Line
                    type="linear"
                    dataKey="valor"
                    stroke="#334155"
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, payload, key } = props;
                      const color = EIXO_INFO[payload.eixo as Dimensao].color;
                      return <circle key={key ?? payload.eixo} cx={cx} cy={cy} r={7} fill={color} stroke="#ffffff" strokeWidth={2} />;
                    }}
                    activeDot={{ r: 8 }}
                    label={{ position: "top", fontSize: 12, fontWeight: 600, fill: "#334155", formatter: (v: number) => `${v}%` }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {DIMENSOES.map((eixo) => {
              const info = data.textosPorEixo[eixo];
              return (
                <Card key={eixo}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base" style={{ color: EIXO_INFO[eixo].color }}>
                        {eixo} — {EIXO_INFO[eixo].label}
                      </CardTitle>
                      <Badge variant="secondary">{info.percentual}%</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{info.texto}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {data.leituraCombinada && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Leitura combinada</CardTitle>
                <CardDescription>
                  Como {data.consolidado.perfilPredominante} e {data.consolidado.perfilSecundario} se combinam na cultura percebida.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{data.leituraCombinada}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Onde a cultura se expressa mais</CardTitle>
              <CardDescription>
                Eixo predominante em cada uma das {data.predominanciaPorTema.length} perguntas do questionário.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[420px] overflow-y-auto overflow-x-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tema</TableHead>
                      <TableHead>Eixo predominante</TableHead>
                      <TableHead>Consenso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.predominanciaPorTema.map((item) => (
                      <TableRow key={item.questionId}>
                        <TableCell className="max-w-xs">
                          <div className="font-medium">{item.tema ?? item.questionId}</div>
                          {item.pergunta && (
                            <div className="text-xs text-muted-foreground">{item.pergunta}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge style={{ backgroundColor: EIXO_INFO[item.eixoPredominante as Dimensao].color, color: "white" }}>
                            {item.eixoPredominante} — {EIXO_INFO[item.eixoPredominante as Dimensao].label.split(" / ")[0]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {CONSENSO_LABELS[item.classificacaoConsenso] ?? item.classificacaoConsenso}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {data.recomendacoes && data.recomendacoes.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recomendações práticas</CardTitle>
                <CardDescription>Sugestões de desenvolvimento com base no eixo predominante.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {data.recomendacoes.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <p className="border-t pt-3 text-xs text-muted-foreground">
            Este dashboard reflete a cultura percebida e esperada pelos respondentes, com base em cálculo
            estatístico automatizado (sem uso de IA). A leitura deve ser feita com o acompanhamento de um
            profissional com formação em DISC, para evitar interpretações equivocadas sobre a cultura da empresa.
          </p>
        </>
      )}
    </div>
  );
}
