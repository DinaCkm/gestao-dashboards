import { useRoute, useSearch, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { RelatorioAutoconhecimento } from "@/pages/TesteDiscOnboarding";

export default function RelatorioIndividualDISC() {
  const [, params] = useRoute("/disc360/relatorio-individual/:alunoId");
  const alunoId = params?.alunoId ? Number(params.alunoId) : null;

  const search = useSearch();
  const nomeAluno = new URLSearchParams(search).get("nome") || "";

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
        .report-page { padding: 24px; max-width: 900px; margin: 0 auto; }
      `}</style>

      <div className="no-print flex items-center justify-between gap-2 border-b p-4">
        <Link href="/disc360/aplicacoes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <Button onClick={() => window.print()} disabled={!discResultado}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir / Salvar PDF
        </Button>
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
        <div className="report-page space-y-4">
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
