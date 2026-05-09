import AlunoLayout from "@/components/AlunoLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, BookOpen, Target, Calendar, Users,
  CheckCircle2, Circle, ClipboardList, FileText, Trophy, Star
} from "lucide-react";
import { useLocation, useParams } from "wouter";

function formatarData(data: string | null | undefined) {
  if (!data) return "—";
  try {
    return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return "—"; }
}

export default function VisualizarPDI() {
  const [, navigate] = useLocation();
  const params = useParams<{ pdiId: string }>();
  const pdiId = parseInt(params.pdiId || "0");

  // Ler o ciclo do sessionStorage (para o número do ciclo)
  const cicloRaw = typeof window !== "undefined"
    ? sessionStorage.getItem(`ciclo_snapshot_${pdiId}`)
    : null;
  const ciclo = cicloRaw ? JSON.parse(cicloRaw) : null;

  // Buscar o PDI completo via API (competências, metas, sessões previstas)
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

  if (!pdi) {
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

  const obrigatorias = pdi.competencias.filter((c: any) => c.peso === "obrigatoria");
  const opcionais = pdi.competencias.filter((c: any) => c.peso === "opcional");
  const numeroCiclo = ciclo?.numeroCiclo;

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
              PDI {numeroCiclo ? `— Ciclo ${numeroCiclo}` : ""}
            </h1>
            <p className="text-sm text-gray-500">Plano de Desenvolvimento Individual — visualização somente leitura</p>
          </div>
          {pdi.status && (
            <Badge variant="outline" className="capitalize text-gray-600 border-gray-300 shrink-0">
              {pdi.status}
            </Badge>
          )}
        </div>

        {/* Resumo do Plano */}
        <Card className="border-2 border-[#0A1E3E]/10 bg-gradient-to-br from-[#0A1E3E]/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-[#0A1E3E]">
              <Target className="h-4 w-4 text-blue-600" />
              Resumo do Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trilha, Turma e Período */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-blue-500 font-medium mb-0.5">Trilha</p>
                <p className="font-semibold text-blue-900 text-sm">{pdi.trilhaNome}</p>
              </div>
              {pdi.turmaNome && (
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-blue-500 font-medium mb-0.5">Turma</p>
                  <p className="font-semibold text-blue-900 text-sm">{pdi.turmaNome}</p>
                </div>
              )}
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-blue-500 font-medium mb-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />Início
                </p>
                <p className="font-semibold text-blue-900 text-sm">{formatarData(pdi.macroInicio)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-blue-500 font-medium mb-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />Término
                </p>
                <p className="font-semibold text-blue-900 text-sm">{formatarData(pdi.macroTermino)}</p>
              </div>
            </div>

            {/* O que o aluno deve fazer — cards de compromissos */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">O que você deve realizar neste ciclo</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Sessões de Mentoria */}
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                  <Users className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                  <div className="text-2xl font-black text-purple-700">
                    {pdi.totalSessoesPrevistas ?? "—"}
                  </div>
                  <p className="text-xs text-purple-600 font-medium mt-0.5">Sessões de Mentoria</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">1 por mês do ciclo</p>
                </div>
                {/* Tarefas */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                  <ClipboardList className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                  <div className="text-2xl font-black text-amber-700">
                    {pdi.tarefasPrevistas ?? "—"}
                  </div>
                  <p className="text-xs text-amber-600 font-medium mt-0.5">Tarefas</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">1 por sessão de mentoria</p>
                </div>
                {/* Cases */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                  <FileText className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                  <div className="text-2xl font-black text-emerald-700">
                    {pdi.casesPrevistas ?? 1}
                  </div>
                  <p className="text-xs text-emerald-600 font-medium mt-0.5">Case{(pdi.casesPrevistas ?? 1) !== 1 ? "s" : ""} de Sucesso</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">ao final do ciclo</p>
                </div>
                {/* Competências */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                  <Star className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <div className="text-2xl font-black text-blue-700">
                    {pdi.totalCompetencias}
                  </div>
                  <p className="text-xs text-blue-600 font-medium mt-0.5">Competências</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{pdi.obrigatorias} obrig. · {pdi.opcionais} opc.</p>
                </div>
              </div>
            </div>

            {/* Metas atribuídas */}
            {pdi.metas && pdi.metas.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5" />
                  Metas atribuídas pela mentora ({pdi.metas.length})
                </p>
                <div className="space-y-2">
                  {pdi.metas.map((meta: any) => (
                    <div key={meta.id} className="flex items-start gap-2 p-3 bg-white border border-gray-100 rounded-lg">
                      <Trophy className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-gray-800">{meta.titulo}</p>
                        {meta.descricao && (
                          <p className="text-xs text-gray-500 mt-0.5">{meta.descricao}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {pdi.metas && pdi.metas.length === 0 && (
              <div className="text-xs text-gray-400 italic">Nenhuma meta atribuída neste ciclo.</div>
            )}
          </CardContent>
        </Card>

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
              {obrigatorias.map((comp: any) => (
                <div key={comp.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{comp.competenciaNome}</p>
                        {comp.justificativa && (
                          <p className="text-xs text-gray-500 mt-0.5 italic">"{comp.justificativa}"</p>
                        )}
                        {(comp.microInicio || comp.microTermino) && (
                          <p className="text-[11px] text-blue-500 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatarData(comp.microInicio)} → {formatarData(comp.microTermino)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {comp.nivelAtual != null && (
                        <span className="text-xs text-gray-400">Nível atual: {comp.nivelAtual}%</span>
                      )}
                      {comp.notaCorte && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                          Meta: {comp.notaCorte}%
                        </Badge>
                      )}
                    </div>
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
              {opcionais.map((comp: any) => (
                <div key={comp.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <Circle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{comp.competenciaNome}</p>
                        {comp.justificativa && (
                          <p className="text-xs text-gray-500 mt-0.5 italic">"{comp.justificativa}"</p>
                        )}
                        {(comp.microInicio || comp.microTermino) && (
                          <p className="text-[11px] text-blue-500 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatarData(comp.microInicio)} → {formatarData(comp.microTermino)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {comp.nivelAtual != null && (
                        <span className="text-xs text-gray-400">Nível atual: {comp.nivelAtual}%</span>
                      )}
                      {comp.notaCorte && (
                        <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                          Meta: {comp.notaCorte}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {pdi.competencias.length === 0 && (
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
