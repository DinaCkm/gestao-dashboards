import AlunoLayout from "@/components/AlunoLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Target, Calendar, User, CheckCircle2, Circle } from "lucide-react";
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

  const { data: pdi, isLoading, error } = trpc.assessment.porId.useQuery(
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

  if (!pdi || error) {
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

  const obrigatorias = pdi.competencias.filter(c => c.peso === "obrigatoria");
  const opcionais = pdi.competencias.filter(c => c.peso === "opcional");

  return (
    <AlunoLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
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
          <div>
            <h1 className="text-xl font-bold text-[#0A1E3E]">PDI do Ciclo Anterior</h1>
            <p className="text-sm text-gray-500">Visualização somente leitura</p>
          </div>
          <Badge variant="outline" className="ml-auto capitalize text-gray-600 border-gray-300">
            {pdi.status}
          </Badge>
        </div>

        {/* Informações gerais */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Plano de Desenvolvimento Individual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-500 font-medium mb-0.5">Trilha</p>
                <p className="font-semibold text-blue-900 text-sm">{pdi.trilhaNome}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-500 font-medium mb-0.5">Turma</p>
                <p className="font-semibold text-blue-900 text-sm">{pdi.turmaNome || "—"}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-500 font-medium mb-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />Início
                </p>
                <p className="font-semibold text-blue-900 text-sm">{formatarData(pdi.macroInicio)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-500 font-medium mb-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />Término
                </p>
                <p className="font-semibold text-blue-900 text-sm">{formatarData(pdi.macroTermino)}</p>
              </div>
            </div>
            {pdi.consultorNome && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4 text-gray-400" />
                <span>Mentora: <span className="font-medium">{pdi.consultorNome}</span></span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>{pdi.totalCompetencias} competência{pdi.totalCompetencias !== 1 ? "s" : ""} no total</span>
              <span>·</span>
              <span>{pdi.obrigatorias} obrigatória{pdi.obrigatorias !== 1 ? "s" : ""}</span>
              <span>·</span>
              <span>{pdi.opcionais} opcional{pdi.opcionais !== 1 ? "is" : ""}</span>
            </div>
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
