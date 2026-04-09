import React from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Target, Briefcase } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function BoasVindasGestor() {
  const { user } = useAuth();

  // Buscar programId do usuário
  const { data: userData } = trpc.auth.me.useQuery();
  const programId = userData?.programId;

  // Buscar estatísticas do time usando a rota existente mentor.gestorTeamStats
  const { data: teamStats } = trpc.mentor.gestorTeamStats.useQuery(
    { programId: programId || 0 },
    { enabled: !!programId && user?.role === 'manager' }
  );

  const stats = teamStats || { 
    totalColaboradores: 0, 
    totalMentorias: 0, 
    totalCompetencias: 0, 
    principaisCompetencias: [] 
  };

  return (
    <DashboardLayout>
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="mb-12 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-8">
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium">
            Programa de Certificação
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Bem-vindo(a), <span className="text-cyan-600">{user?.name?.split(' ')[0]}</span>!
        </h1>
        <p className="text-gray-600 text-lg">
          Você agora faz parte do <span className="font-semibold text-gray-900">Ecossistema de Desenvolvimento de Liderança</span> da CKM Talents.
        </p>
        <p className="text-gray-600 mt-4">
          Acompanhe o progresso da sua equipe, visualize métricas de desenvolvimento e impulsione os resultados do programa de certificação.
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Colaboradores</p>
                <p className="text-3xl font-bold mt-1">{stats.totalColaboradores}</p>
              </div>
              <Users className="h-8 w-8 text-cyan-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Mentorias</p>
                <p className="text-3xl font-bold mt-1">{stats.totalMentorias}</p>
              </div>
              <Briefcase className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Competências Desenvolvidas</p>
                <p className="text-3xl font-bold mt-1">{stats.totalCompetencias}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Competências</p>
                <p className="text-3xl font-bold mt-1">{stats.principaisCompetencias?.length || 0}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Acesso Rápido */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">Acesso rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/dashboard/minha-empresa" className="block p-6 bg-card rounded-lg border border-border hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-cyan-600 mb-2">📊</div>
            <h3 className="font-semibold text-foreground">Minha Empresa</h3>
            <p className="text-sm text-muted-foreground mt-1">Visualize dados da sua empresa</p>
          </a>

          <a href="/dashboard/sessoes-mentoria" className="block p-6 bg-card rounded-lg border border-border hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-orange-600 mb-2">👥</div>
            <h3 className="font-semibold text-foreground">Sessões de Mentoria</h3>
            <p className="text-sm text-muted-foreground mt-1">Acompanhe as mentorias</p>
          </a>

          <a href="/dashboard/metas" className="block p-6 bg-card rounded-lg border border-border hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-green-600 mb-2">🎯</div>
            <h3 className="font-semibold text-foreground">Metas</h3>
            <p className="text-sm text-muted-foreground mt-1">Acompanhe as metas</p>
          </a>

          <a href="/dashboard/relatorios" className="block p-6 bg-card rounded-lg border border-border hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-purple-600 mb-2">📈</div>
            <h3 className="font-semibold text-foreground">Relatórios</h3>
            <p className="text-sm text-muted-foreground mt-1">Gere relatórios detalhados</p>
          </a>
        </div>
      </div>

      {/* Fale Conosco */}
      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">💬</div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Tem dúvidas sobre o programa?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Solicite uma reunião de apresentação com nossa equipe. Teremos prazer em explicar todos os detalhes do programa e como ele pode beneficiar sua equipe.
              </p>
              <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium">
                Solicitar Reunião de Apresentação
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
