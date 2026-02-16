import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Legend
} from "recharts";
import { Users, TrendingUp, Award, Target, Calendar, BookOpen, Zap, HelpCircle, Filter, X, ChevronDown, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { Link } from "wouter";

const COLORS = ['#1E3A5F', '#F5A623', '#2E7D32', '#D32F2F', '#7B1FA2'];
const CLASSIFICATION_COLORS: Record<string, string> = {
  'Excelência': '#2E7D32',
  'Avançado': '#1976D2',
  'Intermediário': '#F5A623',
  'Básico': '#FF9800',
  'Inicial': '#D32F2F'
};

export default function DashboardGestor() {
  const { user } = useAuth();
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("todas");
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>("todos");

  // Get the empresa name from the user's programId
  const { data: empresas } = trpc.indicadores.empresas.useQuery();
  const empresaNome = useMemo(() => {
    if (!empresas || !user?.programId) return null;
    const empresa = empresas.find(e => e.id === user.programId);
    return empresa?.nome || null;
  }, [empresas, user?.programId]);

  // Get turmas for this program
  const { data: turmas } = trpc.turmas.list.useQuery(
    { programId: user?.programId || 0 },
    { enabled: !!user?.programId }
  );

  // Get empresa data
  const { data, isLoading, error } = trpc.indicadores.porEmpresa.useQuery(
    { empresa: empresaNome || '' },
    { enabled: !!empresaNome }
  );

  // Get alunos for this program
  const { data: alunosList } = trpc.alunos.list.useQuery(
    { programId: user?.programId || 0 },
    { enabled: !!user?.programId }
  );

  // Filter alunos by selected turma
  const filteredAlunos = useMemo(() => {
    if (!data?.alunos) return [];
    let result = [...data.alunos];
    
    if (selectedTurmaId !== "todas") {
      result = result.filter(a => String(a.turma) === selectedTurmaId);
    }
    
    if (selectedAlunoId !== "todos") {
      result = result.filter(a => a.idUsuario === selectedAlunoId);
    }
    
    return result;
  }, [data?.alunos, selectedTurmaId, selectedAlunoId]);

  // Recalculate KPIs based on filtered alunos
  const filteredKPIs = useMemo(() => {
    if (filteredAlunos.length === 0) {
      return {
        totalAlunos: 0,
        mediaNotaFinal: 0,
        melhorAluno: null as { nomeAluno: string; notaFinal: number } | null,
        precisamAtencao: 0,
        mediaParticipacaoMentorias: 0,
        mediaAtividadesPraticas: 0,
        mediaEngajamento: 0,
        mediaPerformanceCompetencias: 0,
        mediaParticipacaoEventos: 0,
        distribuicaoClassificacao: [] as { nome: string; quantidade: number; percentual: number }[],
      };
    }

    const total = filteredAlunos.length;
    const mediaNotaFinal = filteredAlunos.reduce((sum, a) => sum + a.notaFinal, 0) / total;
    const melhorAluno = filteredAlunos.reduce((best, current) => current.notaFinal > best.notaFinal ? current : best, filteredAlunos[0]);
    
    // Count classifications
    const classCount: Record<string, number> = {};
    filteredAlunos.forEach(a => {
      classCount[a.classificacao] = (classCount[a.classificacao] || 0) + 1;
    });
    const distribuicaoClassificacao = Object.entries(classCount).map(([nome, quantidade]) => ({
      nome,
      quantidade,
      percentual: (quantidade / total) * 100
    }));

    const precisamAtencao = filteredAlunos.filter(a => 
      a.classificacao === 'Básico' || a.classificacao === 'Inicial'
    ).length;

    // Calculate average indicators from filtered alunos
    const avgIndicator = (field: string) => {
      const values = filteredAlunos.map(a => (a as any)[field]).filter((v: any) => typeof v === 'number');
      return values.length > 0 ? values.reduce((s: number, v: number) => s + v, 0) / values.length : 0;
    };

    return {
      totalAlunos: total,
      mediaNotaFinal,
      melhorAluno,
      precisamAtencao,
      mediaParticipacaoMentorias: avgIndicator('participacaoMentorias') || data?.visaoEmpresa?.mediaParticipacaoMentorias || 0,
      mediaAtividadesPraticas: avgIndicator('atividadesPraticas') || data?.visaoEmpresa?.mediaAtividadesPraticas || 0,
      mediaEngajamento: avgIndicator('engajamento') || data?.visaoEmpresa?.mediaEngajamento || 0,
      mediaPerformanceCompetencias: avgIndicator('performanceCompetencias') || data?.visaoEmpresa?.mediaPerformanceCompetencias || 0,
      mediaParticipacaoEventos: avgIndicator('participacaoEventos') || data?.visaoEmpresa?.mediaParticipacaoEventos || 0,
      distribuicaoClassificacao,
    };
  }, [filteredAlunos, data?.visaoEmpresa]);

  // Available alunos for the dropdown (filtered by turma)
  const availableAlunos = useMemo(() => {
    if (!data?.alunos) return [];
    if (selectedTurmaId === "todas") return data.alunos;
    return data.alunos.filter(a => String(a.turma) === selectedTurmaId);
  }, [data?.alunos, selectedTurmaId]);

  // Turma names map
  const turmaNames = useMemo(() => {
    const map = new Map<string, string>();
    if (turmas) {
      turmas.forEach(t => {
        map.set(String(t.id), t.name);
      });
    }
    return map;
  }, [turmas]);

  // Unique turma IDs from alunos
  const uniqueTurmaIds = useMemo(() => {
    if (!data?.alunos) return [];
    const ids = new Set<string>();
    data.alunos.forEach(a => {
      if (a.turma) ids.add(String(a.turma));
    });
    return Array.from(ids);
  }, [data?.alunos]);

  const isFiltered = selectedTurmaId !== "todas" || selectedAlunoId !== "todos";

  const clearFilters = () => {
    setSelectedTurmaId("todas");
    setSelectedAlunoId("todos");
  };

  const handleTurmaChange = (value: string) => {
    setSelectedTurmaId(value);
    setSelectedAlunoId("todos"); // Reset aluno when turma changes
  };

  // Radar data
  const radarData = [
    { indicador: 'Mentorias', valor: filteredKPIs.mediaParticipacaoMentorias },
    { indicador: 'Atividades', valor: filteredKPIs.mediaAtividadesPraticas },
    { indicador: 'Engajamento', valor: filteredKPIs.mediaEngajamento },
    { indicador: 'Competências', valor: filteredKPIs.mediaPerformanceCompetencias },
    { indicador: 'Eventos', valor: filteredKPIs.mediaParticipacaoEventos },
  ];

  if (!user?.programId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold mb-2">Empresa Não Vinculada</h2>
              <p className="text-muted-foreground">
                Sua conta ainda não está vinculada a uma empresa. 
                Entre em contato com o administrador para configurar seu acesso.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard {empresaNome}</h1>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                <CardContent><Skeleton className="h-8 w-16" /></CardContent>
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
            <h1 className="text-3xl font-bold tracking-tight">Dashboard {empresaNome}</h1>
            <p className="text-muted-foreground text-red-500">
              {error?.message || "Nenhum dado disponível para esta empresa."}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { porTurma } = data;
  const META_EXCELENCIA = 9.0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard <span className="text-primary">{empresaNome}</span>
          </h1>
          <p className="text-muted-foreground">
            Acompanhe a performance dos alunos da sua empresa
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
              {isFiltered && (
                <Badge variant="secondary" className="ml-2">
                  Filtros ativos
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              {/* Filtro por Turma */}
              <div className="space-y-1.5 min-w-[200px]">
                <label className="text-sm font-medium text-muted-foreground">Turma</label>
                <Select value={selectedTurmaId} onValueChange={handleTurmaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as turmas</SelectItem>
                    {(turmas || []).map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                    {/* Also show turma IDs from alunos that might not be in turmas table */}
                    {uniqueTurmaIds
                      .filter(id => !turmas?.some(t => String(t.id) === id))
                      .map(id => (
                        <SelectItem key={`extra-${id}`} value={id}>
                          Turma {id}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Aluno */}
              <div className="space-y-1.5 min-w-[250px]">
                <label className="text-sm font-medium text-muted-foreground">Aluno</label>
                <Select value={selectedAlunoId} onValueChange={setSelectedAlunoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os alunos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os alunos</SelectItem>
                    {availableAlunos.map(a => (
                      <SelectItem key={a.idUsuario} value={a.idUsuario}>
                        {a.nomeAluno} ({a.notaFinal.toFixed(1)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botão Limpar Filtros */}
              {isFiltered && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-1">
                  <X className="h-4 w-4" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cards de resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredKPIs.totalAlunos}</div>
              <p className="text-xs text-muted-foreground">
                {isFiltered ? "No filtro selecionado" : `Em ${porTurma.length} turmas`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nota Média</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredKPIs.mediaNotaFinal.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">De 0 a 10 pontos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Melhor Nota</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {filteredKPIs.melhorAluno ? filteredKPIs.melhorAluno.notaFinal.toFixed(1) : '0.0'}
                </span>
                <span className="text-sm text-muted-foreground">/ {META_EXCELENCIA.toFixed(1)}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate" title={filteredKPIs.melhorAluno?.nomeAluno}>
                {filteredKPIs.melhorAluno ? filteredKPIs.melhorAluno.nomeAluno : 'Nenhum aluno'}
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
                {filteredKPIs.precisamAtencao}
              </div>
              <p className="text-xs text-muted-foreground">Básico ou Inicial</p>
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
              <div className="text-2xl font-bold">{filteredKPIs.mediaParticipacaoMentorias.toFixed(0)}%</div>
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
              <div className="text-2xl font-bold">{filteredKPIs.mediaAtividadesPraticas.toFixed(0)}%</div>
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
              <div className="text-2xl font-bold">{filteredKPIs.mediaEngajamento.toFixed(0)}%</div>
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
              <div className="text-2xl font-bold">{filteredKPIs.mediaPerformanceCompetencias.toFixed(0)}%</div>
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
              <div className="text-2xl font-bold">{filteredKPIs.mediaParticipacaoEventos.toFixed(0)}%</div>
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
              <CardDescription>
                {isFiltered ? "Alunos filtrados" : "Todos os alunos da empresa"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]" key={`pie-${selectedTurmaId}-${selectedAlunoId}`}>
                {filteredKPIs.distribuicaoClassificacao.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredKPIs.distribuicaoClassificacao}
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
                        {filteredKPIs.distribuicaoClassificacao.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CLASSIFICATION_COLORS[entry.nome] || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Nenhum dado para exibir
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Radar dos Indicadores */}
          <Card>
            <CardHeader>
              <CardTitle>Radar de Indicadores</CardTitle>
              <CardDescription>
                {isFiltered ? "Média dos indicadores filtrados" : "Média dos 5 indicadores da empresa"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]" key={`radar-${selectedTurmaId}-${selectedAlunoId}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="indicador" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name={empresaNome || ''}
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

        {/* Performance por Turma (only when no turma filter) */}
        {selectedTurmaId === "todas" && porTurma.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance por Turma</CardTitle>
              <CardDescription>Nota média e quantidade de alunos por turma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]" key="bar-turma">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={porTurma.map(t => ({
                      nome: turmaNames.get(String(t.identificador)) || t.identificador,
                      nota: Number(t.mediaNotaFinal.toFixed(1)),
                      alunos: t.totalAlunos
                    }))} 
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 10]} />
                    <YAxis dataKey="nome" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="nota" fill="#F5A623" name="Nota Média" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Alunos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Alunos {isFiltered ? "(Filtrados)" : "da Empresa"}
                </CardTitle>
                <CardDescription>
                  {filteredAlunos.length} alunos - Ordenados por nota (maior para menor)
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      Como a Nota Final é Calculada?
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <p className="text-muted-foreground">
                      A nota final de cada aluno é calculada com base em <strong>5 indicadores</strong>, cada um com peso de <strong>20%</strong>:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <span className="font-bold text-blue-600">1.</span>
                        <div>
                          <p className="font-medium">Participação nas Mentorias</p>
                          <p className="text-xs text-muted-foreground">Presente/Ausente nas sessões</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <span className="font-bold text-green-600">2.</span>
                        <div>
                          <p className="font-medium">Atividades Práticas</p>
                          <p className="text-xs text-muted-foreground">Entregue/Não entregue</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                        <span className="font-bold text-yellow-600">3.</span>
                        <div>
                          <p className="font-medium">Engajamento</p>
                          <p className="text-xs text-muted-foreground">Nota 1 a 5 (Evolução/Engajamento)</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <span className="font-bold text-purple-600">4.</span>
                        <div>
                          <p className="font-medium">Performance de Competências</p>
                          <p className="text-xs text-muted-foreground">Notas das competências (aprovado se nota &ge; 7)</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                        <span className="font-bold text-orange-600">5.</span>
                        <div>
                          <p className="font-medium">Participação em Eventos</p>
                          <p className="text-xs text-muted-foreground">Presença em eventos do programa</p>
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <p className="font-medium mb-2">Classificação por Estágio:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-600"></span>
                          <span><strong>Excelência:</strong> 9.0 - 10.0</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                          <span><strong>Avançado:</strong> 7.0 - 8.9</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                          <span><strong>Intermediário:</strong> 5.0 - 6.9</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                          <span><strong>Básico:</strong> 3.0 - 4.9</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500"></span>
                          <span><strong>Inicial:</strong> 0.0 - 2.9</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredAlunos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum aluno encontrado com os filtros selecionados
                </p>
              ) : (
                filteredAlunos
                  .sort((a, b) => b.notaFinal - a.notaFinal)
                  .map((aluno, index) => (
                    <div key={aluno.idUsuario} className="flex items-center justify-between py-3 px-3 border-b last:border-0 hover:bg-muted/50 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-8">
                          {index + 1}º
                        </span>
                        <div>
                          <p className="font-medium">{aluno.nomeAluno}</p>
                          <p className="text-xs text-muted-foreground">
                            Turma: {turmaNames.get(String(aluno.turma)) || aluno.turma || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className={`font-bold ${
                            aluno.notaFinal >= 7 ? 'text-green-600' : 
                            aluno.notaFinal >= 5 ? 'text-yellow-600' : 'text-red-500'
                          }`}>
                            {aluno.notaFinal.toFixed(1)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {aluno.classificacao}
                          </Badge>
                        </div>
                        <Link href={`/dashboard/aluno?id=${aluno.idUsuario}`}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            Ver detalhes
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
