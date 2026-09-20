import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Printer } from "lucide-react";
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

const NONE_VALUE = "none";

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

export default function DashboardCargo() {
  return (
    <DashboardLayout>
      <DashboardCargoContent />
    </DashboardLayout>
  );
}

function DashboardCargoContent() {
  const [programId, setProgramId] = useState("");
  const numericProgramId = programId ? Number(programId) : undefined;
  const [departmentId, setDepartmentId] = useState(NONE_VALUE);
  const [cargoProfileId, setCargoProfileId] = useState("");

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const preId = search.get("cargoProfileId");
    if (preId) setCargoProfileId(preId);
  }, []);

  const { data: empresas = [] } = trpc.admin.listEmpresas.useQuery();
  const { data: departamentos = [] } = trpc.departments.list.useQuery(
    { programId: numericProgramId as number, includeInactive: true },
    { enabled: !!numericProgramId }
  );
  const { data: perfis = [] } = trpc.disc360.listRoleProfiles.useQuery(
    { programId: numericProgramId as number },
    { enabled: !!numericProgramId }
  );

  const numericCargoProfileId = cargoProfileId ? Number(cargoProfileId) : null;

  const { data, isLoading, error } = trpc.disc360.getDashboardCargo.useQuery(
    { cargoProfileId: numericCargoProfileId ?? 0 },
    { enabled: !!numericCargoProfileId }
  );

  useEffect(() => {
    if (data?.cargoProfile && !programId) {
      setProgramId(String((data.cargoProfile as any).programId));
      if ((data.cargoProfile as any).departmentId) {
        setDepartmentId(String((data.cargoProfile as any).departmentId));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const perfisFiltrados = (perfis as any[]).filter((p) =>
    departmentId === NONE_VALUE ? true : String(p.departmentId ?? "") === departmentId
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <Link href="/disc360/perfis-cargo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        {numericCargoProfileId && (
          <Link href={`/disc360/relatorio-cargo/${numericCargoProfileId}`}>
            <Button variant="outline" size="sm">
              <Printer className="mr-1 h-4 w-4" />
              Relatório para impressão
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selecionar cargo</CardTitle>
          <CardDescription>
            Escolha o programa, opcionalmente filtre por departamento, e selecione o cargo para ver o
            dashboard isolado dele.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Programa / Empresa</Label>
            <Select
              value={programId}
              onValueChange={(v) => {
                setProgramId(v);
                setDepartmentId(NONE_VALUE);
                setCargoProfileId("");
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
            <Select
              value={departmentId}
              onValueChange={(v) => {
                setDepartmentId(v);
                setCargoProfileId("");
              }}
              disabled={!numericProgramId}
            >
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
            <Label>Cargo</Label>
            <Select value={cargoProfileId} onValueChange={setCargoProfileId} disabled={!numericProgramId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent>
                {perfisFiltrados.map((p: any) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.cargoNome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!numericCargoProfileId && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Selecione um cargo acima para ver o dashboard.
          </CardContent>
        </Card>
      )}

      {numericCargoProfileId && isLoading && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Carregando dashboard...</CardContent>
        </Card>
      )}

      {numericCargoProfileId && error && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            Erro ao carregar o dashboard deste cargo.
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{(data.cargoProfile as any)?.cargoNome}</CardTitle>
              <CardDescription>
                {data.consolidado.totalRespondentes} respondente(s) considerados neste resultado ·{" "}
                {STATUS_LABELS[data.consolidado.statusConsistencia] ?? data.consolidado.statusConsistencia}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Perfil do cargo (D/I/S/C)</CardTitle>
              <CardDescription>
                Predominante: <strong>{data.consolidado.perfilPredominante}</strong> · Secundário:{" "}
                <strong>{data.consolidado.perfilSecundario}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={DIMENSOES.map((eixo) => ({ eixo, valor: (data.consolidado.scoresMedios as any)[eixo] }))}
                  margin={{ top: 24, right: 24, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="eixo"
                    tickFormatter={(v: Dimensao) => `${v} — ${EIXO_INFO[v].label.split(" / ")[0]}`}
                  />
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
                      return (
                        <circle key={key ?? payload.eixo} cx={cx} cy={cy} r={7} fill={color} stroke="#ffffff" strokeWidth={2} />
                      );
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
              const info = (data.textosPorEixo as any)[eixo];
              return (
                <Card key={eixo}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base" style={{ color: EIXO_INFO[eixo].color }}>
                        {eixo} — {EIXO_INFO[eixo].label}
                      </CardTitle>
                      <Badge variant="secondary">{info.percentual}%</Badge>
                    </div>
                    {info.label && <CardDescription>{info.label}</CardDescription>}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{info.texto}</p>

                    {(info.pontosPositivos ?? []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-700">Pontos positivos</p>
                        <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5 mt-1">
                          {info.pontosPositivos.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(info.pontosAtencao ?? []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-700">Pontos de atenção</p>
                        <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5 mt-1">
                          {info.pontosAtencao.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(info.pontosInvestigarSelecao ?? []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          Principais pontos a investigar em processos seletivos
                        </p>
                        <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5 mt-1">
                          {info.pontosInvestigarSelecao.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Respostas por respondente</CardTitle>
              <CardDescription>Líder e empregado que responderam o questionário deste cargo.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Papel</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>D</TableHead>
                    <TableHead>I</TableHead>
                    <TableHead>S</TableHead>
                    <TableHead>C</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.consolidado.respondentes as any[]).map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{r.papelRespondente === "lider" ? "Líder" : "Empregado"}</TableCell>
                      <TableCell>{r.respondentName}</TableCell>
                      <TableCell>{r.scores.D}%</TableCell>
                      <TableCell>{r.scores.I}%</TableCell>
                      <TableCell>{r.scores.S}%</TableCell>
                      <TableCell>{r.scores.C}%</TableCell>
                    </TableRow>
                  ))}
                  {data.consolidado.respondentes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        Nenhuma resposta concluída ainda para este cargo.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {(data.consolidado.respondentes as any[]).some((r) =>
                (r.avaliacoesDivergencia ?? []).some((av: any) => av.divergente)
              ) && (
                <div className="mt-4 space-y-1 border-t pt-4">
                  {(data.consolidado.respondentes as any[]).map((r, idx) =>
                    (r.avaliacoesDivergencia ?? [])
                      .filter((av: any) => av.divergente)
                      .map((av: any) => (
                        <p key={`${idx}-${av.dimensao}`} className="text-xs text-amber-600">
                          {r.respondentName ? `${r.respondentName}: ` : ""}
                          {av.texto}
                        </p>
                      ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
