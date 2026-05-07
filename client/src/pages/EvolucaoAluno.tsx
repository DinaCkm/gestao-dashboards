import AlunoLayout from "@/components/AlunoLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Brain, Target, TrendingUp, Award, History,
  ChevronDown, ChevronUp, BookOpen, CheckCircle2
} from "lucide-react";
import { useState } from "react";

type DiscDimensao = "D" | "I" | "S" | "C";

const DISC_CORES: Record<DiscDimensao, string> = {
  D: "#DC2626", I: "#F59E0B", S: "#16A34A", C: "#2563EB",
};
const DISC_NOMES: Record<DiscDimensao, string> = {
  D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade",
};
const DISC_TITULOS: Record<DiscDimensao, string> = {
  D: "O Realizador", I: "O Influenciador", S: "O Estabilizador", C: "O Analítico",
};

function formatarData(data: string | null | undefined) {
  if (!data) return null;
  try {
    return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return null; }
}

function CicloCard({ ciclo, index }: { ciclo: any; index: number }) {
  const [expandido, setExpandido] = useState(index === 0);
  const perfilPredominante = ciclo.perfilPredominante as DiscDimensao | null;
  const perfilSecundario = ciclo.perfilSecundario as DiscDimensao | null;
  const corPredominante = perfilPredominante ? DISC_CORES[perfilPredominante] : "#6B7280";
  const dataInicio = formatarData(ciclo.dataInicio);
  const dataConclusao = formatarData(ciclo.dataConclusao);
  const discData = formatarData(ciclo.discCompletadoEm);
  const scores: Record<DiscDimensao, number> = {
    D: Number(ciclo.scoreD) || 0, I: Number(ciclo.scoreI) || 0,
    S: Number(ciclo.scoreS) || 0, C: Number(ciclo.scoreC) || 0,
  };

  return (
    <Card className="overflow-hidden border-2 transition-all duration-300 hover:shadow-lg"
      style={{ borderColor: expandido ? corPredominante + "40" : "transparent" }}>
      <div className="p-5 cursor-pointer select-none"
        style={{ background: `linear-gradient(135deg, ${corPredominante}15, ${corPredominante}08)` }}
        onClick={() => setExpandido(!expandido)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md"
              style={{ backgroundColor: corPredominante }}>{ciclo.numeroCiclo}</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#0A1E3E] text-lg">Ciclo {ciclo.numeroCiclo}</h3>
                <Badge className="text-white border-0 text-xs" style={{ backgroundColor: corPredominante }}>
                  {perfilPredominante ? `Perfil ${perfilPredominante}` : "Sem DISC"}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {dataInicio && dataConclusao ? `${dataInicio} → ${dataConclusao}` : dataInicio ? `Iniciado em ${dataInicio}` : "Datas não registradas"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {perfilPredominante && (
              <div className="hidden sm:flex items-center gap-1.5">
                {(["D", "I", "S", "C"] as DiscDimensao[]).map((dim) => (
                  <div key={dim} className="flex flex-col items-center">
                    <div className="w-1.5 rounded-full"
                      style={{ height: `${Math.max(8, (scores[dim] / 100) * 32)}px`, backgroundColor: DISC_CORES[dim], opacity: dim === perfilPredominante ? 1 : 0.4 }} />
                    <span className="text-[9px] font-bold mt-0.5" style={{ color: DISC_CORES[dim] }}>{dim}</span>
                  </div>
                ))}
              </div>
            )}
            {expandido ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
          </div>
        </div>
      </div>

      {expandido && (
        <CardContent className="p-6 space-y-6 border-t border-gray-100">
          {perfilPredominante ? (
            <div className="space-y-4">
              <h4 className="font-bold text-[#0A1E3E] flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                Perfil DISC
                {discData && <span className="text-xs font-normal text-gray-400 ml-1">— realizado em {discData}</span>}
              </h4>
              <div className="space-y-2.5">
                {(["D", "I", "S", "C"] as DiscDimensao[]).map((dim) => {
                  const score = scores[dim];
                  const isPredominante = dim === perfilPredominante;
                  const isSecundario = dim === perfilSecundario;
                  return (
                    <div key={dim} className={`p-3 rounded-lg ${isPredominante ? "bg-gray-50 ring-1 ring-gray-200" : ""}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
                            style={{ backgroundColor: DISC_CORES[dim] }}>{dim}</div>
                          <span className="font-medium text-gray-700 text-sm">{DISC_NOMES[dim]}</span>
                          {isPredominante && <Badge className="bg-[#F5991F] text-white border-0 text-[10px] px-1.5 py-0">PREDOMINANTE</Badge>}
                          {isSecundario && !isPredominante && <Badge variant="outline" className="text-[10px] px-1.5 py-0">SECUNDÁRIO</Badge>}
                        </div>
                        <span className="font-bold text-base" style={{ color: DISC_CORES[dim] }}>{score}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: DISC_CORES[dim] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-xl p-4 text-white" style={{ backgroundColor: corPredominante }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center font-black text-xl">{perfilPredominante}</div>
                  <div>
                    <p className="font-bold text-lg">{DISC_TITULOS[perfilPredominante]}</p>
                    <p className="text-white/80 text-sm">{DISC_NOMES[perfilPredominante]}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <Brain className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Teste DISC não realizado neste ciclo</p>
            </div>
          )}

          {ciclo.assessmentPdiId ? (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-bold text-[#0A1E3E] flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Plano de Desenvolvimento Individual (PDI)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {ciclo.macroInicio && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-500 font-medium mb-0.5">Início da Jornada</p>
                    <p className="font-semibold text-blue-900 text-sm">{formatarData(ciclo.macroInicio)}</p>
                  </div>
                )}
                {ciclo.macroTermino && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-500 font-medium mb-0.5">Término da Jornada</p>
                    <p className="font-semibold text-blue-900 text-sm">{formatarData(ciclo.macroTermino)}</p>
                  </div>
                )}
              </div>
              {ciclo.pdiStatus && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-gray-600">Status: <span className="font-medium capitalize text-emerald-700">{ciclo.pdiStatus}</span></span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400 border-t pt-4">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">PDI não registrado neste ciclo</p>
            </div>
          )}
          {/* Snapshot de Indicadores do Ciclo */}
          {ciclo.ind7EngajamentoFinal != null && (
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-bold text-[#0A1E3E] flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Indicadores do Ciclo
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Engajamento Final', value: ciclo.ind7EngajamentoFinal, cor: '#2563EB' },
                  { label: 'Webinars / Eventos', value: ciclo.ind1Webinars, cor: '#7C3AED' },
                  { label: 'Avaliações', value: ciclo.ind2Avaliacoes, cor: '#F59E0B' },
                  { label: 'Competências', value: ciclo.ind3Competencias, cor: '#16A34A' },
                  { label: 'Tarefas', value: ciclo.ind4Tarefas, cor: '#F97316' },
                  { label: 'Mentoria', value: ciclo.ind5Engajamento, cor: '#0EA5E9' },
                  { label: 'Aplicabilidade', value: ciclo.ind6Aplicabilidade, cor: '#DC2626' },
                ].map(({ label, value, cor }) => (
                  <div key={label} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-600">{label}</span>
                    <span className="text-xs font-bold" style={{ color: cor }}>{value ?? 0}%</span>
                  </div>
                ))}
                {ciclo.metasTotal > 0 && (
                  <div className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2 col-span-2">
                    <span className="text-xs text-amber-700">Metas cumpridas</span>
                    <span className="text-xs font-bold text-amber-700">{ciclo.metasCumpridas ?? 0} / {ciclo.metasTotal}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function EvolucaoAluno() {
  const { data: dashData } = trpc.indicadores.meuDashboard.useQuery();
  const alunoId = dashData?.found ? dashData.aluno?.id || 0 : 0;

  const { data: historico, isLoading } = trpc.onboarding.historicoCiclos.useQuery(
    { alunoId }, { enabled: alunoId > 0 }
  );
  const { data: discAtual } = trpc.disc.resultado.useQuery(
    { alunoId }, { enabled: alunoId > 0 }
  );

  const temHistorico = historico && historico.length > 0;

  return (
    <AlunoLayout>
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A1E3E] to-[#2a5a8a] flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0A1E3E]">Minha Evolução</h1>
            <p className="text-sm text-gray-500">Histórico de ciclos de desenvolvimento</p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5991F]" />
          </div>
        )}

        {!isLoading && !temHistorico && (
          <Card className="border-none shadow-xl bg-gradient-to-br from-[#0A1E3E] to-[#1a3a6e] text-white overflow-hidden">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center">
                <History className="h-8 w-8 text-white/70" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Seu histórico está sendo construído</h2>
                <p className="text-blue-100/80 text-sm leading-relaxed max-w-sm mx-auto">
                  Quando você concluir seu primeiro ciclo de desenvolvimento e um novo ciclo for iniciado,
                  o histórico aparecerá aqui com todos os seus resultados DISC e PDI.
                </p>
              </div>
              {discAtual && (
                <div className="mt-4 bg-white/10 rounded-xl p-4 text-left">
                  <p className="text-xs text-white/60 uppercase tracking-wider font-medium mb-2">Ciclo Atual (em andamento)</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black"
                      style={{ backgroundColor: DISC_CORES[discAtual.perfilPredominante as DiscDimensao] || "#6B7280" }}>
                      {discAtual.perfilPredominante}
                    </div>
                    <div>
                      <p className="font-semibold">Perfil {discAtual.perfilPredominante} — {DISC_TITULOS[discAtual.perfilPredominante as DiscDimensao] || ""}</p>
                      <p className="text-white/60 text-xs">{DISC_NOMES[discAtual.perfilPredominante as DiscDimensao] || ""}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!isLoading && temHistorico && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Award className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 text-sm">
                  {historico.length} ciclo{historico.length > 1 ? "s" : ""} de desenvolvimento registrado{historico.length > 1 ? "s" : ""}
                </p>
                <p className="text-amber-700 text-xs mt-0.5">
                  Cada ciclo representa uma jornada completa de onboarding com DISC e PDI.
                </p>
              </div>
            </div>

            {[...historico].reverse().map((ciclo: any, idx: number) => (
              <CicloCard key={ciclo.id} ciclo={ciclo} index={idx} />
            ))}

            {discAtual && (
              <div className="border-2 border-dashed border-[#F5991F]/40 rounded-xl p-5 bg-amber-50/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F5991F] flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-[#0A1E3E] text-sm">Ciclo Atual (em andamento)</p>
                    <p className="text-xs text-gray-500">Seu ciclo ativo de desenvolvimento</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-sm"
                    style={{ backgroundColor: DISC_CORES[discAtual.perfilPredominante as DiscDimensao] || "#6B7280" }}>
                    {discAtual.perfilPredominante}
                  </div>
                  <div>
                    <p className="font-semibold text-[#0A1E3E]">{DISC_TITULOS[discAtual.perfilPredominante as DiscDimensao] || `Perfil ${discAtual.perfilPredominante}`}</p>
                    <p className="text-xs text-gray-500">{DISC_NOMES[discAtual.perfilPredominante as DiscDimensao] || ""}</p>
                  </div>
                  <Badge className="ml-auto bg-[#F5991F] text-white border-0">Ativo</Badge>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AlunoLayout>
  );
}
