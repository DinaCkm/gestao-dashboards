import AlunoLayout from "@/components/AlunoLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, BookOpen, Target, Calendar, Users,
  CheckCircle2, Circle, ClipboardList, FileText, Trophy, Star, ChevronDown, ChevronUp
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState } from "react";

function formatarData(data: string | null | undefined) {
  if (!data) return "—";
  try {
    return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return "—"; }
}

/** Card de um único PDI (uma trilha) */
function PdiCard({ pdi, defaultOpen }: { pdi: any; defaultOpen?: boolean }) {
  const [aberto, setAberto] = useState(defaultOpen ?? true);
  const obrigatorias = pdi.competencias.filter((c: any) => c.peso === "obrigatoria");
  const opcionais = pdi.competencias.filter((c: any) => c.peso === "opcional");

  return (
    <Card className="border border-gray-200 overflow-hidden">
      {/* Cabeçalho da trilha */}
      <button
        className="w-full text-left"
        onClick={() => setAberto(v => !v)}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#0A1E3E]/5 to-transparent hover:from-[#0A1E3E]/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-[#0A1E3E] text-base">{pdi.trilhaNome}</p>
              {pdi.turmaNome && <p className="text-xs text-gray-500">{pdi.turmaNome}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pdi.status && (
              <Badge variant="outline" className="capitalize text-gray-500 border-gray-300 text-xs">
                {pdi.status}
              </Badge>
            )}
            {aberto ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </div>
        </div>
      </button>

      {aberto && (
        <CardContent className="pt-4 pb-5 space-y-5">
          {/* Período */}
          <div className="flex gap-3 flex-wrap">
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs text-blue-700 font-medium">
                {formatarData(pdi.macroInicio)} → {formatarData(pdi.macroTermino)}
              </span>
            </div>
          </div>

          {/* O que o aluno deve realizar */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              O que você deve realizar nesta trilha
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                <Users className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                <div className="text-xl font-black text-purple-700">{pdi.totalSessoesPrevistas ?? "—"}</div>
                <p className="text-xs text-purple-600 font-medium">Sessões de Mentoria</p>
                <p className="text-[10px] text-gray-400">1 por mês do ciclo</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                <ClipboardList className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                <div className="text-xl font-black text-amber-700">{pdi.tarefasPrevistas ?? "—"}</div>
                <p className="text-xs text-amber-600 font-medium">Tarefas</p>
                <p className="text-[10px] text-gray-400">1 por sessão</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                <FileText className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                <div className="text-xl font-black text-emerald-700">{pdi.casesPrevistas ?? 1}</div>
                <p className="text-xs text-emerald-600 font-medium">Case{(pdi.casesPrevistas ?? 1) !== 1 ? "s" : ""} de Sucesso</p>
                <p className="text-[10px] text-gray-400">ao final do ciclo</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                <Star className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                <div className="text-xl font-black text-blue-700">{pdi.totalCompetencias}</div>
                <p className="text-xs text-blue-600 font-medium">Competências</p>
                <p className="text-[10px] text-gray-400">{pdi.obrigatorias} obrig. · {pdi.opcionais} opc.</p>
              </div>
            </div>
          </div>

          {/* Metas */}
          {pdi.metas && pdi.metas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" />
                Metas atribuídas ({pdi.metas.length})
              </p>
              <div className="space-y-1.5">
                {pdi.metas.map((meta: any) => (
                  <div key={meta.id} className="flex items-start gap-2 p-2.5 bg-amber-50/60 border border-amber-100 rounded-lg">
                    <Trophy className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-gray-800">{meta.titulo}</p>
                      {meta.descricao && <p className="text-xs text-gray-500 mt-0.5">{meta.descricao}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competências Obrigatórias */}
          {obrigatorias.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Competências Obrigatórias ({obrigatorias.length})
              </p>
              <div className="space-y-1.5">
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
              </div>
            </div>
          )}

          {/* Competências Opcionais */}
          {opcionais.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Circle className="h-3.5 w-3.5 text-blue-400" />
                Competências Opcionais ({opcionais.length})
              </p>
              <div className="space-y-1.5">
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
              </div>
            </div>
          )}

          {pdi.competencias.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Nenhuma competência registrada nesta trilha
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function VisualizarPDI() {
  const [, navigate] = useLocation();
  const params = useParams<{ pdiId?: string; contratoNivelId?: string }>();

  const contratoNivelId = params.contratoNivelId ? parseInt(params.contratoNivelId) : null;
  const pdiId = params.pdiId ? parseInt(params.pdiId) : null;

  // Ler ciclo do sessionStorage
  const cicloRaw = typeof window !== "undefined"
    ? (contratoNivelId
        ? sessionStorage.getItem(`ciclo_nivel_${contratoNivelId}`)
        : sessionStorage.getItem(`ciclo_snapshot_${pdiId}`))
    : null;
  const ciclo = cicloRaw ? JSON.parse(cicloRaw) : null;
  const numeroCiclo = ciclo?.numeroCiclo;

  // Modo 1: buscar todos os PDIs do contratoNivelId
  const { data: todosPdis, isLoading: loadingNivel } = trpc.assessment.porContratoNivel.useQuery(
    { contratoNivelId: contratoNivelId! },
    { enabled: !!contratoNivelId }
  );

  // Modo 2: buscar PDI único por pdiId (fallback)
  const { data: pdiUnico, isLoading: loadingPdi } = trpc.assessment.porId.useQuery(
    { pdiId: pdiId! },
    { enabled: !!pdiId && !contratoNivelId }
  );

  const isLoading = loadingNivel || loadingPdi;
  const pdis: any[] = contratoNivelId
    ? (todosPdis || [])
    : (pdiUnico ? [pdiUnico] : []);

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

  if (pdis.length === 0) {
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

  // Período geral: menor macroInicio e maior macroTermino entre todos os PDIs
  const periodoInicio = pdis.reduce((min: string | null, p: any) =>
    !min || (p.macroInicio && p.macroInicio < min) ? p.macroInicio : min, null);
  const periodoTermino = pdis.reduce((max: string | null, p: any) =>
    !max || (p.macroTermino && p.macroTermino > max) ? p.macroTermino : max, null);

  return (
    <AlunoLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-5 pb-12">

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
            <p className="text-sm text-gray-500">
              Plano de Desenvolvimento Individual — visualização somente leitura
            </p>
          </div>
        </div>

        {/* Resumo geral do ciclo */}
        <Card className="border-2 border-[#0A1E3E]/10 bg-gradient-to-br from-[#0A1E3E]/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-[#0A1E3E]">
              <Target className="h-4 w-4 text-blue-600" />
              Visão Geral do Ciclo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-blue-500 font-medium mb-0.5">Trilhas</p>
                <p className="font-bold text-blue-900 text-sm">{pdis.length} trilha{pdis.length !== 1 ? "s" : ""}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{pdis.map((p: any) => p.trilhaNome).join(" · ")}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-blue-500 font-medium mb-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />Início
                </p>
                <p className="font-semibold text-blue-900 text-sm">{formatarData(periodoInicio)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-blue-500 font-medium mb-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />Término
                </p>
                <p className="font-semibold text-blue-900 text-sm">{formatarData(periodoTermino)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-blue-500 font-medium mb-0.5">Total de Competências</p>
                <p className="font-bold text-blue-900 text-sm">
                  {pdis.reduce((s: number, p: any) => s + p.totalCompetencias, 0)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {pdis.reduce((s: number, p: any) => s + p.obrigatorias, 0)} obrig. · {pdis.reduce((s: number, p: any) => s + p.opcionais, 0)} opc.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Um card por trilha/PDI */}
        {pdis.map((pdi: any, i: number) => (
          <PdiCard key={pdi.id} pdi={pdi} defaultOpen={i === 0} />
        ))}

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
