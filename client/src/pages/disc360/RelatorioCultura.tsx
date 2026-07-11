import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRef, useState } from "react";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import { LOGO_ECO_AO_BEM_BASE64 } from "@/lib/logoBase64";

// Carrega o html2canvas-pro via CDN sob demanda (fork com suporte a oklch/cores modernas do Tailwind)
function carregarHtml2Canvas(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).html2canvas) {
      resolve((window as any).html2canvas);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/html2canvas-pro@2.0.4/dist/html2canvas-pro.min.js";
    script.onload = () => resolve((window as any).html2canvas);
    script.onerror = () => reject(new Error("Não foi possível carregar o gerador de PDF."));
    document.body.appendChild(script);
  });
}
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
  const conteudoRef = useRef<HTMLDivElement>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const handleBaixarPdf = async () => {
    if (!conteudoRef.current) return;
    setGerandoPdf(true);
    try {
      const html2canvas = await carregarHtml2Canvas();
      const secoes = Array.from(conteudoRef.current.querySelectorAll<HTMLElement>(".report-page"));
      const alvo = secoes.length > 0 ? secoes : [conteudoRef.current];

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const marginX = 10;
      const headerH = 26;
      const footerH = 14;
      const contentWidthMm = pageWidth - marginX * 2;
      const contentAreaHeightMm = pageHeight - headerH - footerH;

      const dataGeracao = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      let totalPages = 0;
      const paginasImg: { data: string; heightMm: number }[] = [];

      for (const secao of alvo) {
        const canvas = await html2canvas(secao, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        const pxPerMm = canvas.width / contentWidthMm;
        const sliceHeightPx = Math.max(1, Math.floor(contentAreaHeightMm * pxPerMm));
        const paginasDaSecao = Math.max(1, Math.ceil(canvas.height / sliceHeightPx));

        for (let i = 0; i < paginasDaSecao; i++) {
          const sy = i * sliceHeightPx;
          const sh = Math.min(sliceHeightPx, canvas.height - sy);
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = canvas.width;
          tempCanvas.height = sh;
          const ctx = tempCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, sh);
            ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);
          }
          paginasImg.push({ data: tempCanvas.toDataURL("image/png"), heightMm: sh / pxPerMm });
          totalPages++;
        }
      }

      const desenharCabecalho = () => {
        pdf.setFillColor(15, 43, 60);
        pdf.rect(0, 0, pageWidth, headerH, "F");
        pdf.addImage(LOGO_ECO_AO_BEM_BASE64, "PNG", marginX, 5, 16, 16);
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(13);
        pdf.setFont("helvetica", "bold");
        pdf.text("Relatório de Cultura Comportamental (DISC)", pageWidth / 2 + 8, 12, { align: "center" });
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Ecossistema do Bem · Gerado em ${dataGeracao}`, pageWidth / 2 + 8, 19, { align: "center" });
      };

      const desenharRodape = (paginaAtual: number) => {
        pdf.setDrawColor(220, 220, 220);
        pdf.line(marginX, pageHeight - footerH, pageWidth - marginX, pageHeight - footerH);
        pdf.setFontSize(7.5);
        pdf.setTextColor(140, 140, 140);
        pdf.setFont("helvetica", "italic");
        pdf.text(
          "Documento exclusivo e confidencial — Ecossistema do Bem. Proibida a reprodução ou redistribuição sem autorização.",
          marginX,
          pageHeight - 6
        );
        pdf.setFont("helvetica", "normal");
        pdf.text(`Página ${paginaAtual} de ${totalPages}`, pageWidth - marginX, pageHeight - 6, {
          align: "right",
        });
      };

      paginasImg.forEach((pagina, i) => {
        if (i > 0) pdf.addPage();
        desenharCabecalho();
        pdf.addImage(pagina.data, "PNG", marginX, headerH, contentWidthMm, pagina.heightMm);
        desenharRodape(i + 1);
      });

      pdf.save(`relatorio-cultura-${orgProfileId}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Não foi possível gerar o PDF. Tente novamente ou use a opção Imprimir.");
    } finally {
      setGerandoPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          .no-print { display: none !important; }
          .report-page { page-break-after: always; padding-top: 0 !important; break-inside: avoid; }
          .report-page:last-child { page-break-after: auto; }
          body { background: white; }
          @page { size: A4; margin: 10mm; }
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()} disabled={!data}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button onClick={handleBaixarPdf} disabled={!data || gerandoPdf}>
            {gerandoPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {gerandoPdf ? "Gerando PDF..." : "Baixar PDF"}
          </Button>
        </div>
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
        <div ref={conteudoRef}>
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
        </div>
      )}
    </div>
  );
}
