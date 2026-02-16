import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  GraduationCap,
  Calendar,
  CheckCircle2,
  Target,
  Award,
  Minus
} from "lucide-react";
import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

// Chart colors matching our theme
const COLORS = [
  'oklch(0.65 0.18 45)',   // primary - burnt orange
  'oklch(0.55 0.15 195)',  // secondary - cyan
  'oklch(0.60 0.12 160)',  // chart-3 - teal
  'oklch(0.70 0.15 55)',   // chart-4 - light orange
  'oklch(0.50 0.10 210)',  // chart-5 - deep cyan
];

// Demo data for mentoring visualization
const mentoringMetrics = [
  { ciclo: 'Ciclo I', presenca: 92, tarefas: 85, engajamento: 78, eventos: 88 },
  { ciclo: 'Ciclo II', presenca: 88, tarefas: 82, engajamento: 81, eventos: 85 },
  { ciclo: 'Ciclo III', presenca: 85, tarefas: 88, engajamento: 85, eventos: 82 },
  { ciclo: 'Ciclo IV', presenca: 90, tarefas: 91, engajamento: 88, eventos: 90 },
];

const programData = [
  { name: 'SEBRAE Acre', value: 45, color: COLORS[0] },
  { name: 'SEBRAE TO', value: 35, color: COLORS[1] },
  { name: 'EMBRAPII', value: 20, color: COLORS[2] },
];

const performanceDistribution = [
  { estagio: 'Excelência (9-10)', quantidade: 15, percentual: 12 },
  { estagio: 'Avançado (7-8)', quantidade: 35, percentual: 28 },
  { estagio: 'Intermediário (5-6)', quantidade: 45, percentual: 36 },
  { estagio: 'Básico (3-4)', quantidade: 20, percentual: 16 },
  { estagio: 'Inicial (0-2)', quantidade: 10, percentual: 8 },
];

const weeklyProgress = [
  { semana: 'Sem 1', alunos: 120, sessoes: 95, eventos: 3 },
  { semana: 'Sem 2', alunos: 118, sessoes: 92, eventos: 2 },
  { semana: 'Sem 3', alunos: 122, sessoes: 98, eventos: 4 },
  { semana: 'Sem 4', alunos: 125, sessoes: 100, eventos: 3 },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  
  // Hooks must be called before any conditional returns
  const { data: dashboardData, isLoading, isError } = trpc.dashboard.adminMetrics.useQuery();

  // Check admin access
  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="bg-card border-border max-w-md">
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
              <p className="text-muted-foreground">
                Esta página é restrita a administradores do sistema.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="bg-card border-border max-w-md">
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Erro ao Carregar</h2>
              <p className="text-muted-foreground">
                Não foi possível carregar os dados do dashboard. Tente novamente.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Dashboard Administrativo</h1>
            <p className="text-muted-foreground mt-1">
              Visão consolidada de todos os programas de mentoria
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="Programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Programas</SelectItem>
                <SelectItem value="sebrae-acre">SEBRAE Acre</SelectItem>
                <SelectItem value="sebrae-to">SEBRAE TO</SelectItem>
                <SelectItem value="embrapii">EMBRAPII</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[150px] bg-card">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Ciclo Atual</SelectItem>
                <SelectItem value="all">Todos os Ciclos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards - 5 Indicadores */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-card border-border card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Participação Mentorias</p>
                  <p className="text-2xl font-bold mt-1">88.5%</p>
                  <div className="flex items-center gap-1 mt-1 text-green-500 text-sm">
                    <TrendingUp className="h-3 w-3" />
                    <span>+2.3%</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Atividades Práticas</p>
                  <p className="text-2xl font-bold mt-1">82.1%</p>
                  <div className="flex items-center gap-1 mt-1 text-green-500 text-sm">
                    <TrendingUp className="h-3 w-3" />
                    <span>+5.1%</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-secondary/10">
                  <CheckCircle2 className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Engajamento Médio</p>
                  <p className="text-2xl font-bold mt-1">7.8</p>
                  <div className="flex items-center gap-1 mt-1 text-muted-foreground text-sm">
                    <Minus className="h-3 w-3" />
                    <span>Estável</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-chart-3/10">
                  <Target className="h-6 w-6 text-chart-3" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Performance Competências</p>
                  <p className="text-2xl font-bold mt-1">75.3%</p>
                  <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                    <TrendingDown className="h-3 w-3" />
                    <span>-1.2%</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-chart-4/10">
                  <GraduationCap className="h-6 w-6 text-chart-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Participação Eventos</p>
                  <p className="text-2xl font-bold mt-1">86.2%</p>
                  <div className="flex items-center gap-1 mt-1 text-green-500 text-sm">
                    <TrendingUp className="h-3 w-3" />
                    <span>+3.8%</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-chart-5/10">
                  <Calendar className="h-6 w-6 text-chart-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Performance por Ciclo */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Performance por Ciclo</CardTitle>
              <CardDescription>Evolução dos indicadores ao longo dos ciclos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mentoringMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.04 220)" />
                  <XAxis dataKey="ciclo" stroke="oklch(0.65 0.02 220)" />
                  <YAxis stroke="oklch(0.65 0.02 220)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'oklch(0.18 0.025 220)', 
                      border: '1px solid oklch(0.30 0.04 220)',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Area type="monotone" dataKey="presenca" name="Presença" stackId="1" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="tarefas" name="Tarefas" stackId="2" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="engajamento" name="Engajamento" stackId="3" stroke={COLORS[2]} fill={COLORS[2]} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="eventos" name="Eventos" stackId="4" stroke={COLORS[3]} fill={COLORS[3]} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuição por Programa */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Distribuição por Programa</CardTitle>
              <CardDescription>Alunos ativos por programa de mentoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={programData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      isAnimationActive={false}
                    >
                      {programData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'oklch(0.18 0.025 220)', 
                        border: '1px solid oklch(0.30 0.04 220)',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Distribuição de Performance */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Distribuição de Performance</CardTitle>
              <CardDescription>Alunos por estágio de desenvolvimento</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.04 220)" />
                  <XAxis type="number" stroke="oklch(0.65 0.02 220)" />
                  <YAxis dataKey="estagio" type="category" width={130} stroke="oklch(0.65 0.02 220)" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'oklch(0.18 0.025 220)', 
                      border: '1px solid oklch(0.30 0.04 220)',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => [`${value}%`, 'Percentual']}
                  />
                  <Bar dataKey="percentual" fill={COLORS[0]} radius={[0, 4, 4, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Progresso Semanal */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Progresso Semanal</CardTitle>
              <CardDescription>Atividades das últimas semanas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.04 220)" />
                  <XAxis dataKey="semana" stroke="oklch(0.65 0.02 220)" />
                  <YAxis stroke="oklch(0.65 0.02 220)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'oklch(0.18 0.025 220)', 
                      border: '1px solid oklch(0.30 0.04 220)',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="alunos" name="Alunos Ativos" stroke={COLORS[0]} strokeWidth={2} dot={{ fill: COLORS[0] }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="sessoes" name="Sessões Realizadas" stroke={COLORS[1]} strokeWidth={2} dot={{ fill: COLORS[1] }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">125</p>
                  <p className="text-sm text-muted-foreground">Alunos Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <GraduationCap className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-muted-foreground">Mentores</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-chart-3/10">
                  <Calendar className="h-6 w-6 text-chart-3" />
                </div>
                <div>
                  <p className="text-2xl font-bold">48</p>
                  <p className="text-sm text-muted-foreground">Eventos Realizados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-chart-4/10">
                  <Award className="h-6 w-6 text-chart-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">81.8%</p>
                  <p className="text-sm text-muted-foreground">Performance Geral</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
