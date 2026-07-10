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

export default function RelatorioCultura() {
  const [, params] = useRoute("/disc360/relatorio-cultura/:orgProfileId");
  const orgProfileId = params?.orgProfileId ? Number(params.orgProfileId) : null;

  const { data, isLoading, error } = trpc.disc360.getDashboardCultura.useQuery(
    { orgProfileId: orgProfileId ?? 0 },
    { enabled: !!orgProfileId }
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
        <Link href={`/disc360/dashboard-cultura/${orgProfileId ?? ""}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar ao dashboard
          </Button>
        </Link>
        <Button onClick={() => window.print()} disabled={!data}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      {!orgProfileId && (
        <p className="p-6 text-sm text-muted-foreground">Perfil da empresa não identificado.</p>
      )}
      {orgProfileId && isLoading && (
        <p className="p-6 text-sm text-muted-foreground">Carregando relatório...</p>
      )}
      {orgProfileId && error && (
        <p className="p-6 text-sm text-destructive">Não foi possível carregar o relatório: {error.message}</p>
      )}

      {orgProfileId && data && (
        <>
          {/* Página 1 — Capa */}
          <section className="report-page flex flex-col items-center justify-center text-center">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Ecossistema do Bem</p>
            <h1 className="mt-4 text-3xl font-bold">Relatório de Cultura Comportamental (DISC)</h1>
            <h2 className="mt-2 text-xl text-muted-foreground">{data.nomeEmpresa}</h2>
            <p className="mt-8 text-sm text-muted-foreground">{hoje}</p>
          </section>

          {/* Página 2 — Metodologia */}
          <section className="report-page">
            <h2 className="mb-4 text-xl font-semibold">Metodologia</h2>
            <p className="mb-4 text-sm leading-relaxed text-slate-700">
              Este relatório apresenta a leitura da cultura organizacional percebida e esperada pelos
              respondentes de {data.nomeEmpresa}, construída a partir do questionário de Cultura
              Comportamental (modelo de escolha forçada — mais/menos). Cada eixo (D, I, S, C) é
              calculado de forma independente, numa escala de 0 a 100, com 50 representando o ponto de
              equilíbrio — e não uma soma percentual entre os quatro eixos.
            </p>
            {data.notaMetodologica && (
              <p className="mb-4 rounded-md border border-dashed p-4 text-sm text-slate-700">
                {data.notaMetodologica}
              </p>
            )}
            <p className="mb-4 text-sm text-slate-700">
              Este resultado foi calculado com base em {data.consolidado.totalRespondentes} respondente(s).{" "}
              {STATUS_LABELS[data.consolidado.statusConsistencia] ?? data.consolidado.statusConsistencia}.
            </p>
            <p className="text-xs text-muted-foreground">
              Este relatório foi gerado por cálculo estatístico automatizado e deve ser interpretado por
              um profissional com formação em DISC. Leituras isoladas, sem esse acompanhamento, podem
              levar a interpretações equivocadas sobre a cultura da empresa.
            </p>
          </section>

          {/* Página 3 — Perfil geral */}
          <section className="report-page">
            <h2 className="mb-1 text-xl font-semibold">Perfil geral (D/I/S/C)</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Predominante: <strong>{data.consolidado.perfilPredominante}</strong> · Secundário:{" "}
              <strong>{data.consolidado.perfilSecundario}</strong>
            </p>
            <div className="mb-4 flex gap-2">
              <Badge variant="outline">
                {STATUS_LABELS[data.consolidado.statusConsistencia] ?? data.consolidado.statusConsistencia}
              </Badge>
              <Badge variant="outline">
                {CONCORDANCIA_LABELS[data.consolidado.classificacaoConcordancia] ??
                  data.consolidado.classificacaoConcordancia}
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={320}>
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
            <p className="mt-2 text-sm text-slate-700">{data.consolidado.textoConcordancia}</p>
          </section>

          {/* Página 4 — Leitura por eixo */}
          <section className="report-page">
            <h2 className="mb-4 text-xl font-semibold">Leitura por eixo</h2>
            <div className="space-y-4">
              {DIMENSOES.map((eixo) => {
                const info = (data.textosPorEixo as any)[eixo];
                return (
                  <div key={eixo} className="rounded-md border p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <h3 className="font-semibold" style={{ color: EIXO_INFO[eixo].color }}>
                        {eixo} — {EIXO_INFO[eixo].label}
                      </h3>
                      <Badge variant="secondary">{info.percentual}%</Badge>
                    </div>
                    <p className="text-sm text-slate-700">{info.texto}</p>
                  </div>
                );
              })}
            </div>
            {data.leituraCombinada && (
              <div className="mt-4 rounded-md border p-4">
                <h3 className="mb-1 font-semibold">Leitura combinada</h3>
                <p className="text-sm text-slate-700">{data.leituraCombinada}</p>
              </div>
            )}
          </section>

          {/* Página 5 — Onde a cultura se expressa mais */}
          <section className="report-page">
            <h2 className="mb-1 text-xl font-semibold">Onde a cultura se expressa mais</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Eixo predominante em cada uma das {data.predominanciaPorTema.length} perguntas do questionário.
            </p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-2">Tema</th>
                  <th className="py-2 pr-2">Eixo predominante</th>
                  <th className="py-2">Consenso</th>
                </tr>
              </thead>
              <tbody>
                {data.predominanciaPorTema.map((item: any) => (
                  <tr key={item.questionId} className="border-b">
                    <td className="py-2 pr-2">
                      <div className="font-medium">{item.tema ?? item.questionId}</div>
                      {item.pergunta && <div className="text-xs text-muted-foreground">{item.pergunta}</div>}
                    </td>
                    <td className="py-2 pr-2">
                      <Badge style={{ backgroundColor: EIXO_INFO[item.eixoPredominante as Dimensao].color, color: "white" }}>
                        {item.eixoPredominante} — {EIXO_INFO[item.eixoPredominante as Dimensao].label.split(" / ")[0]}
                      </Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {CONSENSO_LABELS[item.classificacaoConsenso] ?? item.classificacaoConsenso}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Página 6 — Recomendações */}
          <section className="report-page">
            <h2 className="mb-4 text-xl font-semibold">Recomendações práticas</h2>
            {data.recomendacoes && data.recomendacoes.length > 0 ? (
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                {data.recomendacoes.map((rec: string, i: number) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sem recomendações disponíveis.</p>
            )}
            <p className="mt-8 border-t pt-3 text-xs text-muted-foreground">
              Este relatório reflete a cultura percebida e esperada pelos respondentes, com base em cálculo
              estatístico automatizado (sem uso de IA). A leitura deve ser feita com o acompanhamento de um
              profissional com formação em DISC, para evitar interpretações equivocadas sobre a cultura da
              empresa.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
