import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { getEvolucaoStage } from "@/lib/evolucaoStages";
import { 
  User,
  Target,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Award,
  BookOpen,
  Clock,
  XCircle,
  Users,
  AlertCircle,
  AlertTriangle,
  Trophy,
  Loader2
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function getPerformanceStage(score: number): { label: string; color: string; description: string } {
  if (score >= 9) return { label: 'Excelência', color: 'bg-emerald-500', description: 'Alto nível de engajamento e performance' };
  if (score >= 7) return { label: 'Avançado', color: 'bg-blue-500', description: 'Bom nível de engajamento e performance' };
  if (score >= 5) return { label: 'Intermediário', color: 'bg-amber-500', description: 'Comprometimento adequado' };
  if (score >= 3) return { label: 'Básico', color: 'bg-orange-500', description: 'Participação irregular' };
  return { label: 'Inicial', color: 'bg-red-500', description: 'Baixo engajamento' };
}

export default function IndividualDashboard() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading } = trpc.indicadores.meuDashboard.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#1B3A5D]" />
          <span className="ml-3 text-gray-500">Carregando seu dashboard...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboardData || !dashboardData.found) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meu Dashboard</h1>
            <p className="text-gray-500 mt-1">Acompanhe sua evolução no programa de mentoria</p>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-amber-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Perfil não vinculado</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Nenhum perfil de aluno foi encontrado vinculado à sua conta ({user?.email || user?.name}).
                Entre em contato com o administrador para vincular seu perfil.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const { aluno, indicadores, sessoes, planoIndividual, sessionProgress } = dashboardData as any;
  const stage = getPerformanceStage(indicadores.notaFinal);

  const performanceRadar = [
    { indicator: 'Mentorias', value: indicadores.participacaoMentorias, fullMark: 100 },
    { indicator: 'Atividades', value: indicadores.atividadesPraticas, fullMark: 100 },
    { indicator: 'Engajamento', value: indicadores.engajamento, fullMark: 100 },
    { indicator: 'Competências', value: indicadores.performanceCompetencias, fullMark: 100 },
    { indicator: 'Eventos', value: indicadores.participacaoEventos, fullMark: 100 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meu Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Acompanhe sua evolução no programa de mentoria
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1 border-[#1B3A5D] text-[#1B3A5D]">
              <BookOpen className="h-4 w-4 mr-2" />
              {aluno.programa}
            </Badge>
          </div>
        </div>

        {/* Performance Overview Card */}
        <Card>
          <div className="grid md:grid-cols-3">
            {/* Score Section */}
            <div className="p-6 border-r border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-[#1B3A5D]/10">
                  <Award className="h-8 w-8 text-[#1B3A5D]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nota Final</p>
                  <p className="text-4xl font-bold text-gray-900">{indicadores.notaFinal.toFixed(1)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estágio</span>
                  <Badge className={`${stage.color} text-white`}>{stage.label}</Badge>
                </div>
                <p className="text-xs text-gray-500">{stage.description}</p>
              </div>
            </div>

            {/* Indicators Progress */}
            <div className="p-6 col-span-2">
              <h3 className="font-semibold text-gray-900 mb-4">5 Indicadores de Performance</h3>
              <div className="space-y-3">
                {[
                  { label: 'Presença Mentorias', value: indicadores.participacaoMentorias, icon: Calendar, color: 'text-blue-600' },
                  { label: 'Atividades Práticas', value: indicadores.atividadesPraticas, icon: CheckCircle2, color: 'text-emerald-600' },
                  { label: 'Engajamento', value: indicadores.engajamento, icon: TrendingUp, color: 'text-amber-600' },
                  { label: 'Competências', value: indicadores.performanceCompetencias, icon: BookOpen, color: 'text-purple-600' },
                  { label: 'Eventos', value: indicadores.participacaoEventos, icon: Users, color: 'text-rose-600' },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                        {item.label}
                      </span>
                      <span className="font-medium text-gray-900">{item.value.toFixed(0)}%</span>
                    </div>
                    <Progress value={item.value} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Progresso do Ciclo Macro */}
        {sessionProgress && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#1B3A5D]/10">
                  <Target className="h-5 w-5 text-[#1B3A5D]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Progresso do Ciclo Macro</h3>
                  <p className="text-sm text-gray-500">
                    {sessionProgress.macroInicio ? new Date(sessionProgress.macroInicio).toLocaleDateString('pt-BR') : ''}
                    {' → '}
                    {sessionProgress.macroTermino ? new Date(sessionProgress.macroTermino).toLocaleDateString('pt-BR') : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1">
                  <Progress 
                    value={(sessionProgress.sessoesRealizadas / sessionProgress.totalSessoesEsperadas) * 100} 
                    className="h-3" 
                  />
                </div>
                <span className="text-lg font-bold text-[#1B3A5D] whitespace-nowrap">
                  {sessionProgress.sessoesRealizadas}/{sessionProgress.totalSessoesEsperadas}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {sessionProgress.cicloCompleto ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-0">
                    <Trophy className="h-3 w-3 mr-1" /> Ciclo Completo
                  </Badge>
                ) : sessionProgress.faltaUmaSessao ? (
                  <Badge className="bg-amber-100 text-amber-800 border-0 animate-pulse">
                    <AlertCircle className="h-3 w-3 mr-1" /> Falta 1 sessão para fechar o ciclo!
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-500">
                    Faltam {sessionProgress.sessoesFaltantes} sessões para o término do Macro-Ciclo
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts and Details Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Perfil de Performance</CardTitle>
              <CardDescription>Visualização dos 5 indicadores</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={performanceRadar}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="indicator" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9ca3af' }} />
                  <Radar
                    name="Performance"
                    dataKey="value"
                    stroke="#1B3A5D"
                    fill="#1B3A5D"
                    fillOpacity={0.2}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
              <CardDescription>Seus números no programa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{indicadores.totalMentorias}</p>
                  <p className="text-sm text-gray-500">Sessões de Mentoria</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg text-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{indicadores.mentoriasPresente}</p>
                  <p className="text-sm text-gray-500">Presenças</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-lg text-center">
                  <Users className="h-6 w-6 text-rose-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{indicadores.totalEventos}</p>
                  <p className="text-sm text-gray-500">Eventos</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg text-center">
                  <Target className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{planoIndividual.length}</p>
                  <p className="text-sm text-gray-500">Competências no Plano</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#1B3A5D]" />
              Histórico de Sessões
            </CardTitle>
            <CardDescription>Registro de presenças e entregas de tarefas</CardDescription>
          </CardHeader>
          <CardContent>
            {sessoes.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {sessoes.map((session: any) => (
                  <div 
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        session.presence === 'presente' ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        <span className="font-bold text-sm text-gray-700">{session.sessionNumber || '-'}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Sessão {session.sessionNumber || '-'}</p>
                        <p className="text-xs text-gray-500">
                          {session.sessionDate ? new Date(session.sessionDate).toLocaleDateString('pt-BR') : 'Data não informada'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={session.presence === 'presente' ? "default" : "destructive"} className="text-xs">
                        {session.presence === 'presente' ? 'Presente' : 'Ausente'}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          session.taskStatus === 'entregue' ? 'border-emerald-500 text-emerald-600' :
                          session.taskStatus === 'nao_entregue' ? 'border-red-500 text-red-600' :
                          'border-gray-300 text-gray-500'
                        }`}
                      >
                        {session.taskStatus === 'entregue' ? 'Tarefa OK' :
                         session.taskStatus === 'nao_entregue' ? 'Pendente' : 'Sem tarefa'}
                      </Badge>
                      {(() => {
                        const nota = (session as any).notaEvolucao ?? session.engagementScore;
                        if (nota == null) return null;
                        const stage = getEvolucaoStage(nota);
                        return (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${stage.bgColor} ${stage.textColor} ${stage.borderColor} border`}>
                            ⭐ {nota}/10 — {stage.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma sessão de mentoria registrada ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plano Individual */}
        {planoIndividual.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-[#E87722]" />
                Meu Plano de Competências
              </CardTitle>
              <CardDescription>
                {planoIndividual.length} competências obrigatórias definidas no seu plano individual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {planoIndividual.map((item: any) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {item.status === 'concluida' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : item.status === 'em_progresso' ? (
                        <Clock className="h-5 w-5 text-blue-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{item.competenciaNome}</p>
                        <p className="text-sm text-gray-500">{item.trilhaNome}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={
                        item.status === 'concluida' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'em_progresso' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {item.status === 'concluida' ? 'Concluída' :
                         item.status === 'em_progresso' ? 'Em Progresso' : 'Pendente'}
                      </Badge>
                      {item.notaAtual && (
                        <div className="text-right">
                          <p className={`text-lg font-bold ${parseFloat(item.notaAtual) >= 7 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {parseFloat(item.notaAtual).toFixed(1)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
