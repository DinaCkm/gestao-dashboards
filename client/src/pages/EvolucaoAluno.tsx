import AlunoLayout from "@/components/AlunoLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, Calendar, CheckCircle2, Clock3, LineChart, 
  Target, TrendingUp, User, ChevronRight, Award, Sparkles, Info, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Link } from "wouter";

function statusBadgeClass(status: string) {
  switch (status) {
    case "finalizado":
    case "encerrado":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "em_andamento":
      return "bg-blue-100 text-blue-700 border-blue-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

export default function EvolucaoAluno() {
  const { data, isLoading } = trpc.evolucao.minha.useQuery();
  const { data: statusCert } = trpc.certificacao.statusPorNivel.useQuery();
  const utils = trpc.useUtils();
  
  const [expandedCiclo, setExpandedCiclo] = useState<number | null>(null);

  const emitirCert = trpc.certificacao.emitir.useMutation({
    onSuccess: () => {
      toast.success("Certificado emitido com sucesso.");
      utils.evolucao.minha.invalidate();
      utils.certificacao.statusPorNivel.invalidate();
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

  if (!data) return null;

  const nivelAtual = data.resumo?.nivelAtual;

  return (
    <AlunoLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        
        {/* TOPO: DESTAQUE DO NÍVEL ATUAL */}
        <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-lg text-white">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Você está no</p>
              <h1 className="text-2xl font-bold text-gray-900">{nivelAtual?.nivel?.nome || "Nível Vigente"}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusBadgeClass(nivelAtual?.nivel?.statusFinal || "em_andamento")}>
                  {nivelAtual?.nivel?.statusFinal || "Em andamento"}
                </Badge>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">Iniciado em {nivelAtual?.nivel?.dataInicio ? new Date(nivelAtual.nivel.dataInicio).toLocaleDateString() : '--'}</span>
              </div>
            </div>
          </div>
          <Link href="/performance">
            <Button className="bg-[#0A1E3E] hover:bg-[#152b4d] text-white gap-2">
              Ver Performance do Nível Atual
              <ChevronRight size={16} />
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-blue-600" />
            Histórico de Formação
          </h2>

          <div className="space-y-6">
            {data.timeline.map((item: any, index: number) => {
              const isExpanded = expandedCiclo === item.nivel.id;
              
              // Usar os indicadores pedagógicos reais do snapshot do nível
              // Para o nível em andamento, tentamos buscar do resumo consolidado se o snapshot estiver zerado
              let eng = item.resultados?.competencias?.percentualAprovacao || 0; 
              let met = item.resultados?.metas?.percentualConclusao || 0;
              let apl = item.obtido?.mediaProgressoPerformance || 0;
              
              // Sincronização forçada para o nível atual (onde os dados de performance costumam estar no consolidado)
              if (item.nivel.emAndamento && data.resumo?.nivelAtual) {
                // Se o snapshot do nível atual estiver zerado mas tivermos dados no consolidado, usamos eles
                // Isso resolve o caso da Joseane onde a Performance mostra 85% mas a Evolução mostra 0%
                const { data: perfData } = trpc.indicadores.meuDashboard.useQuery();
                if (perfData?.found) {
                  const v2 = (perfData as any).indicadoresV2?.consolidado;
                  if (eng === 0) eng = v2?.ind7_engajamentoFinal || 0;
                  if (met === 0) met = (perfData as any).metas?.resumo?.percentual || 0;
                  if (apl === 0) apl = v2?.ind6_aplicabilidade || 0;
                }
              }
              
              const evoluiu = eng >= 80 && met >= 80 && apl >= 80;

              return (
                <Card key={item.nivel.id} className={`overflow-hidden border-l-4 ${item.nivel.emAndamento ? 'border-l-blue-500' : 'border-l-gray-300'}`}>
                  <CardHeader className="bg-gray-50/50 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">
                            {item.nivel.nome.length <= 3 ? `Liderança Nível ${item.nivel.nome}` : item.nivel.nome}
                          </h3>
                          {item.nivel.emAndamento && <Badge className="bg-blue-100 text-blue-700 border-blue-200">Ciclo Atual</Badge>}
                        </div>
                        <p className="text-xs text-gray-500">
                          Período: {item.nivel.dataInicio ? new Date(item.nivel.dataInicio).toLocaleDateString() : 'Em definição'} 
                          {item.nivel.dataFim ? ` - ${new Date(item.nivel.dataFim).toLocaleDateString()}` : (item.nivel.emAndamento ? ' - Presente' : '')}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Resultado</p>
                          <p className={`text-sm font-bold ${evoluiu ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {item.nivel.emAndamento ? 'Em progresso' : (evoluiu ? 'Evoluiu de Nível' : 'Não evoluiu')}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setExpandedCiclo(isExpanded ? null : item.nivel.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6 space-y-6">
                    {/* MACROINDICADORES DO CICLO */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 rounded-lg border border-gray-100 bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Engajamento</span>
                          <span className={`text-xs font-bold ${eng >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{Math.round(eng)}%</span>
                        </div>
                        <Progress value={eng} className="h-1.5" />
                      </div>
                      <div className="p-3 rounded-lg border border-gray-100 bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Metas / Desafios</span>
                          {item.resultados?.metas?.total > 0 || (item.nivel.emAndamento && met > 0) ? (
                            <span className={`text-xs font-bold ${met >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{Math.round(met)}%</span>
                          ) : (
                            <span className="text-[10px] font-medium text-gray-400">N/A</span>
                          )}
                        </div>
                        <Progress value={met} className="h-1.5" />
                      </div>
                      <div className="p-3 rounded-lg border border-gray-100 bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Aplicabilidade</span>
                          <span className={`text-xs font-bold ${apl >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{Math.round(apl)}%</span>
                        </div>
                        <Progress value={apl} className="h-1.5" />
                      </div>
                    </div>

                    {/* CONTEÚDO EXPANSÍVEL (MICRODETALHES) */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-gray-100 space-y-6 animate-in slide-in-from-top-2 duration-300">
                        
                        {/* DISC E ASSESSMENT */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                              <User className="h-4 w-4 text-purple-500" />
                              Perfil DISC no Ciclo
                            </h4>
                            {item.disc?.historico?.length > 0 ? (
                              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <p className="text-sm font-medium text-purple-900">
                                  Perfil Predominante: <span className="font-bold">{item.disc.historico[0].perfilPredominante}</span>
                                </p>
                                <div className="flex gap-4 mt-2">
                                  {Object.entries(item.disc.historico[0].scores).map(([key, val]: [string, any]) => (
                                    <div key={key} className="text-center">
                                      <div className="text-[10px] font-bold text-purple-400">{key}</div>
                                      <div className="text-xs font-bold text-purple-700">{val}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">Nenhum teste DISC realizado neste ciclo.</p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                              <Info className="h-4 w-4 text-blue-500" />
                              Diagnóstico de Entrada
                            </h4>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="text-xs text-blue-800">
                                <strong>Assessment:</strong> {item.assessmentInicial?.trilhaNome || 'Geral'}
                              </p>
                              <p className="text-[10px] text-blue-600 mt-1">
                                Utilizado como referência diagnóstica para o desenvolvimento das competências do ciclo.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* CERTIFICAÇÃO */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Award className="h-4 w-4 text-amber-500" />
                            Certificação Formal
                          </h4>
                          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100">
                            <div>
                              <p className="text-sm font-medium text-amber-900">Status do Certificado</p>
                              <p className="text-xs text-amber-700">
                                {item.certificadoEmitido ? 'Certificado disponível para download' : (evoluiu ? 'Elegível para emissão' : 'Critérios de evolução não atingidos')}
                              </p>
                            </div>
                            {item.certificadoEmitido ? (
                              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => window.open(item.certificadoEmitido.arquivoUrl, '_blank')}>
                                Download PDF
                              </Button>
                            ) : (
                              evoluiu && !item.nivel.emAndamento && (
                                <Button 
                                  size="sm" 
                                  className="bg-amber-600 hover:bg-amber-700 text-white"
                                  onClick={() => emitirCert.mutate({ contratoNivelId: item.nivel.id })}
                                  disabled={emitirCert.isPending}
                                >
                                  Emitir Certificado
                                </Button>
                              )
                            )}
                          </div>
                        </div>

                        {/* MICRODETALHES OPERACIONAIS */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-bold text-gray-700">Detalhamento Operacional</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-2 bg-gray-50 rounded border border-gray-100">
                              <p className="text-[10px] text-gray-400 uppercase">Mentorias</p>
                              <p className="text-sm font-bold">{item.obtido.mentoriasRealizadas}/{item.obtido.mentoriasTotal}</p>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded border border-gray-100">
                              <p className="text-[10px] text-gray-400 uppercase">Eventos</p>
                              <p className="text-sm font-bold">{item.obtido.eventosPresenca}/{item.obtido.eventosTotal}</p>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded border border-gray-100">
                              <p className="text-[10px] text-gray-400 uppercase">Cases</p>
                              <p className="text-sm font-bold">{item.obtido.casesEntregues}/{item.obtido.casesTotal}</p>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded border border-gray-100">
                              <p className="text-[10px] text-gray-400 uppercase">Metas</p>
                              <p className="text-sm font-bold">{item.obtido.metasConcluidas}/{item.proposto.metasPrevistas}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AlunoLayout>
  );
}
