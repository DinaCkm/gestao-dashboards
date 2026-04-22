import AlunoLayout from "@/components/AlunoLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatDateSafe } from "@/lib/dateUtils";
import { ArrowRight, BookOpen, Calendar, CheckCircle2, Clock3, LineChart, Target, TrendingUp, User } from "lucide-react";
import { toast } from "sonner";

function statusBadgeClass(status: string) {
  switch (status) {
    case "encerrado":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "ajustes":
      return "bg-amber-100 text-amber-700 border-amber-300";
    case "fechamento":
      return "bg-orange-100 text-orange-700 border-orange-300";
    case "em_andamento":
      return "bg-blue-100 text-blue-700 border-blue-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Number(value.toFixed(1))));
}

function macroStatusClass(percentual: number) {
  return percentual >= 80 ? "text-emerald-700" : "text-red-700";
}

export default function EvolucaoAluno() {
  const { data, isLoading } = trpc.evolucao.minha.useQuery();
  const { data: statusCert } = trpc.certificacao.statusPorNivel.useQuery();
  const utils = trpc.useUtils();
  const emitirCert = trpc.certificacao.emitir.useMutation({
    onSuccess: () => {
      toast.success("Certificado emitido com sucesso.");
      utils.evolucao.minha.invalidate();
      utils.certificacao.statusPorNivel.invalidate();
      utils.certificacao.minhas.invalidate();
    },
    onError: (err) => toast.error(err.message || "Falha ao emitir certificado."),
  });

  if (isLoading) {
    return (
      <AlunoLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0A1E3E]" />
        </div>
      </AlunoLayout>
    );
  }

  if (!data) {
    return (
      <AlunoLayout>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Não foi possível carregar a evolução do aluno.</CardContent>
        </Card>
      </AlunoLayout>
    );
  }

  return (
    <AlunoLayout>
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-[#0A1E3E] to-[#132d54] border-0 text-white shadow-lg">
          <CardContent className="p-6 space-y-3">
            <div>
              <h1 className="text-2xl font-bold">Evolução do Aluno</h1>
              <p className="text-sm text-white/80">
                Memória histórica dos níveis: o que foi proposto e o que foi obtido em cada etapa da jornada.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white border-white/30"><User className="h-3 w-3 mr-1" />{data.aluno.nome}</Badge>
              <Badge className="bg-white/20 text-white border-white/30"><BookOpen className="h-3 w-3 mr-1" />{data.aluno.programa}</Badge>
              <Badge className="bg-white/20 text-white border-white/30"><Target className="h-3 w-3 mr-1" />Níveis totais: {data.resumo.totalNiveis}</Badge>
              <Badge className="bg-white/20 text-white border-white/30"><CheckCircle2 className="h-3 w-3 mr-1" />Concluídos: {data.resumo.niveisConcluidos}</Badge>
            </div>
            <div className="rounded-lg border border-white/20 bg-white/10 p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs space-y-1">
                <p className="font-semibold text-white">Nível atual: {data.resumo.nivelAtual?.nivel?.nome || "Nenhum em andamento"}</p>
                <p className="text-white/80">
                  Status: {data.resumo.nivelAtual?.nivel?.statusFinal || "—"} •
                  {" "}Período: {data.resumo.nivelAtual?.nivel ? `${formatDateSafe(data.resumo.nivelAtual.nivel.dataInicio)} — ${formatDateSafe(data.resumo.nivelAtual.nivel.dataFim)}` : "—"}
                </p>
              </div>
              <Button asChild size="sm" variant="secondary" className="bg-white text-[#0A1E3E] hover:bg-white/90">
                <a href="/performance">
                  Ver Performance do Nível Atual <ArrowRight className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {data.discComparativo && (
          <Card className="border border-indigo-200 bg-indigo-50/40">
            <CardHeader>
              <CardTitle className="text-indigo-900 flex items-center gap-2"><LineChart className="h-5 w-5" />Comparativo DISC (histórico reaproveitado)</CardTitle>
              <CardDescription>
                Evolução do perfil DISC do ciclo inicial ({data.discComparativo.cicloInicial.ciclo}) para o ciclo atual ({data.discComparativo.cicloAtual.ciclo}).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(data.discComparativo.evolucao).map(([chave, valor]) => (
                <div key={chave} className="rounded-lg border bg-white p-3">
                  <p className="text-xs text-muted-foreground">DISC {chave}</p>
                  <p className={`text-lg font-bold ${Number(valor) >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {Number(valor) >= 0 ? "+" : ""}{Number(valor).toFixed(1)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {data.timeline.map((item: any, index: number) => {
            const certStatus = statusCert?.find((s: any) => s.contratoNivelId === item.nivel.id);
            const podeEmitir = !!certStatus?.elegivel && !certStatus?.certificadoEmitido;
            const engajamentoFinal = item.obtido.eventosTotal > 0
              ? clampPercent((item.obtido.eventosPresenca / item.obtido.eventosTotal) * 100)
              : 0;
            const desafiosFinal = clampPercent(item.resultados?.metas?.percentualConclusao ?? 0);
            const aplicabilidadeFinal = clampPercent((Number(item.obtido?.mediaNotaPerformance ?? 0) / 10) * 100);
            const evoluiuDeNivel = engajamentoFinal >= 80 && desafiosFinal >= 80 && aplicabilidadeFinal >= 80;
            const discAtual = item.disc?.historico?.[item.disc.historico.length - 1] || null;
            const discAnteriorNivel = index > 0 ? data.timeline[index - 1]?.disc?.historico?.[data.timeline[index - 1]?.disc?.historico?.length - 1] : null;
            return (
            <Card key={item.nivel.id} className="border border-slate-200">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                      {index + 1}
                    </span>
                    {item.nivel.nome}
                  </CardTitle>
                  <Badge className={statusBadgeClass(item.nivel.statusFinal)}>{item.nivel.statusFinal}</Badge>
                </div>
                <CardDescription className="flex flex-wrap gap-3 text-xs">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDateSafe(item.nivel.dataInicio)} — {formatDateSafe(item.nivel.dataFim)}</span>
                  <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />Mentora: {item.mentora?.nome || "Não definida"}</span>
                  <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{item.nivel.emAndamento ? "Nível em andamento" : "Nível encerrado (histórico fechado)"}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">Engajamento final do ciclo</p>
                    <p className={`font-bold text-lg ${macroStatusClass(engajamentoFinal)}`}>{engajamentoFinal}%</p>
                    <Progress className="h-2 mt-2" value={engajamentoFinal} />
                    <p className="text-xs mt-1">Meta mínima: 80% • {engajamentoFinal >= 80 ? "Atingido" : "Não atingido"}</p>
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">Metas / desafios final do ciclo</p>
                    <p className={`font-bold text-lg ${macroStatusClass(desafiosFinal)}`}>{desafiosFinal}%</p>
                    <Progress className="h-2 mt-2" value={desafiosFinal} />
                    <p className="text-xs mt-1">Meta mínima: 80% • {desafiosFinal >= 80 ? "Atingido" : "Não atingido"}</p>
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">Aplicabilidade final do ciclo</p>
                    <p className={`font-bold text-lg ${macroStatusClass(aplicabilidadeFinal)}`}>{aplicabilidadeFinal}%</p>
                    <Progress className="h-2 mt-2" value={aplicabilidadeFinal} />
                    <p className="text-xs mt-1">Meta mínima: 80% • {aplicabilidadeFinal >= 80 ? "Atingido" : "Não atingido"}</p>
                  </div>
                </div>

                <div className={`rounded-lg border p-3 ${evoluiuDeNivel ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                  <p className={`font-semibold ${evoluiuDeNivel ? "text-emerald-800" : "text-rose-800"}`}>
                    {evoluiuDeNivel ? "Evoluiu de nível" : "Não evoluiu de nível"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Conclusão baseada nos 3 macroindicadores do ciclo (Engajamento, Metas/Desafios e Aplicabilidade).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-md border p-3 bg-white">
                    <p className="font-semibold mb-1">DISC do ciclo</p>
                    {discAtual ? (
                      <>
                        <p>Perfil predominante: <strong>{discAtual.perfilPredominante || "—"}</strong></p>
                        <p className="mt-1">D {Number(discAtual.scores?.D ?? 0).toFixed(1)} • I {Number(discAtual.scores?.I ?? 0).toFixed(1)} • S {Number(discAtual.scores?.S ?? 0).toFixed(1)} • C {Number(discAtual.scores?.C ?? 0).toFixed(1)}</p>
                        {discAnteriorNivel && (
                          <p className="text-muted-foreground mt-1">
                            Vs ciclo anterior: D {(Number(discAtual.scores?.D ?? 0) - Number(discAnteriorNivel.scores?.D ?? 0)).toFixed(1)} •
                            {" "}I {(Number(discAtual.scores?.I ?? 0) - Number(discAnteriorNivel.scores?.I ?? 0)).toFixed(1)} •
                            {" "}S {(Number(discAtual.scores?.S ?? 0) - Number(discAnteriorNivel.scores?.S ?? 0)).toFixed(1)} •
                            {" "}C {(Number(discAtual.scores?.C ?? 0) - Number(discAnteriorNivel.scores?.C ?? 0)).toFixed(1)}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">Sem registro DISC neste ciclo.</p>
                    )}
                  </div>
                  <div className="rounded-md border p-3 bg-white">
                    <p className="font-semibold mb-1">Assessment (diagnóstico do ciclo)</p>
                    <p>Trilha de entrada: {item.assessmentInicial?.trilhaNome || "Não registrada"}</p>
                    <p>Assessments no ciclo: {item.pdi.totalAssessments}</p>
                    <p className="text-muted-foreground mt-1">Uso diagnóstico, sem protagonismo na régua de evolução.</p>
                  </div>
                </div>

                <details className="rounded-md border bg-white p-3 text-xs">
                  <summary className="font-semibold cursor-pointer">Ver detalhes do ciclo</summary>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground">
                    <p>Mentorias: {item.obtido.mentoriasRealizadas} de {item.obtido.mentoriasTotal}</p>
                    <p>Eventos: {item.obtido.eventosPresenca} de {item.obtido.eventosTotal}</p>
                    <p>Cases: {item.obtido.casesEntregues} de {item.obtido.casesTotal}</p>
                    <p>Competências aprovadas: {item.obtido.competenciasAprovadas} de {item.proposto.competenciasDefinidas}</p>
                  </div>
                </details>

                <div className="flex items-center justify-between gap-3 rounded-lg border bg-slate-50 p-3">
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800">Certificação formal do nível</p>
                    <p className="text-slate-600">
                      Emissão disponível somente para nível encerrado e elegível, com critérios mínimos validados no backend.
                    </p>
                    <p className="inline-flex items-center gap-1 mt-1 text-slate-600"><TrendingUp className="h-3 w-3" />{item.elegibilidadeCertificacaoFutura}</p>
                    {certStatus?.certificadoEmitido ? (
                      <p className="text-emerald-700 mt-1">Certificado emitido em {formatDateSafe(certStatus?.certificado?.emitidoEm)}</p>
                    ) : (
                      <p className="text-muted-foreground mt-1">{certStatus?.motivo || "Certificação ainda não disponível."}</p>
                    )}
                  </div>
                  {certStatus?.certificadoEmitido ? (
                    <Button variant="outline" disabled>Certificado já emitido</Button>
                  ) : podeEmitir ? (
                    <Button
                      disabled={emitirCert.isPending}
                      onClick={() => emitirCert.mutate({ contratoNivelId: item.nivel.id })}
                    >
                      Emitir Certificação
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-500">Emissão indisponível para este nível.</span>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      </div>
    </AlunoLayout>
  );
}
