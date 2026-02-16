import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, Building2, ClipboardList, TrendingUp, UserCheck, Eye } from "lucide-react";
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

  // Find selected mentor name
  const selectedMentor = mentores?.find(m => m.id === selectedMentorId);

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
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {isAdmin ? "Dashboard dos Mentores" : "Meu Dashboard de Mentor"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin 
            ? "Visualize estatísticas de mentorias por mentor" 
            : `Bem-vindo(a), ${selectedMentor?.name || user?.name || 'Mentor'}`
          }
        </p>
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
                    <p className="text-sm text-muted-foreground">Empresas Atendidas</p>
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
                    <p className="text-sm text-muted-foreground">Média por Aluno</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs com Detalhes */}
          <Tabs defaultValue="empresas" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="empresas">Por Empresa</TabsTrigger>
              <TabsTrigger value="alunos">Alunos Atendidos</TabsTrigger>
              <TabsTrigger value="sessoes">Histórico de Sessões</TabsTrigger>
            </TabsList>

            <TabsContent value="empresas" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Pizza */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Empresa</CardTitle>
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
                  </CardContent>
                </Card>

                {/* Tabela por Empresa */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes por Empresa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
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
                                  className="w-3 h-3 rounded-full" 
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
              </div>
            </TabsContent>

            <TabsContent value="alunos">
              <Card>
                <CardHeader>
                  <CardTitle>Alunos Atendidos</CardTitle>
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
            </TabsContent>

            <TabsContent value="sessoes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Histórico de Sessões
                  </CardTitle>
                  <CardDescription>
                    Todas as sessões de mentoria realizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Presença</TableHead>
                          <TableHead className="text-right">Engajamento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.sessoes.slice(0, 50).map((sessao: any) => (
                          <TableRow key={sessao.id}>
                            <TableCell>
                              {sessao.data 
                                ? new Date(sessao.data).toLocaleDateString('pt-BR')
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="font-medium">{sessao.aluno}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{sessao.empresa}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={sessao.presenca === 'presente' ? 'default' : 'destructive'}>
                                {sessao.presenca === 'presente' ? 'Presente' : 'Ausente'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {sessao.engajamento ? `${sessao.engajamento}/5` : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
