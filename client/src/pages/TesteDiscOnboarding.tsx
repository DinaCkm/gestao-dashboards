import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ChevronRight, ChevronLeft, CheckCircle2, Target, Brain,
  BarChart3, Sparkles, AlertCircle, Download, ArrowRight,
  CircleDot, Gauge, BookOpen, Eye, MessageSquare, Info
} from "lucide-react";

// ============================================================
// TIPOS
// ============================================================

type DiscDimensao = "D" | "I" | "S" | "C";

interface DiscPergunta {
  index: number;
  dimensao: DiscDimensao;
  texto: string;
}

interface DiscScores {
  D: number;
  I: number;
  S: number;
  C: number;
}

interface DiscPerfil {
  nome: string;
  titulo: string;
  descricao: string;
  pontosFortes: string[];
  areasDesenvolvimento: string[];
  comoSeRelaciona: string;
  cor: string;
}

// ============================================================
// SUB-ETAPAS DO ASSESSMENT
// ============================================================

type SubEtapa = "disc" | "autopercepção" | "relatorio";

// ============================================================
// COMPONENTE: TESTE DISC
// ============================================================

function TesteDisc({
  alunoId,
  onComplete,
}: {
  alunoId: number;
  onComplete: (scores: DiscScores, predominante: DiscDimensao, secundario: DiscDimensao) => void;
}) {
  const { data: perguntasData } = trpc.disc.perguntas.useQuery();
  const salvarMutation = trpc.disc.salvarRespostas.useMutation();

  const perguntas: DiscPergunta[] = perguntasData?.perguntas || [];
  const escalaLabels: Record<number, string> = perguntasData?.escalaLabels || {};

  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [paginaAtual, setPaginaAtual] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  const PERGUNTAS_POR_PAGINA = 7;
  const totalPaginas = Math.ceil(perguntas.length / PERGUNTAS_POR_PAGINA);

  const perguntasPagina = useMemo(() => {
    const start = paginaAtual * PERGUNTAS_POR_PAGINA;
    return perguntas.slice(start, start + PERGUNTAS_POR_PAGINA);
  }, [perguntas, paginaAtual]);

  const totalRespondidas = Object.keys(respostas).length;
  const progresso = perguntas.length > 0 ? Math.round((totalRespondidas / perguntas.length) * 100) : 0;

  const paginaCompleta = perguntasPagina.every((p) => respostas[p.index] !== undefined);
  const todasRespondidas = totalRespondidas === perguntas.length;

  const handleResponder = (index: number, valor: number) => {
    setRespostas((prev) => ({ ...prev, [index]: valor }));
  };

  const handleFinalizar = async () => {
    if (!todasRespondidas) {
      toast.error("Responda todas as perguntas antes de finalizar.");
      return;
    }

    try {
      const respostasArray = perguntas.map((p) => ({
        perguntaIndex: p.index,
        dimensao: p.dimensao,
        resposta: respostas[p.index],
      }));

      const resultado = await salvarMutation.mutateAsync({
        alunoId,
        respostas: respostasArray,
      });

      toast.success("Teste DISC concluído com sucesso!");
      onComplete(resultado.scores, resultado.perfilPredominante, resultado.perfilSecundario);
    } catch {
      toast.error("Erro ao salvar respostas. Tente novamente.");
    }
  };

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const dimensaoAtual = perguntasPagina[0]?.dimensao;
  const dimensaoNomes: Record<DiscDimensao, string> = {
    D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade"
  };
  const dimensaoCores: Record<DiscDimensao, string> = {
    D: "text-red-600 bg-red-50 border-red-200",
    I: "text-amber-600 bg-amber-50 border-amber-200",
    S: "text-green-600 bg-green-50 border-green-200",
    C: "text-blue-600 bg-blue-50 border-blue-200",
  };

  if (!perguntasData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-[#0A1E3E] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={topRef}>
      {/* Header */}
      <div className="text-center mb-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#0A1E3E]/10 to-[#F5991F]/10 flex items-center justify-center">
          <Brain className="h-8 w-8 text-[#0A1E3E]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Teste de Perfil DISC</h2>
        <p className="text-gray-500 mt-1 max-w-lg mx-auto">
          Responda com sinceridade — não existem respostas certas ou erradas. Escolha o quanto cada afirmação representa você no dia a dia.
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>{totalRespondidas} de {perguntas.length} respondidas</span>
          <span>{progresso}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#0A1E3E] to-[#F5991F] rounded-full transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {/* Indicador de dimensão */}
      {dimensaoAtual && (
        <div className="max-w-2xl mx-auto">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${dimensaoCores[dimensaoAtual]}`}>
            <CircleDot className="h-3.5 w-3.5" />
            Bloco {paginaAtual + 1} de {totalPaginas} — {dimensaoNomes[dimensaoAtual]}
          </div>
        </div>
      )}

      {/* Perguntas */}
      <div className="max-w-2xl mx-auto space-y-4">
        {perguntasPagina.map((pergunta, idx) => {
          const globalNum = paginaAtual * PERGUNTAS_POR_PAGINA + idx + 1;
          return (
            <Card key={pergunta.index} className={`transition-all duration-300 ${respostas[pergunta.index] ? "border-[#0A1E3E]/20 bg-[#0A1E3E]/[0.02]" : ""}`}>
              <CardContent className="pt-5 pb-5">
                <p className="font-medium text-gray-800 mb-4">
                  <span className="text-[#F5991F] font-bold mr-2">{globalNum}.</span>
                  {pergunta.texto}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((valor) => (
                    <button
                      key={valor}
                      onClick={() => handleResponder(pergunta.index, valor)}
                      className={`flex-1 min-w-[100px] px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
                        respostas[pergunta.index] === valor
                          ? "bg-[#0A1E3E] text-white border-[#0A1E3E] shadow-md"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#0A1E3E]/30 hover:bg-[#0A1E3E]/5"
                      }`}
                    >
                      <span className="block text-xs opacity-70">{valor}</span>
                      <span className="block text-[11px] leading-tight mt-0.5">{escalaLabels[valor]}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Navegação */}
      <div className="max-w-2xl mx-auto flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => { setPaginaAtual((p) => p - 1); scrollToTop(); }}
          disabled={paginaAtual === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>

        {paginaAtual < totalPaginas - 1 ? (
          <Button
            onClick={() => {
              if (!paginaCompleta) {
                toast.warning("Responda todas as perguntas desta página antes de avançar.");
                return;
              }
              setPaginaAtual((p) => p + 1);
              scrollToTop();
            }}
            className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white gap-2"
          >
            Próximo <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleFinalizar}
            disabled={!todasRespondidas || salvarMutation.isPending}
            className="bg-[#F5991F] hover:bg-[#F5991F]/90 text-white gap-2"
          >
            {salvarMutation.isPending ? "Salvando..." : "Finalizar Teste DISC"}
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: RÉGUA DE AUTOPERCEPÇÃO
// ============================================================

function ReguaAutopercepção({
  alunoId,
  onComplete,
}: {
  alunoId: number;
  onComplete: () => void;
}) {
  const { data: competenciasData } = trpc.competencias.listWithTrilha.useQuery();
  const { data: trilhasData } = trpc.trilhas.list.useQuery();
  const salvarMutation = trpc.autopercepção.salvar.useMutation();

  const [notas, setNotas] = useState<Record<number, number>>({});
  const [trilhaAtual, setTrilhaAtual] = useState(0);

  const trilhasOrdenadas = useMemo(() => {
    if (!trilhasData) return [];
    return [...trilhasData].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }, [trilhasData]);

  const competenciasPorTrilha = useMemo(() => {
    if (!competenciasData || !trilhasOrdenadas.length) return [];
    return trilhasOrdenadas.map((trilha) => ({
      trilha,
      competencias: competenciasData.filter((c: any) => c.trilhaId === trilha.id),
    }));
  }, [competenciasData, trilhasOrdenadas]);

  const trilhaAtualData = competenciasPorTrilha[trilhaAtual];
  const totalCompetencias = competenciasData?.length || 0;
  const totalRespondidas = Object.keys(notas).length;
  const progresso = totalCompetencias > 0 ? Math.round((totalRespondidas / totalCompetencias) * 100) : 0;

  const trilhaCompleta = trilhaAtualData?.competencias.every((c: any) => notas[c.id] !== undefined) || false;
  const todasRespondidas = totalRespondidas === totalCompetencias;

  const notaLabels: Record<number, string> = {
    1: "Preciso desenvolver muito",
    2: "Preciso desenvolver",
    3: "Razoável",
    4: "Bom domínio",
    5: "Domino com excelência",
  };

  const notaCores: Record<number, string> = {
    1: "bg-red-500",
    2: "bg-orange-400",
    3: "bg-yellow-400",
    4: "bg-emerald-400",
    5: "bg-emerald-600",
  };

  const trilhaCores: Record<string, string> = {
    "Basic": "from-blue-500 to-blue-600",
    "Essential": "from-emerald-500 to-emerald-600",
    "Master": "from-purple-500 to-purple-600",
    "Visão de Futuro": "from-amber-500 to-amber-600",
  };

  const handleSalvar = async () => {
    if (!todasRespondidas) {
      toast.error("Avalie todas as competências antes de finalizar.");
      return;
    }

    try {
      const avaliacoes = Object.entries(notas).map(([compId, nota]) => {
        const comp = competenciasData?.find((c: any) => c.id === Number(compId));
        return {
          competenciaId: Number(compId),
          trilhaId: comp?.trilhaId || 0,
          nota,
        };
      });

      await salvarMutation.mutateAsync({ alunoId, avaliacoes });
      toast.success("Autopercepção salva com sucesso!");
      onComplete();
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    }
  };

  if (!competenciasData || !trilhasData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-[#0A1E3E] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#0A1E3E]/10 to-[#F5991F]/10 flex items-center justify-center">
          <Gauge className="h-8 w-8 text-[#F5991F]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Régua de Autopercepção</h2>
        <p className="text-gray-500 mt-1 max-w-lg mx-auto">
          Avalie como você se percebe em cada competência. Seja honesto(a) — essa avaliação ajudará sua mentora a entender seu ponto de partida.
        </p>
      </div>

      {/* Instrução */}
      <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800 flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            <strong>Dica:</strong> Não se preocupe em acertar — o importante é como você se percebe hoje. 
            Sua mentora usará essa informação como ponto de partida para construir sua trilha de desenvolvimento.
          </span>
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>{totalRespondidas} de {totalCompetencias} avaliadas</span>
          <span>{progresso}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#0A1E3E] to-[#F5991F] rounded-full transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {/* Tabs de trilhas */}
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-2 flex-wrap">
          {competenciasPorTrilha.map((item, idx) => {
            const respondidas = item.competencias.filter((c: any) => notas[c.id] !== undefined).length;
            const total = item.competencias.length;
            const completa = respondidas === total;
            return (
              <button
                key={item.trilha.id}
                onClick={() => setTrilhaAtual(idx)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  trilhaAtual === idx
                    ? "bg-[#0A1E3E] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {item.trilha.name}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  completa ? "bg-emerald-100 text-emerald-700" : trilhaAtual === idx ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {respondidas}/{total}
                </span>
                {completa && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Competências da trilha atual */}
      {trilhaAtualData && (
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Badge da trilha */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${trilhaCores[trilhaAtualData.trilha.name] || "from-gray-500 to-gray-600"} text-white text-sm font-medium`}>
            <BookOpen className="h-4 w-4" />
            Trilha {trilhaAtualData.trilha.name} — {trilhaAtualData.competencias.length} competências
          </div>

          {trilhaAtualData.competencias.map((comp: any) => (
            <Card key={comp.id} className={`transition-all duration-300 ${notas[comp.id] ? "border-[#0A1E3E]/20" : ""}`}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{comp.nome}</h4>
                    {comp.descricao && (
                      <p className="text-xs text-gray-500 mt-1 max-w-md">{comp.descricao}</p>
                    )}
                  </div>
                  {notas[comp.id] && (
                    <Badge className={`${notaCores[notas[comp.id]]} text-white border-0 text-xs`}>
                      {notas[comp.id]}/5
                    </Badge>
                  )}
                </div>

                {/* Slider visual */}
                <div className="space-y-2">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((valor) => (
                      <button
                        key={valor}
                        onClick={() => setNotas((prev) => ({ ...prev, [comp.id]: valor }))}
                        className={`flex-1 py-3 rounded-lg border text-center transition-all duration-200 ${
                          notas[comp.id] === valor
                            ? `${notaCores[valor]} text-white border-transparent shadow-md scale-105`
                            : notas[comp.id] && notas[comp.id] >= valor
                            ? `${notaCores[valor]} text-white border-transparent opacity-60`
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <span className="block text-lg font-bold">{valor}</span>
                        <span className="block text-[10px] leading-tight mt-0.5 px-1">{notaLabels[valor]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Navegação */}
      <div className="max-w-2xl mx-auto flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => setTrilhaAtual((t) => t - 1)}
          disabled={trilhaAtual === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" /> Trilha Anterior
        </Button>

        {trilhaAtual < competenciasPorTrilha.length - 1 ? (
          <Button
            onClick={() => {
              if (!trilhaCompleta) {
                toast.warning("Avalie todas as competências desta trilha antes de avançar.");
                return;
              }
              setTrilhaAtual((t) => t + 1);
            }}
            className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white gap-2"
          >
            Próxima Trilha <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSalvar}
            disabled={!todasRespondidas || salvarMutation.isPending}
            className="bg-[#F5991F] hover:bg-[#F5991F]/90 text-white gap-2"
          >
            {salvarMutation.isPending ? "Salvando..." : "Finalizar Autopercepção"}
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: RELATÓRIO DE AUTOCONHECIMENTO
// ============================================================

function RelatorioAutoconhecimento({
  alunoId,
  discScores,
  perfilPredominante,
  perfilSecundario,
  onComplete,
}: {
  alunoId: number;
  discScores: DiscScores | null;
  perfilPredominante: DiscDimensao | null;
  perfilSecundario: DiscDimensao | null;
  onComplete: () => void;
}) {
  const { data: perfisData } = trpc.disc.perfis.useQuery();
  const { data: autopercepcoesData } = trpc.autopercepção.porAluno.useQuery({ alunoId });
  const { data: competenciasData } = trpc.competencias.listWithTrilha.useQuery();
  const { data: trilhasData } = trpc.trilhas.list.useQuery();
  const { data: contribuicoesData } = trpc.contribuicoesMentora.porAluno.useQuery({ alunoId });

  const perfis = perfisData as Record<DiscDimensao, DiscPerfil> | undefined;
  const perfilPrincipal = perfis && perfilPredominante ? perfis[perfilPredominante] : null;
  const perfilSec = perfis && perfilSecundario ? perfis[perfilSecundario] : null;

  // Agrupar autopercepções por trilha
  const autopercepçãoPorTrilha = useMemo(() => {
    if (!autopercepcoesData || !competenciasData || !trilhasData) return [];
    const trilhasOrdenadas = [...trilhasData].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    return trilhasOrdenadas.map((trilha) => {
      const comps = competenciasData.filter((c: any) => c.trilhaId === trilha.id);
      const avaliacoes = comps.map((c: any) => {
        const avaliacao = autopercepcoesData.find((a: any) => a.competenciaId === c.id);
        return { competencia: c, nota: avaliacao?.nota || 0 };
      });
      const media = avaliacoes.length > 0
        ? avaliacoes.reduce((sum: number, a: any) => sum + a.nota, 0) / avaliacoes.length
        : 0;
      return { trilha, avaliacoes, media };
    });
  }, [autopercepcoesData, competenciasData, trilhasData]);

  // Contribuições da mentora
  const contribuicoesDisc = contribuicoesData?.filter((c: any) => c.tipo === "disc") || [];
  const contribuicoesGeral = contribuicoesData?.filter((c: any) => c.tipo === "geral") || [];

  const dimensaoCores: Record<DiscDimensao, string> = {
    D: "#DC2626", I: "#F59E0B", S: "#16A34A", C: "#2563EB"
  };

  const notaLabels: Record<number, string> = {
    1: "Preciso desenvolver muito",
    2: "Preciso desenvolver",
    3: "Razoável",
    4: "Bom domínio",
    5: "Domino com excelência",
  };

  const notaCores: Record<number, string> = {
    1: "bg-red-500", 2: "bg-orange-400", 3: "bg-yellow-400", 4: "bg-emerald-400", 5: "bg-emerald-600"
  };

  const trilhaCoresMap: Record<string, string> = {
    "Basic": "#3B82F6",
    "Essential": "#10B981",
    "Master": "#8B5CF6",
    "Visão de Futuro": "#F59E0B",
  };

  const handleDownloadPDF = () => {
    toast.info("Preparando download do relatório em PDF...");
    // Usar window.print() como solução simples para gerar PDF
    window.print();
  };

  if (!perfis || !discScores) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-[#0A1E3E] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4" id="relatorio-autoconhecimento">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#0A1E3E]/10 to-[#F5991F]/10 flex items-center justify-center print:hidden">
          <BarChart3 className="h-8 w-8 text-[#0A1E3E]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Relatório de Autoconhecimento</h2>
        <p className="text-gray-500 mt-1 max-w-lg mx-auto">
          Seu perfil comportamental e mapa de competências — leve essas informações para sua sessão de mentoria.
        </p>
      </div>

      {/* Botão Download */}
      <div className="flex justify-center print:hidden">
        <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
          <Download className="h-4 w-4" /> Baixar Relatório (PDF)
        </Button>
      </div>

      {/* ===== SEÇÃO 1: PERFIL DISC ===== */}
      <Card className="max-w-3xl mx-auto overflow-hidden">
        <div className="bg-gradient-to-r from-[#0A1E3E] to-[#2a5a8a] p-5 text-white">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Brain className="h-5 w-5" /> Seu Perfil DISC
          </h3>
          <p className="text-white/70 text-sm mt-1">Resultado baseado nas suas respostas ao teste comportamental</p>
        </div>
        <CardContent className="pt-6 space-y-6">
          {/* Gráfico de barras DISC */}
          <div className="space-y-3">
            {(["D", "I", "S", "C"] as DiscDimensao[]).map((dim) => {
              const score = discScores[dim];
              const perfil = perfis[dim];
              const isPredominante = dim === perfilPredominante;
              return (
                <div key={dim} className={`p-3 rounded-lg transition-all ${isPredominante ? "bg-gray-50 ring-1 ring-gray-200" : ""}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: dimensaoCores[dim] }}>
                        {dim}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">{perfil.nome}</span>
                        {isPredominante && (
                          <Badge className="ml-2 bg-[#F5991F] text-white border-0 text-[10px]">PREDOMINANTE</Badge>
                        )}
                        {dim === perfilSecundario && (
                          <Badge variant="outline" className="ml-2 text-[10px]">SECUNDÁRIO</Badge>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-lg" style={{ color: dimensaoCores[dim] }}>{score}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${score}%`, backgroundColor: dimensaoCores[dim] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Descrição do perfil predominante */}
          {perfilPrincipal && (
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: perfilPrincipal.cor }}>
                  {perfilPredominante}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{perfilPrincipal.titulo}</h4>
                  <p className="text-sm text-gray-500">{perfilPrincipal.nome}</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">{perfilPrincipal.descricao}</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-lg p-4">
                  <h5 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" /> Pontos Fortes
                  </h5>
                  <ul className="space-y-1">
                    {perfilPrincipal.pontosFortes.map((pf, i) => (
                      <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {pf}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <h5 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Áreas de Desenvolvimento
                  </h5>
                  <ul className="space-y-1">
                    {perfilPrincipal.areasDesenvolvimento.map((ad, i) => (
                      <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                        <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {ad}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Como você se relaciona
                </h5>
                <p className="text-sm text-blue-700">{perfilPrincipal.comoSeRelaciona}</p>
              </div>

              {/* Perfil secundário */}
              {perfilSec && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-700 mb-1 text-sm">Perfil Secundário: {perfilSec.titulo} ({perfilSec.nome})</h5>
                  <p className="text-sm text-gray-600">{perfilSec.descricao}</p>
                </div>
              )}
            </div>
          )}

          {/* Contribuições da mentora sobre DISC */}
          {contribuicoesDisc.length > 0 && (
            <div className="border-t pt-4">
              <h5 className="font-semibold text-[#0A1E3E] mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Observações da Mentora
              </h5>
              {contribuicoesDisc.map((c: any) => (
                <div key={c.id} className="bg-[#0A1E3E]/5 rounded-lg p-3 mb-2">
                  <p className="text-sm text-gray-700">{c.conteudo}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== SEÇÃO 2: MAPA DE AUTOPERCEPÇÃO ===== */}
      <Card className="max-w-3xl mx-auto overflow-hidden">
        <div className="bg-gradient-to-r from-[#F5991F] to-[#e88a15] p-5 text-white">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Gauge className="h-5 w-5" /> Mapa de Autopercepção por Competência
          </h3>
          <p className="text-white/70 text-sm mt-1">Como você se avalia em cada competência das trilhas de desenvolvimento</p>
        </div>
        <CardContent className="pt-6 space-y-6">
          {autopercepçãoPorTrilha.map(({ trilha, avaliacoes, media }) => (
            <div key={trilha.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: trilhaCoresMap[trilha.name] || "#6B7280" }} />
                  <h4 className="font-semibold text-gray-800">{trilha.name}</h4>
                </div>
                <Badge variant="outline" className="text-xs">
                  Média: {media.toFixed(1)}/5
                </Badge>
              </div>

              <div className="space-y-2">
                {avaliacoes.map(({ competencia, nota }: any) => (
                  <div key={competencia.id} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-48 shrink-0 truncate" title={competencia.nome}>
                      {competencia.nome}
                    </span>
                    <div className="flex-1 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className={`h-4 flex-1 rounded-sm transition-all ${
                            n <= nota ? notaCores[nota] : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8 text-right">{nota}/5</span>
                  </div>
                ))}
              </div>

              {/* Contribuições da mentora por competência */}
              {contribuicoesData?.filter((c: any) => c.tipo === "competencia" && avaliacoes.some((a: any) => a.competencia.id === c.competenciaId)).map((c: any) => (
                <div key={c.id} className="bg-[#0A1E3E]/5 rounded-lg p-3 ml-4">
                  <p className="text-xs text-[#0A1E3E] font-medium mb-1">Observação da Mentora:</p>
                  <p className="text-sm text-gray-700">{c.conteudo}</p>
                </div>
              ))}
            </div>
          ))}

          {/* Legenda */}
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 font-medium mb-2">Legenda:</p>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded-sm ${notaCores[n]}`} />
                  <span className="text-xs text-gray-600">{n} - {notaLabels[n]}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== SEÇÃO 3: CONTRIBUIÇÕES GERAIS DA MENTORA ===== */}
      {contribuicoesGeral.length > 0 && (
        <Card className="max-w-3xl mx-auto overflow-hidden">
          <div className="bg-gradient-to-r from-[#0A1E3E] to-[#F5991F] p-5 text-white">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Observações Gerais da Mentora
            </h3>
          </div>
          <CardContent className="pt-6 space-y-3">
            {contribuicoesGeral.map((c: any) => (
              <div key={c.id} className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{c.conteudo}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dica para a sessão */}
      <div className="max-w-3xl mx-auto bg-blue-50 border border-blue-200 rounded-lg p-5">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> Prepare-se para sua sessão de mentoria
        </h4>
        <ul className="space-y-2 text-sm text-blue-700">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Revise seu perfil DISC e reflita sobre como ele se manifesta no seu dia a dia
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Observe as competências que você avaliou como mais baixas — são oportunidades de crescimento
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Pense em exemplos concretos do seu trabalho que ilustrem seus pontos fortes e desafios
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Leve perguntas e expectativas para a conversa com sua mentora
          </li>
        </ul>
      </div>

      {/* Botão continuar */}
      <div className="flex justify-center print:hidden pt-4">
        <Button
          className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white px-8 py-3 text-base gap-2"
          onClick={onComplete}
        >
          Continuar para Escolha da Mentora <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL: ETAPA ASSESSMENT COMPLETA
// ============================================================

export default function EtapaAssessmentCompleta({
  alunoId,
  onComplete,
}: {
  alunoId: number;
  onComplete: () => void;
}) {
  // Verificar se já fez o teste
  const { data: discResultado } = trpc.disc.resultado.useQuery({ alunoId }, { enabled: !!alunoId });
  const { data: autopercepcoesExistentes } = trpc.autopercepção.porAluno.useQuery({ alunoId }, { enabled: !!alunoId });

  const [subEtapa, setSubEtapa] = useState<SubEtapa>("disc");
  const [discScores, setDiscScores] = useState<DiscScores | null>(null);
  const [perfilPredominante, setPerfilPredominante] = useState<DiscDimensao | null>(null);
  const [perfilSecundario, setPerfilSecundario] = useState<DiscDimensao | null>(null);

  // Se já fez o teste, ir direto para o relatório
  useMemo(() => {
    if (discResultado && autopercepcoesExistentes && autopercepcoesExistentes.length > 0) {
      setDiscScores({
        D: Number(discResultado.scoreD),
        I: Number(discResultado.scoreI),
        S: Number(discResultado.scoreS),
        C: Number(discResultado.scoreC),
      });
      setPerfilPredominante(discResultado.perfilPredominante as DiscDimensao);
      setPerfilSecundario(discResultado.perfilSecundario as DiscDimensao);
      setSubEtapa("relatorio");
    } else if (discResultado && (!autopercepcoesExistentes || autopercepcoesExistentes.length === 0)) {
      setDiscScores({
        D: Number(discResultado.scoreD),
        I: Number(discResultado.scoreI),
        S: Number(discResultado.scoreS),
        C: Number(discResultado.scoreC),
      });
      setPerfilPredominante(discResultado.perfilPredominante as DiscDimensao);
      setPerfilSecundario(discResultado.perfilSecundario as DiscDimensao);
      setSubEtapa("autopercepção");
    }
  }, [discResultado, autopercepcoesExistentes]);

  // Sub-stepper
  const subSteps = [
    { id: "disc" as SubEtapa, label: "Teste DISC", icon: Brain },
    { id: "autopercepção" as SubEtapa, label: "Autopercepção", icon: Gauge },
    { id: "relatorio" as SubEtapa, label: "Relatório", icon: BarChart3 },
  ];

  const currentSubIndex = subSteps.findIndex((s) => s.id === subEtapa);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Sub-stepper */}
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-[#0A1E3E] to-[#F5991F] z-0 transition-all duration-700"
            style={{ width: `${(currentSubIndex / (subSteps.length - 1)) * 100}%` }}
          />
          {subSteps.map((step, idx) => {
            const isCompleted = idx < currentSubIndex;
            const isCurrent = idx === currentSubIndex;
            const StepIcon = step.icon;
            return (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted ? "bg-emerald-500 text-white" :
                  isCurrent ? "bg-[#0A1E3E] text-white shadow-lg" :
                  "bg-gray-200 text-gray-400"
                }`}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                </div>
                <span className={`text-xs mt-2 font-medium ${
                  isCurrent ? "text-[#0A1E3E]" : isCompleted ? "text-emerald-600" : "text-gray-400"
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conteúdo da sub-etapa */}
      {subEtapa === "disc" && (
        <TesteDisc
          alunoId={alunoId}
          onComplete={(scores, predominante, secundario) => {
            setDiscScores(scores);
            setPerfilPredominante(predominante);
            setPerfilSecundario(secundario);
            setSubEtapa("autopercepção");
          }}
        />
      )}

      {subEtapa === "autopercepção" && (
        <ReguaAutopercepção
          alunoId={alunoId}
          onComplete={() => setSubEtapa("relatorio")}
        />
      )}

      {subEtapa === "relatorio" && (
        <RelatorioAutoconhecimento
          alunoId={alunoId}
          discScores={discScores}
          perfilPredominante={perfilPredominante}
          perfilSecundario={perfilSecundario}
          onComplete={onComplete}
        />
      )}
    </div>
  );
}
