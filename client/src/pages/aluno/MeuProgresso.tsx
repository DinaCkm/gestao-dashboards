import { useRef, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/DualIndicators";
import {
  Award,
  Download,
  Printer,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  TrendingUp,
} from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";

// Carrega o html2canvas via CDN sob demanda (mesmo padrão usado em RelatorioIndividualDISC.tsx)
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

const STATUS_LABEL: Record<string, string> = {
  encerrado: "Congelado",
  ativo: "Em andamento",
};

function formatarData(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(String(d).length <= 10 ? `${d}T00:00:00` : d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

function labelMacrociclo(m: any) {
  if (m.status === "ativo") return "Progresso Atual";
  if (m.nivelLabel) return `Nível ${m.nivelLabel} — Congelado`;
  return `Macrociclo ${m.numeroCiclo} — Congelado`;
}

const criteriosLabels: Record<string, string> = {
  nivelEncerrado: "Nível encerrado",
  snapshotCongelado: "Dados do ciclo congelados (reset realizado)",
  dadosSegmentadosPorNivel: "Dados corretamente separados por nível",
  resultadoFinalFechado: "Resultado final do nível fechado",
  engajamentoMin80: "Engajamento final ≥ 80%",
  desafiosMin80: "Metas/desafios concluídos ≥ 80%",
  evidenciasMinimas: "Ao menos uma evidência/case entregue",
};

export default function MeuProgresso() {
  const conteudoRef = useRef<HTMLDivElement>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [macrocicloSelecionado, setMacrocicloSelecionado] = useState<string | null>(null);

  const { data: macrociclos, isLoading: carregandoMacrociclos } = trpc.meuDesempenho.listarMacrociclos.useQuery();

  const chave = macrocicloSelecionado ?? macrociclos?.[macrociclos.length - 1]?.chave ?? undefined;

  const { data: desempenho, isLoading: carregandoDesempenho, error: erroDesempenho, refetch: refetchDesempenho } =
    trpc.meuDesempenho.porMacrociclo.useQuery(
      { chave: chave as string },
      { enabled: !!chave, retry: false }
    );

  const cicloAtual = desempenho?.macrociclo?.status === "ativo";
  const cicloCongelado = desempenho?.macrociclo?.origem === "reset" && !cicloAtual && !!desempenho?.macrociclo?.historicoId;

  // Indicadores nunca são recalculados aqui — vêm sempre dos mesmos motores
  // já testados que /performance (ciclo atual) e /evolucao (ciclo congelado) usam.
  const { data: dashboardAtual, isLoading: carregandoAtual } = trpc.indicadores.meuDashboard.useQuery(undefined, {
    enabled: cicloAtual,
  });
  const { data: dashboardCongelado, isLoading: carregandoCongelado } = trpc.indicadores.meuDashboardCongelado.useQuery(
    { historicoId: desempenho?.macrociclo?.historicoId ?? undefined },
    { enabled: cicloCongelado }
  );

  const fonteIndicadores: any = cicloAtual ? dashboardAtual : dashboardCongelado;
  const consolidado = fonteIndicadores?.found !== false ? fonteIndicadores?.indicadoresV2?.consolidado : null;
  const carregandoIndicadores = cicloAtual ? carregandoAtual : carregandoCongelado;

  const utils = trpc.useUtils();

  const emitirMutation = trpc.certificacao.emitir.useMutation({
    onSuccess: () => {
      toast.success("Certificado emitido com sucesso!");
      refetchDesempenho();
      utils.meuDesempenho.listarMacrociclos.invalidate();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Não foi possível emitir o certificado.");
    },
  });

  const relatorioIAMutation = trpc.relatorioMentorado.gerar.useMutation({
    onError: (err: any) => {
      toast.error(err?.message || "Não foi possível gerar o relatório de IA.");
    },
  });

  const criterios = desempenho?.certificacao?.criterios as Record<string, boolean> | undefined;

  const handleBaixarPdf = async () => {
    if (!conteudoRef.current) return;
    setGerandoPdf(true);
    try {
      const html2canvas = await carregarHtml2Canvas();
      const container = conteudoRef.current;

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidthMm = pageWidth;
      const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

      let heightLeft = imgHeightMm;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidthMm, imgHeightMm);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeightMm;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidthMm, imgHeightMm);
        heightLeft -= pageHeight;
      }

      const nomeArquivo = `relatorio-desempenho-${desempenho?.macrociclo?.nivelLabel || desempenho?.macrociclo?.numeroCiclo || ""}.pdf`;
      pdf.save(nomeArquivo);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setGerandoPdf(false);
    }
  };

  const carregando = carregandoMacrociclos || carregandoDesempenho;

  return (
    <AlunoLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-emerald-600" />
              Meu Progresso e Certificados
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Certificado e relatório ficam disponíveis por macrociclo, assim que ele é encerrado.
            </p>
          </div>
          {cicloCongelado && (
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" onClick={() => window.print()} disabled={!desempenho}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="outline" onClick={handleBaixarPdf} disabled={gerandoPdf || !desempenho}>
                {gerandoPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Exportar PDF
              </Button>
            </div>
          )}
        </div>

        {/* Seletor de macrociclo */}
        {macrociclos && macrociclos.length > 0 && (
          <div className="flex flex-wrap gap-2 print:hidden">
            {macrociclos.map((m: any) => (
              <button
                key={m.chave}
                onClick={() => setMacrocicloSelecionado(m.chave)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  chave === m.chave
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
                }`}
              >
                {labelMacrociclo(m)}
                {m.certificadoEmitido && <CheckCircle2 className="inline w-3.5 h-3.5 ml-1 -mt-0.5" />}
              </button>
            ))}
          </div>
        )}

        {carregando && (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
          </div>
        )}

        {!carregando && !desempenho && (
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              {erroDesempenho
                ? `Não foi possível carregar este macrociclo: ${(erroDesempenho as any).message}`
                : "Nenhum macrociclo encontrado ainda."}
            </CardContent>
          </Card>
        )}

        {desempenho && (
          <div ref={conteudoRef} className="space-y-6 bg-white p-2">
            {/* Cabeçalho do macrociclo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{labelMacrociclo(desempenho.macrociclo)}</span>
                  <Badge variant="outline">{STATUS_LABEL[desempenho.macrociclo.status || ""] || desempenho.macrociclo.status}</Badge>
                </CardTitle>
                <CardDescription>
                  {formatarData(desempenho.macrociclo.periodo?.dataInicio)} até {formatarData(desempenho.macrociclo.periodo?.dataFim)} · {desempenho.aluno.nome}
                </CardDescription>
              </CardHeader>
            </Card>

            {cicloAtual && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg p-3 print:hidden">
                <TrendingUp className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Este é o seu ciclo em andamento — ainda pode mudar, então não gera certificado nem
                  relatório formal ainda. Pra acompanhar seu desempenho em detalhe, veja a aba{" "}
                  <Link href="/performance" className="underline font-medium">Performance</Link>.
                  Quando este ciclo for encerrado, ele vira um card fixo aqui, com certificado e relatório disponíveis.
                </span>
              </div>
            )}

            {/* Indicadores — mesmo motor de /performance (atual) ou /evolucao (congelado) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Indicadores</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap justify-around gap-6 py-4">
                {carregandoIndicadores ? (
                  <div className="flex items-center text-gray-400 text-sm py-6">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando indicadores...
                  </div>
                ) : !consolidado ? (
                  <p className="text-sm text-gray-400 py-6">Indicadores não disponíveis para este macrociclo ainda.</p>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-2">
                      <ProgressRing
                        value={consolidado.ind1_webinars ?? 0}
                        target={80}
                        color={(consolidado.ind1_webinars ?? 0) >= 80 ? "text-emerald-500" : "text-amber-500"}
                      />
                      <span className="text-sm text-gray-600 font-medium">Webinars</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <ProgressRing
                        value={consolidado.ind4_tarefas ?? 0}
                        target={80}
                        color={(consolidado.ind4_tarefas ?? 0) >= 80 ? "text-emerald-500" : "text-amber-500"}
                      />
                      <span className="text-sm text-gray-600 font-medium">Tarefas</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <ProgressRing
                        value={consolidado.ind3_competencias ?? 0}
                        target={100}
                        color="text-blue-500"
                      />
                      <span className="text-sm text-gray-600 font-medium">Competências</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <ProgressRing
                        value={consolidado.ind7_engajamentoFinal ?? 0}
                        target={80}
                        color={(consolidado.ind7_engajamentoFinal ?? 0) >= 80 ? "text-emerald-500" : "text-amber-500"}
                      />
                      <span className="text-sm text-gray-600 font-medium">Engajamento Final</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Relatório de avaliação — tabela de competências */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Relatório de avaliação</CardTitle>
                <CardDescription>Competências cursadas neste macrociclo, nota obtida e meta.</CardDescription>
              </CardHeader>
              <CardContent>
                {desempenho.avaliacaoCompetencias.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhuma competência atribuída neste macrociclo ainda.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="py-2 pr-4">Competência</th>
                          <th className="py-2 pr-4">Obrigatória</th>
                          <th className="py-2 pr-4">Nota</th>
                          <th className="py-2 pr-4">Meta</th>
                          <th className="py-2 pr-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {desempenho.avaliacaoCompetencias.map((c: any) => (
                          <tr key={c.competenciaId} className="border-b last:border-0">
                            <td className="py-2 pr-4">{c.competenciaNome || "—"}</td>
                            <td className="py-2 pr-4">{c.obrigatoria ? "Sim" : "Opcional"}</td>
                            <td className="py-2 pr-4">{c.nota !== null ? c.nota.toFixed(1) : "—"}</td>
                            <td className="py-2 pr-4">{c.meta.toFixed(1)}</td>
                            <td className="py-2 pr-4">
                              {c.aprovada ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Aprovada
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-gray-500">
                                  <XCircle className="w-3.5 h-3.5" /> Pendente
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certificação e relatório de IA só existem pra ciclos já congelados */}
            {cicloAtual ? (
              <Card className="border-dashed">
                <CardContent className="py-6 text-center text-sm text-gray-400">
                  Certificado e síntese de IA ficam disponíveis quando este ciclo for encerrado.
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="w-4 h-4" /> Certificado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {desempenho.certificacao.certificadoEmitido ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                        <div>
                          <p className="font-medium text-emerald-800">Certificado emitido</p>
                          <p className="text-xs text-emerald-700">
                            Em {formatarData(desempenho.certificacao.certificadoEmitido.emitidoEm)} · código{" "}
                            {desempenho.certificacao.certificadoEmitido.hashDocumento}
                          </p>
                        </div>
                        {desempenho.certificacao.certificadoEmitido.arquivoUrl && (
                          <Button asChild size="sm" variant="outline">
                            <a href={desempenho.certificacao.certificadoEmitido.arquivoUrl} target="_blank" rel="noreferrer">
                              <Download className="w-4 h-4 mr-1" /> Baixar
                            </a>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <>
                        <ul className="space-y-1.5">
                          {criterios &&
                            Object.entries(criterios).map(([chaveCriterio, atendido]) => (
                              <li key={chaveCriterio} className="flex items-center gap-2 text-sm">
                                {atendido ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-gray-300 shrink-0" />
                                )}
                                <span className={atendido ? "text-gray-700" : "text-gray-400"}>
                                  {criteriosLabels[chaveCriterio] || chaveCriterio}
                                </span>
                              </li>
                            ))}
                        </ul>
                        <Button
                          onClick={() => {
                            const cnId = (desempenho.certificacao as any).contratoNivelId ?? desempenho.macrociclo.contratoNivelId;
                            if (cnId) emitirMutation.mutate({ contratoNivelId: cnId });
                          }}
                          disabled={!desempenho.certificacao.elegivel || emitirMutation.isPending}
                        >
                          {emitirMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Award className="w-4 h-4 mr-2" />
                          )}
                          Emitir certificado
                        </Button>
                        {!desempenho.certificacao.elegivel && desempenho.certificacao.motivo && (
                          <p className="text-xs text-gray-500">{desempenho.certificacao.motivo}</p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" /> Síntese de acompanhamento (gerada por IA)
                    </CardTitle>
                    <CardDescription>
                      Resumo qualitativo elaborado a partir dos dados registrados neste macrociclo — não é um critério de certificação.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {relatorioIAMutation.data ? (
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
                        {relatorioIAMutation.data.relatorioTexto}
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() =>
                            desempenho.aluno.id &&
                            relatorioIAMutation.mutate({
                              alunoId: desempenho.aluno.id,
                              contratoNivelId: desempenho.macrociclo.contratoNivelId ?? undefined,
                            })
                          }
                          disabled={relatorioIAMutation.isPending}
                        >
                          {relatorioIAMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4 mr-2" />
                          )}
                          Gerar síntese com IA
                        </Button>
                        {relatorioIAMutation.isError && (
                          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            {(relatorioIAMutation.error as any)?.message || "Não foi possível gerar o relatório."}
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </AlunoLayout>
  );
}
