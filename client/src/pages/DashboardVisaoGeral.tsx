import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Legend
} from "recharts";
import { Users, Building2, TrendingUp, Award, Target, Calendar, BookOpen, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

const COLORS = ['#1E3A5F', '#F5A623', '#2E7D32', '#D32F2F', '#7B1FA2'];
const CLASSIFICATION_COLORS: Record<string, string> = {
  'Excelência': '#2E7D32',
  'Avançado': '#1976D2',
  'Intermediário': '#F5A623',
  'Básico': '#FF9800',
  'Inicial': '#D32F2F'
};

export default function DashboardVisaoGeral() {
  const { data, isLoading, error } = trpc.indicadores.visaoGeral.useQuery();
  const { data: empresas } = trpc.indicadores.empresas.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Visão Geral</h1>
            <p className="text-muted-foreground">Carregando dados...</p>
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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Visão Geral</h1>
            <p className="text-muted-foreground text-red-500">
              {error?.message || "Nenhum dado disponível. Faça upload das planilhas para visualizar os indicadores."}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { visaoGeral, porEmpresa, topAlunos, alunosAtencao } = data;

  // Dados para o gráfico de radar dos indicadores
  const radarData = [
    { indicador: 'Mentorias', valor: visaoGeral.mediaParticipacaoMentorias },
    { indicador: 'Atividades', valor: visaoGeral.mediaAtividadesPraticas },
    { indicador: 'Engajamento', valor: visaoGeral.mediaEngajamento },
    { indicador: 'Competências', valor: visaoGeral.mediaPerformanceCompetencias },
    { indicador: 'Eventos', valor: visaoGeral.mediaParticipacaoEventos },
  ];

  // Dados para o gráfico de barras por empresa
  const empresaData = porEmpresa.map(emp => ({
    nome: emp.identificador,
    nota: emp.mediaNotaFinal.toFixed(1),
    alunos: emp.totalAlunos
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard <span className="text-primary">Visão Geral</span>
          </h1>
          <p className="text-muted-foreground">
            Consolidado de performance de todas as empresas do ECOSSISTEMA DO BEM
          </p>
        </div>

        {/* Cards de resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoGeral.totalAlunos}</div>
              <p className="text-xs text-muted-foreground">
                Em {porEmpresa.length} empresas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nota Média Geral</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoGeral.mediaNotaFinal.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                De 0 a 10 pontos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alunos Excelência</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{visaoGeral.alunosExcelencia}</div>
              <p className="text-xs text-muted-foreground">
                {visaoGeral.totalAlunos > 0 
                  ? `${((visaoGeral.alunosExcelencia / visaoGeral.totalAlunos) * 100).toFixed(0)}% do total`
                  : '0% do total'}
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
                {visaoGeral.alunosBasico + visaoGeral.alunosInicial}
              </div>
              <p className="text-xs text-muted-foreground">
                Básico ou Inicial
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 5 Indicadores */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Mentorias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoGeral.mediaParticipacaoMentorias.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Participação</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoGeral.mediaAtividadesPraticas.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Entregues</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Engajamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoGeral.mediaEngajamento.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Média</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4" />
                Competências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoGeral.mediaPerformanceCompetencias.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Aprovadas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoGeral.mediaParticipacaoEventos.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Presença</p>
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
                      data={visaoGeral.distribuicaoClassificacao}
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
                      {visaoGeral.distribuicaoClassificacao.map((entry, index) => (
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
              <CardDescription>Média geral dos 5 indicadores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="indicador" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Média Geral"
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

        {/* Performance por Empresa */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Empresa</CardTitle>
            <CardDescription>Nota média e quantidade de alunos por empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={empresaData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 10]} />
                  <YAxis dataKey="nome" type="category" width={120} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'nota' ? `${value} pontos` : `${value} alunos`,
                      name === 'nota' ? 'Nota Média' : 'Total de Alunos'
                    ]}
                  />
                  <Bar dataKey="nota" fill="#1E3A5F" name="Nota Média" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Links para empresas */}
        {empresas && empresas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Acessar por Empresa</CardTitle>
              <CardDescription>Clique para ver detalhes de cada empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {empresas.map(empresa => (
                  <Link key={empresa.id} href={`/dashboard/empresa/${empresa.codigo}`}>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          {empresa.nome}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Clique para ver detalhes
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Alunos e Alunos que precisam de atenção */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Top 10 Alunos
              </CardTitle>
              <CardDescription>Melhores performances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topAlunos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                ) : (
                  topAlunos.map((aluno, index) => (
                    <div key={aluno.idUsuario} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-6">
                          {index + 1}º
                        </span>
                        <div>
                          <p className="font-medium">{aluno.nomeAluno}</p>
                          <p className="text-xs text-muted-foreground">{aluno.empresa}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{aluno.notaFinal.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">{aluno.classificacao}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Precisam de Atenção
              </CardTitle>
              <CardDescription>Alunos com nota abaixo de 5</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alunosAtencao.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum aluno precisa de atenção especial</p>
                ) : (
                  alunosAtencao.map((aluno) => (
                    <div key={aluno.idUsuario} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{aluno.nomeAluno}</p>
                        <p className="text-xs text-muted-foreground">{aluno.empresa}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-500">{aluno.notaFinal.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">{aluno.classificacao}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
