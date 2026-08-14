import { useState } from "react";
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
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, string> = {
  encerrado: "Congelado",
  ativo: "Em andamento",
};

function formatarData(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(String(d).length <= 10 ? `${d}T00:00:00` : d);
  if (Number.isNaN(date.getTime())) return "—";
  // timeZone: "UTC" evita deslocamento de um dia (ver mesmo comentário em
  // CertificadoPublico.tsx).
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function labelMacrociclo(m: any) {
  // Prioriza o rótulo já pronto vindo do backend ("Plano Congelado" /
  // "Plano Ativo") — pedido explícito de simplificação: em vez de tentar
  // achar 1 registro específico por nível (que quebra quando os dados de
  // origem têm PDIs duplicados ou desalinhados), agrupa tudo que já
  // encerrou (por data real) num bloco só, e o que está em andamento
  // noutro. As variantes abaixo continuam servindo de reserva pra quando
  // esse rótulo não vier (ex.: aluno sem nenhum reset ainda).
  if (m.label) return m.label;
  if (m.status === "ativo") return "Plano Ativo";
  if (m.origem === "encerrado-sem-arquivamento") {
    return m.nivelLabel ? `Nível ${m.nivelLabel} — Encerrado (aguardando arquivamento)` : "Encerrado (aguardando arquivamento)";
  }
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

  const criterios = desempenho?.certificacao?.criterios as Record<string, boolean> | undefined;

  const gerarRelatorioPdfMutation = trpc.meuDesempenho.gerarRelatorioPdf.useMutation();

  // PDF gerado no servidor (Chromium headless), renderizando a página dedicada
  // /aluno/relatorio-final/:chave — substitui a captura de tela no navegador,
  // que nunca produzia um layout confiável.
  const handleBaixarPdf = async () => {
    if (!chave) return;
    setGerandoPdf(true);
    try {
      const resultado = await gerarRelatorioPdfMutation.mutateAsync({ chave });
      const byteChars = atob(resultado.pdfBase64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const nomeArquivo = `relatorio-final-${desempenho?.macrociclo?.nivelLabel || desempenho?.macrociclo?.numeroCiclo || ""}.pdf`;
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivo;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setGerandoPdf(false);
    }
  };

  // Abre a página dedicada do relatório numa aba nova — já formatada pra
  // impressão, o próprio navegador cuida do "Imprimir" a partir dela.
  const handleImprimir = () => {
    if (!chave) return;
    window.open(`/aluno/relatorio-final/${encodeURIComponent(chave)}`, "_blank");
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
              <Button variant="outline" onClick={handleImprimir} disabled={!desempenho}>
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
          <div className="space-y-6 bg-white p-2">
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
                          <th className="py-2 pr-4">Performance de Aproveitamento</th>
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
                              {c.nota === null ? (
                                <span className="text-gray-400">—</span>
                              ) : c.aprovada ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Dentro da meta
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-600">
                                  <XCircle className="w-3.5 h-3.5" /> Abaixo da meta
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
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={handleBaixarPdf} disabled={gerandoPdf}>
                            {gerandoPdf ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
                            Baixar relatório
                          </Button>
                          {desempenho.certificacao.certificadoEmitido.arquivoUrl && (
                            <Button asChild size="sm" variant="outline">
                              <a href={desempenho.certificacao.certificadoEmitido.arquivoUrl} target="_blank" rel="noreferrer">
                                <Download className="w-4 h-4 mr-1" /> Baixar certificado
                              </a>
                            </Button>
                          )}
                        </div>
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
              </>
            )}
          </div>
        )}
      </div>
    </AlunoLayout>
  );
}
