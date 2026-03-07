import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  Flag, Target, CheckCircle2, XCircle, TrendingUp, Users, Search, ArrowLeft, 
  ChevronDown, ChevronRight, Clock, AlertCircle, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";

const COLORS_PIE = ['#2E7D32', '#F5A623', '#D32F2F'];
const STATUS_LABELS: Record<string, string> = {
  cumprida: 'Cumprida',
  nao_cumprida: 'Não Cumprida',
  parcial: 'Em Andamento'
};

// ============ VISÃO INDIVIDUAL DO ALUNO ============
function VisaoIndividualAluno({ 
  alunoId, 
  alunoNome, 
  onVoltar 
}: { 
  alunoId: number; 
  alunoNome: string; 
  onVoltar: () => void;
}) {
  const [expandedComp, setExpandedComp] = useState<number | null>(null);
  const [expandedMeta, setExpandedMeta] = useState<number | null>(null);

  const { data: metasDetalhadas, isLoading: loadingMetas } = trpc.metas.listar.useQuery({ alunoId });
  const { data: resumo, isLoading: loadingResumo } = trpc.metas.resumo.useQuery({ alunoId });

  if (loadingMetas || loadingResumo) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const total = resumo?.total || 0;
  const cumpridas = resumo?.cumpridas || 0;
  const percentual = resumo?.percentual || 0;
  const naoCumpridas = total - cumpridas - (resumo?.porCompetencia?.reduce((acc, c) => acc + (c.total - c.cumpridas), 0) || 0);

  // Agrupar metas por competência
  const competenciasMap = new Map<string, { competenciaNome: string; metas: any[] }>();
  if (metasDetalhadas) {
    for (const meta of metasDetalhadas) {
      const nome = meta.competenciaNome || 'Sem competência';
      if (!competenciasMap.has(nome)) {
        competenciasMap.set(nome, { competenciaNome: nome, metas: [] });
      }
      competenciasMap.get(nome)!.metas.push(meta);
    }
  }
  const competencias = Array.from(competenciasMap.values());

  // Dados para gráfico de barras por competência
  const chartData = resumo?.porCompetencia?.map(c => {
    const comp = competencias.find(cc => cc.metas.some(m => m.assessmentCompetenciaId === c.assessmentCompetenciaId));
    return {
      nome: comp?.competenciaNome || `Comp. ${c.competenciaId}`,
      'Cumpridas': c.cumpridas,
      'Pendentes': c.total - c.cumpridas,
      percentual: c.percentual
    };
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onVoltar} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{alunoNome}</h2>
          <p className="text-muted-foreground text-sm">Detalhes das metas de desenvolvimento</p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Flag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-sm text-muted-foreground">Total de Metas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{cumpridas}</p>
                <p className="text-sm text-muted-foreground">Cumpridas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{total - cumpridas}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{percentual}%</p>
                </div>
                <p className="text-sm text-muted-foreground">Atingimento</p>
                <Progress value={percentual} className="h-1.5 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico por competência */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução por Competência</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 60)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="nome" width={150} tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Bar dataKey="Cumpridas" stackId="a" fill="#2E7D32" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pendentes" stackId="a" fill="#E0E0E0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Lista de competências com metas */}
      {total === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Flag className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhuma meta definida para este aluno</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Metas por Competência</h3>
          {competencias.map((comp, idx) => {
            const isExpanded = expandedComp === idx;
            const metasCumpridas = comp.metas.filter(m => m.ultimoStatus === 'cumprida').length;
            const pct = comp.metas.length > 0 ? Math.round((metasCumpridas / comp.metas.length) * 100) : 0;
            
            return (
              <Card key={idx} className="overflow-hidden">
                <button
                  className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedComp(isExpanded ? null : idx)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <div>
                      <p className="font-medium">{comp.competenciaNome}</p>
                      <p className="text-sm text-muted-foreground">
                        {comp.metas.length} meta{comp.metas.length !== 1 ? 's' : ''} — {metasCumpridas} cumprida{metasCumpridas !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={pct === 100 ? "default" : pct > 0 ? "secondary" : "outline"}>
                      {pct}%
                    </Badge>
                    <Progress value={pct} className="w-20 h-2" />
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t px-6 py-3 space-y-2 bg-muted/20">
                    {comp.metas.map((meta: any) => {
                      const isMetaExpanded = expandedMeta === meta.id;
                      return (
                        <div key={meta.id} className="border rounded-lg bg-background">
                          <button
                            className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                            onClick={() => setExpandedMeta(isMetaExpanded ? null : meta.id)}
                          >
                            <div className="flex items-center gap-2">
                              {meta.ultimoStatus === 'cumprida' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              ) : meta.ultimoStatus === 'nao_cumprida' ? (
                                <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                              ) : (
                                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                              )}
                              <span className="text-sm font-medium">{meta.titulo}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {STATUS_LABELS[meta.ultimoStatus] || 'Pendente'}
                            </Badge>
                          </button>
                          {isMetaExpanded && meta.acompanhamentos && meta.acompanhamentos.length > 0 && (
                            <div className="border-t px-4 py-3 bg-muted/10">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Histórico de Acompanhamento</p>
                              <div className="space-y-1.5">
                                {meta.acompanhamentos.map((acomp: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground w-20">
                                      {String(acomp.mes).padStart(2, '0')}/{acomp.ano}
                                    </span>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        acomp.status === 'cumprida' ? 'border-green-300 text-green-700 bg-green-50' :
                                        acomp.status === 'nao_cumprida' ? 'border-red-300 text-red-700 bg-red-50' :
                                        'border-amber-300 text-amber-700 bg-amber-50'
                                      }`}
                                    >
                                      {STATUS_LABELS[acomp.status] || acomp.status}
                                    </Badge>
                                    {acomp.observacao && (
                                      <span className="text-muted-foreground truncate max-w-[300px]">{acomp.observacao}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ PÁGINA PRINCIPAL ============
export default function MetasGestor() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlunoId, setSelectedAlunoId] = useState<number | null>(null);
  const [selectedAlunoNome, setSelectedAlunoNome] = useState<string>("");

  // Buscar resumo de metas de todos os alunos
  const { data: metasResumo, isLoading, isError } = trpc.metas.resumoTodos.useQuery();

  // Buscar lista de alunos da empresa do gestor
  const { data: alunosList } = trpc.alunos.list.useQuery(
    { programId: user?.programId || 0 },
    { enabled: !!user?.programId }
  );

  // Filtrar pelo programa do gestor e pelo termo de busca
  const alunosFiltrados = useMemo(() => {
    if (!metasResumo) return [];
    let filtered = metasResumo;
    
    // Filtrar pelo programa do gestor (se não for admin)
    if (user?.programId && user?.role !== 'admin') {
      filtered = filtered.filter(a => a.programId === user.programId);
    }
    
    // Filtrar pelo termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.alunoNome.toLowerCase().includes(term) || 
        a.alunoEmail.toLowerCase().includes(term)
      );
    }
    
    return filtered.sort((a, b) => a.alunoNome.localeCompare(b.alunoNome));
  }, [metasResumo, user?.programId, user?.role, searchTerm]);

  // Totais consolidados
  const consolidado = useMemo(() => {
    if (!alunosFiltrados.length) return { totalAlunos: 0, totalMetas: 0, cumpridas: 0, naoCumpridas: 0, emAndamento: 0, percentual: 0 };
    const totalMetas = alunosFiltrados.reduce((s, a) => s + a.totalMetas, 0);
    const cumpridas = alunosFiltrados.reduce((s, a) => s + a.metasCumpridas, 0);
    const naoCumpridas = alunosFiltrados.reduce((s, a) => s + a.metasNaoCumpridas, 0);
    const emAndamento = alunosFiltrados.reduce((s, a) => s + a.metasEmAndamento, 0);
    return {
      totalAlunos: alunosFiltrados.length,
      totalMetas,
      cumpridas,
      naoCumpridas,
      emAndamento,
      percentual: totalMetas > 0 ? Math.round((cumpridas / totalMetas) * 100) : 0
    };
  }, [alunosFiltrados]);

  // Dados para gráfico de pizza
  const pieData = useMemo(() => {
    if (!consolidado.totalMetas) return [];
    return [
      { name: 'Cumpridas', value: consolidado.cumpridas },
      { name: 'Em Andamento', value: consolidado.emAndamento },
      { name: 'Não Cumpridas', value: consolidado.naoCumpridas },
    ].filter(d => d.value > 0);
  }, [consolidado]);

  // Dados para gráfico de barras (top alunos por atingimento)
  const barData = useMemo(() => {
    return alunosFiltrados
      .filter(a => a.totalMetas > 0)
      .sort((a, b) => b.percentual - a.percentual)
      .slice(0, 15)
      .map(a => ({
        nome: a.alunoNome.split(' ').slice(0, 2).join(' '),
        '% Atingimento': a.percentual,
        totalMetas: a.totalMetas
      }));
  }, [alunosFiltrados]);

  // Alunos da empresa que ainda não têm metas (para mostrar na lista)
  const alunosSemMetas = useMemo(() => {
    if (!alunosList) return [];
    const alunosComMetas = new Set(alunosFiltrados.map(a => a.alunoId));
    return alunosList
      .filter(a => !alunosComMetas.has(a.id))
      .filter(a => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return a.name.toLowerCase().includes(term) || (a.email || '').toLowerCase().includes(term);
      });
  }, [alunosList, alunosFiltrados, searchTerm]);

  // Se um aluno está selecionado, mostrar visão individual
  if (selectedAlunoId) {
    return (
      <DashboardLayout>
        <VisaoIndividualAluno 
          alunoId={selectedAlunoId} 
          alunoNome={selectedAlunoNome}
          onVoltar={() => { setSelectedAlunoId(null); setSelectedAlunoNome(""); }}
        />
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-80" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-3" />
            <p className="text-muted-foreground">Erro ao carregar dados de metas. Tente novamente mais tarde.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Flag className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Metas de Desenvolvimento</h1>
          </div>
          <p className="text-muted-foreground">
            Visão consolidada do progresso de metas de todos os alunos
          </p>
        </div>

        {/* Cards de resumo consolidado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{consolidado.totalAlunos}</p>
                  <p className="text-xs text-muted-foreground">Alunos com Metas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50">
                  <Flag className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{consolidado.totalMetas}</p>
                  <p className="text-xs text-muted-foreground">Total de Metas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{consolidado.cumpridas}</p>
                  <p className="text-xs text-muted-foreground">Cumpridas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-50">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{consolidado.naoCumpridas}</p>
                  <p className="text-xs text-muted-foreground">Não Cumpridas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{consolidado.percentual}%</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Atingimento Geral</p>
                  <Progress value={consolidado.percentual} className="h-1.5 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        {consolidado.totalMetas > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de pizza - distribuição de status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição de Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de barras - atingimento por aluno */}
            {barData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Atingimento por Aluno</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="nome" width={100} tick={{ fontSize: 11 }} />
                      <RechartsTooltip formatter={(value: number) => [`${value}%`, 'Atingimento']} />
                      <Bar dataKey="% Atingimento" fill="#1E3A5F" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Busca */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabela de alunos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Alunos ({alunosFiltrados.length + alunosSemMetas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alunosFiltrados.length === 0 && alunosSemMetas.length === 0 ? (
              <div className="py-8 text-center">
                <Flag className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhum aluno encontrado para esta busca' : 'Nenhum aluno com metas definidas'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Header da tabela */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                  <div className="col-span-4">Aluno</div>
                  <div className="col-span-1 text-center">Metas</div>
                  <div className="col-span-1 text-center">Cumpridas</div>
                  <div className="col-span-1 text-center">Pendentes</div>
                  <div className="col-span-3 text-center">Atingimento</div>
                  <div className="col-span-2 text-center">Ação</div>
                </div>

                {/* Alunos com metas */}
                {alunosFiltrados.map((aluno) => (
                  <div 
                    key={aluno.alunoId} 
                    className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/50 rounded-lg transition-colors border-b last:border-0"
                  >
                    <div className="col-span-4">
                      <p className="font-medium text-sm">{aluno.alunoNome}</p>
                      <p className="text-xs text-muted-foreground">{aluno.alunoEmail}</p>
                    </div>
                    <div className="col-span-1 text-center">
                      <Badge variant="outline">{aluno.totalMetas}</Badge>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="text-sm font-medium text-green-600">{aluno.metasCumpridas}</span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="text-sm font-medium text-red-500">{aluno.totalMetas - aluno.metasCumpridas}</span>
                    </div>
                    <div className="col-span-3 flex items-center gap-2 justify-center">
                      <Progress value={aluno.percentual} className="h-2 flex-1 max-w-[120px]" />
                      <span className={`text-sm font-bold min-w-[40px] text-right ${
                        aluno.percentual >= 75 ? 'text-green-600' :
                        aluno.percentual >= 50 ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {aluno.percentual}%
                      </span>
                    </div>
                    <div className="col-span-2 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-1 text-xs"
                        onClick={() => {
                          setSelectedAlunoId(aluno.alunoId);
                          setSelectedAlunoNome(aluno.alunoNome);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver detalhes
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Alunos sem metas */}
                {alunosSemMetas.map((aluno) => (
                  <div 
                    key={`sem-${aluno.id}`} 
                    className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/50 rounded-lg transition-colors border-b last:border-0 opacity-60"
                  >
                    <div className="col-span-4">
                      <p className="font-medium text-sm">{aluno.name}</p>
                      <p className="text-xs text-muted-foreground">{aluno.email}</p>
                    </div>
                    <div className="col-span-1 text-center">
                      <Badge variant="outline" className="text-muted-foreground">0</Badge>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="text-sm text-muted-foreground">-</span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="text-sm text-muted-foreground">-</span>
                    </div>
                    <div className="col-span-3 flex items-center gap-2 justify-center">
                      <span className="text-xs text-muted-foreground italic">Sem metas definidas</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-xs text-muted-foreground">-</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
