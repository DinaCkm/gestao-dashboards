import { useRef, useState } from "react";
import { useRoute, useSearch, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import { LOGO_ECO_AO_BEM_BASE64 } from "@/lib/logoBase64";
import { RelatorioAutoconhecimento } from "@/pages/TesteDiscOnboarding";

// Carrega o html2canvas via CDN sob demanda (evita adicionar dependência nova ao build)
function carregarHtml2Canvas(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).html2canvas) {
      resolve((window as any).html2canvas);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    script.onload = () => resolve((window as any).html2canvas);
    script.onerror = () => reject(new Error("Não foi possível carregar o gerador de PDF."));
    document.body.appendChild(script);
  });
}

export default function RelatorioIndividualDISC() {
  const [, params] = useRoute("/disc360/relatorio-individual/:alunoId");
  const alunoId = params?.alunoId ? Number(params.alunoId) : null;

  const search = useSearch();
  const nomeAluno = new URLSearchParams(search).get("nome") || "";

  const conteudoRef = useRef<HTMLDivElement>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const { data: discResultado, isLoading } = trpc.disc.resultado.useQuery(
    { alunoId: alunoId ?? 0, contratoNivelId: null },
    { enabled: !!alunoId }
  );

  const discScores = discResultado
    ? {
        D: Number((discResultado as any).scoreD),
        I: Number((discResultado as any).scoreI),
        S: Number((discResultado as any).scoreS),
        C: Number((discResultado as any).scoreC),
      }
    : null;

  const handleBaixarPdf = async () => {
    if (!conteudoRef.current) return;
    setGerandoPdf(true);
    try {
      const html2canvas = await carregarHtml2Canvas();

      const canvas = await html2canvas(conteudoRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const marginX = 10;
      const headerH = 26;
      const footerH = 14;
      const contentWidthMm = pageWidth - marginX * 2;
      const contentAreaHeightMm = pageHeight - headerH - footerH;

      const pxPerMm = canvas.width / contentWidthMm;
      const sliceHeightPx = Math.max(1, Math.floor(contentAreaHeightMm * pxPerMm));
      const totalPages = Math.max(1, Math.ceil(canvas.height / sliceHeightPx));

      const dataGeracao = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const tituloEmpregado = nomeAluno || `Colaborador #${alunoId}`;

      const desenharCabecalho = () => {
        pdf.setFillColor(15, 43, 60);
        pdf.rect(0, 0, pageWidth, headerH, "F");
        pdf.addImage(LOGO_ECO_AO_BEM_BASE64, "PNG", marginX, 5, 16, 16);
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(13);
        pdf.setFont("helvetica", "bold");
        pdf.text("Relatório de Autoconhecimento DISC", pageWidth / 2 + 8, 12, { align: "center" });
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `${tituloEmpregado} · Ecossistema do Bem · Gerado em ${dataGeracao}`,
          pageWidth / 2 + 8,
          19,
          { align: "center" }
        );
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

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();

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
        const imgData = tempCanvas.toDataURL("image/png");
        const imgHeightMm = sh / pxPerMm;

        desenharCabecalho();
        pdf.addImage(imgData, "PNG", marginX, headerH, contentWidthMm, imgHeightMm);
        desenharRodape(i + 1);
      }

      const nomeArquivo = nomeAluno
        ? `relatorio-autoconhecimento-${nomeAluno.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`
        : `relatorio-autoconhecimento-${alunoId}.pdf`;
      pdf.save(nomeArquivo);
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
          .report-page { break-inside: avoid; }
          body { background: white; }
          @page { size: A4; margin: 10mm; }
        }
        .report-page { padding: 24px; max-width: 900px; margin: 0 auto; background: #ffffff; }
      `}</style>

      <div className="no-print flex items-center justify-between gap-2 border-b p-4">
        <Link href="/disc360/aplicacoes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()} disabled={!discResultado}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button onClick={handleBaixarPdf} disabled={!discResultado || gerandoPdf}>
            {gerandoPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {gerandoPdf ? "Gerando PDF..." : "Baixar PDF"}
          </Button>
        </div>
      </div>

      {!alunoId && (
        <p className="p-6 text-sm text-muted-foreground">Colaborador não identificado.</p>
      )}
      {alunoId && isLoading && (
        <p className="p-6 text-sm text-muted-foreground">Carregando relatório...</p>
      )}
      {alunoId && !isLoading && !discResultado && (
        <p className="p-6 text-sm text-muted-foreground">Este colaborador ainda não concluiu o teste DISC.</p>
      )}
      {alunoId && discResultado && (
        <div ref={conteudoRef} className="report-page space-y-4">
          {nomeAluno && (
            <h2 className="text-xl font-bold text-[#0A1E3E]">Relatório de Autoconhecimento — {nomeAluno}</h2>
          )}
          <RelatorioAutoconhecimento
            alunoId={alunoId}
            discScores={discScores as any}
            perfilPredominante={(discResultado as any).perfilPredominante}
            perfilSecundario={(discResultado as any).perfilSecundario}
            onComplete={() => {}}
            somenteLeitura
          />
        </div>
      )}
    </div>
  );
}
