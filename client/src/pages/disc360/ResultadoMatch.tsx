import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Dimensao = "D" | "I" | "S" | "C";

const NONE_VALUE = "none";
const DIMENSOES: Dimensao[] = ["D", "I", "S", "C"];

const EIXO_INFO: Record<Dimensao, { label: string }> = {
  D: { label: "Dominancia / Determinacao" },
  I: { label: "Influencia / Comunicacao" },
  S: { label: "Estabilidade / Cooperacao" },
  C: { label: "Conformidade / Cautela" },
};

const PALETA_PESSOAS = [
  "#7C3AED",
  "#0EA5E9",
  "#DB2777",
  "#059669",
  "#EA580C",
  "#4338CA",
  "#CA8A04",
  "#0D9488",
  "#BE123C",
  "#475569",
];

const MAX_COLABORADORES = 10;

export default function ResultadoMatch() {
  return (
    <DashboardLayout>
      <ResultadoMatchContent />
    </DashboardLayout>
  );
}

function ResultadoMatchContent() {
  const [programId, setProgramId] = useState("");
  const numericProgramId = programId ? Number(programId) : undefined;
  const [departmentId, setDepartmentId] = useState(NONE_VALUE);
  const [cargoProfileId, setCargoProfileId] = useState("");
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<number[]>([]);

  const { data: empresas = [] } = trpc.admin.listEmpresas.useQuery();
  const { data: departamentos = [] } = trpc.departments.list.useQuery(
    { programId: numericProgramId as number, includeInactive: true },
    { enabled: !!numericProgramId }
  );
  const { data: perfis = [] } = trpc.disc360.listRoleProfiles.useQuery(
    { programId: numericProgramId as number },
    { enabled: !!numericProgramId }
  );

  const perfisFiltrados = (perfis as any[]).filter((p) =>
    departmentId === NONE_VALUE ? true : String(p.departmentId ?? "") === departmentId
  );

  const numericCargoProfileId = cargoProfileId ? Number(cargoProfileId) : null;

  const { data: alunosDisponiveis = [] } = trpc.disc360.searchAlunosForSelection.useQuery(
    {
      programId: numericProgramId as number,
      departmentId: departmentId === NONE_VALUE ? undefined : Number(departmentId),
    },
    { enabled: !!numericProgramId }
  );

  const alunosFiltrados = (alunosDisponiveis as any[]).filter((a) =>
    busca.trim() ? a.name.toLowerCase().includes(busca.trim().toLowerCase()) : true
  );

  const toggleAluno = (alunoId: number) => {
    setSelecionados((prev) => {
      if (prev.includes(alunoId)) return prev.filter((id) => id !== alunoId);
      if (prev.length >= MAX_COLABORADORES) return prev;
      return [...prev, alunoId];
    });
  };

  const { data, isLoading, error } = trpc.disc360.getResultadoMatch.useQuery(
    { cargoProfileId: numericCargoProfileId ?? 0, alunoIds: selecionados },
    { enabled: !!numericCargoProfileId && selecionados.length > 0 }
  );

  const chartData = data
    ? DIMENSOES.map((eixo) => {
        const point: Record<string, any> = { eixo };
        point.cargo = (data.cargoScores as any)[eixo];
        (data.pessoas as any[]).forEach((p) => {
          point["p" + p.alunoId] = p.scores ? p.scores[eixo] : null;
        });
        return point;
      })
    : [];

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
          <CardTitle className="text-base">Resultado / Match - Pessoa x Cargo</CardTitle>
          <CardDescription>
            Selecione o cargo e ate {MAX_COLABORADORES} colaboradores para comparar o perfil DISC de cada um com o
            perfil ideal do cargo.
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
                setSelecionados([]);
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
                setSelecionados([]);
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

      {numericProgramId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Colaboradores</CardTitle>
            <CardDescription>
              Escolha ate {MAX_COLABORADORES} colaboradores para comparar ({selecionados.length}/{MAX_COLABORADORES}{" "}
              selecionados).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Buscar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="max-w-sm"
            />
            <div className="grid gap-2 md:grid-cols-2 max-h-80 overflow-y-auto pr-2">
              {alunosFiltrados.map((a: any) => {
                const checked = selecionados.includes(a.id);
                const disabled = !checked && selecionados.length >= MAX_COLABORADORES;
                return (
                  <label
                    key={a.id}
                    className={
                      "flex items-center gap-2 rounded-md border p-2 text-sm " +
                      (disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-muted/50")
                    }
                  >
                    <Checkbox checked={checked} disabled={disabled} onCheckedChange={() => toggleAluno(a.id)} />
                    <span className="flex-1">
                      {a.name}
                      {a.cargo && <span className="text-muted-foreground"> - {a.cargo}</span>}
                    </span>
                  </label>
                );
              })}
              {alunosFiltrados.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-2">Nenhum colaborador encontrado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!numericCargoProfileId && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Selecione um cargo e ao menos um colaborador para ver o resultado.
          </CardContent>
        </Card>
      )}

      {numericCargoProfileId && selecionados.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Selecione ao menos um colaborador para ver o resultado.
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Calculando resultado...</CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">Erro ao calcular o resultado.</CardContent>
        </Card>
      )}

      {data && data.pessoas.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparativo DISC - Colaboradores x Cargo</CardTitle>
              <CardDescription>
                Cada linha colorida representa um colaborador. A linha tracejada cinza representa o perfil ideal do
                cargo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={chartData} margin={{ top: 24, right: 24, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="eixo" tickFormatter={(v: Dimensao) => v + " - " + EIXO_INFO[v].label.split(" / ")[0]} />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(value: number) => [value + "%", "Percentual"]} />
                  <Legend />
                  <Line
                    type="linear"
                    dataKey="cargo"
                    name="Cargo (perfil ideal)"
                    stroke="#64748B"
                    strokeDasharray="6 4"
                    strokeWidth={2}
                    dot={false}
                  />
                  {(data.pessoas as any[]).map((p, i) => (
                    <Line
                      key={p.alunoId}
                      type="linear"
                      dataKey={"p" + p.alunoId}
                      name={p.nome}
                      stroke={PALETA_PESSOAS[i % PALETA_PESSOAS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {(data.pessoas as any[]).map((p, i) => (
              <Card key={p.alunoId}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: PALETA_PESSOAS[i % PALETA_PESSOAS.length] }}
                      />
                      <CardTitle className="text-base">{p.nome}</CardTitle>
                    </div>
                    {p.indiceMatch !== null && (
                      <Badge variant="secondary" className="text-sm">
                        Indice de Match: {p.indiceMatch}%
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {p.semDiscConcluido ? (
                    <p className="text-sm text-muted-foreground">
                      Este colaborador ainda nao concluiu o teste DISC - nao e possivel calcular o resultado.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {(p.justificativas as any[]).map((j: any) => (
                        <li key={j.eixo} className="text-sm text-muted-foreground">
                          <strong className="text-foreground">{j.eixo}</strong> - {j.texto}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
