import AlunoLayout from "@/components/AlunoLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, BookOpen, Target, Calendar, TrendingUp, Award,
  CheckCircle2, Circle, Zap, BarChart2, Star, ClipboardList
} from "lucide-react";
import { useLocation, useParams } from "wouter";

function formatarData(data: string | null | undefined) {
  if (!data) return "—";
  try {
    return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return "—"; }
}

function IndicadorCard({
  label, valor, meta = 80, cor = "blue", icon: Icon
}: {
  label: string;
  valor: number | null | undefined;
  meta?: number;
  cor?: "blue" | "green" | "orange" | "purple" | "pink";
  icon: React.ElementType;
}) {
  const v = Number(valor ?? 0);
  const atingiu = v >= meta;
  const cores = {
    blue: { bg: atingiu ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200", text: atingiu ? "text-blue-600" : "text-red-600", badge: atingiu ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700" },
    green: { bg: atingiu ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200", text: atingiu ? "text-green-600" : "text-red-600", badge: atingiu ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700" },
    orange: { bg: atingiu ? "bg-orange-50 border-orange-200" : "bg-red-50 border-red-200", text: atingiu ? "text-orange-500" : "text-red-600", badge: atingiu ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700" },
    purple: { bg: atingiu ? "bg-purple-50 border-purple-200" : "bg-red-50 border-red-200", text: atingiu ? "text-purple-600" : "text-red-600", badge: atingiu ? "bg-purple-100 text-purple-700" : "bg-red-100 text-red-700" },
    pink: { bg: atingiu ? "bg-pink-50 border-pink-200" : "bg-red-50 border-red-200", text: atingiu ? "text-pink-600" : "text-red-600", badge: atingiu ? "bg-pink-100 text-pink-700" : "bg-red-100 text-red-700" },
  };
  const c = cores[cor];
  return (
    <div className={`rounded-xl p-4 border-2 ${c.bg} flex flex-col gap-1`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs font-semibold text-gray-600">{label}</span>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.badge}`}>
          {atingiu ? "✓" : "✗"} {meta}%
        </span>
      </div>
      <div className={`text-2xl font-black ${c.text}`}>{v}%</div>
      <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(v, 100)}%`, backgroundColor: "currentColor" }} />
      </div>
    </div>
  );
}

export default function VisualizarPDI() {
  const [, navigate] = useLocation();
  const params = useParams<{ pdiId: string }>();
  const pdiId = parseInt(params.pdiId || "0");

  // Ler o ciclo congelado do sessionStorage
  const cicloRaw = typeof window !== "undefined"
    ? sessionStorage.getItem(`ciclo_snapshot_${pdiId}`)
    : null;
  const ciclo = cicloRaw ? JSON.parse(cicloRaw) : null;

  // Buscar as competências/trilhas do PDI via API
  const { data: pdi, isLoading } = trpc.assessment.porId.useQuery(
    { pdiId },
    { enabled: pdiId > 0 }
  );

  if (isLoading) {
    return (
      <AlunoLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center text-gray-400">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30 animate-pulse" />
            <p>Carregando PDI...</p>
          </div>
        </div>
      </AlunoLayout>
    );
  }

  if (!pdi && !ciclo) {
    return (
      <AlunoLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center text-gray-400">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">PDI não encontrado</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/evolucao")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Evolução
            </Button>
          </div>
        </div>
      </AlunoLayout>
    );
  }

  // Indicadores congelados — vêm do sessionStorage (ciclo)
  const ind1 = Number(ciclo?.snapshotInd1 ?? ciclo?.ind1Webinars ?? 0);
  const ind2 = Number(ciclo?.snapshotInd2 ?? ciclo?.ind2Avaliacoes ?? 0);
  const ind3 = Number(ciclo?.snapshotInd3 ?? ciclo?.ind3Competencias ?? 0);
  const ind4 = Number(ciclo?.snapshotInd4 ?? ciclo?.ind4Tarefas ?? 0);
  const ind5 = Number(ciclo?.snapshotInd5 ?? ciclo?.ind5Engajamento ?? 0);
  const ind6 = Number(ciclo?.snapshotAplicabilidade ?? ciclo?.ind6Aplicabilidade ?? 0);
  const ind7 = Number(ciclo?.ind7EngajamentoFinal ?? 0);
  const engajamento = Number(ciclo?.snapshotEngajamento ?? 0);
  const metasPct = Number(ciclo?.snapshotMetasPercentual ?? 0);
  const aplicabilidade = Number(ciclo?.snapshotAplicabilidade ?? 0);
  const metasTotal = Number(ciclo?.snapshotMetasTotal ?? ciclo?.metasTotal ?? 0);
  const metasCumpridas = Number(ciclo?.snapshotMetasCumpridas ?? ciclo?.metasCumpridas ?? 0);
  const semMetas = metasTotal === 0;

  // Dados do PDI (competências) — vêm da API
  const obrigatorias = pdi?.competencias.filter(c => c.peso === "obrigatoria") ?? [];
  const opcionais = pdi?.competencias.filter(c => c.peso === "opcional") ?? [];

  // Período do ciclo
  const macroInicio = pdi?.macroInicio || ciclo?.macroInicio;
  const macroTermino = pdi?.macroTermino || ciclo?.macroTermino;
  const numeroCiclo = ciclo?.numeroCiclo;
  const trilhaNome = pdi?.trilhaNome || "—";
  const turmaNome = pdi?.turmaNome;
  const pdiStatus = pdi?.status || ciclo?.pdiStatus;

  return (
    <AlunoLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 pb-12">

        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/evolucao")}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#0A1E3E]">
              PDI {numeroCiclo ? `do Ciclo ${numeroCiclo}` : "Anterior"}
            </h1>
            <p className="text-sm text-gray-500">Visualização somente leitura — valores congelados no encerramento</p>
          </div>
          {pdiStatus && (
            <Badge variant="outline" className="capitalize text-gray-600 border-gray-300 shrink-0">
              {pdiStatus}
            </Badge>
          )}
        </div>

        {/* Período e Trilha */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Plano de Desenvolvimento Individual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-500 font-medium mb-0.5">Trilha</p>
                <p className="font-semibold text-blue-900 text-sm">{trilhaNome}</p>
              </div>
              {turmaNome && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-500 font-medium mb-0.5">Turma</p>
                  <p className="font-semibold text-blue-900 text-sm">{turmaNome}</p>
                </div>
              )}
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-500 font-medium mb-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />Início
                </p>
                <p className="font-semibold text-blue-900 text-sm">{formatarData(macroInicio)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-500 font-medium mb-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />Término
                </p>
                <p className="font-semibold text-blue-900 text-sm">{formatarData(macroTermino)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Indicadores congelados do ciclo */}
        {ciclo && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Indicadores do Ciclo
                <span className="text-xs font-normal text-gray-400 ml-1">(congelados no encerramento)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 7 indicadores em grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <IndicadorCard label="Webinars" valor={ind1} cor="blue" icon={BarChart2} />
                <IndicadorCard label="Avaliações" valor={ind2} cor="purple" icon={ClipboardList} />
                <IndicadorCard label="Competências" valor={ind3} cor="green" icon={Star} />
                <IndicadorCard label="Tarefas" valor={ind4} cor="orange" icon={CheckCircle2} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <IndicadorCard label="Nota Mentora" valor={ind5} cor="pink" icon={Award} />
                <IndicadorCard label="Aplicabilidade" valor={ind6} cor="orange" icon={Zap} />
                <IndicadorCard label="Engajamento Final" valor={ind7} cor="blue" icon={TrendingUp} />
              </div>

              {/* 3 Macroindicadores */}
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Macroindicadores</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Engajamento */}
                  {(() => {
                    const atingiu = engajamento >= 80;
                    return (
                      <div className={`rounded-xl p-4 border-2 ${atingiu ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600">Engajamento</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${atingiu ? "bg-blue-200 text-blue-800" : "bg-red-200 text-red-800"}`}>
                            {atingiu ? "✓ Meta atingida" : "✗ Abaixo da meta"}
                          </span>
                        </div>
                        <div className={`text-3xl font-black ${atingiu ? "text-blue-600" : "text-red-600"}`}>{engajamento}%</div>
                        <div className="text-xs text-gray-400 mt-1">Meta: 80%</div>
                      </div>
                    );
                  })()}
                  {/* Jornada de Superação */}
                  {(() => {
                    const atingiu = !semMetas && metasPct >= 80;
                    return (
                      <div className={`rounded-xl p-4 border-2 ${semMetas ? "border-gray-200 bg-gray-50" : atingiu ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600">Jornada de Superação</span>
                          {!semMetas && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${atingiu ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                              {atingiu ? "✓ Meta atingida" : "✗ Abaixo da meta"}
                            </span>
                          )}
                        </div>
                        <div className={`text-3xl font-black ${semMetas ? "text-gray-400" : atingiu ? "text-green-600" : "text-red-600"}`}>
                          {semMetas ? "N/A" : `${metasPct}%`}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {semMetas ? "Sem metas atribuídas" : `Meta: 80% • ${metasCumpridas}/${metasTotal} metas`}
                        </div>
                      </div>
                    );
                  })()}
                  {/* Aplicabilidade Prática */}
                  {(() => {
                    const atingiu = aplicabilidade >= 80;
                    return (
                      <div className={`rounded-xl p-4 border-2 ${atingiu ? "border-orange-200 bg-orange-50" : "border-red-200 bg-red-50"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600">Aplicabilidade Prática</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${atingiu ? "bg-orange-200 text-orange-800" : "bg-red-200 text-red-800"}`}>
                            {atingiu ? "✓ Meta atingida" : "✗ Abaixo da meta"}
                          </span>
                        </div>
                        <div className={`text-3xl font-black ${atingiu ? "text-orange-500" : "text-red-600"}`}>{aplicabilidade}%</div>
                        <div className="text-xs text-gray-400 mt-1">Meta: 80%</div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Resumo aprovação */}
              {(() => {
                const atingidos = [engajamento >= 80, !semMetas && metasPct >= 80, aplicabilidade >= 80].filter(Boolean).length;
                const total3 = semMetas ? 2 : 3;
                return (
                  <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${atingidos === total3 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                    <Award className="h-4 w-4" />
                    {atingidos === total3
                      ? `Todos os ${total3} macroindicadores atingiram 80% — Ciclo aprovado!`
                      : `${atingidos} de ${total3} macroindicadores atingiram 80%`}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Competências Obrigatórias */}
        {obrigatorias.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Competências Obrigatórias
                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">{obrigatorias.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {obrigatorias.map((comp) => (
                <div key={comp.id} className="flex items-start justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-gray-800">{comp.competenciaNome}</p>
                      {comp.justificativa && (
                        <p className="text-xs text-gray-500 mt-0.5">{comp.justificativa}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {comp.nivelAtual != null && (
                      <span className="text-xs text-gray-500">Nível: {comp.nivelAtual}%</span>
                    )}
                    {comp.notaCorte && (
                      <Badge variant="outline" className="text-xs">Meta: {comp.notaCorte}%</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Competências Opcionais */}
        {opcionais.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Circle className="h-4 w-4 text-blue-500" />
                Competências Opcionais
                <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">{opcionais.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {opcionais.map((comp) => (
                <div key={comp.id} className="flex items-start justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-start gap-2">
                    <Circle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-gray-800">{comp.competenciaNome}</p>
                      {comp.justificativa && (
                        <p className="text-xs text-gray-500 mt-0.5">{comp.justificativa}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {comp.nivelAtual != null && (
                      <span className="text-xs text-gray-500">Nível: {comp.nivelAtual}%</span>
                    )}
                    {comp.notaCorte && (
                      <Badge variant="outline" className="text-xs">Meta: {comp.notaCorte}%</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {pdi && pdi.competencias.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Nenhuma competência registrada neste PDI</p>
          </div>
        )}

        <div className="pb-6">
          <Button variant="outline" onClick={() => navigate("/evolucao")} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Evolução
          </Button>
        </div>
      </div>
    </AlunoLayout>
  );
}
