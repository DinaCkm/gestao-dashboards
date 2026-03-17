import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Building2, ClipboardList, TrendingUp, UserCheck, Eye, Info, AlertTriangle, Clock, Video, Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = ['#1E3A5F', '#F5A623', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];

export default function DashboardMentor() {
  return (
    <DashboardLayout>
      <DashboardMentorContent />
    </DashboardLayout>
  );
}

function DashboardMentorContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const userConsultorId = (user as any)?.consultorId as number | null;
  const [, setLocation] = useLocation();
  
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(null);
  
  // Auto-select mentor if user is a mentor (has consultorId)
  useEffect(() => {
    if (userConsultorId && !isAdmin) {
      setSelectedMentorId(userConsultorId);
    }
  }, [userConsultorId, isAdmin]);
  
  const { data: mentores, isLoading: loadingMentores } = trpc.mentor.list.useQuery();
  const { data: stats, isLoading: loadingStats } = trpc.mentor.stats.useQuery(
    { consultorId: selectedMentorId! },
    { enabled: !!selectedMentorId }
  );
  const { data: dashboardGeral, isLoading: loadingGeral } = trpc.mentor.dashboardGeral.useQuery(
    undefined,
    { enabled: isAdmin }
  );
  const { data: appointments } = trpc.mentor.getAppointments.useQuery(
    { consultorId: selectedMentorId! },
    { enabled: !!selectedMentorId }
  );

  // Find selected mentor name
  const selectedMentor = mentores?.find(m => m.id === selectedMentorId);

  // Próximos agendamentos (apenas ativos)
  const proximosAgendamentos = (appointments || [])
    .filter(a => a.status === 'agendado' || a.status === 'confirmado')
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 5);

  // Alertas: apenas alunos ATUALMENTE vinculados a este mentor (isCurrentAluno)
  // e que estão sem sessão há 30+ dias (considerando sessões com qualquer mentor)
  const alertasAlunos = (stats?.alunosAtendidos || []).filter((aluno: any) => {
    // Só mostrar alerta de alunos que são atualmente deste mentor
    if (aluno.isCurrentAluno === false) return false;
    if (!aluno.ultimaMentoria) return true;
    const dias = Math.floor((Date.now() - new Date(aluno.ultimaMentoria).getTime()) / (1000 * 60 * 60 * 24));
    return dias >= 30;
  });

  if (loadingMentores) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isAdmin ? "Dashboard dos Mentores" : "Meu Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin 
              ? "Visualize estatísticas de mentorias por mentor" 
              : `Bem-vindo(a), ${selectedMentor?.name || user?.name || 'Mentor'}`
            }
          </p>
        </div>
        {!isAdmin && userConsultorId && (
          <Button variant="outline" onClick={() => setLocation("/mentor/configuracoes")} className="gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </Button>
        )}
      </div>

      {/* === VISÃO ADMIN: Visão Geral + Seletor === */}
      {isAdmin && (
        <>
          {/* Visão Geral de Todos os Mentores */}
          {loadingGeral ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : dashboardGeral && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Visão Geral - Todos os Mentores
                </CardTitle>
                <CardDescription>
                  {dashboardGeral.totalMentores} mentores cadastrados — clique em um card ou use o seletor abaixo para ver detalhes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {dashboardGeral.mentores.slice(0, 6).map((mentor, index) => (
                    <Card 
                      key={mentor.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${selectedMentorId === mentor.id ? 'ring-2 ring-primary shadow-lg' : ''}`}
                      onClick={() => setSelectedMentorId(mentor.id)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{mentor.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {mentor.totalMentorias} mentorias • {mentor.totalAlunos} alunos
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {selectedMentorId === mentor.id && (
                              <Eye className="h-4 w-4 text-primary" />
                            )}
                            <Badge variant={index === 0 ? "default" : "secondary"}>
                              #{index + 1}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {mentor.porEmpresa.map(emp => (
                            <Badge key={emp.empresa} variant="outline" className="text-xs">
                              {emp.empresa}: {emp.mentorias}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Gráfico de Barras - Top Mentores */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardGeral.mentores.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="nome" 
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="totalMentorias" fill="#1E3A5F" name="Total de Mentorias" isAnimationActive={false} />
                      <Bar dataKey="totalAlunos" fill="#F5A623" name="Alunos Atendidos" isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seletor de Mentor (Admin) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Selecionar Mentor
              </CardTitle>
              <CardDescription>
                Escolha um mentor para ver estatísticas detalhadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedMentorId ? selectedMentorId.toString() : undefined} 
                onValueChange={(val) => setSelectedMentorId(Number(val))}
              >
                <SelectTrigger className="w-full md:w-[400px]">
                  <SelectValue placeholder="Selecione um mentor..." />
                </SelectTrigger>
                <SelectContent>
                  {mentores?.map(mentor => (
                    <SelectItem key={mentor.id} value={mentor.id.toString()}>
                      {mentor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </>
      )}

      {/* === DETALHES DO MENTOR SELECIONADO === */}
      {selectedMentorId && loadingStats && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {selectedMentorId && stats && (
        <div className="space-y-6">
          {/* Nome do mentor selecionado (para admin) */}
          {isAdmin && selectedMentor && (
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <UserCheck className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-bold text-foreground">{selectedMentor.name}</h2>
                <p className="text-sm text-muted-foreground">Estatísticas detalhadas do mentor</p>
              </div>
            </div>
          )}

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <ClipboardList className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalMentorias}</p>
                    <p className="text-sm text-muted-foreground">Total de Mentorias</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-100">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalAlunos}</p>
                    <p className="text-sm text-muted-foreground">Alunos Atendidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalEmpresas}</p>
                    <p className="text-sm text-muted-foreground">Empresas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {stats.totalAlunos > 0 ? (stats.totalMentorias / stats.totalAlunos).toFixed(1) : 0}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Média por Aluno
                      <span title="Média de sessões de mentoria por aluno atendido." className="cursor-help">
                        <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grid: Distribuição por Empresa + Próximos Agendamentos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição por Empresa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Distribuição por Empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.porEmpresa}
                        dataKey="mentorias"
                        nameKey="empresa"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ empresa, percent }: any) => `${empresa}: ${(percent * 100).toFixed(0)}%`}
                        isAnimationActive={false}
                      >
                        {stats.porEmpresa.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Tabela resumida */}
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead className="text-right">Mentorias</TableHead>
                      <TableHead className="text-right">Alunos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.porEmpresa.map((emp: any, index: number) => (
                      <TableRow key={emp.empresa}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full shrink-0" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            {emp.empresa}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{emp.mentorias}</TableCell>
                        <TableCell className="text-right">{emp.alunos}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Próximos Agendamentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Próximos Agendamentos
                </CardTitle>
                <CardDescription>
                  {proximosAgendamentos.length > 0 
                    ? `${proximosAgendamentos.length} agendamento(s) ativo(s)`
                    : 'Nenhum agendamento próximo'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {proximosAgendamentos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum agendamento ativo</p>
                    {!isAdmin && (
                      <Button variant="link" size="sm" className="mt-2" onClick={() => setLocation("/mentor/configuracoes")}>
                        Configurar agenda <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proximosAgendamentos.map(appt => (
                      <div key={appt.id} className="border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={appt.type === 'grupo' ? 'default' : 'secondary'} className="text-xs">
                                {appt.type === 'grupo' ? 'Grupo' : 'Individual'}
                              </Badge>
                              <Badge variant={appt.status === 'confirmado' ? 'default' : 'outline'} className={`text-xs ${appt.status === 'confirmado' ? 'bg-green-600' : ''}`}>
                                {appt.status === 'confirmado' ? 'Confirmado' : 'Aguardando'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(appt.scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {appt.startTime} — {appt.endTime}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {appt.participants.slice(0, 3).map((p: any) => (
                                <span key={p.id} className="text-xs text-muted-foreground">{p.alunoName}</span>
                              ))}
                              {appt.participants.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{appt.participants.length - 3} mais</span>
                              )}
                            </div>
                          </div>
                          {appt.googleMeetLink && (
                            <a href={appt.googleMeetLink} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="gap-1 text-xs">
                                <Video className="h-3 w-3" /> Meet
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                    {!isAdmin && (
                      <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setLocation("/mentor/configuracoes")}>
                        Ver todos os agendamentos <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alertas */}
          {alertasAlunos.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas de Acompanhamento
                </CardTitle>
                <CardDescription>
                  Alunos que precisam de atenção — sem sessão há 30+ dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alertasAlunos.map((aluno: any) => {
                    const dias = aluno.ultimaMentoria 
                      ? Math.floor((Date.now() - new Date(aluno.ultimaMentoria).getTime()) / (1000 * 60 * 60 * 24))
                      : null;
                    return (
                      <div key={aluno.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{aluno.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {aluno.empresa} • {aluno.totalMentorias} mentoria(s)
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-amber-300 text-amber-700 text-xs">
                          {dias ? `${dias} dias sem sessão` : 'Sem sessão registrada'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alunos Atendidos - Tabela Resumida */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Alunos Atendidos
              </CardTitle>
              <CardDescription>
                Lista de todos os alunos que receberam mentoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Aluno</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="text-right">Total Mentorias</TableHead>
                    <TableHead>Última Mentoria</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.alunosAtendidos.map((aluno: any) => (
                    <TableRow key={aluno.id}>
                      <TableCell className="font-medium">{aluno.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{aluno.empresa}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{aluno.totalMentorias}</TableCell>
                      <TableCell>
                        {aluno.ultimaMentoria 
                          ? new Date(aluno.ultimaMentoria).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mensagem quando nenhum mentor selecionado (admin) */}
      {isAdmin && !selectedMentorId && !loadingGeral && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Selecione um mentor acima</p>
            <p className="text-sm">Clique em um card ou use o dropdown para ver estatísticas detalhadas</p>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando mentor logado não tem consultorId */}
      {!isAdmin && !userConsultorId && (
        <Card className="border-dashed border-destructive/30">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Conta não vinculada a um mentor</p>
            <p className="text-sm">Sua conta não está associada a um perfil de mentor. Contate o administrador.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
