import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

// Demo data for team performance
const teamPerformance = [
  { name: 'João Silva', performance: 95, meta: 90, status: 'above' },
  { name: 'Maria Santos', performance: 88, meta: 90, status: 'below' },
  { name: 'Pedro Costa', performance: 102, meta: 90, status: 'above' },
  { name: 'Ana Oliveira', performance: 91, meta: 90, status: 'above' },
  { name: 'Carlos Lima', performance: 78, meta: 90, status: 'below' },
];

const weeklyTrend = [
  { week: 'Sem 1', equipe: 85, empresa: 82 },
  { week: 'Sem 2', equipe: 88, empresa: 84 },
  { week: 'Sem 3', equipe: 92, empresa: 87 },
  { week: 'Sem 4', equipe: 89, empresa: 86 },
  { week: 'Sem 5', equipe: 94, empresa: 88 },
  { week: 'Sem 6', equipe: 91, empresa: 89 },
];

const skillsData = [
  { skill: 'Produtividade', A: 90, fullMark: 100 },
  { skill: 'Qualidade', A: 85, fullMark: 100 },
  { skill: 'Pontualidade', A: 95, fullMark: 100 },
  { skill: 'Colaboração', A: 88, fullMark: 100 },
  { skill: 'Inovação', A: 75, fullMark: 100 },
  { skill: 'Comunicação', A: 82, fullMark: 100 },
];

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // Check manager access
  if (user?.role !== "admin" && user?.role !== "manager") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="gradient-card max-w-md">
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
              <p className="text-muted-foreground">
                Esta página é restrita a gerentes e administradores.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Fetch departments
  const { data: departments } = trpc.departments.list.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="geometric-accent pl-4">
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard <span className="text-gradient">Gerencial</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe o desempenho da sua equipe e departamento
            </p>
          </div>
          
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[200px] bg-input">
              <SelectValue placeholder="Selecionar departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Departamentos</SelectItem>
              {departments?.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="dashboard-grid">
          <Card className="gradient-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Performance da Equipe
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">91%</span>
                <span className="text-sm text-green-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3" /> +3.2%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                média do departamento
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Meta Atingida
              </CardTitle>
              <Target className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">60%</span>
                <span className="text-sm text-green-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3" /> +10%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                3 de 5 colaboradores
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Colaboradores
              </CardTitle>
              <Users className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">5</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                membros na equipe
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ranking Geral
              </CardTitle>
              <Award className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">2º</span>
                <span className="text-sm text-green-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3" /> +1
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                entre 8 departamentos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team vs Company Trend */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle>Comparativo de Performance</CardTitle>
              <CardDescription>Equipe vs Média da Empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.04 220)" />
                    <XAxis dataKey="week" stroke="oklch(0.65 0.02 220)" fontSize={12} />
                    <YAxis stroke="oklch(0.65 0.02 220)" fontSize={12} domain={[70, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'oklch(0.18 0.025 220)', 
                        border: '1px solid oklch(0.30 0.04 220)',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="equipe" 
                      name="Minha Equipe"
                      stroke="oklch(0.65 0.18 45)" 
                      strokeWidth={3}
                      dot={{ fill: 'oklch(0.65 0.18 45)', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="empresa" 
                      name="Média Empresa"
                      stroke="oklch(0.55 0.15 195)" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'oklch(0.55 0.15 195)', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Skills Radar */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle>Competências da Equipe</CardTitle>
              <CardDescription>Avaliação por área de competência</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={skillsData}>
                    <PolarGrid stroke="oklch(0.30 0.04 220)" />
                    <PolarAngleAxis 
                      dataKey="skill" 
                      stroke="oklch(0.65 0.02 220)"
                      fontSize={11}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      stroke="oklch(0.65 0.02 220)"
                      fontSize={10}
                    />
                    <Radar
                      name="Equipe"
                      dataKey="A"
                      stroke="oklch(0.65 0.18 45)"
                      fill="oklch(0.65 0.18 45)"
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Performance Table */}
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle>Desempenho Individual</CardTitle>
            <CardDescription>Performance de cada membro da equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamPerformance.map((member, index) => (
                <div 
                  key={member.name}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      member.status === 'above' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Meta: {member.meta}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold">{member.performance}%</p>
                      <p className={`text-xs flex items-center justify-end gap-1 ${
                        member.status === 'above' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {member.status === 'above' ? (
                          <>
                            <ArrowUpRight className="h-3 w-3" />
                            Acima da meta
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="h-3 w-3" />
                            Abaixo da meta
                          </>
                        )}
                      </p>
                    </div>
                    
                    <div className="w-24">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            member.status === 'above' ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min(member.performance, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="gradient-card border-yellow-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Pontos de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10">
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-400">2 colaboradores abaixo da meta</p>
                  <p className="text-sm text-muted-foreground">
                    Maria Santos e Carlos Lima precisam de acompanhamento
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-primary">Destaque da semana</p>
                  <p className="text-sm text-muted-foreground">
                    Pedro Costa superou a meta em 12% - considere reconhecimento
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
