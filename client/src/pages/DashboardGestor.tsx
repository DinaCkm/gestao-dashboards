import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { Users, TrendingUp, Award, Target, Calendar, BookOpen, Zap, HelpCircle, Filter, X, ChevronDown, Building2, Video, GraduationCap, ClipboardCheck, Star, Briefcase, Info } from "lucide-react";
import { InfoTooltip, INDICADORES_INFO } from "@/components/InfoTooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  const [selectedTurmaGroup, setSelectedTurmaGroup] = useState<string>("todas");
  const [selectedTrilha, setSelectedTrilha] = useState<string>("todas");
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

  // Group turmas by turma code (BS1, BS2, BS3) - TURMA = jornada (BS1/BS2/BS3)
  const turmaGroups = useMemo(() => {
    if (!turmas) return [];
    const groupMap = new Map<string, { turmaCode: string; turmaIds: string[]; turmaNames: string[] }>();
    turmas.forEach(t => {
      // Extract turma code [BSx] from name like "[2025] SEBRAE Tocantins - Basic [BS1]"
      const match = t.name.match(/\[(BS\d+)\]/);
      const turmaCode = match ? match[1] : t.name;
      const existing = groupMap.get(turmaCode);
      if (existing) {
        existing.turmaIds.push(String(t.id));
        existing.turmaNames.push(t.name);
      } else {
        groupMap.set(turmaCode, { turmaCode, turmaIds: [String(t.id)], turmaNames: [t.name] });
      }
    });
    return Array.from(groupMap.values()).sort((a, b) => a.turmaCode.localeCompare(b.turmaCode));
  }, [turmas]);

  // Extract available trilhas from turma names
  const availableTrilhas = useMemo(() => {
    if (!turmas) return [];
    const trilhaSet = new Set<string>();
    turmas.forEach(t => {
      // Extract trilha from name like "[2025] SEBRAE Tocantins - Basic [BS1]" -> "Basic"
      // or "[2025] SEBRAE Tocantins - Visão de Futuro [BS2]" -> "Visão de Futuro"
      const match = t.name.match(/- (.+?) \[BS\d+\]/);
      if (match) trilhaSet.add(match[1].trim());
    });
    return Array.from(trilhaSet).sort();
  }, [turmas]);

  // Get turma IDs for the selected group + trilha
  const selectedTurmaIds = useMemo(() => {
    if (selectedTurmaGroup === "todas" && selectedTrilha === "todas") return null;
    let filteredTurmas = turmas || [];
    
    // Filter by turma code (BS1/BS2/BS3)
    if (selectedTurmaGroup !== "todas") {
      filteredTurmas = filteredTurmas.filter(t => {
        const match = t.name.match(/\[(BS\d+)\]/);
        return match && match[1] === selectedTurmaGroup;
      });
    }
    
    // Filter by trilha
    if (selectedTrilha !== "todas") {
      filteredTurmas = filteredTurmas.filter(t => {
        const match = t.name.match(/- (.+?) \[BS\d+\]/);
        return match && match[1].trim() === selectedTrilha;
      });
    }
    
    return filteredTurmas.map(t => String(t.id));
  }, [selectedTurmaGroup, selectedTrilha, turmas, turmaGroups]);

  // Filter alunos by selected turma group
  const filteredAlunos = useMemo(() => {
    if (!data?.alunos) return [];
    let result = [...data.alunos];
    
    if (selectedTurmaIds) {
      result = result.filter(a => selectedTurmaIds.includes(String(a.turma)));
    }
    
    if (selectedAlunoId !== "todos") {
      result = result.filter(a => a.idUsuario === selectedAlunoId);
    }
    
    return result;
  }, [data?.alunos, selectedTurmaIds, selectedAlunoId]);

  // Recalculate KPIs based on filtered alunos using V2 indicators
  const filteredKPIs = useMemo(() => {
    if (filteredAlunos.length === 0) {
      return {
        totalAlunos: 0,
        mediaNotaFinal: 0,
        melhorAluno: null as { nomeAluno: string; notaFinal: number; consolidado?: any } | null,
        precisamAtencao: 0,
        // V2 indicators (averages from consolidado)
        mediaInd1: 0,
        mediaInd2: 0,
        mediaInd3: 0,
        mediaInd4: 0,
        mediaInd5: 0,
        mediaInd6: 0,
        mediaInd7: 0,
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

    // Calculate V2 indicator averages from consolidado of each aluno
    const avgV2 = (field: string) => {
      const values = filteredAlunos
        .map(a => (a.consolidado as any)?.[field])
        .filter((v: any) => typeof v === 'number' && !isNaN(v));
      return values.length > 0 ? values.reduce((s: number, v: number) => s + v, 0) / values.length : 0;
    };

    return {
      totalAlunos: total,
      mediaNotaFinal,
      melhorAluno,
      precisamAtencao,
      mediaInd1: avgV2('ind1_webinars'),
      mediaInd2: avgV2('ind2_avaliacoes'),
      mediaInd3: avgV2('ind3_competencias'),
      mediaInd4: avgV2('ind4_tarefas'),
      mediaInd5: avgV2('ind5_engajamento'),
      mediaInd6: avgV2('ind6_aplicabilidade'),
      mediaInd7: avgV2('ind7_engajamentoFinal'),
      distribuicaoClassificacao,
    };
  }, [filteredAlunos]);

  // Available alunos for the dropdown (filtered by turma group)
  const availableAlunos = useMemo(() => {
    if (!data?.alunos) return [];
    if (!selectedTurmaIds) return data.alunos;
    return data.alunos.filter(a => selectedTurmaIds.includes(String(a.turma)));
  }, [data?.alunos, selectedTurmaIds]);

  // Unique turma IDs from alunos
  const uniqueTurmaIds = useMemo(() => {
    if (!data?.alunos) return [];
    const ids = new Set<string>();
    data.alunos.forEach(a => {
      if (a.turma) ids.add(String(a.turma));
    });
    return Array.from(ids);
  }, [data?.alunos]);

  const isFiltered = selectedTurmaGroup !== "todas" || selectedTrilha !== "todas" || selectedAlunoId !== "todos";

  const clearFilters = () => {
    setSelectedTurmaGroup("todas");
    setSelectedTrilha("todas");
    setSelectedAlunoId("todos");
  };

  const handleTurmaChange = (value: string) => {
    setSelectedTurmaGroup(value);
    setSelectedAlunoId("todos");
  };

  const handleTrilhaChange = (value: string) => {
    setSelectedTrilha(value);
    setSelectedAlunoId("todos");
  };

  // Radar data V2 - same 5 axes as DashboardAluno
  const radarData = [
    { indicador: 'Webinars', valor: filteredKPIs.mediaInd1 },
    { indicador: 'Avaliações', valor: filteredKPIs.mediaInd2 },
    { indicador: 'Competências', valor: filteredKPIs.mediaInd3 },
    { indicador: 'Tarefas', valor: filteredKPIs.mediaInd4 },
    { indicador: 'Engajamento', valor: filteredKPIs.mediaInd5 },
  ];

  const META_EXCELENCIA = 9.0;

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
                <Select value={selectedTurmaGroup} onValueChange={handleTurmaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as turmas</SelectItem>
                    {turmaGroups.map(g => (
                      <SelectItem key={g.turmaCode} value={g.turmaCode}>
                        {g.turmaCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Trilha */}
              <div className="space-y-1.5 min-w-[200px]">
                <label className="text-sm font-medium text-muted-foreground">Trilha</label>
                <Select value={selectedTrilha} onValueChange={handleTrilhaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as trilhas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as trilhas</SelectItem>
                    {availableTrilhas.map(trilha => (
                      <SelectItem key={trilha} value={trilha}>
                        {trilha}
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
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                Total de Alunos
                <InfoTooltip text="Quantidade total de alunos cadastrados na empresa, considerando o filtro de turma selecionado." />
              </CardTitle>
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
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                Nota Média
                <InfoTooltip text="Média do Engajamento Final (Ind. 7) de todos os alunos filtrados. Calculado como a média dos 5 indicadores (Webinars + Avaliações + Competências + Tarefas + Engajamento) / 5." />
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredKPIs.mediaNotaFinal.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">De 0 a 10 pontos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                Melhor Nota
                <InfoTooltip text="Aluno com maior Engajamento Final (nota de 0 a 10) entre os alunos filtrados. Baseado na média consolidada dos ciclos finalizados." />
              </CardTitle>
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


        </div>

        {/* Engajamento Final Consolidado - Card principal V2 */}
        <Card className="border-2 border-[#0A1E3E]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-[#0A1E3E] flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    Engajamento Final (Média da Empresa)
                    <InfoTooltip text={INDICADORES_INFO.ind7.explicacao + " Fórmula: " + INDICADORES_INFO.ind7.formula} />
                  </p>
                  <p className="text-3xl font-bold text-[#0A1E3E]">{filteredKPIs.mediaInd7.toFixed(0)}%</p>
                </div>
              </div>
            </div>
            <Progress value={filteredKPIs.mediaInd7} className="h-3" />
            <p className="text-xs text-gray-400 mt-2">
              {isFiltered ? "Média dos alunos filtrados" : "Média de todos os alunos da empresa"} — Apenas ciclos finalizados
            </p>
            
            {/* Mini resumo dos 5 indicadores V2 + bônus case — idêntico ao DashboardAluno */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
              <div className="text-center p-2 bg-blue-50 rounded">
                <p className="text-lg font-bold text-blue-700">{filteredKPIs.mediaInd1.toFixed(0)}%</p>
                <p className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5">
                  Webinars <InfoTooltip text={INDICADORES_INFO.ind1.explicacao + " | Fórmula: " + INDICADORES_INFO.ind1.formula} />
                </p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded">
                <p className="text-lg font-bold text-red-700">{filteredKPIs.mediaInd2.toFixed(0)}%</p>
                <p className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5">
                  Avaliações <InfoTooltip text={INDICADORES_INFO.ind2.explicacao + " | Fórmula: " + INDICADORES_INFO.ind2.formula} />
                </p>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <p className="text-lg font-bold text-purple-700">{filteredKPIs.mediaInd3.toFixed(0)}%</p>
                <p className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5">
                  Competências <InfoTooltip text={INDICADORES_INFO.ind3.explicacao + " | Fórmula: " + INDICADORES_INFO.ind3.formula} />
                </p>
              </div>
              <div className="text-center p-2 bg-emerald-50 rounded">
                <p className="text-lg font-bold text-emerald-700">{filteredKPIs.mediaInd4.toFixed(0)}%</p>
                <p className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5">
                  Tarefas <InfoTooltip text={INDICADORES_INFO.ind4.explicacao + " | Fórmula: " + INDICADORES_INFO.ind4.formula} />
                </p>
              </div>
              <div className="text-center p-2 bg-amber-50 rounded">
                <p className="text-lg font-bold text-amber-700">{filteredKPIs.mediaInd5.toFixed(0)}%</p>
                <p className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5">
                  Engajamento <InfoTooltip text={INDICADORES_INFO.ind5.explicacao + " | Fórmula: " + INDICADORES_INFO.ind5.formula} />
                </p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <p className="text-lg font-bold text-green-700">{filteredKPIs.mediaInd6.toFixed(0)}%</p>
                <p className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5">
                  Case <InfoTooltip text={INDICADORES_INFO.ind6.explicacao} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Engajamento Final por Turma */}
        {selectedTurmaGroup === "todas" && selectedTrilha === "todas" && porTurma.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Engajamento por Turma
              <InfoTooltip text="Engajamento Final de cada turma individualmente, com os mesmos indicadores do card geral acima." />
            </h2>
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {porTurma.map((turma) => {
                const turmaNome = turmaNames.get(String(turma.identificador)) || turma.identificador;
                // Extract turma code (BS1/BS2/BS3) and trilha from the full name
                const bsMatch = turmaNome.match(/\[(BS\d+)\]/);
                const turmaCode = bsMatch ? bsMatch[1] : '';
                const trilhaMatch = turmaNome.match(/- (.+?) \[BS\d+\]/);
                const trilhaNome = trilhaMatch ? trilhaMatch[1].trim() : turmaNome;
                return (
                  <Card key={turma.identificador} className="border border-gray-200">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-[#0A1E3E]/10 flex items-center justify-center">
                          <Target className="h-5 w-5 text-[#0A1E3E]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0A1E3E]">{turmaCode}</p>
                          <p className="text-xs text-gray-500">{trilhaNome}</p>
                          <p className="text-2xl font-bold text-[#0A1E3E]">{turma.mediaInd7.toFixed(0)}%</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {turma.totalAlunos} alunos
                        </Badge>
                      </div>
                      <Progress value={turma.mediaInd7} className="h-2 mb-3" />
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-1">
                        <div className="text-center p-1 bg-blue-50 rounded">
                          <p className="text-sm font-bold text-blue-700">{turma.mediaInd1.toFixed(0)}%</p>
                          <p className="text-[9px] text-gray-500">Webinars</p>
                        </div>
                        <div className="text-center p-1 bg-red-50 rounded">
                          <p className="text-sm font-bold text-red-700">{turma.mediaInd2.toFixed(0)}%</p>
                          <p className="text-[9px] text-gray-500">Avaliações</p>
                        </div>
                        <div className="text-center p-1 bg-purple-50 rounded">
                          <p className="text-sm font-bold text-purple-700">{turma.mediaInd3.toFixed(0)}%</p>
                          <p className="text-[9px] text-gray-500">Competências</p>
                        </div>
                        <div className="text-center p-1 bg-emerald-50 rounded">
                          <p className="text-sm font-bold text-emerald-700">{turma.mediaInd4.toFixed(0)}%</p>
                          <p className="text-[9px] text-gray-500">Tarefas</p>
                        </div>
                        <div className="text-center p-1 bg-amber-50 rounded">
                          <p className="text-sm font-bold text-amber-700">{turma.mediaInd5.toFixed(0)}%</p>
                          <p className="text-[9px] text-gray-500">Engajamento</p>
                        </div>
                        <div className="text-center p-1 bg-green-50 rounded">
                          <p className="text-sm font-bold text-green-700">{turma.mediaInd6.toFixed(0)}%</p>
                          <p className="text-[9px] text-gray-500">Case</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-1">
          {/* Radar dos Indicadores V2 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1">
                Radar de Performance
                <InfoTooltip text="Gráfico radar com os 5 indicadores V2: Webinars (Ind.1), Avaliações (Ind.2), Competências (Ind.3), Tarefas (Ind.4) e Engajamento (Ind.5). Mostra a média dos alunos filtrados. Quanto mais próximo de 100% em todos os eixos, melhor a performance." />
              </CardTitle>
              <CardDescription>
                {isFiltered ? "Média dos indicadores filtrados" : "Média dos 5 indicadores V2 da empresa"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]" key={`radar-${selectedTurmaGroup}-${selectedAlunoId}`}>
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
                    <RechartsTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance por Turma (only when no turma filter) */}
        {selectedTurmaGroup === "todas" && selectedTrilha === "todas" && porTurma.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1">
                Performance por Turma
                <InfoTooltip text="Nota média (Engajamento Final) de cada turma da empresa. Permite comparar o desempenho entre turmas." />
              </CardTitle>
              <CardDescription>Nota média e quantidade de alunos por turma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {porTurma
                  .sort((a, b) => b.mediaNotaFinal - a.mediaNotaFinal)
                  .map(t => {
                    const turmaNome = turmaNames.get(String(t.identificador)) || t.identificador;
                    // Extract BS code and trilha
                    const bsMatch = turmaNome.match(/\[(BS\d+)\]/);
                    const turmaCode = bsMatch ? bsMatch[1] : '';
                    const trilhaMatch = turmaNome.match(/- (.+?) \[BS\d+\]/);
                    const trilhaNome = trilhaMatch ? trilhaMatch[1].trim() : turmaNome;
                    const nota = t.mediaNotaFinal;
                    const cor = nota >= 9 ? 'text-green-600' : nota >= 7 ? 'text-blue-600' : nota >= 5 ? 'text-yellow-600' : 'text-red-500';
                    const bgCor = nota >= 9 ? 'bg-green-500' : nota >= 7 ? 'bg-blue-500' : nota >= 5 ? 'bg-yellow-500' : 'bg-red-500';
                    return (
                      <div key={t.identificador} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm"><span className="font-bold text-[#0A1E3E]">{turmaCode}</span> — {trilhaNome}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant="outline" className="text-xs">{t.totalAlunos} alunos</Badge>
                          <div className="w-24">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full ${bgCor} rounded-full transition-all`} style={{ width: `${(nota / 10) * 100}%` }} />
                            </div>
                          </div>
                          <span className={`font-bold text-lg min-w-[3rem] text-right ${cor}`}>{nota.toFixed(1)}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Alunos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-1">
                  Alunos {isFiltered ? "(Filtrados)" : "da Empresa"}
                  <InfoTooltip text="Lista de alunos ordenados por nota (maior para menor). A nota é o Engajamento Final (Ind. 7), calculado como média dos 5 indicadores dos ciclos finalizados. Clique em 'Ver detalhes' para ver o dashboard individual do aluno." />
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
                      Como os Indicadores V2 são Calculados?
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <p className="text-muted-foreground">
                      O Engajamento Final de cada aluno é calculado com base em <strong>5 indicadores</strong>, cada um com peso igual de <strong>20%</strong>. Apenas <strong>ciclos finalizados</strong> entram no cálculo.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <span className="font-bold text-blue-600">1.</span>
                        <div>
                          <p className="font-medium">{INDICADORES_INFO.ind1.nome}</p>
                          <p className="text-xs text-muted-foreground">{INDICADORES_INFO.ind1.formula}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                        <span className="font-bold text-red-600">2.</span>
                        <div>
                          <p className="font-medium">{INDICADORES_INFO.ind2.nome}</p>
                          <p className="text-xs text-muted-foreground">{INDICADORES_INFO.ind2.formula}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <span className="font-bold text-purple-600">3.</span>
                        <div>
                          <p className="font-medium">{INDICADORES_INFO.ind3.nome}</p>
                          <p className="text-xs text-muted-foreground">{INDICADORES_INFO.ind3.formula}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                        <span className="font-bold text-emerald-600">4.</span>
                        <div>
                          <p className="font-medium">{INDICADORES_INFO.ind4.nome}</p>
                          <p className="text-xs text-muted-foreground">{INDICADORES_INFO.ind4.formula}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                        <span className="font-bold text-amber-600">5.</span>
                        <div>
                          <p className="font-medium">{INDICADORES_INFO.ind5.nome}</p>
                          <p className="text-xs text-muted-foreground">{INDICADORES_INFO.ind5.formula}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <p className="font-medium text-green-700">Bônus: {INDICADORES_INFO.ind6.nome}</p>
                      <p className="text-xs text-muted-foreground">{INDICADORES_INFO.ind6.explicacao}</p>
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
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {(() => {
                              const fullName = turmaNames.get(String(aluno.turma)) || aluno.turma || 'N/A';
                              const bsM = fullName.match?.(/\[(BS\d+)\]/);
                              const trM = fullName.match?.(/- (.+?) \[BS\d+\]/);
                              const bs = bsM ? bsM[1] : '';
                              const tr = trM ? trM[1].trim() : '';
                              return <span>Turma: {bs}{tr ? ` | Trilha: ${tr}` : ''}</span>;
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        {/* Mini indicadores V2 inline */}
                        <div className="hidden lg:flex items-center gap-1">
                          {aluno.consolidado && (
                            <>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700" title="Webinars">
                                W:{(aluno.consolidado.ind1_webinars ?? 0).toFixed(0)}%
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700" title="Avaliações">
                                A:{(aluno.consolidado.ind2_avaliacoes ?? 0).toFixed(0)}%
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700" title="Competências">
                                C:{(aluno.consolidado.ind3_competencias ?? 0).toFixed(0)}%
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700" title="Tarefas">
                                T:{(aluno.consolidado.ind4_tarefas ?? 0).toFixed(0)}%
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700" title="Engajamento">
                                E:{(aluno.consolidado.ind5_engajamento ?? 0).toFixed(0)}%
                              </span>
                            </>
                          )}
                        </div>
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
                        <Link href={`/dashboard/aluno?id=${aluno.alunoDbId || aluno.idUsuario}`}>
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
