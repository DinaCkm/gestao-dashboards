import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { 
  Building2, 
  Calendar, 
  Flag, 
  FileText, 
  ArrowRight, 
  Mail,
  Award,
  Target,
  Users,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Star,
  Sparkles,
  ChevronDown,
  GraduationCap,
  BarChart3,
  ClipboardCheck,
  Lightbulb,
  Rocket
} from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function BoasVindasGestor() {
  return (
    <DashboardLayout>
      <BoasVindasContent />
    </DashboardLayout>
  );
}

function BoasVindasContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showReuniao, setShowReuniao] = useState(false);
  const [reuniaoMsg, setReuniaoMsg] = useState("");
  const [enviando, setEnviando] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  const solicitarReuniao = trpc.system.notifyOwner.useMutation({
    onSuccess: () => {
      toast.success("Solicitação enviada com sucesso! Entraremos em contato em breve.");
      setShowReuniao(false);
      setReuniaoMsg("");
    },
    onError: () => {
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    }
  });

  const handleSolicitarReuniao = async () => {
    if (!reuniaoMsg.trim()) {
      toast.error("Por favor, escreva uma mensagem.");
      return;
    }
    setEnviando(true);
    try {
      await solicitarReuniao.mutateAsync({
        title: `Solicitação de Reunião - ${(user as any)?.name || 'Gestor'}`,
        content: `O gestor ${(user as any)?.name || 'N/A'} (${(user as any)?.email || 'N/A'}) solicitou uma reunião de apresentação do programa.\n\nMensagem:\n${reuniaoMsg}`
      });
    } finally {
      setEnviando(false);
    }
  };

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const userName = (user as any)?.name?.split(' ')[0] || 'Gestor';

  // Buscar estatísticas da equipe do gestor
  const { data: teamStats } = trpc.mentor.gestorTeamStats.useQuery(
    { programId: (user as any)?.programId || 0 },
    { enabled: !!user && user.role === 'manager' && !!(user as any)?.programId }
  );

  const stats = teamStats || { totalColaboradores: 0, totalMentorias: 0, totalCompetencias: 0, principaisCompetencias: [] };

  return (
    <div className="min-h-screen -m-6 p-6">
      {/* Hero Section - Fundo claro */}
      <section className="max-w-6xl mx-auto mb-12">
        <div className="flex flex-col lg:flex-row items-start gap-10">
          {/* Left content */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                 style={{ background: 'rgba(59, 191, 191, 0.12)', border: '1px solid rgba(59, 191, 191, 0.25)' }}>
              <Sparkles className="w-4 h-4" style={{ color: '#3BBFBF' }} />
              <span className="text-sm font-medium" style={{ color: '#3BBFBF' }}>Programa de Certificação</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4" style={{ color: '#2D2D2D' }}>
              Bem-vindo(a),{" "}
              <span style={{ color: '#3BBFBF' }}>{userName}</span>!
            </h1>
            
            <p className="text-lg md:text-xl mb-3 leading-relaxed max-w-xl" style={{ color: '#444' }}>
              Você agora faz parte do <strong style={{ color: '#5B3A7D' }}>Ecossistema de Desenvolvimento de Liderança</strong> da CKM Talents.
            </p>
            
            <p className="text-base mb-8 max-w-lg" style={{ color: '#777' }}>
              Acompanhe o progresso da sua equipe, visualize métricas de desenvolvimento e impulsione os resultados do programa de certificação.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                className="text-base font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                style={{ background: '#3BBFBF', color: '#fff' }}
                onClick={() => setLocation("/dashboard/gestor")}
              >
                <Building2 className="w-5 h-5 mr-2" />
                Acessar Minha Empresa
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="text-base font-semibold px-8 py-6 rounded-xl border-2 transition-all duration-300"
                style={{ borderColor: '#5B3A7D', color: '#5B3A7D' }}
                onClick={scrollToFeatures}
              >
                Conhecer o Programa
                <ChevronDown className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>

          {/* Right side - Stats cards */}
          <div className="flex-shrink-0 w-full lg:w-auto lg:min-w-[340px]">
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto lg:mx-0">
              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2" style={{ color: '#3BBFBF' }} />
                  <div className="text-2xl font-bold" style={{ color: '#5B3A7D' }}>{stats.totalColaboradores}</div>
                  <div className="text-xs text-muted-foreground">Colaboradores</div>
                </CardContent>
              </Card>
              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 text-center">
                  <Target className="w-8 h-8 mx-auto mb-2" style={{ color: '#3BBFBF' }} />
                  <div className="text-2xl font-bold" style={{ color: '#5B3A7D' }}>{stats.totalMentorias}</div>
                  <div className="text-xs text-muted-foreground">Total de Mentorias</div>
                </CardContent>
              </Card>
              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: '#3BBFBF' }} />
                  <div className="text-2xl font-bold" style={{ color: '#5B3A7D' }}>{stats.totalCompetencias}</div>
                  <div className="text-xs text-muted-foreground">Competências Desenvolvidas</div>
                </CardContent>
              </Card>
              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 text-center">
                  <Award className="w-8 h-8 mx-auto mb-2" style={{ color: '#3BBFBF' }} />
                  <div className="text-2xl font-bold" style={{ color: '#5B3A7D' }}>{stats.principaisCompetencias.length}</div>
                  <div className="text-xs text-muted-foreground">Top Competências</div>
                </CardContent>
              </Card>
            </div>

            {/* Principais Competências */}
            {stats.principaisCompetencias.length > 0 && (
              <Card className="mt-4 border shadow-sm max-w-sm mx-auto lg:mx-0">
                <CardContent className="p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#5B3A7D' }}>Principais Competências</div>
                  <div className="space-y-2">
                    {stats.principaisCompetencias.map((comp, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-foreground truncate mr-2">{comp.nome}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(59, 191, 191, 0.15)', color: '#3BBFBF' }}>
                          {comp.totalAlunos} aluno{comp.totalAlunos !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Program Overview Section */}
      <section ref={featuresRef} className="max-w-6xl mx-auto py-12">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: 'rgba(91, 58, 125, 0.08)' }}>
            <GraduationCap className="w-4 h-4" style={{ color: '#5B3A7D' }} />
            <span className="text-sm font-medium" style={{ color: '#5B3A7D' }}>O Programa</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#5B3A7D' }}>
            Programa de Certificação de Liderança
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Um programa completo que combina trilhas de desenvolvimento, 
            mentorias individuais e acompanhamento contínuo para transformar gestores em líderes de alta performance.
          </p>
        </div>

        {/* Program pillars */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="border shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
            <div className="h-1.5 w-full" style={{ background: '#3BBFBF' }} />
            <CardContent className="p-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                   style={{ background: 'rgba(59, 191, 191, 0.1)' }}>
                <BookOpen className="w-7 h-7" style={{ color: '#3BBFBF' }} />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#5B3A7D' }}>Trilhas de Desenvolvimento</h3>
              <p className="text-muted-foreground leading-relaxed">
                Cada colaborador percorre trilhas estruturadas com competências essenciais de liderança, 
                desde comunicação até gestão estratégica, com conteúdos práticos e aplicáveis.
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
            <div className="h-1.5 w-full" style={{ background: '#5B3A7D' }} />
            <CardContent className="p-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                   style={{ background: 'rgba(91, 58, 125, 0.1)' }}>
                <Users className="w-7 h-7" style={{ color: '#5B3A7D' }} />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#5B3A7D' }}>Mentoria Individual</h3>
              <p className="text-muted-foreground leading-relaxed">
                Cada participante conta com um mentor dedicado que acompanha seu progresso, 
                oferece feedback personalizado e orienta o desenvolvimento de competências específicas.
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
            <div className="h-1.5 w-full" style={{ background: '#3BBFBF' }} />
            <CardContent className="p-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                   style={{ background: 'rgba(59, 191, 191, 0.1)' }}>
                <ClipboardCheck className="w-7 h-7" style={{ color: '#3BBFBF' }} />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#5B3A7D' }}>Assessment DISC</h3>
              <p className="text-muted-foreground leading-relaxed">
                Avaliação comportamental DISC para identificar o perfil de liderança de cada participante, 
                permitindo um desenvolvimento direcionado e eficaz das competências mais relevantes.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* What you can see - Menu explanation */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: 'rgba(59, 191, 191, 0.08)' }}>
              <Lightbulb className="w-4 h-4" style={{ color: '#3BBFBF' }} />
              <span className="text-sm font-medium" style={{ color: '#3BBFBF' }}>Sua Visão Gerencial</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#5B3A7D' }}>
              O que você pode acompanhar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Como gestor, você tem acesso a dashboards exclusivos para acompanhar o desenvolvimento da sua equipe em tempo real.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Minha Empresa */}
            <div className="group relative overflow-hidden rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 cursor-pointer"
                 onClick={() => setLocation("/dashboard/gestor")}>
              <div className="absolute top-0 left-0 w-1 h-full transition-all duration-300" style={{ background: '#5B3A7D' }} />
              <div className="p-8 pl-10">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                       style={{ background: 'rgba(91, 58, 125, 0.1)' }}>
                    <Building2 className="w-7 h-7" style={{ color: '#5B3A7D' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold" style={{ color: '#5B3A7D' }}>Minha Empresa</h3>
                      <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Visão consolidada da sua empresa no programa. Veja quantos colaboradores estão participando, 
                      o progresso geral por turma e trilha, e identifique rapidamente quem precisa de atenção.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">Progresso por aluno</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">Turmas e trilhas</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">Visão consolidada</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sessões de Mentoria */}
            <div className="group relative overflow-hidden rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 cursor-pointer"
                 onClick={() => setLocation("/demonstrativo-mentorias")}>
              <div className="absolute top-0 left-0 w-1 h-full transition-all duration-300" style={{ background: '#3BBFBF' }} />
              <div className="p-8 pl-10">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                       style={{ background: 'rgba(59, 191, 191, 0.1)' }}>
                    <Calendar className="w-7 h-7" style={{ color: '#3BBFBF' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold" style={{ color: '#5B3A7D' }}>Sessões de Mentoria</h3>
                      <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Acompanhe o andamento das sessões de mentoria dos seus colaboradores. Veja quantas sessões foram realizadas, 
                      quem está em dia e quem está com sessões pendentes ou atrasadas.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">Sessões realizadas</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">Progresso individual</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">Alertas de atraso</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metas de Desenvolvimento */}
            <div className="group relative overflow-hidden rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 cursor-pointer"
                 onClick={() => setLocation("/metas-gestor")}>
              <div className="absolute top-0 left-0 w-1 h-full transition-all duration-300" style={{ background: '#5B3A7D' }} />
              <div className="p-8 pl-10">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                       style={{ background: 'rgba(91, 58, 125, 0.1)' }}>
                    <Flag className="w-7 h-7" style={{ color: '#5B3A7D' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold" style={{ color: '#5B3A7D' }}>Metas de Desenvolvimento</h3>
                      <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Visualize as metas de desenvolvimento definidas para cada colaborador. Acompanhe o cumprimento 
                      de tarefas, prazos e o nível de engajamento de cada participante com seu plano individual.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">Metas por aluno</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">Tarefas concluídas</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">Prazos e alertas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Relatórios */}
            <div className="group relative overflow-hidden rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 cursor-pointer"
                 onClick={() => setLocation("/relatorios")}>
              <div className="absolute top-0 left-0 w-1 h-full transition-all duration-300" style={{ background: '#3BBFBF' }} />
              <div className="p-8 pl-10">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                       style={{ background: 'rgba(59, 191, 191, 0.1)' }}>
                    <FileText className="w-7 h-7" style={{ color: '#3BBFBF' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold" style={{ color: '#5B3A7D' }}>Relatórios</h3>
                      <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Exporte relatórios detalhados sobre o desempenho da sua equipe no programa. 
                      Dados consolidados em formato Excel para apresentações e tomada de decisão estratégica.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">Exportar Excel</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">Dados consolidados</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">Filtros avançados</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <div className="rounded-3xl overflow-hidden" style={{ 
            background: 'linear-gradient(135deg, #5B3A7D 0%, #7B5A9D 100%)'
          }}>
            <div className="p-10 md:p-14">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Benefícios do Programa
                </h2>
                <p className="text-lg text-white/70 max-w-2xl mx-auto">
                  Investir no desenvolvimento de liderança gera resultados mensuráveis para toda a organização.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: Rocket, title: "Líderes Preparados", desc: "Gestores com competências práticas de liderança aplicáveis no dia a dia" },
                  { icon: BarChart3, title: "Resultados Mensuráveis", desc: "Métricas claras de progresso e desenvolvimento para cada participante" },
                  { icon: Star, title: "Certificação Reconhecida", desc: "Certificado de conclusão que valoriza o currículo dos participantes" },
                  { icon: Target, title: "Desenvolvimento Contínuo", desc: "PDI personalizado com metas e acompanhamento durante todo o ciclo" },
                ].map((item, i) => (
                  <div key={i} className="text-center p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(59, 191, 191, 0.2)' }}>
                      <item.icon className="w-6 h-6" style={{ color: '#3BBFBF' }} />
                    </div>
                    <h4 className="font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section - Request meeting */}
        <div className="mb-8">
          <Card className="border shadow-lg overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 opacity-5" style={{
                background: 'radial-gradient(circle at 80% 50%, #3BBFBF 0%, transparent 50%), radial-gradient(circle at 20% 50%, #5B3A7D 0%, transparent 50%)'
              }} />
              <CardContent className="relative p-10 md:p-14">
                <div className="flex flex-col lg:flex-row items-center gap-10">
                  <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: 'rgba(91, 58, 125, 0.08)' }}>
                      <Mail className="w-4 h-4" style={{ color: '#5B3A7D' }} />
                      <span className="text-sm font-medium" style={{ color: '#5B3A7D' }}>Fale Conosco</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4" style={{ color: '#5B3A7D' }}>
                      Tem dúvidas sobre o programa?
                    </h2>
                    <p className="text-lg text-muted-foreground mb-2 leading-relaxed">
                      Solicite uma reunião de apresentação com nossa equipe. Teremos prazer em explicar 
                      todos os detalhes do programa e como ele pode beneficiar sua equipe.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Nossa equipe entrará em contato em até 24 horas úteis.
                    </p>
                  </div>

                  <div className="flex-shrink-0 w-full lg:w-auto lg:min-w-[380px]">
                    {!showReuniao ? (
                      <div className="text-center">
                        <Button 
                          size="lg"
                          className="text-base font-semibold px-10 py-7 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                          style={{ background: '#3BBFBF', color: '#fff' }}
                          onClick={() => setShowReuniao(true)}
                        >
                          <Mail className="w-5 h-5 mr-2" />
                          Solicitar Reunião de Apresentação
                        </Button>
                        <p className="text-xs text-muted-foreground mt-3">
                          Sem compromisso. Resposta em até 24h.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 bg-muted/30 p-6 rounded-2xl border border-border/50">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Sua mensagem
                          </label>
                          <textarea
                            value={reuniaoMsg}
                            onChange={(e) => setReuniaoMsg(e.target.value)}
                            placeholder="Gostaria de saber mais sobre o programa, como inscrever novos colaboradores, tirar dúvidas sobre as trilhas..."
                            className="w-full min-h-[120px] p-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button 
                            className="flex-1 font-semibold py-6 rounded-xl"
                            style={{ background: '#3BBFBF', color: '#fff' }}
                            onClick={handleSolicitarReuniao}
                            disabled={enviando}
                          >
                            {enviando ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Mail className="w-4 h-4 mr-2" />
                                Enviar Solicitação
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline"
                            className="py-6 rounded-xl"
                            onClick={() => { setShowReuniao(false); setReuniaoMsg(""); }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Quick access footer */}
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">Acesso rápido</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" size="sm" className="rounded-full" style={{ borderColor: '#5B3A7D', color: '#5B3A7D' }} onClick={() => setLocation("/dashboard/gestor")}>
              <Building2 className="w-4 h-4 mr-2" /> Minha Empresa
            </Button>
            <Button variant="outline" size="sm" className="rounded-full" style={{ borderColor: '#3BBFBF', color: '#3BBFBF' }} onClick={() => setLocation("/demonstrativo-mentorias")}>
              <Calendar className="w-4 h-4 mr-2" /> Sessões de Mentoria
            </Button>
            <Button variant="outline" size="sm" className="rounded-full" style={{ borderColor: '#5B3A7D', color: '#5B3A7D' }} onClick={() => setLocation("/metas-gestor")}>
              <Flag className="w-4 h-4 mr-2" /> Metas
            </Button>
            <Button variant="outline" size="sm" className="rounded-full" style={{ borderColor: '#3BBFBF', color: '#3BBFBF' }} onClick={() => setLocation("/relatorios")}>
              <FileText className="w-4 h-4 mr-2" /> Relatórios
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
