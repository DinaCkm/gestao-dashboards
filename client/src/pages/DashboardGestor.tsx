import DashboardLayout from "@/components/DashboardLayout";
import { formatDateCustomSafe } from "@/lib/dateUtils";
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
import { useState, useMemo, useCallback } from "react";
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

  // Extract available trilhas from alunos' real trilhas (via assessment_pdi)
  // Falls back to turma name extraction if trilhasReais not available
  const availableTrilhas = useMemo(() => {
    const trilhaSet = new Set<string>();
    
    // First: extract from alunos' trilhasReais (real trilhas from assessment_pdi)
    if (data?.alunos) {
      // If turma filter is active, only show trilhas of alunos in that turma
      let alunosParaTrilhas = data.alunos;
      if (selectedTurmaGroup !== "todas" && turmas) {
        const turmaIdsDoGrupo = turmas
          .filter(t => {
            const match = t.name.match(/\[(BS\d+)\]/);
            return match && match[1] === selectedTurmaGroup;
          })
          .map(t => String(t.id));
        alunosParaTrilhas = data.alunos.filter((a: any) => turmaIdsDoGrupo.includes(String(a.turma)));
      }
      
      alunosParaTrilhas.forEach((a: any) => {
        if (a.trilhasReais && Array.isArray(a.trilhasReais)) {
          a.trilhasReais.forEach((t: string) => trilhaSet.add(t));
        } else if (a.trilhaNome && a.trilhaNome !== 'Não definida') {
          trilhaSet.add(a.trilhaNome);
        }
      });
    }
    
    // Fallback: extract from turma names if no trilhas found from alunos
    if (trilhaSet.size === 0 && turmas) {
      turmas.forEach(t => {
        const match = t.name.match(/- (.+?) \[BS\d+\]/);
        if (match) trilhaSet.add(match[1].trim());
      });
    }
    
    return Array.from(trilhaSet).sort();
  }, [data?.alunos, turmas, selectedTurmaGroup]);

  // Get turma IDs for the selected turma group (BS1/BS2/BS3)
  const selectedTurmaIdsFromGroup = useMemo(() => {
    if (selectedTurmaGroup === "todas") return null;
    const filteredTurmas = (turmas || []).filter(t => {
      const match = t.name.match(/\[(BS\d+)\]/);
      return match && match[1] === selectedTurmaGroup;
    });
    return filteredTurmas.map(t => String(t.id));
  }, [selectedTurmaGroup, turmas]);

  // Filter alunos by selected turma group AND trilha
  const filteredAlunos = useMemo(() => {
    if (!data?.alunos) return [];
    let result = [...data.alunos];
    
    // Filter by turma group (BS1/BS2/BS3)
    if (selectedTurmaIdsFromGroup) {
      result = result.filter(a => selectedTurmaIdsFromGroup.includes(String(a.turma)));
    }
    
    // Filter by trilha (using trilhasReais from assessment_pdi)
    if (selectedTrilha !== "todas") {
      result = result.filter((a: any) => {
        if (a.trilhasReais && Array.isArray(a.trilhasReais)) {
          return a.trilhasReais.includes(selectedTrilha);
        }
        return a.trilhaNome === selectedTrilha;
      });
    }
    
    if (selectedAlunoId !== "todos") {
      result = result.filter(a => a.idUsuario === selectedAlunoId);
    }
    
    return result;
  }, [data?.alunos, selectedTurmaIdsFromGroup, selectedTrilha, selectedAlunoId]);

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

  // Available alunos for the dropdown (filtered by turma group + trilha)
  const availableAlunos = useMemo(() => {
    if (!data?.alunos) return [];
    let result = [...data.alunos];
    if (selectedTurmaIdsFromGroup) {
      result = result.filter(a => selectedTurmaIdsFromGroup.includes(String(a.turma)));
    }
    if (selectedTrilha !== "todas") {
      result = result.filter((a: any) => {
        if (a.trilhasReais && Array.isArray(a.trilhasReais)) {
          return a.trilhasReais.includes(selectedTrilha);
        }
        return a.trilhaNome === selectedTrilha;
      });
    }
    return result;
  }, [data?.alunos, selectedTurmaIdsFromGroup, selectedTrilha]);

  // Unique turma IDs from alunos
  const uniqueTurmaIds = useMemo(() => {
    if (!data?.alunos) return [];
    const ids = new Set<string>();
    data.alunos.forEach(a => {
      if (a.turma) ids.add(String(a.turma));
    });
    return Array.from(ids);
  }, [data?.alunos]);

  // Get jornadas/ciclos por turma
  const { data: jornadasPorTurma } = trpc.jornada.porTurma.useQuery(
    { empresa: empresaNome || '' },
    { enabled: !!empresaNome }
  );

  // State for expanded jornada cards
  const [expandedJornadas, setExpandedJornadas] = useState<Set<number>>(new Set());
  const toggleJornada = useCallback((turmaId: number) => {
    setExpandedJornadas(prev => {
      const next = new Set(prev);
      if (next.has(turmaId)) next.delete(turmaId);
      else next.add(turmaId);
      return next;
    });
  }, []);

  const isFiltered = selectedTurmaGroup !== "todas" || selectedTrilha !== "todas" || selectedAlunoId !== "todos";

  const clearFilters = () => {
    setSelectedTurmaGroup("todas");
    setSelectedTrilha("todas");
    setSelectedAlunoId("todos");
  };

  const handleTurmaChange = (value: string) => {
    setSelectedTurmaGroup(value);
    setSelectedTrilha("todas"); // Reset trilha when turma changes since available trilhas depend on turma
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

        {/* Trilhas e Ciclos de Execução */}
        {jornadasPorTurma && jornadasPorTurma.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Trilhas e Ciclos de Execução
                <InfoTooltip text="Visão das jornadas de cada turma com as competências (micro ciclos) e suas datas de início e fim." />
              </CardTitle>
              <CardDescription>
                Macro e micro jornadas por turma com datas de execução
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Gráfico de Timeline de Execução */}
              {(() => {
                // Calcular range global de datas
                const allDates: Date[] = [];
                jornadasPorTurma.forEach(j => {
                  j.microCiclos.forEach(m => {
                    if (m.microInicio) allDates.push(new Date(m.microInicio));
                    if (m.microTermino) allDates.push(new Date(m.microTermino));
                  });
                });
                if (allDates.length < 2) return null;
                const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
                const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
                const totalMs = maxDate.getTime() - minDate.getTime();
                if (totalMs <= 0) return null;
                const today = new Date();
                const todayPct = Math.max(0, Math.min(100, ((today.getTime() - minDate.getTime()) / totalMs) * 100));
                const fmtShort = (d: Date) => formatDateCustomSafe(d, { month: 'short', year: '2-digit' });

                // Cores para turmas
                const turmaColors = ['#1E3A5F', '#F5A623', '#2E7D32', '#D32F2F', '#7B1FA2', '#00838F'];

                return (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-muted-foreground">Timeline de Execução</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{fmtShort(minDate)}</span>
                        <span>→</span>
                        <span>{fmtShort(maxDate)}</span>
                      </div>
                    </div>
                    <div className="relative bg-muted/20 rounded-lg p-4 overflow-x-auto">
                      {/* Header com meses */}
                      <div className="relative h-6 mb-2 border-b border-muted">
                        {(() => {
                          const months: { label: string; pct: number }[] = [];
                          const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
                          while (cur <= maxDate) {
                            const pct = ((cur.getTime() - minDate.getTime()) / totalMs) * 100;
                            if (pct >= 0 && pct <= 100) {
                              months.push({ label: formatDateCustomSafe(cur, { month: 'short' }), pct });
                            }
                            cur.setMonth(cur.getMonth() + 1);
                          }
                          return months.map((m, i) => (
                            <span key={i} className="absolute text-[10px] text-muted-foreground -translate-x-1/2" style={{ left: `${m.pct}%` }}>
                              {m.label}
                            </span>
                          ));
                        })()}
                      </div>
                      {/* Barras por turma */}
                      <div className="space-y-3">
                        {jornadasPorTurma.map((jornada, jIdx) => {
                          const bsM = jornada.turmaNome.match(/\[(BS\d+)\]/);
                          const label = bsM ? `${bsM[1]} — ${jornada.trilhaNome}` : jornada.trilhaNome;
                          const color = turmaColors[jIdx % turmaColors.length];
                          // Calcular barra macro
                          const macroStart = jornada.macroInicio ? ((new Date(jornada.macroInicio).getTime() - minDate.getTime()) / totalMs) * 100 : 0;
                          const macroEnd = jornada.macroTermino ? ((new Date(jornada.macroTermino).getTime() - minDate.getTime()) / totalMs) * 100 : 100;
                          const macroWidth = Math.max(1, macroEnd - macroStart);
                          const fmtD = (d: string | Date | null) => {
                            if (!d) return '—';
                            return formatDateCustomSafe(d, { day: '2-digit', month: '2-digit', year: 'numeric' });
                          };
                          return (
                            <div key={jornada.turmaId} className="flex items-center gap-3">
                              <div className="w-32 md:w-40 shrink-0 text-xs font-medium truncate" title={label}>{label}</div>
                              <div className="flex-1 relative h-6 bg-muted/30 rounded">
                                <div
                                  className="absolute h-full rounded opacity-80"
                                  style={{ left: `${macroStart}%`, width: `${macroWidth}%`, backgroundColor: color }}
                                  title={`${label}: ${fmtD(jornada.macroInicio)} → ${fmtD(jornada.macroTermino)}`}
                                />
                              </div>
                              <div className="w-20 shrink-0 text-[10px] text-muted-foreground text-right">
                                {fmtD(jornada.macroTermino)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Linha do hoje */}
                      <div className="absolute top-0 bottom-0" style={{ left: `${todayPct}%`, width: '2px' }}>
                        <div className="w-0.5 h-full bg-red-500 opacity-70" />
                        <span className="absolute -top-1 left-1 text-[9px] font-bold text-red-500">Hoje</span>
                      </div>
                    </div>
                    {/* Legenda */}
                    <div className="flex flex-wrap gap-3 mt-3">
                      {jornadasPorTurma.map((jornada, jIdx) => {
                        const bsM = jornada.turmaNome.match(/\[(BS\d+)\]/);
                        const label = bsM ? `${bsM[1]} — ${jornada.trilhaNome}` : jornada.trilhaNome;
                        const color = turmaColors[jIdx % turmaColors.length];
                        return (
                          <div key={jornada.turmaId} className="flex items-center gap-1.5 text-xs">
                            <span className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                            <span>{label}</span>
                          </div>
                        );
                      })}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="w-3 h-0.5 bg-red-500" />
                        <span className="text-red-500">Hoje</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-4">
                {jornadasPorTurma.map((jornada) => {
                  const isExpanded = expandedJornadas.has(jornada.turmaId);
                  const bsMatch = jornada.turmaNome.match(/\[(BS\d+)\]/);
                  const turmaCode = bsMatch ? bsMatch[1] : jornada.turmaCode;
                  const formatDate = (d: string | Date | null) => formatDateCustomSafe(d, { day: '2-digit', month: '2-digit', year: 'numeric' });
                  return (
                    <div key={jornada.turmaId} className="border rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleJornada(jornada.turmaId)}
                      >
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{jornada.turmaNome}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-amber-500 text-white text-xs">{jornada.trilhaNome}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {jornada.microCiclos.length} comp. • {jornada.qtdAlunos} aluno(s)
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {jornada.macroInicio && jornada.macroTermino && (
                            <span className="text-xs text-muted-foreground hidden md:block">
                              {formatDate(jornada.macroInicio)} → {formatDate(jornada.macroTermino)}
                            </span>
                          )}
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      {isExpanded && jornada.microCiclos.length > 0 && (
                        <div className="p-4 border-t">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-muted-foreground border-b">
                                <th className="pb-2 font-medium">Competência</th>
                                <th className="pb-2 font-medium text-right">Início</th>
                                <th className="pb-2 font-medium text-right">Fim</th>
                              </tr>
                            </thead>
                            <tbody>
                              {jornada.microCiclos.map((micro, idx) => (
                                <tr key={idx} className="border-b last:border-0">
                                  <td className="py-2">{micro.competencia}</td>
                                  <td className="py-2 text-right text-muted-foreground">{formatDate(micro.microInicio)}</td>
                                  <td className="py-2 text-right text-muted-foreground">{formatDate(micro.microTermino)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
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
