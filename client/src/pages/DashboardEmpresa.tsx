import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Legend
} from "recharts";
import { Users, TrendingUp, Award, Target, Calendar, BookOpen, Zap, ArrowLeft, HelpCircle, GraduationCap, PartyPopper, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ['#1E3A5F', '#F5A623', '#2E7D32', '#D32F2F', '#7B1FA2'];
const CLASSIFICATION_COLORS: Record<string, string> = {
  'Excelência': '#2E7D32',
  'Avançado': '#1976D2',
  'Intermediário': '#F5A623',
  'Básico': '#FF9800',
  'Inicial': '#D32F2F'
};

export default function DashboardEmpresa() {
  const params = useParams<{ codigo: string }>();
  const empresaCodigo = params.codigo || '';
  
  // Memoize the codigo to prevent unnecessary re-renders
  const stableEmpresaCodigo = useMemo(() => empresaCodigo, [empresaCodigo]);
  
  const { data: empresas } = trpc.indicadores.empresas.useQuery();
  const empresaNome = empresas?.find(e => e.codigo === empresaCodigo)?.nome || empresaCodigo;
  
  const { data, isLoading, error } = trpc.indicadores.porEmpresa.useQuery(
    { empresa: empresaNome },
    { enabled: !!empresaNome }
  );

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
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
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
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
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

  const { visaoEmpresa, porTurma, alunos } = data;

  // Calcular melhor nota e nome do aluno
  const melhorAluno = alunos.length > 0 
    ? alunos.reduce((best, current) => current.notaFinal > best.notaFinal ? current : best, alunos[0])
    : null;
  const META_EXCELENCIA = 9.0;

  // Dados para o gráfico de radar dos 6 indicadores
  const radarData = [
    { indicador: 'Mentorias', valor: visaoEmpresa.mediaParticipacaoMentorias },
    { indicador: 'Atividades', valor: visaoEmpresa.mediaAtividadesPraticas },
    { indicador: 'Engajamento', valor: visaoEmpresa.mediaEngajamento },
    { indicador: 'Competências', valor: visaoEmpresa.mediaPerformanceCompetencias },
    { indicador: 'Aprendizado', valor: visaoEmpresa.mediaPerformanceAprendizado || 0 },
    { indicador: 'Eventos', valor: visaoEmpresa.mediaParticipacaoEventos },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/visao-geral">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard <span className="text-primary">{empresaNome}</span>
            </h1>
            <p className="text-muted-foreground">
              Performance detalhada da empresa
            </p>
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
              <p className="text-xs text-muted-foreground">
                Em {porTurma.length} turmas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance Geral</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(visaoEmpresa.mediaPerformanceGeral || visaoEmpresa.mediaNotaFinal * 10 || 0).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Média dos 6 indicadores</p>
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
              <p className="text-xs text-muted-foreground">
                Básico ou Inicial
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 7 Indicadores */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Ind. 1: Mentorias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoEmpresa.mediaParticipacaoMentorias.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Participação</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Ind. 2: Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoEmpresa.mediaAtividadesPraticas.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Entregues</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Ind. 3: Engajamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoEmpresa.mediaEngajamento.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Média</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4" />
                Ind. 4: Competências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoEmpresa.mediaPerformanceCompetencias.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Aprovadas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Ind. 5: Aprendizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(visaoEmpresa.mediaPerformanceAprendizado || 0).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Notas das provas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PartyPopper className="h-4 w-4" />
                Ind. 6: Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoEmpresa.mediaParticipacaoEventos.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Presença</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Ind. 7: Performance Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{(visaoEmpresa.mediaPerformanceGeral || 0).toFixed(0)}%</div>
              <Progress value={visaoEmpresa.mediaPerformanceGeral || 0} className="h-2 mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Média dos 6 indicadores</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Distribuição por Classificação */}
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
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ nome, percentual }) => `${nome}: ${percentual.toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="quantidade"
                      nameKey="nome"
                      isAnimationActive={false}
                    >
                      {visaoEmpresa.distribuicaoClassificacao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CLASSIFICATION_COLORS[entry.nome] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Radar dos Indicadores */}
          <Card>
            <CardHeader>
              <CardTitle>Radar de Indicadores</CardTitle>
              <CardDescription>Média dos 6 indicadores da empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="indicador" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name={empresaNome}
                      dataKey="valor"
                      stroke="#1E3A5F"
                      fill="#1E3A5F"
                      fillOpacity={0.6}
                      isAnimationActive={false}
                    />
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
              <CardTitle>Performance por Turma</CardTitle>
              <CardDescription>Nota média e quantidade de alunos por turma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={porTurma.map(t => ({
                      nome: t.identificador,
                      nota: t.mediaNotaFinal.toFixed(1),
                      alunos: t.totalAlunos
                    }))} 
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 10]} />
                    <YAxis dataKey="nome" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="nota" fill="#F5A623" name="Nota Média" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Alunos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Alunos da Empresa</CardTitle>
                <CardDescription>Ordenados por nota (maior para menor)</CardDescription>
              </div>
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
                      A Performance Geral de cada aluno é calculada com base em <strong>6 indicadores</strong>, cada um com peso igual:
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <span className="font-bold text-blue-600">1.</span>
                        <div>
                          <p className="font-medium">Participação nas Mentorias</p>
                          <p className="text-xs text-muted-foreground">Fonte: Planilhas de Mentorias (coluna "Mentoria" - Presente/Ausente)</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <span className="font-bold text-green-600">2.</span>
                        <div>
                          <p className="font-medium">Atividades Práticas</p>
                          <p className="text-xs text-muted-foreground">Fonte: Planilhas de Mentorias (coluna "Atividade proposta" - Entregue/Não entregue)</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                        <span className="font-bold text-yellow-600">3.</span>
                        <div>
                          <p className="font-medium">Engajamento</p>
                          <p className="text-xs text-muted-foreground">Fonte: Planilhas de Mentorias (coluna "Evolução/Engajamento" - nota 1 a 5)</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                        <span className="font-bold text-purple-600">4.</span>
                        <div>
                          <p className="font-medium">Performance de Competências</p>
                          <p className="text-xs text-muted-foreground">% de aulas concluídas (somente ciclos finalizados)</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                        <span className="font-bold text-red-600">5.</span>
                        <div>
                          <p className="font-medium">Performance de Aprendizado</p>
                          <p className="text-xs text-muted-foreground">Média das notas das provas por aula (somente ciclos finalizados)</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                        <span className="font-bold text-orange-600">6.</span>
                        <div>
                          <p className="font-medium">Participação em Eventos</p>
                          <p className="text-xs text-muted-foreground">Fonte: Planilhas de Eventos (Presente/Ausente)</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <p className="font-medium mb-2">Classificação por Estágio (Performance Geral %):</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-600"></span>
                          <span><strong>Excelência:</strong> 90-100%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                          <span><strong>Avançado:</strong> 70-89%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                          <span><strong>Intermediário:</strong> 50-69%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                          <span><strong>Básico:</strong> 30-49%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500"></span>
                          <span><strong>Inicial:</strong> 0-29%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {alunos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum aluno encontrado</p>
              ) : (
                alunos.map((aluno, index) => (
                  <div key={aluno.idUsuario} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-8">
                        {index + 1}º
                      </span>
                      <div>
                        <p className="font-medium">{aluno.nomeAluno}</p>
                        <p className="text-xs text-muted-foreground">Turma: {aluno.turma || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        (aluno.performanceGeral || aluno.notaFinal * 10) >= 70 ? 'text-green-600' : 
                        (aluno.performanceGeral || aluno.notaFinal * 10) >= 50 ? 'text-yellow-600' : 'text-red-500'
                      }`}>
                        {(aluno.performanceGeral || aluno.notaFinal * 10).toFixed(0)}%                      </p>
                      <p className="text-xs text-muted-foreground">{aluno.classificacao}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
