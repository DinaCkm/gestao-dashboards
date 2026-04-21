import AlunoLayout from "@/components/AlunoLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDateSafe } from "@/lib/dateUtils";
import { BookOpen, Calendar, CheckCircle2, Clock3, LineChart, Target, TrendingUp, User } from "lucide-react";

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

export default function EvolucaoAluno() {
  const { data, isLoading } = trpc.evolucao.minha.useQuery();

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
          {data.timeline.map((item: any, index: number) => (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">Assessment inicial / PDI</p>
                    <p className="font-semibold text-sm">{item.assessmentInicial?.trilhaNome || "Sem trilha registrada"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Assessments: {item.pdi.totalAssessments}</p>
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">Competências (proposto vs obtido)</p>
                    <p className="font-semibold text-sm">{item.proposto.competenciasDefinidas} → {item.obtido.competenciasAprovadas}</p>
                    <Progress className="h-2 mt-2" value={item.resultados.competencias.percentualAprovacao} />
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">Metas (proposto vs obtido)</p>
                    <p className="font-semibold text-sm">{item.proposto.metasPrevistas} → {item.obtido.metasConcluidas}</p>
                    <Progress className="h-2 mt-2" value={item.resultados.metas.percentualConclusao} />
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">Resultados principais</p>
                    <p className="font-semibold text-sm">Performance: {item.resultados.performanceFinal}</p>
                    <p className="text-xs text-muted-foreground mt-1">Cases: {item.obtido.casesEntregues}/{item.obtido.casesTotal}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-md border p-3 bg-white">
                    <p className="font-semibold mb-1">Execução do nível</p>
                    <p>Mentorias: {item.obtido.mentoriasRealizadas} de {item.obtido.mentoriasTotal}</p>
                    <p>Eventos: {item.obtido.eventosPresenca} de {item.obtido.eventosTotal}</p>
                  </div>
                  <div className="rounded-md border p-3 bg-white">
                    <p className="font-semibold mb-1">DISC no nível</p>
                    <p>Ciclos DISC no nível: {item.disc.totalNoNivel}</p>
                    <p>Histórico DISC reutilizado: {item.disc.totalNoNivel > 0 ? "Sim" : "Sem registros"}</p>
                  </div>
                  <div className="rounded-md border p-3 bg-white">
                    <p className="font-semibold mb-1">Certificação futura</p>
                    <p className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" />{item.elegibilidadeCertificacaoFutura}</p>
                    <p className="text-muted-foreground mt-1">Sem emissão nesta fase.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AlunoLayout>
  );
}
