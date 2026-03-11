import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ChevronRight, ChevronLeft, CheckCircle2, Target, Brain,
  BarChart3, Sparkles, AlertCircle, Download, ArrowRight,
  CircleDot, Gauge, BookOpen, Eye, MessageSquare, Info,
  Heart, Lightbulb
} from "lucide-react";

// ============================================================
// AVATAR DA MENTORA GUIA (compartilhado com OnboardingAluno)
// ============================================================
const MENTORA_GUIA_AVATAR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/mentora-guia-avatar_ad26e4e6.png";

function MentoraGuiaBannerAssessment() {
  return (
    <div className="flex items-start gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-[#F5991F]/20 rounded-xl p-5 mb-6 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
      <img
        src={MENTORA_GUIA_AVATAR}
        alt="Mentora Guia"
        className="w-20 h-24 object-cover object-top rounded-lg border-2 border-[#F5991F]/30 shadow-md shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-[#0A1E3E]">Sua Guia</span>
          <Sparkles className="h-3.5 w-3.5 text-[#F5991F]" />
        </div>
        <h3 className="text-base font-bold text-[#0A1E3E] mb-1">Hora de se conhecer melhor!</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Agora vamos descobrir juntos o seu perfil comportamental e suas compet\u00eancias. 
          Responda com sinceridade \u2014 n\u00e3o existem respostas certas ou erradas. Esse \u00e9 um momento s\u00f3 seu!
        </p>
      </div>
    </div>
  );
}

// ============================================================
// TIPOS
// ============================================================

type DiscDimensao = "D" | "I" | "S" | "C";

interface DiscOpcao {
  id: string;
  dimensao: DiscDimensao;
  texto: string;
}

interface DiscBloco {
  index: number;
  instrucao: string;
  opcoes: DiscOpcao[];
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

interface DiscRespostaBloco {
  blocoIndex: number;
  maisId: string;
  menosId: string;
  maisDimensao: DiscDimensao;
  menosDimensao: DiscDimensao;
}

// ============================================================
// SUB-ETAPAS DO ASSESSMENT
// ============================================================

type SubEtapa = "disc" | "autopercepção" | "relatorio";

// ============================================================
// DESCRIÇÕES DAS COMPETÊNCIAS (o que é + impacto no dia a dia)
// ============================================================

const COMPETENCIA_DESCRICOES: Record<string, { oQueE: string; impacto: string }> = {
  // === BASIC ===
  "Gestão do Tempo": {
    oQueE: "Capacidade de organizar, priorizar e utilizar o tempo de forma eficiente para cumprir tarefas e metas.",
    impacto: "No dia a dia, quem domina essa competência consegue entregar mais com menos estresse, cumpre prazos com consistência e equilibra melhor vida pessoal e profissional."
  },
  "Atenção": {
    oQueE: "Habilidade de manter o foco em tarefas e informações relevantes, evitando distrações e erros por descuido.",
    impacto: "Profissionais atentos cometem menos erros, captam detalhes importantes em reuniões e documentos, e são mais confiáveis na execução de tarefas críticas."
  },
  "Autopercepção": {
    oQueE: "Consciência sobre seus próprios sentimentos, comportamentos, pontos fortes e limitações.",
    impacto: "Quem se conhece bem toma decisões mais alinhadas com seus valores, reconhece quando precisa de ajuda e evolui mais rápido no desenvolvimento pessoal e profissional."
  },
  "Disciplina": {
    oQueE: "Capacidade de manter rotinas, seguir planos e persistir em tarefas mesmo quando a motivação diminui.",
    impacto: "A disciplina é o que transforma intenções em resultados. No trabalho, garante consistência na entrega, confiabilidade e progresso contínuo em projetos de longo prazo."
  },
  "Empatia": {
    oQueE: "Habilidade de compreender e se colocar no lugar do outro, reconhecendo sentimentos e perspectivas diferentes das suas.",
    impacto: "Pessoas empáticas constroem relações mais fortes, resolvem conflitos com mais facilidade e criam ambientes de trabalho mais colaborativos e acolhedores."
  },
  "Escuta Ativa": {
    oQueE: "Prática de ouvir com atenção plena, buscando compreender a mensagem completa antes de responder.",
    impacto: "A escuta ativa evita mal-entendidos, fortalece relacionamentos profissionais e permite tomar decisões mais informadas com base no que os outros realmente comunicam."
  },
  "Memória": {
    oQueE: "Capacidade de reter, organizar e recuperar informações relevantes quando necessário.",
    impacto: "Uma boa memória permite lembrar compromissos, detalhes de projetos e aprendizados anteriores, aumentando a eficiência e a credibilidade profissional."
  },
  "Raciocínio Lógico e Espacial": {
    oQueE: "Habilidade de analisar problemas de forma estruturada, identificar padrões e pensar em soluções de maneira sequencial e visual.",
    impacto: "Essencial para resolver problemas complexos, planejar estratégias e tomar decisões baseadas em análise, não apenas em intuição."
  },
  // === ESSENTIAL ===
  "Adaptabilidade": {
    oQueE: "Capacidade de se ajustar a novas situações, mudanças de planos e ambientes diferentes com flexibilidade.",
    impacto: "Em um mundo em constante mudança, profissionais adaptáveis lidam melhor com imprevistos, aprendem novas ferramentas rapidamente e se mantêm produtivos em cenários de incerteza."
  },
  "Comunicação Assertiva": {
    oQueE: "Habilidade de expressar ideias, opiniões e necessidades de forma clara, direta e respeitosa.",
    impacto: "A comunicação assertiva evita conflitos desnecessários, garante que suas contribuições sejam ouvidas e fortalece sua presença em reuniões e negociações."
  },
  "Inteligência Emocional": {
    oQueE: "Capacidade de reconhecer, compreender e gerenciar suas próprias emoções e as dos outros.",
    impacto: "Profissionais com alta inteligência emocional mantêm a calma sob pressão, constroem relações mais saudáveis e tomam decisões mais equilibradas."
  },
  "Leitura de Cenário": {
    oQueE: "Habilidade de observar e interpretar o contexto ao redor — pessoas, dinâmicas e situações — para agir de forma adequada.",
    impacto: "Quem lê bem o cenário sabe quando falar e quando ouvir, identifica oportunidades antes dos outros e evita decisões precipitadas."
  },
  "Planejamento e Organização": {
    oQueE: "Capacidade de definir objetivos, criar planos de ação e organizar recursos para alcançar resultados.",
    impacto: "Pessoas organizadas entregam projetos no prazo, gerenciam múltiplas demandas sem perder qualidade e transmitem confiança à equipe e liderança."
  },
  "Proatividade": {
    oQueE: "Atitude de antecipar necessidades e agir por iniciativa própria, sem esperar que alguém peça.",
    impacto: "Profissionais proativos se destacam por resolver problemas antes que se agravem, propor melhorias e assumir responsabilidades que geram impacto positivo."
  },
  "Resiliência": {
    oQueE: "Capacidade de enfrentar adversidades, superar frustrações e se recuperar de situações difíceis.",
    impacto: "A resiliência permite manter a motivação diante de fracassos, aprender com erros e seguir em frente com mais força e sabedoria."
  },
  // === MASTER ===
  "Gestão de Conflitos": {
    oQueE: "Habilidade de identificar, mediar e resolver divergências entre pessoas ou grupos de forma construtiva.",
    impacto: "Líderes que gerenciam conflitos bem mantêm equipes coesas, evitam desgastes desnecessários e transformam desacordos em oportunidades de crescimento."
  },
  "Gestão de Equipes": {
    oQueE: "Capacidade de coordenar, motivar e desenvolver pessoas para alcançar objetivos coletivos.",
    impacto: "Uma boa gestão de equipe resulta em maior produtividade, engajamento dos membros e um ambiente onde todos contribuem com seu melhor."
  },
  "Accountability": {
    oQueE: "Postura de assumir responsabilidade pelos seus resultados, decisões e compromissos — tanto nos acertos quanto nos erros.",
    impacto: "Profissionais com accountability geram confiança, cumprem o que prometem e inspiram os outros a fazerem o mesmo, elevando o padrão de toda a equipe."
  },
  "Foco em Resultados": {
    oQueE: "Orientação para definir metas claras e trabalhar com determinação para alcançá-las.",
    impacto: "Quem tem foco em resultados prioriza o que realmente importa, mede seu progresso e não se perde em atividades que não geram valor."
  },
  "Influência": {
    oQueE: "Capacidade de persuadir e inspirar pessoas a adotarem ideias, comportamentos ou decisões.",
    impacto: "A influência é essencial para liderar sem autoridade formal, vender ideias em reuniões e mobilizar pessoas em torno de um objetivo comum."
  },
  "Negociação": {
    oQueE: "Habilidade de conduzir conversas e acordos buscando soluções que atendam aos interesses de todas as partes.",
    impacto: "Bons negociadores conseguem melhores condições em contratos, resolvem impasses com elegância e constroem parcerias duradouras."
  },
  "Presença Executiva": {
    oQueE: "Combinação de postura, comunicação e confiança que transmite credibilidade e autoridade natural.",
    impacto: "Profissionais com presença executiva são ouvidos com mais atenção, inspiram confiança em stakeholders e são lembrados para oportunidades de liderança."
  },
  "Protagonismo": {
    oQueE: "Atitude de ser o agente principal da própria carreira e dos projetos, assumindo a liderança das situações.",
    impacto: "Protagonistas não esperam que as coisas aconteçam — fazem acontecer. São reconhecidos por sua iniciativa e capacidade de gerar mudanças positivas."
  },
  "Relacionamentos Conectivos": {
    oQueE: "Habilidade de construir e manter redes de relacionamento genuínas e mutuamente benéficas.",
    impacto: "Relacionamentos fortes abrem portas para oportunidades, parcerias e apoio mútuo, sendo um dos maiores ativos de qualquer carreira."
  },
  "Responsabilidade Social": {
    oQueE: "Consciência e compromisso com o impacto das suas ações na comunidade e na sociedade.",
    impacto: "Profissionais socialmente responsáveis tomam decisões mais éticas, inspiram confiança e contribuem para organizações com propósito e reputação positiva."
  },
  "Tomada de Decisão": {
    oQueE: "Capacidade de avaliar opções, considerar riscos e escolher o melhor caminho de ação com agilidade.",
    impacto: "Decisões bem tomadas economizam tempo e recursos, evitam problemas maiores e demonstram maturidade profissional para assumir cargos de liderança."
  },
  "Visão Estratégica": {
    oQueE: "Habilidade de enxergar o panorama geral, conectar pontos e planejar ações de longo prazo alinhadas com objetivos maiores.",
    impacto: "Profissionais com visão estratégica antecipam tendências, tomam decisões que beneficiam o futuro e são valorizados por sua capacidade de pensar além do operacional."
  },
  // === VISÃO DE FUTURO ===
  "Arquitetura de Mudanças": {
    oQueE: "Capacidade de planejar e conduzir processos de transformação organizacional de forma estruturada.",
    impacto: "Quem domina essa competência lidera transições com menos resistência, engaja equipes na mudança e garante que inovações sejam implementadas com sucesso."
  },
  "Decisões Ágeis": {
    oQueE: "Habilidade de tomar decisões rápidas e eficazes em ambientes de alta velocidade e incerteza.",
    impacto: "Em mercados dinâmicos, a agilidade decisória é um diferencial competitivo — permite aproveitar oportunidades antes da concorrência e corrigir rotas rapidamente."
  },
  "Estratégia de Longo Alcance": {
    oQueE: "Capacidade de pensar e planejar considerando horizontes de tempo amplos e impactos de grande escala.",
    impacto: "Profissionais com essa visão constroem legados, fazem investimentos inteligentes de tempo e energia, e posicionam suas organizações para o sucesso sustentável."
  },
  "Mentalidade Sistêmica": {
    oQueE: "Habilidade de compreender como diferentes partes de um sistema se conectam e se influenciam mutuamente.",
    impacto: "Pensar sistemicamente permite identificar causas raízes de problemas, prever efeitos colaterais de decisões e criar soluções mais completas e duradouras."
  },
  "Mindset Visionário": {
    oQueE: "Capacidade de imaginar possibilidades futuras e inspirar outros a trabalhar em direção a essa visão.",
    impacto: "Visionários criam movimentos, inspiram inovação e dão direção clara para equipes, mesmo em cenários de incerteza e complexidade."
  },
  "Radar de Cenários": {
    oQueE: "Habilidade de monitorar tendências, sinais fracos e mudanças no ambiente externo para antecipar oportunidades e ameaças.",
    impacto: "Quem tem esse radar identifica mudanças de mercado antes dos outros, prepara-se para crises e posiciona-se estrategicamente para o futuro."
  },
  "Adaptabilidade Dinâmica": {
    oQueE: "Capacidade avançada de se reinventar continuamente, abraçando mudanças como oportunidades de crescimento.",
    impacto: "Vai além da adaptabilidade básica — profissionais com essa competência prosperam em ambientes de transformação constante e lideram outros através da mudança."
  },
  "Gestão da Comunicação": {
    oQueE: "Habilidade de planejar, executar e otimizar a comunicação em diferentes canais e para diferentes públicos.",
    impacto: "Uma comunicação bem gerida alinha equipes, evita ruídos, fortalece a cultura organizacional e garante que mensagens estratégicas cheguem com clareza."
  },
  "Inteligência Emocional Tática": {
    oQueE: "Uso estratégico da inteligência emocional para influenciar situações, negociações e dinâmicas de grupo.",
    impacto: "Vai além de gerenciar emoções — permite ler ambientes complexos, calibrar abordagens e usar a empatia como ferramenta estratégica de liderança."
  },
};

// ============================================================
// COMPONENTE: TESTE DISC (Escolha Forçada / Ipsativo)
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

  const blocos: DiscBloco[] = perguntasData?.blocos || [];

  // Estado: para cada bloco, qual opção é "mais" e qual é "menos"
  const [respostas, setRespostas] = useState<Record<number, { maisId: string | null; menosId: string | null }>>({});
  const [blocoAtual, setBlocoAtual] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  const BLOCOS_POR_PAGINA = 4;
  const totalPaginas = Math.ceil(blocos.length / BLOCOS_POR_PAGINA);
  const paginaAtual = Math.floor(blocoAtual / BLOCOS_POR_PAGINA);

  const blocosPagina = useMemo(() => {
    const start = paginaAtual * BLOCOS_POR_PAGINA;
    return blocos.slice(start, start + BLOCOS_POR_PAGINA);
  }, [blocos, paginaAtual]);

  const totalRespondidos = Object.values(respostas).filter(r => r.maisId && r.menosId).length;
  const progresso = blocos.length > 0 ? Math.round((totalRespondidos / blocos.length) * 100) : 0;

  const paginaCompleta = blocosPagina.every((b) => {
    const r = respostas[b.index];
    return r && r.maisId && r.menosId;
  });
  const todosRespondidos = totalRespondidos === blocos.length;

  const handleSelecionar = (blocoIndex: number, tipo: "mais" | "menos", opcaoId: string) => {
    setRespostas((prev) => {
      const atual = prev[blocoIndex] || { maisId: null, menosId: null };
      // Se já está selecionado, desmarcar
      if (tipo === "mais" && atual.maisId === opcaoId) {
        return { ...prev, [blocoIndex]: { ...atual, maisId: null } };
      }
      if (tipo === "menos" && atual.menosId === opcaoId) {
        return { ...prev, [blocoIndex]: { ...atual, menosId: null } };
      }
      // Não pode selecionar a mesma opção como "mais" e "menos"
      if (tipo === "mais" && atual.menosId === opcaoId) {
        return { ...prev, [blocoIndex]: { ...atual, maisId: opcaoId, menosId: null } };
      }
      if (tipo === "menos" && atual.maisId === opcaoId) {
        return { ...prev, [blocoIndex]: { ...atual, menosId: opcaoId, maisId: null } };
      }
      return {
        ...prev,
        [blocoIndex]: {
          ...atual,
          [tipo === "mais" ? "maisId" : "menosId"]: opcaoId,
        },
      };
    });
  };

  const handleFinalizar = async () => {
    if (!todosRespondidos) {
      toast.error("Responda todos os blocos antes de finalizar.");
      return;
    }

    try {
      // Montar array de respostas
      const respostasArray: DiscRespostaBloco[] = blocos.map((bloco) => {
        const r = respostas[bloco.index]!;
        const maisOpcao = bloco.opcoes.find(o => o.id === r.maisId)!;
        const menosOpcao = bloco.opcoes.find(o => o.id === r.menosId)!;
        return {
          blocoIndex: bloco.index,
          maisId: r.maisId!,
          menosId: r.menosId!,
          maisDimensao: maisOpcao.dimensao,
          menosDimensao: menosOpcao.dimensao,
        };
      });

      const resultado = await salvarMutation.mutateAsync({
        alunoId,
        respostas: respostasArray,
      });

      toast.success("Teste DISC concluído com sucesso!");
      onComplete(resultado.scores, resultado.perfilPredominante as DiscDimensao, resultado.perfilSecundario as DiscDimensao);
    } catch {
      toast.error("Erro ao salvar respostas. Tente novamente.");
    }
  };

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
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
          Em cada bloco, escolha a afirmação que <strong>MAIS</strong> descreve você e a que <strong>MENOS</strong> descreve você. Não existem respostas certas ou erradas.
        </p>
      </div>

      {/* Legenda */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <ChevronRight className="h-3 w-3 text-white" />
            </div>
            <span className="text-gray-600">= Mais parecido comigo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-red-400 flex items-center justify-center">
              <ChevronLeft className="h-3 w-3 text-white" />
            </div>
            <span className="text-gray-600">= Menos parecido comigo</span>
          </div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>{totalRespondidos} de {blocos.length} blocos respondidos</span>
          <span>{progresso}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#0A1E3E] to-[#F5991F] rounded-full transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {/* Página indicador */}
      <div className="max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#0A1E3E]/20 bg-[#0A1E3E]/5 text-sm font-medium text-[#0A1E3E]">
          <CircleDot className="h-3.5 w-3.5" />
          Página {paginaAtual + 1} de {totalPaginas}
        </div>
      </div>

      {/* Blocos de escolha forçada */}
      <div className="max-w-2xl mx-auto space-y-6">
        {blocosPagina.map((bloco) => {
          const resp = respostas[bloco.index] || { maisId: null, menosId: null };
          const blocoCompleto = resp.maisId && resp.menosId;
          return (
            <Card key={bloco.index} className={`transition-all duration-300 ${blocoCompleto ? "border-green-300 bg-green-50/30" : ""}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[#0A1E3E] text-white text-xs flex items-center justify-center font-bold">
                    {bloco.index + 1}
                  </span>
                  {bloco.instrucao}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {bloco.opcoes.map((opcao) => {
                    const isMais = resp.maisId === opcao.id;
                    const isMenos = resp.menosId === opcao.id;
                    return (
                      <div
                        key={opcao.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                          isMais
                            ? "border-green-400 bg-green-50 shadow-sm"
                            : isMenos
                            ? "border-red-300 bg-red-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        {/* Botão MAIS */}
                        <button
                          onClick={() => handleSelecionar(bloco.index, "mais", opcao.id)}
                          className={`shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-200 text-xs font-bold ${
                            isMais
                              ? "bg-green-500 border-green-500 text-white shadow-md"
                              : "border-green-300 text-green-400 hover:bg-green-50 hover:border-green-400"
                          }`}
                          title="Mais parecido comigo"
                        >
                          +
                        </button>

                        {/* Texto da afirmação */}
                        <span className={`flex-1 text-sm ${
                          isMais ? "text-green-800 font-medium" : isMenos ? "text-red-700 font-medium" : "text-gray-700"
                        }`}>
                          {opcao.texto}
                        </span>

                        {/* Botão MENOS */}
                        <button
                          onClick={() => handleSelecionar(bloco.index, "menos", opcao.id)}
                          className={`shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-200 text-xs font-bold ${
                            isMenos
                              ? "bg-red-400 border-red-400 text-white shadow-md"
                              : "border-red-200 text-red-300 hover:bg-red-50 hover:border-red-300"
                          }`}
                          title="Menos parecido comigo"
                        >
                          −
                        </button>
                      </div>
                    );
                  })}
                </div>
                {blocoCompleto && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Bloco respondido
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Navegação */}
      <div className="max-w-2xl mx-auto flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => { setBlocoAtual((b) => Math.max(0, b - BLOCOS_POR_PAGINA)); scrollToTop(); }}
          disabled={paginaAtual === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>

        {paginaAtual < totalPaginas - 1 ? (
          <Button
            onClick={() => {
              if (!paginaCompleta) {
                toast.warning("Responda todos os blocos desta página antes de avançar. Em cada bloco, selecione MAIS (+) e MENOS (−).");
                return;
              }
              setBlocoAtual((b) => b + BLOCOS_POR_PAGINA);
              scrollToTop();
            }}
            className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white gap-2"
          >
            Próximo <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleFinalizar}
            disabled={!todosRespondidos || salvarMutation.isPending}
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

  // Filtrar trilhas de desenvolvimento (excluir Jornada Personalizada, Alinhamento Inicial, etc.)
  const TRILHAS_PERMITIDAS = ["Basic", "Essential", "Master", "Visão de Futuro"];

  const trilhasOrdenadas = useMemo(() => {
    if (!trilhasData) return [];
    return [...trilhasData]
      .filter((t) => TRILHAS_PERMITIDAS.includes(t.name))
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }, [trilhasData]);

  const competenciasPorTrilha = useMemo(() => {
    if (!competenciasData || !trilhasOrdenadas.length) return [];
    return trilhasOrdenadas.map((trilha) => ({
      trilha,
      competencias: competenciasData.filter((c: any) => c.trilhaId === trilha.id),
    }));
  }, [competenciasData, trilhasOrdenadas]);

  const trilhaAtualData = competenciasPorTrilha[trilhaAtual];
  // Contar apenas competências das trilhas filtradas (Basic, Essential, Master)
  const totalCompetencias = competenciasPorTrilha.reduce((acc, item) => acc + item.competencias.length, 0);
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

          {trilhaAtualData.competencias.map((comp: any) => {
            const descInfo = COMPETENCIA_DESCRICOES[comp.nome];
            return (
            <Card key={comp.id} className={`transition-all duration-300 ${notas[comp.id] ? "border-[#0A1E3E]/20" : ""}`}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{comp.nome}</h4>
                  </div>
                  {notas[comp.id] && (
                    <Badge className={`${notaCores[notas[comp.id]]} text-white border-0 text-xs`}>
                      {notas[comp.id]}/5
                    </Badge>
                  )}
                </div>

                {/* Explicação da competência */}
                {descInfo && (
                  <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex items-start gap-2 mb-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-[#0A1E3E] mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-700 leading-relaxed">
                        <strong className="text-[#0A1E3E]">O que é:</strong> {descInfo.oQueE}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Target className="h-3.5 w-3.5 text-[#F5991F] mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-600 leading-relaxed">
                        <strong className="text-[#F5991F]">Impacto no dia a dia:</strong> {descInfo.impacto}
                      </p>
                    </div>
                  </div>
                )}

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
          );
          })}
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

  // Agrupar autopercepções por trilha (todas as trilhas que o aluno tem autopercepção)
  const TRILHAS_RELATORIO_BASE = ["Basic", "Essential", "Master"];
  const autopercepçãoPorTrilha = useMemo(() => {
    if (!autopercepcoesData || !competenciasData || !trilhasData) return [];
    // Incluir trilhas base + qualquer trilha que o aluno tenha autopercepção
    const trilhasComAutopercepção = new Set(autopercepcoesData.map((a: any) => a.trilhaId));
    const trilhasOrdenadas = [...trilhasData]
      .filter((t) => TRILHAS_RELATORIO_BASE.includes(t.name) || trilhasComAutopercepção.has(t.id))
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
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
      </div>

      {/* Texto introdutório incentivador */}
      <div className="max-w-3xl mx-auto bg-gradient-to-br from-[#0A1E3E]/5 to-[#F5991F]/5 border border-[#F5991F]/20 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-3">
          <Lightbulb className="h-6 w-6 text-[#F5991F] shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-[#0A1E3E] text-base">Sobre este relatório</h3>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed mb-3">
          Este teste reflete o seu nível de <strong>sinceridade nas respostas</strong> e de <strong>autoconhecimento</strong>. 
          Quanto mais honesto(a) você foi ao responder, mais preciso será o retrato das suas competências e do seu perfil comportamental.
        </p>
        <p className="text-gray-700 leading-relaxed mb-3">
          Esperamos que este resultado te leve a uma <strong>autorreflexão genuína</strong>. Analise com calma seus pontos fortes 
          e as áreas que merecem atenção. Reconhecer onde você está hoje é o primeiro passo para chegar onde deseja estar amanhã.
        </p>
        <p className="text-gray-700 leading-relaxed">
          No próximo passo, você poderá <strong>agendar uma sessão com sua mentora</strong>. Juntos, vocês irão discutir o seu perfil, 
          identificar oportunidades e traçar uma <strong>trilha de desenvolvimento personalizada</strong> que potencialize sua carreira 
          e o seu desempenho. Chegue preparado(a) — reflita sobre os resultados abaixo e leve suas dúvidas e percepções para essa conversa.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-[#0A1E3E]/70">
          <Heart className="h-4 w-4 text-[#F5991F]" />
          <span className="italic">"O autoconhecimento é a base de toda evolução profissional."</span>
        </div>
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
  readOnly = false,
}: {
  alunoId: number;
  onComplete: () => void;
  readOnly?: boolean;
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
      {/* Banner da Mentora Guia */}
      <MentoraGuiaBannerAssessment />

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
