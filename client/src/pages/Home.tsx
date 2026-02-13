import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  Upload, 
  BarChart3, 
  Users, 
  FileSpreadsheet, 
  ArrowRight,
  Building2,
  FileText,
  GraduationCap,
  UserCheck,
  Calendar,
  TrendingUp
} from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect based on role
  useEffect(() => {
    if (loading || !user) return;
    
    if (user.role === "manager") {
      setLocation("/dashboard/gestor");
      return;
    }
    
    if (user.role === "user") {
      setLocation("/dashboard/aluno");
      return;
    }
    // admin stays on Home
  }, [user, loading, setLocation]);

  const isAdmin = user?.role === "admin";

  // Fetch stats for admin
  const { data: stats } = trpc.stats.overview.useQuery(undefined, {
    enabled: isAdmin,
  });

  // Fetch latest batch info
  const { data: latestBatch } = trpc.dashboard.latestBatch.useQuery();

  const quickActions = [
    { 
      icon: Upload, 
      label: "Upload de Planilhas", 
      description: "Carregar novos dados semanais",
      path: "/upload",
      color: "from-primary to-primary/80"
    },
    { 
      icon: BarChart3, 
      label: "Visão Geral", 
      description: "Dashboard consolidado",
      path: "/dashboard/visao-geral",
      color: "from-secondary to-secondary/80"
    },
    { 
      icon: FileText, 
      label: "Relatórios", 
      description: "Gerar e exportar relatórios",
      path: "/relatorios",
      color: "from-chart-3 to-chart-3/80"
    },
    { 
      icon: Users, 
      label: "Cadastros", 
      description: "Gerenciar acessos e cadastros",
      path: "/cadastros",
      color: "from-chart-4 to-chart-4/80"
    },
  ];

  // If not admin, don't render the admin home (redirect will happen)
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Redirecionando...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="geometric-accent pl-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Bem-vindo ao <span className="text-gradient">ECOSSISTEMA DO BEM</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Visão administrativa completa do sistema
          </p>
        </div>

        {/* Stats Cards - Admin Only */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Alunos */}
            <Card className="gradient-card card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Alunos
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalAlunos}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Alunos cadastrados
                </p>
              </CardContent>
            </Card>

            {/* Mentores */}
            <Card className="gradient-card card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mentores
                </CardTitle>
                <UserCheck className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalMentores}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Consultores ativos
                </p>
              </CardContent>
            </Card>

            {/* Sessões de Mentoria */}
            <Card className="gradient-card card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sessões de Mentoria
                </CardTitle>
                <Calendar className="h-4 w-4 text-chart-3" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalSessoes}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mentorias realizadas
                </p>
              </CardContent>
            </Card>

            {/* Empresas */}
            <Card className="gradient-card card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Empresas
                </CardTitle>
                <Building2 className="h-4 w-4 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalEmpresas}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Programas ativos
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

        {/* Hierarchy Info */}
        <Card className="gradient-card border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Acesso Administrativo</h3>
                <p className="text-sm text-muted-foreground">
                  Você tem acesso completo: Visão Geral, Mentores, Empresas e Alunos. Gerencie usuários, departamentos e configurações.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
