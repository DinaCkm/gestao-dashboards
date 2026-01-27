import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { 
  Upload, 
  BarChart3, 
  Users, 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Building2,
  FileText
} from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager" || isAdmin;

  // Fetch stats for admin
  const { data: stats } = trpc.stats.overview.useQuery(undefined, {
    enabled: isAdmin,
  });

  // Fetch latest batch info
  const { data: latestBatch } = trpc.dashboard.latestBatch.useQuery();

  const quickActions = [
    ...(isManager ? [{ 
      icon: Upload, 
      label: "Upload de Planilhas", 
      description: "Carregar novos dados semanais",
      path: "/upload",
      color: "from-primary to-primary/80"
    }] : []),
    { 
      icon: BarChart3, 
      label: "Meu Dashboard", 
      description: "Visualizar métricas pessoais",
      path: "/individual",
      color: "from-secondary to-secondary/80"
    },
    { 
      icon: FileText, 
      label: "Relatórios", 
      description: "Gerar e exportar relatórios",
      path: "/reports",
      color: "from-chart-3 to-chart-3/80"
    },
    ...(isAdmin ? [{ 
      icon: Users, 
      label: "Gerenciar Usuários", 
      description: "Administrar permissões",
      path: "/users",
      color: "from-chart-4 to-chart-4/80"
    }] : []),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="geometric-accent pl-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Bem-vindo ao <span className="text-gradient">ECOSSISTEMA DO BEM</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            {isAdmin 
              ? "Visão administrativa completa do sistema" 
              : isManager 
                ? "Gerencie sua equipe e visualize métricas departamentais"
                : "Acompanhe suas métricas e evolução pessoal"}
          </p>
        </div>

        {/* Stats Cards - Admin Only */}
        {isAdmin && stats && (
          <div className="dashboard-grid">
            <Card className="gradient-card card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Usuários
                </CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Usuários cadastrados
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Departamentos
                </CardTitle>
                <Building2 className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalDepartments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Departamentos ativos
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Uploads Realizados
                </CardTitle>
                <FileSpreadsheet className="h-4 w-4 text-chart-3" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalBatches}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lotes de planilhas
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Relatórios Gerados
                </CardTitle>
                <FileText className="h-4 w-4 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalReports}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Relatórios exportados
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Latest Batch Info */}
        {latestBatch && (
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Último Upload
              </CardTitle>
              <CardDescription>
                Dados mais recentes carregados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Semana</p>
                  <p className="text-2xl font-bold">{latestBatch.weekNumber}/{latestBatch.year}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    latestBatch.status === 'completed' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {latestBatch.status === 'completed' ? 'Processado' : 'Pendente'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {new Date(latestBatch.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Card 
                key={action.path} 
                className="gradient-card card-hover cursor-pointer group"
                onClick={() => setLocation(action.path)}
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">{action.label}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                  <div className="flex items-center gap-1 mt-4 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    Acessar <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Role-specific message */}
        <Card className="gradient-card border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                {isAdmin ? <BarChart3 className="h-5 w-5 text-primary" /> : 
                 isManager ? <Building2 className="h-5 w-5 text-secondary" /> :
                 <TrendingUp className="h-5 w-5 text-chart-3" />}
              </div>
              <div>
                <h3 className="font-semibold mb-1">
                  {isAdmin ? "Acesso Administrativo" : 
                   isManager ? "Acesso Gerencial" : 
                   "Acesso Individual"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isAdmin 
                    ? "Você tem acesso completo a todas as funcionalidades do sistema, incluindo gerenciamento de usuários, departamentos e configurações de cálculo."
                    : isManager 
                      ? "Você pode visualizar métricas da sua equipe, fazer upload de planilhas e gerar relatórios departamentais."
                      : "Você pode acompanhar suas métricas pessoais, histórico de evolução e gerar relatórios individuais."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
