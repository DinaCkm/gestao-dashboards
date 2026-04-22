import { useMemo, useState } from "react";
import AlunoLayout from "@/components/AlunoLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, Target, Clock, Calendar, TrendingUp, 
  AlertCircle, CheckCircle2, XCircle, Info, Sparkles, Route, ChevronDown, ChevronUp
} from "lucide-react";
import DualIndicators from "@/components/DualIndicators";

export default function Performance() {
  const { user } = useAuth();
  const { data, isLoading } = trpc.indicadores.meuDashboard.useQuery();
  const { data: performanceNivelAtual } = trpc.indicadores.performanceNivelAtual.useQuery();
  
  const {
    engajamentoVal,
    metasVal,
    aplicabilidadeVal,
    indicadoresAtingidos,
    aptoEvoluir,
    faltaEng,
    faltaMetas,
    faltaApl
  } = useMemo(() => {
    if (!data?.found) return { 
      engajamentoVal: 0, metasVal: 0, aplicabilidadeVal: 0, 
      indicadoresAtingidos: 0, aptoEvoluir: false,
      faltaEng: 80, faltaMetas: 80, faltaApl: 80
    };
    
    const v2 = (data as any).indicadoresV2?.consolidado;
    const eng = v2?.ind7_engajamentoFinal || 0;
    const met = (data as any).metas?.resumo?.percentual || 0;
    const apl = v2?.ind6_aplicabilidade || 0;
    
    const atingidos = [eng >= 80, met >= 80, apl >= 80].filter(Boolean).length;
    
    return {
      engajamentoVal: eng,
      metasVal: met,
      aplicabilidadeVal: apl,
      indicadoresAtingidos: atingidos,
      aptoEvoluir: atingidos === 3,
      faltaEng: Math.max(0, 80 - eng),
      faltaMetas: Math.max(0, 80 - met),
      faltaApl: Math.max(0, 80 - apl)
    };
  }, [data]);

  if (isLoading) {
    return (
      <AlunoLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A1E3E]" />
        </div>
      </AlunoLayout>
    );
  }

  const nivelVigente = performanceNivelAtual?.vigente;
  const statusOperacional = performanceNivelAtual?.snapshot?.statusOperacional || nivelVigente?.status || "Em andamento";

  return (
    <AlunoLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        
        {/* HEADER COMPACTO */}
        <div className="bg-[#0A1E3E] text-white rounded-xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Target size={120} />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-200 mb-1">
                <User size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">Aluno em Foco</span>
              </div>
              <h1 className="text-2xl font-bold">{user?.name}</h1>
              <p className="text-blue-200/80 text-sm">{user?.empresa || "Programa de Liderança"}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
              <div>
                <p className="text-[10px] text-blue-300 uppercase font-bold">Nível Atual</p>
                <p className="font-semibold">{nivelVigente?.nivel || "Nível I"}</p>
              </div>
              <div>
                <p className="text-[10px] text-blue-300 uppercase font-bold">Ciclo</p>
                <p className="font-semibold">Ciclo Vigente</p>
              </div>
              <div>
                <p className="text-[10px] text-blue-300 uppercase font-bold">Período</p>
                <p className="font-semibold text-sm">
                  {nivelVigente?.dataInicio ? (
                    <>
                      {new Date(nivelVigente.dataInicio).toLocaleDateString()} 
                      <span className="mx-1">até</span>
                      {nivelVigente?.dataFim ? new Date(nivelVigente.dataFim).toLocaleDateString() : 'Em aberto'}
                    </>
                  ) : (
                    <span className="text-blue-300/60 italic">Em definição</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-blue-300 uppercase font-bold">Status</p>
                <Badge className="bg-blue-500/20 text-blue-100 border-blue-400/30 hover:bg-blue-500/30">
                  {statusOperacional}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* REGRA DE AVANÇO */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Regra de Avanço:</strong> Para avançar de nível, você precisa atingir pelo menos <strong>80%</strong> em Engajamento, Metas/Desafios e Aplicabilidade dentro deste ciclo.
          </p>
        </div>

        {/* MACROINDICADORES (GRÁFICOS CIRCULARES NO LUGAR DOS CARDS) */}
        <Card className="bg-white shadow-sm border-gray-100">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Seu Desempenho no Ciclo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <DualIndicators 
              engajamento={engajamentoVal}
              desenvolvimento={metasVal}
              desenvolvimentoDetalhes={{
                total: (data as any).metas?.resumo?.total || 0,
                cumpridas: (data as any).metas?.resumo?.concluidas || 0
              }}
              aplicabilidade={{
                percentual: aplicabilidadeVal,
                totalAvaliacoes: (data as any).indicadoresV2?.consolidado?.detalhes?.tarefas?.total || 0,
                microTarefaPercentual: (data as any).indicadoresV2?.consolidado?.ind4_tarefas || 0,
                microCasePercentual: (data as any).indicadoresV2?.consolidado?.ind6_aplicabilidade || 0,
                caseAplicavel: true
              }}
              compact={false}
            />
            <div className="mt-6 pt-6 border-t border-gray-50 flex flex-wrap justify-center gap-8 text-[11px] text-gray-400 italic">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Engajamento: Webinars, Mentorias e Avaliações
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Metas: Conclusão de Desafios Pedagógicos
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                Aplicabilidade: Case de Sucesso e Prática
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RESUMO DE PRONTIDÃO E O QUE FALTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Route className="h-5 w-5 text-blue-600" />
                Prontidão para Evolução
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-700">Indicadores Atingidos</p>
                  <p className="text-2xl font-bold text-blue-600">{indicadoresAtingidos} de 3</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-bold ${aptoEvoluir ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {aptoEvoluir ? 'APTO A EVOLUIR' : 'EM DESENVOLVIMENTO'}
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900">O que falta para avançar:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    {faltaEng <= 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                    <span className={faltaEng <= 0 ? "text-gray-400 line-through" : "text-gray-700"}>
                      {faltaEng <= 0 ? "Engajamento atingido" : `Faltam ${Math.round(faltaEng)}% em Engajamento`}
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    {faltaMetas <= 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                    <span className={faltaMetas <= 0 ? "text-gray-400 line-through" : "text-gray-700"}>
                      {faltaMetas <= 0 ? "Metas/Desafios atingidos" : `Faltam ${Math.round(faltaMetas)}% em Metas/Desafios`}
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    {faltaApl <= 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                    <span className={faltaApl <= 0 ? "text-gray-400 line-through" : "text-gray-700"}>
                      {faltaApl <= 0 ? "Aplicabilidade atingida" : `Faltam ${Math.round(faltaApl)}% em Aplicabilidade`}
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-gray-100 border-dashed flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-blue-50 p-4 rounded-full mb-4">
              <Sparkles className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Continue sua Jornada!</h3>
            <p className="text-sm text-gray-500 max-w-[280px]">
              Mantenha o foco nos indicadores que faltam para garantir sua certificação e evolução para o próximo nível.
            </p>
          </Card>
        </div>
      </div>
    </AlunoLayout>
  );
}
