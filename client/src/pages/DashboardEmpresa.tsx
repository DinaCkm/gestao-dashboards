import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Legend
} from "recharts";
import { Users, TrendingUp, Award, Target, Calendar, BookOpen, Zap, ArrowLeft, HelpCircle, GraduationCap, PartyPopper, Info, ChevronDown, ChevronUp, User, Clock, CheckCircle2, XCircle, Snowflake } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useParams } from "wouter";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ['#1E3A5F', '#F5A623', '#2E7D32', '#D32F2F', '#7B1FA2'];
const CLASSIFICATION_COLORS: Record<string, string> = {
  'Excelência': '#2E7D32',
  'Avançado': '#1976D2',
  'Intermediário': '#F5A623',
  'Básico': '#FF9800',
  'Inicial': '#D32F2F'
};

function AlunoExpandido({ aluno }: { aluno: any }) {
  const [expanded, setExpanded] = useState(false);
  const perf = aluno.consolidado?.ind7_engajamentoFinal || aluno.performanceGeral || aluno.notaFinal * 10;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Row principal */}
      <div 
        className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-sm font-medium text-muted-foreground w-8 flex-shrink-0">
            {/* ranking será passado via index */}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{aluno.nomeAluno}</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />{aluno.turmaNome || aluno.turma || 'N/A'}
              </Badge>
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                <Target className="h-3 w-3 mr-1" />{aluno.trilhaNome || 'N/A'}
              </Badge>
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                <Clock className="h-3 w-3 mr-1" />{aluno.cicloAtual || 'N/A'}
              </Badge>
              {aluno.mentorNome && aluno.mentorNome !== 'Não definido' && (
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                  <User className="h-3 w-3 mr-1" />{aluno.mentorNome}
                </Badge>
              )}
              {aluno.temPdiCongelado && (
                <Badge variant="outline" className="text-xs text-cyan-700 border-cyan-400 bg-cyan-50">
                  <Snowflake className="h-3 w-3 mr-1" />PDI Congelado
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className={`font-bold text-lg ${
              perf >= 70 ? 'text-green-600' : perf >= 50 ? 'text-yellow-600' : 'text-red-500'
            }`}>
              {perf.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">{aluno.classificacao}</p>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="border-t bg-muted/30 p-4 space-y-4">
          {/* Aviso de PDI congelado */}
          {aluno.temPdiCongelado && aluno.pdisCongelados?.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Snowflake className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Este aluno possui trilha(s) congelada(s)</span>
              </div>
              <p className="text-xs text-blue-700 mb-2">
                Os indicadores de performance <strong>não consideram</strong> trilhas congeladas. Se a performance está zerada ou baixa, pode ser por este motivo.
              </p>
              {aluno.pdisCongelados.map((pdi: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-blue-700 bg-white/60 rounded px-2 py-1 mt-1">
                  <Snowflake className="h-3 w-3 flex-shrink-0" />
                  <span className="font-medium">{pdi.trilhaNome}</span>
                  {pdi.motivoCongelamento && <span className="italic">— {pdi.motivoCongelamento}</span>}
                </div>
              ))}
            </div>
          )}

          {/* 6 Indicadores em mini-cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <div className="p-2 rounded bg-background border text-center">
              <p className="text-xs text-muted-foreground">1. Webinars</p>
              <p className="text-sm font-bold">{(aluno.consolidado?.ind1_webinars ?? aluno.participacaoMentorias ?? 0).toFixed(0)}%</p>
            </div>
            <div className="p-2 rounded bg-background border text-center">
              <p className="text-xs text-muted-foreground">2. Avaliações</p>
              <p className="text-sm font-bold">{(aluno.consolidado?.ind2_avaliacoes ?? aluno.atividadesPraticas ?? 0).toFixed(0)}%</p>
            </div>
            <div className="p-2 rounded bg-background border text-center">
              <p className="text-xs text-muted-foreground">3. Competências</p>
              <p className="text-sm font-bold">{(aluno.consolidado?.ind3_competencias ?? aluno.engajamento ?? 0).toFixed(0)}%</p>
            </div>
            <div className="p-2 rounded bg-background border text-center">
              <p className="text-xs text-muted-foreground">4. Tarefas</p>
              <p className="text-sm font-bold">{(aluno.consolidado?.ind4_tarefas ?? aluno.performanceCompetencias ?? 0).toFixed(0)}%</p>
            </div>
            <div className="p-2 rounded bg-background border text-center">
              <p className="text-xs text-muted-foreground">5. Engajamento</p>
              <p className="text-sm font-bold">{(aluno.consolidado?.ind5_engajamento ?? aluno.performanceAprendizado ?? 0).toFixed(0)}%</p>
            </div>
            <div className="p-2 rounded bg-background border text-center">
              <p className="text-xs text-muted-foreground">6. Case (Bônus)</p>
              <p className="text-sm font-bold">{(aluno.consolidado?.ind6_aplicabilidade ?? 0).toFixed(0)}%</p>
            </div>
          </div>

          {/* Ciclos */}
          {(aluno.ciclosFinalizados?.length > 0 || aluno.ciclosEmAndamento?.length > 0) && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" /> Ciclos
              </h4>
              <div className="space-y-2">
                {[...(aluno.ciclosFinalizados || []), ...(aluno.ciclosEmAndamento || [])].map((ciclo: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded bg-background border">
                    <div className={`w-2 h-2 rounded-full ${ciclo.status === 'finalizado' ? 'bg-green-500' : ciclo.status === 'em_andamento' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{ciclo.nomeCiclo}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ciclo.dataInicio).toLocaleDateString("pt-BR")} — {new Date(ciclo.dataFim).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{ciclo.percentualConclusao?.toFixed(0) || 0}%</p>
                      <Badge variant="outline" className={`text-xs ${ciclo.status === 'finalizado' ? 'text-green-600 border-green-300' : 'text-blue-600 border-blue-300'}`}>
                        {ciclo.status === 'finalizado' ? 'Finalizado' : ciclo.status === 'em_andamento' ? 'Em Andamento' : ciclo.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competências */}
          {aluno.competencias && aluno.competencias.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Competências ({aluno.competencias.length})
              </h4>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {aluno.competencias.map((comp: any, idx: number) => {
                  const aprovado = comp.nota !== null && comp.nota >= comp.meta;
                  return (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded bg-background border">
                      <div className="flex-shrink-0">
                        {comp.status === 'concluida' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                          comp.status === 'em_progresso' ? <Clock className="h-4 w-4 text-blue-500" /> :
                          <Target className="h-4 w-4 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{comp.nome}</p>
                        <p className="text-xs text-muted-foreground">{comp.trilha}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${comp.nota !== null ? (aprovado ? 'text-green-600' : 'text-yellow-600') : 'text-muted-foreground'}`}>
                          {comp.nota !== null ? comp.nota.toFixed(1) : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">Meta: {comp.meta}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${
                        comp.status === 'concluida' ? 'text-green-600 border-green-300' :
                        comp.status === 'em_progresso' ? 'text-blue-600 border-blue-300' :
                        'text-gray-500 border-gray-300'
                      }`}>
                        {comp.status === 'concluida' ? 'Concluída' : comp.status === 'em_progresso' ? 'Em Progresso' : 'Pendente'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Link para dashboard individual */}
          {aluno.alunoDbId > 0 && (
            <div className="pt-2 border-t">
              <Link href={`/dashboard/aluno/${aluno.alunoDbId}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Ver Dashboard Completo do Aluno
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardEmpresa() {
  const params = useParams<{ codigo: string }>();
  const empresaCodigo = params.codigo || '';
  
  const stableEmpresaCodigo = useMemo(() => empresaCodigo, [empresaCodigo]);
  
  const { data: empresas } = trpc.indicadores.empresas.useQuery();
  const empresaNome = empresas?.find(e => e.codigo === empresaCodigo)?.nome || empresaCodigo;
  
  const { data, isLoading, error } = trpc.indicadores.porEmpresa.useQuery(
    { empresa: empresaNome },
    { enabled: !!empresaNome }
  );

  const [filtroTrilha, setFiltroTrilha] = useState<string>("todas");
  const [filtroCiclo, setFiltroCiclo] = useState<string>("todos");
  const [filtroClassificacao, setFiltroClassificacao] = useState<string>("todas");

  // IMPORTANTE: Todos os hooks devem ser chamados ANTES de qualquer early return
  // para evitar o erro React #310 ("Rendered more hooks than during the previous render")
  const alunos = data?.alunos || [];

  const trilhasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    alunos.forEach((a: any) => { if (a.trilhaNome && a.trilhaNome !== 'Não definida') set.add(a.trilhaNome); });
    return Array.from(set).sort();
  }, [alunos]);

  const classificacoesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    alunos.forEach((a: any) => { if (a.classificacao) set.add(a.classificacao); });
    return Array.from(set);
  }, [alunos]);

  const alunosFiltrados = useMemo(() => {
    return alunos.filter((a: any) => {
      if (filtroTrilha !== "todas" && a.trilhaNome !== filtroTrilha) return false;
      if (filtroClassificacao !== "todas" && a.classificacao !== filtroClassificacao) return false;
      return true;
    });
  }, [alunos, filtroTrilha, filtroClassificacao]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/visao-geral">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard {empresaNome}</h1>
              <p className="text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                <CardContent><Skeleton className="h-8 w-16" /></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/visao-geral">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard {empresaNome}</h1>
              <p className="text-muted-foreground text-red-500">
                {error?.message || "Nenhum dado disponível para esta empresa."}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { visaoEmpresa, porTurma } = data;

  const melhorAluno = alunos.length > 0 
    ? alunos.reduce((best: any, current: any) => (current.notaFinal > best.notaFinal ? current : best), alunos[0])
    : null;
  const META_EXCELENCIA = 9.0;

  const radarData = [
    { indicador: 'Webinars', valor: visaoEmpresa.mediaInd1 || visaoEmpresa.mediaParticipacaoMentorias },
    { indicador: 'Avaliações', valor: visaoEmpresa.mediaInd2 || visaoEmpresa.mediaAtividadesPraticas },
    { indicador: 'Competências', valor: visaoEmpresa.mediaInd3 || visaoEmpresa.mediaEngajamento },
    { indicador: 'Tarefas', valor: visaoEmpresa.mediaInd4 || visaoEmpresa.mediaPerformanceCompetencias },
    { indicador: 'Engajamento', valor: visaoEmpresa.mediaInd5 || visaoEmpresa.mediaPerformanceAprendizado || 0 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/visao-geral">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard <span className="text-primary">{empresaNome}</span>
            </h1>
            <p className="text-muted-foreground">Performance detalhada da empresa</p>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoEmpresa.totalAlunos}</div>
              <p className="text-xs text-muted-foreground">Em {porTurma.length} turmas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engajamento Final</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(visaoEmpresa.mediaInd7 || visaoEmpresa.mediaPerformanceGeral || visaoEmpresa.mediaNotaFinal * 10 || 0).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Engajamento Final (Média dos 5 indicadores)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Melhor Nota</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {melhorAluno ? melhorAluno.notaFinal.toFixed(1) : '0.0'}
                </span>
                <span className="text-sm text-muted-foreground">/ {META_EXCELENCIA.toFixed(1)}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate" title={melhorAluno?.nomeAluno}>
                {melhorAluno ? melhorAluno.nomeAluno : 'Nenhum aluno'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Precisam Atenção</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {visaoEmpresa.alunosBasico + visaoEmpresa.alunosInicial}
              </div>
              <p className="text-xs text-muted-foreground">Básico ou Inicial</p>
            </CardContent>
          </Card>
        </div>

        {/* 7 Indicadores */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Ind. 1: Webinars / Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(visaoEmpresa.mediaInd1 || visaoEmpresa.mediaParticipacaoMentorias).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Presença</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Ind. 2: Avaliações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(visaoEmpresa.mediaInd2 || visaoEmpresa.mediaAtividadesPraticas).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Notas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" /> Ind. 3: Competências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(visaoEmpresa.mediaInd3 || visaoEmpresa.mediaEngajamento).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Concluídas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4" /> Ind. 4: Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(visaoEmpresa.mediaInd4 || visaoEmpresa.mediaPerformanceCompetencias).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Entregues</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Ind. 5: Engajamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(visaoEmpresa.mediaInd5 || visaoEmpresa.mediaPerformanceAprendizado || 0).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Evolução</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PartyPopper className="h-4 w-4" /> Ind. 6: Aplicabilidade (Bônus)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(visaoEmpresa.mediaInd6 || visaoEmpresa.mediaParticipacaoEventos).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Case de Sucesso</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" /> Ind. 7: Engajamento Final
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{(visaoEmpresa.mediaInd7 || visaoEmpresa.mediaPerformanceGeral || 0).toFixed(0)}%</div>
              <Progress value={visaoEmpresa.mediaInd7 || visaoEmpresa.mediaPerformanceGeral || 0} className="h-2 mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Média dos 5 indicadores</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Classificação</CardTitle>
              <CardDescription>Quantidade de alunos em cada estágio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={visaoEmpresa.distribuicaoClassificacao}
                      cx="50%" cy="50%" labelLine={false}
                      label={({ nome, percentual }) => `${nome}: ${percentual.toFixed(0)}%`}
                      outerRadius={100} fill="#8884d8" dataKey="quantidade" nameKey="nome"
                      isAnimationActive={false}
                    >
                      {visaoEmpresa.distribuicaoClassificacao.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CLASSIFICATION_COLORS[entry.nome] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Radar de Indicadores</CardTitle>
              <CardDescription>Média dos 5 indicadores da empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="indicador" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name={empresaNome} dataKey="valor" stroke="#1E3A5F" fill="#1E3A5F" fillOpacity={0.6} isAnimationActive={false} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance por Turma */}
        {porTurma.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Engajamento Final por Turma</CardTitle>
              <CardDescription>Engajamento Final médio e quantidade de alunos por turma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={porTurma.map((t: any) => ({
                      nome: t.identificador,
                      nota: ((t.mediaInd7 || t.mediaNotaFinal * 10) || 0).toFixed(1),
                      alunos: t.totalAlunos
                    }))} 
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis dataKey="nome" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="nota" fill="#F5A623" name="Engajamento Final" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Alunos com detalhes expandíveis */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Alunos da Empresa</CardTitle>
                <CardDescription>
                  {alunosFiltrados.length} alunos {alunosFiltrados.length !== alunos.length ? `(filtrados de ${alunos.length})` : ''} — clique para expandir detalhes
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {trilhasDisponiveis.length > 0 && (
                  <Select value={filtroTrilha} onValueChange={setFiltroTrilha}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue placeholder="Trilha" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as Trilhas</SelectItem>
                      {trilhasDisponiveis.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {classificacoesDisponiveis.length > 0 && (
                  <Select value={filtroClassificacao} onValueChange={setFiltroClassificacao}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue placeholder="Classificação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      {classificacoesDisponiveis.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <HelpCircle className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-primary" />
                        Como a Nota Final é Calculada?
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                      <p className="text-muted-foreground">
                        O Engajamento Final de cada aluno é calculado com base em <strong>5 indicadores</strong>, cada um com peso igual (o Ind. 6 é bônus):
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                          <span className="font-bold text-blue-600">1.</span>
                          <div>
                            <p className="font-medium">Webinars / Eventos</p>
                            <p className="text-xs text-muted-foreground">Presença em webinars e eventos coletivos</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                          <span className="font-bold text-green-600">2.</span>
                          <div>
                            <p className="font-medium">Avaliações</p>
                            <p className="text-xs text-muted-foreground">Notas das avaliações por competência</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                          <span className="font-bold text-yellow-600">3.</span>
                          <div>
                            <p className="font-medium">Competências</p>
                            <p className="text-xs text-muted-foreground">% de conteúdos concluídos por competência</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                          <span className="font-bold text-purple-600">4.</span>
                          <div>
                            <p className="font-medium">Tarefas</p>
                            <p className="text-xs text-muted-foreground">Entrega de atividades práticas (excluindo Assessment)</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                          <span className="font-bold text-red-600">5.</span>
                          <div>
                            <p className="font-medium">Engajamento</p>
                            <p className="text-xs text-muted-foreground">Média de presença, tarefas e nota de evolução (base 100)</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                          <span className="font-bold text-orange-600">6.</span>
                          <div>
                            <p className="font-medium">Aplicabilidade (Bônus)</p>
                            <p className="text-xs text-muted-foreground">Case de Sucesso (+10% no Engajamento) — não entra na média</p>
                          </div>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <p className="font-medium mb-2">Classificação por Estágio (Engajamento Final %):</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-600"></span><span><strong>Excelência:</strong> 90-100%</span></div>
                          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-600"></span><span><strong>Avançado:</strong> 70-89%</span></div>
                          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span><span><strong>Intermediário:</strong> 50-69%</span></div>
                          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span><span><strong>Básico:</strong> 30-49%</span></div>
                          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span><strong>Inicial:</strong> 0-29%</span></div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {alunosFiltrados.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum aluno encontrado com os filtros selecionados</p>
              ) : (
                alunosFiltrados.map((aluno: any, index: number) => (
                  <AlunoExpandido key={aluno.idUsuario} aluno={aluno} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
