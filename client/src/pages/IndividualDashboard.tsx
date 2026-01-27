import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  User,
  Target,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Award,
  BookOpen,
  Clock
} from "lucide-react";
import {
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// Chart colors
const COLORS = {
  primary: 'oklch(0.65 0.18 45)',
  secondary: 'oklch(0.55 0.15 195)',
  chart3: 'oklch(0.60 0.12 160)',
};

// Demo data for individual performance
const performanceRadar = [
  { indicator: 'Presença Mentorias', value: 92, fullMark: 100 },
  { indicator: 'Atividades Práticas', value: 85, fullMark: 100 },
  { indicator: 'Engajamento', value: 78, fullMark: 100 },
  { indicator: 'Competências', value: 72, fullMark: 100 },
  { indicator: 'Eventos', value: 88, fullMark: 100 },
];

const evolutionData = [
  { mes: 'Jan', nota: 6.5 },
  { mes: 'Fev', nota: 7.0 },
  { mes: 'Mar', nota: 7.2 },
  { mes: 'Abr', nota: 7.8 },
  { mes: 'Mai', nota: 8.1 },
  { mes: 'Jun', nota: 8.3 },
];

const sessionsHistory = [
  { sessao: 1, data: '05/01', presenca: true, tarefa: 'entregue' },
  { sessao: 2, data: '12/01', presenca: true, tarefa: 'entregue' },
  { sessao: 3, data: '19/01', presenca: false, tarefa: 'nao_entregue' },
  { sessao: 4, data: '26/01', presenca: true, tarefa: 'entregue' },
  { sessao: 5, data: '02/02', presenca: true, tarefa: 'entregue' },
  { sessao: 6, data: '09/02', presenca: true, tarefa: 'sem_tarefa' },
];

function getPerformanceStage(score: number): { label: string; color: string; description: string } {
  if (score >= 9) return { label: 'Excelência', color: 'bg-green-500', description: 'Alto nível de engajamento' };
  if (score >= 7) return { label: 'Avançado', color: 'bg-blue-500', description: 'Bom nível de engajamento' };
  if (score >= 5) return { label: 'Intermediário', color: 'bg-yellow-500', description: 'Comprometimento adequado' };
  if (score >= 3) return { label: 'Básico', color: 'bg-orange-500', description: 'Participação irregular' };
  return { label: 'Inicial', color: 'bg-red-500', description: 'Baixo engajamento' };
}

export default function IndividualDashboard() {
  const { user } = useAuth();

  // Calculate overall score (average of 5 indicators)
  const overallScore = performanceRadar.reduce((acc, item) => acc + item.value, 0) / performanceRadar.length / 10;
  const stage = getPerformanceStage(overallScore);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Meu Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe sua evolução no programa de mentoria
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1">
              <BookOpen className="h-4 w-4 mr-2" />
              Ciclo IV
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              SEBRAE Acre
            </Badge>
          </div>
        </div>

        {/* Performance Overview Card */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="grid md:grid-cols-3">
            {/* Score Section */}
            <div className="p-6 border-r border-border/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Visão Geral</p>
                  <p className="text-4xl font-bold">{overallScore.toFixed(1)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Estágio</span>
                  <Badge className={stage.color}>{stage.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
              </div>
            </div>

            {/* Indicators Progress */}
            <div className="p-6 col-span-2">
              <h3 className="font-semibold mb-4">5 Indicadores de Performance</h3>
              <div className="space-y-3">
                {performanceRadar.map((item) => (
                  <div key={item.indicator} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.indicator}</span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                    <Progress value={item.value} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Radar Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Perfil de Performance</CardTitle>
              <CardDescription>Visualização dos 5 indicadores</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={performanceRadar}>
                  <PolarGrid stroke="oklch(0.30 0.04 220)" />
                  <PolarAngleAxis dataKey="indicator" tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'oklch(0.65 0.02 220)' }} />
                  <Radar
                    name="Performance"
                    dataKey="value"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.3}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'oklch(0.18 0.025 220)', 
                      border: '1px solid oklch(0.30 0.04 220)',
                      borderRadius: '8px'
                    }} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Evolution Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Evolução do Engajamento</CardTitle>
              <CardDescription>Nota mensal de engajamento (0-10)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.04 220)" />
                  <XAxis dataKey="mes" stroke="oklch(0.65 0.02 220)" />
                  <YAxis domain={[0, 10]} stroke="oklch(0.65 0.02 220)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'oklch(0.18 0.025 220)', 
                      border: '1px solid oklch(0.30 0.04 220)',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="nota" 
                    name="Engajamento"
                    stroke={COLORS.primary} 
                    strokeWidth={3}
                    dot={{ fill: COLORS.primary, strokeWidth: 2 }}
                    activeDot={{ r: 8, fill: COLORS.primary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sessions History */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Histórico de Sessões</CardTitle>
            <CardDescription>Registro de presenças e entregas de tarefas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {sessionsHistory.map((session) => (
                <div 
                  key={session.sessao}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      session.presenca ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      <span className="font-bold text-sm">{session.sessao}</span>
                    </div>
                    <div>
                      <p className="font-medium">Sessão {session.sessao}</p>
                      <p className="text-xs text-muted-foreground">{session.data}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={session.presenca ? "default" : "destructive"} className="text-xs">
                      {session.presenca ? 'Presente' : 'Ausente'}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        session.tarefa === 'entregue' ? 'border-green-500 text-green-500' :
                        session.tarefa === 'nao_entregue' ? 'border-red-500 text-red-500' :
                        'border-muted-foreground'
                      }`}
                    >
                      {session.tarefa === 'entregue' ? 'Tarefa OK' :
                       session.tarefa === 'nao_entregue' ? 'Pendente' : 'Sem tarefa'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">6</p>
                  <p className="text-sm text-muted-foreground">Sessões no Ciclo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <CheckCircle2 className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">4/5</p>
                  <p className="text-sm text-muted-foreground">Tarefas Entregues</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-chart-3/10">
                  <Target className="h-6 w-6 text-chart-3" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-muted-foreground">Eventos Participados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">+1.8</p>
                  <p className="text-sm text-muted-foreground">Evolução no Ciclo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
