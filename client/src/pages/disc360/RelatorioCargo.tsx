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
      const contentGap = 6;
      const contentAreaHeightMm = pageHeight - headerH - footerH - contentGap;

      const dataGeracao = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const paginasImg: { data: string; heightMm: number }[] = [];

      await document.fonts.ready;
      for (const secao of alvo) {
        // Calcula os pontos de quebra de página respeitando os limites dos elementos
        // (evita cortar texto ou ícones no meio da linha).
        const domPxPerMm = secao.offsetWidth / contentWidthMm;
        const alturaPaginaPx = contentAreaHeightMm * domPxPerMm;
        const secaoRect = secao.getBoundingClientRect();
        const elementos = Array.from(secao.querySelectorAll<HTMLElement>("*"))
          .filter((el) => el.tagName.toLowerCase() === "svg" || el.children.length === 0)
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { top: r.top - secaoRect.top, bottom: r.bottom - secaoRect.top };
          })
          .filter((r) => r.bottom > r.top);

        const totalAlturaPx = secao.scrollHeight;
        const limites = [0];
        let atual = 0;
        while (atual < totalAlturaPx) {
          let proximo = Math.min(atual + alturaPaginaPx, totalAlturaPx);
          if (proximo < totalAlturaPx) {
            let ajustado = proximo;
            for (const el of elementos) {
              if (el.top < proximo && proximo < el.bottom && el.top < ajustado) {
                ajustado = el.top;
              }
            }
            if (ajustado > atual + 1) {
              proximo = ajustado;
            }
          }
          limites.push(proximo);
          atual = proximo;
        }

        const canvas = await html2canvas(secao, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        const canvasScale = canvas.width / secao.offsetWidth;
        const pxPerMm = canvas.width / contentWidthMm;

        for (let i = 0; i < limites.length - 1; i++) {
          const sy = Math.round(limites[i] * canvasScale);
          const syEnd = Math.round(limites[i + 1] * canvasScale);
          const sh = Math.max(1, syEnd - sy);

          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = canvas.width;
          tempCanvas.height = sh;
          const ctx = tempCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, sh);
            ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);
          }
          paginasImg.push({ data: tempCanvas.toDataURL("image/jpeg", 0.92), heightMm: sh / pxPerMm });
        }
      }

      const totalPages = paginasImg.length;

      const desenharCabecalho = () => {
        pdf.setFillColor(15, 43, 60);
        pdf.rect(0, 0, pageWidth, headerH, "F");
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(marginX - 1, 4, 18, 18, 2, 2, "F");
        pdf.addImage(LOGO_ECO_AO_BEM_BASE64, "PNG", marginX, 5, 16, 16);
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(13);
        pdf.setFont("helvetica", "bold");
        pdf.text("Relatório de Perfil DISC do Cargo", pageWidth / 2 + 8, 12, { align: "center" });
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
        pdf.addImage(pagina.data, "JPEG", marginX, headerH + contentGap, contentWidthMm, pagina.heightMm);
        desenharRodape(i + 1);
      });

      pdf.save(`relatorio-cargo-${cargoProfileId}.pdf`);
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
        <Link href="/disc360/perfis-cargo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
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
        <div ref={conteudoRef}>
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
                  <p className="text-sm text-slate-700">
                    Régua de validação — D {r.respostaValidacao?.D} · I {r.respostaValidacao?.I} · S{" "}
                    {r.respostaValidacao?.S} · C {r.respostaValidacao?.C}
                  </p>
                  {(r.avaliacoesDivergencia ?? [])
                    .filter((av: any) => av.divergente)
                    .map((av: any) => (
                      <p key={av.dimensao} className="mt-2 text-sm font-medium text-amber-700">
                        {av.texto}
                      </p>
                    ))}
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
        </div>
      )}
    </div>
  );
}
