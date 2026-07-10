import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const DIMENSOES: Dimensao[] = ["D", "I", "S", "C"];

const EIXO_INFO: Record<Dimensao, { label: string; color: string }> = {
  D: { label: "Dominância / Determinação", color: "#DC2626" },
  I: { label: "Influência / Comunicação", color: "#F59E0B" },
  S: { label: "Estabilidade / Cooperação", color: "#16A34A" },
  C: { label: "Conformidade / Cautela", color: "#2563EB" },
};

const STATUS_LABELS: Record<string, string> = {
  previa: "Prévia (aguardando o segundo respondente)",
  suficiente: "Consolidado (líder e empregado responderam)",
};

export default function RelatorioCargo() {
  const [, params] = useRoute("/disc360/relatorio-cargo/:cargoProfileId");
  const cargoProfileId = params?.cargoProfileId ? Number(params.cargoProfileId) : null;

  const { data: perfil } = trpc.disc360.getRoleProfileById.useQuery(
    { id: cargoProfileId ?? 0 },
    { enabled: !!cargoProfileId }
  );
  const { data, isLoading, error } = trpc.disc360.previewCargoConsolidacao.useQuery(
    { cargoProfileId: cargoProfileId ?? 0 },
    { enabled: !!cargoProfileId }
  );

  const hoje = new Date().toLocaleDateString("pt-BR");

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .report-page { page-break-after: always; padding-top: 0 !important; }
          .report-page:last-child { page-break-after: auto; }
          body { background: white; }
        }
        .report-page { min-height: 100vh; padding: 48px; }
      `}</style>

      <div className="no-print flex items-center justify-between gap-2 border-b p-4">
        <Link href="/disc360/perfis-cargo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <Button onClick={() => window.print()} disabled={!data}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      {!cargoProfileId && (
        <p className="p-6 text-sm text-muted-foreground">Cargo não identificado.</p>
      )}
      {cargoProfileId && isLoading && (
        <p className="p-6 text-sm text-muted-foreground">Carregando relatório...</p>
      )}
      {cargoProfileId && error && (
        <p className="p-6 text-sm text-destructive">Não foi possível carregar o relatório: {error.message}</p>
      )}

      {cargoProfileId && data && (
        <>
          {/* Página 1 — Capa */}
          <section className="report-page flex flex-col items-center justify-center text-center">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Ecossistema do Bem</p>
            <h1 className="mt-4 text-3xl font-bold">Relatório de Perfil DISC do Cargo</h1>
            <h2 className="mt-2 text-xl text-muted-foreground">{(perfil as any)?.cargoNome ?? "Cargo"}</h2>
            <p className="mt-8 text-sm text-muted-foreground">{hoje}</p>
          </section>

          {/* Página 2 — Metodologia */}
          <section className="report-page">
            <h2 className="mb-4 text-xl font-semibold">Metodologia</h2>
            <p className="mb-4 text-sm leading-relaxed text-slate-700">
              Este relatório apresenta o perfil comportamental (DISC) que o cargo exige da pessoa que o
              ocupa — não é uma avaliação de uma pessoa específica. O resultado é construído a partir das
              respostas de dois papéis fixos: o líder da posição e um empregado que ocupa o cargo, no
              modelo de escolha forçada (mais/menos). Cada eixo (D, I, S, C) é calculado de forma
              independente, numa escala de 0 a 100, com 50 representando o ponto de equilíbrio.
            </p>
            <p className="mb-4 text-sm text-slate-700">
              {data.totalRespondentes} de 2 respondente(s) esperados já responderam.{" "}
              {STATUS_LABELS[data.statusConsistencia] ?? data.statusConsistencia}.
            </p>
            <p className="text-xs text-muted-foreground">
              Cada respondente também indica, numa régua de 0 a 100, sua percepção direta sobre o quanto
              o cargo exige condução direta/assertiva (perto de 100) ou cautelosa/diplomática (perto de
              0). Quando essa régua diverge muito do D calculado pelas escolhas forçadas, o relatório
              sinaliza um alerta de possível tendenciosidade na resposta daquele respondente.
            </p>
          </section>

          {/* Página 3 — Perfil do cargo */}
          <section className="report-page">
            <h2 className="mb-1 text-xl font-semibold">Perfil esperado (D/I/S/C)</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Predominante: <strong>{data.perfilPredominante}</strong> · Secundário:{" "}
              <strong>{data.perfilSecundario}</strong>
            </p>
            <div className="mb-4">
              <Badge variant="outline">{STATUS_LABELS[data.statusConsistencia] ?? data.statusConsistencia}</Badge>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={DIMENSOES.map((eixo) => ({ eixo, valor: (data.scoresMedios as any)[eixo] }))}
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
                  isAnimationActive={false}
                  dot={(props: any) => {
                    const { cx, cy, payload, key } = props;
                    const color = EIXO_INFO[payload.eixo as Dimensao].color;
                    return <circle key={key ?? payload.eixo} cx={cx} cy={cy} r={7} fill={color} stroke="#ffffff" strokeWidth={2} />;
                  }}
                  label={{ position: "top", fontSize: 12, fontWeight: 600, fill: "#334155", formatter: (v: number) => `${v}%` }}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>

          {/* Página 4 — Detalhe dos respondentes */}
          <section className="report-page">
            <h2 className="mb-4 text-xl font-semibold">Respostas individuais</h2>
            <div className="space-y-4">
              {data.respondentes.map((r: any, i: number) => (
                <div key={i} className="rounded-md border p-4">
                  <h3 className="mb-1 font-semibold">
                    {r.papelRespondente === "lider" ? "Líder" : "Empregado"} — {r.respondentName}
                  </h3>
                  <p className="text-sm text-slate-700">
                    D {r.scores.D} · I {r.scores.I} · S {r.scores.S} · C {r.scores.C}
                  </p>
                  <p className="text-sm text-slate-700">Régua de validação: {r.respostaValidacaoDireta}</p>
                  {r.avaliacaoDivergencia?.divergente && (
                    <p className="mt-2 text-sm font-medium text-amber-700">{r.avaliacaoDivergencia.texto}</p>
                  )}
                </div>
              ))}
              {data.respondentes.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum respondente concluiu o questionário ainda.</p>
              )}
            </div>
            <p className="mt-8 border-t pt-3 text-xs text-muted-foreground">
              Este relatório reflete o perfil comportamental esperado para o cargo, com base em cálculo
              estatístico automatizado (sem uso de IA). A leitura deve ser feita com o acompanhamento de
              um profissional com formação em DISC, para evitar interpretações equivocadas.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
